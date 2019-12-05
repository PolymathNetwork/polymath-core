---
id: version-3.0.0-TrackedRedemption
title: TrackedRedemption
original_id: TrackedRedemption
---

# Burn module for burning tokens and keeping track of burnt amounts \(TrackedRedemption.sol\)

View Source: [contracts/modules/Experimental/Burn/TrackedRedemption.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/modules/Experimental/Burn/TrackedRedemption.sol)

**↗ Extends:** [**IBurn**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IBurn.md)**,** [**Module**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/Module.md) **↘ Derived Contracts:** [**MockRedemptionManager**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/MockRedemptionManager.md)

**TrackedRedemption**

## Contract Members

**Constants & Variables**

```javascript
mapping(address => uint256) internal redeemedTokens;
```

**Events**

```javascript
event Redeemed(address  _investor, uint256  _value);
```

## Functions

* [\(address \_securityToken, address \_polyToken\)](trackedredemption.md)
* [getInitFunction\(\)](trackedredemption.md#getinitfunction)
* [redeemTokens\(uint256 \_value\)](trackedredemption.md#redeemtokens)
* [getPermissions\(\)](trackedredemption.md#getpermissions)

Constructor

```javascript
function (address _securityToken, address _polyToken) public nonpayable Module
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_securityToken | address | Address of the security token |
| \_polyToken | address |  |

### getInitFunction

⤾ overrides [IModule.getInitFunction](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModule.md#getinitfunction)

This function returns the signature of configure function

```javascript
function getInitFunction() public pure
returns(bytes4)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### redeemTokens

To redeem tokens and track redemptions

```javascript
function redeemTokens(uint256 _value) public nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_value | uint256 | The number of tokens to redeem |

### getPermissions

⤾ overrides [IModule.getPermissions](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModule.md#getpermissions)

Returns the permissions flag that are associated with CountTransferManager

```javascript
function getPermissions() public view
returns(bytes32[])
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


