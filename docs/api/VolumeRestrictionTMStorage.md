---
id: version-3.0.0-VolumeRestrictionTMStorage
title: VolumeRestrictionTMStorage
original_id: VolumeRestrictionTMStorage
---

# Storage layout for VolumeRestrictionTM (VolumeRestrictionTMStorage.sol)

View Source: [contracts/storage/VolumeRestrictionTMStorage.sol](../../contracts/storage/VolumeRestrictionTMStorage.sol)

**↘ Derived Contracts: [VolumeRestrictionTM](VolumeRestrictionTM.md), [VolumeRestrictionTMProxy](VolumeRestrictionTMProxy.md)**

**VolumeRestrictionTMStorage**

**Enums**
### RestrictionType

```js
enum RestrictionType {
 Fixed,
 Percentage
}
```

### TypeOfPeriod

```js
enum TypeOfPeriod {
 MultipleDays,
 OneDay,
 Both
}
```

## Structs
### RestrictedHolder

```js
struct RestrictedHolder {
 uint8 seen,
 enum VolumeRestrictionTMStorage.TypeOfPeriod typeOfPeriod,
 uint128 index
}
```

### RestrictedData

```js
struct RestrictedData {
 mapping(address => struct VolumeRestrictionTMStorage.RestrictedHolder) restrictedHolders,
 address[] restrictedAddresses
}
```

### VolumeRestriction

```js
struct VolumeRestriction {
 uint256 allowedTokens,
 uint256 startTime,
 uint256 rollingPeriodInDays,
 uint256 endTime,
 enum VolumeRestrictionTMStorage.RestrictionType typeOfRestriction
}
```

### BucketDetails

```js
struct BucketDetails {
 uint256 lastTradedDayTime,
 uint256 sumOfLastPeriod,
 uint256 daysCovered,
 uint256 dailyLastTradedDayTime,
 uint256 lastTradedTimestamp
}
```

## Contract Members
**Constants & Variables**

```js
//public members
struct VolumeRestrictionTMStorage.VolumeRestriction public defaultRestriction;
struct VolumeRestrictionTMStorage.VolumeRestriction public defaultDailyRestriction;
mapping(address => struct VolumeRestrictionTMStorage.VolumeRestriction) public individualRestriction;
mapping(address => struct VolumeRestrictionTMStorage.VolumeRestriction) public individualDailyRestriction;
address[] public exemptAddresses;

//internal members
mapping(address => mapping(uint256 => uint256)) internal bucket;
mapping(address => mapping(uint256 => uint256)) internal defaultBucket;
mapping(address => struct VolumeRestrictionTMStorage.BucketDetails) internal userToBucket;
mapping(address => struct VolumeRestrictionTMStorage.BucketDetails) internal defaultUserToBucket;
struct VolumeRestrictionTMStorage.RestrictedData internal holderData;
mapping(address => uint256) internal exemptIndex;

```

## Functions

