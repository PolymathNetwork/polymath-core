---
id: version-3.0.0-EtherDividendCheckpoint
title: EtherDividendCheckpoint
original_id: EtherDividendCheckpoint
---

# Checkpoint module for issuing ether dividends \(EtherDividendCheckpoint.sol\)

View Source: [contracts/modules/Checkpoint/Dividend/Ether/EtherDividendCheckpoint.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/modules/Checkpoint/Dividend/Ether/EtherDividendCheckpoint.sol)

**↗ Extends:** [**DividendCheckpoint**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/DividendCheckpoint.md)

**EtherDividendCheckpoint**

**Events**

```javascript
event EtherDividendDeposited(address indexed _depositor, uint256  _checkpointId, uint256  _maturity, uint256  _expiry, uint256  _amount, uint256  _totalSupply, uint256 indexed _dividendIndex, bytes32 indexed _name);
event EtherDividendClaimed(address indexed _payee, uint256 indexed _dividendIndex, uint256  _amount, uint256  _withheld);
event EtherDividendReclaimed(address indexed _claimer, uint256 indexed _dividendIndex, uint256  _claimedAmount);
event EtherDividendClaimFailed(address indexed _payee, uint256 indexed _dividendIndex, uint256  _amount, uint256  _withheld);
event EtherDividendWithholdingWithdrawn(address indexed _claimer, uint256 indexed _dividendIndex, uint256  _withheldAmount);
```

## Functions

* [\(address \_securityToken, address \_polyToken\)](etherdividendcheckpoint.md)
* [createDividend\(uint256 \_maturity, uint256 \_expiry, bytes32 \_name\)](etherdividendcheckpoint.md#createdividend)
* [createDividendWithCheckpoint\(uint256 \_maturity, uint256 \_expiry, uint256 \_checkpointId, bytes32 \_name\)](etherdividendcheckpoint.md#createdividendwithcheckpoint)
* [createDividendWithExclusions\(uint256 \_maturity, uint256 \_expiry, address\[\] \_excluded, bytes32 \_name\)](etherdividendcheckpoint.md#createdividendwithexclusions)
* [createDividendWithCheckpointAndExclusions\(uint256 \_maturity, uint256 \_expiry, uint256 \_checkpointId, address\[\] \_excluded, bytes32 \_name\)](etherdividendcheckpoint.md#createdividendwithcheckpointandexclusions)
* [\_createDividendWithCheckpointAndExclusions\(uint256 \_maturity, uint256 \_expiry, uint256 \_checkpointId, address\[\] \_excluded, bytes32 \_name\)](etherdividendcheckpoint.md#_createdividendwithcheckpointandexclusions)
* [\_payDividend\(address payable \_payee, struct DividendCheckpointStorage.Dividend \_dividend, uint256 \_dividendIndex\)](etherdividendcheckpoint.md#_paydividend)
* [reclaimDividend\(uint256 \_dividendIndex\)](etherdividendcheckpoint.md#reclaimdividend)
* [withdrawWithholding\(uint256 \_dividendIndex\)](etherdividendcheckpoint.md#withdrawwithholding)

Constructor

```javascript
function (address _securityToken, address _polyToken) public nonpayable Module
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_securityToken | address | Address of the security token |
| \_polyToken | address |  |

### createDividend

Creates a dividend and checkpoint for the dividend, using global list of excluded addresses

```javascript
function createDividend(uint256 _maturity, uint256 _expiry, bytes32 _name) external payable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_maturity | uint256 | Time from which dividend can be paid |
| \_expiry | uint256 | Time until dividend can no longer be paid, and can be reclaimed by issuer |
| \_name | bytes32 | Name/title for identification |

### createDividendWithCheckpoint

Creates a dividend with a provided checkpoint, using global list of excluded addresses

```javascript
function createDividendWithCheckpoint(uint256 _maturity, uint256 _expiry, uint256 _checkpointId, bytes32 _name) external payable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_maturity | uint256 | Time from which dividend can be paid |
| \_expiry | uint256 | Time until dividend can no longer be paid, and can be reclaimed by issuer |
| \_checkpointId | uint256 | Id of the checkpoint from which to issue dividend |
| \_name | bytes32 | Name/title for identification |

### createDividendWithExclusions

Creates a dividend and checkpoint for the dividend, specifying explicit excluded addresses

```javascript
function createDividendWithExclusions(uint256 _maturity, uint256 _expiry, address[] _excluded, bytes32 _name) public payable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_maturity | uint256 | Time from which dividend can be paid |
| \_expiry | uint256 | Time until dividend can no longer be paid, and can be reclaimed by issuer |
| \_excluded | address\[\] | List of addresses to exclude |
| \_name | bytes32 | Name/title for identification |

### createDividendWithCheckpointAndExclusions

Creates a dividend with a provided checkpoint, specifying explicit excluded addresses

```javascript
function createDividendWithCheckpointAndExclusions(uint256 _maturity, uint256 _expiry, uint256 _checkpointId, address[] _excluded, bytes32 _name) public payable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_maturity | uint256 | Time from which dividend can be paid |
| \_expiry | uint256 | Time until dividend can no longer be paid, and can be reclaimed by issuer |
| \_checkpointId | uint256 | Id of the checkpoint from which to issue dividend |
| \_excluded | address\[\] | List of addresses to exclude |
| \_name | bytes32 | Name/title for identification |

### \_createDividendWithCheckpointAndExclusions

Creates a dividend with a provided checkpoint, specifying explicit excluded addresses

```javascript
function _createDividendWithCheckpointAndExclusions(uint256 _maturity, uint256 _expiry, uint256 _checkpointId, address[] _excluded, bytes32 _name) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_maturity | uint256 | Time from which dividend can be paid |
| \_expiry | uint256 | Time until dividend can no longer be paid, and can be reclaimed by issuer |
| \_checkpointId | uint256 | Id of the checkpoint from which to issue dividend |
| \_excluded | address\[\] | List of addresses to exclude |
| \_name | bytes32 | Name/title for identification |

### \_payDividend

⤾ overrides [DividendCheckpoint.\_payDividend](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/DividendCheckpoint.md#_paydividend)

Internal function for paying dividends

```javascript
function _payDividend(address payable _payee, struct DividendCheckpointStorage.Dividend _dividend, uint256 _dividendIndex) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_payee | address payable | address of investor |
| \_dividend | struct DividendCheckpointStorage.Dividend | storage with previously issued dividends |
| \_dividendIndex | uint256 | Dividend to pay |

### reclaimDividend

⤾ overrides [DividendCheckpoint.reclaimDividend](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/DividendCheckpoint.md#reclaimdividend)

Issuer can reclaim remaining unclaimed dividend amounts, for expired dividends

```javascript
function reclaimDividend(uint256 _dividendIndex) external nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_dividendIndex | uint256 | Dividend to reclaim |

### withdrawWithholding

⤾ overrides [DividendCheckpoint.withdrawWithholding](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/DividendCheckpoint.md#withdrawwithholding)

Allows issuer to withdraw withheld tax

```javascript
function withdrawWithholding(uint256 _dividendIndex) external nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_dividendIndex | uint256 | Dividend to withdraw from |

