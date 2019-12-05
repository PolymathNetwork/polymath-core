---
id: version-3.0.0-VolumeRestrictionLib
title: VolumeRestrictionLib
original_id: VolumeRestrictionLib
---

# VolumeRestrictionLib.sol

View Source: [contracts/libraries/VolumeRestrictionLib.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/libraries/VolumeRestrictionLib.sol)

**VolumeRestrictionLib**

## Contract Members

**Constants & Variables**

```javascript
uint256 internal constant ONE;
uint8 internal constant INDEX;
bytes32 internal constant INVESTORFLAGS;
bytes32 internal constant INVESTORSKEY;
bytes32 internal constant WHITELIST;
```

## Functions

* [deleteHolderFromList\(mapping\(address =&gt; enum VolumeRestrictionTMStorage.TypeOfPeriod\) \_holderToRestrictionType, address \_holder, IDataStore \_dataStore, enum VolumeRestrictionTMStorage.TypeOfPeriod \_typeOfPeriod\)](volumerestrictionlib.md#deleteholderfromlist)
* [addRestrictionData\(mapping\(address =&gt; enum VolumeRestrictionTMStorage.TypeOfPeriod\) \_holderToRestrictionType, address \_holder, enum VolumeRestrictionTMStorage.TypeOfPeriod \_callFrom, uint256 \_endTime, IDataStore \_dataStore\)](volumerestrictionlib.md#addrestrictiondata)
* [isValidAmountAfterRestrictionChanges\(uint256 \_amountTradedLastDay, uint256 \_amount, uint256 \_sumOfLastPeriod, uint256 \_allowedAmount, uint256 \_lastTradedTimestamp\)](volumerestrictionlib.md#isvalidamountafterrestrictionchanges)
* [getRestrictionData\(mapping\(address =&gt; enum VolumeRestrictionTMStorage.TypeOfPeriod\) \_holderToRestrictionType, struct VolumeRestrictionTMStorage.IndividualRestrictions \_individualRestrictions, IDataStore \_dataStore\)](volumerestrictionlib.md#getrestrictiondata)
* [\_setValues\(struct VolumeRestrictionTMStorage.VolumeRestriction \_restriction, uint256\[\] \_allowedTokens, uint256\[\] \_startTime, uint256\[\] \_rollingPeriodInDays, uint256\[\] \_endTime, enum VolumeRestrictionTMStorage.RestrictionType\[\] \_typeOfRestriction, uint256 \_index\)](volumerestrictionlib.md#_setvalues)
* [\_isVolRestricted\(uint256 \_flags\)](volumerestrictionlib.md#_isvolrestricted)
* [\_getTypeOfPeriod\(enum VolumeRestrictionTMStorage.TypeOfPeriod \_currentTypeOfPeriod, enum VolumeRestrictionTMStorage.TypeOfPeriod \_callFrom, uint256 \_endTime\)](volumerestrictionlib.md#_gettypeofperiod)
* [\_isExistingInvestor\(address \_investor, IDataStore \_dataStore\)](volumerestrictionlib.md#_isexistinginvestor)
* [\_getKey\(bytes32 \_key1, address \_key2\)](volumerestrictionlib.md#_getkey)

### deleteHolderFromList

```javascript
function deleteHolderFromList(mapping(address => enum VolumeRestrictionTMStorage.TypeOfPeriod) _holderToRestrictionType, address _holder, IDataStore _dataStore, enum VolumeRestrictionTMStorage.TypeOfPeriod _typeOfPeriod) public nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_holderToRestrictionType | mapping\(address =&gt; enum VolumeRestrictionTMStorage.TypeOfPeriod\) |  |
| \_holder | address |  |
| \_dataStore | IDataStore |  |
| \_typeOfPeriod | enum VolumeRestrictionTMStorage.TypeOfPeriod |  |

### addRestrictionData

```javascript
function addRestrictionData(mapping(address => enum VolumeRestrictionTMStorage.TypeOfPeriod) _holderToRestrictionType, address _holder, enum VolumeRestrictionTMStorage.TypeOfPeriod _callFrom, uint256 _endTime, IDataStore _dataStore) public nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_holderToRestrictionType | mapping\(address =&gt; enum VolumeRestrictionTMStorage.TypeOfPeriod\) |  |
| \_holder | address |  |
| \_callFrom | enum VolumeRestrictionTMStorage.TypeOfPeriod |  |
| \_endTime | uint256 |  |
| \_dataStore | IDataStore |  |

### isValidAmountAfterRestrictionChanges

```javascript
function isValidAmountAfterRestrictionChanges(uint256 _amountTradedLastDay, uint256 _amount, uint256 _sumOfLastPeriod, uint256 _allowedAmount, uint256 _lastTradedTimestamp) public view
returns(bool)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_amountTradedLastDay | uint256 |  |
| \_amount | uint256 |  |
| \_sumOfLastPeriod | uint256 |  |
| \_allowedAmount | uint256 |  |
| \_lastTradedTimestamp | uint256 |  |

### getRestrictionData

Provide the restriction details of all the restricted addresses

```javascript
function getRestrictionData(mapping(address => enum VolumeRestrictionTMStorage.TypeOfPeriod) _holderToRestrictionType, struct VolumeRestrictionTMStorage.IndividualRestrictions _individualRestrictions, IDataStore _dataStore) public view
returns(allAddresses address[], allowedTokens uint256[], startTime uint256[], rollingPeriodInDays uint256[], endTime uint256[], typeOfRestriction enum VolumeRestrictionTMStorage.RestrictionType[])
```

**Returns**

address List of the restricted addresses

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_holderToRestrictionType | mapping\(address =&gt; enum VolumeRestrictionTMStorage.TypeOfPeriod\) |  |
| \_individualRestrictions | struct VolumeRestrictionTMStorage.IndividualRestrictions |  |
| \_dataStore | IDataStore |  |

### \_setValues

```javascript
function _setValues(struct VolumeRestrictionTMStorage.VolumeRestriction _restriction, uint256[] _allowedTokens, uint256[] _startTime, uint256[] _rollingPeriodInDays, uint256[] _endTime, enum VolumeRestrictionTMStorage.RestrictionType[] _typeOfRestriction, uint256 _index) internal pure
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_restriction | struct VolumeRestrictionTMStorage.VolumeRestriction |  |
| \_allowedTokens | uint256\[\] |  |
| \_startTime | uint256\[\] |  |
| \_rollingPeriodInDays | uint256\[\] |  |
| \_endTime | uint256\[\] |  |
| \_typeOfRestriction | enum VolumeRestrictionTMStorage.RestrictionType\[\] |  |
| \_index | uint256 |  |

### \_isVolRestricted

```javascript
function _isVolRestricted(uint256 _flags) internal pure
returns(bool)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_flags | uint256 |  |

### \_getTypeOfPeriod

```javascript
function _getTypeOfPeriod(enum VolumeRestrictionTMStorage.TypeOfPeriod _currentTypeOfPeriod, enum VolumeRestrictionTMStorage.TypeOfPeriod _callFrom, uint256 _endTime) internal pure
returns(enum VolumeRestrictionTMStorage.TypeOfPeriod)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_currentTypeOfPeriod | enum VolumeRestrictionTMStorage.TypeOfPeriod |  |
| \_callFrom | enum VolumeRestrictionTMStorage.TypeOfPeriod |  |
| \_endTime | uint256 |  |

### \_isExistingInvestor

```javascript
function _isExistingInvestor(address _investor, IDataStore _dataStore) internal view
returns(bool)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_investor | address |  |
| \_dataStore | IDataStore |  |

### \_getKey

```javascript
function _getKey(bytes32 _key1, address _key2) internal pure
returns(bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key1 | bytes32 |  |
| \_key2 | address |  |

