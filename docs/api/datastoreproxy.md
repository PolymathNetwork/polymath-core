---
id: version-3.0.0-DataStoreProxy
title: DataStoreProxy
original_id: DataStoreProxy
---

# DataStoreProxy Proxy \(DataStoreProxy.sol\)

View Source: [contracts/datastore/DataStoreProxy.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/datastore/DataStoreProxy.sol)

**↗ Extends:** [**DataStoreStorage**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/DataStoreStorage.md)**,** [**Proxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/Proxy.md)

**DataStoreProxy**

## Functions

* [\(address \_securityToken, address \_implementation\)](datastoreproxy.md)
* [\_implementation\(\)](datastoreproxy.md#_implementation)

Constructor

```javascript
function (address _securityToken, address _implementation) public nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_securityToken | address | Address of the security token |
| \_implementation | address | representing the address of the new implementation to be set |

### \_implementation

⤾ overrides [Proxy.\_implementation](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/Proxy.md#_implementation)

Internal function to provide the address of the implementation contract

```javascript
function _implementation() internal view
returns(address)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


