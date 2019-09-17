pragma solidity ^0.5.8;

contract AdvancedPLCRVotingCheckpointStorage {

    enum Stage { PREP, COMMIT, REVEAL, RESOLVED }

    uint256 internal constant DEFAULTCHOICE = uint256(3);
    uint256 internal constant MAXLIMIT = uint256(500);

    struct Ballot {
        uint256 checkpointId; // Checkpoint At which ballot created
        uint64 commitDuration; // no. of seconds the commit stage will live
        uint64 revealDuration; // no. of seconds the reveal stage will live
        uint64 startTime;       // Timestamp at which ballot will come into effect
        uint24 totalProposals;  // Count of proposals allowed for a given ballot
        uint32 totalVoters;     // Count of voters who vote for the given ballot
        bool isCancelled;       // flag used to cancel the ballot
        bytes32 name;           // Name of the ballot
        mapping(uint256 => Proposal) proposals;
        mapping(address => Vote) voteDetails; // mapping for storing vote details of a voter
        mapping(address => bool) exemptedVoters; // Mapping for blacklist voters
    }

    struct Proposal {
        bytes32 details;
        uint256 noOfChoices;
    }

    struct Vote {
        bytes32 secretVote;
        mapping (uint256 => uint256[]) voteOptions;
    }

    Ballot[] ballots;
    
}