---
id: version-3.0.0-SecurityTokenRegistryProxy
title: SecurityTokenRegistryProxy
original_id: SecurityTokenRegistryProxy
---

# SecurityTokenRegistryProxy \(SecurityTokenRegistryProxy.sol\)

View Source: [contracts/proxy/SecurityTokenRegistryProxy.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/proxy/SecurityTokenRegistryProxy.sol)

**↗ Extends:** [**EternalStorage**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/EternalStorage.md)**,** [**OwnedUpgradeabilityProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/OwnedUpgradeabilityProxy.md)

**SecurityTokenRegistryProxy**

This proxy holds the storage of the SecurityTokenRegistry contract and delegates every call to the current implementation set. Besides, it allows to upgrade the SecurityTokenRegistry's behaviour towards further implementations, and provides basic authorization control functionalities

## Functions

