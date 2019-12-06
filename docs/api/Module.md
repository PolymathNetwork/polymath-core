---
id: version-3.0.0-Module
title: Module
original_id: Module
---

# Interface that any module contract should implement (Module.sol)

View Source: [contracts/modules/Module.sol](../../contracts/modules/Module.sol)

**↗ Extends: [IModule](IModule.md), [ModuleStorage](ModuleStorage.md), [Pausable](Pausable.md)**
**↘ Derived Contracts: [DividendCheckpoint](DividendCheckpoint.md), [GeneralPermissionManager](GeneralPermissionManager.md), [STO](STO.md), [TrackedRedemption](TrackedRedemption.md), [TransferManager](TransferManager.md), [VotingCheckpoint](VotingCheckpoint.md), [Wallet](Wallet.md)**

**Module**

Contract is abstract

## Modifiers

- [withPerm](#withperm)
- [onlyFactory](#onlyfactory)

### withPerm

```js
modifier withPerm(bytes32 _perm) internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _perm | bytes32 |  | 

### onlyFactory

```js
modifier onlyFactory() internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

## Functions

- [(address _securityToken, address _polyAddress)](#)
- [_checkPerm(bytes32 _perm, address _caller)](#_checkperm)
- [_onlySecurityTokenOwner()](#_onlysecuritytokenowner)
- [pause()](#pause)
- [unpause()](#unpause)
- [getDataStore()](#getdatastore)
- [reclaimERC20(address _tokenContract)](#reclaimerc20)
- [reclaimETH()](#reclaimeth)

### 

Constructor

```js
function (address _securityToken, address _polyAddress) public nonpayable ModuleStorage 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _securityToken | address | Address of the security token | 
| _polyAddress | address |  | 

### _checkPerm

```js
function _checkPerm(bytes32 _perm, address _caller) internal view
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _perm | bytes32 |  | 
| _caller | address |  | 

### _onlySecurityTokenOwner

```js
function _onlySecurityTokenOwner() internal view
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### pause

⤾ overrides [ISTO.pause](ISTO.md#pause)

⤿ Overridden Implementation(s): [STO.pause](STO.md#pause)

Pause (overridden function)

```js
function pause() public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### unpause

Unpause (overridden function)

```js
function unpause() public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getDataStore

used to return the data store address of securityToken

```js
function getDataStore() public view
returns(contract IDataStore)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### reclaimERC20

⤿ Overridden Implementation(s): [STO.reclaimERC20](STO.md#reclaimerc20)

Reclaims ERC20Basic compatible tokens

```js
function reclaimERC20(address _tokenContract) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _tokenContract | address | The address of the token contract | 

### reclaimETH

Reclaims ETH

```js
function reclaimETH() external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

