---
id: version-3.0.0-VestingEscrowWalletStorage
title: VestingEscrowWalletStorage
original_id: VestingEscrowWalletStorage
---

# Wallet for core vesting escrow functionality (VestingEscrowWalletStorage.sol)

View Source: [contracts/storage/VestingEscrowWalletStorage.sol](../../contracts/storage/VestingEscrowWalletStorage.sol)

**↘ Derived Contracts: [VestingEscrowWallet](VestingEscrowWallet.md), [VestingEscrowWalletProxy](VestingEscrowWalletProxy.md)**

**VestingEscrowWalletStorage**

## Structs
### Schedule

```js
struct Schedule {
 bytes32 templateName,
 uint256 claimedTokens,
 uint256 startTime
}
```

### Template

```js
struct Template {
 uint256 numberOfTokens,
 uint256 duration,
 uint256 frequency,
 uint256 index
}
```

## Contract Members
**Constants & Variables**

```js
//public members
uint256 public unassignedTokens;
address public treasuryWallet;
address[] public beneficiaries;
mapping(address => struct VestingEscrowWalletStorage.Schedule[]) public schedules;
bytes32[] public templateNames;

//internal members
mapping(address => bool) internal beneficiaryAdded;
mapping(address => bytes32[]) internal userToTemplates;
mapping(address => mapping(bytes32 => uint256)) internal userToTemplateIndex;
mapping(bytes32 => address[]) internal templateToUsers;
mapping(bytes32 => mapping(address => uint256)) internal templateToUserIndex;
mapping(bytes32 => struct VestingEscrowWalletStorage.Template) internal templates;

```

## Functions

