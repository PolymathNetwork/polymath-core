---
id: version-3.0.0-MockFactory
title: MockFactory
original_id: MockFactory
---

# Mock Contract Not fit for production environment (MockFactory.sol)

View Source: [contracts/mocks/MockFactory.sol](../../contracts/mocks/MockFactory.sol)

**↗ Extends: [DummySTOFactory](DummySTOFactory.md)**

**MockFactory**

## Contract Members
**Constants & Variables**

```js
bool public typesSwitch;

```

## Functions

- [(uint256 _setupCost, uint256 _usageCost, address _logicContract, address _polymathRegistry, bool _isFeeInPoly)](#)
- [getTypes()](#gettypes)
- [switchTypes()](#switchtypes)

### 

Constructor

```js
function (uint256 _setupCost, uint256 _usageCost, address _logicContract, address _polymathRegistry, bool _isFeeInPoly) public nonpayable DummySTOFactory 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _setupCost | uint256 | Setup cost of the module | 
| _usageCost | uint256 | Usage cost of the module | 
| _logicContract | address | Contract address that contains the logic related to `description` | 
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

### switchTypes

```js
function switchTypes() external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

