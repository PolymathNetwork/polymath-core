---
id: version-3.0.0-IModuleRegistry
title: IModuleRegistry
original_id: IModuleRegistry
---

# Interface for the Polymath Module Registry contract (IModuleRegistry.sol)

View Source: [contracts/interfaces/IModuleRegistry.sol](../../contracts/interfaces/IModuleRegistry.sol)

**↘ Derived Contracts: [ModuleRegistry](ModuleRegistry.md)**

**IModuleRegistry**

## Functions

- [useModule(address _moduleFactory)](#usemodule)
- [registerModule(address _moduleFactory)](#registermodule)
- [removeModule(address _moduleFactory)](#removemodule)
- [verifyModule(address _moduleFactory, bool _verified)](#verifymodule)
- [getReputationByFactory(address _factoryAddress)](#getreputationbyfactory)
- [getTagsByTypeAndToken(uint8 _moduleType, address _securityToken)](#gettagsbytypeandtoken)
- [getTagsByType(uint8 _moduleType)](#gettagsbytype)
- [getModulesByType(uint8 _moduleType)](#getmodulesbytype)
- [getModulesByTypeAndToken(uint8 _moduleType, address _securityToken)](#getmodulesbytypeandtoken)
- [updateFromRegistry()](#updatefromregistry)
- [owner()](#owner)
- [isPaused()](#ispaused)

### useModule

⤿ Overridden Implementation(s): [ModuleRegistry.useModule](ModuleRegistry.md#usemodule)

Called by a security token to notify the registry it is using a module

```js
function useModule(address _moduleFactory) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _moduleFactory | address | is the address of the relevant module factory | 

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

### verifyModule

⤿ Overridden Implementation(s): [ModuleRegistry.verifyModule](ModuleRegistry.md#verifymodule)

Called by Polymath to verify modules for SecurityToken to use.

```js
function verifyModule(address _moduleFactory, bool _verified) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _moduleFactory | address | is the address of the module factory to be registered | 
| _verified | bool |  | 

### getReputationByFactory

⤿ Overridden Implementation(s): [ModuleRegistry.getReputationByFactory](ModuleRegistry.md#getreputationbyfactory)

Used to get the reputation of a Module Factory

```js
function getReputationByFactory(address _factoryAddress) external view
returns(address[])
```

**Returns**

address array which has the list of securityToken's uses that module factory

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _factoryAddress | address | address of the Module Factory | 

### getTagsByTypeAndToken

⤿ Overridden Implementation(s): [ModuleRegistry.getTagsByTypeAndToken](ModuleRegistry.md#gettagsbytypeandtoken)

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

⤿ Overridden Implementation(s): [ModuleRegistry.getTagsByType](ModuleRegistry.md#gettagsbytype)

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

### getModulesByType

⤿ Overridden Implementation(s): [ModuleRegistry.getModulesByType](ModuleRegistry.md#getmodulesbytype)

Returns the list of addresses of Module Factory of a particular type

```js
function getModulesByType(uint8 _moduleType) external view
returns(address[])
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
returns(address[])
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
returns(address)
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
returns(bool)
```

**Returns**

bool

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

