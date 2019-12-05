---
id: version-3.0.0-StatusCodes
title: StatusCodes
original_id: StatusCodes
---

# StatusCodes.sol

View Source: [contracts/libraries/StatusCodes.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/libraries/StatusCodes.sol)

**StatusCodes**

**Enums**

### Status

```javascript
enum Status {
 TransferFailure,
 TransferSuccess,
 InsufficientBalance,
 InsufficientAllowance,
 TransfersHalted,
 FundsLocked,
 InvalidSender,
 InvalidReceiver,
 InvalidOperator
}
```

## Functions

* [code\(enum StatusCodes.Status \_status\)](statuscodes.md#code)

### code

```javascript
function code(enum StatusCodes.Status _status) internal pure
returns(bytes1)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_status | enum StatusCodes.Status |  |

