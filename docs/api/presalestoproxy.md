---
id: version-3.0.0-PreSaleSTOProxy
title: PreSaleSTOProxy
original_id: PreSaleSTOProxy
---

# PreSaleSTO module Proxy \(PreSaleSTOProxy.sol\)

View Source: [contracts/modules/STO/PreSale/PreSaleSTOProxy.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/modules/STO/PreSale/PreSaleSTOProxy.sol)

**↗ Extends:** [**PreSaleSTOStorage**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/PreSaleSTOStorage.md)**,** [**STOStorage**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/STOStorage.md)**,** [**ModuleStorage**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ModuleStorage.md)**,** [**Pausable**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/Pausable.md)**,** [**ReentrancyGuard**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ReentrancyGuard.md)**,** [**OwnedUpgradeabilityProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/OwnedUpgradeabilityProxy.md)

**PreSaleSTOProxy**

## Functions

* [\(string \_version, address \_securityToken, address \_polyAddress, address \_implementation\)](presalestoproxy.md)

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

