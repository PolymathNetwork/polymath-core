---
id: version-3.0.0-SignedTransferManager
title: SignedTransferManager
original_id: SignedTransferManager
---

# Transfer Manager module for verifing transations with a signed message (SignedTransferManager.sol)

View Source: [contracts/modules/Experimental/TransferManager/SignedTransferManager.sol](../../contracts/modules/Experimental/TransferManager/SignedTransferManager.sol)

**↗ Extends: [TransferManager](TransferManager.md)**

**SignedTransferManager**

## Contract Members
**Constants & Variables**

```js
bytes32 public constant INVALID_SIG;

```

**Events**

```js
event SignatureUsed(bytes  _data);
```

## Functions

- [(address _securityToken, address _polyAddress)](#)
- [getInitFunction()](#getinitfunction)
- [checkSignatureValidity(bytes _data)](#checksignaturevalidity)
- [checkSigner(address _signer)](#checksigner)
- [executeTransfer(address _from, address _to, uint256 _amount, bytes _data)](#executetransfer)
- [verifyTransfer(address _from, address _to, uint256 _amount, bytes _data)](#verifytransfer)
- [invalidateSignature(address _from, address _to, uint256 _amount, bytes _data)](#invalidatesignature)
- [getPermissions()](#getpermissions)
- [_checkSignatureIsInvalid(bytes _data)](#_checksignatureisinvalid)
- [_checkSigner(address _signer)](#_checksigner)
- [_invalidateSignature(bytes _data)](#_invalidatesignature)

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
function getInitFunction() external pure
returns(bytes4)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### checkSignatureValidity

function to check if a signature is still valid

```js
function checkSignatureValidity(bytes _data) external view
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _data | bytes | signature | 

### checkSigner

```js
function checkSigner(address _signer) external view
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _signer | address |  | 

### executeTransfer

⤾ overrides [ITransferManager.executeTransfer](ITransferManager.md#executetransfer)

allow verify transfer with signature

```js
function executeTransfer(address _from, address _to, uint256 _amount, bytes _data) external nonpayable onlySecurityToken 
returns(enum ITransferManager.Result)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address | address transfer from | 
| _to | address | address transfer to | 
| _amount | uint256 | transfer amount | 
| _data | bytes | signature
Sig needs to be valid (not used or deemed as invalid)
Signer needs to be in the signers mapping | 

### verifyTransfer

⤾ overrides [ITransferManager.verifyTransfer](ITransferManager.md#verifytransfer)

allow verify transfer with signature

```js
function verifyTransfer(address _from, address _to, uint256 _amount, bytes _data) public view
returns(enum ITransferManager.Result, bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address | address transfer from | 
| _to | address | address transfer to | 
| _amount | uint256 | transfer amount | 
| _data | bytes | signature
Sig needs to be valid (not used or deemed as invalid)
Signer needs to be in the signers mapping | 

### invalidateSignature

allow signers to deem a signature invalid

```js
function invalidateSignature(address _from, address _to, uint256 _amount, bytes _data) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address | address transfer from | 
| _to | address | address transfer to | 
| _amount | uint256 | transfer amount | 
| _data | bytes | signature
Sig needs to be valid (not used or deemed as invalid)
Signer needs to be in the signers mapping | 

### getPermissions

⤾ overrides [IModule.getPermissions](IModule.md#getpermissions)

Return the permissions flag that are associated with ManualApproval transfer manager

```js
function getPermissions() public view
returns(bytes32[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### _checkSignatureIsInvalid

```js
function _checkSignatureIsInvalid(bytes _data) internal view
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _data | bytes |  | 

### _checkSigner

```js
function _checkSigner(address _signer) internal view
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _signer | address |  | 

### _invalidateSignature

```js
function _invalidateSignature(bytes _data) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _data | bytes |  | 

