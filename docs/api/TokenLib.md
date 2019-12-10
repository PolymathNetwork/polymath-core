---
id: version-3.0.0-TokenLib
title: TokenLib
original_id: TokenLib
---

# TokenLib.sol

View Source: [contracts/libraries/TokenLib.sol](../../contracts/libraries/TokenLib.sol)

**TokenLib**

## Structs
### ModuleData

```js
struct ModuleData {
 bytes32 name,
 address module,
 address moduleFactory,
 bool isArchived,
 uint8[] moduleTypes,
 uint256[] moduleIndexes,
 uint256 nameIndex
}
```

### Checkpoint

```js
struct Checkpoint {
 uint256 checkpointId,
 uint256 value
}
```

### InvestorDataStorage

```js
struct InvestorDataStorage {
 mapping(address => bool) investorListed,
 address[] investors,
 uint256 investorCount
}
```

**Events**

```js
event ModuleArchived(uint8[]  _types, address  _module, uint256  _timestamp);
event ModuleUnarchived(uint8[]  _types, address  _module, uint256  _timestamp);
```

## Functions

- [archiveModule(struct TokenLib.ModuleData _moduleData, address _module)](#archivemodule)
- [unarchiveModule(struct TokenLib.ModuleData _moduleData, address _module)](#unarchivemodule)
- [checkPermission(address[] _modules, address _delegate, address _module, bytes32 _perm)](#checkpermission)
- [getValueAt(struct TokenLib.Checkpoint[] _checkpoints, uint256 _checkpointId, uint256 _currentValue)](#getvalueat)
- [adjustCheckpoints(struct TokenLib.Checkpoint[] _checkpoints, uint256 _newValue, uint256 _currentCheckpointId)](#adjustcheckpoints)
- [adjustInvestorCount(struct TokenLib.InvestorDataStorage _investorData, address _from, address _to, uint256 _value, uint256 _balanceTo, uint256 _balanceFrom)](#adjustinvestorcount)

### archiveModule

Archives a module attached to the SecurityToken

```js
function archiveModule(struct TokenLib.ModuleData _moduleData, address _module) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _moduleData | struct TokenLib.ModuleData | Storage data | 
| _module | address | Data Storage data | 

### unarchiveModule

Unarchives a module attached to the SecurityToken

```js
function unarchiveModule(struct TokenLib.ModuleData _moduleData, address _module) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _moduleData | struct TokenLib.ModuleData | Storage data | 
| _module | address | Data Storage data | 

### checkPermission

Validates permissions with PermissionManager if it exists. If there's no permission return false

```js
function checkPermission(address[] _modules, address _delegate, address _module, bytes32 _perm) public view
returns(bool)
```

**Returns**

success

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _modules | address[] | is the modules to check permissions on | 
| _delegate | address | is the address of the delegate | 
| _module | address | s is the modules to check permissions on | 
| _perm | bytes32 | is the permissions data | 

### getValueAt

Queries a value at a defined checkpoint

```js
function getValueAt(struct TokenLib.Checkpoint[] _checkpoints, uint256 _checkpointId, uint256 _currentValue) public view
returns(uint256)
```

**Returns**

uint256

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _checkpoints | struct TokenLib.Checkpoint[] | is array of Checkpoint objects | 
| _checkpointId | uint256 | is the Checkpoint ID to query | 
| _currentValue | uint256 | is the Current value of checkpoint | 

### adjustCheckpoints

Stores the changes to the checkpoint objects

```js
function adjustCheckpoints(struct TokenLib.Checkpoint[] _checkpoints, uint256 _newValue, uint256 _currentCheckpointId) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _checkpoints | struct TokenLib.Checkpoint[] | is the affected checkpoint object array | 
| _newValue | uint256 | is the new value that needs to be stored | 
| _currentCheckpointId | uint256 |  | 

### adjustInvestorCount

Keeps track of the number of non-zero token holders

```js
function adjustInvestorCount(struct TokenLib.InvestorDataStorage _investorData, address _from, address _to, uint256 _value, uint256 _balanceTo, uint256 _balanceFrom) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investorData | struct TokenLib.InvestorDataStorage | Date releated to investor metrics | 
| _from | address | Sender of transfer | 
| _to | address | Receiver of transfer | 
| _value | uint256 | Value of transfer | 
| _balanceTo | uint256 | Balance of the _to address | 
| _balanceFrom | uint256 | Balance of the _from address | 

