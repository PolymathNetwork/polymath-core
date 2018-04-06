pragma solidity ^0.4.21;

contract IST20 {

    // off-chain hash
    bytes32 public tokenDetails;

    //transfer, transferFrom must respect use respect the result of verifyTransfer
    function verifyTransfer(address _from, address _to, uint256 _amount) public view returns (bool success);

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
    function checkPermission(address _delegate, address _module, bytes32 _perm) public view returns(bool);

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

    function getType() public view returns(uint8);

    function getName() public view returns(bytes32);

    //Return the cost (in POLY) to use this factory
    function getCost() public view returns(uint256);

    function getDescription() public view returns(string);

    function getTitle() public view returns(string);

    function getInstructions() public view returns (string);

    //Pull function sig from _data
    function getSig(bytes _data) internal pure returns (bytes4 sig) {
        uint len = _data.length < 4 ? _data.length : 4;
        for (uint i = 0; i < len; i++) {
            sig = bytes4(uint(sig) + uint(_data[i]) * (2 ** (8 * (len - 1 - i))));
        }
    }

}

//Simple interface that any module contracts should implement
contract IModule {

    address public factory;

    address public securityToken;

    function IModule(address _securityToken) public {
        securityToken = _securityToken;
        factory = msg.sender;
    }

    function getInitFunction() public returns (bytes4);
    
    //Allows owner, factory or permissioned delegate
    modifier withPerm(bytes32 _perm) {
        bool isOwner = msg.sender == ISecurityToken(securityToken).owner();
        bool isFactory = msg.sender == factory;
        require(isOwner||isFactory||ISecurityToken(securityToken).checkPermission(msg.sender, address(this), _perm));
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

    function getPermissions() public view returns(bytes32[]);
}

contract IPermissionManager is IModule {

    function checkPermission(address _delegate, address _module, bytes32 _perm) public view returns(bool);

    function changePermission(address _delegate, address _module, bytes32 _perm, bool _valid) public returns(bool);

    function getDelegateDetails(address _delegate) public view returns(bytes32);

}

/////////////////////
// Module permissions
/////////////////////
//                          Owner       CHANGE_PERMISSION
// addPermission              X               X
// changePermission           X               X
//

contract GeneralPermissionManager is IPermissionManager {

    // Mapping used to hold the permissions on the modules provided to delegate
    mapping (address => mapping (address => mapping (bytes32 => bool))) public perms;
    // Mapping hold the delagate details
    mapping (address => bytes32) public delegateDetails;
    // Permission flag
    bytes32 public constant CHANGE_PERMISSION = "CHANGE_PERMISSION";

    /// Event emitted after any permission get changed for the delegate
    event LogChangePermission(address _delegate, address _module, bytes32 _perm, bool _valid, uint256 _timestamp);
    /// Use to notify when delegate is added in permission manager contract
    event LogAddPermission(address _delegate, bytes32 _details, uint256 _timestamp);

    /// @notice constructor
    function GeneralPermissionManager(address _securityToken) public
    IModule(_securityToken)
    {
    }

    /**
    * @dev Init function i.e generalise function to maintain the structure of the module contract
    * @return bytes4
    */
    function getInitFunction() public returns(bytes4) {
        return bytes4(0);
    }

    /**
    * @dev use to check the permission on delegate corresponds to module contract address
    * @param _delegate Ethereum address of the delegate
    * @param _module Ethereum contract address of the module
    * @param _perm Permission flag
    * @return bool
    */
    function checkPermission(address _delegate, address _module, bytes32 _perm) public view returns(bool) {
        if (delegateDetails[_delegate] != bytes32(0)) {
            return perms[_module][_delegate][_perm];
        }else
            return false;
    }

    /**
    * @dev use to add the details of the delegate
    * @param _delegate Ethereum address of the delegate
    * @param _details Details about the delegate i.e `Belongs to financial firm`
    */
    function addPermission(address _delegate, bytes32 _details) public withPerm(CHANGE_PERMISSION) {
        delegateDetails[_delegate] = _details;
        emit LogAddPermission(_delegate, _details, now);
    }

  /**
    * @dev Use to provide/change the permission to the delegate corresponds to the module contract
    * @param _delegate Ethereum address of the delegate
    * @param _module Ethereum contract address of the module
    * @param _perm Permission flag
    * @param _valid Bool flag use to switch on/off the permission
    * @return bool
    */
    function changePermission(
        address _delegate,
        address _module,
        bytes32 _perm,
        bool _valid
    )
    public
    withPerm(CHANGE_PERMISSION)
    returns(bool)
    {
        require(delegateDetails[_delegate] != bytes32(0));
        perms[_module][_delegate][_perm] = _valid;
        emit LogChangePermission(_delegate, _module, _perm, _valid, now);
        return true;
    }

    /**
    * @dev Use to get the details of the delegate
    * @param _delegate Ethereum address of the delegate
    * @return Details of the delegate
    */
    function getDelegateDetails(address _delegate) public view returns(bytes32) {
        return delegateDetails[_delegate];
    }

    /**
    * @dev Use to get the Permission flag related the `this` contract
    * @return Array of permission flags
    */
    function getPermissions() public view returns(bytes32[]) {
        bytes32[] memory allPermissions = new bytes32[](1);
        allPermissions[0] = CHANGE_PERMISSION;
        return allPermissions;
    }

}

contract GeneralPermissionManagerFactory is IModuleFactory {

    function deploy(bytes /* _data */) external returns(address) {
      //polyToken.transferFrom(msg.sender, owner, getCost());
        return address(new GeneralPermissionManager(msg.sender));
    }

    function getCost() public view returns(uint256) {
        return 0;
    }

    function getType() public view returns(uint8) {
        return 1;
    }

    function getName() public view returns(bytes32) {
        return "GeneralPermissionManager";
    }

    function getDescription() public view returns(string) {
        return "Manage permissions within the Security Token and attached modules";
    }

    function getTitle() public  view returns(string) {
        return "General Permission Manager";
    }

    function getInstructions() public view returns(string) {
        return "Add and remove permissions for the SecurityToken and associated modules. Permission types should be encoded as bytes32 values, and attached using the withPerm modifier to relevant functions.No initFunction required.";
    }

}