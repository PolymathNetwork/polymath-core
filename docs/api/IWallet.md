---
id: version-3.0.0-IWallet
title: IWallet
original_id: IWallet
---

# Interface to be implemented by all Wallet modules (IWallet.sol)

View Source: [contracts/modules/Experimental/Wallet/IWallet.sol](../../contracts/modules/Experimental/Wallet/IWallet.sol)

**↗ Extends: [Module](Module.md), [Pausable](Pausable.md)**
**↘ Derived Contracts: [VestingEscrowWallet](VestingEscrowWallet.md)**

**IWallet**

abstract contract

## Functions

- [unpause()](#unpause)
- [pause()](#pause)

### unpause

```js
function unpause() public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### pause

```js
function pause() public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

