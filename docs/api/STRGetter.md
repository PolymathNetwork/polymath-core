---
id: version-3.0.0-STRGetter
title: STRGetter
original_id: STRGetter
---

# STRGetter.sol

View Source: [contracts/STRGetter.sol](../../contracts/STRGetter.sol)

**↗ Extends: [EternalStorage](EternalStorage.md)**
**↘ Derived Contracts: [MockSTRGetter](MockSTRGetter.md)**

**STRGetter**

## Contract Members
**Constants & Variables**

```js
bytes32 internal constant STLAUNCHFEE;
bytes32 internal constant TICKERREGFEE;
bytes32 internal constant EXPIRYLIMIT;
bytes32 internal constant IS_FEE_IN_POLY;

```

## Functions

- [getTickersByOwner(address _owner)](#gettickersbyowner)
- [_ownerInTicker(bytes32 _ticker)](#_ownerinticker)
- [getTokensByOwner(address _owner)](#gettokensbyowner)
- [getTokens()](#gettokens)
- [_getTokens(bool _allTokens, address _owner)](#_gettokens)
- [_ownerInToken(bytes32 _ticker, bool _allTokens, address _owner)](#_ownerintoken)
- [getTokensByDelegate(address _delegate)](#gettokensbydelegate)
- [_delegateInToken(address _token, address _delegate)](#_delegateintoken)
- [getTickerDetails(string _ticker)](#gettickerdetails)
- [getSecurityTokenAddress(string _ticker)](#getsecuritytokenaddress)
- [getSecurityTokenData(address _securityToken)](#getsecuritytokendata)
- [getSTFactoryAddress()](#getstfactoryaddress)
- [getSTFactoryAddressOfVersion(uint256 _protocolVersion)](#getstfactoryaddressofversion)
- [getLatestProtocolVersion()](#getlatestprotocolversion)
- [getIsFeeInPoly()](#getisfeeinpoly)
- [getExpiryLimit()](#getexpirylimit)
- [getTickerStatus(string _ticker)](#gettickerstatus)
- [getTickerOwner(string _ticker)](#gettickerowner)

### getTickersByOwner

Returns the list of tickers owned by the selected address

```js
function getTickersByOwner(address _owner) external view
returns(bytes32[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _owner | address | is the address which owns the list of tickers | 

### _ownerInTicker

```js
function _ownerInTicker(bytes32 _ticker) internal view
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _ticker | bytes32 |  | 

### getTokensByOwner

Returns the list of tokens owned by the selected address

```js
function getTokensByOwner(address _owner) external view
returns(address[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _owner | address | is the address which owns the list of tickers | 

### getTokens

Returns the list of all tokens

```js
function getTokens() public view
returns(address[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### _getTokens

Returns the list of tokens owned by the selected address

```js
function _getTokens(bool _allTokens, address _owner) internal view
returns(address[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _allTokens | bool | if _allTokens is true returns all tokens despite on the second parameter | 
| _owner | address | is the address which owns the list of tickers | 

### _ownerInToken

```js
function _ownerInToken(bytes32 _ticker, bool _allTokens, address _owner) internal view
returns(address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _ticker | bytes32 |  | 
| _allTokens | bool |  | 
| _owner | address |  | 

### getTokensByDelegate

Returns the list of tokens to which the delegate has some access

```js
function getTokensByDelegate(address _delegate) external view
returns(address[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _delegate | address | is the address for the delegate | 

### _delegateInToken

```js
function _delegateInToken(address _token, address _delegate) internal view
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _token | address |  | 
| _delegate | address |  | 

### getTickerDetails

Returns the owner and timestamp for a given ticker

```js
function getTickerDetails(string _ticker) external view
returns(address, uint256, uint256, string, bool)
```

**Returns**

address

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _ticker | string | is the ticker symbol | 

### getSecurityTokenAddress

Returns the security token address by ticker symbol

```js
function getSecurityTokenAddress(string _ticker) external view
returns(address)
```

**Returns**

address

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _ticker | string | is the ticker of the security token | 

### getSecurityTokenData

Returns the security token data by address

```js
function getSecurityTokenData(address _securityToken) external view
returns(string, address, string, uint256)
```

**Returns**

string is the ticker of the security Token.

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _securityToken | address | is the address of the security token. | 

### getSTFactoryAddress

Returns the current STFactory Address

```js
function getSTFactoryAddress() public view
returns(address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getSTFactoryAddressOfVersion

Returns the STFactory Address of a particular version

```js
function getSTFactoryAddressOfVersion(uint256 _protocolVersion) public view
returns(address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _protocolVersion | uint256 | Packed protocol version | 

### getLatestProtocolVersion

Gets Protocol version

```js
function getLatestProtocolVersion() public view
returns(uint8[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getIsFeeInPoly

Gets the fee currency

```js
function getIsFeeInPoly() public view
returns(bool)
```

**Returns**

true = poly, false = usd

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getExpiryLimit

Gets the expiry limit

```js
function getExpiryLimit() public view
returns(uint256)
```

**Returns**

Expiry limit

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getTickerStatus

Gets the status of the ticker

```js
function getTickerStatus(string _ticker) public view
returns(bool)
```

**Returns**

bool

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _ticker | string | Ticker whose status need to determine | 

### getTickerOwner

Gets the owner of the ticker

```js
function getTickerOwner(string _ticker) public view
returns(address)
```

**Returns**

address Address of the owner

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _ticker | string | Ticker whose owner need to determine | 

