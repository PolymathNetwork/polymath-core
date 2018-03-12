pragma solidity ^0.4.18;

/**
 * @title ERC20Basic
 * @dev Simpler version of ERC20 interface
 * @dev see https://github.com/ethereum/EIPs/issues/179
 */
contract ERC20Basic {
  function totalSupply() public view returns (uint256);
  function balanceOf(address who) public view returns (uint256);
  function transfer(address to, uint256 value) public returns (bool);
  event Transfer(address indexed from, address indexed to, uint256 value);
}

/**
 * @title SafeMath
 * @dev Math operations with safety checks that throw on error
 */
library SafeMath {

  /**
  * @dev Multiplies two numbers, throws on overflow.
  */
  function mul(uint256 a, uint256 b) internal pure returns (uint256) {
    if (a == 0) {
      return 0;
    }
    uint256 c = a * b;
    assert(c / a == b);
    return c;
  }

  /**
  * @dev Integer division of two numbers, truncating the quotient.
  */
  function div(uint256 a, uint256 b) internal pure returns (uint256) {
    // assert(b > 0); // Solidity automatically throws when dividing by 0
    uint256 c = a / b;
    // assert(a == b * c + a % b); // There is no case in which this doesn't hold
    return c;
  }

  /**
  * @dev Substracts two numbers, throws on overflow (i.e. if subtrahend is greater than minuend).
  */
  function sub(uint256 a, uint256 b) internal pure returns (uint256) {
    assert(b <= a);
    return a - b;
  }

  /**
  * @dev Adds two numbers, throws on overflow.
  */
  function add(uint256 a, uint256 b) internal pure returns (uint256) {
    uint256 c = a + b;
    assert(c >= a);
    return c;
  }
}

/**
 * @title Basic token
 * @dev Basic version of StandardToken, with no allowances.
 */
contract BasicToken is ERC20Basic {
  using SafeMath for uint256;

  mapping(address => uint256) balances;

  uint256 totalSupply_;

  /**
  * @dev total number of tokens in existence
  */
  function totalSupply() public view returns (uint256) {
    return totalSupply_;
  }

  /**
  * @dev transfer token for a specified address
  * @param _to The address to transfer to.
  * @param _value The amount to be transferred.
  */
  function transfer(address _to, uint256 _value) public returns (bool) {
    require(_to != address(0));
    require(_value <= balances[msg.sender]);

    // SafeMath.sub will throw if there is not enough balance.
    balances[msg.sender] = balances[msg.sender].sub(_value);
    balances[_to] = balances[_to].add(_value);
    Transfer(msg.sender, _to, _value);
    return true;
  }

  /**
  * @dev Gets the balance of the specified address.
  * @param _owner The address to query the the balance of.
  * @return An uint256 representing the amount owned by the passed address.
  */
  function balanceOf(address _owner) public view returns (uint256 balance) {
    return balances[_owner];
  }

}

/**
 * @title ERC20 interface
 * @dev see https://github.com/ethereum/EIPs/issues/20
 */
contract ERC20 is ERC20Basic {
  function allowance(address owner, address spender) public view returns (uint256);
  function transferFrom(address from, address to, uint256 value) public returns (bool);
  function approve(address spender, uint256 value) public returns (bool);
  event Approval(address indexed owner, address indexed spender, uint256 value);
}

/**
 * @title Standard ERC20 token
 *
 * @dev Implementation of the basic standard token.
 * @dev https://github.com/ethereum/EIPs/issues/20
 * @dev Based on code by FirstBlood: https://github.com/Firstbloodio/token/blob/master/smart_contract/FirstBloodToken.sol
 */
contract StandardToken is ERC20, BasicToken {

  mapping (address => mapping (address => uint256)) internal allowed;


  /**
   * @dev Transfer tokens from one address to another
   * @param _from address The address which you want to send tokens from
   * @param _to address The address which you want to transfer to
   * @param _value uint256 the amount of tokens to be transferred
   */
  function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
    require(_to != address(0));
    require(_value <= balances[_from]);
    require(_value <= allowed[_from][msg.sender]);

    balances[_from] = balances[_from].sub(_value);
    balances[_to] = balances[_to].add(_value);
    allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_value);
    Transfer(_from, _to, _value);
    return true;
  }

  /**
   * @dev Approve the passed address to spend the specified amount of tokens on behalf of msg.sender.
   *
   * Beware that changing an allowance with this method brings the risk that someone may use both the old
   * and the new allowance by unfortunate transaction ordering. One possible solution to mitigate this
   * race condition is to first reduce the spender's allowance to 0 and set the desired value afterwards:
   * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
   * @param _spender The address which will spend the funds.
   * @param _value The amount of tokens to be spent.
   */
  function approve(address _spender, uint256 _value) public returns (bool) {
    allowed[msg.sender][_spender] = _value;
    Approval(msg.sender, _spender, _value);
    return true;
  }

  /**
   * @dev Function to check the amount of tokens that an owner allowed to a spender.
   * @param _owner address The address which owns the funds.
   * @param _spender address The address which will spend the funds.
   * @return A uint256 specifying the amount of tokens still available for the spender.
   */
  function allowance(address _owner, address _spender) public view returns (uint256) {
    return allowed[_owner][_spender];
  }

  /**
   * @dev Increase the amount of tokens that an owner allowed to a spender.
   *
   * approve should be called when allowed[_spender] == 0. To increment
   * allowed value is better to use this function to avoid 2 calls (and wait until
   * the first transaction is mined)
   * From MonolithDAO Token.sol
   * @param _spender The address which will spend the funds.
   * @param _addedValue The amount of tokens to increase the allowance by.
   */
  function increaseApproval(address _spender, uint _addedValue) public returns (bool) {
    allowed[msg.sender][_spender] = allowed[msg.sender][_spender].add(_addedValue);
    Approval(msg.sender, _spender, allowed[msg.sender][_spender]);
    return true;
  }

  /**
   * @dev Decrease the amount of tokens that an owner allowed to a spender.
   *
   * approve should be called when allowed[_spender] == 0. To decrement
   * allowed value is better to use this function to avoid 2 calls (and wait until
   * the first transaction is mined)
   * From MonolithDAO Token.sol
   * @param _spender The address which will spend the funds.
   * @param _subtractedValue The amount of tokens to decrease the allowance by.
   */
  function decreaseApproval(address _spender, uint _subtractedValue) public returns (bool) {
    uint oldValue = allowed[msg.sender][_spender];
    if (_subtractedValue > oldValue) {
      allowed[msg.sender][_spender] = 0;
    } else {
      allowed[msg.sender][_spender] = oldValue.sub(_subtractedValue);
    }
    Approval(msg.sender, _spender, allowed[msg.sender][_spender]);
    return true;
  }

}

contract DetailedERC20 is ERC20 {
  string public name;
  string public symbol;
  uint8 public decimals;

  function DetailedERC20(string _name, string _symbol, uint8 _decimals) public {
    name = _name;
    symbol = _symbol;
    decimals = _decimals;
  }
}

contract AclHelpers {

    function decodeParamOp(uint256 _x) internal pure returns (uint8 b) {
        return uint8(_x >> (8 * 30));
    }

    function decodeParamId(uint256 _x) internal pure returns (uint8 b) {
        return uint8(_x >> (8 * 31));
    }

    function permissionHash(address _entity, address _delegate) internal pure returns (bytes32) {
        return keccak256(_entity, _delegate);
    }
}

contract Delegable is AclHelpers {

    address public authority;
    bytes32 constant public EMPTY_PARAM_HASH = keccak256(uint256(0));

    mapping(bytes32 => bytes32) public delegatesAcl;
    mapping(address => bytes32) public modulePerm;

    event LogGrantPermissions(address _delegate, address _module, uint256 _timestamp);
    event LogAddPermForModule(address indexed _module, bool _permission);

    enum Op { NONE, EQ, NEQ, GT, LT, GTE, LTE, NOT, AND, OR, XOR, IF_ELSE, RET } // op types

    struct Permission {
        uint8 id;
        uint8 op;
        uint240 value; // even though value is an uint240 it can store addresses
        // in the case of 32 byte hashes losing 2 bytes precision isn't a huge deal
        // op and id take less than 1 byte each so it can be kept in 1 sstore
    }

    modifier onlyAuthority() {
        require(msg.sender == authority);
        _;
    }

    function Delegable() public {
        // TODO: If any global variable required to set
    }

    // Here this function is restricted and only be called by the securityToken
    function addModulePerm(uint256[] _permission, address _module) internal {
        require(_module != address(0));
        bytes32 paramsHash = _permission.length > 0 ? _savePermissions(_permission) : EMPTY_PARAM_HASH;
        modulePerm[_module] = paramsHash;
        LogAddPermForModule(_module, paramsHash != bytes32(0));
    }

    // _delegate address of the delegate whom permission will be provided
    function grantPermission(address _delegate, address _module) public {
        require(modulePerm[_module] != bytes32(0));
        require(delegatesAcl[permissionHash(_delegate, _module)] == bytes32(0));
        delegatesAcl[permissionHash(_delegate, _module)] = modulePerm[_module];
        LogGrantPermissions(_delegate, _module, now);
    }

    // _module will be the address of the module as per the Adam's branch
    // TODO:  Verify the permission granted to the delegates as per the module
    function checkPermissions(address _module, address _delegate) public {
        ///  WIP
    }

    function _savePermissions(uint256[] _encodedParams) internal returns (bytes32) {
        bytes32 paramHash = keccak256(_encodedParams);
        Permission[] storage params;

        if (params.length == 0) { // params not saved before
            for (uint256 i = 0; i < _encodedParams.length; i++) {
                uint256 encodedParam = _encodedParams[i];
                Permission memory param = Permission(decodeParamId(encodedParam), decodeParamOp(encodedParam), uint240(encodedParam));
                params.push(param);
            }
        }

        return paramHash;
    }

}

//Simple interface that any module contracts should implement
contract IModule {

}

contract ITransferManager is IModule {

    function verifyTransfer(address _to, address _from) external returns(bool);

}

//Simple interface that any module contracts should implement
interface IModuleFactory {

    //TODO: Add delegates to this
    //Should create an instance of the Module, or throw
    function deploy(address _owner, bytes _data) external returns(address);

    function getType() external returns(uint8);

    function getName() external returns(bytes32);

    //Return the cost (in POLY) to use this factory
    function getCost() external returns(uint256);

}

//Simple interface that any module contracts should implement
interface IModuleRegistry {

    //Checks that module is correctly configured in registry
    function checkModule(address _moduleFactory) external returns(bool);

    //Return the cost (in POLY) to use this factory
    function getCost(address _moduleFactory) external returns(uint256);

    function registerModule(address _moduleFactory) external returns(bool);

}

contract IST20 {

    //Swarm hash of security details
    bytes32 public securityDetails;

    //transfer, transferFrom must respect use respect the result of verifyTransfer
    function verifyTransfer(address _from, address _to) public returns (bool success);

}

contract SecurityToken is StandardToken, IST20, Delegable, DetailedERC20 {

    // Owner of the ST
    address public owner;

    struct ModuleData {
      bytes32 name;
      address moduleAddress;
    }

    address public moduleRegistry;

    // Transfer Manager has a key of 0
    // Other modules TBD
    mapping (uint8 => ModuleData) modules;

    event LogModuleAdded(uint8 _type, bytes32 _name, address _moduleFactory, address _module, uint256 _moduleCost);

    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }

    function SecurityToken(address _owner, uint256 _totalSupply, string _name, string _symbol, uint8 _decimals, bytes32 _securityDetails, address _moduleRegistry) public
    DetailedERC20(_name, _symbol, _decimals)
    {
        require(_owner != address(0));
        require(_totalSupply > 0);
        owner = _owner;
        totalSupply_ = _totalSupply;
        moduleRegistry = _moduleRegistry;
        securityDetails = _securityDetails;
        allocateSecurities();
    }

    //You are only ever allowed one instance, for a given module type
    //TODO: should you be able to replace these? My feeling is no - if that flexibility is needed, the module itself should allow it via delegation
    //TODO cont.: this would give more clarity to users of the ST as they would know what can and can't be changed down the line.
    //TODO cont.: e.g. for an STO module, we could delegate it rights to freely transfer / mint tokens, but users would know that this couldn't be reused in future after the STO finishes.
    function addModule(address _moduleFactory, bytes _data, uint256 _maxCost, uint256[] _perm) public onlyOwner {
        //Check that module exists in registry
        require(IModuleRegistry(moduleRegistry).checkModule(_moduleFactory));
        uint256 moduleCost = IModuleRegistry(moduleRegistry).getCost(_moduleFactory);
        //Avoids any problem where module owner changes cost by front-running a call to addModule
        require(moduleCost <= _maxCost);
        //TODO: Approve moduleCost from POLY wallet to _moduleFactory
        //Creates instance of module from factory
        //TODO: Integrate delegates into this from Satyam's branch
        IModuleFactory moduleFactory = IModuleFactory(_moduleFactory);
        IModule module = IModule(moduleFactory.deploy(owner, _data));

        // One way of adding the permission to delegates corresponds to the module
        addModulePerm(_perm, module);

        //Check that this module has not already been set
        require(modules[moduleFactory.getType()].moduleAddress == address(0));
        //Add to SecurityToken module map
        modules[moduleFactory.getType()] = ModuleData(moduleFactory.getName(), address(module));
        //Emit log event
        LogModuleAdded(moduleFactory.getType(), moduleFactory.getName(), _moduleFactory, address(module), moduleCost);
    }

    /**
     * @dev Allocate all the pre-mint supply of securities token to owner
     */
    function allocateSecurities() internal {
        balances[owner] = totalSupply_;
        Transfer(address(0), owner, totalSupply_);
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

    // Delegates this to a TransferManager module, which has a key of 0
    function verifyTransfer(address _from, address _to) public returns (bool success) {
        return ITransferManager(modules[0].moduleAddress).verifyTransfer(_from, _to);
    }

    function investorStatus(address _investor) public returns (uint8 _status) {
      // TODO
      return 0;
    }

}