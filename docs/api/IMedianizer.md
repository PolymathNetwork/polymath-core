---
id: version-3.0.0-IMedianizer
title: IMedianizer
original_id: IMedianizer
---

# Interface to MakerDAO Medianizer contract (IMedianizer.sol)

View Source: [contracts/external/IMedianizer.sol](../../contracts/external/IMedianizer.sol)

**IMedianizer**

## Functions

- [peek()](#peek)
- [read()](#read)
- [set(address wat)](#set)
- [set(bytes12 pos, address wat)](#set)
- [setMin(uint96 min_)](#setmin)
- [setNext(bytes12 next_)](#setnext)
- [unset(bytes12 pos)](#unset)
- [unset(address wat)](#unset)
- [poke()](#poke)
- [poke(bytes32 )](#poke)
- [compute()](#compute)
- [void()](#void)

### peek

```js
function peek() external view
returns(bytes32, bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### read

```js
function read() external view
returns(bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### set

```js
function set(address wat) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| wat | address |  | 

### set

```js
function set(bytes12 pos, address wat) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| pos | bytes12 |  | 
| wat | address |  | 

### setMin

```js
function setMin(uint96 min_) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| min_ | uint96 |  | 

### setNext

```js
function setNext(bytes12 next_) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| next_ | bytes12 |  | 

### unset

```js
function unset(bytes12 pos) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| pos | bytes12 |  | 

### unset

```js
function unset(address wat) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| wat | address |  | 

### poke

```js
function poke() external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### poke

```js
function poke(bytes32 ) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
|  | bytes32 |  | 

### compute

```js
function compute() external view
returns(bytes32, bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### void

```js
function void() external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

