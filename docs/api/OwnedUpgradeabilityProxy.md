---
id: version-3.0.0-OwnedUpgradeabilityProxy
title: OwnedUpgradeabilityProxy
original_id: OwnedUpgradeabilityProxy
---

# OwnedUpgradeabilityProxy (OwnedUpgradeabilityProxy.sol)

View Source: [contracts/proxy/OwnedUpgradeabilityProxy.sol](../../contracts/proxy/OwnedUpgradeabilityProxy.sol)

**↗ Extends: [UpgradeabilityProxy](UpgradeabilityProxy.md)**
**↘ Derived Contracts: [AdvancedPLCRVotingCheckpointProxy](AdvancedPLCRVotingCheckpointProxy.md), [BlacklistTransferManagerProxy](BlacklistTransferManagerProxy.md), [CappedSTOProxy](CappedSTOProxy.md), [CountTransferManagerProxy](CountTransferManagerProxy.md), [DummySTOProxy](DummySTOProxy.md), [ERC20DividendCheckpointProxy](ERC20DividendCheckpointProxy.md), [EtherDividendCheckpointProxy](EtherDividendCheckpointProxy.md), [GeneralPermissionManagerProxy](GeneralPermissionManagerProxy.md), [GeneralTransferManagerProxy](GeneralTransferManagerProxy.md), [IssuanceProxy](IssuanceProxy.md), [LockUpTransferManagerProxy](LockUpTransferManagerProxy.md), [ManualApprovalTransferManagerProxy](ManualApprovalTransferManagerProxy.md), [ModuleRegistryProxy](ModuleRegistryProxy.md), [PercentageTransferManagerProxy](PercentageTransferManagerProxy.md), [PLCRVotingCheckpointProxy](PLCRVotingCheckpointProxy.md), [PreSaleSTOProxy](PreSaleSTOProxy.md), [RestrictedPartialSaleTMProxy](RestrictedPartialSaleTMProxy.md), [ScheduleCheckpointProxy](ScheduleCheckpointProxy.md), [SecurityTokenProxy](SecurityTokenProxy.md), [SecurityTokenRegistryProxy](SecurityTokenRegistryProxy.md), [USDTieredSTOProxy](USDTieredSTOProxy.md), [VestingEscrowWalletProxy](VestingEscrowWalletProxy.md), [VolumeRestrictionTMProxy](VolumeRestrictionTMProxy.md), [WeightedVoteCheckpointProxy](WeightedVoteCheckpointProxy.md)**

**OwnedUpgradeabilityProxy**

This contract combines an upgradeability proxy with basic authorization control functionalities

## Contract Members
**Constants & Variables**

```js
address private __upgradeabilityOwner;

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

- [()](#)
- [_upgradeabilityOwner()](#_upgradeabilityowner)
- [_setUpgradeabilityOwner(address _newUpgradeabilityOwner)](#_setupgradeabilityowner)
- [_implementation()](#_implementation)
- [proxyOwner()](#proxyowner)
- [version()](#version)
- [implementation()](#implementation)
- [transferProxyOwnership(address _newOwner)](#transferproxyownership)
- [upgradeTo(string _newVersion, address _newImplementation)](#upgradeto)
- [upgradeToAndCall(string _newVersion, address _newImplementation, bytes _data)](#upgradetoandcall)
- [_upgradeToAndCall(string _newVersion, address _newImplementation, bytes _data)](#_upgradetoandcall)

### 

the constructor sets the original owner of the contract to the sender account.

```js
function () public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### _upgradeabilityOwner

Tells the address of the owner

```js
function _upgradeabilityOwner() internal view
returns(address)
```

**Returns**

the address of the owner

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### _setUpgradeabilityOwner

Sets the address of the owner

```js
function _setUpgradeabilityOwner(address _newUpgradeabilityOwner) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _newUpgradeabilityOwner | address |  | 

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

### version

Tells the version name of the current implementation

```js
function version() external nonpayable ifOwner 
returns(string)
```

**Returns**

string representing the name of the current version

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

### upgradeTo

Allows the upgradeability owner to upgrade the current version of the proxy.

```js
function upgradeTo(string _newVersion, address _newImplementation) external nonpayable ifOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _newVersion | string | representing the version name of the new implementation to be set. | 
| _newImplementation | address | representing the address of the new implementation to be set. | 

### upgradeToAndCall

Allows the upgradeability owner to upgrade the current version of the proxy and call the new implementation
to initialize whatever is needed through a low level call.

```js
function upgradeToAndCall(string _newVersion, address _newImplementation, bytes _data) external payable ifOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _newVersion | string | representing the version name of the new implementation to be set. | 
| _newImplementation | address | representing the address of the new implementation to be set. | 
| _data | bytes | represents the msg.data to bet sent in the low level call. This parameter may include the function
signature of the implementation to be called with the needed payload | 

### _upgradeToAndCall

```js
function _upgradeToAndCall(string _newVersion, address _newImplementation, bytes _data) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _newVersion | string |  | 
| _newImplementation | address |  | 
| _data | bytes |  | 

