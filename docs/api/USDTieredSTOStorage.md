---
id: version-3.0.0-USDTieredSTOStorage
title: USDTieredSTOStorage
original_id: USDTieredSTOStorage
---

# Contract used to store layout for the USDTieredSTO storage (USDTieredSTOStorage.sol)

View Source: [contracts/modules/STO/USDTiered/USDTieredSTOStorage.sol](../../contracts/modules/STO/USDTiered/USDTieredSTOStorage.sol)

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
 uint256 totalTokensSoldInTier,
 mapping(uint8 => uint256) tokenSoldPerFundType,
 uint256 soldDiscountPoly
}
```

## Contract Members
**Constants & Variables**

```js
//internal members
bytes32 internal constant INVESTORSKEY;
contract IERC20[] internal stableTokens;
mapping(address => bool) internal stableTokenEnabled;
mapping(bytes32 => mapping(bytes32 => address)) internal customOracles;

//public members
mapping(address => uint256) public nonAccreditedLimitUSDOverride;
mapping(bytes32 => mapping(bytes32 => string)) public oracleKeys;
bool public allowBeneficialInvestments;
uint256 public currentTier;
uint256 public fundsRaisedUSD;
mapping(address => uint256) public stableCoinsRaised;
mapping(address => uint256) public investorInvestedUSD;
mapping(address => mapping(uint8 => uint256)) public investorInvested;
uint256 public nonAccreditedLimitUSD;
uint256 public minimumInvestmentUSD;
uint256 public finalAmountReturned;
struct USDTieredSTOStorage.Tier[] public tiers;
bytes32 public denominatedCurrency;

```

## Functions

