pragma solidity 0.5.8;

import "../proxy/Proxy.sol";
import "../interfaces/IModule.sol";
import "./SecurityTokenStorage.sol";
import "../libraries/TokenLib.sol";
import "../libraries/StatusCodes.sol";
import "../interfaces/IDataStore.sol";
import "../interfaces/IUpgradableTokenFactory.sol";
import "../interfaces/IModuleFactory.sol";
import "../interfaces/token/IERC1410.sol";
import "../interfaces/token/IERC1594.sol";
import "../interfaces/token/IERC1643.sol";
import "../interfaces/token/IERC1644.sol";
import "../interfaces/ITransferManager.sol";
import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

/**
 * @title Security Token contract
 * @notice SecurityToken is an ERC1400 token with added capabilities:
 * @notice - Implements the ERC1400 Interface
 * @notice - Transfers are restricted
 * @notice - Modules can be attached to it to control its behaviour
 * @notice - ST should not be deployed directly, but rather the SecurityTokenRegistry should be used
 * @notice - ST does not inherit from ISecurityToken due to:
 * @notice - https://github.com/ethereum/solidity/issues/4847
 */
contract SecurityToken is ERC20, ReentrancyGuard, SecurityTokenStorage, IERC1594, IERC1643, IERC1644, IERC1410, Proxy {

    using SafeMath for uint256;

    // Emit at the time when module get added
    event ModuleAdded(
        uint8[] _types,
        bytes32 indexed _name,
        address indexed _moduleFactory,
        address _module,
        uint256 _moduleCost,
        uint256 _budget,
        bytes32 _label,
        bool _archived
    );
    // Emit when Module get upgraded from the securityToken
    event ModuleUpgraded(uint8[] _types, address _module);
    // Emit when the token details get updated
    event UpdateTokenDetails(string _oldDetails, string _newDetails);
    // Emit when the token name get updated
    event UpdateTokenName(string _oldName, string _newName);
    // Emit when the granularity get changed
    event GranularityChanged(uint256 _oldGranularity, uint256 _newGranularity);
    // Emit when is permanently frozen by the issuer
    event FreezeIssuance();
    // Emit when transfers are frozen or unfrozen
    event FreezeTransfers(bool _status);
    // Emit when new checkpoint created
    event CheckpointCreated(uint256 indexed _checkpointId, uint256 _investorLength);
    // Events to log controller actions
    event SetController(address indexed _oldController, address indexed _newController);
    //Event emit when the global treasury wallet address get changed
    event TreasuryWalletChanged(address _oldTreasuryWallet, address _newTreasuryWallet);
    event DisableController();
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event TokenUpgraded(uint8 _major, uint8 _minor, uint8 _patch);

    // Emit when Module get archived from the securityToken
    event ModuleArchived(uint8[] _types, address _module); //Event emitted by the tokenLib.
    // Emit when Module get unarchived from the securityToken
    event ModuleUnarchived(uint8[] _types, address _module); //Event emitted by the tokenLib.
    // Emit when Module get removed from the securityToken
    event ModuleRemoved(uint8[] _types, address _module); //Event emitted by the tokenLib.
    // Emit when the budget allocated to a module is changed
    event ModuleBudgetChanged(uint8[] _moduleTypes, address _module, uint256 _oldBudget, uint256 _budget); //Event emitted by the tokenLib.

    // Constructor
    constructor() public {
        initialized = true;
    }

    /**
     * @notice Initialization function
     * @dev Expected to be called atomically with the proxy being created, by the owner of the token
     * @dev Can only be called once
     */
    function initialize(address _getterDelegate) public {
        //Expected to be called atomically with the proxy being created
        require(!initialized, "Already initialized");
        getterDelegate = _getterDelegate;
        securityTokenVersion = SemanticVersion(3, 0, 0);
        updateFromRegistry();
        tokenFactory = msg.sender;
        initialized = true;
    }

    /**
     * @notice Checks if an address is a module of certain type
     * @param _module Address to check
     * @param _type type to check against
     */
    function isModule(address _module, uint8 _type) public view returns(bool) {
        if (modulesToData[_module].module != _module || modulesToData[_module].isArchived)
            return false;
        for (uint256 i = 0; i < modulesToData[_module].moduleTypes.length; i++) {
            if (modulesToData[_module].moduleTypes[i] == _type) {
                return true;
            }
        }
        return false;
    }

    // Require msg.sender to be the specified module type or the owner of the token
    function _onlyModuleOrOwner(uint8 _type) internal view {
        if (msg.sender != owner())
            require(isModule(msg.sender, _type));
    }

    function _isValidPartition(bytes32 _partition) internal pure {
        require(_partition == UNLOCKED, "Invalid partition");
    }

    function _isValidOperator(address _from, address _operator, bytes32 _partition) internal view {
        _isAuthorised(
            allowance(_from, _operator) == uint(-1) || partitionApprovals[_from][_partition][_operator]
        );
    }

    function _zeroAddressCheck(address _entity) internal pure {
        require(_entity != address(0), "Invalid address");
    }

    function _isValidTransfer(bool _isTransfer) internal pure {
        require(_isTransfer, "Transfer Invalid");
    }

    function _isValidRedeem(bool _isRedeem) internal pure {
        require(_isRedeem, "Invalid redeem");
    }

    function _isSignedByOwner(bool _signed) internal pure {
        require(_signed, "Owner did not sign");
    }

    function _isIssuanceAllowed() internal view {
        require(issuance, "Issuance frozen");
    }

    // Function to check whether the msg.sender is authorised or not
    function _onlyController() internal view {
        _isAuthorised(msg.sender == controller && isControllable());
    }

    function _isAuthorised(bool _authorised) internal pure {
        require(_authorised, "Not Authorised");
    }

    /**
     * @dev Throws if called by any account other than the owner.
     * @dev using the internal function instead of modifier to save the code size
     */
    function _onlyOwner() internal view {
        require(isOwner());
    }

    /**
     * @dev Require msg.sender to be the specified module type
     */
    function _onlyModule(uint8 _type) internal view {
        require(isModule(msg.sender, _type));
    }

    modifier checkGranularity(uint256 _value) {
        require(_value % granularity == 0, "Invalid granularity");
        _;
    }

    /**
      * @notice Attachs a module to the SecurityToken
      * @dev  E.G.: On deployment (through the STR) ST gets a TransferManager module attached to it
      * @dev to control restrictions on transfers.
      * @param _moduleFactory is the address of the module factory to be added
      * @param _data is data packed into bytes used to further configure the module (See STO usage)
      * @param _maxCost max amount of POLY willing to pay to the module.
      * @param _budget max amount of ongoing POLY willing to assign to the module.
      * @param _label custom module label.
      */
    function addModuleWithLabel(
        address _moduleFactory,
        bytes memory _data,
        uint256 _maxCost,
        uint256 _budget,
        bytes32 _label,
        bool _archived
    )
        public
        nonReentrant
    {
        _onlyOwner();
        //Check that the module factory exists in the ModuleRegistry - will throw otherwise
        moduleRegistry.useModule(_moduleFactory, false);
        IModuleFactory moduleFactory = IModuleFactory(_moduleFactory);
        uint8[] memory moduleTypes = moduleFactory.getTypes();
        uint256 moduleCost = moduleFactory.setupCostInPoly();
        require(moduleCost <= _maxCost, "Invalid cost");
        //Approve fee for module
        polyToken.approve(_moduleFactory, moduleCost);
        //Creates instance of module from factory
        address module = moduleFactory.deploy(_data);
        require(modulesToData[module].module == address(0), "Module exists");
        //Approve ongoing budget
        polyToken.approve(module, _budget);
        _addModuleData(moduleTypes, _moduleFactory, module, moduleCost, _budget, _label, _archived);
    }

    function _addModuleData(
        uint8[] memory _moduleTypes,
        address _moduleFactory,
        address _module,
        uint256 _moduleCost,
        uint256 _budget,
        bytes32 _label,
        bool _archived
    ) internal {
        bytes32 moduleName = IModuleFactory(_moduleFactory).name();
        uint256[] memory moduleIndexes = new uint256[](_moduleTypes.length);
        uint256 i;
        for (i = 0; i < _moduleTypes.length; i++) {
            moduleIndexes[i] = modules[_moduleTypes[i]].length;
            modules[_moduleTypes[i]].push(_module);
        }
        modulesToData[_module] = ModuleData(
            moduleName,
            _module,
            _moduleFactory,
            _archived,
            _moduleTypes,
            moduleIndexes,
            names[moduleName].length,
            _label
        );
        names[moduleName].push(_module);
        emit ModuleAdded(_moduleTypes, moduleName, _moduleFactory, _module, _moduleCost, _budget, _label, _archived);
    }

    /**
    * @notice addModule function will call addModuleWithLabel() with an empty label for backward compatible
    */
    function addModule(address _moduleFactory, bytes calldata _data, uint256 _maxCost, uint256 _budget, bool _archived) external {
        addModuleWithLabel(_moduleFactory, _data, _maxCost, _budget, "", _archived);
    }

    /**
    * @notice Archives a module attached to the SecurityToken
    * @param _module address of module to archive
    */
    function archiveModule(address _module) external {
        _onlyOwner();
        TokenLib.archiveModule(modulesToData[_module]);
    }

    /**
    * @notice Upgrades a module attached to the SecurityToken
    * @param _module address of module to archive
    */
    function upgradeModule(address _module) external {
        _onlyOwner();
        TokenLib.upgradeModule(moduleRegistry, modulesToData[_module]);
    }

    /**
    * @notice Upgrades security token
    */
    function upgradeToken() external {
        _onlyOwner();
        // 10 is the number of module types to check for incompatibilities before upgrading.
        // The number is hard coded and kept low to keep usage low.
        // We currently have 7 module types. If we ever create more than 3 new module types,
        // We will upgrade the implementation accordinly. We understand the limitations of this approach.
        IUpgradableTokenFactory(tokenFactory).upgradeToken(10);
        emit TokenUpgraded(securityTokenVersion.major, securityTokenVersion.minor, securityTokenVersion.patch);
    }

    /**
    * @notice Unarchives a module attached to the SecurityToken
    * @param _module address of module to unarchive
    */
    function unarchiveModule(address _module) external {
        _onlyOwner();
        TokenLib.unarchiveModule(moduleRegistry, modulesToData[_module]);
    }

    /**
    * @notice Removes a module attached to the SecurityToken
    * @param _module address of module to unarchive
    */
    function removeModule(address _module) external {
        _onlyOwner();
        TokenLib.removeModule(_module, modules, modulesToData, names);
    }

    /**
    * @notice Allows the owner to withdraw unspent POLY stored by them on the ST or any ERC20 token.
    * @dev Owner can transfer POLY to the ST which will be used to pay for modules that require a POLY fee.
    * @param _tokenContract Address of the ERC20Basic compliance token
    * @param _value amount of POLY to withdraw
    */
    function withdrawERC20(address _tokenContract, uint256 _value) external {
        _onlyOwner();
        IERC20 token = IERC20(_tokenContract);
        require(token.transfer(owner(), _value));
    }

    /**
    * @notice allows owner to increase/decrease POLY approval of one of the modules
    * @param _module module address
    * @param _change change in allowance
    * @param _increase true if budget has to be increased, false if decrease
    */
    function changeModuleBudget(address _module, uint256 _change, bool _increase) external {
        _onlyOwner();
        TokenLib.changeModuleBudget(_module, _change, _increase, polyToken, modulesToData);
    }

    /**
     * @notice updates the tokenDetails associated with the token
     * @param _newTokenDetails New token details
     */
    function updateTokenDetails(string calldata _newTokenDetails) external {
        _onlyOwner();
        emit UpdateTokenDetails(tokenDetails, _newTokenDetails);
        tokenDetails = _newTokenDetails;
    }

    /**
    * @notice Allows owner to change token granularity
    * @param _granularity granularity level of the token
    */
    function changeGranularity(uint256 _granularity) external {
        _onlyOwner();
        require(_granularity != 0, "Invalid granularity");
        emit GranularityChanged(granularity, _granularity);
        granularity = _granularity;
    }

    /**
    * @notice Allows owner to change data store
    * @param _dataStore Address of the token data store
    */
    function changeDataStore(address _dataStore) external {
        _onlyOwner();
        _zeroAddressCheck(_dataStore);
        dataStore = IDataStore(_dataStore);
    }

    /**
    * @notice Allows owner to change token name
    * @param _name new name of the token
    */
    function changeName(string calldata _name) external {
        _onlyOwner();
        require(bytes(_name).length > 0);
        emit UpdateTokenName(name, _name);
        name = _name;
    }

    /**
     * @notice Allows to change the treasury wallet address
     * @param _wallet Ethereum address of the treasury wallet
     */
    function changeTreasuryWallet(address _wallet) external {
        _onlyOwner();
        _zeroAddressCheck(_wallet);
        emit TreasuryWalletChanged(dataStore.getAddress(TREASURY), _wallet);
        dataStore.setAddress(TREASURY, _wallet);
    }

    /**
    * @notice Keeps track of the number of non-zero token holders
    * @param _from sender of transfer
    * @param _to receiver of transfer
    * @param _value value of transfer
    */
    function _adjustInvestorCount(address _from, address _to, uint256 _value) internal {
        holderCount = TokenLib.adjustInvestorCount(holderCount, _from, _to, _value, balanceOf(_to), balanceOf(_from), dataStore);
    }

    /**
     * @notice freezes transfers
     */
    function freezeTransfers() external {
        _onlyOwner();
        require(!transfersFrozen);
        transfersFrozen = true;
        /*solium-disable-next-line security/no-block-members*/
        emit FreezeTransfers(true);
    }

    /**
     * @notice Unfreeze transfers
     */
    function unfreezeTransfers() external {
        _onlyOwner();
        require(transfersFrozen);
        transfersFrozen = false;
        /*solium-disable-next-line security/no-block-members*/
        emit FreezeTransfers(false);
    }

    /**
     * @notice Internal - adjusts token holder balance at checkpoint before a token transfer
     * @param _investor address of the token holder affected
     */
    function _adjustBalanceCheckpoints(address _investor) internal {
        TokenLib.adjustCheckpoints(checkpointBalances[_investor], balanceOf(_investor), currentCheckpointId);
    }

    /**
     * @notice Overloaded version of the transfer function
     * @param _to receiver of transfer
     * @param _value value of transfer
     * @return bool success
     */
    function transfer(address _to, uint256 _value) public returns(bool success) {
        _transferWithData(msg.sender, _to, _value, "");
        return true;
    }

    /**
     * @notice Transfer restrictions can take many forms and typically involve on-chain rules or whitelists.
     * However for many types of approved transfers, maintaining an on-chain list of approved transfers can be
     * cumbersome and expensive. An alternative is the co-signing approach, where in addition to the token holder
     * approving a token transfer, and authorised entity provides signed data which further validates the transfer.
     * @param _to address The address which you want to transfer to
     * @param _value uint256 the amount of tokens to be transferred
     * @param _data The `bytes _data` allows arbitrary data to be submitted alongside the transfer.
     * for the token contract to interpret or record. This could be signed data authorising the transfer
     * (e.g. a dynamic whitelist) but is flexible enough to accomadate other use-cases.
     */
    function transferWithData(address _to, uint256 _value, bytes memory _data) public {
        _transferWithData(msg.sender, _to, _value, _data);
    }

    function _transferWithData(address _from, address _to, uint256 _value, bytes memory _data) internal {
        _isValidTransfer(_updateTransfer(_from, _to, _value, _data));
        // Using the internal function instead of super.transfer() in the favour of reducing the code size
        _transfer(_from, _to, _value);
    }

    /**
     * @notice Overloaded version of the transferFrom function
     * @param _from sender of transfer
     * @param _to receiver of transfer
     * @param _value value of transfer
     * @return bool success
     */
    function transferFrom(address _from, address _to, uint256 _value) public returns(bool) {
        transferFromWithData(_from, _to, _value, "");
        return true;
    }

    /**
     * @notice Transfer restrictions can take many forms and typically involve on-chain rules or whitelists.
     * However for many types of approved transfers, maintaining an on-chain list of approved transfers can be
     * cumbersome and expensive. An alternative is the co-signing approach, where in addition to the token holder
     * approving a token transfer, and authorised entity provides signed data which further validates the transfer.
     * @dev `msg.sender` MUST have a sufficient `allowance` set and this `allowance` must be debited by the `_value`.
     * @param _from address The address which you want to send tokens from
     * @param _to address The address which you want to transfer to
     * @param _value uint256 the amount of tokens to be transferred
     * @param _data The `bytes _data` allows arbitrary data to be submitted alongside the transfer.
     * for the token contract to interpret or record. This could be signed data authorising the transfer
     * (e.g. a dynamic whitelist) but is flexible enough to accomadate other use-cases.
     */
    function transferFromWithData(address _from, address _to, uint256 _value, bytes memory _data) public {
        _isValidTransfer(_updateTransfer(_from, _to, _value, _data));
        require(super.transferFrom(_from, _to, _value));
    }

    /**
     * @notice Get the balance according to the provided partitions
     * @param _partition Partition which differentiate the tokens.
     * @param _tokenHolder Whom balance need to queried
     * @return Amount of tokens as per the given partitions
     */
    function balanceOfByPartition(bytes32 _partition, address _tokenHolder) public view returns(uint256) {
        return _balanceOfByPartition(_partition, _tokenHolder, 0);
    }

    function _balanceOfByPartition(bytes32 _partition, address _tokenHolder, uint256 _additionalBalance) internal view returns(uint256 partitionBalance) {
        address[] memory tms = modules[TRANSFER_KEY];
        uint256 amount;
        for (uint256 i = 0; i < tms.length; i++) {
            amount = ITransferManager(tms[i]).getTokensByPartition(_partition, _tokenHolder, _additionalBalance);
            // In UNLOCKED partition we are returning the minimum of all the unlocked balances
            if (_partition == UNLOCKED) {
                if (amount < partitionBalance || i == 0)
                    partitionBalance = amount;
            }
            // In locked partition we are returning the maximum of all the Locked balances
            else {
                if (partitionBalance < amount)
                    partitionBalance = amount;
            }
        }
    }

    /**
     * @notice Transfers the ownership of tokens from a specified partition from one address to another address
     * @param _partition The partition from which to transfer tokens
     * @param _to The address to which to transfer tokens to
     * @param _value The amount of tokens to transfer from `_partition`
     * @param _data Additional data attached to the transfer of tokens
     * @return The partition to which the transferred tokens were allocated for the _to address
     */
    function transferByPartition(bytes32 _partition, address _to, uint256 _value, bytes memory _data) public returns (bytes32) {
        return _transferByPartition(msg.sender, _to, _value, _partition, _data, address(0), "");
    }

    function _transferByPartition(
        address _from,
        address _to,
        uint256 _value,
        bytes32 _partition,
        bytes memory _data,
        address _operator,
        bytes memory _operatorData
    )
        internal
        returns(bytes32 toPartition)
    {
        _isValidPartition(_partition);
        // Avoiding to add this check
        // require(balanceOfByPartition(_partition, msg.sender) >= _value);
        // NB - Above condition will be automatically checked using the executeTransfer() function execution.
        // NB - passing `_additionalBalance` value is 0 because accessing the balance before transfer
        uint256 lockedBalanceBeforeTransfer = _balanceOfByPartition(LOCKED, _to, 0);
        _transferWithData(_from, _to, _value, _data);
        // NB - passing `_additonalBalance` valie is 0 because balance of `_to` was updated in the transfer call
        uint256 lockedBalanceAfterTransfer = _balanceOfByPartition(LOCKED, _to, 0);
        toPartition =  _returnPartition(lockedBalanceBeforeTransfer, lockedBalanceAfterTransfer, _value);
        emit TransferByPartition(_partition, _operator, _from, _to, _value, _data, _operatorData);
    }

    function _returnPartition(uint256 _beforeBalance, uint256 _afterBalance, uint256 _value) internal pure returns(bytes32 toPartition) {
        // return LOCKED only when the transaction `_value` should be equal to the change in the LOCKED partition
        // balance otherwise return UNLOCKED
        toPartition = _afterBalance.sub(_beforeBalance) == _value ? LOCKED : UNLOCKED; // Returning the same partition UNLOCKED
    }

    ///////////////////////
    /// Operator Management
    ///////////////////////

    /**
     * @notice Authorises an operator for all partitions of `msg.sender`.
     * NB - Allowing investors to authorize an investor to be an operator of all partitions
     * but it doesn't mean we operator is allowed to transfer the LOCKED partition values.
     * Logic for this restriction is written in `operatorTransferByPartition()` function.
     * @param _operator An address which is being authorised.
     */
    function authorizeOperator(address _operator) public {
        _approve(msg.sender, _operator, uint(-1));
        emit AuthorizedOperator(_operator, msg.sender);
    }

    /**
     * @notice Revokes authorisation of an operator previously given for all partitions of `msg.sender`.
     * NB - Allowing investors to authorize an investor to be an operator of all partitions
     * but it doesn't mean we operator is allowed to transfer the LOCKED partition values.
     * Logic for this restriction is written in `operatorTransferByPartition()` function.
     * @param _operator An address which is being de-authorised
     */
    function revokeOperator(address _operator) public {
        _approve(msg.sender, _operator, 0);
        emit RevokedOperator(_operator, msg.sender);
    }

    /**
     * @notice Authorises an operator for a given partition of `msg.sender`
     * @param _partition The partition to which the operator is authorised
     * @param _operator An address which is being authorised
     */
    function authorizeOperatorByPartition(bytes32 _partition, address _operator) public {
        _isValidPartition(_partition);
        partitionApprovals[msg.sender][_partition][_operator] = true;
        emit AuthorizedOperatorByPartition(_partition, _operator, msg.sender);
    }

    /**
     * @notice Revokes authorisation of an operator previously given for a specified partition of `msg.sender`
     * @param _partition The partition to which the operator is de-authorised
     * @param _operator An address which is being de-authorised
     */
    function revokeOperatorByPartition(bytes32 _partition, address _operator) public {
        _isValidPartition(_partition);
        partitionApprovals[msg.sender][_partition][_operator] = false;
        emit RevokedOperatorByPartition(_partition, _operator, msg.sender);
    }

    /**
     * @notice Transfers the ownership of tokens from a specified partition from one address to another address
     * @param _partition The partition from which to transfer tokens.
     * @param _from The address from which to transfer tokens from
     * @param _to The address to which to transfer tokens to
     * @param _value The amount of tokens to transfer from `_partition`
     * @param _data Additional data attached to the transfer of tokens
     * @param _operatorData Additional data attached to the transfer of tokens by the operator
     * @return The partition to which the transferred tokens were allocated for the _to address
     */
    function operatorTransferByPartition(
        bytes32 _partition,
        address _from,
        address _to,
        uint256 _value,
        bytes calldata _data,
        bytes calldata _operatorData
    )
        external
        returns (bytes32)
    {
        // For the current release we are only allowing UNLOCKED partition tokens to transact
        _validateOperatorAndPartition(_partition, _from, msg.sender);
        require(_operatorData[0] != 0);
        return _transferByPartition(_from, _to, _value, _partition, _data, msg.sender, _operatorData);
    }

    function _validateOperatorAndPartition(bytes32 _partition, address _from, address _operator) internal view {
        _isValidPartition(_partition);
        _isValidOperator(_from, _operator, _partition);
    }

    /**
     * @notice Updates internal variables when performing a transfer
     * @param _from sender of transfer
     * @param _to receiver of transfer
     * @param _value value of transfer
     * @param _data data to indicate validation
     * @return bool success
     */
    function _updateTransfer(address _from, address _to, uint256 _value, bytes memory _data) internal nonReentrant returns(bool verified) {
        // NB - the ordering in this function implies the following:
        //  - investor counts are updated before transfer managers are called - i.e. transfer managers will see
        //investor counts including the current transfer.
        //  - checkpoints are updated after the transfer managers are called. This allows TMs to create
        //checkpoints as though they have been created before the current transactions,
        //  - to avoid the situation where a transfer manager transfers tokens, and this function is called recursively,
        //the function is marked as nonReentrant. This means that no TM can transfer (or mint / burn) tokens in the execute transfer function.
        _adjustInvestorCount(_from, _to, _value);
        verified = _executeTransfer(_from, _to, _value, _data);
        _adjustBalanceCheckpoints(_from);
        _adjustBalanceCheckpoints(_to);
    }

    /**
     * @notice Validate transfer with TransferManager module if it exists
     * @dev TransferManager module has a key of 2
     * function (no change in the state).
     * @param _from sender of transfer
     * @param _to receiver of transfer
     * @param _value value of transfer
     * @param _data data to indicate validation
     * @return bool
     */
    function _executeTransfer(
        address _from,
        address _to,
        uint256 _value,
        bytes memory _data
    )
        internal
        checkGranularity(_value)
        returns(bool)
    {
        if (!transfersFrozen) {
            bool isInvalid;
            bool isValid;
            bool isForceValid;
            address module;
            uint256 tmLength = modules[TRANSFER_KEY].length;
            for (uint256 i = 0; i < tmLength; i++) {
                module = modules[TRANSFER_KEY][i];
                if (!modulesToData[module].isArchived) {
                    // refer to https://github.com/PolymathNetwork/polymath-core/wiki/Transfer-manager-results
                    // for understanding what these results mean
                    ITransferManager.Result valid = ITransferManager(module).executeTransfer(_from, _to, _value, _data);
                    if (valid == ITransferManager.Result.INVALID) {
                        isInvalid = true;
                    } else if (valid == ITransferManager.Result.VALID) {
                        isValid = true;
                    } else if (valid == ITransferManager.Result.FORCE_VALID) {
                        isForceValid = true;
                    }
                }
            }
            return isForceValid ? true : (isInvalid ? false : isValid);
        }
        return false;
    }

    /**
     * @notice Permanently freeze issuance of this security token.
     * @dev It MUST NOT be possible to increase `totalSuppy` after this function is called.
     */
    function freezeIssuance(bytes calldata _signature) external {
        _onlyOwner();
        _isIssuanceAllowed();
        _isSignedByOwner(owner() == TokenLib.recoverFreezeIssuanceAckSigner(_signature));
        issuance = false;
        /*solium-disable-next-line security/no-block-members*/
        emit FreezeIssuance();
    }

    /**
     * @notice This function must be called to increase the total supply (Corresponds to mint function of ERC20).
     * @dev It only be called by the token issuer or the operator defined by the issuer. ERC1594 doesn't have
     * have the any logic related to operator but its superset ERC1400 have the operator logic and this function
     * is allowed to call by the operator.
     * @param _tokenHolder The account that will receive the created tokens (account should be whitelisted or KYCed).
     * @param _value The amount of tokens need to be issued
     * @param _data The `bytes _data` allows arbitrary data to be submitted alongside the transfer.
     */
    function issue(
        address _tokenHolder,
        uint256 _value,
        bytes memory _data
    )
        public // changed to public to save the code size and reuse the function
    {
        _isIssuanceAllowed();
        _onlyModuleOrOwner(MINT_KEY);
        _issue(_tokenHolder, _value, _data);
    }

    function _issue(
        address _tokenHolder,
        uint256 _value,
        bytes memory _data
    )
        internal
    {
        // Add a function to validate the `_data` parameter
        _isValidTransfer(_updateTransfer(address(0), _tokenHolder, _value, _data));
        _mint(_tokenHolder, _value);
        emit Issued(msg.sender, _tokenHolder, _value, _data);
    }

    /**
     * @notice issue new tokens and assigns them to the target _tokenHolder.
     * @dev Can only be called by the issuer or STO attached to the token.
     * @param _tokenHolders A list of addresses to whom the minted tokens will be dilivered
     * @param _values A list of number of tokens get minted and transfer to corresponding address of the investor from _tokenHolders[] list
     * @return success
     */
    function issueMulti(address[] memory _tokenHolders, uint256[] memory _values) public {
        _isIssuanceAllowed();
        _onlyModuleOrOwner(MINT_KEY);
        // Remove reason string to reduce the code size
        require(_tokenHolders.length == _values.length);
        for (uint256 i = 0; i < _tokenHolders.length; i++) {
            _issue(_tokenHolders[i], _values[i], "");
        }
    }

    /**
     * @notice Increases totalSupply and the corresponding amount of the specified owners partition
     * @param _partition The partition to allocate the increase in balance
     * @param _tokenHolder The token holder whose balance should be increased
     * @param _value The amount by which to increase the balance
     * @param _data Additional data attached to the minting of tokens
     */
    function issueByPartition(bytes32 _partition, address _tokenHolder, uint256 _value, bytes calldata _data) external {
        _isValidPartition(_partition);
        //Use issue instead of _issue function in the favour to saving code size
        issue(_tokenHolder, _value, _data);
        emit IssuedByPartition(_partition, _tokenHolder, _value, _data);
    }

    /**
     * @notice This function redeem an amount of the token of a msg.sender. For doing so msg.sender may incentivize
     * using different ways that could be implemented with in the `redeem` function definition. But those implementations
     * are out of the scope of the ERC1594.
     * @param _value The amount of tokens need to be redeemed
     * @param _data The `bytes _data` it can be used in the token contract to authenticate the redemption.
     */
    function redeem(uint256 _value, bytes calldata _data) external {
        _onlyModule(BURN_KEY);
        _redeem(msg.sender, _value, _data);
    }

    function _redeem(address _from, uint256 _value, bytes memory _data) internal {
        // Add a function to validate the `_data` parameter
        _isValidRedeem(_checkAndBurn(_from, _value, _data));
    }

    /**
     * @notice Decreases totalSupply and the corresponding amount of the specified partition of msg.sender
     * @param _partition The partition to allocate the decrease in balance
     * @param _value The amount by which to decrease the balance
     * @param _data Additional data attached to the burning of tokens
     */
    function redeemByPartition(bytes32 _partition, uint256 _value, bytes calldata _data) external {
        _onlyModule(BURN_KEY);
        _isValidPartition(_partition);
        _redeemByPartition(_partition, msg.sender, _value, address(0), _data, "");
    }

    function _redeemByPartition(
        bytes32 _partition,
        address _from,
        uint256 _value,
        address _operator,
        bytes memory _data,
        bytes memory _operatorData
    )
        internal
    {
        _redeem(_from, _value, _data);
        emit RedeemedByPartition(_partition, _operator, _from, _value, _data, _operatorData);
    }

    /**
     * @notice Decreases totalSupply and the corresponding amount of the specified partition of tokenHolder
     * @dev This function can only be called by the authorised operator.
     * @param _partition The partition to allocate the decrease in balance.
     * @param _tokenHolder The token holder whose balance should be decreased
     * @param _value The amount by which to decrease the balance
     * @param _data Additional data attached to the burning of tokens
     * @param _operatorData Additional data attached to the transfer of tokens by the operator
     */
    function operatorRedeemByPartition(
        bytes32 _partition,
        address _tokenHolder,
        uint256 _value,
        bytes calldata _data,
        bytes calldata _operatorData
    )
        external
    {
        _onlyModule(BURN_KEY);
        require(_operatorData[0] != 0);
        _zeroAddressCheck(_tokenHolder);
        _validateOperatorAndPartition(_partition, _tokenHolder, msg.sender);
        _redeemByPartition(_partition, _tokenHolder, _value, msg.sender, _data, _operatorData);
    }

    function _checkAndBurn(address _from, uint256 _value, bytes memory _data) internal returns(bool verified) {
        verified = _updateTransfer(_from, address(0), _value, _data);
        _burn(_from, _value);
        emit Redeemed(address(0), msg.sender, _value, _data);
    }

    /**
     * @notice This function redeem an amount of the token of a msg.sender. For doing so msg.sender may incentivize
     * using different ways that could be implemented with in the `redeem` function definition. But those implementations
     * are out of the scope of the ERC1594.
     * @dev It is analogy to `transferFrom`
     * @param _tokenHolder The account whose tokens gets redeemed.
     * @param _value The amount of tokens need to be redeemed
     * @param _data The `bytes _data` it can be used in the token contract to authenticate the redemption.
     */
    function redeemFrom(address _tokenHolder, uint256 _value, bytes calldata _data) external {
        _onlyModule(BURN_KEY);
        // Add a function to validate the `_data` parameter
        _isValidRedeem(_updateTransfer(_tokenHolder, address(0), _value, _data));
        _burnFrom(_tokenHolder, _value);
        emit Redeemed(msg.sender, _tokenHolder, _value, _data);
    }

    /**
     * @notice Creates a checkpoint that can be used to query historical balances / totalSuppy
     * @return uint256
     */
    function createCheckpoint() external returns(uint256) {
        _onlyModuleOrOwner(CHECKPOINT_KEY);
        // currentCheckpointId can only be incremented by 1 and hence it can not be overflowed
        currentCheckpointId = currentCheckpointId + 1;
        /*solium-disable-next-line security/no-block-members*/
        checkpointTimes.push(now);
        checkpointTotalSupply[currentCheckpointId] = totalSupply();
        emit CheckpointCreated(currentCheckpointId, dataStore.getAddressArrayLength(INVESTORSKEY));
        return currentCheckpointId;
    }

    /**
     * @notice Used by the issuer to set the controller addresses
     * @param _controller address of the controller
     */
    function setController(address _controller) external {
        _onlyOwner();
        require(isControllable());
        emit SetController(controller, _controller);
        controller = _controller;
    }

    /**
     * @notice Used by the issuer to permanently disable controller functionality
     * @dev enabled via feature switch "disableControllerAllowed"
     */
    function disableController(bytes calldata _signature) external {
        _onlyOwner();
        _isSignedByOwner(owner() == TokenLib.recoverDisableControllerAckSigner(_signature));
        require(isControllable());
        controllerDisabled = true;
        delete controller;
        emit DisableController();
    }

    /**
     * @notice Transfers of securities may fail for a number of reasons. So this function will used to understand the
     * cause of failure by getting the byte value. Which will be the ESC that follows the EIP 1066. ESC can be mapped
     * with a reson string to understand the failure cause, table of Ethereum status code will always reside off-chain
     * @param _to address The address which you want to transfer to
     * @param _value uint256 the amount of tokens to be transferred
     * @param _data The `bytes _data` allows arbitrary data to be submitted alongside the transfer.
     * @return byte Ethereum status code (ESC)
     * @return bytes32 Application specific reason code
     */
    function canTransfer(address _to, uint256 _value, bytes calldata _data) external view returns (byte, bytes32) {
        return _canTransfer(msg.sender, _to, _value, _data);
    }

    /**
     * @notice Transfers of securities may fail for a number of reasons. So this function will used to understand the
     * cause of failure by getting the byte value. Which will be the ESC that follows the EIP 1066. ESC can be mapped
     * with a reson string to understand the failure cause, table of Ethereum status code will always reside off-chain
     * @param _from address The address which you want to send tokens from
     * @param _to address The address which you want to transfer to
     * @param _value uint256 the amount of tokens to be transferred
     * @param _data The `bytes _data` allows arbitrary data to be submitted alongside the transfer.
     * @return byte Ethereum status code (ESC)
     * @return bytes32 Application specific reason code
     */
    function canTransferFrom(address _from, address _to, uint256 _value, bytes calldata _data) external view returns (byte reasonCode, bytes32 appCode) {
        (reasonCode, appCode) = _canTransfer(_from, _to, _value, _data);
        if (_isSuccess(reasonCode) && _value > allowance(_from, msg.sender)) {
            return (StatusCodes.code(StatusCodes.Status.InsufficientAllowance), bytes32(0));
        }
    }

    function _canTransfer(address _from, address _to, uint256 _value, bytes memory _data) internal view returns (byte, bytes32) {
        bytes32 appCode;
        bool success;
        if (_value % granularity != 0) {
            return (StatusCodes.code(StatusCodes.Status.TransferFailure), bytes32(0));
        }
        (success, appCode) = TokenLib.verifyTransfer(modules[TRANSFER_KEY], modulesToData, _from, _to, _value, _data, transfersFrozen);
        return TokenLib.canTransfer(success, appCode, _to, _value, balanceOf(_from));
    }

    /**
     * @notice The standard provides an on-chain function to determine whether a transfer will succeed,
     * and return details indicating the reason if the transfer is not valid.
     * @param _from The address from whom the tokens get transferred.
     * @param _to The address to which to transfer tokens to.
     * @param _partition The partition from which to transfer tokens
     * @param _value The amount of tokens to transfer from `_partition`
     * @param _data Additional data attached to the transfer of tokens
     * @return ESC (Ethereum Status Code) following the EIP-1066 standard
     * @return Application specific reason codes with additional details
     * @return The partition to which the transferred tokens were allocated for the _to address
     */
    function canTransferByPartition(
        address _from,
        address _to,
        bytes32 _partition,
        uint256 _value,
        bytes calldata _data
    )
        external
        view
        returns (byte reasonCode, bytes32 appStatusCode, bytes32 toPartition)
    {
        if (_partition == UNLOCKED) {
            (reasonCode, appStatusCode) = _canTransfer(_from, _to, _value, _data);
            if (_isSuccess(reasonCode)) {
                uint256 beforeBalance = _balanceOfByPartition(LOCKED, _to, 0);
                uint256 afterbalance = _balanceOfByPartition(LOCKED, _to, _value);
                toPartition = _returnPartition(beforeBalance, afterbalance, _value);
            }
            return (reasonCode, appStatusCode, toPartition);
        }
        return (StatusCodes.code(StatusCodes.Status.TransferFailure), bytes32(0), bytes32(0));
    }

    /**
     * @notice Used to attach a new document to the contract, or update the URI or hash of an existing attached document
     * @dev Can only be executed by the owner of the contract.
     * @param _name Name of the document. It should be unique always
     * @param _uri Off-chain uri of the document from where it is accessible to investors/advisors to read.
     * @param _documentHash hash (of the contents) of the document.
     */
    function setDocument(bytes32 _name, string calldata _uri, bytes32 _documentHash) external {
        _onlyOwner();
        TokenLib.setDocument(_documents, _docNames, _docIndexes, _name, _uri, _documentHash);
    }

    /**
     * @notice Used to remove an existing document from the contract by giving the name of the document.
     * @dev Can only be executed by the owner of the contract.
     * @param _name Name of the document. It should be unique always
     */
    function removeDocument(bytes32 _name) external {
        _onlyOwner();
        TokenLib.removeDocument(_documents, _docNames, _docIndexes, _name);
    }

    /**
     * @notice In order to provide transparency over whether `controllerTransfer` / `controllerRedeem` are useable
     * or not `isControllable` function will be used.
     * @dev If `isControllable` returns `false` then it always return `false` and
     * `controllerTransfer` / `controllerRedeem` will always revert.
     * @return bool `true` when controller address is non-zero otherwise return `false`.
     */
    function isControllable() public view returns (bool) {
        return !controllerDisabled;
    }

    /**
     * @notice This function allows an authorised address to transfer tokens between any two token holders.
     * The transfer must still respect the balances of the token holders (so the transfer must be for at most
     * `balanceOf(_from)` tokens) and potentially also need to respect other transfer restrictions.
     * @dev This function can only be executed by the `controller` address.
     * @param _from Address The address which you want to send tokens from
     * @param _to Address The address which you want to transfer to
     * @param _value uint256 the amount of tokens to be transferred
     * @param _data data to validate the transfer. (It is not used in this reference implementation
     * because use of `_data` parameter is implementation specific).
     * @param _operatorData data attached to the transfer by controller to emit in event. (It is more like a reason string
     * for calling this function (aka force transfer) which provides the transparency on-chain).
     */
    function controllerTransfer(address _from, address _to, uint256 _value, bytes calldata _data, bytes calldata _operatorData) external {
        _onlyController();
        _updateTransfer(_from, _to, _value, _data);
        _transfer(_from, _to, _value);
        emit ControllerTransfer(msg.sender, _from, _to, _value, _data, _operatorData);
    }

    /**
     * @notice This function allows an authorised address to redeem tokens for any token holder.
     * The redemption must still respect the balances of the token holder (so the redemption must be for at most
     * `balanceOf(_tokenHolder)` tokens) and potentially also need to respect other transfer restrictions.
     * @dev This function can only be executed by the `controller` address.
     * @param _tokenHolder The account whose tokens will be redeemed.
     * @param _value uint256 the amount of tokens need to be redeemed.
     * @param _data data to validate the transfer. (It is not used in this reference implementation
     * because use of `_data` parameter is implementation specific).
     * @param _operatorData data attached to the transfer by controller to emit in event. (It is more like a reason string
     * for calling this function (aka force transfer) which provides the transparency on-chain).
     */
    function controllerRedeem(address _tokenHolder, uint256 _value, bytes calldata _data, bytes calldata _operatorData) external {
        _onlyController();
        _checkAndBurn(_tokenHolder, _value, _data);
        emit ControllerRedemption(msg.sender, _tokenHolder, _value, _data, _operatorData);
    }

    function _implementation() internal view returns(address) {
        return getterDelegate;
    }

    function updateFromRegistry() public {
        _onlyOwner();
        moduleRegistry = IModuleRegistry(polymathRegistry.getAddress("ModuleRegistry"));
        securityTokenRegistry = ISecurityTokenRegistry(polymathRegistry.getAddress("SecurityTokenRegistry"));
        polyToken = IERC20(polymathRegistry.getAddress("PolyToken"));
    }

    //Ownable Functions

    /**
     * @return the address of the owner.
     */
    function owner() public view returns (address) {
        return _owner;
    }

    /**
     * @return true if `msg.sender` is the owner of the contract.
     */
    function isOwner() public view returns (bool) {
        return msg.sender == _owner;
    }

    /**
     * @dev Allows the current owner to transfer control of the contract to a newOwner.
     * @param newOwner The address to transfer ownership to.
     */
    function transferOwnership(address newOwner) external {
        _onlyOwner();
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers control of the contract to a newOwner.
     * @param newOwner The address to transfer ownership to.
     */
    function _transferOwnership(address newOwner) internal {
        require(newOwner != address(0));
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }

    /**
    * @dev Check if a status code represents success (ie: 0x*1)
    * @param status Binary ERC-1066 status code
    * @return successful A boolean representing if the status code represents success
    */
    function _isSuccess(byte status) internal pure returns (bool successful) {
        return (status & 0x0F) == 0x01;
    }
}
