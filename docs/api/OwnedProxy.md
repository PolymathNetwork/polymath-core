---
id: version-3.0.0-OwnedProxy
title: OwnedProxy
original_id: OwnedProxy
---

# OwnedProxy (OwnedProxy.sol)

View Source: [contracts/proxy/OwnedProxy.sol](../../contracts/proxy/OwnedProxy.sol)

**↗ Extends: [Proxy](Proxy.md)**
**↘ Derived Contracts: [ERC20DividendCheckpointProxy](ERC20DividendCheckpointProxy.md), [EtherDividendCheckpointProxy](EtherDividendCheckpointProxy.md), [GeneralTransferManagerProxy](GeneralTransferManagerProxy.md), [USDTieredSTOProxy](USDTieredSTOProxy.md), [VestingEscrowWalletProxy](VestingEscrowWalletProxy.md), [VolumeRestrictionTMProxy](VolumeRestrictionTMProxy.md)**

**OwnedProxy**

This contract combines an upgradeability proxy with basic authorization control functionalities

## Contract Members
**Constants & Variables**

```js
//private members
address private __owner;

//internal members
address internal __implementation;

```

**Events**

```js
event ProxyOwnershipTransferred(address  _previousOwner, address  _newOwner);
```

## Modifiers

- [ifOwner](#ifowner)

### ifOwner

Throws if called by any account other than the owner.

```js
modifier ifOwner() internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

## Functions

- [_owner()](#_owner)
- [_setOwner(address _newOwner)](#_setowner)
- [_implementation()](#_implementation)
- [proxyOwner()](#proxyowner)
- [implementation()](#implementation)
- [transferProxyOwnership(address _newOwner)](#transferproxyownership)

### _owner

Tells the address of the owner

```js
function _owner() internal view
returns(address)
```

**Returns**

the address of the owner

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### _setOwner

Sets the address of the owner

```js
function _setOwner(address _newOwner) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _newOwner | address |  | 

### _implementation

⤾ overrides [Proxy._implementation](Proxy.md#_implementation)

Internal function to provide the address of the implementation contract

```js
function _implementation() internal view
returns(address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### proxyOwner

Tells the address of the proxy owner

```js
function proxyOwner() external nonpayable ifOwner 
returns(address)
```

**Returns**

the address of the proxy owner

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### implementation

Tells the address of the current implementation

```js
function implementation() external nonpayable ifOwner 
returns(address)
```

**Returns**

address of the current implementation

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### transferProxyOwnership

Allows the current owner to transfer control of the contract to a newOwner.

```js
function transferProxyOwnership(address _newOwner) external nonpayable ifOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _newOwner | address | The address to transfer ownership to. | 

