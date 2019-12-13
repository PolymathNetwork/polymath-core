---
id: version-3.0.0-AdvancedPLCRVotingLib
title: AdvancedPLCRVotingLib
original_id: AdvancedPLCRVotingLib
---

# AdvancedPLCRVotingLib.sol

View Source: [contracts/libraries/AdvancedPLCRVotingLib.sol](../../contracts/libraries/AdvancedPLCRVotingLib.sol)

**AdvancedPLCRVotingLib**

## Contract Members
**Constants & Variables**

```js
uint256 internal constant DEFAULTCHOICE;

```

## Functions

- [getBallotResults(address[] allowedVoters, struct AdvancedPLCRVotingCheckpointStorage.Ballot ballot)](#getballotresults)
- [getExemptedVotersByBallot(address[] investorAtCheckpoint, address[] defaultExemptedVoters, struct AdvancedPLCRVotingCheckpointStorage.Ballot ballot)](#getexemptedvotersbyballot)
- [getPendingInvestorToVote(address[] allowedVoters, struct AdvancedPLCRVotingCheckpointStorage.Ballot ballot)](#getpendinginvestortovote)
- [getCommittedVoteCount(address[] allowedVoters, struct AdvancedPLCRVotingCheckpointStorage.Ballot ballot)](#getcommittedvotecount)
- [getCurrentBallotStage(struct AdvancedPLCRVotingCheckpointStorage.Ballot ballot)](#getcurrentballotstage)
- [_getNoOfChoice(uint256 _noOfChoice)](#_getnoofchoice)

### getBallotResults

Queries the result of a given ballot

```js
function getBallotResults(address[] allowedVoters, struct AdvancedPLCRVotingCheckpointStorage.Ballot ballot) public view
returns(choicesWeighting uint256[], noOfChoicesInProposal uint256[], voters address[])
```

**Returns**

uint256 choicesWeighting

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| allowedVoters | address[] | list of voters those are allowed to vote | 
| ballot | struct AdvancedPLCRVotingCheckpointStorage.Ballot | Details of the given ballot id | 

### getExemptedVotersByBallot

Return the list of the exempted voters list for a given ballotId

```js
function getExemptedVotersByBallot(address[] investorAtCheckpoint, address[] defaultExemptedVoters, struct AdvancedPLCRVotingCheckpointStorage.Ballot ballot) public view
returns(exemptedVoters address[])
```

**Returns**

exemptedVoters List of the exempted voters.

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| investorAtCheckpoint | address[] | Non zero investor at a given checkpoint. | 
| defaultExemptedVoters | address[] | List of addresses which are globally exempted. | 
| ballot | struct AdvancedPLCRVotingCheckpointStorage.Ballot | Details of the ballot | 

### getPendingInvestorToVote

Retrives the list of investors who are remain to vote

```js
function getPendingInvestorToVote(address[] allowedVoters, struct AdvancedPLCRVotingCheckpointStorage.Ballot ballot) public view
returns(pendingInvestors address[])
```

**Returns**

address[] list of invesotrs who are remain to vote

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| allowedVoters | address[] | list of voters those are allowed to vote | 
| ballot | struct AdvancedPLCRVotingCheckpointStorage.Ballot | Details of the given ballot id | 

### getCommittedVoteCount

It will return the no. of the voters who take part in the commit phase of the voting

```js
function getCommittedVoteCount(address[] allowedVoters, struct AdvancedPLCRVotingCheckpointStorage.Ballot ballot) public view
returns(committedVoteCount uint256)
```

**Returns**

committedVoteCount no. of the voters who take part in the commit phase of the voting

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| allowedVoters | address[] | list of voters those are allowed to vote | 
| ballot | struct AdvancedPLCRVotingCheckpointStorage.Ballot | Details of the given ballot id | 

### getCurrentBallotStage

Used to get the current stage of the ballot

```js
function getCurrentBallotStage(struct AdvancedPLCRVotingCheckpointStorage.Ballot ballot) public view
returns(enum AdvancedPLCRVotingCheckpointStorage.Stage)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| ballot | struct AdvancedPLCRVotingCheckpointStorage.Ballot | Details of the given ballot id | 

### _getNoOfChoice

```js
function _getNoOfChoice(uint256 _noOfChoice) internal pure
returns(noOfChoice uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _noOfChoice | uint256 |  | 

