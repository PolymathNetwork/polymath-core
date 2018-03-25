pragma solidity ^0.4.18;

contract IST20 {

    // off-chain hash
    bytes32 public tokenDetails;

    //transfer, transferFrom must respect use respect the result of verifyTransfer
    function verifyTransfer(address _from, address _to, uint256 _amount) public returns (bool success);

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

    function permissions() public returns(bytes32[]);
}

contract IPermissionManager is IModule {

    function checkPermission(address _delegate, address _module, bytes32 _perm) view public returns(bool);

    function changePermission(address _delegate, address _module, bytes32 _perm, bool _valid) public returns(bool);

    function delegateDetails(address _delegate) public returns(bytes32);

}

/////////////////////
// Module permissions
/////////////////////
//                          Owner       CHANGE_PERMISSION
// addPermission                X               X
// changePermission           X               X
//

contract GeneralPermissionManager is IPermissionManager {

  mapping (address => mapping (address => mapping (bytes32 => bool))) public perms;

  mapping (address => bytes32) public delegateDetails;

  bytes32 public CHANGE_PERMISSION = "CHANGE_PERMISSION";

  function GeneralPermissionManager(address _securityToken) public
  IModule(_securityToken)
  {
  }

  function getInitFunction() public returns(bytes4) {
    return bytes4(0);
  }

  function checkPermission(address _delegate, address _module, bytes32 _perm) view public returns(bool) {
    if (delegateDetails[_delegate] != bytes32(0)) {
      return perms[_module][_delegate][_perm];
    }
    else
      return false;
  }

  function addPermission(address _delegate, bytes32 _details) public withPerm(CHANGE_PERMISSION) {
    delegateDetails[_delegate] = _details;
  }

  function changePermission(address _delegate, address _module, bytes32 _perm, bool _valid) public withPerm(CHANGE_PERMISSION) returns(bool) {
    require(delegateDetails[_delegate] != bytes32(0));
    perms[_module][_delegate][_perm] = _valid;
  }

  function delegateDetails(address _delegate) public returns(bytes32) {
    return delegateDetails[_delegate];
  }

  function permissions() public returns(bytes32[]) {
    bytes32[] memory allPermissions = new bytes32[](1);
    allPermissions[0] = CHANGE_PERMISSION;
    return allPermissions;
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

contract GeneralPermissionManagerFactory is IModuleFactory {

  function deploy(bytes /* _data */) external returns(address) {
    //polyToken.transferFrom(msg.sender, owner, getCost());
    return address(new GeneralPermissionManager(msg.sender));
  }

  function getCost() view external returns(uint256) {
    return 0;
  }

  function getType() view external returns(uint8) {
      return 1;
  }

  function getName() view external returns(bytes32) {
    return "GeneralPermissionManager";
  }

  function getDescription() view external returns(string) {
    return "Manage permissions within the Security Token and attached modules";
  }

  function getTitle() view external returns(string) {
    return "General Permission Manager";
  }


}