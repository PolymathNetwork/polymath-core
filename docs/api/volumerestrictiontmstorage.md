---
id: version-3.0.0-VolumeRestrictionTMStorage
title: VolumeRestrictionTMStorage
original_id: VolumeRestrictionTMStorage
---

# Storage layout for VolumeRestrictionTM (VolumeRestrictionTMStorage.sol)

View Source: [contracts/modules/TransferManager/VRTM/VolumeRestrictionTMStorage.sol](../../contracts/modules/TransferManager/VRTM/VolumeRestrictionTMStorage.sol)

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

### IndividualRestrictions

```js
struct IndividualRestrictions {
 mapping(address => struct VolumeRestrictionTMStorage.VolumeRestriction) individualRestriction,
 mapping(address => struct VolumeRestrictionTMStorage.VolumeRestriction) individualDailyRestriction
}
```

### GlobalRestrictions

```js
struct GlobalRestrictions {
 struct VolumeRestrictionTMStorage.VolumeRestriction defaultRestriction,
 struct VolumeRestrictionTMStorage.VolumeRestriction defaultDailyRestriction
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

### BucketData

```js
struct BucketData {
 mapping(address => mapping(uint256 => uint256)) bucket,
 mapping(address => mapping(uint256 => uint256)) defaultBucket,
 mapping(address => struct VolumeRestrictionTMStorage.BucketDetails) userToBucket,
 mapping(address => struct VolumeRestrictionTMStorage.BucketDetails) defaultUserToBucket
}
```

### Exemptions

```js
struct Exemptions {
 mapping(address => uint256) exemptIndex,
 address[] exemptAddresses
}
```

## Contract Members
**Constants & Variables**

```js
mapping(address => enum VolumeRestrictionTMStorage.TypeOfPeriod) internal holderToRestrictionType;
struct VolumeRestrictionTMStorage.IndividualRestrictions internal individualRestrictions;
struct VolumeRestrictionTMStorage.GlobalRestrictions internal globalRestrictions;
struct VolumeRestrictionTMStorage.BucketData internal bucketData;
struct VolumeRestrictionTMStorage.Exemptions internal exemptions;

```

## Functions

