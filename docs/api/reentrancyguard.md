---
id: version-3.0.0-ReentrancyGuard
title: ReentrancyGuard
original_id: ReentrancyGuard
---

# Helps contracts guard against reentrancy attacks. (ReentrancyGuard.sol)

View Source: [openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol](../../openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol)

**↘ Derived Contracts: [CappedSTO](CappedSTO.md), [CappedSTOProxy](CappedSTOProxy.md), [DummySTOProxy](DummySTOProxy.md), [GeneralPermissionManagerProxy](GeneralPermissionManagerProxy.md), [PreSaleSTOProxy](PreSaleSTOProxy.md), [SecurityToken](SecurityToken.md), [USDTieredSTOProxy](USDTieredSTOProxy.md)**

**ReentrancyGuard**

If you mark a function `nonReentrant`, you should also
mark it `external`.

## Contract Members
**Constants & Variables**

```js
uint256 private _guardCounter;

```

## Modifiers

- [nonReentrant](#nonreentrant)

### nonReentrant

Prevents a contract from calling itself, directly or indirectly.
Calling a `nonReentrant` function from another `nonReentrant`
function is not supported. It is possible to prevent this from happening
by making the `nonReentrant` function external, and make it call a
`private` function that does the actual work.

```js
modifier nonReentrant() internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

## Functions

- [()](#)

### 

```js
function () internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

