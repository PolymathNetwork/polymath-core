---
id: version-3.0.0-StatusCodes
title: StatusCodes
original_id: StatusCodes
---

# StatusCodes.sol

View Source: [contracts/libraries/StatusCodes.sol](../../contracts/libraries/StatusCodes.sol)

**StatusCodes**

**Enums**
### Status

```js
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

- [code(enum StatusCodes.Status _status)](#code)

### code

```js
function code(enum StatusCodes.Status _status) internal pure
returns(bytes1)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _status | enum StatusCodes.Status |  | 

