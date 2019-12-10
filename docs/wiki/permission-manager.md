# Permission-Manager

How to use the Permission Manager Module

Summary: This module simply runs the permission\_manager

Steps:

How to Use this CLI Feature \(Instructions\):

To Start, run either of the following commands:

`node CLI/polymath-cli permission_manager` or `$ node CLI/polymath-cli pm` \(Runs permission\_manager\)

## Walkthrough Example

**1. Granting permission**

```text
$ node CLI/polymath-cli pm

***********************************************
Welcome to the Command-Line Permission Manager.
***********************************************
Issuer Account: 0xe5C33B639a4D8f364AE1Cf8b143Ee93AA0EaEC78

Enter the token symbol: CP
General Permission Manager is not attached.
Do you want to add General Permission Manager Module to your Security Token? [y/n]: y
---- Transaction executed: addModule - Gas limit provided: 2662854 ----

  Your transaction is being processed. Please wait...
  TxHash: 0xd3bece69408707b56495a6ac61d9a9d5f2b8f66621afaa7136a87d2aef5abd6a

  Congratulations! The transaction was successfully completed.
  Gas used: 2219045 - Gas spent: 0.11095225 Ether
  Review it on Etherscan.
  TxHash: 0xd3bece69408707b56495a6ac61d9a9d5f2b8f66621afaa7136a87d2aef5abd6a

Module deployed at address: 0x254482F627E10d60Bd46b1965A121ef9D509a18b

Permission Manager - Change Permission

[1] Add new delegate

Select a delegate [1]: 1
Enter the delegate address: 0x974d0e9316dad2ca30f48cf20cd470f616325a8b
Enter the delegate details (i.e `Belongs to financial firm`): finance firm
---- Transaction executed: addDelegate - Gas limit provided: 108934 ----

  Your transaction is being processed. Please wait...
  TxHash: 0xaf313b025b8acf2eb0bbccf2b379f1063f41f296595fde4e16b98d516904db6f

  Congratulations! The transaction was successfully completed.
  Gas used: 90778 - Gas spent: 0.0045389 Ether
  Review it on Etherscan.
  TxHash: 0xaf313b025b8acf2eb0bbccf2b379f1063f41f296595fde4e16b98d516904db6f

Delegate added succesfully: 0x974D0e9316dAd2Ca30F48CF20CD470F616325A8B - finance firm

[1] GeneralPermissionManager
[2] GeneralTransferManager

Select a module [1/2]: 1

[1] CHANGE_PERMISSION

Select a permission [1]: 1

[1] Grant permission
[2] Revoke permission

What do you want to do? [1/2]: 1
---- Transaction executed: changePermission - Gas limit provided: 105892 ----

  Your transaction is being processed. Please wait...
  TxHash: 0x9c3a55339d5835b14e73b2ad1a147a5c449b297f123ae7df7f2e622e952e3a08

  Congratulations! The transaction was successfully completed.
  Gas used: 52946 - Gas spent: 0.0026473 Ether
  Review it on Etherscan.
  TxHash: 0x9c3a55339d5835b14e73b2ad1a147a5c449b297f123ae7df7f2e622e952e3a08

Permission changed successfully.
```

**2. Revoking access**

```text
***********************************************
Welcome to the Command-Line Permission Manager.
***********************************************
Issuer Account: 0xe5C33B639a4D8f364AE1Cf8b143Ee93AA0EaEC78

Enter the token symbol: CP

Permission Manager - Change Permission

[1] Add new delegate
[2] Account: 0x974D0e9316dAd2Ca30F48CF20CD470F616325A8B
    Details: finance firm
    Permisions: 
      GeneralPermissionManager (0x254482F627E10d60Bd46b1965A121ef9D509a18b) -> CHANGE_PERMISSION

Select a delegate [1/2]: 2

[1] Remove
[2] Change permission

Select an option [1/2]: 2

[1] GeneralPermissionManager
[2] GeneralTransferManager

Select a module [1/2]: 1

[1] CHANGE_PERMISSION

Select a permission [1]: 1

[1] Grant permission
[2] Revoke permission

What do you want to do? [1/2]: 2
---- Transaction executed: changePermission - Gas limit provided: 75764 ----

  Your transaction is being processed. Please wait...
  TxHash: 0x794efbf103937e6174a1bed782dd32e05dae5117c61ab4ca8d1f638449fbc6ee

  Congratulations! The transaction was successfully completed.
  Gas used: 22882 - Gas spent: 0.0011441 Ether
  Review it on Etherscan.
  TxHash: 0x794efbf103937e6174a1bed782dd32e05dae5117c61ab4ca8d1f638449fbc6ee

Permission changed successfully.
```

**3. Remove the permission**

```text
***********************************************
Welcome to the Command-Line Permission Manager.
***********************************************
Issuer Account: 0xe5C33B639a4D8f364AE1Cf8b143Ee93AA0EaEC78

Enter the token symbol: CP

Permission Manager - Change Permission

[1] Add new delegate
[2] Account: 0x974D0e9316dAd2Ca30F48CF20CD470F616325A8B
    Details: finance firm
    Permisions: 
      GeneralPermissionManager (0x254482F627E10d60Bd46b1965A121ef9D509a18b) -> CHANGE_PERMISSION

Select a delegate [1/2]: 2

[1] Remove
[2] Change permission

Select an option [1/2]: 1
---- Transaction executed: deleteDelegate - Gas limit provided: 140470 ----

  Your transaction is being processed. Please wait...
  TxHash: 0xcd601be46395d9201bbf1f1cd0c840575cc2c6710ff6f4528dd7147ad7560e71

  Congratulations! The transaction was successfully completed.
  Gas used: 25235 - Gas spent: 0.00126175 Ether
  Review it on Etherscan.
  TxHash: 0xcd601be46395d9201bbf1f1cd0c840575cc2c6710ff6f4528dd7147ad7560e71

Delegate successfully deleted.
```

### Troubleshooting / FAQs

n/a

