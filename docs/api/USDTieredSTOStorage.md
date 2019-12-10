---
id: version-3.0.0-USDTieredSTOStorage
title: USDTieredSTOStorage
original_id: USDTieredSTOStorage
---

# Contract used to store layout for the USDTieredSTO storage (USDTieredSTOStorage.sol)

View Source: [contracts/storage/USDTieredSTOStorage.sol](../../contracts/storage/USDTieredSTOStorage.sol)

**↘ Derived Contracts: [USDTieredSTO](USDTieredSTO.md), [USDTieredSTOProxy](USDTieredSTOProxy.md)**

**USDTieredSTOStorage**

## Structs
### Tier

```js
struct Tier {
 uint256 rate,
 uint256 rateDiscountPoly,
 uint256 tokenTotal,
 uint256 tokensDiscountPoly,
 uint256 mintedTotal,
 mapping(uint8 => uint256) minted,
 uint256 mintedDiscountPoly
}
```

### Investor

```js
struct Investor {
 uint8 accredited,
 uint8 seen,
 uint256 nonAccreditedLimitUSDOverride
}
```

## Contract Members
**Constants & Variables**

```js
//internal members
mapping(bytes32 => mapping(bytes32 => string)) internal oracleKeys;

//public members
bool public allowBeneficialInvestments;
bool public isFinalized;
address public reserveWallet;
address[] public usdTokens;
uint256 public currentTier;
uint256 public fundsRaisedUSD;
mapping(address => uint256) public stableCoinsRaised;
mapping(address => uint256) public investorInvestedUSD;
mapping(address => mapping(uint8 => uint256)) public investorInvested;
mapping(address => struct USDTieredSTOStorage.Investor) public investors;
mapping(address => bool) public usdTokenEnabled;
address[] public investorsList;
uint256 public nonAccreditedLimitUSD;
uint256 public minimumInvestmentUSD;
uint256 public finalAmountReturned;
struct USDTieredSTOStorage.Tier[] public tiers;

```

## Functions

