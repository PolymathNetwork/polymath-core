var readlineSync = require('readline-sync');
var BigNumber = require('bignumber.js')
var contracts = require("./helpers/contract_addresses");
var chalk = require('chalk');
const shell = require('shelljs');

let polytokenAddress = contracts.polyTokenAddress();

let polytokenABI;

try{
  polytokenABI = JSON.parse(require('fs').readFileSync('./build/contracts/PolyTokenFaucet.json').toString()).abi;
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

////////////////////////

let polyToken;

// App flow

let accounts;
let Issuer;

let _DEBUG = false;

let DEFAULT_GAS_PRICE = 80000000000;

async function executeApp() {

  accounts = await web3.eth.getAccounts();
  Issuer = accounts[0];

  console.log("\n");
  console.log("***************************")
  console.log("Welcome to the POLY Faucet.");
  console.log("***************************\n")

  setup();

};

async function setup(){
  try {
    polyToken = new web3.eth.Contract(polytokenABI, polytokenAddress);
    polyToken.setProvider(web3.currentProvider);
  }catch(err){
    console.log(err)
    console.log('\x1b[31m%s\x1b[0m',"There was a problem getting the contracts. Make sure they are deployed to the selected network.");
    return;
  }

  send_poly();

}

async function send_poly() {
    let issuerBalance = await polyToken.methods.balanceOf(Issuer).call({from : Issuer});
    console.log(chalk.blue(`Hello user you have '${(new BigNumber(issuerBalance).dividedBy(new BigNumber(10).pow(18))).toNumber()}POLY'\n`))

    let options = ['250 POLY for ticker registeration','500 POLY for token launch + ticker reg', '20K POLY for CappedSTO Module', '20.5K POLY for Ticker + Token + CappedSTO','As many POLY as you want'];
    let index = readlineSync.keyInSelect(options, 'What do you want to do?');
    console.log("Selected:",options[index]);
  switch(index){
    case 0:
        let _to =  readlineSync.question(`Enter beneficiary of 250 POLY ('${Issuer}'): `);
        if (_to == "") _to = Issuer;
        let _amount =  web3.utils.toWei("250","ether");
        console.log()
        await transferTokens(_to,_amount);
    break;
    case 1:
        let _to2 =  readlineSync.question(`Enter beneficiary of 500 POLY ('${Issuer}'): `);
        if (_to2 == "") _to2 = Issuer;
        let _amount2 =  web3.utils.toWei("500","ether");
        await transferTokens(_to2,_amount2);
    break;
    case 2:
        let _to3 =  readlineSync.question(`Enter beneficiary of 20K POLY ('${Issuer}'): `);
        if (_to3 == "") _to3 = Issuer;
        let _amount3 =  web3.utils.toWei("20000","ether");
        await transferTokens(_to3,_amount3);
    break;
    case 3:
        let _to4 =  readlineSync.question(`Enter beneficiary of 20.5K POLY ('${Issuer}'): `);
        if (_to4 == "") _to4 = Issuer;
        let _amount4 =  web3.utils.toWei("20500","ether");
        await transferTokens(_to4,_amount4);
    break;
    case 4:
        let _to5 =  readlineSync.question(`Enter beneficiary of transfer ('${Issuer}'): `);
        if (_to5 == "") _to5 = Issuer;
        let _amount5 = readlineSync.question(`Enter the no. of POLY Tokens:`);
        await transferTokens(_to5, web3.utils.toWei(_amount5, "ether"));
    break;
}
}

async function transferTokens(to, amount) {
    try {
        await polyToken.methods.getTokens(amount, to).send({from: Issuer, gas: 250000, gasPrice: DEFAULT_GAS_PRICE})
        .on('transactionHash', function(hash) {
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
    } catch (err){
        console.log(err.message);
        return;
    }
    let balance = await polyToken.methods.balanceOf(to).call();
    let balanceInPoly = new BigNumber(balance).dividedBy(new BigNumber(10).pow(18));
    console.log(chalk.green(`Congratulations! balance of ${to} address is ${balanceInPoly.toNumber()} POLY`));
}

executeApp();
