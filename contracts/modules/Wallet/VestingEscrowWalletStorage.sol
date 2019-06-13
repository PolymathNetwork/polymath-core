pragma solidity 0.5.8;

/**
 * @title Wallet for core vesting escrow functionality
 */
contract VestingEscrowWalletStorage {

    struct Schedule {
        // Name of the template
        bytes32 templateName;
        // Tokens that were already claimed
        uint256 claimedTokens;
        // Start time of the schedule
        uint256 startTime;
    }

    struct Template {
        // Total amount of tokens
        uint256 numberOfTokens;
        // Schedule duration (How long the schedule will last)
        uint256 duration;
        // Schedule frequency (It is a cliff time period)
        uint256 frequency;
        // Index of the template in an array template names
        uint256 index;
    }

    // Number of tokens that are hold by the `this` contract but are unassigned to any schedule
    uint256 public unassignedTokens;
    // Address of the Treasury wallet. All of the unassigned token will transfer to that address.
    address public treasuryWallet;
    // List of all beneficiaries who have the schedules running/completed/created
    address[] public beneficiaries;
    // Flag whether beneficiary has been already added or not
    mapping(address => bool) internal beneficiaryAdded;

    // Holds schedules array corresponds to the affiliate/employee address
    mapping(address => Schedule[]) public schedules;
    // Holds template names array corresponds to the affiliate/employee address
    mapping(address => bytes32[]) internal userToTemplates;
    // Mapping use to store the indexes for different template names for a user.
    // affiliate/employee address => template name => index
    mapping(address => mapping(bytes32 => uint256)) internal userToTemplateIndex;
    // Holds affiliate/employee addresses coressponds to the template name
    mapping(bytes32 => address[]) internal templateToUsers;
    // Mapping use to store the indexes for different users for a template.
    // template name => affiliate/employee address => index
    mapping(bytes32 => mapping(address => uint256)) internal templateToUserIndex;
    // Store the template details corresponds to the template name
    mapping(bytes32 => Template) templates;

    // List of all template names
    bytes32[] public templateNames;
}
