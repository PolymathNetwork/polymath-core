pragma solidity ^0.4.24;

import "./ISTO.sol";
import "../../interfaces/ISecurityToken.sol";
import "../../interfaces/IOracle.sol";
import "../../RegistryUpdater.sol";
import "../../libraries/DecimalMath.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ReentrancyGuard.sol";
import "../../storage/USDTieredSTOStorage.sol";

/**
 * @title STO module for standard capped crowdsale
 */
contract USDTieredSTO is USDTieredSTOStorage, ISTO, ReentrancyGuard {
    using SafeMath for uint256;

    string public constant POLY_ORACLE = "PolyUsdOracle";
    string public constant ETH_ORACLE = "EthUsdOracle";

    ////////////
    // Events //
    ////////////

    event SetAllowBeneficialInvestments(bool _allowed);
    event SetNonAccreditedLimit(address _investor, uint256 _limit);
    event SetAccredited(address _investor, bool _accredited);
    event TokenPurchase(
        address indexed _purchaser,
        address indexed _beneficiary,
        uint256 _tokens,
        uint256 _usdAmount,
        uint256 _tierPrice,
        uint256 _tier
    );
    event FundsReceived(
        address indexed _purchaser,
        address indexed _beneficiary,
        uint256 _usdAmount,
        FundRaiseType _fundRaiseType,
        uint256 _receivedValue,
        uint256 _spentValue,
        uint256 _rate
    );
    event ReserveTokenMint(address indexed _owner, address indexed _wallet, uint256 _tokens, uint256 _latestTier);
    event SetAddresses(
        address indexed _wallet,
        address indexed _reserveWallet,
        address[] _usdTokens
    );
    event SetLimits(
        uint256 _nonAccreditedLimitUSD,
        uint256 _minimumInvestmentUSD
    );
    event SetTimes(
        uint256 _startTime,
        uint256 _endTime
    );
    event SetTiers(
        uint256[] _ratePerTier,
        uint256[] _ratePerTierDiscountPoly,
        uint256[] _tokensPerTierTotal,
        uint256[] _tokensPerTierDiscountPoly
    );

    ///////////////
    // Modifiers //
    ///////////////

    modifier validETH {
        require(_getOracle(bytes32("ETH"), bytes32("USD")) != address(0), "Invalid Oracle");
        require(fundRaiseTypes[uint8(FundRaiseType.ETH)], "ETH not allowed");
        _;
    }

    modifier validPOLY {
        require(_getOracle(bytes32("POLY"), bytes32("USD")) != address(0), "Invalid Oracle");
        require(fundRaiseTypes[uint8(FundRaiseType.POLY)], "POLY not allowed");
        _;
    }

    modifier validSC(address _usdToken) {
        require(fundRaiseTypes[uint8(FundRaiseType.SC)] && usdTokenEnabled[_usdToken], "USD not allowed");
        _;
    }

    ///////////////////////
    // STO Configuration //
    ///////////////////////

    constructor (address _securityToken, address _polyAddress)
    public
    Module(_securityToken, _polyAddress)
    {
    }

    /**
     * @notice Function used to intialize the contract variables
     * @param _startTime Unix timestamp at which offering get started
     * @param _endTime Unix timestamp at which offering get ended
     * @param _ratePerTier Rate (in USD) per tier (* 10**18)
     * @param _tokensPerTierTotal Tokens available in each tier
     * @param _nonAccreditedLimitUSD Limit in USD (* 10**18) for non-accredited investors
     * @param _minimumInvestmentUSD Minimun investment in USD (* 10**18)
     * @param _fundRaiseTypes Types of currency used to collect the funds
     * @param _wallet Ethereum account address to hold the funds
     * @param _reserveWallet Ethereum account address to receive unsold tokens
     * @param _usdTokens Array of contract addressess of the stable coins
     */
    function configure(
        uint256 _startTime,
        uint256 _endTime,
        uint256[] _ratePerTier,
        uint256[] _ratePerTierDiscountPoly,
        uint256[] _tokensPerTierTotal,
        uint256[] _tokensPerTierDiscountPoly,
        uint256 _nonAccreditedLimitUSD,
        uint256 _minimumInvestmentUSD,
        FundRaiseType[] _fundRaiseTypes,
        address _wallet,
        address _reserveWallet,
        address[] _usdTokens
    ) public onlyFactory {
        oracleKeys[bytes32("ETH")][bytes32("USD")] = ETH_ORACLE;
        oracleKeys[bytes32("POLY")][bytes32("USD")] = POLY_ORACLE;
        require(endTime == 0, "Already configured");
        _modifyTimes(_startTime, _endTime);
        _modifyTiers(_ratePerTier, _ratePerTierDiscountPoly, _tokensPerTierTotal, _tokensPerTierDiscountPoly);
        // NB - _setFundRaiseType must come before modifyAddresses
        _setFundRaiseType(_fundRaiseTypes);
        _modifyAddresses(_wallet, _reserveWallet, _usdTokens);
        _modifyLimits(_nonAccreditedLimitUSD, _minimumInvestmentUSD);
    }

    /**
     * @dev Modifies fund raise types
     * @param _fundRaiseTypes Array of fund raise types to allow
     */
    function modifyFunding(FundRaiseType[] _fundRaiseTypes) external onlyOwner {
        /*solium-disable-next-line security/no-block-members*/
        require(now < startTime, "STO already started");
        _setFundRaiseType(_fundRaiseTypes);
    }

    /**
     * @dev modifies max non accredited invets limit and overall minimum investment limit
     * @param _nonAccreditedLimitUSD max non accredited invets limit
     * @param _minimumInvestmentUSD overall minimum investment limit
     */
    function modifyLimits(
        uint256 _nonAccreditedLimitUSD,
        uint256 _minimumInvestmentUSD
    ) external onlyOwner {
        /*solium-disable-next-line security/no-block-members*/
        require(now < startTime, "STO already started");
        _modifyLimits(_nonAccreditedLimitUSD, _minimumInvestmentUSD);
    }

    /**
     * @dev modifiers STO tiers. All tiers must be passed, can not edit specific tiers.
     * @param _ratePerTier Array of rates per tier
     * @param _ratePerTierDiscountPoly Array of discounted poly rates per tier
     * @param _tokensPerTierTotal Array of total tokens per tier
     * @param _tokensPerTierDiscountPoly Array of discounted tokens per tier
     */
    function modifyTiers(
        uint256[] _ratePerTier,
        uint256[] _ratePerTierDiscountPoly,
        uint256[] _tokensPerTierTotal,
        uint256[] _tokensPerTierDiscountPoly
    ) external onlyOwner {
        /*solium-disable-next-line security/no-block-members*/
        require(now < startTime, "STO already started");
        _modifyTiers(_ratePerTier, _ratePerTierDiscountPoly, _tokensPerTierTotal, _tokensPerTierDiscountPoly);
    }

    /**
     * @dev Modifies STO start and end times
     * @param _startTime start time of sto
     * @param _endTime end time of sto
     */
    function modifyTimes(
        uint256 _startTime,
        uint256 _endTime
    ) external onlyOwner {
        /*solium-disable-next-line security/no-block-members*/
        require(now < startTime, "STO already started");
        _modifyTimes(_startTime, _endTime);
    }

    /**
     * @dev Modifies addresses used as wallet, reserve wallet and usd token
     * @param _wallet Address of wallet where funds are sent
     * @param _reserveWallet Address of wallet where unsold tokens are sent
     * @param _usdTokens Address of usd tokens
     */
    function modifyAddresses(
        address _wallet,
        address _reserveWallet,
        address[] _usdTokens
    ) external onlyOwner {
        _modifyAddresses(_wallet, _reserveWallet, _usdTokens);
    }

    function _modifyLimits(
        uint256 _nonAccreditedLimitUSD,
        uint256 _minimumInvestmentUSD
    ) internal {
        minimumInvestmentUSD = _minimumInvestmentUSD;
        nonAccreditedLimitUSD = _nonAccreditedLimitUSD;
        emit SetLimits(minimumInvestmentUSD, nonAccreditedLimitUSD);
    }

    function _modifyTiers(
        uint256[] _ratePerTier,
        uint256[] _ratePerTierDiscountPoly,
        uint256[] _tokensPerTierTotal,
        uint256[] _tokensPerTierDiscountPoly
    ) internal {
        require(_tokensPerTierTotal.length > 0, "No tiers provided");
        require(_ratePerTier.length == _tokensPerTierTotal.length &&
            _ratePerTierDiscountPoly.length == _tokensPerTierTotal.length &&
            _tokensPerTierDiscountPoly.length == _tokensPerTierTotal.length,
            "Tier data length mismatch"
        );
        delete tiers;
        for (uint256 i = 0; i < _ratePerTier.length; i++) {
            require(_ratePerTier[i] > 0, "Invalid rate");
            require(_tokensPerTierTotal[i] > 0, "Invalid token amount");
            require(_tokensPerTierDiscountPoly[i] <= _tokensPerTierTotal[i], "Too many discounted tokens");
            require(_ratePerTierDiscountPoly[i] <= _ratePerTier[i], "Invalid discount");
            tiers.push(Tier(_ratePerTier[i], _ratePerTierDiscountPoly[i], _tokensPerTierTotal[i], _tokensPerTierDiscountPoly[i], 0, 0));
        }
        emit SetTiers(_ratePerTier, _ratePerTierDiscountPoly, _tokensPerTierTotal, _tokensPerTierDiscountPoly);
    }

    function _modifyTimes(
        uint256 _startTime,
        uint256 _endTime
    ) internal {
        /*solium-disable-next-line security/no-block-members*/
        require((_endTime > _startTime) && (_startTime > now), "Invalid times");
        startTime = _startTime;
        endTime = _endTime;
        emit SetTimes(_startTime, _endTime);
    }

    function _modifyAddresses(
        address _wallet,
        address _reserveWallet,
        address[] _usdTokens
    ) internal {
        require(_wallet != address(0) && _reserveWallet != address(0), "Invalid wallet");
        wallet = _wallet;
        reserveWallet = _reserveWallet;
        _modifyUSDTokens(_usdTokens);
    }

    function _modifyUSDTokens(address[] _usdTokens) internal {
        for(uint256 i = 0; i < usdTokens.length; i++) {
            usdTokenEnabled[usdTokens[i]] = false;
        }
        usdTokens = _usdTokens;
        for(i = 0; i < _usdTokens.length; i++) {
            require(_usdTokens[i] != address(0), "Invalid USD token");
            usdTokenEnabled[_usdTokens[i]] = true;
        }
        emit SetAddresses(wallet, reserveWallet, _usdTokens);
    }

    ////////////////////
    // STO Management //
    ////////////////////

    /**
     * @notice Finalizes the STO and mint remaining tokens to reserve address
     * @notice Reserve address must be whitelisted to successfully finalize
     */
    function finalize() public onlyOwner {
        require(!isFinalized, "STO is already finalized");
        isFinalized = true;
        uint256 tempReturned;
        uint256 tempSold;
        uint256 remainingTokens;
        for (uint256 i = 0; i < tiers.length; i++) {
            remainingTokens = tiers[i].tokenTotal.sub(tiers[i].mintedTotal);
            tempReturned = tempReturned.add(remainingTokens);
            tempSold = tempSold.add(tiers[i].mintedTotal);
            if (remainingTokens > 0) {
                tiers[i].mintedTotal = tiers[i].tokenTotal;
            }
        }
        require(ISecurityToken(securityToken).mint(reserveWallet, tempReturned), "Error in minting");
        emit ReserveTokenMint(msg.sender, reserveWallet, tempReturned, currentTier);
        finalAmountReturned = tempReturned;
        totalTokensSold = tempSold;
    }

    /**
     * @notice Modifies the list of accredited addresses
     * @param _investors Array of investor addresses to modify
     * @param _accredited Array of bools specifying accreditation status
     */
    function changeAccredited(address[] _investors, bool[] _accredited) public onlyOwner {
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
     * @notice Modifies the list of overrides for non-accredited limits in USD
     * @param _investors Array of investor addresses to modify
     * @param _nonAccreditedLimit Array of uints specifying non-accredited limits
     */
    function changeNonAccreditedLimit(address[] _investors, uint256[] _nonAccreditedLimit) public onlyOwner {
        //nonAccreditedLimitUSDOverride
        require(_investors.length == _nonAccreditedLimit.length, "Array length mismatch");
        for (uint256 i = 0; i < _investors.length; i++) {
            investors[_investors[i]].nonAccreditedLimitUSDOverride = _nonAccreditedLimit[i];
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
     * @notice Returns investor accredited & non-accredited override informatiomn
     * @return address[] list of all configured investors
     * @return bool[] whether investor is accredited
     * @return uint256[] any USD overrides for non-accredited limits for the investor
     */
    function getAccreditedData() external view returns (address[], bool[], uint256[]) {
        bool[] memory accrediteds = new bool[](investorsList.length);
        uint256[] memory nonAccreditedLimitUSDOverrides = new uint256[](investorsList.length);
        uint256 i;
        for (i = 0; i < investorsList.length; i++) {
            accrediteds[i] = (investors[investorsList[i]].accredited == uint8(0)? false: true);
            nonAccreditedLimitUSDOverrides[i] = investors[investorsList[i]].nonAccreditedLimitUSDOverride;
        }
        return (investorsList, accrediteds, nonAccreditedLimitUSDOverrides);
    }

    /**
     * @notice Function to set allowBeneficialInvestments (allow beneficiary to be different to funder)
     * @param _allowBeneficialInvestments Boolean to allow or disallow beneficial investments
     */
    function changeAllowBeneficialInvestments(bool _allowBeneficialInvestments) public onlyOwner {
        require(_allowBeneficialInvestments != allowBeneficialInvestments, "Value unchanged");
        allowBeneficialInvestments = _allowBeneficialInvestments;
        emit SetAllowBeneficialInvestments(allowBeneficialInvestments);
    }

    //////////////////////////
    // Investment Functions //
    //////////////////////////

    /**
    * @notice fallback function - assumes ETH being invested
    */
    function () external payable {
        buyWithETHRateLimited(msg.sender, 0);
    }

    // Buy functions without rate restriction
    function buyWithETH(address _beneficiary) external payable {
        buyWithETHRateLimited(_beneficiary, 0);
    }

    function buyWithPOLY(address _beneficiary, uint256 _investedPOLY) external {
        buyWithPOLYRateLimited(_beneficiary, _investedPOLY, 0);
    }

    function buyWithUSD(address _beneficiary, uint256 _investedSC, IERC20 _usdToken) external {
        buyWithUSDRateLimited(_beneficiary, _investedSC, 0, _usdToken);
    }

    /**
      * @notice Purchase tokens using ETH
      * @param _beneficiary Address where security tokens will be sent
      * @param _minTokens Minumum number of tokens to buy or else revert
      */
    function buyWithETHRateLimited(address _beneficiary, uint256 _minTokens) public payable validETH {
        uint256 rate = getRate(FundRaiseType.ETH);
        uint256 initialMinted = getTokensMinted();
        (uint256 spentUSD, uint256 spentValue) = _buyTokens(_beneficiary, msg.value, rate, FundRaiseType.ETH);
        require(getTokensMinted().sub(initialMinted) >= _minTokens, "Insufficient tokens minted");
        // Modify storage
        investorInvested[_beneficiary][uint8(FundRaiseType.ETH)] = investorInvested[_beneficiary][uint8(FundRaiseType.ETH)].add(spentValue);
        fundsRaised[uint8(FundRaiseType.ETH)] = fundsRaised[uint8(FundRaiseType.ETH)].add(spentValue);
        // Forward ETH to issuer wallet
        wallet.transfer(spentValue);
        // Refund excess ETH to investor wallet
        msg.sender.transfer(msg.value.sub(spentValue));
        emit FundsReceived(msg.sender, _beneficiary, spentUSD, FundRaiseType.ETH, msg.value, spentValue, rate);
    }

    /**
      * @notice Purchase tokens using POLY
      * @param _beneficiary Address where security tokens will be sent
      * @param _investedPOLY Amount of POLY invested
      * @param _minTokens Minumum number of tokens to buy or else revert
      */
    function buyWithPOLYRateLimited(address _beneficiary, uint256 _investedPOLY, uint256 _minTokens) public validPOLY {
        _buyWithTokens(_beneficiary, _investedPOLY, FundRaiseType.POLY, _minTokens, polyToken);
    }

    /**
      * @notice Purchase tokens using Stable coins
      * @param _beneficiary Address where security tokens will be sent
      * @param _investedSC Amount of Stable coins invested
      * @param _minTokens Minumum number of tokens to buy or else revert
      * @param _usdToken Address of USD stable coin to buy tokens with
      */
    function buyWithUSDRateLimited(address _beneficiary, uint256 _investedSC, uint256 _minTokens, IERC20 _usdToken)
        public validSC(_usdToken)
    {
        _buyWithTokens(_beneficiary, _investedSC, FundRaiseType.SC, _minTokens, _usdToken);
    }

    function _buyWithTokens(address _beneficiary, uint256 _tokenAmount, FundRaiseType _fundRaiseType, uint256 _minTokens, IERC20 _token) internal {
        require(_fundRaiseType == FundRaiseType.POLY || _fundRaiseType == FundRaiseType.SC, "Invalid raise type");
        uint256 initialMinted = getTokensMinted();
        uint256 rate = getRate(_fundRaiseType);
        (uint256 spentUSD, uint256 spentValue) = _buyTokens(_beneficiary, _tokenAmount, rate, _fundRaiseType);
        require(getTokensMinted().sub(initialMinted) >= _minTokens, "Insufficient tokens minted");
        // Modify storage
        investorInvested[_beneficiary][uint8(_fundRaiseType)] = investorInvested[_beneficiary][uint8(_fundRaiseType)].add(spentValue);
        fundsRaised[uint8(_fundRaiseType)] = fundsRaised[uint8(_fundRaiseType)].add(spentValue);
        if(address(_token) != address(polyToken))
            stableCoinsRaised[address(_token)] = stableCoinsRaised[address(_token)].add(spentValue);
        // Forward coins to issuer wallet
        require(_token.transferFrom(msg.sender, wallet, spentValue), "Transfer failed");
        emit FundsReceived(msg.sender, _beneficiary, spentUSD, _fundRaiseType, _tokenAmount, spentValue, rate);
    }

    /**
      * @notice Low level token purchase
      * @param _beneficiary Address where security tokens will be sent
      * @param _investmentValue Amount of POLY, ETH or Stable coins invested
      * @param _fundRaiseType Fund raise type (POLY, ETH, SC)
      */
    function _buyTokens(
        address _beneficiary,
        uint256 _investmentValue,
        uint256 _rate,
        FundRaiseType _fundRaiseType
    )
        internal
        nonReentrant
        whenNotPaused
        returns(uint256 spentUSD, uint256 spentValue)
    {
        if (!allowBeneficialInvestments) {
            require(_beneficiary == msg.sender, "Beneficiary != funder");
        }

        uint256 originalUSD = DecimalMath.mul(_rate, _investmentValue);
        uint256 allowedUSD = _buyTokensChecks(_beneficiary, _investmentValue, originalUSD);

        for (uint256 i = currentTier; i < tiers.length; i++) {
            bool gotoNextTier;
            uint256 tempSpentUSD;
            // Update current tier if needed
            if (currentTier != i)
                currentTier = i;
            // If there are tokens remaining, process investment
            if (tiers[i].mintedTotal < tiers[i].tokenTotal) {
                (tempSpentUSD, gotoNextTier) = _calculateTier(_beneficiary, i, allowedUSD.sub(spentUSD), _fundRaiseType);
                spentUSD = spentUSD.add(tempSpentUSD);
                // If all funds have been spent, exit the loop
                if (!gotoNextTier)
                    break;
            }
        }

        // Modify storage
        if (spentUSD > 0) {
            if (investorInvestedUSD[_beneficiary] == 0)
                investorCount = investorCount + 1;
            investorInvestedUSD[_beneficiary] = investorInvestedUSD[_beneficiary].add(spentUSD);
            fundsRaisedUSD = fundsRaisedUSD.add(spentUSD);
        }

        spentValue = DecimalMath.div(spentUSD, _rate);
    }

    /**
      * @notice Getter function for buyer to calculate how many tokens will they get
      * @param _beneficiary Address where security tokens are to be sent
      * @param _investmentValue Amount of POLY, ETH or Stable coins invested
      * @param _fundRaiseType Fund raise type (POLY, ETH, SC)
      */
    function buyTokensView(
        address _beneficiary,
        uint256 _investmentValue,
        FundRaiseType _fundRaiseType
    )
        public
        view
        returns(uint256 spentUSD, uint256 spentValue, uint256 tokensMinted)
    {
        require(_fundRaiseType == FundRaiseType.POLY || _fundRaiseType == FundRaiseType.SC || _fundRaiseType == FundRaiseType.ETH, "Invalid raise type");
        uint256 rate = getRate(_fundRaiseType);
        uint256 originalUSD = DecimalMath.mul(rate, _investmentValue);
        uint256 allowedUSD = _buyTokensChecks(_beneficiary, _investmentValue, originalUSD);

        // Iterate over each tier and process payment
        for (uint256 i = currentTier; i < tiers.length; i++) {
            bool gotoNextTier;
            uint256 tempSpentUSD;
            uint256 tempTokensMinted;
            // If there are tokens remaining, process investment
            if (tiers[i].mintedTotal < tiers[i].tokenTotal) {
                (tempSpentUSD, gotoNextTier, tempTokensMinted) = _calculateTierView(i, allowedUSD.sub(spentUSD), _fundRaiseType);
                spentUSD = spentUSD.add(tempSpentUSD);
                tokensMinted = tokensMinted.add(tempTokensMinted);
                // If all funds have been spent, exit the loop
                if (!gotoNextTier)
                    break;
            }
        }

        spentValue = DecimalMath.div(spentUSD, rate);
    }

    function _buyTokensChecks(
        address _beneficiary,
        uint256 _investmentValue,
        uint256 investedUSD
    )
        internal
        view
        returns(uint256 netInvestedUSD)
    {
        require(isOpen(), "STO not open");
        require(_investmentValue > 0, "No funds were sent");

        // Check for minimum investment
        require(investedUSD.add(investorInvestedUSD[_beneficiary]) >= minimumInvestmentUSD, "Total investment < minimumInvestmentUSD");
        netInvestedUSD = investedUSD;
        // Check for non-accredited cap
        if (investors[_beneficiary].accredited == uint8(0)) {
            uint256 investorLimitUSD = (investors[_beneficiary].nonAccreditedLimitUSDOverride == 0) ? nonAccreditedLimitUSD : investors[_beneficiary].nonAccreditedLimitUSDOverride;
            require(investorInvestedUSD[_beneficiary] < investorLimitUSD, "Over Non-accredited investor limit");
            if (investedUSD.add(investorInvestedUSD[_beneficiary]) > investorLimitUSD)
                netInvestedUSD = investorLimitUSD.sub(investorInvestedUSD[_beneficiary]);
        }
    }

    function _calculateTier(
        address _beneficiary,
        uint256 _tier,
        uint256 _investedUSD,
        FundRaiseType _fundRaiseType
    )
        internal
        returns(uint256 spentUSD, bool gotoNextTier)
     {
        // First purchase any discounted tokens if POLY investment
        uint256 tierSpentUSD;
        uint256 tierPurchasedTokens;
        uint256 investedUSD = _investedUSD;
        Tier storage tierData = tiers[_tier];
        // Check whether there are any remaining discounted tokens
        if ((_fundRaiseType == FundRaiseType.POLY) && (tierData.tokensDiscountPoly > tierData.mintedDiscountPoly)) {
            uint256 discountRemaining = tierData.tokensDiscountPoly.sub(tierData.mintedDiscountPoly);
            uint256 totalRemaining = tierData.tokenTotal.sub(tierData.mintedTotal);
            if (totalRemaining < discountRemaining)
                (spentUSD, tierPurchasedTokens, gotoNextTier) = _purchaseTier(_beneficiary, tierData.rateDiscountPoly, totalRemaining, investedUSD, _tier);
            else
                (spentUSD, tierPurchasedTokens, gotoNextTier) = _purchaseTier(_beneficiary, tierData.rateDiscountPoly, discountRemaining, investedUSD, _tier);
            investedUSD = investedUSD.sub(spentUSD);
            tierData.mintedDiscountPoly = tierData.mintedDiscountPoly.add(tierPurchasedTokens);
            tierData.minted[uint8(_fundRaiseType)] = tierData.minted[uint8(_fundRaiseType)].add(tierPurchasedTokens);
            tierData.mintedTotal = tierData.mintedTotal.add(tierPurchasedTokens);
        }
        // Now, if there is any remaining USD to be invested, purchase at non-discounted rate
        if (investedUSD > 0 &&
            tierData.tokenTotal.sub(tierData.mintedTotal) > 0 &&
            (_fundRaiseType != FundRaiseType.POLY || tierData.tokensDiscountPoly <= tierData.mintedDiscountPoly)
        ) {
            (tierSpentUSD, tierPurchasedTokens, gotoNextTier) = _purchaseTier(_beneficiary, tierData.rate, tierData.tokenTotal.sub(tierData.mintedTotal), investedUSD, _tier);
            spentUSD = spentUSD.add(tierSpentUSD);
            tierData.minted[uint8(_fundRaiseType)] = tierData.minted[uint8(_fundRaiseType)].add(tierPurchasedTokens);
            tierData.mintedTotal = tierData.mintedTotal.add(tierPurchasedTokens);
        }
    }

    function _calculateTierView(
        uint256 _tier,
        uint256 _investedUSD,
        FundRaiseType _fundRaiseType
    )
        internal
        view
        returns(uint256 spentUSD, bool gotoNextTier, uint256 tokensMinted)
    {
        // First purchase any discounted tokens if POLY investment
        uint256 tierSpentUSD;
        uint256 tierPurchasedTokens;
        Tier storage tierData = tiers[_tier];
        // Check whether there are any remaining discounted tokens
        if ((_fundRaiseType == FundRaiseType.POLY) && (tierData.tokensDiscountPoly > tierData.mintedDiscountPoly)) {
            uint256 discountRemaining = tierData.tokensDiscountPoly.sub(tierData.mintedDiscountPoly);
            uint256 totalRemaining = tierData.tokenTotal.sub(tierData.mintedTotal);
            if (totalRemaining < discountRemaining)
                (spentUSD, tokensMinted, gotoNextTier) = _purchaseTierAmount(tierData.rateDiscountPoly, totalRemaining, _investedUSD);
            else
                (spentUSD, tokensMinted, gotoNextTier) = _purchaseTierAmount(tierData.rateDiscountPoly, discountRemaining, _investedUSD);
            _investedUSD = _investedUSD.sub(spentUSD);
        }
        // Now, if there is any remaining USD to be invested, purchase at non-discounted rate
        if (_investedUSD > 0 &&
            tierData.tokenTotal.sub(tierData.mintedTotal.add(tokensMinted)) > 0 &&
            (_fundRaiseType != FundRaiseType.POLY || tierData.tokensDiscountPoly <= tierData.mintedDiscountPoly)
        ) {
            (tierSpentUSD, tierPurchasedTokens, gotoNextTier) = _purchaseTierAmount(tierData.rate, tierData.tokenTotal.sub(tierData.mintedTotal), _investedUSD);
            spentUSD = spentUSD.add(tierSpentUSD);
            tokensMinted = tokensMinted.add(tierPurchasedTokens);
        }
    }

    function _purchaseTier(
        address _beneficiary,
        uint256 _tierPrice,
        uint256 _tierRemaining,
        uint256 _investedUSD,
        uint256 _tier
    )
        internal
        returns(uint256 spentUSD, uint256 purchasedTokens, bool gotoNextTier)
    {
        (spentUSD, purchasedTokens, gotoNextTier) = _purchaseTierAmount(_tierPrice, _tierRemaining, _investedUSD);
        if (purchasedTokens > 0) {
            require(ISecurityToken(securityToken).mint(_beneficiary, purchasedTokens), "Error in minting");
            emit TokenPurchase(msg.sender, _beneficiary, purchasedTokens, spentUSD, _tierPrice, _tier);
        }
    }

    function _purchaseTierAmount(
        uint256 _tierPrice,
        uint256 _tierRemaining,
        uint256 _investedUSD
    )
        internal
        view
        returns(uint256 spentUSD, uint256 purchasedTokens, bool gotoNextTier)
    {
        uint256 maximumTokens = DecimalMath.div(_investedUSD, _tierPrice);
        uint256 granularity = ISecurityToken(securityToken).granularity();
        maximumTokens = maximumTokens.div(granularity);
        maximumTokens = maximumTokens.mul(granularity);
        if (maximumTokens > _tierRemaining) {
            spentUSD = DecimalMath.mul(_tierRemaining, _tierPrice);
            // In case of rounding issues, ensure that spentUSD is never more than investedUSD
            if (spentUSD > _investedUSD) {
                spentUSD = _investedUSD;
            }
            purchasedTokens = _tierRemaining;
            gotoNextTier = true;
        } else {
            spentUSD = DecimalMath.mul(maximumTokens, _tierPrice);
            purchasedTokens = maximumTokens;
        }
    }

    /////////////
    // Getters //
    /////////////

    /**
     * @notice This function returns whether or not the STO is in fundraising mode (open)
     * @return bool Whether the STO is accepting investments
     */
    function isOpen() public view returns(bool) {
        if (isFinalized)
            return false;
        /*solium-disable-next-line security/no-block-members*/
        if (now < startTime)
            return false;
        /*solium-disable-next-line security/no-block-members*/
        if (now >= endTime)
            return false;
        if (capReached())
            return false;
        return true;
    }

    /**
     * @notice Checks whether the cap has been reached.
     * @return bool Whether the cap was reached
     */
    function capReached() public view returns (bool) {
        if (isFinalized) {
            return (finalAmountReturned == 0);
        }
        return (tiers[tiers.length - 1].mintedTotal == tiers[tiers.length - 1].tokenTotal);
    }

    /**
     * @dev returns current conversion rate of funds
     * @param _fundRaiseType Fund raise type to get rate of
     */
    function getRate(FundRaiseType _fundRaiseType) public view returns (uint256) {
        if (_fundRaiseType == FundRaiseType.ETH) {
            return IOracle(_getOracle(bytes32("ETH"), bytes32("USD"))).getPrice();
        } else if (_fundRaiseType == FundRaiseType.POLY) {
            return IOracle(_getOracle(bytes32("POLY"), bytes32("USD"))).getPrice();
        } else if (_fundRaiseType == FundRaiseType.SC) {
            return 1 * 10**18;
        } else {
            revert("Incorrect funding");
        }
    }

    /**
     * @notice This function converts from ETH or POLY to USD
     * @param _fundRaiseType Currency key
     * @param _amount Value to convert to USD
     * @return uint256 Value in USD
     */
    function convertToUSD(FundRaiseType _fundRaiseType, uint256 _amount) public view returns(uint256) {
        uint256 rate = getRate(_fundRaiseType);
        return DecimalMath.mul(_amount, rate);
    }

    /**
     * @notice This function converts from USD to ETH or POLY
     * @param _fundRaiseType Currency key
     * @param _amount Value to convert from USD
     * @return uint256 Value in ETH or POLY
     */
    function convertFromUSD(FundRaiseType _fundRaiseType, uint256 _amount) public view returns(uint256) {
        uint256 rate = getRate(_fundRaiseType);
        return DecimalMath.div(_amount, rate);
    }

    /**
     * @notice Return the total no. of tokens sold
     * @return uint256 Total number of tokens sold
     */
    function getTokensSold() public view returns (uint256) {
        if (isFinalized)
            return totalTokensSold;
        else
            return getTokensMinted();
    }

    /**
     * @notice Return the total no. of tokens minted
     * @return uint256 Total number of tokens minted
     */
    function getTokensMinted() public view returns (uint256) {
        uint256 tokensMinted;
        for (uint256 i = 0; i < tiers.length; i++) {
            tokensMinted = tokensMinted.add(tiers[i].mintedTotal);
        }
        return tokensMinted;
    }

    /**
     * @notice Return the total no. of tokens sold for the given fund raise type
     * param _fundRaiseType The fund raising currency (e.g. ETH, POLY, SC) to calculate sold tokens for
     * @return uint256 Total number of tokens sold for ETH
     */
    function getTokensSoldFor(FundRaiseType _fundRaiseType) public view returns (uint256) {
        uint256 tokensSold;
        for (uint256 i = 0; i < tiers.length; i++) {
            tokensSold = tokensSold.add(tiers[i].minted[uint8(_fundRaiseType)]);
        }
        return tokensSold;
    }

    /**
     * @notice Return array of minted tokens in each fund raise type for given tier
     * param _tier The tier to return minted tokens for
     * @return uint256[] array of minted tokens in each fund raise type
     */
    function getTokensMintedByTier(uint256 _tier) public view returns (uint256[]) {
        require(_tier < tiers.length, "Invalid tier");
        uint256[] memory tokensMinted = new uint256[](3);
        tokensMinted[0] = tiers[_tier].minted[uint8(FundRaiseType.ETH)];
        tokensMinted[1] = tiers[_tier].minted[uint8(FundRaiseType.POLY)];
        tokensMinted[2] = tiers[_tier].minted[uint8(FundRaiseType.SC)];
        return tokensMinted;
    }

    /**
     * @notice Return the total no. of tokens sold in a given tier
     * param _tier The tier to calculate sold tokens for
     * @return uint256 Total number of tokens sold in the tier
     */
    function getTokensSoldByTier(uint256 _tier) public view returns (uint256) {
        require(_tier < tiers.length, "Incorrect tier");
        uint256 tokensSold;
        tokensSold = tokensSold.add(tiers[_tier].minted[uint8(FundRaiseType.ETH)]);
        tokensSold = tokensSold.add(tiers[_tier].minted[uint8(FundRaiseType.POLY)]);
        tokensSold = tokensSold.add(tiers[_tier].minted[uint8(FundRaiseType.SC)]);
        return tokensSold;
    }

    /**
     * @notice Return the total no. of tiers
     * @return uint256 Total number of tiers
     */
    function getNumberOfTiers() public view returns (uint256) {
        return tiers.length;
    }

    /**
     * @notice Return the usd tokens accepted by the STO
     * @return address[] usd tokens
     */
    function getUsdTokens() public view returns (address[]) {
        return usdTokens;
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
     * @return Unixtimestamp at which offering gets start.
     * @return Unixtimestamp at which offering ends.
     * @return Currently active tier
     * @return Array of Number of tokens this STO will be allowed to sell at different tiers.
     * @return Array Rate at which tokens are sold at different tiers
     * @return Amount of funds raised
     * @return Number of individual investors this STO have.
     * @return Amount of tokens sold.
     * @return Array of bools to show if funding is allowed in ETH, POLY, SC respectively
     */
    function getSTODetails() public view returns(uint256, uint256, uint256, uint256[], uint256[], uint256, uint256, uint256, bool[]) {
        uint256[] memory cap = new uint256[](tiers.length);
        uint256[] memory rate = new uint256[](tiers.length);
        for(uint256 i = 0; i < tiers.length; i++) {
            cap[i] = tiers[i].tokenTotal;
            rate[i] = tiers[i].rate;
        }
        bool[] memory _fundRaiseTypes = new bool[](3);
        _fundRaiseTypes[0] = fundRaiseTypes[uint8(FundRaiseType.ETH)];
        _fundRaiseTypes[1] = fundRaiseTypes[uint8(FundRaiseType.POLY)];
        _fundRaiseTypes[2] = fundRaiseTypes[uint8(FundRaiseType.SC)];
        return (
            startTime,
            endTime,
            currentTier,
            cap,
            rate,
            fundsRaisedUSD,
            investorCount,
            getTokensSold(),
            _fundRaiseTypes
        );
    }

    /**
     * @notice This function returns the signature of configure function
     * @return bytes4 Configure function signature
     */
    function getInitFunction() public pure returns (bytes4) {
        return 0xeac2f9e4;
    }

    function _getOracle(bytes32 _currency, bytes32 _denominatedCurrency) internal view returns (address) {
        return PolymathRegistry(RegistryUpdater(securityToken).polymathRegistry()).getAddress(oracleKeys[_currency][_denominatedCurrency]);
    }

}
