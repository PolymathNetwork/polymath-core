---
id: version-3.0.0-BlacklistTransferManager
title: BlacklistTransferManager
original_id: BlacklistTransferManager
---

# Transfer Manager module to automate blacklist and restrict transfers \(BlacklistTransferManager.sol\)

View Source: [contracts/modules/TransferManager/BTM/BlacklistTransferManager.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/modules/TransferManager/BTM/BlacklistTransferManager.sol)

**↗ Extends:** [**BlacklistTransferManagerStorage**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/BlacklistTransferManagerStorage.md)**,** [**TransferManager**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/TransferManager.md)

**BlacklistTransferManager**

**Events**

```javascript
event AddBlacklistType(uint256  _startTime, uint256  _endTime, bytes32  _blacklistName, uint256  _repeatPeriodTime);
event ModifyBlacklistType(uint256  _startTime, uint256  _endTime, bytes32  _blacklistName, uint256  _repeatPeriodTime);
event DeleteBlacklistType(bytes32  _blacklistName);
event AddInvestorToBlacklist(address indexed _investor, bytes32  _blacklistName);
event DeleteInvestorFromBlacklist(address indexed _investor, bytes32  _blacklistName);
```

## Functions

* [\(address \_securityToken, address \_polyAddress\)](blacklisttransfermanager.md)
* [getInitFunction\(\)](blacklisttransfermanager.md#getinitfunction)
* [executeTransfer\(address \_from, address , uint256 , bytes \)](blacklisttransfermanager.md#executetransfer)
* [verifyTransfer\(address \_from, address , uint256 , bytes \)](blacklisttransfermanager.md#verifytransfer)
* [\_verifyTransfer\(address \_from\)](blacklisttransfermanager.md#_verifytransfer)
* [addBlacklistType\(uint256 \_startTime, uint256 \_endTime, bytes32 \_blacklistName, uint256 \_repeatPeriodTime\)](blacklisttransfermanager.md#addblacklisttype)
* [\_addBlacklistType\(uint256 \_startTime, uint256 \_endTime, bytes32 \_blacklistName, uint256 \_repeatPeriodTime\)](blacklisttransfermanager.md#_addblacklisttype)
* [\_addBlacklistTypeDetails\(uint256 \_startTime, uint256 \_endTime, bytes32 \_blacklistName, uint256 \_repeatPeriodTime\)](blacklisttransfermanager.md#_addblacklisttypedetails)
* [addBlacklistTypeMulti\(uint256\[\] \_startTimes, uint256\[\] \_endTimes, bytes32\[\] \_blacklistNames, uint256\[\] \_repeatPeriodTimes\)](blacklisttransfermanager.md#addblacklisttypemulti)
* [modifyBlacklistType\(uint256 \_startTime, uint256 \_endTime, bytes32 \_blacklistName, uint256 \_repeatPeriodTime\)](blacklisttransfermanager.md#modifyblacklisttype)
* [\_modifyBlacklistType\(uint256 \_startTime, uint256 \_endTime, bytes32 \_blacklistName, uint256 \_repeatPeriodTime\)](blacklisttransfermanager.md#_modifyblacklisttype)
* [modifyBlacklistTypeMulti\(uint256\[\] \_startTimes, uint256\[\] \_endTimes, bytes32\[\] \_blacklistNames, uint256\[\] \_repeatPeriodTimes\)](blacklisttransfermanager.md#modifyblacklisttypemulti)
* [deleteBlacklistType\(bytes32 \_blacklistName\)](blacklisttransfermanager.md#deleteblacklisttype)
* [\_deleteBlacklistType\(bytes32 \_blacklistName\)](blacklisttransfermanager.md#_deleteblacklisttype)
* [deleteBlacklistTypeMulti\(bytes32\[\] \_blacklistNames\)](blacklisttransfermanager.md#deleteblacklisttypemulti)
* [addInvestorToBlacklist\(address \_investor, bytes32 \_blacklistName\)](blacklisttransfermanager.md#addinvestortoblacklist)
* [\_addInvestorToBlacklist\(address \_investor, bytes32 \_blacklistName\)](blacklisttransfermanager.md#_addinvestortoblacklist)
* [addInvestorToBlacklistMulti\(address\[\] \_investors, bytes32 \_blacklistName\)](blacklisttransfermanager.md#addinvestortoblacklistmulti)
* [addMultiInvestorToBlacklistMulti\(address\[\] \_investors, bytes32\[\] \_blacklistNames\)](blacklisttransfermanager.md#addmultiinvestortoblacklistmulti)
* [addInvestorToNewBlacklist\(uint256 \_startTime, uint256 \_endTime, bytes32 \_blacklistName, uint256 \_repeatPeriodTime, address \_investor\)](blacklisttransfermanager.md#addinvestortonewblacklist)
* [deleteInvestorFromBlacklist\(address \_investor, bytes32 \_blacklistName\)](blacklisttransfermanager.md#deleteinvestorfromblacklist)
* [\_deleteInvestorFromBlacklist\(address \_investor, bytes32 \_blacklistName\)](blacklisttransfermanager.md#_deleteinvestorfromblacklist)
* [deleteInvestorFromAllBlacklist\(address \_investor\)](blacklisttransfermanager.md#deleteinvestorfromallblacklist)
* [\_deleteInvestorFromAllBlacklist\(address \_investor\)](blacklisttransfermanager.md#_deleteinvestorfromallblacklist)
* [deleteInvestorFromAllBlacklistMulti\(address\[\] \_investor\)](blacklisttransfermanager.md#deleteinvestorfromallblacklistmulti)
* [deleteMultiInvestorsFromBlacklistMulti\(address\[\] \_investors, bytes32\[\] \_blacklistNames\)](blacklisttransfermanager.md#deletemultiinvestorsfromblacklistmulti)
* [\_validParams\(uint256 \_startTime, uint256 \_endTime, bytes32 \_blacklistName, uint256 \_repeatPeriodTime\)](blacklisttransfermanager.md#_validparams)
* [getListOfAddresses\(bytes32 \_blacklistName\)](blacklisttransfermanager.md#getlistofaddresses)
* [getBlacklistNamesToUser\(address \_user\)](blacklisttransfermanager.md#getblacklistnamestouser)
* [getAllBlacklists\(\)](blacklisttransfermanager.md#getallblacklists)
* [getTokensByPartition\(bytes32 \_partition, address \_tokenHolder, uint256 \_additionalBalance\)](blacklisttransfermanager.md#gettokensbypartition)
* [getPermissions\(\)](blacklisttransfermanager.md#getpermissions)

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

Used to verify the transfer transaction

```javascript
function executeTransfer(address _from, address , uint256 , bytes ) external nonpayable
returns(enum ITransferManager.Result)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_from | address | Address of the sender |
|  | address | \_from Address of the sender |
|  | uint256 | \_from Address of the sender |
|  | bytes | \_from Address of the sender |

### verifyTransfer

⤾ overrides [ITransferManager.verifyTransfer](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ITransferManager.md#verifytransfer)

Used to verify the transfer transaction \(View\)

```javascript
function verifyTransfer(address _from, address , uint256 , bytes ) public view
returns(enum ITransferManager.Result, bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_from | address | Address of the sender |
|  | address | \_from Address of the sender |
|  | uint256 | \_from Address of the sender |
|  | bytes | \_from Address of the sender |

### \_verifyTransfer

```javascript
function _verifyTransfer(address _from) internal view
returns(enum ITransferManager.Result, bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_from | address |  |

### addBlacklistType

Used to add the blacklist type

```javascript
function addBlacklistType(uint256 _startTime, uint256 _endTime, bytes32 _blacklistName, uint256 _repeatPeriodTime) public nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_startTime | uint256 | Start date of the blacklist type |
| \_endTime | uint256 | End date of the blacklist type |
| \_blacklistName | bytes32 | Name of the blacklist type |
| \_repeatPeriodTime | uint256 | Repeat period of the blacklist type in days |

### \_addBlacklistType

```javascript
function _addBlacklistType(uint256 _startTime, uint256 _endTime, bytes32 _blacklistName, uint256 _repeatPeriodTime) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_startTime | uint256 |  |
| \_endTime | uint256 |  |
| \_blacklistName | bytes32 |  |
| \_repeatPeriodTime | uint256 |  |

### \_addBlacklistTypeDetails

```javascript
function _addBlacklistTypeDetails(uint256 _startTime, uint256 _endTime, bytes32 _blacklistName, uint256 _repeatPeriodTime) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_startTime | uint256 |  |
| \_endTime | uint256 |  |
| \_blacklistName | bytes32 |  |
| \_repeatPeriodTime | uint256 |  |

### addBlacklistTypeMulti

Used to add the multiple blacklist type

```javascript
function addBlacklistTypeMulti(uint256[] _startTimes, uint256[] _endTimes, bytes32[] _blacklistNames, uint256[] _repeatPeriodTimes) public nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_startTimes | uint256\[\] | Start date of the blacklist type |
| \_endTimes | uint256\[\] | End date of the blacklist type |
| \_blacklistNames | bytes32\[\] | Name of the blacklist type |
| \_repeatPeriodTimes | uint256\[\] | Repeat period of the blacklist type |

### modifyBlacklistType

Used to modify the details of a given blacklist type

```javascript
function modifyBlacklistType(uint256 _startTime, uint256 _endTime, bytes32 _blacklistName, uint256 _repeatPeriodTime) public nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_startTime | uint256 | Start date of the blacklist type |
| \_endTime | uint256 | End date of the blacklist type |
| \_blacklistName | bytes32 | Name of the blacklist type |
| \_repeatPeriodTime | uint256 | Repeat period of the blacklist type |

### \_modifyBlacklistType

```javascript
function _modifyBlacklistType(uint256 _startTime, uint256 _endTime, bytes32 _blacklistName, uint256 _repeatPeriodTime) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_startTime | uint256 |  |
| \_endTime | uint256 |  |
| \_blacklistName | bytes32 |  |
| \_repeatPeriodTime | uint256 |  |

### modifyBlacklistTypeMulti

Used to modify the details of a given multpile blacklist types

```javascript
function modifyBlacklistTypeMulti(uint256[] _startTimes, uint256[] _endTimes, bytes32[] _blacklistNames, uint256[] _repeatPeriodTimes) public nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_startTimes | uint256\[\] | Start date of the blacklist type |
| \_endTimes | uint256\[\] | End date of the blacklist type |
| \_blacklistNames | bytes32\[\] | Name of the blacklist type |
| \_repeatPeriodTimes | uint256\[\] | Repeat period of the blacklist type |

### deleteBlacklistType

Used to delete the blacklist type

```javascript
function deleteBlacklistType(bytes32 _blacklistName) public nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_blacklistName | bytes32 | Name of the blacklist type |

### \_deleteBlacklistType

```javascript
function _deleteBlacklistType(bytes32 _blacklistName) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_blacklistName | bytes32 |  |

### deleteBlacklistTypeMulti

Used to delete the multiple blacklist type

```javascript
function deleteBlacklistTypeMulti(bytes32[] _blacklistNames) public nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_blacklistNames | bytes32\[\] | Name of the blacklist type |

### addInvestorToBlacklist

Used to assign the blacklist type to the investor

```javascript
function addInvestorToBlacklist(address _investor, bytes32 _blacklistName) public nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_investor | address | Address of the investor |
| \_blacklistName | bytes32 | Name of the blacklist |

### \_addInvestorToBlacklist

```javascript
function _addInvestorToBlacklist(address _investor, bytes32 _blacklistName) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_investor | address |  |
| \_blacklistName | bytes32 |  |

### addInvestorToBlacklistMulti

Used to assign the blacklist type to the multiple investor

```javascript
function addInvestorToBlacklistMulti(address[] _investors, bytes32 _blacklistName) public nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_investors | address\[\] | Address of the investor |
| \_blacklistName | bytes32 | Name of the blacklist |

### addMultiInvestorToBlacklistMulti

Used to assign the multiple blacklist type to the multiple investor

```javascript
function addMultiInvestorToBlacklistMulti(address[] _investors, bytes32[] _blacklistNames) public nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_investors | address\[\] | Address of the investor |
| \_blacklistNames | bytes32\[\] | Name of the blacklist |

### addInvestorToNewBlacklist

Used to assign the new blacklist type to the investor

```javascript
function addInvestorToNewBlacklist(uint256 _startTime, uint256 _endTime, bytes32 _blacklistName, uint256 _repeatPeriodTime, address _investor) public nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_startTime | uint256 | Start date of the blacklist type |
| \_endTime | uint256 | End date of the blacklist type |
| \_blacklistName | bytes32 | Name of the blacklist type |
| \_repeatPeriodTime | uint256 | Repeat period of the blacklist type |
| \_investor | address | Address of the investor |

### deleteInvestorFromBlacklist

Used to delete the investor from the blacklist

```javascript
function deleteInvestorFromBlacklist(address _investor, bytes32 _blacklistName) public nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_investor | address | Address of the investor |
| \_blacklistName | bytes32 | Name of the blacklist |

### \_deleteInvestorFromBlacklist

Used to delete the investor from the blacklist

```javascript
function _deleteInvestorFromBlacklist(address _investor, bytes32 _blacklistName) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_investor | address | Address of the investor |
| \_blacklistName | bytes32 | Name of the blacklist |

### deleteInvestorFromAllBlacklist

Used to delete the investor from all the associated blacklist types

```javascript
function deleteInvestorFromAllBlacklist(address _investor) public nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_investor | address | Address of the investor |

### \_deleteInvestorFromAllBlacklist

Used to delete the investor from all the associated blacklist types

```javascript
function _deleteInvestorFromAllBlacklist(address _investor) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_investor | address | Address of the investor |

### deleteInvestorFromAllBlacklistMulti

Used to delete the multiple investor from all the associated blacklist types

```javascript
function deleteInvestorFromAllBlacklistMulti(address[] _investor) public nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_investor | address\[\] | Address of the investor |

### deleteMultiInvestorsFromBlacklistMulti

Used to delete the multiple investor from the blacklist

```javascript
function deleteMultiInvestorsFromBlacklistMulti(address[] _investors, bytes32[] _blacklistNames) public nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_investors | address\[\] | address of the investor |
| \_blacklistNames | bytes32\[\] | name of the blacklist |

### \_validParams

Internal function

```javascript
function _validParams(uint256 _startTime, uint256 _endTime, bytes32 _blacklistName, uint256 _repeatPeriodTime) internal view
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_startTime | uint256 |  |
| \_endTime | uint256 |  |
| \_blacklistName | bytes32 |  |
| \_repeatPeriodTime | uint256 |  |

### getListOfAddresses

get the list of the investors of a blacklist type

```javascript
function getListOfAddresses(bytes32 _blacklistName) external view
returns(address[])
```

**Returns**

address List of investors associated with the blacklist

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_blacklistName | bytes32 | Name of the blacklist type |

### getBlacklistNamesToUser

get the list of the investors of a blacklist type

```javascript
function getBlacklistNamesToUser(address _user) external view
returns(bytes32[])
```

**Returns**

bytes32 List of blacklist names associated with the given address

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_user | address | Address of the user |

### getAllBlacklists

get the list of blacklist names

```javascript
function getAllBlacklists() external view
returns(bytes32[])
```

**Returns**

bytes32 Array of blacklist names

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### getTokensByPartition

⤾ overrides [TransferManager.getTokensByPartition](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/TransferManager.md#gettokensbypartition)

return the amount of tokens for a given user as per the partition

```javascript
function getTokensByPartition(bytes32 _partition, address _tokenHolder, uint256 _additionalBalance) external view
returns(uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_partition | bytes32 | Identifier |
| \_tokenHolder | address | Whom token amount need to query |
| \_additionalBalance | uint256 | It is the `_value` that transfer during transfer/transferFrom function call |

### getPermissions

⤾ overrides [IModule.getPermissions](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModule.md#getpermissions)

Return the permissions flag that are associated with blacklist transfer manager

```javascript
function getPermissions() public view
returns(bytes32[])
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


