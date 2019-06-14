// Libraries for terminal prompts
var readlineSync = require('readline-sync');
var BigNumber = require('bignumber.js');
var chalk = require('chalk');
var common = require('./common/common_functions');
var gbl = require('./common/global');
const input = require('./IO/input');

// Load Contract artifacts
var contracts = require('./helpers/contract_addresses');
var abis = require('./helpers/contract_abis');

const ETH = 'ETH';
const POLY = 'POLY';
const STABLE = 'STABLE';

let securityTokenRegistry;
let securityToken;
let selectedSTO;
let currentSTO;
let polyToken;
let generalTransferManager;

let raiseTypes = [];

// Init user address variables
let User;

// Init Security token details
let STSymbol;
let STAddress;
let STOAddress;

// Global display variables
let displayCannotBuy;
let displayValidKYC;

// Start Script
async function executeApp(investorAddress, investorPrivKey, symbol, currency, amount) {

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
        User = { address: investorAddress, privateKey: investorPrivKey };
    } else {
        User = Issuer;
    }

    try {
        await inputSymbol(symbol);
        switch (selectedSTO) {
            case 'CappedSTO':
                let cappedSTOABI = abis.cappedSTO();
                currentSTO = new web3.eth.Contract(cappedSTOABI, STOAddress);
                await showUserInfo(User.address);
                await showCappedSTOInfo();
                await investCappedSTO(currency, amount);
                break;
            case 'USDTieredSTO':
                let usdTieredSTOABI = abis.usdTieredSTO();
                currentSTO = new web3.eth.Contract(usdTieredSTOABI, STOAddress);
                await showUserInfo(User.address);
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
        let iSecurityTokenRegistryABI = abis.iSecurityTokenRegistry();
        securityTokenRegistry = new web3.eth.Contract(iSecurityTokenRegistryABI, securityTokenRegistryAddress);
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
    if (STAddress == "0x0000000000000000000000000000000000000000") {
        console.log(`Token symbol provided is not a registered Security Token. Please enter another symbol.`);
    } else {
        let iSecurityTokenABI = abis.iSecurityToken();
        securityToken = new web3.eth.Contract(iSecurityTokenABI, STAddress);

        await showTokenInfo();

        let gtmModules = await securityToken.methods.getModulesByName(web3.utils.toHex('GeneralTransferManager')).call();
        let generalTransferManagerABI = abis.generalTransferManager();
        generalTransferManager = new web3.eth.Contract(generalTransferManagerABI, gtmModules[0]);

        let stoModules = await securityToken.methods.getModulesByType(gbl.constants.MODULES_TYPES.STO).call();
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
    if (await currentSTO.methods.fundRaiseTypes(gbl.constants.FUND_RAISE_TYPES.POLY).call()) {
        console.log(`    - POLY balance:\t     ${await polyBalance(_user)}`);
    }
    if (await currentSTO.methods.fundRaiseTypes(gbl.constants.FUND_RAISE_TYPES.ETH).call()) {
        console.log(`    - ETH balance:\t     ${web3.utils.fromWei(await web3.eth.getBalance(_user))}`);
    }
    if (await currentSTO.methods.fundRaiseTypes(gbl.constants.FUND_RAISE_TYPES.STABLE).call()) {
        let listOfStableCoins = await currentSTO.methods.getUsdTokens().call();
        let stableSymbolsAndBalance = await processAddressWithBalance(listOfStableCoins);
        stableSymbolsAndBalance.forEach(stable => {
            console.log(`    - ${stable.symbol} balance:\t     ${web3.utils.fromWei(stable.balance)}`);
        });
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
    for (const fundType in gbl.constants.FUND_RAISE_TYPES) {
        if (await currentSTO.methods.fundRaiseTypes(gbl.constants.FUND_RAISE_TYPES[fundType]).call()) {
            raiseTypes.push(fundType);
            displayRaiseType = fundType;
            displayFundsRaised = await currentSTO.methods.fundsRaised(gbl.constants.FUND_RAISE_TYPES[fundType]).call();
        }
    }

    let now = Math.floor(Date.now() / 1000);

    await generalTransferManager.methods.getKYCData([User.address]).call({}, function (error, result) {
        displayValidKYC = parseInt(result[2]) > now;
    });

    displayCannotBuy = await generalTransferManager.methods.getInvestorFlag(User.address, 1).call();

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
    ********************    STO Information    ********************
    - Address:           ${STOAddress}
    - Raise Cap:         ${web3.utils.fromWei(displayCap)} ${STSymbol.toUpperCase()}
    - Start Time:        ${new Date(displayStartTime * 1000)}
    - End Time:          ${new Date(displayEndTime * 1000)}
    - Raise Type:        ${displayRaiseType}
    - Rate:              1 ${displayRaiseType} = ${web3.utils.fromWei(displayRate)} ${STSymbol.toUpperCase()}
    ---------------------------------------------------------------
    - ${timeTitle}    ${timeRemaining}
    - Funds raised:      ${web3.utils.fromWei(displayFundsRaised)} ${displayRaiseType}
    - Tokens sold:       ${web3.utils.fromWei(displayTokensSold)} ${STSymbol.toUpperCase()}
    - Tokens remaining:  ${displayTokensRemaining} ${STSymbol.toUpperCase()}
    - Investor count:    ${displayInvestorCount}
    `);

    if (displayCannotBuy) {
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

async function processAddressWithBalance(array) {
    let list = [];
    for (const address of array) {
        let symbol = await checkSymbol(address);
        let balance = await checkBalance(address);
        list.push({ 'address': address, 'symbol': symbol, 'balance': balance })
    }
    return list
}

async function processAddress(array) {
    let list = [];
    for (const address of array) {
        let symbol = await checkSymbol(address);
        list.push({ "symbol": symbol, "address": address })
    }
    return list
}

async function checkSymbol(address) {
    let stableCoin = common.connect(abis.erc20(), address);
    try {
        return await stableCoin.methods.symbol().call();
    } catch (e) {
        return ""
    }
}

async function checkBalance(address) {
    let stableCoin = common.connect(abis.erc20(), address);
    try {
        return await stableCoin.methods.balanceOf(User.address).call();
    } catch (e) {
        return ""
    }
}

async function showUserInfoForUSDTieredSTO() {
    let stableSymbols = [];
    let listOfStableCoins = await currentSTO.methods.getUsdTokens().call();

    for (const fundType in gbl.constants.FUND_RAISE_TYPES) {
        if (await currentSTO.methods.fundRaiseTypes(gbl.constants.FUND_RAISE_TYPES[fundType]).call()) {
            if (fundType == STABLE) {
                stableSymbols = await processAddress(listOfStableCoins)
            }
            let displayInvestorInvested = web3.utils.fromWei(await currentSTO.methods.investorInvested(User.address, gbl.constants.FUND_RAISE_TYPES[fundType]).call());
            if ((fundType == STABLE) && (stableSymbols.length)) {
                console.log(`    - Invested in stable coin(s):    ${displayInvestorInvested} USD`);
            } else {
                console.log(`    - Invested in ${fundType}:\t     ${displayInvestorInvested} ${fundType}`);
            }
        }
    }

    let displayInvestorInvestedUSD = web3.utils.fromWei(await currentSTO.methods.investorInvestedUSD(User.address).call());
    console.log(`    - Total invested in USD: ${displayInvestorInvestedUSD} USD`);

    let now = Math.floor(Date.now() / 1000);

    await generalTransferManager.methods.getKYCData([User.address]).call({}, function (error, result) {
        displayValidKYC = parseInt(result[2]) > now;
    });

    displayCannotBuy = await generalTransferManager.methods.getInvestorFlag(User.address, 1).call();

    console.log(`    - Can buy from STO:      ${(!displayCannotBuy) ? 'YES' : 'NO'}`);
    console.log(`    - Valid KYC:             ${(displayValidKYC) ? 'YES' : 'NO'}`);

    displayIsUserAccredited = await generalTransferManager.methods.getInvestorFlag(User.address, 0).call();

    console.log(`    - Accredited:            ${(displayIsUserAccredited) ? "YES" : "NO"}`)

    if (!displayIsUserAccredited) {
        let displayOverrideNonAccreditedLimitUSD = web3.utils.fromWei(await currentSTO.methods.nonAccreditedLimitUSDOverride(User.address).call());
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
    let stableSymbols = [];
    let listOfStableCoins = await currentSTO.methods.getUsdTokens().call();

    for (const fundType in gbl.constants.FUND_RAISE_TYPES) {
        if (await currentSTO.methods.fundRaiseTypes(gbl.constants.FUND_RAISE_TYPES[fundType]).call()) {
            raiseTypes.push(fundType);
            if (fundType == STABLE) {
                stableSymbols = await processAddress(listOfStableCoins)
            }
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
        Sold for stable coin(s):   ${web3.utils.fromWei(mintedPerTier)} ${displayTokenSymbol}`;
            } else if (type == POLY) {
                displayMintedPerTierPerType += `
        Sold for ${type}:\t\t   ${web3.utils.fromWei(mintedPerTier)} ${displayTokenSymbol} ${displayDiscountMinted}`;
      } else if (type == ETH) {
                displayMintedPerTierPerType += `
        Sold for ${type}:\t\t   ${web3.utils.fromWei(mintedPerTier)} ${displayTokenSymbol}`;
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

    let displayFundsRaisedPerType = '';
    let displayTokensSoldPerType = '';
    for (const type of raiseTypes) {
        let fundsRaised = web3.utils.fromWei(await currentSTO.methods.fundsRaised(gbl.constants.FUND_RAISE_TYPES[type]).call());
        if ((type == STABLE) && (stableSymbols.length)) {
            stableSymbols.forEach(async (stable) => {
                let raised = await getStableCoinsRaised(currentSTO, stable.address);
                displayFundsRaisedPerType += `
        ${stable.symbol}:\t\t\t   ${web3.utils.fromWei(raised)} ${stable.symbol}`;
            })
        } else {
            displayFundsRaisedPerType += `
        ${type}:\t\t\t   ${fundsRaised} ${type}`;
        }
        //Only show sold per raise type is more than one are allowed
        if (raiseTypes.length > 1) {
            let tokensSoldPerType = web3.utils.fromWei(await currentSTO.methods.getTokensSoldFor(gbl.constants.FUND_RAISE_TYPES[type]).call());
            if ((type == STABLE) && (stableSymbols.length)) {
                displayTokensSoldPerType += `
        Sold for stable coin(s):   ${tokensSoldPerType} ${displayTokenSymbol}`;
            } else {
                displayTokensSoldPerType += `
        Sold for ${type}:\t\t   ${tokensSoldPerType} ${displayTokenSymbol}`;
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
        Total USD:                 ${displayFundsRaisedUSD} USD
    `);

    if (displayCannotBuy) {
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

async function getStableCoinsRaised(currentSTO, address) {
    return await currentSTO.methods.stableCoinsRaised(address).call()
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

    let rate = web3.utils.fromWei(await currentSTO.methods.rate().call());
    let cost = new BigNumber(amt).div(rate);
    console.log(`This investment will cost ${cost} ${raiseTypes[0]}`);

    let costWei = web3.utils.toWei(cost.toString());
    if (raiseTypes[0] == 'POLY') {
        let userBalance = await polyBalance(User.address);
        if (parseInt(userBalance) >= parseInt(cost)) {
            let allowance = await polyToken.methods.allowance(User.address, STOAddress).call();
            if (parseInt(allowance) < parseInt(costWei)) {
                let approveAction = polyToken.methods.approve(STOAddress, costWei);
                await common.sendTransaction(approveAction, { from: User });
            }
            let actionBuyTokensWithPoly = currentSTO.methods.buyTokensWithPoly(costWei);
            let receipt = await common.sendTransaction(actionBuyTokensWithPoly, { from: User });
            logTokensPurchasedCappedSTO(receipt, 'POLY');
        } else {
            console.log(chalk.red(`Not enough balance to Buy tokens, Require ${cost} POLY but have ${userBalance} POLY.`));
            console.log(chalk.red(`Please purchase a smaller amount of tokens or access the POLY faucet to get the POLY to complete this txn.`));
            process.exit();
        }
    } else {
        let actionBuyTokens = currentSTO.methods.buyTokens(User.address);
        let receipt = await common.sendTransaction(actionBuyTokens, { from: User, value: costWei });
        logTokensPurchasedCappedSTO(receipt, 'ETH');
    }
    await showTokenInfo();
}

// Allow investor to buy tokens.
async function investUsdTieredSTO(currency, amount) {
    let listOfStableCoins = await currentSTO.methods.getUsdTokens().call();
    let stableSymbols = await processAddress(listOfStableCoins);

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
            let displayPrice = web3.utils.fromWei(await currentSTO.methods.convertToUSD(gbl.constants.FUND_RAISE_TYPES[type], web3.utils.toWei("1")).call());
            if (!((type == STABLE) && (stableSymbols.length))) {
                console.log(chalk.green(`   Current ${type} price:\t\t   ${displayPrice} USD`));
            }
        }
        if (raiseTypes.length > 1) {
            const stableIndex = raiseTypes.indexOf(STABLE);
            if (stableIndex > -1) {
                raiseTypes.splice(stableIndex, 1)
                stableSymbols.forEach((stable) => {
                    raiseTypes.push(stable.symbol)
                })
            }
            raiseType = raiseTypes[selectRaiseType('Choose one of the allowed raise types: ')];
        } else {
            if (raiseTypes[0] == STABLE) {
                raiseTypes.splice(raiseTypes.indexOf(STABLE), 1)
                stableSymbols.forEach((stable) => {
                    raiseTypes.push(stable.symbol)
                })
                raiseType = raiseTypes[selectRaiseType('Choose one of the allowed stable coin(s): ')];
            } else {
                raiseType = raiseTypes[0];
                console.log('');
            }
        }
    }

    let cost;
    if (typeof amount === 'undefined') {
        let investorInvestedUSD = await currentSTO.methods.investorInvestedUSD(User.address).call();
        let minimumInvestmentUSD = await currentSTO.methods.minimumInvestmentUSD().call();
        let minimumInvestmentRaiseType;

        // if raiseType is different than ETH or POLY, we assume is STABLE
        if ((raiseType != ETH) && (raiseType != POLY)) {
            minimumInvestmentRaiseType = await currentSTO.methods.convertFromUSD(gbl.constants.FUND_RAISE_TYPES[STABLE], minimumInvestmentUSD).call();
        } else {
            minimumInvestmentRaiseType = await currentSTO.methods.convertFromUSD(gbl.constants.FUND_RAISE_TYPES[raiseType], minimumInvestmentUSD).call();
        }

        let minimumCost = web3.utils.fromWei((new BigNumber(investorInvestedUSD)).minus(new BigNumber(minimumInvestmentRaiseType)));
        cost = input.readNumberGreaterThan(minimumCost, (chalk.yellow(`Enter the amount of ${raiseType} you would like to invest or press 'Enter' to exit: `)));
    } else {
        cost = amount;
    }
    if (cost == "") process.exit();

    let costWei = web3.utils.toWei(cost.toString());

    let tokensToBuy;

    let stableSymbolsAndBalance;
    let stableInfo;

    // if raiseType is different than ETH or POLY, we assume is STABLE
    if ((raiseType != ETH) && (raiseType != POLY)) {
        stableSymbolsAndBalance = await processAddressWithBalance(listOfStableCoins);
        stableInfo = stableSymbolsAndBalance.find(o => o.symbol === raiseType);
        let stableCoin = common.connect(abis.erc20(), stableInfo.address);
        if (parseInt(stableInfo.balance) >= parseInt(costWei)) {
            let stableCoin = common.connect(abis.erc20(), stableInfo.address);
            let allowance = await stableCoin.methods.allowance(User.address, STOAddress).call();
            if (parseInt(allowance) < parseInt(costWei)) {
                let approveAction = stableCoin.methods.approve(STOAddress, costWei);
                await common.sendTransaction(approveAction, { from: User });
                console.log(chalk.green(`You have approved ${cost} ${stableInfo.symbol} to be invested in this STO.\n`));
            }
            tokensToBuy = await currentSTO.methods.buyWithUSD(User.address, costWei, stableInfo.address).call({ from: User.address});
        } else {
            console.log(chalk.red(`Not enough balance to Buy tokens, Require ${cost} ${stableInfo.symbol} but have ${stableInfo.balance} ${stableInfo.symbol}.`));
            console.log(chalk.red(`Please purchase a smaller amount of tokens.`));
            process.exit();
        }

    } else if (raiseType == POLY) {
        let userBalance = await polyBalance(User.address);
        if (parseFloat(userBalance) >= parseFloat(cost)) {
            let allowance = await polyToken.methods.allowance(User.address, STOAddress).call();
            if (parseInt(allowance) < parseInt(costWei)) {
                let approveAction = polyToken.methods.approve(STOAddress, costWei);
                await common.sendTransaction(approveAction, { from: User });
                console.log(chalk.green(`You have approved ${cost} POLY to be invested in this STO.\n`));
            }
            tokensToBuy = await currentSTO.methods.buyWithPOLY(User.address, costWei).call({ from: User.address});
        } else {
            console.log(chalk.red(`Not enough balance to Buy tokens, Require ${cost} POLY but have ${userBalance} POLY.`));
            console.log(chalk.red(`Please purchase a smaller amount of tokens.`));
            process.exit();
        }

    } else {
        let userBalance = web3.utils.fromWei(await web3.eth.getBalance(User.address));
        if (parseFloat(userBalance) >= parseFloat(cost)) {
            tokensToBuy = await currentSTO.methods.buyWithETH(User.address).call({ from: User.address, value: costWei });
        } else {
            console.log(chalk.red(`Not enough balance to Buy tokens, Require ${cost} ETH but have ${userBalance} ETH.`));
            console.log(chalk.red(`Please purchase a smaller amount of tokens.`));
            process.exit();
        }
      }

    let minTokenToBuy = tokensToBuy[2];
    console.log(chalk.yellow(`You are going to spend ${web3.utils.fromWei(tokensToBuy[1])} ${raiseType} (${web3.utils.fromWei(tokensToBuy[0])} USD) to buy ${web3.utils.fromWei(minTokenToBuy)} ${STSymbol} approx.`));
    console.log(chalk.yellow(`Due to ${raiseType} price changes and network delays, it is possible that the final amount of purchased tokens is lower.`));
    if (typeof amount !== 'undefined' || !readlineSync.keyInYNStrict(`Do you want the transaction to fail if this happens?`)) {
        minTokenToBuy = 0;
    }

    if (raiseType == POLY) {
        let actionBuyWithPoly = currentSTO.methods.buyWithPOLYRateLimited(User.address, costWei, minTokenToBuy);
        let receipt = await common.sendTransaction(actionBuyWithPoly, { from: User, factor: 2 });
        logTokensPurchasedUSDTieredSTO(receipt);
    } else if ((raiseType != POLY) && (raiseType != ETH)) {
        let actionBuyWithUSD = currentSTO.methods.buyWithUSDRateLimited(User.address, costWei, minTokenToBuy, stableInfo.address);
        let receipt = await common.sendTransaction(actionBuyWithUSD, { from: User, factor: 1.5 });
        logTokensPurchasedUSDTieredSTO(receipt);
    } else {
        let actionBuyWithETH = currentSTO.methods.buyWithETHRateLimited(User.address, minTokenToBuy);
        let receipt = await common.sendTransaction(actionBuyWithETH, { from: User, value: costWei });
        logTokensPurchasedUSDTieredSTO(receipt);
    }

    await showTokenInfo();
    await showUserInfoForUSDTieredSTO();
}

function selectRaiseType(msg) {
    return readlineSync.keyInSelect(raiseTypes, msg, { cancel: false });
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
  purchasing ${web3.utils.fromWei(event._tokens)} ${STSymbol.toUpperCase()} at ${web3.utils.fromWei(event._tierPrice)} USD
  for beneficiary account ${event._beneficiary}`);
    };
}

function logTokensPurchasedCappedSTO(receipt, displayRaiseType) {
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
    executeApp: async function (investorAddress, investorPrivKey, symbol, currency, amount) {
        return executeApp(investorAddress, investorPrivKey, symbol, currency, amount);
    }
}
