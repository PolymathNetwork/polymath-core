---
id: version-3.0.0-PolymathRegistry
title: PolymathRegistry
original_id: PolymathRegistry
---

# Core functionality for registry upgradability (PolymathRegistry.sol)

View Source: [contracts/PolymathRegistry.sol](../../contracts/PolymathRegistry.sol)

**↗ Extends: [ReclaimTokens](ReclaimTokens.md)**

**PolymathRegistry**

## Contract Members
**Constants & Variables**

```js
mapping(bytes32 => address) public storedAddresses;

```

**Events**

```js
event ChangeAddress(string  _nameKey, address indexed _oldAddress, address indexed _newAddress);
```

## Functions

- [getAddress(string _nameKey)](#getaddress)
- [changeAddress(string _nameKey, address _newAddress)](#changeaddress)

### getAddress

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

Changes the contract address

```js
function changeAddress(string _nameKey, address _newAddress) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _nameKey | string | is the key for the contract address mapping | 
| _newAddress | address | is the new contract address | 

