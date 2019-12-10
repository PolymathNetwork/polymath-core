---
id: version-3.0.0-STGetter
title: STGetter
original_id: STGetter
---

# STGetter.sol

View Source: [contracts/tokens/STGetter.sol](../../contracts/tokens/STGetter.sol)

**↗ Extends: [OZStorage](OZStorage.md), [SecurityTokenStorage](SecurityTokenStorage.md)**
**↘ Derived Contracts: [MockSTGetter](MockSTGetter.md)**

**STGetter**

## Functions

- [isIssuable()](#isissuable)
- [getCheckpointTimes()](#getcheckpointtimes)
- [getInvestorCount()](#getinvestorcount)
- [getInvestors()](#getinvestors)
- [getInvestorsAt(uint256 _checkpointId)](#getinvestorsat)
- [getInvestorsSubsetAt(uint256 _checkpointId, uint256 _start, uint256 _end)](#getinvestorssubsetat)
- [getModule(address _module)](#getmodule)
- [getModulesByName(bytes32 _name)](#getmodulesbyname)
- [getModulesByType(uint8 _type)](#getmodulesbytype)
- [getTreasuryWallet()](#gettreasurywallet)
- [balanceOfAt(address _investor, uint256 _checkpointId)](#balanceofat)
- [totalSupplyAt(uint256 _checkpointId)](#totalsupplyat)
- [iterateInvestors(uint256 _start, uint256 _end)](#iterateinvestors)
- [checkPermission(address _delegate, address _module, bytes32 _perm)](#checkpermission)
- [isOperator(address _operator, address _tokenHolder)](#isoperator)
- [isOperatorForPartition(bytes32 _partition, address _operator, address _tokenHolder)](#isoperatorforpartition)
- [partitionsOf(address )](#partitionsof)
- [getVersion()](#getversion)
- [getDocument(bytes32 _name)](#getdocument)
- [getAllDocuments()](#getalldocuments)

### isIssuable

A security token issuer can specify that issuance has finished for the token
(i.e. no new tokens can be minted or issued).

```js
function isIssuable() external view
returns(bool)
```

**Returns**

bool `true` signifies the minting is allowed. While `false` denotes the end of minting

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getCheckpointTimes

Gets list of times that checkpoints were created

```js
function getCheckpointTimes() external view
returns(uint256[])
```

**Returns**

List of checkpoint times

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getInvestorCount

Returns the count of address that were added as (potential) investors

```js
function getInvestorCount() external view
returns(uint256)
```

**Returns**

Investor count

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getInvestors

returns an array of investors
NB - this length may differ from investorCount as it contains all investors that ever held tokens

```js
function getInvestors() public view
returns(investors address[])
```

**Returns**

list of addresses

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getInvestorsAt

returns an array of investors with non zero balance at a given checkpoint

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

### getInvestorsSubsetAt

returns an array of investors with non zero balance at a given checkpoint

```js
function getInvestorsSubsetAt(uint256 _checkpointId, uint256 _start, uint256 _end) external view
returns(address[])
```

**Returns**

list of investors

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _checkpointId | uint256 | Checkpoint id at which investor list is to be populated | 
| _start | uint256 | Position of investor to start iteration from | 
| _end | uint256 | Position of investor to stop iteration at | 

### getModule

Returns the data associated to a module

```js
function getModule(address _module) external view
returns(bytes32, address, address, bool, uint8[], bytes32)
```

**Returns**

bytes32 name

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _module | address | address of the module | 

### getModulesByName

Returns a list of modules that match the provided name

```js
function getModulesByName(bytes32 _name) external view
returns(address[])
```

**Returns**

address[] list of modules with this name

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _name | bytes32 | name of the module | 

### getModulesByType

Returns a list of modules that match the provided module type

```js
function getModulesByType(uint8 _type) external view
returns(address[])
```

**Returns**

address[] list of modules with this type

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _type | uint8 | type of the module | 

### getTreasuryWallet

use to return the global treasury wallet

```js
function getTreasuryWallet() external view
returns(address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### balanceOfAt

Queries balances as of a defined checkpoint

```js
function balanceOfAt(address _investor, uint256 _checkpointId) public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investor | address | Investor to query balance for | 
| _checkpointId | uint256 | Checkpoint ID to query as of | 

### totalSupplyAt

Queries totalSupply as of a defined checkpoint

```js
function totalSupplyAt(uint256 _checkpointId) external view
returns(uint256)
```

**Returns**

uint256

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _checkpointId | uint256 | Checkpoint ID to query | 

### iterateInvestors

generates subset of investors
NB - can be used in batches if investor list is large. start and end both are included in array.

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

### checkPermission

Validate permissions with PermissionManager if it exists, If no Permission return false

```js
function checkPermission(address _delegate, address _module, bytes32 _perm) public view
returns(bool)
```

**Returns**

success

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _delegate | address | address of delegate | 
| _module | address | address of PermissionManager module | 
| _perm | bytes32 | the permissions | 

### isOperator

Determines whether `_operator` is an operator for all partitions of `_tokenHolder`

```js
function isOperator(address _operator, address _tokenHolder) external view
returns(bool)
```

**Returns**

Whether the `_operator` is an operator for all partitions of `_tokenHolder`

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _operator | address | The operator to check | 
| _tokenHolder | address | The token holder to check | 

### isOperatorForPartition

Determines whether `_operator` is an operator for a specified partition of `_tokenHolder`

```js
function isOperatorForPartition(bytes32 _partition, address _operator, address _tokenHolder) external view
returns(bool)
```

**Returns**

Whether the `_operator` is an operator for a specified partition of `_tokenHolder`

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _partition | bytes32 | The partition to check | 
| _operator | address | The operator to check | 
| _tokenHolder | address | The token holder to check | 

### partitionsOf

Return all partitions

```js
function partitionsOf(address ) external pure
returns(bytes32[])
```

**Returns**

List of partitions

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
|  | address |  | 

### getVersion

Returns the version of the SecurityToken

```js
function getVersion() external view
returns(uint8[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getDocument

Used to return the details of a document with a known name (`bytes32`).

```js
function getDocument(bytes32 _name) external view
returns(string, bytes32, uint256)
```

**Returns**

string The URI associated with the document.

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _name | bytes32 | Name of the document | 

### getAllDocuments

Used to retrieve a full list of documents attached to the smart contract.

```js
function getAllDocuments() external view
returns(bytes32[])
```

**Returns**

bytes32 List of all documents names present in the contract.

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

