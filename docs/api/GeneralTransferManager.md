---
id: version-3.0.0-GeneralTransferManager
title: GeneralTransferManager
original_id: GeneralTransferManager
---

# Transfer Manager module for core transfer validation functionality (GeneralTransferManager.sol)

View Source: [contracts/modules/TransferManager/GTM/GeneralTransferManager.sol](../../contracts/modules/TransferManager/GTM/GeneralTransferManager.sol)

**↗ Extends: [GeneralTransferManagerStorage](GeneralTransferManagerStorage.md), [TransferManager](TransferManager.md)**

**GeneralTransferManager**

**Events**

```js
event ChangeIssuanceAddress(address  _issuanceAddress);
event ChangeDefaults(uint64  _defaultCanSendAfter, uint64  _defaultCanReceiveAfter);
event ModifyKYCData(address indexed _investor, address indexed _addedBy, uint64  _canSendAfter, uint64  _canReceiveAfter, uint64  _expiryTime);
event ModifyInvestorFlag(address indexed _investor, uint8 indexed _flag, bool  _value);
event ModifyTransferRequirements(enum GeneralTransferManagerStorage.TransferType indexed _transferType, bool  _fromValidKYC, bool  _toValidKYC, bool  _fromRestricted, bool  _toRestricted);
```

## Functions

- [(address _securityToken, address _polyToken)](#)
- [getInitFunction()](#getinitfunction)
- [changeDefaults(uint64 _defaultCanSendAfter, uint64 _defaultCanReceiveAfter)](#changedefaults)
- [changeIssuanceAddress(address _issuanceAddress)](#changeissuanceaddress)
- [executeTransfer(address _from, address _to, uint256 , bytes _data)](#executetransfer)
- [_processTransferSignature(uint256 _nonce, uint256 _validFrom, uint256 _validTo, bytes _data)](#_processtransfersignature)
- [verifyTransfer(address _from, address _to, uint256 , bytes _data)](#verifytransfer)
- [_processTransferSignatureView(bytes _data, uint256 _validFrom, uint256 _validTo, uint256 _nonce)](#_processtransfersignatureview)
- [_verifyTransfer(address _to, address _from, uint64 _canSendAfter, uint64 _canReceiveAfter, uint64 _toExpiry, uint64 _fromExpiry)](#_verifytransfer)
- [_isWhitelistModule(address _holder)](#_iswhitelistmodule)
- [modifyTransferRequirements(enum GeneralTransferManagerStorage.TransferType _transferType, bool _fromValidKYC, bool _toValidKYC, bool _fromRestricted, bool _toRestricted)](#modifytransferrequirements)
- [modifyTransferRequirementsMulti(enum GeneralTransferManagerStorage.TransferType[] _transferTypes, bool[] _fromValidKYC, bool[] _toValidKYC, bool[] _fromRestricted, bool[] _toRestricted)](#modifytransferrequirementsmulti)
- [_modifyTransferRequirements(enum GeneralTransferManagerStorage.TransferType _transferType, bool _fromValidKYC, bool _toValidKYC, bool _fromRestricted, bool _toRestricted)](#_modifytransferrequirements)
- [modifyKYCData(address _investor, uint64 _canSendAfter, uint64 _canReceiveAfter, uint64 _expiryTime)](#modifykycdata)
- [_modifyKYCData(address _investor, uint64 _canSendAfter, uint64 _canReceiveAfter, uint64 _expiryTime)](#_modifykycdata)
- [modifyKYCDataMulti(address[] _investors, uint64[] _canSendAfter, uint64[] _canReceiveAfter, uint64[] _expiryTime)](#modifykycdatamulti)
- [modifyInvestorFlag(address _investor, uint8 _flag, bool _value)](#modifyinvestorflag)
- [_modifyInvestorFlag(address _investor, uint8 _flag, bool _value)](#_modifyinvestorflag)
- [modifyInvestorFlagMulti(address[] _investors, uint8[] _flag, bool[] _value)](#modifyinvestorflagmulti)
- [modifyKYCDataSigned(address _investor, uint256 _canSendAfter, uint256 _canReceiveAfter, uint256 _expiryTime, uint256 _validFrom, uint256 _validTo, uint256 _nonce, bytes _signature)](#modifykycdatasigned)
- [_modifyKYCDataSigned(address _investor, uint256 _canSendAfter, uint256 _canReceiveAfter, uint256 _expiryTime, uint256 _validFrom, uint256 _validTo, uint256 _nonce, bytes _signature)](#_modifykycdatasigned)
- [modifyKYCDataSignedMulti(address[] _investor, uint256[] _canSendAfter, uint256[] _canReceiveAfter, uint256[] _expiryTime, uint256 _validFrom, uint256 _validTo, uint256 _nonce, bytes _signature)](#modifykycdatasignedmulti)
- [_verifySignedKYCData(address[] _investor, uint256[] _canSendAfter, uint256[] _canReceiveAfter, uint256[] _expiryTime, uint256 _validFrom, uint256 _validTo, uint256 _nonce, bytes _signature, bool _isReadOnlyCall)](#_verifysignedkycdata)
- [_modifyKYCDataSignedMulti(address[] _investor, uint256[] _canSendAfter, uint256[] _canReceiveAfter, uint256[] _expiryTime, uint256 _validFrom, uint256 _validTo, uint256 _nonce, bytes _signature)](#_modifykycdatasignedmulti)
- [_checkSigView(bytes32 _hash, bytes _signature, uint256 _nonce)](#_checksigview)
- [_checkSig(bytes32 _hash, bytes _signature, uint256 _nonce)](#_checksig)
- [_validExpiry(uint64 _expiryTime)](#_validexpiry)
- [_validLockTime(uint64 _lockTime)](#_validlocktime)
- [_adjustTimes(uint64 _canSendAfter, uint64 _canReceiveAfter)](#_adjusttimes)
- [_getKey(bytes32 _key1, address _key2)](#_getkey)
- [_getKYCValues(address _investor, IDataStore dataStore)](#_getkycvalues)
- [_isExistingInvestor(address _investor, IDataStore dataStore)](#_isexistinginvestor)
- [_getKYCValuesTo(address _to)](#_getkycvaluesto)
- [_getKYCValuesFrom(address _from)](#_getkycvaluesfrom)
- [getAllInvestors()](#getallinvestors)
- [getInvestors(uint256 _fromIndex, uint256 _toIndex)](#getinvestors)
- [getAllInvestorFlags()](#getallinvestorflags)
- [getInvestorFlag(address _investor, uint8 _flag)](#getinvestorflag)
- [getInvestorFlags(address _investor)](#getinvestorflags)
- [_getInvestorFlags(address _investor)](#_getinvestorflags)
- [getAllKYCData()](#getallkycdata)
- [getKYCData(address[] _investors)](#getkycdata)
- [_kycData(address[] _investors)](#_kycdata)
- [getPermissions()](#getpermissions)
- [getTokensByPartition(bytes32 _partition, address _tokenHolder, uint256 _additionalBalance)](#gettokensbypartition)
- [getAddressBytes32()](#getaddressbytes32)

### 

Constructor

```js
function (address _securityToken, address _polyToken) public nonpayable Module 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _securityToken | address | Address of the security token | 
| _polyToken | address |  | 

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

### executeTransfer

⤾ overrides [ITransferManager.executeTransfer](ITransferManager.md#executetransfer)

Default implementation of verifyTransfer used by SecurityToken
If the transfer request comes from the STO, it only checks that the investor is in the whitelist
If the transfer request comes from a token holder, it checks that:
a) Both are on the whitelist
b) Seller's sale lockup period is over
c) Buyer's purchase lockup is over

```js
function executeTransfer(address _from, address _to, uint256 , bytes _data) external nonpayable
returns(enum ITransferManager.Result)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address | Address of the sender | 
| _to | address | Address of the receiver | 
|  | uint256 | _from Address of the sender | 
| _data | bytes |  | 

### _processTransferSignature

```js
function _processTransferSignature(uint256 _nonce, uint256 _validFrom, uint256 _validTo, bytes _data) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _nonce | uint256 |  | 
| _validFrom | uint256 |  | 
| _validTo | uint256 |  | 
| _data | bytes |  | 

### verifyTransfer

⤾ overrides [ITransferManager.verifyTransfer](ITransferManager.md#verifytransfer)

Default implementation of verifyTransfer used by SecurityToken

```js
function verifyTransfer(address _from, address _to, uint256 , bytes _data) public view
returns(enum ITransferManager.Result, bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address | Address of the sender | 
| _to | address | Address of the receiver | 
|  | uint256 | _from Address of the sender | 
| _data | bytes | off-chain signed data | 

### _processTransferSignatureView

```js
function _processTransferSignatureView(bytes _data, uint256 _validFrom, uint256 _validTo, uint256 _nonce) internal view
returns(verified bool, investor address[], canSendAfter uint256[], canReceiveAfter uint256[], expiryTime uint256[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _data | bytes |  | 
| _validFrom | uint256 |  | 
| _validTo | uint256 |  | 
| _nonce | uint256 |  | 

### _verifyTransfer

```js
function _verifyTransfer(address _to, address _from, uint64 _canSendAfter, uint64 _canReceiveAfter, uint64 _toExpiry, uint64 _fromExpiry) internal view
returns(enum ITransferManager.Result, bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _to | address |  | 
| _from | address |  | 
| _canSendAfter | uint64 |  | 
| _canReceiveAfter | uint64 |  | 
| _toExpiry | uint64 |  | 
| _fromExpiry | uint64 |  | 

### _isWhitelistModule

```js
function _isWhitelistModule(address _holder) internal view
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _holder | address |  | 

### modifyTransferRequirements

Modifies the successful checks required for a transfer to be deemed valid.

```js
function modifyTransferRequirements(enum GeneralTransferManagerStorage.TransferType _transferType, bool _fromValidKYC, bool _toValidKYC, bool _fromRestricted, bool _toRestricted) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _transferType | enum GeneralTransferManagerStorage.TransferType | Type of transfer (0 = General, 1 = Issuance, 2 = Redemption) | 
| _fromValidKYC | bool | Defines if KYC is required for the sender | 
| _toValidKYC | bool | Defines if KYC is required for the receiver | 
| _fromRestricted | bool | Defines if transfer time restriction is checked for the sender | 
| _toRestricted | bool | Defines if transfer time restriction is checked for the receiver | 

### modifyTransferRequirementsMulti

Modifies the successful checks required for transfers.

```js
function modifyTransferRequirementsMulti(enum GeneralTransferManagerStorage.TransferType[] _transferTypes, bool[] _fromValidKYC, bool[] _toValidKYC, bool[] _fromRestricted, bool[] _toRestricted) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _transferTypes | enum GeneralTransferManagerStorage.TransferType[] | Types of transfer (0 = General, 1 = Issuance, 2 = Redemption) | 
| _fromValidKYC | bool[] | Defines if KYC is required for the sender | 
| _toValidKYC | bool[] | Defines if KYC is required for the receiver | 
| _fromRestricted | bool[] | Defines if transfer time restriction is checked for the sender | 
| _toRestricted | bool[] | Defines if transfer time restriction is checked for the receiver | 

### _modifyTransferRequirements

```js
function _modifyTransferRequirements(enum GeneralTransferManagerStorage.TransferType _transferType, bool _fromValidKYC, bool _toValidKYC, bool _fromRestricted, bool _toRestricted) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _transferType | enum GeneralTransferManagerStorage.TransferType |  | 
| _fromValidKYC | bool |  | 
| _toValidKYC | bool |  | 
| _fromRestricted | bool |  | 
| _toRestricted | bool |  | 

### modifyKYCData

Add or remove KYC info of an investor.

```js
function modifyKYCData(address _investor, uint64 _canSendAfter, uint64 _canReceiveAfter, uint64 _expiryTime) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investor | address | is the address to whitelist | 
| _canSendAfter | uint64 | is the moment when the sale lockup period ends and the investor can freely sell or transfer their tokens | 
| _canReceiveAfter | uint64 | is the moment when the purchase lockup period ends and the investor can freely purchase or receive tokens from others | 
| _expiryTime | uint64 | is the moment till investors KYC will be validated. After that investor need to do re-KYC | 

### _modifyKYCData

```js
function _modifyKYCData(address _investor, uint64 _canSendAfter, uint64 _canReceiveAfter, uint64 _expiryTime) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investor | address |  | 
| _canSendAfter | uint64 |  | 
| _canReceiveAfter | uint64 |  | 
| _expiryTime | uint64 |  | 

### modifyKYCDataMulti

Add or remove KYC info of an investor.

```js
function modifyKYCDataMulti(address[] _investors, uint64[] _canSendAfter, uint64[] _canReceiveAfter, uint64[] _expiryTime) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investors | address[] | is the address to whitelist | 
| _canSendAfter | uint64[] | is the moment when the sale lockup period ends and the investor can freely sell his tokens | 
| _canReceiveAfter | uint64[] | is the moment when the purchase lockup period ends and the investor can freely purchase tokens from others | 
| _expiryTime | uint64[] | is the moment till investors KYC will be validated. After that investor need to do re-KYC | 

### modifyInvestorFlag

Used to modify investor Flag.

```js
function modifyInvestorFlag(address _investor, uint8 _flag, bool _value) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investor | address | is the address of the investor. | 
| _flag | uint8 | index of flag to change. flag is used to know specifics about investor like isAccredited. | 
| _value | bool | value of the flag. a flag can be true or false. | 

### _modifyInvestorFlag

```js
function _modifyInvestorFlag(address _investor, uint8 _flag, bool _value) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investor | address |  | 
| _flag | uint8 |  | 
| _value | bool |  | 

### modifyInvestorFlagMulti

Used to modify investor data.

```js
function modifyInvestorFlagMulti(address[] _investors, uint8[] _flag, bool[] _value) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investors | address[] | List of the addresses to modify data about. | 
| _flag | uint8[] | index of flag to change. flag is used to know specifics about investor like isAccredited. | 
| _value | bool[] | value of the flag. a flag can be true or false. | 

### modifyKYCDataSigned

Adds or removes addresses from the whitelist - can be called by anyone with a valid signature

```js
function modifyKYCDataSigned(address _investor, uint256 _canSendAfter, uint256 _canReceiveAfter, uint256 _expiryTime, uint256 _validFrom, uint256 _validTo, uint256 _nonce, bytes _signature) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investor | address | is the address to whitelist | 
| _canSendAfter | uint256 | is the moment when the sale lockup period ends and the investor can freely sell his tokens | 
| _canReceiveAfter | uint256 | is the moment when the purchase lockup period ends and the investor can freely purchase tokens from others | 
| _expiryTime | uint256 | is the moment till investors KYC will be validated. After that investor need to do re-KYC | 
| _validFrom | uint256 | is the time that this signature is valid from | 
| _validTo | uint256 | is the time that this signature is valid until | 
| _nonce | uint256 | nonce of signature (avoid replay attack) | 
| _signature | bytes | issuer signature | 

### _modifyKYCDataSigned

```js
function _modifyKYCDataSigned(address _investor, uint256 _canSendAfter, uint256 _canReceiveAfter, uint256 _expiryTime, uint256 _validFrom, uint256 _validTo, uint256 _nonce, bytes _signature) internal nonpayable
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investor | address |  | 
| _canSendAfter | uint256 |  | 
| _canReceiveAfter | uint256 |  | 
| _expiryTime | uint256 |  | 
| _validFrom | uint256 |  | 
| _validTo | uint256 |  | 
| _nonce | uint256 |  | 
| _signature | bytes |  | 

### modifyKYCDataSignedMulti

Adds or removes addresses from the whitelist - can be called by anyone with a valid signature

```js
function modifyKYCDataSignedMulti(address[] _investor, uint256[] _canSendAfter, uint256[] _canReceiveAfter, uint256[] _expiryTime, uint256 _validFrom, uint256 _validTo, uint256 _nonce, bytes _signature) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investor | address[] | is the address to whitelist | 
| _canSendAfter | uint256[] | is the moment when the sale lockup period ends and the investor can freely sell his tokens | 
| _canReceiveAfter | uint256[] | is the moment when the purchase lockup period ends and the investor can freely purchase tokens from others | 
| _expiryTime | uint256[] | is the moment till investors KYC will be validated. After that investor need to do re-KYC | 
| _validFrom | uint256 | is the time that this signature is valid from | 
| _validTo | uint256 | is the time that this signature is valid until | 
| _nonce | uint256 | nonce of signature (avoid replay attack) | 
| _signature | bytes | issuer signature | 

### _verifySignedKYCData

```js
function _verifySignedKYCData(address[] _investor, uint256[] _canSendAfter, uint256[] _canReceiveAfter, uint256[] _expiryTime, uint256 _validFrom, uint256 _validTo, uint256 _nonce, bytes _signature, bool _isReadOnlyCall) internal view
returns(isVerifiedSig bool, signer address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investor | address[] |  | 
| _canSendAfter | uint256[] |  | 
| _canReceiveAfter | uint256[] |  | 
| _expiryTime | uint256[] |  | 
| _validFrom | uint256 |  | 
| _validTo | uint256 |  | 
| _nonce | uint256 |  | 
| _signature | bytes |  | 
| _isReadOnlyCall | bool |  | 

### _modifyKYCDataSignedMulti

```js
function _modifyKYCDataSignedMulti(address[] _investor, uint256[] _canSendAfter, uint256[] _canReceiveAfter, uint256[] _expiryTime, uint256 _validFrom, uint256 _validTo, uint256 _nonce, bytes _signature) internal nonpayable
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investor | address[] |  | 
| _canSendAfter | uint256[] |  | 
| _canReceiveAfter | uint256[] |  | 
| _expiryTime | uint256[] |  | 
| _validFrom | uint256 |  | 
| _validTo | uint256 |  | 
| _nonce | uint256 |  | 
| _signature | bytes |  | 

### _checkSigView

Used to verify the signature

```js
function _checkSigView(bytes32 _hash, bytes _signature, uint256 _nonce) internal view
returns(bool, address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _hash | bytes32 |  | 
| _signature | bytes |  | 
| _nonce | uint256 |  | 

### _checkSig

Used to verify the signature

```js
function _checkSig(bytes32 _hash, bytes _signature, uint256 _nonce) internal nonpayable
returns(verified bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _hash | bytes32 |  | 
| _signature | bytes |  | 
| _nonce | uint256 |  | 

### _validExpiry

Internal function used to check whether the KYC of investor is valid

```js
function _validExpiry(uint64 _expiryTime) internal view
returns(valid bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _expiryTime | uint64 | Expiry time of the investor | 

### _validLockTime

Internal function used to check whether the lock time of investor is valid

```js
function _validLockTime(uint64 _lockTime) internal view
returns(valid bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _lockTime | uint64 | Lock time of the investor | 

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

### _getKey

```js
function _getKey(bytes32 _key1, address _key2) internal pure
returns(bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _key1 | bytes32 |  | 
| _key2 | address |  | 

### _getKYCValues

```js
function _getKYCValues(address _investor, IDataStore dataStore) internal view
returns(canSendAfter uint64, canReceiveAfter uint64, expiryTime uint64, added uint8)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investor | address |  | 
| dataStore | IDataStore |  | 

### _isExistingInvestor

```js
function _isExistingInvestor(address _investor, IDataStore dataStore) internal view
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investor | address |  | 
| dataStore | IDataStore |  | 

### _getKYCValuesTo

```js
function _getKYCValuesTo(address _to) internal view
returns(canReceiveAfter uint64, toExpiry uint64)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _to | address |  | 

### _getKYCValuesFrom

```js
function _getKYCValuesFrom(address _from) internal view
returns(canSendAfter uint64, fromExpiry uint64)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address |  | 

### getAllInvestors

Returns list of all investors

```js
function getAllInvestors() public view
returns(investors address[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getInvestors

Returns list of investors in a range

```js
function getInvestors(uint256 _fromIndex, uint256 _toIndex) public view
returns(investors address[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _fromIndex | uint256 |  | 
| _toIndex | uint256 |  | 

### getAllInvestorFlags

```js
function getAllInvestorFlags() public view
returns(investors address[], flags uint256[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getInvestorFlag

```js
function getInvestorFlag(address _investor, uint8 _flag) public view
returns(value bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investor | address |  | 
| _flag | uint8 |  | 

### getInvestorFlags

```js
function getInvestorFlags(address _investor) public view
returns(flags uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investor | address |  | 

### _getInvestorFlags

```js
function _getInvestorFlags(address _investor) internal view
returns(flags uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investor | address |  | 

### getAllKYCData

Returns list of all investors data

```js
function getAllKYCData() external view
returns(investors address[], canSendAfters uint256[], canReceiveAfters uint256[], expiryTimes uint256[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getKYCData

Returns list of specified investors data

```js
function getKYCData(address[] _investors) external view
returns(uint256[], uint256[], uint256[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investors | address[] |  | 

### _kycData

```js
function _kycData(address[] _investors) internal view
returns(uint256[], uint256[], uint256[])
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

### getTokensByPartition

⤾ overrides [TransferManager.getTokensByPartition](TransferManager.md#gettokensbypartition)

return the amount of tokens for a given user as per the partition

```js
function getTokensByPartition(bytes32 _partition, address _tokenHolder, uint256 _additionalBalance) external view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _partition | bytes32 | Identifier | 
| _tokenHolder | address | Whom token amount need to query | 
| _additionalBalance | uint256 | It is the `_value` that transfer during transfer/transferFrom function call | 

### getAddressBytes32

```js
function getAddressBytes32() public view
returns(bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

