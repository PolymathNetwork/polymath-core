---
id: version-3.0.0-Math
title: Math
original_id: Math
---

# Math \(Math.sol\)

View Source: [openzeppelin-solidity/contracts/math/Math.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/openzeppelin-solidity/contracts/math/Math.sol)

**Math**

Assorted math operations

## Functions

* [max\(uint256 a, uint256 b\)](math.md#max)
* [min\(uint256 a, uint256 b\)](math.md#min)
* [average\(uint256 a, uint256 b\)](math.md#average)

### max

Returns the largest of two numbers.

```javascript
function max(uint256 a, uint256 b) internal pure
returns(uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| a | uint256 |  |
| b | uint256 |  |

### min

Returns the smallest of two numbers.

```javascript
function min(uint256 a, uint256 b) internal pure
returns(uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| a | uint256 |  |
| b | uint256 |  |

### average

Calculates the average of two numbers. Since these are integers, averages of an even and odd number cannot be represented, and will be rounded down.

```javascript
function average(uint256 a, uint256 b) internal pure
returns(uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| a | uint256 |  |
| b | uint256 |  |

