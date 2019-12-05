---
id: version-3.0.0-CappedSTOStorage
title: CappedSTOStorage
original_id: CappedSTOStorage
---

# Contract used to store layout for the CappedSTO storage \(CappedSTOStorage.sol\)

View Source: [contracts/modules/STO/Capped/CappedSTOStorage.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/modules/STO/Capped/CappedSTOStorage.sol)

**↘ Derived Contracts:** [**CappedSTO**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/CappedSTO.md)**,** [**CappedSTOProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/CappedSTOProxy.md)

**CappedSTOStorage**

## Contract Members

**Constants & Variables**

```javascript
bool public allowBeneficialInvestments;
uint256 public rate;
uint256 public cap;
mapping(address => uint256) public investors;
```

## Functions

