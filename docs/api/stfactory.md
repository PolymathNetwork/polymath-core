---
id: version-3.0.0-STFactory
title: STFactory
original_id: STFactory
---

# Proxy for deploying SecurityToken instances \(STFactory.sol\)

View Source: [contracts/tokens/STFactory.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/tokens/STFactory.sol)

**↗ Extends:** [**ISTFactory**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ISTFactory.md)**,** [**Ownable**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/Ownable.md)

**STFactory**

## Structs

### LogicContract

```javascript
struct LogicContract {
 string version,
 address logicContract,
 bytes initializationData,
 bytes upgradeData
}
```

## Contract Members

**Constants & Variables**

```javascript
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

```javascript
event LogicContractSet(string  _version, uint256  _upgrade, address  _logicContract, bytes  _initializationData, bytes  _upgradeData);
event TokenUpgraded(address indexed _securityToken, uint256 indexed _version);
event DefaultTransferManagerUpdated(address indexed _oldTransferManagerFactory, address indexed _newTransferManagerFactory);
event DefaultDataStoreUpdated(address indexed _oldDataStoreFactory, address indexed _newDataStoreFactory);
```

## Functions

* [\(address \_polymathRegistry, address \_transferManagerFactory, address \_dataStoreFactory, string \_version, address \_logicContract, bytes \_initializationData\)](stfactory.md)
* [deployToken\(string \_name, string \_symbol, uint8 \_decimals, string \_tokenDetails, address \_issuer, bool \_divisible, address \_treasuryWallet\)](stfactory.md#deploytoken)
* [\_deploy\(string \_name, string \_symbol, uint8 \_decimals, string \_tokenDetails, bool \_divisible\)](stfactory.md#_deploy)
* [setLogicContract\(string \_version, address \_logicContract, bytes \_initializationData, bytes \_upgradeData\)](stfactory.md#setlogiccontract)
* [updateLogicContract\(uint256 \_upgrade, string \_version, address \_logicContract, bytes \_initializationData, bytes \_upgradeData\)](stfactory.md#updatelogiccontract)
* [\_modifyLogicContract\(uint256 \_upgrade, string \_version, address \_logicContract, bytes \_initializationData, bytes \_upgradeData\)](stfactory.md#_modifylogiccontract)
* [upgradeToken\(uint8 \_maxModuleType\)](stfactory.md#upgradetoken)
* [updateDefaultTransferManager\(address \_transferManagerFactory\)](stfactory.md#updatedefaulttransfermanager)
* [updateDefaultDataStore\(address \_dataStoreFactory\)](stfactory.md#updatedefaultdatastore)

```javascript
function (address _polymathRegistry, address _transferManagerFactory, address _dataStoreFactory, string _version, address _logicContract, bytes _initializationData) public nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_polymathRegistry | address |  |
| \_transferManagerFactory | address |  |
| \_dataStoreFactory | address |  |
| \_version | string |  |
| \_logicContract | address |  |
| \_initializationData | bytes |  |

### deployToken

⤾ overrides [ISTFactory.deployToken](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ISTFactory.md#deploytoken)

deploys the token and adds default modules like the GeneralTransferManager. Future versions of the proxy can attach different modules or pass different parameters.

```javascript
function deployToken(string _name, string _symbol, uint8 _decimals, string _tokenDetails, address _issuer, bool _divisible, address _treasuryWallet) external nonpayable
returns(address)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_name | string |  |
| \_symbol | string |  |
| \_decimals | uint8 |  |
| \_tokenDetails | string |  |
| \_issuer | address |  |
| \_divisible | bool |  |
| \_treasuryWallet | address |  |

### \_deploy

```javascript
function _deploy(string _name, string _symbol, uint8 _decimals, string _tokenDetails, bool _divisible) internal nonpayable
returns(address)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_name | string |  |
| \_symbol | string |  |
| \_decimals | uint8 |  |
| \_tokenDetails | string |  |
| \_divisible | bool |  |

### setLogicContract

⤾ overrides [ISTFactory.setLogicContract](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ISTFactory.md#setlogiccontract)

Used to set a new token logic contract

```javascript
function setLogicContract(string _version, address _logicContract, bytes _initializationData, bytes _upgradeData) external nonpayable onlyOwner
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_version | string | Version of upgraded module |
| \_logicContract | address | Address of deployed module logic contract referenced from proxy |
| \_initializationData | bytes | Initialization data that used to intialize value in the securityToken |
| \_upgradeData | bytes | Data to be passed in call to upgradeToAndCall when a token upgrades its module |

### updateLogicContract

Used to update an existing token logic contract

```javascript
function updateLogicContract(uint256 _upgrade, string _version, address _logicContract, bytes _initializationData, bytes _upgradeData) external nonpayable onlyOwner
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_upgrade | uint256 | logic contract to upgrade |
| \_version | string | Version of upgraded module |
| \_logicContract | address | Address of deployed module logic contract referenced from proxy |
| \_initializationData | bytes |  |
| \_upgradeData | bytes | Data to be passed in call to upgradeToAndCall when a token upgrades its module |

### \_modifyLogicContract

```javascript
function _modifyLogicContract(uint256 _upgrade, string _version, address _logicContract, bytes _initializationData, bytes _upgradeData) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_upgrade | uint256 |  |
| \_version | string |  |
| \_logicContract | address |  |
| \_initializationData | bytes |  |
| \_upgradeData | bytes |  |

### upgradeToken

⤾ overrides [ISTFactory.upgradeToken](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ISTFactory.md#upgradetoken)

Used to upgrade a token

```javascript
function upgradeToken(uint8 _maxModuleType) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_maxModuleType | uint8 | maximum module type enumeration |

### updateDefaultTransferManager

⤾ overrides [ISTFactory.updateDefaultTransferManager](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ISTFactory.md#updatedefaulttransfermanager)

Used to set a new default transfer manager

```javascript
function updateDefaultTransferManager(address _transferManagerFactory) external nonpayable onlyOwner
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_transferManagerFactory | address | Address of new default transfer manager factory |

### updateDefaultDataStore

⤾ overrides [ISTFactory.updateDefaultDataStore](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ISTFactory.md#updatedefaultdatastore)

Used to set a new default data store

```javascript
function updateDefaultDataStore(address _dataStoreFactory) external nonpayable onlyOwner
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_dataStoreFactory | address | Address of new default data store factory |

