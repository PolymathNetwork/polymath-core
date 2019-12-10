---
id: version-3.0.0-PercentageTransferManagerProxy
title: PercentageTransferManagerProxy
original_id: PercentageTransferManagerProxy
---

# PercentageTransferManager module Proxy (PercentageTransferManagerProxy.sol)

View Source: [contracts/modules/TransferManager/PTM/PercentageTransferManagerProxy.sol](../../contracts/modules/TransferManager/PTM/PercentageTransferManagerProxy.sol)

**↗ Extends: [PercentageTransferManagerStorage](PercentageTransferManagerStorage.md), [ModuleStorage](ModuleStorage.md), [Pausable](Pausable.md), [OwnedUpgradeabilityProxy](OwnedUpgradeabilityProxy.md)**

**PercentageTransferManagerProxy**

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

