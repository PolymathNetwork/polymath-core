---
id: version-3.0.0-GeneralTransferManagerStorage
title: GeneralTransferManagerStorage
original_id: GeneralTransferManagerStorage
---

# Transfer Manager module for core transfer validation functionality \(GeneralTransferManagerStorage.so

View Source: [contracts/modules/TransferManager/GTM/GeneralTransferManagerStorage.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/modules/TransferManager/GTM/GeneralTransferManagerStorage.sol)

**↘ Derived Contracts:** [**GeneralTransferManager**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/GeneralTransferManager.md)**,** [**GeneralTransferManagerProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/GeneralTransferManagerProxy.md)

**GeneralTransferManagerStorage**

**Enums**

### TransferType

```javascript
enum TransferType {
 GENERAL,
 ISSUANCE,
 REDEMPTION
}
```

## Structs

### Defaults

```javascript
struct Defaults {
 uint64 canSendAfter,
 uint64 canReceiveAfter
}
```

### TransferRequirements

```javascript
struct TransferRequirements {
 bool fromValidKYC,
 bool toValidKYC,
 bool fromRestricted,
 bool toRestricted
}
```

## Contract Members

**Constants & Variables**

```javascript
//public members
bytes32 public constant WHITELIST;
bytes32 public constant INVESTORSKEY;
bytes32 public constant INVESTORFLAGS;
address public issuanceAddress;
struct GeneralTransferManagerStorage.Defaults public defaults;
mapping(address => mapping(uint256 => bool)) public nonceMap;
mapping(uint8 => struct GeneralTransferManagerStorage.TransferRequirements) public transferRequirements;

//internal members
uint256 internal constant ONE;
```

## Functions

