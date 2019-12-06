---
id: version-3.0.0-RestrictedPartialSaleTM
title: RestrictedPartialSaleTM
original_id: RestrictedPartialSaleTM
---

# This TransferManager is used to validate the transaction where partial balance of an 
investor is not allowed to trnasfer beside investor is present in the exemption list (RestrictedPartialSaleTM.sol)

View Source: [contracts/modules/TransferManager/RPTM/RestrictedPartialSaleTM.sol](../../contracts/modules/TransferManager/RPTM/RestrictedPartialSaleTM.sol)

**↗ Extends: [RestrictedPartialSaleTMStorage](RestrictedPartialSaleTMStorage.md), [TransferManager](TransferManager.md)**

**RestrictedPartialSaleTM**

**Events**

```js
event ChangedExemptWalletList(address indexed _wallet, bool  _exempted);
```

## Functions

- [(address _securityToken, address _polyAddress)](#)
- [getInitFunction()](#getinitfunction)
- [configure(address _treasuryWallet)](#configure)
- [executeTransfer(address _from, address , uint256 _amount, bytes )](#executetransfer)
- [verifyTransfer(address _from, address , uint256 _amount, bytes )](#verifytransfer)
- [_verifyTransfer(address _from, uint256 _amount)](#_verifytransfer)
- [changeExemptWalletList(address _wallet, bool _exempted)](#changeexemptwalletlist)
- [changeExemptWalletListMulti(address[] _wallet, bool[] _exempted)](#changeexemptwalletlistmulti)
- [_changeExemptionWalletList(address _wallet, bool _exempted)](#_changeexemptionwalletlist)
- [getExemptAddresses()](#getexemptaddresses)
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

### configure

Used to initialize the variables of the contract

```js
function configure(address _treasuryWallet) external nonpayable onlyFactory 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _treasuryWallet | address | Ethereum address of the treasury wallet | 

### executeTransfer

⤾ overrides [ITransferManager.executeTransfer](ITransferManager.md#executetransfer)

Used to verify the transfer transaction and prevent a transfer if it passes the allowed amount of token holders

```js
function executeTransfer(address _from, address , uint256 _amount, bytes ) external nonpayable
returns(enum ITransferManager.Result)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address | Address of the sender | 
|  | address | _from Address of the sender | 
| _amount | uint256 | Amount to send | 
|  | bytes | _from Address of the sender | 

### verifyTransfer

⤾ overrides [ITransferManager.verifyTransfer](ITransferManager.md#verifytransfer)

Used to verify the transfer transaction and prevent a transfer if it passes the allowed amount of token holders

```js
function verifyTransfer(address _from, address , uint256 _amount, bytes ) external view
returns(enum ITransferManager.Result, bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address | Address of the sender | 
|  | address | _from Address of the sender | 
| _amount | uint256 | Amount to send | 
|  | bytes | _from Address of the sender | 

### _verifyTransfer

```js
function _verifyTransfer(address _from, uint256 _amount) internal view
returns(enum ITransferManager.Result, bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address |  | 
| _amount | uint256 |  | 

### changeExemptWalletList

Add/Remove wallet address from the exempt list

```js
function changeExemptWalletList(address _wallet, bool _exempted) external nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _wallet | address | Ethereum wallet/contract address that need to be exempted | 
| _exempted | bool | Boolean value used to add (i.e true) or remove (i.e false) from the list | 

### changeExemptWalletListMulti

Add/Remove multiple wallet addresses from the exempt list

```js
function changeExemptWalletListMulti(address[] _wallet, bool[] _exempted) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _wallet | address[] | Ethereum wallet/contract addresses that need to be exempted | 
| _exempted | bool[] | Boolean value used to add (i.e true) or remove (i.e false) from the list | 

### _changeExemptionWalletList

```js
function _changeExemptionWalletList(address _wallet, bool _exempted) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _wallet | address |  | 
| _exempted | bool |  | 

### getExemptAddresses

return the exempted addresses list

```js
function getExemptAddresses() external view
returns(address[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getPermissions

⤾ overrides [IModule.getPermissions](IModule.md#getpermissions)

Return the permissions flag that are associated with Restricted partial trnasfer manager

```js
function getPermissions() public view
returns(bytes32[])
```

**Returns**

bytes32 array

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

