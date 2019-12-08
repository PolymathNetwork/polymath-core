---
id: version-3.0.0-Migrations
title: Migrations
original_id: Migrations
---

# Migrations.sol

View Source: [contracts/Migrations.sol](../../contracts/Migrations.sol)

**Migrations**

## Contract Members
**Constants & Variables**

```js
address public owner;
uint256 public lastCompletedMigration;

```

## Modifiers

- [restricted](#restricted)

### restricted

```js
modifier restricted() internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

## Functions

- [setCompleted(uint256 _completed)](#setcompleted)
- [upgrade(address _newAddress)](#upgrade)

### setCompleted

```js
function setCompleted(uint256 _completed) public nonpayable restricted 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _completed | uint256 |  | 

### upgrade

```js
function upgrade(address _newAddress) public nonpayable restricted 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _newAddress | address |  | 

