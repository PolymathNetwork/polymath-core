---
id: version-3.0.0-ReentrancyGuard
title: ReentrancyGuard
original_id: ReentrancyGuard
---

# Helps contracts guard against reentrancy attacks. \(ReentrancyGuard.sol\)

View Source: [openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol)

**↘ Derived Contracts:** [**CappedSTO**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/CappedSTO.md)**,** [**CappedSTOProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/CappedSTOProxy.md)**,** [**DummySTOProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/DummySTOProxy.md)**,** [**GeneralPermissionManagerProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/GeneralPermissionManagerProxy.md)**,** [**PreSaleSTOProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/PreSaleSTOProxy.md)**,** [**SecurityToken**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/SecurityToken.md)**,** [**USDTieredSTOProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/USDTieredSTOProxy.md)

**ReentrancyGuard**

If you mark a function `nonReentrant`, you should also mark it `external`.

## Contract Members

**Constants & Variables**

```javascript
uint256 private _guardCounter;
```

## Modifiers

* [nonReentrant](reentrancyguard.md#nonreentrant)

### nonReentrant

Prevents a contract from calling itself, directly or indirectly. Calling a `nonReentrant` function from another `nonReentrant` function is not supported. It is possible to prevent this from happening by making the `nonReentrant` function external, and make it call a `private` function that does the actual work.

```javascript
modifier nonReentrant() internal
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


## Functions

* [\(\)](reentrancyguard.md)

```javascript
function () internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


