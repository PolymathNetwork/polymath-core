pragma solidity ^0.5.0;

/**
 * @title Contract used to store layout for the ManualApprovalTransferManager storage
 */
contract ManualApprovalTransferManagerStorage {

    //Address from which issuances come
    address public issuanceAddress = address(0);

    //Address which can sign whitelist changes
    address public signingAddress = address(0);

    bytes32 public constant TRANSFER_APPROVAL = "TRANSFER_APPROVAL";

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
