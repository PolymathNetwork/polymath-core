---
id: version-3.0.0-UpgradeabilityProxy
title: UpgradeabilityProxy
original_id: UpgradeabilityProxy
---

# UpgradeabilityProxy \(UpgradeabilityProxy.sol\)

View Source: [contracts/proxy/UpgradeabilityProxy.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/proxy/UpgradeabilityProxy.sol)

**↗ Extends:** [**Proxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/Proxy.md) **↘ Derived Contracts:** [**OwnedUpgradeabilityProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/OwnedUpgradeabilityProxy.md)

**UpgradeabilityProxy**

This contract represents a proxy where the implementation address to which it will delegate can be upgraded

## Contract Members

**Constants & Variables**

```javascript
string internal __version;
address internal __implementation;
```

**Events**

```javascript
event Upgraded(string  _newVersion, address indexed _newImplementation);
```

## Functions

* [\_upgradeTo\(string \_newVersion, address \_newImplementation\)](upgradeabilityproxy.md#_upgradeto)

### \_upgradeTo

Upgrades the implementation address

```javascript
function _upgradeTo(string _newVersion, address _newImplementation) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_newVersion | string | representing the version name of the new implementation to be set |
| \_newImplementation | address | representing the address of the new implementation to be set |

