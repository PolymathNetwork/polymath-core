---
id: version-3.0.0-CountTransferManager
title: CountTransferManager
original_id: CountTransferManager
---

# Transfer Manager for limiting maximum number of token holders (CountTransferManager.sol)

View Source: [contracts/modules/TransferManager/CountTransferManager.sol](../../contracts/modules/TransferManager/CountTransferManager.sol)

**↗ Extends: [ITransferManager](ITransferManager.md)**

**CountTransferManager**

## Constructor

Constructor

```js
constructor(address _securityToken, address _polyAddress) public
```

**Arguments**

## Contract Members
**Constants & Variables**

```js
uint256 public maxHolderCount;
bytes32 public constant ADMIN;

```

**Events**

```js
event ModifyHolderCount(uint256  _oldHolderCount, uint256  _newHolderCount);
```

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _securityToken | address | Address of the security token | 
| _polyAddress | address | Address of the polytoken | 

## Functions

- [verifyTransfer(address _from, address _to, uint256 _amount, bytes , bool )](#verifytransfer)
- [configure(uint256 _maxHolderCount)](#configure)
- [changeHolderCount(uint256 _maxHolderCount)](#changeholdercount)
- [getInitFunction()](#getinitfunction)
- [getPermissions()](#getpermissions)

### verifyTransfer

⤾ overrides [ITransferManager.verifyTransfer](ITransferManager.md#verifytransfer)

Used to verify the transfer transaction and prevent a transfer if it passes the allowed amount of token holders

```js
function verifyTransfer(address _from, address _to, uint256 _amount, bytes , bool ) public nonpayable
returns(enum ITransferManager.Result)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address | Address of the sender | 
| _to | address | Address of the receiver | 
| _amount | uint256 | Amount to send | 
|  | bytes | _from Address of the sender | 
|  | bool | _from Address of the sender | 

### configure

Used to initialize the variables of the contract

```js
function configure(uint256 _maxHolderCount) public nonpayable onlyFactory 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _maxHolderCount | uint256 | Maximum no. of holders this module allows the SecurityToken to have | 

### changeHolderCount

Sets the cap for the amount of token holders there can be

```js
function changeHolderCount(uint256 _maxHolderCount) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _maxHolderCount | uint256 | is the new maximum amount of token holders | 

### getInitFunction

⤾ overrides [IModule.getInitFunction](IModule.md#getinitfunction)

This function returns the signature of configure function

```js
function getInitFunction() public pure
returns(bytes4)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getPermissions

⤾ overrides [IModule.getPermissions](IModule.md#getpermissions)

Returns the permissions flag that are associated with CountTransferManager

```js
function getPermissions() public view
returns(bytes32[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

