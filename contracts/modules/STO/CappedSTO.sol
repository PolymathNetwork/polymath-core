pragma solidity ^0.4.18;

import './ISTO.sol';
import '../../interfaces/IST20.sol';
import 'zeppelin-solidity/contracts/math/SafeMath.sol';

contract CappedSTO is ISTO {
  using SafeMath for uint256;

  bytes32 public ADMIN = "ADMIN";

  // Address where funds are collected
  address public wallet;

  // How many token units a buyer gets per wei
  uint256 public rate;

  // Amount of crypto raised
  uint256 public cryptoRaised;

  uint256 public investorCount;

  // Start time of the STO
  uint256 public startTime;
  // End time of the STO
  uint256 public endTime;

  //
  uint256 public cap;

  string public someString;

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

  function configure(uint256 _startTime, uint256 _endTime, uint256 _cap, uint _rate, bytes8 _config, address _polyToken) public onlyFactory {
    require(_rate > 0);
    startTime = _startTime;
    endTime = _endTime;
    cap = _cap;
    rate = _rate;
     if (_config != bytes8(0)) {
        _check(_config, _polyToken);
    }
  }

  function getInitFunction() public returns (bytes4) {
    return bytes4(keccak256("configure(uint256,uint256,uint256,uint256,bytes8,address)"));
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
    require(!toggle);
    
    uint256 cryptoAmount = msg.value;
    _processTx(_beneficiary, cryptoAmount);

    _forwardFunds();
    _postValidatePurchase(_beneficiary, cryptoAmount);
  }
  
  /**
    * @dev low level token purchase 
    * @param _beneficiary Address performing the token purchase
    * @param _investedPOLY Amount of POLY invested
    */
  function buyTokensWithPoly(address _beneficiary, uint256 _investedPOLY) public {
       require(toggle);
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
    * @param _cryptoAmount Value in wei involved in the purchase
   */    
  function _processTx(address _beneficiary, uint256 _cryptoAmount) internal {
    
    _preValidatePurchase(_beneficiary, _cryptoAmount);
    // calculate token amount to be created
    uint256 tokens = _getTokenAmount(_cryptoAmount);

    // update state
    cryptoRaised = cryptoRaised.add(_cryptoAmount);

    _processPurchase(_beneficiary, tokens);
    TokenPurchase(msg.sender, _beneficiary, _cryptoAmount, tokens);

    _updatePurchasingState(_beneficiary, _cryptoAmount);
  }

  /**
   * @dev Validation of an incoming purchase. Use require statements to revert state when conditions are not met. Use super to concatenate validations.
   * @param _beneficiary Address performing the token purchase
   * @param _cryptoAmount Value in wei involved in the purchase
   */
  function _preValidatePurchase(address _beneficiary, uint256 _cryptoAmount) internal {
    require(_beneficiary != address(0));
    require(_cryptoAmount != 0);
    require(cryptoRaised.add(_cryptoAmount) <= cap);
    require(now >= startTime && now <= endTime);
  }

  /**
   * @dev Validation of an executed purchase. Observe state and use revert statements to undo rollback when valid conditions are not met.
   * @param _beneficiary Address performing the token purchase
   * @param _cryptoAmount Value in wei involved in the purchase
   */
  function _postValidatePurchase(address _beneficiary, uint256 _cryptoAmount) internal {
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
   * @param _cryptoAmount Value in wei involved in the purchase
   */
  function _updatePurchasingState(address _beneficiary, uint256 _cryptoAmount) internal {
    // optional override
  }

  /**
   * @dev Override to extend the way in which ether is converted to tokens.
   * @param _cryptoAmount Value in wei to be converted into tokens
   * @return Number of tokens that can be purchased with the specified _cryptoAmount
   */
  function _getTokenAmount(uint256 _cryptoAmount) internal view returns (uint256) {
    return _cryptoAmount.mul(rate);
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
    return cryptoRaised >= cap;
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
