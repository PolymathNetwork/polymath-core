---
id: version-3.0.0-ModuleRegistryProxy
title: ModuleRegistryProxy
original_id: ModuleRegistryProxy
---

# ModuleRegistryProxy (ModuleRegistryProxy.sol)

View Source: [contracts/proxy/ModuleRegistryProxy.sol](../../contracts/proxy/ModuleRegistryProxy.sol)

**↗ Extends: [EternalStorage](EternalStorage.md), [OwnedUpgradeabilityProxy](OwnedUpgradeabilityProxy.md)**

**ModuleRegistryProxy**

This proxy holds the storage of the ModuleRegistry contract and delegates every call to the current implementation set.
Besides, it allows upgrading the contract's behaviour towards further implementations, and provides basic
authorization control functionalities

## Functions

