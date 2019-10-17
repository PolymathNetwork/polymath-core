pragma solidity 0.5.8;

/**
 * @title Contract used to store layout for the ManualApprovalTransferManager storage
 */
contract ManualApprovalTransferManagerStorage {

    //Manual approval is an allowance (that has been approved) with an expiry time
    struct ManualApproval {
        address from;
        address to;
        uint256 initialAllowance;
        uint256 allowance;
        uint256 expiryTime;
        bytes32 description;
    }

    mapping (address => mapping (address => uint256)) public approvalIndex;

    // An array to track all approvals. It is an unbounded array but it's not a problem as
    // it is never looped through in an onchain call. It is defined as an Array instead of mapping
    // just to make it easier for users to fetch list of all approvals through constant functions.
    ManualApproval[] public approvals;

}
