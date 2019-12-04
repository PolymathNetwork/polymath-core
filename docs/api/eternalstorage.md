---
id: version-3.0.0-EternalStorage
title: EternalStorage
original_id: EternalStorage
---

# EternalStorage.sol

View Source: [contracts/storage/EternalStorage.sol](../../contracts/storage/EternalStorage.sol)

**↘ Derived Contracts: [ModuleRegistry](ModuleRegistry.md), [ModuleRegistryProxy](ModuleRegistryProxy.md), [SecurityTokenRegistry](SecurityTokenRegistry.md), [SecurityTokenRegistryProxy](SecurityTokenRegistryProxy.md), [STRGetter](STRGetter.md)**

**EternalStorage**

## Contract Members
**Constants & Variables**

```js
mapping(bytes32 => uint256) internal uintStorage;
mapping(bytes32 => string) internal stringStorage;
mapping(bytes32 => address) internal addressStorage;
mapping(bytes32 => bytes) internal bytesStorage;
mapping(bytes32 => bool) internal boolStorage;
mapping(bytes32 => int256) internal intStorage;
mapping(bytes32 => bytes32) internal bytes32Storage;
mapping(bytes32 => bytes32[]) internal bytes32ArrayStorage;
mapping(bytes32 => uint256[]) internal uintArrayStorage;
mapping(bytes32 => address[]) internal addressArrayStorage;
mapping(bytes32 => string[]) internal stringArrayStorage;

```

## Functions

- [set(bytes32 _key, uint256 _value)](#set)
- [set(bytes32 _key, address _value)](#set)
- [set(bytes32 _key, bool _value)](#set)
- [set(bytes32 _key, bytes32 _value)](#set)
- [set(bytes32 _key, string _value)](#set)
- [set(bytes32 _key, bytes _value)](#set)
- [deleteArrayAddress(bytes32 _key, uint256 _index)](#deletearrayaddress)
- [deleteArrayBytes32(bytes32 _key, uint256 _index)](#deletearraybytes32)
- [deleteArrayUint(bytes32 _key, uint256 _index)](#deletearrayuint)
- [deleteArrayString(bytes32 _key, uint256 _index)](#deletearraystring)
- [pushArray(bytes32 _key, address _value)](#pusharray)
- [pushArray(bytes32 _key, bytes32 _value)](#pusharray)
- [pushArray(bytes32 _key, string _value)](#pusharray)
- [pushArray(bytes32 _key, uint256 _value)](#pusharray)
- [setArray(bytes32 _key, address[] _value)](#setarray)
- [setArray(bytes32 _key, uint256[] _value)](#setarray)
- [setArray(bytes32 _key, bytes32[] _value)](#setarray)
- [setArray(bytes32 _key, string[] _value)](#setarray)
- [getArrayAddress(bytes32 _key)](#getarrayaddress)
- [getArrayBytes32(bytes32 _key)](#getarraybytes32)
- [getArrayUint(bytes32 _key)](#getarrayuint)
- [setArrayIndexValue(bytes32 _key, uint256 _index, address _value)](#setarrayindexvalue)
- [setArrayIndexValue(bytes32 _key, uint256 _index, uint256 _value)](#setarrayindexvalue)
- [setArrayIndexValue(bytes32 _key, uint256 _index, bytes32 _value)](#setarrayindexvalue)
- [setArrayIndexValue(bytes32 _key, uint256 _index, string _value)](#setarrayindexvalue)
- [getUintValue(bytes32 _variable)](#getuintvalue)
- [getBoolValue(bytes32 _variable)](#getboolvalue)
- [getStringValue(bytes32 _variable)](#getstringvalue)
- [getAddressValue(bytes32 _variable)](#getaddressvalue)
- [getBytes32Value(bytes32 _variable)](#getbytes32value)
- [getBytesValue(bytes32 _variable)](#getbytesvalue)

### set

Set the key values using the Overloaded `set` functions
 Ex- string version = "0.0.1"; replace to
 set(keccak256(abi.encodePacked("version"), "0.0.1");
 same for the other variables as well some more example listed below
 ex1 - address securityTokenAddress = 0x123; replace to
 set(keccak256(abi.encodePacked("securityTokenAddress"), 0x123);
 ex2 - bytes32 tokenDetails = "I am ST20"; replace to
 set(keccak256(abi.encodePacked("tokenDetails"), "I am ST20");
 ex3 - mapping(string => address) ownedToken;
 set(keccak256(abi.encodePacked("ownedToken", "Chris")), 0x123);
 ex4 - mapping(string => uint) tokenIndex;
 tokenIndex["TOKEN"] = 1; replace to set(keccak256(abi.encodePacked("tokenIndex", "TOKEN"), 1);
 ex5 - mapping(string => SymbolDetails) registeredSymbols; where SymbolDetails is the structure having different type of values as
 {uint256 date, string name, address owner} etc.
 registeredSymbols["TOKEN"].name = "MyFristToken"; replace to set(keccak256(abi.encodePacked("registeredSymbols_name", "TOKEN"), "MyFirstToken");
 More generalized- set(keccak256(abi.encodePacked("registeredSymbols_<struct variable>", "keyname"), "value");

```js
function set(bytes32 _key, uint256 _value) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _value | uint256 |  | 

### set

```js
function set(bytes32 _key, address _value) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _value | address |  | 

### set

```js
function set(bytes32 _key, bool _value) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _value | bool |  | 

### set

```js
function set(bytes32 _key, bytes32 _value) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _value | bytes32 |  | 

### set

```js
function set(bytes32 _key, string _value) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _value | string |  | 

### set

```js
function set(bytes32 _key, bytes _value) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _value | bytes |  | 

### deleteArrayAddress

Function used to delete the array element.
 Ex1- mapping(address => bytes32[]) tokensOwnedByOwner;
 For deleting the item from array developers needs to create a funtion for that similarly
 in this case we have the helper function deleteArrayBytes32() which will do it for us
 deleteArrayBytes32(keccak256(abi.encodePacked("tokensOwnedByOwner", 0x1), 3); -- it will delete the index 3

```js
function deleteArrayAddress(bytes32 _key, uint256 _index) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _index | uint256 |  | 

### deleteArrayBytes32

```js
function deleteArrayBytes32(bytes32 _key, uint256 _index) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _index | uint256 |  | 

### deleteArrayUint

```js
function deleteArrayUint(bytes32 _key, uint256 _index) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _index | uint256 |  | 

### deleteArrayString

```js
function deleteArrayString(bytes32 _key, uint256 _index) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _index | uint256 |  | 

### pushArray

Below are the helper functions to facilitate storing arrays of different data types.
 Ex1- mapping(address => bytes32[]) tokensOwnedByTicker;
 tokensOwnedByTicker[owner] = tokensOwnedByTicker[owner].push("xyz"); replace with
 pushArray(keccak256(abi.encodePacked("tokensOwnedByTicker", owner), "xyz");

```js
function pushArray(bytes32 _key, address _value) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 | bytes32 type | 
| _value | address | [uint256, string, bytes32, address] any of the data type in array | 

### pushArray

```js
function pushArray(bytes32 _key, bytes32 _value) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _value | bytes32 |  | 

### pushArray

```js
function pushArray(bytes32 _key, string _value) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _value | string |  | 

### pushArray

```js
function pushArray(bytes32 _key, uint256 _value) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _value | uint256 |  | 

### setArray

used to intialize the array
 Ex1- mapping (address => address[]) public reputation;
 reputation[0x1] = new address[](0); It can be replaced as
 setArray(hash('reputation', 0x1), new address[](0));

```js
function setArray(bytes32 _key, address[] _value) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _value | address[] |  | 

### setArray

```js
function setArray(bytes32 _key, uint256[] _value) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _value | uint256[] |  | 

### setArray

```js
function setArray(bytes32 _key, bytes32[] _value) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _value | bytes32[] |  | 

### setArray

```js
function setArray(bytes32 _key, string[] _value) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _value | string[] |  | 

### getArrayAddress

Get functions to get the array of the required data type
 Ex1- mapping(address => bytes32[]) tokensOwnedByOwner;
 getArrayBytes32(keccak256(abi.encodePacked("tokensOwnedByOwner", 0x1)); It return the bytes32 array
 Ex2- uint256 _len =  tokensOwnedByOwner[0x1].length; replace with
 getArrayBytes32(keccak256(abi.encodePacked("tokensOwnedByOwner", 0x1)).length;

```js
function getArrayAddress(bytes32 _key) public view
returns(address[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 

### getArrayBytes32

```js
function getArrayBytes32(bytes32 _key) public view
returns(bytes32[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 

### getArrayUint

```js
function getArrayUint(bytes32 _key) public view
returns(uint256[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 

### setArrayIndexValue

set the value of particular index of the address array
 Ex1- mapping(bytes32 => address[]) moduleList;
 general way is -- moduleList[moduleType][index] = temp;
 It can be re-write as -- setArrayIndexValue(keccak256(abi.encodePacked('moduleList', moduleType)), index, temp);

```js
function setArrayIndexValue(bytes32 _key, uint256 _index, address _value) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _index | uint256 |  | 
| _value | address |  | 

### setArrayIndexValue

```js
function setArrayIndexValue(bytes32 _key, uint256 _index, uint256 _value) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _index | uint256 |  | 
| _value | uint256 |  | 

### setArrayIndexValue

```js
function setArrayIndexValue(bytes32 _key, uint256 _index, bytes32 _value) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _index | uint256 |  | 
| _value | bytes32 |  | 

### setArrayIndexValue

```js
function setArrayIndexValue(bytes32 _key, uint256 _index, string _value) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key | bytes32 |  | 
| _index | uint256 |  | 
| _value | string |  | 

### getUintValue

Get function use to get the value of the singleton state variables
 Ex1- string public version = "0.0.1";
 string _version = getString(keccak256(abi.encodePacked("version"));
 Ex2 - assert(temp1 == temp2); replace to
 assert(getUint(keccak256(abi.encodePacked(temp1)) == getUint(keccak256(abi.encodePacked(temp2));
 Ex3 - mapping(string => SymbolDetails) registeredSymbols; where SymbolDetails is the structure having different type of values as
 {uint256 date, string name, address owner} etc.
 string _name = getString(keccak256(abi.encodePacked("registeredSymbols_name", "TOKEN"));

```js
function getUintValue(bytes32 _variable) public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _variable | bytes32 |  | 

### getBoolValue

```js
function getBoolValue(bytes32 _variable) public view
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _variable | bytes32 |  | 

### getStringValue

```js
function getStringValue(bytes32 _variable) public view
returns(string)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _variable | bytes32 |  | 

### getAddressValue

```js
function getAddressValue(bytes32 _variable) public view
returns(address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _variable | bytes32 |  | 

### getBytes32Value

```js
function getBytes32Value(bytes32 _variable) public view
returns(bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _variable | bytes32 |  | 

### getBytesValue

```js
function getBytesValue(bytes32 _variable) public view
returns(bytes)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _variable | bytes32 |  | 

