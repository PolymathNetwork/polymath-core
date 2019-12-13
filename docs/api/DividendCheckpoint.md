---
id: version-3.0.0-DividendCheckpoint
title: DividendCheckpoint
original_id: DividendCheckpoint
---

# Checkpoint module for issuing ether dividends (DividendCheckpoint.sol)

View Source: [contracts/modules/Checkpoint/Dividend/DividendCheckpoint.sol](../../contracts/modules/Checkpoint/Dividend/DividendCheckpoint.sol)

**↗ Extends: [DividendCheckpointStorage](DividendCheckpointStorage.md), [ICheckpoint](ICheckpoint.md), [Module](Module.md)**
**↘ Derived Contracts: [ERC20DividendCheckpoint](ERC20DividendCheckpoint.md), [EtherDividendCheckpoint](EtherDividendCheckpoint.md)**

**DividendCheckpoint**

abstract contract

## Contract Members
**Constants & Variables**

```js
uint256 internal constant e18;

```

**Events**

```js
event SetDefaultExcludedAddresses(address[]  _excluded);
event SetWithholding(address[]  _investors, uint256[]  _withholding);
event SetWithholdingFixed(address[]  _investors, uint256  _withholding);
event SetWallet(address indexed _oldWallet, address indexed _newWallet);
event UpdateDividendDates(uint256 indexed _dividendIndex, uint256  _maturity, uint256  _expiry);
```

## Functions

- [_validDividendIndex(uint256 _dividendIndex)](#_validdividendindex)
- [configure(address payable _wallet)](#configure)
- [getInitFunction()](#getinitfunction)
- [changeWallet(address payable _wallet)](#changewallet)
- [_setWallet(address payable _wallet)](#_setwallet)
- [getDefaultExcluded()](#getdefaultexcluded)
- [getTreasuryWallet()](#gettreasurywallet)
- [createCheckpoint()](#createcheckpoint)
- [setDefaultExcluded(address[] _excluded)](#setdefaultexcluded)
- [setWithholding(address[] _investors, uint256[] _withholding)](#setwithholding)
- [setWithholdingFixed(address[] _investors, uint256 _withholding)](#setwithholdingfixed)
- [pushDividendPaymentToAddresses(uint256 _dividendIndex, address payable[] _payees)](#pushdividendpaymenttoaddresses)
- [pushDividendPayment(uint256 _dividendIndex, uint256 _start, uint256 _end)](#pushdividendpayment)
- [pullDividendPayment(uint256 _dividendIndex)](#pulldividendpayment)
- [_payDividend(address payable _payee, struct DividendCheckpointStorage.Dividend _dividend, uint256 _dividendIndex)](#_paydividend)
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

### configure

Function used to intialize the contract variables

```js
function configure(address payable _wallet) public nonpayable onlyFactory 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _wallet | address payable | Ethereum account address to receive reclaimed dividends and tax | 

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
function changeWallet(address payable _wallet) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _wallet | address payable | Ethereum account address to receive reclaimed dividends and tax | 

### _setWallet

```js
function _setWallet(address payable _wallet) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _wallet | address payable |  | 

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

### getTreasuryWallet

Returns the treasury wallet address

```js
function getTreasuryWallet() public view
returns(address payable)
```

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
function pushDividendPaymentToAddresses(uint256 _dividendIndex, address payable[] _payees) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _dividendIndex | uint256 | Dividend to push | 
| _payees | address payable[] | Addresses to which to push the dividend | 

### pushDividendPayment

Issuer can push dividends using the investor list from the security token

```js
function pushDividendPayment(uint256 _dividendIndex, uint256 _start, uint256 _end) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _dividendIndex | uint256 | Dividend to push | 
| _start | uint256 | Index in investor list at which to start pushing dividends | 
| _end | uint256 | Index in investor list at which to stop pushing dividends | 

### pullDividendPayment

Investors can pull their own dividends

```js
function pullDividendPayment(uint256 _dividendIndex) public nonpayable whenNotPaused 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _dividendIndex | uint256 | Dividend to pull | 

### _payDividend

⤿ Overridden Implementation(s): [ERC20DividendCheckpoint._payDividend](ERC20DividendCheckpoint.md#_paydividend),[EtherDividendCheckpoint._payDividend](EtherDividendCheckpoint.md#_paydividend)

Internal function for paying dividends

```js
function _payDividend(address payable _payee, struct DividendCheckpointStorage.Dividend _dividend, uint256 _dividendIndex) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _payee | address payable | Address of investor | 
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
function updateDividendDates(uint256 _dividendIndex, uint256 _maturity, uint256 _expiry) external nonpayable withPerm 
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
| _investor | address | Investor address being checked | 
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
| _investor | address | Investor address being checked | 
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

