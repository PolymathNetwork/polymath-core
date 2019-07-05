var readlineSync = require('readline-sync');
var chalk = require('chalk');
var common = require('./common/common_functions');
var gbl = require('./common/global');
var contracts = require('./helpers/contract_addresses');
var abis = require('./helpers/contract_abis');
const input = require('./IO/input');
const { table } = require('table');
const moment = require('moment');

// App flow
let currentContract = null;

async function executeApp () {
  common.logAsciiBull();
  console.log("*********************************************");
  console.log("Welcome to the Command-Line Contract Manager.");
  console.log("*********************************************");
  console.log("Issuer Account: " + Issuer.address + "\n");

  // await setup();
  try {
    await selectContract();
  } catch (err) {
    console.log(err);
  }
};

async function selectContract () {
  console.log('\n\x1b[34m%s\x1b[0m', "Contract Manager - Contract selection");
  let contractList = ['PolymathRegistry', 'FeatureRegistry', 'SecurityTokenRegistry', 'ModuleRegistry'];

  while (!currentContract) {
    let index = readlineSync.keyInSelect(contractList, `Select a contract: `);
    let selected = index === -1 ? 'CANCEL' : contractList[index];
    switch (selected) {
      case 'PolymathRegistry':
        console.log(chalk.red(`
    *********************************
    This option is not yet available.
    *********************************`));
        break;
      case 'FeatureRegistry':
        console.log(chalk.red(`
    *********************************
    This option is not yet available.
    *********************************`));
        break;
      case 'SecurityTokenRegistry':
        let strAdress = await contracts.securityTokenRegistry();
        let strABI = abis.iSecurityTokenRegistry();
        currentContract = new web3.eth.Contract(strABI, strAdress);
        await strActions();
        break;
      case 'ModuleRegistry':
        console.log(chalk.red(`
      *********************************
      This option is not yet available.
      *********************************`));
        break;
      case 'CANCEL':
        process.exit(0);
    }
  }
}

async function strActions () {
  console.log('\n\x1b[34m%s\x1b[0m', "Security Token Registry - Main menu");

  const tokensGenerated = await currentContract.methods.getTokens().call();
  const latestProtocolVersion = await currentContract.methods.getLatestProtocolVersion().call();
  const expiryLimit = Math.floor(parseInt(await currentContract.methods.getExpiryLimit().call()) / 60 / 60 / 24);
  const areFeesInPoly = await currentContract.methods.getIsFeeInPoly().call();
  const tickerRegFee = await currentContract.methods.getFees(web3.utils.keccak256('tickerRegFee')).call();
  const stLaunchFee = await currentContract.methods.getFees(web3.utils.keccak256('stLaunchFee')).call();
  console.log(`Tokens generated:            ${tokensGenerated.length}`);
  console.log(`Latest protocol version:     ${latestProtocolVersion[0]}.${latestProtocolVersion[1]}.${latestProtocolVersion[2]}`);
  console.log(`Current expiry limit:        ${expiryLimit} days`);
  console.log(`Fees:`);
  if (areFeesInPoly) {
    console.log(`  - Ticker registration:     ${web3.utils.fromWei(tickerRegFee.polyFee)} POLY`);
    console.log(`  - ST launch:               ${web3.utils.fromWei(stLaunchFee.polyFee)} POLY`);
  } else {
    console.log(`  - Ticker registration:     ${web3.utils.fromWei(tickerRegFee.usdFee)} USD`);
    console.log(`  - ST launch:               ${web3.utils.fromWei(stLaunchFee.usdFee)} USD`);
  }

  let contractOwner = await currentContract.methods.owner().call();
  if (contractOwner !== Issuer.address) {
    console.log(chalk.red(`You are not the owner of this contract. Current owner is ${contractOwner}`));
    currentContract = null;
  } else {
    let actions = ['Modify Ticker', 'Remove Ticker', 'Modify SecurityToken', 'Change Expiry Limit', 'Change registration fee', 'Change ST launch fee', 'Change fee type', 'Get all token details'];
    let index = readlineSync.keyInSelect(actions, 'What do you want to do? ');
    let selected = index === -1 ? 'CANCEL' : actions[index];
    switch (selected) {
      case 'Modify Ticker':
        let tickerToModify = readlineSync.question('Enter the token symbol that you want to add or modify: ');
        let tickerToModifyDetails = await currentContract.methods.getTickerDetails(tickerToModify).call();
        if (tickerToModifyDetails[1] === 0) {
          console.log(chalk.yellow(`${tickerToModify} is not registered.`));
        } else {
          console.log(`\n-- Current Ticker details --`);
          console.log(`  Owner: ${tickerToModifyDetails[0]}`);
          console.log(`  Registration date: ${tickerToModifyDetails[1]}`);
          console.log(`  Expiry date: ${tickerToModifyDetails[2]}`);
          console.log(`  Token name: ${tickerToModifyDetails[3]}`);
          console.log(`  Status: ${tickerToModifyDetails[4] ? 'Deployed' : 'Not deployed'}\n`);
        }
        let tickerOwner = input.readAddress(`Enter the token owner: `);
        let tickerSTName = readlineSync.question(`Enter the token name: `);
        let tickerRegistrationDate = readlineSync.question(`Enter the Unix Epoch time on which ticker get registered: `);
        let tickerExpiryDate = readlineSync.question(`Enter the Unix Epoch time on wich the ticker will expire: `);
        let tickerStatus = readlineSync.keyInYNStrict(`Is the token deployed?`);
        let modifyTickerAction = currentContract.methods.modifyTicker(tickerOwner, tickerToModify, tickerSTName, tickerRegistrationDate, tickerExpiryDate, tickerStatus);
        await common.sendTransaction(modifyTickerAction, { factor: 1.5 });
        console.log(chalk.green(`Ticker has been updated successfully`));
        break;
      case 'Remove Ticker':
        let tickerToRemove = readlineSync.question('Enter the token symbol that you want to remove: ');
        let tickerToRemoveDetails = await currentContract.methods.getTickerDetails(tickerToRemove).call();
        if (tickerToRemoveDetails[1] === 0) {
          console.log(chalk.yellow(`${tickerToRemove} does not exist.`));
        } else {
          let removeTickerAction = currentContract.methods.removeTicker(tickerToRemove);
          await common.sendTransaction(removeTickerAction, { factor: 3 });
          console.log(chalk.green(`Ticker has been removed successfully`));
        }
        break;
      case 'Modify SecurityToken':
        let stAddress = input.readAddress('Enter the security token address that you want to add or modify: ');
        let ticker;
        let stData = await currentContract.methods.getSecurityTokenData(stAddress).call();
        if (stData[1] === '0x0000000000000000000000000000000000000000') {
          console.log(chalk.yellow(`Currently there are no security token registered at ${stAddress}`));
          ticker = readlineSync.question('Enter the token symbol that you want to register: ');
        } else {
          ticker = stData[0];
          console.log(`\n-- Current Security Token data --`);
          console.log(`  Ticker: ${stData[0]}`);
          console.log(`  Token details: ${stData[2]}`);
          console.log(`  Deployed at: ${stData[3]}`);
        }
        let tickerDetails = await currentContract.methods.getTickerDetails(ticker).call();
        if (tickerDetails[1] === 0) {
          console.log(chalk.yellow(`${ticker} is not registered.`));
        } else {
          console.log(`-- Current Ticker details --`);
          console.log(`  Owner: ${tickerDetails[0]}`);
          console.log(`  Token name: ${tickerDetails[3]}\n`);
        }
        let name = readlineSync.question(`Enter the token name: `);
        let owner = input.readAddress('Enter the token owner: ');
        let tokenDetails = readlineSync.question(`Enter the token details: `);
        let deployedAt = readlineSync.questionInt(`Enter the Unix Epoch timestamp at which security token was deployed: `);
        let modifySTAction = currentContract.methods.modifySecurityToken(name, ticker, owner, stAddress, tokenDetails, deployedAt);
        await common.sendTransaction(modifySTAction, { factor: 1.5 });
        console.log(chalk.green(`Security Token has been updated successfully`));
        break;
      case 'Change Expiry Limit':
        let newExpiryLimit = gbl.constants.DURATION.days(readlineSync.questionInt('Enter a new value in days for expiry limit: '));
        let changeExpiryLimitAction = currentContract.methods.changeExpiryLimit(newExpiryLimit);
        let changeExpiryLimitReceipt = await common.sendTransaction(changeExpiryLimitAction);
        let changeExpiryLimitEvent = common.getEventFromLogs(currentContract._jsonInterface, changeExpiryLimitReceipt.logs, 'ChangeExpiryLimit');
        console.log(chalk.green(`Expiry limit was changed successfully. New limit is ${Math.floor(parseInt(changeExpiryLimitEvent._newExpiry) / 60 / 60 / 24)} days\n`));
        break;
      case 'Change registration fee':
        let newRegFee;
        if (areFeesInPoly) {
          console.log(chalk.yellow("\nFee is set in POLY"));
          console.log(chalk.yellow(`Current ticker registration fee is ${web3.utils.fromWei(tickerRegFee.polyFee)} POLY (= ${web3.utils.fromWei(tickerRegFee.usdFee)} USD)`));
          newRegFee = web3.utils.toWei(readlineSync.questionInt('Enter a new value in POLY for ticker registration fee: ').toString());
        } else {
          console.log(chalk.yellow("\nFee is set in USD"));
          console.log(chalk.yellow(`Current ticker registration fee is ${web3.utils.fromWei(tickerRegFee.usdFee)} USD (= ${web3.utils.fromWei(tickerRegFee.polyFee)} POLY)`));
          newRegFee = web3.utils.toWei(readlineSync.questionInt('Enter a new value in USD for ticker registration fee: ').toString());
        }
        let changeRegFeeAction = currentContract.methods.changeTickerRegistrationFee(newRegFee);
        let changeRegFeeReceipt = await common.sendTransaction(changeRegFeeAction);
        let changeRegFeeEvent = common.getEventFromLogs(currentContract._jsonInterface, changeRegFeeReceipt.logs, 'ChangeTickerRegistrationFee');
        console.log(chalk.green(`Fee was changed successfully. New fee is ${web3.utils.fromWei(changeRegFeeEvent._newFee)} ${(areFeesInPoly) ? "POLY" : "USD"}\n`));
        break;
      case 'Change ST launch fee':
        let newLaunchFee;
        if (areFeesInPoly) {
          console.log(chalk.yellow("\nFee is set in POLY"));
          console.log(chalk.yellow(`Current ST launch fee is ${web3.utils.fromWei(stLaunchFee.polyFee)} POLY (= ${web3.utils.fromWei(stLaunchFee.usdFee)} USD)`));
          newLaunchFee = web3.utils.toWei(readlineSync.questionInt('Enter a new value in POLY for ST launch fee: ').toString());
        } else {
          console.log(chalk.yellow("\nFee is set in USD"));
          console.log(chalk.yellow(`Current ST launch fee is ${web3.utils.fromWei(stLaunchFee.usdFee)} USD (= ${web3.utils.fromWei(stLaunchFee.polyFee)} POLY)`));
          newLaunchFee = web3.utils.toWei(readlineSync.questionInt('Enter a new value in USD for ST launch fee: ').toString());
        }
        let changeLaunchFeeAction = currentContract.methods.changeSecurityLaunchFee(newLaunchFee);
        let changeLaunchFeeReceipt = await common.sendTransaction(changeLaunchFeeAction);
        let changeLaunchFeeEvent = common.getEventFromLogs(currentContract._jsonInterface, changeLaunchFeeReceipt.logs, 'ChangeSecurityLaunchFee');
        console.log(chalk.green(`Fee was changed successfully. New fee is ${web3.utils.fromWei(changeLaunchFeeEvent._newFee)} ${(areFeesInPoly) ? "POLY" : "USD"}\n`));
        break;
      case 'Change fee type':
        let changeFeeType = readlineSync.keyInYNStrict(`\nFees are currently set in ${(areFeesInPoly) ? "POLY" : "USD"}. Do you want to change to ${(areFeesInPoly) ? "USD" : "POLY"}`);
        if (changeFeeType) {
          let newRegFee = web3.utils.toWei(readlineSync.questionInt(`Enter a new ticker registration fee in ${(areFeesInPoly) ? "USD" : "POLY"}: `).toString());
          let newLaunchFee = web3.utils.toWei(readlineSync.questionInt(`Enter a new ST launch fee in ${(areFeesInPoly) ? "USD" : "POLY"}: `).toString());
          let changeFeesAmountAndCurrencyAction = currentContract.methods.changeFeesAmountAndCurrency(newRegFee, newLaunchFee, !areFeesInPoly);
          let changeFeesAmountAndCurrencyReceipt = await common.sendTransaction(changeFeesAmountAndCurrencyAction);
          let changeFeeCurrencyEvent = common.getEventFromLogs(currentContract._jsonInterface, changeFeesAmountAndCurrencyReceipt.logs, 'ChangeFeeCurrency');
          let changeRegFeeEvent = common.getEventFromLogs(currentContract._jsonInterface, changeFeesAmountAndCurrencyReceipt.logs, 'ChangeTickerRegistrationFee');
          let changeLaunchFeeEvent = common.getEventFromLogs(currentContract._jsonInterface, changeFeesAmountAndCurrencyReceipt.logs, 'ChangeSecurityLaunchFee');
          console.log(chalk.green(`Fee type was changed successfully. New fee type is ${(changeFeeCurrencyEvent._isFeeInPoly) ? "POLY" : "USD"}`));
          console.log(chalk.green(`New ticker registration fee is ${web3.utils.fromWei(changeRegFeeEvent._newFee)} ${(changeFeeCurrencyEvent._isFeeInPoly) ? "POLY" : "USD"}`));
          console.log(chalk.green(`New token launch fee is ${web3.utils.fromWei(changeLaunchFeeEvent._newFee)} ${(changeFeeCurrencyEvent._isFeeInPoly) ? "POLY" : "USD"}\n`));
        } else {
          console.log(chalk.yellow("\nFee type was not changed\n"));
        }
        break;
      case 'Get all token details':
        let tokenSymbols = await currentContract.methods.getTokens().call();
        let tokenDataTable = [['Symbol', 'Token Name', 'Address', 'Details', 'Deployed Date']];
        let iSecurityTokenABI = abis.iSecurityToken();
        for (let i = 0; i < tokenSymbols.length; i++) {
          let securityToken = new web3.eth.Contract(iSecurityTokenABI, tokenSymbols[i]);
          let tokenName = await securityToken.methods.name().call();
          let stDetails = await currentContract.methods.getSecurityTokenData(tokenSymbols[i]).call();
          tokenDataTable.push([stDetails[0], tokenName, stDetails[1], stDetails[2], moment.unix(stDetails[3]).format('MM/DD/YYYY HH:mm')]);
        }
        console.log(table(tokenDataTable));
        break;
      case 'CANCEL':
        process.exit(0);
    }
  }
  currentContract = null;
}

module.exports = {
  executeApp: async function () {
        return executeApp();
    }
}
