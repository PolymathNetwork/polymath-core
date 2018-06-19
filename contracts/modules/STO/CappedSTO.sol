pragma solidity ^0.4.24;

import "./ISTO.sol";
import "../../interfaces/IST20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
 * @title STO module for standard capped crowdsale
 */
contract CappedSTO is ISTO {
    using SafeMath for uint256;

    // Address where funds are collected and tokens are issued to
    address public wallet;

    // How many token units a buyer gets per wei / base unit of POLY
    uint256 public rate;

    // Amount of funds raised
    uint256 public fundsRaised;

    uint256 public investorCount;

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

    constructor (address _securityToken, address _polyAddress) public
    IModule(_securityToken, _polyAddress)
    {
    }

    //////////////////////////////////
    /**
    * @notice fallback function ***DO NOT OVERRIDE***
    */
    function () external payable {
        buyTokens(msg.sender);
    }

    /**
     * @notice Function used to intialize the contract variables
     * @param _startTime Unix timestamp at which offering get started
     * @param _endTime Unix timestamp at which offering get ended
     * @param _cap Maximum No. of tokens for sale
     * @param _rate Token units a buyer gets per wei / base unit of POLY
     * @param _fundRaiseType Type of currency used to collect the funds
     * @param _fundsReceiver Ethereum account address to hold the funds
     */
    function configure(
        uint256 _startTime,
        uint256 _endTime,
        uint256 _cap,
        uint256 _rate,
        uint8 _fundRaiseType,
        address _fundsReceiver
    )
    public
    onlyFactory
    {
        require(_rate > 0, "Rate of token should be greater than 0");
        require(_fundsReceiver != address(0), "Zero address is not permitted");
        require(_startTime >= now && _endTime > _startTime, "Date parameters are not valid");
        require(_cap > 0, "Cap should be greater than 0");
        startTime = _startTime;
        endTime = _endTime;
        cap = _cap;
        rate = _rate;
        wallet = _fundsReceiver;
        _check(_fundRaiseType);
    }

    /**
     * @notice This function returns the signature of configure function
     */
    function getInitFunction() public returns (bytes4) {
        return bytes4(keccak256("configure(uint256,uint256,uint256,uint256,uint8,address)"));
    }

    /**
      * @notice low level token purchase ***DO NOT OVERRIDE***
      * @param _beneficiary Address performing the token purchase
      */
    function buyTokens(address _beneficiary) public payable {
        require(!paused);
        require(fundraiseType == FundraiseType.ETH, "ETH should be the mode of investment");

        uint256 weiAmount = msg.value;
        _processTx(_beneficiary, weiAmount);

        _forwardFunds();
        _postValidatePurchase(_beneficiary, weiAmount);
    }

    /**
      * @notice low level token purchase
      * @param _investedPOLY Amount of POLY invested
      */
    function buyTokensWithPoly(uint256 _investedPOLY) public {
        require(!paused);
        require(fundraiseType == FundraiseType.POLY, "POLY should be the mode of investment");
        require(verifyInvestment(msg.sender, _investedPOLY), "Not valid Investment");
        _processTx(msg.sender, _investedPOLY);
        _forwardPoly(msg.sender, wallet, _investedPOLY);
        _postValidatePurchase(msg.sender, _investedPOLY);
    }

    /**
    * @notice Checks whether the cap has been reached.
    * @return bool Whether the cap was reached
    */
    function capReached() public view returns (bool) {
        return tokensSold >= cap;
    }

    /**
     * @notice Return ETH raised by the STO
     */
    function getRaisedEther() public view returns (uint256) {
        if (fundraiseType == FundraiseType.ETH)
            return fundsRaised;
        else
            return 0;
    }

    /**
     * @notice Return POLY raised by the STO
     */
    function getRaisedPOLY() public view returns (uint256) {
        if (fundraiseType == FundraiseType.POLY)
            return fundsRaised;
        else
            return 0;
    }

    /**
     * @notice Return the total no. of investors
     */
    function getNumberInvestors() public view returns (uint256) {
        return investorCount;
    }

    /**
     * @notice Return the permissions flag that are associated with STO
     */
    function getPermissions() public view returns(bytes32[]) {
        bytes32[] memory allPermissions = new bytes32[](0);
        return allPermissions;
    }

    /**
     * @notice Return the STO details
     */
    function getSTODetails() public view returns(uint256, uint256, uint256, uint256, uint256, uint256, uint256, bool) {
        return (
            startTime,
            endTime,
            cap,
            rate,
            fundsRaised,
            investorCount,
            tokensSold,
            (fundraiseType == FundraiseType.POLY)
        );
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
    * @notice Validation of an incoming purchase.
      Use require statements to revert state when conditions are not met. Use super to concatenate validations.
    * @param _beneficiary Address performing the token purchase
    * @param _investedAmount Value in wei involved in the purchase
    */
    function _preValidatePurchase(address _beneficiary, uint256 _investedAmount) internal view {
        require(_beneficiary != address(0), "Beneficiary address should not be 0x");
        require(_investedAmount != 0, "Amount invested should not be equal to 0");
        require(tokensSold.add(_getTokenAmount(_investedAmount)) <= cap, "Investment more than cap is not allowed");
        require(now >= startTime && now <= endTime, "Offering is closed/Not yet started");
    }

    /**
    * @notice Validation of an executed purchase.
      Observe state and use revert statements to undo rollback when valid conditions are not met.
    */
    function _postValidatePurchase(address /*_beneficiary*/, uint256 /*_investedAmount*/) internal pure {
      // optional override
    }

    /**
    * @notice Source of tokens.
      Override this method to modify the way in which the crowdsale ultimately gets and sends its tokens.
    * @param _beneficiary Address performing the token purchase
    * @param _tokenAmount Number of tokens to be emitted
    */
    function _deliverTokens(address _beneficiary, uint256 _tokenAmount) internal {
        require(IST20(securityToken).mint(_beneficiary, _tokenAmount), "Error in minting the tokens");
    }

    /**
    * @notice Executed when a purchase has been validated and is ready to be executed. Not necessarily emits/sends tokens.
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
    * @notice Override for extensions that require an internal state to check for validity
      (current user contributions, etc.)
    */
    function _updatePurchasingState(address /*_beneficiary*/, uint256 /*_investedAmount*/) internal pure {
      // optional override
    }

    /**
    * @notice Override to extend the way in which ether is converted to tokens.
    * @param _investedAmount Value in wei to be converted into tokens
    * @return Number of tokens that can be purchased with the specified _investedAmount
    */
    function _getTokenAmount(uint256 _investedAmount) internal view returns (uint256) {
        return _investedAmount.mul(rate);
    }

    /**
    * @notice Determines how ETH is stored/forwarded on purchases.
    */
    function _forwardFunds() internal {
        wallet.transfer(msg.value);
    }

    /**
     * @notice Internal function used to check the type of fund raise currency
     * @param _fundraiseType Type of currency used to collect the funds
     */
    function _check(uint8 _fundraiseType) internal {
        require(_fundraiseType == 0 || _fundraiseType == 1, "Not a valid fundraise type");
        if (_fundraiseType == 0) {
            fundraiseType = FundraiseType.ETH;
        }
        if (_fundraiseType == 1) {
            require(address(polyToken) != address(0), "Address of the polyToken should not be 0x");
            fundraiseType = FundraiseType.POLY;
        }
    }

    /**
     * @notice Internal function used to forward the POLY raised to beneficiary address
     * @param _beneficiary Address of the funds reciever
     * @param _to Address who wants to ST-20 tokens
     * @param _fundsAmount Amount invested by _to
     */
    function _forwardPoly(address _beneficiary, address _to, uint256 _fundsAmount) internal {
        polyToken.transferFrom(_beneficiary, _to, _fundsAmount);
    }

}
