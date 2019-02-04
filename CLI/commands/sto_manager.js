const readlineSync = require('readline-sync');
const chalk = require('chalk');
const contracts = require('./helpers/contract_addresses');
const abis = require('./helpers/contract_abis');
const common = require('./common/common_functions');
const gbl = require('./common/global');
const csvParse = require('./helpers/csv');
const { table } = require('table');
const STABLE = 'STABLE';

///////////////////
// Constants
const ACCREDIT_DATA_CSV = `${__dirname}/../data/STO/USDTieredSTO/accredited_data.csv`;
const NON_ACCREDIT_LIMIT_DATA_CSV = `${__dirname}/../data/STO/USDTieredSTO/nonAccreditedLimits_data.csv`;

///////////////////
// Crowdsale params
let tokenSymbol;

////////////////////////
// Artifacts
let strGetter;
let moduleRegistry;
let polyToken;
let usdToken;
let securityToken;

async function executeApp() {
  let exit = false;
  while (!exit) {
    console.log('\n', chalk.blue('STO Manager - Main Menu'), '\n');

    // Show non-archived attached STO modules
    let stoModules = await getAllModulesByType(gbl.constants.MODULES_TYPES.STO);
    let nonArchivedModules = stoModules.filter(m => !m.archived);
    if (nonArchivedModules.length > 0) {
      console.log(`STO modules attached:`);
      nonArchivedModules.map(m => console.log(`- ${m.name} at ${m.address}`))
    } else {
      console.log(`There are no STO modules attached`);
    }

    let options = [];
    if (nonArchivedModules.length > 0) {
      options.push('Show existing STO information', 'Modify existing STO');
    }
    options.push('Add new STO module');

    let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'EXIT' });
    let optionSelected = index != -1 ? options[index] : 'EXIT';
    console.log('Selected:', optionSelected, '\n');
    switch (optionSelected) {
      case 'Show existing STO information':
        let stoToShow = selectExistingSTO(nonArchivedModules, true);
        await showSTO(stoToShow.name, stoToShow.module);
        break;
      case 'Modify existing STO':
        let stoToModify = selectExistingSTO(nonArchivedModules);
        await modifySTO(stoToModify.name, stoToModify.module);
        break;
      case 'Add new STO module':
        await addSTOModule();
        break;
      case 'EXIT':
        exit = true;
        break;
    }
  }
};

function selectExistingSTO(stoModules, showPaused) {
  let filteredModules = stoModules;
  if (!showPaused) {
    filteredModules = stoModules.filter(m => !m.paused);
  }
  let options = filteredModules.map(m => `${m.name} at ${m.address}`);
  let index = readlineSync.keyInSelect(options, 'Select a module: ', { cancel: false });
  console.log('Selected:', options[index], '\n');
  let selectedName = filteredModules[index].name;
  let stoABI;
  switch (selectedName) {
    case 'CappedSTO':
      stoABI = abis.cappedSTO();
      break;
    case 'POLYCappedSTO':
      stoABI = abis.polyCappedSTO();
      break;
    case 'USDTieredSTO':
      stoABI = abis.usdTieredSTO();
      break;
  }

  let stoModule = new web3.eth.Contract(stoABI, filteredModules[index].address);
  return { name: selectedName, module: stoModule };
}

async function showSTO(selectedSTO, currentSTO) {
  switch (selectedSTO) {
    case 'CappedSTO':
      await cappedSTO_status(currentSTO);
      break;
    case 'POLYCappedSTO':
      await polyCappedSTO_status(currentSTO);
      await polyCappedSTO_information(currentSTO);
      break;
    case 'USDTieredSTO':
      await usdTieredSTO_status(currentSTO);
      await showAccreditedData(currentSTO);
      break;
  }
}

async function modifySTO(selectedSTO, currentSTO) {
  switch (selectedSTO) {
    case 'CappedSTO':
      console.log(chalk.red(`
    *********************************
    This option is not yet available.
    *********************************`));
      break;
    case 'POLYCappedSTO':
      await polyCappedSTO_configure(currentSTO);
      break;
    case 'USDTieredSTO':
      await usdTieredSTO_configure(currentSTO);
      break;
  }
}

async function addSTOModule(stoConfig) {
  console.log(chalk.blue('Launch STO - Configuration'));

  let optionSelected;
  if (typeof stoConfig === 'undefined') {
    let availableModules = await moduleRegistry.methods.getModulesByTypeAndToken(gbl.constants.MODULES_TYPES.STO, securityToken.options.address).call();
    let options = await Promise.all(availableModules.map(async function (m) {
      let moduleFactoryABI = abis.moduleFactory();
      let moduleFactory = new web3.eth.Contract(moduleFactoryABI, m);
      return web3.utils.hexToUtf8(await moduleFactory.methods.name().call());
    }));
    let index = readlineSync.keyInSelect(options, 'What type of STO do you want?', { cancel: 'RETURN' });
    optionSelected = index != -1 ? options[index] : 'RETURN';
  } else {
    optionSelected = stoConfig.type;
  }
  console.log('Selected:', optionSelected, '\n');
  switch (optionSelected) {
    case 'CappedSTO':
      await cappedSTODetails();
      if (readlineSync.keyInYNStrict('\nAre you sure you want to configure and launch this STO?')) {
        let cappedSTO = await cappedSTO_launch(stoConfig);
        await cappedSTO_status(cappedSTO);
      } else {
        await addSTOModule(stoConfig);
      }
      break;
    case 'POLYCappedSTO':
      await polyCappedSTODetails();
      if (readlineSync.keyInYNStrict('\nAre you sure you want to configure and launch this STO?')) {
        let polyCappedSTO = await polyCappedSTO_launch(stoConfig);
        await polyCappedSTO_status(polyCappedSTO);
      }
      else{
        await addSTOModule(stoConfig);
      }
      break;
    case 'USDTieredSTO':
      await usdTieredSTODetails();
      if (readlineSync.keyInYNStrict('\nAre you sure you want to configure and launch this STO?')) {
        let usdTieredSTO = await usdTieredSTO_launch(stoConfig);
        await usdTieredSTO_status(usdTieredSTO);
      }
      else{
        await addSTOModule(stoConfig);
      }
      break;
  }
}

async function cappedSTODetails() {
  let cappedSTOFactoryABI = abis.cappedSTOFactory();
  let cappedSTOFactoryAddress = await contracts.getModuleFactoryAddressByName(securityToken.options.address, gbl.constants.MODULES_TYPES.STO, "CappedSTO");
  let cappedSTOFactory = new web3.eth.Contract(cappedSTOFactoryABI, cappedSTOFactoryAddress);
  cappedSTOFactory.setProvider(web3.currentProvider);
  let cappedSTOFee = new web3.utils.BN(await cappedSTOFactory.methods.getSetupCost().call());
  console.log(`CappedSTO Description:\n${await cappedSTOFactory.methods.description().call()}`)
  console.log(chalk.green(`\nCappedSTO deployment requires ${web3.utils.fromWei(cappedSTOFee)} POLY payment from '${Issuer.address}'\nCurrent balance is: ${(web3.utils.fromWei(await polyToken.methods.balanceOf(Issuer.address).call()))} POLY`));
}

async function polyCappedSTODetails() {
  let polyCappedSTOFactoryABI = abis.polyCappedSTOFactory();
  let polyCappedSTOFactoryAddress = await contracts.getModuleFactoryAddressByName(securityToken.options.address, gbl.constants.MODULES_TYPES.STO, "POLYCappedSTO");
  let polyCappedSTOFactory = new web3.eth.Contract(polyCappedSTOFactoryABI, polyCappedSTOFactoryAddress);
  polyCappedSTOFactory.setProvider(web3.currentProvider);
  let polyCappedSTOFee = new web3.utils.BN(await polyCappedSTOFactory.methods.getSetupCost().call());
  console.log(`POLYCappedSTO Description:\n${await polyCappedSTOFactory.methods.description().call()}`)
  console.log(chalk.green(`\nPOLYCappedSTO deployment requires ${web3.utils.fromWei(polyCappedSTOFee)} POLY payment from '${Issuer.address}'\nCurrent balance is: ${(web3.utils.fromWei(await polyToken.methods.balanceOf(Issuer.address).call()))} POLY`));
}

async function usdTieredSTODetails() {
  let usdTieredSTOFactoryABI = abis.usdTieredSTOFactory();
  let usdTieredSTOFactoryAddress = await contracts.getModuleFactoryAddressByName(securityToken.options.address, gbl.constants.MODULES_TYPES.STO, "USDTieredSTO");
  let usdTieredSTOFactory = new web3.eth.Contract(usdTieredSTOFactoryABI, usdTieredSTOFactoryAddress);
  usdTieredSTOFactory.setProvider(web3.currentProvider);
  let usdTieredSTOFee = new web3.utils.BN(await usdTieredSTOFactory.methods.getSetupCost().call());
  console.log(`USDTieredSTO Description:\n${await usdTieredSTOFactory.methods.description().call()}`)
  console.log(chalk.green(`\nUSDTieredSTO deployment requires ${web3.utils.fromWei(usdTieredSTOFee)} POLY payment from '${Issuer.address}'\nCurrent balance is: ${(web3.utils.fromWei(await polyToken.methods.balanceOf(Issuer.address).call()))} POLY`));
}

////////////////
// Capped STO //
////////////////
async function cappedSTO_launch(stoConfig) {
  console.log(chalk.blue('Launch STO - Capped STO in No. of Tokens'));

  let cappedSTOFactoryABI = abis.cappedSTOFactory();
  let cappedSTOFactoryAddress = await contracts.getModuleFactoryAddressByName(securityToken.options.address, gbl.constants.MODULES_TYPES.STO, "CappedSTO");
  let cappedSTOFactory = new web3.eth.Contract(cappedSTOFactoryABI, cappedSTOFactoryAddress);
  cappedSTOFactory.setProvider(web3.currentProvider);
  let stoFee = new web3.utils.BN(await cappedSTOFactory.methods.getSetupCost().call());

  let contractBalance = new web3.utils.BN(await polyToken.methods.balanceOf(securityToken._address).call());
  if (contractBalance.lt(stoFee)) {
    let transferAmount = stoFee.sub(contractBalance);
    let ownerBalance = new web3.utils.BN(await polyToken.methods.balanceOf(Issuer.address).call());
    if (ownerBalance.lt(transferAmount)) {
      console.log(chalk.red(`\n**************************************************************************************************************************************************`));
      console.log(chalk.red(`Not enough balance to pay the CappedSTO fee, Requires ${web3.utils.fromWei(transferAmount)} POLY but have ${web3.utils.fromWei(ownerBalance)} POLY. Access POLY faucet to get the POLY to complete this txn`));
      console.log(chalk.red(`**************************************************************************************************************************************************\n`));
      return;
    } else {
      let transferAction = polyToken.methods.transfer(securityToken._address, transferAmount);
      let receipt = await common.sendTransaction(transferAction, { factor: 2 });
      let event = common.getEventFromLogs(polyToken._jsonInterface, receipt.logs, 'Transfer');
      console.log(`Number of POLY sent: ${web3.utils.fromWei(new web3.utils.BN(event.value))}`)
    }
  }

  let oneMinuteFromNow = new web3.utils.BN((Math.floor(Date.now() / 1000) + 60));
  let oneMonthFromNow = new web3.utils.BN((Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)));

  let cappedSTOconfig = {};
  let useConfigFile = typeof stoConfig !== 'undefined';
  if (!useConfigFile) {
    cappedSTOconfig.cap = readlineSync.question('How many tokens do you plan to sell on the STO? (500.000): ');
    if (cappedSTOconfig.cap == "") cappedSTOconfig.cap = 500000;

    cappedSTOconfig.raiseType = readlineSync.question('Enter' + chalk.green(` P `) + 'for POLY raise or leave empty for Ether raise (E): ');
    if (cappedSTOconfig.raiseType.toUpperCase() == 'P') {
      cappedSTOconfig.raiseType = [gbl.constants.FUND_RAISE_TYPES.POLY];
    } else {
      cappedSTOconfig.raiseType = [gbl.constants.FUND_RAISE_TYPES.ETH];
    }

    cappedSTOconfig.rate = readlineSync.question(`Enter the rate (1 ${cappedSTOconfig.raiseType == gbl.constants.FUND_RAISE_TYPES.POLY ? 'POLY' : 'ETH'} = X ${tokenSymbol}) for the STO (1000): `);
    if (cappedSTOconfig.rate == "") cappedSTOconfig.rate = 1000;

    cappedSTOconfig.wallet = readlineSync.question('Enter the address that will receive the funds from the STO (' + Issuer.address + '): ');
    if (cappedSTOconfig.wallet == "") cappedSTOconfig.wallet = Issuer.address;

    cappedSTOconfig.startTime = readlineSync.question('Enter the start time for the STO (Unix Epoch time)\n(1 minutes from now = ' + oneMinuteFromNow + ' ): ');

    cappedSTOconfig.endTime = readlineSync.question('Enter the end time for the STO (Unix Epoch time)\n(1 month from now = ' + oneMonthFromNow + ' ): ');
  } else {
    cappedSTOconfig = stoConfig;
  }

  if (cappedSTOconfig.startTime == "") cappedSTOconfig.startTime = oneMinuteFromNow;
  if (cappedSTOconfig.endTime == "") cappedSTOconfig.endTime = oneMonthFromNow;

  let cappedSTOABI = abis.cappedSTO();
  let configureFunction = cappedSTOABI.find(o => o.name === 'configure' && o.type === 'function');
  let bytesSTO = web3.eth.abi.encodeFunctionCall(configureFunction,
    [cappedSTOconfig.startTime,
    cappedSTOconfig.endTime,
    web3.utils.toWei(cappedSTOconfig.cap.toString()),
    web3.utils.toWei(cappedSTOconfig.rate.toString()),
    cappedSTOconfig.raiseType,
    cappedSTOconfig.wallet]
  );

  let addModuleAction = securityToken.methods.addModule(cappedSTOFactoryAddress, bytesSTO, stoFee, 0);
  let receipt = await common.sendTransaction(addModuleAction);
  let event = common.getEventFromLogs(securityToken._jsonInterface, receipt.logs, 'ModuleAdded');
  console.log(`STO deployed at address: ${event._module}`);

  let cappedSTO = new web3.eth.Contract(cappedSTOABI, event._module);
  cappedSTO.setProvider(web3.currentProvider);

  return cappedSTO;
}

async function cappedSTO_status(currentSTO) {
  let displayStartTime = await currentSTO.methods.startTime().call();
  let displayEndTime = await currentSTO.methods.endTime().call();
  let displayRate = new web3.utils.BN(await currentSTO.methods.rate().call());
  let displayCap = new web3.utils.BN(await currentSTO.methods.cap().call());
  let displayWallet = await currentSTO.methods.wallet().call();
  let displayRaiseType = await currentSTO.methods.fundRaiseTypes(gbl.constants.FUND_RAISE_TYPES.ETH).call() ? 'ETH' : 'POLY';
  let displayFundsRaised = await currentSTO.methods.fundsRaised(gbl.constants.FUND_RAISE_TYPES[displayRaiseType]).call();
  let displayWalletBalance = web3.utils.fromWei(await getBalance(displayWallet, gbl.constants.FUND_RAISE_TYPES[displayRaiseType]));
  let displayTokensSold = new web3.utils.BN(await currentSTO.methods.totalTokensSold().call());
  let displayInvestorCount = await currentSTO.methods.investorCount().call();
  let displayTokenSymbol = await securityToken.methods.symbol().call();

  let now = Math.floor(Date.now() / 1000);
  let timeTitle;
  let timeRemaining;

  if (now < displayStartTime) {
    timeTitle = "STO starts in: ";
    timeRemaining = displayStartTime - now;
  } else {
    timeTitle = "Time remaining:";
    timeRemaining = displayEndTime - now;
  }

  timeRemaining = common.convertToDaysRemaining(timeRemaining);

  console.log(`
    ******************************* STO INFORMATION ********************************
  - Address:           ${currentSTO.options.address}
  - Raise Cap:         ${web3.utils.fromWei(displayCap)} ${displayTokenSymbol.toUpperCase()}
  - Start Time:        ${new Date(displayStartTime * 1000)}
  - End Time:          ${new Date(displayEndTime * 1000)}
  - Raise Type:        ${displayRaiseType}
  - Rate:              1 ${displayRaiseType} = ${web3.utils.fromWei(displayRate)} ${displayTokenSymbol.toUpperCase()}
  - Wallet:            ${displayWallet}
  - Wallet Balance:    ${displayWalletBalance} ${displayRaiseType}
  ----------------------------------------------------------------------------------
  - ${timeTitle}    ${timeRemaining}
  - Funds raised:      ${web3.utils.fromWei(displayFundsRaised)} ${displayRaiseType}
  - Tokens sold:       ${web3.utils.fromWei(displayTokensSold)} ${displayTokenSymbol.toUpperCase()}
  - Tokens remaining:  ${web3.utils.fromWei(displayCap.sub(displayTokensSold))} ${displayTokenSymbol.toUpperCase()}
  - Investor count:    ${displayInvestorCount}
  `);
}

/////////////////////
// POLY Capped STO //
/////////////////////

async function polyCappedSTO_launch(stoConfig) {
  console.log(chalk.blue('Launch STO - Capped STO with POLY as accepted payment'));

  let polyCappedSTOFactoryABI = abis.polyCappedSTOFactory();
  let polyCappedSTOFactoryAddress = await contracts.getModuleFactoryAddressByName(securityToken.options.address, gbl.constants.MODULES_TYPES.STO, "POLYCappedSTO");
  let polyCappedSTOFactory = new web3.eth.Contract(polyCappedSTOFactoryABI, polyCappedSTOFactoryAddress);
  polyCappedSTOFactory.setProvider(web3.currentProvider);
  let stoFee = new web3.utils.BN(await polyCappedSTOFactory.methods.getSetupCost().call());

  let contractBalance = new web3.utils.BN(await polyToken.methods.balanceOf(securityToken._address).call());
  if (contractBalance.lt(stoFee)) {
    let transferAmount = stoFee.sub(contractBalance);
    let ownerBalance = new web3.utils.BN(await polyToken.methods.balanceOf(Issuer.address).call());
    if (ownerBalance.lt(transferAmount)) {
      console.log(chalk.red(`\n**************************************************************************************************************************************************`));
      console.log(chalk.red(`Not enough balance to pay the POLYCappedSTO fee, Requires ${web3.utils.fromWei(transferAmount)} POLY but have ${web3.utils.fromWei(ownerBalance)} POLY. Access POLY faucet to get the POLY to complete this txn`));
      console.log(chalk.red(`**************************************************************************************************************************************************\n`));
      return;
    } else {
      let transferAction = polyToken.methods.transfer(securityToken._address, transferAmount);
      let receipt = await common.sendTransaction(transferAction, { factor: 2 });
      let event = common.getEventFromLogs(polyToken._jsonInterface, receipt.logs, 'Transfer');
      console.log(`Number of POLY sent: ${web3.utils.fromWei(new web3.utils.BN(event.value))}`)
    }
  }

  let useConfigFile = typeof stoConfig !== 'undefined';
  let funding = {};
  funding.raiseType = [gbl.constants.FUND_RAISE_TYPES.POLY];
  let addresses = useConfigFile ? stoConfig.addresses : await addressesConfigPolyCappedSTO();
  let cap = useConfigFile ? stoConfig.cap : capConfig();
  let rate = useConfigFile ? stoConfig.rate : polyRateConfig();
  let limits = useConfigFile ? stoConfig.limits : limitsConfigPOLYCappedSTO();
  let times = timesConfig(stoConfig);

  let polyCappedSTOABI = abis.polyCappedSTO();
  let configureFunction = polyCappedSTOABI.find(o => o.name === 'configure' && o.type === 'function');
  let bytesSTO = web3.eth.abi.encodeFunctionCall(configureFunction,
    [times.startTime,
    times.endTime,
    web3.utils.toWei(cap.toString()),
    web3.utils.toWei(rate.toString()),
    web3.utils.toWei(limits.minimumInvestmentPOLY.toString()),
    web3.utils.toWei(limits.nonAccreditedLimitPOLY.toString()),
    limits.maxNonAccreditedInvestors,
    addresses.wallet,
    addresses.reserveWallet]
  );

  let addModuleAction = securityToken.methods.addModule(polyCappedSTOFactoryAddress, bytesSTO, stoFee, 0);
  let receipt = await common.sendTransaction(addModuleAction);
  let event = common.getEventFromLogs(securityToken._jsonInterface, receipt.logs, 'ModuleAdded');
  console.log(`STO deployed at address: ${event._module}`);

  let polyCappedSTO = new web3.eth.Contract(polyCappedSTOABI, event._module);
  polyCappedSTO.setProvider(web3.currentProvider);

  return polyCappedSTO;
}

async function addressesConfigPolyCappedSTO() {
  let addresses = {};

  addresses.wallet = readlineSync.question('- Enter the address that will receive the funds from the STO (' + Issuer.address + '): ', {
    limit: function (input) {
      return web3.utils.isAddress(input);
    },
    limitMessage: "Must be a valid address",
    defaultInput: Issuer.address
  });
  if (addresses.wallet == "") addresses.wallet = Issuer.address;

  if (readlineSync.keyInYNStrict('- Do you want unsold tokens to be minted if the cap is not met?')) {
    addresses.reserveWallet = readlineSync.question('- Enter the address that will receive unsold tokens (' + Issuer.address + '): ', {
      limit: function (input) {
        return web3.utils.isAddress(input);
      },
      limitMessage: "Must be a valid address",
      defaultInput: Issuer.address
    });
    if (addresses.reserveWallet == "") addresses.reserveWallet = Issuer.address;
  }
  else{
    addresses.reserveWallet = gbl.constants.ADDRESS_ZERO;
  }

  return addresses;
}

function capConfig() {
  let cap;

  let defaultCap = 500000;
  cap = readlineSync.question(`- How many tokens do you plan to sell through this offering? (${defaultCap}): `, {
    limit: function (input) {
      return parseFloat(input) > 0;
    },
    limitMessage: "Must be greater than zero",
    defaultInput: defaultCap
  });

  return cap;
}

function polyRateConfig() {
  let rate;

  let defaultRate = 0.1;
  rate = readlineSync.question(`- Enter the rate (1 POLY = X ${tokenSymbol}) for the STO (${defaultRate}): `, {
    limit: function (input) {
      return parseFloat(input) > 0;
    },
    limitMessage: "Must be greater than zero",
    defaultInput: defaultRate
  });

  return rate;
}

function limitsConfigPOLYCappedSTO() {
  let limits = {};

  let defaultMinimumInvestment = 50;
  limits.minimumInvestmentPOLY = readlineSync.question(`- What is the minimum investment in POLY? (${defaultMinimumInvestment}): `, {
    limit: function (input) {
      return parseFloat(input) > 0;
    },
    limitMessage: "Must be greater than zero",
    defaultInput: defaultMinimumInvestment
  });

  let nonAccreditedLimit = 20000;
  limits.nonAccreditedLimitPOLY = readlineSync.question(`- What is the default limit for non-accredited investors in POLY? \n  (Set to less than the minimum investment to disable default non-accredited investors)(${nonAccreditedLimit}): `, {
    limit: function (input) {
      return parseFloat(input) >= 0;
    },
    limitMessage: "Negative number not allowed",
    defaultInput: nonAccreditedLimit
  });

  let defaultMaxNonAccreditedInvestors = 0;
  limits.maxNonAccreditedInvestors = parseInt(readlineSync.question(`- What is the maximum number of non-accredited investors? (${defaultMaxNonAccreditedInvestors} = unlimited): `, {
    limit: function (input) {
      return parseInt(input) >= 0;
    },
    limitMessage: "Negative number not allowed",
    defaultInput: defaultMaxNonAccreditedInvestors
  }));

  return limits;
}

async function polyCappedSTO_status(currentSTO) {
  let displayStartTime = await currentSTO.methods.startTime().call();
  let displayEndTime = await currentSTO.methods.endTime().call();
  let displayCap = new web3.utils.BN(await currentSTO.methods.cap().call());
  let displayRate = new web3.utils.BN(await currentSTO.methods.rate().call());
  let displayMinimumInvestment = new web3.utils.BN(await currentSTO.methods.minimumInvestment().call());
  let displayNonAccreditedLimit = new web3.utils.BN(await currentSTO.methods.nonAccreditedLimit().call());
  let displayMaxNonAccreditedInvestors = new web3.utils.BN(await currentSTO.methods.maxNonAccreditedInvestors().call());
  let displayWallet = await currentSTO.methods.wallet().call();
  let displayReserveWallet = await currentSTO.methods.reserveWallet().call();
  let displayRaiseType = 'POLY';
  let displayIsOpen = await currentSTO.methods.isOpen().call();
  let displayIsFinalized = await currentSTO.methods.isFinalized().call() ? "YES" : "NO";
  let displayFundsRaised = await currentSTO.methods.fundsRaised(gbl.constants.FUND_RAISE_TYPES[displayRaiseType]).call();
  let displayWalletBalance = web3.utils.fromWei(await getBalance(displayWallet, gbl.constants.FUND_RAISE_TYPES[displayRaiseType]));
  let displayTokensSold = new web3.utils.BN(await currentSTO.methods.totalTokensSold().call());
  let displayInvestorCount = await currentSTO.methods.investorCount().call();
  let displayNonAccreditedCount = await currentSTO.methods.nonAccreditedCount().call();
  let displayTokenSymbol = await securityToken.methods.symbol().call();

  let now = Math.floor(Date.now() / 1000);
  let timeTitle;
  let timeRemaining;

  if (now < displayStartTime) {
    timeTitle = "STO starts in: ";
    timeRemaining = displayStartTime - now;
  } else {
    timeTitle = "STO ends in:   ";
    timeRemaining = displayEndTime - now;
  }

  timeRemaining = common.convertToDaysRemaining(timeRemaining);

  console.log(`
  ******************************* STO INFORMATION ********************************
  - Address:                       ${currentSTO.options.address}
  - Start Time:                    ${new Date(displayStartTime * 1000).toLocaleString()}
  - End Time:                      ${new Date(displayEndTime * 1000).toLocaleString()}
  - Raise Cap:                     ${web3.utils.fromWei(displayCap)} ${displayTokenSymbol.toUpperCase()}
  - Raise Type:                    ${displayRaiseType}
  - Rate:                          1 ${displayRaiseType} = ${web3.utils.fromWei(displayRate)} ${displayTokenSymbol.toUpperCase()}
  - Raise Target:                  ${(new web3.utils.BN(displayCap)).div(new web3.utils.BN(displayRate))} ${displayRaiseType}
  - Minimum Investment:            ${web3.utils.fromWei(displayMinimumInvestment)} ${displayRaiseType}
  - Default Non-Accredited
    investment Limit:              ${web3.utils.fromWei(displayNonAccreditedLimit)} ${displayRaiseType} ${parseFloat(web3.utils.fromWei(displayNonAccreditedLimit)) < parseFloat(web3.utils.fromWei(displayMinimumInvestment)) ? '(Non-Accredited investors cannot invest without an override)' : ''}
  - Maxaimum Number of
    Non-Accredited Investors:      ${displayMaxNonAccreditedInvestors == 0 ? 'Unlimited' : displayMaxNonAccreditedInvestors}
  - Wallet:                        ${displayWallet}
  - Wallet Balance:                ${displayWalletBalance} ${displayRaiseType}
  - Reserve Wallet:                ${displayReserveWallet == gbl.constants.ADDRESS_ZERO ? 'Minting of unsold tokens is disabled' : displayReserveWallet}
  --------------------------------------------------------------------------------
  - STO Status:                    ${displayIsOpen ? "Offering is open" : "Offering is not open"}
  - ${timeTitle}                ${timeRemaining}
  - Is Finalized:                  ${displayIsFinalized}
  - Funds raised:                  ${web3.utils.fromWei(displayFundsRaised)} ${displayRaiseType}
  - Tokens sold:                   ${web3.utils.fromWei(displayTokensSold)} ${displayTokenSymbol.toUpperCase()}
  - Tokens remaining:              ${web3.utils.fromWei(displayCap.sub(displayTokensSold))} ${displayTokenSymbol.toUpperCase()}
  - Investor count:                ${displayInvestorCount}
  - Non-accredited Investor count: ${displayNonAccreditedCount}
  `);
}

async function polyCappedSTO_information(currentSTO){

  let options = [];
  options.push('Show Token Purchases', 'Show investor accredited status and limits');
  let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'EXIT' });
  let optionSelected = index != -1 ? options[index] : 'EXIT';
  console.log('Selected:', optionSelected, '\n');
  switch (optionSelected) {
    case 'Show Token Purchases':
      await showTokenPurchases(currentSTO);
      break;
    case 'Show investor accredited status and limits':
      await showAccreditedData(currentSTO);
      break;
    case 'EXIT':
      exit = true;
      break;
    }
}

async function showTokenPurchases(currentSTO) {
  let pastEvents = await web3.eth.getPastLogs({
     fromBlock: 1,
     toBlock: 'latest',
     address: currentSTO.options.address,
     topics: [null]
   })

   let eventJsonInterface = currentSTO._jsonInterface.find(o => o.name === 'TokenPurchase' && o.type === 'event');
   let filteredEvents = pastEvents.filter(l => l.topics.includes(eventJsonInterface.signature));
   if (filteredEvents.length > 0) {
   let displayTokenSymbol = await securityToken.methods.symbol().call();
   let tokenPurchaseTable = [['Date/Time', 'Investor Wallet', 'Invested', 'Received', 'Transaction']];
   for (event of filteredEvents){
     let _blockNumber = (event.blockNumber);
     let blockDetails = await (web3.eth.getBlock(_blockNumber));
     let blockTime = blockDetails.timestamp
     let decodedEvent = web3.eth.abi.decodeLog(eventJsonInterface.inputs, event.data, event.topics.slice(1))

     tokenPurchaseTable.push([
       new Date(blockTime * 1000).toLocaleString(),
       decodedEvent._beneficiary,
       web3.utils.fromWei(decodedEvent._value) + ' POLY',
       web3.utils.fromWei(decodedEvent._amount) + ' ' + displayTokenSymbol.toUpperCase(),
       event.transactionHash
       ]);
     }
     console.log(`  ******************************* TOKEN PURCHASES ********************************`);
     console.log(table(tokenPurchaseTable));

   } else {
     console.log();
     console.log(chalk.yellow(`There are no token purchases to show`));
     console.log();
   }
}

async function polyCappedSTO_configure(currentSTO) {
  console.log(chalk.blue('STO Configuration - POLY Capped STO'));

  let isFinalized = await currentSTO.methods.isFinalized().call();
  if (isFinalized) {
    console.log(chalk.red(`STO is finalized`));
  } else {
    let options = [];
    options.push('Finalize STO',
      'Change accredited account', 'Change accredited in batch',
      'Change non accredited limit for an account', 'Change non accredited limits in batch',
      'Modify addresses configuration');

    // If STO is not started, you can modify configuration
    let now = Math.floor(Date.now() / 1000);
    let startTime = await currentSTO.methods.startTime().call.call();
    if (now < startTime) {
      options.push('Modify times configuration', 'Modify cap configuration',
      'Modify rate configuration', 'Modify limits configuration');
    }

    let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'RETURN' });
    let selected = index != -1 ? options[index] : 'EXIT';
    switch (selected) {
      case 'Finalize STO':
        let reserveWallet = await currentSTO.methods.reserveWallet().call();
        if (reserveWallet == gbl.constants.ADDRESS_ZERO) {
          let finalizeAction = currentSTO.methods.finalize();
          await common.sendTransaction(finalizeAction);
          break;
        }
        let isVerified = await securityToken.methods.verifyTransfer(gbl.constants.ADDRESS_ZERO, reserveWallet, 0, web3.utils.fromAscii("")).call();
        if (isVerified) {
          if (readlineSync.keyInYNStrict()) {
            let finalizeAction = currentSTO.methods.finalize();
            await common.sendTransaction(finalizeAction);
          }
        } else {
          console.log(chalk.red(`Reserve wallet (${reserveWallet}) is not able to receive remaining tokens. Check if this address is whitelisted.`));
        }
        break;
      case 'Change accredited account':
        let investor = readlineSync.question('Enter the address to change accreditation: ');
        let isAccredited = readlineSync.keyInYNStrict(`Is ${investor} accredited?`);
        let investors = [investor];
        let accredited = [isAccredited];
        let changeAccreditedAction = currentSTO.methods.changeAccredited(investors, accredited);
        await common.sendTransaction(changeAccreditedAction);
        break;
      case 'Change accredited in batch':
        await changeAccreditedInBatch(currentSTO);
        break;
      case 'Change non accredited limit for an account':
        let account = readlineSync.question('Enter the address to change non accredited limit: ');
        let limit = readlineSync.question(`Enter the limit in POLY: `);
        let accounts = [account];
        let limits = [web3.utils.toWei(limit)];
        let changeNonAccreditedLimitAction = currentSTO.methods.changeNonAccreditedLimit(accounts, limits);
        await common.sendTransaction(changeNonAccreditedLimitAction);
        break;
      case 'Change non accredited limits in batch':
        await changeNonAccreditedLimitsInBatch(currentSTO);
        break;
      case 'Modify times configuration':
        await modfifyTimes(currentSTO);
        await polyCappedSTO_status(currentSTO);
        break;
      case 'Modify addresses configuration':
        await modfifyAddressesPolyCappedSTO(currentSTO);
        await polyCappedSTO_status(currentSTO);
        break;
      case 'Modify cap configuration':
        await modfifyCapPOLYCappedSTO(currentSTO);
        await polyCappedSTO_status(currentSTO);
        break;
      case 'Modify rate configuration':
        await modfifyRatePOLYCappedSTO(currentSTO);
        await polyCappedSTO_status(currentSTO);
        break;
      case 'Modify limits configuration':
        await modfifyLimitsPOLYCappedSTO(currentSTO);
        await polyCappedSTO_status(currentSTO);
        break;
    }
  }
}

async function modfifyCapPOLYCappedSTO(currentSTO) {
  let cap = capConfig();
  let modifyCapAction = currentSTO.methods.modifyCap(web3.utils.toWei(cap.toString()));
  await common.sendTransaction(modifyCapAction);
}

async function modfifyRatePOLYCappedSTO(currentSTO) {
  let rate = (polyRateConfig());
  let modifyRateAction = currentSTO.methods.modifyRate(web3.utils.toWei(rate.toString()));
  await common.sendTransaction(modifyRateAction);
}

async function modfifyLimitsPOLYCappedSTO(currentSTO) {
  let limits = limitsConfigPOLYCappedSTO();
  let modifyLimitsAction = currentSTO.methods.modifyLimits(
    web3.utils.toWei(limits.minimumInvestmentPOLY.toString()),
    web3.utils.toWei(limits.nonAccreditedLimitPOLY.toString()),
    limits.maxNonAccreditedInvestors
  );
  await common.sendTransaction(modifyLimitsAction);
}

async function modfifyAddressesPolyCappedSTO(currentSTO) {
  let addresses = await addressesConfigPolyCappedSTO();
  let modifyAddressesAction = currentSTO.methods.modifyAddresses(addresses.wallet, addresses.reserveWallet);
  await common.sendTransaction(modifyAddressesAction);
}

////////////////////
// USD Tiered STO //
////////////////////
function fundingConfigUSDTieredSTO() {
  let funding = {};

  let selectedFunding = readlineSync.question('Enter' + chalk.green(` P `) + 'for POLY raise,' + chalk.green(` S `) + 'for Stable Coin raise,' + chalk.green(` E `) + 'for Ether raise or any combination of them (i.e.' + chalk.green(` PSE `) + 'for all): ').toUpperCase();

  funding.raiseType = [];
  if (selectedFunding.includes('E')) {
    funding.raiseType.push(gbl.constants.FUND_RAISE_TYPES.ETH);
  }
  if (selectedFunding.includes('P')) {
    funding.raiseType.push(gbl.constants.FUND_RAISE_TYPES.POLY);
  }
  if (selectedFunding.includes('S')) {
    funding.raiseType.push(gbl.constants.FUND_RAISE_TYPES.STABLE);
  }
  if (funding.raiseType.length == 0) {
    funding.raiseType = [gbl.constants.FUND_RAISE_TYPES.ETH, gbl.constants.FUND_RAISE_TYPES.POLY, gbl.constants.FUND_RAISE_TYPES.STABLE];
  }

  return funding;
}

async function addressesConfigUSDTieredSTO(usdTokenRaise) {

  let addresses, menu;

  do {

    addresses = {};

    addresses.wallet = readlineSync.question('Enter the address that will receive the funds from the STO (' + Issuer.address + '): ', {
      limit: function (input) {
        return web3.utils.isAddress(input);
      },
      limitMessage: "Must be a valid address",
      defaultInput: Issuer.address
    });
    if (addresses.wallet == "") addresses.wallet = Issuer.address;

    addresses.reserveWallet = readlineSync.question('Enter the address that will receive remaining tokens in the case the cap is not met (' + Issuer.address + '): ', {
      limit: function (input) {
        return web3.utils.isAddress(input);
      },
      limitMessage: "Must be a valid address",
      defaultInput: Issuer.address
    });
    if (addresses.reserveWallet == "") addresses.reserveWallet = Issuer.address;

    let listOfAddress;

    if (usdTokenRaise) {
      addresses.usdToken = readlineSync.question('Enter the address (or multiple addresses separated by commas) of the USD stable coin(s) (' + usdToken.options.address + '): ', {
        limit: function (input) {
          listOfAddress = input.split(',');
          return listOfAddress.every((addr) => {
            return web3.utils.isAddress(addr)
          })
        },
        limitMessage: "Must be a valid address",
        defaultInput: usdToken.options.address
      });
      if (addresses.usdToken == "") {
        listOfAddress = [usdToken.options.address]
        addresses.usdToken = [usdToken.options.address];
      }
    } else {
      listOfAddress = []
      addresses.usdToken = [];
    }

    if ((usdTokenRaise) && (!await processArray(listOfAddress))) {
      console.log(chalk.yellow(`\nPlease, verify your stable coins addresses to continue with this process.\n`))
      menu = true;
    } else {
      menu = false;
    }

    if (typeof addresses.usdToken === 'string') {
      addresses.usdToken = addresses.usdToken.split(",")
    }

  } while (menu);

  return addresses;
}

async function checkSymbol(address) {
  let stableCoin = common.connect(abis.erc20(), address);
  try {
    return await stableCoin.methods.symbol().call();
  } catch (e) {
    return ""
  }
}

async function processArray(array) {
  let result = true;
  for (const address of array) {
    let symbol = await checkSymbol(address);
    if (symbol == "") {
      result = false;
      console.log(`${address} seems not to be a stable coin`)
    }
  }
  return result
}

async function processAddress(array) {
  let list = [];
  for (const address of array) {
    let symbol = await checkSymbol(address);
    list.push({ "symbol": symbol, "address": address })
  }
  return list
}

function tiersConfigUSDTieredSTO(polyRaise) {
  let tiers = {};

  let defaultTiers = 3;
  tiers.tiers = parseInt(readlineSync.question(`Enter the number of tiers for the STO? (${defaultTiers}): `, {
    limit: function (input) {
      return parseInt(input) > 0;
    },
    limitMessage: 'Must be greater than zero',
    defaultInput: defaultTiers
  }));

  let defaultTokensPerTier = [190000000, 100000000, 200000000];
  let defaultRatePerTier = ['0.05', '0.10', '0.15'];
  let defaultTokensPerTierDiscountPoly = [90000000, 50000000, 100000000];
  let defaultRatePerTierDiscountPoly = ['0.025', '0.05', '0.075'];
  tiers.tokensPerTier = [];
  tiers.ratePerTier = [];
  tiers.tokensPerTierDiscountPoly = [];
  tiers.ratePerTierDiscountPoly = [];
  for (let i = 0; i < tiers.tiers; i++) {
    tiers.tokensPerTier[i] = readlineSync.question(`How many tokens do you plan to sell on tier No. ${i + 1}? (${defaultTokensPerTier[i]}): `, {
      limit: function (input) {
        return parseFloat(input) > 0;
      },
      limitMessage: 'Must be greater than zero',
      defaultInput: defaultTokensPerTier[i]
    });

    tiers.ratePerTier[i] = readlineSync.question(`What is the USD per token rate for tier No. ${i + 1}? (${defaultRatePerTier[i]}): `, {
      limit: function (input) {
        return parseFloat(input) > 0;
      },
      limitMessage: 'Must be greater than zero',
      defaultInput: defaultRatePerTier[i]
    });

    if (polyRaise && readlineSync.keyInYNStrict(`Do you plan to have a discounted rate for POLY investments for tier No. ${i + 1}? `)) {
      tiers.tokensPerTierDiscountPoly[i] = readlineSync.question(`How many of those tokens do you plan to sell at discounted rate on tier No. ${i + 1}? (${defaultTokensPerTierDiscountPoly[i]}): `, {
        limit: function (input) {
          return parseFloat(input) < parseFloat(tiers.tokensPerTier[i]);
        },
        limitMessage: 'Must be less than the No. of tokens of the tier',
        defaultInput: defaultTokensPerTierDiscountPoly[i]
      });

      tiers.ratePerTierDiscountPoly[i] = readlineSync.question(`What is the discounted rate for tier No. ${i + 1}? (${defaultRatePerTierDiscountPoly[i]}): `, {
        limit: function (input) {
          return parseFloat(input) < parseFloat(tiers.ratePerTier[i]);
        },
        limitMessage: 'Must be less than the rate of the tier',
        defaultInput: defaultRatePerTierDiscountPoly[i]
      });
    } else {
      tiers.tokensPerTierDiscountPoly[i] = 0;
      tiers.ratePerTierDiscountPoly[i] = 0;
    }
  }

  return tiers;
}

function limitsConfigUSDTieredSTO() {
  let limits = {};

  let defaultMinimumInvestment = 5;
  limits.minimumInvestmentUSD = readlineSync.question(`What is the minimum investment in USD? (${defaultMinimumInvestment}): `, {
    limit: function (input) {
      return parseFloat(input) > 0;
    },
    limitMessage: "Must be greater than zero",
    defaultInput: defaultMinimumInvestment
  });

  let nonAccreditedLimit = 2500;
  limits.nonAccreditedLimitUSD = readlineSync.question(`What is the default limit for non accredited investors in USD? (${nonAccreditedLimit}): `, {
    limit: function (input) {
      return parseFloat(input) >= parseFloat(limits.minimumInvestmentUSD);
    },
    limitMessage: "Must be greater than minimum investment",
    defaultInput: nonAccreditedLimit
  });

  return limits;
}

function timesConfig(stoConfig) {
  let times = {};

  let oneMinuteFromNow = Math.floor(Date.now() / 1000) + 60;
  if (typeof stoConfig === 'undefined') {
    times.startTime = parseInt(readlineSync.question('- Enter the start time for the STO (Unix Epoch time)\n  (1 minutes from now = ' + oneMinuteFromNow + ' ): ', {
      limit: function (input) {
        return parseInt(input) > Math.floor(Date.now() / 1000);
      },
      limitMessage: "Must be a future time",
      defaultInput: oneMinuteFromNow
    }));
  } else {
    times.startTime = stoConfig.times.startTime;
  }
  if (times.startTime == "") times.startTime = oneMinuteFromNow;

  let oneMonthFromNow = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
  if (typeof stoConfig === 'undefined') {
    times.endTime = parseInt(readlineSync.question('- Enter the end time for the STO (Unix Epoch time)\n  (1 month from now = ' + oneMonthFromNow + ' ): ', {
      limit: function (input) {
        return parseInt(input) > times.startTime;
      },
      limitMessage: "Must be greater than Start Time",
      defaultInput: oneMonthFromNow
    }));
  } else {
    times.endTime = stoConfig.times.startTime;
  }
  if (times.endTime == "") times.endTime = oneMonthFromNow;

  return times;
}

async function usdTieredSTO_launch(stoConfig) {
  console.log(chalk.blue('Launch STO - USD pegged tiered STO'));

  let usdTieredSTOFactoryABI = abis.usdTieredSTOFactory();
  let usdTieredSTOFactoryAddress = await contracts.getModuleFactoryAddressByName(securityToken.options.address, gbl.constants.MODULES_TYPES.STO, 'USDTieredSTO');
  let usdTieredSTOFactory = new web3.eth.Contract(usdTieredSTOFactoryABI, usdTieredSTOFactoryAddress);
  usdTieredSTOFactory.setProvider(web3.currentProvider);
  let stoFee = new web3.utils.BN(await usdTieredSTOFactory.methods.getSetupCost().call());

  let contractBalance = new web3.utils.BN(await polyToken.methods.balanceOf(securityToken._address).call());
  if (contractBalance.lt(stoFee)) {
    let transferAmount = stoFee.sub(contractBalance);
    let ownerBalance = new web3.utils.BN(await polyToken.methods.balanceOf(Issuer.address).call());
    if (ownerBalance.lt(transferAmount)) {
      console.log(chalk.red(`\n**************************************************************************************************************************************************`));
      console.log(chalk.red(`Not enough balance to pay the USDTieredSTO fee, Requires ${web3.utils.fromWei(transferAmount)} POLY but have ${web3.utils.fromWei(ownerBalance)} POLY. Access POLY faucet to get the POLY to complete this txn`));
      console.log(chalk.red(`**************************************************************************************************************************************************\n`));
      return;
    } else {
      let transferAction = polyToken.methods.transfer(securityToken._address, transferAmount);
      let receipt = await common.sendTransaction(transferAction, { factor: 2 });
      let event = common.getEventFromLogs(polyToken._jsonInterface, receipt.logs, 'Transfer');
      console.log(`Number of POLY sent: ${web3.utils.fromWei(new web3.utils.BN(event.value))}`)
    }
  }

  let useConfigFile = typeof stoConfig !== 'undefined';
  let funding = useConfigFile ? stoConfig.funding : fundingConfigUSDTieredSTO();
  let addresses = useConfigFile ? stoConfig.addresses : await addressesConfigUSDTieredSTO(funding.raiseType.includes(gbl.constants.FUND_RAISE_TYPES.STABLE));
  let tiers = useConfigFile ? stoConfig.tiers : tiersConfigUSDTieredSTO(funding.raiseType.includes(gbl.constants.FUND_RAISE_TYPES.POLY));
  let limits = useConfigFile ? stoConfig.limits : limitsConfigUSDTieredSTO();
  let times = timesConfig(stoConfig);

  let usdTieredSTOABI = abis.usdTieredSTO();
  let configureFunction = usdTieredSTOABI.find(o => o.name === 'configure' && o.type === 'function');
  let bytesSTO = web3.eth.abi.encodeFunctionCall(configureFunction,
    [times.startTime,
    times.endTime,
    tiers.ratePerTier.map(r => web3.utils.toWei(r.toString())),
    tiers.ratePerTierDiscountPoly.map(rd => web3.utils.toWei(rd.toString())),
    tiers.tokensPerTier.map(t => web3.utils.toWei(t.toString())),
    tiers.tokensPerTierDiscountPoly.map(td => web3.utils.toWei(td.toString())),
    web3.utils.toWei(limits.nonAccreditedLimitUSD.toString()),
    web3.utils.toWei(limits.minimumInvestmentUSD.toString()),
    funding.raiseType,
    addresses.wallet,
    addresses.reserveWallet,
    addresses.usdToken]
  );

  let addModuleAction = securityToken.methods.addModule(usdTieredSTOFactoryAddress, bytesSTO, stoFee, 0);
  let receipt = await common.sendTransaction(addModuleAction);
  let event = common.getEventFromLogs(securityToken._jsonInterface, receipt.logs, 'ModuleAdded');
  console.log(`STO deployed at address: ${event._module}`);

  let usdTieredSTO = new web3.eth.Contract(usdTieredSTOABI, event._module);
  usdTieredSTO.setProvider(web3.currentProvider);

  return usdTieredSTO;
}

async function usdTieredSTO_status(currentSTO) {
  let displayStartTime = await currentSTO.methods.startTime().call();
  let displayEndTime = await currentSTO.methods.endTime().call();
  let displayCurrentTier = parseInt(await currentSTO.methods.currentTier().call()) + 1;
  let test = await currentSTO.methods.nonAccreditedLimitUSD().call();
  let displayNonAccreditedLimitUSD = web3.utils.fromWei(await currentSTO.methods.nonAccreditedLimitUSD().call());
  let displayMinimumInvestmentUSD = web3.utils.fromWei(await currentSTO.methods.minimumInvestmentUSD().call());
  let displayWallet = await currentSTO.methods.wallet().call();
  let displayReserveWallet = await currentSTO.methods.reserveWallet().call();
  let displayTokensSold = web3.utils.fromWei(await currentSTO.methods.getTokensSold().call());
  let displayInvestorCount = await currentSTO.methods.investorCount().call();
  let displayIsFinalized = await currentSTO.methods.isFinalized().call() ? "YES" : "NO";
  let displayTokenSymbol = await securityToken.methods.symbol().call();
  let tiersLength = await currentSTO.methods.getNumberOfTiers().call();
  let listOfStableCoins = await currentSTO.methods.getUsdTokens().call();
  let raiseTypes = [];
  let stableSymbols = [];

  for (const fundType in gbl.constants.FUND_RAISE_TYPES) {
    if (await currentSTO.methods.fundRaiseTypes(gbl.constants.FUND_RAISE_TYPES[fundType]).call()) {
      if (fundType == STABLE) {
        stableSymbols = await processAddress(listOfStableCoins)
      }
      raiseTypes.push(fundType);
    }
  }

  let displayTiers = "";
  let displayMintedPerTier = "";
  for (let t = 0; t < tiersLength; t++) {
    let tier = await currentSTO.methods.tiers(t).call();
    let ratePerTier = tier.rate;
    let tokensPerTierTotal = tier.tokenTotal;
    let mintedPerTierTotal = tier.mintedTotal;
    let mintedPerTierPerRaiseType = await currentSTO.methods.getTokensMintedByTier(t).call();

    let displayMintedPerTierPerType = "";
    let displayDiscountTokens = "";
    for (const type of raiseTypes) {
      let displayDiscountMinted = "";
      let tokensPerTierDiscountPoly = tier.tokensDiscountPoly;
      if (tokensPerTierDiscountPoly > 0) {
        let ratePerTierDiscountPoly = tier.rateDiscountPoly;
        let mintedPerTierDiscountPoly = tier.mintedDiscountPoly;
        displayDiscountTokens = `
      Tokens at discounted rate: ${web3.utils.fromWei(tokensPerTierDiscountPoly)} ${displayTokenSymbol}
      Discounted rate:           ${web3.utils.fromWei(ratePerTierDiscountPoly, 'ether')} USD per Token`;

        displayDiscountMinted = `(${web3.utils.fromWei(mintedPerTierDiscountPoly)} ${displayTokenSymbol} at discounted rate)`;
      }

      let mintedPerTier = mintedPerTierPerRaiseType[gbl.constants.FUND_RAISE_TYPES[type]];
      if ((type == STABLE) && (stableSymbols.length)) {
        displayMintedPerTierPerType += `
        Sold for stable coin(s): ${web3.utils.fromWei(mintedPerTier)} ${displayTokenSymbol} ${displayDiscountMinted}`;
      } else {
        displayMintedPerTierPerType += `
        Sold for ${type}:\t\t ${web3.utils.fromWei(mintedPerTier)} ${displayTokenSymbol} ${displayDiscountMinted}`;
      }
    }

    displayTiers += `
  - Tier ${t + 1}:
      Tokens:                    ${web3.utils.fromWei(tokensPerTierTotal)} ${displayTokenSymbol}
      Rate:                      ${web3.utils.fromWei(ratePerTier)} USD per Token`
      + displayDiscountTokens;

    displayMintedPerTier += `
  - Tokens minted in Tier ${t + 1}:     ${web3.utils.fromWei(mintedPerTierTotal)} ${displayTokenSymbol}`
      + displayMintedPerTierPerType;
  }

  let displayFundsRaisedUSD = web3.utils.fromWei(await currentSTO.methods.fundsRaisedUSD().call());

  let displayWalletBalancePerType = '';
  let displayReserveWalletBalancePerType = '';
  let displayFundsRaisedPerType = '';
  let displayTokensSoldPerType = '';
  for (const type of raiseTypes) {
    let balance = await getBalance(displayWallet, gbl.constants.FUND_RAISE_TYPES[type]);
    let walletBalance = web3.utils.fromWei(balance);
    if ((type == STABLE) && (stableSymbols.length)) {
      stableSymbols.forEach(async (stable) => {
        let raised = await checkStableBalance(displayWallet, stable.address);
        displayWalletBalancePerType += `
      Balance ${stable.symbol}:\t\t ${web3.utils.fromWei(raised)} ${stable.symbol}`;
      })
    } else {
      let walletBalanceUSD = web3.utils.fromWei(await currentSTO.methods.convertToUSD(gbl.constants.FUND_RAISE_TYPES[type], balance).call());
      displayWalletBalancePerType += `
      Balance ${type}:\t\t ${walletBalance} ${type} (${walletBalanceUSD} USD)`;
    }

    balance = await getBalance(displayReserveWallet, gbl.constants.FUND_RAISE_TYPES[type]);
    let reserveWalletBalance = web3.utils.fromWei(balance);
    let reserveWalletBalanceUSD = web3.utils.fromWei(await currentSTO.methods.convertToUSD(gbl.constants.FUND_RAISE_TYPES[type], balance).call());
    if ((type == STABLE) && (stableSymbols.length)) {
      stableSymbols.forEach(async (stable) => {
        let raised = await checkStableBalance(displayReserveWallet, stable.address);
        displayReserveWalletBalancePerType += `
      Balance ${stable.symbol}:\t\t ${web3.utils.fromWei(raised)} ${stable.symbol}`;
      })
    } else {
      displayReserveWalletBalancePerType += `
      Balance ${type}:\t\t ${reserveWalletBalance} ${type} (${reserveWalletBalanceUSD} USD)`;
    }

    let fundsRaised = web3.utils.fromWei(await currentSTO.methods.fundsRaised(gbl.constants.FUND_RAISE_TYPES[type]).call());
    if ((type == STABLE) && (stableSymbols.length)) {
      stableSymbols.forEach(async (stable) => {
        let raised = await getStableCoinsRaised(currentSTO, stable.address);
        displayFundsRaisedPerType += `
      ${stable.symbol}:\t\t\t ${web3.utils.fromWei(raised)} ${stable.symbol}`;
      })
    } else {
      displayFundsRaisedPerType += `
      ${type}:\t\t\t ${fundsRaised} ${type}`;
    }

    //Only show sold for if more than one raise type are allowed
    if (raiseTypes.length > 1) {
      let tokensSoldPerType = web3.utils.fromWei(await currentSTO.methods.getTokensSoldFor(gbl.constants.FUND_RAISE_TYPES[type]).call());
      if ((type == STABLE) && (stableSymbols.length)) {
        displayTokensSoldPerType += `
        Sold for stable coin(s): ${tokensSoldPerType} ${displayTokenSymbol}`;
      } else {
        displayTokensSoldPerType += `
        Sold for ${type}:\t\t ${tokensSoldPerType} ${displayTokenSymbol}`;
      }
    }
  }

  let displayRaiseType = raiseTypes.join(' - ');
  //If STO has stable coins, we list them one by one
  if (stableSymbols.length) {
    displayRaiseType = displayRaiseType.replace(STABLE, "") + `${stableSymbols.map((obj) => { return obj.symbol }).toString().replace(`,`, ` - `)}`
  }

  let now = Math.floor(Date.now() / 1000);
  let timeTitle;
  let timeRemaining;
  if (now < displayStartTime) {
    timeTitle = "STO starts in: ";
    timeRemaining = displayStartTime - now;
  } else {
    timeTitle = "Time remaining:";
    timeRemaining = displayEndTime - now;
  }

  timeRemaining = common.convertToDaysRemaining(timeRemaining);

  console.log(`
  ******************************* STO INFORMATION ********************************
  - Address:                     ${currentSTO.options.address}
  - Start Time:                  ${new Date(displayStartTime * 1000)}
  - End Time:                    ${new Date(displayEndTime * 1000)}
  - Raise Type:                  ${displayRaiseType}
  - Tiers:                       ${tiersLength}`
    + displayTiers + `
  - Minimum Investment:          ${displayMinimumInvestmentUSD} USD
  - Non Accredited Limit:        ${displayNonAccreditedLimitUSD} USD
  - Wallet:                      ${displayWallet}`
    + displayWalletBalancePerType + `
  - Reserve Wallet:              ${displayReserveWallet}`
    + displayReserveWalletBalancePerType + `

  --------------------------------------------------------------------------------
  - ${timeTitle}              ${timeRemaining}
  - Is Finalized:                ${displayIsFinalized}
  - Tokens Sold:                 ${displayTokensSold} ${displayTokenSymbol}`
    + displayTokensSoldPerType + `
  - Current Tier:                ${displayCurrentTier}`
    + displayMintedPerTier + `
  - Investor count:              ${displayInvestorCount}
  - Funds Raised`
    + displayFundsRaisedPerType + `
      Total USD:                 ${displayFundsRaisedUSD} USD
  `);
}

async function checkStableBalance(walletAddress, stableAddress) {
  let stableCoin = common.connect(abis.erc20(), stableAddress);
  try {
    return await stableCoin.methods.balanceOf(walletAddress).call();
  } catch (e) {
    return ""
  }
}

async function getStableCoinsRaised(currentSTO, address) {
  return await currentSTO.methods.stableCoinsRaised(address).call()
}

async function usdTieredSTO_configure(currentSTO) {
  console.log(chalk.blue('STO Configuration - USD Tiered STO'));

  let isFinalized = await currentSTO.methods.isFinalized().call();
  if (isFinalized) {
    console.log(chalk.red(`STO is finalized`));
  } else {
    let options = [];
    options.push('Finalize STO',
      'Change accredited account', 'Change accredited in batch',
      'Change non accredited limit for an account', 'Change non accredited limits in batch');

    // If STO is not started, you can modify configuration
    let now = Math.floor(Date.now() / 1000);
    let startTime = await currentSTO.methods.startTime().call.call();
    if (now < startTime) {
      options.push('Modify times configuration', 'Modify tiers configuration', 'Modify addresses configuration',
        'Modify limits configuration', 'Modify funding configuration');
    }

    let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'RETURN' });
    let selected = index != -1 ? options[index] : 'EXIT';
    switch (selected) {
      case 'Finalize STO':
        let reserveWallet = await currentSTO.methods.reserveWallet().call();
        let isVerified = await securityToken.methods.verifyTransfer(gbl.constants.ADDRESS_ZERO, reserveWallet, 0, web3.utils.fromAscii("")).call();
        if (isVerified) {
          if (readlineSync.keyInYNStrict()) {
            let finalizeAction = currentSTO.methods.finalize();
            await common.sendTransaction(finalizeAction);
          }
        } else {
          console.log(chalk.red(`Reserve wallet (${reserveWallet}) is not able to receive remaining tokens. Check if this address is whitelisted.`));
        }
        break;
      case 'Change accredited account':
        let investor = readlineSync.question('Enter the address to change accreditation: ');
        let isAccredited = readlineSync.keyInYNStrict(`Is ${investor} accredited?`);
        let investors = [investor];
        let accredited = [isAccredited];
        let changeAccreditedAction = currentSTO.methods.changeAccredited(investors, accredited);
        // 2 GAS?
        await common.sendTransaction(changeAccreditedAction);
        break;
      case 'Change accredited in batch':
        await changeAccreditedInBatch(currentSTO);
        break;
      case 'Change non accredited limit for an account':
        let account = readlineSync.question('Enter the address to change non accredited limit: ');
        let limit = readlineSync.question(`Enter the limit in USD: `);
        let accounts = [account];
        let limits = [web3.utils.toWei(limit)];
        let changeNonAccreditedLimitAction = currentSTO.methods.changeNonAccreditedLimit(accounts, limits);
        await common.sendTransaction(changeNonAccreditedLimitAction);
        break;
      case 'Change non accredited limits in batch':
        await changeNonAccreditedLimitsInBatch(currentSTO);
        break;
      case 'Modify times configuration':
        await modfifyTimes(currentSTO);
        await usdTieredSTO_status(currentSTO);
        break;
      case 'Modify tiers configuration':
        await modfifyTiers(currentSTO);
        await usdTieredSTO_status(currentSTO);
        break;
      case 'Modify addresses configuration':
        await modfifyAddresses(currentSTO);
        await usdTieredSTO_status(currentSTO);
        break;
      case 'Modify limits configuration':
        await modfifyLimits(currentSTO);
        await usdTieredSTO_status(currentSTO);
        break;
      case 'Modify funding configuration':
        await modfifyFunding(currentSTO);
        await usdTieredSTO_status(currentSTO);
        break;
    }
  }
}

async function showAccreditedData(currentSTO) {
  let accreditedData = await currentSTO.methods.getAccreditedData().call();
  let investorArray = accreditedData[0];
  let accreditedArray = accreditedData[1];
  let nonAccreditedLimitArray = accreditedData[2];

  if (investorArray.length > 0) {
    let dataTable = [['Investor', 'Is accredited', 'Non-accredited limit (USD)']];
    for (let i = 0; i < investorArray.length; i++) {
      dataTable.push([
        investorArray[i],
        accreditedArray[i] ? 'YES' : 'NO',
        accreditedArray[i] ? 'N/A' : (nonAccreditedLimitArray[i] !== '0' ? web3.utils.fromWei(nonAccreditedLimitArray[i]) : 'default')
      ]);
    }
    console.log();
    console.log(`******************************** ACCREDITED DATA ************************************`);
    console.log();
    console.log(table(dataTable));
  } else {
    console.log();
    console.log(chalk.yellow(`There is no accredited data to show`));
    console.log();
  }

}

async function changeAccreditedInBatch(currentSTO) {
  let csvFilePath = readlineSync.question(`Enter the path for csv data file (${ACCREDIT_DATA_CSV}): `, {
    defaultInput: ACCREDIT_DATA_CSV
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
  let [investorArray, isAccreditedArray] = common.transposeBatches(batches);
  for (let batch = 0; batch < batches.length; batch++) {
    console.log(`Batch ${batch + 1} - Attempting to change accredited accounts:\n\n`, investorArray[batch], '\n');
    let action = currentSTO.methods.changeAccredited(investorArray[batch], isAccreditedArray[batch]);
    let receipt = await common.sendTransaction(action);
    console.log(chalk.green('Change accredited transaction was successful.'));
    console.log(`${receipt.gasUsed} gas used. Spent: ${web3.utils.fromWei((new web3.utils.BN(receipt.gasUsed)).mul(new web3.utils.BN(defaultGasPrice)))} ETH`);
  }
}

async function changeNonAccreditedLimitsInBatch(currentSTO) {
  let csvFilePath = readlineSync.question(`Enter the path for csv data file (${NON_ACCREDIT_LIMIT_DATA_CSV}): `, {
    defaultInput: NON_ACCREDIT_LIMIT_DATA_CSV
  });
  let batchSize = readlineSync.question(`Enter the max number of records per transaction or batch size (${gbl.constants.DEFAULT_BATCH_SIZE}): `, {
    limit: function (input) {
      return parseInt(input) > 0;
    },
    limitMessage: 'Must be greater than 0',
    defaultInput: gbl.constants.DEFAULT_BATCH_SIZE
  });
  let parsedData = csvParse(csvFilePath);
  let validData = parsedData.filter(row => web3.utils.isAddress(row[0]) && !isNaN(row[1]));
  let invalidRows = parsedData.filter(row => !validData.includes(row));
  if (invalidRows.length > 0) {
    console.log(chalk.red(`The following lines from csv file are not valid: ${invalidRows.map(r => parsedData.indexOf(r) + 1).join(',')}`));
  }
  let batches = common.splitIntoBatches(validData, batchSize);
  let [investorArray, limitArray] = common.transposeBatches(batches);
  for (let batch = 0; batch < batches.length; batch++) {
    limitArray[batch] = limitArray[batch].map(a => web3.utils.toWei(new web3.utils.BN(a)));
    console.log(`Batch ${batch + 1} - Attempting to change non accredited limit to accounts:\n\n`, investorArray[batch], '\n');
    let action = currentSTO.methods.changeNonAccreditedLimit(investorArray[batch], limitArray[batch]);
    let receipt = await common.sendTransaction(action);
    console.log(chalk.green('Change non accredited limits transaction was successful.'));
    console.log(`${receipt.gasUsed} gas used. Spent: ${web3.utils.fromWei((new web3.utils.BN(receipt.gasUsed)).mul(new web3.utils.BN(defaultGasPrice)))} ETH`);
  }
}

async function modfifyTimes(currentSTO) {
  let times = timesConfig();
  let modifyTimesAction = currentSTO.methods.modifyTimes(times.startTime, times.endTime);
  await common.sendTransaction(modifyTimesAction);
}

async function modfifyLimits(currentSTO) {
  let limits = limitsConfigUSDTieredSTO();
  let modifyLimitsAction = currentSTO.methods.modifyLimits(limits.nonAccreditedLimitUSD, limits.minimumInvestmentUSD);
  await common.sendTransaction(modifyLimitsAction);
}

async function modfifyFunding(currentSTO) {
  let funding = fundingConfigUSDTieredSTO();
  let modifyFundingAction = currentSTO.methods.modifyFunding(funding.raiseType);
  await common.sendTransaction(modifyFundingAction);
}

async function modfifyAddresses(currentSTO) {
  let addresses = await addressesConfigUSDTieredSTO(await currentSTO.methods.fundRaiseTypes(gbl.constants.FUND_RAISE_TYPES.STABLE).call());
  let modifyAddressesAction = currentSTO.methods.modifyAddresses(addresses.wallet, addresses.reserveWallet, addresses.usdToken);
  await common.sendTransaction(modifyAddressesAction);
}

async function modfifyTiers(currentSTO) {
  let tiers = tiersConfigUSDTieredSTO(await currentSTO.methods.fundRaiseTypes(gbl.constants.FUND_RAISE_TYPES.POLY).call());
  let modifyTiersAction = currentSTO.methods.modifyTiers(
    tiers.ratePerTier,
    tiers.ratePerTierDiscountPoly,
    tiers.tokensPerTier,
    tiers.tokensPerTierDiscountPoly,
  );
  await common.sendTransaction(modifyTiersAction);
}

//////////////////////
// HELPER FUNCTIONS //
//////////////////////
async function getBalance(from, type) {
  switch (type) {
    case gbl.constants.FUND_RAISE_TYPES.ETH:
      return await web3.eth.getBalance(from);
    case gbl.constants.FUND_RAISE_TYPES.POLY:
      return await polyToken.methods.balanceOf(from).call();
    case gbl.constants.FUND_RAISE_TYPES.STABLE:
      return await usdToken.methods.balanceOf(from).call();
  }
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
  let securityTokenAddress = await strGetter.methods.getSecurityTokenAddress(tokenSymbol).call();
  if (securityTokenAddress == gbl.constants.ADDRESS_ZERO) {
    console.log(chalk.red(`Selected Security Token ${tokenSymbol} does not exist.`));
    process.exit(0);
  }
  let securityTokenABI = abis.securityToken();
  securityToken = new web3.eth.Contract(securityTokenABI, securityTokenAddress);
  securityToken.setProvider(web3.currentProvider);
}

function welcome() {
  common.logAsciiBull();
  console.log("****************************************");
  console.log("Welcome to the Command-Line STO Manager.");
  console.log("****************************************");
  console.log("The following script will allow you to manage STOs modules.");
  console.log("Issuer Account: " + Issuer.address + "\n");
}

async function setup() {
  try {
    let securityTokenRegistryAddress = await contracts.securityTokenRegistry();
    let strGetterABI = abis.strGetter();
    strGetter = new web3.eth.Contract(strGetterABI, securityTokenRegistryAddress);
    strGetter.setProvider(web3.currentProvider);

    let moduleRegistryAddress = await contracts.moduleRegistry();
    let moduleRegistryABI = abis.moduleRegistry();
    moduleRegistry = new web3.eth.Contract(moduleRegistryABI, moduleRegistryAddress);
    moduleRegistry.setProvider(web3.currentProvider);

    let polytokenAddress = await contracts.polyToken();
    let polytokenABI = abis.polyToken();
    polyToken = new web3.eth.Contract(polytokenABI, polytokenAddress);
    polyToken.setProvider(web3.currentProvider);

    //TODO: Use proper DAI token here
    let usdTokenAddress = await contracts.usdToken();
    usdToken = new web3.eth.Contract(polytokenABI, usdTokenAddress);
    usdToken.setProvider(web3.currentProvider);
  } catch (err) {
    console.log(err)
    console.log('\x1b[31m%s\x1b[0m', "There was a problem getting the contracts. Make sure they are deployed to the selected network.");
    process.exit(0);
  }
}

async function selectToken() {
  let result = null;

  let userTokens = await strGetter.methods.getTokensByOwner(Issuer.address).call();
  let tokenDataArray = await Promise.all(userTokens.map(async function (t) {
    let tokenData = await strGetter.methods.getSecurityTokenData(t).call();
    return { symbol: tokenData[0], address: t };
  }));
  let options = tokenDataArray.map(function (t) {
    return `${t.symbol} - Deployed at ${t.address}`;
  });
  options.push('Enter token symbol manually');

  let index = readlineSync.keyInSelect(options, 'Select a token:', { cancel: 'EXIT' });
  let selected = index != -1 ? options[index] : 'EXIT';
  switch (selected) {
    case 'Enter token symbol manually':
      result = readlineSync.question('Enter the token symbol: ');
      break;
    case 'EXIT':
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
  addSTOModule: async function (_tokenSymbol, stoConfig) {
    await initialize(_tokenSymbol);
    return addSTOModule(stoConfig)
  }
}
