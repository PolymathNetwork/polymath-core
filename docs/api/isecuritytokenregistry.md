---
id: version-3.0.0-ISecurityTokenRegistry
title: ISecurityTokenRegistry
original_id: ISecurityTokenRegistry
---

# Interface for the Polymath Security Token Registry contract \(ISecurityTokenRegistry.sol\)

View Source: [contracts/interfaces/ISecurityTokenRegistry.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/interfaces/ISecurityTokenRegistry.sol)

**ISecurityTokenRegistry**

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

## Functions

* [generateSecurityToken\(string \_name, string \_ticker, string \_tokenDetails, bool \_divisible\)](isecuritytokenregistry.md#generatesecuritytoken)
* [generateNewSecurityToken\(string \_name, string \_ticker, string \_tokenDetails, bool \_divisible, address \_treasuryWallet, uint256 \_protocolVersion\)](isecuritytokenregistry.md#generatenewsecuritytoken)
* [refreshSecurityToken\(string \_name, string \_ticker, string \_tokenDetails, bool \_divisible, address \_treasuryWallet\)](isecuritytokenregistry.md#refreshsecuritytoken)
* [modifySecurityToken\(string \_name, string \_ticker, address \_owner, address \_securityToken, string \_tokenDetails, uint256 \_deployedAt\)](isecuritytokenregistry.md#modifysecuritytoken)
* [modifyExistingSecurityToken\(string \_ticker, address \_owner, address \_securityToken, string \_tokenDetails, uint256 \_deployedAt\)](isecuritytokenregistry.md#modifyexistingsecuritytoken)
* [modifyExistingTicker\(address \_owner, string \_ticker, uint256 \_registrationDate, uint256 \_expiryDate, bool \_status\)](isecuritytokenregistry.md#modifyexistingticker)
* [registerTicker\(address \_owner, string \_ticker, string \_tokenName\)](isecuritytokenregistry.md#registerticker)
* [registerNewTicker\(address \_owner, string \_ticker\)](isecuritytokenregistry.md#registernewticker)
* [isSecurityToken\(address \_securityToken\)](isecuritytokenregistry.md#issecuritytoken)
* [transferOwnership\(address \_newOwner\)](isecuritytokenregistry.md#transferownership)
* [getSecurityTokenAddress\(string \_ticker\)](isecuritytokenregistry.md#getsecuritytokenaddress)
* [getSecurityTokenData\(address \_securityToken\)](isecuritytokenregistry.md#getsecuritytokendata)
* [getSTFactoryAddress\(\)](isecuritytokenregistry.md#getstfactoryaddress)
* [getSTFactoryAddressOfVersion\(uint256 \_protocolVersion\)](isecuritytokenregistry.md#getstfactoryaddressofversion)
* [getLatestProtocolVersion\(\)](isecuritytokenregistry.md#getlatestprotocolversion)
* [getTickersByOwner\(address \_owner\)](isecuritytokenregistry.md#gettickersbyowner)
* [getTokensByOwner\(address \_owner\)](isecuritytokenregistry.md#gettokensbyowner)
* [getTokens\(\)](isecuritytokenregistry.md#gettokens)
* [getTickerDetails\(string \_ticker\)](isecuritytokenregistry.md#gettickerdetails)
* [modifyTicker\(address \_owner, string \_ticker, string \_tokenName, uint256 \_registrationDate, uint256 \_expiryDate, bool \_status\)](isecuritytokenregistry.md#modifyticker)
* [removeTicker\(string \_ticker\)](isecuritytokenregistry.md#removeticker)
* [transferTickerOwnership\(address \_newOwner, string \_ticker\)](isecuritytokenregistry.md#transfertickerownership)
* [changeExpiryLimit\(uint256 \_newExpiry\)](isecuritytokenregistry.md#changeexpirylimit)
* [changeTickerRegistrationFee\(uint256 \_tickerRegFee\)](isecuritytokenregistry.md#changetickerregistrationfee)
* [changeSecurityLaunchFee\(uint256 \_stLaunchFee\)](isecuritytokenregistry.md#changesecuritylaunchfee)
* [changeFeesAmountAndCurrency\(uint256 \_tickerRegFee, uint256 \_stLaunchFee, bool \_isFeeInPoly\)](isecuritytokenregistry.md#changefeesamountandcurrency)
* [setProtocolFactory\(address \_STFactoryAddress, uint8 \_major, uint8 \_minor, uint8 \_patch\)](isecuritytokenregistry.md#setprotocolfactory)
* [removeProtocolFactory\(uint8 \_major, uint8 \_minor, uint8 \_patch\)](isecuritytokenregistry.md#removeprotocolfactory)
* [setLatestVersion\(uint8 \_major, uint8 \_minor, uint8 \_patch\)](isecuritytokenregistry.md#setlatestversion)
* [updatePolyTokenAddress\(address \_newAddress\)](isecuritytokenregistry.md#updatepolytokenaddress)
* [updateFromRegistry\(\)](isecuritytokenregistry.md#updatefromregistry)
* [getSecurityTokenLaunchFee\(\)](isecuritytokenregistry.md#getsecuritytokenlaunchfee)
* [getTickerRegistrationFee\(\)](isecuritytokenregistry.md#gettickerregistrationfee)
* [setGetterRegistry\(address \_getterContract\)](isecuritytokenregistry.md#setgetterregistry)
* [getFees\(bytes32 \_feeType\)](isecuritytokenregistry.md#getfees)
* [getTokensByDelegate\(address \_delegate\)](isecuritytokenregistry.md#gettokensbydelegate)
* [getExpiryLimit\(\)](isecuritytokenregistry.md#getexpirylimit)
* [getTickerStatus\(string \_ticker\)](isecuritytokenregistry.md#gettickerstatus)
* [getIsFeeInPoly\(\)](isecuritytokenregistry.md#getisfeeinpoly)
* [getTickerOwner\(string \_ticker\)](isecuritytokenregistry.md#gettickerowner)
* [isPaused\(\)](isecuritytokenregistry.md#ispaused)
* [pause\(\)](isecuritytokenregistry.md#pause)
* [unpause\(\)](isecuritytokenregistry.md#unpause)
* [reclaimERC20\(address \_tokenContract\)](isecuritytokenregistry.md#reclaimerc20)
* [owner\(\)](isecuritytokenregistry.md#owner)
* [tickerAvailable\(string \_ticker\)](isecuritytokenregistry.md#tickeravailable)

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
function generateNewSecurityToken(string _name, string _ticker, string _tokenDetails, bool _divisible, address _treasuryWallet, uint256 _protocolVersion) external nonpayable
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
function refreshSecurityToken(string _name, string _ticker, string _tokenDetails, bool _divisible, address _treasuryWallet) external nonpayable
returns(securityToken address)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_name | string | is the name of the token |
| \_ticker | string | is the ticker symbol of the security token |
| \_tokenDetails | string | is the off-chain details of the token |
| \_divisible | bool | is whether or not the token is divisible |
| \_treasuryWallet | address |  |

### modifySecurityToken

Adds a new custom Security Token and saves it to the registry. \(Token should follow the ISecurityToken interface\)

```javascript
function modifySecurityToken(string _name, string _ticker, address _owner, address _securityToken, string _tokenDetails, uint256 _deployedAt) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_name | string | Name of the token |
| \_ticker | string | Ticker of the security token |
| \_owner | address | Owner of the token |
| \_securityToken | address | Address of the securityToken |
| \_tokenDetails | string | Off-chain details of the token |
| \_deployedAt | uint256 | Timestamp at which security token comes deployed on the ethereum blockchain |

### modifyExistingSecurityToken

Adds a new custom Security Token and saves it to the registry. \(Token should follow the ISecurityToken interface\)

```javascript
function modifyExistingSecurityToken(string _ticker, address _owner, address _securityToken, string _tokenDetails, uint256 _deployedAt) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_ticker | string | is the ticker symbol of the security token |
| \_owner | address | is the owner of the token |
| \_securityToken | address | is the address of the securityToken |
| \_tokenDetails | string | is the off-chain details of the token |
| \_deployedAt | uint256 | is the timestamp at which the security token is deployed |

### modifyExistingTicker

Modifies the ticker details. Only Polymath has the ability to do so.

```javascript
function modifyExistingTicker(address _owner, string _ticker, uint256 _registrationDate, uint256 _expiryDate, bool _status) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_owner | address | is the owner of the token |
| \_ticker | string | is the token ticker |
| \_registrationDate | uint256 | is the date at which ticker is registered |
| \_expiryDate | uint256 | is the expiry date for the ticker |
| \_status | bool | is the token deployment status |

### registerTicker

Registers the token ticker for its particular owner

```javascript
function registerTicker(address _owner, string _ticker, string _tokenName) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_owner | address | Address of the owner of the token |
| \_ticker | string | Token ticker |
| \_tokenName | string | Name of the token |

### registerNewTicker

Registers the token ticker to the selected owner

```javascript
function registerNewTicker(address _owner, string _ticker) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_owner | address | is address of the owner of the token |
| \_ticker | string | is unique token ticker |

### isSecurityToken

Check that Security Token is registered

```javascript
function isSecurityToken(address _securityToken) external view
returns(isValid bool)
```

**Returns**

bool

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_securityToken | address | Address of the Scurity token |

### transferOwnership

Allows the current owner to transfer control of the contract to a newOwner.

```javascript
function transferOwnership(address _newOwner) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_newOwner | address | The address to transfer ownership to. |

### getSecurityTokenAddress

Get security token address by ticker name

```javascript
function getSecurityTokenAddress(string _ticker) external view
returns(tokenAddress address)
```

**Returns**

address

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_ticker | string | Symbol of the Scurity token |

### getSecurityTokenData

Returns the security token data by address

```javascript
function getSecurityTokenData(address _securityToken) external view
returns(tokenSymbol string, tokenAddress address, tokenDetails string, tokenTime uint256)
```

**Returns**

string is the ticker of the security Token.

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_securityToken | address | is the address of the security token. |

### getSTFactoryAddress

Get the current STFactory Address

```javascript
function getSTFactoryAddress() external view
returns(stFactoryAddress address)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### getSTFactoryAddressOfVersion

Returns the STFactory Address of a particular version

```javascript
function getSTFactoryAddressOfVersion(uint256 _protocolVersion) external view
returns(stFactory address)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_protocolVersion | uint256 | Packed protocol version |

### getLatestProtocolVersion

Get Protocol version

```javascript
function getLatestProtocolVersion() external view
returns(protocolVersion uint8[])
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### getTickersByOwner

Used to get the ticker list as per the owner

```javascript
function getTickersByOwner(address _owner) external view
returns(tickers bytes32[])
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_owner | address | Address which owns the list of tickers |

### getTokensByOwner

Returns the list of tokens owned by the selected address

```javascript
function getTokensByOwner(address _owner) external view
returns(tokens address[])
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_owner | address | is the address which owns the list of tickers |

### getTokens

Returns the list of all tokens

```javascript
function getTokens() external view
returns(tokens address[])
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### getTickerDetails

Returns the owner and timestamp for a given ticker

```javascript
function getTickerDetails(string _ticker) external view
returns(tickerOwner address, tickerRegistration uint256, tickerExpiry uint256, tokenName string, tickerStatus bool)
```

**Returns**

address

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_ticker | string | ticker |

### modifyTicker

Modifies the ticker details. Only polymath account has the ability to do so. Only allowed to modify the tickers which are not yet deployed

```javascript
function modifyTicker(address _owner, string _ticker, string _tokenName, uint256 _registrationDate, uint256 _expiryDate, bool _status) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_owner | address | Owner of the token |
| \_ticker | string | Token ticker |
| \_tokenName | string | Name of the token |
| \_registrationDate | uint256 | Date on which ticker get registered |
| \_expiryDate | uint256 | Expiry date of the ticker |
| \_status | bool | Token deployed status |

### removeTicker

Removes the ticker details and associated ownership & security token mapping

```javascript
function removeTicker(string _ticker) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_ticker | string | Token ticker |

### transferTickerOwnership

Transfers the ownership of the ticker

```javascript
function transferTickerOwnership(address _newOwner, string _ticker) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_newOwner | address |  |
| \_ticker | string |  |

### changeExpiryLimit

Changes the expiry time for the token ticker

```javascript
function changeExpiryLimit(uint256 _newExpiry) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_newExpiry | uint256 | New time period for token ticker expiry |

### changeTickerRegistrationFee

Sets the ticker registration fee in USD tokens. Only Polymath.

```javascript
function changeTickerRegistrationFee(uint256 _tickerRegFee) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_tickerRegFee | uint256 | is the registration fee in USD tokens \(base 18 decimals\) |

### changeSecurityLaunchFee

Sets the ticker registration fee in USD tokens. Only Polymath.

```javascript
function changeSecurityLaunchFee(uint256 _stLaunchFee) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_stLaunchFee | uint256 | is the registration fee in USD tokens \(base 18 decimals\) |

### changeFeesAmountAndCurrency

Sets the ticker registration and ST launch fee amount and currency

```javascript
function changeFeesAmountAndCurrency(uint256 _tickerRegFee, uint256 _stLaunchFee, bool _isFeeInPoly) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_tickerRegFee | uint256 | is the ticker registration fee \(base 18 decimals\) |
| \_stLaunchFee | uint256 | is the st generation fee \(base 18 decimals\) |
| \_isFeeInPoly | bool | defines if the fee is in poly or usd |

### setProtocolFactory

Changes the SecurityToken contract for a particular factory version

```javascript
function setProtocolFactory(address _STFactoryAddress, uint8 _major, uint8 _minor, uint8 _patch) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_STFactoryAddress | address | is the address of the proxy. |
| \_major | uint8 | Major version of the proxy. |
| \_minor | uint8 | Minor version of the proxy. |
| \_patch | uint8 | Patch version of the proxy |

### removeProtocolFactory

Removes a STFactory

```javascript
function removeProtocolFactory(uint8 _major, uint8 _minor, uint8 _patch) external nonpayable
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
function setLatestVersion(uint8 _major, uint8 _minor, uint8 _patch) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_major | uint8 | Major version of the proxy. |
| \_minor | uint8 | Minor version of the proxy. |
| \_patch | uint8 | Patch version of the proxy |

### updatePolyTokenAddress

Changes the PolyToken address. Only Polymath.

```javascript
function updatePolyTokenAddress(address _newAddress) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_newAddress | address | is the address of the polytoken. |

### updateFromRegistry

Used to update the polyToken contract address

```javascript
function updateFromRegistry() external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### getSecurityTokenLaunchFee

Gets the security token launch fee

```javascript
function getSecurityTokenLaunchFee() external nonpayable
returns(fee uint256)
```

**Returns**

Fee amount

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### getTickerRegistrationFee

Gets the ticker registration fee

```javascript
function getTickerRegistrationFee() external nonpayable
returns(fee uint256)
```

**Returns**

Fee amount

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### setGetterRegistry

Set the getter contract address

```javascript
function setGetterRegistry(address _getterContract) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_getterContract | address | Address of the contract |

### getFees

Returns the usd & poly fee for a particular feetype

```javascript
function getFees(bytes32 _feeType) external nonpayable
returns(usdFee uint256, polyFee uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_feeType | bytes32 | Key corresponding to fee type |

### getTokensByDelegate

Returns the list of tokens to which the delegate has some access

```javascript
function getTokensByDelegate(address _delegate) external view
returns(tokens address[])
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_delegate | address | is the address for the delegate |

### getExpiryLimit

Gets the expiry limit

```javascript
function getExpiryLimit() external view
returns(expiry uint256)
```

**Returns**

Expiry limit

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### getTickerStatus

Gets the status of the ticker

```javascript
function getTickerStatus(string _ticker) external view
returns(status bool)
```

**Returns**

bool

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_ticker | string | Ticker whose status need to determine |

### getIsFeeInPoly

Gets the fee currency

```javascript
function getIsFeeInPoly() external view
returns(isInPoly bool)
```

**Returns**

true = poly, false = usd

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### getTickerOwner

Gets the owner of the ticker

```javascript
function getTickerOwner(string _ticker) external view
returns(owner address)
```

**Returns**

address Address of the owner

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_ticker | string | Ticker whose owner need to determine |

### isPaused

Checks whether the registry is paused or not

```javascript
function isPaused() external view
returns(paused bool)
```

**Returns**

bool

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### pause

Called by the owner to pause, triggers stopped state

```javascript
function pause() external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### unpause

Called by the owner to unpause, returns to normal state

```javascript
function unpause() external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### reclaimERC20

Reclaims all ERC20Basic compatible tokens

```javascript
function reclaimERC20(address _tokenContract) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_tokenContract | address | is the address of the token contract |

### owner

Gets the owner of the contract

```javascript
function owner() external view
returns(ownerAddress address)
```

**Returns**

address owner

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### tickerAvailable

Checks if the entered ticker is registered and has not expired

```javascript
function tickerAvailable(string _ticker) external view
returns(bool)
```

**Returns**

bool

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_ticker | string | is the token ticker |

