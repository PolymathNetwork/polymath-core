---
id: version-3.0.0-AdvancedPLCRVotingCheckpointProxy
title: AdvancedPLCRVotingCheckpointProxy
original_id: AdvancedPLCRVotingCheckpointProxy
---

# Voting module for governance (AdvancedPLCRVotingCheckpointProxy.sol)

View Source: [contracts/modules/Checkpoint/Voting/APLCR/AdvancedPLCRVotingCheckpointProxy.sol](../../contracts/modules/Checkpoint/Voting/APLCR/AdvancedPLCRVotingCheckpointProxy.sol)

**↗ Extends: [AdvancedPLCRVotingCheckpointStorage](AdvancedPLCRVotingCheckpointStorage.md), [VotingCheckpointStorage](VotingCheckpointStorage.md), [ModuleStorage](ModuleStorage.md), [Pausable](Pausable.md), [OwnedUpgradeabilityProxy](OwnedUpgradeabilityProxy.md)**

**AdvancedPLCRVotingCheckpointProxy**

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

