---
id: version-3.0.0-IModuleRegistry
title: IModuleRegistry
original_id: IModuleRegistry
---

# Interface for the Polymath Module Registry contract (IModuleRegistry.sol)

View Source: [contracts/interfaces/IModuleRegistry.sol](../../contracts/interfaces/IModuleRegistry.sol)

**↘ Derived Contracts: [ModuleRegistry](ModuleRegistry.md)**

**IModuleRegistry**

**Events**

```js
event Pause(address  account);
event Unpause(address  account);
event ModuleUsed(address indexed _moduleFactory, address indexed _securityToken);
event ModuleRegistered(address indexed _moduleFactory, address indexed _owner);
event ModuleVerified(address indexed _moduleFactory);
event ModuleUnverified(address indexed _moduleFactory);
event ModuleRemoved(address indexed _moduleFactory, address indexed _decisionMaker);
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
```

## Functions

- [useModule(address _moduleFactory)](#usemodule)
- [useModule(address _moduleFactory, bool _isUpgrade)](#usemodule)
- [registerModule(address _moduleFactory)](#registermodule)
- [removeModule(address _moduleFactory)](#removemodule)
- [isCompatibleModule(address _moduleFactory, address _securityToken)](#iscompatiblemodule)
- [verifyModule(address _moduleFactory)](#verifymodule)
- [unverifyModule(address _moduleFactory)](#unverifymodule)
- [getFactoryDetails(address _factoryAddress)](#getfactorydetails)
- [getTagsByTypeAndToken(uint8 _moduleType, address _securityToken)](#gettagsbytypeandtoken)
- [getTagsByType(uint8 _moduleType)](#gettagsbytype)
- [getAllModulesByType(uint8 _moduleType)](#getallmodulesbytype)
- [getModulesByType(uint8 _moduleType)](#getmodulesbytype)
- [getModulesByTypeAndToken(uint8 _moduleType, address _securityToken)](#getmodulesbytypeandtoken)
- [updateFromRegistry()](#updatefromregistry)
- [owner()](#owner)
- [isPaused()](#ispaused)
- [reclaimERC20(address _tokenContract)](#reclaimerc20)
- [pause()](#pause)
- [unpause()](#unpause)
- [transferOwnership(address _newOwner)](#transferownership)

### useModule

⤿ Overridden Implementation(s): [ModuleRegistry.useModule](ModuleRegistry.md#usemodule)

Called by a security token (2.x) to notify the registry it is using a module

```js
function useModule(address _moduleFactory) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _moduleFactory | address | is the address of the relevant module factory | 

### useModule

⤿ Overridden Implementation(s): [ModuleRegistry.useModule](ModuleRegistry.md#usemodule)

Called by a security token to notify the registry it is using a module

```js
function useModule(address _moduleFactory, bool _isUpgrade) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _moduleFactory | address | is the address of the relevant module factory | 
| _isUpgrade | bool | whether the use is part of an existing module upgrade | 

### registerModule

⤿ Overridden Implementation(s): [ModuleRegistry.registerModule](ModuleRegistry.md#registermodule)

Called by the ModuleFactory owner to register new modules for SecurityToken to use

```js
function registerModule(address _moduleFactory) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _moduleFactory | address | is the address of the module factory to be registered | 

### removeModule

⤿ Overridden Implementation(s): [ModuleRegistry.removeModule](ModuleRegistry.md#removemodule)

Called by the ModuleFactory owner or registry curator to delete a ModuleFactory

```js
function removeModule(address _moduleFactory) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _moduleFactory | address | is the address of the module factory to be deleted | 

### isCompatibleModule

⤿ Overridden Implementation(s): [ModuleRegistry.isCompatibleModule](ModuleRegistry.md#iscompatiblemodule)

Check that a module and its factory are compatible

```js
function isCompatibleModule(address _moduleFactory, address _securityToken) external view
returns(isCompatible bool)
```

**Returns**

bool whether module and token are compatible

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _moduleFactory | address | is the address of the relevant module factory | 
| _securityToken | address | is the address of the relevant security token | 

### verifyModule

⤿ Overridden Implementation(s): [ModuleRegistry.verifyModule](ModuleRegistry.md#verifymodule)

Called by Polymath to verify modules for SecurityToken to use.

```js
function verifyModule(address _moduleFactory) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _moduleFactory | address | is the address of the module factory to be registered | 

### unverifyModule

⤿ Overridden Implementation(s): [ModuleRegistry.unverifyModule](ModuleRegistry.md#unverifymodule)

Called by Polymath to unverify modules for SecurityToken to use.

```js
function unverifyModule(address _moduleFactory) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _moduleFactory | address | is the address of the module factory to be registered | 

### getFactoryDetails

⤿ Overridden Implementation(s): [ModuleRegistry.getFactoryDetails](ModuleRegistry.md#getfactorydetails)

Returns the verified status, and reputation of the entered Module Factory

```js
function getFactoryDetails(address _factoryAddress) external view
returns(isVerified bool, factoryOwner address, usingTokens address[])
```

**Returns**

bool indicating whether module factory is verified

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _factoryAddress | address | is the address of the module factory | 

### getTagsByTypeAndToken

⤿ Overridden Implementation(s): [ModuleRegistry.getTagsByTypeAndToken](ModuleRegistry.md#gettagsbytypeandtoken)

Returns all the tags related to the a module type which are valid for the given token

```js
function getTagsByTypeAndToken(uint8 _moduleType, address _securityToken) external view
returns(tags bytes32[], factories address[])
```

**Returns**

list of tags

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _moduleType | uint8 | is the module type | 
| _securityToken | address | is the token | 

### getTagsByType

⤿ Overridden Implementation(s): [ModuleRegistry.getTagsByType](ModuleRegistry.md#gettagsbytype)

Returns all the tags related to the a module type which are valid for the given token

```js
function getTagsByType(uint8 _moduleType) external view
returns(tags bytes32[], factories address[])
```

**Returns**

list of tags

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _moduleType | uint8 | is the module type | 

### getAllModulesByType

⤿ Overridden Implementation(s): [ModuleRegistry.getAllModulesByType](ModuleRegistry.md#getallmodulesbytype)

Returns the list of addresses of all Module Factory of a particular type

```js
function getAllModulesByType(uint8 _moduleType) external view
returns(factories address[])
```

**Returns**

address array that contains the list of addresses of module factory contracts.

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _moduleType | uint8 | Type of Module | 

### getModulesByType

⤿ Overridden Implementation(s): [ModuleRegistry.getModulesByType](ModuleRegistry.md#getmodulesbytype)

Returns the list of addresses of Module Factory of a particular type

```js
function getModulesByType(uint8 _moduleType) external view
returns(factories address[])
```

**Returns**

address array that contains the list of addresses of module factory contracts.

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _moduleType | uint8 | Type of Module | 

### getModulesByTypeAndToken

⤿ Overridden Implementation(s): [ModuleRegistry.getModulesByTypeAndToken](ModuleRegistry.md#getmodulesbytypeandtoken)

Returns the list of available Module factory addresses of a particular type for a given token.

```js
function getModulesByTypeAndToken(uint8 _moduleType, address _securityToken) external view
returns(factories address[])
```

**Returns**

address array that contains the list of available addresses of module factory contracts.

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _moduleType | uint8 | is the module type to look for | 
| _securityToken | address | is the address of SecurityToken | 

### updateFromRegistry

⤿ Overridden Implementation(s): [ModuleRegistry.updateFromRegistry](ModuleRegistry.md#updatefromregistry)

Use to get the latest contract address of the regstries

```js
function updateFromRegistry() external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### owner

⤿ Overridden Implementation(s): [ModuleRegistry.owner](ModuleRegistry.md#owner)

Get the owner of the contract

```js
function owner() external view
returns(ownerAddress address)
```

**Returns**

address owner

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### isPaused

⤿ Overridden Implementation(s): [ModuleRegistry.isPaused](ModuleRegistry.md#ispaused)

Check whether the contract operations is paused or not

```js
function isPaused() external view
returns(paused bool)
```

**Returns**

bool

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### reclaimERC20

⤿ Overridden Implementation(s): [ModuleRegistry.reclaimERC20](ModuleRegistry.md#reclaimerc20)

Reclaims all ERC20Basic compatible tokens

```js
function reclaimERC20(address _tokenContract) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _tokenContract | address | The address of the token contract | 

### pause

⤿ Overridden Implementation(s): [ModuleRegistry.pause](ModuleRegistry.md#pause)

Called by the owner to pause, triggers stopped state

```js
function pause() external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### unpause

⤿ Overridden Implementation(s): [ModuleRegistry.unpause](ModuleRegistry.md#unpause)

Called by the owner to unpause, returns to normal state

```js
function unpause() external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### transferOwnership

⤿ Overridden Implementation(s): [ModuleRegistry.transferOwnership](ModuleRegistry.md#transferownership)

Allows the current owner to transfer control of the contract to a newOwner.

```js
function transferOwnership(address _newOwner) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _newOwner | address | The address to transfer ownership to. | 

