---
id: version-3.0.0-ERC20Basic
title: ERC20Basic
original_id: ERC20Basic
---

# ERC20Basic (ERC20Basic.sol)

View Source: [openzeppelin-solidity/contracts/token/ERC20/ERC20Basic.sol](../../openzeppelin-solidity/contracts/token/ERC20/ERC20Basic.sol)

**↘ Derived Contracts: [BasicToken](BasicToken.md), [ERC20](ERC20.md)**

**ERC20Basic**

Simpler version of ERC20 interface

**Events**

```js
event Transfer(address indexed from, address indexed to, uint256  value);
```

## Functions

- [totalSupply()](#totalsupply)
- [balanceOf(address who)](#balanceof)
- [transfer(address to, uint256 value)](#transfer)

### totalSupply

⤿ Overridden Implementation(s): [BasicToken.totalSupply](BasicToken.md#totalsupply)

```js
function totalSupply() public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### balanceOf

⤿ Overridden Implementation(s): [BasicToken.balanceOf](BasicToken.md#balanceof)

```js
function balanceOf(address who) public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| who | address |  | 

### transfer

⤿ Overridden Implementation(s): [BasicToken.transfer](BasicToken.md#transfer),[SecurityToken.transfer](SecurityToken.md#transfer)

```js
function transfer(address to, uint256 value) public nonpayable
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| to | address |  | 
| value | uint256 |  | 

