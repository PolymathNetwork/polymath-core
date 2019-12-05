---
id: version-3.0.0-ScheduledCheckpoint
title: ScheduledCheckpoint
original_id: ScheduledCheckpoint
---

# Burn module for burning tokens and keeping track of burnt amounts \(ScheduledCheckpoint.sol\)

View Source: [contracts/modules/Experimental/Mixed/ScheduledCheckpoint.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/modules/Experimental/Mixed/ScheduledCheckpoint.sol)

**↗ Extends:** [**ICheckpoint**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ICheckpoint.md)**,** [**TransferManager**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/TransferManager.md)

**ScheduledCheckpoint**

**Enums**

### TimeUnit

```javascript
enum TimeUnit {
 SECONDS,
 DAYS,
 WEEKS,
 MONTHS,
 YEARS
}
```

## Structs

### Schedule

```javascript
struct Schedule {
 bytes32 name,
 uint256 startTime,
 uint256 nextTime,
 uint256 interval,
 enum ScheduledCheckpoint.TimeUnit timeUnit,
 uint256 index,
 uint256[] checkpointIds,
 uint256[] timestamps,
 uint256[] periods,
 uint256 totalPeriods
}
```

## Contract Members

**Constants & Variables**

```javascript
bytes32[] public names;
mapping(bytes32 => struct ScheduledCheckpoint.Schedule) public schedules;
```

**Events**

```javascript
event AddSchedule(bytes32  _name, uint256  _startTime, uint256  _interval, enum ScheduledCheckpoint.TimeUnit  _timeUint);
event RemoveSchedule(bytes32  _name);
```

## Functions

* [\(address \_securityToken, address \_polyToken\)](scheduledcheckpoint.md)
* [getInitFunction\(\)](scheduledcheckpoint.md#getinitfunction)
* [addSchedule\(bytes32 \_name, uint256 \_startTime, uint256 \_interval, enum ScheduledCheckpoint.TimeUnit \_timeUnit\)](scheduledcheckpoint.md#addschedule)
* [removeSchedule\(bytes32 \_name\)](scheduledcheckpoint.md#removeschedule)
* [executeTransfer\(address , address , uint256 , bytes \)](scheduledcheckpoint.md#executetransfer)
* [verifyTransfer\(address , address , uint256 , bytes \)](scheduledcheckpoint.md#verifytransfer)
* [getSchedule\(bytes32 \_name\)](scheduledcheckpoint.md#getschedule)
* [update\(bytes32 \_name\)](scheduledcheckpoint.md#update)
* [\_update\(bytes32 \_name\)](scheduledcheckpoint.md#_update)
* [updateAll\(\)](scheduledcheckpoint.md#updateall)
* [\_updateAll\(\)](scheduledcheckpoint.md#_updateall)
* [getPermissions\(\)](scheduledcheckpoint.md#getpermissions)

Constructor

```javascript
function (address _securityToken, address _polyToken) public nonpayable Module
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_securityToken | address | Address of the security token |
| \_polyToken | address |  |

### getInitFunction

⤾ overrides [IModule.getInitFunction](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModule.md#getinitfunction)

This function returns the signature of configure function

```javascript
function getInitFunction() public pure
returns(bytes4)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### addSchedule

adds a new schedule for checkpoints

```javascript
function addSchedule(bytes32 _name, uint256 _startTime, uint256 _interval, enum ScheduledCheckpoint.TimeUnit _timeUnit) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_name | bytes32 | name of the new schedule \(must be unused\) |
| \_startTime | uint256 | start time of the schedule \(first checkpoint\) |
| \_interval | uint256 | interval at which checkpoints should be created |
| \_timeUnit | enum ScheduledCheckpoint.TimeUnit | unit of time at which checkpoints should be created |

### removeSchedule

removes a schedule for checkpoints

```javascript
function removeSchedule(bytes32 _name) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_name | bytes32 | name of the schedule to be removed |

### executeTransfer

⤾ overrides [ITransferManager.executeTransfer](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ITransferManager.md#executetransfer)

Used to create checkpoints that correctly reflect balances

```javascript
function executeTransfer(address , address , uint256 , bytes ) external nonpayable onlySecurityToken 
returns(enum ITransferManager.Result)
```

**Returns**

always returns Result.NA

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
|  | address |  |
|  | address |  |
|  | uint256 |  |
|  | bytes |  |

### verifyTransfer

⤾ overrides [ITransferManager.verifyTransfer](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ITransferManager.md#verifytransfer)

Used to create checkpoints that correctly reflect balances

```javascript
function verifyTransfer(address , address , uint256 , bytes ) public view
returns(enum ITransferManager.Result, bytes32)
```

**Returns**

always returns Result.NA

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
|  | address |  |
|  | address |  |
|  | uint256 |  |
|  | bytes |  |

### getSchedule

gets schedule details

```javascript
function getSchedule(bytes32 _name) external view
returns(bytes32, uint256, uint256, uint256, enum ScheduledCheckpoint.TimeUnit, uint256[], uint256[], uint256[], uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_name | bytes32 | name of the schedule |

### update

manually triggers update outside of transfer request for named schedule \(can be used to reduce user gas costs\)

```javascript
function update(bytes32 _name) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_name | bytes32 | name of the schedule |

### \_update

```javascript
function _update(bytes32 _name) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_name | bytes32 |  |

### updateAll

manually triggers update outside of transfer request for all schedules \(can be used to reduce user gas costs\)

```javascript
function updateAll() external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### \_updateAll

```javascript
function _updateAll() internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### getPermissions

⤾ overrides [IModule.getPermissions](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModule.md#getpermissions)

Return the permissions flag that are associated with CountTransferManager

```javascript
function getPermissions() external view
returns(bytes32[])
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


