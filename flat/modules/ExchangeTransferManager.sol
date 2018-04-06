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

contract ITransferManager is IModule {

    function verifyTransfer(address _from, address _to, uint256 _amount) public view returns(bool);

}

/////////////////////
// Module permissions
/////////////////////
//                                        Factory Owner
// modifyWhitelist                          X
// modifyWhitelistMulti                     X

contract ExchangeTransferManager is ITransferManager {

    address public exchange;
    mapping (address => bool) public whitelist;

    event LogModifyWhitelist(address _investor, uint256 _dateAdded, address _addedBy);

    function ExchangeTransferManager(address _securityToken)
    public
    IModule(_securityToken)
    {
    }

    function verifyTransfer(address _from, address _to, uint256 /*_amount*/) public view returns(bool) {
        if (_from == exchange) {
            return getExchangePermission(_to);
        } else if (_to == exchange) {
            return getExchangePermission(_from);
        }

        return false;
    }

    function configure(address _exchange) public onlyFactory {
        exchange = _exchange;
    }

    function getInitFunction() public returns(bytes4) {
        return bytes4(keccak256("configure(address)"));
    }

    function modifyWhitelist(address _investor, bool _valid) public onlyFactoryOwner {
        whitelist[_investor] = _valid;
        emit LogModifyWhitelist(_investor, now, msg.sender);
    }

    function modifyWhitelistMulti(address[] _investors, bool[] _valids) public onlyFactoryOwner {
        require(_investors.length == _valids.length);
        for (uint256 i = 0; i < _investors.length; i++) {
            modifyWhitelist(_investors[i], _valids[i]);
        }
    }

    function getPermissions() public view returns(bytes32[]) {
        bytes32[] memory allPermissions = new bytes32[](0);
        return allPermissions;
    }

    function getExchangePermission(address _investor) internal view returns (bool) {
        // This function could implement more complex logic, 
        // e.g. calling out to another contract maintained by the exchange to get list of allowed users
        return whitelist[_investor];
    }
}