---
id: version-3.0.0-Address
title: Address
original_id: Address
---

# Address.sol

View Source: [openzeppelin-solidity/contracts/utils/Address.sol](../../openzeppelin-solidity/contracts/utils/Address.sol)

**Address**

## Functions

- [isContract(address account)](#iscontract)

### isContract

This function will return false if invoked during the constructor of a contract,
as the code is not actually created until after the constructor finishes.

```js
function isContract(address account) internal view
returns(bool)
```

**Returns**

whether the target address is a contract

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| account | address | address of the account to check | 

