---
id: version-3.0.0-PLCRVotingCheckpointProxy
title: PLCRVotingCheckpointProxy
original_id: PLCRVotingCheckpointProxy
---

# Voting module for governance (PLCRVotingCheckpointProxy.sol)

View Source: [contracts/modules/Checkpoint/Voting/PLCR/PLCRVotingCheckpointProxy.sol](../../contracts/modules/Checkpoint/Voting/PLCR/PLCRVotingCheckpointProxy.sol)

**↗ Extends: [PLCRVotingCheckpointStorage](PLCRVotingCheckpointStorage.md), [VotingCheckpointStorage](VotingCheckpointStorage.md), [ModuleStorage](ModuleStorage.md), [Pausable](Pausable.md), [OwnedUpgradeabilityProxy](OwnedUpgradeabilityProxy.md)**

**PLCRVotingCheckpointProxy**

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

