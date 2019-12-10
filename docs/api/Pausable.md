---
id: version-3.0.0-Pausable
title: Pausable
original_id: Pausable
---

# Utility contract to allow pausing and unpausing of certain functions (Pausable.sol)

View Source: [contracts/Pausable.sol](../../contracts/Pausable.sol)

**↘ Derived Contracts: [DividendCheckpoint](DividendCheckpoint.md), [ERC20DividendCheckpointProxy](ERC20DividendCheckpointProxy.md), [EtherDividendCheckpointProxy](EtherDividendCheckpointProxy.md), [GeneralTransferManagerProxy](GeneralTransferManagerProxy.md), [ITransferManager](ITransferManager.md), [IWallet](IWallet.md), [STO](STO.md), [USDTieredSTOProxy](USDTieredSTOProxy.md), [VestingEscrowWalletProxy](VestingEscrowWalletProxy.md), [VolumeRestrictionTMProxy](VolumeRestrictionTMProxy.md)**

**Pausable**

## Contract Members
**Constants & Variables**

```js
bool public paused;

```

**Events**

```js
event Pause(uint256  _timestammp);
event Unpause(uint256  _timestamp);
```

## Modifiers

- [whenNotPaused](#whennotpaused)
- [whenPaused](#whenpaused)

### whenNotPaused

Modifier to make a function callable only when the contract is not paused.

```js
modifier whenNotPaused() internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### whenPaused

Modifier to make a function callable only when the contract is paused.

```js
modifier whenPaused() internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

## Functions

- [_pause()](#_pause)
- [_unpause()](#_unpause)

### _pause

Called by the owner to pause, triggers stopped state

```js
function _pause() internal nonpayable whenNotPaused 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### _unpause

Called by the owner to unpause, returns to normal state

```js
function _unpause() internal nonpayable whenPaused 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

