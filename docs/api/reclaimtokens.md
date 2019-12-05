---
id: version-3.0.0-ReclaimTokens
title: ReclaimTokens
original_id: ReclaimTokens
---

# Utility contract to allow owner to retreive any ERC20 sent to the contract \(ReclaimTokens.sol\)

View Source: [contracts/ReclaimTokens.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/ReclaimTokens.sol)

**↗ Extends:** [**Ownable**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/Ownable.md) **↘ Derived Contracts:** [**FeatureRegistry**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/FeatureRegistry.md)**,** [**PolymathRegistry**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/PolymathRegistry.md)

**ReclaimTokens**

## Functions

* [reclaimERC20\(address \_tokenContract\)](reclaimtokens.md#reclaimerc20)

### reclaimERC20

Reclaim all ERC20Basic compatible tokens

```javascript
function reclaimERC20(address _tokenContract) external nonpayable onlyOwner
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_tokenContract | address | The address of the token contract |

