---
id: version-3.0.0-IDataStore
title: IDataStore
original_id: IDataStore
---

# IDataStore.sol

View Source: [contracts/interfaces/IDataStore.sol](../../contracts/interfaces/IDataStore.sol)

**↘ Derived Contracts: [DataStore](DataStore.md)**

**IDataStore**

## Functions

- [setSecurityToken(address _securityToken)](#setsecuritytoken)
- [setUint256(bytes32 _key, uint256 _data)](#setuint256)
- [setBytes32(bytes32 _key, bytes32 _data)](#setbytes32)
- [setAddress(bytes32 _key, address _data)](#setaddress)
- [setString(bytes32 _key, string _data)](#setstring)
- [setBytes(bytes32 _key, bytes _data)](#setbytes)
- [setBool(bytes32 _key, bool _data)](#setbool)
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

### setSecurityToken

⤿ Overridden Implementation(s): [DataStore.setSecurityToken](DataStore.md#setsecuritytoken)

Changes security token atatched to this data store

```js
function setSecurityToken(address _securityToken) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _securityToken | address | address of the security token | 

### setUint256

⤿ Overridden Implementation(s): [DataStore.setUint256](DataStore.md#setuint256)

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

⤿ Overridden Implementation(s): [DataStore.setBytes32](DataStore.md#setbytes32)

```js
function setBytes32(bytes32 _key, bytes32 _data) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _data | bytes32 |  | 

### setAddress

⤿ Overridden Implementation(s): [DataStore.setAddress](DataStore.md#setaddress)

```js
function setAddress(bytes32 _key, address _data) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _data | address |  | 

### setString

⤿ Overridden Implementation(s): [DataStore.setString](DataStore.md#setstring)

```js
function setString(bytes32 _key, string _data) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _data | string |  | 

### setBytes

⤿ Overridden Implementation(s): [DataStore.setBytes](DataStore.md#setbytes)

```js
function setBytes(bytes32 _key, bytes _data) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _data | bytes |  | 

### setBool

⤿ Overridden Implementation(s): [DataStore.setBool](DataStore.md#setbool)

```js
function setBool(bytes32 _key, bool _data) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _data | bool |  | 

### setUint256Array

⤿ Overridden Implementation(s): [DataStore.setUint256Array](DataStore.md#setuint256array)

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

⤿ Overridden Implementation(s): [DataStore.setBytes32Array](DataStore.md#setbytes32array)

```js
function setBytes32Array(bytes32 _key, bytes32[] _data) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _data | bytes32[] |  | 

### setAddressArray

⤿ Overridden Implementation(s): [DataStore.setAddressArray](DataStore.md#setaddressarray)

```js
function setAddressArray(bytes32 _key, address[] _data) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _data | address[] |  | 

### setBoolArray

⤿ Overridden Implementation(s): [DataStore.setBoolArray](DataStore.md#setboolarray)

```js
function setBoolArray(bytes32 _key, bool[] _data) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _data | bool[] |  | 

### insertUint256

⤿ Overridden Implementation(s): [DataStore.insertUint256](DataStore.md#insertuint256)

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

⤿ Overridden Implementation(s): [DataStore.insertBytes32](DataStore.md#insertbytes32)

```js
function insertBytes32(bytes32 _key, bytes32 _data) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _data | bytes32 |  | 

### insertAddress

⤿ Overridden Implementation(s): [DataStore.insertAddress](DataStore.md#insertaddress)

```js
function insertAddress(bytes32 _key, address _data) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _data | address |  | 

### insertBool

⤿ Overridden Implementation(s): [DataStore.insertBool](DataStore.md#insertbool)

```js
function insertBool(bytes32 _key, bool _data) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _data | bool |  | 

### deleteUint256

⤿ Overridden Implementation(s): [DataStore.deleteUint256](DataStore.md#deleteuint256)

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

⤿ Overridden Implementation(s): [DataStore.deleteBytes32](DataStore.md#deletebytes32)

```js
function deleteBytes32(bytes32 _key, uint256 _index) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _index | uint256 |  | 

### deleteAddress

⤿ Overridden Implementation(s): [DataStore.deleteAddress](DataStore.md#deleteaddress)

```js
function deleteAddress(bytes32 _key, uint256 _index) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _index | uint256 |  | 

### deleteBool

⤿ Overridden Implementation(s): [DataStore.deleteBool](DataStore.md#deletebool)

```js
function deleteBool(bytes32 _key, uint256 _index) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _index | uint256 |  | 

### setUint256Multi

⤿ Overridden Implementation(s): [DataStore.setUint256Multi](DataStore.md#setuint256multi)

Stores multiple uint256 data against respective keys

```js
function setUint256Multi(bytes32[] _keys, uint256[] _data) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _keys | bytes32[] | Array of keys to identify the data | 
| _data | uint256[] | Array of data to be stored against the respective keys | 

### setBytes32Multi

⤿ Overridden Implementation(s): [DataStore.setBytes32Multi](DataStore.md#setbytes32multi)

```js
function setBytes32Multi(bytes32[] _keys, bytes32[] _data) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _keys | bytes32[] |  | 
| _data | bytes32[] |  | 

### setAddressMulti

⤿ Overridden Implementation(s): [DataStore.setAddressMulti](DataStore.md#setaddressmulti)

```js
function setAddressMulti(bytes32[] _keys, address[] _data) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _keys | bytes32[] |  | 
| _data | address[] |  | 

### setBoolMulti

⤿ Overridden Implementation(s): [DataStore.setBoolMulti](DataStore.md#setboolmulti)

```js
function setBoolMulti(bytes32[] _keys, bool[] _data) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _keys | bytes32[] |  | 
| _data | bool[] |  | 

### insertUint256Multi

⤿ Overridden Implementation(s): [DataStore.insertUint256Multi](DataStore.md#insertuint256multi)

Inserts multiple uint256 elements to the array identified by the respective keys

```js
function insertUint256Multi(bytes32[] _keys, uint256[] _data) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _keys | bytes32[] | Array of keys to identify the data | 
| _data | uint256[] | Array of data to be inserted in arrays of the respective keys | 

### insertBytes32Multi

⤿ Overridden Implementation(s): [DataStore.insertBytes32Multi](DataStore.md#insertbytes32multi)

```js
function insertBytes32Multi(bytes32[] _keys, bytes32[] _data) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _keys | bytes32[] |  | 
| _data | bytes32[] |  | 

### insertAddressMulti

⤿ Overridden Implementation(s): [DataStore.insertAddressMulti](DataStore.md#insertaddressmulti)

```js
function insertAddressMulti(bytes32[] _keys, address[] _data) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _keys | bytes32[] |  | 
| _data | address[] |  | 

### insertBoolMulti

⤿ Overridden Implementation(s): [DataStore.insertBoolMulti](DataStore.md#insertboolmulti)

```js
function insertBoolMulti(bytes32[] _keys, bool[] _data) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _keys | bytes32[] |  | 
| _data | bool[] |  | 

### getUint256

⤿ Overridden Implementation(s): [DataStore.getUint256](DataStore.md#getuint256)

```js
function getUint256(bytes32 _key) external view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 

### getBytes32

⤿ Overridden Implementation(s): [DataStore.getBytes32](DataStore.md#getbytes32)

```js
function getBytes32(bytes32 _key) external view
returns(bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 

### getAddress

⤿ Overridden Implementation(s): [DataStore.getAddress](DataStore.md#getaddress)

```js
function getAddress(bytes32 _key) external view
returns(address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 

### getString

⤿ Overridden Implementation(s): [DataStore.getString](DataStore.md#getstring)

```js
function getString(bytes32 _key) external view
returns(string)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 

### getBytes

⤿ Overridden Implementation(s): [DataStore.getBytes](DataStore.md#getbytes)

```js
function getBytes(bytes32 _key) external view
returns(bytes)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 

### getBool

⤿ Overridden Implementation(s): [DataStore.getBool](DataStore.md#getbool)

```js
function getBool(bytes32 _key) external view
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 

### getUint256Array

⤿ Overridden Implementation(s): [DataStore.getUint256Array](DataStore.md#getuint256array)

```js
function getUint256Array(bytes32 _key) external view
returns(uint256[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 

### getBytes32Array

⤿ Overridden Implementation(s): [DataStore.getBytes32Array](DataStore.md#getbytes32array)

```js
function getBytes32Array(bytes32 _key) external view
returns(bytes32[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 

### getAddressArray

⤿ Overridden Implementation(s): [DataStore.getAddressArray](DataStore.md#getaddressarray)

```js
function getAddressArray(bytes32 _key) external view
returns(address[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 

### getBoolArray

⤿ Overridden Implementation(s): [DataStore.getBoolArray](DataStore.md#getboolarray)

```js
function getBoolArray(bytes32 _key) external view
returns(bool[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 

### getUint256ArrayLength

⤿ Overridden Implementation(s): [DataStore.getUint256ArrayLength](DataStore.md#getuint256arraylength)

```js
function getUint256ArrayLength(bytes32 _key) external view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 

### getBytes32ArrayLength

⤿ Overridden Implementation(s): [DataStore.getBytes32ArrayLength](DataStore.md#getbytes32arraylength)

```js
function getBytes32ArrayLength(bytes32 _key) external view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 

### getAddressArrayLength

⤿ Overridden Implementation(s): [DataStore.getAddressArrayLength](DataStore.md#getaddressarraylength)

```js
function getAddressArrayLength(bytes32 _key) external view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 

### getBoolArrayLength

⤿ Overridden Implementation(s): [DataStore.getBoolArrayLength](DataStore.md#getboolarraylength)

```js
function getBoolArrayLength(bytes32 _key) external view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 

### getUint256ArrayElement

⤿ Overridden Implementation(s): [DataStore.getUint256ArrayElement](DataStore.md#getuint256arrayelement)

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

⤿ Overridden Implementation(s): [DataStore.getBytes32ArrayElement](DataStore.md#getbytes32arrayelement)

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

⤿ Overridden Implementation(s): [DataStore.getAddressArrayElement](DataStore.md#getaddressarrayelement)

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

⤿ Overridden Implementation(s): [DataStore.getBoolArrayElement](DataStore.md#getboolarrayelement)

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

⤿ Overridden Implementation(s): [DataStore.getUint256ArrayElements](DataStore.md#getuint256arrayelements)

```js
function getUint256ArrayElements(bytes32 _key, uint256 _startIndex, uint256 _endIndex) external view
returns(uint256[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _startIndex | uint256 |  | 
| _endIndex | uint256 |  | 

### getBytes32ArrayElements

⤿ Overridden Implementation(s): [DataStore.getBytes32ArrayElements](DataStore.md#getbytes32arrayelements)

```js
function getBytes32ArrayElements(bytes32 _key, uint256 _startIndex, uint256 _endIndex) external view
returns(bytes32[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _startIndex | uint256 |  | 
| _endIndex | uint256 |  | 

### getAddressArrayElements

⤿ Overridden Implementation(s): [DataStore.getAddressArrayElements](DataStore.md#getaddressarrayelements)

```js
function getAddressArrayElements(bytes32 _key, uint256 _startIndex, uint256 _endIndex) external view
returns(address[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _startIndex | uint256 |  | 
| _endIndex | uint256 |  | 

### getBoolArrayElements

⤿ Overridden Implementation(s): [DataStore.getBoolArrayElements](DataStore.md#getboolarrayelements)

```js
function getBoolArrayElements(bytes32 _key, uint256 _startIndex, uint256 _endIndex) external view
returns(bool[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _startIndex | uint256 |  | 
| _endIndex | uint256 |  | 

