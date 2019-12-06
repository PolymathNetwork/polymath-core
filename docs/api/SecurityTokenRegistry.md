---
id: version-3.0.0-SecurityTokenRegistry
title: SecurityTokenRegistry
original_id: SecurityTokenRegistry
---

# Registry contract for issuers to register their tickers and security tokens (SecurityTokenRegistry.sol)

View Source: [contracts/SecurityTokenRegistry.sol](../../contracts/SecurityTokenRegistry.sol)

**↗ Extends: [EternalStorage](EternalStorage.md), [Proxy](Proxy.md)**
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
bytes32 internal constant STRGETTER;
bytes32 internal constant IS_FEE_IN_POLY;
bytes32 internal constant ACTIVE_USERS;
bytes32 internal constant LATEST_VERSION;
string internal constant POLY_ORACLE;

```

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

## Modifiers

- [onlyOwner](#onlyowner)
- [onlyOwnerOrSelf](#onlyownerorself)
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

### onlyOwnerOrSelf

```js
modifier onlyOwnerOrSelf() internal
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

- [_onlyOwner()](#_onlyowner)
- [_whenNotPausedOrOwner()](#_whennotpausedorowner)
- [()](#)
- [initialize(address _polymathRegistry, uint256 _stLaunchFee, uint256 _tickerRegFee, address _owner, address _getterContract)](#initialize)
- [updateFromRegistry()](#updatefromregistry)
- [_updateFromRegistry()](#_updatefromregistry)
- [_takeFee(bytes32 _feeType)](#_takefee)
- [getFees(bytes32 _feeType)](#getfees)
- [getSecurityTokenLaunchFee()](#getsecuritytokenlaunchfee)
- [getTickerRegistrationFee()](#gettickerregistrationfee)
- [setGetterRegistry(address _getterContract)](#setgetterregistry)
- [_implementation()](#_implementation)
- [registerNewTicker(address _owner, string _ticker)](#registernewticker)
- [registerTicker(address _owner, string _ticker, string _tokenName)](#registerticker)
- [_addTicker(address _owner, string _ticker, uint256 _registrationDate, uint256 _expiryDate, bool _status, bool _fromAdmin, uint256 _polyFee, uint256 _usdFee)](#_addticker)
- [modifyExistingTicker(address _owner, string _ticker, uint256 _registrationDate, uint256 _expiryDate, bool _status)](#modifyexistingticker)
- [modifyTicker(address _owner, string _ticker, string _tokenName, uint256 _registrationDate, uint256 _expiryDate, bool _status)](#modifyticker)
- [_modifyTicker(address _owner, string _ticker, uint256 _registrationDate, uint256 _expiryDate, bool _status)](#_modifyticker)
- [_tickerOwner(string _ticker)](#_tickerowner)
- [removeTicker(string _ticker)](#removeticker)
- [tickerAvailable(string _ticker)](#tickeravailable)
- [_tickerStatus(string _ticker)](#_tickerstatus)
- [_setTickerOwnership(address _owner, string _ticker)](#_settickerownership)
- [_storeTickerDetails(string _ticker, address _owner, uint256 _registrationDate, uint256 _expiryDate, bool _status)](#_storetickerdetails)
- [transferTickerOwnership(address _newOwner, string _ticker)](#transfertickerownership)
- [_deleteTickerOwnership(address _owner, string _ticker)](#_deletetickerownership)
- [changeExpiryLimit(uint256 _newExpiry)](#changeexpirylimit)
- [generateSecurityToken(string _name, string _ticker, string _tokenDetails, bool _divisible)](#generatesecuritytoken)
- [generateNewSecurityToken(string _name, string _ticker, string _tokenDetails, bool _divisible, address _treasuryWallet, uint256 _protocolVersion)](#generatenewsecuritytoken)
- [refreshSecurityToken(string _name, string _ticker, string _tokenDetails, bool _divisible, address _treasuryWallet)](#refreshsecuritytoken)
- [_deployToken(string _name, string _ticker, string _tokenDetails, address _issuer, bool _divisible, address _wallet, uint256 _protocolVersion)](#_deploytoken)
- [modifyExistingSecurityToken(string _ticker, address _owner, address _securityToken, string _tokenDetails, uint256 _deployedAt)](#modifyexistingsecuritytoken)
- [modifySecurityToken(string , string _ticker, address _owner, address _securityToken, string _tokenDetails, uint256 _deployedAt)](#modifysecuritytoken)
- [_storeSecurityTokenData(address _securityToken, string _ticker, string _tokenDetails, uint256 _deployedAt)](#_storesecuritytokendata)
- [isSecurityToken(address _securityToken)](#issecuritytoken)
- [transferOwnership(address _newOwner)](#transferownership)
- [pause()](#pause)
- [unpause()](#unpause)
- [changeTickerRegistrationFee(uint256 _tickerRegFee)](#changetickerregistrationfee)
- [_changeTickerRegistrationFee(uint256 _oldFee, uint256 _newFee)](#_changetickerregistrationfee)
- [changeSecurityLaunchFee(uint256 _stLaunchFee)](#changesecuritylaunchfee)
- [_changeSecurityLaunchFee(uint256 _oldFee, uint256 _newFee)](#_changesecuritylaunchfee)
- [changeFeesAmountAndCurrency(uint256 _tickerRegFee, uint256 _stLaunchFee, bool _isFeeInPoly)](#changefeesamountandcurrency)
- [reclaimERC20(address _tokenContract)](#reclaimerc20)
- [setProtocolFactory(address _STFactoryAddress, uint8 _major, uint8 _minor, uint8 _patch)](#setprotocolfactory)
- [_setProtocolFactory(address _STFactoryAddress, uint8 _major, uint8 _minor, uint8 _patch)](#_setprotocolfactory)
- [removeProtocolFactory(uint8 _major, uint8 _minor, uint8 _patch)](#removeprotocolfactory)
- [setLatestVersion(uint8 _major, uint8 _minor, uint8 _patch)](#setlatestversion)
- [_setLatestVersion(uint8 _major, uint8 _minor, uint8 _patch)](#_setlatestversion)
- [updatePolyTokenAddress(address _newAddress)](#updatepolytokenaddress)
- [isPaused()](#ispaused)
- [owner()](#owner)

### _onlyOwner

```js
function _onlyOwner() internal view
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### _whenNotPausedOrOwner

```js
function _whenNotPausedOrOwner() internal view
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### 

```js
function () public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### initialize

Initializes instance of STR

```js
function initialize(address _polymathRegistry, uint256 _stLaunchFee, uint256 _tickerRegFee, address _owner, address _getterContract) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _polymathRegistry | address | is the address of the Polymath Registry | 
| _stLaunchFee | uint256 | is the fee in USD required to launch a token | 
| _tickerRegFee | uint256 | is the fee in USD required to register a ticker | 
| _owner | address | is the owner of the STR, | 
| _getterContract | address | Contract address of the contract which consists getter functions. | 

### updateFromRegistry

Used to update the polyToken contract address

```js
function updateFromRegistry() external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### _updateFromRegistry

```js
function _updateFromRegistry() internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### _takeFee

Converts USD fees into POLY amounts

```js
function _takeFee(bytes32 _feeType) internal nonpayable
returns(uint256, uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _feeType | bytes32 |  | 

### getFees

Returns the usd & poly fee for a particular feetype

```js
function getFees(bytes32 _feeType) public nonpayable
returns(usdFee uint256, polyFee uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _feeType | bytes32 | Key corresponding to fee type | 

### getSecurityTokenLaunchFee

Gets the security token launch fee

```js
function getSecurityTokenLaunchFee() public nonpayable
returns(polyFee uint256)
```

**Returns**

Fee amount

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getTickerRegistrationFee

Gets the ticker registration fee

```js
function getTickerRegistrationFee() public nonpayable
returns(polyFee uint256)
```

**Returns**

Fee amount

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### setGetterRegistry

Set the getter contract address

```js
function setGetterRegistry(address _getterContract) public nonpayable onlyOwnerOrSelf 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _getterContract | address | Address of the contract | 

### _implementation

⤾ overrides [Proxy._implementation](Proxy.md#_implementation)

```js
function _implementation() internal view
returns(address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### registerNewTicker

Registers the token ticker to the selected owner

```js
function registerNewTicker(address _owner, string _ticker) public nonpayable whenNotPausedOrOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _owner | address | is address of the owner of the token | 
| _ticker | string | is unique token ticker | 

### registerTicker

This function is just for backwards compatibility

```js
function registerTicker(address _owner, string _ticker, string _tokenName) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _owner | address |  | 
| _ticker | string |  | 
| _tokenName | string |  | 

### _addTicker

Internal - Sets the details of the ticker

```js
function _addTicker(address _owner, string _ticker, uint256 _registrationDate, uint256 _expiryDate, bool _status, bool _fromAdmin, uint256 _polyFee, uint256 _usdFee) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _owner | address |  | 
| _ticker | string |  | 
| _registrationDate | uint256 |  | 
| _expiryDate | uint256 |  | 
| _status | bool |  | 
| _fromAdmin | bool |  | 
| _polyFee | uint256 |  | 
| _usdFee | uint256 |  | 

### modifyExistingTicker

Modifies the ticker details. Only Polymath has the ability to do so.

```js
function modifyExistingTicker(address _owner, string _ticker, uint256 _registrationDate, uint256 _expiryDate, bool _status) public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _owner | address | is the owner of the token | 
| _ticker | string | is the token ticker | 
| _registrationDate | uint256 | is the date at which ticker is registered | 
| _expiryDate | uint256 | is the expiry date for the ticker | 
| _status | bool | is the token deployment status | 

### modifyTicker

This function is just for backwards compatibility

```js
function modifyTicker(address _owner, string _ticker, string _tokenName, uint256 _registrationDate, uint256 _expiryDate, bool _status) external nonpayable
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

### _modifyTicker

Internal -- Modifies the ticker details.

```js
function _modifyTicker(address _owner, string _ticker, uint256 _registrationDate, uint256 _expiryDate, bool _status) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _owner | address |  | 
| _ticker | string |  | 
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

Removes the ticker details, associated ownership & security token mapping

```js
function removeTicker(string _ticker) public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _ticker | string | is the token ticker | 

### tickerAvailable

Checks if the entered ticker is registered and has not expired

```js
function tickerAvailable(string _ticker) public view
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
function _storeTickerDetails(string _ticker, address _owner, uint256 _registrationDate, uint256 _expiryDate, bool _status) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _ticker | string |  | 
| _owner | address |  | 
| _registrationDate | uint256 |  | 
| _expiryDate | uint256 |  | 
| _status | bool |  | 

### transferTickerOwnership

Transfers the ownership of the ticker

```js
function transferTickerOwnership(address _newOwner, string _ticker) public nonpayable whenNotPausedOrOwner 
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

Changes the expiry time for the token ticker. Only available to Polymath.

```js
function changeExpiryLimit(uint256 _newExpiry) public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _newExpiry | uint256 | is the new expiry for newly generated tickers | 

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
function generateNewSecurityToken(string _name, string _ticker, string _tokenDetails, bool _divisible, address _treasuryWallet, uint256 _protocolVersion) public nonpayable whenNotPausedOrOwner 
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
function refreshSecurityToken(string _name, string _ticker, string _tokenDetails, bool _divisible, address _treasuryWallet) public nonpayable whenNotPausedOrOwner 
returns(address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _name | string | is the name of the token | 
| _ticker | string | is the ticker symbol of the security token | 
| _tokenDetails | string | is the off-chain details of the token | 
| _divisible | bool | is whether or not the token is divisible | 
| _treasuryWallet | address |  | 

### _deployToken

```js
function _deployToken(string _name, string _ticker, string _tokenDetails, address _issuer, bool _divisible, address _wallet, uint256 _protocolVersion) internal nonpayable
returns(newSecurityTokenAddress address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _name | string |  | 
| _ticker | string |  | 
| _tokenDetails | string |  | 
| _issuer | address |  | 
| _divisible | bool |  | 
| _wallet | address |  | 
| _protocolVersion | uint256 |  | 

### modifyExistingSecurityToken

Adds a new custom Security Token and saves it to the registry. (Token should follow the ISecurityToken interface)

```js
function modifyExistingSecurityToken(string _ticker, address _owner, address _securityToken, string _tokenDetails, uint256 _deployedAt) public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _ticker | string | is the ticker symbol of the security token | 
| _owner | address | is the owner of the token | 
| _securityToken | address | is the address of the securityToken | 
| _tokenDetails | string | is the off-chain details of the token | 
| _deployedAt | uint256 | is the timestamp at which the security token is deployed | 

### modifySecurityToken

This function is just for backwards compatibility

```js
function modifySecurityToken(string , string _ticker, address _owner, address _securityToken, string _tokenDetails, uint256 _deployedAt) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
|  | string |  | 
| _ticker | string |  | 
| _owner | address |  | 
| _securityToken | address |  | 
| _tokenDetails | string |  | 
| _deployedAt | uint256 |  | 

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

### transferOwnership

Allows the current owner to transfer control of the contract to a newOwner.

```js
function transferOwnership(address _newOwner) public nonpayable onlyOwner 
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

Sets the ticker registration fee in USD tokens. Only Polymath.

```js
function changeTickerRegistrationFee(uint256 _tickerRegFee) public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _tickerRegFee | uint256 | is the registration fee in USD tokens (base 18 decimals) | 

### _changeTickerRegistrationFee

```js
function _changeTickerRegistrationFee(uint256 _oldFee, uint256 _newFee) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _oldFee | uint256 |  | 
| _newFee | uint256 |  | 

### changeSecurityLaunchFee

Sets the ticker registration fee in USD tokens. Only Polymath.

```js
function changeSecurityLaunchFee(uint256 _stLaunchFee) public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _stLaunchFee | uint256 | is the registration fee in USD tokens (base 18 decimals) | 

### _changeSecurityLaunchFee

```js
function _changeSecurityLaunchFee(uint256 _oldFee, uint256 _newFee) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _oldFee | uint256 |  | 
| _newFee | uint256 |  | 

### changeFeesAmountAndCurrency

Sets the ticker registration and ST launch fee amount and currency

```js
function changeFeesAmountAndCurrency(uint256 _tickerRegFee, uint256 _stLaunchFee, bool _isFeeInPoly) public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _tickerRegFee | uint256 | is the ticker registration fee (base 18 decimals) | 
| _stLaunchFee | uint256 | is the st generation fee (base 18 decimals) | 
| _isFeeInPoly | bool | defines if the fee is in poly or usd | 

### reclaimERC20

Reclaims all ERC20Basic compatible tokens

```js
function reclaimERC20(address _tokenContract) public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _tokenContract | address | is the address of the token contract | 

### setProtocolFactory

Changes the SecurityToken contract for a particular factory version

```js
function setProtocolFactory(address _STFactoryAddress, uint8 _major, uint8 _minor, uint8 _patch) public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _STFactoryAddress | address | is the address of the proxy. | 
| _major | uint8 | Major version of the proxy. | 
| _minor | uint8 | Minor version of the proxy. | 
| _patch | uint8 | Patch version of the proxy | 

### _setProtocolFactory

```js
function _setProtocolFactory(address _STFactoryAddress, uint8 _major, uint8 _minor, uint8 _patch) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _STFactoryAddress | address |  | 
| _major | uint8 |  | 
| _minor | uint8 |  | 
| _patch | uint8 |  | 

### removeProtocolFactory

Removes a STFactory

```js
function removeProtocolFactory(uint8 _major, uint8 _minor, uint8 _patch) public nonpayable onlyOwner 
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
function setLatestVersion(uint8 _major, uint8 _minor, uint8 _patch) public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _major | uint8 | Major version of the proxy. | 
| _minor | uint8 | Minor version of the proxy. | 
| _patch | uint8 | Patch version of the proxy | 

### _setLatestVersion

```js
function _setLatestVersion(uint8 _major, uint8 _minor, uint8 _patch) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _major | uint8 |  | 
| _minor | uint8 |  | 
| _patch | uint8 |  | 

### updatePolyTokenAddress

Changes the PolyToken address. Only Polymath.

```js
function updatePolyTokenAddress(address _newAddress) public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _newAddress | address | is the address of the polytoken. | 

### isPaused

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

