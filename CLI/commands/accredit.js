var fs = require('fs');
var csv = require('fast-csv');
var BigNumber = require('bignumber.js');
const Web3 = require('web3');
var chalk = require('chalk');
var common = require('./common/common_functions');

/////////////////////////////ARTIFACTS//////////////////////////////////////////
var contracts = require("./helpers/contract_addresses");
let tickerRegistryAddress = contracts.tickerRegistryAddress();
let securityTokenRegistryAddress = contracts.securityTokenRegistryAddress();

let tickerRegistry;
let securityTokenRegistry;
let securityToken;
let usdTieredSTO;

let tickerRegistryABI;
let securityTokenRegistryABI;
let securityTokenABI;
let usdTieredSTOABI;
try {
  tickerRegistryABI = JSON.parse(require('fs').readFileSync('./build/contracts/TickerRegistry.json').toString()).abi;
  securityTokenRegistryABI = JSON.parse(require('fs').readFileSync('./build/contracts/SecurityTokenRegistry.json').toString()).abi;
  securityTokenABI = JSON.parse(require('fs').readFileSync('./build/contracts/SecurityToken.json').toString()).abi;
  usdTieredSTOABI = JSON.parse(require('fs').readFileSync('./build/contracts/USDTieredSTO.json').toString()).abi;
} catch (err) {
  console.log('\x1b[31m%s\x1b[0m', "Couldn't find contracts' artifacts. Make sure you ran truffle compile first");
  return;
}

////////////////////////////WEB3//////////////////////////////////////////
if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else {
  // set the provider you want from Web3.providers
  web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

////////////////////////////USER INPUTS//////////////////////////////////////////
let tokenSymbol = process.argv.slice(2)[0]; //token symbol
let BATCH_SIZE = process.argv.slice(2)[1]; //batch size
if (!BATCH_SIZE) BATCH_SIZE = 75;

/////////////////////////GLOBAL VARS//////////////////////////////////////////
//distribData is an array of batches. i.e. if there are 200 entries, with batch sizes of 75, we get [[75],[75],[50]]
let distribData = new Array();
//allocData is a temporary array that stores up to the batch size,
//then gets push into distribData, then gets set to 0 to start another batch
let allocData = new Array();
//full file data is a single array that contains all arrays. i.e. if there are 200 entries we get [[200]]
let fullFileData = new Array();
//baa data is an array that contains invalid entries
let badData = new Array();

let Issuer;
let accounts;

let DEFAULT_GAS_PRICE = 10000000000;

//////////////////////////////////////////ENTRY INTO SCRIPT//////////////////////////////////////////
startScript();

async function startScript() {
  try {
    tickerRegistry = new web3.eth.Contract(tickerRegistryABI, tickerRegistryAddress);
    tickerRegistry.setProvider(web3.currentProvider);
    securityTokenRegistry = new web3.eth.Contract(securityTokenRegistryABI, securityTokenRegistryAddress);
    securityTokenRegistry.setProvider(web3.currentProvider);
    console.log("Processing investor CSV upload. Batch size is " + BATCH_SIZE + " accounts per transaction");
    readFile();
  } catch (err) {
    console.log(err)
    console.log('\x1b[31m%s\x1b[0m', "There was a problem getting the contracts. Make sure they are deployed to the selected network.");
    return;
  }
}

///////////////////////////FUNCTION READING THE CSV FILE
function readFile() {
  var stream = fs.createReadStream("./CLI/data/accredited_data.csv");

  let index = 0;
  console.log(`
    --------------------------------------------
    ----------- Parsing the csv file -----------
    --------------------------------------------
  `);

  var csvStream = csv()
    .on("data", function (data) {
      let isAddress = web3.utils.isAddress(data[0]);
      let isAccredited = (typeof JSON.parse(data[1].toLowerCase())) == "boolean" ? JSON.parse(data[1].toLowerCase()) : "not-valid";

      if (isAddress && (isAccredited != "not-valid") ) {
        let userArray = new Array()
        let checksummedAddress = web3.utils.toChecksumAddress(data[0]);

        userArray.push(checksummedAddress)
        userArray.push(isAccredited)

        allocData.push(userArray);
        fullFileData.push(userArray);
        
        index++;
        if (index >= BATCH_SIZE) {
          distribData.push(allocData);
          allocData = [];
          index = 0;
        }
      } else {
        let userArray = new Array()
        userArray.push(data[0])
        userArray.push(isAccredited);

        badData.push(userArray);
        fullFileData.push(userArray)
      }
    })
    .on("end", function () {
      //Add last remainder batch
      distribData.push(allocData);
      allocData = [];

      changeAccredited();
    });

  stream.pipe(csvStream);
}

// MAIN FUNCTION COMMUNICATING TO BLOCKCHAIN
async function changeAccredited() {
  accounts = await web3.eth.getAccounts();
  Issuer = accounts[0]

  // Let's check if token has already been deployed, if it has, skip to STO
  let tokenDeployedAddress = await securityTokenRegistry.methods.getSecurityTokenAddress(tokenSymbol).call({ from: Issuer });
  if (tokenDeployedAddress != "0x0000000000000000000000000000000000000000") {
    securityToken = new web3.eth.Contract(securityTokenABI, tokenDeployedAddress);
    let result = await securityToken.methods.getModule(3, 0).call({ from: Issuer });
    if (result[1] != "0x0000000000000000000000000000000000000000") {
      let stoName = web3.utils.toAscii(result[0]).replace(/\u0000/g, '');
      if (stoName == 'USDTieredSTO') {
          usdTieredSTO = new web3.eth.Contract(usdTieredSTOABI, result[1]);
          console.log(`
-------------------------------------------------------
----- Sending accreditation changes to blockchain -----
-------------------------------------------------------
          `);
          //this for loop will do the batches, so it should run 75, 75, 50 with 200
          for (let i = 0; i < distribData.length; i++) {
            try {
              let investorArray = [];
              let isAccreditedArray = [];
        
              //splitting the user arrays to be organized by input
              for (let j = 0; j < distribData[i].length; j++) {
                investorArray.push(distribData[i][j][0])
                isAccreditedArray.push(distribData[i][j][1])
              }
        
              let changeAccreditedAction = usdTieredSTO.methods.changeAccredited(investorArray, isAccreditedArray);
              let GAS = await common.estimateGas(changeAccreditedAction, Issuer, 2);
              let r = await changeAccreditedAction.send({ from: Issuer, gas: GAS, gasPrice: DEFAULT_GAS_PRICE })
              console.log(`Batch ${i} - Attempting to change accredited accounts:\n\n`, investorArray, "\n\n");
              console.log("---------- ---------- ---------- ---------- ---------- ---------- ---------- ----------");
              console.log("Change accredited transaction was successful.", r.gasUsed, "gas used. Spent:", web3.utils.fromWei(BigNumber(r.gasUsed * DEFAULT_GAS_PRICE).toString(), "ether"), "Ether");
              console.log("---------- ---------- ---------- ---------- ---------- ---------- ---------- ----------\n\n");
            } catch (err) {
              console.log("ERROR:", err);
            }
          }
        } else {
            console.log(chalk.red(`The STO attached is ${stoName} and this module only works for USDTieredSTO.`));
        }
    } else {
        console.log(chalk.red(`There is no STO module attached to the ${tokenSymbol.toUpperCase()} Token. No further actions can be taken.`));
    } 
  } else {
    console.log(chalk.red(`Token symbol provided is not a registered Security Token.`));
  }
}
