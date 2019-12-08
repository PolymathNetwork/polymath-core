---
id: version-3.0.0-KindMath
title: KindMath
original_id: KindMath
---

# KindMath (KindMath.sol)

View Source: [contracts/libraries/KindMath.sol](../../contracts/libraries/KindMath.sol)

**KindMath**

Math operations with safety checks that throw on error

## Functions

- [mul(uint256 a, uint256 b)](#mul)
- [div(uint256 a, uint256 b)](#div)
- [sub(uint256 a, uint256 b)](#sub)
- [add(uint256 a, uint256 b)](#add)

### mul

Multiplies two numbers, throws on overflow.

```js
function mul(uint256 a, uint256 b) internal pure
returns(c uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| a | uint256 |  | 
| b | uint256 |  | 

### div

Integer division of two numbers, truncating the quotient.

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

Subtracts two numbers, throws on overflow (i.e. if subtrahend is greater than minuend).

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

Adds two numbers, throws on overflow.

```js
function add(uint256 a, uint256 b) internal pure
returns(c uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| a | uint256 |  | 
| b | uint256 |  | 

