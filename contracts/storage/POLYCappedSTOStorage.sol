pragma solidity ^0.5.0;

/**
 * @title Contract used to store layout for the POLYCappedSTO storage
 */
contract POLYCappedSTOStorage {
    /////////////
    // Storage //
    /////////////

    // How many token base units this STO will be allowed to sell to investors
    // 1 full token = 10^decimals_of_token base units

    uint256 public cap;
    // How many token units a buyer gets per base unit of Fund Raise Type (i.e. ETH/POLY/SC) (multiplied by 10^18)
    // If rate is 10^18, buyer will get 1 token unit for every ETH/POLY/SC token.
    uint256 public rate;

    // Minimum investable amount in FundRaiseType (ETH/POLY/SC)
    uint256 public minimumInvestment;

    // Default limit in fund raise type for non-accredited investors multiplied by 10**18
    uint256 public nonAccreditedLimit;

    // Limit for the maximum number of non-accredited Investors (0 = unlimited)
    uint256 public maxNonAccreditedInvestors;

    // Number of non accredited investors that have invested
    uint256 public nonAccreditedCount;

    // Address of issuer treasury wallet for unsold tokens
    address public treasuryWallet;

    // Determine whether users can invest on behalf of a beneficiary
    bool public allowBeneficialInvestments = false;

    // Whether or not the STO has been finalized
    bool public isFinalized;

    // Amount in the selected fund raise type invested by each investor
    mapping(address => uint256) public investorInvested;

    // Amount in USD invested by each address
    mapping(address => uint256) public investorInvestedUSD;

    // Amount of USD funds raised
    uint256 public fundsRaisedUSD;

    struct Investor {
        // Whether investor is accredited (0 = non-accredited, 1 = accredited)
        uint8 accredited;
        // Whether we have seen the investor before (already added to investors list)
        uint8 seen;
        // Overrides for default limit for non-accredited investors (0 = no override)
        uint256 nonAccreditedLimitOverride;
    }

    // Accredited & non-accredited investor data
    mapping(address => Investor) public investors;

    // List of all addresses that have been added as accredited or non-accredited without
    // the default limit
    address[] public investorsList;

    // Final amount of tokens returned to issuer
    uint256 public finalAmountReturned;

}
