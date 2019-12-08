---
id: version-3.0.0-EtherDividendCheckpoint
title: EtherDividendCheckpoint
original_id: EtherDividendCheckpoint
---

# Checkpoint module for issuing ether dividends (EtherDividendCheckpoint.sol)

View Source: [contracts/modules/Checkpoint/EtherDividendCheckpoint.sol](../../contracts/modules/Checkpoint/EtherDividendCheckpoint.sol)

**↗ Extends: [DividendCheckpoint](DividendCheckpoint.md)**

**EtherDividendCheckpoint**

## Constructor

Constructor

```js
constructor(address _securityToken, address _polyAddress) public
```

**Arguments**

**Events**

```js
event EtherDividendDeposited(address indexed _depositor, uint256  _checkpointId, uint256  _created, uint256  _maturity, uint256  _expiry, uint256  _amount, uint256  _totalSupply, uint256 indexed _dividendIndex, bytes32 indexed _name);
event EtherDividendClaimed(address indexed _payee, uint256 indexed _dividendIndex, uint256  _amount, uint256  _withheld);
event EtherDividendReclaimed(address indexed _claimer, uint256 indexed _dividendIndex, uint256  _claimedAmount);
event EtherDividendClaimFailed(address indexed _payee, uint256 indexed _dividendIndex, uint256  _amount, uint256  _withheld);
event EtherDividendWithholdingWithdrawn(address indexed _claimer, uint256 indexed _dividendIndex, uint256  _withheldAmount);
```

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _securityToken | address | Address of the security token | 
| _polyAddress | address | Address of the polytoken | 

## Functions

- [createDividend(uint256 _maturity, uint256 _expiry, bytes32 _name)](#createdividend)
- [createDividendWithCheckpoint(uint256 _maturity, uint256 _expiry, uint256 _checkpointId, bytes32 _name)](#createdividendwithcheckpoint)
- [createDividendWithExclusions(uint256 _maturity, uint256 _expiry, address[] _excluded, bytes32 _name)](#createdividendwithexclusions)
- [createDividendWithCheckpointAndExclusions(uint256 _maturity, uint256 _expiry, uint256 _checkpointId, address[] _excluded, bytes32 _name)](#createdividendwithcheckpointandexclusions)
- [_createDividendWithCheckpointAndExclusions(uint256 _maturity, uint256 _expiry, uint256 _checkpointId, address[] _excluded, bytes32 _name)](#_createdividendwithcheckpointandexclusions)
- [_payDividend(address _payee, struct DividendCheckpointStorage.Dividend _dividend, uint256 _dividendIndex)](#_paydividend)
- [reclaimDividend(uint256 _dividendIndex)](#reclaimdividend)
- [withdrawWithholding(uint256 _dividendIndex)](#withdrawwithholding)

### createDividend

Creates a dividend and checkpoint for the dividend, using global list of excluded addresses

```js
function createDividend(uint256 _maturity, uint256 _expiry, bytes32 _name) external payable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _maturity | uint256 | Time from which dividend can be paid | 
| _expiry | uint256 | Time until dividend can no longer be paid, and can be reclaimed by issuer | 
| _name | bytes32 | Name/title for identification | 

### createDividendWithCheckpoint

Creates a dividend with a provided checkpoint, using global list of excluded addresses

```js
function createDividendWithCheckpoint(uint256 _maturity, uint256 _expiry, uint256 _checkpointId, bytes32 _name) external payable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _maturity | uint256 | Time from which dividend can be paid | 
| _expiry | uint256 | Time until dividend can no longer be paid, and can be reclaimed by issuer | 
| _checkpointId | uint256 | Id of the checkpoint from which to issue dividend | 
| _name | bytes32 | Name/title for identification | 

### createDividendWithExclusions

Creates a dividend and checkpoint for the dividend, specifying explicit excluded addresses

```js
function createDividendWithExclusions(uint256 _maturity, uint256 _expiry, address[] _excluded, bytes32 _name) public payable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _maturity | uint256 | Time from which dividend can be paid | 
| _expiry | uint256 | Time until dividend can no longer be paid, and can be reclaimed by issuer | 
| _excluded | address[] | List of addresses to exclude | 
| _name | bytes32 | Name/title for identification | 

### createDividendWithCheckpointAndExclusions

Creates a dividend with a provided checkpoint, specifying explicit excluded addresses

```js
function createDividendWithCheckpointAndExclusions(uint256 _maturity, uint256 _expiry, uint256 _checkpointId, address[] _excluded, bytes32 _name) public payable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _maturity | uint256 | Time from which dividend can be paid | 
| _expiry | uint256 | Time until dividend can no longer be paid, and can be reclaimed by issuer | 
| _checkpointId | uint256 | Id of the checkpoint from which to issue dividend | 
| _excluded | address[] | List of addresses to exclude | 
| _name | bytes32 | Name/title for identification | 

### _createDividendWithCheckpointAndExclusions

Creates a dividend with a provided checkpoint, specifying explicit excluded addresses

```js
function _createDividendWithCheckpointAndExclusions(uint256 _maturity, uint256 _expiry, uint256 _checkpointId, address[] _excluded, bytes32 _name) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _maturity | uint256 | Time from which dividend can be paid | 
| _expiry | uint256 | Time until dividend can no longer be paid, and can be reclaimed by issuer | 
| _checkpointId | uint256 | Id of the checkpoint from which to issue dividend | 
| _excluded | address[] | List of addresses to exclude | 
| _name | bytes32 | Name/title for identification | 

### _payDividend

⤾ overrides [DividendCheckpoint._payDividend](DividendCheckpoint.md#_paydividend)

Internal function for paying dividends

```js
function _payDividend(address _payee, struct DividendCheckpointStorage.Dividend _dividend, uint256 _dividendIndex) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _payee | address | address of investor | 
| _dividend | struct DividendCheckpointStorage.Dividend | storage with previously issued dividends | 
| _dividendIndex | uint256 | Dividend to pay | 

### reclaimDividend

⤾ overrides [DividendCheckpoint.reclaimDividend](DividendCheckpoint.md#reclaimdividend)

Issuer can reclaim remaining unclaimed dividend amounts, for expired dividends

```js
function reclaimDividend(uint256 _dividendIndex) external nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _dividendIndex | uint256 | Dividend to reclaim | 

### withdrawWithholding

⤾ overrides [DividendCheckpoint.withdrawWithholding](DividendCheckpoint.md#withdrawwithholding)

Allows issuer to withdraw withheld tax

```js
function withdrawWithholding(uint256 _dividendIndex) external nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _dividendIndex | uint256 | Dividend to withdraw from | 

