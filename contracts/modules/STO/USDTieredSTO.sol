pragma solidity ^0.4.24;

import "./ISTO.sol";
import "../../interfaces/ISecurityToken.sol";
import "../../interfaces/IOracle.sol";
import "../../RegistryUpdater.sol";
import "../../libraries/DecimalMath.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ReentrancyGuard.sol";

/**
 * @title STO module for standard capped crowdsale
 */
contract USDTieredSTO is ISTO, ReentrancyGuard {
    using SafeMath for uint256;

    /////////////
    // Storage //
    /////////////

    string public POLY_ORACLE = "PolyUsdOracle";
    string public ETH_ORACLE = "EthUsdOracle";
    mapping (bytes32 => mapping (bytes32 => string)) oracleKeys;

    IERC20 public constant daiToken = IERC20(0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359);

    // Determine whether users can invest on behalf of a beneficiary
    bool public allowBeneficialInvestments = false;

    // Address where ETH, POLY & DAI funds are delivered
    address public wallet;

    // Address of issuer reserve wallet for unsold tokens
    address public reserveWallet;

    // How many token units a buyer gets per USD per tier (multiplied by 10**18)
    uint256[] public ratePerTier;

    // How many token units a buyer gets per USD per tier (multiplied by 10**18) when investing in POLY up to tokensPerTierDiscountPoly
    uint256[] public ratePerTierDiscountPoly;

    // How many tokens are available in each tier (relative to totalSupply)
    uint256[] public tokensPerTierTotal;

    // How many token units are available in each tier (relative to totalSupply) at the ratePerTierDiscountPoly rate
    uint256[] public tokensPerTierDiscountPoly;

    // How many tokens have been minted in each tier (relative to totalSupply)
    uint256[] public mintedPerTierTotal;

    // How many tokens have been minted in each tier (relative to totalSupply) for each fund raise type
    mapping (uint8 => uint256[]) mintedPerTier;

    // How many tokens have been minted in each tier (relative to totalSupply) at discounted POLY rate
    uint256[] public mintedPerTierDiscountPoly;

    // Current tier
    uint8 public currentTier;

    // Amount of USD funds raised
    uint256 public fundsRaisedUSD;

    // Amount in USD invested by each address
    mapping (address => uint256) public investorInvestedUSD;

    // Amount in fund raise type invested by each investor
    mapping (address => mapping (uint8 => uint256)) public investorInvested;

    // List of accredited investors
    mapping (address => bool) public accredited;

    // Default limit in USD for non-accredited investors multiplied by 10**18
    uint256 public nonAccreditedLimitUSD;

    // Overrides for default limit in USD for non-accredited investors multiplied by 10**18
    mapping (address => uint256) public nonAccreditedLimitUSDOverride;

    // Minimum investable amount in USD
    uint256 public minimumInvestmentUSD;

    // Whether or not the STO has been finalized
    bool public isFinalized;

    // Final amount of tokens returned to issuer
    uint256 public finalAmountReturned;

    ////////////
    // Events //
    ////////////

    event SetAllowBeneficialInvestments(bool _allowed);
    event SetNonAccreditedLimit(address _investor, uint256 _limit);
    event SetAccredited(address _investor, bool _accredited);
    event TokenPurchase(address indexed _purchaser, address indexed _beneficiary, uint256 _tokens, uint256 _usdAmount, uint256 _tierPrice, uint8 _tier);
    event FundsReceived(address indexed _purchaser, address indexed _beneficiary, uint256 _usdAmount, FundRaiseType _fundRaiseType, uint256 _receivedValue, uint256 _spentValue, uint256 _rate);
    event FundsReceivedPOLY(address indexed _purchaser, address indexed _beneficiary, uint256 _usdAmount, uint256 _receivedValue, uint256 _spentValue, uint256 _rate);
    event ReserveTokenMint(address indexed _owner, address indexed _wallet, uint256 _tokens, uint8 _tier);

    event SetAddresses(
        address indexed _wallet,
        address indexed _reserveWallet
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
        require(_getOracle(bytes32("ETH"), bytes32("USD")) != address(0), "Invalid ETHUSD Oracle");
        require(fundRaiseTypes[uint8(FundRaiseType.ETH)]);
        _;
    }

    modifier validPOLY {
        require(_getOracle(bytes32("POLY"), bytes32("USD")) != address(0), "Invalid ETHUSD Oracle");
        require(fundRaiseTypes[uint8(FundRaiseType.POLY)]);
        _;
    }

    modifier validDAI {
        require(fundRaiseTypes[uint8(FundRaiseType.DAI)]);
        _;
    }

    ///////////////////////
    // STO Configuration //
    ///////////////////////

    constructor (address _securityToken, address _polyAddress) public Module(_securityToken, _polyAddress) {
        oracleKeys[bytes32("ETH")][bytes32("USD")] = ETH_ORACLE;
        oracleKeys[bytes32("POLY")][bytes32("USD")] = POLY_ORACLE;
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
        address _reserveWallet
    ) public onlyFactory {
        modifyTimes(_startTime, _endTime);
        // NB - modifyFunding must come after modifyTiers
        modifyTiers(_ratePerTier, _ratePerTierDiscountPoly, _tokensPerTierTotal, _tokensPerTierDiscountPoly);
        modifyFunding(_fundRaiseTypes);
        modifyAddresses(_wallet, _reserveWallet);
        modifyLimits(_nonAccreditedLimitUSD, _minimumInvestmentUSD);
    }

    function modifyFunding(FundRaiseType[] _fundRaiseTypes) public onlyFactoryOrOwner {
        require(now < startTime);
        _setFundRaiseType(_fundRaiseTypes);
        uint256 length = getNumberOfTiers();
        mintedPerTierTotal = new uint256[](length);
        mintedPerTierDiscountPoly = new uint256[](length);
        for (uint8 i = 0; i < _fundRaiseTypes.length; i++) {
            mintedPerTier[uint8(_fundRaiseTypes[i])] = new uint256[](length);
        }
    }

    function modifyLimits(
        uint256 _nonAccreditedLimitUSD,
        uint256 _minimumInvestmentUSD
    ) public onlyFactoryOrOwner {
        require(now < startTime);
        minimumInvestmentUSD = _minimumInvestmentUSD;
        nonAccreditedLimitUSD = _nonAccreditedLimitUSD;
        emit SetLimits(minimumInvestmentUSD, nonAccreditedLimitUSD);
    }

    function modifyTiers(
        uint256[] _ratePerTier,
        uint256[] _ratePerTierDiscountPoly,
        uint256[] _tokensPerTierTotal,
        uint256[] _tokensPerTierDiscountPoly
    ) public onlyFactoryOrOwner {
        require(now < startTime);
        require(_tokensPerTierTotal.length > 0);
        require(_ratePerTier.length == _tokensPerTierTotal.length, "Mismatch b/w rates & tokens / tier");
        require(_ratePerTierDiscountPoly.length == _tokensPerTierTotal.length, "Mismatch b/w discount rates & tokens / tier");
        require(_tokensPerTierDiscountPoly.length == _tokensPerTierTotal.length, "Mismatch b/w discount tokens / tier & tokens / tier");
        for (uint8 i = 0; i < _ratePerTier.length; i++) {
            require(_ratePerTier[i] > 0, "Rate > 0");
            require(_tokensPerTierTotal[i] > 0, "Tokens per tier > 0");
            require(_tokensPerTierDiscountPoly[i] <= _tokensPerTierTotal[i], "Discounted tokens / tier <= to tokens / tier");
            require(_ratePerTierDiscountPoly[i] <= _ratePerTier[i], "Discounted rate / tier <= rate / tier");
        }
        ratePerTier = _ratePerTier;
        ratePerTierDiscountPoly = _ratePerTierDiscountPoly;
        tokensPerTierTotal = _tokensPerTierTotal;
        tokensPerTierDiscountPoly = _tokensPerTierDiscountPoly;
        emit SetTiers(_ratePerTier, _ratePerTierDiscountPoly, _tokensPerTierTotal, _tokensPerTierDiscountPoly);
    }

    function modifyTimes(
        uint256 _startTime,
        uint256 _endTime
    ) public onlyFactoryOrOwner {
        require((startTime == 0) || (now < startTime));
        require((_endTime > _startTime) && (_startTime > now), "Invalid times");
        startTime = _startTime;
        endTime = _endTime;
        emit SetTimes(_startTime, _endTime);
    }

    function modifyAddresses(
        address _wallet,
        address _reserveWallet
    ) public onlyFactoryOrOwner {
        require(now < startTime);
        require(_wallet != address(0) && _reserveWallet != address(0), "0x address is not allowed");
        wallet = _wallet;
        reserveWallet = _reserveWallet;
        emit SetAddresses(_wallet, _reserveWallet);
    }

    ////////////////////
    // STO Management //
    ////////////////////

    /**
     * @notice Finalize the STO and mint remaining tokens to reserve address
     * @notice Reserve address must be whitelisted to successfully finalize
     */
    function finalize() public onlyOwner {
        require(!isFinalized);
        isFinalized = true;
        uint256 tempReturned;
        uint256 tempSold;
        uint256 remainingTokens;
        for (uint8 i = 0; i < tokensPerTierTotal.length; i++) {
            remainingTokens = tokensPerTierTotal[i].sub(mintedPerTierTotal[i]);
            tempReturned = tempReturned.add(remainingTokens);
            tempSold = tempSold.add(mintedPerTierTotal[i]);
            if (remainingTokens > 0) {
                mintedPerTierTotal[i] = tokensPerTierTotal[i];
                require(ISecurityToken(securityToken).mint(reserveWallet, remainingTokens), "Error in minting");
                emit ReserveTokenMint(msg.sender, reserveWallet, remainingTokens, i);
            }
        }
        finalAmountReturned = tempReturned;
        totalTokensSold = tempSold;
    }

    /**
     * @notice Modify the list of accredited addresses
     * @param _investors Array of investor addresses to modify
     * @param _accredited Array of bools specifying accreditation status
     */
    function changeAccredited(address[] _investors, bool[] _accredited) public onlyOwner {
        require(_investors.length == _accredited.length);
        for (uint256 i = 0; i < _investors.length; i++) {
            accredited[_investors[i]] = _accredited[i];
            emit SetAccredited(_investors[i], _accredited[i]);
        }
    }

    /**
     * @notice Modify the list of overrides for non-accredited limits in USD
     * @param _investors Array of investor addresses to modify
     * @param _nonAccreditedLimit Array of uints specifying non-accredited limits
     */
    function changeNonAccreditedLimit(address[] _investors, uint256[] _nonAccreditedLimit) public onlyOwner {
        //nonAccreditedLimitUSDOverride
        require(_investors.length == _nonAccreditedLimit.length);
        for (uint256 i = 0; i < _investors.length; i++) {
            require(_nonAccreditedLimit[i] > 0, "Limit can't be 0");
            nonAccreditedLimitUSDOverride[_investors[i]] = _nonAccreditedLimit[i];
            emit SetNonAccreditedLimit(_investors[i], _nonAccreditedLimit[i]);
        }
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
        buyWithETH(msg.sender);
    }

    /**
      * @notice Purchase tokens using ETH
      * @param _beneficiary Address where security tokens will be sent
      */
    function buyWithETH(address _beneficiary) public payable validETH {
        uint256 rate = getRate(FundRaiseType.ETH);
        (uint256 spentUSD, uint256 spentValue) = _buyTokens(_beneficiary, msg.value, rate, FundRaiseType.ETH);
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
      */
    function buyWithPOLY(address _beneficiary, uint256 _investedPOLY) public validPOLY {
        uint256 rate = getRate(FundRaiseType.POLY);
        (uint256 spentUSD, uint256 spentValue) = _buyTokens(_beneficiary, _investedPOLY, rate, FundRaiseType.POLY);
        // Modify storage
        investorInvested[_beneficiary][uint8(FundRaiseType.POLY)] = investorInvested[_beneficiary][uint8(FundRaiseType.POLY)].add(spentValue);
        fundsRaised[uint8(FundRaiseType.POLY)] = fundsRaised[uint8(FundRaiseType.POLY)].add(spentValue);
        // Forward POLY to issuer wallet
        require(polyToken.transferFrom(msg.sender, wallet, spentValue));
        emit FundsReceived(msg.sender, _beneficiary, spentUSD, FundRaiseType.POLY, _investedPOLY, spentValue, rate);
    }

    /**
      * @notice Purchase tokens using POLY
      * @param _beneficiary Address where security tokens will be sent
      * @param _investedDAI Amount of POLY invested
      */
    function buyWithDAI(address _beneficiary, uint256 _investedDAI) public validPOLY {
        // Assume a conversion rate of 1 - 1 with USD
        uint256 rate = getRate(FundRaiseType.DAI);
        (uint256 spentUSD, uint256 spentValue) = _buyTokens(_beneficiary, _investedDAI, rate, FundRaiseType.DAI);
        // Modify storage
        investorInvested[_beneficiary][uint8(FundRaiseType.DAI)] = investorInvested[_beneficiary][uint8(FundRaiseType.DAI)].add(spentValue);
        fundsRaised[uint8(FundRaiseType.DAI)] = fundsRaised[uint8(FundRaiseType.DAI)].add(spentValue);
        // Forward DAI to issuer wallet
        require(daiToken.transferFrom(msg.sender, wallet, spentValue));
        emit FundsReceived(msg.sender, _beneficiary, spentUSD, FundRaiseType.DAI, _investedDAI, spentValue, rate);
    }

    /**
      * @notice Low level token purchase
      * @param _beneficiary Address where security tokens will be sent
      * @param _investmentValue Amount of POLY, ETH or DAI invested
      * @param _fundRaiseType Fund raise type (POLY, ETH, DAI)
      */
    function _buyTokens(address _beneficiary, uint256 _investmentValue, uint256 _rate, FundRaiseType _fundRaiseType) internal nonReentrant whenNotPaused returns(uint256, uint256) {
        if (!allowBeneficialInvestments) {
            require(_beneficiary == msg.sender, "Beneficiary must match funder");
        }
        require(isOpen(), "STO is not open");
        require(_investmentValue > 0, "No funds were sent");

        uint256 investedUSD = DecimalMath.mul(_rate, _investmentValue);
        uint256 originalUSD = investedUSD;

        // Check for minimum investment
        require(investedUSD.add(investorInvestedUSD[_beneficiary]) >= minimumInvestmentUSD, "Total investment < minimumInvestmentUSD");

        // Check for non-accredited cap
        if (!accredited[_beneficiary]) {
            uint256 investorLimitUSD = (nonAccreditedLimitUSDOverride[_beneficiary] == 0) ? nonAccreditedLimitUSD : nonAccreditedLimitUSDOverride[_beneficiary];
            require(investorInvestedUSD[_beneficiary] < investorLimitUSD, "Non-accredited investor has reached limit");
            if (investedUSD.add(investorInvestedUSD[_beneficiary]) > investorLimitUSD)
                investedUSD = investorLimitUSD.sub(investorInvestedUSD[_beneficiary]);
        }

        uint256 spentUSD;
        // Iterate over each tier and process payment
        for (uint8 i = currentTier; i < ratePerTier.length; i++) {
            // Update current tier if needed
            if (currentTier != i)
                currentTier = i;
            // If there are tokens remaining, process investment
            if (mintedPerTierTotal[i] < tokensPerTierTotal[i])
                spentUSD = spentUSD.add(_calculateTier(_beneficiary, i, investedUSD.sub(spentUSD), _fundRaiseType));
            // If all funds have been spent, exit the loop
            if (investedUSD == spentUSD)
                break;
        }

        // Modify storage
        if (spentUSD > 0) {
            if (investorInvestedUSD[_beneficiary] == 0)
                investorCount = investorCount + 1;
            investorInvestedUSD[_beneficiary] = investorInvestedUSD[_beneficiary].add(spentUSD);
            fundsRaisedUSD = fundsRaisedUSD.add(spentUSD);
        }

        // Calculate spent in base currency (ETH or POLY)
        uint256 spentValue;
        if (spentUSD == 0) {
            spentValue = 0;
        } else {
            spentValue = DecimalMath.mul(DecimalMath.div(spentUSD, originalUSD), _investmentValue);
        }

        // Return calculated amounts
        return (spentUSD, spentValue);
    }

    function _calculateTier(address _beneficiary, uint8 _tier, uint256 _investedUSD, FundRaiseType _fundRaiseType) internal returns(uint256) {
        // First purchase any discounted tokens if POLY investment
        uint256 spentUSD;
        uint256 tierSpentUSD;
        uint256 tierPurchasedTokens;
        // Check whether there are any remaining discounted tokens
        if ((_fundRaiseType == FundRaiseType.POLY) && tokensPerTierDiscountPoly[_tier] > mintedPerTierDiscountPoly[_tier]) {
            uint256 discountRemaining = tokensPerTierDiscountPoly[_tier].sub(mintedPerTierDiscountPoly[_tier]);
            uint256 totalRemaining = tokensPerTierTotal[_tier].sub(mintedPerTierTotal[_tier]);
            if (totalRemaining < discountRemaining)
                (spentUSD, tierPurchasedTokens) = _purchaseTier(_beneficiary, ratePerTierDiscountPoly[_tier], totalRemaining, _investedUSD, _tier);
            else
                (spentUSD, tierPurchasedTokens) = _purchaseTier(_beneficiary, ratePerTierDiscountPoly[_tier], discountRemaining, _investedUSD, _tier);
            _investedUSD = _investedUSD.sub(spentUSD);
            mintedPerTierDiscountPoly[_tier] = mintedPerTierDiscountPoly[_tier].add(tierPurchasedTokens);
            mintedPerTier[uint8(FundRaiseType.POLY)][_tier] = mintedPerTier[uint8(FundRaiseType.POLY)][_tier].add(tierPurchasedTokens);
            mintedPerTierTotal[_tier] = mintedPerTierTotal[_tier].add(tierPurchasedTokens);
        }
        // Now, if there is any remaining USD to be invested, purchase at non-discounted rate
        if ((_investedUSD > 0) && (tokensPerTierTotal[_tier].sub(mintedPerTierTotal[_tier]) > 0)) {
            (tierSpentUSD, tierPurchasedTokens) = _purchaseTier(_beneficiary, ratePerTier[_tier], tokensPerTierTotal[_tier].sub(mintedPerTierTotal[_tier]), _investedUSD, _tier);
            spentUSD = spentUSD.add(tierSpentUSD);
            mintedPerTier[uint8(_fundRaiseType)][_tier] = mintedPerTier[uint8(_fundRaiseType)][_tier].add(tierPurchasedTokens);
            mintedPerTierTotal[_tier] = mintedPerTierTotal[_tier].add(tierPurchasedTokens);
        }
        return spentUSD;
    }

    function _purchaseTier(address _beneficiary, uint256 _tierPrice, uint256 _tierRemaining, uint256 _investedUSD, uint8 _tier) internal returns(uint256, uint256) {
        uint256 maximumTokens = DecimalMath.div(_investedUSD, _tierPrice);
        uint256 spentUSD;
        uint256 purchasedTokens;
        if (maximumTokens > _tierRemaining) {
            spentUSD = DecimalMath.mul(_tierRemaining, _tierPrice);
            // In case of rounding issues, ensure that spentUSD is never more than investedUSD
            if (spentUSD > _investedUSD) {
                spentUSD = _investedUSD;
            }
            purchasedTokens = _tierRemaining;
        } else {
            spentUSD = _investedUSD;
            purchasedTokens = maximumTokens;
        }
        require(ISecurityToken(securityToken).mint(_beneficiary, purchasedTokens), "Error in minting");
        emit TokenPurchase(msg.sender, _beneficiary, purchasedTokens, spentUSD, _tierPrice, _tier);
        return (spentUSD, purchasedTokens);
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
        if (now < startTime)
            return false;
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
        return (mintedPerTierTotal[mintedPerTierTotal.length - 1] == tokensPerTierTotal[tokensPerTierTotal.length - 1]);
    }

    function getRate(FundRaiseType _fundRaiseType) public view returns (uint256){
        if (_fundRaiseType == FundRaiseType.ETH) {
            return IOracle(_getOracle(bytes32("ETH"), bytes32("USD"))).getPrice();
        } else if (_fundRaiseType == FundRaiseType.POLY) {
            return IOracle(_getOracle(bytes32("POLY"), bytes32("USD"))).getPrice();
        } else if (_fundRaiseType == FundRaiseType.DAI) {
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
        for (uint8 i = 0; i < mintedPerTierTotal.length; i++) {
            tokensMinted = tokensMinted.add(mintedPerTierTotal[i]);
        }
        return tokensMinted;
    }

    /**
     * @notice Return the total no. of tokens sold for ETH
     * @return uint256 Total number of tokens sold for ETH
     */
    function getTokensSoldFor(FundRaiseType _fundRaiseType) public view returns (uint256) {
        uint256 tokensSold;
        for (uint8 i = 0; i < mintedPerTier[uint8(_fundRaiseType)].length; i++) {
            tokensSold = tokensSold.add(mintedPerTier[uint8(_fundRaiseType)][i]);
        }
        return tokensSold;
    }

    /**
     * @notice Return the total no. of tiers
     * @return uint256 Total number of tiers
     */
    function getNumberOfTiers() public view returns (uint256) {
        return tokensPerTierTotal.length;
    }

    /**
     * @notice Return the permissions flag that are associated with STO
     */
    function getPermissions() public view returns(bytes32[]) {
        bytes32[] memory allPermissions = new bytes32[](0);
        return allPermissions;
    }

    /**
     * @notice This function returns the signature of configure function
     * @return bytes4 Configure function signature
     */
    function getInitFunction() public pure returns (bytes4) {
        //keccak256("configure(uint256,uint256,uint256[],uint256[],uint256[],uint256[],uint256,uint256,uint8[],address,address)") ==
        //0xd31d4f2d09fc7bdefd7ea179aebde3dd53e24265c3c63e17e399bbf85fe873bf
        return 0xd31d4f2d;
    }

    function _getOracle(bytes32 _currency, bytes32 _denominatedCurrency) internal view returns (address) {
        return PolymathRegistry(RegistryUpdater(securityToken).polymathRegistry()).getAddress(oracleKeys[_currency][_denominatedCurrency]);
    }

}
