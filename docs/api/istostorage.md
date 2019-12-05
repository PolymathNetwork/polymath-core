---
id: version-3.0.0-ISTOStorage
title: ISTOStorage
original_id: ISTOStorage
---

# Storage layout for the ISTO contract \(ISTOStorage.sol\)

View Source: [contracts/storage/modules/STO/ISTOStorage.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/storage/modules/STO/ISTOStorage.sol)

**ISTOStorage**

## Contract Members

**Constants & Variables**

```javascript
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

