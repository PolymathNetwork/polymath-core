---
id: version-3.0.0-ReclaimTokens
title: ReclaimTokens
original_id: ReclaimTokens
---

# Utility contract to allow owner to retreive any ERC20 sent to the contract (ReclaimTokens.sol)

View Source: [contracts/ReclaimTokens.sol](../../contracts/ReclaimTokens.sol)

**↗ Extends: [Ownable](Ownable.md)**
**↘ Derived Contracts: [FeatureRegistry](FeatureRegistry.md), [PolymathRegistry](PolymathRegistry.md)**

**ReclaimTokens**

## Functions

- [reclaimERC20(address _tokenContract)](#reclaimerc20)

### reclaimERC20

Reclaim all ERC20Basic compatible tokens

```js
function reclaimERC20(address _tokenContract) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _tokenContract | address | The address of the token contract | 

