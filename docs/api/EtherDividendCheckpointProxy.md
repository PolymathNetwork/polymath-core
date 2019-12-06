---
id: version-3.0.0-EtherDividendCheckpointProxy
title: EtherDividendCheckpointProxy
original_id: EtherDividendCheckpointProxy
---

# Transfer Manager module for core transfer validation functionality (EtherDividendCheckpointProxy.sol)

View Source: [contracts/modules/Checkpoint/Dividend/Ether/EtherDividendCheckpointProxy.sol](../../contracts/modules/Checkpoint/Dividend/Ether/EtherDividendCheckpointProxy.sol)

**↗ Extends: [DividendCheckpointStorage](DividendCheckpointStorage.md), [ModuleStorage](ModuleStorage.md), [Pausable](Pausable.md), [OwnedUpgradeabilityProxy](OwnedUpgradeabilityProxy.md)**

**EtherDividendCheckpointProxy**

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

