---
id: version-3.0.0-TrackedRedemptionFactory
title: TrackedRedemptionFactory
original_id: TrackedRedemptionFactory
---

# Factory for deploying GeneralTransferManager module (TrackedRedemptionFactory.sol)

View Source: [contracts/modules/Experimental/Burn/TrackedRedemptionFactory.sol](../../contracts/modules/Experimental/Burn/TrackedRedemptionFactory.sol)

**↗ Extends: [ModuleFactory](ModuleFactory.md)**
**↘ Derived Contracts: [MockBurnFactory](MockBurnFactory.md)**

**TrackedRedemptionFactory**

## Constructor

Constructor

```js
constructor(address _polyAddress, uint256 _setupCost, uint256 _usageCost, uint256 _subscriptionCost) public
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _polyAddress | address | Address of the polytoken | 
| _setupCost | uint256 | Setup cost of module | 
| _usageCost | uint256 | Usage cost of module | 
| _subscriptionCost | uint256 | Monthly cost of module | 

## Functions

- [deploy(bytes )](#deploy)
- [getTypes()](#gettypes)
- [getInstructions()](#getinstructions)
- [getTags()](#gettags)

### deploy

⤾ overrides [IModuleFactory.deploy](IModuleFactory.md#deploy)

⤿ Overridden Implementation(s): [MockBurnFactory.deploy](MockBurnFactory.md#deploy)

Used to launch the Module with the help of factory

```js
function deploy(bytes ) external nonpayable
returns(address)
```

**Returns**

Address Contract address of the Module

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
|  | bytes |  | 

### getTypes

⤾ overrides [IModuleFactory.getTypes](IModuleFactory.md#gettypes)

⤿ Overridden Implementation(s): [MockWrongTypeFactory.getTypes](MockWrongTypeFactory.md#gettypes)

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

Get the tags related to the module factory

```js
function getTags() external view
returns(bytes32[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

