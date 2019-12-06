---
id: version-3.0.0-IPermissionManager
title: IPermissionManager
original_id: IPermissionManager
---

# Interface to be implemented by all permission manager modules (IPermissionManager.sol)

View Source: [contracts/modules/PermissionManager/IPermissionManager.sol](../../contracts/modules/PermissionManager/IPermissionManager.sol)

**↘ Derived Contracts: [GeneralPermissionManager](GeneralPermissionManager.md)**

**IPermissionManager**

## Functions

- [checkPermission(address _delegate, address _module, bytes32 _perm)](#checkpermission)
- [addDelegate(address _delegate, bytes32 _details)](#adddelegate)
- [deleteDelegate(address _delegate)](#deletedelegate)
- [checkDelegate(address _potentialDelegate)](#checkdelegate)
- [changePermission(address _delegate, address _module, bytes32 _perm, bool _valid)](#changepermission)
- [changePermissionMulti(address _delegate, address[] _modules, bytes32[] _perms, bool[] _valids)](#changepermissionmulti)
- [addDelegateMulti(address[] _delegates, bytes32[] _details)](#adddelegatemulti)
- [deleteDelegateMulti(address[] _delegates)](#deletedelegatemulti)
- [getAllDelegatesWithPerm(address _module, bytes32 _perm)](#getalldelegateswithperm)
- [getAllModulesAndPermsFromTypes(address _delegate, uint8[] _types)](#getallmodulesandpermsfromtypes)
- [getPermissions()](#getpermissions)
- [getAllDelegates()](#getalldelegates)

### checkPermission

⤿ Overridden Implementation(s): [GeneralPermissionManager.checkPermission](GeneralPermissionManager.md#checkpermission)

Used to check the permission on delegate corresponds to module contract address

```js
function checkPermission(address _delegate, address _module, bytes32 _perm) external view
returns(bool)
```

**Returns**

bool

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _delegate | address | Ethereum address of the delegate | 
| _module | address | Ethereum contract address of the module | 
| _perm | bytes32 | Permission flag | 

### addDelegate

⤿ Overridden Implementation(s): [GeneralPermissionManager.addDelegate](GeneralPermissionManager.md#adddelegate)

Used to add a delegate

```js
function addDelegate(address _delegate, bytes32 _details) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _delegate | address | Ethereum address of the delegate | 
| _details | bytes32 | Details about the delegate i.e `Belongs to financial firm` | 

### deleteDelegate

⤿ Overridden Implementation(s): [GeneralPermissionManager.deleteDelegate](GeneralPermissionManager.md#deletedelegate)

Used to delete a delegate

```js
function deleteDelegate(address _delegate) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _delegate | address | Ethereum address of the delegate | 

### checkDelegate

⤿ Overridden Implementation(s): [GeneralPermissionManager.checkDelegate](GeneralPermissionManager.md#checkdelegate)

Used to check if an address is a delegate or not

```js
function checkDelegate(address _potentialDelegate) external view
returns(bool)
```

**Returns**

bool

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _potentialDelegate | address | the address of potential delegate | 

### changePermission

⤿ Overridden Implementation(s): [GeneralPermissionManager.changePermission](GeneralPermissionManager.md#changepermission)

Used to provide/change the permission to the delegate corresponds to the module contract

```js
function changePermission(address _delegate, address _module, bytes32 _perm, bool _valid) external nonpayable
```

**Returns**

bool

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _delegate | address | Ethereum address of the delegate | 
| _module | address | Ethereum contract address of the module | 
| _perm | bytes32 | Permission flag | 
| _valid | bool | Bool flag use to switch on/off the permission | 

### changePermissionMulti

⤿ Overridden Implementation(s): [GeneralPermissionManager.changePermissionMulti](GeneralPermissionManager.md#changepermissionmulti)

Used to change one or more permissions for a single delegate at once

```js
function changePermissionMulti(address _delegate, address[] _modules, bytes32[] _perms, bool[] _valids) external nonpayable
```

**Returns**

nothing

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _delegate | address | Ethereum address of the delegate | 
| _modules | address[] | Multiple module matching the multiperms, needs to be same length | 
| _perms | bytes32[] | Multiple permission flag needs to be changed | 
| _valids | bool[] | Bool array consist the flag to switch on/off the permission | 

### addDelegateMulti

⤿ Overridden Implementation(s): [GeneralPermissionManager.addDelegateMulti](GeneralPermissionManager.md#adddelegatemulti)

Used to add multiple delegates in a batch

```js
function addDelegateMulti(address[] _delegates, bytes32[] _details) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _delegates | address[] | An array of Ethereum addresses of the delegates | 
| _details | bytes32[] | An array of details about the delegates i.e `Belongs to financial firm` | 

### deleteDelegateMulti

⤿ Overridden Implementation(s): [GeneralPermissionManager.deleteDelegateMulti](GeneralPermissionManager.md#deletedelegatemulti)

Used to delete a list of delegates

```js
function deleteDelegateMulti(address[] _delegates) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _delegates | address[] | An array of Ethereum address of delegates | 

### getAllDelegatesWithPerm

⤿ Overridden Implementation(s): [GeneralPermissionManager.getAllDelegatesWithPerm](GeneralPermissionManager.md#getalldelegateswithperm)

Used to return all delegates with a given permission and module

```js
function getAllDelegatesWithPerm(address _module, bytes32 _perm) external view
returns(address[])
```

**Returns**

address[]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _module | address | Ethereum contract address of the module | 
| _perm | bytes32 | Permission flag | 

### getAllModulesAndPermsFromTypes

⤿ Overridden Implementation(s): [GeneralPermissionManager.getAllModulesAndPermsFromTypes](GeneralPermissionManager.md#getallmodulesandpermsfromtypes)

Used to return all permission of a single or multiple module

```js
function getAllModulesAndPermsFromTypes(address _delegate, uint8[] _types) external view
returns(address[], bytes32[])
```

**Returns**

address[] the address array of Modules this delegate has permission

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _delegate | address | Ethereum address of the delegate | 
| _types | uint8[] | uint8[] of types | 

### getPermissions

⤿ Overridden Implementation(s): [BlacklistTransferManager.getPermissions](BlacklistTransferManager.md#getpermissions),[CappedSTO.getPermissions](CappedSTO.md#getpermissions),[CountTransferManager.getPermissions](CountTransferManager.md#getpermissions),[DividendCheckpoint.getPermissions](DividendCheckpoint.md#getpermissions),[DummySTO.getPermissions](DummySTO.md#getpermissions),[GeneralPermissionManager.getPermissions](GeneralPermissionManager.md#getpermissions),[GeneralTransferManager.getPermissions](GeneralTransferManager.md#getpermissions),[IModule.getPermissions](IModule.md#getpermissions),[KYCTransferManager.getPermissions](KYCTransferManager.md#getpermissions),[LockUpTransferManager.getPermissions](LockUpTransferManager.md#getpermissions),[ManualApprovalTransferManager.getPermissions](ManualApprovalTransferManager.md#getpermissions),[PercentageTransferManager.getPermissions](PercentageTransferManager.md#getpermissions),[PLCRVotingCheckpoint.getPermissions](PLCRVotingCheckpoint.md#getpermissions),[PreSaleSTO.getPermissions](PreSaleSTO.md#getpermissions),[RestrictedPartialSaleTM.getPermissions](RestrictedPartialSaleTM.md#getpermissions),[ScheduledCheckpoint.getPermissions](ScheduledCheckpoint.md#getpermissions),[SignedTransferManager.getPermissions](SignedTransferManager.md#getpermissions),[TrackedRedemption.getPermissions](TrackedRedemption.md#getpermissions),[USDTieredSTO.getPermissions](USDTieredSTO.md#getpermissions),[VestingEscrowWallet.getPermissions](VestingEscrowWallet.md#getpermissions),[VolumeRestrictionTM.getPermissions](VolumeRestrictionTM.md#getpermissions),[WeightedVoteCheckpoint.getPermissions](WeightedVoteCheckpoint.md#getpermissions)

Used to get the Permission flag related the `this` contract

```js
function getPermissions() external view
returns(bytes32[])
```

**Returns**

Array of permission flags

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getAllDelegates

⤿ Overridden Implementation(s): [GeneralPermissionManager.getAllDelegates](GeneralPermissionManager.md#getalldelegates)

Used to get all delegates

```js
function getAllDelegates() external view
returns(address[])
```

**Returns**

address[]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

