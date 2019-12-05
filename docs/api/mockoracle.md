---
id: version-3.0.0-MockOracle
title: MockOracle
original_id: MockOracle
---

# MockOracle.sol

View Source: [contracts/mocks/MockOracle.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/mocks/MockOracle.sol)

**↗ Extends:** [**IOracle**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IOracle.md)

**MockOracle**

## Contract Members

**Constants & Variables**

```javascript
address public currency;
bytes32 public currencySymbol;
bytes32 public denominatedCurrency;
uint256 public price;
```

## Functions

* [\(address \_currency, bytes32 \_currencySymbol, bytes32 \_denominatedCurrency, uint256 \_price\)](mockoracle.md)
* [changePrice\(uint256 \_price\)](mockoracle.md#changeprice)
* [getCurrencyAddress\(\)](mockoracle.md#getcurrencyaddress)
* [getCurrencySymbol\(\)](mockoracle.md#getcurrencysymbol)
* [getCurrencyDenominated\(\)](mockoracle.md#getcurrencydenominated)
* [getPrice\(\)](mockoracle.md#getprice)

```javascript
function (address _currency, bytes32 _currencySymbol, bytes32 _denominatedCurrency, uint256 _price) public nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_currency | address |  |
| \_currencySymbol | bytes32 |  |
| \_denominatedCurrency | bytes32 |  |
| \_price | uint256 |  |

### changePrice

```javascript
function changePrice(uint256 _price) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_price | uint256 |  |

### getCurrencyAddress

⤾ overrides [IOracle.getCurrencyAddress](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IOracle.md#getcurrencyaddress)

Returns address of oracle currency \(0x0 for ETH\)

```javascript
function getCurrencyAddress() external view
returns(address)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### getCurrencySymbol

⤾ overrides [IOracle.getCurrencySymbol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IOracle.md#getcurrencysymbol)

Returns symbol of oracle currency \(0x0 for ETH\)

```javascript
function getCurrencySymbol() external view
returns(bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### getCurrencyDenominated

⤾ overrides [IOracle.getCurrencyDenominated](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IOracle.md#getcurrencydenominated)

Returns denomination of price

```javascript
function getCurrencyDenominated() external view
returns(bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### getPrice

⤾ overrides [IOracle.getPrice](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IOracle.md#getprice)

Returns price - should throw if not valid

```javascript
function getPrice() external nonpayable
returns(uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


