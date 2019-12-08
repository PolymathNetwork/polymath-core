---
id: version-3.0.0-ISecurityToken
title: ISecurityToken
original_id: ISecurityToken
---

# Interface for all security tokens (ISecurityToken.sol)

View Source: [contracts/interfaces/ISecurityToken.sol](../../contracts/interfaces/ISecurityToken.sol)

**ISecurityToken**

**Events**

```js
event Transfer(address indexed from, address indexed to, uint256  value);
event Approval(address indexed owner, address indexed spender, uint256  value);
event Minted(address indexed _to, uint256  _value);
event Burnt(address indexed _burner, uint256  _value);
```

## Functions

- [decimals()](#decimals)
- [totalSupply()](#totalsupply)
- [balanceOf(address _owner)](#balanceof)
- [allowance(address _owner, address _spender)](#allowance)
- [transfer(address _to, uint256 _value)](#transfer)
- [transferFrom(address _from, address _to, uint256 _value)](#transferfrom)
- [approve(address _spender, uint256 _value)](#approve)
- [decreaseApproval(address _spender, uint256 _subtractedValue)](#decreaseapproval)
- [increaseApproval(address _spender, uint256 _addedValue)](#increaseapproval)
- [verifyTransfer(address _from, address _to, uint256 _value)](#verifytransfer)
- [mint(address _investor, uint256 _value)](#mint)
- [mintWithData(address _investor, uint256 _value, bytes _data)](#mintwithdata)
- [burnFromWithData(address _from, uint256 _value, bytes _data)](#burnfromwithdata)
- [burnWithData(uint256 _value, bytes _data)](#burnwithdata)
- [checkPermission(address _delegate, address _module, bytes32 _perm)](#checkpermission)
- [getModule(address _module)](#getmodule)
- [getModulesByName(bytes32 _name)](#getmodulesbyname)
- [getModulesByType(uint8 _type)](#getmodulesbytype)
- [totalSupplyAt(uint256 _checkpointId)](#totalsupplyat)
- [balanceOfAt(address _investor, uint256 _checkpointId)](#balanceofat)
- [createCheckpoint()](#createcheckpoint)
- [getInvestors()](#getinvestors)
- [getInvestorsAt(uint256 _checkpointId)](#getinvestorsat)
- [iterateInvestors(uint256 _start, uint256 _end)](#iterateinvestors)
- [currentCheckpointId()](#currentcheckpointid)
- [investors(uint256 _index)](#investors)
- [withdrawERC20(address _tokenContract, uint256 _value)](#withdrawerc20)
- [changeModuleBudget(address _module, uint256 _budget)](#changemodulebudget)
- [updateTokenDetails(string _newTokenDetails)](#updatetokendetails)
- [changeGranularity(uint256 _granularity)](#changegranularity)
- [pruneInvestors(uint256 _start, uint256 _iters)](#pruneinvestors)
- [freezeTransfers()](#freezetransfers)
- [unfreezeTransfers()](#unfreezetransfers)
- [freezeMinting()](#freezeminting)
- [mintMulti(address[] _investors, uint256[] _values)](#mintmulti)
- [addModule(address _moduleFactory, bytes _data, uint256 _maxCost, uint256 _budget)](#addmodule)
- [archiveModule(address _module)](#archivemodule)
- [unarchiveModule(address _module)](#unarchivemodule)
- [removeModule(address _module)](#removemodule)
- [setController(address _controller)](#setcontroller)
- [forceTransfer(address _from, address _to, uint256 _value, bytes _data, bytes _log)](#forcetransfer)
- [forceBurn(address _from, uint256 _value, bytes _data, bytes _log)](#forceburn)
- [disableController()](#disablecontroller)
- [getVersion()](#getversion)
- [getInvestorCount()](#getinvestorcount)
- [transferWithData(address _to, uint256 _value, bytes _data)](#transferwithdata)
- [transferFromWithData(address _from, address _to, uint256 _value, bytes _data)](#transferfromwithdata)
- [granularity()](#granularity)

### decimals

```js
function decimals() external view
returns(uint8)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### totalSupply

```js
function totalSupply() external view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### balanceOf

```js
function balanceOf(address _owner) external view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _owner | address |  | 

### allowance

```js
function allowance(address _owner, address _spender) external view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _owner | address |  | 
| _spender | address |  | 

### transfer

```js
function transfer(address _to, uint256 _value) external nonpayable
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _to | address |  | 
| _value | uint256 |  | 

### transferFrom

```js
function transferFrom(address _from, address _to, uint256 _value) external nonpayable
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address |  | 
| _to | address |  | 
| _value | uint256 |  | 

### approve

```js
function approve(address _spender, uint256 _value) external nonpayable
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _spender | address |  | 
| _value | uint256 |  | 

### decreaseApproval

```js
function decreaseApproval(address _spender, uint256 _subtractedValue) external nonpayable
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _spender | address |  | 
| _subtractedValue | uint256 |  | 

### increaseApproval

```js
function increaseApproval(address _spender, uint256 _addedValue) external nonpayable
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _spender | address |  | 
| _addedValue | uint256 |  | 

### verifyTransfer

```js
function verifyTransfer(address _from, address _to, uint256 _value) external nonpayable
returns(success bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address |  | 
| _to | address |  | 
| _value | uint256 |  | 

### mint

Mints new tokens and assigns them to the target _investor.
Can only be called by the STO attached to the token (Or by the ST owner if there's no STO attached yet)

```js
function mint(address _investor, uint256 _value) external nonpayable
returns(success bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investor | address | Address the tokens will be minted to | 
| _value | uint256 | is the amount of tokens that will be minted to the investor | 

### mintWithData

Mints new tokens and assigns them to the target _investor.
Can only be called by the STO attached to the token (Or by the ST owner if there's no STO attached yet)

```js
function mintWithData(address _investor, uint256 _value, bytes _data) external nonpayable
returns(success bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investor | address | Address the tokens will be minted to | 
| _value | uint256 | is The amount of tokens that will be minted to the investor | 
| _data | bytes | Data to indicate validation | 

### burnFromWithData

Used to burn the securityToken on behalf of someone else

```js
function burnFromWithData(address _from, uint256 _value, bytes _data) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address | Address for whom to burn tokens | 
| _value | uint256 | No. of tokens to be burned | 
| _data | bytes | Data to indicate validation | 

### burnWithData

Used to burn the securityToken

```js
function burnWithData(uint256 _value, bytes _data) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _value | uint256 | No. of tokens to be burned | 
| _data | bytes | Data to indicate validation | 

### checkPermission

```js
function checkPermission(address _delegate, address _module, bytes32 _perm) external view
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _delegate | address |  | 
| _module | address |  | 
| _perm | bytes32 |  | 

### getModule

Returns module list for a module type

```js
function getModule(address _module) external view
returns(bytes32, address, address, bool, uint8, uint256, uint256)
```

**Returns**

bytes32 Name

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _module | address | Address of the module | 

### getModulesByName

Returns module list for a module name

```js
function getModulesByName(bytes32 _name) external view
returns(address[])
```

**Returns**

address[] List of modules with this name

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _name | bytes32 | Name of the module | 

### getModulesByType

Returns module list for a module type

```js
function getModulesByType(uint8 _type) external view
returns(address[])
```

**Returns**

address[] List of modules with this type

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _type | uint8 | Type of the module | 

### totalSupplyAt

Queries totalSupply at a specified checkpoint

```js
function totalSupplyAt(uint256 _checkpointId) external view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _checkpointId | uint256 | Checkpoint ID to query as of | 

### balanceOfAt

Queries balance at a specified checkpoint

```js
function balanceOfAt(address _investor, uint256 _checkpointId) external view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investor | address | Investor to query balance for | 
| _checkpointId | uint256 | Checkpoint ID to query as of | 

### createCheckpoint

Creates a checkpoint that can be used to query historical balances / totalSuppy

```js
function createCheckpoint() external nonpayable
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getInvestors

Gets length of investors array
NB - this length may differ from investorCount if the list has not been pruned of zero-balance investors

```js
function getInvestors() external view
returns(address[])
```

**Returns**

Length

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getInvestorsAt

returns an array of investors at a given checkpoint
NB - this length may differ from investorCount as it contains all investors that ever held tokens

```js
function getInvestorsAt(uint256 _checkpointId) external view
returns(address[])
```

**Returns**

list of investors

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _checkpointId | uint256 | Checkpoint id at which investor list is to be populated | 

### iterateInvestors

generates subset of investors
NB - can be used in batches if investor list is large

```js
function iterateInvestors(uint256 _start, uint256 _end) external view
returns(address[])
```

**Returns**

list of investors

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _start | uint256 | Position of investor to start iteration from | 
| _end | uint256 | Position of investor to stop iteration at | 

### currentCheckpointId

Gets current checkpoint ID

```js
function currentCheckpointId() external view
returns(uint256)
```

**Returns**

Id

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### investors

Gets an investor at a particular index

```js
function investors(uint256 _index) external view
returns(address)
```

**Returns**

Investor address

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _index | uint256 | Index to return address from | 

### withdrawERC20

Allows the owner to withdraw unspent POLY stored by them on the ST or any ERC20 token.

```js
function withdrawERC20(address _tokenContract, uint256 _value) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _tokenContract | address | Address of the ERC20Basic compliance token | 
| _value | uint256 | Amount of POLY to withdraw | 

### changeModuleBudget

Allows owner to approve more POLY to one of the modules

```js
function changeModuleBudget(address _module, uint256 _budget) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _module | address | Module address | 
| _budget | uint256 | New budget | 

### updateTokenDetails

Changes the tokenDetails

```js
function updateTokenDetails(string _newTokenDetails) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _newTokenDetails | string | New token details | 

### changeGranularity

Allows the owner to change token granularity

```js
function changeGranularity(uint256 _granularity) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _granularity | uint256 | Granularity level of the token | 

### pruneInvestors

Removes addresses with zero balances from the investors list

```js
function pruneInvestors(uint256 _start, uint256 _iters) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _start | uint256 | Index in investors list at which to start removing zero balances | 
| _iters | uint256 | Max number of iterations of the for loop
NB - pruning this list will mean you may not be able to iterate over investors on-chain as of a historical checkpoint | 

### freezeTransfers

Freezes all the transfers

```js
function freezeTransfers() external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### unfreezeTransfers

Un-freezes all the transfers

```js
function unfreezeTransfers() external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### freezeMinting

Ends token minting period permanently

```js
function freezeMinting() external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### mintMulti

Mints new tokens and assigns them to the target investors.
Can only be called by the STO attached to the token or by the Issuer (Security Token contract owner)

```js
function mintMulti(address[] _investors, uint256[] _values) external nonpayable
returns(success bool)
```

**Returns**

Success

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investors | address[] | A list of addresses to whom the minted tokens will be delivered | 
| _values | uint256[] | A list of the amount of tokens to mint to corresponding addresses from _investor[] list | 

### addModule

Function used to attach a module to the security token

```js
function addModule(address _moduleFactory, bytes _data, uint256 _maxCost, uint256 _budget) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _moduleFactory | address | is the address of the module factory to be added | 
| _data | bytes | is data packed into bytes used to further configure the module (See STO usage) | 
| _maxCost | uint256 | max amount of POLY willing to pay to module. (WIP) | 
| _budget | uint256 |  | 

### archiveModule

Archives a module attached to the SecurityToken

```js
function archiveModule(address _module) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _module | address | address of module to archive | 

### unarchiveModule

Unarchives a module attached to the SecurityToken

```js
function unarchiveModule(address _module) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _module | address | address of module to unarchive | 

### removeModule

Removes a module attached to the SecurityToken

```js
function removeModule(address _module) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _module | address | address of module to archive | 

### setController

Used by the issuer to set the controller addresses

```js
function setController(address _controller) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _controller | address | address of the controller | 

### forceTransfer

Used by a controller to execute a forced transfer

```js
function forceTransfer(address _from, address _to, uint256 _value, bytes _data, bytes _log) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address | address from which to take tokens | 
| _to | address | address where to send tokens | 
| _value | uint256 | amount of tokens to transfer | 
| _data | bytes | data to indicate validation | 
| _log | bytes | data attached to the transfer by controller to emit in event | 

### forceBurn

Used by a controller to execute a foced burn

```js
function forceBurn(address _from, uint256 _value, bytes _data, bytes _log) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address | address from which to take tokens | 
| _value | uint256 | amount of tokens to transfer | 
| _data | bytes | data to indicate validation | 
| _log | bytes | data attached to the transfer by controller to emit in event | 

### disableController

Used by the issuer to permanently disable controller functionality

```js
function disableController() external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getVersion

Used to get the version of the securityToken

```js
function getVersion() external view
returns(uint8[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getInvestorCount

Gets the investor count

```js
function getInvestorCount() external view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### transferWithData

Overloaded version of the transfer function

```js
function transferWithData(address _to, uint256 _value, bytes _data) external nonpayable
returns(success bool)
```

**Returns**

bool success

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _to | address | receiver of transfer | 
| _value | uint256 | value of transfer | 
| _data | bytes | data to indicate validation | 

### transferFromWithData

Overloaded version of the transferFrom function

```js
function transferFromWithData(address _from, address _to, uint256 _value, bytes _data) external nonpayable
returns(bool)
```

**Returns**

bool success

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address | sender of transfer | 
| _to | address | receiver of transfer | 
| _value | uint256 | value of transfer | 
| _data | bytes | data to indicate validation | 

### granularity

Provides the granularity of the token

```js
function granularity() external view
returns(uint256)
```

**Returns**

uint256

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

