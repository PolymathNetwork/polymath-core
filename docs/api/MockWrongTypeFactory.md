---
id: version-3.0.0-MockWrongTypeFactory
title: MockWrongTypeFactory
original_id: MockWrongTypeFactory
---

# Mock Contract Not fit for production environment (MockWrongTypeFactory.sol)

View Source: [contracts/mocks/MockWrongTypeFactory.sol](../../contracts/mocks/MockWrongTypeFactory.sol)

**↗ Extends: [MockBurnFactory](MockBurnFactory.md)**

**MockWrongTypeFactory**

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

- [getTypes()](#gettypes)

### getTypes

⤾ overrides [TrackedRedemptionFactory.getTypes](TrackedRedemptionFactory.md#gettypes)

Type of the Module factory

```js
function getTypes() external view
returns(uint8[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

