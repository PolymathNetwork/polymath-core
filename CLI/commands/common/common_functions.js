const chalk = require('chalk');
const Tx = require('ethereumjs-tx');
const Web3 = require('web3');

module.exports = {
  initialize: async function (remoteNetwork) {
    if (typeof web3 === 'undefined' || typeof Issuer === 'undefined') {
      if (typeof remoteNetwork !== 'undefined') {
        web3 = new Web3(new Web3.providers.HttpProvider(`https://${remoteNetwork}.infura.io/`));
        privKey = require('fs').readFileSync('./privKey').toString();
        Issuer = await web3.eth.accounts.privateKeyToAccount("0x" + privKey);
      } else {
        web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
        let accounts = await web3.eth.getAccounts();
        Issuer = {
          address: accounts[0],
          privateKey: require('fs').readFileSync('./privKeyLocal').toString()
        };
      }
    }
  },
  getGasPrice: function (networkId) {
    let gasPrice;
    switch (networkId) {
      case 1: //Mainnet
        gasPrice = 4000000000;
        break;
      case 3: //Ropsten
        gasPrice = 50000000000;
        break;
      case 15: //Ganache
        gasPrice = 50000000000;
        break;
      case 42: //Kovan
        gasPrice = 50000000000;
        break;
      default:
        throw new Error('Network ID not identified');
    }

    return gasPrice;
  },
  estimateGas: async function (actionToEstimate, fromAddress, factor, value) {
    let estimatedGAS = Math.round(factor * (await actionToEstimate.estimateGas({ from: fromAddress, value: value})));
    console.log(chalk.black.bgYellowBright(`---- Transaction executed: ${actionToEstimate._method.name} - Gas limit provided: ${estimatedGAS} ----`));    
    return estimatedGAS;
  },
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
  sendTransaction: async function (from, action, gasPrice, value) {
    let gas = await this.estimateGas(action, from.address, 1.25, value);
    let nonce = await web3.eth.getTransactionCount(from.address);
    let abi = action.encodeABI();
    let parameter = {
      from: 0,
      to: action._parent._address,
      data: abi,
      gasLimit: gas,
      gasPrice: gasPrice,
      nonce: nonce,
      value: value
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
  }
};
