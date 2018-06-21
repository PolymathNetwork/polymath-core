// Libraries for terminal prompts
var readlineSync = require('readline-sync');
var chalk = require('chalk');

// Generate web3 instance
const Web3 = require('web3');
if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else {
  // set the provider you want from Web3.providers
  web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

// Load Contract artifacts
var contracts = require("./helpers/contract_addresses");
let securityTokenRegistryAddress = contracts.securityTokenRegistryAddress();
let polytokenAddress = contracts.polyTokenAddress();

let securityTokenRegistryABI;
let securityTokenABI;
let cappedSTOABI;
let polytokenABI;
let generalTransferManagerABI;

let securityTokenRegistry;
let securityToken;
let cappedSTO;
let polyToken;
let generalTransferManager;

try {
  securityTokenRegistryABI  = JSON.parse(require('fs').readFileSync('./build/contracts/SecurityTokenRegistry.json').toString()).abi;
  securityTokenABI          = JSON.parse(require('fs').readFileSync('./build/contracts/SecurityToken.json').toString()).abi;
  cappedSTOABI              = JSON.parse(require('fs').readFileSync('./build/contracts/CappedSTO.json').toString()).abi;
  polytokenABI              = JSON.parse(require('fs').readFileSync('./build/contracts/PolyTokenFaucet.json').toString()).abi;
  generalTransferManagerABI = JSON.parse(require('fs').readFileSync('./build/contracts/GeneralTransferManager.json').toString()).abi;
} catch (err) {
  console.log(chalk.red(`Couldn't find contracts' artifacts. Make sure you ran truffle compile first`));
  return;
}

// Init user variables
let Issuer;
let User;

// Init Security token details
let STSymbol;
let STAddress;
let STOAddress;
let GTMAddress;

// Program Flow Control
let deployedSTO = false;
let validSymbol = false;
let exit = false;

// Global display variables
let displayRate;
let displayRaiseType;
let displayTokenSymbol;

// Start Script
(async () => {
    // Init user accounts
    let accounts = await web3.eth.getAccounts();
    Issuer = accounts[0];

    welcome();
})().catch(err => {
    console.error(err);
});

// Welcome Message
async function welcome() {
    console.log(chalk.white(`
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@(@(&&@@@@@@@@@@@@@@@@@@@@@@@@@@(((@&&&&(/@@
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@(#(((((((#%%%#@@@@@@@@@@@@@@@@@@@@%##(((/@@@@@@
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@(%(((((((((((#%%%%%@#@@@@@@@@@@@@(&#####@@@@@@@@%&
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@&#((((((((((((((##%%%%%%%&&&%%##@%#####%(@@@@@@@#%#&
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@(%((((((((((((((((((###%%%%%((#####%%%####@@@@@@@###((@
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@(#(((((((((((((((((((((####%%%#((((######%&%@@(##&###(@@@
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@(#((((((((((((((((((((((((####%%#(((((((#((((((((((((#(@@@@
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@(%(((((((((((((((((((((((((((######%(((((((((((((#&(/@@@@@@@@@
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@&#(((((((((((((((((((((((((((((((###############(##%%#@@@@@@@@@@
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@(#((((##############(((((((((((((((((###################%@@@@@@@@@@
@@@@@@@@@@@@@@@@@@@@@@@@@@@(&#((#(##################((((((((((((((((((##%%##############@@@@@@@@@@@
@@@@@@@@@@@@@@@@@@@@@/%#(((((((##%((((##############((((((((((((((((((##%%#############%%@@@@@@@@@@
@@@@@@@@@@@@@@@@@@@@((((((((((###%%((((((##########(((((((((((((((((((#%%%############%%%#@@@@@@@@@
@@@@@@@@@@@@@@@@@@%((((((((((####%%%((((((((#######(((((((((((####(((((@%%############%%%#@@@@@@@@@
@@@@@@@@@####%%%%%#(((((((((#####%%%%(((((((((((###((((#######(((((((((&@@(&#########%%%%&@@@@@@@@@
@@@@@@@@&(((#####%###(((((((#####%%%%%((((((((####%%%%%%%%&%@%#((((((((@@@@@@(#(####%%%%%%@@@@@@@@@
@@@@@@@&(((@@@@@@@####(((((######%%%%%%##&########%%%%%#@@@@###(((((#(@@@@@@@@@@@###%%#@@@@@@@@@@@@
@@@#%&%(((@@@@@@@@#####(((#######%%%%@@@@@@@@@@@((##@@@@@@@@%###((((/@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@@#%%&%#@@@@@@@@@@############%%%%@@@@@@@@@@@@@@@@@@@@(@&&&&#####(#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@@@@@@@@@@@@@@@@@#%%%%%#((%%%%%%#@@@@@@@@@@@@@@@@@@@@(####%((((%#(@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@@@@@@@@@@@@@@@@@&%%%#((((((%%&@@@@@@@@@@@@@@@@@@@@@@###%%#((@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@@@@@@@@@@@@@@@@%%%%((((((((& @@@@@@@@@@@@@@@@@@@@@@@%%&%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@@@@@@@@@@@@@@@@%%(((((&#@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@@@@@@@@@@@@@@@&((###@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@@@@@@@@@@@@@@@#####@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@@@@@@@@@@@@@@&####@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@@@@@@@@@@@@@&&%##@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@@@@@@@@@@@@@&&&%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@@@@@@@@@@@@@%##%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@@@@@@@@@@#%####%@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    `));

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

    await showUserInfo();

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
        return;
    } else {
        validSymbol = true;
        securityToken = new web3.eth.Contract(securityTokenABI, STAddress);
        let res = await securityToken.methods.getModule(3,0).call({from: User});
        STOAddress = res[1];
        if (STOAddress != "0x0000000000000000000000000000000000000000") {
            deployedSTO = true;
            cappedSTO = new web3.eth.Contract(cappedSTOABI, STOAddress);
            await securityToken.methods.getModule(2,0).call({from: User}, function(error, result){
              GTMAddress = result[1];
            });
            generalTransferManager = new web3.eth.Contract(generalTransferManagerABI,GTMAddress);
        }
        await showTokenInfo()
        return;
    }
}

// Display user information
async function showUserInfo() {
    // User details
    console.log(`
        *******************    User Information    ********************
        - Address:           ${User}
        - POLY balance:      ${await polyBalance(User)}
        - ETH balance:       ${web3.utils.fromWei(await web3.eth.getBalance(User))}
    `);
}

// Display token and STO information
async function showTokenInfo() {

    if (validSymbol) {
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
    if (deployedSTO) {
        // STO details
        let displayStartTime = await cappedSTO.methods.startTime().call({from: User});
        let displayEndTime = await cappedSTO.methods.endTime().call({from: User});
        displayRate = await cappedSTO.methods.rate().call({from: User});
        let displayCap = await cappedSTO.methods.cap().call({from: User});
        let displayFundsRaised = await cappedSTO.methods.fundsRaised().call({from: User});
        let displayTokensSold = await cappedSTO.methods.tokensSold().call({from: User});
        let displayInvestorCount = await cappedSTO.methods.investorCount().call({from: User});
        let displayTokensRemaining = web3.utils.fromWei(displayCap) - web3.utils.fromWei(displayTokensSold);

        await cappedSTO.methods.fundraiseType().call({from: User}, function(error, result){
            displayRaiseType = (result == 0) ? 'ETH' : 'POLY';
        });

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

        timeRemaining = convertToDaysRemaining(timeRemaining);

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
            invest();
        }
    } else {
        console.log(chalk.red(`There is no STO module attached to the ${displayTokenSymbol.toUpperCase()} Token. No further actions can be taken.`));
        validSymbol = false;
        return;
    }
}

// Allow investor to buy tokens.
async function invest() {
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
                    await polyToken.methods.approve(STOAddress, costWei).send({from: User, gas:200000, gasPrice: 80000000000 })
                    .on('receipt', function(receipt) {
                    })
                    .on('error', console.error);
                }
                await cappedSTO.methods.buyTokensWithPoly(costWei).send({from: User, gas:200000, gasPrice: 80000000000 })
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
        await cappedSTO.methods.buyTokens(User).send({ from: User, value:web3.utils.toWei(cost.toString()), gas:2500000, gasPrice:80000000000})
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

// Helpers
async function polyBalance(_user) {
    let balance = await polyToken.methods.balanceOf(_user).call();
    return web3.utils.fromWei(balance);
}

function convertToDaysRemaining(timeRemaining){
    var seconds = parseInt(timeRemaining, 10);
    var days = Math.floor(seconds / (3600*24));
    seconds  -= days*3600*24;
    var hrs   = Math.floor(seconds / 3600);
    seconds  -= hrs*3600;
    var mnts = Math.floor(seconds / 60);
    seconds  -= mnts*60;
    return (days+" days, "+hrs+" Hrs, "+mnts+" Minutes, "+seconds+" Seconds");
}
