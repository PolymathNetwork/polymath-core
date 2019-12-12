---
id: version-3.0.0-IFeatureRegistry
title: IFeatureRegistry
original_id: IFeatureRegistry
---

# Interface for managing polymath feature switches (IFeatureRegistry.sol)

View Source: [contracts/interfaces/IFeatureRegistry.sol](../../contracts/interfaces/IFeatureRegistry.sol)

**↘ Derived Contracts: [FeatureRegistry](FeatureRegistry.md)**

**IFeatureRegistry**

**Events**

```js
event ChangeFeatureStatus(string  _nameKey, bool  _newStatus);
```

## Functions

- [setFeatureStatus(string _nameKey, bool _newStatus)](#setfeaturestatus)
- [getFeatureStatus(string _nameKey)](#getfeaturestatus)

### setFeatureStatus

⤿ Overridden Implementation(s): [FeatureRegistry.setFeatureStatus](FeatureRegistry.md#setfeaturestatus)

change a feature status

```js
function setFeatureStatus(string _nameKey, bool _newStatus) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _nameKey | string | is the key for the feature status mapping | 
| _newStatus | bool | is the new feature status | 

### getFeatureStatus

⤿ Overridden Implementation(s): [FeatureRegistry.getFeatureStatus](FeatureRegistry.md#getfeaturestatus)

Get the status of a feature

```js
function getFeatureStatus(string _nameKey) external view
returns(hasFeature bool)
```

**Returns**

bool

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _nameKey | string | is the key for the feature status mapping | 

