---
id: version-3.0.0-CountTransferManagerProxy
title: CountTransferManagerProxy
original_id: CountTransferManagerProxy
---

# CountTransferManager module Proxy (CountTransferManagerProxy.sol)

View Source: [contracts/modules/TransferManager/CTM/CountTransferManagerProxy.sol](../../contracts/modules/TransferManager/CTM/CountTransferManagerProxy.sol)

**↗ Extends: [CountTransferManagerStorage](CountTransferManagerStorage.md), [ModuleStorage](ModuleStorage.md), [Pausable](Pausable.md), [OwnedUpgradeabilityProxy](OwnedUpgradeabilityProxy.md)**

**CountTransferManagerProxy**

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

