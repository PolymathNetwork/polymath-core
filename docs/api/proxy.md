---
id: version-3.0.0-Proxy
title: Proxy
original_id: Proxy
---

# Proxy \(Proxy.sol\)

View Source: [contracts/proxy/Proxy.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/proxy/Proxy.sol)

**↘ Derived Contracts:** [**DataStoreProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/DataStoreProxy.md)**,** [**SecurityToken**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/SecurityToken.md)**,** [**SecurityTokenRegistry**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/SecurityTokenRegistry.md)**,** [**UpgradeabilityProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/UpgradeabilityProxy.md)

**Proxy**

Gives the possibility to delegate any call to a foreign implementation.

## Functions

* [\_implementation\(\)](proxy.md#_implementation)
* [\_fallback\(\)](proxy.md#_fallback)
* [\_delegate\(address implementation\)](proxy.md#_delegate)
* [\(\)](proxy.md)

### \_implementation

⤿ Overridden Implementation\(s\): [DataStoreProxy.\_implementation](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/DataStoreProxy.md#_implementation),[OwnedUpgradeabilityProxy.\_implementation](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/OwnedUpgradeabilityProxy.md#_implementation),[SecurityToken.\_implementation](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/SecurityToken.md#_implementation),[SecurityTokenRegistry.\_implementation](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/SecurityTokenRegistry.md#_implementation)

Tells the address of the implementation where every call will be delegated.

```javascript
function _implementation() internal view
returns(address)
```

**Returns**

address of the implementation to which it will be delegated

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### \_fallback

Fallback function. Implemented entirely in `_fallback`.

```javascript
function _fallback() internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### \_delegate

Fallback function allowing to perform a delegatecall to the given implementation. This function will return whatever the implementation call returns

```javascript
function _delegate(address implementation) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| implementation | address |  |

```javascript
function () external payable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


