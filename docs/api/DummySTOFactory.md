---
id: version-3.0.0-DummySTOFactory
title: DummySTOFactory
original_id: DummySTOFactory
---

# Factory for deploying DummySTO module (DummySTOFactory.sol)

View Source: [contracts/mocks/DummySTOFactory.sol](../../contracts/mocks/DummySTOFactory.sol)

**↗ Extends: [ModuleFactory](ModuleFactory.md)**
**↘ Derived Contracts: [MockFactory](MockFactory.md), [TestSTOFactory](TestSTOFactory.md)**

**DummySTOFactory**

## Constructor

Constructor

```js
constructor(address _polyAddress, uint256 _setupCost, uint256 _usageCost, uint256 _subscriptionCost) public
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _polyAddress | address | Address of the polytoken | 
| _setupCost | uint256 |  | 
| _usageCost | uint256 |  | 
| _subscriptionCost | uint256 |  | 

## Functions

- [deploy(bytes _data)](#deploy)
- [getTypes()](#gettypes)
- [getInstructions()](#getinstructions)
- [getTags()](#gettags)

### deploy

⤾ overrides [IModuleFactory.deploy](IModuleFactory.md#deploy)

Used to launch the Module with the help of factory

```js
function deploy(bytes _data) external nonpayable
returns(address)
```

**Returns**

address Contract address of the Module

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _data | bytes |  | 

### getTypes

⤾ overrides [IModuleFactory.getTypes](IModuleFactory.md#gettypes)

⤿ Overridden Implementation(s): [MockFactory.getTypes](MockFactory.md#gettypes)

Type of the Module factory

```js
function getTypes() external view
returns(uint8[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getInstructions

⤾ overrides [IModuleFactory.getInstructions](IModuleFactory.md#getinstructions)

⤿ Overridden Implementation(s): [TestSTOFactory.getInstructions](TestSTOFactory.md#getinstructions)

Returns the instructions associated with the module

```js
function getInstructions() external view
returns(string)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getTags

⤾ overrides [IModuleFactory.getTags](IModuleFactory.md#gettags)

⤿ Overridden Implementation(s): [TestSTOFactory.getTags](TestSTOFactory.md#gettags)

Get the tags related to the module factory

```js
function getTags() external view
returns(bytes32[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

