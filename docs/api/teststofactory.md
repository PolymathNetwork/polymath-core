---
id: version-3.0.0-TestSTOFactory
title: TestSTOFactory
original_id: TestSTOFactory
---

# TestSTOFactory.sol

View Source: [contracts/mocks/TestSTOFactory.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/mocks/TestSTOFactory.sol)

**↗ Extends:** [**DummySTOFactory**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/DummySTOFactory.md)

**TestSTOFactory**

## Functions

* [\(uint256 \_setupCost, address \_logicContract, address \_polymathRegistry, bool \_isFeeInPoly\)](teststofactory.md)
* [getTags\(\)](teststofactory.md#gettags)

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

### getTags

⤾ overrides [ModuleFactory.getTags](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ModuleFactory.md#gettags)

Gets the tags related to the module factory

```javascript
function getTags() external view
returns(bytes32[])
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


