---
id: version-3.0.0-Ownable
title: Ownable
original_id: Ownable
---

# Ownable (Ownable.sol)

View Source: [openzeppelin-solidity/contracts/ownership/Ownable.sol](../../openzeppelin-solidity/contracts/ownership/Ownable.sol)

**↘ Derived Contracts: [MakerDAOOracle](MakerDAOOracle.md), [ModuleFactory](ModuleFactory.md), [ReclaimTokens](ReclaimTokens.md), [RegistryUpdater](RegistryUpdater.md)**

**Ownable**

The Ownable contract has an owner address, and provides basic authorization control
functions, this simplifies the implementation of "user permissions".

## Contract Members
**Constants & Variables**

```js
address public owner;

```

**Events**

```js
event OwnershipRenounced(address indexed previousOwner);
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

- [renounceOwnership()](#renounceownership)
- [transferOwnership(address _newOwner)](#transferownership)
- [_transferOwnership(address _newOwner)](#_transferownership)

### renounceOwnership

Allows the current owner to relinquish control of the contract.

```js
function renounceOwnership() public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### transferOwnership

Allows the current owner to transfer control of the contract to a newOwner.

```js
function transferOwnership(address _newOwner) public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _newOwner | address | The address to transfer ownership to. | 

### _transferOwnership

Transfers control of the contract to a newOwner.

```js
function _transferOwnership(address _newOwner) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _newOwner | address | The address to transfer ownership to. | 

