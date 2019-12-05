# Transfer-Manager

**Summary:**

This CLI feature allows you to run the transfer\_manager module which allows you to manage if you want to disable or set a new controller or even force a transfer.

**How it works**

1. Verify transfers
2. Make Transfer
3. Allow Forced transfers
4. Configure existing modules
5. Add new Transfer Manager module

**How to Use this CLI Feature \(Instructions\)**

To run this feature, please run:

```text
$ node CLI/polymath-cli tm  or  $ node CLI/polymath-cli transfer_manager
```

## Example Scenario:

```text
*********************************************
Welcome to the Command-Line Transfer Manager.
*********************************************
Issuer Account: 0xddF2Da2bc5a45D21e7B136F08EeADD08FcF5a27e


[1] CP - Deployed at 0x37454c3FCa8547D17b79F12aF485b0F920082b7A
[2] Enter token symbol manually
[0] Exit

Select a token [1, 2, 0]: 1

 Transfer Manager - Main Menu 

Transfer Manager modules attached:
- GeneralTransferManager at 0xb0E3F9D978A0E52639f3691821138Bd5E1FAb6A4
- PercentageTransferManager at 0x71936d7a699790Db8C708A0E4739A44eB686C55F

[1] Verify transfer
[2] Transfer
[3] Forced transfers
[4] Config existing modules
[5] Add new Transfer Manager module
[0] Exit
```

**Verifying Transfers between addresses**

```text
What do you want to do? [1...5 / 0]: 1
Selected: Verify transfer 

Total investors at the moment: 1
Enter the sender account (0xddF2Da2bc5a45D21e7B136F08EeADD08FcF5a27e): 
Balance of 0xddF2Da2bc5a45D21e7B136F08EeADD08FcF5a27e: 100 CP - 100% of total supply
Enter the receiver account: 0x2f795dd330a3f4b3f0ac531543d362a411248749
Balance of 0x2f795dd330a3f4b3f0ac531543d362a411248749: 0 CP - 0% of total supply
Enter amount of tokens to verify: 20

20 CP can be transferred from 0xddF2Da2bc5a45D21e7B136F08EeADD08FcF5a27e to 0x2f795dd330a3f4b3f0ac531543d362a411248749!

 Transfer Manager - Main Menu 

Transfer Manager modules attached:
- GeneralTransferManager at 0xb0E3F9D978A0E52639f3691821138Bd5E1FAb6A4
- PercentageTransferManager at 0x71936d7a699790Db8C708A0E4739A44eB686C55F
```

**Note: Addresses must be on the whitelist and have no transfer restrictions prior to verifying transfers**

**Transfering**

```text
What do you want to do? [1...5 / 0]: 2
Selected: Transfer 

Total investors at the moment: 1
Balance of 0xddF2Da2bc5a45D21e7B136F08EeADD08FcF5a27e: 100 CP - 100% of total supply
Enter beneficiary of tranfer: 0x2f795dd330a3f4b3f0ac531543d362a411248749
Balance of 0x2f795dd330a3f4b3f0ac531543d362a411248749: 0 CP - 0% of total supply
Enter amount of tokens to transfer: 10
---- Transaction executed: transfer - Gas limit provided: 175632 ----

  Your transaction is being processed. Please wait...
  TxHash: 0xa783e6315cbf54a5ec3d00cafeaf1977320a6828752116d7d967aab283592c42

  Congratulations! The transaction was successfully completed.
  Gas used: 146360 - Gas spent: 0.007318 Ether
  Review it on Etherscan.
  TxHash: 0xa783e6315cbf54a5ec3d00cafeaf1977320a6828752116d7d967aab283592c42

0xddF2Da2bc5a45D21e7B136F08EeADD08FcF5a27e transferred 10 CP to 0x2F795dd330A3f4B3f0ac531543d362a411248749 successfully!
Total investors at the moment: 2
Balance of 0xddF2Da2bc5a45D21e7B136F08EeADD08FcF5a27e: 90 CP - 90% of total supply
Balance of 0x2f795dd330a3f4b3f0ac531543d362a411248749: 10 CP - 10% of total supply

 Transfer Manager - Main Menu 

Transfer Manager modules attached:
- GeneralTransferManager at 0xb0E3F9D978A0E52639f3691821138Bd5E1FAb6A4
- PercentageTransferManager at 0x71936d7a699790Db8C708A0E4739A44eB686C55F
```

**Forced Transfers**

For forced transfers you simple enter the address you would like to set as a controller or disable as a controller

```text
Selected: Forced transfers 

[1] Disable controller
[2] Set controller
[0] Return
```

**Configuration of existing modules**

The process is the same for whatever module you select. With that being said, we are going to select GeneralTransferManager for this example.

```text
Selected: Config existing modules 


[1] GeneralTransferManager at 0xb0E3F9D978A0E52639f3691821138Bd5E1FAb6A4
[2] PercentageTransferManager at 0x71936d7a699790Db8C708A0E4739A44eB686C55F
[0] Return

----
Which module do you want to config? [1, 2, 0]: 1
Selected: GeneralTransferManager at 0xb0E3F9D978A0E52639f3691821138Bd5E1FAb6A4 

General Transfer Manager at 0xb0E3F9D978A0E52639f3691821138Bd5E1FAb6A4 

- Issuance address:                0x0000000000000000000000000000000000000000
- Signing address:                 0x0000000000000000000000000000000000000000
- Allow all transfers:             NO
- Allow all whitelist transfers:   NO
- Allow all whitelist issuances:   YES
- Allow all burn transfers:        NO
- Default times:
   - From time:                    0 (December 31st 1969, 19:00:00)
   - To time:                      0 (December 31st 1969, 19:00:00)
- Investors:                       4

[1] Show investors
[2] Show whitelist data
[3] Modify whitelist
[4] Modify whitelist from CSV
[5] Change the default times used when they are zero
[6] Change issuance address
[7] Change signing address
[8] Allow all transfers
[9] Allow all whitelist transfers
[a] Disallow all whitelist issuances
[b] Allow all burn transfers
[0] Return

----
What do you want to do? [1...9, a, b, 0]: 1
Selected: Show investors 

***** List of investors on whitelist *****
0xddF2Da2bc5a45D21e7B136F08EeADD08FcF5a27e
0xa40B039F9aE64718aEe5DccaA30BcF248F384545
0x2F795dd330A3f4B3f0ac531543d362a411248749
0x600f5D001F2f6044E652628E9a703E0A96Eb633D

----
What do you want to do? [1...9, a, b, 0]: 2
Selected: Show whitelist data 

Enter the addresses of the investors you want to show (i.e: addr1,addr2,addr3) or leave empty to show them all: 0xddF2Da2bc5a45D21e7B136F08EeADD08FcF5a27e
0xa40B039F9aE64718aEe5DccaA30BcF248F384545
0x2F795dd330A3f4B3f0ac531543d362a411248749
0x600f5D001F2f6044E652628E9a703E0A96Eb633D
╔════════════════════════════════════════════╤══════════════════╤══════════════════╤══════════════════╤════════════╗
║ Investor                                   │ From time        │ To time          │ KYC expiry date  │ Restricted ║
╟────────────────────────────────────────────┼──────────────────┼──────────────────┼──────────────────┼────────────╢
║ 0xddF2Da2bc5a45D21e7B136F08EeADD08FcF5a27e │ 01/08/2019 12:38 │ 01/08/2019 12:38 │ 01/12/2019 12:38 │ NO         ║
╚════════════════════════════════════════════╧══════════════════╧══════════════════╧══════════════════╧════════════╝
----
What do you want to do? [1...9, a, b, 0]: 3
Selected: Modify whitelist 

Selected: Modify whitelist 

Enter the address to whitelist: 0x6f877e57ecb50a6b092a989237f3ef5f3ac6949e
Enter the time(Unix Epoch time) when the sale lockup period ends and the investor can freely sell his tokens(now = 1546983389): 1546983398
Enter the time(Unix Epoch time) when the purchase lockup period ends and the investor can freely purchase tokens from others(now = 1546983389): 1546983398
Enter the time till investors KYC will be validated(after that investor need to do re - KYC) (1 hour from now = 1546987002): 1547328997
Is the investor a restricted investor? [y/n]: n
---- Transaction executed: modifyWhitelist - Gas limit provided: 121776 ----

  Your transaction is being processed. Please wait...
  TxHash: 0xb8f4f26fb96afb53f7993cb89df5105bacef637847ed92b20458e034c9beed2f

  Congratulations! The transaction was successfully completed.
  Gas used: 101480 - Gas spent: 0.005074 Ether
  Review it on Etherscan.
  TxHash: 0xb8f4f26fb96afb53f7993cb89df5105bacef637847ed92b20458e034c9beed2f

0x6f877e57EcB50A6b092A989237f3Ef5f3Ac6949E has been whitelisted sucessfully!

----
Selected: Modify whitelist from CSV 

Enter the path for csv data file (/Users/charlesst.louis/Desktop/polymath-core/CLI/commands/../data/Transfer/GTM/whitelist_data.csv): *Enter updated csv file here*
Enter the max number of records per transaction or batch size (75): *Enter max # of records/tx or batch size*
Batch 1 - Attempting to modify whitelist to accounts: 

 [ '0xEe7Ae74D964F2bE7d72C1B187B38e2eD3615d4d1',
  '0x2F0fD672BF222413cc69DC1f4f1d7e93Ad1763A1',
  '0xaC297053173B02b02a737D47F7B4a718e5b170EF',
  '0x49FC0b78238DAB644698A90FA351B4C749E123d2',
  '0x10223927009b8ADD0960359dd90d1449415b7ca9',
  '0x3C65CFE3dE848cF38e9d76e9c3e57a2F1140B399',
  '0xaBf60DE3265B3017Db7A1be66fC8B364ec1dbb98',
  '0xb841fe5a89Da1BBeF2D0805FbD7ffcBbB2fCa5E3',
  '0x56bE93088141b16EBaA9416122Fd1D928dA25ecf',
  '0xBB276B6f68f0A41D54B7E0A608FE8eB1eBDeE7B0' ] 

---- Transaction executed: modifyWhitelistMulti - Gas limit provided: 927058 ----

  Your transaction is being processed. Please wait...
  TxHash: 0x9ff240d7c9c6e18753d9d9c95e6788e462f35bb91498609abef186286542704c

  Congratulations! The transaction was successfully completed.
  Gas used: 772548 - Gas spent: 0.0386274 Ether
  Review it on Etherscan.
  TxHash: 0x9ff240d7c9c6e18753d9d9c95e6788e462f35bb91498609abef186286542704c

Modify whitelist transaction was successful.
772548 gas used.Spent: 0.0386274 ETH

----
What do you want to do? [1...9, a, b, 0]: 5
Selected: Change the default times used when they are zero 

Enter the default time (Unix Epoch time) used when fromTime is zero: 1547328997

---- Transaction executed: changeDefaults - Gas limit provided: 60128 ----

  Your transaction is being processed. Please wait...
  TxHash: 0x9229e2a8405639c2237aa034d06b8799a90f55771fb0fc13dea06f3baa8f6179

  Congratulations! The transaction was successfully completed.
  Gas used: 50107 - Gas spent: 0.00250535 Ether
  Review it on Etherscan.
  TxHash: 0x9229e2a8405639c2237aa034d06b8799a90f55771fb0fc13dea06f3baa8f6179

Default times have been updated successfully!
----
Selected: Change issuance address 

Enter the new issuance address: 0x0cff167c0b67ec12064bb7326e4f6da793c77b3b
---- Transaction executed: changeIssuanceAddress - Gas limit provided: 60544 ----

  Your transaction is being processed. Please wait...
  TxHash: 0xeec8b7b173b36e886212a7639c753beb8d5166dd1d1c240174d0e1c7a6be54bf

  Congratulations! The transaction was successfully completed.
  Gas used: 50453 - Gas spent: 0.00252265 Ether
  Review it on Etherscan.
  TxHash: 0xeec8b7b173b36e886212a7639c753beb8d5166dd1d1c240174d0e1c7a6be54bf

0x0cff167C0b67ec12064BB7326E4f6Da793C77b3b is the new address for the issuance!

----
Selected: Change signing address 

Enter the new signing address: 0x0cff167c0b67ec12064bb7326e4f6da793c77b3b
---- Transaction executed: changeSigningAddress - Gas limit provided: 42016 ----

  Your transaction is being processed. Please wait...
  TxHash: 0xc845a5e7e4411cf055271f3e25ef59bce34f71be2a2b018423a7c33ead454064

  Congratulations! The transaction was successfully completed.
  Gas used: 35013 - Gas spent: 0.00175065 Ether
  Review it on Etherscan.
  TxHash: 0xc845a5e7e4411cf055271f3e25ef59bce34f71be2a2b018423a7c33ead454064

0x0cff167C0b67ec12064BB7326E4f6Da793C77b3b is the new address for the signing!----

----
Selected: Allow all transfers (no input required, automtically runs script) 

---- Transaction executed: changeAllowAllTransfers - Gas limit provided: 40312 ----

  Your transaction is being processed. Please wait...
  TxHash: 0x925f5d8f3a196df2999650d2db28d5fecca48fed6fc54edacef4b475983643bd

  Congratulations! The transaction was successfully completed.
  Gas used: 33593 - Gas spent: 0.00167965 Ether
  Review it on Etherscan.
  TxHash: 0x925f5d8f3a196df2999650d2db28d5fecca48fed6fc54edacef4b475983643bd

All transfers are allowed!

*When going back to the menu it now shows the "Disallow all transfers" instead of "Allow all transfers":*

1] Show investors
[2] Show whitelist data
[3] Modify whitelist
[4] Modify whitelist from CSV
[5] Change the default times used when they are zero
[6] Change issuance address
[7] Change signing address
[8] Disallow all transfers
[9] Allow all whitelist transfers
[a] Disallow all whitelist issuances
[b] Allow all burn transfers
[0] Return

----
Selected: Allow all whitelist transfers 

---- Transaction executed: changeAllowAllWhitelistTransfers - Gas limit provided: 40570 ----

  Your transaction is being processed. Please wait...
  TxHash: 0x4a9ef2755290afe51a070a5c5d934fa76368217188ffe4d956abb0582d7d32a5

  Congratulations! The transaction was successfully completed.
  Gas used: 33808 - Gas spent: 0.0016904 Ether
  Review it on Etherscan.
  TxHash: 0x4a9ef2755290afe51a070a5c5d934fa76368217188ffe4d956abb0582d7d32a5

Time locks from whitelist are ignored for transfers!

*When going back to the menu it now shows the "Disallow all whitelist transfers" instead of "Allow whitelist transfers":*

General Transfer Manager at 0xb0E3F9D978A0E52639f3691821138Bd5E1FAb6A4 

- Issuance address:                0x0cff167C0b67ec12064BB7326E4f6Da793C77b3b
- Signing address:                 0x0cff167C0b67ec12064BB7326E4f6Da793C77b3b
- Allow all transfers:             YES
- Allow all whitelist transfers:   YES
- Allow all whitelist issuances:   YES
- Allow all burn transfers:        NO
- Default times:
   - From time:                    1547328997 (January 12th 2019, 16:36:37)
   - To time:                      1547328997 (January 12th 2019, 16:36:37)
- Investors:                       15

[1] Show investors
[2] Show whitelist data
[3] Modify whitelist
[4] Modify whitelist from CSV
[5] Change the default times used when they are zero
[6] Change issuance address
[7] Change signing address
[8] Disallow all transfers
[9] Disallow all whitelist transfers
[a] Disallow all whitelist issuances
[b] Allow all burn transfers
[0] Return


----
Selected: Disallow all whitelist issuances 

---- Transaction executed: changeAllowAllWhitelistIssuances - Gas limit provided: 40440 ----

  Your transaction is being processed. Please wait...
  TxHash: 0xd1344491bbd0008e9b3f7f19ba56eb928e763e9906349e31068d760df1153c7c

  Congratulations! The transaction was successfully completed.
  Gas used: 33700 - Gas spent: 0.001685 Ether
  Review it on Etherscan.
  TxHash: 0xd1344491bbd0008e9b3f7f19ba56eb928e763e9906349e31068d760df1153c7c

Issuances are restricted by time locks from whitelist!


----
Selected: Allow all burn transfers 

---- Transaction executed: changeAllowAllBurnTransfers - Gas limit provided: 40992 ----

  Your transaction is being processed. Please wait...
  TxHash: 0x4d1908a2ff9911a0b834ab3c014569b0fcc37d7b631aae6ac78720be678fcd44

  Congratulations! The transaction was successfully completed.
  Gas used: 34160 - Gas spent: 0.001708 Ether
  Review it on Etherscan.
  TxHash: 0x4d1908a2ff9911a0b834ab3c014569b0fcc37d7b631aae6ac78720be678fcd44

The burning mechanism is deactivated!
```

**Adding new Transfer Manager modules**

```text
Selected: Add new Transfer Manager module 


[1] PercentageTransferManager
[2] CountTransferManager
[3] GeneralTransferManager
[4] ManualApprovalTransferManager
[0] Return

----
Percentage Transfer Manager

Which Transfer Manager module do you want to add? [1...4 / 0]: 1
Are you sure you want to add PercentageTransferManager module? [y/n]: y
Enter the maximum amount of tokens in percentage that an investor can hold: 5
Do you want to ignore transactions which are part of the primary issuance? [y/n]: n

---- Transaction executed: addModule - Gas limit provided: 2268599 ----

  Your transaction is being processed. Please wait...
  TxHash: 0x38e9cb87902602eb0cf1c519e39c62929e75cd1f883a3ec50d090033354c5b10

  Congratulations! The transaction was successfully completed.
  Gas used: 1875499 - Gas spent: 0.09377495 Ether
  Review it on Etherscan.
  TxHash: 0x38e9cb87902602eb0cf1c519e39c62929e75cd1f883a3ec50d090033354c5b10

Module deployed at address: 0x7f930c9dd304c90D331d055Bb70A2ED6363c980E

----
Count Transfer Manager

Which Transfer Manager module do you want to add? [1...4 / 0]: 2
Are you sure you want to add CountTransferManager module? [y/n]: y
Enter the maximum no. of holders the SecurityToken is allowed to have: 1000

---- Transaction executed: addModule - Gas limit provided: 1746196 ----

  Your transaction is being processed. Please wait...
  TxHash: 0xc6ca7e7566ae4c869b627af4f0c566008e86f52c7ebda005bb137485c192d80d

  Congratulations! The transaction was successfully completed.
  Gas used: 1455163 - Gas spent: 0.07275815 Ether
  Review it on Etherscan.
  TxHash: 0xc6ca7e7566ae4c869b627af4f0c566008e86f52c7ebda005bb137485c192d80d

Module deployed at address: 0x1b0bCe80cab378EFd2472398a24d8Aa8CaA965cF

----
General Transfer Manager

Which Transfer Manager module do you want to add? [1...4 / 0]: 3
Are you sure you want to add GeneralTransferManager module? [y/n]: y

---- Transaction executed: addModule - Gas limit provided: 1323953 ----

  Your transaction is being processed. Please wait...
  TxHash: 0xb02830107df701d438f7ffb2df636c8f669b3b115788369beffda70bee74fa6f

  Congratulations! The transaction was successfully completed.
  Gas used: 1103294 - Gas spent: 0.0551647 Ether
  Review it on Etherscan.
  TxHash: 0xb02830107df701d438f7ffb2df636c8f669b3b115788369beffda70bee74fa6f

Module deployed at address: 0x503298dc6b5971bA6c77ddBB29E005e78b2347Ac
----
Which Transfer Manager module do you want to add? [1...4 / 0]: 4
Are you sure you want to add ManualApprovalTransferManager module? [y/n]: y
---- Transaction executed: addModule - Gas limit provided: 3725315 ----

  Your transaction is being processed. Please wait...
  TxHash: 0xa96b64be89ad93f924b687308a8a8adeb794189b0bb21d8fdb92dc071f791717

  Congratulations! The transaction was successfully completed.
  Gas used: 3104429 - Gas spent: 0.15522145 Ether
  Review it on Etherscan.
  TxHash: 0xa96b64be89ad93f924b687308a8a8adeb794189b0bb21d8fdb92dc071f791717

Module deployed at address: 0xfDC74D7bCB6D72dC855ddd4989eB46f1C7ccF0d3

 Transfer Manager - Main Menu 

----
Summary: 

Transfer Manager modules attached:
- GeneralTransferManager at 0xb0E3F9D978A0E52639f3691821138Bd5E1FAb6A4
- PercentageTransferManager at 0x71936d7a699790Db8C708A0E4739A44eB686C55F
- PercentageTransferManager at 0x7f930c9dd304c90D331d055Bb70A2ED6363c980E
- CountTransferManager at 0x1b0bCe80cab378EFd2472398a24d8Aa8CaA965cF
- GeneralTransferManager at 0x503298dc6b5971bA6c77ddBB29E005e78b2347Ac
- ManualApprovalTransferManager at 0xfDC74D7bCB6D72dC855ddd4989eB46f1C7ccF0d3
```

**Troubleshooting / FAQs**

