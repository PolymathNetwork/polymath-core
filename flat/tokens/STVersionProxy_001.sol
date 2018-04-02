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

contract IST20 {

    // off-chain hash
    bytes32 public tokenDetails;

    //transfer, transferFrom must respect use respect the result of verifyTransfer
    function verifyTransfer(address _from, address _to, uint256 _amount) view public returns (bool success);

    //used to create tokens
    function mint(address _investor, uint256 _amount) public returns (bool success);
}

/**
 * @title Ownable
 * @dev The Ownable contract has an owner address, and provides basic authorization control
 * functions, this simplifies the implementation of "user permissions".
 */
contract Ownable {
  address public owner;


  event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);


  /**
   * @dev The Ownable constructor sets the original `owner` of the contract to the sender
   * account.
   */
  function Ownable() public {
    owner = msg.sender;
  }

  /**
   * @dev Throws if called by any account other than the owner.
   */
  modifier onlyOwner() {
    require(msg.sender == owner);
    _;
  }

  /**
   * @dev Allows the current owner to transfer control of the contract to a newOwner.
   * @param newOwner The address to transfer ownership to.
   */
  function transferOwnership(address newOwner) public onlyOwner {
    require(newOwner != address(0));
    OwnershipTransferred(owner, newOwner);
    owner = newOwner;
  }

}

contract ISecurityToken is IST20, Ownable {

    //TODO: Factor out more stuff here
    function checkPermission(address _delegate, address _module, bytes32 _perm) view public returns(bool);

}

//Simple interface that any module contracts should implement
contract IModuleFactory is Ownable {

    ERC20 public polyToken;

    //Should create an instance of the Module, or throw
    function deploy(bytes _data) external returns(address);

    function getType() view external returns(uint8);

    function getName() view external returns(bytes32);

    //Return the cost (in POLY) to use this factory
    function getCost() view external returns(uint256);

    function getDescription() view external returns(string);

    function getTitle() view external returns(string);

    //Pull function sig from _data
    function getSig(bytes _data) internal pure returns (bytes4 sig) {
        uint l = _data.length < 4 ? _data.length : 4;
        for (uint i = 0; i < l; i++) {
            sig = bytes4(uint(sig) + uint(_data[i]) * (2 ** (8 * (l - 1 - i))));
        }
    }

}

//Simple interface that any module contracts should implement
contract IModule {

    function getInitFunction() public returns (bytes4);

    address public factory;

    address public securityToken;

    function IModule(address _securityToken) public {
      securityToken = _securityToken;
      factory = msg.sender;
    }

    //Allows owner, factory or permissioned delegate
    modifier withPerm(bytes32 _perm) {
        bool isOwner = msg.sender == ISecurityToken(securityToken).owner();
        bool isFactory = msg.sender == factory;
        require(isOwner || isFactory || ISecurityToken(securityToken).checkPermission(msg.sender, address(this), _perm));
        _;
    }

    modifier onlyOwner {
      require(msg.sender == ISecurityToken(securityToken).owner());
      _;
    }

    modifier onlyFactory {
      require(msg.sender == factory);
      _;
    }

    modifier onlyFactoryOwner {
      require(msg.sender == IModuleFactory(factory).owner());
      _;
    }

    function permissions() public returns(bytes32[]);
}

//Simple interface that any module contracts should implement
interface IModuleRegistry {

    //Checks that module is correctly configured in registry
    function useModule(address _moduleFactory) external;

    function registerModule(address _moduleFactory) external returns(bool);

}

contract ITransferManager is IModule {

    function verifyTransfer(address _from, address _to, uint256 _amount) view external returns(bool);

}

contract IPermissionManager is IModule {

    function checkPermission(address _delegate, address _module, bytes32 _perm) view public returns(bool);

    function changePermission(address _delegate, address _module, bytes32 _perm, bool _valid) public returns(bool);

    function delegateDetails(address _delegate) public returns(bytes32);

}

contract ISecurityTokenRegistry {

    address public polyAddress;

    address public moduleRegistry;
    address public tickerRegistry;

    bytes32 public protocolVersion = "0.0.1";
    mapping (bytes32 => address) public protocolVersionST;

    struct SecurityTokenData {
      string symbol;
      bytes32 tokenDetails;
    }

    mapping(address => SecurityTokenData) securityTokens;
    mapping(string => address) symbols;

    /**
     * @dev Creates a new Security Token and saves it to the registry
     * @param _name Name of the token 
     * @param _symbol Ticker symbol of the security token
     * @param _decimals Decimals value for token
     * @param _tokenDetails off-chain details of the token
     */
    function generateSecurityToken(string _name, string _symbol, uint8 _decimals, bytes32 _tokenDetails) public;

    function setProtocolVersion(address _stVersionProxyAddress, bytes32 _version) public;

    //////////////////////////////
    ///////// Get Functions
    //////////////////////////////
    /**
     * @dev Get security token address by ticker name
     * @param _symbol Symbol of the Scurity token
     * @return address _symbol
     */
    function getSecurityTokenAddress(string _symbol) public view returns (address);

     /**
     * @dev Get security token data by its address
     * @param _securityToken Address of the Scurity token
     * @return string, address, bytes32
     */
    function getSecurityTokenData(address _securityToken) public view returns (string, address, bytes32);
}

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

interface ITickerRegistry {
     /**
      * @dev Check the validity of the symbol
      * @param _symbol token symbol
      * @param _owner address of the owner
      * @param _tokenName Name of the token
      * @return bool
      */
     function checkValidity(string _symbol, address _owner, string _tokenName) public returns(bool);

     /**
      * @dev Returns the owner and timestamp for a given symbol
      * @param _symbol symbol
      */
     function getDetails(string _symbol) public view returns (address, uint256, string, bool);


}

contract ISTProxy {

  function deployToken(string _name, string _symbol, uint8 _decimals, bytes32 _tokenDetails, address _issuer)
  public returns (address);
}

contract Util {

   /**
    * @dev changes a string to lower case
    * @param _base string to change
    */
    function lower(string _base) internal pure returns (string) {
      bytes memory _baseBytes = bytes(_base);
      for (uint i = 0; i < _baseBytes.length; i++) {
       bytes1 b1 = _baseBytes[i];
       if (b1 >= 0x41 && b1 <= 0x5A) {
         b1 = bytes1(uint8(b1)+32);
       }
       _baseBytes[i] = b1;
      }
      return string(_baseBytes);
    }

}

contract SecurityTokenRegistry is Ownable, ISecurityTokenRegistry, Util {

    event LogNewSecurityToken(string _ticker, address _securityTokenAddress, address _owner);

     /**
     * @dev Constructor use to set the essentials addresses to facilitate
     * the creation of the security token
     */
    function SecurityTokenRegistry(address _polyAddress, address _moduleRegistry, address _tickerRegistry, address _STVersionProxy) public {
        polyAddress = _polyAddress;
        moduleRegistry = _moduleRegistry;
        tickerRegistry = _tickerRegistry;

        setProtocolVersion(_STVersionProxy,"0.0.1");
    }

    /**
     * @dev Creates a new Security Token and saves it to the registry
     * @param _name Name of the token
     * @param _symbol Ticker symbol of the security token
     * @param _decimals Decimals value for token
     * @param _tokenDetails off-chain details of the token
     */
    function generateSecurityToken(string _name, string _symbol, uint8 _decimals, bytes32 _tokenDetails) public {
        require(bytes(_name).length > 0 && bytes(_symbol).length > 0);
        require(ITickerRegistry(tickerRegistry).checkValidity(_symbol, msg.sender, _name));
        string memory symbol = lower(_symbol);
        address newSecurityTokenAddress = ISTProxy(protocolVersionST[protocolVersion]).deployToken(
          _name,
          symbol,
          _decimals,
          _tokenDetails,
          msg.sender
        );

        securityTokens[newSecurityTokenAddress] = SecurityTokenData(symbol, _tokenDetails);
        symbols[symbol] = newSecurityTokenAddress;
        LogNewSecurityToken(symbol, newSecurityTokenAddress, msg.sender);
    }

    function setProtocolVersion(address _stVersionProxyAddress, bytes32 _version) public onlyOwner {
      protocolVersion = _version;
      protocolVersionST[_version]=_stVersionProxyAddress;
    }

    //////////////////////////////
    ///////// Get Functions
    //////////////////////////////
    /**
     * @dev Get security token address by ticker name
     * @param _symbol Symbol of the Scurity token
     * @return address _symbol
     */
    function getSecurityTokenAddress(string _symbol) public view returns (address) {
      string memory __symbol = lower(_symbol);
      return symbols[__symbol];
    }

     /**
     * @dev Get security token data by its address
     * @param _securityToken Address of the Scurity token
     * @return string, address, bytes32
     */
    function getSecurityTokenData(address _securityToken) public view returns (string, address, bytes32) {
      return (
        securityTokens[_securityToken].symbol,
        ISecurityToken(_securityToken).owner(),
        securityTokens[_securityToken].tokenDetails
      );
    }
}

contract STVersionProxy_001 is ISTProxy {

  address public transferManagerFactory;
  address public permissionManagerFactory;

  //Shoud be set to false when we have more TransferManager options
  bool addTransferManager = true;
  bool addPermissionManager = true;

  function STVersionProxy_001(address _transferManagerFactory, address _permissionManagerFactory) public {
    transferManagerFactory = _transferManagerFactory;
    permissionManagerFactory = _permissionManagerFactory;
  }

  function deployToken(string _name, string _symbol, uint8 _decimals, bytes32 _tokenDetails, address _issuer)
  public returns (address) {
    address newSecurityTokenAddress = new SecurityToken(
      _name,
      _symbol,
      _decimals,
      _tokenDetails,
      msg.sender
    );

    if (addPermissionManager) {
      SecurityToken(newSecurityTokenAddress).addModule(permissionManagerFactory, "", 0, 0, true);
    }
    if (addTransferManager) {
      SecurityToken(newSecurityTokenAddress).addModule(transferManagerFactory, "", 0, 0, true);
    }

    SecurityToken(newSecurityTokenAddress).transferOwnership(_issuer);

    return newSecurityTokenAddress;
  }
}