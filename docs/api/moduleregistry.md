---
id: version-3.0.0-ModuleRegistry
title: ModuleRegistry
original_id: ModuleRegistry
---

# Registry contract to store registered modules \(ModuleRegistry.sol\)

View Source: [contracts/ModuleRegistry.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/ModuleRegistry.sol)

**↗ Extends:** [**IModuleRegistry**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModuleRegistry.md)**,** [**EternalStorage**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/EternalStorage.md) **↘ Derived Contracts:** [**MockModuleRegistry**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/MockModuleRegistry.md)

**ModuleRegistry**

Only Polymath can register and verify module factories to make them available for issuers to attach.

## Contract Members

**Constants & Variables**

```javascript
bytes32 internal constant INITIALIZE;
bytes32 internal constant LOCKED;
bytes32 internal constant POLYTOKEN;
bytes32 internal constant PAUSED;
bytes32 internal constant OWNER;
bytes32 internal constant POLYMATHREGISTRY;
bytes32 internal constant FEATURE_REGISTRY;
bytes32 internal constant SECURITY_TOKEN_REGISTRY;
```

## Modifiers

* [onlyOwner](moduleregistry.md#onlyowner)
* [whenNotPausedOrOwner](moduleregistry.md#whennotpausedorowner)
* [nonReentrant](moduleregistry.md#nonreentrant)
* [whenNotPaused](moduleregistry.md#whennotpaused)
* [whenPaused](moduleregistry.md#whenpaused)

### onlyOwner

Throws if called by any account other than the owner.

```javascript
modifier onlyOwner() internal
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### whenNotPausedOrOwner

Modifier to make a function callable only when the contract is not paused.

```javascript
modifier whenNotPausedOrOwner() internal
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### nonReentrant

Modifier to prevent reentrancy

```javascript
modifier nonReentrant() internal
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### whenNotPaused

Modifier to make a function callable only when the contract is not paused and ignore is msg.sender is owner.

```javascript
modifier whenNotPaused() internal
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### whenPaused

Modifier to make a function callable only when the contract is paused.

```javascript
modifier whenPaused() internal
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


## Functions

* [\_whenNotPausedOrOwner\(\)](moduleregistry.md#_whennotpausedorowner)
* [\(\)](moduleregistry.md)
* [initialize\(address \_polymathRegistry, address \_owner\)](moduleregistry.md#initialize)
* [\_customModules\(\)](moduleregistry.md#_custommodules)
* [useModule\(address \_moduleFactory\)](moduleregistry.md#usemodule)
* [useModule\(address \_moduleFactory, bool \_isUpgrade\)](moduleregistry.md#usemodule)
* [isCompatibleModule\(address \_moduleFactory, address \_securityToken\)](moduleregistry.md#iscompatiblemodule)
* [registerModule\(address \_moduleFactory\)](moduleregistry.md#registermodule)
* [removeModule\(address \_moduleFactory\)](moduleregistry.md#removemodule)
* [verifyModule\(address \_moduleFactory\)](moduleregistry.md#verifymodule)
* [unverifyModule\(address \_moduleFactory\)](moduleregistry.md#unverifymodule)
* [getTagsByTypeAndToken\(uint8 \_moduleType, address \_securityToken\)](moduleregistry.md#gettagsbytypeandtoken)
* [getTagsByType\(uint8 \_moduleType\)](moduleregistry.md#gettagsbytype)
* [\_tagsByModules\(address\[\] \_modules\)](moduleregistry.md#_tagsbymodules)
* [getFactoryDetails\(address \_factoryAddress\)](moduleregistry.md#getfactorydetails)
* [getModulesByType\(uint8 \_moduleType\)](moduleregistry.md#getmodulesbytype)
* [getAllModulesByType\(uint8 \_moduleType\)](moduleregistry.md#getallmodulesbytype)
* [getModulesByTypeAndToken\(uint8 \_moduleType, address \_securityToken\)](moduleregistry.md#getmodulesbytypeandtoken)
* [reclaimERC20\(address \_tokenContract\)](moduleregistry.md#reclaimerc20)
* [pause\(\)](moduleregistry.md#pause)
* [unpause\(\)](moduleregistry.md#unpause)
* [updateFromRegistry\(\)](moduleregistry.md#updatefromregistry)
* [transferOwnership\(address \_newOwner\)](moduleregistry.md#transferownership)
* [owner\(\)](moduleregistry.md#owner)
* [isPaused\(\)](moduleregistry.md#ispaused)

### \_whenNotPausedOrOwner

```javascript
function _whenNotPausedOrOwner() internal view
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


```javascript
function () public nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### initialize

```javascript
function initialize(address _polymathRegistry, address _owner) external payable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_polymathRegistry | address |  |
| \_owner | address |  |

### \_customModules

```javascript
function _customModules() internal view
returns(bool)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### useModule

⤾ overrides [IModuleRegistry.useModule](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModuleRegistry.md#usemodule)

Called by a SecurityToken \(2.x\) to check if the ModuleFactory is verified or appropriate custom module

```javascript
function useModule(address _moduleFactory) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_moduleFactory | address | is the address of the relevant module factory |

### useModule

⤾ overrides [IModuleRegistry.useModule](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModuleRegistry.md#usemodule)

Called by a SecurityToken to check if the ModuleFactory is verified or appropriate custom module

```javascript
function useModule(address _moduleFactory, bool _isUpgrade) public nonpayable nonReentrant
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_moduleFactory | address | is the address of the relevant module factory |
| \_isUpgrade | bool | whether or not the function is being called as a result of an upgrade |

### isCompatibleModule

⤾ overrides [IModuleRegistry.isCompatibleModule](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModuleRegistry.md#iscompatiblemodule)

Check that a module and its factory are compatible

```javascript
function isCompatibleModule(address _moduleFactory, address _securityToken) public view
returns(bool)
```

**Returns**

bool whether module and token are compatible

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_moduleFactory | address | is the address of the relevant module factory |
| \_securityToken | address | is the address of the relevant security token |

### registerModule

⤾ overrides [IModuleRegistry.registerModule](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModuleRegistry.md#registermodule)

Called by the ModuleFactory owner to register new modules for SecurityTokens to use

```javascript
function registerModule(address _moduleFactory) external nonpayable whenNotPausedOrOwner nonReentrant
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_moduleFactory | address | is the address of the module factory to be registered |

### removeModule

⤾ overrides [IModuleRegistry.removeModule](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModuleRegistry.md#removemodule)

Called by the ModuleFactory owner or registry curator to delete a ModuleFactory from the registry

```javascript
function removeModule(address _moduleFactory) external nonpayable whenNotPausedOrOwner
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_moduleFactory | address | is the address of the module factory to be deleted from the registry |

### verifyModule

⤾ overrides [IModuleRegistry.verifyModule](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModuleRegistry.md#verifymodule)

Called by Polymath to verify Module Factories for SecurityTokens to use.

```javascript
function verifyModule(address _moduleFactory) external nonpayable onlyOwner
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_moduleFactory | address | is the address of the module factory to be verified |

### unverifyModule

⤾ overrides [IModuleRegistry.unverifyModule](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModuleRegistry.md#unverifymodule)

Called by Polymath to verify Module Factories for SecurityTokens to use.

```javascript
function unverifyModule(address _moduleFactory) external nonpayable nonReentrant
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_moduleFactory | address | is the address of the module factory to be verified |

### getTagsByTypeAndToken

⤾ overrides [IModuleRegistry.getTagsByTypeAndToken](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModuleRegistry.md#gettagsbytypeandtoken)

Returns all the tags related to the a module type which are valid for the given token

```javascript
function getTagsByTypeAndToken(uint8 _moduleType, address _securityToken) external view
returns(bytes32[], address[])
```

**Returns**

list of tags

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_moduleType | uint8 | is the module type |
| \_securityToken | address | is the token |

### getTagsByType

⤾ overrides [IModuleRegistry.getTagsByType](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModuleRegistry.md#gettagsbytype)

Returns all the tags related to the a module type which are valid for the given token

```javascript
function getTagsByType(uint8 _moduleType) external view
returns(bytes32[], address[])
```

**Returns**

list of tags

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_moduleType | uint8 | is the module type |

### \_tagsByModules

Returns all the tags related to the modules provided

```javascript
function _tagsByModules(address[] _modules) internal view
returns(bytes32[], address[])
```

**Returns**

list of tags

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_modules | address\[\] | modules to return tags for |

### getFactoryDetails

⤾ overrides [IModuleRegistry.getFactoryDetails](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModuleRegistry.md#getfactorydetails)

Returns the verified status, and reputation of the entered Module Factory

```javascript
function getFactoryDetails(address _factoryAddress) external view
returns(bool, address, address[])
```

**Returns**

bool indicating whether module factory is verified

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_factoryAddress | address | is the address of the module factory |

### getModulesByType

⤾ overrides [IModuleRegistry.getModulesByType](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModuleRegistry.md#getmodulesbytype)

Returns the list of addresses of verified Module Factory of a particular type

```javascript
function getModulesByType(uint8 _moduleType) public view
returns(address[])
```

**Returns**

address array that contains the list of addresses of module factory contracts.

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_moduleType | uint8 | Type of Module |

### getAllModulesByType

⤾ overrides [IModuleRegistry.getAllModulesByType](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModuleRegistry.md#getallmodulesbytype)

Returns the list of addresses of all Module Factory of a particular type

```javascript
function getAllModulesByType(uint8 _moduleType) external view
returns(address[])
```

**Returns**

address array that contains the list of addresses of module factory contracts.

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_moduleType | uint8 | Type of Module |

### getModulesByTypeAndToken

⤾ overrides [IModuleRegistry.getModulesByTypeAndToken](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModuleRegistry.md#getmodulesbytypeandtoken)

Returns the list of available Module factory addresses of a particular type for a given token.

```javascript
function getModulesByTypeAndToken(uint8 _moduleType, address _securityToken) public view
returns(address[])
```

**Returns**

address array that contains the list of available addresses of module factory contracts.

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_moduleType | uint8 | is the module type to look for |
| \_securityToken | address | is the address of SecurityToken |

### reclaimERC20

⤾ overrides [IModuleRegistry.reclaimERC20](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModuleRegistry.md#reclaimerc20)

Reclaims all ERC20Basic compatible tokens

```javascript
function reclaimERC20(address _tokenContract) external nonpayable onlyOwner
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_tokenContract | address | The address of the token contract |

### pause

⤾ overrides [IModuleRegistry.pause](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModuleRegistry.md#pause)

Called by the owner to pause, triggers stopped state

```javascript
function pause() external nonpayable whenNotPaused onlyOwner
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### unpause

⤾ overrides [IModuleRegistry.unpause](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModuleRegistry.md#unpause)

Called by the owner to unpause, returns to normal state

```javascript
function unpause() external nonpayable whenPaused onlyOwner
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### updateFromRegistry

⤾ overrides [IModuleRegistry.updateFromRegistry](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModuleRegistry.md#updatefromregistry)

Stores the contract addresses of other key contracts from the PolymathRegistry

```javascript
function updateFromRegistry() external nonpayable onlyOwner
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### transferOwnership

⤾ overrides [IModuleRegistry.transferOwnership](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModuleRegistry.md#transferownership)

Allows the current owner to transfer control of the contract to a newOwner.

```javascript
function transferOwnership(address _newOwner) external nonpayable onlyOwner
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_newOwner | address | The address to transfer ownership to. |

### owner

⤾ overrides [IModuleRegistry.owner](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModuleRegistry.md#owner)

Gets the owner of the contract

```javascript
function owner() public view
returns(address)
```

**Returns**

address owner

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### isPaused

⤾ overrides [IModuleRegistry.isPaused](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModuleRegistry.md#ispaused)

Checks whether the contract operations is paused or not

```javascript
function isPaused() public view
returns(bool)
```

**Returns**

bool

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


