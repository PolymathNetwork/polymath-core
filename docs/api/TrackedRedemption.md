---
id: version-3.0.0-TrackedRedemption
title: TrackedRedemption
original_id: TrackedRedemption
---

# Burn module for burning tokens and keeping track of burnt amounts (TrackedRedemption.sol)

View Source: [contracts/modules/Experimental/Burn/TrackedRedemption.sol](../../contracts/modules/Experimental/Burn/TrackedRedemption.sol)

**↗ Extends: [IBurn](IBurn.md), [Module](Module.md)**
**↘ Derived Contracts: [MockRedemptionManager](MockRedemptionManager.md)**

**TrackedRedemption**

## Contract Members
**Constants & Variables**

```js
mapping(address => uint256) internal redeemedTokens;

```

**Events**

```js
event Redeemed(address  _investor, uint256  _value);
```

## Functions

- [(address _securityToken, address _polyToken)](#)
- [getInitFunction()](#getinitfunction)
- [redeemTokens(uint256 _value)](#redeemtokens)
- [getPermissions()](#getpermissions)

### 

Constructor

```js
function (address _securityToken, address _polyToken) public nonpayable Module 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _securityToken | address | Address of the security token | 
| _polyToken | address |  | 

### getInitFunction

⤾ overrides [IModule.getInitFunction](IModule.md#getinitfunction)

This function returns the signature of configure function

```js
function getInitFunction() public pure
returns(bytes4)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### redeemTokens

To redeem tokens and track redemptions

```js
function redeemTokens(uint256 _value) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _value | uint256 | The number of tokens to redeem | 

### getPermissions

⤾ overrides [IModule.getPermissions](IModule.md#getpermissions)

Returns the permissions flag that are associated with CountTransferManager

```js
function getPermissions() public view
returns(bytes32[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

