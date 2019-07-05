const readlineSync = require('readline-sync');
const BigNumber = require('bignumber.js');
const moment = require('moment');
const chalk = require('chalk');
const tokenManager = require('./token_manager');
const contracts = require('./helpers/contract_addresses');
const abis = require('./helpers/contract_abis');
const common = require('./common/common_functions');
const input = require('./IO/input');

//
let securityTokenRegistryAddress;
let tokenSymbol;
let tokenLaunched;

// Artifacts
let securityTokenRegistry;
let polyToken;

async function executeApp (_ticker, _transferOwnership, _name, _details, _divisible) {
  common.logAsciiBull();
  console.log("********************************************");
  console.log("Welcome to the Command-Line ST-20 Generator.");
  console.log("********************************************");
  console.log("The following script will create a new ST-20 according to the parameters you enter.");
  console.log("Issuer Account: " + Issuer.address + "\n");

  await setup();

  try {
    await step_ticker_registration(_ticker);
    if (!tokenLaunched) {
      await step_transfer_ticker_ownership(_transferOwnership);
      await step_token_deploy(_name, _details, _divisible);
    }
    if (typeof _divisible === 'undefined') {
      await tokenManager.executeApp(tokenSymbol);
    }
  } catch (err) {
    console.log(err);
  }
};

async function setup () {
  try {
    securityTokenRegistryAddress = await contracts.securityTokenRegistry();
    let iSecurityTokenRegistryABI = abis.iSecurityTokenRegistry();
    securityTokenRegistry = new web3.eth.Contract(iSecurityTokenRegistryABI, securityTokenRegistryAddress);
    securityTokenRegistry.setProvider(web3.currentProvider);

    let polytokenAddress = await contracts.polyToken();
    let polytokenABI = abis.polyToken();
    polyToken = new web3.eth.Contract(polytokenABI, polytokenAddress);
    polyToken.setProvider(web3.currentProvider);
  } catch (err) {
    console.log(err)
    console.log(chalk.red('\nThere was a problem getting the contracts. Make sure they are deployed to the selected network.'));
    process.exit(0);
  }
}

async function step_ticker_registration (_ticker) {
  console.log(chalk.blue('\nToken Symbol Registration'));

  let available = false;
  while (!available) {
    const regFee = await securityTokenRegistry.methods.getFees(web3.utils.keccak256('tickerRegFee')).call();
    const polyFee = web3.utils.fromWei(regFee.polyFee);
    const usdFee = web3.utils.fromWei(regFee.usdFee);

    console.log(chalk.yellow(`\nRegistering the new token symbol requires ${polyFee} POLY (${usdFee} USD) & deducted from '${Issuer.address}', Current balance is ${(web3.utils.fromWei(await polyToken.methods.balanceOf(Issuer.address).call()))} POLY\n`));

    if (typeof _ticker !== 'undefined') {
      tokenSymbol = _ticker;
      console.log(`Token Symbol: ${tokenSymbol}`);
    } else {
      tokenSymbol = await selectTicker();
    }

    let details = await securityTokenRegistry.methods.getTickerDetails(tokenSymbol).call();
    if (new BigNumber(details[1]).toNumber() === 0) {
      // If it has no registration date, it is available
      available = true;
      await approvePoly(securityTokenRegistryAddress, polyFee);
      let registerTickerAction = securityTokenRegistry.methods.registerTicker(Issuer.address, tokenSymbol, "");
      await common.sendTransaction(registerTickerAction, { factor: 1.5 });
    } else if (details[0] === Issuer.address) {
      // If it has registration date and its owner is Issuer
      available = true;
      tokenLaunched = details[4];
    } else {
      // If it has registration date and its owner is not Issuer
      console.log(chalk.yellow('\nToken Symbol has already been registered, please choose another symbol'));
    }
  }
}

async function step_transfer_ticker_ownership (_transferOwnership) {
  let newOwner = null;
  if (typeof _transferOwnership !== 'undefined' && _transferOwnership !== 'false') {
    newOwner = _transferOwnership;
    console.log(`Transfer ownership to: ${newOwner}`);
  } else if (_transferOwnership !== 'false' && readlineSync.keyInYNStrict(`Do you want to transfer the ownership of ${tokenSymbol} ticker?`)) {
    newOwner = input.readAddress('Enter the address that will be the new owner: ');
  }

  if (newOwner) {
    let transferTickerOwnershipAction = securityTokenRegistry.methods.transferTickerOwnership(newOwner, tokenSymbol);
    let receipt = await common.sendTransaction(transferTickerOwnershipAction, { factor: 1.5 });
    let event = common.getEventFromLogs(securityTokenRegistry._jsonInterface, receipt.logs, 'ChangeTickerOwnership');
    console.log(chalk.green(`Ownership trasferred successfully. The new owner is ${event._newOwner}`));
    process.exit(0);
  }
}

async function step_token_deploy (_name, _details, _divisible) {
  console.log(chalk.blue('\nToken Creation - Token Deployment'));

  const launchFee = await securityTokenRegistry.methods.getFees(web3.utils.keccak256('stLaunchFee')).call();
  const polyFee = web3.utils.fromWei(launchFee.polyFee);
  const usdFee = web3.utils.fromWei(launchFee.usdFee);
  console.log(chalk.yellow(`\nToken deployment requires ${polyFee} POLY (${usdFee} USD) & deducted from '${Issuer.address}', Current balance is ${(web3.utils.fromWei(await polyToken.methods.balanceOf(Issuer.address).call()))} POLY\n`));

  let tokenName;
  if (typeof _name !== 'undefined') {
    tokenName = _name;
    console.log(`Token Name: ${tokenName}`);
  } else {
    tokenName = readlineSync.question('Enter the name for your new token: ', { defaultInput: 'default' });
  }

  let tokenDetails;
  if (typeof _details !== 'undefined') {
    tokenDetails = _details;
    console.log(`Token details: ${tokenDetails.toString()}`)
  } else {
    tokenDetails = readlineSync.question('Enter off-chain details of the token (i.e. Dropbox folder url): ');
  }

  let divisibility;
  if (typeof _divisible !== 'undefined') {
    divisibility = _divisible.toString() === 'true';
    console.log(`Divisible: ${divisibility.toString()}`)
  } else {
    let divisible = readlineSync.question('Press "N" for Non-divisible type token or hit Enter for divisible type token (Default): ');
    divisibility = (divisible !== 'N' && divisible !== 'n');
  }

  let treasuryWallet = input.readAddress('Enter the treasury address for the token (' + Issuer.address + '): ', Issuer.address);
  await approvePoly(securityTokenRegistryAddress, polyFee);
  let generateSecurityTokenAction = securityTokenRegistry.methods.generateNewSecurityToken(tokenName, tokenSymbol, tokenDetails, divisibility, treasuryWallet, 0);
  let receipt = await common.sendTransaction(generateSecurityTokenAction);
  let event = common.getEventFromLogs(securityTokenRegistry._jsonInterface, receipt.logs, 'NewSecurityToken');
  console.log(chalk.green(`Security Token has been successfully deployed at address ${event._securityTokenAddress}`));
}

// HELPER FUNCTIONS //
async function selectTicker () {
  let result;
  let userTickers = (await securityTokenRegistry.methods.getTickersByOwner(Issuer.address).call()).map(t => web3.utils.hexToUtf8(t));
  let options = await Promise.all(userTickers.map(async function (t) {
    let tickerDetails = await securityTokenRegistry.methods.getTickerDetails(t).call();
    let tickerInfo;
    if (tickerDetails[4]) {
      tickerInfo = `- Token launched at ${(await securityTokenRegistry.methods.getSecurityTokenAddress(t).call())}`;
    } else {
      tickerInfo = `- Expires at ${moment.unix(tickerDetails[2]).format('MMMM Do YYYY, HH:mm:ss')}`;
    }
    return `${t} ${tickerInfo}`;
  }));
  options.push('Register a new ticker');

  let index = readlineSync.keyInSelect(options, 'Select a ticker:');
  if (index === -1) {
    process.exit(0);
  } else if (index === options.length - 1) {
    result = readlineSync.question('Enter a symbol for your new ticker: ');
  } else {
    result = userTickers[index];
  }

  return result;
}

async function approvePoly (spender, fee) {
  polyBalance = await polyToken.methods.balanceOf(Issuer.address).call();
  let requiredAmount = web3.utils.toWei(fee.toString());
  if (parseInt(polyBalance) >= parseInt(requiredAmount)) {
    let allowance = await polyToken.methods.allowance(Issuer.address, spender).call();
    if (parseInt(allowance) >= parseInt(requiredAmount)) {
      return true;
    } else {
      let approveAction = polyToken.methods.approve(spender, requiredAmount);
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
  executeApp: async function (ticker, transferOwnership, name, details, divisible) {
    return executeApp(ticker, transferOwnership, name, details, divisible);
  }
}
