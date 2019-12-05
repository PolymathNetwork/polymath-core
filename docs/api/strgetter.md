---
id: version-3.0.0-STRGetter
title: STRGetter
original_id: STRGetter
---

# STRGetter.sol

View Source: [contracts/STRGetter.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/STRGetter.sol)

**↗ Extends:** [**EternalStorage**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/EternalStorage.md) **↘ Derived Contracts:** [**MockSTRGetter**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/MockSTRGetter.md)

**STRGetter**

## Contract Members

**Constants & Variables**

```javascript
bytes32 internal constant STLAUNCHFEE;
bytes32 internal constant TICKERREGFEE;
bytes32 internal constant EXPIRYLIMIT;
bytes32 internal constant IS_FEE_IN_POLY;
```

## Functions

* [getTickersByOwner\(address \_owner\)](strgetter.md#gettickersbyowner)
* [\_ownerInTicker\(bytes32 \_ticker\)](strgetter.md#_ownerinticker)
* [getTokensByOwner\(address \_owner\)](strgetter.md#gettokensbyowner)
* [getTokens\(\)](strgetter.md#gettokens)
* [\_getTokens\(bool \_allTokens, address \_owner\)](strgetter.md#_gettokens)
* [\_ownerInToken\(bytes32 \_ticker, bool \_allTokens, address \_owner\)](strgetter.md#_ownerintoken)
* [getTokensByDelegate\(address \_delegate\)](strgetter.md#gettokensbydelegate)
* [\_delegateInToken\(address \_token, address \_delegate\)](strgetter.md#_delegateintoken)
* [getTickerDetails\(string \_ticker\)](strgetter.md#gettickerdetails)
* [getSecurityTokenAddress\(string \_ticker\)](strgetter.md#getsecuritytokenaddress)
* [getSecurityTokenData\(address \_securityToken\)](strgetter.md#getsecuritytokendata)
* [getSTFactoryAddress\(\)](strgetter.md#getstfactoryaddress)
* [getSTFactoryAddressOfVersion\(uint256 \_protocolVersion\)](strgetter.md#getstfactoryaddressofversion)
* [getLatestProtocolVersion\(\)](strgetter.md#getlatestprotocolversion)
* [getIsFeeInPoly\(\)](strgetter.md#getisfeeinpoly)
* [getExpiryLimit\(\)](strgetter.md#getexpirylimit)
* [getTickerStatus\(string \_ticker\)](strgetter.md#gettickerstatus)
* [getTickerOwner\(string \_ticker\)](strgetter.md#gettickerowner)

### getTickersByOwner

Returns the list of tickers owned by the selected address

```javascript
function getTickersByOwner(address _owner) external view
returns(bytes32[])
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_owner | address | is the address which owns the list of tickers |

### \_ownerInTicker

```javascript
function _ownerInTicker(bytes32 _ticker) internal view
returns(bool)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_ticker | bytes32 |  |

### getTokensByOwner

Returns the list of tokens owned by the selected address

```javascript
function getTokensByOwner(address _owner) external view
returns(address[])
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_owner | address | is the address which owns the list of tickers |

### getTokens

Returns the list of all tokens

```javascript
function getTokens() public view
returns(address[])
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### \_getTokens

Returns the list of tokens owned by the selected address

```javascript
function _getTokens(bool _allTokens, address _owner) internal view
returns(address[])
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_allTokens | bool | if \_allTokens is true returns all tokens despite on the second parameter |
| \_owner | address | is the address which owns the list of tickers |

### \_ownerInToken

```javascript
function _ownerInToken(bytes32 _ticker, bool _allTokens, address _owner) internal view
returns(address)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_ticker | bytes32 |  |
| \_allTokens | bool |  |
| \_owner | address |  |

### getTokensByDelegate

Returns the list of tokens to which the delegate has some access

```javascript
function getTokensByDelegate(address _delegate) external view
returns(address[])
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_delegate | address | is the address for the delegate |

### \_delegateInToken

```javascript
function _delegateInToken(address _token, address _delegate) internal view
returns(bool)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_token | address |  |
| \_delegate | address |  |

### getTickerDetails

Returns the owner and timestamp for a given ticker

```javascript
function getTickerDetails(string _ticker) external view
returns(address, uint256, uint256, string, bool)
```

**Returns**

address

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_ticker | string | is the ticker symbol |

### getSecurityTokenAddress

Returns the security token address by ticker symbol

```javascript
function getSecurityTokenAddress(string _ticker) external view
returns(address)
```

**Returns**

address

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_ticker | string | is the ticker of the security token |

### getSecurityTokenData

Returns the security token data by address

```javascript
function getSecurityTokenData(address _securityToken) external view
returns(string, address, string, uint256)
```

**Returns**

string is the ticker of the security Token.

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_securityToken | address | is the address of the security token. |

### getSTFactoryAddress

Returns the current STFactory Address

```javascript
function getSTFactoryAddress() public view
returns(address)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### getSTFactoryAddressOfVersion

Returns the STFactory Address of a particular version

```javascript
function getSTFactoryAddressOfVersion(uint256 _protocolVersion) public view
returns(address)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_protocolVersion | uint256 | Packed protocol version |

### getLatestProtocolVersion

Gets Protocol version

```javascript
function getLatestProtocolVersion() public view
returns(uint8[])
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### getIsFeeInPoly

Gets the fee currency

```javascript
function getIsFeeInPoly() public view
returns(bool)
```

**Returns**

true = poly, false = usd

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### getExpiryLimit

Gets the expiry limit

```javascript
function getExpiryLimit() public view
returns(uint256)
```

**Returns**

Expiry limit

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### getTickerStatus

Gets the status of the ticker

```javascript
function getTickerStatus(string _ticker) public view
returns(bool)
```

**Returns**

bool

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_ticker | string | Ticker whose status need to determine |

### getTickerOwner

Gets the owner of the ticker

```javascript
function getTickerOwner(string _ticker) public view
returns(address)
```

**Returns**

address Address of the owner

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_ticker | string | Ticker whose owner need to determine |

