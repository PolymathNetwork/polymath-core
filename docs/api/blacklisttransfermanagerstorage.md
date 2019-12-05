---
id: version-3.0.0-BlacklistTransferManagerStorage
title: BlacklistTransferManagerStorage
original_id: BlacklistTransferManagerStorage
---

# Contract used to store layout for the CountTransferManager storage \(BlacklistTransferManagerStorage.

View Source: [contracts/modules/TransferManager/BTM/BlacklistTransferManagerStorage.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/modules/TransferManager/BTM/BlacklistTransferManagerStorage.sol)

**↘ Derived Contracts:** [**BlacklistTransferManager**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/BlacklistTransferManager.md)**,** [**BlacklistTransferManagerProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/BlacklistTransferManagerProxy.md)

**BlacklistTransferManagerStorage**

## Structs

### BlacklistsDetails

```javascript
struct BlacklistsDetails {
 uint256 startTime,
 uint256 endTime,
 uint256 repeatPeriodTime
}
```

## Contract Members

**Constants & Variables**

```javascript
//public members
mapping(bytes32 => struct BlacklistTransferManagerStorage.BlacklistsDetails) public blacklists;

//internal members
mapping(address => bytes32[]) internal investorToBlacklist;
mapping(bytes32 => address[]) internal blacklistToInvestor;
mapping(address => mapping(bytes32 => uint256)) internal investorToIndex;
mapping(bytes32 => mapping(address => uint256)) internal blacklistToIndex;
bytes32[] internal allBlacklists;
```

## Functions

