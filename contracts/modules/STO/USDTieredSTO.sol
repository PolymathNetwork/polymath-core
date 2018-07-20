pragma solidity ^0.4.24;

import "./ISTO.sol";
import "../../interfaces/IST20.sol";
import "../../interfaces/IOracle.sol";
import "../../interfaces/ISecurityTokenRegistry.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ReentrancyGuard.sol";

/**
 * @title STO module for standard capped crowdsale
 */
contract USDTieredSTO is ISTO, ReentrancyGuard {
    using SafeMath for uint256;

    // Address where ETH & POLY funds are delivered
    address public wallet;

    // Address of issuer reserve wallet for unsold tokens
    address public reserveWallet;

    // Address of Polymath Security Token Registry
    address public securityTokenRegistry;

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

    // How many tokens have been minted in each tier (relative to totalSupply) at ETH rate
    uint256[] public mintedPerTierETH;

    // How many tokens have been minted in each tier (relative to totalSupply) at regular POLY rate
    uint256[] public mintedPerTierRegularPoly;

    // How many tokens have been minted in each tier (relative to totalSupply) at discounted POLY rate
    uint256[] public mintedPerTierDiscountPoly;

    // Current tier
    uint8 public currentTier;

    // Amount of USD funds raised
    uint256 public fundsRaisedUSD;

    // Amount of ETH funds raised
    uint256 public fundsRaisedETH;

    // Amount of POLY funds raised
    uint256 public fundsRaisedPOLY;

    // Number of individual investors
    uint256 public investorCount;

    // Amount in USD invested by each address
    mapping (address => uint256) public investorInvestedUSD;

    // Amount in ETH invested by each address
    mapping (address => uint256) public investorInvestedETH;

    // Amount in POLY invested by each address
    mapping (address => uint256) public investorInvestedPOLY;

    // List of accredited investors
    mapping (address => bool) public accredited;

    // Limit in USD for non-accredited investors multiplied by 10**18
    uint256 public nonAccreditedLimitUSD;

    // Minimum investable amount in USD
    uint256 public minimumInvestmentUSD;

    // Whether or not the STO has been finalized
    bool public isFinalized;

    event TokenPurchase(address indexed _purchaser, address indexed _beneficiary, uint256 _tokens, uint256 _usdAmount, uint256 _tierPrice);
    event FundsReceived(address indexed _purchaser, address indexed _beneficiary, uint256 _usdAmount, uint256 _etherAmount, uint256 _polyAmount, uint256 _rate);
    event ReserveTokenMint(address indexed _owner, address indexed _wallet, uint256 _tokens, uint8 _tier);
    event SetAddresses(
        address indexed _securityTokenRegistry,
        address indexed _wallet,
        address indexed _reserveWallet
    );
    event SetLimits(
        uint256 _nonAccreditedLimitUSD,
        uint256 _minimumInvestmentUSD
    );
    event SetFunding(
        uint8[] _fundRaiseTypes
    );
    event SetTimes(
        uint256 _startTime,
        uint256 _endTime
    );
    event SetTiers(
        uint256[] _ratePerTier,
        uint256[] _ratePerTierDiscountPoly,
        uint256[] _tokensPerTierTotal,
        uint256[] _tokensPerTierDiscountPoly,
        uint8 _startingTier
    );

    modifier validETH {
        require(ISecurityTokenRegistry(securityTokenRegistry).getOracle(bytes32("ETH"), bytes32("USD")) != address(0), "Invalid ETHUSD Oracle");
        require(fundRaiseType[uint8(FundRaiseType.ETH)]);
        _;
    }

    modifier validPOLY {
        require(ISecurityTokenRegistry(securityTokenRegistry).getOracle(bytes32("POLY"), bytes32("USD")) != address(0), "Invalid ETHUSD Oracle");
        require(fundRaiseType[uint8(FundRaiseType.POLY)]);
        _;
    }

    constructor (address _securityToken, address _polyAddress) public
    IModule(_securityToken, _polyAddress)
    {
    }

    //////////////////////////////////
    /**
    * @notice fallback function - assumes ETH being invested
    */
    function () external payable {
        buyWithETH(msg.sender);
    }

    /**
     * @notice Function used to intialize the contract variables
     * @param _startTime Unix timestamp at which offering get started
     * @param _endTime Unix timestamp at which offering get ended
     * @param _ratePerTier Rate (in USD) per tier (* 10**18)
     * @param _tokensPerTierTotal Tokens available in each tier
     * @param _securityTokenRegistry Address of Security Token Registry used to reference oracles
     * @param _nonAccreditedLimitUSD Limit in USD (* 10**18) for non-accredited investors
     * @param _minimumInvestmentUSD Minimun investment in USD (* 10**18)
     * @param _startingTier Starting tier for the STO
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
        address _securityTokenRegistry,
        uint256 _nonAccreditedLimitUSD,
        uint256 _minimumInvestmentUSD,
        uint8 _startingTier,
        uint8[] _fundRaiseTypes,
        address _wallet,
        address _reserveWallet
    ) public onlyFactory {
        _configureFunding(_fundRaiseTypes);
        _configureAddresses(_securityTokenRegistry, _wallet, _reserveWallet);
        _configureTiers(_ratePerTier, _ratePerTierDiscountPoly, _tokensPerTierTotal, _tokensPerTierDiscountPoly, _startingTier);
        _configureTimes(_startTime, _endTime);
        _configureLimits(_nonAccreditedLimitUSD, _minimumInvestmentUSD);
    }

    function modifyFunding(uint8[] _fundRaiseTypes) public onlyOwner {
        require(now < startTime);
        _configureFunding(_fundRaiseTypes);
    }

    function _configureFunding(uint8[] _fundRaiseTypes) internal {
        require(_fundRaiseTypes.length > 0, "No fund raising currencies specified");
        for (uint8 j = 0; j < _fundRaiseTypes.length; j++) {
            require(_fundRaiseTypes[j] < 2);
            fundRaiseType[_fundRaiseTypes[j]] = true;
        }
        emit SetFunding(_fundRaiseTypes);
    }

    function modifyLimits(
        uint256 _nonAccreditedLimitUSD,
        uint256 _minimumInvestmentUSD
    ) public onlyOwner {
        require(now < startTime);
        _configureLimits(_nonAccreditedLimitUSD, _minimumInvestmentUSD);
    }

    function _configureLimits(
        uint256 _nonAccreditedLimitUSD,
        uint256 _minimumInvestmentUSD
    ) internal {
        minimumInvestmentUSD = _minimumInvestmentUSD;
        nonAccreditedLimitUSD = _nonAccreditedLimitUSD;
        emit SetLimits(minimumInvestmentUSD, nonAccreditedLimitUSD);
    }

    function modifyTiers(
        uint256[] _ratePerTier,
        uint256[] _ratePerTierDiscountPoly,
        uint256[] _tokensPerTierTotal,
        uint256[] _tokensPerTierDiscountPoly,
        uint8 _startingTier
    ) public onlyOwner {
        require(now < startTime);
        _configureTiers(_ratePerTier, _ratePerTierDiscountPoly, _tokensPerTierTotal, _tokensPerTierDiscountPoly, _startingTier);
    }

    function _configureTiers(
        uint256[] _ratePerTier,
        uint256[] _ratePerTierDiscountPoly,
        uint256[] _tokensPerTierTotal,
        uint256[] _tokensPerTierDiscountPoly,
        uint8 _startingTier
    ) internal {
        require(_tokensPerTierTotal.length > 0);
        require(_ratePerTier.length == _tokensPerTierTotal.length, "Mismatch between rates and tokens per tier");
        require(_ratePerTierDiscountPoly.length == _tokensPerTierTotal.length, "Mismatch between discount rates and tokens per tier");
        require(_tokensPerTierDiscountPoly.length == _tokensPerTierTotal.length, "Mismatch between discount tokens per tier and tokens per tier");
        require(_startingTier < _ratePerTier.length, "Invalid starting tier");
        for (uint8 i = 0; i < _ratePerTier.length; i++) {
            require(_ratePerTier[i] > 0, "Rate of token should be greater than 0");
            require(_tokensPerTierTotal[i] > 0, "Tokens per tier should be greater than 0");
            require(_tokensPerTierDiscountPoly[i] <= _tokensPerTierTotal[i], "Discounted tokens per tier should be less than or equal to tokens per tier");
            require(_ratePerTierDiscountPoly[i] <= _ratePerTier[i], "Discounted rate per tier should be less than or equal to rate per tier");
        }
        mintedPerTierTotal = new uint256[](_ratePerTier.length);
        mintedPerTierETH = new uint256[](_ratePerTier.length);
        mintedPerTierRegularPoly = new uint256[](_ratePerTier.length);
        mintedPerTierDiscountPoly = new uint256[](_ratePerTier.length);
        currentTier = _startingTier;
        ratePerTier = _ratePerTier;
        ratePerTierDiscountPoly = _ratePerTierDiscountPoly;
        tokensPerTierTotal = _tokensPerTierTotal;
        tokensPerTierDiscountPoly = _tokensPerTierDiscountPoly;
        emit SetTiers(_ratePerTier, _ratePerTierDiscountPoly, _tokensPerTierTotal, _tokensPerTierDiscountPoly, _startingTier);
    }

    function modifyTimes(
        uint256 _startTime,
        uint256 _endTime
    ) public onlyOwner {
        require(now < startTime);
        _configureTimes(_startTime, _endTime);
    }

    function _configureTimes(
        uint256 _startTime,
        uint256 _endTime
    ) internal {
        require(_endTime > _startTime, "Date parameters are not valid");
        require(_startTime > now, "Start Time must be in the future");
        startTime = _startTime;
        endTime = _endTime;
        emit SetTimes(_startTime, _endTime);
    }

    function modifyAddresses(
      address _securityTokenRegistry,
      address _wallet,
      address _reserveWallet
    ) public onlyOwner {
        require(now < startTime);
        _configureAddresses(_securityTokenRegistry, _wallet, _reserveWallet);
    }

    function _configureAddresses(
      address _securityTokenRegistry,
      address _wallet,
      address _reserveWallet
    ) internal {
        require(_wallet != address(0), "Zero address is not permitted for wallet");
        require(_reserveWallet != address(0), "Zero address is not permitted for wallet");
        require(_securityTokenRegistry != address(0), "Zero address is not permitted for security token registry");
        wallet = _wallet;
        reserveWallet = _reserveWallet;
        securityTokenRegistry = _securityTokenRegistry;
        emit SetAddresses(_securityTokenRegistry, _wallet, _reserveWallet);
    }

    /**
     * @notice This function returns the signature of configure function
     * @return bytes4 Configure function signature
     */
    function getInitFunction() public pure returns (bytes4) {
        return bytes4(keccak256("configure(uint256,uint256,uint256[],uint256[],uint256[],uint256[],address,uint256,uint256,uint8,uint8[],address,address)"));
    }

    /**
      * @notice low level token purchase ***DO NOT OVERRIDE***
      * @param _beneficiary Address performing the token purchase
      */
    function buyWithETH(address _beneficiary) public payable validETH nonReentrant {
        require(!paused);
        require(isOpen());
        uint256 ETHUSD = IOracle(ISecurityTokenRegistry(securityTokenRegistry).getOracle(bytes32("ETH"), bytes32("USD"))).getPrice();
        uint256 investedETH = msg.value;
        uint256 investedUSD = wmul(ETHUSD, investedETH);
        require(investedUSD.add(investorInvestedUSD[_beneficiary]) >= minimumInvestmentUSD);
        //Refund any excess for non-accredited investors
        if ((!accredited[_beneficiary]) && (investedUSD.add(investorInvestedUSD[_beneficiary]) > nonAccreditedLimitUSD)) {
            uint256 refundUSD = investedUSD.add(investorInvestedUSD[_beneficiary]).sub(nonAccreditedLimitUSD);
            uint256 refundETH = wdiv(refundUSD, ETHUSD);
            msg.sender.transfer(refundETH);
            investedETH = investedETH.sub(refundETH);
            investedUSD = investedUSD.sub(refundUSD);
        }
        uint256 spentUSD;
        for (uint8 i = currentTier; i < ratePerTier.length; i++) {
            if (currentTier != i) {
                currentTier = i;
            }
            if (mintedPerTierTotal[i] < tokensPerTierTotal[i]) {
                spentUSD = spentUSD.add(_calculateTier(_beneficiary, i, investedUSD.sub(spentUSD), false));
                if (investedUSD == spentUSD) {
                    break;
                }
            }
        }
        uint256 spentETH = wdiv(spentUSD, ETHUSD);
        if (spentUSD > 0) {
            if (investorInvestedUSD[_beneficiary] == 0) {
                investorCount = investorCount + 1;
            }
        }
        investorInvestedUSD[_beneficiary] = investorInvestedUSD[_beneficiary].add(spentUSD);
        investorInvestedETH[_beneficiary] = investorInvestedETH[_beneficiary].add(spentETH);
        fundsRaisedETH = fundsRaisedETH.add(spentETH);
        fundsRaisedUSD = fundsRaisedUSD.add(spentUSD);
        wallet.transfer(spentETH);
        _beneficiary.transfer(investedETH.sub(spentETH));
        emit FundsReceived(msg.sender, _beneficiary, spentUSD, spentETH, 0, ETHUSD);
    }

    /**
      * @notice low level token purchase
      * @param _investedPOLY Amount of POLY invested
      */
    function buyWithPOLY(address _beneficiary, uint256 _investedPOLY) public validPOLY nonReentrant {
        require(!paused);
        require(isOpen());
        uint256 POLYUSD = IOracle(ISecurityTokenRegistry(securityTokenRegistry).getOracle(bytes32("POLY"), bytes32("USD"))).getPrice();
        uint256 investedUSD = wmul(POLYUSD, _investedPOLY);
        require(investedUSD.add(investorInvestedUSD[_beneficiary]) >= minimumInvestmentUSD);
        //Refund any excess for non-accredited investors
        if ((!accredited[_beneficiary]) && (investedUSD.add(investorInvestedUSD[_beneficiary]) > nonAccreditedLimitUSD)) {
            uint256 refundUSD = investedUSD.add(investorInvestedUSD[_beneficiary]).sub(nonAccreditedLimitUSD);
            uint256 refundPOLY = wdiv(refundUSD, POLYUSD);
            _investedPOLY = _investedPOLY.sub(refundPOLY);
            investedUSD = investedUSD.sub(refundUSD);
        }
        require(verifyInvestment(msg.sender, _investedPOLY));
        uint256 spentUSD;
        for (uint8 i = currentTier; i < ratePerTier.length; i++) {
            if (currentTier != i) {
                currentTier = i;
            }
            if (mintedPerTierTotal[i] < tokensPerTierTotal[i]) {
                spentUSD = spentUSD.add(_calculateTier(_beneficiary, i, investedUSD.sub(spentUSD), true));
                if (investedUSD == spentUSD) {
                    break;
                }
            }
        }
        if (spentUSD > 0) {
            if (investorInvestedUSD[_beneficiary] == 0) {
                investorCount = investorCount + 1;
            }
        }
        uint256 spentPOLY = wdiv(spentUSD, POLYUSD);
        investorInvestedUSD[_beneficiary] = investorInvestedUSD[_beneficiary].add(spentUSD);
        investorInvestedPOLY[_beneficiary] = investorInvestedPOLY[_beneficiary].add(spentPOLY);
        fundsRaisedPOLY = fundsRaisedPOLY.add(spentPOLY);
        fundsRaisedUSD = fundsRaisedUSD.add(spentUSD);
        _transferPOLY(msg.sender, spentPOLY);
        emit FundsReceived(msg.sender, _beneficiary, spentUSD, 0, spentPOLY, POLYUSD);
    }

    ///////////////
    // onlyOwner //
    ///////////////

    //TODO - check whether this can only be called when STO has completed
    function finalize() public onlyOwner {
        require(!isFinalized);
        isFinalized = true;
        for (uint8 i = 0; i < tokensPerTierTotal.length; i++) {
            if (mintedPerTierTotal[i] < tokensPerTierTotal[i]) {
                uint256 remainingTokens = tokensPerTierTotal[i].sub(mintedPerTierTotal[i]);
                mintedPerTierTotal[i] = tokensPerTierTotal[i];
                require(IST20(securityToken).mint(reserveWallet, remainingTokens), "Error in minting the tokens");
                emit ReserveTokenMint(msg.sender, reserveWallet, remainingTokens, i);
            }
        }
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
        }
    }

    //////////////
    // Internal //
    //////////////

    function _transferPOLY(address _beneficiary, uint256 _polyAmount) internal {
        require(polyToken.transferFrom(_beneficiary, wallet, _polyAmount));
    }

    function _purchaseTier(address _beneficiary, uint256 _tierPrice, uint256 _tierCap, uint256 _tierMinted, uint256 _investedUSD) internal returns(uint256, uint256) {
        uint256 maximumTokens = wdiv(_investedUSD, _tierPrice);
        uint256 remainingTokens = _tierCap.sub(_tierMinted);
        uint256 spentUSD;
        uint256 purchasedTokens;
        if (maximumTokens > remainingTokens) {
            spentUSD = wmul(remainingTokens, _tierPrice);
            purchasedTokens = remainingTokens;
        } else {
            spentUSD = _investedUSD;
            purchasedTokens = maximumTokens;
        }
        require(IST20(securityToken).mint(_beneficiary, purchasedTokens), "Error in minting the tokens");
        emit TokenPurchase(msg.sender, _beneficiary, purchasedTokens, spentUSD, _tierPrice);
        return (spentUSD, purchasedTokens);
    }

    function _calculateTier(address _beneficiary, uint8 _tier, uint256 _investedUSD, bool _isPOLY) internal returns(uint256) {
        // First purchase any discounted tokens if POLY investment
        uint256 spentUSD;
        uint256 tierSpentUSD;
        uint256 tierPurchasedTokens;
        if (_isPOLY) {
            // Check whether there are any remaining discounted tokens
            if (tokensPerTierDiscountPoly[_tier] > mintedPerTierDiscountPoly[_tier]) {
                (tierSpentUSD, tierPurchasedTokens) = _purchaseTier(_beneficiary, ratePerTierDiscountPoly[_tier], tokensPerTierDiscountPoly[_tier], mintedPerTierDiscountPoly[_tier], _investedUSD);
                spentUSD = spentUSD.add(tierSpentUSD);
                _investedUSD = _investedUSD.sub(spentUSD);
                mintedPerTierDiscountPoly[_tier] = mintedPerTierDiscountPoly[_tier].add(tierPurchasedTokens);
                mintedPerTierTotal[_tier] = mintedPerTierTotal[_tier].add(tierPurchasedTokens);
            }
        }
        // Now, if there is any remaining USD to be invested, purchase at non-discounted rate
        if (_investedUSD > 0) {
            (tierSpentUSD, tierPurchasedTokens) = _purchaseTier(_beneficiary, ratePerTier[_tier], tokensPerTierTotal[_tier], mintedPerTierTotal[_tier], _investedUSD);
            spentUSD = spentUSD.add(tierSpentUSD);
            if (_isPOLY) {
                mintedPerTierRegularPoly[_tier] = mintedPerTierRegularPoly[_tier].add(tierPurchasedTokens);
            } else {
                mintedPerTierETH[_tier] = mintedPerTierETH[_tier].add(tierPurchasedTokens);
            }
            mintedPerTierTotal[_tier] = mintedPerTierTotal[_tier].add(tierPurchasedTokens);
        }
        return spentUSD;
    }

    /////////////
    // Getters //
    /////////////

    /**
     * @notice This function returns whether or not the STO is in fundraising mode (open)
     * @return bool Whether the STO is accepting investments
     */
    function isOpen() public view returns(bool) {
        if (isFinalized) {
            return false;
        }
        if (now < startTime) {
            return false;
        }
        if (now >= endTime) {
            return false;
        }
        if (mintedPerTierTotal[mintedPerTierTotal.length - 1] == tokensPerTierTotal[tokensPerTierTotal.length - 1]) {
            return false;
        }
        return true;
    }

    /**
     * @notice This function converts from ETH or POLY to USD
     * @param _currency Currency key
     * @param _amount Value to convert to USD
     * @return uint256 Value in USD
     */
    function convertToUSD(bytes32 _currency, uint256 _amount) public view returns(uint256) {
        uint256 rate = IOracle(ISecurityTokenRegistry(securityTokenRegistry).getOracle(_currency, bytes32("USD"))).getPrice();
        return wmul(_amount, rate);
    }

    /**
     * @notice This function converts from USD to ETH or POLY
     * @param _currency Currency key
     * @param _amount Value to convert from USD
     * @return uint256 Value in ETH or POLY
     */
    function convertFromUSD(bytes32 _currency, uint256 _amount) public view returns(uint256) {
        uint256 rate = IOracle(ISecurityTokenRegistry(securityTokenRegistry).getOracle(_currency, bytes32("USD"))).getPrice();
        return wdiv(_amount, rate);
    }

    /**
     * @notice Checks whether the cap has been reached.
     * @return bool Whether the cap was reached
     */
    function capReached() public view returns (bool) {
        return (mintedPerTierTotal[mintedPerTierTotal.length - 1] == tokensPerTierTotal[tokensPerTierTotal.length - 1]);
    }

    /**
     * @notice Return ETH raised by the STO
     * @return uint256 Amount of ETH raised
     */
    function getRaisedEther() public view returns (uint256) {
        return fundsRaisedETH;
    }

    /**
     * @notice Return POLY raised by the STO
     * @return uint256 Amount of POLY raised
     */
    function getRaisedPOLY() public view returns (uint256) {
        return fundsRaisedPOLY;
    }

    /**
     * @notice Return USD raised by the STO
     * @return uint256 Amount of USD raised
     */
    function getRaisedUSD() public view returns (uint256) {
        return fundsRaisedUSD;
    }

    /**
     * @notice Return the total no. of investors
     * @return uint256 Investor count
     */
    function getNumberInvestors() public view returns (uint256) {
        return investorCount;
    }

    /**
     * @notice Return the total no. of tokens sold
     * @return uint256 Total number of tokens sold
     */
    function getTokensSold() public view returns (uint256) {
        uint256 tokensSold;
        for (uint8 i = 0; i < mintedPerTierTotal.length; i++) {
            tokensSold = tokensSold.add(mintedPerTierTotal[i]);
        }
        return tokensSold;
    }

    /**
     * @notice Return the total no. of tokens sold for ETH
     * @return uint256 Total number of tokens sold for ETH
     */
    function getTokensSoldForETH() public view returns (uint256) {
        uint256 tokensSold;
        for (uint8 i = 0; i < mintedPerTierETH.length; i++) {
            tokensSold = tokensSold.add(mintedPerTierETH[i]);
        }
        return tokensSold;
    }

    /**
     * @notice Return the total no. of tokens sold for POLY
     * @return uint256 Total number of tokens sold for POLY
     */
    function getTokensSoldForPOLY() public view returns (uint256) {
        uint256 tokensSold;
        for (uint8 i = 0; i < mintedPerTierRegularPoly.length; i++) {
            tokensSold = tokensSold.add(mintedPerTierRegularPoly[i]).add(mintedPerTierDiscountPoly[i]);
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

    //Below from DSMath
    //TODO: Attribute or import from DSMath
    uint constant WAD = 10 ** 18;
    uint constant RAY = 10 ** 27;

    function wmul(uint x, uint y) internal pure returns (uint z) {
        z = SafeMath.add(SafeMath.mul(x, y), WAD / 2) / WAD;
    }
    function rmul(uint x, uint y) internal pure returns (uint z) {
        z = SafeMath.add(SafeMath.mul(x, y), RAY / 2) / RAY;
    }
    function wdiv(uint x, uint y) internal pure returns (uint z) {
        z = SafeMath.add(SafeMath.mul(x, WAD), y / 2) / y;
    }
    function rdiv(uint x, uint y) internal pure returns (uint z) {
        z = SafeMath.add(SafeMath.mul(x, RAY), y / 2) / y;
    }

}
