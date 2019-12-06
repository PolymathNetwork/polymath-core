---
id: version-3.0.0-ISTOStorage
title: ISTOStorage
original_id: ISTOStorage
---

# Storage layout for the ISTO contract (ISTOStorage.sol)

View Source: [contracts/storage/modules/STO/ISTOStorage.sol](../../contracts/storage/modules/STO/ISTOStorage.sol)

**ISTOStorage**

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
bool public preMintAllowed;
bool public isFinalized;

```

## Functions

