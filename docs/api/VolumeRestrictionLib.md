---
id: version-3.0.0-VolumeRestrictionLib
title: VolumeRestrictionLib
original_id: VolumeRestrictionLib
---

# VolumeRestrictionLib.sol

View Source: [contracts/libraries/VolumeRestrictionLib.sol](../../contracts/libraries/VolumeRestrictionLib.sol)

**VolumeRestrictionLib**

## Functions

- [deleteHolderFromList(struct VolumeRestrictionTMStorage.RestrictedData data, address _holder, enum VolumeRestrictionTMStorage.TypeOfPeriod _typeOfPeriod)](#deleteholderfromlist)
- [addRestrictionData(struct VolumeRestrictionTMStorage.RestrictedData data, address _holder, enum VolumeRestrictionTMStorage.TypeOfPeriod _callFrom, uint256 _endTime)](#addrestrictiondata)
- [_getTypeOfPeriod(enum VolumeRestrictionTMStorage.TypeOfPeriod _currentTypeOfPeriod, enum VolumeRestrictionTMStorage.TypeOfPeriod _callFrom, uint256 _endTime)](#_gettypeofperiod)
- [isValidAmountAfterRestrictionChanges(uint256 _amountTradedLastDay, uint256 _amount, uint256 _sumOfLastPeriod, uint256 _allowedAmount, uint256 _lastTradedTimestamp)](#isvalidamountafterrestrictionchanges)

### deleteHolderFromList

```js
function deleteHolderFromList(struct VolumeRestrictionTMStorage.RestrictedData data, address _holder, enum VolumeRestrictionTMStorage.TypeOfPeriod _typeOfPeriod) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| data | struct VolumeRestrictionTMStorage.RestrictedData |  | 
| _holder | address |  | 
| _typeOfPeriod | enum VolumeRestrictionTMStorage.TypeOfPeriod |  | 

### addRestrictionData

```js
function addRestrictionData(struct VolumeRestrictionTMStorage.RestrictedData data, address _holder, enum VolumeRestrictionTMStorage.TypeOfPeriod _callFrom, uint256 _endTime) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| data | struct VolumeRestrictionTMStorage.RestrictedData |  | 
| _holder | address |  | 
| _callFrom | enum VolumeRestrictionTMStorage.TypeOfPeriod |  | 
| _endTime | uint256 |  | 

### _getTypeOfPeriod

```js
function _getTypeOfPeriod(enum VolumeRestrictionTMStorage.TypeOfPeriod _currentTypeOfPeriod, enum VolumeRestrictionTMStorage.TypeOfPeriod _callFrom, uint256 _endTime) internal pure
returns(enum VolumeRestrictionTMStorage.TypeOfPeriod)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _currentTypeOfPeriod | enum VolumeRestrictionTMStorage.TypeOfPeriod |  | 
| _callFrom | enum VolumeRestrictionTMStorage.TypeOfPeriod |  | 
| _endTime | uint256 |  | 

### isValidAmountAfterRestrictionChanges

```js
function isValidAmountAfterRestrictionChanges(uint256 _amountTradedLastDay, uint256 _amount, uint256 _sumOfLastPeriod, uint256 _allowedAmount, uint256 _lastTradedTimestamp) public view
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _amountTradedLastDay | uint256 |  | 
| _amount | uint256 |  | 
| _sumOfLastPeriod | uint256 |  | 
| _allowedAmount | uint256 |  | 
| _lastTradedTimestamp | uint256 |  | 

