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

contract CappedSTO is ISTO {
  using SafeMath for uint256;

  // The token being sold
  address public securityToken;

  // Address where funds are collected
  address public wallet;

  // How many token units a buyer gets per wei
  uint256 public rate;

  // Amount of wei raised
  uint256 public weiRaised;

  address public owner;
  uint256 public investorCount;

  // Start time of the STO
  uint256 public startTime;
  // End time of the STO
  uint256 public endTime;

  //
  uint256 public cap;

  string public someString;

  mapping (address => uint256) public investors;

  modifier onlyOwner {
    require(msg.sender == owner);
    _;
  }

  modifier onlyOwnerOrFactory {
    require((msg.sender == owner) || (msg.sender == factory));
    _;
  }

 /**
 * Event for token purchase logging
 * @param purchaser who paid for the tokens
 * @param beneficiary who got the tokens
 * @param value weis paid for purchase
 * @param amount amount of tokens purchased
 */
event TokenPurchase(address indexed purchaser, address indexed beneficiary, uint256 value, uint256 amount);

  function CappedSTO(address _owner, address _securityToken) public {
    require(_owner != address(0));
    require(_securityToken != address(0));

    //For the duration of the constructor, caller is the owner
    owner = _owner;
    securityToken = _securityToken;
    factory = msg.sender;
  }

  function configure(uint256 _startTime, uint256 _endTime, uint256 _cap, uint _rate) public onlyOwnerOrFactory {
    require(_rate > 0);
    startTime = _startTime;
    endTime = _endTime;
    cap = _cap;
    rate = _rate;
  }

  function getInitFunction() public returns (bytes4) {
    return bytes4(keccak256("configure(uint256,uint256,uint256,uint256)"));
  }

//////////////////////////////////

  /**
   * @dev fallback function ***DO NOT OVERRIDE***
   */
  function () external payable {
    buyTokens(msg.sender);
  }

  /**
   * @dev low level token purchase ***DO NOT OVERRIDE***
   * @param _beneficiary Address performing the token purchase
   */
  function buyTokens(address _beneficiary) public payable {

    uint256 weiAmount = msg.value;
    _preValidatePurchase(_beneficiary, weiAmount);

    // calculate token amount to be created
    uint256 tokens = _getTokenAmount(weiAmount);

    // update state
    weiRaised = weiRaised.add(weiAmount);

    _processPurchase(_beneficiary, tokens);
    TokenPurchase(msg.sender, _beneficiary, weiAmount, tokens);

    _updatePurchasingState(_beneficiary, weiAmount);

    _forwardFunds();
    _postValidatePurchase(_beneficiary, weiAmount);
  }

  // -----------------------------------------
  // Internal interface (extensible)
  // -----------------------------------------

  /**
   * @dev Validation of an incoming purchase. Use require statements to revert state when conditions are not met. Use super to concatenate validations.
   * @param _beneficiary Address performing the token purchase
   * @param _weiAmount Value in wei involved in the purchase
   */
  function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) internal {
    require(_beneficiary != address(0));
    require(_weiAmount != 0);
    require(weiRaised.add(_weiAmount) <= cap);
  }

  /**
   * @dev Validation of an executed purchase. Observe state and use revert statements to undo rollback when valid conditions are not met.
   * @param _beneficiary Address performing the token purchase
   * @param _weiAmount Value in wei involved in the purchase
   */
  function _postValidatePurchase(address _beneficiary, uint256 _weiAmount) internal {
    // optional override
  }

  /**
   * @dev Source of tokens. Override this method to modify the way in which the crowdsale ultimately gets and sends its tokens.
   * @param _beneficiary Address performing the token purchase
   * @param _tokenAmount Number of tokens to be emitted
   */
  function _deliverTokens(address _beneficiary, uint256 _tokenAmount) internal {
    require(IST20(securityToken).mint(_beneficiary, _tokenAmount));
  }

  /**
   * @dev Executed when a purchase has been validated and is ready to be executed. Not necessarily emits/sends tokens.
   * @param _beneficiary Address receiving the tokens
   * @param _tokenAmount Number of tokens to be purchased
   */
  function _processPurchase(address _beneficiary, uint256 _tokenAmount) internal {
    if (investors[_beneficiary] == 0) {
      investorCount = investorCount + 1;
    }
    investors[_beneficiary] = investors[_beneficiary].add(_tokenAmount);

    _deliverTokens(_beneficiary, _tokenAmount);
  }

  /**
   * @dev Override for extensions that require an internal state to check for validity (current user contributions, etc.)
   * @param _beneficiary Address receiving the tokens
   * @param _weiAmount Value in wei involved in the purchase
   */
  function _updatePurchasingState(address _beneficiary, uint256 _weiAmount) internal {
    // optional override
  }

  /**
   * @dev Override to extend the way in which ether is converted to tokens.
   * @param _weiAmount Value in wei to be converted into tokens
   * @return Number of tokens that can be purchased with the specified _weiAmount
   */
  function _getTokenAmount(uint256 _weiAmount) internal view returns (uint256) {
    return _weiAmount.mul(rate);
  }

  /**
   * @dev Determines how ETH is stored/forwarded on purchases.
   */
  function _forwardFunds() internal {
    wallet.transfer(msg.value);
  }

  /**
   * @dev Checks whether the cap has been reached.
   * @return Whether the cap was reached
   */
  function capReached() public view returns (bool) {
    return weiRaised >= cap;
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

//Simple interface that any module contracts should implement
contract IModuleFactory {

    //TODO: Add delegates to this
    //Should create an instance of the Module, or throw
    function deploy(address _owner, bytes _data) external returns(address);

    function getType() view external returns(uint8);

    function getName() view external returns(bytes32);

    //Return the cost (in POLY) to use this factory
    function getCost() view external returns(uint256);

    //Pull function sig from _data
    function getSig(bytes _data) internal pure returns (bytes4 sig) {
        uint l = _data.length < 4 ? _data.length : 4;
        for (uint i = 0; i < l; i++) {
            sig = bytes4(uint(sig) + uint(_data[i]) * (2 ** (8 * (l - 1 - i))));
        }
    }

}

contract CappedSTOFactory is IModuleFactory {

  function deploy(address _owner, bytes _data) external returns(address) {
      //Check valid bytes - can only call module init function
      CappedSTO cappedSTO = new CappedSTO(_owner, msg.sender);
      //Checks that _data is valid (not calling anything it shouldn't)
      require(getSig(_data) == cappedSTO.getInitFunction());
      require(address(cappedSTO).call(_data));
      return address(cappedSTO);
  }

  function getCost() view external returns(uint256) {
      return 0;
  }

  function getType() view external returns(uint8) {
      return 2;
  }

  function getName() view external returns(bytes32) {
      return "CappedSTO";
  }


}