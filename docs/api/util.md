---
id: version-3.0.0-Util
title: Util
original_id: Util
---

# Utility contract for reusable code \(Util.sol\)

View Source: [contracts/libraries/Util.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/libraries/Util.sol)

**Util**

## Functions

* [upper\(string \_base\)](util.md#upper)
* [stringToBytes32\(string \_source\)](util.md#stringtobytes32)
* [bytesToBytes32\(bytes \_b, uint256 \_offset\)](util.md#bytestobytes32)
* [bytes32ToString\(bytes32 \_source\)](util.md#bytes32tostring)
* [getSig\(bytes \_data\)](util.md#getsig)

### upper

Changes a string to upper case

```javascript
function upper(string _base) internal pure
returns(string)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_base | string | String to change |

### stringToBytes32

```javascript
function stringToBytes32(string _source) internal pure
returns(bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_source | string |  |

### bytesToBytes32

```javascript
function bytesToBytes32(bytes _b, uint256 _offset) internal pure
returns(bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_b | bytes |  |
| \_offset | uint256 |  |

### bytes32ToString

Changes the bytes32 into string

```javascript
function bytes32ToString(bytes32 _source) internal pure
returns(string)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_source | bytes32 | that need to convert into string |

### getSig

Gets function signature from \_data

```javascript
function getSig(bytes _data) internal pure
returns(sig bytes4)
```

**Returns**

bytes4 sig

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_data | bytes | Passed data |

