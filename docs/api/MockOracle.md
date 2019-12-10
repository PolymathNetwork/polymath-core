---
id: version-3.0.0-MockOracle
title: MockOracle
original_id: MockOracle
---

# MockOracle.sol

View Source: [contracts/mocks/MockOracle.sol](../../contracts/mocks/MockOracle.sol)

**↗ Extends: [IOracle](IOracle.md)**

**MockOracle**

## Contract Members
**Constants & Variables**

```js
address public currency;
bytes32 public currencySymbol;
bytes32 public denominatedCurrency;
uint256 public price;

```

## Functions

- [changePrice(uint256 _price)](#changeprice)
- [getCurrencyAddress()](#getcurrencyaddress)
- [getCurrencySymbol()](#getcurrencysymbol)
- [getCurrencyDenominated()](#getcurrencydenominated)
- [getPrice()](#getprice)

### changePrice

```js
function changePrice(uint256 _price) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _price | uint256 |  | 

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
function getPrice() external view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

