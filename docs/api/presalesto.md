---
id: version-3.0.0-PreSaleSTO
title: PreSaleSTO
original_id: PreSaleSTO
---

# STO module for private presales \(PreSaleSTO.sol\)

View Source: [contracts/modules/STO/PreSale/PreSaleSTO.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/modules/STO/PreSale/PreSaleSTO.sol)

**↗ Extends:** [**PreSaleSTOStorage**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/PreSaleSTOStorage.md)**,** [**STO**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/STO.md)

**PreSaleSTO**

**Events**

```javascript
event TokensAllocated(address  _investor, uint256  _amount);
```

## Functions

* [\(address \_securityToken, address \_polyToken\)](presalesto.md)
* [configure\(uint256 \_endTime\)](presalesto.md#configure)
* [getInitFunction\(\)](presalesto.md#getinitfunction)
* [getNumberInvestors\(\)](presalesto.md#getnumberinvestors)
* [getTokensSold\(\)](presalesto.md#gettokenssold)
* [getPermissions\(\)](presalesto.md#getpermissions)
* [allocateTokens\(address \_investor, uint256 \_amount, uint256 \_etherContributed, uint256 \_polyContributed\)](presalesto.md#allocatetokens)
* [allocateTokensMulti\(address\[\] \_investors, uint256\[\] \_amounts, uint256\[\] \_etherContributed, uint256\[\] \_polyContributed\)](presalesto.md#allocatetokensmulti)

Constructor

```javascript
function (address _securityToken, address _polyToken) public nonpayable Module
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_securityToken | address | Address of the security token |
| \_polyToken | address |  |

### configure

Function used to initialize the different variables

```javascript
function configure(uint256 _endTime) public nonpayable onlyFactory
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_endTime | uint256 | Unix timestamp at which offering ends |

### getInitFunction

⤾ overrides [IModule.getInitFunction](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModule.md#getinitfunction)

This function returns the signature of the configure function

```javascript
function getInitFunction() public pure
returns(bytes4)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### getNumberInvestors

Returns the total no. of investors

```javascript
function getNumberInvestors() public view
returns(uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### getTokensSold

⤾ overrides [STO.getTokensSold](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/STO.md#gettokenssold)

Returns the total no. of tokens sold

```javascript
function getTokensSold() external view
returns(uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### getPermissions

⤾ overrides [IModule.getPermissions](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModule.md#getpermissions)

Returns the permissions flag that are associated with STO

```javascript
function getPermissions() public view
returns(bytes32[])
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### allocateTokens

Function used to allocate tokens to the investor

```javascript
function allocateTokens(address _investor, uint256 _amount, uint256 _etherContributed, uint256 _polyContributed) public nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_investor | address | Address of the investor |
| \_amount | uint256 | No. of tokens to be transferred to the investor |
| \_etherContributed | uint256 | How much ETH was contributed |
| \_polyContributed | uint256 | How much POLY was contributed |

### allocateTokensMulti

Function used to allocate tokens to multiple investors

```javascript
function allocateTokensMulti(address[] _investors, uint256[] _amounts, uint256[] _etherContributed, uint256[] _polyContributed) public nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_investors | address\[\] | Array of address of the investors |
| \_amounts | uint256\[\] | Array of no. of tokens to be transferred to the investors |
| \_etherContributed | uint256\[\] | Array of amount of ETH contributed by each investor |
| \_polyContributed | uint256\[\] | Array of amount of POLY contributed by each investor |

