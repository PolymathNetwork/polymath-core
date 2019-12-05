---
id: version-3.0.0-ITransferManager
title: ITransferManager
original_id: ITransferManager
---

# Interface to be implemented by all Transfer Manager modules \(ITransferManager.sol\)

View Source: [contracts/interfaces/ITransferManager.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/interfaces/ITransferManager.sol)

**↘ Derived Contracts:** [**TransferManager**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/TransferManager.md)

**ITransferManager**

**Enums**

### Result

```javascript
enum Result {
 INVALID,
 NA,
 VALID,
 FORCE_VALID
}
```

## Functions

* [executeTransfer\(address \_from, address \_to, uint256 \_amount, bytes \_data\)](itransfermanager.md#executetransfer)
* [verifyTransfer\(address \_from, address \_to, uint256 \_amount, bytes \_data\)](itransfermanager.md#verifytransfer)
* [getTokensByPartition\(bytes32 \_partition, address \_tokenHolder, uint256 \_additionalBalance\)](itransfermanager.md#gettokensbypartition)

### executeTransfer

⤿ Overridden Implementation\(s\): [BlacklistTransferManager.executeTransfer](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/BlacklistTransferManager.md#executetransfer),[CountTransferManager.executeTransfer](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/CountTransferManager.md#executetransfer),[GeneralTransferManager.executeTransfer](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/GeneralTransferManager.md#executetransfer),[KYCTransferManager.executeTransfer](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/KYCTransferManager.md#executetransfer),[LockUpTransferManager.executeTransfer](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/LockUpTransferManager.md#executetransfer),[ManualApprovalTransferManager.executeTransfer](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ManualApprovalTransferManager.md#executetransfer),[PercentageTransferManager.executeTransfer](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/PercentageTransferManager.md#executetransfer),[ScheduledCheckpoint.executeTransfer](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ScheduledCheckpoint.md#executetransfer),[SignedTransferManager.executeTransfer](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/SignedTransferManager.md#executetransfer),[VolumeRestrictionTM.executeTransfer](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/VolumeRestrictionTM.md#executetransfer)

Determines if the transfer between these two accounts can happen

```javascript
function executeTransfer(address _from, address _to, uint256 _amount, bytes _data) external nonpayable
returns(result enum ITransferManager.Result)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_from | address |  |
| \_to | address |  |
| \_amount | uint256 |  |
| \_data | bytes |  |

### verifyTransfer

⤿ Overridden Implementation\(s\): [BlacklistTransferManager.verifyTransfer](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/BlacklistTransferManager.md#verifytransfer),[CountTransferManager.verifyTransfer](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/CountTransferManager.md#verifytransfer),[GeneralTransferManager.verifyTransfer](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/GeneralTransferManager.md#verifytransfer),[KYCTransferManager.verifyTransfer](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/KYCTransferManager.md#verifytransfer),[LockUpTransferManager.verifyTransfer](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/LockUpTransferManager.md#verifytransfer),[ManualApprovalTransferManager.verifyTransfer](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ManualApprovalTransferManager.md#verifytransfer),[PercentageTransferManager.verifyTransfer](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/PercentageTransferManager.md#verifytransfer),[ScheduledCheckpoint.verifyTransfer](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ScheduledCheckpoint.md#verifytransfer),[SignedTransferManager.verifyTransfer](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/SignedTransferManager.md#verifytransfer),[VolumeRestrictionTM.verifyTransfer](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/VolumeRestrictionTM.md#verifytransfer)

```javascript
function verifyTransfer(address _from, address _to, uint256 _amount, bytes _data) external view
returns(result enum ITransferManager.Result, partition bytes32)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_from | address |  |
| \_to | address |  |
| \_amount | uint256 |  |
| \_data | bytes |  |

### getTokensByPartition

⤿ Overridden Implementation\(s\): [BlacklistTransferManager.getTokensByPartition](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/BlacklistTransferManager.md#gettokensbypartition),[GeneralTransferManager.getTokensByPartition](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/GeneralTransferManager.md#gettokensbypartition),[LockUpTransferManager.getTokensByPartition](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/LockUpTransferManager.md#gettokensbypartition),[TransferManager.getTokensByPartition](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/TransferManager.md#gettokensbypartition),[VolumeRestrictionTM.getTokensByPartition](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/VolumeRestrictionTM.md#gettokensbypartition)

return the amount of tokens for a given user as per the partition

```javascript
function getTokensByPartition(bytes32 _partition, address _tokenHolder, uint256 _additionalBalance) external view
returns(amount uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_partition | bytes32 | Identifier |
| \_tokenHolder | address | Whom token amount need to query |
| \_additionalBalance | uint256 | It is the `_value` that transfer during transfer/transferFrom function call |

