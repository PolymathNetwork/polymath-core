---
id: version-3.0.0-VolumeRestrictionTMFactory
title: VolumeRestrictionTMFactory
original_id: VolumeRestrictionTMFactory
---

# Factory for deploying VolumeRestrictionTM module \(VolumeRestrictionTMFactory.sol\)

View Source: [contracts/modules/TransferManager/VRTM/VolumeRestrictionTMFactory.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/modules/TransferManager/VRTM/VolumeRestrictionTMFactory.sol)

**↗ Extends:** [**UpgradableModuleFactory**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/UpgradableModuleFactory.md)

**VolumeRestrictionTMFactory**

## Functions

* [\(uint256 \_setupCost, address \_logicContract, address \_polymathRegistry, bool \_isCostInPoly\)](volumerestrictiontmfactory.md)
* [deploy\(bytes \_data\)](volumerestrictiontmfactory.md#deploy)

Constructor

```javascript
function (uint256 _setupCost, address _logicContract, address _polymathRegistry, bool _isCostInPoly) public nonpayable UpgradableModuleFactory
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_setupCost | uint256 | Setup cost of the module |
| \_logicContract | address | Contract address that contains the logic related to `description` |
| \_polymathRegistry | address | Address of the Polymath registry |
| \_isCostInPoly | bool | true = cost in Poly, false = USD |

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

