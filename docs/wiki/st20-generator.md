# How to Create and Launch an STO

**Summary:** Wizard-like script that will guide technical users in the creation and deployment of an ST-20 token.

**Steps**:

1. Token Creation - Ticker Symbol Registration 
2. Choose if you want to transfer the ownership of the token
3. Enter the name for your new token
4. Enter off-chain details of the token \(enter a URL with the details\)
5. Select the Token divisibility type

## How to Use this CLI Feature \(Instructions\):

**To Start, run either of the following commands:**

```text
 $ node CLI/polymath-cli st20generator   OR    $  node CLI/polymath-cli st
```

```text
********************************************
Welcome to the Command-Line ST-20 Generator.
********************************************

The following script will create a new ST-20 according to the parameters you enter.
Issuer Account: 0x02d502D968d3dBa68A9Db31B656fb0201dD0151f


Token Symbol Registration

Registering the new token symbol requires 250 POLY & deducted from '0x02d502D968d3dBa68A9Db31B656fb0201dD0151f', Current balance is 1100500 POLY
```

**NOTE: You must have POLY to go through this section. If you haven’t already done so, scroll up to the** [**FAUCET instructions**](https://github.com/PolymathNetwork/polymath-core/wiki/How-to-Use-the-POLY-Faucet) **and get funded!**

```text
[1] Register a new ticker
[0] CANCEL

Select a ticker [1/0]: 1
Enter a symbol for your new ticker: CP
```

**Here we want to register a new ticket, so enter the ticker symbol that you want for your security token**

```text
---- Transaction executed: approve - Gas limit provided: 54732 ----

  Your transaction is being processed. Please wait...
  TxHash: 0x4c719ceb7601c4a61f363306ad6ab91745c61253e60ff34f88c5301196f3cf7b

  Congratulations! The transaction was successfully completed.
  Gas used: 45610 - Gas spent: 0.0022805 Ether
  Review it on Etherscan.
  TxHash: 0x4c719ceb7601c4a61f363306ad6ab91745c61253e60ff34f88c5301196f3cf7b

---- Transaction executed: registerTicker - Gas limit provided: 355923 ----

  Your transaction is being processed. Please wait...
  TxHash: 0x0b6b08f5f2effec6bffe2b5de1ec00e849ea3d8eb5a05776ac386940d38a6318

  Congratulations! The transaction was successfully completed.
  Gas used: 237282 - Gas spent: 0.0118641 Ether
  Review it on Etherscan.
  TxHash: 0x0b6b08f5f2effec6bffe2b5de1ec00e849ea3d8eb5a05776ac386940d38a6318

Do you want to transfer the ownership of CP ticker? [y/n]: n
```

**Select n \(No\) if you want to do the default / the typical choice.**

```text
Token Creation - Token Deployment

Token deployment requires 250 POLY & deducted from '0x02d502D968d3dBa68A9Db31B656fb0201dD0151f', Current balance is 1100250 POLY

Enter the name for your new token: CiPa
Enter off-chain details of the token (i.e. Dropbox folder url): https://docs.google.com/document/u/1/d/1Z8TSbqOucZfY82HnR513l4i7nsHjzbBAAVTpaBHFe54/edit?ouid=113068590779632341600&usp=docs_home&ths=true
Press "N" for Non-divisible type token or hit Enter for divisible type token (Default): 
---- Transaction executed: approve - Gas limit provided: 54732 ----

  Your transaction is being processed. Please wait...
  TxHash: 0xd3f8723f9eaa6d85f6d111a34402ac2d9cbaa8bf781285bfb70dae6fd1546c26

  Congratulations! The transaction was successfully completed.
  Gas used: 45610 - Gas spent: 0.0022805 Ether
  Review it on Etherscan.
  TxHash: 0xd3f8723f9eaa6d85f6d111a34402ac2d9cbaa8bf781285bfb70dae6fd1546c26

---- Transaction executed: generateSecurityToken - Gas limit provided: 7364645 ----

  Your transaction is being processed. Please wait...
  TxHash: 0xa96a6c39c9188cc043ab862a9e762c836ef64007db08cc8d101665516a0d5396

  Congratulations! The transaction was successfully completed.
  Gas used: 6122204 - Gas spent: 0.3061102 Ether
  Review it on Etherscan.
  TxHash: 0xa96a6c39c9188cc043ab862a9e762c836ef64007db08cc8d101665516a0d5396

Security Token has been successfully deployed at address 0x28D7cC342E76CCab1AC04c9344Ad9A2AD67AF1ac
```

You will then be directed to the [Token Manager](https://github.com/PolymathNetwork/polymath-core/wiki/Token-Manager) to continue with your security token and STO detials.

