---
id: version-3.0.0-Util
title: Util
original_id: Util
---

# Utility contract for reusable code (Util.sol)

View Source: [contracts/libraries/Util.sol](../../contracts/libraries/Util.sol)

**Util**

## Functions

- [upper(string _base)](#upper)
- [stringToBytes32(string _source)](#stringtobytes32)
- [bytesToBytes32(bytes _b, uint256 _offset)](#bytestobytes32)
- [bytes32ToString(bytes32 _source)](#bytes32tostring)
- [getSig(bytes _data)](#getsig)

### upper

Changes a string to upper case

```js
function upper(string _base) internal pure
returns(string)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _base | string | String to change | 

### stringToBytes32

```js
function stringToBytes32(string _source) internal pure
returns(bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _source | string |  | 

### bytesToBytes32

```js
function bytesToBytes32(bytes _b, uint256 _offset) internal pure
returns(bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _b | bytes |  | 
| _offset | uint256 |  | 

### bytes32ToString

Changes the bytes32 into string

```js
function bytes32ToString(bytes32 _source) internal pure
returns(string)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _source | bytes32 | that need to convert into string | 

### getSig

Gets function signature from _data

```js
function getSig(bytes _data) internal pure
returns(sig bytes4)
```

**Returns**

bytes4 sig

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _data | bytes | Passed data | 

