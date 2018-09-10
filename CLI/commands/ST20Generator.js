var readlineSync = require('readline-sync');
var BigNumber = require('bignumber.js');
var chalk = require('chalk');
const shell = require('shelljs');
var contracts = require('./helpers/contract_addresses');
var abis = require('./helpers/contract_abis');
var common = require('./common/common_functions');
var global = require('./common/global');

let tickerRegistryAddress;
let securityTokenRegistryAddress;
let cappedSTOFactoryAddress;
let usdTieredSTOFactoryAddress;

///////////////////
// Crowdsale params
let tokenName;
let tokenSymbol;
let selectedSTO;

const regFee = 250;
const cappedSTOFee = 20000;
const usdTieredSTOFee = 100000;
const tokenDetails = "";
////////////////////////
// Artifacts
let tickerRegistry;
let securityTokenRegistry;
let polyToken;
let securityToken;
let generalTransferManager;
let currentSTO;
let cappedSTOFactory;
let usdTieredSTOFactory;

// App flow
let _tokenConfig;
let _mintingConfig;
let _stoConfig;

async function executeApp(tokenConfig, mintingConfig, stoConfig, remoteNetwork) {
  _tokenConfig = tokenConfig;
  _mintingConfig = mintingConfig;
  _stoConfig = stoConfig;

  await global.initialize(remoteNetwork);
 
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
    tickerRegistryAddress = await contracts.tickerRegistry();
    let tickerRegistryABI = abis.tickerRegistry();
    tickerRegistry = new web3.eth.Contract(tickerRegistryABI, tickerRegistryAddress);
    tickerRegistry.setProvider(web3.currentProvider);
    
    securityTokenRegistryAddress = await contracts.securityTokenRegistry();
    let securityTokenRegistryABI = abis.securityTokenRegistry();
    securityTokenRegistry = new web3.eth.Contract(securityTokenRegistryABI, securityTokenRegistryAddress);
    securityTokenRegistry.setProvider(web3.currentProvider);

    let polytokenAddress = await contracts.polyToken();
    let polytokenABI = abis.polyToken();
    polyToken = new web3.eth.Contract(polytokenABI, polytokenAddress);
    polyToken.setProvider(web3.currentProvider);

    cappedSTOFactoryAddress = await contracts.cappedSTOFactoryAddress();
    let cappedSTOFactoryABI = abis.cappedSTOFactory();
    cappedSTOFactory = new web3.eth.Contract(cappedSTOFactoryABI, cappedSTOFactoryAddress);
    cappedSTOFactory.setProvider(web3.currentProvider);

    usdTieredSTOFactoryAddress = await contracts.usdTieredSTOFactoryAddress();
    let usdTieredSTOFactoryABI = abis.cappedSTO();
    usdTieredSTOFactory = new web3.eth.Contract(usdTieredSTOFactoryABI, usdTieredSTOFactoryAddress);
    usdTieredSTOFactory.setProvider(web3.currentProvider);
  } catch (err) {
    console.log(err)
    console.log('\x1b[31m%s\x1b[0m',"There was a problem getting the contracts. Make sure they are deployed to the selected network.");
    process.exit(0);
  }
}

async function step_ticker_reg(){
  console.log("\n");
  console.log('\x1b[34m%s\x1b[0m',"Token Creation - Symbol Registration");

  let alreadyRegistered = false;
  let available = false;

  while (!available) {
    console.log(chalk.green(`\nRegistering the new token symbol requires 250 POLY & deducted from '${Issuer.address}', Current balance is ${(await currentBalance(Issuer.address))} POLY\n`));
    
    if (typeof _tokenConfig !== 'undefined' && _tokenConfig.hasOwnProperty('symbol')) {
      tokenSymbol = _tokenConfig.symbol;
    } else {
      tokenSymbol = readlineSync.question('Enter the symbol for your new token: '); 
    }

    await tickerRegistry.methods.getDetails(tokenSymbol).call({}, function(error, result){
      if (new BigNumber(result[1]).toNumber() == 0) {
        available = true;
      } else if (result[0] == Issuer.address) {
        console.log('\x1b[32m%s\x1b[0m',"Token Symbol has already been registered by you, skipping registration");
        available = true;
        alreadyRegistered = true;
      } else {
        console.log('\x1b[31m%s\x1b[0m',"Token Symbol has already been registered, please choose another symbol");
      }
    });
  }

  if (!alreadyRegistered) {
    await step_approval(tickerRegistryAddress, regFee);
    let registerTickerAction = tickerRegistry.methods.registerTicker(Issuer.address, tokenSymbol, "", web3.utils.asciiToHex(""));
    await common.sendTransaction(Issuer, registerTickerAction, defaultGasPrice);
  }
}

async function step_approval(spender, fee) {
  polyBalance = await polyToken.methods.balanceOf(Issuer.address).call();
  let requiredAmount = web3.utils.toWei(fee.toString(), "ether");
  if (parseInt(polyBalance) >= parseInt(requiredAmount)) {
    let allowance = await polyToken.methods.allowance(spender, Issuer.address).call();
    if (allowance == web3.utils.toWei(fee.toString(), "ether")) {
      return true;
    } else {
      let approveAction = polyToken.methods.approve(spender, web3.utils.toWei(fee.toString(), "ether"));
      await common.sendTransaction(Issuer, approveAction, defaultGasPrice);
    }
  } else {
      let requiredBalance = parseInt(requiredAmount) - parseInt(polyBalance);
      console.log(chalk.red(`\n*****************************************************************************************************************************************`));
      console.log(chalk.red(`Not enough balance to Pay the Fee, Require ${(new BigNumber(requiredBalance).dividedBy(new BigNumber(10).pow(18))).toNumber()} POLY but have ${(new BigNumber(polyBalance).dividedBy(new BigNumber(10).pow(18))).toNumber()} POLY. Access POLY faucet to get the POLY to complete this txn`));
      console.log(chalk.red(`******************************************************************************************************************************************\n`));
      process.exit(0);
  }
}

async function step_token_deploy(){
  // Let's check if token has already been deployed, if it has, skip to STO
  let tokenAddress = await securityTokenRegistry.methods.getSecurityTokenAddress(tokenSymbol).call();
  if (tokenAddress != "0x0000000000000000000000000000000000000000") {
    console.log('\x1b[32m%s\x1b[0m',"Token has already been deployed at address " + tokenAddress + ". Skipping registration");
    let securityTokenABI = abis.securityToken();
    securityToken = new web3.eth.Contract(securityTokenABI, tokenAddress);
  } else {
    console.log("\n");
    console.log(chalk.green(`Current balance in POLY is ${(await currentBalance(Issuer.address))}`));
    console.log("\n");
    console.log('\x1b[34m%s\x1b[0m',"Token Creation - Token Deployment");
    
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

    await step_approval(securityTokenRegistryAddress, regFee);
    let generateSecurityTokenAction = securityTokenRegistry.methods.generateSecurityToken(tokenName, tokenSymbol, web3.utils.fromAscii(tokenDetails), divisibility);
    let receipt = await common.sendTransaction(Issuer, generateSecurityTokenAction, defaultGasPrice);
    let event = common.getEventFromLogs(securityTokenRegistry._jsonInterface, receipt.logs, 'LogNewSecurityToken');
    console.log(`Deployed Token at address: ${event._securityTokenAddress}`);
    let securityTokenABI = abis.securityToken();
    securityToken = new web3.eth.Contract(securityTokenABI, event._securityTokenAddress);
  }
}

async function step_Wallet_Issuance(){
  let result = await securityToken.methods.getModule(3,0).call();
  let STOAddress = result[1];
  if (STOAddress != "0x0000000000000000000000000000000000000000") {
    console.log('\x1b[32m%s\x1b[0m',"STO has already been created at address " + STOAddress + ". Skipping initial minting");
  } else {
    let initialMint = await securityToken.getPastEvents('Transfer', {
      filter: {from: "0x0000000000000000000000000000000000000000"}, // Using an array means OR: e.g. 20 or 23
      fromBlock: 0,
      toBlock: 'latest'
    });
    if (initialMint.length > 0) {
      console.log('\x1b[32m%s\x1b[0m',web3.utils.fromWei(initialMint[0].returnValues.value,"ether") +" Tokens have already been minted for " + initialMint[0].returnValues.to + ". Skipping initial minting");
    } else {
      console.log("\n");
      console.log('\x1b[34m%s\x1b[0m',"Token Creation - Token Minting for Issuer");

      console.log("Before setting up the STO, you can mint any amount of tokens that will remain under your control or you can trasfer to affiliates");
      
      let multimint;
      if (typeof _mintingConfig !== 'undefined' && _mintingConfig.hasOwnProperty('multimint')) {
        multimint = _mintingConfig.multimint;
      } else {
        let isAffiliate = readlineSync.question('Press'+ chalk.green(` "Y" `) + 'if you have list of affiliates addresses with you otherwise hit' + chalk.green(' Enter ') + 'and get the minted tokens to a particular address: ');
        multimint = (isAffiliate == "Y" || isAffiliate == "y");
      }

      // Add address to whitelist
      let generalTransferManagerAddress;
      await securityToken.methods.getModule(2,0).call({}, function(error, result){
        generalTransferManagerAddress = result[1];
      });
      let generalTransferManagerABI = abis.generalTransferManager();
      generalTransferManager = new web3.eth.Contract(generalTransferManagerABI,generalTransferManagerAddress);
       
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

       let modifyWhitelistAction = generalTransferManager.methods.modifyWhitelist(mintWallet,Math.floor(Date.now()/1000),Math.floor(Date.now()/1000),Math.floor(Date.now()/1000 + 31536000), canBuyFromSTO);
        await common.sendTransaction(Issuer, modifyWhitelistAction, defaultGasPrice);

        // Mint tokens
        if (typeof _mintingConfig !== 'undefined' && _mintingConfig.hasOwnProperty('singleMint') && _mintingConfig.singleMint.hasOwnProperty('tokenAmount')) {
          issuerTokens = _mintingConfig.singleMint.tokenAmount;
        } else {
          issuerTokens = readlineSync.question('How many tokens do you plan to mint for the wallet you entered? (500.000): ');
        }
        if (issuerTokens == "") issuerTokens = '500000';
        
        let mintAction = securityToken.methods.mint(mintWallet, web3.utils.toWei(issuerTokens,"ether"));
        await common.sendTransaction(Issuer, mintAction, defaultGasPrice);
      }
    }
  }
}

async function multi_mint_tokens() {
  //await whitelist.startWhitelisting(tokenSymbol);
  shell.exec(`${__dirname}/scripts/script.sh Whitelist ${tokenSymbol} 75`);
  console.log(chalk.green(`\nCongrats! All the affiliates get succssfully whitelisted, Now its time to Mint the tokens\n`));
  console.log(chalk.red(`WARNING: `) + `Please make sure all the addresses that get whitelisted are only eligible to hold or get Security token\n`);

  shell.exec(`${__dirname}/scripts//script.sh Multimint ${tokenSymbol} 75`);
  console.log(chalk.green(`\nHurray!! Tokens get successfully Minted and transfered to token holders`));
}

async function step_STO_launch() {
  console.log("\n");
  console.log('\x1b[34m%s\x1b[0m',"Token Creation - STO Configuration");

  let result = await securityToken.methods.getModule(3,0).call();
  STO_Address = result[1];
  if(STO_Address != "0x0000000000000000000000000000000000000000") {
    selectedSTO = web3.utils.toAscii(result[0]).replace(/\u0000/g, '');
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
  let requiredAmount = web3.utils.toWei(stoFee.toString(), "ether");
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
      let receipt = await common.sendTransaction(Issuer, transferAction, defaultGasPrice);
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
    raiseType = _stoConfig.raiseType;
  } else {
    raiseType = readlineSync.question('Enter' + chalk.green(` P `) + 'for POLY raise or leave empty for Ether raise (E):');
    if (raiseType.toUpperCase() == 'P' ) {
      raiseType = 1;
    } else { 
      raiseType = 0;
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
        type: 'uint8',
        name: '_fundRaiseType'
      },{
        type: 'address',
        name: '_fundsReceiver'
      }
    ]
  }, [startTime, endTime, web3.utils.toWei(cap, 'ether'), rate, raiseType, wallet]);

  let addModuleAction = securityToken.methods.addModule(cappedSTOFactoryAddress, bytesSTO, new BigNumber(stoFee).times(new BigNumber(10).pow(18)), 0);
  let receipt = await common.sendTransaction(Issuer, addModuleAction, defaultGasPrice);
  let event = common.getEventFromLogs(securityToken._jsonInterface, receipt.logs, 'LogModuleAdded');
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
  let displayRaiseType = await currentSTO.methods.fundRaiseType(0).call() ? 'ETH' : 'POLY';
  let displayFundsRaised = await currentSTO.methods.fundsRaised().call();
  let displayTokensSold = await currentSTO.methods.tokensSold().call();
  let displayInvestorCount = await currentSTO.methods.investorCount().call();
  let displayTokenSymbol = await securityToken.methods.symbol().call();

  let displayWalletBalance = web3.utils.fromWei(await web3.eth.getBalance(displayWallet),"ether");
  let formattedCap = BigNumber(web3.utils.fromWei(displayCap,"ether"));
  let formattedSold = BigNumber(web3.utils.fromWei(displayTokensSold,"ether"));

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
    - Raise Cap:         ${web3.utils.fromWei(displayCap,"ether")} ${displayTokenSymbol.toUpperCase()}
    - Start Time:        ${new Date(displayStartTime * 1000)}
    - End Time:          ${new Date(displayEndTime * 1000)}
    - Raise Type:        ${displayRaiseType}
    - Rate:              1 ${displayRaiseType} = ${displayRate} ${displayTokenSymbol.toUpperCase()}
    - Wallet:            ${displayWallet}
    - Wallet Balance:    ${displayWalletBalance} ${displayRaiseType}
    --------------------------------------
    - ${timeTitle}    ${timeRemaining}
    - Funds raised:      ${web3.utils.fromWei(displayFundsRaised,"ether")} ${displayRaiseType}
    - Tokens sold:       ${web3.utils.fromWei(displayTokensSold,"ether")} ${displayTokenSymbol.toUpperCase()}
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
    selectedFunding = readlineSync.question('Enter' + chalk.green(` P `) + 'for POLY raise,' + chalk.green(` E `) + 'for Ether raise or' + chalk.green(` B `) + 'for both (B): ').toUpperCase();
  }

  if (selectedFunding == 'E') {
    funding.raiseType = [0];
  }
  else if (selectedFunding == 'P') {
    funding.raiseType = [1];
  }
  else {
    funding.raiseType = [0, 1];
  }

  return funding;
}

function addressesConfigUSDTieredSTO() {
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
    limits.nonAccreditedLimitUSD = web3.utils.toWei(readlineSync.question(`What is the default limit for non accredited insvestors in USD? (${nonAccreditedLimit}): `, {
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
  if (parseInt(contractBalance) < parseInt(requiredAmount)) {
    let transferAmount = parseInt(requiredAmount) - parseInt(contractBalance);
    let ownerBalance = await polyToken.methods.balanceOf(Issuer.address).call();
    if(parseInt(ownerBalance) < transferAmount) {
      console.log(chalk.red(`\n**************************************************************************************************************************************************`));
      console.log(chalk.red(`Not enough balance to pay the ${selectedSTO} fee, Requires ${(new BigNumber(transferAmount).dividedBy(new BigNumber(10).pow(18))).toNumber()} POLY but have ${(new BigNumber(ownerBalance).dividedBy(new BigNumber(10).pow(18))).toNumber()} POLY. Access POLY faucet to get the POLY to complete this txn`));
      console.log(chalk.red(`**************************************************************************************************************************************************\n`));
      process.exit(0);
    } else {
      let transferAction = polyToken.methods.transfer(securityToken._address, new BigNumber(transferAmount));
      let receipt = await common.sendTransaction(Issuer, transferAction, defaultGasPrice, 0, 1.5);
      let event = common.getEventFromLogs(polyToken._jsonInterface, receipt.logs, 'Transfer');
      console.log(`Number of POLY sent: ${web3.utils.fromWei(new web3.utils.BN(event._value))}`)
    }
  }
  
  let funding = fundingConfigUSDTieredSTO();
  let addresses = addressesConfigUSDTieredSTO();
  let tiers = tiersConfigUSDTieredSTO(funding.raiseType.includes(1));
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
    addresses.reserveWallet
  ]);

  let addModuleAction = securityToken.methods.addModule(usdTieredSTOFactoryAddress, bytesSTO, new BigNumber(stoFee).times(new BigNumber(10).pow(18)), 0);
  let receipt = await common.sendTransaction(Issuer, addModuleAction, defaultGasPrice);
  let event = common.getEventFromLogs(securityToken._jsonInterface, receipt.logs, 'LogModuleAdded');
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
  let ethRaise = await currentSTO.methods.fundRaiseType(0).call();
  let polyRaise = await currentSTO.methods.fundRaiseType(1).call();
  let displayWallet = await currentSTO.methods.wallet().call();
  let displayReserveWallet = await currentSTO.methods.reserveWallet().call();
  let displayTokensSold = web3.utils.fromWei(await currentSTO.methods.getTokensSold().call());
  let displayInvestorCount = await currentSTO.methods.investorCount().call();
  let displayIsFinalized = await currentSTO.methods.isFinalized().call() ? "YES" : "NO";
  let displayTokenSymbol = await securityToken.methods.symbol().call();

  let tiersLength = await currentSTO.methods.getNumberOfTiers().call();;

  let displayTiers = "";
  let displayMintedPerTier = "";
  for (let t = 0; t < tiersLength; t++) {
    let ratePerTier = await currentSTO.methods.ratePerTier(t).call();
    let tokensPerTierTotal = await currentSTO.methods.tokensPerTierTotal(t).call();
    let mintedPerTierTotal = await currentSTO.methods.mintedPerTierTotal(t).call();

    let displayMintedPerTierETH = "";
    if (ethRaise) {
      let mintedPerTierETH = await currentSTO.methods.mintedPerTierETH(t).call();

      displayMintedPerTierETH = `
        Sold for ETH:              ${web3.utils.fromWei(mintedPerTierETH)} ${displayTokenSymbol}`
    }

    let displayMintedPerTierPOLY = "";
    let displayDiscountTokens = "";
    let mintedPerTierDiscountPoly = "0";
    if (polyRaise) {
      let displayDiscountMinted = "";
      let tokensPerTierDiscountPoly = await currentSTO.methods.tokensPerTierDiscountPoly(t).call();
      if (tokensPerTierDiscountPoly > 0) {
        let ratePerTierDiscountPoly = await currentSTO.methods.ratePerTierDiscountPoly(t).call();
        mintedPerTierDiscountPoly = await currentSTO.methods.mintedPerTierDiscountPoly(t).call();

        displayDiscountTokens = `
        Tokens at discounted rate: ${web3.utils.fromWei(tokensPerTierDiscountPoly)} ${displayTokenSymbol}
        Discounted rate:           ${web3.utils.fromWei(ratePerTierDiscountPoly, 'ether')} USD per Token`;

        displayDiscountMinted = `(${web3.utils.fromWei(mintedPerTierDiscountPoly)} ${displayTokenSymbol} at discounted rate)`;
      }

      let mintedPerTierRegularPOLY = await currentSTO.methods.mintedPerTierRegularPoly(t).call();
      let mintedPerTierPOLYTotal = new BigNumber(web3.utils.fromWei(mintedPerTierRegularPOLY)).add(new BigNumber(web3.utils.fromWei(mintedPerTierDiscountPoly)));
      displayMintedPerTierPOLY = `
        Sold for POLY:             ${mintedPerTierPOLYTotal} ${displayTokenSymbol} ${displayDiscountMinted}`
    }

    displayTiers = displayTiers + `
    - Tier ${t+1}:
        Tokens:                    ${web3.utils.fromWei(tokensPerTierTotal, 'ether')} ${displayTokenSymbol}
        Rate:                      ${web3.utils.fromWei(ratePerTier, 'ether')} USD per Token`
        + displayDiscountTokens;
    displayMintedPerTier = displayMintedPerTier + `
    - Tokens minted in Tier ${t+1}:     ${web3.utils.fromWei(mintedPerTierTotal)} ${displayTokenSymbol}`
    + displayMintedPerTierETH
    + displayMintedPerTierPOLY;
  }

  let displayFundsRaisedUSD = web3.utils.fromWei(await currentSTO.methods.fundsRaisedUSD().call());

  let displayWalletBalanceETH = '';
  let displayReserveWalletBalanceETH = '';
  let displayFundsRaisedETH = '';
  let displayTokensSoldETH = '';
  if (ethRaise) {
    let balance = await web3.eth.getBalance(displayWallet);
    let walletBalanceETH = web3.utils.fromWei(balance, "ether");
    let walletBalanceETH_USD = web3.utils.fromWei(await currentSTO.methods.convertToUSD(web3.utils.fromAscii('ETH'), balance).call());
    displayWalletBalanceETH = `
        Balance ETH:               ${walletBalanceETH} ETH (${walletBalanceETH_USD} USD)`;
    balance = await web3.eth.getBalance(displayReserveWallet);
    let reserveWalletBalanceETH = web3.utils.fromWei(balance,"ether");
    let reserveWalletBalanceETH_USD = web3.utils.fromWei(await currentSTO.methods.convertToUSD(web3.utils.fromAscii('ETH'), balance).call());
    displayReserveWalletBalanceETH = `
        Balance ETH:               ${reserveWalletBalanceETH} ETH (${reserveWalletBalanceETH_USD} USD)`;
    let fundsRaisedETH = web3.utils.fromWei(await currentSTO.methods.fundsRaisedETH().call());
    displayFundsRaisedETH = `
        ETH:                       ${fundsRaisedETH} ETH`;

    //Only show sold for ETH if POLY raise is allowed too
    if (polyRaise) {
      let tokensSoldETH = web3.utils.fromWei(await currentSTO.methods.getTokensSoldForETH().call());
      displayTokensSoldETH = `
        Sold for ETH:              ${tokensSoldETH} ${displayTokenSymbol}`;
    }
  }

  let displayWalletBalancePOLY = '';
  let displayReserveWalletBalancePOLY = '';
  let displayFundsRaisedPOLY = '';
  let displayTokensSoldPOLY = '';
  if (polyRaise) {
    let walletBalancePOLY = await currentBalance(displayWallet);
    let walletBalancePOLY_USD = web3.utils.fromWei(await currentSTO.methods.convertToUSD(web3.utils.fromAscii('POLY'), web3.utils.toWei(walletBalancePOLY.toString())).call());
    displayWalletBalancePOLY = `
        Balance POLY               ${walletBalancePOLY} POLY (${walletBalancePOLY_USD} USD)`;
    let reserveWalletBalancePOLY = await currentBalance(displayReserveWallet);
    let reserveWalletBalancePOLY_USD = web3.utils.fromWei(await currentSTO.methods.convertToUSD(web3.utils.fromAscii('POLY'), web3.utils.toWei(reserveWalletBalancePOLY.toString())).call());
    displayReserveWalletBalancePOLY = `
        Balance POLY               ${reserveWalletBalancePOLY} POLY (${reserveWalletBalancePOLY_USD} USD)`;
    let fundsRaisedPOLY = web3.utils.fromWei(await currentSTO.methods.fundsRaisedPOLY().call());
    displayFundsRaisedPOLY = `
        POLY:                      ${fundsRaisedPOLY} POLY`;

    //Only show sold for POLY if ETH raise is allowed too
    if (ethRaise) {
      let tokensSoldPOLY = web3.utils.fromWei(await currentSTO.methods.getTokensSoldForPOLY().call());
      displayTokensSoldPOLY = `
        Sold for POLY:             ${tokensSoldPOLY} ${displayTokenSymbol}`;
    }
  }

  let displayRaiseType;
  if (ethRaise && polyRaise) {
    displayRaiseType = "ETH and POLY";
  } else if (ethRaise) {
    displayRaiseType = "ETH";
  } else if (polyRaise) {
    displayRaiseType = "POLY";
  } else {
    displayRaiseType = "NONE"
  }

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
    + displayWalletBalanceETH
    + displayWalletBalancePOLY + `
    - Reserve Wallet:              ${displayReserveWallet}`
    + displayReserveWalletBalanceETH
    + displayReserveWalletBalancePOLY + `

    --------------------------------------
    - ${timeTitle}              ${timeRemaining}
    - Is Finalized:                ${displayIsFinalized}
    - Tokens Sold:                 ${displayTokensSold} ${displayTokenSymbol}`
    + displayTokensSoldETH
    + displayTokensSoldPOLY + `
    - Current Tier:                ${displayCurrentTier}`
    + displayMintedPerTier + `
    - Investor count:              ${displayInvestorCount}
    - Funds Raised`
    + displayFundsRaisedETH
    + displayFundsRaisedPOLY + `
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
          let isVerified = await generalTransferManager.methods.verifyTransfer(STO_Address, reserveWallet, 0, false).call();
          if (isVerified == "2") {
            if (readlineSync.keyInYNStrict()) { 
              let finalizeAction = currentSTO.methods.finalize();
              await common.sendTransaction(Issuer, finalizeAction, defaultGasPrice);
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
          await common.sendTransaction(Issuer, changeAccreditedAction, defaultGasPrice);
          break;
        case 2:
          shell.exec(`${__dirname}/scripts/script.sh Accredit ${tokenSymbol} 75`);
          break;
        case 3:
          let account = readlineSync.question('Enter the address to change non accredited limit: ');
          let limit = readlineSync.question(`Enter the limit in USD: `);
          let accounts = [account];
          let limits = [web3.utils.toWei(limit)];
          let changeNonAccreditedLimitAction = currentSTO.methods.changeNonAccreditedLimit(accounts, limits);
          // 2 GAS?
          await common.sendTransaction(Issuer, changeNonAccreditedLimitAction, defaultGasPrice);
          break;
        case 4:
          shell.exec(`${__dirname}/scripts/script.sh NonAccreditedLimit ${tokenSymbol} 75`);
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
  await common.sendTransaction(Issuer, modifyTimesAction, defaultGasPrice);
}

async function modfifyLimits() {
  let limits = limitsConfigUSDTieredSTO();
  let modifyLimitsAction = currentSTO.methods.modifyLimits(limits.nonAccreditedLimitUSD, limits.minimumInvestmentUSD);
  await common.sendTransaction(Issuer, modifyLimitsAction, defaultGasPrice);
}

async function modfifyFunding() {
  let funding = fundingConfigUSDTieredSTO();
  let modifyFundingAction = currentSTO.methods.modifyFunding(funding.raiseType);
  await common.sendTransaction(Issuer, modifyFundingAction, defaultGasPrice);
}

async function modfifyAddresses() {
  let addresses = addressesConfigUSDTieredSTO();
  let modifyAddressesAction = currentSTO.methods.modifyAddresses(addresses.wallet, addresses.reserveWallet);
  await common.sendTransaction(Issuer, modifyAddressesAction, defaultGasPrice);
}

async function modfifyTiers() {
  let tiers = tiersConfigUSDTieredSTO(await currentSTO.methods.fundRaiseType(1).call());
  let modifyTiersAction = currentSTO.methods.modifyTiers(
    tiers.ratePerTier,
    tiers.ratePerTierDiscountPoly,
    tiers.tokensPerTier,
    tiers.tokensPerTierDiscountPoly,
  );
  await common.sendTransaction(Issuer, modifyTiersAction, defaultGasPrice);
}

//////////////////////
// HELPER FUNCTIONS //
//////////////////////
async function currentBalance(from) {
    let balance = await polyToken.methods.balanceOf(from).call();
    let balanceInPoly = new BigNumber(balance).dividedBy(new BigNumber(10).pow(18));
    return balanceInPoly;
}

module.exports = {
  executeApp: async function(tokenConfig, mintingConfig, stoConfig, remoteNetwork) {
        return executeApp(tokenConfig, mintingConfig, stoConfig, remoteNetwork);
    }
}
