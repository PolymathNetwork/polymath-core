---
id: version-3.0.0-GeneralPermissionManagerStorage
title: GeneralPermissionManagerStorage
original_id: GeneralPermissionManagerStorage
---

# Contract used to store layout for the GeneralPermissionManager storage (GeneralPermissionManagerStorage.sol)

View Source: [contracts/modules/PermissionManager/GeneralPermissionManagerStorage.sol](../../contracts/modules/PermissionManager/GeneralPermissionManagerStorage.sol)

**↘ Derived Contracts: [GeneralPermissionManager](GeneralPermissionManager.md), [GeneralPermissionManagerProxy](GeneralPermissionManagerProxy.md)**

**GeneralPermissionManagerStorage**

## Contract Members
**Constants & Variables**

```js
mapping(address => mapping(address => mapping(bytes32 => bool))) public perms;
mapping(address => bytes32) public delegateDetails;
address[] public allDelegates;

```

## Functions

