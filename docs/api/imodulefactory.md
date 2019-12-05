---
id: version-3.0.0-IModuleFactory
title: IModuleFactory
original_id: IModuleFactory
---

# Interface that every module factory contract should implement \(IModuleFactory.sol\)

View Source: [contracts/interfaces/IModuleFactory.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/interfaces/IModuleFactory.sol)

**↘ Derived Contracts:** [**ModuleFactory**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ModuleFactory.md)

**IModuleFactory**

**Events**

```javascript
event ChangeSetupCost(uint256  _oldSetupCost, uint256  _newSetupCost);
event ChangeCostType(bool  _isOldCostInPoly, bool  _isNewCostInPoly);
event GenerateModuleFromFactory(address  _module, bytes32 indexed _moduleName, address indexed _moduleFactory, address  _creator, uint256  _setupCost, uint256  _setupCostInPoly);
event ChangeSTVersionBound(string  _boundType, uint8  _major, uint8  _minor, uint8  _patch);
```

## Functions

* [deploy\(bytes \_data\)](imodulefactory.md#deploy)
* [version\(\)](imodulefactory.md#version)
* [name\(\)](imodulefactory.md#name)
* [title\(\)](imodulefactory.md#title)
* [description\(\)](imodulefactory.md#description)
* [setupCost\(\)](imodulefactory.md#setupcost)
* [getTypes\(\)](imodulefactory.md#gettypes)
* [getTags\(\)](imodulefactory.md#gettags)
* [changeSetupCost\(uint256 \_newSetupCost\)](imodulefactory.md#changesetupcost)
* [changeCostAndType\(uint256 \_setupCost, bool \_isCostInPoly\)](imodulefactory.md#changecostandtype)
* [changeSTVersionBounds\(string \_boundType, uint8\[\] \_newVersion\)](imodulefactory.md#changestversionbounds)
* [setupCostInPoly\(\)](imodulefactory.md#setupcostinpoly)
* [getLowerSTVersionBounds\(\)](imodulefactory.md#getlowerstversionbounds)
* [getUpperSTVersionBounds\(\)](imodulefactory.md#getupperstversionbounds)
* [changeTags\(bytes32\[\] \_tagsData\)](imodulefactory.md#changetags)
* [changeName\(bytes32 \_name\)](imodulefactory.md#changename)
* [changeDescription\(string \_description\)](imodulefactory.md#changedescription)
* [changeTitle\(string \_title\)](imodulefactory.md#changetitle)

### deploy

⤿ Overridden Implementation\(s\): [BlacklistTransferManagerFactory.deploy](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/BlacklistTransferManagerFactory.md#deploy),[CappedSTOFactory.deploy](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/CappedSTOFactory.md#deploy),[CountTransferManagerFactory.deploy](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/CountTransferManagerFactory.md#deploy),[DummySTOFactory.deploy](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/DummySTOFactory.md#deploy),[ERC20DividendCheckpointFactory.deploy](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ERC20DividendCheckpointFactory.md#deploy),[EtherDividendCheckpointFactory.deploy](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/EtherDividendCheckpointFactory.md#deploy),[GeneralPermissionManagerFactory.deploy](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/GeneralPermissionManagerFactory.md#deploy),[GeneralTransferManagerFactory.deploy](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/GeneralTransferManagerFactory.md#deploy),[KYCTransferManagerFactory.deploy](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/KYCTransferManagerFactory.md#deploy),[LockUpTransferManagerFactory.deploy](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/LockUpTransferManagerFactory.md#deploy),[ManualApprovalTransferManagerFactory.deploy](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ManualApprovalTransferManagerFactory.md#deploy),[MockBurnFactory.deploy](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/MockBurnFactory.md#deploy),[PercentageTransferManagerFactory.deploy](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/PercentageTransferManagerFactory.md#deploy),[PLCRVotingCheckpointFactory.deploy](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/PLCRVotingCheckpointFactory.md#deploy),[PreSaleSTOFactory.deploy](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/PreSaleSTOFactory.md#deploy),[ScheduledCheckpointFactory.deploy](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ScheduledCheckpointFactory.md#deploy),[SignedTransferManagerFactory.deploy](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/SignedTransferManagerFactory.md#deploy),[TrackedRedemptionFactory.deploy](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/TrackedRedemptionFactory.md#deploy),[USDTieredSTOFactory.deploy](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/USDTieredSTOFactory.md#deploy),[VestingEscrowWalletFactory.deploy](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/VestingEscrowWalletFactory.md#deploy),[VolumeRestrictionTMFactory.deploy](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/VolumeRestrictionTMFactory.md#deploy),[WeightedVoteCheckpointFactory.deploy](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/WeightedVoteCheckpointFactory.md#deploy)

```javascript
function deploy(bytes _data) external nonpayable
returns(moduleAddress address)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_data | bytes |  |

### version

⤿ Overridden Implementation\(s\): [ModuleFactory.version](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ModuleFactory.md#version),[UpgradableModuleFactory.version](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/UpgradableModuleFactory.md#version)

Get the tags related to the module factory

```javascript
function version() external view
returns(moduleVersion string)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### name

Get the tags related to the module factory

```javascript
function name() external view
returns(moduleName bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### title

Returns the title associated with the module

```javascript
function title() external view
returns(moduleTitle string)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### description

Returns the description associated with the module

```javascript
function description() external view
returns(moduleDescription string)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### setupCost

Get the setup cost of the module in USD

```javascript
function setupCost() external nonpayable
returns(usdSetupCost uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### getTypes

⤿ Overridden Implementation\(s\): [MockFactory.getTypes](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/MockFactory.md#gettypes),[MockWrongTypeFactory.getTypes](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/MockWrongTypeFactory.md#gettypes),[ModuleFactory.getTypes](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ModuleFactory.md#gettypes)

Type of the Module factory

```javascript
function getTypes() external view
returns(moduleTypes uint8[])
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### getTags

⤿ Overridden Implementation\(s\): [ModuleFactory.getTags](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ModuleFactory.md#gettags),[TestSTOFactory.getTags](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/TestSTOFactory.md#gettags)

Get the tags related to the module factory

```javascript
function getTags() external view
returns(moduleTags bytes32[])
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### changeSetupCost

⤿ Overridden Implementation\(s\): [ModuleFactory.changeSetupCost](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ModuleFactory.md#changesetupcost)

Used to change the setup fee

```javascript
function changeSetupCost(uint256 _newSetupCost) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_newSetupCost | uint256 | New setup fee |

### changeCostAndType

⤿ Overridden Implementation\(s\): [ModuleFactory.changeCostAndType](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ModuleFactory.md#changecostandtype)

Used to change the currency and amount setup cost

```javascript
function changeCostAndType(uint256 _setupCost, bool _isCostInPoly) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_setupCost | uint256 | new setup cost |
| \_isCostInPoly | bool | new setup cost currency. USD or POLY |

### changeSTVersionBounds

⤿ Overridden Implementation\(s\): [ModuleFactory.changeSTVersionBounds](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ModuleFactory.md#changestversionbounds)

Function use to change the lower and upper bound of the compatible version st

```javascript
function changeSTVersionBounds(string _boundType, uint8[] _newVersion) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_boundType | string | Type of bound |
| \_newVersion | uint8\[\] | New version array |

### setupCostInPoly

⤿ Overridden Implementation\(s\): [ModuleFactory.setupCostInPoly](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ModuleFactory.md#setupcostinpoly)

Get the setup cost of the module

```javascript
function setupCostInPoly() external nonpayable
returns(polySetupCost uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### getLowerSTVersionBounds

⤿ Overridden Implementation\(s\): [ModuleFactory.getLowerSTVersionBounds](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ModuleFactory.md#getlowerstversionbounds)

Used to get the lower bound

```javascript
function getLowerSTVersionBounds() external view
returns(lowerBounds uint8[])
```

**Returns**

Lower bound

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### getUpperSTVersionBounds

⤿ Overridden Implementation\(s\): [ModuleFactory.getUpperSTVersionBounds](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ModuleFactory.md#getupperstversionbounds)

Used to get the upper bound

```javascript
function getUpperSTVersionBounds() external view
returns(upperBounds uint8[])
```

**Returns**

Upper bound

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### changeTags

⤿ Overridden Implementation\(s\): [ModuleFactory.changeTags](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ModuleFactory.md#changetags)

Updates the tags of the ModuleFactory

```javascript
function changeTags(bytes32[] _tagsData) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_tagsData | bytes32\[\] | New list of tags |

### changeName

⤿ Overridden Implementation\(s\): [ModuleFactory.changeName](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ModuleFactory.md#changename)

Updates the name of the ModuleFactory

```javascript
function changeName(bytes32 _name) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_name | bytes32 | New name that will replace the old one. |

### changeDescription

⤿ Overridden Implementation\(s\): [ModuleFactory.changeDescription](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ModuleFactory.md#changedescription)

Updates the description of the ModuleFactory

```javascript
function changeDescription(string _description) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_description | string | New description that will replace the old one. |

### changeTitle

⤿ Overridden Implementation\(s\): [ModuleFactory.changeTitle](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ModuleFactory.md#changetitle)

Updates the title of the ModuleFactory

```javascript
function changeTitle(string _title) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_title | string | New Title that will replace the old one. |

