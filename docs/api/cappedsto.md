---
id: version-3.0.0-CappedSTO
title: CappedSTO
original_id: CappedSTO
---

# STO module for standard capped crowdsale \(CappedSTO.sol\)

View Source: [contracts/modules/STO/Capped/CappedSTO.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/modules/STO/Capped/CappedSTO.sol)

**↗ Extends:** [**CappedSTOStorage**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/CappedSTOStorage.md)**,** [**STO**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/STO.md)**,** [**ReentrancyGuard**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/ReentrancyGuard.md)

**CappedSTO**

**Events**

```javascript
event TokenPurchase(address indexed purchaser, address indexed beneficiary, uint256  value, uint256  amount);
event SetAllowBeneficialInvestments(bool  _allowed);
```

## Functions

* [\(address \_securityToken, address \_polyToken\)](cappedsto.md)
* [\(\)](cappedsto.md)
* [configure\(uint256 \_startTime, uint256 \_endTime, uint256 \_cap, uint256 \_rate, enum ISTO.FundRaiseType\[\] \_fundRaiseTypes, address payable \_fundsReceiver\)](cappedsto.md#configure)
* [getInitFunction\(\)](cappedsto.md#getinitfunction)
* [changeAllowBeneficialInvestments\(bool \_allowBeneficialInvestments\)](cappedsto.md#changeallowbeneficialinvestments)
* [buyTokens\(address \_beneficiary\)](cappedsto.md#buytokens)
* [buyTokensWithPoly\(uint256 \_investedPOLY\)](cappedsto.md#buytokenswithpoly)
* [capReached\(\)](cappedsto.md#capreached)
* [getTokensSold\(\)](cappedsto.md#gettokenssold)
* [getPermissions\(\)](cappedsto.md#getpermissions)
* [getSTODetails\(\)](cappedsto.md#getstodetails)
* [\_processTx\(address \_beneficiary, uint256 \_investedAmount\)](cappedsto.md#_processtx)
* [\_preValidatePurchase\(address \_beneficiary, uint256 \_investedAmount\)](cappedsto.md#_prevalidatepurchase)
* [\_deliverTokens\(address \_beneficiary, uint256 \_tokenAmount\)](cappedsto.md#_delivertokens)
* [\_processPurchase\(address \_beneficiary, uint256 \_tokenAmount\)](cappedsto.md#_processpurchase)
* [\_getTokenAmount\(uint256 \_investedAmount\)](cappedsto.md#_gettokenamount)
* [\_forwardFunds\(uint256 \_refund\)](cappedsto.md#_forwardfunds)
* [\_forwardPoly\(address \_beneficiary, address \_to, uint256 \_fundsAmount\)](cappedsto.md#_forwardpoly)

```javascript
function (address _securityToken, address _polyToken) public nonpayable Module
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_securityToken | address |  |
| \_polyToken | address |  |

fallback function _**DO NOT OVERRIDE**_

```javascript
function () external payable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### configure

Function used to intialize the contract variables

```javascript
function configure(uint256 _startTime, uint256 _endTime, uint256 _cap, uint256 _rate, enum ISTO.FundRaiseType[] _fundRaiseTypes, address payable _fundsReceiver) public nonpayable onlyFactory
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_startTime | uint256 | Unix timestamp at which offering get started |
| \_endTime | uint256 | Unix timestamp at which offering get ended |
| \_cap | uint256 | Maximum No. of token base units for sale |
| \_rate | uint256 | Token units a buyer gets multiplied by 10^18 per wei / base unit of POLY |
| \_fundRaiseTypes | enum ISTO.FundRaiseType\[\] | Type of currency used to collect the funds |
| \_fundsReceiver | address payable | Ethereum account address to hold the funds |

### getInitFunction

⤾ overrides [IModule.getInitFunction](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModule.md#getinitfunction)

This function returns the signature of configure function

```javascript
function getInitFunction() public pure
returns(bytes4)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### changeAllowBeneficialInvestments

Function to set allowBeneficialInvestments \(allow beneficiary to be different to funder\)

```javascript
function changeAllowBeneficialInvestments(bool _allowBeneficialInvestments) public nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_allowBeneficialInvestments | bool | Boolean to allow or disallow beneficial investments |

### buyTokens

Low level token purchase _**DO NOT OVERRIDE**_

```javascript
function buyTokens(address _beneficiary) public payable whenNotPaused nonReentrant
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_beneficiary | address | Address performing the token purchase |

### buyTokensWithPoly

low level token purchase

```javascript
function buyTokensWithPoly(uint256 _investedPOLY) public nonpayable whenNotPaused nonReentrant
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_investedPOLY | uint256 | Amount of POLY invested |

### capReached

Checks whether the cap has been reached.

```javascript
function capReached() public view
returns(bool)
```

**Returns**

bool Whether the cap was reached

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### getTokensSold

⤾ overrides [STO.getTokensSold](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/STO.md#gettokenssold)

Return the total no. of tokens sold

```javascript
function getTokensSold() external view
returns(uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### getPermissions

⤾ overrides [IModule.getPermissions](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModule.md#getpermissions)

Return the permissions flag that are associated with STO

```javascript
function getPermissions() public view
returns(bytes32[])
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### getSTODetails

Return the STO details

```javascript
function getSTODetails() public view
returns(uint256, uint256, uint256, uint256, uint256, uint256, uint256, bool)
```

**Returns**

Unixtimestamp at which offering gets start.

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### \_processTx

```javascript
function _processTx(address _beneficiary, uint256 _investedAmount) internal nonpayable
returns(refund uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_beneficiary | address | Address performing the token purchase |
| \_investedAmount | uint256 | Value in wei involved in the purchase |

### \_preValidatePurchase

Validation of an incoming purchase. Use require statements to revert state when conditions are not met. Use super to concatenate validations.

```javascript
function _preValidatePurchase(address _beneficiary, uint256 _investedAmount) internal view
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_beneficiary | address | Address performing the token purchase |
| \_investedAmount | uint256 | Value in wei involved in the purchase |

### \_deliverTokens

Source of tokens. Override this method to modify the way in which the crowdsale ultimately gets and sends its tokens.

```javascript
function _deliverTokens(address _beneficiary, uint256 _tokenAmount) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_beneficiary | address | Address performing the token purchase |
| \_tokenAmount | uint256 | Number of tokens to be emitted |

### \_processPurchase

Executed when a purchase has been validated and is ready to be executed. Not necessarily emits/sends tokens.

```javascript
function _processPurchase(address _beneficiary, uint256 _tokenAmount) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_beneficiary | address | Address receiving the tokens |
| \_tokenAmount | uint256 | Number of tokens to be purchased |

### \_getTokenAmount

Overrides to extend the way in which ether is converted to tokens.

```javascript
function _getTokenAmount(uint256 _investedAmount) internal view
returns(tokens uint256, refund uint256)
```

**Returns**

Number of tokens that can be purchased with the specified \_investedAmount

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_investedAmount | uint256 | Value in wei to be converted into tokens |

### \_forwardFunds

Determines how ETH is stored/forwarded on purchases.

```javascript
function _forwardFunds(uint256 _refund) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_refund | uint256 |  |

### \_forwardPoly

Internal function used to forward the POLY raised to beneficiary address

```javascript
function _forwardPoly(address _beneficiary, address _to, uint256 _fundsAmount) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_beneficiary | address | Address of the funds reciever |
| \_to | address | Address who wants to ST-20 tokens |
| \_fundsAmount | uint256 | Amount invested by \_to |

