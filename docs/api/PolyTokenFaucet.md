---
id: version-3.0.0-PolyTokenFaucet
title: PolyTokenFaucet
original_id: PolyTokenFaucet
---

# PolyTokenFaucet.sol

View Source: [contracts/mocks/PolyTokenFaucet.sol](../../contracts/mocks/PolyTokenFaucet.sol)

**PolyTokenFaucet**

## Contract Members
**Constants & Variables**

```js
//internal members
uint256 internal totalSupply_;
mapping(address => uint256) internal balances;
mapping(address => mapping(address => uint256)) internal allowed;

//public members
string public name;
uint8 public decimals;
string public symbol;

```

**Events**

```js
event Transfer(address indexed from, address indexed to, uint256  value);
event Approval(address indexed owner, address indexed spender, uint256  value);
```

## Functions

- [()](#)
- [getTokens(uint256 _amount, address _recipient)](#gettokens)
- [transfer(address _to, uint256 _value)](#transfer)
- [transferFrom(address _from, address _to, uint256 _value)](#transferfrom)
- [balanceOf(address _owner)](#balanceof)
- [approve(address _spender, uint256 _value)](#approve)
- [allowance(address _owner, address _spender)](#allowance)
- [totalSupply()](#totalsupply)
- [increaseApproval(address _spender, uint256 _addedValue)](#increaseapproval)
- [decreaseApproval(address _spender, uint256 _subtractedValue)](#decreaseapproval)

### 

```js
function () public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getTokens

```js
function getTokens(uint256 _amount, address _recipient) public nonpayable
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _amount | uint256 |  | 
| _recipient | address |  | 

### transfer

Sends `_value` tokens to `_to` from `msg.sender`

```js
function transfer(address _to, uint256 _value) public nonpayable
returns(bool)
```

**Returns**

Whether the transfer was successful or not

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _to | address | The address of the recipient | 
| _value | uint256 | The amount of token to be transferred | 

### transferFrom

sends `_value` tokens to `_to` from `_from` with the condition it is approved by `_from`

```js
function transferFrom(address _from, address _to, uint256 _value) public nonpayable
returns(bool)
```

**Returns**

Whether the transfer was successful or not

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address | The address of the sender | 
| _to | address | The address of the recipient | 
| _value | uint256 | The amount of token to be transferred | 

### balanceOf

Returns the balance of a token holder

```js
function balanceOf(address _owner) public view
returns(balance uint256)
```

**Returns**

The balance

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _owner | address | The address from which the balance will be retrieved | 

### approve

Used by `msg.sender` to approve `_spender` to spend `_value` tokens

```js
function approve(address _spender, uint256 _value) public nonpayable
returns(bool)
```

**Returns**

Whether the approval was successful or not

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _spender | address | The address of the account able to transfer the tokens | 
| _value | uint256 | The amount of tokens to be approved for transfer | 

### allowance

```js
function allowance(address _owner, address _spender) public view
returns(remaining uint256)
```

**Returns**

Amount of remaining tokens allowed to be spent

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _owner | address | The address of the account owning tokens | 
| _spender | address | The address of the account able to transfer the tokens | 

### totalSupply

```js
function totalSupply() public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### increaseApproval

Increases the amount of tokens that an owner allowed to a spender.
approve should be called when allowed[_spender] == 0. To increment
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

Decrease the amount of tokens that an owner allowed to a spender.
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
| _spender | address | The address which will spend the funds. | 
| _subtractedValue | uint256 | The amount of tokens to decrease the allowance by. | 

