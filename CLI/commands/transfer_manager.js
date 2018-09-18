var readlineSync = require('readline-sync');
var chalk = require('chalk');
var moment = require('moment');
var common = require('./common/common_functions');
var global = require('./common/global');
var contracts = require('./helpers/contract_addresses');
var abis = require('./helpers/contract_abis');

// App flow
let tokenSymbol;
let securityToken;
let tickerRegistry;
let securityTokenRegistry;

async function executeApp(remoteNetwork) {
  await global.initialize(remoteNetwork);
  
  common.logAsciiBull();
  console.log("*********************************************");
  console.log("Welcome to the Command-Line Transfer Manager.");
  console.log("*********************************************");
  console.log("Issuer Account: " + Issuer.address + "\n");

  await setup();
  try {
    await start_explorer();
  } catch (err) {
    console.log(err);
    return;
  }
};

async function setup(){
  try {
    let tickerRegistryAddress = await contracts.tickerRegistry();
    let tickerRegistryABI = abis.tickerRegistry();
    tickerRegistry = new web3.eth.Contract(tickerRegistryABI, tickerRegistryAddress);
    tickerRegistry.setProvider(web3.currentProvider);

    let securityTokenRegistryAddress = await contracts.securityTokenRegistry();
    let securityTokenRegistryABI = abis.securityTokenRegistry();
    securityTokenRegistry = new web3.eth.Contract(securityTokenRegistryABI, securityTokenRegistryAddress);
    securityTokenRegistry.setProvider(web3.currentProvider);
  } catch (err) {
    console.log(err)
    console.log('\x1b[31m%s\x1b[0m',"There was a problem getting the contracts. Make sure they are deployed to the selected network.");
    process.exit(0);
  }
}

async function start_explorer() {
  console.log('\n\x1b[34m%s\x1b[0m',"Transfer Manager - Main Menu");

  if (!tokenSymbol)
    tokenSymbol = readlineSync.question('Enter the token symbol: ');

  let result = await securityTokenRegistry.methods.getSecurityTokenAddress(tokenSymbol).call();
  if (result == "0x0000000000000000000000000000000000000000") {
    tokenSymbol = undefined;
    console.log(chalk.red(`Token symbol provided is not a registered Security Token.`));
  } else {
    let securityTokenABI = abis.securityToken();
    securityToken = new web3.eth.Contract(securityTokenABI,result);

    let forcedTransferDisabled = await securityToken.methods.controllerDisabled().call();

    if (!forcedTransferDisabled) {
      let options = ['Disable controller', 'Set controller'];
      let controller = await securityToken.methods.controller().call();
      if (controller == Issuer.address) {
        options.push('Force Transfer')
      }
      let index = readlineSync.keyInSelect(options, 'What do you want to do?');
      let optionSelected = options[index];
      console.log('Selected:', index != -1 ? optionSelected : 'Cancel', '\n');
      switch (optionSelected) {
        case 'Disable controller':
          if (readlineSync.keyInYNStrict()) { 
            let disableControllerAction = securityToken.methods.disableController();
            await common.sendTransaction(Issuer, disableControllerAction, defaultGasPrice);
            console.log(chalk.green(`Forced transfers have been disabled permanently`));
          }
        break;
        case 'Set controller':
          let controllerAddress =  readlineSync.question(`Enter the address for the controller (${Issuer.address}): `, {
            limit: function(input) {
              return web3.utils.isAddress(input);
            },
            limitMessage: "Must be a valid address",
            defaultInput: Issuer.address
          });
          let setControllerAction = securityToken.methods.setController(controllerAddress);
          let setControllerReceipt = await common.sendTransaction(Issuer, setControllerAction, defaultGasPrice);
          let setControllerEvent = common.getEventFromLogs(securityToken._jsonInterface, setControllerReceipt.logs, 'LogSetController');
          console.log(chalk.green(`New controller is ${setControllerEvent._newController}`));
        break;
        case 'Force Transfer':
          let from = readlineSync.question('Enter the address from which to take tokens: ', {
            limit: function(input) {
              return web3.utils.isAddress(input);
            },
            limitMessage: "Must be a valid address",
          });
          let fromBalance = web3.utils.fromWei(await securityToken.methods.balanceOf(from).call());
          console.log(chalk.yellow(`Balance of ${from}: ${fromBalance} ${tokenSymbol}`));
          let to = readlineSync.question('Enter address where to send tokens: ', {
            limit: function(input) {
              return web3.utils.isAddress(input);
            },
            limitMessage: "Must be a valid address",
          });
          let toBalance = web3.utils.fromWei(await securityToken.methods.balanceOf(to).call());
          console.log(chalk.yellow(`Balance of ${to}: ${toBalance} ${tokenSymbol}`));
          let amount = readlineSync.question('Enter amount of tokens to transfer: ', {
            limit: function(input) {
              return parseInt(input) <= parseInt(fromBalance);
            },
            limitMessage: `Amount must be less or equal than ${fromBalance} ${tokenSymbol}`,
          });
          let data = readlineSync.question('Enter the data attached to the transfer by controller to emit in event: ');
          let forceTransferAction = securityToken.methods.forceTransfer(from, to, web3.utils.toWei(amount), web3.utils.asciiToHex(data));
          let forceTransferReceipt = await common.sendTransaction(Issuer, forceTransferAction, defaultGasPrice, 0, 1.5);
          let forceTransferEvent = common.getEventFromLogs(securityToken._jsonInterface, forceTransferReceipt.logs, 'LogForceTransfer');
          console.log(chalk.green(`  ${forceTransferEvent._controller} has successfully forced a transfer of ${web3.utils.fromWei(forceTransferEvent._amount)} ${tokenSymbol} 
  from ${forceTransferEvent._from} to ${forceTransferEvent._to} 
  Verified transfer: ${forceTransferEvent._verifyTransfer}
  Data: ${web3.utils.hexToAscii(forceTransferEvent._data)}
          `));
          console.log(`Balance of ${from} after transfer: ${web3.utils.fromWei(await securityToken.methods.balanceOf(from).call())} ${tokenSymbol}`);
          console.log(`Balance of ${to} after transfer: ${web3.utils.fromWei(await securityToken.methods.balanceOf(to).call())} ${tokenSymbol}`);
          break;
          default:
            process.exit(0);
      }
    } else {
      console.log(chalk.red(`Controller featueres are permanently disabled for this token.`))
      tokenSymbol = undefined;
    }
  }

  //Restart
  await start_explorer();
}

module.exports = {
  executeApp: async function(type, remoteNetwork) {
    return executeApp(type, remoteNetwork);
  }
}