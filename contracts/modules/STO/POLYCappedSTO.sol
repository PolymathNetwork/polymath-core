pragma solidity ^0.5.0;

import "./STO.sol";
import "../../interfaces/IOracle.sol";
import "../../RegistryUpdater.sol";
import "../../libraries/DecimalMath.sol";
import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../../storage/POLYCappedSTOStorage.sol";

/**
 * @title STO module for capped crowdsale that accepts POLY
 */
contract POLYCappedSTO is POLYCappedSTOStorage, STO, ReentrancyGuard {
    using SafeMath for uint256;

    string internal constant POLY_ORACLE = "PolyUsdOracle";

    ////////////
    // Events //
    ////////////

    event SetAllowBeneficialInvestments(bool _allowed);
    event SetNonAccreditedLimit(address _investor, uint256 _limit);
    event SetAccredited(address _investor, bool _accredited);
   /**
    * Event for token purchase logging
    * @param _purchaser who paid for the tokens
    * @param _beneficiary who got the tokens
    * @param _value amount paid for purchase in Fund Raise Type
    * @param _valueUSD value of POLY invested in USD at the time of purchase
    * @param _amount amount of tokens purchased
    */
    event TokenPurchase(
        address indexed _purchaser,
        address indexed _beneficiary,
        uint256 _value,
        uint256 _valueUSD,
        uint256 _amount
    );
    event FundsReceived(
        address indexed _purchaser,
        address indexed _beneficiary,
        FundRaiseType _fundRaiseType,
        uint256 _receivedValue,
        uint256 _spentValue
    );
    event ReserveTokenMint(address indexed _owner, address indexed _reserveWallet, uint256 _tokens);
    event SetAddresses(address indexed _wallet, address indexed _reserveWallet);
    event SetLimits(uint256 _minimumInvestment, uint256 _nonAccreditedLimit, uint256 _maxNonAccreditedInvestors);
    event SetTimes(uint256 _startTime, uint256 _endTime);
    event SetRate(uint256 _rate);
    event SetCap(uint256 _cap);

    ///////////////
    // Modifiers //
    ///////////////

    modifier notStarted() {
        /*solium-disable-next-line security/no-block-members*/
        require(now < startTime, "STO has started");
        _;
    }

    ///////////////////////
    // STO Configuration //
    ///////////////////////

    constructor (address _securityToken, address _polyAddress) public
    Module(_securityToken, _polyAddress)
    {
    }

    /*
     * @notice Function used to intialize the contract variables
     * @param _startTime Unix timestamp at which offering get started
     * @param _endTime Unix timestamp at which offering get ended
     * @param _cap Maximum No. of token base units for sale
     * @param _rate Token units a buyer gets multiplied by 10^18 per wei / base unit of POLY
     * @param _minimumInvestment Minimun investment in fund raise type (* 10**18)
     * @param _nonAccreditedLimit Limit in fund raise type (* 10**18) for non-accredited investors
     * @param _maxNonAccreditedInvestors Maximum number of non-accredited investors allowed (0 = unlimited)
     * @param _wallet Ethereum account address to hold the funds
     * @param _reserveWallet Ethereum account where unsold Tokens will be sent (address 0x = do not mint unsold)
     */
    function configure(
        uint256 _startTime,
        uint256 _endTime,
        uint256 _cap,
        uint256 _rate,
        uint256 _minimumInvestment,
        uint256 _nonAccreditedLimit,
        uint256 _maxNonAccreditedInvestors,
        address payable _wallet,
        address _reserveWallet
    )
        public
        onlyFactory
    {
        require(endTime == 0, "Already configured");
        FundRaiseType[] memory _fundRaiseTypes = new FundRaiseType[](1);
        _fundRaiseTypes[0] = FundRaiseType.POLY;
        _setFundRaiseType(_fundRaiseTypes);
        _modifyTimes(_startTime, _endTime);
        _modifyCap (_cap);
        _modifyRate (_rate);
        _modifyAddresses(_wallet, _reserveWallet);
        _modifyLimits(_minimumInvestment, _nonAccreditedLimit, _maxNonAccreditedInvestors);
    }

    /**
     * @dev modifies max non accredited investment limit and overall minimum investment limit
     * @param _minimumInvestment overall minimum investment limit in selected fund raise type
     * @param _nonAccreditedLimit max non accredited investment limit in selected fund raise type
     * @param _maxNonAccreditedInvestors Maximum number of non-accredited investors allowed (0 = unlimited)
     */
    function modifyLimits(
        uint256 _minimumInvestment,
        uint256 _nonAccreditedLimit,
        uint256 _maxNonAccreditedInvestors
    ) external onlyOwner notStarted {
        _modifyLimits(_minimumInvestment, _nonAccreditedLimit, _maxNonAccreditedInvestors);
    }

    /**
     * @dev Modifies fund raise rate per token
     * @param _rate rate per token invested by 10^18 per base unit
     */
    function modifyRate(uint256 _rate) external onlyOwner notStarted {
        _modifyRate(_rate);
    }

    /**
     * @dev Modifies how many token base units this STO will be allowed to sell to investors
     * @param _cap Max number of token that can be sold by 10^18 per base unit
     */
    function modifyCap(uint256 _cap) external onlyOwner notStarted {
        _modifyCap(_cap);
    }

    /**
     * @dev Modifies STO start and end times
     * @param _startTime start time of sto
     * @param _endTime end time of sto
     */
    function modifyTimes(uint256 _startTime, uint256 _endTime) external onlyOwner notStarted {
        _modifyTimes(_startTime, _endTime);
    }

    /**
     * @dev Modifies addresses used as wallet and reserve wallet
     * @param _wallet Address of wallet where funds are sent
     * @param _reserveWallet Ethereum address where unsold Tokens will be sent (address 0x = do not mint unsold)
     */
    function modifyAddresses(address payable _wallet, address _reserveWallet) external onlyOwner {
        //can be modified even when STO started
        _modifyAddresses(_wallet, _reserveWallet);
    }

    function _modifyLimits(
        uint256 _minimumInvestment,
        uint256 _nonAccreditedLimit,
        uint256 _maxNonAccreditedInvestors
    ) internal {
        minimumInvestment = _minimumInvestment;
        nonAccreditedLimit = _nonAccreditedLimit;
        maxNonAccreditedInvestors = _maxNonAccreditedInvestors;
        emit SetLimits(minimumInvestment, nonAccreditedLimit, maxNonAccreditedInvestors);
    }

    function _modifyRate(uint256 _rate) internal {
        require(_rate > 0, "Rate not > 0");
        rate = _rate;
        emit SetRate (rate);
    }

    function _modifyCap(uint256 _cap) internal {
        require(_cap > 0, "Cap not > 0");
        cap = _cap;
        emit SetCap (cap);
    }

    function _modifyTimes(uint256 _startTime, uint256 _endTime) internal {
        /*solium-disable-next-line security/no-block-members*/
        require(_startTime >= now && _endTime > _startTime, "Invalid times");
        startTime = _startTime;
        endTime = _endTime;
        emit SetTimes(_startTime, _endTime);
    }

    function _modifyAddresses(address payable _wallet, address _reserveWallet) internal {
        require(_wallet != address(0), "Invalid wallet");
        wallet = _wallet;
        reserveWallet = _reserveWallet;
        emit SetAddresses(wallet, reserveWallet);
    }

    ////////////////////
    // STO Management //
    ////////////////////

    /**
     * @notice Finalizes the STO and mints remaining tokens to reserve address
     * @notice If the reserve wallet address is address 0x0 reserve tokens will not be minted
     * @notice Reserve address must be whitelisted to successfully finalize
     */
    function finalize() public onlyOwner {
        require(!isFinalized, "STO already finalized");
        isFinalized = true;
        if ((reserveWallet != address(0) ) && (totalTokensSold < cap)) {
            finalAmountReturned = cap.sub(totalTokensSold);
            require(ISecurityToken(securityToken).mint(reserveWallet, finalAmountReturned), "Error minting");
            emit ReserveTokenMint(msg.sender, reserveWallet, finalAmountReturned);
        }
     }

    /**
     * @notice Modifies the list of accredited addresses
     * @param _investors Array of investor addresses to modify
     * @param _accredited Array of bools specifying accreditation status
     */
    function changeAccredited(address[] memory _investors, bool[] memory _accredited) public onlyOwner {
        require(_investors.length == _accredited.length, "Array length mismatch");
        for (uint256 i = 0; i < _investors.length; i++) {
            if (_accredited[i]) {
                investors[_investors[i]].accredited = uint8(1);
            } else {
                investors[_investors[i]].accredited = uint8(0);
            }
            _addToInvestorsList(_investors[i]);
            emit SetAccredited(_investors[i], _accredited[i]);
        }
    }

    /**
     * @notice Modifies the list of overrides for non-accredited limits in fund raise type
     * @param _investors Array of investor addresses to modify
     * @param _nonAccreditedLimit Array of uints specifying non-accredited limits
     */
    function changeNonAccreditedLimit(address[] memory _investors, uint256[] memory _nonAccreditedLimit) public onlyOwner {
        require(_investors.length == _nonAccreditedLimit.length, "Array length mismatch");
        for (uint256 i = 0; i < _investors.length; i++) {
            investors[_investors[i]].nonAccreditedLimitOverride = _nonAccreditedLimit[i];
            _addToInvestorsList(_investors[i]);
            emit SetNonAccreditedLimit(_investors[i], _nonAccreditedLimit[i]);
        }
    }

    function _addToInvestorsList(address _investor) internal {
        if (investors[_investor].seen == uint8(0)) {
            investors[_investor].seen = uint8(1);
            investorsList.push(_investor);
        }
    }

    /**
     * @notice Function to set allowBeneficialInvestments (allow beneficiary to be different to funder)
     * @param _allowBeneficialInvestments Boolean to allow or disallow beneficial investments
     */
    function changeAllowBeneficialInvestments(bool _allowBeneficialInvestments) public onlyOwner {
        require(_allowBeneficialInvestments != allowBeneficialInvestments, "Does not change value");
        allowBeneficialInvestments = _allowBeneficialInvestments;
        emit SetAllowBeneficialInvestments(allowBeneficialInvestments);
    }

    //////////////////////////
    // Investment Functions //
    //////////////////////////

    /**
    * @notice no fallback function - non-payable
    function() external {}
    */

    /**
      * @notice Purchase tokens using POLY
      * @param _beneficiary Address where security tokens will be sent
      * @param _investedPOLY Amount of POLY invested
      */
    function buyWithPOLY(address _beneficiary, uint256 _investedPOLY) external {
        _buyWithTokens(_beneficiary, _investedPOLY, FundRaiseType.POLY, polyToken);
    }

    function _buyWithTokens(
        address _beneficiary,
        uint256 _tokenAmount,
        FundRaiseType _fundRaiseType,
        IERC20 _token
    ) internal {
        if (!allowBeneficialInvestments) {
            require(_beneficiary == msg.sender, "Beneficiary != msg.sender");
        }
        uint256 _spentValue = _buyTokens(_beneficiary, _tokenAmount, _fundRaiseType);
        // Forward coins to issuer wallet
        require(_token.transferFrom(msg.sender, wallet, _spentValue), "Transfer failed");
        emit FundsReceived(msg.sender, _beneficiary, _fundRaiseType, _tokenAmount, _spentValue);
        _postValidatePurchase(_beneficiary, _spentValue);
    }

    /**
      * @notice Low level token purchase
      * @param _beneficiary Address where security tokens will be sent
      * @param _investmentValue Amount of POLY invested
      * @param _fundRaiseType Fund raise type (POLY)
      */
    function _buyTokens(
        address _beneficiary,
        uint256 _investmentValue,
        FundRaiseType _fundRaiseType
    )
        internal
        nonReentrant
        whenNotPaused
        returns(uint256 _spentValue)
    {
        uint256 _tokens;
        (_tokens, _spentValue) = prePurchaseChecks (_beneficiary, _investmentValue);
        _processPurchase(_beneficiary, _tokens);
        uint256 polyUsdRate = IOracle(PolymathRegistry(RegistryUpdater(securityToken).polymathRegistry()).getAddress(POLY_ORACLE)).getPrice();
        uint256 _spentUSD = DecimalMath.mul(_spentValue, polyUsdRate);
        emit TokenPurchase(msg.sender, _beneficiary, _spentValue, _spentUSD, _tokens);
        _updatePurchasingState(_beneficiary, _investmentValue);
        // Modify storage
        investorInvested[_beneficiary] = investorInvested[_beneficiary].add(_spentValue);
        fundsRaised[uint8(_fundRaiseType)] = fundsRaised[uint8(_fundRaiseType)].add(_spentValue);
        investorInvestedUSD[_beneficiary] = investorInvestedUSD[_beneficiary].add(_spentUSD);
        fundsRaisedUSD = fundsRaisedUSD.add(_spentUSD);
        totalTokensSold = totalTokensSold.add(_tokens);
    }

    /**
      * @notice Checks restrictions related to the token purchase and calculates number of tokens
      * @notice and calculates the number of tokens and spent value based on those restrictions
      * @param _beneficiary Address where security tokens will be sent
      * @param _investmentValue Amount of POLY invested
      * @return _tokens Number of tokens the _beneficiary will recieve
      * @return _spentValue Number of POLY that will be spent
      */
    function prePurchaseChecks(address _beneficiary, uint256 _investmentValue) public view returns(
        uint256 _tokens,
        uint256 _spentValue
    ) {
        //Pre-Purchase checks
        require(isOpen(), "STO not open");
        require(_investmentValue > 0, "No funds were sent");
        require(_beneficiary != address(0), "Beneficiary address should not be 0x");
        if (investors[_beneficiary].accredited == uint8(0) && maxNonAccreditedInvestors != 0) {
            require(nonAccreditedCount < maxNonAccreditedInvestors, "Limit for number of non-accredited investor reached");
        }
        require(_investmentValue.add(investorInvested[_beneficiary]) >= minimumInvestment, "Total investment less than minimum investment");
        // Get the maximum allowed investment value
        uint256 allowedInvestment = _getAllowedInvestment (_beneficiary, _investmentValue);
        // Get the number of tokens to be minted and value in fund raise type
        (_tokens, _spentValue) = _getTokenAmount(allowedInvestment);
    }

    /**
      * @notice Gets the amount of the investment value the investor can invest based on accredited status and limits
      * @param _beneficiary Address where security tokens will be sent
      * @param _investmentValue Amount of POLY invested
      * @return _allowedInvestment Amount of the invested value the the beneficiary is allowed to invest
      */
    function _getAllowedInvestment (address _beneficiary, uint256 _investmentValue) internal view returns(
        uint256 _allowedInvestment
    ) {
        // Accredited investors are not limited
        _allowedInvestment = _investmentValue;
        // Check for non-accredited investment limits
        if (investors[_beneficiary].accredited == uint8(0)) {
            uint256 investorLimit = (investors[_beneficiary].nonAccreditedLimitOverride == 0) ? nonAccreditedLimit : investors[_beneficiary].nonAccreditedLimitOverride;
            require(investorInvested[_beneficiary] < investorLimit, "Over Non-accredited investor limit");
            if (_investmentValue.add(investorInvested[_beneficiary]) > investorLimit)
                _allowedInvestment = investorLimit.sub(investorInvested[_beneficiary]);
        }
    }

    /**
    * @notice Gets the number of tokens and cost that will be issued based on rate and granularity
    * @param _investedAmount Value in wei to be converted into tokens
    * @return _tokens Number of tokens that can be purchased with the specified _investedAmount
    * @return _spentValue Cost in POLY to buy the number of tokens
    */
    function _getTokenAmount(uint256 _investedAmount) internal view returns (uint256 _tokens, uint256 _spentValue) {
        _tokens = _investedAmount.mul(rate);
        _tokens = _tokens.div(uint256(10) ** 18);
        uint256 granularity = ISecurityToken(securityToken).granularity();
        _tokens = _tokens.div(granularity);
        _tokens = _tokens.mul(granularity);
        uint256 _remainingTokens = cap.sub(totalTokensSold);
        if (totalTokensSold.add(_tokens) > cap) {
            _tokens = _remainingTokens;
        }
        _spentValue = (_tokens.mul(uint256(10) ** 18)).div(rate);
    }

    /**
    * @notice Executed when a purchase has been validated and is ready to be executed. Not necessarily emits/sends tokens.
    * @param _beneficiary Address receiving the tokens
    * @param _tokenAmount Number of tokens to be purchased
    */
    function _processPurchase(address _beneficiary, uint256 _tokenAmount) internal {
        if (investorInvested[_beneficiary] == 0) {
            investorCount = investorCount + 1;
            if (investors[_beneficiary].accredited == uint8(0)) {
                nonAccreditedCount = nonAccreditedCount + 1;
            }
        }
        _deliverTokens(_beneficiary, _tokenAmount);
    }

    /**
    * @notice Source of tokens.
      Override this method to modify the way in which the crowdsale ultimately gets and sends its tokens.
    * @param _beneficiary Address performing the token purchase
    * @param _tokenAmount Number of tokens to be emitted
    */
    function _deliverTokens(address _beneficiary, uint256 _tokenAmount) internal {
        require(ISecurityToken(securityToken).mint(_beneficiary, _tokenAmount), "Error in minting the tokens");
    }

    /**
    * @notice Overrides for extensions that require an internal state to check for validity
      (current user contributions, etc.)
    */
    function _updatePurchasingState(address /*_beneficiary*/, uint256 _investedAmount) internal pure {
        _investedAmount = 0; //yolo
    }

    /**
    * @notice Validation of an executed purchase.
      Observe state and use revert statements to undo rollback when valid conditions are not met.
    */
    function _postValidatePurchase(address /*_beneficiary*/, uint256 /*_investedAmount*/) internal pure {
      // optional override
    }

    /////////////
    // Getters //
    /////////////

    /**
     * @notice This function returns whether or not the STO is in fundraising mode (open)
     * @return bool Whether the STO is accepting investments
     */
    function isOpen() public view returns(bool) {
        /*solium-disable-next-line security/no-block-members*/
        if (isFinalized || now < startTime || now >= endTime || capReached()) return false;
        return true;
    }

    /**
    * @notice Checks whether the cap has been reached.
    * @return bool Whether the cap was reached
    */
    function capReached() public view returns (bool) {
        return totalTokensSold >= cap;
    }

    /**
     * @notice Return the total no. of tokens sold
     * @return uint256 Total number of tokens sold
     */
    function getTokensSold() public view returns (uint256) {
        return totalTokensSold;
    }

    /**
     * @notice Return the permissions flag that are associated with STO
     */
    function getPermissions() public view returns(bytes32[] memory allPermissions) {
        return allPermissions;
    }
        /**
     * @notice Returns investor accredited & non-accredited override informatiomn
     * @return address[] list of all configured investors
     * @return bool[] whether investor is accredited
     * @return uint256[] any overrides for non-accredited limits for the investor
     */
    function getAccreditedData() external view returns (address[] memory, bool[] memory, uint256[] memory) {
        bool[] memory accrediteds = new bool[](investorsList.length);
        uint256[] memory nonAccreditedLimitOverrides = new uint256[](investorsList.length);
        uint256 i;
        for (i = 0; i < investorsList.length; i++) {
            accrediteds[i] = (investors[investorsList[i]].accredited == uint8(0)? false: true);
            nonAccreditedLimitOverrides[i] = investors[investorsList[i]].nonAccreditedLimitOverride;
        }
        return (investorsList, accrediteds, nonAccreditedLimitOverrides);
    }

    /**
     * @notice Return the STO details
     * @return Unixtimestamp at which offering gets start.
     * @return Unixtimestamp at which offering ends.
     * @return Number of token base units this STO will be allowed to sell to investors.
     * @return Token units a buyer gets(multiplied by 10^18) base unit of fund raise type
     * @return Amount of funds raised in Fund Raise Type
     * @return Number of individual investors this STO have.
     * @return Amount of tokens get sold.
     * @return Fund Raise type, 0 = ETH, 1 = POLY, 2 = Stable Coin respectively
     */
    function getSTODetails() public view returns(uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256) {
        uint256 _Raised = fundsRaised[uint8(FundRaiseType.POLY)];
        return (
            startTime,
            endTime,
            cap,
            rate,
            _Raised,
            investorCount,
            totalTokensSold,
            nonAccreditedCount
        );
    }

    /**
     * @notice This function returns the signature of configure function
     * @return bytes4 Configure function signature = bytes4(keccak256("configure(uint256,uint256,uint256,uint256,uint256,uint256,uint256,address,address)"))
     */
    function getInitFunction() public pure returns (bytes4) {
        return 0xe7830bae;
    }
}
