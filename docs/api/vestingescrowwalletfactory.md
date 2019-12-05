---
id: version-3.0.0-VestingEscrowWalletFactory
title: VestingEscrowWalletFactory
original_id: VestingEscrowWalletFactory
---

# Factory for deploying VestingEscrowWallet module \(VestingEscrowWalletFactory.sol\)

View Source: [contracts/modules/Wallet/VestingEscrowWalletFactory.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/modules/Wallet/VestingEscrowWalletFactory.sol)

**↗ Extends:** [**UpgradableModuleFactory**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/UpgradableModuleFactory.md)

**VestingEscrowWalletFactory**

## Functions

* [\(uint256 \_setupCost, address \_logicContract, address \_polymathRegistry, bool \_isCostInPoly\)](vestingescrowwalletfactory.md)
* [deploy\(bytes \_data\)](vestingescrowwalletfactory.md#deploy)

Constructor

```javascript
function (uint256 _setupCost, address _logicContract, address _polymathRegistry, bool _isCostInPoly) public nonpayable UpgradableModuleFactory
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_setupCost | uint256 |  |
| \_logicContract | address |  |
| \_polymathRegistry | address |  |
| \_isCostInPoly | bool |  |

### deploy

⤾ overrides [IModuleFactory.deploy](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModuleFactory.md#deploy)

Used to launch the Module with the help of factory \_data Data used for the intialization of the module factory variables

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

