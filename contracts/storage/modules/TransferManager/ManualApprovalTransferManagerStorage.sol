pragma solidity ^0.5.0;

/**
 * @title Contract used to store layout for the ManualApprovalTransferManager storage
 */
contract ManualApprovalTransferManagerStorage {

    //Manual approval is an allowance (that has been approved) with an expiry time
    struct ManualApproval {
        address from;
        address to;
        uint256 allowance;
        uint256 expiryTime;
        bytes32 description;
    }

    mapping (address => mapping (address => uint256)) public approvalIndex;
    // An array to track all approvals
    ManualApproval[] public approvals;

}
