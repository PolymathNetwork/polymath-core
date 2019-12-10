---
id: version-3.0.0-STFactory
title: STFactory
original_id: STFactory
---

# Proxy for deploying SecurityToken instances (STFactory.sol)

View Source: [contracts/tokens/STFactory.sol](../../contracts/tokens/STFactory.sol)

**↗ Extends: [ISTFactory](ISTFactory.md)**

**STFactory**

## Contract Members
**Constants & Variables**

```js
address public transferManagerFactory;

```

## Functions

- [deployToken(string _name, string _symbol, uint8 _decimals, string _tokenDetails, address _issuer, bool _divisible, address _polymathRegistry)](#deploytoken)

### deployToken

⤾ overrides [ISTFactory.deployToken](ISTFactory.md#deploytoken)

deploys the token and adds default modules like the GeneralTransferManager.
Future versions of the proxy can attach different modules or pass different parameters.

```js
function deployToken(string _name, string _symbol, uint8 _decimals, string _tokenDetails, address _issuer, bool _divisible, address _polymathRegistry) external nonpayable
returns(address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _name | string |  | 
| _symbol | string |  | 
| _decimals | uint8 |  | 
| _tokenDetails | string |  | 
| _issuer | address |  | 
| _divisible | bool |  | 
| _polymathRegistry | address |  | 

