const ModuleRegistryArtifact = require('../build/contracts/ModuleRegistry.json');
const CappedSTOFactoryArtifact = require('../build/contracts/CappedSTOFactory.json');
const CappedSTOArtifact = require('../build/contracts/CappedSTO.json');
const SecurityTokenRegistryArtifact = require('../build/contracts/SecurityTokenRegistry.json');
const TickerRegistryArtifact = require('../build/contracts/TickerRegistry.json');
const SecurityTokenArtifact = require('../build/contracts/SecurityToken.json');

var readlineSync = require('readline-sync');
const contract = require('truffle-contract');

const ModuleRegistry = contract(ModuleRegistryArtifact);
const CappedSTOFactory = contract(CappedSTOFactoryArtifact);
const CappedSTO = contract(CappedSTOArtifact);
const SecurityTokenRegistry = contract(SecurityTokenRegistryArtifact);
const TickerRegistry = contract(TickerRegistryArtifact);
const SecurityToken = contract(SecurityTokenArtifact);

const tickerRegistryAddress = "0xc309839cf3c730556cb1ee979aeb78ec99a13cc2";

const Web3 = require('web3');

if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else {
  // set the provider you want from Web3.providers
  web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

TickerRegistry.setProvider(web3.currentProvider);
//dirty hack for web3@1.0.0 support for localhost testrpc, see https://github.com/trufflesuite/truffle-contract/issues/56#issuecomment-331084530
if (typeof TickerRegistry.currentProvider.sendAsync !== "function") {
  TickerRegistry.currentProvider.sendAsync = function() {
    return TickerRegistry.currentProvider.send.apply(
      TickerRegistry.currentProvider, arguments
    );
  };
}
//
// TokenGenerator.setProvider(web3.currentProvider);
// //dirty hack for web3@1.0.0 support for localhost testrpc, see https://github.com/trufflesuite/truffle-contract/issues/56#issuecomment-331084530
// if (typeof TokenGenerator.currentProvider.sendAsync !== "function") {
//   TokenGenerator.currentProvider.sendAsync = function() {
//     return TokenGenerator.currentProvider.send.apply(
//       TokenGenerator.currentProvider, arguments
//     );
//   };
// }

///////////////////
//Crowdsale params

let startTime;
let endTime;
let wallet;
let rate;
let tokenCap;
let minContribution;
let maxContribution;
let tokenName;
let tokenSymbol;
let tokenDecimals;

////////////////////////

let tickerRegistry;

// App flow
let index_mainmenu;

let accounts;
let Issuer;

let _DEBUG = true;

async function executeApp() {

  accounts = await web3.eth.getAccounts();
  Issuer = accounts[0];

  console.log("********************************************")
  console.log("Welcome to the Command-Line ST-20 Generator.");
  console.log("********************************************")

  setup();

};

async function setup(){
  tickerRegistry = TickerRegistry.at(tickerRegistryAddress);
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

};

async function step_ticker_reg(){
  console.log("\n");
  console.log('\x1b[34m%s\x1b[0m',"Token Creation - Step 1: Token Symbol");
  tokenSymbol =  readlineSync.question('Enter the Symbol for your new token: ');

  try{
    let receipt = await tickerRegistry.registerTicker(tokenSymbol, "poly@polymath.network", { from: Issuer, gas:200000});
    console.log(`
      Congratulations! You successfully registered the ${tokenSymbol} token symbol.\n
      Review your transaction on Etherscan.\n
      TxHash: ${receipt.receipt.transactionHash}\n`);

  }catch (err){
    console.log(err);
  }


}

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

executeApp();
