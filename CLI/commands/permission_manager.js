var readlineSync = require('readline-sync');
var chalk = require('chalk');
var common = require('./common/common_functions');
var gbl = require('./common/global');
var contracts = require('./helpers/contract_addresses');
var abis = require('./helpers/contract_abis');

// App flow
let tokenSymbol;
let securityTokenRegistry;
let securityToken;
let generalPermissionManager;
let isNewDelegate = false;

async function executeApp() {

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
  let result = await securityToken.methods.getModulesByName(web3.utils.toHex('GeneralPermissionManager')).call();
  if (result.length == 0) {
    console.log(chalk.red(`General Permission Manager is not attached.`));
    if (readlineSync.keyInYNStrict('Do you want to add General Permission Manager Module to your Security Token?')) {
      let permissionManagerFactoryAddress = await contracts.getModuleFactoryAddressByName(securityToken.options.address, gbl.constants.MODULES_TYPES.PERMISSION, 'GeneralPermissionManager');
      let addModuleAction = securityToken.methods.addModule(permissionManagerFactoryAddress, web3.utils.fromAscii('', 16), 0, 0);
      let receipt = await common.sendTransaction(addModuleAction);
      let event = common.getEventFromLogs(securityToken._jsonInterface, receipt.logs, 'ModuleAdded');
      console.log(`Module deployed at address: ${event._module}`);
      generalPermissionManagerAddress = event._module;
    } else {
      process.exit(0);
    }
  } else {
    generalPermissionManagerAddress = result[0];
  }

  let generalPermissionManagerABI = abis.generalPermissionManager();
  generalPermissionManager = new web3.eth.Contract(generalPermissionManagerABI, generalPermissionManagerAddress);
  generalPermissionManager.setProvider(web3.currentProvider);
}

async function changePermissionStep() {
  console.log('\n\x1b[34m%s\x1b[0m',"Permission Manager - Change Permission");
  let selectedDelegate = await selectDelegate();
  if (isNewDelegate) {
    isNewDelegate = false;
    changePermissionAction(selectedDelegate);
  } else {
    let selectFlow = readlineSync.keyInSelect(['Remove', 'Change permission'], 'Select an option:', {cancel: false});
    if (selectFlow == 0) {
      await deleteDelegate(selectedDelegate);
      console.log("Delegate successfully deleted.")
    } else {
      changePermissionAction(selectedDelegate);
    }
  }
}

async function changePermissionAction(selectedDelegate) {
  let selectedModule = await selectModule();
  let selectedPermission = await selectPermission(selectedModule.permissions);
  let isValid = isPermissionValid();
  await changePermission(selectedDelegate, selectedModule.address, selectedPermission, isValid);
}

async function deleteDelegate(address) {
  let deleteDelegateAction = generalPermissionManager.methods.deleteDelegate(address);
  await common.sendTransaction(deleteDelegateAction, {factor: 2});
}

// Helper functions
async function selectDelegate() {
  let result;
  let delegates = await getDelegates();
  let permissions = await getDelegatesAndPermissions();
  
  let options = ['Add new delegate'];

  options = options.concat(delegates.map(function(d) { 
    let perm = renderTable(permissions, d.address);

    return `Account: ${d.address}
    Details: ${d.details}
    Permisions: ${perm}`
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
  let receipt = await common.sendTransaction(changePermissionAction, {factor: 2});
  common.getEventFromLogs(generalPermissionManager._jsonInterface, receipt.logs, 'ChangePermission');
  console.log(`Permission changed succesfully,`);
}

async function getDelegates() {
  let result = [];
  /*
  let events = await generalPermissionManager.getPastEvents('LogAddPermission', { fromBlock: 0});
  for (let event of events) {
    let delegate = {};
    delegate.address = event.returnValues._delegate;
    delegate.details = web3.utils.hexToAscii(event.returnValues._details);
    result.push(delegate);
  }
  */
  let delegates = await generalPermissionManager.methods.getAllDelegates().call();
  for (let d of delegates) {
    let delegate = {};
    delegate.address = d;
    delegate.details = web3.utils.hexToAscii(await generalPermissionManager.methods.delegateDetails(d).call());
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

  let addPermissionAction = generalPermissionManager.methods.addDelegate(newDelegate, web3.utils.asciiToHex(details));
  let receipt = await common.sendTransaction(addPermissionAction);
  let event = common.getEventFromLogs(generalPermissionManager._jsonInterface, receipt.logs, 'AddDelegate');
  console.log(`Delegate added succesfully: ${event._delegate} - ${web3.utils.hexToAscii(event._details)}`);
  isNewDelegate = true;
  return event._delegate;
}

async function getModulesWithPermissions() {
  let modules = [];
  let moduleABI = abis.moduleInterface();
  
  for (const type in gbl.constants.MODULES_TYPES) {
    let modulesAttached = await securityToken.methods.getModulesByType(gbl.constants.MODULES_TYPES[type]).call();
    for (const m of modulesAttached) {
      let contractTemp = new web3.eth.Contract(moduleABI, m);
      let permissions = await contractTemp.methods.getPermissions().call();
      if (permissions.length > 0) {
        modules.push({ 
          name: web3.utils.hexToAscii((await securityToken.methods.getModule(m).call())[0]),
          address: m,
          permissions: permissions.map(function (p) { return web3.utils.hexToAscii(p) })
        })
      }
    }
  }

  return modules;
}

async function getDelegatesAndPermissions() {
  let moduleABI = abis.moduleInterface();
  let result = [];
  for (const type in gbl.constants.MODULES_TYPES) {
    let modulesAttached = await securityToken.methods.getModulesByType(gbl.constants.MODULES_TYPES[type]).call();
    for (const module of modulesAttached) {
      let contractTemp = new web3.eth.Contract(moduleABI, module);
      let permissions = await contractTemp.methods.getPermissions().call();
      if (permissions.length > 0) {
        for (const permission of permissions) {
          let allDelegates = await generalPermissionManager.methods.getAllDelegatesWithPerm(module, permission).call();
          let moduleName = web3.utils.hexToUtf8((await securityToken.methods.getModule(module).call())[0]);
          let permissionName = web3.utils.hexToUtf8(permission);
          for (delegateAddr of allDelegates) {
            if (result[delegateAddr] == undefined) {
              result[delegateAddr] = []
            } 
            if (result[delegateAddr][moduleName + '-' + module] == undefined) {
              result[delegateAddr][moduleName + '-' + module] = [{permission: permissionName}]
            } else {
              result[delegateAddr][moduleName + '-' + module].push({permission: permissionName})
            }
          }
        }
      }
    }
  }
  return result
}

function renderTable(permissions, address) {
  let result = ``;
  if (permissions[address] != undefined) {
    Object.keys(permissions[address]).forEach((module) => {
      result += `
      ${module.split('-')[0]} (${module.split('-')[1]}) -> `;
      (permissions[address][module]).forEach((perm) => {
        result += `${perm.permission}, `;
      })
      result = result.slice(0, -2);
    })
  } else {
    result += `-`;
  }
  return result
}

module.exports = {
  executeApp: async function() {
        return executeApp();
    }
}