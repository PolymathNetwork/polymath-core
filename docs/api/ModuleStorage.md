---
id: version-3.0.0-ModuleStorage
title: ModuleStorage
original_id: ModuleStorage
---

# Storage for Module contract (ModuleStorage.sol)

View Source: [contracts/storage/modules/ModuleStorage.sol](../../contracts/storage/modules/ModuleStorage.sol)

**↘ Derived Contracts: [AdvancedPLCRVotingCheckpointProxy](AdvancedPLCRVotingCheckpointProxy.md), [BlacklistTransferManagerProxy](BlacklistTransferManagerProxy.md), [CappedSTOProxy](CappedSTOProxy.md), [CountTransferManagerProxy](CountTransferManagerProxy.md), [DummySTOProxy](DummySTOProxy.md), [ERC20DividendCheckpointProxy](ERC20DividendCheckpointProxy.md), [EtherDividendCheckpointProxy](EtherDividendCheckpointProxy.md), [GeneralPermissionManagerProxy](GeneralPermissionManagerProxy.md), [GeneralTransferManagerProxy](GeneralTransferManagerProxy.md), [IssuanceProxy](IssuanceProxy.md), [LockUpTransferManagerProxy](LockUpTransferManagerProxy.md), [ManualApprovalTransferManagerProxy](ManualApprovalTransferManagerProxy.md), [Module](Module.md), [PercentageTransferManagerProxy](PercentageTransferManagerProxy.md), [PLCRVotingCheckpointProxy](PLCRVotingCheckpointProxy.md), [PreSaleSTOProxy](PreSaleSTOProxy.md), [RestrictedPartialSaleTMProxy](RestrictedPartialSaleTMProxy.md), [USDTieredSTOProxy](USDTieredSTOProxy.md), [VestingEscrowWalletProxy](VestingEscrowWalletProxy.md), [VolumeRestrictionTMProxy](VolumeRestrictionTMProxy.md), [WeightedVoteCheckpointProxy](WeightedVoteCheckpointProxy.md)**

**ModuleStorage**

Contract is abstract

## Contract Members
**Constants & Variables**

```js
//public members
address public factory;
contract ISecurityToken public securityToken;
bytes32 public constant ADMIN;
bytes32 public constant OPERATOR;
contract IERC20 public polyToken;

//internal members
bytes32 internal constant TREASURY;

```

## Functions

- [(address _securityToken, address _polyAddress)](#)

### 

Constructor

```js
function (address _securityToken, address _polyAddress) public nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _securityToken | address | Address of the security token | 
| _polyAddress | address | Address of the polytoken | 

