pragma solidity ^0.4.24;

import "./ISTO.sol";
import "../../interfaces/IST20.sol";
import "../../interfaces/IOracle.sol";
import "../../interfaces/ISecurityTokenRegistry.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
 * @title STO module for standard capped crowdsale
 */
contract USDTieredSTO is ISTO {
    using SafeMath for uint256;

    // Address where ETH & POLY funds are delivered
    address public wallet;

    // Address of Polymath Security Token Registry
    address public securityTokenRegistry;

    // How many token units a buyer gets per USD per tier (multiplied by 10**18)
    uint256[] public ratePerTier;

    // How many tokens are available in each tier (relative to totalSupply)
    uint256[] public tokensPerTier;

    // How many tokens have been minted in each tier (relative to totalSupply)
    uint256[] public mintedPerTier;

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

    event TokenPurchase(address indexed _purchaser, address indexed _beneficiary, uint256 _tokens, uint256 _usdAmount, uint8 _tier);
    event FundsReceived(address indexed _purchaser, address indexed _beneficiary, uint256 _usdAmount, uint256 _etherAmount, uint256 _polyAmount, uint256 _rate);

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
     * @param _tokensPerTier Tokens available in each tier
     * @param _securityTokenRegistry Address of Security Token Registry used to reference oracles
     * @param _nonAccreditedLimitUSD Limit in USD (* 10**18) for non-accredited investors
     * @param _startingTier Starting tier for the STO
     * @param _fundRaiseTypes Types of currency used to collect the funds
     * @param _wallet Ethereum account address to hold the funds
     */
    function configure(
        uint256 _startTime,
        uint256 _endTime,
        uint256[] _ratePerTier,
        uint256[] _tokensPerTier,
        address _securityTokenRegistry,
        uint256 _nonAccreditedLimitUSD,
        uint256 _minimumInvestmentUSD,
        uint8 _startingTier,
        uint8[] _fundRaiseTypes,
        address _wallet
    )
    public
    onlyFactory
    {
        require(_ratePerTier.length == _tokensPerTier.length, "Mismatch between rates and tokens per tier");
        //TODO - check a sensible number of tiers since we loop over them
        for (uint256 i = 0; i < _ratePerTier.length; i++) {
            require(_ratePerTier[i] > 0, "Rate of token should be greater than 0");
        }
        require(_wallet != address(0), "Zero address is not permitted for wallet");
        require(_startTime >= now && _endTime > _startTime, "Date parameters are not valid");
        require(_securityTokenRegistry != address(0), "Zero address is not permitted for security token registry");
        require(_startingTier < _ratePerTier.length, "Invalid starting tier");
        currentTier = _startingTier;
        startTime = _startTime;
        endTime = _endTime;
        ratePerTier = _ratePerTier;
        tokensPerTier = _tokensPerTier;
        minimumInvestmentUSD = _minimumInvestmentUSD;
        wallet = _wallet;
        securityTokenRegistry = _securityTokenRegistry;
        nonAccreditedLimitUSD = _nonAccreditedLimitUSD;
        for (uint8 j = 0; j < _fundRaiseTypes.length; j++) {
            fundRaiseType[_fundRaiseTypes[j]] = true;
        }
    }

    /**
     * @notice This function returns the signature of configure function
     */
    function getInitFunction() public returns (bytes4) {
        return bytes4(keccak256("configure(uint256,uint256,uint256[],uint256[],address,address)"));
    }

    function isOpen() public view returns(bool) {
        if (now < startTime) {
            return false;
        }
        if (now >= endTime) {
            return false;
        }
        if ((currentTier == ratePerTier.length) && mintedPerTier[currentTier] == tokensPerTier[currentTier]) {
            return false;
        }
        return true;
    }

    /**
      * @notice low level token purchase ***DO NOT OVERRIDE***
      * @param _beneficiary Address performing the token purchase
      */
    function buyWithETH(address _beneficiary) public payable validETH {
        require(!paused);
        require(isOpen());
        uint256 ETHUSD = IOracle(ISecurityTokenRegistry(securityTokenRegistry).getOracle(bytes32("ETH"), bytes32("USD"))).getPrice();
        uint256 investedETH = msg.value;
        uint256 investedUSD = wmul(ETHUSD, investedETH);
        require(investedUSD >= minimumInvestmentUSD);
        //Refund any excess for non-accredited investors
        if ((!accredited[_beneficiary]) && (investedUSD.add(investorInvestedUSD[_beneficiary]) > nonAccreditedLimitUSD)) {
            uint256 refundUSD = investedUSD.add(investorInvestedUSD[_beneficiary]).sub(nonAccreditedLimitUSD);
            uint256 refundETH = wdiv(refundUSD, ETHUSD);
            msg.sender.transfer(refundETH);
            investedETH = investedETH.sub(refundETH);
            investedUSD = wmul(ETHUSD, investedETH);//investedUSD.sub(refundUSD);
        }
        /* uint256 currentSupply = ISecurityToken(securityToken).totalSupply(); */
        uint256 spentUSD;
        /* uint256 purchasedTokens; */
        for (uint8 i = currentTier; i < ratePerTier.length; i++) {
            if (currentTier != i) {
                currentTier = i;
            }
            if (mintedPerTier[i] < tokensPerTier[i]) {
                spentUSD = spentUSD.add(purchaseTier(_beneficiary, i, investedUSD.sub(spentUSD)));
                /* investedUSD = investedUSD.sub(spentUSD)); */
                if (investedUSD == spentUSD) {
                    break;
                }
            }
        }
        uint256 spentETH = wdiv(wmul(investedETH, spentUSD), investedUSD);
        /* spentETH = spendUSD.wdiv(ETHUSD); */
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

    function purchaseTier(address _beneficiary, uint8 _tier, uint256 _investedUSD) internal returns(uint256) {
        uint256 maximumTokens = wdiv(_investedUSD, ratePerTier[_tier]);
        uint256 remainingTokens = tokensPerTier[_tier].sub(mintedPerTier[_tier]);
        uint256 spentUSD;
        if (maximumTokens > remainingTokens) {
            spentUSD = wmul(remainingTokens, ratePerTier[_tier]);
            mintedPerTier[_tier] = tokensPerTier[_tier];
            require(IST20(securityToken).mint(_beneficiary, remainingTokens), "Error in minting the tokens");
            emit TokenPurchase(msg.sender, _beneficiary, remainingTokens, spentUSD, _tier);
        } else {
            spentUSD = _investedUSD;
            mintedPerTier[_tier] = mintedPerTier[_tier].add(maximumTokens);
            require(IST20(securityToken).mint(_beneficiary, maximumTokens), "Error in minting the tokens");
            emit TokenPurchase(msg.sender, _beneficiary, maximumTokens, spentUSD, _tier);
        }
        return spentUSD;
    }

    /**
      * @notice low level token purchase
      * @param _investedPOLY Amount of POLY invested
      */
    function buyWithPoly(address _beneficiary, uint256 _investedPOLY) public validPOLY {
        require(!paused);
        require(isOpen());
        uint256 POLYUSD = IOracle(ISecurityTokenRegistry(securityTokenRegistry).getOracle(bytes32("ETH"), bytes32("USD"))).getPrice();
        /* uint256 investedPOLY = msg.value; */
        uint256 investedUSD = wmul(POLYUSD, _investedPOLY);
        require(investedUSD >= minimumInvestmentUSD);
        //Refund any excess for non-accredited investors
        if ((!accredited[_beneficiary]) && (investedUSD.add(investorInvestedUSD[_beneficiary]) > nonAccreditedLimitUSD)) {
            uint256 refundUSD = investedUSD.add(investorInvestedUSD[_beneficiary]).sub(nonAccreditedLimitUSD);
            uint256 refundPOLY = wdiv(refundUSD, POLYUSD);
            _investedPOLY = _investedPOLY.sub(refundPOLY);
            investedUSD = wmul(POLYUSD, _investedPOLY);//investedUSD.sub(refundUSD);
        }
        require(verifyInvestment(msg.sender, _investedPOLY));
        /* uint256 currentSupply = ISecurityToken(securityToken).totalSupply(); */
        uint256 spentUSD;
        /* uint256 purchasedTokens; */
        for (uint8 i = currentTier; i < ratePerTier.length; i++) {
            if (currentTier != i) {
                currentTier = i;
            }
            if (mintedPerTier[i] < tokensPerTier[i]) {
                spentUSD = spentUSD.add(purchaseTier(_beneficiary, i, investedUSD.sub(spentUSD)));
                /* investedUSD = investedUSD.sub(spentUSD)); */
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
        uint256 spentPOLY = wdiv(wmul(_investedPOLY, spentUSD), investedUSD);
        /* spentPOLY = spendUSD.wdiv(POLYUSD); */
        investorInvestedUSD[_beneficiary] = investorInvestedUSD[_beneficiary].add(spentUSD);
        investorInvestedPOLY[_beneficiary] = investorInvestedPOLY[_beneficiary].add(spentPOLY);
        fundsRaisedPOLY = fundsRaisedPOLY.add(spentPOLY);
        fundsRaisedUSD = fundsRaisedUSD.add(spentUSD);
        transferPOLY(msg.sender, spentPOLY);
        emit FundsReceived(msg.sender, _beneficiary, spentUSD, 0, spentPOLY, POLYUSD);
    }

    function transferPOLY(address _beneficiary, uint256 _polyAmount) internal {
        require(polyToken.transferFrom(_beneficiary, wallet, _polyAmount));
    }

    /**
    * @notice Checks whether the cap has been reached.
    * @return bool Whether the cap was reached
    */
    function capReached() public view returns (bool) {
        return ((currentTier == ratePerTier.length) && (mintedPerTier[currentTier] == tokensPerTier[currentTier]));
    }

    /**
     * @notice Return ETH raised by the STO
     */
    function getRaisedEther() public view returns (uint256) {
        return fundsRaisedETH;
    }

    /**
     * @notice Return POLY raised by the STO
     */
    function getRaisedPOLY() public view returns (uint256) {
        return fundsRaisedPOLY;
    }

    /**
     * @notice Return USD raised by the STO
     */
    function getRaisedUSD() public view returns (uint256) {
        return fundsRaisedUSD;
    }

    /**
     * @notice Return the total no. of investors
     */
    function getNumberInvestors() public view returns (uint256) {
        return investorCount;
    }

    /**
     * @notice Return the total no. of tokens sold
     */
    function getTokensSold() public view returns (uint256) {
        uint256 tokensSold;
        for (uint8 i = 0; i < currentTier; i++) {
            tokensSold = tokensSold.add(mintedPerTier[i]);
        }
        return tokensSold;
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
