var fs = require('fs');
var csv = require('fast-csv');
var BigNumber = require('bignumber.js');
var common = require('./common/common_functions');
var global = require('./common/global');

/////////////////////////////ARTIFACTS//////////////////////////////////////////
var contracts = require('./helpers/contract_addresses');
var abis = require('./helpers/contract_abis');

////////////////////////////USER INPUTS//////////////////////////////////////////
let tokenSymbol = process.argv.slice(2)[0]; //token symbol
let BATCH_SIZE = process.argv.slice(2)[1]; //batch size
if (!BATCH_SIZE) BATCH_SIZE = 70;
let remoteNetwork = process.argv.slice(2)[2];

/////////////////////////GLOBAL VARS//////////////////////////////////////////

//distribData is an array of batches. i.e. if there are 200 entries, with batch sizes of 75, we get [[75],[75],[50]]
let distribData = new Array();
//allocData is a temporary array that stores up to the batch size,
//then gets push into distribData, then gets set to 0 to start another batch
let allocData = new Array();
//full file data is a single array that contains all arrays. i.e. if there are 200 entries we get [[200]]
let fullFileData = new Array();
let badData = new Array();

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

//////////////////////////////////////////ENTRY INTO SCRIPT//////////////////////////////////////////

startScript();

async function startScript() {
  await global.initialize(remoteNetwork);

  try {
    let tickerRegistryAddress = await contracts.tickerRegistry();
    let tickerRegistryABI = abis.tickerRegistry();
    tickerRegistry = new web3.eth.Contract(tickerRegistryABI, tickerRegistryAddress);
    tickerRegistry.setProvider(web3.currentProvider);
    
    let securityTokenRegistryAddress = await contracts.securityTokenRegistry();
    let securityTokenRegistryABI = abis.securityTokenRegistry();
    securityTokenRegistry = new web3.eth.Contract(securityTokenRegistryABI, securityTokenRegistryAddress);
    securityTokenRegistry.setProvider(web3.currentProvider);
    
    console.log("Processing investor CSV upload. Batch size is "+BATCH_SIZE+" accounts per transaction");
    readFile();
  } catch (err) {
    console.log(err)
    console.log('\x1b[31m%s\x1b[0m', "There was a problem getting the contracts. Make sure they are deployed to the selected network.");
    return;
  }
}

///////////////////////////FUNCTION READING THE CSV FILE
function readFile() {
  var stream = fs.createReadStream("./CLI/data/whitelist_data.csv");

  let index = 0;
  let batch = 0;
  console.log(`
    --------------------------------------------
    ----------- Parsing the csv file -----------
    --------------------------------------------
  `);

  var csvStream = csv()
    .on("data", function (data) {
      // console.log(data[1])
      // console.log(data[2])
      // console.log(data[3])
      let isAddress = web3.utils.isAddress(data[0]);
      let sellValid = isValidDate(data[1])
      let buyValid = isValidDate(data[2])
      let kycExpiryDate = isValidDate(data[3])
      let canBuyFromSTO = (typeof JSON.parse(data[4].toLowerCase())) == "boolean" ? JSON.parse(data[4].toLowerCase()) : "not-valid";

      if (isAddress && sellValid && buyValid && kycExpiryDate && (canBuyFromSTO != "not-valid") ) {
        let userArray = new Array()
        let checksummedAddress = web3.utils.toChecksumAddress(data[0]);

        userArray.push(checksummedAddress)
        userArray.push(sellValid)
        userArray.push(buyValid)
        userArray.push(kycExpiryDate)
        userArray.push(canBuyFromSTO)
        // console.log(userArray)
        allocData.push(userArray);
        fullFileData.push(userArray);
        index++;
        if (index >= BATCH_SIZE) {
          distribData.push(allocData);
          // console.log("DIS", distribData);
          allocData = [];
          // console.log("ALLOC", allocData);
          index = 0;
        }

      } else {
        let userArray = new Array()
        //dont need this here, as if it is NOT an address this function will fail
        //let checksummedAddress = web3.utils.toChecksumAddress(data[1]);
        userArray.push(data[0])
        userArray.push(sellValid)
        userArray.push(buyValid)
        userArray.push(kycExpiryDate);
        userArray.push(canBuyFromSTO);
        badData.push(userArray);
        fullFileData.push(userArray)
      }
    })
    .on("end", function () {
      //Add last remainder batch
      distribData.push(allocData);
      allocData = [];

      setInvestors();
    });

  stream.pipe(csvStream);
}

////////////////////////MAIN FUNCTION COMMUNICATING TO BLOCKCHAIN
async function setInvestors() {
  let tokenDeployed = false;
  let tokenDeployedAddress;
  // Let's check if token has already been deployed, if it has, skip to STO
  await securityTokenRegistry.methods.getSecurityTokenAddress(tokenSymbol).call({}, function (error, result) {
    if (result != "0x0000000000000000000000000000000000000000") {
      console.log('\x1b[32m%s\x1b[0m', "Token deployed at address " + result + ".");
      tokenDeployedAddress = result;
      tokenDeployed = true;
    }
  });
  if (tokenDeployed) {
    let securityTokenABI = abis.securityToken();
    securityToken = new web3.eth.Contract(securityTokenABI, tokenDeployedAddress);
  }
  await securityToken.methods.getModule(2, 0).call({}, function (error, result) {
    generalTransferManagerAddress = result[1];
  });
  let generalTransferManagerABI = abis.generalTransferManager();
  let generalTransferManager = new web3.eth.Contract(generalTransferManagerABI, generalTransferManagerAddress);

  console.log(`
    -------------------------------------------------------
    ----- Sending buy/sell restrictions to blockchain -----
    -------------------------------------------------------
  `);

  //this for loop will do the batches, so it should run 75, 75, 50 with 200
  for (let i = 0; i < distribData.length; i++) {
    try {
      let investorArray = [];
      let fromTimesArray = [];
      let toTimesArray = [];
      let expiryTimeArray = [];
      let canBuyFromSTOArray = [];

      //splitting the user arrays to be organized by input
      for (let j = 0; j < distribData[i].length; j++) {
        investorArray.push(distribData[i][j][0])
        fromTimesArray.push(distribData[i][j][1])
        toTimesArray.push(distribData[i][j][2])
        expiryTimeArray.push(distribData[i][j][3])
        canBuyFromSTOArray.push(distribData[i][j][4])
      }

      //fromTimes is ability to sell coin FROM your account (2nd row in csv, 2nd parameter in modifyWhiteList() )
      //toTimes is ability to buy coins TOwards your account (3rd row in csv, 3rd parameter in modifyWhiteList() )
      //expiryTime is time at which KYC of investor get expired (4th row in csv, 4rd parameter in modifyWhiteList() )
      let modifyWhitelistMultiAction = generalTransferManager.methods.modifyWhitelistMulti(investorArray, fromTimesArray, toTimesArray, expiryTimeArray, canBuyFromSTOArray);
      let r = await common.sendTransaction(Issuer, modifyWhitelistMultiAction, defaultGasPrice);
      console.log(`Batch ${i} - Attempting to modifyWhitelist accounts:\n\n`, investorArray, "\n\n");
      console.log("---------- ---------- ---------- ---------- ---------- ---------- ---------- ----------");
      console.log("Whitelist transaxction was successful.", r.gasUsed, "gas used. Spent:", web3.utils.fromWei(BigNumber(r.gasUsed * defaultGasPrice).toString(), "ether"), "Ether");
      console.log("---------- ---------- ---------- ---------- ---------- ---------- ---------- ----------\n\n");

    } catch (err) {
      console.log("ERROR:", err);
    }
  }

  console.log("Retrieving logs to determine investors have had their times uploaded correctly.\n\n")

  let totalInvestors = 0;
  let updatedInvestors = 0;

  let investorData_Events = new Array();
  let investorObjectLookup = {};

  let event_data = await generalTransferManager.getPastEvents('LogModifyWhitelist', {
    fromBlock: 0,
    toBlock: 'latest'
  }, function (error, events) {
    //console.log(error);
  });

  for (var i = 0; i < event_data.length; i++) {
    let combineArray = [];

    let investorAddress_Event = event_data[i].returnValues._investor;
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

    //we have already recorded it, so this is an update to our object
    if (investorObjectLookup.hasOwnProperty(investorAddress_Event)) {

      //the block number form the event we are checking is bigger, so we gotta replace it
      if (investorObjectLookup[investorAddress_Event].recordedBlockNumber < blockNumber) {
        investorObjectLookup[investorAddress_Event] = { fromTime: fromTime_Event, toTime: toTime_Event, expiryTime: expiryTime_Event, canBuyFromSTO: canBuyFromSTO_Event, recordedBlockNumber: blockNumber };
        updatedInvestors += 1;
        // investorAddress_Events.push(investorAddress_Event); not needed, because we start the obj with zero events

      } else {
        //do nothing. so if we find an event, and it was an older block, its old, we dont care
      }
      //we have never recorded this address as an object key, so we need to add it to our list of investors updated by the csv
    } else {
      investorObjectLookup[investorAddress_Event] = { fromTime: fromTime_Event, toTime: toTime_Event, expiryTime: expiryTime_Event, canBuyFromSTO: canBuyFromSTO_Event, recordedBlockNumber: blockNumber };
      totalInvestors += 1;
      // investorAddress_Events.push(investorAddress_Event);
    }
  }
  let investorAddress_Events = Object.keys(investorObjectLookup)

  console.log(`******************** EVENT LOGS ANALYSIS COMPLETE ********************\n`);
  console.log(`A total of ${totalInvestors} investors have been whitelisted total, all time.\n`);
  console.log(`This script in total sent ${fullFileData.length - badData.length} new investors and updated investors to the blockchain.\n`);
  console.log(`There were ${badData.length} bad entries that didnt get sent to the blockchain in the script.\n`);

  // console.log("LIST OF ALL INVESTOR DATA FROM EVENTS:", investorData_Events)
  // console.log(fullFileData)
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
    // for (var i = 0; i < missingDistribs.length; i++) {
    //   console.log('\x1b[31m%s\x1b[0m', `No Transfer event was found for account ${missingDistribs[i]}`);
    // }
    console.log("************************************************************************************************");
  } else {
    console.log("\n************************************************************************************************");
    console.log("All accounts passed through from the CSV were successfully whitelisted, because we were able to read them all from events")
    console.log("************************************************************************************************");
  }
  // console.log(`Run 'node scripts/verify_airdrop.js ${polyDistribution.address} > scripts/data/review.csv' to get a log of all the accounts that were distributed the airdrop tokens.`)
}

//will be deleted once DATES are updated
function isValidDayInput(days) {
  let today = Date.now() / 1000
  let isValid = !isNaN(days)
  if (isValid) {
    let addedSeconds = days * 86400

    let unixTimestamp = today + addedSeconds
    console.log("unxitimestapm :" , (unixTimestamp))

    return unixTimestamp
  } else {
    return false
  }
}

function isValidDate(date) {
  var matches = /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/.exec(date);
  if (matches == null) return false;
  var d = matches[2];
  var m = matches[1] - 1; //not clear why this is -1, but it works after checking
  var y = matches[3];
  var composedDate = new Date(y, m, d);
  var timestampDate = composedDate.getTime()

  //note, some reason these timestamps are being recorded +4 hours UTC
  if (composedDate.getDate() == d && composedDate.getMonth() == m && composedDate.getFullYear() == y) {
    return timestampDate / 1000
  } else {
    return false
  }
}
