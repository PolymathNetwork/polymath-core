---
id: version-3.0.0-RestrictedPartialSaleTMFactory
title: RestrictedPartialSaleTMFactory
original_id: RestrictedPartialSaleTMFactory
---

# Factory for deploying BlacklistManager module (RestrictedPartialSaleTMFactory.sol)

View Source: [contracts/modules/Experimental/TransferManager/RestrictedPartialSaleTMFactory.sol](../../contracts/modules/Experimental/TransferManager/RestrictedPartialSaleTMFactory.sol)

**↗ Extends: [ModuleFactory](ModuleFactory.md)**

**RestrictedPartialSaleTMFactory**

## Constructor

Constructor

```js
constructor(address _polyAddress, uint256 _setupCost, uint256 _usageCost, uint256 _subscriptionCost) public
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _polyAddress | address | Address of the polytoken | 
| _setupCost | uint256 | Setup cost of the module | 
| _usageCost | uint256 | Usage cost of the module | 
| _subscriptionCost | uint256 | Subscription cost of the module | 

## Functions

- [deploy(bytes _data)](#deploy)
- [getTypes()](#gettypes)
- [getInstructions()](#getinstructions)
- [getTags()](#gettags)

### deploy

⤾ overrides [IModuleFactory.deploy](IModuleFactory.md#deploy)

used to launch the Module with the help of factory

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

Get the Instructions that helped to used the module

```js
function getInstructions() public view
returns(string)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getTags

⤾ overrides [IModuleFactory.getTags](IModuleFactory.md#gettags)

Get the tags related to the module factory

```js
function getTags() public view
returns(bytes32[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

