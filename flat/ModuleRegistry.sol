pragma solidity ^0.4.18;

//Simple interface that any module contracts should implement
interface IModuleRegistry {

    //Checks that module is correctly configured in registry
    function useModule(address _moduleFactory) external;

    function registerModule(address _moduleFactory) external returns(bool);

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
 * @title ERC20 interface
 * @dev see https://github.com/ethereum/EIPs/issues/20
 */
contract ERC20 is ERC20Basic {
  function allowance(address owner, address spender) public view returns (uint256);
  function transferFrom(address from, address to, uint256 value) public returns (bool);
  function approve(address spender, uint256 value) public returns (bool);
  event Approval(address indexed owner, address indexed spender, uint256 value);
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

contract IST20 {

    // off-chain hash
    bytes32 public tokenDetails;

    //transfer, transferFrom must respect use respect the result of verifyTransfer
    function verifyTransfer(address _from, address _to, uint256 _amount) view public returns (bool success);

    //used to create tokens
    function mint(address _investor, uint256 _amount) public returns (bool success);
}

contract ISecurityToken is IST20, Ownable {

    //TODO: Factor out more stuff here
    function checkPermission(address _delegate, address _module, bytes32 _perm) view public returns(bool);

}

/**
* @title ModuleRegistry
* @notice Stores registered modules
* Could initially be centrally controlled (only Polymath can register modules)
* and then over time move to a more decentralised version (modules can be registerd provided POLY holders agree)
*/
contract ModuleRegistry is IModuleRegistry, Ownable {

    mapping (address => uint8) public registry;
    mapping (address => address[]) public reputation;
    mapping (uint8 => address[]) public moduleList;
    mapping (address => bool) public verified;

    event LogModuleUsed(address indexed _moduleFactory, address indexed _securityToken);
    event LogModuleRegistered(address indexed _moduleFactory, address indexed _owner);
    event LogModuleVerified(address indexed _moduleFactory, bool _verified);

    //Checks that module is correctly configured in registry
    function useModule(address _moduleFactory) external {
        require(registry[_moduleFactory] != 0);
        //To use a module, either it must be verified, or owned by the ST owner
        require(verified[_moduleFactory] || (IModuleFactory(_moduleFactory).owner() == ISecurityToken(msg.sender).owner()));
        reputation[_moduleFactory].push(msg.sender);
        LogModuleUsed(_moduleFactory, msg.sender);
    }

    /**
    * @dev Called by Polymath to register new modules for SecurityToken to use
    * @param _moduleFactory is the address of the module factory to be registered
    */
    function registerModule(address _moduleFactory) external returns(bool) {
        require(registry[_moduleFactory] == 0);
        IModuleFactory moduleFactory = IModuleFactory(_moduleFactory);
        require(moduleFactory.getType() != 0);
        registry[_moduleFactory] = moduleFactory.getType();
        moduleList[moduleFactory.getType()].push(_moduleFactory);
        reputation[_moduleFactory] = new address[](0);
        LogModuleRegistered(_moduleFactory, moduleFactory.owner());
        return true;
    }

    function verifyModule(address _moduleFactory, bool _verified) external onlyOwner returns(bool) {
        //Must already have been registered
        require(registry[_moduleFactory] != 0);
        verified[_moduleFactory] = _verified;
        LogModuleVerified(_moduleFactory, _verified);
        return true;
    }

}