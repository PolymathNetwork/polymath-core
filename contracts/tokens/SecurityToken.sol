pragma solidity ^0.5.0;

import "../proxy/Proxy.sol";
import "../PolymathRegistry.sol";
import "../libraries/KindMath.sol";
import "../interfaces/IModule.sol";
import "./SecurityTokenStorage.sol";
import "../libraries/TokenLib.sol";
import "../interfaces/IDataStore.sol";
import "../interfaces/IModuleFactory.sol";
import "../interfaces/token/IERC1594.sol";
import "../interfaces/token/IERC1643.sol";
import "../interfaces/token/IERC1644.sol";
import "../interfaces/IModuleRegistry.sol";
import "../interfaces/IFeatureRegistry.sol";
import "../interfaces/ITransferManager.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";

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
contract SecurityToken is ERC20, ERC20Detailed, Ownable, ReentrancyGuard, SecurityTokenStorage, IERC1594, IERC1643, IERC1644, Proxy {
    
    using SafeMath for uint256;

    // Emit when transfers are frozen or unfrozen
    event FreezeTransfers(bool _status);
    // Emit when is permanently frozen by the issuer
    event FreezeIssuance();
    // Emit when the token details get updated
    event UpdateTokenDetails(string _oldDetails, string _newDetails);
    // Emit when the granularity get changed
    event GranularityChanged(uint256 _oldGranularity, uint256 _newGranularity);
    // Emit at the time when module get added
    event ModuleAdded(
        uint8[] _types,
        bytes32 indexed _name,
        address indexed _moduleFactory,
        address _module,
        uint256 _moduleCost,
        uint256 _budget,
        bytes32 _label
    );
    // Emit when Module get archived from the securityToken
    event ModuleArchived(uint8[] _types, address _module);
    // Emit when Module get unarchived from the securityToken
    event ModuleUnarchived(uint8[] _types, address _module);
    // Emit when Module get removed from the securityToken
    event ModuleRemoved(uint8[] _types, address _module);
    // Emit when the budget allocated to a module is changed
    event ModuleBudgetChanged(uint8[] _moduleTypes, address _module, uint256 _oldBudget, uint256 _budget);
    // Emit when new checkpoint created
    event CheckpointCreated(uint256 indexed _checkpointId);
    // Events to log controller actions
    event SetController(address indexed _oldController, address indexed _newController);
    event DisableController();
    
    function _isModule(address _module, uint8 _type) internal view returns(bool) {
        if (modulesToData[_module].module != _module || modulesToData[_module].isArchived)
            return false;
        for (uint256 i = 0; i < modulesToData[_module].moduleTypes.length; i++) {
            if (modulesToData[_module].moduleTypes[i] == _type) {
                return true;
            }
        }
        return false;
    }

    // Require msg.sender to be the specified module type
    modifier onlyModule(uint8 _type) {
        require(_isModule(msg.sender, _type));
        _;
    }

    // Require msg.sender to be the specified module type or the owner of the token
    modifier onlyModuleOrOwner(uint8 _type) {
        if (msg.sender == owner()) {
            _;
        } else {
            require(_isModule(msg.sender, _type));
            _;
        }
    }

    modifier isIssuanceAllowed() {
        require(issuance, "Issuance frozen");
        _;
    }

    modifier checkGranularity(uint256 _value) {
        require(_value % granularity == 0, "Invalid granularity");
        _;
    }
    
    // Modifier to check whether the msg.sender is authorised or not 
    modifier onlyController() {
        require(msg.sender == controller, "Not Authorised");
        _;
    }

    modifier isEnabled(string memory _nameKey) {
        require(IFeatureRegistry(featureRegistry).getFeatureStatus(_nameKey));
        _;
    }
    
    /**
     * @notice constructor 
     * @param _name Name of the SecurityToken
     * @param _symbol Symbol of the Token
     * @param _decimals Decimals for the securityToken
     * @param _granularity granular level of the token
     * @param _tokenDetails Details of the token that are stored off-chain
     * @param _polymathRegistry Contract address of the polymath registry
     * @param _delegate Contract address of the delegate
     */
    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint256 _granularity,
        string memory _tokenDetails,
        address _polymathRegistry,
        address _delegate
    ) 
        public
        ERC20Detailed(_name, _symbol, _decimals)
    {
        require(_polymathRegistry != address(0), "Invalid address");
        require(_delegate != address(0), "Invalid address");
        polymathRegistry = _polymathRegistry;
        //When it is created, the owner is the STR
        updateFromRegistry();
        delegate = _delegate;
        tokenDetails = _tokenDetails;
        granularity = _granularity;
        securityTokenVersion = SemanticVersion(2, 0, 0);
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
        bytes32 _label
    ) 
        public 
        onlyOwner 
        nonReentrant 
    {
        //Check that the module factory exists in the ModuleRegistry - will throw otherwise
        IModuleRegistry(moduleRegistry).useModule(_moduleFactory);
        IModuleFactory moduleFactory = IModuleFactory(_moduleFactory);
        uint8[] memory moduleTypes = moduleFactory.getTypes();
        uint256 moduleCost = moduleFactory.getSetupCostInPoly();
        require(moduleCost <= _maxCost, "Invalid cost");
        //Approve fee for module
        ERC20(polyToken).approve(_moduleFactory, moduleCost);
        //Creates instance of module from factory
        address module = moduleFactory.deploy(_data);
        require(modulesToData[module].module == address(0), "Module exists");
        //Approve ongoing budget
        ERC20(polyToken).approve(module, _budget);
        //Add to SecurityToken module map
        bytes32 moduleName = moduleFactory.getName();
        uint256[] memory moduleIndexes = new uint256[](moduleTypes.length);
        uint256 i;
        for (i = 0; i < moduleTypes.length; i++) {
            moduleIndexes[i] = modules[moduleTypes[i]].length;
            modules[moduleTypes[i]].push(module);
        }
        modulesToData[module] = ModuleData(
            moduleName,
            module,
            _moduleFactory,
            false,
            moduleTypes,
            moduleIndexes,
            names[moduleName].length,
            _label
        );
        names[moduleName].push(module);
        //Emit log event
        /*solium-disable-next-line security/no-block-members*/
        emit ModuleAdded(moduleTypes, moduleName, _moduleFactory, module, moduleCost, _budget, _label);
    }

    /**
    * @notice addModule function will call addModuleWithLabel() with an empty label for backward compatible
    */
    function addModule(address _moduleFactory, bytes calldata _data, uint256 _maxCost, uint256 _budget) external {
        addModuleWithLabel(_moduleFactory, _data, _maxCost, _budget, "");
    }

    /**
    * @notice Archives a module attached to the SecurityToken
    * @param _module address of module to archive
    */
    function archiveModule(address _module) external onlyOwner {
        TokenLib.archiveModule(modulesToData[_module], _module);
    }

    /**
    * @notice Unarchives a module attached to the SecurityToken
    * @param _module address of module to unarchive
    */
    function unarchiveModule(address _module) external onlyOwner {
        TokenLib.unarchiveModule(modulesToData[_module], _module);
    }

    /**
    * @notice Removes a module attached to the SecurityToken
    * @param _module address of module to unarchive
    */
    function removeModule(address _module) external onlyOwner {
        TokenLib.removeModule(_module, modules, modulesToData, names);
    }

    /**
    * @notice Allows the owner to withdraw unspent POLY stored by them on the ST or any ERC20 token.
    * @dev Owner can transfer POLY to the ST which will be used to pay for modules that require a POLY fee.
    * @param _tokenContract Address of the ERC20Basic compliance token
    * @param _value amount of POLY to withdraw
    */
    function withdrawERC20(address _tokenContract, uint256 _value) external onlyOwner {
        require(_tokenContract != address(0));
        IERC20 token = IERC20(_tokenContract);
        require(token.transfer(owner(), _value));
    }

    /**
    * @notice allows owner to increase/decrease POLY approval of one of the modules
    * @param _module module address
    * @param _change change in allowance
    * @param _increase true if budget has to be increased, false if decrease
    */
    function changeModuleBudget(address _module, uint256 _change, bool _increase) external onlyOwner {
        TokenLib.changeModuleBudget(_module, _change, _increase, polyToken, modulesToData);
    }

    /**
     * @notice updates the tokenDetails associated with the token
     * @param _newTokenDetails New token details
     */
    function updateTokenDetails(string calldata _newTokenDetails) external onlyOwner {
        emit UpdateTokenDetails(tokenDetails, _newTokenDetails);
        tokenDetails = _newTokenDetails;
    }

    /**
    * @notice Allows owner to change token granularity
    * @param _granularity granularity level of the token
    */
    function changeGranularity(uint256 _granularity) external onlyOwner {
        require(_granularity != 0, "Invalid granularity");
        emit GranularityChanged(granularity, _granularity);
        granularity = _granularity;
    }

    /**
    * @notice Allows owner to change data store
    * @param _dataStore Address of the token data store
    */
    function changeDataStore(address _dataStore) external onlyOwner {
        require(_dataStore != address(0), "Invalid address");
        dataStore = _dataStore;
    }

    /**
     * @notice Allows to change the treasury wallet address
     * @param _wallet Ethereum address of the treasury wallet 
     */
    function changeTreasuryWallet(address _wallet) external onlyOwner {
        require(_wallet != address(0), "Invalid address");
        IDataStore(dataStore).setAddress(TREASURY, _wallet);
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
    function freezeTransfers() external onlyOwner {
        require(!transfersFrozen, "Already frozen");
        transfersFrozen = true;
        /*solium-disable-next-line security/no-block-members*/
        emit FreezeTransfers(true);
    }

    /**
     * @notice Unfreeze transfers
     */
    function unfreezeTransfers() external onlyOwner {
        require(transfersFrozen, "Not frozen");
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
        transferWithData(_to, _value, "");
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
        require(_updateTransfer(msg.sender, _to, _value, _data), "Transfer invalid");
        require(super.transfer(_to, _value));
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
        require(_updateTransfer(_from, _to, _value, _data), "Transfer invalid");
        require(super.transferFrom(_from, _to, _value));
    }

    /**
     * @notice Updates internal variables when performing a transfer
     * @param _from sender of transfer
     * @param _to receiver of transfer
     * @param _value value of transfer
     * @param _data data to indicate validation
     * @return bool success
     */
    function _updateTransfer(address _from, address _to, uint256 _value, bytes memory _data) internal nonReentrant returns(bool) {
        // NB - the ordering in this function implies the following:
        //  - investor counts are updated before transfer managers are called - i.e. transfer managers will see
        //investor counts including the current transfer.
        //  - checkpoints are updated after the transfer managers are called. This allows TMs to create
        //checkpoints as though they have been created before the current transactions,
        //  - to avoid the situation where a transfer manager transfers tokens, and this function is called recursively,
        //the function is marked as nonReentrant. This means that no TM can transfer (or mint / burn) tokens.
        _adjustInvestorCount(_from, _to, _value);
        bool verified = _executeTransfer(_from, _to, _value, _data);
        _adjustBalanceCheckpoints(_from);
        _adjustBalanceCheckpoints(_to);
        return verified;
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
            bool isInvalid = false;
            bool isValid = false;
            bool isForceValid = false;
            bool unarchived = false;
            address module;
            for (uint256 i = 0; i < modules[TRANSFER_KEY].length; i++) {
                module = modules[TRANSFER_KEY][i];
                if (!modulesToData[module].isArchived) {
                    unarchived = true;
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
            // If no unarchived modules, return true by default
            return unarchived ? (isForceValid ? true : (isInvalid ? false : isValid)) : true;
        }
        return false;
    }

    /**
     * @notice A security token issuer can specify that issuance has finished for the token
     * (i.e. no new tokens can be minted or issued).
     * @dev If a token returns FALSE for `isIssuable()` then it MUST always return FALSE in the future.
     * If a token returns FALSE for `isIssuable()` then it MUST never allow additional tokens to be issued.
     * @return bool `true` signifies the minting is allowed. While `false` denotes the end of minting
     */
    function isIssuable() external view returns (bool) {
        return issuance;
    }

    /**
     * @notice Permanently freeze issuance of this security token.
     * @dev It MUST NOT be possible to increase `totalSuppy` after this function is called.
     */
    function freezeIssuance() external isIssuanceAllowed isEnabled("freezeIssuanceAllowed") onlyOwner {
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
        public 
        isIssuanceAllowed
        onlyModuleOrOwner(MINT_KEY) 
    {
        // Add a function to validate the `_data` parameter
        require(_updateTransfer(address(0), _tokenHolder, _value, _data), "Transfer invalid");
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
    function issueMulti(address[] calldata _tokenHolders, uint256[] calldata _values) external {
        require(_tokenHolders.length == _values.length, "Incorrect inputs");
        for (uint256 i = 0; i < _tokenHolders.length; i++) {
            issue(_tokenHolders[i], _values[i], "");
        }
    }

    /**
     * @notice This function redeem an amount of the token of a msg.sender. For doing so msg.sender may incentivize
     * using different ways that could be implemented with in the `redeem` function definition. But those implementations
     * are out of the scope of the ERC1594. 
     * @param _value The amount of tokens need to be redeemed
     * @param _data The `bytes _data` it can be used in the token contract to authenticate the redemption.
     */
    function redeem(uint256 _value, bytes calldata _data) external onlyModule(BURN_KEY) {
        // Add a function to validate the `_data` parameter
        require(_checkAndBurn(msg.sender, _value, _data), "Invalid redeem");
    }

    /**
     * @notice Checks if an address is a module of certain type
     * @param _module Address to check
     * @param _type type to check against
     */
    function isModule(address _module, uint8 _type) public view returns(bool) {
        return _isModule(_module, _type);
    }

    function _checkAndBurn(address _from, uint256 _value, bytes memory _data) internal returns(bool) {
        bool verified = _updateTransfer(_from, address(0), _value, _data);
        _burn(_from, _value);
        emit Redeemed(address(0), msg.sender, _value, _data);
        return verified;
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
    function redeemFrom(address _tokenHolder, uint256 _value, bytes calldata _data) external onlyModule(BURN_KEY) {
        // Add a function to validate the `_data` parameter
        require(_updateTransfer(_tokenHolder, address(0), _value, _data), "Invalid redeem");
        _burnFrom(_tokenHolder, _value);
        emit Redeemed(msg.sender, _tokenHolder, _value, _data);
    }

    /**
     * @notice Creates a checkpoint that can be used to query historical balances / totalSuppy
     * @return uint256
     */
    function createCheckpoint() external onlyModuleOrOwner(CHECKPOINT_KEY) returns(uint256) {
        require(currentCheckpointId < 2 ** 256 - 1);
        currentCheckpointId = currentCheckpointId + 1;
        /*solium-disable-next-line security/no-block-members*/
        checkpointTimes.push(now);
        /*solium-disable-next-line security/no-block-members*/
        checkpointTotalSupply[currentCheckpointId] = totalSupply();
        emit CheckpointCreated(currentCheckpointId);
        return currentCheckpointId;
    }

    /**
     * @notice Used by the issuer to set the controller addresses
     * @param _controller address of the controller
     */
    function setController(address _controller) public onlyOwner {
        require(_isControllable());
        // Below condition is to restrict the owner/issuer to become the controller(In an ideal world).
        // But for non ideal case issuer could set another address which is not the owner of the token
        // but issuer holds its private key.
        require(_controller != msg.sender);
        emit SetController(controller, _controller);
        controller = _controller;
    }

    /**
     * @notice Used by the issuer to permanently disable controller functionality
     * @dev enabled via feature switch "disableControllerAllowed"
     */
    function disableController() external isEnabled("disableControllerAllowed") onlyOwner {
        require(_isControllable());
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
     * @return bool It signifies whether the transaction will be executed or not.
     * @return byte Ethereum status code (ESC)
     * @return bytes32 Application specific reason code 
     */
    function canTransfer(address _to, uint256 _value, bytes calldata _data) external view returns (bool, byte, bytes32) {
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
     * @return bool It signifies whether the transaction will be executed or not.
     * @return byte Ethereum status code (ESC)
     * @return bytes32 Application specific reason code 
     */
    function canTransferFrom(address _from, address _to, uint256 _value, bytes calldata _data) external view returns (bool, byte, bytes32) {
        (bool success, byte reasonCode, bytes32 appCode) = _canTransfer(_from, _to, _value, _data);
        if (success && _value > allowance(_from, msg.sender)) {
            return (false, 0x53, bytes32(0));
        } else 
            return (success, reasonCode, appCode); 
    }

    function _canTransfer(address _from, address _to, uint256 _value, bytes memory _data) internal view returns (bool, byte, bytes32) {
        bytes32 appCode;
        bool success;
        if (_value % granularity != 0) {
            return (false, 0x50, "Invalid granularity");
        }
        (success, appCode) = TokenLib.verifyTransfer(modules[TRANSFER_KEY], modulesToData, _from, _to, _value, _data, transfersFrozen);
        if (!success)
            return (false, 0x50, appCode);

        else if (balanceOf(_from) < _value)
            return (false, 0x52, bytes32(0));

        else if (_to == address(0))
            return (false, 0x57, bytes32(0));

        else if (!KindMath.checkAdd(balanceOf(_to), _value))
            return (false, 0x50, bytes32(0));
        return (true, 0x51, bytes32(0));
    }

    /**
     * @notice Used to attach a new document to the contract, or update the URI or hash of an existing attached document
     * @dev Can only be executed by the owner of the contract.
     * @param _name Name of the document. It should be unique always
     * @param _uri Off-chain uri of the document from where it is accessible to investors/advisors to read.
     * @param _documentHash hash (of the contents) of the document.
     */
    function setDocument(bytes32 _name, string calldata _uri, bytes32 _documentHash) external onlyOwner {
        require(_name != bytes32(0), "Zero value is not allowed");
        require(bytes(_uri).length > 0, "Should not be a empty uri");
        if (_documents[_name].lastModified == uint256(0)) {
            _docNames.push(_name);
            _docIndexes[_name] = _docNames.length;
        }
        _documents[_name] = Document(_documentHash, now, _uri);
        emit DocumentUpdated(_name, _uri, _documentHash);
    }

    /**
     * @notice Used to remove an existing document from the contract by giving the name of the document.
     * @dev Can only be executed by the owner of the contract.
     * @param _name Name of the document. It should be unique always
     */
    function removeDocument(bytes32 _name) external onlyOwner {
        require(_documents[_name].lastModified != uint256(0), "Document should be existed");
        uint256 index = _docIndexes[_name] - 1;
        if (index != _docNames.length - 1) {
            _docNames[index] = _docNames[_docNames.length - 1];
            _docIndexes[_docNames[index]] = index + 1; 
        }
        _docNames.length--;
        emit DocumentRemoved(_name, _documents[_name].uri, _documents[_name].docHash);
        delete _documents[_name];
    }

    /**
     * @notice Internal function to know whether the controller functionality
     * allowed or not.
     * @return bool `true` when controller address is non-zero otherwise return `false`.
     */
    function _isControllable() internal view returns (bool) {
        return !controllerDisabled;
    }

    /**
     * @notice In order to provide transparency over whether `controllerTransfer` / `controllerRedeem` are useable
     * or not `isControllable` function will be used.
     * @dev If `isControllable` returns `false` then it always return `false` and
     * `controllerTransfer` / `controllerRedeem` will always revert.
     * @return bool `true` when controller address is non-zero otherwise return `false`.
     */
    function isControllable() external view returns (bool) {
        return _isControllable();
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
    function controllerTransfer(address _from, address _to, uint256 _value, bytes calldata _data, bytes calldata _operatorData) external onlyController {
        require(_isControllable());
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
    function controllerRedeem(address _tokenHolder, uint256 _value, bytes calldata _data, bytes calldata _operatorData) external onlyController {
        require(_isControllable());
        _checkAndBurn(_tokenHolder, _value, _data);
        emit ControllerRedemption(msg.sender, _tokenHolder, _value, _data, _operatorData);
    }

    function _implementation() internal view returns(address) {
        return delegate;
    }

    function updateFromRegistry() public onlyOwner {
        moduleRegistry = PolymathRegistry(polymathRegistry).getAddress("ModuleRegistry");
        securityTokenRegistry = PolymathRegistry(polymathRegistry).getAddress("SecurityTokenRegistry");
        featureRegistry = PolymathRegistry(polymathRegistry).getAddress("FeatureRegistry");
        polyToken = PolymathRegistry(polymathRegistry).getAddress("PolyToken");
    }
}
