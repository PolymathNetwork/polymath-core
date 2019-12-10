---
id: version-3.0.0-CappedSTOProxy
title: CappedSTOProxy
original_id: CappedSTOProxy
---

# CappedSTO module Proxy (CappedSTOProxy.sol)

View Source: [contracts/modules/STO/Capped/CappedSTOProxy.sol](../../contracts/modules/STO/Capped/CappedSTOProxy.sol)

**↗ Extends: [CappedSTOStorage](CappedSTOStorage.md), [STOStorage](STOStorage.md), [ModuleStorage](ModuleStorage.md), [Pausable](Pausable.md), [ReentrancyGuard](ReentrancyGuard.md), [OwnedUpgradeabilityProxy](OwnedUpgradeabilityProxy.md)**

**CappedSTOProxy**

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

