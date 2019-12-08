---
id: version-3.0.0-MockSecurityTokenLogic
title: MockSecurityTokenLogic
original_id: MockSecurityTokenLogic
---

# Security Token contract (mock) (MockSecurityTokenLogic.sol)

View Source: [contracts/mocks/MockSecurityTokenLogic.sol](../../contracts/mocks/MockSecurityTokenLogic.sol)

**↗ Extends: [SecurityToken](SecurityToken.md)**

**MockSecurityTokenLogic**

SecurityToken is an ERC1400 token with added capabilities:

## Contract Members
**Constants & Variables**

```js
uint256 public someValue;

```

**Events**

```js
event UpgradeEvent(uint256  _upgrade);
```

## Functions

- [upgrade(address _getterDelegate, uint256 _upgrade)](#upgrade)
- [initialize(address _getterDelegate, uint256 _someValue)](#initialize)
- [newFunction(uint256 _upgrade)](#newfunction)
- [addModuleWithLabel(address , bytes , uint256 , uint256 , bytes32 , bool )](#addmodulewithlabel)

### upgrade

Initialization function

```js
function upgrade(address _getterDelegate, uint256 _upgrade) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _getterDelegate | address |  | 
| _upgrade | uint256 |  | 

### initialize

Initialization function

```js
function initialize(address _getterDelegate, uint256 _someValue) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _getterDelegate | address |  | 
| _someValue | uint256 |  | 

### newFunction

```js
function newFunction(uint256 _upgrade) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _upgrade | uint256 |  | 

### addModuleWithLabel

⤾ overrides [SecurityToken.addModuleWithLabel](SecurityToken.md#addmodulewithlabel)

```js
function addModuleWithLabel(address , bytes , uint256 , uint256 , bytes32 , bool ) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
|  | address |  | 
|  | bytes |  | 
|  | uint256 |  | 
|  | uint256 |  | 
|  | bytes32 |  | 
|  | bool |  | 

