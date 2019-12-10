---
id: version-3.0.0-USDTieredSTO
title: USDTieredSTO
original_id: USDTieredSTO
---

# STO module for standard capped crowdsale (USDTieredSTO.sol)

View Source: [contracts/modules/STO/USDTieredSTO.sol](../../contracts/modules/STO/USDTieredSTO.sol)

**↗ Extends: [USDTieredSTOStorage](USDTieredSTOStorage.md), [STO](STO.md), [ReentrancyGuard](ReentrancyGuard.md)**

**USDTieredSTO**

## Constructor

```js
constructor(address _securityToken, address _polyAddress) public
```

**Arguments**

## Contract Members
**Constants & Variables**

```js
string public constant POLY_ORACLE;
string public constant ETH_ORACLE;

```

**Events**

```js
event SetAllowBeneficialInvestments(bool  _allowed);
event SetNonAccreditedLimit(address  _investor, uint256  _limit);
event SetAccredited(address  _investor, bool  _accredited);
event TokenPurchase(address indexed _purchaser, address indexed _beneficiary, uint256  _tokens, uint256  _usdAmount, uint256  _tierPrice, uint256  _tier);
event FundsReceived(address indexed _purchaser, address indexed _beneficiary, uint256  _usdAmount, enum STO.FundRaiseType  _fundRaiseType, uint256  _receivedValue, uint256  _spentValue, uint256  _rate);
event ReserveTokenMint(address indexed _owner, address indexed _wallet, uint256  _tokens, uint256  _latestTier);
event SetAddresses(address indexed _wallet, address indexed _reserveWallet, address[]  _usdTokens);
event SetLimits(uint256  _nonAccreditedLimitUSD, uint256  _minimumInvestmentUSD);
event SetTimes(uint256  _startTime, uint256  _endTime);
event SetTiers(uint256[]  _ratePerTier, uint256[]  _ratePerTierDiscountPoly, uint256[]  _tokensPerTierTotal, uint256[]  _tokensPerTierDiscountPoly);
```

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _securityToken | address |  | 
| _polyAddress | address |  | 

## Modifiers

- [validETH](#valideth)
- [validPOLY](#validpoly)
- [validSC](#validsc)

### validETH

```js
modifier validETH() internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### validPOLY

```js
modifier validPOLY() internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### validSC

```js
modifier validSC(address _usdToken) internal
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _usdToken | address |  | 

## Functions

- [configure(uint256 _startTime, uint256 _endTime, uint256[] _ratePerTier, uint256[] _ratePerTierDiscountPoly, uint256[] _tokensPerTierTotal, uint256[] _tokensPerTierDiscountPoly, uint256 _nonAccreditedLimitUSD, uint256 _minimumInvestmentUSD, enum STO.FundRaiseType[] _fundRaiseTypes, address _wallet, address _reserveWallet, address[] _usdTokens)](#configure)
- [modifyFunding(enum STO.FundRaiseType[] _fundRaiseTypes)](#modifyfunding)
- [modifyLimits(uint256 _nonAccreditedLimitUSD, uint256 _minimumInvestmentUSD)](#modifylimits)
- [modifyTiers(uint256[] _ratePerTier, uint256[] _ratePerTierDiscountPoly, uint256[] _tokensPerTierTotal, uint256[] _tokensPerTierDiscountPoly)](#modifytiers)
- [modifyTimes(uint256 _startTime, uint256 _endTime)](#modifytimes)
- [modifyAddresses(address _wallet, address _reserveWallet, address[] _usdTokens)](#modifyaddresses)
- [_modifyLimits(uint256 _nonAccreditedLimitUSD, uint256 _minimumInvestmentUSD)](#_modifylimits)
- [_modifyTiers(uint256[] _ratePerTier, uint256[] _ratePerTierDiscountPoly, uint256[] _tokensPerTierTotal, uint256[] _tokensPerTierDiscountPoly)](#_modifytiers)
- [_modifyTimes(uint256 _startTime, uint256 _endTime)](#_modifytimes)
- [_modifyAddresses(address _wallet, address _reserveWallet, address[] _usdTokens)](#_modifyaddresses)
- [_modifyUSDTokens(address[] _usdTokens)](#_modifyusdtokens)
- [finalize()](#finalize)
- [changeAccredited(address[] _investors, bool[] _accredited)](#changeaccredited)
- [changeNonAccreditedLimit(address[] _investors, uint256[] _nonAccreditedLimit)](#changenonaccreditedlimit)
- [_addToInvestorsList(address _investor)](#_addtoinvestorslist)
- [getAccreditedData()](#getaccrediteddata)
- [changeAllowBeneficialInvestments(bool _allowBeneficialInvestments)](#changeallowbeneficialinvestments)
- [()](#)
- [buyWithETH(address _beneficiary)](#buywitheth)
- [buyWithPOLY(address _beneficiary, uint256 _investedPOLY)](#buywithpoly)
- [buyWithUSD(address _beneficiary, uint256 _investedSC, IERC20 _usdToken)](#buywithusd)
- [buyWithETHRateLimited(address _beneficiary, uint256 _minTokens)](#buywithethratelimited)
- [buyWithPOLYRateLimited(address _beneficiary, uint256 _investedPOLY, uint256 _minTokens)](#buywithpolyratelimited)
- [buyWithUSDRateLimited(address _beneficiary, uint256 _investedSC, uint256 _minTokens, IERC20 _usdToken)](#buywithusdratelimited)
- [_buyWithTokens(address _beneficiary, uint256 _tokenAmount, enum STO.FundRaiseType _fundRaiseType, uint256 _minTokens, IERC20 _token)](#_buywithtokens)
- [_buyTokens(address _beneficiary, uint256 _investmentValue, uint256 _rate, enum STO.FundRaiseType _fundRaiseType)](#_buytokens)
- [buyTokensView(address _beneficiary, uint256 _investmentValue, enum STO.FundRaiseType _fundRaiseType)](#buytokensview)
- [_buyTokensChecks(address _beneficiary, uint256 _investmentValue, uint256 investedUSD)](#_buytokenschecks)
- [_calculateTier(address _beneficiary, uint256 _tier, uint256 _investedUSD, enum STO.FundRaiseType _fundRaiseType)](#_calculatetier)
- [_calculateTierView(uint256 _tier, uint256 _investedUSD, enum STO.FundRaiseType _fundRaiseType)](#_calculatetierview)
- [_purchaseTier(address _beneficiary, uint256 _tierPrice, uint256 _tierRemaining, uint256 _investedUSD, uint256 _tier)](#_purchasetier)
- [_purchaseTierAmount(uint256 _tierPrice, uint256 _tierRemaining, uint256 _investedUSD)](#_purchasetieramount)
- [isOpen()](#isopen)
- [capReached()](#capreached)
- [getRate(enum STO.FundRaiseType _fundRaiseType)](#getrate)
- [convertToUSD(enum STO.FundRaiseType _fundRaiseType, uint256 _amount)](#converttousd)
- [convertFromUSD(enum STO.FundRaiseType _fundRaiseType, uint256 _amount)](#convertfromusd)
- [getTokensSold()](#gettokenssold)
- [getTokensMinted()](#gettokensminted)
- [getTokensSoldFor(enum STO.FundRaiseType _fundRaiseType)](#gettokenssoldfor)
- [getTokensMintedByTier(uint256 _tier)](#gettokensmintedbytier)
- [getTokensSoldByTier(uint256 _tier)](#gettokenssoldbytier)
- [getNumberOfTiers()](#getnumberoftiers)
- [getUsdTokens()](#getusdtokens)
- [getPermissions()](#getpermissions)
- [getSTODetails()](#getstodetails)
- [getInitFunction()](#getinitfunction)
- [_getOracle(bytes32 _currency, bytes32 _denominatedCurrency)](#_getoracle)

### configure

Function used to intialize the contract variables

```js
function configure(uint256 _startTime, uint256 _endTime, uint256[] _ratePerTier, uint256[] _ratePerTierDiscountPoly, uint256[] _tokensPerTierTotal, uint256[] _tokensPerTierDiscountPoly, uint256 _nonAccreditedLimitUSD, uint256 _minimumInvestmentUSD, enum STO.FundRaiseType[] _fundRaiseTypes, address _wallet, address _reserveWallet, address[] _usdTokens) public nonpayable onlyFactory 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _startTime | uint256 | Unix timestamp at which offering get started | 
| _endTime | uint256 | Unix timestamp at which offering get ended | 
| _ratePerTier | uint256[] | Rate (in USD) per tier (* 10**18) | 
| _ratePerTierDiscountPoly | uint256[] |  | 
| _tokensPerTierTotal | uint256[] | Tokens available in each tier | 
| _tokensPerTierDiscountPoly | uint256[] |  | 
| _nonAccreditedLimitUSD | uint256 | Limit in USD (* 10**18) for non-accredited investors | 
| _minimumInvestmentUSD | uint256 | Minimun investment in USD (* 10**18) | 
| _fundRaiseTypes | enum STO.FundRaiseType[] | Types of currency used to collect the funds | 
| _wallet | address | Ethereum account address to hold the funds | 
| _reserveWallet | address | Ethereum account address to receive unsold tokens | 
| _usdTokens | address[] | Array of contract addressess of the stable coins | 

### modifyFunding

Modifies fund raise types

```js
function modifyFunding(enum STO.FundRaiseType[] _fundRaiseTypes) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _fundRaiseTypes | enum STO.FundRaiseType[] | Array of fund raise types to allow | 

### modifyLimits

modifies max non accredited invets limit and overall minimum investment limit

```js
function modifyLimits(uint256 _nonAccreditedLimitUSD, uint256 _minimumInvestmentUSD) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _nonAccreditedLimitUSD | uint256 | max non accredited invets limit | 
| _minimumInvestmentUSD | uint256 | overall minimum investment limit | 

### modifyTiers

modifiers STO tiers. All tiers must be passed, can not edit specific tiers.

```js
function modifyTiers(uint256[] _ratePerTier, uint256[] _ratePerTierDiscountPoly, uint256[] _tokensPerTierTotal, uint256[] _tokensPerTierDiscountPoly) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _ratePerTier | uint256[] | Array of rates per tier | 
| _ratePerTierDiscountPoly | uint256[] | Array of discounted poly rates per tier | 
| _tokensPerTierTotal | uint256[] | Array of total tokens per tier | 
| _tokensPerTierDiscountPoly | uint256[] | Array of discounted tokens per tier | 

### modifyTimes

Modifies STO start and end times

```js
function modifyTimes(uint256 _startTime, uint256 _endTime) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _startTime | uint256 | start time of sto | 
| _endTime | uint256 | end time of sto | 

### modifyAddresses

Modifies addresses used as wallet, reserve wallet and usd token

```js
function modifyAddresses(address _wallet, address _reserveWallet, address[] _usdTokens) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _wallet | address | Address of wallet where funds are sent | 
| _reserveWallet | address | Address of wallet where unsold tokens are sent | 
| _usdTokens | address[] | Address of usd tokens | 

### _modifyLimits

```js
function _modifyLimits(uint256 _nonAccreditedLimitUSD, uint256 _minimumInvestmentUSD) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _nonAccreditedLimitUSD | uint256 |  | 
| _minimumInvestmentUSD | uint256 |  | 

### _modifyTiers

```js
function _modifyTiers(uint256[] _ratePerTier, uint256[] _ratePerTierDiscountPoly, uint256[] _tokensPerTierTotal, uint256[] _tokensPerTierDiscountPoly) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _ratePerTier | uint256[] |  | 
| _ratePerTierDiscountPoly | uint256[] |  | 
| _tokensPerTierTotal | uint256[] |  | 
| _tokensPerTierDiscountPoly | uint256[] |  | 

### _modifyTimes

```js
function _modifyTimes(uint256 _startTime, uint256 _endTime) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _startTime | uint256 |  | 
| _endTime | uint256 |  | 

### _modifyAddresses

```js
function _modifyAddresses(address _wallet, address _reserveWallet, address[] _usdTokens) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _wallet | address |  | 
| _reserveWallet | address |  | 
| _usdTokens | address[] |  | 

### _modifyUSDTokens

```js
function _modifyUSDTokens(address[] _usdTokens) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _usdTokens | address[] |  | 

### finalize

Finalizes the STO and mint remaining tokens to reserve address

```js
function finalize() external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### changeAccredited

Modifies the list of accredited addresses

```js
function changeAccredited(address[] _investors, bool[] _accredited) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investors | address[] | Array of investor addresses to modify | 
| _accredited | bool[] | Array of bools specifying accreditation status | 

### changeNonAccreditedLimit

Modifies the list of overrides for non-accredited limits in USD

```js
function changeNonAccreditedLimit(address[] _investors, uint256[] _nonAccreditedLimit) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investors | address[] | Array of investor addresses to modify | 
| _nonAccreditedLimit | uint256[] | Array of uints specifying non-accredited limits | 

### _addToInvestorsList

```js
function _addToInvestorsList(address _investor) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _investor | address |  | 

### getAccreditedData

Returns investor accredited & non-accredited override informatiomn

```js
function getAccreditedData() external view
returns(address[], bool[], uint256[])
```

**Returns**

address[] list of all configured investors

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### changeAllowBeneficialInvestments

Function to set allowBeneficialInvestments (allow beneficiary to be different to funder)

```js
function changeAllowBeneficialInvestments(bool _allowBeneficialInvestments) external nonpayable onlyOwner 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _allowBeneficialInvestments | bool | Boolean to allow or disallow beneficial investments | 

### 

fallback function - assumes ETH being invested

```js
function () external payable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### buyWithETH

```js
function buyWithETH(address _beneficiary) external payable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _beneficiary | address |  | 

### buyWithPOLY

```js
function buyWithPOLY(address _beneficiary, uint256 _investedPOLY) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _beneficiary | address |  | 
| _investedPOLY | uint256 |  | 

### buyWithUSD

```js
function buyWithUSD(address _beneficiary, uint256 _investedSC, IERC20 _usdToken) external nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _beneficiary | address |  | 
| _investedSC | uint256 |  | 
| _usdToken | IERC20 |  | 

### buyWithETHRateLimited

Purchase tokens using ETH

```js
function buyWithETHRateLimited(address _beneficiary, uint256 _minTokens) public payable validETH 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _beneficiary | address | Address where security tokens will be sent | 
| _minTokens | uint256 | Minumum number of tokens to buy or else revert | 

### buyWithPOLYRateLimited

Purchase tokens using POLY

```js
function buyWithPOLYRateLimited(address _beneficiary, uint256 _investedPOLY, uint256 _minTokens) public nonpayable validPOLY 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _beneficiary | address | Address where security tokens will be sent | 
| _investedPOLY | uint256 | Amount of POLY invested | 
| _minTokens | uint256 | Minumum number of tokens to buy or else revert | 

### buyWithUSDRateLimited

Purchase tokens using Stable coins

```js
function buyWithUSDRateLimited(address _beneficiary, uint256 _investedSC, uint256 _minTokens, IERC20 _usdToken) public nonpayable validSC 
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _beneficiary | address | Address where security tokens will be sent | 
| _investedSC | uint256 | Amount of Stable coins invested | 
| _minTokens | uint256 | Minumum number of tokens to buy or else revert | 
| _usdToken | IERC20 | Address of USD stable coin to buy tokens with | 

### _buyWithTokens

```js
function _buyWithTokens(address _beneficiary, uint256 _tokenAmount, enum STO.FundRaiseType _fundRaiseType, uint256 _minTokens, IERC20 _token) internal nonpayable
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _beneficiary | address |  | 
| _tokenAmount | uint256 |  | 
| _fundRaiseType | enum STO.FundRaiseType |  | 
| _minTokens | uint256 |  | 
| _token | IERC20 |  | 

### _buyTokens

Low level token purchase

```js
function _buyTokens(address _beneficiary, uint256 _investmentValue, uint256 _rate, enum STO.FundRaiseType _fundRaiseType) internal nonpayable nonReentrant whenNotPaused 
returns(spentUSD uint256, spentValue uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _beneficiary | address | Address where security tokens will be sent | 
| _investmentValue | uint256 | Amount of POLY, ETH or Stable coins invested | 
| _rate | uint256 |  | 
| _fundRaiseType | enum STO.FundRaiseType | Fund raise type (POLY, ETH, SC) | 

### buyTokensView

Getter function for buyer to calculate how many tokens will they get

```js
function buyTokensView(address _beneficiary, uint256 _investmentValue, enum STO.FundRaiseType _fundRaiseType) external view
returns(spentUSD uint256, spentValue uint256, tokensMinted uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _beneficiary | address | Address where security tokens are to be sent | 
| _investmentValue | uint256 | Amount of POLY, ETH or Stable coins invested | 
| _fundRaiseType | enum STO.FundRaiseType | Fund raise type (POLY, ETH, SC) | 

### _buyTokensChecks

```js
function _buyTokensChecks(address _beneficiary, uint256 _investmentValue, uint256 investedUSD) internal view
returns(netInvestedUSD uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _beneficiary | address |  | 
| _investmentValue | uint256 |  | 
| investedUSD | uint256 |  | 

### _calculateTier

```js
function _calculateTier(address _beneficiary, uint256 _tier, uint256 _investedUSD, enum STO.FundRaiseType _fundRaiseType) internal nonpayable
returns(spentUSD uint256, gotoNextTier bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _beneficiary | address |  | 
| _tier | uint256 |  | 
| _investedUSD | uint256 |  | 
| _fundRaiseType | enum STO.FundRaiseType |  | 

### _calculateTierView

```js
function _calculateTierView(uint256 _tier, uint256 _investedUSD, enum STO.FundRaiseType _fundRaiseType) internal view
returns(spentUSD uint256, gotoNextTier bool, tokensMinted uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _tier | uint256 |  | 
| _investedUSD | uint256 |  | 
| _fundRaiseType | enum STO.FundRaiseType |  | 

### _purchaseTier

```js
function _purchaseTier(address _beneficiary, uint256 _tierPrice, uint256 _tierRemaining, uint256 _investedUSD, uint256 _tier) internal nonpayable
returns(spentUSD uint256, purchasedTokens uint256, gotoNextTier bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _beneficiary | address |  | 
| _tierPrice | uint256 |  | 
| _tierRemaining | uint256 |  | 
| _investedUSD | uint256 |  | 
| _tier | uint256 |  | 

### _purchaseTierAmount

```js
function _purchaseTierAmount(uint256 _tierPrice, uint256 _tierRemaining, uint256 _investedUSD) internal view
returns(spentUSD uint256, purchasedTokens uint256, gotoNextTier bool)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _tierPrice | uint256 |  | 
| _tierRemaining | uint256 |  | 
| _investedUSD | uint256 |  | 

### isOpen

This function returns whether or not the STO is in fundraising mode (open)

```js
function isOpen() public view
returns(bool)
```

**Returns**

bool Whether the STO is accepting investments

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### capReached

Checks whether the cap has been reached.

```js
function capReached() public view
returns(bool)
```

**Returns**

bool Whether the cap was reached

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getRate

returns current conversion rate of funds

```js
function getRate(enum STO.FundRaiseType _fundRaiseType) public view
returns(uint256)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _fundRaiseType | enum STO.FundRaiseType | Fund raise type to get rate of | 

### convertToUSD

This function converts from ETH or POLY to USD

```js
function convertToUSD(enum STO.FundRaiseType _fundRaiseType, uint256 _amount) external view
returns(uint256)
```

**Returns**

uint256 Value in USD

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _fundRaiseType | enum STO.FundRaiseType | Currency key | 
| _amount | uint256 | Value to convert to USD | 

### convertFromUSD

This function converts from USD to ETH or POLY

```js
function convertFromUSD(enum STO.FundRaiseType _fundRaiseType, uint256 _amount) external view
returns(uint256)
```

**Returns**

uint256 Value in ETH or POLY

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _fundRaiseType | enum STO.FundRaiseType | Currency key | 
| _amount | uint256 | Value to convert from USD | 

### getTokensSold

⤾ overrides [ISTO.getTokensSold](ISTO.md#gettokenssold)

Return the total no. of tokens sold

```js
function getTokensSold() public view
returns(uint256)
```

**Returns**

uint256 Total number of tokens sold

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getTokensMinted

Return the total no. of tokens minted

```js
function getTokensMinted() public view
returns(uint256)
```

**Returns**

uint256 Total number of tokens minted

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getTokensSoldFor

Return the total no. of tokens sold for the given fund raise type
param _fundRaiseType The fund raising currency (e.g. ETH, POLY, SC) to calculate sold tokens for

```js
function getTokensSoldFor(enum STO.FundRaiseType _fundRaiseType) external view
returns(uint256)
```

**Returns**

uint256 Total number of tokens sold for ETH

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _fundRaiseType | enum STO.FundRaiseType |  | 

### getTokensMintedByTier

Return array of minted tokens in each fund raise type for given tier
param _tier The tier to return minted tokens for

```js
function getTokensMintedByTier(uint256 _tier) external view
returns(uint256[])
```

**Returns**

uint256[] array of minted tokens in each fund raise type

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _tier | uint256 |  | 

### getTokensSoldByTier

Return the total no. of tokens sold in a given tier
param _tier The tier to calculate sold tokens for

```js
function getTokensSoldByTier(uint256 _tier) external view
returns(uint256)
```

**Returns**

uint256 Total number of tokens sold in the tier

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _tier | uint256 |  | 

### getNumberOfTiers

Return the total no. of tiers

```js
function getNumberOfTiers() external view
returns(uint256)
```

**Returns**

uint256 Total number of tiers

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getUsdTokens

Return the usd tokens accepted by the STO

```js
function getUsdTokens() external view
returns(address[])
```

**Returns**

address[] usd tokens

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getPermissions

⤾ overrides [IModule.getPermissions](IModule.md#getpermissions)

Return the permissions flag that are associated with STO

```js
function getPermissions() public view
returns(bytes32[])
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getSTODetails

Return the STO details

```js
function getSTODetails() external view
returns(uint256, uint256, uint256, uint256[], uint256[], uint256, uint256, uint256, bool[])
```

**Returns**

Unixtimestamp at which offering gets start.

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### getInitFunction

⤾ overrides [IModule.getInitFunction](IModule.md#getinitfunction)

This function returns the signature of configure function

```js
function getInitFunction() public pure
returns(bytes4)
```

**Returns**

bytes4 Configure function signature

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|

### _getOracle

```js
function _getOracle(bytes32 _currency, bytes32 _denominatedCurrency) internal view
returns(address)
```

**Arguments**

| Name        | Type           | Description  |
| ------------- |------------- | -----|
| _currency | bytes32 |  | 
| _denominatedCurrency | bytes32 |  | 

