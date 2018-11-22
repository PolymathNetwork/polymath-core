var contracts = require('../helpers/contract_addresses');
var abis = require('../helpers/contract_abis');
var csv = require('./csv_sync');

let BATCH_SIZE = 70;

async function startScript(tokenSymbol, batchSize) {
  if (batchSize) {
    BATCH_SIZE = batchSize;
  }
  let STAddress = await checkST(tokenSymbol);
  return new web3.eth.Contract(abis.securityToken(), STAddress);
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

async function readScript(file, processing) {
  let allocData = new Array();
  let distribData = new Array();
  let fullFileData = new Array();
  let badData = new Array();
  let i = 0;

  var CSV_STRING = csv(file);

  CSV_STRING.forEach(line => {
    let data_processed = processing(line);
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
  });

  distribData.push(allocData);
  allocData = [];

  return {
    distribData: distribData,
    fullFileData: fullFileData,
    badData: badData
  }
}

module.exports = {
  start: async (tokenSymbol, batchSize) => {
    return await startScript(tokenSymbol, batchSize);
  },
  read: async (file, processing) => {
    return await readScript(file, processing);
  }
}