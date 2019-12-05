---
id: version-3.0.0-Address
title: Address
original_id: Address
---

# Address.sol

View Source: [openzeppelin-solidity/contracts/utils/Address.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/openzeppelin-solidity/contracts/utils/Address.sol)

**Address**

## Functions

* [isContract\(address account\)](address.md#iscontract)

### isContract

This function will return false if invoked during the constructor of a contract, as the code is not actually created until after the constructor finishes.

```javascript
function isContract(address account) internal view
returns(bool)
```

**Returns**

whether the target address is a contract

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| account | address | address of the account to check |

