---
id: version-3.0.0-VotingCheckpoint
title: VotingCheckpoint
original_id: VotingCheckpoint
---

# VotingCheckpoint.sol

View Source: [contracts/modules/Checkpoint/Voting/VotingCheckpoint.sol](../../contracts/modules/Checkpoint/Voting/VotingCheckpoint.sol)

**↗ Extends: [VotingCheckpointStorage](VotingCheckpointStorage.md), [ICheckpoint](ICheckpoint.md), [IVoting](IVoting.md), [Module](Module.md)**
**↘ Derived Contracts: [AdvancedPLCRVotingCheckpoint](AdvancedPLCRVotingCheckpoint.md), [PLCRVotingCheckpoint](PLCRVotingCheckpoint.md), [WeightedVoteCheckpoint](WeightedVoteCheckpoint.md)**

**VotingCheckpoint**

**Events**

```js
event ChangedDefaultExemptedVotersList(address indexed _voter, bool  _exempt);
```

## Functions

- [changeDefaultExemptedVotersList(address _voter, bool _exempt)](#changedefaultexemptedvoterslist)
- [changeDefaultExemptedVotersListMulti(address[] _voters, bool[] _exempts)](#changedefaultexemptedvoterslistmulti)
- [_changeDefaultExemptedVotersList(address _voter, bool _exempt)](#_changedefaultexemptedvoterslist)
- [getDefaultExemptionVotersList()](#getdefaultexemptionvoterslist)

### changeDefaultExemptedVotersList

⤿ Overridden Implementation(s): [AdvancedPLCRVotingCheckpoint.changeDefaultExemptedVotersList](AdvancedPLCRVotingCheckpoint.md#changedefaultexemptedvoterslist)

```js
function changeDefaultExemptedVotersList(address _voter, bool _exempt) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _voter | address | Address of the voter | 
| _exempt | bool | Whether it is exempted or not | 

### changeDefaultExemptedVotersListMulti

⤿ Overridden Implementation(s): [AdvancedPLCRVotingCheckpoint.changeDefaultExemptedVotersListMulti](AdvancedPLCRVotingCheckpoint.md#changedefaultexemptedvoterslistmulti)

```js
function changeDefaultExemptedVotersListMulti(address[] _voters, bool[] _exempts) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _voters | address[] | Address of the voter | 
| _exempts | bool[] | Whether it is exempted or not | 

### _changeDefaultExemptedVotersList

```js
function _changeDefaultExemptedVotersList(address _voter, bool _exempt) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _voter | address |  | 
| _exempt | bool |  | 

### getDefaultExemptionVotersList

```js
function getDefaultExemptionVotersList() external view
returns(address[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

