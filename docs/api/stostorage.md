---
id: version-3.0.0-STOStorage
title: STOStorage
original_id: STOStorage
---

# Storage layout for the STO contract \(STOStorage.sol\)

View Source: [contracts/storage/modules/STO/STOStorage.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/storage/modules/STO/STOStorage.sol)

**↘ Derived Contracts:** [**CappedSTOProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/CappedSTOProxy.md)**,** [**DummySTOProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/DummySTOProxy.md)**,** [**PreSaleSTOProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/PreSaleSTOProxy.md)**,** [**STO**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/STO.md)**,** [**USDTieredSTOProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/USDTieredSTOProxy.md)

**STOStorage**

## Contract Members

**Constants & Variables**

```javascript
//internal members
bytes32 internal constant INVESTORFLAGS;

//public members
mapping(uint8 => bool) public fundRaiseTypes;
mapping(uint8 => uint256) public fundsRaised;
uint256 public startTime;
uint256 public endTime;
uint256 public pausedTime;
uint256 public investorCount;
address payable public wallet;
uint256 public totalTokensSold;
```

## Functions

