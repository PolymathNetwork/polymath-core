---
id: version-3.0.0-IUpgradableTokenFactory
title: IUpgradableTokenFactory
original_id: IUpgradableTokenFactory
---

# Interface to be implemented by upgradable token factories \(IUpgradableTokenFactory.sol\)

View Source: [contracts/interfaces/IUpgradableTokenFactory.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/interfaces/IUpgradableTokenFactory.sol)

**IUpgradableTokenFactory**

## Functions

* [upgradeToken\(uint8 \_maxModuleType\)](iupgradabletokenfactory.md#upgradetoken)

### upgradeToken

Used to upgrade a token

```javascript
function upgradeToken(uint8 _maxModuleType) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_maxModuleType | uint8 | maximum module type enumeration |

