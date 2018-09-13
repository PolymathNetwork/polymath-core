var readlineSync = require('readline-sync');
var chalk = require('chalk');
var common = require('./common/common_functions');
var global = require('./common/global');
var contracts = require('./helpers/contract_addresses');
var abis = require('./helpers/contract_abis');

// App flow
let tokenSymbol;
let securityTokenRegistry;
let securityToken;
let generalPermissionManager;

const MODULES_TYPES = {
  PERMISSION: 1,
  TRANSFER: 2,
  STO: 3,
  DIVIDEND: 4
}

async function executeApp(remoteNetwork) {
  await global.initialize(remoteNetwork);

  common.logAsciiBull();
  console.log("***********************************************");
  console.log("Welcome to the Command-Line Permission Manager.");
  console.log("***********************************************");
  console.log("Issuer Account: " + Issuer.address + "\n");

  await setup();
  try {
    await selectST();
    await addPermissionModule();
    await changePermissionStep();
  } catch (err) {
    console.log(err);
    return;
  }
};

async function setup(){
  try {
    let securityTokenRegistryAddress = await contracts.securityTokenRegistry();
    let securityTokenRegistryABI = abis.securityTokenRegistry();
    securityTokenRegistry = new web3.eth.Contract(securityTokenRegistryABI, securityTokenRegistryAddress);
    securityTokenRegistry.setProvider(web3.currentProvider);
  } catch (err) {
    console.log(err)
    console.log('\x1b[31m%s\x1b[0m',"There was a problem getting the contracts. Make sure they are deployed to the selected network.");
    process.exit(0);
  }
}

async function selectST() {
  if (!tokenSymbol)
    tokenSymbol = readlineSync.question('Enter the token symbol: ');

  let result = await securityTokenRegistry.methods.getSecurityTokenAddress(tokenSymbol).call();
  if (result == "0x0000000000000000000000000000000000000000") {
    tokenSymbol = undefined;
    console.log(chalk.red(`Token symbol provided is not a registered Security Token.`));
    await selectST();
  } else {
    let securityTokenABI = abis.securityToken();
    securityToken = new web3.eth.Contract(securityTokenABI,result);
  }
}

async function addPermissionModule() {
  let generalPermissionManagerAddress;
  let result = await securityToken.methods.getModule(1, 0).call();
  if (result[1] == "0x0000000000000000000000000000000000000000") {
    console.log(chalk.red(`General Permission Manager is not attached.`));
    if (readlineSync.keyInYNStrict('Do you want to add General Permission Manager Module to your Security Token?')) {
      let permissionManagerFactoryAddress = await contracts.generalPermissionManagerFactoryAddress();
      let addModuleAction = securityToken.methods.addModule(permissionManagerFactoryAddress, web3.utils.fromAscii('', 16), 0, 0);
      let receipt = await common.sendTransaction(Issuer, addModuleAction, defaultGasPrice);
      let event = common.getEventFromLogs(securityToken._jsonInterface, receipt.logs, 'LogModuleAdded');
      console.log(`Module deployed at address: ${event._module}`);
      generalPermissionManagerAddress = event._module;
    } else {
      process.exit(0);
    }
  } else {
    generalPermissionManagerAddress = result[1];
  }

  let generalPermissionManagerABI = abis.generalPermissionManager();
  generalPermissionManager = new web3.eth.Contract(generalPermissionManagerABI, generalPermissionManagerAddress);
  generalPermissionManager.setProvider(web3.currentProvider);
}

async function changePermissionStep() {
  console.log('\n\x1b[34m%s\x1b[0m',"Permission Manager - Change Permission");
  let selectedDelegate = await selectDelegate();
  let selectedModule = await selectModule();
  let selectedPermission = await selectPermission(selectedModule.permissions);
  let isValid = isPermissionValid();
  await changePermission(selectedDelegate, selectedModule.address, selectedPermission, isValid);
}

async function selectDelegate() {
  let result;
  let delegates = await getDelegates();
  
  let options = ['Add new delegate'];
  options = options.concat(delegates.map(function(d) { 
    return `Account: ${d.address}
    Details: ${d.details}`
  }));

  let index = readlineSync.keyInSelect(options, 'Select a delegate:', {cancel: false});
  if (index == 0) {
    let newDelegate = await addNewDelegate();
    result = newDelegate;
  } else {
    result = delegates[index - 1].address;
  }

  return result;
}

async function selectModule() {
  let modules = await getModulesWithPermissions();
  let options = modules.map(function(m) { 
    return m.name;
  });
  let index = readlineSync.keyInSelect(options, 'Select a module:', {cancel: false});
  return modules[index];
}

async function selectPermission(permissions) {
  let options = permissions.map(function(p) {
    return p
  });
  let index = readlineSync.keyInSelect(options, 'Select a permission:', {cancel: false});
  return permissions[index];
}

function isPermissionValid() {
  let options = ['Grant permission', 'Revoke permission'];
  let index = readlineSync.keyInSelect(options, 'What do you want to do?', {cancel: false});
  return index == 0;
}

async function changePermission(delegate, moduleAddress, permission, isValid) {
  let changePermissionAction = generalPermissionManager.methods.changePermission(delegate, moduleAddress, web3.utils.asciiToHex(permission), isValid);
  let receipt = await common.sendTransaction(Issuer, changePermissionAction, defaultGasPrice, 0, 1.5);
  common.getEventFromLogs(generalPermissionManager._jsonInterface, receipt.logs, 'LogChangePermission');
  console.log(`Permission changed succesfully,`);
}

// Helper functions
async function getDelegates() {
  let result = [];

  let events = await generalPermissionManager.getPastEvents('LogAddPermission', { fromBlock: 0});
  for (let event of events) {
    let delegate = {};
    delegate.address = event.returnValues._delegate;
    delegate.details = web3.utils.hexToAscii(event.returnValues._details);
    result.push(delegate);
  }

  return result;
}

async function addNewDelegate() {
  let newDelegate = readlineSync.question('Enter the delegate address: ', {
    limit: function (input) {
      return web3.utils.isAddress(input);
    },
    limitMessage: "Must be a valid address"
  });
  let details = readlineSync.question('Enter the delegate details (i.e `Belongs to financial firm`): ', {
    limit: function(input) {
      return input.length > 0;
    },
    limitMessage: "Must be a valid string"
  });
  let addPermissionAction = generalPermissionManager.methods.addPermission(newDelegate, web3.utils.asciiToHex(details));
  let receipt = await common.sendTransaction(Issuer, addPermissionAction, defaultGasPrice);
  let event = common.getEventFromLogs(generalPermissionManager._jsonInterface, receipt.logs, 'LogAddPermission');
  console.log(`Delegate added succesfully: ${event._delegate} - ${event._details}`);
  return event._delegate;
}

async function getModulesWithPermissions() {
  let modules = [];
  let moduleABI = abis.moduleInterface();
  
  for (const type in MODULES_TYPES) {
    let counter = 0;
    let keepIterating = true;
    while (keepIterating) {
      try {
        let details = await securityToken.methods.getModule(MODULES_TYPES[type], counter).call();
        if (details[1] != "0x0000000000000000000000000000000000000000") {
          let contractTemp = new web3.eth.Contract(moduleABI, details[1]);
          let permissions = await contractTemp.methods.getPermissions().call();
          if (permissions.length > 0) {
            modules.push({ 
              name: web3.utils.hexToAscii(details[0]),
              address: details[1],
              permissions: permissions.map(function (p) { return web3.utils.hexToAscii(p) })
            })
          }
          counter++;
        } else {
          keepIterating = false;
        }
      } catch (error) {
        keepIterating = false;
      }
    }
  }

  return modules;
}

module.exports = {
  executeApp: async function(remoteNetwork) {
        return executeApp(remoteNetwork);
    }
}