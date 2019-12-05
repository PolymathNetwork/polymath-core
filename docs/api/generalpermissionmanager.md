---
id: version-3.0.0-GeneralPermissionManager
title: GeneralPermissionManager
original_id: GeneralPermissionManager
---

# Permission Manager module for core permissioning functionality \(GeneralPermissionManager.sol\)

View Source: [contracts/modules/PermissionManager/GeneralPermissionManager.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/modules/PermissionManager/GeneralPermissionManager.sol)

**↗ Extends:** [**GeneralPermissionManagerStorage**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/GeneralPermissionManagerStorage.md)**,** [**IPermissionManager**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IPermissionManager.md)**,** [**Module**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/Module.md)

**GeneralPermissionManager**

**Events**

```javascript
event ChangePermission(address indexed _delegate, address  _module, bytes32  _perm, bool  _valid);
event AddDelegate(address indexed _delegate, bytes32  _details);
```

## Functions

* [\(address \_securityToken, address \_polyToken\)](generalpermissionmanager.md)
* [getInitFunction\(\)](generalpermissionmanager.md#getinitfunction)
* [checkPermission\(address \_delegate, address \_module, bytes32 \_perm\)](generalpermissionmanager.md#checkpermission)
* [addDelegate\(address \_delegate, bytes32 \_details\)](generalpermissionmanager.md#adddelegate)
* [deleteDelegate\(address \_delegate\)](generalpermissionmanager.md#deletedelegate)
* [checkDelegate\(address \_potentialDelegate\)](generalpermissionmanager.md#checkdelegate)
* [changePermission\(address \_delegate, address \_module, bytes32 \_perm, bool \_valid\)](generalpermissionmanager.md#changepermission)
* [changePermissionMulti\(address \_delegate, address\[\] \_modules, bytes32\[\] \_perms, bool\[\] \_valids\)](generalpermissionmanager.md#changepermissionmulti)
* [getAllDelegatesWithPerm\(address \_module, bytes32 \_perm\)](generalpermissionmanager.md#getalldelegateswithperm)
* [getAllModulesAndPermsFromTypes\(address \_delegate, uint8\[\] \_types\)](generalpermissionmanager.md#getallmodulesandpermsfromtypes)
* [\_changePermission\(address \_delegate, address \_module, bytes32 \_perm, bool \_valid\)](generalpermissionmanager.md#_changepermission)
* [getAllDelegates\(\)](generalpermissionmanager.md#getalldelegates)
* [getPermissions\(\)](generalpermissionmanager.md#getpermissions)

constructor

```javascript
function (address _securityToken, address _polyToken) public nonpayable Module
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_securityToken | address |  |
| \_polyToken | address |  |

### getInitFunction

⤾ overrides [IModule.getInitFunction](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModule.md#getinitfunction)

Init function i.e generalise function to maintain the structure of the module contract

```javascript
function getInitFunction() public pure
returns(bytes4)
```

**Returns**

bytes4

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### checkPermission

⤾ overrides [IPermissionManager.checkPermission](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IPermissionManager.md#checkpermission)

Used to check the permission on delegate corresponds to module contract address

```javascript
function checkPermission(address _delegate, address _module, bytes32 _perm) external view
returns(bool)
```

**Returns**

bool

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_delegate | address | Ethereum address of the delegate |
| \_module | address | Ethereum contract address of the module |
| \_perm | bytes32 | Permission flag |

### addDelegate

⤾ overrides [IPermissionManager.addDelegate](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IPermissionManager.md#adddelegate)

Used to add a delegate

```javascript
function addDelegate(address _delegate, bytes32 _details) external nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_delegate | address | Ethereum address of the delegate |
| \_details | bytes32 | Details about the delegate i.e `Belongs to financial firm` |

### deleteDelegate

⤾ overrides [IPermissionManager.deleteDelegate](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IPermissionManager.md#deletedelegate)

Used to delete a delegate

```javascript
function deleteDelegate(address _delegate) external nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_delegate | address | Ethereum address of the delegate |

### checkDelegate

⤾ overrides [IPermissionManager.checkDelegate](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IPermissionManager.md#checkdelegate)

Used to check if an address is a delegate or not

```javascript
function checkDelegate(address _potentialDelegate) external view
returns(bool)
```

**Returns**

bool

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_potentialDelegate | address | the address of potential delegate |

### changePermission

⤾ overrides [IPermissionManager.changePermission](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IPermissionManager.md#changepermission)

Used to provide/change the permission to the delegate corresponds to the module contract

```javascript
function changePermission(address _delegate, address _module, bytes32 _perm, bool _valid) public nonpayable withPerm
```

**Returns**

bool

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_delegate | address | Ethereum address of the delegate |
| \_module | address | Ethereum contract address of the module |
| \_perm | bytes32 | Permission flag |
| \_valid | bool | Bool flag use to switch on/off the permission |

### changePermissionMulti

⤾ overrides [IPermissionManager.changePermissionMulti](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IPermissionManager.md#changepermissionmulti)

Used to change one or more permissions for a single delegate at once

```javascript
function changePermissionMulti(address _delegate, address[] _modules, bytes32[] _perms, bool[] _valids) public nonpayable withPerm
```

**Returns**

nothing

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_delegate | address | Ethereum address of the delegate |
| \_modules | address\[\] | Multiple module matching the multiperms, needs to be same length |
| \_perms | bytes32\[\] | Multiple permission flag needs to be changed |
| \_valids | bool\[\] | Bool array consist the flag to switch on/off the permission |

### getAllDelegatesWithPerm

⤾ overrides [IPermissionManager.getAllDelegatesWithPerm](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IPermissionManager.md#getalldelegateswithperm)

Used to return all delegates with a given permission and module

```javascript
function getAllDelegatesWithPerm(address _module, bytes32 _perm) external view
returns(address[])
```

**Returns**

address\[\]

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_module | address | Ethereum contract address of the module |
| \_perm | bytes32 | Permission flag |

### getAllModulesAndPermsFromTypes

⤾ overrides [IPermissionManager.getAllModulesAndPermsFromTypes](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IPermissionManager.md#getallmodulesandpermsfromtypes)

Used to return all permission of a single or multiple module

```javascript
function getAllModulesAndPermsFromTypes(address _delegate, uint8[] _types) external view
returns(address[], bytes32[])
```

**Returns**

address\[\] the address array of Modules this delegate has permission

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_delegate | address | Ethereum address of the delegate |
| \_types | uint8\[\] | uint8\[\] of types |

### \_changePermission

Used to provide/change the permission to the delegate corresponds to the module contract

```javascript
function _changePermission(address _delegate, address _module, bytes32 _perm, bool _valid) internal nonpayable
```

**Returns**

bool

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_delegate | address | Ethereum address of the delegate |
| \_module | address | Ethereum contract address of the module |
| \_perm | bytes32 | Permission flag |
| \_valid | bool | Bool flag use to switch on/off the permission |

### getAllDelegates

⤾ overrides [IPermissionManager.getAllDelegates](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IPermissionManager.md#getalldelegates)

Used to get all delegates

```javascript
function getAllDelegates() external view
returns(address[])
```

**Returns**

address\[\]

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### getPermissions

⤾ overrides [IModule.getPermissions](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModule.md#getpermissions)

Returns the Permission flag related the `this` contract

```javascript
function getPermissions() public view
returns(bytes32[])
```

**Returns**

Array of permission flags

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


