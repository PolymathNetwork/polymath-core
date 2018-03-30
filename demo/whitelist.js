var fs = require('fs');
var csv = require('fast-csv');
// var BigNumber = require('bignumber.js');
const Web3 = require('web3');


/////////////////////////////ARTIFACTS//////////////////////////////////////////
let _GANACHE_CONTRACTS = true;
let tickerRegistryAddress;
let securityTokenRegistryAddress;
let cappedSTOFactoryAddress;
let generalTransferManagerAddress;


if (_GANACHE_CONTRACTS) {
  tickerRegistryAddress = '0xaa588d3737b611bafd7bd713445b314bd453a5c8';
  securityTokenRegistryAddress = '0xf204a4ef082f5c04bb89f7d5e6568b796096735a';
  cappedSTOFactoryAddress = '0xdda6327139485221633a1fcd65f4ac932e60a2e1';
} else {
  tickerRegistryAddress = "0xfc2a00bb5b7e3b0b310ffb6de4fd1ea3835c9b27";
  securityTokenRegistryAddress = "0x6958fca8a4cd4418a5cf9ae892d1a488e8af518f";
  cappedSTOFactoryAddress = "0x128674eeb1c26d59a27ec58e9a76142e55bade2d";
}

let tickerRegistryABI;
let securityTokenRegistryABI;
let securityTokenABI;
let cappedSTOABI;
let generalTransferManagerABI;
try {
  tickerRegistryABI = JSON.parse(require('fs').readFileSync('./build/contracts/TickerRegistry.json').toString()).abi;
  securityTokenRegistryABI = JSON.parse(require('fs').readFileSync('./build/contracts/SecurityTokenRegistry.json').toString()).abi;
  securityTokenABI = JSON.parse(require('fs').readFileSync('./build/contracts/SecurityToken.json').toString()).abi;
  cappedSTOABI = JSON.parse(require('fs').readFileSync('./build/contracts/CappedSTO.json').toString()).abi;
  generalTransferManagerABI = JSON.parse(require('fs').readFileSync('./build/contracts/GeneralTransferManager.json').toString()).abi;
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
let badData = new Array();

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

let Issuer;
let accounts;
let generalTransferManager;



//////////////////////////////////////////ENTRY INTO SCRIPT//////////////////////////////////////////
startScript();

async function startScript() {
  try {
    tickerRegistry = new web3.eth.Contract(tickerRegistryABI, tickerRegistryAddress);
    tickerRegistry.setProvider(web3.currentProvider);
    securityTokenRegistry = new web3.eth.Contract(securityTokenRegistryABI, securityTokenRegistryAddress);
    securityTokenRegistry.setProvider(web3.currentProvider);
    console.log("Processing investor CSV upload. Batch size is accounts per transaction");
    readFile();
  } catch (err) {
    console.log(err)
    console.log('\x1b[31m%s\x1b[0m', "There was a problem getting the contracts. Make sure they are deployed to the selected network.");
    return;
  }
}

///////////////////////////FUNCTION READING THE CSV FILE
function readFile() {
  var stream = fs.createReadStream("./demo/whitelist_data.csv");

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
      let isAddress = web3.utils.isAddress(data[1]);
      let sellValid = isValidDayInput(data[2])
      let buyValid = isValidDayInput(data[3])


      if (isAddress && sellValid && buyValid) {
        let userArray = new Array()
        let checksummedAddress = web3.utils.toChecksumAddress(data[1]);

        userArray.push(checksummedAddress)
        userArray.push(sellValid)
        userArray.push(buyValid)
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
        userArray.push(data[1])
        userArray.push(sellValid)
        userArray.push(buyValid)
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
  accounts = await web3.eth.getAccounts();
  Issuer = accounts[0]

  let tokenDeployed = false;
  let tokenDeployedAddress;
  // Let's check if token has already been deployed, if it has, skip to STO
  await securityTokenRegistry.methods.getSecurityTokenAddress(tokenSymbol).call({ from: Issuer }, function (error, result) {
    if (result != "0x0000000000000000000000000000000000000000") {
      console.log('\x1b[32m%s\x1b[0m', "Token has already been deployed at address " + result + ". Skipping registration");
      tokenDeployedAddress = result;
      tokenDeployed = true;
    }
  });
  if (tokenDeployed) {
    securityToken = new web3.eth.Contract(securityTokenABI, tokenDeployedAddress);
  }
  await securityToken.methods.getModule(2, 0).call({ from: Issuer }, function (error, result) {
    generalTransferManagerAddress = result[1];
  });
  let generalTransferManager = new web3.eth.Contract(generalTransferManagerABI, generalTransferManagerAddress);

  console.log('gtmAddress: ', generalTransferManagerAddress)
  console.log('batchSize: ', BATCH_SIZE)

  console.log(`
    -------------------------------------------------------
    ----- Sending buy/sell restrictions to blockchain -----
    -------------------------------------------------------
  `);

  //this for loop will do the batches, so it should run 75, 75, 50 with 200
  for (let i = 0; i < distribData.length; i++) {
    try {
      let gPrice = 10000000000;
      let investorArray = [];
      let fromTimesArray = [];
      let toTimesArray = [];

      //splitting the user arrays to be organized by input
      for (let j = 0; j < distribData[i].length; j++) {
        investorArray.push(distribData[i][j][0])
        fromTimesArray.push(distribData[i][j][1])
        toTimesArray.push(distribData[i][j][2])
      }

      //fromTimes is ability to sell coin FROM your account (2nd row in csv, 2nd parameter in modifyWhiteList() )
      //toTimes is ability to buy coins TOwards your account (3rd row in csv, 3rd parameter in modifyWhiteList() )
      let r = await generalTransferManager.methods.modifyWhitelistMulti(investorArray, fromTimesArray, toTimesArray).send({ from: Issuer, gas: 4500000, gasPrice: gPrice })
      console.log(`Batch ${i} - Attempting to modifyWhitelist accounts:\n\n`, investorArray, "\n\n");
      console.log("---------- ---------- ---------- ---------- ---------- ---------- ---------- ----------");
      console.log("Allocation + transfer was successful.", r.gasUsed, "gas used. Spent:", r.gasUsed * gPrice, "wei");
      console.log("---------- ---------- ---------- ---------- ---------- ---------- ---------- ----------\n\n");

    } catch (err) {
      console.log("ERROR:", err);
    }
  }

  console.log("Script finished successfully.")
  // console.log("Waiting 2 minutes for transactions to be mined...")
  // await delay(90000);
  console.log("When live, use a delay of 2 mins to let blocks be mined. On Testrpc, this can be skipped")
  console.log("Retrieving logs to determine investors have had their times uploaded correctly.\n\n")

  let totalInvestors = 0;
  let updatedInvestors = 0;

  let investorData_Events = new Array();
  let investorObjectLookup = {};


  // var events = await generalTransferManager.LogModifyWhitelist({ from: Issuer }, { fromBlock: 0, toBlock: 'latest' });
  let event_data = await generalTransferManager.getPastEvents('LogModifyWhitelist', {
    fromBlock: 0,
    toBlock: 'latest'
  }, function (error, events) {
    console.log("Error wtf dont need: ", error)
  });
  // console.log("EVENTS NEW: ", events)

  for (var i = 0; i < event_data.length; i++) {
    let combineArray = [];

    let investorAddress_Event = event_data[i].returnValues._investor;
    let fromTime_Event = event_data[i].returnValues._fromTime
    let toTime_Event = event_data[i].returnValues._toTime
    let blockNumber = event_data[i].blockNumber

    combineArray.push(investorAddress_Event);
    combineArray.push(fromTime_Event);
    combineArray.push(toTime_Event);
    combineArray.push(blockNumber)

    investorData_Events.push(combineArray)

    //we have already recorded it, so this is an update to our object
    if (investorObjectLookup.hasOwnProperty(investorAddress_Event)) {

      //the block number form the event we are checking is bigger, so we gotta replace it
      if (investorObjectLookup[investorAddress_Event].recordedBlockNumber < blockNumber) {
        investorObjectLookup[investorAddress_Event] = { fromTime: fromTime_Event, toTime: toTime_Event, recordedBlockNumber: blockNumber };
        updatedInvestors += 1;
        // investorAddress_Events.push(investorAddress_Event); not needed, because we start the obj with zero events

      } else {
        //do nothing. so if we find an event, and it was an older block, its old, we dont care
      }
      //we have never recorded this address as an object key, so we need to add it to our list of investors updated by the csv
    } else {
      investorObjectLookup[investorAddress_Event] = { fromTime: fromTime_Event, toTime: toTime_Event, recordedBlockNumber: blockNumber };
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