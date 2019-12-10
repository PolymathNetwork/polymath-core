# Manual Approval Transfer Manager

|  |  |
| :--- | :--- |
| **Introduced in** | 2.0.0 |
| **Contract name** | ManualApprovalTransferManager.sol |
| **Type** | Transfer Manager Module |
| **Compatible Protocol Version** | ^2.0.0 |

## How it works

The Manual Approval Transfer Manager module works by allowing to manually approve or block transactions between account addresses. The Manual approval allows the issuer to create an allowance \(that has been approved\) with an added expiry time frame for the allowance period. **This will cause a transaction from said from/to accounts to succeed even if a different TM said otherwise \(or even if those accounts were not part of the GTM’s whitelist\)**. Whereas the manual blocking allows the issuer to specify a list of blocked address pairs with an associated expiry time for the block. **In this case, this will make the transaction fail, even if all the other TMs said the transaction was approved**.

## Key functionalities \(as defined in the Smart Contract\)

## Initialization

This module has no initialization.

## Transfer Restriction

This function is used to verify the transfer transaction and allow a manually approved transaction to bypass other restrictions.

**Note:** This function must only be called by the associated security token.

```text
    /**
     * @notice Used to verify the transfer transaction and allow a manually approved transaction to bypass other restrictions
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
        onlySecurityToken
        returns(Result)
```

### Add Manual Approval

This function allows the issuer to add a pair of addresses to the manual approvals.

**Note:** An investor can only have one manual approval at a time. If a second manual approval needs to be added for an investor, the existing one must first be revoked unless it has a zero allowance.

```text
   /**
    * @notice Adds a pair of addresses to manual approvals
    * @param _from is the address from which transfers are approved
    * @param _to is the address to which transfers are approved
    * @param _allowance is the approved amount of tokens
    * @param _expiryTime is the time until which the transfer is allowed
    * @param _description Description about the manual approval
    */
    function addManualApproval(
        address _from,
        address _to,
        uint256 _allowance,
        uint256 _expiryTime,
        bytes32 _description
    )
        external
        withPerm(ADMIN)
```

### Add Manual Approval Multi

This function allows the issuer to add multiple manual approvals in a batch.

```text
   /**
    * @notice Adds multiple manual approvals in batch
    * @param _from is the address array from which transfers are approved
    * @param _to is the address array to which transfers are approved
    * @param _allowances is the array of approved amounts
    * @param _expiryTimes is the array of the times until which each transfer is allowed
    * @param _descriptions is the description array for these manual approvals
    */
    function addManualApprovalMulti(
        address[] memory _from,
        address[] memory _to,
        uint256[] memory _allowances,
        uint256[] memory _expiryTimes,
        bytes32[] memory _descriptions
    )
        public
        withPerm(ADMIN)
```

### Modify Manual Approval

This function allows the issuer to modify their existing manual approvals.

```text
   /**
    * @notice Modify the existing manual approvals
    * @param _from is the address from which transfers are approved
    * @param _to is the address to which transfers are approved
    * @param _expiryTime is the time until which the transfer is allowed
    * @param _changeInAllowance is the change in allowance
    * @param _description Description about the manual approval
    * @param _increase tells whether the allowances will be increased (true) or decreased (false).
    * or any value when there is no change in allowances
    */
    function modifyManualApproval(
        address _from,
        address _to,
        uint256 _expiryTime,
        uint256 _changeInAllowance,
        bytes32 _description,
        bool _increase
    )
        external
        withPerm(ADMIN)
```

### Modify Manual Approval Multi

This function allows the issuer to add multiple manual approvals in a batch.

```text
    /**
     * @notice Adds multiple manual approvals in batch
     * @param _from is the address array from which transfers are approved
     * @param _to is the address array to which transfers are approved
     * @param _expiryTimes is the array of the times until which each transfer is allowed
     * @param _changeInAllowance is the array of change in allowances
     * @param _descriptions is the description array for these manual approvals
     * @param _increase Array of bools that tells whether the allowances will be increased (true) or decreased (false).
     * or any value when there is no change in allowances
     */
    function modifyManualApprovalMulti(
        address[] memory _from,
        address[] memory _to,
        uint256[] memory _expiryTimes,
        uint256[] memory _changeInAllowance,
        bytes32[] memory _descriptions,
        bool[] memory _increase
    )
        public
        withPerm(ADMIN)
```

### Revoke Manual Approval

This function allows the issuer to remove addresses from the manual approvals. For example, when adding a manual approval, an “entry” is created saying A to B to allow this transfer. This function deletes said entry.

```text
   /**
    * @notice Removes a pair of addresses from manual approvals
    * @param _from is the address from which transfers are approved
    * @param _to is the address to which transfers are approved
    */
    function revokeManualApproval(address _from, address _to) external withPerm(ADMIN)
```

### Revoke Manual Approval Multi

This function allows the issuer to remove multiple pairs of addresses form manual approvals.

**Requirements:**

* This function requires that \(\_from.length == \_to.length, "Input array length mismatch"\)

```text
    /**
    * @notice Removes multiple pairs of addresses from manual approvals
    * @param _from is the address array from which transfers are approved
    * @param _to is the address array to which transfers are approved
    */
    function revokeManualApprovalMulti(address[] calldata _from, address[] calldata _to) external withPerm(ADMIN)
```

### Get Active Approvals To User

This function gets called to return all the actives approvals that correspond to a specific address.

```text
   /**
    * @notice Returns all active approvals correspond to an address
    * @param _user Address of the holder corresponds to whom the list of manual approvals
    * need to return
    * @return address[] addresses from
    * @return address[] addresses to
    * @return uint256[] initial allowances provided to the approvals
* @return uint256[] remaining allowance of an approval
    * @return uint256[] expiry times provided to the approvals
    * @return bytes32[] descriptions provided to the approvals
    */
    function getActiveApprovalsToUser(address _user) external view returns(address[] memory, address[] memory, uint256[] memory, uint256[] memory, uint256[] memory, bytes32[] memory)
```

### Get Approval Details

This function retrieves the details of the approval that corresponds to \_from and \_to addresses.

```text
    /**
     * @notice Get the details of the approval corresponds to _from & _to addresses
     * @param _from Address of the sender
     * @param _to Address of the receiver
     * @return uint256 expiryTime of the approval
     * @return uint256 allowance provided to the approval
     * @return uint256 the remaining allowance
     * @return uint256 Description provided to the approval
     */
     function getApprovalDetails(address _from, address _to) external view returns(uint256, uint256,uint256, bytes32)
```

### Get Total Approvals Length

This function simply returns the current number of active approvals

```text
    /**
     * @notice Returns the current number of active approvals
     */
     function getTotalApprovalsLength()
```

### Get All Approvals

Get the details of all the transfer approvals

```text
     /**
      * @notice Get the details of all approvals
      * @return address[] addresses from
      * @return address[] addresses to
      * @return uint256[] initial allowances provided to the approvals
      * @return uint256[] the remaining allowance
      * @return uint256[] expiry times provided to the approvals
      * @return bytes32[] descriptions provided to the approvals
      */
      function getAllApprovals() external view returns(address[] memory, address[] memory, uint256[] memory, uint256[] memory, uint256[] memory, bytes32[] memory)
```

## Know Issues/bugs

* If a manual approval exists for two addresses, the only way to add a new manual approval for those address is revoking the first one, even if it was expired. \(This only affects further approvals between the SAME addresses in the SAME direction. I.E: If A → B = 100 tokens, can’t create a new A → B = 500 until the first A →B has been revoked. But A → C, B → C, C → A, C → B, and even B → A are still possible\). 
* Scope: Address-pair level, in the same order i.e. if allow 100 tokens from A to B, you can allow 1000 tokens from B to A. You will need to revoke the first approval if you want to allow 1000 tokens from A to B, even if the first approval is expired.
* It is possible to add manual approval and a manual blocking for the same pair of addresses. Due to the logic on `executeTransfer()`, blocking will always win.

