var common = require('./common/common_functions');
var csv_shared = require('./common/csv_shared');
var abis = require('./helpers/contract_abis');
var BigNumber = require('bignumber.js');

let distribData = new Array();
let fullFileData = new Array();
let badData = new Array();
let affiliatesFailedArray = new Array();
let affiliatesKYCInvalidArray = new Array();

let securityToken;
let tokenDivisible;

async function startScript(tokenSymbol, batchSize) {
  securityToken = await csv_shared.start(tokenSymbol, batchSize);

  let result_processing = await csv_shared.read('./CLI/data/multi_mint_data.csv', multimint_processing);
  distribData = result_processing.distribData;
  fullFileData = result_processing.fullFileData;
  badData = result_processing.badData;

  tokenDivisible = await securityToken.methods.granularity().call() == 1;
  
  await saveInBlockchain();
  await finalResults();
}

function multimint_processing(csv_line) {
  let isAddress = web3.utils.isAddress(csv_line[0]);
  let validToken = isValidToken(csv_line[1]);

  if (isAddress &&
      validToken) {
    return [true, new Array(web3.utils.toChecksumAddress(csv_line[0]), validToken)]
  } else {
    return [false, new Array(csv_line[0], csv_line[1])]
  }
}

function isValidToken(token) {
  var tokenAmount = parseFloat(token);
  if (tokenDivisible) {
    return tokenAmount
  } else {
    if ((tokenAmount % 1 == 0)) {
      return tokenAmount;
    }
    return false
  }
}

async function saveInBlockchain() {
  let gtmModules = await securityToken.methods.getModulesByType(3).call();

  if (gtmModules.length > 0) {
    console.log("Minting of tokens is only allowed before the STO get attached");
    process.exit(0);
  }

  console.log(`
    -----------------------------------------
    ----- Mint the tokens to affiliates -----
    -----------------------------------------
  `);

  for (let i = 0; i < distribData.length; i++) {
    try {
      let affiliatesVerifiedArray = [], tokensVerifiedArray = [];

      // Splitting the user arrays to be organized by input
      for (let j = 0; j < distribData[i].length; j++) {
        let investorAccount = distribData[i][j][0];
        let tokenAmount = web3.utils.toWei((distribData[i][j][1]).toString(), "ether");
        let verifiedTransaction = await securityToken.methods.verifyTransfer("0x0000000000000000000000000000000000000000", investorAccount, tokenAmount, web3.utils.fromAscii('')).call();
        if (verifiedTransaction) {
          affiliatesVerifiedArray.push(investorAccount);
          tokensVerifiedArray.push(tokenAmount);
        } else {
          let gtmModule = await securityToken.methods.getModulesByName(web3.utils.toHex('GeneralTransferManager')).call();
          let generalTransferManager = new web3.eth.Contract(abis.generalTransferManager(), gtmModule[0]);
          let validKYC = (await generalTransferManager.methods.whitelist(Issuer.address).call()).expiryTime > Math.floor(Date.now()/1000);
          if (validKYC) {
            affiliatesFailedArray.push(investorAccount);
          } else {
            affiliatesKYCInvalidArray.push(investorAccount);
          }
        }
      }

      let mintMultiAction = await securityToken.methods.mintMulti(affiliatesVerifiedArray, tokensVerifiedArray);
      let tx = await common.sendTransaction(mintMultiAction);
      console.log(`Batch ${i} - Attempting to send the Minted tokens to affiliates accounts:\n\n`, affiliatesVerifiedArray, "\n\n");
      console.log("---------- ---------- ---------- ---------- ---------- ---------- ---------- ----------");
      console.log("Multi Mint transaction was successful.", tx.gasUsed, "gas used. Spent:", web3.utils.fromWei(BigNumber(tx.gasUsed * defaultGasPrice).toString(), "ether"), "Ether");
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

  let event_data = await securityToken.getPastEvents('Minted', {fromBlock: 0, toBlock: 'latest'}, () => {});

  for (var i = 0; i < event_data.length; i++) {
    let combineArray = [];

    let investorAddress_Event = event_data[i].returnValues._to;
    let amount_Event = event_data[i].returnValues._value;
    let blockNumber = event_data[i].blockNumber;

    combineArray.push(investorAddress_Event);
    combineArray.push(amount_Event);
    combineArray.push(blockNumber);

    investorData_Events.push(combineArray)

    // We have already recorded it, so this is an update to our object
    if (investorObjectLookup.hasOwnProperty(investorAddress_Event)) {
      // The block number form the event we are checking is bigger, so we gotta replace it
      if (investorObjectLookup[investorAddress_Event].recordedBlockNumber < blockNumber) {
        investorObjectLookup[investorAddress_Event] = {amount: amount_Event, recordedBlockNumber: blockNumber};
        updatedInvestors += 1;
      }
    } else {
      investorObjectLookup[investorAddress_Event] = {amount: amount_Event, recordedBlockNumber: blockNumber};
      totalInvestors += 1;
    }
  }

  let investorAddress_Events = Object.keys(investorObjectLookup)

  console.log(`******************** EVENT LOGS ANALYSIS COMPLETE ********************\n`);
  console.log(`A total of ${totalInvestors} affiliated investors get the token\n`);
  console.log(`This script in total sent ${fullFileData.length - badData.length - affiliatesFailedArray.length - affiliatesKYCInvalidArray.length} new investors and updated investors to the blockchain.\n`);
  console.log(`There were ${badData.length} bad entries that didnt get sent to the blockchain in the script.\n`);
  console.log(`There were ${affiliatesKYCInvalidArray.length} accounts with invalid KYC.\n`);
  console.log(`There were ${affiliatesFailedArray.length} accounts that didn't get sent to the blockchain as they would fail.\n`);
  console.log("************************************************************************************************");
  console.log("OBJECT WITH EVERY USER AND THEIR MINTED TOKEN: \n\n", investorObjectLookup)
  console.log("************************************************************************************************");
  console.log("LIST OF ALL INVESTORS WHO GOT THE MINTED TOKENS: \n\n", investorAddress_Events)

  let missingDistribs = [], failedVerificationDistribs = [], invalidKYCDistribs = [];
  for (let l = 0; l < fullFileData.length; l++) {
    if (affiliatesKYCInvalidArray.includes(fullFileData[l][0])) {
      invalidKYCDistribs.push(fullFileData[l]);
    } else if (affiliatesFailedArray.includes(fullFileData[l][0])) {
      failedVerificationDistribs.push(fullFileData[l]);
    } else if (!investorObjectLookup.hasOwnProperty(fullFileData[l][0])) {
      missingDistribs.push(fullFileData[l]);
    }
  }

  if (invalidKYCDistribs.length > 0) {
    console.log("**************************************************************************************************************************");
    console.log("The following data arrays have an invalid KYC. Please review if these accounts are whitelisted and their KYC is not expired\n");
    console.log(invalidKYCDistribs);
    console.log("**************************************************************************************************************************");
  }
  if (failedVerificationDistribs.length > 0) {
    console.log("*********************************************************************************************************");
    console.log("-- The following data arrays failed at verifyTransfer. Please review if these accounts are whitelisted --\n");
    console.log(failedVerificationDistribs);
    console.log("*********************************************************************************************************");
  }
  if (missingDistribs.length > 0) {
    console.log("******************************************************************************************");
    console.log("-- No Minted event was found for the following data arrays. Please review them manually --\n");
    console.log(missingDistribs);
    console.log("******************************************************************************************");
  }
  if (missingDistribs.length == 0 &&
      failedVerificationDistribs.length == 0 &&
      invalidKYCDistribs.length == 0) {
    console.log("\n**************************************************************************************************************************");
    console.log("All accounts passed through from the CSV were successfully get the tokens, because we were able to read them all from events");
    console.log("****************************************************************************************************************************");
  }

}

module.exports = {
  executeApp: async (tokenSymbol, batchSize) => {
    return startScript(tokenSymbol, batchSize);
  }
}