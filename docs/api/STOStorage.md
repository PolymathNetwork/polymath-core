---
id: version-3.0.0-STOStorage
title: STOStorage
original_id: STOStorage
---

# Storage layout for the STO contract (STOStorage.sol)

View Source: [contracts/modules/STO/STOStorage.sol](../../contracts/modules/STO/STOStorage.sol)

**↘ Derived Contracts: [STO](STO.md), [USDTieredSTOProxy](USDTieredSTOProxy.md)**

**STOStorage**

## Contract Members
**Constants & Variables**

```js
mapping(uint8 => bool) public fundRaiseTypes;
mapping(uint8 => uint256) public fundsRaised;
uint256 public startTime;
uint256 public endTime;
uint256 public pausedTime;
uint256 public investorCount;
address public wallet;
uint256 public totalTokensSold;

```

## Functions

