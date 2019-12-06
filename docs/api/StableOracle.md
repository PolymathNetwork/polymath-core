---
id: version-3.0.0-StableOracle
title: StableOracle
original_id: StableOracle
---

# StableOracle.sol

View Source: [contracts/oracles/StableOracle.sol](../../contracts/oracles/StableOracle.sol)

**↗ Extends: [IOracle](IOracle.md), [Ownable](Ownable.md)**

**StableOracle**

## Contract Members
**Constants & Variables**

```js
contract IOracle public oracle;
uint256 public lastPrice;
uint256 public evictPercentage;
bool public manualOverride;
uint256 public manualPrice;

```

**Events**

```js
event ChangeOracle(address  _oldOracle, address  _newOracle);
event ChangeEvictPercentage(uint256  _oldEvictPercentage, uint256  _newEvictPercentage);
event SetManualPrice(uint256  _oldPrice, uint256  _newPrice);
event SetManualOverride(bool  _override);
```

## Functions

- [(address _oracle, uint256 _evictPercentage)](#)
- [changeOracle(address _oracle)](#changeoracle)
- [changeEvictPercentage(uint256 _evictPercentage)](#changeevictpercentage)
- [getCurrencyAddress()](#getcurrencyaddress)
- [getCurrencySymbol()](#getcurrencysymbol)
- [getCurrencyDenominated()](#getcurrencydenominated)
- [getPrice()](#getprice)
- [_change(uint256 _newPrice, uint256 _oldPrice)](#_change)
- [setManualPrice(uint256 _price)](#setmanualprice)
- [setManualOverride(bool _override)](#setmanualoverride)

### 

Creates a new stable oracle based on existing oracle

```js
function (address _oracle, uint256 _evictPercentage) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _oracle | address | address of underlying oracle | 
| _evictPercentage | uint256 |  | 

### changeOracle

Updates medianizer address

```js
function changeOracle(address _oracle) public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _oracle | address | Address of underlying oracle | 

### changeEvictPercentage

Updates eviction percentage

```js
function changeEvictPercentage(uint256 _evictPercentage) public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _evictPercentage | uint256 | Percentage multiplied by 10**16 | 

### getCurrencyAddress

⤾ overrides [IOracle.getCurrencyAddress](IOracle.md#getcurrencyaddress)

Returns address of oracle currency (0x0 for ETH)

```js
function getCurrencyAddress() external view
returns(address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getCurrencySymbol

⤾ overrides [IOracle.getCurrencySymbol](IOracle.md#getcurrencysymbol)

Returns symbol of oracle currency (0x0 for ETH)

```js
function getCurrencySymbol() external view
returns(bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getCurrencyDenominated

⤾ overrides [IOracle.getCurrencyDenominated](IOracle.md#getcurrencydenominated)

Returns denomination of price

```js
function getCurrencyDenominated() external view
returns(bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getPrice

⤾ overrides [IOracle.getPrice](IOracle.md#getprice)

Returns price - should throw if not valid

```js
function getPrice() external nonpayable
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### _change

```js
function _change(uint256 _newPrice, uint256 _oldPrice) internal pure
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _newPrice | uint256 |  | 
| _oldPrice | uint256 |  | 

### setManualPrice

Set a manual price. NA - this will only be used if manualOverride == true

```js
function setManualPrice(uint256 _price) public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _price | uint256 | Price to set | 

### setManualOverride

Determine whether manual price is used or not

```js
function setManualOverride(bool _override) public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _override | bool | Whether to use the manual override price or not | 

