---
id: version-3.0.0-ManualApprovalTransferManagerStorage
title: ManualApprovalTransferManagerStorage
original_id: ManualApprovalTransferManagerStorage
---

# Contract used to store layout for the ManualApprovalTransferManager storage \(ManualApprovalTransferM

View Source: [contracts/modules/TransferManager/MATM/ManualApprovalTransferManagerStorage.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/modules/TransferManager/MATM/ManualApprovalTransferManagerStorage.sol)

**↘ Derived Contracts:** [**ManualApprovalTransferManager**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ManualApprovalTransferManager.md)**,** [**ManualApprovalTransferManagerProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ManualApprovalTransferManagerProxy.md)

**ManualApprovalTransferManagerStorage**

## Structs

### ManualApproval

```javascript
struct ManualApproval {
 address from,
 address to,
 uint256 initialAllowance,
 uint256 allowance,
 uint256 expiryTime,
 bytes32 description
}
```

## Contract Members

**Constants & Variables**

```javascript
mapping(address => mapping(address => uint256)) public approvalIndex;
struct ManualApprovalTransferManagerStorage.ManualApproval[] public approvals;
```

## Functions

