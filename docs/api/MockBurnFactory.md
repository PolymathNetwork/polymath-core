---
id: version-3.0.0-MockBurnFactory
title: MockBurnFactory
original_id: MockBurnFactory
---

# Mock Contract Not fit for production environment (MockBurnFactory.sol)

View Source: [contracts/mocks/MockBurnFactory.sol](../../contracts/mocks/MockBurnFactory.sol)

**↗ Extends: [TrackedRedemptionFactory](TrackedRedemptionFactory.md)**
**↘ Derived Contracts: [MockWrongTypeFactory](MockWrongTypeFactory.md)**

**MockBurnFactory**

## Functions

- [(uint256 _setupCost, address _polymathRegistry, bool _isFeeInPoly)](#)
- [deploy(bytes _data)](#deploy)

### 

Constructor

```js
function (uint256 _setupCost, address _polymathRegistry, bool _isFeeInPoly) public nonpayable TrackedRedemptionFactory 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _setupCost | uint256 | Setup cost of the module | 
| _polymathRegistry | address | Address of the Polymath Registry | 
| _isFeeInPoly | bool |  | 

### deploy

⤾ overrides [TrackedRedemptionFactory.deploy](TrackedRedemptionFactory.md#deploy)

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

