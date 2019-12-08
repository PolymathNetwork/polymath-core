---
id: version-3.0.0-GeneralTransferManager
title: GeneralTransferManager
original_id: GeneralTransferManager
---

# Transfer Manager module for core transfer validation functionality (GeneralTransferManager.sol)

View Source: [contracts/modules/TransferManager/GeneralTransferManager.sol](../../contracts/modules/TransferManager/GeneralTransferManager.sol)

**↗ Extends: [GeneralTransferManagerStorage](GeneralTransferManagerStorage.md), [ITransferManager](ITransferManager.md)**

**GeneralTransferManager**

## Constructor

Constructor

```js
constructor(address _securityToken, address _polyAddress) public
```

**Arguments**

**Events**

```js
event ChangeIssuanceAddress(address  _issuanceAddress);
event AllowAllTransfers(bool  _allowAllTransfers);
event AllowAllWhitelistTransfers(bool  _allowAllWhitelistTransfers);
event AllowAllWhitelistIssuances(bool  _allowAllWhitelistIssuances);
event AllowAllBurnTransfers(bool  _allowAllBurnTransfers);
event ChangeSigningAddress(address  _signingAddress);
event ChangeDefaults(uint64  _defaultCanSendAfter, uint64  _defaultCanReceiveAfter);
event ModifyWhitelist(address indexed _investor, uint256  _dateAdded, address indexed _addedBy, uint256  _canSendAfter, uint256  _canReceiveAfter, uint256  _expiryTime, bool  _canBuyFromSTO);
```

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _securityToken | address | Address of the security token | 
| _polyAddress | address | Address of the polytoken | 

## Functions

- [getInitFunction()](#getinitfunction)
- [changeDefaults(uint64 _defaultCanSendAfter, uint64 _defaultCanReceiveAfter)](#changedefaults)
- [changeIssuanceAddress(address _issuanceAddress)](#changeissuanceaddress)
- [changeSigningAddress(address _signingAddress)](#changesigningaddress)
- [changeAllowAllTransfers(bool _allowAllTransfers)](#changeallowalltransfers)
- [changeAllowAllWhitelistTransfers(bool _allowAllWhitelistTransfers)](#changeallowallwhitelisttransfers)
- [changeAllowAllWhitelistIssuances(bool _allowAllWhitelistIssuances)](#changeallowallwhitelistissuances)
- [changeAllowAllBurnTransfers(bool _allowAllBurnTransfers)](#changeallowallburntransfers)
- [verifyTransfer(address _from, address _to, uint256 , bytes , bool )](#verifytransfer)
- [modifyWhitelist(address _investor, uint256 _canSendAfter, uint256 _canReceiveAfter, uint256 _expiryTime, bool _canBuyFromSTO)](#modifywhitelist)
- [_modifyWhitelist(address _investor, uint256 _canSendAfter, uint256 _canReceiveAfter, uint256 _expiryTime, bool _canBuyFromSTO)](#_modifywhitelist)
- [modifyWhitelistMulti(address[] _investors, uint256[] _canSendAfters, uint256[] _canReceiveAfters, uint256[] _expiryTimes, bool[] _canBuyFromSTO)](#modifywhitelistmulti)
- [modifyWhitelistSigned(address _investor, uint256 _canSendAfter, uint256 _canReceiveAfter, uint256 _expiryTime, bool _canBuyFromSTO, uint256 _validFrom, uint256 _validTo, uint256 _nonce, uint8 _v, bytes32 _r, bytes32 _s)](#modifywhitelistsigned)
- [_checkSig(bytes32 _hash, uint8 _v, bytes32 _r, bytes32 _s)](#_checksig)
- [_onWhitelist(address _investor)](#_onwhitelist)
- [_isSTOAttached()](#_isstoattached)
- [_adjustTimes(uint64 _canSendAfter, uint64 _canReceiveAfter)](#_adjusttimes)
- [getInvestors()](#getinvestors)
- [getAllInvestorsData()](#getallinvestorsdata)
- [getInvestorsData(address[] _investors)](#getinvestorsdata)
- [_investorsData(address[] _investors)](#_investorsdata)
- [getPermissions()](#getpermissions)

### getInitFunction

⤾ overrides [IModule.getInitFunction](IModule.md#getinitfunction)

This function returns the signature of configure function

```js
function getInitFunction() public pure
returns(bytes4)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### changeDefaults

Used to change the default times used when canSendAfter / canReceiveAfter are zero

```js
function changeDefaults(uint64 _defaultCanSendAfter, uint64 _defaultCanReceiveAfter) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _defaultCanSendAfter | uint64 | default for zero canSendAfter | 
| _defaultCanReceiveAfter | uint64 | default for zero canReceiveAfter | 

### changeIssuanceAddress

Used to change the Issuance Address

```js
function changeIssuanceAddress(address _issuanceAddress) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _issuanceAddress | address | new address for the issuance | 

### changeSigningAddress

Used to change the Sigining Address

```js
function changeSigningAddress(address _signingAddress) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _signingAddress | address | new address for the signing | 

### changeAllowAllTransfers

Used to change the flag
true - It refers there are no transfer restrictions, for any addresses
false - It refers transfers are restricted for all addresses.

```js
function changeAllowAllTransfers(bool _allowAllTransfers) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _allowAllTransfers | bool | flag value | 

### changeAllowAllWhitelistTransfers

Used to change the flag
true - It refers that time lock is ignored for transfers (address must still be on whitelist)
false - It refers transfers are restricted for all addresses.

```js
function changeAllowAllWhitelistTransfers(bool _allowAllWhitelistTransfers) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _allowAllWhitelistTransfers | bool | flag value | 

### changeAllowAllWhitelistIssuances

Used to change the flag
true - It refers that time lock is ignored for issuances (address must still be on whitelist)
false - It refers transfers are restricted for all addresses.

```js
function changeAllowAllWhitelistIssuances(bool _allowAllWhitelistIssuances) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _allowAllWhitelistIssuances | bool | flag value | 

### changeAllowAllBurnTransfers

Used to change the flag
true - It allow to burn the tokens
false - It deactivate the burning mechanism.

```js
function changeAllowAllBurnTransfers(bool _allowAllBurnTransfers) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _allowAllBurnTransfers | bool | flag value | 

### verifyTransfer

⤾ overrides [ITransferManager.verifyTransfer](ITransferManager.md#verifytransfer)

Default implementation of verifyTransfer used by SecurityToken
If the transfer request comes from the STO, it only checks that the investor is in the whitelist
If the transfer request comes from a token holder, it checks that:
a) Both are on the whitelist
b) Seller's sale lockup period is over
c) Buyer's purchase lockup is over

```js
function verifyTransfer(address _from, address _to, uint256 , bytes , bool ) public nonpayable
returns(enum ITransferManager.Result)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address | Address of the sender | 
| _to | address | Address of the receiver | 
|  | uint256 | _from Address of the sender | 
|  | bytes | _from Address of the sender | 
|  | bool | _from Address of the sender | 

### modifyWhitelist

Adds or removes addresses from the whitelist.

```js
function modifyWhitelist(address _investor, uint256 _canSendAfter, uint256 _canReceiveAfter, uint256 _expiryTime, bool _canBuyFromSTO) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investor | address | is the address to whitelist | 
| _canSendAfter | uint256 | the moment when the sale lockup period ends and the investor can freely sell or transfer away their tokens | 
| _canReceiveAfter | uint256 | the moment when the purchase lockup period ends and the investor can freely purchase or receive from others | 
| _expiryTime | uint256 | is the moment till investors KYC will be validated. After that investor need to do re-KYC | 
| _canBuyFromSTO | bool | is used to know whether the investor is restricted investor or not. | 

### _modifyWhitelist

Adds or removes addresses from the whitelist.

```js
function _modifyWhitelist(address _investor, uint256 _canSendAfter, uint256 _canReceiveAfter, uint256 _expiryTime, bool _canBuyFromSTO) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investor | address | is the address to whitelist | 
| _canSendAfter | uint256 | is the moment when the sale lockup period ends and the investor can freely sell his tokens | 
| _canReceiveAfter | uint256 | is the moment when the purchase lockup period ends and the investor can freely purchase tokens from others | 
| _expiryTime | uint256 | is the moment till investors KYC will be validated. After that investor need to do re-KYC | 
| _canBuyFromSTO | bool | is used to know whether the investor is restricted investor or not. | 

### modifyWhitelistMulti

Adds or removes addresses from the whitelist.

```js
function modifyWhitelistMulti(address[] _investors, uint256[] _canSendAfters, uint256[] _canReceiveAfters, uint256[] _expiryTimes, bool[] _canBuyFromSTO) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investors | address[] | List of the addresses to whitelist | 
| _canSendAfters | uint256[] | An array of the moment when the sale lockup period ends and the investor can freely sell his tokens | 
| _canReceiveAfters | uint256[] | An array of the moment when the purchase lockup period ends and the investor can freely purchase tokens from others | 
| _expiryTimes | uint256[] | An array of the moment till investors KYC will be validated. After that investor need to do re-KYC | 
| _canBuyFromSTO | bool[] | An array of boolean values | 

### modifyWhitelistSigned

Adds or removes addresses from the whitelist - can be called by anyone with a valid signature

```js
function modifyWhitelistSigned(address _investor, uint256 _canSendAfter, uint256 _canReceiveAfter, uint256 _expiryTime, bool _canBuyFromSTO, uint256 _validFrom, uint256 _validTo, uint256 _nonce, uint8 _v, bytes32 _r, bytes32 _s) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investor | address | is the address to whitelist | 
| _canSendAfter | uint256 | is the moment when the sale lockup period ends and the investor can freely sell his tokens | 
| _canReceiveAfter | uint256 | is the moment when the purchase lockup period ends and the investor can freely purchase tokens from others | 
| _expiryTime | uint256 | is the moment till investors KYC will be validated. After that investor need to do re-KYC | 
| _canBuyFromSTO | bool | is used to know whether the investor is restricted investor or not. | 
| _validFrom | uint256 | is the time that this signature is valid from | 
| _validTo | uint256 | is the time that this signature is valid until | 
| _nonce | uint256 | nonce of signature (avoid replay attack) | 
| _v | uint8 | alidFrom is the time that this signature is valid from | 
| _r | bytes32 | issuer signature | 
| _s | bytes32 | issuer signature | 

### _checkSig

Used to verify the signature

```js
function _checkSig(bytes32 _hash, uint8 _v, bytes32 _r, bytes32 _s) internal view
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _hash | bytes32 |  | 
| _v | uint8 |  | 
| _r | bytes32 |  | 
| _s | bytes32 |  | 

### _onWhitelist

Internal function used to check whether the investor is in the whitelist or not
& also checks whether the KYC of investor get expired or not

```js
function _onWhitelist(address _investor) internal view
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investor | address | Address of the investor | 

### _isSTOAttached

Internal function use to know whether the STO is attached or not

```js
function _isSTOAttached() internal view
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### _adjustTimes

Internal function to adjust times using default values

```js
function _adjustTimes(uint64 _canSendAfter, uint64 _canReceiveAfter) internal view
returns(uint64, uint64)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _canSendAfter | uint64 |  | 
| _canReceiveAfter | uint64 |  | 

### getInvestors

Returns list of all investors

```js
function getInvestors() external view
returns(address[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getAllInvestorsData

Returns list of all investors data

```js
function getAllInvestorsData() external view
returns(address[], uint256[], uint256[], uint256[], bool[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getInvestorsData

Returns list of specified investors data

```js
function getInvestorsData(address[] _investors) external view
returns(uint256[], uint256[], uint256[], bool[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investors | address[] |  | 

### _investorsData

```js
function _investorsData(address[] _investors) internal view
returns(uint256[], uint256[], uint256[], bool[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investors | address[] |  | 

### getPermissions

⤾ overrides [IModule.getPermissions](IModule.md#getpermissions)

Return the permissions flag that are associated with general trnasfer manager

```js
function getPermissions() public view
returns(bytes32[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

