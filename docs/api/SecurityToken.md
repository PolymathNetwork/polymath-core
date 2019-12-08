---
id: version-3.0.0-SecurityToken
title: SecurityToken
original_id: SecurityToken
---

# Security Token contract (SecurityToken.sol)

View Source: [contracts/tokens/SecurityToken.sol](../../contracts/tokens/SecurityToken.sol)

**↗ Extends: [StandardToken](StandardToken.md), [DetailedERC20](DetailedERC20.md), [ReentrancyGuard](ReentrancyGuard.md), [RegistryUpdater](RegistryUpdater.md)**

**SecurityToken**

SecurityToken is an ERC20 token with added capabilities:

## Constructor

Constructor

```js
constructor(string memory _name, string memory _symbol, uint8 _decimals) public
```

**Arguments**

## Structs
### SemanticVersion

```js
struct SemanticVersion {
 uint8 major,
 uint8 minor,
 uint8 patch
}
```

## Contract Members
**Constants & Variables**

```js
//internal members
struct TokenLib.InvestorDataStorage internal investorData;
struct SecurityToken.SemanticVersion internal securityTokenVersion;
uint8 internal constant PERMISSION_KEY;
uint8 internal constant TRANSFER_KEY;
uint8 internal constant MINT_KEY;
uint8 internal constant CHECKPOINT_KEY;
uint8 internal constant BURN_KEY;
mapping(uint8 => address[]) internal modules;
mapping(address => struct TokenLib.ModuleData) internal modulesToData;
mapping(bytes32 => address[]) internal names;
mapping(address => struct TokenLib.Checkpoint[]) internal checkpointBalances;
struct TokenLib.Checkpoint[] internal checkpointTotalSupply;
uint256[] internal checkpointTimes;

//public members
string public tokenDetails;
uint256 public granularity;
uint256 public currentCheckpointId;
bool public transfersFrozen;
bool public mintingFrozen;
bool public controllerDisabled;
address public controller;

```

**Events**

```js
event ModuleAdded(uint8[]  _types, bytes32  _name, address  _moduleFactory, address  _module, uint256  _moduleCost, uint256  _budget, uint256  _timestamp);
event UpdateTokenDetails(string  _oldDetails, string  _newDetails);
event GranularityChanged(uint256  _oldGranularity, uint256  _newGranularity);
event ModuleArchived(uint8[]  _types, address  _module, uint256  _timestamp);
event ModuleUnarchived(uint8[]  _types, address  _module, uint256  _timestamp);
event ModuleRemoved(uint8[]  _types, address  _module, uint256  _timestamp);
event ModuleBudgetChanged(uint8[]  _moduleTypes, address  _module, uint256  _oldBudget, uint256  _budget);
event FreezeTransfers(bool  _status, uint256  _timestamp);
event CheckpointCreated(uint256 indexed _checkpointId, uint256  _timestamp);
event FreezeMinting(uint256  _timestamp);
event Minted(address indexed _to, uint256  _value);
event Burnt(address indexed _from, uint256  _value);
event SetController(address indexed _oldController, address indexed _newController);
event ForceTransfer(address indexed _controller, address indexed _from, address indexed _to, uint256  _value, bool  _verifyTransfer, bytes  _data);
event ForceBurn(address indexed _controller, address indexed _from, uint256  _value, bool  _verifyTransfer, bytes  _data);
event DisableController(uint256  _timestamp);
```

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _name | string memory | Name of the SecurityToken | 
| _symbol | string memory | Symbol of the Token | 
| _decimals | uint8 | Decimals for the securityToken | 

## Modifiers

- [onlyModule](#onlymodule)
- [onlyModuleOrOwner](#onlymoduleorowner)
- [checkGranularity](#checkgranularity)
- [isMintingAllowed](#ismintingallowed)
- [isEnabled](#isenabled)
- [onlyController](#onlycontroller)

### onlyModule

```js
modifier onlyModule(uint8 _type) internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _type | uint8 |  | 

### onlyModuleOrOwner

```js
modifier onlyModuleOrOwner(uint8 _type) internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _type | uint8 |  | 

### checkGranularity

```js
modifier checkGranularity(uint256 _value) internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _value | uint256 |  | 

### isMintingAllowed

```js
modifier isMintingAllowed() internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### isEnabled

```js
modifier isEnabled(string _nameKey) internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _nameKey | string |  | 

### onlyController

Revert if called by an account which is not a controller

```js
modifier onlyController() internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

## Functions

- [_isModule(address _module, uint8 _type)](#_ismodule)
- [addModule(address _moduleFactory, bytes _data, uint256 _maxCost, uint256 _budget)](#addmodule)
- [archiveModule(address _module)](#archivemodule)
- [unarchiveModule(address _module)](#unarchivemodule)
- [removeModule(address _module)](#removemodule)
- [_removeModuleWithIndex(uint8 _type, uint256 _index)](#_removemodulewithindex)
- [getModule(address _module)](#getmodule)
- [getModulesByName(bytes32 _name)](#getmodulesbyname)
- [getModulesByType(uint8 _type)](#getmodulesbytype)
- [withdrawERC20(address _tokenContract, uint256 _value)](#withdrawerc20)
- [changeModuleBudget(address _module, uint256 _change, bool _increase)](#changemodulebudget)
- [updateTokenDetails(string _newTokenDetails)](#updatetokendetails)
- [changeGranularity(uint256 _granularity)](#changegranularity)
- [_adjustInvestorCount(address _from, address _to, uint256 _value)](#_adjustinvestorcount)
- [getInvestors()](#getinvestors)
- [getInvestorsAt(uint256 _checkpointId)](#getinvestorsat)
- [iterateInvestors(uint256 _start, uint256 _end)](#iterateinvestors)
- [getInvestorCount()](#getinvestorcount)
- [freezeTransfers()](#freezetransfers)
- [unfreezeTransfers()](#unfreezetransfers)
- [_adjustTotalSupplyCheckpoints()](#_adjusttotalsupplycheckpoints)
- [_adjustBalanceCheckpoints(address _investor)](#_adjustbalancecheckpoints)
- [transfer(address _to, uint256 _value)](#transfer)
- [transferWithData(address _to, uint256 _value, bytes _data)](#transferwithdata)
- [transferFrom(address _from, address _to, uint256 _value)](#transferfrom)
- [transferFromWithData(address _from, address _to, uint256 _value, bytes _data)](#transferfromwithdata)
- [_updateTransfer(address _from, address _to, uint256 _value, bytes _data)](#_updatetransfer)
- [_verifyTransfer(address _from, address _to, uint256 _value, bytes _data, bool _isTransfer)](#_verifytransfer)
- [verifyTransfer(address _from, address _to, uint256 _value, bytes _data)](#verifytransfer)
- [freezeMinting()](#freezeminting)
- [mint(address _investor, uint256 _value)](#mint)
- [mintWithData(address _investor, uint256 _value, bytes _data)](#mintwithdata)
- [mintMulti(address[] _investors, uint256[] _values)](#mintmulti)
- [checkPermission(address _delegate, address _module, bytes32 _perm)](#checkpermission)
- [_burn(address _from, uint256 _value, bytes _data)](#_burn)
- [burnWithData(uint256 _value, bytes _data)](#burnwithdata)
- [burnFromWithData(address _from, uint256 _value, bytes _data)](#burnfromwithdata)
- [createCheckpoint()](#createcheckpoint)
- [getCheckpointTimes()](#getcheckpointtimes)
- [totalSupplyAt(uint256 _checkpointId)](#totalsupplyat)
- [balanceOfAt(address _investor, uint256 _checkpointId)](#balanceofat)
- [setController(address _controller)](#setcontroller)
- [disableController()](#disablecontroller)
- [forceTransfer(address _from, address _to, uint256 _value, bytes _data, bytes _log)](#forcetransfer)
- [forceBurn(address _from, uint256 _value, bytes _data, bytes _log)](#forceburn)
- [getVersion()](#getversion)

### _isModule

```js
function _isModule(address _module, uint8 _type) internal view
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _module | address |  | 
| _type | uint8 |  | 

### addModule

Attachs a module to the SecurityToken

```js
function addModule(address _moduleFactory, bytes _data, uint256 _maxCost, uint256 _budget) external nonpayable onlyOwner nonReentrant 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _moduleFactory | address | is the address of the module factory to be added | 
| _data | bytes | is data packed into bytes used to further configure the module (See STO usage) | 
| _maxCost | uint256 | max amount of POLY willing to pay to the module. | 
| _budget | uint256 | max amount of ongoing POLY willing to assign to the module. | 

### archiveModule

Archives a module attached to the SecurityToken

```js
function archiveModule(address _module) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _module | address | address of module to archive | 

### unarchiveModule

Unarchives a module attached to the SecurityToken

```js
function unarchiveModule(address _module) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _module | address | address of module to unarchive | 

### removeModule

Removes a module attached to the SecurityToken

```js
function removeModule(address _module) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _module | address | address of module to unarchive | 

### _removeModuleWithIndex

Internal - Removes a module attached to the SecurityToken by index

```js
function _removeModuleWithIndex(uint8 _type, uint256 _index) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _type | uint8 |  | 
| _index | uint256 |  | 

### getModule

Returns the data associated to a module

```js
function getModule(address _module) external view
returns(bytes32, address, address, bool, uint8[])
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

### withdrawERC20

Allows the owner to withdraw unspent POLY stored by them on the ST or any ERC20 token.

```js
function withdrawERC20(address _tokenContract, uint256 _value) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _tokenContract | address | Address of the ERC20Basic compliance token | 
| _value | uint256 | amount of POLY to withdraw | 

### changeModuleBudget

allows owner to increase/decrease POLY approval of one of the modules

```js
function changeModuleBudget(address _module, uint256 _change, bool _increase) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _module | address | module address | 
| _change | uint256 | change in allowance | 
| _increase | bool | true if budget has to be increased, false if decrease | 

### updateTokenDetails

updates the tokenDetails associated with the token

```js
function updateTokenDetails(string _newTokenDetails) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _newTokenDetails | string | New token details | 

### changeGranularity

Allows owner to change token granularity

```js
function changeGranularity(uint256 _granularity) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _granularity | uint256 | granularity level of the token | 

### _adjustInvestorCount

Keeps track of the number of non-zero token holders

```js
function _adjustInvestorCount(address _from, address _to, uint256 _value) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address | sender of transfer | 
| _to | address | receiver of transfer | 
| _value | uint256 | value of transfer | 

### getInvestors

returns an array of investors
NB - this length may differ from investorCount as it contains all investors that ever held tokens

```js
function getInvestors() external view
returns(address[])
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

### getInvestorCount

Returns the investor count

```js
function getInvestorCount() external view
returns(uint256)
```

**Returns**

Investor count

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### freezeTransfers

freezes transfers

```js
function freezeTransfers() external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### unfreezeTransfers

Unfreeze transfers

```js
function unfreezeTransfers() external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### _adjustTotalSupplyCheckpoints

Internal - adjusts totalSupply at checkpoint before minting or burning tokens

```js
function _adjustTotalSupplyCheckpoints() internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### _adjustBalanceCheckpoints

Internal - adjusts token holder balance at checkpoint before a token transfer

```js
function _adjustBalanceCheckpoints(address _investor) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investor | address | address of the token holder affected | 

### transfer

⤾ overrides [BasicToken.transfer](BasicToken.md#transfer)

Overloaded version of the transfer function

```js
function transfer(address _to, uint256 _value) public nonpayable
returns(success bool)
```

**Returns**

bool success

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _to | address | receiver of transfer | 
| _value | uint256 | value of transfer | 

### transferWithData

Overloaded version of the transfer function

```js
function transferWithData(address _to, uint256 _value, bytes _data) public nonpayable
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

### transferFrom

⤾ overrides [StandardToken.transferFrom](StandardToken.md#transferfrom)

Overloaded version of the transferFrom function

```js
function transferFrom(address _from, address _to, uint256 _value) public nonpayable
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

### transferFromWithData

Overloaded version of the transferFrom function

```js
function transferFromWithData(address _from, address _to, uint256 _value, bytes _data) public nonpayable
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

### _updateTransfer

Updates internal variables when performing a transfer

```js
function _updateTransfer(address _from, address _to, uint256 _value, bytes _data) internal nonpayable nonReentrant 
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

### _verifyTransfer

Validate transfer with TransferManager module if it exists

```js
function _verifyTransfer(address _from, address _to, uint256 _value, bytes _data, bool _isTransfer) internal nonpayable checkGranularity 
returns(bool)
```

**Returns**

bool

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address | sender of transfer | 
| _to | address | receiver of transfer | 
| _value | uint256 | value of transfer | 
| _data | bytes | data to indicate validation | 
| _isTransfer | bool | whether transfer is being executed | 

### verifyTransfer

Validates a transfer with a TransferManager module if it exists

```js
function verifyTransfer(address _from, address _to, uint256 _value, bytes _data) public nonpayable
returns(bool)
```

**Returns**

bool

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address | sender of transfer | 
| _to | address | receiver of transfer | 
| _value | uint256 | value of transfer | 
| _data | bytes | data to indicate validation | 

### freezeMinting

Permanently freeze minting of this security token.

```js
function freezeMinting() external nonpayable isMintingAllowed isEnabled onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### mint

Mints new tokens and assigns them to the target _investor.

```js
function mint(address _investor, uint256 _value) public nonpayable
returns(success bool)
```

**Returns**

success

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investor | address | Address where the minted tokens will be delivered | 
| _value | uint256 | Number of tokens be minted | 

### mintWithData

mints new tokens and assigns them to the target _investor.

```js
function mintWithData(address _investor, uint256 _value, bytes _data) public nonpayable onlyModuleOrOwner isMintingAllowed 
returns(success bool)
```

**Returns**

success

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investor | address | Address where the minted tokens will be delivered | 
| _value | uint256 | Number of tokens be minted | 
| _data | bytes | data to indicate validation | 

### mintMulti

Mints new tokens and assigns them to the target _investor.

```js
function mintMulti(address[] _investors, uint256[] _values) external nonpayable
returns(success bool)
```

**Returns**

success

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investors | address[] | A list of addresses to whom the minted tokens will be dilivered | 
| _values | uint256[] | A list of number of tokens get minted and transfer to corresponding address of the investor from _investor[] list | 

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

### _burn

```js
function _burn(address _from, uint256 _value, bytes _data) internal nonpayable
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address |  | 
| _value | uint256 |  | 
| _data | bytes |  | 

### burnWithData

Burn function used to burn the securityToken

```js
function burnWithData(uint256 _value, bytes _data) public nonpayable onlyModule 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _value | uint256 | No. of tokens that get burned | 
| _data | bytes | data to indicate validation | 

### burnFromWithData

Burn function used to burn the securityToken on behalf of someone else

```js
function burnFromWithData(address _from, uint256 _value, bytes _data) public nonpayable onlyModule 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address | Address for whom to burn tokens | 
| _value | uint256 | No. of tokens that get burned | 
| _data | bytes | data to indicate validation | 

### createCheckpoint

Creates a checkpoint that can be used to query historical balances / totalSuppy

```js
function createCheckpoint() external nonpayable onlyModuleOrOwner 
returns(uint256)
```

**Returns**

uint256

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

### setController

Used by the issuer to set the controller addresses

```js
function setController(address _controller) public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _controller | address | address of the controller | 

### disableController

Used by the issuer to permanently disable controller functionality

```js
function disableController() external nonpayable isEnabled onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### forceTransfer

Used by a controller to execute a forced transfer

```js
function forceTransfer(address _from, address _to, uint256 _value, bytes _data, bytes _log) public nonpayable onlyController 
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

Used by a controller to execute a forced burn

```js
function forceBurn(address _from, uint256 _value, bytes _data, bytes _log) public nonpayable onlyController 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address | address from which to take tokens | 
| _value | uint256 | amount of tokens to transfer | 
| _data | bytes | data to indicate validation | 
| _log | bytes | data attached to the transfer by controller to emit in event | 

### getVersion

Returns the version of the SecurityToken

```js
function getVersion() external view
returns(uint8[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

