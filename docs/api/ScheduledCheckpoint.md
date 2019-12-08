---
id: version-3.0.0-ScheduledCheckpoint
title: ScheduledCheckpoint
original_id: ScheduledCheckpoint
---

# Burn module for burning tokens and keeping track of burnt amounts (ScheduledCheckpoint.sol)

View Source: [contracts/modules/Experimental/Mixed/ScheduledCheckpoint.sol](../../contracts/modules/Experimental/Mixed/ScheduledCheckpoint.sol)

**↗ Extends: [ICheckpoint](ICheckpoint.md), [ITransferManager](ITransferManager.md)**

**ScheduledCheckpoint**

## Constructor

Constructor

```js
constructor(address _securityToken, address _polyAddress) public
```

**Arguments**

## Structs
### Schedule

```js
struct Schedule {
 bytes32 name,
 uint256 startTime,
 uint256 nextTime,
 uint256 interval,
 uint256 index,
 uint256[] checkpointIds,
 uint256[] timestamps,
 uint256[] periods
}
```

## Contract Members
**Constants & Variables**

```js
bytes32[] public names;
mapping(bytes32 => struct ScheduledCheckpoint.Schedule) public schedules;

```

**Events**

```js
event AddSchedule(bytes32  _name, uint256  _startTime, uint256  _interval, uint256  _timestamp);
event RemoveSchedule(bytes32  _name, uint256  _timestamp);
```

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _securityToken | address | Address of the security token | 
| _polyAddress | address | Address of the polytoken | 

## Functions

- [getInitFunction()](#getinitfunction)
- [addSchedule(bytes32 _name, uint256 _startTime, uint256 _interval)](#addschedule)
- [removeSchedule(bytes32 _name)](#removeschedule)
- [verifyTransfer(address , address , uint256 , bytes , bool _isTransfer)](#verifytransfer)
- [getSchedule(bytes32 _name)](#getschedule)
- [update(bytes32 _name)](#update)
- [_update(bytes32 _name)](#_update)
- [updateAll()](#updateall)
- [_updateAll()](#_updateall)
- [getPermissions()](#getpermissions)

### getInitFunction

⤾ overrides [IModule.getInitFunction](IModule.md#getinitfunction)

This function returns the signature of configure function

```js
function getInitFunction() public pure
returns(bytes4)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### addSchedule

adds a new schedule for checkpoints

```js
function addSchedule(bytes32 _name, uint256 _startTime, uint256 _interval) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _name | bytes32 | name of the new schedule (must be unused) | 
| _startTime | uint256 | start time of the schedule (first checkpoint) | 
| _interval | uint256 | interval at which checkpoints should be created | 

### removeSchedule

removes a schedule for checkpoints

```js
function removeSchedule(bytes32 _name) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _name | bytes32 | name of the schedule to be removed | 

### verifyTransfer

⤾ overrides [ITransferManager.verifyTransfer](ITransferManager.md#verifytransfer)

Used to create checkpoints that correctly reflect balances

```js
function verifyTransfer(address , address , uint256 , bytes , bool _isTransfer) public nonpayable
returns(enum ITransferManager.Result)
```

**Returns**

always returns Result.NA

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
|  | address | _isTransfer whether or not an actual transfer is occuring | 
|  | address | _isTransfer whether or not an actual transfer is occuring | 
|  | uint256 | _isTransfer whether or not an actual transfer is occuring | 
|  | bytes | _isTransfer whether or not an actual transfer is occuring | 
| _isTransfer | bool | whether or not an actual transfer is occuring | 

### getSchedule

gets schedule details

```js
function getSchedule(bytes32 _name) external view
returns(bytes32, uint256, uint256, uint256, uint256[], uint256[], uint256[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _name | bytes32 | name of the schedule | 

### update

manually triggers update outside of transfer request for named schedule (can be used to reduce user gas costs)

```js
function update(bytes32 _name) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _name | bytes32 | name of the schedule | 

### _update

```js
function _update(bytes32 _name) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _name | bytes32 |  | 

### updateAll

manually triggers update outside of transfer request for all schedules (can be used to reduce user gas costs)

```js
function updateAll() external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### _updateAll

```js
function _updateAll() internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getPermissions

⤾ overrides [IModule.getPermissions](IModule.md#getpermissions)

Return the permissions flag that are associated with CountTransferManager

```js
function getPermissions() external view
returns(bytes32[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

