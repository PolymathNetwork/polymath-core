---
id: version-3.0.0-MockFactory
title: MockFactory
original_id: MockFactory
---

# Mock Contract Not fit for production environment (MockFactory.sol)

View Source: [contracts/mocks/MockFactory.sol](../../contracts/mocks/MockFactory.sol)

**↗ Extends: [DummySTOFactory](DummySTOFactory.md)**

**MockFactory**

## Constructor

Constructor

```js
constructor(address _polyAddress, uint256 _setupCost, uint256 _usageCost, uint256 _subscriptionCost) public
```

**Arguments**

## Contract Members
**Constants & Variables**

```js
bool public switchTypes;

```

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _polyAddress | address | Address of the polytoken | 
| _setupCost | uint256 |  | 
| _usageCost | uint256 |  | 
| _subscriptionCost | uint256 |  | 

## Functions

- [getTypes()](#gettypes)
- [changeTypes()](#changetypes)

### getTypes

⤾ overrides [DummySTOFactory.getTypes](DummySTOFactory.md#gettypes)

Type of the Module factory

```js
function getTypes() external view
returns(uint8[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### changeTypes

```js
function changeTypes() external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

