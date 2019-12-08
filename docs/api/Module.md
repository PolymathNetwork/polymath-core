---
id: version-3.0.0-Module
title: Module
original_id: Module
---

# Interface that any module contract should implement (Module.sol)

View Source: [contracts/modules/Module.sol](../../contracts/modules/Module.sol)

**↗ Extends: [IModule](IModule.md), [ModuleStorage](ModuleStorage.md)**
**↘ Derived Contracts: [DividendCheckpoint](DividendCheckpoint.md), [GeneralPermissionManager](GeneralPermissionManager.md), [ITransferManager](ITransferManager.md), [IWallet](IWallet.md), [STO](STO.md), [TrackedRedemption](TrackedRedemption.md)**

**Module**

Contract is abstract

## Constructor

Constructor

```js
constructor(address _securityToken, address _polyAddress) public
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _securityToken | address | Address of the security token | 
| _polyAddress | address | Address of the polytoken | 

## Modifiers

- [withPerm](#withperm)
- [onlyOwner](#onlyowner)
- [onlyFactory](#onlyfactory)
- [onlyFactoryOwner](#onlyfactoryowner)
- [onlyFactoryOrOwner](#onlyfactoryorowner)

### withPerm

```js
modifier withPerm(bytes32 _perm) internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _perm | bytes32 |  | 

### onlyOwner

```js
modifier onlyOwner() internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### onlyFactory

```js
modifier onlyFactory() internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### onlyFactoryOwner

```js
modifier onlyFactoryOwner() internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### onlyFactoryOrOwner

```js
modifier onlyFactoryOrOwner() internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

## Functions

- [takeFee(uint256 _amount)](#takefee)

### takeFee

⤾ overrides [IModule.takeFee](IModule.md#takefee)

used to withdraw the fee by the factory owner

```js
function takeFee(uint256 _amount) public nonpayable withPerm 
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _amount | uint256 |  | 

