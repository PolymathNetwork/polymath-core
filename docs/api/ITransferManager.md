---
id: version-3.0.0-ITransferManager
title: ITransferManager
original_id: ITransferManager
---

# Interface to be implemented by all Transfer Manager modules (ITransferManager.sol)

View Source: [contracts/modules/TransferManager/ITransferManager.sol](../../contracts/modules/TransferManager/ITransferManager.sol)

**↗ Extends: [Module](Module.md), [Pausable](Pausable.md)**
**↘ Derived Contracts: [BlacklistTransferManager](BlacklistTransferManager.md), [CountTransferManager](CountTransferManager.md), [GeneralTransferManager](GeneralTransferManager.md), [LockUpTransferManager](LockUpTransferManager.md), [ManualApprovalTransferManager](ManualApprovalTransferManager.md), [PercentageTransferManager](PercentageTransferManager.md), [RestrictedPartialSaleTM](RestrictedPartialSaleTM.md), [ScheduledCheckpoint](ScheduledCheckpoint.md), [VolumeRestrictionTM](VolumeRestrictionTM.md)**

**ITransferManager**

abstract contract

**Enums**
### Result

```js
enum Result {
 INVALID,
 NA,
 VALID,
 FORCE_VALID
}
```

## Functions

- [verifyTransfer(address _from, address _to, uint256 _amount, bytes _data, bool _isTransfer)](#verifytransfer)
- [unpause()](#unpause)
- [pause()](#pause)

### verifyTransfer

⤿ Overridden Implementation(s): [BlacklistTransferManager.verifyTransfer](BlacklistTransferManager.md#verifytransfer),[CountTransferManager.verifyTransfer](CountTransferManager.md#verifytransfer),[GeneralTransferManager.verifyTransfer](GeneralTransferManager.md#verifytransfer),[LockUpTransferManager.verifyTransfer](LockUpTransferManager.md#verifytransfer),[ManualApprovalTransferManager.verifyTransfer](ManualApprovalTransferManager.md#verifytransfer),[PercentageTransferManager.verifyTransfer](PercentageTransferManager.md#verifytransfer),[RestrictedPartialSaleTM.verifyTransfer](RestrictedPartialSaleTM.md#verifytransfer),[ScheduledCheckpoint.verifyTransfer](ScheduledCheckpoint.md#verifytransfer),[VolumeRestrictionTM.verifyTransfer](VolumeRestrictionTM.md#verifytransfer)

```js
function verifyTransfer(address _from, address _to, uint256 _amount, bytes _data, bool _isTransfer) public nonpayable
returns(enum ITransferManager.Result)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address |  | 
| _to | address |  | 
| _amount | uint256 |  | 
| _data | bytes |  | 
| _isTransfer | bool |  | 

### unpause

```js
function unpause() public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### pause

```js
function pause() public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

