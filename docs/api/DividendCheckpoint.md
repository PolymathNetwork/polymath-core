---
id: version-3.0.0-DividendCheckpoint
title: DividendCheckpoint
original_id: DividendCheckpoint
---

# Checkpoint module for issuing ether dividends (DividendCheckpoint.sol)

View Source: [contracts/modules/Checkpoint/DividendCheckpoint.sol](../../contracts/modules/Checkpoint/DividendCheckpoint.sol)

**↗ Extends: [DividendCheckpointStorage](DividendCheckpointStorage.md), [ICheckpoint](ICheckpoint.md), [Module](Module.md), [Pausable](Pausable.md)**
**↘ Derived Contracts: [ERC20DividendCheckpoint](ERC20DividendCheckpoint.md), [EtherDividendCheckpoint](EtherDividendCheckpoint.md)**

**DividendCheckpoint**

abstract contract

**Events**

```js
event SetDefaultExcludedAddresses(address[]  _excluded, uint256  _timestamp);
event SetWithholding(address[]  _investors, uint256[]  _withholding, uint256  _timestamp);
event SetWithholdingFixed(address[]  _investors, uint256  _withholding, uint256  _timestamp);
event SetWallet(address indexed _oldWallet, address indexed _newWallet, uint256  _timestamp);
event UpdateDividendDates(uint256 indexed _dividendIndex, uint256  _maturity, uint256  _expiry);
```

## Modifiers

- [validDividendIndex](#validdividendindex)

### validDividendIndex

```js
modifier validDividendIndex(uint256 _dividendIndex) internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _dividendIndex | uint256 |  | 

## Functions

- [_validDividendIndex(uint256 _dividendIndex)](#_validdividendindex)
- [pause()](#pause)
- [unpause()](#unpause)
- [reclaimERC20(address _tokenContract)](#reclaimerc20)
- [reclaimETH()](#reclaimeth)
- [configure(address _wallet)](#configure)
- [getInitFunction()](#getinitfunction)
- [changeWallet(address _wallet)](#changewallet)
- [_setWallet(address _wallet)](#_setwallet)
- [getDefaultExcluded()](#getdefaultexcluded)
- [createCheckpoint()](#createcheckpoint)
- [setDefaultExcluded(address[] _excluded)](#setdefaultexcluded)
- [setWithholding(address[] _investors, uint256[] _withholding)](#setwithholding)
- [setWithholdingFixed(address[] _investors, uint256 _withholding)](#setwithholdingfixed)
- [pushDividendPaymentToAddresses(uint256 _dividendIndex, address[] _payees)](#pushdividendpaymenttoaddresses)
- [pushDividendPayment(uint256 _dividendIndex, uint256 _start, uint256 _iterations)](#pushdividendpayment)
- [pullDividendPayment(uint256 _dividendIndex)](#pulldividendpayment)
- [_payDividend(address _payee, struct DividendCheckpointStorage.Dividend _dividend, uint256 _dividendIndex)](#_paydividend)
- [reclaimDividend(uint256 _dividendIndex)](#reclaimdividend)
- [calculateDividend(uint256 _dividendIndex, address _payee)](#calculatedividend)
- [getDividendIndex(uint256 _checkpointId)](#getdividendindex)
- [withdrawWithholding(uint256 _dividendIndex)](#withdrawwithholding)
- [updateDividendDates(uint256 _dividendIndex, uint256 _maturity, uint256 _expiry)](#updatedividenddates)
- [getDividendsData()](#getdividendsdata)
- [getDividendData(uint256 _dividendIndex)](#getdividenddata)
- [getDividendProgress(uint256 _dividendIndex)](#getdividendprogress)
- [getCheckpointData(uint256 _checkpointId)](#getcheckpointdata)
- [isExcluded(address _investor, uint256 _dividendIndex)](#isexcluded)
- [isClaimed(address _investor, uint256 _dividendIndex)](#isclaimed)
- [getPermissions()](#getpermissions)

### _validDividendIndex

```js
function _validDividendIndex(uint256 _dividendIndex) internal view
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _dividendIndex | uint256 |  | 

### pause

Pause (overridden function)

```js
function pause() public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### unpause

Unpause (overridden function)

```js
function unpause() public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### reclaimERC20

Reclaims ERC20Basic compatible tokens

```js
function reclaimERC20(address _tokenContract) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _tokenContract | address | The address of the token contract | 

### reclaimETH

Reclaims ETH

```js
function reclaimETH() external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### configure

Function used to intialize the contract variables

```js
function configure(address _wallet) public nonpayable onlyFactory 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _wallet | address | Ethereum account address to receive reclaimed dividends and tax | 

### getInitFunction

⤾ overrides [IModule.getInitFunction](IModule.md#getinitfunction)

Init function i.e generalise function to maintain the structure of the module contract

```js
function getInitFunction() public pure
returns(bytes4)
```

**Returns**

bytes4

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### changeWallet

Function used to change wallet address

```js
function changeWallet(address _wallet) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _wallet | address | Ethereum account address to receive reclaimed dividends and tax | 

### _setWallet

```js
function _setWallet(address _wallet) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _wallet | address |  | 

### getDefaultExcluded

Return the default excluded addresses

```js
function getDefaultExcluded() external view
returns(address[])
```

**Returns**

List of excluded addresses

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### createCheckpoint

Creates a checkpoint on the security token

```js
function createCheckpoint() public nonpayable withPerm 
returns(uint256)
```

**Returns**

Checkpoint ID

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### setDefaultExcluded

Function to clear and set list of excluded addresses used for future dividends

```js
function setDefaultExcluded(address[] _excluded) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _excluded | address[] | Addresses of investors | 

### setWithholding

Function to set withholding tax rates for investors

```js
function setWithholding(address[] _investors, uint256[] _withholding) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investors | address[] | Addresses of investors | 
| _withholding | uint256[] | Withholding tax for individual investors (multiplied by 10**16) | 

### setWithholdingFixed

Function to set withholding tax rates for investors

```js
function setWithholdingFixed(address[] _investors, uint256 _withholding) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investors | address[] | Addresses of investor | 
| _withholding | uint256 | Withholding tax for all investors (multiplied by 10**16) | 

### pushDividendPaymentToAddresses

Issuer can push dividends to provided addresses

```js
function pushDividendPaymentToAddresses(uint256 _dividendIndex, address[] _payees) public nonpayable withPerm validDividendIndex 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _dividendIndex | uint256 | Dividend to push | 
| _payees | address[] | Addresses to which to push the dividend | 

### pushDividendPayment

Issuer can push dividends using the investor list from the security token

```js
function pushDividendPayment(uint256 _dividendIndex, uint256 _start, uint256 _iterations) public nonpayable withPerm validDividendIndex 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _dividendIndex | uint256 | Dividend to push | 
| _start | uint256 | Index in investor list at which to start pushing dividends | 
| _iterations | uint256 | Number of addresses to push dividends for | 

### pullDividendPayment

Investors can pull their own dividends

```js
function pullDividendPayment(uint256 _dividendIndex) public nonpayable validDividendIndex whenNotPaused 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _dividendIndex | uint256 | Dividend to pull | 

### _payDividend

⤿ Overridden Implementation(s): [ERC20DividendCheckpoint._payDividend](ERC20DividendCheckpoint.md#_paydividend),[EtherDividendCheckpoint._payDividend](EtherDividendCheckpoint.md#_paydividend)

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

⤿ Overridden Implementation(s): [ERC20DividendCheckpoint.reclaimDividend](ERC20DividendCheckpoint.md#reclaimdividend),[EtherDividendCheckpoint.reclaimDividend](EtherDividendCheckpoint.md#reclaimdividend)

Issuer can reclaim remaining unclaimed dividend amounts, for expired dividends

```js
function reclaimDividend(uint256 _dividendIndex) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _dividendIndex | uint256 | Dividend to reclaim | 

### calculateDividend

Calculate amount of dividends claimable

```js
function calculateDividend(uint256 _dividendIndex, address _payee) public view
returns(uint256, uint256)
```

**Returns**

claim, withheld amounts

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _dividendIndex | uint256 | Dividend to calculate | 
| _payee | address | Affected investor address | 

### getDividendIndex

Get the index according to the checkpoint id

```js
function getDividendIndex(uint256 _checkpointId) public view
returns(uint256[])
```

**Returns**

uint256[]

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _checkpointId | uint256 | Checkpoint id to query | 

### withdrawWithholding

⤿ Overridden Implementation(s): [ERC20DividendCheckpoint.withdrawWithholding](ERC20DividendCheckpoint.md#withdrawwithholding),[EtherDividendCheckpoint.withdrawWithholding](EtherDividendCheckpoint.md#withdrawwithholding)

Allows issuer to withdraw withheld tax

```js
function withdrawWithholding(uint256 _dividendIndex) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _dividendIndex | uint256 | Dividend to withdraw from | 

### updateDividendDates

Allows issuer to change maturity / expiry dates for dividends

```js
function updateDividendDates(uint256 _dividendIndex, uint256 _maturity, uint256 _expiry) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _dividendIndex | uint256 | Dividend to withdraw from | 
| _maturity | uint256 | updated maturity date | 
| _expiry | uint256 | updated expiry date | 

### getDividendsData

Get static dividend data

```js
function getDividendsData() external view
returns(createds uint256[], maturitys uint256[], expirys uint256[], amounts uint256[], claimedAmounts uint256[], names bytes32[])
```

**Returns**

uint256[] timestamp of dividends creation

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getDividendData

Get static dividend data

```js
function getDividendData(uint256 _dividendIndex) public view
returns(created uint256, maturity uint256, expiry uint256, amount uint256, claimedAmount uint256, name bytes32)
```

**Returns**

uint256 timestamp of dividend creation

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _dividendIndex | uint256 |  | 

### getDividendProgress

Retrieves list of investors, their claim status and whether they are excluded

```js
function getDividendProgress(uint256 _dividendIndex) external view
returns(investors address[], resultClaimed bool[], resultExcluded bool[], resultWithheld uint256[], resultAmount uint256[], resultBalance uint256[])
```

**Returns**

address[] list of investors

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _dividendIndex | uint256 | Dividend to withdraw from | 

### getCheckpointData

Retrieves list of investors, their balances, and their current withholding tax percentage

```js
function getCheckpointData(uint256 _checkpointId) external view
returns(investors address[], balances uint256[], withholdings uint256[])
```

**Returns**

address[] list of investors

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _checkpointId | uint256 | Checkpoint Id to query for | 

### isExcluded

Checks whether an address is excluded from claiming a dividend

```js
function isExcluded(address _investor, uint256 _dividendIndex) external view
returns(bool)
```

**Returns**

bool whether the address is excluded

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investor | address |  | 
| _dividendIndex | uint256 | Dividend to withdraw from | 

### isClaimed

Checks whether an address has claimed a dividend

```js
function isClaimed(address _investor, uint256 _dividendIndex) external view
returns(bool)
```

**Returns**

bool whether the address has claimed

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investor | address |  | 
| _dividendIndex | uint256 | Dividend to withdraw from | 

### getPermissions

⤾ overrides [IModule.getPermissions](IModule.md#getpermissions)

Return the permissions flag that are associated with this module

```js
function getPermissions() public view
returns(bytes32[])
```

**Returns**

bytes32 array

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

