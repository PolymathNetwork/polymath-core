// Libraries for terminal prompts
var readlineSync = require('readline-sync');
var BigNumber = require('bignumber.js');
var chalk = require('chalk');
var common = require('./common/common_functions');
var global = require('./common/global');

// Load Contract artifacts
var contracts = require('./helpers/contract_addresses');
var abis = require('./helpers/contract_abis');

const STO_KEY = 3;
const FUND_RAISE_TYPES = {
    ETH: 0,
    POLY: 1,
    DAI: 2
}

let securityTokenRegistry;
let securityToken;
let selectedSTO;
let currentSTO;
let polyToken;
let usdToken;
let generalTransferManager;

let raiseTypes = [];

// Init user address variables
let User;

// Init Security token details
let STSymbol;
let STAddress;
let STOAddress;

// Global display variables
let displayCanBuy;
let displayValidKYC;

// Start Script
async function executeApp(investorAddress, investorPrivKey, symbol, currency, amount, remoteNetwork) {
    await global.initialize(remoteNetwork);

    common.logAsciiBull();
    console.log("********************************************");
    console.log("Welcome to the Command-Line Investor Portal.");
    console.log("********************************************\n");
    console.log("Issuer Account: " + Issuer.address + "\n");

    await setup();
    if (typeof investorAddress === 'undefined') {
        investorAddress = readlineSync.question(chalk.yellow(`\nEnter your public address to log in as an investor. Otherwise, press 'Enter' to log in as the token issuer: `));
        if (typeof investorPrivKey === 'undefined' && investorAddress != "") {
            investorPrivKey = readlineSync.question(chalk.yellow(`\nEnter your private key to unlock your account: `));
        }
    }
    if (investorAddress != "") {
        User = { address: investorAddress, privateKey: investorPrivKey};
    } else {
        User = Issuer;
    }

    try {
        await inputSymbol(symbol);
        await showUserInfo(User.address);
        switch (selectedSTO) {
            case 'CappedSTO':
                let cappedSTOABI = abis.cappedSTO();
                currentSTO = new web3.eth.Contract(cappedSTOABI, STOAddress);
                await showCappedSTOInfo();
                await investCappedSTO(currency, amount);
                break;
            case 'USDTieredSTO':
                let usdTieredSTOABI = abis.usdTieredSTO();
                currentSTO = new web3.eth.Contract(usdTieredSTOABI, STOAddress);
                await showUserInfoForUSDTieredSTO();
                await showUSDTieredSTOInfo();
                await investUsdTieredSTO(currency, amount)
                break;
        }
    } catch (err) {
        console.error(err);
    }
};

async function setup() {
    try {
        let securityTokenRegistryAddress = await contracts.securityTokenRegistry();
        let securityTokenRegistryABI = abis.securityTokenRegistry();
        securityTokenRegistry = new web3.eth.Contract(securityTokenRegistryABI, securityTokenRegistryAddress);
        securityTokenRegistry.setProvider(web3.currentProvider);

        let polytokenAddress = await contracts.polyToken();
        let polytokenABI = abis.polyToken();
        polyToken = new web3.eth.Contract(polytokenABI, polytokenAddress);
        polyToken.setProvider(web3.currentProvider);

        let usdTokenAddress = await contracts.usdToken();
        usdToken = new web3.eth.Contract(polytokenABI, usdTokenAddress);
        usdToken.setProvider(web3.currentProvider);
    } catch (err) {
        console.log(err);
        console.log(chalk.red(`There was a problem getting the contracts. Make sure they are deployed to the selected network.`));
        process.exit(0);
    }
}

// Input security token symbol or exit
async function inputSymbol(symbol) {
    if (typeof symbol === 'undefined') {
        STSymbol = readlineSync.question(chalk.yellow(`Enter the symbol of a registered security token or press 'Enter' to exit: `));
    } else {
        STSymbol = symbol;
    }

    if (STSymbol == "") process.exit();

    STAddress = await securityTokenRegistry.methods.getSecurityTokenAddress(STSymbol).call();
    if (STAddress == "0x0000000000000000000000000000000000000000"){
        console.log(`Token symbol provided is not a registered Security Token. Please enter another symbol.`);
    } else {
        let securityTokenABI = abis.securityToken();
        securityToken = new web3.eth.Contract(securityTokenABI, STAddress);

        await showTokenInfo();

        let gtmModule = await securityToken.methods.getModulesByName(web3.utils.toHex('GeneralTransferManager')).call();
        let generalTransferManagerABI = abis.generalTransferManager();
        generalTransferManager = new web3.eth.Contract(generalTransferManagerABI, gtmModule[0]);

        let stoModules = await securityToken.methods.getModulesByType(STO_KEY).call();
        if (stoModules.length == 0) {
            console.log(chalk.red(`There is no STO module attached to the ${STSymbol.toUpperCase()} Token. No further actions can be taken.`));
            process.exit(0);
        } else {
            STOAddress = stoModules[0];       
            let stoModuleData = await securityToken.methods.getModule(STOAddress).call();
            selectedSTO = web3.utils.toAscii(stoModuleData[0]).replace(/\u0000/g, '');
            let interfaceSTOABI = abis.stoInterface();
            currentSTO = new web3.eth.Contract(interfaceSTOABI, STOAddress);
        }
    }
}

async function showTokenInfo() {
    // Security Token details
    let displayTokenSymbol = await securityToken.methods.symbol().call();
    let displayTokenSupply = await securityToken.methods.totalSupply().call();
    let displayUserTokens = await securityToken.methods.balanceOf(User.address).call();

    console.log(`
    ******************    Security Token Information    *******************
    - Address:               ${STAddress}
    - Token symbol:          ${displayTokenSymbol.toUpperCase()}
    - Total supply:          ${web3.utils.fromWei(displayTokenSupply)} ${displayTokenSymbol.toUpperCase()}
    - User balance:          ${web3.utils.fromWei(displayUserTokens)} ${displayTokenSymbol.toUpperCase()}`
    );
}

// Show info
async function showUserInfo(_user) {
    console.log(`
    *******************    User Information    ********************
    - Address:               ${_user}`);
    if (await currentSTO.methods.fundRaiseTypes(FUND_RAISE_TYPES.POLY)) {
        console.log(`    - POLY balance:\t     ${await polyBalance(_user)}`);
    }
    if (await currentSTO.methods.fundRaiseTypes(FUND_RAISE_TYPES.ETH)) {
        console.log(`    - ETH balance:\t     ${web3.utils.fromWei(await web3.eth.getBalance(_user))}`);
    }
    if (await currentSTO.methods.fundRaiseTypes(FUND_RAISE_TYPES.DAI)) {
        console.log(`    - DAI balance:\t     ${await usdBalance(_user)}`);
    }
}

async function showCappedSTOInfo() {
    let displayStartTime = await currentSTO.methods.startTime().call();
    let displayEndTime = await currentSTO.methods.endTime().call();
    let displayRate = await currentSTO.methods.rate().call();
    let displayCap = await currentSTO.methods.cap().call();
    let displayTokensSold = await currentSTO.methods.totalTokensSold().call();
    let displayInvestorCount = await currentSTO.methods.investorCount().call();
    let displayTokensRemaining = web3.utils.fromWei(displayCap) - web3.utils.fromWei(displayTokensSold);

    let displayRaiseType;
    let displayFundsRaised;
    for (const fundType in FUND_RAISE_TYPES) {
        if (await currentSTO.methods.fundRaiseTypes(FUND_RAISE_TYPES[fundType]).call()) {
            raiseTypes.push(fundType);
            displayRaiseType = fundType;
            displayFundsRaised = await currentSTO.methods.fundsRaised(FUND_RAISE_TYPES[fundType]).call();
        }
    }

    let now = Math.floor(Date.now()/1000);

    await generalTransferManager.methods.whitelist(User.address).call({}, function(error, result){
        displayCanBuy = result.canBuyFromSTO;
        displayValidKYC = parseInt(result.expiryTime) > now;
    });

    let timeTitle;
    let timeRemaining;
    if(now < displayStartTime){
        timeTitle = "STO starts in: ";
        timeRemaining = displayStartTime - now;
    }else{
        timeTitle = "Time remaining:";
        timeRemaining = displayEndTime - now;
    }

    timeRemaining = common.convertToDaysRemaining(timeRemaining);

    console.log(`
    ********************    STO Information    ********************
    - Address:           ${STOAddress}
    - Raise Cap:         ${web3.utils.fromWei(displayCap)} ${STSymbol.toUpperCase()}
    - Start Time:        ${new Date(displayStartTime * 1000)}
    - End Time:          ${new Date(displayEndTime * 1000)}
    - Raise Type:        ${displayRaiseType}
    - Rate:              1 ${displayRaiseType} = ${displayRate} ${STSymbol.toUpperCase()}
    ---------------------------------------------------------------
    - ${timeTitle}    ${timeRemaining}
    - Funds raised:      ${web3.utils.fromWei(displayFundsRaised)} ${displayRaiseType}
    - Tokens sold:       ${web3.utils.fromWei(displayTokensSold)} ${STSymbol.toUpperCase()}
    - Tokens remaining:  ${displayTokensRemaining} ${STSymbol.toUpperCase()}
    - Investor count:    ${displayInvestorCount}
    `);

    if(!displayCanBuy) {
        console.log(chalk.red(`Your address is not approved to participate in this token sale.\n`));
        process.exit(0);
    } else if (!displayValidKYC) {
        console.log(chalk.red(`Your KYC is expired.\n`));
        process.exit(0);
    } else if (now < displayStartTime) {
        console.log(chalk.red(`The token sale has not yet started.\n`));
        process.exit(0);
    } else if (now > displayEndTime) {
        console.log(chalk.red(`The token sale has ended.\n`));
        process.exit(0);
    }
}

async function showUserInfoForUSDTieredSTO()
{
    for (const fundType in FUND_RAISE_TYPES) {
        if (await currentSTO.methods.fundRaiseTypes(FUND_RAISE_TYPES[fundType]).call()) {
            let displayInvestorInvested = web3.utils.fromWei(await currentSTO.methods.investorInvested(User.address, FUND_RAISE_TYPES[fundType]).call());
            console.log(`    - Invested in ${fundType}:\t     ${displayInvestorInvested} ${fundType}`);
        }
    }

    let displayInvestorInvestedUSD = web3.utils.fromWei(await currentSTO.methods.investorInvestedUSD(User.address).call());
    console.log(`    - Invested in USD:       ${displayInvestorInvestedUSD} USD`);

    await generalTransferManager.methods.whitelist(User.address).call({}, function(error, result){
        displayCanBuy = result.canBuyFromSTO;
        displayValidKYC = parseInt(result.expiryTime) > Math.floor(Date.now()/1000);
    });
    console.log(`    - Whitelisted:           ${(displayCanBuy)? 'YES' : 'NO'}`);
    console.log(`    - Valid KYC:             ${(displayValidKYC)? 'YES' : 'NO'}`);

    let displayIsUserAccredited = await currentSTO.methods.accredited(User.address).call();
    console.log(`    - Accredited:            ${(displayIsUserAccredited)? "YES" : "NO"}`)

    if (!await currentSTO.methods.accredited(User.address).call()) {
        let displayOverrideNonAccreditedLimitUSD = web3.utils.fromWei(await currentSTO.methods.nonAccreditedLimitUSDOverride(User.address).call())
        let displayNonAccreditedLimitUSD = displayOverrideNonAccreditedLimitUSD != 0 ? displayOverrideNonAccreditedLimitUSD : web3.utils.fromWei(await currentSTO.methods.nonAccreditedLimitUSD().call());
        let displayTokensRemainingAllocation = displayNonAccreditedLimitUSD - displayInvestorInvestedUSD;
        console.log(`    - Remaining allocation:  ${(displayTokensRemainingAllocation > 0 ? displayTokensRemainingAllocation : 0)} USD`);
    }
    console.log('\n');
}

async function showUSDTieredSTOInfo() {
    let displayStartTime = await currentSTO.methods.startTime().call();
    let displayEndTime = await currentSTO.methods.endTime().call();
    let displayCurrentTier = parseInt(await currentSTO.methods.currentTier().call()) + 1;
    let displayNonAccreditedLimitUSD = web3.utils.fromWei(await currentSTO.methods.nonAccreditedLimitUSD().call());
    let displayMinimumInvestmentUSD = web3.utils.fromWei(await currentSTO.methods.minimumInvestmentUSD().call());
    let displayTokensSold = web3.utils.fromWei(await currentSTO.methods.getTokensSold().call());
    let displayInvestorCount = await currentSTO.methods.investorCount().call();
    let displayIsFinalized = await currentSTO.methods.isFinalized().call();
    let displayIsOpen = await currentSTO.methods.isOpen().call();
    let displayTokenSymbol = await securityToken.methods.symbol().call();
    let tiersLength = await currentSTO.methods.getNumberOfTiers().call();

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

    let displayFundsRaisedPerType = '';
    let displayTokensSoldPerType = '';
    for (const type of raiseTypes) {
        let fundsRaised = web3.utils.fromWei(await currentSTO.methods.fundsRaised(FUND_RAISE_TYPES[type]).call());
        displayFundsRaisedPerType += `
        ${type}:\t\t\t   ${fundsRaised} ${type}`;

        //Only show sold per raise type is more than one are allowed
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

    console.log(`    **************************   STO Information   ************************
    - Address:                     ${STOAddress}
    - Start Time:                  ${new Date(displayStartTime * 1000)}
    - End Time:                    ${new Date(displayEndTime * 1000)}
    - Raise Type:                  ${displayRaiseType}
    - Tiers:                       ${tiersLength}`
    + displayTiers + `
    - Minimum Investment:          ${displayMinimumInvestmentUSD} USD
    - Default NonAccredited Limit: ${displayNonAccreditedLimitUSD} USD
    -----------------------------------------------------------------------
    - ${timeTitle}              ${timeRemaining}
    - Tokens Sold:                 ${displayTokensSold} ${displayTokenSymbol}`
    + displayTokensSoldPerType + `
    - Current Tier:                ${displayCurrentTier}`
    + displayMintedPerTier + `
    - Investor count:              ${displayInvestorCount}
    - Funds Raised`
    + displayFundsRaisedPerType + `
        USD:                       ${displayFundsRaisedUSD} USD
    `);

    if (!displayCanBuy) {
        console.log(chalk.red(`Your address is not approved to participate in this token sale.\n`));
        process.exit(0);
    } else if (!displayValidKYC) {
        console.log(chalk.red(`Your KYC is expired.\n`));
        process.exit(0);
    } else if (now < displayStartTime) {
        console.log(chalk.red(`The token sale has not yet started.\n`));
        process.exit(0);
    } else if (now > displayEndTime || displayIsFinalized || !displayIsOpen) {
        console.log(chalk.red(`The token sale has ended.\n`));
        process.exit(0);
    }
}

// Allow investor to buy tokens.
async function investCappedSTO(currency, amount) {
    if (typeof currency !== 'undefined' && !raiseTypes.inlcudes(currency)) {
        console.log(chalk.red(`${currency} is not allowed for current STO`));
        process.exit(0);
    }

    let amt;
    if (typeof amount === 'undefined') {
        amt = readlineSync.question(chalk.yellow(`Enter the amount of ${STSymbol.toUpperCase()} you would like to purchase or press 'Enter' to exit. `));
    } else {
        amt = amount;
    }
    if (amt == "") process.exit();

    let rate = await currentSTO.methods.rate().call();
    let cost = new BigNumber(amt).div(rate);
    console.log(`This investment will cost ${cost} ${raiseTypes[0]}`);

    let costWei = web3.utils.toWei(cost.toString());
    if (raiseTypes[0] == 'POLY') {
        let userBalance = await polyBalance(User.address);
        if (parseInt(userBalance) >= parseInt(cost)) {
            let allowance = await polyToken.methods.allowance(STOAddress, User.address).call();
            if (allowance < costWei) {
                let approveAction = polyToken.methods.approve(STOAddress, costWei);
                await common.sendTransaction(User, approveAction, defaultGasPrice);
            }
            let actionBuyTokensWithPoly = currentSTO.methods.buyTokensWithPoly(costWei);
            let receipt = await common.sendTransaction(User, actionBuyTokensWithPoly, defaultGasPrice);
            logTokensPurchasedCappedSTO(receipt);
        } else {
            console.log(chalk.red(`Not enough balance to Buy tokens, Require ${cost} POLY but have ${userBalance} POLY.`));
            console.log(chalk.red(`Please purchase a smaller amount of tokens or access the POLY faucet to get the POLY to complete this txn.`));
            process.exit();
        }
    } else {
        let actionBuyTokens = currentSTO.methods.buyTokens(User.address);
        let receipt = await common.sendTransaction(User, actionBuyTokens, defaultGasPrice, costWei);
        logTokensPurchasedCappedSTO(receipt);
    }
    await showTokenInfo();
}

// Allow investor to buy tokens.
async function investUsdTieredSTO(currency, amount) {
    let raiseType;
    if (typeof currency !== 'undefined') {
        if (!raiseTypes.inlcudes(currency)) {
            console.log(chalk.red(`${currency} is not allowed for current STO`));
            process.exit(0);
        } else {
            raiseType = currency;
        }
    } else {
        for (const type of raiseTypes) {
            let displayPrice = web3.utils.fromWei(await currentSTO.methods.convertToUSD(FUND_RAISE_TYPES[type], web3.utils.toWei("1")).call());
            console.log(chalk.green(`   Current ${type} price:\t\t   ${displayPrice} USD`));
        }
        if (raiseTypes.length > 1) {
            let index = readlineSync.keyInSelect(raiseTypes, 'Choose one of the allowed raise types: ', {cancel: false});
            raiseType = raiseTypes[index];
        } else {
            raiseType = raiseTypes[0];
            console.log('');
        }
    }

    let cost;
    if (typeof amount === 'undefined') {
        let investorInvestedUSD = web3.utils.fromWei(await currentSTO.methods.investorInvestedUSD(User.address).call());
        let minimumInvestmentUSD = await currentSTO.methods.minimumInvestmentUSD().call();
        let minimumInvestmentRaiseType = await currentSTO.methods.convertFromUSD(FUND_RAISE_TYPES[raiseType], minimumInvestmentUSD).call();
        cost = readlineSync.question(chalk.yellow(`Enter the amount of ${raiseType} you would like to invest or press 'Enter' to exit: `), {
            limit: function(input) {
                return investorInvestedUSD != 0 || parseInt(input) > parseInt(web3.utils.fromWei(minimumInvestmentRaiseType));
            },
            limitMessage: `Amount must be greater than minimum investment (${web3.utils.fromWei(minimumInvestmentRaiseType)} ${raiseType} = ${web3.utils.fromWei(minimumInvestmentUSD)} USD)`
        });
    } else {
        cost = amount;
    }
    if (cost == "") process.exit();

    let costWei = web3.utils.toWei(cost.toString());

    if (raiseType == 'POLY') {
        let userBalance = await polyBalance(User.address);
        if (parseInt(userBalance) >= parseInt(cost)) {
            let allowance = await polyToken.methods.allowance(STOAddress, User.address).call();
            if (allowance < costWei) {
                let approveAction = polyToken.methods.approve(STOAddress, costWei);
                await common.sendTransaction(User, approveAction, defaultGasPrice);
            }
            let actionBuyWithPoly = currentSTO.methods.buyWithPOLY(User.address, costWei, 0, 1.5);
            let receipt = await common.sendTransaction(User, actionBuyWithPoly, defaultGasPrice);
            logTokensPurchasedUSDTieredSTO(receipt);
        } else {
            console.log(chalk.red(`Not enough balance to Buy tokens, Require ${cost} POLY but have ${userBalance} POLY.`));
            console.log(chalk.red(`Please purchase a smaller amount of tokens or access the POLY faucet to get the POLY to complete this txn.`));
            process.exit();
        }
    } else if (raiseType == 'DAI') {
        let userBalance = await usdBalance(User.address);
        if (parseInt(userBalance) >= parseInt(cost)) {
            let allowance = await usdToken.methods.allowance(STOAddress, User.address).call();
            if (allowance < costWei) {
                let approveAction = usdToken.methods.approve(STOAddress, costWei);
                await common.sendTransaction(User, approveAction, defaultGasPrice);
            }
            let actionBuyWithUSD = currentSTO.methods.buyWithUSD(User.address, costWei);
            let receipt = await common.sendTransaction(User, actionBuyWithUSD, defaultGasPrice, 0, 1.5);
            logTokensPurchasedUSDTieredSTO(receipt);
        } else {
            console.log(chalk.red(`Not enough balance to Buy tokens, Require ${cost} DAI but have ${userBalance} DAI.`));
            console.log(chalk.red(`Please purchase a smaller amount of tokens.`));
            process.exit();
        } 
    } else {
        let actionBuyWithETH = currentSTO.methods.buyWithETH(User.address);
        let receipt = await common.sendTransaction(User, actionBuyWithETH, defaultGasPrice, costWei);
        logTokensPurchasedUSDTieredSTO(receipt);
    }

    await showTokenInfo();
    await showUserInfoForUSDTieredSTO();
}

async function polyBalance(_user) {
    let balance = await polyToken.methods.balanceOf(_user).call();
    return web3.utils.fromWei(balance);
}

async function usdBalance(_user) {
    let balance = await usdToken.methods.balanceOf(_user).call();
    return web3.utils.fromWei(balance);
}

function logTokensPurchasedUSDTieredSTO(receipt) {
    console.log(chalk.green(`Congratulations! The token purchase was successfully completed.`));
    let events = common.getMultipleEventsFromLogs(currentSTO._jsonInterface, receipt.logs, 'TokenPurchase');
    for (event of events) {
        console.log(`
  Account ${event._purchaser}
  invested ${web3.utils.fromWei(event._usdAmount)} USD
  purchasing ${web3.utils.fromWei(event._tokens)} ${STSymbol.toUpperCase()} at ${web3.utils.fromWei(event._tierPrice)} USD
  for beneficiary account ${event._beneficiary}`);
    };
}

function logTokensPurchasedCappedSTO(receipt) {
    console.log(chalk.green(`Congratulations! The token purchase was successfully completed.`));
    let events = common.getMultipleEventsFromLogs(currentSTO._jsonInterface, receipt.logs, 'TokenPurchase');
    for (event of events) {
        console.log(`
  Account ${event.purchaser}
  invested ${web3.utils.fromWei(event.value)} ${displayRaiseType}
  purchasing ${web3.utils.fromWei(event.amount)} ${STSymbol.toUpperCase()}
  for beneficiary account ${event.beneficiary}`);
    };
}

module.exports = {
    executeApp: async function(investorAddress, investorPrivKey, symbol, currency, amount, remoteNetwork) {
          return executeApp(investorAddress, investorPrivKey, symbol, currency, amount, remoteNetwork);
      }
}
