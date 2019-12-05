---
id: version-3.0.0-SignedTransferManagerFactory
title: SignedTransferManagerFactory
original_id: SignedTransferManagerFactory
---

# Factory for deploying SignedTransferManager module \(SignedTransferManagerFactory.sol\)

View Source: [contracts/modules/Experimental/TransferManager/SignedTransferManagerFactory.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/modules/Experimental/TransferManager/SignedTransferManagerFactory.sol)

**↗ Extends:** [**ModuleFactory**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ModuleFactory.md)

**SignedTransferManagerFactory**

## Functions

* [\(uint256 \_setupCost, address \_polymathRegistry, bool \_isCostInPoly\)](signedtransfermanagerfactory.md)
* [deploy\(bytes \_data\)](signedtransfermanagerfactory.md#deploy)

Constructor

```javascript
function (uint256 _setupCost, address _polymathRegistry, bool _isCostInPoly) public nonpayable ModuleFactory
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_setupCost | uint256 |  |
| \_polymathRegistry | address |  |
| \_isCostInPoly | bool |  |

### deploy

⤾ overrides [IModuleFactory.deploy](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModuleFactory.md#deploy)

used to launch the Module with the help of factory

```javascript
function deploy(bytes _data) external nonpayable
returns(address)
```

**Returns**

address Contract address of the Module

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_data | bytes |  |

