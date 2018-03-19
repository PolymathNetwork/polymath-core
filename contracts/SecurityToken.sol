pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/token/ERC20/StandardToken.sol';
import 'zeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import './delegates/Delegable.sol';
import './interfaces/ITransferManager.sol';
import './interfaces/IModule.sol';
import './interfaces/IModuleFactory.sol';
import './interfaces/IModuleRegistry.sol';
import './interfaces/IST20.sol';

contract SecurityToken is StandardToken, IST20, Delegable, DetailedERC20, Ownable {
    using SafeMath for uint256;

    struct ModuleData {
      bytes32 name;
      address moduleAddress;
      bool replaceable;
    }

    address public moduleRegistry;

    // TransferManager has a key of 1
    // STO has a key of 2
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
        address _moduleRegistry
    )
    public
    DetailedERC20(_name, _symbol, _decimals)
    {
        moduleRegistry = _moduleRegistry;
    }

    function addModule(address _moduleFactory, bytes _data, uint256 _maxCost, uint256[] _perm, bool _replaceable) external {
        require(msg.sender == owner);
        _addModule(_moduleFactory, _data, _maxCost, _perm, _replaceable);
    }

    //You are only ever allowed one instance, for a given module type
    function _addModule(address _moduleFactory, bytes _data, uint256 _maxCost, uint256[] _perm, bool _replaceable) internal {
        //Check that module exists in registry
        require(IModuleRegistry(moduleRegistry).checkModule(_moduleFactory));
        uint256 moduleCost = IModuleRegistry(moduleRegistry).getCost(_moduleFactory);
        //Avoids any problem where module owner changes cost by front-running a call to addModule
        require(moduleCost <= _maxCost);
        //TODO: Approve moduleCost from POLY wallet to _moduleFactory
        //Creates instance of module from factory
        IModuleFactory moduleFactory = IModuleFactory(_moduleFactory);
        IModule module = IModule(moduleFactory.deploy(owner, _data));
        // One way of adding the permission to delegates corresponds to the module
        addModulePerm(_perm, module);
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

    // Delegates this to a TransferManager module, which has a key of 1
    // Will throw if no TransferManager module set
    function verifyTransfer(address _from, address _to, uint256 _amount) public returns (bool success) {
        if (modules[1].moduleAddress == address(0)) {
          return true;
        }
        return ITransferManager(modules[1].moduleAddress).verifyTransfer(_from, _to, _amount);
    }

    // Only STO module can call this, has a key of 2
    function mint(address _investor, uint256 _amount) public onlyModule(2, true) returns (bool success) {
        require(verifyTransfer(address(0), _investor, _amount));
        totalSupply_ = totalSupply_.add(_amount);
        balances[_investor] = balances[_investor].add(_amount);
        Mint(_investor, _amount);
        Transfer(address(0), _investor, _amount);
        return true;
    }

    function investorStatus(address _investor) public returns (uint8 _status) {
      // TODO
      return 0;
    }

}
