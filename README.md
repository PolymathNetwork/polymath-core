[![Build Status](https://travis-ci.org/PolymathNetwork/polymath-core.svg?branch=master)](https://travis-ci.org/PolymathNetwork/polymath-core)
[![Coverage Status](https://coveralls.io/repos/github/PolymathNetwork/polymath-core/badge.svg?branch=master)](https://coveralls.io/github/PolymathNetwork/polymath-core?branch=master)
<a href="https://t.me/polymathnetwork"><img src="https://img.shields.io/badge/50k+-telegram-blue.svg" target="_blank"></a>

![Polymath logo](Polymath.png)

# Polymath Core

The Polymath Core smart contracts provide a system for launching regulatory-compliant securities tokens on a decentralized blockchain. This particular repository is the implementation of a system that allows for the creation of ST-20-compatible tokens. This system has a modular design that promotes a variety of pluggable components for various types of issuances, legal requirements, and offering processes.


# ST-20 Interface Overview
## Description
An ST-20 token is an Ethereum-based token implemented on top of the ERC-20 protocol that adds the ability for tokens to control transfers based on specific rules. ST-20 tokens rely on Transfer Managers to determine the ruleset the token should apply in order to allow or deny a transfer, be it between the issuer and investors, in a peer to peer exchange, or a transaction with an exchange.

## How it works
ST-20 tokens must implement a `verifyTransfer` method which will be called when attempting to execute a `transfer` or `transferFrom` method. The `verifyTransfer` method will determine whether that transaction can be completed or not. The implementation of `verifyTransfer` can take many forms, but the default approach is a whitelist controlled by the `GeneralTransferManager`.

### The ST-20 Interface

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
The diagram below depicts a high-level view of the various modules, registries, and contracts implemented in Polymath Core:

![Polymath Core architecture](https://github.com/PolymathNetwork/polymath-core/blob/master/docs/images/PolymathCore.png)

## Components
### SecurityToken
`SecurityToken` is an implementation of the ST-20 protocol that allows the addition of different modules to control its behavior. Different modules can be attached to `SecurityToken`:
- `TransferManager` modules: These control the logic behind transfers and how they are allowed or disallowed.
By default, the ST (Security Token) gets a `GeneralTransferManager` module attached in order to determine if transfers should be allowed based on a whitelist approach. The `GeneralTransferManager` behaves differently depending who is trying to transfer the tokens.
a) In an offering setting (investors buying tokens from the issuer) the investor's address should be present on an internal whitelist managed by the issuer within the `GeneralTransferManager`.
b) In a peer to peer transfer, restrictions apply based on real-life lockups that are enforced on-chain. For example, if a particular holder has a 1-year sale restriction for the token, the transaction will fail until that year passes.
- Security Token Offering (STO) modules: A `SecurityToken` can be attached to one (and only one) STO module that will dictate the logic of how those tokens will be sold/distributed. An STO is the equivalent to the Crowdsale contracts often found present in traditional ICOs.
- Permission Manager modules: These modules manage permissions on different aspects of the issuance process. The issuer can use this module to manage permissions and designate administrators on his token. For example, the issuer might give a KYC firm permissions to add investors to the whitelist.

### TickerRegistry
The ticker registry manages the sign up process to the Polymath platform. Issuers can use this contract to register a token symbol (which are unique within the Polymath network). Token Symbol registrations have an expiration period (7 days by default) in which the issuer has to complete the process of deploying their SecurityToken. If they do not complete the process in time, their ticker symbol will be made available for someone else to register.

### SecurityTokenRegistry
The security token registry keeps track of deployed STs on the Polymath Platform and uses the TickerRegistry to allow only registered symbols to be deployed.

### ModuleRegistry
Modules allow custom add-in functionality in the issuance process and beyond. The module registry keeps track of modules added by Polymath or any other users. Modules can only be attached to STs if Polymath has previously verified them. If not, the only user able to utilize a module is its owner, and they should be using it "at their own risk".


# Stepping through an issuance with the CLI Tool
First, assure that you have [setup Polymath Core properly](#setup).

The Polymath CLI (Command Line Interface) commands are operated from a *nix command prompt (unix or mac).

To use it, make sure you are connected to a full ethereum node (or locally to `ganache-cli`, a local private test network).
You can run Parity with the following command to get started (make sure the node is fully synced before using the CLI tool):

```bash
parity --chain ropsten  --rpcapi "eth,net,web3,personal,parity" --unlock YOUR_ETH_ACCOUNT --password $HOME/password.file
```

## Poly Faucet

If you are working on a local private network, you should run the faucet command to get Poly necessary to pay fees for the other commands.

```bash
node CLI/polymath-cli faucet
```

## Generating ST-20 token

The ST-20 Generator command is a wizard-like script that will guide technical users in the creation and deployment of an ST-20 token.

1. Edit `CLI/commands/helpers/contract_addresses.js` to make sure scripts are pointing to the correct contract addresses
2. On the terminal, run the following command: 
```bash
node CLI/polymath-cli st20generator
```
3. Follow the text prompts:
    * You will be asked for a token symbol. Enter a new symbol to register or a symbol you have already registered.
    * Enter a token name (long name seen by investors) to complete the token registration process. The token will be deployed to the blockchain.
    * (Optional) If you want to issue tokens to an address you own enter the address and then how many tokens you want to issue. If you want to issue tokens to a list of affiliates press `Y` and it will update a whitelist with them and then tokens will be issued.
    Make sure the `whitelist_data.csv` and `multi_mint_data.csv` files are present in the data folder and fulfilled with the right information.    
    * Configure the Capped STO. Enter start and end times, the issuance cap, and exchange rate.
4. Once the process is finished, you can run the `node CLI/polymath-cli st20generator` command again and enter the token symbol to see the STO's live-progress.

## Whitelisting investors

After starting the STO you can run a command to mass-update a whitelist of allowed/known investors.
Make sure the `whitelist_data.csv` file is present in the data folder.
The command takes 2 parameters:
- The token symbol for the STO you want to invest in
- (Optional) The size of each batch 

```bash
node CLI/polymath-cli whitelist TOKEN_SYMBOL [BATCH_SIZE]
```

## Initial minting

Before starting the STO you can run a command to distribute tokens to previously whitelisted investors.
Make sure the `multi_mint_data` file is present in the data folder.
The command takes 2 parameters:
- The token symbol for the STO you want to invest in
- (Optional) The size of each batch 

```bash
node CLI/polymath-cli multi_mint TOKEN_SYMBOL [BATCH_SIZE]
```

## Investing in the STO

You can run the invest command to participate in any STO you have been whitelisted for.
The script takes 3 parameters:
- The token symbol for the STO you want to invest in
- The account that will receive the tokens
- How much ETH to send

```bash
node CLI/polymath-cli invest TOKEN_SYMBOL BENEFICIARY ETHER
```

## Transferring tokens

You can run the transfer command to transfer ST tokens to another account (as long as both are whitelisted and have been cleared of any lockup periods).
- The token symbol of the ST you want to transfer
- The account that will receive the tokens
- How many tokens to send

```bash
node CLI/polymath-cli transfer TOKEN_SYMBOL ACCOUNT_TO AMOUNT
```

## Managing modules

You can run the module manager command to view all the modules attached to a token and their status.
You will be asked for a token symbol.

```bash
node CLI/polymath-cli module_manager
```

# Setting up Polymath Core
## KOVAN

### v1.1.0 (TORO Release)

| Contract                                                         | Address                                                                                                                       |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| TickerRegistry:                                               | [0xcf82d3f2abdf777f559e98d85f976283595f0d30](https://kovan.etherscan.io/address/0xcf82d3f2abdf777f559e98d85f976283595f0d30)                                              |
| SecurityTokenRegistry:                                        | [0x00d4671f8c00fcfc2256e008242f07c1428b5836](https://kovan.etherscan.io/address/0x00d4671f8c00fcfc2256e008242f07c1428b5836)                                              |
| ModuleRegistry:                                               | [0x719287e2f1dfc7d953d0c1f05fdf27934d9c6f30](https://kovan.etherscan.io/address/0x719287e2f1dfc7d953d0c1f05fdf27934d9c6f30)                                              |
| CappedSTOFactory:                                               | [0x30e2c3fa3297808a2e9f176be6cc587cb76259c4](https://kovan.etherscan.io/address/0x30e2c3fa3297808a2e9f176be6cc587cb76259c4)                                              |

## Setup

The smart contracts are written in [Solidity](https://github.com/ethereum/solidity) and tested/deployed using [Truffle](https://github.com/trufflesuite/truffle) version 4.1.0. The new version of Truffle doesn't require testrpc to be installed separately so you can just run the following:

```bash
# Install Truffle package globally:
$ npm install -g truffle

# Install local node dependencies:
$ npm install
```

## Testing

To test the code simply run:

```bash
$ npm run test
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
