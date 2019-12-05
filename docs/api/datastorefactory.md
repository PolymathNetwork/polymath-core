---
id: version-3.0.0-DataStoreFactory
title: DataStoreFactory
original_id: DataStoreFactory
---

# DataStoreFactory.sol

View Source: [contracts/datastore/DataStoreFactory.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/datastore/DataStoreFactory.sol)

**DataStoreFactory**

## Contract Members

**Constants & Variables**

```javascript
address public implementation;
```

## Functions

* [\(address \_implementation\)](datastorefactory.md)
* [generateDataStore\(address \_securityToken\)](datastorefactory.md#generatedatastore)

```javascript
function (address _implementation) public nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_implementation | address |  |

### generateDataStore

```javascript
function generateDataStore(address _securityToken) public nonpayable
returns(address)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_securityToken | address |  |

