---
id: version-3.0.0-MockRedemptionManager
title: MockRedemptionManager
original_id: MockRedemptionManager
---

# Burn module for burning tokens and keeping track of burnt amounts \(MockRedemptionManager.sol\)

View Source: [contracts/mocks/MockRedemptionManager.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/mocks/MockRedemptionManager.sol)

**↗ Extends:** [**TrackedRedemption**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/TrackedRedemption.md)

**MockRedemptionManager**

## Contract Members

**Constants & Variables**

```javascript
mapping(address => uint256) internal tokenToRedeem;
mapping(address => mapping(bytes32 => uint256)) internal redeemedTokensByPartition;
```

**Events**

```javascript
event RedeemedTokenByOwner(address  _investor, address  _byWhoom, uint256  _value);
event RedeemedTokensByPartition(address indexed _investor, address indexed _operator, bytes32  _partition, uint256  _value, bytes  _data, bytes  _operatorData);
```

## Functions

* [\(address \_securityToken, address \_polyToken\)](mockredemptionmanager.md)
* [transferToRedeem\(uint256 \_value\)](mockredemptionmanager.md#transfertoredeem)
* [redeemTokenByOwner\(uint256 \_value\)](mockredemptionmanager.md#redeemtokenbyowner)
* [redeemTokensByPartition\(uint256 \_value, bytes32 \_partition, bytes \_data\)](mockredemptionmanager.md#redeemtokensbypartition)
* [operatorRedeemTokensByPartition\(uint256 \_value, bytes32 \_partition, bytes \_data, bytes \_operatorData\)](mockredemptionmanager.md#operatorredeemtokensbypartition)
* [operatorTransferToRedeem\(uint256 \_value, bytes32 \_partition, bytes \_data, bytes \_operatorData\)](mockredemptionmanager.md#operatortransfertoredeem)

Constructor

```javascript
function (address _securityToken, address _polyToken) public nonpayable TrackedRedemption
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_securityToken | address | Address of the security token |
| \_polyToken | address |  |

### transferToRedeem

Transfers tokens to Module to burn

```javascript
function transferToRedeem(uint256 _value) public nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_value | uint256 | The number of tokens to redeem |

### redeemTokenByOwner

Used to redeem tokens by the module

```javascript
function redeemTokenByOwner(uint256 _value) public nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_value | uint256 | The number of tokens to redeem |

### redeemTokensByPartition

To redeem tokens and track redemptions

```javascript
function redeemTokensByPartition(uint256 _value, bytes32 _partition, bytes _data) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_value | uint256 | The number of tokens to redeem |
| \_partition | bytes32 | Partition from which balance will be deducted |
| \_data | bytes | Extra data parmeter pass to do some offchain operation |

### operatorRedeemTokensByPartition

To redeem tokens and track redemptions

```javascript
function operatorRedeemTokensByPartition(uint256 _value, bytes32 _partition, bytes _data, bytes _operatorData) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_value | uint256 | The number of tokens to redeem |
| \_partition | bytes32 | Partition from which balance will be deducted |
| \_data | bytes | Extra data parmeter pass to do some offchain operation |
| \_operatorData | bytes | Data to log the operator call |

### operatorTransferToRedeem

```javascript
function operatorTransferToRedeem(uint256 _value, bytes32 _partition, bytes _data, bytes _operatorData) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_value | uint256 |  |
| \_partition | bytes32 |  |
| \_data | bytes |  |
| \_operatorData | bytes |  |

