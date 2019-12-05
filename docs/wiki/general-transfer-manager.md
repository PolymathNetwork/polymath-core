# General Transfer Manager

|  |  |
| :--- | :--- |
| **Introduced in** | 1.0.0 |
| **Contract name** | GeneralTransferManager |
| **Type** | Transfer Manager Module |
| **Compatible Protocol Version** | ^3.0.0 |

## How it works

The General Transfer Manager module is for core transfer validation functionality. This module manages the transfer restrictions for the Security Token. By default, the GTM only allows whitelisted addresses to buy or sell the tokens.

## Key functionalities \(as defined in the Smart Contract\)

### Initialization

The contract doesn’t need any type of initialization.

### Transfer Restriction

The `executeTransfer()` function try to understand the behavior of the transaction whether it is an issuance txn, redemption or general transaction \(normal transfer of tokens\) and accordingly it will use `TransferRequirement` set to validate the transaction.

* If `_from` address is the issuance address then transaction type is issuance.
  * TransferRequirement set looks like \(fromValidKYC = false, toValidKYC = true, fromRestricted = false, toRestricted = false\).
* If `_to` address is the zero address then transaction type is redemption. 
  * TransferRequirement set looks like \(fromValidKYC =true, toValidKYC =false, fromRestricted = false, toRestricted = false\).
* Otherwise, it is general transfer transaction.
  * TransferRequirement set looks like \(fromValidKYC =true, toValidKYC =true, fromRestricted =true, toRestricted =true\).

TransferRequirement is the set of flags that need to be valid according to the transaction type. This set of flags can be manipulated that leads to change in transaction validation rules \(ex- allowing the transfer without verifying whether the sender or receiver is in whitelist or not\).

**fromValidKYC** → Defines if KYC is required for the sender.  
**toValidKYC** → Defines if KYC is required for the receiver.  
**fromRestricted** → Defines if transfer time restriction is checked for the sender.  
**toRestricted** → Defines if transfer time restriction is checked for the receiver.

**Note:** When the contract is paused, it will not check any of the above conditions. `executeTransfer()` also facilitates the dynamic whitelisting of the addresses.

```text
    /**
     * @notice Default implementation of verifyTransfer used by SecurityToken
     * If the transfer request comes from the STO, it only checks that the investor is in the whitelist
     * If the transfer request comes from a token holder, it checks that:
     * a) Both are on the whitelist
     * b) Seller's sale lockup period is over
     * c) Buyer's purchase lockup is over
     * @param _from Address of the sender
     * @param _to Address of the receiver
    */
    function executeTransfer(
        address _from,
        address _to,
        uint256 /*_amount*/,
        bytes calldata _data
    ) external returns(Result)
```

### VerifyTransfer

It is a stateless function which is used to verify the transaction without changing the storage value.

Below functionality will be released after 3.1.0 release - `verifyTransfer()` will allow dynamic whitelisting by providing the valid \_data parameter. It has the special check which will skip the valid treasury wallet & modules having type `8` can be skipped dynamically.

```text
  /**
   * @notice Default implementation of verifyTransfer used by SecurityToken
   * @param _from Address of the sender
   * @param _to Address of the receiver
   */
  function verifyTransfer(
      address _from,
      address _to,
      uint256 /*_amount*/,
      bytes memory _data
  )
     public
     view
     returns(Result, bytes32)
```

### Change issuance address

This function is used to change the issuance addresses of your STO.

```text
    /**
     * @notice Used to change the Issuance Address
     * @param _issuanceAddress new address for the issuance
     */
    function changeIssuanceAddress(address _issuanceAddress) public withPerm(ADMIN)
```

### Modify KYC data

To add or remove addresses from a whitelist. Every piece of data related to whitelist is stored in the data store of the securityToken.

```text
     /**
      * @notice Add or remove KYC info of an investor.
      * @param _investor is the address to the whitelist
      * @param _canSendAfter is the moment when the sale lockup period ends and the investor can freely sell or transfer their tokens
      * @param _canReceiveAfter is the moment when the purchase lockup period ends and the investor can freely purchase or receive tokens from others
      * @param _expiryTime is the moment till investors KYC will be validated. After that investor need to do re-KYC
      */
      function modifyKYCData(
          address _investor,
          uint64 _canSendAfter,
          uint64 _canReceiveAfter,
          uint64 _expiryTime
      )
         public
         withPerm(ADMIN)
```

### Modify KYC data of multiple addresses

Add or remove multiple addresses from the whitelist.

```text
     /**
      * @notice Add or remove KYC info of an investor.
      * @param _investors is the address to the whitelist
      * @param _canSendAfter is the moment when the sale lockup period ends and the investor can freely sell his tokens
      * @param _canReceiveAfter is the moment when the purchase lockup period ends and the investor can freely purchase tokens from others
      * @param _expiryTime is the moment till investors KYC will be validated. After that investor need to do re-KYC
      */
      function modifyKYCDataMulti(
          address[] memory _investors,
          uint64[] memory _canSendAfter,
          uint64[] memory _canReceiveAfter,
          uint64[] memory _expiryTime
      )
          public
          withPerm(ADMIN)
```

### Modify KYC data using signed transaction

This function can be called by anyone who has a valid signature and allows that person to add or remove an address from the whitelist.

```text
   /**
    * @notice Adds or removes addresses from the whitelist - can be called by anyone with a valid signature
    * @param _investor is the address to the whitelist
    * @param _canSendAfter is the moment when the sale lockup period ends and the investor can freely sell his tokens
    * @param _canReceiveAfter is the moment when the purchase lockup period ends and the investor can freely purchase tokens from others
    * @param _expiryTime is the moment till investors KYC will be validated. After that investor need to do re-KYC
    * @param _validFrom is the time that this signature is valid from
    * @param _validTo is the time that this signature is valid until
    * @param _nonce nonce of signature (avoid replay attack)
    * @param _signature issuer signature
    */
    function modifyKYCDataSigned(
        address _investor,
        uint256 _canSendAfter,
        uint256 _canReceiveAfter,
        uint256 _expiryTime,
        uint256 _validFrom,
        uint256 _validTo,
        uint256 _nonce,
        bytes memory _signature
    )
        public
```

### Modify the KYC data using multiple signed data

This function can be called by anyone who has a valid signature and allows that person to add or remove multiple addresses from the whitelist.

```text
  /**
    * @notice Adds or removes addresses from the whitelist - can be called by anyone with a valid signature
    * @dev using uint256 for some uint256 variables as web3 wasn't packing and hashing uint64 arrays properly
    * @param _investor is the address to the whitelist
    * @param _canSendAfter is the moment when the sale lockup period ends and the investor can freely sell his tokens
    * @param _canReceiveAfter is the moment when the purchase lockup period ends and the investor can freely purchase tokens from others
    * @param _expiryTime is the moment till investors KYC will be validated. After that investor need to do re-KYC
    * @param _validFrom is the time that this signature is valid from
    * @param _validTo is the time that this signature is valid until
    * @param _nonce nonce of signature (avoid replay attack)
    * @param _signature issuer signature
    */
    function modifyKYCDataSignedMulti(
        address[] memory _investor,
        uint256[] memory _canSendAfter,
        uint256[] memory _canReceiveAfter,
        uint256[] memory _expiryTime,
        uint256 _validFrom,
        uint256 _validTo,
        uint256 _nonce,
        bytes memory _signature
    )
        public
```

### Modify investor flag

Flags represent the additional information about the investor i.e whether the investor is accredited or not.

```text
   /**
    * @notice Used to modify investor Flag.
    * @dev Flags are properties about investors that can be true or false like isAccredited
    * @param _investor is the address of the investor.
    * @param _flag index of flag to change. flag is used to know specifics about investor like isAccredited.
    * @param _value value of the flag. a flag can be true or false.
    */
    function modifyInvestorFlag(
        address _investor,
        uint8 _flag,
        bool _value
    )
        public
        withPerm(ADMIN)
```

### Modify investors flags

Used to modify the flag value of multiple investors

```text
   /**
    * @notice Used to modify investor data.
    * @param _investors List of the addresses to modify data about.
    * @param _flag index of flag to change. flag is used to know specifics about investor like isAccredited.
    * @param _value value of the flag. a flag can be true or false.
    */
    function modifyInvestorFlagMulti(
        address[] memory _investors,
        uint8[] memory _flag,
        bool[] memory _value
    )
        public
        withPerm(ADMIN)
```

### Modify transfer requirements

Used to modify the transfer validation rules of given transaction type

```text
   /**
    * @notice Modifies the successful checks required for a transfer to be deemed valid.
    * @param _transferType Type of transfer (0 = General, 1 = Issuance, 2 = Redemption)
    * @param _fromValidKYC Defines if KYC is required for the sender
    * @param _toValidKYC Defines if KYC is required for the receiver
    * @param _fromRestricted Defines if transfer time restriction is checked for the sender
    * @param _toRestricted Defines if transfer time restriction is checked for the receiver
    */
    function modifyTransferRequirements(
        TransferType _transferType,
        bool _fromValidKYC,
        bool _toValidKYC,
        bool _fromRestricted,
        bool _toRestricted
    ) public withPerm(ADMIN)
```

### Modify the transfer requirements of multiple transaction types

Used to modify the transfer validation rules of multiple transaction types

```text
   /**
    * @notice Modifies the successful checks required for transfers.
    * @param _transferTypes Types of transfer (0 = General, 1 = Issuance, 2 = Redemption)
    * @param _fromValidKYC Defines if KYC is required for the sender
    * @param _toValidKYC Defines if KYC is required for the receiver
    * @param _fromRestricted Defines if transfer time restriction is checked for the sender
    * @param _toRestricted Defines if transfer time restriction is checked for the receiver
    */
    function modifyTransferRequirementsMulti(
        TransferType[] memory _transferTypes,
        bool[] memory _fromValidKYC,
        bool[] memory _toValidKYC,
        bool[] memory _fromRestricted,
        bool[] memory _toRestricted
    ) public withPerm(ADMIN)
```

### Change the default times \(canSendAfter / canReceiveAfter\)

```text
    /**
     * @notice Used to change the default times used when canSendAfter / canReceiveAfter are zero
     * @param _defaultCanSendAfter default for zero canSendAfter
     * @param _defaultCanReceiveAfter default for zero canReceiveAfter
     */
    function changeDefaults(uint64 _defaultCanSendAfter, uint64 _defaultCanReceiveAfter) public withPerm(ADMIN)
```

### Getters

* `getAllInvestors()` returns the list of all investors.
* `getInvestors(uint256 _fromIndex, uint256 _toIndex)`  Returns list of investors in a range
* `getAllInvestorFlags()` returns the flags of all investors.
* `getInvestorFlag(address _investor, uint8 _flag)` returns the given flag value.
* `getInvestorFlags(address _investor)` returns all flags of the given investor.
* `getAllKYCData()` returns all KYC data.
* `getKYCData(address[] calldata _investors)` returns the KYC data of given investors.
* `getTokensByPartition()` returns the amount of tokens for a given user as per the partition.

