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
const ADD_MANUAL_APPROVAL_DATA_CSV = './CLI/data/Transfer/MATM/manualapproval_data.csv';
const MODIFY_MANUAL_APPROVAL_DATA_CSV = './CLI/data/Transfer/MATM/modify_manualapproval_data.csv';
const REVOKE_MANUAL_APPROVAL_DATA_CSV = './CLI/data/Transfer/MATM/revoke_manualapproval_data.csv';
const ZERO = '0x0000000000000000000000000000000000000000';
const MATM_ADD = 'Add new manual approval';
const MATM_MANAGE = 'Manage existing approvals';
const MATM_EXPLORE = 'Explore account';
const MATM_OPERATE = 'Operate with multiple approvals';
const MATM_MANAGE_INCRESE = 'Increase allowance';
const MATM_MANAGE_DECREASE = 'Decrease allowance';
const MATM_MANAGE_TIME = 'Modify expiry time';
const MATM_MANAGE_REVOKE = 'Revoke this approval';
const MATM_OPERATE_ADD = 'Add multiple approvals in batch';
const MATM_OPERATE_MODIFY = 'Modify multiple approvals in batch';
const MATM_OPERATE_REVOKE = 'Revoke multiple approvals in batch';


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
      let fromTime = readlineSync.questionInt(`Enter the time(Unix Epoch time) when the sale lockup period ends and the investor can freely sell his tokens(now = ${now}): `, { defaultInput: now });
      let toTime = readlineSync.questionInt(`Enter the time(Unix Epoch time) when the purchase lockup period ends and the investor can freely purchase tokens from others(now = ${now}): `, { defaultInput: now });
      let oneHourFromNow = Math.floor(Date.now() / 1000 + 3600);
      let expiryTime = readlineSync.questionInt(`Enter the time till investors KYC will be validated(after that investor need to do re - KYC) (1 hour from now = ${oneHourFromNow}): `, { defaultInput: oneHourFromNow });
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

  let matmOptions = [
    MATM_ADD,
    MATM_MANAGE,
    MATM_EXPLORE,
    MATM_OPERATE
  ];

  let index = readlineSync.keyInSelect(matmOptions, 'What do you want to do?', {
    cancel: 'Return'
  });
  let optionSelected = matmOptions[index];
  console.log('Selected:', index != -1 ? optionSelected : 'Return', '\n');

  switch (optionSelected) {
    case MATM_ADD:
      await matmAdd();
      break;
    case MATM_MANAGE:
      await matmManage();
      break;
    case MATM_EXPLORE:
      await matmExplore();
      break;
    case MATM_OPERATE:
      await matmOperate();
      break;
  }
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
  let description = readlineSync.question('Enter the description about the manual approval: ', {
    limit: function (input) {
      return input != "" && getBinarySize(input) < 33
    },
    limitMessage: "Description is required"
  });
  if (!await getManualApproval(from, to)) {
    let allowance = readlineSync.question('Enter the amount of tokens which will be approved: ');
    let oneHourFromNow = Math.floor(Date.now() / 1000 + 3600);
    let expiryTime = readlineSync.questionInt(`Enter the time(Unix Epoch time) until which the transfer is allowed(1 hour from now = ${oneHourFromNow}): `, { defaultInput: oneHourFromNow });
    let addManualApprovalAction = currentTransferManager.methods.addManualApproval(from, to, web3.utils.toWei(allowance), expiryTime, web3.utils.fromAscii(description));
    let addManualApprovalReceipt = await common.sendTransaction(addManualApprovalAction);
    let addManualApprovalEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, addManualApprovalReceipt.logs, 'AddManualApproval');
    console.log(chalk.green(`Manual approval has been added successfully!`));
  } else {
    console.log(chalk.red(`A manual approval already exists from ${from} to ${to}. Revoke it first if you want to add a new one.`));
  }
}

async function matmManage() {

  let manageOptions = [
    MATM_MANAGE_INCRESE,
    MATM_MANAGE_DECREASE,
    MATM_MANAGE_TIME,
    MATM_MANAGE_REVOKE
  ];

  let getApprovals = await getApprovalsArray();

  let options = []
  getApprovals.forEach((item) => {
    options.push(`From ${item.from} to ${item.to}`)
  })

  let index = readlineSync.keyInSelect(options, 'What do you want to do?', {
    cancel: 'Return'
  });
  let optionSelected = options[index];
  console.log('Selected:', index != -1 ? optionSelected : 'Return', '\n');

  let index2 = readlineSync.keyInSelect(manageOptions, 'What do you want to do?', {
    cancel: 'Return'
  });
  let optionSelected2 = manageOptions[index2];
  console.log('Selected:', index2 != -1 ? optionSelected2 : 'Return', '\n');

  const addrs = optionSelected.replace("From ", "").replace(" to ", ",").split(',');

  switch (optionSelected2) {
    case MATM_MANAGE_INCRESE:
      await matmManageIncrese(addrs[0], addrs[1]);
      break;
    case MATM_MANAGE_DECREASE:
      await matmManageDecrease(addrs[0], addrs[1]);
      break;
    case MATM_MANAGE_TIME:
      await matmManageTime(addrs[0], addrs[1]);
      break;
    case MATM_MANAGE_REVOKE:
      await matmManageRevoke(addrs[0], addrs[1]);
      break;
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
    MATM_OPERATE_ADD,
    MATM_OPERATE_MODIFY,
    MATM_OPERATE_REVOKE
  ];

  let index = readlineSync.keyInSelect(operateOptions, 'What do you want to do?', {
    cancel: 'Return'
  });
  let optionSelected = operateOptions[index];
  console.log('Selected:', index != -1 ? optionSelected : 'Return', '\n');

  switch (optionSelected) {
    case MATM_OPERATE_ADD:
      await addManualApproveInBatch();
      break;
    case MATM_OPERATE_MODIFY:
      await modifyManualApproveInBatch();
      break;
    case MATM_OPERATE_REVOKE:
      await revokeManualApproveInBatch();
      break;
  }
}

async function getApprovalDetail(from, to) {
  let detail = await currentTransferManager.methods.getApprovalDetails(from, to).call();
  return {
    "expiryTime": detail[0],
    "allowance": detail[1],
    "description": detail[2]
  }
}

async function matmManageIncrese(from, to) {
  let detail = await getApprovalDetail(from, to)
  let allowance = readlineSync.question(`Enter a value to increased allowance: `, {
    limit: function (input) {
      return parseFloat(input) > 0
    },
    limitMessage: "Amount must be bigger than 0"
  });

  let modifyManualApprovalAction = currentTransferManager.methods.modifyManualApproval(from, to, parseInt(detail.expiryTime), web3.utils.toWei(allowance), detail.description, 1);
  await common.sendTransaction(modifyManualApprovalAction);
  console.log(chalk.green(`The row has been modify successfully!`));
}

async function matmManageDecrease(from, to) {
  let detail = await getApprovalDetail(from, to);
  let allowance = readlineSync.question(`Enter a value to decrease allowance: `, {
    limit: function (input) {
      return parseFloat(input) > 0
    },
    limitMessage: "Amount must be bigger than 0"
  });

  let modifyManualApprovalAction = currentTransferManager.methods.modifyManualApproval(from, to, parseInt(detail.expiryTime), web3.utils.toWei(allowance), detail.description, 0);
  await common.sendTransaction(modifyManualApprovalAction);
  console.log(chalk.green(`The row has been modify successfully!`));
}

async function matmManageTime(from, to) {
  let detail = await getApprovalDetail(from, to);
  let expiryTime = readlineSync.questionInt(`Enter the new time(Unix Epoch time) until which the transfer is allowed: `, {
    limit: function (input) {
      return parseFloat(input) > 0
    },
    limitMessage: "Enter Unix Epoch time"
  });

  let modifyManualApprovalAction = currentTransferManager.methods.modifyManualApproval(from, to, parseInt(expiryTime), detail.allowance, detail.description, 2);
  await common.sendTransaction(modifyManualApprovalAction);
  console.log(chalk.green(`The row has been modify successfully!`));
}

async function matmManageRevoke(from, to) {
  let modifyManualApprovalAction = currentTransferManager.methods.revokeManualApproval(from, to);
  await common.sendTransaction(modifyManualApprovalAction);
  console.log(chalk.green(`The row has been revoke successfully!`));
}

async function getApprovalsArray() {
  let address = readlineSync.question('Enter an address to filter or leave empty to get all the rows: ', {
    limit: function (input) {
      return web3.utils.isAddress(input);
    },
    limitMessage: "Must be a valid address",
    defaultInput: ZERO
  });
  if (address == ZERO) {
    return await getApprovals();
  } else {
    let approvalsIndex = await getApprovalsToAnAddress(address);
    if (!approvalsIndex.length) {
      console.log(chalk.red(`\nThe address is not listed\n`))
    }
    return await processApprovalsArray(approvalsIndex)
  }
}

async function processApprovalsArray(array) {
  let result = []
  for (const item in array) {
    let ap = await currentTransferManager.methods.approvals(item).call();
    result.push(ap)
  };
  return result
}

function printMatmRow(from, to, allowance, time, description) {
  console.log(`\nFrom ${from} to ${to}\nAllowance: ${web3.utils.fromWei(allowance)}\nExpiry time: ${moment.unix(time).format('MMMM Do YYYY')}\nDescription: ${web3.utils.toAscii(description)}\n\n`);
}

async function getApprovals() {
  let totalApprovals = await currentTransferManager.methods.getTotalApprovalsLength().call();
  let results = [];
  for (let i = 0; i < totalApprovals; i++) { 
    results.push(await currentTransferManager.methods.approvals(i).call());
  }
  return results;
}

async function getApprovalsToAnAddress(address) {
  return await currentTransferManager.methods.getActiveApprovalsToUser(address).call();
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
    console.log(chalk.green('Add manual approval transaction was successful.'));
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
    console.log(chalk.green('Revoke manual approval transaction was successful.'));
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
    console.log(chalk.green('Modify manual approval transaction was successful.'));
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

async function singleTradeVolumeRestrictionTM() {
  console.log(chalk.blue(`Single Trade Volume Restriction Transfer Manager at ${currentTransferManager.options.address} `));
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

  console.log(`- Limit type: ${displayIsInPercentage ? `Percentage` : `Tokens`} `);
  console.log(`- Default transfer limit: ${displayGlobalTransferLimit} ${displayIsInPercentage ? `%` : `${tokenSymbol}`} `);
  console.log(`- Allow primary issuance: ${displayAllowPrimaryIssuance ? `YES` : `NO`} `);
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
      console.log(chalk.green(`The default transfer limit is ${web3.utils.fromWei(changeTransferLimitToTokensEvent._amount)} ${tokenSymbol} `));
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
      console.log(chalk.green(`The default transfer limit is ${fromWeiPercentage(changeTransferLimitToPercentageEvent._percentage)} % `));
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
      console.log(chalk.green(`The default transfer limit is ${fromWeiPercentage(changeGlobalLimitInPercentageEvent._percentage)} % `));
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
      console.log(chalk.green(`The default transfer limit is ${web3.utils.fromWei(changeGlobalLimitInTokensEvent._amount)} ${tokenSymbol} `));
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
      console.log(chalk.green(`The transfer limit for ${setTransferLimitInPercentageEvent._wallet} is ${fromWeiPercentage(setTransferLimitInPercentageEvent._percentage)} % `));
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
      console.log(chalk.green(`The transfer limit for ${setTransferLimitInTokensEvent._wallet} is ${web3.utils.fromWei(setTransferLimitInTokensEvent._amount)} ${tokenSymbol} `));
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
  console.log(chalk.yellow(`Total investors at the moment: ${investorsCount}`));
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