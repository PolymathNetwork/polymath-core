---
id: version-3.0.0-ScheduleCheckpointProxy
title: ScheduleCheckpointProxy
original_id: ScheduleCheckpointProxy
---

# Automate the checkpoint creation (ScheduleCheckpointProxy.sol)

View Source: [contracts/modules/Checkpoint/Automation/ScheduleCheckpointProxy.sol](../../contracts/modules/Checkpoint/Automation/ScheduleCheckpointProxy.sol)

**↗ Extends: [ScheduleCheckpointStorage](ScheduleCheckpointStorage.md), [ModuleStorage](ModuleStorage.md), [Pausable](Pausable.md), [OwnedUpgradeabilityProxy](OwnedUpgradeabilityProxy.md)**

**ScheduleCheckpointProxy**

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

