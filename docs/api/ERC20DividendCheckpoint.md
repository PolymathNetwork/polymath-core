---
id: version-3.0.0-ERC20DividendCheckpoint
title: ERC20DividendCheckpoint
original_id: ERC20DividendCheckpoint
---

# Checkpoint module for issuing ERC20 dividends (ERC20DividendCheckpoint.sol)

View Source: [contracts/modules/Checkpoint/ERC20DividendCheckpoint.sol](../../contracts/modules/Checkpoint/ERC20DividendCheckpoint.sol)

**↗ Extends: [ERC20DividendCheckpointStorage](ERC20DividendCheckpointStorage.md), [DividendCheckpoint](DividendCheckpoint.md)**

**ERC20DividendCheckpoint**

## Constructor

Constructor

```js
constructor(address _securityToken, address _polyAddress) public
```

**Arguments**

**Events**

```js
event ERC20DividendDeposited(address indexed _depositor, uint256  _checkpointId, uint256  _created, uint256  _maturity, uint256  _expiry, address indexed _token, uint256  _amount, uint256  _totalSupply, uint256  _dividendIndex, bytes32 indexed _name);
event ERC20DividendClaimed(address indexed _payee, uint256 indexed _dividendIndex, address indexed _token, uint256  _amount, uint256  _withheld);
event ERC20DividendReclaimed(address indexed _claimer, uint256 indexed _dividendIndex, address indexed _token, uint256  _claimedAmount);
event ERC20DividendWithholdingWithdrawn(address indexed _claimer, uint256 indexed _dividendIndex, address indexed _token, uint256  _withheldAmount);
```

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _securityToken | address | Address of the security token | 
| _polyAddress | address | Address of the polytoken | 

## Functions

- [createDividend(uint256 _maturity, uint256 _expiry, address _token, uint256 _amount, bytes32 _name)](#createdividend)
- [createDividendWithCheckpoint(uint256 _maturity, uint256 _expiry, address _token, uint256 _amount, uint256 _checkpointId, bytes32 _name)](#createdividendwithcheckpoint)
- [createDividendWithExclusions(uint256 _maturity, uint256 _expiry, address _token, uint256 _amount, address[] _excluded, bytes32 _name)](#createdividendwithexclusions)
- [createDividendWithCheckpointAndExclusions(uint256 _maturity, uint256 _expiry, address _token, uint256 _amount, uint256 _checkpointId, address[] _excluded, bytes32 _name)](#createdividendwithcheckpointandexclusions)
- [_createDividendWithCheckpointAndExclusions(uint256 _maturity, uint256 _expiry, address _token, uint256 _amount, uint256 _checkpointId, address[] _excluded, bytes32 _name)](#_createdividendwithcheckpointandexclusions)
- [_emitERC20DividendDepositedEvent(uint256 _checkpointId, uint256 _maturity, uint256 _expiry, address _token, uint256 _amount, uint256 currentSupply, uint256 dividendIndex, bytes32 _name)](#_emiterc20dividenddepositedevent)
- [_payDividend(address _payee, struct DividendCheckpointStorage.Dividend _dividend, uint256 _dividendIndex)](#_paydividend)
- [reclaimDividend(uint256 _dividendIndex)](#reclaimdividend)
- [withdrawWithholding(uint256 _dividendIndex)](#withdrawwithholding)

### createDividend

Creates a dividend and checkpoint for the dividend

```js
function createDividend(uint256 _maturity, uint256 _expiry, address _token, uint256 _amount, bytes32 _name) external nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _maturity | uint256 | Time from which dividend can be paid | 
| _expiry | uint256 | Time until dividend can no longer be paid, and can be reclaimed by issuer | 
| _token | address | Address of ERC20 token in which dividend is to be denominated | 
| _amount | uint256 | Amount of specified token for dividend | 
| _name | bytes32 | Name/Title for identification | 

### createDividendWithCheckpoint

Creates a dividend with a provided checkpoint

```js
function createDividendWithCheckpoint(uint256 _maturity, uint256 _expiry, address _token, uint256 _amount, uint256 _checkpointId, bytes32 _name) external nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _maturity | uint256 | Time from which dividend can be paid | 
| _expiry | uint256 | Time until dividend can no longer be paid, and can be reclaimed by issuer | 
| _token | address | Address of ERC20 token in which dividend is to be denominated | 
| _amount | uint256 | Amount of specified token for dividend | 
| _checkpointId | uint256 | Checkpoint id from which to create dividends | 
| _name | bytes32 | Name/Title for identification | 

### createDividendWithExclusions

Creates a dividend and checkpoint for the dividend

```js
function createDividendWithExclusions(uint256 _maturity, uint256 _expiry, address _token, uint256 _amount, address[] _excluded, bytes32 _name) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _maturity | uint256 | Time from which dividend can be paid | 
| _expiry | uint256 | Time until dividend can no longer be paid, and can be reclaimed by issuer | 
| _token | address | Address of ERC20 token in which dividend is to be denominated | 
| _amount | uint256 | Amount of specified token for dividend | 
| _excluded | address[] | List of addresses to exclude | 
| _name | bytes32 | Name/Title for identification | 

### createDividendWithCheckpointAndExclusions

Creates a dividend with a provided checkpoint

```js
function createDividendWithCheckpointAndExclusions(uint256 _maturity, uint256 _expiry, address _token, uint256 _amount, uint256 _checkpointId, address[] _excluded, bytes32 _name) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _maturity | uint256 | Time from which dividend can be paid | 
| _expiry | uint256 | Time until dividend can no longer be paid, and can be reclaimed by issuer | 
| _token | address | Address of ERC20 token in which dividend is to be denominated | 
| _amount | uint256 | Amount of specified token for dividend | 
| _checkpointId | uint256 | Checkpoint id from which to create dividends | 
| _excluded | address[] | List of addresses to exclude | 
| _name | bytes32 | Name/Title for identification | 

### _createDividendWithCheckpointAndExclusions

Creates a dividend with a provided checkpoint

```js
function _createDividendWithCheckpointAndExclusions(uint256 _maturity, uint256 _expiry, address _token, uint256 _amount, uint256 _checkpointId, address[] _excluded, bytes32 _name) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _maturity | uint256 | Time from which dividend can be paid | 
| _expiry | uint256 | Time until dividend can no longer be paid, and can be reclaimed by issuer | 
| _token | address | Address of ERC20 token in which dividend is to be denominated | 
| _amount | uint256 | Amount of specified token for dividend | 
| _checkpointId | uint256 | Checkpoint id from which to create dividends | 
| _excluded | address[] | List of addresses to exclude | 
| _name | bytes32 | Name/Title for identification | 

### _emitERC20DividendDepositedEvent

Emits the ERC20DividendDeposited event.

Seperated into a different function as a workaround for stack too deep error

```js
function _emitERC20DividendDepositedEvent(uint256 _checkpointId, uint256 _maturity, uint256 _expiry, address _token, uint256 _amount, uint256 currentSupply, uint256 dividendIndex, bytes32 _name) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _checkpointId | uint256 |  | 
| _maturity | uint256 |  | 
| _expiry | uint256 |  | 
| _token | address |  | 
| _amount | uint256 |  | 
| currentSupply | uint256 |  | 
| dividendIndex | uint256 |  | 
| _name | bytes32 |  | 

### _payDividend

⤾ overrides [DividendCheckpoint._payDividend](DividendCheckpoint.md#_paydividend)

Internal function for paying dividends

```js
function _payDividend(address _payee, struct DividendCheckpointStorage.Dividend _dividend, uint256 _dividendIndex) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _payee | address | Address of investor | 
| _dividend | struct DividendCheckpointStorage.Dividend | Storage with previously issued dividends | 
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

