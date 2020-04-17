pragma solidity ^0.5.0;

import "../../STO/STO.sol";
import "../../../interfaces/IPolymathRegistry.sol";
import "../../../interfaces/IOracle.sol";
import "../../../libraries/DecimalMath.sol";
import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./POLYCappedSTOStorage.sol";

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
    event ReserveTokenMint(address indexed _owner, address indexed _treasuryWallet, uint256 _tokens);
    event SetWallet(address _oldWallet, address _newWallet);
    event SetTreasuryWallet(address _oldWallet, address _newWallet);
    event SetLimits(uint256 _minimumInvestment, uint256 _nonAccreditedLimit, uint256 _maxNonAccreditedInvestors);
    event SetTimes(uint256 _startTime, uint256 _endTime);
    event SetRate(uint256 _rate);
    event SetCap(uint256 _cap);

    ///////////////
    // Modifiers //
    ///////////////

    modifier notStarted() {
        /*solium-disable-next-line security/no-block-members*/
        require(now < startTime, "STO already started");
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
     * @param _rate How many token units a buyer gets multiplied by 10^18 per POLY
     * @param _minimumInvestment Minimun investment in POLY (* 10**18)
     * @param _nonAccreditedLimit Default limit in POLY (* 10**18) for non-accredited investors
     * @param _maxNonAccreditedInvestors Maximum number of non-accredited investors allowed (0 = unlimited)
     * @param _wallet Ethereum account address to hold the funds
     * @param _treasuryWallet Ethereum account where unsold Tokens will be sent
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
        address _treasuryWallet
    )
        external
        onlyFactory
    {
        require(endTime == 0, "Already configured");
        _modifyTimes(_startTime, _endTime);
        _modifyCap (_cap);
        _modifyRate (_rate);
        _modifyWalletAddress(_wallet);
        _modifyTreasuryWallet(_treasuryWallet);
        _modifyLimits(_minimumInvestment, _nonAccreditedLimit, _maxNonAccreditedInvestors);
    }

    /**
     * @dev modifies max non accredited investment limit and overall minimum investment limit
     * @param _minimumInvestment overall minimum investment limit in POLY
     * @param _nonAccreditedLimit max non accredited investment limit in POLY
     * @param _maxNonAccreditedInvestors Maximum number of non-accredited investors allowed (0 = unlimited)
     */
    function modifyLimits(
        uint256 _minimumInvestment,
        uint256 _nonAccreditedLimit,
        uint256 _maxNonAccreditedInvestors
    ) external notStarted {
        _onlySecurityTokenOwner();
        _modifyLimits(_minimumInvestment, _nonAccreditedLimit, _maxNonAccreditedInvestors);
    }

    /**
     * @dev Modifies POLY rate per token
     * @param _rate How many tokens received per POLY invested by 10^18 per base unit
     */
    function modifyRate(uint256 _rate) external notStarted {
        _onlySecurityTokenOwner();
        _modifyRate(_rate);
    }

    /**
     * @dev Modifies how many token base units this STO will be allowed to sell to investors
     * @param _cap Max number of token that can be sold by 10^18 per base unit
     */
    function modifyCap(uint256 _cap) external notStarted {
        _onlySecurityTokenOwner();
        _modifyCap(_cap);
    }

    /**
     * @dev Modifies STO start and end times
     * @param _startTime start time of sto
     * @param _endTime end time of sto
     */
    function modifyTimes(uint256 _startTime, uint256 _endTime) external notStarted {
        _onlySecurityTokenOwner();
        _modifyTimes(_startTime, _endTime);
    }

    /**
     * @dev Modifies addresses used as wallet and treasury wallet
     * @param _wallet Address of wallet where funds are sent
     */
    function modifyWalletAddress(address payable _wallet) external {
        //can be modified even when STO started
        _onlySecurityTokenOwner();
        _modifyWalletAddress(_wallet);
    }

    /**
     * @notice Use to change the treasury wallet
     * @param _treasuryWallet Ethereum account address to receive unsold tokens
     * @notice Set to address zero to use dataStore treasuryWallet
     */
    function modifyTreasuryWallet(address _treasuryWallet) external {
        //can be modified even when STO started
        _onlySecurityTokenOwner();
        _modifyTreasuryWallet(_treasuryWallet);
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
        require(_rate > 0, "Invalid rate");
        rate = _rate;
        emit SetRate (rate);
    }

    function _modifyCap(uint256 _cap) internal {
        require(_cap > 0, "Invalid cap");
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

    function _modifyWalletAddress(address payable _wallet) internal {
        require(_wallet != address(0), "Invalid wallet");
        emit SetWallet(wallet, _wallet);
        wallet = _wallet;
    }

    function _modifyTreasuryWallet(address _treasuryWallet) internal {
        emit SetTreasuryWallet(treasuryWallet, _treasuryWallet);
        treasuryWallet = _treasuryWallet;
    }

    ////////////////////
    // STO Management //
    ////////////////////

    /**
     * @notice Finalizes the STO and mints remaining tokens to treasury address
     * @notice Treasury address must be whitelisted to successfully finalize
     * @param _mintUnsoldTokens unsold tokens will be minted to the Treasury wallet if ture
     */
    function finalize(bool _mintUnsoldTokens) external {
        _onlySecurityTokenOwner();
        require(!isFinalized, "Already finalized");
        isFinalized = true;
        if ((_mintUnsoldTokens) && (totalTokensSold < cap)) {
            address treasury = (treasuryWallet == address(0) ? IDataStore(getDataStore()).getAddress(TREASURY) : treasuryWallet);
            require(treasury != address(0), "Invalid treasury address");
            uint256 granularity = ISecurityToken(securityToken).granularity();
            finalAmountReturned = cap.sub(totalTokensSold);
            finalAmountReturned = finalAmountReturned.div(granularity);
            finalAmountReturned = finalAmountReturned.mul(granularity);
            ISecurityToken(securityToken).issue(treasury, finalAmountReturned, "");
            emit ReserveTokenMint(msg.sender, treasury, finalAmountReturned);
        }
     }

    /**
     * @notice Modifies the list of overrides for non-accredited limits in POLY
     * @param _investors Array of investor addresses to modify
     * @param _nonAccreditedLimit Array of uints specifying non-accredited limits
     */
    function changeNonAccreditedLimit(address[] calldata _investors, uint256[] calldata _nonAccreditedLimit) external {
        _onlySecurityTokenOwner();
        require(_investors.length == _nonAccreditedLimit.length, "Length mismatch");
        for (uint256 i = 0; i < _investors.length; i++) {
            nonAccreditedLimitOverride[_investors[i]] = _nonAccreditedLimit[i];
            emit SetNonAccreditedLimit(_investors[i], _nonAccreditedLimit[i]);
        }
    }

    /**
     * @notice Function to set allowBeneficialInvestments (allow beneficiary to be different to funder)
     * @param _allowBeneficialInvestments Boolean to allow or disallow beneficial investments
     */
    function changeAllowBeneficialInvestments(bool _allowBeneficialInvestments) external {
        _onlySecurityTokenOwner();
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

    /**
      * @notice Function to buy using an ERC20 token (POLY)
      * @param _beneficiary Address where security tokens will be sent
      * @param _investedTokens Amount of token invested
      * @param _fundRaiseType Fund raise type (POLY)
      * @param _token Token used for investment i.e. POLY
      */
    function _buyWithTokens(
        address _beneficiary,
        uint256 _investedTokens,
        FundRaiseType _fundRaiseType,
        IERC20 _token
    ) internal {
        if (!allowBeneficialInvestments) {
            require(_beneficiary == msg.sender, "Beneficiary is not funder");
        }
        require(_canBuy(_beneficiary), "Unauthorized beneficiary");
        uint256 spentValue = _buyTokens(_beneficiary, _investedTokens, _fundRaiseType);
        // Forward coins to issuer wallet
        require(_token.transferFrom(msg.sender, wallet, spentValue), "Transfer failed");
        emit FundsReceived(msg.sender, _beneficiary, _fundRaiseType, _investedTokens, spentValue);
    }

    /**
      * @notice Low level token purchase
      * @param _beneficiary Address where security tokens will be sent
      * @param _investedTokens Amount of POLY invested
      * @param _fundRaiseType Fund raise type (POLY)
      */
    function _buyTokens(
        address _beneficiary,
        uint256 _investedTokens,
        FundRaiseType _fundRaiseType
    )
        internal
        nonReentrant
        whenNotPaused
        returns(uint256 spentValue)
    {
        uint256 tokens;
        bool accredited;
        (tokens, spentValue, accredited) = prePurchaseChecks (_beneficiary, _investedTokens);
        _processPurchase(_beneficiary, tokens, accredited);
        uint256 polyUsdRate = IOracle(IPolymathRegistry(ISecurityToken(securityToken).polymathRegistry()).getAddress(POLY_ORACLE)).getPrice();
        uint256 spentUSD = DecimalMath.mul(spentValue, polyUsdRate);
        emit TokenPurchase(msg.sender, _beneficiary, spentValue, spentUSD, tokens);
        // Modify storage
        investorInvestedPOLY[_beneficiary] = investorInvestedPOLY[_beneficiary].add(spentValue);
        fundsRaised[uint8(_fundRaiseType)] = fundsRaised[uint8(_fundRaiseType)].add(spentValue);
        investorInvestedUSD[_beneficiary] = investorInvestedUSD[_beneficiary].add(spentUSD);
        fundsRaisedUSD = fundsRaisedUSD.add(spentUSD);
        totalTokensSold = totalTokensSold.add(tokens);
    }

    /**
      * @notice Checks restrictions related to the token purchase and calculates number of tokens
      * @notice and calculates the number of tokens and spent value based on those restrictions
      * @param _beneficiary Address where security tokens will be sent
      * @param _investedTokens Amount of POLY invested
      * @return tokens Number of tokens the _beneficiary will recieve
      * @return spentValue Number of POLY that will be spent to buy the number of tokens
      */
    function prePurchaseChecks(address _beneficiary, uint256 _investedTokens) public view returns(
        uint256 tokens,
        uint256 spentValue,
        bool accredited
    ) {
        //Pre-Purchase checks
        require(isOpen(), "STO not open");
        require(_investedTokens > 0, "No funds sent");
        require(_beneficiary != address(0), "Invalid beneficiary");
        require(_investedTokens.add(investorInvestedPOLY[_beneficiary]) >= minimumInvestment, "Less than minimum investment");
        accredited = _isAccredited(_beneficiary);
        // Accredited investors are not limited
        uint256 allowedInvestment = _investedTokens;
        // Check for non-accredited investor limits
        if (!accredited) {
            uint256 investorLimit = (nonAccreditedLimitOverride[_beneficiary] == 0) ? nonAccreditedLimit : nonAccreditedLimitOverride[_beneficiary];
            require(investorInvestedPOLY[_beneficiary] < investorLimit, "Investment limit reached");
            if (_investedTokens.add(investorInvestedPOLY[_beneficiary]) > investorLimit) {
                allowedInvestment = investorLimit.sub(investorInvestedPOLY[_beneficiary]);
            }
            if (maxNonAccreditedInvestors != 0) {
                require(nonAccreditedCount < maxNonAccreditedInvestors, "Max non-accredited investors");
            }
        }
        // Get the number of tokens to be minted and value in POLY
        tokens = _getTokenAmount(allowedInvestment);
        spentValue = DecimalMath.div(tokens, rate);
        // In case of rounding issues, ensure that spentValue is never more than _investedTokens
        if (spentValue > _investedTokens) {
            spentValue = _investedTokens;
            }
    }

    /**
    * @notice Gets the number of tokens that will be issued based on rate and granularity
    * @param _investedAmount Value in POLY (by 10^18) to be converted into tokens
    * @return tokens Number of tokens that can be purchased with the specified _investedAmount
    */
    function _getTokenAmount(uint256 _investedAmount) internal view returns (uint256 tokens) {
        tokens = DecimalMath.mul(_investedAmount, rate);
        if (totalTokensSold.add(tokens) > cap) {
            tokens = cap.sub(totalTokensSold);
        }
        uint256 granularity = ISecurityToken(securityToken).granularity();
        tokens = tokens.div(granularity);
        tokens = tokens.mul(granularity);
        require(tokens > 0, "No tokens");
    }

    /**
    * @notice Executed when a purchase has been validated and is ready to be executed. Not necessarily emits/sends tokens.
    * @param _beneficiary Address receiving the tokens
    * @param _tokenAmount Number of tokens to be purchased
    */
    function _processPurchase(address _beneficiary, uint256 _tokenAmount, bool _accredited) internal {
        if (investorInvestedPOLY[_beneficiary] == 0) {
            investorCount = investorCount + 1;
            if (!_accredited) {
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
        ISecurityToken(securityToken).issue(_beneficiary, _tokenAmount, "");
    }

    function _isAccredited(address _investor) internal view returns(bool) {
        IDataStore dataStore = getDataStore();
        return _getIsAccredited(_investor, dataStore);
    }

    function _getIsAccredited(address _investor, IDataStore dataStore) internal view returns(bool) {
        uint256 flags = dataStore.getUint256(_getKey(INVESTORFLAGS, _investor));
        uint256 flag = flags & uint256(1); //isAccredited is flag 0 so we don't need to bit shift flags.
        return flag > 0 ? true : false;
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
    function getTokensSold() external view returns (uint256) {
        return totalTokensSold;
    }

    /**
     * @notice Return the permissions flag that are associated with STO
     */
    function getPermissions() external view returns(bytes32[] memory allPermissions) {
        return allPermissions;
    }

    /**
     * @notice Returns investor accredited & non-accredited override informatiomn
     * @return investors list of all configured investors
     * @return accredited whether investor is accredited
     * @return override any overrides for non-accredited limits for the investor
     */
    function getAccreditedData() external view returns (address[] memory investors, bool[] memory accredited, uint256[] memory overrides) {
        IDataStore dataStore = getDataStore();
        investors = dataStore.getAddressArray(INVESTORSKEY);
        accredited = new bool[](investors.length);
        overrides = new uint256[](investors.length);
        for (uint256 i = 0; i < investors.length; i++) {
            accredited[i] = _getIsAccredited(investors[i], dataStore);
            overrides[i] = nonAccreditedLimitOverride[investors[i]];
        }
    }

    /**
     * @notice Return the STO details
     * @return startTime - Unixtimestamp at which offering gets start.
     * @return endTime - Unixtimestamp at which offering ends.
     * @return cap - Number of token base units this STO will be allowed to sell to investors.
     * @return rate - Token units a buyer gets(multiplied by 10^18) base unit of POLY
     * @return minimumInvestment - minimum investment in POLY
     * @return nonAccreditedLimit - default non accredited investor limit in POLY
     * @return maxNonAccreditedInvestors - maximum number of non-accredited investors that can invest in the offering
     * @return totalTokensSold - Amount of tokens get sold.
     * @return fundsRaisedPOLY - Amount of funds raised in POLY
     * @return fundsRaisedUSD - Amount of funds raised converted to USD at time of investment
     * @return investorCount - Number of individual investors this STO have.
     * @return nonAccreditedCount - Number of non-accredited investor that have invested in the offering
     */
    function getSTODetails() external view returns(uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256) {
        uint256 fundsRaisedPOLY = fundsRaised[uint8(FundRaiseType.POLY)];
        return (
            startTime,
            endTime,
            cap,
            rate,
            minimumInvestment,
            nonAccreditedLimit,
            maxNonAccreditedInvestors,
            totalTokensSold,
            fundsRaisedPOLY,
            fundsRaisedUSD,
            investorCount,
            nonAccreditedCount
        );
    }

    /**
     * @notice This function returns the signature of configure function
     */
    function getInitFunction() external pure returns (bytes4) {
        return this.configure.selector;
    }
}
