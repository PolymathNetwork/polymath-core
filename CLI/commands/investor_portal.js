// Libraries for terminal prompts
var readlineSync = require('readline-sync');
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

let DEFAULT_GAS_PRICE = 80000000000;

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

// Program Flow Control
let validSymbol = false;

// Global display variables
let displayRate;
let displayRaiseType;
let displayTokenSymbol;

// Start Script
async function executeApp() {
    // Init user accounts
    try {
        let accounts = await web3.eth.getAccounts();
        Issuer = accounts[0];
    
        welcome();
    }
    catch(err) {
        console.error(err);
    }
};

// Welcome Message
async function welcome() {
    common.logAsciiBull();
    console.log("********************************************");
    console.log("Welcome to the Command-Line Investor Portal.");
    console.log("********************************************");

    try {
        securityTokenRegistry = new web3.eth.Contract(securityTokenRegistryABI, securityTokenRegistryAddress);
        securityTokenRegistry.setProvider(web3.currentProvider);
        polyToken = new web3.eth.Contract(polytokenABI, polytokenAddress);
        polyToken.setProvider(web3.currentProvider);
    }catch(err){
        console.log(err);
        console.log(chalk.red(`There was a problem getting the contracts. Make sure they are deployed to the selected network.`));
        process.exit();
    }

    User = readlineSync.question(chalk.yellow(`\nEnter your public address to log in as an investor. Otherwise, press 'Enter' to log in as the token issuer: `));
    if (User == "") User = Issuer;

    await showUserInfo(User);

    while (!validSymbol) {
        await inputSymbol();
    }
}

// Input security token symbol or exit
async function inputSymbol() {
    STSymbol = readlineSync.question(chalk.yellow(`Enter the symbol of a registered security token or press 'Enter' to exit: `));
    if (STSymbol == "") {
        process.exit();
    };

    STAddress = await securityTokenRegistry.methods.getSecurityTokenAddress(STSymbol).call({from: User});
    if(STAddress == "0x0000000000000000000000000000000000000000"){
        console.log(`Token symbol provided is not a registered Security Token. Please enter another symbol.`);
    } else {
        validSymbol = true;
        securityToken = new web3.eth.Contract(securityTokenABI, STAddress);
        
        await showTokenInfo();

        let res = await securityToken.methods.getModule(2,0).call({from: User});
        GTMAddress = res[1];
        generalTransferManager = new web3.eth.Contract(generalTransferManagerABI,GTMAddress);

        res = await securityToken.methods.getModule(3,0).call({from: User});
        STOAddress = res[1];
        if (STOAddress != "0x0000000000000000000000000000000000000000") {
            selectedSTO = web3.utils.toAscii(res[0]).replace(/\u0000/g, '');
            switch (selectedSTO) {
                case 'CappedSTO':
                  currentSTO = new web3.eth.Contract(cappedSTOABI, STOAddress);
                  await showCappedSTOInfo();
                  break;
                case 'USDTieredSTO':
                  currentSTO = new web3.eth.Contract(usdTieredSTOABI, STOAddress);
                  await showUSDTieredSTOInfo();
                  break;
            }
        } else {
            console.log(chalk.red(`There is no STO module attached to the ${displayTokenSymbol.toUpperCase()} Token. No further actions can be taken.`));
            validSymbol = false;
            return;
        }
    }
}

// Allow investor to buy tokens.
async function investUsdTieredSTO() {
    let raiseType;
    if (displayRaiseType == "ETH and POLY") {
        let type = readlineSync.question(chalk.yellow('Enter' + chalk.green(` P `) + 'to buy tokens with POLY or' + chalk.green(` E `) + 'to use ETH instead (E): '));
        if (type.toUpperCase() == 'P') {
            raiseType = "POLY";
        } else {
            raiseType = "ETH";
        }
    } else {
        raiseType = displayRaiseType;
    }

    let cost = readlineSync.question(chalk.yellow(`Enter the amount of ${raiseType} you would like to invest or press 'Enter' to exit: `));
    if (cost == "") {
        process.exit();
    };

    if (raiseType == 'POLY') {
        try {
            let userBalance = await polyBalance(User);
            let costWei = web3.utils.toWei(cost.toString());
            if (parseInt(userBalance) >= parseInt(cost)) {
                let allowance = await polyToken.methods.allowance(STOAddress, User).call({from: User});
                if (allowance < costWei) {
                    let approveAction = polyToken.methods.approve(STOAddress, costWei);
                    let GAS = await common.estimateGas(approveAction, User, 1.2);
                    await approveAction.send({from: User, gas: GAS, gasPrice: DEFAULT_GAS_PRICE })
                    .on('receipt', function(receipt) {
                    })
                    .on('error', console.error);
                }
                let actionBuyWithPoly = currentSTO.methods.buyWithPOLY(User, costWei);
                let GAS = await common.estimateGas(actionBuyWithPoly, User, 1.2);
                await actionBuyWithPoly.send({from: User, gas: GAS, gasPrice: DEFAULT_GAS_PRICE })
                .on('transactionHash', function(hash){
                    console.log(`
        Your transaction is being processed. Please wait...
        TxHash: ${hash}\n`
                    );
                })
                .on('receipt', function(receipt){
                    console.log(chalk.green(`
        Congratulations! The token purchase was successfully completed.
                    `));
                    console.log(`
        Account ${receipt.events.TokenPurchase.returnValues._purchaser}
        invested ${web3.utils.fromWei(receipt.events.TokenPurchase.returnValues._usdAmount)} USD
        purchasing ${web3.utils.fromWei(receipt.events.TokenPurchase.returnValues._tokens)} ${displayTokenSymbol.toUpperCase()}
        for beneficiary account ${receipt.events.TokenPurchase.returnValues._beneficiary}

        Review it on Etherscan.
        TxHash: ${receipt.transactionHash}\n`
                    );
                });
                showTokenInfo()
            } else {
                console.log(chalk.red(`Not enough balance to Buy tokens, Require ${cost} POLY but have ${userBalance} POLY.`));
                console.log(chalk.red(`Please purchase a smaller amount of tokens or access the POLY faucet to get the POLY to complete this txn.`));
                process.exit();
            }
        }catch (err){
            console.log(err.message);
            return;
        }
    } else {
        let actionBuyWithETH = currentSTO.methods.buyWithETH(User);
        let GAS = await common.estimateGas(actionBuyWithETH, User, 1.2, web3.utils.toWei(cost.toString()));
        await actionBuyWithETH.send({ from: User, value:web3.utils.toWei(cost.toString()), gas: GAS, gasPrice:DEFAULT_GAS_PRICE})
        .on('transactionHash', function(hash){
            console.log(`
        Your transaction is being processed. Please wait...
        TxHash: ${hash}\n`
            );
        })
        .on('receipt', function(receipt){
            console.log(chalk.green(`
        Congratulations! The token purchase was successfully completed.
            `));
            console.log(`
        Account ${receipt.events.TokenPurchase.returnValues._purchaser}
        invested ${web3.utils.fromWei(receipt.events.TokenPurchase.returnValues._usdAmount)} USD
        purchasing ${web3.utils.fromWei(receipt.events.TokenPurchase.returnValues._tokens)} ${displayTokenSymbol.toUpperCase()}
        for beneficiary account ${receipt.events.TokenPurchase.returnValues._beneficiary}

        Review it on Etherscan.
        TxHash: ${receipt.transactionHash}\n`
            );
        });
        showTokenInfo()
    }

}

// Allow investor to buy tokens.
async function investCappedSTO() {
    let amt = readlineSync.question(chalk.yellow(`Enter the amount of ${displayTokenSymbol.toUpperCase()} you would like to purchase or press 'Enter' to exit. `));
    if (amt == "") {
        process.exit();
    };
    let cost = amt/displayRate
    console.log(`This investment will cost ${cost} ${displayRaiseType}`);

    if (displayRaiseType == 'POLY') {
        try {
            let userBalance = await polyBalance(User);
            let costWei = web3.utils.toWei(cost.toString());
            if (parseInt(userBalance) >= parseInt(cost)) {
                let allowance = await polyToken.methods.allowance(STOAddress, User).call({from: User});
                if (allowance < costWei) {
                    let approveAction = polyToken.methods.approve(STOAddress, costWei);
                    let GAS = await common.estimateGas(approveAction, User, 1.2);
                    await approveAction.send({from: User, gas: GAS, gasPrice: DEFAULT_GAS_PRICE })
                    .on('receipt', function(receipt) {
                    })
                    .on('error', console.error);
                }
                let actionBuyTokensWithPoly = currentSTO.methods.buyTokensWithPoly(costWei);
                let GAS = await common.estimateGas(actionBuyTokensWithPoly, User, 1.2);
                await actionBuyTokensWithPoly.send({from: User, gas: GAS, gasPrice: DEFAULT_GAS_PRICE })
                .on('transactionHash', function(hash){
                    console.log(`
        Your transaction is being processed. Please wait...
        TxHash: ${hash}\n`
                    );
                })
                .on('receipt', function(receipt){
                    console.log(chalk.green(`
        Congratulations! The token purchase was successfully completed.
                    `));
                    console.log(`
        Account ${receipt.events.TokenPurchase.returnValues.purchaser}
        invested ${web3.utils.fromWei(receipt.events.TokenPurchase.returnValues.value)} POLY
        purchasing ${web3.utils.fromWei(receipt.events.TokenPurchase.returnValues.amount)} ${displayTokenSymbol.toUpperCase()}
        for beneficiary account ${receipt.events.TokenPurchase.returnValues.beneficiary}

        Review it on Etherscan.
        TxHash: ${receipt.transactionHash}\n`
                    );
                });
                showTokenInfo()
            } else {
                console.log(chalk.red(`Not enough balance to Buy tokens, Require ${cost} POLY but have ${userBalance} POLY.`));
                console.log(chalk.red(`Please purchase a smaller amount of tokens or access the POLY faucet to get the POLY to complete this txn.`));
                process.exit();
            }
        }catch (err){
            console.log(err.message);
            return;
        }
    } else {
        let actionBuyTokens = currentSTO.methods.buyTokens(User);
        let GAS = await common.estimateGas(actionBuyTokens, User, 1.2, web3.utils.toWei(cost.toString()));
        await actionBuyTokens.send({ from: User, value:web3.utils.toWei(cost.toString()), gas: GAS, gasPrice:DEFAULT_GAS_PRICE})
        .on('transactionHash', function(hash){
            console.log(`
        Your transaction is being processed. Please wait...
        TxHash: ${hash}\n`
            );
        })
        .on('receipt', function(receipt){
            console.log(chalk.green(`
        Congratulations! The token purchase was successfully completed.
            `));
            console.log(`
        Account ${receipt.events.TokenPurchase.returnValues.purchaser}
        invested ${web3.utils.fromWei(receipt.events.TokenPurchase.returnValues.value)} ETH
        purchasing ${web3.utils.fromWei(receipt.events.TokenPurchase.returnValues.amount)} ${displayTokenSymbol.toUpperCase()}
        for beneficiary account ${receipt.events.TokenPurchase.returnValues.beneficiary}

        Review it on Etherscan.
        TxHash: ${receipt.transactionHash}\n`
            );
        });
        showTokenInfo()
    }

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
    **************    Security Token Information    ***************
    - Address:           ${STAddress}
    - Token symbol:      ${displayTokenSymbol.toUpperCase()}
    - Total supply:      ${web3.utils.fromWei(displayTokenSupply)} ${displayTokenSymbol.toUpperCase()}
    - User balance:      ${web3.utils.fromWei(displayUserTokens)} ${displayTokenSymbol.toUpperCase()}
    `);
}

async function showUSDTieredSTOInfo() {
    let displayStartTime = await currentSTO.methods.startTime().call({from: User});
    let displayEndTime = await currentSTO.methods.endTime().call({from: User});
    let displayCurrentTier = parseInt(await currentSTO.methods.currentTier().call({from: User})) + 1;
    let displayNonAccreditedLimitUSD = web3.utils.fromWei(await currentSTO.methods.nonAccreditedLimitUSD().call({from: User}));
    let displayMinimumInvestmentUSD = web3.utils.fromWei(await currentSTO.methods.minimumInvestmentUSD().call({from: User}));
    let ethRaise = await currentSTO.methods.fundRaiseType(0).call({from: User});
    let polyRaise = await currentSTO.methods.fundRaiseType(1).call({from: User});
    let displayInvestorCount = await currentSTO.methods.investorCount().call({from: User});
    let displayIsFinalized = await currentSTO.methods.isFinalized().call({from: User});
    let displayIsOpen = await currentSTO.methods.isOpen().call({from: User});
    let displayTokenSymbol = await securityToken.methods.symbol().call({from: User});

    let tiersLength = 3;
    let displayTiers = "";
    let displayMintedPerTier = "";
    for (let t = 0; t < tiersLength; t++) {
        let ratePerTier = await currentSTO.methods.ratePerTier(t).call({from: User});
        let tokensPerTier = await currentSTO.methods.tokensPerTier(t).call({from: User});
        let mintedPerTier = await currentSTO.methods.mintedPerTier(t).call({from: User});
        displayTiers = displayTiers + `
    - Tier ${t+1}: 
        Tokens:                 ${web3.utils.fromWei(tokensPerTier, 'ether')} ${displayTokenSymbol}
        Rate:                   ${web3.utils.fromWei(ratePerTier, 'ether')} USD per Token`;
        displayMintedPerTier = displayMintedPerTier + `
    - Tokens Sold in Tier ${t+1}:  ${web3.utils.fromWei(mintedPerTier)}  ${displayTokenSymbol}`
    }

    let displayFundsRaisedUSD = web3.utils.fromWei(await currentSTO.methods.fundsRaisedUSD().call({from: Issuer}));

    let displayFundsRaisedETH = '';
    if (ethRaise) {
      let fundsRaisedETH = web3.utils.fromWei(await currentSTO.methods.fundsRaisedETH().call({from: Issuer}));
      displayFundsRaisedETH = `
        ETH:                  ${fundsRaisedETH} ETH`;
    }
  
    let displayFundsRaisedPOLY = '';
    if (polyRaise) {
      let fundsRaisedPOLY = web3.utils.fromWei(await currentSTO.methods.fundsRaisedPOLY().call({from: Issuer}));
      displayFundsRaisedPOLY = `
        POLY:                 ${fundsRaisedPOLY} POLY`;
    }

    let displayCanBuy;
    await generalTransferManager.methods.whitelist(User).call({from: User}, function(error, result){
        displayCanBuy = result.canBuyFromSTO;
    });

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

    let displayIsUserAccredited = await currentSTO.methods.accredited(User).call({from: User}) ? "YES" : "NO";

    timeRemaining = common.convertToDaysRemaining(timeRemaining);

    console.log(`
    ***********************   STO Information   **********************
    - Address:                ${STOAddress}
    - Can user invest?        ${(displayCanBuy)?'YES':'NO'}
    - Is user accredited?     ${displayIsUserAccredited}
    - Start Time:             ${new Date(displayStartTime * 1000)}
    - End Time:               ${new Date(displayEndTime * 1000)}
    - Raise Type:             ${displayRaiseType}
    - Tiers:                  ${tiersLength}`
    + displayTiers + `
    - Minimum Investment:     ${displayMinimumInvestmentUSD} USD
    - Non Accredited Limit:   ${displayNonAccreditedLimitUSD} USD
    --------------------------------------
    - ${timeTitle}         ${timeRemaining}
    - Current Tier:           ${displayCurrentTier}`
    + displayMintedPerTier + `
    - Investor count:         ${displayInvestorCount}
    - Funds Raised`
    + displayFundsRaisedETH
    + displayFundsRaisedPOLY + `  
        USD:                  ${displayFundsRaisedUSD} USD
    `);

    if (!displayCanBuy) {
        console.log(chalk.red(`Your address is not approved to participate in this token sale.\n`));
    } else if (now < displayStartTime) {
        console.log(chalk.red(`The token sale has not yet started.\n`));
    } else if (now > displayEndTime || displayIsFinalized || !displayIsOpen) {
        console.log(chalk.red(`The token sale has ended.\n`));
    } else {
        await investUsdTieredSTO();
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

    let displayCanBuy;
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
    - Can user invest?   ${(displayCanBuy)?'YES':'NO'}
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
    } else if (now < displayStartTime) {
        console.log(chalk.red(`The token sale has not yet started.\n`));
    } else if (now > displayEndTime) {
        console.log(chalk.red(`The token sale has ended.\n`));
    } else {
        investCappedSTO();
    }
}

async function polyBalance(_user) {
    let balance = await polyToken.methods.balanceOf(_user).call();
    return web3.utils.fromWei(balance);
}

module.exports = {
    executeApp: async function() {
          return executeApp();
      }
}