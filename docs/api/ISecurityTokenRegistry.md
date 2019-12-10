---
id: version-3.0.0-ISecurityTokenRegistry
title: ISecurityTokenRegistry
original_id: ISecurityTokenRegistry
---

# Interface for the Polymath Security Token Registry contract (ISecurityTokenRegistry.sol)

View Source: [contracts/interfaces/ISecurityTokenRegistry.sol](../../contracts/interfaces/ISecurityTokenRegistry.sol)

**↘ Derived Contracts: [SecurityTokenRegistry](SecurityTokenRegistry.md)**

**ISecurityTokenRegistry**

## Functions

- [generateSecurityToken(string _name, string _ticker, string _tokenDetails, bool _divisible)](#generatesecuritytoken)
- [modifySecurityToken(string _name, string _ticker, address _owner, address _securityToken, string _tokenDetails, uint256 _deployedAt)](#modifysecuritytoken)
- [registerTicker(address _owner, string _ticker, string _tokenName)](#registerticker)
- [setProtocolVersion(address _STFactoryAddress, uint8 _major, uint8 _minor, uint8 _patch)](#setprotocolversion)
- [isSecurityToken(address _securityToken)](#issecuritytoken)
- [transferOwnership(address _newOwner)](#transferownership)
- [getSecurityTokenAddress(string _ticker)](#getsecuritytokenaddress)
- [getSecurityTokenData(address _securityToken)](#getsecuritytokendata)
- [getSTFactoryAddress()](#getstfactoryaddress)
- [getProtocolVersion()](#getprotocolversion)
- [getTickersByOwner(address _owner)](#gettickersbyowner)
- [getTokensByOwner(address _owner)](#gettokensbyowner)
- [getTokensByDelegate(address _delegate)](#gettokensbydelegate)
- [getTickerDetails(string _ticker)](#gettickerdetails)
- [modifyTicker(address _owner, string _ticker, string _tokenName, uint256 _registrationDate, uint256 _expiryDate, bool _status)](#modifyticker)
- [removeTicker(string _ticker)](#removeticker)
- [transferTickerOwnership(address _newOwner, string _ticker)](#transfertickerownership)
- [changeExpiryLimit(uint256 _newExpiry)](#changeexpirylimit)
- [changeTickerRegistrationFee(uint256 _tickerRegFee)](#changetickerregistrationfee)
- [changeSecurityLaunchFee(uint256 _stLaunchFee)](#changesecuritylaunchfee)
- [updatePolyTokenAddress(address _newAddress)](#updatepolytokenaddress)
- [getSecurityTokenLaunchFee()](#getsecuritytokenlaunchfee)
- [getTickerRegistrationFee()](#gettickerregistrationfee)
- [getExpiryLimit()](#getexpirylimit)
- [isPaused()](#ispaused)
- [owner()](#owner)

### generateSecurityToken

⤿ Overridden Implementation(s): [SecurityTokenRegistry.generateSecurityToken](SecurityTokenRegistry.md#generatesecuritytoken)

Creates a new Security Token and saves it to the registry

```js
function generateSecurityToken(string _name, string _ticker, string _tokenDetails, bool _divisible) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _name | string | Name of the token | 
| _ticker | string | Ticker ticker of the security token | 
| _tokenDetails | string | Off-chain details of the token | 
| _divisible | bool | Whether the token is divisible or not | 

### modifySecurityToken

⤿ Overridden Implementation(s): [SecurityTokenRegistry.modifySecurityToken](SecurityTokenRegistry.md#modifysecuritytoken)

Adds a new custom Security Token and saves it to the registry. (Token should follow the ISecurityToken interface)

```js
function modifySecurityToken(string _name, string _ticker, address _owner, address _securityToken, string _tokenDetails, uint256 _deployedAt) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _name | string | Name of the token | 
| _ticker | string | Ticker of the security token | 
| _owner | address | Owner of the token | 
| _securityToken | address | Address of the securityToken | 
| _tokenDetails | string | Off-chain details of the token | 
| _deployedAt | uint256 | Timestamp at which security token comes deployed on the ethereum blockchain | 

### registerTicker

⤿ Overridden Implementation(s): [SecurityTokenRegistry.registerTicker](SecurityTokenRegistry.md#registerticker)

Registers the token ticker for its particular owner

```js
function registerTicker(address _owner, string _ticker, string _tokenName) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _owner | address | Address of the owner of the token | 
| _ticker | string | Token ticker | 
| _tokenName | string | Name of the token | 

### setProtocolVersion

⤿ Overridden Implementation(s): [SecurityTokenRegistry.setProtocolVersion](SecurityTokenRegistry.md#setprotocolversion)

Changes the protocol version and the SecurityToken contract

```js
function setProtocolVersion(address _STFactoryAddress, uint8 _major, uint8 _minor, uint8 _patch) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _STFactoryAddress | address | Address of the proxy. | 
| _major | uint8 | Major version of the proxy. | 
| _minor | uint8 | Minor version of the proxy. | 
| _patch | uint8 | Patch version of the proxy | 

### isSecurityToken

⤿ Overridden Implementation(s): [SecurityTokenRegistry.isSecurityToken](SecurityTokenRegistry.md#issecuritytoken)

Check that Security Token is registered

```js
function isSecurityToken(address _securityToken) external view
returns(bool)
```

**Returns**

bool

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _securityToken | address | Address of the Scurity token | 

### transferOwnership

⤿ Overridden Implementation(s): [SecurityTokenRegistry.transferOwnership](SecurityTokenRegistry.md#transferownership)

Allows the current owner to transfer control of the contract to a newOwner.

```js
function transferOwnership(address _newOwner) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _newOwner | address | The address to transfer ownership to. | 

### getSecurityTokenAddress

⤿ Overridden Implementation(s): [SecurityTokenRegistry.getSecurityTokenAddress](SecurityTokenRegistry.md#getsecuritytokenaddress)

Get security token address by ticker name

```js
function getSecurityTokenAddress(string _ticker) external view
returns(address)
```

**Returns**

address

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _ticker | string | Symbol of the Scurity token | 

### getSecurityTokenData

⤿ Overridden Implementation(s): [SecurityTokenRegistry.getSecurityTokenData](SecurityTokenRegistry.md#getsecuritytokendata)

Get security token data by its address

```js
function getSecurityTokenData(address _securityToken) external view
returns(string, address, string, uint256)
```

**Returns**

string Symbol of the Security Token.

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _securityToken | address | Address of the Scurity token. | 

### getSTFactoryAddress

⤿ Overridden Implementation(s): [SecurityTokenRegistry.getSTFactoryAddress](SecurityTokenRegistry.md#getstfactoryaddress)

Get the current STFactory Address

```js
function getSTFactoryAddress() external view
returns(address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getProtocolVersion

⤿ Overridden Implementation(s): [SecurityTokenRegistry.getProtocolVersion](SecurityTokenRegistry.md#getprotocolversion)

Get Protocol version

```js
function getProtocolVersion() external view
returns(uint8[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getTickersByOwner

⤿ Overridden Implementation(s): [SecurityTokenRegistry.getTickersByOwner](SecurityTokenRegistry.md#gettickersbyowner)

Used to get the ticker list as per the owner

```js
function getTickersByOwner(address _owner) external view
returns(bytes32[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _owner | address | Address which owns the list of tickers | 

### getTokensByOwner

⤿ Overridden Implementation(s): [SecurityTokenRegistry.getTokensByOwner](SecurityTokenRegistry.md#gettokensbyowner)

Returns the list of tokens owned by the selected address

```js
function getTokensByOwner(address _owner) external view
returns(address[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _owner | address | is the address which owns the list of tickers | 

### getTokensByDelegate

⤿ Overridden Implementation(s): [SecurityTokenRegistry.getTokensByDelegate](SecurityTokenRegistry.md#gettokensbydelegate)

Returns the list of tokens to which the delegate has some access

```js
function getTokensByDelegate(address _delegate) external view
returns(address[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _delegate | address | is the address for the delegate | 

### getTickerDetails

⤿ Overridden Implementation(s): [SecurityTokenRegistry.getTickerDetails](SecurityTokenRegistry.md#gettickerdetails)

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
| _ticker | string | ticker | 

### modifyTicker

⤿ Overridden Implementation(s): [SecurityTokenRegistry.modifyTicker](SecurityTokenRegistry.md#modifyticker)

Modifies the ticker details. Only polymath account has the ability
to do so. Only allowed to modify the tickers which are not yet deployed

```js
function modifyTicker(address _owner, string _ticker, string _tokenName, uint256 _registrationDate, uint256 _expiryDate, bool _status) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _owner | address | Owner of the token | 
| _ticker | string | Token ticker | 
| _tokenName | string | Name of the token | 
| _registrationDate | uint256 | Date on which ticker get registered | 
| _expiryDate | uint256 | Expiry date of the ticker | 
| _status | bool | Token deployed status | 

### removeTicker

⤿ Overridden Implementation(s): [SecurityTokenRegistry.removeTicker](SecurityTokenRegistry.md#removeticker)

Removes the ticker details and associated ownership & security token mapping

```js
function removeTicker(string _ticker) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _ticker | string | Token ticker | 

### transferTickerOwnership

⤿ Overridden Implementation(s): [SecurityTokenRegistry.transferTickerOwnership](SecurityTokenRegistry.md#transfertickerownership)

Transfers the ownership of the ticker

```js
function transferTickerOwnership(address _newOwner, string _ticker) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _newOwner | address |  | 
| _ticker | string |  | 

### changeExpiryLimit

⤿ Overridden Implementation(s): [SecurityTokenRegistry.changeExpiryLimit](SecurityTokenRegistry.md#changeexpirylimit)

Changes the expiry time for the token ticker

```js
function changeExpiryLimit(uint256 _newExpiry) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _newExpiry | uint256 | New time period for token ticker expiry | 

### changeTickerRegistrationFee

⤿ Overridden Implementation(s): [SecurityTokenRegistry.changeTickerRegistrationFee](SecurityTokenRegistry.md#changetickerregistrationfee)

Sets the ticker registration fee in POLY tokens

```js
function changeTickerRegistrationFee(uint256 _tickerRegFee) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _tickerRegFee | uint256 | Registration fee in POLY tokens (base 18 decimals) | 

### changeSecurityLaunchFee

⤿ Overridden Implementation(s): [SecurityTokenRegistry.changeSecurityLaunchFee](SecurityTokenRegistry.md#changesecuritylaunchfee)

Sets the ticker registration fee in POLY tokens

```js
function changeSecurityLaunchFee(uint256 _stLaunchFee) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _stLaunchFee | uint256 | Registration fee in POLY tokens (base 18 decimals) | 

### updatePolyTokenAddress

⤿ Overridden Implementation(s): [SecurityTokenRegistry.updatePolyTokenAddress](SecurityTokenRegistry.md#updatepolytokenaddress)

Change the PolyToken address

```js
function updatePolyTokenAddress(address _newAddress) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _newAddress | address | Address of the polytoken | 

### getSecurityTokenLaunchFee

⤿ Overridden Implementation(s): [SecurityTokenRegistry.getSecurityTokenLaunchFee](SecurityTokenRegistry.md#getsecuritytokenlaunchfee)

Gets the security token launch fee

```js
function getSecurityTokenLaunchFee() external view
returns(uint256)
```

**Returns**

Fee amount

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getTickerRegistrationFee

⤿ Overridden Implementation(s): [SecurityTokenRegistry.getTickerRegistrationFee](SecurityTokenRegistry.md#gettickerregistrationfee)

Gets the ticker registration fee

```js
function getTickerRegistrationFee() external view
returns(uint256)
```

**Returns**

Fee amount

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getExpiryLimit

⤿ Overridden Implementation(s): [SecurityTokenRegistry.getExpiryLimit](SecurityTokenRegistry.md#getexpirylimit)

Gets the expiry limit

```js
function getExpiryLimit() external view
returns(uint256)
```

**Returns**

Expiry limit

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### isPaused

⤿ Overridden Implementation(s): [SecurityTokenRegistry.isPaused](SecurityTokenRegistry.md#ispaused)

Checks whether the registry is paused or not

```js
function isPaused() external view
returns(bool)
```

**Returns**

bool

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### owner

⤿ Overridden Implementation(s): [SecurityTokenRegistry.owner](SecurityTokenRegistry.md#owner)

Gets the owner of the contract

```js
function owner() external view
returns(address)
```

**Returns**

address owner

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

