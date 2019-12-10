---
id: version-3.0.0-LockUpTransferManagerFactory
title: LockUpTransferManagerFactory
original_id: LockUpTransferManagerFactory
---

# Factory for deploying LockUpTransferManager module (LockUpTransferManagerFactory.sol)

View Source: [contracts/modules/Experimental/TransferManager/LockUpTransferManagerFactory.sol](../../contracts/modules/Experimental/TransferManager/LockUpTransferManagerFactory.sol)

**↗ Extends: [ModuleFactory](ModuleFactory.md)**

**LockUpTransferManagerFactory**

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

- [deploy(bytes )](#deploy)
- [getTypes()](#gettypes)
- [getInstructions()](#getinstructions)
- [getTags()](#gettags)

### deploy

⤾ overrides [IModuleFactory.deploy](IModuleFactory.md#deploy)

Used to launch the Module with the help of factory

```js
function deploy(bytes ) external nonpayable
returns(address)
```

**Returns**

address Contract address of the Module

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
|  | bytes |  | 

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

