---
id: version-3.0.0-DividendCheckpointStorage
title: DividendCheckpointStorage
original_id: DividendCheckpointStorage
---

# Holds the storage variable for the DividendCheckpoint modules (i.e ERC20, Ether) (DividendCheckpointStorage.sol)

View Source: [contracts/storage/modules/Checkpoint/Dividend/DividendCheckpointStorage.sol](../../contracts/storage/modules/Checkpoint/Dividend/DividendCheckpointStorage.sol)

**↘ Derived Contracts: [DividendCheckpoint](DividendCheckpoint.md), [ERC20DividendCheckpointProxy](ERC20DividendCheckpointProxy.md), [EtherDividendCheckpointProxy](EtherDividendCheckpointProxy.md)**

**DividendCheckpointStorage**

abstract contract

## Structs
### Dividend

```js
struct Dividend {
 uint256 checkpointId,
 uint256 created,
 uint256 maturity,
 uint256 expiry,
 uint256 amount,
 uint256 claimedAmount,
 uint256 totalSupply,
 bool reclaimed,
 uint256 totalWithheld,
 uint256 totalWithheldWithdrawn,
 mapping(address => bool) claimed,
 mapping(address => bool) dividendExcluded,
 mapping(address => uint256) withheld,
 bytes32 name
}
```

## Contract Members
**Constants & Variables**

```js
address payable public wallet;
uint256 public EXCLUDED_ADDRESS_LIMIT;
struct DividendCheckpointStorage.Dividend[] public dividends;
address[] public excluded;
mapping(address => uint256) public withholdingTax;
mapping(address => uint256) public investorWithheld;

```

## Functions

