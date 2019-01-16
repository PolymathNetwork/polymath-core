const chalk = require('chalk');
const Tx = require('ethereumjs-tx');
const permissionsList = require('./permissions_list');
const abis = require('../helpers/contract_abis');

function connect(abi, address) {
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
    let securityToken = connect(abis.securityToken(), stAddress);
    let stOwner = await securityToken.methods.owner().call();
    if (stOwner == Issuer.address) {
      return true
    } else {
      let result = await securityToken.methods.checkPermission(Issuer.address, contractRegistry.options.address, web3.utils.asciiToHex(permission)).call();
      return result
    }
  }
};

function getFinalOptions(options) {
  if (typeof options != "object") {
    options = {}
  }
  const defaultOptions = {
    from: Issuer,
    gasPrice: defaultGasPrice,
    value: undefined,
    factor: 1.2,
    minNonce: 0
  }
  return Object.assign(defaultOptions, options)
};

async function getGasLimit(options, action) {
  let block = await web3.eth.getBlock('latest');
  let networkGasLimit = block.gasLimit;
  let gas = Math.round(options.factor * (await action.estimateGas({ from: options.from.address, value: options.value })));
  return (gas > networkGasLimit) ? networkGasLimit : gas;
}

async function checkPermissions(action) {
  let contractRegistry = await connect(action._parent.options.jsonInterface, action._parent._address);
  //NOTE this is a condition to verify if the transaction comes from a module or not.
  if (contractRegistry.methods.hasOwnProperty('factory')) {
    let moduleAddress = await contractRegistry.methods.factory().call();
    let moduleRegistry = await connect(abis.moduleFactory(), moduleAddress);
    let parentModule = await moduleRegistry.methods.getName().call();
    let result = await checkPermission(web3.utils.hexToUtf8(parentModule), action._method.name, contractRegistry);
    if (!result) {
      console.log("You haven't the right permissions to execute this method.");
      process.exit(0);
    }
  }
  return
}

module.exports = {
  convertToDaysRemaining: function (timeRemaining) {
    var seconds = parseInt(timeRemaining, 10);

    var days = Math.floor(seconds / (3600 * 24));
    seconds -= days * 3600 * 24;
    var hrs = Math.floor(seconds / 3600);
    seconds -= hrs * 3600;
    var mnts = Math.floor(seconds / 60);
    seconds -= mnts * 60;
    return (days + " days, " + hrs + " Hrs, " + mnts + " Minutes, " + seconds + " Seconds");
  },
  logAsciiBull: function () {
    console.log(`                                                                          
                                       /######%%,             /#(              
                                     ##########%%%%%,      ,%%%.      %        
                                  *#############%%%%%##%%%%%%#      ##         
                                (################%%%%#####%%%%//###%,          
                             .####################%%%%#########/               
                           (#########%%############%%%%%%%%%#%%%               
                       ,(%#%%%%%%%%%%%%############%%%%%%%###%%%.              
                  (######%%###%%%%%%%%##############%%%%%####%%%*              
                /#######%%%%######%%%%##########%###,.%######%%%(              
          #%%%%%#######%%%%%%###########%%%%%*######    /####%%%#              
         #.    ,%%####%%%%%%%(/#%%%%%%%%(    #%####        ,#%/                
     *#%(      .%%%##%%%%%%                 .%%%#*                             
               .%%%%#%%%%               .%%%###(                               
               %%%#####%                (%%.                                   
              #%###(,                                                          
             *#%#                                                              
             %%#                                                               
            *                                                                
            &%                                                                 
           %%%.                                                                                                                                                
`);
  },
  getNonce: async function (from) {
    return (await web3.eth.getTransactionCount(from.address, "pending"));
  },
  sendTransaction: async function (action, options) {
    await checkPermissions(action);

    options = getFinalOptions(options);
    let gasLimit = await getGasLimit(options, action);

    console.log(chalk.black.bgYellowBright(`---- Transaction executed: ${action._method.name} - Gas limit provided: ${gasLimit} ----`));

    let nonce = await web3.eth.getTransactionCount(options.from.address);
    if (nonce < options.minNonce) {
      nonce = minNonce;
    }
    let abi = action.encodeABI();
    let parameter = {
      from: options.from.address,
      to: action._parent._address,
      data: abi,
      gasLimit: gasLimit,
      gasPrice: options.gasPrice,
      nonce: nonce,
      value: web3.utils.toHex(options.value)
    };

    const transaction = new Tx(parameter);
    transaction.sign(Buffer.from(options.from.privateKey.replace('0x', ''), 'hex'));
    return await web3.eth.sendSignedTransaction('0x' + transaction.serialize().toString('hex'))
      .on('transactionHash', function (hash) {
        console.log(`
  Your transaction is being processed. Please wait...
  TxHash: ${hash}`
        );
      })
      .on('receipt', function (receipt) {
        console.log(`
  Congratulations! The transaction was successfully completed.
  Gas used: ${receipt.gasUsed} - Gas spent: ${web3.utils.fromWei((new web3.utils.BN(options.gasPrice)).mul(new web3.utils.BN(receipt.gasUsed)))} Ether
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
  },
  connect: function (abi, address) {
    return connect(abi, address)
  },
  splitIntoBatches: function (data, batchSize) {
    let allBatches = [];
    for (let index = 0; index < data.length; index += parseInt(batchSize)) {
      allBatches.push(data.slice(index, index + parseInt(batchSize)));
    }
    return allBatches;
  },
  transposeBatches: function (batches) {
    let result = [];
    if (batches.length > 0 && batches[0].length > 0) {
      let columns = batches[0][0].length;
      for (let index = 0; index < columns; index++) {
        result[index] = batches.map(batch => batch.map(record => record[index]));
      }
    }
    return result;
  }
};
