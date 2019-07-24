const readlineSync = require('readline-sync');
const chalk = require('chalk');
const moment = require('moment');
const BigNumber = require('bignumber.js');
const common = require('./common/common_functions');
const gbl = require('./common/global');
const contracts = require('./helpers/contract_addresses');
const abis = require('./helpers/contract_abis');
const csvParse = require('./helpers/csv');
const input = require('./IO/input');

// App flow
let securityTokenRegistry;
let securityToken;
let polyToken;
let tokenSymbol;
let currentWalletModule;

const ADD_SCHEDULE_CSV = `${__dirname}/../data/Wallet/VEW/add_schedule_data.csv`;
const ADD_SCHEDULE_FROM_TEMPLATE_CSV = `${__dirname}/../data/Wallet/VEW/add_schedule_from_template_data.csv`;
const MODIFY_SCHEDULE_CSV = `${__dirname}/../data/Wallet/VEW/modify_schedule_data.csv`;
const REVOKE_SCHEDULE_CSV = `${__dirname}/../data/Wallet/VEW/revoke_schedule_data.csv`;

async function executeApp() {
  console.log('\n', chalk.blue('Wallet - Main Menu', '\n'));
  
  let wModules = await common.getAllModulesByType(securityToken, gbl.constants.MODULES_TYPES.WALLET);
  let nonArchivedModules = wModules.filter(m => !m.archived);
  if (nonArchivedModules.length > 0) {
    console.log(`Wallet modules attached:`);
    nonArchivedModules.map(m => `${m.label}: ${m.name} (${m.version}) at ${m.address}`);
  } else {
    console.log(`There are no Wallet modules attached`);
  }

  let options = [];
  if (wModules.length > 0) {
    options.push('Config existing modules');
  }
  options.push('Add new Wallet module');
  
  let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'EXIT' });
  let optionSelected = index != -1 ? options[index] : 'EXIT';
  console.log('Selected:', optionSelected, '\n');
  switch (optionSelected) {
    case 'Config existing modules':
      await configExistingModules(nonArchivedModules);
      break;
    case 'Add new Wallet module':
      await addWalletModule();
      break;
    case 'EXIT':
      return;
  }

  await executeApp();
};

async function addWalletModule() {
  let moduleList = await common.getAvailableModules(moduleRegistry, gbl.constants.MODULES_TYPES.WALLET, securityToken.options.address);
  let options = moduleList.map(m => `${m.name} - ${m.version} (${m.factoryAddress})`);

  let index = readlineSync.keyInSelect(options, 'Which wallet module do you want to add? ', { cancel: 'RETURN' });
  if (index != -1 && readlineSync.keyInYNStrict(`Are you sure you want to add ${options[index]}? `)) {
    const moduleABI = abis.vestingEscrowWallet();
    await common.addModule(securityToken, polyToken, moduleList[index].factoryAddress, moduleABI, getVestingEscrowWalletInitializeData);
  }
}

function getVestingEscrowWalletInitializeData(moduleABI) {
  const treasuryWallet = input.readAddress('Enter the Ethereum address of the treasury wallet (or leave empty to use treasury wallet from ST): ', gbl.constants.ADDRESS_ZERO);
  const configureFunction = moduleABI.find(o => o.name === 'configure' && o.type === 'function');
  const bytes = web3.eth.abi.encodeFunctionCall(configureFunction, [treasuryWallet]);
  return bytes;
}

async function configExistingModules(walletModules) {
  let options = walletModules.map(m => `${m.label}: ${m.name} (${m.version}) at ${m.address}`);
  let index = readlineSync.keyInSelect(options, 'Which module do you want to config? ', { cancel: 'RETURN' });
  console.log('Selected:', index != -1 ? options[index] : 'RETURN', '\n');
  currentWalletModule = new web3.eth.Contract(abis.vestingEscrowWallet(), walletModules[index].address);
  currentWalletModule.setProvider(web3.currentProvider);

  await walletManager();
}

async function walletManager() {
  console.log(chalk.blue('\n', `Wallet module at ${currentWalletModule.options.address}`), '\n');

  const treasuryWallet = await currentWalletModule.methods.getTreasuryWallet().call();
  const unassignedTokens = await currentWalletModule.methods.unassignedTokens().call();
  const templates = await currentWalletModule.methods.getAllTemplateNames().call();
  const schedulesForCurrentUser = await currentWalletModule.methods.getScheduleCount(Issuer.address).call();

  console.log(`- Treasury wallet:        ${treasuryWallet}`);
  console.log(`- Unassigned Tokens:      ${web3.utils.fromWei(unassignedTokens)}`);
  console.log(`- Templates:              ${templates.length}`);

  let options = ['Change treasury wallet', 'Manage templates', 'Manage schedules', 'Manage multiple schedules in batch', 'Explore account', 'Deposit tokens'];
  if (parseInt(unassignedTokens) > 0) {
    options.push('Send unassigned tokens to treasury');
  }
  if (parseInt(schedulesForCurrentUser) > 0) {
    options.push('Pull available tokens');
  }
  let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'RETURN' });
  let selected = index != -1 ? options[index] : 'RETURN';
  console.log('Selected:', selected, '\n');
  switch (selected) {
    case 'Change treasury wallet':
      await changeTreasuryWallet();
      break;
    case 'Manage templates':
      await manageTemplates(templates);
      break;
    case 'Manage schedules':
      const beneficiary = input.readAddress('Enter the beneficiary account from which you want to manage schedules: ');
      await manageSchedules(beneficiary, templates);
      break;
    case 'Manage multiple schedules in batch':
      await multipleSchedules();
      break;
    case 'Explore account':
      const account = input.readAddress('Enter the account you want to explore: ');
      await exploreAccount(account);
      break;
    case 'Deposit tokens':
      await depositTokens();
      break;
    case 'Send unassigned tokens to treasury':
      await sendToTreasury(unassignedTokens);
      break
    case 'Pull available tokens':
      await pullAvailableTokens();
      break
    case 'RETURN':
      return;
  }

  await walletManager();
}

async function changeTreasuryWallet() {
  let newTreasuryWallet = input.readAddress('Enter the new account address for treasury wallet: ');
  let action = currentWalletModule.methods.changeTreasuryWallet(newTreasuryWallet);
  let receipt = await common.sendTransaction(action);
  let event = common.getEventFromLogs(currentDividendsModule._jsonInterface, receipt.logs, 'TreasuryWalletChanged');
  console.log(chalk.green(`The treasury wallet has been changed successfully to ${event._newWallet}!`));
}

async function manageTemplates(templateNames) {
  console.log('\n', chalk.blue('Wallet - Template manager', '\n'));

  const allTemplates = await getTemplates(templateNames);

  allTemplates.map(t => console.log(formatTemplateAsString(t), '\n'));

  const options = ['Add template'];
  if (templateNames.length > 0) {
    options.push('Remove template');
  }
  const index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'RETURN' });
  const selected = index != -1 ? options[index] : 'RETURN';
  console.log('Selected:', selected, '\n');
  switch (selected) {
    case 'Add template':
      await addTemplate();
      break;
    case 'Remove template':
      const templateToDelete = (selectTemplate(allTemplates)).name;
      await removeTemplate(templateToDelete);
      break;
  }
}

async function manageSchedules(beneficiary, allTemplateNames) {
  console.log('\n', chalk.blue('Wallet - Schedules manager', '\n'));

  const templateNames = await currentWalletModule.methods.getTemplateNames(beneficiary).call();
  let schedules = [];
  if (templateNames.length > 0) {
    schedules = await getSchedules(beneficiary, templateNames);
    console.log(`Current vesting schedules for ${beneficiary}:        ${schedules.length}`);
    schedules.map(t => console.log('-', formatScheduleAsString(t), `\n`));
  } else {
    console.log(`Current vesting schedules for ${beneficiary}:        None`);
  }

  const options = ['Add vesting schedule'];
  if (schedules.length > 0) {
    options.push('Modify vesting schedule', 'Revoke vesting schedule', 'Revoke all vesting schedules', 'Push available tokens');
  }
  const index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'RETURN' });
  const selected = index != -1 ? options[index] : 'RETURN';
  console.log('Selected:', selected, '\n');
  switch (selected) {
    case 'Add vesting schedule':
      await addSchedule(beneficiary, allTemplateNames);
      break;
    case 'Modify vesting schedule':
      const scheduleToModify = selectSchedule(schedules, true);
      if (scheduleToModify) {
        await modifySchedule(beneficiary, scheduleToModify);
      } else {
        console.log(chalk.yellow(`There are no valid schedules to modify`));
      }
      break;
    case 'Revoke vesting schedule':
      const scheduleToRevoke = selectSchedule(schedules, false);
      await revokeSchedule(beneficiary, scheduleToRevoke);
      break;
    case 'Revoke all vesting schedules':
      await revokeAllSchedules(beneficiary);
      break;
    case 'Push available tokens':
      await pushAvailableTokens(beneficiary);
      break;
    case 'RETURN':
      return;
  }

  await manageSchedules(beneficiary, allTemplateNames);
}

function formatTemplateAsString(template) {
  return `- ${template.name}
  Amount: ${template.amount} ${tokenSymbol}
  Duration: ${template.duration} seconds
  Frequency: ${template.frequency} seconds`;
}

function formatScheduleAsString(schedule) {
  return `Template:   ${schedule.templateName}
  Amount:     ${schedule.amount} ${tokenSymbol}
  Duration:   ${schedule.duration} seconds
  Frequency:  ${schedule.frequency} seconds
  Start time: ${moment.unix(schedule.startTime).format('MMMM Do YYYY, HH:mm:ss')}
  Claimed:    ${schedule.claimedTokens} ${tokenSymbol}
  State:      ${schedule.state === '0' ? 'Created' : schedule.state === '1' ? 'Started' : 'Completed'}`;
}

function selectTemplate(allTemplates) {
  const options = allTemplates.map(t => t.name);
  const index = readlineSync.keyInSelect(options, 'Select a template', { cancel: false });
  return allTemplates[index];
}

async function addTemplate() {
  const templateData = inputTemplateData();
  
  const action = currentWalletModule.methods.addTemplate(web3.utils.toHex(templateData.name), web3.utils.toWei(templateData.amount), templateData.duration, templateData.frequency);
  const receipt = await common.sendTransaction(action);
  const event = common.getEventFromLogs(currentWalletModule._jsonInterface, receipt.logs, 'AddTemplate');
  console.log(chalk.green(`The template has been added successfully!`));
}

function inputTemplateData() {
  const name = input.readStringNonEmpty('Enter a name for the template: ');
  console.log(chalk.yellow(`Note: Values must meet this two requirements to be valid`));
  console.log(chalk.yellow(`1. Frequency must be a factor of duration.`));
  console.log(chalk.yellow(`2. Period count (Duration / Frequency) must be a factor of number of tokens.`));
  const amount = input.readNumberGreaterThan(0, 'Enter the number of tokens that should be assigned to schedule: ');
  const duration = input.readNumberGreaterThan(0, 'Enter the duration of the vesting schedule in seconds: ');
  const frequency = input.readNumberGreaterThan(0, 'Enter the frequency in seconds at which tokens will be released: ');
  return {
    name: name,
    amount: amount,
    duration: duration,
    frequency: frequency
  };
}

async function removeTemplate(templateName) {
  const action = currentWalletModule.methods.removeTemplate(web3.utils.toHex(templateName));
  const receipt = await common.sendTransaction(action);
  const event = common.getEventFromLogs(currentWalletModule._jsonInterface, receipt.logs, 'RemoveTemplate');
  console.log(chalk.green(`The template has been removed successfully!`));
}

async function getTemplates(templateNames) {
  // const templateList = await Promise.all(templateNames.map(async function (t) {
  //   const templateName = web3.utils.hexToUtf8(t);
  //   const templateData = await currentWalletModule.methods.templates(t).call();
  //   return {
  //     name: templateName,
  //     amount: web3.utils.fromWei(templateData.numberOfTokens),
  //     duration: templateData.duration,
  //     frequency: templateData.frequency
  //    };
  // }));

  const templateEvents = await currentWalletModule.getPastEvents('AddTemplate', { fromBlock: 0});
  const templateList = templateEvents.map(function (t) {
    const templateName = web3.utils.hexToUtf8(t.returnValues._name);
    return {
      name: templateName,
      amount: web3.utils.fromWei(t.returnValues._numberOfTokens),
      duration: t.returnValues._duration,
      frequency: t.returnValues._frequency
      };
  });

  return templateList;
}

async function getSchedules(beneficiary, templateNames) {
  const scheduleList = await Promise.all(templateNames.map(async function (t) {
    const templateName = web3.utils.hexToUtf8(t);
    const scheduleData = await currentWalletModule.methods.getSchedule(beneficiary, t).call();
    return {
      templateName: templateName,
      amount: web3.utils.fromWei(scheduleData[0]),
      duration: scheduleData[1],
      frequency: scheduleData[2],
      startTime: scheduleData[3],
      claimedTokens: web3.utils.fromWei(scheduleData[4]),
      state: scheduleData[5]
    };
  }));

  return scheduleList;
}

async function addSchedule(beneficiary, allTemplateNames) {
  const minuteFromNow = Math.floor(Date.now() / 1000) + 60;
  const startTime = input.readDateInTheFuture(`Enter the start date (Unix Epoch time) of the vesting schedule (a minute from now = ${minuteFromNow}): `, minuteFromNow);
  
  const currentBalance = await securityToken.methods.balanceOf(Issuer.address).call();
  console.log(chalk.yellow(`Your current balance is ${web3.utils.fromWei(currentBalance)} ${tokenSymbol}`));
  
  const useTemplate = readlineSync.keyInYNStrict(`Do you want to use an existing template?`);
  let action;
  let templateData;
  if (useTemplate) {
    const allTemplates = await getTemplates(allTemplateNames);
    templateData = selectTemplate(allTemplates);
    action = currentWalletModule.methods.addScheduleFromTemplate(beneficiary, web3.utils.toHex(templateData.name), startTime);
  } else {
    templateData = inputTemplateData();
    action = currentWalletModule.methods.addSchedule(
      beneficiary,
      web3.utils.toHex(templateData.name),
      web3.utils.toWei(templateData.amount),
      templateData.duration,
      templateData.frequency,
      startTime
    );
  }

  const unassignedTokens = await currentWalletModule.methods.unassignedTokens().call();
  const availableTokens = new BigNumber(unassignedTokens).plus(new BigNumber(currentBalance));
  if (availableTokens.isGreaterThanOrEqualTo(new BigNumber(web3.utils.toWei(templateData.amount)))) {
    await approveTokens(templateData.amount);
    const receipt = await common.sendTransaction(action);
    const event = common.getEventFromLogs(currentWalletModule._jsonInterface, receipt.logs, 'AddSchedule');
    console.log(chalk.green('Schedule has been added successfully!'));
  } else {
    console.log(chalk.red(`\n`, 'You have no enough balance!!!'));
  }
}

function selectSchedule(schedules, onlyCreated) {
  let schedulesToShow;
  if (onlyCreated) {
    schedulesToShow = schedules.filter(s => s.state === '0');
  } else {
    schedulesToShow = schedules;
  }

  if (schedulesToShow.length > 0) {
    const options = schedulesToShow.map(s => `${s.templateName}
    Start time: ${moment.unix(parseInt(s.startTime)).format('MMMM Do YYYY, HH:mm:ss')}`
    );
    const index = readlineSync.keyInSelect(options, 'Select a schedule', { cancel: false });
    return schedules[index].templateName;
  } else {
    return null;
  }
}

async function modifySchedule(beneficiary, templateName) {
  const minuteFromNow = Math.floor(Date.now() / 1000) + 60;
  const startTime = input.readDateInTheFuture(`Enter the new start date (Unix Epoch time) of the vesting schedule (a minute from now = ${minuteFromNow}): `, minuteFromNow);
  const action = currentWalletModule.methods.modifySchedule(beneficiary, web3.utils.toHex(templateName), startTime);
  const receipt = await common.sendTransaction(action);
  const event = common.getEventFromLogs(currentWalletModule._jsonInterface, receipt.logs, 'ModifySchedule');
  console.log(chalk.green('The schedule has been modified successfully!'));
}

async function revokeSchedule(beneficiary, templateName) {
  if (readlineSync.keyInYNStrict(`Are you sure you want to revoke this schedule?`)) {
    const action = currentWalletModule.methods.revokeSchedule(beneficiary, web3.utils.toHex(templateName));
    const receipt = await common.sendTransaction(action);
    const event = common.getEventFromLogs(currentWalletModule._jsonInterface, receipt.logs, 'RevokeSchedule');
    console.log(chalk.green('The schedule has been revoked successfully!'));
  }
}

async function revokeAllSchedules(beneficiary) {
  if (readlineSync.keyInYNStrict(`Are you sure you want to revoke ALL the schedules for this beneficiary?`)) {
    const action = currentWalletModule.methods.revokeAllSchedules(beneficiary);
    const receipt = await common.sendTransaction(action);
    const event = common.getEventFromLogs(currentWalletModule._jsonInterface, receipt.logs, 'RevokeAllSchedules');
    console.log(chalk.green(`All schedules for ${beneficiary} has been revoked successfully!`));
  }
}

async function approveTokens(amount) {
  const action = securityToken.methods.approve(currentWalletModule._address, web3.utils.toWei(amount));
  const receipt = await common.sendTransaction(action);
  const event = common.getEventFromLogs(securityToken._jsonInterface, receipt.logs, 'Approval');
  console.log(chalk.green(`${amount} ${tokenSymbol} has been approved successfully!`));
}

async function depositTokens() {
  const currentBalance = await securityToken.methods.balanceOf(Issuer.address).call();
  console.log(chalk.yellow(`Your current balance is ${web3.utils.fromWei(currentBalance)} ${tokenSymbol}`));
  const amount = input.readNumberGreaterThan(0, `Enter the amount of tokens you want to deposit: `);
  if ((new BigNumber(currentBalance)).isGreaterThanOrEqualTo(new BigNumber(web3.utils.toWei(amount)))) {
    await approveTokens(amount);
    const action = currentWalletModule.methods.depositTokens(web3.utils.toWei(amount));
    const receipt = await common.sendTransaction(action);
    const event = common.getEventFromLogs(currentWalletModule._jsonInterface, receipt.logs, 'DepositTokens');
    console.log(chalk.green('Tokens have been deposited successfully!'));
  } else {
    console.log(chalk.red('You have no enough balance!'));
  }
}

async function sendToTreasury(unassignedTokens) {
  const amount = input.readNumberBetween(0, parseFloat(web3.utils.fromWei(unassignedTokens)), `Enter the amount of tokens you want to send to treasury: `);
  const action = currentWalletModule.methods.sendToTreasury(web3.utils.toWei(amount));
  const receipt = await common.sendTransaction(action);
  const event = common.getEventFromLogs(currentWalletModule._jsonInterface, receipt.logs, 'SendToTreasury');
  console.log(chalk.green('Tokens have been sent to treasury successfully!'));
}

async function pushAvailableTokens(beneficiary) {
  const action = currentWalletModule.methods.pushAvailableTokens(beneficiary);
  const receipt = await common.sendTransaction(action);
  const event = common.getMultipleEventsFromLogs(currentWalletModule._jsonInterface, receipt.logs, 'SendTokens');
  console.log(chalk.green(`Tokens have been sent to ${beneficiary} successfully!`));
}

async function pullAvailableTokens() {
  const action = currentWalletModule.methods.pullAvailableTokens();
  const receipt = await common.sendTransaction(action);
  const event = common.getMultipleEventsFromLogs(currentWalletModule._jsonInterface, receipt.logs, 'SendTokens');
  console.log(chalk.green(`Tokens have been sent to you successfully!`));
  const currentBalance = await securityToken.methods.balanceOf(Issuer.address).call();
  console.log(chalk.yellow(`Your current balance is ${web3.utils.fromWei(currentBalance)} ${tokenSymbol}`));
}

async function exploreAccount(account) {
  console.log('\n', chalk.blue(`Wallet - Account explorer for ${account}`, '\n'));

  const currentBalance = await securityToken.methods.balanceOf(account).call();
  console.log(`Current balance:                ${web3.utils.fromWei(currentBalance)} ${tokenSymbol}`);
  const templateNames = await currentWalletModule.methods.getTemplateNames(account).call();
  let schedules = [];
  if (templateNames.length > 0) {
    schedules = await getSchedules(account, templateNames);
    console.log(`Current vesting schedules:      ${schedules.length}`);
    schedules.map(t => console.log('-', formatScheduleAsString(t), `\n`));
  } else {
    console.log(`Current vesting schedules:      None`);
  }
}

async function multipleSchedules() {
  console.log('\n', chalk.blue('Wallet - Schedules in batch', '\n'));

  const options = ['Add multiple schedules', 'Add multiple schedules from template', 'Modify multiple schedules', 'Revoke multiple schedules'];
  const index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'RETURN' });
  const selected = index != -1 ? options[index] : 'RETURN';
  console.log('Selected:', selected, '\n');
  switch (selected) {
    case 'Add multiple schedules':
      await addSchedulesInBatch();
      break;
    case 'Add multiple schedules from template':
      await addSchedulesFromTemplateInBatch();
      break;
    case 'Modify multiple schedules':
      await modifySchedulesInBatch();
      break;
    case 'Revoke multiple schedules':
      await revokeSchedulesInBatch();
      break;
    case 'RETURN':
      return;
  }

  await multipleSchedules();
}

async function addSchedulesInBatch() {
  let csvFilePath = readlineSync.question(`Enter the path for csv data file (${ADD_SCHEDULE_CSV}): `, {
    defaultInput: ADD_SCHEDULE_CSV
  });
  let batchSize = input.readNumberGreaterThan(0, `Enter the max number of records per transaction or batch size (${gbl.constants.DEFAULT_BATCH_SIZE}): `, gbl.constants.DEFAULT_BATCH_SIZE);
  let parsedData = csvParse(csvFilePath);
  let validData = parsedData.filter(
    row => web3.utils.isAddress(row[0]) &&
      typeof row[1] === 'string' &&
      (!isNaN(row[2])) &&
      (!isNaN(row[3] && (parseFloat(row[3]) % 1 === 0))) &&
      (!isNaN(row[4] && (parseFloat(row[3]) % 1 === 0))) &&
      moment.unix(row[5]).isValid()
  );

  let invalidRows = parsedData.filter(row => !validData.includes(row));
  if (invalidRows.length > 0) {
    console.log(chalk.red(`The following lines from csv file are not valid: ${invalidRows.map(r => parsedData.indexOf(r) + 1).join(',')} `));
  }
  let batches = common.splitIntoBatches(validData, batchSize);
  let [beneficiaryArray, templateNameArray, amountArray, durationArray, frequencyArray, startTimeArray] = common.transposeBatches(batches);
  for (let batch = 0; batch < batches.length; batch++) {
    console.log(`Batch ${batch + 1} - Attempting to add schedules to the following beneficiaries:\n\n`, beneficiaryArray[batch], '\n');
    templateNameArray[batch] = templateNameArray[batch].map(n => web3.utils.toHex(n));
    amountArray[batch] = amountArray[batch].map(n => web3.utils.toWei(n.toString()));
    let action = currentWalletModule.methods.addScheduleMulti(beneficiaryArray[batch], templateNameArray[batch], amountArray[batch], durationArray[batch], frequencyArray[batch], startTimeArray[batch]);
    let receipt = await common.sendTransaction(action);
    console.log(chalk.green('Add multiple schedules transaction was successful.'));
    console.log(`${receipt.gasUsed} gas used.Spent: ${web3.utils.fromWei((new web3.utils.BN(receipt.gasUsed)).mul(new web3.utils.BN(defaultGasPrice)))} ETH`);
  }
}

async function addSchedulesFromTemplateInBatch() {
  let csvFilePath = readlineSync.question(`Enter the path for csv data file (${ADD_SCHEDULE_FROM_TEMPLATE_CSV}): `, {
    defaultInput: ADD_SCHEDULE_FROM_TEMPLATE_CSV
  });
  let batchSize = input.readNumberGreaterThan(0, `Enter the max number of records per transaction or batch size (${gbl.constants.DEFAULT_BATCH_SIZE}): `, gbl.constants.DEFAULT_BATCH_SIZE);
  let parsedData = csvParse(csvFilePath);
  let validData = parsedData.filter(
    row => web3.utils.isAddress(row[0]) &&
      typeof row[1] === 'string' &&
      moment.unix(row[2]).isValid()
  );

  let invalidRows = parsedData.filter(row => !validData.includes(row));
  if (invalidRows.length > 0) {
    console.log(chalk.red(`The following lines from csv file are not valid: ${invalidRows.map(r => parsedData.indexOf(r) + 1).join(',')} `));
  }
  let batches = common.splitIntoBatches(validData, batchSize);
  let [beneficiaryArray, templateNameArray, startTimeArray] = common.transposeBatches(batches);
  for (let batch = 0; batch < batches.length; batch++) {
    console.log(`Batch ${batch + 1} - Attempting to add schedules from template to the following beneficiaries:\n\n`, beneficiaryArray[batch], '\n');
    templateNameArray[batch] = templateNameArray[batch].map(n => web3.utils.toHex(n));
    let action = currentWalletModule.methods.addScheduleFromTemplateMulti(beneficiaryArray[batch], templateNameArray[batch], startTimeArray[batch]);
    let receipt = await common.sendTransaction(action);
    console.log(chalk.green('Add multiple schedules from template transaction was successful.'));
    console.log(`${receipt.gasUsed} gas used.Spent: ${web3.utils.fromWei((new web3.utils.BN(receipt.gasUsed)).mul(new web3.utils.BN(defaultGasPrice)))} ETH`);
  }
}

async function modifySchedulesInBatch() {
  let csvFilePath = readlineSync.question(`Enter the path for csv data file (${MODIFY_SCHEDULE_CSV}): `, {
    defaultInput: MODIFY_SCHEDULE_CSV
  });
  let batchSize = input.readNumberGreaterThan(0, `Enter the max number of records per transaction or batch size (${gbl.constants.DEFAULT_BATCH_SIZE}): `, gbl.constants.DEFAULT_BATCH_SIZE);
  let parsedData = csvParse(csvFilePath);
  let validData = parsedData.filter(
    row => web3.utils.isAddress(row[0]) &&
      typeof row[1] === 'string' &&
      moment.unix(row[2]).isValid()
  );

  let invalidRows = parsedData.filter(row => !validData.includes(row));
  if (invalidRows.length > 0) {
    console.log(chalk.red(`The following lines from csv file are not valid: ${invalidRows.map(r => parsedData.indexOf(r) + 1).join(',')} `));
  }
  let batches = common.splitIntoBatches(validData, batchSize);
  let [beneficiaryArray, templateNameArray, startTimeArray] = common.transposeBatches(batches);
  for (let batch = 0; batch < batches.length; batch++) {
    console.log(`Batch ${batch + 1} - Attempting to modify schedules to the following beneficiaries:\n\n`, beneficiaryArray[batch], '\n');
    templateNameArray[batch] = templateNameArray[batch].map(n => web3.utils.toHex(n));
    let action = currentWalletModule.methods.modifyScheduleMulti(beneficiaryArray[batch], templateNameArray[batch], startTimeArray[batch]);
    let receipt = await common.sendTransaction(action);
    console.log(chalk.green('Modify multiple schedules transaction was successful.'));
    console.log(`${receipt.gasUsed} gas used.Spent: ${web3.utils.fromWei((new web3.utils.BN(receipt.gasUsed)).mul(new web3.utils.BN(defaultGasPrice)))} ETH`);
  }
}

async function revokeSchedulesInBatch() {
  let csvFilePath = readlineSync.question(`Enter the path for csv data file (${REVOKE_SCHEDULE_CSV}): `, {
    defaultInput: REVOKE_SCHEDULE_CSV
  });
  let batchSize = input.readNumberGreaterThan(0, `Enter the max number of records per transaction or batch size (${gbl.constants.DEFAULT_BATCH_SIZE}): `, gbl.constants.DEFAULT_BATCH_SIZE);
  let parsedData = csvParse(csvFilePath);
  let validData = parsedData.filter(
    row => web3.utils.isAddress(row[0])
  );

  let invalidRows = parsedData.filter(row => !validData.includes(row));
  if (invalidRows.length > 0) {
    console.log(chalk.red(`The following lines from csv file are not valid: ${invalidRows.map(r => parsedData.indexOf(r) + 1).join(',')} `));
  }
  let batches = common.splitIntoBatches(validData, batchSize);
  let [beneficiaryArray] = common.transposeBatches(batches);
  for (let batch = 0; batch < batches.length; batch++) {
    console.log(`Batch ${batch + 1} - Attempting to revoke schedules to the following beneficiaries:\n\n`, beneficiaryArray[batch], '\n');
    let action = currentWalletModule.methods.revokeSchedulesMulti(beneficiaryArray[batch]);
    let receipt = await common.sendTransaction(action);
    console.log(chalk.green('Revoke multiple schedules transaction was successful.'));
    console.log(`${receipt.gasUsed} gas used.Spent: ${web3.utils.fromWei((new web3.utils.BN(receipt.gasUsed)).mul(new web3.utils.BN(defaultGasPrice)))} ETH`);
  }
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
  console.log("******************************************");
  console.log("Welcome to the Command-Line Wallet Manager");
  console.log("******************************************");
  console.log("Issuer Account: " + Issuer.address + "\n");
}

async function setup() {
  try {
    let securityTokenRegistryAddress = await contracts.securityTokenRegistry();
    let iSecurityTokenRegistryABI = abis.iSecurityTokenRegistry();
    securityTokenRegistry = new web3.eth.Contract(iSecurityTokenRegistryABI, securityTokenRegistryAddress);
    securityTokenRegistry.setProvider(web3.currentProvider);

    let polyTokenAddress = await contracts.polyToken();
    let polyTokenABI = abis.polyToken();
    polyToken = new web3.eth.Contract(polyTokenABI, polyTokenAddress);
    polyToken.setProvider(web3.currentProvider);

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

module.exports = {
  executeApp: async function (_tokenSymbol) {
    await initialize(_tokenSymbol);
    return executeApp();
  }
}
