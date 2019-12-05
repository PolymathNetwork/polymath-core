---
id: version-3.0.0-KYCTransferManagerFactory
title: KYCTransferManagerFactory
original_id: KYCTransferManagerFactory
---

# KYCTransferManagerFactory.sol

View Source: [contracts/modules/Experimental/TransferManager/KYCTransferManagerFactory.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/modules/Experimental/TransferManager/KYCTransferManagerFactory.sol)

**↗ Extends:** [**ModuleFactory**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ModuleFactory.md)

**KYCTransferManagerFactory**

## Functions

* [\(uint256 \_setupCost, address \_polymathRegistry, bool \_isCostInPoly\)](kyctransfermanagerfactory.md)
* [deploy\(bytes \_data\)](kyctransfermanagerfactory.md#deploy)

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

Used to launch the Module with the help of factory

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

