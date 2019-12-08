---
id: version-3.0.0-GeneralPermissionManager
title: GeneralPermissionManager
original_id: GeneralPermissionManager
---

# Permission Manager module for core permissioning functionality (GeneralPermissionManager.sol)

View Source: [contracts/modules/PermissionManager/GeneralPermissionManager.sol](../../contracts/modules/PermissionManager/GeneralPermissionManager.sol)

**↗ Extends: [GeneralPermissionManagerStorage](GeneralPermissionManagerStorage.md), [IPermissionManager](IPermissionManager.md), [Module](Module.md)**

**GeneralPermissionManager**

**Events**

```js
event ChangePermission(address indexed _delegate, address  _module, bytes32  _perm, bool  _valid);
event AddDelegate(address indexed _delegate, bytes32  _details);
```

## Functions

- [(address _securityToken, address _polyToken)](#)
- [getInitFunction()](#getinitfunction)
- [checkPermission(address _delegate, address _module, bytes32 _perm)](#checkpermission)
- [addDelegate(address _delegate, bytes32 _details)](#adddelegate)
- [deleteDelegate(address _delegate)](#deletedelegate)
- [checkDelegate(address _potentialDelegate)](#checkdelegate)
- [changePermission(address _delegate, address _module, bytes32 _perm, bool _valid)](#changepermission)
- [changePermissionMulti(address _delegate, address[] _modules, bytes32[] _perms, bool[] _valids)](#changepermissionmulti)
- [getAllDelegatesWithPerm(address _module, bytes32 _perm)](#getalldelegateswithperm)
- [getAllModulesAndPermsFromTypes(address _delegate, uint8[] _types)](#getallmodulesandpermsfromtypes)
- [_changePermission(address _delegate, address _module, bytes32 _perm, bool _valid)](#_changepermission)
- [getAllDelegates()](#getalldelegates)
- [getPermissions()](#getpermissions)

### 

constructor

```js
function (address _securityToken, address _polyToken) public nonpayable Module 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _securityToken | address |  | 
| _polyToken | address |  | 

### getInitFunction

⤾ overrides [IModule.getInitFunction](IModule.md#getinitfunction)

Init function i.e generalise function to maintain the structure of the module contract

```js
function getInitFunction() public pure
returns(bytes4)
```

**Returns**

bytes4

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### checkPermission

⤾ overrides [IPermissionManager.checkPermission](IPermissionManager.md#checkpermission)

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

⤾ overrides [IPermissionManager.addDelegate](IPermissionManager.md#adddelegate)

Used to add a delegate

```js
function addDelegate(address _delegate, bytes32 _details) external nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _delegate | address | Ethereum address of the delegate | 
| _details | bytes32 | Details about the delegate i.e `Belongs to financial firm` | 

### deleteDelegate

⤾ overrides [IPermissionManager.deleteDelegate](IPermissionManager.md#deletedelegate)

Used to delete a delegate

```js
function deleteDelegate(address _delegate) external nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _delegate | address | Ethereum address of the delegate | 

### checkDelegate

⤾ overrides [IPermissionManager.checkDelegate](IPermissionManager.md#checkdelegate)

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

⤾ overrides [IPermissionManager.changePermission](IPermissionManager.md#changepermission)

Used to provide/change the permission to the delegate corresponds to the module contract

```js
function changePermission(address _delegate, address _module, bytes32 _perm, bool _valid) public nonpayable withPerm 
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

⤾ overrides [IPermissionManager.changePermissionMulti](IPermissionManager.md#changepermissionmulti)

Used to change one or more permissions for a single delegate at once

```js
function changePermissionMulti(address _delegate, address[] _modules, bytes32[] _perms, bool[] _valids) public nonpayable withPerm 
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

### getAllDelegatesWithPerm

⤾ overrides [IPermissionManager.getAllDelegatesWithPerm](IPermissionManager.md#getalldelegateswithperm)

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

⤾ overrides [IPermissionManager.getAllModulesAndPermsFromTypes](IPermissionManager.md#getallmodulesandpermsfromtypes)

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

### _changePermission

Used to provide/change the permission to the delegate corresponds to the module contract

```js
function _changePermission(address _delegate, address _module, bytes32 _perm, bool _valid) internal nonpayable
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

### getAllDelegates

⤾ overrides [IPermissionManager.getAllDelegates](IPermissionManager.md#getalldelegates)

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

### getPermissions

⤾ overrides [IModule.getPermissions](IModule.md#getpermissions)

Returns the Permission flag related the `this` contract

```js
function getPermissions() public view
returns(bytes32[])
```

**Returns**

Array of permission flags

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

