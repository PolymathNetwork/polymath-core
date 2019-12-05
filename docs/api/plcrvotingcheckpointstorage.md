---
id: version-3.0.0-PLCRVotingCheckpointStorage
title: PLCRVotingCheckpointStorage
original_id: PLCRVotingCheckpointStorage
---

# PLCRVotingCheckpointStorage.sol

View Source: [contracts/modules/Checkpoint/Voting/PLCR/PLCRVotingCheckpointStorage.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/modules/Checkpoint/Voting/PLCR/PLCRVotingCheckpointStorage.sol)

**↘ Derived Contracts:** [**PLCRVotingCheckpoint**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/PLCRVotingCheckpoint.md)**,** [**PLCRVotingCheckpointProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/PLCRVotingCheckpointProxy.md)

**PLCRVotingCheckpointStorage**

**Enums**

### Stage

```javascript
enum Stage {
 PREP,
 COMMIT,
 REVEAL,
 RESOLVED
}
```

## Structs

### Ballot

```javascript
struct Ballot {
 uint256 checkpointId,
 uint256 quorum,
 uint64 commitDuration,
 uint64 revealDuration,
 uint64 startTime,
 uint24 totalProposals,
 uint32 totalVoters,
 bool isActive,
 mapping(uint256 => uint256) proposalToVotes,
 mapping(address => struct PLCRVotingCheckpointStorage.Vote) investorToProposal,
 mapping(address => bool) exemptedVoters
}
```

### Vote

```javascript
struct Vote {
 uint256 voteOption,
 bytes32 secretVote
}
```

## Contract Members

**Constants & Variables**

```javascript
struct PLCRVotingCheckpointStorage.Ballot[] internal ballots;
```

## Functions

