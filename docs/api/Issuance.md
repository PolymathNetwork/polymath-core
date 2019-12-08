---
id: version-3.0.0-Issuance
title: Issuance
original_id: Issuance
---

# Issuance module for delegate issuance (Issuance.sol)

View Source: [contracts/modules/STO/Issuance/Issuance.sol](../../contracts/modules/STO/Issuance/Issuance.sol)

**↗ Extends: [IssuanceStorage](IssuanceStorage.md), [Module](Module.md)**

**Issuance**

**Events**

```js
event TokensIssued(address indexed _tokenHolder, uint256  _value, address indexed _issuedBy);
event MultiTokensIssued(address[]  _tokenHolders, uint256[]  _values, address indexed _issuedBy);
```

## Functions

- [(address _securityToken, address _polyToken)](#)
- [issueTokens(address _tokenHolder, uint256 _value, bytes _data)](#issuetokens)
- [issueTokensMulti(address[] _tokenHolders, uint256[] _values)](#issuetokensmulti)
- [getPermissions()](#getpermissions)
- [getInitFunction()](#getinitfunction)

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

### issueTokens

Function used to allocate tokens to the investor

```js
function issueTokens(address _tokenHolder, uint256 _value, bytes _data) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _tokenHolder | address | Address of whom token gets issued | 
| _value | uint256 | The amount of tokens need to be issued | 
| _data | bytes | The `bytes _data` allows arbitrary data to be submitted alongside the transfer. | 

### issueTokensMulti

Function used to allocate tokens to the investor

```js
function issueTokensMulti(address[] _tokenHolders, uint256[] _values) external nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _tokenHolders | address[] | Address of whom token gets issued | 
| _values | uint256[] | The amount of tokens need to be issued | 

### getPermissions

⤾ overrides [IModule.getPermissions](IModule.md#getpermissions)

Returns the permissions flag that are associated with STO

```js
function getPermissions() public view
returns(bytes32[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getInitFunction

⤾ overrides [IModule.getInitFunction](IModule.md#getinitfunction)

This function returns the signature of configure function

```js
function getInitFunction() public pure
returns(bytes4)
```

**Returns**

bytes4 Configure function signature

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

