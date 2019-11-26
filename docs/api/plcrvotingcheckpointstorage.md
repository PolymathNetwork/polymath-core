---
id: version-3.0.0-PLCRVotingCheckpointStorage
title: PLCRVotingCheckpointStorage
original_id: PLCRVotingCheckpointStorage
---

# PLCRVotingCheckpointStorage.sol

View Source: [contracts/modules/Checkpoint/Voting/PLCR/PLCRVotingCheckpointStorage.sol](../../contracts/modules/Checkpoint/Voting/PLCR/PLCRVotingCheckpointStorage.sol)

**↘ Derived Contracts: [PLCRVotingCheckpoint](PLCRVotingCheckpoint.md), [PLCRVotingCheckpointProxy](PLCRVotingCheckpointProxy.md)**

**PLCRVotingCheckpointStorage**

**Enums**
### Stage

```js
enum Stage {
 PREP,
 COMMIT,
 REVEAL,
 RESOLVED
}
```

## Structs
### Ballot

```js
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

```js
struct Vote {
 uint256 voteOption,
 bytes32 secretVote
}
```

## Contract Members
**Constants & Variables**

```js
struct PLCRVotingCheckpointStorage.Ballot[] internal ballots;

```

## Functions

