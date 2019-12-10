# Count Transfer Manager

|  |  |
| :--- | :--- |
| **Introduced in** | 1.0.0 |
| **Contract name** | CountTransferManager.sol |
| **Type** | Transfer Manager Module |
| **Compatible Protocol Version** | ^3.0.0 |

## How it works

This contract is a transfer manager for limiting the maximum number of concurrent token holders.  
_**Note**_ : The Count TM allowed an investor to transfer all their tokens to another address when the limit was naturally reached \(no. Of investors = limit\) but it did not allow this to happen when the number of investors became more than the limit by force transfer. When a maximum holder amount is reached, one of the original holders can transfer all his tokens to a new holder \(not in the count list\) and then the original holder will be removed.

## Key functionalities \(as defined in the Smart Contract\)

### Initialization

This function is used to initialize the variables on the entire contract

```text
    /**
     * @notice Used to initialize the variables of the contract
     * @param _maxHolderCount Maximum no. of holders this module allows the SecurityToken to have
     */
    function configure(uint256 _maxHolderCount) public onlyFactory
```

## Transfer Restriction

This function is used to verify the transfer transaction and prevent a transfer if it passes the allowed amount of the token holder's limit.

```text
    /** 
     * @notice Used to verify the transfer transaction and prevent a transfer if it passes the allowed amount of token holders
     * @param _from Address of the sender
     * @param _to Address of the receiver
     * @param _amount Amount to send
     */
    function executeTransfer(
        address _from,
        address _to,
        uint256 _amount,
        bytes calldata /*_data*/
    )
        external
        returns(Result)
```

### VerifyTransfer

A stateless function that helps to validate the transaction without actually transferring the tokens.

```text
  /**
   * @notice Used to verify the transfer transaction and prevent a transfer if it passes the allowed amount of token holders
   * @dev module.verifyTransfer is called by SecToken.canTransfer and does not receive the updated holderCount therefore
   * verifyTransfer has to manually account for pot. token holder changes (by mimicking TokenLib.adjustInvestorCount).
   * module.executeTransfer is called by SecToken.transfer|issue|others and receives an updated holderCount 
   * as sectoken calls TokenLib.adjustInvestorCount before executeTransfer.
   * @param _from Address of the sender
   * @param _to Address of the receiver
   * @param _amount Amount to send
   */
  function verifyTransfer(
      address _from,
      address _to,
      uint256 _amount,
      bytes memory /* _data */
  )
    public
    view
    returns(Result, bytes32)
```

## ChangeHolderCount

This function allows the issuer to set the cap for the number of token holders there can be for an STO.

```text
   /**
    * @notice Sets the cap for the amount of token holders there can be
    * @param _maxHolderCount is the new maximum amount of token holders
    */
    function changeHolderCount(uint256 _maxHolderCount) public withPerm(ADMIN)
```

