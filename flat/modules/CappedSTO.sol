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

contract ISTO is IModule {

    enum FundraiseType { ETH, POLY }
    FundraiseType public fundraiseType;

    address public polyAddress;

    function _check(uint8 _fundraiseType, address _polyToken) internal {
        if (_fundraiseType == 1) {
            fundraiseType = FundraiseType(_fundraiseType);
            require(_polyToken != address(0));
            polyAddress = _polyToken;
        }
        else
            fundraiseType = FundraiseType(0);
    }

    function _forwardPoly(address _beneficiary, address _to, uint256 _fundsAmount) internal {
        ERC20(polyAddress).transferFrom(_beneficiary, _to, _fundsAmount);
    }

    function verifyInvestment(address _beneficiary, uint256 _fundsAmount) view public returns(bool) {
        return ERC20(polyAddress).allowance(this, _beneficiary) >= _fundsAmount;
    }

    function getRaiseEther() public view returns (uint256);

    function getRaisePOLY() public view returns (uint256);

    function getNumberInvestors() public view returns (uint256);

    //More stuff here

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

  bytes32 public ADMIN = "ADMIN";

  // Address where funds are collected
  address public wallet;

  // How many token units a buyer gets per wei
  uint256 public rate;

  // Amount of funds raised
  uint256 public fundsRaised;

  uint256 public investorCount;

  // Start time of the STO
  uint256 public startTime;
  // End time of the STO
  uint256 public endTime;

  //How much funding this STO will be allowed to raise
  uint256 public cap;

  mapping (address => uint256) public investors;

 /**
 * Event for token purchase logging
 * @param purchaser who paid for the tokens
 * @param beneficiary who got the tokens
 * @param value weis paid for purchase
 * @param amount amount of tokens purchased
 */
event TokenPurchase(address indexed purchaser, address indexed beneficiary, uint256 value, uint256 amount);

  function CappedSTO(address _securityToken) public
  IModule(_securityToken)
  {
  }

  function configure(
      uint256 _startTime,
      uint256 _endTime,
      uint256 _cap,
      uint256 _rate,
      uint8 _fundRaiseType,
      address _polyToken,
      address _fundsReceiver
    )
    public
    onlyFactory
    {
      require(_rate > 0);
      require(_fundsReceiver != address(0));
      require(_startTime >= now && _endTime > _startTime);
      require(_cap > 0);
      startTime = _startTime;
      endTime = _endTime;
      cap = _cap;
      rate = _rate;
      wallet = _fundsReceiver;
      _check(_fundRaiseType, _polyToken);
  }

  function getInitFunction() public returns (bytes4) {
    return bytes4(keccak256("configure(uint256,uint256,uint256,uint256,uint8,address,address)"));
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
    require(uint(fundraiseType) == 0);

    uint256 weiAmount = msg.value;
    _processTx(_beneficiary, weiAmount);

    _forwardFunds();
    _postValidatePurchase(_beneficiary, weiAmount);
  }

  /**
    * @dev low level token purchase
    * @param _beneficiary Address performing the token purchase
    * @param _investedPOLY Amount of POLY invested
    */
  function buyTokensWithPoly(address _beneficiary, uint256 _investedPOLY) public {
       require(uint(fundraiseType) == 1);
       verifyInvestment(_beneficiary, _investedPOLY);
      _processTx(_beneficiary, _investedPOLY);
      _forwardPoly(_beneficiary, wallet, _investedPOLY);
      _postValidatePurchase(_beneficiary, _investedPOLY);
  }

   // -----------------------------------------
   // Internal interface (extensible)
   // -----------------------------------------

   /**
    * Processing the purchase as well as verify the required validations
    * @param _beneficiary Address performing the token purchase
    * @param _investedAmount Value in wei involved in the purchase
   */
  function _processTx(address _beneficiary, uint256 _investedAmount) internal {

    _preValidatePurchase(_beneficiary, _investedAmount);
    // calculate token amount to be created
    uint256 tokens = _getTokenAmount(_investedAmount);

    // update state
    fundsRaised = fundsRaised.add(_investedAmount);

    _processPurchase(_beneficiary, tokens);
    TokenPurchase(msg.sender, _beneficiary, _investedAmount, tokens);

    _updatePurchasingState(_beneficiary, _investedAmount);
  }

  /**
   * @dev Validation of an incoming purchase. Use require statements to revert state when conditions are not met. Use super to concatenate validations.
   * @param _beneficiary Address performing the token purchase
   * @param _investedAmount Value in wei involved in the purchase
   */
  function _preValidatePurchase(address _beneficiary, uint256 _investedAmount) internal {
    require(_beneficiary != address(0));
    require(_investedAmount != 0);
    require(fundsRaised.add(_investedAmount) <= cap);
    require(now >= startTime && now <= endTime);
  }

  /**
   * @dev Validation of an executed purchase. Observe state and use revert statements to undo rollback when valid conditions are not met.
   * @param _beneficiary Address performing the token purchase
   * @param _investedAmount Value in wei involved in the purchase
   */
  function _postValidatePurchase(address _beneficiary, uint256 _investedAmount) internal {
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
   * @param _investedAmount Value in wei involved in the purchase
   */
  function _updatePurchasingState(address _beneficiary, uint256 _investedAmount) internal {
    // optional override
  }

  /**
   * @dev Override to extend the way in which ether is converted to tokens.
   * @param _investedAmount Value in wei to be converted into tokens
   * @return Number of tokens that can be purchased with the specified _investedAmount
   */
  function _getTokenAmount(uint256 _investedAmount) internal view returns (uint256) {
    return _investedAmount.mul(rate);
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
    return fundsRaised >= cap;
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

  function permissions() public returns(bytes32[]) {
    bytes32[] memory allPermissions = new bytes32[](1);
    allPermissions[0] = ADMIN;
    return allPermissions;
  }

}