---
id: version-3.0.0-SecurityTokenRegistry
title: SecurityTokenRegistry
original_id: SecurityTokenRegistry
---

# Registry contract for issuers to register their tickers and security tokens (SecurityTokenRegistry.sol)

View Source: [contracts/SecurityTokenRegistry.sol](../../contracts/SecurityTokenRegistry.sol)

**↗ Extends: [ISecurityTokenRegistry](ISecurityTokenRegistry.md), [EternalStorage](EternalStorage.md)**
**↘ Derived Contracts: [SecurityTokenRegistryMock](SecurityTokenRegistryMock.md)**

**SecurityTokenRegistry**

## Contract Members
**Constants & Variables**

```js
bytes32 internal constant INITIALIZE;
bytes32 internal constant POLYTOKEN;
bytes32 internal constant STLAUNCHFEE;
bytes32 internal constant TICKERREGFEE;
bytes32 internal constant EXPIRYLIMIT;
bytes32 internal constant PAUSED;
bytes32 internal constant OWNER;
bytes32 internal constant POLYMATHREGISTRY;

```

**Events**

```js
event Pause(uint256  _timestammp);
event Unpause(uint256  _timestamp);
event TickerRemoved(string  _ticker, uint256  _removedAt, address  _removedBy);
event ChangeExpiryLimit(uint256  _oldExpiry, uint256  _newExpiry);
event ChangeSecurityLaunchFee(uint256  _oldFee, uint256  _newFee);
event ChangeTickerRegistrationFee(uint256  _oldFee, uint256  _newFee);
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
event ChangeTickerOwnership(string  _ticker, address indexed _oldOwner, address indexed _newOwner);
event NewSecurityToken(string  _ticker, string  _name, address indexed _securityTokenAddress, address indexed _owner, uint256  _addedAt, address  _registrant, bool  _fromAdmin, uint256  _registrationFee);
event RegisterTicker(address indexed _owner, string  _ticker, string  _name, uint256 indexed _registrationDate, uint256 indexed _expiryDate, bool  _fromAdmin, uint256  _registrationFee);
```

## Modifiers

- [onlyOwner](#onlyowner)
- [whenNotPausedOrOwner](#whennotpausedorowner)
- [whenNotPaused](#whennotpaused)
- [whenPaused](#whenpaused)

### onlyOwner

Throws if called by any account other than the owner.

```js
modifier onlyOwner() internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### whenNotPausedOrOwner

Modifier to make a function callable only when the contract is not paused.

```js
modifier whenNotPausedOrOwner() internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### whenNotPaused

Modifier to make a function callable only when the contract is not paused and ignore is msg.sender is owner.

```js
modifier whenNotPaused() internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### whenPaused

Modifier to make a function callable only when the contract is paused.

```js
modifier whenPaused() internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

## Functions

- [initialize(address _polymathRegistry, address _STFactory, uint256 _stLaunchFee, uint256 _tickerRegFee, address _polyToken, address _owner)](#initialize)
- [registerTicker(address _owner, string _ticker, string _tokenName)](#registerticker)
- [_addTicker(address _owner, string _ticker, string _tokenName, uint256 _registrationDate, uint256 _expiryDate, bool _status, bool _fromAdmin, uint256 _fee)](#_addticker)
- [modifyTicker(address _owner, string _ticker, string _tokenName, uint256 _registrationDate, uint256 _expiryDate, bool _status)](#modifyticker)
- [_modifyTicker(address _owner, string _ticker, string _tokenName, uint256 _registrationDate, uint256 _expiryDate, bool _status)](#_modifyticker)
- [_tickerOwner(string _ticker)](#_tickerowner)
- [removeTicker(string _ticker)](#removeticker)
- [_tickerAvailable(string _ticker)](#_tickeravailable)
- [_tickerStatus(string _ticker)](#_tickerstatus)
- [_setTickerOwnership(address _owner, string _ticker)](#_settickerownership)
- [_storeTickerDetails(string _ticker, address _owner, uint256 _registrationDate, uint256 _expiryDate, string _tokenName, bool _status)](#_storetickerdetails)
- [transferTickerOwnership(address _newOwner, string _ticker)](#transfertickerownership)
- [_deleteTickerOwnership(address _owner, string _ticker)](#_deletetickerownership)
- [changeExpiryLimit(uint256 _newExpiry)](#changeexpirylimit)
- [getTickersByOwner(address _owner)](#gettickersbyowner)
- [_ownerInTicker(bytes32 _ticker)](#_ownerinticker)
- [getTokensByOwner(address _owner)](#gettokensbyowner)
- [getTokens()](#gettokens)
- [_getTokens(bool _allTokens, address _owner)](#_gettokens)
- [_ownerInToken(bytes32 _ticker, bool _allTokens, address _owner)](#_ownerintoken)
- [getTokensByDelegate(address _delegate)](#gettokensbydelegate)
- [_delegateInToken(address _token, address _delegate)](#_delegateintoken)
- [getTickerDetails(string _ticker)](#gettickerdetails)
- [generateSecurityToken(string _name, string _ticker, string _tokenDetails, bool _divisible)](#generatesecuritytoken)
- [modifySecurityToken(string _name, string _ticker, address _owner, address _securityToken, string _tokenDetails, uint256 _deployedAt)](#modifysecuritytoken)
- [_storeSecurityTokenData(address _securityToken, string _ticker, string _tokenDetails, uint256 _deployedAt)](#_storesecuritytokendata)
- [isSecurityToken(address _securityToken)](#issecuritytoken)
- [getSecurityTokenAddress(string _ticker)](#getsecuritytokenaddress)
- [getSecurityTokenData(address _securityToken)](#getsecuritytokendata)
- [transferOwnership(address _newOwner)](#transferownership)
- [pause()](#pause)
- [unpause()](#unpause)
- [changeTickerRegistrationFee(uint256 _tickerRegFee)](#changetickerregistrationfee)
- [changeSecurityLaunchFee(uint256 _stLaunchFee)](#changesecuritylaunchfee)
- [reclaimERC20(address _tokenContract)](#reclaimerc20)
- [setProtocolVersion(address _STFactoryAddress, uint8 _major, uint8 _minor, uint8 _patch)](#setprotocolversion)
- [_setProtocolVersion(address _STFactoryAddress, uint8 _major, uint8 _minor, uint8 _patch)](#_setprotocolversion)
- [getSTFactoryAddress()](#getstfactoryaddress)
- [getProtocolVersion()](#getprotocolversion)
- [updatePolyTokenAddress(address _newAddress)](#updatepolytokenaddress)
- [getSecurityTokenLaunchFee()](#getsecuritytokenlaunchfee)
- [getTickerRegistrationFee()](#gettickerregistrationfee)
- [getExpiryLimit()](#getexpirylimit)
- [isPaused()](#ispaused)
- [owner()](#owner)

### initialize

Initializes instance of STR

```js
function initialize(address _polymathRegistry, address _STFactory, uint256 _stLaunchFee, uint256 _tickerRegFee, address _polyToken, address _owner) external payable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _polymathRegistry | address | is the address of the Polymath Registry | 
| _STFactory | address | is the address of the Proxy contract for Security Tokens | 
| _stLaunchFee | uint256 | is the fee in POLY required to launch a token | 
| _tickerRegFee | uint256 | is the fee in POLY required to register a ticker | 
| _polyToken | address | is the address of the POLY ERC20 token | 
| _owner | address | is the owner of the STR | 

### registerTicker

⤾ overrides [ISecurityTokenRegistry.registerTicker](ISecurityTokenRegistry.md#registerticker)

Registers the token ticker to the selected owner

```js
function registerTicker(address _owner, string _ticker, string _tokenName) external nonpayable whenNotPausedOrOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _owner | address | is address of the owner of the token | 
| _ticker | string | is unique token ticker | 
| _tokenName | string | is the name of the token | 

### _addTicker

Internal - Sets the details of the ticker

```js
function _addTicker(address _owner, string _ticker, string _tokenName, uint256 _registrationDate, uint256 _expiryDate, bool _status, bool _fromAdmin, uint256 _fee) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _owner | address |  | 
| _ticker | string |  | 
| _tokenName | string |  | 
| _registrationDate | uint256 |  | 
| _expiryDate | uint256 |  | 
| _status | bool |  | 
| _fromAdmin | bool |  | 
| _fee | uint256 |  | 

### modifyTicker

⤾ overrides [ISecurityTokenRegistry.modifyTicker](ISecurityTokenRegistry.md#modifyticker)

Modifies the ticker details. Only Polymath has the ability to do so.

```js
function modifyTicker(address _owner, string _ticker, string _tokenName, uint256 _registrationDate, uint256 _expiryDate, bool _status) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _owner | address | is the owner of the token | 
| _ticker | string | is the token ticker | 
| _tokenName | string | is the name of the token | 
| _registrationDate | uint256 | is the date at which ticker is registered | 
| _expiryDate | uint256 | is the expiry date for the ticker | 
| _status | bool | is the token deployment status | 

### _modifyTicker

Internal -- Modifies the ticker details.

```js
function _modifyTicker(address _owner, string _ticker, string _tokenName, uint256 _registrationDate, uint256 _expiryDate, bool _status) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _owner | address |  | 
| _ticker | string |  | 
| _tokenName | string |  | 
| _registrationDate | uint256 |  | 
| _expiryDate | uint256 |  | 
| _status | bool |  | 

### _tickerOwner

```js
function _tickerOwner(string _ticker) internal view
returns(address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _ticker | string |  | 

### removeTicker

⤾ overrides [ISecurityTokenRegistry.removeTicker](ISecurityTokenRegistry.md#removeticker)

Removes the ticker details, associated ownership & security token mapping

```js
function removeTicker(string _ticker) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _ticker | string | is the token ticker | 

### _tickerAvailable

Internal - Checks if the entered ticker is registered and has not expired

```js
function _tickerAvailable(string _ticker) internal view
returns(bool)
```

**Returns**

bool

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _ticker | string | is the token ticker | 

### _tickerStatus

```js
function _tickerStatus(string _ticker) internal view
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _ticker | string |  | 

### _setTickerOwnership

Internal - Sets the ticker owner

```js
function _setTickerOwnership(address _owner, string _ticker) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _owner | address | is the address of the owner of the ticker | 
| _ticker | string | is the ticker symbol | 

### _storeTickerDetails

Internal - Stores the ticker details

```js
function _storeTickerDetails(string _ticker, address _owner, uint256 _registrationDate, uint256 _expiryDate, string _tokenName, bool _status) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _ticker | string |  | 
| _owner | address |  | 
| _registrationDate | uint256 |  | 
| _expiryDate | uint256 |  | 
| _tokenName | string |  | 
| _status | bool |  | 

### transferTickerOwnership

⤾ overrides [ISecurityTokenRegistry.transferTickerOwnership](ISecurityTokenRegistry.md#transfertickerownership)

Transfers the ownership of the ticker

```js
function transferTickerOwnership(address _newOwner, string _ticker) external nonpayable whenNotPausedOrOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _newOwner | address | is the address of the new owner of the ticker | 
| _ticker | string | is the ticker symbol | 

### _deleteTickerOwnership

Internal - Removes the owner of a ticker

```js
function _deleteTickerOwnership(address _owner, string _ticker) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _owner | address |  | 
| _ticker | string |  | 

### changeExpiryLimit

⤾ overrides [ISecurityTokenRegistry.changeExpiryLimit](ISecurityTokenRegistry.md#changeexpirylimit)

Changes the expiry time for the token ticker. Only available to Polymath.

```js
function changeExpiryLimit(uint256 _newExpiry) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _newExpiry | uint256 | is the new expiry for newly generated tickers | 

### getTickersByOwner

⤾ overrides [ISecurityTokenRegistry.getTickersByOwner](ISecurityTokenRegistry.md#gettickersbyowner)

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

⤾ overrides [ISecurityTokenRegistry.getTokensByOwner](ISecurityTokenRegistry.md#gettokensbyowner)

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

⤾ overrides [ISecurityTokenRegistry.getTokensByDelegate](ISecurityTokenRegistry.md#gettokensbydelegate)

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

⤾ overrides [ISecurityTokenRegistry.getTickerDetails](ISecurityTokenRegistry.md#gettickerdetails)

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

### generateSecurityToken

⤾ overrides [ISecurityTokenRegistry.generateSecurityToken](ISecurityTokenRegistry.md#generatesecuritytoken)

Deploys an instance of a new Security Token and records it to the registry

```js
function generateSecurityToken(string _name, string _ticker, string _tokenDetails, bool _divisible) external nonpayable whenNotPausedOrOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _name | string | is the name of the token | 
| _ticker | string | is the ticker symbol of the security token | 
| _tokenDetails | string | is the off-chain details of the token | 
| _divisible | bool | is whether or not the token is divisible | 

### modifySecurityToken

⤾ overrides [ISecurityTokenRegistry.modifySecurityToken](ISecurityTokenRegistry.md#modifysecuritytoken)

Adds a new custom Security Token and saves it to the registry. (Token should follow the ISecurityToken interface)

```js
function modifySecurityToken(string _name, string _ticker, address _owner, address _securityToken, string _tokenDetails, uint256 _deployedAt) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _name | string | is the name of the token | 
| _ticker | string | is the ticker symbol of the security token | 
| _owner | address | is the owner of the token | 
| _securityToken | address | is the address of the securityToken | 
| _tokenDetails | string | is the off-chain details of the token | 
| _deployedAt | uint256 | is the timestamp at which the security token is deployed | 

### _storeSecurityTokenData

Internal - Stores the security token details

```js
function _storeSecurityTokenData(address _securityToken, string _ticker, string _tokenDetails, uint256 _deployedAt) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _securityToken | address |  | 
| _ticker | string |  | 
| _tokenDetails | string |  | 
| _deployedAt | uint256 |  | 

### isSecurityToken

⤾ overrides [ISecurityTokenRegistry.isSecurityToken](ISecurityTokenRegistry.md#issecuritytoken)

Checks that Security Token is registered

```js
function isSecurityToken(address _securityToken) external view
returns(bool)
```

**Returns**

bool

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _securityToken | address | is the address of the security token | 

### getSecurityTokenAddress

⤾ overrides [ISecurityTokenRegistry.getSecurityTokenAddress](ISecurityTokenRegistry.md#getsecuritytokenaddress)

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

⤾ overrides [ISecurityTokenRegistry.getSecurityTokenData](ISecurityTokenRegistry.md#getsecuritytokendata)

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

### transferOwnership

⤾ overrides [ISecurityTokenRegistry.transferOwnership](ISecurityTokenRegistry.md#transferownership)

Allows the current owner to transfer control of the contract to a newOwner.

```js
function transferOwnership(address _newOwner) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _newOwner | address | The address to transfer ownership to. | 

### pause

Called by the owner to pause, triggers stopped state

```js
function pause() external nonpayable whenNotPaused onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### unpause

Called by the owner to unpause, returns to normal state

```js
function unpause() external nonpayable whenPaused onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### changeTickerRegistrationFee

⤾ overrides [ISecurityTokenRegistry.changeTickerRegistrationFee](ISecurityTokenRegistry.md#changetickerregistrationfee)

Sets the ticker registration fee in POLY tokens. Only Polymath.

```js
function changeTickerRegistrationFee(uint256 _tickerRegFee) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _tickerRegFee | uint256 | is the registration fee in POLY tokens (base 18 decimals) | 

### changeSecurityLaunchFee

⤾ overrides [ISecurityTokenRegistry.changeSecurityLaunchFee](ISecurityTokenRegistry.md#changesecuritylaunchfee)

Sets the ticker registration fee in POLY tokens. Only Polymath.

```js
function changeSecurityLaunchFee(uint256 _stLaunchFee) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _stLaunchFee | uint256 | is the registration fee in POLY tokens (base 18 decimals) | 

### reclaimERC20

Reclaims all ERC20Basic compatible tokens

```js
function reclaimERC20(address _tokenContract) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _tokenContract | address | is the address of the token contract | 

### setProtocolVersion

⤾ overrides [ISecurityTokenRegistry.setProtocolVersion](ISecurityTokenRegistry.md#setprotocolversion)

Changes the protocol version and the SecurityToken contract

```js
function setProtocolVersion(address _STFactoryAddress, uint8 _major, uint8 _minor, uint8 _patch) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _STFactoryAddress | address | is the address of the proxy. | 
| _major | uint8 | Major version of the proxy. | 
| _minor | uint8 | Minor version of the proxy. | 
| _patch | uint8 | Patch version of the proxy | 

### _setProtocolVersion

Internal - Changes the protocol version and the SecurityToken contract

```js
function _setProtocolVersion(address _STFactoryAddress, uint8 _major, uint8 _minor, uint8 _patch) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _STFactoryAddress | address |  | 
| _major | uint8 |  | 
| _minor | uint8 |  | 
| _patch | uint8 |  | 

### getSTFactoryAddress

⤾ overrides [ISecurityTokenRegistry.getSTFactoryAddress](ISecurityTokenRegistry.md#getstfactoryaddress)

Returns the current STFactory Address

```js
function getSTFactoryAddress() public view
returns(address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getProtocolVersion

⤾ overrides [ISecurityTokenRegistry.getProtocolVersion](ISecurityTokenRegistry.md#getprotocolversion)

Gets Protocol version

```js
function getProtocolVersion() public view
returns(uint8[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### updatePolyTokenAddress

⤾ overrides [ISecurityTokenRegistry.updatePolyTokenAddress](ISecurityTokenRegistry.md#updatepolytokenaddress)

Changes the PolyToken address. Only Polymath.

```js
function updatePolyTokenAddress(address _newAddress) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _newAddress | address | is the address of the polytoken. | 

### getSecurityTokenLaunchFee

⤾ overrides [ISecurityTokenRegistry.getSecurityTokenLaunchFee](ISecurityTokenRegistry.md#getsecuritytokenlaunchfee)

Gets the security token launch fee

```js
function getSecurityTokenLaunchFee() public view
returns(uint256)
```

**Returns**

Fee amount

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getTickerRegistrationFee

⤾ overrides [ISecurityTokenRegistry.getTickerRegistrationFee](ISecurityTokenRegistry.md#gettickerregistrationfee)

Gets the ticker registration fee

```js
function getTickerRegistrationFee() public view
returns(uint256)
```

**Returns**

Fee amount

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getExpiryLimit

⤾ overrides [ISecurityTokenRegistry.getExpiryLimit](ISecurityTokenRegistry.md#getexpirylimit)

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

### isPaused

⤾ overrides [ISecurityTokenRegistry.isPaused](ISecurityTokenRegistry.md#ispaused)

Check whether the registry is paused or not

```js
function isPaused() public view
returns(bool)
```

**Returns**

bool

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### owner

⤾ overrides [ISecurityTokenRegistry.owner](ISecurityTokenRegistry.md#owner)

Gets the owner of the contract

```js
function owner() public view
returns(address)
```

**Returns**

address owner

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

