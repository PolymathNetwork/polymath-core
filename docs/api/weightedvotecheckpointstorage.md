---
id: version-3.0.0-WeightedVoteCheckpointStorage
title: WeightedVoteCheckpointStorage
original_id: WeightedVoteCheckpointStorage
---

# WeightedVoteCheckpointStorage.sol

View Source: [contracts/modules/Checkpoint/Voting/Transparent/WeightedVoteCheckpointStorage.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/modules/Checkpoint/Voting/Transparent/WeightedVoteCheckpointStorage.sol)

**↘ Derived Contracts:** [**WeightedVoteCheckpoint**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/WeightedVoteCheckpoint.md)**,** [**WeightedVoteCheckpointProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/WeightedVoteCheckpointProxy.md)

**WeightedVoteCheckpointStorage**

## Structs

### Ballot

```javascript
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

```javascript
struct WeightedVoteCheckpointStorage.Ballot[] internal ballots;
```

## Functions

