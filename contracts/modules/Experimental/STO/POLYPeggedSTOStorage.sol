pragma solidity ^0.5.0;

/**
 * @title Contract used to store layout for the POLYPeggedSTO storage
 */
contract POLYPeggedSTOStorage {

    bytes32 internal constant INVESTORSKEY = 0xdf3a8dd24acdd05addfc6aeffef7574d2de3f844535ec91e8e0f3e45dba96731; //keccak256(abi.encodePacked("INVESTORS"))

    /////////////
    // Storage //
    /////////////

    // How many token base units this STO will be allowed to sell to investors
    // 1 full token = 10^decimals_of_token base units
    uint256 public cap;

    // How many token units a buyer gets per USD value of the POLY invested (multiplied by 10^18)
    // If rate is 10^18, buyer will get 1 token unit for every USD worth of POLY invested.
    uint256 public rate;

    // Minimum investable amount in USD Value of POLY
    uint256 public minimumInvestment;

    // Default limit in USD for non-accredited investors multiplied by 10**18
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

    // Amount in POLY invested by each investor
    mapping(address => uint256) public investorInvestedPOLY;

    // Amount in USD invested by each address
    mapping(address => uint256) public investorInvestedUSD;

    // Amount of USD funds raised
    uint256 public fundsRaisedUSD;

    // Overrides for default limit for non-accredited investors (0 = no override)
    // limit in USD multiplied by 10**18
    mapping(address => uint256) public nonAccreditedLimitOverride;

    // Final amount of tokens returned to issuer
    uint256 public finalAmountReturned;

}
