---
id: version-3.0.0-IOwnable
title: IOwnable
original_id: IOwnable
---

# Ownable (IOwnable.sol)

View Source: [contracts/interfaces/IOwnable.sol](../../contracts/interfaces/IOwnable.sol)

**IOwnable**

The Ownable contract has an owner address, and provides basic authorization control
functions, this simplifies the implementation of "user permissions".

## Functions

- [owner()](#owner)
- [renounceOwnership()](#renounceownership)
- [transferOwnership(address _newOwner)](#transferownership)

### owner

Returns owner

```js
function owner() external view
returns(address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### renounceOwnership

Allows the current owner to relinquish control of the contract.

```js
function renounceOwnership() external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### transferOwnership

Allows the current owner to transfer control of the contract to a newOwner.

```js
function transferOwnership(address _newOwner) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _newOwner | address | The address to transfer ownership to. | 

