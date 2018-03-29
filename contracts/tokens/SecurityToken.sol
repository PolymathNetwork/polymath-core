pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/token/ERC20/StandardToken.sol';
import 'zeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol';
import 'zeppelin-solidity/contracts/token/ERC20/ERC20.sol';
import '../interfaces/ISecurityToken.sol';
import '../interfaces/IModule.sol';
import '../interfaces/IModuleFactory.sol';
import '../interfaces/IModuleRegistry.sol';
import '../interfaces/IST20.sol';
import '../modules/TransferManager/ITransferManager.sol';
import '../modules/PermissionManager/IPermissionManager.sol';
import '../interfaces/ISecurityTokenRegistry.sol';

/**
* @title SecurityToken
* @notice SecurityToken is an ERC20 token with added capabilities:
* - Transfers are restricted
* - Modules can be attached to it to control its behaviour
* - ST should not be deployed directly, but rather the SecurityTokenRegistry should be used
*/
contract SecurityToken is ISecurityToken, StandardToken, DetailedERC20 {
    using SafeMath for uint256;

    bytes32 public securityTokenVersion = "0.0.1";

    ERC20 public polyToken;

    struct ModuleData {
      bytes32 name;
      address moduleAddress;
      bool replaceable;
    }

    address public moduleRegistry;

    // Permission has a key of 1
    // TransferManager has a key of 2
    // STO has a key of 3
    // Other modules TBD
    // Module list should be order agnostic!
    mapping (uint8 => ModuleData[]) public modules;

    uint8 public MAX_MODULES = 10;

    event LogModuleAdded(uint8 indexed _type, bytes32 _name, address _moduleFactory, address _module, uint256 _moduleCost, uint256 _budget, uint256 _timestamp);
    event LogModuleRemoved(uint8 indexed _type, address _module, uint256 _timestamp);
    event LogModuleBudgetChanged(uint8 indexed _moduleType, address _module, uint256 _budget);
    event Mint(address indexed to, uint256 amount);

    //if _fallback is true, then we only allow the module if it is set, if it is not set we only allow the owner
    modifier onlyModule(uint8 _moduleType, bool _fallback) {
      //Loop over all modules of type _moduleType
      bool isModuleType = false;
      for (uint8 i = 0; i < modules[_moduleType].length; i++) {
          isModuleType = isModuleType || (modules[_moduleType][i].moduleAddress == msg.sender);
      }
      if (_fallback && !isModuleType) {
          require(msg.sender == owner);
      } else {
          require(isModuleType);
      }
      _;
    }

    function SecurityToken(
        string _name,
        string _symbol,
        uint8 _decimals,
        bytes32 _tokenDetails,
        address _owner
    )
    public
    DetailedERC20(_name, _symbol, _decimals)
    {
        //When it is created, the owner is the STR
        moduleRegistry = ISecurityTokenRegistry(_owner).moduleRegistry();
        polyToken = ERC20(ISecurityTokenRegistry(_owner).polyAddress());
        tokenDetails = _tokenDetails;
        //owner = _owner;
    }

    function addModule(address _moduleFactory, bytes _data, uint256 _maxCost, uint256 _budget, bool _replaceable) external onlyOwner {
        _addModule(_moduleFactory, _data, _maxCost, _budget, _replaceable);
    }

    /**
    * @notice _addModule handles the attachment (or replacement) of modules for the ST
    * E.G.: On deployment (through the STR) ST gets a TransferManager module attached to it
    * to control restrictions on transfers.
    * @param _moduleFactory is the address of the module factory to be added
    * @param _data is data packed into bytes used to further configure the module (See STO usage)
    * @param _maxCost max amount of POLY willing to pay to module. (WIP)
    * @param _replaceable whether or not the module is supposed to be replaceable
    */
    //You are allowed to add a new moduleType if:
    //  - there is no existing module of that type yet added
    //  - the last member of the module list is replacable
    function _addModule(address _moduleFactory, bytes _data, uint256 _maxCost, uint256 _budget, bool _replaceable) internal {
        //Check that module exists in registry - will throw otherwise
        IModuleRegistry(moduleRegistry).useModule(_moduleFactory);
        IModuleFactory moduleFactory = IModuleFactory(_moduleFactory);
        require(modules[moduleFactory.getType()].length < MAX_MODULES);
        uint256 moduleCost = moduleFactory.getCost();
        require(moduleCost <= _maxCost);
        //Check that this module has not already been set as non-replaceable
        if (modules[moduleFactory.getType()].length != 0) {
          require(modules[moduleFactory.getType()][modules[moduleFactory.getType()].length - 1].replaceable);
        }
        //Approve fee for module
        require(polyToken.approve(_moduleFactory, moduleCost));
        //Creates instance of module from factory
        address module = moduleFactory.deploy(_data);
        //Approve ongoing budget
        require(polyToken.approve(module, _budget));
        //Add to SecurityToken module map
        modules[moduleFactory.getType()].push(ModuleData(moduleFactory.getName(), module, _replaceable));
        //Emit log event
        LogModuleAdded(moduleFactory.getType(), moduleFactory.getName(), _moduleFactory, module, moduleCost, _budget, now);
    }

    function getModule(uint8 _module, uint _index) public view returns (bytes32, address, bool) {
      if (modules[_module].length > 0) {
        return (
          modules[_module][_index].name,
          modules[_module][_index].moduleAddress,
          modules[_module][_index].replaceable
        );
      }else {
        return ("",address(0),false);
      }

    }

    function removeModule(uint8 _moduleType, uint8 _moduleIndex) external onlyOwner {
        require(_moduleIndex < modules[_moduleType].length);
        require(modules[_moduleType][_moduleIndex].moduleAddress != address(0));
        require(modules[_moduleType][_moduleIndex].replaceable);
        //Take the last member of the list, and replace _moduleIndex with this, then shorten the list by one
        LogModuleRemoved(_moduleType, modules[_moduleType][_moduleIndex].moduleAddress, now);
        modules[_moduleType][_moduleIndex] = modules[_moduleType][modules[_moduleType].length - 1];
        modules[_moduleType].length = modules[_moduleType].length - 1;
    }

    function withdrawPoly(uint256 _amount) public onlyOwner {
        require(polyToken.transfer(owner, _amount));
    }

    function changeModuleBudget(uint8 _moduleType, uint8 _moduleIndex, uint256 _budget) public onlyOwner {
        require(_moduleType != 0);
        require(_moduleIndex < modules[_moduleType].length);
        require(polyToken.approve(modules[_moduleType][_moduleType].moduleAddress, _budget));
        LogModuleBudgetChanged(_moduleType, modules[_moduleType][_moduleType].moduleAddress, _budget);
    }

    /**
     * @dev Overladed version of the transfer function
     */
    function transfer(address _to, uint256 _value) public returns (bool success) {
        require(verifyTransfer(msg.sender, _to, _value));
        return super.transfer(_to, _value);
    }

    /**
     * @dev Overladed version of the transferFrom function
     */
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        require(verifyTransfer(_from, _to, _value));
        return super.transferFrom(_from, _to, _value);
    }

    // Permissions this to a TransferManager module, which has a key of 2
    // If no TransferManager return true
    function verifyTransfer(address _from, address _to, uint256 _amount) view public returns (bool success) {
        if (modules[2].length == 0) {
          return true;
        }
        for (uint8 i = 0; i < modules[2].length; i++) {
            if (ITransferManager(modules[2][i].moduleAddress).verifyTransfer(_from, _to, _amount)) {
                return true;
            }
        }
        return false;
    }

    // Only STO module can call this, has a key of 3
    function mint(address _investor, uint256 _amount) public onlyModule(3, true) returns (bool success) {
        require(verifyTransfer(address(0), _investor, _amount));
        totalSupply_ = totalSupply_.add(_amount);
        balances[_investor] = balances[_investor].add(_amount);
        Mint(_investor, _amount);
        Transfer(address(0), _investor, _amount);
        return true;
    }

    //TODO: Implement this function
    function investorStatus(address /* _investor */) public pure returns (uint8 _status) {
      return 0;
    }

    // Permissions this to a Permission module, which has a key of 1
    // If no Permission return false - note that IModule withPerm will allow ST owner all permissions anyway
    // this allows individual modules to override this logic if needed (to not allow ST owner all permissions)
    function checkPermission(address _delegate, address _module, bytes32 _perm) view public returns(bool) {

      if (modules[1].length == 0) {
        return false;
      }

      for (uint8 i = 0; i < modules[1].length; i++) {
          if (IPermissionManager(modules[1][i].moduleAddress).checkPermission(_delegate, _module, _perm)) {
              return true;
          }
      }

    }

}
