---
id: version-3.0.0-Migrations
title: Migrations
original_id: Migrations
---

# Migrations.sol

View Source: [contracts/Migrations.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/Migrations.sol)

**Migrations**

## Contract Members

**Constants & Variables**

```javascript
address public owner;
uint256 public lastCompletedMigration;
```

## Modifiers

* [restricted](migrations.md#restricted)

### restricted

```javascript
modifier restricted() internal
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


## Functions

* [\(\)](migrations.md)
* [setCompleted\(uint256 \_completed\)](migrations.md#setcompleted)
* [upgrade\(address \_newAddress\)](migrations.md#upgrade)

```javascript
function () public nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### setCompleted

```javascript
function setCompleted(uint256 _completed) public nonpayable restricted
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_completed | uint256 |  |

### upgrade

```javascript
function upgrade(address _newAddress) public nonpayable restricted
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_newAddress | address |  |

