---
id: version-3.0.0-PercentageTransferManager
title: PercentageTransferManager
original_id: PercentageTransferManager
---

# Transfer Manager module for limiting percentage of token supply a single address can hold (PercentageTransferManager.sol)

View Source: [contracts/modules/TransferManager/PTM/PercentageTransferManager.sol](../../contracts/modules/TransferManager/PTM/PercentageTransferManager.sol)

**↗ Extends: [PercentageTransferManagerStorage](PercentageTransferManagerStorage.md), [TransferManager](TransferManager.md)**

**PercentageTransferManager**

**Events**

```js
event ModifyHolderPercentage(uint256  _oldHolderPercentage, uint256  _newHolderPercentage);
event ModifyWhitelist(address  _investor, address  _addedBy, bool  _valid);
event SetAllowPrimaryIssuance(bool  _allowPrimaryIssuance);
```

## Functions

- [(address _securityToken, address _polyToken)](#)
- [executeTransfer(address _from, address _to, uint256 _amount, bytes )](#executetransfer)
- [verifyTransfer(address _from, address _to, uint256 _amount, bytes )](#verifytransfer)
- [_verifyTransfer(address _from, address _to, uint256 _amount)](#_verifytransfer)
- [configure(uint256 _maxHolderPercentage, bool _allowPrimaryIssuance)](#configure)
- [getInitFunction()](#getinitfunction)
- [changeHolderPercentage(uint256 _maxHolderPercentage)](#changeholderpercentage)
- [modifyWhitelist(address _investor, bool _valid)](#modifywhitelist)
- [modifyWhitelistMulti(address[] _investors, bool[] _valids)](#modifywhitelistmulti)
- [setAllowPrimaryIssuance(bool _allowPrimaryIssuance)](#setallowprimaryissuance)
- [getPermissions()](#getpermissions)

### 

Constructor

```js
function (address _securityToken, address _polyToken) public nonpayable Module 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _securityToken | address | Address of the security token | 
| _polyToken | address |  | 

### executeTransfer

⤾ overrides [ITransferManager.executeTransfer](ITransferManager.md#executetransfer)

Used to verify the transfer transaction and prevent a given account to end up with more tokens than allowed

```js
function executeTransfer(address _from, address _to, uint256 _amount, bytes ) external nonpayable
returns(enum ITransferManager.Result)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address | Address of the sender | 
| _to | address | Address of the receiver | 
| _amount | uint256 | The amount of tokens to transfer | 
|  | bytes | _from Address of the sender | 

### verifyTransfer

⤾ overrides [ITransferManager.verifyTransfer](ITransferManager.md#verifytransfer)

Used to verify the transfer transaction and prevent a given account to end up with more tokens than allowed

```js
function verifyTransfer(address _from, address _to, uint256 _amount, bytes ) public view
returns(enum ITransferManager.Result, bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address | Address of the sender | 
| _to | address | Address of the receiver | 
| _amount | uint256 | The amount of tokens to transfer | 
|  | bytes | _from Address of the sender | 

### _verifyTransfer

```js
function _verifyTransfer(address _from, address _to, uint256 _amount) internal view
returns(enum ITransferManager.Result, bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address |  | 
| _to | address |  | 
| _amount | uint256 |  | 

### configure

Used to intialize the variables of the contract

```js
function configure(uint256 _maxHolderPercentage, bool _allowPrimaryIssuance) public nonpayable onlyFactory 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _maxHolderPercentage | uint256 | Maximum amount of ST20 tokens(in %) can hold by the investor | 
| _allowPrimaryIssuance | bool |  | 

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

### changeHolderPercentage

sets the maximum percentage that an individual token holder can hold

```js
function changeHolderPercentage(uint256 _maxHolderPercentage) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _maxHolderPercentage | uint256 | is the new maximum percentage (multiplied by 10**16) | 

### modifyWhitelist

adds or removes addresses from the whitelist.

```js
function modifyWhitelist(address _investor, bool _valid) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investor | address | is the address to whitelist | 
| _valid | bool | whether or not the address it to be added or removed from the whitelist | 

### modifyWhitelistMulti

adds or removes addresses from the whitelist.

```js
function modifyWhitelistMulti(address[] _investors, bool[] _valids) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investors | address[] | Array of the addresses to whitelist | 
| _valids | bool[] | Array of boolean value to decide whether or not the address it to be added or removed from the whitelist | 

### setAllowPrimaryIssuance

sets whether or not to consider primary issuance transfers

```js
function setAllowPrimaryIssuance(bool _allowPrimaryIssuance) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _allowPrimaryIssuance | bool | whether to allow all primary issuance transfers | 

### getPermissions

⤾ overrides [IModule.getPermissions](IModule.md#getpermissions)

Return the permissions flag that are associated with Percentage transfer Manager

```js
function getPermissions() public view
returns(bytes32[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

