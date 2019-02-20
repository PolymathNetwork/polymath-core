pragma solidity ^0.5.0;

/**
 * @title Contract used to store layout for the CountTransferManager storage
 */
contract CountTransferManagerStorage {

    bytes32 public constant ADMIN = "ADMIN";

    // The maximum number of concurrent token holders
    uint256 public maxHolderCount;

}
