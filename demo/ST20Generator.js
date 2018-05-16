var readlineSync = require('readline-sync');
var BigNumber = require('bignumber.js')

var contracts = require("./helpers/contract_addresses");
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
      await securityTokenRegistry.methods.generateSecurityToken(tokenName, tokenSymbol, web3.utils.fromAscii(tokenDetails), divisibility).send({ from: Issuer, gas:5000000, gasPrice: DEFAULT_GAS_PRICE})
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

  await step_STO_Launch();
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

