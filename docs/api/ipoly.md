---
id: version-3.0.0-IPoly
title: IPoly
original_id: IPoly
---

# ERC20 interface \(IPoly.sol\)

View Source: [contracts/interfaces/IPoly.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/interfaces/IPoly.sol)

**IPoly**

see [https://github.com/ethereum/EIPs/issues/20](https://github.com/ethereum/EIPs/issues/20)

**Events**

```javascript
event Transfer(address indexed from, address indexed to, uint256  value);
event Approval(address indexed owner, address indexed spender, uint256  value);
```

## Functions

* [decimals\(\)](ipoly.md#decimals)
* [totalSupply\(\)](ipoly.md#totalsupply)
* [balanceOf\(address \_owner\)](ipoly.md#balanceof)
* [allowance\(address \_owner, address \_spender\)](ipoly.md#allowance)
* [transfer\(address \_to, uint256 \_value\)](ipoly.md#transfer)
* [transferFrom\(address \_from, address \_to, uint256 \_value\)](ipoly.md#transferfrom)
* [approve\(address \_spender, uint256 \_value\)](ipoly.md#approve)
* [decreaseApproval\(address \_spender, uint256 \_subtractedValue\)](ipoly.md#decreaseapproval)
* [increaseApproval\(address \_spender, uint256 \_addedValue\)](ipoly.md#increaseapproval)

### decimals

```javascript
function decimals() external view
returns(uint8)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### totalSupply

```javascript
function totalSupply() external view
returns(uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### balanceOf

```javascript
function balanceOf(address _owner) external view
returns(uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_owner | address |  |

### allowance

```javascript
function allowance(address _owner, address _spender) external view
returns(uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_owner | address |  |
| \_spender | address |  |

### transfer

```javascript
function transfer(address _to, uint256 _value) external nonpayable
returns(bool)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_to | address |  |
| \_value | uint256 |  |

### transferFrom

```javascript
function transferFrom(address _from, address _to, uint256 _value) external nonpayable
returns(bool)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_from | address |  |
| \_to | address |  |
| \_value | uint256 |  |

### approve

```javascript
function approve(address _spender, uint256 _value) external nonpayable
returns(bool)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_spender | address |  |
| \_value | uint256 |  |

### decreaseApproval

```javascript
function decreaseApproval(address _spender, uint256 _subtractedValue) external nonpayable
returns(bool)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_spender | address |  |
| \_subtractedValue | uint256 |  |

### increaseApproval

```javascript
function increaseApproval(address _spender, uint256 _addedValue) external nonpayable
returns(bool)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_spender | address |  |
| \_addedValue | uint256 |  |

