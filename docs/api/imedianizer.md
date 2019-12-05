---
id: version-3.0.0-IMedianizer
title: IMedianizer
original_id: IMedianizer
---

# Interface to MakerDAO Medianizer contract \(IMedianizer.sol\)

View Source: [contracts/external/IMedianizer.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/external/IMedianizer.sol)

**IMedianizer**

## Functions

* [peek\(\)](imedianizer.md#peek)
* [read\(\)](imedianizer.md#read)
* [set\(address wat\)](imedianizer.md#set)
* [set\(bytes12 pos, address wat\)](imedianizer.md#set)
* [setMin\(uint96 min\_\)](imedianizer.md#setmin)
* [setNext\(bytes12 next\_\)](imedianizer.md#setnext)
* [unset\(bytes12 pos\)](imedianizer.md#unset)
* [unset\(address wat\)](imedianizer.md#unset)
* [poke\(\)](imedianizer.md#poke)
* [poke\(bytes32 \)](imedianizer.md#poke)
* [compute\(\)](imedianizer.md#compute)
* [void\(\)](imedianizer.md#void)

### peek

```javascript
function peek() external view
returns(bytes32, bool)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### read

```javascript
function read() external view
returns(bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### set

```javascript
function set(address wat) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| wat | address |  |

### set

```javascript
function set(bytes12 pos, address wat) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| pos | bytes12 |  |
| wat | address |  |

### setMin

```javascript
function setMin(uint96 min_) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| min\_ | uint96 |  |

### setNext

```javascript
function setNext(bytes12 next_) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| next\_ | bytes12 |  |

### unset

```javascript
function unset(bytes12 pos) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| pos | bytes12 |  |

### unset

```javascript
function unset(address wat) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| wat | address |  |

### poke

```javascript
function poke() external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### poke

```javascript
function poke(bytes32 ) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
|  | bytes32 |  |

### compute

```javascript
function compute() external view
returns(bytes32, bool)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### void

```javascript
function void() external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


