var readlineSync = require('readline-sync');
var chalk = require('chalk');
var moment = require('moment');
var common = require('./common/common_functions');
var contracts = require('./helpers/contract_addresses');
var abis = require('./helpers/contract_abis');
var gbl = require('./common/global');

// App flow
let tokenSymbol;
let securityToken;
let securityTokenRegistry;
let network;
let currentTransferManager;

async function executeApp() {
  let exit = false;
  while (!exit) {
    console.log('\n', chalk.blue('Transfer Manager - Main Menu', '\n'));

    let tmModules = await getAllModulesByType(gbl.constants.MODULES_TYPES.TRANSFER);
    let nonArchivedModules = tmModules.filter(m => !m.archived);
    if (nonArchivedModules.length > 0) {
      console.log(`Transfer Manager modules attached:`);
      nonArchivedModules.map(m => console.log(`- ${m.name} at ${m.address}`))
    } else {
      console.log(`There are no Transfer Manager modules attached`);
    }

    let options = ['Verify transfer', 'Transfer'];
    let forcedTransferDisabled = await securityToken.methods.controllerDisabled().call();
    if (!forcedTransferDisabled) {
      options.push('Forced transfers');
    }
    if (nonArchivedModules.length > 0) {
      options.push('Config existing modules');
    }
    options.push('Add new Transfer Manager module');

    let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'Exit' });
    let optionSelected = index != -1 ? options[index] : 'Exit';
    console.log('Selected:', optionSelected, '\n');
    switch (optionSelected) {
      case 'Verify transfer':
        let verifyTransferFrom = readlineSync.question(`Enter the sender account (${Issuer.address}): `, {
          limit: function (input) {
            return web3.utils.isAddress(input);
          },
          limitMessage: "Must be a valid address",
          defaultInput: Issuer.address
        });
        let verifyFromBalance = web3.utils.fromWei(await securityToken.methods.balanceOf(verifyTransferFrom).call());
        console.log(chalk.yellow(`Balance of ${verifyTransferFrom}: ${verifyFromBalance} ${tokenSymbol}`));
        let verifyTransferTo = readlineSync.question('Enter the receiver account: ', {
          limit: function (input) {
            return web3.utils.isAddress(input);
          },
          limitMessage: "Must be a valid address",
        });
        let verifyToBalance = web3.utils.fromWei(await securityToken.methods.balanceOf(verifyTransferTo).call());
        console.log(chalk.yellow(`Balance of ${verifyTransferTo}: ${verifyToBalance} ${tokenSymbol}`));
        let verifyTransferAmount = readlineSync.question('Enter amount of tokens to verify: ');
        let isVerified = await securityToken.methods.verifyTransfer(verifyTransferFrom, verifyTransferTo, web3.utils.toWei(verifyTransferAmount), web3.utils.fromAscii("")).call();
        if (isVerified) {
          console.log(chalk.green(`\n${verifyTransferAmount} ${tokenSymbol} can be transferred from ${verifyTransferFrom} to ${verifyTransferTo}!`));
        } else {
          console.log(chalk.red(`\n${verifyTransferAmount} ${tokenSymbol} can't be transferred from ${verifyTransferFrom} to ${verifyTransferTo}!`));
        }
        break;
      case 'Transfer':
        let fromBalance = web3.utils.fromWei(await securityToken.methods.balanceOf(Issuer.address).call());
        console.log(chalk.yellow(`Balance of ${Issuer.address}: ${fromBalance} ${tokenSymbol}`));
        let transferTo = readlineSync.question('Enter beneficiary of tranfer: ', {
          limit: function (input) {
            return web3.utils.isAddress(input);
          },
          limitMessage: "Must be a valid address"
        });
        let toBalance = web3.utils.fromWei(await securityToken.methods.balanceOf(transferTo).call());
        console.log(chalk.yellow(`Balance of ${transferTo}: ${toBalance} ${tokenSymbol}`));
        let transferAmount = readlineSync.question('Enter amount of tokens to transfer: ');
        let isTranferVerified = await securityToken.methods.verifyTransfer(Issuer.address, transferTo, web3.utils.toWei(transferAmount), web3.utils.fromAscii("")).call();
        if (isTranferVerified) {
          let transferAction = securityToken.methods.transfer(transferTo, web3.utils.toWei(transferAmount));
          let receipt = await common.sendTransaction(transferAction);
          let event = common.getEventFromLogs(securityToken._jsonInterface, receipt.logs, 'Transfer');
          console.log(chalk.green(`${event.from} transferred ${web3.utils.fromWei(event.value)} ${tokenSymbol} to ${event.to} successfully!`));
          console.log(`Balance of ${Issuer.address} after transfer: ${web3.utils.fromWei(await securityToken.methods.balanceOf(Issuer.address).call())} ${tokenSymbol}`);
          console.log(`Balance of ${transferTo} after transfer: ${web3.utils.fromWei(await securityToken.methods.balanceOf(transferTo).call())} ${tokenSymbol}`);
        } else {
          console.log(chalk.red(`Transfer failed at verification. Please review the transfer restrictions.`));
        }
        break;
      case 'Forced transfers':
        await forcedTransfers();
        break;
      case 'Config existing modules':
        await configExistingModules(nonArchivedModules);
        break;
      case 'Add new Transfer Manager module':
        await addTransferManagerModule();
        break;
      case 'Exit':
        exit = true;
        break
    }
  }
}

async function forcedTransfers() {
  let options = ['Disable controller', 'Set controller'];
  let controller = await securityToken.methods.controller().call();
  if (controller == Issuer.address) {
    options.push('Force Transfer');
  }
  let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'Return' });
  let optionSelected = index != -1 ? options[index] : 'Return';
  console.log('Selected:', optionSelected, '\n');
  switch (optionSelected) {
    case 'Disable controller':
      if (readlineSync.keyInYNStrict()) {
        let disableControllerAction = securityToken.methods.disableController();
        await common.sendTransaction(disableControllerAction);
        console.log(chalk.green(`Forced transfers have been disabled permanently`));
      }
      break;
    case 'Set controller':
      let controllerAddress = readlineSync.question(`Enter the address for the controller (${Issuer.address}): `, {
        limit: function (input) {
          return web3.utils.isAddress(input);
        },
        limitMessage: "Must be a valid address",
        defaultInput: Issuer.address
      });
      let setControllerAction = securityToken.methods.setController(controllerAddress);
      let setControllerReceipt = await common.sendTransaction(setControllerAction);
      let setControllerEvent = common.getEventFromLogs(securityToken._jsonInterface, setControllerReceipt.logs, 'SetController');
      console.log(chalk.green(`New controller is ${setControllerEvent._newController}`));
      break;
    case 'Force Transfer':
      let from = readlineSync.question('Enter the address from which to take tokens: ', {
        limit: function (input) {
          return web3.utils.isAddress(input);
        },
        limitMessage: "Must be a valid address",
      });
      let fromBalance = web3.utils.fromWei(await securityToken.methods.balanceOf(from).call());
      console.log(chalk.yellow(`Balance of ${from}: ${fromBalance} ${tokenSymbol}`));
      let to = readlineSync.question('Enter address where to send tokens: ', {
        limit: function (input) {
          return web3.utils.isAddress(input);
        },
        limitMessage: "Must be a valid address",
      });
      let toBalance = web3.utils.fromWei(await securityToken.methods.balanceOf(to).call());
      console.log(chalk.yellow(`Balance of ${to}: ${toBalance} ${tokenSymbol}`));
      let amount = readlineSync.question('Enter amount of tokens to transfer: ', {
        limit: function (input) {
          return parseInt(input) <= parseInt(fromBalance);
        },
        limitMessage: `Amount must be less or equal than ${fromBalance} ${tokenSymbol}`,
      });
      let data = readlineSync.question('Enter the data to indicate validation: ');
      let log = readlineSync.question('Enter the data attached to the transfer by controller to emit in event: ');
      let forceTransferAction = securityToken.methods.forceTransfer(from, to, web3.utils.toWei(amount), web3.utils.asciiToHex(data), web3.utils.asciiToHex(log));
      let forceTransferReceipt = await common.sendTransaction(forceTransferAction, { factor: 1.5 });
      let forceTransferEvent = common.getEventFromLogs(securityToken._jsonInterface, forceTransferReceipt.logs, 'ForceTransfer');
      console.log(chalk.green(`  ${forceTransferEvent._controller} has successfully forced a transfer of ${web3.utils.fromWei(forceTransferEvent._value)} ${tokenSymbol} 
  from ${forceTransferEvent._from} to ${forceTransferEvent._to} 
  Verified transfer: ${forceTransferEvent._verifyTransfer}
  Data: ${web3.utils.hexToAscii(forceTransferEvent._data)}
        `));
      console.log(`Balance of ${from} after transfer: ${web3.utils.fromWei(await securityToken.methods.balanceOf(from).call())} ${tokenSymbol}`);
      console.log(`Balance of ${to} after transfer: ${web3.utils.fromWei(await securityToken.methods.balanceOf(to).call())} ${tokenSymbol}`);
      break;
  }
}

async function configExistingModules(tmModules) {
  let options = tmModules.map(m => `${m.name} at ${m.address}`);
  let index = readlineSync.keyInSelect(options, 'Which module do you want to config? ', { cancel: 'Return' });
  console.log('Selected:', index != -1 ? options[index] : 'Return', '\n');
  let moduleNameSelected = tmModules[index].name;

  switch (moduleNameSelected) {
    case 'GeneralTransferManager':
      currentTransferManager = new web3.eth.Contract(abis.generalTransferManager(), tmModules[index].address);
      currentTransferManager.setProvider(web3.currentProvider);
      await generalTransferManager();
      break;
    case 'ManualApprovalTransferManager':
      currentTransferManager = new web3.eth.Contract(abis.manualApprovalTransferManager(), tmModules[index].address);
      currentTransferManager.setProvider(web3.currentProvider);
      await manualApprovalTransferManager();
      break;
    case 'PercentageTransferManager':
      //await percentageTransferManager();
      console.log(chalk.red(`
        *********************************
        This option is not yet available.
        *********************************`
      ));
      break;
    case 'CountTransferManager':
      //await countTransferManager();
      break;
    case 'SingleTradeVolumeRestrictionTM':
      //currentTransferManager = new web3.eth.Contract(abis.singleTradeVolumeRestrictionTM(), tmModules[index].address);
      //currentTransferManager.setProvider(web3.currentProvider);
      //await singleTradeVolumeRestrictionTM();
      console.log(chalk.red(`
        *********************************
        This option is not yet available.
        *********************************`
      ));
      break;
    case 'LookupVolumeRestrictionTM':
      //await lookupVolumeRestrictionTM();
      console.log(chalk.red(`
        *********************************
        This option is not yet available.
        *********************************`
      ));
      break;
  }
}

async function addTransferManagerModule() {
  let options = ['GeneralTransferManager', 'ManualApprovalTransferManager'/*, 'PercentageTransferManager', 
'CountTransferManager', 'SingleTradeVolumeRestrictionTM', 'LookupVolumeRestrictionTM'*/];

  let index = readlineSync.keyInSelect(options, 'Which Transfer Manager module do you want to add? ', { cancel: 'Return' });
  if (index != -1 && readlineSync.keyInYNStrict(`Are you sure you want to add ${options[index]} module?`)) {
    let bytes = web3.utils.fromAscii('', 16);
    switch (options[index]) {
      case 'PercentageTransferManager':
        console.log(chalk.red(`
          *********************************
          This option is not yet available.
          *********************************`
        ));
        break;
      case 'CountTransferManager':
        console.log(chalk.red(`
          *********************************
          This option is not yet available.
          *********************************`
        ));
        break;
      case 'SingleTradeVolumeRestrictionTM':
        /*
        let isTransferLimitInPercentage = !!readlineSync.keyInSelect(['In tokens', 'In percentage'], 'How do you want to set the transfer limit? ', {cancel: false});
        let globalTransferLimitInPercentageOrToken;
        if (isTransferLimitInPercentage) {
          globalTransferLimitInPercentageOrToken = toWeiPercentage(readlineSync.question('Enter the percentage for default limit: ', {
            limit: function(input) {
              return (parseInt(input) > 0 && parseInt(input) <= 100);
            },
            limitMessage: "Must be greater than 0 and less than 100"
          })); 
        } else {
          globalTransferLimitInPercentageOrToken = web3.utils.toWei(readlineSync.question('Enter the amount of tokens for default limit: ', {
            limit: function(input) {
              return parseInt(input) > 0;
            },
            limitMessage: "Must be greater than 0"
          })); 
        }
        let allowPrimaryIssuance = readlineSync.keyInYNStrict(`Do you want to allow all primary issuance transfers? `);
        bytes = web3.eth.abi.encodeFunctionCall( {
          name: 'configure',
          type: 'function',
          inputs: [
            {
              type: 'bool',
              name: '_isTransferLimitInPercentage'
            },{
              type: 'uint256',
              name: '_globalTransferLimitInPercentageOrToken'
            },{
              type: 'bool',
              name: '_isTransferLimitInPercentage'
            }
          ]
        }, [isTransferLimitInPercentage, globalTransferLimitInPercentageOrToken, allowPrimaryIssuance]);
      */
        console.log(chalk.red(`
          *********************************
          This option is not yet available.
          *********************************`
        ));
        break;
      case 'LookupVolumeRestrictionTM':
        console.log(chalk.red(`
          *********************************
          This option is not yet available.
          *********************************`
        ));
        break;
    }
    let selectedTMFactoryAddress = await contracts.getModuleFactoryAddressByName(securityToken.options.address, gbl.constants.MODULES_TYPES.TRANSFER, options[index]);
    let addModuleAction = securityToken.methods.addModule(selectedTMFactoryAddress, bytes, 0, 0);
    let receipt = await common.sendTransaction(addModuleAction);
    let event = common.getEventFromLogs(securityToken._jsonInterface, receipt.logs, 'ModuleAdded');
    console.log(chalk.green(`Module deployed at address: ${event._module}`));
  }
}

async function generalTransferManager() {
  console.log(chalk.blue(`General Transfer Manager at ${currentTransferManager.options.address}`), '\n');

  // Show current data
  let displayIssuanceAddress = await currentTransferManager.methods.issuanceAddress().call();
  let displaySigningAddress = await currentTransferManager.methods.signingAddress().call();
  let displayAllowAllTransfers = await currentTransferManager.methods.allowAllTransfers().call();
  let displayAllowAllWhitelistTransfers = await currentTransferManager.methods.allowAllWhitelistTransfers().call();
  let displayAllowAllWhitelistIssuances = await currentTransferManager.methods.allowAllWhitelistIssuances().call();
  let displayAllowAllBurnTransfers = await currentTransferManager.methods.allowAllBurnTransfers().call();

  console.log(`- Issuance address:                ${displayIssuanceAddress}`);
  console.log(`- Signing address:                 ${displaySigningAddress}`);
  console.log(`- Allow all transfers:             ${displayAllowAllTransfers ? `YES` : `NO`}`);
  console.log(`- Allow all whitelist transfers:   ${displayAllowAllWhitelistTransfers ? `YES` : `NO`}`);
  console.log(`- Allow all whitelist issuances:   ${displayAllowAllWhitelistIssuances ? `YES` : `NO`}`);
  console.log(`- Allow all burn transfers:        ${displayAllowAllBurnTransfers ? `YES` : `NO`}`);
  // ------------------

  let options = ['Modify whitelist', 'Modify whitelist from CSV', /*'Modify Whitelist Signed',*/
    `Change issuance address`, 'Change signing address'];
  if (displayAllowAllTransfers) {
    options.push('Disallow all transfers');
  } else {
    options.push('Allow all transfers');
  }
  if (displayAllowAllWhitelistTransfers) {
    options.push('Disallow all whitelist transfers');
  } else {
    options.push('Allow all whitelist transfers');
  }
  if (displayAllowAllWhitelistIssuances) {
    options.push('Disallow all whitelist issuances');
  } else {
    options.push('Allow all whitelist issuances');
  }
  if (displayAllowAllBurnTransfers) {
    options.push('Disallow all burn transfers');
  } else {
    options.push('Allow all burn transfers');
  }

  let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'Return' });
  let optionSelected = options[index];
  console.log('Selected:', index != -1 ? optionSelected : 'Return', '\n');
  switch (optionSelected) {
    case 'Modify whitelist':
      let investor = readlineSync.question('Enter the address to whitelist: ', {
        limit: function (input) {
          return web3.utils.isAddress(input);
        },
        limitMessage: "Must be a valid address"
      });
      let now = Math.floor(Date.now() / 1000);
      let fromTime = readlineSync.questionInt(`Enter the time (Unix Epoch time) when the sale lockup period ends and the investor can freely sell his tokens (now = ${now}): `, { defaultInput: now });
      let toTime = readlineSync.questionInt(`Enter the time (Unix Epoch time) when the purchase lockup period ends and the investor can freely purchase tokens from others (now = ${now}): `, { defaultInput: now });
      let oneHourFromNow = Math.floor(Date.now() / 1000 + 3600);
      let expiryTime = readlineSync.questionInt(`Enter the time till investors KYC will be validated (after that investor need to do re-KYC) (1 hour from now = ${oneHourFromNow}): `, { defaultInput: oneHourFromNow });
      let canBuyFromSTO = readlineSync.keyInYNStrict('Is the investor a restricted investor?');
      let modifyWhitelistAction = currentTransferManager.methods.modifyWhitelist(investor, fromTime, toTime, expiryTime, canBuyFromSTO);
      let modifyWhitelistReceipt = await common.sendTransaction(modifyWhitelistAction);
      let modifyWhitelistEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, modifyWhitelistReceipt.logs, 'ModifyWhitelist');
      console.log(chalk.green(`${modifyWhitelistEvent._investor} has been whitelisted sucessfully!`));
      break;
    case 'Modify whitelist from CSV':
      console.log(chalk.yellow(`Data is going to be read from 'data/whitelist_data.csv'. Be sure this file is updated!`));
      if (readlineSync.keyInYNStrict(`Do you want to continue?`)) {
        shell.exec(`${__dirname}/scripts/script.sh Whitelist ${tokenSymbol} 75 ${network}`);
      }
      break;
    /*
    case 'Modify Whitelist Signed':
      let investorSigned = readlineSync.question('Enter the address to whitelist: ', {
        limit: function(input) {
          return web3.utils.isAddress(input);
        },
        limitMessage: "Must be a valid address"
      }); 
      let fromTimeSigned = readlineSync.questionInt('Enter the time (Unix Epoch time) when the sale lockup period ends and the investor can freely sell his tokens: ');
      let toTimeSigned = readlineSync.questionInt('Enter the time (Unix Epoch time) when the purchase lockup period ends and the investor can freely purchase tokens from others: ');
      let expiryTimeSigned = readlineSync.questionInt('Enter the time till investors KYC will be validated (after that investor need to do re-KYC): ');
      let vSigned = readlineSync.questionInt('Enter v: ');
      let rSigned = readlineSync.question('Enter r: ');
      let sSigned = readlineSync.question('Enter s: ');
      let canBuyFromSTOSigned = readlineSync.keyInYNStrict('Is the investor a restricted investor?');
      let modifyWhitelistSignedAction = currentTransferManager.methods.modifyWhitelistSigned(investorSigned, fromTimeSigned, toTimeSigned, expiryTimeSigned, canBuyFromSTOSigned);
      let modifyWhitelistSignedReceipt = await common.sendTransaction(Issuer, modifyWhitelistSignedAction, defaultGasPrice);
      let modifyWhitelistSignedEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, modifyWhitelistSignedReceipt.logs, 'ModifyWhitelist');
      console.log(chalk.green(`${modifyWhitelistSignedEvent._investor} has been whitelisted sucessfully!`));
      break;
    */
    case 'Change issuance address':
      let issuanceAddress = readlineSync.question('Enter the new issuance address: ', {
        limit: function (input) {
          return web3.utils.isAddress(input);
        },
        limitMessage: "Must be a valid address"
      });
      let changeIssuanceAddressAction = currentTransferManager.methods.changeIssuanceAddress(issuanceAddress);
      let changeIssuanceAddressReceipt = await common.sendTransaction(changeIssuanceAddressAction);
      let changeIssuanceAddressEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, changeIssuanceAddressReceipt.logs, 'ChangeIssuanceAddress');
      console.log(chalk.green(`${changeIssuanceAddressEvent._issuanceAddress} is the new address for the issuance!`));
      break;
    case 'Change signing address':
      let signingAddress = readlineSync.question('Enter the new signing address: ', {
        limit: function (input) {
          return web3.utils.isAddress(input);
        },
        limitMessage: "Must be a valid address"
      });
      let changeSigningAddressAction = currentTransferManager.methods.changeSigningAddress(signingAddress);
      let changeSigningAddressReceipt = await common.sendTransaction(changeSigningAddressAction);
      let changeSigningAddressEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, changeSigningAddressReceipt.logs, 'ChangeSigningAddress');
      console.log(chalk.green(`${changeSigningAddressEvent._signingAddress} is the new address for the signing!`));
      break;
    case 'Allow all transfers':
    case 'Disallow all transfers':
      let changeAllowAllTransfersAction = currentTransferManager.methods.changeAllowAllTransfers(!displayAllowAllTransfers);
      let changeAllowAllTransfersReceipt = await common.sendTransaction(changeAllowAllTransfersAction);
      let changeAllowAllTransfersEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, changeAllowAllTransfersReceipt.logs, 'AllowAllTransfers');
      if (changeAllowAllTransfersEvent._allowAllTransfers) {
        console.log(chalk.green(`All transfers are allowed!`));
      } else {
        console.log(chalk.green(`Transfers are restricted!`));
      }
      break;
    case 'Allow all whitelist transfers':
    case 'Disallow all whitelist transfers':
      let changeAllowAllWhitelistTransfersAction = currentTransferManager.methods.changeAllowAllWhitelistTransfers(!displayAllowAllWhitelistTransfers);
      let changeAllowAllWhitelistTransfersReceipt = await common.sendTransaction(changeAllowAllWhitelistTransfersAction);
      let changeAllowAllWhitelistTransfersEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, changeAllowAllWhitelistTransfersReceipt.logs, 'AllowAllWhitelistTransfers');
      if (changeAllowAllWhitelistTransfersEvent._allowAllWhitelistTransfers) {
        console.log(chalk.green(`Time locks from whitelist are ignored for transfers!`));
      } else {
        console.log(chalk.green(`Transfers are restricted by time locks from whitelist!`));
      }
      break;
    case 'Allow all whitelist issuances':
    case 'Disallow all whitelist issuances':
      let changeAllowAllWhitelistIssuancesAction = currentTransferManager.methods.changeAllowAllWhitelistIssuances(!displayAllowAllWhitelistIssuances);
      let changeAllowAllWhitelistIssuancesReceipt = await common.sendTransaction(changeAllowAllWhitelistIssuancesAction);
      let changeAllowAllWhitelistIssuancesEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, changeAllowAllWhitelistIssuancesReceipt.logs, 'AllowAllWhitelistIssuances');
      if (changeAllowAllWhitelistIssuancesEvent._allowAllWhitelistIssuances) {
        console.log(chalk.green(`Time locks from whitelist are ignored for issuances!`));
      } else {
        console.log(chalk.green(`Issuances are restricted by time locks from whitelist!`));
      }
      break;
    case 'Allow all burn transfers':
    case 'Disallow all burn transfers':
      let changeAllowAllBurnTransfersAction = currentTransferManager.methods.changeAllowAllBurnTransfers(!displayAllowAllBurnTransfers);
      let changeAllowAllBurnTransfersReceipt = await common.sendTransaction(changeAllowAllBurnTransfersAction);
      let changeAllowAllBurnTransfersEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, changeAllowAllBurnTransfersReceipt.logs, 'AllowAllBurnTransfers');
      if (changeAllowAllBurnTransfersEvent._allowAllWhitelistTransfers) {
        console.log(chalk.green(`To burn tokens is allowed!`));
      } else {
        console.log(chalk.green(`The burning mechanism is deactivated!`));
      }
      break;
  }
}

async function manualApprovalTransferManager() {
  console.log(chalk.blue(`Manual Approval Transfer Manager at ${currentTransferManager.options.address}`), '\n');

  let options = ['Check manual approval', 'Add manual approval', 'Revoke manual approval',
    'Check manual blocking', 'Add manual blocking', 'Revoke manual blocking'];

  let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'Return' });
  let optionSelected = options[index];
  console.log('Selected:', index != -1 ? optionSelected : 'Return', '\n');
  let from;
  let to;
  switch (optionSelected) {
    case 'Check manual approval':
      from = readlineSync.question('Enter the address from which transfers would be approved: ', {
        limit: function (input) {
          return web3.utils.isAddress(input);
        },
        limitMessage: "Must be a valid address"
      });
      to = readlineSync.question('Enter the address to which transfers would be approved: ', {
        limit: function (input) {
          return web3.utils.isAddress(input);
        },
        limitMessage: "Must be a valid address"
      });
      console.log();
      let manualApproval = await getManualApproval(from, to);
      if (manualApproval) {
        console.log(`Manual approval found!`);
        console.log(`Allowance: ${web3.utils.fromWei(manualApproval.allowance)}`);
        console.log(`Expiry time: ${moment.unix(manualApproval.expiryTime).format('MMMM Do YYYY, HH:mm:ss')};`)
      } else {
        console.log(chalk.yellow(`There are no manual approvals from ${from} to ${to}.`));
      }
      break;
    case 'Add manual approval':
      from = readlineSync.question('Enter the address from which transfers will be approved: ', {
        limit: function (input) {
          return web3.utils.isAddress(input);
        },
        limitMessage: "Must be a valid address"
      });
      to = readlineSync.question('Enter the address to which transfers will be approved: ', {
        limit: function (input) {
          return web3.utils.isAddress(input);
        },
        limitMessage: "Must be a valid address"
      });
      if (!await getManualApproval(from, to)) {
        let allowance = readlineSync.question('Enter the amount of tokens which will be approved: ');
        let oneHourFromNow = Math.floor(Date.now() / 1000 + 3600);
        let expiryTime = readlineSync.questionInt(`Enter the time (Unix Epoch time) until which the transfer is allowed (1 hour from now = ${oneHourFromNow}): `, { defaultInput: oneHourFromNow });
        let addManualApprovalAction = currentTransferManager.methods.addManualApproval(from, to, web3.utils.toWei(allowance), expiryTime);
        let addManualApprovalReceipt = await common.sendTransaction(addManualApprovalAction);
        let addManualApprovalEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, addManualApprovalReceipt.logs, 'AddManualApproval');
        console.log(chalk.green(`Manual approval has been added successfully!`));
      } else {
        console.log(chalk.red(`A manual approval already exists from ${from} to ${to}. Revoke it first if you want to add a new one.`));
      }
      break;
    case 'Revoke manual approval':
      from = readlineSync.question('Enter the address from which transfers were approved: ', {
        limit: function (input) {
          return web3.utils.isAddress(input);
        },
        limitMessage: "Must be a valid address"
      });
      to = readlineSync.question('Enter the address to which transfers were approved: ', {
        limit: function (input) {
          return web3.utils.isAddress(input);
        },
        limitMessage: "Must be a valid address"
      });
      if (await getManualApproval(from, to)) {
        let revokeManualApprovalAction = currentTransferManager.methods.revokeManualApproval(from, to);
        let revokeManualApprovalReceipt = await common.sendTransaction(revokeManualApprovalAction);
        let revokeManualApprovalEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, revokeManualApprovalReceipt.logs, 'RevokeManualApproval');
        console.log(chalk.green(`Manual approval has been revoked successfully!`));
      } else {
        console.log(chalk.red(`Manual approval from ${from} to ${to} does not exist.`));
      }
      break;
    case 'Check manual blocking':
      from = readlineSync.question('Enter the address from which transfers would be blocked: ', {
        limit: function (input) {
          return web3.utils.isAddress(input);
        },
        limitMessage: "Must be a valid address"
      });
      to = readlineSync.question('Enter the address to which transfers would be blocked: ', {
        limit: function (input) {
          return web3.utils.isAddress(input);
        },
        limitMessage: "Must be a valid address"
      });
      console.log();
      let manualBlocking = await getManualBlocking(from, to);
      if (manualBlocking) {
        console.log(`Manual blocking found!`);
        console.log(`Expiry time: ${moment.unix(manualBlocking).format('MMMM Do YYYY, HH:mm:ss')};`)
      } else {
        console.log(chalk.yellow(`There are no manual blockings from ${from} to ${to}.`));
      }
      break;
    case 'Add manual blocking':
      from = readlineSync.question('Enter the address from which transfers will be blocked: ', {
        limit: function (input) {
          return web3.utils.isAddress(input);
        },
        limitMessage: "Must be a valid address"
      });
      to = readlineSync.question('Enter the address to which transfers will be blocked: ', {
        limit: function (input) {
          return web3.utils.isAddress(input);
        },
        limitMessage: "Must be a valid address"
      });
      if (!await getManualBlocking(from, to)) {
        let oneHourFromNow = Math.floor(Date.now() / 1000 + 3600);
        let expiryTime = readlineSync.questionInt(`Enter the time (Unix Epoch time) until which the transfer is blocked (1 hour from now = ${oneHourFromNow}): `, { defaultInput: oneHourFromNow });
        let addManualBlockingAction = currentTransferManager.methods.addManualBlocking(from, to, expiryTime);
        let addManualBlockingReceipt = await common.sendTransaction(addManualBlockingAction);
        let addManualBlockingEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, addManualBlockingReceipt.logs, 'AddManualBlocking');
        console.log(chalk.green(`Manual blocking has been added successfully!`));
      } else {
        console.log(chalk.red(`A manual blocking already exists from ${from} to ${to}. Revoke it first if you want to add a new one.`));
      }
      break;
    case 'Revoke manual blocking':
      from = readlineSync.question('Enter the address from which transfers were blocked: ', {
        limit: function (input) {
          return web3.utils.isAddress(input);
        },
        limitMessage: "Must be a valid address"
      });
      to = readlineSync.question('Enter the address to which transfers were blocked: ', {
        limit: function (input) {
          return web3.utils.isAddress(input);
        },
        limitMessage: "Must be a valid address"
      });
      if (await getManualBlocking(from, to)) {
        let revokeManualBlockingAction = currentTransferManager.methods.revokeManualBlocking(from, to);
        let revokeManualBlockingReceipt = await common.sendTransaction(revokeManualBlockingAction);
        let revokeManualBlockingEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, revokeManualBlockingReceipt.logs, 'RevokeManualBlocking');
        console.log(chalk.green(`Manual blocking has been revoked successfully!`));
      } else {
        console.log(chalk.red(`Manual blocking from ${from} to ${to} does not exist.`));
      }
      break;
  }
}

async function getManualApproval(_from, _to) {
  let result = null;

  let manualApproval = await currentTransferManager.methods.manualApprovals(_from, _to).call();
  if (manualApproval.expiryTime !== "0") {
    result = manualApproval;
  }

  return result;
}

async function getManualBlocking(_from, _to) {
  let result = null;

  let manualBlocking = await currentTransferManager.methods.manualBlockings(_from, _to).call();
  if (manualBlocking !== "0") {
    result = manualBlocking;
  }

  return result;
}

async function singleTradeVolumeRestrictionTM() {
  console.log(chalk.blue(`Single Trade Volume Restriction Transfer Manager at ${currentTransferManager.options.address}`));
  console.log();

  // Show current data
  let displayIsInPercentage = await currentTransferManager.methods.isTransferLimitInPercentage().call();
  let displayGlobalTransferLimit;
  if (displayIsInPercentage) {
    displayGlobalTransferLimit = fromWeiPercentage(await currentTransferManager.methods.globalTransferLimitInPercentage().call());
  } else {
    displayGlobalTransferLimit = web3.utils.fromWei(await currentTransferManager.methods.globalTransferLimitInTokens().call());
  }
  let displayAllowPrimaryIssuance = await currentTransferManager.methods.allowPrimaryIssuance().call();

  console.log(`- Limit type:                ${displayIsInPercentage ? `Percentage` : `Tokens`}`);
  console.log(`- Default transfer limit:    ${displayGlobalTransferLimit} ${displayIsInPercentage ? `%` : `${tokenSymbol}`}`);
  console.log(`- Allow primary issuance:    ${displayAllowPrimaryIssuance ? `YES` : `NO`}`);
  // ------------------

  let options = [];
  if (displayAllowPrimaryIssuance) {
    options.push('Disallow primary issuance');
  } else {
    options.push('Allow primary issuance');
  }
  options.push('Add exempted wallet', 'Remove exempted wallet');
  if (displayIsInPercentage) {
    options.push('Change transfer limit to tokens', 'Change default percentage limit',
      'Set percentage transfer limit per account', 'Remove percentage transfer limit per account');
  } else {
    options.push('Change transfer limit to percentage', 'Change default tokens limit',
      'Set tokens transfer limit per account', 'Remove tokens transfer limit per account');
  }

  let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'Return' });
  let optionSelected = options[index];
  console.log('Selected:', index != -1 ? optionSelected : 'Return', '\n');
  switch (optionSelected) {
    case 'Allow primary issuance':
    case 'Disallow primary issuance':
      let disallowPrimaryIssuanceAction = currentTransferManager.methods.setAllowPrimaryIssuance(!displayAllowPrimaryIssuance);
      await common.sendTransaction(disallowPrimaryIssuanceAction);
      break;
    case 'Add exempted wallet':
      let walletToExempt = readlineSync.question('Enter the wallet to exempt: ', {
        limit: function (input) {
          return web3.utils.isAddress(input);
        },
        limitMessage: "Must be a valid address"
      });
      let addExemptWalletAction = currentTransferManager.methods.addExemptWallet(walletToExempt);
      let addExemptWalletReceipt = await common.sendTransaction(addExemptWalletAction);
      let addExemptWalletEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, addExemptWalletReceipt.logs, 'ExemptWalletAdded');
      console.log(chalk.green(`${addExemptWalletEvent._wallet} has been exempted sucessfully!`));
      break;
    case 'Remove exempted wallet':
      let exemptedWallet = readlineSync.question('Enter the wallet to remove from exempt: ', {
        limit: function (input) {
          return web3.utils.isAddress(input);
        },
        limitMessage: "Must be a valid address"
      });
      let removeExemptWalletAction = currentTransferManager.methods.removeExemptWallet(exemptedWallet);
      let removeExemptWalletReceipt = await common.sendTransaction(removeExemptWalletAction);
      let removeExemptWalletEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, removeExemptWalletReceipt.logs, 'ExemptWalletRemoved');
      console.log(chalk.green(`${removeExemptWalletEvent._wallet} has been removed from exempt wallets sucessfully!`));
      break;
    case 'Change transfer limit to tokens':
      let newDefaultLimitInTokens = web3.utils.toWei(readlineSync.question('Enter the amount of tokens for default limit: ', {
        limit: function (input) {
          return parseInt(input) > 0;
        },
        limitMessage: "Must be greater than zero"
      }));
      let changeTransferLimitToTokensAction = currentTransferManager.methods.changeTransferLimitToTokens(newDefaultLimitInTokens);
      let changeTransferLimitToTokensReceipt = await common.sendTransaction(changeTransferLimitToTokensAction);
      let changeTransferLimitToTokensEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, changeTransferLimitToTokensReceipt.logs, 'GlobalTransferLimitInTokensSet');
      console.log(chalk.green(`Transfer limit has been set to tokens sucessfully!`));
      console.log(chalk.green(`The default transfer limit is ${web3.utils.fromWei(changeTransferLimitToTokensEvent._amount)} ${tokenSymbol}`));
      break;
    case 'Change transfer limit to percentage':
      let newDefaultLimitInPercentage = toWeiPercentage(readlineSync.question('Enter the percentage for default limit: ', {
        limit: function (input) {
          return (parseInt(input) > 0 && parseInt(input) <= 100);
        },
        limitMessage: "Must be greater than 0 and less than 100"
      }));
      let changeTransferLimitToPercentageAction = currentTransferManager.methods.changeTransferLimitToPercentage(newDefaultLimitInPercentage);
      let changeTransferLimitToPercentageReceipt = await common.sendTransaction(changeTransferLimitToPercentageAction);
      let changeTransferLimitToPercentageEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, changeTransferLimitToPercentageReceipt.logs, 'GlobalTransferLimitInPercentageSet');
      console.log(chalk.green(`Transfer limit has been set to tokens sucessfully!`));
      console.log(chalk.green(`The default transfer limit is ${fromWeiPercentage(changeTransferLimitToPercentageEvent._percentage)} %`));
      break;
    case 'Change default percentage limit':
      let defaultLimitInPercentage = toWeiPercentage(readlineSync.question('Enter the percentage for default limit: ', {
        limit: function (input) {
          return (parseInt(input) > 0 && parseInt(input) <= 100);
        },
        limitMessage: "Must be greater than 0 and less than 100"
      }));
      let changeGlobalLimitInPercentageAction = currentTransferManager.methods.changeGlobalLimitInPercentage(defaultLimitInPercentage);
      let changeGlobalLimitInPercentageReceipt = await common.sendTransaction(changeGlobalLimitInPercentageAction);
      let changeGlobalLimitInPercentageEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, changeGlobalLimitInPercentageReceipt.logs, 'GlobalTransferLimitInPercentageSet');
      console.log(chalk.green(`The default transfer limit is ${fromWeiPercentage(changeGlobalLimitInPercentageEvent._percentage)} %`));
      break;
    case 'Change default tokens limit':
      let defaultLimitInTokens = web3.utils.toWei(readlineSync.question('Enter the amount of tokens for default limit: ', {
        limit: function (input) {
          return parseInt(input) > 0;
        },
        limitMessage: "Must be greater than zero"
      }));
      let changeGlobalLimitInTokensAction = currentTransferManager.methods.changeGlobalLimitInTokens(defaultLimitInTokens);
      let changeGlobalLimitInTokensReceipt = await common.sendTransaction(changeGlobalLimitInTokensAction);
      let changeGlobalLimitInTokensEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, changeGlobalLimitInTokensReceipt.logs, 'GlobalTransferLimitInTokensSet');
      console.log(chalk.green(`The default transfer limit is ${web3.utils.fromWei(changeGlobalLimitInTokensEvent._amount)} ${tokenSymbol}`));
      break;
    case 'Set percentage transfer limit per account':
      let percentageAccount = readlineSync.question('Enter the wallet: ', {
        limit: function (input) {
          return web3.utils.isAddress(input);
        },
        limitMessage: "Must be a valid address"
      });
      let accountLimitInPercentage = toWeiPercentage(readlineSync.question(`Enter the transfer limit for ${percentageAccount} in percentage: `, {
        limit: function (input) {
          return (parseInt(input) > 0 && parseInt(input) <= 100);
        },
        limitMessage: "Must be greater than 0 and less than 100"
      }));
      let setTransferLimitInPercentageAction = currentTransferManager.methods.setTransferLimitInPercentage(percentageAccount, accountLimitInPercentage);
      let setTransferLimitInPercentageReceipt = await common.sendTransaction(setTransferLimitInPercentageAction);
      let setTransferLimitInPercentageEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, setTransferLimitInPercentageReceipt.logs, 'TransferLimitInPercentageSet');
      console.log(chalk.green(`The transfer limit for ${setTransferLimitInPercentageEvent._wallet} is ${fromWeiPercentage(setTransferLimitInPercentageEvent._percentage)} %`));
      break;
    case 'Set tokens transfer limit per account':
      let tokensAccount = readlineSync.question('Enter the wallet: ', {
        limit: function (input) {
          return web3.utils.isAddress(input);
        },
        limitMessage: "Must be a valid address"
      });
      let accountLimitInTokens = web3.utils.toWei(readlineSync.question(`Enter the transfer limit for ${tokensAccount} in amount of tokens: `, {
        limit: function (input) {
          return parseInt(input) > 0;
        },
        limitMessage: "Must be greater than zero"
      }));
      let setTransferLimitInTokensAction = currentTransferManager.methods.setTransferLimitInTokens(tokensAccount, accountLimitInTokens);
      let setTransferLimitInTokensReceipt = await common.sendTransaction(setTransferLimitInTokensAction);
      let setTransferLimitInTokensEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, setTransferLimitInTokensReceipt.logs, 'TransferLimitInTokensSet');
      console.log(chalk.green(`The transfer limit for ${setTransferLimitInTokensEvent._wallet} is ${web3.utils.fromWei(setTransferLimitInTokensEvent._amount)} ${tokenSymbol}`));
      break;
    case 'Remove percentage transfer limit per account':
      let percentageAccountToRemove = readlineSync.question('Enter the wallet to remove: ', {
        limit: function (input) {
          return web3.utils.isAddress(input);
        },
        limitMessage: "Must be a valid address"
      });
      let removeTransferLimitInPercentageAction = currentTransferManager.methods.removeTransferLimitInPercentage(percentageAccountToRemove);
      let removeTransferLimitInPercentageReceipt = await common.sendTransaction(removeTransferLimitInPercentageAction);
      let removeTransferLimitInPercentageEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, removeTransferLimitInPercentageReceipt.logs, 'TransferLimitInPercentageRemoved');
      console.log(chalk.green(`The transfer limit for ${removeTransferLimitInPercentageEvent._wallet} is the default limit`));
      break;
    case 'Remove tokens transfer limit per account':
      let tokensAccountToRemove = readlineSync.question('Enter the wallet to remove: ', {
        limit: function (input) {
          return web3.utils.isAddress(input);
        },
        limitMessage: "Must be a valid address"
      });
      let removeTransferLimitInTokensAction = currentTransferManager.methods.removeTransferLimitInTokens(tokensAccountToRemove);
      let removeTransferLimitInTokensReceipt = await common.sendTransaction(removeTransferLimitInTokensAction);
      let removeTransferLimitInTokensEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, removeTransferLimitInTokensReceipt.logs, 'TransferLimitInTokensRemoved');
      console.log(chalk.green(`The transfer limit for ${removeTransferLimitInTokensEvent._wallet} is the default limit`));
      break;
  }
}

/*
// Copied from tests
function signData(tmAddress, investorAddress, fromTime, toTime, expiryTime, restricted, validFrom, validTo, pk) {
  let packedData = ethers.utils
      .solidityKeccak256(
          ["address", "address", "uint256", "uint256", "uint256", "bool", "uint256", "uint256"],
          [tmAddress, investorAddress, fromTime, toTime, expiryTime, restricted, validFrom, validTo]
      )
      .slice(2);
  packedData = new Buffer(packedData, "hex");
  packedData = Buffer.concat([new Buffer(`\x19Ethereum Signed Message:\n${packedData.length.toString()}`), packedData]);
  packedData = web3.sha3(`0x${packedData.toString("hex")}`, { encoding: "hex" });
  return ethUtil.ecsign(new Buffer(packedData.slice(2), "hex"), new Buffer(pk, "hex"));
}
*/

function toWeiPercentage(number) {
  return new web3.utils.BN(web3.utils.toWei(number)).divn(100);
}

function fromWeiPercentage(number) {
  return web3.utils.fromWei(new web3.utils.BN(number).muln(100));
}

async function getAllModulesByType(type) {
  function ModuleInfo(_moduleType, _name, _address, _factoryAddress, _archived, _paused) {
    this.name = _name;
    this.type = _moduleType;
    this.address = _address;
    this.factoryAddress = _factoryAddress;
    this.archived = _archived;
    this.paused = _paused;
  }

  let modules = [];

  let allModules = await securityToken.methods.getModulesByType(type).call();

  for (let i = 0; i < allModules.length; i++) {
    let details = await securityToken.methods.getModule(allModules[i]).call();
    let nameTemp = web3.utils.hexToUtf8(details[0]);
    let pausedTemp = null;
    if (type == gbl.constants.MODULES_TYPES.STO || type == gbl.constants.MODULES_TYPES.TRANSFER) {
      let abiTemp = JSON.parse(require('fs').readFileSync(`./build/contracts/${nameTemp}.json`).toString()).abi;
      let contractTemp = new web3.eth.Contract(abiTemp, details[1]);
      pausedTemp = await contractTemp.methods.paused().call();
    }
    modules.push(new ModuleInfo(type, nameTemp, details[1], details[2], details[3], pausedTemp));
  }

  return modules;
}

async function initialize(_tokenSymbol) {
  welcome();
  await setup();
  if (typeof _tokenSymbol === 'undefined') {
    tokenSymbol = await selectToken();
  } else {
    tokenSymbol = _tokenSymbol;
  }
  let securityTokenAddress = await securityTokenRegistry.methods.getSecurityTokenAddress(tokenSymbol).call();
  if (securityTokenAddress == '0x0000000000000000000000000000000000000000') {
    console.log(chalk.red(`Selected Security Token ${tokenSymbol} does not exist.`));
    process.exit(0);
  }
  let securityTokenABI = abis.securityToken();
  securityToken = new web3.eth.Contract(securityTokenABI, securityTokenAddress);
  securityToken.setProvider(web3.currentProvider);
}

function welcome() {
  common.logAsciiBull();
  console.log("*********************************************");
  console.log("Welcome to the Command-Line Transfer Manager.");
  console.log("*********************************************");
  console.log("Issuer Account: " + Issuer.address + "\n");
}

async function setup() {
  try {
    let securityTokenRegistryAddress = await contracts.securityTokenRegistry();
    let securityTokenRegistryABI = abis.securityTokenRegistry();
    securityTokenRegistry = new web3.eth.Contract(securityTokenRegistryABI, securityTokenRegistryAddress);
    securityTokenRegistry.setProvider(web3.currentProvider);
  } catch (err) {
    console.log(err)
    console.log('\x1b[31m%s\x1b[0m', "There was a problem getting the contracts. Make sure they are deployed to the selected network.");
    process.exit(0);
  }
}

async function selectToken() {
  let result = null;

  let userTokens = await securityTokenRegistry.methods.getTokensByOwner(Issuer.address).call();
  let tokenDataArray = await Promise.all(userTokens.map(async function (t) {
    let tokenData = await securityTokenRegistry.methods.getSecurityTokenData(t).call();
    return { symbol: tokenData[0], address: t };
  }));
  let options = tokenDataArray.map(function (t) {
    return `${t.symbol} - Deployed at ${t.address}`;
  });
  options.push('Enter token symbol manually');

  let index = readlineSync.keyInSelect(options, 'Select a token:', { cancel: 'Exit' });
  switch (options[index]) {
    case 'Enter token symbol manually':
      result = readlineSync.question('Enter the token symbol: ');
      break;
    case 'Exit':
      process.exit();
      break;
    default:
      result = tokenDataArray[index].symbol;
      break;
  }

  return result;
}

module.exports = {
  executeApp: async function (_tokenSymbol) {
    await initialize(_tokenSymbol);
    return executeApp();
  }
}