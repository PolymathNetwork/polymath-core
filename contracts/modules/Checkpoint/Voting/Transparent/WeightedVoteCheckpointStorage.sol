pragma solidity 0.5.8;

contract WeightedVoteCheckpointStorage {

    struct Ballot {
        uint256 checkpointId; // Checkpoint At which ballot created
        uint256 quorum;       // Should be a multiple of 10 ** 16
        uint64 startTime;      // Timestamp at which ballot will come into effect
        uint64 endTime;         // Timestamp at which ballot will no more into effect
        uint64 totalProposals;  // Count of proposals allowed for a given ballot
        uint56 totalVoters;     // Count of voters who vote for the given ballot
        bool isActive;          // flag used to turn off/on the ballot
        mapping(uint256 => uint256) proposalToVotes;  // Mapping for proposal to total weight collected by the proposal
        mapping(address => uint256) investorToProposal; // mapping for storing vote details of a voter
        mapping(address => bool) exemptedVoters; // Mapping for blacklist voters
    }

    Ballot[] ballots;
}
