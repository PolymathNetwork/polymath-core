---
id: version-3.0.0-ScheduledCheckpointFactory
title: ScheduledCheckpointFactory
original_id: ScheduledCheckpointFactory
---

# Factory for deploying EtherDividendCheckpoint module (ScheduledCheckpointFactory.sol)

View Source: [contracts/modules/Experimental/Mixed/ScheduledCheckpointFactory.sol](../../contracts/modules/Experimental/Mixed/ScheduledCheckpointFactory.sol)

**↗ Extends: [ModuleFactory](ModuleFactory.md)**

**ScheduledCheckpointFactory**

## Functions

- [(uint256 _setupCost, address _polymathRegistry, bool _isCostInPoly)](#)
- [deploy(bytes _data)](#deploy)

### 

Constructor

```js
function (uint256 _setupCost, address _polymathRegistry, bool _isCostInPoly) public nonpayable ModuleFactory 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _setupCost | uint256 | Setup cost of the module | 
| _polymathRegistry | address | Address of the Polymath registry | 
| _isCostInPoly | bool | true = cost in Poly, false = USD | 

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

