var readlineSync = require('readline-sync');
var fs = require('fs');
var csv = require('fast-csv');
var whitelist = require('./whitelist.js');
var BigNumber = require('bignumber.js')
var contracts = require("./helpers/contract_addresses");
var chalk = require('chalk');
let tickerRegistryAddress = contracts.tickerRegistryAddress();
let securityTokenRegistryAddress = contracts.securityTokenRegistryAddress();
let cappedSTOFactoryAddress = contracts.cappedSTOFactoryAddress();

let tickerRegistryABI;
let securityTokenRegistryABI;
let securityTokenABI;
let cappedSTOABI;
let generalTransferManagerABI;
try{
  tickerRegistryABI         = JSON.parse(require('fs').readFileSync('./build/contracts/TickerRegistry.json').toString()).abi;
  securityTokenRegistryABI  = JSON.parse(require('fs').readFileSync('./build/contracts/SecurityTokenRegistry.json').toString()).abi;
  securityTokenABI          = JSON.parse(require('fs').readFileSync('./build/contracts/SecurityToken.json').toString()).abi;
  cappedSTOABI              = JSON.parse(require('fs').readFileSync('./build/contracts/CappedSTO.json').toString()).abi;
  generalTransferManagerABI = JSON.parse(require('fs').readFileSync('./build/contracts/GeneralTransferManager.json').toString()).abi;
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

const tokenDetails = "";

////////////////////////

let tickerRegistry;
let securityTokenRegistry;
let securityToken;
let cappedSTO;

//distribData is an array of batches. i.e. if there are 200 entries, with batch sizes of 75, we get [[75],[75],[50]]
let distribData = new Array();
//allocData is a temporary array that stores up to the batch size,
//then gets push into distribData, then gets set to 0 to start another batch
let allocData = new Array();
//full file data is a single array that contains all arrays. i.e. if there are 200 entries we get [[200]]
let fullFileData = new Array();
let badData = new Array();

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
    try{
      await tickerRegistry.methods.registerTicker(Issuer,tokenSymbol,"",web3.utils.asciiToHex("")).send({ from: Issuer, gas:200000, gasPrice: DEFAULT_GAS_PRICE})
      .on('transactionHash', function(hash){
        console.log(`
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


    }catch (err){
      console.log(err.message);
      return;
    }
  }

  await step_token_deploy();
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

        securityToken = new web3.eth.Contract(securityTokenABI,receipt.events.LogNewSecurityToken.returnValues._securityTokenAddress);
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
    let isaffiliate =  readlineSync.question('Press `Y` if you have list of affiliates addresses with you otherwise hit Enter: ');
    if (isaffiliate == "Y" || isaffiliate == "y") 
        await multi_mint_tokens();
  //   let mintWallet =  readlineSync.question('Add the address that will hold the issued tokens to the whitelist ('+Issuer+'): ');
  //   if(mintWallet == "") mintWallet = Issuer;

  //   try{

  //     // Add address to whitelist

  //     let generalTransferManagerAddress;
  //     await securityToken.methods.getModule(2,0).call({from: Issuer}, function(error, result){
  //       generalTransferManagerAddress = result[1];
  //     });

  //     let generalTransferManager = new web3.eth.Contract(generalTransferManagerABI,generalTransferManagerAddress);
  //     await generalTransferManager.methods.modifyWhitelist(mintWallet,Math.floor(Date.now()/1000),Math.floor(Date.now()/1000),Math.floor(Date.now()/1000 + 31536000)).send({ from: Issuer, gas:2500000, gasPrice:DEFAULT_GAS_PRICE})
  //     .on('transactionHash', function(hash){
  //       console.log(`
  //         Adding wallet to whitelist. Please wait...
  //         TxHash: ${hash}\n`
  //       );
  //     })
  //     .on('receipt', function(receipt){
  //       console.log(`
  //         Congratulations! The transaction was successfully completed.
  //         Review it on Etherscan.
  //         TxHash: ${receipt.transactionHash}\n`
  //       );
  //     })
  //     .on('error', console.error);

  //     // Mint tokens

  //     issuerTokens =  readlineSync.question('How many tokens do you plan to mint for the wallet you entered? (500.000): ');
  //     if(issuerTokens == "") issuerTokens = '500000';
      
  //     await securityToken.methods.mint(mintWallet, web3.utils.toWei(issuerTokens,"ether")).send({ from: Issuer, gas:3000000, gasPrice:DEFAULT_GAS_PRICE})
  //     .on('transactionHash', function(hash){
  //       console.log(`
  //         Minting tokens. Please wait...
  //         TxHash: ${hash}\n`
  //       );
  //     })
  //     .on('receipt', function(receipt){
  //       console.log(`
  //         Congratulations! The transaction was successfully completed.
  //         Review it on Etherscan.
  //         TxHash: ${receipt.transactionHash}\n`
  //       );
  //     })
  //     .on('error', console.error);

  //   }catch (err){
  //     console.log(err.message);
  //     return;
  //   }
   }

  // await step_STO_Launch();
}


async function multi_mint_tokens() {

  await whitelist.startWhitelisting(tokenSymbol);

  console.log(chalk.green(`Congrats! All the affiliates get succssfully whitelisted, Now its time to Mint the tokens\n`));
  console.log(chalk.red(`Please make sure all the addresses that get whitelisted are only eligible to hold or get Security token\n`));

  readFile();
  console.log(chalk.green(`Hurray!! Tokens get successfully Minted and transfered to affiliates`));


}

function readFile() {
  var stream = fs.createReadStream("./demo/multi_mint_data.csv");

  let index = 0;
  let batch = 0;
  console.log(`
    --------------------------------------------
    ----------- Parsing the csv file -----------
    --------------------------------------------
  `);

  var csvStream = csv()
    .on("data", function (data) {
      let isAddress = web3.utils.isAddress(data[0]);
      let validToken = isvalidToken(data[1]);


      if (isAddress && validToken) {
        let userArray = new Array()
        let checksummedAddress = web3.utils.toChecksumAddress(data[0]);

        userArray.push(checksummedAddress)
        userArray.push(validToken)
        allocData.push(userArray);
        fullFileData.push(userArray);
        index++;
        if (index >= 75) {
          distribData.push(allocData);
          allocData = [];
          index = 0;
        }

      } else {
        let userArray = new Array()
        //dont need this here, as if it is NOT an address this function will fail
        //let checksummedAddress = web3.utils.toChecksumAddress(data[1]);
        userArray.push(data[0])
        userArray.push(data[1]);
        badData.push(userArray);
        fullFileData.push(userArray)
      }
    })
    .on("end", function () {
      //Add last remainder batch
      distribData.push(allocData);
      allocData = [];
      mint_tokens_for_affliliates();
    });

  stream.pipe(csvStream);
}

async function mint_tokens_for_affliliates() {
  console.log(`
  -------------------------------------------------------
  ------------ Mint the tokens to affiliates ------------
  -------------------------------------------------------
`);

//this for loop will do the batches, so it should run 75, 75, 50 with 200
for (let i = 0; i < distribData.length; i++) {
  try {
    let affiliatesArray = [];
    let tokensArray = [];

    //splitting the user arrays to be organized by input
    for (let j = 0; j < distribData[i].length; j++) {
      affiliatesArray.push(distribData[i][j][0]);
      let tokenAmount = web3.utils.toWei(distribData[i][j][1],"ether")
      console.log(tokenAmount);
      tokensArray.push(tokenAmount);
    }

    let r = await securityToken.methods.mintMulti(affiliatesArray, tokensArray).send({ from: Issuer, gas: 5000000, gasPrice: DEFAULT_GAS_PRICE })
    console.log(`Batch ${i} - Attempting to send the Minted tokens to affiliates accounts:\n\n`, affiliatesArray, "\n\n");
    console.log("---------- ---------- ---------- ---------- ---------- ---------- ---------- ----------");
    console.log("Multi Mint transaction was successful.", r.gasUsed, "gas used. Spent:", web3.utils.fromWei(BigNumber(r.gasUsed * DEFAULT_GAS_PRICE).toString(), "ether"), "Ether");
    console.log("---------- ---------- ---------- ---------- ---------- ---------- ---------- ----------\n\n");

  } catch (err) {
    console.log("ERROR:", err);
  }
}
}


function isvalidToken(token) {
  var tokenAmount = parseInt(token);
  if((tokenAmount % 1 == 0)) {
    return tokenAmount;
  }
  return false;
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
      await securityToken.methods.addModule(cappedSTOFactoryAddress, bytesSTO, 0,0, true).send({ from: Issuer, gas:2500000, gasPrice:DEFAULT_GAS_PRICE})
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
