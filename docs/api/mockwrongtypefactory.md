---
id: version-3.0.0-MockWrongTypeFactory
title: MockWrongTypeFactory
original_id: MockWrongTypeFactory
---

# Mock Contract Not fit for production environment \(MockWrongTypeFactory.sol\)

View Source: [contracts/mocks/MockWrongTypeFactory.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/mocks/MockWrongTypeFactory.sol)

**↗ Extends:** [**MockBurnFactory**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/MockBurnFactory.md)

**MockWrongTypeFactory**

## Functions

* [\(uint256 \_setupCost, address \_polymathRegistry, bool \_isFeeInPoly\)](mockwrongtypefactory.md)
* [getTypes\(\)](mockwrongtypefactory.md#gettypes)

Constructor

```javascript
function (uint256 _setupCost, address _polymathRegistry, bool _isFeeInPoly) public nonpayable MockBurnFactory
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_setupCost | uint256 | Setup cost of the module |
| \_polymathRegistry | address | Address of the Polymath Registry |
| \_isFeeInPoly | bool |  |

### getTypes

⤾ overrides [ModuleFactory.getTypes](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ModuleFactory.md#gettypes)

Type of the Module factory

```javascript
function getTypes() external view
returns(uint8[])
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


