// Libraries for terminal prompts
const readlineSync = require('readline-sync');
const chalk = require('chalk');
const stoManager = require('./sto_manager');
const transferManager = require('./transfer_manager');
const common = require('./common/common_functions');
const gbl = require('./common/global');
const csvParse = require('./helpers/csv');

// Constants
const MULTIMINT_DATA_CSV = './CLI/data/ST/multi_mint_data.csv';

// Load contract artifacts
const contracts = require('./helpers/contract_addresses');
const abis = require('./helpers/contract_abis');

let securityTokenRegistry;
let polyToken;
let featureRegistry;
let securityToken;

let allModules;
let tokenSymbol

async function setup() {
  try {
    let securityTokenRegistryAddress = await contracts.securityTokenRegistry();
    let securityTokenRegistryABI = abis.securityTokenRegistry();
    securityTokenRegistry = new web3.eth.Contract(securityTokenRegistryABI, securityTokenRegistryAddress);
    securityTokenRegistry.setProvider(web3.currentProvider);

    let polytokenAddress = await contracts.polyToken();
    let polytokenABI = abis.polyToken();
    polyToken = new web3.eth.Contract(polytokenABI, polytokenAddress);
    polyToken.setProvider(web3.currentProvider);

    let featureRegistryAddress = await contracts.featureRegistry();
    let featureRegistryABI = abis.featureRegistry();
    featureRegistry = new web3.eth.Contract(featureRegistryABI, featureRegistryAddress);
    featureRegistry.setProvider(web3.currentProvider);
  } catch (err) {
    console.log(err);
    console.log(chalk.red(`There was a problem getting the contracts. Make sure they are deployed to the selected network.`));
    process.exit(0);
  }
}

// Start function
async function executeApp() {
  await showUserInfo(Issuer.address);
  while (securityToken) {
    allModules = await getAllModules();
    await displayTokenData();
    await displayModules();
    await selectAction();
  }
};

async function displayTokenData() {
  let displayTokenSymbol = await securityToken.methods.symbol().call();
  let displayTokenDetails = await securityToken.methods.tokenDetails().call();
  let displayVersion = await securityToken.methods.getVersion().call();
  let displayTokenSupply = await securityToken.methods.totalSupply().call();
  let displayInvestorsCount = await securityToken.methods.getInvestorCount().call();
  let displayCurrentCheckpointId = await securityToken.methods.currentCheckpointId().call();
  let displayTransferFrozen = await securityToken.methods.transfersFrozen().call();
  let displayMintingFrozen = await securityToken.methods.mintingFrozen().call();
  let displayUserTokens = await securityToken.methods.balanceOf(Issuer.address).call();

  console.log(`
***************    Security Token Information    ****************
- Address:              ${securityToken.options.address}
- Token symbol:         ${displayTokenSymbol.toUpperCase()}
- Token details:        ${displayTokenDetails}
- Token version:        ${displayVersion[0]}.${displayVersion[1]}.${displayVersion[2]}
- Total supply:         ${web3.utils.fromWei(displayTokenSupply)} ${displayTokenSymbol.toUpperCase()}
- Investors count:      ${displayInvestorsCount}
- Current checkpoint:   ${displayCurrentCheckpointId}
- Transfer frozen:      ${displayTransferFrozen ? 'YES' : 'NO'}
- Minting frozen:       ${displayMintingFrozen ? 'YES' : 'NO'}
- User balance:         ${web3.utils.fromWei(displayUserTokens)} ${displayTokenSymbol.toUpperCase()}`);
}

async function displayModules() {
  // Module Details
  let pmModules = allModules.filter(m => m.type == gbl.constants.MODULES_TYPES.PERMISSION);
  let tmModules = allModules.filter(m => m.type == gbl.constants.MODULES_TYPES.TRANSFER);
  let stoModules = allModules.filter(m => m.type == gbl.constants.MODULES_TYPES.STO);
  let cpModules = allModules.filter(m => m.type == gbl.constants.MODULES_TYPES.DIVIDENDS);
  let burnModules = allModules.filter(m => m.type == gbl.constants.MODULES_TYPES.BURN);

  // Module Counts
  let numPM = pmModules.length;
  let numTM = tmModules.length;
  let numSTO = stoModules.length;
  let numCP = cpModules.length;
  let numBURN = burnModules.length;

  console.log(`
*******************    Module Information    ********************
- Permission Manager:   ${(numPM > 0) ? numPM : 'None'}
- Transfer Manager:     ${(numTM > 0) ? numTM : 'None'}
- STO:                  ${(numSTO > 0) ? numSTO : 'None'}
- Checkpoint:           ${(numCP > 0) ? numCP : 'None'}
- Burn:                 ${(numBURN > 0) ? numBURN : 'None'}
  `);

  if (numPM) {
    console.log(`Permission Manager Modules:`);
    pmModules.map(m => console.log(`- ${m.name} is ${(m.archived) ? chalk.yellow('archived') : 'unarchived'} at ${m.address}`));
  }

  if (numTM) {
    console.log(`Transfer Manager Modules:`);
    tmModules.map(m => console.log(`- ${m.name} is ${(m.archived) ? chalk.yellow('archived') : 'unarchived'} at ${m.address}`));
  }

  if (numSTO) {
    console.log(`STO Modules:`);
    stoModules.map(m => console.log(`- ${m.name} is ${(m.archived) ? chalk.yellow('archived') : 'unarchived'} at ${m.address}`));
  }

  if (numCP) {
    console.log(`Checkpoint Modules:`);
    cpModules.map(m => console.log(`- ${m.name} is ${(m.archived) ? chalk.yellow('archived') : 'unarchived'} at ${m.address}`));
  }

  if (numBURN) {
    console.log(` Burn Modules:`);
    burnModules.map(m => console.log(`- ${m.name} is ${(m.archived) ? chalk.yellow('archived') : 'unarchived'} at ${m.address}`));
  }
}

async function selectAction() {
  let options = ['Update token details'/*, 'Change granularity'*/];

  let transferFrozen = await securityToken.methods.transfersFrozen().call();
  if (transferFrozen) {
    options.push('Unfreeze transfers');
  } else {
    options.push('Freeze transfers');
  }

  let isMintingFrozen = await securityToken.methods.mintingFrozen().call();
  if (!isMintingFrozen) {
    let isFreezeMintingAllowed = await featureRegistry.methods.getFeatureStatus('freezeMintingAllowed').call();
    if (isFreezeMintingAllowed) {
      options.push('Freeze minting permanently');
    }
  }

  options.push('Create a checkpoint', 'List investors')

  let currentCheckpointId = await securityToken.methods.currentCheckpointId().call();
  if (currentCheckpointId > 0) {
    options.push('List investors at checkpoint')
  }

  if (!isMintingFrozen) {
    options.push('Mint tokens');
  }

  options.push('Manage modules', 'Withdraw tokens from contract');

  let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'Exit' });
  let selected = index == -1 ? 'Exit' : options[index];
  console.log('Selected:', selected);
  switch (selected) {
    case 'Update token details':
      let updatedDetails = readlineSync.question('Enter new off-chain details of the token (i.e. Dropbox folder url): ');
      await updateTokenDetails(updatedDetails);
      break;
    case 'Change granularity':
      //let granularity = readlineSync.questionInt('Enter ')
      //await changeGranularity();
      break;
    case 'Freeze transfers':
      await freezeTransfers();
      break;
    case 'Unfreeze transfers':
      await unfreezeTransfers();
      break;
    case 'Freeze minting permanently':
      await freezeMinting();
      break;
    case 'Create a checkpoint':
      await createCheckpoint();
      break;
    case 'List investors':
      await listInvestors();
      break;
    case 'List investors at checkpoint':
      let checkpointId = readlineSync.question('Enter the id of the checkpoint: ', {
        limit: function (input) {
          return parseInt(input) > 0 && parseInt(input) <= parseInt(currentCheckpointId);
        },
        limitMessage: `Must be greater than 0 and less than ${currentCheckpointId}`
      });
      await listInvestorsAtCheckpoint(checkpointId);
      break;
    case 'Mint tokens':
      await mintTokens();
      break;
    case 'Manage modules':
      await listModuleOptions();
      break;
    case 'Withdraw tokens from contract':
      let tokenAddress = readlineSync.question(`Enter the ERC20 token address (POLY ${polyToken.options.address}): `, {
        limit: function (input) {
          return web3.utils.isAddress(input);
        },
        limitMessage: "Must be a valid address",
        defaultInput: polyToken.options.address
      });
      let value = readlineSync.questionFloat('Enter the value to withdraw: ', {
        limit: function (input) {
          return input > 0;
        },
        limitMessage: "Must be a greater than 0"
      });
      await withdrawFromContract(tokenAddress, web3.utils.toWei(new web3.utils.BN(value)));
      break;
    case 'Exit':
      process.exit();
      break;
  }
}

// Token actions
async function updateTokenDetails(updatedDetails) {
  let updateTokenDetailsAction = securityToken.methods.updateTokenDetails(updatedDetails);
  await common.sendTransaction(updateTokenDetailsAction);
  console.log(chalk.green(`Token details have been updated successfully!`));
}

async function freezeTransfers() {
  let freezeTransfersAction = securityToken.methods.freezeTransfers();
  await common.sendTransaction(freezeTransfersAction);
  console.log(chalk.green(`Transfers have been frozen successfully!`));
}

async function unfreezeTransfers() {
  let unfreezeTransfersAction = securityToken.methods.unfreezeTransfers();
  await common.sendTransaction(unfreezeTransfersAction);
  console.log(chalk.green(`Transfers have been unfrozen successfully!`));
}

async function freezeMinting() {
  let freezeMintingAction = securityToken.methods.freezeMinting();
  await common.sendTransaction(freezeMintingAction);
  console.log(chalk.green(`Minting has been frozen successfully!.`));
}

async function createCheckpoint() {
  let createCheckpointAction = securityToken.methods.createCheckpoint();
  let receipt = await common.sendTransaction(createCheckpointAction);
  let event = common.getEventFromLogs(securityToken._jsonInterface, receipt.logs, 'CheckpointCreated');
  console.log(chalk.green(`Checkpoint ${event._checkpointId} has been created successfully!`));
}

async function listInvestors() {
  let investors = await securityToken.methods.getInvestors().call();
  console.log();
  if (investors.length > 0) {
    console.log('***** List of investors *****');
    investors.map(i => console.log(i));
  } else {
    console.log(chalk.yellow('There are no investors yet'));
  }
}

async function listInvestorsAtCheckpoint(checkpointId) {
  let investors = await securityToken.methods.getInvestorsAt(checkpointId).call();
  console.log();
  if (investors.length > 0) {
    console.log(`*** List of investors at checkpoint ${checkpointId} ***`);
    investors.map(i => console.log(i));
  } else {
    console.log(chalk.yellow(`There are no investors at checkpoint ${checkpointId}`));
  }

}

async function mintTokens() {
  let options = ['Modify whitelist', 'Mint tokens to a single address', `Mint tokens to multiple addresses from CSV`];
  let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'Return' });
  let selected = index == -1 ? 'Return' : options[index];
  console.log('Selected:', selected);
  switch (selected) {
    case 'Modify whitelist':
      let investor = readlineSync.question('Enter the address to whitelist: ', {
        limit: function (input) {
          return web3.utils.isAddress(input);
        },
        limitMessage: "Must be a valid address"
      });
      let fromTime = readlineSync.questionInt('Enter the time (Unix Epoch time) when the sale lockup period ends and the investor can freely sell his tokens: ');
      let toTime = readlineSync.questionInt('Enter the time (Unix Epoch time) when the purchase lockup period ends and the investor can freely purchase tokens from others: ');
      let expiryTime = readlineSync.questionInt('Enter the time till investors KYC will be validated (after that investor need to do re-KYC): ');
      let canBuyFromSTO = readlineSync.keyInYNStrict('Is the investor a restricted investor?');
      await modifyWhitelist(investor, fromTime, toTime, expiryTime, canBuyFromSTO);
      break;
    case 'Mint tokens to a single address':
      console.log(chalk.yellow(`Investor should be previously whitelisted.`));
      let receiver = readlineSync.question(`Enter the address to receive the tokens: `);
      let amount = readlineSync.question(`Enter the amount of tokens to mint: `);
      await mintToSingleAddress(receiver, amount);
      break;
    case `Mint tokens to multiple addresses from CSV`:
      console.log(chalk.yellow(`Investors should be previously whitelisted.`));
      await multiMint();
      break;
  }
}

/// Mint actions
async function modifyWhitelist(investor, fromTime, toTime, expiryTime, canBuyFromSTO) {
  let gmtModules = await securityToken.methods.getModulesByName(web3.utils.toHex('GeneralTransferManager')).call();
  let generalTransferManagerAddress = gmtModules[0];
  let generalTransferManagerABI = abis.generalTransferManager();
  let generalTransferManager = new web3.eth.Contract(generalTransferManagerABI, generalTransferManagerAddress);

  let modifyWhitelistAction = generalTransferManager.methods.modifyWhitelist(investor, fromTime, toTime, expiryTime, canBuyFromSTO);
  let modifyWhitelistReceipt = await common.sendTransaction(modifyWhitelistAction);
  let modifyWhitelistEvent = common.getEventFromLogs(generalTransferManager._jsonInterface, modifyWhitelistReceipt.logs, 'ModifyWhitelist');
  console.log(chalk.green(`${modifyWhitelistEvent._investor} has been whitelisted sucessfully!`));
}

async function mintToSingleAddress(_investor, _amount) {
  try {
    let mintAction = securityToken.methods.mint(_investor, web3.utils.toWei(_amount));
    let receipt = await common.sendTransaction(mintAction);
    let event = common.getEventFromLogs(securityToken._jsonInterface, receipt.logs, 'Minted');
    console.log(chalk.green(`${web3.utils.fromWei(event._value)} tokens have been minted to ${event._to} successfully.`));
  }
  catch (e) {
    console.log(e);
    console.log(chalk.red(`Minting was not successful - Please make sure beneficiary address has been whitelisted`));
  }
}

async function multiMint(_csvFilePath, _batchSize) {
  let csvFilePath;
  if (typeof _csvFilePath !== 'undefined') {
    csvFilePath = _csvFilePath;
  } else {
    csvFilePath = readlineSync.question(`Enter the path for csv data file (${MULTIMINT_DATA_CSV}): `, {
      defaultInput: MULTIMINT_DATA_CSV
    });
  }
  let batchSize;
  if (typeof _batchSize !== 'undefined') {
    batchSize = _batchSize;
  } else {
    batchSize = readlineSync.question(`Enter the max number of records per transaction or batch size (${gbl.constants.DEFAULT_BATCH_SIZE}): `, {
      limit: function (input) {
        return parseInt(input) > 0;
      },
      limitMessage: 'Must be greater than 0',
      defaultInput: gbl.constants.DEFAULT_BATCH_SIZE
    });
  }
  let parsedData = csvParse(csvFilePath);
  let tokenDivisible = await securityToken.methods.granularity().call() == 1;
  let validData = parsedData.filter(row =>
    web3.utils.isAddress(row[0]) &&
    (!isNaN(row[1]) && (tokenDivisible || parseFloat(row[1]) % 1 == 0))
  );
  let invalidRows = parsedData.filter(row => !validData.includes(row));
  if (invalidRows.length > 0) {
    console.log(chalk.red(`The following lines from csv file are not valid: ${invalidRows.map(r => parsedData.indexOf(r) + 1).join(',')} `));
  }
  let verifiedData = [];
  let unverifiedData = [];
  for (const row of validData) {
    let investorAccount = row[0];
    let tokenAmount = web3.utils.toWei(row[1].toString());
    let verifiedTransaction = await securityToken.methods.verifyTransfer(gbl.constants.ADDRESS_ZERO, investorAccount, tokenAmount, web3.utils.fromAscii('')).call();
    if (verifiedTransaction) {
      verifiedData.push(row);
    } else {
      unverifiedData.push(row);
    }
  }

  let batches = common.splitIntoBatches(verifiedData, batchSize);
  let [investorArray, amountArray] = common.transposeBatches(batches);
  for (let batch = 0; batch < batches.length; batch++) {
    console.log(`Batch ${batch + 1} - Attempting to mint tokens to accounts: \n\n`, investorArray[batch], '\n');
    amountArray[batch] = amountArray[batch].map(a => web3.utils.toWei(a.toString()));
    let action = securityToken.methods.mintMulti(investorArray[batch], amountArray[batch]);
    let receipt = await common.sendTransaction(action);
    console.log(chalk.green('Multi mint transaction was successful.'));
    console.log(`${receipt.gasUsed} gas used.Spent: ${web3.utils.fromWei((new web3.utils.BN(receipt.gasUsed)).mul(new web3.utils.BN(defaultGasPrice)))} ETH`);
  }

  if (unverifiedData.length > 0) {
    console.log("*********************************************************************************************************");
    console.log('The following data arrays failed at verifyTransfer. Please review if these accounts are whitelisted\n');
    console.log(chalk.red(unverifiedData.map(d => `${d[0]}, ${d[1]}`).join('\n')));
    console.log("*********************************************************************************************************");
  }
}

async function withdrawFromContract(erc20address, value) {
  let withdrawAction = securityToken.methods.withdrawERC20(erc20address, value);
  await common.sendTransaction(withdrawAction);
  console.log(chalk.green(`Withdrawn has been successful!.`));
}
///

async function listModuleOptions() {
  let options = ['Add a module']

  let unpausedModules = allModules.filter(m => m.paused == false);
  if (unpausedModules.length > 0) {
    options.push('Pause a module');
  }

  let pausedModules = allModules.filter(m => m.paused == true);
  if (pausedModules.length > 0) {
    options.push('Unpause a module');
  }

  let unarchivedModules = allModules.filter(m => !m.archived);
  if (unarchivedModules.length > 0) {
    options.push('Archive a module');
  }

  let archivedModules = allModules.filter(m => m.archived);
  if (archivedModules.length > 0) {
    options.push('Unarchive a module', 'Remove a module');
  }

  if (allModules.length > 0) {
    options.push('Change module budget');
  }

  let index = readlineSync.keyInSelect(options, chalk.yellow('What do you want to do?'), { cancel: 'Return' });
  let selected = index == -1 ? 'Exit' : options[index];
  console.log('Selected:', selected);
  switch (selected) {
    case 'Add a module':
      await addModule();
      break;
    case 'Pause a module':
      await pauseModule(unpausedModules);
      break;
    case 'Unpause a module':
      await unpauseModule(pausedModules);
      break;
    case 'Archive a module':
      await archiveModule(unarchivedModules);
      break;
    case 'Unarchive a module':
      await unarchiveModule(archivedModules);
      break;
    case 'Remove a module':
      await removeModule(archivedModules);
      break;
    case 'Change module budget':
      await changeBudget(allModules);
      break;
  }
}

// Modules a actions
async function addModule() {
  let options = ['Permission Manager', 'Transfer Manager', 'Security Token Offering', 'Dividends', 'Burn'];
  let index = readlineSync.keyInSelect(options, 'What type of module whould you like to add?', { cancel: 'Return' });
  switch (options[index]) {
    case 'Permission Manager':
      console.log(chalk.red(`
    *********************************
    This option is not yet available.
    *********************************`));
      break;
    case 'Transfer Manager':
      await transferManager.addTransferManagerModule(tokenSymbol)
      break;
    case 'Security Token Offering':
      await stoManager.addSTOModule(tokenSymbol)
      break;
    case 'Dividends':
      console.log(chalk.red(`
    *********************************
    This option is not yet available.
    *********************************`));
      break;
    case 'Burn':
      console.log(chalk.red(`
    *********************************
    This option is not yet available.
    *********************************`));
      break;
  }
}

async function pauseModule(modules) {
  let options = modules.map(m => `${m.name} (${m.address})`);
  let index = readlineSync.keyInSelect(options, 'Which module whould you like to pause?');
  if (index != -1) {
    console.log("\nSelected:", options[index]);
    let moduleABI;
    if (modules[index].type == gbl.constants.MODULES_TYPES.STO) {
      moduleABI = abis.ISTO();
    } else if (modules[index].type == gbl.constants.MODULES_TYPES.STO) {
      moduleABI = abis.ITransferManager();
    } else {
      console.log(chalk.red(`Only STO and TM modules can be paused/unpaused`));
      process.exit(0);
    }
    let pausableModule = new web3.eth.Contract(moduleABI, modules[index].address);
    let pauseAction = pausableModule.methods.pause();
    await common.sendTransaction(pauseAction);
    console.log(chalk.green(`${modules[index].name} has been paused successfully!`));
  }
}

async function unpauseModule(modules) {
  let options = modules.map(m => `${m.name} (${m.address})`);
  let index = readlineSync.keyInSelect(options, 'Which module whould you like to pause?');
  if (index != -1) {
    console.log("\nSelected: ", options[index]);
    let moduleABI;
    if (modules[index].type == gbl.constants.MODULES_TYPES.STO) {
      moduleABI = abis.ISTO();
    } else if (modules[index].type == gbl.constants.MODULES_TYPES.STO) {
      moduleABI = abis.ITransferManager();
    } else {
      console.log(chalk.red(`Only STO and TM modules can be paused/unpaused`));
      process.exit(0);
    }
    let pausableModule = new web3.eth.Contract(moduleABI, modules[index].address);
    let unpauseAction = pausableModule.methods.unpause();
    await common.sendTransaction(unpauseAction);
    console.log(chalk.green(`${modules[index].name} has been unpaused successfully!`));
  }
}

async function archiveModule(modules) {
  let options = modules.map(m => `${m.name} (${m.address})`);
  let index = readlineSync.keyInSelect(options, 'Which module would you like to archive?');
  if (index != -1) {
    console.log("\nSelected: ", options[index]);
    let archiveModuleAction = securityToken.methods.archiveModule(modules[index].address);
    await common.sendTransaction(archiveModuleAction, { factor: 2 });
    console.log(chalk.green(`${modules[index].name} has been archived successfully!`));
  }
}

async function unarchiveModule(modules) {
  let options = modules.map(m => `${m.name} (${m.address})`);
  let index = readlineSync.keyInSelect(options, 'Which module whould you like to unarchive?');
  if (index != -1) {
    console.log("\nSelected: ", options[index]);
    let unarchiveModuleAction = securityToken.methods.unarchiveModule(modules[index].address);
    await common.sendTransaction(unarchiveModuleAction, { factor: 2 });
    console.log(chalk.green(`${modules[index].name} has been unarchived successfully!`));
  }
}

async function removeModule(modules) {
  let options = modules.map(m => `${m.name} (${m.address})`);
  let index = readlineSync.keyInSelect(options, 'Which module whould you like to remove?');
  if (index != -1) {
    console.log("\nSelected: ", options[index]);
    let removeModuleAction = securityToken.methods.removeModule(modules[index].address);
    await common.sendTransaction(removeModuleAction, { factor: 2 });
    console.log(chalk.green(`${modules[index].name} has been removed successfully!`));
  }
}

async function changeBudget() {
  let options = modules.map(m => `${m.name} (${m.address})`);
  let index = readlineSync.keyInSelect(options, 'Which module whould you like to remove?');
  if (index != -1) {
    console.log("\nSelected: ", options[index]);
    let increase = 0 == readlineSync.keyInSelect(['Increase', 'Decrease'], `Do you want to increase or decrease budget?`, { cancel: false });
    let amount = readlineSync.question(`Enter the amount of POLY to change in allowance`);
    let changeModuleBudgetAction = securityToken.methods.changeModuleBudget(modules[index].address, web3.utils.toWei(amount), increase);
    await common.sendTransaction(changeModuleBudgetAction);
    console.log(chalk.green(`Module budget has been changed successfully!`));
  }
}

// Helpers
async function showUserInfo(_user) {
  console.log(`
********************    User Information    *********************
- Address:              ${_user}
- POLY balance:         ${web3.utils.fromWei(await polyToken.methods.balanceOf(_user).call())}
- ETH balance:          ${web3.utils.fromWei(await web3.eth.getBalance(_user))}
  `);
}

async function getAllModules() {
  function ModuleInfo(_moduleType, _name, _address, _factoryAddress, _archived, _paused) {
    this.name = _name;
    this.type = _moduleType;
    this.address = _address;
    this.factoryAddress = _factoryAddress;
    this.archived = _archived;
    this.paused = _paused;
  }

  let modules = [];

  // Iterate over all module types
  for (let type = 1; type <= 5; type++) {
    let allModules = await securityToken.methods.getModulesByType(type).call();

    // Iterate over all modules of each type
    for (let i = 0; i < allModules.length; i++) {
      try {
        let details = await securityToken.methods.getModule(allModules[i]).call();
        let nameTemp = web3.utils.hexToUtf8(details[0]);
        let pausedTemp = null;
        if (type == gbl.constants.MODULES_TYPES.STO || type == gbl.constants.MODULES_TYPES.TRANSFER) {
          let abiTemp = JSON.parse(require('fs').readFileSync(`./build/contracts/${nameTemp}.json`).toString()).abi;
          let contractTemp = new web3.eth.Contract(abiTemp, details[1]);
          pausedTemp = await contractTemp.methods.paused().call();
        }
        modules.push(new ModuleInfo(type, nameTemp, details[1], details[2], details[3], pausedTemp));
      } catch (error) {
        console.log(error);
        console.log(chalk.red(`
        *************************
        Unable to iterate over module type - unexpected error
        *************************`));
      }
    }
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
  console.log(`*****************************************`);
  console.log(`Welcome to the Command-Line Token Manager`);
  console.log(`*****************************************`);
  console.log("The following script will allow you to manage your ST-20 tokens");
  console.log("Issuer Account: " + Issuer.address + "\n");
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

module.exports = {
  executeApp: async function (_tokenSymbol) {
    await initialize(_tokenSymbol);
    return executeApp();
  },
  multiMint: async function (_tokenSymbol, _csvPath, _batchSize) {
    await initialize(_tokenSymbol);
    return multiMint(_csvPath, _batchSize);
  }
}
