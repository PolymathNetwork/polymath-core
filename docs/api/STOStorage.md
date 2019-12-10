---
id: version-3.0.0-STOStorage
title: STOStorage
original_id: STOStorage
---

# Storage layout for the STO contract (STOStorage.sol)

View Source: [contracts/storage/modules/STO/STOStorage.sol](../../contracts/storage/modules/STO/STOStorage.sol)

**↘ Derived Contracts: [CappedSTOProxy](CappedSTOProxy.md), [DummySTOProxy](DummySTOProxy.md), [PreSaleSTOProxy](PreSaleSTOProxy.md), [STO](STO.md), [USDTieredSTOProxy](USDTieredSTOProxy.md)**

**STOStorage**

## Contract Members
**Constants & Variables**

```js
//internal members
bytes32 internal constant INVESTORFLAGS;
address internal treasuryWallet;

//public members
mapping(uint8 => bool) public fundRaiseTypes;
mapping(uint8 => uint256) public fundsRaised;
uint256 public startTime;
uint256 public endTime;
uint256 public pausedTime;
uint256 public investorCount;
address payable public wallet;
uint256 public totalTokensSold;
bool public preMintAllowed;
bool public isFinalized;

```

## Functions

