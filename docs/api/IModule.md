---
id: version-3.0.0-IModule
title: IModule
original_id: IModule
---

# Interface that every module contract should implement (IModule.sol)

View Source: [contracts/interfaces/IModule.sol](../../contracts/interfaces/IModule.sol)

**↘ Derived Contracts: [Module](Module.md)**

**IModule**

## Functions

- [getInitFunction()](#getinitfunction)
- [getPermissions()](#getpermissions)

### getInitFunction

⤿ Overridden Implementation(s): [AdvancedPLCRVotingCheckpoint.getInitFunction](AdvancedPLCRVotingCheckpoint.md#getinitfunction),[BlacklistTransferManager.getInitFunction](BlacklistTransferManager.md#getinitfunction),[CappedSTO.getInitFunction](CappedSTO.md#getinitfunction),[CountTransferManager.getInitFunction](CountTransferManager.md#getinitfunction),[DividendCheckpoint.getInitFunction](DividendCheckpoint.md#getinitfunction),[DummySTO.getInitFunction](DummySTO.md#getinitfunction),[GeneralPermissionManager.getInitFunction](GeneralPermissionManager.md#getinitfunction),[GeneralTransferManager.getInitFunction](GeneralTransferManager.md#getinitfunction),[Issuance.getInitFunction](Issuance.md#getinitfunction),[KYCTransferManager.getInitFunction](KYCTransferManager.md#getinitfunction),[LockUpTransferManager.getInitFunction](LockUpTransferManager.md#getinitfunction),[ManualApprovalTransferManager.getInitFunction](ManualApprovalTransferManager.md#getinitfunction),[PercentageTransferManager.getInitFunction](PercentageTransferManager.md#getinitfunction),[PLCRVotingCheckpoint.getInitFunction](PLCRVotingCheckpoint.md#getinitfunction),[PreSaleSTO.getInitFunction](PreSaleSTO.md#getinitfunction),[RestrictedPartialSaleTM.getInitFunction](RestrictedPartialSaleTM.md#getinitfunction),[ScheduleCheckpoint.getInitFunction](ScheduleCheckpoint.md#getinitfunction),[SignedTransferManager.getInitFunction](SignedTransferManager.md#getinitfunction),[TrackedRedemption.getInitFunction](TrackedRedemption.md#getinitfunction),[USDTieredSTO.getInitFunction](USDTieredSTO.md#getinitfunction),[VestingEscrowWallet.getInitFunction](VestingEscrowWallet.md#getinitfunction),[VolumeRestrictionTM.getInitFunction](VolumeRestrictionTM.md#getinitfunction),[WeightedVoteCheckpoint.getInitFunction](WeightedVoteCheckpoint.md#getinitfunction)

This function returns the signature of configure function

```js
function getInitFunction() external pure
returns(initFunction bytes4)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getPermissions

⤾ overrides [IPermissionManager.getPermissions](IPermissionManager.md#getpermissions)

⤿ Overridden Implementation(s): [AdvancedPLCRVotingCheckpoint.getPermissions](AdvancedPLCRVotingCheckpoint.md#getpermissions),[BlacklistTransferManager.getPermissions](BlacklistTransferManager.md#getpermissions),[CappedSTO.getPermissions](CappedSTO.md#getpermissions),[CountTransferManager.getPermissions](CountTransferManager.md#getpermissions),[DividendCheckpoint.getPermissions](DividendCheckpoint.md#getpermissions),[DummySTO.getPermissions](DummySTO.md#getpermissions),[GeneralPermissionManager.getPermissions](GeneralPermissionManager.md#getpermissions),[GeneralTransferManager.getPermissions](GeneralTransferManager.md#getpermissions),[Issuance.getPermissions](Issuance.md#getpermissions),[KYCTransferManager.getPermissions](KYCTransferManager.md#getpermissions),[LockUpTransferManager.getPermissions](LockUpTransferManager.md#getpermissions),[ManualApprovalTransferManager.getPermissions](ManualApprovalTransferManager.md#getpermissions),[PercentageTransferManager.getPermissions](PercentageTransferManager.md#getpermissions),[PLCRVotingCheckpoint.getPermissions](PLCRVotingCheckpoint.md#getpermissions),[PreSaleSTO.getPermissions](PreSaleSTO.md#getpermissions),[RestrictedPartialSaleTM.getPermissions](RestrictedPartialSaleTM.md#getpermissions),[ScheduleCheckpoint.getPermissions](ScheduleCheckpoint.md#getpermissions),[SignedTransferManager.getPermissions](SignedTransferManager.md#getpermissions),[TrackedRedemption.getPermissions](TrackedRedemption.md#getpermissions),[USDTieredSTO.getPermissions](USDTieredSTO.md#getpermissions),[VestingEscrowWallet.getPermissions](VestingEscrowWallet.md#getpermissions),[VolumeRestrictionTM.getPermissions](VolumeRestrictionTM.md#getpermissions),[WeightedVoteCheckpoint.getPermissions](WeightedVoteCheckpoint.md#getpermissions)

Return the permission flags that are associated with a module

```js
function getPermissions() external view
returns(permissions bytes32[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

