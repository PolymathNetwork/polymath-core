---
id: version-3.0.0-AddressUtils
title: AddressUtils
original_id: AddressUtils
---

# AddressUtils.sol

View Source: [openzeppelin-solidity/contracts/AddressUtils.sol](../../openzeppelin-solidity/contracts/AddressUtils.sol)

**AddressUtils**

## Functions

- [isContract(address addr)](#iscontract)

### isContract

This function will return false if invoked during the constructor of a contract,
 as the code is not actually created until after the constructor finishes.

```js
function isContract(address addr) internal view
returns(bool)
```

**Returns**

whether the target address is a contract

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| addr | address | address to check | 

