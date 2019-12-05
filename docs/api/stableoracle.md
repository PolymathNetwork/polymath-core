---
id: version-3.0.0-StableOracle
title: StableOracle
original_id: StableOracle
---

# StableOracle.sol

View Source: [contracts/oracles/StableOracle.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/oracles/StableOracle.sol)

**↗ Extends:** [**IOracle**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IOracle.md)**,** [**Ownable**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/Ownable.md)

**StableOracle**

## Contract Members

**Constants & Variables**

```javascript
contract IOracle public oracle;
uint256 public lastPrice;
uint256 public evictPercentage;
bool public manualOverride;
uint256 public manualPrice;
```

**Events**

```javascript
event ChangeOracle(address  _oldOracle, address  _newOracle);
event ChangeEvictPercentage(uint256  _oldEvictPercentage, uint256  _newEvictPercentage);
event SetManualPrice(uint256  _oldPrice, uint256  _newPrice);
event SetManualOverride(bool  _override);
```

## Functions

* [\(address \_oracle, uint256 \_evictPercentage\)](stableoracle.md)
* [changeOracle\(address \_oracle\)](stableoracle.md#changeoracle)
* [changeEvictPercentage\(uint256 \_evictPercentage\)](stableoracle.md#changeevictpercentage)
* [getCurrencyAddress\(\)](stableoracle.md#getcurrencyaddress)
* [getCurrencySymbol\(\)](stableoracle.md#getcurrencysymbol)
* [getCurrencyDenominated\(\)](stableoracle.md#getcurrencydenominated)
* [getPrice\(\)](stableoracle.md#getprice)
* [\_change\(uint256 \_newPrice, uint256 \_oldPrice\)](stableoracle.md#_change)
* [setManualPrice\(uint256 \_price\)](stableoracle.md#setmanualprice)
* [setManualOverride\(bool \_override\)](stableoracle.md#setmanualoverride)

Creates a new stable oracle based on existing oracle

```javascript
function (address _oracle, uint256 _evictPercentage) public nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_oracle | address | address of underlying oracle |
| \_evictPercentage | uint256 |  |

### changeOracle

Updates medianizer address

```javascript
function changeOracle(address _oracle) public nonpayable onlyOwner
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_oracle | address | Address of underlying oracle |

### changeEvictPercentage

Updates eviction percentage

```javascript
function changeEvictPercentage(uint256 _evictPercentage) public nonpayable onlyOwner
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_evictPercentage | uint256 | Percentage multiplied by 10\*\*16 |

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


### \_change

```javascript
function _change(uint256 _newPrice, uint256 _oldPrice) internal pure
returns(uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_newPrice | uint256 |  |
| \_oldPrice | uint256 |  |

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

