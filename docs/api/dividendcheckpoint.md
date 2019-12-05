---
id: version-3.0.0-DividendCheckpoint
title: DividendCheckpoint
original_id: DividendCheckpoint
---

# Checkpoint module for issuing ether dividends \(DividendCheckpoint.sol\)

View Source: [contracts/modules/Checkpoint/Dividend/DividendCheckpoint.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/modules/Checkpoint/Dividend/DividendCheckpoint.sol)

**↗ Extends:** [**DividendCheckpointStorage**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/DividendCheckpointStorage.md)**,** [**ICheckpoint**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ICheckpoint.md)**,** [**Module**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/Module.md) **↘ Derived Contracts:** [**ERC20DividendCheckpoint**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ERC20DividendCheckpoint.md)**,** [**EtherDividendCheckpoint**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/EtherDividendCheckpoint.md)

**DividendCheckpoint**

abstract contract

## Contract Members

**Constants & Variables**

```javascript
uint256 internal constant e18;
```

**Events**

```javascript
event SetDefaultExcludedAddresses(address[]  _excluded);
event SetWithholding(address[]  _investors, uint256[]  _withholding);
event SetWithholdingFixed(address[]  _investors, uint256  _withholding);
event SetWallet(address indexed _oldWallet, address indexed _newWallet);
event UpdateDividendDates(uint256 indexed _dividendIndex, uint256  _maturity, uint256  _expiry);
```

## Functions

* [\_validDividendIndex\(uint256 \_dividendIndex\)](dividendcheckpoint.md#_validdividendindex)
* [configure\(address payable \_wallet\)](dividendcheckpoint.md#configure)
* [getInitFunction\(\)](dividendcheckpoint.md#getinitfunction)
* [changeWallet\(address payable \_wallet\)](dividendcheckpoint.md#changewallet)
* [\_setWallet\(address payable \_wallet\)](dividendcheckpoint.md#_setwallet)
* [getDefaultExcluded\(\)](dividendcheckpoint.md#getdefaultexcluded)
* [getTreasuryWallet\(\)](dividendcheckpoint.md#gettreasurywallet)
* [createCheckpoint\(\)](dividendcheckpoint.md#createcheckpoint)
* [setDefaultExcluded\(address\[\] \_excluded\)](dividendcheckpoint.md#setdefaultexcluded)
* [setWithholding\(address\[\] \_investors, uint256\[\] \_withholding\)](dividendcheckpoint.md#setwithholding)
* [setWithholdingFixed\(address\[\] \_investors, uint256 \_withholding\)](dividendcheckpoint.md#setwithholdingfixed)
* [pushDividendPaymentToAddresses\(uint256 \_dividendIndex, address payable\[\] \_payees\)](dividendcheckpoint.md#pushdividendpaymenttoaddresses)
* [pushDividendPayment\(uint256 \_dividendIndex, uint256 \_start, uint256 \_end\)](dividendcheckpoint.md#pushdividendpayment)
* [pullDividendPayment\(uint256 \_dividendIndex\)](dividendcheckpoint.md#pulldividendpayment)
* [\_payDividend\(address payable \_payee, struct DividendCheckpointStorage.Dividend \_dividend, uint256 \_dividendIndex\)](dividendcheckpoint.md#_paydividend)
* [reclaimDividend\(uint256 \_dividendIndex\)](dividendcheckpoint.md#reclaimdividend)
* [calculateDividend\(uint256 \_dividendIndex, address \_payee\)](dividendcheckpoint.md#calculatedividend)
* [getDividendIndex\(uint256 \_checkpointId\)](dividendcheckpoint.md#getdividendindex)
* [withdrawWithholding\(uint256 \_dividendIndex\)](dividendcheckpoint.md#withdrawwithholding)
* [updateDividendDates\(uint256 \_dividendIndex, uint256 \_maturity, uint256 \_expiry\)](dividendcheckpoint.md#updatedividenddates)
* [getDividendsData\(\)](dividendcheckpoint.md#getdividendsdata)
* [getDividendData\(uint256 \_dividendIndex\)](dividendcheckpoint.md#getdividenddata)
* [getDividendProgress\(uint256 \_dividendIndex\)](dividendcheckpoint.md#getdividendprogress)
* [getCheckpointData\(uint256 \_checkpointId\)](dividendcheckpoint.md#getcheckpointdata)
* [isExcluded\(address \_investor, uint256 \_dividendIndex\)](dividendcheckpoint.md#isexcluded)
* [isClaimed\(address \_investor, uint256 \_dividendIndex\)](dividendcheckpoint.md#isclaimed)
* [getPermissions\(\)](dividendcheckpoint.md#getpermissions)

### \_validDividendIndex

```javascript
function _validDividendIndex(uint256 _dividendIndex) internal view
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_dividendIndex | uint256 |  |

### configure

Function used to intialize the contract variables

```javascript
function configure(address payable _wallet) public nonpayable onlyFactory
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_wallet | address payable | Ethereum account address to receive reclaimed dividends and tax |

### getInitFunction

⤾ overrides [IModule.getInitFunction](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModule.md#getinitfunction)

Init function i.e generalise function to maintain the structure of the module contract

```javascript
function getInitFunction() public pure
returns(bytes4)
```

**Returns**

bytes4

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### changeWallet

Function used to change wallet address

```javascript
function changeWallet(address payable _wallet) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_wallet | address payable | Ethereum account address to receive reclaimed dividends and tax |

### \_setWallet

```javascript
function _setWallet(address payable _wallet) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_wallet | address payable |  |

### getDefaultExcluded

Return the default excluded addresses

```javascript
function getDefaultExcluded() external view
returns(address[])
```

**Returns**

List of excluded addresses

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### getTreasuryWallet

Returns the treasury wallet address

```javascript
function getTreasuryWallet() public view
returns(address payable)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### createCheckpoint

Creates a checkpoint on the security token

```javascript
function createCheckpoint() public nonpayable withPerm 
returns(uint256)
```

**Returns**

Checkpoint ID

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### setDefaultExcluded

Function to clear and set list of excluded addresses used for future dividends

```javascript
function setDefaultExcluded(address[] _excluded) public nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_excluded | address\[\] | Addresses of investors |

### setWithholding

Function to set withholding tax rates for investors

```javascript
function setWithholding(address[] _investors, uint256[] _withholding) public nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_investors | address\[\] | Addresses of investors |
| \_withholding | uint256\[\] | Withholding tax for individual investors \(multiplied by 10\*\*16\) |

### setWithholdingFixed

Function to set withholding tax rates for investors

```javascript
function setWithholdingFixed(address[] _investors, uint256 _withholding) public nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_investors | address\[\] | Addresses of investor |
| \_withholding | uint256 | Withholding tax for all investors \(multiplied by 10\*\*16\) |

### pushDividendPaymentToAddresses

Issuer can push dividends to provided addresses

```javascript
function pushDividendPaymentToAddresses(uint256 _dividendIndex, address payable[] _payees) public nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_dividendIndex | uint256 | Dividend to push |
| \_payees | address payable\[\] | Addresses to which to push the dividend |

### pushDividendPayment

Issuer can push dividends using the investor list from the security token

```javascript
function pushDividendPayment(uint256 _dividendIndex, uint256 _start, uint256 _end) public nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_dividendIndex | uint256 | Dividend to push |
| \_start | uint256 | Index in investor list at which to start pushing dividends |
| \_end | uint256 | Index in investor list at which to stop pushing dividends |

### pullDividendPayment

Investors can pull their own dividends

```javascript
function pullDividendPayment(uint256 _dividendIndex) public nonpayable whenNotPaused
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_dividendIndex | uint256 | Dividend to pull |

### \_payDividend

⤿ Overridden Implementation\(s\): [ERC20DividendCheckpoint.\_payDividend](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ERC20DividendCheckpoint.md#_paydividend),[EtherDividendCheckpoint.\_payDividend](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/EtherDividendCheckpoint.md#_paydividend)

Internal function for paying dividends

```javascript
function _payDividend(address payable _payee, struct DividendCheckpointStorage.Dividend _dividend, uint256 _dividendIndex) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_payee | address payable | Address of investor |
| \_dividend | struct DividendCheckpointStorage.Dividend | Storage with previously issued dividends |
| \_dividendIndex | uint256 | Dividend to pay |

### reclaimDividend

⤿ Overridden Implementation\(s\): [ERC20DividendCheckpoint.reclaimDividend](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ERC20DividendCheckpoint.md#reclaimdividend),[EtherDividendCheckpoint.reclaimDividend](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/EtherDividendCheckpoint.md#reclaimdividend)

Issuer can reclaim remaining unclaimed dividend amounts, for expired dividends

```javascript
function reclaimDividend(uint256 _dividendIndex) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_dividendIndex | uint256 | Dividend to reclaim |

### calculateDividend

Calculate amount of dividends claimable

```javascript
function calculateDividend(uint256 _dividendIndex, address _payee) public view
returns(uint256, uint256)
```

**Returns**

claim, withheld amounts

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_dividendIndex | uint256 | Dividend to calculate |
| \_payee | address | Affected investor address |

### getDividendIndex

Get the index according to the checkpoint id

```javascript
function getDividendIndex(uint256 _checkpointId) public view
returns(uint256[])
```

**Returns**

uint256\[\]

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_checkpointId | uint256 | Checkpoint id to query |

### withdrawWithholding

⤿ Overridden Implementation\(s\): [ERC20DividendCheckpoint.withdrawWithholding](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ERC20DividendCheckpoint.md#withdrawwithholding),[EtherDividendCheckpoint.withdrawWithholding](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/EtherDividendCheckpoint.md#withdrawwithholding)

Allows issuer to withdraw withheld tax

```javascript
function withdrawWithholding(uint256 _dividendIndex) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_dividendIndex | uint256 | Dividend to withdraw from |

### updateDividendDates

Allows issuer to change maturity / expiry dates for dividends

```javascript
function updateDividendDates(uint256 _dividendIndex, uint256 _maturity, uint256 _expiry) external nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_dividendIndex | uint256 | Dividend to withdraw from |
| \_maturity | uint256 | updated maturity date |
| \_expiry | uint256 | updated expiry date |

### getDividendsData

Get static dividend data

```javascript
function getDividendsData() external view
returns(createds uint256[], maturitys uint256[], expirys uint256[], amounts uint256[], claimedAmounts uint256[], names bytes32[])
```

**Returns**

uint256\[\] timestamp of dividends creation

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### getDividendData

Get static dividend data

```javascript
function getDividendData(uint256 _dividendIndex) public view
returns(created uint256, maturity uint256, expiry uint256, amount uint256, claimedAmount uint256, name bytes32)
```

**Returns**

uint256 timestamp of dividend creation

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_dividendIndex | uint256 |  |

### getDividendProgress

Retrieves list of investors, their claim status and whether they are excluded

```javascript
function getDividendProgress(uint256 _dividendIndex) external view
returns(investors address[], resultClaimed bool[], resultExcluded bool[], resultWithheld uint256[], resultAmount uint256[], resultBalance uint256[])
```

**Returns**

address\[\] list of investors

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_dividendIndex | uint256 | Dividend to withdraw from |

### getCheckpointData

Retrieves list of investors, their balances, and their current withholding tax percentage

```javascript
function getCheckpointData(uint256 _checkpointId) external view
returns(investors address[], balances uint256[], withholdings uint256[])
```

**Returns**

address\[\] list of investors

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_checkpointId | uint256 | Checkpoint Id to query for |

### isExcluded

Checks whether an address is excluded from claiming a dividend

```javascript
function isExcluded(address _investor, uint256 _dividendIndex) external view
returns(bool)
```

**Returns**

bool whether the address is excluded

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_investor | address |  |
| \_dividendIndex | uint256 | Dividend to withdraw from |

### isClaimed

Checks whether an address has claimed a dividend

```javascript
function isClaimed(address _investor, uint256 _dividendIndex) external view
returns(bool)
```

**Returns**

bool whether the address has claimed

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_investor | address |  |
| \_dividendIndex | uint256 | Dividend to withdraw from |

### getPermissions

⤾ overrides [IModule.getPermissions](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModule.md#getpermissions)

Return the permissions flag that are associated with this module

```javascript
function getPermissions() public view
returns(bytes32[])
```

**Returns**

bytes32 array

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


