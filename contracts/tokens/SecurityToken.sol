pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/token/ERC20/StandardToken.sol';
import 'zeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol';
import '../interfaces/ISecurityToken.sol';
import '../interfaces/IModule.sol';
import '../interfaces/IModuleFactory.sol';
import '../interfaces/IModuleRegistry.sol';
import '../interfaces/IST20.sol';
import '../modules/TransferManager/ITransferManager.sol';
import '../modules/PermissionManager/IPermissionManager.sol';
import '../interfaces/ISecurityTokenRegistrar.sol';

/**
* @title SecurityToken
* @notice SecurityToken is an ERC20 token with added capabilities:
* - Transfers are restricted
* - Modules can be attached to it to control its behaviour
* - ST should not be deployed directly, but rather the SecurityTokenRegistrar should be used
*/
contract SecurityToken is ISecurityToken, StandardToken, DetailedERC20 {
    using SafeMath for uint256;

    bytes32 public securityTokenVersion = "0.0.1";

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
    mapping (uint8 => ModuleData) public modules;

    event LogModuleAdded(uint8 _type, bytes32 _name, address _moduleFactory, address _module, uint256 _moduleCost);
    event Mint(address indexed to, uint256 amount);

    //if _fallback is true, then we only allow the module if it is set, if it is not set we only allow the owner
    modifier onlyModule(uint8 _i, bool _fallback) {
      if (_fallback && (address(0) == modules[_i].moduleAddress)) {
          require(msg.sender == owner);
      } else {
          require(msg.sender == modules[_i].moduleAddress);
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
        moduleRegistry = ISecurityTokenRegistrar(_owner).moduleRegistry();
        tokenDetails = _tokenDetails;
        owner = _owner;
    }

    function addModule(address _moduleFactory, bytes _data, uint256 _maxCost, bool _replaceable) external {
        require(msg.sender == owner);
        _addModule(_moduleFactory, _data, _maxCost, _replaceable);
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
    //You are only ever allowed one instance, for a given module type
    function _addModule(address _moduleFactory, bytes _data, uint256 _maxCost, bool _replaceable) internal {
        //Check that module exists in registry
        require(IModuleRegistry(moduleRegistry).checkModule(_moduleFactory));
        uint256 moduleCost = IModuleRegistry(moduleRegistry).getCost(_moduleFactory);
        //Avoids any problem where module owner changes cost by front-running a call to addModule
        require(moduleCost <= _maxCost);
        //TODO: Approve moduleCost from POLY wallet to _moduleFactory
        //Creates instance of module from factory
        IModuleFactory moduleFactory = IModuleFactory(_moduleFactory);
        IModule module = IModule(moduleFactory.deploy(_data));
        //Check that this module has not already been set as non-replaceable
        if (modules[moduleFactory.getType()].moduleAddress != address(0)) {
          require(modules[moduleFactory.getType()].replaceable);
        }
        //Add to SecurityToken module map
        modules[moduleFactory.getType()] = ModuleData(moduleFactory.getName(), address(module), _replaceable);
        //Emit log event
        LogModuleAdded(moduleFactory.getType(), moduleFactory.getName(), _moduleFactory, address(module), moduleCost);
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
    function verifyTransfer(address _from, address _to, uint256 _amount) public returns (bool success) {
        if (modules[2].moduleAddress == address(0)) {
          return true;
        }
        return ITransferManager(modules[2].moduleAddress).verifyTransfer(_from, _to, _amount);
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
    function checkPermission(address _delegate, address _module, bytes32 _perm) public returns(bool) {
      if (modules[1].moduleAddress == address(0)) {
        return false;
      }
      return IPermissionManager(modules[1].moduleAddress).checkPermission(_delegate, _module, _perm);
    }

}
