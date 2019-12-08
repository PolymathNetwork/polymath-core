---
id: version-3.0.0-STO
title: STO
original_id: STO
---

# Interface to be implemented by all STO modules (STO.sol)

View Source: [contracts/modules/STO/STO.sol](../../contracts/modules/STO/STO.sol)

**↗ Extends: [ISTO](ISTO.md), [STOStorage](STOStorage.md), [Module](Module.md), [Pausable](Pausable.md)**
**↘ Derived Contracts: [CappedSTO](CappedSTO.md), [DummySTO](DummySTO.md), [PreSaleSTO](PreSaleSTO.md), [USDTieredSTO](USDTieredSTO.md)**

**STO**

**Enums**
### FundRaiseType

```js
enum FundRaiseType {
 ETH,
 POLY,
 SC
}
```

**Events**

```js
event SetFundRaiseTypes(enum STO.FundRaiseType[]  _fundRaiseTypes);
```

## Functions

- [getRaised(enum STO.FundRaiseType _fundRaiseType)](#getraised)
- [pause()](#pause)
- [unpause()](#unpause)
- [_setFundRaiseType(enum STO.FundRaiseType[] _fundRaiseTypes)](#_setfundraisetype)
- [reclaimERC20(address _tokenContract)](#reclaimerc20)
- [reclaimETH()](#reclaimeth)

### getRaised

Returns funds raised by the STO

```js
function getRaised(enum STO.FundRaiseType _fundRaiseType) public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _fundRaiseType | enum STO.FundRaiseType |  | 

### pause

Pause (overridden function)

```js
function pause() public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### unpause

Unpause (overridden function)

```js
function unpause() public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### _setFundRaiseType

```js
function _setFundRaiseType(enum STO.FundRaiseType[] _fundRaiseTypes) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _fundRaiseTypes | enum STO.FundRaiseType[] |  | 

### reclaimERC20

Reclaims ERC20Basic compatible tokens

```js
function reclaimERC20(address _tokenContract) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _tokenContract | address | The address of the token contract | 

### reclaimETH

Reclaims ETH

```js
function reclaimETH() external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

