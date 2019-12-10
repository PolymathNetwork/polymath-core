---
id: version-3.0.0-UpgradeabilityProxy
title: UpgradeabilityProxy
original_id: UpgradeabilityProxy
---

# UpgradeabilityProxy (UpgradeabilityProxy.sol)

View Source: [contracts/proxy/UpgradeabilityProxy.sol](../../contracts/proxy/UpgradeabilityProxy.sol)

**↗ Extends: [Proxy](Proxy.md)**
**↘ Derived Contracts: [OwnedUpgradeabilityProxy](OwnedUpgradeabilityProxy.md)**

**UpgradeabilityProxy**

This contract represents a proxy where the implementation address to which it will delegate can be upgraded

## Contract Members
**Constants & Variables**

```js
string internal __version;
address internal __implementation;

```

**Events**

```js
event Upgraded(string  _newVersion, address indexed _newImplementation);
```

## Functions

- [_upgradeTo(string _newVersion, address _newImplementation)](#_upgradeto)

### _upgradeTo

Upgrades the implementation address

```js
function _upgradeTo(string _newVersion, address _newImplementation) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _newVersion | string | representing the version name of the new implementation to be set | 
| _newImplementation | address | representing the address of the new implementation to be set | 

