# Percentage Transfer Manager

|  |  |
| :--- | :--- |
| **Introduced in** | 2.0.0 |
| **Contract name** | PercentageTransferManager.sol |
| **Type** | Transfer Manager Module |
| **Compatible Protocol Version** | ^3.0.0 |

## How it works

This contract is a transfer manager for limiting the percentage of token supply that a single address can hold.

**DISCLAIMER**

Under certain conditions, the limit could be bypassed if a large token holder does the following:

* Redeems a huge portion of their tokens. It will cause the total supply to drop which can result in some other token holders having a percentage of tokens higher than the intended limit.

## Key functionalities \(as defined in the Smart Contract\)

### Initialization

**Configure**

This function is used to initialize the variables on the entire contract

```text
    /**
     * @notice Used to initialize the variables of the contract
     * @param _maxHolderPercentage Maximum amount of ST20 tokens(in %) can hold by the investor
     */
    function configure(uint256 _maxHolderPercentage, bool _allowPrimaryIssuance) public onlyFactory
```

### Transfer Restrictions

This function is used to verify the transfer transaction and prevent a given account to end up with more tokens than it is allowed to. It also works by checking if an address is on the whitelist, then allowing that address to hold more than `maxHolderPercentage` of the tokens.

```text
    /** 
     * @notice Used to verify the transfer transaction and prevent a given account to end up with more tokens than allowed
     * @param _from Address of the sender
     * @param _to Address of the receiver
     * @param _amount The number of tokens to transfer
     */
    function executeTransfer(
        address _from,
        address _to,
        uint256 _amount,
        bytes calldata /* _data */
    )
        external
        returns(Result)
```

### ChangeHolderPercentage

This function sets the maximum percentage that an individual investor / token holder can hold.

```text
  /**
    * @notice sets the maximum percentage that an individual token holder can hold
    * @param _maxHolderPercentage is the new maximum percentage (multiplied by 10**16)
    */
    function changeHolderPercentage(uint256 _maxHolderPercentage) public withPerm(ADMIN)
```

### ModifyWhitelist

This function allows the issuers to add or remove investor addresses from a whitelist. If an address is on the whitelist, it is allowed to hold more than `maxHolderPercentage` of the tokens.

```text
   /**
    * @notice adds or removes addresses from the whitelist.
    * @param _investor is the address to the whitelist
    * @param _valid whether or not the address it to be added or removed from the whitelist
    */
    function modifyWhitelist(address _investor, bool _valid) public withPerm(ADMIN
```

### ModifyWhitelistMulti

This function allows issuers to add or remove investor addresses from their STO whitelist.

```text
   /**
    * @notice adds or removes addresses from the whitelist.
    * @param _investors Array of the addresses to whitelist
    * @param _valids Array of boolean value to decide whether or not the address it to be added or removed from the whitelist
    */
    function modifyWhitelistMulti(address[] memory _investors, bool[] memory _valids) public withPerm(ADMIN)
```

### SetAllowPrimaryIssuance

This function allows the issuer to set whether or not they want to consider a primary issuance of transfers. The PercentageTM has a flag the allows for bypassing the restriction on “primary issuance” as we can’t differentiate whether minting is coming from and STO or Issuer \(issue function directly\), this flag will also allow bypassing the restriction when the issuer is minting tokens.

```text
   /**
    * @notice sets whether or not to consider primary issuance transfers
    * @param _allowPrimaryIssuance whether to allow all primary issuance transfers
    */
    function setAllowPrimaryIssuance(bool _allowPrimaryIssuance) public withPerm(ADMIN)
```

