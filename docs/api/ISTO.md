---
id: version-3.0.0-ISTO
title: ISTO
original_id: ISTO
---

# Interface to be implemented by all STO modules (ISTO.sol)

View Source: [contracts/interfaces/ISTO.sol](../../contracts/interfaces/ISTO.sol)

**↘ Derived Contracts: [STO](STO.md)**

**ISTO**

## Functions

- [getTokensSold()](#gettokenssold)

### getTokensSold

⤿ Overridden Implementation(s): [CappedSTO.getTokensSold](CappedSTO.md#gettokenssold),[DummySTO.getTokensSold](DummySTO.md#gettokenssold),[PreSaleSTO.getTokensSold](PreSaleSTO.md#gettokenssold),[USDTieredSTO.getTokensSold](USDTieredSTO.md#gettokenssold)

Returns the total no. of tokens sold

```js
function getTokensSold() external view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

