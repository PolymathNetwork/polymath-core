---
id: version-3.0.0-PercentageTransferManagerFactory
title: PercentageTransferManagerFactory
original_id: PercentageTransferManagerFactory
---

# Factory for deploying PercentageTransferManager module (PercentageTransferManagerFactory.sol)

View Source: [contracts/modules/TransferManager/PercentageTransferManagerFactory.sol](../../contracts/modules/TransferManager/PercentageTransferManagerFactory.sol)

**↗ Extends: [ModuleFactory](ModuleFactory.md)**

**PercentageTransferManagerFactory**

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
| _data | bytes | Data used for the intialization of the module factory variables | 

### getTypes

⤾ overrides [IModuleFactory.getTypes](IModuleFactory.md#gettypes)

Type of the Module factory

```js
function getTypes() external view
returns(uint8[])
```

**Returns**

uint8

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

