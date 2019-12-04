# USDTieredSTO

|  |  |
| :--- | :--- |
| **Introduced in** | 2.0.0 |
| **Contract name** | USDTieredSTO.sol |
| **Type** | STO Module |
| **Compatible Protocol Version** | ^3.0.0 |

## How it works

Allows a security token to be issued in return for investment \(security token offering\) in various currencies \(ETH, POLY & a USD stable coin/ stable coin w.r.t denominated currency\). The price of tokens is denominated in denominated Currency \(Provided by the issuer at the configuration time\) and the STO allows multiple tiers with different price points to be defined. Discounts for investments made in POLY can also be defined.

STO can be of two types on the basis of the token distribution, We are facilitating both types \(i.e pre-mint & mint on buying\) through a single contract but before the start time of the STO issuer has to choose what kind of STO type they want to go for.

## Key functionalities \(as defined in the Smart Contract\)

### Initialization

The contract is initialized with all of the parameters needed to set up the STO \(tier information, wallet addresses and so on\).

```text
    /**
     * @notice Function used to initialize the contract variables
     * @param _startTime Unix timestamp at which offering get started
     * @param _endTime Unix timestamp at which offering get ended
     * @param _ratePerTier Rate (in USD) per tier (* 10**18)
     * @param _tokensPerTierTotal Tokens available in each tier
     * @param _nonAccreditedLimitUSD Limit in USD (* 10**18) for non-accredited investors
     * @param _minimumInvestmentUSD Minimum investment in USD (* 10**18)
     * @param _fundRaiseTypes Types of currency used to collect the funds
     * @param _wallet Ethereum account address to hold the funds
     * @param _treasuryWallet Ethereum account address to receive unsold tokens
     * @param _stableTokens Contract address of the stable coins
     * @param _customOracleAddresses Addresses of the custom oracles
     * @param _denominatedCurrency Symbol of the denominated currency
     */
   function configure(
        uint256 _startTime,
        uint256 _endTime,
        uint256[] memory _ratePerTier,
        uint256[] memory _ratePerTierDiscountPoly,
        uint256[] memory _tokensPerTierTotal,
        uint256[] memory _tokensPerTierDiscountPoly,
        uint256 _nonAccreditedLimitUSD,
        uint256 _minimumInvestmentUSD,
        FundRaiseType[] memory _fundRaiseTypes,
        address payable _wallet,
        address _treasuryWallet,
        IERC20[] memory _stableTokens,
        address[] memory _customOracleAddresses,
        bytes32 _denominatedCurrency
   )
      public
     onlyFactory
```

Configuration can be considered in 5 separate sections, each of which can be modified anytime between the creation of the USDTieredSTO and the start time of the STO. When the issuer is configuring their STO, they need to provide an array of addresses of stable coins they will accept.

### Allow Pre-Minting

This function is a gateway function to allow pre-minting in the STO. It can only be called before the start time of the STO. It will pre mint all tokens \(i.e sum of all the tiers\) and assigned to STO contract itself.

```text
 /**
  * @notice This function will allow STO to Pre-mint all tokens those will be distributed in the sale
  */
function allowPreMinting() external withPerm(ADMIN)
```

### Revoke Pre-Minting

This function is used to revoke pre-mint type that will lead to burn all pre-minted tokens.

```text
 /**
  * @notice This function will revoke the pre-mint flag of the STO
  */
 function revokePreMintFlag() external withPerm(ADMIN)
```

### Modify Times

It allows you to modify the start or end time of the STO.

```text
    /**
     * @dev Modifies STO start and end times
     * @param _startTime start time of sto
     * @param _endTime end time of sto
     */
    function modifyTimes(uint256 _startTime, uint256 _endTime) external
```

### Modify Tiers

This function allows you to modify the details of your STOs tiers. Primarily, it allows you to customize the rates you want to set for each tier, the discount rates per tier for investors using POLY, the total amount of tokens you want to allocate to each tier and the token amount of tokens you want to allocate to investors getting a discount because they are buying with POLY. If **preMintAllowed** flag is activated then extra tokens will be minted if total tokens in all tiers is greater than the earlier sum otherwise they get burned.

**A few things to note:**

1. Firstly, you can only use this function if the STO hasn’t started.
2. You can’t have 0 tokens allocated to a tier.
3. The discounted tokens \(for investors using Poly\) per tier have to be less than or equal to the total tokens per tier
4. The discount rate \(for investors using Poly\) per tier needs to be less than or equal to the rate per tier

```text
    /**
     * @dev modifiers STO tiers. All tiers must be passed, can not edit specific tiers.
     * @param _ratePerTier Array of rates per tier
     * @param _ratePerTierDiscountPoly Array of discounted poly rates per tier
     * @param _tokensPerTierTotal Array of total tokens per tier
     * @param _tokensPerTierDiscountPoly Array of discounted tokens per tier
     */
    function modifyTiers(
        uint256[] calldata _ratePerTier,
        uint256[] calldata _ratePerTierDiscountPoly,
        uint256[] calldata _tokensPerTierTotal,
        uint256[] calldata _tokensPerTierDiscountPoly
    )
        external
```

### Modify Addresses

It allows you to modify the addresses used for the STO. This also allows USDTieredSTO to accept multiple Stable Coin addresses instead of just a single stable coin address

```text
/**
     * @dev Modifies addresses used as a wallet, reserve wallet, and USD token
     * @param _wallet Address of wallet where funds are sent
     * @param _treasuryWallet Address of wallet where unsold tokens are sent
     * @param _usdTokens Address of USD tokens
     */
    function modifyAddresses(
      address payable _wallet,
      address _treasuryWallet,
      address[] calldata _usdTokens
    ) external
```

### Modify Funding

This function is used to modify the type of funding your STO will be accepted i.e Fundraise type \(in ETH, POLY, DAI or all\).

```text
    /**
     * @dev Modifies fund raise types
     * @param _fundRaiseTypes Array of fund raise types to allow
     */
    function modifyFunding(FundRaiseType[] calldata _fundRaiseTypes) external
```

### Modify Limits

It allows you to modify the limits for non-accredited investors and minimum investment \(in USD\) for the STO.

```text
    /**
     * @dev modifies max non accredited invets limit and overall minimum investment limit
     * @param _nonAccreditedLimitUSD max non accredited invets limit
     * @param _minimumInvestmentUSD overall minimum investment limit
     */
    function modifyLimits(uint256 _nonAccreditedLimitUSD, uint256 _minimumInvestmentUSD) external
```

### Tiers

Each tier defines the following attributes:

```text
struct Tier {
    // How many token units a buyer gets per USD in this tier (multiplied by 10**18)
    uint256 rate;
    // How many token units a buyer gets per USD in this tier (multiplied by 10**18) when investing in POLY up to tokensDiscountPoly
    uint256 rateDiscountPoly; 
    // How many tokens are available in this tier (relative to totalSupply)
    uint256 tokenTotal;
    // How many token units are available in this tier (relative to totalSupply) at the ratePerTierDiscountPoly rate
    uint256 tokensDiscountPoly;
    // How many tokens have been minted in this tier (relative to totalSupply)
    uint256 totalTokensSoldInTier;
    // How many tokens have been minted in this tier (relative to totalSupply) for each fund raise type
    mapping (uint8 => uint256) tokenSoldPerFundType;
    // How many tokens have been minted in this tier (relative to totalSupply) at discounted POLY rate
    uint256 soldDiscountPoly;
}
```

You can have as many tiers as needed, and each tier will be filled sequentially. If `tokensDiscountPoly` is not 0, then the tier has some quota of tokens which are offered at a discounted price \(`ratePerTierDiscountPoly`\) for POLY investments.

N.B.: While theoretically, it’s possible to have a large number of tiers, due to several loops within the contract’s functions there’s a limit to how many should be entered. In practice, it’s unlikely any issuer would have more than 5-7 of them. We’ll force a max of 5 on the dApp.

### Oracles

In order to convert between ETH & POLY investments into USD\(default denominated currency\) / denominated currency \(in which the STO is denominated\) the STO makes use of pricing oracles. This function checks to see if the fundraise type is equal to the fundraise rates in POLY, ETH and DAI. For example, it checks the rates with the oracle to see if the fundraise type equals the fundraise type in POLY, ETH and/or DAI and then the Oracle returns the results. The function reverts if it doesn’t have the correct funding.

### Get Rate

```text
/**
 * @dev returns current conversion rate of funds
 * @param _fundRaiseType Fund raise type to get rate of
 */
function getRate(FundRaiseType _fundRaiseType) public returns (uint256)
```

The `getRate` function allows a caller to determine the current rate for each funding currency.

NB - this rate varies over time, so there is no guarantee that the returned rate will still be valid on a subsequent transaction \(see Buying Tokens for how to mitigate this\).

### Modify Oracle

This function is used to change the oracle addresses and can only be called by the owner of the ST. By default, Polymath is providing ETH/USD & POLY/USD oracle while using this functionality issuer can use their own deployed oracle respective to the denominated currency.  
**Note** - If Issuer wants to change the `denominatedCurrency` then they have to change the rates as well according to the denominated currency. It is advised to call `modifyTiers()` just after calling `modifyOracles()` from the dApp side. `denominatedCurrency` can only be changed before the STO starts.

The issuer is allowed to set the oracle address for either ETH or POLY or allowed to set both. it depends upon its selected fundraise types. When `_denominatedCurrencySymbol != bytes32(0)` it means oracle address array length should be equal 2.

* If fund raise type is ETH then `_customOracleAddresses = [ETH_oracle_address, 0x0]`.
* If raise type POLY then  `_customOracleAddresses = [0x0, POLY_oracle_address]`.
* If raise type ETH and POLY both `_customOracleAddresses = [ETH_oracle_address, POLY_oracle_address]`.

  ```text
  /**
   * @notice Modifies the oracle addresses and the denominated currency
   * @dev If custom oracle addresses and denominated currency symbol are 0x0 then it will automatically
   * fallback to the Polymath oracle addresses and USD denominated currency symbol
   * @param _customOracleAddresses Addresses of the oracles
   * @param _denominatedCurrencySymbol Symbol of the Fiat currency used for denomination
   */
  function modifyOracles(address[] calldata _customOracleAddresses, bytes32 _denominatedCurrencySymbol) external
  ```

### Buying Tokens

Tokens can be issued in return for investments made in ETH, POLY or DAI \(or generally any USD stable coin\). The currencies accepted are configured in the STO via the modifyFunding function.

For each currency type, there are two functions that can be used to make an investment. For example, for ETH we have:

```text
function buyWithETH(address _beneficiary) external payable returns (uint256, uint256, uint256)

     /**
      * @notice Purchase tokens using ETH
      * @param _beneficiary Address where security tokens will be sent
      * @param _minTokens Minumum number of tokens to buy or else revert
      */
    function buyWithETHRateLimited(address _beneficiary, uint256 _minTokens) public payable validETH returns (uint256, uint256, uint256)
```

`buyWithETH` accepts ETH as an investment currency and will purchase a number of tokens that corresponds to the amount of ETH sent with the function.

While `buyWithETHRateLimited` accepts ETH as an investment currency and will purchase a number of tokens that correspond to the amount of ETH sent with the function. However, it will also ensure that at least \_minTokens are purchased or otherwise revert and return the invested ETH. This allows the investor to establish a guarantee on a minimum ETH / USD rate and tier point that their purchase is made.

For investments made in POLY or with a stable coin, we have equivalent functions. Before calling this `buyWith…` functions though, the investor must have approved a corresponding amount of tokens to the STO address \(called approve on the POLY or stable coin contract with the address of the STO contract, and the amount of POLY / stable coin being invested\). These functions also take as a parameter the exact amount of tokens being invested.

```text
   function buyWithPOLY(address _beneficiary, uint256 _investedPOLY) external returns (uint256, uint256, uint256)

   function buyWithUSD(address _beneficiary, uint256 _investedSC, IERC20 _usdToken) external returns (uint256, uint256, uint256)

     /**
      * @notice Purchase tokens using POLY
      * @param _beneficiary Address where security tokens will be sent
      * @param _investedPOLY Amount of POLY invested
      * @param _minTokens Minumum number of tokens to buy or else revert
      */
    function buyWithPOLYRateLimited(address _beneficiary, uint256 _investedPOLY, uint256 _minTokens) public validPOLY returns (uint256, uint256, uint256)

     /**
      * @notice Purchase tokens using Stable coins
      * @param _beneficiary Address where security tokens will be sent
      * @param _investedSC Amount of Stable coins invested
      * @param _minTokens Minumum number of tokens to buy or else revert
      * @param _usdToken Address of USD stable coin to buy tokens with
      */
    function buyWithUSDRateLimited(address _beneficiary, uint256 _investedSC, uint256 _minTokens, IERC20 _usdToken)
        public validSC(address(_usdToken)) returns (uint256, uint256, uint256)
```

If STO type is preMint then required tokens are transferred from the STO balance.

### Refunds

If funds are sent which can’t be fully invested \(for example if a non-accredited investor limit is reached, or the STO has sold all tokens\) any uninvested funds are refunded to the investor. This can also happen if the underlying security token only allows tokens with a certain granularity and the sent funds would result in purchasing tokens with a more granular quantity.

### Accredited vs. Non-Accredited Investor Limits

**Note**: The below functions work in a way that controls situations when an investor \(accredited or not\) is buying tokens from an issuer. For example, when an investor wants to invest in a token, these functions control situations such as if there is a minimum limit of investment that every investor must respect or when a non-accredited investor can’t buy any more tokens due to a non-accredited investor limit. The difference between accredited and non accredited in this situation is that an accredited investor doesn’t have any limit on what they can buy whereas a non accredited investor has a limit \(However, accredited may have a minimum amount they have to buy\).

### Non-accredited Limit

It allows you to change the non-accredited investors' limit.

```text
    /**
     * @notice Modifies the list of overrides for non-accredited limits in USD
     * @param _investors Array of investor addresses to modify
     * @param _nonAccreditedLimit Array of uints specifying non-accredited limits
     */
    function changeNonAccreditedLimit(
        address[] calldata _investors,
        uint256[] calldata _nonAccreditedLimit
    )
       external
```

### Finalization

The USDTieredSTO can be finalized at any time. Finalizing the STO will close it to any further investments, and mint \(or transfer in the case of `preMint`\) any remaining unsold tokens to the treasuryWallet specified in `modifyAddresses()`.

```text
/**
 * @notice Finalizes the STO and mint remaining tokens to reserve address
 * @notice Reserve address must be whitelisted to successfully finalize
 */
function finalize() external;
```

**Note-** When the end of the STO is reached the STO will not auto-mint outstanding tokens. The Issuer has to manually call finalize\(\) in order for the unsold tokens to be minted.

### Change allows beneficial investments

This function allows the issuer to set the allowed beneficiary to different from the funder. The only input parameter a boolean to allow or disallow beneficial investments.

```text
    /**
     * @notice Function to set allowBeneficialInvestments (allow beneficiary to be different to funder)
     * @param _allowBeneficialInvestments Boolean to allow or disallow beneficial investments
     */
    function changeAllowBeneficialInvestments(bool _allowBeneficialInvestments) external
```

## STO Information \(get\(\) functions\)

### Get Token Sold

This function allows you to check the total number of tokens that have been sold to investors.

```text
    /**
     * @notice Return the total no. of tokens sold
     * @return uint256 Total number of tokens sold
     */
    function getTokensSold() public view returns (uint256)
```

### Get Tokens Minted

This function allows you to check the total number of tokens that have been minted.

```text
    /**
     * @notice Return the total no. of tokens minted
     * @return uint256 Total number of tokens minted
     */
    function getTokensMinted() public view returns (uint256 tokensMinted)
```

### Get Tokens Sold For

This function allows you to check the total number of tokens that have been sold to investors for ETH.

```text
    /**
     * @notice Return the total no. of tokens sold for the given fund raise type
     * param _fundRaiseType The fund raising currency (e.g. ETH, POLY, SC) to calculate sold tokens for
     * @return uint256 Total number of tokens sold for ETH
     */
    function getTokensSoldFor(FundRaiseType _fundRaiseType) external view returns (uint256 tokensSold)
```

### Get Number of Tiers

This function allows you to check the total number of tiers that you have in your STO.

```text
    /**
     * @notice Return the total no. of tiers
     * @return uint256 Total number of tiers
     */
    function getNumberOfTiers() external view returns (uint256)
```

### Get tokens minted by tier

This function Return array of minted tokens in each fundraise type for a given tier.

```text
    /**
     * @notice Return array of minted tokens in each fund raise type for given tier
     * param _tier The tier to return minted tokens for
     * @return uint256[] array of minted tokens in each fund raise type
     */
    function getTokensMintedByTier(uint256 _tier) external view returns(uint256[] memory)
```

### Get tokens sold by tier

This function is used to return the total number of tokens sold in a given tier.

```text
    /**
     * @notice Return the total no. of tokens sold in a given tier
     * param _tier The tier to calculate sold tokens for
     * @return uint256 Total number of tokens sold in the tier
     */
    function getTotalTokensSoldByTier(uint256 _tier) external view returns (uint256)
```

### Get STO details

This function returns all of the details for issuers to review their USDTieredSTO.

```text
/**
     * @notice Return the STO details
     * @return Unixtimestamp at which offering gets started.
     * @return Unixtimestamp at which offer ends.
     * @return Currently active tier
     * @return Array of Number of tokens this STO will be allowed to sell at different tiers.
     * @return Array Rate at which tokens are sold at different tiers
     * @return Amount of funds raised
     * @return Number of individual investors this STO have.
     * @return Amount of tokens sold.
     * @return Array of bools to show if funding is allowed in ETH, POLY, SC respectively.
     * @return Boolean value to know the nature of the STO whether it is pre-mint or mint on buying type sto.
     */
    function getSTODetails() external view returns(uint256, uint256, uint256, uint256[] memory, uint256[] memory, uint256, uint256, uint256, bool[] memory, bool)
```

### Get Accredited data

This function returns investor accredited & non-accredited override information

```text
    /**
     * @notice Returns investor accredited & non-accredited override informatiomn
     * @return investors list of all configured investors
     * @return accredited whether investor is accredited
     * @return override any USD overrides for non-accredited limits for the investor
     */
    function getAccreditedData() external view returns (address[] memory investors, bool[] memory accredited, uint256[] memory overrides)
```

### Get USD Tokens

This function returns the USD tokens accepted by the STO.

```text
    /**
     * @notice Return the usd tokens accepted by the STO
     * @return address[] usd tokens
     */
    function getUsdTokens() external view returns (address[] memory)
```

### To know whether STO is running or not

This function returns whether or not the STO is in fundraising mode \(open\)

```text
    /**
     * @notice This function returns whether or not the STO is in fundraising mode (open)
     * @return bool Whether the STO is accepting investments
     */
    function isOpen() public view returns(bool)
```

### Cap Reached

Checks whether the cap has been reached or not.

```text
    /**
     * @notice Checks whether the cap has been reached.
     * @return bool Whether the cap was reached
     */
    function capReached() public view returns (bool)
```

### Get Custom Oracle Address

Use to get the custom oracle addresses set by the issuer itself.

```text
  /**
   * @dev returns the custom oracle address
   * @param _fundRaiseType Fund raise type to get rate of
   */
function getCustomOracleAddress(FundRaiseType _fundRaiseType) external view returns(address)
```

### Special considerations / notes

Function with modifiers like `withPerm(ADMIN)` or `withPerm(OPERATOR)` can be called by the delegates as well who have the `ADMIN & OPERATOR` permission assigned.

