---
id: version-3.0.0-AdvancedPLCRVotingCheckpointStorage
title: AdvancedPLCRVotingCheckpointStorage
original_id: AdvancedPLCRVotingCheckpointStorage
---

# AdvancedPLCRVotingCheckpointStorage.sol

View Source: [contracts/modules/Checkpoint/Voting/APLCR/AdvancedPLCRVotingCheckpointStorage.sol](../../contracts/modules/Checkpoint/Voting/APLCR/AdvancedPLCRVotingCheckpointStorage.sol)

**↘ Derived Contracts: [AdvancedPLCRVotingCheckpoint](AdvancedPLCRVotingCheckpoint.md), [AdvancedPLCRVotingCheckpointProxy](AdvancedPLCRVotingCheckpointProxy.md)**

**AdvancedPLCRVotingCheckpointStorage**

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
 uint64 commitDuration,
 uint64 revealDuration,
 uint64 startTime,
 uint24 totalProposals,
 uint32 totalVoters,
 bool isCancelled,
 bytes32 name,
 mapping(uint256 => struct AdvancedPLCRVotingCheckpointStorage.Proposal) proposals,
 mapping(address => struct AdvancedPLCRVotingCheckpointStorage.Vote) voteDetails,
 mapping(address => bool) exemptedVoters
}
```

### Proposal

```js
struct Proposal {
 bytes32 details,
 uint256 noOfChoices
}
```

### Vote

```js
struct Vote {
 bytes32 secretVote,
 mapping(uint256 => uint256[]) voteOptions
}
```

## Contract Members
**Constants & Variables**

```js
uint256 internal constant DEFAULTCHOICE;
uint256 internal constant MAXLIMIT;
struct AdvancedPLCRVotingCheckpointStorage.Ballot[] internal ballots;

```

## Functions

