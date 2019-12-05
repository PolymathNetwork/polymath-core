---
id: version-3.0.0-ICheckPermission
title: ICheckPermission
original_id: ICheckPermission
---

# ICheckPermission.sol

View Source: [contracts/interfaces/ICheckPermission.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/interfaces/ICheckPermission.sol)

**ICheckPermission**

## Functions

* [checkPermission\(address \_delegate, address \_module, bytes32 \_perm\)](icheckpermission.md#checkpermission)

### checkPermission

Validate permissions with PermissionManager if it exists, If no Permission return false

```javascript
function checkPermission(address _delegate, address _module, bytes32 _perm) external view
returns(hasPerm bool)
```

**Returns**

success

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_delegate | address | address of delegate |
| \_module | address | address of PermissionManager module |
| \_perm | bytes32 | the permissions |

