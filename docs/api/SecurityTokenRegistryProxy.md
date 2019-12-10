---
id: version-3.0.0-SecurityTokenRegistryProxy
title: SecurityTokenRegistryProxy
original_id: SecurityTokenRegistryProxy
---

# SecurityTokenRegistryProxy (SecurityTokenRegistryProxy.sol)

View Source: [contracts/proxy/SecurityTokenRegistryProxy.sol](../../contracts/proxy/SecurityTokenRegistryProxy.sol)

**↗ Extends: [EternalStorage](EternalStorage.md), [OwnedUpgradeabilityProxy](OwnedUpgradeabilityProxy.md)**

**SecurityTokenRegistryProxy**

This proxy holds the storage of the SecurityTokenRegistry contract and delegates every call to the current implementation set.
Besides, it allows to upgrade the SecurityTokenRegistry's behaviour towards further implementations, and provides basic
authorization control functionalities

## Functions

