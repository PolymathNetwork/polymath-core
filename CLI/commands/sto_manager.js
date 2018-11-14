var readlineSync = require('readline-sync');
var BigNumber = require('bignumber.js');
var chalk = require('chalk');
const shell = require('shelljs');
var contracts = require('./helpers/contract_addresses');
var abis = require('./helpers/contract_abis');
var common = require('./common/common_functions');
var gbl = require('./common/global');

///////////////////
// Crowdsale params
let tokenSymbol;

////////////////////////
// Artifacts
let securityTokenRegistry;
let polyToken;
let usdToken;
let securityToken;

async function executeApp() {
  common.logAsciiBull();
  console.log("********************************************");
  console.log("Welcome to the Command-Line ST-20 Generator.");
  console.log("********************************************");
  console.log("The following script will create a new ST-20 according to the parameters you enter.");
  console.log("Issuer Account: " + Issuer.address + "\n");

  await setup();

  securityToken = await selectToken();
  while (true) {
    await start_explorer();
  }
};

async function setup(){
  try {
    let securityTokenRegistryAddress = await contracts.securityTokenRegistry();
    let securityTokenRegistryABI = abis.securityTokenRegistry();
    securityTokenRegistry = new web3.eth.Contract(securityTokenRegistryABI, securityTokenRegistryAddress);
    securityTokenRegistry.setProvider(web3.currentProvider);

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
    console.log('\x1b[31m%s\x1b[0m',"There was a problem getting the contracts. Make sure they are deployed to the selected network.");
    process.exit(0);
  }
}

async function selectToken() {
  let stAddress;
  let userTokens = await securityTokenRegistry.methods.getTokensByOwner(Issuer.address).call();
  if (userTokens.length == 0) {
    console.log(chalk.red(`You have not issued any Security Token yet!`));
    process.exit(0);
  } else if (userTokens.length == 1) {
    let tokenData = await securityTokenRegistry.methods.getSecurityTokenData(userTokens[0]).call();
    console.log(chalk.yellow(`You have only one token. ${tokenData[0]} will be selected automatically.`));
    stAddress = userTokens[0];
  } else {
    let options = await Promise.all(userTokens.map(async function (t) {
      let tokenData = await securityTokenRegistry.methods.getSecurityTokenData(t).call();
      return `${tokenData[0]}
    Deployed at ${t}`;
    }));

    let index = readlineSync.keyInSelect(options, 'Select a token:', {cancel: 'Exit'});
    if (index == -1) {
      process.exit(0);
    } else {
      stAddress = userTokens[index];
    }
  }

  let securityTokenABI = abis.securityToken();
  let securityToken = new web3.eth.Contract(securityTokenABI, stAddress);
  
  return securityToken;
}

async function start_explorer() {
  console.log();
  console.log(chalk.blue('STO Manager - Main Menu'));

  // Show non-archived attached STO modules
  console.log();
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

  let index = readlineSync.keyInSelect(options, 'What do you want to do?', {cancel: 'Exit'});
  let optionSelected = index != -1 ? options[index] : 'Exit';
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
    case 'Exit':
      process.exit(0);
  }
}

function selectExistingSTO(stoModules, showPaused) {
  let filteredModules = stoModules;
  if (!showPaused) {
    filteredModules = stoModules.filter(m => !m.paused);
  }
  let options = filteredModules.map(m => `${m.name} at ${m.address}`);
  let index = readlineSync.keyInSelect(options, 'Select a module: ', {cancel: false});
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
  return {name: selectedName, module: stoModule};
}

async function showSTO(selectedSTO, currentSTO) {
  switch (selectedSTO) {
    case 'CappedSTO':
      await cappedSTO_status(currentSTO);
      break;
    case 'USDTieredSTO':
      await usdTieredSTO_status(currentSTO);
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
    case 'USDTieredSTO':
      await usdTieredSTO_configure(currentSTO);
      break;
  }
}

async function addSTOModule() {
  console.log(chalk.blue('Launch STO - Configuration'));

  let options = ['CappedSTO', 'USDTieredSTO'];
  let index = readlineSync.keyInSelect(options, 'What type of STO do you want?', { cancel: 'Return' });
  let optionSelected = index != -1 ? options[index] : 'Return';
  console.log('Selected:', optionSelected, '\n');
  switch (optionSelected) {
    case 'CappedSTO':
      let cappedSTO = await cappedSTO_launch();
      await cappedSTO_status(cappedSTO);
      break;
    case 'USDTieredSTO':
      let usdTieredSTO = await usdTieredSTO_launch();
      await usdTieredSTO_status(usdTieredSTO);
      break;
  }
}

////////////////
// Capped STO //
////////////////
async function cappedSTO_launch() {
  console.log(chalk.blue('Launch STO - Capped STO in No. of Tokens'));

  let cappedSTOFactoryABI = abis.cappedSTOFactory();
  let cappedSTOFactoryAddress = await contracts.getModuleFactoryAddressByName(securityToken.options.address, gbl.constants.MODULES_TYPES.STO, "CappedSTO");
  let cappedSTOFactory = new web3.eth.Contract(cappedSTOFactoryABI, cappedSTOFactoryAddress);
  cappedSTOFactory.setProvider(web3.currentProvider);
  let stoFee = await cappedSTOFactory.methods.getSetupCost().call();

  let contractBalance = await polyToken.methods.balanceOf(securityToken._address).call();
  if (parseInt(contractBalance) < parseInt(stoFee)) {
    let transferAmount = parseInt(stoFee) - parseInt(contractBalance);
    let ownerBalance = await polyToken.methods.balanceOf(Issuer.address).call();
    if (parseInt(ownerBalance) < transferAmount) {
      console.log(chalk.red(`\n**************************************************************************************************************************************************`));
      console.log(chalk.red(`Not enough balance to pay the CappedSTO fee, Requires ${(new BigNumber(transferAmount).dividedBy(new BigNumber(10).pow(18))).toNumber()} POLY but have ${(new BigNumber(ownerBalance).dividedBy(new BigNumber(10).pow(18))).toNumber()} POLY. Access POLY faucet to get the POLY to complete this txn`));
      console.log(chalk.red(`**************************************************************************************************************************************************\n`));
      return;
    } else {
      let transferAction = polyToken.methods.transfer(securityToken._address, new BigNumber(transferAmount));
      let receipt = await common.sendTransaction(transferAction, {factor: 2});
      let event = common.getEventFromLogs(polyToken._jsonInterface, receipt.logs, 'Transfer');
      console.log(`Number of POLY sent: ${web3.utils.fromWei(new web3.utils.BN(event._value))}`)
    }
  }

  let cap = readlineSync.question('How many tokens do you plan to sell on the STO? (500.000): ');
  if (cap == "") cap = '500000';

  let oneMinuteFromNow = BigNumber((Math.floor(Date.now() / 1000) + 60));
  let startTime = readlineSync.question('Enter the start time for the STO (Unix Epoch time)\n(1 minutes from now = ' + oneMinuteFromNow + ' ): ');
  if (startTime == "") startTime = oneMinuteFromNow;

  let oneMonthFromNow = BigNumber((Math.floor(Date.now()/1000)+ (30 * 24 * 60 * 60)));
  let endTime = readlineSync.question('Enter the end time for the STO (Unix Epoch time)\n(1 month from now = ' + oneMonthFromNow + ' ): ');
  if (endTime == "") endTime = oneMonthFromNow;

  let wallet = readlineSync.question('Enter the address that will receive the funds from the STO (' + Issuer.address + '): ');
  if (wallet == "") wallet = Issuer.address;

  let raiseType = readlineSync.question('Enter' + chalk.green(` P `) + 'for POLY raise or leave empty for Ether raise (E): ');
  if (raiseType.toUpperCase() == 'P' ) {
    raiseType = [1];
  } else {
    raiseType = [0];
  }

  let rate = readlineSync.question(`Enter the rate (1 ${(raiseType == 1 ? 'POLY' : 'ETH')} = X ${tokenSymbol}) for the STO (1000): `);
  if (rate == "") rate = 1000;

  let bytesSTO = web3.eth.abi.encodeFunctionCall( {
    name: 'configure',
    type: 'function',
    inputs: [
      {
        type: 'uint256',
        name: '_startTime'
      },{
        type: 'uint256',
        name: '_endTime'
      },{
        type: 'uint256',
        name: '_cap'
      },{
        type: 'uint256',
        name: '_rate'
      },{
        type: 'uint8[]',
        name: '_fundRaiseTypes'
      },{
        type: 'address',
        name: '_fundsReceiver'
      }
    ]
  }, [startTime, endTime, web3.utils.toWei(cap), rate, raiseType, wallet]);

  let addModuleAction = securityToken.methods.addModule(cappedSTOFactoryAddress, bytesSTO, new BigNumber(stoFee).times(new BigNumber(10).pow(18)), 0);
  let receipt = await common.sendTransaction(addModuleAction);
  let event = common.getEventFromLogs(securityToken._jsonInterface, receipt.logs, 'ModuleAdded');
  console.log(`STO deployed at address: ${event._module}`);

  let cappedSTOABI = abis.cappedSTO();
  let cappedSTO = new web3.eth.Contract(cappedSTOABI, event._module);
  cappedSTO.setProvider(web3.currentProvider);

  return cappedSTO;
}

async function cappedSTO_status(currentSTO) {
  let displayStartTime = await currentSTO.methods.startTime().call();
  let displayEndTime = await currentSTO.methods.endTime().call();
  let displayRate = await currentSTO.methods.rate().call();
  let displayCap = await currentSTO.methods.cap().call();
  let displayWallet = await currentSTO.methods.wallet().call();
  let displayRaiseType;
  let displayFundsRaised;
  let displayWalletBalance;
  let raiseType = await currentSTO.methods.fundRaiseTypes(gbl.constants.FUND_RAISE_TYPES.ETH).call();
  if (raiseType) {
    displayRaiseType = 'ETH';
    displayFundsRaised = await currentSTO.methods.fundsRaised(gbl.constants.FUND_RAISE_TYPES.ETH).call();
    displayWalletBalance = web3.utils.fromWei(await web3.eth.getBalance(displayWallet));
  } else {
    displayRaiseType = 'POLY';
    displayFundsRaised = await currentSTO.methods.fundsRaised(gbl.constants.FUND_RAISE_TYPES.POLY).call();
    displayWalletBalance = web3.utils.fromWei(await getBalance(displayWallet, 'POLY'));
  }
  let displayTokensSold = await currentSTO.methods.totalTokensSold().call();
  let displayInvestorCount = await currentSTO.methods.investorCount().call();
  let displayTokenSymbol = await securityToken.methods.symbol().call();

  let formattedCap = BigNumber(web3.utils.fromWei(displayCap));
  let formattedSold = BigNumber(web3.utils.fromWei(displayTokensSold));

  let now = Math.floor(Date.now()/1000);
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
  - Rate:              1 ${displayRaiseType} = ${displayRate} ${displayTokenSymbol.toUpperCase()}
  - Wallet:            ${displayWallet}
  - Wallet Balance:    ${displayWalletBalance} ${displayRaiseType}
  -----------------------------------------------
  - ${timeTitle}    ${timeRemaining}
  - Funds raised:      ${web3.utils.fromWei(displayFundsRaised)} ${displayRaiseType}
  - Tokens sold:       ${web3.utils.fromWei(displayTokensSold)} ${displayTokenSymbol.toUpperCase()}
  - Tokens remaining:  ${formattedCap.minus(formattedSold).toNumber()} ${displayTokenSymbol.toUpperCase()}
  - Investor count:    ${displayInvestorCount}
  `);

  console.log(chalk.green(`\n${(web3.utils.fromWei(await getBalance(Issuer.address, 'POLY')))} POLY balance remaining at issuer address ${Issuer.address}`));
}

////////////////////
// USD Tiered STO //
////////////////////
function fundingConfigUSDTieredSTO() {
  let funding = {};

  let selectedFunding = readlineSync.question('Enter' + chalk.green(` P `) + 'for POLY raise,' + chalk.green(` D `) + 'for DAI raise,' + chalk.green(` E `) + 'for Ether raise or any combination of them (i.e.'+ chalk.green(` PED `) + 'for all): ').toUpperCase();

  funding.raiseType = [];
  if (selectedFunding.includes('E')) {
    funding.raiseType.push(gbl.constants.FUND_RAISE_TYPES.ETH);
  }
  if (selectedFunding.includes('P')) {
    funding.raiseType.push(gbl.constants.FUND_RAISE_TYPES.POLY);
  }
  if (selectedFunding.includes('D')) {
    funding.raiseType.push(gbl.constants.FUND_RAISE_TYPES.DAI);
  }
  if (funding.raiseType.length == 0) {
    funding.raiseType = [gbl.constants.FUND_RAISE_TYPES.ETH, gbl.constants.FUND_RAISE_TYPES.POLY, gbl.constants.FUND_RAISE_TYPES.DAI];
  }

  return funding;
}

function addressesConfigUSDTieredSTO(usdTokenRaise) {
  let addresses = {};

  addresses.wallet = readlineSync.question('Enter the address that will receive the funds from the STO (' + Issuer.address + '): ', {
    limit: function(input) {
      return web3.utils.isAddress(input);
    },
    limitMessage: "Must be a valid address",
    defaultInput: Issuer.address
  });
  if (addresses.wallet == "") addresses.wallet = Issuer.address;

  addresses.reserveWallet = readlineSync.question('Enter the address that will receive remaining tokens in the case the cap is not met (' + Issuer.address + '): ', {
    limit: function(input) {
      return web3.utils.isAddress(input);
    },
    limitMessage: "Must be a valid address",
    defaultInput: Issuer.address
  });
  if (addresses.reserveWallet == "") addresses.reserveWallet = Issuer.address;

  if (usdTokenRaise) {
    addresses.usdToken = readlineSync.question('Enter the address of the USD Token or stable coin (' + usdToken.options.address + '): ', {
      limit: function(input) {
        return web3.utils.isAddress(input);
      },
      limitMessage: "Must be a valid address",
      defaultInput: usdToken.options.address
    });
    if (addresses.usdToken == "") addresses.usdToken = usdToken.options.address;
  } else {
    addresses.usdToken = '0x0000000000000000000000000000000000000000';
  } 

  return addresses;
}

function tiersConfigUSDTieredSTO(polyRaise) {
  let tiers = {};

  let defaultTiers = 3;
  tiers.tiers = readlineSync.questionInt(`Enter the number of tiers for the STO? (${defaultTiers}): `, {
    limit: function(input) {
      return input > 0;
    },
    limitMessage: 'Must be greater than zero',
    defaultInput: defaultTiers
  });

  let defaultTokensPerTier = [190000000, 100000000, 200000000];
  let defaultRatePerTier = ['0.05', '0.10', '0.15'];
  let defaultTokensPerTierDiscountPoly = [90000000, 50000000, 100000000];
  let defaultRatePerTierDiscountPoly = ['0.025', '0.05', '0.075'];
  tiers.tokensPerTier = [];
  tiers.ratePerTier = [];
  tiers.tokensPerTierDiscountPoly = [];
  tiers.ratePerTierDiscountPoly = [];
  for (let i = 0; i < tiers.tiers; i++) {
    tiers.tokensPerTier[i] = web3.utils.toWei(readlineSync.question(`How many tokens do you plan to sell on tier No. ${i+1}? (${defaultTokensPerTier[i]}): `, {
      limit: function(input) {
        return parseFloat(input) > 0;
      },
      limitMessage: 'Must be greater than zero',
      defaultInput: defaultTokensPerTier[i]
    }));

    tiers.ratePerTier[i] = web3.utils.toWei(readlineSync.question(`What is the USD per token rate for tier No. ${i+1}? (${defaultRatePerTier[i]}): `, {
      limit: function(input) {
        return parseFloat(input) > 0;
      },
      limitMessage: 'Must be greater than zero',
      defaultInput: defaultRatePerTier[i]
    }));

    if (polyRaise && readlineSync.keyInYNStrict(`Do you plan to have a discounted rate for POLY investments for tier No. ${i+1}? `)) {
      tiers.tokensPerTierDiscountPoly[i] = web3.utils.toWei(readlineSync.question(`How many of those tokens do you plan to sell at discounted rate on tier No. ${i+1}? (${defaultTokensPerTierDiscountPoly[i]}): `, {
        limit: function(input) {
          return new BigNumber(web3.utils.toWei(input)).lte(tiers.tokensPerTier[i])
        },
        limitMessage: 'Must be less than the No. of tokens of the tier',
        defaultInput: defaultTokensPerTierDiscountPoly[i]
      }));

      tiers.ratePerTierDiscountPoly[i] = web3.utils.toWei(readlineSync.question(`What is the discounted rate for tier No. ${i+1}? (${defaultRatePerTierDiscountPoly[i]}): `, {
        limit: function(input) {
          return new BigNumber(web3.utils.toWei(input)).lte(tiers.ratePerTier[i])
        },
        limitMessage: 'Must be less than the rate of the tier',
        defaultInput: defaultRatePerTierDiscountPoly[i]
      }));
    } else {
      tiers.tokensPerTierDiscountPoly[i] = 0;
      tiers.ratePerTierDiscountPoly[i] = 0;
    }
  }

  return tiers;
}

function timesConfigUSDTieredSTO() {
  let times = {};

  let oneMinuteFromNow = Math.floor(Date.now() / 1000) + 60;
  times.startTime = readlineSync.questionInt('Enter the start time for the STO (Unix Epoch time)\n(1 minutes from now = ' + oneMinuteFromNow + ' ): ', {
    limit: function(input) {
      return input > Math.floor(Date.now() / 1000);
    },
    limitMessage: "Must be a future time",
    defaultInput: oneMinuteFromNow
  });
  if (times.startTime == "") times.startTime = oneMinuteFromNow;

  let oneMonthFromNow = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
  times.endTime = readlineSync.questionInt('Enter the end time for the STO (Unix Epoch time)\n(1 month from now = ' + oneMonthFromNow + ' ): ', {
    limit: function(input) {
      return input > times.startTime;
    },
    limitMessage: "Must be greater than Start Time",
    defaultInput: oneMonthFromNow
  });
  if (times.endTime == "") times.endTime = oneMonthFromNow;

  return times;
}

function limitsConfigUSDTieredSTO() {
  let limits = {};

  let defaultMinimumInvestment = 5;
  limits.minimumInvestmentUSD = web3.utils.toWei(readlineSync.question(`What is the minimum investment in USD? (${defaultMinimumInvestment}): `, {
    limit: function(input) {
      return parseInt(input) > 0;
    },
    limitMessage: "Must be greater than zero",
    defaultInput: defaultMinimumInvestment
  }));

  let nonAccreditedLimit = 2500;
  limits.nonAccreditedLimitUSD = web3.utils.toWei(readlineSync.question(`What is the default limit for non accredited investors in USD? (${nonAccreditedLimit}): `, {
    limit: function(input) {
      return new BigNumber(web3.utils.toWei(input)).gte(limits.minimumInvestmentUSD);
    },
    limitMessage: "Must be greater than minimum investment",
    defaultInput: nonAccreditedLimit
  }));

  return limits;
}

async function usdTieredSTO_launch() {
  console.log(chalk.blue('Launch STO - USD pegged tiered STO'));

  let usdTieredSTOFactoryABI = abis.usdTieredSTOFactory();
  let usdTieredSTOFactoryAddress = await contracts.getModuleFactoryAddressByName(securityToken.options.address, gbl.constants.MODULES_TYPES.STO, 'USDTieredSTO');
  let usdTieredSTOFactory = new web3.eth.Contract(usdTieredSTOFactoryABI, usdTieredSTOFactoryAddress);
  usdTieredSTOFactory.setProvider(web3.currentProvider);
  let stoFee = await usdTieredSTOFactory.methods.getSetupCost().call();

  let contractBalance = await polyToken.methods.balanceOf(securityToken._address).call();
  if (new web3.utils.BN(contractBalance).lt(new web3.utils.BN(stoFee))) {
    let transferAmount = (new web3.utils.BN(stoFee)).sub(new web3.utils.BN(contractBalance));
    let ownerBalance = new web3.utils.BN(await polyToken.methods.balanceOf(Issuer.address).call());
    if (ownerBalance.lt(transferAmount)) {
      console.log(chalk.red(`\n**************************************************************************************************************************************************`));
      console.log(chalk.red(`Not enough balance to pay the USDTieredSTO fee, Requires ${web3.utils.fromWei(transferAmount)} POLY but have ${web3.utils.fromWei(ownerBalance)} POLY. Access POLY faucet to get the POLY to complete this txn`));
      console.log(chalk.red(`**************************************************************************************************************************************************\n`));
      return;
    } else {
      let transferAction = polyToken.methods.transfer(securityToken._address, transferAmount);
      let receipt = await common.sendTransaction(transferAction, {factor: 2});
      let event = common.getEventFromLogs(polyToken._jsonInterface, receipt.logs, 'Transfer');
      console.log(`Number of POLY sent: ${web3.utils.fromWei(new web3.utils.BN(event._value))}`)
    }
  }

  let funding = fundingConfigUSDTieredSTO();
  let addresses = addressesConfigUSDTieredSTO(funding.raiseType.includes(gbl.constants.FUND_RAISE_TYPES.DAI));
  let tiers = tiersConfigUSDTieredSTO(funding.raiseType.includes(gbl.constants.FUND_RAISE_TYPES.POLY));
  let limits = limitsConfigUSDTieredSTO();
  let times = timesConfigUSDTieredSTO();
  let bytesSTO = web3.eth.abi.encodeFunctionCall( {
    name: 'configure',
    type: 'function',
    inputs: [
      {
        type: 'uint256',
        name: '_startTime'
      },{
        type: 'uint256',
        name: '_endTime'
      },{
        type: 'uint256[]',
        name: '_ratePerTier'
      },{
        type: 'uint256[]',
        name: '_ratePerTierDiscountPoly'
      },{
        type: 'uint256[]',
        name: '_tokensPerTier'
      },{
        type: 'uint256[]',
        name: '_tokensPerTierDiscountPoly'
      },{
        type: 'uint256',
        name: '_nonAccreditedLimitUSD'
      },{
        type: 'uint256',
        name: '_minimumInvestmentUSD'
      },{
        type: 'uint8[]',
        name: '_fundRaiseTypes'
      },{
        type: 'address',
        name: '_wallet'
      },{
        type: 'address',
        name: '_reserveWallet'
      },{
        type: 'address',
        name: '_usdToken'
      }
    ]
  }, [times.startTime,
    times.endTime,
    tiers.ratePerTier,
    tiers.ratePerTierDiscountPoly,
    tiers.tokensPerTier,
    tiers.tokensPerTierDiscountPoly,
    limits.nonAccreditedLimitUSD,
    limits.minimumInvestmentUSD,
    funding.raiseType,
    addresses.wallet,
    addresses.reserveWallet,
    addresses.usdToken
  ]);

  let addModuleAction = securityToken.methods.addModule(usdTieredSTOFactoryAddress, bytesSTO, new BigNumber(stoFee).times(new BigNumber(10).pow(18)), 0);
  let receipt = await common.sendTransaction(addModuleAction);
  let event = common.getEventFromLogs(securityToken._jsonInterface, receipt.logs, 'ModuleAdded');
  console.log(`STO deployed at address: ${event._module}`);

  let usdTieredSTOABI = abis.usdTieredSTO();
  let usdTieredSTO = new web3.eth.Contract(usdTieredSTOABI, event._module);
  usdTieredSTO.setProvider(web3.currentProvider);

  return usdTieredSTO;
}

async function usdTieredSTO_status(currentSTO) {
  let displayStartTime = await currentSTO.methods.startTime().call();
  let displayEndTime = await currentSTO.methods.endTime().call();
  let displayCurrentTier = parseInt(await currentSTO.methods.currentTier().call()) + 1;
  let displayNonAccreditedLimitUSD = web3.utils.fromWei(await currentSTO.methods.nonAccreditedLimitUSD().call());
  let displayMinimumInvestmentUSD = web3.utils.fromWei(await currentSTO.methods.minimumInvestmentUSD().call());
  let displayWallet = await currentSTO.methods.wallet().call();
  let displayReserveWallet = await currentSTO.methods.reserveWallet().call();
  let displayTokensSold = web3.utils.fromWei(await currentSTO.methods.getTokensSold().call());
  let displayInvestorCount = await currentSTO.methods.investorCount().call();
  let displayIsFinalized = await currentSTO.methods.isFinalized().call() ? "YES" : "NO";
  let displayTokenSymbol = await securityToken.methods.symbol().call();

  let tiersLength = await currentSTO.methods.getNumberOfTiers().call();;

  let raiseTypes = [];
  for (const fundType in gbl.constants.FUND_RAISE_TYPES) {
    if (await currentSTO.methods.fundRaiseTypes(gbl.constants.FUND_RAISE_TYPES[fundType]).call()) {
        raiseTypes.push(fundType);
    }
  }

  let displayTiers = "";
  let displayMintedPerTier = "";
  for (let t = 0; t < tiersLength; t++) {
    let ratePerTier = await currentSTO.methods.ratePerTier(t).call();
    let tokensPerTierTotal = await currentSTO.methods.tokensPerTierTotal(t).call();
    let mintedPerTierTotal = await currentSTO.methods.mintedPerTierTotal(t).call();

    let displayMintedPerTierPerType = "";
    let displayDiscountTokens = "";
    for (const type of raiseTypes) {
      let displayDiscountMinted = "";
      if (type == 'POLY') {
        let tokensPerTierDiscountPoly = await currentSTO.methods.tokensPerTierDiscountPoly(t).call();
        if (tokensPerTierDiscountPoly > 0) {
          let ratePerTierDiscountPoly = await currentSTO.methods.ratePerTierDiscountPoly(t).call();
          let mintedPerTierDiscountPoly = await currentSTO.methods.mintedPerTierDiscountPoly(t).call();
          displayDiscountTokens = `
      Tokens at discounted rate: ${web3.utils.fromWei(tokensPerTierDiscountPoly)} ${displayTokenSymbol}
      Discounted rate:           ${web3.utils.fromWei(ratePerTierDiscountPoly, 'ether')} USD per Token`;

      displayDiscountMinted = `(${web3.utils.fromWei(mintedPerTierDiscountPoly)} ${displayTokenSymbol} at discounted rate)`;
        }
      }

      let mintedPerTier = await currentSTO.methods.mintedPerTier(gbl.constants.FUND_RAISE_TYPES[type], t).call();
      displayMintedPerTierPerType += `
      Sold for ${type}:\t\t ${web3.utils.fromWei(mintedPerTier)} ${displayTokenSymbol} ${displayDiscountMinted}`;
    }

    displayTiers += `
  - Tier ${t+1}:
      Tokens:                    ${web3.utils.fromWei(tokensPerTierTotal)} ${displayTokenSymbol}
      Rate:                      ${web3.utils.fromWei(ratePerTier)} USD per Token`
    + displayDiscountTokens;

    displayMintedPerTier +=  `
  - Tokens minted in Tier ${t+1}:     ${web3.utils.fromWei(mintedPerTierTotal)} ${displayTokenSymbol}`
    + displayMintedPerTierPerType;
  }

  let displayFundsRaisedUSD = web3.utils.fromWei(await currentSTO.methods.fundsRaisedUSD().call());

  let displayWalletBalancePerType = '';
  let displayReserveWalletBalancePerType = '';
  let displayFundsRaisedPerType = '';
  let displayTokensSoldPerType = '';
  for (const type of raiseTypes) {
    let balance = await getBalance(displayWallet, type);
    let walletBalance = web3.utils.fromWei(balance);
    let walletBalanceUSD = web3.utils.fromWei(await currentSTO.methods.convertToUSD(gbl.constants.FUND_RAISE_TYPES[type], balance).call());
    displayWalletBalancePerType += `
      Balance ${type}:\t\t ${walletBalance} ${type} (${walletBalanceUSD} USD)`;
    
    balance = await getBalance(displayReserveWallet, type);
    let reserveWalletBalance = web3.utils.fromWei(balance);
    let reserveWalletBalanceUSD = web3.utils.fromWei(await currentSTO.methods.convertToUSD(gbl.constants.FUND_RAISE_TYPES[type], balance).call());
    displayReserveWalletBalancePerType += `
      Balance ${type}:\t\t ${reserveWalletBalance} ${type} (${reserveWalletBalanceUSD} USD)`;
    
    let fundsRaised = web3.utils.fromWei(await currentSTO.methods.fundsRaised(gbl.constants.FUND_RAISE_TYPES[type]).call());
    displayFundsRaisedPerType += `
      ${type}:\t\t\t ${fundsRaised} ${type}`;

    //Only show sold for if more than one raise type are allowed
    if (raiseTypes.length > 1) {
      let tokensSoldPerType = web3.utils.fromWei(await currentSTO.methods.getTokensSoldFor(gbl.constants.FUND_RAISE_TYPES[type]).call());
      displayTokensSoldPerType += `
      Sold for ${type}:\t\t ${tokensSoldPerType} ${displayTokenSymbol}`;
    }
  }

  let displayRaiseType = raiseTypes.join(' - ');

  let now = Math.floor(Date.now()/1000);
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
  - Tiers:                       ${tiersLength}`
  + displayTiers + `
  - Minimum Investment:          ${displayMinimumInvestmentUSD} USD
  - Non Accredited Limit:        ${displayNonAccreditedLimitUSD} USD
  - Wallet:                      ${displayWallet}`
  + displayWalletBalancePerType + `
  - Reserve Wallet:              ${displayReserveWallet}`
  + displayReserveWalletBalancePerType + `

  ---------------------------------------------------------------
  - ${timeTitle}              ${timeRemaining}
  - Is Finalized:                ${displayIsFinalized}
  - Tokens Sold:                 ${displayTokensSold} ${displayTokenSymbol}`
  + displayTokensSoldPerType + `
  - Current Tier:                ${displayCurrentTier}`
  + displayMintedPerTier + `
  - Investor count:              ${displayInvestorCount}
  - Funds Raised`
  + displayFundsRaisedPerType + `
      USD:                       ${displayFundsRaisedUSD} USD
  `);

  console.log(chalk.green(`\n${(web3.utils.fromWei(await getBalance(Issuer.address, 'POLY')))} POLY balance remaining at issuer address ${Issuer.address}`));
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

    let index = readlineSync.keyInSelect(options, 'What do you want to do?');
    switch (index) {
      case 0:
        let reserveWallet = await currentSTO.methods.reserveWallet().call();
        let isVerified = await securityToken.methods.verifyTransfer('0x0000000000000000000000000000000000000000', reserveWallet, 0, web3.utils.fromAscii("")).call();
        if (isVerified) {
          if (readlineSync.keyInYNStrict()) {
            let finalizeAction = currentSTO.methods.finalize();
            await common.sendTransaction(finalizeAction);
          }
        } else {
          console.log(chalk.red(`Reserve wallet (${reserveWallet}) is not able to receive remaining tokens. Check if this address is whitelisted.`));
        }
        break;
      case 1:
        let investor = readlineSync.question('Enter the address to change accreditation: ');
        let isAccredited = readlineSync.keyInYNStrict(`Is ${investor} accredited?`);
        let investors = [investor];
        let accredited = [isAccredited];
        let changeAccreditedAction = currentSTO.methods.changeAccredited(investors, accredited);
        // 2 GAS?
        await common.sendTransaction(changeAccreditedAction);
        break;
      case 2:
        shell.exec(`${__dirname}/scripts/script.sh Accredit ${tokenSymbol} 75 ${remoteNetwork}`);
        break;
      case 3:
        let account = readlineSync.question('Enter the address to change non accredited limit: ');
        let limit = readlineSync.question(`Enter the limit in USD: `);
        let accounts = [account];
        let limits = [web3.utils.toWei(limit)];
        let changeNonAccreditedLimitAction = currentSTO.methods.changeNonAccreditedLimit(accounts, limits);
        // 2 GAS?
        await common.sendTransaction(changeNonAccreditedLimitAction);
        break;
      case 4:
        shell.exec(`${__dirname}/scripts/script.sh NonAccreditedLimit ${tokenSymbol} 75 ${remoteNetwork}`);
        break;
      case 5:
        await modfifyTimes(currentSTO);
        await usdTieredSTO_status(currentSTO);
        break;
      case 6:
        await modfifyTiers(currentSTO);
        await usdTieredSTO_status(currentSTO);
        break;
      case 7:
        await modfifyAddresses(currentSTO);
        await usdTieredSTO_status(currentSTO);
        break;
      case 8:
        await modfifyLimits(currentSTO);
        await usdTieredSTO_status(currentSTO);
        break;
      case 9:
        await modfifyFunding(currentSTO);
        await usdTieredSTO_status(currentSTO);
        break;
    }
  }
}

async function modfifyTimes(currentSTO) {
  let times = timesConfigUSDTieredSTO();
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
  let addresses = addressesConfigUSDTieredSTO(await currentSTO.methods.fundRaiseTypes(gbl.constants.FUND_RAISE_TYPES.DAI).call());
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
    case 'ETH':
      return await web3.eth.getBalance(from);
    case 'POLY':
      return await polyToken.methods.balanceOf(from).call();
    case 'DAI':
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
      let abiTemp = JSON.parse(require('fs').readFileSync(`./build/contracts/${nameTemp}.json`).toString()).abi;
      let contractTemp = new web3.eth.Contract(abiTemp, details[1]);
      pausedTemp = await contractTemp.methods.paused().call();
    }
    modules.push(new ModuleInfo(type, nameTemp, details[1], details[2], details[3], pausedTemp));
  }

  return modules;
}

module.exports = {
  executeApp: async function() {
    return executeApp();
  }
}