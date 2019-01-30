const readlineSync = require('readline-sync');
const chalk = require('chalk');
const moment = require('moment');
const common = require('./common/common_functions');
const gbl = require('./common/global');
const contracts = require('./helpers/contract_addresses');
const abis = require('./helpers/contract_abis');
const csvParse = require('./helpers/csv');
const { table } = require('table')

const EXCLUSIONS_DATA_CSV = `${__dirname}/../data/Checkpoint/exclusions_data.csv`;
const TAX_WITHHOLDING_DATA_CSV = `${__dirname}/../data/Checkpoint/tax_withholding_data.csv`;

// App flow
let tokenSymbol;
let securityToken;
let polyToken;
let securityTokenRegistry;
let moduleRegistry;
let currentDividendsModule;

let dividendsType;

async function executeApp() {
  console.log('\n', chalk.blue('Dividends Manager - Main Menu', '\n'));

  let tmModules = await getAllModulesByType(gbl.constants.MODULES_TYPES.DIVIDENDS);
  let nonArchivedModules = tmModules.filter(m => !m.archived);
  if (nonArchivedModules.length > 0) {
    console.log(`Dividends modules attached:`);
    nonArchivedModules.map(m => console.log(`- ${m.name} at ${m.address}`))
  } else {
    console.log(`There are no dividends modules attached`);
  }

  let currentCheckpoint = await securityToken.methods.currentCheckpointId().call();
  if (currentCheckpoint > 0) {
    console.log(`\nCurrent checkpoint: ${currentCheckpoint}`);
  }

  let options = ['Create checkpoint', 'Explore address balances'];
  if (nonArchivedModules.length > 0) {
    options.push('Config existing modules');
  }
  options.push('Add new dividends module');

  let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'EXIT' });
  let optionSelected = index != -1 ? options[index] : 'EXIT';
  console.log('Selected:', optionSelected, '\n');
  switch (optionSelected) {
    case 'Create checkpoint':
      await createCheckpointFromST();
      break;
    case 'Explore address balances':
      await exploreAddress(currentCheckpoint);
      break;
    case 'Config existing modules':
      await configExistingModules(nonArchivedModules);
      break;
    case 'Add new dividends module':
      await addDividendsModule();
      break;
    case 'EXIT':
      return;
  }

  await executeApp();
}

async function createCheckpointFromST() {
  let createCheckpointAction = securityToken.methods.createCheckpoint();
  let receipt = await common.sendTransaction(createCheckpointAction);
  let event = common.getEventFromLogs(securityToken._jsonInterface, receipt.logs, 'CheckpointCreated');
  console.log(chalk.green(`Checkpoint ${event._checkpointId} has been created successfully!`));
}

async function exploreAddress(currentCheckpoint) {
  let address = readlineSync.question('Enter address to explore: ', {
    limit: function (input) {
      return web3.utils.isAddress(input);
    },
    limitMessage: "Must be a valid address",
  });
  let checkpoint = null;
  if (currentCheckpoint > 0) {
    checkpoint = await selectCheckpoint(false);
  }

  let balance = web3.utils.fromWei(await securityToken.methods.balanceOf(address).call());
  let totalSupply = web3.utils.fromWei(await securityToken.methods.totalSupply().call());
  console.log(`Balance of ${address} is: ${balance} ${tokenSymbol}`);
  console.log(`TotalSupply is: ${totalSupply} ${tokenSymbol}`);

  if (checkpoint) {
    let balanceAt = web3.utils.fromWei(await securityToken.methods.balanceOfAt(address, checkpoint).call());
    let totalSupplyAt = web3.utils.fromWei(await securityToken.methods.totalSupplyAt(checkpoint).call());
    console.log(`Balance of ${address} at checkpoint ${checkpoint}: ${balanceAt} ${tokenSymbol}`);
    console.log(`TotalSupply at checkpoint ${checkpoint} is: ${totalSupplyAt} ${tokenSymbol}`);
  }
}

async function configExistingModules(dividendModules) {
  let options = dividendModules.map(m => `${m.name} at ${m.address}`);
  let index = readlineSync.keyInSelect(options, 'Which module do you want to config? ', { cancel: 'RETURN' });
  console.log('Selected:', index != -1 ? options[index] : 'RETURN', '\n');
  let moduleNameSelected = index != -1 ? dividendModules[index].name : 'RETURN';
  switch (moduleNameSelected) {
    case 'ERC20DividendCheckpoint':
      currentDividendsModule = new web3.eth.Contract(abis.erc20DividendCheckpoint(), dividendModules[index].address);
      currentDividendsModule.setProvider(web3.currentProvider);
      dividendsType = 'ERC20';
      break;
    case 'EtherDividendCheckpoint':
      currentDividendsModule = new web3.eth.Contract(abis.etherDividendCheckpoint(), dividendModules[index].address);
      currentDividendsModule.setProvider(web3.currentProvider);
      dividendsType = 'ETH';
      break;
  }

  await dividendsManager();
}

async function dividendsManager() {
  console.log(chalk.blue(`Dividends module at ${currentDividendsModule.options.address}`), '\n');

  let wallet = await currentDividendsModule.methods.wallet().call();
  let currentDividends = await getDividends();
  let defaultExcluded = await currentDividendsModule.methods.getDefaultExcluded().call();
  let currentCheckpointId = await securityToken.methods.currentCheckpointId().call();

  console.log(`- Wallet:                  ${wallet}`);
  console.log(`- Current dividends:       ${currentDividends.length}`);
  console.log(`- Default exclusions:      ${defaultExcluded.length}`);

  let options = ['Change wallet', 'Create checkpoint'];
  if (currentCheckpointId > 0) {
    options.push('Explore checkpoint');
  }
  if (defaultExcluded.length > 0) {
    options.push('Show current default exclusions');
  }
  options.push(
    'Set default exclusions',
    'Set tax withholding'
  );
  if (currentDividends.length > 0) {
    options.push('Manage existing dividends');
  }
  options.push('Create new dividends');

  let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'RETURN' });
  let selected = index != -1 ? options[index] : 'RETURN';
  console.log('Selected:', selected, '\n');
  switch (selected) {
    case 'Change wallet':
      await changeWallet();
      break;
    case 'Create checkpoint':
      await createCheckpointFromDividendModule();
      break;
    case 'Explore checkpoint':
      await exploreCheckpoint();
    case 'Show current default exclusions':
      showExcluded(defaultExcluded);
      break;
    case 'Set default exclusions':
      await setDefaultExclusions();
      break;
    case 'Set tax withholding':
      await taxWithholding();
      break;
    case 'Manage existing dividends':
      let selectedDividend = await selectDividend(currentDividends);
      if (selectedDividend) {
        await manageExistingDividend(selectedDividend.index);
      }
      break;
    case 'Create new dividends':
      await createDividends();
      break;
    case 'RETURN':
      return;
  }

  await dividendsManager();
}

async function changeWallet() {
  let newWallet = readlineSync.question('Enter the new account address to receive reclaimed dividends and tax: ', {
    limit: function (input) {
      return web3.utils.isAddress(input);
    },
    limitMessage: "Must be a valid address",
  });
  let action = currentDividendsModule.methods.changeWallet(newWallet);
  let receipt = await common.sendTransaction(action);
  let event = common.getEventFromLogs(currentDividendsModule._jsonInterface, receipt.logs, 'SetWallet');
  console.log(chalk.green(`The wallet has been changed successfully!`));
}

async function createCheckpointFromDividendModule() {
  let createCheckpointAction = securityToken.methods.createCheckpoint();
  await common.sendTransaction(createCheckpointAction);
  console.log(chalk.green(`Checkpoint have been created successfully!`));
}

async function exploreCheckpoint() {
  let checkpoint = await selectCheckpoint(false);

  let checkpointData = await currentDividendsModule.methods.getCheckpointData(checkpoint).call();
  let dataTable = [['Investor', `Balance at checkpoint (${tokenSymbol})`, 'Tax withholding set (%)']];
  for (let i = 0; i < checkpointData.investors.length; i++) {
    dataTable.push([
      checkpointData.investors[i],
      web3.utils.fromWei(checkpointData.balances[i]),
      parseFloat(web3.utils.fromWei(checkpointData.withholdings[i])) * 100
    ]);
  }
  console.log();
  console.log(table(dataTable));
}

async function setDefaultExclusions() {
  console.log(chalk.yellow(`Excluded addresses will be loaded from 'exclusions_data.csv'. Please check your data before continue.`));
  if (readlineSync.keyInYNStrict(`Do you want to continue?`)) {
    let excluded = getExcludedFromDataFile();
    let setDefaultExclusionsActions = currentDividendsModule.methods.setDefaultExcluded(excluded[0]);
    let receipt = await common.sendTransaction(setDefaultExclusionsActions);
    let event = common.getEventFromLogs(currentDividendsModule._jsonInterface, receipt.logs, 'SetDefaultExcludedAddresses');
    console.log(chalk.green(`Exclusions have been set successfully!`));
    showExcluded(event._excluded);
  }
}

async function manageExistingDividend(dividendIndex) {
  // Show current data

  let dividend = await currentDividendsModule.methods.dividends(dividendIndex).call();
  let dividendTokenAddress = gbl.constants.ADDRESS_ZERO;
  let dividendTokenSymbol = 'ETH';
  if (dividendsType === 'ERC20') {
    dividendTokenAddress = await currentDividendsModule.methods.dividendTokens(dividendIndex).call();
    let erc20token = new web3.eth.Contract(abis.erc20(), dividendTokenAddress);
    dividendTokenSymbol = await erc20token.methods.symbol().call();
  }
  let progress = await currentDividendsModule.methods.getDividendProgress(dividendIndex).call();
  let investorArray = progress[0];
  let claimedArray = progress[1];
  let excludedArray = progress[2];
  let withheldArray = progress[3];
  let amountArray = progress[4];
  let balanceArray = progress[5];

  // function for adding two numbers. Easy!
  const add = (a, b) => {
    const bnA = new web3.utils.BN(a);
    const bnB = new web3.utils.BN(b);
    return bnA.add(bnB).toString();
  };
  // use reduce to sum our array
  let taxesToWithHeld = withheldArray.reduce(add, 0);
  let claimedInvestors = claimedArray.filter(c => c).length;
  let excludedInvestors = excludedArray.filter(e => e).length;

  console.log(`- Name:                  ${web3.utils.hexToUtf8(dividend.name)}`);
  console.log(`- Created:               ${moment.unix(dividend.created).format('MMMM Do YYYY, HH:mm:ss')}`);
  console.log(`- Maturity:              ${moment.unix(dividend.maturity).format('MMMM Do YYYY, HH:mm:ss')}`);
  console.log(`- Expiry:                ${moment.unix(dividend.expiry).format('MMMM Do YYYY, HH:mm:ss')}`);
  console.log(`- At checkpoint:         ${dividend.checkpointId}`);
  console.log(`- Amount:                ${web3.utils.fromWei(dividend.amount)} ${dividendTokenSymbol}`);
  console.log(`- Claimed amount:        ${web3.utils.fromWei(dividend.claimedAmount)} ${dividendTokenSymbol}`);
  console.log(`- Taxes:`);
  console.log(`    To withhold:         ${web3.utils.fromWei(taxesToWithHeld)} ${dividendTokenSymbol}`);
  console.log(`    Withheld to-date:    ${web3.utils.fromWei(dividend.totalWithheld)} ${dividendTokenSymbol}`);
  console.log(`    Withdrawn to-date:   ${web3.utils.fromWei(dividend.totalWithheldWithdrawn)} ${dividendTokenSymbol}`);
  console.log(`- Total investors:       ${investorArray.length}`);
  console.log(`   Have already claimed: ${claimedInvestors} (${investorArray.length - excludedInvestors !== 0 ? claimedInvestors / (investorArray.length - excludedInvestors) * 100 : 0}%)`);
  console.log(`   Excluded:             ${excludedInvestors} `);
  // ------------------


  let options = ['Show investors', 'Show report', 'Explore account'];
  if (isValidDividend(dividend) && hasRemaining(dividend) && !isExpiredDividend(dividend) && !dividend.reclaimed) {
    options.push('Push dividends to accounts');
  }
  if (hasRemainingWithheld(dividend)) {
    options.push('Withdraw withholding');
  }
  if (isExpiredDividend(dividend) && !dividend.reclaimed) {
    options.push('Reclaim expired dividends');
  }

  let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'RETURN' });
  let optionSelected = index !== -1 ? options[index] : 'RETURN';
  console.log('Selected:', optionSelected, '\n');
  switch (optionSelected) {
    case 'Show investors':
      showInvestors(investorArray, claimedArray, excludedArray);
      break;
    case 'Show report':
      showReport(
        web3.utils.hexToUtf8(dividend.name),
        dividendTokenSymbol,
        dividend.amount, // Total amount of dividends sent
        dividend.totalWithheld, // Total amount of taxes withheld
        dividend.claimedAmount, // Total amount of dividends distributed
        investorArray,  // Per Address(Amount sent, Taxes withheld (%), Taxes withheld ($/ETH/# Tokens), Amount received, Withdrawn (TRUE/FALSE)
        claimedArray,
        excludedArray,
        withheldArray,
        amountArray
      );
      break;
    case 'Push dividends to accounts':
      await pushDividends(dividendIndex, dividend.checkpointId);
      break;
    case 'Explore account':
      await exploreAccount(dividendIndex, dividendTokenAddress, dividendTokenSymbol);
      break;
    case 'Withdraw withholding':
      await withdrawWithholding(dividendIndex, dividendTokenSymbol);
      break;
    case 'Reclaim expired dividends':
      await reclaimedDividend(dividendIndex, dividendTokenSymbol);
      return;
    case 'RETURN':
      return;
  }

  await manageExistingDividend(dividendIndex);
}

async function taxWithholding() {
  let addresses = readlineSync.question(`Enter addresses to set tax withholding to(ex - add1, add2, add3, ...) or leave empty to read from 'tax_withholding_data.csv': `, {
    limit: function (input) {
      return input === '' || (input.split(',').every(a => web3.utils.isAddress(a)));
    },
    limitMessage: `All addresses must be valid`
  }).split(',');
  if (addresses[0] !== '') {
    let percentage = readlineSync.question('Enter the percentage of dividends to withhold (number between 0-100): ', {
      limit: function (input) {
        return (parseFloat(input) >= 0 && parseFloat(input) <= 100);
      },
      limitMessage: 'Must be a value between 0 and 100',
    });
    let percentageWei = web3.utils.toWei((percentage / 100).toString());
    let setWithHoldingFixedAction = currentDividendsModule.methods.setWithholdingFixed(addresses, percentageWei);
    let receipt = await common.sendTransaction(setWithHoldingFixedAction);
    let event = common.getEventFromLogs(currentDividendsModule._jsonInterface, receipt.logs, 'SetWithholdingFixed');
    console.log(chalk.green(`Successfully set tax rate of ${web3.utils.fromWei(event._withholding)}% for: `));
    console.log(chalk.green(event._investors));
  } else {
    let parsedData = csvParse(TAX_WITHHOLDING_DATA_CSV);
    let validData = parsedData.filter(row =>
      web3.utils.isAddress(row[0]) &&
      !isNaN(row[1])
    );
    let invalidRows = parsedData.filter(row => !validData.includes(row));
    if (invalidRows.length > 0) {
      console.log(chalk.red(`The following lines from csv file are not valid: ${invalidRows.map(r => parsedData.indexOf(r) + 1).join(',')} `));
    }
    let batches = common.splitIntoBatches(validData, 100);
    let [investorArray, taxArray] = common.transposeBatches(batches);
    for (let batch = 0; batch < batches.length; batch++) {
      taxArray[batch] = taxArray[batch].map(t => web3.utils.toWei((t / 100).toString()));
      console.log(`Batch ${batch + 1} - Attempting to set multiple tax rates to accounts: \n\n`, investorArray[batch], '\n');
      let action = await currentDividendsModule.methods.setWithholding(investorArray[batch], taxArray[batch]);
      let receipt = await common.sendTransaction(action);
      console.log(chalk.green('Multiple tax rates have benn set successfully!'));
      console.log(`${receipt.gasUsed} gas used.Spent: ${web3.utils.fromWei((new web3.utils.BN(receipt.gasUsed)).mul(new web3.utils.BN(defaultGasPrice)))} ETH`);
    }
  }
}

async function createDividends() {
  let dividendName = readlineSync.question(`Enter a name or title to indetify this dividend: `);
  let dividendToken = gbl.constants.ADDRESS_ZERO;
  let dividendSymbol = 'ETH';
  let token;
  if (dividendsType === 'ERC20') {
    do {
      dividendToken = readlineSync.question(`Enter the address of ERC20 token in which dividend will be denominated(POLY = ${polyToken.options.address}): `, {
        limit: function (input) {
          return web3.utils.isAddress(input);
        },
        limitMessage: "Must be a valid ERC20 address",
        defaultInput: polyToken.options.address
      });
      token = new web3.eth.Contract(abis.erc20(), dividendToken);
      try {
        dividendSymbol = await token.methods.symbol().call();
      } catch (err) {
        console.log(chalk.red(`${dividendToken} is not a valid ERC20 token address!!`));
      }
    } while (dividendSymbol === 'ETH');
  }
  let dividendAmount = readlineSync.question(`How much ${dividendSymbol} would you like to distribute to token holders? `);

  let dividendAmountBN = new web3.utils.BN(dividendAmount);
  let issuerBalance = new web3.utils.BN(web3.utils.fromWei(await getBalance(Issuer.address, dividendToken)));
  if (issuerBalance.lt(dividendAmountBN)) {
    console.log(chalk.red(`You have ${issuerBalance} ${dividendSymbol}.You need ${dividendAmountBN.sub(issuerBalance)} ${dividendSymbol} more!`));
  } else {
    let checkpointId = await selectCheckpoint(true); // If there are no checkpoints, it must create a new one
    let now = Math.floor(Date.now() / 1000);
    let maturityTime = readlineSync.questionInt('Enter the dividend maturity time from which dividend can be paid (Unix Epoch time)\n(Now = ' + now + ' ): ', { defaultInput: now });
    let defaultTime = now + gbl.constants.DURATION.minutes(10);
    let expiryTime = readlineSync.questionInt('Enter the dividend expiry time (Unix Epoch time)\n(10 minutes from now = ' + defaultTime + ' ): ', { defaultInput: defaultTime });

    let useDefaultExcluded = !readlineSync.keyInYNStrict(`Do you want to use data from 'dividends_exclusions_data.csv' for this dividend? If not, default exclusions will apply.`);

    let createDividendAction;
    if (dividendsType == 'ERC20') {
      let approveAction = token.methods.approve(currentDividendsModule._address, web3.utils.toWei(dividendAmountBN));
      await common.sendTransaction(approveAction);
      if (checkpointId > 0) {
        if (useDefaultExcluded) {
          createDividendAction = currentDividendsModule.methods.createDividendWithCheckpoint(maturityTime, expiryTime, token.options.address, web3.utils.toWei(dividendAmountBN), checkpointId, web3.utils.toHex(dividendName));
        } else {
          let excluded = getExcludedFromDataFile();
          createDividendAction = currentDividendsModule.methods.createDividendWithCheckpointAndExclusions(maturityTime, expiryTime, token.options.address, web3.utils.toWei(dividendAmountBN), checkpointId, excluded[0], web3.utils.toHex(dividendName));
        }
      } else {
        if (useDefaultExcluded) {
          createDividendAction = currentDividendsModule.methods.createDividend(maturityTime, expiryTime, token.options.address, web3.utils.toWei(dividendAmountBN), web3.utils.toHex(dividendName));
        } else {
          let excluded = getExcludedFromDataFile();
          createDividendAction = currentDividendsModule.methods.createDividendWithExclusions(maturityTime, expiryTime, token.options.address, web3.utils.toWei(dividendAmountBN), excluded[0], web3.utils.toHex(dividendName));
        }
      }
      let receipt = await common.sendTransaction(createDividendAction);
      let event = common.getEventFromLogs(currentDividendsModule._jsonInterface, receipt.logs, 'ERC20DividendDeposited');
      console.log(chalk.green(`Dividend ${event._dividendIndex} deposited`));
    } else {
      if (checkpointId > 0) {
        if (useDefaultExcluded) {
          createDividendAction = currentDividendsModule.methods.createDividendWithCheckpoint(maturityTime, expiryTime, checkpointId, web3.utils.toHex(dividendName));
        } else {
          let excluded = getExcludedFromDataFile();
          createDividendAction = currentDividendsModule.methods.createDividendWithCheckpointAndExclusions(maturityTime, expiryTime, checkpointId, excluded, web3.utils.toHex(dividendName));
        }
      } else {
        if (useDefaultExcluded) {
          createDividendAction = currentDividendsModule.methods.createDividend(maturityTime, expiryTime, web3.utils.toHex(dividendName));
        } else {
          let excluded = getExcludedFromDataFile();
          createDividendAction = currentDividendsModule.methods.createDividendWithExclusions(maturityTime, expiryTime, excluded, web3.utils.toHex(dividendName));
        }
      }
      let receipt = await common.sendTransaction(createDividendAction, { value: web3.utils.toWei(dividendAmountBN) });
      let event = common.getEventFromLogs(currentDividendsModule._jsonInterface, receipt.logs, 'EtherDividendDeposited');
      console.log(`
Dividend ${ event._dividendIndex} deposited`
      );
    }
  }
}

function showInvestors(investorsArray, claimedArray, excludedArray) {
  let dataTable = [['Investor', 'Has claimed', 'Is excluded']];
  for (let i = 0; i < investorsArray.length; i++) {
    dataTable.push([
      investorsArray[i],
      claimedArray[i] ? 'YES' : 'NO',
      excludedArray[i] ? 'YES' : 'NO'
    ]);
  }
  console.log();
  console.log(table(dataTable));
}

function showReport(_name, _tokenSymbol, _amount, _witthheld, _claimed, _investorArray, _claimedArray, _excludedArray, _withheldArray, _amountArray) {
  let title = `${_name.toUpperCase()} DIVIDEND REPORT`;
  let dataTable =
    [[
      'Investor',
      'Amount sent',
      'Taxes withheld (%)',
      `Taxes withheld (${_tokenSymbol})`,
      'Amount received',
      'Withdrawn'
    ]];
  for (let i = 0; i < _investorArray.length; i++) {
    let investor = _investorArray[i];
    let excluded = _excludedArray[i];
    let withdrawn = _claimedArray[i] ? 'YES' : 'NO';
    let amount = !excluded ? web3.utils.fromWei(web3.utils.toBN(_amountArray[i]).add(web3.utils.toBN(_withheldArray[i]))) : 0;
    let withheld = !excluded ? web3.utils.fromWei(_withheldArray[i]) : 'NA';
    let withheldPercentage = (!excluded) ? (withheld !== '0' ? parseFloat(withheld) / parseFloat(amount) * 100 : 0) : 'NA';
    let received = !excluded ? web3.utils.fromWei(_amountArray[i]) : 0;
    dataTable.push([
      investor,
      amount,
      withheldPercentage,
      withheld,
      received,
      withdrawn
    ]);
  }
  console.log(chalk.yellow(`-----------------------------------------------------------------------------------------------------------------------------------------------------------`));
  console.log(title.padStart((50 - title.length) / 2, '*').padEnd((50 - title.length) / 2, '*'));
  console.log();
  console.log(`- Total amount of dividends sent: ${web3.utils.fromWei(_amount)} ${_tokenSymbol} `);
  console.log(`- Total amount of taxes withheld: ${web3.utils.fromWei(_witthheld)} ${_tokenSymbol} `);
  console.log(`- Total amount of dividends distributed: ${web3.utils.fromWei(_claimed)} ${_tokenSymbol} `);
  console.log(`- Total amount of investors: ${_investorArray.length} `);
  console.log();
  console.log(table(dataTable));
  console.log();
  console.log(chalk.yellow(`NOTE: If investor has not claimed the dividend yet, TAX and AMOUNT are calculated with the current values set and they might change.`));
  console.log(chalk.yellow(`-----------------------------------------------------------------------------------------------------------------------------------------------------------`));
  console.log();
}

async function pushDividends(dividendIndex, checkpointId) {
  let accounts = readlineSync.question('Enter addresses to push dividends to (ex- add1,add2,add3,...) or leave empty to push to all addresses: ', {
    limit: function (input) {
      return input === '' || (input.split(',').every(a => web3.utils.isAddress(a)));
    },
    limitMessage: `All addresses must be valid`
  }).split(',');
  if (accounts[0] !== '') {
    let action = currentDividendsModule.methods.pushDividendPaymentToAddresses(dividendIndex, accounts);
    let receipt = await common.sendTransaction(action);
    logPushResults(receipt);
  } else {
    let investorsAtCheckpoint = await securityToken.methods.getInvestorsAt(checkpointId).call();
    console.log(`There are ${investorsAtCheckpoint.length} investors at checkpoint ${checkpointId} `);
    let batchSize = readlineSync.questionInt(`How many investors per transaction do you want to push to? `);
    for (let i = 0; i < investorsAtCheckpoint.length; i += batchSize) {
      let action = currentDividendsModule.methods.pushDividendPayment(dividendIndex, i, batchSize);
      let receipt = await common.sendTransaction(action);
      logPushResults(receipt);
    }
  }
}

async function exploreAccount(dividendIndex, dividendTokenAddress, dividendTokenSymbol) {
  let account = readlineSync.question('Enter address to explore: ', {
    limit: function (input) {
      return web3.utils.isAddress(input);
    },
    limitMessage: "Must be a valid address",
  });
  let isExcluded = await currentDividendsModule.methods.isExcluded(account, dividendIndex).call();
  let hasClaimed = await currentDividendsModule.methods.isClaimed(account, dividendIndex).call();
  let dividendAmounts = await currentDividendsModule.methods.calculateDividend(dividendIndex, account).call();
  let dividendBalance = dividendAmounts[0];
  let dividendTax = dividendAmounts[1];
  let dividendTokenBalance = await getBalance(account, dividendTokenAddress);
  let securityTokenBalance = await getBalance(account, securityToken.options.address);

  console.log();
  console.log(`Security token balance: ${web3.utils.fromWei(securityTokenBalance)} ${tokenSymbol} `);
  console.log(`Dividend token balance: ${web3.utils.fromWei(dividendTokenBalance)} ${dividendTokenSymbol} `);
  console.log(`Is excluded: ${isExcluded ? 'YES' : 'NO'} `);
  if (!isExcluded) {
    console.log(`Has claimed: ${hasClaimed ? 'YES' : 'NO'} `);
    if (!hasClaimed) {
      console.log(`Dividends available: ${web3.utils.fromWei(dividendBalance)} ${dividendTokenSymbol} `);
      console.log(`Tax withheld: ${web3.utils.fromWei(dividendTax)} ${dividendTokenSymbol} `);
    }
  }
  console.log();
}

async function withdrawWithholding(dividendIndex, dividendTokenSymbol) {
  let action = currentDividendsModule.methods.withdrawWithholding(dividendIndex);
  let receipt = await common.sendTransaction(action);
  let eventName = dividendsType === 'ERC20' ? 'ERC20DividendWithholdingWithdrawn' : 'EtherDividendWithholdingWithdrawn';
  let event = common.getEventFromLogs(currentDividendsModule._jsonInterface, receipt.logs, eventName);
  console.log(chalk.green(`Successfully withdrew ${web3.utils.fromWei(event._withheldAmount)} ${dividendTokenSymbol} from dividend ${event._dividendIndex} tax withholding.`));
}

async function reclaimedDividend(dividendIndex, dividendTokenSymbol) {
  let action = currentDividendsModule.methods.reclaimDividend(dividendIndex);
  let receipt = await common.sendTransaction(action);
  let eventName = dividendsType === 'ERC20' ? 'ERC20DividendReclaimed' : 'EtherDividendReclaimed';
  let event = common.getEventFromLogs(currentDividendsModule._jsonInterface, receipt.logs, eventName);
  console.log(`
Reclaimed amount ${ web3.utils.fromWei(event._claimedAmount)} ${dividendTokenSymbol}
to account ${ event._claimer} `
  );
}

async function addDividendsModule() {
  let availableModules = await moduleRegistry.methods.getModulesByTypeAndToken(gbl.constants.MODULES_TYPES.DIVIDENDS, securityToken.options.address).call();
  let options = await Promise.all(availableModules.map(async function (m) {
    let moduleFactoryABI = abis.moduleFactory();
    let moduleFactory = new web3.eth.Contract(moduleFactoryABI, m);
    return web3.utils.hexToUtf8(await moduleFactory.methods.name().call());
  }));

  let index = readlineSync.keyInSelect(options, 'Which dividends module do you want to add? ', { cancel: 'Return' });
  if (index != -1 && readlineSync.keyInYNStrict(`Are you sure you want to add ${options[index]} module? `)) {
    let wallet = readlineSync.question('Enter the account address to receive reclaimed dividends and tax: ', {
      limit: function (input) {
        return web3.utils.isAddress(input);
      },
      limitMessage: "Must be a valid address",
    });
    let configureFunction = abis.erc20DividendCheckpoint().find(o => o.name === 'configure' && o.type === 'function');
    let bytes = web3.eth.abi.encodeFunctionCall(configureFunction, [wallet]);

    let selectedDividendFactoryAddress = await contracts.getModuleFactoryAddressByName(securityToken.options.address, gbl.constants.MODULES_TYPES.DIVIDENDS, options[index]);
    let addModuleAction = securityToken.methods.addModule(selectedDividendFactoryAddress, bytes, 0, 0);
    let receipt = await common.sendTransaction(addModuleAction);
    let event = common.getEventFromLogs(securityToken._jsonInterface, receipt.logs, 'ModuleAdded');
    console.log(chalk.green(`Module deployed at address: ${event._module} `));
  }
}

// Helper functions
async function getBalance(address, tokenAddress) {
  if (tokenAddress !== gbl.constants.ADDRESS_ZERO) {
    let token = new web3.eth.Contract(abis.erc20(), tokenAddress);
    return await token.methods.balanceOf(address).call();
  } else {
    return await web3.eth.getBalance(address);
  }
}

function logPushResults(receipt) {
  let successEventName;
  if (dividendsType == 'ERC20') {
    successEventName = 'ERC20DividendClaimed';
  }
  else if (dividendsType == 'ETH') {
    successEventName = 'EtherDividendClaimed';
    let failedEventName = 'EtherDividendClaimFailed';
    let failedEvents = common.getMultipleEventsFromLogs(currentDividendsModule._jsonInterface, receipt.logs, failedEventName);
    for (const event of failedEvents) {
      console.log(chalk.red(`Failed to claim ${web3.utils.fromWei(event._amount)} ${dividendsType} to account ${event._payee} `, '\n'));
    }
  }
  let successEvents = common.getMultipleEventsFromLogs(currentDividendsModule._jsonInterface, receipt.logs, successEventName);
  for (const event of successEvents) {
    console.log(chalk.green(`  Claimed ${web3.utils.fromWei(event._amount)} ${dividendsType}
to account ${ event._payee}
${ web3.utils.fromWei(event._withheld)} ${dividendsType} of tax withheld`, '\n'));
  }
}

async function selectCheckpoint(includeCreate) {
  if (await securityToken.methods.currentCheckpointId().call() > 0) {
    let options = [];
    let fix = 1; //Checkpoint 0 is not included, so I need to add 1 to fit indexes for checkpoints and options
    let checkpoints = (await getCheckpoints()).map(function (c) { return c.timestamp });
    if (includeCreate) {
      options.push('Create new checkpoint');
      fix = 0; //If this option is added, fix isn't needed.
    }
    options = options.concat(checkpoints);

    return readlineSync.keyInSelect(options, 'Select a checkpoint:', { cancel: false }) + fix;
  } else {
    return 0;
  }
}

async function getCheckpoints() {
  let result = [];

  let checkPointsTimestamps = await securityToken.methods.getCheckpointTimes().call();
  for (let index = 0; index < checkPointsTimestamps.length; index++) {
    let checkpoint = {};
    checkpoint.id = index + 1;
    checkpoint.timestamp = moment.unix(checkPointsTimestamps[index]).format('MMMM Do YYYY, HH:mm:ss');
    result.push(checkpoint);
  }

  return result.sort((a, b) => a.id - b.id);
}

function isValidDividend(dividend) {
  let now = Math.floor(Date.now() / 1000);
  return now > dividend.maturity;
}

function isExpiredDividend(dividend) {
  let now = Math.floor(Date.now() / 1000);
  return now > dividend.expiry;
}

function hasRemaining(dividend) {
  return Number(new web3.utils.BN(dividend.amount).sub(new web3.utils.BN(dividend.claimedAmount))).toFixed(10) > 0;
}

function hasRemainingWithheld(dividend) {
  return Number(new web3.utils.BN(dividend.dividendWithheld).sub(new web3.utils.BN(dividend.dividendWithheldReclaimed))).toFixed(10) > 0;
}

async function selectDividend(dividends) {
  let result = null;
  let options = dividends.map(function (d) {
    return `${d.name}
    Amount: ${web3.utils.fromWei(d.amount)} ${d.tokenSymbol}
    Status: ${isExpiredDividend(d) ? 'Expired' : hasRemaining(d) ? 'In progress' : 'Completed'}
    Token: ${d.tokenSymbol}
    Created: ${moment.unix(d.created).format('MMMM Do YYYY, HH:mm:ss')}
    Expiry: ${moment.unix(d.expiry).format('MMMM Do YYYY, HH:mm:ss')} `
  });

  let index = readlineSync.keyInSelect(options, 'Select a dividend:', { cancel: 'RETURN' });
  if (index != -1) {
    result = dividends[index];
  }

  return result;
}

async function getDividends() {
  function DividendData(_index, _created, _maturity, _expiry, _amount, _claimedAmount, _name, _tokenSymbol) {
    this.index = _index;
    this.created = _created;
    this.maturity = _maturity;
    this.expiry = _expiry;
    this.amount = _amount;
    this.claimedAmount = _claimedAmount;
    this.name = _name;
    this.tokenSymbol = _tokenSymbol;
  }

  let dividends = [];
  let dividendsData = await currentDividendsModule.methods.getDividendsData().call();
  let createdArray = dividendsData.createds;
  let maturityArray = dividendsData.maturitys;
  let expiryArray = dividendsData.expirys;
  let amountArray = dividendsData.amounts;
  let claimedAmountArray = dividendsData.claimedAmounts;
  let nameArray = dividendsData.names;
  for (let i = 0; i < nameArray.length; i++) {
    let tokenSymbol = 'ETH';
    if (dividendsType === 'ERC20') {
      let tokenAddress = await currentDividendsModule.methods.dividendTokens(i).call();
      let erc20token = new web3.eth.Contract(abis.erc20(), tokenAddress);
      tokenSymbol = await erc20token.methods.symbol().call();
    }
    dividends.push(
      new DividendData(
        i,
        createdArray[i],
        maturityArray[i],
        expiryArray[i],
        amountArray[i],
        claimedAmountArray[i],
        web3.utils.hexToUtf8(nameArray[i]),
        tokenSymbol
      )
    );
  }

  return dividends;
}

function getExcludedFromDataFile() {
  let parsedData = csvParse(EXCLUSIONS_DATA_CSV);
  let validData = parsedData.filter(row => web3.utils.isAddress(row[0]));
  let invalidRows = parsedData.filter(row => !validData.includes(row));
  if (invalidRows.length > 0) {
    console.log(chalk.red(`The following lines from csv file are not valid: ${invalidRows.map(r => parsedData.indexOf(r) + 1).join(',')} `));
  }
  let batches = common.splitIntoBatches(validData, validData.length);
  let [data] = common.transposeBatches(batches);

  return data;
}

function showExcluded(excluded) {
  console.log('Current default excluded addresses:')
  excluded.map(address => console.log(address));
  console.log();
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
      let abiTemp = JSON.parse(require('fs').readFileSync(`${__dirname} /../../ build / contracts / ${nameTemp}.json`).toString()).abi;
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
  console.log("**********************************************");
  console.log("Welcome to the Command-Line Dividends Manager.");
  console.log("**********************************************");
  console.log("Issuer Account: " + Issuer.address + "\n");
}

async function setup() {
  try {
    let securityTokenRegistryAddress = await contracts.securityTokenRegistry();
    let securityTokenRegistryABI = abis.securityTokenRegistry();
    securityTokenRegistry = new web3.eth.Contract(securityTokenRegistryABI, securityTokenRegistryAddress);
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

module.exports = {
  executeApp: async function (_tokenSymbol) {
    await initialize(_tokenSymbol);
    return executeApp();
  }
}
