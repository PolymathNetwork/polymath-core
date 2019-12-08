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
event ChangeFactorySetupFee(uint256  _oldSetupCost, uint256  _newSetupCost, address  _moduleFactory);
event ChangeFactoryUsageFee(uint256  _oldUsageCost, uint256  _newUsageCost, address  _moduleFactory);
event ChangeFactorySubscriptionFee(uint256  _oldSubscriptionCost, uint256  _newMonthlySubscriptionCost, address  _moduleFactory);
event GenerateModuleFromFactory(address  _module, bytes32 indexed _moduleName, address indexed _moduleFactory, address  _creator, uint256  _setupCost, uint256  _timestamp);
event ChangeSTVersionBound(string  _boundType, uint8  _major, uint8  _minor, uint8  _patch);
```

## Functions

- [deploy(bytes _data)](#deploy)
- [getTypes()](#gettypes)
- [getName()](#getname)
- [getInstructions()](#getinstructions)
- [getTags()](#gettags)
- [changeFactorySetupFee(uint256 _newSetupCost)](#changefactorysetupfee)
- [changeFactoryUsageFee(uint256 _newUsageCost)](#changefactoryusagefee)
- [changeFactorySubscriptionFee(uint256 _newSubscriptionCost)](#changefactorysubscriptionfee)
- [changeSTVersionBounds(string _boundType, uint8[] _newVersion)](#changestversionbounds)
- [getSetupCost()](#getsetupcost)
- [getLowerSTVersionBounds()](#getlowerstversionbounds)
- [getUpperSTVersionBounds()](#getupperstversionbounds)

### deploy

⤿ Overridden Implementation(s): [BlacklistTransferManagerFactory.deploy](BlacklistTransferManagerFactory.md#deploy),[CappedSTOFactory.deploy](CappedSTOFactory.md#deploy),[CountTransferManagerFactory.deploy](CountTransferManagerFactory.md#deploy),[DummySTOFactory.deploy](DummySTOFactory.md#deploy),[ERC20DividendCheckpointFactory.deploy](ERC20DividendCheckpointFactory.md#deploy),[EtherDividendCheckpointFactory.deploy](EtherDividendCheckpointFactory.md#deploy),[GeneralPermissionManagerFactory.deploy](GeneralPermissionManagerFactory.md#deploy),[GeneralTransferManagerFactory.deploy](GeneralTransferManagerFactory.md#deploy),[LockUpTransferManagerFactory.deploy](LockUpTransferManagerFactory.md#deploy),[ManualApprovalTransferManagerFactory.deploy](ManualApprovalTransferManagerFactory.md#deploy),[MockBurnFactory.deploy](MockBurnFactory.md#deploy),[PercentageTransferManagerFactory.deploy](PercentageTransferManagerFactory.md#deploy),[PreSaleSTOFactory.deploy](PreSaleSTOFactory.md#deploy),[RestrictedPartialSaleTMFactory.deploy](RestrictedPartialSaleTMFactory.md#deploy),[ScheduledCheckpointFactory.deploy](ScheduledCheckpointFactory.md#deploy),[TrackedRedemptionFactory.deploy](TrackedRedemptionFactory.md#deploy),[USDTieredSTOFactory.deploy](USDTieredSTOFactory.md#deploy),[VestingEscrowWalletFactory.deploy](VestingEscrowWalletFactory.md#deploy),[VolumeRestrictionTMFactory.deploy](VolumeRestrictionTMFactory.md#deploy)

```js
function deploy(bytes _data) external nonpayable
returns(address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _data | bytes |  | 

### getTypes

⤿ Overridden Implementation(s): [BlacklistTransferManagerFactory.getTypes](BlacklistTransferManagerFactory.md#gettypes),[CappedSTOFactory.getTypes](CappedSTOFactory.md#gettypes),[CountTransferManagerFactory.getTypes](CountTransferManagerFactory.md#gettypes),[DummySTOFactory.getTypes](DummySTOFactory.md#gettypes),[ERC20DividendCheckpointFactory.getTypes](ERC20DividendCheckpointFactory.md#gettypes),[EtherDividendCheckpointFactory.getTypes](EtherDividendCheckpointFactory.md#gettypes),[GeneralPermissionManagerFactory.getTypes](GeneralPermissionManagerFactory.md#gettypes),[GeneralTransferManagerFactory.getTypes](GeneralTransferManagerFactory.md#gettypes),[LockUpTransferManagerFactory.getTypes](LockUpTransferManagerFactory.md#gettypes),[ManualApprovalTransferManagerFactory.getTypes](ManualApprovalTransferManagerFactory.md#gettypes),[MockFactory.getTypes](MockFactory.md#gettypes),[MockWrongTypeFactory.getTypes](MockWrongTypeFactory.md#gettypes),[PercentageTransferManagerFactory.getTypes](PercentageTransferManagerFactory.md#gettypes),[PreSaleSTOFactory.getTypes](PreSaleSTOFactory.md#gettypes),[RestrictedPartialSaleTMFactory.getTypes](RestrictedPartialSaleTMFactory.md#gettypes),[ScheduledCheckpointFactory.getTypes](ScheduledCheckpointFactory.md#gettypes),[TrackedRedemptionFactory.getTypes](TrackedRedemptionFactory.md#gettypes),[USDTieredSTOFactory.getTypes](USDTieredSTOFactory.md#gettypes),[VestingEscrowWalletFactory.getTypes](VestingEscrowWalletFactory.md#gettypes),[VolumeRestrictionTMFactory.getTypes](VolumeRestrictionTMFactory.md#gettypes)

Type of the Module factory

```js
function getTypes() external view
returns(uint8[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getName

⤿ Overridden Implementation(s): [ModuleFactory.getName](ModuleFactory.md#getname),[ScheduledCheckpointFactory.getName](ScheduledCheckpointFactory.md#getname)

Get the name of the Module

```js
function getName() external view
returns(bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getInstructions

⤿ Overridden Implementation(s): [BlacklistTransferManagerFactory.getInstructions](BlacklistTransferManagerFactory.md#getinstructions),[CappedSTOFactory.getInstructions](CappedSTOFactory.md#getinstructions),[CountTransferManagerFactory.getInstructions](CountTransferManagerFactory.md#getinstructions),[DummySTOFactory.getInstructions](DummySTOFactory.md#getinstructions),[ERC20DividendCheckpointFactory.getInstructions](ERC20DividendCheckpointFactory.md#getinstructions),[EtherDividendCheckpointFactory.getInstructions](EtherDividendCheckpointFactory.md#getinstructions),[GeneralPermissionManagerFactory.getInstructions](GeneralPermissionManagerFactory.md#getinstructions),[GeneralTransferManagerFactory.getInstructions](GeneralTransferManagerFactory.md#getinstructions),[LockUpTransferManagerFactory.getInstructions](LockUpTransferManagerFactory.md#getinstructions),[ManualApprovalTransferManagerFactory.getInstructions](ManualApprovalTransferManagerFactory.md#getinstructions),[PercentageTransferManagerFactory.getInstructions](PercentageTransferManagerFactory.md#getinstructions),[PreSaleSTOFactory.getInstructions](PreSaleSTOFactory.md#getinstructions),[RestrictedPartialSaleTMFactory.getInstructions](RestrictedPartialSaleTMFactory.md#getinstructions),[ScheduledCheckpointFactory.getInstructions](ScheduledCheckpointFactory.md#getinstructions),[TestSTOFactory.getInstructions](TestSTOFactory.md#getinstructions),[TrackedRedemptionFactory.getInstructions](TrackedRedemptionFactory.md#getinstructions),[USDTieredSTOFactory.getInstructions](USDTieredSTOFactory.md#getinstructions),[VestingEscrowWalletFactory.getInstructions](VestingEscrowWalletFactory.md#getinstructions),[VolumeRestrictionTMFactory.getInstructions](VolumeRestrictionTMFactory.md#getinstructions)

Returns the instructions associated with the module

```js
function getInstructions() external view
returns(string)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getTags

⤿ Overridden Implementation(s): [BlacklistTransferManagerFactory.getTags](BlacklistTransferManagerFactory.md#gettags),[CappedSTOFactory.getTags](CappedSTOFactory.md#gettags),[CountTransferManagerFactory.getTags](CountTransferManagerFactory.md#gettags),[DummySTOFactory.getTags](DummySTOFactory.md#gettags),[ERC20DividendCheckpointFactory.getTags](ERC20DividendCheckpointFactory.md#gettags),[EtherDividendCheckpointFactory.getTags](EtherDividendCheckpointFactory.md#gettags),[GeneralPermissionManagerFactory.getTags](GeneralPermissionManagerFactory.md#gettags),[GeneralTransferManagerFactory.getTags](GeneralTransferManagerFactory.md#gettags),[LockUpTransferManagerFactory.getTags](LockUpTransferManagerFactory.md#gettags),[ManualApprovalTransferManagerFactory.getTags](ManualApprovalTransferManagerFactory.md#gettags),[PercentageTransferManagerFactory.getTags](PercentageTransferManagerFactory.md#gettags),[PreSaleSTOFactory.getTags](PreSaleSTOFactory.md#gettags),[RestrictedPartialSaleTMFactory.getTags](RestrictedPartialSaleTMFactory.md#gettags),[ScheduledCheckpointFactory.getTags](ScheduledCheckpointFactory.md#gettags),[TestSTOFactory.getTags](TestSTOFactory.md#gettags),[TrackedRedemptionFactory.getTags](TrackedRedemptionFactory.md#gettags),[USDTieredSTOFactory.getTags](USDTieredSTOFactory.md#gettags),[VestingEscrowWalletFactory.getTags](VestingEscrowWalletFactory.md#gettags),[VolumeRestrictionTMFactory.getTags](VolumeRestrictionTMFactory.md#gettags)

Get the tags related to the module factory

```js
function getTags() external view
returns(bytes32[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### changeFactorySetupFee

⤿ Overridden Implementation(s): [ModuleFactory.changeFactorySetupFee](ModuleFactory.md#changefactorysetupfee)

Used to change the setup fee

```js
function changeFactorySetupFee(uint256 _newSetupCost) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _newSetupCost | uint256 | New setup fee | 

### changeFactoryUsageFee

⤿ Overridden Implementation(s): [ModuleFactory.changeFactoryUsageFee](ModuleFactory.md#changefactoryusagefee)

Used to change the usage fee

```js
function changeFactoryUsageFee(uint256 _newUsageCost) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _newUsageCost | uint256 | New usage fee | 

### changeFactorySubscriptionFee

⤿ Overridden Implementation(s): [ModuleFactory.changeFactorySubscriptionFee](ModuleFactory.md#changefactorysubscriptionfee)

Used to change the subscription fee

```js
function changeFactorySubscriptionFee(uint256 _newSubscriptionCost) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _newSubscriptionCost | uint256 | New subscription fee | 

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

### getSetupCost

⤿ Overridden Implementation(s): [ModuleFactory.getSetupCost](ModuleFactory.md#getsetupcost),[ScheduledCheckpointFactory.getSetupCost](ScheduledCheckpointFactory.md#getsetupcost)

Get the setup cost of the module

```js
function getSetupCost() external view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getLowerSTVersionBounds

⤿ Overridden Implementation(s): [ModuleFactory.getLowerSTVersionBounds](ModuleFactory.md#getlowerstversionbounds)

Used to get the lower bound

```js
function getLowerSTVersionBounds() external view
returns(uint8[])
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
returns(uint8[])
```

**Returns**

Upper bound

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

