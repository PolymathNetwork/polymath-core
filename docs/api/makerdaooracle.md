---
id: version-3.0.0-MakerDAOOracle
title: MakerDAOOracle
original_id: MakerDAOOracle
---

# MakerDAOOracle.sol

View Source: [contracts/oracles/MakerDAOOracle.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/oracles/MakerDAOOracle.sol)

**↗ Extends:** [**IOracle**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IOracle.md)**,** [**Ownable**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/Ownable.md)

**MakerDAOOracle**

## Contract Members

**Constants & Variables**

```javascript
contract IMedianizer public medianizer;
address public currencyAddress;
bytes32 public currencySymbol;
bool public manualOverride;
uint256 public manualPrice;
```

**Events**

```javascript
event ChangeMedianizer(address  _newMedianizer, address  _oldMedianizer);
event SetManualPrice(uint256  _oldPrice, uint256  _newPrice);
event SetManualOverride(bool  _override);
```

## Functions

* [\(address \_medianizer, address \_currencyAddress, bytes32 \_currencySymbol\)](makerdaooracle.md)
* [changeMedianier\(address \_medianizer\)](makerdaooracle.md#changemedianier)
* [getCurrencyAddress\(\)](makerdaooracle.md#getcurrencyaddress)
* [getCurrencySymbol\(\)](makerdaooracle.md#getcurrencysymbol)
* [getCurrencyDenominated\(\)](makerdaooracle.md#getcurrencydenominated)
* [getPrice\(\)](makerdaooracle.md#getprice)
* [setManualPrice\(uint256 \_price\)](makerdaooracle.md#setmanualprice)
* [setManualOverride\(bool \_override\)](makerdaooracle.md#setmanualoverride)

Creates a new Maker based oracle

```javascript
function (address _medianizer, address _currencyAddress, bytes32 _currencySymbol) public nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_medianizer | address | Address of Maker medianizer |
| \_currencyAddress | address | Address of currency \(0x0 for ETH\) |
| \_currencySymbol | bytes32 | Symbol of currency |

### changeMedianier

Updates medianizer address

```javascript
function changeMedianier(address _medianizer) public nonpayable onlyOwner
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_medianizer | address | Address of Maker medianizer |

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


### setManualPrice

Set a manual price. NA - this will only be used if manualOverride == true

```javascript
function setManualPrice(uint256 _price) public nonpayable onlyOwner
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_price | uint256 | Price to set |

### setManualOverride

Determine whether manual price is used or not

```javascript
function setManualOverride(bool _override) public nonpayable onlyOwner
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_override | bool | Whether to use the manual override price or not |

