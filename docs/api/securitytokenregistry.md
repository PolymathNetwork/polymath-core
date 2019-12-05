---
id: version-3.0.0-SecurityTokenRegistry
title: SecurityTokenRegistry
original_id: SecurityTokenRegistry
---

# Registry contract for issuers to register their tickers and security tokens \(SecurityTokenRegistry.s

View Source: [contracts/SecurityTokenRegistry.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/SecurityTokenRegistry.sol)

**↗ Extends:** [**EternalStorage**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/EternalStorage.md)**,** [**Proxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/Proxy.md) **↘ Derived Contracts:** [**SecurityTokenRegistryMock**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/SecurityTokenRegistryMock.md)

**SecurityTokenRegistry**

## Contract Members

**Constants & Variables**

```javascript
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

```javascript
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

* [onlyOwner](securitytokenregistry.md#onlyowner)
* [onlyOwnerOrSelf](securitytokenregistry.md#onlyownerorself)
* [whenNotPausedOrOwner](securitytokenregistry.md#whennotpausedorowner)
* [whenNotPaused](securitytokenregistry.md#whennotpaused)
* [whenPaused](securitytokenregistry.md#whenpaused)

### onlyOwner

Throws if called by any account other than the owner.

```javascript
modifier onlyOwner() internal
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### onlyOwnerOrSelf

```javascript
modifier onlyOwnerOrSelf() internal
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### whenNotPausedOrOwner

Modifier to make a function callable only when the contract is not paused.

```javascript
modifier whenNotPausedOrOwner() internal
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### whenNotPaused

Modifier to make a function callable only when the contract is not paused and ignore is msg.sender is owner.

```javascript
modifier whenNotPaused() internal
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### whenPaused

Modifier to make a function callable only when the contract is paused.

```javascript
modifier whenPaused() internal
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


## Functions

* [\_onlyOwner\(\)](securitytokenregistry.md#_onlyowner)
* [\_whenNotPausedOrOwner\(\)](securitytokenregistry.md#_whennotpausedorowner)
* [\(\)](securitytokenregistry.md)
* [initialize\(address \_polymathRegistry, uint256 \_stLaunchFee, uint256 \_tickerRegFee, address \_owner, address \_getterContract\)](securitytokenregistry.md#initialize)
* [updateFromRegistry\(\)](securitytokenregistry.md#updatefromregistry)
* [\_updateFromRegistry\(\)](securitytokenregistry.md#_updatefromregistry)
* [\_takeFee\(bytes32 \_feeType\)](securitytokenregistry.md#_takefee)
* [getFees\(bytes32 \_feeType\)](securitytokenregistry.md#getfees)
* [getSecurityTokenLaunchFee\(\)](securitytokenregistry.md#getsecuritytokenlaunchfee)
* [getTickerRegistrationFee\(\)](securitytokenregistry.md#gettickerregistrationfee)
* [setGetterRegistry\(address \_getterContract\)](securitytokenregistry.md#setgetterregistry)
* [\_implementation\(\)](securitytokenregistry.md#_implementation)
* [registerNewTicker\(address \_owner, string \_ticker\)](securitytokenregistry.md#registernewticker)
* [registerTicker\(address \_owner, string \_ticker, string \_tokenName\)](securitytokenregistry.md#registerticker)
* [\_addTicker\(address \_owner, string \_ticker, uint256 \_registrationDate, uint256 \_expiryDate, bool \_status, bool \_fromAdmin, uint256 \_polyFee, uint256 \_usdFee\)](securitytokenregistry.md#_addticker)
* [modifyExistingTicker\(address \_owner, string \_ticker, uint256 \_registrationDate, uint256 \_expiryDate, bool \_status\)](securitytokenregistry.md#modifyexistingticker)
* [modifyTicker\(address \_owner, string \_ticker, string \_tokenName, uint256 \_registrationDate, uint256 \_expiryDate, bool \_status\)](securitytokenregistry.md#modifyticker)
* [\_modifyTicker\(address \_owner, string \_ticker, uint256 \_registrationDate, uint256 \_expiryDate, bool \_status\)](securitytokenregistry.md#_modifyticker)
* [\_tickerOwner\(string \_ticker\)](securitytokenregistry.md#_tickerowner)
* [removeTicker\(string \_ticker\)](securitytokenregistry.md#removeticker)
* [tickerAvailable\(string \_ticker\)](securitytokenregistry.md#tickeravailable)
* [\_tickerStatus\(string \_ticker\)](securitytokenregistry.md#_tickerstatus)
* [\_setTickerOwnership\(address \_owner, string \_ticker\)](securitytokenregistry.md#_settickerownership)
* [\_storeTickerDetails\(string \_ticker, address \_owner, uint256 \_registrationDate, uint256 \_expiryDate, bool \_status\)](securitytokenregistry.md#_storetickerdetails)
* [transferTickerOwnership\(address \_newOwner, string \_ticker\)](securitytokenregistry.md#transfertickerownership)
* [\_deleteTickerOwnership\(address \_owner, string \_ticker\)](securitytokenregistry.md#_deletetickerownership)
* [changeExpiryLimit\(uint256 \_newExpiry\)](securitytokenregistry.md#changeexpirylimit)
* [generateSecurityToken\(string \_name, string \_ticker, string \_tokenDetails, bool \_divisible\)](securitytokenregistry.md#generatesecuritytoken)
* [generateNewSecurityToken\(string \_name, string \_ticker, string \_tokenDetails, bool \_divisible, address \_treasuryWallet, uint256 \_protocolVersion\)](securitytokenregistry.md#generatenewsecuritytoken)
* [refreshSecurityToken\(string \_name, string \_ticker, string \_tokenDetails, bool \_divisible, address \_treasuryWallet\)](securitytokenregistry.md#refreshsecuritytoken)
* [\_deployToken\(string \_name, string \_ticker, string \_tokenDetails, address \_issuer, bool \_divisible, address \_wallet, uint256 \_protocolVersion\)](securitytokenregistry.md#_deploytoken)
* [modifyExistingSecurityToken\(string \_ticker, address \_owner, address \_securityToken, string \_tokenDetails, uint256 \_deployedAt\)](securitytokenregistry.md#modifyexistingsecuritytoken)
* [modifySecurityToken\(string , string \_ticker, address \_owner, address \_securityToken, string \_tokenDetails, uint256 \_deployedAt\)](securitytokenregistry.md#modifysecuritytoken)
* [\_storeSecurityTokenData\(address \_securityToken, string \_ticker, string \_tokenDetails, uint256 \_deployedAt\)](securitytokenregistry.md#_storesecuritytokendata)
* [isSecurityToken\(address \_securityToken\)](securitytokenregistry.md#issecuritytoken)
* [transferOwnership\(address \_newOwner\)](securitytokenregistry.md#transferownership)
* [pause\(\)](securitytokenregistry.md#pause)
* [unpause\(\)](securitytokenregistry.md#unpause)
* [changeTickerRegistrationFee\(uint256 \_tickerRegFee\)](securitytokenregistry.md#changetickerregistrationfee)
* [\_changeTickerRegistrationFee\(uint256 \_oldFee, uint256 \_newFee\)](securitytokenregistry.md#_changetickerregistrationfee)
* [changeSecurityLaunchFee\(uint256 \_stLaunchFee\)](securitytokenregistry.md#changesecuritylaunchfee)
* [\_changeSecurityLaunchFee\(uint256 \_oldFee, uint256 \_newFee\)](securitytokenregistry.md#_changesecuritylaunchfee)
* [changeFeesAmountAndCurrency\(uint256 \_tickerRegFee, uint256 \_stLaunchFee, bool \_isFeeInPoly\)](securitytokenregistry.md#changefeesamountandcurrency)
* [reclaimERC20\(address \_tokenContract\)](securitytokenregistry.md#reclaimerc20)
* [setProtocolFactory\(address \_STFactoryAddress, uint8 \_major, uint8 \_minor, uint8 \_patch\)](securitytokenregistry.md#setprotocolfactory)
* [\_setProtocolFactory\(address \_STFactoryAddress, uint8 \_major, uint8 \_minor, uint8 \_patch\)](securitytokenregistry.md#_setprotocolfactory)
* [removeProtocolFactory\(uint8 \_major, uint8 \_minor, uint8 \_patch\)](securitytokenregistry.md#removeprotocolfactory)
* [setLatestVersion\(uint8 \_major, uint8 \_minor, uint8 \_patch\)](securitytokenregistry.md#setlatestversion)
* [\_setLatestVersion\(uint8 \_major, uint8 \_minor, uint8 \_patch\)](securitytokenregistry.md#_setlatestversion)
* [updatePolyTokenAddress\(address \_newAddress\)](securitytokenregistry.md#updatepolytokenaddress)
* [isPaused\(\)](securitytokenregistry.md#ispaused)
* [owner\(\)](securitytokenregistry.md#owner)

### \_onlyOwner

```javascript
function _onlyOwner() internal view
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### \_whenNotPausedOrOwner

```javascript
function _whenNotPausedOrOwner() internal view
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


```javascript
function () public nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### initialize

Initializes instance of STR

```javascript
function initialize(address _polymathRegistry, uint256 _stLaunchFee, uint256 _tickerRegFee, address _owner, address _getterContract) public nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_polymathRegistry | address | is the address of the Polymath Registry |
| \_stLaunchFee | uint256 | is the fee in USD required to launch a token |
| \_tickerRegFee | uint256 | is the fee in USD required to register a ticker |
| \_owner | address | is the owner of the STR, |
| \_getterContract | address | Contract address of the contract which consists getter functions. |

### updateFromRegistry

Used to update the polyToken contract address

```javascript
function updateFromRegistry() external nonpayable onlyOwner
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### \_updateFromRegistry

```javascript
function _updateFromRegistry() internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### \_takeFee

Converts USD fees into POLY amounts

```javascript
function _takeFee(bytes32 _feeType) internal nonpayable
returns(uint256, uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_feeType | bytes32 |  |

### getFees

Returns the usd & poly fee for a particular feetype

```javascript
function getFees(bytes32 _feeType) public nonpayable
returns(usdFee uint256, polyFee uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_feeType | bytes32 | Key corresponding to fee type |

### getSecurityTokenLaunchFee

Gets the security token launch fee

```javascript
function getSecurityTokenLaunchFee() public nonpayable
returns(polyFee uint256)
```

**Returns**

Fee amount

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### getTickerRegistrationFee

Gets the ticker registration fee

```javascript
function getTickerRegistrationFee() public nonpayable
returns(polyFee uint256)
```

**Returns**

Fee amount

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### setGetterRegistry

Set the getter contract address

```javascript
function setGetterRegistry(address _getterContract) public nonpayable onlyOwnerOrSelf
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_getterContract | address | Address of the contract |

### \_implementation

⤾ overrides [Proxy.\_implementation](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/Proxy.md#_implementation)

```javascript
function _implementation() internal view
returns(address)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### registerNewTicker

Registers the token ticker to the selected owner

```javascript
function registerNewTicker(address _owner, string _ticker) public nonpayable whenNotPausedOrOwner
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_owner | address | is address of the owner of the token |
| \_ticker | string | is unique token ticker |

### registerTicker

This function is just for backwards compatibility

```javascript
function registerTicker(address _owner, string _ticker, string _tokenName) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_owner | address |  |
| \_ticker | string |  |
| \_tokenName | string |  |

### \_addTicker

Internal - Sets the details of the ticker

```javascript
function _addTicker(address _owner, string _ticker, uint256 _registrationDate, uint256 _expiryDate, bool _status, bool _fromAdmin, uint256 _polyFee, uint256 _usdFee) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_owner | address |  |
| \_ticker | string |  |
| \_registrationDate | uint256 |  |
| \_expiryDate | uint256 |  |
| \_status | bool |  |
| \_fromAdmin | bool |  |
| \_polyFee | uint256 |  |
| \_usdFee | uint256 |  |

### modifyExistingTicker

Modifies the ticker details. Only Polymath has the ability to do so.

```javascript
function modifyExistingTicker(address _owner, string _ticker, uint256 _registrationDate, uint256 _expiryDate, bool _status) public nonpayable onlyOwner
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_owner | address | is the owner of the token |
| \_ticker | string | is the token ticker |
| \_registrationDate | uint256 | is the date at which ticker is registered |
| \_expiryDate | uint256 | is the expiry date for the ticker |
| \_status | bool | is the token deployment status |

### modifyTicker

This function is just for backwards compatibility

```javascript
function modifyTicker(address _owner, string _ticker, string _tokenName, uint256 _registrationDate, uint256 _expiryDate, bool _status) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_owner | address |  |
| \_ticker | string |  |
| \_tokenName | string |  |
| \_registrationDate | uint256 |  |
| \_expiryDate | uint256 |  |
| \_status | bool |  |

### \_modifyTicker

Internal -- Modifies the ticker details.

```javascript
function _modifyTicker(address _owner, string _ticker, uint256 _registrationDate, uint256 _expiryDate, bool _status) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_owner | address |  |
| \_ticker | string |  |
| \_registrationDate | uint256 |  |
| \_expiryDate | uint256 |  |
| \_status | bool |  |

### \_tickerOwner

```javascript
function _tickerOwner(string _ticker) internal view
returns(address)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_ticker | string |  |

### removeTicker

Removes the ticker details, associated ownership & security token mapping

```javascript
function removeTicker(string _ticker) public nonpayable onlyOwner
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_ticker | string | is the token ticker |

### tickerAvailable

Checks if the entered ticker is registered and has not expired

```javascript
function tickerAvailable(string _ticker) public view
returns(bool)
```

**Returns**

bool

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_ticker | string | is the token ticker |

### \_tickerStatus

```javascript
function _tickerStatus(string _ticker) internal view
returns(bool)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_ticker | string |  |

### \_setTickerOwnership

Internal - Sets the ticker owner

```javascript
function _setTickerOwnership(address _owner, string _ticker) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_owner | address | is the address of the owner of the ticker |
| \_ticker | string | is the ticker symbol |

### \_storeTickerDetails

Internal - Stores the ticker details

```javascript
function _storeTickerDetails(string _ticker, address _owner, uint256 _registrationDate, uint256 _expiryDate, bool _status) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_ticker | string |  |
| \_owner | address |  |
| \_registrationDate | uint256 |  |
| \_expiryDate | uint256 |  |
| \_status | bool |  |

### transferTickerOwnership

Transfers the ownership of the ticker

```javascript
function transferTickerOwnership(address _newOwner, string _ticker) public nonpayable whenNotPausedOrOwner
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_newOwner | address | is the address of the new owner of the ticker |
| \_ticker | string | is the ticker symbol |

### \_deleteTickerOwnership

Internal - Removes the owner of a ticker

```javascript
function _deleteTickerOwnership(address _owner, string _ticker) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_owner | address |  |
| \_ticker | string |  |

### changeExpiryLimit

Changes the expiry time for the token ticker. Only available to Polymath.

```javascript
function changeExpiryLimit(uint256 _newExpiry) public nonpayable onlyOwner
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_newExpiry | uint256 | is the new expiry for newly generated tickers |

### generateSecurityToken

Deploys an instance of a new Security Token of version 2.0 and records it to the registry

```javascript
function generateSecurityToken(string _name, string _ticker, string _tokenDetails, bool _divisible) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_name | string | is the name of the token |
| \_ticker | string | is the ticker symbol of the security token |
| \_tokenDetails | string | is the off-chain details of the token |
| \_divisible | bool | is whether or not the token is divisible |

### generateNewSecurityToken

Deploys an instance of a new Security Token and records it to the registry

```javascript
function generateNewSecurityToken(string _name, string _ticker, string _tokenDetails, bool _divisible, address _treasuryWallet, uint256 _protocolVersion) public nonpayable whenNotPausedOrOwner
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_name | string | is the name of the token |
| \_ticker | string | is the ticker symbol of the security token |
| \_tokenDetails | string | is the off-chain details of the token |
| \_divisible | bool | is whether or not the token is divisible |
| \_treasuryWallet | address | Ethereum address which will holds the STs. |
| \_protocolVersion | uint256 | Version of securityToken contract |

* `_protocolVersion` is the packed value of uin8\[3\] array \(it will be calculated offchain\)
* if \_protocolVersion == 0 then latest version of securityToken will be generated \| 

### refreshSecurityToken

Deploys an instance of a new Security Token and replaces the old one in the registry This can be used to upgrade from version 2.0 of ST to 3.0 or in case something goes wrong with earlier ST

```javascript
function refreshSecurityToken(string _name, string _ticker, string _tokenDetails, bool _divisible, address _treasuryWallet) public nonpayable whenNotPausedOrOwner 
returns(address)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_name | string | is the name of the token |
| \_ticker | string | is the ticker symbol of the security token |
| \_tokenDetails | string | is the off-chain details of the token |
| \_divisible | bool | is whether or not the token is divisible |
| \_treasuryWallet | address |  |

### \_deployToken

```javascript
function _deployToken(string _name, string _ticker, string _tokenDetails, address _issuer, bool _divisible, address _wallet, uint256 _protocolVersion) internal nonpayable
returns(newSecurityTokenAddress address)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_name | string |  |
| \_ticker | string |  |
| \_tokenDetails | string |  |
| \_issuer | address |  |
| \_divisible | bool |  |
| \_wallet | address |  |
| \_protocolVersion | uint256 |  |

### modifyExistingSecurityToken

Adds a new custom Security Token and saves it to the registry. \(Token should follow the ISecurityToken interface\)

```javascript
function modifyExistingSecurityToken(string _ticker, address _owner, address _securityToken, string _tokenDetails, uint256 _deployedAt) public nonpayable onlyOwner
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_ticker | string | is the ticker symbol of the security token |
| \_owner | address | is the owner of the token |
| \_securityToken | address | is the address of the securityToken |
| \_tokenDetails | string | is the off-chain details of the token |
| \_deployedAt | uint256 | is the timestamp at which the security token is deployed |

### modifySecurityToken

This function is just for backwards compatibility

```javascript
function modifySecurityToken(string , string _ticker, address _owner, address _securityToken, string _tokenDetails, uint256 _deployedAt) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
|  | string |  |
| \_ticker | string |  |
| \_owner | address |  |
| \_securityToken | address |  |
| \_tokenDetails | string |  |
| \_deployedAt | uint256 |  |

### \_storeSecurityTokenData

Internal - Stores the security token details

```javascript
function _storeSecurityTokenData(address _securityToken, string _ticker, string _tokenDetails, uint256 _deployedAt) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_securityToken | address |  |
| \_ticker | string |  |
| \_tokenDetails | string |  |
| \_deployedAt | uint256 |  |

### isSecurityToken

Checks that Security Token is registered

```javascript
function isSecurityToken(address _securityToken) external view
returns(bool)
```

**Returns**

bool

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_securityToken | address | is the address of the security token |

### transferOwnership

Allows the current owner to transfer control of the contract to a newOwner.

```javascript
function transferOwnership(address _newOwner) public nonpayable onlyOwner
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_newOwner | address | The address to transfer ownership to. |

### pause

Called by the owner to pause, triggers stopped state

```javascript
function pause() external nonpayable whenNotPaused onlyOwner
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### unpause

Called by the owner to unpause, returns to normal state

```javascript
function unpause() external nonpayable whenPaused onlyOwner
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### changeTickerRegistrationFee

Sets the ticker registration fee in USD tokens. Only Polymath.

```javascript
function changeTickerRegistrationFee(uint256 _tickerRegFee) public nonpayable onlyOwner
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_tickerRegFee | uint256 | is the registration fee in USD tokens \(base 18 decimals\) |

### \_changeTickerRegistrationFee

```javascript
function _changeTickerRegistrationFee(uint256 _oldFee, uint256 _newFee) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_oldFee | uint256 |  |
| \_newFee | uint256 |  |

### changeSecurityLaunchFee

Sets the ticker registration fee in USD tokens. Only Polymath.

```javascript
function changeSecurityLaunchFee(uint256 _stLaunchFee) public nonpayable onlyOwner
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_stLaunchFee | uint256 | is the registration fee in USD tokens \(base 18 decimals\) |

### \_changeSecurityLaunchFee

```javascript
function _changeSecurityLaunchFee(uint256 _oldFee, uint256 _newFee) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_oldFee | uint256 |  |
| \_newFee | uint256 |  |

### changeFeesAmountAndCurrency

Sets the ticker registration and ST launch fee amount and currency

```javascript
function changeFeesAmountAndCurrency(uint256 _tickerRegFee, uint256 _stLaunchFee, bool _isFeeInPoly) public nonpayable onlyOwner
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_tickerRegFee | uint256 | is the ticker registration fee \(base 18 decimals\) |
| \_stLaunchFee | uint256 | is the st generation fee \(base 18 decimals\) |
| \_isFeeInPoly | bool | defines if the fee is in poly or usd |

### reclaimERC20

Reclaims all ERC20Basic compatible tokens

```javascript
function reclaimERC20(address _tokenContract) public nonpayable onlyOwner
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_tokenContract | address | is the address of the token contract |

### setProtocolFactory

Changes the SecurityToken contract for a particular factory version

```javascript
function setProtocolFactory(address _STFactoryAddress, uint8 _major, uint8 _minor, uint8 _patch) public nonpayable onlyOwner
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_STFactoryAddress | address | is the address of the proxy. |
| \_major | uint8 | Major version of the proxy. |
| \_minor | uint8 | Minor version of the proxy. |
| \_patch | uint8 | Patch version of the proxy |

### \_setProtocolFactory

```javascript
function _setProtocolFactory(address _STFactoryAddress, uint8 _major, uint8 _minor, uint8 _patch) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_STFactoryAddress | address |  |
| \_major | uint8 |  |
| \_minor | uint8 |  |
| \_patch | uint8 |  |

### removeProtocolFactory

Removes a STFactory

```javascript
function removeProtocolFactory(uint8 _major, uint8 _minor, uint8 _patch) public nonpayable onlyOwner
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_major | uint8 | Major version of the proxy. |
| \_minor | uint8 | Minor version of the proxy. |
| \_patch | uint8 | Patch version of the proxy |

### setLatestVersion

Changes the default protocol version

```javascript
function setLatestVersion(uint8 _major, uint8 _minor, uint8 _patch) public nonpayable onlyOwner
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_major | uint8 | Major version of the proxy. |
| \_minor | uint8 | Minor version of the proxy. |
| \_patch | uint8 | Patch version of the proxy |

### \_setLatestVersion

```javascript
function _setLatestVersion(uint8 _major, uint8 _minor, uint8 _patch) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_major | uint8 |  |
| \_minor | uint8 |  |
| \_patch | uint8 |  |

### updatePolyTokenAddress

Changes the PolyToken address. Only Polymath.

```javascript
function updatePolyTokenAddress(address _newAddress) public nonpayable onlyOwner
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_newAddress | address | is the address of the polytoken. |

### isPaused

Check whether the registry is paused or not

```javascript
function isPaused() public view
returns(bool)
```

**Returns**

bool

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### owner

Gets the owner of the contract

```javascript
function owner() public view
returns(address)
```

**Returns**

address owner

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


