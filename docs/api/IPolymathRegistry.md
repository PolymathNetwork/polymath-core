---
id: version-3.0.0-IPolymathRegistry
title: IPolymathRegistry
original_id: IPolymathRegistry
---

# IPolymathRegistry.sol

View Source: [contracts/interfaces/IPolymathRegistry.sol](../../contracts/interfaces/IPolymathRegistry.sol)

**↘ Derived Contracts: [PolymathRegistry](PolymathRegistry.md)**

**IPolymathRegistry**

**Events**

```js
event ChangeAddress(string  _nameKey, address indexed _oldAddress, address indexed _newAddress);
```

## Functions

- [getAddress(string _nameKey)](#getaddress)
- [changeAddress(string _nameKey, address _newAddress)](#changeaddress)

### getAddress

⤿ Overridden Implementation(s): [PolymathRegistry.getAddress](PolymathRegistry.md#getaddress)

Returns the contract address

```js
function getAddress(string _nameKey) external view
returns(registryAddress address)
```

**Returns**

address

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _nameKey | string | is the key for the contract address mapping | 

### changeAddress

⤿ Overridden Implementation(s): [PolymathRegistry.changeAddress](PolymathRegistry.md#changeaddress)

Changes the contract address

```js
function changeAddress(string _nameKey, address _newAddress) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _nameKey | string | is the key for the contract address mapping | 
| _newAddress | address | is the new contract address | 

