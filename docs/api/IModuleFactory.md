---
id: version-3.0.0-IModuleFactory
title: IModuleFactory
original_id: IModuleFactory
---

# Interface that every module factory contract should implement (IModuleFactory.sol)

View Source: [contracts/interfaces/IModuleFactory.sol](../../contracts/interfaces/IModuleFactory.sol)

**↘ Derived Contracts: [ModuleFactory](ModuleFactory.md)**

**IModuleFactory**

**Events**

```js
event ChangeSetupCost(uint256  _oldSetupCost, uint256  _newSetupCost);
event ChangeCostType(bool  _isOldCostInPoly, bool  _isNewCostInPoly);
event GenerateModuleFromFactory(address  _module, bytes32 indexed _moduleName, address indexed _moduleFactory, address  _creator, uint256  _setupCost, uint256  _setupCostInPoly);
event ChangeSTVersionBound(string  _boundType, uint8  _major, uint8  _minor, uint8  _patch);
```

## Functions

- [deploy(bytes _data)](#deploy)
- [version()](#version)
- [name()](#name)
- [title()](#title)
- [description()](#description)
- [setupCost()](#setupcost)
- [getTypes()](#gettypes)
- [getTags()](#gettags)
- [changeSetupCost(uint256 _newSetupCost)](#changesetupcost)
- [changeCostAndType(uint256 _setupCost, bool _isCostInPoly)](#changecostandtype)
- [changeSTVersionBounds(string _boundType, uint8[] _newVersion)](#changestversionbounds)
- [setupCostInPoly()](#setupcostinpoly)
- [getLowerSTVersionBounds()](#getlowerstversionbounds)
- [getUpperSTVersionBounds()](#getupperstversionbounds)
- [changeTags(bytes32[] _tagsData)](#changetags)
- [changeName(bytes32 _name)](#changename)
- [changeDescription(string _description)](#changedescription)
- [changeTitle(string _title)](#changetitle)

### deploy

⤿ Overridden Implementation(s): [BlacklistTransferManagerFactory.deploy](BlacklistTransferManagerFactory.md#deploy),[CappedSTOFactory.deploy](CappedSTOFactory.md#deploy),[CountTransferManagerFactory.deploy](CountTransferManagerFactory.md#deploy),[DummySTOFactory.deploy](DummySTOFactory.md#deploy),[ERC20DividendCheckpointFactory.deploy](ERC20DividendCheckpointFactory.md#deploy),[EtherDividendCheckpointFactory.deploy](EtherDividendCheckpointFactory.md#deploy),[GeneralPermissionManagerFactory.deploy](GeneralPermissionManagerFactory.md#deploy),[GeneralTransferManagerFactory.deploy](GeneralTransferManagerFactory.md#deploy),[KYCTransferManagerFactory.deploy](KYCTransferManagerFactory.md#deploy),[LockUpTransferManagerFactory.deploy](LockUpTransferManagerFactory.md#deploy),[ManualApprovalTransferManagerFactory.deploy](ManualApprovalTransferManagerFactory.md#deploy),[MockBurnFactory.deploy](MockBurnFactory.md#deploy),[PercentageTransferManagerFactory.deploy](PercentageTransferManagerFactory.md#deploy),[PLCRVotingCheckpointFactory.deploy](PLCRVotingCheckpointFactory.md#deploy),[PreSaleSTOFactory.deploy](PreSaleSTOFactory.md#deploy),[RestrictedPartialSaleTMFactory.deploy](RestrictedPartialSaleTMFactory.md#deploy),[ScheduledCheckpointFactory.deploy](ScheduledCheckpointFactory.md#deploy),[SignedTransferManagerFactory.deploy](SignedTransferManagerFactory.md#deploy),[TrackedRedemptionFactory.deploy](TrackedRedemptionFactory.md#deploy),[USDTieredSTOFactory.deploy](USDTieredSTOFactory.md#deploy),[VestingEscrowWalletFactory.deploy](VestingEscrowWalletFactory.md#deploy),[VolumeRestrictionTMFactory.deploy](VolumeRestrictionTMFactory.md#deploy),[WeightedVoteCheckpointFactory.deploy](WeightedVoteCheckpointFactory.md#deploy)

```js
function deploy(bytes _data) external nonpayable
returns(moduleAddress address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _data | bytes |  | 

### version

⤿ Overridden Implementation(s): [ModuleFactory.version](ModuleFactory.md#version),[UpgradableModuleFactory.version](UpgradableModuleFactory.md#version)

Get the tags related to the module factory

```js
function version() external view
returns(moduleVersion string)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### name

Get the tags related to the module factory

```js
function name() external view
returns(moduleName bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### title

Returns the title associated with the module

```js
function title() external view
returns(moduleTitle string)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### description

Returns the description associated with the module

```js
function description() external view
returns(moduleDescription string)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### setupCost

Get the setup cost of the module in USD

```js
function setupCost() external nonpayable
returns(usdSetupCost uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getTypes

⤿ Overridden Implementation(s): [MockFactory.getTypes](MockFactory.md#gettypes),[MockWrongTypeFactory.getTypes](MockWrongTypeFactory.md#gettypes),[ModuleFactory.getTypes](ModuleFactory.md#gettypes)

Type of the Module factory

```js
function getTypes() external view
returns(moduleTypes uint8[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getTags

⤿ Overridden Implementation(s): [ModuleFactory.getTags](ModuleFactory.md#gettags),[TestSTOFactory.getTags](TestSTOFactory.md#gettags)

Get the tags related to the module factory

```js
function getTags() external view
returns(moduleTags bytes32[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### changeSetupCost

⤿ Overridden Implementation(s): [ModuleFactory.changeSetupCost](ModuleFactory.md#changesetupcost)

Used to change the setup fee

```js
function changeSetupCost(uint256 _newSetupCost) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _newSetupCost | uint256 | New setup fee | 

### changeCostAndType

⤿ Overridden Implementation(s): [ModuleFactory.changeCostAndType](ModuleFactory.md#changecostandtype)

Used to change the currency and amount setup cost

```js
function changeCostAndType(uint256 _setupCost, bool _isCostInPoly) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _setupCost | uint256 | new setup cost | 
| _isCostInPoly | bool | new setup cost currency. USD or POLY | 

### changeSTVersionBounds

⤿ Overridden Implementation(s): [ModuleFactory.changeSTVersionBounds](ModuleFactory.md#changestversionbounds)

Function use to change the lower and upper bound of the compatible version st

```js
function changeSTVersionBounds(string _boundType, uint8[] _newVersion) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _boundType | string | Type of bound | 
| _newVersion | uint8[] | New version array | 

### setupCostInPoly

⤿ Overridden Implementation(s): [ModuleFactory.setupCostInPoly](ModuleFactory.md#setupcostinpoly)

Get the setup cost of the module

```js
function setupCostInPoly() external nonpayable
returns(polySetupCost uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getLowerSTVersionBounds

⤿ Overridden Implementation(s): [ModuleFactory.getLowerSTVersionBounds](ModuleFactory.md#getlowerstversionbounds)

Used to get the lower bound

```js
function getLowerSTVersionBounds() external view
returns(lowerBounds uint8[])
```

**Returns**

Lower bound

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getUpperSTVersionBounds

⤿ Overridden Implementation(s): [ModuleFactory.getUpperSTVersionBounds](ModuleFactory.md#getupperstversionbounds)

Used to get the upper bound

```js
function getUpperSTVersionBounds() external view
returns(upperBounds uint8[])
```

**Returns**

Upper bound

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### changeTags

⤿ Overridden Implementation(s): [ModuleFactory.changeTags](ModuleFactory.md#changetags)

Updates the tags of the ModuleFactory

```js
function changeTags(bytes32[] _tagsData) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _tagsData | bytes32[] | New list of tags | 

### changeName

⤿ Overridden Implementation(s): [ModuleFactory.changeName](ModuleFactory.md#changename)

Updates the name of the ModuleFactory

```js
function changeName(bytes32 _name) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _name | bytes32 | New name that will replace the old one. | 

### changeDescription

⤿ Overridden Implementation(s): [ModuleFactory.changeDescription](ModuleFactory.md#changedescription)

Updates the description of the ModuleFactory

```js
function changeDescription(string _description) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _description | string | New description that will replace the old one. | 

### changeTitle

⤿ Overridden Implementation(s): [ModuleFactory.changeTitle](ModuleFactory.md#changetitle)

Updates the title of the ModuleFactory

```js
function changeTitle(string _title) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _title | string | New Title that will replace the old one. | 

