const chalk = require('chalk');
const Tx = require('ethereumjs-tx');
const permissionsList = require('./permissions_list');
const abis = require('../helpers/contract_abis');
const input = require('../IO/input');
const readlineSync = require('readline-sync');

async function addModule (securityToken, polyToken, factoryAddress, moduleABI, getInitializeData, configFile) {
  const moduleFactoryABI = abis.moduleFactory();
  const moduleFactory = new web3.eth.Contract(moduleFactoryABI, factoryAddress);
  moduleFactory.setProvider(web3.currentProvider);

  const moduleName = web3.utils.hexToUtf8(await moduleFactory.methods.name().call());
  const moduleFee = new web3.utils.BN(await moduleFactory.methods.setupCostInPoly().call());
  let transferAmount = new web3.utils.BN(0);
  if (moduleFee.gt(new web3.utils.BN(0))) {
    const contractBalance = new web3.utils.BN(await polyToken.methods.balanceOf(securityToken._address).call());
    if (contractBalance.lt(moduleFee)) {
      transferAmount = moduleFee.sub(contractBalance);
      const ownerBalance = new web3.utils.BN(await polyToken.methods.balanceOf(Issuer.address).call());
      if (ownerBalance.lt(transferAmount)) {
        console.log(chalk.red(`\n**************************************************************************************************************************************************`));
        console.log(chalk.red(`Not enough balance to pay the ${moduleName} fee, Requires ${web3.utils.fromWei(transferAmount)} POLY but have ${web3.utils.fromWei(ownerBalance)} POLY. Access POLY faucet to get the POLY to complete this txn`));
        console.log(chalk.red(`**************************************************************************************************************************************************\n`));
        process.exit(0);
      }
    }
  }

  let bytes = web3.utils.fromAscii('', 16);
  if (typeof getInitializeData !== 'undefined') {
    bytes = await getInitializeData(moduleABI, configFile);
  }
  const addModuleArchived = readlineSync.keyInYNStrict('Do you want to add this module archived?');
  const moduleLabel = web3.utils.toHex(readlineSync.question('Enter a label to help you to identify this module: '));

  if (transferAmount.gt(new web3.utils.BN(0))) {
    let transferAction = polyToken.methods.transfer(securityToken._address, transferAmount);
    let transferReceipt = await this.sendTransaction(transferAction, { factor: 2 });
    let transferEvent = this.getEventFromLogs(polyToken._jsonInterface, transferReceipt.logs, 'Transfer');
    console.log(`Number of POLY sent: ${web3.utils.fromWei(new web3.utils.BN(transferEvent.value))}`);
  }
  let addModuleAction = securityToken.methods.addModuleWithLabel(factoryAddress, bytes, moduleFee, 0, moduleLabel, addModuleArchived);
  let receipt = await this.sendTransaction(addModuleAction);
  let event = this.getEventFromLogs(securityToken._jsonInterface, receipt.logs, 'ModuleAdded');
  console.log(`${moduleName} deployed at address: ${event._module}`);
  return event._module;
}

async function getAvailableModules(moduleRegistry, moduleType, stAddress) {
  let availableModules = await moduleRegistry.methods.getModulesByTypeAndToken(moduleType, stAddress).call();
  let moduleList = await Promise.all(availableModules.map(async function (m) {
    let moduleFactoryABI = abis.moduleFactory();
    let moduleFactory = new web3.eth.Contract(moduleFactoryABI, m);
    let moduleName = web3.utils.hexToUtf8(await moduleFactory.methods.name().call());
    let moduleVersion = await moduleFactory.methods.version().call();
    return { name: moduleName, version: moduleVersion, factoryAddress: m };
  }));
  return moduleList;
}

async function getAllModulesByType (securityToken, type) {
  function ModuleInfo (_moduleType, _name, _address, _factoryAddress, _archived, _paused, _version, _label) {
    this.name = _name;
    this.type = _moduleType;
    this.address = _address;
    this.factoryAddress = _factoryAddress;
    this.archived = _archived;
    this.paused = _paused;
    this.version = _version;
    this.label = _label;
  }

  let modules = [];
  let allModules = await securityToken.methods.getModulesByType(type).call();
  for (let i = 0; i < allModules.length; i++) {
    let details = await securityToken.methods.getModule(allModules[i]).call();
    let contractTemp = new web3.eth.Contract(abis.moduleABI(), details[1]);
    let pausedTemp = await contractTemp.methods.paused().call();
    let factory = new web3.eth.Contract(abis.moduleFactory(), details[2]);
    let versionTemp = await factory.methods.version().call();
    modules.push(new ModuleInfo(
      type,
      web3.utils.hexToUtf8(details[0]),
      details[1],
      details[2],
      details[3],
      pausedTemp,
      versionTemp,
      web3.utils.hexToUtf8(details[5])
      ));
  }

  return modules;
}

function connect(abi, address) {
  contractRegistry = new web3.eth.Contract(abi, address);
  contractRegistry.setProvider(web3.currentProvider);
  return contractRegistry
};

async function queryModifyWhiteList(currentTransferManager) {
  let investor = input.readAddress('Enter the address to whitelist: ');
  let now = Math.floor(Date.now() / 1000);
  let canSendAfter = readlineSync.questionInt(`Enter the time (Unix Epoch time) when the sale lockup period ends and the investor can freely transfer his tokens (now = ${now}): `, { defaultInput: now });
  let canReceiveAfter = readlineSync.questionInt(`Enter the time (Unix Epoch time) when the purchase lockup period ends and the investor can freely receive tokens from others (now = ${now}): `, { defaultInput: now });
  let oneYearFromNow = Math.floor(Date.now() / 1000 + (60 * 60 * 24 * 365));
  let expiryTime = readlineSync.questionInt(`Enter the time until the investors KYC will be valid (after this time expires, the investor must re-do KYC) (1 year from now = ${oneYearFromNow}): `, { defaultInput: oneYearFromNow });
  let modifyWhitelistAction = currentTransferManager.methods.modifyKYCData(investor, canSendAfter, canReceiveAfter, expiryTime);
  let modifyWhitelistReceipt = await sendTransaction(modifyWhitelistAction);
  let moduleVersion = await getModuleVersion(currentTransferManager);
  if (moduleVersion != '1.0.0') {
    let modifyWhitelistEvent = getEventFromLogs(currentTransferManager._jsonInterface, modifyWhitelistReceipt.logs, 'ModifyKYCData');
    console.log(chalk.green(`${modifyWhitelistEvent._investor} has been whitelisted sucessfully!`));
  } else {
    console.log(chalk.green(`${investor} has been whitelisted sucessfully!`));
  }
}

async function getModuleVersion(currentTransferManager) {
  let moduleFactoryABI = abis.moduleFactory();
  let factoryAddress = await currentTransferManager.methods.factory().call();
  let moduleFactory = new web3.eth.Contract(moduleFactoryABI, factoryAddress);
  let moduleVersion = await moduleFactory.methods.version().call();
    return moduleVersion
}

async function checkPermission(contractName, functionName, contractRegistry) {
  let permission = permissionsList.verifyPermission(contractName, functionName);
  if (permission === undefined) {
    return true
  } else {
    let stAddress = await contractRegistry.methods.securityToken().call();
    let securityToken = connect(abis.iSecurityToken(), stAddress);
    let stOwner = await securityToken.methods.owner().call();
    if (stOwner == Issuer.address) {
      return true
    } else {
      let result = await securityToken.methods.checkPermission(Issuer.address, contractRegistry.options.address, web3.utils.asciiToHex(permission)).call();
      return result
    }
  }
};

function getFinalOptions(options) {
  if (typeof options != "object") {
    options = {}
  }
  const defaultOptions = {
    from: Issuer,
    gasPrice: defaultGasPrice,
    value: undefined,
    factor: 1.2,
    minNonce: 0
  }
  return Object.assign(defaultOptions, options)
};

async function getGasLimit(options, action) {
  let block = await web3.eth.getBlock('latest');
  let networkGasLimit = block.gasLimit;
  let gas = Math.round(options.factor * (await action.estimateGas({ from: options.from.address, value: options.value })));
  return (gas > networkGasLimit) ? networkGasLimit : gas;
}

async function checkPermissions(action) {
  let contractRegistry = connect(action._parent.options.jsonInterface, action._parent._address);
  //NOTE this is a condition to verify if the transaction comes from a module or not.
  if (contractRegistry.methods.hasOwnProperty('factory')) {
    let moduleAddress = await contractRegistry.methods.factory().call();
    let moduleRegistry = connect(abis.moduleFactory(), moduleAddress);
    let parentModule = await moduleRegistry.methods.name().call();
    let result = await checkPermission(web3.utils.hexToUtf8(parentModule), action._method.name, contractRegistry);
    if (!result) {
      console.log("You haven't the right permissions to execute this method.");
      process.exit(0);
    }
  }
  return
}

async function selectToken(securityTokenRegistry, tokenSymbol) {
  if (typeof tokenSymbol === 'undefined') {
    const tokensByOwner = await securityTokenRegistry.methods.getTokensByOwner(Issuer.address).call();
    const tokensByDelegate = await securityTokenRegistry.methods.getTokensByDelegate(Issuer.address).call();
    const userTokens = tokensByOwner.concat(tokensByDelegate);
    const tokenDataArray = await Promise.all(userTokens.map(async function (t) {
      const tokenData = await securityTokenRegistry.methods.getSecurityTokenData(t).call();
      return { symbol: tokenData[0], address: t };
    }));
    const options = tokenDataArray.map(function (t) {
      return `${t.symbol} - Deployed at ${t.address}`;
    });
    options.push('Enter token symbol manually');

    const index = readlineSync.keyInSelect(options, 'Select a token:', { cancel: 'Exit' });
    const selected = index !== -1 ? options[index] : 'Exit';
    switch (selected) {
      case 'Enter token symbol manually':
        tokenSymbol = input.readStringNonEmpty('Enter the token symbol: ');
        break;
      case 'Exit':
        tokenSymbol = '';
        break;
      default:
        tokenSymbol = tokenDataArray[index].symbol;
        break;
    }
  }

  let securityToken = null;
  if (tokenSymbol !== '') {
    const securityTokenAddress = await securityTokenRegistry.methods.getSecurityTokenAddress(tokenSymbol).call();
    if (securityTokenAddress === '0x0000000000000000000000000000000000000000') {
      console.log(chalk.red(`Selected Security Token ${tokenSymbol} does not exist.`));
    } else {
      const iSecurityTokenABI = abis.iSecurityToken();
      securityToken = new web3.eth.Contract(iSecurityTokenABI, securityTokenAddress);
      securityToken.setProvider(web3.currentProvider);
    }
  }

  return securityToken;
}

async function sendTransaction(action, options) {
  await checkPermissions(action);

  options = getFinalOptions(options);
  let gasLimit = await getGasLimit(options, action);

  console.log(chalk.black.bgYellowBright(`---- Transaction executed: ${action._method.name} - Gas limit provided: ${gasLimit} ----`));

  let nonce = await web3.eth.getTransactionCount(options.from.address);
  if (nonce < options.minNonce) {
    nonce = minNonce;
  }
  let abi = action.encodeABI();
  let parameter = {
    from: options.from.address,
    to: action._parent._address,
    data: abi,
    gasLimit: gasLimit,
    gasPrice: options.gasPrice,
    nonce: nonce,
    value: web3.utils.toHex(options.value)
  };

  const transaction = new Tx(parameter);
  transaction.sign(Buffer.from(options.from.privateKey.replace('0x', ''), 'hex'));
  return await web3.eth.sendSignedTransaction('0x' + transaction.serialize().toString('hex'))
    .on('transactionHash', function (hash) {
      console.log(`
Your transaction is being processed. Please wait...
TxHash: ${hash}`
      );
    })
    .on('receipt', function (receipt) {
      console.log(`
Congratulations! The transaction was successfully completed.
Gas used: ${receipt.gasUsed} - Gas spent: ${web3.utils.fromWei((new web3.utils.BN(options.gasPrice)).mul(new web3.utils.BN(receipt.gasUsed)))} Ether
Review it on Etherscan.
TxHash: ${receipt.transactionHash}\n`
      );
    });
};

function getEventFromLogs(jsonInterface, logs, eventName) {
  let eventJsonInterface = jsonInterface.find(o => o.name === eventName && o.type === 'event');
  let log = logs.find(l => l.topics.includes(eventJsonInterface.signature));
  return web3.eth.abi.decodeLog(eventJsonInterface.inputs, log.data, log.topics.slice(1));
}

module.exports = {
  convertToDaysRemaining: function (timeRemaining) {
    var seconds = parseInt(timeRemaining, 10);

    var days = Math.floor(seconds / (3600 * 24));
    seconds -= days * 3600 * 24;
    var hrs = Math.floor(seconds / 3600);
    seconds -= hrs * 3600;
    var mnts = Math.floor(seconds / 60);
    seconds -= mnts * 60;
    return (days + " days, " + hrs + " Hrs, " + mnts + " Minutes, " + seconds + " Seconds");
  },
  logAsciiBull: function () {
    console.log(chalk.blue(`
                                       /######%%,             /#(
                                     ##########%%%%%,      ,%%%.      %
                                  *#############%%%%%##%%%%%%#      ##
                                (################%%%%#####%%%%//###%,
                             .####################%%%%#########/
                           (#########%%############%%%%%%%%%#%%%
                       ,(%#%%%%%%%%%%%%############%%%%%%%###%%%.
                  (######%%###%%%%%%%%##############%%%%%####%%%*
                /#######%%%%######%%%%##########%###,.%######%%%(
          #%%%%%#######%%%%%%###########%%%%%*######    /####%%%#
         #.    ,%%####%%%%%%%(/#%%%%%%%%(    #%####        ,#%/
     *#%(      .%%%##%%%%%%                 .%%%#*
               .%%%%#%%%%               .%%%###(
               %%%#####%                (%%.
              #%###(,
             *#%#
             %%#
            *
            &%
           %%%.
`));
  },
  getNonce: async function (from) {
    return (await web3.eth.getTransactionCount(from.address, "pending"));
  },
  getMultipleEventsFromLogs: function (jsonInterface, logs, eventName) {
    let eventJsonInterface = jsonInterface.find(o => o.name === eventName && o.type === 'event');
    let filteredLogs = logs.filter(l => l.topics.includes(eventJsonInterface.signature));
    return filteredLogs.map(l => web3.eth.abi.decodeLog(eventJsonInterface.inputs, l.data, l.topics.slice(1)));
  },
  connect: function (abi, address) {
    return connect(abi, address)
  },
  splitIntoBatches: function (data, batchSize) {
    let allBatches = [];
    for (let index = 0; index < data.length; index += parseInt(batchSize)) {
      allBatches.push(data.slice(index, index + parseInt(batchSize)));
    }
    return allBatches;
  },
  transposeBatches: function (batches) {
    let result = [];
    if (batches.length > 0 && batches[0].length > 0) {
      let columns = batches[0][0].length;
      for (let index = 0; index < columns; index++) {
        result[index] = batches.map(batch => batch.map(record => record[index]));
      }
    }
    return result;
  },
  sendTransaction,
  getEventFromLogs,
  queryModifyWhiteList,
  addModule,
  getAvailableModules,
  getAllModulesByType,
  selectToken
};
