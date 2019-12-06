---
id: version-3.0.0-Proxy
title: Proxy
original_id: Proxy
---

# Proxy (Proxy.sol)

View Source: [contracts/proxy/Proxy.sol](../../contracts/proxy/Proxy.sol)

**↘ Derived Contracts: [DataStoreProxy](DataStoreProxy.md), [SecurityToken](SecurityToken.md), [SecurityTokenRegistry](SecurityTokenRegistry.md), [UpgradeabilityProxy](UpgradeabilityProxy.md)**

**Proxy**

Gives the possibility to delegate any call to a foreign implementation.

## Functions

- [_implementation()](#_implementation)
- [_fallback()](#_fallback)
- [_delegate(address implementation)](#_delegate)
- [()](#)

### _implementation

⤿ Overridden Implementation(s): [DataStoreProxy._implementation](DataStoreProxy.md#_implementation),[OwnedUpgradeabilityProxy._implementation](OwnedUpgradeabilityProxy.md#_implementation),[SecurityToken._implementation](SecurityToken.md#_implementation),[SecurityTokenRegistry._implementation](SecurityTokenRegistry.md#_implementation)

Tells the address of the implementation where every call will be delegated.

```js
function _implementation() internal view
returns(address)
```

**Returns**

address of the implementation to which it will be delegated

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### _fallback

Fallback function.
Implemented entirely in `_fallback`.

```js
function _fallback() internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### _delegate

Fallback function allowing to perform a delegatecall to the given implementation.
This function will return whatever the implementation call returns

```js
function _delegate(address implementation) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| implementation | address |  | 

### 

```js
function () external payable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

