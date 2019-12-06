---
id: version-3.0.0-USDTieredSTOProxy
title: USDTieredSTOProxy
original_id: USDTieredSTOProxy
---

# USDTiered STO module Proxy (USDTieredSTOProxy.sol)

View Source: [contracts/modules/STO/USDTiered/USDTieredSTOProxy.sol](../../contracts/modules/STO/USDTiered/USDTieredSTOProxy.sol)

**↗ Extends: [USDTieredSTOStorage](USDTieredSTOStorage.md), [STOStorage](STOStorage.md), [ModuleStorage](ModuleStorage.md), [Pausable](Pausable.md), [ReentrancyGuard](ReentrancyGuard.md), [OwnedUpgradeabilityProxy](OwnedUpgradeabilityProxy.md)**

**USDTieredSTOProxy**

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

