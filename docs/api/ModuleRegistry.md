---
id: version-3.0.0-ModuleRegistry
title: ModuleRegistry
original_id: ModuleRegistry
---

# Registry contract to store registered modules (ModuleRegistry.sol)

View Source: [contracts/ModuleRegistry.sol](../../contracts/ModuleRegistry.sol)

**↗ Extends: [IModuleRegistry](IModuleRegistry.md), [EternalStorage](EternalStorage.md)**
**↘ Derived Contracts: [MockModuleRegistry](MockModuleRegistry.md)**

**ModuleRegistry**

Only Polymath can register and verify module factories to make them available for issuers to attach.

## Contract Members
**Constants & Variables**

```js
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

- [onlyOwner](#onlyowner)
- [whenNotPausedOrOwner](#whennotpausedorowner)
- [nonReentrant](#nonreentrant)
- [whenNotPaused](#whennotpaused)
- [whenPaused](#whenpaused)

### onlyOwner

Throws if called by any account other than the owner.

```js
modifier onlyOwner() internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### whenNotPausedOrOwner

Modifier to make a function callable only when the contract is not paused.

```js
modifier whenNotPausedOrOwner() internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### nonReentrant

Modifier to prevent reentrancy

```js
modifier nonReentrant() internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### whenNotPaused

Modifier to make a function callable only when the contract is not paused and ignore is msg.sender is owner.

```js
modifier whenNotPaused() internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### whenPaused

Modifier to make a function callable only when the contract is paused.

```js
modifier whenPaused() internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

## Functions

- [_whenNotPausedOrOwner()](#_whennotpausedorowner)
- [()](#)
- [initialize(address _polymathRegistry, address _owner)](#initialize)
- [_customModules()](#_custommodules)
- [useModule(address _moduleFactory)](#usemodule)
- [useModule(address _moduleFactory, bool _isUpgrade)](#usemodule)
- [isCompatibleModule(address _moduleFactory, address _securityToken)](#iscompatiblemodule)
- [registerModule(address _moduleFactory)](#registermodule)
- [removeModule(address _moduleFactory)](#removemodule)
- [verifyModule(address _moduleFactory)](#verifymodule)
- [unverifyModule(address _moduleFactory)](#unverifymodule)
- [getTagsByTypeAndToken(uint8 _moduleType, address _securityToken)](#gettagsbytypeandtoken)
- [getTagsByType(uint8 _moduleType)](#gettagsbytype)
- [_tagsByModules(address[] _modules)](#_tagsbymodules)
- [getFactoryDetails(address _factoryAddress)](#getfactorydetails)
- [getModulesByType(uint8 _moduleType)](#getmodulesbytype)
- [getAllModulesByType(uint8 _moduleType)](#getallmodulesbytype)
- [getModulesByTypeAndToken(uint8 _moduleType, address _securityToken)](#getmodulesbytypeandtoken)
- [reclaimERC20(address _tokenContract)](#reclaimerc20)
- [pause()](#pause)
- [unpause()](#unpause)
- [updateFromRegistry()](#updatefromregistry)
- [transferOwnership(address _newOwner)](#transferownership)
- [owner()](#owner)
- [isPaused()](#ispaused)

### _whenNotPausedOrOwner

```js
function _whenNotPausedOrOwner() internal view
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### 

```js
function () public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### initialize

```js
function initialize(address _polymathRegistry, address _owner) external payable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _polymathRegistry | address |  | 
| _owner | address |  | 

### _customModules

```js
function _customModules() internal view
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### useModule

⤾ overrides [IModuleRegistry.useModule](IModuleRegistry.md#usemodule)

Called by a SecurityToken (2.x) to check if the ModuleFactory is verified or appropriate custom module

```js
function useModule(address _moduleFactory) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _moduleFactory | address | is the address of the relevant module factory | 

### useModule

⤾ overrides [IModuleRegistry.useModule](IModuleRegistry.md#usemodule)

Called by a SecurityToken to check if the ModuleFactory is verified or appropriate custom module

```js
function useModule(address _moduleFactory, bool _isUpgrade) public nonpayable nonReentrant 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _moduleFactory | address | is the address of the relevant module factory | 
| _isUpgrade | bool | whether or not the function is being called as a result of an upgrade | 

### isCompatibleModule

⤾ overrides [IModuleRegistry.isCompatibleModule](IModuleRegistry.md#iscompatiblemodule)

Check that a module and its factory are compatible

```js
function isCompatibleModule(address _moduleFactory, address _securityToken) public view
returns(bool)
```

**Returns**

bool whether module and token are compatible

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _moduleFactory | address | is the address of the relevant module factory | 
| _securityToken | address | is the address of the relevant security token | 

### registerModule

⤾ overrides [IModuleRegistry.registerModule](IModuleRegistry.md#registermodule)

Called by the ModuleFactory owner to register new modules for SecurityTokens to use

```js
function registerModule(address _moduleFactory) external nonpayable whenNotPausedOrOwner nonReentrant 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _moduleFactory | address | is the address of the module factory to be registered | 

### removeModule

⤾ overrides [IModuleRegistry.removeModule](IModuleRegistry.md#removemodule)

Called by the ModuleFactory owner or registry curator to delete a ModuleFactory from the registry

```js
function removeModule(address _moduleFactory) external nonpayable whenNotPausedOrOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _moduleFactory | address | is the address of the module factory to be deleted from the registry | 

### verifyModule

⤾ overrides [IModuleRegistry.verifyModule](IModuleRegistry.md#verifymodule)

Called by Polymath to verify Module Factories for SecurityTokens to use.

```js
function verifyModule(address _moduleFactory) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _moduleFactory | address | is the address of the module factory to be verified | 

### unverifyModule

⤾ overrides [IModuleRegistry.unverifyModule](IModuleRegistry.md#unverifymodule)

Called by Polymath to verify Module Factories for SecurityTokens to use.

```js
function unverifyModule(address _moduleFactory) external nonpayable nonReentrant 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _moduleFactory | address | is the address of the module factory to be verified | 

### getTagsByTypeAndToken

⤾ overrides [IModuleRegistry.getTagsByTypeAndToken](IModuleRegistry.md#gettagsbytypeandtoken)

Returns all the tags related to the a module type which are valid for the given token

```js
function getTagsByTypeAndToken(uint8 _moduleType, address _securityToken) external view
returns(bytes32[], address[])
```

**Returns**

list of tags

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _moduleType | uint8 | is the module type | 
| _securityToken | address | is the token | 

### getTagsByType

⤾ overrides [IModuleRegistry.getTagsByType](IModuleRegistry.md#gettagsbytype)

Returns all the tags related to the a module type which are valid for the given token

```js
function getTagsByType(uint8 _moduleType) external view
returns(bytes32[], address[])
```

**Returns**

list of tags

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _moduleType | uint8 | is the module type | 

### _tagsByModules

Returns all the tags related to the modules provided

```js
function _tagsByModules(address[] _modules) internal view
returns(bytes32[], address[])
```

**Returns**

list of tags

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _modules | address[] | modules to return tags for | 

### getFactoryDetails

⤾ overrides [IModuleRegistry.getFactoryDetails](IModuleRegistry.md#getfactorydetails)

Returns the verified status, and reputation of the entered Module Factory

```js
function getFactoryDetails(address _factoryAddress) external view
returns(bool, address, address[])
```

**Returns**

bool indicating whether module factory is verified

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _factoryAddress | address | is the address of the module factory | 

### getModulesByType

⤾ overrides [IModuleRegistry.getModulesByType](IModuleRegistry.md#getmodulesbytype)

Returns the list of addresses of verified Module Factory of a particular type

```js
function getModulesByType(uint8 _moduleType) public view
returns(address[])
```

**Returns**

address array that contains the list of addresses of module factory contracts.

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _moduleType | uint8 | Type of Module | 

### getAllModulesByType

⤾ overrides [IModuleRegistry.getAllModulesByType](IModuleRegistry.md#getallmodulesbytype)

Returns the list of addresses of all Module Factory of a particular type

```js
function getAllModulesByType(uint8 _moduleType) external view
returns(address[])
```

**Returns**

address array that contains the list of addresses of module factory contracts.

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _moduleType | uint8 | Type of Module | 

### getModulesByTypeAndToken

⤾ overrides [IModuleRegistry.getModulesByTypeAndToken](IModuleRegistry.md#getmodulesbytypeandtoken)

Returns the list of available Module factory addresses of a particular type for a given token.

```js
function getModulesByTypeAndToken(uint8 _moduleType, address _securityToken) public view
returns(address[])
```

**Returns**

address array that contains the list of available addresses of module factory contracts.

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _moduleType | uint8 | is the module type to look for | 
| _securityToken | address | is the address of SecurityToken | 

### reclaimERC20

⤾ overrides [IModuleRegistry.reclaimERC20](IModuleRegistry.md#reclaimerc20)

Reclaims all ERC20Basic compatible tokens

```js
function reclaimERC20(address _tokenContract) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _tokenContract | address | The address of the token contract | 

### pause

⤾ overrides [IModuleRegistry.pause](IModuleRegistry.md#pause)

Called by the owner to pause, triggers stopped state

```js
function pause() external nonpayable whenNotPaused onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### unpause

⤾ overrides [IModuleRegistry.unpause](IModuleRegistry.md#unpause)

Called by the owner to unpause, returns to normal state

```js
function unpause() external nonpayable whenPaused onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### updateFromRegistry

⤾ overrides [IModuleRegistry.updateFromRegistry](IModuleRegistry.md#updatefromregistry)

Stores the contract addresses of other key contracts from the PolymathRegistry

```js
function updateFromRegistry() external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### transferOwnership

⤾ overrides [IModuleRegistry.transferOwnership](IModuleRegistry.md#transferownership)

Allows the current owner to transfer control of the contract to a newOwner.

```js
function transferOwnership(address _newOwner) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _newOwner | address | The address to transfer ownership to. | 

### owner

⤾ overrides [IModuleRegistry.owner](IModuleRegistry.md#owner)

Gets the owner of the contract

```js
function owner() public view
returns(address)
```

**Returns**

address owner

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### isPaused

⤾ overrides [IModuleRegistry.isPaused](IModuleRegistry.md#ispaused)

Checks whether the contract operations is paused or not

```js
function isPaused() public view
returns(bool)
```

**Returns**

bool

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

