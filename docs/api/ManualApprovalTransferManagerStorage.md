---
id: version-3.0.0-ManualApprovalTransferManagerStorage
title: ManualApprovalTransferManagerStorage
original_id: ManualApprovalTransferManagerStorage
---

# Contract used to store layout for the ManualApprovalTransferManager storage (ManualApprovalTransferManagerStorage.sol)

View Source: [contracts/modules/TransferManager/MATM/ManualApprovalTransferManagerStorage.sol](../../contracts/modules/TransferManager/MATM/ManualApprovalTransferManagerStorage.sol)

**↘ Derived Contracts: [ManualApprovalTransferManager](ManualApprovalTransferManager.md), [ManualApprovalTransferManagerProxy](ManualApprovalTransferManagerProxy.md)**

**ManualApprovalTransferManagerStorage**

## Structs
### ManualApproval

```js
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

```js
mapping(address => mapping(address => uint256)) public approvalIndex;
struct ManualApprovalTransferManagerStorage.ManualApproval[] public approvals;

```

## Functions

