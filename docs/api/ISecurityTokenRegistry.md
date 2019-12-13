---
id: version-3.0.0-ISecurityTokenRegistry
title: ISecurityTokenRegistry
original_id: ISecurityTokenRegistry
---

# Interface for the Polymath Security Token Registry contract (ISecurityTokenRegistry.sol)

View Source: [contracts/interfaces/ISecurityTokenRegistry.sol](../../contracts/interfaces/ISecurityTokenRegistry.sol)

**ISecurityTokenRegistry**

**Events**

```js
event Pause(address  account);
event Unpause(address  account);
event TickerRemoved(string  _ticker, address  _removedBy);
event ChangeExpiryLimit(uint256  _oldExpiry, uint256  _newExpiry);
event ChangeSecurityLaunchFee(uint256  _oldFee, uint256  _newFee);
event ChangeTickerRegistrationFee(uint256  _oldFee, uint256  _newFee);
event ChangeFeeCurrency(bool  _isFeeInPoly);
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
event ChangeTickerOwnership(string  _ticker, address indexed _oldOwner, address indexed _newOwner);
event NewSecurityToken(string  _ticker, string  _name, address indexed _securityTokenAddress, address indexed _owner, uint256  _addedAt, address  _registrant, bool  _fromAdmin, uint256  _usdFee, uint256  _polyFee, uint256  _protocolVersion);
event NewSecurityToken(string  _ticker, string  _name, address indexed _securityTokenAddress, address indexed _owner, uint256  _addedAt, address  _registrant, bool  _fromAdmin, uint256  _registrationFee);
event RegisterTicker(address indexed _owner, string  _ticker, uint256 indexed _registrationDate, uint256 indexed _expiryDate, bool  _fromAdmin, uint256  _registrationFeePoly, uint256  _registrationFeeUsd);
event RegisterTicker(address indexed _owner, string  _ticker, string  _name, uint256 indexed _registrationDate, uint256 indexed _expiryDate, bool  _fromAdmin, uint256  _registrationFee);
event SecurityTokenRefreshed(string  _ticker, string  _name, address indexed _securityTokenAddress, address indexed _owner, uint256  _addedAt, address  _registrant, uint256  _protocolVersion);
event ProtocolFactorySet(address indexed _STFactory, uint8  _major, uint8  _minor, uint8  _patch);
event LatestVersionSet(uint8  _major, uint8  _minor, uint8  _patch);
event ProtocolFactoryRemoved(address indexed _STFactory, uint8  _major, uint8  _minor, uint8  _patch);
```

## Functions

- [generateSecurityToken(string _name, string _ticker, string _tokenDetails, bool _divisible)](#generatesecuritytoken)
- [generateNewSecurityToken(string _name, string _ticker, string _tokenDetails, bool _divisible, address _treasuryWallet, uint256 _protocolVersion)](#generatenewsecuritytoken)
- [refreshSecurityToken(string _name, string _ticker, string _tokenDetails, bool _divisible, address _treasuryWallet)](#refreshsecuritytoken)
- [modifySecurityToken(string _name, string _ticker, address _owner, address _securityToken, string _tokenDetails, uint256 _deployedAt)](#modifysecuritytoken)
- [modifyExistingSecurityToken(string _ticker, address _owner, address _securityToken, string _tokenDetails, uint256 _deployedAt)](#modifyexistingsecuritytoken)
- [modifyExistingTicker(address _owner, string _ticker, uint256 _registrationDate, uint256 _expiryDate, bool _status)](#modifyexistingticker)
- [registerTicker(address _owner, string _ticker, string _tokenName)](#registerticker)
- [registerNewTicker(address _owner, string _ticker)](#registernewticker)
- [isSecurityToken(address _securityToken)](#issecuritytoken)
- [transferOwnership(address _newOwner)](#transferownership)
- [getSecurityTokenAddress(string _ticker)](#getsecuritytokenaddress)
- [getSecurityTokenData(address _securityToken)](#getsecuritytokendata)
- [getSTFactoryAddress()](#getstfactoryaddress)
- [getSTFactoryAddressOfVersion(uint256 _protocolVersion)](#getstfactoryaddressofversion)
- [getLatestProtocolVersion()](#getlatestprotocolversion)
- [getTickersByOwner(address _owner)](#gettickersbyowner)
- [getTokensByOwner(address _owner)](#gettokensbyowner)
- [getTokens()](#gettokens)
- [getTickerDetails(string _ticker)](#gettickerdetails)
- [modifyTicker(address _owner, string _ticker, string _tokenName, uint256 _registrationDate, uint256 _expiryDate, bool _status)](#modifyticker)
- [removeTicker(string _ticker)](#removeticker)
- [transferTickerOwnership(address _newOwner, string _ticker)](#transfertickerownership)
- [changeExpiryLimit(uint256 _newExpiry)](#changeexpirylimit)
- [changeTickerRegistrationFee(uint256 _tickerRegFee)](#changetickerregistrationfee)
- [changeSecurityLaunchFee(uint256 _stLaunchFee)](#changesecuritylaunchfee)
- [changeFeesAmountAndCurrency(uint256 _tickerRegFee, uint256 _stLaunchFee, bool _isFeeInPoly)](#changefeesamountandcurrency)
- [setProtocolFactory(address _STFactoryAddress, uint8 _major, uint8 _minor, uint8 _patch)](#setprotocolfactory)
- [removeProtocolFactory(uint8 _major, uint8 _minor, uint8 _patch)](#removeprotocolfactory)
- [setLatestVersion(uint8 _major, uint8 _minor, uint8 _patch)](#setlatestversion)
- [updatePolyTokenAddress(address _newAddress)](#updatepolytokenaddress)
- [updateFromRegistry()](#updatefromregistry)
- [getSecurityTokenLaunchFee()](#getsecuritytokenlaunchfee)
- [getTickerRegistrationFee()](#gettickerregistrationfee)
- [setGetterRegistry(address _getterContract)](#setgetterregistry)
- [getFees(bytes32 _feeType)](#getfees)
- [getTokensByDelegate(address _delegate)](#gettokensbydelegate)
- [getExpiryLimit()](#getexpirylimit)
- [getTickerStatus(string _ticker)](#gettickerstatus)
- [getIsFeeInPoly()](#getisfeeinpoly)
- [getTickerOwner(string _ticker)](#gettickerowner)
- [isPaused()](#ispaused)
- [pause()](#pause)
- [unpause()](#unpause)
- [reclaimERC20(address _tokenContract)](#reclaimerc20)
- [owner()](#owner)
- [tickerAvailable(string _ticker)](#tickeravailable)

### generateSecurityToken

Deploys an instance of a new Security Token of version 2.0 and records it to the registry

```js
function generateSecurityToken(string _name, string _ticker, string _tokenDetails, bool _divisible) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _name | string | is the name of the token | 
| _ticker | string | is the ticker symbol of the security token | 
| _tokenDetails | string | is the off-chain details of the token | 
| _divisible | bool | is whether or not the token is divisible | 

### generateNewSecurityToken

Deploys an instance of a new Security Token and records it to the registry

```js
function generateNewSecurityToken(string _name, string _ticker, string _tokenDetails, bool _divisible, address _treasuryWallet, uint256 _protocolVersion) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _name | string | is the name of the token | 
| _ticker | string | is the ticker symbol of the security token | 
| _tokenDetails | string | is the off-chain details of the token | 
| _divisible | bool | is whether or not the token is divisible | 
| _treasuryWallet | address | Ethereum address which will holds the STs. | 
| _protocolVersion | uint256 | Version of securityToken contract
- `_protocolVersion` is the packed value of uin8[3] array (it will be calculated offchain)
- if _protocolVersion == 0 then latest version of securityToken will be generated | 

### refreshSecurityToken

Deploys an instance of a new Security Token and replaces the old one in the registry
This can be used to upgrade from version 2.0 of ST to 3.0 or in case something goes wrong with earlier ST

```js
function refreshSecurityToken(string _name, string _ticker, string _tokenDetails, bool _divisible, address _treasuryWallet) external nonpayable
returns(securityToken address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _name | string | is the name of the token | 
| _ticker | string | is the ticker symbol of the security token | 
| _tokenDetails | string | is the off-chain details of the token | 
| _divisible | bool | is whether or not the token is divisible | 
| _treasuryWallet | address |  | 

### modifySecurityToken

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

### modifyExistingSecurityToken

Adds a new custom Security Token and saves it to the registry. (Token should follow the ISecurityToken interface)

```js
function modifyExistingSecurityToken(string _ticker, address _owner, address _securityToken, string _tokenDetails, uint256 _deployedAt) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _ticker | string | is the ticker symbol of the security token | 
| _owner | address | is the owner of the token | 
| _securityToken | address | is the address of the securityToken | 
| _tokenDetails | string | is the off-chain details of the token | 
| _deployedAt | uint256 | is the timestamp at which the security token is deployed | 

### modifyExistingTicker

Modifies the ticker details. Only Polymath has the ability to do so.

```js
function modifyExistingTicker(address _owner, string _ticker, uint256 _registrationDate, uint256 _expiryDate, bool _status) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _owner | address | is the owner of the token | 
| _ticker | string | is the token ticker | 
| _registrationDate | uint256 | is the date at which ticker is registered | 
| _expiryDate | uint256 | is the expiry date for the ticker | 
| _status | bool | is the token deployment status | 

### registerTicker

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

### registerNewTicker

Registers the token ticker to the selected owner

```js
function registerNewTicker(address _owner, string _ticker) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _owner | address | is address of the owner of the token | 
| _ticker | string | is unique token ticker | 

### isSecurityToken

Check that Security Token is registered

```js
function isSecurityToken(address _securityToken) external view
returns(isValid bool)
```

**Returns**

bool

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _securityToken | address | Address of the Scurity token | 

### transferOwnership

Allows the current owner to transfer control of the contract to a newOwner.

```js
function transferOwnership(address _newOwner) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _newOwner | address | The address to transfer ownership to. | 

### getSecurityTokenAddress

Get security token address by ticker name

```js
function getSecurityTokenAddress(string _ticker) external view
returns(tokenAddress address)
```

**Returns**

address

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _ticker | string | Symbol of the Scurity token | 

### getSecurityTokenData

Returns the security token data by address

```js
function getSecurityTokenData(address _securityToken) external view
returns(tokenSymbol string, tokenAddress address, tokenDetails string, tokenTime uint256)
```

**Returns**

string is the ticker of the security Token.

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _securityToken | address | is the address of the security token. | 

### getSTFactoryAddress

Get the current STFactory Address

```js
function getSTFactoryAddress() external view
returns(stFactoryAddress address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getSTFactoryAddressOfVersion

Returns the STFactory Address of a particular version

```js
function getSTFactoryAddressOfVersion(uint256 _protocolVersion) external view
returns(stFactory address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _protocolVersion | uint256 | Packed protocol version | 

### getLatestProtocolVersion

Get Protocol version

```js
function getLatestProtocolVersion() external view
returns(protocolVersion uint8[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getTickersByOwner

Used to get the ticker list as per the owner

```js
function getTickersByOwner(address _owner) external view
returns(tickers bytes32[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _owner | address | Address which owns the list of tickers | 

### getTokensByOwner

Returns the list of tokens owned by the selected address

```js
function getTokensByOwner(address _owner) external view
returns(tokens address[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _owner | address | is the address which owns the list of tickers | 

### getTokens

Returns the list of all tokens

```js
function getTokens() external view
returns(tokens address[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getTickerDetails

Returns the owner and timestamp for a given ticker

```js
function getTickerDetails(string _ticker) external view
returns(tickerOwner address, tickerRegistration uint256, tickerExpiry uint256, tokenName string, tickerStatus bool)
```

**Returns**

address

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _ticker | string | ticker | 

### modifyTicker

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

Removes the ticker details and associated ownership & security token mapping

```js
function removeTicker(string _ticker) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _ticker | string | Token ticker | 

### transferTickerOwnership

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

Changes the expiry time for the token ticker

```js
function changeExpiryLimit(uint256 _newExpiry) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _newExpiry | uint256 | New time period for token ticker expiry | 

### changeTickerRegistrationFee

Sets the ticker registration fee in USD tokens. Only Polymath.

```js
function changeTickerRegistrationFee(uint256 _tickerRegFee) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _tickerRegFee | uint256 | is the registration fee in USD tokens (base 18 decimals) | 

### changeSecurityLaunchFee

Sets the ticker registration fee in USD tokens. Only Polymath.

```js
function changeSecurityLaunchFee(uint256 _stLaunchFee) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _stLaunchFee | uint256 | is the registration fee in USD tokens (base 18 decimals) | 

### changeFeesAmountAndCurrency

Sets the ticker registration and ST launch fee amount and currency

```js
function changeFeesAmountAndCurrency(uint256 _tickerRegFee, uint256 _stLaunchFee, bool _isFeeInPoly) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _tickerRegFee | uint256 | is the ticker registration fee (base 18 decimals) | 
| _stLaunchFee | uint256 | is the st generation fee (base 18 decimals) | 
| _isFeeInPoly | bool | defines if the fee is in poly or usd | 

### setProtocolFactory

Changes the SecurityToken contract for a particular factory version

```js
function setProtocolFactory(address _STFactoryAddress, uint8 _major, uint8 _minor, uint8 _patch) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _STFactoryAddress | address | is the address of the proxy. | 
| _major | uint8 | Major version of the proxy. | 
| _minor | uint8 | Minor version of the proxy. | 
| _patch | uint8 | Patch version of the proxy | 

### removeProtocolFactory

Removes a STFactory

```js
function removeProtocolFactory(uint8 _major, uint8 _minor, uint8 _patch) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _major | uint8 | Major version of the proxy. | 
| _minor | uint8 | Minor version of the proxy. | 
| _patch | uint8 | Patch version of the proxy | 

### setLatestVersion

Changes the default protocol version

```js
function setLatestVersion(uint8 _major, uint8 _minor, uint8 _patch) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _major | uint8 | Major version of the proxy. | 
| _minor | uint8 | Minor version of the proxy. | 
| _patch | uint8 | Patch version of the proxy | 

### updatePolyTokenAddress

Changes the PolyToken address. Only Polymath.

```js
function updatePolyTokenAddress(address _newAddress) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _newAddress | address | is the address of the polytoken. | 

### updateFromRegistry

Used to update the polyToken contract address

```js
function updateFromRegistry() external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getSecurityTokenLaunchFee

Gets the security token launch fee

```js
function getSecurityTokenLaunchFee() external nonpayable
returns(fee uint256)
```

**Returns**

Fee amount

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getTickerRegistrationFee

Gets the ticker registration fee

```js
function getTickerRegistrationFee() external nonpayable
returns(fee uint256)
```

**Returns**

Fee amount

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### setGetterRegistry

Set the getter contract address

```js
function setGetterRegistry(address _getterContract) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _getterContract | address | Address of the contract | 

### getFees

Returns the usd & poly fee for a particular feetype

```js
function getFees(bytes32 _feeType) external nonpayable
returns(usdFee uint256, polyFee uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _feeType | bytes32 | Key corresponding to fee type | 

### getTokensByDelegate

Returns the list of tokens to which the delegate has some access

```js
function getTokensByDelegate(address _delegate) external view
returns(tokens address[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _delegate | address | is the address for the delegate | 

### getExpiryLimit

Gets the expiry limit

```js
function getExpiryLimit() external view
returns(expiry uint256)
```

**Returns**

Expiry limit

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getTickerStatus

Gets the status of the ticker

```js
function getTickerStatus(string _ticker) external view
returns(status bool)
```

**Returns**

bool

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _ticker | string | Ticker whose status need to determine | 

### getIsFeeInPoly

Gets the fee currency

```js
function getIsFeeInPoly() external view
returns(isInPoly bool)
```

**Returns**

true = poly, false = usd

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getTickerOwner

Gets the owner of the ticker

```js
function getTickerOwner(string _ticker) external view
returns(owner address)
```

**Returns**

address Address of the owner

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _ticker | string | Ticker whose owner need to determine | 

### isPaused

Checks whether the registry is paused or not

```js
function isPaused() external view
returns(paused bool)
```

**Returns**

bool

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### pause

Called by the owner to pause, triggers stopped state

```js
function pause() external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### unpause

Called by the owner to unpause, returns to normal state

```js
function unpause() external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### reclaimERC20

Reclaims all ERC20Basic compatible tokens

```js
function reclaimERC20(address _tokenContract) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _tokenContract | address | is the address of the token contract | 

### owner

Gets the owner of the contract

```js
function owner() external view
returns(ownerAddress address)
```

**Returns**

address owner

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### tickerAvailable

Checks if the entered ticker is registered and has not expired

```js
function tickerAvailable(string _ticker) external view
returns(bool)
```

**Returns**

bool

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _ticker | string | is the token ticker | 

