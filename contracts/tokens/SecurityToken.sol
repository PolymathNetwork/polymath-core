pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/math/Math.sol";
import "../interfaces/ISecurityToken.sol";
import "../interfaces/IModule.sol";
import "../interfaces/IModuleFactory.sol";
import "../interfaces/IModuleRegistry.sol";
import "../interfaces/IST20.sol";
import "../modules/TransferManager/ITransferManager.sol";
import "../modules/PermissionManager/IPermissionManager.sol";
import "../interfaces/IRegistry.sol";
import "../interfaces/ITokenBurner.sol";

/**
* @title Security Token contract
* @notice SecurityToken is an ERC20 token with added capabilities:
* @notice - Implements the ST-20 Interface
* @notice - Transfers are restricted
* @notice - Modules can be attached to it to control its behaviour
* @notice - ST should not be deployed directly, but rather the SecurityTokenRegistry should be used
*/
contract SecurityToken is ISecurityToken {
    using SafeMath for uint256;

    bytes32 public securityTokenVersion = "0.0.1";

    // Reference to token burner contract
    ITokenBurner public tokenBurner;

    // Use to halt all the transactions
    bool public freeze = false;

    // Reference to STR contract
    address public securityTokenRegistry;

    struct ModuleData {
        bytes32 name;
        address moduleAddress;
    }

    // Structures to maintain checkpoints of balances for governance / dividends
    struct Checkpoint {
        uint256 checkpointId;
        uint256 value;
    }

    mapping (address => Checkpoint[]) public checkpointBalances;
    Checkpoint[] public checkpointTotalSupply;

    bool public finishedIssuerMinting = false;
    bool public finishedSTOMinting = false;

    mapping (bytes4 => bool) transferFunctions;

    // Module list should be order agnostic!
    mapping (uint8 => ModuleData[]) public modules;

    uint8 public constant MAX_MODULES = 20;

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
    // Emit when the budget allocated to a module is changed
    event LogModuleBudgetChanged(uint8 indexed _moduleType, address _module, uint256 _budget);
    // Emit when all the transfers get freeze
    event LogFreezeTransfers(bool _freeze, uint256 _timestamp);
    // Emit when new checkpoint created
    event LogCheckpointCreated(uint256 indexed _checkpointId, uint256 _timestamp);
    // Emit when the minting get finished for the Issuer
    event LogFinishMintingIssuer(uint256 _timestamp);
    // Emit when the minting get finished for the STOs
    event LogFinishMintingSTO(uint256 _timestamp);
    // Change the STR address in the event of a upgrade
    event LogChangeSTRAddress(address indexed _oldAddress, address indexed _newAddress);

    // If _fallback is true, then for STO module type we only allow the module if it is set, if it is not set we only allow the owner 
    // for other _moduleType we allow both issuer and module. 
    modifier onlyModule(uint8 _moduleType, bool _fallback) {
      //Loop over all modules of type _moduleType
        bool isModuleType = false;
        for (uint8 i = 0; i < modules[_moduleType].length; i++) {
            isModuleType = isModuleType || (modules[_moduleType][i].moduleAddress == msg.sender);
        }
        if (_fallback && !isModuleType) {
            if (_moduleType == STO_KEY)
                require(modules[_moduleType].length == 0 && msg.sender == owner, "Sender is not owner or STO module is attached");
            else
                require(msg.sender == owner, "Sender is not owner");
        } else {
            require(isModuleType, "Sender is not correct module type");
        }
        _;
    }

    modifier checkGranularity(uint256 _amount) {
        require(_amount.div(granularity).mul(granularity) == _amount, "Unable to modify token balances at this granularity");
        _;
    }

    // Checks whether the minting is allowed or not, check for the owner if owner is no the msg.sender then check
    // for the finishedSTOMinting flag because only STOs and owner are allowed for minting
    modifier isMintingAllowed() {
        if (msg.sender == owner) {
            require(!finishedIssuerMinting, "Minting is finished for Issuer");
        } else {
            require(!finishedSTOMinting, "Minting is finished for STOs");
        }
        _;
    }

    /**
     * @notice Constructor
     * @param _name Name of the SecurityToken
     * @param _symbol Symbol of the Token
     * @param _decimals Decimals for the securityToken
     * @param _granularity granular level of the token
     * @param _tokenDetails Details of the token that are stored off-chain (IPFS hash)
     * @param _securityTokenRegistry Contract address of the security token registry
     */
    constructor (
        string _name,
        string _symbol,
        uint8 _decimals,
        uint256 _granularity,
        string _tokenDetails,
        address _securityTokenRegistry
    )
    public
    DetailedERC20(_name, _symbol, _decimals)
    {
        //When it is created, the owner is the STR
        securityTokenRegistry = _securityTokenRegistry;
        tokenDetails = _tokenDetails;
        granularity = _granularity;
        transferFunctions[bytes4(keccak256("transfer(address,uint256)"))] = true;
        transferFunctions[bytes4(keccak256("transferFrom(address,address,uint256)"))] = true;
        transferFunctions[bytes4(keccak256("mint(address,uint256)"))] = true;
        transferFunctions[bytes4(keccak256("burn(uint256)"))] = true;
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
    ) external onlyOwner {
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
        IModuleRegistry(IRegistry(securityTokenRegistry).getAddress("ModuleRegistry")).useModule(_moduleFactory);
        IModuleFactory moduleFactory = IModuleFactory(_moduleFactory);
        require(modules[moduleFactory.getType()].length < MAX_MODULES, "Limit of MAX MODULES is reached");
        uint256 moduleCost = moduleFactory.setupCost();
        require(moduleCost <= _maxCost, "Max Cost is always be greater than module cost");
        //Approve fee for module
        require(ERC20(IRegistry(securityTokenRegistry).getAddress("PolyToken")).approve(_moduleFactory, moduleCost), "Not able to approve the module cost");
        //Creates instance of module from factory
        address module = moduleFactory.deploy(_data);
        //Approve ongoing budget
        require(ERC20(IRegistry(securityTokenRegistry).getAddress("PolyToken")).approve(module, _budget), "Not able to approve the budget");
        //Add to SecurityToken module map
        modules[moduleFactory.getType()].push(ModuleData(moduleFactory.getName(), module));
        //Emit log event
        emit LogModuleAdded(moduleFactory.getType(), moduleFactory.getName(), _moduleFactory, module, moduleCost, _budget, now);
    }

    /**
    * @notice Removes a module attached to the SecurityToken
    * @param _moduleType is which type of module we are trying to remove
    * @param _moduleIndex is the index of the module within the chosen type
    */
    function removeModule(uint8 _moduleType, uint8 _moduleIndex) external onlyOwner {
        require(_moduleIndex < modules[_moduleType].length,
        "Module index doesn't exist as per the choosen module type");
        require(modules[_moduleType][_moduleIndex].moduleAddress != address(0),
        "Module contract address should not be 0x");
        //Take the last member of the list, and replace _moduleIndex with this, then shorten the list by one
        emit LogModuleRemoved(_moduleType, modules[_moduleType][_moduleIndex].moduleAddress, now);
        modules[_moduleType][_moduleIndex] = modules[_moduleType][modules[_moduleType].length - 1];
        modules[_moduleType].length = modules[_moduleType].length - 1;
    }

    /**
     * @notice Returns module list for a module type
     * @param _moduleType is which type of module we are trying to get
     * @param _moduleIndex is the index of the module within the chosen type
     * @return bytes32
     * @return address
     */
    function getModule(uint8 _moduleType, uint _moduleIndex) public view returns (bytes32, address) {
        if (modules[_moduleType].length > 0) {
            return (
                modules[_moduleType][_moduleIndex].name,
                modules[_moduleType][_moduleIndex].moduleAddress
            );
        } else {
            return ("", address(0));
        }

    }

    /**
     * @notice returns module list for a module name - will return first match
     * @param _moduleType is which type of module we are trying to get
     * @param _name is the name of the module within the chosen type
     * @return bytes32
     * @return address
     */
    function getModuleByName(uint8 _moduleType, bytes32 _name) public view returns (bytes32, address) {
        if (modules[_moduleType].length > 0) {
            for (uint256 i = 0; i < modules[_moduleType].length; i++) {
                if (modules[_moduleType][i].name == _name) {
                  return (
                      modules[_moduleType][i].name,
                      modules[_moduleType][i].moduleAddress
                  );
                }
            }
            return ("", address(0));
        } else {
            return ("", address(0));
        }
    }

    /**
    * @notice allows the owner to withdraw unspent POLY stored by them on the ST.
    * @dev Owner can transfer POLY to the ST which will be used to pay for modules that require a POLY fee.
    * @param _amount amount of POLY to withdraw
    */
    function withdrawPoly(uint256 _amount) public onlyOwner {
        require(ERC20(IRegistry(securityTokenRegistry).getAddress("PolyToken")).transfer(owner, _amount), "In-sufficient balance");
    }

    /**
    * @notice allows owner to approve more POLY to one of the modules
    * @param _moduleType module type
    * @param _moduleIndex module index
    * @param _budget new budget
    */
    function changeModuleBudget(uint8 _moduleType, uint8 _moduleIndex, uint256 _budget) public onlyOwner {
        require(_moduleType != 0, "Module type cannot be zero");
        require(_moduleIndex < modules[_moduleType].length, "Incorrrect module index");
        require(ERC20(IRegistry(securityTokenRegistry).getAddress("PolyToken")).approve(modules[_moduleType][_moduleIndex].moduleAddress, _budget), "Insufficient balance to approve");
        emit LogModuleBudgetChanged(_moduleType, modules[_moduleType][_moduleIndex].moduleAddress, _budget);
    }

    /**
     * @notice change the tokenDetails
     * @param _newTokenDetails New token details
     */
    function updateTokenDetails(string _newTokenDetails) public onlyOwner {
        emit LogUpdateTokenDetails(tokenDetails, _newTokenDetails);
        tokenDetails = _newTokenDetails;
    }

    /**
    * @notice allows owner to change token granularity
    * @param _granularity granularity level of the token
    */
    function changeGranularity(uint256 _granularity) public onlyOwner {
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
    function adjustInvestorCount(address _from, address _to, uint256 _value) internal {
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
    function pruneInvestors(uint256 _start, uint256 _iters) public onlyOwner {
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
    function getInvestorsLength() public view returns(uint256) {
        return investors.length;
    }

    /**
     * @notice freeze all the transfers
     */
    function freezeTransfers() public onlyOwner {
        require(!freeze);
        freeze = true;
        emit LogFreezeTransfers(freeze, now);
    }

    /**
     * @notice un-freeze all the transfers
     */
    function unfreezeTransfers() public onlyOwner {
        require(freeze);
        freeze = false;
        emit LogFreezeTransfers(freeze, now);
    }

    /**
     * @notice adjust totalsupply at checkpoint after minting or burning tokens
     */
    function adjustTotalSupplyCheckpoints() internal {
        adjustCheckpoints(checkpointTotalSupply, totalSupply());
    }

    /**
     * @notice adjust token holder balance at checkpoint after a token transfer
     * @param _investor address of the token holder affected
     */
    function adjustBalanceCheckpoints(address _investor) internal {
        adjustCheckpoints(checkpointBalances[_investor], balanceOf(_investor));
    }

    /**
     * @notice store the changes to the checkpoint objects
     * @param _checkpoints the affected checkpoint object array
     * @param _newValue the new value that needs to be stored
     */
    function adjustCheckpoints(Checkpoint[] storage _checkpoints, uint256 _newValue) internal {
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
        adjustInvestorCount(msg.sender, _to, _value);
        require(verifyTransfer(msg.sender, _to, _value), "Transfer is not valid");
        adjustBalanceCheckpoints(msg.sender);
        adjustBalanceCheckpoints(_to);
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
        adjustInvestorCount(_from, _to, _value);
        require(verifyTransfer(_from, _to, _value), "Transfer is not valid");
        adjustBalanceCheckpoints(_from);
        adjustBalanceCheckpoints(_to);
        require(super.transferFrom(_from, _to, _value));
        return true;
    }

    /**
     * @notice validate transfer with TransferManager module if it exists
     * @dev TransferManager module has a key of 2
     * @param _from sender of transfer
     * @param _to receiver of transfer
     * @param _amount value of transfer
     * @return bool
     */
    function verifyTransfer(address _from, address _to, uint256 _amount) public checkGranularity(_amount) returns (bool) {
        if (!freeze) {
            bool isTransfer = false;
            if (transferFunctions[getSig(msg.data)]) {
              isTransfer = true;
            }
            if (modules[TRANSFERMANAGER_KEY].length == 0) {
                return true;
            }
            bool isInvalid = false;
            bool isValid = false;
            bool isForceValid = false;
            for (uint8 i = 0; i < modules[TRANSFERMANAGER_KEY].length; i++) {
                ITransferManager.Result valid = ITransferManager(modules[TRANSFERMANAGER_KEY][i].moduleAddress).verifyTransfer(_from, _to, _amount, isTransfer);
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
            return isForceValid ? true : (isInvalid ? false : isValid);
      }
      return false;
    }

    /**
     * @notice End token minting period permanently for Issuer
     */
    function finishMintingIssuer() public onlyOwner {
        finishedIssuerMinting = true;
        emit LogFinishMintingIssuer(now);
    }

    /**
     * @notice End token minting period permanently for STOs
     */
    function finishMintingSTO() public onlyOwner {
        finishedSTOMinting = true;
        emit LogFinishMintingSTO(now);
    }

    /**
     * @notice mints new tokens and assigns them to the target _investor.
     * @dev Can only be called by the STO attached to the token (Or by the ST owner if there's no STO attached yet)
     * @param _investor Address to whom the minted tokens will be dilivered
     * @param _amount Number of tokens get minted
     * @return success
     */
    function mint(address _investor, uint256 _amount) public onlyModule(STO_KEY, true) checkGranularity(_amount) isMintingAllowed() returns (bool success) {
        adjustInvestorCount(address(0), _investor, _amount);
        require(verifyTransfer(address(0), _investor, _amount), "Transfer is not valid");
        adjustBalanceCheckpoints(_investor);
        adjustTotalSupplyCheckpoints();
        totalSupply_ = totalSupply_.add(_amount);
        balances[_investor] = balances[_investor].add(_amount);
        emit Minted(_investor, _amount);
        emit Transfer(address(0), _investor, _amount);
        return true;
    }

    /**
     * @notice mints new tokens and assigns them to the target _investor.
     * Can only be called by the STO attached to the token (Or by the ST owner if there's no STO attached yet)
     * @param _investors A list of addresses to whom the minted tokens will be dilivered
     * @param _amounts A list of number of tokens get minted and transfer to corresponding address of the investor from _investor[] list
     * @return success
     */
    function mintMulti(address[] _investors, uint256[] _amounts) public onlyModule(STO_KEY, true) returns (bool success) {
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
            if (IPermissionManager(modules[PERMISSIONMANAGER_KEY][i].moduleAddress).checkPermission(_delegate, _module, _perm)) {
                return true;
            }
        }
    }

    /**
     * @notice used to set the token Burner address. It only be called by the owner
     * @param _tokenBurner Address of the token burner contract
     */
    function setTokenBurner(address _tokenBurner) public onlyOwner {
        tokenBurner = ITokenBurner(_tokenBurner);
    }

    /**
     * @notice Burn function used to burn the securityToken
     * @param _value No. of token that get burned
     */
    function burn(uint256 _value) checkGranularity(_value) public {
        adjustInvestorCount(msg.sender, address(0), _value);
        require(tokenBurner != address(0), "Token Burner contract address is not set yet");
        require(verifyTransfer(msg.sender, address(0), _value), "Transfer is not valid");
        require(_value <= balances[msg.sender], "Value should no be greater than the balance of msg.sender");
        adjustBalanceCheckpoints(msg.sender);
        adjustTotalSupplyCheckpoints();
        // no need to require value <= totalSupply, since that would imply the
        // sender's balance is greater than the totalSupply, which *should* be an assertion failure

        balances[msg.sender] = balances[msg.sender].sub(_value);
        require(tokenBurner.burn(msg.sender, _value), "Token burner process is not validated");
        totalSupply_ = totalSupply_.sub(_value);
        emit Burnt(msg.sender, _value);
        emit Transfer(msg.sender, address(0), _value);
    }

    /**
     * @notice Get function signature from _data
     * @param _data passed data
     * @return bytes4 sig
     */
    function getSig(bytes _data) internal pure returns (bytes4 sig) {
        uint len = _data.length < 4 ? _data.length : 4;
        for (uint i = 0; i < len; i++) {
            sig = bytes4(uint(sig) + uint(_data[i]) * (2 ** (8 * (len - 1 - i))));
        }
    }

    /**
     * @notice set a new Security Token Registry contract address in case of upgrade
     * @param _newAddress is address of new contract
     */
     function changeSecurityTokenRegistryAddress(address _newAddress) public onlyOwner {
         require(_newAddress != securityTokenRegistry && _newAddress != address(0));
         emit LogChangeSTRAddress(securityTokenRegistry, _newAddress);
         securityTokenRegistry = _newAddress;
     }

    /**
     * @notice Creates a checkpoint that can be used to query historical balances / totalSuppy
     * @return uint256
     */
    function createCheckpoint() public onlyModule(CHECKPOINT_KEY, true) returns(uint256) {
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
    function totalSupplyAt(uint256 _checkpointId) public view returns(uint256) {
        return getValueAt(checkpointTotalSupply, _checkpointId, totalSupply());
    }

    /**
     * @notice Queries value at a defined checkpoint
     * @param checkpoints is array of Checkpoint objects
     * @param _checkpointId Checkpoint ID to query
     * @param _currentValue Current value of checkpoint
     * @return uint256
     */
    function getValueAt(Checkpoint[] storage checkpoints, uint256 _checkpointId, uint256 _currentValue) internal view returns(uint256) {
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
        return getValueAt(checkpointBalances[_investor], _checkpointId, balanceOf(_investor));
    }

}
