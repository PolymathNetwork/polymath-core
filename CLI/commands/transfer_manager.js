const readlineSync = require('readline-sync');
const chalk = require('chalk');
const moment = require('moment');
const common = require('./common/common_functions');
const contracts = require('./helpers/contract_addresses');
const abis = require('./helpers/contract_abis');
const gbl = require('./common/global');
const csvParse = require('./helpers/csv');
const { table } = require('table')

///////////////////
// Constants
const WHITELIST_DATA_CSV = './CLI/data/Transfer/GTM/whitelist_data.csv';
const PERCENTAGE_WHITELIST_DATA_CSV = './CLI/data/Transfer/PercentageTM/whitelist_data.csv';

const RESTRICTION_TYPES = ['Fixed', 'Percentage'];

// App flow
let tokenSymbol;
let securityToken;
let securityTokenRegistry;
let moduleRegistry;
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
        let verifyTotalSupply = web3.utils.fromWei(await securityToken.methods.totalSupply().call());
        await logTotalInvestors();
        let verifyTransferFrom = readlineSync.question(`Enter the sender account (${Issuer.address}): `, {
          limit: function (input) {
            return web3.utils.isAddress(input);
          },
          limitMessage: "Must be a valid address",
          defaultInput: Issuer.address
        });
        await logBalance(verifyTransferFrom, verifyTotalSupply);
        let verifyTransferTo = readlineSync.question('Enter the receiver account: ', {
          limit: function (input) {
            return web3.utils.isAddress(input);
          },
          limitMessage: "Must be a valid address",
        });
        await logBalance(verifyTransferTo, verifyTotalSupply);
        let verifyTransferAmount = readlineSync.question('Enter amount of tokens to verify: ');
        let isVerified = await securityToken.methods.verifyTransfer(verifyTransferFrom, verifyTransferTo, web3.utils.toWei(verifyTransferAmount), web3.utils.fromAscii("")).call();
        if (isVerified) {
          console.log(chalk.green(`\n${verifyTransferAmount} ${tokenSymbol} can be transferred from ${verifyTransferFrom} to ${verifyTransferTo}!`));
        } else {
          console.log(chalk.red(`\n${verifyTransferAmount} ${tokenSymbol} can't be transferred from ${verifyTransferFrom} to ${verifyTransferTo}!`));
        }
        break;
      case 'Transfer':
        let totalSupply = web3.utils.fromWei(await securityToken.methods.totalSupply().call());
        await logTotalInvestors();
        await logBalance(Issuer.address, totalSupply);
        let transferTo = readlineSync.question('Enter beneficiary of tranfer: ', {
          limit: function (input) {
            return web3.utils.isAddress(input);
          },
          limitMessage: "Must be a valid address"
        });
        await logBalance(transferTo, totalSupply);
        let transferAmount = readlineSync.question('Enter amount of tokens to transfer: ');
        let isTranferVerified = await securityToken.methods.verifyTransfer(Issuer.address, transferTo, web3.utils.toWei(transferAmount), web3.utils.fromAscii("")).call();
        if (isTranferVerified) {
          let transferAction = securityToken.methods.transfer(transferTo, web3.utils.toWei(transferAmount));
          let receipt = await common.sendTransaction(transferAction);
          let event = common.getEventFromLogs(securityToken._jsonInterface, receipt.logs, 'Transfer');
          console.log(chalk.green(`${event.from} transferred ${web3.utils.fromWei(event.value)} ${tokenSymbol} to ${event.to} successfully!`));
          await logTotalInvestors();
          await logBalance(Issuer.address, totalSupply);
          await logBalance(transferTo, totalSupply);
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
  let moduleNameSelected = index != -1 ? tmModules[index].name : 'Return';

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
    case 'CountTransferManager':
      currentTransferManager = new web3.eth.Contract(abis.countTransferManager(), tmModules[index].address);
      currentTransferManager.setProvider(web3.currentProvider);
      await countTransferManager();
      break;
    case 'PercentageTransferManager':
      currentTransferManager = new web3.eth.Contract(abis.percentageTransferManager(), tmModules[index].address);
      currentTransferManager.setProvider(web3.currentProvider);
      await percentageTransferManager();
      break;
    case 'VolumeRestrictionTM':
      currentTransferManager = new web3.eth.Contract(abis.volumeRestrictionTM(), tmModules[index].address);
      currentTransferManager.setProvider(web3.currentProvider);
      await volumeRestrictionTM();
      break;
  }
}

async function addTransferManagerModule() {
  let availableModules = await moduleRegistry.methods.getModulesByTypeAndToken(gbl.constants.MODULES_TYPES.TRANSFER, securityToken.options.address).call();
  let options = await Promise.all(availableModules.map(async function (m) {
    let moduleFactoryABI = abis.moduleFactory();
    let moduleFactory = new web3.eth.Contract(moduleFactoryABI, m);
    return web3.utils.hexToUtf8(await moduleFactory.methods.name().call());
  }));

  let index = readlineSync.keyInSelect(options, 'Which Transfer Manager module do you want to add? ', { cancel: 'Return' });
  if (index != -1 && readlineSync.keyInYNStrict(`Are you sure you want to add ${options[index]} module?`)) {
    let bytes = web3.utils.fromAscii('', 16);
    switch (options[index]) {
      case 'CountTransferManager':
        let maxHolderCount = readlineSync.question('Enter the maximum no. of holders the SecurityToken is allowed to have: ');
        let configureCountTM = abis.countTransferManager().find(o => o.name === 'configure' && o.type === 'function');
        bytes = web3.eth.abi.encodeFunctionCall(configureCountTM, [maxHolderCount]);
        break;
      case 'PercentageTransferManager':
        let maxHolderPercentage = toWeiPercentage(readlineSync.question('Enter the maximum amount of tokens in percentage that an investor can hold: ', {
          limit: function (input) {
            return (parseInt(input) > 0 && parseInt(input) <= 100);
          },
          limitMessage: "Must be greater than 0 and less than 100"
        }));
        let allowPercentagePrimaryIssuance = readlineSync.keyInYNStrict(`Do you want to ignore transactions which are part of the primary issuance? `);
        let configurePercentageTM = abis.percentageTransferManager().find(o => o.name === 'configure' && o.type === 'function');
        bytes = web3.eth.abi.encodeFunctionCall(configurePercentageTM, [maxHolderPercentage, allowPercentagePrimaryIssuance]);
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
  let displayDefaults = await currentTransferManager.methods.defaults().call();
  let displayInvestors = await currentTransferManager.methods.getInvestors().call();

  console.log(`- Issuance address:                ${displayIssuanceAddress}`);
  console.log(`- Signing address:                 ${displaySigningAddress}`);
  console.log(`- Allow all transfers:             ${displayAllowAllTransfers ? `YES` : `NO`}`);
  console.log(`- Allow all whitelist transfers:   ${displayAllowAllWhitelistTransfers ? `YES` : `NO`}`);
  console.log(`- Allow all whitelist issuances:   ${displayAllowAllWhitelistIssuances ? `YES` : `NO`}`);
  console.log(`- Allow all burn transfers:        ${displayAllowAllBurnTransfers ? `YES` : `NO`}`);
  console.log(`- Default times:`);
  console.log(`   - From time:                    ${displayDefaults.fromTime} (${moment.unix(displayDefaults.fromTime).format('MMMM Do YYYY, HH:mm:ss')})`);
  console.log(`   - To time:                      ${displayDefaults.toTime} (${moment.unix(displayDefaults.toTime).format('MMMM Do YYYY, HH:mm:ss')})`);
  console.log(`- Investors:                       ${displayInvestors.length}`);
  // ------------------

  let options = [];
  if (displayInvestors.length > 0) {
    options.push(`Show investors`, `Show whitelist data`);
  }
  options.push('Modify whitelist', 'Modify whitelist from CSV', /*'Modify Whitelist Signed',*/
    'Change the default times used when they are zero', `Change issuance address`, 'Change signing address');

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
    case `Show investors`:
      console.log('***** List of investors on whitelist *****');
      displayInvestors.map(i => console.log(i));
      break;
    case `Show whitelist data`:
      let investorsToShow = readlineSync.question(`Enter the addresses of the investors you want to show (i.e: addr1,addr2,addr3) or leave empty to show them all: `, {
        limit: function (input) {
          return input === '' || input.split(",").every(a => web3.utils.isAddress(a));
        },
        limitMessage: `All addresses must be valid`
      });
      if (investorsToShow === '') {
        let whitelistData = await currentTransferManager.methods.getAllInvestorsData().call();
        showWhitelistTable(whitelistData[0], whitelistData[1], whitelistData[2], whitelistData[3], whitelistData[4]);
      } else {
        let investorsArray = investorsToShow.split(',');
        let whitelistData = await currentTransferManager.methods.getInvestorsData(investorsArray).call();
        showWhitelistTable(investorsArray, whitelistData[0], whitelistData[1], whitelistData[2], whitelistData[3]);
      }
      break;
    case 'Change the default times used when they are zero':
      let fromTimeDefault = readlineSync.questionInt(`Enter the default time (Unix Epoch time) used when fromTime is zero: `);
      let toTimeDefault = readlineSync.questionInt(`Enter the default time (Unix Epoch time) used when fromTime is zero: `);
      let changeDefaultsAction = currentTransferManager.methods.changeDefaults(fromTimeDefault, toTimeDefault);
      let changeDefaultsReceipt = await common.sendTransaction(changeDefaultsAction);
      let changeDefaultsEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, changeDefaultsReceipt.logs, 'ChangeDefaults');
      console.log(chalk.green(`Default times have been updated successfully!`));
      break;
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
      let expiryTime = readlineSync.questionInt(`Enter the time till investors KYC will be validated (after that investor need to do re - KYC) (1 hour from now = ${oneHourFromNow}): `, { defaultInput: oneHourFromNow });
      let canBuyFromSTO = readlineSync.keyInYNStrict('Is the investor a restricted investor?');
      let modifyWhitelistAction = currentTransferManager.methods.modifyWhitelist(investor, fromTime, toTime, expiryTime, canBuyFromSTO);
      let modifyWhitelistReceipt = await common.sendTransaction(modifyWhitelistAction);
      let modifyWhitelistEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, modifyWhitelistReceipt.logs, 'ModifyWhitelist');
      console.log(chalk.green(`${modifyWhitelistEvent._investor} has been whitelisted sucessfully!`));
      break;
    case 'Modify whitelist from CSV':
      await modifyWhitelistInBatch();
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
      console.log(chalk.green(`${ modifyWhitelistSignedEvent._investor } has been whitelisted sucessfully!`));
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

function showWhitelistTable(investorsArray, fromTimeArray, toTimeArray, expiryTimeArray, canBuyFromSTOArray) {
  let dataTable = [['Investor', 'From time', 'To time', 'KYC expiry date', 'Restricted']];
  for (let i = 0; i < investorsArray.length; i++) {
    dataTable.push([
      investorsArray[i],
      moment.unix(fromTimeArray[i]).format('MM/DD/YYYY HH:mm'),
      moment.unix(toTimeArray[i]).format('MM/DD/YYYY HH:mm'),
      moment.unix(expiryTimeArray[i]).format('MM/DD/YYYY HH:mm'),
      canBuyFromSTOArray[i] ? 'YES' : 'NO'
    ]);
  }
  console.log();
  console.log(table(dataTable));
}

async function modifyWhitelistInBatch() {
  let csvFilePath = readlineSync.question(`Enter the path for csv data file (${WHITELIST_DATA_CSV}): `, {
    defaultInput: WHITELIST_DATA_CSV
  });
  let batchSize = readlineSync.question(`Enter the max number of records per transaction or batch size (${gbl.constants.DEFAULT_BATCH_SIZE}): `, {
    limit: function (input) {
      return parseInt(input) > 0;
    },
    limitMessage: 'Must be greater than 0',
    defaultInput: gbl.constants.DEFAULT_BATCH_SIZE
  });
  let parsedData = csvParse(csvFilePath);
  let validData = parsedData.filter(row =>
    web3.utils.isAddress(row[0]) &&
    moment.unix(row[1]).isValid() &&
    moment.unix(row[2]).isValid() &&
    moment.unix(row[3]).isValid() &&
    typeof row[4] === 'boolean'
  );
  let invalidRows = parsedData.filter(row => !validData.includes(row));
  if (invalidRows.length > 0) {
    console.log(chalk.red(`The following lines from csv file are not valid: ${invalidRows.map(r => parsedData.indexOf(r) + 1).join(',')} `));
  }
  let batches = common.splitIntoBatches(validData, batchSize);
  let [investorArray, fromTimesArray, toTimesArray, expiryTimeArray, canBuyFromSTOArray] = common.transposeBatches(batches);
  for (let batch = 0; batch < batches.length; batch++) {
    console.log(`Batch ${batch + 1} - Attempting to modify whitelist to accounts: \n\n`, investorArray[batch], '\n');
    let action = await currentTransferManager.methods.modifyWhitelistMulti(investorArray[batch], fromTimesArray[batch], toTimesArray[batch], expiryTimeArray[batch], canBuyFromSTOArray[batch]);
    let receipt = await common.sendTransaction(action);
    console.log(chalk.green('Modify whitelist transaction was successful.'));
    console.log(`${receipt.gasUsed} gas used.Spent: ${web3.utils.fromWei((new web3.utils.BN(receipt.gasUsed)).mul(new web3.utils.BN(defaultGasPrice)))} ETH`);
  }
}

async function manualApprovalTransferManager() {
  console.log(chalk.blue(`Manual Approval Transfer Manager at ${currentTransferManager.options.address} `), '\n');

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
        console.log(`Expiry time: ${moment.unix(manualApproval.expiryTime).format('MMMM Do YYYY, HH:mm:ss')}`);
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
        console.log(chalk.red(`A manual approval already exists from ${from} to ${to}.Revoke it first if you want to add a new one.`));
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
        console.log(`Expiry time: ${moment.unix(manualBlocking).format('MMMM Do YYYY, HH:mm:ss')}; `)
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
        console.log(chalk.red(`A manual blocking already exists from ${from} to ${to}.Revoke it first if you want to add a new one.`));
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

async function countTransferManager() {
  console.log(chalk.blue(`Count Transfer Manager at ${currentTransferManager.options.address}`), '\n');

  // Show current data
  let displayMaxHolderCount = await currentTransferManager.methods.maxHolderCount().call();

  console.log(`- Max holder count:        ${displayMaxHolderCount}`);

  let options = ['Change max holder count']
  let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'Return' });
  let optionSelected = options[index];
  console.log('Selected:', index != -1 ? optionSelected : 'Return', '\n');
  switch (optionSelected) {
    case 'Change max holder count':
      let maxHolderCount = readlineSync.question('Enter the maximum no. of holders the SecurityToken is allowed to have: ');
      let changeHolderCountAction = currentTransferManager.methods.changeHolderCount(maxHolderCount);
      let changeHolderCountReceipt = await common.sendTransaction(changeHolderCountAction);
      let changeHolderCountEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, changeHolderCountReceipt.logs, 'ModifyHolderCount');
      console.log(chalk.green(`Max holder count has been set to ${changeHolderCountEvent._newHolderCount} sucessfully!`));
      break;
  }
}

async function percentageTransferManager() {
  console.log(chalk.blue(`Percentage Transfer Manager at ${currentTransferManager.options.address}`), '\n');

  // Show current data
  let displayMaxHolderPercentage = await currentTransferManager.methods.maxHolderPercentage().call();
  let displayAllowPrimaryIssuance = await currentTransferManager.methods.allowPrimaryIssuance().call();

  console.log(`- Max holder percentage:   ${fromWeiPercentage(displayMaxHolderPercentage)}%`);
  console.log(`- Allow primary issuance:  ${displayAllowPrimaryIssuance ? `YES` : `NO`}`);

  let options = ['Change max holder percentage', 'Check if investor is whitelisted', 'Modify whitelist', 'Modify whitelist from CSV'];
  if (displayAllowPrimaryIssuance) {
    options.push('Disallow primary issuance');
  } else {
    options.push('Allow primary issuance');
  }
  let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'Return' });
  let optionSelected = options[index];
  console.log('Selected:', index != -1 ? optionSelected : 'Return', '\n');
  switch (optionSelected) {
    case 'Change max holder percentage':
      let maxHolderPercentage = toWeiPercentage(readlineSync.question('Enter the maximum amount of tokens in percentage that an investor can hold: ', {
        limit: function (input) {
          return (parseInt(input) > 0 && parseInt(input) <= 100);
        },
        limitMessage: "Must be greater than 0 and less than 100"
      }));
      let changeHolderPercentageAction = currentTransferManager.methods.changeHolderPercentage(maxHolderPercentage);
      let changeHolderPercentageReceipt = await common.sendTransaction(changeHolderPercentageAction);
      let changeHolderPercentageEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, changeHolderPercentageReceipt.logs, 'ModifyHolderPercentage');
      console.log(chalk.green(`Max holder percentage has been set to ${fromWeiPercentage(changeHolderPercentageEvent._newHolderPercentage)} successfully!`));
      break;
    case 'Check if investor is whitelisted':
      let investorToCheck = readlineSync.question('Enter the address of the investor: ', {
        limit: function (input) {
          return web3.utils.isAddress(input);
        },
        limitMessage: "Must be a valid address"
      });
      let isWhitelisted = await currentTransferManager.methods.whitelist(investorToCheck).call();
      if (isWhitelisted) {
        console.log(chalk.green(`${investorToCheck} is whitelisted!`));
      } else {
        console.log(chalk.yellow(`${investorToCheck} is not whitelisted!`));
      }
      break;
    case 'Modify whitelist':
      let valid = !!readlineSync.keyInSelect(['Remove investor from whitelist', 'Add investor to whitelist'], 'How do you want to do? ', { cancel: false });
      let investorToWhitelist = readlineSync.question('Enter the address of the investor: ', {
        limit: function (input) {
          return web3.utils.isAddress(input);
        },
        limitMessage: "Must be a valid address"
      });
      let modifyWhitelistAction = currentTransferManager.methods.modifyWhitelist(investorToWhitelist, valid);
      let modifyWhitelistReceipt = await common.sendTransaction(modifyWhitelistAction);
      let modifyWhitelistEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, modifyWhitelistReceipt.logs, 'ModifyWhitelist');
      if (modifyWhitelistEvent._valid) {
        console.log(chalk.green(`${modifyWhitelistEvent._investor} has been added to the whitelist sucessfully!`));
      } else {
        console.log(chalk.green(`${modifyWhitelistEvent._investor} has been removed from the whitelist sucessfully!`));
      }
      break;
    case 'Modify whitelist from CSV':
      let csvFilePath = readlineSync.question(`Enter the path for csv data file (${PERCENTAGE_WHITELIST_DATA_CSV}): `, {
        defaultInput: PERCENTAGE_WHITELIST_DATA_CSV
      });
      let batchSize = readlineSync.question(`Enter the max number of records per transaction or batch size (${gbl.constants.DEFAULT_BATCH_SIZE}): `, {
        limit: function (input) {
          return parseInt(input) > 0;
        },
        limitMessage: 'Must be greater than 0',
        defaultInput: gbl.constants.DEFAULT_BATCH_SIZE
      });
      let parsedData = csvParse(csvFilePath);
      let validData = parsedData.filter(row => web3.utils.isAddress(row[0]) && typeof row[1] === 'boolean');
      let invalidRows = parsedData.filter(row => !validData.includes(row));
      if (invalidRows.length > 0) {
        console.log(chalk.red(`The following lines from csv file are not valid: ${invalidRows.map(r => parsedData.indexOf(r) + 1).join(',')}`));
      }
      let batches = common.splitIntoBatches(validData, batchSize);
      let [investorArray, isWhitelistedArray] = common.transposeBatches(batches);
      for (let batch = 0; batch < batches.length; batch++) {
        console.log(`Batch ${batch + 1} - Attempting to modify whitelist accounts:\n\n`, investorArray[batch], '\n');
        let action = await currentTransferManager.methods.modifyWhitelistMulti(investorArray[batch], isWhitelistedArray[batch]);
        let receipt = await common.sendTransaction(action);
        console.log(chalk.green('Modify whitelist transaction was successful.'));
        console.log(`${receipt.gasUsed} gas used. Spent: ${web3.utils.fromWei((new web3.utils.BN(receipt.gasUsed)).mul(new web3.utils.BN(defaultGasPrice)))} ETH`);
      }
      break;
    case 'Allow primary issuance':
    case 'Disallow primary issuance':
      let setAllowPrimaryIssuanceAction = currentTransferManager.methods.setAllowPrimaryIssuance(!displayAllowPrimaryIssuance);
      let setAllowPrimaryIssuanceReceipt = await common.sendTransaction(setAllowPrimaryIssuanceAction);
      let setAllowPrimaryIssuanceEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, setAllowPrimaryIssuanceReceipt.logs, 'SetAllowPrimaryIssuance');
      if (setAllowPrimaryIssuanceEvent._allowPrimaryIssuance) {
        console.log(chalk.green(`Transactions which are part of the primary issuance will be ignored!`));
      } else {
        console.log(chalk.green(`Transactions which are part of the primary issuance will NOT be ignored!`));
      }
      break;

  }
}

async function volumeRestrictionTM() {
  console.log('\n', chalk.blue(`Volume Restriction Transfer Manager at ${currentTransferManager.options.address}`, '\n'));

  let defaultDailyRestriction = await currentTransferManager.methods.defaultDailyRestriction().call();
  let hasDefaultDailyRestriction = parseInt(defaultDailyRestriction.startTime) !== 0;
  let defaultRestriction = await currentTransferManager.methods.defaultRestriction().call();
  let hasDefaultRestriction = parseInt(defaultRestriction.startTime) !== 0;

  console.log(`- Default daily restriction:     ${hasDefaultDailyRestriction ? '' : 'None'}`);
  if (hasDefaultDailyRestriction) {
    console.log(`     Type:                         ${RESTRICTION_TYPES[defaultDailyRestriction.typeOfRestriction]}`);
    console.log(`     Allowed tokens:               ${defaultDailyRestriction.typeOfRestriction === "0" ? `${web3.utils.fromWei(defaultDailyRestriction.allowedTokens)} ${tokenSymbol}` : `${fromWeiPercentage(defaultDailyRestriction.allowedTokens)}%`}`);
    console.log(`     Start time:                   ${moment.unix(defaultDailyRestriction.startTime).format('MMMM Do YYYY, HH:mm:ss')}`);
    console.log(`     Rolling period:               ${defaultDailyRestriction.rollingPeriodInDays} days`);
    console.log(`     End time:                     ${moment.unix(defaultDailyRestriction.endTime).format('MMMM Do YYYY, HH:mm:ss')} `);
  }
  console.log(`- Default restriction:           ${hasDefaultRestriction ? '' : 'None'} `);
  if (hasDefaultRestriction) {
    console.log(`     Type:                         ${RESTRICTION_TYPES[defaultRestriction.typeOfRestriction]}`);
    console.log(`     Allowed tokens:               ${defaultRestriction.typeOfRestriction === "0" ? `${web3.utils.fromWei(defaultRestriction.allowedTokens)} ${tokenSymbol}` : `${fromWeiPercentage(defaultRestriction.allowedTokens)}%`}`);
    console.log(`     Start time:                   ${moment.unix(defaultRestriction.startTime).format('MMMM Do YYYY, HH:mm:ss')}`);
    console.log(`     Rolling period:               ${defaultRestriction.rollingPeriodInDays} days`);
    console.log(`     End time:                     ${moment.unix(defaultRestriction.endTime).format('MMMM Do YYYY, HH:mm:ss')} `);
  }

  let options = [
    'Change exempt wallet',
    'Change default restrictions',
    'Change individual restrictions',
    'Explore account',
    'Operate with multiple restrictions'
  ];

  let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'RETURN' });
  let optionSelected = index !== -1 ? options[index] : 'RETURN';
  console.log('Selected:', optionSelected, '\n');
  switch (optionSelected) {
    case 'Change exempt wallet':
      await changeExemptWallet();
      break;
    case 'Change default restrictions':
      await changeDefaultRestrictions(hasDefaultDailyRestriction, hasDefaultRestriction);
      break;
    case 'Change individual restrictions':
      await changeIndividualRestrictions();
      break;
    case 'Explore account':
      await exploreAccount();
      break;
    case 'Operate with multiple restrictions':
      await operateWithMultipleRestrictions();
      break;
    case 'RETURN':
      return;
  }

  await volumeRestrictionTM();
}

async function changeExemptWallet() {
  let options = [
    'Add exempt wallet',
    'Remove exempt wallet'
  ];

  let change;
  let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'RETURN' });
  let optionSelected = index !== -1 ? options[index] : 'RETURN';
  console.log('Selected:', optionSelected, '\n');
  switch (optionSelected) {
    case 'Add exempt wallet':
      change = true;
      break;
    case 'Remove exempt wallet':
      change = false;
      break;
    case 'RETURN':
      return;
  }

  let wallet = readlineSync.question('Enter the wallet to change: ', {
    limit: function (input) {
      return web3.utils.isAddress(input);
    },
    limitMessage: "Must be a valid address"
  });
  let changeExemptWalletAction = currentTransferManager.methods.changeExemptWalletList(wallet, change);
  let changeExemptWalletReceipt = await common.sendTransaction(changeExemptWalletAction);
  let changeExemptWalletEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, changeExemptWalletReceipt.logs, 'ChangedExemptWalletList');
  console.log(chalk.green(`${changeExemptWalletEvent._wallet} has been ${changeExemptWalletEvent._change ? `added to` : `removed from`} exempt wallets successfully!`));
}

async function changeDefaultRestrictions(hasDefaultDailyRestriction, hasDefaultRestriction) {
  let options = [];
  if (!hasDefaultDailyRestriction) {
    options.push('Add default daily restriction');
  } else {
    options.push('Modify default daily restriction', 'Remove default daily restriction');
  }

  if (!hasDefaultRestriction) {
    options.push('Add default restriction');
  } else {
    options.push('Modify default restriction', 'Remove default restriction');
  }

  let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'RETURN' });
  let optionSelected = index !== -1 ? options[index] : 'RETURN';
  console.log('Selected:', optionSelected, '\n');
  switch (optionSelected) {
    case 'Add default daily restriction':
      let defaultDailyRestrictoToAdd = inputRestrictionData(true);
      let addDefaultDailyRestrictionAction = currentTransferManager.methods.addDefaultDailyRestriction(
        defaultDailyRestrictoToAdd.allowedTokens,
        defaultDailyRestrictoToAdd.startTime,
        defaultDailyRestrictoToAdd.endTime,
        defaultDailyRestrictoToAdd.restrictionType
      );
      let addDefaultDailyRestrictionReceipt = await common.sendTransaction(addDefaultDailyRestrictionAction);
      let addDefaultDailyRestrictionEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, addDefaultDailyRestrictionReceipt.logs, 'AddDefaultDailyRestriction');
      console.log(chalk.green(`Daily default restriction has been added successfully!`));
      break;
    case 'Modify default daily restriction':
      let defaultDailyRestrictoToModify = inputRestrictionData(true);
      let modifyDefaultDailyRestrictionAction = currentTransferManager.methods.modifyDefaultDailyRestriction(
        defaultDailyRestrictoToModify.allowedTokens,
        defaultDailyRestrictoToModify.startTime,
        defaultDailyRestrictoToModify.endTime,
        defaultDailyRestrictoToModify.restrictionType
      );
      let modifyDefaultDailyRestrictionReceipt = await common.sendTransaction(modifyDefaultDailyRestrictionAction);
      let modifyDefaultDailyRestrictionEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, modifyDefaultDailyRestrictionReceipt.logs, 'ModifyDefaultDailyRestriction');
      console.log(chalk.green(`Daily default restriction has been modified successfully!`));
      break;
    case 'Remove default daily restriction':
      let removeDefaultDailyRestrictionAction = currentTransferManager.methods.removeDefaultDailyRestriction();
      let removeDefaultDailyRestrictionReceipt = await common.sendTransaction(removeDefaultDailyRestrictionAction);
      let removeDefaultDailyRestrictionEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, removeDefaultDailyRestrictionReceipt.logs, 'DefaultDailyRestrictionRemoved');
      console.log(chalk.green(`Daily default restriction has been removed successfully!`));
      break;
    case 'Add default restriction':
      let defaultRestrictoToAdd = inputRestrictionData(false);
      let addDefaultRestrictionAction = currentTransferManager.methods.addDefaultRestriction(
        defaultRestrictoToAdd.allowedTokens,
        defaultRestrictoToAdd.startTime,
        defaultRestrictoToAdd.rollingPeriodInDays,
        defaultRestrictoToAdd.endTime,
        defaultRestrictoToAdd.restrictionType
      );
      let addDefaultRestrictionReceipt = await common.sendTransaction(addDefaultRestrictionAction);
      let addDefaultRestrictionEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, addDefaultRestrictionReceipt.logs, 'AddDefaultRestriction');
      console.log(chalk.green(`Default restriction has been added successfully!`));
      break;
    case 'Modify default restriction':
      let defaultRestrictoToModify = inputRestrictionData(false);
      let modifyDefaultRestrictionAction = currentTransferManager.methods.modifyDefaultRestriction(
        defaultRestrictoToModify.allowedTokens,
        defaultRestrictoToModify.startTime,
        defaultRestrictoToModify.rollingPeriodInDays,
        defaultRestrictoToModify.endTime,
        defaultRestrictoToModify.restrictionType
      );
      let modifyDefaultRestrictionReceipt = await common.sendTransaction(modifyDefaultRestrictionAction);
      let modifyDefaultRestrictionEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, modifyDefaultRestrictionReceipt.logs, 'ModifyDefaultRestriction');
      console.log(chalk.green(`Default restriction has been modified successfully!`));
      break;
    case 'Remove default restriction':
      let removeDefaultRestrictionAction = currentTransferManager.methods.removeDefaultRestriction();
      let removeDefaultRestrictionReceipt = await common.sendTransaction(removeDefaultRestrictionAction);
      let removeDefaultRestrictionEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, removeDefaultRestrictionReceipt.logs, 'DefaultRestrictionRemoved');
      console.log(chalk.green(`Default restriction has been removed successfully!`));
      break;
  }
}

async function changeIndividualRestrictions() {
  let holder = readlineSync.question('Enter the address of the token holder, whom restriction will be implied: ', {
    limit: function (input) {
      return web3.utils.isAddress(input);
    },
    limitMessage: "Must be a valid address"
  });

  let currentDailyRestriction = await currentTransferManager.methods.individualDailyRestriction(holder).call();
  let hasDailyRestriction = parseInt(currentDailyRestriction.startTime) !== 0;
  let currentRestriction = await currentTransferManager.methods.individualRestriction(holder).call();
  let hasRestriction = parseInt(currentRestriction.startTime) !== 0;

  console.log(`*** Current restrictions for ${holder} ***`, '\n');

  console.log(`- Daily restriction:    ${hasDailyRestriction ? '' : 'None'}`);
  if (hasDailyRestriction) {
    console.log(`     Type:                         ${RESTRICTION_TYPES[currentDailyRestriction.typeOfRestriction]}`);
    console.log(`     Allowed tokens:               ${currentDailyRestriction.typeOfRestriction === "0" ? `${web3.utils.fromWei(currentDailyRestriction.allowedTokens)} ${tokenSymbol}` : `${fromWeiPercentage(currentDailyRestriction.allowedTokens)}%`}`);
    console.log(`     Start time:                   ${moment.unix(currentDailyRestriction.startTime).format('MMMM Do YYYY, HH:mm:ss')}`);
    console.log(`     Rolling period:               ${currentDailyRestriction.rollingPeriodInDays} days`);
    console.log(`     End time:                     ${moment.unix(currentDailyRestriction.endTime).format('MMMM Do YYYY, HH:mm:ss')} `);
  }
  console.log(`- Default daily restriction: ${hasRestriction ? '' : 'None'} `);
  if (hasRestriction) {
    console.log(`     Type:                         ${RESTRICTION_TYPES[currentRestriction.typeOfRestriction]}`);
    console.log(`     Allowed tokens:               ${currentRestriction.typeOfRestriction === "0" ? `${web3.utils.fromWei(currentRestriction.allowedTokens)} ${tokenSymbol}` : `${fromWeiPercentage(currentRestriction.allowedTokens)}%`}`);
    console.log(`     Start time:                   ${moment.unix(currentRestriction.startTime).format('MMMM Do YYYY, HH:mm:ss')}`);
    console.log(`     Rolling period:               ${currentRestriction.rollingPeriodInDays} days`);
    console.log(`     End time:                     ${moment.unix(currentRestriction.endTime).format('MMMM Do YYYY, HH:mm:ss')} `);
  }

  let options = [];
  if (!hasDailyRestriction) {
    options.push('Add individual daily restriction');
  } else {
    options.push('Modify individual daily restriction', 'Remove individual daily restriction');
  }

  if (!hasRestriction) {
    options.push('Add individual restriction');
  } else {
    options.push('Modify individual restriction', 'Remove individual restriction');
  }

  let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'RETURN' });
  let optionSelected = index !== -1 ? options[index] : 'RETURN';
  console.log('Selected:', optionSelected, '\n');
  switch (optionSelected) {
    case 'Add individual daily restriction':
      let dailyRestrictoToAdd = inputRestrictionData(true);
      let addDailyRestrictionAction = currentTransferManager.methods.addIndividualDailyRestriction(
        holder,
        dailyRestrictoToAdd.allowedTokens,
        dailyRestrictoToAdd.startTime,
        dailyRestrictoToAdd.endTime,
        dailyRestrictoToAdd.restrictionType
      );
      let addDailyRestrictionReceipt = await common.sendTransaction(addDailyRestrictionAction);
      let addDailyRestrictionEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, addDailyRestrictionReceipt.logs, 'AddIndividualDailyRestriction');
      console.log(chalk.green(`Daily restriction for ${addDailyRestrictionEvent._holder} has been added successfully!`));
      break;
    case 'Modify individual daily restriction':
      let dailyRestrictoToModify = inputRestrictionData(true);
      let modifyDailyRestrictionAction = currentTransferManager.methods.modifyIndividualDailyRestriction(
        holder,
        dailyRestrictoToModify.allowedTokens,
        dailyRestrictoToModify.startTime,
        dailyRestrictoToModify.endTime,
        dailyRestrictoToModify.restrictionType
      );
      let modifyDailyRestrictionReceipt = await common.sendTransaction(modifyDailyRestrictionAction);
      let modifyDailyRestrictionEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, modifyDailyRestrictionReceipt.logs, 'ModifyIndividualDailyRestriction');
      console.log(chalk.green(`Daily restriction for ${modifyDailyRestrictionEvent._holder} has been modified successfully!`));
      break;
    case 'Remove individual daily restriction':
      let removeDailyRestrictionAction = currentTransferManager.methods.removeIndividualDailyRestriction(holder);
      let removeDailyRestrictionReceipt = await common.sendTransaction(removeDailyRestrictionAction);
      let removeDailyRestrictionEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, removeDailyRestrictionReceipt.logs, 'IndividualDailyRestrictionRemoved');
      console.log(chalk.green(`Daily restriction for ${removeDailyRestrictionEvent._holder} has been removed successfully!`));
      break;
    case 'Add individual restriction':
      let restrictoToAdd = inputRestrictionData(false);
      let addRestrictionAction = currentTransferManager.methods.addIndividualRestriction(
        holder,
        restrictoToAdd.allowedTokens,
        restrictoToAdd.startTime,
        restrictoToAdd.rollingPeriodInDays,
        restrictoToAdd.endTime,
        restrictoToAdd.restrictionType
      );
      let addRestrictionReceipt = await common.sendTransaction(addRestrictionAction);
      let addRestrictionEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, addRestrictionReceipt.logs, 'AddIndividualRestriction');
      console.log(chalk.green(`Restriction for ${addRestrictionEvent._holder} has been added successfully!`));
      break;
    case 'Modify individual restriction':
      let restrictoToModify = inputRestrictionData(false);
      let modifyRestrictionAction = currentTransferManager.methods.modifyIndividualRestriction(
        holder,
        restrictoToModify.allowedTokens,
        restrictoToModify.startTime,
        restrictoToModify.rollingPeriodInDays,
        restrictoToModify.endTime,
        restrictoToModify.restrictionType
      );
      let modifyRestrictionReceipt = await common.sendTransaction(modifyRestrictionAction);
      let modifyRestrictionEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, modifyRestrictionReceipt.logs, 'ModifyIndividualRestriction');
      console.log(chalk.green(`Restriction for ${modifyRestrictionEvent._holder} has been modified successfully!`));
      break;
    case 'Remove individual restriction':
      let removeRestrictionAction = currentTransferManager.methods.removeIndividualRestriction(holder);
      let removeRestrictionReceipt = await common.sendTransaction(removeRestrictionAction);
      let removeRestrictionEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, removeRestrictionReceipt.logs, 'IndividualRestrictionRemoved');
      console.log(chalk.green(`Restriction for ${removeRestrictionEvent._holder} has been removed successfully!`));
      break;
    case 'RETURN':
      return;
  }
}

function inputRestrictionData(isDaily) {
  let restriction = {};
  restriction.restrictionType = readlineSync.keyInSelect(RESTRICTION_TYPES, 'How do you want to set the allowance? ', { cancel: false });
  if (restriction.restrictionType == RESTRICTION_TYPES.indexOf('Fixed')) {
    restriction.allowedTokens = web3.utils.toWei(readlineSync.questionInt(`Enter the maximum amount of tokens allowed to be traded every ${isDaily ? 'day' : 'rolling period'}: `).toString());
  } else {
    restriction.allowedTokens = toWeiPercentage(readlineSync.questionInt(`Enter the maximum percentage of total supply allowed to be traded every ${isDaily ? 'day' : 'rolling period'}: `).toString());
  }
  if (isDaily) {
    restriction.rollingPeriodInDays = 1;
  } else {
    restriction.rollingPeriodInDays = readlineSync.questionInt(`Enter the rolling period in days (10 days): `, { defaultInput: 10 });
  }
  restriction.startTime = readlineSync.questionInt(`Enter the time (Unix Epoch time) at which restriction get into effect (now = 0): `, { defaultInput: 0 });
  let oneMonthFromNow = Math.floor(Date.now() / 1000) + gbl.constants.DURATION.days(30);
  restriction.endTime = readlineSync.question(`Enter the time (Unix Epoch time) when the purchase lockup period ends and the investor can freely purchase tokens from others (1 week from now = ${oneMonthFromNow}): `, {
    limit: function (input) {
      return input > restriction.startTime + gbl.constants.DURATION.days(restriction.rollingPeriodInDays);
    },
    limitMessage: 'Must be greater than startTime + rolling period',
    defaultInput: oneMonthFromNow
  });
  return restriction;
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
  packedData = Buffer.concat([new Buffer(`\x19Ethereum Signed Message: \n${ packedData.length.toString() } `), packedData]);
  packedData = web3.sha3(`0x${ packedData.toString("hex") } `, { encoding: "hex" });
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

    let moduleRegistryAddress = await contracts.moduleRegistry();
    let moduleRegistryABI = abis.moduleRegistry();
    moduleRegistry = new web3.eth.Contract(moduleRegistryABI, moduleRegistryAddress);
    moduleRegistry.setProvider(web3.currentProvider);
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
    return `${t.symbol} - Deployed at ${t.address} `;
  });
  options.push('Enter token symbol manually');

  let index = readlineSync.keyInSelect(options, 'Select a token:', { cancel: 'Exit' });
  let selected = index != -1 ? options[index] : 'Exit';
  switch (selected) {
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

async function logTotalInvestors() {
  let investorsCount = await securityToken.methods.getInvestorCount().call();
  console.log(chalk.yellow(`Total investors at the moment: ${investorsCount} `));
}

async function logBalance(from, totalSupply) {
  let fromBalance = web3.utils.fromWei(await securityToken.methods.balanceOf(from).call());
  let percentage = totalSupply != '0' ? ` - ${parseFloat(fromBalance) / parseFloat(totalSupply) * 100}% of total supply` : '';
  console.log(chalk.yellow(`Balance of ${from}: ${fromBalance} ${tokenSymbol}${percentage}`));
}

module.exports = {
  executeApp: async function (_tokenSymbol) {
    await initialize(_tokenSymbol);
    return executeApp();
  },
  addTransferManagerModule: async function (_tokenSymbol) {
    await initialize(_tokenSymbol);
    return addTransferManagerModule()
  }
}