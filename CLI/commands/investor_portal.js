// Libraries for terminal prompts
var readlineSync = require('readline-sync');
var BigNumber = require('bignumber.js');
var chalk = require('chalk');
var common = require('./common/common_functions');
var global = require('./common/global');

// Load Contract artifacts
var contracts = require('./helpers/contract_addresses');
var abis = require('./helpers/contract_abis');

let securityTokenRegistry;
let securityToken;
let selectedSTO;
let currentSTO;
let polyToken;
let generalTransferManager;

// Init user address variables
let User;

// Init Security token details
let STSymbol;
let STAddress;
let STOAddress;
let GTMAddress;

// Global display variables
let displayRate;
let displayRaiseType;
let displayTokenSymbol;
let displayCanBuy;

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
        await showUserInfo(User.address);
        await inputSymbol(symbol);
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

        let res = await securityToken.methods.getModule(2,0).call();
        GTMAddress = res[1];
        let generalTransferManagerABI = abis.generalTransferManager();
        generalTransferManager = new web3.eth.Contract(generalTransferManagerABI,GTMAddress);

        res = await securityToken.methods.getModule(3,0).call();
        STOAddress = res[1];
        if (STOAddress != "0x0000000000000000000000000000000000000000") {
            selectedSTO = web3.utils.toAscii(res[0]).replace(/\u0000/g, '');
        } else {
            console.log(chalk.red(`There is no STO module attached to the ${displayTokenSymbol.toUpperCase()} Token. No further actions can be taken.`));
            return;
        }
    }
}

// Allow investor to buy tokens.
async function investUsdTieredSTO(currency, amount) {
    let raiseType;
    if (typeof currency !== 'undefined') {
        if (displayRaiseType.indexOf(currency) == -1) {
            console.log(chalk.red(`${currency} is not allowed for current STO`));
            process.exit(0);
        } else {
            raiseType = currency;
        }
    } else if (displayRaiseType == "ETH and POLY") {
        let displayPolyPrice = web3.utils.fromWei(await currentSTO.methods.convertToUSD(web3.utils.fromAscii("POLY"), web3.utils.toWei("1")).call());
        let displayEthPrice = web3.utils.fromWei(await currentSTO.methods.convertToUSD(web3.utils.fromAscii("ETH"), web3.utils.toWei("1")).call());
        console.log(chalk.green(`   Current POLY price:             ${displayPolyPrice} USD`));
        console.log(chalk.green(`   Current ETH price:              ${displayEthPrice} USD\n`));
        let type = readlineSync.question(chalk.yellow('Enter' + chalk.green(` P `) + 'to buy tokens with POLY or' + chalk.green(` E `) + 'to use ETH instead (E): '));
        if (type.toUpperCase() == 'P') {
            raiseType = "POLY";
        } else {
            raiseType = "ETH";
        }
    } else {
        raiseType = displayRaiseType;
        if (raiseType == "POLY") {
            let displayPolyPrice = web3.utils.fromWei(await currentSTO.methods.convertToUSD(web3.utils.fromAscii("POLY"), web3.utils.toWei(1)).call());
            console.log(chalk.green(`   Current POLY price:             ${displayPolyPrice} USD\n`));
        } else {
            let displayEthPrice = web3.utils.fromWei(await currentSTO.methods.convertToUSD(web3.utils.fromAscii("ETH"), web3.utils.toWei(1)).call());
            console.log(chalk.green(`   Current ETH price:              ${displayEthPrice} USD\n`));
        }
    }

    let cost;
    if (typeof amount === 'undefined') {
        let investorInvestedUSD = web3.utils.fromWei(await currentSTO.methods.investorInvestedUSD(User.address).call());
        let minimumInvestmentUSD = await currentSTO.methods.minimumInvestmentUSD().call();
        let minimumInvestmentRaiseType = await currentSTO.methods.convertFromUSD(web3.utils.fromAscii(raiseType), minimumInvestmentUSD).call();      
        cost = readlineSync.question(chalk.yellow(`Enter the amount of ${raiseType} you would like to invest or press 'Enter' to exit: `), {   
            limit: function(input) {
                return investorInvestedUSD != 0 || input > web3.utils.fromWei(minimumInvestmentRaiseType);
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
            let actionBuyWithPoly = currentSTO.methods.buyWithPOLY(User.address, costWei);
            let receipt = await common.sendTransaction(User, actionBuyWithPoly, defaultGasPrice);
            logTokensPurchasedUSDTieredSTO(receipt);
        } else {
            console.log(chalk.red(`Not enough balance to Buy tokens, Require ${cost} POLY but have ${userBalance} POLY.`));
            console.log(chalk.red(`Please purchase a smaller amount of tokens or access the POLY faucet to get the POLY to complete this txn.`));
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

// Allow investor to buy tokens.
async function investCappedSTO(currency, amount) {
    if (typeof currency !== 'undefined' && displayRaiseType.indexOf(currency) == -1) {
        console.log(chalk.red(`${currency} is not allowed for current STO`));
        process.exit(0);
    }

    let amt;
    if (typeof amount === 'undefined') {
        amt = readlineSync.question(chalk.yellow(`Enter the amount of ${displayTokenSymbol.toUpperCase()} you would like to purchase or press 'Enter' to exit. `));
    } else {
        amt = amount;
    }
    if (amt == "") process.exit();

    let cost = new BigNumber(amt).div(displayRate);
    console.log(`This investment will cost ${cost} ${displayRaiseType}`);

    let costWei = web3.utils.toWei(cost.toString());
    if (displayRaiseType == 'POLY') {
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

// Show info
async function showUserInfo(_user) {
    console.log(`
    *******************    User Information    ********************
    - Address:           ${_user}
    - POLY balance:      ${await polyBalance(_user)}
    - ETH balance:       ${web3.utils.fromWei(await web3.eth.getBalance(_user))}
    `);
}

async function showTokenInfo() {
    // Security Token details
    displayTokenSymbol = await securityToken.methods.symbol().call();
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

async function showUserInfoForUSDTieredSTO()
{
    if (await currentSTO.methods.fundRaiseType(0).call()) {
        let displayInvestorInvestedETH = web3.utils.fromWei(await currentSTO.methods.investorInvestedETH(User.address).call());
        console.log(`    - Invested in ETH:       ${displayInvestorInvestedETH} ETH`);
    }
    if (await currentSTO.methods.fundRaiseType(1).call()) {
        let displayInvestorInvestedPOLY = web3.utils.fromWei(await currentSTO.methods.investorInvestedPOLY(User.address).call());
        console.log(`    - Invested in POLY:      ${displayInvestorInvestedPOLY} POLY`);
    }
    let displayInvestorInvestedUSD = web3.utils.fromWei(await currentSTO.methods.investorInvestedUSD(User.address).call());
    console.log(`    - Invested in USD:       ${displayInvestorInvestedUSD} USD`);
    
    await generalTransferManager.methods.whitelist(User.address).call({}, function(error, result){
        displayCanBuy = result.canBuyFromSTO;
    });
    console.log(`    - Whitelisted:           ${(displayCanBuy)?'YES':'NO'}`)

    let displayIsUserAccredited = await currentSTO.methods.accredited(User.address).call();
    console.log(`    - Accredited:            ${(displayIsUserAccredited)?"YES":"NO"}`)
    
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
    let ethRaise = await currentSTO.methods.fundRaiseType(0).call();
    let polyRaise = await currentSTO.methods.fundRaiseType(1).call();
    let displayTokensSold = web3.utils.fromWei(await currentSTO.methods.getTokensSold().call());
    let displayInvestorCount = await currentSTO.methods.investorCount().call();
    let displayIsFinalized = await currentSTO.methods.isFinalized().call();
    let displayIsOpen = await currentSTO.methods.isOpen().call();
    let displayTokenSymbol = await securityToken.methods.symbol().call();

    let tiersLength = await currentSTO.methods.getNumberOfTiers().call();

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
    + displayMintedPerTierPOLY;}

    let displayFundsRaisedUSD = web3.utils.fromWei(await currentSTO.methods.fundsRaisedUSD().call());

    let displayFundsRaisedETH = '';
    let displayTokensSoldETH = '';
    if (ethRaise) {
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

    let displayFundsRaisedPOLY = '';
    let displayTokensSoldPOLY = '';
    if (polyRaise) {
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

    if (!displayCanBuy) {
        console.log(chalk.red(`Your address is not approved to participate in this token sale.\n`));
        process.exit(0);
    } else if (now < displayStartTime) {
        console.log(chalk.red(`The token sale has not yet started.\n`));
        process.exit(0);
    } else if (now > displayEndTime || displayIsFinalized || !displayIsOpen) {
        console.log(chalk.red(`The token sale has ended.\n`));
        process.exit(0);
    }
}

async function showCappedSTOInfo() {
    let displayStartTime = await currentSTO.methods.startTime().call();
    let displayEndTime = await currentSTO.methods.endTime().call();
    displayRate = await currentSTO.methods.rate().call();
    let displayCap = await currentSTO.methods.cap().call();
    let displayFundsRaised = await currentSTO.methods.fundsRaised().call();
    let displayTokensSold = await currentSTO.methods.tokensSold().call();
    let displayInvestorCount = await currentSTO.methods.investorCount().call();
    let displayTokensRemaining = web3.utils.fromWei(displayCap) - web3.utils.fromWei(displayTokensSold);

    displayRaiseType = await currentSTO.methods.fundRaiseType(0).call() ? 'ETH' : 'POLY';

    await generalTransferManager.methods.whitelist(User.address).call({}, function(error, result){
        displayCanBuy = result.canBuyFromSTO;
    });

    let now = Math.floor(Date.now()/1000);
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
    - Raise Cap:         ${web3.utils.fromWei(displayCap)} ${displayTokenSymbol.toUpperCase()}
    - Start Time:        ${new Date(displayStartTime * 1000)}
    - End Time:          ${new Date(displayEndTime * 1000)}
    - Raise Type:        ${displayRaiseType}
    - Rate:              1 ${displayRaiseType} = ${displayRate} ${displayTokenSymbol.toUpperCase()}
    ---------------------------------------------------------------
    - ${timeTitle}    ${timeRemaining}
    - Funds raised:      ${web3.utils.fromWei(displayFundsRaised)} ${displayRaiseType}
    - Tokens sold:       ${web3.utils.fromWei(displayTokensSold)} ${displayTokenSymbol.toUpperCase()}
    - Tokens remaining:  ${displayTokensRemaining} ${displayTokenSymbol.toUpperCase()}
    - Investor count:    ${displayInvestorCount}
    `);

    if(!displayCanBuy) {
        console.log(chalk.red(`Your address is not approved to participate in this token sale.\n`));
        process.exit(0);
    } else if (now < displayStartTime) {
        console.log(chalk.red(`The token sale has not yet started.\n`));
        process.exit(0);
    } else if (now > displayEndTime) {
        console.log(chalk.red(`The token sale has ended.\n`));
        process.exit(0);
    }
}

async function polyBalance(_user) {
    let balance = await polyToken.methods.balanceOf(_user).call();
    return web3.utils.fromWei(balance);
}

function logTokensPurchasedUSDTieredSTO(receipt) {
    console.log(chalk.green(`Congratulations! The token purchase was successfully completed.`));
    let events = common.getMultipleEventsFromLogs(currentSTO._jsonInterface, receipt.logs, 'TokenPurchase');
    for (event of events) {
        console.log(`
  Account ${event._purchaser}
  invested ${web3.utils.fromWei(event._usdAmount)} USD
  purchasing ${web3.utils.fromWei(event._tokens)} ${displayTokenSymbol.toUpperCase()} at ${web3.utils.fromWei(event._tierPrice)} USD
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
  purchasing ${web3.utils.fromWei(event.amount)} ${displayTokenSymbol.toUpperCase()}
  for beneficiary account ${event.beneficiary}`);
    };
}

module.exports = {
    executeApp: async function(investorAddress, investorPrivKey, symbol, currency, amount, remoteNetwork) {
          return executeApp(investorAddress, investorPrivKey, symbol, currency, amount, remoteNetwork);
      }
}
