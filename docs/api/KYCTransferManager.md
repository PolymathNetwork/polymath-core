---
id: version-3.0.0-KYCTransferManager
title: KYCTransferManager
original_id: KYCTransferManager
---

# Transfer Manager module for core transfer validation functionality (KYCTransferManager.sol)

View Source: [contracts/modules/Experimental/TransferManager/KYCTransferManager.sol](../../contracts/modules/Experimental/TransferManager/KYCTransferManager.sol)

**↗ Extends: [TransferManager](TransferManager.md)**

**KYCTransferManager**

## Contract Members
**Constants & Variables**

```js
bytes32 public constant KYC_NUMBER;
bytes32 public constant KYC_ARRAY;

```

## Functions

- [(address _securityToken, address _polyAddress)](#)
- [getInitFunction()](#getinitfunction)
- [executeTransfer(address _from, address _to, uint256 _amount, bytes _data)](#executetransfer)
- [verifyTransfer(address , address _to, uint256 , bytes )](#verifytransfer)
- [modifyKYC(address _investor, bool _kycStatus)](#modifykyc)
- [_modifyKYC(address _investor, bool _kycStatus)](#_modifykyc)
- [getKYCAddresses()](#getkycaddresses)
- [checkKYC(address _investor)](#checkkyc)
- [_getKYCKey(address _identity)](#_getkyckey)
- [getPermissions()](#getpermissions)

### 

Constructor

```js
function (address _securityToken, address _polyAddress) public nonpayable Module 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _securityToken | address | Address of the security token | 
| _polyAddress | address | Address of the polytoken | 

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

### executeTransfer

⤾ overrides [ITransferManager.executeTransfer](ITransferManager.md#executetransfer)

```js
function executeTransfer(address _from, address _to, uint256 _amount, bytes _data) external nonpayable
returns(enum ITransferManager.Result)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address |  | 
| _to | address |  | 
| _amount | uint256 |  | 
| _data | bytes |  | 

### verifyTransfer

⤾ overrides [ITransferManager.verifyTransfer](ITransferManager.md#verifytransfer)

```js
function verifyTransfer(address , address _to, uint256 , bytes ) public view
returns(enum ITransferManager.Result, bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
|  | address |  | 
| _to | address |  | 
|  | uint256 |  | 
|  | bytes |  | 

### modifyKYC

```js
function modifyKYC(address _investor, bool _kycStatus) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investor | address |  | 
| _kycStatus | bool |  | 

### _modifyKYC

```js
function _modifyKYC(address _investor, bool _kycStatus) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investor | address |  | 
| _kycStatus | bool |  | 

### getKYCAddresses

```js
function getKYCAddresses() public view
returns(address[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### checkKYC

```js
function checkKYC(address _investor) public view
returns(kyc bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investor | address |  | 

### _getKYCKey

```js
function _getKYCKey(address _identity) internal pure
returns(bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _identity | address |  | 

### getPermissions

⤾ overrides [IModule.getPermissions](IModule.md#getpermissions)

Return the permissions flag that are associated with this module

```js
function getPermissions() public view
returns(bytes32[])
```

**Returns**

bytes32 array

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

