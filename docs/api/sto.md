---
id: version-3.0.0-STO
title: STO
original_id: STO
---

# Base abstract contract to be extended by all STO modules (STO.sol)

View Source: [contracts/modules/STO/STO.sol](../../contracts/modules/STO/STO.sol)

**↗ Extends: [ISTO](ISTO.md), [STOStorage](STOStorage.md), [Module](Module.md)**
**↘ Derived Contracts: [CappedSTO](CappedSTO.md), [DummySTO](DummySTO.md), [PreSaleSTO](PreSaleSTO.md), [USDTieredSTO](USDTieredSTO.md)**

**STO**

## Functions

- [getRaised(enum ISTO.FundRaiseType _fundRaiseType)](#getraised)
- [getTokensSold()](#gettokenssold)
- [pause()](#pause)
- [_setFundRaiseType(enum ISTO.FundRaiseType[] _fundRaiseTypes)](#_setfundraisetype)
- [_canBuy(address _investor)](#_canbuy)
- [_getKey(bytes32 _key1, address _key2)](#_getkey)

### getRaised

⤾ overrides [ISTO.getRaised](ISTO.md#getraised)

Returns funds raised by the STO

```js
function getRaised(enum ISTO.FundRaiseType _fundRaiseType) public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _fundRaiseType | enum ISTO.FundRaiseType |  | 

### getTokensSold

⤾ overrides [ISTO.getTokensSold](ISTO.md#gettokenssold)

⤿ Overridden Implementation(s): [CappedSTO.getTokensSold](CappedSTO.md#gettokenssold),[DummySTO.getTokensSold](DummySTO.md#gettokenssold),[PreSaleSTO.getTokensSold](PreSaleSTO.md#gettokenssold),[USDTieredSTO.getTokensSold](USDTieredSTO.md#gettokenssold)

Returns the total no. of tokens sold

```js
function getTokensSold() external view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### pause

⤾ overrides [Module.pause](Module.md#pause)

Pause (overridden function)

```js
function pause() public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### _setFundRaiseType

```js
function _setFundRaiseType(enum ISTO.FundRaiseType[] _fundRaiseTypes) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _fundRaiseTypes | enum ISTO.FundRaiseType[] |  | 

### _canBuy

```js
function _canBuy(address _investor) internal view
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investor | address |  | 

### _getKey

```js
function _getKey(bytes32 _key1, address _key2) internal pure
returns(bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key1 | bytes32 |  | 
| _key2 | address |  | 

