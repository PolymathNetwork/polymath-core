pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/token/ERC20/StandardToken.sol';
import 'zeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol';
import './delegates/Delegable.sol';
import './interfaces/ITransferManager.sol';
import './interfaces/IModule.sol';
import './interfaces/IModuleFactory.sol';
import './interfaces/IModuleRegistry.sol';
import './interfaces/IST20.sol';

contract SecurityToken is StandardToken, IST20, Delegable, DetailedERC20 {
    using SafeMath for uint256;

    // Owner of the ST
    address public owner;

    struct ModuleData {
      bytes32 name;
      address moduleAddress;
      bool replaceable;
    }

    address public moduleRegistry;

    // TransferManager has a key of 1
    // STO has a key of 2
    // Other modules TBD
    mapping (uint8 => ModuleData) modules;

    event LogModuleAdded(uint8 _type, bytes32 _name, address _moduleFactory, address _module, uint256 _moduleCost);
    event Mint(address indexed to, uint256 amount);

    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }

    modifier onlyModule(uint8 i) {
      require(msg.sender == modules[i].moduleAddress);
      _;
    }

    function SecurityToken(
        address _owner,
        string _name,
        string _symbol,
        uint8 _decimals,
        bytes32 _securityDetails,
        address _moduleRegistry,
        address _tokenTransferModuleFactory
    )
    public
    DetailedERC20(_name, _symbol, _decimals)
    {
        require(_owner != address(0));
        owner = _owner;
        moduleRegistry = _moduleRegistry;
        securityDetails = _securityDetails;
        // For attaching the TransferManager automatically below is the process
        // This is most simple way of doing without too many changes
        // Before deploying this blueprint we need to hard code those general values(e.g - data, maxcost, perm).
        // Those general value will be same for each securityToken launch. If issuer wants to other values then they can launch their
        // new transferManager with new values.
        // TODO: Need to finalise the variable value
        uint256[] memory perm;
        _addModule(_tokenTransferModuleFactory, "0xfffff", uint256(10000), perm, true);
    }

    function addModule(address _moduleFactory, bytes _data, uint256 _maxCost, uint256[] _perm, bool _replaceable) external {
      require(msg.sender == owner);
      _addModule(_moduleFactory, _data, _maxCost, _perm, _replaceable);
    }

    //You are only ever allowed one instance, for a given module type
    //TODO: should you be able to replace these? My feeling is no - if that flexibility is needed, the module itself should allow it via delegation
    //TODO cont.: this would give more clarity to users of the ST as they would know what can and can't be changed down the line.
    //TODO cont.: e.g. for an STO module, we could delegate it rights to freely transfer / mint tokens, but users would know that this couldn't be reused in future after the STO finishes.
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
        require(verifyTransfer(msg.sender, _to));
        return super.transfer(_to, _value);
    }

    /**
     * @dev Overladed version of the transferFrom function
     */
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        require(verifyTransfer(_from, _to));
        return super.transferFrom(_from, _to, _value);
    }

    // Delegates this to a TransferManager module, which has a key of 1
    // Will throw if no TransferManager module set
    function verifyTransfer(address _from, address _to) public returns (bool success) {
        return ITransferManager(modules[1].moduleAddress).verifyTransfer(_from, _to);
    }

    // Only STO module can call this, has a key of 2
    function mint(address _investor, uint256 _amount) public onlyModule(2) returns (bool success) {
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
