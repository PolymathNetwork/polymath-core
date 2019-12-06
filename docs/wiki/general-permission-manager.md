# General Permission Manager

|  |  |
| :--- | :--- |
| **Introduced in** | 1.3.0 |
| **Contract name** | GeneralPermissionManager.sol |
| **Compatible ST Protocol version range** | ^3.0.0 |
| **Type** | Permission Manager Module |

## How it works

The GPM allows the issuer to add wallets as delegates and to give them permission to use restricted functions on other modules. Every time one of these functions is called on a module, it will check if the sender is allowed to do it.  
For example, the issuer can give an associate the ability to work on the tokens whitelist by giving his address the `WHITELIST` permission on the `GeneralTransferManager`.

## Key functionalities \(as defined in the Smart Contract\)

### Initialization

This module is initialized without any parameters.

### Checking permissions

Called by modules when restricted functions are called by a non-owner wallet. If the address passed is a delegate and it has the required permission for the given module and function, it returns true and it allows to execute the restricted function on that module. Otherwise, it returns false.

```text
    /**
     * @notice Used to check the permission on delegate corresponds to module contract address
     * @param _delegate Ethereum address of the delegate
     * @param _module Ethereum contract address of the module
     * @param _perm Permission flag
     * @return bool
     */
    function checkPermission(address _delegate, address _module, bytes32 _perm) external view returns(bool)
```

### Adding delegates

To change permission, it is necessary to have added a delegate previously. This can be done by calling the following function, where `_details` is a required description \(I.E: “Business partner”, “KYC Partner”\) for the `_delegate`. Some required checks:-

* `_delgate` address shouldn’t be 0x0.
* `_details` shouldn’t be bytes32\(0\).
* `_delegate` shouldn’t already exist.

```text
    /**
     * @notice Used to add a delegate
     * @param _delegate Ethereum address of the delegate
     * @param _details Details about the delegate i.e `Belongs to financial firm`
     */
    function addDelegate(address _delegate, bytes32 _details) external withPerm(ADMIN)
```

This means the order of the right operations is:

1. Add a delegate
2. Add as many permissions as needed on different modules to an existing delegate.

**Note:** Only the issuer or a designated ADMIN \(through this module\) can add delegates.

### Adding delegates Multi

This is a batch version of the `addDelegate()` function with the same checks.

```text
/**
 * @notice Used to add multiple delegates in a batch
 * @param _delegates An array of Ethereum addresses of the delegates
 * @param _details An array of details about the delegates i.e `Belongs to financial firm`
 */
function addDelegateMulti(address[] calldata _delegates, bytes32[] calldata _details) external withPerm(ADMIN)
```

### Changing permissions

Once delegates are added, this module can change the permissions assigned to them \(allow or disallow\).

* Change single permission for a single module for a delegate by calling:

  ```text
    /**
     * @notice Used to provide/change the permission to the delegate corresponds to the module contract
     * @param _delegate Ethereum address of the delegate
     * @param _module Ethereum contract address of the module
     * @param _perm Permission flag
     * @param _valid Bool flag use to switch on/off the permission
     * @return bool
     */
    function changePermission(address _delegate, address _module, bytes32 _perm, bool _valid) public withPerm(ADMIN)
  ```

* Change multiple permissions for multiple modules for a delegate by calling:

```text
    /**
     * @notice Used to change one or more permissions for a single delegate at once
     * @param _delegate Ethereum address of the delegate
     * @param _modules Multiple modules matching the multi perms needs to be the same length
     * @param _perms Multiple permission flag needs to be changed
     * @param _valids Bool array consist the flag to switch on/off the permission
     * @return nothing
     */
    function changePermissionMulti(
        address _delegate,
        address[] memory _modules,
        bytes32[] memory _perms,
        bool[] memory _valids
    )
        public
        withPerm(ADMIN)
```

**Note:** An only issuer or a designated ADMIN \(through this module\) can change permissions.

### Removing delegates

By removing a delegate, all its permission will be removed too. This means that if the delegate is a delegate is added again in the future, it will be necessary to change its permissions again.

**Note:** An only issuer or a designated ADMIN \(through this module\) can change permissions.

```text
    /**
     * @notice Used to delete a delegate
     * @param _delegate Ethereum address of the delegate
     */
    function deleteDelegate(address _delegate) external withPerm(ADMIN)
```

### Remove delegate Multi

Batch version of the `deleteDelegate()` function with the same check.

```text
 /**
 * @notice Used to delete a list of delegates
 * @param _delegates An array of Ethereum address of delegates
 */
function deleteDelegateMulti(address[] calldata _delegates) external withPerm(ADMIN)
```

### Getters

This module provides several functions to access delegates and permissions:

* Check if an address is a delegate or not by calling: 

```text
    /**
     * @notice Used to check if an address is a delegate or not
     * @param _potentialDelegate the address of potential delegate
     * @return bool
     */
    function checkDelegate(address _potentialDelegate) external view returns(bool)
```

* Get all delegates with a given permission and module by calling: 

```text
    /**
     * @notice Used to return all delegates with a given permission and module
     * @param _module Ethereum contract address of the module
     * @param _perm Permission flag
     * @return address[]
     */
    function getAllDelegatesWithPerm(address _module, bytes32 _perm) external view returns(address[] memory)
```

**Note:** Should be called off-chain only

* Get all permissions for a delegate through all modules of the given types for a security token by calling:

  ```text
    /**
     * @notice Used to return all permission of a single or multiple modules
     * @dev possible that function get out of gas is there are a lot of modules and perm related to them
     * @param _delegate Ethereum address of the delegate
     * @param _types uint8[] of types
     * @return address[] the address array of Modules this delegate has permission
     * @return bytes32[] the permission array of the corresponding Modules
     */
    function getAllModulesAndPermsFromTypes(address _delegate, uint8[] calldata _types) external view returns(
        address[] memory,
        bytes32[] memory
    )
  ```

**Note:** Should be called off-chain only

* Get all delegates by calling

```text
    /**
     * @notice Used to get all delegates
     * @return address[]
     */
    function getAllDelegates() external view returns(address[] memory)
```

