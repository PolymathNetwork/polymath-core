---
id: version-3.0.0-GeneralTransferManagerStorage
title: GeneralTransferManagerStorage
original_id: GeneralTransferManagerStorage
---

# Transfer Manager module for core transfer validation functionality (GeneralTransferManagerStorage.sol)

View Source: [contracts/modules/TransferManager/GTM/GeneralTransferManagerStorage.sol](../../contracts/modules/TransferManager/GTM/GeneralTransferManagerStorage.sol)

**↘ Derived Contracts: [GeneralTransferManager](GeneralTransferManager.md), [GeneralTransferManagerProxy](GeneralTransferManagerProxy.md)**

**GeneralTransferManagerStorage**

**Enums**
### TransferType

```js
enum TransferType {
 GENERAL,
 ISSUANCE,
 REDEMPTION
}
```

## Structs
### Defaults

```js
struct Defaults {
 uint64 canSendAfter,
 uint64 canReceiveAfter
}
```

### TransferRequirements

```js
struct TransferRequirements {
 bool fromValidKYC,
 bool toValidKYC,
 bool fromRestricted,
 bool toRestricted
}
```

## Contract Members
**Constants & Variables**

```js
//public members
bytes32 public constant WHITELIST;
bytes32 public constant INVESTORSKEY;
bytes32 public constant INVESTORFLAGS;
uint256 public constant WHITELISTMODULE;
address public issuanceAddress;
struct GeneralTransferManagerStorage.Defaults public defaults;
mapping(address => mapping(uint256 => bool)) public nonceMap;
mapping(uint8 => struct GeneralTransferManagerStorage.TransferRequirements) public transferRequirements;

//internal members
uint256 internal constant ONE;
uint256 internal constant MAX;

```

## Functions

