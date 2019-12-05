---
id: version-3.0.0-GeneralPermissionManagerStorage
title: GeneralPermissionManagerStorage
original_id: GeneralPermissionManagerStorage
---

# Contract used to store layout for the GeneralPermissionManager storage \(GeneralPermissionManagerStor

View Source: [contracts/modules/PermissionManager/GeneralPermissionManagerStorage.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/modules/PermissionManager/GeneralPermissionManagerStorage.sol)

**↘ Derived Contracts:** [**GeneralPermissionManager**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/GeneralPermissionManager.md)**,** [**GeneralPermissionManagerProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/GeneralPermissionManagerProxy.md)

**GeneralPermissionManagerStorage**

## Contract Members

**Constants & Variables**

```javascript
mapping(address => mapping(address => mapping(bytes32 => bool))) public perms;
mapping(address => bytes32) public delegateDetails;
address[] public allDelegates;
```

## Functions

