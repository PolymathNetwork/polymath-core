var common = require('./common/common_functions');
var csv_shared = require('./common/csv_shared');
var abis = require('./helpers/contract_abis');
var BigNumber = require('bignumber.js');

let distribData = new Array();
let fullFileData = new Array();
let badData = new Array();

let securityToken;

async function startScript(tokenSymbol, batchSize) {
  securityToken = await csv_shared.start(tokenSymbol, batchSize);

  let result_processing = await csv_shared.read('./CLI/data/nonAccreditedLimits_data.csv', nonAccredited_processing);
  distribData = result_processing.distribData;
  fullFileData = result_processing.fullFileData;
  badData = result_processing.badData;
  
  await saveInBlockchain();
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

          let changeNonAccreditedLimitAction = await usdTieredSTO.methods.changeNonAccreditedLimit(investorArray, limitArray);
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

module.exports = {
  executeApp: async (tokenSymbol, batchSize) => {
    return startScript(tokenSymbol, batchSize);
  }
}