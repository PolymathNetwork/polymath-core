---
id: version-3.0.0-BlacklistTransferManagerProxy
title: BlacklistTransferManagerProxy
original_id: BlacklistTransferManagerProxy
---

# CountTransferManager module Proxy (BlacklistTransferManagerProxy.sol)

View Source: [contracts/modules/TransferManager/BTM/BlacklistTransferManagerProxy.sol](../../contracts/modules/TransferManager/BTM/BlacklistTransferManagerProxy.sol)

**↗ Extends: [BlacklistTransferManagerStorage](BlacklistTransferManagerStorage.md), [ModuleStorage](ModuleStorage.md), [Pausable](Pausable.md), [OwnedUpgradeabilityProxy](OwnedUpgradeabilityProxy.md)**

**BlacklistTransferManagerProxy**

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

