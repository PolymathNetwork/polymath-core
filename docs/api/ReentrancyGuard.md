---
id: version-3.0.0-ReentrancyGuard
title: ReentrancyGuard
original_id: ReentrancyGuard
---

# Helps contracts guard agains reentrancy attacks. (ReentrancyGuard.sol)

View Source: [openzeppelin-solidity/contracts/ReentrancyGuard.sol](../../openzeppelin-solidity/contracts/ReentrancyGuard.sol)

**↘ Derived Contracts: [CappedSTO](CappedSTO.md), [SecurityToken](SecurityToken.md), [USDTieredSTO](USDTieredSTO.md), [USDTieredSTOProxy](USDTieredSTOProxy.md)**

**ReentrancyGuard**

If you mark a function `nonReentrant`, you should also
mark it `external`.

## Contract Members
**Constants & Variables**

```js
bool private reentrancyLock;

```

## Modifiers

- [nonReentrant](#nonreentrant)

### nonReentrant

If you mark a function `nonReentrant`, you should also
mark it `external`. Calling one nonReentrant function from
another is not supported. Instead, you can implement a
`private` function doing the actual work, and a `external`
wrapper marked as `nonReentrant`.

```js
modifier nonReentrant() internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

## Functions

