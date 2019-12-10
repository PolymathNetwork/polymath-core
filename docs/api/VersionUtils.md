---
id: version-3.0.0-VersionUtils
title: VersionUtils
original_id: VersionUtils
---

# Helper library use to compare or validate the semantic versions (VersionUtils.sol)

View Source: [contracts/libraries/VersionUtils.sol](../../contracts/libraries/VersionUtils.sol)

**VersionUtils**

## Functions

- [isValidVersion(uint8[] _current, uint8[] _new)](#isvalidversion)
- [compareLowerBound(uint8[] _version1, uint8[] _version2)](#comparelowerbound)
- [compareUpperBound(uint8[] _version1, uint8[] _version2)](#compareupperbound)
- [pack(uint8 _major, uint8 _minor, uint8 _patch)](#pack)
- [unpack(uint24 _packedVersion)](#unpack)

### isValidVersion

This function is used to validate the version submitted

```js
function isValidVersion(uint8[] _current, uint8[] _new) internal pure
returns(bool)
```

**Returns**

bool

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _current | uint8[] | Array holds the present version of ST | 
| _new | uint8[] | Array holds the latest version of the ST | 

### compareLowerBound

Used to compare the lower bound with the latest version

```js
function compareLowerBound(uint8[] _version1, uint8[] _version2) internal pure
returns(bool)
```

**Returns**

bool

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _version1 | uint8[] | Array holds the lower bound of the version | 
| _version2 | uint8[] | Array holds the latest version of the ST | 

### compareUpperBound

Used to compare the upper bound with the latest version

```js
function compareUpperBound(uint8[] _version1, uint8[] _version2) internal pure
returns(bool)
```

**Returns**

bool

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _version1 | uint8[] | Array holds the upper bound of the version | 
| _version2 | uint8[] | Array holds the latest version of the ST | 

### pack

Used to pack the uint8[] array data into uint24 value

```js
function pack(uint8 _major, uint8 _minor, uint8 _patch) internal pure
returns(uint24)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _major | uint8 | Major version | 
| _minor | uint8 | Minor version | 
| _patch | uint8 | Patch version | 

### unpack

Used to convert packed data into uint8 array

```js
function unpack(uint24 _packedVersion) internal pure
returns(uint8[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _packedVersion | uint24 | Packed data | 

