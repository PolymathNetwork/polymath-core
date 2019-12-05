---
id: version-3.0.0-VersionUtils
title: VersionUtils
original_id: VersionUtils
---

# Helper library use to compare or validate the semantic versions \(VersionUtils.sol\)

View Source: [contracts/libraries/VersionUtils.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/libraries/VersionUtils.sol)

**VersionUtils**

## Functions

* [lessThanOrEqual\(uint8\[\] \_current, uint8\[\] \_new\)](versionutils.md#lessthanorequal)
* [greaterThanOrEqual\(uint8\[\] \_current, uint8\[\] \_new\)](versionutils.md#greaterthanorequal)
* [pack\(uint8 \_major, uint8 \_minor, uint8 \_patch\)](versionutils.md#pack)
* [unpack\(uint24 \_packedVersion\)](versionutils.md#unpack)
* [packKYC\(uint64 \_a, uint64 \_b, uint64 \_c, uint8 \_d\)](versionutils.md#packkyc)
* [unpackKYC\(uint256 \_packedVersion\)](versionutils.md#unpackkyc)

### lessThanOrEqual

```javascript
function lessThanOrEqual(uint8[] _current, uint8[] _new) internal pure
returns(bool)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_current | uint8\[\] |  |
| \_new | uint8\[\] |  |

### greaterThanOrEqual

```javascript
function greaterThanOrEqual(uint8[] _current, uint8[] _new) internal pure
returns(bool)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_current | uint8\[\] |  |
| \_new | uint8\[\] |  |

### pack

Used to pack the uint8\[\] array data into uint24 value

```javascript
function pack(uint8 _major, uint8 _minor, uint8 _patch) internal pure
returns(uint24)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_major | uint8 | Major version |
| \_minor | uint8 | Minor version |
| \_patch | uint8 | Patch version |

### unpack

Used to convert packed data into uint8 array

```javascript
function unpack(uint24 _packedVersion) internal pure
returns(uint8[])
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_packedVersion | uint24 | Packed data |

### packKYC

Used to packed the KYC data

```javascript
function packKYC(uint64 _a, uint64 _b, uint64 _c, uint8 _d) internal pure
returns(uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_a | uint64 |  |
| \_b | uint64 |  |
| \_c | uint64 |  |
| \_d | uint8 |  |

### unpackKYC

Used to convert packed data into KYC data

```javascript
function unpackKYC(uint256 _packedVersion) internal pure
returns(canSendAfter uint64, canReceiveAfter uint64, expiryTime uint64, added uint8)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_packedVersion | uint256 | Packed data |

