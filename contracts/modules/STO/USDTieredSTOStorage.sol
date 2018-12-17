pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

/**
 * @title Contract used to store layout for the USDTieredSTO storage
 */
contract USDTieredSTOStorage {

    /////////////
    // Storage //
    /////////////
    struct Tier {
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
        mapping (uint8 => uint256) minted;

        // How many tokens have been minted in this tier (relative to totalSupply) at discounted POLY rate
        uint256 mintedDiscountPoly;
    }

    mapping (bytes32 => mapping (bytes32 => string)) oracleKeys;

    IERC20 public usdToken;

    // Determine whether users can invest on behalf of a beneficiary
    bool public allowBeneficialInvestments = false;

    // Whether or not the STO has been finalized
    bool public isFinalized;

    // Address where ETH, POLY & DAI funds are delivered
    address public wallet;

    // Address of issuer reserve wallet for unsold tokens
    address public reserveWallet;

    // Current tier
    uint256 public currentTier;

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

    // Final amount of tokens returned to issuer
    uint256 public finalAmountReturned;

    // Array of Tiers
    Tier[] public tiers;

}
