---
id: version-3.0.0-AdvancedPLCRVotingCheckpoint
title: AdvancedPLCRVotingCheckpoint
original_id: AdvancedPLCRVotingCheckpoint
---

# AdvancedPLCRVotingCheckpoint.sol

View Source: [contracts/modules/Checkpoint/Voting/APLCR/AdvancedPLCRVotingCheckpoint.sol](../../contracts/modules/Checkpoint/Voting/APLCR/AdvancedPLCRVotingCheckpoint.sol)

**↗ Extends: [AdvancedPLCRVotingCheckpointStorage](AdvancedPLCRVotingCheckpointStorage.md), [VotingCheckpoint](VotingCheckpoint.md)**

**AdvancedPLCRVotingCheckpoint**

**Events**

```js
event StatutoryBallotCreated(uint256 indexed _ballotId, uint256 indexed _checkpointId, bytes32 indexed _name, uint256  _startTime, uint256  _commitDuration, uint256  _revealDuration, bytes32  _details, uint256  _noOfChoices, string  _proposalTitle, string  _choices);
event CumulativeBallotCreated(uint256 indexed _ballotId, uint256 indexed _checkpointId, bytes32 indexed _name, uint256  _startTime, uint256  _commitDuration, uint256  _revealDuration, bytes32[]  _details, uint256[]  _noOfChoices, string  _proposalTitle, string  _choices);
event VotersExempted(uint256 indexed _ballotId, address[]  _exemptedAddresses);
event VoteCommit(address indexed _voter, uint256  _weight, uint256  _ballotId, bytes32  _secretHash);
event VoteRevealed(address indexed _voter, uint256  _weight, uint256 indexed _ballotId, uint256[]  _choices, uint256  _salt);
event BallotCancelled(uint256 indexed _ballotId);
event ChangedBallotExemptedVotersList(uint256 indexed _ballotId, address  _exemptedAddress, bool  _exempt);
```

## Functions

- [(address _securityToken, address _polyAddress)](#)
- [createStatutoryBallot(bytes32 _name, uint256 _startTime, uint256 _commitDuration, uint256 _revealDuration, string _proposalTitle, bytes32 _details, string _choices, uint256 _noOfChoices)](#createstatutoryballot)
- [createCustomStatutoryBallot(bytes32 _name, uint256 _startTime, uint256 _commitDuration, uint256 _revealDuration, string _proposalTitle, bytes32 _details, string _choices, uint256 _noOfChoices, uint256 _checkpointId)](#createcustomstatutoryballot)
- [_createCustomStatutoryBallot(bytes32 _name, uint256 _startTime, uint256 _commitDuration, uint256 _revealDuration, string _proposalTitle, bytes32 _details, string _choices, uint256 _noOfChoices, uint256 _checkpointId)](#_createcustomstatutoryballot)
- [_addProposal(bytes32 _details, uint256 _noOfChoices, struct AdvancedPLCRVotingCheckpointStorage.Ballot _ballot, uint256 _proposalNo)](#_addproposal)
- [createCustomCumulativeBallot(bytes32 _name, uint256 _startTime, uint256 _commitDuration, uint256 _revealDuration, string _proposalTitles, bytes32[] _details, string _choices, uint256[] _noOfChoices, uint256 _checkpointId)](#createcustomcumulativeballot)
- [createCumulativeBallot(bytes32 _name, uint256 _startTime, uint256 _commitDuration, uint256 _revealDuration, string _proposalTitles, bytes32[] _details, string _choices, uint256[] _noOfChoices)](#createcumulativeballot)
- [_createCustomCumulativeBallot(bytes32 _name, uint256 _startTime, uint256 _commitDuration, uint256 _revealDuration, string _proposalTitles, bytes32[] _details, string _choices, uint256[] _noOfChoices, uint256 _checkpointId)](#_createcustomcumulativeballot)
- [createCustomCumulativeBallotWithExemption(bytes32 _name, uint256 _startTime, uint256 _commitDuration, uint256 _revealDuration, string _proposalTitles, bytes32[] _details, string _choices, uint256[] _noOfChoices, uint256 _checkpointId, address[] _exemptedAddresses)](#createcustomcumulativeballotwithexemption)
- [_addExemptedAddresses(address[] _exemptedAddresses, uint256 _ballotId)](#_addexemptedaddresses)
- [createCumulativeBallotWithExemption(bytes32 _name, uint256 _startTime, uint256 _commitDuration, uint256 _revealDuration, string _proposalTitles, bytes32[] _details, string _choices, uint256[] _noOfChoices, address[] _exemptedAddresses)](#createcumulativeballotwithexemption)
- [createStatutoryBallotWithExemption(bytes32 _name, uint256 _startTime, uint256 _commitDuration, uint256 _revealDuration, string _proposalTitle, bytes32 _details, string _choices, uint256 _noOfChoices, address[] _exemptedAddresses)](#createstatutoryballotwithexemption)
- [createCustomStatutoryBallotWithExemption(bytes32 _name, uint256 _startTime, uint256 _commitDuration, uint256 _revealDuration, string _proposalTitle, bytes32 _details, string _choices, uint256 _noOfChoices, uint256 _checkpointId, address[] _exemptedAddresses)](#createcustomstatutoryballotwithexemption)
- [commitVote(uint256 _ballotId, bytes32 _secretVote)](#commitvote)
- [revealVote(uint256 _ballotId, uint256[] _choices, uint256 _salt)](#revealvote)
- [cancelBallot(uint256 _ballotId)](#cancelballot)
- [changeBallotExemptedVotersList(uint256 _ballotId, address _exemptedAddress, bool _exempt)](#changeballotexemptedvoterslist)
- [changeBallotExemptedVotersListMulti(uint256 _ballotId, address[] _exemptedAddresses, bool[] _exempts)](#changeballotexemptedvoterslistmulti)
- [_changeBallotExemptedVotersList(uint256 _ballotId, address _exemptedAddress, bool _exempt)](#_changeballotexemptedvoterslist)
- [changeDefaultExemptedVotersList(address _voter, bool _exempt)](#changedefaultexemptedvoterslist)
- [changeDefaultExemptedVotersListMulti(address[] _voters, bool[] _exempts)](#changedefaultexemptedvoterslistmulti)
- [_isAnyBallotRunning()](#_isanyballotrunning)
- [getCheckpointData(uint256 _checkpointId)](#getcheckpointdata)
- [getPendingInvestorToVote(uint256 _ballotId)](#getpendinginvestortovote)
- [getCommittedVoteCount(uint256 _ballotId)](#getcommittedvotecount)
- [getAllowedVotersByBallot(uint256 _ballotId)](#getallowedvotersbyballot)
- [getAllBallots()](#getallballots)
- [getExemptedVotersByBallot(uint256 _ballotId)](#getexemptedvotersbyballot)
- [pendingBallots(address _voter)](#pendingballots)
- [getCurrentBallotStage(uint256 _ballotId)](#getcurrentballotstage)
- [getVoteTokenCount(address _voter, uint256 _ballotId)](#getvotetokencount)
- [getBallotResults(uint256 _ballotId)](#getballotresults)
- [getBallotDetails(uint256 _ballotId)](#getballotdetails)
- [getBallotsArrayLength()](#getballotsarraylength)
- [isVoterAllowed(uint256 _ballotId, address _voter)](#isvoterallowed)
- [getInitFunction()](#getinitfunction)
- [getPermissions()](#getpermissions)
- [_getStartTime(uint256 _startTime)](#_getstarttime)
- [_isGreaterThanZero(uint256 _commitDuration, uint256 _revealDuration)](#_isgreaterthanzero)
- [_isEmptyString(string _title)](#_isemptystring)
- [_isValidLength(uint256 _length1, uint256 _length2)](#_isvalidlength)
- [_checkIndexOutOfBound(uint256 _ballotId)](#_checkindexoutofbound)
- [_checkValidStage(uint256 _ballotId, enum AdvancedPLCRVotingCheckpointStorage.Stage _stage)](#_checkvalidstage)
- [_isEmptyBytes32(bytes32 _name)](#_isemptybytes32)
- [_validateMaximumLimitCount()](#_validatemaximumlimitcount)
- [_getNoOfChoice(uint256 _noOfChoice)](#_getnoofchoice)
- [_checkValidCheckpointId(uint256 _checkpointId)](#_checkvalidcheckpointid)

### 

```js
function (address _securityToken, address _polyAddress) public nonpayable Module 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _securityToken | address |  | 
| _polyAddress | address |  | 

### createStatutoryBallot

Use to create the ballot

```js
function createStatutoryBallot(bytes32 _name, uint256 _startTime, uint256 _commitDuration, uint256 _revealDuration, string _proposalTitle, bytes32 _details, string _choices, uint256 _noOfChoices) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _name | bytes32 | Name of the ballot (Should be unique) | 
| _startTime | uint256 | startTime of the ballot | 
| _commitDuration | uint256 | Unix time period till the voters commit their vote | 
| _revealDuration | uint256 | Unix time period till the voters reveal their vote starts when commit duration ends | 
| _proposalTitle | string | Title of proposal | 
| _details | bytes32 | Off-chain details related to the proposal | 
| _choices | string | Choices of proposals | 
| _noOfChoices | uint256 | No. of choices (If it is 0 then it means NAY/YAY ballot type is chosen). | 

### createCustomStatutoryBallot

Use to create the ballot

```js
function createCustomStatutoryBallot(bytes32 _name, uint256 _startTime, uint256 _commitDuration, uint256 _revealDuration, string _proposalTitle, bytes32 _details, string _choices, uint256 _noOfChoices, uint256 _checkpointId) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _name | bytes32 | Name of the ballot (Should be unique) | 
| _startTime | uint256 | startTime of the ballot | 
| _commitDuration | uint256 | Unix time period till the voters commit their vote | 
| _revealDuration | uint256 | Unix time period till the voters reveal their vote starts when commit duration ends | 
| _proposalTitle | string | Title of proposal | 
| _details | bytes32 | Off-chain details related to the proposal | 
| _choices | string | Choices of proposals | 
| _noOfChoices | uint256 | No. of choices (If it is 0 then it means NAY/YAY/ABSTAIN ballot type is chosen). | 
| _checkpointId | uint256 | Valid checkpoint Id | 

### _createCustomStatutoryBallot

```js
function _createCustomStatutoryBallot(bytes32 _name, uint256 _startTime, uint256 _commitDuration, uint256 _revealDuration, string _proposalTitle, bytes32 _details, string _choices, uint256 _noOfChoices, uint256 _checkpointId) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _name | bytes32 |  | 
| _startTime | uint256 |  | 
| _commitDuration | uint256 |  | 
| _revealDuration | uint256 |  | 
| _proposalTitle | string |  | 
| _details | bytes32 |  | 
| _choices | string |  | 
| _noOfChoices | uint256 |  | 
| _checkpointId | uint256 |  | 

### _addProposal

```js
function _addProposal(bytes32 _details, uint256 _noOfChoices, struct AdvancedPLCRVotingCheckpointStorage.Ballot _ballot, uint256 _proposalNo) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _details | bytes32 |  | 
| _noOfChoices | uint256 |  | 
| _ballot | struct AdvancedPLCRVotingCheckpointStorage.Ballot |  | 
| _proposalNo | uint256 |  | 

### createCustomCumulativeBallot

Use to create the ballot

```js
function createCustomCumulativeBallot(bytes32 _name, uint256 _startTime, uint256 _commitDuration, uint256 _revealDuration, string _proposalTitles, bytes32[] _details, string _choices, uint256[] _noOfChoices, uint256 _checkpointId) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _name | bytes32 | Name of the ballot (Should be unique) | 
| _startTime | uint256 | startTime of the ballot | 
| _commitDuration | uint256 | Unix time period till the voters commit their vote | 
| _revealDuration | uint256 | Unix time period till the voters reveal their vote starts when commit duration ends | 
| _proposalTitles | string | Title of proposals (In a comma seperated string) | 
| _details | bytes32[] | Off-chain details related to the proposal | 
| _choices | string | Choices of proposals (In a comma seperated string) | 
| _noOfChoices | uint256[] | Array of No. of choices (If it is 0 then it means NAY/YAY ballot type is chosen). | 
| _checkpointId | uint256 | Valid checkpoint Id | 

### createCumulativeBallot

Use to create the ballot

```js
function createCumulativeBallot(bytes32 _name, uint256 _startTime, uint256 _commitDuration, uint256 _revealDuration, string _proposalTitles, bytes32[] _details, string _choices, uint256[] _noOfChoices) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _name | bytes32 | Name of the ballot (Should be unique) | 
| _startTime | uint256 | startTime of the ballot | 
| _commitDuration | uint256 | Unix time period till the voters commit their vote | 
| _revealDuration | uint256 | Unix time period till the voters reveal their vote starts when commit duration ends | 
| _proposalTitles | string | Title of proposal (In a comma seperated string) | 
| _details | bytes32[] | Off-chain details related to the proposal | 
| _choices | string | Choices of proposals (In a comma seperated string) | 
| _noOfChoices | uint256[] | Array of No. of choices (If it is 0 then it means NAY/YAY ballot type is chosen). | 

### _createCustomCumulativeBallot

```js
function _createCustomCumulativeBallot(bytes32 _name, uint256 _startTime, uint256 _commitDuration, uint256 _revealDuration, string _proposalTitles, bytes32[] _details, string _choices, uint256[] _noOfChoices, uint256 _checkpointId) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _name | bytes32 |  | 
| _startTime | uint256 |  | 
| _commitDuration | uint256 |  | 
| _revealDuration | uint256 |  | 
| _proposalTitles | string |  | 
| _details | bytes32[] |  | 
| _choices | string |  | 
| _noOfChoices | uint256[] |  | 
| _checkpointId | uint256 |  | 

### createCustomCumulativeBallotWithExemption

Use to create the ballot

```js
function createCustomCumulativeBallotWithExemption(bytes32 _name, uint256 _startTime, uint256 _commitDuration, uint256 _revealDuration, string _proposalTitles, bytes32[] _details, string _choices, uint256[] _noOfChoices, uint256 _checkpointId, address[] _exemptedAddresses) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _name | bytes32 | Name of the ballot (Should be unique) | 
| _startTime | uint256 | startTime of the ballot | 
| _commitDuration | uint256 | Unix time period till the voters commit their vote | 
| _revealDuration | uint256 | Unix time period till the voters reveal their vote starts when commit duration ends | 
| _proposalTitles | string | Title of proposal (Comma seperated values) | 
| _details | bytes32[] | Off-chain details related to the proposal | 
| _choices | string | Choices of proposals (Comma seperated values) | 
| _noOfChoices | uint256[] | Array of No. of choices (If it is 0 then it means NAY/YAY ballot type is chosen). | 
| _checkpointId | uint256 | Valid checkpoint Id | 
| _exemptedAddresses | address[] | List of addresses not allowed to vote | 

### _addExemptedAddresses

```js
function _addExemptedAddresses(address[] _exemptedAddresses, uint256 _ballotId) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _exemptedAddresses | address[] |  | 
| _ballotId | uint256 |  | 

### createCumulativeBallotWithExemption

Use to create the ballot

```js
function createCumulativeBallotWithExemption(bytes32 _name, uint256 _startTime, uint256 _commitDuration, uint256 _revealDuration, string _proposalTitles, bytes32[] _details, string _choices, uint256[] _noOfChoices, address[] _exemptedAddresses) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _name | bytes32 | Name of the ballot (Should be unique) | 
| _startTime | uint256 | startTime of the ballot | 
| _commitDuration | uint256 | Unix time period till the voters commit their vote | 
| _revealDuration | uint256 | Unix time period till the voters reveal their vote starts when commit duration ends | 
| _proposalTitles | string | Title of proposal (Comma seperated values) | 
| _details | bytes32[] | Off-chain details related to the proposal | 
| _choices | string | Choices of proposals (Comma seperated values) | 
| _noOfChoices | uint256[] | Array of No. of choices (If it is 0 then it means NAY/YAY ballot type is chosen). | 
| _exemptedAddresses | address[] | List of addresses not allowed to vote | 

### createStatutoryBallotWithExemption

Use to create the ballot

```js
function createStatutoryBallotWithExemption(bytes32 _name, uint256 _startTime, uint256 _commitDuration, uint256 _revealDuration, string _proposalTitle, bytes32 _details, string _choices, uint256 _noOfChoices, address[] _exemptedAddresses) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _name | bytes32 | Name of the ballot (Should be unique) | 
| _startTime | uint256 | startTime of the ballot | 
| _commitDuration | uint256 | Unix time period till the voters commit their vote | 
| _revealDuration | uint256 | Unix time period till the voters reveal their vote starts when commit duration ends | 
| _proposalTitle | string | Title of proposal | 
| _details | bytes32 | Off-chain details related to the proposal | 
| _choices | string | Choices of proposals (Comma seperated values) | 
| _noOfChoices | uint256 | No. of choices (If it is 0 then it means NAY/YAY ballot type is chosen). | 
| _exemptedAddresses | address[] | List of addresses not allowed to vote | 

### createCustomStatutoryBallotWithExemption

Use to create the ballot

```js
function createCustomStatutoryBallotWithExemption(bytes32 _name, uint256 _startTime, uint256 _commitDuration, uint256 _revealDuration, string _proposalTitle, bytes32 _details, string _choices, uint256 _noOfChoices, uint256 _checkpointId, address[] _exemptedAddresses) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _name | bytes32 | Name of the ballot (Should be unique) | 
| _startTime | uint256 | startTime of the ballot | 
| _commitDuration | uint256 | Unix time period till the voters commit their vote | 
| _revealDuration | uint256 | Unix time period till the voters reveal their vote starts when commit duration ends | 
| _proposalTitle | string | Title of proposal | 
| _details | bytes32 | Off-chain details related to the proposal | 
| _choices | string | Choices of proposals (Comma seperated values) | 
| _noOfChoices | uint256 | No. of choices (If it is 0 then it means NAY/YAY ballot type is chosen). | 
| _checkpointId | uint256 | Valid checkpoint Id | 
| _exemptedAddresses | address[] | List of addresses not allowed to vote | 

### commitVote

Used to commit the vote

```js
function commitVote(uint256 _ballotId, bytes32 _secretVote) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _ballotId | uint256 | Given ballot Id | 
| _secretVote | bytes32 | It is secret hash value (hashed offchain) | 

### revealVote

Used to reveal the vote

```js
function revealVote(uint256 _ballotId, uint256[] _choices, uint256 _salt) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _ballotId | uint256 | Given ballot Id | 
| _choices | uint256[] | Choices opt by the voter. | 
| _salt | uint256 | used salt for hashing (unique for each user) | 

### cancelBallot

Allows the token issuer to scrapped down a ballot

```js
function cancelBallot(uint256 _ballotId) external nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _ballotId | uint256 | The index of the target ballot | 

### changeBallotExemptedVotersList

```js
function changeBallotExemptedVotersList(uint256 _ballotId, address _exemptedAddress, bool _exempt) external nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _ballotId | uint256 | Given ballot Id | 
| _exemptedAddress | address | Address of the voter | 
| _exempt | bool | edAddress Address of the voter | 

### changeBallotExemptedVotersListMulti

```js
function changeBallotExemptedVotersListMulti(uint256 _ballotId, address[] _exemptedAddresses, bool[] _exempts) external nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _ballotId | uint256 | Given ballot Id | 
| _exemptedAddresses | address[] | Address of the voters | 
| _exempts | bool[] | Whether it is exempted or not | 

### _changeBallotExemptedVotersList

```js
function _changeBallotExemptedVotersList(uint256 _ballotId, address _exemptedAddress, bool _exempt) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _ballotId | uint256 |  | 
| _exemptedAddress | address |  | 
| _exempt | bool |  | 

### changeDefaultExemptedVotersList

⤾ overrides [VotingCheckpoint.changeDefaultExemptedVotersList](VotingCheckpoint.md#changedefaultexemptedvoterslist)

```js
function changeDefaultExemptedVotersList(address _voter, bool _exempt) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _voter | address | Address of the voter | 
| _exempt | bool | Whether it is exempted or not | 

### changeDefaultExemptedVotersListMulti

⤾ overrides [VotingCheckpoint.changeDefaultExemptedVotersListMulti](VotingCheckpoint.md#changedefaultexemptedvoterslistmulti)

```js
function changeDefaultExemptedVotersListMulti(address[] _voters, bool[] _exempts) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _voters | address[] | Address of the voter | 
| _exempts | bool[] | Whether it is exempted or not | 

### _isAnyBallotRunning

```js
function _isAnyBallotRunning() internal view
returns(isAnyBallotActive bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getCheckpointData

Retrieves list of investors, their balances

```js
function getCheckpointData(uint256 _checkpointId) external view
returns(investors address[], balances uint256[])
```

**Returns**

address[] list of investors

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _checkpointId | uint256 | Checkpoint Id to query for | 

### getPendingInvestorToVote

Retrives the list of investors who are remain to vote

```js
function getPendingInvestorToVote(uint256 _ballotId) external view
returns(pendingInvestors address[])
```

**Returns**

address[] list of invesotrs who are remain to vote

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _ballotId | uint256 | Id of the ballot | 

### getCommittedVoteCount

It will return the no. of the voters who take part in the commit phase of the voting

```js
function getCommittedVoteCount(uint256 _ballotId) public view
returns(committedVoteCount uint256)
```

**Returns**

committedVoteCount no. of the voters who take part in the commit phase of the voting

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _ballotId | uint256 | Targeted ballot index | 

### getAllowedVotersByBallot

Get eligible voters list for the given ballot

```js
function getAllowedVotersByBallot(uint256 _ballotId) public view
returns(voters address[])
```

**Returns**

voters Addresses of the voters

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _ballotId | uint256 |  | 

### getAllBallots

Get the data of all the ballots

```js
function getAllBallots() external view
returns(ballotIds uint256[], names bytes32[], totalProposals uint256[], currentStages enum AdvancedPLCRVotingCheckpointStorage.Stage[], isCancelled bool[])
```

**Returns**

ballotIds Id list of the ballots

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getExemptedVotersByBallot

Return the list of the exempted voters list for a given ballotId

```js
function getExemptedVotersByBallot(uint256 _ballotId) external view
returns(exemptedVoters address[])
```

**Returns**

exemptedVoters List of the exempted voters.

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _ballotId | uint256 | BallotId for which exempted voters are queried. | 

### pendingBallots

Provide the list of ballot in which given address is eligible for vote

```js
function pendingBallots(address _voter) external view
returns(commitBallots uint256[], revealBallots uint256[])
```

**Returns**

ballots list of indexes of ballots on which given voter has to commit

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _voter | address | Ethereum address of the voter | 

### getCurrentBallotStage

Used to get the current stage of the ballot

```js
function getCurrentBallotStage(uint256 _ballotId) public view
returns(enum AdvancedPLCRVotingCheckpointStorage.Stage)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _ballotId | uint256 | Given ballot Id | 

### getVoteTokenCount

Get the voting power for a voter in terms of the token

```js
function getVoteTokenCount(address _voter, uint256 _ballotId) public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _voter | address | Address of the voter (Who will vote). | 
| _ballotId | uint256 | Id of the ballot. | 

### getBallotResults

Queries the result of a given ballot

```js
function getBallotResults(uint256 _ballotId) external view
returns(choicesWeighting uint256[], noOfChoicesInProposal uint256[], voters address[])
```

**Returns**

uint256 choicesWeighting

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _ballotId | uint256 | Id of the target ballot | 

### getBallotDetails

Get the details of the ballot

```js
function getBallotDetails(uint256 _ballotId) public view
returns(name bytes32, totalSupplyAtCheckpoint uint256, checkpointId uint256, startTime uint256, commitDuration uint256, revealDuration uint256, totalProposals uint256, totalVoters uint256, committedVoteCount uint256, isCancelled bool, currentStage enum AdvancedPLCRVotingCheckpointStorage.Stage, proposalDetails bytes32[], proposalChoicesCounts uint256[])
```

**Returns**

name of the ballot

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _ballotId | uint256 | The index of the target ballot | 

### getBallotsArrayLength

Get the length of the ballots array

```js
function getBallotsArrayLength() public view
returns(length uint256)
```

**Returns**

uint256 Length of the ballots array

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### isVoterAllowed

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

### getInitFunction

⤾ overrides [IModule.getInitFunction](IModule.md#getinitfunction)

This function returns the signature of configure function

```js
function getInitFunction() external pure
returns(initFunction bytes4)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getPermissions

⤾ overrides [IModule.getPermissions](IModule.md#getpermissions)

Return the permission flags that are associated with a module

```js
function getPermissions() external view
returns(permissions bytes32[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### _getStartTime

```js
function _getStartTime(uint256 _startTime) internal view
returns(startTime uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _startTime | uint256 |  | 

### _isGreaterThanZero

```js
function _isGreaterThanZero(uint256 _commitDuration, uint256 _revealDuration) internal pure
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _commitDuration | uint256 |  | 
| _revealDuration | uint256 |  | 

### _isEmptyString

```js
function _isEmptyString(string _title) internal pure
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _title | string |  | 

### _isValidLength

```js
function _isValidLength(uint256 _length1, uint256 _length2) internal pure
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _length1 | uint256 |  | 
| _length2 | uint256 |  | 

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
function _checkValidStage(uint256 _ballotId, enum AdvancedPLCRVotingCheckpointStorage.Stage _stage) internal view
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _ballotId | uint256 |  | 
| _stage | enum AdvancedPLCRVotingCheckpointStorage.Stage |  | 

### _isEmptyBytes32

```js
function _isEmptyBytes32(bytes32 _name) internal pure
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _name | bytes32 |  | 

### _validateMaximumLimitCount

```js
function _validateMaximumLimitCount() internal view
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### _getNoOfChoice

```js
function _getNoOfChoice(uint256 _noOfChoice) internal pure
returns(noOfChoice uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _noOfChoice | uint256 |  | 

### _checkValidCheckpointId

```js
function _checkValidCheckpointId(uint256 _checkpointId) internal view
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _checkpointId | uint256 |  | 

