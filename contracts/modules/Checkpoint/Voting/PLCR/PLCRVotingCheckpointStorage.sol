pragma solidity 0.5.8;

contract PLCRVotingCheckpointStorage {

    enum Stage { PREP, COMMIT, REVEAL, RESOLVED }

    struct Ballot {
        uint256 checkpointId; // Checkpoint At which ballot created
        uint256 quorum;       // Should be a multiple of 10 ** 16
        uint64 commitDuration; // no. of seconds the commit stage will live
        uint64 revealDuration; // no. of seconds the reveal stage will live
        uint64 startTime;       // Timestamp at which ballot will come into effect
        uint24 totalProposals;  // Count of proposals allowed for a given ballot
        uint32 totalVoters;     // Count of voters who vote for the given ballot
        bool isActive;          // flag used to turn off/on the ballot
        mapping(uint256 => uint256) proposalToVotes; // Mapping for proposal to total weight collected by the proposal
        mapping(address => Vote) investorToProposal; // mapping for storing vote details of a voter
        mapping(address => bool) exemptedVoters; // Mapping for blacklist voters
    }

    struct Vote {
        uint256 voteOption;
        bytes32 secretVote;
    }

    Ballot[] ballots;
}
