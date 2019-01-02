pragma solidity ^0.4.24;

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
        uint256 allowance;
        uint256 expiryTime;
    }

    //Manual blocking allows you to specify a list of blocked address pairs with an associated expiry time for the block
    struct ManualBlocking {
        uint256 expiryTime;
    }

    //Store mappings of address => address with ManualApprovals
    mapping (address => mapping (address => ManualApproval)) public manualApprovals;

    //Store mappings of address => address with ManualBlockings
    mapping (address => mapping (address => ManualBlocking)) public manualBlockings;

}
