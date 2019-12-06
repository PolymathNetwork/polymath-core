---
id: version-3.0.0-KYCTransferManagerFactory
title: KYCTransferManagerFactory
original_id: KYCTransferManagerFactory
---

# KYCTransferManagerFactory.sol

View Source: [contracts/modules/Experimental/TransferManager/KYCTransferManagerFactory.sol](../../contracts/modules/Experimental/TransferManager/KYCTransferManagerFactory.sol)

**↗ Extends: [ModuleFactory](ModuleFactory.md)**

**KYCTransferManagerFactory**

## Functions

- [(uint256 _setupCost, address _polymathRegistry, bool _isCostInPoly)](#)
- [deploy(bytes _data)](#deploy)

### 

Constructor

```js
function (uint256 _setupCost, address _polymathRegistry, bool _isCostInPoly) public nonpayable ModuleFactory 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _setupCost | uint256 |  | 
| _polymathRegistry | address |  | 
| _isCostInPoly | bool |  | 

### deploy

⤾ overrides [IModuleFactory.deploy](IModuleFactory.md#deploy)

Used to launch the Module with the help of factory

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

