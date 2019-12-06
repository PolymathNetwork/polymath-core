---
id: version-3.0.0-MockWrongTypeFactory
title: MockWrongTypeFactory
original_id: MockWrongTypeFactory
---

# Mock Contract Not fit for production environment (MockWrongTypeFactory.sol)

View Source: [contracts/mocks/MockWrongTypeFactory.sol](../../contracts/mocks/MockWrongTypeFactory.sol)

**↗ Extends: [MockBurnFactory](MockBurnFactory.md)**

**MockWrongTypeFactory**

## Functions

- [(uint256 _setupCost, address _polymathRegistry, bool _isFeeInPoly)](#)
- [getTypes()](#gettypes)

### 

Constructor

```js
function (uint256 _setupCost, address _polymathRegistry, bool _isFeeInPoly) public nonpayable MockBurnFactory 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _setupCost | uint256 | Setup cost of the module | 
| _polymathRegistry | address | Address of the Polymath Registry | 
| _isFeeInPoly | bool |  | 

### getTypes

⤾ overrides [ModuleFactory.getTypes](ModuleFactory.md#gettypes)

Type of the Module factory

```js
function getTypes() external view
returns(uint8[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

