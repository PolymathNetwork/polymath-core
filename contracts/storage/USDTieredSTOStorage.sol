pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

/**
 * @title Contract used to store layout for the USDTieredSTO storage
 */
contract USDTieredSTOStorage {
    /////////////
    // Storage //
    /////////////
    struct Tier {
        // NB rates mentioned below are actually price and are used like price in the logic.
        // How many token units a buyer gets per USD in this tier (multiplied by 10**18)
        uint256 rate;
        // How many token units a buyer gets per USD in this tier (multiplied by 10**18) when investing in POLY up to tokensDiscountPoly
        uint256 rateDiscountPoly;
        // How many tokens are available in this tier (relative to totalSupply)
        uint256 tokenTotal;
        // How many token units are available in this tier (relative to totalSupply) at the ratePerTierDiscountPoly rate
        uint256 tokensDiscountPoly;
        // How many tokens have been minted in this tier (relative to totalSupply)
        uint256 mintedTotal;
        // How many tokens have been minted in this tier (relative to totalSupply) for each fund raise type
        mapping(uint8 => uint256) minted;
        // How many tokens have been minted in this tier (relative to totalSupply) at discounted POLY rate
        uint256 mintedDiscountPoly;
    }

    struct Investor {
        // Whether investor is accredited (0 = non-accredited, 1 = accredited)
        uint8 accredited;
        // Whether we have seen the investor before (already added to investors list)
        uint8 seen;
        // Overrides for default limit in USD for non-accredited investors multiplied by 10**18 (0 = no override)
        uint256 nonAccreditedLimitUSDOverride;
    }

    mapping(bytes32 => mapping(bytes32 => string)) oracleKeys;

    // Determine whether users can invest on behalf of a beneficiary
    bool public allowBeneficialInvestments;

    // Whether or not the STO has been finalized
    bool public isFinalized;

    // Address of issuer reserve wallet for unsold tokens
    address public reserveWallet;

    // List of stable coin addresses
    address[] internal usdTokens;

    // Current tier
    uint256 public currentTier;

    // Amount of USD funds raised
    uint256 public fundsRaisedUSD;

    // Amount of stable coins raised
    mapping (address => uint256) public stableCoinsRaised;

    // Amount in USD invested by each address
    mapping(address => uint256) public investorInvestedUSD;

    // Amount in fund raise type invested by each investor
    mapping(address => mapping(uint8 => uint256)) public investorInvested;

    // Accredited & non-accredited investor data
    mapping (address => Investor) public investors;

    // List of active stable coin addresses
    mapping (address => bool) internal usdTokenEnabled;

    // List of all addresses that have been added as accredited or non-accredited without
    // the default limit
    address[] public investorsList;

    // Default limit in USD for non-accredited investors multiplied by 10**18
    uint256 public nonAccreditedLimitUSD;

    // Minimum investable amount in USD
    uint256 public minimumInvestmentUSD;

    // Final amount of tokens returned to issuer
    uint256 public finalAmountReturned;

    // Array of Tiers
    Tier[] public tiers;

}
