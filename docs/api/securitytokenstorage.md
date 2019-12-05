---
id: version-3.0.0-SecurityTokenStorage
title: SecurityTokenStorage
original_id: SecurityTokenStorage
---

# SecurityTokenStorage.sol

View Source: [contracts/tokens/SecurityTokenStorage.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/tokens/SecurityTokenStorage.sol)

**↘ Derived Contracts:** [**SecurityToken**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/SecurityToken.md)**,** [**SecurityTokenProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/SecurityTokenProxy.md)**,** [**STGetter**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/STGetter.md)

**SecurityTokenStorage**

## Structs

### Document

```javascript
struct Document {
 bytes32 docHash,
 uint256 lastModified,
 string uri
}
```

### SemanticVersion

```javascript
struct SemanticVersion {
 uint8 major,
 uint8 minor,
 uint8 patch
}
```

### ModuleData

```javascript
struct ModuleData {
 bytes32 name,
 address module,
 address moduleFactory,
 bool isArchived,
 uint8[] moduleTypes,
 uint256[] moduleIndexes,
 uint256 nameIndex,
 bytes32 label
}
```

### Checkpoint

```javascript
struct Checkpoint {
 uint256 checkpointId,
 uint256 value
}
```

## Contract Members

**Constants & Variables**

```javascript
//internal members
uint8 internal constant PERMISSION_KEY;
uint8 internal constant TRANSFER_KEY;
uint8 internal constant MINT_KEY;
uint8 internal constant CHECKPOINT_KEY;
uint8 internal constant BURN_KEY;
uint8 internal constant DATA_KEY;
uint8 internal constant WALLET_KEY;
bytes32 internal constant INVESTORSKEY;
bytes32 internal constant TREASURY;
bytes32 internal constant LOCKED;
bytes32 internal constant UNLOCKED;
address internal _owner;
bool internal issuance;
bytes32[] internal _docNames;
uint256[] internal checkpointTimes;
struct SecurityTokenStorage.SemanticVersion internal securityTokenVersion;
mapping(uint8 => address[]) internal modules;
mapping(address => struct SecurityTokenStorage.ModuleData) internal modulesToData;
mapping(bytes32 => address[]) internal names;
mapping(uint256 => uint256) internal checkpointTotalSupply;
mapping(address => struct SecurityTokenStorage.Checkpoint[]) internal checkpointBalances;
mapping(bytes32 => struct SecurityTokenStorage.Document) internal _documents;
mapping(bytes32 => uint256) internal _docIndexes;
mapping(address => mapping(bytes32 => mapping(address => bool))) internal partitionApprovals;

//public members
address public tokenFactory;
bool public initialized;
string public name;
string public symbol;
uint8 public decimals;
address public controller;
contract IPolymathRegistry public polymathRegistry;
contract IModuleRegistry public moduleRegistry;
contract ISecurityTokenRegistry public securityTokenRegistry;
contract IERC20 public polyToken;
address public getterDelegate;
contract IDataStore public dataStore;
uint256 public granularity;
uint256 public currentCheckpointId;
string public tokenDetails;
bool public controllerDisabled;
bool public transfersFrozen;
uint256 public holderCount;
```

## Functions

