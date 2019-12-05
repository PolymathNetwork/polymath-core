---
id: version-3.0.0-ISTO
title: ISTO
original_id: ISTO
---

# Interface to be implemented by all STO modules \(ISTO.sol\)

View Source: [contracts/interfaces/ISTO.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/interfaces/ISTO.sol)

**↘ Derived Contracts:** [**STO**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/STO.md)

**ISTO**

**Enums**

### FundRaiseType

```javascript
enum FundRaiseType {
 ETH,
 POLY,
 SC
}
```

**Events**

```javascript
event SetFundRaiseTypes(enum ISTO.FundRaiseType[]  _fundRaiseTypes);
```

## Functions

* [getTokensSold\(\)](isto.md#gettokenssold)
* [getRaised\(enum ISTO.FundRaiseType \_fundRaiseType\)](isto.md#getraised)
* [pause\(\)](isto.md#pause)

### getTokensSold

⤿ Overridden Implementation\(s\): [CappedSTO.getTokensSold](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/CappedSTO.md#gettokenssold),[DummySTO.getTokensSold](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/DummySTO.md#gettokenssold),[PreSaleSTO.getTokensSold](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/PreSaleSTO.md#gettokenssold),[STO.getTokensSold](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/STO.md#gettokenssold),[USDTieredSTO.getTokensSold](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/USDTieredSTO.md#gettokenssold)

Returns the total no. of tokens sold

```javascript
function getTokensSold() external view
returns(soldTokens uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### getRaised

⤿ Overridden Implementation\(s\): [STO.getRaised](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/STO.md#getraised)

Returns funds raised by the STO

```javascript
function getRaised(enum ISTO.FundRaiseType _fundRaiseType) external view
returns(raisedAmount uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_fundRaiseType | enum ISTO.FundRaiseType |  |

### pause

⤿ Overridden Implementation\(s\): [Module.pause](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/Module.md#pause),[STO.pause](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/STO.md#pause)

Pause \(overridden function\)

```javascript
function pause() external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


