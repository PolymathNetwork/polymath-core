---
id: version-3.0.0-STO
title: STO
original_id: STO
---

# Base abstract contract to be extended by all STO modules \(STO.sol\)

View Source: [contracts/modules/STO/STO.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/modules/STO/STO.sol)

**↗ Extends:** [**ISTO**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ISTO.md)**,** [**STOStorage**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/STOStorage.md)**,** [**Module**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/Module.md) **↘ Derived Contracts:** [**CappedSTO**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/CappedSTO.md)**,** [**DummySTO**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/DummySTO.md)**,** [**PreSaleSTO**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/PreSaleSTO.md)**,** [**USDTieredSTO**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/USDTieredSTO.md)

**STO**

## Functions

* [getRaised\(enum ISTO.FundRaiseType \_fundRaiseType\)](sto.md#getraised)
* [getTokensSold\(\)](sto.md#gettokenssold)
* [pause\(\)](sto.md#pause)
* [\_setFundRaiseType\(enum ISTO.FundRaiseType\[\] \_fundRaiseTypes\)](sto.md#_setfundraisetype)
* [\_canBuy\(address \_investor\)](sto.md#_canbuy)
* [\_getKey\(bytes32 \_key1, address \_key2\)](sto.md#_getkey)

### getRaised

⤾ overrides [ISTO.getRaised](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ISTO.md#getraised)

Returns funds raised by the STO

```javascript
function getRaised(enum ISTO.FundRaiseType _fundRaiseType) public view
returns(uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_fundRaiseType | enum ISTO.FundRaiseType |  |

### getTokensSold

⤾ overrides [ISTO.getTokensSold](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ISTO.md#gettokenssold)

⤿ Overridden Implementation\(s\): [CappedSTO.getTokensSold](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/CappedSTO.md#gettokenssold),[DummySTO.getTokensSold](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/DummySTO.md#gettokenssold),[PreSaleSTO.getTokensSold](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/PreSaleSTO.md#gettokenssold),[USDTieredSTO.getTokensSold](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/USDTieredSTO.md#gettokenssold)

Returns the total no. of tokens sold

```javascript
function getTokensSold() external view
returns(uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### pause

⤾ overrides [Module.pause](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/Module.md#pause)

Pause \(overridden function\)

```javascript
function pause() public nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### \_setFundRaiseType

```javascript
function _setFundRaiseType(enum ISTO.FundRaiseType[] _fundRaiseTypes) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_fundRaiseTypes | enum ISTO.FundRaiseType\[\] |  |

### \_canBuy

```javascript
function _canBuy(address _investor) internal view
returns(bool)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_investor | address |  |

### \_getKey

```javascript
function _getKey(bytes32 _key1, address _key2) internal pure
returns(bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key1 | bytes32 |  |
| \_key2 | address |  |

