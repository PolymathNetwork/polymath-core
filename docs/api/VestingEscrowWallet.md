---
id: version-3.0.0-VestingEscrowWallet
title: VestingEscrowWallet
original_id: VestingEscrowWallet
---

# Wallet for core vesting escrow functionality (VestingEscrowWallet.sol)

View Source: [contracts/modules/Experimental/Wallet/VestingEscrowWallet.sol](../../contracts/modules/Experimental/Wallet/VestingEscrowWallet.sol)

**↗ Extends: [VestingEscrowWalletStorage](VestingEscrowWalletStorage.md), [IWallet](IWallet.md)**

**VestingEscrowWallet**

## Constructor

Constructor

```js
constructor(address _securityToken, address _polyAddress) public
```

**Arguments**

**Enums**
### State

```js
enum State {
 CREATED,
 STARTED,
 COMPLETED
}
```

## Contract Members
**Constants & Variables**

```js
bytes32 public constant ADMIN;

```

**Events**

```js
event AddSchedule(address indexed _beneficiary, bytes32  _templateName, uint256  _startTime);
event ModifySchedule(address indexed _beneficiary, bytes32  _templateName, uint256  _startTime);
event RevokeAllSchedules(address indexed _beneficiary);
event RevokeSchedule(address indexed _beneficiary, bytes32  _templateName);
event DepositTokens(uint256  _numberOfTokens, address  _sender);
event SendToTreasury(uint256  _numberOfTokens, address  _sender);
event SendTokens(address indexed _beneficiary, uint256  _numberOfTokens);
event AddTemplate(bytes32  _name, uint256  _numberOfTokens, uint256  _duration, uint256  _frequency);
event RemoveTemplate(bytes32  _name);
event TreasuryWalletChanged(address  _newWallet, address  _oldWallet);
```

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _securityToken | address | Address of the security token | 
| _polyAddress | address | Address of the polytoken | 

## Functions

- [getInitFunction()](#getinitfunction)
- [configure(address _treasuryWallet)](#configure)
- [changeTreasuryWallet(address _newTreasuryWallet)](#changetreasurywallet)
- [depositTokens(uint256 _numberOfTokens)](#deposittokens)
- [_depositTokens(uint256 _numberOfTokens)](#_deposittokens)
- [sendToTreasury(uint256 _amount)](#sendtotreasury)
- [pushAvailableTokens(address _beneficiary)](#pushavailabletokens)
- [pullAvailableTokens()](#pullavailabletokens)
- [addTemplate(bytes32 _name, uint256 _numberOfTokens, uint256 _duration, uint256 _frequency)](#addtemplate)
- [_addTemplate(bytes32 _name, uint256 _numberOfTokens, uint256 _duration, uint256 _frequency)](#_addtemplate)
- [removeTemplate(bytes32 _name)](#removetemplate)
- [getTemplateCount()](#gettemplatecount)
- [getAllTemplateNames()](#getalltemplatenames)
- [addSchedule(address _beneficiary, bytes32 _templateName, uint256 _numberOfTokens, uint256 _duration, uint256 _frequency, uint256 _startTime)](#addschedule)
- [_addSchedule(address _beneficiary, bytes32 _templateName, uint256 _numberOfTokens, uint256 _duration, uint256 _frequency, uint256 _startTime)](#_addschedule)
- [addScheduleFromTemplate(address _beneficiary, bytes32 _templateName, uint256 _startTime)](#addschedulefromtemplate)
- [_addScheduleFromTemplate(address _beneficiary, bytes32 _templateName, uint256 _startTime)](#_addschedulefromtemplate)
- [modifySchedule(address _beneficiary, bytes32 _templateName, uint256 _startTime)](#modifyschedule)
- [_modifySchedule(address _beneficiary, bytes32 _templateName, uint256 _startTime)](#_modifyschedule)
- [revokeSchedule(address _beneficiary, bytes32 _templateName)](#revokeschedule)
- [_deleteUserToTemplates(address _beneficiary, bytes32 _templateName)](#_deleteusertotemplates)
- [_deleteTemplateToUsers(address _beneficiary, bytes32 _templateName)](#_deletetemplatetousers)
- [revokeAllSchedules(address _beneficiary)](#revokeallschedules)
- [_revokeAllSchedules(address _beneficiary)](#_revokeallschedules)
- [getSchedule(address _beneficiary, bytes32 _templateName)](#getschedule)
- [_getScheduleState(address _beneficiary, bytes32 _templateName)](#_getschedulestate)
- [getTemplateNames(address _beneficiary)](#gettemplatenames)
- [getScheduleCount(address _beneficiary)](#getschedulecount)
- [_getAvailableTokens(address _beneficiary, uint256 _index)](#_getavailabletokens)
- [_getReleasedTokens(address _beneficiary, uint256 _index)](#_getreleasedtokens)
- [pushAvailableTokensMulti(uint256 _fromIndex, uint256 _toIndex)](#pushavailabletokensmulti)
- [addScheduleMulti(address[] _beneficiaries, bytes32[] _templateNames, uint256[] _numberOfTokens, uint256[] _durations, uint256[] _frequencies, uint256[] _startTimes)](#addschedulemulti)
- [addScheduleFromTemplateMulti(address[] _beneficiaries, bytes32[] _templateNames, uint256[] _startTimes)](#addschedulefromtemplatemulti)
- [revokeSchedulesMulti(address[] _beneficiaries)](#revokeschedulesmulti)
- [modifyScheduleMulti(address[] _beneficiaries, bytes32[] _templateNames, uint256[] _startTimes)](#modifyschedulemulti)
- [_checkSchedule(address _beneficiary, bytes32 _templateName)](#_checkschedule)
- [_isTemplateExists(bytes32 _name)](#_istemplateexists)
- [_validateTemplate(uint256 _numberOfTokens, uint256 _duration, uint256 _frequency)](#_validatetemplate)
- [_sendTokens(address _beneficiary)](#_sendtokens)
- [_sendTokensPerSchedule(address _beneficiary, uint256 _index)](#_sendtokensperschedule)
- [getPermissions()](#getpermissions)

### getInitFunction

⤾ overrides [IModule.getInitFunction](IModule.md#getinitfunction)

This function returns the signature of the configure function

```js
function getInitFunction() public pure
returns(bytes4)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### configure

Used to initialize the treasury wallet address

```js
function configure(address _treasuryWallet) public nonpayable onlyFactory 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _treasuryWallet | address | Address of the treasury wallet | 

### changeTreasuryWallet

Used to change the treasury wallet address

```js
function changeTreasuryWallet(address _newTreasuryWallet) public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _newTreasuryWallet | address | Address of the treasury wallet | 

### depositTokens

Used to deposit tokens from treasury wallet to the vesting escrow wallet

```js
function depositTokens(uint256 _numberOfTokens) external nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _numberOfTokens | uint256 | Number of tokens that should be deposited | 

### _depositTokens

```js
function _depositTokens(uint256 _numberOfTokens) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _numberOfTokens | uint256 |  | 

### sendToTreasury

Sends unassigned tokens to the treasury wallet

```js
function sendToTreasury(uint256 _amount) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _amount | uint256 | Amount of tokens that should be send to the treasury wallet | 

### pushAvailableTokens

Pushes available tokens to the beneficiary's address

```js
function pushAvailableTokens(address _beneficiary) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _beneficiary | address | Address of the beneficiary who will receive tokens | 

### pullAvailableTokens

Used to withdraw available tokens by beneficiary

```js
function pullAvailableTokens() external nonpayable whenNotPaused 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### addTemplate

Adds template that can be used for creating schedule

```js
function addTemplate(bytes32 _name, uint256 _numberOfTokens, uint256 _duration, uint256 _frequency) external nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _name | bytes32 | Name of the template will be created | 
| _numberOfTokens | uint256 | Number of tokens that should be assigned to schedule | 
| _duration | uint256 | Duration of the vesting schedule | 
| _frequency | uint256 | Frequency of the vesting schedule | 

### _addTemplate

```js
function _addTemplate(bytes32 _name, uint256 _numberOfTokens, uint256 _duration, uint256 _frequency) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _name | bytes32 |  | 
| _numberOfTokens | uint256 |  | 
| _duration | uint256 |  | 
| _frequency | uint256 |  | 

### removeTemplate

Removes template with a given name

```js
function removeTemplate(bytes32 _name) external nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _name | bytes32 | Name of the template that will be removed | 

### getTemplateCount

Returns count of the templates those can be used for creating schedule

```js
function getTemplateCount() external view
returns(uint256)
```

**Returns**

Count of the templates

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getAllTemplateNames

Gets the list of the template names those can be used for creating schedule

```js
function getAllTemplateNames() external view
returns(bytes32[])
```

**Returns**

bytes32 Array of all template names were created

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### addSchedule

Adds vesting schedules for each of the beneficiary's address

```js
function addSchedule(address _beneficiary, bytes32 _templateName, uint256 _numberOfTokens, uint256 _duration, uint256 _frequency, uint256 _startTime) external nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _beneficiary | address | Address of the beneficiary for whom it is scheduled | 
| _templateName | bytes32 | Name of the template that will be created | 
| _numberOfTokens | uint256 | Total number of tokens for created schedule | 
| _duration | uint256 | Duration of the created vesting schedule | 
| _frequency | uint256 | Frequency of the created vesting schedule | 
| _startTime | uint256 | Start time of the created vesting schedule | 

### _addSchedule

```js
function _addSchedule(address _beneficiary, bytes32 _templateName, uint256 _numberOfTokens, uint256 _duration, uint256 _frequency, uint256 _startTime) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _beneficiary | address |  | 
| _templateName | bytes32 |  | 
| _numberOfTokens | uint256 |  | 
| _duration | uint256 |  | 
| _frequency | uint256 |  | 
| _startTime | uint256 |  | 

### addScheduleFromTemplate

Adds vesting schedules from template for the beneficiary

```js
function addScheduleFromTemplate(address _beneficiary, bytes32 _templateName, uint256 _startTime) external nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _beneficiary | address | Address of the beneficiary for whom it is scheduled | 
| _templateName | bytes32 | Name of the exists template | 
| _startTime | uint256 | Start time of the created vesting schedule | 

### _addScheduleFromTemplate

```js
function _addScheduleFromTemplate(address _beneficiary, bytes32 _templateName, uint256 _startTime) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _beneficiary | address |  | 
| _templateName | bytes32 |  | 
| _startTime | uint256 |  | 

### modifySchedule

Modifies vesting schedules for each of the beneficiary

```js
function modifySchedule(address _beneficiary, bytes32 _templateName, uint256 _startTime) external nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _beneficiary | address | Address of the beneficiary for whom it is modified | 
| _templateName | bytes32 | Name of the template was used for schedule creation | 
| _startTime | uint256 | Start time of the created vesting schedule | 

### _modifySchedule

```js
function _modifySchedule(address _beneficiary, bytes32 _templateName, uint256 _startTime) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _beneficiary | address |  | 
| _templateName | bytes32 |  | 
| _startTime | uint256 |  | 

### revokeSchedule

Revokes vesting schedule with given template name for given beneficiary

```js
function revokeSchedule(address _beneficiary, bytes32 _templateName) external nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _beneficiary | address | Address of the beneficiary for whom it is revoked | 
| _templateName | bytes32 | Name of the template was used for schedule creation | 

### _deleteUserToTemplates

```js
function _deleteUserToTemplates(address _beneficiary, bytes32 _templateName) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _beneficiary | address |  | 
| _templateName | bytes32 |  | 

### _deleteTemplateToUsers

```js
function _deleteTemplateToUsers(address _beneficiary, bytes32 _templateName) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _beneficiary | address |  | 
| _templateName | bytes32 |  | 

### revokeAllSchedules

Revokes all vesting schedules for given beneficiary's address

```js
function revokeAllSchedules(address _beneficiary) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _beneficiary | address | Address of the beneficiary for whom all schedules will be revoked | 

### _revokeAllSchedules

```js
function _revokeAllSchedules(address _beneficiary) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _beneficiary | address |  | 

### getSchedule

Returns beneficiary's schedule created using template name

```js
function getSchedule(address _beneficiary, bytes32 _templateName) external view
returns(uint256, uint256, uint256, uint256, uint256, enum VestingEscrowWallet.State)
```

**Returns**

beneficiary's schedule data (numberOfTokens, duration, frequency, startTime, claimedTokens, State)

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _beneficiary | address | Address of the beneficiary who will receive tokens | 
| _templateName | bytes32 | Name of the template was used for schedule creation | 

### _getScheduleState

```js
function _getScheduleState(address _beneficiary, bytes32 _templateName) internal view
returns(enum VestingEscrowWallet.State)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _beneficiary | address |  | 
| _templateName | bytes32 |  | 

### getTemplateNames

Returns list of the template names for given beneficiary's address

```js
function getTemplateNames(address _beneficiary) external view
returns(bytes32[])
```

**Returns**

List of the template names that were used for schedule creation

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _beneficiary | address | Address of the beneficiary | 

### getScheduleCount

Returns count of the schedules were created for given beneficiary

```js
function getScheduleCount(address _beneficiary) external view
returns(uint256)
```

**Returns**

Count of beneficiary's schedules

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _beneficiary | address | Address of the beneficiary | 

### _getAvailableTokens

```js
function _getAvailableTokens(address _beneficiary, uint256 _index) internal view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _beneficiary | address |  | 
| _index | uint256 |  | 

### _getReleasedTokens

```js
function _getReleasedTokens(address _beneficiary, uint256 _index) internal view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _beneficiary | address |  | 
| _index | uint256 |  | 

### pushAvailableTokensMulti

Used to bulk send available tokens for each of the beneficiaries

```js
function pushAvailableTokensMulti(uint256 _fromIndex, uint256 _toIndex) external nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _fromIndex | uint256 | Start index of array of beneficiary's addresses | 
| _toIndex | uint256 | End index of array of beneficiary's addresses | 

### addScheduleMulti

Used to bulk add vesting schedules for each of beneficiary

```js
function addScheduleMulti(address[] _beneficiaries, bytes32[] _templateNames, uint256[] _numberOfTokens, uint256[] _durations, uint256[] _frequencies, uint256[] _startTimes) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _beneficiaries | address[] | Array of the beneficiary's addresses | 
| _templateNames | bytes32[] | Array of the template names | 
| _numberOfTokens | uint256[] | Array of number of tokens should be assigned to schedules | 
| _durations | uint256[] | Array of the vesting duration | 
| _frequencies | uint256[] | Array of the vesting frequency | 
| _startTimes | uint256[] | Array of the vesting start time | 

### addScheduleFromTemplateMulti

Used to bulk add vesting schedules from template for each of the beneficiary

```js
function addScheduleFromTemplateMulti(address[] _beneficiaries, bytes32[] _templateNames, uint256[] _startTimes) external nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _beneficiaries | address[] | Array of beneficiary's addresses | 
| _templateNames | bytes32[] | Array of the template names were used for schedule creation | 
| _startTimes | uint256[] | Array of the vesting start time | 

### revokeSchedulesMulti

Used to bulk revoke vesting schedules for each of the beneficiaries

```js
function revokeSchedulesMulti(address[] _beneficiaries) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _beneficiaries | address[] | Array of the beneficiary's addresses | 

### modifyScheduleMulti

Used to bulk modify vesting schedules for each of the beneficiaries

```js
function modifyScheduleMulti(address[] _beneficiaries, bytes32[] _templateNames, uint256[] _startTimes) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _beneficiaries | address[] | Array of the beneficiary's addresses | 
| _templateNames | bytes32[] | Array of the template names | 
| _startTimes | uint256[] | Array of the vesting start time | 

### _checkSchedule

```js
function _checkSchedule(address _beneficiary, bytes32 _templateName) internal view
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _beneficiary | address |  | 
| _templateName | bytes32 |  | 

### _isTemplateExists

```js
function _isTemplateExists(bytes32 _name) internal view
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _name | bytes32 |  | 

### _validateTemplate

```js
function _validateTemplate(uint256 _numberOfTokens, uint256 _duration, uint256 _frequency) internal view
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _numberOfTokens | uint256 |  | 
| _duration | uint256 |  | 
| _frequency | uint256 |  | 

### _sendTokens

```js
function _sendTokens(address _beneficiary) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _beneficiary | address |  | 

### _sendTokensPerSchedule

```js
function _sendTokensPerSchedule(address _beneficiary, uint256 _index) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _beneficiary | address |  | 
| _index | uint256 |  | 

### getPermissions

⤾ overrides [IModule.getPermissions](IModule.md#getpermissions)

Return the permissions flag that are associated with VestingEscrowWallet

```js
function getPermissions() public view
returns(bytes32[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

