var fs = require('fs');
var csv = require('fast-csv');
var BigNumber = require('bignumber.js');
var chalk = require('chalk');
var common = require('./common/common_functions');

/////////////////////////  ARTIFACTS  /////////////////////////
var contracts = require('./helpers/contract_addresses');
var abis = require('./helpers/contract_abis');

///////////////////////// GLOBAL VARS /////////////////////////
let ticker_data = [];
let registered_tickers = [];
let failed_tickers = [];

let totalGas = BigNumber(0);

let polyToken;
let securityTokenRegistry;
let securityTokenRegistryAddress;

function Ticker(_owner, _symbol, _name) {
  this.owner = _owner;
  this.symbol = _symbol;
  this.name = _name;
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

  securityTokenRegistryAddress = await contracts.securityTokenRegistry();
  let securityTokenRegistryABI = abis.securityTokenRegistry();
  securityTokenRegistry = new web3.eth.Contract(securityTokenRegistryABI, securityTokenRegistryAddress);
  securityTokenRegistry.setProvider(web3.currentProvider);

  let polytokenAddress = await contracts.polyToken();
  let polytokenABI = abis.polyToken();
  polyToken = new web3.eth.Contract(polytokenABI, polytokenAddress);
  polyToken.setProvider(web3.currentProvider);

  await readFile();
}

async function readFile() {
  var stream = fs.createReadStream(`${__dirname}/../data/ticker_data.csv`);

  var csvStream = csv()
    .on("data", function (data) {
      ticker_data.push(new Ticker(data[0], data[1], data[2], data[3]));
    })
    .on("end", async function () {
      await registerTickers();
    });
  stream.pipe(csvStream);
}

async function registerTickers() {
  // Poly approval for registration fees
  let polyBalance = BigNumber(await polyToken.methods.balanceOf(Issuer.address).call());
  let fee = web3.utils.fromWei(await securityTokenRegistry.methods.getTickerRegistrationFee().call());
  let totalFee = BigNumber(ticker_data.length).mul(fee);

  if (totalFee.gt(polyBalance)) {
    console.log(chalk.red(`\n*******************************************************************************`));
    console.log(chalk.red(`Not enough POLY to pay registration fee. Require ${totalFee.div(10 ** 18).toNumber()} POLY but have ${polyBalance.div(10 ** 18).toNumber()} POLY.`));
    console.log(chalk.red(`*******************************************************************************\n`));
    process.exit(0);
  } else {
    let approveAction = polyToken.methods.approve(securityTokenRegistryAddress, totalFee);
    let receipt = await common.sendTransaction(approveAction);
    totalGas = totalGas.add(receipt.gasUsed);
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
    await securityTokenRegistry.methods.getTickerDetails(ticker_data[i].symbol).call({}, function (error, result) {
      if (result[1] != 0) {
        failed_tickers.push(` ${i} is already registered`);
        valid = false;
      }
    });

    if (valid) {
      try {
        let registerTickerAction = securityTokenRegistry.methods.registerTicker(owner, ticker_data[i].symbol, ticker_data[i].name);
        let receipt = await common.sendTransaction(registerTickerAction);
        registered_tickers.push(ticker_data[i]);
        console.log(ticker_data[i]);
        totalGas = totalGas.add(receipt.gasUsed);
      } catch (error) {
        failed_tickers.push(` ${i} is ${error}`);
      }
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
    Total gas cost:           ${defaultGasPrice.mul(totalGas).div(10 ** 18)} ETH

    List of failed registrations:
    ${failed_tickers}
  `);
  process.exit(0);
}
