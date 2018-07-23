var readlineSync = require('readline-sync');
var BigNumber = require('bignumber.js');
var chalk = require('chalk');
const shell = require('shelljs');
const Web3 = require('web3');
var contracts = require("./helpers/contract_addresses");
var common = require('./common/common_functions');

let tickerRegistryAddress = contracts.tickerRegistryAddress();
let securityTokenRegistryAddress = contracts.securityTokenRegistryAddress();
let cappedSTOFactoryAddress = contracts.cappedSTOFactoryAddress();
let usdTieredSTOFactoryAddress = contracts.usdTieredSTOFactoryAddress();
let polytokenAddress = contracts.polyTokenAddress();

let tickerRegistryABI;
let securityTokenRegistryABI;
let securityTokenABI;
let cappedSTOABI;
let usdTieredSTOABI;
let generalTransferManagerABI;
let polytokenABI;
let cappedSTOFactoryABI;
let usdTieredSTOFactoryABI;

try{
  tickerRegistryABI         = JSON.parse(require('fs').readFileSync('./build/contracts/TickerRegistry.json').toString()).abi;
  securityTokenRegistryABI  = JSON.parse(require('fs').readFileSync('./build/contracts/SecurityTokenRegistry.json').toString()).abi;
  securityTokenABI          = JSON.parse(require('fs').readFileSync('./build/contracts/SecurityToken.json').toString()).abi;
  cappedSTOABI              = JSON.parse(require('fs').readFileSync('./build/contracts/CappedSTO.json').toString()).abi;
  usdTieredSTOABI           = JSON.parse(require('fs').readFileSync('./build/contracts/USDTieredSTO.json').toString()).abi;
  generalTransferManagerABI = JSON.parse(require('fs').readFileSync('./build/contracts/GeneralTransferManager.json').toString()).abi;
  polytokenABI              = JSON.parse(require('fs').readFileSync('./build/contracts/PolyTokenFaucet.json').toString()).abi;
  cappedSTOFactoryABI       = JSON.parse(require('fs').readFileSync('./build/contracts/CappedSTOFactory.json').toString()).abi;
  usdTieredSTOFactoryABI    = JSON.parse(require('fs').readFileSync('./build/contracts/USDTieredSTOFactory.json').toString()).abi;
} catch (err) {
  console.log('\x1b[31m%s\x1b[0m',"Couldn't find contracts' artifacts. Make sure you ran truffle compile first");
  return;
}

if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else {
  // set the provider you want from Web3.providers
  web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

///////////////////
// Crowdsale params
let startTime;
let endTime;
let wallet;
let rate;
let raiseType;
let cap;
let issuerTokens;

let tokenName;
let tokenSymbol;
let divisibility = true;
let selectedSTO;

const regFee = 250;
const cappedSTOFee = 20000;
const usdTieredSTOFee = 100000;
const tokenDetails = "";
////////////////////////
// Artifacts
let tickerRegistry;
let securityTokenRegistry;
let polyToken;
let securityToken;
let currentSTO;
let cappedSTOFactory;
let usdTieredSTOFactory;
// App flow
let accounts;
let Issuer;
let _DEBUG = false;
let DEFAULT_GAS_PRICE = 80000000000;

async function executeApp() {
  accounts = await web3.eth.getAccounts();
  Issuer = accounts[0];

  setup();

  common.logAsciiBull();
  console.log("********************************************");
  console.log("Welcome to the Command-Line ST-20 Generator.");
  console.log("********************************************");
  console.log("The following script will create a new ST-20 according to the parameters you enter.");
  if(_DEBUG){
    console.log('\x1b[31m%s\x1b[0m',"Warning: Debugging is activated. Start and End dates will be adjusted for easier testing.");
  }
  let start = readlineSync.question('Press enter to continue or exit (CTRL + C): ', {
    defaultInput: 'Y'
  });
  if(start != 'Y' && start != 'y') return;

  try {
    await step_ticker_reg();
    await step_token_deploy();
    await step_Wallet_Issuance();
    await step_STO_launch();
    await step_STO_Status();
    await step_STO_configure();
  } catch (err) {
    console.log(err);
    return;
  }
};

function setup(){
  try {
    tickerRegistry = new web3.eth.Contract(tickerRegistryABI,tickerRegistryAddress);
    tickerRegistry.setProvider(web3.currentProvider);
    securityTokenRegistry = new web3.eth.Contract(securityTokenRegistryABI,securityTokenRegistryAddress);
    securityTokenRegistry.setProvider(web3.currentProvider);
    polyToken = new web3.eth.Contract(polytokenABI, polytokenAddress);
    polyToken.setProvider(web3.currentProvider);
    cappedSTOFactory = new web3.eth.Contract(cappedSTOFactoryABI, cappedSTOFactoryAddress);
    cappedSTOFactory.setProvider(web3.currentProvider);
    usdTieredSTOFactory = new web3.eth.Contract(usdTieredSTOFactoryABI, usdTieredSTOFactoryAddress);
    usdTieredSTOFactory.setProvider(web3.currentProvider);
  }catch(err){
    console.log(err)
    console.log('\x1b[31m%s\x1b[0m',"There was a problem getting the contracts. Make sure they are deployed to the selected network.");
    return;
  }
}

async function step_ticker_reg(){
  console.log("\n");
  console.log('\x1b[34m%s\x1b[0m',"Token Creation - Symbol Registration");

  let alreadyRegistered = false;
  let available = false;

  while (!available) {
    console.log(chalk.green(`\nRegistering the new token symbol requires 250 POLY & deducted from '${Issuer}', Current balance is ${(await currentBalance(Issuer))} POLY\n`));
    tokenSymbol =  readlineSync.question('Enter the symbol for your new token: ');
    await tickerRegistry.methods.getDetails(tokenSymbol).call({from: Issuer}, function(error, result){
      if (new BigNumber(result[1]).toNumber() == 0) {
        available = true;
      } else if (result[0] == Issuer) {
        console.log('\x1b[32m%s\x1b[0m',"Token Symbol has already been registered by you, skipping registration");
        available = true;
        alreadyRegistered = true;
      } else {
        console.log('\x1b[31m%s\x1b[0m',"Token Symbol has already been registered, please choose another symbol");
      }
    });
  }

  if (!alreadyRegistered) {
    await step_approval(tickerRegistryAddress, regFee);
    let registerTickerAction = tickerRegistry.methods.registerTicker(Issuer,tokenSymbol,"",web3.utils.asciiToHex(""));
    let GAS = await common.estimateGas(registerTickerAction, Issuer, 1.2);
    await registerTickerAction.send({ from: Issuer, gas: GAS, gasPrice: DEFAULT_GAS_PRICE})
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
  }
}

async function step_approval(spender, fee) {
  polyBalance = await polyToken.methods.balanceOf(Issuer).call({from: Issuer});
  let requiredAmount = web3.utils.toWei(fee.toString(), "ether");
  if (parseInt(polyBalance) >= parseInt(requiredAmount)) {
    let allowance = await polyToken.methods.allowance(spender, Issuer).call({from: Issuer});
    if (allowance == web3.utils.toWei(fee.toString(), "ether")) {
      return true;
    } else {
      let approveAction = polyToken.methods.approve(spender, web3.utils.toWei(fee.toString(), "ether"));
      let GAS = await common.estimateGas(approveAction, Issuer, 1.2);
      await approveAction.send({from: Issuer, gas: GAS, gasPrice: DEFAULT_GAS_PRICE })
      .on('receipt', function(receipt) {
        return true;
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
}

async function step_token_deploy(){
  // Let's check if token has already been deployed, if it has, skip to STO
  let tokenAddress = await securityTokenRegistry.methods.getSecurityTokenAddress(tokenSymbol).call({from: Issuer});
  if (tokenAddress != "0x0000000000000000000000000000000000000000") {
    console.log('\x1b[32m%s\x1b[0m',"Token has already been deployed at address " + tokenAddress + ". Skipping registration");
    securityToken = new web3.eth.Contract(securityTokenABI, tokenAddress);
  } else {
    console.log("\n");
    console.log(chalk.green(`Current balance in POLY is ${(await currentBalance(Issuer))}`));
    console.log("\n");
    console.log('\x1b[34m%s\x1b[0m',"Token Creation - Token Deployment");
    tokenName =  readlineSync.question('Enter the name for your new token: ');
    if (tokenName == "") tokenName = 'default';
    console.log("\n");
    console.log('\x1b[34m%s\x1b[0m',"Select the Token divisibility type");
    divisibile =  readlineSync.question('Press "N" for Non-divisible type token or hit Enter for divisible type token (Default):',{
      defaultInput:'Y'
    });

    if(divisibile == 'N' || divisibile == 'n') {
      divisibility = false;
    }

    await step_approval(securityTokenRegistryAddress, regFee);
    let generateSecurityTokenAction = securityTokenRegistry.methods.generateSecurityToken(tokenName, tokenSymbol, web3.utils.fromAscii(tokenDetails), divisibility);
    let GAS = await common.estimateGas(generateSecurityTokenAction, Issuer, 1.2);
    await generateSecurityTokenAction.send({ from: Issuer, gas: GAS, gasPrice: DEFAULT_GAS_PRICE})
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
  }
}

async function step_Wallet_Issuance(){
  let result = await securityToken.methods.getModule(3,0).call({from: Issuer});
  let STOAddress = result[1];
  if (STOAddress != "0x0000000000000000000000000000000000000000") {
    console.log('\x1b[32m%s\x1b[0m',"STO has already been created at address " + STOAddress + ". Skipping initial minting");
  } else {
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
    } else {
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

        // Add address to whitelist
        let generalTransferManagerAddress;
        await securityToken.methods.getModule(2,0).call({from: Issuer}, function(error, result){
          generalTransferManagerAddress = result[1];
        });

        let generalTransferManager = new web3.eth.Contract(generalTransferManagerABI,generalTransferManagerAddress);
        let modifyWhitelistAction = generalTransferManager.methods.modifyWhitelist(mintWallet,Math.floor(Date.now()/1000),Math.floor(Date.now()/1000),Math.floor(Date.now()/1000 + 31536000), canBuyFromSTO);
        let GAS = await common.estimateGas(modifyWhitelistAction, Issuer, 1.2);
        await modifyWhitelistAction.send({ from: Issuer, gas: GAS, gasPrice:DEFAULT_GAS_PRICE})
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
        let mintAction = securityToken.methods.mint(mintWallet, web3.utils.toWei(issuerTokens,"ether"));
        GAS = await common.estimateGas(mintAction, Issuer, 1.2);
        await mintAction.send({ from: Issuer, gas: GAS, gasPrice:DEFAULT_GAS_PRICE})
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
      }
    }
  }
}

async function multi_mint_tokens() {
  //await whitelist.startWhitelisting(tokenSymbol);
  shell.exec(`${__dirname}/scripts/script.sh Whitelist ${tokenSymbol} 75`);
  console.log(chalk.green(`\nCongrats! All the affiliates get succssfully whitelisted, Now its time to Mint the tokens\n`));
  console.log(chalk.red(`WARNING: `) + `Please make sure all the addresses that get whitelisted are only eligible to hold or get Security token\n`);

  shell.exec(`${__dirname}/scripts//script.sh Multimint ${tokenSymbol} 75`);
  console.log(chalk.green(`\nHurray!! Tokens get successfully Minted and transfered to token holders`));
}

async function step_STO_launch() {
  console.log("\n");
  console.log('\x1b[34m%s\x1b[0m',"Token Creation - STO Configuration");

  let result = await securityToken.methods.getModule(3,0).call({from: Issuer});
  let STO_Address = result[1];
  if(STO_Address != "0x0000000000000000000000000000000000000000") {
    selectedSTO = web3.utils.toAscii(result[0]).replace(/\u0000/g, '');
    console.log('\x1b[32m%s\x1b[0m',selectedSTO + " has already been created at address " + STO_Address + ". Skipping STO creation");
    switch (selectedSTO) {
      case 'CappedSTO':
        currentSTO = new web3.eth.Contract(cappedSTOABI,STO_Address);
        break;
      case 'USDTieredSTO':
        currentSTO = new web3.eth.Contract(usdTieredSTOABI,STO_Address);
        break;
    }
  } else {
    let options = ['Capped STO', 'USD Tiered STO', 'Select STO later'];
    let index = readlineSync.keyInSelect(options, 'What type of STO do you want?', { cancel: false });
    switch (index) {
      case 0:
        selectedSTO = 'CappedSTO';
        await cappedSTO_launch();
        break;
      case 1:
        selectedSTO = 'USDTieredSTO';
        await usdTieredSTO_launch();
        break;
      case 2:
        process.exit(0);
        break;
    }
  }
}

async function step_STO_Status() {
  switch (selectedSTO) {
    case 'CappedSTO':
      await cappedSTO_status();
      break;
    case 'USDTieredSTO':
      await usdTieredSTO_status();
      break;
  }
}

async function step_STO_configure() {
  switch (selectedSTO) {
    case 'CappedSTO':
      break;
    case 'USDTieredSTO':
      await usdTieredSTO_configure();
      break;
  }
}

////////////////
// Capped STO //
////////////////
async function cappedSTO_launch() {
  console.log("\n");
  console.log('\x1b[34m%s\x1b[0m',"Token Creation - Capped STO in No. of Tokens");

  cap =  readlineSync.question('How many tokens do you plan to sell on the STO? (500.000): ');
  startTime =  readlineSync.question('Enter the start time for the STO (Unix Epoch time)\n(1 minutes from now = '+(Math.floor(Date.now()/1000)+60)+' ): ');
  endTime =  readlineSync.question('Enter the end time for the STO (Unix Epoch time)\n(1 month from now = '+(Math.floor(Date.now()/1000)+ (30 * 24 * 60 * 60))+' ): ');
  wallet =  readlineSync.question('Enter the address that will receive the funds from the STO (' + Issuer + '): ');
  raiseType = readlineSync.question('Enter' + chalk.green(` P `) + 'for POLY raise or leave empty for Ether raise (E):');

  if(cap == "") cap = '500000';
  if(startTime == "") startTime = BigNumber((Math.floor(Date.now()/1000)+60));
  if(endTime == "") endTime = BigNumber((Math.floor(Date.now()/1000)+ (30 * 24 * 60 * 60)));
  if(wallet == "") wallet = Issuer;
  (raiseType == "") ? raiseType = 0 : raiseType = 1;  // 0 = ETH raise, 1 = Poly raise

  if (raiseType) {
    rate = readlineSync.question('Enter the rate (1 POLY = X ST) for the STO (1000): ');
  } else {
    rate = readlineSync.question('Enter the rate (1 ETH = X ST) for the STO (1000): ');
  }
  if (rate == "") rate = BigNumber(1000);

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
  }, [startTime, endTime, web3.utils.toWei(cap, 'ether'), rate, raiseType, wallet]);

  let stoFee = cappedSTOFee;
  let contractBalance = await polyToken.methods.balanceOf(securityToken._address).call({from: Issuer});
  let requiredAmount = web3.utils.toWei(stoFee.toString(), "ether");
  if (parseInt(contractBalance) < parseInt(requiredAmount)) {
    let transferAmount = parseInt(requiredAmount) - parseInt(contractBalance);
    let ownerBalance = await polyToken.methods.balanceOf(Issuer).call({from: Issuer});
    if(parseInt(ownerBalance) < transferAmount) {
      console.log(chalk.red(`\n**************************************************************************************************************************************************`));
      console.log(chalk.red(`Not enough balance to pay the CappedSTO fee, Requires ${(new BigNumber(transferAmount).dividedBy(new BigNumber(10).pow(18))).toNumber()} POLY but have ${(new BigNumber(ownerBalance).dividedBy(new BigNumber(10).pow(18))).toNumber()} POLY. Access POLY faucet to get the POLY to complete this txn`));
      console.log(chalk.red(`**************************************************************************************************************************************************\n`));
      process.exit(0);
    } else {
      let transferAction = polyToken.methods.transfer(securityToken._address, new BigNumber(transferAmount));
      let GAS = await common.estimateGas(transferAction, Issuer, 1.5);
      await transferAction.send({from: Issuer, gas: GAS, gasPrice: DEFAULT_GAS_PRICE})
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
          TxHash: ${receipt.transactionHash}
          gasUsed: ${receipt.gasUsed}\n`
        );
      })
      .on('error', console.error);
    }
  }
  let addModuleAction = securityToken.methods.addModule(cappedSTOFactoryAddress, bytesSTO, new BigNumber(stoFee).times(new BigNumber(10).pow(18)), 0);
  let GAS = await common.estimateGas(addModuleAction, Issuer, 1.2);
  await securityToken.methods.addModule(cappedSTOFactoryAddress, bytesSTO, new BigNumber(stoFee).times(new BigNumber(10).pow(18)), 0).send({from: Issuer, gas: GAS, gasPrice:DEFAULT_GAS_PRICE})
  .on('transactionHash', function(hash){
    console.log(`
      Your transaction is being processed. Please wait...
      TxHash: ${hash}\n`
    );
  })
  .on('receipt', function(receipt){
      STO_Address = receipt.events.LogModuleAdded.returnValues._module
    console.log(`
      Congratulations! The transaction was successfully completed.
      STO deployed at address: ${STO_Address}
      Review it on Etherscan.
      TxHash: ${receipt.transactionHash}\n`
    );
  })
  .on('error', console.error);
  //console.log("aaa",receipt.logs[1].args._securityTokenAddress);
  currentSTO = new web3.eth.Contract(cappedSTOABI,STO_Address);
}

async function cappedSTO_status() {
  let displayStartTime = await currentSTO.methods.startTime().call({from: Issuer});
  let displayEndTime = await currentSTO.methods.endTime().call({from: Issuer});
  let displayRate = await currentSTO.methods.rate().call({from: Issuer});
  let displayCap = await currentSTO.methods.cap().call({from: Issuer});
  let displayWallet = await currentSTO.methods.wallet().call({from: Issuer});
  let displayRaiseType = await currentSTO.methods.fundRaiseType(0).call({from: Issuer}) ? 'ETH' : 'POLY';
  let displayFundsRaised = await currentSTO.methods.fundsRaised().call({from: Issuer});
  let displayTokensSold = await currentSTO.methods.tokensSold().call({from: Issuer});
  let displayInvestorCount = await currentSTO.methods.investorCount().call({from: Issuer});
  let displayTokenSymbol = await securityToken.methods.symbol().call({from: Issuer});

  let displayWalletBalance = web3.utils.fromWei(await web3.eth.getBalance(displayWallet),"ether");
  let formattedCap = BigNumber(web3.utils.fromWei(displayCap,"ether"));
  let formattedSold = BigNumber(web3.utils.fromWei(displayTokensSold,"ether"));

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
    ***** STO Information *****
    - Raise Cap:         ${web3.utils.fromWei(displayCap,"ether")} ${displayTokenSymbol.toUpperCase()}
    - Start Time:        ${new Date(displayStartTime * 1000)}
    - End Time:          ${new Date(displayEndTime * 1000)}
    - Raise Type:        ${displayRaiseType}
    - Rate:              1 ${displayRaiseType} = ${displayRate} ${displayTokenSymbol.toUpperCase()}
    - Wallet:            ${displayWallet}
    - Wallet Balance:    ${displayWalletBalance} ${displayRaiseType}
    --------------------------------------
    - ${timeTitle}    ${timeRemaining}
    - Funds raised:      ${web3.utils.fromWei(displayFundsRaised,"ether")} ${displayRaiseType}
    - Tokens sold:       ${web3.utils.fromWei(displayTokensSold,"ether")} ${displayTokenSymbol.toUpperCase()}
    - Tokens remaining:  ${formattedCap.minus(formattedSold).toNumber()} ${displayTokenSymbol.toUpperCase()}
    - Investor count:    ${displayInvestorCount}
  `);

  console.log(chalk.green(`\n${(await currentBalance(Issuer))} POLY balance remaining at issuer address ${Issuer}`));
}

////////////////////
// USD Tiered STO //
////////////////////
function fundingConfigUSDTieredSTO(selectedFunding) {
  let funding = {};

  if (!selectedFunding) {
    selectedFunding = readlineSync.question('Enter' + chalk.green(` P `) + 'for POLY raise,' + chalk.green(` E `) + 'for Ether raise or' + chalk.green(` B `) + 'for both (B): ').toUpperCase();
  }

  if (selectedFunding == 'E') {
    funding.raiseType = [0];
  }
  else if (selectedFunding == 'P') {
    funding.raiseType = [1];
  }
  else {
    funding.raiseType = [0, 1];
  }

  return funding;
}

function addressesConfigUSDTieredSTO() {
  let addresses = {};

  addresses.wallet =  readlineSync.question('Enter the address that will receive the funds from the STO (' + Issuer + '): ', {
    limit: function(input) {
      return web3.utils.isAddress(input);
    },
    limitMessage: "Must be a valid address",
    defaultInput: Issuer
  });
  addresses.reserveWallet =  readlineSync.question('Enter the address that will receive remaining tokens in the case the cap is not met (' + Issuer + '): ', {
    limit: function(input) {
      return web3.utils.isAddress(input);
    },
    limitMessage: "Must be a valid address",
    defaultInput: Issuer
  });

  addresses.securityTokenRegistryAddress = securityTokenRegistryAddress;

  return addresses;
}

function tiersConfigUSDTieredSTO(polyRaise) {
  let tiers = {};

  let defaultTiers = 3;
  tiers.tiers =  readlineSync.questionInt(`Enter the number of tiers for the STO? (${defaultTiers}): `, {
    limit: function(input) {
      return input > 0;
    },
    limitMessage: 'Must be greater than zero',
    defaultInput: defaultTiers
  });

  let defaultTokensPerTier = [190000000, 100000000, 200000000];
  let defaultRatePerTier = ['0.05', '0.10', '0.15'];
  let defaultTokensPerTierDiscountPoly = [90000000, 50000000, 100000000];
  let defaultRatePerTierDiscountPoly = ['0.025', '0.05', '0.075'];
  tiers.tokensPerTier = [];
  tiers.ratePerTier = [];
  tiers.tokensPerTierDiscountPoly = [];
  tiers.ratePerTierDiscountPoly = [];
  for (let i = 0; i < tiers.tiers; i++) {
    tiers.tokensPerTier[i] = web3.utils.toWei(readlineSync.question(`How many tokens do you plan to sell on tier No. ${i+1}? (${defaultTokensPerTier[i]}): `, {
      limit: function(input) {
        return parseFloat(input) > 0;
      },
      limitMessage: 'Must be greater than zero',
      defaultInput: defaultTokensPerTier[i]
    }));
    tiers.ratePerTier[i] = web3.utils.toWei(readlineSync.question(`What is the USD per token rate for tier No. ${i+1}? (${defaultRatePerTier[i]}): `, {
      limit: function(input) {
        return parseFloat(input) > 0;
      },
      limitMessage: 'Must be greater than zero',
      defaultInput: defaultRatePerTier[i]
    }));

    //If funds can be raised in POLY
    if (polyRaise && readlineSync.keyInYNStrict(`Do you plan to have a discounted rate for POLY investments for tier No. ${i+1}? `)) {
      tiers.tokensPerTierDiscountPoly[i] = web3.utils.toWei(readlineSync.question(`How many of those tokens do you plan to sell at discounted rate on tier No. ${i+1}? (${defaultTokensPerTierDiscountPoly[i]}): `, {
        limit: function(input) {
          return new BigNumber(web3.utils.toWei(input)).lte(tiers.tokensPerTier[i])
        },
        limitMessage: 'Must be less than the No. of tokens of the tier',
        defaultInput: defaultTokensPerTierDiscountPoly[i]
      }));
      tiers.ratePerTierDiscountPoly[i] = web3.utils.toWei(readlineSync.question(`What is the discounted rate for tier No. ${i+1}? (${defaultRatePerTierDiscountPoly[i]}): `, {
        limit: function(input) {
          return new BigNumber(web3.utils.toWei(input)).lte(tiers.ratePerTier[i])
        },
        limitMessage: 'Must be less than the rate of the tier',
        defaultInput: defaultRatePerTierDiscountPoly[i]
      }));
    } else {
      tiers.tokensPerTierDiscountPoly[i] = 0;
      tiers.ratePerTierDiscountPoly[i] = 0;
    }
  }

  return tiers;
}

function timesConfigUSDTieredSTO() {
  let times = {};

  let oneMinuteFromNow = Math.floor(Date.now() / 1000) + 60;
  times.startTime =  readlineSync.questionInt('Enter the start time for the STO (Unix Epoch time)\n(1 minutes from now = ' + oneMinuteFromNow + ' ): ', {
    limit: function(input) {
      return input > Math.floor(Date.now() / 1000);
    },
    limitMessage: "Must be a future time",
    defaultInput: oneMinuteFromNow
  });
  let oneMonthFromNow = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
  times.endTime =  readlineSync.questionInt('Enter the end time for the STO (Unix Epoch time)\n(1 month from now = ' + oneMonthFromNow + ' ): ', {
    limit: function(input) {
      return input > times.startTime;
    },
    limitMessage: "Must be greater than Start Time",
    defaultInput: oneMonthFromNow
  });

  return times;
}

function limitsConfigUSDTieredSTO() {
  let limits = {};

  let defaultMinimumInvestment = 5;
  limits.minimumInvestmentUSD = web3.utils.toWei(readlineSync.question(`What is the minimum investment in USD? (${defaultMinimumInvestment}): `, {
    limit: function(input) {
      return parseInt(input) > 0;
    },
    limitMessage: "Must be greater than zero",
    defaultInput: defaultMinimumInvestment
  }));
  let nonAccreditedLimit = 10000;
  limits.nonAccreditedLimitUSD = web3.utils.toWei(readlineSync.question(`What is the limit for non accredited insvestors in USD? (${nonAccreditedLimit}): `, {
    limit: function(input) {
      return new BigNumber(web3.utils.toWei(input)).gte(limits.minimumInvestmentUSD);
    },
    limitMessage: "Must be greater than minimum investment",
    defaultInput: nonAccreditedLimit
  }));

  return limits;
}

async function usdTieredSTO_launch() {
  console.log("\n");
  console.log('\x1b[34m%s\x1b[0m',"Token Creation - USD Tiered STO");

  let funding = fundingConfigUSDTieredSTO();
  let addresses = addressesConfigUSDTieredSTO();
  let tiers = tiersConfigUSDTieredSTO(funding.raiseType.includes(1));
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
        type: 'address',
        name: '_securityTokenRegistry'
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
      }
    ]
  }, [times.startTime,
    times.endTime,
    tiers.ratePerTier,
    tiers.ratePerTierDiscountPoly,
    tiers.tokensPerTier,
    tiers.tokensPerTierDiscountPoly,
    addresses.securityTokenRegistryAddress,
    limits.nonAccreditedLimitUSD,
    limits.minimumInvestmentUSD,
    funding.raiseType,
    addresses.wallet,
    addresses.reserveWallet
  ]);

  let stoFee = usdTieredSTOFee;
  let contractBalance = await polyToken.methods.balanceOf(securityToken._address).call({from: Issuer});
  let requiredAmount = web3.utils.toWei(stoFee.toString(), "ether");
  if (parseInt(contractBalance) < parseInt(requiredAmount)) {
    let transferAmount = parseInt(requiredAmount) - parseInt(contractBalance);
    let ownerBalance = await polyToken.methods.balanceOf(Issuer).call({from: Issuer});
    if(parseInt(ownerBalance) < transferAmount) {
      console.log(chalk.red(`\n**************************************************************************************************************************************************`));
      console.log(chalk.red(`Not enough balance to pay the ${selectedSTO} fee, Requires ${(new BigNumber(transferAmount).dividedBy(new BigNumber(10).pow(18))).toNumber()} POLY but have ${(new BigNumber(ownerBalance).dividedBy(new BigNumber(10).pow(18))).toNumber()} POLY. Access POLY faucet to get the POLY to complete this txn`));
      console.log(chalk.red(`**************************************************************************************************************************************************\n`));
      process.exit(0);
    } else {
      let transferAction = polyToken.methods.transfer(securityToken._address, new BigNumber(transferAmount));
      let GAS = await common.estimateGas(transferAction, Issuer, 1.5);
      await transferAction.send({from: Issuer, gas: GAS, gasPrice: DEFAULT_GAS_PRICE})
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
          TxHash: ${receipt.transactionHash}
          gasUsed: ${receipt.gasUsed}\n`
        );
      })
    }
  }
  let addModuleAction = securityToken.methods.addModule(usdTieredSTOFactoryAddress, bytesSTO, new BigNumber(stoFee).times(new BigNumber(10).pow(18)), 0);
  let GAS = await common.estimateGas(addModuleAction, Issuer, 1.2);
  await securityToken.methods.addModule(usdTieredSTOFactoryAddress, bytesSTO, new BigNumber(stoFee).times(new BigNumber(10).pow(18)), 0).send({from: Issuer, gas: GAS, gasPrice:DEFAULT_GAS_PRICE})
  .on('transactionHash', function(hash){
    console.log(`
      Your transaction is being processed. Please wait...
      TxHash: ${hash}\n`
    );
  })
  .on('receipt', function(receipt){
      STO_Address = receipt.events.LogModuleAdded.returnValues._module
    console.log(`
      Congratulations! The transaction was successfully completed.
      STO deployed at address: ${STO_Address}
      Review it on Etherscan.
      TxHash: ${receipt.transactionHash}\n`
    );
  })
  //console.log("aaa",receipt.logs[1].args._securityTokenAddress);
  currentSTO = new web3.eth.Contract(usdTieredSTOABI,STO_Address);
}

async function usdTieredSTO_status() {
  let displayStartTime = await currentSTO.methods.startTime().call({from: Issuer});
  let displayEndTime = await currentSTO.methods.endTime().call({from: Issuer});
  let displayCurrentTier = parseInt(await currentSTO.methods.currentTier().call({from: Issuer})) + 1;
  let displayNonAccreditedLimitUSD = web3.utils.fromWei(await currentSTO.methods.nonAccreditedLimitUSD().call({from: Issuer}));
  let displayMinimumInvestmentUSD = web3.utils.fromWei(await currentSTO.methods.minimumInvestmentUSD().call({from: Issuer}));
  let ethRaise = await currentSTO.methods.fundRaiseType(0).call({from: Issuer});
  let polyRaise = await currentSTO.methods.fundRaiseType(1).call({from: Issuer});
  let displayWallet = await currentSTO.methods.wallet().call({from: Issuer});
  let displayReserveWallet = await currentSTO.methods.reserveWallet().call({from: Issuer});
  let displayTokensSold = web3.utils.fromWei(await currentSTO.methods.getTokensSold().call({from: Issuer}));
  let displayInvestorCount = await currentSTO.methods.investorCount().call({from: Issuer});
  let displayIsFinalized = await currentSTO.methods.isFinalized().call({from: Issuer}) ? "YES" : "NO";
  let displayTokenSymbol = await securityToken.methods.symbol().call({from: Issuer});

  let tiersLength = await currentSTO.methods.getNumberOfTiers().call({from: Issuer});;

  let displayTiers = "";
  let displayMintedPerTier = "";
  for (let t = 0; t < tiersLength; t++) {
    let ratePerTier = await currentSTO.methods.ratePerTier(t).call({from: Issuer});
    let tokensPerTierTotal = await currentSTO.methods.tokensPerTierTotal(t).call({from: Issuer});
    let mintedPerTierTotal = await currentSTO.methods.mintedPerTierTotal(t).call({from: Issuer});
    
    let displayMintedPerTierETH = "";
    if (ethRaise) {
      let mintedPerTierETH = await currentSTO.methods.mintedPerTierETH(t).call({from: Issuer});

      displayMintedPerTierETH = `
        Sold for ETH:              ${web3.utils.fromWei(mintedPerTierETH)}`
    }
      
    let displayMintedPerTierPOLY = "";
    let displayDiscountTokens = "";
    if (polyRaise) {
      let displayDiscountMinted = "";
      let mintedPerTierDiscountPoly = "0";
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
        Sold for POLY:             ${mintedPerTierPOLYTotal} ${displayDiscountMinted}`
    }

    displayTiers = displayTiers + `
    - Tier ${t+1}:
        Tokens:                    ${web3.utils.fromWei(tokensPerTierTotal, 'ether')} ${displayTokenSymbol}
        Rate:                      ${web3.utils.fromWei(ratePerTier, 'ether')} USD per Token`
        + displayDiscountTokens;
    displayMintedPerTier = displayMintedPerTier + `
    - Tokens Sold in Tier ${t+1}:       ${web3.utils.fromWei(mintedPerTierTotal)}` 
    + displayMintedPerTierETH
    + displayMintedPerTierPOLY;
  }

  let displayFundsRaisedUSD = web3.utils.fromWei(await currentSTO.methods.fundsRaisedUSD().call({from: Issuer}));

  let displayWalletBalanceETH = '';
  let displayReserveWalletBalanceETH = '';
  let displayFundsRaisedETH = '';
  let displayTokensSoldETH = '';
  if (ethRaise) {
    let balance = await web3.eth.getBalance(displayWallet);
    let walletBalanceETH = web3.utils.fromWei(balance, "ether");
    let walletBalanceETH_USD = web3.utils.fromWei(await currentSTO.methods.convertToUSD(web3.utils.fromAscii('ETH'), balance).call({from: Issuer}));
    displayWalletBalanceETH = `
        Balance ETH:               ${walletBalanceETH} ETH (${walletBalanceETH_USD} USD)`;
    balance = await web3.eth.getBalance(displayReserveWallet);
    let reserveWalletBalanceETH = web3.utils.fromWei(balance,"ether");
    let reserveWalletBalanceETH_USD = web3.utils.fromWei(await currentSTO.methods.convertToUSD(web3.utils.fromAscii('ETH'), balance).call({from: Issuer}));
    displayReserveWalletBalanceETH = `
        Balance ETH:               ${reserveWalletBalanceETH} ETH (${reserveWalletBalanceETH_USD} USD)`;
    let fundsRaisedETH = web3.utils.fromWei(await currentSTO.methods.fundsRaisedETH().call({from: Issuer}));
    displayFundsRaisedETH = `
        ETH:                       ${fundsRaisedETH} ETH`;
   
    //Only show sold for ETH if POLY raise is allowed too
    if (polyRaise) {
      let tokensSoldETH = web3.utils.fromWei(await currentSTO.methods.getTokensSoldForETH().call({from: Issuer}));
      displayTokensSoldETH = `
        For ETH:                   ${tokensSoldETH} ${displayTokenSymbol}`;
    }
  }

  let displayWalletBalancePOLY = '';
  let displayReserveWalletBalancePOLY = '';
  let displayFundsRaisedPOLY = '';
  let displayTokensSoldPOLY = '';
  if (polyRaise) {
    let walletBalancePOLY = await currentBalance(displayWallet);
    let walletBalancePOLY_USD = web3.utils.fromWei(await currentSTO.methods.convertToUSD(web3.utils.fromAscii('POLY'), web3.utils.toWei(walletBalancePOLY.toString())).call({from: Issuer}));
    displayWalletBalancePOLY = `
        Balance POLY               ${walletBalancePOLY} POLY (${walletBalancePOLY_USD} USD)`;
    let reserveWalletBalancePOLY = await currentBalance(displayReserveWallet);
    let reserveWalletBalancePOLY_USD = web3.utils.fromWei(await currentSTO.methods.convertToUSD(web3.utils.fromAscii('POLY'), web3.utils.toWei(reserveWalletBalancePOLY.toString())).call({from: Issuer}));
    displayReserveWalletBalancePOLY = `
        Balance POLY               ${reserveWalletBalancePOLY} POLY (${reserveWalletBalancePOLY_USD} USD)`;
    let fundsRaisedPOLY = web3.utils.fromWei(await currentSTO.methods.fundsRaisedPOLY().call({from: Issuer}));
    displayFundsRaisedPOLY = `
        POLY:                      ${fundsRaisedPOLY} POLY`;
    
    //Only show sold for POLY if ETH raise is allowed too
    if (ethRaise) {
      let tokensSoldPOLY = web3.utils.fromWei(await currentSTO.methods.getTokensSoldForPOLY().call({from: Issuer}));
      displayTokensSoldPOLY = `
        For POLY:                  ${tokensSoldPOLY} ${displayTokenSymbol}`;
    }
  }

  let displayRaiseType;
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

  console.log(`
    ****************** STO Information ******************
    - Start Time:                  ${new Date(displayStartTime * 1000)}
    - End Time:                    ${new Date(displayEndTime * 1000)}
    - Raise Type:                  ${displayRaiseType}
    - Tiers:                       ${tiersLength}`
    + displayTiers + `
    - Minimum Investment:          ${displayMinimumInvestmentUSD} USD
    - Non Accredited Limit:        ${displayNonAccreditedLimitUSD} USD
    - Wallet:                      ${displayWallet}`
    + displayWalletBalanceETH
    + displayWalletBalancePOLY + `
    - Reserve Wallet:              ${displayReserveWallet}`
    + displayReserveWalletBalanceETH
    + displayReserveWalletBalancePOLY + `

    --------------------------------------
    - ${timeTitle}              ${timeRemaining}
    - Is Finalized:                ${displayIsFinalized}
    - Tokens Sold:                 ${displayTokensSold}`
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

  console.log(chalk.green(`\n${(await currentBalance(Issuer))} POLY balance remaining at issuer address ${Issuer}`));
}

async function usdTieredSTO_configure() {
  console.log("\n");
  console.log('\x1b[34m%s\x1b[0m',"STO Configuration - USD Tiered STO");

  let isFinalized = await currentSTO.methods.isFinalized().call({from: Issuer});
  if (isFinalized) {
    console.log(chalk.red(`STO is finalized`));
  } else {
    let options = [];
    options.push('Finalize STO', 'Change accredited account', 'Change accredited in batch');

    // If STO is not started, you can modify configuration
    let now = Math.floor(Date.now() / 1000);
    let startTime = await currentSTO.methods.startTime().call.call({from: Issuer});
    if (now < startTime) {
      options.push('Modify times configuration', 'Modify tiers configuration', 'Modify addresses configuration',
        'Modify limits configuration', 'Modify funding configuration');
    }

    let index = readlineSync.keyInSelect(options, 'What do you want to do?');
    switch (index) {
      case 0:
        if (readlineSync.keyInYNStrict()) {
          let finalizeAction = currentSTO.methods.finalize();
          let GAS = await common.estimateGas(finalizeAction, Issuer, 1.2);
          await finalizeAction.send({from: Issuer, gas: GAS, gasPrice: DEFAULT_GAS_PRICE})
          .on('transactionHash', function(hash) {
            console.log(`
              Finalizing STO
              Your transaction is being processed. Please wait...
              TxHash: ${hash}\n`
            );
          })
          .on('receipt', function(receipt) {
            console.log(`
              Congratulations! The transaction was successfully completed.
              Review it on Etherscan.

              TxHash: ${receipt.transactionHash}
              gasUsed: ${receipt.gasUsed}\n`
            );
          })
        }
        break;
      case 1:
        let investor = readlineSync.question('Enter the address to change accreditation: ');
        let isAccredited = readlineSync.keyInYNStrict(`Is ${investor} accredited?`);
        let investors = [investor];
        let accredited = [isAccredited];
        let changeAccreditedAction = currentSTO.methods.changeAccredited(investors, accredited);
        let GAS2 = await common.estimateGas(changeAccreditedAction, Issuer, 2);
        await changeAccreditedAction.send({from: Issuer, gas: GAS2, gasPrice: DEFAULT_GAS_PRICE})
        .on('transactionHash', function(hash) {
          console.log(`
            Changing accreditation
            Your transaction is being processed. Please wait...
            TxHash: ${hash}\n`
          );
        })
        .on('receipt', function(receipt) {
          console.log(`
            Congratulations! The transaction was successfully completed.
            Review it on Etherscan.

            TxHash: ${receipt.transactionHash}
            gasUsed: ${receipt.gasUsed}\n`
          );
        })
        break;
      case 2:
        shell.exec(`${__dirname}/scripts/script.sh Accredit ${tokenSymbol} 75`);
        break;
      case 3:
        await modfifyTimes();
        await usdTieredSTO_status();
        break;
      case 4:
        await modfifyTiers();
        await usdTieredSTO_status();
        break;
      case 5:
        await modfifyAddresses();
        await usdTieredSTO_status();
        break;
      case 6:
        await modfifyLimits();
        await usdTieredSTO_status();
        break;
      case 7:
        await modfifyFunding();
        await usdTieredSTO_status();
        break;
    }
  }
}

async function modfifyTimes() {
  let times = timesConfigUSDTieredSTO();
  let modifyTimesAction = currentSTO.methods.modifyTimes(times.startTime, times.endTime);
  let GAS = await common.estimateGas(modifyTimesAction, Issuer, 1.2);
  await modifyTimesAction.send({from: Issuer, gas: GAS, gasPrice: DEFAULT_GAS_PRICE})
  .on('transactionHash', function(hash) {
    console.log(`
      Modifying start and end times
      Your transaction is being processed. Please wait...
      TxHash: ${hash}\n`
    );
  })
  .on('receipt', function(receipt) {
    console.log(`
      Congratulations! The transaction was successfully completed.
      Review it on Etherscan.

      TxHash: ${receipt.transactionHash}
      gasUsed: ${receipt.gasUsed}\n`
    );
  })
}

async function modfifyLimits() {
  let limits = limitsConfigUSDTieredSTO();
  let modifyLimitsAction = currentSTO.methods.modifyLimits(limits.nonAccreditedLimitUSD, limits.minimumInvestmentUSD);
  let GAS = await common.estimateGas(modifyLimitsAction, Issuer, 1.2);
  await modifyLimitsAction.send({from: Issuer, gas: GAS, gasPrice: DEFAULT_GAS_PRICE})
  .on('transactionHash', function(hash) {
    console.log(`
      Modifying limits
      Your transaction is being processed. Please wait...
      TxHash: ${hash}\n`
    );
  })
  .on('receipt', function(receipt) {
    console.log(`
      Congratulations! The transaction was successfully completed.
      Review it on Etherscan.

      TxHash: ${receipt.transactionHash}
      gasUsed: ${receipt.gasUsed}\n`
    );
  })
}

async function modfifyFunding() {
  let funding = fundingConfigUSDTieredSTO();
  let modifyFundingAction = currentSTO.methods.modifyFunding(funding.raiseType);
  let GAS = await common.estimateGas(modifyFundingAction, Issuer, 1.2);
  await modifyFundingAction.send({from: Issuer, gas: GAS, gasPrice: DEFAULT_GAS_PRICE})
  .on('transactionHash', function(hash) {
    console.log(`
      Modifying funding raise types
      Your transaction is being processed. Please wait...
      TxHash: ${hash}\n`
    );
  })
  .on('receipt', function(receipt) {
    console.log(`
      Congratulations! The transaction was successfully completed.
      Review it on Etherscan.

      TxHash: ${receipt.transactionHash}
      gasUsed: ${receipt.gasUsed}\n`
    );
  })
}

async function modfifyAddresses() {
  let addresses = addressesConfigUSDTieredSTO();
  let modifyAddressesAction = currentSTO.methods.modifyAddresses(addresses.securityTokenRegistryAddress, addresses.wallet, addresses.reserveWallet);
  let GAS = await common.estimateGas(modifyAddressesAction, Issuer, 1.2);
  await modifyAddressesAction.send({from: Issuer, gas: GAS, gasPrice: DEFAULT_GAS_PRICE})
  .on('transactionHash', function(hash) {
    console.log(`
      Modifying addresses
      Your transaction is being processed. Please wait...
      TxHash: ${hash}\n`
    );
  })
  .on('receipt', function(receipt) {
    console.log(`
      Congratulations! The transaction was successfully completed.
      Review it on Etherscan.

      TxHash: ${receipt.transactionHash}
      gasUsed: ${receipt.gasUsed}\n`
    );
  })
}

async function modfifyTiers() {
  let tiers = tiersConfigUSDTieredSTO(await currentSTO.methods.fundRaiseType(1).call({from: Issuer}));
  let modifyTiersAction = currentSTO.methods.modifyTiers(
    tiers.ratePerTier,
    tiers.ratePerTierDiscountPoly,
    tiers.tokensPerTier,
    tiers.tokensPerTierDiscountPoly,
  );
  let GAS = await common.estimateGas(modifyTiersAction, Issuer, 1.2);
  await modifyTiersAction.send({from: Issuer, gas: GAS, gasPrice: DEFAULT_GAS_PRICE})
  .on('transactionHash', function(hash) {
    console.log(`
      Modifying tiers
      Your transaction is being processed. Please wait...
      TxHash: ${hash}\n`
    );
  })
  .on('receipt', function(receipt) {
    console.log(`
      Congratulations! The transaction was successfully completed.
      Review it on Etherscan.

      TxHash: ${receipt.transactionHash}
      gasUsed: ${receipt.gasUsed}\n`
    );
  })
}

//////////////////////
// HELPER FUNCTIONS //
//////////////////////
async function currentBalance(from) {
    let balance = await polyToken.methods.balanceOf(from).call();
    let balanceInPoly = new BigNumber(balance).dividedBy(new BigNumber(10).pow(18));
    return balanceInPoly;
}

module.exports = {
  executeApp: async function() {
        return executeApp();
    }
}
