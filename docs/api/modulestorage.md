---
id: version-3.0.0-ModuleStorage
title: ModuleStorage
original_id: ModuleStorage
---

# Storage for Module contract \(ModuleStorage.sol\)

View Source: [contracts/storage/modules/ModuleStorage.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/storage/modules/ModuleStorage.sol)

**↘ Derived Contracts:** [**BlacklistTransferManagerProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/BlacklistTransferManagerProxy.md)**,** [**CappedSTOProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/CappedSTOProxy.md)**,** [**CountTransferManagerProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/CountTransferManagerProxy.md)**,** [**DummySTOProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/DummySTOProxy.md)**,** [**ERC20DividendCheckpointProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ERC20DividendCheckpointProxy.md)**,** [**EtherDividendCheckpointProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/EtherDividendCheckpointProxy.md)**,** [**GeneralPermissionManagerProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/GeneralPermissionManagerProxy.md)**,** [**GeneralTransferManagerProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/GeneralTransferManagerProxy.md)**,** [**LockUpTransferManagerProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/LockUpTransferManagerProxy.md)**,** [**ManualApprovalTransferManagerProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ManualApprovalTransferManagerProxy.md)**,** [**Module**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/Module.md)**,** [**PercentageTransferManagerProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/PercentageTransferManagerProxy.md)**,** [**PLCRVotingCheckpointProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/PLCRVotingCheckpointProxy.md)**,** [**PreSaleSTOProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/PreSaleSTOProxy.md)**,** [**USDTieredSTOProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/USDTieredSTOProxy.md)**,** [**VestingEscrowWalletProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/VestingEscrowWalletProxy.md)**,** [**VolumeRestrictionTMProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/VolumeRestrictionTMProxy.md)**,** [**WeightedVoteCheckpointProxy**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/WeightedVoteCheckpointProxy.md)

**ModuleStorage**

Contract is abstract

## Contract Members

**Constants & Variables**

```javascript
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

* [\(address \_securityToken, address \_polyAddress\)](modulestorage.md)

Constructor

```javascript
function (address _securityToken, address _polyAddress) public nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_securityToken | address | Address of the security token |
| \_polyAddress | address | Address of the polytoken |

