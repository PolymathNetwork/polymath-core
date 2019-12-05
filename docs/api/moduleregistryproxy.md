---
id: version-3.0.0-ModuleRegistryProxy
title: ModuleRegistryProxy
original_id: ModuleRegistryProxy
---

# ModuleRegistryProxy \(ModuleRegistryProxy.sol\)

View Source: [contracts/proxy/ModuleRegistryProxy.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/proxy/ModuleRegistryProxy.sol)

**↗ Extends:** [**EternalStorage**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/EternalStorage.md)**,** [**OwnedUpgradeabilityProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/OwnedUpgradeabilityProxy.md)

**ModuleRegistryProxy**

This proxy holds the storage of the ModuleRegistry contract and delegates every call to the current implementation set. Besides, it allows upgrading the contract's behaviour towards further implementations, and provides basic authorization control functionalities

## Functions

