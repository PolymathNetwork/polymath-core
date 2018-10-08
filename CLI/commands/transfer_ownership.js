var chalk = require('chalk');
var common = require('./common/common_functions');
var global = require('./common/global');

/////////////////////////////ARTIFACTS//////////////////////////////////////////
var abis = require('./helpers/contract_abis')

let contract;
//////////////////////////////////////////ENTRY INTO SCRIPT//////////////////////////////////////////

async function startScript(contractAddress, transferTo, remoteNetwork) {
  await global.initialize(remoteNetwork);

  if (!web3.utils.isAddress(contractAddress) || !web3.utils.isAddress(transferTo)) {
    console.log(chlak.red(`Please enter valid addresses`));
  } else {
    let ownableABI = abis.ownable();
    contract = new web3.eth.Contract(ownableABI, contractAddress);
    contract.setProvider(web3.currentProvider);
    transferOwnership(transferTo);
  }
}

async function transferOwnership(transferTo) {
  // Check if Issuer is the current owner
  let currentOwner = await contract.methods.owner().call();
  if (currentOwner != Issuer.address) {
      console.log(chalk.red(`You are not the current owner ot this contract. Current owner is ${currentOwner}.`));
  } else {
    let transferOwnershipAction = contract.methods.transferOwnership(transferTo);
    let receipt = await common.sendTransaction(Issuer, transferOwnershipAction, defaultGasPrice);
    let event = common.getEventFromLogs(contract._jsonInterface, receipt.logs, 'OwnershipTransferred');
    console.log(chalk.green(`Ownership transferred successfuly. New owner is ${event.newOwner}`));
  }
};

module.exports = {
  executeApp: async function(contractAddress, transferTo, remoteNetwork) {
        return startScript(contractAddress, transferTo, remoteNetwork);
    }
}
