---
id: version-3.0.0-Ownable
title: Ownable
original_id: Ownable
---

# Ownable \(Ownable.sol\)

View Source: [openzeppelin-solidity/contracts/ownership/Ownable.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/openzeppelin-solidity/contracts/ownership/Ownable.sol)

**↘ Derived Contracts:** [**MakerDAOOracle**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/MakerDAOOracle.md)**,** [**ModuleFactory**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ModuleFactory.md)**,** [**ReclaimTokens**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ReclaimTokens.md)**,** [**StableOracle**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/StableOracle.md)**,** [**STFactory**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/STFactory.md)

**Ownable**

The Ownable contract has an owner address, and provides basic authorization control functions, this simplifies the implementation of "user permissions".

## Contract Members

**Constants & Variables**

```javascript
address private _owner;
```

**Events**

```javascript
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
```

## Modifiers

* [onlyOwner](ownable.md#onlyowner)

### onlyOwner

Throws if called by any account other than the owner.

```javascript
modifier onlyOwner() internal
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


## Functions

* [\(\)](ownable.md)
* [owner\(\)](ownable.md#owner)
* [isOwner\(\)](ownable.md#isowner)
* [renounceOwnership\(\)](ownable.md#renounceownership)
* [transferOwnership\(address newOwner\)](ownable.md#transferownership)
* [\_transferOwnership\(address newOwner\)](ownable.md#_transferownership)

The Ownable constructor sets the original `owner` of the contract to the sender account.

```javascript
function () internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### owner

```javascript
function owner() public view
returns(address)
```

**Returns**

the address of the owner.

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### isOwner

```javascript
function isOwner() public view
returns(bool)
```

**Returns**

true if `msg.sender` is the owner of the contract.

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### renounceOwnership

Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner.

```javascript
function renounceOwnership() public nonpayable onlyOwner
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### transferOwnership

Allows the current owner to transfer control of the contract to a newOwner.

```javascript
function transferOwnership(address newOwner) public nonpayable onlyOwner
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| newOwner | address | The address to transfer ownership to. |

### \_transferOwnership

Transfers control of the contract to a newOwner.

```javascript
function _transferOwnership(address newOwner) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| newOwner | address | The address to transfer ownership to. |

