var common = require('./common/common_functions');
var fs = require('fs');
var csv = require('fast-csv');
var contracts = require('./helpers/contract_addresses');
var abis = require('./helpers/contract_abis');
var BigNumber = require('bignumber.js');

let distribData = new Array();
let allocData = new Array();
let fullFileData = new Array();
let badData = new Array();

let BATCH_SIZE = 70;
let securityToken;

async function startScript(tokenSymbol, batchSize) {
  if (batchSize) {
    BATCH_SIZE = batchSize;
  }

  common.logAsciiBull();

  let STAddress = await checkST(tokenSymbol);
  securityToken = new web3.eth.Contract(abis.securityToken(), STAddress);
  
  await readCsv();
};

async function checkST(tokenSymbol) {
  let securityTokenRegistry = await STConnect();

  return await securityTokenRegistry.methods.getSecurityTokenAddress(tokenSymbol).call({}, function (error, result) {
    if (result != "0x0000000000000000000000000000000000000000") {
      return result
    } else {
      console.log("Token doesn't exist")
      process.exit(0)
    }
  });
}

async function STConnect() {
  try {
    let STRegistryAddress = await contracts.securityTokenRegistry();
    let STRegistry = new web3.eth.Contract(abis.securityTokenRegistry(), STRegistryAddress);
    return STRegistry;
  } catch (err) {
    console.log("There was a problem getting the contracts. Make sure they are deployed to the selected network.");
    process.exit(0);
  }
}

async function readCsv() {
  var CSV_STRING = fs.readFileSync("./CLI/data/nonAccreditedLimits_data.csv").toString();
  let i = 0;

  csv.fromString(CSV_STRING)
    .on("data", (data) => {
      let data_processed = nonAccredited_processing(data);
      fullFileData.push(data_processed[1]);

      if (data_processed[0]) {
        allocData.push(data_processed[1]);
        i++;
        if (i >= BATCH_SIZE) {
          distribData.push(allocData);
          allocData = [];
          i = 0;
        }
      } else {
        badData.push(data_processed[1]);
      }

    })
    .on("end", async () => {
      distribData.push(allocData);
      allocData = [];

      await saveInBlockchain();
      return;
    });
}

async function saveInBlockchain() {
  let gtmModules;
  try {
    gtmModules = await securityToken.methods.getModulesByName(web3.utils.toHex('USDTieredSTO')).call();
  } catch (e) {
    console.log("Please attach USDTieredSTO module before launch this action.", e)
    process.exit(0)
  }

  if (!gtmModules.length) {
    console.log("Please attach USDTieredSTO module before launch this action.")
    process.exit(0)
  }

  let usdTieredSTO = new web3.eth.Contract(abis.usdTieredSTO(), gtmModules[0]);

  console.log(`
    --------------------------------------------------------------
    ----- Sending non accredited limit changes to blockchain -----
    --------------------------------------------------------------
  `);

  for (let i = 0; i < distribData.length; i++) {
    try {

      // Splitting the user arrays to be organized by input
      for (let i = 0; i < distribData.length; i++) {
        try {
          let investorArray = [], limitArray = [];
    
          for (let j = 0; j < distribData[i].length; j++) {
            investorArray.push(distribData[i][j][0]);
            limitArray.push(web3.utils.toWei(distribData[i][j][1].toString()));
          }

          let changeNonAccreditedLimitAction = usdTieredSTO.methods.changeNonAccreditedLimit(investorArray, limitArray);
          let tx = await common.sendTransaction(changeNonAccreditedLimitAction);
          console.log(`Batch ${i} - Attempting to change non accredited limits to accounts:\n\n`, investorArray, "\n\n");
          console.log("---------- ---------- ---------- ---------- ---------- ---------- ---------- ----------");
          console.log("Change accredited transaction was successful.", tx.gasUsed, "gas used. Spent:", web3.utils.fromWei(BigNumber(tx.gasUsed * defaultGasPrice).toString()), "Ether");
          console.log("---------- ---------- ---------- ---------- ---------- ---------- ---------- ----------\n\n");
    
        } catch (err) {
          console.log("ERROR:", err);
        }
      }

    } catch (err) {
      console.log("ERROR", err)
      process.exit(0)
    }
  }

  return;
}

function nonAccredited_processing(csv_line) {
  let isAddress = web3.utils.isAddress(csv_line[0]);
  let isNumber = !isNaN(csv_line[1]);

  if (isAddress && isNumber) {

    return [true, new Array(web3.utils.toChecksumAddress(csv_line[0]), csv_line[1])]

  } else {

    return [false, new Array(csv_line[0], csv_line[1])]
  
  }
}

module.exports = {
  executeApp: async (tokenSymbol, batchSize) => {
    return startScript(tokenSymbol, batchSize);
  }
}