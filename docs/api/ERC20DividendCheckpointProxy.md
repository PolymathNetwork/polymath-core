---
id: version-3.0.0-ERC20DividendCheckpointProxy
title: ERC20DividendCheckpointProxy
original_id: ERC20DividendCheckpointProxy
---

# Transfer Manager module for core transfer validation functionality (ERC20DividendCheckpointProxy.sol)

View Source: [contracts/modules/Checkpoint/Dividend/ERC20/ERC20DividendCheckpointProxy.sol](../../contracts/modules/Checkpoint/Dividend/ERC20/ERC20DividendCheckpointProxy.sol)

**↗ Extends: [ERC20DividendCheckpointStorage](ERC20DividendCheckpointStorage.md), [DividendCheckpointStorage](DividendCheckpointStorage.md), [ModuleStorage](ModuleStorage.md), [Pausable](Pausable.md), [OwnedUpgradeabilityProxy](OwnedUpgradeabilityProxy.md)**

**ERC20DividendCheckpointProxy**

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

