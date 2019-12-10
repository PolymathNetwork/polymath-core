---
id: version-3.0.0-SecurityToken
title: SecurityToken
original_id: SecurityToken
---

# Security Token contract (SecurityToken.sol)

View Source: [contracts/tokens/SecurityToken.sol](../../contracts/tokens/SecurityToken.sol)

**↗ Extends: [ERC20](ERC20.md), [ReentrancyGuard](ReentrancyGuard.md), [SecurityTokenStorage](SecurityTokenStorage.md), [IERC1594](IERC1594.md), [IERC1643](IERC1643.md), [IERC1644](IERC1644.md), [IERC1410](IERC1410.md), [Proxy](Proxy.md)**
**↘ Derived Contracts: [MockSecurityTokenLogic](MockSecurityTokenLogic.md), [SecurityTokenMock](SecurityTokenMock.md)**

**SecurityToken**

SecurityToken is an ERC1400 token with added capabilities:

**Events**

```js
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
```

## Modifiers

- [checkGranularity](#checkgranularity)

### checkGranularity

```js
modifier checkGranularity(uint256 _value) internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _value | uint256 |  | 

## Functions

- [()](#)
- [initialize(address _getterDelegate)](#initialize)
- [isModule(address _module, uint8 _type)](#ismodule)
- [_onlyModuleOrOwner(uint8 _type)](#_onlymoduleorowner)
- [_isValidPartition(bytes32 _partition)](#_isvalidpartition)
- [_isValidOperator(address _from, address _operator, bytes32 _partition)](#_isvalidoperator)
- [_zeroAddressCheck(address _entity)](#_zeroaddresscheck)
- [_isValidTransfer(bool _isTransfer)](#_isvalidtransfer)
- [_isValidRedeem(bool _isRedeem)](#_isvalidredeem)
- [_isSignedByOwner(bool _signed)](#_issignedbyowner)
- [_isIssuanceAllowed()](#_isissuanceallowed)
- [_onlyController()](#_onlycontroller)
- [_isAuthorised(bool _authorised)](#_isauthorised)
- [_onlyOwner()](#_onlyowner)
- [_onlyModule(uint8 _type)](#_onlymodule)
- [addModuleWithLabel(address _moduleFactory, bytes _data, uint256 _maxCost, uint256 _budget, bytes32 _label, bool _archived)](#addmodulewithlabel)
- [_addModuleData(uint8[] _moduleTypes, address _moduleFactory, address _module, uint256 _moduleCost, uint256 _budget, bytes32 _label, bool _archived)](#_addmoduledata)
- [addModule(address _moduleFactory, bytes _data, uint256 _maxCost, uint256 _budget, bool _archived)](#addmodule)
- [archiveModule(address _module)](#archivemodule)
- [upgradeModule(address _module)](#upgrademodule)
- [upgradeToken()](#upgradetoken)
- [unarchiveModule(address _module)](#unarchivemodule)
- [removeModule(address _module)](#removemodule)
- [withdrawERC20(address _tokenContract, uint256 _value)](#withdrawerc20)
- [changeModuleBudget(address _module, uint256 _change, bool _increase)](#changemodulebudget)
- [updateTokenDetails(string _newTokenDetails)](#updatetokendetails)
- [changeGranularity(uint256 _granularity)](#changegranularity)
- [changeDataStore(address _dataStore)](#changedatastore)
- [changeName(string _name)](#changename)
- [changeTreasuryWallet(address _wallet)](#changetreasurywallet)
- [_adjustInvestorCount(address _from, address _to, uint256 _value)](#_adjustinvestorcount)
- [freezeTransfers()](#freezetransfers)
- [unfreezeTransfers()](#unfreezetransfers)
- [_adjustBalanceCheckpoints(address _investor)](#_adjustbalancecheckpoints)
- [transfer(address _to, uint256 _value)](#transfer)
- [transferWithData(address _to, uint256 _value, bytes _data)](#transferwithdata)
- [_transferWithData(address _from, address _to, uint256 _value, bytes _data)](#_transferwithdata)
- [transferFrom(address _from, address _to, uint256 _value)](#transferfrom)
- [transferFromWithData(address _from, address _to, uint256 _value, bytes _data)](#transferfromwithdata)
- [balanceOfByPartition(bytes32 _partition, address _tokenHolder)](#balanceofbypartition)
- [_balanceOfByPartition(bytes32 _partition, address _tokenHolder, uint256 _additionalBalance)](#_balanceofbypartition)
- [transferByPartition(bytes32 _partition, address _to, uint256 _value, bytes _data)](#transferbypartition)
- [_transferByPartition(address _from, address _to, uint256 _value, bytes32 _partition, bytes _data, address _operator, bytes _operatorData)](#_transferbypartition)
- [_returnPartition(uint256 _beforeBalance, uint256 _afterBalance, uint256 _value)](#_returnpartition)
- [authorizeOperator(address _operator)](#authorizeoperator)
- [revokeOperator(address _operator)](#revokeoperator)
- [authorizeOperatorByPartition(bytes32 _partition, address _operator)](#authorizeoperatorbypartition)
- [revokeOperatorByPartition(bytes32 _partition, address _operator)](#revokeoperatorbypartition)
- [operatorTransferByPartition(bytes32 _partition, address _from, address _to, uint256 _value, bytes _data, bytes _operatorData)](#operatortransferbypartition)
- [_validateOperatorAndPartition(bytes32 _partition, address _from, address _operator)](#_validateoperatorandpartition)
- [_updateTransfer(address _from, address _to, uint256 _value, bytes _data)](#_updatetransfer)
- [_executeTransfer(address _from, address _to, uint256 _value, bytes _data)](#_executetransfer)
- [freezeIssuance(bytes _signature)](#freezeissuance)
- [issue(address _tokenHolder, uint256 _value, bytes _data)](#issue)
- [_issue(address _tokenHolder, uint256 _value, bytes _data)](#_issue)
- [issueMulti(address[] _tokenHolders, uint256[] _values)](#issuemulti)
- [issueByPartition(bytes32 _partition, address _tokenHolder, uint256 _value, bytes _data)](#issuebypartition)
- [redeem(uint256 _value, bytes _data)](#redeem)
- [_redeem(address _from, uint256 _value, bytes _data)](#_redeem)
- [redeemByPartition(bytes32 _partition, uint256 _value, bytes _data)](#redeembypartition)
- [_redeemByPartition(bytes32 _partition, address _from, uint256 _value, address _operator, bytes _data, bytes _operatorData)](#_redeembypartition)
- [operatorRedeemByPartition(bytes32 _partition, address _tokenHolder, uint256 _value, bytes _data, bytes _operatorData)](#operatorredeembypartition)
- [_checkAndBurn(address _from, uint256 _value, bytes _data)](#_checkandburn)
- [redeemFrom(address _tokenHolder, uint256 _value, bytes _data)](#redeemfrom)
- [createCheckpoint()](#createcheckpoint)
- [setController(address _controller)](#setcontroller)
- [disableController(bytes _signature)](#disablecontroller)
- [canTransfer(address _to, uint256 _value, bytes _data)](#cantransfer)
- [canTransferFrom(address _from, address _to, uint256 _value, bytes _data)](#cantransferfrom)
- [_canTransfer(address _from, address _to, uint256 _value, bytes _data)](#_cantransfer)
- [canTransferByPartition(address _from, address _to, bytes32 _partition, uint256 _value, bytes _data)](#cantransferbypartition)
- [setDocument(bytes32 _name, string _uri, bytes32 _documentHash)](#setdocument)
- [removeDocument(bytes32 _name)](#removedocument)
- [isControllable()](#iscontrollable)
- [controllerTransfer(address _from, address _to, uint256 _value, bytes _data, bytes _operatorData)](#controllertransfer)
- [controllerRedeem(address _tokenHolder, uint256 _value, bytes _data, bytes _operatorData)](#controllerredeem)
- [_implementation()](#_implementation)
- [updateFromRegistry()](#updatefromregistry)
- [owner()](#owner)
- [isOwner()](#isowner)
- [transferOwnership(address newOwner)](#transferownership)
- [_transferOwnership(address newOwner)](#_transferownership)
- [_isSuccess(bytes1 status)](#_issuccess)

### 

```js
function () public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### initialize

⤿ Overridden Implementation(s): [SecurityTokenMock.initialize](SecurityTokenMock.md#initialize)

Initialization function

```js
function initialize(address _getterDelegate) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _getterDelegate | address |  | 

### isModule

Checks if an address is a module of certain type

```js
function isModule(address _module, uint8 _type) public view
returns(bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _module | address | Address to check | 
| _type | uint8 | type to check against | 

### _onlyModuleOrOwner

```js
function _onlyModuleOrOwner(uint8 _type) internal view
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _type | uint8 |  | 

### _isValidPartition

```js
function _isValidPartition(bytes32 _partition) internal pure
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _partition | bytes32 |  | 

### _isValidOperator

```js
function _isValidOperator(address _from, address _operator, bytes32 _partition) internal view
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address |  | 
| _operator | address |  | 
| _partition | bytes32 |  | 

### _zeroAddressCheck

```js
function _zeroAddressCheck(address _entity) internal pure
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _entity | address |  | 

### _isValidTransfer

```js
function _isValidTransfer(bool _isTransfer) internal pure
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _isTransfer | bool |  | 

### _isValidRedeem

```js
function _isValidRedeem(bool _isRedeem) internal pure
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _isRedeem | bool |  | 

### _isSignedByOwner

```js
function _isSignedByOwner(bool _signed) internal pure
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _signed | bool |  | 

### _isIssuanceAllowed

```js
function _isIssuanceAllowed() internal view
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### _onlyController

```js
function _onlyController() internal view
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### _isAuthorised

```js
function _isAuthorised(bool _authorised) internal pure
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _authorised | bool |  | 

### _onlyOwner

Throws if called by any account other than the owner.

```js
function _onlyOwner() internal view
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### _onlyModule

Require msg.sender to be the specified module type

```js
function _onlyModule(uint8 _type) internal view
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _type | uint8 |  | 

### addModuleWithLabel

⤿ Overridden Implementation(s): [MockSecurityTokenLogic.addModuleWithLabel](MockSecurityTokenLogic.md#addmodulewithlabel)

Attachs a module to the SecurityToken

```js
function addModuleWithLabel(address _moduleFactory, bytes _data, uint256 _maxCost, uint256 _budget, bytes32 _label, bool _archived) public nonpayable nonReentrant 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _moduleFactory | address | is the address of the module factory to be added | 
| _data | bytes | is data packed into bytes used to further configure the module (See STO usage) | 
| _maxCost | uint256 | max amount of POLY willing to pay to the module. | 
| _budget | uint256 | max amount of ongoing POLY willing to assign to the module. | 
| _label | bytes32 | custom module label. | 
| _archived | bool |  | 

### _addModuleData

```js
function _addModuleData(uint8[] _moduleTypes, address _moduleFactory, address _module, uint256 _moduleCost, uint256 _budget, bytes32 _label, bool _archived) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _moduleTypes | uint8[] |  | 
| _moduleFactory | address |  | 
| _module | address |  | 
| _moduleCost | uint256 |  | 
| _budget | uint256 |  | 
| _label | bytes32 |  | 
| _archived | bool |  | 

### addModule

addModule function will call addModuleWithLabel() with an empty label for backward compatible

```js
function addModule(address _moduleFactory, bytes _data, uint256 _maxCost, uint256 _budget, bool _archived) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _moduleFactory | address |  | 
| _data | bytes |  | 
| _maxCost | uint256 |  | 
| _budget | uint256 |  | 
| _archived | bool |  | 

### archiveModule

Archives a module attached to the SecurityToken

```js
function archiveModule(address _module) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _module | address | address of module to archive | 

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
| _module | address | address of module to unarchive | 

### withdrawERC20

Allows the owner to withdraw unspent POLY stored by them on the ST or any ERC20 token.

```js
function withdrawERC20(address _tokenContract, uint256 _value) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _tokenContract | address | Address of the ERC20Basic compliance token | 
| _value | uint256 | amount of POLY to withdraw | 

### changeModuleBudget

allows owner to increase/decrease POLY approval of one of the modules

```js
function changeModuleBudget(address _module, uint256 _change, bool _increase) external nonpayable
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
function updateTokenDetails(string _newTokenDetails) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _newTokenDetails | string | New token details | 

### changeGranularity

Allows owner to change token granularity

```js
function changeGranularity(uint256 _granularity) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _granularity | uint256 | granularity level of the token | 

### changeDataStore

Allows owner to change data store

```js
function changeDataStore(address _dataStore) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _dataStore | address | Address of the token data store | 

### changeName

Allows owner to change token name

```js
function changeName(string _name) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _name | string | new name of the token | 

### changeTreasuryWallet

Allows to change the treasury wallet address

```js
function changeTreasuryWallet(address _wallet) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _wallet | address | Ethereum address of the treasury wallet | 

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

### freezeTransfers

freezes transfers

```js
function freezeTransfers() external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### unfreezeTransfers

Unfreeze transfers

```js
function unfreezeTransfers() external nonpayable
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

⤾ overrides [ERC20.transfer](ERC20.md#transfer)

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

⤾ overrides [IERC1594.transferWithData](IERC1594.md#transferwithdata)

Transfer restrictions can take many forms and typically involve on-chain rules or whitelists.
However for many types of approved transfers, maintaining an on-chain list of approved transfers can be
cumbersome and expensive. An alternative is the co-signing approach, where in addition to the token holder
approving a token transfer, and authorised entity provides signed data which further validates the transfer.

```js
function transferWithData(address _to, uint256 _value, bytes _data) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _to | address | address The address which you want to transfer to | 
| _value | uint256 | uint256 the amount of tokens to be transferred | 
| _data | bytes | The `bytes _data` allows arbitrary data to be submitted alongside the transfer.
for the token contract to interpret or record. This could be signed data authorising the transfer
(e.g. a dynamic whitelist) but is flexible enough to accomadate other use-cases. | 

### _transferWithData

```js
function _transferWithData(address _from, address _to, uint256 _value, bytes _data) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address |  | 
| _to | address |  | 
| _value | uint256 |  | 
| _data | bytes |  | 

### transferFrom

⤾ overrides [ERC20.transferFrom](ERC20.md#transferfrom)

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

⤾ overrides [IERC1594.transferFromWithData](IERC1594.md#transferfromwithdata)

Transfer restrictions can take many forms and typically involve on-chain rules or whitelists.
However for many types of approved transfers, maintaining an on-chain list of approved transfers can be
cumbersome and expensive. An alternative is the co-signing approach, where in addition to the token holder
approving a token transfer, and authorised entity provides signed data which further validates the transfer.

```js
function transferFromWithData(address _from, address _to, uint256 _value, bytes _data) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address | address The address which you want to send tokens from | 
| _to | address | address The address which you want to transfer to | 
| _value | uint256 | uint256 the amount of tokens to be transferred | 
| _data | bytes | The `bytes _data` allows arbitrary data to be submitted alongside the transfer.
for the token contract to interpret or record. This could be signed data authorising the transfer
(e.g. a dynamic whitelist) but is flexible enough to accomadate other use-cases. | 

### balanceOfByPartition

⤾ overrides [IERC1410.balanceOfByPartition](IERC1410.md#balanceofbypartition)

Get the balance according to the provided partitions

```js
function balanceOfByPartition(bytes32 _partition, address _tokenHolder) public view
returns(uint256)
```

**Returns**

Amount of tokens as per the given partitions

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _partition | bytes32 | Partition which differentiate the tokens. | 
| _tokenHolder | address | Whom balance need to queried | 

### _balanceOfByPartition

```js
function _balanceOfByPartition(bytes32 _partition, address _tokenHolder, uint256 _additionalBalance) internal view
returns(partitionBalance uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _partition | bytes32 |  | 
| _tokenHolder | address |  | 
| _additionalBalance | uint256 |  | 

### transferByPartition

⤾ overrides [IERC1410.transferByPartition](IERC1410.md#transferbypartition)

Transfers the ownership of tokens from a specified partition from one address to another address

```js
function transferByPartition(bytes32 _partition, address _to, uint256 _value, bytes _data) public nonpayable
returns(bytes32)
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

### _transferByPartition

```js
function _transferByPartition(address _from, address _to, uint256 _value, bytes32 _partition, bytes _data, address _operator, bytes _operatorData) internal nonpayable
returns(toPartition bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address |  | 
| _to | address |  | 
| _value | uint256 |  | 
| _partition | bytes32 |  | 
| _data | bytes |  | 
| _operator | address |  | 
| _operatorData | bytes |  | 

### _returnPartition

```js
function _returnPartition(uint256 _beforeBalance, uint256 _afterBalance, uint256 _value) internal pure
returns(toPartition bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _beforeBalance | uint256 |  | 
| _afterBalance | uint256 |  | 
| _value | uint256 |  | 

### authorizeOperator

⤾ overrides [IERC1410.authorizeOperator](IERC1410.md#authorizeoperator)

Authorises an operator for all partitions of `msg.sender`.
NB - Allowing investors to authorize an investor to be an operator of all partitions
but it doesn't mean we operator is allowed to transfer the LOCKED partition values.
Logic for this restriction is written in `operatorTransferByPartition()` function.

```js
function authorizeOperator(address _operator) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _operator | address | An address which is being authorised. | 

### revokeOperator

⤾ overrides [IERC1410.revokeOperator](IERC1410.md#revokeoperator)

Revokes authorisation of an operator previously given for all partitions of `msg.sender`.
NB - Allowing investors to authorize an investor to be an operator of all partitions
but it doesn't mean we operator is allowed to transfer the LOCKED partition values.
Logic for this restriction is written in `operatorTransferByPartition()` function.

```js
function revokeOperator(address _operator) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _operator | address | An address which is being de-authorised | 

### authorizeOperatorByPartition

⤾ overrides [IERC1410.authorizeOperatorByPartition](IERC1410.md#authorizeoperatorbypartition)

Authorises an operator for a given partition of `msg.sender`

```js
function authorizeOperatorByPartition(bytes32 _partition, address _operator) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _partition | bytes32 | The partition to which the operator is authorised | 
| _operator | address | An address which is being authorised | 

### revokeOperatorByPartition

⤾ overrides [IERC1410.revokeOperatorByPartition](IERC1410.md#revokeoperatorbypartition)

Revokes authorisation of an operator previously given for a specified partition of `msg.sender`

```js
function revokeOperatorByPartition(bytes32 _partition, address _operator) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _partition | bytes32 | The partition to which the operator is de-authorised | 
| _operator | address | An address which is being de-authorised | 

### operatorTransferByPartition

⤾ overrides [IERC1410.operatorTransferByPartition](IERC1410.md#operatortransferbypartition)

Transfers the ownership of tokens from a specified partition from one address to another address

```js
function operatorTransferByPartition(bytes32 _partition, address _from, address _to, uint256 _value, bytes _data, bytes _operatorData) external nonpayable
returns(bytes32)
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

### _validateOperatorAndPartition

```js
function _validateOperatorAndPartition(bytes32 _partition, address _from, address _operator) internal view
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _partition | bytes32 |  | 
| _from | address |  | 
| _operator | address |  | 

### _updateTransfer

Updates internal variables when performing a transfer

```js
function _updateTransfer(address _from, address _to, uint256 _value, bytes _data) internal nonpayable nonReentrant 
returns(verified bool)
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

### _executeTransfer

Validate transfer with TransferManager module if it exists

```js
function _executeTransfer(address _from, address _to, uint256 _value, bytes _data) internal nonpayable checkGranularity 
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

### freezeIssuance

Permanently freeze issuance of this security token.

```js
function freezeIssuance(bytes _signature) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _signature | bytes |  | 

### issue

⤾ overrides [IERC1594.issue](IERC1594.md#issue)

This function must be called to increase the total supply (Corresponds to mint function of ERC20).

```js
function issue(address _tokenHolder, uint256 _value, bytes _data) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _tokenHolder | address | The account that will receive the created tokens (account should be whitelisted or KYCed). | 
| _value | uint256 | The amount of tokens need to be issued | 
| _data | bytes | The `bytes _data` allows arbitrary data to be submitted alongside the transfer. | 

### _issue

```js
function _issue(address _tokenHolder, uint256 _value, bytes _data) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _tokenHolder | address |  | 
| _value | uint256 |  | 
| _data | bytes |  | 

### issueMulti

issue new tokens and assigns them to the target _tokenHolder.

```js
function issueMulti(address[] _tokenHolders, uint256[] _values) public nonpayable
```

**Returns**

success

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _tokenHolders | address[] | A list of addresses to whom the minted tokens will be dilivered | 
| _values | uint256[] | A list of number of tokens get minted and transfer to corresponding address of the investor from _tokenHolders[] list | 

### issueByPartition

⤾ overrides [IERC1410.issueByPartition](IERC1410.md#issuebypartition)

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

### redeem

⤾ overrides [IERC1594.redeem](IERC1594.md#redeem)

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

### _redeem

```js
function _redeem(address _from, uint256 _value, bytes _data) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address |  | 
| _value | uint256 |  | 
| _data | bytes |  | 

### redeemByPartition

⤾ overrides [IERC1410.redeemByPartition](IERC1410.md#redeembypartition)

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

### _redeemByPartition

```js
function _redeemByPartition(bytes32 _partition, address _from, uint256 _value, address _operator, bytes _data, bytes _operatorData) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _partition | bytes32 |  | 
| _from | address |  | 
| _value | uint256 |  | 
| _operator | address |  | 
| _data | bytes |  | 
| _operatorData | bytes |  | 

### operatorRedeemByPartition

⤾ overrides [IERC1410.operatorRedeemByPartition](IERC1410.md#operatorredeembypartition)

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

### _checkAndBurn

```js
function _checkAndBurn(address _from, uint256 _value, bytes _data) internal nonpayable
returns(verified bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address |  | 
| _value | uint256 |  | 
| _data | bytes |  | 

### redeemFrom

⤾ overrides [IERC1594.redeemFrom](IERC1594.md#redeemfrom)

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

### createCheckpoint

Creates a checkpoint that can be used to query historical balances / totalSuppy

```js
function createCheckpoint() external nonpayable
returns(uint256)
```

**Returns**

uint256

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### setController

Used by the issuer to set the controller addresses

```js
function setController(address _controller) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _controller | address | address of the controller | 

### disableController

Used by the issuer to permanently disable controller functionality

```js
function disableController(bytes _signature) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _signature | bytes |  | 

### canTransfer

⤾ overrides [IERC1594.canTransfer](IERC1594.md#cantransfer)

Transfers of securities may fail for a number of reasons. So this function will used to understand the
cause of failure by getting the byte value. Which will be the ESC that follows the EIP 1066. ESC can be mapped
with a reson string to understand the failure cause, table of Ethereum status code will always reside off-chain

```js
function canTransfer(address _to, uint256 _value, bytes _data) external view
returns(bytes1, bytes32)
```

**Returns**

byte Ethereum status code (ESC)

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _to | address | address The address which you want to transfer to | 
| _value | uint256 | uint256 the amount of tokens to be transferred | 
| _data | bytes | The `bytes _data` allows arbitrary data to be submitted alongside the transfer. | 

### canTransferFrom

⤾ overrides [IERC1594.canTransferFrom](IERC1594.md#cantransferfrom)

Transfers of securities may fail for a number of reasons. So this function will used to understand the
cause of failure by getting the byte value. Which will be the ESC that follows the EIP 1066. ESC can be mapped
with a reson string to understand the failure cause, table of Ethereum status code will always reside off-chain

```js
function canTransferFrom(address _from, address _to, uint256 _value, bytes _data) external view
returns(reasonCode bytes1, appCode bytes32)
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

### _canTransfer

```js
function _canTransfer(address _from, address _to, uint256 _value, bytes _data) internal view
returns(bytes1, bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _from | address |  | 
| _to | address |  | 
| _value | uint256 |  | 
| _data | bytes |  | 

### canTransferByPartition

⤾ overrides [IERC1410.canTransferByPartition](IERC1410.md#cantransferbypartition)

The standard provides an on-chain function to determine whether a transfer will succeed,
and return details indicating the reason if the transfer is not valid.

```js
function canTransferByPartition(address _from, address _to, bytes32 _partition, uint256 _value, bytes _data) external view
returns(reasonCode bytes1, appStatusCode bytes32, toPartition bytes32)
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

### setDocument

⤾ overrides [IERC1643.setDocument](IERC1643.md#setdocument)

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

⤾ overrides [IERC1643.removeDocument](IERC1643.md#removedocument)

Used to remove an existing document from the contract by giving the name of the document.

```js
function removeDocument(bytes32 _name) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _name | bytes32 | Name of the document. It should be unique always | 

### isControllable

⤾ overrides [IERC1644.isControllable](IERC1644.md#iscontrollable)

In order to provide transparency over whether `controllerTransfer` / `controllerRedeem` are useable
or not `isControllable` function will be used.

```js
function isControllable() public view
returns(bool)
```

**Returns**

bool `true` when controller address is non-zero otherwise return `false`.

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### controllerTransfer

⤾ overrides [IERC1644.controllerTransfer](IERC1644.md#controllertransfer)

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

⤾ overrides [IERC1644.controllerRedeem](IERC1644.md#controllerredeem)

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

### _implementation

⤾ overrides [Proxy._implementation](Proxy.md#_implementation)

```js
function _implementation() internal view
returns(address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### updateFromRegistry

```js
function updateFromRegistry() public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### owner

```js
function owner() public view
returns(address)
```

**Returns**

the address of the owner.

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### isOwner

```js
function isOwner() public view
returns(bool)
```

**Returns**

true if `msg.sender` is the owner of the contract.

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

### _transferOwnership

Transfers control of the contract to a newOwner.

```js
function _transferOwnership(address newOwner) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| newOwner | address | The address to transfer ownership to. | 

### _isSuccess

Check if a status code represents success (ie: 0x*1)

```js
function _isSuccess(bytes1 status) internal pure
returns(successful bool)
```

**Returns**

successful A boolean representing if the status code represents success

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| status | bytes1 | Binary ERC-1066 status code | 

