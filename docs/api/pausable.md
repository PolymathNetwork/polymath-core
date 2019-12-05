---
id: version-3.0.0-Pausable
title: Pausable
original_id: Pausable
---

# Utility contract to allow pausing and unpausing of certain functions \(Pausable.sol\)

View Source: [contracts/Pausable.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/Pausable.sol)

**↘ Derived Contracts:** [**BlacklistTransferManagerProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/BlacklistTransferManagerProxy.md)**,** [**CappedSTOProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/CappedSTOProxy.md)**,** [**CountTransferManagerProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/CountTransferManagerProxy.md)**,** [**DummySTOProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/DummySTOProxy.md)**,** [**ERC20DividendCheckpointProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ERC20DividendCheckpointProxy.md)**,** [**EtherDividendCheckpointProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/EtherDividendCheckpointProxy.md)**,** [**GeneralPermissionManagerProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/GeneralPermissionManagerProxy.md)**,** [**GeneralTransferManagerProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/GeneralTransferManagerProxy.md)**,** [**LockUpTransferManagerProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/LockUpTransferManagerProxy.md)**,** [**ManualApprovalTransferManagerProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ManualApprovalTransferManagerProxy.md)**,** [**Module**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/Module.md)**,** [**PercentageTransferManagerProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/PercentageTransferManagerProxy.md)**,** [**PLCRVotingCheckpointProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/PLCRVotingCheckpointProxy.md)**,** [**PreSaleSTOProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/PreSaleSTOProxy.md)**,** [**USDTieredSTOProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/USDTieredSTOProxy.md)**,** [**VestingEscrowWalletProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/VestingEscrowWalletProxy.md)**,** [**VolumeRestrictionTMProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/VolumeRestrictionTMProxy.md)**,** [**WeightedVoteCheckpointProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/WeightedVoteCheckpointProxy.md)

**Pausable**

## Contract Members

**Constants & Variables**

```javascript
bool public paused;
```

**Events**

```javascript
event Pause(address  account);
event Unpause(address  account);
```

## Modifiers

* [whenNotPaused](pausable.md#whennotpaused)
* [whenPaused](pausable.md#whenpaused)

### whenNotPaused

Modifier to make a function callable only when the contract is not paused.

```javascript
modifier whenNotPaused() internal
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### whenPaused

Modifier to make a function callable only when the contract is paused.

```javascript
modifier whenPaused() internal
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


## Functions

* [\_pause\(\)](pausable.md#_pause)
* [\_unpause\(\)](pausable.md#_unpause)

### \_pause

Called by the owner to pause, triggers stopped state

```javascript
function _pause() internal nonpayable whenNotPaused
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### \_unpause

Called by the owner to unpause, returns to normal state

```javascript
function _unpause() internal nonpayable whenPaused
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


