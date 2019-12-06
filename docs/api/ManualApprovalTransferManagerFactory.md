---
id: version-3.0.0-ManualApprovalTransferManagerFactory
title: ManualApprovalTransferManagerFactory
original_id: ManualApprovalTransferManagerFactory
---

# Factory for deploying ManualApprovalTransferManager module (ManualApprovalTransferManagerFactory.sol)

View Source: [contracts/modules/TransferManager/MATM/ManualApprovalTransferManagerFactory.sol](../../contracts/modules/TransferManager/MATM/ManualApprovalTransferManagerFactory.sol)

**↗ Extends: [UpgradableModuleFactory](UpgradableModuleFactory.md)**

**ManualApprovalTransferManagerFactory**

## Functions

- [(uint256 _setupCost, address _logicContract, address _polymathRegistry, bool _isCostInPoly)](#)
- [deploy(bytes _data)](#deploy)

### 

Constructor

```js
function (uint256 _setupCost, address _logicContract, address _polymathRegistry, bool _isCostInPoly) public nonpayable UpgradableModuleFactory 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _setupCost | uint256 | Setup cost of the module | 
| _logicContract | address | Contract address that contains the logic related to `description` | 
| _polymathRegistry | address | Address of the Polymath registry | 
| _isCostInPoly | bool | true = cost in Poly, false = USD | 

### deploy

⤾ overrides [IModuleFactory.deploy](IModuleFactory.md#deploy)

used to launch the Module with the help of factory

```js
function deploy(bytes _data) external nonpayable
returns(address)
```

**Returns**

address Contract address of the Module

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _data | bytes |  | 

