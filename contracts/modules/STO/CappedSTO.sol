pragma solidity ^0.4.21;

import "./ISTO.sol";
import "../../interfaces/IST20.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";


contract CappedSTO is ISTO {
    using SafeMath for uint256;

    // Address where funds are collected and tokens are issued to
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

    // Amount of tokens sold
    uint256 public tokensSold;

    //How many tokens this STO will be allowed to sell to investors
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

    //////////////////////////////////
    /**
    * @dev fallback function ***DO NOT OVERRIDE***
    */
    function () external payable {
        buyTokens(msg.sender);
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

    /**
      * @dev low level token purchase ***DO NOT OVERRIDE***
      * @param _beneficiary Address performing the token purchase
      */
    function buyTokens(address _beneficiary) public payable {
        require(fundraiseType == FundraiseType.ETH);

        uint256 weiAmount = msg.value;
        _processTx(_beneficiary, weiAmount);

        _forwardFunds();
        _postValidatePurchase(_beneficiary, weiAmount);
    }

    /**
      * @dev low level token purchase
      * @param _investedPOLY Amount of POLY invested
      */
    function buyTokensWithPoly(uint256 _investedPOLY) public {
        require(fundraiseType == FundraiseType.POLY);
        require(verifyInvestment(msg.sender, _investedPOLY));
        _processTx(msg.sender, _investedPOLY);
        _forwardPoly(msg.sender, wallet, _investedPOLY);
        _postValidatePurchase(msg.sender, _investedPOLY);
    }

    /**
    * @dev Checks whether the cap has been reached.
    * @return Whether the cap was reached
    */
    function capReached() public view returns (bool) {
        return fundsRaised >= cap;
    }

    function getRaisedEther() public view returns (uint256) {
        if (fundraiseType == FundraiseType.ETH)
            return fundsRaised;
        else
            return 0;
    }

    function getRaisedPOLY() public view returns (uint256) {
        if (fundraiseType == FundraiseType.POLY)
            return fundsRaised;
        else
            return 0;
    }

    function getNumberInvestors() public view returns (uint256) {
        return investorCount;
    }

    function getPermissions() public view returns(bytes32[]) {
        bytes32[] memory allPermissions = new bytes32[](0);
        return allPermissions;
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
        tokensSold = tokensSold.add(tokens);

        _processPurchase(_beneficiary, tokens);
        emit TokenPurchase(msg.sender, _beneficiary, _investedAmount, tokens);

        _updatePurchasingState(_beneficiary, _investedAmount);
    }

    /**
    * @dev Validation of an incoming purchase.
      Use require statements to revert state when conditions are not met. Use super to concatenate validations.
    * @param _beneficiary Address performing the token purchase
    * @param _investedAmount Value in wei involved in the purchase
    */
    function _preValidatePurchase(address _beneficiary, uint256 _investedAmount) internal view {
        require(_beneficiary != address(0));
        require(_investedAmount != 0);
        require(tokensSold.add(_getTokenAmount(_investedAmount)) <= cap);
        require(now >= startTime && now <= endTime);
    }

    /**
    * @dev Validation of an executed purchase.
      Observe state and use revert statements to undo rollback when valid conditions are not met.
    */
    function _postValidatePurchase(address /*_beneficiary*/, uint256 /*_investedAmount*/) internal pure {
      // optional override
    }

    /**
    * @dev Source of tokens.
      Override this method to modify the way in which the crowdsale ultimately gets and sends its tokens.
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
    * @dev Override for extensions that require an internal state to check for validity
      (current user contributions, etc.)
    */
    function _updatePurchasingState(address /*_beneficiary*/, uint256 /*_investedAmount*/) internal pure {
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

}
