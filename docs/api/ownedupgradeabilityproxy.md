---
id: version-3.0.0-OwnedUpgradeabilityProxy
title: OwnedUpgradeabilityProxy
original_id: OwnedUpgradeabilityProxy
---

# OwnedUpgradeabilityProxy \(OwnedUpgradeabilityProxy.sol\)

View Source: [contracts/proxy/OwnedUpgradeabilityProxy.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/proxy/OwnedUpgradeabilityProxy.sol)

**↗ Extends:** [**UpgradeabilityProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/UpgradeabilityProxy.md) **↘ Derived Contracts:** [**BlacklistTransferManagerProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/BlacklistTransferManagerProxy.md)**,** [**CappedSTOProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/CappedSTOProxy.md)**,** [**CountTransferManagerProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/CountTransferManagerProxy.md)**,** [**DummySTOProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/DummySTOProxy.md)**,** [**ERC20DividendCheckpointProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ERC20DividendCheckpointProxy.md)**,** [**EtherDividendCheckpointProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/EtherDividendCheckpointProxy.md)**,** [**GeneralPermissionManagerProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/GeneralPermissionManagerProxy.md)**,** [**GeneralTransferManagerProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/GeneralTransferManagerProxy.md)**,** [**LockUpTransferManagerProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/LockUpTransferManagerProxy.md)**,** [**ManualApprovalTransferManagerProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ManualApprovalTransferManagerProxy.md)**,** [**ModuleRegistryProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ModuleRegistryProxy.md)**,** [**PercentageTransferManagerProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/PercentageTransferManagerProxy.md)**,** [**PLCRVotingCheckpointProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/PLCRVotingCheckpointProxy.md)**,** [**PreSaleSTOProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/PreSaleSTOProxy.md)**,** [**SecurityTokenProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/SecurityTokenProxy.md)**,** [**SecurityTokenRegistryProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/SecurityTokenRegistryProxy.md)**,** [**USDTieredSTOProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/USDTieredSTOProxy.md)**,** [**VestingEscrowWalletProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/VestingEscrowWalletProxy.md)**,** [**VolumeRestrictionTMProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/VolumeRestrictionTMProxy.md)**,** [**WeightedVoteCheckpointProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/WeightedVoteCheckpointProxy.md)

**OwnedUpgradeabilityProxy**

This contract combines an upgradeability proxy with basic authorization control functionalities

## Contract Members

**Constants & Variables**

```javascript
address private __upgradeabilityOwner;
```

**Events**

```javascript
event ProxyOwnershipTransferred(address  _previousOwner, address  _newOwner);
```

## Modifiers

* [ifOwner](ownedupgradeabilityproxy.md#ifowner)

### ifOwner

Throws if called by any account other than the owner.

```javascript
modifier ifOwner() internal
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


## Functions

* [\(\)](ownedupgradeabilityproxy.md)
* [\_upgradeabilityOwner\(\)](ownedupgradeabilityproxy.md#_upgradeabilityowner)
* [\_setUpgradeabilityOwner\(address \_newUpgradeabilityOwner\)](ownedupgradeabilityproxy.md#_setupgradeabilityowner)
* [\_implementation\(\)](ownedupgradeabilityproxy.md#_implementation)
* [proxyOwner\(\)](ownedupgradeabilityproxy.md#proxyowner)
* [version\(\)](ownedupgradeabilityproxy.md#version)
* [implementation\(\)](ownedupgradeabilityproxy.md#implementation)
* [transferProxyOwnership\(address \_newOwner\)](ownedupgradeabilityproxy.md#transferproxyownership)
* [upgradeTo\(string \_newVersion, address \_newImplementation\)](ownedupgradeabilityproxy.md#upgradeto)
* [upgradeToAndCall\(string \_newVersion, address \_newImplementation, bytes \_data\)](ownedupgradeabilityproxy.md#upgradetoandcall)
* [\_upgradeToAndCall\(string \_newVersion, address \_newImplementation, bytes \_data\)](ownedupgradeabilityproxy.md#_upgradetoandcall)

the constructor sets the original owner of the contract to the sender account.

```javascript
function () public nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### \_upgradeabilityOwner

Tells the address of the owner

```javascript
function _upgradeabilityOwner() internal view
returns(address)
```

**Returns**

the address of the owner

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### \_setUpgradeabilityOwner

Sets the address of the owner

```javascript
function _setUpgradeabilityOwner(address _newUpgradeabilityOwner) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_newUpgradeabilityOwner | address |  |

### \_implementation

⤾ overrides [Proxy.\_implementation](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/Proxy.md#_implementation)

Internal function to provide the address of the implementation contract

```javascript
function _implementation() internal view
returns(address)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### proxyOwner

Tells the address of the proxy owner

```javascript
function proxyOwner() external nonpayable ifOwner 
returns(address)
```

**Returns**

the address of the proxy owner

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### version

Tells the version name of the current implementation

```javascript
function version() external nonpayable ifOwner 
returns(string)
```

**Returns**

string representing the name of the current version

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### implementation

Tells the address of the current implementation

```javascript
function implementation() external nonpayable ifOwner 
returns(address)
```

**Returns**

address of the current implementation

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### transferProxyOwnership

Allows the current owner to transfer control of the contract to a newOwner.

```javascript
function transferProxyOwnership(address _newOwner) external nonpayable ifOwner
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_newOwner | address | The address to transfer ownership to. |

### upgradeTo

Allows the upgradeability owner to upgrade the current version of the proxy.

```javascript
function upgradeTo(string _newVersion, address _newImplementation) external nonpayable ifOwner
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_newVersion | string | representing the version name of the new implementation to be set. |
| \_newImplementation | address | representing the address of the new implementation to be set. |

### upgradeToAndCall

Allows the upgradeability owner to upgrade the current version of the proxy and call the new implementation to initialize whatever is needed through a low level call.

```javascript
function upgradeToAndCall(string _newVersion, address _newImplementation, bytes _data) external payable ifOwner
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_newVersion | string | representing the version name of the new implementation to be set. |
| \_newImplementation | address | representing the address of the new implementation to be set. |
| \_data | bytes | represents the msg.data to bet sent in the low level call. This parameter may include the function |

signature of the implementation to be called with the needed payload \|

### \_upgradeToAndCall

```javascript
function _upgradeToAndCall(string _newVersion, address _newImplementation, bytes _data) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_newVersion | string |  |
| \_newImplementation | address |  |
| \_data | bytes |  |

