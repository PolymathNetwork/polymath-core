pragma solidity 0.5.8;

/**
 * @title Wallet for core vesting escrow functionality
 */
contract LockUpTransferManagerStorage {

    // a per-user lockup
    struct LockUp {
        uint256 lockupAmount; // Amount to be locked
        uint256 startTime; // when this lockup starts (seconds)
        uint256 lockUpPeriodSeconds; // total period of lockup (seconds)
        uint256 releaseFrequencySeconds; // how often to release a tranche of tokens (seconds)
    }

    // mapping use to store the lockup details corresponds to lockup name
    mapping (bytes32 => LockUp) public lockups;
    // mapping user addresses to an array of lockups name for that user
    mapping (address => bytes32[]) internal userToLockups;
    // get list of the addresses for a particular lockupName
    mapping (bytes32 => address[]) internal lockupToUsers;
    // holds lockup index corresponds to user address. userAddress => lockupName => lockupIndex
    mapping (address => mapping(bytes32 => uint256)) internal userToLockupIndex;
    // holds the user address index corresponds to the lockup. lockupName => userAddress => userIndex
    mapping (bytes32 => mapping(address => uint256)) internal lockupToUserIndex;

    bytes32[] lockupArray;

}
