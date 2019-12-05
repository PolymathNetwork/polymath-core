---
id: version-3.0.0-MockSecurityTokenLogic
title: MockSecurityTokenLogic
original_id: MockSecurityTokenLogic
---

# Security Token contract \(mock\) \(MockSecurityTokenLogic.sol\)

View Source: [contracts/mocks/MockSecurityTokenLogic.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/mocks/MockSecurityTokenLogic.sol)

**↗ Extends:** [**SecurityToken**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/SecurityToken.md)

**MockSecurityTokenLogic**

SecurityToken is an ERC1400 token with added capabilities:

## Contract Members

**Constants & Variables**

```javascript
uint256 public someValue;
```

**Events**

```javascript
event UpgradeEvent(uint256  _upgrade);
```

## Functions

* [upgrade\(address \_getterDelegate, uint256 \_upgrade\)](mocksecuritytokenlogic.md#upgrade)
* [initialize\(address \_getterDelegate, uint256 \_someValue\)](mocksecuritytokenlogic.md#initialize)
* [newFunction\(uint256 \_upgrade\)](mocksecuritytokenlogic.md#newfunction)
* [addModuleWithLabel\(address , bytes , uint256 , uint256 , bytes32 , bool \)](mocksecuritytokenlogic.md#addmodulewithlabel)

### upgrade

Initialization function

```javascript
function upgrade(address _getterDelegate, uint256 _upgrade) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_getterDelegate | address |  |
| \_upgrade | uint256 |  |

### initialize

Initialization function

```javascript
function initialize(address _getterDelegate, uint256 _someValue) public nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_getterDelegate | address |  |
| \_someValue | uint256 |  |

### newFunction

```javascript
function newFunction(uint256 _upgrade) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_upgrade | uint256 |  |

### addModuleWithLabel

⤾ overrides [SecurityToken.addModuleWithLabel](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/SecurityToken.md#addmodulewithlabel)

```javascript
function addModuleWithLabel(address , bytes , uint256 , uint256 , bytes32 , bool ) public nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
|  | address |  |
|  | bytes |  |
|  | uint256 |  |
|  | uint256 |  |
|  | bytes32 |  |
|  | bool |  |

