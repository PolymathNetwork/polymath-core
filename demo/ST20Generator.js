var readlineSync = require('readline-sync');
var BigNumber = require('bignumber.js')

let _GANACHE_CONTRACTS = true;
let tickerRegistryAddress;
let securityTokenRegistryAddress;
let cappedSTOFactoryAddress;

if(_GANACHE_CONTRACTS){
  tickerRegistryAddress = JSON.parse(require('fs').readFileSync('./build/contracts/TickerRegistry.json').toString()).networks[15].address;
  securityTokenRegistryAddress = JSON.parse(require('fs').readFileSync('./build/contracts/SecurityTokenRegistry.json').toString()).networks[15].address;
  cappedSTOFactoryAddress = JSON.parse(require('fs').readFileSync('./build/contracts/CappedSTOFactory.json').toString()).networks[15].address;
}else{
  tickerRegistryAddress = "0x81b361a0039f68294f49e0ac5ca059e9766a8ec7";
  securityTokenRegistryAddress = "0xa7af378af5bb73122466581715bf7e19fb30b7fb";
  cappedSTOFactoryAddress = "0x184fd04392374aec793b56e3fc4767b45324d354";
}

const tickerRegistryABI         = JSON.parse(require('fs').readFileSync('./build/contracts/TickerRegistry.json').toString()).abi;
const securityTokenRegistryABI  = JSON.parse(require('fs').readFileSync('./build/contracts/SecurityTokenRegistry.json').toString()).abi;
const securityTokenABI          = JSON.parse(require('fs').readFileSync('./build/contracts/SecurityToken.json').toString()).abi;

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
let minContribution;
let maxContribution;

let tokenName;
let tokenSymbol;
let tokenDecimals = 18;

const tokenDetails = "This is a legit issuance...";

////////////////////////

let tickerRegistry;
let securityTokenRegistry;
let securityToken;

// App flow
let index_mainmenu;

let accounts;
let Issuer;

let _DEBUG = false;

let DEFAULT_GAS_PRICE = 80000000000;

async function executeApp() {

  accounts = await web3.eth.getAccounts();
  Issuer = accounts[0];

  console.log("********************************************")
  console.log("Welcome to the Command-Line ST-20 Generator.");
  console.log("********************************************")

  setup();

};

async function setup(){
  tickerRegistry = new web3.eth.Contract(tickerRegistryABI,tickerRegistryAddress);
  tickerRegistry.setProvider(web3.currentProvider);
  securityTokenRegistry = new web3.eth.Contract(securityTokenRegistryABI,securityTokenRegistryAddress);
  securityTokenRegistry.setProvider(web3.currentProvider);
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
          console.log('\x1b[31m%s\x1b[0m',"Token Symbol has already been registered by you, skipping registration");
          available = true;
          alreadyRegistered = true;
        }else{
          console.log('\x1b[31m%s\x1b[0m',"Token Symbol has already been registered, please choose another symbol");
        }
    });
  }

  if(!alreadyRegistered){
    try{
      await tickerRegistry.methods.registerTicker(tokenSymbol, "").send({ from: Issuer, gas:200000, gasPrice: DEFAULT_GAS_PRICE})
      .on('transactionHash', function(hash){
        console.log(`
          Your transaction is being processed. Please wait...
          TxHash: ${hash}\n`
        );
      })
      .on('receipt', function(receipt){
        console.log(`
          Congratulations! The transaction was successfully completed.\n
          Review it on Etherscan.\n
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
      console.log('\x1b[31m%s\x1b[0m',"Token has already been deployed at address "+result+". Skipping registration");
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

    try{
      await securityTokenRegistry.methods.generateSecurityToken(tokenName, tokenSymbol, tokenDecimals, web3.utils.fromAscii(tokenDetails)).send({ from: Issuer, gas:4500000, gasPrice: DEFAULT_GAS_PRICE})
      .on('transactionHash', function(hash){
        console.log(`
          Your transaction is being processed. Please wait...
          TxHash: ${hash}\n`
        );
      })
      .on('receipt', function(receipt){
        console.log(`
          Congratulations! The transaction was successfully completed.\n
          Deployed Token at address: ${receipt.events.LogNewSecurityToken.returnValues._securityTokenAddress}
          Review it on Etherscan.\n
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

  // await securityToken.methods.symbol().call({from: Issuer}, function(error, result){
  //     console.log("SYMBOL",result);
  // });

  // if(_DEBUG){
  //   securityToken = new web3.eth.Contract(securityTokenABI,"0x1dBC275B76117f3979a5E8fC900bCBBbdf6006F1");
  // }

  console.log("\n");
  console.log('\x1b[34m%s\x1b[0m',"Token Creation - STO Configuration (Capped STO in ETH)");

  startTime =  readlineSync.question('Enter the start time for the STO (Unix Epoch time)\n(1 hour from now = '+(Math.floor(Date.now()/1000)+3600)+' ): ');
  endTime =  readlineSync.question('Enter the end time for the STO (Unix Epoch time)\n(1 month from now = '+(Math.floor(Date.now()/1000)+ (30 * 24 * 60 * 60))+' ): ');
  cap =  readlineSync.question('Enter the cap (in ETH) for the STO (1000000): ');
  rate =  readlineSync.question('Enter the rate (1 ETH = X ST) for the STO (1000): ');
  wallet =  readlineSync.question('Enter the address that will receive the funds from the STO ('+Issuer+'): ');

  if(startTime == "") startTime = BigNumber((Math.floor(Date.now()/1000)+3600));
  if(endTime == "") endTime = BigNumber((Math.floor(Date.now()/1000)+ (30 * 24 * 60 * 60)));
  if(cap == "") cap = web3.utils.toWei('100000', 'ether');
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
          name: '_polyToken'
      },{
          type: 'address',
          name: '_fundsReceiver'
      }
      ]
  }, [startTime, endTime, web3.utils.toWei(cap, 'ether'), rate,0,0,wallet]);

  try{
    await securityToken.methods.addModule(cappedSTOFactoryAddress, bytesSTO, 0,0, false).send({ from: Issuer, gas:2500000, gasPrice:DEFAULT_GAS_PRICE})
    .on('transactionHash', function(hash){
      console.log(`
        Your transaction is being processed. Please wait...
        TxHash: ${hash}\n`
      );
    })
    .on('receipt', function(receipt){
      console.log(`
        Congratulations! The transaction was successfully completed.\n
        STO deployed at address: ${receipt.events.LogModuleAdded.returnValues._module}
        Review it on Etherscan.\n
        TxHash: ${receipt.transactionHash}\n`
      );
    })
    .on('error', console.error);

    //console.log("aaa",receipt.logs[1].args._securityTokenAddress);

  }catch (err){
    console.log(err.message);
    return;
  }

  console.log("FINISHED");
}

/////////

async function step_other(){
  console.log("\n");
  console.log('\x1b[34m%s\x1b[0m',"Token Creation - Step 1: Token Name");
  tokenName =  readlineSync.question('Enter a name for your new token: ');
  console.log("You entered: ", tokenName, "\n");

  console.log('\x1b[34m%s\x1b[0m',"Token Creation - Step 2: Token Symbol");
  tokenSymbol =  readlineSync.question('Enter a symbol for '+tokenName+': ');
  console.log("You entered: ", tokenSymbol, "\n");

  console.log('\x1b[34m%s\x1b[0m',"Token Creation - Step 3: Decimals");
  tokenDecimals =  readlineSync.questionInt('How many decimals will '+tokenName+' token ('+tokenSymbol+')'+' have?: ');
  console.log("You entered: ", tokenDecimals, "\n");

  console.log('\x1b[43m%s\x1b[0m',tokenName + ' token ('+tokenSymbol+') ' + 'with '+ tokenDecimals +' decimals will be used for the ICO.');
  console.log("\n");

  /////////////
  // Start Date

  console.log('\x1b[34m%s\x1b[0m',"ICO Creation - Step 1: Start date");
  startTime =  readlineSync.question('Choose a start date for the crowdsale: ');
  console.log("You chose: ", startTime, "\n");

  ///////////
  // End Date

  var options_endTime = {limit: function(input) {
    return (startTime <= parseInt(input));
  },limitMessage: "Please enter an end time later than the start time"};

  console.log('\x1b[34m%s\x1b[0m',"ICO Creation - Step 2: End date");
  endTime =  readlineSync.question('Choose an end date for the crowdsale: ',options_endTime);
  console.log("You chose: ", endTime, "\n");

  /////////
  // Wallet

  console.log('\x1b[34m%s\x1b[0m',"ICO Creation - Step 3: Wallet address");
  wallet =  readlineSync.question('Enter an ETH address to be used as wallet (funds will be transferred to this account): ');
  console.log("You chose: ", wallet, "\n");

  /////////
  // Rate

  console.log('\x1b[34m%s\x1b[0m',"ICO Creation - Step 4: ETH to " + tokenSymbol + " exchange rate.");
  rate =  readlineSync.questionInt('Enter the exchange rate for your token (1 ETH = x '+ tokenSymbol+ '): ');
  console.log("Each 1 ETH will yield "+ rate +" "+ tokenSymbol + "\n");

  ////////////
  // ICO Token Cap

  console.log('\x1b[34m%s\x1b[0m',"ICO Creation - Step 5: Token Cap");
  tokenCap =  readlineSync.questionInt('What will be the maximum tokens to be minted? (Token Cap): ');
  tokenCap = tokenCap * 10 ** tokenDecimals;
  console.log("The ICO will mint and distribute a maximum of " + tokenCap + " tokens.\n");

  ///////////////////
  // Min contribution

  console.log('\x1b[34m%s\x1b[0m',"ICO Creation - Step 6: Minimum allowed contribution");
  minContribution =  readlineSync.questionFloat('What will be the minimum possible contribution? (in ether) ');
  console.log("The minimum allowed contribution will be " + minContribution + " ether.\n");

  ///////////////////
  // Max contribution

  var options_maxContrib = {limit: function(input) {
    return (minContribution < parseFloat(input));
  },limitMessage: "Please enter a maximum contribution higher than the minimum contribution."};


  console.log('\x1b[34m%s\x1b[0m',"ICO Creation - Step 7: Maximum allowed contribution");
  maxContribution =  readlineSync.question('What will be the maximum possible contribution? (in wei) ',options_maxContrib);
  console.log("The maximum allowed contribution will be " + maxContribution + " wei.\n");

  if(_DEBUG){
    startTime = Math.floor(new Date().getTime() /1000);
    endTime = Math.floor(new Date().getTime() /1000 + (3600 * 24 * 30));

    console.log('\x1b[31m%s\x1b[0m',"Warning: Debugging is activated. Start and End dates have been modified");
  }

  console.log("----------------------------------------------------");
  console.log('\x1b[34m%s\x1b[0m',"Please review the information you entered:");
  console.log("Token name: ", tokenName);
  console.log("Token symbol: ", tokenSymbol);
  console.log("Token decimals: ", tokenDecimals);
  console.log("Start date: ", startTime);
  console.log("End date: ", endTime);
  console.log("Wallet: ", wallet);
  console.log("Exchange rate: ", rate);
  console.log("Token Cap: ", tokenCap);
  console.log("Minimum contribution (in ether): ", minContribution);
  console.log("Maximum contribution (in ether): ", maxContribution);
  console.log("----------------------------------------------------");
  // ICO creation

  let token;

  // try{
  //
  //   crowdsaleGenerator = await CrowdsaleGenerator.new(
  //     startTime, endTime, wallet, rate,
  //     tokenCap, web3.utils.toWei(minContribution.toString(10),"ether"),
  //     web3.utils.toWei(maxContribution.toString(10),"ether"),
  //     tokenName, tokenSymbol, tokenDecimals,
  //     {from:accounts[0],gas:4000000});
  //
  //   let tokenAddress = await crowdsaleGenerator.token({from:accounts[0],gas:2000000});
  //   token = await TokenGenerator.at(tokenAddress);
  //
  //   console.log("\n")
  //   console.log('\x1b[42m%s\x1b[0m',"Congratulations! The ICO was successfully generated.")
  //   console.log('\x1b[43m%s\x1b[0m',"ICO Address: " + crowdsaleGenerator.address.valueOf());
  //   console.log('\x1b[43m%s\x1b[0m',"TOKEN Address: "+ token.address.valueOf());
  //
  // } catch (err){
  //   console.log(err);
  // }
}

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

executeApp();
