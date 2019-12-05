---
id: version-3.0.0-DummySTO
title: DummySTO
original_id: DummySTO
---

# STO module for sample implementation of a different crowdsale module \(DummySTO.sol\)

View Source: [contracts/mocks/Dummy/DummySTO.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/mocks/Dummy/DummySTO.sol)

**↗ Extends:** [**DummySTOStorage**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/DummySTOStorage.md)**,** [**STO**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/STO.md)

**DummySTO**

**Events**

```javascript
event GenerateTokens(address  _investor, uint256  _amount);
```

## Functions

* [\(address \_securityToken, address \_polyToken\)](dummysto.md)
* [configure\(uint256 \_startTime, uint256 \_endTime, uint256 \_cap, string \_someString\)](dummysto.md#configure)
* [getInitFunction\(\)](dummysto.md#getinitfunction)
* [generateTokens\(address \_investor, uint256 \_amount\)](dummysto.md#generatetokens)
* [getNumberInvestors\(\)](dummysto.md#getnumberinvestors)
* [getTokensSold\(\)](dummysto.md#gettokenssold)
* [getPermissions\(\)](dummysto.md#getpermissions)
* [\(\)](dummysto.md)

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

Function used to intialize the differnet variables

```javascript
function configure(uint256 _startTime, uint256 _endTime, uint256 _cap, string _someString) public nonpayable onlyFactory
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_startTime | uint256 | Unix timestamp at which offering get started |
| \_endTime | uint256 | Unix timestamp at which offering get ended |
| \_cap | uint256 | Maximum No. of tokens for sale |
| \_someString | string | Any string that contails the details |

### getInitFunction

⤾ overrides [IModule.getInitFunction](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModule.md#getinitfunction)

This function returns the signature of configure function

```javascript
function getInitFunction() public pure
returns(bytes4)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### generateTokens

Function used to generate the tokens

```javascript
function generateTokens(address _investor, uint256 _amount) public nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_investor | address | Address of the investor |
| \_amount | uint256 | Amount of ETH or Poly invested by the investor |

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

Returns the total no. of investors

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


```javascript
function () external payable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


