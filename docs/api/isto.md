---
id: version-3.0.0-ISTO
title: ISTO
original_id: ISTO
---

# Interface to be implemented by all STO modules (ISTO.sol)

View Source: [contracts/interfaces/ISTO.sol](../../contracts/interfaces/ISTO.sol)

**↘ Derived Contracts: [STO](STO.md)**

**ISTO**

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
event SetFundRaiseTypes(enum ISTO.FundRaiseType[]  _fundRaiseTypes);
```

## Functions

- [getTokensSold()](#gettokenssold)
- [getRaised(enum ISTO.FundRaiseType _fundRaiseType)](#getraised)
- [pause()](#pause)

### getTokensSold

⤿ Overridden Implementation(s): [CappedSTO.getTokensSold](CappedSTO.md#gettokenssold),[DummySTO.getTokensSold](DummySTO.md#gettokenssold),[PreSaleSTO.getTokensSold](PreSaleSTO.md#gettokenssold),[STO.getTokensSold](STO.md#gettokenssold),[USDTieredSTO.getTokensSold](USDTieredSTO.md#gettokenssold)

Returns the total no. of tokens sold

```js
function getTokensSold() external view
returns(soldTokens uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getRaised

⤿ Overridden Implementation(s): [STO.getRaised](STO.md#getraised)

Returns funds raised by the STO

```js
function getRaised(enum ISTO.FundRaiseType _fundRaiseType) external view
returns(raisedAmount uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _fundRaiseType | enum ISTO.FundRaiseType |  | 

### pause

⤿ Overridden Implementation(s): [Module.pause](Module.md#pause),[STO.pause](STO.md#pause)

Pause (overridden function)

```js
function pause() external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

