---
id: version-3.0.0-ModuleFactory
title: ModuleFactory
original_id: ModuleFactory
---

# Interface that any module factory contract should implement (ModuleFactory.sol)

View Source: [contracts/modules/ModuleFactory.sol](../../contracts/modules/ModuleFactory.sol)

**↗ Extends: [IModuleFactory](IModuleFactory.md), [Ownable](Ownable.md)**
**↘ Derived Contracts: [KYCTransferManagerFactory](KYCTransferManagerFactory.md), [ScheduledCheckpointFactory](ScheduledCheckpointFactory.md), [SignedTransferManagerFactory](SignedTransferManagerFactory.md), [TrackedRedemptionFactory](TrackedRedemptionFactory.md), [UpgradableModuleFactory](UpgradableModuleFactory.md)**

**ModuleFactory**

Contract is abstract

## Contract Members
**Constants & Variables**

```js
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

- [(uint256 _setupCost, address _polymathRegistry, bool _isCostInPoly)](#)
- [getTypes()](#gettypes)
- [getTags()](#gettags)
- [version()](#version)
- [changeSetupCost(uint256 _setupCost)](#changesetupcost)
- [changeCostAndType(uint256 _setupCost, bool _isCostInPoly)](#changecostandtype)
- [changeTitle(string _title)](#changetitle)
- [changeDescription(string _description)](#changedescription)
- [changeName(bytes32 _name)](#changename)
- [changeTags(bytes32[] _tagsData)](#changetags)
- [changeSTVersionBounds(string _boundType, uint8[] _newVersion)](#changestversionbounds)
- [getLowerSTVersionBounds()](#getlowerstversionbounds)
- [getUpperSTVersionBounds()](#getupperstversionbounds)
- [setupCostInPoly()](#setupcostinpoly)
- [_takeFee()](#_takefee)
- [_initializeModule(address _module, bytes _data)](#_initializemodule)

### 

Constructor

```js
function (uint256 _setupCost, address _polymathRegistry, bool _isCostInPoly) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _setupCost | uint256 |  | 
| _polymathRegistry | address |  | 
| _isCostInPoly | bool |  | 

### getTypes

⤾ overrides [IModuleFactory.getTypes](IModuleFactory.md#gettypes)

⤿ Overridden Implementation(s): [MockFactory.getTypes](MockFactory.md#gettypes),[MockWrongTypeFactory.getTypes](MockWrongTypeFactory.md#gettypes)

Type of the Module factory

```js
function getTypes() external view
returns(uint8[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getTags

⤾ overrides [IModuleFactory.getTags](IModuleFactory.md#gettags)

⤿ Overridden Implementation(s): [TestSTOFactory.getTags](TestSTOFactory.md#gettags)

Get the tags related to the module factory

```js
function getTags() external view
returns(bytes32[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### version

⤾ overrides [IModuleFactory.version](IModuleFactory.md#version)

⤿ Overridden Implementation(s): [UpgradableModuleFactory.version](UpgradableModuleFactory.md#version)

Get the version related to the module factory

```js
function version() external view
returns(string)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### changeSetupCost

⤾ overrides [IModuleFactory.changeSetupCost](IModuleFactory.md#changesetupcost)

Used to change the fee of the setup cost

```js
function changeSetupCost(uint256 _setupCost) public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _setupCost | uint256 | new setup cost | 

### changeCostAndType

⤾ overrides [IModuleFactory.changeCostAndType](IModuleFactory.md#changecostandtype)

Used to change the currency and amount of setup cost

```js
function changeCostAndType(uint256 _setupCost, bool _isCostInPoly) public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _setupCost | uint256 | new setup cost | 
| _isCostInPoly | bool | new setup cost currency. USD or POLY | 

### changeTitle

⤾ overrides [IModuleFactory.changeTitle](IModuleFactory.md#changetitle)

Updates the title of the ModuleFactory

```js
function changeTitle(string _title) public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _title | string | New Title that will replace the old one. | 

### changeDescription

⤾ overrides [IModuleFactory.changeDescription](IModuleFactory.md#changedescription)

Updates the description of the ModuleFactory

```js
function changeDescription(string _description) public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _description | string | New description that will replace the old one. | 

### changeName

⤾ overrides [IModuleFactory.changeName](IModuleFactory.md#changename)

Updates the name of the ModuleFactory

```js
function changeName(bytes32 _name) public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _name | bytes32 | New name that will replace the old one. | 

### changeTags

⤾ overrides [IModuleFactory.changeTags](IModuleFactory.md#changetags)

Updates the tags of the ModuleFactory

```js
function changeTags(bytes32[] _tagsData) public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _tagsData | bytes32[] | New list of tags | 

### changeSTVersionBounds

⤾ overrides [IModuleFactory.changeSTVersionBounds](IModuleFactory.md#changestversionbounds)

Function use to change the lower and upper bound of the compatible version st

```js
function changeSTVersionBounds(string _boundType, uint8[] _newVersion) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _boundType | string | Type of bound | 
| _newVersion | uint8[] | new version array | 

### getLowerSTVersionBounds

⤾ overrides [IModuleFactory.getLowerSTVersionBounds](IModuleFactory.md#getlowerstversionbounds)

Used to get the lower bound

```js
function getLowerSTVersionBounds() external view
returns(uint8[])
```

**Returns**

lower bound

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getUpperSTVersionBounds

⤾ overrides [IModuleFactory.getUpperSTVersionBounds](IModuleFactory.md#getupperstversionbounds)

Used to get the upper bound

```js
function getUpperSTVersionBounds() external view
returns(uint8[])
```

**Returns**

upper bound

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### setupCostInPoly

⤾ overrides [IModuleFactory.setupCostInPoly](IModuleFactory.md#setupcostinpoly)

Get the setup cost of the module

```js
function setupCostInPoly() public nonpayable
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### _takeFee

Calculates fee in POLY

```js
function _takeFee() internal nonpayable
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### _initializeModule

⤿ Overridden Implementation(s): [UpgradableModuleFactory._initializeModule](UpgradableModuleFactory.md#_initializemodule)

Used to initialize the module

```js
function _initializeModule(address _module, bytes _data) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _module | address | Address of module | 
| _data | bytes | Data used for the intialization of the module factory variables | 

