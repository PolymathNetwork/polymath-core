// Libraries for terminal prompts
var readlineSync = require('readline-sync');
var BigNumber = require('bignumber.js');
var chalk = require('chalk');
var common = require('./common/common_functions');

// Generate web3 instance
const Web3 = require('web3');
if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else {
  // set the provider you want from Web3.providers
  web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

let defaultGasPrice;

// Load Contract artifacts
var contracts = require("./helpers/contract_addresses");
let securityTokenRegistryAddress = contracts.securityTokenRegistryAddress();
let polytokenAddress = contracts.polyTokenAddress();

let securityTokenRegistryABI;
let securityTokenABI;
let cappedSTOABI;
let usdTieredSTOABI;
let polytokenABI;
let generalTransferManagerABI;

let securityTokenRegistry;
let securityToken;
let selectedSTO;
let currentSTO;
let polyToken;
let generalTransferManager;

try {
  securityTokenRegistryABI  = JSON.parse(require('fs').readFileSync('./build/contracts/SecurityTokenRegistry.json').toString()).abi;
  securityTokenABI          = JSON.parse(require('fs').readFileSync('./build/contracts/SecurityToken.json').toString()).abi;
  cappedSTOABI              = JSON.parse(require('fs').readFileSync('./build/contracts/CappedSTO.json').toString()).abi;
  usdTieredSTOABI           = JSON.parse(require('fs').readFileSync('./build/contracts/USDTieredSTO.json').toString()).abi;
  polytokenABI              = JSON.parse(require('fs').readFileSync('./build/contracts/PolyTokenFaucet.json').toString()).abi;
  generalTransferManagerABI = JSON.parse(require('fs').readFileSync('./build/contracts/GeneralTransferManager.json').toString()).abi;
} catch (err) {
  console.log(chalk.red(`Couldn't find contracts' artifacts. Make sure you ran truffle compile first`));
  return;
}

// Init user address variables
let Issuer;
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
async function executeApp(investor, symbol, currency, amount) {
    // Init user accounts
    let accounts = await web3.eth.getAccounts();
    Issuer = accounts[0];
    defaultGasPrice = common.getGasPrice(await web3.eth.net.getId());
    
    setup();

    try {
        common.logAsciiBull();
        console.log("********************************************");
        console.log("Welcome to the Command-Line Investor Portal.");
        console.log("********************************************");
    
        if (typeof investor === 'undefined') {
            User = readlineSync.question(chalk.yellow(`\nEnter your public address to log in as an investor. Otherwise, press 'Enter' to log in as the token issuer: `));
        } else {
            User = investor;
        }
        if (User == "") User = Issuer;
    
        await showUserInfo(User);
        await inputSymbol(symbol);
        switch (selectedSTO) {
            case 'CappedSTO':
                currentSTO = new web3.eth.Contract(cappedSTOABI, STOAddress);
                await showCappedSTOInfo();
                await investCappedSTO(currency, amount);
                break;
            case 'USDTieredSTO':
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
        securityTokenRegistry = new web3.eth.Contract(securityTokenRegistryABI, securityTokenRegistryAddress);
        securityTokenRegistry.setProvider(web3.currentProvider);
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

    STAddress = await securityTokenRegistry.methods.getSecurityTokenAddress(STSymbol).call({from: User});
    if (STAddress == "0x0000000000000000000000000000000000000000"){
        console.log(`Token symbol provided is not a registered Security Token. Please enter another symbol.`);
    } else {
        securityToken = new web3.eth.Contract(securityTokenABI, STAddress);

        await showTokenInfo();

        let res = await securityToken.methods.getModule(2,0).call({from: User});
        GTMAddress = res[1];
        generalTransferManager = new web3.eth.Contract(generalTransferManagerABI,GTMAddress);

        res = await securityToken.methods.getModule(3,0).call({from: User});
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
        let displayPolyPrice = web3.utils.fromWei(await currentSTO.methods.convertToUSD(web3.utils.fromAscii("POLY"), web3.utils.toWei("1")).call({from: User}));
        let displayEthPrice = web3.utils.fromWei(await currentSTO.methods.convertToUSD(web3.utils.fromAscii("ETH"), web3.utils.toWei("1")).call({from: User}));
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
            let displayPolyPrice = web3.utils.fromWei(await currentSTO.methods.convertToUSD(web3.utils.fromAscii("POLY"), web3.utils.toWei(1)).call({from: User}));
            console.log(chalk.green(`   Current POLY price:             ${displayPolyPrice} USD\n`));
        } else {
            let displayEthPrice = web3.utils.fromWei(await currentSTO.methods.convertToUSD(web3.utils.fromAscii("ETH"), web3.utils.toWei(1)).call({from: User}));
            console.log(chalk.green(`   Current ETH price:              ${displayEthPrice} USD\n`));
        }
    }

    let cost;
    if (typeof amount === 'undefined') {
        let investorInvestedUSD = web3.utils.fromWei(await currentSTO.methods.investorInvestedUSD(User).call({from: User}));
        let minimumInvestmentUSD = await currentSTO.methods.minimumInvestmentUSD().call({from: User});
        let minimumInvestmentRaiseType = await currentSTO.methods.convertFromUSD(web3.utils.fromAscii(raiseType), minimumInvestmentUSD).call({from: User});      
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
        let userBalance = await polyBalance(User);
        if (parseInt(userBalance) >= parseInt(cost)) {
            let allowance = await polyToken.methods.allowance(STOAddress, User).call({from: User});
            if (allowance < costWei) {
                let approveAction = polyToken.methods.approve(STOAddress, costWei);
                let GAS = await common.estimateGas(approveAction, User, 1.2);
                await approveAction.send({from: User, gas: GAS, gasPrice: defaultGasPrice });
            }
            let actionBuyWithPoly = currentSTO.methods.buyWithPOLY(User, costWei);
            let GAS = await common.estimateGas(actionBuyWithPoly, User, 1.2);
            await actionBuyWithPoly.send({from: User, gas: GAS, gasPrice: defaultGasPrice })
            .on('transactionHash', function(hash) { logTransactionHash(hash) })
            .on('receipt', function(receipt) { logTokensPurchasedUSDTieredSTO(receipt) });
        } else {
            console.log(chalk.red(`Not enough balance to Buy tokens, Require ${cost} POLY but have ${userBalance} POLY.`));
            console.log(chalk.red(`Please purchase a smaller amount of tokens or access the POLY faucet to get the POLY to complete this txn.`));
            process.exit();
        }
    } else {
        let actionBuyWithETH = currentSTO.methods.buyWithETH(User);
        let GAS = await common.estimateGas(actionBuyWithETH, User, 1.2, web3.utils.toWei(cost.toString()));
        await actionBuyWithETH.send({ from: User, value:costWei, gas: GAS, gasPrice:defaultGasPrice})
        .on('transactionHash', function(hash) { logTransactionHash(hash) })
        .on('receipt', function(receipt) { logTokensPurchasedUSDTieredSTO(receipt) });
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

    let cost = amt/displayRate;
    console.log(`This investment will cost ${cost} ${displayRaiseType}`);

    let costWei = web3.utils.toWei(cost.toString());
    if (displayRaiseType == 'POLY') {
        let userBalance = await polyBalance(User); 
        if (parseInt(userBalance) >= parseInt(cost)) {
            let allowance = await polyToken.methods.allowance(STOAddress, User).call({from: User});
            if (allowance < costWei) {
                let approveAction = polyToken.methods.approve(STOAddress, costWei);
                let GAS = await common.estimateGas(approveAction, User, 1.2);
                await approveAction.send({from: User, gas: GAS, gasPrice: defaultGasPrice });
            }
            let actionBuyTokensWithPoly = currentSTO.methods.buyTokensWithPoly(costWei);
            let GAS = await common.estimateGas(actionBuyTokensWithPoly, User, 1.2);
            await actionBuyTokensWithPoly.send({from: User, gas: GAS, gasPrice: defaultGasPrice })
            .on('transactionHash', function(hash) { logTransactionHash(hash) })
            .on('receipt', function(receipt) { logTokensPurchasedCappedSTO(receipt) });
        } else {
            console.log(chalk.red(`Not enough balance to Buy tokens, Require ${cost} POLY but have ${userBalance} POLY.`));
            console.log(chalk.red(`Please purchase a smaller amount of tokens or access the POLY faucet to get the POLY to complete this txn.`));
            process.exit();
        }
    } else {
        let actionBuyTokens = currentSTO.methods.buyTokens(User);
        let GAS = await common.estimateGas(actionBuyTokens, User, 1.2, costWei);
        await actionBuyTokens.send({ from: User, value: costWei, gas: GAS, gasPrice: defaultGasPrice})
        .on('transactionHash', function(hash) { logTransactionHash(hash) })
        .on('receipt', function(receipt) { logTokensPurchasedCappedSTO(receipt) });
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
    displayTokenSymbol = await securityToken.methods.symbol().call({from: User});
    let displayTokenSupply = await securityToken.methods.totalSupply().call({from: User});
    let displayUserTokens = await securityToken.methods.balanceOf(User).call({from: User});

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
    if (await currentSTO.methods.fundRaiseType(0).call({from: User})) {
        let displayInvestorInvestedETH = web3.utils.fromWei(await currentSTO.methods.investorInvestedETH(User).call({from: User}));
        console.log(`    - Invested in ETH:       ${displayInvestorInvestedETH} ETH`);
    }
    if (await currentSTO.methods.fundRaiseType(1).call({from: User})) {
        let displayInvestorInvestedPOLY = web3.utils.fromWei(await currentSTO.methods.investorInvestedPOLY(User).call({from: User}));
        console.log(`    - Invested in POLY:      ${displayInvestorInvestedPOLY} POLY`);
    }
    let displayInvestorInvestedUSD = web3.utils.fromWei(await currentSTO.methods.investorInvestedUSD(User).call({from: User}));
    console.log(`    - Invested in USD:       ${displayInvestorInvestedUSD} USD`);
    
    await generalTransferManager.methods.whitelist(User).call({from: User}, function(error, result){
        displayCanBuy = result.canBuyFromSTO;
    });
    console.log(`    - Whitelisted:           ${(displayCanBuy)?'YES':'NO'}`)

    let displayIsUserAccredited = await currentSTO.methods.accredited(User).call({from: User});
    console.log(`    - Accredited:            ${(displayIsUserAccredited)?"YES":"NO"}`)
    
    if (!await currentSTO.methods.accredited(User).call({from: User})) {
        let displayNonAccreditedLimitUSD = web3.utils.fromWei(await currentSTO.methods.nonAccreditedLimitUSD().call({from: User}));
        let displayTokensRemainingAllocation = displayNonAccreditedLimitUSD - displayInvestorInvestedUSD;
        console.log(`    - Remaining allocation:  ${(displayTokensRemainingAllocation > 0 ? displayTokensRemainingAllocation : 0)} USD`);
    }
    console.log('\n');
}

async function showUSDTieredSTOInfo() {
    let displayStartTime = await currentSTO.methods.startTime().call({from: User});
    let displayEndTime = await currentSTO.methods.endTime().call({from: User});
    let displayCurrentTier = parseInt(await currentSTO.methods.currentTier().call({from: User})) + 1;
    let displayNonAccreditedLimitUSD = web3.utils.fromWei(await currentSTO.methods.nonAccreditedLimitUSD().call({from: User}));
    let displayMinimumInvestmentUSD = web3.utils.fromWei(await currentSTO.methods.minimumInvestmentUSD().call({from: User}));
    let ethRaise = await currentSTO.methods.fundRaiseType(0).call({from: User});
    let polyRaise = await currentSTO.methods.fundRaiseType(1).call({from: User});
    let displayTokensSold = web3.utils.fromWei(await currentSTO.methods.getTokensSold().call({from: Issuer}));
    let displayInvestorCount = await currentSTO.methods.investorCount().call({from: User});
    let displayIsFinalized = await currentSTO.methods.isFinalized().call({from: User});
    let displayIsOpen = await currentSTO.methods.isOpen().call({from: User});
    let displayTokenSymbol = await securityToken.methods.symbol().call({from: User});

    let tiersLength = await currentSTO.methods.getNumberOfTiers().call({from: Issuer});;

    let displayTiers = "";
    let displayMintedPerTier = "";
    for (let t = 0; t < tiersLength; t++) {
        let ratePerTier = await currentSTO.methods.ratePerTier(t).call({from: User});
        let tokensPerTierTotal = await currentSTO.methods.tokensPerTierTotal(t).call({from: User});
        let mintedPerTierTotal = await currentSTO.methods.mintedPerTierTotal(t).call({from: User});

        let displayMintedPerTierETH = "";
        if (ethRaise) {
          let mintedPerTierETH = await currentSTO.methods.mintedPerTierETH(t).call({from: Issuer});
    
          displayMintedPerTierETH = `
        Sold for ETH:              ${web3.utils.fromWei(mintedPerTierETH)} ${displayTokenSymbol}`
        }

        let displayMintedPerTierPOLY = "";
        let displayDiscountTokens = "";
        let mintedPerTierDiscountPoly = "0";
        if (polyRaise) {
            let displayDiscountMinted = "";
            let tokensPerTierDiscountPoly = await currentSTO.methods.tokensPerTierDiscountPoly(t).call({from: Issuer});
            if (tokensPerTierDiscountPoly > 0) {
                let ratePerTierDiscountPoly = await currentSTO.methods.ratePerTierDiscountPoly(t).call({from: Issuer});
                mintedPerTierDiscountPoly = await currentSTO.methods.mintedPerTierDiscountPoly(t).call({from: Issuer});

                displayDiscountTokens = `
        Tokens at discounted rate: ${web3.utils.fromWei(tokensPerTierDiscountPoly)} ${displayTokenSymbol}
        Discounted rate:           ${web3.utils.fromWei(ratePerTierDiscountPoly, 'ether')} USD per Token`;

                displayDiscountMinted = `(${web3.utils.fromWei(mintedPerTierDiscountPoly)} ${displayTokenSymbol} at discounted rate)`;
            }

            let mintedPerTierRegularPOLY = await currentSTO.methods.mintedPerTierRegularPoly(t).call({from: Issuer});
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

    let displayFundsRaisedUSD = web3.utils.fromWei(await currentSTO.methods.fundsRaisedUSD().call({from: Issuer}));

    let displayFundsRaisedETH = '';
    let displayTokensSoldETH = '';
    if (ethRaise) {
        let fundsRaisedETH = web3.utils.fromWei(await currentSTO.methods.fundsRaisedETH().call({from: Issuer}));
        displayFundsRaisedETH = `
        ETH:                       ${fundsRaisedETH} ETH`;
        
        //Only show sold for ETH if POLY raise is allowed too
        if (polyRaise) {
            let tokensSoldETH = web3.utils.fromWei(await currentSTO.methods.getTokensSoldForETH().call({from: Issuer}));
            displayTokensSoldETH = `
        Sold for ETH:              ${tokensSoldETH} ${displayTokenSymbol}`;
        }
    }

    let displayFundsRaisedPOLY = '';
    let displayTokensSoldPOLY = '';
    if (polyRaise) {
        let fundsRaisedPOLY = web3.utils.fromWei(await currentSTO.methods.fundsRaisedPOLY().call({from: Issuer}));
        displayFundsRaisedPOLY = `
        POLY:                      ${fundsRaisedPOLY} POLY`;

        //Only show sold for POLY if ETH raise is allowed too
        if (ethRaise) {
            let tokensSoldPOLY = web3.utils.fromWei(await currentSTO.methods.getTokensSoldForPOLY().call({from: Issuer}));
            displayTokensSoldPOLY = `
        Sold for POLY:             ${tokensSoldPOLY} ${displayTokenSymbol}`;
        }
    }


    displayRaiseType;
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
    - Non Accredited Limit:        ${displayNonAccreditedLimitUSD} USD
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
    let displayStartTime = await currentSTO.methods.startTime().call({from: User});
    let displayEndTime = await currentSTO.methods.endTime().call({from: User});
    displayRate = await currentSTO.methods.rate().call({from: User});
    let displayCap = await currentSTO.methods.cap().call({from: User});
    let displayFundsRaised = await currentSTO.methods.fundsRaised().call({from: User});
    let displayTokensSold = await currentSTO.methods.tokensSold().call({from: User});
    let displayInvestorCount = await currentSTO.methods.investorCount().call({from: User});
    let displayTokensRemaining = web3.utils.fromWei(displayCap) - web3.utils.fromWei(displayTokensSold);

    let displayRaiseType = await currentSTO.methods.fundRaiseType(0).call({from: Issuer}) ? 'ETH' : 'POLY';

    await generalTransferManager.methods.whitelist(User).call({from: User}, function(error, result){
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

function logTransactionHash(hash) {
    console.log(`
        Your transaction is being processed. Please wait...
        TxHash: ${hash}\n`);
}

function logTokensPurchasedUSDTieredSTO(receipt) {
    console.log(chalk.green(`
        Congratulations! The token purchase was successfully completed.`
    ));
    if (!Array.isArray(receipt.events.TokenPurchase)) {
        console.log(`
        Account ${receipt.events.TokenPurchase.returnValues._purchaser}
        invested ${web3.utils.fromWei(receipt.events.TokenPurchase.returnValues._usdAmount)} USD
        purchasing ${web3.utils.fromWei(receipt.events.TokenPurchase.returnValues._tokens)} ${displayTokenSymbol.toUpperCase()} at ${web3.utils.fromWei(receipt.events.TokenPurchase.returnValues._tierPrice)} USD
        for beneficiary account ${receipt.events.TokenPurchase.returnValues._beneficiary}`);
    } else {
        receipt.events.TokenPurchase.forEach(event => {
            console.log(`
        Account ${event.returnValues._purchaser}
        invested ${web3.utils.fromWei(event.returnValues._usdAmount)} USD
        purchasing ${web3.utils.fromWei(event.returnValues._tokens)} ${displayTokenSymbol.toUpperCase()} at ${web3.utils.fromWei(event.returnValues._tierPrice)} USD
        for beneficiary account ${event.returnValues._beneficiary}`);
        });
    }
    console.log(`
        Review it on Etherscan.
        TxHash: ${receipt.transactionHash}\n`
    );
}

function logTokensPurchasedCappedSTO(receipt) {
    console.log(chalk.green(`
        Congratulations! The token purchase was successfully completed.
            `));
    if (!Array.isArray(receipt.events.TokenPurchase)) {
        console.log(`
        Account ${receipt.events.TokenPurchase.returnValues.purchaser}
        invested ${web3.utils.fromWei(receipt.events.TokenPurchase.returnValues.value)} ${displayRaiseType}
        purchasing ${web3.utils.fromWei(receipt.events.TokenPurchase.returnValues.amount)} ${displayTokenSymbol.toUpperCase()}
        for beneficiary account ${receipt.events.TokenPurchase.returnValues.beneficiary}`);
    }
    else {
        receipt.events.TokenPurchase.forEach(event => {
            console.log(`
        Account ${event.returnValues.purchaser}
        invested ${web3.utils.fromWei(event.returnValues.value)} ${displayRaiseType}
        purchasing ${web3.utils.fromWei(event.returnValues.amount)} ${displayTokenSymbol.toUpperCase()}
        for beneficiary account ${event.returnValues.beneficiary}`);
        });
    }
    console.log(`
        Review it on Etherscan.
        TxHash: ${receipt.transactionHash}\n`);
}

module.exports = {
    executeApp: async function(user, symbol, currency, amount) {
          return executeApp(user, symbol, currency, amount);
      }
}
