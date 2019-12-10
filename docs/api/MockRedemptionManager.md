---
id: version-3.0.0-MockRedemptionManager
title: MockRedemptionManager
original_id: MockRedemptionManager
---

# Burn module for burning tokens and keeping track of burnt amounts (MockRedemptionManager.sol)

View Source: [contracts/mocks/MockRedemptionManager.sol](../../contracts/mocks/MockRedemptionManager.sol)

**↗ Extends: [TrackedRedemption](TrackedRedemption.md)**

**MockRedemptionManager**

## Constructor

Constructor

```js
constructor(address _securityToken, address _polyAddress) public
```

**Arguments**

## Contract Members
**Constants & Variables**

```js
mapping(address => uint256) internal tokenToRedeem;

```

**Events**

```js
event RedeemedTokenByOwner(address  _investor, address  _byWhoom, uint256  _value, uint256  _timestamp);
```

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _securityToken | address | Address of the security token | 
| _polyAddress | address | Address of the polytoken | 

## Functions

- [transferToRedeem(uint256 _value)](#transfertoredeem)
- [redeemTokenByOwner(uint256 _value)](#redeemtokenbyowner)

### transferToRedeem

Transfers tokens to Module to burn

```js
function transferToRedeem(uint256 _value) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _value | uint256 | The number of tokens to redeem | 

### redeemTokenByOwner

Used to redeem tokens by the module

```js
function redeemTokenByOwner(uint256 _value) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _value | uint256 | The number of tokens to redeem | 

