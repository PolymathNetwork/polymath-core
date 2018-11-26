var common = require('./common/common_functions');
var csv_shared = require('./common/csv_shared');
var abis = require('./helpers/contract_abis');
var BigNumber = require('bignumber.js');

let distribData = new Array();
let fullFileData = new Array();
let badData = new Array();

let securityToken;
let generalTransferManager;

async function startScript(tokenSymbol, batchSize) {
  securityToken = await csv_shared.start(tokenSymbol, batchSize);

  let result_processing = await csv_shared.read('./CLI/data/whitelist_data.csv', whitelist_processing);
  distribData = result_processing.distribData;
  fullFileData = result_processing.fullFileData;
  badData = result_processing.badData;

  await saveInBlockchain();
  await finalResults();
};

function whitelist_processing(csv_line) {
  let isAddress = web3.utils.isAddress(csv_line[0]);
  let sellValid = isValidDate(csv_line[1])
  let buyValid = isValidDate(csv_line[2])
  let kycExpiryDate = isValidDate(csv_line[3])
  let canBuyFromSTO = (typeof JSON.parse(csv_line[4].toLowerCase())) == "boolean" ? JSON.parse(csv_line[4].toLowerCase()) : "not-valid";

  if (isAddress &&
      sellValid &&
      buyValid &&
      kycExpiryDate &&
      (canBuyFromSTO != "not-valid")) {
    return [true, new Array(web3.utils.toChecksumAddress(csv_line[0]), sellValid, buyValid, kycExpiryDate, canBuyFromSTO)]
  } else {
    return [false, new Array(csv_line[0], sellValid, buyValid, kycExpiryDate, canBuyFromSTO)]
  }
}

function isValidDate(date) {
  var matches = /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/.exec(date);
  if (matches == null) return false;
  var d = matches[2];
  var m = matches[1] - 1;
  var y = matches[3];
  var composedDate = new Date(y, m, d);
  var timestampDate = composedDate.getTime()

  // For some reason these timestamps are being recorded +4 hours UTC
  if (composedDate.getDate() == d &&
      composedDate.getMonth() == m &&
      composedDate.getFullYear() == y) {
    return timestampDate / 1000
  } else {
    return false
  }
}

async function saveInBlockchain() {
  let gtmModules;
  try {
    gtmModules = await securityToken.methods.getModulesByName(web3.utils.toHex('GeneralTransferManager')).call();
  } catch (e) {
    console.log("Please attach General Transfer module before launch this action.", e)
    process.exit(0)
  }

  generalTransferManager = new web3.eth.Contract(abis.generalTransferManager(), gtmModules[0]);

  console.log(`
    -------------------------------------------------------
    ----- Sending buy/sell restrictions to blockchain -----
    -------------------------------------------------------
  `);

  for (let i = 0; i < distribData.length; i++) {
    try {
      let investorArray = [], fromTimesArray = [], toTimesArray = [], expiryTimeArray = [], canBuyFromSTOArray = [];

      // Splitting the user arrays to be organized by input
      for (let j = 0; j < distribData[i].length; j++) {
        investorArray.push(distribData[i][j][0])
        fromTimesArray.push(distribData[i][j][1])
        toTimesArray.push(distribData[i][j][2])
        expiryTimeArray.push(distribData[i][j][3])
        canBuyFromSTOArray.push(distribData[i][j][4])
      }

      let modifyWhitelistMultiAction = await generalTransferManager.methods.modifyWhitelistMulti(investorArray, fromTimesArray, toTimesArray, expiryTimeArray, canBuyFromSTOArray);
      let tx = await common.sendTransaction(modifyWhitelistMultiAction);
      console.log(`Batch ${i} - Attempting to modifyWhitelist accounts:\n\n`, investorArray, "\n\n");
      console.log("---------- ---------- ---------- ---------- ---------- ---------- ---------- ----------");
      console.log("Whitelist transaxction was successful.", tx.gasUsed, "gas used. Spent:", web3.utils.fromWei(BigNumber(tx.gasUsed * defaultGasPrice).toString(), "ether"), "Ether");
      console.log("---------- ---------- ---------- ---------- ---------- ---------- ---------- ----------\n\n");

    } catch (err) {
      console.log("ERROR", err)
      process.exit(0)
    }
  }

  return;
}

async function finalResults() {
  let totalInvestors = 0;
  let updatedInvestors = 0;
  let investorObjectLookup = {};
  let investorData_Events = new Array();
  let event_data = await generalTransferManager.getPastEvents('ModifyWhitelist', {fromBlock: 0, toBlock: 'latest'}, () => {});

  for (var i = 0; i < event_data.length; i++) {
    let combineArray = [];

    let investorAddress_Event = event_data[i].returnValues._investor
    let fromTime_Event = event_data[i].returnValues._fromTime
    let toTime_Event = event_data[i].returnValues._toTime
    let expiryTime_Event = event_data[i].returnValues._expiryTime
    let canBuyFromSTO_Event = event_data[i].returnValues._canBuyFromSTO
    let blockNumber = event_data[i].blockNumber

    combineArray.push(investorAddress_Event);
    combineArray.push(fromTime_Event);
    combineArray.push(toTime_Event);
    combineArray.push(expiryTime_Event);
    combineArray.push(canBuyFromSTO_Event);
    combineArray.push(blockNumber)

    investorData_Events.push(combineArray)

    // We have already recorded it, so this is an update to our object
    if (investorObjectLookup.hasOwnProperty(investorAddress_Event)) {
      // The block number form the event we are checking is bigger, so we gotta replace it
      if (investorObjectLookup[investorAddress_Event].recordedBlockNumber < blockNumber) {
        investorObjectLookup[investorAddress_Event] = {fromTime: fromTime_Event, toTime: toTime_Event, expiryTime: expiryTime_Event, canBuyFromSTO: canBuyFromSTO_Event, recordedBlockNumber: blockNumber};
        updatedInvestors += 1;
      }
    } else {
      investorObjectLookup[investorAddress_Event] = {fromTime: fromTime_Event, toTime: toTime_Event, expiryTime: expiryTime_Event, canBuyFromSTO: canBuyFromSTO_Event, recordedBlockNumber: blockNumber};
      totalInvestors += 1;
    }
  }

  let investorAddress_Events = Object.keys(investorObjectLookup)

  console.log(`******************** EVENT LOGS ANALYSIS COMPLETE ********************\n`);
  console.log(`A total of ${totalInvestors} investors have been whitelisted total, all time.\n`);
  console.log(`This script in total sent ${fullFileData.length - badData.length} new investors and updated investors to the blockchain.\n`);
  console.log(`There were ${badData.length} bad entries that didnt get sent to the blockchain in the script.\n`);
  console.log("************************************************************************************************");
  console.log("OBJECT WITH EVERY USER AND THEIR UPDATED TIMES: \n\n", investorObjectLookup)
  console.log("************************************************************************************************");
  console.log("LIST OF ALL INVESTORS WHITELISTED: \n\n", investorAddress_Events)

  let missingDistribs = [];
  for (let l = 0; l < fullFileData.length; l++) {
    if (!investorObjectLookup.hasOwnProperty(fullFileData[l][0])) {
      missingDistribs.push(fullFileData[l])
    }
  }

  if (missingDistribs.length > 0) {
    console.log("************************************************************************************************");
    console.log("-- No LogModifyWhitelist event was found for the following data arrays. Please review them manually --")
    console.log(missingDistribs)
    console.log("************************************************************************************************");
  } else {
    console.log("\n************************************************************************************************");
    console.log("All accounts passed through from the CSV were successfully whitelisted, because we were able to read them all from events")
    console.log("************************************************************************************************");
  }

}

module.exports = {
  executeApp: async (tokenSymbol, batchSize) => {
    return startScript(tokenSymbol, batchSize);
  }
}