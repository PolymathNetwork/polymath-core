---
id: version-3.0.0-VolumeRestrictionTMStorage
title: VolumeRestrictionTMStorage
original_id: VolumeRestrictionTMStorage
---

# Storage layout for VolumeRestrictionTM \(VolumeRestrictionTMStorage.sol\)

View Source: [contracts/modules/TransferManager/VRTM/VolumeRestrictionTMStorage.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/modules/TransferManager/VRTM/VolumeRestrictionTMStorage.sol)

**↘ Derived Contracts:** [**VolumeRestrictionTM**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/VolumeRestrictionTM.md)**,** [**VolumeRestrictionTMProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/VolumeRestrictionTMProxy.md)

**VolumeRestrictionTMStorage**

**Enums**

### RestrictionType

```javascript
enum RestrictionType {
 Fixed,
 Percentage
}
```

### TypeOfPeriod

```javascript
enum TypeOfPeriod {
 MultipleDays,
 OneDay,
 Both
}
```

## Structs

### VolumeRestriction

```javascript
struct VolumeRestriction {
 uint256 allowedTokens,
 uint256 startTime,
 uint256 rollingPeriodInDays,
 uint256 endTime,
 enum VolumeRestrictionTMStorage.RestrictionType typeOfRestriction
}
```

### IndividualRestrictions

```javascript
struct IndividualRestrictions {
 mapping(address => struct VolumeRestrictionTMStorage.VolumeRestriction) individualRestriction,
 mapping(address => struct VolumeRestrictionTMStorage.VolumeRestriction) individualDailyRestriction
}
```

### GlobalRestrictions

```javascript
struct GlobalRestrictions {
 struct VolumeRestrictionTMStorage.VolumeRestriction defaultRestriction,
 struct VolumeRestrictionTMStorage.VolumeRestriction defaultDailyRestriction
}
```

### BucketDetails

```javascript
struct BucketDetails {
 uint256 lastTradedDayTime,
 uint256 sumOfLastPeriod,
 uint256 daysCovered,
 uint256 dailyLastTradedDayTime,
 uint256 lastTradedTimestamp
}
```

### BucketData

```javascript
struct BucketData {
 mapping(address => mapping(uint256 => uint256)) bucket,
 mapping(address => mapping(uint256 => uint256)) defaultBucket,
 mapping(address => struct VolumeRestrictionTMStorage.BucketDetails) userToBucket,
 mapping(address => struct VolumeRestrictionTMStorage.BucketDetails) defaultUserToBucket
}
```

### Exemptions

```javascript
struct Exemptions {
 mapping(address => uint256) exemptIndex,
 address[] exemptAddresses
}
```

## Contract Members

**Constants & Variables**

```javascript
mapping(address => enum VolumeRestrictionTMStorage.TypeOfPeriod) internal holderToRestrictionType;
struct VolumeRestrictionTMStorage.IndividualRestrictions internal individualRestrictions;
struct VolumeRestrictionTMStorage.GlobalRestrictions internal globalRestrictions;
struct VolumeRestrictionTMStorage.BucketData internal bucketData;
struct VolumeRestrictionTMStorage.Exemptions internal exemptions;
```

## Functions

