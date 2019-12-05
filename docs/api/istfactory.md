---
id: version-3.0.0-ISTFactory
title: ISTFactory
original_id: ISTFactory
---

# Interface for security token proxy deployment \(ISTFactory.sol\)

View Source: [contracts/interfaces/ISTFactory.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/interfaces/ISTFactory.sol)

**↘ Derived Contracts:** [**STFactory**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/STFactory.md)

**ISTFactory**

**Events**

```javascript
event LogicContractSet(string  _version, address  _logicContract, bytes  _upgradeData);
event TokenUpgraded(address indexed _securityToken, uint256 indexed _version);
event DefaultTransferManagerUpdated(address indexed _oldTransferManagerFactory, address indexed _newTransferManagerFactory);
event DefaultDataStoreUpdated(address indexed _oldDataStoreFactory, address indexed _newDataStoreFactory);
```

## Functions

* [deployToken\(string \_name, string \_symbol, uint8 \_decimals, string \_tokenDetails, address \_issuer, bool \_divisible, address \_treasuryWallet\)](istfactory.md#deploytoken)
* [setLogicContract\(string \_version, address \_logicContract, bytes \_initializationData, bytes \_upgradeData\)](istfactory.md#setlogiccontract)
* [upgradeToken\(uint8 \_maxModuleType\)](istfactory.md#upgradetoken)
* [updateDefaultTransferManager\(address \_transferManagerFactory\)](istfactory.md#updatedefaulttransfermanager)
* [updateDefaultDataStore\(address \_dataStoreFactory\)](istfactory.md#updatedefaultdatastore)

### deployToken

⤿ Overridden Implementation\(s\): [STFactory.deployToken](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/STFactory.md#deploytoken)

Deploys the token and adds default modules like permission manager and transfer manager. Future versions of the proxy can attach different modules or pass some other paramters.

```javascript
function deployToken(string _name, string _symbol, uint8 _decimals, string _tokenDetails, address _issuer, bool _divisible, address _treasuryWallet) external nonpayable
returns(tokenAddress address)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_name | string | is the name of the Security token |
| \_symbol | string | is the symbol of the Security Token |
| \_decimals | uint8 | is the number of decimals of the Security Token |
| \_tokenDetails | string | is the off-chain data associated with the Security Token |
| \_issuer | address | is the owner of the Security Token |
| \_divisible | bool | whether the token is divisible or not |
| \_treasuryWallet | address | Ethereum address which will holds the STs. |

### setLogicContract

⤿ Overridden Implementation\(s\): [STFactory.setLogicContract](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/STFactory.md#setlogiccontract)

Used to set a new token logic contract

```javascript
function setLogicContract(string _version, address _logicContract, bytes _initializationData, bytes _upgradeData) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_version | string | Version of upgraded module |
| \_logicContract | address | Address of deployed module logic contract referenced from proxy |
| \_initializationData | bytes | Initialization data that used to intialize value in the securityToken |
| \_upgradeData | bytes | Data to be passed in call to upgradeToAndCall when a token upgrades its module |

### upgradeToken

⤿ Overridden Implementation\(s\): [STFactory.upgradeToken](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/STFactory.md#upgradetoken)

Used to upgrade a token

```javascript
function upgradeToken(uint8 _maxModuleType) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_maxModuleType | uint8 | maximum module type enumeration |

### updateDefaultTransferManager

⤿ Overridden Implementation\(s\): [STFactory.updateDefaultTransferManager](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/STFactory.md#updatedefaulttransfermanager)

Used to set a new default transfer manager

```javascript
function updateDefaultTransferManager(address _transferManagerFactory) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_transferManagerFactory | address | Address of new default transfer manager factory |

### updateDefaultDataStore

⤿ Overridden Implementation\(s\): [STFactory.updateDefaultDataStore](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/STFactory.md#updatedefaultdatastore)

Used to set a new default data store

```javascript
function updateDefaultDataStore(address _dataStoreFactory) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_dataStoreFactory | address | Address of new default data store factory |

