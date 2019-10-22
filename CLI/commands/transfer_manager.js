const readlineSync = require('readline-sync');
const chalk = require('chalk');
const moment = require('moment');
const common = require('./common/common_functions');
const contracts = require('./helpers/contract_addresses');
const abis = require('./helpers/contract_abis');
const gbl = require('./common/global');
const csvParse = require('./helpers/csv');
const input = require('./IO/input');
const output = require('./IO/output');
const { table } = require('table');

// Constants
const WHITELIST_DATA_CSV = `${__dirname}/../data/Transfer/GTM/whitelist_data.csv`;
const FLAG_DATA_CSV = `${__dirname}/../data/Transfer/GTM/flag_data.csv`;
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
const ADD_CUSTOM_RESTRICTIONS_DATA_CSV = `${__dirname}/../data/Transfer/VRTM/add_custom_restriction_data.csv`;
const MODIFY_CUSTOM_RESTRICTIONS_DATA_CSV = `${__dirname}/../data/Transfer/VRTM/modify_custom_restriction_data.csv`;
const REMOVE_CUSTOM_RESTRICTIONS_DATA_CSV = `${__dirname}/../data/Transfer/VRTM/remove_custom_restriction_data.csv`;
const ADD_LOCKUP_DATA_CSV = `${__dirname}/../data/Transfer/LockupTM/add_lockup_data.csv`;
const MODIFY_LOCKUP_DATA_CSV = `${__dirname}/../data/Transfer/LockupTM/modify_lockup_data.csv`;
const DELETE_LOCKUP_DATA_CSV = `${__dirname}/../data/Transfer/LockupTM/delete_lockup_data.csv`;
const ADD_LOCKUP_INVESTOR_DATA_CSV = `${__dirname}/../data/Transfer/LockupTM/add_lockup_investor_data.csv`;
const REMOVE_LOCKUP_INVESTOR_DATA_CSV = `${__dirname}/../data/Transfer/LockupTM/remove_lockup_investor_data.csv`;

const RESTRICTION_TYPES = ['Fixed', 'Percentage'];

const MATM_MENU_VERIFY = 'Verify transfer';
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
let polyToken;
let securityTokenRegistry;
let moduleRegistry;
let currentTransferManager;

async function executeApp() {
  console.log('\n', chalk.blue('Transfer Manager - Main Menu', '\n'));

  let tmModules = await common.getAllModulesByType(securityToken, gbl.constants.MODULES_TYPES.TRANSFER);
  let nonArchivedModules = tmModules.filter(m => !m.archived);
  if (nonArchivedModules.length > 0) {
    console.log(`Transfer Manager modules attached:`);
    nonArchivedModules.map(m => `${m.label}: ${m.name} (${m.version}) at ${m.address}`);
  } else {
    console.log(`There are no Transfer Manager modules attached`);
  }

  let options = ['Verify transfer', 'Transfer', 'Operator transfer'];
  let forcedTransferDisabled = await securityToken.methods.controllerDisabled().call();
  if (!forcedTransferDisabled) {
    options.push('Controller transfers');
  }
  options.push('Manage operators');
  if (nonArchivedModules.length > 0) {
    options.push('Config existing modules');
  }
  options.push('Add new Transfer Manager module');

  let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'EXIT' });
  let optionSelected = index != -1 ? options[index] : 'EXIT';
  console.log('Selected:', optionSelected, '\n');
  switch (optionSelected) {
    case 'Verify transfer':
      await canTransfer();
      break;
    case 'Transfer':
      let totalSupply = web3.utils.fromWei(await securityToken.methods.totalSupply().call());
      await logTotalInvestors();
      await logBalance(Issuer.address, totalSupply);
      let transferTo = input.readAddress('Enter beneficiary of tranfer: ');
      await logBalance(transferTo, totalSupply);
      let transferAmount = readlineSync.question('Enter amount of tokens to transfer: ');
      let isTranferVerified = await securityToken.methods.canTransferFrom(Issuer.address, transferTo, web3.utils.toWei(transferAmount), web3.utils.fromAscii("")).call();
      if (isTranferVerified[0] !== gbl.constants.TRASFER_RESULT.INVALID) {
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
    case 'Operator transfer':
      await operatorTransfer();
      break;
    case 'Controller transfers':
      await forcedTransfers();
      break;
    case 'Manage operators':
      await manageOperators();
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

async function verifyTransfer(askAmount, askTo) {
  let verifyTotalSupply = web3.utils.fromWei(await securityToken.methods.totalSupply().call());
  await logTotalInvestors();

  let verifyTransferFrom = input.readAddress(`Enter the sender account (${Issuer.address}): `, Issuer.address);
  await logBalance(verifyTransferFrom, verifyTotalSupply);

  let verifyTransferTo = gbl.constants.ADDRESS_ZERO;
  if (askTo) {
    verifyTransferTo = input.readAddress('Enter the receiver account: ');
    await logBalance(verifyTransferTo, verifyTotalSupply);
  }

  let verifyTransferAmount = askAmount ? input.readNumberGreaterThan(0, 'Enter amount of tokens to verify: ') : '0';

  let verifyResult = await currentTransferManager.methods.verifyTransfer(verifyTransferFrom, verifyTransferTo, web3.utils.toWei(verifyTransferAmount), web3.utils.fromAscii("")).call();
  switch (verifyResult[0]) {
    case gbl.constants.TRASFER_RESULT.INVALID:
      console.log(chalk.red(`\nThis transfer is not valid for this module!`));
      break;
    default:
      console.log(chalk.green(`\nThis transfer is valid for this module!`));
      break;
  }
}

async function canTransfer() {
  let verifyTotalSupply = web3.utils.fromWei(await securityToken.methods.totalSupply().call());
  await logTotalInvestors();
  let verifyTransferFrom = input.readAddress(`Enter the sender account (${Issuer.address}): `, Issuer.address);
  await logBalance(verifyTransferFrom, verifyTotalSupply);
  let verifyTransferTo = input.readAddress('Enter the receiver account: ');
  await logBalance(verifyTransferTo, verifyTotalSupply);
  let verifyTransferAmount = readlineSync.question('Enter amount of tokens to verify: ');
  let isVerified;
  if (verifyTransferFrom == Issuer.address) {
    isVerified = await securityToken.methods.canTransfer(verifyTransferTo, web3.utils.toWei(verifyTransferAmount), web3.utils.fromAscii("")).call();
  } else {
    isVerified = await securityToken.methods.canTransferFrom(verifyTransferFrom, verifyTransferTo, web3.utils.toWei(verifyTransferAmount), web3.utils.fromAscii("")).call();
  }
  switch (isVerified.statusCode) {
    case gbl.constants.TRANSFER_STATUS_CODES.TransferFailure:
      console.log(chalk.red(`\n${verifyTransferAmount} ${tokenSymbol} can't be transferred from ${verifyTransferFrom} to ${verifyTransferTo}!`));
      if (web3.utils.hexToAscii(isVerified.reasonCode) !== '') {
        const moduleData = await securityToken.methods.getModule(isVerified.reasonCode.substring(0, 42)).call();
        console.log(chalk.red(`The module ${web3.utils.hexToUtf8(moduleData.moduleLabel)} - ${web3.utils.hexToUtf8(moduleData.moduleName)} at ${moduleData.moduleAddress} didn't allow the transfer!`));
      } else {
        console.log(chalk.red(`The transfer wasn't considered explicitly valid by any TMs!`));
      }
      break;
    case gbl.constants.TRANSFER_STATUS_CODES.TransferSuccess:
      console.log(chalk.green(`\n${verifyTransferAmount} ${tokenSymbol} can be transferred from ${verifyTransferFrom} to ${verifyTransferTo}!`));
      break;
    case gbl.constants.TRANSFER_STATUS_CODES.InsufficientBalance:
      console.log(chalk.red(`\n${verifyTransferAmount} ${tokenSymbol} can't be transferred from ${verifyTransferFrom} to ${verifyTransferTo}!`));
      console.log(chalk.red(`Insufficient balance!`));
      break;
    case gbl.constants.TRANSFER_STATUS_CODES.InsufficientAllowance:
      console.log(chalk.red(`\nAddress ${Issuer.address} can't transfer ${verifyTransferAmount} ${tokenSymbol} on behalf of ${verifyTransferFrom}!`));
      console.log(chalk.red(`Insufficient allowance!`));
      break
    case gbl.constants.TRANSFER_STATUS_CODES.TransfersHalted:
      console.log(chalk.red(`\n${verifyTransferAmount} ${tokenSymbol} can't be transferred from ${verifyTransferFrom} to ${verifyTransferTo}!`));
      console.log(chalk.red(`Transfers are halted!`));
      break;
    case gbl.constants.TRANSFER_STATUS_CODES.InvalidReceiver:
      console.log(chalk.red(`\n${verifyTransferAmount} ${tokenSymbol} can't be transferred from ${verifyTransferFrom} to ${verifyTransferTo}!`));
      console.log(chalk.red(`Invalid receiver!`));
      break;
    default:
      console.log(chalk.red(`\n${verifyTransferAmount} ${tokenSymbol} can't be transferred from ${verifyTransferFrom} to ${verifyTransferTo}!`));
      break;
  }
}

async function operatorTransfer() {
  const partition = 'UNLOCKED';
  const from = input.readAddress('Enter the address from which to take tokens: ');
  const isOperator = await securityToken.methods.isOperator(Issuer.address, from).call();
  if (!isOperator) {
    console.log(chalk.red(`You are not an authorized operator for ${from}`));
  } else {
    await logBalance(from);
    const to = input.readAddress('Enter address where to send tokens: ');
    await logBalance(to);
    const amount = input.readNumberLessThanOrEqual(parseFloat(fromBalance), 'Enter amount of tokens to transfer: ');
    let isTranferVerified = await securityToken.methods.canTransferByPartition(from, to, web3.utils.asciiToHex(partition), web3.utils.toWei(amount), web3.utils.fromAscii("")).call();
    if (!isTranferVerified) {
      console.log(chalk.red(`Transfer failed at verification. Please review the transfer restrictions.`));
    } else {
      const data = '';
      const operatorData = readlineSync.question('Enter a message to attach to the transfer: ');
      const action = securityToken.methods.operatorTransferByPartition(
        web3.utils.asciiToHex(partition),
        from,
        to,
        web3.utils.toWei(amount),
        web3.utils.fromAscii(data),
        web3.utils.fromAscii(operatorData)
      )
      let receipt = await common.sendTransaction(action, { factor: 1.5 });
      let event = common.getEventFromLogs(securityToken._jsonInterface, receipt.logs, 'TransferByPartition');
      console.log(chalk.green(`  ${event._operator} has successfully transferred ${web3.utils.fromWei(event._value)} ${tokenSymbol}
from ${event._from} to ${event._to}
Data: ${web3.utils.hexToAscii(event._data)}
Operator data: ${web3.utils.hexToAscii(event._operatorData)}
        `));
      await logBalance(from);
      await logBalance(to);
    }
  }
}

async function forcedTransfers() {
  let options = ['Disable controller', 'Set controller'];
  let controller = await securityToken.methods.controller().call();
  if (controller == Issuer.address) {
    options.push('Controller Transfer');
  }
  let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'RETURN' });
  let optionSelected = index !== -1 ? options[index] : 'RETURN';
  console.log('Selected:', optionSelected, '\n');
  switch (optionSelected) {
    case 'Disable controller':
      console.log(chalk.yellow.bgRed.bold(`---- WARNING: THIS ACTION WILL PERMANENTLY DISABLE CONTROLLED TRANSFERS! ----`));
      let confirmation = readlineSync.question(`To confirm type "I acknowledge that disabling controller is a permanent and irrevocable change": `);
      if (confirmation == "I acknowledge that disabling controller is a permanent and irrevocable change") {
          let signature = await getDisableControllerAckSigner(securityToken.options.address, Issuer.address);
          let disableControllerAction = securityToken.methods.disableController(signature);
          await common.sendTransaction(disableControllerAction);
          console.log(chalk.green(`Controller transfers have been disabled permanently`));
          return;
        }
      break;
    case 'Set controller':
      let controller = await securityToken.methods.controller().call();
      if (controller == gbl.constants.ADDRESS_ZERO) {
        console.log(`A controller address is not set`);
      } else {
        console.log(`Controller address: ${await securityToken.methods.controller().call()}`);
      }
      let controllerAddress = input.readAddress(`Enter the address for the controller (${Issuer.address}): `, Issuer.address);
      let setControllerAction = securityToken.methods.setController(controllerAddress);
      let setControllerReceipt = await common.sendTransaction(setControllerAction);
      let setControllerEvent = common.getEventFromLogs(securityToken._jsonInterface, setControllerReceipt.logs, 'SetController');
      console.log(chalk.green(`New controller is ${setControllerEvent._newController}`));
      break;
    case 'Controller Transfer':
      let from = input.readAddress('Enter the address from which to take tokens: ');
      await logBalance(from);
      let to = input.readAddress('Enter address where to send tokens: ');
      await logBalance(to);
      let amount = input.readNumberLessThanOrEqual(parseFloat(fromBalance), 'Enter amount of tokens to transfer: ');
      let data = ''; // readlineSync.question('Enter the data to indicate validation: ');
      let log = readlineSync.question('Enter a message to attach to the transfer (i.e. "Private key lost"): ');
      let forceTransferAction = securityToken.methods.controllerTransfer(from, to, web3.utils.toWei(amount), web3.utils.asciiToHex(data), web3.utils.asciiToHex(log));
      let forceTransferReceipt = await common.sendTransaction(forceTransferAction, { factor: 1.5 });
      let forceTransferEvent = common.getEventFromLogs(securityToken._jsonInterface, forceTransferReceipt.logs, 'ControllerTransfer');
      console.log(chalk.green(`  ${forceTransferEvent._controller} has successfully forced a transfer of ${web3.utils.fromWei(forceTransferEvent._value)} ${tokenSymbol}
  from ${forceTransferEvent._from} to ${forceTransferEvent._to}
  Data: ${web3.utils.hexToAscii(forceTransferEvent._operatorData)}
        `));
      await logBalance(from);
      await logBalance(to);
      break;
    case 'RETURN':
      return;
  }

  await forcedTransfers();
}

async function manageOperators() {
  const options = ['Authorize operator', 'Revoke operator'];
  const index = readlineSync.keyInSelect(options, 'What do you want to do? ', { cancel: 'RETURN' });
  const selected = index !== -1 ? options[index] : 'RETURN';
  console.log('Selected:', selected, '\n');
  switch (selected) {
    case 'Authorize operator':
        const operatorToAuth = input.readAddress(`Enter the address of the operator you want to authorize: `);
        const authAction = securityToken.methods.authorizeOperator(operatorToAuth);
        await common.sendTransaction(authAction);
        console.log(chalk.green(`${operatorToAuth} has been authorized as operator successfully!`));
      break;
    case 'Revoke operator':
      const operatorToRevoke = input.readAddress(`Enter the address of the operator you want to revoke: `);
      const revokeAction = securityToken.methods.revokeOperator(operatorToRevoke);
      await common.sendTransaction(revokeAction);
      console.log(chalk.green(`${operatorToRevoke} has been revoked as operator successfully!`));
      break;
  }
}

async function configExistingModules(tmModules) {
  let options = tmModules.map(m => `${m.label}: ${m.name} (${m.version}) at ${m.address}`);
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
    case 'LockUpTransferManager':
      currentTransferManager = new web3.eth.Contract(abis.lockUpTransferManager(), tmModules[index].address);
      currentTransferManager.setProvider(web3.currentProvider);
      await lockUpTransferManager();
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
  let moduleList = await common.getAvailableModules(moduleRegistry, gbl.constants.MODULES_TYPES.TRANSFER, securityToken.options.address);
  let options = moduleList.map(m => `${m.name} - ${m.version} (${m.factoryAddress})`);

  let index = readlineSync.keyInSelect(options, 'Which Transfer Manager module do you want to add? ', { cancel: 'RETURN' });
  if (index != -1 && readlineSync.keyInYNStrict(`Are you sure you want to add ${moduleList[index].name} module?`)) {
    let getInitializeData;
    let moduleAbi;
    switch (moduleList[index].name) {
      case 'CountTransferManager':
        moduleAbi = abis.countTransferManager();
        getInitializeData = getCountTMInitializeData;
        break;
      case 'PercentageTransferManager':
        moduleAbi = abis.percentageTransferManager();
        getInitializeData = getPercentageTMInitializeData;
        break;
    }
    await common.addModule(securityToken, polyToken, moduleList[index].factoryAddress, moduleAbi, getInitializeData);
  }
}

function getPercentageTMInitializeData(moduleAbi) {
  const maxHolderPercentage = toWeiPercentage(input.readPercentage('Enter the maximum amount of tokens in percentage that an investor can hold'));
  const allowPercentagePrimaryIssuance = readlineSync.keyInYNStrict(`Do you want to ignore transactions which are part of the primary issuance? `);
  const configurePercentageTM = moduleAbi.find(o => o.name === 'configure' && o.type === 'function');
  const bytes = web3.eth.abi.encodeFunctionCall(configurePercentageTM, [maxHolderPercentage, allowPercentagePrimaryIssuance]);
  return bytes
}

function getCountTMInitializeData(moduleABI) {
  const maxHolderCount = readlineSync.question('Enter the maximum no. of holders the SecurityToken is allowed to have: ');
  const configureCountTM = moduleABI.find(o => o.name === 'configure' && o.type === 'function');
  const bytes = web3.eth.abi.encodeFunctionCall(configureCountTM, [maxHolderCount]);
  return bytes;
}

async function generalTransferManager() {
  console.log('\n', chalk.blue(`General Transfer Manager at ${currentTransferManager.options.address}`), '\n');

  let moduleFactoryABI = abis.moduleFactory();
  let factoryAddress = await currentTransferManager.methods.factory().call();
  let moduleFactory = new web3.eth.Contract(moduleFactoryABI, factoryAddress);
  let moduleVersion = await moduleFactory.methods.version().call();

  // Show current data
  let displayIssuanceAddress = await currentTransferManager.methods.issuanceAddress().call();
  let displayDefaults;
  let displayInvestors;
  if (moduleVersion != '1.0.0') {
    displayDefaults = await currentTransferManager.methods.defaults().call();
    displayInvestors = await currentTransferManager.methods.getAllInvestors().call();
  }
  console.log(`- Issuance address:              ${displayIssuanceAddress}`);
  if (displayDefaults) {
    console.log(`- Default times:`);
    console.log(`   - Can transfer after:         ${displayDefaults.canSendAfter} (${moment.unix(displayDefaults.canSendAfter).format('MMMM Do YYYY, HH:mm:ss')})`);
    console.log(`   - Can receive after:          ${displayDefaults.canReceiveAfter} (${moment.unix(displayDefaults.canReceiveAfter).format('MMMM Do YYYY, HH:mm:ss')})`);
  }
  if (displayInvestors) {
    console.log(`- Number of investors:           ${displayInvestors.length}`);
  }
  // ------------------

  let options = [];
  if (displayInvestors && displayInvestors.length > 0) {
    options.push(`Show investors`, `Show whitelist data`);
  }
  options.push(
    'Verify transfer',
    'Modify whitelist',
    'Modify whitelist from CSV',
    'Show investor flags',
    'Show all investors flags',
    'Modify investor flag',
    'Modify investor flags from CSV'
  ); /*'Modify Whitelist Signed',*/
  if (displayDefaults) {
    options.push('Change the default times used when they are zero');
  }
  options.push(`Change issuance address`, `Display/Modify Transfer Requirements`);
  let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'RETURN' });
  let optionSelected = index !== -1 ? options[index] : 'RETURN';
  console.log('Selected:', optionSelected, '\n');
  switch (optionSelected) {
    case `Show investors`:
      console.log('***** List of investors on whitelist *****');
      displayInvestors.map(i => console.log(i));
      break;
    case `Show whitelist data`:
      let investorsToShow = input.readMultipleAddresses(`Enter the addresses of the investors you want to show (i.e: addr1,addr2,addr3) or leave empty to show them all: `);
      if (investorsToShow === '') {
        let whitelistData = await currentTransferManager.methods.getAllKYCData().call();
        showWhitelistTable(whitelistData[0], whitelistData[1], whitelistData[2], whitelistData[3]);
      } else {
        let investorsArray = investorsToShow.split(',');
        let whitelistData = await currentTransferManager.methods.getKYCData(investorsArray).call();
        showWhitelistTable(investorsArray, whitelistData[0], whitelistData[1], whitelistData[2]);
      }
      break;
    case 'Verify transfer':
      await verifyTransfer(false, true);
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
      await common.queryModifyWhiteList(currentTransferManager);
      break;
    case 'Modify whitelist from CSV':
      await modifyWhitelistInBatch();
      break;
    case 'Show investor flags':
      await showInvestorFlags();
      break;
    case 'Show all investors flags':
      await showAllInvestorFlags();
      break;

    case 'Modify investor flag':
      let investorAddress = input.readAddress("Enter the investor's address: ");
      let options = [];
      options.push(
        "Is Accredited",
        "Cannot Buy From STO's",
        "Is Volume Restricted",
        "Custom Flag"
      );
      let index = readlineSync.keyInSelect(options, 'Select the flag you wish to set: ', { cancel: false });
      let optionSelected = index !== -1 ? options[index] : 'RETURN';
      console.log('Selected:', optionSelected, '\n');
      let flag
      switch (optionSelected) {
        case "Is Accredited":
          flag = 0;
          break;
        case "Cannot Buy From STO's":
          flag = 1;
          break;
        case "Is Volume Restricted":
          flag = 2;
          break;
        case "Custom Flag":
          flag = parseInt(input.readNumberBetween(3, 255, "Enter the number of the flag you wish to change: "));
          break;
        case "RETURN":
          await generalTransferManager();
      };
      let value = readlineSync.keyInYNStrict("Should the flag be set (y) or cleared (n): ");
      let modifyInvestorFlagAction = currentTransferManager.methods.modifyInvestorFlag(investorAddress, flag, value);
      let modifyInvestorFlagReceipt = await common.sendTransaction(modifyInvestorFlagAction);
      break;
    case 'Modify investor flags from CSV':
      await modifyFlagsInBatch();
      break;
    /*
    case 'Modify Whitelist Signed':
      let investorSigned = input.readAddress('Enter the address to whitelist: ');
      let fromTimeSigned = readlineSync.questionInt('Enter the time (Unix Epoch time) when the sale lockup period ends and the investor can freely sell his tokens: ');
      let toTimeSigned = readlineSync.questionInt('Enter the time (Unix Epoch time) when the purchase lockup period ends and the investor can freely purchase tokens from others: ');
      let expiryTimeSigned = readlineSync.questionInt('Enter the time till investors KYC will be validated (after that investor need to do re-KYC): ');
      let vSigned = readlineSync.questionInt('Enter v: ');
      let rSigned = readlineSync.question('Enter r: ');
      let sSigned = readlineSync.question('Enter s: ');
      let canBuyFromSTOSigned = readlineSync.keyInYNStrict('Can the investor buy from security token offerings?');
      let modifyWhitelistSignedAction = currentTransferManager.methods.modifyWhitelistSigned(investorSigned, fromTimeSigned, toTimeSigned, expiryTimeSigned, canBuyFromSTOSigned);
      let modifyWhitelistSignedReceipt = await common.sendTransaction(Issuer, modifyWhitelistSignedAction, defaultGasPrice);
      let modifyWhitelistSignedEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, modifyWhitelistSignedReceipt.logs, 'ModifyWhitelist');
      console.log(chalk.green(`${ modifyWhitelistSignedEvent._investor } has been whitelisted sucessfully!`));
      break;
    */
    case 'Change issuance address':
      let issuanceAddress = input.readAddress('Enter the new issuance address: ');
      let changeIssuanceAddressAction = currentTransferManager.methods.changeIssuanceAddress(issuanceAddress);
      let changeIssuanceAddressReceipt = await common.sendTransaction(changeIssuanceAddressAction);
      let changeIssuanceAddressEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, changeIssuanceAddressReceipt.logs, 'ChangeIssuanceAddress');
      console.log(chalk.green(`${changeIssuanceAddressEvent._issuanceAddress} is the new address for the issuance!`));
      break;
    case 'Display/Modify Transfer Requirements':
      await transferRequirements();
      break;
    case 'RETURN':
      return;
  }
  await generalTransferManager();
}

async function showInvestorFlags() {
  let investor = input.readAddress("Enter the investor's address: ");
  let investorFlags = new web3.utils.BN(await currentTransferManager.methods.getInvestorFlags(investor).call());
  console.log(chalk.green(`\nList of flags set for address ${investor}:`));
  let flagNames =
    [
      "Is Accredited",
      "Cannot Buy From STO's",
      "Is Volume Restricted"
    ];
  let flag;
  for (let i = 0; i < 256; i++) {
    // Test individual bits (flags) with BN utils
    let value = investorFlags.testn(i);
    let name = i < flagNames.length ? flagNames[i] : "Undefined";
    if (value) console.log("  Flag " + i + " is set - " + name);
  }
}

async function showAllInvestorFlags() {
  // Rough draft WIP
  let allInvestorFlagData = await currentTransferManager.methods.getAllInvestorFlags().call();
  let investorsArray = allInvestorFlagData.investors;
  let flagsArray = allInvestorFlagData.flags;
  let flagDataTable = [['Investor Address', 'Active Flags']];
  for (let i = 0; i < investorsArray.length; i++) {
    let flags = new web3.utils.BN(flagsArray[i]);
    let flagNumbers = [];
    // Test flags and add set flags to array
    for (let j = 0; j < 256; j++) {
      if (flags.testn(j)) flagNumbers.push(j);
    }
    flagDataTable.push([
      investorsArray[i],
      flagNumbers
    ]);
  }
  console.log(table(flagDataTable));
}

async function transferRequirements() {
  let displayGeneralTransRequirements = await currentTransferManager.methods.transferRequirements(0).call();
  let displayIssuanceTransRequirements = await currentTransferManager.methods.transferRequirements(1).call();
  let displayRedemptionTransRequirements = await currentTransferManager.methods.transferRequirements(2).call();
  let txReqTable = [['Transfer Type', 'Valid Sender KYC', 'Valid Receiver KYC', 'Transfer Date Restriction', 'Receive Date Restriction']];
  txReqTable.push([
    "General ",
    displayGeneralTransRequirements[0],
    displayGeneralTransRequirements[1],
    displayGeneralTransRequirements[2],
    displayGeneralTransRequirements[3]
  ]);
  txReqTable.push([
    "Issuance",
    displayIssuanceTransRequirements[0],
    displayIssuanceTransRequirements[1],
    displayIssuanceTransRequirements[2],
    displayIssuanceTransRequirements[3]
  ]);
  txReqTable.push([
    "Redemption",
    displayRedemptionTransRequirements[0],
    displayRedemptionTransRequirements[1],
    displayRedemptionTransRequirements[2],
    displayRedemptionTransRequirements[3]
  ]);
  console.log("Transfer Requirements:");
  let tableConfig = {columnDefault: {width: 13, wrapWord: true}};
  console.log(table(txReqTable, tableConfig));
  let options = [];
  options.push(
    `Modify General Transfer Requirements`,
    `Modify Issuance Transfer Requirements`,
    `Modify Redemption Transfer Requirements`,
    `Modify All Transfer Requirements`,
    `Reset All Transfer Requirements to Defaults`
  );
  let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'RETURN' });
  let optionSelected = index !== -1 ? options[index] : 'RETURN';
  console.log('Selected:', optionSelected, '\n');
  let transferTypesArray = [], fromValidKYCArray = [], toValidKYCArray = [], fromRestrictedArray = [], toRestrictedArray = [];
  switch (optionSelected) {
    case `Modify General Transfer Requirements`:
      await modifyTransferRequirements(0)
      break;
    case `Modify Issuance Transfer Requirements`:
      await modifyTransferRequirements(1)
      break;
    case `Modify Redemption Transfer Requirements`:
      await modifyTransferRequirements(2)
      break;
    case `Modify All Transfer Requirements`:
      transferTypesArray = [0, 1, 2];
      console.log("Set General Transfer Requirements:");
      fromValidKYCArray[0] = readlineSync.keyInYNStrict('Should the sender require valid KYC?');
      toValidKYCArray[0] = readlineSync.keyInYNStrict('Should the recipient require valid KYC?');
      fromRestrictedArray[0] = readlineSync.keyInYNStrict('Should the sender be restricted by a can transfer date?');
      toRestrictedArray[0] = readlineSync.keyInYNStrict('Should the recipient be restricted by a can receive date?');
      console.log("\nSet Issuance Transfer Requirements:");
      fromValidKYCArray[1] = readlineSync.keyInYNStrict('Should the issuance address require valid KYC?');
      toValidKYCArray[1] = readlineSync.keyInYNStrict('Should the recipient require valid KYC?');
      fromRestrictedArray[1] = readlineSync.keyInYNStrict('Should the issuance address be restricted by a can transfer date?');
      toRestrictedArray[1] = readlineSync.keyInYNStrict('Should the recipient be restricted by a can receive date?');
      console.log("\nSet Redemption Transfer Requirements:");
      fromValidKYCArray[2] = readlineSync.keyInYNStrict('Should the sender require valid KYC?');
      toValidKYCArray[2] = readlineSync.keyInYNStrict('Should the redemption address require valid KYC?');
      fromRestrictedArray[2] = readlineSync.keyInYNStrict('Should the sender be restricted by a can transfer date?');
      toRestrictedArray[2] = readlineSync.keyInYNStrict('Should the redemption address be restricted by a can receive date?');
      await modifyAllTransferRequirements(transferTypesArray, fromValidKYCArray, toValidKYCArray, fromRestrictedArray, toRestrictedArray)
      break;
    case `Reset All Transfer Requirements to Defaults`:
      transferTypesArray = [0, 1, 2];
      fromValidKYCArray = [true, false, true];
      toValidKYCArray = [true, true, false];
      fromRestrictedArray = [true, false, false];
      toRestrictedArray = [true, false, false];
      await modifyAllTransferRequirements(transferTypesArray, fromValidKYCArray, toValidKYCArray, fromRestrictedArray, toRestrictedArray)
      break;
    case 'RETURN':
      return;
  }
  await transferRequirements();
}

async function modifyTransferRequirements(transferType) {
  let fromValidKYC = readlineSync.keyInYNStrict('Should the sender require valid KYC?');
  let toValidKYC = readlineSync.keyInYNStrict('Should the recipient require valid KYC?');
  let fromRestricted = readlineSync.keyInYNStrict('Should the sender be restricted by a can transfer date?');
  let toRestricted = readlineSync.keyInYNStrict('Should the recipient be restricted by a can receive date?');
  let modifyTransferRequirementsAction = currentTransferManager.methods.modifyTransferRequirements(transferType, fromValidKYC, toValidKYC, fromRestricted, toRestricted);
  let receipt = await common.sendTransaction(modifyTransferRequirementsAction);
  console.log(chalk.green("  Transfer Requirements sucessfully modified"));
}

async function modifyAllTransferRequirements(transferType, fromValidKYC, toValidKYC, fromRestricted, toRestricted) {
  let modifyAllTransferRequirementsAction = currentTransferManager.methods.modifyTransferRequirementsMulti(transferType, fromValidKYC, toValidKYC, fromRestricted, toRestricted);
  let receipt = await common.sendTransaction(modifyAllTransferRequirementsAction);
  console.log(chalk.green("  Transfer Requirements sucessfully modified"));
}

function showWhitelistTable(investorsArray, canSendAfterArray, canReceiveAfterArray, expiryTimeArray) {
  let dataTable = [['Investor Address', 'Can Transfer After', 'Can Receive After', 'KYC Expiry Date']];
  let canSendAfter;
  let canReceiveAfter;
  let expiryTime;
  for (let i = 0; i < investorsArray.length; i++) {
    if (canSendAfterArray[i] == 0) {
      canSendAfter = chalk.yellow.bold("     DEFAULT");
    } else {
      canSendAfter = canSendAfterArray[i] >= Date.now() / 1000
      ? chalk.red.bold(moment.unix(canSendAfterArray[i]).format('MM/DD/YYYY HH:mm'))
      : moment.unix(canSendAfterArray[i]).format('MM/DD/YYYY HH:mm');
    }

    if (canReceiveAfterArray[i] == 0) {
      canReceiveAfter = chalk.yellow.bold("     DEFAULT");
    } else {
      canReceiveAfter = (canReceiveAfterArray[i] >= Date.now() / 1000)
      ? chalk.red.bold(moment.unix(canReceiveAfterArray[i]).format('MM/DD/YYYY HH:mm'))
      : moment.unix(canReceiveAfterArray[i]).format('MM/DD/YYYY HH:mm');
    }

    expiryTime = (expiryTimeArray[i] <= Date.now() / 1000
      ? chalk.red.bold(moment.unix(expiryTimeArray[i]).format('MM/DD/YYYY HH:mm'))
      : moment.unix(expiryTimeArray[i]).format('MM/DD/YYYY HH:mm'));

    dataTable.push([
      investorsArray[i],
      canSendAfter,
      canReceiveAfter,
      expiryTime
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
    batchSize = input.readNumberGreaterThan(0, `Enter the max number of records per transaction or batch size (${gbl.constants.DEFAULT_BATCH_SIZE}): `, gbl.constants.DEFAULT_BATCH_SIZE);
  } else {
    batchSize = _batchSize;
  }
  let parsedData = csvParse(csvFilePath);
  let validData = parsedData.filter(row =>
    web3.utils.isAddress(row[0]) &&
    moment.unix(row[1]).isValid() &&
    moment.unix(row[2]).isValid() &&
    moment.unix(row[3]).isValid()
  );
  let invalidRows = parsedData.filter(row => !validData.includes(row));
  if (invalidRows.length > 0) {
    console.log(chalk.red(`The following lines from csv file are not valid: ${invalidRows.map(r => parsedData.indexOf(r) + 1).join(',')} `));
  }
  let batches = common.splitIntoBatches(validData, batchSize);
  let [investorArray, canSendAfterArray, canReceiveAfterArray, expiryTimeArray] = common.transposeBatches(batches);
  for (let batch = 0; batch < batches.length; batch++) {
    console.log(`Batch ${batch + 1} - Attempting to modify whitelist to accounts: \n\n`, investorArray[batch], '\n');
    let action = currentTransferManager.methods.modifyKYCDataMulti(investorArray[batch], canSendAfterArray[batch], canReceiveAfterArray[batch], expiryTimeArray[batch]);
    let receipt = await common.sendTransaction(action);
    console.log(chalk.green('Modify whitelist transaction was successful.'));
    console.log(`${receipt.gasUsed} gas used.Spent: ${web3.utils.fromWei((new web3.utils.BN(receipt.gasUsed)).mul(new web3.utils.BN(defaultGasPrice)))} ETH`);
  }
}

async function modifyFlagsInBatch(_csvFilePath, _batchSize) {
  let csvFilePath;
  if (typeof _csvFilePath === 'undefined') {
    csvFilePath = readlineSync.question(`Enter the path for csv data file (${FLAG_DATA_CSV}): `, {
      defaultInput: FLAG_DATA_CSV
    });
  } else {
    csvFilePath = _csvFilePath;
  }
  let batchSize;
  if (typeof _batchSize === 'undefined') {
    batchSize = input.readNumberGreaterThan(0, `Enter the max number of records per transaction or batch size (${gbl.constants.DEFAULT_BATCH_SIZE}): `, gbl.constants.DEFAULT_BATCH_SIZE);
  } else {
    batchSize = _batchSize;
  }
  let parsedData = csvParse(csvFilePath);
  let validData = parsedData.filter(row =>
    web3.utils.isAddress(row[0]) &&
    typeof row[1] === "number" &&
    Number.isInteger(row[1]) &&
    row[1] >= 0 &&
    row[1] < 256 &&
    typeof row[2] === "boolean"
  );
  let invalidRows = parsedData.filter(row => !validData.includes(row));
  if (invalidRows.length > 0) {
    console.log(chalk.red(`The following lines from csv file are not valid: ${invalidRows.map(r => parsedData.indexOf(r) + 1).join(',')} `));
    let processValid = readlineSync.keyInYNStrict(chalk.yellow("Do you want to process valid rows?"));
    if (!processValid) return;
  }
  let batches = common.splitIntoBatches(validData, batchSize);
  let [investorArray, flagArray, flagValueArray] = common.transposeBatches(batches);
  for (let batch = 0; batch < batches.length; batch++) {
    console.log(`Batch ${batch + 1} - Attempting to modify flags to accounts: \n\n`, investorArray[batch], '\n');
    let action = currentTransferManager.methods.modifyInvestorFlagMulti(investorArray[batch], flagArray[batch], flagValueArray[batch]);
    let receipt = await common.sendTransaction(action);
    console.log(chalk.green('Modify investor flags transaction was successful.'));
    console.log(`${receipt.gasUsed} gas used.Spent: ${web3.utils.fromWei((new web3.utils.BN(receipt.gasUsed)).mul(new web3.utils.BN(defaultGasPrice)))} ETH`);
  }
}

async function manualApprovalTransferManager() {
  console.log('\n', chalk.blue(`Manual Approval Transfer Manager at ${currentTransferManager.options.address} `), '\n');

  let totalApprovals = await currentTransferManager.methods.getTotalApprovalsLength().call();
  console.log(`- Current active approvals:      ${totalApprovals}`);

  let matmOptions = [
    MATM_MENU_VERIFY,
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
    case MATM_MENU_VERIFY:
      await verifyTransfer(true, true);
      break;
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
  let from = input.readAddress('Enter the address from which transfers will be approved: ');
  let to = input.readAddress('Enter the address to which transfers will be approved: ');
  if (!await getManualApproval(from, to)) {
    let description = input.readStringNonEmptyWithMaxBinarySize(33, 'Enter the description for the manual approval: ');
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
      options.push(`${web3.utils.toAscii(item.description)}\n    From: ${item.from}\n    To: ${item.to}\n    Initial amount: ${web3.utils.fromWei(item.initialAllowance)} ${tokenSymbol}\n    Remaining amount: ${web3.utils.fromWei(item.allowance)} ${tokenSymbol}\n    Expiry date: ${moment.unix(item.expiryTime).format('MM/DD/YYYY HH:mm')}\n`)
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
    printMatmRow(item.from, item.to, item.initialAllowance, item.allowance, item.expiryTime, item.description);
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
  let allowance = input.readNumberGreaterThan(0, `Enter a value to increase allowance (current allowance = ${web3.utils.fromWei(selectedApproval.allowance)}): `);

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
  let allowance = input.readNumberGreaterThan(0, `Enter a value to decrease allowance (current allowance = ${web3.utils.fromWei(selectedApproval.allowance)}): `);

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

  let modifyManualApprovalAction = currentTransferManager.methods.modifyManualApproval(selectedApproval.from, selectedApproval.to, parseInt(expiryTime), 0, web3.utils.fromAscii(description), 2);
  await common.sendTransaction(modifyManualApprovalAction);
  console.log(chalk.green(`The approval expiry time has been modified successfully!`));
}

function readExpiryTimeAndDescription(selectedApproval) {
  let expiryTime = parseInt(input.readNumberGreaterThan(0, `Enter the new expiry time (Unix Epoch time) until which the transfer is allowed or leave empty to keep the current (${selectedApproval.expiryTime}): `, selectedApproval.expiryTime));
  let description = input.readStringNonEmptyWithMaxBinarySize(33, `Enter the new description for the manual approval or leave empty to keep the current (${web3.utils.toAscii(selectedApproval.description)}): `);
  return { expiryTime, description };
}

async function matmManageRevoke(selectedApproval) {
  let modifyManualApprovalAction = currentTransferManager.methods.revokeManualApproval(selectedApproval.from, selectedApproval.to);
  await common.sendTransaction(modifyManualApprovalAction);
  console.log(chalk.green(`The approval has been revoked successfully!`));
}

async function getApprovalsArray() {
  let address = input.readAddress('Enter an address to filter or leave empty to get all the approvals: ', gbl.constants.ADDRESS_ZERO);
  if (address == gbl.constants.ADDRESS_ZERO) {
    return getApprovals();
  } else {
    let approvals = await getApprovalsToAnAddress(address);
    if (!approvals.length) {
      console.log(chalk.red(`\nThe address is not listed\n`))
    }
    return approvals;
  }
}

function printMatmRow(from, to, initialAllowance, allowance, time, description) {
  console.log(`\nDescription: ${web3.utils.toAscii(description)}\nFrom ${from} to ${to}\nInitial allowance: ${web3.utils.fromWei(initialAllowance)}\nRemaining allowance: ${web3.utils.fromWei(allowance)}\nExpiry time: ${moment.unix(time).format('MMMM Do YYYY HH:mm')}\n`);
}

async function getApprovals() {
  function ApprovalDetail(_from, _to, _initialAllowance, _allowance, _expiryTime, _description) {
    this.from = _from;
    this.to = _to;
    this.initialAllowance = _initialAllowance;
    this.allowance = _allowance;
    this.expiryTime = _expiryTime;
    this.description = _description;
  }

  let results = [];
  let approvalDetails = await currentTransferManager.methods.getAllApprovals().call();
  for (let i = 0; i < approvalDetails[0].length; i++) {
    results.push(new ApprovalDetail(approvalDetails[0][i], approvalDetails[1][i], approvalDetails[2][i], approvalDetails[3][i], approvalDetails[4][i], approvalDetails[5][i]));
  }
  return results;
}

async function getApprovalsToAnAddress(address) {
  function ApprovalDetail(_from, _to, _initialAllowance, _allowance, _expiryTime, _description) {
    this.from = _from;
    this.to = _to;
    this.initialAllowance = _initialAllowance;
    this.allowance = _allowance;
    this.expiryTime = _expiryTime;
    this.description = _description;
  }

  let results = [];
  let approvals = await currentTransferManager.methods.getActiveApprovalsToUser(address).call();
  for (let i = 0; i < approvals[0].length; i++) {
    results.push(new ApprovalDetail(approvals[0][i], approvals[1][i], approvals[2][i], approvals[3][i], approvals[4][i], approvals[5][i]));
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
  let batchSize = input.readNumberGreaterThan(0, `Enter the max number of records per transaction or batch size (${gbl.constants.DEFAULT_BATCH_SIZE}): `, gbl.constants.DEFAULT_BATCH_SIZE);
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
  console.log('\n', chalk.blue(`Count Transfer Manager at ${currentTransferManager.options.address}`), '\n');

  // Show current data
  let displayMaxHolderCount = await currentTransferManager.methods.maxHolderCount().call();

  console.log(`- Max holder count:        ${displayMaxHolderCount}`);

  let options = ['Verify transfer', 'Change max holder count']
  let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'RETURN' });
  let optionSelected = index !== -1 ? options[index] : 'RETURN';
  console.log('Selected:', optionSelected, '\n');
  switch (optionSelected) {
    case 'Verify transfer':
      await verifyTransfer(true, true);
      break;
    case 'Change max holder count':
      let maxHolderCount = input.readNumberGreaterThan(0, 'Enter the maximum no. of holders the SecurityToken is allowed to have: ');
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
  console.log('\n', chalk.blue(`Percentage Transfer Manager at ${currentTransferManager.options.address}`), '\n');

  // Show current data
  let displayMaxHolderPercentage = await currentTransferManager.methods.maxHolderPercentage().call();
  let displayAllowPrimaryIssuance = await currentTransferManager.methods.allowPrimaryIssuance().call();

  console.log(`- Max holder percentage:   ${fromWeiPercentage(displayMaxHolderPercentage)}%`);
  console.log(`- Allow primary issuance:  ${displayAllowPrimaryIssuance ? `YES` : `NO`}`);

  let options = ['Verify transfer', 'Change max holder percentage', 'Check if investor is whitelisted', 'Modify whitelist', 'Modify whitelist from CSV'];
  if (displayAllowPrimaryIssuance) {
    options.push('Disallow primary issuance');
  } else {
    options.push('Allow primary issuance');
  }
  let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'RETURN' });
  let optionSelected = index !== -1 ? options[index] : 'RETURN';
  console.log('Selected:', optionSelected, '\n');
  switch (optionSelected) {
    case 'Verify transfer':
      await verifyTransfer(false, true);
      break;
    case 'Change max holder percentage':
      let maxHolderPercentage = toWeiPercentage(input.readPercentage('Enter the maximum amount of tokens in percentage that an investor can hold'));
      let changeHolderPercentageAction = currentTransferManager.methods.changeHolderPercentage(maxHolderPercentage);
      let changeHolderPercentageReceipt = await common.sendTransaction(changeHolderPercentageAction);
      let changeHolderPercentageEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, changeHolderPercentageReceipt.logs, 'ModifyHolderPercentage');
      console.log(chalk.green(`Max holder percentage has been set to ${fromWeiPercentage(changeHolderPercentageEvent._newHolderPercentage)} successfully!`));
      break;
    case 'Check if investor is whitelisted':
      let investorToCheck = input.readAddress('Enter the address of the investor: ');
      let isWhitelisted = await currentTransferManager.methods.whitelist(investorToCheck).call();
      if (isWhitelisted) {
        console.log(chalk.green(`${investorToCheck} is whitelisted!`));
      } else {
        console.log(chalk.yellow(`${investorToCheck} is not whitelisted!`));
      }
      break;
    case 'Modify whitelist':
      let valid = !!readlineSync.keyInSelect(['Remove investor from whitelist', 'Add investor to whitelist'], 'How do you want to do? ', { cancel: false });
      let investorToWhitelist = input.readAddress('Enter the address of the investor: ');
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
      let batchSize = input.readNumberGreaterThan(0, `Enter the max number of records per transaction or batch size (${gbl.constants.DEFAULT_BATCH_SIZE}): `, gbl.constants.DEFAULT_BATCH_SIZE);
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
  console.log('\n', chalk.blue(`Blacklist Transfer Manager at ${currentTransferManager.options.address}`), '\n');

  let currentBlacklists = await currentTransferManager.methods.getAllBlacklists().call();
  console.log(`- Blacklists:    ${currentBlacklists.length}`);

  let options = ['Verify transfer', 'Add new blacklist'];
  if (currentBlacklists.length > 0) {
    options.push('Manage existing blacklist', 'Explore account');
  }
  options.push('Delete investors from all blacklists', 'Operate with multiple blacklists');

  let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: "RETURN" });
  let optionSelected = index !== -1 ? options[index] : 'RETURN';
  console.log('Selected:', optionSelected, '\n');
  switch (optionSelected) {
    case 'Verify transfer':
      await verifyTransfer(false, false);
      break;
    case 'Add new blacklist':
      let name = input.readStringNonEmpty(`Enter the name of the blacklist type: `);
      let minuteFromNow = Math.floor(Date.now() / 1000) + 60;
      let startTime = readlineSync.questionInt(`Enter the start date (Unix Epoch time) of the blacklist type (a minute from now = ${minuteFromNow}): `, { defaultInput: minuteFromNow });
      let oneDayFromStartTime = startTime + 24 * 60 * 60;
      let endTime = readlineSync.questionInt(`Enter the end date (Unix Epoch time) of the blacklist type (1 day from start time = ${oneDayFromStartTime}): `, { defaultInput: oneDayFromStartTime });
      let repeatPeriodTime = readlineSync.questionInt(`Enter the repeat period (days) of the blacklist type, 0 to disable (90 days): `, { defaultInput: 90 });
      if (readlineSync.keyInYNStrict(`Do you want to add an investor to this blacklist type? `)) {
        let investor = input.readAddress(`Enter the address of the investor: `);
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
      let account = input.readAddress(`Enter the address of the investor: `);
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
      let investorsToRemove = input.readMultipleAddresses(`Enter the addresses of the investors separated by comma (i.e. addr1,addr2,addr3): `).split(',');
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
  console.log(`- Number of investors:  ${investors.length}`);
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
      let investorsToAdd = input.readMultipleAddresses(`Enter the addresses of the investors separated by comma (i.e. addr1,addr2,addr3): `).split(",");
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
      let investorsToRemove = input.readAddress(`Enter the address of the investor: `);
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
  let batchSize = input.readNumberGreaterThan(0, `Enter the max number of records per transaction or batch size (${gbl.constants.DEFAULT_BATCH_SIZE}): `, gbl.constants.DEFAULT_BATCH_SIZE);
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
  let batchSize = input.readNumberGreaterThan(`Enter the max number of records per transaction or batch size (${gbl.constants.DEFAULT_BATCH_SIZE}): `, gbl.constants.DEFAULT_BATCH_SIZE);
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
  let batchSize = input.readNumberGreaterThan(`Enter the max number of records per transaction or batch size (${gbl.constants.DEFAULT_BATCH_SIZE}): `, gbl.constants.DEFAULT_BATCH_SIZE);
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
  let batchSize = input.readNumberGreaterThan(`Enter the max number of records per transaction or batch size (${gbl.constants.DEFAULT_BATCH_SIZE}): `, gbl.constants.DEFAULT_BATCH_SIZE);
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

function makeBatchRequest(calls) {
  let batch = new web3.BatchRequest();

  let promises = calls.map(call => {
    return new Promise((res, rej) => {
      let req = call.request({ from: Issuer.address }, (err, data) => {
        if (err) rej(err);
        else res(data)
      });
      batch.add(req)
    })
  })
  batch.execute()

  return Promise.all(promises)
}

async function removeInvestorsFromBlacklistsInBatch() {
  let csvFilePath = readlineSync.question(`Enter the path for csv data file (${REMOVE_INVESTOR_BLACKLIST_DATA_CSV}): `, {
    defaultInput: REMOVE_INVESTOR_BLACKLIST_DATA_CSV
  });
  let batchSize = input.readNumberGreaterThan(0, `Enter the max number of records per transaction or batch size (${gbl.constants.DEFAULT_BATCH_SIZE}): `, gbl.constants.DEFAULT_BATCH_SIZE);
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

  let globalDailyRestriction = await currentTransferManager.methods.getDefaultDailyRestriction().call();
  let hasGlobalDailyRestriction = parseInt(globalDailyRestriction[1]) !== 0; //startTime
  let globalCustomRestriction = await currentTransferManager.methods.getDefaultRestriction().call();
  let hasGlobalCustomRestriction = parseInt(globalCustomRestriction[1]) !== 0; //startime

  console.log(`- Default daily restriction:     ${hasGlobalDailyRestriction ? '' : 'None'}`);
  if (hasGlobalDailyRestriction) {
    console.log(`     Type:                         ${RESTRICTION_TYPES[globalDailyRestriction[4]]}`);
    console.log(`     Allowed tokens:               ${globalDailyRestriction[4] === "0" ? `${web3.utils.fromWei(globalDailyRestriction[0])} ${tokenSymbol}` : `${fromWeiPercentage(globalDailyRestriction[0])}%`}`);
    console.log(`     Start time:                   ${moment.unix(globalDailyRestriction[1]).format('MMMM Do YYYY, HH:mm:ss')}`);
    console.log(`     Rolling period:               ${globalDailyRestriction[2]} days`);
    console.log(`     End time:                     ${moment.unix(globalDailyRestriction[3]).format('MMMM Do YYYY, HH:mm:ss')} `);
  }
  console.log(`- Default custom restriction:    ${hasGlobalCustomRestriction ? '' : 'None'}`);
  if (hasGlobalCustomRestriction) {
    console.log(`     Type:                         ${RESTRICTION_TYPES[globalCustomRestriction[4]]}`);
    console.log(`     Allowed tokens:               ${globalCustomRestriction[4] === "0" ? `${web3.utils.fromWei(globalCustomRestriction[0])} ${tokenSymbol}` : `${fromWeiPercentage(globalCustomRestriction[0])}%`}`);
    console.log(`     Start time:                   ${moment.unix(globalCustomRestriction[1]).format('MMMM Do YYYY, HH:mm:ss')}`);
    console.log(`     Rolling period:               ${globalCustomRestriction[2]} days`);
    console.log(`     End time:                     ${moment.unix(globalCustomRestriction[3]).format('MMMM Do YYYY, HH:mm:ss')} `);
  }

  let addressesAndRestrictions = await currentTransferManager.methods.getRestrictionData().call();
  console.log(`- Individual restrictions:       ${addressesAndRestrictions.allAddresses.length}`);
  let exemptedAddresses = await currentTransferManager.methods.getExemptAddress().call();
  console.log(`- Exempted addresses:            ${exemptedAddresses.length}`);

  let options = [];
  if (addressesAndRestrictions.allAddresses.length > 0) {
    options.push('Show restrictions');
  }
  if (exemptedAddresses.length > 0) {
    options.push('Show exempted addresses');
  }
  options.push(
    'Verify transfer',
    'Change exempt wallet',
    'Change default restrictions',
    'Change individual restrictions',
    'Explore account',
    'Operate with multiple restrictions'
  );

  let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'RETURN' });
  let optionSelected = index !== -1 ? options[index] : 'RETURN';
  console.log('Selected:', optionSelected, '\n');
  switch (optionSelected) {
    case 'Show restrictions':
      showRestrictionTable(
        addressesAndRestrictions.allAddresses,
        addressesAndRestrictions.allowedTokens,
        addressesAndRestrictions.typeOfRestriction,
        addressesAndRestrictions.rollingPeriodInDays,
        addressesAndRestrictions.startTime,
        addressesAndRestrictions.endTime
      );
      break;
    case 'Show exempted addresses':
      showExemptedAddresses(exemptedAddresses);
      break;
    case 'Verify transfer':
      await verifyTransfer(true, false);
      break;
    case 'Change exempt wallet':
      await changeExemptWallet();
      break;
    case 'Change default restrictions':
      await changeDefaultRestrictions(hasGlobalDailyRestriction, hasGlobalCustomRestriction);
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

function showRestrictionTable(investorArray, amountArray, typeArray, rollingPeriodArray, startTimeArray, endTimeTimeArray) {
  let dataTable = [['Investor', 'Maximum transfer (# or %)', 'Rolling period (days)', 'Start date', 'End date']];
  for (let i = 0; i < investorArray.length; i++) {
    dataTable.push([
      investorArray[i],
      typeArray[i] === "0" ? `${web3.utils.fromWei(amountArray[i])} ${tokenSymbol}` : `${fromWeiPercentage(amountArray[i])}%`,
      rollingPeriodArray[i],
      moment.unix(startTimeArray[i]).format('MMM Do YYYY HH:mm'),
      moment.unix(endTimeTimeArray[i]).format('MMM Do YYYY HH:mm')
    ]);
  }
  console.log();
  console.log(table(dataTable));
}

function showExemptedAddresses(addresses) {
  console.log("*********** Exepmpted addresses ***********");
  addresses.map(i => console.log(i));
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

  let wallet = input.readAddress('Enter the wallet to change: ');
  let changeExemptWalletAction = currentTransferManager.methods.changeExemptWalletList(wallet, change);
  let changeExemptWalletReceipt = await common.sendTransaction(changeExemptWalletAction);
  let changeExemptWalletEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, changeExemptWalletReceipt.logs, 'ChangedExemptWalletList');
  console.log(chalk.green(`${changeExemptWalletEvent._wallet} has been ${changeExemptWalletEvent._change ? `added to` : `removed from`} exempt wallets successfully!`));
}

async function changeDefaultRestrictions(hasGlobalDailyRestriction, hasGlobalCustomRestriction) {
  let options = [];
  if (!hasGlobalDailyRestriction) {
    options.push('Add global daily restriction');
  } else {
    options.push('Modify global daily restriction', 'Remove global daily restriction');
  }

  if (!hasGlobalCustomRestriction) {
    options.push('Add global custom restriction');
  } else {
    options.push('Modify global custom restriction', 'Remove global custom restriction');
  }

  let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'RETURN' });
  let optionSelected = index !== -1 ? options[index] : 'RETURN';
  console.log('Selected:', optionSelected, '\n');
  switch (optionSelected) {
    case 'Add global daily restriction':
      let globalDailyRestrictoToAdd = inputRestrictionData(true);
      let addGlobalDailyRestrictionAction = currentTransferManager.methods.addDefaultDailyRestriction(
        globalDailyRestrictoToAdd.allowedTokens,
        globalDailyRestrictoToAdd.startTime,
        globalDailyRestrictoToAdd.endTime,
        globalDailyRestrictoToAdd.restrictionType
      );
      let addGlobalDailyRestrictionReceipt = await common.sendTransaction(addGlobalDailyRestrictionAction);
      let addGlobalDailyRestrictionEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, addGlobalDailyRestrictionReceipt.logs, 'AddDefaultDailyRestriction');
      console.log(chalk.green(`Global daily restriction has been added successfully!`));
      break;
    case 'Modify global daily restriction':
      let globalDailyRestrictoToModify = inputRestrictionData(true);
      let modifyGlobalDailyRestrictionAction = currentTransferManager.methods.modifyDefaultDailyRestriction(
        globalDailyRestrictoToModify.allowedTokens,
        globalDailyRestrictoToModify.startTime,
        globalDailyRestrictoToModify.endTime,
        globalDailyRestrictoToModify.restrictionType
      );
      let modifyGlobalDailyRestrictionReceipt = await common.sendTransaction(modifyGlobalDailyRestrictionAction);
      let modifyGlobalDailyRestrictionEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, modifyGlobalDailyRestrictionReceipt.logs, 'ModifyDefaultDailyRestriction');
      console.log(chalk.green(`Global daily restriction has been modified successfully!`));
      break;
    case 'Remove global daily restriction':
      let removeGlobalDailyRestrictionAction = currentTransferManager.methods.removeDefaultDailyRestriction();
      let removeGlobalDailyRestrictionReceipt = await common.sendTransaction(removeGlobalDailyRestrictionAction);
      let removeGlobalDailyRestrictionEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, removeGlobalDailyRestrictionReceipt.logs, 'DefaultDailyRestrictionRemoved');
      console.log(chalk.green(`Global daily restriction has been removed successfully!`));
      break;
    case 'Add global custom restriction':
      let globalCustomRestrictoToAdd = inputRestrictionData(false);
      let addGlobalCustomRestrictionAction = currentTransferManager.methods.addDefaultRestriction(
        globalCustomRestrictoToAdd.allowedTokens,
        globalCustomRestrictoToAdd.startTime,
        globalCustomRestrictoToAdd.rollingPeriodInDays,
        globalCustomRestrictoToAdd.endTime,
        globalCustomRestrictoToAdd.restrictionType
      );
      let addGlobalCustomRestrictionReceipt = await common.sendTransaction(addGlobalCustomRestrictionAction);
      let addGlobalCustomRestrictionEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, addGlobalCustomRestrictionReceipt.logs, 'AddDefaultRestriction');
      console.log(chalk.green(`Global custom restriction has been added successfully!`));
      break;
    case 'Modify global custom restriction':
      let globalCustomRestrictoToModify = inputRestrictionData(false);
      let modifiyGlobalCustomRestrictionAction = currentTransferManager.methods.modifyDefaultRestriction(
        globalCustomRestrictoToModify.allowedTokens,
        globalCustomRestrictoToModify.startTime,
        globalCustomRestrictoToModify.rollingPeriodInDays,
        globalCustomRestrictoToModify.endTime,
        globalCustomRestrictoToModify.restrictionType
      );
      let modifyGlobalCustomRestrictionReceipt = await common.sendTransaction(modifiyGlobalCustomRestrictionAction);
      let modifyGlobalCustomRestrictionEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, modifyGlobalCustomRestrictionReceipt.logs, 'ModifyDefaultRestriction');
      console.log(chalk.green(`Global custom restriction has been modified successfully!`));
      break;
    case 'Remove global custom restriction':
      let removeGlobalCustomRestrictionAction = currentTransferManager.methods.removeDefaultRestriction();
      let removeGlobalCustomRestrictionReceipt = await common.sendTransaction(removeGlobalCustomRestrictionAction);
      let removeGlobalCustomRestrictionEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, removeGlobalCustomRestrictionReceipt.logs, 'DefaultRestrictionRemoved');
      console.log(chalk.green(`Global custom restriction has been removed successfully!`));
      break;
  }
}

async function changeIndividualRestrictions() {
  let holder = input.readAddress('Enter the address of the token holder, whom restriction will be implied: ');

  let currentDailyRestriction = await currentTransferManager.methods.getIndividualDailyRestriction(holder).call();
  let hasDailyRestriction = parseInt(currentDailyRestriction[1]) !== 0;
  let currentCustomRestriction = await currentTransferManager.methods.getIndividualRestriction(holder).call();
  let hasCustomRestriction = parseInt(currentCustomRestriction[1]) !== 0;

  console.log(`*** Current individual restrictions for ${holder} ***`, '\n');

  console.log(`- Daily restriction:       ${hasDailyRestriction ? '' : 'None'}`);
  if (hasDailyRestriction) {
    console.log(`     Type:                         ${RESTRICTION_TYPES[currentDailyRestriction[4]]}`);
    console.log(`     Allowed tokens:               ${currentDailyRestriction[4] === "0" ? `${web3.utils.fromWei(currentDailyRestriction[0])} ${tokenSymbol}` : `${fromWeiPercentage(currentDailyRestriction[0])}%`}`);
    console.log(`     Start time:                   ${moment.unix(currentDailyRestriction[1]).format('MMMM Do YYYY, HH:mm:ss')}`);
    console.log(`     Rolling period:               ${currentDailyRestriction[2]} days`);
    console.log(`     End time:                     ${moment.unix(currentDailyRestriction[3]).format('MMMM Do YYYY, HH:mm:ss')} `);
  }
  console.log(`- Custom restriction:      ${hasCustomRestriction ? '' : 'None'} `);
  if (hasCustomRestriction) {
    console.log(`     Type:                         ${RESTRICTION_TYPES[currentCustomRestriction[4]]}`);
    console.log(`     Allowed tokens:               ${currentCustomRestriction[4] === "0" ? `${web3.utils.fromWei(currentDailyRestriction[0])} ${tokenSymbol}` : `${fromWeiPercentage(currentDailyRestriction[0])}%`}`);
    console.log(`     Start time:                   ${moment.unix(currentCustomRestriction[1]).format('MMMM Do YYYY, HH:mm:ss')}`);
    console.log(`     Rolling period:               ${currentCustomRestriction[2]} days`);
    console.log(`     End time:                     ${moment.unix(currentCustomRestriction[3]).format('MMMM Do YYYY, HH:mm:ss')} `);
  }

  let options = [];
  if (!hasDailyRestriction) {
    options.push('Add individual daily restriction');
  } else {
    options.push('Modify individual daily restriction', 'Remove individual daily restriction');
  }

  if (!hasCustomRestriction) {
    options.push('Add individual custom restriction');
  } else {
    options.push('Modify individual custom restriction', 'Remove individual custom restriction');
  }

  let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'RETURN' });
  let optionSelected = index !== -1 ? options[index] : 'RETURN';
  console.log('Selected:', optionSelected, '\n');
  switch (optionSelected) {
    case 'Add individual daily restriction':
      let dailyRestrictonToAdd = inputRestrictionData(true);
      let addDailyRestrictionAction = currentTransferManager.methods.addIndividualDailyRestriction(
        holder,
        dailyRestrictonToAdd.allowedTokens,
        dailyRestrictonToAdd.startTime,
        dailyRestrictonToAdd.endTime,
        dailyRestrictonToAdd.restrictionType
      );
      let addDailyRestrictionReceipt = await common.sendTransaction(addDailyRestrictionAction);
      let addDailyRestrictionEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, addDailyRestrictionReceipt.logs, 'AddIndividualDailyRestriction');
      console.log(chalk.green(`Daily restriction for ${addDailyRestrictionEvent._holder} has been added successfully!`));
      break;
    case 'Modify individual daily restriction':
      let dailyRestrictonToModify = inputRestrictionData(true);
      let modifyDailyRestrictionAction = currentTransferManager.methods.modifyIndividualDailyRestriction(
        holder,
        dailyRestrictonToModify.allowedTokens,
        dailyRestrictonToModify.startTime,
        dailyRestrictonToModify.endTime,
        dailyRestrictonToModify.restrictionType
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
    case 'Add individual custom restriction':
      let restrictonToAdd = inputRestrictionData(false);
      let addCustomRestrictionAction = currentTransferManager.methods.addIndividualRestriction(
        holder,
        restrictonToAdd.allowedTokens,
        restrictonToAdd.startTime,
        restrictonToAdd.rollingPeriodInDays,
        restrictonToAdd.endTime,
        restrictonToAdd.restrictionType
      );
      let addCustomRestrictionReceipt = await common.sendTransaction(addCustomRestrictionAction);
      let addCustomRestrictionEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, addCustomRestrictionReceipt.logs, 'AddIndividualRestriction');
      console.log(chalk.green(`Custom restriction for ${addCustomRestrictionEvent._holder} has been added successfully!`));
      break;
    case 'Modify individual custom restriction':
      let restrictonToModify = inputRestrictionData(false);
      let modifyCustomRestrictionAction = currentTransferManager.methods.modifyIndividualRestriction(
        holder,
        restrictonToModify.allowedTokens,
        restrictonToModify.startTime,
        restrictonToModify.rollingPeriodInDays,
        restrictonToModify.endTime,
        restrictonToModify.restrictionType
      );
      let modifyCustomRestrictionReceipt = await common.sendTransaction(modifyCustomRestrictionAction);
      let modifyCustomRestrictionEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, modifyCustomRestrictionReceipt.logs, 'ModifyIndividualRestriction');
      console.log(chalk.green(`Custom restriction for ${modifyCustomRestrictionEvent._holder} has been modified successfully!`));
      break;
    case 'Remove individual custom restriction':
      let removeCustomRestrictionAction = currentTransferManager.methods.removeIndividualRestriction(holder);
      let removeCustomRestrictionReceipt = await common.sendTransaction(removeCustomRestrictionAction);
      let removeCustomRestrictionEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, removeCustomRestrictionReceipt.logs, 'IndividualRestrictionRemoved');
      console.log(chalk.green(`Custom restriction for ${removeCustomRestrictionEvent._holder} has been removed successfully!`));
      break;
    case 'RETURN':
      return;
  }
}

async function exploreAccount() {
  let account = input.readAddress('Enter the account to explore: ');

  let applyingDailyRestriction = null;
  let applyingCustomRestriction = null;
  let hasIndividualRestrictions = false;
  let exempted = await currentTransferManager.methods.getExemptAddress().call();
  let isExempted = exempted.includes(account);
  if (!isExempted) {
    let individuallDailyRestriction = await currentTransferManager.methods.getIndividualDailyRestriction(account).call();
    if (parseInt(individuallDailyRestriction[3]) !== 0) {
      applyingDailyRestriction = individuallDailyRestriction;
    }
    let customRestriction = await currentTransferManager.methods.getIndividualRestriction(account).call();
    if (parseInt(customRestriction[3]) !== 0) {
      applyingCustomRestriction = customRestriction;
    }

    hasIndividualRestrictions = applyingCustomRestriction || applyingDailyRestriction;

    if (!hasIndividualRestrictions) {
      let globalDailyRestriction = await currentTransferManager.methods.getDefaultDailyRestriction().call();
      if (parseInt(globalDailyRestriction[3]) !== 0) {
        applyingDailyRestriction = globalDailyRestriction;
      }
      let globalCustomRestriction = await currentTransferManager.methods.getDefaultRestriction().call();
      if (parseInt(globalCustomRestriction[3]) === 0) {
        applyingCustomRestriction = globalCustomRestriction;
      }
    }
  }

  console.log(`*** Applying restrictions for ${account} ***`, '\n');

  console.log(`- Daily restriction:       ${applyingDailyRestriction ? (!hasIndividualRestrictions ? 'global' : '') : 'None'}`);
  if (applyingDailyRestriction) {
    console.log(`     Type:                 ${RESTRICTION_TYPES[applyingDailyRestriction[4]]}`);
    console.log(`     Allowed tokens:       ${applyingDailyRestriction[4] === "0" ? `${web3.utils.fromWei(applyingDailyRestriction[0])} ${tokenSymbol}` : `${fromWeiPercentage(applyingDailyRestriction[0])}%`}`);
    console.log(`     Start time:           ${moment.unix(applyingDailyRestriction[1]).format('MMMM Do YYYY, HH:mm:ss')}`);
    console.log(`     Rolling period:       ${applyingDailyRestriction[2]} days`);
    console.log(`     End time:             ${moment.unix(applyingDailyRestriction[3]).format('MMMM Do YYYY, HH:mm:ss')} `);
  }
  console.log(`- Other restriction:       ${applyingCustomRestriction ? (!hasIndividualRestrictions ? 'global' : '') : 'None'} `);
  if (applyingCustomRestriction) {
    console.log(`     Type:                 ${RESTRICTION_TYPES[applyingCustomRestriction[4]]}`);
    console.log(`     Allowed tokens:       ${applyingCustomRestriction[4] === "0" ? `${web3.utils.fromWei(applyingCustomRestriction[0])} ${tokenSymbol}` : `${fromWeiPercentage(applyingCustomRestriction[0])}%`}`);
    console.log(`     Start time:           ${moment.unix(applyingCustomRestriction[1]).format('MMMM Do YYYY, HH:mm:ss')}`);
    console.log(`     Rolling period:       ${applyingCustomRestriction[2]} days`);
    console.log(`     End time:             ${moment.unix(applyingCustomRestriction[3]).format('MMMM Do YYYY, HH:mm:ss')} `);
  }

  if (applyingCustomRestriction || applyingDailyRestriction) {
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
      await addCustomRestrictionsInBatch();
      break;
    case 'Modify multiple individual restrictions':
      await modifyCustomRestrictionsInBatch();
      break;
    case 'Remove multiple individual restrictions':
      await removeCustomRestrictionsInBatch();
      break;
  }
}

async function addDailyRestrictionsInBatch() {
  let csvFilePath = readlineSync.question(`Enter the path for csv data file (${ADD_DAILY_RESTRICTIONS_DATA_CSV}): `, {
    defaultInput: ADD_DAILY_RESTRICTIONS_DATA_CSV
  });
  let batchSize = input.readNumberGreaterThan(0, `Enter the max number of records per transaction or batch size (${gbl.constants.DEFAULT_BATCH_SIZE}): `, gbl.constants.DEFAULT_BATCH_SIZE);
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
  let batchSize = input.readNumberGreaterThan(0, `Enter the max number of records per transaction or batch size (${gbl.constants.DEFAULT_BATCH_SIZE}): `, gbl.constants.DEFAULT_BATCH_SIZE);
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
  let batchSize = input.readNumberGreaterThan(0, `Enter the max number of records per transaction or batch size (${gbl.constants.DEFAULT_BATCH_SIZE}): `, gbl.constants.DEFAULT_BATCH_SIZE);
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

async function addCustomRestrictionsInBatch() {
  let csvFilePath = readlineSync.question(`Enter the path for csv data file (${ADD_CUSTOM_RESTRICTIONS_DATA_CSV}): `, {
    defaultInput: ADD_CUSTOM_RESTRICTIONS_DATA_CSV
  });
  let batchSize = input.readNumberGreaterThan(0, `Enter the max number of records per transaction or batch size (${gbl.constants.DEFAULT_BATCH_SIZE}): `, gbl.constants.DEFAULT_BATCH_SIZE);
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
    console.log(`Batch ${batch + 1} - Attempting to add custom restrictions to the following accounts: \n\n`, holderArray[batch], '\n');
    allowanceArray[batch] = allowanceArray[batch].map(n => web3.utils.toWei(n.toString()));
    restrictionTypeArray[batch] = restrictionTypeArray[batch].map(n => RESTRICTION_TYPES.indexOf(n));
    let action = currentTransferManager.methods.addIndividualRestrictionMulti(holderArray[batch], allowanceArray[batch], startTimeArray[batch], rollingPeriodArray[batch], endTimeArray[batch], restrictionTypeArray[batch]);
    let receipt = await common.sendTransaction(action);
    console.log(chalk.green('Add multiple custom restrictions transaction was successful.'));
    console.log(`${receipt.gasUsed} gas used.Spent: ${web3.utils.fromWei((new web3.utils.BN(receipt.gasUsed)).mul(new web3.utils.BN(defaultGasPrice)))} ETH`);
  }
}

async function modifyCustomRestrictionsInBatch() {
  let csvFilePath = readlineSync.question(`Enter the path for csv data file (${MODIFY_CUSTOM_RESTRICTIONS_DATA_CSV}): `, {
    defaultInput: MODIFY_CUSTOM_RESTRICTIONS_DATA_CSV
  });
  let batchSize = input.readNumberGreaterThan(0, `Enter the max number of records per transaction or batch size (${gbl.constants.DEFAULT_BATCH_SIZE}): `, gbl.constants.DEFAULT_BATCH_SIZE);
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
    console.log(`Batch ${batch + 1} - Attempting to modify custom restrictions to the following accounts: \n\n`, holderArray[batch], '\n');
    allowanceArray[batch] = allowanceArray[batch].map(n => web3.utils.toWei(n.toString()));
    restrictionTypeArray[batch] = restrictionTypeArray[batch].map(n => RESTRICTION_TYPES.indexOf(n));
    let action = currentTransferManager.methods.modifyIndividualRestrictionMulti(holderArray[batch], allowanceArray[batch], startTimeArray[batch], rollingPeriodArray[batch], endTimeArray[batch], restrictionTypeArray[batch]);
    let receipt = await common.sendTransaction(action);
    console.log(chalk.green('Modify multiple custom restrictions transaction was successful.'));
    console.log(`${receipt.gasUsed} gas used.Spent: ${web3.utils.fromWei((new web3.utils.BN(receipt.gasUsed)).mul(new web3.utils.BN(defaultGasPrice)))} ETH`);
  }
}

async function removeCustomRestrictionsInBatch() {
  let csvFilePath = readlineSync.question(`Enter the path for csv data file (${REMOVE_CUSTOM_RESTRICTIONS_DATA_CSV}): `, {
    defaultInput: REMOVE_CUSTOM_RESTRICTIONS_DATA_CSV
  });
  let batchSize = input.readNumberGreaterThan(0, `Enter the max number of records per transaction or batch size (${gbl.constants.DEFAULT_BATCH_SIZE}): `, gbl.constants.DEFAULT_BATCH_SIZE);
  let parsedData = csvParse(csvFilePath);
  let validData = parsedData.filter(row => web3.utils.isAddress(row[0]));
  let invalidRows = parsedData.filter(row => !validData.includes(row));
  if (invalidRows.length > 0) {
    console.log(chalk.red(`The following lines from csv file are not valid: ${invalidRows.map(r => parsedData.indexOf(r) + 1).join(',')} `));
  }
  let batches = common.splitIntoBatches(validData, batchSize);
  let [holderArray] = common.transposeBatches(batches);
  for (let batch = 0; batch < batches.length; batch++) {
    console.log(`Batch ${batch + 1} - Attempting to remove custom restrictions to the following accounts: \n\n`, holderArray[batch], '\n');
    let action = currentTransferManager.methods.removeIndividualRestrictionMulti(holderArray[batch]);
    let receipt = await common.sendTransaction(action);
    console.log(chalk.green('Remove multiple custom restrictions transaction was successful.'));
    console.log(`${receipt.gasUsed} gas used.Spent: ${web3.utils.fromWei((new web3.utils.BN(receipt.gasUsed)).mul(new web3.utils.BN(defaultGasPrice)))} ETH`);
  }
}

function inputRestrictionData(isDaily) {
  let restriction = {};
  restriction.restrictionType = readlineSync.keyInSelect(RESTRICTION_TYPES, 'How do you want to set the allowance? ', { cancel: false });
  if (restriction.restrictionType == RESTRICTION_TYPES.indexOf('Fixed')) {
    restriction.allowedTokens = web3.utils.toWei(readlineSync.question(`Enter the maximum amount of tokens allowed to be traded every ${isDaily ? 'day' : 'rolling period'}: `).toString());
  } else {
    restriction.allowedTokens = toWeiPercentage(readlineSync.question(`Enter the maximum percentage of total supply allowed to be traded every ${isDaily ? 'day' : 'rolling period'}: `).toString());
  }
  if (isDaily) {
    restriction.rollingPeriodInDays = 1;
  } else {
    restriction.rollingPeriodInDays = readlineSync.questionInt(`Enter the rolling period in days (10 days): `, { defaultInput: 10 });
  }
  restriction.startTime = readlineSync.questionInt(`Enter the time (Unix Epoch time) at which restriction get into effect (now = 0): `, { defaultInput: 0 });
  let oneMonthFromNow = Math.floor(Date.now() / 1000) + gbl.constants.DURATION.days(30);
  let minValue = parseInt(restriction.startTime) + gbl.constants.DURATION.days(restriction.rollingPeriodInDays);
  restriction.endTime = input.readNumberGreaterThan(minValue, `Enter the time (Unix Epoch time) when the purchase lockup period ends and the investor can freely purchase tokens from others (1 month from now = ${oneMonthFromNow}): `, oneMonthFromNow);
  return restriction;
}

async function lockUpTransferManager() {
  console.log('\n', chalk.blue(`Lockup Transfer Manager at ${currentTransferManager.options.address}`), '\n');

  let currentLockups = await currentTransferManager.methods.getAllLockups().call();
  console.log(`- Lockups:    ${currentLockups.length}`);

  let options = ['Verify transfer', 'Add new lockup'];
  if (currentLockups.length > 0) {
    options.push('Show all existing lockups', 'Manage existing lockups', 'Explore investor');
  }
  options.push('Operate with multiple lockups');

  let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'RETURN' });
  let optionSelected = index !== -1 ? options[index] : 'RETURN';
  console.log('Selected:', optionSelected, '\n');
  switch (optionSelected) {
    case 'Verify transfer':
      await verifyTransfer(true, false);
      break;
    case 'Add new lockup':
      let name = input.readStringNonEmpty(`Enter the name of the lockup type: `);
      let lockupAmount = readlineSync.questionInt(`Enter the amount of tokens that will be locked: `);
      let minuteFromNow = Math.floor(Date.now() / 1000) + 60;
      let startTime = readlineSync.questionInt(`Enter the start time (Unix Epoch time) of the lockup type (a minute from now = ${minuteFromNow}): `, { defaultInput: minuteFromNow });
      let lockUpPeriodSeconds = readlineSync.questionInt(`Enter the total period (seconds) of the lockup type (ten minutes = 600): `, { defaultInput: 600 });
      let releaseFrequencySeconds = readlineSync.questionInt(`Enter how often to release a tranche of tokens in seconds (one minute = 60): `, { defaultInput: 60 });
      if (readlineSync.keyInYNStrict(`Do you want to add an investor to this lockup type? `)) {
        let investor = input.readAddress(`Enter the address of the investor: `);
        let addNewLockUpToUserAction = currentTransferManager.methods.addNewLockUpToUser(
          investor,
          web3.utils.toWei(lockupAmount.toString()),
          startTime,
          lockUpPeriodSeconds,
          releaseFrequencySeconds,
          web3.utils.toHex(name)
        );
        let addNewLockUpToUserReceipt = await common.sendTransaction(addNewLockUpToUserAction);
        let addNewLockUpToUserEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, addNewLockUpToUserReceipt.logs, 'AddNewLockUpType');
        console.log(chalk.green(`${web3.utils.hexToUtf8(addNewLockUpToUserEvent._lockupName)} lockup type has been added successfully!`));
        let addLockUpToUserEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, addNewLockUpToUserReceipt.logs, 'AddLockUpToUser');
        console.log(chalk.green(`${addLockUpToUserEvent._userAddress} has been added to ${web3.utils.hexToUtf8(addLockUpToUserEvent._lockupName)} successfully!`));
      } else {
        let addLockupTypeAction = currentTransferManager.methods.addNewLockUpType(web3.utils.toWei(lockupAmount.toString()), startTime, lockUpPeriodSeconds, releaseFrequencySeconds, web3.utils.toHex(name));
        let addLockupTypeReceipt = await common.sendTransaction(addLockupTypeAction);
        let addLockupTypeEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, addLockupTypeReceipt.logs, 'AddNewLockUpType');
        console.log(chalk.green(`${web3.utils.hexToUtf8(addLockupTypeEvent._lockupName)} lockup type has been added successfully!`));
      }
      break;
    case 'Show all existing lockups':
      let allLockups = await currentTransferManager.methods.getAllLockupData().call();
      let nameArray = allLockups[0];
      let amountArray = allLockups[1];
      let startTimeArray = allLockups[2];
      let periodSecondsArray = allLockups[3];
      let releaseFrequencySecondsArray = allLockups[4];
      let unlockedAmountsArray = allLockups[5];
      showLockupTable(nameArray, amountArray, startTimeArray, periodSecondsArray, releaseFrequencySecondsArray, unlockedAmountsArray);
      break;
    case 'Manage existing lockups':
      let options = currentLockups.map(b => web3.utils.hexToUtf8(b));
      let index = readlineSync.keyInSelect(options, 'Which lockup type do you want to manage? ', { cancel: 'RETURN' });
      let optionSelected = index !== -1 ? options[index] : 'RETURN';
      console.log('Selected:', optionSelected, '\n');
      if (index !== -1) {
        await manageExistingLockups(currentLockups[index]);
      }
      break;
    case 'Explore investor':
      let investorToExplore = input.readAddress('Enter the address you want to explore: ');
      let lockupsToInvestor = await currentTransferManager.methods.getLockupsNamesToUser(investorToExplore).call();
      if (lockupsToInvestor.length > 0) {
        let lockedTokenToInvestor = await currentTransferManager.methods.getLockedTokenToUser(investorToExplore).call();
        console.log(chalk.green(`The address ${investorToExplore} has ${web3.utils.fromWei(lockedTokenToInvestor)} ${tokenSymbol} locked across the following ${lockupsToInvestor.length} lockups: `));
        lockupsToInvestor.map(l => console.log(chalk.green(`- ${web3.utils.hexToUtf8(l)}`)));
      } else {
        console.log(chalk.yellow(`The address ${investorToExplore} has no lockups`));
      }
      break;
    case 'Operate with multiple lockups':
      await operateWithMultipleLockups(currentLockups);
      break;
    case 'RETURN':
      return;
  }

  await lockUpTransferManager();
}

function showLockupTable(nameArray, amountArray, startTimeArray, periodSecondsArray, releaseFrequencySecondsArray, unlockedAmountsArray) {
  let dataTable = [['Lockup Name', `Amount (${tokenSymbol})`, 'Start time', 'Period (seconds)', 'Release frequency (seconds)', `Unlocked amount (${tokenSymbol})`]];
  for (let i = 0; i < nameArray.length; i++) {
    dataTable.push([
      web3.utils.hexToUtf8(nameArray[i]),
      web3.utils.fromWei(amountArray[i]),
      moment.unix(startTimeArray[i]).format('MM/DD/YYYY HH:mm'),
      periodSecondsArray[i],
      releaseFrequencySecondsArray[i],
      web3.utils.fromWei(unlockedAmountsArray[i])
    ]);
  }
  console.log();
  console.log(table(dataTable));
}

async function manageExistingLockups(lockupName) {
  console.log('\n', chalk.blue(`Lockup ${web3.utils.hexToUtf8(lockupName)}`), '\n');

  // Show current data
  let currentLockup = await currentTransferManager.methods.getLockUp(lockupName).call();
  let investors = await currentTransferManager.methods.getListOfAddresses(lockupName).call();

  console.log(`- Amount:               ${web3.utils.fromWei(currentLockup.lockupAmount)} ${tokenSymbol}`);
  console.log(`- Currently unlocked:   ${web3.utils.fromWei(currentLockup.unlockedAmount)}  ${tokenSymbol}`);
  console.log(`- Start time:           ${moment.unix(currentLockup.startTime).format('MMMM Do YYYY, HH:mm:ss')}`);
  console.log(`- Lockup period:        ${currentLockup.lockUpPeriodSeconds} seconds`);
  console.log(`- End time:             ${moment.unix(currentLockup.startTime).add(parseInt(currentLockup.lockUpPeriodSeconds), 'seconds').format('MMMM Do YYYY, HH:mm:ss')}`); console.log(`- Release frequency:    ${currentLockup.releaseFrequencySeconds} seconds`);
  console.log(`- Number of investors:  ${investors.length}`);
  // ------------------

  let options = [
    'Modify properties',
    'Show investors',
    'Add investors to this lockup',
    'Remove investors from this lockup',
    'Delete this lockup type'
  ];

  let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'RETURN' });
  let optionSelected = index !== -1 ? options[index] : 'RETURN';
  console.log('Selected:', optionSelected, '\n');
  switch (optionSelected) {
    case 'Modify properties':
      let lockupAmount = readlineSync.questionInt(`Enter the amount of tokens that will be locked: `);
      let minuteFromNow = Math.floor(Date.now() / 1000) + 60;
      let startTime = readlineSync.questionInt(`Enter the start time (Unix Epoch time) of the lockup type (a minute from now = ${minuteFromNow}): `, { defaultInput: minuteFromNow });
      let lockUpPeriodSeconds = readlineSync.questionInt(`Enter the total period (seconds) of the lockup type (ten minutes = 600): `, { defaultInput: 600 });
      let releaseFrequencySeconds = readlineSync.questionInt(`Enter how often to release a tranche of tokens in seconds (one minute = 60): `, { defaultInput: 60 });
      let modifyLockUpTypeAction = currentTransferManager.methods.modifyLockUpType(web3.utils.toWei(lockupAmount.toString()), startTime, lockUpPeriodSeconds, releaseFrequencySeconds, lockupName);
      let modifyLockUpTypeReceipt = await common.sendTransaction(modifyLockUpTypeAction);
      let modifyLockUpTypeEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, modifyLockUpTypeReceipt.logs, 'ModifyLockUpType');
      console.log(chalk.green(`${web3.utils.hexToUtf8(modifyLockUpTypeEvent._lockupName)} lockup type has been modified successfully!`));
      break;
    case 'Show investors':
      if (investors.length > 0) {
        console.log("************ List of investors ************");
        investors.map(i => console.log(i));
      } else {
        console.log(chalk.yellow("There are no investors yet"));
      }
      break;
    case 'Add this lockup to investors':
      let investorsToAdd = input.readMultipleAddresses(`Enter the addresses of the investors separated by comma (i.e.addr1, addr2, addr3): `).split(",");
      let addInvestorToLockupAction;
      if (investorsToAdd.length === 1) {
        addInvestorToLockupAction = currentTransferManager.methods.addLockUpByName(investorsToAdd[0], lockupName);
      } else {
        addInvestorToLockupAction = currentTransferManager.methods.addLockUpByNameMulti(investorsToAdd, investorsToAdd.map(i => lockupName));
      }
      let addInvestorToLockupReceipt = await common.sendTransaction(addInvestorToLockupAction);
      let addInvestorToLockupEvents = common.getMultipleEventsFromLogs(currentTransferManager._jsonInterface, addInvestorToLockupReceipt.logs, 'AddLockUpToUser');
      addInvestorToLockupEvents.map(e => console.log(chalk.green(`${e._userAddress} has been added to ${web3.utils.hexToUtf8(e._lockupName)} successfully!`)));
      break;
    case 'Remove this lockup from investors':
      let investorsToRemove = input.readMultipleAddresses(`Enter the addresses of the investors separated by comma (i.e.addr1, addr2, addr3): `).split(",");
      let removeLockupFromInvestorAction;
      if (investorsToRemove.length === 1) {
        removeLockupFromInvestorAction = currentTransferManager.methods.removeLockUpFromUser(investorsToRemove[0], lockupName);
      } else {
        removeLockupFromInvestorAction = currentTransferManager.methods.removeLockUpFromUserMulti(investorsToRemove, investorsToRemove.map(i => lockupName));
      }
      let removeLockUpFromUserReceipt = await common.sendTransaction(removeLockupFromInvestorAction);
      let removeLockUpFromUserEvents = common.getMultipleEventsFromLogs(currentTransferManager._jsonInterface, removeLockUpFromUserReceipt.logs, 'RemoveLockUpFromUser');
      removeLockUpFromUserEvents.map(e => console.log(chalk.green(`${e._userAddress} has been removed to ${web3.utils.hexToUtf8(e._lockupName)} successfully!`)));
      break;
    case 'Delete this lockup type':
      let isEmpty = investors.length === 0;
      if (!isEmpty) {
        console.log(chalk.yellow(`This lockup have investors added to it. To delete it you must remove them first.`));
        if (readlineSync.keyInYNStrict(`Do you want to remove them? `)) {
          let data = investors.map(i => [i, lockupName])
          let batches = common.splitIntoBatches(data, gbl.constants.DEFAULT_BATCH_SIZE);
          let [investorArray, lockupNameArray] = common.transposeBatches(batches);
          for (let batch = 0; batch < batches.length; batch++) {
            console.log(`Batch ${batch + 1} - Attempting to remove the following investors:\n\n`, investorArray[batch], '\n');
            let action = currentTransferManager.methods.removeLockUpFromUserMulti(investorArray[batch], lockupNameArray[batch]);
            let receipt = await common.sendTransaction(action);
            console.log(chalk.green('Remove lockups from multiple investors transaction was successful.'));
            console.log(`${receipt.gasUsed} gas used.Spent: ${web3.utils.fromWei((new web3.utils.BN(receipt.gasUsed)).mul(new web3.utils.BN(defaultGasPrice)))} ETH`);
          }
          isEmpty = true;
        }
      }
      if (isEmpty) {
        let removeLockupTypeAction = currentTransferManager.methods.removeLockupType(lockupName);
        let removeLockupTypeReceipt = await common.sendTransaction(removeLockupTypeAction);
        let removeLockupTypeEvent = common.getEventFromLogs(currentTransferManager._jsonInterface, removeLockupTypeReceipt.logs, 'RemoveLockUpType');
        console.log(chalk.green(`${web3.utils.hexToUtf8(removeLockupTypeEvent._lockupName)} lockup type has been deleted successfully!`));
      }
      return;
    case 'RETURN':
      return;
  }

  await manageExistingLockups(lockupName);
}

async function operateWithMultipleLockups(currentLockups) {
  let options = ['Add multiple lockups'];
  if (currentLockups.length > 0) {
    options.push('Modify multiple lockups');
  }
  options.push(
    'Delete multiple lockups',
    'Add lockups to multiple investors',
    'Remove lockups from multiple investors'
  );

  let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'RETURN' });
  let optionSelected = index !== -1 ? options[index] : 'RETURN';
  console.log('Selected:', optionSelected, '\n');
  switch (optionSelected) {
    case 'Add multiple lockups':
      await addLockupsInBatch();
      break;
    case 'Modify multiple lockups':
      await modifyLockupsInBatch();
      break;
    case 'Delete multiple lockups':
      await deleteLockupsInBatch();
      break;
    case 'Add lockups to multiple investors':
      await addLockupsToInvestorsInBatch();
      break;
    case 'Remove lockups from multiple investors':
      await removeLockupsFromInvestorsInBatch();
      break;
  }
}

async function addLockupsInBatch() {
  let csvFilePath = readlineSync.question(`Enter the path for csv data file (${ADD_LOCKUP_DATA_CSV}): `, {
    defaultInput: ADD_LOCKUP_DATA_CSV
  });
  let batchSize = input.readNumberGreaterThan(0, `Enter the max number of records per transaction or batch size (${gbl.constants.DEFAULT_BATCH_SIZE}): `, gbl.constants.DEFAULT_BATCH_SIZE);
  let parsedData = csvParse(csvFilePath);
  let validData = parsedData.filter(
    row => !isNaN(row[0]) &&
      moment.unix(row[1]).isValid() &&
      (!isNaN(row[2] && (parseFloat(row[2]) % 1 === 0))) &&
      (!isNaN(row[3] && (parseFloat(row[3]) % 1 === 0))) &&
      typeof row[4] === 'string');
  let invalidRows = parsedData.filter(row => !validData.includes(row));
  if (invalidRows.length > 0) {
    console.log(chalk.red(`The following lines from csv file are not valid: ${invalidRows.map(r => parsedData.indexOf(r) + 1).join(',')} `));
  }
  let batches = common.splitIntoBatches(validData, batchSize);
  let [amountArray, startTimeArray, lockUpPeriodArray, releaseFrequencyArray, lockupNameArray] = common.transposeBatches(batches);
  for (let batch = 0; batch < batches.length; batch++) {
    console.log(`Batch ${batch + 1} - Attempting to add the following lockups: \n\n`, lockupNameArray[batch], '\n');
    lockupNameArray[batch] = lockupNameArray[batch].map(n => web3.utils.toHex(n));
    amountArray[batch] = amountArray[batch].map(n => web3.utils.toWei(n.toString()));
    let action = currentTransferManager.methods.addNewLockUpTypeMulti(amountArray[batch], startTimeArray[batch], lockUpPeriodArray[batch], releaseFrequencyArray[batch], lockupNameArray[batch]);
    let receipt = await common.sendTransaction(action);
    console.log(chalk.green('Add multiple lockups transaction was successful.'));
    console.log(`${receipt.gasUsed} gas used.Spent: ${web3.utils.fromWei((new web3.utils.BN(receipt.gasUsed)).mul(new web3.utils.BN(defaultGasPrice)))} ETH`);
  }
}

async function modifyLockupsInBatch() {
  let csvFilePath = readlineSync.question(`Enter the path for csv data file (${MODIFY_LOCKUP_DATA_CSV}): `, {
    defaultInput: MODIFY_LOCKUP_DATA_CSV
  });
  let batchSize = input.readNumberGreaterThan(0, `Enter the max number of records per transaction or batch size (${gbl.constants.DEFAULT_BATCH_SIZE}): `, gbl.constants.DEFAULT_BATCH_SIZE);
  let parsedData = csvParse(csvFilePath);
  let validData = parsedData.filter(
    row => !isNaN(row[0]) &&
      moment.unix(row[1]).isValid() &&
      (!isNaN(row[2] && (parseFloat(row[2]) % 1 === 0))) &&
      (!isNaN(row[3] && (parseFloat(row[3]) % 1 === 0))) &&
      typeof row[4] === 'string');
  let invalidRows = parsedData.filter(row => !validData.includes(row));
  if (invalidRows.length > 0) {
    console.log(chalk.red(`The following lines from csv file are not valid: ${invalidRows.map(r => parsedData.indexOf(r) + 1).join(',')} `));
  }
  let batches = common.splitIntoBatches(validData, batchSize);
  let [amountArray, startTimeArray, lockUpPeriodArray, releaseFrequencyArray, lockupNameArray] = common.transposeBatches(batches);
  for (let batch = 0; batch < batches.length; batch++) {
    console.log(`Batch ${batch + 1} - Attempting to modify the following lockups: \n\n`, lockupNameArray[batch], '\n');
    lockupNameArray[batch] = lockupNameArray[batch].map(n => web3.utils.toHex(n));
    amountArray[batch] = amountArray[batch].map(n => web3.utils.toWei(n.toString()));
    let action = currentTransferManager.methods.modifyLockUpTypeMulti(amountArray[batch], startTimeArray[batch], lockUpPeriodArray[batch], releaseFrequencyArray[batch], lockupNameArray[batch]);
    let receipt = await common.sendTransaction(action);
    console.log(chalk.green('Modify multiple lockups transaction was successful.'));
    console.log(`${receipt.gasUsed} gas used.Spent: ${web3.utils.fromWei((new web3.utils.BN(receipt.gasUsed)).mul(new web3.utils.BN(defaultGasPrice)))} ETH`);
  }
}

async function deleteLockupsInBatch() {
  let csvFilePath = readlineSync.question(`Enter the path for csv data file (${DELETE_LOCKUP_DATA_CSV}): `, {
    defaultInput: DELETE_LOCKUP_DATA_CSV
  });
  let batchSize = input.readNumberGreaterThan(0, `Enter the max number of records per transaction or batch size (${gbl.constants.DEFAULT_BATCH_SIZE}): `, gbl.constants.DEFAULT_BATCH_SIZE);
  let parsedData = csvParse(csvFilePath);
  let validData = parsedData.filter(row => typeof row[0] === 'string');
  let invalidRows = parsedData.filter(row => !validData.includes(row));
  if (invalidRows.length > 0) {
    console.log(chalk.red(`The following lines from csv file are not valid: ${invalidRows.map(r => parsedData.indexOf(r) + 1).join(',')} `));
  }
  let batches = common.splitIntoBatches(validData, batchSize);
  let [lockupNameArray] = common.transposeBatches(batches);
  for (let batch = 0; batch < batches.length; batch++) {
    console.log(`Batch ${batch + 1} - Attempting to delete the following lockups: \n\n`, lockupNameArray[batch], '\n');
    lockupNameArray[batch] = lockupNameArray[batch].map(n => web3.utils.toHex(n));
    let action = currentTransferManager.methods.removeLockupTypeMulti(lockupNameArray[batch]);
    let receipt = await common.sendTransaction(action);
    console.log(chalk.green('Delete multiple lockups transaction was successful.'));
    console.log(`${receipt.gasUsed} gas used.Spent: ${web3.utils.fromWei((new web3.utils.BN(receipt.gasUsed)).mul(new web3.utils.BN(defaultGasPrice)))} ETH`);
  }
}

async function addLockupsToInvestorsInBatch() {
  let csvFilePath = readlineSync.question(`Enter the path for csv data file (${ADD_LOCKUP_INVESTOR_DATA_CSV}): `, {
    defaultInput: ADD_LOCKUP_INVESTOR_DATA_CSV
  });
  let batchSize = input.readNumberGreaterThan(0, `Enter the max number of records per transaction or batch size (${gbl.constants.DEFAULT_BATCH_SIZE}): `, gbl.constants.DEFAULT_BATCH_SIZE);
  let parsedData = csvParse(csvFilePath);
  let validData = parsedData.filter(
    row => web3.utils.isAddress(row[0]) &&
      typeof row[1] === 'string');
  let invalidRows = parsedData.filter(row => !validData.includes(row));
  if (invalidRows.length > 0) {
    console.log(chalk.red(`The following lines from csv file are not valid: ${invalidRows.map(r => parsedData.indexOf(r) + 1).join(',')} `));
  }
  let batches = common.splitIntoBatches(validData, batchSize);
  let [investorArray, lockupNameArray] = common.transposeBatches(batches);
  for (let batch = 0; batch < batches.length; batch++) {
    console.log(`Batch ${batch + 1} - Attempting to add lockups to the following investors: \n\n`, investorArray[batch], '\n');
    lockupNameArray[batch] = lockupNameArray[batch].map(n => web3.utils.toHex(n));
    let action = currentTransferManager.methods.addLockUpByNameMulti(investorArray[batch], lockupNameArray[batch]);
    let receipt = await common.sendTransaction(action);
    console.log(chalk.green('Add lockups to multiple investors transaction was successful.'));
    console.log(`${receipt.gasUsed} gas used.Spent: ${web3.utils.fromWei((new web3.utils.BN(receipt.gasUsed)).mul(new web3.utils.BN(defaultGasPrice)))} ETH`);
  }
}

async function removeLockupsFromInvestorsInBatch() {
  let csvFilePath = readlineSync.question(`Enter the path for csv data file (${REMOVE_LOCKUP_INVESTOR_DATA_CSV}): `, {
    defaultInput: REMOVE_LOCKUP_INVESTOR_DATA_CSV
  });
  let batchSize = input.readNumberGreaterThan(0, `Enter the max number of records per transaction or batch size (${gbl.constants.DEFAULT_BATCH_SIZE}): `, gbl.constants.DEFAULT_BATCH_SIZE);
  let parsedData = csvParse(csvFilePath);
  let validData = parsedData.filter(
    row => web3.utils.isAddress(row[0]) &&
      typeof row[1] === 'string');
  let invalidRows = parsedData.filter(row => !validData.includes(row));
  if (invalidRows.length > 0) {
    console.log(chalk.red(`The following lines from csv file are not valid: ${invalidRows.map(r => parsedData.indexOf(r) + 1).join(',')} `));
  }
  let batches = common.splitIntoBatches(validData, batchSize);
  let [investorArray, lockupNameArray] = common.transposeBatches(batches);
  for (let batch = 0; batch < batches.length; batch++) {
    console.log(`Batch ${batch + 1} - Attempting to remove the following investors: \n\n`, investorArray[batch], '\n');
    lockupNameArray[batch] = lockupNameArray[batch].map(n => web3.utils.toHex(n));
    let action = currentTransferManager.methods.removeLockUpFromUserMulti(investorArray[batch], lockupNameArray[batch]);
    let receipt = await common.sendTransaction(action);
    console.log(chalk.green('Remove lockups from multiple investors transaction was successful.'));
    console.log(`${receipt.gasUsed} gas used.Spent: ${web3.utils.fromWei((new web3.utils.BN(receipt.gasUsed)).mul(new web3.utils.BN(defaultGasPrice)))} ETH`);
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
  return web3.utils.toWei((parseFloat(number) / 100).toString());
}

function fromWeiPercentage(number) {
  return web3.utils.fromWei(new web3.utils.BN(number).muln(100)).toString();
}

async function initialize(_tokenSymbol) {
  welcome();
  await setup();
  securityToken = await common.selectToken(securityTokenRegistry, _tokenSymbol);
  if (securityToken === null) {
    process.exit(0);
  } else {
    tokenSymbol = await securityToken.methods.symbol().call();
  }
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
    let iSecurityTokenRegistryABI = abis.iSecurityTokenRegistry();
    securityTokenRegistry = new web3.eth.Contract(iSecurityTokenRegistryABI, securityTokenRegistryAddress);
    securityTokenRegistry.setProvider(web3.currentProvider);

    let moduleRegistryAddress = await contracts.moduleRegistry();
    let moduleRegistryABI = abis.moduleRegistry();
    moduleRegistry = new web3.eth.Contract(moduleRegistryABI, moduleRegistryAddress);
    moduleRegistry.setProvider(web3.currentProvider);

    let polyTokenAddress = await contracts.polyToken();
    let polyTokenABI = abis.polyToken();
    polyToken = new web3.eth.Contract(polyTokenABI, polyTokenAddress);
    polyToken.setProvider(web3.currentProvider);
  } catch (err) {
    console.log(err)
    console.log('\x1b[31m%s\x1b[0m', "There was a problem getting the contracts. Make sure they are deployed to the selected network.");
    process.exit(0);
  }
}

async function logTotalInvestors() {
  let holdersCount = await securityToken.methods.holderCount().call();
  console.log(chalk.yellow(`Total holders at the moment: ${holdersCount} `));
}

async function logBalance(from, totalSupply) {
  let fromBalance = web3.utils.fromWei(await securityToken.methods.balanceOf(from).call());
  let fromBalanceUnlocked = web3.utils.fromWei(await securityToken.methods.balanceOfByPartition(web3.utils.asciiToHex('UNLOCKED'), from).call());
  output.logUnlockedBalanceWithPercentage(from, tokenSymbol, fromBalanceUnlocked, fromBalance, totalSupply);
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

async function getDisableControllerAckSigner(stAddress, from) {
    const typedData = {
        types: {
            EIP712Domain: [
                { name: 'name', type: 'string' },
                { name: 'chainId', type: 'uint256' },
                { name: 'verifyingContract', type: 'address' }
            ],
            Acknowledgment: [
                { name: 'text', type: 'string' }
            ],
        },
        primaryType: 'Acknowledgment',
        domain: {
            name: 'Polymath',
            chainId: 1,
            verifyingContract: stAddress
        },
        message: {
            text: 'I acknowledge that disabling controller is a permanent and irrevocable change',
        },
    };
    const result = await new Promise((resolve, reject) => {
        web3.currentProvider.send(
            {
                method: 'eth_signTypedData',
                params: [from, typedData]
            },
            (err, result) => {
                if (err) {
                    return reject(err);
                }
                resolve(result.result);
            }
        );
    });
    // console.log('signed by', from);
    // const recovered = sigUtil.recoverTypedSignature({
    //     data: typedData,
    //     sig: result
    // })
    // console.log('recovered address', recovered);
    return result;
}
