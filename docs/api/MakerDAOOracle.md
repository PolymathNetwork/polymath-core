---
id: version-3.0.0-MakerDAOOracle
title: MakerDAOOracle
original_id: MakerDAOOracle
---

# MakerDAOOracle.sol

View Source: [contracts/oracles/MakerDAOOracle.sol](../../contracts/oracles/MakerDAOOracle.sol)

**↗ Extends: [IOracle](IOracle.md), [Ownable](Ownable.md)**

**MakerDAOOracle**

## Contract Members
**Constants & Variables**

```js
contract IMedianizer public medianizer;
address public currencyAddress;
bytes32 public currencySymbol;
bool public manualOverride;
uint256 public manualPrice;

```

**Events**

```js
event ChangeMedianizer(address  _newMedianizer, address  _oldMedianizer);
event SetManualPrice(uint256  _oldPrice, uint256  _newPrice);
event SetManualOverride(bool  _override);
```

## Functions

- [(address _medianizer, address _currencyAddress, bytes32 _currencySymbol)](#)
- [changeMedianier(address _medianizer)](#changemedianier)
- [getCurrencyAddress()](#getcurrencyaddress)
- [getCurrencySymbol()](#getcurrencysymbol)
- [getCurrencyDenominated()](#getcurrencydenominated)
- [getPrice()](#getprice)
- [setManualPrice(uint256 _price)](#setmanualprice)
- [setManualOverride(bool _override)](#setmanualoverride)

### 

Creates a new Maker based oracle

```js
function (address _medianizer, address _currencyAddress, bytes32 _currencySymbol) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _medianizer | address | Address of Maker medianizer | 
| _currencyAddress | address | Address of currency (0x0 for ETH) | 
| _currencySymbol | bytes32 | Symbol of currency | 

### changeMedianier

Updates medianizer address

```js
function changeMedianier(address _medianizer) public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _medianizer | address | Address of Maker medianizer | 

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

