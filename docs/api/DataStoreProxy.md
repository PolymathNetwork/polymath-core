---
id: version-3.0.0-DataStoreProxy
title: DataStoreProxy
original_id: DataStoreProxy
---

# DataStoreProxy Proxy (DataStoreProxy.sol)

View Source: [contracts/datastore/DataStoreProxy.sol](../../contracts/datastore/DataStoreProxy.sol)

**↗ Extends: [DataStoreStorage](DataStoreStorage.md), [Proxy](Proxy.md)**

**DataStoreProxy**

## Functions

- [(address _securityToken, address _implementation)](#)
- [_implementation()](#_implementation)

### 

Constructor

```js
function (address _securityToken, address _implementation) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _securityToken | address | Address of the security token | 
| _implementation | address | representing the address of the new implementation to be set | 

### _implementation

⤾ overrides [Proxy._implementation](Proxy.md#_implementation)

Internal function to provide the address of the implementation contract

```js
function _implementation() internal view
returns(address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

