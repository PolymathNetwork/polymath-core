---
id: version-3.0.0-PLCRVotingCheckpoint
title: PLCRVotingCheckpoint
original_id: PLCRVotingCheckpoint
---

# PLCRVotingCheckpoint.sol

View Source: [contracts/modules/Checkpoint/Voting/PLCR/PLCRVotingCheckpoint.sol](../../contracts/modules/Checkpoint/Voting/PLCR/PLCRVotingCheckpoint.sol)

**↗ Extends: [PLCRVotingCheckpointStorage](PLCRVotingCheckpointStorage.md), [VotingCheckpoint](VotingCheckpoint.md)**

**PLCRVotingCheckpoint**

**Events**

```js
event VoteCommit(address indexed _voter, uint256  _weight, uint256 indexed _ballotId, bytes32  _secretVote);
event VoteRevealed(address indexed _voter, uint256  _weight, uint256 indexed _ballotId, uint256  _choiceOfProposal, uint256  _salt, bytes32  _secretVote);
event BallotCreated(uint256 indexed _ballotId, uint256 indexed _checkpointId, uint256  _startTime, uint256  _commitDuration, uint256  _revealDuration, uint256  _noOfProposals, uint256  _quorumPercentage);
event BallotStatusChanged(uint256 indexed _ballotId, bool  _newStatus);
event ChangedBallotExemptedVotersList(uint256 indexed _ballotId, address indexed _voter, bool  _exempt);
```

## Functions

- [(address _securityToken, address _polyAddress)](#)
- [createBallot(uint256 _commitDuration, uint256 _revealDuration, uint256 _noOfProposals, uint256 _quorumPercentage)](#createballot)
- [createCustomBallot(uint256 _commitDuration, uint256 _revealDuration, uint256 _noOfProposals, uint256 _quorumPercentage, uint256 _checkpointId, uint256 _startTime)](#createcustomballot)
- [_createBallotWithCheckpoint(uint256 _commitDuration, uint256 _revealDuration, uint256 _noOfProposals, uint256 _quorumPercentage, uint256 _checkpointId, uint256 _startTime)](#_createballotwithcheckpoint)
- [commitVote(uint256 _ballotId, bytes32 _secretVote)](#commitvote)
- [revealVote(uint256 _ballotId, uint256 _choiceOfProposal, uint256 _salt)](#revealvote)
- [changeBallotExemptedVotersList(uint256 _ballotId, address _voter, bool _exempt)](#changeballotexemptedvoterslist)
- [changeBallotExemptedVotersListMulti(uint256 _ballotId, address[] _voters, bool[] _exempts)](#changeballotexemptedvoterslistmulti)
- [_changeBallotExemptedVotersList(uint256 _ballotId, address _voter, bool _exempt)](#_changeballotexemptedvoterslist)
- [isVoterAllowed(uint256 _ballotId, address _voter)](#isvoterallowed)
- [changeBallotStatus(uint256 _ballotId, bool _isActive)](#changeballotstatus)
- [getCurrentBallotStage(uint256 _ballotId)](#getcurrentballotstage)
- [getBallotResults(uint256 _ballotId)](#getballotresults)
- [getSelectedProposal(uint256 _ballotId, address _voter)](#getselectedproposal)
- [getBallotDetails(uint256 _ballotId)](#getballotdetails)
- [getBallotCommitRevealDuration(uint256 _ballotId)](#getballotcommitrevealduration)
- [getInitFunction()](#getinitfunction)
- [getPermissions()](#getpermissions)
- [_isGreaterThanZero(uint256 _value)](#_isgreaterthanzero)
- [_checkIndexOutOfBound(uint256 _ballotId)](#_checkindexoutofbound)
- [_checkValidStage(uint256 _ballotId, enum PLCRVotingCheckpointStorage.Stage _stage)](#_checkvalidstage)

### 

```js
function (address _securityToken, address _polyAddress) public nonpayable Module 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _securityToken | address |  | 
| _polyAddress | address |  | 

### createBallot

Used to create the ballot

```js
function createBallot(uint256 _commitDuration, uint256 _revealDuration, uint256 _noOfProposals, uint256 _quorumPercentage) external nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _commitDuration | uint256 | Unix time period until the voters commit their vote | 
| _revealDuration | uint256 | Unix time period until the voters reveal their vote. Starts when commit period ends | 
| _noOfProposals | uint256 | Total number of proposals used in the ballot. In general it is two (For & Against) | 
| _quorumPercentage | uint256 | Minimum number of weighted vote percentage required to win a election. | 

### createCustomBallot

Used to create the ballot

```js
function createCustomBallot(uint256 _commitDuration, uint256 _revealDuration, uint256 _noOfProposals, uint256 _quorumPercentage, uint256 _checkpointId, uint256 _startTime) external nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _commitDuration | uint256 | Unix time period until the voters commit their vote | 
| _revealDuration | uint256 | Unix time period until the voters reveal their vote. Starts when commit period ends | 
| _noOfProposals | uint256 | Total number of proposal used in the ballot. In general it is two (For & Against) | 
| _quorumPercentage | uint256 | Minimum number of weighted vote percentage required to win a election. | 
| _checkpointId | uint256 | Valid checkpoint Id | 
| _startTime | uint256 | startTime of the ballot | 

### _createBallotWithCheckpoint

```js
function _createBallotWithCheckpoint(uint256 _commitDuration, uint256 _revealDuration, uint256 _noOfProposals, uint256 _quorumPercentage, uint256 _checkpointId, uint256 _startTime) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _commitDuration | uint256 |  | 
| _revealDuration | uint256 |  | 
| _noOfProposals | uint256 |  | 
| _quorumPercentage | uint256 |  | 
| _checkpointId | uint256 |  | 
| _startTime | uint256 |  | 

### commitVote

Used to commit the vote

```js
function commitVote(uint256 _ballotId, bytes32 _secretVote) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _ballotId | uint256 | Given ballot Id | 
| _secretVote | bytes32 | The secret hash value (hashed offchain) | 

### revealVote

Used to reveal the vote

```js
function revealVote(uint256 _ballotId, uint256 _choiceOfProposal, uint256 _salt) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _ballotId | uint256 | Given ballot Id | 
| _choiceOfProposal | uint256 | Proposal chosen by the voter. It varies from (1 to totalProposals) | 
| _salt | uint256 | Used salt for hashing (unique for each user) | 

### changeBallotExemptedVotersList

Change the given ballot exempted list

```js
function changeBallotExemptedVotersList(uint256 _ballotId, address _voter, bool _exempt) external nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _ballotId | uint256 | Given ballot Id | 
| _voter | address | Address of the voter | 
| _exempt | bool | Whether it is exempted or not | 

### changeBallotExemptedVotersListMulti

Change the given ballot exempted list (Multi)

```js
function changeBallotExemptedVotersListMulti(uint256 _ballotId, address[] _voters, bool[] _exempts) external nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _ballotId | uint256 | Given ballot Id | 
| _voters | address[] | Address of the voter | 
| _exempts | bool[] | Whether it is exempted or not | 

### _changeBallotExemptedVotersList

```js
function _changeBallotExemptedVotersList(uint256 _ballotId, address _voter, bool _exempt) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _ballotId | uint256 |  | 
| _voter | address |  | 
| _exempt | bool |  | 

### isVoterAllowed

Used to check whether the voter is allowed to vote or not

```js
function isVoterAllowed(uint256 _ballotId, address _voter) public view
returns(bool)
```

**Returns**

bool

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _ballotId | uint256 | The index of the target ballot | 
| _voter | address | Address of the voter | 

### changeBallotStatus

⤾ overrides [IVoting.changeBallotStatus](IVoting.md#changeballotstatus)

Allows the token issuer to set the status of a ballot to active or not

```js
function changeBallotStatus(uint256 _ballotId, bool _isActive) external nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _ballotId | uint256 | The index of the target ballot | 
| _isActive | bool | The bool value of the status of the ballot (active true or false) | 

### getCurrentBallotStage

Used to get the current stage of the ballot

```js
function getCurrentBallotStage(uint256 _ballotId) public view
returns(enum PLCRVotingCheckpointStorage.Stage)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _ballotId | uint256 | Given ballot Id | 

### getBallotResults

⤾ overrides [IVoting.getBallotResults](IVoting.md#getballotresults)

Queries the result of a given ballot

```js
function getBallotResults(uint256 _ballotId) external view
returns(voteWeighting uint256[], tieWith uint256[], winningProposal uint256, isVotingSucceed bool, totalVotes uint256)
```

**Returns**

uint256 voteWeighting

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _ballotId | uint256 | Id of the target ballot | 

### getSelectedProposal

⤾ overrides [IVoting.getSelectedProposal](IVoting.md#getselectedproposal)

Get the voted proposal

```js
function getSelectedProposal(uint256 _ballotId, address _voter) external view
returns(proposalId uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _ballotId | uint256 | Id of the ballot | 
| _voter | address | Address of the voter | 

### getBallotDetails

⤾ overrides [IVoting.getBallotDetails](IVoting.md#getballotdetails)

Get the details of the ballot

```js
function getBallotDetails(uint256 _ballotId) external view
returns(uint256, uint256, uint256, uint256, uint256, uint256, uint256, bool)
```

**Returns**

uint256 quorum

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _ballotId | uint256 | The index of the target ballot | 

### getBallotCommitRevealDuration

Return the commit reveal time duration of ballot

```js
function getBallotCommitRevealDuration(uint256 _ballotId) external view
returns(uint256, uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _ballotId | uint256 | Id of the ballot | 

### getInitFunction

⤾ overrides [IModule.getInitFunction](IModule.md#getinitfunction)

Returns the signature of the configure function

```js
function getInitFunction() external pure
returns(bytes4)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getPermissions

⤾ overrides [IModule.getPermissions](IModule.md#getpermissions)

Returns the permissions flag that are associated with the module

```js
function getPermissions() external view
returns(bytes32[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### _isGreaterThanZero

```js
function _isGreaterThanZero(uint256 _value) internal pure
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _value | uint256 |  | 

### _checkIndexOutOfBound

```js
function _checkIndexOutOfBound(uint256 _ballotId) internal view
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _ballotId | uint256 |  | 

### _checkValidStage

```js
function _checkValidStage(uint256 _ballotId, enum PLCRVotingCheckpointStorage.Stage _stage) internal view
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _ballotId | uint256 |  | 
| _stage | enum PLCRVotingCheckpointStorage.Stage |  | 

