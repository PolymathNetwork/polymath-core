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
event ModuleAdded(uint8[]  _types, bytes32 indexed _name, address indexed _moduleFactory, address  _module, uint256  _moduleCost, uint256  _budget, bytes32  _label, bool  _archived);
event ModuleUpgraded(uint8[]  _types, address  _module);
event UpdateTokenDetails(string  _oldDetails, string  _newDetails);
event UpdateTokenName(string  _oldName, string  _newName);
event GranularityChanged(uint256  _oldGranularity, uint256  _newGranularity);
event FreezeIssuance();
event FreezeTransfers(bool  _status);
event CheckpointCreated(uint256 indexed _checkpointId, uint256  _investorLength);
event SetController(address indexed _oldController, address indexed _newController);
event TreasuryWalletChanged(address  _oldTreasuryWallet, address  _newTreasuryWallet);
event DisableController();
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
event TokenUpgraded(uint8  _major, uint8  _minor, uint8  _patch);
event ModuleArchived(uint8[]  _types, address  _module);
event ModuleUnarchived(uint8[]  _types, address  _module);
event ModuleRemoved(uint8[]  _types, address  _module);
event ModuleBudgetChanged(uint8[]  _moduleTypes, address  _module, uint256  _oldBudget, uint256  _budget);
event TransferByPartition(bytes32 indexed _fromPartition, address  _operator, address indexed _from, address indexed _to, uint256  _value, bytes  _data, bytes  _operatorData);
event AuthorizedOperator(address indexed operator, address indexed tokenHolder);
event RevokedOperator(address indexed operator, address indexed tokenHolder);
event AuthorizedOperatorByPartition(bytes32 indexed partition, address indexed operator, address indexed tokenHolder);
event RevokedOperatorByPartition(bytes32 indexed partition, address indexed operator, address indexed tokenHolder);
event IssuedByPartition(bytes32 indexed partition, address indexed to, uint256  value, bytes  data);
event RedeemedByPartition(bytes32 indexed partition, address indexed operator, address indexed from, uint256  value, bytes  data, bytes  operatorData);
event DocumentRemoved(bytes32 indexed _name, string  _uri, bytes32  _documentHash);
event DocumentUpdated(bytes32 indexed _name, string  _uri, bytes32  _documentHash);
event ControllerTransfer(address  _controller, address indexed _from, address indexed _to, uint256  _value, bytes  _data, bytes  _operatorData);
event ControllerRedemption(address  _controller, address indexed _tokenHolder, uint256  _value, bytes  _data, bytes  _operatorData);
event Issued(address indexed _operator, address indexed _to, uint256  _value, bytes  _data);
event Redeemed(address indexed _operator, address indexed _from, uint256  _value, bytes  _data);
```

## Functions

- [symbol()](#symbol)
- [name()](#name)
- [decimals()](#decimals)
- [totalSupply()](#totalsupply)
- [balanceOf(address owner)](#balanceof)
- [allowance(address owner, address spender)](#allowance)
- [transfer(address to, uint256 value)](#transfer)
- [transferFrom(address from, address to, uint256 value)](#transferfrom)
- [approve(address spender, uint256 value)](#approve)
- [decreaseAllowance(address spender, uint256 subtractedValue)](#decreaseallowance)
- [increaseAllowance(address spender, uint256 addedValue)](#increaseallowance)
- [canTransfer(address _to, uint256 _value, bytes _data)](#cantransfer)
- [initialize(address _getterDelegate)](#initialize)
- [canTransferByPartition(address _from, address _to, bytes32 _partition, uint256 _value, bytes _data)](#cantransferbypartition)
- [canTransferFrom(address _from, address _to, uint256 _value, bytes _data)](#cantransferfrom)
- [setDocument(bytes32 _name, string _uri, bytes32 _documentHash)](#setdocument)
- [removeDocument(bytes32 _name)](#removedocument)
- [getDocument(bytes32 _name)](#getdocument)
- [getAllDocuments()](#getalldocuments)
- [isControllable()](#iscontrollable)
- [isModule(address _module, uint8 _type)](#ismodule)
- [issue(address _tokenHolder, uint256 _value, bytes _data)](#issue)
- [issueMulti(address[] _tokenHolders, uint256[] _values)](#issuemulti)
- [issueByPartition(bytes32 _partition, address _tokenHolder, uint256 _value, bytes _data)](#issuebypartition)
- [redeemByPartition(bytes32 _partition, uint256 _value, bytes _data)](#redeembypartition)
- [redeem(uint256 _value, bytes _data)](#redeem)
- [redeemFrom(address _tokenHolder, uint256 _value, bytes _data)](#redeemfrom)
- [operatorRedeemByPartition(bytes32 _partition, address _tokenHolder, uint256 _value, bytes _data, bytes _operatorData)](#operatorredeembypartition)
- [checkPermission(address _delegate, address _module, bytes32 _perm)](#checkpermission)
- [getModule(address _module)](#getmodule)
- [getModulesByName(bytes32 _name)](#getmodulesbyname)
- [getModulesByType(uint8 _type)](#getmodulesbytype)
- [getTreasuryWallet()](#gettreasurywallet)
- [totalSupplyAt(uint256 _checkpointId)](#totalsupplyat)
- [balanceOfAt(address _investor, uint256 _checkpointId)](#balanceofat)
- [createCheckpoint()](#createcheckpoint)
- [getCheckpointTimes()](#getcheckpointtimes)
- [getInvestors()](#getinvestors)
- [getInvestorsAt(uint256 _checkpointId)](#getinvestorsat)
- [getInvestorsSubsetAt(uint256 _checkpointId, uint256 _start, uint256 _end)](#getinvestorssubsetat)
- [iterateInvestors(uint256 _start, uint256 _end)](#iterateinvestors)
- [currentCheckpointId()](#currentcheckpointid)
- [isOperator(address _operator, address _tokenHolder)](#isoperator)
- [isOperatorForPartition(bytes32 _partition, address _operator, address _tokenHolder)](#isoperatorforpartition)
- [partitionsOf(address _tokenHolder)](#partitionsof)
- [dataStore()](#datastore)
- [changeDataStore(address _dataStore)](#changedatastore)
- [changeTreasuryWallet(address _wallet)](#changetreasurywallet)
- [withdrawERC20(address _tokenContract, uint256 _value)](#withdrawerc20)
- [changeModuleBudget(address _module, uint256 _change, bool _increase)](#changemodulebudget)
- [updateTokenDetails(string _newTokenDetails)](#updatetokendetails)
- [changeName(string _name)](#changename)
- [changeGranularity(uint256 _granularity)](#changegranularity)
- [freezeTransfers()](#freezetransfers)
- [unfreezeTransfers()](#unfreezetransfers)
- [freezeIssuance(bytes _signature)](#freezeissuance)
- [addModuleWithLabel(address _moduleFactory, bytes _data, uint256 _maxCost, uint256 _budget, bytes32 _label, bool _archived)](#addmodulewithlabel)
- [addModule(address _moduleFactory, bytes _data, uint256 _maxCost, uint256 _budget, bool _archived)](#addmodule)
- [archiveModule(address _module)](#archivemodule)
- [unarchiveModule(address _module)](#unarchivemodule)
- [removeModule(address _module)](#removemodule)
- [setController(address _controller)](#setcontroller)
- [controllerTransfer(address _from, address _to, uint256 _value, bytes _data, bytes _operatorData)](#controllertransfer)
- [controllerRedeem(address _tokenHolder, uint256 _value, bytes _data, bytes _operatorData)](#controllerredeem)
- [disableController(bytes _signature)](#disablecontroller)
- [getVersion()](#getversion)
- [getInvestorCount()](#getinvestorcount)
- [holderCount()](#holdercount)
- [transferWithData(address _to, uint256 _value, bytes _data)](#transferwithdata)
- [transferFromWithData(address _from, address _to, uint256 _value, bytes _data)](#transferfromwithdata)
- [transferByPartition(bytes32 _partition, address _to, uint256 _value, bytes _data)](#transferbypartition)
- [balanceOfByPartition(bytes32 _partition, address _tokenHolder)](#balanceofbypartition)
- [granularity()](#granularity)
- [polymathRegistry()](#polymathregistry)
- [upgradeModule(address _module)](#upgrademodule)
- [upgradeToken()](#upgradetoken)
- [isIssuable()](#isissuable)
- [authorizeOperator(address _operator)](#authorizeoperator)
- [revokeOperator(address _operator)](#revokeoperator)
- [authorizeOperatorByPartition(bytes32 _partition, address _operator)](#authorizeoperatorbypartition)
- [revokeOperatorByPartition(bytes32 _partition, address _operator)](#revokeoperatorbypartition)
- [operatorTransferByPartition(bytes32 _partition, address _from, address _to, uint256 _value, bytes _data, bytes _operatorData)](#operatortransferbypartition)
- [transfersFrozen()](#transfersfrozen)
- [transferOwnership(address newOwner)](#transferownership)
- [isOwner()](#isowner)
- [owner()](#owner)
- [controller()](#controller)
- [moduleRegistry()](#moduleregistry)
- [securityTokenRegistry()](#securitytokenregistry)
- [polyToken()](#polytoken)
- [tokenFactory()](#tokenfactory)
- [getterDelegate()](#getterdelegate)
- [controllerDisabled()](#controllerdisabled)
- [initialized()](#initialized)
- [tokenDetails()](#tokendetails)
- [updateFromRegistry()](#updatefromregistry)

### symbol

```js
function symbol() external view
returns(string)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### name

```js
function name() external view
returns(string)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

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
function balanceOf(address owner) external view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| owner | address |  | 

### allowance

```js
function allowance(address owner, address spender) external view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| owner | address |  | 
| spender | address |  | 

### transfer

```js
function transfer(address to, uint256 value) external nonpayable
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| to | address |  | 
| value | uint256 |  | 

### transferFrom

```js
function transferFrom(address from, address to, uint256 value) external nonpayable
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| from | address |  | 
| to | address |  | 
| value | uint256 |  | 

### approve

```js
function approve(address spender, uint256 value) external nonpayable
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| spender | address |  | 
| value | uint256 |  | 

### decreaseAllowance

```js
function decreaseAllowance(address spender, uint256 subtractedValue) external nonpayable
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| spender | address |  | 
| subtractedValue | uint256 |  | 

### increaseAllowance

```js
function increaseAllowance(address spender, uint256 addedValue) external nonpayable
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| spender | address |  | 
| addedValue | uint256 |  | 

### canTransfer

Transfers of securities may fail for a number of reasons. So this function will used to understand the
cause of failure by getting the byte value. Which will be the ESC that follows the EIP 1066. ESC can be mapped
with a reson string to understand the failure cause, table of Ethereum status code will always reside off-chain

```js
function canTransfer(address _to, uint256 _value, bytes _data) external view
returns(statusCode bytes1, reasonCode bytes32)
```

**Returns**

byte Ethereum status code (ESC)

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _to | address | address The address which you want to transfer to | 
| _value | uint256 | uint256 the amount of tokens to be transferred | 
| _data | bytes | The `bytes _data` allows arbitrary data to be submitted alongside the transfer. | 

### initialize

Initialization function

```js
function initialize(address _getterDelegate) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _getterDelegate | address |  | 

### canTransferByPartition

The standard provides an on-chain function to determine whether a transfer will succeed,
and return details indicating the reason if the transfer is not valid.

```js
function canTransferByPartition(address _from, address _to, bytes32 _partition, uint256 _value, bytes _data) external view
returns(statusCode bytes1, reasonCode bytes32, partition bytes32)
```

**Returns**

ESC (Ethereum Status Code) following the EIP-1066 standard

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address | The address from whom the tokens get transferred. | 
| _to | address | The address to which to transfer tokens to. | 
| _partition | bytes32 | The partition from which to transfer tokens | 
| _value | uint256 | The amount of tokens to transfer from `_partition` | 
| _data | bytes | Additional data attached to the transfer of tokens | 

### canTransferFrom

Transfers of securities may fail for a number of reasons. So this function will used to understand the
cause of failure by getting the byte value. Which will be the ESC that follows the EIP 1066. ESC can be mapped
with a reson string to understand the failure cause, table of Ethereum status code will always reside off-chain

```js
function canTransferFrom(address _from, address _to, uint256 _value, bytes _data) external view
returns(statusCode bytes1, reasonCode bytes32)
```

**Returns**

byte Ethereum status code (ESC)

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address | address The address which you want to send tokens from | 
| _to | address | address The address which you want to transfer to | 
| _value | uint256 | uint256 the amount of tokens to be transferred | 
| _data | bytes | The `bytes _data` allows arbitrary data to be submitted alongside the transfer. | 

### setDocument

Used to attach a new document to the contract, or update the URI or hash of an existing attached document

```js
function setDocument(bytes32 _name, string _uri, bytes32 _documentHash) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _name | bytes32 | Name of the document. It should be unique always | 
| _uri | string | Off-chain uri of the document from where it is accessible to investors/advisors to read. | 
| _documentHash | bytes32 | hash (of the contents) of the document. | 

### removeDocument

Used to remove an existing document from the contract by giving the name of the document.

```js
function removeDocument(bytes32 _name) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _name | bytes32 | Name of the document. It should be unique always | 

### getDocument

Used to return the details of a document with a known name (`bytes32`).

```js
function getDocument(bytes32 _name) external view
returns(documentUri string, documentHash bytes32, documentTime uint256)
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
returns(documentNames bytes32[])
```

**Returns**

bytes32 List of all documents names present in the contract.

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### isControllable

In order to provide transparency over whether `controllerTransfer` / `controllerRedeem` are useable
or not `isControllable` function will be used.

```js
function isControllable() external view
returns(controlled bool)
```

**Returns**

bool `true` when controller address is non-zero otherwise return `false`.

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### isModule

Checks if an address is a module of certain type

```js
function isModule(address _module, uint8 _type) external view
returns(isValid bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _module | address | Address to check | 
| _type | uint8 | type to check against | 

### issue

This function must be called to increase the total supply (Corresponds to mint function of ERC20).

```js
function issue(address _tokenHolder, uint256 _value, bytes _data) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _tokenHolder | address | The account that will receive the created tokens (account should be whitelisted or KYCed). | 
| _value | uint256 | The amount of tokens need to be issued | 
| _data | bytes | The `bytes _data` allows arbitrary data to be submitted alongside the transfer. | 

### issueMulti

issue new tokens and assigns them to the target _tokenHolder.

```js
function issueMulti(address[] _tokenHolders, uint256[] _values) external nonpayable
```

**Returns**

success

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _tokenHolders | address[] | A list of addresses to whom the minted tokens will be dilivered | 
| _values | uint256[] | A list of number of tokens get minted and transfer to corresponding address of the investor from _tokenHolders[] list | 

### issueByPartition

Increases totalSupply and the corresponding amount of the specified owners partition

```js
function issueByPartition(bytes32 _partition, address _tokenHolder, uint256 _value, bytes _data) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _partition | bytes32 | The partition to allocate the increase in balance | 
| _tokenHolder | address | The token holder whose balance should be increased | 
| _value | uint256 | The amount by which to increase the balance | 
| _data | bytes | Additional data attached to the minting of tokens | 

### redeemByPartition

Decreases totalSupply and the corresponding amount of the specified partition of msg.sender

```js
function redeemByPartition(bytes32 _partition, uint256 _value, bytes _data) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _partition | bytes32 | The partition to allocate the decrease in balance | 
| _value | uint256 | The amount by which to decrease the balance | 
| _data | bytes | Additional data attached to the burning of tokens | 

### redeem

This function redeem an amount of the token of a msg.sender. For doing so msg.sender may incentivize
using different ways that could be implemented with in the `redeem` function definition. But those implementations
are out of the scope of the ERC1594.

```js
function redeem(uint256 _value, bytes _data) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _value | uint256 | The amount of tokens need to be redeemed | 
| _data | bytes | The `bytes _data` it can be used in the token contract to authenticate the redemption. | 

### redeemFrom

This function redeem an amount of the token of a msg.sender. For doing so msg.sender may incentivize
using different ways that could be implemented with in the `redeem` function definition. But those implementations
are out of the scope of the ERC1594.

```js
function redeemFrom(address _tokenHolder, uint256 _value, bytes _data) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _tokenHolder | address | The account whose tokens gets redeemed. | 
| _value | uint256 | The amount of tokens need to be redeemed | 
| _data | bytes | The `bytes _data` it can be used in the token contract to authenticate the redemption. | 

### operatorRedeemByPartition

Decreases totalSupply and the corresponding amount of the specified partition of tokenHolder

```js
function operatorRedeemByPartition(bytes32 _partition, address _tokenHolder, uint256 _value, bytes _data, bytes _operatorData) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _partition | bytes32 | The partition to allocate the decrease in balance. | 
| _tokenHolder | address | The token holder whose balance should be decreased | 
| _value | uint256 | The amount by which to decrease the balance | 
| _data | bytes | Additional data attached to the burning of tokens | 
| _operatorData | bytes | Additional data attached to the transfer of tokens by the operator | 

### checkPermission

Validate permissions with PermissionManager if it exists, If no Permission return false

```js
function checkPermission(address _delegate, address _module, bytes32 _perm) external view
returns(hasPermission bool)
```

**Returns**

success

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _delegate | address | address of delegate | 
| _module | address | address of PermissionManager module | 
| _perm | bytes32 | the permissions | 

### getModule

Returns module list for a module type

```js
function getModule(address _module) external view
returns(moduleName bytes32, moduleAddress address, factoryAddress address, isArchived bool, moduleTypes uint8[], moduleLabel bytes32)
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
returns(modules address[])
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
returns(modules address[])
```

**Returns**

address[] List of modules with this type

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _type | uint8 | Type of the module | 

### getTreasuryWallet

use to return the global treasury wallet

```js
function getTreasuryWallet() external view
returns(treasuryWallet address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### totalSupplyAt

Queries totalSupply at a specified checkpoint

```js
function totalSupplyAt(uint256 _checkpointId) external view
returns(supply uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _checkpointId | uint256 | Checkpoint ID to query as of | 

### balanceOfAt

Queries balance at a specified checkpoint

```js
function balanceOfAt(address _investor, uint256 _checkpointId) external view
returns(balance uint256)
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
returns(checkpointId uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getCheckpointTimes

Gets list of times that checkpoints were created

```js
function getCheckpointTimes() external view
returns(checkpointTimes uint256[])
```

**Returns**

List of checkpoint times

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getInvestors

returns an array of investors
NB - this length may differ from investorCount as it contains all investors that ever held tokens

```js
function getInvestors() external view
returns(investors address[])
```

**Returns**

list of addresses

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getInvestorsAt

returns an array of investors at a given checkpoint
NB - this length may differ from investorCount as it contains all investors that ever held tokens

```js
function getInvestorsAt(uint256 _checkpointId) external view
returns(investors address[])
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
returns(investors address[])
```

**Returns**

list of investors

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _checkpointId | uint256 | Checkpoint id at which investor list is to be populated | 
| _start | uint256 | Position of investor to start iteration from | 
| _end | uint256 | Position of investor to stop iteration at | 

### iterateInvestors

generates subset of investors
NB - can be used in batches if investor list is large

```js
function iterateInvestors(uint256 _start, uint256 _end) external view
returns(investors address[])
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
returns(checkpointId uint256)
```

**Returns**

Id

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### isOperator

Determines whether `_operator` is an operator for all partitions of `_tokenHolder`

```js
function isOperator(address _operator, address _tokenHolder) external view
returns(isValid bool)
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
returns(isValid bool)
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
function partitionsOf(address _tokenHolder) external pure
returns(partitions bytes32[])
```

**Returns**

List of partitions

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _tokenHolder | address | Whom balance need to queried | 

### dataStore

Gets data store address

```js
function dataStore() external view
returns(dataStoreAddress address)
```

**Returns**

data store address

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### changeDataStore

Allows owner to change data store

```js
function changeDataStore(address _dataStore) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _dataStore | address | Address of the token data store | 

### changeTreasuryWallet

Allows to change the treasury wallet address

```js
function changeTreasuryWallet(address _wallet) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _wallet | address | Ethereum address of the treasury wallet | 

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

Allows owner to increase/decrease POLY approval of one of the modules

```js
function changeModuleBudget(address _module, uint256 _change, bool _increase) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _module | address | Module address | 
| _change | uint256 | Change in allowance | 
| _increase | bool | True if budget has to be increased, false if decrease | 

### updateTokenDetails

Changes the tokenDetails

```js
function updateTokenDetails(string _newTokenDetails) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _newTokenDetails | string | New token details | 

### changeName

Allows owner to change token name

```js
function changeName(string _name) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _name | string | new name of the token | 

### changeGranularity

Allows the owner to change token granularity

```js
function changeGranularity(uint256 _granularity) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _granularity | uint256 | Granularity level of the token | 

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

### freezeIssuance

Permanently freeze issuance of this security token.

```js
function freezeIssuance(bytes _signature) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _signature | bytes |  | 

### addModuleWithLabel

Attachs a module to the SecurityToken

```js
function addModuleWithLabel(address _moduleFactory, bytes _data, uint256 _maxCost, uint256 _budget, bytes32 _label, bool _archived) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _moduleFactory | address | is the address of the module factory to be added | 
| _data | bytes | is data packed into bytes used to further configure the module (See STO usage) | 
| _maxCost | uint256 | max amount of POLY willing to pay to the module. | 
| _budget | uint256 | max amount of ongoing POLY willing to assign to the module. | 
| _label | bytes32 | custom module label. | 
| _archived | bool | whether to add the module as an archived module | 

### addModule

Function used to attach a module to the security token

```js
function addModule(address _moduleFactory, bytes _data, uint256 _maxCost, uint256 _budget, bool _archived) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _moduleFactory | address | is the address of the module factory to be added | 
| _data | bytes | is data packed into bytes used to further configure the module (See STO usage) | 
| _maxCost | uint256 | max amount of POLY willing to pay to module. (WIP) | 
| _budget | uint256 | max amount of ongoing POLY willing to assign to the module. | 
| _archived | bool | whether to add the module as an archived module | 

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

### controllerTransfer

This function allows an authorised address to transfer tokens between any two token holders.
The transfer must still respect the balances of the token holders (so the transfer must be for at most
`balanceOf(_from)` tokens) and potentially also need to respect other transfer restrictions.

```js
function controllerTransfer(address _from, address _to, uint256 _value, bytes _data, bytes _operatorData) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address | Address The address which you want to send tokens from | 
| _to | address | Address The address which you want to transfer to | 
| _value | uint256 | uint256 the amount of tokens to be transferred | 
| _data | bytes | data to validate the transfer. (It is not used in this reference implementation
because use of `_data` parameter is implementation specific). | 
| _operatorData | bytes | data attached to the transfer by controller to emit in event. (It is more like a reason string
for calling this function (aka force transfer) which provides the transparency on-chain). | 

### controllerRedeem

This function allows an authorised address to redeem tokens for any token holder.
The redemption must still respect the balances of the token holder (so the redemption must be for at most
`balanceOf(_tokenHolder)` tokens) and potentially also need to respect other transfer restrictions.

```js
function controllerRedeem(address _tokenHolder, uint256 _value, bytes _data, bytes _operatorData) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _tokenHolder | address | The account whose tokens will be redeemed. | 
| _value | uint256 | uint256 the amount of tokens need to be redeemed. | 
| _data | bytes | data to validate the transfer. (It is not used in this reference implementation
because use of `_data` parameter is implementation specific). | 
| _operatorData | bytes | data attached to the transfer by controller to emit in event. (It is more like a reason string
for calling this function (aka force transfer) which provides the transparency on-chain). | 

### disableController

Used by the issuer to permanently disable controller functionality

```js
function disableController(bytes _signature) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _signature | bytes |  | 

### getVersion

Used to get the version of the securityToken

```js
function getVersion() external view
returns(version uint8[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getInvestorCount

Gets the investor count

```js
function getInvestorCount() external view
returns(investorCount uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### holderCount

Gets the holder count (investors with non zero balance)

```js
function holderCount() external view
returns(count uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### transferWithData

Overloaded version of the transfer function

```js
function transferWithData(address _to, uint256 _value, bytes _data) external nonpayable
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

### transferByPartition

Transfers the ownership of tokens from a specified partition from one address to another address

```js
function transferByPartition(bytes32 _partition, address _to, uint256 _value, bytes _data) external nonpayable
returns(partition bytes32)
```

**Returns**

The partition to which the transferred tokens were allocated for the _to address

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _partition | bytes32 | The partition from which to transfer tokens | 
| _to | address | The address to which to transfer tokens to | 
| _value | uint256 | The amount of tokens to transfer from `_partition` | 
| _data | bytes | Additional data attached to the transfer of tokens | 

### balanceOfByPartition

Get the balance according to the provided partitions

```js
function balanceOfByPartition(bytes32 _partition, address _tokenHolder) external view
returns(balance uint256)
```

**Returns**

Amount of tokens as per the given partitions

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _partition | bytes32 | Partition which differentiate the tokens. | 
| _tokenHolder | address | Whom balance need to queried | 

### granularity

Provides the granularity of the token

```js
function granularity() external view
returns(granularityAmount uint256)
```

**Returns**

uint256

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### polymathRegistry

Provides the address of the polymathRegistry

```js
function polymathRegistry() external view
returns(registryAddress address)
```

**Returns**

address

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### upgradeModule

Upgrades a module attached to the SecurityToken

```js
function upgradeModule(address _module) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _module | address | address of module to archive | 

### upgradeToken

Upgrades security token

```js
function upgradeToken() external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### isIssuable

A security token issuer can specify that issuance has finished for the token
(i.e. no new tokens can be minted or issued).

```js
function isIssuable() external view
returns(issuable bool)
```

**Returns**

bool `true` signifies the minting is allowed. While `false` denotes the end of minting

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### authorizeOperator

Authorises an operator for all partitions of `msg.sender`.
NB - Allowing investors to authorize an investor to be an operator of all partitions
but it doesn't mean we operator is allowed to transfer the LOCKED partition values.
Logic for this restriction is written in `operatorTransferByPartition()` function.

```js
function authorizeOperator(address _operator) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _operator | address | An address which is being authorised. | 

### revokeOperator

Revokes authorisation of an operator previously given for all partitions of `msg.sender`.
NB - Allowing investors to authorize an investor to be an operator of all partitions
but it doesn't mean we operator is allowed to transfer the LOCKED partition values.
Logic for this restriction is written in `operatorTransferByPartition()` function.

```js
function revokeOperator(address _operator) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _operator | address | An address which is being de-authorised | 

### authorizeOperatorByPartition

Authorises an operator for a given partition of `msg.sender`

```js
function authorizeOperatorByPartition(bytes32 _partition, address _operator) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _partition | bytes32 | The partition to which the operator is authorised | 
| _operator | address | An address which is being authorised | 

### revokeOperatorByPartition

Revokes authorisation of an operator previously given for a specified partition of `msg.sender`

```js
function revokeOperatorByPartition(bytes32 _partition, address _operator) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _partition | bytes32 | The partition to which the operator is de-authorised | 
| _operator | address | An address which is being de-authorised | 

### operatorTransferByPartition

Transfers the ownership of tokens from a specified partition from one address to another address

```js
function operatorTransferByPartition(bytes32 _partition, address _from, address _to, uint256 _value, bytes _data, bytes _operatorData) external nonpayable
returns(partition bytes32)
```

**Returns**

The partition to which the transferred tokens were allocated for the _to address

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _partition | bytes32 | The partition from which to transfer tokens. | 
| _from | address | The address from which to transfer tokens from | 
| _to | address | The address to which to transfer tokens to | 
| _value | uint256 | The amount of tokens to transfer from `_partition` | 
| _data | bytes | Additional data attached to the transfer of tokens | 
| _operatorData | bytes | Additional data attached to the transfer of tokens by the operator | 

### transfersFrozen

```js
function transfersFrozen() external view
returns(isFrozen bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### transferOwnership

Allows the current owner to transfer control of the contract to a newOwner.

```js
function transferOwnership(address newOwner) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| newOwner | address | The address to transfer ownership to. | 

### isOwner

```js
function isOwner() external view
returns(bool)
```

**Returns**

true if `msg.sender` is the owner of the contract.

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### owner

```js
function owner() external view
returns(ownerAddress address)
```

**Returns**

the address of the owner.

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### controller

```js
function controller() external view
returns(controllerAddress address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### moduleRegistry

```js
function moduleRegistry() external view
returns(moduleRegistryAddress address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### securityTokenRegistry

```js
function securityTokenRegistry() external view
returns(securityTokenRegistryAddress address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### polyToken

```js
function polyToken() external view
returns(polyTokenAddress address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### tokenFactory

```js
function tokenFactory() external view
returns(tokenFactoryAddress address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getterDelegate

```js
function getterDelegate() external view
returns(delegate address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### controllerDisabled

```js
function controllerDisabled() external view
returns(isDisabled bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### initialized

```js
function initialized() external view
returns(isInitialized bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### tokenDetails

```js
function tokenDetails() external view
returns(details string)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### updateFromRegistry

```js
function updateFromRegistry() external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

