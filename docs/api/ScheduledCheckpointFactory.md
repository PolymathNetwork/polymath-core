---
id: version-3.0.0-ScheduledCheckpointFactory
title: ScheduledCheckpointFactory
original_id: ScheduledCheckpointFactory
---

# Factory for deploying EtherDividendCheckpoint module (ScheduledCheckpointFactory.sol)

View Source: [contracts/modules/Experimental/Mixed/ScheduledCheckpointFactory.sol](../../contracts/modules/Experimental/Mixed/ScheduledCheckpointFactory.sol)

**↗ Extends: [ModuleFactory](ModuleFactory.md)**

**ScheduledCheckpointFactory**

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
- [getName()](#getname)
- [getDescription()](#getdescription)
- [getTitle()](#gettitle)
- [getVersion()](#getversion)
- [getSetupCost()](#getsetupcost)
- [getInstructions()](#getinstructions)
- [getTags()](#gettags)

### deploy

⤾ overrides [IModuleFactory.deploy](IModuleFactory.md#deploy)

used to launch the Module with the help of factory

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

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getName

⤾ overrides [ModuleFactory.getName](ModuleFactory.md#getname)

Get the name of the Module

```js
function getName() public view
returns(bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getDescription

Get the description of the Module

```js
function getDescription() external view
returns(string)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getTitle

Get the title of the Module

```js
function getTitle() external view
returns(string)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getVersion

Get the version of the Module

```js
function getVersion() external view
returns(string)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getSetupCost

⤾ overrides [ModuleFactory.getSetupCost](ModuleFactory.md#getsetupcost)

Get the setup cost of the module

```js
function getSetupCost() external view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getInstructions

⤾ overrides [IModuleFactory.getInstructions](IModuleFactory.md#getinstructions)

Get the Instructions that helped to used the module

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

