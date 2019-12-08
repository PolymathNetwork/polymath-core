---
id: version-3.0.0-PolyToken
title: PolyToken
original_id: PolyToken
---

# SafeMath (PolyToken.sol)

View Source: [contracts/helpers/PolyToken.sol](../../contracts/helpers/PolyToken.sol)

**↗ Extends: [IERC20](IERC20.md)**

**PolyToken**

Math operations with safety checks that throw on error

## Contract Members
**Constants & Variables**

```js
//public members
string public name;
string public symbol;
uint8 public constant decimals;
uint256 public constant decimalFactor;
uint256 public constant totalSupply;

//internal members
mapping(address => uint256) internal balances;
mapping(address => mapping(address => uint256)) internal allowed;

```

**Events**

```js
event Transfer(address indexed from, address indexed to, uint256  value);
event Approval(address indexed owner, address indexed spender, uint256  value);
```

## Functions

- [mul(uint256 a, uint256 b)](#mul)
- [div(uint256 a, uint256 b)](#div)
- [sub(uint256 a, uint256 b)](#sub)
- [add(uint256 a, uint256 b)](#add)
- [balanceOf(address _owner)](#balanceof)
- [allowance(address _owner, address _spender)](#allowance)
- [transfer(address _to, uint256 _value)](#transfer)
- [transferFrom(address _from, address _to, uint256 _value)](#transferfrom)
- [approve(address _spender, uint256 _value)](#approve)
- [increaseApproval(address _spender, uint256 _addedValue)](#increaseapproval)
- [decreaseApproval(address _spender, uint256 _subtractedValue)](#decreaseapproval)

### mul

```js
function mul(uint256 a, uint256 b) internal pure
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| a | uint256 |  | 
| b | uint256 |  | 

### div

```js
function div(uint256 a, uint256 b) internal pure
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| a | uint256 |  | 
| b | uint256 |  | 

### sub

```js
function sub(uint256 a, uint256 b) internal pure
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| a | uint256 |  | 
| b | uint256 |  | 

### add

```js
function add(uint256 a, uint256 b) internal pure
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| a | uint256 |  | 
| b | uint256 |  | 

### balanceOf

⤾ overrides [IERC20.balanceOf](IERC20.md#balanceof)

Returns the balance of the specified address

```js
function balanceOf(address _owner) public view
returns(balance uint256)
```

**Returns**

An uint256 representing the amount owned by the passed address

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _owner | address | The address to query the the balance of | 

### allowance

⤾ overrides [IERC20.allowance](IERC20.md#allowance)

Function to check the amount of tokens a spender is allowed to spend

```js
function allowance(address _owner, address _spender) public view
returns(uint256)
```

**Returns**

A uint256 specifying the amount of tokens left available for the spender

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _owner | address | address The address which owns the tokens | 
| _spender | address | address The address which will spend the tokens | 

### transfer

⤾ overrides [IERC20.transfer](IERC20.md#transfer)

Transfer token to a specified address

```js
function transfer(address _to, uint256 _value) public nonpayable
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _to | address | The address to transfer tokens to | 
| _value | uint256 | The amount to be transferred | 

### transferFrom

⤾ overrides [IERC20.transferFrom](IERC20.md#transferfrom)

Transfers tokens from one address to another

```js
function transferFrom(address _from, address _to, uint256 _value) public nonpayable
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address | address The address to transfer tokens from | 
| _to | address | address The address to transfer tokens to | 
| _value | uint256 | uint256 The amount of tokens to be transferred | 

### approve

⤾ overrides [IERC20.approve](IERC20.md#approve)

Approves the passed address to spend the specified amount of tokens on behalf of msg.sender
    * Beware that changing an allowance with this method brings the risk that someone may use both the old
and the new allowance by unfortunate transaction ordering. One possible solution to mitigate this
race condition is to reduce the spender's allowance to 0 first and set the desired value afterwards:
https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729

```js
function approve(address _spender, uint256 _value) public nonpayable
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _spender | address | The address which will spend the funds | 
| _value | uint256 | The amount of tokens to be spent | 

### increaseApproval

⤾ overrides [IERC20.increaseApproval](IERC20.md#increaseapproval)

Increases the amount of tokens that an owner has allowed a spender to spend
    * approve should be called when allowed[_spender] == 0. To increment
allowed value, it is better to use this function to avoid 2 calls (and wait until
the first transaction is mined)
From MonolithDAO Token.sol

```js
function increaseApproval(address _spender, uint256 _addedValue) public nonpayable
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _spender | address | The address which will spend the funds. | 
| _addedValue | uint256 | The amount of tokens to increase the allowance by. | 

### decreaseApproval

⤾ overrides [IERC20.decreaseApproval](IERC20.md#decreaseapproval)

Decreases the amount of tokens that an owner has allowed a spender to spend
    * approve should be called when allowed[_spender] == 0. To decrement
allowed value, it is better to use this function to avoid 2 calls (and wait until
the first transaction is mined)
From MonolithDAO Token.sol

```js
function decreaseApproval(address _spender, uint256 _subtractedValue) public nonpayable
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _spender | address | The address which will spend the funds | 
| _subtractedValue | uint256 | The amount of tokens to decrease the allowance by | 

