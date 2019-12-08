---
id: version-3.0.0-IERC20
title: IERC20
original_id: IERC20
---

# ERC20 interface (IERC20.sol)

View Source: [contracts/interfaces/IERC20.sol](../../contracts/interfaces/IERC20.sol)

**↘ Derived Contracts: [PolyToken](PolyToken.md)**

**IERC20**

see https://github.com/ethereum/EIPs/issues/20

**Events**

```js
event Transfer(address indexed from, address indexed to, uint256  value);
event Approval(address indexed owner, address indexed spender, uint256  value);
```

## Functions

- [decimals()](#decimals)
- [totalSupply()](#totalsupply)
- [balanceOf(address _owner)](#balanceof)
- [allowance(address _owner, address _spender)](#allowance)
- [transfer(address _to, uint256 _value)](#transfer)
- [transferFrom(address _from, address _to, uint256 _value)](#transferfrom)
- [approve(address _spender, uint256 _value)](#approve)
- [decreaseApproval(address _spender, uint256 _subtractedValue)](#decreaseapproval)
- [increaseApproval(address _spender, uint256 _addedValue)](#increaseapproval)

### decimals

```js
function decimals() external view
returns(uint8)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### totalSupply

```js
function totalSupply() external view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### balanceOf

⤿ Overridden Implementation(s): [PolyToken.balanceOf](PolyToken.md#balanceof)

```js
function balanceOf(address _owner) external view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _owner | address |  | 

### allowance

⤿ Overridden Implementation(s): [PolyToken.allowance](PolyToken.md#allowance)

```js
function allowance(address _owner, address _spender) external view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _owner | address |  | 
| _spender | address |  | 

### transfer

⤿ Overridden Implementation(s): [PolyToken.transfer](PolyToken.md#transfer)

```js
function transfer(address _to, uint256 _value) external nonpayable
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _to | address |  | 
| _value | uint256 |  | 

### transferFrom

⤿ Overridden Implementation(s): [PolyToken.transferFrom](PolyToken.md#transferfrom)

```js
function transferFrom(address _from, address _to, uint256 _value) external nonpayable
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address |  | 
| _to | address |  | 
| _value | uint256 |  | 

### approve

⤿ Overridden Implementation(s): [PolyToken.approve](PolyToken.md#approve)

```js
function approve(address _spender, uint256 _value) external nonpayable
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _spender | address |  | 
| _value | uint256 |  | 

### decreaseApproval

⤿ Overridden Implementation(s): [PolyToken.decreaseApproval](PolyToken.md#decreaseapproval)

```js
function decreaseApproval(address _spender, uint256 _subtractedValue) external nonpayable
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _spender | address |  | 
| _subtractedValue | uint256 |  | 

### increaseApproval

⤿ Overridden Implementation(s): [PolyToken.increaseApproval](PolyToken.md#increaseapproval)

```js
function increaseApproval(address _spender, uint256 _addedValue) external nonpayable
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _spender | address |  | 
| _addedValue | uint256 |  | 

