# The-STO-Manager

### Summary

This CLI feature is a Wizard-like script that will guide technical users in the creation/management of an STO.

### How it works \(High Level Overview\)

1. Select or Manually Enter the Security token you are working with 
2. Add new STO module
3. Choose from a CappedSTO or USDTieredSTO 
4. Enter specific details for your STO 
5. Lauch STO

## Example Scenario

```text
$ node CLI/polymath-cli sto_manager

****************************************
Welcome to the Command-Line STO Manager.
****************************************
The following script will allow you to manage STOs modules.
Issuer Account: 0x1AE1959062556E6984ADCE0312D0Ff8f88909A0b


[1] CP - Deployed at 0x28D7cC342E76CCab1AC04c9344Ad9A2AD67AF1ac
[2] Enter token symbol manually
[0] Exit

Select a token [1, 2, 0]: 1

 STO Manager - Main Menu 

There are no STO modules attached

[1] Add new STO module
[0] Exit

What do you want to do? [1/0]: 1
Selected: Add new STO module 

Launch STO - Configuration

[1] CappedSTO
[2] USDTieredSTO
[0] Return

What type of STO do you want? [1, 2, 0]: 1
Selected: CappedSTO 

Launch STO - Capped STO in No. of Tokens
---- Transaction executed: transfer - Gas limit provided: 103248 ----

  Your transaction is being processed. Please wait...
  TxHash: 0x94a542ef1c125d873d7e51129f09b788ed10f032a205c9f2bf9511ca6ceb8a2a

  Congratulations! The transaction was successfully completed.
  Gas used: 51624 - Gas spent: 0.0025812 Ether
  Review it on Etherscan.
  TxHash: 0x94a542ef1c125d873d7e51129f09b788ed10f032a205c9f2bf9511ca6ceb8a2a

Number of POLY sent: 0
How many tokens do you plan to sell on the STO? (500.000): 
Enter P for POLY raise or leave empty for Ether raise (E): P
Enter the rate (1 POLY = X CP) for the STO (1000): 100
Enter the address that will receive the funds from the STO (0x1AE1959062556E6984ADCE0312D0Ff8f88909A0b): 
Enter the start time for the STO (Unix Epoch time)
(1 minutes from now = 1547066423 ): 
Enter the end time for the STO (Unix Epoch time)
(1 month from now = 1549658363 ): 
---- Transaction executed: addModule - Gas limit provided: 3184283 ----

  Your transaction is being processed. Please wait...
  TxHash: 0xbe008ac4c84b34dae1c6bb31825b3577c64ac4560dacaf07cb13b07719dfb8ec

  Congratulations! The transaction was successfully completed.
  Gas used: 2623569 - Gas spent: 0.13117845 Ether
  Review it on Etherscan.
  TxHash: 0xbe008ac4c84b34dae1c6bb31825b3577c64ac4560dacaf07cb13b07719dfb8ec

STO deployed at address: 0xF83B33E6593a6Da1C651d70bCa908c082A944db7

  *************** STO Information ***************
  - Address:           0xF83B33E6593a6Da1C651d70bCa908c082A944db7
  - Raise Cap:         500000 CP
  - Start Time:        Wed Jan 09 2019 15:40:23 GMT-0500 (EST)
  - End Time:          Fri Feb 08 2019 15:39:23 GMT-0500 (EST)
  - Raise Type:        POLY
  - Rate:              1 POLY = 100 CP
  - Wallet:            0x1AE1959062556E6984ADCE0312D0Ff8f88909A0b
  - Wallet Balance:    999500 POLY
  -----------------------------------------------
  - STO starts in:     0 days, 0 Hrs, 0 Minutes, 18 Seconds
  - Funds raised:      0 POLY
  - Tokens sold:       0 CP
  - Tokens remaining:  500000 CP
  - Investor count:    0


999500 POLY balance remaining at issuer address 0x1AE1959062556E6984ADCE0312D0Ff8f88909A0b

 STO Manager - Main Menu 

STO modules attached:
- CappedSTO at 0xF83B33E6593a6Da1C651d70bCa908c082A944db7

[1] Show existing STO information
[2] Modify existing STO
[3] Add new STO module
[0] Exit
```

**Show existing STO Information**

```text
Selected: Show existing STO information 


[1] CappedSTO at 0xF83B33E6593a6Da1C651d70bCa908c082A944db7

Select a module [1]: 1
Selected: CappedSTO at 0xF83B33E6593a6Da1C651d70bCa908c082A944db7 


  *************** STO Information ***************
  - Address:           0xF83B33E6593a6Da1C651d70bCa908c082A944db7
  - Raise Cap:         500000 CP
  - Start Time:        Wed Jan 09 2019 15:40:23 GMT-0500 (EST)
  - End Time:          Fri Feb 08 2019 15:39:23 GMT-0500 (EST)
  - Raise Type:        POLY
  - Rate:              1 POLY = 100 CP
  - Wallet:            0x1AE1959062556E6984ADCE0312D0Ff8f88909A0b
  - Wallet Balance:    999500 POLY
  -----------------------------------------------
  - Time remaining:    29 days, 23 Hrs, 55 Minutes, 57 Seconds
  - Funds raised:      0 POLY
  - Tokens sold:       0 CP
  - Tokens remaining:  500000 CP
  - Investor count:    0


999500 POLY balance remaining at issuer address 0x1AE1959062556E6984ADCE0312D0Ff8f88909A0b
```

**Modifying an existing STO**

```text
Selected: Modify existing STO 


[1] CappedSTO at 0xF83B33E6593a6Da1C651d70bCa908c082A944db7

Select a module [1]: 1
Selected: CappedSTO at 0xF83B33E6593a6Da1C651d70bCa908c082A944db7 


    *********************************
    This option is not yet available.
    *********************************
```

**Adding a new STO module \(USDTieredSTO\)**

```text
Selected: Add new STO module 

Launch STO - Configuration

[1] CappedSTO
[2] USDTieredSTO
[0] Return

What type of STO do you want? [1, 2, 0]: 2
Selected: USDTieredSTO 

Launch STO - USD pegged tiered STO
---- Transaction executed: transfer - Gas limit provided: 103248 ----

  Your transaction is being processed. Please wait...
  TxHash: 0x38e56dd2911aea25113425e7856598600cd85579dfd6d9c98913890c61a1474f

  Congratulations! The transaction was successfully completed.
  Gas used: 51624 - Gas spent: 0.0025812 Ether
  Review it on Etherscan.
  TxHash: 0x38e56dd2911aea25113425e7856598600cd85579dfd6d9c98913890c61a1474f

Number of POLY sent: 0
Enter P for POLY raise, S for Stable Coin raise, E for Ether raise or any combination of them (i.e. PSE for all): PSE
Enter the address that will receive the funds from the STO (0x1AE1959062556E6984ADCE0312D0Ff8f88909A0b): 0x1AE1959062556E6984ADCE0312D0Ff8f88909A0b

Enter the address that will receive remaining tokens in the case the cap is not met (0x1AE1959062556E6984ADCE0312D0Ff8f88909A0b): 0x1AE1959062556E6984ADCE0312D0Ff8f88909A0b

Enter the address (or multiple addresses separated by commas) of the USD stable coin(s) (0xeee959bE821F28f9c157DC4B2018ED1bB2e97dEC): 0xeee959bE821F28f9c157DC4B2018ED1bB2e97dEC

Enter the number of tiers for the STO? (3): 3

How many tokens do you plan to sell on tier No. 1? (190000000): 190000000

What is the USD per token rate for tier No. 1? (0.05): 0.05

Do you plan to have a discounted rate for POLY investments for tier No. 1? [y/n]: n

How many tokens do you plan to sell on tier No. 2? (100000000): 100000000

What is the USD per token rate for tier No. 2? (0.10): 0.10

Do you plan to have a discounted rate for POLY investments for tier No. 2? [y/n]: n

How many tokens do you plan to sell on tier No. 3? (200000000): 200000000

What is the USD per token rate for tier No. 3? (0.15): 0.15

Do you plan to have a discounted rate for POLY investments for tier No. 3? [y/n]: n

What is the minimum investment in USD? (5): 5

What is the default limit for non accredited investors in USD? (2500): 2500

Enter the start time for the STO (Unix Epoch time)
(1 minutes from now = 1547066933 ): 1547066933 

Enter the end time for the STO (Unix Epoch time)
(1 month from now = 1549658874 ): 1549658874

---- Transaction executed: addModule - Gas limit provided: 2124902 ----

  Your transaction is being processed. Please wait...
  TxHash: 0x93805d5329f07a9b82a3f8016a599f90a7be3a2532e01cde1d95d9fd09cae5ea

  Congratulations! The transaction was successfully completed.
  Gas used: 1740752 - Gas spent: 0.0870376 Ether
  Review it on Etherscan.
  TxHash: 0x93805d5329f07a9b82a3f8016a599f90a7be3a2532e01cde1d95d9fd09cae5ea

STO deployed at address: 0x42d35C36cFAD474B9d1F5b5a8c11CA8C86C18d94

  *********************** STO Information ***********************
  - Address:                     0x42d35C36cFAD474B9d1F5b5a8c11CA8C86C18d94
  - Start Time:                  Wed Jan 09 2019 15:48:53 GMT-0500 (EST)
  - End Time:                    Fri Feb 08 2019 15:47:54 GMT-0500 (EST)
  - Raise Type:                  ETH - POLY - POLY
  - Tiers:                       3
  - Tier 1:
      Tokens:                    190000000 CP
      Rate:                      0.05 USD per Token
  - Tier 2:
      Tokens:                    100000000 CP
      Rate:                      0.1 USD per Token
  - Tier 3:
      Tokens:                    200000000 CP
      Rate:                      0.15 USD per Token
  - Minimum Investment:          5 USD
  - Non Accredited Limit:        2500 USD
  - Wallet:                      0x1AE1959062556E6984ADCE0312D0Ff8f88909A0b
      Balance ETH:         91.03724985 ETH (45518.624925 USD)
      Balance POLY:         999500 POLY (499750 USD)
      Balance POLY:         1000000 POLY
  - Reserve Wallet:              0x1AE1959062556E6984ADCE0312D0Ff8f88909A0b
      Balance ETH:         91.03724985 ETH (45518.624925 USD)
      Balance POLY:         999500 POLY (499750 USD)
      Balance POLY:         1000000 POLY

  ---------------------------------------------------------------
  - STO starts in:               0 days, 0 Hrs, 0 Minutes, 56 Seconds
  - Is Finalized:                NO
  - Tokens Sold:                 0 CP
        Sold for ETH:         0 CP
        Sold for POLY:         0 CP
        Sold for stable coin(s): 0 CP
  - Current Tier:                1
  - Tokens minted in Tier 1:     0 CP
        Sold for ETH:         0 CP 
        Sold for POLY:         0 CP 
        Sold for stable coin(s): 0 CP 
  - Tokens minted in Tier 2:     0 CP
        Sold for ETH:         0 CP 
        Sold for POLY:         0 CP 
        Sold for stable coin(s): 0 CP 
  - Tokens minted in Tier 3:     0 CP
        Sold for ETH:         0 CP 
        Sold for POLY:         0 CP 
        Sold for stable coin(s): 0 CP 
  - Investor count:              0
  - Funds Raised
      ETH:             0 ETH
      POLY:             0 POLY
      Total USD:                 0 USD


999500 POLY balance remaining at issuer address 0x1AE1959062556E6984ADCE0312D0Ff8f88909A0b
```

### Troubleshooting / FAQs

* n/a

