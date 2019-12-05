---
id: version-3.0.0-BlacklistTransferManagerProxy
title: BlacklistTransferManagerProxy
original_id: BlacklistTransferManagerProxy
---

# CountTransferManager module Proxy \(BlacklistTransferManagerProxy.sol\)

View Source: [contracts/modules/TransferManager/BTM/BlacklistTransferManagerProxy.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/modules/TransferManager/BTM/BlacklistTransferManagerProxy.sol)

**↗ Extends:** [**BlacklistTransferManagerStorage**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/BlacklistTransferManagerStorage.md)**,** [**ModuleStorage**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ModuleStorage.md)**,** [**Pausable**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/Pausable.md)**,** [**OwnedUpgradeabilityProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/OwnedUpgradeabilityProxy.md)

**BlacklistTransferManagerProxy**

## Functions

* [\(string \_version, address \_securityToken, address \_polyAddress, address \_implementation\)](blacklisttransfermanagerproxy.md)

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

