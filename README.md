[![Build Status](https://travis-ci.com/PolymathNetwork/polymath-core.svg?token=Urvmqzpy4pAxp6EpzZd6&branch=master)](https://travis-ci.com/PolymathNetwork/polymath-core)
<a href="https://t.me/polymathnetwork"><img src="https://img.shields.io/badge/50k+-telegram-blue.svg" target="_blank"></a>

![Polymath](Polymath.png)

# Polymath core v2

The polymath core smart contracts provide a system for launching regulatory
compliant securities tokens on a decentralized blockchain.

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
Polymath-based security tokens. * MANDATORY STEP *

2. Deploy GeneralTransferManagerFactory. This module allows the use of a general TransferManager for newly issued security tokens. The General Transfer Manager gives STs the ability to have their transfers restricted by using an on-chain whitelist.

3. Add the GeneralTransferManagerFactory module to ModuleRegistry by calling `ModuleRegistry.registerModule()`. * MANDATORY STEP *



### Styleguide

The polymath-core repo follows the style guide overviewed here:
http://solidity.readthedocs.io/en/develop/style-guide.html

[polymath]: https://polymath.network
[ethereum]: https://www.ethereum.org/
[solidity]: https://solidity.readthedocs.io/en/develop/
[truffle]: http://truffleframework.com/
[testrpc]: https://github.com/ethereumjs/testrpc
