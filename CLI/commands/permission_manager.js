var readlineSync = require('readline-sync');
var chalk = require('chalk');
var common = require('./common/common_functions');
var gbl = require('./common/global');
var contracts = require('./helpers/contract_addresses');
var abis = require('./helpers/contract_abis');
const input = require('./IO/input');

// App flow
let securityTokenRegistry;
let securityToken;
let polyToken;
let currentPermissionManager;

async function executeApp() {
  console.log('\n', chalk.blue('Permission Manager - Main Menu', '\n'));
  
  let pmModules = await common.getAllModulesByType(securityToken, gbl.constants.MODULES_TYPES.PERMISSION);
  let nonArchivedModules = pmModules.filter(m => !m.archived);
  if (nonArchivedModules.length > 0) {
    console.log(`Permission Manager modules attached:`);
    nonArchivedModules.map(m => `${m.label}: ${m.name} (${m.version}) at ${m.address}`);
  } else {
    console.log(`There are no Permission Manager modules attached`);
  }

  let options = [];
  if (pmModules.length > 0) {
    options.push('Config existing modules');
  }
  options.push('Add new Permission Manager module');
  
  let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'EXIT' });
  let optionSelected = index != -1 ? options[index] : 'EXIT';
  console.log('Selected:', optionSelected, '\n');
  switch (optionSelected) {
    case 'Config existing modules':
      await configExistingModules(nonArchivedModules);
      break;
    case 'Add new Permission Manager module':
      await addPermissionModule();
      break;
    case 'EXIT':
      return;
  }

  await executeApp();
};

async function addPermissionModule() {
  let moduleList = await common.getAvailableModules(moduleRegistry, gbl.constants.MODULES_TYPES.PERMISSION, securityToken.options.address);
  let options = moduleList.map(m => `${m.name} - ${m.version} (${m.factoryAddress})`);

  let index = readlineSync.keyInSelect(options, 'Which permission manager module do you want to add? ', { cancel: 'Return' });
  if (index != -1 && readlineSync.keyInYNStrict(`Are you sure you want to add ${options[index]}? `)) {
    const moduleABI = abis.generalPermissionManager();
    await common.addModule(securityToken, polyToken, moduleList[index].factoryAddress, moduleABI);
  }
}

async function configExistingModules(permissionModules) {
  let options = permissionModules.map(m => `${m.label}: ${m.name} (${m.version}) at ${m.address}`);
  let index = readlineSync.keyInSelect(options, 'Which module do you want to config? ', { cancel: 'RETURN' });
  console.log('Selected:', index != -1 ? options[index] : 'RETURN', '\n');
  currentPermissionManager = new web3.eth.Contract(abis.generalPermissionManager(), permissionModules[index].address);
  currentPermissionManager.setProvider(web3.currentProvider);

  await permissionManager();
}

async function permissionManager() {
  console.log(chalk.blue('\n', `Permission module at ${currentPermissionManager.options.address}`), '\n');

  let delegates = await currentPermissionManager.methods.getAllDelegates().call();

  console.log(`- Delegates:              ${delegates.length}`);

  let options = ['Manage delegates'];
  if (parseInt(delegates) > 0) {
    options.push('Explore account', 'Change permission');
  }

  let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'RETURN' });
  let selected = index != -1 ? options[index] : 'RETURN';
  console.log('Selected:', selected, '\n');
  switch (selected) {
    case 'Manage delegates':
      await manageDelegates(delegates);
      break;
    case 'Explore account':
      await exploreAccount();
      break;
    case 'Change permission':
      await changePermission();
      break
    case 'RETURN':
      return;
  }

  await permissionManager();
}

async function manageDelegates(currentDelegates) {
  let options = ['Add delegate'];
  if (currentDelegates.length > 0) {
    options.push('Delete delegate');
  }

  let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: 'RETURN' });
  let selected = index == -1 ? 'RETURN' : options[index];
  console.log('Selected:', selected);
  switch (selected) {
    case 'Add delegate':
      await addNewDelegate();
      break;
    case 'Delete delegate':
      let delegateToDelete = await selectDelegate();
      if (readlineSync.keyInYNStrict(`Are you sure you want to delete delegate ${delegateToDelete}?`)) {
        await deleteDelegate(delegateToDelete);
      }
      break;
  }
}

async function addNewDelegate() {
  let newDelegate = input.readAddress('Enter the delegate address: ');
  let details = input.readStringNonEmpty('Enter the delegate details (i.e `Belongs to financial firm`): ');

  let addPermissionAction = currentPermissionManager.methods.addDelegate(newDelegate, web3.utils.asciiToHex(details));
  let receipt = await common.sendTransaction(addPermissionAction);
  let event = common.getEventFromLogs(currentPermissionManager._jsonInterface, receipt.logs, 'AddDelegate');
  console.log(`Delegate added successfully: ${event._delegate} - ${web3.utils.hexToAscii(event._details)}`);
}

async function deleteDelegate(address) {
  let deleteDelegateAction = currentPermissionManager.methods.deleteDelegate(address);
  await common.sendTransaction(deleteDelegateAction, { factor: 2 });
  console.log(`Delegate ${address} deleted successfully!`);
}

async function exploreAccount() {
  let accountToExplore = input.readAddress('Enter the account address you want to explore: ');

  let isDelegate = await currentPermissionManager.methods.checkDelegate(accountToExplore).call();
  if (!isDelegate) {
    console.log(chalk.yellow(`${accountToExplore} is not a delegate.\n`));
  } else {
    let delegate = {};
    delegate.address = accountToExplore;
    delegate.details = web3.utils.hexToUtf8(await currentPermissionManager.methods.delegateDetails(accountToExplore).call());
    delegate.permissions = renderTable(await getPermissionsByDelegate(accountToExplore));

    console.log(`Account: ${delegate.address}
    Details: ${delegate.details}
    Permisions: ${delegate.permissions}`);
  }
}

async function changePermission() {
  let selectedDelegate = await selectDelegate();
  let selectedModule = await selectModule();
  let selectedPermission = await selectPermission(selectedModule.permissions);
  let isValid = await isPermissionValid();
  let changePermissionAction = currentPermissionManager.methods.changePermission(selectedDelegate, selectedModule.address, web3.utils.asciiToHex(selectedPermission), isValid);
  let receipt = await common.sendTransaction(changePermissionAction, { factor: 2 });
  common.getEventFromLogs(currentPermissionManager._jsonInterface, receipt.logs, 'ChangePermission');
  console.log(`Permission changed successfully!`);
}

// Helper functions
async function selectDelegate() {
  let delegatesAndPermissions = await getDelegatesAndPermissions();

  options = delegatesAndPermissions.map(function (d) {
    let perm = renderTable(d.permissions);

    return `Account: ${d.address}
    Details: ${d.details}
    Permisions: ${perm}`
  });

  let index = readlineSync.keyInSelect(options, 'Select a delegate:', { cancel: false });
  return delegatesAndPermissions[index].address;
}

async function selectModule() {
  let modules = await getModulesWithPermissions();
  let options = modules.map(function (m) {
    return `${m.label} - ${m.name} at ${m.address}`;
  });
  let index = readlineSync.keyInSelect(options, 'Select a module:', { cancel: false });
  return modules[index];
}

async function selectPermission(permissions) {
  let options = permissions.map(function (p) {
    return p
  });
  let index = readlineSync.keyInSelect(options, 'Select a permission:', { cancel: false });
  return permissions[index];
}

async function isPermissionValid() {
  let options = ['Grant permission', 'Revoke permission'];
  let index = readlineSync.keyInSelect(options, 'What do you want to do?', { cancel: false });
  return index == 0;
}

async function getDelegates() {
  let result = [];
  let delegates = await currentPermissionManager.methods.getAllDelegates().call();
  for (let d of delegates) {
    let delegate = {};
    delegate.address = d;
    delegate.details = web3.utils.hexToAscii(await currentPermissionManager.methods.delegateDetails(d).call());
    result.push(delegate);
  }
  return result;
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
        let moduleData = await securityToken.methods.getModule(m).call();
        modules.push({
          label: web3.utils.hexToAscii(moduleData.moduleLabel),
          name: web3.utils.hexToAscii(moduleData.moduleName),
          address: m,
          permissions: permissions.map(function (p) { return web3.utils.hexToAscii(p) })
        })
      }
    }
  }

  return modules;
}

async function getDelegatesAndPermissions() {
  let allDelegates = await getDelegates();
  for (const d of allDelegates) {
    d.permissions = await getPermissionsByDelegate(d.address);
  }
  return allDelegates
}

async function getPermissionsByDelegate(d) {
  let result = [];
  let perms = await currentPermissionManager.methods.getAllModulesAndPermsFromTypes(d, Object.values(gbl.constants.MODULES_TYPES)).call();
  for (let i = 0; i < perms[0].length; i++) {
    const moduleAddress = perms[0][i];
    const moduleData = await securityToken.methods.getModule(moduleAddress).call();
    const moduleName = web3.utils.hexToUtf8(moduleData.moduleName);
    const moduleLabel = web3.utils.hexToUtf8(moduleData.moduleLabel);
    const permissionName = web3.utils.hexToUtf8(perms[1][i]);
    const moduleKey = moduleLabel + ' - (' + moduleName + ' at ' + moduleAddress + ')';
    if (result[moduleKey] == undefined) {
      result[moduleKey] = [{ permission: permissionName }];
    } else {
      result[moduleKey].push({ permission: permissionName });
    }
  }

  return result;
}

function renderTable(permissions) {
  let result = ``;
  if (typeof permissions !== undefined) {
    Object.keys(permissions).forEach((m) => {
      result += `
      ${m} -> `;
      (permissions[m]).forEach((perm) => {
        result += `${perm.permission}, `;
      })
      result = result.slice(0, -2);
    })
  } else {
    result += `-`;
  }
  return result
}

async function initialize(_tokenSymbol) {
  welcome();
  await setup();
  securityToken = await common.selectToken(securityTokenRegistry, _tokenSymbol);
  if (securityToken === null) {
    process.exit(0);
  }
}

function welcome() {
  common.logAsciiBull();
  console.log("**********************************************");
  console.log("Welcome to the Command-Line Permission Manager");
  console.log("**********************************************");
  console.log("Issuer Account: " + Issuer.address + "\n");
}

async function setup() {
  try {
    let securityTokenRegistryAddress = await contracts.securityTokenRegistry();
    let iSecurityTokenRegistryABI = abis.iSecurityTokenRegistry();
    securityTokenRegistry = new web3.eth.Contract(iSecurityTokenRegistryABI, securityTokenRegistryAddress);
    securityTokenRegistry.setProvider(web3.currentProvider);

    let polyTokenAddress = await contracts.polyToken();
    let polyTokenABI = abis.polyToken();
    polyToken = new web3.eth.Contract(polyTokenABI, polyTokenAddress);
    polyToken.setProvider(web3.currentProvider);

    let moduleRegistryAddress = await contracts.moduleRegistry();
    let moduleRegistryABI = abis.moduleRegistry();
    moduleRegistry = new web3.eth.Contract(moduleRegistryABI, moduleRegistryAddress);
    moduleRegistry.setProvider(web3.currentProvider);
  } catch (err) {
    console.log(err)
    console.log('\x1b[31m%s\x1b[0m', "There was a problem getting the contracts. Make sure they are deployed to the selected network.");
    process.exit(0);
  }
}

module.exports = {
  executeApp: async function (_tokenSymbol) {
    await initialize(_tokenSymbol);
    return executeApp();
  }
}
