---
id: version-3.0.0-IUpgradableTokenFactory
title: IUpgradableTokenFactory
original_id: IUpgradableTokenFactory
---

# Interface to be implemented by upgradable token factories (IUpgradableTokenFactory.sol)

View Source: [contracts/interfaces/IUpgradableTokenFactory.sol](../../contracts/interfaces/IUpgradableTokenFactory.sol)

**IUpgradableTokenFactory**

## Functions

- [upgradeToken(uint8 _maxModuleType)](#upgradetoken)

### upgradeToken

Used to upgrade a token

```js
function upgradeToken(uint8 _maxModuleType) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _maxModuleType | uint8 | maximum module type enumeration | 

