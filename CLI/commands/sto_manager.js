const readlineSync = require('readline-sync');
const chalk = require('chalk');
const contracts = require('./helpers/contract_addresses');
const abis = require('./helpers/contract_abis');
const common = require('./common/common_functions');
const gbl = require('./common/global');
const csvParse = require('./helpers/csv');
const input = require('./IO/input');
const { table } = require('table');
const STABLE = 'STABLE';

// Constants
const ACCREDIT_DATA_CSV = `${__dirname}/../data/STO/USDTieredSTO/accredited_data.csv`;
const NON_ACCREDIT_LIMIT_DATA_CSV = `${__dirname}/../data/STO/USDTieredSTO/nonAccreditedLimits_data.csv`;

// Crowdsale params
let tokenSymbol;

// Artifacts
let securityTokenRegistry;
let moduleRegistry;
let polyToken;
let securityToken;

async function executeApp () {
  let exit = false;
  while (!exit) {
    console.log('\n', chalk.blue('STO Manager - Main Menu'), '\n');

    // Show non-archived attached STO modules
    let stoModules = await common.getAllModulesByType(securityToken, gbl.constants.MODULES_TYPES.STO);
    let nonArchivedModules = stoModules.filter(m => !m.archived);
    if (nonArchivedModules.length > 0) {
      console.log(`STO modules attached:`);
      nonArchivedModules.map(m => `${m.label}: ${m.name} (${m.version}) at ${m.address}`);
    } else {
      console.log(`There are no STO modules attached`);
    }

    let options = [];
    if (nonArchivedModules.length > 0) {
      options.push('Show existing STO information', 'Modify existing STO');
    }
    options.push('Add new STO module');

    let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'EXIT' });
    let optionSelected = index !== -1 ? options[index] : 'EXIT';
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

function selectExistingSTO (stoModules, showPaused) {
  let filteredModules = stoModules;
  if (!showPaused) {
    filteredModules = stoModules.filter(m => !m.paused);
  }
  let options = filteredModules.map(m => `${m.label}: ${m.name} (${m.version}) at ${m.address}`);
  let index = readlineSync.keyInSelect(options, 'Select a module: ', { cancel: false });
  console.log('Selected:', options[index], '\n');
  let selectedName = filteredModules[index].name;
  let stoABI;
  switch (selectedName) {
    case 'CappedSTO':
      stoABI = abis.cappedSTO();
      break;
    case 'USDTieredSTO':
      stoABI = abis.usdTieredSTO();
      break;
  }

  let stoModule = new web3.eth.Contract(stoABI, filteredModules[index].address);
  return { name: selectedName, module: stoModule };
}

async function showSTO (selectedSTO, currentSTO) {
  switch (selectedSTO) {
    case 'CappedSTO':
      await cappedSTO_status(currentSTO);
      break;
    case 'USDTieredSTO':
      await usdTieredSTO_status(currentSTO);
      await showAccreditedData(currentSTO);
      break;
  }
}

async function modifySTO (selectedSTO, currentSTO) {
  switch (selectedSTO) {
    case 'CappedSTO':
      console.log(chalk.red(`
    *********************************
    This option is not yet available.
    *********************************`));
      break;
    case 'USDTieredSTO':
      await usdTieredSTO_configure(currentSTO);
      break;
  }
}

async function addSTOModule (stoConfig) {
  console.log(chalk.blue('Launch STO - Configuration'));

  let factorySelected;
  let optionSelected;
  if (typeof stoConfig === 'undefined') {
    let moduleList = await common.getAvailableModules(moduleRegistry, gbl.constants.MODULES_TYPES.STO, securityToken.options.address);
    let options = moduleList.map(m => `${m.name} - ${m.version} (${m.factoryAddress})`);

    let index = readlineSync.keyInSelect(options, 'What type of STO do you want?', { cancel: 'RETURN' });
    optionSelected = index !== -1 ? moduleList[index].name : 'RETURN';
    factorySelected = moduleList[index].factoryAddress;
  } else {
    optionSelected = stoConfig.type;
    factorySelected = await await contracts.getModuleFactoryAddressByName(securityToken.options.address, gbl.constants.MODULES_TYPES.STO, optionSelected);
  }
  console.log('Selected:', optionSelected, '\n');
  switch (optionSelected) {
    case 'CappedSTO':
      let cappedSTO = await cappedSTO_launch(factorySelected, stoConfig);
      await cappedSTO_status(cappedSTO);
      break;
    case 'USDTieredSTO':
      let usdTieredSTO = await usdTieredSTO_launch(factorySelected, stoConfig);
      await usdTieredSTO_status(usdTieredSTO);
      break;
  }
}

// Capped STO //
async function cappedSTO_launch (factoryAddress, stoConfig) {
  console.log(chalk.blue('Launch STO - Capped STO in No. of Tokens'));

  const cappedSTOABI = abis.cappedSTO();
  const moduleAddress = await common.addModule(securityToken, polyToken, factoryAddress, cappedSTOABI, getCappedSTOIntializeData, stoConfig);
  let cappedSTO = new web3.eth.Contract(cappedSTOABI, moduleAddress);
  cappedSTO.setProvider(web3.currentProvider);

  return cappedSTO;
}

function getCappedSTOIntializeData (moduleABI, stoConfig) {
  let oneMinuteFromNow = new web3.utils.BN((Math.floor(Date.now() / 1000) + 60));
  let oneMonthFromNow = new web3.utils.BN((Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)));
  let cappedSTOconfig = {};
  let useConfigFile = typeof stoConfig !== 'undefined';
  if (!useConfigFile) {
    cappedSTOconfig.cap = readlineSync.question('How many tokens do you plan to sell on the STO? (500.000): ');
    if (cappedSTOconfig.cap === "") {
      cappedSTOconfig.cap = 500000;
    }
    cappedSTOconfig.raiseType = readlineSync.question('Enter' + chalk.green(` P `) + 'for POLY raise or leave empty for Ether raise (E): ');
    if (cappedSTOconfig.raiseType.toUpperCase() === 'P') {
      cappedSTOconfig.raiseType = [gbl.constants.FUND_RAISE_TYPES.POLY];
    } else {
      cappedSTOconfig.raiseType = [gbl.constants.FUND_RAISE_TYPES.ETH];
    }
    cappedSTOconfig.rate = readlineSync.question(`Enter the rate (1 ${cappedSTOconfig.raiseType === gbl.constants.FUND_RAISE_TYPES.POLY ? 'POLY' : 'ETH'} = X ${tokenSymbol}) for the STO (1000): `);
    if (cappedSTOconfig.rate === "") {
      cappedSTOconfig.rate = 1000;
    }
    cappedSTOconfig.wallet = readlineSync.question('Enter the address that will receive the funds from the STO (' + Issuer.address + '): ');
    if (cappedSTOconfig.wallet === "") {
      cappedSTOconfig.wallet = Issuer.address;
    }
    cappedSTOconfig.startTime = readlineSync.question('Enter the start time for the STO (Unix Epoch time)\n(1 minutes from now = ' + oneMinuteFromNow + ' ): ');
    cappedSTOconfig.endTime = readlineSync.question('Enter the end time for the STO (Unix Epoch time)\n(1 month from now = ' + oneMonthFromNow + ' ): ');
  } else {
    cappedSTOconfig = stoConfig;
  }
  if (cappedSTOconfig.startTime === "") {
    cappedSTOconfig.startTime = oneMinuteFromNow;
  }
  if (cappedSTOconfig.endTime === "") {
    cappedSTOconfig.endTime = oneMonthFromNow;
  }
  let configureFunction = moduleABI.find(o => o.name === 'configure' && o.type === 'function');
  let bytes = web3.eth.abi.encodeFunctionCall(configureFunction,
  [
    cappedSTOconfig.startTime,
    cappedSTOconfig.endTime,
    web3.utils.toWei(cappedSTOconfig.cap.toString()),
    web3.utils.toWei(cappedSTOconfig.rate.toString()),
    cappedSTOconfig.raiseType,
    cappedSTOconfig.wallet
  ]);

  return bytes;
}

async function cappedSTO_status (currentSTO) {
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
  *************** STO Information ***************
  - Address:           ${currentSTO.options.address}
  - Raise Cap:         ${web3.utils.fromWei(displayCap)} ${displayTokenSymbol.toUpperCase()}
  - Start Time:        ${new Date(displayStartTime * 1000)}
  - End Time:          ${new Date(displayEndTime * 1000)}
  - Raise Type:        ${displayRaiseType}
  - Rate:              1 ${displayRaiseType} = ${web3.utils.fromWei(displayRate)} ${displayTokenSymbol.toUpperCase()}
  - Wallet:            ${displayWallet}
  - Wallet Balance:    ${displayWalletBalance} ${displayRaiseType}
  -----------------------------------------------
  - ${timeTitle}    ${timeRemaining}
  - Funds raised:      ${web3.utils.fromWei(displayFundsRaised)} ${displayRaiseType}
  - Tokens sold:       ${web3.utils.fromWei(displayTokensSold)} ${displayTokenSymbol.toUpperCase()}
  - Tokens remaining:  ${web3.utils.fromWei(displayCap.sub(displayTokensSold))} ${displayTokenSymbol.toUpperCase()}
  - Investor count:    ${displayInvestorCount}
  `);
}

// USD Tiered STO //
function fundingConfigUSDTieredSTO () {
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
  if (funding.raiseType.length === 0) {
    funding.raiseType = [gbl.constants.FUND_RAISE_TYPES.ETH, gbl.constants.FUND_RAISE_TYPES.POLY, gbl.constants.FUND_RAISE_TYPES.STABLE];
  }

  return funding;
}

async function addressesConfigUSDTieredSTO (usdTokenRaise) {
  let addresses, menu;
  do {
    addresses = {};

    addresses.wallet = input.readAddress('Enter the address that will receive the funds from the STO (' + Issuer.address + '): ', Issuer.address);
    if (addresses.wallet === "") addresses.wallet = Issuer.address;

    addresses.treasuryWallet = input.readAddress('Enter the address that will receive remaining tokens in the case the cap is not met (' + Issuer.address + '): ', Issuer.address);
    if (addresses.treasuryWallet === "") addresses.treasuryWallet = Issuer.address;

    let listOfAddress;

    if (usdTokenRaise) {
      addresses.usdToken = input.readMultipleAddresses('Enter the address (or multiple addresses separated by commas) of the USD stable coin(s): ');
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

async function checkSymbol (address) {
  let stableCoin = common.connect(abis.erc20(), address);
  try {
    return await stableCoin.methods.symbol().call();
  } catch (e) {
    return ""
  }
}

async function processArray (array) {
  let result = true;
  for (const address of array) {
    let symbol = await checkSymbol(address);
    if (symbol === "") {
      result = false;
      console.log(`${address} seems not to be a stable coin`)
    }
  }
  return result
}

async function processAddress (array) {
  let list = [];
  for (const address of array) {
    let symbol = await checkSymbol(address);
    list.push({ "symbol": symbol, "address": address })
  }
  return list
}

function tiersConfigUSDTieredSTO (polyRaise) {
  let tiers = {};

  let defaultTiers = 3;
  tiers.tiers = parseInt(input.readNumberGreaterThan(0, `Enter the number of tiers for the STO? (${defaultTiers}): `, defaultTiers));

  let defaultTokensPerTier = [190000000, 100000000, 200000000];
  let defaultRatePerTier = ['0.05', '0.10', '0.15'];
  let defaultTokensPerTierDiscountPoly = [90000000, 50000000, 100000000];
  let defaultRatePerTierDiscountPoly = ['0.025', '0.05', '0.075'];
  tiers.tokensPerTier = [];
  tiers.ratePerTier = [];
  tiers.tokensPerTierDiscountPoly = [];
  tiers.ratePerTierDiscountPoly = [];
  for (let i = 0; i < tiers.tiers; i++) {
    tiers.tokensPerTier[i] = input.readNumberGreaterThan(0, `How many tokens do you plan to sell on tier No. ${i + 1}? (${defaultTokensPerTier[i]}): `, defaultTokensPerTier[i]);

    tiers.ratePerTier[i] = input.readNumberGreaterThan(0, `What is the USD per token rate for tier No. ${i + 1}? (${defaultRatePerTier[i]}): `, defaultRatePerTier[i]);

    if (polyRaise && readlineSync.keyInYNStrict(`Do you plan to have a discounted rate for POLY investments for tier No. ${i + 1}? `)) {
      tiers.tokensPerTierDiscountPoly[i] = input.readNumberLessThan(parseFloat(tiers.tokensPerTier[i]), `How many of those tokens do you plan to sell at discounted rate on tier No. ${i + 1}? (${defaultTokensPerTierDiscountPoly[i]}): `, defaultTokensPerTierDiscountPoly[i]);
      tiers.ratePerTierDiscountPoly[i] = input.readNumberLessThan(parseFloat(tiers.ratePerTier[i]), `What is the discounted rate for tier No. ${i + 1}? (${defaultRatePerTierDiscountPoly[i]}): `, defaultRatePerTierDiscountPoly[i]);
    } else {
      tiers.tokensPerTierDiscountPoly[i] = 0;
      tiers.ratePerTierDiscountPoly[i] = 0;
    }
  }

  return tiers;
}

function limitsConfigUSDTieredSTO () {
  let limits = {};

  let defaultMinimumInvestment = 5;
  limits.minimumInvestmentUSD = input.readNumberGreaterThan(0, `What is the minimum investment in USD? (${defaultMinimumInvestment}): `, defaultMinimumInvestment);

  let nonAccreditedLimit = 2500;
  limits.nonAccreditedLimitUSD = input.readNumberGreaterThanOrEqual(parseFloat(limits.minimumInvestmentUSD), `What is the default limit for non accredited investors in USD? (${nonAccreditedLimit}): `, nonAccreditedLimit);

  return limits;
}

function timesConfigUSDTieredSTO (stoConfig) {
  let times = {};

  let oneMinuteFromNow = Math.floor(Date.now() / 1000) + 60;
  if (typeof stoConfig === 'undefined') {
    times.startTime = parseInt(input.readNumberGreaterThan(Math.floor(Date.now() / 1000), 'Enter the start time for the STO (Unix Epoch time)\n(1 minutes from now = ' + oneMinuteFromNow + ' ): ', oneMinuteFromNow));
  } else {
    times.startTime = stoConfig.times.startTime;
  }
  if (times.startTime === "") times.startTime = oneMinuteFromNow;

  let oneMonthFromNow = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
  if (typeof stoConfig === 'undefined') {
    times.endTime = parseInt(input.readNumberGreaterThan(times.startTime, 'Enter the end time for the STO (Unix Epoch time)\n(1 month from now = ' + oneMonthFromNow + ' ): ', oneMonthFromNow));
  } else {
    times.endTime = stoConfig.times.startTime;
  }
  if (times.endTime === "") times.endTime = oneMonthFromNow;

  return times;
}

async function usdTieredSTO_launch (factoryAddress, stoConfig) {
  console.log(chalk.blue('Launch STO - USD pegged tiered STO'));

  const usdTieredSTOABI = abis.usdTieredSTO();
  const moduleAddress = await common.addModule(securityToken, polyToken, factoryAddress, usdTieredSTOABI, getUSDTieredSTOIntializeData, stoConfig);
  let usdTieredSTO = new web3.eth.Contract(usdTieredSTOABI, moduleAddress);
  usdTieredSTO.setProvider(web3.currentProvider);

  return usdTieredSTO;
}

async function getUSDTieredSTOIntializeData (usdTieredSTOABI, stoConfig) {
  let useConfigFile = typeof stoConfig !== 'undefined';
  let funding = useConfigFile ? stoConfig.funding : fundingConfigUSDTieredSTO();
  let addresses = useConfigFile ? stoConfig.addresses : await addressesConfigUSDTieredSTO(funding.raiseType.includes(gbl.constants.FUND_RAISE_TYPES.STABLE));
  let tiers = useConfigFile ? stoConfig.tiers : tiersConfigUSDTieredSTO(funding.raiseType.includes(gbl.constants.FUND_RAISE_TYPES.POLY));
  let limits = useConfigFile ? stoConfig.limits : limitsConfigUSDTieredSTO();
  let times = timesConfigUSDTieredSTO(stoConfig);
  let configureFunction = usdTieredSTOABI.find(o => o.name === 'configure' && o.type === 'function');
  let bytesSTO = web3.eth.abi.encodeFunctionCall(configureFunction,
    [
      times.startTime,
      times.endTime,
      tiers.ratePerTier.map(r => web3.utils.toWei(r.toString())),
      tiers.ratePerTierDiscountPoly.map(rd => web3.utils.toWei(rd.toString())),
      tiers.tokensPerTier.map(t => web3.utils.toWei(t.toString())),
      tiers.tokensPerTierDiscountPoly.map(td => web3.utils.toWei(td.toString())),
      web3.utils.toWei(limits.nonAccreditedLimitUSD.toString()),
      web3.utils.toWei(limits.minimumInvestmentUSD.toString()),
      funding.raiseType,
      addresses.wallet,
      addresses.treasuryWallet,
      addresses.usdToken
    ]);
  return bytesSTO;
}

async function usdTieredSTO_status (currentSTO) {
  let displayStartTime = await currentSTO.methods.startTime().call();
  let displayEndTime = await currentSTO.methods.endTime().call();
  let displayCurrentTier = parseInt(await currentSTO.methods.currentTier().call()) + 1;
  let test = await currentSTO.methods.nonAccreditedLimitUSD().call();
  let displayNonAccreditedLimitUSD = web3.utils.fromWei(await currentSTO.methods.nonAccreditedLimitUSD().call());
  let displayMinimumInvestmentUSD = web3.utils.fromWei(await currentSTO.methods.minimumInvestmentUSD().call());
  let displayWallet = await currentSTO.methods.wallet().call();
  let displayTreasuryWallet = await currentSTO.methods.treasuryWallet().call();
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
      if (fundType === STABLE) {
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
      if ((type === STABLE) && (stableSymbols.length)) {
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
      Rate:                      ${web3.utils.fromWei(ratePerTier)} USD per Token` + displayDiscountTokens;

    displayMintedPerTier += `
  - Tokens minted in Tier ${t + 1}:     ${web3.utils.fromWei(mintedPerTierTotal)} ${displayTokenSymbol}` + displayMintedPerTierPerType;
  }

  let displayFundsRaisedUSD = web3.utils.fromWei(await currentSTO.methods.fundsRaisedUSD().call());

  let displayWalletBalancePerType = '';
  let displayTreasuryWalletBalancePerType = '';
  let displayFundsRaisedPerType = '';
  let displayTokensSoldPerType = '';
  for (const type of raiseTypes) {
    let balance = await getBalance(displayWallet, gbl.constants.FUND_RAISE_TYPES[type]);
    let walletBalance = web3.utils.fromWei(balance);
    if ((type === STABLE) && (stableSymbols.length)) {
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

    balance = await getBalance(displayTreasuryWallet, gbl.constants.FUND_RAISE_TYPES[type]);
    let treasuryWalletBalance = web3.utils.fromWei(balance);
    let treasuryWalletBalanceUSD = web3.utils.fromWei(await currentSTO.methods.convertToUSD(gbl.constants.FUND_RAISE_TYPES[type], balance).call());
    if ((type === STABLE) && (stableSymbols.length)) {
      stableSymbols.forEach(async (stable) => {
        let raised = await checkStableBalance(displayTreasuryWallet, stable.address);
        displayTreasuryWalletBalancePerType += `
      Balance ${stable.symbol}:\t\t ${web3.utils.fromWei(raised)} ${stable.symbol}`;
      })
    } else {
      displayTreasuryWalletBalancePerType += `
      Balance ${type}:\t\t ${treasuryWalletBalance} ${type} (${treasuryWalletBalanceUSD} USD)`;
    }

    let fundsRaised = web3.utils.fromWei(await currentSTO.methods.fundsRaised(gbl.constants.FUND_RAISE_TYPES[type]).call());
    if ((type === STABLE) && (stableSymbols.length)) {
      stableSymbols.forEach(async (stable) => {
        let raised = await getStableCoinsRaised(currentSTO, stable.address);
        displayFundsRaisedPerType += `
      ${stable.symbol}:\t\t\t ${web3.utils.fromWei(raised)} ${stable.symbol}`;
      })
    } else {
      displayFundsRaisedPerType += `
      ${type}:\t\t\t ${fundsRaised} ${type}`;
    }

    // Only show sold for if more than one raise type are allowed
    if (raiseTypes.length > 1) {
      let tokensSoldPerType = web3.utils.fromWei(await currentSTO.methods.getTokensSoldFor(gbl.constants.FUND_RAISE_TYPES[type]).call());
      if ((type === STABLE) && (stableSymbols.length)) {
        displayTokensSoldPerType += `
        Sold for stable coin(s): ${tokensSoldPerType} ${displayTokenSymbol}`;
      } else {
        displayTokensSoldPerType += `
        Sold for ${type}:\t\t ${tokensSoldPerType} ${displayTokenSymbol}`;
      }
    }
  }

  let displayRaiseType = raiseTypes.join(' - ');
  // If STO has stable coins, we list them one by one
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
  *********************** STO Information ***********************
  - Address:                     ${currentSTO.options.address}
  - Start Time:                  ${new Date(displayStartTime * 1000)}
  - End Time:                    ${new Date(displayEndTime * 1000)}
  - Raise Type:                  ${displayRaiseType}
  - Tiers:                       ${tiersLength}` +
      displayTiers + `
  - Minimum Investment:          ${displayMinimumInvestmentUSD} USD
  - Non Accredited Limit:        ${displayNonAccreditedLimitUSD} USD
  - Wallet:                      ${displayWallet}` +
      displayWalletBalancePerType + `
  - Treasury Wallet:              ${displayTreasuryWallet}` +
      displayTreasuryWalletBalancePerType + `

  ---------------------------------------------------------------
  - ${timeTitle}              ${timeRemaining}
  - Is Finalized:                ${displayIsFinalized}
  - Tokens Sold:                 ${displayTokensSold} ${displayTokenSymbol}` +
      displayTokensSoldPerType + `
  - Current Tier:                ${displayCurrentTier}` +
      displayMintedPerTier + `
  - Investor count:              ${displayInvestorCount}
  - Funds Raised` +
      displayFundsRaisedPerType + `
      Total USD:                 ${displayFundsRaisedUSD} USD
  `);
}

async function checkStableBalance (walletAddress, stableAddress) {
  let stableCoin = common.connect(abis.erc20(), stableAddress);
  try {
    return await stableCoin.methods.balanceOf(walletAddress).call();
  } catch (e) {
    return ""
  }
}

async function getStableCoinsRaised (currentSTO, address) {
  return currentSTO.methods.stableCoinsRaised(address).call();
}

async function usdTieredSTO_configure (currentSTO) {
  console.log(chalk.blue('STO Configuration - USD Tiered STO'));

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
      options.push('Modify times configuration', 'Modify tiers configuration',
        'Modify limits configuration', 'Modify funding configuration');
    }

    options.push('Reclaim ETH or ERC20 token from contract');

    let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'RETURN' });
    let selected = index !== -1 ? options[index] : 'Exit';
    switch (selected) {
      case 'Finalize STO':
        let treasuryWallet = await currentSTO.methods.treasuryWallet().call();
        let isVerified = await securityToken.methods.canTransferFrom('0x0000000000000000000000000000000000000000', treasuryWallet, 0, web3.utils.fromAscii("")).call();
        if (isVerified) {
          if (readlineSync.keyInYNStrict()) {
            let finalizeAction = currentSTO.methods.finalize();
            await common.sendTransaction(finalizeAction);
          }
        } else {
          console.log(chalk.red(`Treasury wallet (${treasuryWallet}) is not able to receive remaining tokens. Check if this address is whitelisted.`));
        }
        break;
      case 'Change accredited account':
        let investor = readlineSync.question('Enter the address to change accreditation: ');
        let isAccredited = readlineSync.keyInYNStrict(`Is ${investor} accredited?`);
        let generalTransferManager = await getGeneralTransferManager();
        let changeAccreditedAction = generalTransferManager.methods.modifyInvestorFlag(investor, 0, isAccredited);
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
      case 'Reclaim ETH or ERC20 token from contract':
        await reclaimFromContract(currentSTO);
        break;
    }
  }
}

async function getGeneralTransferManager () {
  let gmtModules = await securityToken.methods.getModulesByName(web3.utils.toHex('GeneralTransferManager')).call();
  let generalTransferManagerAddress = gmtModules[0];
  let generalTransferManagerABI = abis.generalTransferManager();
  let generalTransferManager = new web3.eth.Contract(generalTransferManagerABI, generalTransferManagerAddress);
  generalTransferManager.setProvider(web3.currentProvider);
  return generalTransferManager;
}

async function showAccreditedData (currentSTO) {
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
    console.log(`************************************ ACCREDITED DATA *************************************`);
    console.log();
    console.log(table(dataTable));
  } else {
    console.log();
    console.log(chalk.yellow(`There is no accredited data to show`));
    console.log();
  }
}

async function changeAccreditedInBatch (currentSTO) {
  let csvFilePath = readlineSync.question(`Enter the path for csv data file (${ACCREDIT_DATA_CSV}): `, {
    defaultInput: ACCREDIT_DATA_CSV
  });
  let batchSize = input.readNumberGreaterThan(0, `Enter the max number of records per transaction or batch size (${gbl.constants.DEFAULT_BATCH_SIZE}): `, gbl.constants.DEFAULT_BATCH_SIZE);
  let parsedData = csvParse(csvFilePath);
  let validData = parsedData.filter(row => web3.utils.isAddress(row[0]) && typeof row[1] === 'boolean');
  let invalidRows = parsedData.filter(row => !validData.includes(row));
  if (invalidRows.length > 0) {
    console.log(chalk.red(`The following lines from csv file are not valid: ${invalidRows.map(r => parsedData.indexOf(r) + 1).join(',')}`));
  }
  let batches = common.splitIntoBatches(validData, batchSize);
  let transposedData = common.transposeBatches(batches);
  let [investorArray, isAccreditedArray] = common.transposeBatches(batches);
  let generalTransferManager = await getGeneralTransferManager();
  for (let batch = 0; batch < batches.length; batch++) {
    console.log(`Batch ${batch + 1} - Attempting to change accredited accounts:\n\n`, investorArray[batch], '\n');
    // create array with correct batch length of isAccredited flag = 0
    let accreditedFlagArray = new Array(investorArray[batch].length).fill(0);
    let action = generalTransferManager.methods.modifyInvestorFlagMulti(investorArray[batch], accreditedFlagArray, isAccreditedArray[batch]);
    let receipt = await common.sendTransaction(action);
    console.log(chalk.green('Change accredited transaction was successful.'));
    console.log(`${receipt.gasUsed} gas used. Spent: ${web3.utils.fromWei((new web3.utils.BN(receipt.gasUsed)).mul(new web3.utils.BN(defaultGasPrice)))} ETH`);
  }
}

async function changeNonAccreditedLimitsInBatch (currentSTO) {
  let csvFilePath = readlineSync.question(`Enter the path for csv data file (${NON_ACCREDIT_LIMIT_DATA_CSV}): `, {
    defaultInput: NON_ACCREDIT_LIMIT_DATA_CSV
  });
  let batchSize = input.readNumberGreaterThan(0, `Enter the max number of records per transaction or batch size (${gbl.constants.DEFAULT_BATCH_SIZE}): `, gbl.constants.DEFAULT_BATCH_SIZE);
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

async function modfifyTimes (currentSTO) {
  let times = timesConfigUSDTieredSTO();
  let modifyTimesAction = currentSTO.methods.modifyTimes(times.startTime, times.endTime);
  await common.sendTransaction(modifyTimesAction);
}

async function modfifyLimits (currentSTO) {
  let limits = limitsConfigUSDTieredSTO();

  let modifyLimitsAction = currentSTO.methods.modifyLimits(
    web3.utils.toWei(limits.nonAccreditedLimitUSD.toString()),
    web3.utils.toWei(limits.minimumInvestmentUSD.toString())
  );
  await common.sendTransaction(modifyLimitsAction);
}

async function modfifyFunding (currentSTO) {
  let funding = fundingConfigUSDTieredSTO();
  let modifyFundingAction = currentSTO.methods.modifyFunding(funding.raiseType);
  await common.sendTransaction(modifyFundingAction);
}

async function modfifyAddresses (currentSTO) {
  let addresses = await addressesConfigUSDTieredSTO(await currentSTO.methods.fundRaiseTypes(gbl.constants.FUND_RAISE_TYPES.STABLE).call());
  let modifyAddressesAction = currentSTO.methods.modifyAddresses(addresses.wallet, addresses.treasuryWallet, addresses.usdToken);
  await common.sendTransaction(modifyAddressesAction);
}

async function modfifyTiers (currentSTO) {
  let tiers = tiersConfigUSDTieredSTO(await currentSTO.methods.fundRaiseTypes(gbl.constants.FUND_RAISE_TYPES.POLY).call());
  let modifyTiersAction = currentSTO.methods.modifyTiers(
    tiers.ratePerTier.map(r => web3.utils.toWei(r.toString())),
    tiers.ratePerTierDiscountPoly.map(rd => web3.utils.toWei(rd.toString())),
    tiers.tokensPerTier.map(t => web3.utils.toWei(t.toString())),
    tiers.tokensPerTierDiscountPoly.map(td => web3.utils.toWei(td.toString()))
  );
  await common.sendTransaction(modifyTiersAction);
}

async function reclaimFromContract (currentSTO) {
  let options = ['ETH', 'ERC20'];
  let index = readlineSync.keyInSelect(options, 'What do you want to reclaim?', { cancel: 'RETURN' });
  let selected = index !== -1 ? options[index] : 'RETURN';
  switch (selected) {
    case 'ETH':
      let ethBalance = await getBalance(currentSTO.options.address, gbl.constants.FUND_RAISE_TYPES.ETH);
      console.log(chalk.yellow(`Current ETH balance: ${web3.utils.fromWei(ethBalance)} ETH`));
      let reclaimETHAction = currentSTO.methods.reclaimETH();
      await common.sendTransaction(reclaimETHAction);
      console.log(chalk.green('ETH has been reclaimed succesfully!'));
      break;
    case 'ERC20':
      let erc20Address = input.readAddress('Enter the ERC20 token address to reclaim (POLY = ' + polyToken.options.address + '): ', polyToken.options.address);
      let reclaimERC20Action = currentSTO.methods.reclaimERC20(erc20Address);
      await common.sendTransaction(reclaimERC20Action);
      console.log(chalk.green('ERC20 has been reclaimed succesfully!'));
      break
  }
}

// HELPER FUNCTIONS //
async function getBalance (from, type) {
  switch (type) {
    case gbl.constants.FUND_RAISE_TYPES.ETH:
      return web3.eth.getBalance(from);
    case gbl.constants.FUND_RAISE_TYPES.POLY:
      return polyToken.methods.balanceOf(from).call();
    default:
      return '0';
  }
}

async function initialize (_tokenSymbol) {
  welcome();
  await setup();
  securityToken = await common.selectToken(securityTokenRegistry, _tokenSymbol);
  if (securityToken === null) {
    process.exit(0);
  }
}

function welcome () {
  common.logAsciiBull();
  console.log("****************************************");
  console.log("Welcome to the Command-Line STO Manager.");
  console.log("****************************************");
  console.log("The following script will allow you to manage STOs modules.");
  console.log("Issuer Account: " + Issuer.address + "\n");
}

async function setup () {
  try {
    let securityTokenRegistryAddress = await contracts.securityTokenRegistry();
    let iSecurityTokenRegistryABI = abis.iSecurityTokenRegistry();
    securityTokenRegistry = new web3.eth.Contract(iSecurityTokenRegistryABI, securityTokenRegistryAddress);
    securityTokenRegistry.setProvider(web3.currentProvider);

    let moduleRegistryAddress = await contracts.moduleRegistry();
    let moduleRegistryABI = abis.moduleRegistry();
    moduleRegistry = new web3.eth.Contract(moduleRegistryABI, moduleRegistryAddress);
    moduleRegistry.setProvider(web3.currentProvider);

    let polytokenAddress = await contracts.polyToken();
    let polytokenABI = abis.polyToken();
    polyToken = new web3.eth.Contract(polytokenABI, polytokenAddress);
    polyToken.setProvider(web3.currentProvider);
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
  },
  addSTOModule: async function (_tokenSymbol, stoConfig) {
    await initialize(_tokenSymbol);
    return addSTOModule(stoConfig)
  }
}
