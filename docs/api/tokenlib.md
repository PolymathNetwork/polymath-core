---
id: version-3.0.0-TokenLib
title: TokenLib
original_id: TokenLib
---

# TokenLib.sol

View Source: [contracts/libraries/TokenLib.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/libraries/TokenLib.sol)

**TokenLib**

## Structs

### EIP712Domain

```javascript
struct EIP712Domain {
 string name,
 uint256 chainId,
 address verifyingContract
}
```

### Acknowledgment

```javascript
struct Acknowledgment {
 string text
}
```

## Contract Members

**Constants & Variables**

```javascript
bytes32 internal constant EIP712DOMAIN_TYPEHASH;
bytes32 internal constant ACK_TYPEHASH;
bytes32 internal constant WHITELIST;
bytes32 internal constant INVESTORSKEY;
```

**Events**

```javascript
event ModuleUpgraded(uint8[]  _types, address  _module);
event ModuleArchived(uint8[]  _types, address  _module);
event ModuleUnarchived(uint8[]  _types, address  _module);
event ModuleRemoved(uint8[]  _types, address  _module);
event ModuleBudgetChanged(uint8[]  _moduleTypes, address  _module, uint256  _oldBudget, uint256  _budget);
event DocumentUpdated(bytes32 indexed _name, string  _uri, bytes32  _documentHash);
event DocumentRemoved(bytes32 indexed _name, string  _uri, bytes32  _documentHash);
```

## Functions

* [hash\(struct TokenLib.EIP712Domain \_eip712Domain\)](tokenlib.md#hash)
* [hash\(struct TokenLib.Acknowledgment \_ack\)](tokenlib.md#hash)
* [recoverFreezeIssuanceAckSigner\(bytes \_signature\)](tokenlib.md#recoverfreezeissuanceacksigner)
* [recoverDisableControllerAckSigner\(bytes \_signature\)](tokenlib.md#recoverdisablecontrolleracksigner)
* [extractSigner\(struct TokenLib.Acknowledgment \_ack, bytes \_signature\)](tokenlib.md#extractsigner)
* [archiveModule\(struct SecurityTokenStorage.ModuleData \_moduleData\)](tokenlib.md#archivemodule)
* [unarchiveModule\(IModuleRegistry \_moduleRegistry, struct SecurityTokenStorage.ModuleData \_moduleData\)](tokenlib.md#unarchivemodule)
* [upgradeModule\(IModuleRegistry \_moduleRegistry, struct SecurityTokenStorage.ModuleData \_moduleData\)](tokenlib.md#upgrademodule)
* [removeModule\(address \_module, mapping\(uint8 =&gt; address\[\]\) \_modules, mapping\(address =&gt; struct SecurityTokenStorage.ModuleData\) \_modulesToData, mapping\(bytes32 =&gt; address\[\]\) \_names\)](tokenlib.md#removemodule)
* [\_removeModuleWithIndex\(uint8 \_type, uint256 \_index, mapping\(uint8 =&gt; address\[\]\) \_modules, mapping\(address =&gt; struct SecurityTokenStorage.ModuleData\) \_modulesToData\)](tokenlib.md#_removemodulewithindex)
* [changeModuleBudget\(address \_module, uint256 \_change, bool \_increase, IERC20 \_polyToken, mapping\(address =&gt; struct SecurityTokenStorage.ModuleData\) \_modulesToData\)](tokenlib.md#changemodulebudget)
* [getValueAt\(struct SecurityTokenStorage.Checkpoint\[\] \_checkpoints, uint256 \_checkpointId, uint256 \_currentValue\)](tokenlib.md#getvalueat)
* [adjustCheckpoints\(struct SecurityTokenStorage.Checkpoint\[\] \_checkpoints, uint256 \_newValue, uint256 \_currentCheckpointId\)](tokenlib.md#adjustcheckpoints)
* [adjustInvestorCount\(uint256 \_holderCount, address \_from, address \_to, uint256 \_value, uint256 \_balanceTo, uint256 \_balanceFrom, IDataStore \_dataStore\)](tokenlib.md#adjustinvestorcount)
* [setDocument\(mapping\(bytes32 =&gt; struct SecurityTokenStorage.Document\) document, bytes32\[\] docNames, mapping\(bytes32 =&gt; uint256\) docIndexes, bytes32 name, string uri, bytes32 documentHash\)](tokenlib.md#setdocument)
* [removeDocument\(mapping\(bytes32 =&gt; struct SecurityTokenStorage.Document\) document, bytes32\[\] docNames, mapping\(bytes32 =&gt; uint256\) docIndexes, bytes32 name\)](tokenlib.md#removedocument)
* [verifyTransfer\(address\[\] modules, mapping\(address =&gt; struct SecurityTokenStorage.ModuleData\) modulesToData, address from, address to, uint256 value, bytes data, bool transfersFrozen\)](tokenlib.md#verifytransfer)
* [canTransfer\(bool success, bytes32 appCode, address to, uint256 value, uint256 balanceOfFrom\)](tokenlib.md#cantransfer)
* [\_getKey\(bytes32 \_key1, address \_key2\)](tokenlib.md#_getkey)
* [\_isExistingInvestor\(address \_investor, IDataStore dataStore\)](tokenlib.md#_isexistinginvestor)

### hash

```javascript
function hash(struct TokenLib.EIP712Domain _eip712Domain) internal pure
returns(bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_eip712Domain | struct TokenLib.EIP712Domain |  |

### hash

```javascript
function hash(struct TokenLib.Acknowledgment _ack) internal pure
returns(bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_ack | struct TokenLib.Acknowledgment |  |

### recoverFreezeIssuanceAckSigner

```javascript
function recoverFreezeIssuanceAckSigner(bytes _signature) external view
returns(address)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_signature | bytes |  |

### recoverDisableControllerAckSigner

```javascript
function recoverDisableControllerAckSigner(bytes _signature) external view
returns(address)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_signature | bytes |  |

### extractSigner

```javascript
function extractSigner(struct TokenLib.Acknowledgment _ack, bytes _signature) internal view
returns(address)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_ack | struct TokenLib.Acknowledgment |  |
| \_signature | bytes |  |

### archiveModule

Archives a module attached to the SecurityToken

```javascript
function archiveModule(struct SecurityTokenStorage.ModuleData _moduleData) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_moduleData | struct SecurityTokenStorage.ModuleData | Storage data |

### unarchiveModule

Unarchives a module attached to the SecurityToken

```javascript
function unarchiveModule(IModuleRegistry _moduleRegistry, struct SecurityTokenStorage.ModuleData _moduleData) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_moduleRegistry | IModuleRegistry |  |
| \_moduleData | struct SecurityTokenStorage.ModuleData | Storage data |

### upgradeModule

Upgrades a module attached to the SecurityToken

```javascript
function upgradeModule(IModuleRegistry _moduleRegistry, struct SecurityTokenStorage.ModuleData _moduleData) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_moduleRegistry | IModuleRegistry |  |
| \_moduleData | struct SecurityTokenStorage.ModuleData | Storage data |

### removeModule

Removes a module attached to the SecurityToken

```javascript
function removeModule(address _module, mapping(uint8 => address[]) _modules, mapping(address => struct SecurityTokenStorage.ModuleData) _modulesToData, mapping(bytes32 => address[]) _names) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_module | address | address of module to unarchive |
| \_modules | mapping\(uint8 =&gt; address\[\]\) |  |
| \_modulesToData | mapping\(address =&gt; struct SecurityTokenStorage.ModuleData\) |  |
| \_names | mapping\(bytes32 =&gt; address\[\]\) |  |

### \_removeModuleWithIndex

Internal - Removes a module attached to the SecurityToken by index

```javascript
function _removeModuleWithIndex(uint8 _type, uint256 _index, mapping(uint8 => address[]) _modules, mapping(address => struct SecurityTokenStorage.ModuleData) _modulesToData) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_type | uint8 |  |
| \_index | uint256 |  |
| \_modules | mapping\(uint8 =&gt; address\[\]\) |  |
| \_modulesToData | mapping\(address =&gt; struct SecurityTokenStorage.ModuleData\) |  |

### changeModuleBudget

allows owner to increase/decrease POLY approval of one of the modules

```javascript
function changeModuleBudget(address _module, uint256 _change, bool _increase, IERC20 _polyToken, mapping(address => struct SecurityTokenStorage.ModuleData) _modulesToData) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_module | address | module address |
| \_change | uint256 | change in allowance |
| \_increase | bool | true if budget has to be increased, false if decrease |
| \_polyToken | IERC20 |  |
| \_modulesToData | mapping\(address =&gt; struct SecurityTokenStorage.ModuleData\) |  |

### getValueAt

Queries a value at a defined checkpoint

```javascript
function getValueAt(struct SecurityTokenStorage.Checkpoint[] _checkpoints, uint256 _checkpointId, uint256 _currentValue) external view
returns(uint256)
```

**Returns**

uint256

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_checkpoints | struct SecurityTokenStorage.Checkpoint\[\] | is array of Checkpoint objects |
| \_checkpointId | uint256 | is the Checkpoint ID to query |
| \_currentValue | uint256 | is the Current value of checkpoint |

### adjustCheckpoints

Stores the changes to the checkpoint objects

```javascript
function adjustCheckpoints(struct SecurityTokenStorage.Checkpoint[] _checkpoints, uint256 _newValue, uint256 _currentCheckpointId) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_checkpoints | struct SecurityTokenStorage.Checkpoint\[\] | is the affected checkpoint object array |
| \_newValue | uint256 | is the new value that needs to be stored |
| \_currentCheckpointId | uint256 |  |

### adjustInvestorCount

Keeps track of the number of non-zero token holders

```javascript
function adjustInvestorCount(uint256 _holderCount, address _from, address _to, uint256 _value, uint256 _balanceTo, uint256 _balanceFrom, IDataStore _dataStore) external nonpayable
returns(uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_holderCount | uint256 | Number of current token holders |
| \_from | address | Sender of transfer |
| \_to | address | Receiver of transfer |
| \_value | uint256 | Value of transfer |
| \_balanceTo | uint256 | Balance of the \_to address |
| \_balanceFrom | uint256 | Balance of the \_from address |
| \_dataStore | IDataStore | address of data store |

### setDocument

Used to attach a new document to the contract, or update the URI or hash of an existing attached document

```javascript
function setDocument(mapping(bytes32 => struct SecurityTokenStorage.Document) document, bytes32[] docNames, mapping(bytes32 => uint256) docIndexes, bytes32 name, string uri, bytes32 documentHash) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| document | mapping\(bytes32 =&gt; struct SecurityTokenStorage.Document\) | Hash hash \(of the contents\) of the document. |
| docNames | bytes32\[\] |  |
| docIndexes | mapping\(bytes32 =&gt; uint256\) |  |
| name | bytes32 | Name of the document. It should be unique always |
| uri | string | Off-chain uri of the document from where it is accessible to investors/advisors to read. |
| documentHash | bytes32 | hash \(of the contents\) of the document. |

### removeDocument

Used to remove an existing document from the contract by giving the name of the document.

```javascript
function removeDocument(mapping(bytes32 => struct SecurityTokenStorage.Document) document, bytes32[] docNames, mapping(bytes32 => uint256) docIndexes, bytes32 name) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| document | mapping\(bytes32 =&gt; struct SecurityTokenStorage.Document\) |  |
| docNames | bytes32\[\] |  |
| docIndexes | mapping\(bytes32 =&gt; uint256\) |  |
| name | bytes32 | Name of the document. It should be unique always |

### verifyTransfer

Validate transfer with TransferManager module if it exists

```javascript
function verifyTransfer(address[] modules, mapping(address => struct SecurityTokenStorage.ModuleData) modulesToData, address from, address to, uint256 value, bytes data, bool transfersFrozen) public view
returns(bool, bytes32)
```

**Returns**

bool

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| modules | address\[\] | Array of addresses for transfer managers |
| modulesToData | mapping\(address =&gt; struct SecurityTokenStorage.ModuleData\) | Mapping of the modules details |
| from | address | sender of transfer |
| to | address | receiver of transfer |
| value | uint256 | value of transfer |
| data | bytes | data to indicate validation |
| transfersFrozen | bool | whether the transfer are frozen or not. |

### canTransfer

```javascript
function canTransfer(bool success, bytes32 appCode, address to, uint256 value, uint256 balanceOfFrom) external pure
returns(bytes1, bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| success | bool |  |
| appCode | bytes32 |  |
| to | address |  |
| value | uint256 |  |
| balanceOfFrom | uint256 |  |

### \_getKey

```javascript
function _getKey(bytes32 _key1, address _key2) internal pure
returns(bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_key1 | bytes32 |  |
| \_key2 | address |  |

### \_isExistingInvestor

```javascript
function _isExistingInvestor(address _investor, IDataStore dataStore) internal view
returns(bool)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_investor | address |  |
| dataStore | IDataStore |  |

