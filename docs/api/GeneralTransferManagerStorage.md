---
id: version-3.0.0-GeneralTransferManagerStorage
title: GeneralTransferManagerStorage
original_id: GeneralTransferManagerStorage
---

# Transfer Manager module for core transfer validation functionality (GeneralTransferManagerStorage.sol)

View Source: [contracts/storage/GeneralTransferManagerStorage.sol](../../contracts/storage/GeneralTransferManagerStorage.sol)

**↘ Derived Contracts: [GeneralTransferManager](GeneralTransferManager.md), [GeneralTransferManagerProxy](GeneralTransferManagerProxy.md)**

**GeneralTransferManagerStorage**

## Structs
### TimeRestriction

```js
struct TimeRestriction {
 uint64 canSendAfter,
 uint64 canReceiveAfter,
 uint64 expiryTime,
 uint8 canBuyFromSTO,
 uint8 added
}
```

### Defaults

```js
struct Defaults {
 uint64 canSendAfter,
 uint64 canReceiveAfter
}
```

## Contract Members
**Constants & Variables**

```js
address public issuanceAddress;
address public signingAddress;
bytes32 public constant WHITELIST;
bytes32 public constant FLAGS;
struct GeneralTransferManagerStorage.Defaults public defaults;
address[] public investors;
mapping(address => struct GeneralTransferManagerStorage.TimeRestriction) public whitelist;
mapping(address => mapping(uint256 => bool)) public nonceMap;
bool public allowAllTransfers;
bool public allowAllWhitelistTransfers;
bool public allowAllWhitelistIssuances;
bool public allowAllBurnTransfers;

```

## Functions

