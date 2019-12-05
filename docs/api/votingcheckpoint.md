---
id: version-3.0.0-VotingCheckpoint
title: VotingCheckpoint
original_id: VotingCheckpoint
---

# VotingCheckpoint.sol

View Source: [contracts/modules/Checkpoint/Voting/VotingCheckpoint.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/modules/Checkpoint/Voting/VotingCheckpoint.sol)

**↗ Extends:** [**VotingCheckpointStorage**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/VotingCheckpointStorage.md)**,** [**ICheckpoint**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ICheckpoint.md)**,** [**IVoting**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IVoting.md)**,** [**Module**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/Module.md) **↘ Derived Contracts:** [**PLCRVotingCheckpoint**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/PLCRVotingCheckpoint.md)**,** [**WeightedVoteCheckpoint**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/WeightedVoteCheckpoint.md)

**VotingCheckpoint**

**Events**

```javascript
event ChangedDefaultExemptedVotersList(address indexed _voter, bool  _exempt);
```

## Functions

* [changeDefaultExemptedVotersList\(address \_voter, bool \_exempt\)](votingcheckpoint.md#changedefaultexemptedvoterslist)
* [changeDefaultExemptedVotersListMulti\(address\[\] \_voters, bool\[\] \_exempts\)](votingcheckpoint.md#changedefaultexemptedvoterslistmulti)
* [\_changeDefaultExemptedVotersList\(address \_voter, bool \_exempt\)](votingcheckpoint.md#_changedefaultexemptedvoterslist)
* [getDefaultExemptionVotersList\(\)](votingcheckpoint.md#getdefaultexemptionvoterslist)

### changeDefaultExemptedVotersList

```javascript
function changeDefaultExemptedVotersList(address _voter, bool _exempt) external nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_voter | address | Address of the voter |
| \_exempt | bool | Whether it is exempted or not |

### changeDefaultExemptedVotersListMulti

```javascript
function changeDefaultExemptedVotersListMulti(address[] _voters, bool[] _exempts) external nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_voters | address\[\] | Address of the voter |
| \_exempts | bool\[\] | Whether it is exempted or not |

### \_changeDefaultExemptedVotersList

```javascript
function _changeDefaultExemptedVotersList(address _voter, bool _exempt) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_voter | address |  |
| \_exempt | bool |  |

### getDefaultExemptionVotersList

```javascript
function getDefaultExemptionVotersList() external view
returns(address[])
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


