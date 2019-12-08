---
id: version-3.0.0-PreSaleSTO
title: PreSaleSTO
original_id: PreSaleSTO
---

# STO module for private presales (PreSaleSTO.sol)

View Source: [contracts/modules/STO/PreSaleSTO.sol](../../contracts/modules/STO/PreSaleSTO.sol)

**↗ Extends: [STO](STO.md)**

**PreSaleSTO**

## Constructor

Constructor

```js
constructor(address _securityToken, address _polyAddress) public
```

**Arguments**

## Contract Members
**Constants & Variables**

```js
bytes32 public constant PRE_SALE_ADMIN;
mapping(address => uint256) public investors;

```

**Events**

```js
event TokensAllocated(address  _investor, uint256  _amount);
```

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _securityToken | address | Address of the security token | 
| _polyAddress | address | Address of the polytoken | 

## Functions

- [configure(uint256 _endTime)](#configure)
- [getInitFunction()](#getinitfunction)
- [getNumberInvestors()](#getnumberinvestors)
- [getTokensSold()](#gettokenssold)
- [getPermissions()](#getpermissions)
- [allocateTokens(address _investor, uint256 _amount, uint256 _etherContributed, uint256 _polyContributed)](#allocatetokens)
- [allocateTokensMulti(address[] _investors, uint256[] _amounts, uint256[] _etherContributed, uint256[] _polyContributed)](#allocatetokensmulti)

### configure

Function used to initialize the different variables

```js
function configure(uint256 _endTime) public nonpayable onlyFactory 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _endTime | uint256 | Unix timestamp at which offering ends | 

### getInitFunction

⤾ overrides [IModule.getInitFunction](IModule.md#getinitfunction)

This function returns the signature of the configure function

```js
function getInitFunction() public pure
returns(bytes4)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

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

Returns the total no. of tokens sold

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

### allocateTokens

Function used to allocate tokens to the investor

```js
function allocateTokens(address _investor, uint256 _amount, uint256 _etherContributed, uint256 _polyContributed) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investor | address | Address of the investor | 
| _amount | uint256 | No. of tokens to be transferred to the investor | 
| _etherContributed | uint256 | How much ETH was contributed | 
| _polyContributed | uint256 | How much POLY was contributed | 

### allocateTokensMulti

Function used to allocate tokens to multiple investors

```js
function allocateTokensMulti(address[] _investors, uint256[] _amounts, uint256[] _etherContributed, uint256[] _polyContributed) public nonpayable withPerm 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investors | address[] | Array of address of the investors | 
| _amounts | uint256[] | Array of no. of tokens to be transferred to the investors | 
| _etherContributed | uint256[] | Array of amount of ETH contributed by each investor | 
| _polyContributed | uint256[] | Array of amount of POLY contributed by each investor | 

