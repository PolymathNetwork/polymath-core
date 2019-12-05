---
id: version-3.0.0-WeightedVoteCheckpoint
title: WeightedVoteCheckpoint
original_id: WeightedVoteCheckpoint
---

# Checkpoint module for token weighted vote \(WeightedVoteCheckpoint.sol\)

View Source: [contracts/modules/Checkpoint/Voting/Transparent/WeightedVoteCheckpoint.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/modules/Checkpoint/Voting/Transparent/WeightedVoteCheckpoint.sol)

**↗ Extends:** [**WeightedVoteCheckpointStorage**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/WeightedVoteCheckpointStorage.md)**,** [**VotingCheckpoint**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/VotingCheckpoint.md)

**WeightedVoteCheckpoint**

This voting system uses public votes

**Events**

```javascript
event BallotCreated(uint256 indexed _ballotId, uint256 indexed _checkpointId, uint256  _startTime, uint256  _endTime, uint256  _noOfProposals, uint256  _quorumPercentage);
event VoteCast(address indexed _voter, uint256  _weight, uint256 indexed _ballotId, uint256 indexed _proposalId);
event BallotStatusChanged(uint256 indexed _ballotId, bool  _isActive);
event ChangedBallotExemptedVotersList(uint256 indexed _ballotId, address indexed _voter, bool  _exempt);
```

## Functions

* [\(address \_securityToken, address \_polyToken\)](weightedvotecheckpoint.md)
* [getInitFunction\(\)](weightedvotecheckpoint.md#getinitfunction)
* [createBallot\(uint256 \_duration, uint256 \_noOfProposals, uint256 \_quorumPercentage\)](weightedvotecheckpoint.md#createballot)
* [\_createCustomBallot\(uint256 \_checkpointId, uint256 \_quorumPercentage, uint256 \_startTime, uint256 \_endTime, uint256 \_noOfProposals\)](weightedvotecheckpoint.md#_createcustomballot)
* [createCustomBallot\(uint256 \_checkpointId, uint256 \_quorumPercentage, uint256 \_startTime, uint256 \_endTime, uint256 \_noOfProposals\)](weightedvotecheckpoint.md#createcustomballot)
* [castVote\(uint256 \_ballotId, uint256 \_proposalId\)](weightedvotecheckpoint.md#castvote)
* [changeBallotExemptedVotersList\(uint256 \_ballotId, address \_voter, bool \_exempt\)](weightedvotecheckpoint.md#changeballotexemptedvoterslist)
* [changeBallotExemptedVotersListMulti\(uint256 \_ballotId, address\[\] \_voters, bool\[\] \_exempts\)](weightedvotecheckpoint.md#changeballotexemptedvoterslistmulti)
* [\_changeBallotExemptedVotersList\(uint256 \_ballotId, address \_voter, bool \_exempt\)](weightedvotecheckpoint.md#_changeballotexemptedvoterslist)
* [isVoterAllowed\(uint256 \_ballotId, address \_voter\)](weightedvotecheckpoint.md#isvoterallowed)
* [changeBallotStatus\(uint256 \_ballotId, bool \_isActive\)](weightedvotecheckpoint.md#changeballotstatus)
* [getBallotResults\(uint256 \_ballotId\)](weightedvotecheckpoint.md#getballotresults)
* [getSelectedProposal\(uint256 \_ballotId, address \_voter\)](weightedvotecheckpoint.md#getselectedproposal)
* [getBallotDetails\(uint256 \_ballotId\)](weightedvotecheckpoint.md#getballotdetails)
* [getPermissions\(\)](weightedvotecheckpoint.md#getpermissions)
* [\_checkIndexOutOfBound\(uint256 \_ballotId\)](weightedvotecheckpoint.md#_checkindexoutofbound)

Constructor

```javascript
function (address _securityToken, address _polyToken) public nonpayable Module
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_securityToken | address | Address of the security token |
| \_polyToken | address | Address of the polytoken |

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


### createBallot

Allows the token issuer to create a ballot

```javascript
function createBallot(uint256 _duration, uint256 _noOfProposals, uint256 _quorumPercentage) external nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_duration | uint256 | The duration of the voting period in seconds |
| \_noOfProposals | uint256 | Number of proposals |
| \_quorumPercentage | uint256 | Minimum Quorum  percentage required to make a proposal won |

### \_createCustomBallot

```javascript
function _createCustomBallot(uint256 _checkpointId, uint256 _quorumPercentage, uint256 _startTime, uint256 _endTime, uint256 _noOfProposals) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_checkpointId | uint256 |  |
| \_quorumPercentage | uint256 |  |
| \_startTime | uint256 |  |
| \_endTime | uint256 |  |
| \_noOfProposals | uint256 |  |

### createCustomBallot

Allows the token issuer to create a ballot with custom settings

```javascript
function createCustomBallot(uint256 _checkpointId, uint256 _quorumPercentage, uint256 _startTime, uint256 _endTime, uint256 _noOfProposals) external nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_checkpointId | uint256 | Index of the checkpoint to use for token balances |
| \_quorumPercentage | uint256 | Minimum Quorum  percentage required to make a proposal won |
| \_startTime | uint256 | Start time of the voting period in Unix Epoch time |
| \_endTime | uint256 | End time of the voting period in Unix Epoch time |
| \_noOfProposals | uint256 | Number of proposals |

### castVote

Allows a token holder to cast their vote on a specific ballot

```javascript
function castVote(uint256 _ballotId, uint256 _proposalId) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_ballotId | uint256 | The index of the target ballot |
| \_proposalId | uint256 | Id of the proposal which investor want to vote for proposal |

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

**Returns**

bool success

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_ballotId | uint256 | The index of the target ballot |
| \_isActive | bool | The bool value of the active stats of the ballot |

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

### getPermissions

⤾ overrides [IModule.getPermissions](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModule.md#getpermissions)

Return the permissions flag that are associated with STO

```javascript
function getPermissions() public view
returns(bytes32[])
```

**Returns**

bytes32 array

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### \_checkIndexOutOfBound

```javascript
function _checkIndexOutOfBound(uint256 _ballotId) internal view
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_ballotId | uint256 |  |

