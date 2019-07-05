pragma solidity 0.5.8;

/**
 * @title Contract used to store layout for the CountTransferManager storage
 */
contract BlacklistTransferManagerStorage {

    struct BlacklistsDetails {
        uint256 startTime;
        uint256 endTime;
        uint256 repeatPeriodTime;
    }

    //hold the different blacklist details corresponds to its name
    mapping(bytes32 => BlacklistsDetails) public blacklists;

    //hold the different name of blacklist corresponds to a investor
    mapping(address => bytes32[]) investorToBlacklist;

    //get list of the addresses for a particular blacklist
    mapping(bytes32 => address[]) blacklistToInvestor;

    //mapping use to store the indexes for different blacklist types for a investor
    mapping(address => mapping(bytes32 => uint256)) investorToIndex;

    //mapping use to store the indexes for different investor for a blacklist type
    mapping(bytes32 => mapping(address => uint256)) blacklistToIndex;

    bytes32[] allBlacklists;

}
