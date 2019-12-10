---
id: version-3.0.0-DummySTOProxy
title: DummySTOProxy
original_id: DummySTOProxy
---

# DummySTO module Proxy (DummySTOProxy.sol)

View Source: [contracts/mocks/Dummy/DummySTOProxy.sol](../../contracts/mocks/Dummy/DummySTOProxy.sol)

**↗ Extends: [DummySTOStorage](DummySTOStorage.md), [STOStorage](STOStorage.md), [ModuleStorage](ModuleStorage.md), [Pausable](Pausable.md), [ReentrancyGuard](ReentrancyGuard.md), [OwnedUpgradeabilityProxy](OwnedUpgradeabilityProxy.md)**

**DummySTOProxy**

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

