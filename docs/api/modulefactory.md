---
id: version-3.0.0-ModuleFactory
title: ModuleFactory
original_id: ModuleFactory
---

# Interface that any module factory contract should implement \(ModuleFactory.sol\)

View Source: [contracts/modules/ModuleFactory.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/modules/ModuleFactory.sol)

**↗ Extends:** [**IModuleFactory**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModuleFactory.md)**,** [**Ownable**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/Ownable.md) **↘ Derived Contracts:** [**KYCTransferManagerFactory**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/KYCTransferManagerFactory.md)**,** [**ScheduledCheckpointFactory**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ScheduledCheckpointFactory.md)**,** [**SignedTransferManagerFactory**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/SignedTransferManagerFactory.md)**,** [**TrackedRedemptionFactory**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/TrackedRedemptionFactory.md)**,** [**UpgradableModuleFactory**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/UpgradableModuleFactory.md)

**ModuleFactory**

Contract is abstract

## Contract Members

**Constants & Variables**

```javascript
//public members
contract IPolymathRegistry public polymathRegistry;
bytes32 public name;
string public title;
string public description;
bool public isCostInPoly;
uint256 public setupCost;

//internal members
string internal initialVersion;
uint8[] internal typesData;
bytes32[] internal tagsData;
string internal constant POLY_ORACLE;
mapping(string => uint24) internal compatibleSTVersionRange;
```

## Functions

* [\(uint256 \_setupCost, address \_polymathRegistry, bool \_isCostInPoly\)](modulefactory.md)
* [getTypes\(\)](modulefactory.md#gettypes)
* [getTags\(\)](modulefactory.md#gettags)
* [version\(\)](modulefactory.md#version)
* [changeSetupCost\(uint256 \_setupCost\)](modulefactory.md#changesetupcost)
* [changeCostAndType\(uint256 \_setupCost, bool \_isCostInPoly\)](modulefactory.md#changecostandtype)
* [changeTitle\(string \_title\)](modulefactory.md#changetitle)
* [changeDescription\(string \_description\)](modulefactory.md#changedescription)
* [changeName\(bytes32 \_name\)](modulefactory.md#changename)
* [changeTags\(bytes32\[\] \_tagsData\)](modulefactory.md#changetags)
* [changeSTVersionBounds\(string \_boundType, uint8\[\] \_newVersion\)](modulefactory.md#changestversionbounds)
* [getLowerSTVersionBounds\(\)](modulefactory.md#getlowerstversionbounds)
* [getUpperSTVersionBounds\(\)](modulefactory.md#getupperstversionbounds)
* [setupCostInPoly\(\)](modulefactory.md#setupcostinpoly)
* [\_takeFee\(\)](modulefactory.md#_takefee)
* [\_initializeModule\(address \_module, bytes \_data\)](modulefactory.md#_initializemodule)

Constructor

```javascript
function (uint256 _setupCost, address _polymathRegistry, bool _isCostInPoly) public nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_setupCost | uint256 |  |
| \_polymathRegistry | address |  |
| \_isCostInPoly | bool |  |

### getTypes

⤾ overrides [IModuleFactory.getTypes](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModuleFactory.md#gettypes)

⤿ Overridden Implementation\(s\): [MockFactory.getTypes](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/MockFactory.md#gettypes),[MockWrongTypeFactory.getTypes](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/MockWrongTypeFactory.md#gettypes)

Type of the Module factory

```javascript
function getTypes() external view
returns(uint8[])
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### getTags

⤾ overrides [IModuleFactory.getTags](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModuleFactory.md#gettags)

⤿ Overridden Implementation\(s\): [TestSTOFactory.getTags](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/TestSTOFactory.md#gettags)

Get the tags related to the module factory

```javascript
function getTags() external view
returns(bytes32[])
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### version

⤾ overrides [IModuleFactory.version](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModuleFactory.md#version)

⤿ Overridden Implementation\(s\): [UpgradableModuleFactory.version](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/UpgradableModuleFactory.md#version)

Get the version related to the module factory

```javascript
function version() external view
returns(string)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### changeSetupCost

⤾ overrides [IModuleFactory.changeSetupCost](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModuleFactory.md#changesetupcost)

Used to change the fee of the setup cost

```javascript
function changeSetupCost(uint256 _setupCost) public nonpayable onlyOwner
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_setupCost | uint256 | new setup cost |

### changeCostAndType

⤾ overrides [IModuleFactory.changeCostAndType](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModuleFactory.md#changecostandtype)

Used to change the currency and amount of setup cost

```javascript
function changeCostAndType(uint256 _setupCost, bool _isCostInPoly) public nonpayable onlyOwner
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_setupCost | uint256 | new setup cost |
| \_isCostInPoly | bool | new setup cost currency. USD or POLY |

### changeTitle

⤾ overrides [IModuleFactory.changeTitle](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModuleFactory.md#changetitle)

Updates the title of the ModuleFactory

```javascript
function changeTitle(string _title) public nonpayable onlyOwner
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_title | string | New Title that will replace the old one. |

### changeDescription

⤾ overrides [IModuleFactory.changeDescription](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModuleFactory.md#changedescription)

Updates the description of the ModuleFactory

```javascript
function changeDescription(string _description) public nonpayable onlyOwner
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_description | string | New description that will replace the old one. |

### changeName

⤾ overrides [IModuleFactory.changeName](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModuleFactory.md#changename)

Updates the name of the ModuleFactory

```javascript
function changeName(bytes32 _name) public nonpayable onlyOwner
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_name | bytes32 | New name that will replace the old one. |

### changeTags

⤾ overrides [IModuleFactory.changeTags](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModuleFactory.md#changetags)

Updates the tags of the ModuleFactory

```javascript
function changeTags(bytes32[] _tagsData) public nonpayable onlyOwner
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_tagsData | bytes32\[\] | New list of tags |

### changeSTVersionBounds

⤾ overrides [IModuleFactory.changeSTVersionBounds](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModuleFactory.md#changestversionbounds)

Function use to change the lower and upper bound of the compatible version st

```javascript
function changeSTVersionBounds(string _boundType, uint8[] _newVersion) external nonpayable onlyOwner
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_boundType | string | Type of bound |
| \_newVersion | uint8\[\] | new version array |

### getLowerSTVersionBounds

⤾ overrides [IModuleFactory.getLowerSTVersionBounds](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModuleFactory.md#getlowerstversionbounds)

Used to get the lower bound

```javascript
function getLowerSTVersionBounds() external view
returns(uint8[])
```

**Returns**

lower bound

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### getUpperSTVersionBounds

⤾ overrides [IModuleFactory.getUpperSTVersionBounds](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModuleFactory.md#getupperstversionbounds)

Used to get the upper bound

```javascript
function getUpperSTVersionBounds() external view
returns(uint8[])
```

**Returns**

upper bound

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### setupCostInPoly

⤾ overrides [IModuleFactory.setupCostInPoly](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModuleFactory.md#setupcostinpoly)

Get the setup cost of the module

```javascript
function setupCostInPoly() public nonpayable
returns(uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### \_takeFee

Calculates fee in POLY

```javascript
function _takeFee() internal nonpayable
returns(uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### \_initializeModule

⤿ Overridden Implementation\(s\): [UpgradableModuleFactory.\_initializeModule](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/UpgradableModuleFactory.md#_initializemodule)

Used to initialize the module

```javascript
function _initializeModule(address _module, bytes _data) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_module | address | Address of module |
| \_data | bytes | Data used for the intialization of the module factory variables |

