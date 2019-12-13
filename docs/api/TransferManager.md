---
id: version-3.0.0-TransferManager
title: TransferManager
original_id: TransferManager
---

# Base abstract contract to be implemented by all Transfer Manager modules (TransferManager.sol)

View Source: [contracts/modules/TransferManager/TransferManager.sol](../../contracts/modules/TransferManager/TransferManager.sol)

**↗ Extends: [ITransferManager](ITransferManager.md), [Module](Module.md)**
**↘ Derived Contracts: [BlacklistTransferManager](BlacklistTransferManager.md), [CountTransferManager](CountTransferManager.md), [GeneralTransferManager](GeneralTransferManager.md), [KYCTransferManager](KYCTransferManager.md), [LockUpTransferManager](LockUpTransferManager.md), [ManualApprovalTransferManager](ManualApprovalTransferManager.md), [PercentageTransferManager](PercentageTransferManager.md), [RestrictedPartialSaleTM](RestrictedPartialSaleTM.md), [ScheduledCheckpoint](ScheduledCheckpoint.md), [SignedTransferManager](SignedTransferManager.md), [VolumeRestrictionTM](VolumeRestrictionTM.md)**

**TransferManager**

## Contract Members
**Constants & Variables**

```js
bytes32 public constant LOCKED;
bytes32 public constant UNLOCKED;

```

## Modifiers

- [onlySecurityToken](#onlysecuritytoken)

### onlySecurityToken

```js
modifier onlySecurityToken() internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

## Functions

- [getTokensByPartition(bytes32 _partition, address _tokenHolder, uint256 )](#gettokensbypartition)

### getTokensByPartition

⤾ overrides [ITransferManager.getTokensByPartition](ITransferManager.md#gettokensbypartition)

⤿ Overridden Implementation(s): [BlacklistTransferManager.getTokensByPartition](BlacklistTransferManager.md#gettokensbypartition),[GeneralTransferManager.getTokensByPartition](GeneralTransferManager.md#gettokensbypartition),[LockUpTransferManager.getTokensByPartition](LockUpTransferManager.md#gettokensbypartition),[VolumeRestrictionTM.getTokensByPartition](VolumeRestrictionTM.md#gettokensbypartition)

return the amount of tokens for a given user as per the partition

```js
function getTokensByPartition(bytes32 _partition, address _tokenHolder, uint256 ) external view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _partition | bytes32 |  | 
| _tokenHolder | address |  | 
|  | uint256 |  | 

