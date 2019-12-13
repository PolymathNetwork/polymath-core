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

## Functions

- [(uint256 _setupCost, uint256 _usageCost, address _polymathRegistry, bool _isCostInPoly)](#)
- [deploy(bytes _data)](#deploy)

### 

Constructor

```js
function (uint256 _setupCost, uint256 _usageCost, address _polymathRegistry, bool _isCostInPoly) public nonpayable ModuleFactory 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _setupCost | uint256 | Setup cost of module | 
| _usageCost | uint256 | Usage cost of the module | 
| _polymathRegistry | address | Address of the Polymath registry | 
| _isCostInPoly | bool | true = cost in Poly, false = USD | 

### deploy

⤾ overrides [IModuleFactory.deploy](IModuleFactory.md#deploy)

⤿ Overridden Implementation(s): [MockBurnFactory.deploy](MockBurnFactory.md#deploy)

Used to launch the Module with the help of factory

```js
function deploy(bytes _data) external nonpayable
returns(address)
```

**Returns**

Address Contract address of the Module

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _data | bytes |  | 

