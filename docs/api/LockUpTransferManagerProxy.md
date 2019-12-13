---
id: version-3.0.0-LockUpTransferManagerProxy
title: LockUpTransferManagerProxy
original_id: LockUpTransferManagerProxy
---

# CountTransferManager module Proxy (LockUpTransferManagerProxy.sol)

View Source: [contracts/modules/TransferManager/LTM/LockUpTransferManagerProxy.sol](../../contracts/modules/TransferManager/LTM/LockUpTransferManagerProxy.sol)

**↗ Extends: [LockUpTransferManagerStorage](LockUpTransferManagerStorage.md), [ModuleStorage](ModuleStorage.md), [Pausable](Pausable.md), [OwnedUpgradeabilityProxy](OwnedUpgradeabilityProxy.md)**

**LockUpTransferManagerProxy**

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

