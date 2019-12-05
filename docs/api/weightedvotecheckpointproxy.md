---
id: version-3.0.0-WeightedVoteCheckpointProxy
title: WeightedVoteCheckpointProxy
original_id: WeightedVoteCheckpointProxy
---

# Voting module for governance \(WeightedVoteCheckpointProxy.sol\)

View Source: [contracts/modules/Checkpoint/Voting/Transparent/WeightedVoteCheckpointProxy.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/modules/Checkpoint/Voting/Transparent/WeightedVoteCheckpointProxy.sol)

**↗ Extends:** [**WeightedVoteCheckpointStorage**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/WeightedVoteCheckpointStorage.md)**,** [**VotingCheckpointStorage**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/VotingCheckpointStorage.md)**,** [**ModuleStorage**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ModuleStorage.md)**,** [**Pausable**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/Pausable.md)**,** [**OwnedUpgradeabilityProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/OwnedUpgradeabilityProxy.md)

**WeightedVoteCheckpointProxy**

## Functions

* [\(string \_version, address \_securityToken, address \_polyAddress, address \_implementation\)](weightedvotecheckpointproxy.md)

Constructor

```javascript
function (string _version, address _securityToken, address _polyAddress, address _implementation) public nonpayable ModuleStorage
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_version | string |  |
| \_securityToken | address | Address of the security token |
| \_polyAddress | address | Address of the polytoken |
| \_implementation | address | representing the address of the new implementation to be set |

