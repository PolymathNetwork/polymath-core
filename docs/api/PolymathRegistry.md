---
id: version-3.0.0-PolymathRegistry
title: PolymathRegistry
original_id: PolymathRegistry
---

# Core functionality for registry upgradability (PolymathRegistry.sol)

View Source: [contracts/PolymathRegistry.sol](../../contracts/PolymathRegistry.sol)

**↗ Extends: [ReclaimTokens](ReclaimTokens.md), [IPolymathRegistry](IPolymathRegistry.md)**

**PolymathRegistry**

## Contract Members
**Constants & Variables**

```js
mapping(bytes32 => address) public storedAddresses;

```

## Functions

- [getAddress(string _nameKey)](#getaddress)
- [changeAddress(string _nameKey, address _newAddress)](#changeaddress)

### getAddress

⤾ overrides [IPolymathRegistry.getAddress](IPolymathRegistry.md#getaddress)

Gets the contract address

```js
function getAddress(string _nameKey) external view
returns(address)
```

**Returns**

address

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _nameKey | string | is the key for the contract address mapping | 

### changeAddress

⤾ overrides [IPolymathRegistry.changeAddress](IPolymathRegistry.md#changeaddress)

Changes the contract address

```js
function changeAddress(string _nameKey, address _newAddress) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _nameKey | string | is the key for the contract address mapping | 
| _newAddress | address | is the new contract address | 

