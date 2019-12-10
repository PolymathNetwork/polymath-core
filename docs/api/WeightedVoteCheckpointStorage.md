---
id: version-3.0.0-WeightedVoteCheckpointStorage
title: WeightedVoteCheckpointStorage
original_id: WeightedVoteCheckpointStorage
---

# WeightedVoteCheckpointStorage.sol

View Source: [contracts/modules/Checkpoint/Voting/Transparent/WeightedVoteCheckpointStorage.sol](../../contracts/modules/Checkpoint/Voting/Transparent/WeightedVoteCheckpointStorage.sol)

**↘ Derived Contracts: [WeightedVoteCheckpoint](WeightedVoteCheckpoint.md), [WeightedVoteCheckpointProxy](WeightedVoteCheckpointProxy.md)**

**WeightedVoteCheckpointStorage**

## Structs
### Ballot

```js
struct Ballot {
 uint256 checkpointId,
 uint256 quorum,
 uint64 startTime,
 uint64 endTime,
 uint64 totalProposals,
 uint56 totalVoters,
 bool isActive,
 mapping(uint256 => uint256) proposalToVotes,
 mapping(address => uint256) investorToProposal,
 mapping(address => bool) exemptedVoters
}
```

## Contract Members
**Constants & Variables**

```js
struct WeightedVoteCheckpointStorage.Ballot[] internal ballots;

```

## Functions

