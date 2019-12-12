---
id: version-3.0.0-DecimalMath
title: DecimalMath
original_id: DecimalMath
---

# DecimalMath.sol

View Source: [contracts/libraries/DecimalMath.sol](../../contracts/libraries/DecimalMath.sol)

**DecimalMath**

## Contract Members
**Constants & Variables**

```js
uint256 internal constant e18;

```

## Functions

- [mul(uint256 x, uint256 y)](#mul)
- [div(uint256 x, uint256 y)](#div)

### mul

This function multiplies two decimals represented as (decimal * 10**DECIMALS)

```js
function mul(uint256 x, uint256 y) internal pure
returns(z uint256)
```

**Returns**

uint256 Result of multiplication represented as (decimal * 10**DECIMALS)

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| x | uint256 |  | 
| y | uint256 |  | 

### div

This function divides two decimals represented as (decimal * 10**DECIMALS)

```js
function div(uint256 x, uint256 y) internal pure
returns(z uint256)
```

**Returns**

uint256 Result of division represented as (decimal * 10**DECIMALS)

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| x | uint256 |  | 
| y | uint256 |  | 

