---
id: version-3.0.0-LockUpTransferManagerStorage
title: LockUpTransferManagerStorage
original_id: LockUpTransferManagerStorage
---

# Wallet for core vesting escrow functionality \(LockUpTransferManagerStorage.sol\)

View Source: [contracts/modules/TransferManager/LTM/LockUpTransferManagerStorage.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/modules/TransferManager/LTM/LockUpTransferManagerStorage.sol)

**↘ Derived Contracts:** [**LockUpTransferManager**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/LockUpTransferManager.md)**,** [**LockUpTransferManagerProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/LockUpTransferManagerProxy.md)

**LockUpTransferManagerStorage**

## Structs

### LockUp

```javascript
struct LockUp {
 uint256 lockupAmount,
 uint256 startTime,
 uint256 lockUpPeriodSeconds,
 uint256 releaseFrequencySeconds
}
```

## Contract Members

**Constants & Variables**

```javascript
//public members
mapping(bytes32 => struct LockUpTransferManagerStorage.LockUp) public lockups;

//internal members
mapping(address => bytes32[]) internal userToLockups;
mapping(bytes32 => address[]) internal lockupToUsers;
mapping(address => mapping(bytes32 => uint256)) internal userToLockupIndex;
mapping(bytes32 => mapping(address => uint256)) internal lockupToUserIndex;
bytes32[] internal lockupArray;
```

## Functions

