---
id: version-3.0.0-BokkyPooBahsDateTimeLibrary
title: BokkyPooBahsDateTimeLibrary
original_id: BokkyPooBahsDateTimeLibrary
---

# BokkyPooBahsDateTimeLibrary.sol

View Source: [contracts/libraries/BokkyPooBahsDateTimeLibrary.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/libraries/BokkyPooBahsDateTimeLibrary.sol)

**BokkyPooBahsDateTimeLibrary**

## Contract Members

**Constants & Variables**

```javascript
uint256 internal constant SECONDS_PER_DAY;
uint256 internal constant SECONDS_PER_HOUR;
uint256 internal constant SECONDS_PER_MINUTE;
int256 internal constant OFFSET19700101;
uint256 internal constant DOW_MON;
uint256 internal constant DOW_TUE;
uint256 internal constant DOW_WED;
uint256 internal constant DOW_THU;
uint256 internal constant DOW_FRI;
uint256 internal constant DOW_SAT;
uint256 internal constant DOW_SUN;
```

## Functions

* [\_daysFromDate\(uint256 year, uint256 month, uint256 day\)](bokkypoobahsdatetimelibrary.md#_daysfromdate)
* [\_daysToDate\(uint256 \_days\)](bokkypoobahsdatetimelibrary.md#_daystodate)
* [timestampFromDate\(uint256 year, uint256 month, uint256 day\)](bokkypoobahsdatetimelibrary.md#timestampfromdate)
* [timestampFromDateTime\(uint256 year, uint256 month, uint256 day, uint256 hour, uint256 minute, uint256 second\)](bokkypoobahsdatetimelibrary.md#timestampfromdatetime)
* [timestampToDate\(uint256 timestamp\)](bokkypoobahsdatetimelibrary.md#timestamptodate)
* [timestampToDateTime\(uint256 timestamp\)](bokkypoobahsdatetimelibrary.md#timestamptodatetime)
* [isValidDate\(uint256 year, uint256 month, uint256 day\)](bokkypoobahsdatetimelibrary.md#isvaliddate)
* [isValidDateTime\(uint256 year, uint256 month, uint256 day, uint256 hour, uint256 minute, uint256 second\)](bokkypoobahsdatetimelibrary.md#isvaliddatetime)
* [isLeapYear\(uint256 timestamp\)](bokkypoobahsdatetimelibrary.md#isleapyear)
* [\_isLeapYear\(uint256 year\)](bokkypoobahsdatetimelibrary.md#_isleapyear)
* [isWeekDay\(uint256 timestamp\)](bokkypoobahsdatetimelibrary.md#isweekday)
* [isWeekEnd\(uint256 timestamp\)](bokkypoobahsdatetimelibrary.md#isweekend)
* [getDaysInMonth\(uint256 timestamp\)](bokkypoobahsdatetimelibrary.md#getdaysinmonth)
* [\_getDaysInMonth\(uint256 year, uint256 month\)](bokkypoobahsdatetimelibrary.md#_getdaysinmonth)
* [getDayOfWeek\(uint256 timestamp\)](bokkypoobahsdatetimelibrary.md#getdayofweek)
* [getYear\(uint256 timestamp\)](bokkypoobahsdatetimelibrary.md#getyear)
* [getMonth\(uint256 timestamp\)](bokkypoobahsdatetimelibrary.md#getmonth)
* [getDay\(uint256 timestamp\)](bokkypoobahsdatetimelibrary.md#getday)
* [getHour\(uint256 timestamp\)](bokkypoobahsdatetimelibrary.md#gethour)
* [getMinute\(uint256 timestamp\)](bokkypoobahsdatetimelibrary.md#getminute)
* [getSecond\(uint256 timestamp\)](bokkypoobahsdatetimelibrary.md#getsecond)
* [addYears\(uint256 timestamp, uint256 \_years\)](bokkypoobahsdatetimelibrary.md#addyears)
* [addMonths\(uint256 timestamp, uint256 \_months\)](bokkypoobahsdatetimelibrary.md#addmonths)
* [addDays\(uint256 timestamp, uint256 \_days\)](bokkypoobahsdatetimelibrary.md#adddays)
* [addHours\(uint256 timestamp, uint256 \_hours\)](bokkypoobahsdatetimelibrary.md#addhours)
* [addMinutes\(uint256 timestamp, uint256 \_minutes\)](bokkypoobahsdatetimelibrary.md#addminutes)
* [addSeconds\(uint256 timestamp, uint256 \_seconds\)](bokkypoobahsdatetimelibrary.md#addseconds)
* [subYears\(uint256 timestamp, uint256 \_years\)](bokkypoobahsdatetimelibrary.md#subyears)
* [subMonths\(uint256 timestamp, uint256 \_months\)](bokkypoobahsdatetimelibrary.md#submonths)
* [subDays\(uint256 timestamp, uint256 \_days\)](bokkypoobahsdatetimelibrary.md#subdays)
* [subHours\(uint256 timestamp, uint256 \_hours\)](bokkypoobahsdatetimelibrary.md#subhours)
* [subMinutes\(uint256 timestamp, uint256 \_minutes\)](bokkypoobahsdatetimelibrary.md#subminutes)
* [subSeconds\(uint256 timestamp, uint256 \_seconds\)](bokkypoobahsdatetimelibrary.md#subseconds)
* [diffYears\(uint256 fromTimestamp, uint256 toTimestamp\)](bokkypoobahsdatetimelibrary.md#diffyears)
* [diffMonths\(uint256 fromTimestamp, uint256 toTimestamp\)](bokkypoobahsdatetimelibrary.md#diffmonths)
* [diffDays\(uint256 fromTimestamp, uint256 toTimestamp\)](bokkypoobahsdatetimelibrary.md#diffdays)
* [diffHours\(uint256 fromTimestamp, uint256 toTimestamp\)](bokkypoobahsdatetimelibrary.md#diffhours)
* [diffMinutes\(uint256 fromTimestamp, uint256 toTimestamp\)](bokkypoobahsdatetimelibrary.md#diffminutes)
* [diffSeconds\(uint256 fromTimestamp, uint256 toTimestamp\)](bokkypoobahsdatetimelibrary.md#diffseconds)

### \_daysFromDate

```javascript
function _daysFromDate(uint256 year, uint256 month, uint256 day) internal pure
returns(_days uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| year | uint256 |  |
| month | uint256 |  |
| day | uint256 |  |

### \_daysToDate

```javascript
function _daysToDate(uint256 _days) internal pure
returns(year uint256, month uint256, day uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_days | uint256 |  |

### timestampFromDate

```javascript
function timestampFromDate(uint256 year, uint256 month, uint256 day) internal pure
returns(timestamp uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| year | uint256 |  |
| month | uint256 |  |
| day | uint256 |  |

### timestampFromDateTime

```javascript
function timestampFromDateTime(uint256 year, uint256 month, uint256 day, uint256 hour, uint256 minute, uint256 second) internal pure
returns(timestamp uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| year | uint256 |  |
| month | uint256 |  |
| day | uint256 |  |
| hour | uint256 |  |
| minute | uint256 |  |
| second | uint256 |  |

### timestampToDate

```javascript
function timestampToDate(uint256 timestamp) internal pure
returns(year uint256, month uint256, day uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| timestamp | uint256 |  |

### timestampToDateTime

```javascript
function timestampToDateTime(uint256 timestamp) internal pure
returns(year uint256, month uint256, day uint256, hour uint256, minute uint256, second uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| timestamp | uint256 |  |

### isValidDate

```javascript
function isValidDate(uint256 year, uint256 month, uint256 day) internal pure
returns(valid bool)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| year | uint256 |  |
| month | uint256 |  |
| day | uint256 |  |

### isValidDateTime

```javascript
function isValidDateTime(uint256 year, uint256 month, uint256 day, uint256 hour, uint256 minute, uint256 second) internal pure
returns(valid bool)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| year | uint256 |  |
| month | uint256 |  |
| day | uint256 |  |
| hour | uint256 |  |
| minute | uint256 |  |
| second | uint256 |  |

### isLeapYear

```javascript
function isLeapYear(uint256 timestamp) internal pure
returns(leapYear bool)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| timestamp | uint256 |  |

### \_isLeapYear

```javascript
function _isLeapYear(uint256 year) internal pure
returns(leapYear bool)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| year | uint256 |  |

### isWeekDay

```javascript
function isWeekDay(uint256 timestamp) internal pure
returns(weekDay bool)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| timestamp | uint256 |  |

### isWeekEnd

```javascript
function isWeekEnd(uint256 timestamp) internal pure
returns(weekEnd bool)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| timestamp | uint256 |  |

### getDaysInMonth

```javascript
function getDaysInMonth(uint256 timestamp) internal pure
returns(daysInMonth uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| timestamp | uint256 |  |

### \_getDaysInMonth

```javascript
function _getDaysInMonth(uint256 year, uint256 month) internal pure
returns(daysInMonth uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| year | uint256 |  |
| month | uint256 |  |

### getDayOfWeek

```javascript
function getDayOfWeek(uint256 timestamp) internal pure
returns(dayOfWeek uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| timestamp | uint256 |  |

### getYear

```javascript
function getYear(uint256 timestamp) internal pure
returns(year uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| timestamp | uint256 |  |

### getMonth

```javascript
function getMonth(uint256 timestamp) internal pure
returns(month uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| timestamp | uint256 |  |

### getDay

```javascript
function getDay(uint256 timestamp) internal pure
returns(day uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| timestamp | uint256 |  |

### getHour

```javascript
function getHour(uint256 timestamp) internal pure
returns(hour uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| timestamp | uint256 |  |

### getMinute

```javascript
function getMinute(uint256 timestamp) internal pure
returns(minute uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| timestamp | uint256 |  |

### getSecond

```javascript
function getSecond(uint256 timestamp) internal pure
returns(second uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| timestamp | uint256 |  |

### addYears

```javascript
function addYears(uint256 timestamp, uint256 _years) internal pure
returns(newTimestamp uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| timestamp | uint256 |  |
| \_years | uint256 |  |

### addMonths

```javascript
function addMonths(uint256 timestamp, uint256 _months) internal pure
returns(newTimestamp uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| timestamp | uint256 |  |
| \_months | uint256 |  |

### addDays

```javascript
function addDays(uint256 timestamp, uint256 _days) internal pure
returns(newTimestamp uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| timestamp | uint256 |  |
| \_days | uint256 |  |

### addHours

```javascript
function addHours(uint256 timestamp, uint256 _hours) internal pure
returns(newTimestamp uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| timestamp | uint256 |  |
| \_hours | uint256 |  |

### addMinutes

```javascript
function addMinutes(uint256 timestamp, uint256 _minutes) internal pure
returns(newTimestamp uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| timestamp | uint256 |  |
| \_minutes | uint256 |  |

### addSeconds

```javascript
function addSeconds(uint256 timestamp, uint256 _seconds) internal pure
returns(newTimestamp uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| timestamp | uint256 |  |
| \_seconds | uint256 |  |

### subYears

```javascript
function subYears(uint256 timestamp, uint256 _years) internal pure
returns(newTimestamp uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| timestamp | uint256 |  |
| \_years | uint256 |  |

### subMonths

```javascript
function subMonths(uint256 timestamp, uint256 _months) internal pure
returns(newTimestamp uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| timestamp | uint256 |  |
| \_months | uint256 |  |

### subDays

```javascript
function subDays(uint256 timestamp, uint256 _days) internal pure
returns(newTimestamp uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| timestamp | uint256 |  |
| \_days | uint256 |  |

### subHours

```javascript
function subHours(uint256 timestamp, uint256 _hours) internal pure
returns(newTimestamp uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| timestamp | uint256 |  |
| \_hours | uint256 |  |

### subMinutes

```javascript
function subMinutes(uint256 timestamp, uint256 _minutes) internal pure
returns(newTimestamp uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| timestamp | uint256 |  |
| \_minutes | uint256 |  |

### subSeconds

```javascript
function subSeconds(uint256 timestamp, uint256 _seconds) internal pure
returns(newTimestamp uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| timestamp | uint256 |  |
| \_seconds | uint256 |  |

### diffYears

```javascript
function diffYears(uint256 fromTimestamp, uint256 toTimestamp) internal pure
returns(_years uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| fromTimestamp | uint256 |  |
| toTimestamp | uint256 |  |

### diffMonths

```javascript
function diffMonths(uint256 fromTimestamp, uint256 toTimestamp) internal pure
returns(_months uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| fromTimestamp | uint256 |  |
| toTimestamp | uint256 |  |

### diffDays

```javascript
function diffDays(uint256 fromTimestamp, uint256 toTimestamp) internal pure
returns(_days uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| fromTimestamp | uint256 |  |
| toTimestamp | uint256 |  |

### diffHours

```javascript
function diffHours(uint256 fromTimestamp, uint256 toTimestamp) internal pure
returns(_hours uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| fromTimestamp | uint256 |  |
| toTimestamp | uint256 |  |

### diffMinutes

```javascript
function diffMinutes(uint256 fromTimestamp, uint256 toTimestamp) internal pure
returns(_minutes uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| fromTimestamp | uint256 |  |
| toTimestamp | uint256 |  |

### diffSeconds

```javascript
function diffSeconds(uint256 fromTimestamp, uint256 toTimestamp) internal pure
returns(_seconds uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| fromTimestamp | uint256 |  |
| toTimestamp | uint256 |  |

