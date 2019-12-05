---
id: version-3.0.0-MockFactory
title: MockFactory
original_id: MockFactory
---

# Mock Contract Not fit for production environment \(MockFactory.sol\)

View Source: [contracts/mocks/MockFactory.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/mocks/MockFactory.sol)

**↗ Extends:** [**DummySTOFactory**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/DummySTOFactory.md)

**MockFactory**

## Contract Members

**Constants & Variables**

```javascript
bool public typesSwitch;
```

## Functions

* [\(uint256 \_setupCost, address \_logicContract, address \_polymathRegistry, bool \_isFeeInPoly\)](mockfactory.md)
* [getTypes\(\)](mockfactory.md#gettypes)
* [switchTypes\(\)](mockfactory.md#switchtypes)

Constructor

```javascript
function (uint256 _setupCost, address _logicContract, address _polymathRegistry, bool _isFeeInPoly) public nonpayable DummySTOFactory
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_setupCost | uint256 | Setup cost of the module |
| \_logicContract | address | Contract address that contains the logic related to `description` |
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


### switchTypes

```javascript
function switchTypes() external nonpayable onlyOwner
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


