---
id: version-3.0.0-Ownable
title: Ownable
original_id: Ownable
---

# Ownable (Ownable.sol)

View Source: [openzeppelin-solidity/contracts/ownership/Ownable.sol](../../openzeppelin-solidity/contracts/ownership/Ownable.sol)

**↘ Derived Contracts: [MakerDAOOracle](MakerDAOOracle.md), [ModuleFactory](ModuleFactory.md), [ReclaimTokens](ReclaimTokens.md), [StableOracle](StableOracle.md), [STFactory](STFactory.md)**

**Ownable**

The Ownable contract has an owner address, and provides basic authorization control
functions, this simplifies the implementation of "user permissions".

## Contract Members
**Constants & Variables**

```js
address private _owner;

```

**Events**

```js
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
```

## Modifiers

- [onlyOwner](#onlyowner)

### onlyOwner

Throws if called by any account other than the owner.

```js
modifier onlyOwner() internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

## Functions

- [()](#)
- [owner()](#owner)
- [isOwner()](#isowner)
- [renounceOwnership()](#renounceownership)
- [transferOwnership(address newOwner)](#transferownership)
- [_transferOwnership(address newOwner)](#_transferownership)

### 

The Ownable constructor sets the original `owner` of the contract to the sender
account.

```js
function () internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### owner

⤾ overrides [IModuleFactory.owner](IModuleFactory.md#owner)

```js
function owner() public view
returns(address)
```

**Returns**

the address of the owner.

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### isOwner

```js
function isOwner() public view
returns(bool)
```

**Returns**

true if `msg.sender` is the owner of the contract.

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### renounceOwnership

Renouncing ownership will leave the contract without an owner,
thereby removing any functionality that is only available to the owner.

```js
function renounceOwnership() public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### transferOwnership

Allows the current owner to transfer control of the contract to a newOwner.

```js
function transferOwnership(address newOwner) public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| newOwner | address | The address to transfer ownership to. | 

### _transferOwnership

Transfers control of the contract to a newOwner.

```js
function _transferOwnership(address newOwner) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| newOwner | address | The address to transfer ownership to. | 

