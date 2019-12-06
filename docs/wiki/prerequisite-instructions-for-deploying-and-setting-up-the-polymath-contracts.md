# Prerequisite-Instructions-for-Deploying-and-Setting-Up-the-Polymath-Contracts

The following instructions will allow you to run the CLI on a local test network \(Ganache\) using the latest Polymath smart contracts - version 3.0.0

**Install requirement packages**

* node v10.16.0
* yarn v1.17.3
* Truffle v5.0.6 \(core: 5.0.6\)
* Solidity v0.5.8 \(solc-js\)

**Step-by-Step Guide to Run the CLI**

1. Create a new directory
2. Clone polymath-core repository `https://github.com/PolymathNetwork/polymath-core/tree/master`
3. cd into polymath-core
4. Checkout master branch `$ git checkout master`
5. Install truffle globally `$ yarn global add truffle@5.0.6`
6. Install dependencies `$ yarn install`
7. In a new terminal window run ganache with the script provided `$ yarn ganache-cli`
8. Go back to first terminal and compile and deploy contracts

`$ truffle compile` , `$ truffle migrate`

1. cd to CLI folder
2. Run `yarn install`
3. Return to root path and run `node CLI/polymath-cli <command>`
4. To see the list all available commands `node CLI/polymath-cli -h`
5. When CLI is run for the first time, it will try to create a local key store. It will prompt for the user private key and a password to encrypt it using the web3 key store V3 JSON standard. After that, the next time the user runs a CLI command, only his password will be prompted.
6. Starting working with the CLI

**Note 1:** You can access Ethereum testnets and mainnet via the Infura load-balanced nodes. You have to save your private key to ./privKey file and run CLI command adding --remote-node option. Example: `node CLI/polymath-cli <command> --remote-node https://mainnet.infura.io/v3/111111111111111111111`

**Note 2:** Parity can be used to run this on a testnet or mainnet. We recommend using Kovan due to gas limits: `parity --chain kovan --rpcapi "eth,net,web3,personal,parity" --unlock [YOUR ACCOUNT] --password $HOME/password.file`

