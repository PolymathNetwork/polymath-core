pragma solidity 0.5.8;

/**
 * @title Contract used to store layout for the PercentageTransferManager storage
 */
contract PercentageTransferManagerStorage {

    // Maximum percentage that any holder can have, multiplied by 10**16 - e.g. 20% is 20 * 10**16
    uint256 public maxHolderPercentage;

    // Ignore transactions which are part of the primary issuance
    bool public allowPrimaryIssuance = true;

    // Addresses on this list are always able to send / receive tokens
    mapping (address => bool) public whitelist;

}
