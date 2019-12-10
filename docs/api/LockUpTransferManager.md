---
id: version-3.0.0-LockUpTransferManager
title: LockUpTransferManager
original_id: LockUpTransferManager
---

# LockUpTransferManager.sol

View Source: [contracts/modules/Experimental/TransferManager/LockUpTransferManager.sol](../../contracts/modules/Experimental/TransferManager/LockUpTransferManager.sol)

**↗ Extends: [ITransferManager](ITransferManager.md)**

**LockUpTransferManager**

## Constructor

Constructor

```js
constructor(address _securityToken, address _polyAddress) public
```

**Arguments**

## Structs
### LockUp

```js
struct LockUp {
 uint256 lockupAmount,
 uint256 startTime,
 uint256 lockUpPeriodSeconds,
 uint256 releaseFrequencySeconds
}
```

## Contract Members
**Constants & Variables**

```js
//public members
bytes32 public constant ADMIN;
mapping(bytes32 => struct LockUpTransferManager.LockUp) public lockups;

//internal members
mapping(address => bytes32[]) internal userToLockups;
mapping(bytes32 => address[]) internal lockupToUsers;
mapping(address => mapping(bytes32 => uint256)) internal userToLockupIndex;
mapping(bytes32 => mapping(address => uint256)) internal lockupToUserIndex;
bytes32[] internal lockupArray;

```

**Events**

```js
event AddLockUpToUser(address indexed _userAddress, bytes32 indexed _lockupName);
event RemoveLockUpFromUser(address indexed _userAddress, bytes32 indexed _lockupName);
event ModifyLockUpType(uint256  _lockupAmount, uint256  _startTime, uint256  _lockUpPeriodSeconds, uint256  _releaseFrequencySeconds, bytes32 indexed _lockupName);
event AddNewLockUpType(bytes32 indexed _lockupName, uint256  _lockupAmount, uint256  _startTime, uint256  _lockUpPeriodSeconds, uint256  _releaseFrequencySeconds);
event RemoveLockUpType(bytes32 indexed _lockupName);
```

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _securityToken | address | Address of the security token | 
| _polyAddress | address | Address of the polytoken | 

## Functions

- [verifyTransfer(address _from, address , uint256 _amount, bytes , bool )](#verifytransfer)
- [addNewLockUpType(uint256 _lockupAmount, uint256 _startTime, uint256 _lockUpPeriodSeconds, uint256 _releaseFrequencySeconds, bytes32 _lockupName)](#addnewlockuptype)
- [addNewLockUpTypeMulti(uint256[] _lockupAmounts, uint256[] _startTimes, uint256[] _lockUpPeriodsSeconds, uint256[] _releaseFrequenciesSeconds, bytes32[] _lockupNames)](#addnewlockuptypemulti)
- [addLockUpByName(address _userAddress, bytes32 _lockupName)](#addlockupbyname)
- [addLockUpByNameMulti(address[] _userAddresses, bytes32[] _lockupNames)](#addlockupbynamemulti)
- [addNewLockUpToUser(address _userAddress, uint256 _lockupAmount, uint256 _startTime, uint256 _lockUpPeriodSeconds, uint256 _releaseFrequencySeconds, bytes32 _lockupName)](#addnewlockuptouser)
- [addNewLockUpToUserMulti(address[] _userAddresses, uint256[] _lockupAmounts, uint256[] _startTimes, uint256[] _lockUpPeriodsSeconds, uint256[] _releaseFrequenciesSeconds, bytes32[] _lockupNames)](#addnewlockuptousermulti)
- [removeLockUpFromUser(address _userAddress, bytes32 _lockupName)](#removelockupfromuser)
- [removeLockupType(bytes32 _lockupName)](#removelockuptype)
- [removeLockupTypeMulti(bytes32[] _lockupNames)](#removelockuptypemulti)
- [removeLockUpFromUserMulti(address[] _userAddresses, bytes32[] _lockupNames)](#removelockupfromusermulti)
- [modifyLockUpType(uint256 _lockupAmount, uint256 _startTime, uint256 _lockUpPeriodSeconds, uint256 _releaseFrequencySeconds, bytes32 _lockupName)](#modifylockuptype)
- [modifyLockUpTypeMulti(uint256[] _lockupAmounts, uint256[] _startTimes, uint256[] _lockUpPeriodsSeconds, uint256[] _releaseFrequenciesSeconds, bytes32[] _lockupNames)](#modifylockuptypemulti)
- [getLockUp(bytes32 _lockupName)](#getlockup)
- [getListOfAddresses(bytes32 _lockupName)](#getlistofaddresses)
- [getAllLockups()](#getalllockups)
- [getAllLockupData()](#getalllockupdata)
- [getLockupsNamesToUser(address _user)](#getlockupsnamestouser)
- [getLockedTokenToUser(address _userAddress)](#getlockedtokentouser)
- [_checkIfValidTransfer(address _userAddress, uint256 _amount)](#_checkifvalidtransfer)
- [_getUnlockedAmountForLockup(bytes32 _lockupName)](#_getunlockedamountforlockup)
- [_removeLockupType(bytes32 _lockupName)](#_removelockuptype)
- [_modifyLockUpType(uint256 _lockupAmount, uint256 _startTime, uint256 _lockUpPeriodSeconds, uint256 _releaseFrequencySeconds, bytes32 _lockupName)](#_modifylockuptype)
- [_removeLockUpFromUser(address _userAddress, bytes32 _lockupName)](#_removelockupfromuser)
- [_addNewLockUpToUser(address _userAddress, uint256 _lockupAmount, uint256 _startTime, uint256 _lockUpPeriodSeconds, uint256 _releaseFrequencySeconds, bytes32 _lockupName)](#_addnewlockuptouser)
- [_addLockUpByName(address _userAddress, bytes32 _lockupName)](#_addlockupbyname)
- [_addNewLockUpType(uint256 _lockupAmount, uint256 _startTime, uint256 _lockUpPeriodSeconds, uint256 _releaseFrequencySeconds, bytes32 _lockupName)](#_addnewlockuptype)
- [_checkLockUpParams(uint256 _lockupAmount, uint256 _lockUpPeriodSeconds, uint256 _releaseFrequencySeconds)](#_checklockupparams)
- [getInitFunction()](#getinitfunction)
- [getPermissions()](#getpermissions)

### verifyTransfer

⤾ overrides [ITransferManager.verifyTransfer](ITransferManager.md#verifytransfer)

Used to verify the transfer transaction and prevent locked up tokens from being transferred

```js
function verifyTransfer(address _from, address , uint256 _amount, bytes , bool ) public nonpayable
returns(enum ITransferManager.Result)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address | Address of the sender | 
|  | address | _from Address of the sender | 
| _amount | uint256 | The amount of tokens to transfer | 
|  | bytes | _from Address of the sender | 
|  | bool | _from Address of the sender | 

### addNewLockUpType

Use to add the new lockup type

```js
function addNewLockUpType(uint256 _lockupAmount, uint256 _startTime, uint256 _lockUpPeriodSeconds, uint256 _releaseFrequencySeconds, bytes32 _lockupName) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _lockupAmount | uint256 | Amount of tokens that need to lock. | 
| _startTime | uint256 | When this lockup starts (seconds) | 
| _lockUpPeriodSeconds | uint256 | Total period of lockup (seconds) | 
| _releaseFrequencySeconds | uint256 | How often to release a tranche of tokens (seconds) | 
| _lockupName | bytes32 | Name of the lockup | 

### addNewLockUpTypeMulti

Use to add the new lockup type

```js
function addNewLockUpTypeMulti(uint256[] _lockupAmounts, uint256[] _startTimes, uint256[] _lockUpPeriodsSeconds, uint256[] _releaseFrequenciesSeconds, bytes32[] _lockupNames) external nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _lockupAmounts | uint256[] | Array of amount of tokens that need to lock. | 
| _startTimes | uint256[] | Array of startTimes when this lockup starts (seconds) | 
| _lockUpPeriodsSeconds | uint256[] | Array of total period of lockup (seconds) | 
| _releaseFrequenciesSeconds | uint256[] | Array of how often to release a tranche of tokens (seconds) | 
| _lockupNames | bytes32[] | Array of names of the lockup | 

### addLockUpByName

Add the lockup to a user

```js
function addLockUpByName(address _userAddress, bytes32 _lockupName) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _userAddress | address | Address of the user | 
| _lockupName | bytes32 | Name of the lockup | 

### addLockUpByNameMulti

Add the lockup to a user

```js
function addLockUpByNameMulti(address[] _userAddresses, bytes32[] _lockupNames) external nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _userAddresses | address[] | Address of the user | 
| _lockupNames | bytes32[] | Name of the lockup | 

### addNewLockUpToUser

Lets the admin create a volume restriction lockup for a given address.

```js
function addNewLockUpToUser(address _userAddress, uint256 _lockupAmount, uint256 _startTime, uint256 _lockUpPeriodSeconds, uint256 _releaseFrequencySeconds, bytes32 _lockupName) external nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _userAddress | address | Address of the user whose tokens should be locked up | 
| _lockupAmount | uint256 | Amount of tokens that need to lock. | 
| _startTime | uint256 | When this lockup starts (seconds) | 
| _lockUpPeriodSeconds | uint256 | Total period of lockup (seconds) | 
| _releaseFrequencySeconds | uint256 | How often to release a tranche of tokens (seconds) | 
| _lockupName | bytes32 | Name of the lockup | 

### addNewLockUpToUserMulti

Lets the admin create multiple volume restriction lockups for multiple given addresses.

```js
function addNewLockUpToUserMulti(address[] _userAddresses, uint256[] _lockupAmounts, uint256[] _startTimes, uint256[] _lockUpPeriodsSeconds, uint256[] _releaseFrequenciesSeconds, bytes32[] _lockupNames) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _userAddresses | address[] | Array of address of the user whose tokens should be locked up | 
| _lockupAmounts | uint256[] | Array of the amounts that need to be locked for the different addresses. | 
| _startTimes | uint256[] | Array of When this lockup starts (seconds) | 
| _lockUpPeriodsSeconds | uint256[] | Array of total periods of lockup (seconds) | 
| _releaseFrequenciesSeconds | uint256[] | Array of how often to release a tranche of tokens (seconds) | 
| _lockupNames | bytes32[] | Array of names of the lockup | 

### removeLockUpFromUser

Lets the admin remove a user's lock up

```js
function removeLockUpFromUser(address _userAddress, bytes32 _lockupName) external nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _userAddress | address | Address of the user whose tokens are locked up | 
| _lockupName | bytes32 | Name of the lockup need to be removed. | 

### removeLockupType

Used to remove the lockup type

```js
function removeLockupType(bytes32 _lockupName) external nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _lockupName | bytes32 | Name of the lockup | 

### removeLockupTypeMulti

Used to remove the multiple lockup type

```js
function removeLockupTypeMulti(bytes32[] _lockupNames) external nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _lockupNames | bytes32[] | Array of the lockup names. | 

### removeLockUpFromUserMulti

Use to remove the lockup for multiple users

```js
function removeLockUpFromUserMulti(address[] _userAddresses, bytes32[] _lockupNames) external nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _userAddresses | address[] | Array of addresses of the user whose tokens are locked up | 
| _lockupNames | bytes32[] | Array of the names of the lockup that needs to be removed. | 

### modifyLockUpType

Lets the admin modify a lockup.

```js
function modifyLockUpType(uint256 _lockupAmount, uint256 _startTime, uint256 _lockUpPeriodSeconds, uint256 _releaseFrequencySeconds, bytes32 _lockupName) external nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _lockupAmount | uint256 | Amount of tokens that needs to be locked | 
| _startTime | uint256 | When this lockup starts (seconds) | 
| _lockUpPeriodSeconds | uint256 | Total period of lockup (seconds) | 
| _releaseFrequencySeconds | uint256 | How often to release a tranche of tokens (seconds) | 
| _lockupName | bytes32 | name of the lockup that needs to be modified. | 

### modifyLockUpTypeMulti

Lets the admin modify a volume restriction lockup for a multiple address.

```js
function modifyLockUpTypeMulti(uint256[] _lockupAmounts, uint256[] _startTimes, uint256[] _lockUpPeriodsSeconds, uint256[] _releaseFrequenciesSeconds, bytes32[] _lockupNames) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _lockupAmounts | uint256[] | Array of the amount of tokens that needs to be locked for the respective addresses. | 
| _startTimes | uint256[] | Array of the start time of the lockups (seconds) | 
| _lockUpPeriodsSeconds | uint256[] | Array of unix timestamp for the list of lockups (seconds). | 
| _releaseFrequenciesSeconds | uint256[] | How often to release a tranche of tokens (seconds) | 
| _lockupNames | bytes32[] | Array of the lockup names that needs to be modified | 

### getLockUp

Get a specific element in a user's lockups array given the user's address and the element index

```js
function getLockUp(bytes32 _lockupName) public view
returns(lockupAmount uint256, startTime uint256, lockUpPeriodSeconds uint256, releaseFrequencySeconds uint256, unlockedAmount uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _lockupName | bytes32 | The name of the lockup | 

### getListOfAddresses

get the list of the users of a lockup type

```js
function getListOfAddresses(bytes32 _lockupName) external view
returns(address[])
```

**Returns**

address List of users associated with the blacklist

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _lockupName | bytes32 | Name of the lockup type | 

### getAllLockups

get the list of lockups names

```js
function getAllLockups() external view
returns(bytes32[])
```

**Returns**

bytes32 Array of lockups names

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getAllLockupData

Return the data of the lockups

```js
function getAllLockupData() external view
returns(bytes32[], uint256[], uint256[], uint256[], uint256[], uint256[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getLockupsNamesToUser

get the list of the lockups for a given user

```js
function getLockupsNamesToUser(address _user) external view
returns(bytes32[])
```

**Returns**

bytes32 List of lockups names associated with the given address

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _user | address | Address of the user | 

### getLockedTokenToUser

Use to get the total locked tokens for a given user

```js
function getLockedTokenToUser(address _userAddress) public view
returns(uint256)
```

**Returns**

uint256 Total locked tokens amount

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _userAddress | address | Address of the user | 

### _checkIfValidTransfer

Checks whether the transfer is allowed

```js
function _checkIfValidTransfer(address _userAddress, uint256 _amount) internal view
returns(enum ITransferManager.Result)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _userAddress | address | Address of the user whose lock ups should be checked | 
| _amount | uint256 | Amount of tokens that need to transact | 

### _getUnlockedAmountForLockup

Provide the unlock amount for the given lockup for a particular user

```js
function _getUnlockedAmountForLockup(bytes32 _lockupName) internal view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _lockupName | bytes32 |  | 

### _removeLockupType

```js
function _removeLockupType(bytes32 _lockupName) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _lockupName | bytes32 |  | 

### _modifyLockUpType

```js
function _modifyLockUpType(uint256 _lockupAmount, uint256 _startTime, uint256 _lockUpPeriodSeconds, uint256 _releaseFrequencySeconds, bytes32 _lockupName) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _lockupAmount | uint256 |  | 
| _startTime | uint256 |  | 
| _lockUpPeriodSeconds | uint256 |  | 
| _releaseFrequencySeconds | uint256 |  | 
| _lockupName | bytes32 |  | 

### _removeLockUpFromUser

```js
function _removeLockUpFromUser(address _userAddress, bytes32 _lockupName) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _userAddress | address |  | 
| _lockupName | bytes32 |  | 

### _addNewLockUpToUser

```js
function _addNewLockUpToUser(address _userAddress, uint256 _lockupAmount, uint256 _startTime, uint256 _lockUpPeriodSeconds, uint256 _releaseFrequencySeconds, bytes32 _lockupName) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _userAddress | address |  | 
| _lockupAmount | uint256 |  | 
| _startTime | uint256 |  | 
| _lockUpPeriodSeconds | uint256 |  | 
| _releaseFrequencySeconds | uint256 |  | 
| _lockupName | bytes32 |  | 

### _addLockUpByName

```js
function _addLockUpByName(address _userAddress, bytes32 _lockupName) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _userAddress | address |  | 
| _lockupName | bytes32 |  | 

### _addNewLockUpType

```js
function _addNewLockUpType(uint256 _lockupAmount, uint256 _startTime, uint256 _lockUpPeriodSeconds, uint256 _releaseFrequencySeconds, bytes32 _lockupName) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _lockupAmount | uint256 |  | 
| _startTime | uint256 |  | 
| _lockUpPeriodSeconds | uint256 |  | 
| _releaseFrequencySeconds | uint256 |  | 
| _lockupName | bytes32 |  | 

### _checkLockUpParams

Parameter checking function for creating or editing a lockup.
 This function will cause an exception if any of the parameters are bad.

```js
function _checkLockUpParams(uint256 _lockupAmount, uint256 _lockUpPeriodSeconds, uint256 _releaseFrequencySeconds) internal pure
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _lockupAmount | uint256 | Amount that needs to be locked | 
| _lockUpPeriodSeconds | uint256 | Total period of lockup (seconds) | 
| _releaseFrequencySeconds | uint256 | How often to release a tranche of tokens (seconds) | 

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

Returns the permissions flag that are associated with Percentage transfer Manager

```js
function getPermissions() public view
returns(bytes32[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

