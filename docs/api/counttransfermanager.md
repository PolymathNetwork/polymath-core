---
id: version-3.0.0-CountTransferManager
title: CountTransferManager
original_id: CountTransferManager
---

# Transfer Manager for limiting maximum number of token holders \(CountTransferManager.sol\)

View Source: [contracts/modules/TransferManager/CTM/CountTransferManager.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/modules/TransferManager/CTM/CountTransferManager.sol)

**↗ Extends:** [**CountTransferManagerStorage**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/CountTransferManagerStorage.md)**,** [**TransferManager**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/TransferManager.md) **↘ Derived Contracts:** [**MockCountTransferManager**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/MockCountTransferManager.md)

**CountTransferManager**

**Events**

```javascript
event ModifyHolderCount(uint256  _oldHolderCount, uint256  _newHolderCount);
```

## Functions

* [\(address \_securityToken, address \_polyToken\)](counttransfermanager.md)
* [executeTransfer\(address \_from, address \_to, uint256 \_amount, bytes \)](counttransfermanager.md#executetransfer)
* [verifyTransfer\(address \_from, address \_to, uint256 \_amount, bytes \)](counttransfermanager.md#verifytransfer)
* [\_verifyTransfer\(address \_from, address \_to, uint256 \_amount, uint256 \_holderCount\)](counttransfermanager.md#_verifytransfer)
* [configure\(uint256 \_maxHolderCount\)](counttransfermanager.md#configure)
* [changeHolderCount\(uint256 \_maxHolderCount\)](counttransfermanager.md#changeholdercount)
* [getInitFunction\(\)](counttransfermanager.md#getinitfunction)
* [getPermissions\(\)](counttransfermanager.md#getpermissions)

Constructor

```javascript
function (address _securityToken, address _polyToken) public nonpayable Module
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_securityToken | address | Address of the security token |
| \_polyToken | address |  |

### executeTransfer

⤾ overrides [ITransferManager.executeTransfer](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ITransferManager.md#executetransfer)

Used to verify the transfer transaction and prevent a transfer if it passes the allowed amount of token holders

```javascript
function executeTransfer(address _from, address _to, uint256 _amount, bytes ) external nonpayable
returns(enum ITransferManager.Result)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_from | address | Address of the sender |
| \_to | address | Address of the receiver |
| \_amount | uint256 | Amount to send |
|  | bytes | \_from Address of the sender |

### verifyTransfer

⤾ overrides [ITransferManager.verifyTransfer](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ITransferManager.md#verifytransfer)

Used to verify the transfer transaction and prevent a transfer if it passes the allowed amount of token holders

```javascript
function verifyTransfer(address _from, address _to, uint256 _amount, bytes ) public view
returns(enum ITransferManager.Result, bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_from | address | Address of the sender |
| \_to | address | Address of the receiver |
| \_amount | uint256 | Amount to send |
|  | bytes | \_from Address of the sender |

### \_verifyTransfer

```javascript
function _verifyTransfer(address _from, address _to, uint256 _amount, uint256 _holderCount) internal view
returns(enum ITransferManager.Result, bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_from | address |  |
| \_to | address |  |
| \_amount | uint256 |  |
| \_holderCount | uint256 |  |

### configure

Used to initialize the variables of the contract

```javascript
function configure(uint256 _maxHolderCount) public nonpayable onlyFactory
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_maxHolderCount | uint256 | Maximum no. of holders this module allows the SecurityToken to have |

### changeHolderCount

Sets the cap for the amount of token holders there can be

```javascript
function changeHolderCount(uint256 _maxHolderCount) public nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_maxHolderCount | uint256 | is the new maximum amount of token holders |

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


### getPermissions

⤾ overrides [IModule.getPermissions](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModule.md#getpermissions)

Returns the permissions flag that are associated with CountTransferManager

```javascript
function getPermissions() public view
returns(bytes32[])
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


