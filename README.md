[![Build Status](https://travis-ci.org/PolymathNetwork/polymath-core.svg?branch=master)](https://travis-ci.org/PolymathNetwork/polymath-core)
[![Coverage Status](https://coveralls.io/repos/github/PolymathNetwork/polymath-core/badge.svg?branch=master)](https://coveralls.io/github/PolymathNetwork/polymath-core?branch=master)
[![Gitter](https://img.shields.io/badge/chat-gitter-green.svg)](https://gitter.im/PolymathNetwork/Lobby)
[![Telegram](https://img.shields.io/badge/50k+-telegram-blue.svg)](https://gitter.im/PolymathNetwork/Lobby) [![Greenkeeper badge](https://badges.greenkeeper.io/PolymathNetwork/polymath-core.svg)](https://greenkeeper.io/)

![Polymath logo](Polymath.png)

# Polymath Core
The Polymath Core smart contracts provide a system for launching regulatory-compliant securities tokens on a decentralized blockchain. This particular repository is the implementation of a system that allows for the creation of ST-20-compatible tokens. This system has a modular design that promotes a variety of pluggable components for various types of issuances, legal requirements, and offering processes.

## Introduction to Security Tokens

### What is a Security token?
A Security Token shares many of the characteristics of both fungible (erc20) and non-fungible tokens (erc721). Security tokens are designed to represent complete or fractional ownership interests in assets and/or entities. While utility tokens have no limitations on who can send or receive the token, security tokens are subject to many restrictions based on identity, jurisdiction and asset category.
### Security Tokens Vs. Utility Tokens?
The concept of utility tokens is fairly well understood in the blockchain space today. Utility tokens represent access to a network, and your token purchase represents the ability to buy goods or services from that network- Think of when you purchase a arcade token to allow you to play an arcade game machine. Utility tokens give you that same type of access to a product or service. On the other hand, security tokens represent complete or fractional ownership in an asset (such as shares in a company, a real-estate asset, artwork, etc). Such as having a stake in a company, real estate, or intellectual property can all be represented by security tokens. Security tokens offer the benefit of bringing significant transparency over traditional paper shares through the use of the blockchain and its associated public ledger. Security token structure, distribution, or changes that could affect investors are now accessible to all via the blockchain. 

# ST-20 Interface Overview
## Description
An ST-20 token is an Ethereum-based token implemented on top of the ERC-20 protocol that adds the ability for tokens to control transfers based on specific rules. ST-20 tokens rely on Transfer Managers to determine the ruleset the token should apply in order to allow or deny a transfer, be it between the issuer and investors, in a peer to peer exchange, or a transaction with an exchange.

## How it works
ST-20 tokens must implement a verifyTransfer method which will be called when attempting to execute a transfer or transferFrom method. The verifyTransfer method will determine whether that transaction can be completed or not. The implementation of verifyTransfer can take many forms, but the default approach is a whitelist controlled by the GeneralTransferManager.
## The ST-20 Interface
```
contract IST20 {

    // off-chain hash
    bytes32 public tokenDetails;

    //transfer, transferFrom must respect the result of verifyTransfer
    function verifyTransfer(address _from, address _to, uint256 _amount) view public returns (bool success);

    //used to create tokens
    function mint(address _investor, uint256 _amount) public returns (bool success);
}
```
# The Polymath Core Architecture
The diagram below depicts a high-level view of the various modules, registries, and contracts implemented within Polymath Core 2.0.0:

![Polymath Core architecture](https://github.com/PolymathNetwork/polymath-core/blob/master/docs/images/Core%20Architecture%202.0.0%20%20Diagram.png)

## Components
### Polymath Registries

**Security Token Registry (STR)** - This registry tells us which tokens and tickers have been registered to it. This allows us to prevent people from reserving the same ticker as another issuer as well checking for inputs such as making sure it is a maximum of 10 characters and what the expiry date is on the respective ticker. Right now, if you reserve a ticker it last for 60 days. After it expires someone else can go ahead and reserve it or they you can re-register it.

With the **2.0.0 Core Release**, when you deploy a token you do it through the ST registry and it keeps a record of which tokens have been registered within it. 

**The Module Registry** - This registry keeps a record of all the different module factories. 

**The Features Registry** - A registry of features that we may enable in the future but right now only Polymath has control of the features. Later, Polymath can easily turn access on and off.

To be clear, each module has its own factory which is in charge of deploying an instance of that module for the issuers token. 

There are General factories which every token uses (if wanted). It works by sending the token to the factory where it asks for an instance of that said module and the token will add an instance of that module to itself. This allows for each token to have its unique modules associated with it. All of this is created through the factories and the module registry keeps a records of all the different modules factories that are registered.

As of now, Polymath is the only one that can add or register a module factory to the module registry. Polymath submits the modules to the registry, however, we are exploring different approaches to open up development to other parties such as potentially working with external developers to provide services to issuers through modules. 

**Polymath has 3 main registries** 
1. Security Token Registry 
2. Features Registry 
3. Module Registry 

The Polymath Registry holds the addresses of the 3 registries above. 

As of the **2.0.0 release**, we have built it out so that the Module and Security Token Registry are upgradeable. This means that down the road if there is something in the logic that we need to change, we can do that without having to re-deploy the whole thing again. All we need to do is update it. 

### Modules

**Security Token (ST-20)**: The SecurityToken is an implementation of the ST-20 protocol that allows the addition of different modules to control its behavior. Different modules can be attached to a SecurityToken. 

We have a ST-20 token which is an Ethereum-based token implemented on top of the ERC-20 protocol that adds the ability for tokens to control transfers based on specific rules. ST-20 tokens rely on Transfer Managers to determine the ruleset the token should apply in order to allow or deny a transfer, be it between the issuer and investors, in a peer to peer exchange, or a transaction with an exchange.

To simplify, it breaks down to having a base token that gives the issuer the ability to add functionality through modules. 

###### Example 

We have modules that can deal with transfer management. Restricting transfers through a whitelist  or just restricting a transfer between addresses that could make an account go over a specified limit or you can limit the amount of a token holders or you can even limit transfers to prevent dumping of tokens by having a lockup period for token holders. 

#### The Polymath Modules 
**TransferManager modules:** These control the logic behind transfers and how they are allowed or disallowed. By default, the ST (Security Token) gets a `GeneralTransferManager` module attached in order to determine if transfers should be allowed based on a whitelist approach. 

The `GeneralTransferManager` behaves differently depending who is trying to transfer the tokens. 
a) In an offering setting (investors buying tokens from the issuer) the investor's address should be present on an internal whitelist managed by the issuer within the GeneralTransferManager. 

b) In a peer to peer transfer, restrictions apply based on real-life lockups that are enforced on-chain. For example, if a particular holder has a 1-year sale restriction for the token, the transaction will fail until that year passes.

**Security Token Offering (STO) modules:** A SecurityToken can be attached to one (and only one) STO module that will dictate the logic of how those tokens will be sold/distributed. An STO is the equivalent to the Crowdsale contracts often found present in traditional ICOs.

**Permission Manager modules:** These modules manage permissions on different aspects of the issuance process. The issuer can use this module to manage permissions and designate administrators on his token. For example, the issuer might give a KYC firm permissions to add investors to the whitelist.

**Checkpoint Modules**
These modules allow the issuer to define checkpoints at which token balances and the total supply of a token can be consistently queried. This functionality is useful for dividend payment mechanisms and on-chain governance, both of which need to be able to determine token balances consistently as of a specified point in time.

**Burn Modules** 
These modules allow issuers or investors to burn or redeem their tokens in exchange of another token which can be on chain or offchain.

With the Core **2.0.0 Release**, Polymath has also introduced the `USDTieredSTO`. This new STO module allows a security token to be issued in return for investment (security token offering) in various currencies (ETH, POLY & a USD stable coin). The price of tokens is denominated in USD and the STO allows multiple tiers with different price points to be defined. Discounts for investments made in POLY can also be defined.

## CLI and CLI Documentation Wiki: 

The CLI is for users that want to easily walkthrough all the details of an STO issuance. The CLI documentation is located on our [Github Wiki](https://github.com/PolymathNetwork/polymath-core/wiki). 

You can easily navigate through it with the sidebar directory in order to run the CLI and set up and test the following: 

1. Prerequisite Instructions / Deploy and setup the Polymath contracts
2. Launch the CLI on Ganache
3. Use the Faucet to get POLY
4. Deploy a token + Launch a USDTieredSTO
5. Whitelist investors
6. Work with the Dividends module
7. Using other CLI features


# Setting up Polymath Core

## Mainnet

### v2.0.0 

| Contract                                                         | Address                                                                                                                       |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| SecurityTokenRegistry (Proxy):                                | [0x240f9f86b1465bf1b8eb29bc88cbf65573dfdd97](https://etherscan.io/address/0x240f9f86b1465bf1b8eb29bc88cbf65573dfdd97)                                              |
| ModuleRegistry (Proxy):                                       | [0x4566d68ea96fc2213f2446f0dd0f482146cee96d](https://etherscan.io/address/0x4566d68ea96fc2213f2446f0dd0f482146cee96d)                                              |
| Polymath Registry:                                            | [0xdfabf3e4793cd30affb47ab6fa4cf4eef26bbc27](https://etherscan.io/address/0xdfabf3e4793cd30affb47ab6fa4cf4eef26bbc27)                                              |
| Feature Registry:                                            | [0xa3eacb03622bf1513880892b7270d965f693ffb5](https://etherscan.io/address/0xa3eacb03622bf1513880892b7270d965f693ffb5)                                              |
| ETHOracle:                                                   | [0x60055e9a93aae267da5a052e95846fa9469c0e7a](https://etherscan.io/address/0x60055e9a93aae267da5a052e95846fa9469c0e7a)                                              |
| POLYOracle:                                                   | [0x52cb4616E191Ff664B0bff247469ce7b74579D1B](https://etherscan.io/address/0x52cb4616E191Ff664B0bff247469ce7b74579D1B)                                              |
| General Transfer Manager Factory:                              | [0xdc95598ef2bbfdb66d02d5f3eea98ea39fbc8b26](https://etherscan.io/address/0xdc95598ef2bbfdb66d02d5f3eea98ea39fbc8b26)                                              |
| General Permission Manager Factory:                             | [0xf0aa1856360277c60052d6095c5b787b01388cdd](https://etherscan.io/address/0xf0aa1856360277c60052d6095c5b787b01388cdd)                                              |
| CappedSTOFactory:                                               | [0x77d89663e8819023a87bfe2bc9baaa6922c0e57c](https://etherscan.io/address/0x77d89663e8819023a87bfe2bc9baaa6922c0e57c)                                              |
| USDTieredSTO Factory:                                           | [0x5a3a30bddae1f857a19b1aed93b5cdb3c3da809a](https://etherscan.io/address/0x5a3a30bddae1f857a19b1aed93b5cdb3c3da809a)                                              |
| EthDividendsCheckpointFactory:                                  | [0x968c74c52f15b2de323eca8c677f6c9266bfefd6](https://etherscan.io/address/0x968c74c52f15b2de323eca8c677f6c9266bfefd6)                                              |
| ERC20 Dividends Checkpoint Factory:                             | [0x82f9f1ab41bacb1433c79492e54bf13bccd7f9ae](https://etherscan.io/address/0x82f9f1ab41bacb1433c79492e54bf13bccd7f9ae)                                              |
| Count Transfer Manager Factory:                               | [0xd9fd7e34d6e2c47a69e02131cf8554d52c3445d5](https://etherscan.io/address/0xd9fd7e34d6e2c47a69e02131cf8554d52c3445d5)                                              |
| Percentage Transfer Manager Factory:                             | [0xe6267a9c0a227d21c95b782b1bd32bb41fc3b43b](https://etherscan.io/address/0xe6267a9c0a227d21c95b782b1bd32bb41fc3b43b)                                              |
| Manual Approval Transfer Manager Factory (2.0.1):                        | [0x6af2afad53cb334e62b90ddbdcf3a086f654c298](https://etherscan.io/address/0x6af2afad53cb334e62b90ddbdcf3a086f654c298)                                              |


New SecurityTokenRegistry (2.0.1): 0x538136ed73011a766bf0a126a27300c3a7a2e6a6
(fixed bug with getTickersByOwner())

New ModuleRegistry (2.0.1): 0xbc18f144ccf87f2d98e6fa0661799fcdc3170119
(fixed bug with missing transferOwnership function)

New ManualApprovalTransferManager 0x6af2afad53cb334e62b90ddbdcf3a086f654c298
(Fixed 0x0 from bug)

## KOVAN

### v2.0.0 
New Kovan PolyTokenFaucet: 0xb347b9f5b56b431b2cf4e1d90a5995f7519ca792

| Contract                                                         | Address                                                                                                                       |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| SecurityTokenRegistry (Proxy):                                | [0xbefb81114d532bddddc724af20c3516fa75f0afb](https://kovan.etherscan.io/address/0xbefb81114d532bddddc724af20c3516fa75f0afb)                                              |
| ModuleRegistry (Proxy):                                       | [0x0fac8d8cce224eead73c1187df96570aa80a568b](https://kovan.etherscan.io/address/0x0fac8d8cce224eead73c1187df96570aa80a568b)                                              |
| Polymath Registry:                                            | [0x9903e7b5acfe5fa9713771a8d861eb1df8cd7046](https://kovan.etherscan.io/address/0x9903e7b5acfe5fa9713771a8d861eb1df8cd7046)                                              |
| Feature Registry:                                            | [0xa8f85006fdacb3d59ffae564c05433f0c949e911](https://kovan.etherscan.io/address/0xa8f85006fdacb3d59ffae564c05433f0c949e911)                                              |
| ETHOracle:                                                   | [0xCE5551FC9d43E9D2CC255139169FC889352405C8](https://kovan.etherscan.io/address/0xCE5551FC9d43E9D2CC255139169FC889352405C8)                                              |
| POLYOracle:                                                   | [0x461d98EF2A0c7Ac1416EF065840fF5d4C946206C](https://kovan.etherscan.io/address/0x461d98EF2A0c7Ac1416EF065840fF5d4C946206C)                                              |
| General Transfer Manager Factory:                              | [0xfe7e2bb6c200d5222c82d0f8fecca5f8fe4ab8ce](https://kovan.etherscan.io/address/0xfe7e2bb6c200d5222c82d0f8fecca5f8fe4ab8ce)                                              |
| General Permission Manager Factory:                             | [0xde5eaa8d73f43fc5e7badb203f03ecae2b29bd92](https://kovan.etherscan.io/address/0xde5eaa8d73f43fc5e7badb203f03ecae2b29bd92)                                              |
| CappedSTOFactory:                                               | [0xe14d7dd044cc6cfe37548b6791416c59f19bfc0d](https://kovan.etherscan.io/address/0xe14d7dd044cc6cfe37548b6791416c59f19bfc0d)                                              |
| USDTieredSTO Factory:                                           | [0xf9f0bb9f868d411dd9a9511a79d172449e3c15f5](https://kovan.etherscan.io/address/0xf9f0bb9f868d411dd9a9511a79d172449e3c15f5)                                              |
| EthDividendsCheckpointFactory:                                  | [0x2861425ba5abbf50089c473b28f6c40a8ea5262a](https://kovan.etherscan.io/address/0x2861425ba5abbf50089c473b28f6c40a8ea5262a)                                              |
| ERC20 Dividends Checkpoint Factory:                             | [0xbf9495550417feaacc43f86d2244581b6d688431](https://kovan.etherscan.io/address/0xbf9495550417feaacc43f86d2244581b6d688431)                                              |
| Count Transfer Manager Factory:                               | [0x3c3c1f40ae2bdca82b90541b2cfbd41caa941c0e](https://kovan.etherscan.io/address/0x3c3c1f40ae2bdca82b90541b2cfbd41caa941c0e)                                              |
| Percentage Transfer Manager Factory:                             | [0x8cd00c3914b2967a8b79815037f51c76874236b8](https://kovan.etherscan.io/address/0x8cd00c3914b2967a8b79815037f51c76874236b8)                                              |
| Manual Approval Transfer Manager Factory:                        | [0x9faa79e2ccf0eb49aa6ebde1795ad2e951ce78f8](https://kovan.etherscan.io/address/0x9faa79e2ccf0eb49aa6ebde1795ad2e951ce78f8)                                              |


New ManualApprovalTransferManager 0x9faa79e2ccf0eb49aa6ebde1795ad2e951ce78f8
(Fixed 0x0 from bug)


## Package version requirements for your machine:

- node v8.x.x or v9.x.x
- npm v6.x.x or newer
- Yarn v1.3 or newer
- Homebrew v1.6.7 (for macOS)
- Truffle v4.1.11 (core: 4.1.11)
- Solidity v0.4.24 (solc-js)
- Ganache CLI v6.1.3 (ganache-core: 2.1.2) or newer

## Setup

The smart contracts are written in [Solidity](https://github.com/ethereum/solidity) and tested/deployed using [Truffle](https://github.com/trufflesuite/truffle) version 4.1.0. The new version of Truffle doesn't require testrpc to be installed separately so you can just run the following:

```bash
# Install Truffle package globally:
$ npm install --global truffle

# (Only for windows) set up build tools for node-gyp by running below command in powershell:
$ npm install --global --production windows-build-tools

# Install local node dependencies:
$ yarn
```

## Testing

To test the code simply run:

```bash
# on *nix systems
$ npm run test

# on windows systems
$ npm run wintest
```


# Extending Polymath Core

1. Deploy `ModuleRegistry`. `ModuleRegistry` keeps track of all available modules that add new functionalities to
Polymath-based security tokens.

2. Deploy `GeneralTransferManagerFactory`. This module allows the use of a general `TransferManager` for newly issued security tokens. The General Transfer Manager gives STs the ability to have their transfers restricted by using an on-chain whitelist.

3. Add the `GeneralTransferManagerFactory` module to `ModuleRegistry` by calling `ModuleRegistry.registerModule()`.

4. Deploy `TickerRegistry`. This contract handles the registration of unique token symbols. Issuers first have to claim their token symbol through the `TickerRegistry`. If it's available they will be able to deploy a ST with the same symbol for a set number of days before the registration expires.

5. Deploy SecurityTokenRegistry. This contract is responsible for deploying new Security Tokens. STs should always be deployed by using the SecurityTokenRegistry.

## Deploying Security Token Offerings (Network Admin Only)

Security Token Offerings (STOs) grant STs the ability to be distributed in an initial offering. Polymath offers a few out-of-the-box STO models for issuers to select from and, as the platform evolves, 3rd party developers will be able to create their own offerings and make them available to the network.

As an example, we've included a `CappedSTO` and `CappedSTOFactory` contracts.

In order to create a new STO, developers first have to create an STO Factory contract which will be responsible for instantiating STOs as Issuers select them. Each STO Factory has an STO contract attached to it, which will be instantiated for each Security Token that wants to use that particular STO.

To make an STO available for Issuers, first, deploy the STO Factory and take note of its address. Then, call `moduleRegistry.registerModule(STO Factory address);`

Once the STO Factory has been registered to the Module Registry, issuers will be able to see it on the Polymath dApp and they will be able to add it as a module of the ST.

Note that while anyone can register an STO Factory, only those "approved" by Polymath will be enabled to be attached by the general community. An STO Factory not yet approved by Polymath may only be used by it's author.


# Code Styleguide

The polymath-core repo follows the [Solidity style guide](http://solidity.readthedocs.io/en/develop/style-guide.html).

# Links    

- [Polymath Website](https://polymath.network)
- [Ethereum Project](https://www.ethereum.org/)
- [Solidity Docs](https://solidity.readthedocs.io/en/develop/)
- [Truffle Framework](http://truffleframework.com/)
- [Ganache CLI / TestRPC](https://github.com/trufflesuite/ganache-cli)
