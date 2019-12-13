---
id: version-3.0.0-IssuanceProxy
title: IssuanceProxy
original_id: IssuanceProxy
---

# Issuance module Proxy (IssuanceProxy.sol)

View Source: [contracts/modules/STO/Issuance/IssuanceProxy.sol](../../contracts/modules/STO/Issuance/IssuanceProxy.sol)

**↗ Extends: [IssuanceStorage](IssuanceStorage.md), [ModuleStorage](ModuleStorage.md), [Pausable](Pausable.md), [ReentrancyGuard](ReentrancyGuard.md), [OwnedUpgradeabilityProxy](OwnedUpgradeabilityProxy.md)**

**IssuanceProxy**

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

