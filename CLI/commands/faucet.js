var readlineSync = require('readline-sync');
var BigNumber = require('bignumber.js');
var common = require('./common/common_functions');
var contracts = require('./helpers/contract_addresses');
var abis = require('./helpers/contract_abis')
var chalk = require('chalk');

////////////////////////
// App flow
let polyToken;
let usdToken;

async function executeApp(beneficiary, amount) {

  console.log("\n");
  console.log("***************************")
  console.log("Welcome to the POLY Faucet.");
  console.log("***************************\n")
  console.log("Issuer Account: " + Issuer.address + "\n");

  await setup();
  await send_poly(beneficiary, amount);
};

async function setup(){
  try {
    let polytokenAddress = await contracts.polyToken();
    let polytokenABI = abis.polyToken();
    polyToken = new web3.eth.Contract(polytokenABI, polytokenAddress);
    polyToken.setProvider(web3.currentProvider);

    let usdTokenAddress = await contracts.usdToken();
    usdToken = new web3.eth.Contract(polytokenABI, usdTokenAddress);
    usdToken.setProvider(web3.currentProvider);
  } catch (err) {
    console.log(err)
    console.log('\x1b[31m%s\x1b[0m',"There was a problem getting the contracts. Make sure they are deployed to the selected network.");
    process.exit(0);
  }
}

async function send_poly(beneficiary, amount) {
  let issuerBalance = await polyToken.methods.balanceOf(Issuer.address).call({from : Issuer.address});
  console.log(chalk.blue(`Hello User, your current balance is '${(new BigNumber(issuerBalance).dividedBy(new BigNumber(10).pow(18))).toNumber()} POLY'\n`))

  if (typeof beneficiary === 'undefined' && typeof amount === 'undefined') {
    let options = ['250 POLY for ticker registration','500 POLY for token launch + ticker reg', '20K POLY for CappedSTO Module', 
                  '20.5K POLY for Ticker + Token + CappedSTO', '100.5K POLY for Ticker + Token + USDTieredSTO','As many POLY as you want', '10K USD Tokens'];
    index = readlineSync.keyInSelect(options, 'What do you want to do?');
    console.log("Selected:", index != -1 ? options[index] : 'Cancel');
    switch (index) {
      case 0:
        beneficiary =  readlineSync.question(`Enter beneficiary of 250 POLY ('${Issuer.address}'): `);
        amount = '250';
        break;
      case 1:
        beneficiary =  readlineSync.question(`Enter beneficiary of 500 POLY ('${Issuer.address}'): `);
        amount = '500';
        break;
      case 2:
        beneficiary =  readlineSync.question(`Enter beneficiary of 20K POLY ('${Issuer.address}'): `);
        amount = '20000';
        break;
      case 3:
        beneficiary =  readlineSync.question(`Enter beneficiary of 20.5K POLY ('${Issuer.address}'): `);
        amount = '20500';
        break;
      case 4:
        beneficiary =  readlineSync.question(`Enter beneficiary of 100.5K POLY ('${Issuer.address}'): `);
        amount = '100500';
        break;
      case 5:
        beneficiary =  readlineSync.question(`Enter beneficiary of transfer ('${Issuer.address}'): `);
        amount = readlineSync.questionInt(`Enter the no. of POLY Tokens: `).toString();
        break;
      case 6:
        beneficiary = readlineSync.question(`Enter beneficiary 10K USD Tokens ('${Issuer.address}'): `);
        if (beneficiary == "") beneficiary = Issuer.address;
        let getTokensAction = usdToken.methods.getTokens(web3.utils.toWei('10000'), beneficiary);
        await common.sendTransaction(getTokensAction);
        let balance = await usdToken.methods.balanceOf(beneficiary).call();
        let balanceInPoly = new BigNumber(balance).dividedBy(new BigNumber(10).pow(18));
        console.log(chalk.green(`Congratulations! balance of ${beneficiary} address is ${balanceInPoly.toNumber()} USD Tokens`));    
        process.exit(0);
        break;
      case -1:
        process.exit(0);
    }
  }
  
  if (beneficiary == "") beneficiary = Issuer.address;
  await transferTokens(beneficiary, web3.utils.toWei(amount));
}

async function transferTokens(to, amount) {
    try {
        let getTokensAction = polyToken.methods.getTokens(amount, to);
        await common.sendTransaction(getTokensAction);
    } catch (err){
        console.log(err.message);
        return;
    }
    let balance = await polyToken.methods.balanceOf(to).call();
    let balanceInPoly = new BigNumber(balance).dividedBy(new BigNumber(10).pow(18));
    console.log(chalk.green(`Congratulations! balance of ${to} address is ${balanceInPoly.toNumber()} POLY`));
}

module.exports = {
  executeApp: async function(beneficiary, amount) {
        return executeApp(beneficiary, amount);
    }
}