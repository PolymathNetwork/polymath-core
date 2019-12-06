---
id: version-3.0.0-UpgradableModuleFactory
title: UpgradableModuleFactory
original_id: UpgradableModuleFactory
---

# Factory for deploying upgradable modules (UpgradableModuleFactory.sol)

View Source: [contracts/modules/UpgradableModuleFactory.sol](../../contracts/modules/UpgradableModuleFactory.sol)

**↗ Extends: [ModuleFactory](ModuleFactory.md)**
**↘ Derived Contracts: [BlacklistTransferManagerFactory](BlacklistTransferManagerFactory.md), [CappedSTOFactory](CappedSTOFactory.md), [CountTransferManagerFactory](CountTransferManagerFactory.md), [DummySTOFactory](DummySTOFactory.md), [ERC20DividendCheckpointFactory](ERC20DividendCheckpointFactory.md), [EtherDividendCheckpointFactory](EtherDividendCheckpointFactory.md), [GeneralPermissionManagerFactory](GeneralPermissionManagerFactory.md), [GeneralTransferManagerFactory](GeneralTransferManagerFactory.md), [LockUpTransferManagerFactory](LockUpTransferManagerFactory.md), [ManualApprovalTransferManagerFactory](ManualApprovalTransferManagerFactory.md), [PercentageTransferManagerFactory](PercentageTransferManagerFactory.md), [PLCRVotingCheckpointFactory](PLCRVotingCheckpointFactory.md), [PreSaleSTOFactory](PreSaleSTOFactory.md), [RestrictedPartialSaleTMFactory](RestrictedPartialSaleTMFactory.md), [USDTieredSTOFactory](USDTieredSTOFactory.md), [VestingEscrowWalletFactory](VestingEscrowWalletFactory.md), [VolumeRestrictionTMFactory](VolumeRestrictionTMFactory.md), [WeightedVoteCheckpointFactory](WeightedVoteCheckpointFactory.md)**

**UpgradableModuleFactory**

## Structs
### LogicContract

```js
struct LogicContract {
 string version,
 address logicContract,
 bytes upgradeData
}
```

## Contract Members
**Constants & Variables**

```js
mapping(uint256 => struct UpgradableModuleFactory.LogicContract) public logicContracts;
mapping(address => mapping(address => uint256)) public modules;
mapping(address => address) public moduleToSecurityToken;
uint256 public latestUpgrade;

```

**Events**

```js
event LogicContractSet(string  _version, uint256  _upgrade, address  _logicContract, bytes  _upgradeData);
event ModuleUpgraded(address indexed _module, address indexed _securityToken, uint256 indexed _version);
```

## Functions

- [(string _version, uint256 _setupCost, address _logicContract, address _polymathRegistry, bool _isCostInPoly)](#)
- [setLogicContract(string _version, address _logicContract, bytes _upgradeData)](#setlogiccontract)
- [updateLogicContract(uint256 _upgrade, string _version, address _logicContract, bytes _upgradeData)](#updatelogiccontract)
- [_modifyLogicContract(uint256 _upgrade, string _version, address _logicContract, bytes _upgradeData)](#_modifylogiccontract)
- [upgrade(address _module)](#upgrade)
- [_initializeModule(address _module, bytes _data)](#_initializemodule)
- [version()](#version)

### 

Constructor

```js
function (string _version, uint256 _setupCost, address _logicContract, address _polymathRegistry, bool _isCostInPoly) public nonpayable ModuleFactory 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _version | string |  | 
| _setupCost | uint256 | Setup cost of the module | 
| _logicContract | address | Contract address that contains the logic related to `description` | 
| _polymathRegistry | address | Address of the Polymath registry | 
| _isCostInPoly | bool | true = cost in Poly, false = USD | 

### setLogicContract

Used to upgrade the module factory

```js
function setLogicContract(string _version, address _logicContract, bytes _upgradeData) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _version | string | Version of upgraded module | 
| _logicContract | address | Address of deployed module logic contract referenced from proxy | 
| _upgradeData | bytes | Data to be passed in call to upgradeToAndCall when a token upgrades its module | 

### updateLogicContract

Used to update an existing token logic contract

```js
function updateLogicContract(uint256 _upgrade, string _version, address _logicContract, bytes _upgradeData) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _upgrade | uint256 | logic contract to upgrade | 
| _version | string | Version of upgraded module | 
| _logicContract | address | Address of deployed module logic contract referenced from proxy | 
| _upgradeData | bytes | Data to be passed in call to upgradeToAndCall when a token upgrades its module | 

### _modifyLogicContract

```js
function _modifyLogicContract(uint256 _upgrade, string _version, address _logicContract, bytes _upgradeData) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _upgrade | uint256 |  | 
| _version | string |  | 
| _logicContract | address |  | 
| _upgradeData | bytes |  | 

### upgrade

Used by a security token to upgrade a given module

```js
function upgrade(address _module) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _module | address | Address of (proxy) module to be upgraded | 

### _initializeModule

⤾ overrides [ModuleFactory._initializeModule](ModuleFactory.md#_initializemodule)

Used to initialize the module

```js
function _initializeModule(address _module, bytes _data) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _module | address | Address of module | 
| _data | bytes | Data used for the intialization of the module factory variables | 

### version

⤾ overrides [ModuleFactory.version](ModuleFactory.md#version)

Get the version related to the module factory

```js
function version() external view
returns(string)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

