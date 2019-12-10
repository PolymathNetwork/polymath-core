---
id: version-3.0.0-ISTFactory
title: ISTFactory
original_id: ISTFactory
---

# Interface for security token proxy deployment (ISTFactory.sol)

View Source: [contracts/interfaces/ISTFactory.sol](../../contracts/interfaces/ISTFactory.sol)

**↘ Derived Contracts: [STFactory](STFactory.md)**

**ISTFactory**

## Functions

- [deployToken(string _name, string _symbol, uint8 _decimals, string _tokenDetails, address _issuer, bool _divisible, address _polymathRegistry)](#deploytoken)

### deployToken

⤿ Overridden Implementation(s): [STFactory.deployToken](STFactory.md#deploytoken)

Deploys the token and adds default modules like permission manager and transfer manager.
Future versions of the proxy can attach different modules or pass some other paramters.

```js
function deployToken(string _name, string _symbol, uint8 _decimals, string _tokenDetails, address _issuer, bool _divisible, address _polymathRegistry) external nonpayable
returns(address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _name | string | is the name of the Security token | 
| _symbol | string | is the symbol of the Security Token | 
| _decimals | uint8 | is the number of decimals of the Security Token | 
| _tokenDetails | string | is the off-chain data associated with the Security Token | 
| _issuer | address | is the owner of the Security Token | 
| _divisible | bool | whether the token is divisible or not | 
| _polymathRegistry | address | is the address of the Polymath Registry contract | 

