pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/Math.sol";
import "../interfaces/IERC20.sol";
import "../interfaces/IModule.sol";
import "../interfaces/IModuleFactory.sol";
import "../interfaces/IModuleRegistry.sol";
import "../interfaces/IFeatureRegistry.sol";
import "../modules/TransferManager/ITransferManager.sol";
import "../modules/PermissionManager/IPermissionManager.sol";
import "../interfaces/ITokenBurner.sol";
import "../RegistryUpdater.sol";
import "../libraries/Util.sol";
import "openzeppelin-solidity/contracts/ReentrancyGuard.sol";
import "openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol";

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
contract SecurityToken is StandardToken, DetailedERC20, ReentrancyGuard, RegistryUpdater {
    using SafeMath for uint256;

    bytes32 public constant securityTokenVersion = "0.0.2";

    // off-chain hash
    string public tokenDetails;

    uint8 public constant PERMISSIONMANAGER_KEY = 1;
    uint8 public constant TRANSFERMANAGER_KEY = 2;
    uint8 public constant STO_KEY = 3;
    uint8 public constant CHECKPOINT_KEY = 4;
    uint256 public granularity;

    // Value of current checkpoint
    uint256 public currentCheckpointId;

    // Total number of non-zero token holders
    uint256 public investorCount;

    // List of token holders
    address[] public investors;

    // Reference to token burner contract
    ITokenBurner public tokenBurner;

    // Use to temporarily halt all transactions
    bool public transfersFrozen;

    // Use to permanently halt all minting
    bool public mintingFrozen;

    // Use to permanently halt controller actions
    bool public controllerDisabled;

    // address whitelisted by issuer as controller
    address public controller;

    struct ModuleData {
        bytes32 name;
        address module;
        address moduleFactory;
        bool isArchived;
        uint8 moduleType;
        uint256 moduleIndex;
        uint256 nameIndex;
    }

    // Structures to maintain checkpoints of balances for governance / dividends
    struct Checkpoint {
        uint256 checkpointId;
        uint256 value;
    }

    mapping (address => Checkpoint[]) public checkpointBalances;
    Checkpoint[] public checkpointTotalSupply;

    // Records added modules - module list should be order agnostic!
    mapping (uint8 => address[]) public modules;

    // Records information about the module
    mapping (address => ModuleData) modulesToData;

    // Records added module names - module list should be order agnostic!
    mapping (bytes32 => address[]) names;

    mapping (address => bool) public investorListed;

    // Emit at the time when module get added
    event LogModuleAdded(
        uint8 indexed _type,
        bytes32 _name,
        address _moduleFactory,
        address _module,
        uint256 _moduleCost,
        uint256 _budget,
        uint256 _timestamp
    );

    // Emit when the token details get updated
    event LogUpdateTokenDetails(string _oldDetails, string _newDetails);
    // Emit when the granularity get changed
    event LogGranularityChanged(uint256 _oldGranularity, uint256 _newGranularity);
    // Emit when Module get removed from the securityToken
    event LogModuleRemoved(uint8 indexed _type, address _module, uint256 _timestamp);
    // Emit when Module get archived from the securityToken
    event LogModuleArchived(uint8 indexed _type, address _module, uint256 _timestamp);
    // Emit when Module get unarchived from the securityToken
    event LogModuleUnarchived(uint8 indexed _type, address _module, uint256 _timestamp);
    // Emit when the budget allocated to a module is changed
    event LogModuleBudgetChanged(uint8 indexed _moduleType, address _module, uint256 _oldBudget, uint256 _budget);
    // Emit when transfers are frozen or unfrozen
    event LogFreezeTransfers(bool _status, uint256 _timestamp);
    // Emit when new checkpoint created
    event LogCheckpointCreated(uint256 indexed _checkpointId, uint256 _timestamp);
    // Emit when is permanently frozen by the issuer
    event LogFreezeMinting(uint256 _timestamp);
    // Change the STR address in the event of a upgrade
    event LogChangeSTRAddress(address indexed _oldAddress, address indexed _newAddress);
    // Events to log minting and burning
    event Minted(address indexed to, uint256 amount);
    event Burnt(address indexed _burner, uint256 _value);

    // Events to log controller actions
    event LogSetController(address indexed _oldController, address indexed _newController);
    event LogForceTransfer(address indexed _controller, address indexed _from, address indexed _to, uint256 _amount, bool _verifyTransfer, bytes _data);
    event LogDisableController(uint256 _timestamp);

    function isModule(address _module, uint8 _type) internal view returns (bool) {
        require(modulesToData[msg.sender].module == msg.sender, "Address mismatch");
        require(modulesToData[msg.sender].moduleType == _type, "Type mismatch");
        require(!modulesToData[msg.sender].isArchived, "Module archived");
        return true;
    }

    // Require msg.sender to be the specified module type
    modifier onlyModule(uint8 _type) {
        require(isModule(msg.sender, _type));
        _;
    }

    // Require msg.sender to be the specified module type or the owner of the token
    modifier onlyModuleOrOwner(uint8 _type) {
        if (msg.sender == owner) {
            _;
        } else {
            require(isModule(msg.sender, _type));
            _;
        }
    }

    modifier checkGranularity(uint256 _amount) {
        require(_amount % granularity == 0, "Unable to modify token balances at this granularity");
        _;
    }

    modifier isMintingAllowed() {
        require(!mintingFrozen, "Minting is permanently frozen");
        _;
    }

    modifier isEnabled(string _nameKey) {
        require(IFeatureRegistry(featureRegistry).getFeatureStatus(_nameKey));
        _;
    }

    /**
     * @notice Revert if called by account which is not a controller
     */
    modifier onlyController() {
        require(msg.sender == controller);
        require(!controllerDisabled);
        _;
    }

    /**
     * @notice Constructor
     * @param _name Name of the SecurityToken
     * @param _symbol Symbol of the Token
     * @param _decimals Decimals for the securityToken
     * @param _granularity granular level of the token
     * @param _tokenDetails Details of the token that are stored off-chain (IPFS hash)
     * @param _polymathRegistry Contract address of the polymath registry
     */
    constructor (
        string _name,
        string _symbol,
        uint8 _decimals,
        uint256 _granularity,
        string _tokenDetails,
        address _polymathRegistry
    )
    public
    DetailedERC20(_name, _symbol, _decimals)
    RegistryUpdater(_polymathRegistry)
    {
        //When it is created, the owner is the STR
        updateFromRegistry();
        tokenDetails = _tokenDetails;
        granularity = _granularity;
    }

    /**
     * @notice Function used to attach the module in security token
     * @param _moduleFactory Contract address of the module factory that needs to be attached
     * @param _data Data used for the intialization of the module factory variables
     * @param _maxCost Maximum cost of the Module factory
     * @param _budget Budget of the Module factory
     */
    function addModule(
        address _moduleFactory,
        bytes _data,
        uint256 _maxCost,
        uint256 _budget
    ) external onlyOwner nonReentrant {
        _addModule(_moduleFactory, _data, _maxCost, _budget);
    }

    /**
    * @notice _addModule handles the attachment (or replacement) of modules for the ST
    * @dev  E.G.: On deployment (through the STR) ST gets a TransferManager module attached to it
    * @dev to control restrictions on transfers.
    * @dev You are allowed to add a new moduleType if:
    * @dev - there is no existing module of that type yet added
    * @dev - the last member of the module list is replacable
    * @param _moduleFactory is the address of the module factory to be added
    * @param _data is data packed into bytes used to further configure the module (See STO usage)
    * @param _maxCost max amount of POLY willing to pay to module. (WIP)
    */
    function _addModule(address _moduleFactory, bytes _data, uint256 _maxCost, uint256 _budget) internal {
        //Check that module exists in registry - will throw otherwise
        IModuleRegistry(moduleRegistry).useModule(_moduleFactory);
        IModuleFactory moduleFactory = IModuleFactory(_moduleFactory);
        uint8 moduleType = moduleFactory.getType();
        /* require(modules[moduleType].length < MAX_MODULES, "Limit of MAX MODULES is reached"); */
        uint256 moduleCost = moduleFactory.getSetupCost();
        require(moduleCost <= _maxCost, "Max Cost is always be greater than module cost");
        //Approve fee for module
        require(ERC20(polyToken).approve(_moduleFactory, moduleCost), "Not able to approve the module cost");
        //Creates instance of module from factory
        address module = moduleFactory.deploy(_data);
        require(modulesToData[module].module == address(0), "Module already exists");
        //Approve ongoing budget
        require(ERC20(polyToken).approve(module, _budget), "Not able to approve the budget");
        //Add to SecurityToken module map
        bytes32 moduleName = moduleFactory.getName();
        modulesToData[module] = ModuleData(moduleName, module, _moduleFactory, false, moduleType, modules[moduleType].length, names[moduleName].length);
        modules[moduleType].push(module);
        names[moduleName].push(module);
        //Emit log event
        emit LogModuleAdded(moduleType, moduleName, _moduleFactory, module, moduleCost, _budget, now);
    }

    /**
    * @notice Archives a module attached to the SecurityToken
    * @param _module address of module to archive
    */
    function archiveModule(address _module) external onlyOwner {
        require(!modulesToData[_module].isArchived, "Module not unarchived");
        require(modulesToData[_module].module != address(0), "Module missing");
        emit LogModuleArchived(modulesToData[_module].moduleType, _module, now);
        modulesToData[_module].isArchived = true;
    }

    /**
    * @notice Unarchives a module attached to the SecurityToken
    * @param _module address of module to unarchive
    */
    function unarchiveModule(address _module) external onlyOwner {
        require(modulesToData[_module].isArchived, "Module not archived");
        emit LogModuleUnarchived(modulesToData[_module].moduleType, _module, now);
        modulesToData[_module].isArchived = false;
    }

    /**
    * @notice Removes a module attached to the SecurityToken
    * @param _module address of module to unarchive
    */
    function removeModule(address _module) external onlyOwner {
        require(modulesToData[_module].isArchived, "Module not archived");
        require(modulesToData[_module].module != address(0), "Module missing");
        emit LogModuleRemoved(modulesToData[_module].moduleType, _module, now);
        // Remove from module type list
        uint256 index = modulesToData[_module].moduleIndex;
        uint8 moduleType = modulesToData[_module].moduleType;
        uint256 length = modules[moduleType].length;
        modules[moduleType][index] = modules[moduleType][length - 1];
        modules[moduleType].length = length - 1;
        if ((length - 1) != index) {
            modulesToData[modules[moduleType][index]].moduleIndex = index;
        }
        // Remove from module names list
        index = modulesToData[_module].nameIndex;
        bytes32 name = modulesToData[_module].name;
        length = names[name].length;
        names[name][index] = names[name][length - 1];
        names[name].length = length - 1;
        if ((length - 1) != index) {
            modulesToData[modules[moduleType][index]].nameIndex = index;
        }
        // Remove from modulesToData
        delete modulesToData[_module];
    }

    /**
     * @notice Returns module list for a module type
     * @param _module address of the module
     * @return bytes32 name
     * @return address module address
     * @return address module factory address
     * @return bool module archived
     * @return uint8 module type
     * @return uint256 module index
     * @return uint256 name index

     */
    function getModule(address _module) external view returns (bytes32, address, address, bool, uint8, uint256, uint256) {
        return (modulesToData[_module].name,
          modulesToData[_module].module,
          modulesToData[_module].moduleFactory,
          modulesToData[_module].isArchived,
          modulesToData[_module].moduleType,
          modulesToData[_module].moduleIndex,
          modulesToData[_module].nameIndex);
    }

    /**
     * @notice returns module list for a module name
     * @param _name name of the module
     * @return address[] list of modules with this name
     */
    function getModulesByName(bytes32 _name) external view returns (address[]) {
        return names[_name];
    }

    /**
     * @notice returns module list for a module type
     * @param _type type of the module
     * @return address[] list of modules with this type
     */
    function getModulesByType(uint8 _type) external view returns (address[]) {
        return modules[_type];
    }

    /**
    * @notice allows the owner to withdraw unspent POLY stored by them on the ST.
    * @dev Owner can transfer POLY to the ST which will be used to pay for modules that require a POLY fee.
    * @param _amount amount of POLY to withdraw
    */
    function withdrawPoly(uint256 _amount) external onlyOwner {
        require(ERC20(polyToken).transfer(owner, _amount), "In-sufficient balance");
    }

    /**
    * @notice allows owner to approve more POLY to one of the modules
    * @param _module module address
    * @param _budget new budget
    */
    function changeModuleBudget(address _module, uint256 _budget) external onlyOwner {
        require(modulesToData[_module].module != address(0), "Module missing");
        uint256 _currentAllowance = IERC20(polyToken).allowance(address(this), _module);
        if (_budget < _currentAllowance) {
            require(IERC20(polyToken).decreaseApproval(_module, _currentAllowance.sub(_budget)), "Insufficient balance to decreaseApproval");
        } else {
            require(IERC20(polyToken).increaseApproval(_module, _budget.sub(_currentAllowance)), "Insufficient balance to increaseApproval");
        }
        emit LogModuleBudgetChanged(modulesToData[_module].moduleType, _module, _currentAllowance, _budget);
    }

    /**
     * @notice change the tokenDetails
     * @param _newTokenDetails New token details
     */
    function updateTokenDetails(string _newTokenDetails) external onlyOwner {
        emit LogUpdateTokenDetails(tokenDetails, _newTokenDetails);
        tokenDetails = _newTokenDetails;
    }

    /**
    * @notice allows owner to change token granularity
    * @param _granularity granularity level of the token
    */
    function changeGranularity(uint256 _granularity) external onlyOwner {
        require(_granularity != 0, "Granularity can not be 0");
        emit LogGranularityChanged(granularity, _granularity);
        granularity = _granularity;
    }

    /**
    * @notice keeps track of the number of non-zero token holders
    * @param _from sender of transfer
    * @param _to receiver of transfer
    * @param _value value of transfer
    */
    function _adjustInvestorCount(address _from, address _to, uint256 _value) internal {
        if ((_value == 0) || (_from == _to)) {
            return;
        }
        // Check whether receiver is a new token holder
        if ((balanceOf(_to) == 0) && (_to != address(0))) {
            investorCount = investorCount.add(1);
        }
        // Check whether sender is moving all of their tokens
        if (_value == balanceOf(_from)) {
            investorCount = investorCount.sub(1);
        }
        //Also adjust investor list
        if (!investorListed[_to] && (_to != address(0))) {
            investors.push(_to);
            investorListed[_to] = true;
        }

    }

    /**
    * @notice removes addresses with zero balances from the investors list
    * @param _start Index in investor list at which to start removing zero balances
    * @param _iters Max number of iterations of the for loop
    * NB - pruning this list will mean you may not be able to iterate over investors on-chain as of a historical checkpoint
    */
    function pruneInvestors(uint256 _start, uint256 _iters) external onlyOwner {
        for (uint256 i = _start; i < Math.min256(_start.add(_iters), investors.length); i++) {
            if ((i < investors.length) && (balanceOf(investors[i]) == 0)) {
                investorListed[investors[i]] = false;
                investors[i] = investors[investors.length - 1];
                investors.length--;
            }
        }
    }

    /**
     * @notice gets length of investors array
     * NB - this length may differ from investorCount if list has not been pruned of zero balance investors
     * @return length
     */
    function getInvestorsLength() external view returns(uint256) {
        return investors.length;
    }

    /**
     * @notice freeze transfers
     */
    function freezeTransfers() external onlyOwner {
        require(!transfersFrozen);
        transfersFrozen = true;
        emit LogFreezeTransfers(true, now);
    }

    /**
     * @notice unfreeze transfers
     */
    function unfreezeTransfers() external onlyOwner {
        require(transfersFrozen);
        transfersFrozen = false;
        emit LogFreezeTransfers(false, now);
    }

    /**
     * @notice adjust totalsupply at checkpoint after minting or burning tokens
     */
    function _adjustTotalSupplyCheckpoints() internal {
        _adjustCheckpoints(checkpointTotalSupply, totalSupply());
    }

    /**
     * @notice adjust token holder balance at checkpoint after a token transfer
     * @param _investor address of the token holder affected
     */
    function _adjustBalanceCheckpoints(address _investor) internal {
        _adjustCheckpoints(checkpointBalances[_investor], balanceOf(_investor));
    }

    /**
     * @notice store the changes to the checkpoint objects
     * @param _checkpoints the affected checkpoint object array
     * @param _newValue the new value that needs to be stored
     */
    function _adjustCheckpoints(Checkpoint[] storage _checkpoints, uint256 _newValue) internal {
        //No checkpoints set yet
        if (currentCheckpointId == 0) {
            return;
        }
        //No previous checkpoint data - add current balance against checkpoint
        if (_checkpoints.length == 0) {
            _checkpoints.push(
                Checkpoint({
                    checkpointId: currentCheckpointId,
                    value: _newValue
                })
            );
            return;
        }
        //No new checkpoints since last update
        if (_checkpoints[_checkpoints.length - 1].checkpointId == currentCheckpointId) {
            return;
        }
        //New checkpoint, so record balance
        _checkpoints.push(
            Checkpoint({
                checkpointId: currentCheckpointId,
                value: _newValue
            })
        );
    }

    /**
     * @notice Overloaded version of the transfer function
     * @param _to receiver of transfer
     * @param _value value of transfer
     * @return bool success
     */
    function transfer(address _to, uint256 _value) public returns (bool success) {
        _adjustInvestorCount(msg.sender, _to, _value);
        require(_verifyTransfer(msg.sender, _to, _value, true), "Transfer is not valid");
        _adjustBalanceCheckpoints(msg.sender);
        _adjustBalanceCheckpoints(_to);
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
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        _adjustInvestorCount(_from, _to, _value);
        require(_verifyTransfer(_from, _to, _value, true), "Transfer is not valid");
        _adjustBalanceCheckpoints(_from);
        _adjustBalanceCheckpoints(_to);
        require(super.transferFrom(_from, _to, _value));
        return true;
    }

    /**
     * @notice validate transfer with TransferManager module if it exists
     * @dev TransferManager module has a key of 2
     * @param _from sender of transfer
     * @param _to receiver of transfer
     * @param _amount value of transfer
     * @param _isTransfer whether transfer is being executed
     * @return bool
     */
    function _verifyTransfer(address _from, address _to, uint256 _amount, bool _isTransfer) internal checkGranularity(_amount) returns (bool) {
        if (!transfersFrozen) {
            if (modules[TRANSFERMANAGER_KEY].length == 0) {
                return true;
            }
            bool isInvalid = false;
            bool isValid = false;
            bool isForceValid = false;
            bool unarchived = false;
            address module;
            for (uint8 i = 0; i < modules[TRANSFERMANAGER_KEY].length; i++) {
                module = modules[TRANSFERMANAGER_KEY][i];
                if (!modulesToData[module].isArchived) {
                    unarchived = true;
                    ITransferManager.Result valid = ITransferManager(module).verifyTransfer(_from, _to, _amount, _isTransfer);
                    if (valid == ITransferManager.Result.INVALID) {
                        isInvalid = true;
                    }
                    if (valid == ITransferManager.Result.VALID) {
                        isValid = true;
                    }
                    if (valid == ITransferManager.Result.FORCE_VALID) {
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
     * @notice validate transfer with TransferManager module if it exists
     * @dev TransferManager module has a key of 2
     * @param _from sender of transfer
     * @param _to receiver of transfer
     * @param _amount value of transfer
     * @return bool
     */
    function verifyTransfer(address _from, address _to, uint256 _amount) public returns (bool) {
        return _verifyTransfer(_from, _to, _amount, false);
    }

    /**
     * @notice Permanently freeze minting of this security token.
     * @dev It MUST NOT be possible to increase `totalSuppy` after this function is called.
     */
    function freezeMinting() external isMintingAllowed() isEnabled("freezeMintingAllowed") onlyOwner {
        mintingFrozen = true;
        emit LogFreezeMinting(now);
    }

    /**
     * @notice mints new tokens and assigns them to the target _investor.
     * @dev Can only be called by the issuer or STO attached to the token
     * @param _investor Address where the minted tokens will be delivered
     * @param _amount Number of tokens be minted
     * @return success
     */
    function mint(address _investor, uint256 _amount) public onlyModuleOrOwner(STO_KEY) checkGranularity(_amount) isMintingAllowed() returns (bool success) {
        require(_investor != address(0), "Investor address should not be 0x");
        _adjustInvestorCount(address(0), _investor, _amount);
        require(_verifyTransfer(address(0), _investor, _amount, true), "Transfer is not valid");
        _adjustBalanceCheckpoints(_investor);
        _adjustTotalSupplyCheckpoints();
        totalSupply_ = totalSupply_.add(_amount);
        balances[_investor] = balances[_investor].add(_amount);
        emit Minted(_investor, _amount);
        emit Transfer(address(0), _investor, _amount);
        return true;
    }

    /**
     * @notice mints new tokens and assigns them to the target _investor.
     * @dev Can only be called by the issuer or STO attached to the token.
     * @param _investors A list of addresses to whom the minted tokens will be dilivered
     * @param _amounts A list of number of tokens get minted and transfer to corresponding address of the investor from _investor[] list
     * @return success
     */
    function mintMulti(address[] _investors, uint256[] _amounts) external onlyModuleOrOwner(STO_KEY) returns (bool success) {
        require(_investors.length == _amounts.length, "Mis-match in the length of the arrays");
        for (uint256 i = 0; i < _investors.length; i++) {
            mint(_investors[i], _amounts[i]);
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
        if (modules[PERMISSIONMANAGER_KEY].length == 0) {
            return false;
        }

        for (uint8 i = 0; i < modules[PERMISSIONMANAGER_KEY].length; i++) {
            if (IPermissionManager(modules[PERMISSIONMANAGER_KEY][i]).checkPermission(_delegate, _module, _perm)) {
                return true;
            }
        }
    }

    /**
     * @notice used to set the token Burner address. It only be called by the owner
     * @param _tokenBurner Address of the token burner contract
     */
    function setTokenBurner(address _tokenBurner) external onlyOwner {
        tokenBurner = ITokenBurner(_tokenBurner);
    }

    /**
     * @notice Burn function used to burn the securityToken
     * @param _value No. of token that get burned
     */
    function burn(uint256 _value) checkGranularity(_value) public returns (bool) {
        _adjustInvestorCount(msg.sender, address(0), _value);
        require(tokenBurner != address(0), "Token Burner contract address is not set yet");
        require(_verifyTransfer(msg.sender, address(0), _value, true), "Transfer is not valid");
        require(_value <= balances[msg.sender], "Value should no be greater than the balance of msg.sender");
        _adjustBalanceCheckpoints(msg.sender);
        _adjustTotalSupplyCheckpoints();
        // no need to require value <= totalSupply, since that would imply the
        // sender's balance is greater than the totalSupply, which *should* be an assertion failure

        balances[msg.sender] = balances[msg.sender].sub(_value);
        require(tokenBurner.burn(msg.sender, _value), "Token burner process is not validated");
        totalSupply_ = totalSupply_.sub(_value);
        emit Burnt(msg.sender, _value);
        emit Transfer(msg.sender, address(0), _value);
        return true;
    }

    /**
     * @notice Creates a checkpoint that can be used to query historical balances / totalSuppy
     * @return uint256
     */
    function createCheckpoint() external onlyModuleOrOwner(CHECKPOINT_KEY) returns(uint256) {
        require(currentCheckpointId < 2**256 - 1);
        currentCheckpointId = currentCheckpointId + 1;
        emit LogCheckpointCreated(currentCheckpointId, now);
        return currentCheckpointId;
    }

    /**
     * @notice Queries totalSupply as of a defined checkpoint
     * @param _checkpointId Checkpoint ID to query
     * @return uint256
     */
    function totalSupplyAt(uint256 _checkpointId) external view returns(uint256) {
        return _getValueAt(checkpointTotalSupply, _checkpointId, totalSupply());
    }

    /**
     * @notice Queries value at a defined checkpoint
     * @param checkpoints is array of Checkpoint objects
     * @param _checkpointId Checkpoint ID to query
     * @param _currentValue Current value of checkpoint
     * @return uint256
     */
    function _getValueAt(Checkpoint[] storage checkpoints, uint256 _checkpointId, uint256 _currentValue) internal view returns(uint256) {
        require(_checkpointId <= currentCheckpointId);
        //Checkpoint id 0 is when the token is first created - everyone has a zero balance
        if (_checkpointId == 0) {
          return 0;
        }
        if (checkpoints.length == 0) {
            return _currentValue;
        }
        if (checkpoints[0].checkpointId >= _checkpointId) {
            return checkpoints[0].value;
        }
        if (checkpoints[checkpoints.length - 1].checkpointId < _checkpointId) {
            return _currentValue;
        }
        if (checkpoints[checkpoints.length - 1].checkpointId == _checkpointId) {
            return checkpoints[checkpoints.length - 1].value;
        }
        uint256 min = 0;
        uint256 max = checkpoints.length - 1;
        while (max > min) {
            uint256 mid = (max + min) / 2;
            if (checkpoints[mid].checkpointId == _checkpointId) {
                max = mid;
                break;
            }
            if (checkpoints[mid].checkpointId < _checkpointId) {
                min = mid + 1;
            } else {
                max = mid;
            }
        }
        return checkpoints[max].value;
    }

    /**
     * @notice Queries balances as of a defined checkpoint
     * @param _investor Investor to query balance for
     * @param _checkpointId Checkpoint ID to query as of
     */
    function balanceOfAt(address _investor, uint256 _checkpointId) public view returns(uint256) {
        return _getValueAt(checkpointBalances[_investor], _checkpointId, balanceOf(_investor));
    }

    /**
     * @notice Use by the issuer ot set the controller addresses
     * @param _controller address of the controller
     */
    function setController(address _controller) public onlyOwner {
        require(!controllerDisabled);
        emit LogSetController(controller, _controller);
        controller = _controller;
    }

    /**
     * @notice Use by the issuer to permanently disable controller functionality
     * @dev enabled via feature switch "disableControllerAllowed"
     */
    function disableController() external isEnabled("disableControllerAllowed") onlyOwner {
        require(!controllerDisabled);
        controllerDisabled = true;
        delete controller;
        emit LogDisableController(now);
    }

    /**
     * @notice Use by a controller to execute a foced transfer
     * @param _from address from which to take tokens
     * @param _to address where to send tokens
     * @param _value amount of tokens to transfer
     * @param _data data attached to the transfer by controller to emit in event
     */
    function forceTransfer(address _from, address _to, uint256 _value, bytes _data) public onlyController returns(bool) {
        _adjustInvestorCount(_from, _to, _value);
        bool verified = _verifyTransfer(_from, _to, _value, true);
        _adjustBalanceCheckpoints(_from);
        _adjustBalanceCheckpoints(_to);

        require(_to != address(0));
        require(_value <= balances[_from]);
        balances[_from] = balances[_from].sub(_value);
        balances[_to] = balances[_to].add(_value);

        emit LogForceTransfer(msg.sender, _from, _to, _value, verified, _data);
        emit Transfer(_from, _to, _value);
        return true;
    }

}
