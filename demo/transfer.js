var fs = require('fs');
// var BigNumber = require('bignumber.js');
const Web3 = require('web3');
var chalk = require('chalk');

/////////////////////////////ARTIFACTS//////////////////////////////////////////
var contracts = require("./helpers/contract_addresses");
let tickerRegistryAddress = contracts.tickerRegistryAddress();
let securityTokenRegistryAddress = contracts.securityTokenRegistryAddress();
let cappedSTOFactoryAddress = contracts.cappedSTOFactoryAddress();

let tickerRegistryABI;
let securityTokenRegistryABI;
let securityTokenABI;
let cappedSTOABI;
let generalTransferManagerABI;
try {
  tickerRegistryABI = JSON.parse(require('fs').readFileSync('./build/contracts/TickerRegistry.json').toString()).abi;
  securityTokenRegistryABI = JSON.parse(require('fs').readFileSync('./build/contracts/SecurityTokenRegistry.json').toString()).abi;
  securityTokenABI = JSON.parse(require('fs').readFileSync('./build/contracts/SecurityToken.json').toString()).abi;
  cappedSTOABI = JSON.parse(require('fs').readFileSync('./build/contracts/CappedSTO.json').toString()).abi;
  generalTransferManagerABI = JSON.parse(require('fs').readFileSync('./build/contracts/GeneralTransferManager.json').toString()).abi;
} catch (err) {
  console.log('\x1b[31m%s\x1b[0m', "Couldn't find contracts' artifacts. Make sure you ran truffle compile first");
  return;
}


////////////////////////////WEB3//////////////////////////////////////////
if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else {
  // set the provider you want from Web3.providers
  web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}



////////////////////////////USER INPUTS//////////////////////////////////////////
let tokenSymbol = process.argv.slice(2)[0]; //token symbol
let transferTo = process.argv.slice(2)[1]; //investment beneficiary
let transferAmount = process.argv.slice(2)[2]; //ETH investment

/////////////////////////GLOBAL VARS//////////////////////////////////////////

let Issuer;
let accounts;
let generalTransferManager;
let securityToken;
let cappedSTOModule;

let DEFAULT_GAS_PRICE = 80000000000;


//////////////////////////////////////////ENTRY INTO SCRIPT//////////////////////////////////////////
startScript();

async function startScript() {

  accounts = await web3.eth.getAccounts();
  Issuer = accounts[0];

  try {
    tickerRegistry = new web3.eth.Contract(tickerRegistryABI, tickerRegistryAddress);
    tickerRegistry.setProvider(web3.currentProvider);
    securityTokenRegistry = new web3.eth.Contract(securityTokenRegistryABI, securityTokenRegistryAddress);
    securityTokenRegistry.setProvider(web3.currentProvider);
    transfer();
  } catch (err) {
    console.log(err)
    console.log('\x1b[31m%s\x1b[0m', "There was a problem getting the contracts. Make sure they are deployed to the selected network.");
    return;
  }
}

async function transfer() {

  // Let's check if token has already been deployed, if it has, skip to STO
  await securityTokenRegistry.methods.getSecurityTokenAddress(tokenSymbol).call({ from: Issuer }, function (error, result) {
    if (result != "0x0000000000000000000000000000000000000000") {
      console.log('\x1b[32m%s\x1b[0m', "Token deployed at address " + result + ".");
      securityToken = new web3.eth.Contract(securityTokenABI, result);
    }
  });

  try{
      let GAS = 1.2 * (await securityToken.methods.transfer(transferTo,web3.utils.toWei(transferAmount,"ether")).estimateGas({from: Issuer}));
      console.log(chalk.red(`transfer: ` + GAS));
    await securityToken.methods.transfer(transferTo,web3.utils.toWei(transferAmount,"ether")).send({ from: Issuer, gas:Math.round(GAS), gasPrice:DEFAULT_GAS_PRICE})
    .on('transactionHash', function(hash){
      console.log(`
        Your transaction is being processed. Please wait...
        TxHash: ${hash}\n`
      );
    })
    .on('receipt', function(receipt){
      console.log(`
        Congratulations! The transaction was successfully completed.

        Account ${receipt.events.Transfer.returnValues.from}
        transfered ${web3.utils.fromWei(receipt.events.Transfer.returnValues.value,"ether")} tokens
        to account ${receipt.events.Transfer.returnValues.to}

        Review it on Etherscan.
        TxHash: ${receipt.transactionHash}\n`
      );
    });

  }catch (err){
    console.log(err);
    console.log("There was an error processing the transfer transaction. \n The most probable cause for this error is one of the involved accounts not being in the whitelist or under a lockup period.")
    return;
  }


};
