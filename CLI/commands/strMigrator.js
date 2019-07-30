var readlineSync = require('readline-sync');
var chalk = require('chalk');
var request = require('request-promise')
var abis = require('./helpers/contract_abis');
var contracts = require('./helpers/contract_addresses');
var common = require('./common/common_functions');
var gbl = require('./common/global');

let network;
let minNonce;

async function executeApp(toStrAddress, fromTrAddress, fromStrAddress, singleTicker, tokenAddress, onlyTickers, remoteNetwork) {
  network = remoteNetwork;
  await global.initialize(remoteNetwork);

  common.logAsciiBull();
  console.log("****************************************");
  console.log("Welcome to the Command-Line STR Migrator");
  console.log("****************************************");
  console.log("The following script will migrate tokens from old STR to new one.");
  console.log("Issuer Account: " + Issuer.address + "\n");

  try {
    minNonce = await common.getNonce(Issuer);
    let toSecurityTokenRegistry = await step_instance_toSTR(toStrAddress);
    if (typeof tokenAddress === 'undefined') {
      let fromTickerRegistry = await step_instance_fromTR(fromTrAddress);
      let tickers = await step_get_registered_tickers(fromTickerRegistry, singleTicker, onlyTickers);
      await step_register_tickers(tickers, toSecurityTokenRegistry);
    }
    if (typeof onlyTickers === 'undefined') {
      let fromSecurityTokenRegistry = await step_instance_fromSTR(fromStrAddress);
      let tokens = await step_get_deployed_tokens(fromSecurityTokenRegistry, singleTicker);
      await step_launch_STs(tokens, toSecurityTokenRegistry, tokenAddress);
    }
  } catch (err) {
    console.log(err);
    return;
  }
}

async function step_instance_toSTR(toStrAddress) {
  let _toStrAddress;
  if (typeof toStrAddress !== 'undefined') {
    if (web3.utils.isAddress(toStrAddress)) {
      _toStrAddress = toStrAddress;
    } else {
      console.log(chalk.red("Entered toStrAddress is not a valid address."));
      return;
    }
  } else {
    // _toStrAddress = readlineSync.question('Enter the new SecurityTokenRegistry address to migrate TO: ', {
    //     limit: function(input) {
    //       return web3.utils.isAddress(input);
    //     },
    //     limitMessage: "Must be a valid address"
    // });
    _toStrAddress = "0x240f9f86b1465bf1b8eb29bc88cbf65573dfdd97";
  }

  console.log(`Creating SecurityTokenRegistry contract instance of address: ${_toStrAddress}...`);
  let securityTokenRegistryABI = abis.securityTokenRegistry();
  let toSTR = new web3.eth.Contract(securityTokenRegistryABI, _toStrAddress);
  toSTR.setProvider(web3.currentProvider);

  return toSTR;
}

async function step_instance_fromTR(fromTrAddress) {
  let _fromTrAddress;
  if (typeof fromTrAddress !== 'undefined') {
    if (web3.utils.isAddress(fromTrAddress)) {
      _fromTrAddress = fromTrAddress;
    } else {
      console.log(chalk.red("Entered fromTrAddress is not a valid address."));
      return;
    }
  } else {
    // _fromTrAddress = readlineSync.question('Enter the old TikcerRegistry address to migrate FROM: ', {
    //     limit: function(input) {
    //       return web3.utils.isAddress(input);
    //     },
    //     limitMessage: "Must be a valid address"
    // });
    _fromTrAddress = "0xc31714e6759a1ee26db1d06af1ed276340cd4233";
  }

  console.log(`Creating TickerRegistry contract instance of address: ${_fromTrAddress}...`);
  let tickerRegistryABI = await getABIfromEtherscan(_fromTrAddress);
  let fromTR = new web3.eth.Contract(tickerRegistryABI, _fromTrAddress);
  fromTR.setProvider(web3.currentProvider);

  return fromTR;
}

async function step_get_registered_tickers(tickerRegistry, singleTicker, onlyTickers) {
  let tickers = [];
  let expiryTime = await tickerRegistry.methods.expiryLimit().call();

  let logs = await getLogsFromEtherscan(tickerRegistry.options.address, 0, 'latest', 'LogRegisterTicker(address,string,string,bytes32,uint256)');
  if (logs.length == 0) {
    console.log("No ticker registration events were emitted.");
  } else {
    for (let log of logs) {
      let event = common.getEventFromLogs(tickerRegistry._jsonInterface, [log], 'LogRegisterTicker');
      if (typeof singleTicker === 'undefined' || event._symbol == singleTicker) {
        let details = await tickerRegistry.methods.getDetails(event._symbol).call();
        let _status = details[4];
        if (typeof onlyTickers === 'undefined' || (onlyTickers && !_status)) {
          let expiredTicker = details[0] == '0x0000000000000000000000000000000000000000';
          let _symbol = event._symbol;
          let _owner = expiredTicker ? event._owner : details[0];
          let _name = expiredTicker ? event._name : details[2];
          let _registrationDate = expiredTicker ? event._timestamp : details[1];


          console.log(`------------ Ticker Registered ------------`);
          console.log(`Ticker: ${_symbol}`);
          console.log(`Owner: ${_owner}`);
          console.log(`Token name: ${_name}`);
          console.log(`Timestamp: ${_registrationDate}`);
          console.log(`Transaction hash: ${log.transactionHash}`);
          console.log(`-------------------------------------------`);
          console.log(`\n`);

          tickers.push({
            ticker: _symbol,
            owner: _owner,
            name: _name,
            registrationDate: new web3.utils.BN(_registrationDate),
            expiryDate: new web3.utils.BN(_registrationDate).add(new web3.utils.BN(expiryTime)),
            status: _status
          });
        }
      }
    }
  }

  console.log(chalk.yellow(`${tickers.length} tickers found!`));
  return tickers;
}

async function step_register_tickers(tickers, securityTokenRegistry) {
  if (tickers.length == 0) {
    console.log(chalk.yellow(`There are no tickers to migrate!`));
  } else /*if (readlineSync.keyInYNStrict(`Do you want to migrate ${tickers.length} Tickers?`)) */ {
    let i = 0;
    let succeed = [];
    let failed = [];
    let totalGas = new web3.utils.BN(0);
    let migrateAll = false;
    for (const t of tickers) {
      if (migrateAll || readlineSync.keyInYNStrict(`Do you want to migrate ${t.ticker}?`)) {
        if (!migrateAll) {
          migrateAll = readlineSync.keyInYNStrict(`Do you want to migrate all tickers from here?`)
        }
        console.log(`\n`);
        console.log(`-------- Migrating ticker No ${++i}--------`);
        console.log(`Ticker: ${t.ticker}`);
        console.log(``);
        try {
          let modifyTickerAction = securityTokenRegistry.methods.modifyTicker(t.owner, t.ticker, t.name, t.registrationDate, t.expiryDate, false);
          let receipt = await common.sendTransaction(modifyTickerAction, { minNonce: minNonce });
          console.log(minNonce);
          minNonce = minNonce + 1;
          //totalGas = totalGas.add(new web3.utils.BN(receipt.gasUsed));
          succeed.push(t);
        } catch (error) {
          failed.push(t);
          console.log(chalk.red(`Transaction failed!!! `))
          console.log(error);
        }
      }
    }

    logTickerResults(succeed, failed, totalGas);
  }
}

async function step_instance_fromSTR(fromStrAddress) {
  let _fromStrAddress;
  if (typeof fromStrAddress !== 'undefined') {
    if (web3.utils.isAddress(fromStrAddress)) {
      _fromStrAddress = fromStrAddress;
    } else {
      console.log(chalk.red("Entered fromStrAddress is not a valid address."));
      return;
    }
  } else {
    // _fromStrAddress = readlineSync.question('Enter the old SecurityTokenRegistry address to migrate FROM: ', {
    //     limit: function(input) {
    //       return web3.utils.isAddress(input);
    //     },
    //     limitMessage: "Must be a valid address"
    // });
    _fromStrAddress = "0xef58491224958d978facf55d2120c55a24516b98";
  }

  console.log(`Creating SecurityTokenRegistry contract instance of address: ${_fromStrAddress}...`);
  let securityTokenRegistryABI = await getABIfromEtherscan(_fromStrAddress);
  let fromSTR = new web3.eth.Contract(securityTokenRegistryABI, _fromStrAddress);
  fromSTR.setProvider(web3.currentProvider);

  return fromSTR;
}

async function step_get_deployed_tokens(securityTokenRegistry, singleTicker) {
  let tokens = [];

  //let events = await securityTokenRegistry.getPastEvents('LogNewSecurityToken', { fromBlock: 0});
  let logs = await getLogsFromEtherscan(securityTokenRegistry.options.address, 0, 'latest', 'LogNewSecurityToken(string,address,address)');
  if (logs.length == 0) {
    console.log("No security token events were emitted.");
  } else {
    for (let log of logs) {
      let event = common.getEventFromLogs(securityTokenRegistry._jsonInterface, [log], 'LogNewSecurityToken');
      if (typeof singleTicker === 'undefined' || event._ticker == singleTicker) {
        let tokenAddress = event._securityTokenAddress;
        let securityTokenABI = JSON.parse(require('fs').readFileSync(`${__dirname}/../data/SecurityToken1-4-0.json`).toString()).abi;
        console.log(`Creating SecurityToken contract instance of address: ${tokenAddress}...`);
        let token = new web3.eth.Contract(securityTokenABI, tokenAddress);
        token.setProvider(web3.currentProvider);

        let tokenName = await token.methods.name().call();
        let tokenSymbol = await token.methods.symbol().call();
        let tokenOwner = await token.methods.owner().call();
        let tokenDetails = await token.methods.tokenDetails().call();
        let tokenDivisible = await token.methods.granularity().call() == 1;
        let tokenDeployedAt = (await getBlockfromEtherscan(web3.utils.hexToNumber(log.blockNumber))).timeStamp;


        let gmtAddress = (await token.methods.getModule(2, 0).call())[1];
        let gtmABI = JSON.parse(require('fs').readFileSync(`${__dirname}/../data/GeneralTransferManager1-4-0.json`).toString()).abi;
        let gmt = new web3.eth.Contract(gtmABI, gmtAddress);
        //let gtmEvents = await gmt.getPastEvents('LogModifyWhitelist', { fromBlock: event.blockNumber});
        let gtmLogs = await getLogsFromEtherscan(gmt.options.address, 0, 'latest', 'LogModifyWhitelist(address,uint256,address,uint256,uint256,uint256,bool)');
        let gtmEvents = common.getMultipleEventsFromLogs(gmt._jsonInterface, gtmLogs, 'LogModifyWhitelist');

        let mintedEvents = [];
        if (gtmEvents.length > 0) {
          //mintedEvents = await token.getPastEvents('Minted', { fromBlock: event.blockNumber});
          let mintedLogs = await getLogsFromEtherscan(token.options.address, 0, 'latest', 'Minted(address,uint256)');
          mintedEvents = common.getMultipleEventsFromLogs(token._jsonInterface, mintedLogs, 'Minted');
        }

        console.log(`--------- SecurityToken launched ---------`);
        console.log(`Token address: ${event._securityTokenAddress}`);
        console.log(`Symbol: ${tokenSymbol}`);
        console.log(`Name: ${tokenName}`);
        console.log(`Owner: ${tokenOwner}`);
        console.log(`Details: ${tokenDetails}`);
        console.log(`Divisble: ${tokenDivisible}`);
        console.log(`Deployed at: ${tokenDeployedAt}`);
        console.log(`Transaction hash: ${log.transactionHash}`);
        console.log(`------------------------------------------`);
        console.log(``);


        tokens.push({
          name: tokenName,
          ticker: tokenSymbol,
          owner: tokenOwner,
          details: tokenDetails,
          address: tokenAddress,
          deployedAt: tokenDeployedAt,
          divisble: tokenDivisible,
          gmtEvents: gtmEvents,
          mintedEvents: mintedEvents
        });
      }
    }
  }

  console.log(chalk.yellow(`${tokens.length} security tokens found!`));
  return tokens;
}

async function step_launch_STs(tokens, securityTokenRegistry, tokenAddress) {
  if (tokens.length == 0) {
    console.log(chalk.yellow(`There are no security tokens to migrate!`));
  } else /*if (readlineSync.keyInYNStrict(`Do you want to migrate ${tokens.length} Security Tokens?`))*/ {
    let i = 0;
    let succeed = [];
    let failed = [];
    let totalGas = new web3.utils.BN(0);
    let polymathRegistryAddress = await contracts.polymathRegistry();
    let STFactoryABI = JSON.parse(require('fs').readFileSync(`${__dirname}/../../build/contracts/STFactory.json`).toString()).abi;
    let STFactoryAddress = await securityTokenRegistry.methods.getSTFactoryAddress().call();
    let STFactory = new web3.eth.Contract(STFactoryABI, STFactoryAddress);
    for (const t of tokens) {
      console.log(`\n`);
      console.log(`-------- Migrating token No ${++i}--------`);
      console.log(`Token symbol: ${t.ticker}`);
      console.log(`Token old address: ${t.address}`);
      console.log(``);
      try {
        // Deploying 2.0.0 Token
        let newTokenAddress;
        if (tokens.length == 1 && typeof tokenAddress !== 'undefined') {
          if (web3.utils.isAddress(tokenAddress)) {
            newTokenAddress = tokenAddress;
          } else {
            console.log(chalk.red('Given tokenAddress is not an address!!'));
            process.exit(0);
          }
        } else {
          let deployTokenAction = STFactory.methods.deployToken(t.name, t.ticker, 18, t.details, Issuer.address, t.divisble, polymathRegistryAddress)
          let deployTokenReceipt = await common.sendTransaction(deployTokenAction, { minNonce: minNonce });
          minNonce = minNonce + 1;
          // Instancing Security Token
          newTokenAddress = deployTokenReceipt.logs[deployTokenReceipt.logs.length - 1].address; //Last log is the ST creation
        }
        console.log(chalk.green(`The migrated to 2.0.0 Security Token address is ${newTokenAddress}`));
        let newTokenABI = abis.securityToken();
        let newToken = new web3.eth.Contract(newTokenABI, newTokenAddress);

        // Checking if the old Security Token has activity
        if (t.gmtEvents.length > 0) {
          // Instancing GeneralTransferManager
          let gmtABI = abis.generalTransferManager();
          let gmtAddress = (await newToken.methods.getModulesByName(web3.utils.toHex("GeneralTransferManager")).call())[0];
          let gmt = new web3.eth.Contract(gmtABI, gmtAddress);
          // Whitelisting investors
          for (const gmtEvent of t.gmtEvents) {
            let modifyWhitelistAction = gmt.methods.modifyWhitelist(
              gmtEvent._investor,
              new web3.utils.BN(gmtEvent._fromTime),
              new web3.utils.BN(gmtEvent._toTime),
              new web3.utils.BN(gmtEvent._expiryTime),
              gmtEvent._canBuyFromSTO
            );
            let modifyWhitelistReceipt = await common.sendTransaction(modifyWhitelistAction, { minNonce: minNonce });
            minNonce = minNonce + 1;
            //totalGas = totalGas.add(new web3.utils.BN(modifyWhitelistReceipt.gasUsed));
          }
          // Minting tokens
          for (const mintedEvent of t.mintedEvents) {
            let mintAction = newToken.methods.mint(mintedEvent.to, new web3.utils.BN(mintedEvent.amount));
            let mintReceipt = await common.sendTransaction(mintAction, { minNonce: minNonce });
            minNonce = minNonce + 1;
            //totalGas = totalGas.add(new web3.utils.BN(mintReceipt.gasUsed));
          }
        }

        // Transferring onweship to the original owner
        let transferOwnershipAction = newToken.methods.transferOwnership(t.owner);
        let transferOwnershipReceipt = await common.sendTransaction(transferOwnershipAction, { minNonce: minNonce });
        minNonce = minNonce + 1;
        //totalGas = totalGas.add(new web3.utils.BN(transferOwnershipReceipt.gasUsed));

        // Adding 2.0.0 Security Token to SecurityTokenRegistry
        let modifySecurityTokenAction = securityTokenRegistry.methods.modifySecurityToken(t.name, t.ticker, t.owner, newTokenAddress, t.details, t.deployedAt);
        let modifySecurityTokenReceipt = await common.sendTransaction(modifySecurityTokenAction, { minNonce: minNonce });
        minNonce = minNonce + 1;
        //totalGas = totalGas.add(new web3.utils.BN(modifySecurityTokenReceipt.gasUsed));

        succeed.push(t);
        console.log('done');
      } catch (error) {
        failed.push(t);
        console.log(chalk.red(`Transaction failed!!! `))
        console.log(error);
      }
    }

    logTokenResults(succeed, failed, totalGas);
  }
}

function logTokenResults(succeed, failed, totalGas) {
  console.log(`
--------------------------------------------
--------- Token Migration Results ----------
--------------------------------------------
Successful migrations: ${succeed.length}
Failed migrations:     ${failed.length}
Total gas consumed:    ${totalGas}
Total gas cost:        ${web3.utils.fromWei((new web3.utils.BN(defaultGasPrice)).mul(totalGas))} ETH
List of failed registrations:
${failed.map(token => chalk.red(`${token.symbol} at ${token.address}`)).join('\n')}
`);
}

function logTickerResults(succeed, failed, totalGas) {
  console.log(`
--------------------------------------------
--------- Ticker Migration Results ---------
--------------------------------------------
Successful migrations: ${succeed.length}
Failed migrations:     ${failed.length}
Total gas consumed:    ${totalGas}
Total gas cost:        ${web3.utils.fromWei((new web3.utils.BN(defaultGasPrice)).mul(totalGas))} ETH
List of failed registrations:
${failed.map(ticker => chalk.red(`${ticker.ticker}`)).join('\n')}
`);
}

async function getLogsFromEtherscan(_address, _fromBlock, _toBlock, _eventSignature) {
  let urlDomain = network == 'kovan' ? 'api-kovan' : 'api';
  const options = {
    url: `https://${urlDomain}.etherscan.io/api`,
    qs: {
      module: 'logs',
      action: 'getLogs',
      fromBlock: _fromBlock,
      toBlock: _toBlock,
      address: _address,
      topic0: web3.utils.sha3(_eventSignature),
      apikey: 'THM9IUVC2DJJ6J5MTICDE6H1HGQK14X559'
    },
    method: 'GET',
    json: true
  };
  let data = await request(options);
  return data.result;
}

async function getABIfromEtherscan(_address) {
  let urlDomain = remoteNetwork == 'kovan' ? 'api-kovan' : 'api';
  const options = {
    url: `https://${urlDomain}.etherscan.io/api`,
    qs: {
      module: 'contract',
      action: 'getabi',
      address: _address,
      apikey: 'THM9IUVC2DJJ6J5MTICDE6H1HGQK14X559'
    },
    method: 'GET',
    json: true
  };
  let data = await request(options);
  return JSON.parse(data.result);
}

async function getBlockfromEtherscan(_blockNumber) {
  let urlDomain = network == 'kovan' ? 'api-kovan' : 'api';
  const options = {
    url: `https://${urlDomain}.etherscan.io/api`,
    qs: {
      module: 'block',
      action: 'getblockreward',
      blockno: _blockNumber,
      apikey: 'THM9IUVC2DJJ6J5MTICDE6H1HGQK14X559'
    },
    method: 'GET',
    json: true
  };
  let data = await request(options);
  return data.result;
}

module.exports = {
  executeApp: async function (toStrAddress, fromTrAddress, fromStrAddress, singleTicker, tokenAddress, onlyTickers, remoteNetwork) {
    return executeApp(toStrAddress, fromTrAddress, fromStrAddress, singleTicker, tokenAddress, onlyTickers, remoteNetwork);
  }
};
