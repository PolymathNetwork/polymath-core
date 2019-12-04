---
id: version-3.0.0-STFactory
title: STFactory
original_id: STFactory
---

# Proxy for deploying SecurityToken instances (STFactory.sol)

View Source: [contracts/tokens/STFactory.sol](../../contracts/tokens/STFactory.sol)

**↗ Extends: [ISTFactory](ISTFactory.md), [Ownable](Ownable.md)**

**STFactory**

## Structs
### LogicContract

```js
struct LogicContract {
 string version,
 address logicContract,
 bytes initializationData,
 bytes upgradeData
}
```

## Contract Members
**Constants & Variables**

```js
//public members
address public transferManagerFactory;
contract DataStoreFactory public dataStoreFactory;
contract IPolymathRegistry public polymathRegistry;
uint256 public latestUpgrade;

//internal members
mapping(address => uint256) internal tokenUpgrade;
mapping(uint256 => struct STFactory.LogicContract) internal logicContracts;

```

**Events**

```js
event LogicContractSet(string  _version, uint256  _upgrade, address  _logicContract, bytes  _initializationData, bytes  _upgradeData);
event TokenUpgraded(address indexed _securityToken, uint256 indexed _version);
event DefaultTransferManagerUpdated(address indexed _oldTransferManagerFactory, address indexed _newTransferManagerFactory);
event DefaultDataStoreUpdated(address indexed _oldDataStoreFactory, address indexed _newDataStoreFactory);
```

## Functions

- [(address _polymathRegistry, address _transferManagerFactory, address _dataStoreFactory, string _version, address _logicContract, bytes _initializationData)](#)
- [deployToken(string _name, string _symbol, uint8 _decimals, string _tokenDetails, address _issuer, bool _divisible, address _treasuryWallet)](#deploytoken)
- [_deploy(string _name, string _symbol, uint8 _decimals, string _tokenDetails, bool _divisible)](#_deploy)
- [setLogicContract(string _version, address _logicContract, bytes _initializationData, bytes _upgradeData)](#setlogiccontract)
- [updateLogicContract(uint256 _upgrade, string _version, address _logicContract, bytes _initializationData, bytes _upgradeData)](#updatelogiccontract)
- [_modifyLogicContract(uint256 _upgrade, string _version, address _logicContract, bytes _initializationData, bytes _upgradeData)](#_modifylogiccontract)
- [upgradeToken(uint8 _maxModuleType)](#upgradetoken)
- [updateDefaultTransferManager(address _transferManagerFactory)](#updatedefaulttransfermanager)
- [updateDefaultDataStore(address _dataStoreFactory)](#updatedefaultdatastore)

### 

```js
function (address _polymathRegistry, address _transferManagerFactory, address _dataStoreFactory, string _version, address _logicContract, bytes _initializationData) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _polymathRegistry | address |  | 
| _transferManagerFactory | address |  | 
| _dataStoreFactory | address |  | 
| _version | string |  | 
| _logicContract | address |  | 
| _initializationData | bytes |  | 

### deployToken

⤾ overrides [ISTFactory.deployToken](ISTFactory.md#deploytoken)

deploys the token and adds default modules like the GeneralTransferManager.
Future versions of the proxy can attach different modules or pass different parameters.

```js
function deployToken(string _name, string _symbol, uint8 _decimals, string _tokenDetails, address _issuer, bool _divisible, address _treasuryWallet) external nonpayable
returns(address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _name | string |  | 
| _symbol | string |  | 
| _decimals | uint8 |  | 
| _tokenDetails | string |  | 
| _issuer | address |  | 
| _divisible | bool |  | 
| _treasuryWallet | address |  | 

### _deploy

```js
function _deploy(string _name, string _symbol, uint8 _decimals, string _tokenDetails, bool _divisible) internal nonpayable
returns(address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _name | string |  | 
| _symbol | string |  | 
| _decimals | uint8 |  | 
| _tokenDetails | string |  | 
| _divisible | bool |  | 

### setLogicContract

⤾ overrides [ISTFactory.setLogicContract](ISTFactory.md#setlogiccontract)

Used to set a new token logic contract

```js
function setLogicContract(string _version, address _logicContract, bytes _initializationData, bytes _upgradeData) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _version | string | Version of upgraded module | 
| _logicContract | address | Address of deployed module logic contract referenced from proxy | 
| _initializationData | bytes | Initialization data that used to intialize value in the securityToken | 
| _upgradeData | bytes | Data to be passed in call to upgradeToAndCall when a token upgrades its module | 

### updateLogicContract

Used to update an existing token logic contract

```js
function updateLogicContract(uint256 _upgrade, string _version, address _logicContract, bytes _initializationData, bytes _upgradeData) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _upgrade | uint256 | logic contract to upgrade | 
| _version | string | Version of upgraded module | 
| _logicContract | address | Address of deployed module logic contract referenced from proxy | 
| _initializationData | bytes |  | 
| _upgradeData | bytes | Data to be passed in call to upgradeToAndCall when a token upgrades its module | 

### _modifyLogicContract

```js
function _modifyLogicContract(uint256 _upgrade, string _version, address _logicContract, bytes _initializationData, bytes _upgradeData) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _upgrade | uint256 |  | 
| _version | string |  | 
| _logicContract | address |  | 
| _initializationData | bytes |  | 
| _upgradeData | bytes |  | 

### upgradeToken

⤾ overrides [ISTFactory.upgradeToken](ISTFactory.md#upgradetoken)

Used to upgrade a token

```js
function upgradeToken(uint8 _maxModuleType) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _maxModuleType | uint8 | maximum module type enumeration | 

### updateDefaultTransferManager

⤾ overrides [ISTFactory.updateDefaultTransferManager](ISTFactory.md#updatedefaulttransfermanager)

Used to set a new default transfer manager

```js
function updateDefaultTransferManager(address _transferManagerFactory) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _transferManagerFactory | address | Address of new default transfer manager factory | 

### updateDefaultDataStore

⤾ overrides [ISTFactory.updateDefaultDataStore](ISTFactory.md#updatedefaultdatastore)

Used to set a new default data store

```js
function updateDefaultDataStore(address _dataStoreFactory) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _dataStoreFactory | address | Address of new default data store factory | 

