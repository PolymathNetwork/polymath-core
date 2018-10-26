const chalk = require('chalk');
const Tx = require('ethereumjs-tx');
const permissionsList = require('./permissions_list');
const abis = require('../helpers/contract_abis');

async function connect(abi, address) {
  contractRegistry = new web3.eth.Contract(abi, address);
  contractRegistry.setProvider(web3.currentProvider);
  return contractRegistry
};

async function checkPermission(contractName, functionName, contractRegistry) {
  let permission = permissionsList.verifyPermission(contractName, functionName);
  if (permission === undefined) {
    return true
  } else {
    let stAddress = await contractRegistry.methods.securityToken().call();
    let securityToken = await connect(abis.securityToken(), stAddress);
    let stOwner = await securityToken.methods.owner().call();
    if (stOwner == Issuer.address) {
      return true
    }
    let result = await securityToken.methods.checkPermission(Issuer.address, contractRegistry.options.address, web3.utils.asciiToHex(permission)).call();
    return result
  }
};

module.exports = {
  convertToDaysRemaining: function (timeRemaining) {
    var seconds = parseInt(timeRemaining, 10);
  
    var days = Math.floor(seconds / (3600 * 24));
    seconds  -= days * 3600 * 24;
    var hrs   = Math.floor(seconds / 3600);
    seconds  -= hrs * 3600;
    var mnts = Math.floor(seconds / 60);
    seconds  -= mnts * 60;
    return (days + " days, " + hrs + " Hrs, " + mnts + " Minutes, " + seconds + " Seconds");
  },
  logAsciiBull: function() {
    console.log(`
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@(@(&&@@@@@@@@@@@@@@@@@@@@@@@@@@(((@&&&&(/@@
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@(#(((((((#%%%#@@@@@@@@@@@@@@@@@@@@%##(((/@@@@@@
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@(%(((((((((((#%%%%%@#@@@@@@@@@@@@(&#####@@@@@@@@%&
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@&#((((((((((((((##%%%%%%%&&&%%##@%#####%(@@@@@@@#%#&
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@(%((((((((((((((((((###%%%%%((#####%%%####@@@@@@@###((@
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@(#(((((((((((((((((((((####%%%#((((######%&%@@(##&###(@@@
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@(#((((((((((((((((((((((((####%%#(((((((#((((((((((((#(@@@@
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@(%(((((((((((((((((((((((((((######%(((((((((((((#&(/@@@@@@@@@
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@&#(((((((((((((((((((((((((((((((###############(##%%#@@@@@@@@@@
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@(#((((##############(((((((((((((((((###################%@@@@@@@@@@
@@@@@@@@@@@@@@@@@@@@@@@@@@@(&#((#(##################((((((((((((((((((##%%##############@@@@@@@@@@@
@@@@@@@@@@@@@@@@@@@@@/%#(((((((##%((((##############((((((((((((((((((##%%#############%%@@@@@@@@@@
@@@@@@@@@@@@@@@@@@@@((((((((((###%%((((((##########(((((((((((((((((((#%%%############%%%#@@@@@@@@@
@@@@@@@@@@@@@@@@@@%((((((((((####%%%((((((((#######(((((((((((####(((((@%%############%%%#@@@@@@@@@
@@@@@@@@@####%%%%%#(((((((((#####%%%%(((((((((((###((((#######(((((((((&@@(&#########%%%%&@@@@@@@@@
@@@@@@@@&(((#####%###(((((((#####%%%%%((((((((####%%%%%%%%&%@%#((((((((@@@@@@(#(####%%%%%%@@@@@@@@@
@@@@@@@&(((@@@@@@@####(((((######%%%%%%##&########%%%%%#@@@@###(((((#(@@@@@@@@@@@###%%#@@@@@@@@@@@@
@@@#%&%(((@@@@@@@@#####(((#######%%%%@@@@@@@@@@@((##@@@@@@@@%###((((/@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@@#%%&%#@@@@@@@@@@############%%%%@@@@@@@@@@@@@@@@@@@@(@&&&&#####(#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@@@@@@@@@@@@@@@@@#%%%%%#((%%%%%%#@@@@@@@@@@@@@@@@@@@@(####%((((%#(@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@@@@@@@@@@@@@@@@@&%%%#((((((%%&@@@@@@@@@@@@@@@@@@@@@@###%%#((@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@@@@@@@@@@@@@@@@%%%%((((((((& @@@@@@@@@@@@@@@@@@@@@@@%%&%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@@@@@@@@@@@@@@@@%%(((((&#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@@@@@@@@@@@@@@@&((###@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@@@@@@@@@@@@@@@#####@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@@@@@@@@@@@@@@&####@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@@@@@@@@@@@@@&&%##@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@@@@@@@@@@@@@&&&%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@@@@@@@@@@@@@%##%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@@@@@@@@@@#%####%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
`);
  },
  sendTransaction: async function (from, action, gasPrice, value, factor) {
    let contractRegistry = await connect(action._parent.options.jsonInterface, action._parent._address);
    
    //NOTE this is a condition to verify if the transaction comes from a module or not. 
    if (contractRegistry.methods.hasOwnProperty('factory')) {
      let moduleAddress = await contractRegistry.methods.factory().call();
      let moduleRegistry = await connect(abis.moduleFactory(), moduleAddress)
      let parentModule = await moduleRegistry.methods.getName().call();
      let result = await checkPermission(web3.utils.hexToUtf8(parentModule), action._method.name, contractRegistry);
      if (!result) {
        console.log("You haven't the right permissions to execute this method.");
        process.exit(0);
      }
    }

    if (typeof factor === 'undefined') factor = 1.2;

    let block = await web3.eth.getBlock("latest");
    let networkGasLimit = block.gasLimit;

    let gas = Math.round(factor * (await action.estimateGas({ from: from.address, value: value})));
    if (gas > networkGasLimit) gas = networkGasLimit;
  
    console.log(chalk.black.bgYellowBright(`---- Transaction executed: ${action._method.name} - Gas limit provided: ${gas} ----`));    

    let nonce = await web3.eth.getTransactionCount(from.address);
    let abi = action.encodeABI();
    let parameter = {
      from: from.address,
      to: action._parent._address,
      data: abi,
      gasLimit: gas,
      gasPrice: gasPrice,
      nonce: nonce,
      value: web3.utils.toHex(value)
    };
    
    const transaction = new Tx(parameter);
    transaction.sign(Buffer.from(from.privateKey.replace('0x', ''), 'hex'));
    return await web3.eth.sendSignedTransaction('0x' + transaction.serialize().toString('hex'))
    .on('transactionHash', function(hash){
      console.log(`
  Your transaction is being processed. Please wait...
  TxHash: ${hash}`
      );
    })
    .on('receipt', function(receipt){
      console.log(`
  Congratulations! The transaction was successfully completed.
  Gas used: ${receipt.gasUsed} - Gas spent: ${web3.utils.fromWei((new web3.utils.BN(gasPrice)).mul(new web3.utils.BN(receipt.gasUsed)))} Ether
  Review it on Etherscan.
  TxHash: ${receipt.transactionHash}\n`
      );
    });
  },
  getEventFromLogs: function (jsonInterface, logs, eventName) {
    let eventJsonInterface = jsonInterface.find(o => o.name === eventName && o.type === 'event');
    let log = logs.find(l => l.topics.includes(eventJsonInterface.signature));
    return web3.eth.abi.decodeLog(eventJsonInterface.inputs, log.data, log.topics.slice(1));
  },
  getMultipleEventsFromLogs: function (jsonInterface, logs, eventName) {
    let eventJsonInterface = jsonInterface.find(o => o.name === eventName && o.type === 'event');
    let filteredLogs = logs.filter(l => l.topics.includes(eventJsonInterface.signature));
    return filteredLogs.map(l => web3.eth.abi.decodeLog(eventJsonInterface.inputs, l.data, l.topics.slice(1)));
  }
};
