pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/Math.sol";
import "../interfaces/IPoly.sol";
import "../interfaces/IModule.sol";
import "../interfaces/IModuleFactory.sol";
import "../interfaces/IModuleRegistry.sol";
import "../interfaces/IFeatureRegistry.sol";
import "../interfaces/ITransferManager.sol";
import "../RegistryUpdater.sol";
import "../libraries/Util.sol";
import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import "../libraries/TokenLib.sol";

/**
* @title Security Token contract
* @notice SecurityToken is an ERC20 token with added capabilities:
* @notice - Implements the ST-20 Interface
* @notice - Transfers are restricted
* @notice - Modules can be attached to it to control its behaviour
* @notice - ST should not be deployed directly, but rather the SecurityTokenRegistry should be used
* @notice - ST does not inherit from ISecurityToken due to:
* @notice - https://github.com/ethereum/solidity/issues/4847
*/
contract SecurityToken is ERC20, ERC20Detailed, ReentrancyGuard, RegistryUpdater {
    using SafeMath for uint256;

    TokenLib.InvestorDataStorage investorData;

    // Used to hold the semantic version data
    struct SemanticVersion {
        uint8 major;
        uint8 minor;
        uint8 patch;
    }

    SemanticVersion securityTokenVersion;

    // off-chain data
    string public tokenDetails;

    uint8 constant PERMISSION_KEY = 1;
    uint8 constant TRANSFER_KEY = 2;
    uint8 constant MINT_KEY = 3;
    uint8 constant CHECKPOINT_KEY = 4;
    uint8 constant BURN_KEY = 5;
    uint8 constant DATA_KEY = 6;

    uint256 public granularity;

    // Value of current checkpoint
    uint256 public currentCheckpointId;

    // Used to temporarily halt all transactions
    bool public transfersFrozen;

    // Used to permanently halt all minting
    bool public mintingFrozen;

    // Used to permanently halt controller actions
    bool public controllerDisabled;

    // Address whitelisted by issuer as controller
    address public controller;

    // Address of the data store used to store shared data
    address public dataStore;

    // Records added modules - module list should be order agnostic!
    mapping(uint8 => address[]) modules;

    // Records information about the module
    mapping(address => TokenLib.ModuleData) modulesToData;

    // Records added module names - module list should be order agnostic!
    mapping(bytes32 => address[]) names;

    // Map each investor to a series of checkpoints
    mapping(address => TokenLib.Checkpoint[]) checkpointBalances;

    // Mapping of checkpoints that relate to total supply
    mapping (uint256 => uint256) checkpointTotalSupply;

    // Times at which each checkpoint was created
    uint256[] checkpointTimes;

    // Emit at the time when module get added
    event ModuleAdded(
        uint8[] _types,
        bytes32 indexed _name,
        address indexed _moduleFactory,
        address _module,
        uint256 _moduleCost,
        uint256 _budget,
        bytes32 _label,
        uint256 _timestamp
    );

    // Emit when the token details get updated
    event UpdateTokenDetails(string _oldDetails, string _newDetails);
    // Emit when the granularity get changed
    event GranularityChanged(uint256 _oldGranularity, uint256 _newGranularity);
    // Emit when Module get archived from the securityToken
    event ModuleArchived(uint8[] _types, address _module, uint256 _timestamp);
    // Emit when Module get unarchived from the securityToken
    event ModuleUnarchived(uint8[] _types, address _module, uint256 _timestamp);
    // Emit when Module get removed from the securityToken
    event ModuleRemoved(uint8[] _types, address _module, uint256 _timestamp);
    // Emit when the budget allocated to a module is changed
    event ModuleBudgetChanged(uint8[] _moduleTypes, address _module, uint256 _oldBudget, uint256 _budget);
    // Emit when transfers are frozen or unfrozen
    event FreezeTransfers(bool _status, uint256 _timestamp);
    // Emit when new checkpoint created
    event CheckpointCreated(uint256 indexed _checkpointId, uint256 _timestamp);
    // Emit when is permanently frozen by the issuer
    event FreezeMinting(uint256 _timestamp);
    // Events to log minting and burning
    event Minted(address indexed _to, uint256 _value);
    event Burnt(address indexed _from, uint256 _value);

    // Events to log controller actions
    event SetController(address indexed _oldController, address indexed _newController);
    event ForceTransfer(
        address indexed _controller,
        address indexed _from,
        address indexed _to,
        uint256 _value,
        bool _verifyTransfer,
        bytes _data
    );
    event ForceBurn(address indexed _controller, address indexed _from, uint256 _value, bool _verifyTransfer, bytes _data);
    event DisableController(uint256 _timestamp);

    function _isModule(address _module, uint8 _type) internal view returns(bool) {
        require(modulesToData[_module].module == _module, "Wrong address");
        require(!modulesToData[_module].isArchived, "Module archived");
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

    modifier checkGranularity(uint256 _value) {
        require(_value % granularity == 0, "Invalid granularity");
        _;
    }

    modifier isMintingAllowed() {
        require(!mintingFrozen, "Minting frozen");
        _;
    }

    modifier isEnabled(string memory _nameKey) {
        require(IFeatureRegistry(featureRegistry).getFeatureStatus(_nameKey));
        _;
    }

    /**
     * @notice Revert if called by an account which is not a controller
     */
    modifier onlyController() {
        require(msg.sender == controller, "Not controller");
        require(!controllerDisabled, "Controller disabled");
        _;
    }

    /**
     * @notice Constructor
     * @param _name Name of the SecurityToken
     * @param _symbol Symbol of the Token
     * @param _decimals Decimals for the securityToken
     * @param _granularity granular level of the token
     * @param _tokenDetails Details of the token that are stored off-chain
     * @param _polymathRegistry Contract address of the polymath registry
     */
    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint256 _granularity,
        string memory _tokenDetails,
        address _polymathRegistry
    ) 
        public 
        ERC20Detailed(_name, _symbol, _decimals) RegistryUpdater(_polymathRegistry) 
    {
        //When it is created, the owner is the STR
        updateFromRegistry();
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
        onlyOwner nonReentrant 
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
        modulesToData[module] = TokenLib.ModuleData(
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
        emit ModuleAdded(moduleTypes, moduleName, _moduleFactory, module, moduleCost, _budget, _label, now);
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
     * @notice Returns the data associated to a module
     * @param _module address of the module
     * @return bytes32 name
     * @return address module address
     * @return address module factory address
     * @return bool module archived
     * @return uint8 array of module types
     * @return bytes32 module label
     */
    function getModule(address _module) external view returns(bytes32, address, address, bool, uint8[] memory, bytes32) {
        return (modulesToData[_module].name, modulesToData[_module].module, modulesToData[_module].moduleFactory, modulesToData[_module].isArchived, modulesToData[_module].moduleTypes, modulesToData[_module].label);
    }

    /**
     * @notice Returns a list of modules that match the provided name
     * @param _name name of the module
     * @return address[] list of modules with this name
     */
    function getModulesByName(bytes32 _name) external view returns(address[] memory) {
        return names[_name];
    }

    /**
     * @notice Returns a list of modules that match the provided module type
     * @param _type type of the module
     * @return address[] list of modules with this type
     */
    function getModulesByType(uint8 _type) external view returns(address[] memory) {
        return modules[_type];
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
    * @notice Keeps track of the number of non-zero token holders
    * @param _from sender of transfer
    * @param _to receiver of transfer
    * @param _value value of transfer
    */
    function _adjustInvestorCount(address _from, address _to, uint256 _value) internal {
        TokenLib.adjustInvestorCount(investorData, _from, _to, _value, balanceOf(_to), balanceOf(_from));
    }

    /**
     * @notice returns an array of investors
     * NB - this length may differ from investorCount as it contains all investors that ever held tokens
     * @return list of addresses
     */
    function getInvestors() external view returns(address[] memory) {
        return investorData.investors;
    }

    /**
     * @notice returns an array of investors at a given checkpoint
     * NB - this length may differ from investorCount as it contains all investors that ever held tokens
     * @param _checkpointId Checkpoint id at which investor list is to be populated
     * @return list of investors
     */
    function getInvestorsAt(uint256 _checkpointId) external view returns(address[] memory) {
        uint256 count = 0;
        uint256 i;
        for (i = 0; i < investorData.investors.length; i++) {
            if (balanceOfAt(investorData.investors[i], _checkpointId) > 0) {
                count++;
            }
        }
        address[] memory investors = new address[](count);
        count = 0;
        for (i = 0; i < investorData.investors.length; i++) {
            if (balanceOfAt(investorData.investors[i], _checkpointId) > 0) {
                investors[count] = investorData.investors[i];
                count++;
            }
        }
        return investors;
    }

    /**
     * @notice generates subset of investors
     * NB - can be used in batches if investor list is large
     * @param _start Position of investor to start iteration from
     * @param _end Position of investor to stop iteration at
     * @return list of investors
     */
    function iterateInvestors(uint256 _start, uint256 _end) external view returns(address[] memory) {
        require(_end <= investorData.investors.length, "Invalid end");
        address[] memory investors = new address[](_end.sub(_start));
        uint256 index = 0;
        for (uint256 i = _start; i < _end; i++) {
            investors[index] = investorData.investors[i];
            index++;
        }
        return investors;
    }

    /**
     * @notice Returns the investor count
     * @return Investor count
     */
    function getInvestorCount() external view returns(uint256) {
        return investorData.investorCount;
    }

    /**
     * @notice freezes transfers
     */
    function freezeTransfers() external onlyOwner {
        require(!transfersFrozen, "Already frozen");
        transfersFrozen = true;
        /*solium-disable-next-line security/no-block-members*/
        emit FreezeTransfers(true, now);
    }

    /**
     * @notice Unfreeze transfers
     */
    function unfreezeTransfers() external onlyOwner {
        require(transfersFrozen, "Not frozen");
        transfersFrozen = false;
        /*solium-disable-next-line security/no-block-members*/
        emit FreezeTransfers(false, now);
    }

    /**
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
        return transferWithData(_to, _value, "");
    }

    /**
     * @notice Overloaded version of the transfer function
     * @param _to receiver of transfer
     * @param _value value of transfer
     * @param _data data to indicate validation
     * @return bool success
     */
    function transferWithData(address _to, uint256 _value, bytes memory _data) public returns(bool success) {
        require(_updateTransfer(msg.sender, _to, _value, _data), "Transfer invalid");
        require(super.transfer(_to, _value));
        return true;
    }

    /**
     * @notice Overloaded version of the transferFrom function
     * @param _from sender of transfer
     * @param _to receiver of transfer
     * @param _value value of transfer
     * @return bool success
     */
    function transferFrom(address _from, address _to, uint256 _value) public returns(bool) {
        return transferFromWithData(_from, _to, _value, "");
    }

    /**
     * @notice Overloaded version of the transferFrom function
     * @param _from sender of transfer
     * @param _to receiver of transfer
     * @param _value value of transfer
     * @param _data data to indicate validation
     * @return bool success
     */
    function transferFromWithData(address _from, address _to, uint256 _value, bytes memory _data) public returns(bool) {
        require(_updateTransfer(_from, _to, _value, _data), "Transfer invalid");
        require(super.transferFrom(_from, _to, _value));
        return true;
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
        bool verified = _verifyTransfer(_from, _to, _value, _data, true);
        _adjustBalanceCheckpoints(_from);
        _adjustBalanceCheckpoints(_to);
        return verified;
    }

    /**
     * @notice Validate transfer with TransferManager module if it exists
     * @dev TransferManager module has a key of 2
     * @dev _isTransfer boolean flag is the deciding factor for whether the
     * state variables gets modified or not within the different modules. i.e isTransfer = true
     * leads to change in the modules environment otherwise _verifyTransfer() works as a read-only
     * function (no change in the state).
     * @param _from sender of transfer
     * @param _to receiver of transfer
     * @param _value value of transfer
     * @param _data data to indicate validation
     * @param _isTransfer whether transfer is being executed
     * @return bool
     */
    function _verifyTransfer(
        address _from,
        address _to,
        uint256 _value,
        bytes memory _data,
        bool _isTransfer
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
                    ITransferManager.Result valid = ITransferManager(module).verifyTransfer(_from, _to, _value, _data, _isTransfer);
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
     * @notice Validates a transfer with a TransferManager module if it exists
     * @dev TransferManager module has a key of 2
     * @param _from sender of transfer
     * @param _to receiver of transfer
     * @param _value value of transfer
     * @param _data data to indicate validation
     * @return bool
     */
    function verifyTransfer(address _from, address _to, uint256 _value, bytes memory _data) public returns(bool) {
        return _verifyTransfer(_from, _to, _value, _data, false);
    }

    /**
     * @notice Permanently freeze minting of this security token.
     * @dev It MUST NOT be possible to increase `totalSuppy` after this function is called.
     */
    function freezeMinting() external isMintingAllowed isEnabled("freezeMintingAllowed") onlyOwner {
        mintingFrozen = true;
        /*solium-disable-next-line security/no-block-members*/
        emit FreezeMinting(now);
    }

    /**
     * @notice Mints new tokens and assigns them to the target _investor.
     * @dev Can only be called by the issuer or STO attached to the token
     * @param _investor Address where the minted tokens will be delivered
     * @param _value Number of tokens be minted
     * @return success
     */
    function mint(address _investor, uint256 _value) public returns(bool success) {
        return mintWithData(_investor, _value, "");
    }

    /**
     * @notice mints new tokens and assigns them to the target _investor.
     * @dev Can only be called by the issuer or STO attached to the token
     * @param _investor Address where the minted tokens will be delivered
     * @param _value Number of tokens be minted
     * @param _data data to indicate validation
     * @return success
     */
    function mintWithData(
        address _investor,
        uint256 _value,
        bytes memory _data
    ) 
        public 
        onlyModuleOrOwner(MINT_KEY) 
        isMintingAllowed 
        returns(bool success) 
    {
        require(_updateTransfer(address(0), _investor, _value, _data), "Transfer invalid");
        _mint(_investor, _value);
        emit Minted(_investor, _value);
        return true;
    }

    /**
     * @notice Mints new tokens and assigns them to the target _investor.
     * @dev Can only be called by the issuer or STO attached to the token.
     * @param _investors A list of addresses to whom the minted tokens will be dilivered
     * @param _values A list of number of tokens get minted and transfer to corresponding address of the investor from _investor[] list
     * @return success
     */
    function mintMulti(address[] calldata _investors, uint256[] calldata _values) external returns(bool success) {
        require(_investors.length == _values.length, "Incorrect inputs");
        for (uint256 i = 0; i < _investors.length; i++) {
            mint(_investors[i], _values[i]);
        }
        return true;
    }

    /**
     * @notice Validate permissions with PermissionManager if it exists, If no Permission return false
     * @dev Note that IModule withPerm will allow ST owner all permissions anyway
     * @dev this allows individual modules to override this logic if needed (to not allow ST owner all permissions)
     * @param _delegate address of delegate
     * @param _module address of PermissionManager module
     * @param _perm the permissions
     * @return success
     */
    function checkPermission(address _delegate, address _module, bytes32 _perm) public view returns(bool) {
        for (uint256 i = 0; i < modules[PERMISSION_KEY].length; i++) {
            if (!modulesToData[modules[PERMISSION_KEY][i]].isArchived) return TokenLib.checkPermission(
                modules[PERMISSION_KEY],
                _delegate,
                _module,
                _perm
            );
        }
        return false;
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
        emit Burnt(_from, _value);
        return verified;
    }

    /**
     * @notice Burn function used to burn the securityToken
     * @param _value No. of tokens that get burned
     * @param _data data to indicate validation
     */
    function burnWithData(uint256 _value, bytes memory _data) public onlyModule(BURN_KEY) {
        require(_checkAndBurn(msg.sender, _value, _data), "Burn invalid");
    }

    function _checkAndBurnFrom(address _from, uint256 _value, bytes memory _data) internal returns(bool) {
        bool verified = _updateTransfer(_from, address(0), _value, _data);
        _burnFrom(_from, _value);
        emit Burnt(_from, _value);
        return verified;
    }

    /**
     * @notice Burn function used to burn the securityToken on behalf of someone else
     * @param _from Address for whom to burn tokens
     * @param _value No. of tokens that get burned
     * @param _data data to indicate validation
     */
    function burnFromWithData(address _from, uint256 _value, bytes memory _data) public onlyModule(BURN_KEY) {
        require(_checkAndBurnFrom(_from, _value, _data), "Burn invalid");
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
        emit CheckpointCreated(currentCheckpointId, now);
        return currentCheckpointId;
    }

    /**
     * @notice Gets list of times that checkpoints were created
     * @return List of checkpoint times
     */
    function getCheckpointTimes() external view returns(uint256[] memory) {
        return checkpointTimes;
    }

    /**
     * @notice Queries totalSupply as of a defined checkpoint
     * @param _checkpointId Checkpoint ID to query
     * @return uint256
     */
    function totalSupplyAt(uint256 _checkpointId) external view returns(uint256) {
        require(_checkpointId <= currentCheckpointId);
        return checkpointTotalSupply[_checkpointId];
    }

    /**
     * @notice Queries balances as of a defined checkpoint
     * @param _investor Investor to query balance for
     * @param _checkpointId Checkpoint ID to query as of
     */
    function balanceOfAt(address _investor, uint256 _checkpointId) public view returns(uint256) {
        require(_checkpointId <= currentCheckpointId);
        return TokenLib.getValueAt(checkpointBalances[_investor], _checkpointId, balanceOf(_investor));
    }

    /**
     * @notice Used by the issuer to set the controller addresses
     * @param _controller address of the controller
     */
    function setController(address _controller) public onlyOwner {
        require(!controllerDisabled);
        emit SetController(controller, _controller);
        controller = _controller;
    }

    /**
     * @notice Used by the issuer to permanently disable controller functionality
     * @dev enabled via feature switch "disableControllerAllowed"
     */
    function disableController() external isEnabled("disableControllerAllowed") onlyOwner {
        require(!controllerDisabled);
        controllerDisabled = true;
        delete controller;
        /*solium-disable-next-line security/no-block-members*/
        emit DisableController(now);
    }

    /**
     * @notice Used by a controller to execute a forced transfer
     * @param _from address from which to take tokens
     * @param _to address where to send tokens
     * @param _value amount of tokens to transfer
     * @param _data data to indicate validation
     * @param _log data attached to the transfer by controller to emit in event
     */
    function forceTransfer(address _from, address _to, uint256 _value, bytes memory _data, bytes memory _log) public onlyController {
        bool verified = _updateTransfer(_from, _to, _value, _data);
        _transfer(_from, _to, _value);
        emit ForceTransfer(msg.sender, _from, _to, _value, verified, _log);
    }

    /**
     * @notice Used by a controller to execute a forced burn
     * @param _from address from which to take tokens
     * @param _value amount of tokens to transfer
     * @param _data data to indicate validation
     * @param _log data attached to the transfer by controller to emit in event
     */
    function forceBurn(address _from, uint256 _value, bytes memory _data, bytes memory _log) public onlyController {
        bool verified = _checkAndBurn(_from, _value, _data);
        emit ForceBurn(msg.sender, _from, _value, verified, _log);
    }

    /**
     * @notice Returns the version of the SecurityToken
     */
    function getVersion() external view returns(uint8[] memory) {
        uint8[] memory _version = new uint8[](3);
        _version[0] = securityTokenVersion.major;
        _version[1] = securityTokenVersion.minor;
        _version[2] = securityTokenVersion.patch;
        return _version;
    }

}
