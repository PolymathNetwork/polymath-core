var readlineSync = require('readline-sync');
var BigNumber = require('bignumber.js')
var contracts = require("./helpers/contract_addresses");
var chalk = require('chalk');
const shell = require('shelljs');

let tickerRegistryAddress = contracts.tickerRegistryAddress();
let securityTokenRegistryAddress = contracts.securityTokenRegistryAddress();
let cappedSTOFactoryAddress = contracts.cappedSTOFactoryAddress();
let polytokenAddress = contracts.polyTokenAddress();

let tickerRegistryABI;
let securityTokenRegistryABI;
let securityTokenABI;
let cappedSTOABI;
let generalTransferManagerABI;
let polytokenABI;
let cappedSTOFactoryABI;

try{
  tickerRegistryABI         = JSON.parse(require('fs').readFileSync('./build/contracts/TickerRegistry.json').toString()).abi;
  securityTokenRegistryABI  = JSON.parse(require('fs').readFileSync('./build/contracts/SecurityTokenRegistry.json').toString()).abi;
  securityTokenABI          = JSON.parse(require('fs').readFileSync('./build/contracts/SecurityToken.json').toString()).abi;
  cappedSTOABI              = JSON.parse(require('fs').readFileSync('./build/contracts/CappedSTO.json').toString()).abi;
  generalTransferManagerABI = JSON.parse(require('fs').readFileSync('./build/contracts/GeneralTransferManager.json').toString()).abi;
  polytokenABI              = JSON.parse(require('fs').readFileSync('./build/contracts/PolyTokenFaucet.json').toString()).abi;
  cappedSTOFactoryABI       = JSON.parse(require('fs').readFileSync('./build/contracts/CappedSTOFactory.json').toString()).abi;
}catch(err){
  console.log('\x1b[31m%s\x1b[0m',"Couldn't find contracts' artifacts. Make sure you ran truffle compile first");
  return;
}



const Web3 = require('web3');

if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else {
  // set the provider you want from Web3.providers
  web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

///////////////////
//Crowdsale params

let startTime;
let endTime;
let wallet;
let rate;
let cap;
let issuerTokens;
let minContribution;
let maxContribution;

let tokenName;
let tokenSymbol;
let tokenDecimals = 18;
let divisibility = true;

const regFee = 250;
const stoFee = 20000;
const tokenDetails = "";

////////////////////////

let tickerRegistry;
let securityTokenRegistry;
let polyToken;
let securityToken;
let cappedSTO;
let cappedSTOFactory;


// App flow
let index_mainmenu;

let accounts;
let Issuer;

let _DEBUG = false;

let DEFAULT_GAS_PRICE = 80000000000;

async function executeApp() {

  accounts = await web3.eth.getAccounts();
  Issuer = accounts[0];

  console.log(`
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
`)

  console.log("********************************************")
  console.log("Welcome to the Command-Line ST-20 Generator.");
  console.log("********************************************")

  setup();

};

async function setup(){
  try {
    tickerRegistry = new web3.eth.Contract(tickerRegistryABI,tickerRegistryAddress);
    tickerRegistry.setProvider(web3.currentProvider);
    securityTokenRegistry = new web3.eth.Contract(securityTokenRegistryABI,securityTokenRegistryAddress);
    securityTokenRegistry.setProvider(web3.currentProvider);
    polyToken = new web3.eth.Contract(polytokenABI, polytokenAddress);
    polyToken.setProvider(web3.currentProvider);
    cappedSTOFactory = new web3.eth.Contract(cappedSTOFactoryABI, cappedSTOFactoryAddress);
    cappedSTOFactory.setProvider(web3.currentProvider);
  }catch(err){
    console.log(err)
    console.log('\x1b[31m%s\x1b[0m',"There was a problem getting the contracts. Make sure they are deployed to the selected network.");
    return;
  }

  createST20();

}

async function createST20() {

  console.log("The following script will create a new ST-20 according to the parameters you enter.");

  if(_DEBUG){
    console.log('\x1b[31m%s\x1b[0m',"Warning: Debugging is activated. Start and End dates will be adjusted for easier testing.");
  }

  let start = readlineSync.question('Press enter to continue or exit (CTRL + C): ', {
    defaultInput: 'Y'
  });

  if(start != "Y") return;

  step_ticker_reg();
  //step_STO_Launch();
};

async function step_ticker_reg(){
  let receipt;

  console.log("\n");
  console.log('\x1b[34m%s\x1b[0m',"Token Creation - Symbol Registration");

  let alreadyRegistered = false;
  let available = false;

  while(!available) {
    console.log(chalk.green(`\nRegistering the new token symbol requires 250 POLY & deducted from '${Issuer}', Current balance is ${(await currentBalance())} POLY\n`));
    tokenSymbol =  readlineSync.question('Enter the symbol for your new token: ');
    await tickerRegistry.methods.getDetails(tokenSymbol).call({from: Issuer}, function(error, result){
        if(new BigNumber(result[1]).toNumber() == 0){
          available = true;
        }else if(result[0] == Issuer){
          console.log('\x1b[32m%s\x1b[0m',"Token Symbol has already been registered by you, skipping registration");
          available = true;
          alreadyRegistered = true;
        }else{
          console.log('\x1b[31m%s\x1b[0m',"Token Symbol has already been registered, please choose another symbol");
        }
    });
  }

  if(!alreadyRegistered){
    try {
      await step_approval(tickerRegistryAddress, regFee);
      await tickerRegistry.methods.registerTicker(Issuer,tokenSymbol,"",web3.utils.asciiToHex("")).send({ from: Issuer, gas:200000, gasPrice: DEFAULT_GAS_PRICE})
      .on('transactionHash', function(hash){
        console.log(`
          Congrats! Your Ticker Registeration tx populated successfully
          Your transaction is being processed. Please wait...
          TxHash: ${hash}\n`
        );
      })
      .on('receipt', function(receipt){
        console.log(`
          Congratulations! The transaction was successfully completed.
          Review it on Etherscan.
          TxHash: ${receipt.transactionHash}\n`
        );
      })
      .on('error', console.error);
    } catch (err){
      console.log(err.message);
      return;
    }
  }
  await step_token_deploy();
}

async function step_approval(spender, fee) {
  let approved = false;
    try {
      polyBalance = await polyToken.methods.balanceOf(Issuer).call({from: Issuer});
      let requiredAmount = web3.utils.toWei(fee.toString(), "ether");
      if (parseInt(polyBalance) >= parseInt(requiredAmount)) {
        let allowance = await polyToken.methods.allowance(spender, Issuer).call({from: Issuer});
        if (allowance == web3.utils.toWei(fee.toString(), "ether")) {
          approved = true;
          return approved;
        } else {
          await polyToken.methods.approve(spender, web3.utils.toWei(fee.toString(), "ether")).send({from: Issuer, gas:200000, gasPrice: DEFAULT_GAS_PRICE })
          .on('receipt', function(receipt) {
            approved = true;
            return approved;
          })
          .on('error', console.error);
        }
      } else {
          let requiredBalance = parseInt(requiredAmount) - parseInt(polyBalance);
          console.log(chalk.red(`\n*****************************************************************************************************************************************`));
          console.log(chalk.red(`Not enough balance to Pay the Fee, Require ${(new BigNumber(requiredBalance).dividedBy(new BigNumber(10).pow(18))).toNumber()} POLY but have ${(new BigNumber(polyBalance).dividedBy(new BigNumber(10).pow(18))).toNumber()} POLY. Access POLY faucet to get the POLY to complete this txn`));
          console.log(chalk.red(`******************************************************************************************************************************************\n`));
          process.exit(0);
      }
  }catch (err){
    console.log(err.message);
    return;
  }
}

async function step_token_deploy(){

  let tokenDeployed = false;
  let tokenDeployedAddress;
  // Let's check if token has already been deployed, if it has, skip to STO
  await securityTokenRegistry.methods.getSecurityTokenAddress(tokenSymbol).call({from: Issuer}, function(error, result){
    if(result != "0x0000000000000000000000000000000000000000"){
      console.log('\x1b[32m%s\x1b[0m',"Token has already been deployed at address "+result+". Skipping registration");
      tokenDeployedAddress = result;
      tokenDeployed = true;
    }

  });

  if(tokenDeployed){
    securityToken = new web3.eth.Contract(securityTokenABI,tokenDeployedAddress);
  }else{
    let receipt;
    console.log("\n");
    console.log(chalk.green(`Current balance in POLY is ${(await currentBalance())}`));
    console.log("\n");
    console.log('\x1b[34m%s\x1b[0m',"Token Creation - Token Deployment");
    tokenName =  readlineSync.question('Enter the name for your new token: ');
    console.log("\n");
    console.log('\x1b[34m%s\x1b[0m',"Select the Token divisibility type");
    divisibile =  readlineSync.question('Press "N" for Non-divisible type token or hit Enter for divisible type token (Default):',{
      defaultInput:'Y'
    });

    if(divisibile == 'N' || divisibile == 'n') {
      divisibility = false;
    }

    try{
      await step_approval(securityTokenRegistryAddress, regFee);
      await securityTokenRegistry.methods.generateSecurityToken(tokenName, tokenSymbol, web3.utils.fromAscii(tokenDetails), divisibility).send({ from: Issuer, gas:7700000, gasPrice: DEFAULT_GAS_PRICE})
      .on('transactionHash', function(hash){
        console.log(`
          Your transaction is being processed. Please wait...
          TxHash: ${hash}\n`
        );
      })
      .on('receipt', function(receipt){
        console.log(`
          Congratulations! The transaction was successfully completed.
          Deployed Token at address: ${receipt.events.LogNewSecurityToken.returnValues._securityTokenAddress}
          Review it on Etherscan.
          TxHash: ${receipt.transactionHash}\n`
        );
        securityToken = new web3.eth.Contract(securityTokenABI, receipt.events.LogNewSecurityToken.returnValues._securityTokenAddress);
      })
      .on('error', console.error);

    }catch (err){
      console.log(err.message);
      return;
    }
  }

  await step_Wallet_Issuance();
}

async function step_Wallet_Issuance(){

  let initialMint;
  await securityToken.getPastEvents('Transfer', {
    filter: {from: "0x0000000000000000000000000000000000000000"}, // Using an array means OR: e.g. 20 or 23
    fromBlock: 0,
    toBlock: 'latest'
  }, function(error, events){
    initialMint = events;
  });

  if(initialMint.length > 0){
    console.log('\x1b[32m%s\x1b[0m',web3.utils.fromWei(initialMint[0].returnValues.value,"ether") +" Tokens have already been minted for "+initialMint[0].returnValues.to+". Skipping initial minting");
  }else{
    console.log("\n");
    console.log('\x1b[34m%s\x1b[0m',"Token Creation - Token Minting for Issuer");

    console.log("Before setting up the STO, you can mint any amount of tokens that will remain under your control or you can trasfer to affiliates");
    let isaffiliate =  readlineSync.question('Press'+ chalk.green(` "Y" `) + 'if you have list of affiliates addresses with you otherwise hit' + chalk.green(' Enter ') + 'and get the minted tokens to a particular address: ');

    if (isaffiliate == "Y" || isaffiliate == "y")
        await multi_mint_tokens();
    else {
    let mintWallet =  readlineSync.question('Add the address that will hold the issued tokens to the whitelist ('+Issuer+'): ');
    if(mintWallet == "") mintWallet = Issuer;
    let canBuyFromSTO = readlineSync.question(`Address '(${mintWallet})' allowed to buy tokens from the STO (true): `);
    if(canBuyFromSTO == "") canBuyFromSTO = true;

    try{

      // Add address to whitelist

      let generalTransferManagerAddress;
      await securityToken.methods.getModule(2,0).call({from: Issuer}, function(error, result){
        generalTransferManagerAddress = result[1];
      });

      let generalTransferManager = new web3.eth.Contract(generalTransferManagerABI,generalTransferManagerAddress);
      await generalTransferManager.methods.modifyWhitelist(mintWallet,Math.floor(Date.now()/1000),Math.floor(Date.now()/1000),Math.floor(Date.now()/1000 + 31536000), canBuyFromSTO).send({ from: Issuer, gas:2500000, gasPrice:DEFAULT_GAS_PRICE})
      .on('transactionHash', function(hash){
        console.log(`
          Adding wallet to whitelist. Please wait...
          TxHash: ${hash}\n`
        );
      })
      .on('receipt', function(receipt){
        console.log(`
          Congratulations! The transaction was successfully completed.
          Review it on Etherscan.
          TxHash: ${receipt.transactionHash}\n`
        );
      })
      .on('error', console.error);

      // Mint tokens

      issuerTokens =  readlineSync.question('How many tokens do you plan to mint for the wallet you entered? (500.000): ');
      if(issuerTokens == "") issuerTokens = '500000';

      await securityToken.methods.mint(mintWallet, web3.utils.toWei(issuerTokens,"ether")).send({ from: Issuer, gas:3000000, gasPrice:DEFAULT_GAS_PRICE})
      .on('transactionHash', function(hash){
        console.log(`
          Minting tokens. Please wait...
          TxHash: ${hash}\n`
        );
      })
      .on('receipt', function(receipt){
        console.log(`
          Congratulations! The transaction was successfully completed.
          Review it on Etherscan.
          TxHash: ${receipt.transactionHash}\n`
        );
      })
      .on('error', console.error);

    }catch (err){
      console.log(err.message);
      return;
    }
   }
  }

  await step_STO_Launch();
}


async function multi_mint_tokens() {

  //await whitelist.startWhitelisting(tokenSymbol);
  shell.exec(`${__dirname}/minting.sh Whitelist ${tokenSymbol} 75`);

  console.log(chalk.green(`\nCongrats! All the affiliates get succssfully whitelisted, Now its time to Mint the tokens\n`));
  console.log(chalk.red(`WARNING: `) + `Please make sure all the addresses that get whitelisted are only eligible to hold or get Security token\n`);

  shell.exec(`${__dirname}/minting.sh Multimint ${tokenSymbol} 75`);

  console.log(chalk.green(`\nHurray!! Tokens get successfully Minted and transfered to token holders`));

}


async function step_STO_Launch(){
  let receipt;

  let stoCreated = false;
  await securityToken.methods.getModule(3,0).call({from: Issuer}, function(error, result){
    if(result[1] != "0x0000000000000000000000000000000000000000"){

      console.log('\x1b[32m%s\x1b[0m',"STO has already been created at address "+result[1]+". Skipping STO creation");
      stoCreated = true;
      cappedSTO = new web3.eth.Contract(cappedSTOABI,result[1]);
    }
  });

  if(stoCreated){
    let displayStartTime;
    let displayEndTime;
    let displayRate;
    let displayCap;
    let displayWallet;
    let displayIssuerTokens;
    let displayFundsRaised;
    let displayTokensSold;
    let displayInvestorCount;
    let displayTokenSymbol;

    await cappedSTO.methods.startTime().call({from: Issuer}, function(error, result){
      displayStartTime = result;
    });
    await cappedSTO.methods.endTime().call({from: Issuer}, function(error, result){
      displayEndTime = result;
    });
    await cappedSTO.methods.rate().call({from: Issuer}, function(error, result){
      displayRate = result;
    });
    await cappedSTO.methods.cap().call({from: Issuer}, function(error, result){
      displayCap = result;
    });
    await cappedSTO.methods.wallet().call({from: Issuer}, function(error, result){
      displayWallet = result;
    });
    await cappedSTO.methods.fundsRaised().call({from: Issuer}, function(error, result){
      displayFundsRaised = result;
    });
    await cappedSTO.methods.tokensSold().call({from: Issuer}, function(error, result){
      displayTokensSold = result;
    });
    await cappedSTO.methods.investorCount().call({from: Issuer}, function(error, result){
      displayInvestorCount = result;
    });

    await securityToken.methods.symbol().call({from: Issuer}, function(error, result){
      displayTokenSymbol = result;
    });

    let displayWalletBalance = web3.utils.fromWei(await web3.eth.getBalance(displayWallet),"ether");

    let formattedCap = BigNumber(web3.utils.fromWei(displayCap,"ether"));
    let formattedSold = BigNumber(web3.utils.fromWei(displayTokensSold,"ether"));

    let now = Math.floor(Date.now()/1000);
    let timeTitle;

    if(now < displayStartTime){
      timeTitle = "STO starts in: ";
      timeRemaining = displayStartTime - now;
    }else{
      timeTitle = "Time remaining:";
      timeRemaining = displayEndTime - now;
    }

    timeRemaining = convertToDaysRemaining(timeRemaining);

    console.log(`
      ***** STO Information *****
      - Raise Cap:         ${web3.utils.fromWei(displayCap,"ether")} ${displayTokenSymbol.toUpperCase()}
      - Start Time:        ${new Date(displayStartTime * 1000)}
      - End Time:          ${new Date(displayEndTime * 1000)}
      - Rate:              1 ETH = ${displayRate} ${displayTokenSymbol.toUpperCase()}
      - Wallet:            ${displayWallet}
      - Wallet Balance:    ${displayWalletBalance} ETH
      --------------------------------------
      - ${timeTitle}    ${timeRemaining}
      - Funds raised:      ${web3.utils.fromWei(displayFundsRaised,"ether")} ETH
      - Tokens sold:       ${web3.utils.fromWei(displayTokensSold,"ether")} ${displayTokenSymbol.toUpperCase()}
      - Tokens remaining:  ${formattedCap.minus(formattedSold).toNumber()} ${displayTokenSymbol.toUpperCase()}
      - Investor count:    ${displayInvestorCount}
    `);

  }else{
    console.log("\n");
    console.log('\x1b[34m%s\x1b[0m',"Token Creation - STO Configuration (Capped STO in No. of Tokens)");

    cap =  readlineSync.question('How many tokens do you plan to sell on the STO? (500.000): ');
    startTime =  readlineSync.question('Enter the start time for the STO (Unix Epoch time)\n(5 minutes from now = '+(Math.floor(Date.now()/1000)+300)+' ): ');
    endTime =  readlineSync.question('Enter the end time for the STO (Unix Epoch time)\n(1 month from now = '+(Math.floor(Date.now()/1000)+ (30 * 24 * 60 * 60))+' ): ');
    rate =  readlineSync.question('Enter the rate (1 ETH = X ST) for the STO (1000): ');
    wallet =  readlineSync.question('Enter the address that will receive the funds from the STO ('+Issuer+'): ');

    if(startTime == "") startTime = BigNumber((Math.floor(Date.now()/1000)+300));
    if(endTime == "") endTime = BigNumber((Math.floor(Date.now()/1000)+ (30 * 24 * 60 * 60)));
    if(cap == "") cap = '500000';
    if(rate == "") rate = BigNumber(1000);
    if(wallet == "") wallet = Issuer;

    let bytesSTO = web3.eth.abi.encodeFunctionCall({
        name: 'configure',
        type: 'function',
        inputs: [{
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
    }, [startTime, endTime, web3.utils.toWei(cap, 'ether'), rate,0,wallet]);

    try{
      let contractBalance = await polyToken.methods.balanceOf(securityToken._address).call({from: Issuer});
      let requiredAmount = web3.utils.toWei(stoFee.toString(), "ether");
      if (parseInt(contractBalance) < parseInt(requiredAmount)) {
        let transferAmount = parseInt(requiredAmount) - parseInt(contractBalance);
        let ownerBalance = await polyToken.methods.balanceOf(Issuer).call({from: Issuer});
        if(parseInt(ownerBalance) < transferAmount) {
          console.log(chalk.red(`\n**************************************************************************************************************************************************`));
          console.log(chalk.red(`Not enough balance to pay the CappedSTO fee, Requires ${(new BigNumber(transferAmount).dividedBy(new BigNumber(10).pow(18))).toNumber()} POLY but have ${(new BigNumber(ownerBalance).dividedBy(new BigNumber(10).pow(18))).toNumber()} POLY. Access POLY faucet to get the POLY to complete this txn`));
          console.log(chalk.red(`**************************************************************************************************************************************************\n`));
          return;
        }
        await polyToken.methods.transfer(securityToken._address, new BigNumber(transferAmount)).send({from: Issuer, gas: 200000, gasPrice: DEFAULT_GAS_PRICE})
        .on('transactionHash', function(hash) {
          console.log(`
            Transfer ${(new BigNumber(transferAmount).dividedBy(new BigNumber(10).pow(18))).toNumber()} POLY to ${tokenSymbol} security token
            Your transaction is being processed. Please wait...
            TxHash: ${hash}\n`
          );
        })
        .on('receipt', function(receipt){
          console.log(`
            Congratulations! The transaction was successfully completed.
            Number of POLY sent: ${(new BigNumber(receipt.events.Transfer.returnValues._value).dividedBy(new BigNumber(10).pow(18))).toNumber()}
            Review it on Etherscan.
            TxHash: ${receipt.transactionHash}\n`
          );
        })
        .on('error', console.error);
      }

      await securityToken.methods.addModule(cappedSTOFactoryAddress, bytesSTO, new BigNumber(stoFee).times(new BigNumber(10).pow(18)), 0, true).send({from: Issuer, gas: 7900000, gasPrice:DEFAULT_GAS_PRICE})
      .on('transactionHash', function(hash){
        console.log(`
          Your transaction is being processed. Please wait...
          TxHash: ${hash}\n`
        );
      })
      .on('receipt', function(receipt){
        console.log(`
          Congratulations! The transaction was successfully completed.
          STO deployed at address: ${receipt.events.LogModuleAdded.returnValues._module}
          Review it on Etherscan.
          TxHash: ${receipt.transactionHash}\n`
        );
      })
      .on('error', console.error);
      //console.log("aaa",receipt.logs[1].args._securityTokenAddress);

    }catch (err){
      console.log(err.message);
      return;
    }
  }
  console.log(`Remaining POLY balance is ${(await currentBalance())}`);
  console.log("FINISHED");
}

executeApp();

///////
// HELPER FUNCTIONS
//////

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

async function currentBalance() {
    let balance = await polyToken.methods.balanceOf(Issuer).call();
    let balanceInPoly = new BigNumber(balance).dividedBy(new BigNumber(10).pow(18));
    return balanceInPoly;
}
