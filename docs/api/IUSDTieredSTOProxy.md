---
id: version-3.0.0-IUSDTieredSTOProxy
title: IUSDTieredSTOProxy
original_id: IUSDTieredSTOProxy
---

# Interface for security token proxy deployment (IUSDTieredSTOProxy.sol)

View Source: [contracts/interfaces/IUSDTieredSTOProxy.sol](../../contracts/interfaces/IUSDTieredSTOProxy.sol)

**IUSDTieredSTOProxy**

## Functions

- [deploySTO(address _securityToken, address _polyAddress, address _factoryAddress)](#deploysto)
- [getInitFunction(address _contractAddress)](#getinitfunction)

### deploySTO

Deploys the STO.

```js
function deploySTO(address _securityToken, address _polyAddress, address _factoryAddress) external nonpayable
returns(address)
```

**Returns**

address Address of the deployed STO

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _securityToken | address | Contract address of the securityToken | 
| _polyAddress | address | Contract address of the PolyToken | 
| _factoryAddress | address | Contract address of the factory | 

### getInitFunction

Used to get the init function signature

```js
function getInitFunction(address _contractAddress) external nonpayable
returns(bytes4)
```

**Returns**

bytes4

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _contractAddress | address | Address of the STO contract | 

