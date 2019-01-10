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
const WHITELIST_DATA_CSV = `${__dirname}/../data/Transfer/GTM/whitelist_data.csv`;
const ADD_BLACKLIST_DATA_CSV = `${__dirname}/../data/Transfer/BlacklistTM/add_blacklist_data.csv`;
const MODIFY_BLACKLIST_DATA_CSV = `${__dirname}/../data/Transfer/BlacklistTM/modify_blacklist_data.csv`;
const DELETE_BLACKLIST_DATA_CSV = `${__dirname}/../data/Transfer/BlacklistTM/delete_blacklist_data.csv`;
const ADD_INVESTOR_BLACKLIST_DATA_CSV = `${__dirname}/../data/Transfer/BlacklistTM/add_investor_blacklist_data.csv`;
const REMOVE_INVESTOR_BLACKLIST_DATA_CSV = `${__dirname}/../data/Transfer/BlacklistTM/remove_investor_blacklist_data.csv`;
const PERCENTAGE_WHITELIST_DATA_CSV = `${__dirname}/../data/Transfer/PercentageTM/whitelist_data.csv`;
const ADD_MANUAL_APPROVAL_DATA_CSV = `${__dirname}/../data/Transfer/MATM/add_manualapproval_data.csv`;
const MODIFY_MANUAL_APPROVAL_DATA_CSV = `${__dirname}/../data/Transfer/MATM/modify_manualapproval_data.csv`;
const REVOKE_MANUAL_APPROVAL_DATA_CSV = `${__dirname}/../data/Transfer/MATM/revoke_manualapproval_data.csv`;
const ADD_DAILY_RESTRICTIONS_DATA_CSV = `${__dirname}/../data/Transfer/VRTM/add_daily_restriction_data.csv`;
const MODIFY_DAILY_RESTRICTIONS_DATA_CSV = `${__dirname}/../data/Transfer/VRTM/modify_daily_restriction_data.csv`;
const REMOVE_DAILY_RESTRICTIONS_DATA_CSV = `${__dirname}/../data/Transfer/VRTM/remove_daily_restriction_data.csv`;
const ADD_RESTRICTIONS_DATA_CSV = `${__dirname}/../data/Transfer/VRTM/add_restriction_data.csv`;
const MODIFY_RESTRICTIONS_DATA_CSV = `${__dirname}/../data/Transfer/VRTM/modify_restriction_data.csv`;
const REMOVE_RESTRICTIONS_DATA_CSV = `${__dirname}/../data/Transfer/VRTM/remove_restriction_data.csv`;

const RESTRICTION_TYPES = ['Fixed', 'Percentage'];

const MATM_MENU_ADD = 'Add new manual approval';
const MATM_MENU_MANAGE = 'Manage existing approvals';
const MATM_MENU_EXPLORE = 'Explore account';
const MATM_MENU_OPERATE = 'Operate with multiple approvals';
const MATM_MENU_MANAGE_INCRESE = 'Increase allowance';
const MATM_MENU_MANAGE_DECREASE = 'Decrease allowance';
const MATM_MENU_MANAGE_TIME = 'Modify expiry time and/or description';
const MATM_MENU_MANAGE_REVOKE = 'Revoke this approval';
const MATM_MENU_OPERATE_ADD = 'Add multiple approvals in batch';
const MATM_MENU_OPERATE_MODIFY = 'Modify multiple approvals in batch';
const MATM_MENU_OPERATE_REVOKE = 'Revoke multiple approvals in batch';

// App flow
let tokenSymbol;
let securityToken;
let securityTokenRegistry;
let moduleRegistry;
let currentTransferManager;

async function executeApp() {
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

  let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'EXIT' });
  let optionSelected = index !== -1 ? options[index] : 'EXIT';
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
    case 'EXIT':
      return;
  }

  await executeApp();
}

async function forcedTransfers() {
  let options = ['Disable controller', 'Set controller'];
  let controller = await securityToken.methods.controller().call();
  if (controller == Issuer.address) {
    options.push('Force Transfer');
  }
  let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'RETURN' });
  let optionSelected = index !== -1 ? options[index] : 'RETURN';
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
      let data = '';//readlineSync.question('Enter the data to indicate validation: ');
      let log = readlineSync.question('Enter a message to attach to the transfer (i.e. "Private key lost"): ');
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
    case 'RETURN':
      return;
  }

  await forcedTransfers();
}

async function configExistingModules(tmModules) {
  let options = tmModules.map(m => `${m.name} at ${m.address}`);
  let index = readlineSync.keyInSelect(options, 'Which module do you want to config? ', { cancel: 'RETURN' });
  console.log('Selected:', index !== -1 ? options[index] : 'RETURN', '\n');
  let moduleNameSelected = index !== -1 ? tmModules[index].name : 'RETURN';

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
    case 'BlacklistTransferManager':
      currentTransferManager = new web3.eth.Contract(abis.blacklistTransferManager(), tmModules[index].address);
      currentTransferManager.setProvider(web3.currentProvider);
      await blacklistTransferManager();
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

  let index = readlineSync.keyInSelect(options, 'Which Transfer Manager module do you want to add? ', { cancel: 'RETURN' });
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

  let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'RETURN' });
  let optionSelected = index !== -1 ? options[index] : 'RETURN';
  console.log('Selected:', optionSelected, '\n');
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
      let toTimeDefault = readlineSync.questionInt(`Enter the default time (Unix Epoch time) used when toTime is zero: `);
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
    case 'RETURN':
      return;
  }

  await generalTransferManager();
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

async function modifyWhitelistInBatch(_csvFilePath, _batchSize) {
  let csvFilePath;
  if (typeof _csvFilePath === 'undefined') {
    csvFilePath = readlineSync.question(`Enter the path for csv data file (${WHITELIST_DATA_CSV}): `, {
      defaultInput: WHITELIST_DATA_CSV
    });
  } else {
    csvFilePath = _csvFilePath;
  }
  let batchSize;
  if (typeof _batchSize === 'undefined') {
    batchSize = readlineSync.question(`Enter the max number of records per transaction or batch size (${gbl.constants.DEFAULT_BATCH_SIZE}): `, {
      limit: function (input) {
        return parseInt(input) > 0;
      },
      limitMessage: 'Must be greater than 0',
      defaultInput: gbl.constants.DEFAULT_BATCH_SIZE
    });
  } else {
    batchSize = _batchSize;
  }
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
    let action = currentTransferManager.methods.modifyWhitelistMulti(investorArray[batch], fromTimesArray[batch], toTimesArray[batch], expiryTimeArray[batch], canBuyFromSTOArray[batch]);
    let receipt = await common.sendTransaction(action);
    console.log(chalk.green('Modify whitelist transaction was successful.'));
    console.log(`${receipt.gasUsed} gas used.Spent: ${web3.utils.fromWei((new web3.utils.BN(receipt.gasUsed)).mul(new web3.utils.BN(defaultGasPrice)))} ETH`);
  }
}

async function manualApprovalTransferManager() {
  console.log(chalk.blue(`Manual Approval Transfer Manager at ${currentTransferManager.options.address} `), '\n');

  let totalApprovals = await currentTransferManager.methods.getTotalApprovalsLength().call();
  console.log(`- Current active approvals:      ${totalApprovals}`);

  let matmOptions = [
    MATM_MENU_ADD,
    MATM_MENU_MANAGE,
    MATM_MENU_EXPLORE,
    MATM_MENU_OPERATE
  ];

  let index = readlineSync.keyInSelect(matmOptions, 'What do you want to do?', {
    cancel: 'RETURN'
  });
  let optionSelected = index != -1 ? matmOptions[index] : 'RETURN';
  console.log('Selected:', optionSelected, '\n');

  switch (optionSelected) {
    case MATM_MENU_ADD:
      await matmAdd();
      break;
    case MATM_MENU_MANAGE:
      await matmManage();
      break;
    case MATM_MENU_EXPLORE:
      await matmExplore();
      break;
    case MATM_MENU_OPERATE:
      await matmOperate();
      break;
    case 'RETURN':
      return;
  }

  await manualApprovalTransferManager();
}

async function matmAdd() {
  let from = readlineSync.question('Enter the address from which transfers will be approved: ', {
    limit: function (input) {
      return web3.utils.isAddress(input);
    },
    limitMessage: "Must be a valid address"
  });
  let to = readlineSync.question('Enter the address to which transfers will be approved: ', {
    limit: function (input) {
      return web3.utils.isAddress(input);
    },
    limitMessage: "Must be a valid address"
  });
  if (!await getManualApproval(from, to)) {
    let description = readlineSync.question('Enter the description for the manual approval: ', {
      limit: function (input) {
        return input != "" && getBinarySize(input) < 33
      },
      limitMessage: "Description is required"
    });
    let allowance = readlineSync.question('Enter the amount of tokens which will be approved: ');
    let oneHourFromNow = Math.floor(Date.now() / 1000 + 3600);
    let expiryTime = readlineSync.questionInt(`Enter the time (Unix Epoch time) until which the transfer is allowed (1 hour from now = ${oneHourFromNow}): `, { defaultInput: oneHourFromNow });
    let addManualApprovalAction = currentTransferManager.methods.addManualApproval(from, to, web3.utils.toWei(allowance), expiryTime, web3.utils.fromAscii(description));
    let addManualApprovalReceipt = await common.sendTransaction(addManualApprovalAction);
    let addManualApprovalEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, addManualApprovalReceipt.logs, 'AddManualApproval');
    console.log(chalk.green(`Manual approval has been added successfully!`));
  } else {
    console.log(chalk.red(`A manual approval already exists from ${from} to ${to}. Revoke it first if you want to add a new one or modify the existing one.`));
  }
}

async function matmManage() {

  let manageOptions = [
    MATM_MENU_MANAGE_INCRESE,
    MATM_MENU_MANAGE_DECREASE,
    MATM_MENU_MANAGE_TIME,
    MATM_MENU_MANAGE_REVOKE
  ];

  let getApprovals = await getApprovalsArray();

  if (getApprovals.length > 0) {
    let options = []
    getApprovals.forEach((item) => {
      options.push(`${web3.utils.toAscii(item.description)}\n    From: ${item.from}\n    To: ${item.to}\n    Amount: ${web3.utils.fromWei(item.allowance)} ${tokenSymbol}\n    Expiry date: ${moment.unix(item.expiryTime).format('MM/DD/YYYY HH:mm')}\n`)
    })

    let index = readlineSync.keyInSelect(options, 'Select an existing approval: ', {
      cancel: 'RETURN'
    });
    let optionSelected = index != -1 ? options[index] : 'RETURN';
    console.log('Selected:', optionSelected, '\n');

    if (optionSelected !== 'RETURN') {
      let selectedApproval = getApprovals[index];

      let index2 = readlineSync.keyInSelect(manageOptions, 'What do you want to do?', {
        cancel: 'RETURN'
      });
      let optionSelected2 = index2 != -1 ? manageOptions[index2] : 'RETURN';
      console.log('Selected:', optionSelected2, '\n');

      if (optionSelected2 !== 'RETURN') {
        switch (optionSelected2) {
          case MATM_MENU_MANAGE_INCRESE:
            await matmManageIncrese(selectedApproval);
            break;
          case MATM_MENU_MANAGE_DECREASE:
            await matmManageDecrease(selectedApproval);
            break;
          case MATM_MENU_MANAGE_TIME:
            await matmManageTimeOrDescription(selectedApproval);
            break;
          case MATM_MENU_MANAGE_REVOKE:
            await matmManageRevoke(selectedApproval);
            break;
        }
      }
    }
  } else {
    console.log(chalk.yellow(`There are no existing approvals to show`));
  }
}

async function matmExplore() {
  let getApprovals = await getApprovalsArray();
  getApprovals.forEach((item) => {
    printMatmRow(item.from, item.to, item.allowance, item.expiryTime, item.description);
  })
}

async function matmOperate() {
  let operateOptions = [
    MATM_MENU_OPERATE_ADD,
    MATM_MENU_OPERATE_MODIFY,
    MATM_MENU_OPERATE_REVOKE
  ];

  let index = readlineSync.keyInSelect(operateOptions, 'What do you want to do?', {
    cancel: 'RETURN'
  });
  let optionSelected = index != -1 ? operateOptions[index] : 'RETURN';
  console.log('Selected:', optionSelected, '\n');

  switch (optionSelected) {
    case MATM_MENU_OPERATE_ADD:
      await addManualApproveInBatch();
      break;
    case MATM_MENU_OPERATE_MODIFY:
      await modifyManualApproveInBatch();
      break;
    case MATM_MENU_OPERATE_REVOKE:
      await revokeManualApproveInBatch();
      break;
  }
}

async function matmManageIncrese(selectedApproval) {
  let allowance = readlineSync.question(`Enter a value to increase allowance (current allowance = ${web3.utils.fromWei(selectedApproval.allowance)}): `, {
    limit: function (input) {
      return parseFloat(input) > 0
    },
    limitMessage: "Amount must be bigger than 0"
  });

  if (readlineSync.keyInYNStrict(`Do you want to modify expiry time or description?`)) {
    let { expiryTime, description } = readExpiryTimeAndDescription(selectedApproval);
    selectedApproval.expiryTime = expiryTime;
    selectedApproval.description = web3.utils.fromAscii(description);
  }

  let modifyManualApprovalAction = currentTransferManager.methods.modifyManualApproval(selectedApproval.from, selectedApproval.to, parseInt(selectedApproval.expiryTime), web3.utils.toWei(allowance), selectedApproval.description, 1);
  await common.sendTransaction(modifyManualApprovalAction);
  console.log(chalk.green(`The approval allowance has been increased successfully!`));
}

async function matmManageDecrease(selectedApproval) {
  let allowance = readlineSync.question(`Enter a value to decrease allowance (current allowance = ${web3.utils.fromWei(selectedApproval.allowance)}): `, {
    limit: function (input) {
      return parseFloat(input) > 0
    },
    limitMessage: "Amount must be bigger than 0"
  });

  if (readlineSync.keyInYNStrict(`Do you want to modify expiry time or description?`)) {
    let { expiryTime, description } = readExpiryTimeAndDescription(selectedApproval);
    selectedApproval.expiryTime = expiryTime;
    selectedApproval.description = web3.utils.fromAscii(description);
  }

  let modifyManualApprovalAction = currentTransferManager.methods.modifyManualApproval(selectedApproval.from, selectedApproval.to, parseInt(selectedApproval.expiryTime), web3.utils.toWei(allowance), selectedApproval.description, 0);
  await common.sendTransaction(modifyManualApprovalAction);
  console.log(chalk.green(`The approval allowance has been decreased successfully!`));
}

async function matmManageTimeOrDescription(selectedApproval) {
  let { expiryTime, description } = readExpiryTimeAndDescription(selectedApproval);

  let modifyManualApprovalAction = currentTransferManager.methods.modifyManualApproval(selectedApproval.from, selectedApproval.to, parseInt(expiryTime), selectedApproval.allowance, web3.utils.fromAscii(description), 2);
  await common.sendTransaction(modifyManualApprovalAction);
  console.log(chalk.green(`The approval expiry time has been modified successfully!`));
}

function readExpiryTimeAndDescription(selectedApproval) {
  let expiryTime = readlineSync.questionInt(`Enter the new expiry time (Unix Epoch time) until which the transfer is allowed or leave empty to keep the current (${selectedApproval.expiryTime}): `, {
    limit: function (input) {
      return parseFloat(input) > 0;
    },
    limitMessage: "Enter Unix Epoch time",
    defaultInput: selectedApproval.expiryTime
  });
  let description = readlineSync.question(`Enter the new description for the manual approval or leave empty to keep the current (${web3.utils.toAscii(selectedApproval.description)}): `, {
    limit: function (input) {
      return input != "" && getBinarySize(input) < 33;
    },
    limitMessage: "Description is required"
  });
  return { expiryTime, description };
}

async function matmManageRevoke(selectedApproval) {
  let modifyManualApprovalAction = currentTransferManager.methods.revokeManualApproval(selectedApproval.from, selectedApproval.to);
  await common.sendTransaction(modifyManualApprovalAction);
  console.log(chalk.green(`The approval has been revoked successfully!`));
}

async function getApprovalsArray() {
  let address = readlineSync.question('Enter an address to filter or leave empty to get all the approvals: ', {
    limit: function (input) {
      return web3.utils.isAddress(input);
    },
    limitMessage: "Must be a valid address",
    defaultInput: gbl.constants.ADDRESS_ZERO
  });
  if (address == gbl.constants.ADDRESS_ZERO) {
    return await getApprovals();
  } else {
    let approvals = await getApprovalsToAnAddress(address);
    if (!approvals.length) {
      console.log(chalk.red(`\nThe address is not listed\n`))
    }
    return approvals;
  }
}

function printMatmRow(from, to, allowance, time, description) {
  console.log(`\nDescription: ${web3.utils.toAscii(description)}\nFrom ${from} to ${to}\nAllowance: ${web3.utils.fromWei(allowance)}\nExpiry time: ${moment.unix(time).format('MMMM Do YYYY HH:mm')}\n`);
}

async function getApprovals() {
  function ApprovalDetail(_from, _to, _allowance, _expiryTime, _description) {
    this.from = _from;
    this.to = _to;
    this.allowance = _allowance;
    this.expiryTime = _expiryTime;
    this.description = _description;
  }

  let results = [];
  let approvalDetails = await currentTransferManager.methods.getAllApprovals().call();
  for (let i = 0; i < approvalDetails[0].length; i++) {
    results.push(new ApprovalDetail(approvalDetails[0][i], approvalDetails[1][i], approvalDetails[2][i], approvalDetails[3][i], approvalDetails[4][i]));
  }
  return results;
}

async function getApprovalsToAnAddress(address) {
  function ApprovalDetail(_from, _to, _allowance, _expiryTime, _description) {
    this.from = _from;
    this.to = _to;
    this.allowance = _allowance;
    this.expiryTime = _expiryTime;
    this.description = _description;
  }

  let results = [];
  let approvals = await currentTransferManager.methods.getActiveApprovalsToUser(address).call();
  for (let i = 0; i < approvals[0].length; i++) {
    results.push(new ApprovalDetail(approvals[0][i], approvals[1][i], approvals[2][i], approvals[3][i], approvals[4][i]));
  }
  return results;
}

async function getManualApproval(_from, _to) {
  let result = null;

  let manualApproval = await currentTransferManager.methods.getApprovalDetails(_from, _to).call();
  if ((manualApproval[0] >= new Date()) && (manualApproval[1] != 0)) {
    result = manualApproval;
  }
  return result;
}

async function matmGenericCsv(path, f) {
  let csvFilePath = readlineSync.question(`Enter the path for csv data file (${path}): `, {
    defaultInput: path
  });
  let batchSize = readlineSync.question(`Enter the max number of records per transaction or batch size (${gbl.constants.DEFAULT_BATCH_SIZE}): `, {
    limit: function (input) {
      return parseInt(input) > 0;
    },
    limitMessage: 'Must be greater than 0',
    defaultInput: gbl.constants.DEFAULT_BATCH_SIZE
  });
  let parsedData = csvParse(csvFilePath);
  let validData = parsedData.filter(row => f(row));
  let invalidRows = parsedData.filter(row => !validData.includes(row));
  if (invalidRows.length > 0) {
    console.log(chalk.red(`The following lines from csv file are not valid: ${invalidRows.map(r => parsedData.indexOf(r) + 1).join(',')} `));
  }
  return common.splitIntoBatches(validData, batchSize);
}

async function addManualApproveInBatch() {

  var f = (row) => {
    return (web3.utils.isAddress(row[0]) &&
      web3.utils.isAddress(row[1]) &&
      parseFloat(row[2]) > 0 &&
      moment.unix(row[3]).isValid() &&
      typeof row[4] === 'string' &&
      getBinarySize(row[4]) < 33)
  }

  let batches = await matmGenericCsv(ADD_MANUAL_APPROVAL_DATA_CSV, f)

  let [fromArray, toArray, allowanceArray, expiryArray, descriptionArray] = common.transposeBatches(batches);
  for (let batch = 0; batch < batches.length; batch++) {
    console.log(`Batch ${batch + 1} - Attempting to add manual approvals: \n\n`, descriptionArray[batch], '\n');
    descriptionArray[batch] = descriptionArray[batch].map(d => web3.utils.fromAscii(d));
    allowanceArray[batch] = allowanceArray[batch].map(a => web3.utils.toWei(new web3.utils.BN(a)));
    let action = await currentTransferManager.methods.addManualApprovalMulti(fromArray[batch], toArray[batch], allowanceArray[batch], expiryArray[batch], descriptionArray[batch]);
    let receipt = await common.sendTransaction(action);
    console.log(chalk.green('Add multiple manual approvals transaction was successful.'));
    console.log(`${receipt.gasUsed} gas used.Spent: ${web3.utils.fromWei((new web3.utils.BN(receipt.gasUsed)).mul(new web3.utils.BN(defaultGasPrice)))} ETH`);
  }
}

async function revokeManualApproveInBatch() {

  var f = (row) => {
    return (web3.utils.isAddress(row[0]) &&
      web3.utils.isAddress(row[1]))
  }

  let batches = await matmGenericCsv(REVOKE_MANUAL_APPROVAL_DATA_CSV, f)

  let [fromArray, toArray] = common.transposeBatches(batches);
  for (let batch = 0; batch < batches.length; batch++) {
    console.log(`Batch ${batch + 1} - Attempting to revoke manual approvals`, '\n');
    let action = await currentTransferManager.methods.revokeManualApprovalMulti(fromArray[batch], toArray[batch]);
    let receipt = await common.sendTransaction(action);
    console.log(chalk.green('Revoke multip;e manual approvals transaction was successful.'));
    console.log(`${receipt.gasUsed} gas used.Spent: ${web3.utils.fromWei((new web3.utils.BN(receipt.gasUsed)).mul(new web3.utils.BN(defaultGasPrice)))} ETH`);
  }
}

async function modifyManualApproveInBatch() {

  var f = (row) => {
    return (web3.utils.isAddress(row[0]) &&
      web3.utils.isAddress(row[1]) &&
      moment.unix(row[2]).isValid() &&
      parseFloat(row[3]) > 0 &&
      typeof row[4] === 'string' &&
      getBinarySize(row[4]) < 33 &&
      typeof parseInt(row[5])) === 'number'
  }

  let batches = await matmGenericCsv(MODIFY_MANUAL_APPROVAL_DATA_CSV, f)

  let [fromArray, toArray, expiryArray, allowanceArray, descriptionArray, changesArray] = common.transposeBatches(batches);
  for (let batch = 0; batch < batches.length; batch++) {
    console.log(`Batch ${batch + 1} - Attempting to modify manual approvals: \n\n`, descriptionArray[batch], '\n');
    descriptionArray[batch] = descriptionArray[batch].map(d => web3.utils.fromAscii(d));
    allowanceArray[batch] = allowanceArray[batch].map(a => web3.utils.toWei(new web3.utils.BN(a)));
    changesArray[batch] = changesArray[batch].map(c => parseInt(c));
    let action = await currentTransferManager.methods.modifyManualApprovalMulti(fromArray[batch], toArray[batch], expiryArray[batch], allowanceArray[batch], descriptionArray[batch], changesArray[batch]);
    let receipt = await common.sendTransaction(action);
    console.log(chalk.green('Modify multiple manual approvals transaction was successful.'));
    console.log(`${receipt.gasUsed} gas used.Spent: ${web3.utils.fromWei((new web3.utils.BN(receipt.gasUsed)).mul(new web3.utils.BN(defaultGasPrice)))} ETH`);
  }
}

function getBinarySize(string) {
  return Buffer.byteLength(string, 'utf8');
}

async function countTransferManager() {
  console.log(chalk.blue(`Count Transfer Manager at ${currentTransferManager.options.address}`), '\n');

  // Show current data
  let displayMaxHolderCount = await currentTransferManager.methods.maxHolderCount().call();

  console.log(`- Max holder count:        ${displayMaxHolderCount}`);

  let options = ['Change max holder count']
  let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'RETURN' });
  let optionSelected = index !== -1 ? options[index] : 'RETURN';
  console.log('Selected:', optionSelected, '\n');
  switch (optionSelected) {
    case 'Change max holder count':
      let maxHolderCount = readlineSync.question('Enter the maximum no. of holders the SecurityToken is allowed to have: ');
      let changeHolderCountAction = currentTransferManager.methods.changeHolderCount(maxHolderCount);
      let changeHolderCountReceipt = await common.sendTransaction(changeHolderCountAction);
      let changeHolderCountEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, changeHolderCountReceipt.logs, 'ModifyHolderCount');
      console.log(chalk.green(`Max holder count has been set to ${changeHolderCountEvent._newHolderCount} sucessfully!`));
      break;
    case 'RETURN':
      return;
  }

  await countTransferManager();
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
  let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'RETURN' });
  let optionSelected = index !== -1 ? options[index] : 'RETURN';
  console.log('Selected:', optionSelected, '\n');
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
    case 'RETURN':
      return;
  }

  await percentageTransferManager();
}

async function blacklistTransferManager() {
  console.log(chalk.blue(`Blacklist Transfer Manager at ${currentTransferManager.options.address}`), '\n');

  let currentBlacklists = await currentTransferManager.methods.getAllBlacklists().call();
  console.log(`- Blacklists:    ${currentBlacklists.length}`);

  let options = ['Add new blacklist'];
  if (currentBlacklists.length > 0) {
    options.push('Manage existing blacklist', 'Explore account');
  }
  options.push('Delete investors from all blacklists', 'Operate with multiple blacklists');

  let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: "RETURN" });
  let optionSelected = index !== -1 ? options[index] : 'RETURN';
  console.log('Selected:', optionSelected, '\n');
  switch (optionSelected) {
    case 'Add new blacklist':
      let name = readlineSync.question(`Enter the name of the blacklist type: `, {
        limit: function (input) {
          return input !== "";
        },
        limitMessage: `Invalid blacklist name`
      });
      let minuteFromNow = Math.floor(Date.now() / 1000) + 60;
      let startTime = readlineSync.questionInt(`Enter the start date (Unix Epoch time) of the blacklist type (a minute from now = ${minuteFromNow}): `, { defaultInput: minuteFromNow });
      let oneDayFromStartTime = startTime + 24 * 60 * 60;
      let endTime = readlineSync.questionInt(`Enter the end date (Unix Epoch time) of the blacklist type (1 day from start time = ${oneDayFromStartTime}): `, { defaultInput: oneDayFromStartTime });
      let repeatPeriodTime = readlineSync.questionInt(`Enter the repeat period (days) of the blacklist type, 0 to disable (90 days): `, { defaultInput: 90 });
      if (readlineSync.keyInYNStrict(`Do you want to add an investor to this blacklist type? `)) {
        let investor = readlineSync.question(`Enter the address of the investor: `, {
          limit: function (input) {
            return web3.utils.isAddress(input);
          },
          limitMessage: `Must be a valid address`
        });
        let addInvestorToNewBlacklistAction = currentTransferManager.methods.addInvestorToNewBlacklist(
          startTime,
          endTime,
          web3.utils.toHex(name),
          repeatPeriodTime,
          investor
        );
        let addInvestorToNewBlacklistReceipt = await common.sendTransaction(addInvestorToNewBlacklistAction);
        let addNewBlacklistEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, addInvestorToNewBlacklistReceipt.logs, 'AddBlacklistType');
        console.log(chalk.green(`${web3.utils.hexToUtf8(addNewBlacklistEvent._blacklistName)} blacklist type has been added successfully!`));
        let addInvestorToNewBlacklistEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, addInvestorToNewBlacklistReceipt.logs, 'AddInvestorToBlacklist');
        console.log(chalk.green(`${addInvestorToNewBlacklistEvent._investor} has been added to ${web3.utils.hexToUtf8(addInvestorToNewBlacklistEvent._blacklistName)} successfully!`));
      } else {
        let addBlacklistTypeAction = currentTransferManager.methods.addBlacklistType(startTime, endTime, web3.utils.toHex(name), repeatPeriodTime);
        let addBlacklistTypeReceipt = await common.sendTransaction(addBlacklistTypeAction);
        let addBlacklistTypeEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, addBlacklistTypeReceipt.logs, 'AddBlacklistType');
        console.log(chalk.green(`${web3.utils.hexToUtf8(addBlacklistTypeEvent._blacklistName)} blacklist type has been added successfully!`));
      }
      break;
    case 'Manage existing blacklist':
      let options = currentBlacklists.map(b => web3.utils.hexToUtf8(b));
      let index = readlineSync.keyInSelect(options, 'Which blacklist type do you want to manage? ', { cancel: "RETURN" });
      let optionSelected = index !== -1 ? options[index] : 'RETURN';
      console.log('Selected:', optionSelected, '\n');
      if (index !== -1) {
        await manageExistingBlacklist(currentBlacklists[index]);
      }
      break;
    case 'Explore account':
      let account = readlineSync.question(`Enter the address of the investor: `, {
        limit: function (input) {
          return web3.utils.isAddress(input);
        },
        limitMessage: `Must be a valid address`
      });
      let blacklistNamesToUser = await currentTransferManager.methods.getBlacklistNamesToUser(account).call();
      if (blacklistNamesToUser.length > 0) {
        console.log();
        console.log(`**** Blacklists inlcuding ${account} ****`);
        blacklistNamesToUser.map(n => console.log(web3.utils.hexToUtf8(n)));
      } else {
        console.log(chalk.yellow(`No blacklist includes ${account}`));
      }
      console.log();
      break;
    case 'Delete investors from all blacklists':
      let investorsToRemove = readlineSync.question(`Enter the addresses of the investors separated by comma (i.e. addr1,addr2,addr3): `, {
        limit: function (input) {
          return (input !== '' && input.split(",").every(a => web3.utils.isAddress(a)));
        },
        limitMessage: `All addresses must be valid`
      }).split(',');
      let deleteInvestorFromAllBlacklistAction;
      if (investorsToRemove.length === 1) {
        deleteInvestorFromAllBlacklistAction = currentTransferManager.methods.deleteInvestorFromAllBlacklist(investorsToRemove[0]);
      } else {
        deleteInvestorFromAllBlacklistAction = currentTransferManager.methods.deleteInvestorFromAllBlacklistMulti(investorsToRemove);
      }
      let deleteInvestorFromAllBlacklistReceipt = await common.sendTransaction(deleteInvestorFromAllBlacklistAction);
      let deleteInvestorFromAllBlacklistEvents = common.getMultipleEventsFromLogs(currentTransferManager._jsonInterface, deleteInvestorFromAllBlacklistReceipt.logs, 'DeleteInvestorFromBlacklist');
      deleteInvestorFromAllBlacklistEvents.map(e => console.log(chalk.green(`${e._investor} has been removed from ${web3.utils.hexToUtf8(e._blacklistName)} successfully!`)));
      break;
    case 'Operate with multiple blacklists':
      await operateWithMultipleBlacklists(currentBlacklists);
      break;
    case 'RETURN':
      return;
  }

  await blacklistTransferManager();
}

async function manageExistingBlacklist(blacklistName) {
  // Show current data
  let currentBlacklist = await currentTransferManager.methods.blacklists(blacklistName).call();
  let investors = await currentTransferManager.methods.getListOfAddresses(blacklistName).call();

  console.log();
  console.log(`- Name:                 ${web3.utils.hexToUtf8(blacklistName)}`);
  console.log(`- Start time:           ${moment.unix(currentBlacklist.startTime).format('MMMM Do YYYY, HH:mm:ss')}`);
  console.log(`- End time:             ${moment.unix(currentBlacklist.endTime).format('MMMM Do YYYY, HH:mm:ss')}`);
  console.log(`- Span:                 ${(currentBlacklist.endTime - currentBlacklist.startTime) / 60 / 60 / 24} days`);
  console.log(`- Repeat period time:   ${currentBlacklist.repeatPeriodTime} days`);
  console.log(`- Investors:            ${investors.length}`);
  // ------------------

  let options = [
    "Modify properties",
    "Show investors",
    "Add investors",
    "Remove investor",
    "Delete this blacklist type"
  ];

  let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'RETURN' });
  let optionSelected = index !== -1 ? options[index] : 'RETURN';
  console.log('Selected:', optionSelected, '\n');
  switch (optionSelected) {
    case 'Modify properties':
      let minuteFromNow = Math.floor(Date.now() / 1000) + 60;
      let startTime = readlineSync.questionInt(`Enter the start date (Unix Epoch time) of the blacklist type (a minute from now = ${minuteFromNow}): `, { defaultInput: minuteFromNow });
      let oneDayFromStartTime = startTime + 24 * 60 * 60;
      let endTime = readlineSync.questionInt(`Enter the end date (Unix Epoch time) of the blacklist type (1 day from start time = ${oneDayFromStartTime}): `, { defaultInput: oneDayFromStartTime });
      let repeatPeriodTime = readlineSync.questionInt(`Enter the repeat period (days) of the blacklist type, 0 to disable (90 days): `, { defaultInput: 90 });
      let modifyBlacklistTypeAction = currentTransferManager.methods.modifyBlacklistType(
        startTime,
        endTime,
        blacklistName,
        repeatPeriodTime
      );
      let modifyBlacklistTypeReceipt = await common.sendTransaction(modifyBlacklistTypeAction);
      let modifyBlacklistTypeEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, modifyBlacklistTypeReceipt.logs, 'ModifyBlacklistType');
      console.log(chalk.green(`${web3.utils.hexToUtf8(modifyBlacklistTypeEvent._blacklistName)} blacklist type has been modified successfully!`));
      break;
    case 'Show investors':
      if (investors.length > 0) {
        console.log("************ List of investors ************");
        investors.map(i => console.log(i));
      } else {
        console.log(chalk.yellow("There are no investors yet"));
      }
      break;
    case 'Add investors':
      let investorsToAdd = readlineSync.question(`Enter the addresses of the investors separated by comma (i.e. addr1,addr2,addr3): `, {
        limit: function (input) {
          return (input !== '' && input.split(",").every(a => web3.utils.isAddress(a)));
        },
        limitMessage: `All addresses must be valid`
      }).split(",");
      let addInvestorToBlacklistAction;
      if (investorsToAdd.length === 1) {
        addInvestorToBlacklistAction = currentTransferManager.methods.addInvestorToBlacklist(investorsToAdd[0], blacklistName);
      } else {
        addInvestorToBlacklistAction = currentTransferManager.methods.addInvestorToBlacklistMulti(investorsToAdd, blacklistName);
      }
      let addInvestorToBlacklistReceipt = await common.sendTransaction(addInvestorToBlacklistAction);
      let addInvestorToBlacklistEvents = common.getMultipleEventsFromLogs(currentTransferManager._jsonInterface, addInvestorToBlacklistReceipt.logs, 'AddInvestorToBlacklist');
      addInvestorToBlacklistEvents.map(e => console.log(chalk.green(`${e._investor} has been added to ${web3.utils.hexToUtf8(e._blacklistName)} successfully!`)));
      break;
    case "Remove investor":
      let investorsToRemove = readlineSync.question(`Enter the address of the investor: `, {
        limit: function (input) {
          return web3.utils.isAddress(input);
        },
        limitMessage: `Must be a valid address`
      });
      let deleteInvestorFromBlacklistAction = currentTransferManager.methods.deleteInvestorFromBlacklist(investorsToRemove, blacklistName);
      let deleteInvestorFromBlacklistReceipt = await common.sendTransaction(deleteInvestorFromBlacklistAction);
      let deleteInvestorFromBlacklistEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, deleteInvestorFromBlacklistReceipt.logs, 'DeleteInvestorFromBlacklist');
      console.log(chalk.green(`${deleteInvestorFromBlacklistEvent._investor} has been removed from ${web3.utils.hexToUtf8(deleteInvestorFromBlacklistEvent._blacklistName)} successfully!`));
      break;
    case "Delete this blacklist type":
      let isEmpty = investors.length === 0;
      if (!isEmpty) {
        console.log(chalk.yellow(`This blacklist have investors added on it. To delete it you must remove them first.`));
        if (readlineSync.keyInYNStrict(`Do you want to remove them? `)) {
          let data = investors.map(i => [i, blacklistName])
          let batches = common.splitIntoBatches(data, gbl.constants.DEFAULT_BATCH_SIZE);
          let [investorArray, blacklistNameArray] = common.transposeBatches(batches);
          for (let batch = 0; batch < batches.length; batch++) {
            console.log(`Batch ${batch + 1} - Attempting to remove the following investors:\n\n`, investorArray[batch], '\n');
            let action = currentTransferManager.methods.deleteMultiInvestorsFromBlacklistMulti(investorArray[batch], blacklistNameArray[batch]);
            let receipt = await common.sendTransaction(action);
            console.log(chalk.green('Remove investors from multiple blacklists transaction was successful.'));
            console.log(`${receipt.gasUsed} gas used.Spent: ${web3.utils.fromWei((new web3.utils.BN(receipt.gasUsed)).mul(new web3.utils.BN(defaultGasPrice)))} ETH`);
          }
          isEmpty = true;
        }
      }
      if (isEmpty) {
        let deleteBlacklistTypeAction = currentTransferManager.methods.deleteBlacklistType(blacklistName);
        let deleteBlacklistTypeReceipt = await common.sendTransaction(deleteBlacklistTypeAction);
        let deleteBlacklistTypeEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, deleteBlacklistTypeReceipt.logs, 'DeleteBlacklistType');
        console.log(chalk.green(`${web3.utils.hexToUtf8(deleteBlacklistTypeEvent._blacklistName)} blacklist type has been deleted successfully!`));
      }
      return;
    case 'RETURN':
      return;
  }

  await manageExistingBlacklist(blacklistName);
}

async function operateWithMultipleBlacklists(currentBlacklists) {
  let options = ['Add multiple blacklists'];
  if (currentBlacklists.length > 0) {
    options.push('Modify multiple blacklists');
  }
  options.push(
    'Delete multiple blacklists',
    'Add investors to multiple blacklists',
    'Remove investors from multiple blacklists'
  );

  let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'RETURN' });
  let optionSelected = index !== -1 ? options[index] : 'RETURN';
  console.log('Selected:', optionSelected, '\n');
  switch (optionSelected) {
    case 'Add multiple blacklists':
      await addBlacklistsInBatch();
      break;
    case 'Modify multiple blacklists':
      await modifyBlacklistsInBatch();
      break;
    case 'Delete multiple blacklists':
      await deleteBlacklistsInBatch();
      break;
    case 'Add investors to multiple blacklists':
      await addInvestorsToBlacklistsInBatch();
      break;
    case 'Remove investors from multiple blacklists':
      await removeInvestorsFromBlacklistsInBatch();
      break;
  }
}

async function addBlacklistsInBatch() {
  let csvFilePath = readlineSync.question(`Enter the path for csv data file (${ADD_BLACKLIST_DATA_CSV}): `, {
    defaultInput: ADD_BLACKLIST_DATA_CSV
  });
  let batchSize = readlineSync.question(`Enter the max number of records per transaction or batch size (${gbl.constants.DEFAULT_BATCH_SIZE}): `, {
    limit: function (input) {
      return parseInt(input) > 0;
    },
    limitMessage: 'Must be greater than 0',
    defaultInput: gbl.constants.DEFAULT_BATCH_SIZE
  });
  let parsedData = csvParse(csvFilePath);
  let validData = parsedData.filter(
    row => moment.unix(row[0]).isValid() &&
      moment.unix(row[1]).isValid() &&
      typeof row[2] === 'string' &&
      (!isNaN(row[3] && (parseFloat(row[3]) % 1 === 0))));
  let invalidRows = parsedData.filter(row => !validData.includes(row));
  if (invalidRows.length > 0) {
    console.log(chalk.red(`The following lines from csv file are not valid: ${invalidRows.map(r => parsedData.indexOf(r) + 1).join(',')} `));
  }
  let batches = common.splitIntoBatches(validData, batchSize);
  let [startTimeArray, endTimeArray, blacklistNameArray, repeatPeriodTimeArray] = common.transposeBatches(batches);
  for (let batch = 0; batch < batches.length; batch++) {
    console.log(`Batch ${batch + 1} - Attempting to add the following blacklists:\n\n`, blacklistNameArray[batch], '\n');
    blacklistNameArray[batch] = blacklistNameArray[batch].map(n => web3.utils.toHex(n));
    let action = currentTransferManager.methods.addBlacklistTypeMulti(startTimeArray[batch], endTimeArray[batch], blacklistNameArray[batch], repeatPeriodTimeArray[batch]);
    let receipt = await common.sendTransaction(action);
    console.log(chalk.green('Add multiple blacklists transaction was successful.'));
    console.log(`${receipt.gasUsed} gas used.Spent: ${web3.utils.fromWei((new web3.utils.BN(receipt.gasUsed)).mul(new web3.utils.BN(defaultGasPrice)))} ETH`);
  }
}

async function modifyBlacklistsInBatch() {
  let csvFilePath = readlineSync.question(`Enter the path for csv data file (${MODIFY_BLACKLIST_DATA_CSV}): `, {
    defaultInput: MODIFY_BLACKLIST_DATA_CSV
  });
  let batchSize = readlineSync.question(`Enter the max number of records per transaction or batch size (${gbl.constants.DEFAULT_BATCH_SIZE}): `, {
    limit: function (input) {
      return parseInt(input) > 0;
    },
    limitMessage: 'Must be greater than 0',
    defaultInput: gbl.constants.DEFAULT_BATCH_SIZE
  });
  let parsedData = csvParse(csvFilePath);
  let validData = parsedData.filter(
    row => moment.unix(row[0]).isValid() &&
      moment.unix(row[1]).isValid() &&
      typeof row[2] === 'string' &&
      (!isNaN(row[3] && (parseFloat(row[3]) % 1 === 0))));
  let invalidRows = parsedData.filter(row => !validData.includes(row));
  if (invalidRows.length > 0) {
    console.log(chalk.red(`The following lines from csv file are not valid: ${invalidRows.map(r => parsedData.indexOf(r) + 1).join(',')} `));
  }
  let batches = common.splitIntoBatches(validData, batchSize);
  let [startTimeArray, endTimeArray, blacklistNameArray, repeatPeriodTimeArray] = common.transposeBatches(batches);
  for (let batch = 0; batch < batches.length; batch++) {
    console.log(`Batch ${batch + 1} - Attempting to modify the following blacklists:\n\n`, blacklistNameArray[batch], '\n');
    blacklistNameArray[batch] = blacklistNameArray[batch].map(n => web3.utils.toHex(n));
    let action = currentTransferManager.methods.modifyBlacklistTypeMulti(startTimeArray[batch], endTimeArray[batch], blacklistNameArray[batch], repeatPeriodTimeArray[batch]);
    let receipt = await common.sendTransaction(action);
    console.log(chalk.green('Modify multiple blacklists transaction was successful.'));
    console.log(`${receipt.gasUsed} gas used.Spent: ${web3.utils.fromWei((new web3.utils.BN(receipt.gasUsed)).mul(new web3.utils.BN(defaultGasPrice)))} ETH`);
  }
}

async function deleteBlacklistsInBatch() {
  let csvFilePath = readlineSync.question(`Enter the path for csv data file (${DELETE_BLACKLIST_DATA_CSV}): `, {
    defaultInput: DELETE_BLACKLIST_DATA_CSV
  });
  let batchSize = readlineSync.question(`Enter the max number of records per transaction or batch size (${gbl.constants.DEFAULT_BATCH_SIZE}): `, {
    limit: function (input) {
      return parseInt(input) > 0;
    },
    limitMessage: 'Must be greater than 0',
    defaultInput: gbl.constants.DEFAULT_BATCH_SIZE
  });
  let parsedData = csvParse(csvFilePath);
  let validData = parsedData.filter(row => typeof row[0] === 'string');
  let invalidRows = parsedData.filter(row => !validData.includes(row));
  if (invalidRows.length > 0) {
    console.log(chalk.red(`The following lines from csv file are not valid: ${invalidRows.map(r => parsedData.indexOf(r) + 1).join(',')} `));
  }

  let verifiedData = [];
  let unverifiedData = [];
  for (const row of validData) {
    let blacklistName = row[0];
    let verifiedTransaction = (await currentTransferManager.methods.getListOfAddresses(web3.utils.toHex(blacklistName)).call()).length === 0;
    if (verifiedTransaction) {
      verifiedData.push(row);
    } else {
      unverifiedData.push(row);
    }
  }

  let batches = common.splitIntoBatches(verifiedData, batchSize);
  let [blacklistNameArray] = common.transposeBatches(batches);
  for (let batch = 0; batch < batches.length; batch++) {
    console.log(`Batch ${batch + 1} - Attempting to delete the following blacklists:\n\n`, blacklistNameArray[batch], '\n');
    blacklistNameArray[batch] = blacklistNameArray[batch].map(n => web3.utils.toHex(n));
    let action = currentTransferManager.methods.deleteBlacklistTypeMulti(blacklistNameArray[batch]);
    let receipt = await common.sendTransaction(action);
    console.log(chalk.green('Delete multiple blacklists transaction was successful.'));
    console.log(`${receipt.gasUsed} gas used.Spent: ${web3.utils.fromWei((new web3.utils.BN(receipt.gasUsed)).mul(new web3.utils.BN(defaultGasPrice)))} ETH`);
  }

  if (unverifiedData.length > 0) {
    console.log("*****************************************************************************************************************");
    console.log('The following data would failed as these blacklists have investors. They must be empty to be able to delete them.\n');
    console.log(chalk.red(unverifiedData.map(d => `${d[0]}`).join('\n')));
    console.log("*****************************************************************************************************************");
  }
}

async function addInvestorsToBlacklistsInBatch() {
  let csvFilePath = readlineSync.question(`Enter the path for csv data file (${ADD_INVESTOR_BLACKLIST_DATA_CSV}): `, {
    defaultInput: ADD_INVESTOR_BLACKLIST_DATA_CSV
  });
  let batchSize = readlineSync.question(`Enter the max number of records per transaction or batch size (${gbl.constants.DEFAULT_BATCH_SIZE}): `, {
    limit: function (input) {
      return parseInt(input) > 0;
    },
    limitMessage: 'Must be greater than 0',
    defaultInput: gbl.constants.DEFAULT_BATCH_SIZE
  });
  let parsedData = csvParse(csvFilePath);
  let validData = parsedData.filter(
    row => web3.utils.isAddress(row[0]) &&
      typeof row[1] === 'string');
  let invalidRows = parsedData.filter(row => !validData.includes(row));
  if (invalidRows.length > 0) {
    console.log(chalk.red(`The following lines from csv file are not valid: ${invalidRows.map(r => parsedData.indexOf(r) + 1).join(',')} `));
  }
  let batches = common.splitIntoBatches(validData, batchSize);
  let [investorArray, blacklistNameArray] = common.transposeBatches(batches);
  for (let batch = 0; batch < batches.length; batch++) {
    console.log(`Batch ${batch + 1} - Attempting to add the following investors:\n\n`, investorArray[batch], '\n');
    blacklistNameArray[batch] = blacklistNameArray[batch].map(n => web3.utils.toHex(n));
    let action = currentTransferManager.methods.addMultiInvestorToBlacklistMulti(investorArray[batch], blacklistNameArray[batch]);
    let receipt = await common.sendTransaction(action);
    console.log(chalk.green('Add investors to multiple blacklists transaction was successful.'));
    console.log(`${receipt.gasUsed} gas used.Spent: ${web3.utils.fromWei((new web3.utils.BN(receipt.gasUsed)).mul(new web3.utils.BN(defaultGasPrice)))} ETH`);
  }
}

async function removeInvestorsFromBlacklistsInBatch() {
  let csvFilePath = readlineSync.question(`Enter the path for csv data file (${REMOVE_INVESTOR_BLACKLIST_DATA_CSV}): `, {
    defaultInput: REMOVE_INVESTOR_BLACKLIST_DATA_CSV
  });
  let batchSize = readlineSync.question(`Enter the max number of records per transaction or batch size (${gbl.constants.DEFAULT_BATCH_SIZE}): `, {
    limit: function (input) {
      return parseInt(input) > 0;
    },
    limitMessage: 'Must be greater than 0',
    defaultInput: gbl.constants.DEFAULT_BATCH_SIZE
  });
  let parsedData = csvParse(csvFilePath);
  let validData = parsedData.filter(
    row => web3.utils.isAddress(row[0]) &&
      typeof row[1] === 'string');
  let invalidRows = parsedData.filter(row => !validData.includes(row));
  if (invalidRows.length > 0) {
    console.log(chalk.red(`The following lines from csv file are not valid: ${invalidRows.map(r => parsedData.indexOf(r) + 1).join(',')} `));
  }
  let batches = common.splitIntoBatches(validData, batchSize);
  let [investorArray, blacklistNameArray] = common.transposeBatches(batches);
  for (let batch = 0; batch < batches.length; batch++) {
    console.log(`Batch ${batch + 1} - Attempting to remove the following investors:\n\n`, investorArray[batch], '\n');
    blacklistNameArray[batch] = blacklistNameArray[batch].map(n => web3.utils.toHex(n));
    let action = currentTransferManager.methods.deleteMultiInvestorsFromBlacklistMulti(investorArray[batch], blacklistNameArray[batch]);
    let receipt = await common.sendTransaction(action);
    console.log(chalk.green('Remove investors from multiple blacklists transaction was successful.'));
    console.log(`${receipt.gasUsed} gas used.Spent: ${web3.utils.fromWei((new web3.utils.BN(receipt.gasUsed)).mul(new web3.utils.BN(defaultGasPrice)))} ETH`);
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

  console.log(`*** Current individual restrictions for ${holder} ***`, '\n');

  console.log(`- Daily restriction:    ${hasDailyRestriction ? '' : 'None'}`);
  if (hasDailyRestriction) {
    console.log(`     Type:                         ${RESTRICTION_TYPES[currentDailyRestriction.typeOfRestriction]}`);
    console.log(`     Allowed tokens:               ${currentDailyRestriction.typeOfRestriction === "0" ? `${web3.utils.fromWei(currentDailyRestriction.allowedTokens)} ${tokenSymbol}` : `${fromWeiPercentage(currentDailyRestriction.allowedTokens)}%`}`);
    console.log(`     Start time:                   ${moment.unix(currentDailyRestriction.startTime).format('MMMM Do YYYY, HH:mm:ss')}`);
    console.log(`     Rolling period:               ${currentDailyRestriction.rollingPeriodInDays} days`);
    console.log(`     End time:                     ${moment.unix(currentDailyRestriction.endTime).format('MMMM Do YYYY, HH:mm:ss')} `);
  }
  console.log(`- Other restriction: ${hasRestriction ? '' : 'None'} `);
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

async function exploreAccount() {
  let account = readlineSync.question('Enter the account to explore: ', {
    limit: function (input) {
      return web3.utils.isAddress(input);
    },
    limitMessage: "Must be a valid address"
  });

  let appliyngdDailyRestriction = null;
  let applyingOtherRestriction = null;
  let hasIndividualRestrictions = false;
  let isExempted = await currentTransferManager.methods.exemptList(account).call();
  if (!isExempted) {
    let indiviaulDailyRestriction = await currentTransferManager.methods.individualDailyRestriction(account).call();
    if (parseInt(indiviaulDailyRestriction.endTime) !== 0) {
      appliyngdDailyRestriction = indiviaulDailyRestriction;
    }
    let otherRestriction = await currentTransferManager.methods.individualRestriction(account).call();
    if (parseInt(otherRestriction.endTime) !== 0) {
      applyingOtherRestriction = otherRestriction;
    }

    hasIndividualRestrictions = applyingOtherRestriction || appliyngdDailyRestriction;

    if (!hasIndividualRestrictions) {
      let defaultDailyRestriction = await currentTransferManager.methods.defaultDailyRestriction().call();
      if (parseInt(defaultDailyRestriction.endTime) !== 0) {
        appliyngdDailyRestriction = defaultDailyRestriction;
      }
      let defaultOtherRestriction = await currentTransferManager.methods.defaultRestriction().call();
      if (parseInt(defaultOtherRestriction.endTime) === 0) {
        applyingOtherRestriction = defaultOtherRestriction;
      }
    }
  }

  console.log(`*** Applying restrictions for ${account} ***`, '\n');

  console.log(`- Daily restriction:       ${appliyngdDailyRestriction ? (!hasIndividualRestrictions ? 'default' : '') : 'None'}`);
  if (appliyngdDailyRestriction) {
    console.log(`     Type:                 ${RESTRICTION_TYPES[appliyngdDailyRestriction.typeOfRestriction]}`);
    console.log(`     Allowed tokens:       ${appliyngdDailyRestriction.typeOfRestriction === "0" ? `${web3.utils.fromWei(appliyngdDailyRestriction.allowedTokens)} ${tokenSymbol}` : `${fromWeiPercentage(appliyngdDailyRestriction.allowedTokens)}%`}`);
    console.log(`     Start time:           ${moment.unix(appliyngdDailyRestriction.startTime).format('MMMM Do YYYY, HH:mm:ss')}`);
    console.log(`     Rolling period:       ${appliyngdDailyRestriction.rollingPeriodInDays} days`);
    console.log(`     End time:             ${moment.unix(appliyngdDailyRestriction.endTime).format('MMMM Do YYYY, HH:mm:ss')} `);
  }
  console.log(`- Other restriction:       ${applyingOtherRestriction ? (!hasIndividualRestrictions ? 'default' : '') : 'None'} `);
  if (applyingOtherRestriction) {
    console.log(`     Type:                 ${RESTRICTION_TYPES[applyingOtherRestriction.typeOfRestriction]}`);
    console.log(`     Allowed tokens:       ${applyingOtherRestriction.typeOfRestriction === "0" ? `${web3.utils.fromWei(applyingOtherRestriction.allowedTokens)} ${tokenSymbol}` : `${fromWeiPercentage(applyingOtherRestriction.allowedTokens)}%`}`);
    console.log(`     Start time:           ${moment.unix(applyingOtherRestriction.startTime).format('MMMM Do YYYY, HH:mm:ss')}`);
    console.log(`     Rolling period:       ${applyingOtherRestriction.rollingPeriodInDays} days`);
    console.log(`     End time:             ${moment.unix(applyingOtherRestriction.endTime).format('MMMM Do YYYY, HH:mm:ss')} `);
  }

  if (applyingOtherRestriction || appliyngdDailyRestriction) {
    let bucketDetails;
    if (hasIndividualRestrictions) {
      bucketDetails = await currentTransferManager.methods.getIndividualBucketDetailsToUser(account).call();
    } else {
      bucketDetails = await currentTransferManager.methods.getDefaultBucketDetailsToUser(account).call();
    }
    let now = Math.floor(Date.now() / 1000) - gbl.constants.DURATION.days(1);
    let tradedByUserLastDay = await currentTransferManager.methods.getTotalTradedByUser(account, now).call();
    console.log();
    console.log(`Last trade:                                        ${bucketDetails[0]}`);
    console.log(`Last daily trade:                                  ${bucketDetails[3]}`);
    console.log(`Days since rolling period started:                 ${bucketDetails[2]}`);
    console.log(`Transacted amount since rolling period started:    ${web3.utils.fromWei(bucketDetails[1])}`);
    console.log(`Transacted amount within last 24 hours:            ${web3.utils.fromWei(tradedByUserLastDay)}`);
    console.log();
  }
}

async function operateWithMultipleRestrictions() {
  let options = [
    'Add multiple individual daily restrictions',
    'Modify multiple individual daily restrictions',
    'Remove multiple individual daily restrictions',
    'Add multiple individual restrictions',
    'Modify multiple individual restrictions',
    'Remove multiple individual restrictions'
  ];

  let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'RETURN' });
  let optionSelected = index !== -1 ? options[index] : 'RETURN';
  console.log('Selected:', optionSelected, '\n');
  switch (optionSelected) {
    case 'Add multiple individual daily restrictions':
      await addDailyRestrictionsInBatch();
      break;
    case 'Modify multiple individual daily restrictions':
      await modifyDailyRestrictionsInBatch();
      break;
    case 'Remove multiple individual daily restrictions':
      await removeDailyRestrictionsInBatch();
      break;
    case 'Add multiple individual restrictions':
      await addRestrictionsInBatch();
      break;
    case 'Modify multiple individual restrictions':
      await modifyRestrictionsInBatch();
      break;
    case 'Remove multiple individual restrictions':
      await removeRestrictionsInBatch();
      break;
  }
}

async function addDailyRestrictionsInBatch() {
  let csvFilePath = readlineSync.question(`Enter the path for csv data file (${ADD_DAILY_RESTRICTIONS_DATA_CSV}): `, {
    defaultInput: ADD_DAILY_RESTRICTIONS_DATA_CSV
  });
  let batchSize = readlineSync.question(`Enter the max number of records per transaction or batch size (${gbl.constants.DEFAULT_BATCH_SIZE}): `, {
    limit: function (input) {
      return parseInt(input) > 0;
    },
    limitMessage: 'Must be greater than 0',
    defaultInput: gbl.constants.DEFAULT_BATCH_SIZE
  });
  let parsedData = csvParse(csvFilePath);
  let validData = parsedData.filter(
    row => web3.utils.isAddress(row[0]) &&
      !isNaN(row[1]) &&
      moment.unix(row[2]).isValid() &&
      moment.unix(row[3]).isValid() &&
      typeof row[4] === 'string' && RESTRICTION_TYPES.includes(row[4]));
  let invalidRows = parsedData.filter(row => !validData.includes(row));
  if (invalidRows.length > 0) {
    console.log(chalk.red(`The following lines from csv file are not valid: ${invalidRows.map(r => parsedData.indexOf(r) + 1).join(',')} `));
  }
  let batches = common.splitIntoBatches(validData, batchSize);
  let [holderArray, allowanceArray, startTimeArray, endTimeArray, restrictionTypeArray] = common.transposeBatches(batches);
  for (let batch = 0; batch < batches.length; batch++) {
    console.log(`Batch ${batch + 1} - Attempting to add daily restrictions to the following accounts: \n\n`, holderArray[batch], '\n');
    allowanceArray[batch] = allowanceArray[batch].map(n => web3.utils.toWei(n.toString()));
    restrictionTypeArray[batch] = restrictionTypeArray[batch].map(n => RESTRICTION_TYPES.indexOf(n));
    let action = currentTransferManager.methods.addIndividualDailyRestrictionMulti(holderArray[batch], allowanceArray[batch], startTimeArray[batch], endTimeArray[batch], restrictionTypeArray[batch]);
    let receipt = await common.sendTransaction(action);
    console.log(chalk.green('Add multiple daily restrictions transaction was successful.'));
    console.log(`${receipt.gasUsed} gas used.Spent: ${web3.utils.fromWei((new web3.utils.BN(receipt.gasUsed)).mul(new web3.utils.BN(defaultGasPrice)))} ETH`);
  }
}

async function modifyDailyRestrictionsInBatch() {
  let csvFilePath = readlineSync.question(`Enter the path for csv data file (${MODIFY_DAILY_RESTRICTIONS_DATA_CSV}): `, {
    defaultInput: MODIFY_DAILY_RESTRICTIONS_DATA_CSV
  });
  let batchSize = readlineSync.question(`Enter the max number of records per transaction or batch size (${gbl.constants.DEFAULT_BATCH_SIZE}): `, {
    limit: function (input) {
      return parseInt(input) > 0;
    },
    limitMessage: 'Must be greater than 0',
    defaultInput: gbl.constants.DEFAULT_BATCH_SIZE
  });
  let parsedData = csvParse(csvFilePath);
  let validData = parsedData.filter(
    row => web3.utils.isAddress(row[0]) &&
      !isNaN(row[1]) &&
      moment.unix(row[2]).isValid() &&
      moment.unix(row[3]).isValid() &&
      typeof row[4] === 'string' && RESTRICTION_TYPES.includes(row[4]));
  let invalidRows = parsedData.filter(row => !validData.includes(row));
  if (invalidRows.length > 0) {
    console.log(chalk.red(`The following lines from csv file are not valid: ${invalidRows.map(r => parsedData.indexOf(r) + 1).join(',')} `));
  }
  let batches = common.splitIntoBatches(validData, batchSize);
  let [holderArray, allowanceArray, startTimeArray, endTimeArray, restrictionTypeArray] = common.transposeBatches(batches);
  for (let batch = 0; batch < batches.length; batch++) {
    console.log(`Batch ${batch + 1} - Attempting to modify daily restrictions to the following accounts: \n\n`, holderArray[batch], '\n');
    allowanceArray[batch] = allowanceArray[batch].map(n => web3.utils.toWei(n.toString()));
    restrictionTypeArray[batch] = restrictionTypeArray[batch].map(n => RESTRICTION_TYPES.indexOf(n));
    let action = currentTransferManager.methods.modifyIndividualDailyRestrictionMulti(holderArray[batch], allowanceArray[batch], startTimeArray[batch], endTimeArray[batch], restrictionTypeArray[batch]);
    let receipt = await common.sendTransaction(action);
    console.log(chalk.green('Modify multiple daily restrictions transaction was successful.'));
    console.log(`${receipt.gasUsed} gas used.Spent: ${web3.utils.fromWei((new web3.utils.BN(receipt.gasUsed)).mul(new web3.utils.BN(defaultGasPrice)))} ETH`);
  }
}

async function removeDailyRestrictionsInBatch() {
  let csvFilePath = readlineSync.question(`Enter the path for csv data file (${REMOVE_DAILY_RESTRICTIONS_DATA_CSV}): `, {
    defaultInput: REMOVE_DAILY_RESTRICTIONS_DATA_CSV
  });
  let batchSize = readlineSync.question(`Enter the max number of records per transaction or batch size (${gbl.constants.DEFAULT_BATCH_SIZE}): `, {
    limit: function (input) {
      return parseInt(input) > 0;
    },
    limitMessage: 'Must be greater than 0',
    defaultInput: gbl.constants.DEFAULT_BATCH_SIZE
  });
  let parsedData = csvParse(csvFilePath);
  let validData = parsedData.filter(row => web3.utils.isAddress(row[0]));
  let invalidRows = parsedData.filter(row => !validData.includes(row));
  if (invalidRows.length > 0) {
    console.log(chalk.red(`The following lines from csv file are not valid: ${invalidRows.map(r => parsedData.indexOf(r) + 1).join(',')} `));
  }
  let batches = common.splitIntoBatches(validData, batchSize);
  let [holderArray] = common.transposeBatches(batches);
  for (let batch = 0; batch < batches.length; batch++) {
    console.log(`Batch ${batch + 1} - Attempting to remove daily restrictions to the following accounts: \n\n`, holderArray[batch], '\n');
    let action = currentTransferManager.methods.removeIndividualDailyRestrictionMulti(holderArray[batch]);
    let receipt = await common.sendTransaction(action);
    console.log(chalk.green('Remove multiple daily restrictions transaction was successful.'));
    console.log(`${receipt.gasUsed} gas used.Spent: ${web3.utils.fromWei((new web3.utils.BN(receipt.gasUsed)).mul(new web3.utils.BN(defaultGasPrice)))} ETH`);
  }
}

async function addRestrictionsInBatch() {
  let csvFilePath = readlineSync.question(`Enter the path for csv data file (${ADD_RESTRICTIONS_DATA_CSV}): `, {
    defaultInput: ADD_RESTRICTIONS_DATA_CSV
  });
  let batchSize = readlineSync.question(`Enter the max number of records per transaction or batch size (${gbl.constants.DEFAULT_BATCH_SIZE}): `, {
    limit: function (input) {
      return parseInt(input) > 0;
    },
    limitMessage: 'Must be greater than 0',
    defaultInput: gbl.constants.DEFAULT_BATCH_SIZE
  });
  let parsedData = csvParse(csvFilePath);
  let validData = parsedData.filter(
    row => web3.utils.isAddress(row[0]) &&
      !isNaN(row[1]) &&
      moment.unix(row[2]).isValid() &&
      (!isNaN(row[3]) && (parseFloat(row[3]) % 1 === 0)) &&
      moment.unix(row[4]).isValid() &&
      typeof row[5] === 'string' && RESTRICTION_TYPES.includes(row[5]));
  let invalidRows = parsedData.filter(row => !validData.includes(row));
  if (invalidRows.length > 0) {
    console.log(chalk.red(`The following lines from csv file are not valid: ${invalidRows.map(r => parsedData.indexOf(r) + 1).join(',')} `));
  }
  let batches = common.splitIntoBatches(validData, batchSize);
  let [holderArray, allowanceArray, startTimeArray, rollingPeriodArray, endTimeArray, restrictionTypeArray] = common.transposeBatches(batches);
  for (let batch = 0; batch < batches.length; batch++) {
    console.log(`Batch ${batch + 1} - Attempting to add restrictions to the following accounts: \n\n`, holderArray[batch], '\n');
    allowanceArray[batch] = allowanceArray[batch].map(n => web3.utils.toWei(n.toString()));
    restrictionTypeArray[batch] = restrictionTypeArray[batch].map(n => RESTRICTION_TYPES.indexOf(n));
    let action = currentTransferManager.methods.addIndividualRestrictionMulti(holderArray[batch], allowanceArray[batch], startTimeArray[batch], rollingPeriodArray[batch], endTimeArray[batch], restrictionTypeArray[batch]);
    let receipt = await common.sendTransaction(action);
    console.log(chalk.green('Add multiple restrictions transaction was successful.'));
    console.log(`${receipt.gasUsed} gas used.Spent: ${web3.utils.fromWei((new web3.utils.BN(receipt.gasUsed)).mul(new web3.utils.BN(defaultGasPrice)))} ETH`);
  }
}

async function modifyRestrictionsInBatch() {
  let csvFilePath = readlineSync.question(`Enter the path for csv data file (${MODIFY_RESTRICTIONS_DATA_CSV}): `, {
    defaultInput: MODIFY_RESTRICTIONS_DATA_CSV
  });
  let batchSize = readlineSync.question(`Enter the max number of records per transaction or batch size (${gbl.constants.DEFAULT_BATCH_SIZE}): `, {
    limit: function (input) {
      return parseInt(input) > 0;
    },
    limitMessage: 'Must be greater than 0',
    defaultInput: gbl.constants.DEFAULT_BATCH_SIZE
  });
  let parsedData = csvParse(csvFilePath);
  let validData = parsedData.filter(
    row => web3.utils.isAddress(row[0]) &&
      !isNaN(row[1]) &&
      moment.unix(row[2]).isValid() &&
      (!isNaN(row[3]) && (parseFloat(row[3]) % 1 === 0)) &&
      moment.unix(row[4]).isValid() &&
      typeof row[5] === 'string' && RESTRICTION_TYPES.includes(row[5]));
  let invalidRows = parsedData.filter(row => !validData.includes(row));
  if (invalidRows.length > 0) {
    console.log(chalk.red(`The following lines from csv file are not valid: ${invalidRows.map(r => parsedData.indexOf(r) + 1).join(',')} `));
  }
  let batches = common.splitIntoBatches(validData, batchSize);
  let [holderArray, allowanceArray, startTimeArray, rollingPeriodArray, endTimeArray, restrictionTypeArray] = common.transposeBatches(batches);
  for (let batch = 0; batch < batches.length; batch++) {
    console.log(`Batch ${batch + 1} - Attempting to modify restrictions to the following accounts: \n\n`, holderArray[batch], '\n');
    allowanceArray[batch] = allowanceArray[batch].map(n => web3.utils.toWei(n.toString()));
    restrictionTypeArray[batch] = restrictionTypeArray[batch].map(n => RESTRICTION_TYPES.indexOf(n));
    let action = currentTransferManager.methods.modifyIndividualRestrictionMulti(holderArray[batch], allowanceArray[batch], startTimeArray[batch], rollingPeriodArray[batch], endTimeArray[batch], restrictionTypeArray[batch]);
    let receipt = await common.sendTransaction(action);
    console.log(chalk.green('Modify multiple restrictions transaction was successful.'));
    console.log(`${receipt.gasUsed} gas used.Spent: ${web3.utils.fromWei((new web3.utils.BN(receipt.gasUsed)).mul(new web3.utils.BN(defaultGasPrice)))} ETH`);
  }
}

async function removeRestrictionsInBatch() {
  let csvFilePath = readlineSync.question(`Enter the path for csv data file (${REMOVE_RESTRICTIONS_DATA_CSV}): `, {
    defaultInput: REMOVE_RESTRICTIONS_DATA_CSV
  });
  let batchSize = readlineSync.question(`Enter the max number of records per transaction or batch size (${gbl.constants.DEFAULT_BATCH_SIZE}): `, {
    limit: function (input) {
      return parseInt(input) > 0;
    },
    limitMessage: 'Must be greater than 0',
    defaultInput: gbl.constants.DEFAULT_BATCH_SIZE
  });
  let parsedData = csvParse(csvFilePath);
  let validData = parsedData.filter(row => web3.utils.isAddress(row[0]));
  let invalidRows = parsedData.filter(row => !validData.includes(row));
  if (invalidRows.length > 0) {
    console.log(chalk.red(`The following lines from csv file are not valid: ${invalidRows.map(r => parsedData.indexOf(r) + 1).join(',')} `));
  }
  let batches = common.splitIntoBatches(validData, batchSize);
  let [holderArray] = common.transposeBatches(batches);
  for (let batch = 0; batch < batches.length; batch++) {
    console.log(`Batch ${batch + 1} - Attempting to remove restrictions to the following accounts: \n\n`, holderArray[batch], '\n');
    let action = currentTransferManager.methods.removeIndividualRestrictionMulti(holderArray[batch]);
    let receipt = await common.sendTransaction(action);
    console.log(chalk.green('Remove multiple restrictions transaction was successful.'));
    console.log(`${receipt.gasUsed} gas used.Spent: ${web3.utils.fromWei((new web3.utils.BN(receipt.gasUsed)).mul(new web3.utils.BN(defaultGasPrice)))} ETH`);
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
      let abiTemp = JSON.parse(require('fs').readFileSync(`${__dirname}/../../build/contracts/${nameTemp}.json`).toString()).abi;
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

  let index = readlineSync.keyInSelect(options, 'Select a token:', { cancel: 'EXIT' });
  let selected = index !== -1 ? options[index] : 'EXIT';
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
    return addTransferManagerModule();
  },
  modifyWhitelistInBatch: async function (_tokenSymbol, _csvFilePath, _batchSize) {
    await initialize(_tokenSymbol);
    let gmtModules = await securityToken.methods.getModulesByName(web3.utils.toHex('GeneralTransferManager')).call();
    let generalTransferManagerAddress = gmtModules[0];
    currentTransferManager = new web3.eth.Contract(abis.generalTransferManager(), generalTransferManagerAddress);
    currentTransferManager.setProvider(web3.currentProvider);
    return modifyWhitelistInBatch(_csvFilePath, _batchSize);
  }
}