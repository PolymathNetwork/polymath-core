---
id: version-3.0.0-MockBurnFactory
title: MockBurnFactory
original_id: MockBurnFactory
---

# Mock Contract Not fit for production environment \(MockBurnFactory.sol\)

View Source: [contracts/mocks/MockBurnFactory.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/mocks/MockBurnFactory.sol)

**↗ Extends:** [**TrackedRedemptionFactory**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/TrackedRedemptionFactory.md) **↘ Derived Contracts:** [**MockWrongTypeFactory**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/MockWrongTypeFactory.md)

**MockBurnFactory**

## Functions

* [\(uint256 \_setupCost, address \_polymathRegistry, bool \_isFeeInPoly\)](mockburnfactory.md)
* [deploy\(bytes \_data\)](mockburnfactory.md#deploy)

Constructor

```javascript
function (uint256 _setupCost, address _polymathRegistry, bool _isFeeInPoly) public nonpayable TrackedRedemptionFactory
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_setupCost | uint256 | Setup cost of the module |
| \_polymathRegistry | address | Address of the Polymath Registry |
| \_isFeeInPoly | bool |  |

### deploy

⤾ overrides [TrackedRedemptionFactory.deploy](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/TrackedRedemptionFactory.md#deploy)

Used to launch the Module with the help of factory

```javascript
function deploy(bytes _data) external nonpayable
returns(address)
```

**Returns**

Address Contract address of the Module

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_data | bytes |  |

