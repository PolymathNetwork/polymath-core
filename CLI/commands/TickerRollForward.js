var fs = require('fs');
var csv = require('fast-csv');
var BigNumber = require('bignumber.js');
const Web3 = require('web3');
var chalk = require('chalk');
var common = require('./common/common_functions');

/////////////////////////  ARTIFACTS  /////////////////////////

var contracts = require('./helpers/contract_addresses');
// var abis = require('./helpers/contract_abis');

/////////////////////////     WEB3    /////////////////////////

if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else {
  // set the provider you want from Web3.providers
  web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

///////////////////////// GLOBAL VARS /////////////////////////

let USER;
let DEFAULT_GAS_PRICE;

let ticker_data = [];
let registered_tickers = [];
let failed_tickers = [];

let totalGas = BigNumber(0);

let polyToken;
let tickerRegistry;
let tickerRegistryAddress;

function Ticker(_owner, _symbol, _name, _swarmHash) {
    this.owner = _owner;
    this.symbol = _symbol;
    this.name = _name;
    this.swarmHash = _swarmHash;
}

function FailedRegistration(_ticker, _error) {
  this.ticker = _ticker;
  this.error = _error;
}

/////////////////////////  MAIN SCRIPT  /////////////////////////

/*
1. Parse csv to array
2. Process registration
    a. count number of registrations and approve registry for number of tx accordingly
    b. For each ticker, check if available, if not, append to unavailable ticker array
    c. Register ticker
3. Return list of unavailable ticker registrations
*/

startScript();

async function startScript() {
  const accounts = await web3.eth.getAccounts();
  USER = accounts[0];
  // const DEFAULT_GAS_PRICE = common.getGasPrice(await web3.eth.net.getId());
  DEFAULT_GAS_PRICE = BigNumber(50000000000);

  let tickerRegistryABI = JSON.parse(fs.readFileSync('./build/contracts/TickerRegistry.json').toString()).abi;
  tickerRegistryAddress = contracts.tickerRegistryAddress();
  // let tickerRegistryAddress = await contracts.tickerRegistry();
  // let tickerRegistryABI = abis.tickerRegistry();
  tickerRegistry = new web3.eth.Contract(tickerRegistryABI, tickerRegistryAddress);
  tickerRegistry.setProvider(web3.currentProvider);

  let polytokenABI = JSON.parse(require('fs').readFileSync('./build/contracts/PolyTokenFaucet.json').toString()).abi;
  let polytokenAddress = contracts.polyTokenAddress();
  // let polytokenAddress = await contracts.polyToken();
  // let polytokenABI = abis.polyToken();
  polyToken = new web3.eth.Contract(polytokenABI, polytokenAddress);
  polyToken.setProvider(web3.currentProvider);

  await readFile();
}

async function readFile() {
  var stream = fs.createReadStream("./CLI/data/ticker_data.csv");

  var csvStream = csv()
    .on("data", function (data) {
      ticker_data.push(new Ticker(data[0],data[1],data[2],data[3]));
    })
    .on("end", async function () {
      await registerTickers();
    });
  stream.pipe(csvStream);
}

async function registerTickers() {
  // Poly approval for registration fees
  let polyBalance = BigNumber(await polyToken.methods.balanceOf(USER).call({ from: USER }));
  let fee = await tickerRegistry.methods.registrationFee().call({ from: USER });
  let totalFee = BigNumber(ticker_data.length).mul(fee);

  if (totalFee.gt(polyBalance)) {
    console.log(chalk.red(`\n*******************************************************************************`));
    console.log(chalk.red(`Not enough POLY to pay registration fee. Require ${totalFee.div(10**18).toNumber()} POLY but have ${polyBalance.div(10**18).toNumber()} POLY.`));
    console.log(chalk.red(`*******************************************************************************\n`));
    process.exit(0);
  } else {
    let approveAction = polyToken.methods.approve(tickerRegistryAddress, totalFee);
    let GAS = await common.estimateGas(approveAction, USER, 1.2);
    await approveAction.send({ from: USER, gas: GAS, gasPrice: DEFAULT_GAS_PRICE })
    .on('receipt', function(receipt){
      totalGas = totalGas.add(receipt.gasUsed);
    });
  }

  for (var i = 0; i < ticker_data.length; i++) {
    let valid = true;
    let owner;

    // validate owner
    if (web3.utils.isAddress(ticker_data[i].owner)) {
      owner = web3.utils.toChecksumAddress(ticker_data[i].owner);
    } else {
      failed_tickers.push(` ${i} has invalid owner address`);
      valid = false;
    }

    // validate ticker
    await tickerRegistry.methods.getDetails(ticker_data[i].symbol).call({ from: USER }, function(error, result){
      if (result[1] != 0) {
        failed_tickers.push(` ${i} is already registered`);
        valid = false;
      }
    });

    if (valid) {
      let registerTickerAction = tickerRegistry.methods.registerTicker(owner, ticker_data[i].symbol, ticker_data[i].name, ticker_data[i].swarmHash);
      let GAS = await common.estimateGas(registerTickerAction, USER, 1.2);
      await registerTickerAction.send({ from: USER, gas: GAS, gasPrice: DEFAULT_GAS_PRICE })
      .on('receipt', function(receipt){
        registered_tickers.push(ticker_data[i]);
        console.log(ticker_data[i]);
        totalGas = totalGas.add(receipt.gasUsed);
      })
      .on('error', function(error){
        failed_tickers.push(` ${i} is ${error}`);
      });
    }
  }
  await logResults();
}

async function logResults() {
  console.log(`
    --------------------------------------------
    ----------- Registration Results -----------
    --------------------------------------------

    Successful registrations: ${registered_tickers.length}
    Failed registrations:     ${failed_tickers.length}
    Total gas consumed:       ${totalGas}
    Total gas cost:           ${DEFAULT_GAS_PRICE.mul(totalGas).div(10**18)} ETH

    List of failed registrations:
    ${failed_tickers}
  `);
  process.exit(0);
}
