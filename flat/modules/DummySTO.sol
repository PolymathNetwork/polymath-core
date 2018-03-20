pragma solidity ^0.4.18;

//Simple interface that any module contracts should implement
contract IModule {
    function getInitFunction() public returns (bytes4);
    address public factory;
}

contract ISTO is IModule {

    function getRaiseEther() public view returns (uint256);

    function getRaisePOLY() public view returns (uint256);

    function getNumberInvestors() public view returns (uint256);

    //More stuff here

}

contract IST20 {

    // off-chain hash
    bytes32 public tokenDetails;

    //transfer, transferFrom must respect use respect the result of verifyTransfer
    function verifyTransfer(address _from, address _to, uint256 _amount) public returns (bool success);

    //used to create tokens
    function mint(address _investor, uint256 _amount) public returns (bool success);
}

interface IDelegable {

    function grantPermission(address _delegate, address _module) public;

    /// WIP
    function checkPermissions(address _module, address _delegate) public;

}

contract DelegablePorting {

    IDelegable delegable;

    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    modifier onlyOwnerOrDelegates {
        require((msg.sender == owner) || validateDelegate(msg.sender));
        _;
    }

    function DelegablePorting(address _owner, address _delegable) public {
        owner = _owner;
        delegable = IDelegable(_delegable);
    }

    function grantPermToDelegate(address _delegate) onlyOwner public {
        require(_delegate != address(0));
        delegable.grantPermission(_delegate, this);
    }

    function grantPermToDelegatesMulti(address[] _delegates) onlyOwner public {
        for (uint i = 0; i < _delegates.length; i++) {
            grantPermToDelegate(_delegates[i]);
        }
    }

    // TODO : to check according to the permission 
    function validateDelegate(address _delegate) public returns(bool) {
        // TODO: not decided yet the return value of the checkPermissions 
        delegable.checkPermissions(this, _delegate);
        return true;
    }


}

contract DummySTO is ISTO {

  address public securityToken;
  address public owner;
  uint256 public investorCount;

  uint256 public startTime;
  uint256 public endTime;
  uint256 public cap;
  string public someString;

  event LogGenerateTokens(address _investor, uint256 _amount);

  mapping (address => uint256) public investors;

  modifier onlyOwner {
    require(msg.sender == owner);
    _;
  }

  modifier onlyOwnerOrFactory {
    require((msg.sender == owner) || (msg.sender == factory));
    _;
  }

  function DummySTO(address _owner, address _securityToken) public {
    //For the duration of the constructor, caller is the owner
    owner = _owner;
    securityToken = _securityToken;
    factory = msg.sender;
  }

  function configure(uint256 _startTime, uint256 _endTime, uint256 _cap, string _someString) public onlyOwnerOrFactory {
    startTime = _startTime;
    endTime = _endTime;
    cap = _cap;
    someString = _someString;
  }

  function getInitFunction() public returns (bytes4) {
    return bytes4(keccak256("configure(uint256,uint256,uint256,string)"));
  }

  function generateTokens(address _investor, uint256 _amount) public onlyOwner {
    require(_amount > 0);
    IST20(securityToken).mint(_investor, _amount);
    if (investors[_investor] == 0) {
      investorCount = investorCount + 1;
    }
    //TODO: Add SafeMath maybe
    investors[_investor] = investors[_investor] + _amount;
    LogGenerateTokens(_investor, _amount);
  }

  function getRaiseEther() view public returns (uint256) {
    return 0;
  }

  function getRaisePOLY() view public returns (uint256) {
    return 0;
  }

  function getNumberInvestors() view public returns (uint256) {
    return investorCount;
  }


}