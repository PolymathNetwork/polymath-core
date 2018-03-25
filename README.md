[![Build Status](https://travis-ci.com/PolymathNetwork/polymath-core.svg?token=Urvmqzpy4pAxp6EpzZd6&branch=master)](https://travis-ci.com/PolymathNetwork/polymath-core)
<a href="https://t.me/polymathnetwork"><img src="https://img.shields.io/badge/50k+-telegram-blue.svg" target="_blank"></a>

![Polymath](Polymath.png)

# Polymath core v2

The polymath core smart contracts provide a system for launching regulatory
compliant securities tokens on a decentralized blockchain.

# Polymath Core Smart Contracts
## Ropsten

- TickerRegistry:
- SecurityTokenRegistry:
- ModuleRegistry:

## Setup

The smart contracts are written in [Solidity][solidity] and tested/deployed
using [Truffle][truffle] version 4.1.0. The new version of Truffle doesn't
require testrpc to be installed separately so you can just do use the following:

```bash
# Install Truffle package globally:
$ npm install -g truffle

# Install local node dependencies:
$ npm install
```

## Testing

To test the code simply run:

```
$ npm run test
```

# Setting up Polymath Network

1. Deploy ModuleRegistry. ModuleRegistry keeps track of all available modules that add new functionalities to
Polymath-based security tokens.

2. Deploy GeneralTransferManagerFactory. This module allows the use of a general TransferManager for newly issued security tokens. The General Transfer Manager gives STs the ability to have their transfers restricted by using an on-chain whitelist.

3. Add the GeneralTransferManagerFactory module to ModuleRegistry by calling `ModuleRegistry.registerModule()`.

4. Deploy TickerRegistry. This contract handles the registration of unique token symbols. Issuers first have to claim their token symbol through the TickerRegistry. If it's available they will be able to deploy a ST with the same symbol for a set number of days before the registration expires.

5. Deploy SecurityTokenRegistry. This contract is responsible for deploying new Security Tokens. STs should always be deployed by using the SecurityTokenRegistry.

## Deploying Security Token Offerings (Only Network Admin)

Security Token Offerings (STOs) grant STs the ability to be distributed in an initial offering. Polymath offers a few out-of-the-box STO models for issuers to select from and, as the platform evolves, 3rd party developers will be able to create their own offerings and make them available to the network.

As an example, we've included a CappedSTO and CappedSTOFactory contracts.

In order to create a new STO, developers first have to create an STO Factory contract which will be responsible for instantiating STOs as Issuers select them. Each STO Factory has an STO contract attached to it, which will be instantiated for each Security Token that wants to use that particular STO.

To make an STO available for Issuers, first, deploy the STO Factory and take note of its address. Then, call `moduleRegistry.registerModule(STO Factory address);`

Once the STO Factory has been registered to the Module Registry, issuers will be able to see it on the Polymath dApp and they will be able to add it as a module of the ST.


### Styleguide

The polymath-core repo follows the style guide overviewed here:
http://solidity.readthedocs.io/en/develop/style-guide.html

[polymath]: https://polymath.network
[ethereum]: https://www.ethereum.org/
[solidity]: https://solidity.readthedocs.io/en/develop/
[truffle]: http://truffleframework.com/
[testrpc]: https://github.com/ethereumjs/testrpc
