var readlineSync = require('readline-sync');
var BigNumber = require('bignumber.js');
var moment = require('moment');
var chalk = require('chalk');
const shell = require('shelljs');
var contracts = require('./helpers/contract_addresses');
var abis = require('./helpers/contract_abis');
var common = require('./common/common_functions');
var global = require('./common/global');

let securityTokenRegistryAddress;

///////////////////
// Crowdsale params
let tokenName;
let tokenSymbol;
let selectedSTO;

const cappedSTOFee = 20000;
const usdTieredSTOFee = 100000;
const tokenDetails = "";

////////////////////////
// Artifacts
let securityTokenRegistry;
let polyToken;
let usdToken;
let securityToken;
let currentSTO;

// App flow
let _tokenConfig;
let _mintingConfig;
let _stoConfig;

async function executeApp(tokenConfig, mintingConfig, stoConfig) {
  _tokenConfig = tokenConfig;
  _mintingConfig = mintingConfig;
  _stoConfig = stoConfig;

  await global.initialize();

  common.logAsciiBull();
  console.log("********************************************");
  console.log("Welcome to the Command-Line ST-20 Generator.");
  console.log("********************************************");
  console.log("The following script will create a new ST-20 according to the parameters you enter.");
  console.log("Issuer Account: " + Issuer.address + "\n");

  await setup();

  try {
    await step_ticker_reg();
    await step_token_deploy();
    await step_Wallet_Issuance();
    await step_STO_launch();
    await step_STO_Status();
    await step_STO_configure();
  } catch (err) {
    console.log(err);
    return;
  }
};

async function setup(){
  try {
    securityTokenRegistryAddress = await contracts.securityTokenRegistry();
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

async function step_ticker_reg(){
  console.log('\n\x1b[34m%s\x1b[0m',"Token Symbol Registration");

  let available = false;
  let regFee = web3.utils.fromWei(await securityTokenRegistry.methods.getTickerRegistrationFee().call());
  let isDeployed;

  while (!available) {
    console.log(chalk.green(`\nRegistering the new token symbol requires ${regFee} POLY & deducted from '${Issuer.address}', Current balance is ${(await currentBalance(Issuer.address))} POLY\n`));

    if (typeof _tokenConfig !== 'undefined' && _tokenConfig.hasOwnProperty('symbol')) {
      tokenSymbol = _tokenConfig.symbol;
    } else {
      tokenSymbol = await selectTicker(true);
    }

    let details = await securityTokenRegistry.methods.getTickerDetails(tokenSymbol).call();
    isDeployed = details[4];
    if (new BigNumber(details[1]).toNumber() == 0) {
      available = true;
      await approvePoly(securityTokenRegistryAddress, regFee);
      let registerTickerAction = securityTokenRegistry.methods.registerTicker(Issuer.address, tokenSymbol, "");
      await common.sendTransaction(registerTickerAction, {factor: 1.5});
    } else if (details[0] == Issuer.address) {
      available = true;
    } else {
      console.log('\n\x1b[31m%s\x1b[0m',"Token Symbol has already been registered, please choose another symbol");
    }
  }

  if (!isDeployed) {
    if (typeof _tokenConfig === 'undefined' && readlineSync.keyInYNStrict(`Do you want to transfer the ownership of ${tokenSymbol} ticker?`)) {
      let newOwner = readlineSync.question('Enter the address that will be the new owner: ', {
        limit: function(input) {
          return web3.utils.isAddress(input);
        },
        limitMessage: "Must be a valid address"
      });
      let transferTickerOwnershipAction = securityTokenRegistry.methods.transferTickerOwnership(newOwner, tokenSymbol);
      let receipt = await common.sendTransaction(transferTickerOwnershipAction, {factor: 1.5});
      let event = common.getEventFromLogs(securityTokenRegistry._jsonInterface, receipt.logs, 'ChangeTickerOwnership');
      console.log(chalk.green(`Ownership trasferred successfully. The new owner is ${event._newOwner}`));
      process.exit(0);
    }
  }
}

async function step_token_deploy(){
  // Let's check if token has already been deployed, if it has, skip to STO
  let tokenAddress = await securityTokenRegistry.methods.getSecurityTokenAddress(tokenSymbol).call();
  if (tokenAddress != "0x0000000000000000000000000000000000000000") {
    console.log('\n\x1b[32m%s\x1b[0m',"Token has already been deployed at address " + tokenAddress + ". Skipping deployment.");
    let securityTokenABI = abis.securityToken();
    securityToken = new web3.eth.Contract(securityTokenABI, tokenAddress);
  } else {
    console.log('\n\x1b[34m%s\x1b[0m',"Token Creation - Token Deployment");

    let launchFee = web3.utils.fromWei(await securityTokenRegistry.methods.getSecurityTokenLaunchFee().call());
    console.log(chalk.green(`\nToken deployment requires ${launchFee} POLY & deducted from '${Issuer.address}', Current balance is ${(await currentBalance(Issuer.address))} POLY\n`));

    if (typeof _tokenConfig !== 'undefined' && _tokenConfig.hasOwnProperty('name')) {
      tokenName = _tokenConfig.name;
    } else {
      tokenName = readlineSync.question('Enter the name for your new token: ');
    }
    if (tokenName == "") tokenName = 'default';

    console.log("\n");
    console.log('\x1b[34m%s\x1b[0m',"Select the Token divisibility type");

    let divisibility;
    if (typeof _tokenConfig !== 'undefined' && _tokenConfig.hasOwnProperty('divisible')) {
      divisibility = _tokenConfig.divisible;
    } else {
      let divisible = readlineSync.question('Press "N" for Non-divisible type token or hit Enter for divisible type token (Default):');
      if (divisible == 'N' || divisible == 'n')
        divisibility = false;
      else
        divisibility = true;
    }

    await approvePoly(securityTokenRegistryAddress, launchFee);
    let generateSecurityTokenAction = securityTokenRegistry.methods.generateSecurityToken(tokenName, tokenSymbol, tokenDetails, divisibility);
    let receipt = await common.sendTransaction(generateSecurityTokenAction);
    let event = common.getEventFromLogs(securityTokenRegistry._jsonInterface, receipt.logs, 'NewSecurityToken');
    console.log(`Deployed Token at address: ${event._securityTokenAddress}`);
    let securityTokenABI = abis.securityToken();
    securityToken = new web3.eth.Contract(securityTokenABI, event._securityTokenAddress);
  }
}

async function step_Wallet_Issuance(){
  let result = await securityToken.methods.getModulesByType(global.constants.MODULES_TYPES.STO).call();
  if (result.length > 0) {
    console.log('\x1b[32m%s\x1b[0m',"STO has already been created at address " + result[0] + ". Skipping initial minting");
  } else {
    let initialMint = await securityToken.getPastEvents('Transfer', {
      filter: {from: "0x0000000000000000000000000000000000000000"}, // Using an array means OR: e.g. 20 or 23
      fromBlock: 0,
      toBlock: 'latest'
    });
    if (initialMint.length > 0) {
      console.log('\x1b[32m%s\x1b[0m',web3.utils.fromWei(initialMint[0].returnValues.value) +" Tokens have already been minted for " + initialMint[0].returnValues.to + ". Skipping initial minting");
    } else {
      console.log("\n");
      console.log('\x1b[34m%s\x1b[0m',"Token Creation - Token Minting for Issuer");

      console.log("Before setting up the STO, you can mint any amount of tokens that will remain under your control or you can transfer to affiliates");

      let multimint;
      if (typeof _mintingConfig !== 'undefined' && _mintingConfig.hasOwnProperty('multimint')) {
        multimint = _mintingConfig.multimint;
      } else {
        let isAffiliate = readlineSync.question('Press'+ chalk.green(` "Y" `) + 'if you have list of affiliates addresses with you otherwise hit' + chalk.green(' Enter ') + 'and get the minted tokens to a particular address: ');
        multimint = (isAffiliate == "Y" || isAffiliate == "y");
      }

      if (multimint)
        await multi_mint_tokens();
      else {
        let mintWallet;
        if (typeof _mintingConfig !== 'undefined' && _mintingConfig.hasOwnProperty('singleMint') && _mintingConfig.singleMint.hasOwnProperty('wallet')) {
          mintWallet = _mintingConfig.singleMint.wallet;
        } else {
          mintWallet = readlineSync.question('Add the address that will hold the issued tokens to the whitelist (' + Issuer.address + '): ');
        }
        if (mintWallet == "") mintWallet = Issuer.address;

        let canBuyFromSTO;
        if (typeof _mintingConfig !== 'undefined' && _mintingConfig.hasOwnProperty('singleMint') && _mintingConfig.singleMint.hasOwnProperty('allowedToBuy')) {
          canBuyFromSTO =  _mintingConfig.singleMint.allowedToBuy;
        } else {
          canBuyFromSTO = readlineSync.keyInYNStrict(`Is address '(${mintWallet})' allowed to buy tokens from the STO? `);
        }

        // Add address to whitelist
        let generalTransferManagerAddress = (await securityToken.methods.getModulesByName(web3.utils.toHex('GeneralTransferManager')).call())[0];
        let generalTransferManagerABI = abis.generalTransferManager();
        let generalTransferManager = new web3.eth.Contract(generalTransferManagerABI, generalTransferManagerAddress);
        let modifyWhitelistAction = generalTransferManager.methods.modifyWhitelist(mintWallet,Math.floor(Date.now()/1000),Math.floor(Date.now()/1000),Math.floor(Date.now()/1000 + 31536000), canBuyFromSTO);
        await common.sendTransaction(modifyWhitelistAction);

        // Mint tokens
        if (typeof _mintingConfig !== 'undefined' && _mintingConfig.hasOwnProperty('singleMint') && _mintingConfig.singleMint.hasOwnProperty('tokenAmount')) {
          issuerTokens = _mintingConfig.singleMint.tokenAmount;
        } else {
          issuerTokens = readlineSync.question('How many tokens do you plan to mint for the wallet you entered? (500.000): ');
        }
        if (issuerTokens == "") issuerTokens = '500000';

        let mintAction = securityToken.methods.mint(mintWallet, web3.utils.toWei(issuerTokens));
        await common.sendTransaction(mintAction);
      }
    }
  }
}

async function multi_mint_tokens() {
  //await whitelist.startWhitelisting(tokenSymbol);
  shell.exec(`${__dirname}/scripts/script.sh Whitelist ${tokenSymbol} 75 ${global.constants.NETWORK}`);
  console.log(chalk.green(`\nCongrats! All the affiliates get succssfully whitelisted, Now its time to Mint the tokens\n`));
  console.log(chalk.red(`WARNING: `) + `Please make sure all the addresses that get whitelisted are only eligible to hold or get Security token\n`);

  shell.exec(`${__dirname}/scripts//script.sh Multimint ${tokenSymbol} 75 ${global.constants.NETWORK}`);
  console.log(chalk.green(`\nHurray!! Tokens get successfully Minted and transferred to token holders`));
}

async function step_STO_launch() {
  console.log("\n");
  console.log('\x1b[34m%s\x1b[0m',"Token Creation - STO Configuration");

  let result = await securityToken.methods.getModulesByType(global.constants.MODULES_TYPES.STO).call();
  if (result.length > 0) {
    STO_Address = result[0];
    let stoModuleData = await securityToken.methods.getModule(STO_Address).call();
    selectedSTO = web3.utils.toAscii(stoModuleData[0]).replace(/\u0000/g, '');
    console.log('\x1b[32m%s\x1b[0m',selectedSTO + " has already been created at address " + STO_Address + ". Skipping STO creation");
    switch (selectedSTO) {
      case 'CappedSTO':
        let cappedSTOABI = abis.cappedSTO();
        currentSTO = new web3.eth.Contract(cappedSTOABI,STO_Address);
        break;
      case 'USDTieredSTO':
        let usdTieredSTOABI = abis.usdTieredSTO();
        currentSTO = new web3.eth.Contract(usdTieredSTOABI,STO_Address);
        break;
    }
  } else {
    let index;
    if (typeof _stoConfig !== 'undefined' && _stoConfig.hasOwnProperty('type')) {
      index = _stoConfig.type;
    } else {
      let options = ['Capped STO', 'USD Tiered STO', 'Select STO later'];
      index = readlineSync.keyInSelect(options, 'What type of STO do you want?', { cancel: false });
    }
    switch (index) {
      case 0:
        selectedSTO = 'CappedSTO';
        await cappedSTO_launch();
        break;
      case 1:
        selectedSTO = 'USDTieredSTO';
        await usdTieredSTO_launch();
        break;
      case 2:
        process.exit(0);
        break;
    }
  }
}

async function step_STO_Status() {
  switch (selectedSTO) {
    case 'CappedSTO':
      await cappedSTO_status();
      break;
    case 'USDTieredSTO':
      await usdTieredSTO_status();
      break;
  }
}

async function step_STO_configure() {
  switch (selectedSTO) {
    case 'CappedSTO':
      break;
    case 'USDTieredSTO':
      await usdTieredSTO_configure();
      break;
  }
}

////////////////
// Capped STO //
////////////////
async function cappedSTO_launch() {
  console.log("\n");
  console.log('\x1b[34m%s\x1b[0m',"Token Creation - Capped STO in No. of Tokens");

  let stoFee = cappedSTOFee;
  let contractBalance = await polyToken.methods.balanceOf(securityToken._address).call();
  let requiredAmount = web3.utils.toWei(stoFee.toString());
  if (parseInt(contractBalance) < parseInt(requiredAmount)) {
    let transferAmount = parseInt(requiredAmount) - parseInt(contractBalance);
    let ownerBalance = await polyToken.methods.balanceOf(Issuer.address).call();
    if(parseInt(ownerBalance) < transferAmount) {
      console.log(chalk.red(`\n**************************************************************************************************************************************************`));
      console.log(chalk.red(`Not enough balance to pay the CappedSTO fee, Requires ${(new BigNumber(transferAmount).dividedBy(new BigNumber(10).pow(18))).toNumber()} POLY but have ${(new BigNumber(ownerBalance).dividedBy(new BigNumber(10).pow(18))).toNumber()} POLY. Access POLY faucet to get the POLY to complete this txn`));
      console.log(chalk.red(`**************************************************************************************************************************************************\n`));
      process.exit(0);
    } else {
      let transferAction = polyToken.methods.transfer(securityToken._address, new BigNumber(transferAmount));
      let receipt = await common.sendTransaction(transferAction, {factor: 2});
      let event = common.getEventFromLogs(polyToken._jsonInterface, receipt.logs, 'Transfer');
      console.log(`Number of POLY sent: ${web3.utils.fromWei(new web3.utils.BN(event._value))}`)
    }
  }

  let cap;
  if (typeof _stoConfig !== 'undefined' && _stoConfig.hasOwnProperty('cap')) {
    cap = _stoConfig.cap.toString();
  } else {
    cap = readlineSync.question('How many tokens do you plan to sell on the STO? (500.000): ');
  }
  if (cap == "") cap = '500000';

  let oneMinuteFromNow = BigNumber((Math.floor(Date.now() / 1000) + 60));
  let startTime;
  if (typeof _stoConfig !== 'undefined' && _stoConfig.hasOwnProperty('startTime')) {
    startTime = _stoConfig.startTime;
  } else {
    startTime = readlineSync.question('Enter the start time for the STO (Unix Epoch time)\n(1 minutes from now = ' + oneMinuteFromNow + ' ): ');
  }
  if (startTime == "") startTime = oneMinuteFromNow;

  let oneMonthFromNow = BigNumber((Math.floor(Date.now()/1000)+ (30 * 24 * 60 * 60)));
  let endTime;
  if (typeof _stoConfig !== 'undefined' && _stoConfig.hasOwnProperty('endTime')) {
    endTime = _stoConfig.endTime;
  } else {
    endTime = readlineSync.question('Enter the end time for the STO (Unix Epoch time)\n(1 month from now = ' + oneMonthFromNow + ' ): ');
  }
  if (endTime == "") endTime = oneMonthFromNow;

  let wallet;
  if (typeof _stoConfig !== 'undefined' && _stoConfig.hasOwnProperty('wallet')) {
    wallet = _stoConfig.wallet;
  } else {
    wallet = readlineSync.question('Enter the address that will receive the funds from the STO (' + Issuer.address + '): ');
  }
  if (wallet == "") wallet = Issuer.address;

  let raiseType;
  if (typeof _stoConfig !== 'undefined' && _stoConfig.hasOwnProperty('raiseType')) {
    raiseType = [_stoConfig.raiseType];
  } else {
    raiseType = readlineSync.question('Enter' + chalk.green(` P `) + 'for POLY raise or leave empty for Ether raise (E):');
    if (raiseType.toUpperCase() == 'P' ) {
      raiseType = [1];
    } else {
      raiseType = [0];
    }
  }

  let rate;
  if (typeof _stoConfig !== 'undefined' && _stoConfig.hasOwnProperty('rate')) {
    rate = _stoConfig.rate;
  } else {
    rate = readlineSync.question(`Enter the rate (1 ${(raiseType == 1 ? 'POLY' : 'ETH')} = X ST) for the STO (1000): `);
  }
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

  let cappedSTOFactoryAddress = await contracts.getModuleFactoryAddressByName(securityToken.options.address, global.constants.MODULES_TYPES.STO, "CappedSTO");
  let addModuleAction = securityToken.methods.addModule(cappedSTOFactoryAddress, bytesSTO, new BigNumber(stoFee).times(new BigNumber(10).pow(18)), 0);
  let receipt = await common.sendTransaction(addModuleAction);
  let event = common.getEventFromLogs(securityToken._jsonInterface, receipt.logs, 'ModuleAdded');
  console.log(`STO deployed at address: ${event._module}`);

  STO_Address = event._module;
  let cappedSTOABI = abis.cappedSTO();
  currentSTO = new web3.eth.Contract(cappedSTOABI, STO_Address);
}

async function cappedSTO_status() {
  let displayStartTime = await currentSTO.methods.startTime().call();
  let displayEndTime = await currentSTO.methods.endTime().call();
  let displayRate = await currentSTO.methods.rate().call();
  let displayCap = await currentSTO.methods.cap().call();
  let displayWallet = await currentSTO.methods.wallet().call();
  let displayRaiseType;
  let displayFundsRaised;
  let displayWalletBalance;
  let raiseType = await currentSTO.methods.fundRaiseTypes(global.constants.FUND_RAISE_TYPES.ETH).call();
  if (raiseType) {
    displayRaiseType = 'ETH';
    displayFundsRaised = await currentSTO.methods.fundsRaised(global.constants.FUND_RAISE_TYPES.ETH).call();
    displayWalletBalance = web3.utils.fromWei(await web3.eth.getBalance(displayWallet));
  } else {
    displayRaiseType = 'POLY';
    displayFundsRaised = await currentSTO.methods.fundsRaised(global.constants.FUND_RAISE_TYPES.POLY).call();
    displayWalletBalance = await currentBalance(displayWallet);
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
    ***** STO Information *****
    - Address:           ${STO_Address}
    - Raise Cap:         ${web3.utils.fromWei(displayCap)} ${displayTokenSymbol.toUpperCase()}
    - Start Time:        ${new Date(displayStartTime * 1000)}
    - End Time:          ${new Date(displayEndTime * 1000)}
    - Raise Type:        ${displayRaiseType}
    - Rate:              1 ${displayRaiseType} = ${displayRate} ${displayTokenSymbol.toUpperCase()}
    - Wallet:            ${displayWallet}
    - Wallet Balance:    ${displayWalletBalance} ${displayRaiseType}
    --------------------------------------
    - ${timeTitle}    ${timeRemaining}
    - Funds raised:      ${web3.utils.fromWei(displayFundsRaised)} ${displayRaiseType}
    - Tokens sold:       ${web3.utils.fromWei(displayTokensSold)} ${displayTokenSymbol.toUpperCase()}
    - Tokens remaining:  ${formattedCap.minus(formattedSold).toNumber()} ${displayTokenSymbol.toUpperCase()}
    - Investor count:    ${displayInvestorCount}
  `);

  console.log(chalk.green(`\n${(await currentBalance(Issuer.address))} POLY balance remaining at issuer address ${Issuer.address}`));
}

////////////////////
// USD Tiered STO //
////////////////////
function fundingConfigUSDTieredSTO() {
  let funding = {};

  let selectedFunding;
  if (typeof _stoConfig !== 'undefined' && _stoConfig.hasOwnProperty('fundingType')) {
    selectedFunding = _stoConfig.fundingType;
  } else {
    selectedFunding = readlineSync.question('Enter' + chalk.green(` P `) + 'for POLY raise,' + chalk.green(` D `) + 'for DAI raise,' + chalk.green(` E `) + 'for Ether raise or any combination of them (i.e.'+ chalk.green(` PED `) + 'for all): ').toUpperCase();
  }

  funding.raiseType = [];
  if (selectedFunding.includes('E')) {
    funding.raiseType.push(global.constants.FUND_RAISE_TYPES.ETH);
  }
  if (selectedFunding.includes('P')) {
    funding.raiseType.push(global.constants.FUND_RAISE_TYPES.POLY);
  }
  if (selectedFunding.includes('D')) {
    funding.raiseType.push(global.constants.FUND_RAISE_TYPES.DAI);
  }
  if (funding.raiseType.length == 0) {
    funding.raiseType = [global.constants.FUND_RAISE_TYPES.ETH, global.constants.FUND_RAISE_TYPES.POLY, global.constants.FUND_RAISE_TYPES.DAI];
  }

  return funding;
}

function addressesConfigUSDTieredSTO(usdTokenRaise) {
  let addresses = {};

  if (typeof _stoConfig !== 'undefined' && _stoConfig.hasOwnProperty('wallet')) {
    addresses.wallet = _stoConfig.wallet;
  } else {
    addresses.wallet = readlineSync.question('Enter the address that will receive the funds from the STO (' + Issuer.address + '): ', {
      limit: function(input) {
        return web3.utils.isAddress(input);
      },
      limitMessage: "Must be a valid address",
      defaultInput: Issuer.address
    });
  }
  if (addresses.wallet == "") addresses.wallet = Issuer.address;

  if (typeof _stoConfig !== 'undefined' && _stoConfig.hasOwnProperty('reserveWallet')) {
    addresses.reserveWallet = _stoConfig.reserveWallet;
  } else {
    addresses.reserveWallet = readlineSync.question('Enter the address that will receive remaining tokens in the case the cap is not met (' + Issuer.address + '): ', {
      limit: function(input) {
        return web3.utils.isAddress(input);
      },
      limitMessage: "Must be a valid address",
      defaultInput: Issuer.address
    });
  }
  if (addresses.reserveWallet == "") addresses.reserveWallet = Issuer.address;

  if (usdTokenRaise) {
    if (typeof _stoConfig !== 'undefined' && _stoConfig.hasOwnProperty('usdToken')) {
      addresses.usdToken = _stoConfig.usdToken;
    } else {
      addresses.usdToken = readlineSync.question('Enter the address of the USD Token or stable coin (' + usdToken.options.address + '): ', {
        limit: function(input) {
          return web3.utils.isAddress(input);
        },
        limitMessage: "Must be a valid address",
        defaultInput: usdToken.options.address
      });
    }
    if (addresses.usdToken == "") addresses.usdToken = usdToken.options.address;
  } else {
    addresses.usdToken = '0x0000000000000000000000000000000000000000';
  } 

  return addresses;
}

function tiersConfigUSDTieredSTO(polyRaise) {
  let tiers = {};

  let defaultTiers = 3;
  if (typeof _stoConfig !== 'undefined' && _stoConfig.hasOwnProperty('numberOfTiers')) {
    tiers.tiers = _stoConfig.numberOfTiers;
  } else {
    tiers.tiers = readlineSync.questionInt(`Enter the number of tiers for the STO? (${defaultTiers}): `, {
      limit: function(input) {
        return input > 0;
      },
      limitMessage: 'Must be greater than zero',
      defaultInput: defaultTiers
    });
  }

  let defaultTokensPerTier = [190000000, 100000000, 200000000];
  let defaultRatePerTier = ['0.05', '0.10', '0.15'];
  let defaultTokensPerTierDiscountPoly = [90000000, 50000000, 100000000];
  let defaultRatePerTierDiscountPoly = ['0.025', '0.05', '0.075'];
  tiers.tokensPerTier = [];
  tiers.ratePerTier = [];
  tiers.tokensPerTierDiscountPoly = [];
  tiers.ratePerTierDiscountPoly = [];
  for (let i = 0; i < tiers.tiers; i++) {
    if (typeof _stoConfig !== 'undefined' && _stoConfig.hasOwnProperty('tokensPerTiers') && i < _stoConfig.tokensPerTiers.length) {
      tiers.tokensPerTier[i] = web3.utils.toWei(_stoConfig.tokensPerTiers[i].toString());
    } else {
      tiers.tokensPerTier[i] = web3.utils.toWei(readlineSync.question(`How many tokens do you plan to sell on tier No. ${i+1}? (${defaultTokensPerTier[i]}): `, {
        limit: function(input) {
          return parseFloat(input) > 0;
        },
        limitMessage: 'Must be greater than zero',
        defaultInput: defaultTokensPerTier[i]
      }));
    }

    if (typeof _stoConfig !== 'undefined' && _stoConfig.hasOwnProperty('ratePerTiers') && i < _stoConfig.ratePerTiers.length) {
      tiers.ratePerTier[i] = web3.utils.toWei(_stoConfig.ratePerTiers[i].toString());
    } else {
      tiers.ratePerTier[i] = web3.utils.toWei(readlineSync.question(`What is the USD per token rate for tier No. ${i+1}? (${defaultRatePerTier[i]}): `, {
        limit: function(input) {
          return parseFloat(input) > 0;
        },
        limitMessage: 'Must be greater than zero',
        defaultInput: defaultRatePerTier[i]
      }));
    }

    let isTPTDPDefined = (typeof _stoConfig !== 'undefined' && _stoConfig.hasOwnProperty('discountedTokensPerTiers') && i < _stoConfig.discountedTokensPerTiers.length); //If it's defined by config file
    let isRPTDPDefined = (typeof _stoConfig !== 'undefined' && _stoConfig.hasOwnProperty('discountedRatePerTiers') && i < _stoConfig.discountedRatePerTiers.length); //If it's defined by config file
    //If funds can be raised in POLY and discounts are defined in config file or are choosen by user
    if (polyRaise && ((isTPTDPDefined && isRPTDPDefined) || readlineSync.keyInYNStrict(`Do you plan to have a discounted rate for POLY investments for tier No. ${i+1}? `))) {
      if (isTPTDPDefined) {
        tiers.tokensPerTierDiscountPoly[i] = web3.utils.toWei(_stoConfig.discountedTokensPerTiers[i].toString());
      } else {
        tiers.tokensPerTierDiscountPoly[i] = web3.utils.toWei(readlineSync.question(`How many of those tokens do you plan to sell at discounted rate on tier No. ${i+1}? (${defaultTokensPerTierDiscountPoly[i]}): `, {
          limit: function(input) {
            return new BigNumber(web3.utils.toWei(input)).lte(tiers.tokensPerTier[i])
          },
          limitMessage: 'Must be less than the No. of tokens of the tier',
          defaultInput: defaultTokensPerTierDiscountPoly[i]
        }));
      }

      if (isRPTDPDefined) {
        tiers.ratePerTierDiscountPoly[i] = web3.utils.toWei(_stoConfig.discountedRatePerTiers[i].toString());
      } else {
        tiers.ratePerTierDiscountPoly[i] = web3.utils.toWei(readlineSync.question(`What is the discounted rate for tier No. ${i+1}? (${defaultRatePerTierDiscountPoly[i]}): `, {
          limit: function(input) {
            return new BigNumber(web3.utils.toWei(input)).lte(tiers.ratePerTier[i])
          },
          limitMessage: 'Must be less than the rate of the tier',
          defaultInput: defaultRatePerTierDiscountPoly[i]
        }));
      }
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
  if (typeof _stoConfig !== 'undefined' && _stoConfig.hasOwnProperty('startTime')) {
    times.startTime = _stoConfig.startTime;
  } else {
    times.startTime = readlineSync.questionInt('Enter the start time for the STO (Unix Epoch time)\n(1 minutes from now = ' + oneMinuteFromNow + ' ): ', {
      limit: function(input) {
        return input > Math.floor(Date.now() / 1000);
      },
      limitMessage: "Must be a future time",
      defaultInput: oneMinuteFromNow
    });
  }
  if (times.startTime == "") times.startTime = oneMinuteFromNow;

  let oneMonthFromNow = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
  if (typeof _stoConfig !== 'undefined' && _stoConfig.hasOwnProperty('endTime')) {
    times.endTime = _stoConfig.endTime;
  } else {
    times.endTime = readlineSync.questionInt('Enter the end time for the STO (Unix Epoch time)\n(1 month from now = ' + oneMonthFromNow + ' ): ', {
      limit: function(input) {
        return input > times.startTime;
      },
      limitMessage: "Must be greater than Start Time",
      defaultInput: oneMonthFromNow
    });
  }
  if (times.endTime == "") times.endTime = oneMonthFromNow;

  return times;
}

function limitsConfigUSDTieredSTO() {
  let limits = {};

  let defaultMinimumInvestment = 5;
  if (typeof _stoConfig !== 'undefined' && _stoConfig.hasOwnProperty('minimumInvestmentUSD')) {
    limits.minimumInvestmentUSD = web3.utils.toWei(_stoConfig.minimumInvestmentUSD.toString());
  } else {
    limits.minimumInvestmentUSD = web3.utils.toWei(readlineSync.question(`What is the minimum investment in USD? (${defaultMinimumInvestment}): `, {
      limit: function(input) {
        return parseInt(input) > 0;
      },
      limitMessage: "Must be greater than zero",
      defaultInput: defaultMinimumInvestment
    }));
  }

  let nonAccreditedLimit = 2500;
  if (typeof _stoConfig !== 'undefined' && _stoConfig.hasOwnProperty('nonAccreditedLimitUSD')) {
    limits.nonAccreditedLimitUSD = web3.utils.toWei(_stoConfig.nonAccreditedLimitUSD.toString());
  } else {
    limits.nonAccreditedLimitUSD = web3.utils.toWei(readlineSync.question(`What is the default limit for non accredited investors in USD? (${nonAccreditedLimit}): `, {
      limit: function(input) {
        return new BigNumber(web3.utils.toWei(input)).gte(limits.minimumInvestmentUSD);
      },
      limitMessage: "Must be greater than minimum investment",
      defaultInput: nonAccreditedLimit
    }));
  }

  return limits;
}

async function usdTieredSTO_launch() {
  console.log("\n");
  console.log('\x1b[34m%s\x1b[0m',"Token Creation - USD Tiered STO");

  let stoFee = usdTieredSTOFee;
  let contractBalance = await polyToken.methods.balanceOf(securityToken._address).call();
  let requiredAmount = web3.utils.toWei(stoFee.toString(), "ether");
  if (new web3.utils.BN(contractBalance).lt(new web3.utils.BN(requiredAmount))) {
    let transferAmount = (new web3.utils.BN(requiredAmount)).sub(new web3.utils.BN(contractBalance));
    let ownerBalance = new web3.utils.BN(await polyToken.methods.balanceOf(Issuer.address).call());
    if (ownerBalance.lt(transferAmount)) {
      console.log(chalk.red(`\n**************************************************************************************************************************************************`));
      console.log(chalk.red(`Not enough balance to pay the ${selectedSTO} fee, Requires ${web3.utils.fromWei(transferAmount)} POLY but have ${web3.utils.fromWei(ownerBalance)} POLY. Access POLY faucet to get the POLY to complete this txn`));
      console.log(chalk.red(`**************************************************************************************************************************************************\n`));
      process.exit(0);
    } else {
      let transferAction = polyToken.methods.transfer(securityToken._address, transferAmount);
      let receipt = await common.sendTransaction(transferAction, {factor: 2});
      let event = common.getEventFromLogs(polyToken._jsonInterface, receipt.logs, 'Transfer');
      console.log(`Number of POLY sent: ${web3.utils.fromWei(new web3.utils.BN(event._value))}`)
    }
  }

  let funding = fundingConfigUSDTieredSTO();
  let addresses = addressesConfigUSDTieredSTO(funding.raiseType.includes(global.constants.FUND_RAISE_TYPES.DAI));
  let tiers = tiersConfigUSDTieredSTO(funding.raiseType.includes(global.constants.FUND_RAISE_TYPES.POLY));
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

  let usdTieredSTOFactoryAddress = await contracts.getModuleFactoryAddressByName(securityToken.options.address, global.constants.MODULES_TYPES.STO, 'USDTieredSTO');
  let addModuleAction = securityToken.methods.addModule(usdTieredSTOFactoryAddress, bytesSTO, new BigNumber(stoFee).times(new BigNumber(10).pow(18)), 0);
  let receipt = await common.sendTransaction(addModuleAction);
  let event = common.getEventFromLogs(securityToken._jsonInterface, receipt.logs, 'ModuleAdded');
  console.log(`STO deployed at address: ${event._module}`);

  STO_Address = event._module;
  let usdTieredSTOABI = abis.usdTieredSTO();
  currentSTO = new web3.eth.Contract(usdTieredSTOABI,STO_Address);
}

async function usdTieredSTO_status() {
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
  for (const fundType in global.constants.FUND_RAISE_TYPES) {
    if (await currentSTO.methods.fundRaiseTypes(global.constants.FUND_RAISE_TYPES[fundType]).call()) {
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

      let mintedPerTier = await currentSTO.methods.mintedPerTier(global.constants.FUND_RAISE_TYPES[type], t).call();
      displayMintedPerTierPerType += `
        Sold for ${type}:\t\t   ${web3.utils.fromWei(mintedPerTier)} ${displayTokenSymbol} ${displayDiscountMinted}`;
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
    let walletBalanceUSD = web3.utils.fromWei(await currentSTO.methods.convertToUSD(global.constants.FUND_RAISE_TYPES[type], balance).call());
    displayWalletBalancePerType += `
        Balance ${type}:\t\t   ${walletBalance} ${type} (${walletBalanceUSD} USD)`;
    
    balance = await getBalance(displayReserveWallet, type);
    let reserveWalletBalance = web3.utils.fromWei(balance);
    let reserveWalletBalanceUSD = web3.utils.fromWei(await currentSTO.methods.convertToUSD(global.constants.FUND_RAISE_TYPES[type], balance).call());
    displayReserveWalletBalancePerType += `
        Balance ${type}:\t\t   ${reserveWalletBalance} ${type} (${reserveWalletBalanceUSD} USD)`;
    
    let fundsRaised = web3.utils.fromWei(await currentSTO.methods.fundsRaised(global.constants.FUND_RAISE_TYPES[type]).call());
    displayFundsRaisedPerType += `
        ${type}:\t\t\t   ${fundsRaised} ${type}`;

    //Only show sold for if more than one raise type are allowed
    if (raiseTypes.length > 1) {
      let tokensSoldPerType = web3.utils.fromWei(await currentSTO.methods.getTokensSoldFor(global.constants.FUND_RAISE_TYPES[type]).call());
      displayTokensSoldPerType += `
        Sold for ${type}:\t\t   ${tokensSoldPerType} ${displayTokenSymbol}`;
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
    ****************** STO Information ******************
    - Address:                     ${STO_Address}
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

    --------------------------------------
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

  console.log(chalk.green(`\n${(await currentBalance(Issuer.address))} POLY balance remaining at issuer address ${Issuer.address}`));
}

async function usdTieredSTO_configure() {
  console.log("\n");
  console.log('\x1b[34m%s\x1b[0m',"STO Configuration - USD Tiered STO");

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

    if (typeof _stoConfig === 'undefined') {
      let index = readlineSync.keyInSelect(options, 'What do you want to do?');
      switch (index) {
        case 0:
          let reserveWallet = await currentSTO.methods.reserveWallet().call();
          let isVerified = await securityToken.methods.verifyTransfer(STO_Address, reserveWallet, 0, web3.utils.fromAscii("")).call();
          if (isVerified == "2") {
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
          shell.exec(`${__dirname}/scripts/script.sh Accredit ${tokenSymbol} 75 ${global.constants.NETWORK}`);
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
          shell.exec(`${__dirname}/scripts/script.sh NonAccreditedLimit ${tokenSymbol} 75 ${global.constants.NETWORK}`);
          break;
        case 5:
          await modfifyTimes();
          await usdTieredSTO_status();
          break;
        case 6:
          await modfifyTiers();
          await usdTieredSTO_status();
          break;
        case 7:
          await modfifyAddresses();
          await usdTieredSTO_status();
          break;
        case 8:
          await modfifyLimits();
          await usdTieredSTO_status();
          break;
        case 9:
          await modfifyFunding();
          await usdTieredSTO_status();
          break;
      }
    }
  }
}

async function modfifyTimes() {
  let times = timesConfigUSDTieredSTO();
  let modifyTimesAction = currentSTO.methods.modifyTimes(times.startTime, times.endTime);
  await common.sendTransaction(modifyTimesAction);
}

async function modfifyLimits() {
  let limits = limitsConfigUSDTieredSTO();
  let modifyLimitsAction = currentSTO.methods.modifyLimits(limits.nonAccreditedLimitUSD, limits.minimumInvestmentUSD);
  await common.sendTransaction(modifyLimitsAction);
}

async function modfifyFunding() {
  let funding = fundingConfigUSDTieredSTO();
  let modifyFundingAction = currentSTO.methods.modifyFunding(funding.raiseType);
  await common.sendTransaction(modifyFundingAction);
}

async function modfifyAddresses() {
  let addresses = addressesConfigUSDTieredSTO(await currentSTO.methods.fundRaiseTypes(global.constants.FUND_RAISE_TYPES.DAI).call());
  let modifyAddressesAction = currentSTO.methods.modifyAddresses(addresses.wallet, addresses.reserveWallet, addresses.usdToken);
  await common.sendTransaction(modifyAddressesAction);
}

async function modfifyTiers() {
  let tiers = tiersConfigUSDTieredSTO(await currentSTO.methods.fundRaiseTypes(global.constants.FUND_RAISE_TYPES.POLY).call());
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

async function currentBalance(from) {
  let balance = await polyToken.methods.balanceOf(from).call();
  let balanceInPoly = new BigNumber(balance).dividedBy(new BigNumber(10).pow(18));
  return balanceInPoly;
}

async function selectTicker(includeCreate) {
  let result;
  let userTickers = (await securityTokenRegistry.methods.getTickersByOwner(Issuer.address).call()).map(function (t) {return web3.utils.hexToAscii(t)});
  let options = await Promise.all(userTickers.map(async function (t) {
    let tickerDetails = await securityTokenRegistry.methods.getTickerDetails(t).call();
    let tickerInfo = tickerDetails[4] ? 'Token launched' : `Expires at: ${moment.unix(tickerDetails[2]).format('MMMM Do YYYY, HH:mm:ss')}`;
    return `${t}
    ${tickerInfo}`;
  }));
  if (includeCreate) {
    options.push('Register a new ticker');
  }

  let index = readlineSync.keyInSelect(options, 'Select a ticker:');
  if (index == -1) {
    process.exit(0);
  } else if (includeCreate && index == options.length - 1) {
    result = readlineSync.question('Enter a symbol for your new ticker: ');
  } else {
    result = userTickers[index];
  }

  return result;
}

async function approvePoly(spender, fee) {
  polyBalance = await polyToken.methods.balanceOf(Issuer.address).call();
  let requiredAmount = web3.utils.toWei(fee.toString(), "ether");
  if (parseInt(polyBalance) >= parseInt(requiredAmount)) {
    let allowance = await polyToken.methods.allowance(spender, Issuer.address).call();
    if (allowance == web3.utils.toWei(fee.toString(), "ether")) {
      return true;
    } else {
      let approveAction = polyToken.methods.approve(spender, web3.utils.toWei(fee.toString(), "ether"));
      await common.sendTransaction(approveAction);
    }
  } else {
      let requiredBalance = parseInt(requiredAmount) - parseInt(polyBalance);
      console.log(chalk.red(`\n*****************************************************************************************************************************************`));
      console.log(chalk.red(`Not enough balance to Pay the Fee, Require ${(new BigNumber(requiredBalance).dividedBy(new BigNumber(10).pow(18))).toNumber()} POLY but have ${(new BigNumber(polyBalance).dividedBy(new BigNumber(10).pow(18))).toNumber()} POLY. Access POLY faucet to get the POLY to complete this txn`));
      console.log(chalk.red(`******************************************************************************************************************************************\n`));
      process.exit(0);
  }
}

module.exports = {
  executeApp: async function(tokenConfig, mintingConfig, stoConfig) {
    return executeApp(tokenConfig, mintingConfig, stoConfig);
  }
}
