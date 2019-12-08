---
id: version-3.0.0-IFeatureRegistry
title: IFeatureRegistry
original_id: IFeatureRegistry
---

# Interface for managing polymath feature switches (IFeatureRegistry.sol)

View Source: [contracts/interfaces/IFeatureRegistry.sol](../../contracts/interfaces/IFeatureRegistry.sol)

**↘ Derived Contracts: [FeatureRegistry](FeatureRegistry.md)**

**IFeatureRegistry**

## Functions

- [getFeatureStatus(string _nameKey)](#getfeaturestatus)

### getFeatureStatus

⤿ Overridden Implementation(s): [FeatureRegistry.getFeatureStatus](FeatureRegistry.md#getfeaturestatus)

Get the status of a feature

```js
function getFeatureStatus(string _nameKey) external view
returns(bool)
```

**Returns**

bool

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _nameKey | string | is the key for the feature status mapping | 

