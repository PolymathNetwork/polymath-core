---
id: version-3.0.0-BlacklistTransferManager
title: BlacklistTransferManager
original_id: BlacklistTransferManager
---

# Transfer Manager module to automate blacklist and restrict transfers (BlacklistTransferManager.sol)

View Source: [contracts/modules/TransferManager/BTM/BlacklistTransferManager.sol](../../contracts/modules/TransferManager/BTM/BlacklistTransferManager.sol)

**↗ Extends: [BlacklistTransferManagerStorage](BlacklistTransferManagerStorage.md), [TransferManager](TransferManager.md)**

**BlacklistTransferManager**

**Events**

```js
event AddBlacklistType(uint256  _startTime, uint256  _endTime, bytes32  _blacklistName, uint256  _repeatPeriodTime);
event ModifyBlacklistType(uint256  _startTime, uint256  _endTime, bytes32  _blacklistName, uint256  _repeatPeriodTime);
event DeleteBlacklistType(bytes32  _blacklistName);
event AddInvestorToBlacklist(address indexed _investor, bytes32  _blacklistName);
event DeleteInvestorFromBlacklist(address indexed _investor, bytes32  _blacklistName);
```

## Functions

- [(address _securityToken, address _polyAddress)](#)
- [getInitFunction()](#getinitfunction)
- [executeTransfer(address _from, address , uint256 , bytes )](#executetransfer)
- [verifyTransfer(address _from, address , uint256 , bytes )](#verifytransfer)
- [_verifyTransfer(address _from)](#_verifytransfer)
- [addBlacklistType(uint256 _startTime, uint256 _endTime, bytes32 _blacklistName, uint256 _repeatPeriodTime)](#addblacklisttype)
- [_addBlacklistType(uint256 _startTime, uint256 _endTime, bytes32 _blacklistName, uint256 _repeatPeriodTime)](#_addblacklisttype)
- [_addBlacklistTypeDetails(uint256 _startTime, uint256 _endTime, bytes32 _blacklistName, uint256 _repeatPeriodTime)](#_addblacklisttypedetails)
- [addBlacklistTypeMulti(uint256[] _startTimes, uint256[] _endTimes, bytes32[] _blacklistNames, uint256[] _repeatPeriodTimes)](#addblacklisttypemulti)
- [modifyBlacklistType(uint256 _startTime, uint256 _endTime, bytes32 _blacklistName, uint256 _repeatPeriodTime)](#modifyblacklisttype)
- [_modifyBlacklistType(uint256 _startTime, uint256 _endTime, bytes32 _blacklistName, uint256 _repeatPeriodTime)](#_modifyblacklisttype)
- [modifyBlacklistTypeMulti(uint256[] _startTimes, uint256[] _endTimes, bytes32[] _blacklistNames, uint256[] _repeatPeriodTimes)](#modifyblacklisttypemulti)
- [deleteBlacklistType(bytes32 _blacklistName)](#deleteblacklisttype)
- [_deleteBlacklistType(bytes32 _blacklistName)](#_deleteblacklisttype)
- [deleteBlacklistTypeMulti(bytes32[] _blacklistNames)](#deleteblacklisttypemulti)
- [addInvestorToBlacklist(address _investor, bytes32 _blacklistName)](#addinvestortoblacklist)
- [_addInvestorToBlacklist(address _investor, bytes32 _blacklistName)](#_addinvestortoblacklist)
- [addInvestorToBlacklistMulti(address[] _investors, bytes32 _blacklistName)](#addinvestortoblacklistmulti)
- [addMultiInvestorToBlacklistMulti(address[] _investors, bytes32[] _blacklistNames)](#addmultiinvestortoblacklistmulti)
- [addInvestorToNewBlacklist(uint256 _startTime, uint256 _endTime, bytes32 _blacklistName, uint256 _repeatPeriodTime, address _investor)](#addinvestortonewblacklist)
- [deleteInvestorFromBlacklist(address _investor, bytes32 _blacklistName)](#deleteinvestorfromblacklist)
- [_deleteInvestorFromBlacklist(address _investor, bytes32 _blacklistName)](#_deleteinvestorfromblacklist)
- [deleteInvestorFromAllBlacklist(address _investor)](#deleteinvestorfromallblacklist)
- [_deleteInvestorFromAllBlacklist(address _investor)](#_deleteinvestorfromallblacklist)
- [deleteInvestorFromAllBlacklistMulti(address[] _investor)](#deleteinvestorfromallblacklistmulti)
- [deleteMultiInvestorsFromBlacklistMulti(address[] _investors, bytes32[] _blacklistNames)](#deletemultiinvestorsfromblacklistmulti)
- [_validParams(uint256 _startTime, uint256 _endTime, bytes32 _blacklistName, uint256 _repeatPeriodTime)](#_validparams)
- [getListOfAddresses(bytes32 _blacklistName)](#getlistofaddresses)
- [getBlacklistNamesToUser(address _user)](#getblacklistnamestouser)
- [getAllBlacklists()](#getallblacklists)
- [getTokensByPartition(bytes32 _partition, address _tokenHolder, uint256 _additionalBalance)](#gettokensbypartition)
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

Used to verify the transfer transaction

```js
function executeTransfer(address _from, address , uint256 , bytes ) external nonpayable
returns(enum ITransferManager.Result)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address | Address of the sender | 
|  | address | _from Address of the sender | 
|  | uint256 | _from Address of the sender | 
|  | bytes | _from Address of the sender | 

### verifyTransfer

⤾ overrides [ITransferManager.verifyTransfer](ITransferManager.md#verifytransfer)

Used to verify the transfer transaction (View)

```js
function verifyTransfer(address _from, address , uint256 , bytes ) public view
returns(enum ITransferManager.Result, bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address | Address of the sender | 
|  | address | _from Address of the sender | 
|  | uint256 | _from Address of the sender | 
|  | bytes | _from Address of the sender | 

### _verifyTransfer

```js
function _verifyTransfer(address _from) internal view
returns(enum ITransferManager.Result, bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address |  | 

### addBlacklistType

Used to add the blacklist type

```js
function addBlacklistType(uint256 _startTime, uint256 _endTime, bytes32 _blacklistName, uint256 _repeatPeriodTime) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _startTime | uint256 | Start date of the blacklist type | 
| _endTime | uint256 | End date of the blacklist type | 
| _blacklistName | bytes32 | Name of the blacklist type | 
| _repeatPeriodTime | uint256 | Repeat period of the blacklist type in days | 

### _addBlacklistType

```js
function _addBlacklistType(uint256 _startTime, uint256 _endTime, bytes32 _blacklistName, uint256 _repeatPeriodTime) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _startTime | uint256 |  | 
| _endTime | uint256 |  | 
| _blacklistName | bytes32 |  | 
| _repeatPeriodTime | uint256 |  | 

### _addBlacklistTypeDetails

```js
function _addBlacklistTypeDetails(uint256 _startTime, uint256 _endTime, bytes32 _blacklistName, uint256 _repeatPeriodTime) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _startTime | uint256 |  | 
| _endTime | uint256 |  | 
| _blacklistName | bytes32 |  | 
| _repeatPeriodTime | uint256 |  | 

### addBlacklistTypeMulti

Used to add the multiple blacklist type

```js
function addBlacklistTypeMulti(uint256[] _startTimes, uint256[] _endTimes, bytes32[] _blacklistNames, uint256[] _repeatPeriodTimes) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _startTimes | uint256[] | Start date of the blacklist type | 
| _endTimes | uint256[] | End date of the blacklist type | 
| _blacklistNames | bytes32[] | Name of the blacklist type | 
| _repeatPeriodTimes | uint256[] | Repeat period of the blacklist type | 

### modifyBlacklistType

Used to modify the details of a given blacklist type

```js
function modifyBlacklistType(uint256 _startTime, uint256 _endTime, bytes32 _blacklistName, uint256 _repeatPeriodTime) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _startTime | uint256 | Start date of the blacklist type | 
| _endTime | uint256 | End date of the blacklist type | 
| _blacklistName | bytes32 | Name of the blacklist type | 
| _repeatPeriodTime | uint256 | Repeat period of the blacklist type | 

### _modifyBlacklistType

```js
function _modifyBlacklistType(uint256 _startTime, uint256 _endTime, bytes32 _blacklistName, uint256 _repeatPeriodTime) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _startTime | uint256 |  | 
| _endTime | uint256 |  | 
| _blacklistName | bytes32 |  | 
| _repeatPeriodTime | uint256 |  | 

### modifyBlacklistTypeMulti

Used to modify the details of a given multpile blacklist types

```js
function modifyBlacklistTypeMulti(uint256[] _startTimes, uint256[] _endTimes, bytes32[] _blacklistNames, uint256[] _repeatPeriodTimes) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _startTimes | uint256[] | Start date of the blacklist type | 
| _endTimes | uint256[] | End date of the blacklist type | 
| _blacklistNames | bytes32[] | Name of the blacklist type | 
| _repeatPeriodTimes | uint256[] | Repeat period of the blacklist type | 

### deleteBlacklistType

Used to delete the blacklist type

```js
function deleteBlacklistType(bytes32 _blacklistName) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _blacklistName | bytes32 | Name of the blacklist type | 

### _deleteBlacklistType

```js
function _deleteBlacklistType(bytes32 _blacklistName) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _blacklistName | bytes32 |  | 

### deleteBlacklistTypeMulti

Used to delete the multiple blacklist type

```js
function deleteBlacklistTypeMulti(bytes32[] _blacklistNames) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _blacklistNames | bytes32[] | Name of the blacklist type | 

### addInvestorToBlacklist

Used to assign the blacklist type to the investor

```js
function addInvestorToBlacklist(address _investor, bytes32 _blacklistName) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investor | address | Address of the investor | 
| _blacklistName | bytes32 | Name of the blacklist | 

### _addInvestorToBlacklist

```js
function _addInvestorToBlacklist(address _investor, bytes32 _blacklistName) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investor | address |  | 
| _blacklistName | bytes32 |  | 

### addInvestorToBlacklistMulti

Used to assign the blacklist type to the multiple investor

```js
function addInvestorToBlacklistMulti(address[] _investors, bytes32 _blacklistName) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investors | address[] | Address of the investor | 
| _blacklistName | bytes32 | Name of the blacklist | 

### addMultiInvestorToBlacklistMulti

Used to assign the multiple blacklist type to the multiple investor

```js
function addMultiInvestorToBlacklistMulti(address[] _investors, bytes32[] _blacklistNames) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investors | address[] | Address of the investor | 
| _blacklistNames | bytes32[] | Name of the blacklist | 

### addInvestorToNewBlacklist

Used to assign the new blacklist type to the investor

```js
function addInvestorToNewBlacklist(uint256 _startTime, uint256 _endTime, bytes32 _blacklistName, uint256 _repeatPeriodTime, address _investor) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _startTime | uint256 | Start date of the blacklist type | 
| _endTime | uint256 | End date of the blacklist type | 
| _blacklistName | bytes32 | Name of the blacklist type | 
| _repeatPeriodTime | uint256 | Repeat period of the blacklist type | 
| _investor | address | Address of the investor | 

### deleteInvestorFromBlacklist

Used to delete the investor from the blacklist

```js
function deleteInvestorFromBlacklist(address _investor, bytes32 _blacklistName) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investor | address | Address of the investor | 
| _blacklistName | bytes32 | Name of the blacklist | 

### _deleteInvestorFromBlacklist

Used to delete the investor from the blacklist

```js
function _deleteInvestorFromBlacklist(address _investor, bytes32 _blacklistName) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investor | address | Address of the investor | 
| _blacklistName | bytes32 | Name of the blacklist | 

### deleteInvestorFromAllBlacklist

Used to delete the investor from all the associated blacklist types

```js
function deleteInvestorFromAllBlacklist(address _investor) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investor | address | Address of the investor | 

### _deleteInvestorFromAllBlacklist

Used to delete the investor from all the associated blacklist types

```js
function _deleteInvestorFromAllBlacklist(address _investor) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investor | address | Address of the investor | 

### deleteInvestorFromAllBlacklistMulti

Used to delete the multiple investor from all the associated blacklist types

```js
function deleteInvestorFromAllBlacklistMulti(address[] _investor) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investor | address[] | Address of the investor | 

### deleteMultiInvestorsFromBlacklistMulti

Used to delete the multiple investor from the blacklist

```js
function deleteMultiInvestorsFromBlacklistMulti(address[] _investors, bytes32[] _blacklistNames) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investors | address[] | address of the investor | 
| _blacklistNames | bytes32[] | name of the blacklist | 

### _validParams

Internal function

```js
function _validParams(uint256 _startTime, uint256 _endTime, bytes32 _blacklistName, uint256 _repeatPeriodTime) internal view
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _startTime | uint256 |  | 
| _endTime | uint256 |  | 
| _blacklistName | bytes32 |  | 
| _repeatPeriodTime | uint256 |  | 

### getListOfAddresses

get the list of the investors of a blacklist type

```js
function getListOfAddresses(bytes32 _blacklistName) external view
returns(address[])
```

**Returns**

address List of investors associated with the blacklist

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _blacklistName | bytes32 | Name of the blacklist type | 

### getBlacklistNamesToUser

get the list of the investors of a blacklist type

```js
function getBlacklistNamesToUser(address _user) external view
returns(bytes32[])
```

**Returns**

bytes32 List of blacklist names associated with the given address

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _user | address | Address of the user | 

### getAllBlacklists

get the list of blacklist names

```js
function getAllBlacklists() external view
returns(bytes32[])
```

**Returns**

bytes32 Array of blacklist names

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getTokensByPartition

⤾ overrides [TransferManager.getTokensByPartition](TransferManager.md#gettokensbypartition)

return the amount of tokens for a given user as per the partition

```js
function getTokensByPartition(bytes32 _partition, address _tokenHolder, uint256 _additionalBalance) external view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _partition | bytes32 | Identifier | 
| _tokenHolder | address | Whom token amount need to query | 
| _additionalBalance | uint256 | It is the `_value` that transfer during transfer/transferFrom function call | 

### getPermissions

⤾ overrides [IModule.getPermissions](IModule.md#getpermissions)

Return the permissions flag that are associated with blacklist transfer manager

```js
function getPermissions() public view
returns(bytes32[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

