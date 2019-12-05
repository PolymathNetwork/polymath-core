---
id: version-3.0.0-SignedTransferManager
title: SignedTransferManager
original_id: SignedTransferManager
---

# Transfer Manager module for verifing transations with a signed message \(SignedTransferManager.sol\)

View Source: [contracts/modules/Experimental/TransferManager/SignedTransferManager.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/modules/Experimental/TransferManager/SignedTransferManager.sol)

**↗ Extends:** [**TransferManager**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/TransferManager.md)

**SignedTransferManager**

## Contract Members

**Constants & Variables**

```javascript
bytes32 public constant INVALID_SIG;
```

**Events**

```javascript
event SignatureUsed(bytes  _data);
```

## Functions

* [\(address \_securityToken, address \_polyAddress\)](signedtransfermanager.md)
* [getInitFunction\(\)](signedtransfermanager.md#getinitfunction)
* [checkSignatureValidity\(bytes \_data\)](signedtransfermanager.md#checksignaturevalidity)
* [checkSigner\(address \_signer\)](signedtransfermanager.md#checksigner)
* [executeTransfer\(address \_from, address \_to, uint256 \_amount, bytes \_data\)](signedtransfermanager.md#executetransfer)
* [verifyTransfer\(address \_from, address \_to, uint256 \_amount, bytes \_data\)](signedtransfermanager.md#verifytransfer)
* [invalidateSignature\(address \_from, address \_to, uint256 \_amount, bytes \_data\)](signedtransfermanager.md#invalidatesignature)
* [getPermissions\(\)](signedtransfermanager.md#getpermissions)
* [\_checkSignatureIsInvalid\(bytes \_data\)](signedtransfermanager.md#_checksignatureisinvalid)
* [\_checkSigner\(address \_signer\)](signedtransfermanager.md#_checksigner)
* [\_invalidateSignature\(bytes \_data\)](signedtransfermanager.md#_invalidatesignature)

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
function getInitFunction() external pure
returns(bytes4)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### checkSignatureValidity

function to check if a signature is still valid

```javascript
function checkSignatureValidity(bytes _data) external view
returns(bool)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_data | bytes | signature |

### checkSigner

```javascript
function checkSigner(address _signer) external view
returns(bool)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_signer | address |  |

### executeTransfer

⤾ overrides [ITransferManager.executeTransfer](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ITransferManager.md#executetransfer)

allow verify transfer with signature

```javascript
function executeTransfer(address _from, address _to, uint256 _amount, bytes _data) external nonpayable onlySecurityToken 
returns(enum ITransferManager.Result)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_from | address | address transfer from |
| \_to | address | address transfer to |
| \_amount | uint256 | transfer amount |
| \_data | bytes | signature |

Sig needs to be valid \(not used or deemed as invalid\) Signer needs to be in the signers mapping \|

### verifyTransfer

⤾ overrides [ITransferManager.verifyTransfer](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ITransferManager.md#verifytransfer)

allow verify transfer with signature

```javascript
function verifyTransfer(address _from, address _to, uint256 _amount, bytes _data) public view
returns(enum ITransferManager.Result, bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_from | address | address transfer from |
| \_to | address | address transfer to |
| \_amount | uint256 | transfer amount |
| \_data | bytes | signature |

Sig needs to be valid \(not used or deemed as invalid\) Signer needs to be in the signers mapping \|

### invalidateSignature

allow signers to deem a signature invalid

```javascript
function invalidateSignature(address _from, address _to, uint256 _amount, bytes _data) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_from | address | address transfer from |
| \_to | address | address transfer to |
| \_amount | uint256 | transfer amount |
| \_data | bytes | signature |

Sig needs to be valid \(not used or deemed as invalid\) Signer needs to be in the signers mapping \|

### getPermissions

⤾ overrides [IModule.getPermissions](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModule.md#getpermissions)

Return the permissions flag that are associated with ManualApproval transfer manager

```javascript
function getPermissions() public view
returns(bytes32[])
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### \_checkSignatureIsInvalid

```javascript
function _checkSignatureIsInvalid(bytes _data) internal view
returns(bool)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_data | bytes |  |

### \_checkSigner

```javascript
function _checkSigner(address _signer) internal view
returns(bool)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_signer | address |  |

### \_invalidateSignature

```javascript
function _invalidateSignature(bytes _data) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_data | bytes |  |

