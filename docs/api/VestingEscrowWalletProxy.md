---
id: version-3.0.0-VestingEscrowWalletProxy
title: VestingEscrowWalletProxy
original_id: VestingEscrowWalletProxy
---

# Escrow wallet module for vesting functionality (VestingEscrowWalletProxy.sol)

View Source: [contracts/modules/Wallet/VestingEscrowWalletProxy.sol](../../contracts/modules/Wallet/VestingEscrowWalletProxy.sol)

**↗ Extends: [VestingEscrowWalletStorage](VestingEscrowWalletStorage.md), [ModuleStorage](ModuleStorage.md), [Pausable](Pausable.md), [OwnedUpgradeabilityProxy](OwnedUpgradeabilityProxy.md)**

**VestingEscrowWalletProxy**

## Functions

- [(string _version, address _securityToken, address _polyAddress, address _implementation)](#)

### 

Constructor

```js
function (string _version, address _securityToken, address _polyAddress, address _implementation) public nonpayable ModuleStorage 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _version | string |  | 
| _securityToken | address | Address of the security token | 
| _polyAddress | address | Address of the polytoken | 
| _implementation | address | representing the address of the new implementation to be set | 

