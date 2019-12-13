---
id: version-3.0.0-SafeMath
title: SafeMath
original_id: SafeMath
---

# SafeMath (SafeMath.sol)

View Source: [openzeppelin-solidity/contracts/math/SafeMath.sol](../../openzeppelin-solidity/contracts/math/SafeMath.sol)

**SafeMath**

Unsigned math operations with safety checks that revert on error

## Functions

- [mul(uint256 a, uint256 b)](#mul)
- [div(uint256 a, uint256 b)](#div)
- [sub(uint256 a, uint256 b)](#sub)
- [add(uint256 a, uint256 b)](#add)
- [mod(uint256 a, uint256 b)](#mod)

### mul

Multiplies two unsigned integers, reverts on overflow.

```js
function mul(uint256 a, uint256 b) internal pure
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| a | uint256 |  | 
| b | uint256 |  | 

### div

Integer division of two unsigned integers truncating the quotient, reverts on division by zero.

```js
function div(uint256 a, uint256 b) internal pure
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| a | uint256 |  | 
| b | uint256 |  | 

### sub

Subtracts two unsigned integers, reverts on overflow (i.e. if subtrahend is greater than minuend).

```js
function sub(uint256 a, uint256 b) internal pure
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| a | uint256 |  | 
| b | uint256 |  | 

### add

Adds two unsigned integers, reverts on overflow.

```js
function add(uint256 a, uint256 b) internal pure
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| a | uint256 |  | 
| b | uint256 |  | 

### mod

Divides two unsigned integers and returns the remainder (unsigned integer modulo),
reverts when dividing by zero.

```js
function mod(uint256 a, uint256 b) internal pure
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| a | uint256 |  | 
| b | uint256 |  | 

