# Dividends-Manager

**Summary:**

This CLI feature runs the dividends manager so the issuer can customize their STO further if they want to issue dividends to their security token holders.

**How it works:**

First, you have to decided what type of dividends do you want work with: POLY or ETH

Following options after selecting dividend type: 1. Mint tokens 2. Transfer tokens 3. Create checkpoint 4. Set default exclusions for dividends 5. Tax holding settings 6. Create dividends

**How to Use this CLI Feature \(Instructions\):**

Run the dividends\_manager command below:

```text
$ node CLI/polymath-cli dividends_manager
```

**NOTE: It should ask you at the beginning if you want distribute dividends in ETH or POLY**

1. Enter the token symbol you want to work with.
2. Mint tokens \(Option ‘1’\): 
3. Enter the beneficiary of the tokens
4. Enter the amount of tokens to mint
5. Create dividends \(Option ‘6’\):
6. Enter how much Eth would you like to distribute to token holders
7. New checkpoint is created
8. Push dividends \(Option ‘8’\):
9. Enter the checkpoint to distribute dividends at \(i.e. previous checkpoint number\)
10. Enter addresses to push dividends to \(i.e. address1,address2,address3\)
11. Dividends are pushed to addresses
12. Explore balances \(Option ‘a’\):
13. Enter the checkpoint to explore
14. Enter the address to explore

**Walkthrough Example**

```text
**********************************************
Welcome to the Command-Line Dividends Manager.
**********************************************
Issuer Account: 0x5F87545f405f8304DAF5b5D1DBA7da6161c226Fc


Dividends Manager - Main Menu
Enter the token symbol: CP

[1] POLY
[2] ETH

What type of dividends do you want work with? [1/2]: 1
Selected: POLY

Token is at checkpoint: 0

[1] Mint tokens
[2] Transfer tokens
[3] Create checkpoint
[4] Set default exclusions for dividends
[5] Tax holding settings
[6] Create dividends
[0] CANCEL

What do you want to do? [1...6 / 0]: 1
Selected: Mint tokens 

Enter beneficiary of minting: 0x6a77b1f6ae25bc6f99752c4bb36a8fcecbd27f6f
Enter amount of tokens to mint: 100
---- Transaction executed: modifyWhitelist - Gas limit provided: 134891 ----

  Your transaction is being processed. Please wait...
  TxHash: 0x5b5e7e2f0c45fda524a487193a38ceb228baad15093c43ca82fcf5983b00d438

  Congratulations! The transaction was successfully completed.
  Gas used: 112409 - Gas spent: 0.00562045 Ether
  Review it on Etherscan.
  TxHash: 0x5b5e7e2f0c45fda524a487193a38ceb228baad15093c43ca82fcf5983b00d438


Whitelisting successful for 0x6a77b1f6ae25bc6f99752c4bb36a8fcecbd27f6f.
---- Transaction executed: mint - Gas limit provided: 163142 ----

  Your transaction is being processed. Please wait...
  TxHash: 0x0445936fdb119ed766aaf5b8152afc1a004d9968632714bb80d61a5094e50d77

  Congratulations! The transaction was successfully completed.
  Gas used: 135952 - Gas spent: 0.0067976 Ether
  Review it on Etherscan.
  TxHash: 0x0445936fdb119ed766aaf5b8152afc1a004d9968632714bb80d61a5094e50d77


  Minted 100 tokens
  to account 0x6a77b1f6aE25Bc6F99752c4bB36a8FcECbd27f6f

Dividends Manager - Main Menu

Token is at checkpoint: 0

[1] Mint tokens
[2] Transfer tokens
[3] Create checkpoint
[4] Set default exclusions for dividends
[5] Tax holding settings
[6] Create dividends
[0] CANCEL

What do you want to do? [1...6 / 0]: 2
Selected: Transfer tokens 

Enter beneficiary of tranfer: 0x51b853aa5ced7bfa79cc08435c055ab35810998d
Enter amount of tokens to transfer: 500
---- Transaction executed: modifyWhitelist - Gas limit provided: 134891 ----

  Your transaction is being processed. Please wait...
  TxHash: 0x4f857842a3430ec5190b6f1f2a07306baaab757eaacd2ddbf47c651f228e2a1d

  Congratulations! The transaction was successfully completed.
  Gas used: 112409 - Gas spent: 0.00562045 Ether
  Review it on Etherscan.
  TxHash: 0x4f857842a3430ec5190b6f1f2a07306baaab757eaacd2ddbf47c651f228e2a1d


Whitelisting successful for 0x51b853aa5ced7bfa79cc08435c055ab35810998d.
---- Transaction executed: transfer - Gas limit provided: 200763 ----

  Your transaction is being processed. Please wait...
  TxHash: 0x69f9df6667ed3b4a4b8c393b6a23f1a7b2a8ae29239b59017f4e1e0ddde5a2f1

  Congratulations! The transaction was successfully completed.
  Gas used: 133842 - Gas spent: 0.0066921 Ether
  Review it on Etherscan.
  TxHash: 0x69f9df6667ed3b4a4b8c393b6a23f1a7b2a8ae29239b59017f4e1e0ddde5a2f1


  Account 0x5F87545f405f8304DAF5b5D1DBA7da6161c226Fc
  transferred 500 tokens
  to account 0x51b853aA5ced7bFa79Cc08435C055aB35810998D

Dividends Manager - Main Menu

Token is at checkpoint: 0

[1] Mint tokens
[2] Transfer tokens
[3] Create checkpoint
[4] Set default exclusions for dividends
[5] Tax holding settings
[6] Create dividends
[0] CANCEL

What do you want to do? [1...6 / 0]: 3
Selected: Create checkpoint 

---- Transaction executed: createCheckpoint - Gas limit provided: 102904 ----

  Your transaction is being processed. Please wait...
  TxHash: 0x3cc594c2a00797c13ed30af18f0caf67fb3912d2aa2c2ce19a5902ce7cc9f48e

  Congratulations! The transaction was successfully completed.
  Gas used: 85753 - Gas spent: 0.00428765 Ether
  Review it on Etherscan.
  TxHash: 0x3cc594c2a00797c13ed30af18f0caf67fb3912d2aa2c2ce19a5902ce7cc9f48e


Dividends Manager - Main Menu

Token is at checkpoint: 1

[1] Mint tokens
[2] Transfer tokens
[3] Create checkpoint
[4] Set default exclusions for dividends
[5] Tax holding settings
[6] Create dividends
[7] Explore account at checkpoint
[8] Explore total supply at checkpoint
[0] CANCEL

What do you want to do? [1...8 / 0]: 4
Selected: Set default exclusions for dividends 

---- Transaction executed: addModule - Gas limit provided: 5049042 ----

  Your transaction is being processed. Please wait...
  TxHash: 0x1a8cbbde2a934d6dcccbf15a12293783eb2d187f0a1bc88b643408e14be2cc78

  Congratulations! The transaction was successfully completed.
  Gas used: 4207535 - Gas spent: 0.21037675 Ether
  Review it on Etherscan.
  TxHash: 0x1a8cbbde2a934d6dcccbf15a12293783eb2d187f0a1bc88b643408e14be2cc78

Module deployed at address: 0x778c552AEcAd32B886F3E7B39ac7C436ecc62124
There are not default excluded addresses.

Excluded addresses will be loaded from 'dividendsExclusions_data.csv'. Please check your data before continue.
Do you want to continue? [y/n]: y
---- Transaction executed: setDefaultExcluded - Gas limit provided: 199255 ----

  Your transaction is being processed. Please wait...
  TxHash: 0x933480cdb9260cc7fdc989ae5e8729ee577b230b0845c5a1d6acde652cfd653c

  Congratulations! The transaction was successfully completed.
  Gas used: 166046 - Gas spent: 0.0083023 Ether
  Review it on Etherscan.
  TxHash: 0x933480cdb9260cc7fdc989ae5e8729ee577b230b0845c5a1d6acde652cfd653c

Exclusions were successfully set.
Current default excluded addresses:
  0xEe7Ae74D964F2bE7d72C1B187B38e2eD3615d4d1
  0x49FC0b78238DAB644698A90FA351B4C749E123d2
  0x10223927009b8ADD0960359dd90d1449415b7ca9
  0x3C65CFE3dE848cF38e9d76e9c3e57a2F1140B399
  0xaBf60DE3265B3017Db7A1be66fC8B364ec1dbb98


Dividends Manager - Main Menu

Token is at checkpoint: 2

[1] Mint tokens
[2] Transfer tokens
[3] Create checkpoint
[4] Set default exclusions for dividends
[5] Tax holding settings
[6] Create dividends
[7] Explore account at checkpoint
[8] Explore total supply at checkpoint
[9] Push dividends to accounts
[a] Explore POLY balance
[b] Reclaim expired dividends
[0] CANCEL

What do you want to do? [1...9, a, b, 0]: 5
Selected: Tax holding settings 

[1] Set a % to withhold from dividends sent to an address
[2] Withdraw withholding for dividend
[3] Return to main menu

What do you want to do? [1, 2, 3]: 1

Selected: Set a % to withhold from dividends sent to an address
Enter the address of the investor: 0x52dc64d87245d24f6d1a4456ec71eb493737f862                      
Enter the percentage of dividends to withhold (number between 0-100): 15
---- Transaction executed: setWithholdingFixed - Gas limit provided: 60588 ----

  Your transaction is being processed. Please wait...
  TxHash: 0x152a77c00a061d44f9a0898908f515134901eda24d897935fcbc60eff07a0388

  Congratulations! The transaction was successfully completed.
  Gas used: 50490 - Gas spent: 0.0025245 Ether
  Review it on Etherscan.
  TxHash: 0x152a77c00a061d44f9a0898908f515134901eda24d897935fcbc60eff07a0388

Successfully set tax withholding of 15% for 0x52dc64d87245d24f6d1a4456ec71eb493737f862.

Dividends Manager - Main Menu

Token is at checkpoint: 2

[1] Mint tokens
[2] Transfer tokens
[3] Create checkpoint
[4] Set default exclusions for dividends
[5] Tax holding settings
[6] Create dividends
[7] Explore account at checkpoint
[8] Explore total supply at checkpoint
[9] Push dividends to accounts
[a] Explore POLY balance
[b] Reclaim expired dividends
[0] CANCEL

What do you want to do? [1...9, a, b, 0]: 5
Selected: Tax holding settings 

[1] Set a % to withhold from dividends sent to an address
[2] Withdraw withholding for dividend
[3] Return to main menu


What do you want to do? [1, 2, 3]: 2

Selected: Withdraw withholding for dividend
No dividends were found meeting the requirements
Requirements: Valid: undefined - Expired: undefined - Reclaimed: undefined
    WithRemainingWithheld: true - WithRemaining: undefined


Dividends Manager - Main Menu

Token is at checkpoint: 2

[1] Mint tokens
[2] Transfer tokens
[3] Create checkpoint
[4] Set default exclusions for dividends
[5] Tax holding settings
[6] Create dividends
[7] Explore account at checkpoint
[8] Explore total supply at checkpoint
[9] Push dividends to accounts
[a] Explore POLY balance
[b] Reclaim expired dividends
[0] CANCEL

What do you want to do? [1...9, a, b, 0]: 6
Selected: Create dividends 

Enter a name or title to indetify this dividend: Ruby
How much POLY would you like to distribute to token holders?: 1000

[1] Create new checkpoint
[2] December 19th 2018, 15:39:16
[3] December 19th 2018, 15:39:52

Select a checkpoint [1, 2, 3]: 2
Enter the dividend maturity time from which dividend can be paid (Unix Epoch time)
(Now = 1545252838 ): 
Enter the dividend expiry time (Unix Epoch time)
(10 minutes from now = 1545253438 ): 
Do you want to use the default excluded addresses for this dividend? If not, data from 'dividendsExclusions_data.csv' will be used instead. [y/n]: y
---- Transaction executed: approve - Gas limit provided: 54732 ----

  Your transaction is being processed. Please wait...
  TxHash: 0x08dcf26459436eeae6b5b1b8731e1c50b986b60fb299fbf28e532140a1efa8b7

  Congratulations! The transaction was successfully completed.
  Gas used: 45610 - Gas spent: 0.0022805 Ether
  Review it on Etherscan.
  TxHash: 0x08dcf26459436eeae6b5b1b8731e1c50b986b60fb299fbf28e532140a1efa8b7

---- Transaction executed: createDividendWithCheckpoint - Gas limit provided: 493096 ----

  Your transaction is being processed. Please wait...
  TxHash: 0xa724380102c78d3a110106ab243546f1430506982247d730c92a0c6b70832b5e

  Congratulations! The transaction was successfully completed.
  Gas used: 410913 - Gas spent: 0.02054565 Ether
  Review it on Etherscan.
  TxHash: 0xa724380102c78d3a110106ab243546f1430506982247d730c92a0c6b70832b5e

Dividend 0 deposited

Dividends Manager - Main Menu

Token is at checkpoint: 2

[1] Mint tokens
[2] Transfer tokens
[3] Create checkpoint
[4] Set default exclusions for dividends
[5] Tax holding settings
[6] Create dividends
[7] Explore account at checkpoint
[8] Explore total supply at checkpoint
[9] Push dividends to accounts
[a] Explore POLY balance
[b] Reclaim expired dividends
[0] CANCEL

What do you want to do? [1...9, a, b, 0]: 7
Selected: Explore account at checkpoint 

Enter address to explore: 0x52dc64d87245d24f6d1a4456ec71eb493737f862

[1] December 19th 2018, 15:39:16
[2] December 19th 2018, 15:39:52

Select a checkpoint [1/2]: 1
Balance of 0x52dc64d87245d24f6d1a4456ec71eb493737f862 is: 0 (Using balanceOf)
Balance of 0x52dc64d87245d24f6d1a4456ec71eb493737f862 is: 0 (Using balanceOfAt - checkpoint 1)

Dividends Manager - Main Menu

Token is at checkpoint: 2

[1] Mint tokens
[2] Transfer tokens
[3] Create checkpoint
[4] Set default exclusions for dividends
[5] Tax holding settings
[6] Create dividends
[7] Explore account at checkpoint
[8] Explore total supply at checkpoint
[9] Push dividends to accounts
[a] Explore POLY balance
[b] Reclaim expired dividends
[0] CANCEL

What do you want to do? [1...9, a, b, 0]: 8
Selected: Explore total supply at checkpoint 


[1] December 19th 2018, 15:39:16
[2] December 19th 2018, 15:39:52

Select a checkpoint [1/2]: 1
TotalSupply is: 500450 (Using totalSupply)
TotalSupply is: 500450 (Using totalSupplyAt - checkpoint 1)

Dividends Manager - Main Menu

Token is at checkpoint: 2

[1] Mint tokens
[2] Transfer tokens
[3] Create checkpoint
[4] Set default exclusions for dividends
[5] Tax holding settings
[6] Create dividends
[7] Explore account at checkpoint
[8] Explore total supply at checkpoint
[9] Push dividends to accounts
[a] Explore POLY balance
[b] Reclaim expired dividends
[0] CANCEL

What do you want to do? [1...9, a, b, 0]: 9
Selected: Push dividends to accounts 


[1] Ruby
    Created: December 19th 2018, 15:54:20
    Maturity: December 19th 2018, 15:53:58
    Expiry: December 19th 2018, 16:03:58
    At checkpoint: 1
    Amount: 1000 POLY
    Claimed Amount: 0 POLY
    Withheld: 0 POLY
    Withheld claimed: 0 POLY
[0] CANCEL

Select a dividend [1/0]: 1
Enter addresses to push dividends to (ex- add1,add2,add3,...): 0x49ae61ab7ef6350a5b7eee1e06dd1cfc59ca0c84
---- Transaction executed: pushDividendPaymentToAddresses - Gas limit provided: 78122 ----

  Your transaction is being processed. Please wait...
  TxHash: 0x33b3ae2d2f8334b9580272478da6b4101851ee46e05cacf2f961f9a5939b3df8

  Congratulations! The transaction was successfully completed.
  Gas used: 65102 - Gas spent: 0.0032551 Ether
  Review it on Etherscan.
  TxHash: 0x33b3ae2d2f8334b9580272478da6b4101851ee46e05cacf2f961f9a5939b3df8


Dividends Manager - Main Menu

Token is at checkpoint: 2

[1] Mint tokens
[2] Transfer tokens
[3] Create checkpoint
[4] Set default exclusions for dividends
[5] Tax holding settings
[6] Create dividends
[7] Explore account at checkpoint
[8] Explore total supply at checkpoint
[9] Push dividends to accounts
[a] Explore POLY balance
[b] Reclaim expired dividends
[0] CANCEL

What do you want to do? [1...9, a, b, 0]: a
Selected: Explore POLY balance 

Enter address to explore: 0x49ae61ab7ef6350a5b7eee1e06dd1cfc59ca0c84

[1] Ruby
    Created: December 19th 2018, 15:54:20
    Maturity: December 19th 2018, 15:53:58
    Expiry: December 19th 2018, 16:03:58
    At checkpoint: 1
    Amount: 1000 POLY
    Claimed Amount: 0 POLY
    Withheld: 0 POLY
    Withheld claimed: 0 POLY
[0] CANCEL

Select a dividend [1/0]: 1

  POLY Balance: 0 POLY
  Dividends owned: 0 POLY
  Tax withheld: 0 POLY


Dividends Manager - Main Menu

Token is at checkpoint: 2

[1] Mint tokens
[2] Transfer tokens
[3] Create checkpoint
[4] Set default exclusions for dividends
[5] Tax holding settings
[6] Create dividends
[7] Explore account at checkpoint
[8] Explore total supply at checkpoint
[9] Push dividends to accounts
[a] Explore POLY balance
[b] Reclaim expired dividends
[0] CANCEL

What do you want to do? [1...9, a, b, 0]: b
Selected: Reclaim expired dividends 

No dividends were found meeting the requirements
Requirements: Valid: undefined - Expired: true - Reclaimed: false
    WithRemainingWithheld: undefined - WithRemaining: undefined
```

**Troubleshooting / FAQs**  
N/A

