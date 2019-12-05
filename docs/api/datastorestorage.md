---
id: version-3.0.0-DataStoreStorage
title: DataStoreStorage
original_id: DataStoreStorage
---

# DataStoreStorage.sol

View Source: [contracts/datastore/DataStoreStorage.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/datastore/DataStoreStorage.sol)

**↘ Derived Contracts:** [**DataStore**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/DataStore.md)**,** [**DataStoreProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/DataStoreProxy.md)

**DataStoreStorage**

## Contract Members

**Constants & Variables**

```javascript
//internal members
address internal __implementation;
mapping(bytes32 => uint256) internal uintData;
mapping(bytes32 => bytes32) internal bytes32Data;
mapping(bytes32 => address) internal addressData;
mapping(bytes32 => string) internal stringData;
mapping(bytes32 => bytes) internal bytesData;
mapping(bytes32 => bool) internal boolData;
mapping(bytes32 => uint256[]) internal uintArrayData;
mapping(bytes32 => bytes32[]) internal bytes32ArrayData;
mapping(bytes32 => address[]) internal addressArrayData;
mapping(bytes32 => bool[]) internal boolArrayData;
uint8 internal constant DATA_KEY;
bytes32 internal constant MANAGEDATA;

//public members
contract ISecurityToken public securityToken;
```

## Functions

