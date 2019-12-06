---
id: version-3.0.0-PreSaleSTOProxy
title: PreSaleSTOProxy
original_id: PreSaleSTOProxy
---

# PreSaleSTO module Proxy (PreSaleSTOProxy.sol)

View Source: [contracts/modules/STO/PreSale/PreSaleSTOProxy.sol](../../contracts/modules/STO/PreSale/PreSaleSTOProxy.sol)

**↗ Extends: [PreSaleSTOStorage](PreSaleSTOStorage.md), [STOStorage](STOStorage.md), [ModuleStorage](ModuleStorage.md), [Pausable](Pausable.md), [ReentrancyGuard](ReentrancyGuard.md), [OwnedUpgradeabilityProxy](OwnedUpgradeabilityProxy.md)**

**PreSaleSTOProxy**

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

