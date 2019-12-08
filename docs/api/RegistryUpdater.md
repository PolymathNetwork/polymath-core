---
id: version-3.0.0-RegistryUpdater
title: RegistryUpdater
original_id: RegistryUpdater
---

# RegistryUpdater.sol

View Source: [contracts/RegistryUpdater.sol](../../contracts/RegistryUpdater.sol)

**↗ Extends: [Ownable](Ownable.md)**
**↘ Derived Contracts: [SecurityToken](SecurityToken.md)**

**RegistryUpdater**

## Contract Members
**Constants & Variables**

```js
address public polymathRegistry;
address public moduleRegistry;
address public securityTokenRegistry;
address public featureRegistry;
address public polyToken;

```

## Functions

- [updateFromRegistry()](#updatefromregistry)

### updateFromRegistry

```js
function updateFromRegistry() public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

