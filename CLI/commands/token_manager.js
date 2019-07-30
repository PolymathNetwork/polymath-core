// Libraries for terminal prompts
const readlineSync = require('readline-sync');
const chalk = require('chalk');
const stoManager = require('./sto_manager');
const transferManager = require('./transfer_manager');
const common = require('./common/common_functions');
const gbl = require('./common/global');
const csvParse = require('./helpers/csv');
const input = require('./IO/input');
const moment = require('moment');

// Constants
const MULTIMINT_DATA_CSV = `${__dirname}/../data/ST/multi_mint_data.csv`;

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
    let iSecurityTokenRegistryABI = abis.iSecurityTokenRegistry();
    securityTokenRegistry = new web3.eth.Contract(iSecurityTokenRegistryABI, securityTokenRegistryAddress);
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
  let displayTokenName = await securityToken.methods.name().call();
  let displayTokenDetails = await securityToken.methods.tokenDetails().call();
  let displayVersion = await securityToken.methods.getVersion().call();
  let displayGranularity = await securityToken.methods.granularity().call();
  let displayTokenSupply = await securityToken.methods.totalSupply().call();
  let displayHolderCount = await securityToken.methods.holderCount().call();
  let displayInvestorsCount = await securityToken.methods.getInvestorCount().call();
  let displayCurrentCheckpointId = await securityToken.methods.currentCheckpointId().call();
  let displayTransferFrozen = await securityToken.methods.transfersFrozen().call();
  let displayIsIssuable = await securityToken.methods.isIssuable().call();
  let displayUserTokens = await securityToken.methods.balanceOf(Issuer.address).call();
  let displayTreasuryWallet = await securityToken.methods.getTreasuryWallet().call();
  let displayDocuments = await securityToken.methods.getAllDocuments().call();

  console.log(`
***************    Security Token Information    ****************
- Address:              ${securityToken.options.address}
- Token symbol:         ${displayTokenSymbol.toUpperCase()}
- Token name:           ${displayTokenName}
- Token details:        ${displayTokenDetails}
- Token version:        ${displayVersion[0]}.${displayVersion[1]}.${displayVersion[2]}
- Granularity:          ${displayGranularity}
- Total supply:         ${web3.utils.fromWei(displayTokenSupply)} ${displayTokenSymbol.toUpperCase()}
- Holders count:        ${displayHolderCount}
- Investors count:      ${displayInvestorsCount}
- Current checkpoint:   ${displayCurrentCheckpointId}
- Transfer frozen:      ${displayTransferFrozen ? 'YES' : 'NO'}
- Issuance allowed:     ${displayIsIssuable ? 'YES' : 'NO'}
- User balance:         ${web3.utils.fromWei(displayUserTokens)} ${displayTokenSymbol.toUpperCase()}
- Treasury wallet:      ${displayTreasuryWallet}
- Documents attached:   ${displayDocuments.length}`);
}

async function displayModules() {
  // Module Details
  let pmModules = allModules.filter(m => m.type == gbl.constants.MODULES_TYPES.PERMISSION);
  let tmModules = allModules.filter(m => m.type == gbl.constants.MODULES_TYPES.TRANSFER);
  let stoModules = allModules.filter(m => m.type == gbl.constants.MODULES_TYPES.STO);
  let cpModules = allModules.filter(m => m.type == gbl.constants.MODULES_TYPES.DIVIDENDS);
  let burnModules = allModules.filter(m => m.type == gbl.constants.MODULES_TYPES.BURN);
  let walletModules = allModules.filter(m => m.type == gbl.constants.MODULES_TYPES.WALLET);

  // Module Counts
  let numPM = pmModules.length;
  let numTM = tmModules.length;
  let numSTO = stoModules.length;
  let numCP = cpModules.length;
  let numBURN = burnModules.length;
  let numW = walletModules.length;

  console.log(`
*******************    Module Information    ********************
- Permission Manager:   ${(numPM > 0) ? numPM : 'None'}
- Transfer Manager:     ${(numTM > 0) ? numTM : 'None'}
- STO:                  ${(numSTO > 0) ? numSTO : 'None'}
- Checkpoint:           ${(numCP > 0) ? numCP : 'None'}
- Burn:                 ${(numBURN > 0) ? numBURN : 'None'}
- Wallet:               ${(numW > 0) ? numW : 'None'}
  `);

  if (numPM) {
    console.log(`Permission Manager Modules:`);
    pmModules.map(m => console.log(`- ${m.label}: ${m.name} (${m.version}) is ${(m.archived) ? chalk.yellow('archived') : 'unarchived'} at ${m.address}`));
  }

  if (numTM) {
    console.log(`Transfer Manager Modules:`);
    tmModules.map(m => console.log(`- ${m.label}: ${m.name} (${m.version}) is ${(m.archived) ? chalk.yellow('archived') : 'unarchived'} at ${m.address}`));
  }

  if (numSTO) {
    console.log(`STO Modules:`);
    stoModules.map(m => console.log(`- ${m.label}: ${m.name} (${m.version}) is ${(m.archived) ? chalk.yellow('archived') : 'unarchived'} at ${m.address}`));
  }

  if (numCP) {
    console.log(`Checkpoint Modules:`);
    cpModules.map(m => console.log(`- ${m.label}: ${m.name} (${m.version}) is ${(m.archived) ? chalk.yellow('archived') : 'unarchived'} at ${m.address}`));
  }

  if (numBURN) {
    console.log(`Burn Modules:`);
    burnModules.map(m => console.log(`- ${m.label}: ${m.name} (${m.version}) is ${(m.archived) ? chalk.yellow('archived') : 'unarchived'} at ${m.address}`));
  }

  if (numW) {
    console.log(`Wallet Modules:`);
    walletModules.map(m => console.log(`- ${m.label}: ${m.name} (${m.version}) is ${(m.archived) ? chalk.yellow('archived') : 'unarchived'} at ${m.address}`));
  }
}

async function selectAction() {
  let options = ['Change token name', 'Update token details', 'Change treasury wallet', 'Manage documents', 'Change granularity'];

  let transferFrozen = await securityToken.methods.transfersFrozen().call();
  if (transferFrozen) {
    options.push('Unfreeze transfers');
  } else {
    options.push('Freeze transfers');
  }

  let isIssuable = await securityToken.methods.isIssuable().call();
  if (isIssuable) {
    if (Issuer.address == await securityToken.methods.owner().call()) {
    options.push('Freeze Issuance permanently');
    }
  }

  options.push('Create a checkpoint', 'List investors')

  let currentCheckpointId = await securityToken.methods.currentCheckpointId().call();
  if (currentCheckpointId > 0) {
    options.push('List investors at checkpoint')
  }

  if (isIssuable) {
    options.push('Issue tokens');
  }

  options.push('Manage modules', 'Withdraw tokens from contract');

  const tokenVersion = await securityToken.methods.getVersion().call();
  const latestSTVersion = await securityTokenRegistry.methods.getLatestProtocolVersion().call();
  if (tokenVersion !== latestSTVersion) {
    options.push('Refresh security token');
  }

  let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'Exit' });
  let selected = index == -1 ? 'Exit' : options[index];
  console.log('Selected:', selected);
  switch (selected) {
    case 'Change token name':
      let newTokenName = readlineSync.question('Enter new token name: ');
      await changeTokenName(newTokenName);
      break;
    case 'Update token details':
      let updatedDetails = readlineSync.question('Enter new off-chain details of the token (i.e. Dropbox folder url): ');
      await updateTokenDetails(updatedDetails);
      break;
    case 'Change treasury wallet':
      let newTreasuryWallet = input.readAddress('Enter the address of the new treasury wallet: ');
      await changeTreasuryWallet(newTreasuryWallet);
      break;
    case 'Change granularity':
      let granularity = input.readNumberBetween(1, 18, 'Enter the granularity you want to set: ');
      await changeGranularity(granularity);
      break;
    case 'Manage documents':
      await manageDocuments();
      break;
    case 'Freeze transfers':
      await freezeTransfers();
      break;
    case 'Unfreeze transfers':
      await unfreezeTransfers();
      break;
    case 'Freeze Issuance permanently':
      await freezeIssuance();
      break;
    case 'Create a checkpoint':
      await createCheckpoint();
      break;
    case 'List investors':
      await listInvestors();
      break;
    case 'List investors at checkpoint':
      let checkpointId = input.readNumberBetween(1, parseInt(currentCheckpointId), 'Enter the id of the checkpoint: ');
      await listInvestorsAtCheckpoint(checkpointId);
      break;
    case 'Issue tokens':
      await issueTokens();
      break;
    case 'Manage modules':
      await listModuleOptions();
      break;
    case 'Withdraw tokens from contract':
      let tokenAddress = input.readAddress(`Enter the ERC20 token address (POLY ${polyToken.options.address}): `, polyToken.options.address);
      let value = parseFloat(input.readNumberGreaterThan(0, 'Enter the value to withdraw: '));
      await withdrawFromContract(tokenAddress, web3.utils.toWei(new web3.utils.BN(value)));
      break;
    case 'Refresh security token':
        console.log(chalk.yellow.bgRed.bold(`---- WARNING: THIS ACTION WILL LAUNCH A NEW SECURITY TOKEN INSTANCE! ----`));
        const confirmation = readlineSync.keyInYNStrict(`Are you sure you want to refresh your ST to version ${tokenVersion[0]}.${tokenVersion[1]}.${tokenVersion[2]}?`);
        if (confirmation) {
          let transferFrozen = await securityToken.methods.transfersFrozen().call();
          if (!transferFrozen) {
            if (readlineSync.keyInYNStrict(`Transfers must be frozen to refresh your ST version. Do you want to freeze transfer now?`)) {
              await freezeTransfers();
            }
            transferFrozen = true;
          }
          if (transferFrozen) {
            const name = await securityToken.methods.name().call();
            const symbol = await securityToken.methods.symbol().call();
            const tokenDetails = await securityToken.methods.tokenDetails().call();
            const divisible = (await securityToken.methods.granularity().call()) === '1';
              const treasuryWallet = input.readAddress('Enter the treasury address for the token (' + Issuer.address + '): ', Issuer.address);
            const refreshAction = securityTokenRegistry.methods.refreshSecurityToken(
              name,
                symbol,
              tokenDetails,
              divisible,
              treasuryWallet
            );
            const refreshReceipt = await common.sendTransaction(refreshAction);
              const refreshEvent = common.getEventFromLogs(securityTokenRegistry._jsonInterface, refreshReceipt.logs, 'SecurityTokenRefreshed');
            console.log(chalk.green(`Security Token has been refreshed successfully at ${refreshEvent._securityTokenAddress}!`));
            securityToken = new web3.eth.Contract(abis.iSecurityToken(), refreshEvent._securityTokenAddress);
            securityToken.setProvider(web3.currentProvider);
          }
        }
      break;
    case 'Exit':
      process.exit();
  }
}

// Token actions
async function changeTokenName(newTokenName) {
  let changeTokenNameAction = securityToken.methods.changeName(newTokenName);
  await common.sendTransaction(changeTokenNameAction);
  console.log(chalk.green(`Token details have been updated successfully!`));
}

async function updateTokenDetails(updatedDetails) {
  let updateTokenDetailsAction = securityToken.methods.updateTokenDetails(updatedDetails);
  await common.sendTransaction(updateTokenDetailsAction);
  console.log(chalk.green(`Token details have been updated successfully!`));
}

async function changeTreasuryWallet(newTreasuryWallet) {
  let changeTreasuryWalletAction = securityToken.methods.changeTreasuryWallet(newTreasuryWallet);
  await common.sendTransaction(changeTreasuryWalletAction);
  console.log(chalk.green(`Treasury wallet has been updated successfully!`));
}

async function changeGranularity(granularity) {
  let changeGranularityAction = securityToken.methods.changeGranularity(granularity);
  await common.sendTransaction(changeGranularityAction);
  console.log(chalk.green(`Granularity has been updated successfully!`));
}

async function manageDocuments() {
  let options = ['Add document'];

  const allDocuments = await securityToken.methods.getAllDocuments().call();
  if (allDocuments.length > 0) {
    options.push('Get document', 'Remove document');
    console.log(`Attached documents:`)
    allDocuments.map(d => console.log(`- ${web3.utils.hexToUtf8(d)}`));
  } else {
    console.log(`No documents attached:`);
  }

  let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'Return' });
  let selected = index == -1 ? 'Return' : options[index];
  console.log('Selected:', selected);
  switch (selected) {
    case 'Add document':
      const documentName = readlineSync.question('Enter the document name: ');
      const documentUri = readlineSync.question('Enter the document uri: ');
      const documentHash = readlineSync.question('Enter the document hash: ');
      const setDocumentAction = securityToken.methods.setDocument(web3.utils.toHex(documentName), documentUri, web3.utils.toHex(documentHash));
      await common.sendTransaction(setDocumentAction);
      console.log(chalk.green(`Document has been added successfully!`));
      break;
    case 'Get document':
      const documentoToGet = selectDocument(allDocuments);
      const document = await securityToken.methods.getDocument(documentoToGet).call();
      console.log(web3.utils.hexToUtf8(documentoToGet));
      console.log(`Uri: ${document[0]}`);
      console.log(`Hash: ${web3.utils.hexToUtf8(document[1])}`);
      console.log(`Last modified: ${moment.unix(document[2]).format('MM/DD/YYYY HH:mm')}`);
      break;
    case 'Remove document':
      const documentoToRemove = selectDocument(allDocuments);
      const removeDocumentAction = securityToken.methods.removeDocument(documentoToRemove);
      await common.sendTransaction(removeDocumentAction);
      console.log(chalk.green(`Document has been removed successfully!`));
      break;
  }
}

function selectDocument(allDocuments) {
  const options = allDocuments.map(d => `${web3.utils.hexToUtf8(d)}`);
  let index = readlineSync.keyInSelect(options, 'Select a document:', { cancel: 'Return' });
  let selected = index == -1 ? 'Return' : allDocuments[index];
  return selected;
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

async function freezeIssuance() {
  console.log(chalk.yellow.bgRed.bold(`---- WARNING: THIS ACTION WILL PERMANENTLY DISABLE TOKEN ISSUANCE! ----`));
  let confirmation = readlineSync.question(`To confirm type "I acknowledge that freezing Issuance is a permanent and irrevocable change": `);
  if (confirmation == "I acknowledge that freezing Issuance is a permanent and irrevocable change") {
      let signature = await getFreezeIssuanceAck(securityToken.options.address, Issuer.address);
      let freezeIssuanceAction = securityToken.methods.freezeIssuance(signature);
      await common.sendTransaction(freezeIssuanceAction);
      console.log(chalk.green(`Issuance has been frozen successfully!.`));
  } else {
      console.log(chalk.yellow(`Invalid confirmation. Action Canceled`));
  }
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

async function issueTokens() {
  let options = ['Modify whitelist', 'Issue tokens to a single address', `Issue tokens to multiple addresses from CSV`];
  let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'Return' });
  let selected = index == -1 ? 'Return' : options[index];
  console.log('Selected:', selected);
  switch (selected) {
    case 'Modify whitelist':
      let generalTransferManager = await getGeneralTransferManager();
      await common.queryModifyWhiteList(generalTransferManager);
      break;
    case 'Issue tokens to a single address':
      console.log(chalk.yellow(`Investor should be previously whitelisted.`));
      let receiver = readlineSync.question(`Enter the address to receive the tokens: `);
      let amount = readlineSync.question(`Enter the amount of tokens to issue: `);
      await issueToSingleAddress(receiver, amount);
      break;
    case `Issue tokens to multiple addresses from CSV`:
      console.log(chalk.yellow(`Investors should be previously whitelisted.`));
      await multiIssue();
      break;
  }
}

/// Issue actions
async function getGeneralTransferManager() {
  let gmtModules = await securityToken.methods.getModulesByName(web3.utils.toHex('GeneralTransferManager')).call();
  let generalTransferManagerAddress = gmtModules[0];
  let generalTransferManagerABI = abis.generalTransferManager();
  let generalTransferManager = new web3.eth.Contract(generalTransferManagerABI, generalTransferManagerAddress);
  generalTransferManager.setProvider(web3.currentProvider);
  return generalTransferManager;
}

async function issueToSingleAddress(_investor, _amount) {
  try {
    let issueAction = securityToken.methods.issue(_investor, web3.utils.toWei(_amount), web3.utils.fromAscii(''));
    let receipt = await common.sendTransaction(issueAction);
    let event = common.getEventFromLogs(securityToken._jsonInterface, receipt.logs, 'Issued');
    console.log(chalk.green(`${web3.utils.fromWei(event._value)} tokens have been issued to ${event._to} successfully.`));
  }
  catch (e) {
    console.log(e);
    console.log(chalk.red(`Issuance was not successful - Please make sure beneficiary address has been whitelisted`));
  }
}

async function multiIssue(_csvFilePath, _batchSize) {
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
    batchSize = input.readNumberGreaterThan(0, `Enter the max number of records per transaction or batch size (${gbl.constants.DEFAULT_BATCH_SIZE}): `, gbl.constants.DEFAULT_BATCH_SIZE);
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
    let verifiedTransaction = await securityToken.methods.canTransfer(investorAccount, tokenAmount, web3.utils.fromAscii('')).call();
    if (verifiedTransaction) {
      verifiedData.push(row);
    } else {
      unverifiedData.push(row);
    }
  }

  let batches = common.splitIntoBatches(verifiedData, batchSize);
  let [investorArray, amountArray] = common.transposeBatches(batches);
  for (let batch = 0; batch < batches.length; batch++) {
    console.log(`Batch ${batch + 1} - Attempting to issue tokens to accounts: \n\n`, investorArray[batch], '\n');
    amountArray[batch] = amountArray[batch].map(a => web3.utils.toWei(a.toString()));
    let action = securityToken.methods.issueMulti(investorArray[batch], amountArray[batch]);
    let receipt = await common.sendTransaction(action);
    console.log(chalk.green('Multi issue transaction was successful.'));
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
  let options = ['Permission Manager', 'Transfer Manager', 'Security Token Offering', 'Dividends', 'Burn', 'Wallet'];
  let index = readlineSync.keyInSelect(options, 'What type of module would you like to add?', { cancel: 'Return' });
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
    case 'Wallet':
      console.log(chalk.red(`
    *********************************
    This option is not yet available.
    *********************************`));
      break;
  }
}

async function pauseModule(modules) {
  let options = modules.map(m => `${m.label}: ${m.name} (${m.version}) at ${m.address}`);
  let index = readlineSync.keyInSelect(options, 'Which module would you like to pause?');
  if (index != -1) {
    console.log("\nSelected:", options[index]);
    let moduleABI;
    if (modules[index].type == gbl.constants.MODULES_TYPES.STO) {
      moduleABI = abis.sto();
    } else if (modules[index].type == gbl.constants.MODULES_TYPES.TRANSFER) {
      moduleABI = abis.ITransferManager();
    } else if (modules[index].type == gbl.constants.MODULES_TYPES.DIVIDENDS) {
      moduleABI = abis.erc20DividendCheckpoint();
    } else {
      console.log(chalk.red(`Only STO, TM and DIVIDEND modules can be paused/unpaused`));
      process.exit(0);
    }
    let pausableModule = new web3.eth.Contract(moduleABI, modules[index].address);
    let pauseAction = pausableModule.methods.pause();
    await common.sendTransaction(pauseAction);
    console.log(chalk.green(`${modules[index].name} has been paused successfully!`));
  }
}

async function unpauseModule(modules) {
  let options = modules.map(m => `${m.label}: ${m.name} (${m.version}) at ${m.address}`);
  let index = readlineSync.keyInSelect(options, 'Which module would you like to pause?');
  if (index != -1) {
    console.log("\nSelected: ", options[index]);
    let moduleABI;
    if (modules[index].type == gbl.constants.MODULES_TYPES.STO) {
      moduleABI = abis.sto();
    } else if (modules[index].type == gbl.constants.MODULES_TYPES.TRANSFER) {
      moduleABI = abis.ITransferManager();
    } else if (modules[index].type == gbl.constants.MODULES_TYPES.DIVIDENDS) {
      moduleABI = abis.erc20DividendCheckpoint();
    } else {
      console.log(chalk.red(`Only STO, TM and DIVIDEND modules can be paused/unpaused`));
      process.exit(0);
    }
    let pausableModule = new web3.eth.Contract(moduleABI, modules[index].address);
    let unpauseAction = pausableModule.methods.unpause();
    await common.sendTransaction(unpauseAction);
    console.log(chalk.green(`${modules[index].name} has been unpaused successfully!`));
  }
}

async function archiveModule(modules) {
  let options = modules.map(m => `${m.label}: ${m.name} (${m.version}) at ${m.address}`);
  let index = readlineSync.keyInSelect(options, 'Which module would you like to archive?');
  if (index != -1) {
    console.log("\nSelected: ", options[index]);
    let archiveModuleAction = securityToken.methods.archiveModule(modules[index].address);
    await common.sendTransaction(archiveModuleAction, { factor: 2 });
    console.log(chalk.green(`${modules[index].name} has been archived successfully!`));
  }
}

async function unarchiveModule(modules) {
  let options = modules.map(m => `${m.label}: ${m.name} (${m.version}) at ${m.address}`);
  let index = readlineSync.keyInSelect(options, 'Which module would you like to unarchive?');
  if (index != -1) {
    console.log("\nSelected: ", options[index]);
    let unarchiveModuleAction = securityToken.methods.unarchiveModule(modules[index].address);
    await common.sendTransaction(unarchiveModuleAction, { factor: 2 });
    console.log(chalk.green(`${modules[index].name} has been unarchived successfully!`));
  }
}

async function removeModule(modules) {
  let options = modules.map(m => `${m.label}: ${m.name} (${m.version}) at ${m.address}`);
  let index = readlineSync.keyInSelect(options, 'Which module would you like to remove?');
  if (index != -1) {
    console.log("\nSelected: ", options[index]);
    let removeModuleAction = securityToken.methods.removeModule(modules[index].address);
    await common.sendTransaction(removeModuleAction, { factor: 2 });
    console.log(chalk.green(`${modules[index].name} has been removed successfully!`));
  }
}

async function changeBudget(modules) {
  let options = modules.map(m => `${m.label}: ${m.name} (${m.version}) at ${m.address}`);
  let index = readlineSync.keyInSelect(options, 'Which module would you like to change budget for?');
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
  let allModules = [];
  // Iterate over all module types
  for (let type = 1; type <= 8; type++) {
    let modules = await common.getAllModulesByType(securityToken, type);
    modules.forEach(m => allModules.push(m));
  }

  return allModules;
}

async function initialize(_tokenSymbol) {
  welcome();
  await setup();
  securityToken = await common.selectToken(securityTokenRegistry, _tokenSymbol);
  if (securityToken === null) {
    process.exit(0);
  }
}

function welcome() {
  common.logAsciiBull();
  console.log(`*****************************************`);
  console.log(`Welcome to the Command-Line Token Manager`);
  console.log(`*****************************************`);
  console.log("The following script will allow you to manage your ST-20 tokens");
  console.log("Issuer Account: " + Issuer.address + "\n");
}

module.exports = {
  executeApp: async function (_tokenSymbol) {
    await initialize(_tokenSymbol);
    return executeApp();
  },
  multiIssue: async function (_tokenSymbol, _csvPath, _batchSize) {
    await initialize(_tokenSymbol);
    return multiIssue(_csvPath, _batchSize);
  }
}

async function getFreezeIssuanceAck(stAddress, from) {
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
            text: 'I acknowledge that freezing Issuance is a permanent and irrevocable change',
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
