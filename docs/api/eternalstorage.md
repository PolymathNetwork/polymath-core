---
id: version-3.0.0-EternalStorage
title: EternalStorage
original_id: EternalStorage
---

# EternalStorage.sol

View Source: [contracts/storage/EternalStorage.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/storage/EternalStorage.sol)

**↘ Derived Contracts:** [**ModuleRegistry**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ModuleRegistry.md)**,** [**ModuleRegistryProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ModuleRegistryProxy.md)**,** [**SecurityTokenRegistry**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/SecurityTokenRegistry.md)**,** [**SecurityTokenRegistryProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/SecurityTokenRegistryProxy.md)**,** [**STRGetter**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/STRGetter.md)

**EternalStorage**

## Contract Members

**Constants & Variables**

```javascript
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

* [set\(bytes32 \_key, uint256 \_value\)](eternalstorage.md#set)
* [set\(bytes32 \_key, address \_value\)](eternalstorage.md#set)
* [set\(bytes32 \_key, bool \_value\)](eternalstorage.md#set)
* [set\(bytes32 \_key, bytes32 \_value\)](eternalstorage.md#set)
* [set\(bytes32 \_key, string \_value\)](eternalstorage.md#set)
* [set\(bytes32 \_key, bytes \_value\)](eternalstorage.md#set)
* [deleteArrayAddress\(bytes32 \_key, uint256 \_index\)](eternalstorage.md#deletearrayaddress)
* [deleteArrayBytes32\(bytes32 \_key, uint256 \_index\)](eternalstorage.md#deletearraybytes32)
* [deleteArrayUint\(bytes32 \_key, uint256 \_index\)](eternalstorage.md#deletearrayuint)
* [deleteArrayString\(bytes32 \_key, uint256 \_index\)](eternalstorage.md#deletearraystring)
* [pushArray\(bytes32 \_key, address \_value\)](eternalstorage.md#pusharray)
* [pushArray\(bytes32 \_key, bytes32 \_value\)](eternalstorage.md#pusharray)
* [pushArray\(bytes32 \_key, string \_value\)](eternalstorage.md#pusharray)
* [pushArray\(bytes32 \_key, uint256 \_value\)](eternalstorage.md#pusharray)
* [setArray\(bytes32 \_key, address\[\] \_value\)](eternalstorage.md#setarray)
* [setArray\(bytes32 \_key, uint256\[\] \_value\)](eternalstorage.md#setarray)
* [setArray\(bytes32 \_key, bytes32\[\] \_value\)](eternalstorage.md#setarray)
* [setArray\(bytes32 \_key, string\[\] \_value\)](eternalstorage.md#setarray)
* [getArrayAddress\(bytes32 \_key\)](eternalstorage.md#getarrayaddress)
* [getArrayBytes32\(bytes32 \_key\)](eternalstorage.md#getarraybytes32)
* [getArrayUint\(bytes32 \_key\)](eternalstorage.md#getarrayuint)
* [setArrayIndexValue\(bytes32 \_key, uint256 \_index, address \_value\)](eternalstorage.md#setarrayindexvalue)
* [setArrayIndexValue\(bytes32 \_key, uint256 \_index, uint256 \_value\)](eternalstorage.md#setarrayindexvalue)
* [setArrayIndexValue\(bytes32 \_key, uint256 \_index, bytes32 \_value\)](eternalstorage.md#setarrayindexvalue)
* [setArrayIndexValue\(bytes32 \_key, uint256 \_index, string \_value\)](eternalstorage.md#setarrayindexvalue)
* [getUintValue\(bytes32 \_variable\)](eternalstorage.md#getuintvalue)
* [getBoolValue\(bytes32 \_variable\)](eternalstorage.md#getboolvalue)
* [getStringValue\(bytes32 \_variable\)](eternalstorage.md#getstringvalue)
* [getAddressValue\(bytes32 \_variable\)](eternalstorage.md#getaddressvalue)
* [getBytes32Value\(bytes32 \_variable\)](eternalstorage.md#getbytes32value)
* [getBytesValue\(bytes32 \_variable\)](eternalstorage.md#getbytesvalue)

### set

Set the key values using the Overloaded `set` functions Ex- string version = "0.0.1"; replace to set\(keccak256\(abi.encodePacked\("version"\), "0.0.1"\); same for the other variables as well some more example listed below ex1 - address securityTokenAddress = 0x123; replace to set\(keccak256\(abi.encodePacked\("securityTokenAddress"\), 0x123\); ex2 - bytes32 tokenDetails = "I am ST20"; replace to set\(keccak256\(abi.encodePacked\("tokenDetails"\), "I am ST20"\); ex3 - mapping\(string =&gt; address\) ownedToken; set\(keccak256\(abi.encodePacked\("ownedToken", "Chris"\)\), 0x123\); ex4 - mapping\(string =&gt; uint\) tokenIndex; tokenIndex\["TOKEN"\] = 1; replace to set\(keccak256\(abi.encodePacked\("tokenIndex", "TOKEN"\), 1\); ex5 - mapping\(string =&gt; SymbolDetails\) registeredSymbols; where SymbolDetails is the structure having different type of values as {uint256 date, string name, address owner} etc. registeredSymbols\["TOKEN"\].name = "MyFristToken"; replace to set\(keccak256\(abi.encodePacked\("registeredSymbols_name", "TOKEN"\), "MyFirstToken"\); More generalized- set\(keccak256\(abi.encodePacked\("registeredSymbols_", "keyname"\), "value"\);

```javascript
function set(bytes32 _key, uint256 _value) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_value | uint256 |  |

### set

```javascript
function set(bytes32 _key, address _value) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_value | address |  |

### set

```javascript
function set(bytes32 _key, bool _value) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_value | bool |  |

### set

```javascript
function set(bytes32 _key, bytes32 _value) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_value | bytes32 |  |

### set

```javascript
function set(bytes32 _key, string _value) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_value | string |  |

### set

```javascript
function set(bytes32 _key, bytes _value) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_value | bytes |  |

### deleteArrayAddress

Function used to delete the array element. Ex1- mapping\(address =&gt; bytes32\[\]\) tokensOwnedByOwner; For deleting the item from array developers needs to create a funtion for that similarly in this case we have the helper function deleteArrayBytes32\(\) which will do it for us deleteArrayBytes32\(keccak256\(abi.encodePacked\("tokensOwnedByOwner", 0x1\), 3\); -- it will delete the index 3

```javascript
function deleteArrayAddress(bytes32 _key, uint256 _index) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_index | uint256 |  |

### deleteArrayBytes32

```javascript
function deleteArrayBytes32(bytes32 _key, uint256 _index) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_index | uint256 |  |

### deleteArrayUint

```javascript
function deleteArrayUint(bytes32 _key, uint256 _index) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_index | uint256 |  |

### deleteArrayString

```javascript
function deleteArrayString(bytes32 _key, uint256 _index) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_index | uint256 |  |

### pushArray

Below are the helper functions to facilitate storing arrays of different data types. Ex1- mapping\(address =&gt; bytes32\[\]\) tokensOwnedByTicker; tokensOwnedByTicker\[owner\] = tokensOwnedByTicker\[owner\].push\("xyz"\); replace with pushArray\(keccak256\(abi.encodePacked\("tokensOwnedByTicker", owner\), "xyz"\);

```javascript
function pushArray(bytes32 _key, address _value) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 | bytes32 type |
| \_value | address | \[uint256, string, bytes32, address\] any of the data type in array |

### pushArray

```javascript
function pushArray(bytes32 _key, bytes32 _value) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_value | bytes32 |  |

### pushArray

```javascript
function pushArray(bytes32 _key, string _value) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_value | string |  |

### pushArray

```javascript
function pushArray(bytes32 _key, uint256 _value) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_value | uint256 |  |

### setArray

used to intialize the array Ex1- mapping \(address =&gt; address\[\]\) public reputation; reputation\[0x1\] = new address; It can be replaced as setArray\(hash\('reputation', 0x1\), new address\);

```javascript
function setArray(bytes32 _key, address[] _value) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_value | address\[\] |  |

### setArray

```javascript
function setArray(bytes32 _key, uint256[] _value) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_value | uint256\[\] |  |

### setArray

```javascript
function setArray(bytes32 _key, bytes32[] _value) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_value | bytes32\[\] |  |

### setArray

```javascript
function setArray(bytes32 _key, string[] _value) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_value | string\[\] |  |

### getArrayAddress

Get functions to get the array of the required data type Ex1- mapping\(address =&gt; bytes32\[\]\) tokensOwnedByOwner; getArrayBytes32\(keccak256\(abi.encodePacked\("tokensOwnedByOwner", 0x1\)\); It return the bytes32 array Ex2- uint256 \_len = tokensOwnedByOwner\[0x1\].length; replace with getArrayBytes32\(keccak256\(abi.encodePacked\("tokensOwnedByOwner", 0x1\)\).length;

```javascript
function getArrayAddress(bytes32 _key) public view
returns(address[])
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |

### getArrayBytes32

```javascript
function getArrayBytes32(bytes32 _key) public view
returns(bytes32[])
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |

### getArrayUint

```javascript
function getArrayUint(bytes32 _key) public view
returns(uint256[])
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |

### setArrayIndexValue

set the value of particular index of the address array Ex1- mapping\(bytes32 =&gt; address\[\]\) moduleList; general way is -- moduleList\[moduleType\]\[index\] = temp; It can be re-write as -- setArrayIndexValue\(keccak256\(abi.encodePacked\('moduleList', moduleType\)\), index, temp\);

```javascript
function setArrayIndexValue(bytes32 _key, uint256 _index, address _value) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_index | uint256 |  |
| \_value | address |  |

### setArrayIndexValue

```javascript
function setArrayIndexValue(bytes32 _key, uint256 _index, uint256 _value) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_index | uint256 |  |
| \_value | uint256 |  |

### setArrayIndexValue

```javascript
function setArrayIndexValue(bytes32 _key, uint256 _index, bytes32 _value) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_index | uint256 |  |
| \_value | bytes32 |  |

### setArrayIndexValue

```javascript
function setArrayIndexValue(bytes32 _key, uint256 _index, string _value) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key | bytes32 |  |
| \_index | uint256 |  |
| \_value | string |  |

### getUintValue

Get function use to get the value of the singleton state variables Ex1- string public version = "0.0.1"; string \_version = getString\(keccak256\(abi.encodePacked\("version"\)\); Ex2 - assert\(temp1 == temp2\); replace to assert\(getUint\(keccak256\(abi.encodePacked\(temp1\)\) == getUint\(keccak256\(abi.encodePacked\(temp2\)\); Ex3 - mapping\(string =&gt; SymbolDetails\) registeredSymbols; where SymbolDetails is the structure having different type of values as {uint256 date, string name, address owner} etc. string \_name = getString\(keccak256\(abi.encodePacked\("registeredSymbols\_name", "TOKEN"\)\);

```javascript
function getUintValue(bytes32 _variable) public view
returns(uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_variable | bytes32 |  |

### getBoolValue

```javascript
function getBoolValue(bytes32 _variable) public view
returns(bool)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_variable | bytes32 |  |

### getStringValue

```javascript
function getStringValue(bytes32 _variable) public view
returns(string)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_variable | bytes32 |  |

### getAddressValue

```javascript
function getAddressValue(bytes32 _variable) public view
returns(address)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_variable | bytes32 |  |

### getBytes32Value

```javascript
function getBytes32Value(bytes32 _variable) public view
returns(bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_variable | bytes32 |  |

### getBytesValue

```javascript
function getBytesValue(bytes32 _variable) public view
returns(bytes)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_variable | bytes32 |  |

