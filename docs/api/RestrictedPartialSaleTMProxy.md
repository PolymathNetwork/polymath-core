---
id: version-3.0.0-RestrictedPartialSaleTMProxy
title: RestrictedPartialSaleTMProxy
original_id: RestrictedPartialSaleTMProxy
---

# Transfer Manager module for core transfer validation functionality (RestrictedPartialSaleTMProxy.sol)

View Source: [contracts/modules/TransferManager/RPTM/RestrictedPartialSaleTMProxy.sol](../../contracts/modules/TransferManager/RPTM/RestrictedPartialSaleTMProxy.sol)

**↗ Extends: [RestrictedPartialSaleTMStorage](RestrictedPartialSaleTMStorage.md), [ModuleStorage](ModuleStorage.md), [Pausable](Pausable.md), [OwnedUpgradeabilityProxy](OwnedUpgradeabilityProxy.md)**

**RestrictedPartialSaleTMProxy**

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

