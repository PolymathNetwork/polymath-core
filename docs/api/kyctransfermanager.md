---
id: version-3.0.0-KYCTransferManager
title: KYCTransferManager
original_id: KYCTransferManager
---

# Transfer Manager module for core transfer validation functionality \(KYCTransferManager.sol\)

View Source: [contracts/modules/Experimental/TransferManager/KYCTransferManager.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/modules/Experimental/TransferManager/KYCTransferManager.sol)

**↗ Extends:** [**TransferManager**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/TransferManager.md)

**KYCTransferManager**

## Contract Members

**Constants & Variables**

```javascript
bytes32 public constant KYC_NUMBER;
bytes32 public constant KYC_ARRAY;
```

## Functions

* [\(address \_securityToken, address \_polyAddress\)](kyctransfermanager.md)
* [getInitFunction\(\)](kyctransfermanager.md#getinitfunction)
* [executeTransfer\(address \_from, address \_to, uint256 \_amount, bytes \_data\)](kyctransfermanager.md#executetransfer)
* [verifyTransfer\(address , address \_to, uint256 , bytes \)](kyctransfermanager.md#verifytransfer)
* [modifyKYC\(address \_investor, bool \_kycStatus\)](kyctransfermanager.md#modifykyc)
* [\_modifyKYC\(address \_investor, bool \_kycStatus\)](kyctransfermanager.md#_modifykyc)
* [getKYCAddresses\(\)](kyctransfermanager.md#getkycaddresses)
* [checkKYC\(address \_investor\)](kyctransfermanager.md#checkkyc)
* [\_getKYCKey\(address \_identity\)](kyctransfermanager.md#_getkyckey)
* [getPermissions\(\)](kyctransfermanager.md#getpermissions)

Constructor

```javascript
function (address _securityToken, address _polyAddress) public nonpayable Module
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_securityToken | address | Address of the security token |
| \_polyAddress | address | Address of the polytoken |

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


### executeTransfer

⤾ overrides [ITransferManager.executeTransfer](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ITransferManager.md#executetransfer)

```javascript
function executeTransfer(address _from, address _to, uint256 _amount, bytes _data) external nonpayable
returns(enum ITransferManager.Result)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_from | address |  |
| \_to | address |  |
| \_amount | uint256 |  |
| \_data | bytes |  |

### verifyTransfer

⤾ overrides [ITransferManager.verifyTransfer](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ITransferManager.md#verifytransfer)

```javascript
function verifyTransfer(address , address _to, uint256 , bytes ) public view
returns(enum ITransferManager.Result, bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
|  | address |  |
| \_to | address |  |
|  | uint256 |  |
|  | bytes |  |

### modifyKYC

```javascript
function modifyKYC(address _investor, bool _kycStatus) public nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_investor | address |  |
| \_kycStatus | bool |  |

### \_modifyKYC

```javascript
function _modifyKYC(address _investor, bool _kycStatus) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_investor | address |  |
| \_kycStatus | bool |  |

### getKYCAddresses

```javascript
function getKYCAddresses() public view
returns(address[])
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### checkKYC

```javascript
function checkKYC(address _investor) public view
returns(kyc bool)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_investor | address |  |

### \_getKYCKey

```javascript
function _getKYCKey(address _identity) internal pure
returns(bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_identity | address |  |

### getPermissions

⤾ overrides [IModule.getPermissions](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModule.md#getpermissions)

Return the permissions flag that are associated with this module

```javascript
function getPermissions() public view
returns(bytes32[])
```

**Returns**

bytes32 array

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


