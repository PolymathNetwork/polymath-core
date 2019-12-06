---
id: version-3.0.0-ManualApprovalTransferManagerProxy
title: ManualApprovalTransferManagerProxy
original_id: ManualApprovalTransferManagerProxy
---

# ManualApprovalTransferManager module Proxy (ManualApprovalTransferManagerProxy.sol)

View Source: [contracts/modules/TransferManager/MATM/ManualApprovalTransferManagerProxy.sol](../../contracts/modules/TransferManager/MATM/ManualApprovalTransferManagerProxy.sol)

**↗ Extends: [ManualApprovalTransferManagerStorage](ManualApprovalTransferManagerStorage.md), [ModuleStorage](ModuleStorage.md), [Pausable](Pausable.md), [OwnedUpgradeabilityProxy](OwnedUpgradeabilityProxy.md)**

**ManualApprovalTransferManagerProxy**

## Functions

- [(string _version, address _securityToken, address _polyAddress, address _implementation)](#)

### 

Constructor

```js
function (string _version, address _securityToken, address _polyAddress, address _implementation) public nonpayable ModuleStorage 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _version | string |  | 
| _securityToken | address | Address of the security token | 
| _polyAddress | address | Address of the polytoken | 
| _implementation | address | representing the address of the new implementation to be set | 

