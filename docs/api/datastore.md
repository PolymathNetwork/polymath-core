---
id: version-3.0.0-DataStore
title: DataStore
original_id: DataStore
---

# Data store contract that stores data for all the modules in a central contract. \(DataStore.sol\)

View Source: [contracts/datastore/DataStore.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/datastore/DataStore.sol)

**↗ Extends:** [**DataStoreStorage**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/DataStoreStorage.md)**,** [**IDataStore**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IDataStore.md)

**DataStore**

**Events**

```javascript
event SecurityTokenChanged(address indexed _oldSecurityToken, address indexed _newSecurityToken);
```

## Modifiers

* [validKey](datastore.md#validkey)
* [validArrayLength](datastore.md#validarraylength)
* [onlyOwner](datastore.md#onlyowner)

### validKey

```javascript
modifier validKey(bytes32 _key) internal
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |

### validArrayLength

```javascript
modifier validArrayLength(uint256 _keyLength, uint256 _dataLength) internal
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_keyLength | uint256 |  |
| \_dataLength | uint256 |  |

### onlyOwner

```javascript
modifier onlyOwner() internal
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


## Functions

* [\_isAuthorized\(\)](datastore.md#_isauthorized)
* [setSecurityToken\(address \_securityToken\)](datastore.md#setsecuritytoken)
* [setUint256\(bytes32 \_key, uint256 \_data\)](datastore.md#setuint256)
* [setBytes32\(bytes32 \_key, bytes32 \_data\)](datastore.md#setbytes32)
* [setAddress\(bytes32 \_key, address \_data\)](datastore.md#setaddress)
* [setBool\(bytes32 \_key, bool \_data\)](datastore.md#setbool)
* [setString\(bytes32 \_key, string \_data\)](datastore.md#setstring)
* [setBytes\(bytes32 \_key, bytes \_data\)](datastore.md#setbytes)
* [setUint256Array\(bytes32 \_key, uint256\[\] \_data\)](datastore.md#setuint256array)
* [setBytes32Array\(bytes32 \_key, bytes32\[\] \_data\)](datastore.md#setbytes32array)
* [setAddressArray\(bytes32 \_key, address\[\] \_data\)](datastore.md#setaddressarray)
* [setBoolArray\(bytes32 \_key, bool\[\] \_data\)](datastore.md#setboolarray)
* [insertUint256\(bytes32 \_key, uint256 \_data\)](datastore.md#insertuint256)
* [insertBytes32\(bytes32 \_key, bytes32 \_data\)](datastore.md#insertbytes32)
* [insertAddress\(bytes32 \_key, address \_data\)](datastore.md#insertaddress)
* [insertBool\(bytes32 \_key, bool \_data\)](datastore.md#insertbool)
* [deleteUint256\(bytes32 \_key, uint256 \_index\)](datastore.md#deleteuint256)
* [deleteBytes32\(bytes32 \_key, uint256 \_index\)](datastore.md#deletebytes32)
* [deleteAddress\(bytes32 \_key, uint256 \_index\)](datastore.md#deleteaddress)
* [deleteBool\(bytes32 \_key, uint256 \_index\)](datastore.md#deletebool)
* [setUint256Multi\(bytes32\[\] \_keys, uint256\[\] \_data\)](datastore.md#setuint256multi)
* [setBytes32Multi\(bytes32\[\] \_keys, bytes32\[\] \_data\)](datastore.md#setbytes32multi)
* [setAddressMulti\(bytes32\[\] \_keys, address\[\] \_data\)](datastore.md#setaddressmulti)
* [setBoolMulti\(bytes32\[\] \_keys, bool\[\] \_data\)](datastore.md#setboolmulti)
* [insertUint256Multi\(bytes32\[\] \_keys, uint256\[\] \_data\)](datastore.md#insertuint256multi)
* [insertBytes32Multi\(bytes32\[\] \_keys, bytes32\[\] \_data\)](datastore.md#insertbytes32multi)
* [insertAddressMulti\(bytes32\[\] \_keys, address\[\] \_data\)](datastore.md#insertaddressmulti)
* [insertBoolMulti\(bytes32\[\] \_keys, bool\[\] \_data\)](datastore.md#insertboolmulti)
* [getUint256\(bytes32 \_key\)](datastore.md#getuint256)
* [getBytes32\(bytes32 \_key\)](datastore.md#getbytes32)
* [getAddress\(bytes32 \_key\)](datastore.md#getaddress)
* [getString\(bytes32 \_key\)](datastore.md#getstring)
* [getBytes\(bytes32 \_key\)](datastore.md#getbytes)
* [getBool\(bytes32 \_key\)](datastore.md#getbool)
* [getUint256Array\(bytes32 \_key\)](datastore.md#getuint256array)
* [getBytes32Array\(bytes32 \_key\)](datastore.md#getbytes32array)
* [getAddressArray\(bytes32 \_key\)](datastore.md#getaddressarray)
* [getBoolArray\(bytes32 \_key\)](datastore.md#getboolarray)
* [getUint256ArrayLength\(bytes32 \_key\)](datastore.md#getuint256arraylength)
* [getBytes32ArrayLength\(bytes32 \_key\)](datastore.md#getbytes32arraylength)
* [getAddressArrayLength\(bytes32 \_key\)](datastore.md#getaddressarraylength)
* [getBoolArrayLength\(bytes32 \_key\)](datastore.md#getboolarraylength)
* [getUint256ArrayElement\(bytes32 \_key, uint256 \_index\)](datastore.md#getuint256arrayelement)
* [getBytes32ArrayElement\(bytes32 \_key, uint256 \_index\)](datastore.md#getbytes32arrayelement)
* [getAddressArrayElement\(bytes32 \_key, uint256 \_index\)](datastore.md#getaddressarrayelement)
* [getBoolArrayElement\(bytes32 \_key, uint256 \_index\)](datastore.md#getboolarrayelement)
* [getUint256ArrayElements\(bytes32 \_key, uint256 \_startIndex, uint256 \_endIndex\)](datastore.md#getuint256arrayelements)
* [getBytes32ArrayElements\(bytes32 \_key, uint256 \_startIndex, uint256 \_endIndex\)](datastore.md#getbytes32arrayelements)
* [getAddressArrayElements\(bytes32 \_key, uint256 \_startIndex, uint256 \_endIndex\)](datastore.md#getaddressarrayelements)
* [getBoolArrayElements\(bytes32 \_key, uint256 \_startIndex, uint256 \_endIndex\)](datastore.md#getboolarrayelements)
* [\_setData\(bytes32 \_key, uint256 \_data, bool \_insert\)](datastore.md#_setdata)
* [\_setData\(bytes32 \_key, bytes32 \_data, bool \_insert\)](datastore.md#_setdata)
* [\_setData\(bytes32 \_key, address \_data, bool \_insert\)](datastore.md#_setdata)
* [\_setData\(bytes32 \_key, bool \_data, bool \_insert\)](datastore.md#_setdata)
* [\_setData\(bytes32 \_key, string \_data\)](datastore.md#_setdata)
* [\_setData\(bytes32 \_key, bytes \_data\)](datastore.md#_setdata)
* [\_setData\(bytes32 \_key, uint256\[\] \_data\)](datastore.md#_setdata)
* [\_setData\(bytes32 \_key, bytes32\[\] \_data\)](datastore.md#_setdata)
* [\_setData\(bytes32 \_key, address\[\] \_data\)](datastore.md#_setdata)
* [\_setData\(bytes32 \_key, bool\[\] \_data\)](datastore.md#_setdata)
* [\_deleteUint\(bytes32 \_key, uint256 \_index\)](datastore.md#_deleteuint)
* [\_deleteBytes32\(bytes32 \_key, uint256 \_index\)](datastore.md#_deletebytes32)
* [\_deleteAddress\(bytes32 \_key, uint256 \_index\)](datastore.md#_deleteaddress)
* [\_deleteBool\(bytes32 \_key, uint256 \_index\)](datastore.md#_deletebool)

### \_isAuthorized

```javascript
function _isAuthorized() internal view
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### setSecurityToken

⤾ overrides [IDataStore.setSecurityToken](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IDataStore.md#setsecuritytoken)

Changes security token atatched to this data store

```javascript
function setSecurityToken(address _securityToken) external nonpayable onlyOwner
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_securityToken | address | address of the security token |

### setUint256

⤾ overrides [IDataStore.setUint256](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IDataStore.md#setuint256)

Stores a uint256 data against a key

```javascript
function setUint256(bytes32 _key, uint256 _data) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 | Unique key to identify the data |
| \_data | uint256 | Data to be stored against the key |

### setBytes32

⤾ overrides [IDataStore.setBytes32](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IDataStore.md#setbytes32)

```javascript
function setBytes32(bytes32 _key, bytes32 _data) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_data | bytes32 |  |

### setAddress

⤾ overrides [IDataStore.setAddress](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IDataStore.md#setaddress)

```javascript
function setAddress(bytes32 _key, address _data) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_data | address |  |

### setBool

⤾ overrides [IDataStore.setBool](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IDataStore.md#setbool)

```javascript
function setBool(bytes32 _key, bool _data) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_data | bool |  |

### setString

⤾ overrides [IDataStore.setString](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IDataStore.md#setstring)

```javascript
function setString(bytes32 _key, string _data) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_data | string |  |

### setBytes

⤾ overrides [IDataStore.setBytes](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IDataStore.md#setbytes)

```javascript
function setBytes(bytes32 _key, bytes _data) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_data | bytes |  |

### setUint256Array

⤾ overrides [IDataStore.setUint256Array](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IDataStore.md#setuint256array)

Stores a uint256 array against a key

```javascript
function setUint256Array(bytes32 _key, uint256[] _data) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 | Unique key to identify the array |
| \_data | uint256\[\] | Array to be stored against the key |

### setBytes32Array

⤾ overrides [IDataStore.setBytes32Array](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IDataStore.md#setbytes32array)

```javascript
function setBytes32Array(bytes32 _key, bytes32[] _data) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_data | bytes32\[\] |  |

### setAddressArray

⤾ overrides [IDataStore.setAddressArray](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IDataStore.md#setaddressarray)

```javascript
function setAddressArray(bytes32 _key, address[] _data) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_data | address\[\] |  |

### setBoolArray

⤾ overrides [IDataStore.setBoolArray](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IDataStore.md#setboolarray)

```javascript
function setBoolArray(bytes32 _key, bool[] _data) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_data | bool\[\] |  |

### insertUint256

⤾ overrides [IDataStore.insertUint256](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IDataStore.md#insertuint256)

Inserts a uint256 element to the array identified by the key

```javascript
function insertUint256(bytes32 _key, uint256 _data) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 | Unique key to identify the array |
| \_data | uint256 | Element to push into the array |

### insertBytes32

⤾ overrides [IDataStore.insertBytes32](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IDataStore.md#insertbytes32)

```javascript
function insertBytes32(bytes32 _key, bytes32 _data) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_data | bytes32 |  |

### insertAddress

⤾ overrides [IDataStore.insertAddress](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IDataStore.md#insertaddress)

```javascript
function insertAddress(bytes32 _key, address _data) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_data | address |  |

### insertBool

⤾ overrides [IDataStore.insertBool](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IDataStore.md#insertbool)

```javascript
function insertBool(bytes32 _key, bool _data) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_data | bool |  |

### deleteUint256

⤾ overrides [IDataStore.deleteUint256](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IDataStore.md#deleteuint256)

Deletes an element from the array identified by the key. When an element is deleted from an Array, last element of that array is moved to the index of deleted element.

```javascript
function deleteUint256(bytes32 _key, uint256 _index) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 | Unique key to identify the array |
| \_index | uint256 | Index of the element to delete |

### deleteBytes32

⤾ overrides [IDataStore.deleteBytes32](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IDataStore.md#deletebytes32)

```javascript
function deleteBytes32(bytes32 _key, uint256 _index) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_index | uint256 |  |

### deleteAddress

⤾ overrides [IDataStore.deleteAddress](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IDataStore.md#deleteaddress)

```javascript
function deleteAddress(bytes32 _key, uint256 _index) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_index | uint256 |  |

### deleteBool

⤾ overrides [IDataStore.deleteBool](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IDataStore.md#deletebool)

```javascript
function deleteBool(bytes32 _key, uint256 _index) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_index | uint256 |  |

### setUint256Multi

⤾ overrides [IDataStore.setUint256Multi](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IDataStore.md#setuint256multi)

Stores multiple uint256 data against respective keys

```javascript
function setUint256Multi(bytes32[] _keys, uint256[] _data) public nonpayable validArrayLength
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_keys | bytes32\[\] | Array of keys to identify the data |
| \_data | uint256\[\] | Array of data to be stored against the respective keys |

### setBytes32Multi

⤾ overrides [IDataStore.setBytes32Multi](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IDataStore.md#setbytes32multi)

```javascript
function setBytes32Multi(bytes32[] _keys, bytes32[] _data) public nonpayable validArrayLength
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_keys | bytes32\[\] |  |
| \_data | bytes32\[\] |  |

### setAddressMulti

⤾ overrides [IDataStore.setAddressMulti](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IDataStore.md#setaddressmulti)

```javascript
function setAddressMulti(bytes32[] _keys, address[] _data) public nonpayable validArrayLength
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_keys | bytes32\[\] |  |
| \_data | address\[\] |  |

### setBoolMulti

⤾ overrides [IDataStore.setBoolMulti](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IDataStore.md#setboolmulti)

```javascript
function setBoolMulti(bytes32[] _keys, bool[] _data) public nonpayable validArrayLength
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_keys | bytes32\[\] |  |
| \_data | bool\[\] |  |

### insertUint256Multi

⤾ overrides [IDataStore.insertUint256Multi](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IDataStore.md#insertuint256multi)

Inserts multiple uint256 elements to the array identified by the respective keys

```javascript
function insertUint256Multi(bytes32[] _keys, uint256[] _data) public nonpayable validArrayLength
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_keys | bytes32\[\] | Array of keys to identify the data |
| \_data | uint256\[\] | Array of data to be inserted in arrays of the respective keys |

### insertBytes32Multi

⤾ overrides [IDataStore.insertBytes32Multi](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IDataStore.md#insertbytes32multi)

```javascript
function insertBytes32Multi(bytes32[] _keys, bytes32[] _data) public nonpayable validArrayLength
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_keys | bytes32\[\] |  |
| \_data | bytes32\[\] |  |

### insertAddressMulti

⤾ overrides [IDataStore.insertAddressMulti](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IDataStore.md#insertaddressmulti)

```javascript
function insertAddressMulti(bytes32[] _keys, address[] _data) public nonpayable validArrayLength
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_keys | bytes32\[\] |  |
| \_data | address\[\] |  |

### insertBoolMulti

⤾ overrides [IDataStore.insertBoolMulti](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IDataStore.md#insertboolmulti)

```javascript
function insertBoolMulti(bytes32[] _keys, bool[] _data) public nonpayable validArrayLength
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_keys | bytes32\[\] |  |
| \_data | bool\[\] |  |

### getUint256

⤾ overrides [IDataStore.getUint256](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IDataStore.md#getuint256)

```javascript
function getUint256(bytes32 _key) external view
returns(uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |

### getBytes32

⤾ overrides [IDataStore.getBytes32](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IDataStore.md#getbytes32)

```javascript
function getBytes32(bytes32 _key) external view
returns(bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |

### getAddress

⤾ overrides [IDataStore.getAddress](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IDataStore.md#getaddress)

```javascript
function getAddress(bytes32 _key) external view
returns(address)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |

### getString

⤾ overrides [IDataStore.getString](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IDataStore.md#getstring)

```javascript
function getString(bytes32 _key) external view
returns(string)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |

### getBytes

⤾ overrides [IDataStore.getBytes](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IDataStore.md#getbytes)

```javascript
function getBytes(bytes32 _key) external view
returns(bytes)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |

### getBool

⤾ overrides [IDataStore.getBool](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IDataStore.md#getbool)

```javascript
function getBool(bytes32 _key) external view
returns(bool)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |

### getUint256Array

⤾ overrides [IDataStore.getUint256Array](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IDataStore.md#getuint256array)

```javascript
function getUint256Array(bytes32 _key) external view
returns(uint256[])
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |

### getBytes32Array

⤾ overrides [IDataStore.getBytes32Array](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IDataStore.md#getbytes32array)

```javascript
function getBytes32Array(bytes32 _key) external view
returns(bytes32[])
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |

### getAddressArray

⤾ overrides [IDataStore.getAddressArray](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IDataStore.md#getaddressarray)

```javascript
function getAddressArray(bytes32 _key) external view
returns(address[])
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |

### getBoolArray

⤾ overrides [IDataStore.getBoolArray](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IDataStore.md#getboolarray)

```javascript
function getBoolArray(bytes32 _key) external view
returns(bool[])
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |

### getUint256ArrayLength

⤾ overrides [IDataStore.getUint256ArrayLength](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IDataStore.md#getuint256arraylength)

```javascript
function getUint256ArrayLength(bytes32 _key) external view
returns(uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |

### getBytes32ArrayLength

⤾ overrides [IDataStore.getBytes32ArrayLength](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IDataStore.md#getbytes32arraylength)

```javascript
function getBytes32ArrayLength(bytes32 _key) external view
returns(uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |

### getAddressArrayLength

⤾ overrides [IDataStore.getAddressArrayLength](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IDataStore.md#getaddressarraylength)

```javascript
function getAddressArrayLength(bytes32 _key) external view
returns(uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |

### getBoolArrayLength

⤾ overrides [IDataStore.getBoolArrayLength](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IDataStore.md#getboolarraylength)

```javascript
function getBoolArrayLength(bytes32 _key) external view
returns(uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |

### getUint256ArrayElement

⤾ overrides [IDataStore.getUint256ArrayElement](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IDataStore.md#getuint256arrayelement)

```javascript
function getUint256ArrayElement(bytes32 _key, uint256 _index) external view
returns(uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_index | uint256 |  |

### getBytes32ArrayElement

⤾ overrides [IDataStore.getBytes32ArrayElement](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IDataStore.md#getbytes32arrayelement)

```javascript
function getBytes32ArrayElement(bytes32 _key, uint256 _index) external view
returns(bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_index | uint256 |  |

### getAddressArrayElement

⤾ overrides [IDataStore.getAddressArrayElement](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IDataStore.md#getaddressarrayelement)

```javascript
function getAddressArrayElement(bytes32 _key, uint256 _index) external view
returns(address)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_index | uint256 |  |

### getBoolArrayElement

⤾ overrides [IDataStore.getBoolArrayElement](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IDataStore.md#getboolarrayelement)

```javascript
function getBoolArrayElement(bytes32 _key, uint256 _index) external view
returns(bool)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_index | uint256 |  |

### getUint256ArrayElements

⤾ overrides [IDataStore.getUint256ArrayElements](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IDataStore.md#getuint256arrayelements)

```javascript
function getUint256ArrayElements(bytes32 _key, uint256 _startIndex, uint256 _endIndex) public view
returns(array uint256[])
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_startIndex | uint256 |  |
| \_endIndex | uint256 |  |

### getBytes32ArrayElements

⤾ overrides [IDataStore.getBytes32ArrayElements](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IDataStore.md#getbytes32arrayelements)

```javascript
function getBytes32ArrayElements(bytes32 _key, uint256 _startIndex, uint256 _endIndex) public view
returns(array bytes32[])
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_startIndex | uint256 |  |
| \_endIndex | uint256 |  |

### getAddressArrayElements

⤾ overrides [IDataStore.getAddressArrayElements](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IDataStore.md#getaddressarrayelements)

```javascript
function getAddressArrayElements(bytes32 _key, uint256 _startIndex, uint256 _endIndex) public view
returns(array address[])
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_startIndex | uint256 |  |
| \_endIndex | uint256 |  |

### getBoolArrayElements

⤾ overrides [IDataStore.getBoolArrayElements](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IDataStore.md#getboolarrayelements)

```javascript
function getBoolArrayElements(bytes32 _key, uint256 _startIndex, uint256 _endIndex) public view
returns(array bool[])
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_startIndex | uint256 |  |
| \_endIndex | uint256 |  |

### \_setData

```javascript
function _setData(bytes32 _key, uint256 _data, bool _insert) internal nonpayable validKey
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_data | uint256 |  |
| \_insert | bool |  |

### \_setData

```javascript
function _setData(bytes32 _key, bytes32 _data, bool _insert) internal nonpayable validKey
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_data | bytes32 |  |
| \_insert | bool |  |

### \_setData

```javascript
function _setData(bytes32 _key, address _data, bool _insert) internal nonpayable validKey
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_data | address |  |
| \_insert | bool |  |

### \_setData

```javascript
function _setData(bytes32 _key, bool _data, bool _insert) internal nonpayable validKey
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_data | bool |  |
| \_insert | bool |  |

### \_setData

```javascript
function _setData(bytes32 _key, string _data) internal nonpayable validKey
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_data | string |  |

### \_setData

```javascript
function _setData(bytes32 _key, bytes _data) internal nonpayable validKey
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_data | bytes |  |

### \_setData

```javascript
function _setData(bytes32 _key, uint256[] _data) internal nonpayable validKey
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_data | uint256\[\] |  |

### \_setData

```javascript
function _setData(bytes32 _key, bytes32[] _data) internal nonpayable validKey
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_data | bytes32\[\] |  |

### \_setData

```javascript
function _setData(bytes32 _key, address[] _data) internal nonpayable validKey
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_data | address\[\] |  |

### \_setData

```javascript
function _setData(bytes32 _key, bool[] _data) internal nonpayable validKey
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_data | bool\[\] |  |

### \_deleteUint

```javascript
function _deleteUint(bytes32 _key, uint256 _index) internal nonpayable validKey
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_index | uint256 |  |

### \_deleteBytes32

```javascript
function _deleteBytes32(bytes32 _key, uint256 _index) internal nonpayable validKey
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_index | uint256 |  |

### \_deleteAddress

```javascript
function _deleteAddress(bytes32 _key, uint256 _index) internal nonpayable validKey
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_index | uint256 |  |

### \_deleteBool

```javascript
function _deleteBool(bytes32 _key, uint256 _index) internal nonpayable validKey
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_index | uint256 |  |

