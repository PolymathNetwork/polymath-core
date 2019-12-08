---
id: version-3.0.0-FeatureRegistry
title: FeatureRegistry
original_id: FeatureRegistry
---

# Registry for managing polymath feature switches (FeatureRegistry.sol)

View Source: [contracts/FeatureRegistry.sol](../../contracts/FeatureRegistry.sol)

**↗ Extends: [IFeatureRegistry](IFeatureRegistry.md), [ReclaimTokens](ReclaimTokens.md)**

**FeatureRegistry**

## Contract Members
**Constants & Variables**

```js
mapping(bytes32 => bool) public featureStatus;

```

## Functions

- [getFeatureStatus(string _nameKey)](#getfeaturestatus)
- [setFeatureStatus(string _nameKey, bool _newStatus)](#setfeaturestatus)

### getFeatureStatus

⤾ overrides [IFeatureRegistry.getFeatureStatus](IFeatureRegistry.md#getfeaturestatus)

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

### setFeatureStatus

⤾ overrides [IFeatureRegistry.setFeatureStatus](IFeatureRegistry.md#setfeaturestatus)

change a feature status

```js
function setFeatureStatus(string _nameKey, bool _newStatus) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _nameKey | string | is the key for the feature status mapping | 
| _newStatus | bool | is the new feature status | 

