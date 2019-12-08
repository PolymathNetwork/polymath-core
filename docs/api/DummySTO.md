---
id: version-3.0.0-DummySTO
title: DummySTO
original_id: DummySTO
---

# STO module for sample implementation of a different crowdsale module (DummySTO.sol)

View Source: [contracts/mocks/DummySTO.sol](../../contracts/mocks/DummySTO.sol)

**↗ Extends: [STO](STO.md)**

**DummySTO**

## Constructor

Constructor

```js
constructor(address _securityToken, address _polyAddress) public
```

**Arguments**

## Contract Members
**Constants & Variables**

```js
bytes32 public constant ADMIN;
uint256 public investorCount;
uint256 public cap;
string public someString;
mapping(address => uint256) public investors;

```

**Events**

```js
event GenerateTokens(address  _investor, uint256  _amount);
```

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _securityToken | address | Address of the security token | 
| _polyAddress | address | Address of the polytoken | 

## Functions

- [configure(uint256 _startTime, uint256 _endTime, uint256 _cap, string _someString)](#configure)
- [getInitFunction()](#getinitfunction)
- [generateTokens(address _investor, uint256 _amount)](#generatetokens)
- [getNumberInvestors()](#getnumberinvestors)
- [getTokensSold()](#gettokenssold)
- [getPermissions()](#getpermissions)
- [()](#)

### configure

Function used to intialize the differnet variables

```js
function configure(uint256 _startTime, uint256 _endTime, uint256 _cap, string _someString) public nonpayable onlyFactory 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _startTime | uint256 | Unix timestamp at which offering get started | 
| _endTime | uint256 | Unix timestamp at which offering get ended | 
| _cap | uint256 | Maximum No. of tokens for sale | 
| _someString | string | Any string that contails the details | 

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

### generateTokens

Function used to generate the tokens

```js
function generateTokens(address _investor, uint256 _amount) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investor | address | Address of the investor | 
| _amount | uint256 | Amount of ETH or Poly invested by the investor | 

### getNumberInvestors

Returns the total no. of investors

```js
function getNumberInvestors() public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getTokensSold

⤾ overrides [ISTO.getTokensSold](ISTO.md#gettokenssold)

Returns the total no. of investors

```js
function getTokensSold() public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

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

### 

```js
function () public payable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

