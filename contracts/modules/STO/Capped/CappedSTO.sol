pragma solidity 0.5.8;

import "../STO.sol";
import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../../../interfaces/IGTM.sol";
import "./CappedSTOStorage.sol";

/**
 * @title STO module for standard capped crowdsale
 */
contract CappedSTO is CappedSTOStorage, STO, ReentrancyGuard {
    using SafeMath for uint256;

    /**
    * Event for token purchase logging
    * @param purchaser who paid for the tokens
    * @param beneficiary who got the tokens
    * @param value weis paid for purchase
    * @param amount amount of tokens purchased
    */
    event TokenPurchase(address indexed purchaser, address indexed beneficiary, uint256 value, uint256 amount);

    event SetAllowBeneficialInvestments(bool _allowed);

    event ReserveTokenMint(address indexed _owner, address indexed _wallet, uint256 _tokens);

    event ReserveTokenTransfer(address indexed _from, address indexed _wallet, uint256 _tokens);

    constructor(address _securityToken, address _polyToken) public Module(_securityToken, _polyToken) {

    }

    //////////////////////////////////
    /**
    * @notice fallback function ***DO NOT OVERRIDE***
    */
    function() external payable {
        buyTokens(msg.sender);
    }

    /**
     * @notice Function used to intialize the contract variables
     * @param _startTime Unix timestamp at which offering get started
     * @param _endTime Unix timestamp at which offering get ended
     * @param _cap Maximum No. of token base units for sale
     * @param _rate Token units a buyer gets multiplied by 10^18 per wei / base unit of POLY
     * @param _fundRaiseTypes Type of currency used to collect the funds
     * @param _fundsReceiver Ethereum account address to hold the funds
     * @param _treasuryWallet Ethereum account address to receive unsold tokens
     */
    function configure(
        uint256 _startTime,
        uint256 _endTime,
        uint256 _cap,
        uint256 _rate,
        FundRaiseType[] memory _fundRaiseTypes,
        address payable _fundsReceiver,
        address _treasuryWallet
    )
        public
        onlyFactory
    {
        require(endTime == 0, "Already configured");
        require(_rate > 0, "Rate of token should be greater than 0");
        require(_fundsReceiver != address(0), "Zero address is not permitted");
        /*solium-disable-next-line security/no-block-members*/
        require(_startTime >= now && _endTime > _startTime, "Date parameters are not valid");
        require(_cap > 0, "Cap should be greater than 0");
        require(_fundRaiseTypes.length == 1, "It only selects single fund raise type");
        startTime = _startTime;
        endTime = _endTime;
        cap = _cap;
        rate = _rate;
        wallet = _fundsReceiver;
        treasuryWallet = _treasuryWallet;
        _setFundRaiseType(_fundRaiseTypes);
    }

    /**
     * @notice This function returns the signature of configure function
     */
    function getInitFunction() public pure returns(bytes4) {
        return this.configure.selector;
    }

    /**
     * @notice This function will allow STO to pre-mint all tokens those will be distributed in sale
     */
    function allowPreMinting() external withPerm(ADMIN) {
        _allowPreMinting(cap);
    }

    /**
     * @notice This function will revoke the pre-mint flag of the STO
     */
    function revokePreMintFlag() external withPerm(ADMIN) {
        _revokePreMintFlag(cap);
    }

    /**
     * @notice Function to set allowBeneficialInvestments (allow beneficiary to be different to funder)
     * @param _allowBeneficialInvestments Boolean to allow or disallow beneficial investments
     */
    function changeAllowBeneficialInvestments(bool _allowBeneficialInvestments) public withPerm(OPERATOR) {
        require(_allowBeneficialInvestments != allowBeneficialInvestments, "Does not change value");
        allowBeneficialInvestments = _allowBeneficialInvestments;
        emit SetAllowBeneficialInvestments(allowBeneficialInvestments);
    }

    /**
      * @notice Low level token purchase ***DO NOT OVERRIDE***
      * @param _beneficiary Address performing the token purchase
      */
    function buyTokens(address _beneficiary) public payable whenNotPaused nonReentrant {
        if (!allowBeneficialInvestments) {
            require(_beneficiary == msg.sender, "Beneficiary address does not match msg.sender");
        }

        require(fundRaiseTypes[uint8(FundRaiseType.ETH)], "Mode of investment is not ETH");

        uint256 weiAmount = msg.value;
        uint256 refund = _processTx(_beneficiary, weiAmount);
        weiAmount = weiAmount.sub(refund);

        _forwardFunds(refund);
    }

    /**
      * @notice low level token purchase
      * @param _investedPOLY Amount of POLY invested
      */
    function buyTokensWithPoly(uint256 _investedPOLY) public whenNotPaused nonReentrant {
        require(fundRaiseTypes[uint8(FundRaiseType.POLY)], "Mode of investment is not POLY");
        uint256 refund = _processTx(msg.sender, _investedPOLY);
        _forwardPoly(msg.sender, wallet, _investedPOLY.sub(refund));
    }

    /**
    * @notice Checks whether the cap has been reached.
    * @return bool Whether the cap was reached
    */
    function capReached() public view returns(bool) {
        return totalTokensSold >= cap;
    }

    /**
     * @notice Return the total no. of tokens sold
     */
    function getTokensSold() external view returns (uint256) {
        return totalTokensSold;
    }

    /**
     * @notice Return the permissions flag that are associated with STO
     */
    function getPermissions() public view returns(bytes32[] memory) {
        bytes32[] memory allPermissions = new bytes32[](1);
        allPermissions[0] = OPERATOR;
        return allPermissions;
    }

    /**
     * @notice Return the STO details
     * @return Unixtimestamp at which offering gets start.
     * @return Unixtimestamp at which offering ends.
     * @return Number of token base units this STO will be allowed to sell to investors.
     * @return Token units a buyer gets(multiplied by 10^18) per wei / base unit of POLY
     * @return Amount of funds raised
     * @return Number of individual investors this STO have.
     * @return Amount of tokens get sold.
     * @return Boolean value to justify whether the fund raise type is POLY or not, i.e true for POLY.
     * @return Boolean value to know the nature of the STO Whether it is pre-mint or mint on buying type sto.
     */
    function getSTODetails() public view returns(uint256, uint256, uint256, uint256, uint256, uint256, uint256, bool, bool) {
        return (startTime, endTime, cap, rate, (fundRaiseTypes[uint8(FundRaiseType.POLY)]) ? fundsRaised[uint8(
            FundRaiseType.POLY
        )] : fundsRaised[uint8(FundRaiseType.ETH)], investorCount, totalTokensSold, (fundRaiseTypes[uint8(FundRaiseType.POLY)]), preMintAllowed);
    }

    // -----------------------------------------
    // Internal interface (extensible)
    // -----------------------------------------
    /**
      * Processing the purchase as well as verify the required validations
      * @param _beneficiary Address performing the token purchase
      * @param _investedAmount Value in wei involved in the purchase
    */
    function _processTx(address _beneficiary, uint256 _investedAmount) internal returns(uint256 refund) {
        _preValidatePurchase(_beneficiary, _investedAmount);
        // calculate token amount to be created
        uint256 tokens;
        (tokens, refund) = _getTokenAmount(_investedAmount);
        _investedAmount = _investedAmount.sub(refund);

        // update state
        if (fundRaiseTypes[uint8(FundRaiseType.POLY)]) {
            fundsRaised[uint8(FundRaiseType.POLY)] = fundsRaised[uint8(FundRaiseType.POLY)].add(_investedAmount);
        } else {
            fundsRaised[uint8(FundRaiseType.ETH)] = fundsRaised[uint8(FundRaiseType.ETH)].add(_investedAmount);
        }
        totalTokensSold = totalTokensSold.add(tokens);

        _processPurchase(_beneficiary, tokens);
        emit TokenPurchase(msg.sender, _beneficiary, _investedAmount, tokens);

    }

    /**
    * @notice Validation of an incoming purchase.
    * Use require statements to revert state when conditions are not met. Use super to concatenate validations.
    * @param _beneficiary Address performing the token purchase
    * @param _investedAmount Value in wei involved in the purchase
    */
    function _preValidatePurchase(address _beneficiary, uint256 _investedAmount) internal view {
        require(!isFinalized, "STO is finalized");
        require(_beneficiary != address(0), "Beneficiary address should not be 0x");
        require(_investedAmount != 0, "Amount invested should not be equal to 0");
        require(_canBuy(_beneficiary), "Unauthorized");
        /*solium-disable-next-line security/no-block-members*/
        require(now >= startTime && now <= endTime, "Offering is closed/Not yet started");
    }

    /**
    * @notice Source of tokens.
    * Override this method to modify the way in which the crowdsale ultimately gets and sends its tokens.
    * @param _beneficiary Address performing the token purchase
    * @param _tokenAmount Number of tokens to be emitted
    */
    function _deliverTokens(address _beneficiary, uint256 _tokenAmount) internal {
        if (preMintAllowed) 
            securityToken.transfer(_beneficiary, _tokenAmount);
        else
            securityToken.issue(_beneficiary, _tokenAmount, "");
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
    * @notice Overrides to extend the way in which ether is converted to tokens.
    * @param _investedAmount Value in wei to be converted into tokens
    * @return Number of tokens that can be purchased with the specified _investedAmount
    * @return Remaining amount that should be refunded to the investor
    */
    function _getTokenAmount(uint256 _investedAmount) internal view returns(uint256 tokens, uint256 refund) {
        tokens = _investedAmount.mul(rate);
        tokens = tokens.div(uint256(10) ** 18);
        if (totalTokensSold.add(tokens) > cap) {
            tokens = cap.sub(totalTokensSold);
        }
        uint256 granularity = securityToken.granularity();
        tokens = tokens.div(granularity);
        tokens = tokens.mul(granularity);
        require(tokens > 0, "Cap reached");
        refund = _investedAmount.sub((tokens.mul(uint256(10) ** 18)).div(rate));
    }

    /**
    * @notice Determines how ETH is stored/forwarded on purchases.
    */
    function _forwardFunds(uint256 _refund) internal {
        wallet.transfer(msg.value.sub(_refund));
        msg.sender.transfer(_refund);
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

    /**
     * @notice Finalizes the STO and mint remaining tokens to treasury address
     * @notice Treasury wallet address must be whitelisted to successfully finalize
     */
    function finalize() external withPerm(ADMIN){
        require(!isFinalized, "STO is finalized");
        isFinalized = true;
        uint256 tempTokens;
        address walletAddress;
        if (cap > totalTokensSold) {
            tempTokens = cap - totalTokensSold;
            walletAddress = getTreasuryWallet();
            require(walletAddress != address(0), "Invalid address");
            address[] memory gtmAddress = securityToken.getModulesByName("GeneralTransferManager");
            for (uint256 i = 0; i < gtmAddress.length; i++) {
                (,,,bool isArchived,,) = securityToken.getModule(gtmAddress[i]);
                if (!isArchived) {
                    if (!IGTM(gtmAddress[i]).isAddressWhitelisted(walletAddress)) {
                        IGTM(gtmAddress[i]).modifyKYCDataByModules(walletAddress, uint64(now - 1), uint64(now - 1), uint64(now.add(EXPIRYTIME)));
                        break;
                    } else {
                        break;
                    }
                }
            }
            if (preMintAllowed) {
                securityToken.transfer(walletAddress, tempTokens);
                emit ReserveTokenTransfer(address(this), walletAddress, tempTokens);
            } else {
                securityToken.issue(walletAddress, tempTokens, "");
                emit ReserveTokenMint(msg.sender, walletAddress, tempTokens);
            }
        }
    }

}
