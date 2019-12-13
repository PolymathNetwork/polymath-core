---
id: version-3.0.0-CappedSTOFactory
title: CappedSTOFactory
original_id: CappedSTOFactory
---

# Factory for deploying CappedSTO module (CappedSTOFactory.sol)

View Source: [contracts/modules/STO/Capped/CappedSTOFactory.sol](../../contracts/modules/STO/Capped/CappedSTOFactory.sol)

**↗ Extends: [UpgradableModuleFactory](UpgradableModuleFactory.md)**

**CappedSTOFactory**

## Functions

- [(uint256 _setupCost, uint256 _usageCost, address _logicContract, address _polymathRegistry, bool _isCostInPoly)](#)
- [deploy(bytes _data)](#deploy)

### 

Constructor

```js
function (uint256 _setupCost, uint256 _usageCost, address _logicContract, address _polymathRegistry, bool _isCostInPoly) public nonpayable UpgradableModuleFactory 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _setupCost | uint256 | Setup cost of the module | 
| _usageCost | uint256 | Usage cost of the module | 
| _logicContract | address | Contract address that contains the logic related to `description` | 
| _polymathRegistry | address | Address of the Polymath registry | 
| _isCostInPoly | bool | true = cost in Poly, false = USD | 

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
| _data | bytes | Data used for the intialization of the module factory variables | 

