# Token-Manager

## Summary

* This CLI feature allows issuers to manage their security token detials.

## How it works

This feature command allows you to modify the following: 1. Update token details 2. Freeze transfers 3. Create a checkpoint 4. List investors 5. Mint tokens 6. Manage modules 7. Withdraw tokens from contract

## How to Use this CLI Feature \(Instructions\):

Example Walkthrough:

```text
$ node CLI/polymath-cli stm

                                       /######%%,             /#(              
                                     ##########%%%%%,      ,%%%.      %        
                                  *#############%%%%%##%%%%%%#      ##         
                                (################%%%%#####%%%%//###%,          
                             .####################%%%%#########/               
                           (#########%%############%%%%%%%%%#%%%               
                       ,(%#%%%%%%%%%%%%############%%%%%%%###%%%.              
                  (######%%###%%%%%%%%##############%%%%%####%%%*              
                /#######%%%%######%%%%##########%###,.%######%%%(              
          #%%%%%#######%%%%%%###########%%%%%*######    /####%%%#              
         #.    ,%%####%%%%%%%(/#%%%%%%%%(    #%####        ,#%/                
     *#%(      .%%%##%%%%%%                 .%%%#*                             
               .%%%%#%%%%               .%%%###(                               
               %%%#####%                (%%.                                   
              #%###(,                                                          
             *#%#                                                              
             %%#                                                               
            *                                                                
            &%                                                                 
           %%%.                                                                                                                                                

*****************************************
Welcome to the Command-Line Token Manager
*****************************************
The following script will allow you to manage your ST-20 tokens
Issuer Account: 0xe5C33B639a4D8f364AE1Cf8b143Ee93AA0EaEC78


[1] CP - Deployed at 0xbb52625BFc826C2B653fA8dA12b4Ba4F0235dEc4
[2] Enter token symbol manually
[0] Exit

Select a token [1, 2, 0]: 1

********************    User Information    *********************
- Address:              0xe5C33B639a4D8f364AE1Cf8b143Ee93AA0EaEC78
- POLY balance:         999500
- ETH balance:          91.058279


***************    Security Token Information    ****************
- Address:              0xbb52625BFc826C2B653fA8dA12b4Ba4F0235dEc4
- Token symbol:         CP
- Token details:        
- Token version:        2.0.0
- Total supply:         0 CP
- Investors count:      0
- Current checkpoint:   0
- Transfer frozen:      NO
- Minting frozen:       NO
- User balance:         0 CP

*******************    Module Information    ********************
- Permission Manager:   1
- Transfer Manager:     1
- STO:                  1
- Checkpoint:           None
- Burn:                 None

Permission Manager Modules:
- GeneralPermissionManager is unarchived at 0x254482F627E10d60Bd46b1965A121ef9D509a18b
Transfer Manager Modules:
- GeneralTransferManager is unarchived at 0x3285B6b7f0C74753BEc5F88749989467B218527b
STO Modules:
- USDTieredSTO is unarchived at 0xE41C9d004D56a979BC373e1AE2a7D2eB29aA1F18

[1] Update token details
[2] Freeze transfers
[3] Create a checkpoint
[4] List investors
[5] Mint tokens
[6] Manage modules
[7] Withdraw tokens from contract
[0] Exit

What do you want to do? [1...7 / 0]:
```

* \[1\] Update Token Details

```text
Selected: Update token details
Enter new off-chain details of the token (i.e. Dropbox folder url): https://docs.google.com/document/d/1Z8TSbqOucZfY82HnR513l4i7nsHjzbBAAVTpaBHFe54/edit
---- Transaction executed: updateTokenDetails - Gas limit provided: 134723 ----

  Your transaction is being processed. Please wait...
  TxHash: 0xe926cded54f5bbcc3eeac2da64a2cda5bda7a3188074f582acff13b891c15c1a

  Congratulations! The transaction was successfully completed.
  Gas used: 112269 - Gas spent: 0.00561345 Ether
  Review it on Etherscan.
  TxHash: 0xe926cded54f5bbcc3eeac2da64a2cda5bda7a3188074f582acff13b891c15c1a

Token details have been updated successfully!

***************    Security Token Information    ****************
- Address:              0xbb52625BFc826C2B653fA8dA12b4Ba4F0235dEc4
- Token symbol:         CP
- Token details:        https://docs.google.com/document/d/1Z8TSbqOucZfY82HnR513l4i7nsHjzbBAAVTpaBHFe54/edit
- Token version:        2.0.0
- Total supply:         0 CP
- Investors count:      0
- Current checkpoint:   0
- Transfer frozen:      NO
- Minting frozen:       NO
- User balance:         0 CP

*******************    Module Information    ********************
- Permission Manager:   1
- Transfer Manager:     1
- STO:                  1
- Checkpoint:           None
- Burn:                 None

Permission Manager Modules:
- GeneralPermissionManager is unarchived at 0x254482F627E10d60Bd46b1965A121ef9D509a18b
Transfer Manager Modules:
- GeneralTransferManager is unarchived at 0x3285B6b7f0C74753BEc5F88749989467B218527b
STO Modules:
- USDTieredSTO is unarchived at 0xE41C9d004D56a979BC373e1AE2a7D2eB29aA1F18
```

* \[2\] Freeze Transfers

  \`\`\` Selected: Freeze transfers ---- Transaction executed: freezeTransfers - Gas limit provided: 52282 ----

  Your transaction is being processed. Please wait... TxHash: 0xef05775716d720014ab020f8fcda202c762fb8f669fa78c73feb51ca9114fc4f

  Congratulations! The transaction was successfully completed. Gas used: 43568 - Gas spent: 0.0021784 Ether Review it on Etherscan. TxHash: 0xef05775716d720014ab020f8fcda202c762fb8f669fa78c73feb51ca9114fc4f

Transfers have been frozen successfully!

_**\***_ Security Token Information _**\*\***_

* Address:              0xbb52625BFc826C2B653fA8dA12b4Ba4F0235dEc4
* Token symbol:         CP
* Token details:        [https://docs.google.com/document/d/1Z8TSbqOucZfY82HnR513l4i7nsHjzbBAAVTpaBHFe54/edit](https://docs.google.com/document/d/1Z8TSbqOucZfY82HnR513l4i7nsHjzbBAAVTpaBHFe54/edit)
* Token version:        2.0.0
* Total supply:         0 CP
* Investors count:      0
* Current checkpoint:   0
* Transfer frozen:      YES
* Minting frozen:       NO
* User balance:         0 CP

_**\***_ Module Information _**\*\***_

* Permission Manager:   1
* Transfer Manager:     1
* STO:                  1
* Checkpoint:           None
* Burn:                 None

Permission Manager Modules:

* GeneralPermissionManager is unarchived at 0x254482F627E10d60Bd46b1965A121ef9D509a18b

  Transfer Manager Modules:

* GeneralTransferManager is unarchived at 0x3285B6b7f0C74753BEc5F88749989467B218527b

  STO Modules:

* USDTieredSTO is unarchived at 0xE41C9d004D56a979BC373e1AE2a7D2eB29aA1F18

  \[1\] Update token details

  \[2\] Unfreeze transfers

  \[3\] Create a checkpoint

  \[4\] List investors

  \[5\] List investors at checkpoint

  \[6\] Mint tokens

  \[7\] Manage modules

  \[8\] Withdraw tokens from contract

  \[0\] Exit

```text
- [3] Create a checkpoint
```

Selected: Create a checkpoint ---- Transaction executed: createCheckpoint - Gas limit provided: 102904 ----

Your transaction is being processed. Please wait... TxHash: 0xcc9497eeaa2319d18c56189dd380eb4aaf816c703ac2fe0498f0908d9a6b1266

Congratulations! The transaction was successfully completed. Gas used: 85753 - Gas spent: 0.00428765 Ether Review it on Etherscan. TxHash: 0xcc9497eeaa2319d18c56189dd380eb4aaf816c703ac2fe0498f0908d9a6b1266

Checkpoint 1 has been created successfully!

_**\***_ Security Token Information _**\*\***_

* Address:              0xbb52625BFc826C2B653fA8dA12b4Ba4F0235dEc4
* Token symbol:         CP
* Token details:        [https://docs.google.com/document/d/1Z8TSbqOucZfY82HnR513l4i7nsHjzbBAAVTpaBHFe54/edit](https://docs.google.com/document/d/1Z8TSbqOucZfY82HnR513l4i7nsHjzbBAAVTpaBHFe54/edit)
* Token version:        2.0.0
* Total supply:         0 CP
* Investors count:      0
* Current checkpoint:   1
* Transfer frozen:      YES
* Minting frozen:       NO
* User balance:         0 CP

_**\***_ Module Information _**\*\***_

* Permission Manager:   1
* Transfer Manager:     1
* STO:                  1
* Checkpoint:           None
* Burn:                 None

Permission Manager Modules:

* GeneralPermissionManager is unarchived at 0x254482F627E10d60Bd46b1965A121ef9D509a18b

  Transfer Manager Modules:

* GeneralTransferManager is unarchived at 0x3285B6b7f0C74753BEc5F88749989467B218527b

  STO Modules:

* USDTieredSTO is unarchived at 0xE41C9d004D56a979BC373e1AE2a7D2eB29aA1F18

```text
- [4] List investors

Note: Investors that have been whitelisted for the STO will be put in list form. If there is no one whitelisted, it will return "There are no investors yet"(as depicted below).
```

Selected: List investors

There are no investors yet

_**\***_ Security Token Information _**\*\***_

* Address:              0xbb52625BFc826C2B653fA8dA12b4Ba4F0235dEc4
* Token symbol:         CP
* Token details:        [https://docs.google.com/document/d/1Z8TSbqOucZfY82HnR513l4i7nsHjzbBAAVTpaBHFe54/edit](https://docs.google.com/document/d/1Z8TSbqOucZfY82HnR513l4i7nsHjzbBAAVTpaBHFe54/edit)
* Token version:        2.0.0
* Total supply:         0 CP
* Investors count:      0
* Current checkpoint:   1
* Transfer frozen:      YES
* Minting frozen:       NO
* User balance:         0 CP

_**\***_ Module Information _**\*\***_

* Permission Manager:   1
* Transfer Manager:     1
* STO:                  1
* Checkpoint:           None
* Burn:                 None

Permission Manager Modules:

* GeneralPermissionManager is unarchived at 0x254482F627E10d60Bd46b1965A121ef9D509a18b

  Transfer Manager Modules:

* GeneralTransferManager is unarchived at 0x3285B6b7f0C74753BEc5F88749989467B218527b

  STO Modules:

* USDTieredSTO is unarchived at 0xE41C9d004D56a979BC373e1AE2a7D2eB29aA1F18

  \`\`\`

* \[5\] Mint tokens

  \`\`\`

  Selected: Mint tokens

\[1\] Modify whitelist \[2\] Mint tokens to a single address \[3\] Mint tokens to multiple addresses from CSV \[0\] Return

What do you want to do? \[1, 2, 3, 0\]: 1 Selected: Modify whitelist Enter the address to whitelist: 0xddf2da2bc5a45d21e7b136f08eeadd08fcf5a27e Enter the time \(Unix Epoch time\) when the sale lockup period ends and the investor can freely sell his tokens: 1546969136 Enter the time \(Unix Epoch time\) when the purchase lockup period ends and the investor can freely purchase tokens from others: 1546969136 Enter the time till investors KYC will be validated \(after that investor need to do re-KYC\): 1547314736 Is the investor a restricted investor? \[y/n\]: n ---- Transaction executed: modifyWhitelist - Gas limit provided: 139776 ----

Your transaction is being processed. Please wait... TxHash: 0xdebc584e1690f8c5064d007ec92f84e8ebfcd10fe87be30054ec1d4dda3cd803

Congratulations! The transaction was successfully completed. Gas used: 116480 - Gas spent: 0.005824 Ether Review it on Etherscan. TxHash: 0xdebc584e1690f8c5064d007ec92f84e8ebfcd10fe87be30054ec1d4dda3cd803

0xddF2Da2bc5a45D21e7B136F08EeADD08FcF5a27e has been whitelisted sucessfully!

_**\***_ Security Token Information _**\*\***_

* Address:              0x37454c3FCa8547D17b79F12aF485b0F920082b7A
* Token symbol:         CP
* Token details:        
* Token version:        2.0.0
* Total supply:         0 CP
* Investors count:      0
* Current checkpoint:   0
* Transfer frozen:      NO
* Minting frozen:       NO
* User balance:         0 CP

_**\***_ Module Information _**\*\***_

* Permission Manager:   None
* Transfer Manager:     1
* STO:                  None
* Checkpoint:           None
* Burn:                 None

Transfer Manager Modules:

* GeneralTransferManager is unarchived at 0xb0E3F9D978A0E52639f3691821138Bd5E1FAb6A4

\[1\] Modify whitelist \[2\] Mint tokens to a single address \[3\] Mint tokens to multiple addresses from CSV \[0\] Return

What do you want to do? \[1, 2, 3, 0\]: 2

Selected: Mint tokens to a single address

Investor should be previously whitelisted.

Enter the address to receive the tokens: 0xddf2da2bc5a45d21e7b136f08eeadd08fcf5a27e Enter the amount of tokens to mint: 100 ---- Transaction executed: mint - Gas limit provided: 224675 ----

Your transaction is being processed. Please wait... TxHash: 0xd964747d2e0099518e38be7477acd3d4a22c692f2430cc0b77458f0f07e10ef8

Congratulations! The transaction was successfully completed. Gas used: 187229 - Gas spent: 0.00936145 Ether Review it on Etherscan. TxHash: 0xd964747d2e0099518e38be7477acd3d4a22c692f2430cc0b77458f0f07e10ef8

100 tokens have been minted to 0xddF2Da2bc5a45D21e7B136F08EeADD08FcF5a27e successfully.

_**\***_ Security Token Information _**\*\***_

* Address:              0x37454c3FCa8547D17b79F12aF485b0F920082b7A
* Token symbol:         CP
* Token details:        
* Token version:        2.0.0
* Total supply:         100 CP
* Investors count:      1
* Current checkpoint:   0
* Transfer frozen:      NO
* Minting frozen:       NO
* User balance:         100 CP

_**\***_ Module Information _**\*\***_

* Permission Manager:   None
* Transfer Manager:     1
* STO:                  None
* Checkpoint:           None
* Burn:                 None

Transfer Manager Modules:

* GeneralTransferManager is unarchived at 0xb0E3F9D978A0E52639f3691821138Bd5E1FAb6A4

\[1\] Modify whitelist \[2\] Mint tokens to a single address \[3\] Mint tokens to multiple addresses from CSV \[0\] Return

Selected: Mint tokens to multiple addresses from CSV

Investors should be previously whitelisted.

Enter the path for csv data file \(/Users/charlesst.louis/Desktop/polymath-core/CLI/commands/../data/ST/multi\_mint\_data.csv\): _Enter CSV directory file here_

Enter the max number of records per transaction or batch size \(75\): _Enter max number of records/tx or desired batch size_

```text
- [6] Manage modules

**Note:** Permission Manager, Dividends and Burn Modules are not yet available for the user to test**
```

Selected: Manage modules

\[1\] Add a module \[2\] Pause a module \[3\] Archive a module \[4\] Change module budget \[0\] Return

```text
**Adding a module to your Security Token**
```

What do you want to do? \[1...4 / 0\]: 1 Selected: Add a module

\[1\] Permission Manager \[2\] Transfer Manager \[3\] Security Token Offering \[4\] Dividends \[5\] Burn \[0\] Return

```text
- [2] Please visit [Transfer Manager]() to continue with this module**

- [3] Please visit [STO Manager]() to continue with this module**


**Pausing a module to your Security Token**
```

Selected: Pause a module

\[1\] GeneralTransferManager \(0xb0E3F9D978A0E52639f3691821138Bd5E1FAb6A4\) \[2\] PercentageTransferManager \(0x47d9B9Ae4c1A5bF645879FE356f1c009fCebFA36\) \[0\] CANCEL

Which module would you like to pause? \[1, 2, 0\]: 1

Selected: GeneralTransferManager \(0xb0E3F9D978A0E52639f3691821138Bd5E1FAb6A4\) Only STO and TM modules can be paused/unpaused

```text
Here you can see that only the STO and Transfer Manager modules can be paused. 


**Archiving a module**
```

Selected: Archive a module

\[1\] GeneralTransferManager \(0xb0E3F9D978A0E52639f3691821138Bd5E1FAb6A4\) \[2\] PercentageTransferManager \(0x47d9B9Ae4c1A5bF645879FE356f1c009fCebFA36\) \[0\] CANCEL

Which module would you like to archive? \[1, 2, 0\]: 2

Selected: PercentageTransferManager \(0x47d9B9Ae4c1A5bF645879FE356f1c009fCebFA36\) ---- Transaction executed: archiveModule - Gas limit provided: 69094 ----

Your transaction is being processed. Please wait... TxHash: 0x75a7163664787c997fad865895a00c9784ed98fd4ac110bab388c31f2b89eaad

Congratulations! The transaction was successfully completed. Gas used: 34547 - Gas spent: 0.00172735 Ether Review it on Etherscan. TxHash: 0x75a7163664787c997fad865895a00c9784ed98fd4ac110bab388c31f2b89eaad

PercentageTransferManager has been archived successfully!

_**\***_ Security Token Information _**\*\***_

* Address:              0x37454c3FCa8547D17b79F12aF485b0F920082b7A
* Token symbol:         CP
* Token details:        
* Token version:        2.0.0
* Total supply:         100 CP
* Investors count:      1
* Current checkpoint:   0
* Transfer frozen:      NO
* Minting frozen:       NO
* User balance:         100 CP

_**\***_ Module Information _**\*\***_

* Permission Manager:   None
* Transfer Manager:     2
* STO:                  None
* Checkpoint:           None
* Burn:                 None

Transfer Manager Modules:

* GeneralTransferManager is unarchived at 0xb0E3F9D978A0E52639f3691821138Bd5E1FAb6A4
* PercentageTransferManager is archived at 0x47d9B9Ae4c1A5bF645879FE356f1c009fCebFA36

  \[1\] Add a module

  \[2\] Pause a module

  \[3\] Archive a module

  \[4\] Unarchive a module

  \[5\] Remove a module

  \[6\] Change module budget

  \[0\] Return

  ```text
  **Removing a module**
  ```

  Selected: Remove a module

\[1\] PercentageTransferManager \(0x47d9B9Ae4c1A5bF645879FE356f1c009fCebFA36\) \[0\] CANCEL

Which module whould you like to remove? \[1/0\]: 1

Selected: PercentageTransferManager \(0x47d9B9Ae4c1A5bF645879FE356f1c009fCebFA36\) ---- Transaction executed: removeModule - Gas limit provided: 406350 ----

Your transaction is being processed. Please wait... TxHash: 0xc6e0da2bfd64e0d97a91cfd28c23962f3841c7a1c8c93f1e787f04453da3d48c

Congratulations! The transaction was successfully completed. Gas used: 53175 - Gas spent: 0.00265875 Ether Review it on Etherscan. TxHash: 0xc6e0da2bfd64e0d97a91cfd28c23962f3841c7a1c8c93f1e787f04453da3d48c

PercentageTransferManager has been removed successfully!

_**\***_ Security Token Information _**\*\***_

* Address:              0x37454c3FCa8547D17b79F12aF485b0F920082b7A
* Token symbol:         CP
* Token details:        
* Token version:        2.0.0
* Total supply:         100 CP
* Investors count:      1
* Current checkpoint:   0
* Transfer frozen:      NO
* Minting frozen:       NO
* User balance:         100 CP

_**\***_ Module Information _**\*\***_

* Permission Manager:   None
* Transfer Manager:     1
* STO:                  None
* Checkpoint:           None
* Burn:                 None

Transfer Manager Modules:

* GeneralTransferManager is unarchived at 0xb0E3F9D978A0E52639f3691821138Bd5E1FAb6A4

  \`\`\`

**Changing a module's budget**

```text
Selected: Change module budget
(node:91653) UnhandledPromiseRejectionWarning: ReferenceError: modules is not defined
    at changeBudget (/Users/charlesst.louis/Desktop/polymath-core/CLI/commands/token_manager.js:575:17)
    at listModuleOptions (/Users/charlesst.louis/Desktop/polymath-core/CLI/commands/token_manager.js:462:13)
    at selectAction (/Users/charlesst.louis/Desktop/polymath-core/CLI/commands/token_manager.js:205:13)
    at <anonymous>
    at process._tickCallback (internal/process/next_tick.js:182:7)
(node:91653) UnhandledPromiseRejectionWarning: Unhandled promise rejection. This error originated either by throwing inside of an async function without a catch block, or by rejecting a promise which was not handled with .catch(). (rejection id: 4)
(node:91653) [DEP0018] DeprecationWarning: Unhandled promise rejections are deprecated. In the future, promise rejections that are not handled will terminate the Node.js process with a non-zero exit code.
```

**Withdraw tokens from contract**

Note: Before withdrawing tokens from the Security Token contract, it requires the prior creation of a Security Token, the whitelisting of the address you are using and the Security Token address and lastly, the minting of tokens to the Security Token contract. Only then can you withdrew those tokens from the Security Token Contract.

```text
[1] Update token details
[2] Freeze transfers
[3] Create a checkpoint
[4] List investors
[5] Mint tokens
[6] Manage modules
[7] Withdraw tokens from contract
[0] Exit

What do you want to do? [1...7 / 0]: 7
Selected: Withdraw tokens from contract
Enter the ERC20 token address (POLY 0xE6FBB9dE6289BD172eA26517634146236292b071): 0xdd13944693F57984B898A060146BbD3E1a6561c8
Enter the value to withdraw: 1000
---- Transaction executed: withdrawERC20 - Gas limit provided: 86275 ----

  Your transaction is being processed. Please wait...
  TxHash: 0xe388da39217bced0ecaaf032304ef28f8c37efc55315a784540f272e659ec863

  Congratulations! The transaction was successfully completed.
  Gas used: 71896 - Gas spent: 0.0035948 Ether
  Review it on Etherscan.
  TxHash: 0xe388da39217bced0ecaaf032304ef28f8c37efc55315a784540f272e659ec863

Withdrawn has been successful!.
```

## Troubleshooting / FAQs

n/a

