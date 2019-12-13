---
id: version-3.0.0-ITransferManager
title: ITransferManager
original_id: ITransferManager
---

# Interface to be implemented by all Transfer Manager modules (ITransferManager.sol)

View Source: [contracts/interfaces/ITransferManager.sol](../../contracts/interfaces/ITransferManager.sol)

**↘ Derived Contracts: [TransferManager](TransferManager.md)**

**ITransferManager**

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

- [executeTransfer(address _from, address _to, uint256 _amount, bytes _data)](#executetransfer)
- [verifyTransfer(address _from, address _to, uint256 _amount, bytes _data)](#verifytransfer)
- [getTokensByPartition(bytes32 _partition, address _tokenHolder, uint256 _additionalBalance)](#gettokensbypartition)

### executeTransfer

⤿ Overridden Implementation(s): [BlacklistTransferManager.executeTransfer](BlacklistTransferManager.md#executetransfer),[CountTransferManager.executeTransfer](CountTransferManager.md#executetransfer),[GeneralTransferManager.executeTransfer](GeneralTransferManager.md#executetransfer),[KYCTransferManager.executeTransfer](KYCTransferManager.md#executetransfer),[LockUpTransferManager.executeTransfer](LockUpTransferManager.md#executetransfer),[ManualApprovalTransferManager.executeTransfer](ManualApprovalTransferManager.md#executetransfer),[PercentageTransferManager.executeTransfer](PercentageTransferManager.md#executetransfer),[RestrictedPartialSaleTM.executeTransfer](RestrictedPartialSaleTM.md#executetransfer),[ScheduledCheckpoint.executeTransfer](ScheduledCheckpoint.md#executetransfer),[SignedTransferManager.executeTransfer](SignedTransferManager.md#executetransfer),[VolumeRestrictionTM.executeTransfer](VolumeRestrictionTM.md#executetransfer)

Determines if the transfer between these two accounts can happen

```js
function executeTransfer(address _from, address _to, uint256 _amount, bytes _data) external nonpayable
returns(result enum ITransferManager.Result)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address |  | 
| _to | address |  | 
| _amount | uint256 |  | 
| _data | bytes |  | 

### verifyTransfer

⤿ Overridden Implementation(s): [BlacklistTransferManager.verifyTransfer](BlacklistTransferManager.md#verifytransfer),[CountTransferManager.verifyTransfer](CountTransferManager.md#verifytransfer),[GeneralTransferManager.verifyTransfer](GeneralTransferManager.md#verifytransfer),[KYCTransferManager.verifyTransfer](KYCTransferManager.md#verifytransfer),[LockUpTransferManager.verifyTransfer](LockUpTransferManager.md#verifytransfer),[ManualApprovalTransferManager.verifyTransfer](ManualApprovalTransferManager.md#verifytransfer),[PercentageTransferManager.verifyTransfer](PercentageTransferManager.md#verifytransfer),[RestrictedPartialSaleTM.verifyTransfer](RestrictedPartialSaleTM.md#verifytransfer),[ScheduledCheckpoint.verifyTransfer](ScheduledCheckpoint.md#verifytransfer),[SignedTransferManager.verifyTransfer](SignedTransferManager.md#verifytransfer),[VolumeRestrictionTM.verifyTransfer](VolumeRestrictionTM.md#verifytransfer)

```js
function verifyTransfer(address _from, address _to, uint256 _amount, bytes _data) external view
returns(result enum ITransferManager.Result, partition bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address |  | 
| _to | address |  | 
| _amount | uint256 |  | 
| _data | bytes |  | 

### getTokensByPartition

⤿ Overridden Implementation(s): [BlacklistTransferManager.getTokensByPartition](BlacklistTransferManager.md#gettokensbypartition),[GeneralTransferManager.getTokensByPartition](GeneralTransferManager.md#gettokensbypartition),[LockUpTransferManager.getTokensByPartition](LockUpTransferManager.md#gettokensbypartition),[TransferManager.getTokensByPartition](TransferManager.md#gettokensbypartition),[VolumeRestrictionTM.getTokensByPartition](VolumeRestrictionTM.md#gettokensbypartition)

return the amount of tokens for a given user as per the partition

```js
function getTokensByPartition(bytes32 _partition, address _tokenHolder, uint256 _additionalBalance) external view
returns(amount uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _partition | bytes32 | Identifier | 
| _tokenHolder | address | Whom token amount need to query | 
| _additionalBalance | uint256 | It is the `_value` that transfer during transfer/transferFrom function call | 

