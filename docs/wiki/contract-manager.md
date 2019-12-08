# Contract-Manager

## Summary:

This CLI feature allows you to run the contract\_manager to manage all the details surrounding Polymath, Features, Security Token and Module registries.

## How it works

The Contract Manager allows you to modify the following areas:

* \[1\] PolymathRegistry
* \[2\] FeatureRegistry
* \[3\] SecurityTokenRegistry
* \[4\] ModuleRegistry

\*\*Note: Currently options \[1\], \[2\] and \[4\] are under development.

**However,\[3\] Security Token Registry can be run. It handles the following:**

* \[1\] Modify Ticker
* \[2\] Remove Ticker
* \[3\] Modify SecurityToken
* \[4\] Change Expiry Limit
* \[5\] Change registration fee
* \[6\] Change ST launch fee
* \[0\] CANCEL

## How to Use this CLI Feature \(Instructions\)

To start, run either of the following commands:

```text
 $ node CLI/polymath-cli cm  or   $ node CLI/polymath-cli contract_manager
```

## Example Scenario:

```text
*********************************************
Welcome to the Command-Line Contract Manager.
*********************************************

Issuer Account: 0x23f95b881149018E3240A6c98d4Ec3A111aDc5DF


Contract Manager - Contract selection

[1] PolymathRegistry
[2] FeatureRegistry
[3] SecurityTokenRegistry
[4] ModuleRegistry
[0] CANCEL

Select a contract [1...4 / 0]:
```

**NOTE: Option \[1\], \[2\] and \[4\] are not yet available.**

**Begin with Option \[3\]**

```text
Select a contract [1...4 / 0]: 3

Security Token Registry - Main menu

[1] Modify Ticker
[2] Remove Ticker
[3] Modify SecurityToken
[4] Change Expiry Limit
[5] Change registration fee
[6] Change ST launch fee
[0] CANCEL

What do you want to do? [1...6 / 0]:
```

**Choosing the MODIFYING TICKER option:**

```text
What do you want to do? [1...6 / 0]: 1

Enter the token symbol that you want to add or modify: LFV

-- Current Ticker details --
  Owner: 0x23f95b881149018E3240A6c98d4Ec3A111aDc5DF
  Registration date: 1539272399
  Expiry date: 1544456399
  Token name: 
  Status: Deployed
```

**Before you choose to modify anything with respect to your token it gives you your current token/ticker details**

```text
Enter the token owner: 0x23f95b881149018E3240A6c98d4Ec3A111aDc5DF
Enter the token name: Leaf Ventures

Enter the Unix Epoch time on which ticker get registered: 1539272808
Enter the Unix Epoch time on wich the ticker will expire: 1541864766
Is the token deployed? [y/n]: y
```

**Above you need to confirm the token owner address, the token name, the your ticker was registered, the date in which the ticker will expire and answer if the token has been deployed yet.**

```text
---- Transaction executed: modifyTicker - Gas limit provided: 205029 ----

  Your transaction is being processed. Please wait...
  TxHash: 0x86a6fe1bb8e78dd759feb28d4067b9aa4ddcb2a13b7c53c4fd5eeb87ea6c5159

  Congratulations! The transaction was successfully completed.
  Gas used: 121686 - Gas spent: 0.0060843 Ether
  Review it on Etherscan.
  TxHash: 0x86a6fe1bb8e78dd759feb28d4067b9aa4ddcb2a13b7c53c4fd5eeb87ea6c5159

Ticker has been updated successfully
```

**We now need to return to the main menu and select the Security Token Registry option again:**

```text
[1] PolymathRegistry
[2] FeatureRegistry
[3] SecurityTokenRegistry
[4] ModuleRegistry
[0] CANCEL

Select a contract [1...4 / 0]: 3

Security Token Registry - Main menu

[1] Modify Ticker
[2] Remove Ticker
[3] Modify SecurityToken
[4] Change Expiry Limit
[5] Change registration fee
[6] Change ST launch fee
[0] CANCEL
```

**Choosing the REMOVING TICKER option:**

```text
What do you want to do? [1...6 / 0]: 2

Enter the token symbol that you want to remove: LFV
```

**Selecting a previous token symbol that we registered so that we don’t have to remove the LFV token that we will be using for the rest of the walkthroughs**

```text
---- Transaction executed: removeTicker - Gas limit provided: 428439 ----

  Your transaction is being processed. Please wait...
  TxHash: 0x45862377d36dc35709b723028cef7c00f03f5760a28454c40abb7dd1bf0b0c18

  Congratulations! The transaction was successfully completed.
  Gas used: 52813 - Gas spent: 0.00264065 Ether
  Review it on Etherscan.
  TxHash: 0x45862377d36dc35709b723028cef7c00f03f5760a28454c40abb7dd1bf0b0c18

Ticker has been removed successfully
```

**We now need to return to the main menu and select the Security Token Registry option again**

**Choosing the MODIFY SECURITY TOKEN option:**

```text
What do you want to do? [1...6 / 0]: 3
Enter the security token address that you want to add or modify: 0xE447e88c37017550a9f85511cDaAEbC9529e845b
```

**Chose the contract address of the LFV security token we created earlier \(should be in your token details above\):**

```text
-- Current Security Token data --
  Ticker: LFV
  Token details: 
  Deployed at: 1539272653
-- Current Ticker details --
  Owner: 0x23f95b881149018E3240A6c98d4Ec3A111aDc5DF
  Token name: Leaf Ventures

Enter the token name: LFV
Enter the token owner: 0x23f95b881149018E3240A6c98d4Ec3A111aDc5DF
Enter the token details: 
Enter the Unix Epoch timestamp at which security token was deployed: 1539272808
---- Transaction executed: modifySecurityToken - Gas limit provided: 232848 ----
```

**Entering my token information that can be found in your terminal command information from when you originally**

```text
  Your transaction is being processed. Please wait...
  TxHash: 0xfb5703852b1bc7c292c91e3f44155ee3bf74d885039052eb2885ec0b189988d6

  Congratulations! The transaction was successfully completed.
  Gas used: 140232 - Gas spent: 0.0070116 Ether
  Review it on Etherscan.
  TxHash: 0xfb5703852b1bc7c292c91e3f44155ee3bf74d885039052eb2885ec0b189988d6

Security Token has been updated successfully
```

**Choosing CHANGE EXPIRY DATE the option:**

```text
What do you want to do? [1...6 / 0]: 4
Current expiry limit is 60 days
Enter a new value in days for expiry limit: 70

---- Transaction executed: changeExpiryLimit - Gas limit provided: 38071 ----
```

**You can change the expiry date to whatever amount of days that you see fit**

```text
  Your transaction is being processed. Please wait...
  TxHash: 0x10b9958cad8e3a661ed149897efd6b789a8e59108af5a040dad2934aaf6a6afc

  Congratulations! The transaction was successfully completed.
  Gas used: 31726 - Gas spent: 0.0015863 Ether
  Review it on Etherscan.
  TxHash: 0x10b9958cad8e3a661ed149897efd6b789a8e59108af5a040dad2934aaf6a6afc

Expiry limit was changed successfully. New limit is 70 days
```

**Choosing the CHANGE REGISTRATION FEE option**

```text
What do you want to do? [1...6 / 0]: 5

Current ticker registration fee is 250 POLY
Enter a new value in POLY for ticker registration fee: 255


---- Transaction executed: changeTickerRegistrationFee - Gas limit provided: 38900 ----
```

**As the manager you can change the ticker registration fee whatever amount of POLY you see fit**

```text
  Your transaction is being processed. Please wait...
  TxHash: 0x3877f387e2e5683be0a410940a20d1a25f521eee9ab5c96416459331f20a574e

  Congratulations! The transaction was successfully completed.
  Gas used: 32417 - Gas spent: 0.00162085 Ether
  Review it on Etherscan.
  TxHash: 0x3877f387e2e5683be0a410940a20d1a25f521eee9ab5c96416459331f20a574e

Fee was changed successfully. New fee is 255 POLY
```

**Choosing the CHANGE STO LAUNCH FEE option**

```text
What do you want to do? [1...6 / 0]: 6

Current ST launch fee is 250 POLY
Enter a new value in POLY for ST launch fee: 255
```

**You can change the STO launch fee here. As you can see we increased the 250 fee to 255 for this example.**

```text
---- Transaction executed: changeSecurityLaunchFee - Gas limit provided: 38663 ----

  Your transaction is being processed. Please wait...
  TxHash: 0xbbe59445c5f22e621594989840ea17137a049a72ae2a49ab94a802762271ed0e

  Congratulations! The transaction was successfully completed.
  Gas used: 32219 - Gas spent: 0.00161095 Ether
  Review it on Etherscan.
  TxHash: 0xbbe59445c5f22e621594989840ea17137a049a72ae2a49ab94a802762271ed0e

Fee was changed successfully. New fee is 255 POLY
```

**Troubleshooting / FAQs**

NOTE: Option \[1\], \[2\] and \[4\] are not yet available.

