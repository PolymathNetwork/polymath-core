---
id: version-3.0.0-VolumeRestrictionTM
title: VolumeRestrictionTM
original_id: VolumeRestrictionTM
---

# VolumeRestrictionTM.sol

View Source: [contracts/modules/TransferManager/VRTM/VolumeRestrictionTM.sol](../../contracts/modules/TransferManager/VRTM/VolumeRestrictionTM.sol)

**↗ Extends: [VolumeRestrictionTMStorage](VolumeRestrictionTMStorage.md), [TransferManager](TransferManager.md)**

**VolumeRestrictionTM**

**Events**

```js
event ChangedExemptWalletList(address indexed _wallet, bool  _exempted);
event AddIndividualRestriction(address indexed _holder, uint256  _allowedTokens, uint256  _startTime, uint256  _rollingPeriodInDays, uint256  _endTime, enum VolumeRestrictionTMStorage.RestrictionType  _typeOfRestriction);
event AddIndividualDailyRestriction(address indexed _holder, uint256  _allowedTokens, uint256  _startTime, uint256  _rollingPeriodInDays, uint256  _endTime, enum VolumeRestrictionTMStorage.RestrictionType  _typeOfRestriction);
event ModifyIndividualRestriction(address indexed _holder, uint256  _allowedTokens, uint256  _startTime, uint256  _rollingPeriodInDays, uint256  _endTime, enum VolumeRestrictionTMStorage.RestrictionType  _typeOfRestriction);
event ModifyIndividualDailyRestriction(address indexed _holder, uint256  _allowedTokens, uint256  _startTime, uint256  _rollingPeriodInDays, uint256  _endTime, enum VolumeRestrictionTMStorage.RestrictionType  _typeOfRestriction);
event AddDefaultRestriction(uint256  _allowedTokens, uint256  _startTime, uint256  _rollingPeriodInDays, uint256  _endTime, enum VolumeRestrictionTMStorage.RestrictionType  _typeOfRestriction);
event AddDefaultDailyRestriction(uint256  _allowedTokens, uint256  _startTime, uint256  _rollingPeriodInDays, uint256  _endTime, enum VolumeRestrictionTMStorage.RestrictionType  _typeOfRestriction);
event ModifyDefaultRestriction(uint256  _allowedTokens, uint256  _startTime, uint256  _rollingPeriodInDays, uint256  _endTime, enum VolumeRestrictionTMStorage.RestrictionType  _typeOfRestriction);
event ModifyDefaultDailyRestriction(uint256  _allowedTokens, uint256  _startTime, uint256  _rollingPeriodInDays, uint256  _endTime, enum VolumeRestrictionTMStorage.RestrictionType  _typeOfRestriction);
event IndividualRestrictionRemoved(address indexed _holder);
event IndividualDailyRestrictionRemoved(address indexed _holder);
event DefaultRestrictionRemoved();
event DefaultDailyRestrictionRemoved();
```

## Functions

- [(address _securityToken, address _polyAddress)](#)
- [executeTransfer(address _from, address , uint256 _amount, bytes )](#executetransfer)
- [verifyTransfer(address _from, address , uint256 _amount, bytes )](#verifytransfer)
- [_verifyTransfer(address _from, uint256 _amount)](#_verifytransfer)
- [changeExemptWalletList(address _wallet, bool _exempted)](#changeexemptwalletlist)
- [addIndividualRestriction(address _holder, uint256 _allowedTokens, uint256 _startTime, uint256 _rollingPeriodInDays, uint256 _endTime, enum VolumeRestrictionTMStorage.RestrictionType _restrictionType)](#addindividualrestriction)
- [addIndividualDailyRestriction(address _holder, uint256 _allowedTokens, uint256 _startTime, uint256 _endTime, enum VolumeRestrictionTMStorage.RestrictionType _restrictionType)](#addindividualdailyrestriction)
- [addIndividualDailyRestrictionMulti(address[] _holders, uint256[] _allowedTokens, uint256[] _startTimes, uint256[] _endTimes, enum VolumeRestrictionTMStorage.RestrictionType[] _restrictionTypes)](#addindividualdailyrestrictionmulti)
- [addIndividualRestrictionMulti(address[] _holders, uint256[] _allowedTokens, uint256[] _startTimes, uint256[] _rollingPeriodInDays, uint256[] _endTimes, enum VolumeRestrictionTMStorage.RestrictionType[] _restrictionTypes)](#addindividualrestrictionmulti)
- [addDefaultRestriction(uint256 _allowedTokens, uint256 _startTime, uint256 _rollingPeriodInDays, uint256 _endTime, enum VolumeRestrictionTMStorage.RestrictionType _restrictionType)](#adddefaultrestriction)
- [addDefaultDailyRestriction(uint256 _allowedTokens, uint256 _startTime, uint256 _endTime, enum VolumeRestrictionTMStorage.RestrictionType _restrictionType)](#adddefaultdailyrestriction)
- [removeIndividualRestriction(address _holder)](#removeindividualrestriction)
- [_removeIndividualRestriction(address _holder)](#_removeindividualrestriction)
- [removeIndividualRestrictionMulti(address[] _holders)](#removeindividualrestrictionmulti)
- [removeIndividualDailyRestriction(address _holder)](#removeindividualdailyrestriction)
- [_removeIndividualDailyRestriction(address _holder)](#_removeindividualdailyrestriction)
- [removeIndividualDailyRestrictionMulti(address[] _holders)](#removeindividualdailyrestrictionmulti)
- [removeDefaultRestriction()](#removedefaultrestriction)
- [removeDefaultDailyRestriction()](#removedefaultdailyrestriction)
- [modifyIndividualRestriction(address _holder, uint256 _allowedTokens, uint256 _startTime, uint256 _rollingPeriodInDays, uint256 _endTime, enum VolumeRestrictionTMStorage.RestrictionType _restrictionType)](#modifyindividualrestriction)
- [modifyIndividualDailyRestriction(address _holder, uint256 _allowedTokens, uint256 _startTime, uint256 _endTime, enum VolumeRestrictionTMStorage.RestrictionType _restrictionType)](#modifyindividualdailyrestriction)
- [modifyIndividualDailyRestrictionMulti(address[] _holders, uint256[] _allowedTokens, uint256[] _startTimes, uint256[] _endTimes, enum VolumeRestrictionTMStorage.RestrictionType[] _restrictionTypes)](#modifyindividualdailyrestrictionmulti)
- [modifyIndividualRestrictionMulti(address[] _holders, uint256[] _allowedTokens, uint256[] _startTimes, uint256[] _rollingPeriodInDays, uint256[] _endTimes, enum VolumeRestrictionTMStorage.RestrictionType[] _restrictionTypes)](#modifyindividualrestrictionmulti)
- [modifyDefaultRestriction(uint256 _allowedTokens, uint256 _startTime, uint256 _rollingPeriodInDays, uint256 _endTime, enum VolumeRestrictionTMStorage.RestrictionType _restrictionType)](#modifydefaultrestriction)
- [modifyDefaultDailyRestriction(uint256 _allowedTokens, uint256 _startTime, uint256 _endTime, enum VolumeRestrictionTMStorage.RestrictionType _restrictionType)](#modifydefaultdailyrestriction)
- [_restrictionCheck(uint256 _amount, address _from, bool _isDefault, struct VolumeRestrictionTMStorage.VolumeRestriction _restriction)](#_restrictioncheck)
- [_validAllowedAmount(struct VolumeRestrictionTMStorage.VolumeRestriction dailyRestriction, struct VolumeRestrictionTMStorage.VolumeRestriction restriction, uint256 allowedAmount, uint256 allowedDailyAmount)](#_validallowedamount)
- [_isValidAmountAfterRestrictionChanges(bool _isDefault, address _from, uint256 _amount, uint256 _sumOfLastPeriod, uint256 _allowedAmount)](#_isvalidamountafterrestrictionchanges)
- [_dailyTxCheck(uint256 _amount, address _from, bool _isDefault, uint256 _dailyLastTradedDayTime, struct VolumeRestrictionTMStorage.VolumeRestriction _restriction)](#_dailytxcheck)
- [_bucketCheck(address _from, bool isDefault, uint256 _fromTime, uint256 _diffDays, uint256 _rollingPeriodInDays, struct VolumeRestrictionTMStorage.BucketDetails _bucketDetails)](#_bucketcheck)
- [_checkValidAmountToTransact(uint256 _amountToTransact, address _from, bool _isDefault, struct VolumeRestrictionTMStorage.VolumeRestriction _restriction, uint256 _sumOfLastPeriod)](#_checkvalidamounttotransact)
- [_allowedAmountToTransact(uint256 _sumOfLastPeriod, struct VolumeRestrictionTMStorage.VolumeRestriction _restriction)](#_allowedamounttotransact)
- [_updateStorage(address _from, uint256 _amount, uint256 _lastTradedDayTime, uint256 _sumOfLastPeriod, uint256 _daysCovered, uint256 _dailyLastTradedDayTime, uint256 _endTime, bool isDefault)](#_updatestorage)
- [_updateStorageActual(address _from, uint256 _amount, uint256 _lastTradedDayTime, uint256 _sumOfLastPeriod, uint256 _daysCovered, uint256 _dailyLastTradedDayTime, uint256 _endTime, bool isDefault, struct VolumeRestrictionTMStorage.BucketDetails details)](#_updatestorageactual)
- [_checkInputParams(uint256 _allowedTokens, uint256 _startTime, uint256 _rollingPeriodDays, uint256 _endTime, enum VolumeRestrictionTMStorage.RestrictionType _restrictionType, uint256 _earliestStartTime, bool isModifyDaily)](#_checkinputparams)
- [_isAllowedToModify(uint256 _startTime)](#_isallowedtomodify)
- [_getValidStartTime(uint256 _startTime)](#_getvalidstarttime)
- [getTokensByPartition(bytes32 _partition, address _tokenHolder, uint256 _additionalBalance)](#gettokensbypartition)
- [getIndividualBucketDetailsToUser(address _user)](#getindividualbucketdetailstouser)
- [getDefaultBucketDetailsToUser(address _user)](#getdefaultbucketdetailstouser)
- [_getBucketDetails(struct VolumeRestrictionTMStorage.BucketDetails _bucket)](#_getbucketdetails)
- [getTotalTradedByUser(address _user, uint256 _at)](#gettotaltradedbyuser)
- [getInitFunction()](#getinitfunction)
- [getExemptAddress()](#getexemptaddress)
- [getIndividualRestriction(address _investor)](#getindividualrestriction)
- [getIndividualDailyRestriction(address _investor)](#getindividualdailyrestriction)
- [getDefaultRestriction()](#getdefaultrestriction)
- [getDefaultDailyRestriction()](#getdefaultdailyrestriction)
- [_volumeRestrictionSplay(struct VolumeRestrictionTMStorage.VolumeRestriction _volumeRestriction)](#_volumerestrictionsplay)
- [getRestrictionData()](#getrestrictiondata)
- [_checkLengthOfArray(address[] _holders, uint256[] _allowedTokens, uint256[] _startTimes, uint256[] _rollingPeriodInDays, uint256[] _endTimes, enum VolumeRestrictionTMStorage.RestrictionType[] _restrictionTypes)](#_checklengthofarray)
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

### executeTransfer

⤾ overrides [ITransferManager.executeTransfer](ITransferManager.md#executetransfer)

Used to verify the transfer/transferFrom transaction and prevent tranaction
whose volume of tokens will voilate the maximum volume transfer restriction

```js
function executeTransfer(address _from, address , uint256 _amount, bytes ) external nonpayable onlySecurityToken 
returns(success enum ITransferManager.Result)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address | Address of the sender | 
|  | address | _from Address of the sender | 
| _amount | uint256 | The amount of tokens to transfer | 
|  | bytes | _from Address of the sender | 

### verifyTransfer

⤾ overrides [ITransferManager.verifyTransfer](ITransferManager.md#verifytransfer)

Used to verify the transfer/transferFrom transaction and prevent tranaction
whose volume of tokens will voilate the maximum volume transfer restriction

```js
function verifyTransfer(address _from, address , uint256 _amount, bytes ) public view
returns(enum ITransferManager.Result, bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address | Address of the sender | 
|  | address | _from Address of the sender | 
| _amount | uint256 | The amount of tokens to transfer | 
|  | bytes | _from Address of the sender | 

### _verifyTransfer

Used to verify the transfer/transferFrom transaction and prevent tranaction
whose volume of tokens will voilate the maximum volume transfer restriction

```js
function _verifyTransfer(address _from, uint256 _amount) internal view
returns(enum ITransferManager.Result, uint256, uint256, uint256, uint256, uint256, uint256, bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address | Address of the sender | 
| _amount | uint256 | The amount of tokens to transfer | 

### changeExemptWalletList

Add/Remove wallet address from the exempt list

```js
function changeExemptWalletList(address _wallet, bool _exempted) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _wallet | address | Ethereum wallet/contract address that need to be exempted | 
| _exempted | bool | Boolean value used to add (i.e true) or remove (i.e false) from the list | 

### addIndividualRestriction

Use to add the new individual restriction for a given token holder

```js
function addIndividualRestriction(address _holder, uint256 _allowedTokens, uint256 _startTime, uint256 _rollingPeriodInDays, uint256 _endTime, enum VolumeRestrictionTMStorage.RestrictionType _restrictionType) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _holder | address | Address of the token holder, whom restriction will be implied | 
| _allowedTokens | uint256 | Amount of tokens allowed to be trade for a given address. | 
| _startTime | uint256 | Unix timestamp at which restriction get into effect | 
| _rollingPeriodInDays | uint256 | Rolling period in days (Minimum value should be 1 day) | 
| _endTime | uint256 | Unix timestamp at which restriction effects will gets end. | 
| _restrictionType | enum VolumeRestrictionTMStorage.RestrictionType | Whether it will be `Fixed` (fixed no. of tokens allowed to transact)
or `Percentage` (tokens are calculated as per the totalSupply in the fly). | 

### addIndividualDailyRestriction

Use to add the new individual daily restriction for all token holder

```js
function addIndividualDailyRestriction(address _holder, uint256 _allowedTokens, uint256 _startTime, uint256 _endTime, enum VolumeRestrictionTMStorage.RestrictionType _restrictionType) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _holder | address | Address of the token holder, whom restriction will be implied | 
| _allowedTokens | uint256 | Amount of tokens allowed to be traded for all token holder. | 
| _startTime | uint256 | Unix timestamp at which restriction get into effect | 
| _endTime | uint256 | Unix timestamp at which restriction effects will gets end. | 
| _restrictionType | enum VolumeRestrictionTMStorage.RestrictionType | Whether it will be `Fixed` (fixed no. of tokens allowed to transact)
or `Percentage` (tokens are calculated as per the totalSupply in the fly). | 

### addIndividualDailyRestrictionMulti

Use to add the new individual daily restriction for multiple token holders

```js
function addIndividualDailyRestrictionMulti(address[] _holders, uint256[] _allowedTokens, uint256[] _startTimes, uint256[] _endTimes, enum VolumeRestrictionTMStorage.RestrictionType[] _restrictionTypes) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _holders | address[] | Array of address of the token holders, whom restriction will be implied | 
| _allowedTokens | uint256[] | Array of amount of tokens allowed to be trade for a given address. | 
| _startTimes | uint256[] | Array of unix timestamps at which restrictions get into effect | 
| _endTimes | uint256[] | Array of unix timestamps at which restriction effects will gets end. | 
| _restrictionTypes | enum VolumeRestrictionTMStorage.RestrictionType[] | Array of restriction types value whether it will be `Fixed` (fixed no. of tokens allowed to transact)
or `Percentage` (tokens are calculated as per the totalSupply in the fly). | 

### addIndividualRestrictionMulti

Use to add the new individual restriction for multiple token holders

```js
function addIndividualRestrictionMulti(address[] _holders, uint256[] _allowedTokens, uint256[] _startTimes, uint256[] _rollingPeriodInDays, uint256[] _endTimes, enum VolumeRestrictionTMStorage.RestrictionType[] _restrictionTypes) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _holders | address[] | Array of address of the token holders, whom restriction will be implied | 
| _allowedTokens | uint256[] | Array of amount of tokens allowed to be trade for a given address. | 
| _startTimes | uint256[] | Array of unix timestamps at which restrictions get into effect | 
| _rollingPeriodInDays | uint256[] | Array of rolling period in days (Minimum value should be 1 day) | 
| _endTimes | uint256[] | Array of unix timestamps at which restriction effects will gets end. | 
| _restrictionTypes | enum VolumeRestrictionTMStorage.RestrictionType[] | Array of restriction types value whether it will be `Fixed` (fixed no. of tokens allowed to transact)
or `Percentage` (tokens are calculated as per the totalSupply in the fly). | 

### addDefaultRestriction

Use to add the new default restriction for all token holder

```js
function addDefaultRestriction(uint256 _allowedTokens, uint256 _startTime, uint256 _rollingPeriodInDays, uint256 _endTime, enum VolumeRestrictionTMStorage.RestrictionType _restrictionType) external nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _allowedTokens | uint256 | Amount of tokens allowed to be traded for all token holder. | 
| _startTime | uint256 | Unix timestamp at which restriction get into effect | 
| _rollingPeriodInDays | uint256 | Rolling period in days (Minimum value should be 1 day) | 
| _endTime | uint256 | Unix timestamp at which restriction effects will gets end. | 
| _restrictionType | enum VolumeRestrictionTMStorage.RestrictionType | Whether it will be `Fixed` (fixed no. of tokens allowed to transact)
or `Percentage` (tokens are calculated as per the totalSupply in the fly). | 

### addDefaultDailyRestriction

Use to add the new default daily restriction for all token holder

```js
function addDefaultDailyRestriction(uint256 _allowedTokens, uint256 _startTime, uint256 _endTime, enum VolumeRestrictionTMStorage.RestrictionType _restrictionType) external nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _allowedTokens | uint256 | Amount of tokens allowed to be traded for all token holder. | 
| _startTime | uint256 | Unix timestamp at which restriction get into effect | 
| _endTime | uint256 | Unix timestamp at which restriction effects will gets end. | 
| _restrictionType | enum VolumeRestrictionTMStorage.RestrictionType | Whether it will be `Fixed` (fixed no. of tokens allowed to transact)
or `Percentage` (tokens are calculated as per the totalSupply in the fly). | 

### removeIndividualRestriction

use to remove the individual restriction for a given address

```js
function removeIndividualRestriction(address _holder) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _holder | address | Address of the user | 

### _removeIndividualRestriction

```js
function _removeIndividualRestriction(address _holder) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _holder | address |  | 

### removeIndividualRestrictionMulti

use to remove the individual restriction for a given address

```js
function removeIndividualRestrictionMulti(address[] _holders) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _holders | address[] | Array of address of the user | 

### removeIndividualDailyRestriction

use to remove the individual daily restriction for a given address

```js
function removeIndividualDailyRestriction(address _holder) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _holder | address | Address of the user | 

### _removeIndividualDailyRestriction

```js
function _removeIndividualDailyRestriction(address _holder) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _holder | address |  | 

### removeIndividualDailyRestrictionMulti

use to remove the individual daily restriction for a given address

```js
function removeIndividualDailyRestrictionMulti(address[] _holders) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _holders | address[] | Array of address of the user | 

### removeDefaultRestriction

Use to remove the default restriction

```js
function removeDefaultRestriction() public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### removeDefaultDailyRestriction

Use to remove the daily default restriction

```js
function removeDefaultDailyRestriction() external nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### modifyIndividualRestriction

Use to modify the existing individual restriction for a given token holder

```js
function modifyIndividualRestriction(address _holder, uint256 _allowedTokens, uint256 _startTime, uint256 _rollingPeriodInDays, uint256 _endTime, enum VolumeRestrictionTMStorage.RestrictionType _restrictionType) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _holder | address | Address of the token holder, whom restriction will be implied | 
| _allowedTokens | uint256 | Amount of tokens allowed to be trade for a given address. | 
| _startTime | uint256 | Unix timestamp at which restriction get into effect | 
| _rollingPeriodInDays | uint256 | Rolling period in days (Minimum value should be 1 day) | 
| _endTime | uint256 | Unix timestamp at which restriction effects will gets end. | 
| _restrictionType | enum VolumeRestrictionTMStorage.RestrictionType | Whether it will be `Fixed` (fixed no. of tokens allowed to transact)
or `Percentage` (tokens are calculated as per the totalSupply in the fly). | 

### modifyIndividualDailyRestriction

Use to modify the existing individual daily restriction for a given token holder

```js
function modifyIndividualDailyRestriction(address _holder, uint256 _allowedTokens, uint256 _startTime, uint256 _endTime, enum VolumeRestrictionTMStorage.RestrictionType _restrictionType) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _holder | address | Address of the token holder, whom restriction will be implied | 
| _allowedTokens | uint256 | Amount of tokens allowed to be trade for a given address. | 
| _startTime | uint256 | Unix timestamp at which restriction get into effect | 
| _endTime | uint256 | Unix timestamp at which restriction effects will gets end. | 
| _restrictionType | enum VolumeRestrictionTMStorage.RestrictionType | Whether it will be `Fixed` (fixed no. of tokens allowed to transact)
or `Percentage` (tokens are calculated as per the totalSupply in the fly). | 

### modifyIndividualDailyRestrictionMulti

Use to modify the existing individual daily restriction for multiple token holders

```js
function modifyIndividualDailyRestrictionMulti(address[] _holders, uint256[] _allowedTokens, uint256[] _startTimes, uint256[] _endTimes, enum VolumeRestrictionTMStorage.RestrictionType[] _restrictionTypes) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _holders | address[] | Array of address of the token holders, whom restriction will be implied | 
| _allowedTokens | uint256[] | Array of amount of tokens allowed to be trade for a given address. | 
| _startTimes | uint256[] | Array of unix timestamps at which restrictions get into effect | 
| _endTimes | uint256[] | Array of unix timestamps at which restriction effects will gets end. | 
| _restrictionTypes | enum VolumeRestrictionTMStorage.RestrictionType[] | Array of restriction types value whether it will be `Fixed` (fixed no. of tokens allowed to transact)
or `Percentage` (tokens are calculated as per the totalSupply in the fly). | 

### modifyIndividualRestrictionMulti

Use to modify the existing individual restriction for multiple token holders

```js
function modifyIndividualRestrictionMulti(address[] _holders, uint256[] _allowedTokens, uint256[] _startTimes, uint256[] _rollingPeriodInDays, uint256[] _endTimes, enum VolumeRestrictionTMStorage.RestrictionType[] _restrictionTypes) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _holders | address[] | Array of address of the token holders, whom restriction will be implied | 
| _allowedTokens | uint256[] | Array of amount of tokens allowed to be trade for a given address. | 
| _startTimes | uint256[] | Array of unix timestamps at which restrictions get into effect | 
| _rollingPeriodInDays | uint256[] | Array of rolling period in days (Minimum value should be 1 day) | 
| _endTimes | uint256[] | Array of unix timestamps at which restriction effects will gets end. | 
| _restrictionTypes | enum VolumeRestrictionTMStorage.RestrictionType[] | Array of restriction types value whether it will be `Fixed` (fixed no. of tokens allowed to transact)
or `Percentage` (tokens are calculated as per the totalSupply in the fly). | 

### modifyDefaultRestriction

Use to modify the global restriction for all token holder

```js
function modifyDefaultRestriction(uint256 _allowedTokens, uint256 _startTime, uint256 _rollingPeriodInDays, uint256 _endTime, enum VolumeRestrictionTMStorage.RestrictionType _restrictionType) external nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _allowedTokens | uint256 | Amount of tokens allowed to be traded for all token holder. | 
| _startTime | uint256 | Unix timestamp at which restriction get into effect | 
| _rollingPeriodInDays | uint256 | Rolling period in days (Minimum value should be 1 day) | 
| _endTime | uint256 | Unix timestamp at which restriction effects will gets end. | 
| _restrictionType | enum VolumeRestrictionTMStorage.RestrictionType | Whether it will be `Fixed` (fixed no. of tokens allowed to transact)
or `Percentage` (tokens are calculated as per the totalSupply in the fly). | 

### modifyDefaultDailyRestriction

Use to modify the daily default restriction for all token holder

```js
function modifyDefaultDailyRestriction(uint256 _allowedTokens, uint256 _startTime, uint256 _endTime, enum VolumeRestrictionTMStorage.RestrictionType _restrictionType) external nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _allowedTokens | uint256 | Amount of tokens allowed to be traded for all token holder. | 
| _startTime | uint256 | Unix timestamp at which restriction get into effect | 
| _endTime | uint256 | Unix timestamp at which restriction effects will gets end. | 
| _restrictionType | enum VolumeRestrictionTMStorage.RestrictionType | Whether it will be `Fixed` (fixed no. of tokens allowed to transact)
or `Percentage` (tokens are calculated as per the totalSupply in the fly). | 

### _restrictionCheck

Internal function used to validate the transaction for a given address
If it validates then it also update the storage corressponds to the default restriction

```js
function _restrictionCheck(uint256 _amount, address _from, bool _isDefault, struct VolumeRestrictionTMStorage.VolumeRestriction _restriction) internal view
returns(success enum ITransferManager.Result, fromTimestamp uint256, sumOfLastPeriod uint256, daysCovered uint256, dailyTime uint256, endTime uint256, allowedAmountToTransact uint256, allowedDaily bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _amount | uint256 |  | 
| _from | address |  | 
| _isDefault | bool |  | 
| _restriction | struct VolumeRestrictionTMStorage.VolumeRestriction |  | 

### _validAllowedAmount

```js
function _validAllowedAmount(struct VolumeRestrictionTMStorage.VolumeRestriction dailyRestriction, struct VolumeRestrictionTMStorage.VolumeRestriction restriction, uint256 allowedAmount, uint256 allowedDailyAmount) internal view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| dailyRestriction | struct VolumeRestrictionTMStorage.VolumeRestriction |  | 
| restriction | struct VolumeRestrictionTMStorage.VolumeRestriction |  | 
| allowedAmount | uint256 |  | 
| allowedDailyAmount | uint256 |  | 

### _isValidAmountAfterRestrictionChanges

The function is used to check specific edge case where the user restriction type change from
default to individual or vice versa. It will return true when last transaction traded by the user
and the current txn timestamp lies in the same day.
NB - Instead of comparing the current day transaction amount, we are comparing the total amount traded
on the lastTradedDayTime that makes the restriction strict. The reason is not availability of amount
that transacted on the current day (because of bucket desgin).

```js
function _isValidAmountAfterRestrictionChanges(bool _isDefault, address _from, uint256 _amount, uint256 _sumOfLastPeriod, uint256 _allowedAmount) internal view
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _isDefault | bool |  | 
| _from | address |  | 
| _amount | uint256 |  | 
| _sumOfLastPeriod | uint256 |  | 
| _allowedAmount | uint256 |  | 

### _dailyTxCheck

```js
function _dailyTxCheck(uint256 _amount, address _from, bool _isDefault, uint256 _dailyLastTradedDayTime, struct VolumeRestrictionTMStorage.VolumeRestriction _restriction) internal view
returns(bool, uint256, uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _amount | uint256 |  | 
| _from | address |  | 
| _isDefault | bool |  | 
| _dailyLastTradedDayTime | uint256 |  | 
| _restriction | struct VolumeRestrictionTMStorage.VolumeRestriction |  | 

### _bucketCheck

```js
function _bucketCheck(address _from, bool isDefault, uint256 _fromTime, uint256 _diffDays, uint256 _rollingPeriodInDays, struct VolumeRestrictionTMStorage.BucketDetails _bucketDetails) internal view
returns(uint256, uint256, uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address |  | 
| isDefault | bool |  | 
| _fromTime | uint256 |  | 
| _diffDays | uint256 |  | 
| _rollingPeriodInDays | uint256 |  | 
| _bucketDetails | struct VolumeRestrictionTMStorage.BucketDetails |  | 

### _checkValidAmountToTransact

```js
function _checkValidAmountToTransact(uint256 _amountToTransact, address _from, bool _isDefault, struct VolumeRestrictionTMStorage.VolumeRestriction _restriction, uint256 _sumOfLastPeriod) internal view
returns(bool, uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _amountToTransact | uint256 |  | 
| _from | address |  | 
| _isDefault | bool |  | 
| _restriction | struct VolumeRestrictionTMStorage.VolumeRestriction |  | 
| _sumOfLastPeriod | uint256 |  | 

### _allowedAmountToTransact

```js
function _allowedAmountToTransact(uint256 _sumOfLastPeriod, struct VolumeRestrictionTMStorage.VolumeRestriction _restriction) internal view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _sumOfLastPeriod | uint256 |  | 
| _restriction | struct VolumeRestrictionTMStorage.VolumeRestriction |  | 

### _updateStorage

```js
function _updateStorage(address _from, uint256 _amount, uint256 _lastTradedDayTime, uint256 _sumOfLastPeriod, uint256 _daysCovered, uint256 _dailyLastTradedDayTime, uint256 _endTime, bool isDefault) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address |  | 
| _amount | uint256 |  | 
| _lastTradedDayTime | uint256 |  | 
| _sumOfLastPeriod | uint256 |  | 
| _daysCovered | uint256 |  | 
| _dailyLastTradedDayTime | uint256 |  | 
| _endTime | uint256 |  | 
| isDefault | bool |  | 

### _updateStorageActual

```js
function _updateStorageActual(address _from, uint256 _amount, uint256 _lastTradedDayTime, uint256 _sumOfLastPeriod, uint256 _daysCovered, uint256 _dailyLastTradedDayTime, uint256 _endTime, bool isDefault, struct VolumeRestrictionTMStorage.BucketDetails details) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address |  | 
| _amount | uint256 |  | 
| _lastTradedDayTime | uint256 |  | 
| _sumOfLastPeriod | uint256 |  | 
| _daysCovered | uint256 |  | 
| _dailyLastTradedDayTime | uint256 |  | 
| _endTime | uint256 |  | 
| isDefault | bool |  | 
| details | struct VolumeRestrictionTMStorage.BucketDetails |  | 

### _checkInputParams

```js
function _checkInputParams(uint256 _allowedTokens, uint256 _startTime, uint256 _rollingPeriodDays, uint256 _endTime, enum VolumeRestrictionTMStorage.RestrictionType _restrictionType, uint256 _earliestStartTime, bool isModifyDaily) internal pure
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _allowedTokens | uint256 |  | 
| _startTime | uint256 |  | 
| _rollingPeriodDays | uint256 |  | 
| _endTime | uint256 |  | 
| _restrictionType | enum VolumeRestrictionTMStorage.RestrictionType |  | 
| _earliestStartTime | uint256 |  | 
| isModifyDaily | bool |  | 

### _isAllowedToModify

```js
function _isAllowedToModify(uint256 _startTime) internal view
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _startTime | uint256 |  | 

### _getValidStartTime

```js
function _getValidStartTime(uint256 _startTime) internal view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _startTime | uint256 |  | 

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

### getIndividualBucketDetailsToUser

Use to get the bucket details for a given address

```js
function getIndividualBucketDetailsToUser(address _user) public view
returns(uint256, uint256, uint256, uint256, uint256)
```

**Returns**

uint256 lastTradedDayTime

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _user | address | Address of the token holder for whom the bucket details has queried | 

### getDefaultBucketDetailsToUser

Use to get the bucket details for a given address

```js
function getDefaultBucketDetailsToUser(address _user) public view
returns(uint256, uint256, uint256, uint256, uint256)
```

**Returns**

uint256 lastTradedDayTime

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _user | address | Address of the token holder for whom the bucket details has queried | 

### _getBucketDetails

```js
function _getBucketDetails(struct VolumeRestrictionTMStorage.BucketDetails _bucket) internal view
returns(uint256, uint256, uint256, uint256, uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _bucket | struct VolumeRestrictionTMStorage.BucketDetails |  | 

### getTotalTradedByUser

Use to get the volume of token that being traded at a particular day (`_at` + 24 hours) for a given user

```js
function getTotalTradedByUser(address _user, uint256 _at) external view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _user | address | Address of the token holder | 
| _at | uint256 | Timestamp | 

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

### getExemptAddress

Use to return the list of exempted addresses

```js
function getExemptAddress() external view
returns(address[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getIndividualRestriction

```js
function getIndividualRestriction(address _investor) external view
returns(uint256, uint256, uint256, uint256, enum VolumeRestrictionTMStorage.RestrictionType)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investor | address |  | 

### getIndividualDailyRestriction

```js
function getIndividualDailyRestriction(address _investor) external view
returns(uint256, uint256, uint256, uint256, enum VolumeRestrictionTMStorage.RestrictionType)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investor | address |  | 

### getDefaultRestriction

```js
function getDefaultRestriction() external view
returns(uint256, uint256, uint256, uint256, enum VolumeRestrictionTMStorage.RestrictionType)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getDefaultDailyRestriction

```js
function getDefaultDailyRestriction() external view
returns(uint256, uint256, uint256, uint256, enum VolumeRestrictionTMStorage.RestrictionType)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### _volumeRestrictionSplay

```js
function _volumeRestrictionSplay(struct VolumeRestrictionTMStorage.VolumeRestriction _volumeRestriction) internal pure
returns(uint256, uint256, uint256, uint256, enum VolumeRestrictionTMStorage.RestrictionType)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _volumeRestriction | struct VolumeRestrictionTMStorage.VolumeRestriction |  | 

### getRestrictionData

Provide the restriction details of all the restricted addresses

```js
function getRestrictionData() external view
returns(allAddresses address[], allowedTokens uint256[], startTime uint256[], rollingPeriodInDays uint256[], endTime uint256[], typeOfRestriction enum VolumeRestrictionTMStorage.RestrictionType[])
```

**Returns**

address List of the restricted addresses

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### _checkLengthOfArray

```js
function _checkLengthOfArray(address[] _holders, uint256[] _allowedTokens, uint256[] _startTimes, uint256[] _rollingPeriodInDays, uint256[] _endTimes, enum VolumeRestrictionTMStorage.RestrictionType[] _restrictionTypes) internal pure
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _holders | address[] |  | 
| _allowedTokens | uint256[] |  | 
| _startTimes | uint256[] |  | 
| _rollingPeriodInDays | uint256[] |  | 
| _endTimes | uint256[] |  | 
| _restrictionTypes | enum VolumeRestrictionTMStorage.RestrictionType[] |  | 

### getPermissions

⤾ overrides [IModule.getPermissions](IModule.md#getpermissions)

Returns the permissions flag that are associated with Percentage transfer Manager

```js
function getPermissions() public view
returns(allPermissions bytes32[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

