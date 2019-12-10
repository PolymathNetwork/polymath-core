---
id: version-3.0.0-OZStorage
title: OZStorage
original_id: OZStorage
---

# OZStorage.sol

View Source: [contracts/tokens/OZStorage.sol](../../contracts/tokens/OZStorage.sol)

**↘ Derived Contracts: [SecurityTokenProxy](SecurityTokenProxy.md), [STGetter](STGetter.md)**

**OZStorage**

## Contract Members
**Constants & Variables**

```js
mapping(address => uint256) private _balances;
mapping(address => mapping(address => uint256)) private _allowed;
uint256 private _totalSupply;
uint256 private _guardCounter;

```

## Functions

- [totalSupply()](#totalsupply)
- [balanceOf(address _investor)](#balanceof)
- [_allowance(address owner, address spender)](#_allowance)

### totalSupply

```js
function totalSupply() internal view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### balanceOf

```js
function balanceOf(address _investor) internal view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investor | address |  | 

### _allowance

```js
function _allowance(address owner, address spender) internal view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| owner | address |  | 
| spender | address |  | 

