---
id: version-3.0.0-GeneralPermissionManagerProxy
title: GeneralPermissionManagerProxy
original_id: GeneralPermissionManagerProxy
---

# GeneralPermissionManager module Proxy (GeneralPermissionManagerProxy.sol)

View Source: [contracts/modules/PermissionManager/GeneralPermissionManagerProxy.sol](../../contracts/modules/PermissionManager/GeneralPermissionManagerProxy.sol)

**↗ Extends: [GeneralPermissionManagerStorage](GeneralPermissionManagerStorage.md), [ModuleStorage](ModuleStorage.md), [Pausable](Pausable.md), [ReentrancyGuard](ReentrancyGuard.md), [OwnedUpgradeabilityProxy](OwnedUpgradeabilityProxy.md)**

**GeneralPermissionManagerProxy**

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

