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

**Events**

```js
event Pause(uint256  _timestammp);
event Unpause(uint256  _timestamp);
event ModuleUsed(address indexed _moduleFactory, address indexed _securityToken);
event ModuleRegistered(address indexed _moduleFactory, address indexed _owner);
event ModuleVerified(address indexed _moduleFactory, bool  _verified);
event ModuleRemoved(address indexed _moduleFactory, address indexed _decisionMaker);
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
```

## Modifiers

- [onlyOwner](#onlyowner)
- [whenNotPausedOrOwner](#whennotpausedorowner)
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

- [initialize(address _polymathRegistry, address _owner)](#initialize)
- [useModule(address _moduleFactory)](#usemodule)
- [_isCompatibleModule(address _moduleFactory, address _securityToken)](#_iscompatiblemodule)
- [registerModule(address _moduleFactory)](#registermodule)
- [removeModule(address _moduleFactory)](#removemodule)
- [verifyModule(address _moduleFactory, bool _verified)](#verifymodule)
- [getTagsByTypeAndToken(uint8 _moduleType, address _securityToken)](#gettagsbytypeandtoken)
- [getTagsByType(uint8 _moduleType)](#gettagsbytype)
- [_tagsByModules(address[] _modules)](#_tagsbymodules)
- [getReputationByFactory(address _factoryAddress)](#getreputationbyfactory)
- [getModulesByType(uint8 _moduleType)](#getmodulesbytype)
- [getModulesByTypeAndToken(uint8 _moduleType, address _securityToken)](#getmodulesbytypeandtoken)
- [reclaimERC20(address _tokenContract)](#reclaimerc20)
- [pause()](#pause)
- [unpause()](#unpause)
- [updateFromRegistry()](#updatefromregistry)
- [transferOwnership(address _newOwner)](#transferownership)
- [owner()](#owner)
- [isPaused()](#ispaused)

### initialize

```js
function initialize(address _polymathRegistry, address _owner) external payable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _polymathRegistry | address |  | 
| _owner | address |  | 

### useModule

⤾ overrides [IModuleRegistry.useModule](IModuleRegistry.md#usemodule)

Called by a SecurityToken to check if the ModuleFactory is verified or appropriate custom module

```js
function useModule(address _moduleFactory) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _moduleFactory | address | is the address of the relevant module factory | 

### _isCompatibleModule

```js
function _isCompatibleModule(address _moduleFactory, address _securityToken) internal view
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _moduleFactory | address |  | 
| _securityToken | address |  | 

### registerModule

⤾ overrides [IModuleRegistry.registerModule](IModuleRegistry.md#registermodule)

Called by the ModuleFactory owner to register new modules for SecurityTokens to use

```js
function registerModule(address _moduleFactory) external nonpayable whenNotPausedOrOwner 
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
function verifyModule(address _moduleFactory, bool _verified) external nonpayable onlyOwner 
```

**Returns**

bool

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _moduleFactory | address | is the address of the module factory to be verified | 
| _verified | bool |  | 

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

### getReputationByFactory

⤾ overrides [IModuleRegistry.getReputationByFactory](IModuleRegistry.md#getreputationbyfactory)

Returns the reputation of the entered Module Factory

```js
function getReputationByFactory(address _factoryAddress) external view
returns(address[])
```

**Returns**

address array which contains the list of securityTokens that use that module factory

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _factoryAddress | address | is the address of the module factory | 

### getModulesByType

⤾ overrides [IModuleRegistry.getModulesByType](IModuleRegistry.md#getmodulesbytype)

Returns the list of addresses of Module Factory of a particular type

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

Reclaims all ERC20Basic compatible tokens

```js
function reclaimERC20(address _tokenContract) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _tokenContract | address | The address of the token contract | 

### pause

Called by the owner to pause, triggers stopped state

```js
function pause() external nonpayable whenNotPaused onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### unpause

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

