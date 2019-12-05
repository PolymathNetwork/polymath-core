---
id: version-3.0.0-ERC20
title: ERC20
original_id: ERC20
---

# Standard ERC20 token

* \(ERC20.sol\)

View Source: [openzeppelin-solidity/contracts/token/ERC20/ERC20.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/openzeppelin-solidity/contracts/token/ERC20/ERC20.sol)

**↗ Extends:** [**IERC20**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IERC20.md) **↘ Derived Contracts:** [**SecurityToken**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/SecurityToken.md)

**ERC20**

Implementation of the basic standard token. [https://eips.ethereum.org/EIPS/eip-20](https://eips.ethereum.org/EIPS/eip-20) Originally based on code by FirstBlood: [https://github.com/Firstbloodio/token/blob/master/smart\_contract/FirstBloodToken.sol](https://github.com/Firstbloodio/token/blob/master/smart_contract/FirstBloodToken.sol)

* This implementation emits additional Approval events, allowing applications to reconstruct the allowance status for

  all accounts just by listening to said events. Note that this isn't required by the specification, and other

  compliant implementations may not do it.

## Contract Members

**Constants & Variables**

```javascript
mapping(address => uint256) private _balances;
mapping(address => mapping(address => uint256)) private _allowed;
uint256 private _totalSupply;
```

## Functions

* [totalSupply\(\)](erc20.md#totalsupply)
* [balanceOf\(address owner\)](erc20.md#balanceof)
* [allowance\(address owner, address spender\)](erc20.md#allowance)
* [transfer\(address to, uint256 value\)](erc20.md#transfer)
* [approve\(address spender, uint256 value\)](erc20.md#approve)
* [transferFrom\(address from, address to, uint256 value\)](erc20.md#transferfrom)
* [increaseAllowance\(address spender, uint256 addedValue\)](erc20.md#increaseallowance)
* [decreaseAllowance\(address spender, uint256 subtractedValue\)](erc20.md#decreaseallowance)
* [\_transfer\(address from, address to, uint256 value\)](erc20.md#_transfer)
* [\_mint\(address account, uint256 value\)](erc20.md#_mint)
* [\_burn\(address account, uint256 value\)](erc20.md#_burn)
* [\_approve\(address owner, address spender, uint256 value\)](erc20.md#_approve)
* [\_burnFrom\(address account, uint256 value\)](erc20.md#_burnfrom)

### totalSupply

⤾ overrides [IERC20.totalSupply](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IERC20.md#totalsupply)

Total number of tokens in existence

```javascript
function totalSupply() public view
returns(uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### balanceOf

⤾ overrides [IERC20.balanceOf](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IERC20.md#balanceof)

Gets the balance of the specified address.

```javascript
function balanceOf(address owner) public view
returns(uint256)
```

**Returns**

A uint256 representing the amount owned by the passed address.

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| owner | address | The address to query the balance of. |

### allowance

⤾ overrides [IERC20.allowance](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IERC20.md#allowance)

Function to check the amount of tokens that an owner allowed to a spender.

```javascript
function allowance(address owner, address spender) public view
returns(uint256)
```

**Returns**

A uint256 specifying the amount of tokens still available for the spender.

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| owner | address | address The address which owns the funds. |
| spender | address | address The address which will spend the funds. |

### transfer

⤾ overrides [IERC20.transfer](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IERC20.md#transfer)

⤿ Overridden Implementation\(s\): [SecurityToken.transfer](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/SecurityToken.md#transfer)

Transfer token to a specified address

```javascript
function transfer(address to, uint256 value) public nonpayable
returns(bool)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| to | address | The address to transfer to. |
| value | uint256 | The amount to be transferred. |

### approve

⤾ overrides [IERC20.approve](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IERC20.md#approve)

Approve the passed address to spend the specified amount of tokens on behalf of msg.sender. Beware that changing an allowance with this method brings the risk that someone may use both the old and the new allowance by unfortunate transaction ordering. One possible solution to mitigate this race condition is to first reduce the spender's allowance to 0 and set the desired value afterwards: [https://github.com/ethereum/EIPs/issues/20\#issuecomment-263524729](https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729)

```javascript
function approve(address spender, uint256 value) public nonpayable
returns(bool)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| spender | address | The address which will spend the funds. |
| value | uint256 | The amount of tokens to be spent. |

### transferFrom

⤾ overrides [IERC20.transferFrom](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IERC20.md#transferfrom)

⤿ Overridden Implementation\(s\): [SecurityToken.transferFrom](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/SecurityToken.md#transferfrom)

Transfer tokens from one address to another. Note that while this function emits an Approval event, this is not required as per the specification, and other compliant implementations may not emit the event.

```javascript
function transferFrom(address from, address to, uint256 value) public nonpayable
returns(bool)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| from | address | address The address which you want to send tokens from |
| to | address | address The address which you want to transfer to |
| value | uint256 | uint256 the amount of tokens to be transferred |

### increaseAllowance

Increase the amount of tokens that an owner allowed to a spender. approve should be called when \_allowed\[msg.sender\]\[spender\] == 0. To increment allowed value is better to use this function to avoid 2 calls \(and wait until the first transaction is mined\) From MonolithDAO Token.sol Emits an Approval event.

```javascript
function increaseAllowance(address spender, uint256 addedValue) public nonpayable
returns(bool)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| spender | address | The address which will spend the funds. |
| addedValue | uint256 | The amount of tokens to increase the allowance by. |

### decreaseAllowance

Decrease the amount of tokens that an owner allowed to a spender. approve should be called when \_allowed\[msg.sender\]\[spender\] == 0. To decrement allowed value is better to use this function to avoid 2 calls \(and wait until the first transaction is mined\) From MonolithDAO Token.sol Emits an Approval event.

```javascript
function decreaseAllowance(address spender, uint256 subtractedValue) public nonpayable
returns(bool)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| spender | address | The address which will spend the funds. |
| subtractedValue | uint256 | The amount of tokens to decrease the allowance by. |

### \_transfer

Transfer token for a specified addresses

```javascript
function _transfer(address from, address to, uint256 value) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| from | address | The address to transfer from. |
| to | address | The address to transfer to. |
| value | uint256 | The amount to be transferred. |

### \_mint

Internal function that mints an amount of the token and assigns it to an account. This encapsulates the modification of balances such that the proper events are emitted.

```javascript
function _mint(address account, uint256 value) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| account | address | The account that will receive the created tokens. |
| value | uint256 | The amount that will be created. |

### \_burn

Internal function that burns an amount of the token of a given account.

```javascript
function _burn(address account, uint256 value) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| account | address | The account whose tokens will be burnt. |
| value | uint256 | The amount that will be burnt. |

### \_approve

Approve an address to spend another addresses' tokens.

```javascript
function _approve(address owner, address spender, uint256 value) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| owner | address | The address that owns the tokens. |
| spender | address | The address that will spend the tokens. |
| value | uint256 | The number of tokens that can be spent. |

### \_burnFrom

Internal function that burns an amount of the token of a given account, deducting from the sender's allowance for said account. Uses the internal burn function. Emits an Approval event \(reflecting the reduced allowance\).

```javascript
function _burnFrom(address account, uint256 value) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| account | address | The account whose tokens will be burnt. |
| value | uint256 | The amount that will be burnt. |

