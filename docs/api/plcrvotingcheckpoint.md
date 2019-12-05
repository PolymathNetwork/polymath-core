---
id: version-3.0.0-PLCRVotingCheckpoint
title: PLCRVotingCheckpoint
original_id: PLCRVotingCheckpoint
---

# PLCRVotingCheckpoint.sol

View Source: [contracts/modules/Checkpoint/Voting/PLCR/PLCRVotingCheckpoint.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/modules/Checkpoint/Voting/PLCR/PLCRVotingCheckpoint.sol)

**↗ Extends:** [**PLCRVotingCheckpointStorage**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/PLCRVotingCheckpointStorage.md)**,** [**VotingCheckpoint**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/VotingCheckpoint.md)

**PLCRVotingCheckpoint**

**Events**

```javascript
event VoteCommit(address indexed _voter, uint256  _weight, uint256 indexed _ballotId, bytes32  _secretVote);
event VoteRevealed(address indexed _voter, uint256  _weight, uint256 indexed _ballotId, uint256  _choiceOfProposal, uint256  _salt, bytes32  _secretVote);
event BallotCreated(uint256 indexed _ballotId, uint256 indexed _checkpointId, uint256  _startTime, uint256  _commitDuration, uint256  _revealDuration, uint256  _noOfProposals, uint256  _quorumPercentage);
event BallotStatusChanged(uint256 indexed _ballotId, bool  _newStatus);
event ChangedBallotExemptedVotersList(uint256 indexed _ballotId, address indexed _voter, bool  _exempt);
```

## Functions

* [\(address \_securityToken, address \_polyAddress\)](plcrvotingcheckpoint.md)
* [createBallot\(uint256 \_commitDuration, uint256 \_revealDuration, uint256 \_noOfProposals, uint256 \_quorumPercentage\)](plcrvotingcheckpoint.md#createballot)
* [createCustomBallot\(uint256 \_commitDuration, uint256 \_revealDuration, uint256 \_noOfProposals, uint256 \_quorumPercentage, uint256 \_checkpointId, uint256 \_startTime\)](plcrvotingcheckpoint.md#createcustomballot)
* [\_createBallotWithCheckpoint\(uint256 \_commitDuration, uint256 \_revealDuration, uint256 \_noOfProposals, uint256 \_quorumPercentage, uint256 \_checkpointId, uint256 \_startTime\)](plcrvotingcheckpoint.md#_createballotwithcheckpoint)
* [commitVote\(uint256 \_ballotId, bytes32 \_secretVote\)](plcrvotingcheckpoint.md#commitvote)
* [revealVote\(uint256 \_ballotId, uint256 \_choiceOfProposal, uint256 \_salt\)](plcrvotingcheckpoint.md#revealvote)
* [changeBallotExemptedVotersList\(uint256 \_ballotId, address \_voter, bool \_exempt\)](plcrvotingcheckpoint.md#changeballotexemptedvoterslist)
* [changeBallotExemptedVotersListMulti\(uint256 \_ballotId, address\[\] \_voters, bool\[\] \_exempts\)](plcrvotingcheckpoint.md#changeballotexemptedvoterslistmulti)
* [\_changeBallotExemptedVotersList\(uint256 \_ballotId, address \_voter, bool \_exempt\)](plcrvotingcheckpoint.md#_changeballotexemptedvoterslist)
* [isVoterAllowed\(uint256 \_ballotId, address \_voter\)](plcrvotingcheckpoint.md#isvoterallowed)
* [changeBallotStatus\(uint256 \_ballotId, bool \_isActive\)](plcrvotingcheckpoint.md#changeballotstatus)
* [getCurrentBallotStage\(uint256 \_ballotId\)](plcrvotingcheckpoint.md#getcurrentballotstage)
* [getBallotResults\(uint256 \_ballotId\)](plcrvotingcheckpoint.md#getballotresults)
* [getSelectedProposal\(uint256 \_ballotId, address \_voter\)](plcrvotingcheckpoint.md#getselectedproposal)
* [getBallotDetails\(uint256 \_ballotId\)](plcrvotingcheckpoint.md#getballotdetails)
* [getBallotCommitRevealDuration\(uint256 \_ballotId\)](plcrvotingcheckpoint.md#getballotcommitrevealduration)
* [getInitFunction\(\)](plcrvotingcheckpoint.md#getinitfunction)
* [getPermissions\(\)](plcrvotingcheckpoint.md#getpermissions)
* [\_isGreaterThanZero\(uint256 \_value\)](plcrvotingcheckpoint.md#_isgreaterthanzero)
* [\_checkIndexOutOfBound\(uint256 \_ballotId\)](plcrvotingcheckpoint.md#_checkindexoutofbound)
* [\_checkValidStage\(uint256 \_ballotId, enum PLCRVotingCheckpointStorage.Stage \_stage\)](plcrvotingcheckpoint.md#_checkvalidstage)

```javascript
function (address _securityToken, address _polyAddress) public nonpayable Module
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_securityToken | address |  |
| \_polyAddress | address |  |

### createBallot

Use to create the ballot

```javascript
function createBallot(uint256 _commitDuration, uint256 _revealDuration, uint256 _noOfProposals, uint256 _quorumPercentage) external nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_commitDuration | uint256 | Unix time period till the voters commit there vote |
| \_revealDuration | uint256 | Unix time period till the voters reveal there vote starts when commit duration ends |
| \_noOfProposals | uint256 | Total number of proposal used in the ballot. In general it is 2 \(For & Against\) |
| \_quorumPercentage | uint256 | Minimum number of weight vote percentage requires to win a election. |

### createCustomBallot

Use to create the ballot

```javascript
function createCustomBallot(uint256 _commitDuration, uint256 _revealDuration, uint256 _noOfProposals, uint256 _quorumPercentage, uint256 _checkpointId, uint256 _startTime) external nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_commitDuration | uint256 | Unix time period till the voters commit there vote |
| \_revealDuration | uint256 | Unix time period till the voters reveal there vote starts when commit duration ends |
| \_noOfProposals | uint256 | Total number of proposal used in the ballot. In general it is 2 \(For & Against\) |
| \_quorumPercentage | uint256 | Minimum number of weight vote percentage requires to win a election. |
| \_checkpointId | uint256 | Valid checkpoint Id |
| \_startTime | uint256 | startTime of the ballot |

### \_createBallotWithCheckpoint

```javascript
function _createBallotWithCheckpoint(uint256 _commitDuration, uint256 _revealDuration, uint256 _noOfProposals, uint256 _quorumPercentage, uint256 _checkpointId, uint256 _startTime) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_commitDuration | uint256 |  |
| \_revealDuration | uint256 |  |
| \_noOfProposals | uint256 |  |
| \_quorumPercentage | uint256 |  |
| \_checkpointId | uint256 |  |
| \_startTime | uint256 |  |

### commitVote

Used to commit the vote

```javascript
function commitVote(uint256 _ballotId, bytes32 _secretVote) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_ballotId | uint256 | Given ballot Id |
| \_secretVote | bytes32 | It is secret hash value \(hashed offchain\) |

### revealVote

Used to reveal the vote

```javascript
function revealVote(uint256 _ballotId, uint256 _choiceOfProposal, uint256 _salt) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_ballotId | uint256 | Given ballot Id |
| \_choiceOfProposal | uint256 | Proposal chossed by the voter. It varies from \(1 to totalProposals\) |
| \_salt | uint256 | used salt for hashing \(unique for each user\) |

### changeBallotExemptedVotersList

```javascript
function changeBallotExemptedVotersList(uint256 _ballotId, address _voter, bool _exempt) external nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_ballotId | uint256 | Given ballot Id |
| \_voter | address | Address of the voter |
| \_exempt | bool | Whether it is exempted or not |

### changeBallotExemptedVotersListMulti

```javascript
function changeBallotExemptedVotersListMulti(uint256 _ballotId, address[] _voters, bool[] _exempts) external nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_ballotId | uint256 | Given ballot Id |
| \_voters | address\[\] | Address of the voter |
| \_exempts | bool\[\] | Whether it is exempted or not |

### \_changeBallotExemptedVotersList

```javascript
function _changeBallotExemptedVotersList(uint256 _ballotId, address _voter, bool _exempt) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_ballotId | uint256 |  |
| \_voter | address |  |
| \_exempt | bool |  |

### isVoterAllowed

```javascript
function isVoterAllowed(uint256 _ballotId, address _voter) public view
returns(bool)
```

**Returns**

bool

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_ballotId | uint256 | The index of the target ballot |
| \_voter | address | Address of the voter |

### changeBallotStatus

⤾ overrides [IVoting.changeBallotStatus](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IVoting.md#changeballotstatus)

Allows the token issuer to set the active stats of a ballot

```javascript
function changeBallotStatus(uint256 _ballotId, bool _isActive) external nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_ballotId | uint256 | The index of the target ballot |
| \_isActive | bool | The bool value of the active stats of the ballot |

### getCurrentBallotStage

Used to get the current stage of the ballot

```javascript
function getCurrentBallotStage(uint256 _ballotId) public view
returns(enum PLCRVotingCheckpointStorage.Stage)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_ballotId | uint256 | Given ballot Id |

### getBallotResults

⤾ overrides [IVoting.getBallotResults](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IVoting.md#getballotresults)

Queries the result of a given ballot

```javascript
function getBallotResults(uint256 _ballotId) external view
returns(voteWeighting uint256[], tieWith uint256[], winningProposal uint256, isVotingSucceed bool, totalVotes uint256)
```

**Returns**

uint256 voteWeighting

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_ballotId | uint256 | Id of the target ballot |

### getSelectedProposal

⤾ overrides [IVoting.getSelectedProposal](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IVoting.md#getselectedproposal)

Get the voted proposal

```javascript
function getSelectedProposal(uint256 _ballotId, address _voter) external view
returns(proposalId uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_ballotId | uint256 | Id of the ballot |
| \_voter | address | Address of the voter |

### getBallotDetails

⤾ overrides [IVoting.getBallotDetails](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IVoting.md#getballotdetails)

Get the details of the ballot

```javascript
function getBallotDetails(uint256 _ballotId) external view
returns(uint256, uint256, uint256, uint256, uint256, uint256, uint256, bool)
```

**Returns**

uint256 quorum

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_ballotId | uint256 | The index of the target ballot |

### getBallotCommitRevealDuration

```javascript
function getBallotCommitRevealDuration(uint256 _ballotId) external view
returns(uint256, uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_ballotId | uint256 | Id of a ballot |

### getInitFunction

⤾ overrides [IModule.getInitFunction](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModule.md#getinitfunction)

This function returns the signature of configure function

```javascript
function getInitFunction() external pure
returns(bytes4)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### getPermissions

⤾ overrides [IModule.getPermissions](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModule.md#getpermissions)

Return the permissions flag that are associated with CountTransferManager

```javascript
function getPermissions() external view
returns(bytes32[])
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### \_isGreaterThanZero

```javascript
function _isGreaterThanZero(uint256 _value) internal pure
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_value | uint256 |  |

### \_checkIndexOutOfBound

```javascript
function _checkIndexOutOfBound(uint256 _ballotId) internal view
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_ballotId | uint256 |  |

### \_checkValidStage

```javascript
function _checkValidStage(uint256 _ballotId, enum PLCRVotingCheckpointStorage.Stage _stage) internal view
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_ballotId | uint256 |  |
| \_stage | enum PLCRVotingCheckpointStorage.Stage |  |

