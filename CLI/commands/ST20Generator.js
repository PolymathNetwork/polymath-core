const readlineSync = require('readline-sync');
const BigNumber = require('bignumber.js');
const moment = require('moment');
const chalk = require('chalk');
const tokenManager = require('./token_manager');
const contracts = require('./helpers/contract_addresses');
const abis = require('./helpers/contract_abis');
const common = require('./common/common_functions');

////////////////////////
let securityTokenRegistryAddress;
let tokenSymbol;
let tokenLaunched;

// Artifacts
let securityTokenRegistry;
let polyToken;

async function executeApp(_ticker, _transferOwnership, _name, _details, _divisible) {
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
    await tokenManager.executeApp(tokenSymbol);
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
  } catch (err) {
    console.log(err)
    console.log(chalk.red('\nThere was a problem getting the contracts. Make sure they are deployed to the selected network.'));
    process.exit(0);
  }
}

async function step_ticker_registration(_ticker) {
  console.log(chalk.blue('\nToken Symbol Registration'));

  let regFee = web3.utils.fromWei(await securityTokenRegistry.methods.getTickerRegistrationFee().call());
  let available = false;

  while (!available) {
    console.log(chalk.yellow(`\nRegistering the new token symbol requires ${regFee} POLY & deducted from '${Issuer.address}', Current balance is ${(web3.utils.fromWei(await polyToken.methods.balanceOf(Issuer.address).call()))} POLY\n`));

    if (typeof _ticker !== 'undefined') {
      tokenSymbol = _ticker;
      console.log(`Token Symbol: ${tokenSymbol}`);
    } else {
      tokenSymbol = await selectTicker();
    }

    let details = await securityTokenRegistry.methods.getTickerDetails(tokenSymbol).call();
    if (new BigNumber(details[1]).toNumber() == 0) {
      // If it has no registration date, it is available
      available = true;
      await approvePoly(securityTokenRegistryAddress, regFee);
      let registerTickerAction = securityTokenRegistry.methods.registerTicker(Issuer.address, tokenSymbol, "");
      await common.sendTransaction(registerTickerAction, {factor: 1.5});
    } else if (details[0] == Issuer.address) {
      // If it has registration date and its owner is Issuer
      available = true;
      tokenLaunched = details[4];
    } else {
      // If it has registration date and its owner is not Issuer
      console.log(chalk.yellow('\nToken Symbol has already been registered, please choose another symbol'));
    }
  }
}

async function step_transfer_ticker_ownership(_transferOwnership) {
  let newOwner = null;
  if (typeof _transferOwnership !== 'undefined' && _transferOwnership != 'false') {
    newOwner = _transferOwnership;
    console.log(`Transfer ownership to: ${newOwner}`);
  } else if (_transferOwnership != 'false' && readlineSync.keyInYNStrict(`Do you want to transfer the ownership of ${tokenSymbol} ticker?`)) {
    newOwner = readlineSync.question('Enter the address that will be the new owner: ', {
      limit: function (input) {
        return web3.utils.isAddress(input);
      },
      limitMessage: "Must be a valid address"
    });
  }

  if (newOwner) {
    let transferTickerOwnershipAction = securityTokenRegistry.methods.transferTickerOwnership(newOwner, tokenSymbol);
    let receipt = await common.sendTransaction(transferTickerOwnershipAction, {factor: 1.5});
    let event = common.getEventFromLogs(securityTokenRegistry._jsonInterface, receipt.logs, 'ChangeTickerOwnership');
    console.log(chalk.green(`Ownership trasferred successfully. The new owner is ${event._newOwner}`));
    process.exit(0);
  }
}

async function step_token_deploy(_name, _details, _divisible) {
  console.log(chalk.blue('\nToken Creation - Token Deployment'));

  let launchFee = web3.utils.fromWei(await securityTokenRegistry.methods.getSecurityTokenLaunchFee().call());
  console.log(chalk.green(`\nToken deployment requires ${launchFee} POLY & deducted from '${Issuer.address}', Current balance is ${(web3.utils.fromWei(await polyToken.methods.balanceOf(Issuer.address).call()))} POLY\n`));

  let tokenName;
  if (typeof _name !== 'undefined') {
    tokenName = _name;
    console.log(`Token Name: ${tokenName}`);
  } else {
    tokenName = readlineSync.question('Enter the name for your new token: ', {defaultInput: 'default'});
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
    divisibility = _divisible.toString() == 'true';
    console.log(`Divisible: ${divisibility.toString()}`)
  } else {
    let divisible = readlineSync.question('Press "N" for Non-divisible type token or hit Enter for divisible type token (Default): ');
    divisibility = (divisible != 'N' && divisible != 'n');
  }

<<<<<<< HEAD
  await approvePoly(securityTokenRegistryAddress, launchFee);
  let generateSecurityTokenAction = securityTokenRegistry.methods.generateSecurityToken(tokenName, tokenSymbol, tokenDetails, divisibility);
  let receipt = await common.sendTransaction(generateSecurityTokenAction);
  let event = common.getEventFromLogs(securityTokenRegistry._jsonInterface, receipt.logs, 'NewSecurityToken');
  console.log(chalk.green(`Security Token has been successfully deployed at address ${event._securityTokenAddress}`));
=======
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
      let receipt = await common.sendTransaction(Issuer, transferAction, defaultGasPrice, 0, 2);
      let event = common.getEventFromLogs(polyToken._jsonInterface, receipt.logs, 'Transfer');
      console.log(`Number of POLY sent: ${web3.utils.fromWei(new web3.utils.BN(event._value))}`)
    }
  }

  let funding = fundingConfigUSDTieredSTO();
  let addresses = addressesConfigUSDTieredSTO(funding.raiseType.includes(FUND_RAISE_TYPES.DAI));
  let tiers = tiersConfigUSDTieredSTO(funding.raiseType.includes(FUND_RAISE_TYPES.POLY));
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

  let usdTieredSTOFactoryAddress = await contracts.getModuleFactoryAddressByName(securityToken.options.address, MODULES_TYPES.STO, 'USDTieredSTO');
  let addModuleAction = securityToken.methods.addModule(usdTieredSTOFactoryAddress, bytesSTO, new BigNumber(stoFee).times(new BigNumber(10).pow(18)), 0);
  let receipt = await common.sendTransaction(Issuer, addModuleAction, defaultGasPrice);
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
  for (const fundType in FUND_RAISE_TYPES) {
    if (await currentSTO.methods.fundRaiseTypes(FUND_RAISE_TYPES[fundType]).call()) {
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

      let mintedPerTier = await currentSTO.methods.mintedPerTier(FUND_RAISE_TYPES[type], t).call();
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
    let walletBalanceUSD = web3.utils.fromWei(await currentSTO.methods.convertToUSD(FUND_RAISE_TYPES[type], balance).call());
    displayWalletBalancePerType += `
        Balance ${type}:\t\t   ${walletBalance} ${type} (${walletBalanceUSD} USD)`;
    
    balance = await getBalance(displayReserveWallet, type);
    let reserveWalletBalance = web3.utils.fromWei(balance);
    let reserveWalletBalanceUSD = web3.utils.fromWei(await currentSTO.methods.convertToUSD(FUND_RAISE_TYPES[type], balance).call());
    displayReserveWalletBalancePerType += `
        Balance ${type}:\t\t   ${reserveWalletBalance} ${type} (${reserveWalletBalanceUSD} USD)`;
    
    let fundsRaised = web3.utils.fromWei(await currentSTO.methods.fundsRaised(FUND_RAISE_TYPES[type]).call());
    displayFundsRaisedPerType += `
        ${type}:\t\t\t   ${fundsRaised} ${type}`;

    //Only show sold for if more than one raise type are allowed
    if (raiseTypes.length > 1) {
      let tokensSoldPerType = web3.utils.fromWei(await currentSTO.methods.getTokensSoldFor(FUND_RAISE_TYPES[type]).call());
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
          let isVerified = await securityToken.methods.verifyTransfer("0x0000000000000000000000000000000000000000", reserveWallet, 0, web3.utils.fromAscii("")).call();
          if (isVerified) {
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
          shell.exec(`${__dirname}/scripts/script.sh Accredit ${tokenSymbol} 75 ${network}`);
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
          shell.exec(`${__dirname}/scripts/script.sh NonAccreditedLimit ${tokenSymbol} 75 ${network}`);
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
  let addresses = addressesConfigUSDTieredSTO(await currentSTO.methods.fundRaiseTypes(FUND_RAISE_TYPES.DAI).call());
  let modifyAddressesAction = currentSTO.methods.modifyAddresses(addresses.wallet, addresses.reserveWallet, addresses.usdToken);
  await common.sendTransaction(Issuer, modifyAddressesAction, defaultGasPrice);
}

async function modfifyTiers() {
  let tiers = tiersConfigUSDTieredSTO(await currentSTO.methods.fundRaiseTypes(FUND_RAISE_TYPES.POLY).call());
  let modifyTiersAction = currentSTO.methods.modifyTiers(
    tiers.ratePerTier,
    tiers.ratePerTierDiscountPoly,
    tiers.tokensPerTier,
    tiers.tokensPerTierDiscountPoly,
  );
  await common.sendTransaction(Issuer, modifyTiersAction, defaultGasPrice);
>>>>>>> master-dev-2.1
}

//////////////////////
// HELPER FUNCTIONS //
//////////////////////
async function selectTicker() {
  let result;
  let userTickers = (await securityTokenRegistry.methods.getTickersByOwner(Issuer.address).call()).map(t => web3.utils.hexToAscii(t));
  let options = await Promise.all(userTickers.map(async function (t) {
    let tickerDetails = await securityTokenRegistry.methods.getTickerDetails(t).call();
    let tickerInfo;
    if (tickerDetails[4]) {
      tickerInfo = `Token launched at ${(await securityTokenRegistry.methods.getSecurityTokenAddress(t).call())}`;
    } else {
      tickerInfo = `Expires at ${moment.unix(tickerDetails[2]).format('MMMM Do YYYY, HH:mm:ss')}`;
    }
    return `${t}
    ${tickerInfo}`;
  }));
  options.push('Register a new ticker');

  let index = readlineSync.keyInSelect(options, 'Select a ticker:');
  if (index == -1) {
    process.exit(0);
  } else if (index == options.length - 1) {
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
  executeApp: async function(ticker, transferOwnership, name, details, divisible) {
    return executeApp(ticker, transferOwnership, name, details, divisible);
  }
}
