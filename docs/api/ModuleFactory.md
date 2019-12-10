---
id: version-3.0.0-ModuleFactory
title: ModuleFactory
original_id: ModuleFactory
---

# Interface that any module factory contract should implement (ModuleFactory.sol)

View Source: [contracts/modules/ModuleFactory.sol](../../contracts/modules/ModuleFactory.sol)

**↗ Extends: [IModuleFactory](IModuleFactory.md), [Ownable](Ownable.md)**
**↘ Derived Contracts: [BlacklistTransferManagerFactory](BlacklistTransferManagerFactory.md), [CappedSTOFactory](CappedSTOFactory.md), [CountTransferManagerFactory](CountTransferManagerFactory.md), [DummySTOFactory](DummySTOFactory.md), [ERC20DividendCheckpointFactory](ERC20DividendCheckpointFactory.md), [EtherDividendCheckpointFactory](EtherDividendCheckpointFactory.md), [GeneralPermissionManagerFactory](GeneralPermissionManagerFactory.md), [GeneralTransferManagerFactory](GeneralTransferManagerFactory.md), [LockUpTransferManagerFactory](LockUpTransferManagerFactory.md), [ManualApprovalTransferManagerFactory](ManualApprovalTransferManagerFactory.md), [PercentageTransferManagerFactory](PercentageTransferManagerFactory.md), [PreSaleSTOFactory](PreSaleSTOFactory.md), [ScheduledCheckpointFactory](ScheduledCheckpointFactory.md), [TrackedRedemptionFactory](TrackedRedemptionFactory.md), [USDTieredSTOFactory](USDTieredSTOFactory.md), [VestingEscrowWalletFactory](VestingEscrowWalletFactory.md), [VolumeRestrictionTMFactory](VolumeRestrictionTMFactory.md)**

**ModuleFactory**

Contract is abstract

## Contract Members
**Constants & Variables**

```js
//public members
contract IERC20 public polyToken;
uint256 public usageCost;
uint256 public monthlySubscriptionCost;
uint256 public setupCost;
string public description;
string public version;
bytes32 public name;
string public title;

//internal members
mapping(string => uint24) internal compatibleSTVersionRange;

```

## Functions

- [changeFactorySetupFee(uint256 _newSetupCost)](#changefactorysetupfee)
- [changeFactoryUsageFee(uint256 _newUsageCost)](#changefactoryusagefee)
- [changeFactorySubscriptionFee(uint256 _newSubscriptionCost)](#changefactorysubscriptionfee)
- [changeTitle(string _newTitle)](#changetitle)
- [changeDescription(string _newDesc)](#changedescription)
- [changeName(bytes32 _newName)](#changename)
- [changeVersion(string _newVersion)](#changeversion)
- [changeSTVersionBounds(string _boundType, uint8[] _newVersion)](#changestversionbounds)
- [getLowerSTVersionBounds()](#getlowerstversionbounds)
- [getUpperSTVersionBounds()](#getupperstversionbounds)
- [getSetupCost()](#getsetupcost)
- [getName()](#getname)

### changeFactorySetupFee

⤾ overrides [IModuleFactory.changeFactorySetupFee](IModuleFactory.md#changefactorysetupfee)

Used to change the fee of the setup cost

```js
function changeFactorySetupFee(uint256 _newSetupCost) public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _newSetupCost | uint256 | new setup cost | 

### changeFactoryUsageFee

⤾ overrides [IModuleFactory.changeFactoryUsageFee](IModuleFactory.md#changefactoryusagefee)

Used to change the fee of the usage cost

```js
function changeFactoryUsageFee(uint256 _newUsageCost) public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _newUsageCost | uint256 | new usage cost | 

### changeFactorySubscriptionFee

⤾ overrides [IModuleFactory.changeFactorySubscriptionFee](IModuleFactory.md#changefactorysubscriptionfee)

Used to change the fee of the subscription cost

```js
function changeFactorySubscriptionFee(uint256 _newSubscriptionCost) public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _newSubscriptionCost | uint256 | new subscription cost | 

### changeTitle

Updates the title of the ModuleFactory

```js
function changeTitle(string _newTitle) public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _newTitle | string | New Title that will replace the old one. | 

### changeDescription

Updates the description of the ModuleFactory

```js
function changeDescription(string _newDesc) public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _newDesc | string | New description that will replace the old one. | 

### changeName

Updates the name of the ModuleFactory

```js
function changeName(bytes32 _newName) public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _newName | bytes32 | New name that will replace the old one. | 

### changeVersion

Updates the version of the ModuleFactory

```js
function changeVersion(string _newVersion) public nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _newVersion | string | New name that will replace the old one. | 

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

### getSetupCost

⤾ overrides [IModuleFactory.getSetupCost](IModuleFactory.md#getsetupcost)

⤿ Overridden Implementation(s): [ScheduledCheckpointFactory.getSetupCost](ScheduledCheckpointFactory.md#getsetupcost)

Get the setup cost of the module

```js
function getSetupCost() external view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getName

⤾ overrides [IModuleFactory.getName](IModuleFactory.md#getname)

⤿ Overridden Implementation(s): [ScheduledCheckpointFactory.getName](ScheduledCheckpointFactory.md#getname)

Get the name of the Module

```js
function getName() public view
returns(bytes32)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

