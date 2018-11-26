/**
 * DISCLAIMER: Under certain conditions, the function pushDividendPayment
 * may fail due to block gas limits.
 * If the total number of investors that ever held tokens is greater than ~15,000 then
 * the function may fail. If this happens investors can pull their dividends, or the Issuer
 * can use pushDividendPaymentToAddresses to provide an explict address list in batches
 */
pragma solidity ^0.4.24;

/**
 * @title Checkpoint module for issuing ether dividends
 * @dev abstract contract
 */
contract DividendCheckpointStorage {

    uint256 public EXCLUDED_ADDRESS_LIMIT = 50;
    bytes32 public constant DISTRIBUTE = "DISTRIBUTE";
    bytes32 public constant MANAGE = "MANAGE";
    bytes32 public constant CHECKPOINT = "CHECKPOINT";

    struct Dividend {
        uint256 checkpointId;
        uint256 created; // Time at which the dividend was created
        uint256 maturity; // Time after which dividend can be claimed - set to 0 to bypass
        uint256 expiry;  // Time until which dividend can be claimed - after this time any remaining amount can be withdrawn by issuer -
                         // set to very high value to bypass
        uint256 amount; // Dividend amount in WEI
        uint256 claimedAmount; // Amount of dividend claimed so far
        uint256 totalSupply; // Total supply at the associated checkpoint (avoids recalculating this)
        bool reclaimed;  // True if expiry has passed and issuer has reclaimed remaining dividend
        uint256 dividendWithheld;
        uint256 dividendWithheldReclaimed;
        mapping (address => bool) claimed; // List of addresses which have claimed dividend
        mapping (address => bool) dividendExcluded; // List of addresses which cannot claim dividends
        bytes32 name; // Name/title - used for identification
    }

    // List of all dividends
    Dividend[] public dividends;

    // List of addresses which cannot claim dividends
    address[] public excluded;

    // Mapping from address to withholding tax as a percentage * 10**16
    mapping (address => uint256) public withholdingTax;

    // Total amount of ETH withheld per investor
    mapping (address => uint256) public investorWithheld;

}
