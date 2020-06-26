---
id: version-3.0.0-ScheduleCheckpoint
title: ScheduleCheckpoint
original_id: ScheduleCheckpoint
---

# Burn module for burning tokens and keeping track of burnt amounts (ScheduleCheckpoint.sol)

View Source: [contracts/modules/Checkpoint/Automation/ScheduleCheckpoint.sol](../../contracts/modules/Checkpoint/Automation/ScheduleCheckpoint.sol)

**↗ Extends: [ScheduleCheckpointStorage](ScheduleCheckpointStorage.md), [TransferManager](TransferManager.md), [ICheckpoint](ICheckpoint.md)**

**ScheduleCheckpoint**

**Events**

```js
event AddSchedule(bytes32  _name, uint256  _startTime, uint256  _endTime, uint256  _frequency, enum ScheduleCheckpointStorage.FrequencyUnit  _frequencyUnit);
event RemoveSchedule(bytes32  _name);
event ModifyScheduleEndTime(bytes32  _name, uint256  _oldEndTime, uint256  _newEndTime);
```

## Functions

- [(address _securityToken, address _polyToken)](#)
- [getInitFunction()](#getinitfunction)
- [addSchedule(bytes32 _name, uint256 _startTime, uint256 _endTime, uint256 _frequency, enum ScheduleCheckpointStorage.FrequencyUnit _frequencyUnit)](#addschedule)
- [removeSchedule(bytes32 _name)](#removeschedule)
- [modifyScheduleEndTime(bytes32 _name, uint256 _newEndTime)](#modifyscheduleendtime)
- [executeTransfer(address , address , uint256 , bytes )](#executetransfer)
- [verifyTransfer(address , address , uint256 , bytes )](#verifytransfer)
- [getSchedule(bytes32 _name)](#getschedule)
- [update(bytes32 _name)](#update)
- [_update(bytes32 _name)](#_update)
- [_isScheduleActive(uint256 _createNextCheckpointAt, uint256 _endTime)](#_isscheduleactive)
- [_validateMaximumLimitCount()](#_validatemaximumlimitcount)
- [updateAll()](#updateall)
- [_updateAll()](#_updateall)
- [getPermissions()](#getpermissions)

### 

Constructor

```js
function (address _securityToken, address _polyToken) public nonpayable Module 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _securityToken | address | Address of the security token | 
| _polyToken | address |  | 

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
function addSchedule(bytes32 _name, uint256 _startTime, uint256 _endTime, uint256 _frequency, enum ScheduleCheckpointStorage.FrequencyUnit _frequencyUnit) external nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _name | bytes32 | name of the new schedule (must be unused) | 
| _startTime | uint256 | start time of the schedule (first checkpoint) | 
| _endTime | uint256 | End time of the schedule | 
| _frequency | uint256 | How frequent checkpoint will being created | 
| _frequencyUnit | enum ScheduleCheckpointStorage.FrequencyUnit | Unit of frequency i.e If issuer puts _frequency = 10
& frequency unit is DAYS then it means every 10 day frequency new checkpoint will be created | 

### removeSchedule

removes a schedule for checkpoints

```js
function removeSchedule(bytes32 _name) external nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _name | bytes32 | name of the schedule to be removed | 

### modifyScheduleEndTime

Used to modify the end time of the schedule

```js
function modifyScheduleEndTime(bytes32 _name, uint256 _newEndTime) external nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _name | bytes32 | Name of the schedule that need to modify | 
| _newEndTime | uint256 | New end time of the schedule | 

### executeTransfer

⤾ overrides [ITransferManager.executeTransfer](ITransferManager.md#executetransfer)

Used to create checkpoints that correctly reflect balances

```js
function executeTransfer(address , address , uint256 , bytes ) external nonpayable onlySecurityToken 
returns(enum ITransferManager.Result)
```

**Returns**

always returns Result.NA

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
|  | address |  | 
|  | address |  | 
|  | uint256 |  | 
|  | bytes |  | 

### verifyTransfer

⤾ overrides [ITransferManager.verifyTransfer](ITransferManager.md#verifytransfer)

Used to create checkpoints that correctly reflect balances

```js
function verifyTransfer(address , address , uint256 , bytes ) public view
returns(enum ITransferManager.Result, bytes32)
```

**Returns**

always returns Result.NA

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
|  | address |  | 
|  | address |  | 
|  | uint256 |  | 
|  | bytes |  | 

### getSchedule

gets schedule details

```js
function getSchedule(bytes32 _name) external view
returns(name bytes32, startTime uint256, endTime uint256, createNextCheckpointAt uint256, frequency uint256, frequencyUnit enum ScheduleCheckpointStorage.FrequencyUnit, checkpointIds uint256[], timestamps uint256[], periods uint256[], totalPeriods uint256)
```

**Returns**

name Name of the schedule

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _name | bytes32 |  | 

### update

manually triggers update outside of transfer request for named schedule (can be used to reduce user gas costs)

```js
function update(bytes32 _name) external nonpayable withPerm 
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

### _isScheduleActive

```js
function _isScheduleActive(uint256 _createNextCheckpointAt, uint256 _endTime) internal view
returns(isActive bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _createNextCheckpointAt | uint256 |  | 
| _endTime | uint256 |  | 

### _validateMaximumLimitCount

```js
function _validateMaximumLimitCount() internal view
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### updateAll

manually triggers update outside of transfer request for all schedules (can be used to reduce user gas costs)

```js
function updateAll() external nonpayable withPerm 
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

