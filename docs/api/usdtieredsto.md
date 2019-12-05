---
id: version-3.0.0-USDTieredSTO
title: USDTieredSTO
original_id: USDTieredSTO
---

# STO module for standard capped crowdsale \(USDTieredSTO.sol\)

View Source: [contracts/modules/STO/USDTiered/USDTieredSTO.sol](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/contracts/modules/STO/USDTiered/USDTieredSTO.sol)

**↗ Extends:** [**USDTieredSTOStorage**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/USDTieredSTOStorage.md)**,** [**STO**](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/STO.md)

**USDTieredSTO**

## Contract Members

**Constants & Variables**

```javascript
string internal constant POLY_ORACLE;
string internal constant ETH_ORACLE;
```

**Events**

```javascript
event SetAllowBeneficialInvestments(bool  _allowed);
event SetNonAccreditedLimit(address  _investor, uint256  _limit);
event TokenPurchase(address indexed _purchaser, address indexed _beneficiary, uint256  _tokens, uint256  _usdAmount, uint256  _tierPrice, uint256  _tier);
event FundsReceived(address indexed _purchaser, address indexed _beneficiary, uint256  _usdAmount, enum ISTO.FundRaiseType  _fundRaiseType, uint256  _receivedValue, uint256  _spentValue, uint256  _rate);
event ReserveTokenMint(address indexed _owner, address indexed _wallet, uint256  _tokens, uint256  _latestTier);
event SetAddresses(address indexed _wallet, IERC20[]  _usdTokens);
event SetLimits(uint256  _nonAccreditedLimitUSD, uint256  _minimumInvestmentUSD);
event SetTimes(uint256  _startTime, uint256  _endTime);
event SetTiers(uint256[]  _ratePerTier, uint256[]  _ratePerTierDiscountPoly, uint256[]  _tokensPerTierTotal, uint256[]  _tokensPerTierDiscountPoly);
event SetTreasuryWallet(address  _oldWallet, address  _newWallet);
```

## Modifiers

* [validETH](usdtieredsto.md#valideth)
* [validPOLY](usdtieredsto.md#validpoly)
* [validSC](usdtieredsto.md#validsc)

### validETH

```javascript
modifier validETH() internal
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### validPOLY

```javascript
modifier validPOLY() internal
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### validSC

```javascript
modifier validSC(address _usdToken) internal
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_usdToken | address |  |

## Functions

* [\(address \_securityToken, address \_polyAddress\)](usdtieredsto.md)
* [configure\(uint256 \_startTime, uint256 \_endTime, uint256\[\] \_ratePerTier, uint256\[\] \_ratePerTierDiscountPoly, uint256\[\] \_tokensPerTierTotal, uint256\[\] \_tokensPerTierDiscountPoly, uint256 \_nonAccreditedLimitUSD, uint256 \_minimumInvestmentUSD, enum ISTO.FundRaiseType\[\] \_fundRaiseTypes, address payable \_wallet, address \_treasuryWallet, IERC20\[\] \_usdTokens\)](usdtieredsto.md#configure)
* [modifyFunding\(enum ISTO.FundRaiseType\[\] \_fundRaiseTypes\)](usdtieredsto.md#modifyfunding)
* [modifyLimits\(uint256 \_nonAccreditedLimitUSD, uint256 \_minimumInvestmentUSD\)](usdtieredsto.md#modifylimits)
* [modifyTiers\(uint256\[\] \_ratePerTier, uint256\[\] \_ratePerTierDiscountPoly, uint256\[\] \_tokensPerTierTotal, uint256\[\] \_tokensPerTierDiscountPoly\)](usdtieredsto.md#modifytiers)
* [modifyTimes\(uint256 \_startTime, uint256 \_endTime\)](usdtieredsto.md#modifytimes)
* [\_isSTOStarted\(\)](usdtieredsto.md#_isstostarted)
* [modifyAddresses\(address payable \_wallet, address \_treasuryWallet, IERC20\[\] \_usdTokens\)](usdtieredsto.md#modifyaddresses)
* [modifyOracle\(enum ISTO.FundRaiseType \_fundRaiseType, address \_oracleAddress\)](usdtieredsto.md#modifyoracle)
* [\_modifyLimits\(uint256 \_nonAccreditedLimitUSD, uint256 \_minimumInvestmentUSD\)](usdtieredsto.md#_modifylimits)
* [\_modifyTiers\(uint256\[\] \_ratePerTier, uint256\[\] \_ratePerTierDiscountPoly, uint256\[\] \_tokensPerTierTotal, uint256\[\] \_tokensPerTierDiscountPoly\)](usdtieredsto.md#_modifytiers)
* [\_modifyTimes\(uint256 \_startTime, uint256 \_endTime\)](usdtieredsto.md#_modifytimes)
* [\_modifyAddresses\(address payable \_wallet, address \_treasuryWallet, IERC20\[\] \_usdTokens\)](usdtieredsto.md#_modifyaddresses)
* [\_modifyUSDTokens\(IERC20\[\] \_usdTokens\)](usdtieredsto.md#_modifyusdtokens)
* [finalize\(\)](usdtieredsto.md#finalize)
* [changeNonAccreditedLimit\(address\[\] \_investors, uint256\[\] \_nonAccreditedLimit\)](usdtieredsto.md#changenonaccreditedlimit)
* [getAccreditedData\(\)](usdtieredsto.md#getaccrediteddata)
* [changeAllowBeneficialInvestments\(bool \_allowBeneficialInvestments\)](usdtieredsto.md#changeallowbeneficialinvestments)
* [\(\)](usdtieredsto.md)
* [buyWithETH\(address \_beneficiary\)](usdtieredsto.md#buywitheth)
* [buyWithPOLY\(address \_beneficiary, uint256 \_investedPOLY\)](usdtieredsto.md#buywithpoly)
* [buyWithUSD\(address \_beneficiary, uint256 \_investedSC, IERC20 \_usdToken\)](usdtieredsto.md#buywithusd)
* [buyWithETHRateLimited\(address \_beneficiary, uint256 \_minTokens\)](usdtieredsto.md#buywithethratelimited)
* [buyWithPOLYRateLimited\(address \_beneficiary, uint256 \_investedPOLY, uint256 \_minTokens\)](usdtieredsto.md#buywithpolyratelimited)
* [buyWithUSDRateLimited\(address \_beneficiary, uint256 \_investedSC, uint256 \_minTokens, IERC20 \_usdToken\)](usdtieredsto.md#buywithusdratelimited)
* [\_buyWithTokens\(address \_beneficiary, uint256 \_tokenAmount, enum ISTO.FundRaiseType \_fundRaiseType, uint256 \_minTokens, IERC20 \_token\)](usdtieredsto.md#_buywithtokens)
* [\_getSpentvalues\(address \_beneficiary, uint256 \_amount, enum ISTO.FundRaiseType \_fundRaiseType, uint256 \_minTokens\)](usdtieredsto.md#_getspentvalues)
* [\_buyTokens\(address \_beneficiary, uint256 \_investmentValue, uint256 \_rate, enum ISTO.FundRaiseType \_fundRaiseType\)](usdtieredsto.md#_buytokens)
* [\_buyTokensChecks\(address \_beneficiary, uint256 \_investmentValue, uint256 investedUSD\)](usdtieredsto.md#_buytokenschecks)
* [\_calculateTier\(address \_beneficiary, uint256 \_tier, uint256 \_investedUSD, enum ISTO.FundRaiseType \_fundRaiseType\)](usdtieredsto.md#_calculatetier)
* [\_purchaseTier\(address \_beneficiary, uint256 \_tierPrice, uint256 \_tierRemaining, uint256 \_investedUSD, uint256 \_tier\)](usdtieredsto.md#_purchasetier)
* [\_isAccredited\(address \_investor\)](usdtieredsto.md#_isaccredited)
* [\_getIsAccredited\(address \_investor, IDataStore dataStore\)](usdtieredsto.md#_getisaccredited)
* [isOpen\(\)](usdtieredsto.md#isopen)
* [capReached\(\)](usdtieredsto.md#capreached)
* [getRate\(enum ISTO.FundRaiseType \_fundRaiseType\)](usdtieredsto.md#getrate)
* [convertToUSD\(enum ISTO.FundRaiseType \_fundRaiseType, uint256 \_amount\)](usdtieredsto.md#converttousd)
* [convertFromUSD\(enum ISTO.FundRaiseType \_fundRaiseType, uint256 \_amount\)](usdtieredsto.md#convertfromusd)
* [getTokensSold\(\)](usdtieredsto.md#gettokenssold)
* [getTokensMinted\(\)](usdtieredsto.md#gettokensminted)
* [getTokensSoldFor\(enum ISTO.FundRaiseType \_fundRaiseType\)](usdtieredsto.md#gettokenssoldfor)
* [getTokensMintedByTier\(uint256 \_tier\)](usdtieredsto.md#gettokensmintedbytier)
* [getTokensSoldByTier\(uint256 \_tier\)](usdtieredsto.md#gettokenssoldbytier)
* [getNumberOfTiers\(\)](usdtieredsto.md#getnumberoftiers)
* [getUsdTokens\(\)](usdtieredsto.md#getusdtokens)
* [getPermissions\(\)](usdtieredsto.md#getpermissions)
* [getSTODetails\(\)](usdtieredsto.md#getstodetails)
* [getInitFunction\(\)](usdtieredsto.md#getinitfunction)
* [\_getOracle\(bytes32 \_currency, bytes32 \_denominatedCurrency\)](usdtieredsto.md#_getoracle)

```javascript
function (address _securityToken, address _polyAddress) public nonpayable Module
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_securityToken | address |  |
| \_polyAddress | address |  |

### configure

Function used to intialize the contract variables

```javascript
function configure(uint256 _startTime, uint256 _endTime, uint256[] _ratePerTier, uint256[] _ratePerTierDiscountPoly, uint256[] _tokensPerTierTotal, uint256[] _tokensPerTierDiscountPoly, uint256 _nonAccreditedLimitUSD, uint256 _minimumInvestmentUSD, enum ISTO.FundRaiseType[] _fundRaiseTypes, address payable _wallet, address _treasuryWallet, IERC20[] _usdTokens) public nonpayable onlyFactory
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_startTime | uint256 | Unix timestamp at which offering get started |
| \_endTime | uint256 | Unix timestamp at which offering get ended |
| \_ratePerTier | uint256\[\] | Rate \(in USD\) per tier \( _10\*_18\) |
| \_ratePerTierDiscountPoly | uint256\[\] |  |
| \_tokensPerTierTotal | uint256\[\] | Tokens available in each tier |
| \_tokensPerTierDiscountPoly | uint256\[\] |  |
| \_nonAccreditedLimitUSD | uint256 | Limit in USD \( _10\*_18\) for non-accredited investors |
| \_minimumInvestmentUSD | uint256 | Minimun investment in USD \( _10\*_18\) |
| \_fundRaiseTypes | enum ISTO.FundRaiseType\[\] | Types of currency used to collect the funds |
| \_wallet | address payable | Ethereum account address to hold the funds |
| \_treasuryWallet | address | Ethereum account address to receive unsold tokens |
| \_usdTokens | IERC20\[\] | Contract address of the stable coins |

### modifyFunding

Modifies fund raise types

```javascript
function modifyFunding(enum ISTO.FundRaiseType[] _fundRaiseTypes) external nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_fundRaiseTypes | enum ISTO.FundRaiseType\[\] | Array of fund raise types to allow |

### modifyLimits

modifies max non accredited invets limit and overall minimum investment limit

```javascript
function modifyLimits(uint256 _nonAccreditedLimitUSD, uint256 _minimumInvestmentUSD) external nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_nonAccreditedLimitUSD | uint256 | max non accredited invets limit |
| \_minimumInvestmentUSD | uint256 | overall minimum investment limit |

### modifyTiers

modifiers STO tiers. All tiers must be passed, can not edit specific tiers.

```javascript
function modifyTiers(uint256[] _ratePerTier, uint256[] _ratePerTierDiscountPoly, uint256[] _tokensPerTierTotal, uint256[] _tokensPerTierDiscountPoly) external nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_ratePerTier | uint256\[\] | Array of rates per tier |
| \_ratePerTierDiscountPoly | uint256\[\] | Array of discounted poly rates per tier |
| \_tokensPerTierTotal | uint256\[\] | Array of total tokens per tier |
| \_tokensPerTierDiscountPoly | uint256\[\] | Array of discounted tokens per tier |

### modifyTimes

Modifies STO start and end times

```javascript
function modifyTimes(uint256 _startTime, uint256 _endTime) external nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_startTime | uint256 | start time of sto |
| \_endTime | uint256 | end time of sto |

### \_isSTOStarted

```javascript
function _isSTOStarted() internal view
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### modifyAddresses

Modifies addresses used as wallet, reserve wallet and usd token

```javascript
function modifyAddresses(address payable _wallet, address _treasuryWallet, IERC20[] _usdTokens) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_wallet | address payable | Address of wallet where funds are sent |
| \_treasuryWallet | address | Address of wallet where unsold tokens are sent |
| \_usdTokens | IERC20\[\] | Address of usd tokens |

### modifyOracle

Modifies Oracle address. By default, Polymath oracles are used but issuer can overide them using this function Set \_oracleAddress to 0x0 to fallback to using Polymath oracles

```javascript
function modifyOracle(enum ISTO.FundRaiseType _fundRaiseType, address _oracleAddress) external nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_fundRaiseType | enum ISTO.FundRaiseType | Actual currency |
| \_oracleAddress | address | address of the oracle |

### \_modifyLimits

```javascript
function _modifyLimits(uint256 _nonAccreditedLimitUSD, uint256 _minimumInvestmentUSD) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_nonAccreditedLimitUSD | uint256 |  |
| \_minimumInvestmentUSD | uint256 |  |

### \_modifyTiers

```javascript
function _modifyTiers(uint256[] _ratePerTier, uint256[] _ratePerTierDiscountPoly, uint256[] _tokensPerTierTotal, uint256[] _tokensPerTierDiscountPoly) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_ratePerTier | uint256\[\] |  |
| \_ratePerTierDiscountPoly | uint256\[\] |  |
| \_tokensPerTierTotal | uint256\[\] |  |
| \_tokensPerTierDiscountPoly | uint256\[\] |  |

### \_modifyTimes

```javascript
function _modifyTimes(uint256 _startTime, uint256 _endTime) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_startTime | uint256 |  |
| \_endTime | uint256 |  |

### \_modifyAddresses

```javascript
function _modifyAddresses(address payable _wallet, address _treasuryWallet, IERC20[] _usdTokens) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_wallet | address payable |  |
| \_treasuryWallet | address |  |
| \_usdTokens | IERC20\[\] |  |

### \_modifyUSDTokens

```javascript
function _modifyUSDTokens(IERC20[] _usdTokens) internal nonpayable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_usdTokens | IERC20\[\] |  |

### finalize

Finalizes the STO and mint remaining tokens to treasury address

```javascript
function finalize() external nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### changeNonAccreditedLimit

Modifies the list of overrides for non-accredited limits in USD

```javascript
function changeNonAccreditedLimit(address[] _investors, uint256[] _nonAccreditedLimit) external nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_investors | address\[\] | Array of investor addresses to modify |
| \_nonAccreditedLimit | uint256\[\] | Array of uints specifying non-accredited limits |

### getAccreditedData

Returns investor accredited & non-accredited override informatiomn

```javascript
function getAccreditedData() external view
returns(investors address[], accredited bool[], overrides uint256[])
```

**Returns**

investors list of all configured investors

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### changeAllowBeneficialInvestments

Function to set allowBeneficialInvestments \(allow beneficiary to be different to funder\)

```javascript
function changeAllowBeneficialInvestments(bool _allowBeneficialInvestments) external nonpayable withPerm
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_allowBeneficialInvestments | bool | Boolean to allow or disallow beneficial investments |

fallback function - assumes ETH being invested

```javascript
function () external payable
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### buyWithETH

```javascript
function buyWithETH(address _beneficiary) external payable
returns(uint256, uint256, uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_beneficiary | address |  |

### buyWithPOLY

```javascript
function buyWithPOLY(address _beneficiary, uint256 _investedPOLY) external nonpayable
returns(uint256, uint256, uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_beneficiary | address |  |
| \_investedPOLY | uint256 |  |

### buyWithUSD

```javascript
function buyWithUSD(address _beneficiary, uint256 _investedSC, IERC20 _usdToken) external nonpayable
returns(uint256, uint256, uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_beneficiary | address |  |
| \_investedSC | uint256 |  |
| \_usdToken | IERC20 |  |

### buyWithETHRateLimited

Purchase tokens using ETH

```javascript
function buyWithETHRateLimited(address _beneficiary, uint256 _minTokens) public payable validETH 
returns(uint256, uint256, uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_beneficiary | address | Address where security tokens will be sent |
| \_minTokens | uint256 | Minumum number of tokens to buy or else revert |

### buyWithPOLYRateLimited

Purchase tokens using POLY

```javascript
function buyWithPOLYRateLimited(address _beneficiary, uint256 _investedPOLY, uint256 _minTokens) public nonpayable validPOLY 
returns(uint256, uint256, uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_beneficiary | address | Address where security tokens will be sent |
| \_investedPOLY | uint256 | Amount of POLY invested |
| \_minTokens | uint256 | Minumum number of tokens to buy or else revert |

### buyWithUSDRateLimited

Purchase tokens using Stable coins

```javascript
function buyWithUSDRateLimited(address _beneficiary, uint256 _investedSC, uint256 _minTokens, IERC20 _usdToken) public nonpayable validSC 
returns(uint256, uint256, uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_beneficiary | address | Address where security tokens will be sent |
| \_investedSC | uint256 | Amount of Stable coins invested |
| \_minTokens | uint256 | Minumum number of tokens to buy or else revert |
| \_usdToken | IERC20 | Address of USD stable coin to buy tokens with |

### \_buyWithTokens

```javascript
function _buyWithTokens(address _beneficiary, uint256 _tokenAmount, enum ISTO.FundRaiseType _fundRaiseType, uint256 _minTokens, IERC20 _token) internal nonpayable
returns(uint256, uint256, uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_beneficiary | address |  |
| \_tokenAmount | uint256 |  |
| \_fundRaiseType | enum ISTO.FundRaiseType |  |
| \_minTokens | uint256 |  |
| \_token | IERC20 |  |

### \_getSpentvalues

```javascript
function _getSpentvalues(address _beneficiary, uint256 _amount, enum ISTO.FundRaiseType _fundRaiseType, uint256 _minTokens) internal nonpayable
returns(rate uint256, spentUSD uint256, spentValue uint256, initialMinted uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_beneficiary | address |  |
| \_amount | uint256 |  |
| \_fundRaiseType | enum ISTO.FundRaiseType |  |
| \_minTokens | uint256 |  |

### \_buyTokens

Low level token purchase

```javascript
function _buyTokens(address _beneficiary, uint256 _investmentValue, uint256 _rate, enum ISTO.FundRaiseType _fundRaiseType) internal nonpayable whenNotPaused 
returns(spentUSD uint256, spentValue uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_beneficiary | address | Address where security tokens will be sent |
| \_investmentValue | uint256 | Amount of POLY, ETH or Stable coins invested |
| \_rate | uint256 |  |
| \_fundRaiseType | enum ISTO.FundRaiseType | Fund raise type \(POLY, ETH, SC\) |

### \_buyTokensChecks

```javascript
function _buyTokensChecks(address _beneficiary, uint256 _investmentValue, uint256 investedUSD) internal view
returns(netInvestedUSD uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_beneficiary | address |  |
| \_investmentValue | uint256 |  |
| investedUSD | uint256 |  |

### \_calculateTier

```javascript
function _calculateTier(address _beneficiary, uint256 _tier, uint256 _investedUSD, enum ISTO.FundRaiseType _fundRaiseType) internal nonpayable
returns(spentUSD uint256, gotoNextTier bool)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_beneficiary | address |  |
| \_tier | uint256 |  |
| \_investedUSD | uint256 |  |
| \_fundRaiseType | enum ISTO.FundRaiseType |  |

### \_purchaseTier

```javascript
function _purchaseTier(address _beneficiary, uint256 _tierPrice, uint256 _tierRemaining, uint256 _investedUSD, uint256 _tier) internal nonpayable
returns(spentUSD uint256, purchasedTokens uint256, gotoNextTier bool)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_beneficiary | address |  |
| \_tierPrice | uint256 |  |
| \_tierRemaining | uint256 |  |
| \_investedUSD | uint256 |  |
| \_tier | uint256 |  |

### \_isAccredited

```javascript
function _isAccredited(address _investor) internal view
returns(bool)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_investor | address |  |

### \_getIsAccredited

```javascript
function _getIsAccredited(address _investor, IDataStore dataStore) internal view
returns(bool)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_investor | address |  |
| dataStore | IDataStore |  |

### isOpen

This function returns whether or not the STO is in fundraising mode \(open\)

```javascript
function isOpen() public view
returns(bool)
```

**Returns**

bool Whether the STO is accepting investments

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


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


### getRate

returns current conversion rate of funds

```javascript
function getRate(enum ISTO.FundRaiseType _fundRaiseType) public nonpayable
returns(uint256)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_fundRaiseType | enum ISTO.FundRaiseType | Fund raise type to get rate of |

### convertToUSD

This function converts from ETH or POLY to USD

```javascript
function convertToUSD(enum ISTO.FundRaiseType _fundRaiseType, uint256 _amount) public nonpayable
returns(uint256)
```

**Returns**

uint256 Value in USD

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_fundRaiseType | enum ISTO.FundRaiseType | Currency key |
| \_amount | uint256 | Value to convert to USD |

### convertFromUSD

This function converts from USD to ETH or POLY

```javascript
function convertFromUSD(enum ISTO.FundRaiseType _fundRaiseType, uint256 _amount) public nonpayable
returns(uint256)
```

**Returns**

uint256 Value in ETH or POLY

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_fundRaiseType | enum ISTO.FundRaiseType | Currency key |
| \_amount | uint256 | Value to convert from USD |

### getTokensSold

⤾ overrides [STO.getTokensSold](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/STO.md#gettokenssold)

Return the total no. of tokens sold

```javascript
function getTokensSold() public view
returns(uint256)
```

**Returns**

uint256 Total number of tokens sold

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### getTokensMinted

Return the total no. of tokens minted

```javascript
function getTokensMinted() public view
returns(tokensMinted uint256)
```

**Returns**

uint256 Total number of tokens minted

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### getTokensSoldFor

Return the total no. of tokens sold for the given fund raise type param \_fundRaiseType The fund raising currency \(e.g. ETH, POLY, SC\) to calculate sold tokens for

```javascript
function getTokensSoldFor(enum ISTO.FundRaiseType _fundRaiseType) external view
returns(tokensSold uint256)
```

**Returns**

uint256 Total number of tokens sold for ETH

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_fundRaiseType | enum ISTO.FundRaiseType |  |

### getTokensMintedByTier

Return array of minted tokens in each fund raise type for given tier param \_tier The tier to return minted tokens for

```javascript
function getTokensMintedByTier(uint256 _tier) external view
returns(uint256[])
```

**Returns**

uint256\[\] array of minted tokens in each fund raise type

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_tier | uint256 |  |

### getTokensSoldByTier

Return the total no. of tokens sold in a given tier param \_tier The tier to calculate sold tokens for

```javascript
function getTokensSoldByTier(uint256 _tier) external view
returns(uint256)
```

**Returns**

uint256 Total number of tokens sold in the tier

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_tier | uint256 |  |

### getNumberOfTiers

Return the total no. of tiers

```javascript
function getNumberOfTiers() external view
returns(uint256)
```

**Returns**

uint256 Total number of tiers

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### getUsdTokens

Return the usd tokens accepted by the STO

```javascript
function getUsdTokens() external view
returns(contract IERC20[])
```

**Returns**

address\[\] usd tokens

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### getPermissions

⤾ overrides [IModule.getPermissions](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModule.md#getpermissions)

Return the permissions flag that are associated with STO

```javascript
function getPermissions() public view
returns(allPermissions bytes32[])
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### getSTODetails

Return the STO details

```javascript
function getSTODetails() external view
returns(uint256, uint256, uint256, uint256[], uint256[], uint256, uint256, uint256, bool[])
```

**Returns**

Unixtimestamp at which offering gets start.

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### getInitFunction

⤾ overrides [IModule.getInitFunction](https://github.com/PolymathNetwork/polymath-core/tree/096ba240a927c98e1f1a182d2efee7c4c4c1dfc5/docs/api/IModule.md#getinitfunction)

This function returns the signature of configure function

```javascript
function getInitFunction() public pure
returns(bytes4)
```

**Returns**

bytes4 Configure function signature

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |


### \_getOracle

```javascript
function _getOracle(bytes32 _currency, bytes32 _denominatedCurrency) internal view
returns(oracleAddress address)
```

**Arguments**

| Name | Type | Description |
| :--- | :--- | :--- |
| \_currency | bytes32 |  |
| \_denominatedCurrency | bytes32 |  |

