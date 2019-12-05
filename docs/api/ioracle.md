---
id: version-3.0.0-IOracle
title: IOracle
original_id: IOracle
---

# IOracle.sol

View Source: [contracts/interfaces/IOracle.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/interfaces/IOracle.sol)

**↘ Derived Contracts:** [**MakerDAOOracle**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/MakerDAOOracle.md)**,** [**MockOracle**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/MockOracle.md)**,** [**StableOracle**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/StableOracle.md)

**IOracle**

## Functions

* [getCurrencyAddress\(\)](ioracle.md#getcurrencyaddress)
* [getCurrencySymbol\(\)](ioracle.md#getcurrencysymbol)
* [getCurrencyDenominated\(\)](ioracle.md#getcurrencydenominated)
* [getPrice\(\)](ioracle.md#getprice)

### getCurrencyAddress

⤿ Overridden Implementation\(s\): [MakerDAOOracle.getCurrencyAddress](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/MakerDAOOracle.md#getcurrencyaddress),[MockOracle.getCurrencyAddress](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/MockOracle.md#getcurrencyaddress),[StableOracle.getCurrencyAddress](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/StableOracle.md#getcurrencyaddress)

Returns address of oracle currency \(0x0 for ETH\)

```javascript
function getCurrencyAddress() external view
returns(currency address)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### getCurrencySymbol

⤿ Overridden Implementation\(s\): [MakerDAOOracle.getCurrencySymbol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/MakerDAOOracle.md#getcurrencysymbol),[MockOracle.getCurrencySymbol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/MockOracle.md#getcurrencysymbol),[StableOracle.getCurrencySymbol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/StableOracle.md#getcurrencysymbol)

Returns symbol of oracle currency \(0x0 for ETH\)

```javascript
function getCurrencySymbol() external view
returns(symbol bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### getCurrencyDenominated

⤿ Overridden Implementation\(s\): [MakerDAOOracle.getCurrencyDenominated](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/MakerDAOOracle.md#getcurrencydenominated),[MockOracle.getCurrencyDenominated](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/MockOracle.md#getcurrencydenominated),[StableOracle.getCurrencyDenominated](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/StableOracle.md#getcurrencydenominated)

Returns denomination of price

```javascript
function getCurrencyDenominated() external view
returns(denominatedCurrency bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### getPrice

⤿ Overridden Implementation\(s\): [MakerDAOOracle.getPrice](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/MakerDAOOracle.md#getprice),[MockOracle.getPrice](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/MockOracle.md#getprice),[StableOracle.getPrice](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/StableOracle.md#getprice)

Returns price - should throw if not valid

```javascript
function getPrice() external nonpayable
returns(price uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


