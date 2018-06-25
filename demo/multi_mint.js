var fs = require('fs');
var csv = require('fast-csv');
var BigNumber = require('bignumber.js');
const Web3 = require('web3');
const chalk = require('chalk');


/////////////////////////////ARTIFACTS//////////////////////////////////////////
var contracts = require("./helpers/contract_addresses");
let tickerRegistryAddress = contracts.tickerRegistryAddress();
let securityTokenRegistryAddress = contracts.securityTokenRegistryAddress();
let cappedSTOFactoryAddress = contracts.cappedSTOFactoryAddress();

let CALLED_BY = "";
let symbol;
let tickerRegistryABI;
let securityTokenRegistryABI;
let securityTokenABI;
let cappedSTOABI;
let generalTransferManagerABI;
let securityToken;
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


let DEFAULT_GAS_PRICE = 10000000000;



//////////////////////////////////////////ENTRY INTO SCRIPT//////////////////////////////////////////

startScript();

async function startScript() {
  try {
    tickerRegistry = new web3.eth.Contract(tickerRegistryABI, tickerRegistryAddress);
    tickerRegistry.setProvider(web3.currentProvider);
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

function readFile() {
    var stream = fs.createReadStream("./demo/multi_mint_data.csv");

    let index = 0;
    let batch = 0;
    console.log(`
      --------------------------------------------
      ----------- Parsing the csv file -----------
      --------------------------------------------
    `);

    var csvStream = csv()
      .on("data", function (data) {
        let isAddress = web3.utils.isAddress(data[0]);
        let validToken = isvalidToken(data[1]);


        if (isAddress && validToken) {
          let userArray = new Array()
          let checksummedAddress = web3.utils.toChecksumAddress(data[0]);

          userArray.push(checksummedAddress)
          userArray.push(validToken)
          allocData.push(userArray);
          fullFileData.push(userArray);
          index++;
          if (index >= 75) {
            distribData.push(allocData);
            allocData = [];
            index = 0;
          }

        } else {
          let userArray = new Array()
          //dont need this here, as if it is NOT an address this function will fail
          //let checksummedAddress = web3.utils.toChecksumAddress(data[1]);
          userArray.push(data[0])
          userArray.push(data[1]);
          badData.push(userArray);
          fullFileData.push(userArray)
        }
      })
      .on("end", function () {
        //Add last remainder batch
        distribData.push(allocData);
        allocData = [];

        mint_tokens_for_affliliates();
      });

    stream.pipe(csvStream);
  }

  async function mint_tokens_for_affliliates() {
    accounts = await web3.eth.getAccounts();
    Issuer = accounts[0]

    let tokenDeployed = false;
    let tokenDeployedAddress;
    // Let's check if token has already been deployed, if it has, skip to STO
    await securityTokenRegistry.methods.getSecurityTokenAddress(tokenSymbol).call({ from: Issuer }, function (error, result) {
        if (result != "0x0000000000000000000000000000000000000000") {
        console.log('\x1b[32m%s\x1b[0m', "Token deployed at address " + result + ".");
        tokenDeployedAddress = result;
        tokenDeployed = true;
        }
    });
    if (tokenDeployed) {
        securityToken = new web3.eth.Contract(securityTokenABI, tokenDeployedAddress);
    }
    await securityToken.methods.getModule(3, 0).call({ from: Issuer }, function (error, result) {
        if (web3.utils.toAscii(result[0]).replace(/\u0000/g, '') == "CappedSTO") {
            console.log("****************************************************************************************\n");
            console.log("*************" + chalk.red(" Minting of tokens is only allowed before the STO get attached ") + "************\n");
            console.log("****************************************************************************************\n");
            process.exit(0);
        }
    });
    console.log(`
    -------------------------------------------------------
    ------------ Mint the tokens to affiliates ------------
    -------------------------------------------------------
  `);

  //this for loop will do the batches, so it should run 75, 75, 50 with 200
  for (let i = 0; i < distribData.length; i++) {
    try {
      let affiliatesArray = [];
      let tokensArray = [];
      //splitting the user arrays to be organized by input
      for (let j = 0; j < distribData[i].length; j++) {
        affiliatesArray.push(distribData[i][j][0]);
        let tokenAmount = web3.utils.toWei((distribData[i][j][1]).toString(),"ether")
        tokensArray.push(tokenAmount);
      }

      let GAS = Math.round(1.2 * (await securityToken.methods.mintMulti(affiliatesArray, tokensArray).estimateGas({from: Issuer})));
      console.log(chalk.black.bgYellowBright(`---- Transaction executed: mintMulti - Gas limit provided: ${GAS} ----`));
      let r = await securityToken.methods.mintMulti(affiliatesArray, tokensArray).send({ from: Issuer, gas: GAS, gasPrice: DEFAULT_GAS_PRICE })
      console.log(`Batch ${i} - Attempting to send the Minted tokens to affiliates accounts:\n\n`, affiliatesArray, "\n\n");
      console.log("---------- ---------- ---------- ---------- ---------- ---------- ---------- ----------");
      console.log("Multi Mint transaction was successful.", r.gasUsed, "gas used. Spent:", web3.utils.fromWei(BigNumber(r.gasUsed * DEFAULT_GAS_PRICE).toString(), "ether"), "Ether");
      console.log("---------- ---------- ---------- ---------- ---------- ---------- ---------- ----------\n\n");

    } catch (err) {
      console.log("ERROR:", err);
    }
  }

  console.log("Retrieving logs to determine investors have had their tokens correctly.\n\n")

    let totalInvestors = 0;
    let updatedInvestors = 0;

    let investorData_Events = new Array();
    let investorObjectLookup = {};

    let event_data = await securityToken.getPastEvents('Minted', {
      fromBlock: 0,
      toBlock: 'latest'
    }, function (error, events) {

    });

    for (var i = 0; i < event_data.length; i++) {
      let combineArray = [];

      let investorAddress_Event = event_data[i].returnValues.to;
      let amount_Event = event_data[i].returnValues.amount;
      let blockNumber = event_data[i].blockNumber

      combineArray.push(investorAddress_Event);
      combineArray.push(amount_Event);
      combineArray.push(blockNumber);

      investorData_Events.push(combineArray)
      //we have already recorded it, so this is an update to our object
      if (investorObjectLookup.hasOwnProperty(investorAddress_Event)) {

        //the block number form the event we are checking is bigger, so we gotta replace it
        if (investorObjectLookup[investorAddress_Event].recordedBlockNumber < blockNumber) {
          investorObjectLookup[investorAddress_Event] = { amount: amount_Event, recordedBlockNumber: blockNumber };
          updatedInvestors += 1;
          // investorAddress_Events.push(investorAddress_Event); not needed, because we start the obj with zero events

        } else {
          //do nothing. so if we find an event, and it was an older block, its old, we dont care
        }
        //we have never recorded this address as an object key, so we need to add it to our list of investors updated by the csv
      } else {
        investorObjectLookup[investorAddress_Event] = { amount: amount_Event, recordedBlockNumber: blockNumber };
        totalInvestors += 1;
        // investorAddress_Events.push(investorAddress_Event);
      }
    }
    let investorAddress_Events = Object.keys(investorObjectLookup)

    console.log(`******************** EVENT LOGS ANALYSIS COMPLETE ********************\n`);
    console.log(`A total of ${totalInvestors} affiliated investors get the token\n`);
    console.log(`This script in total sent ${fullFileData.length - badData.length} new investors and updated investors to the blockchain.\n`);
    console.log(`There were ${badData.length} bad entries that didnt get sent to the blockchain in the script.\n`);


    console.log("************************************************************************************************");
    console.log("OBJECT WITH EVERY USER AND THEIR MINTED TOKEN: \n\n", investorObjectLookup)
    console.log("************************************************************************************************");
    console.log("LIST OF ALL INVESTORS WHO GOT THE MINTED TOKENS: \n\n", investorAddress_Events)

    let missingDistribs = [];
    for (let l = 0; l < fullFileData.length; l++) {
      if (!investorObjectLookup.hasOwnProperty(fullFileData[l][0])) {
        missingDistribs.push(fullFileData[l])
      }
    }

    if (missingDistribs.length > 0) {
      console.log("************************************************************************************************");
      console.log("-- No Minted event was found for the following data arrays. Please review them manually --")
      console.log(missingDistribs)
      console.log("************************************************************************************************");
    } else {
      console.log("\n**************************************************************************************************************************");
      console.log("All accounts passed through from the CSV were successfully get the tokens, because we were able to read them all from events")
      console.log("****************************************************************************************************************************");
    }
  }




  function isvalidToken(token) {
    var tokenAmount = parseInt(token);
    if((tokenAmount % 1 == 0)) {
      return tokenAmount;
    }
    return false;
  }
