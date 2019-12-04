---
id: version-3.0.0-IOracle
title: IOracle
original_id: IOracle
---

# IOracle.sol

View Source: [contracts/interfaces/IOracle.sol](../../contracts/interfaces/IOracle.sol)

**↘ Derived Contracts: [MakerDAOOracle](MakerDAOOracle.md), [MockOracle](MockOracle.md), [StableOracle](StableOracle.md)**

**IOracle**

## Functions

- [getCurrencyAddress()](#getcurrencyaddress)
- [getCurrencySymbol()](#getcurrencysymbol)
- [getCurrencyDenominated()](#getcurrencydenominated)
- [getPrice()](#getprice)

### getCurrencyAddress

⤿ Overridden Implementation(s): [MakerDAOOracle.getCurrencyAddress](MakerDAOOracle.md#getcurrencyaddress),[MockOracle.getCurrencyAddress](MockOracle.md#getcurrencyaddress),[StableOracle.getCurrencyAddress](StableOracle.md#getcurrencyaddress)

Returns address of oracle currency (0x0 for ETH)

```js
function getCurrencyAddress() external view
returns(currency address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getCurrencySymbol

⤿ Overridden Implementation(s): [MakerDAOOracle.getCurrencySymbol](MakerDAOOracle.md#getcurrencysymbol),[MockOracle.getCurrencySymbol](MockOracle.md#getcurrencysymbol),[StableOracle.getCurrencySymbol](StableOracle.md#getcurrencysymbol)

Returns symbol of oracle currency (0x0 for ETH)

```js
function getCurrencySymbol() external view
returns(symbol bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getCurrencyDenominated

⤿ Overridden Implementation(s): [MakerDAOOracle.getCurrencyDenominated](MakerDAOOracle.md#getcurrencydenominated),[MockOracle.getCurrencyDenominated](MockOracle.md#getcurrencydenominated),[StableOracle.getCurrencyDenominated](StableOracle.md#getcurrencydenominated)

Returns denomination of price

```js
function getCurrencyDenominated() external view
returns(denominatedCurrency bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getPrice

⤿ Overridden Implementation(s): [MakerDAOOracle.getPrice](MakerDAOOracle.md#getprice),[MockOracle.getPrice](MockOracle.md#getprice),[StableOracle.getPrice](StableOracle.md#getprice)

Returns price - should throw if not valid

```js
function getPrice() external nonpayable
returns(price uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

