# Dividend-Module

## Dividend Checkpoint Module

|  |  |
| :--- | :--- |
| **Introduced in** | 1.3.0 |
| **Contract name** | DividendCheckpointModule |
| **Compatible ST Protocol version range** | ^3.0.0 |
| **Type** | Checkpoint Module |

### How it works

#### Dividend Checkpoint Module:

This module allows the issuer to define checkpoints at which token balances and the total supply of a token can be consistently queried. The dividends checkpoint is for dividend payment mechanisms and on-chain governance, both of which need to be able to determine token balances consistently as of a specified point in time.

**DISCLAIMER:**

Under certain conditions, the function pushDividendPayment

* May fail due to block gas limits. If the total number of investors that ever held tokens is greater than ~15,000.  If this happens investors can pull their dividends, or the Issuer can use `pushDividendPaymentToAddresses()` to provide an explicit address list in batches.

### Key functionalities \(as defined in the Smart Contract\)

#### Get Default Excluded

This function simply returns a list of the default excluded addresses.

```text
    /**
     * @notice Return the default excluded addresses
     * @return List of excluded addresses
     */
    function getDefaultExcluded() external view returns(address[] memory)
```

#### Create Checkpoint

This function allows the issuer to create a checkpoint for their respective security token and returns a checkpoint ID.

```text
    /**
     * @notice Creates a checkpoint on the security token
     * @return Checkpoint ID
     */
    function createCheckpoint() public withPerm(OPERATOR) returns(uint256)
```

#### Set Default Excluded

This function allows for the issuer to clear their dividends list and to set a new list of excluded addresses used for future dividend issuances.

```text
    /**
     * @notice Function to clear and set list of excluded addresses used for future dividends
     * @param _excluded Addresses of investors
     */
    function setDefaultExcluded(address[] memory _excluded) public withPerm(ADMIN)
```

#### SetWithholding

This function allows the issuer to set withholding tax rates for their investors.

There are a few requirements for the function:

1. Investors list length must equal the withholding list length \(so we don’t have mismatched input lengths\)
2. withholding tax must be less than or equal to 10\*\*18 or else it will be marked as incorrect withholding tax.

```text
    /**
     * @notice Function to set withholding tax rates for investors
     * @param _investors Addresses of investors
     * @param _withholding Withholding tax for individual investors (multiplied by 10**16)
     */
    function setWithholding(
      address[] memory _investors,
      uint256[] memory _withholding
    ) 
      public 
      withPerm(ADMIN)
```

#### Set withholding fixed

This function allows the issuer to set the withholding tax rates for investors.

**Requirement:**

1. Withholding must be less than \(or equal to\) than 10\*\*18 or else the function will return “Incorrect withholding tax”

```text
    /**
     * @notice Function to set withholding tax rates for investors
     * @param _investors Addresses of investor
     * @param _withholding Withholding tax for all investors (multiplied by 10**16)
     */
    function setWithholdingFixed(address[] memory _investors, uint256 _withholding) public withPerm(ADMIN)
```

#### Push Dividend To Addresses

This function allows the issuer to push dividends to the provided list of addresses.

```text
    /**
     * @notice Issuer can push dividends to provided addresses
     * @param _dividendIndex Dividend to push
     * @param _payees Addresses to which to push the dividend
     */
    function pushDividendPaymentToAddresses(
        uint256 _dividendIndex,
        address payable[] memory _payees
    )
        public
        withPerm(OPERATOR)
```

#### Push Dividend Payment

This function allows the issuer to push dividends to the provided list of addresses.

```text
    /**
     * @notice Issuer can push dividends using the investor list from the security token
     * @param _dividendIndex Dividend to push
     * @param _start Index in investor list at which to start pushing dividends
     * @param _end Index in investor list at which to stop pushing dividends
     */
    function pushDividendPayment(
        uint256 _dividendIndex,
        uint256 _start,
        uint256 _end
    )
        public
        withPerm(OPERATOR)
```

#### Pull Dividend Payment

This function allows investors to pull their own issued dividends. Note: If the dividend contract is paused then it will not allow investors to pull their dividends

```text
    /**
     * @notice Investors can pull their own dividends
     * @param _dividendIndex Dividend to pull
     */
    function pullDividendPayment(uint256 _dividendIndex) public whenNotPaused
```

#### Pay Dividend

This internal function allows for the payment of dividends.

```text
 /**
  * @notice paying dividends
  * @param _payee Address of investor
  * @param _dividend Storage with previously issued dividends
  * @param _dividendIndex Dividend to pay
  */
    function _payDividend(address _payee, Dividend storage _dividend, uint256 _dividendIndex)
```

#### Reclaim Dividend

This function allows the issuer to reclaim the remaining unclaimed dividend amounts that have expired for investors.

```text
    /**
     * @notice Issuer can reclaim remaining unclaimed dividend amounts, for expired dividends
     * @param _dividendIndex Dividend to reclaim
     */
    function reclaimDividend(uint256 _dividendIndex) external;
```

#### Calculate Dividend

This function is used to calculate the number of dividends that are claimable.

**Requirements:**

1. Dividend Index must be less than the length of the dividend 
2. Dividend storage size must be equal to the dividends index 

```text
    /**
     * @notice Calculate amount of dividends claimable
     * @param _dividendIndex Dividend to calculate
     * @param _payee Affected investor address
     * @return claim, withheld amounts
     */
    function calculateDividend(uint256 _dividendIndex, address _payee) public view returns(uint256, uint256)
```

#### Get Dividend Index

This function returns the index according to the inputted checkpoint ID.

```text
    /**
     * @notice Get the index according to the checkpoint id
     * @param _checkpointId Checkpoint id to query
     * @return uint256[]
     */
    function getDividendIndex(uint256 _checkpointId) public view returns(uint256[] memory))
```

#### Withdraw Withholding

This function allows the issuer to withdraw withheld tax from the dividend index.

```text
    /**
     * @notice Allows issuer to withdraw withheld tax
     * @param _dividendIndex Dividend to withdraw from
     */
    function withdrawWithholding(uint256 _dividendIndex) external;
```

#### Update dividend dates

This function allows the issuer to change the maturity/expiry dates of a given dividendIndex.

```text
    /**
     * @notice Allows issuer to change maturity/expiry dates for dividends
     * @dev NB - setting the maturity of a currently matured dividend to a future date
     * @dev will effectively refreeze claims on that dividend until the new maturity date passes
     * @ dev NB - setting the expiry date to a past date will mean no more payments can be pulled
     * @dev or pushed out of a dividend
     * @param _dividendIndex Dividend to withdraw from
     * @param _maturity updated maturity date
     * @param _expiry updated expiry date
     */
    function updateDividendDates(uint256 _dividendIndex, uint256 _maturity, uint256 _expiry) external withPerm(ADMIN)
```

#### Change the treasury wallet address

The function used to change the treasury wallet address. It can only be called by the issuer.

```text
    /**
     * @notice Function used to change wallet address
     * @param _wallet Ethereum account address to receive reclaimed dividends and tax
     */
    function changeWallet(address payable _wallet) external
```

#### Getters

* `getDividendsData()` get all static dividend data.
* `getDividendData(uint256 _dividendIndex)` get static dividend data of a given dividendIndex.
* `getDividendProgress(uint256 _dividendIndex)` Retrieves list of investors, their claim status and whether they are excluded.
* `getCheckpointData(uint256 _checkpointId)` Retrieves list of investors, their balances, and their current withholding tax percentage.
* `isExcluded(address _investor, uint256 _dividendIndex)` Checks whether an address is excluded from claiming a dividend.
* `isClaimed(address _investor, uint256 _dividendIndex)` Checks whether an address has claimed a dividend.
* `getTreasuryWallet()` returns the treasury wallet address.

## Ether Dividend Checkpoint Module

|  |  |
| :--- | :--- |
| **Introduced in** | 1.3.0 |
| **Contract\(s\) name** | EtherDividendCheckpoint.sol |
| **Compatible ST Protocol version range** | ^3.0.0 |
| **Type** | Checkpoint Module |

### How it works

This checkpoint module for issuing ether dividends to investors.

### Key functionalities \(as defined in the Smart Contract\)

#### Create a Dividend

This function allows the issuer to create a dividend and a corresponding checkpoint for that dividend. It requires a global list of excluded addresses.

```text
    /**
     * @notice Creates a dividend and checkpoint for the dividend, using the global list of excluded addresses
     * @param _maturity Time from which dividend can be paid
     * @param _expiry Time until dividend can no longer be paid, and can be reclaimed by the issuer
     * @param _name Name/title for identification
     */
    function createDividend(uint256 _maturity, uint256 _expiry, bytes32 _name) external payable withPerm(ADMIN)
```

#### Create Dividend With Checkpoint

This function allows the issuer to create a dividend with a provided checkpoint. This function also requires a global list of excluded addresses.

```text
    /**
     * @notice Creates a dividend with a provided checkpoint, using the global list of excluded addresses
     * @param _maturity Time from which dividend can be paid
     * @param _expiry Time until dividend can no longer be paid, and can be reclaimed by the issuer
     * @param _checkpointId Id of the checkpoint from which to issue a dividend
     * @param _name Name/title for identification
     */
    function createDividendWithCheckpoint(
        uint256 _maturity,
        uint256 _expiry,
        uint256 _checkpointId,
        bytes32 _name
    )
        external
        payable
        withPerm(ADMIN)
```

#### Create Dividend With Exclusions

This function is used to create a dividend and checkpoint for the dividend and also allows the issuer to define a specific list of explicitly excluded addresses.

```text
    /**
     * @notice Creates a dividend and checkpoint for the dividend, specifying explicitly excluded addresses
     * @param _maturity Time from which dividend can be paid
     * @param _expiry Time until dividend can no longer be paid, and can be reclaimed by the issuer
     * @param _excluded List of addresses to exclude
     * @param _name Name/title for identification
     */
    function createDividendWithExclusions(
        uint256 _maturity,
        uint256 _expiry,
        address[] memory _excluded,
        bytes32 _name
    )
        public
        payable
        withPerm(ADMIN)
```

#### Create Dividend With Checkpoint And Exclusions

This function is used to create a dividend with a provided checkpoint and also allows the issuer to define a specific list of explicitly excluded addresses.

**Function Requirements:**

1. Excluded address list needs to be less than or equal to the excluded address list limit
2. Dividend expiry must be greater than the maturity \("Expiry is before maturity"\)
3. Dividend expiry date must be greater than the present moment \("Expiry can’t be in the past"\)
4. Dividend sent must be greater than 0. \("No dividend sent"\)
5. The checkpointId must be less than or equal to the `ISecurityToken(securityToken).currentCheckpointId()`
6. Name cannot be 0
7. The zero address cannot be included in the excluded addresses list \("Invalid address"\)
8. Cannot dupe the system with excluded-address: `!dividends[dividendIndex].dividendExcluded[_excluded[j]]`

```text
    /**
     * @notice Creates a dividend with a provided checkpoint, specifying explicitly excluded addresses
     * @param _maturity Time from which dividend can be paid
     * @param _expiry Time until dividend can no longer be paid, and can be reclaimed by the issuer
     * @param _checkpointId Id of the checkpoint from which to issue a dividend
     * @param _excluded List of addresses to exclude
     * @param _name Name/title for identification
     */
    function createDividendWithCheckpointAndExclusions(
        uint256 _maturity,
        uint256 _expiry,
        uint256 _checkpointId,
        address[] memory _excluded,
        bytes32 _name
    )
        public
        payable
        withPerm(ADMIN)
```

#### Reclaim Dividend

This function allows the issuer to have the ability to reclaim remaining unclaimed dividend amounts, for expired investor dividends.

**Function Requirements:**

1. `_dividendIndex` must be less than the dividends.length \("Incorrect dividend index"\)
2. The current time period must be great than or equal to the dividends\[\_dividendIndex\].expiry time \("Dividend expiry is in the future"\)

```text
    /**
     * @notice Issuer can reclaim remaining unclaimed dividend amounts, for expired dividends
     * @param _dividendIndex Dividend to reclaim
     */
    function reclaimDividend(uint256 _dividendIndex) external withPerm(OPERATOR)
```

#### Withdraw withholding

This function allows the issuer to withdraw the withheld tax. This collected tax will directly be transferred to the treasury wallet.

**Requirements:**

1. The dividendIndex must be less than the dividends.length \("Incorrect dividend index"\)
2. The Dividend storage dividend must equal the dividends\[\_dividendIndex\]

```text
    /**
     * @notice Allows issuer to withdraw withheld tax
     * @param _dividendIndex Dividend to withdraw from
     */
    function withdrawWithholding(uint256 _dividendIndex) external withPerm(OPERATOR)
```

## ERC20 Dividend Checkpoint Module

|  |  |
| :--- | :--- |
| **Introduced in** | 1.3.0 |
| **Contract\(s\) name** | ERC20DividendCheckpoint.sol |
| **Compatible ST Protocol version range** | ^3.0.0 |
| **Type** | Checkpoint Module |

### How it works

Checkpoint module for issuing ERC20 dividends. The function works by having a mapping to token addresses for each dividend.

### Key functionalities \(as defined in the Smart Contract\)

#### CreateDividend

This function allows the issuer to create a dividend and a corresponding checkpoint for that dividend. It requires a global list of excluded addresses.

```text
    /**
     * @notice Creates a dividend and checkpoint for the dividend
     * @param _maturity Time from which dividend can be paid
     * @param _expiry Time until dividend can no longer be paid, and can be reclaimed by the issuer
     * @param _token Address of ERC20 token in which dividend is to be denominated
     * @param _amount Amount of specified token for dividend
     * @param _name Name/Title for identification
     */
    function createDividend(
        uint256 _maturity,
        uint256 _expiry,
        address _token,
        uint256 _amount,
        bytes32 _name
    )
        external
        withPerm(ADMIN)
```

#### Create dividend checkpoint

This function allows the issuer to create a dividend with a provided checkpoint. This function also requires a global list of excluded addresses.

```text
    /**
     * @notice Creates a dividend with a provided checkpoint
     * @param _maturity Time from which dividend can be paid
     * @param _expiry Time until dividend can no longer be paid, and can be reclaimed by issuer
     * @param _token Address of ERC20 token in which dividend is to be denominated
     * @param _amount Amount of specified token for dividend
     * @param _checkpointId Checkpoint id from which to create dividends
     * @param _name Name/Title for identification
     */
    function createDividendWithCheckpoint(
        uint256 _maturity,
        uint256 _expiry,
        address _token,
        uint256 _amount,
        uint256 _checkpointId,
        bytes32 _name
    )
        external
        withPerm(ADMIN)
```

#### Create dividend with exclusions

This function is used to create a dividend and checkpoint for the dividend and also allows the issuer to define a specific list of explicitly excluded addresses.

```text
    /**
     * @notice Creates a dividend and checkpoint for the dividend
     * @param _maturity Time from which dividend can be paid
     * @param _expiry Time until dividend can no longer be paid, and can be reclaimed by issuer
     * @param _token Address of ERC20 token in which dividend is to be denominated
     * @param _amount Amount of specified token for dividend
     * @param _excluded List of addresses to exclude
     * @param _name Name/Title for identification
     */
    function createDividendWithExclusions(
        uint256 _maturity,
        uint256 _expiry,
        address _token,
        uint256 _amount,
        address[] memory _excluded,
        bytes32 _name
    )
        public
        withPerm(ADMIN)
```

#### Create dividend checkpoint and exclusions

This function allows the issuer to create a dividend with a provided checkpoint ID.

**Important Function Requirements:**

1. Excluded address list needs to be less than or equal to the excluded address list limit
2. Dividend expiry must be greater than the maturity \("Expiry is before maturity"\)
3. Dividend expiry date must be greater than the present moment \("Expiry can’t be in the past"\)
4. Dividend sent must be greater than 0. \("No dividend sent"\)
5. The token cannot be the zero address\(0\) \("Invalid token"\)
6. checkpointId must be less than or equal to the `securityTokenInstance.currentCheckpointId()("Invalid checkpoint")`
7. `IERC20(_token).transferFrom(msg.sender, address(this), _amount)` needs to have enough allowance to make a transfer \("insufficient allowance"\)
8. The name cannot be 0.
9. Cannot dupe the system with excluded-address: `!dividends[dividendIndex].dividendExcluded[_excluded[j]], "duped exclude address");`

```text
    /**
     * @notice Creates a dividend with a provided checkpoint
     * @param _maturity Time from which dividend can be paid
     * @param _expiry Time until dividend can no longer be paid, and can be reclaimed by issuer
     * @param _token Address of ERC20 token in which dividend is to be denominated
     * @param _amount Amount of specified token for dividend
     * @param _checkpointId Checkpoint id from which to create dividends
     * @param _excluded List of addresses to exclude
     * @param _name Name/Title for identification
     */
    function createDividendWithCheckpointAndExclusions(
        uint256 _maturity,
        uint256 _expiry,
        address _token,
        uint256 _amount,
        uint256 _checkpointId,
        address[] memory _excluded,
        bytes32 _name
    )
        public
        withPerm(ADMIN)
```

#### Reclaim dividend

This function is used by the issuer in order to reclaim remaining unclaimed dividend amounts, specifically for expired dividends.

```text
    /**
     * @notice Issuer can reclaim remaining unclaimed dividend amounts, for expired dividends
     * @param _dividendIndex Dividend to reclaim
     */
    function reclaimDividend(uint256 _dividendIndex) external withPerm(OPERATOR)
```

#### withdraw withholding

This function allows an issuer to withdraw the withheld tax.

```text
    /**
     * @notice Allows issuer to withdraw withheld tax
     * @param _dividendIndex Dividend to withdraw from
     */
    function withdrawWithholding(uint256 _dividendIndex) external withPerm(OPERATOR)
```

