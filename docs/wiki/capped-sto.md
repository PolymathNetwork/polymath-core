# Capped STO

|  |  |
| :--- | :--- |
| **Introduced in** | 1.0.0 |
| **Contract name** | CappedSTO.sol |
| **Type** | STO |
| **Compatible Protocol Version** | ^3.0.0 |

## How it Works

The Capped STO module allows issuers to set up a capped STO for their token distribution. The Capped STO sets a limit on the funding accepted and the number of tokens that will be distributed. Capped STOs are the most typical when it comes to what issuers want for STO structure used in a token sale. STO can be of two types on the basis of the token distribution, We are facilitating both types \(i.e pre-mint & mint on buying\) through a single contract but before the start time of the STO issuer has to choose what kind of STO type they want to go for.

## Key Functionalities \(as defined in the Smart Contract\)

### Initialization

The Configure function is used to initialize all of the capped STO contract variables.

**Other conditions:**

1. Requires that the rate of the token is great than zero.
2. Requires that the receiver of funds cannot be the `0x0` address 
3. The start date is later than or equal to the present moment 
4. The end date is later than the start date
5. The cap should be great than zero
6. The issuer can only select one type of fundraising type.

   ```text
    /**
     * @notice Function used to initialize the contract variables
     * @param _startTime Unix timestamp at which offering get started
     * @param _endTime Unix timestamp at which offering get ended
     * @param _cap Maximum No. of token base units for sale
     * @param _rate Token units a buyer gets multiplied by 10^18 per wei / base unit of POLY
     * @param _fundRaiseTypes Type of currency used to collect the funds
     * @param _fundsReceiver Ethereum account address to hold the funds
     */
    function configure(
        uint256 _startTime,
        uint256 _endTime,
        uint256 _cap,
        uint256 _rate,
        FundRaiseType[] memory _fundRaiseTypes,
        address payable _fundsReceiver
    )
        public
        onlyFactory
   ```

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

### Change allows beneficial investments

This function allows the issuer to set the allowed beneficiary to different from the funder. The only input parameter a boolean to allow or disallow beneficial investments.

```text
    /**
     * @notice Function to set allowBeneficialInvestments (allow beneficiary to be different to funder)
     * @param _allowBeneficialInvestments Boolean to allow or disallow beneficial investments
     */
    function changeAllowBeneficialInvestments(bool _allowBeneficialInvestments) public
```

### Buy tokens from the STO

This function is a low-level token purchase and should never be overridden. The parameter for this function is the address of the beneficiary who will be performing the token purchase from the STO. If the STO type is pre-mint then ROI will be transferred from the contract itself otherwise transferred from the genesis.

```text
     /**
      * @notice Low level token purchase ***DO NOT OVERRIDE***
      * @param _beneficiary Address performing the token purchase
      */
    function buyTokens(address _beneficiary) public payable whenNotPaused nonReentrant
```

### Buy tokens from the STO using POLY

This function is also for low-level token purchasing. The only parameter this function accepts is for the amount of POLY wanted to invest in the STO. If the STO type is pre-mint then ROI will be transferred from the contract itself otherwise transferred from the genesis.

```text
     /**
      * @notice low level token purchase
      * @param _investedPOLY Amount of POLY invested
      */
    function buyTokensWithPoly(uint256 _investedPOLY) public whenNotPaused nonReentrant
```

### Cap reached

This function simply checks whether or not the STO cap has been reached. It returns a simple true or false.

```text
   /**
    * @notice Checks whether the cap has been reached.
    * @return bool Whether the cap was reached
    */
    function capReached() public view returns(bool)
```

### Get tokens sold in a sale

This function returns the total number of tokens sold during/after the capped STO.

```text
    /**
     * @notice Return the total no. of tokens sold
     */
    function getTokensSold() external view returns (uint256)
```

### Get the STO details

This function returns all of the details for issuers to review their Capped STO.

```text
    /**
     * @notice Return the STO details
     * @return Unixtimestamp at which offering gets started.
     * @return Unixtimestamp at which offer ends.
     * @return Number of token base units this STO will be allowed to sell to investors.
     * @return Token units a buyer gets(multiplied by 10^18) per wei / base unit of POLY
     * @return Amount of funds raised
     * @return Number of individual investors this STO have.
     * @return Amount of tokens get sold.
     * @return Boolean value to justify whether the fundraising type is POLY or not, i.e true for POLY.
     * @return Boolean value to know the nature of the STO Whether it is pre-mint or mint on buying type sto.
     */
    function getSTODetails() public view returns(uint256, uint256, uint256, uint256, uint256, uint256, uint256, bool, bool)
```

### Invest ETH in STO \(As a send transaction\)

The fallback function will be used to invest ETH into STO using a simple send transaction

### Finalize

Similar to USDTieredSTO, Now CappedSTO is also gets finalized explicitly by calling `finalize()` function \(can only be called by the owner of ST and by whom possess ADMIN permission\). This function will transfer all the remaining funds to the treasuryWallet.

```text
 /**
 * @notice Finalizes the STO and mint remaining tokens to treasury address
 * @notice Treasury wallet address must be whitelisted to successfully finalize
 */
function finalize() external withPerm(ADMIN)
```

