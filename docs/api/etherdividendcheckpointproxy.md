---
id: version-3.0.0-EtherDividendCheckpointProxy
title: EtherDividendCheckpointProxy
original_id: EtherDividendCheckpointProxy
---

# Transfer Manager module for core transfer validation functionality \(EtherDividendCheckpointProxy.sol

View Source: [contracts/modules/Checkpoint/Dividend/Ether/EtherDividendCheckpointProxy.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/modules/Checkpoint/Dividend/Ether/EtherDividendCheckpointProxy.sol)

**↗ Extends:** [**DividendCheckpointStorage**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/DividendCheckpointStorage.md)**,** [**ModuleStorage**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ModuleStorage.md)**,** [**Pausable**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/Pausable.md)**,** [**OwnedUpgradeabilityProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/OwnedUpgradeabilityProxy.md)

**EtherDividendCheckpointProxy**

## Functions

* [\(string \_version, address \_securityToken, address \_polyAddress, address \_implementation\)](etherdividendcheckpointproxy.md)

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

