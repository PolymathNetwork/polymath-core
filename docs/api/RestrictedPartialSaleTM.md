---
id: version-3.0.0-RestrictedPartialSaleTM
title: RestrictedPartialSaleTM
original_id: RestrictedPartialSaleTM
---

# This TransferManager is used to validate the transaction where partial balance of an 
investor is not allowed to trnasfer beside investor is present in the exemption list (RestrictedPartialSaleTM.sol)

View Source: [contracts/modules/Experimental/TransferManager/RestrictedPartialSaleTM.sol](../../contracts/modules/Experimental/TransferManager/RestrictedPartialSaleTM.sol)

**↗ Extends: [ITransferManager](ITransferManager.md)**

**RestrictedPartialSaleTM**

## Constructor

Constructor

```js
constructor(address _securityToken, address _polyAddress) public
```

**Arguments**

## Contract Members
**Constants & Variables**

```js
//internal members
bytes32 internal constant OPERATOR;

//public members
address[] public exemptAddresses;
mapping(address => uint256) public exemptIndex;

```

**Events**

```js
event ChangedExemptWalletList(address indexed _wallet, bool  _exempted);
```

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _securityToken | address | Address of the security token | 
| _polyAddress | address | Address of the polytoken | 

## Functions

- [getInitFunction()](#getinitfunction)
- [configure(address _treasuryWallet)](#configure)
- [verifyTransfer(address _from, address , uint256 _amount, bytes , bool )](#verifytransfer)
- [changeExemptWalletList(address _wallet, bool _exempted)](#changeexemptwalletlist)
- [changeExemptWalletListMulti(address[] _wallet, bool[] _exempted)](#changeexemptwalletlistmulti)
- [_changeExemptionWalletList(address _wallet, bool _exempted)](#_changeexemptionwalletlist)
- [getExemptAddresses()](#getexemptaddresses)
- [getPermissions()](#getpermissions)

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

### verifyTransfer

⤾ overrides [ITransferManager.verifyTransfer](ITransferManager.md#verifytransfer)

Used to verify the transfer transaction and prevent a transfer if it passes the allowed amount of token holders

```js
function verifyTransfer(address _from, address , uint256 _amount, bytes , bool ) public nonpayable
returns(enum ITransferManager.Result)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address | Address of the sender | 
|  | address | _from Address of the sender | 
| _amount | uint256 | Amount to send | 
|  | bytes | _from Address of the sender | 
|  | bool | _from Address of the sender | 

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

