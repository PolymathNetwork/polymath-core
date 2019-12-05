---
id: version-3.0.0-IERC20
title: IERC20
original_id: IERC20
---

# ERC20 interface \(IERC20.sol\)

View Source: [openzeppelin-solidity/contracts/token/ERC20/IERC20.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/openzeppelin-solidity/contracts/token/ERC20/IERC20.sol)

**↘ Derived Contracts:** [**ERC20**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ERC20.md)

**IERC20**

see [https://eips.ethereum.org/EIPS/eip-20](https://eips.ethereum.org/EIPS/eip-20)

**Events**

```javascript
event Transfer(address indexed from, address indexed to, uint256  value);
event Approval(address indexed owner, address indexed spender, uint256  value);
```

## Functions

* [transfer\(address to, uint256 value\)](ierc20.md#transfer)
* [approve\(address spender, uint256 value\)](ierc20.md#approve)
* [transferFrom\(address from, address to, uint256 value\)](ierc20.md#transferfrom)
* [totalSupply\(\)](ierc20.md#totalsupply)
* [balanceOf\(address who\)](ierc20.md#balanceof)
* [allowance\(address owner, address spender\)](ierc20.md#allowance)

### transfer

⤿ Overridden Implementation\(s\): [ERC20.transfer](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ERC20.md#transfer),[SecurityToken.transfer](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/SecurityToken.md#transfer)

```javascript
function transfer(address to, uint256 value) external nonpayable
returns(bool)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| to | address |  |
| value | uint256 |  |

### approve

⤿ Overridden Implementation\(s\): [ERC20.approve](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ERC20.md#approve)

```javascript
function approve(address spender, uint256 value) external nonpayable
returns(bool)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| spender | address |  |
| value | uint256 |  |

### transferFrom

⤿ Overridden Implementation\(s\): [ERC20.transferFrom](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ERC20.md#transferfrom),[SecurityToken.transferFrom](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/SecurityToken.md#transferfrom)

```javascript
function transferFrom(address from, address to, uint256 value) external nonpayable
returns(bool)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| from | address |  |
| to | address |  |
| value | uint256 |  |

### totalSupply

⤿ Overridden Implementation\(s\): [ERC20.totalSupply](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ERC20.md#totalsupply)

```javascript
function totalSupply() external view
returns(uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### balanceOf

⤿ Overridden Implementation\(s\): [ERC20.balanceOf](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ERC20.md#balanceof)

```javascript
function balanceOf(address who) external view
returns(uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| who | address |  |

### allowance

⤿ Overridden Implementation\(s\): [ERC20.allowance](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ERC20.md#allowance)

```javascript
function allowance(address owner, address spender) external view
returns(uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| owner | address |  |
| spender | address |  |

