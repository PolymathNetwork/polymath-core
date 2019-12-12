# Vesting-Escrow-Wallet

## Vesting Escrow Wallet

|  |  |
| :--- | :--- |
| **Introduced in** | 2.1.0 |
| **Contract name** | VestingEscrowWallet.sol |
| **Compatible protocol version** | ^3.0.0 |
| **Type** | Wallet Module |

## How it works

This module will allow approved staff to create a token \(ST\) vesting schedule for employees and/or affiliates so that tokens get delivered to their wallets as contractually defined. Admin can send tokens to and then select the address that would be able to withdraw them according to their specific vesting schedule.

### Key functionalities \(as defined in the Smart Contract\)

#### Initialization

This module should be configured by the treasury wallet address. You will need to call the configure function of this contract during creation. Note that the treasury wallet can be changed later by the owner.

```text
 /**
  * @notice Used to initialize the treasury wallet address
  * @param _treasuryWallet Address of the treasury wallet
  */
 function configure(address _treasuryWallet) public onlyFactory
```

### Managing templates

The Admin can add a new template or delete an existing template \(if a template isn’t used by any schedule\) at any time using the following functions:

#### Adding a Template

This function is used to add a template, without the given beneficiary address. This template can be reused by the issuer for the different beneficiary addresses.

```text
   /**
    * @notice Adds template that can be used for creating a schedule
    * @param _name Name of the template will be created
    * @param _numberOfTokens Number of tokens that should be assigned to schedule
    * @param _duration Duration of the vesting schedule
    * @param _frequency Frequency of the vesting schedule
    */
   function addTemplate(
      bytes32 _name,
      uint256 _numberOfTokens,
      uint256 _duration, 
      uint256 _frequency
   ) 
     external
     withPerm(ADMIN)
```

**Required checks**

* Template name shouldn’t be empty

  \*`_name` should be unique.

* number of tokens should be greater than zero.
* `_frequency` should be the factor of duration.
* `_periodCount` should be the factor of the `_numberOfTokens`.
* `granularity of the token` should be the factor of `amountPerPeriod`.

#### Removing template

This function is used to remove templates and their respective names. **Note:** Please take into consideration that the template can't be removed if at least one schedule already uses it. /\*\*

* @notice Removes template with a given name
* @param \_name Name of the template that will be removed

  \*/

  function removeTemplate\(bytes32 \_name\) external withPerm\(ADMIN\)

**Required checks**

* The template should already exist in the contract storage.
* The template shouldn’t be used by any schedules.

### Managing schedules

These functions allow for the admin/issuer to add a new schedule, modify or revoke existing schedule at any time using the following functions:

#### Add Schedule

This function is used for creating vesting schedules for each beneficiary.

```text
   /**
    * @notice Adds vesting schedules for each of the beneficiary's address
    * @param _beneficiary Address of the beneficiary for whom it is scheduled
    * @param _templateName Name of the template that will be created
    * @param _numberOfTokens Total number of tokens for created schedule
    * @param _duration Duration of the created vesting schedule
    * @param _frequency Frequency of the created vesting schedule
    * @param _startTime Start time of the created vesting schedule
    */
   function addSchedule(
        address _beneficiary,
        bytes32 _templateName,
        uint256 _numberOfTokens,
        uint256 _duration,
        uint256 _frequency,
        uint256 _startTime
   )
      external
      withPerm(ADMIN)
```

**Required checks**

* The beneficiary address shouldn’t be empty.
* Template name shouldn’t be empty.
* Template name should be unique.
* Number of tokens should be positive value.
* Frequency should be a factor of the duration.
* Period count should be factor of `_numberOfTokens`.
* Granularity should be the factor of `amountPerPeriod`
* Schedule with an appropriate template name shouldn’t be added to the beneficiary address
* Startime shouldn’t be in the past

#### Add Schedule Multi

This function is used to bulk add respective vesting schedules for each of the beneficiaries.

```text
/**
 * @notice Used to bulk add vesting schedules for each of beneficiary
 * @param _beneficiaries Array of the beneficiary's addresses
 * @param _templateNames Array of the template names
 * @param _numberOfTokens Array of number of tokens should be assigned to schedules
 * @param _durations Array of the vesting duration
 * @param _frequencies Array of the vesting frequency
 * @param _startTimes Array of the vesting start time
 */
function addScheduleMulti(
    address[] memory _beneficiaries,
    bytes32[] memory _templateNames,
    uint256[] memory _numberOfTokens,
    uint256[] memory _durations,
    uint256[] memory _frequencies,
    uint256[] memory _startTimes
)
    public
    withPerm(ADMIN)
```

**Required checks**

* All restrictions are same as above.
* All arrays should have the same length

#### Adding Schedule From Template

This function is for adding vesting schedules from a template for each beneficiary.

```text
  /**
   * @notice Adds vesting schedules from template for the beneficiary
   * @param _beneficiary Address of the beneficiary for whom it is scheduled
   * @param _templateName Name of the exists template
   * @param _startTime Start time of the created vesting schedule
   */
  function addScheduleFromTemplate(address _beneficiary, bytes32 _templateName, uint256 _startTime) external withPerm(ADMIN) {
```

**Required checks**

* The beneficiary address shouldn’t be empty.
* Template should be already created
* Schedule with an appropriate template name shouldn’t be added to the beneficiary address
* startTime shouldn’t be in the past

#### Add Schedule From Template Multi

This function is used to bulk add the vesting schedules from a template for each of the beneficiaries.

```text
/**
 * @notice Used to bulk add vesting schedules from template for each of the beneficiary
 * @param _beneficiaries Array of beneficiary's addresses
 * @param _templateNames Array of the template names were used for schedule creation
 * @param _startTimes Array of the vesting start time
 */
function addScheduleFromTemplateMulti(
    address[] memory _beneficiaries,
    bytes32[] memory _templateNames,
    uint256[] memory _startTimes
)
    public
    withPerm(ADMIN)
```

**Required checks**

* The same restrictions applied as above.
* All arrays should have the same length

#### Revoking schedule

This function is used to revoke a beneficiary’s schedule.

```text
  /**
   * @notice Revokes vesting schedule with given template name for a given beneficiary
   * @param _beneficiary Address of the beneficiary for whom it is revoked
   * @param _templateName Name of the template was used for schedule creation
   */
  function revokeSchedule(address _beneficiary, bytes32 _templateName) external withPerm(ADMIN) {
```

**Required checks**

* The beneficiary address shouldn’t be empty
* Schedule with the given template name should be already added to the beneficiary address

#### Revoking Schedules Multi

This function is used to bulk revoke vesting schedules for each of the beneficiaries.

```text
   /**
    * @notice Used to bulk revoke vesting schedules for each of the beneficiaries
    * @param _beneficiaries Array of the beneficiary's addresses
    */
   function revokeSchedulesMulti(address[] memory _beneficiaries) public withPerm(ADMIN)
```

#### Revoke all schedules

This function is used to revoke all of the beneficiaries'schedules.

```text
  /**
   * @notice Revokes all vesting schedules for given beneficiary's address
   * @param _beneficiary Address of the beneficiary for whom all schedules will be revoked
   */
  function revokeAllSchedules(address _beneficiary) public withPerm(ADMIN)
```

**Required checks**

* Beneficiary address shouldn’t be empty

### Modify Schedule

This function is used to modify vesting schedules for each beneficiary. Note that only the start time for the schedule can be changed. If you need to modify other fields you have to remove and then add a schedule.

```text
 /**
  * @notice Modifies vesting schedules for each of the beneficiary
  * @param _beneficiary Address of the beneficiary for whom it is modified
  * @param _templateName Name of the template was used for schedule creation
  * @param _startTime Start time of the created vesting schedule
  */
  function modifySchedule(address _beneficiary, bytes32 _templateName, uint256 _startTime) public withPerm(ADMIN) {
```

**Required checks**

* The beneficiary address shouldn’t be empty
* Schedule with the given template name should be already added to the beneficiary address
* startTime shouldn’t be in the past
* Given schedule shouldn’t be already started

#### Modify Schedule Multi

This function is used to bulk modify vesting schedules for each of the beneficiaries.

```text
  /**
   * @notice Used to bulk modify vesting schedules for each of the beneficiaries
   * @param _beneficiaries Array of the beneficiary's addresses
   * @param _templateNames Array of the template names
   * @param _startTimes Array of the vesting start time
   */
  function modifyScheduleMulti(
      address[] memory _beneficiaries,
      bytes32[] memory _templateNames,
      uint256[] memory _startTimes
  )
     public
     withPerm(ADMIN)
```

**Required checks**

* All arrays should have the same length

### Depositing/withdrawing tokens

An admin/issuer can deposit tokens to the wallet and withdraw tokens from it. Depositing can be done by any delegate using an account with tokens. On the other hand, when tokens get withdraw from the contract, the receiver always is the treasury wallet.

#### Deposit Tokens

This function used for the issuer to deposit tokens from their treasury.

```text
  /**
   * @notice Used to deposit tokens from treasury wallet to the vesting escrow wallet
   * @param _numberOfTokens Number of tokens that should be deposited
   */
  function depositTokens(uint256 _numberOfTokens) external withPerm(ADMIN)
```

**Required checks**

* `_numberOf Tokens` should be a positive value

#### Send To Treasury

This function allows the issuer to send the unassigned tokens to their treasury.

```text
 /**
  * @notice Sends unassigned tokens to the treasury wallet
  * @param _amount Amount of tokens that should be sent to the treasury wallet
  */
 function sendToTreasury(uint256 _amount) external withPerm(ADMIN)
```

**Required checks**

* `_amount` should be greater than zero.
* `_amount` shouldn’t be greater than unassigned tokens.

#### Change Treasury Wallet

This function is used to change the treasury wallet address. Please note that only the issuer can change the treasury wallet.

```text
  /**
   * @notice Used to change the treasury wallet address
   * @param _newTreasuryWallet Address of the treasury wallet
   */
 function changeTreasuryWallet(address _newTreasuryWallet) public onlyOwner
```

**Required checks**

* Treasury wallet address shouldn’t be empty

#### Push Available Tokens

This function allows the issuer to push available tokens to the respective beneficiaries.This function is used when any employee/beneficiary did not withdraw its available tokens then issuer/admin has the right to forcefully push the tokens to the beneficiary address.

```text
  /**
   * @notice Pushes available tokens to the beneficiary's address
   * @param _beneficiary Address of the beneficiary who will receive tokens
   */
 function pushAvailableTokens(address _beneficiary) public withPerm(ADMIN)
```

#### Pull Available Tokens

This function allows beneficiaries to withdraw available tokens as per their schedule calculations.

```text
   /**
    * @notice Used to withdraw available tokens by beneficiary
    */
   function pullAvailableTokens() external
```

#### Push Available Tokens Multi

This function allows the issuer to bulk send available tokens for each beneficiary. To avoid `out of gas` issue we are using the indexing process so the issuer can push tokens to given index range.

```text
  /**
   * @notice Used to bulk send available tokens for each of the beneficiaries
   * @param _fromIndex Start index of array of beneficiary's addresses
   * @param _toIndex End index of array of beneficiary's addresses
   */
  function pushAvailableTokensMulti(uint256 _fromIndex, uint256 _toIndex) public withPerm(OPERATOR)
```

**Required checks**

* `_toIndex` should be within the bounds of the beneficiary array

### Getters

### Get schedule data

This function is called to return a specific beneficiary’s schedule.

```text
 /**
  * @notice Returns beneficiary's schedule created using template name
  * @param _beneficiary Address of the beneficiary who will receive tokens
  * @param _templateName Name of the template was used for schedule creation
  * @return beneficiary's schedule data (numberOfTokens, duration, frequency, startTime, claimedTokens, State)
  */
  function getSchedule(address _beneficiary, bytes32 _templateName) external view returns(uint256, uint256, uint256, uint256, uint256, State) {
```

### Getting Template Names

This function is used to return a list of template names as well as for which have been used for schedule creation for some beneficiaries.

```text
  /**
   * @notice Returns list of the template names for given beneficiary's address
   * @param _beneficiary Address of the beneficiary
   * @return List of the template names that were used for schedule creation
   */
  function getTemplateNames(address _beneficiary) external view returns(bytes32[] memory)
```

**Required checks**

* Beneficiary address shouldn’t be empty

### Get schedule count

This function is used to return the count of a beneficiary’s schedules.

```text
  /**
   * @notice Returns count of the schedules were created for given beneficiary
   * @param _beneficiary Address of the beneficiary
   * @return Count of beneficiary's schedules
   */
  function getScheduleCount(address _beneficiary) external view returns(uint256) {
```

**Required checks**

* Beneficiary address shouldn’t be empty

### Get schedule count by template

It returns schedule count for a given template.

```text
    /**
     * @notice Returns the schedule count per template
     * @param _templateName Name of the template
     * @return count of schedules
     */
   function getSchedulesCountByTemplate(bytes32 _templateName) external view returns(uint256)
```

#### Get template count

This function returns the count of the templates contract has.

```text
  /**
   * @notice Returns count of the templates can be used for creating schedule
   * @return Count of the templates
   */
  function getTemplateCount() external view returns(uint256)
```

#### Get template names

This function allows the issuer to get a list of the template names that they have set up.

```text
  /**
   * @notice Gets the list of the template names those can be used for creating schedule
   * @return bytes32 Array of all template names were created
   */
  function getAllTemplateNames() external view returns(bytes32[])
```

#### Get treasury wallet

This function allows to retrieves the treasury wallet address. If `VEW` has its own treasury wallet address then this function returns that otherwise, it returns the global treasury wallet address.

```text
 /**
  * @notice Returns the treasury wallet address
  */
 function getTreasuryWallet() public view returns(address)
```

#### Get all beneficiaries

Returns the list of beneficiaries.

```text
 /**
  * @notice Returns the list of all beneficiary 
  * @return List of addresses
  */
  function getAllBeneficiaries() external view returns(address[] memory)
```

#### Get Available tokens

Returns the quantity of the token that can be withdrawn from the contract at the moment.

```text
   /**
    * @notice Returns the tokens quantity that can be withdrawn from the contract at a moment
    * @param _beneficiary Address of the beneficiary
    * @return availableTokens Tokens amount that are available to withdraw
    */
   function getAvailableTokens(address _beneficiary) external view returns(uint256 availableTokens)
```

