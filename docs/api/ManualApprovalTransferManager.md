---
id: version-3.0.0-ManualApprovalTransferManager
title: ManualApprovalTransferManager
original_id: ManualApprovalTransferManager
---

# Transfer Manager module for manually approving transactions between accounts (ManualApprovalTransferManager.sol)

View Source: [contracts/modules/TransferManager/MATM/ManualApprovalTransferManager.sol](../../contracts/modules/TransferManager/MATM/ManualApprovalTransferManager.sol)

**↗ Extends: [ManualApprovalTransferManagerStorage](ManualApprovalTransferManagerStorage.md), [TransferManager](TransferManager.md)**

**ManualApprovalTransferManager**

**Events**

```js
event AddManualApproval(address indexed _from, address indexed _to, uint256  _allowance, uint256  _expiryTime, bytes32  _description, address indexed _addedBy);
event ModifyManualApproval(address indexed _from, address indexed _to, uint256  _expiryTime, uint256  _allowance, bytes32  _description, address indexed _edittedBy);
event RevokeManualApproval(address indexed _from, address indexed _to, address indexed _addedBy);
```

## Functions

- [(address _securityToken, address _polyToken)](#)
- [getInitFunction()](#getinitfunction)
- [executeTransfer(address _from, address _to, uint256 _amount, bytes )](#executetransfer)
- [verifyTransfer(address _from, address _to, uint256 _amount, bytes )](#verifytransfer)
- [_verifyTransfer(address _from, address _to, uint256 _amount)](#_verifytransfer)
- [addManualApproval(address _from, address _to, uint256 _allowance, uint256 _expiryTime, bytes32 _description)](#addmanualapproval)
- [_addManualApproval(address _from, address _to, uint256 _allowance, uint256 _expiryTime, bytes32 _description)](#_addmanualapproval)
- [addManualApprovalMulti(address[] _from, address[] _to, uint256[] _allowances, uint256[] _expiryTimes, bytes32[] _descriptions)](#addmanualapprovalmulti)
- [modifyManualApproval(address _from, address _to, uint256 _expiryTime, uint256 _changeInAllowance, bytes32 _description, bool _increase)](#modifymanualapproval)
- [_modifyManualApproval(address _from, address _to, uint256 _expiryTime, uint256 _changeInAllowance, bytes32 _description, bool _increase)](#_modifymanualapproval)
- [modifyManualApprovalMulti(address[] _from, address[] _to, uint256[] _expiryTimes, uint256[] _changeInAllowance, bytes32[] _descriptions, bool[] _increase)](#modifymanualapprovalmulti)
- [revokeManualApproval(address _from, address _to)](#revokemanualapproval)
- [_revokeManualApproval(address _from, address _to)](#_revokemanualapproval)
- [revokeManualApprovalMulti(address[] _from, address[] _to)](#revokemanualapprovalmulti)
- [_checkInputLengthArray(address[] _from, address[] _to, uint256[] _expiryTimes, uint256[] _allowances, bytes32[] _descriptions)](#_checkinputlengtharray)
- [getActiveApprovalsToUser(address _user)](#getactiveapprovalstouser)
- [getApprovalDetails(address _from, address _to)](#getapprovaldetails)
- [getTotalApprovalsLength()](#gettotalapprovalslength)
- [getAllApprovals()](#getallapprovals)
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

Used to verify the transfer transaction and allow a manually approved transqaction to bypass other restrictions

```js
function executeTransfer(address _from, address _to, uint256 _amount, bytes ) external nonpayable onlySecurityToken 
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

Used to verify the transfer transaction and allow a manually approved transqaction to bypass other restrictions

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

### addManualApproval

Adds a pair of addresses to manual approvals

```js
function addManualApproval(address _from, address _to, uint256 _allowance, uint256 _expiryTime, bytes32 _description) external nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address | is the address from which transfers are approved | 
| _to | address | is the address to which transfers are approved | 
| _allowance | uint256 | is the approved amount of tokens | 
| _expiryTime | uint256 | is the time until which the transfer is allowed | 
| _description | bytes32 | Description about the manual approval | 

### _addManualApproval

```js
function _addManualApproval(address _from, address _to, uint256 _allowance, uint256 _expiryTime, bytes32 _description) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address |  | 
| _to | address |  | 
| _allowance | uint256 |  | 
| _expiryTime | uint256 |  | 
| _description | bytes32 |  | 

### addManualApprovalMulti

Adds mutiple manual approvals in batch

```js
function addManualApprovalMulti(address[] _from, address[] _to, uint256[] _allowances, uint256[] _expiryTimes, bytes32[] _descriptions) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address[] | is the address array from which transfers are approved | 
| _to | address[] | is the address array to which transfers are approved | 
| _allowances | uint256[] | is the array of approved amounts | 
| _expiryTimes | uint256[] | is the array of the times until which eath transfer is allowed | 
| _descriptions | bytes32[] | is the description array for these manual approvals | 

### modifyManualApproval

Modify the existing manual approvals

```js
function modifyManualApproval(address _from, address _to, uint256 _expiryTime, uint256 _changeInAllowance, bytes32 _description, bool _increase) external nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address | is the address from which transfers are approved | 
| _to | address | is the address to which transfers are approved | 
| _expiryTime | uint256 | is the time until which the transfer is allowed | 
| _changeInAllowance | uint256 | is the change in allowance | 
| _description | bytes32 | Description about the manual approval | 
| _increase | bool | tells whether the allowances will be increased (true) or decreased (false).
or any value when there is no change in allowances | 

### _modifyManualApproval

```js
function _modifyManualApproval(address _from, address _to, uint256 _expiryTime, uint256 _changeInAllowance, bytes32 _description, bool _increase) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address |  | 
| _to | address |  | 
| _expiryTime | uint256 |  | 
| _changeInAllowance | uint256 |  | 
| _description | bytes32 |  | 
| _increase | bool |  | 

### modifyManualApprovalMulti

Adds mutiple manual approvals in batch

```js
function modifyManualApprovalMulti(address[] _from, address[] _to, uint256[] _expiryTimes, uint256[] _changeInAllowance, bytes32[] _descriptions, bool[] _increase) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address[] | is the address array from which transfers are approved | 
| _to | address[] | is the address array to which transfers are approved | 
| _expiryTimes | uint256[] | is the array of the times until which eath transfer is allowed | 
| _changeInAllowance | uint256[] | is the array of change in allowances | 
| _descriptions | bytes32[] | is the description array for these manual approvals | 
| _increase | bool[] | Array of bools that tells whether the allowances will be increased (true) or decreased (false).
or any value when there is no change in allowances | 

### revokeManualApproval

Removes a pairs of addresses from manual approvals

```js
function revokeManualApproval(address _from, address _to) external nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address | is the address from which transfers are approved | 
| _to | address | is the address to which transfers are approved | 

### _revokeManualApproval

```js
function _revokeManualApproval(address _from, address _to) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address |  | 
| _to | address |  | 

### revokeManualApprovalMulti

Removes mutiple pairs of addresses from manual approvals

```js
function revokeManualApprovalMulti(address[] _from, address[] _to) external nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address[] | is the address array from which transfers are approved | 
| _to | address[] | is the address array to which transfers are approved | 

### _checkInputLengthArray

```js
function _checkInputLengthArray(address[] _from, address[] _to, uint256[] _expiryTimes, uint256[] _allowances, bytes32[] _descriptions) internal pure
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address[] |  | 
| _to | address[] |  | 
| _expiryTimes | uint256[] |  | 
| _allowances | uint256[] |  | 
| _descriptions | bytes32[] |  | 

### getActiveApprovalsToUser

Returns the all active approvals corresponds to an address

```js
function getActiveApprovalsToUser(address _user) external view
returns(address[], address[], uint256[], uint256[], bytes32[])
```

**Returns**

address[] addresses from

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _user | address | Address of the holder corresponds to whom list of manual approvals
need to return | 

### getApprovalDetails

Get the details of the approval corresponds to _from & _to addresses

```js
function getApprovalDetails(address _from, address _to) external view
returns(uint256, uint256, bytes32)
```

**Returns**

uint256 expiryTime of the approval

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address | Address of the sender | 
| _to | address | Address of the receiver | 

### getTotalApprovalsLength

Returns the current number of active approvals

```js
function getTotalApprovalsLength() external view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getAllApprovals

Get the details of all approvals

```js
function getAllApprovals() external view
returns(address[], address[], uint256[], uint256[], bytes32[])
```

**Returns**

address[] addresses from

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getPermissions

⤾ overrides [IModule.getPermissions](IModule.md#getpermissions)

Returns the permissions flag that are associated with ManualApproval transfer manager

```js
function getPermissions() public view
returns(bytes32[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

