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

- [deploy(bytes )](#deploy)

### deploy

⤾ overrides [TrackedRedemptionFactory.deploy](TrackedRedemptionFactory.md#deploy)

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

