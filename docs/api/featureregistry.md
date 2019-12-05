---
id: version-3.0.0-FeatureRegistry
title: FeatureRegistry
original_id: FeatureRegistry
---

# Registry for managing polymath feature switches \(FeatureRegistry.sol\)

View Source: [contracts/FeatureRegistry.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/FeatureRegistry.sol)

**↗ Extends:** [**IFeatureRegistry**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IFeatureRegistry.md)**,** [**ReclaimTokens**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ReclaimTokens.md)

**FeatureRegistry**

## Contract Members

**Constants & Variables**

```javascript
mapping(bytes32 => bool) public featureStatus;
```

## Functions

* [getFeatureStatus\(string \_nameKey\)](featureregistry.md#getfeaturestatus)
* [setFeatureStatus\(string \_nameKey, bool \_newStatus\)](featureregistry.md#setfeaturestatus)

### getFeatureStatus

⤾ overrides [IFeatureRegistry.getFeatureStatus](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IFeatureRegistry.md#getfeaturestatus)

Get the status of a feature

```javascript
function getFeatureStatus(string _nameKey) external view
returns(bool)
```

**Returns**

bool

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_nameKey | string | is the key for the feature status mapping |

### setFeatureStatus

⤾ overrides [IFeatureRegistry.setFeatureStatus](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IFeatureRegistry.md#setfeaturestatus)

change a feature status

```javascript
function setFeatureStatus(string _nameKey, bool _newStatus) external nonpayable onlyOwner
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_nameKey | string | is the key for the feature status mapping |
| \_newStatus | bool | is the new feature status |

