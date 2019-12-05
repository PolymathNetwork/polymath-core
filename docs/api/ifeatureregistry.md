---
id: version-3.0.0-IFeatureRegistry
title: IFeatureRegistry
original_id: IFeatureRegistry
---

# Interface for managing polymath feature switches \(IFeatureRegistry.sol\)

View Source: [contracts/interfaces/IFeatureRegistry.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/interfaces/IFeatureRegistry.sol)

**↘ Derived Contracts:** [**FeatureRegistry**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/FeatureRegistry.md)

**IFeatureRegistry**

**Events**

```javascript
event ChangeFeatureStatus(string  _nameKey, bool  _newStatus);
```

## Functions

* [setFeatureStatus\(string \_nameKey, bool \_newStatus\)](ifeatureregistry.md#setfeaturestatus)
* [getFeatureStatus\(string \_nameKey\)](ifeatureregistry.md#getfeaturestatus)

### setFeatureStatus

⤿ Overridden Implementation\(s\): [FeatureRegistry.setFeatureStatus](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/FeatureRegistry.md#setfeaturestatus)

change a feature status

```javascript
function setFeatureStatus(string _nameKey, bool _newStatus) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_nameKey | string | is the key for the feature status mapping |
| \_newStatus | bool | is the new feature status |

### getFeatureStatus

⤿ Overridden Implementation\(s\): [FeatureRegistry.getFeatureStatus](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/FeatureRegistry.md#getfeaturestatus)

Get the status of a feature

```javascript
function getFeatureStatus(string _nameKey) external view
returns(hasFeature bool)
```

**Returns**

bool

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_nameKey | string | is the key for the feature status mapping |

