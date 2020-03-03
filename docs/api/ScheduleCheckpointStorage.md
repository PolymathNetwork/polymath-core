---
id: version-3.0.0-ScheduleCheckpointStorage
title: ScheduleCheckpointStorage
original_id: ScheduleCheckpointStorage
---

# ScheduleCheckpointStorage.sol

View Source: [contracts/modules/Checkpoint/Automation/ScheduleCheckpointStorage.sol](../../contracts/modules/Checkpoint/Automation/ScheduleCheckpointStorage.sol)

**↘ Derived Contracts: [ScheduleCheckpoint](ScheduleCheckpoint.md), [ScheduleCheckpointProxy](ScheduleCheckpointProxy.md)**

**ScheduleCheckpointStorage**

**Enums**
### FrequencyUnit

```js
enum FrequencyUnit {
 SECONDS,
 DAYS,
 WEEKS,
 MONTHS,
 QUATER,
 YEARS
}
```

## Structs
### Schedule

```js
struct Schedule {
 uint256 index,
 bytes32 name,
 uint256 startTime,
 uint256 endTime,
 uint256 createNextCheckpointAt,
 uint256 frequency,
 enum ScheduleCheckpointStorage.FrequencyUnit frequencyUnit,
 uint256[] checkpointIds,
 uint256[] timestamps,
 uint256[] periods,
 uint256 totalPeriods
}
```

## Contract Members
**Constants & Variables**

```js
//internal members
bytes32 internal constant OPERATOR;
uint256 internal constant MAXLIMIT;

//public members
bytes32[] public names;
mapping(bytes32 => struct ScheduleCheckpointStorage.Schedule) public schedules;

```

## Functions

