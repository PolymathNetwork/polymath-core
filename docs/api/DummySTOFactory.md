---
id: version-3.0.0-DummySTOFactory
title: DummySTOFactory
original_id: DummySTOFactory
---

# Factory for deploying DummySTO module (DummySTOFactory.sol)

View Source: [contracts/mocks/Dummy/DummySTOFactory.sol](../../contracts/mocks/Dummy/DummySTOFactory.sol)

**↗ Extends: [UpgradableModuleFactory](UpgradableModuleFactory.md)**
**↘ Derived Contracts: [MockFactory](MockFactory.md), [TestSTOFactory](TestSTOFactory.md)**

**DummySTOFactory**

## Functions

- [(uint256 _setupCost, address _logicContract, address _polymathRegistry, bool _isCostInPoly)](#)
- [deploy(bytes _data)](#deploy)

### 

Constructor

```js
function (uint256 _setupCost, address _logicContract, address _polymathRegistry, bool _isCostInPoly) public nonpayable UpgradableModuleFactory 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _setupCost | uint256 | Setup cost of the module | 
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

