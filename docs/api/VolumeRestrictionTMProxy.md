---
id: version-3.0.0-VolumeRestrictionTMProxy
title: VolumeRestrictionTMProxy
original_id: VolumeRestrictionTMProxy
---

# Transfer Manager module for core transfer validation functionality (VolumeRestrictionTMProxy.sol)

View Source: [contracts/modules/TransferManager/VRTM/VolumeRestrictionTMProxy.sol](../../contracts/modules/TransferManager/VRTM/VolumeRestrictionTMProxy.sol)

**↗ Extends: [VolumeRestrictionTMStorage](VolumeRestrictionTMStorage.md), [ModuleStorage](ModuleStorage.md), [Pausable](Pausable.md), [OwnedUpgradeabilityProxy](OwnedUpgradeabilityProxy.md)**

**VolumeRestrictionTMProxy**

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

