---
id: version-3.0.0-TestSTOFactory
title: TestSTOFactory
original_id: TestSTOFactory
---

# TestSTOFactory.sol

View Source: [contracts/mocks/TestSTOFactory.sol](../../contracts/mocks/TestSTOFactory.sol)

**↗ Extends: [DummySTOFactory](DummySTOFactory.md)**

**TestSTOFactory**

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

- [getInstructions()](#getinstructions)
- [getTags()](#gettags)

### getInstructions

⤾ overrides [DummySTOFactory.getInstructions](DummySTOFactory.md#getinstructions)

Returns the instructions associated with the module

```js
function getInstructions() external view
returns(string)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getTags

⤾ overrides [DummySTOFactory.getTags](DummySTOFactory.md#gettags)

Gets the tags related to the module factory

```js
function getTags() external view
returns(bytes32[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

