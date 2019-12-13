---
id: version-3.0.0-DataStore
title: DataStore
original_id: DataStore
---

# Data store contract that stores data for all the modules in a central contract. (DataStore.sol)

View Source: [contracts/datastore/DataStore.sol](../../contracts/datastore/DataStore.sol)

**↗ Extends: [DataStoreStorage](DataStoreStorage.md), [IDataStore](IDataStore.md)**

**DataStore**

**Events**

```js
event SecurityTokenChanged(address indexed _oldSecurityToken, address indexed _newSecurityToken);
```

## Modifiers

- [validKey](#validkey)
- [validArrayLength](#validarraylength)
- [onlyOwner](#onlyowner)

### validKey

```js
modifier validKey(bytes32 _key) internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 

### validArrayLength

```js
modifier validArrayLength(uint256 _keyLength, uint256 _dataLength) internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _keyLength | uint256 |  | 
| _dataLength | uint256 |  | 

### onlyOwner

```js
modifier onlyOwner() internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

## Functions

- [_isAuthorized()](#_isauthorized)
- [setSecurityToken(address _securityToken)](#setsecuritytoken)
- [setUint256(bytes32 _key, uint256 _data)](#setuint256)
- [setBytes32(bytes32 _key, bytes32 _data)](#setbytes32)
- [setAddress(bytes32 _key, address _data)](#setaddress)
- [setBool(bytes32 _key, bool _data)](#setbool)
- [setString(bytes32 _key, string _data)](#setstring)
- [setBytes(bytes32 _key, bytes _data)](#setbytes)
- [setUint256Array(bytes32 _key, uint256[] _data)](#setuint256array)
- [setBytes32Array(bytes32 _key, bytes32[] _data)](#setbytes32array)
- [setAddressArray(bytes32 _key, address[] _data)](#setaddressarray)
- [setBoolArray(bytes32 _key, bool[] _data)](#setboolarray)
- [insertUint256(bytes32 _key, uint256 _data)](#insertuint256)
- [insertBytes32(bytes32 _key, bytes32 _data)](#insertbytes32)
- [insertAddress(bytes32 _key, address _data)](#insertaddress)
- [insertBool(bytes32 _key, bool _data)](#insertbool)
- [deleteUint256(bytes32 _key, uint256 _index)](#deleteuint256)
- [deleteBytes32(bytes32 _key, uint256 _index)](#deletebytes32)
- [deleteAddress(bytes32 _key, uint256 _index)](#deleteaddress)
- [deleteBool(bytes32 _key, uint256 _index)](#deletebool)
- [setUint256Multi(bytes32[] _keys, uint256[] _data)](#setuint256multi)
- [setBytes32Multi(bytes32[] _keys, bytes32[] _data)](#setbytes32multi)
- [setAddressMulti(bytes32[] _keys, address[] _data)](#setaddressmulti)
- [setBoolMulti(bytes32[] _keys, bool[] _data)](#setboolmulti)
- [insertUint256Multi(bytes32[] _keys, uint256[] _data)](#insertuint256multi)
- [insertBytes32Multi(bytes32[] _keys, bytes32[] _data)](#insertbytes32multi)
- [insertAddressMulti(bytes32[] _keys, address[] _data)](#insertaddressmulti)
- [insertBoolMulti(bytes32[] _keys, bool[] _data)](#insertboolmulti)
- [getUint256(bytes32 _key)](#getuint256)
- [getBytes32(bytes32 _key)](#getbytes32)
- [getAddress(bytes32 _key)](#getaddress)
- [getString(bytes32 _key)](#getstring)
- [getBytes(bytes32 _key)](#getbytes)
- [getBool(bytes32 _key)](#getbool)
- [getUint256Array(bytes32 _key)](#getuint256array)
- [getBytes32Array(bytes32 _key)](#getbytes32array)
- [getAddressArray(bytes32 _key)](#getaddressarray)
- [getBoolArray(bytes32 _key)](#getboolarray)
- [getUint256ArrayLength(bytes32 _key)](#getuint256arraylength)
- [getBytes32ArrayLength(bytes32 _key)](#getbytes32arraylength)
- [getAddressArrayLength(bytes32 _key)](#getaddressarraylength)
- [getBoolArrayLength(bytes32 _key)](#getboolarraylength)
- [getUint256ArrayElement(bytes32 _key, uint256 _index)](#getuint256arrayelement)
- [getBytes32ArrayElement(bytes32 _key, uint256 _index)](#getbytes32arrayelement)
- [getAddressArrayElement(bytes32 _key, uint256 _index)](#getaddressarrayelement)
- [getBoolArrayElement(bytes32 _key, uint256 _index)](#getboolarrayelement)
- [getUint256ArrayElements(bytes32 _key, uint256 _startIndex, uint256 _endIndex)](#getuint256arrayelements)
- [getBytes32ArrayElements(bytes32 _key, uint256 _startIndex, uint256 _endIndex)](#getbytes32arrayelements)
- [getAddressArrayElements(bytes32 _key, uint256 _startIndex, uint256 _endIndex)](#getaddressarrayelements)
- [getBoolArrayElements(bytes32 _key, uint256 _startIndex, uint256 _endIndex)](#getboolarrayelements)
- [_setData(bytes32 _key, uint256 _data, bool _insert)](#_setdata)
- [_setData(bytes32 _key, bytes32 _data, bool _insert)](#_setdata)
- [_setData(bytes32 _key, address _data, bool _insert)](#_setdata)
- [_setData(bytes32 _key, bool _data, bool _insert)](#_setdata)
- [_setData(bytes32 _key, string _data)](#_setdata)
- [_setData(bytes32 _key, bytes _data)](#_setdata)
- [_setData(bytes32 _key, uint256[] _data)](#_setdata)
- [_setData(bytes32 _key, bytes32[] _data)](#_setdata)
- [_setData(bytes32 _key, address[] _data)](#_setdata)
- [_setData(bytes32 _key, bool[] _data)](#_setdata)
- [_deleteUint(bytes32 _key, uint256 _index)](#_deleteuint)
- [_deleteBytes32(bytes32 _key, uint256 _index)](#_deletebytes32)
- [_deleteAddress(bytes32 _key, uint256 _index)](#_deleteaddress)
- [_deleteBool(bytes32 _key, uint256 _index)](#_deletebool)

### _isAuthorized

```js
function _isAuthorized() internal view
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### setSecurityToken

⤾ overrides [IDataStore.setSecurityToken](IDataStore.md#setsecuritytoken)

Changes security token atatched to this data store

```js
function setSecurityToken(address _securityToken) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _securityToken | address | address of the security token | 

### setUint256

⤾ overrides [IDataStore.setUint256](IDataStore.md#setuint256)

Stores a uint256 data against a key

```js
function setUint256(bytes32 _key, uint256 _data) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 | Unique key to identify the data | 
| _data | uint256 | Data to be stored against the key | 

### setBytes32

⤾ overrides [IDataStore.setBytes32](IDataStore.md#setbytes32)

```js
function setBytes32(bytes32 _key, bytes32 _data) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _data | bytes32 |  | 

### setAddress

⤾ overrides [IDataStore.setAddress](IDataStore.md#setaddress)

```js
function setAddress(bytes32 _key, address _data) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _data | address |  | 

### setBool

⤾ overrides [IDataStore.setBool](IDataStore.md#setbool)

```js
function setBool(bytes32 _key, bool _data) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _data | bool |  | 

### setString

⤾ overrides [IDataStore.setString](IDataStore.md#setstring)

```js
function setString(bytes32 _key, string _data) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _data | string |  | 

### setBytes

⤾ overrides [IDataStore.setBytes](IDataStore.md#setbytes)

```js
function setBytes(bytes32 _key, bytes _data) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _data | bytes |  | 

### setUint256Array

⤾ overrides [IDataStore.setUint256Array](IDataStore.md#setuint256array)

Stores a uint256 array against a key

```js
function setUint256Array(bytes32 _key, uint256[] _data) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 | Unique key to identify the array | 
| _data | uint256[] | Array to be stored against the key | 

### setBytes32Array

⤾ overrides [IDataStore.setBytes32Array](IDataStore.md#setbytes32array)

```js
function setBytes32Array(bytes32 _key, bytes32[] _data) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _data | bytes32[] |  | 

### setAddressArray

⤾ overrides [IDataStore.setAddressArray](IDataStore.md#setaddressarray)

```js
function setAddressArray(bytes32 _key, address[] _data) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _data | address[] |  | 

### setBoolArray

⤾ overrides [IDataStore.setBoolArray](IDataStore.md#setboolarray)

```js
function setBoolArray(bytes32 _key, bool[] _data) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _data | bool[] |  | 

### insertUint256

⤾ overrides [IDataStore.insertUint256](IDataStore.md#insertuint256)

Inserts a uint256 element to the array identified by the key

```js
function insertUint256(bytes32 _key, uint256 _data) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 | Unique key to identify the array | 
| _data | uint256 | Element to push into the array | 

### insertBytes32

⤾ overrides [IDataStore.insertBytes32](IDataStore.md#insertbytes32)

```js
function insertBytes32(bytes32 _key, bytes32 _data) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _data | bytes32 |  | 

### insertAddress

⤾ overrides [IDataStore.insertAddress](IDataStore.md#insertaddress)

```js
function insertAddress(bytes32 _key, address _data) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _data | address |  | 

### insertBool

⤾ overrides [IDataStore.insertBool](IDataStore.md#insertbool)

```js
function insertBool(bytes32 _key, bool _data) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _data | bool |  | 

### deleteUint256

⤾ overrides [IDataStore.deleteUint256](IDataStore.md#deleteuint256)

Deletes an element from the array identified by the key.
When an element is deleted from an Array, last element of that array is moved to the index of deleted element.

```js
function deleteUint256(bytes32 _key, uint256 _index) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 | Unique key to identify the array | 
| _index | uint256 | Index of the element to delete | 

### deleteBytes32

⤾ overrides [IDataStore.deleteBytes32](IDataStore.md#deletebytes32)

```js
function deleteBytes32(bytes32 _key, uint256 _index) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _index | uint256 |  | 

### deleteAddress

⤾ overrides [IDataStore.deleteAddress](IDataStore.md#deleteaddress)

```js
function deleteAddress(bytes32 _key, uint256 _index) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _index | uint256 |  | 

### deleteBool

⤾ overrides [IDataStore.deleteBool](IDataStore.md#deletebool)

```js
function deleteBool(bytes32 _key, uint256 _index) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _index | uint256 |  | 

### setUint256Multi

⤾ overrides [IDataStore.setUint256Multi](IDataStore.md#setuint256multi)

Stores multiple uint256 data against respective keys

```js
function setUint256Multi(bytes32[] _keys, uint256[] _data) public nonpayable validArrayLength 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _keys | bytes32[] | Array of keys to identify the data | 
| _data | uint256[] | Array of data to be stored against the respective keys | 

### setBytes32Multi

⤾ overrides [IDataStore.setBytes32Multi](IDataStore.md#setbytes32multi)

```js
function setBytes32Multi(bytes32[] _keys, bytes32[] _data) public nonpayable validArrayLength 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _keys | bytes32[] |  | 
| _data | bytes32[] |  | 

### setAddressMulti

⤾ overrides [IDataStore.setAddressMulti](IDataStore.md#setaddressmulti)

```js
function setAddressMulti(bytes32[] _keys, address[] _data) public nonpayable validArrayLength 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _keys | bytes32[] |  | 
| _data | address[] |  | 

### setBoolMulti

⤾ overrides [IDataStore.setBoolMulti](IDataStore.md#setboolmulti)

```js
function setBoolMulti(bytes32[] _keys, bool[] _data) public nonpayable validArrayLength 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _keys | bytes32[] |  | 
| _data | bool[] |  | 

### insertUint256Multi

⤾ overrides [IDataStore.insertUint256Multi](IDataStore.md#insertuint256multi)

Inserts multiple uint256 elements to the array identified by the respective keys

```js
function insertUint256Multi(bytes32[] _keys, uint256[] _data) public nonpayable validArrayLength 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _keys | bytes32[] | Array of keys to identify the data | 
| _data | uint256[] | Array of data to be inserted in arrays of the respective keys | 

### insertBytes32Multi

⤾ overrides [IDataStore.insertBytes32Multi](IDataStore.md#insertbytes32multi)

```js
function insertBytes32Multi(bytes32[] _keys, bytes32[] _data) public nonpayable validArrayLength 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _keys | bytes32[] |  | 
| _data | bytes32[] |  | 

### insertAddressMulti

⤾ overrides [IDataStore.insertAddressMulti](IDataStore.md#insertaddressmulti)

```js
function insertAddressMulti(bytes32[] _keys, address[] _data) public nonpayable validArrayLength 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _keys | bytes32[] |  | 
| _data | address[] |  | 

### insertBoolMulti

⤾ overrides [IDataStore.insertBoolMulti](IDataStore.md#insertboolmulti)

```js
function insertBoolMulti(bytes32[] _keys, bool[] _data) public nonpayable validArrayLength 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _keys | bytes32[] |  | 
| _data | bool[] |  | 

### getUint256

⤾ overrides [IDataStore.getUint256](IDataStore.md#getuint256)

```js
function getUint256(bytes32 _key) external view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 

### getBytes32

⤾ overrides [IDataStore.getBytes32](IDataStore.md#getbytes32)

```js
function getBytes32(bytes32 _key) external view
returns(bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 

### getAddress

⤾ overrides [IDataStore.getAddress](IDataStore.md#getaddress)

```js
function getAddress(bytes32 _key) external view
returns(address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 

### getString

⤾ overrides [IDataStore.getString](IDataStore.md#getstring)

```js
function getString(bytes32 _key) external view
returns(string)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 

### getBytes

⤾ overrides [IDataStore.getBytes](IDataStore.md#getbytes)

```js
function getBytes(bytes32 _key) external view
returns(bytes)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 

### getBool

⤾ overrides [IDataStore.getBool](IDataStore.md#getbool)

```js
function getBool(bytes32 _key) external view
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 

### getUint256Array

⤾ overrides [IDataStore.getUint256Array](IDataStore.md#getuint256array)

```js
function getUint256Array(bytes32 _key) external view
returns(uint256[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 

### getBytes32Array

⤾ overrides [IDataStore.getBytes32Array](IDataStore.md#getbytes32array)

```js
function getBytes32Array(bytes32 _key) external view
returns(bytes32[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 

### getAddressArray

⤾ overrides [IDataStore.getAddressArray](IDataStore.md#getaddressarray)

```js
function getAddressArray(bytes32 _key) external view
returns(address[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 

### getBoolArray

⤾ overrides [IDataStore.getBoolArray](IDataStore.md#getboolarray)

```js
function getBoolArray(bytes32 _key) external view
returns(bool[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 

### getUint256ArrayLength

⤾ overrides [IDataStore.getUint256ArrayLength](IDataStore.md#getuint256arraylength)

```js
function getUint256ArrayLength(bytes32 _key) external view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 

### getBytes32ArrayLength

⤾ overrides [IDataStore.getBytes32ArrayLength](IDataStore.md#getbytes32arraylength)

```js
function getBytes32ArrayLength(bytes32 _key) external view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 

### getAddressArrayLength

⤾ overrides [IDataStore.getAddressArrayLength](IDataStore.md#getaddressarraylength)

```js
function getAddressArrayLength(bytes32 _key) external view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 

### getBoolArrayLength

⤾ overrides [IDataStore.getBoolArrayLength](IDataStore.md#getboolarraylength)

```js
function getBoolArrayLength(bytes32 _key) external view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 

### getUint256ArrayElement

⤾ overrides [IDataStore.getUint256ArrayElement](IDataStore.md#getuint256arrayelement)

```js
function getUint256ArrayElement(bytes32 _key, uint256 _index) external view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _index | uint256 |  | 

### getBytes32ArrayElement

⤾ overrides [IDataStore.getBytes32ArrayElement](IDataStore.md#getbytes32arrayelement)

```js
function getBytes32ArrayElement(bytes32 _key, uint256 _index) external view
returns(bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _index | uint256 |  | 

### getAddressArrayElement

⤾ overrides [IDataStore.getAddressArrayElement](IDataStore.md#getaddressarrayelement)

```js
function getAddressArrayElement(bytes32 _key, uint256 _index) external view
returns(address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _index | uint256 |  | 

### getBoolArrayElement

⤾ overrides [IDataStore.getBoolArrayElement](IDataStore.md#getboolarrayelement)

```js
function getBoolArrayElement(bytes32 _key, uint256 _index) external view
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _index | uint256 |  | 

### getUint256ArrayElements

⤾ overrides [IDataStore.getUint256ArrayElements](IDataStore.md#getuint256arrayelements)

```js
function getUint256ArrayElements(bytes32 _key, uint256 _startIndex, uint256 _endIndex) public view
returns(array uint256[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _startIndex | uint256 |  | 
| _endIndex | uint256 |  | 

### getBytes32ArrayElements

⤾ overrides [IDataStore.getBytes32ArrayElements](IDataStore.md#getbytes32arrayelements)

```js
function getBytes32ArrayElements(bytes32 _key, uint256 _startIndex, uint256 _endIndex) public view
returns(array bytes32[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _startIndex | uint256 |  | 
| _endIndex | uint256 |  | 

### getAddressArrayElements

⤾ overrides [IDataStore.getAddressArrayElements](IDataStore.md#getaddressarrayelements)

```js
function getAddressArrayElements(bytes32 _key, uint256 _startIndex, uint256 _endIndex) public view
returns(array address[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _startIndex | uint256 |  | 
| _endIndex | uint256 |  | 

### getBoolArrayElements

⤾ overrides [IDataStore.getBoolArrayElements](IDataStore.md#getboolarrayelements)

```js
function getBoolArrayElements(bytes32 _key, uint256 _startIndex, uint256 _endIndex) public view
returns(array bool[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _startIndex | uint256 |  | 
| _endIndex | uint256 |  | 

### _setData

```js
function _setData(bytes32 _key, uint256 _data, bool _insert) internal nonpayable validKey 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _data | uint256 |  | 
| _insert | bool |  | 

### _setData

```js
function _setData(bytes32 _key, bytes32 _data, bool _insert) internal nonpayable validKey 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _data | bytes32 |  | 
| _insert | bool |  | 

### _setData

```js
function _setData(bytes32 _key, address _data, bool _insert) internal nonpayable validKey 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _data | address |  | 
| _insert | bool |  | 

### _setData

```js
function _setData(bytes32 _key, bool _data, bool _insert) internal nonpayable validKey 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _data | bool |  | 
| _insert | bool |  | 

### _setData

```js
function _setData(bytes32 _key, string _data) internal nonpayable validKey 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _data | string |  | 

### _setData

```js
function _setData(bytes32 _key, bytes _data) internal nonpayable validKey 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _data | bytes |  | 

### _setData

```js
function _setData(bytes32 _key, uint256[] _data) internal nonpayable validKey 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _data | uint256[] |  | 

### _setData

```js
function _setData(bytes32 _key, bytes32[] _data) internal nonpayable validKey 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _data | bytes32[] |  | 

### _setData

```js
function _setData(bytes32 _key, address[] _data) internal nonpayable validKey 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _data | address[] |  | 

### _setData

```js
function _setData(bytes32 _key, bool[] _data) internal nonpayable validKey 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _data | bool[] |  | 

### _deleteUint

```js
function _deleteUint(bytes32 _key, uint256 _index) internal nonpayable validKey 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _index | uint256 |  | 

### _deleteBytes32

```js
function _deleteBytes32(bytes32 _key, uint256 _index) internal nonpayable validKey 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _index | uint256 |  | 

### _deleteAddress

```js
function _deleteAddress(bytes32 _key, uint256 _index) internal nonpayable validKey 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _index | uint256 |  | 

### _deleteBool

```js
function _deleteBool(bytes32 _key, uint256 _index) internal nonpayable validKey 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _index | uint256 |  | 

