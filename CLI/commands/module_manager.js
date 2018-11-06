// Libraries for terminal prompts
var readlineSync = require('readline-sync');
var chalk = require('chalk');
var common = require('./common/common_functions');
var global = require('./common/global');

// Load contract artifacts
var contracts = require('./helpers/contract_addresses');
var abis = require('./helpers/contract_abis');

let securityTokenRegistry;
let securityToken;
let polyToken;

// Init token info
let STSymbol;
let STAddress;
let STDetails;
let validSymbol = false;

// Init Module Info
let pmModules;
let tmModules;
let stoModules;
let cpModules;
let numPM;
let numTM;
let numSTO;
let numCP;

async function setup() {
    try {
        let securityTokenRegistryAddress = await contracts.securityTokenRegistry();
        let securityTokenRegistryABI = abis.securityTokenRegistry();
        securityTokenRegistry = new web3.eth.Contract(securityTokenRegistryABI, securityTokenRegistryAddress);
        securityTokenRegistry.setProvider(web3.currentProvider);

        let polytokenAddress = await contracts.polyToken();
        let polytokenABI = abis.polyToken();
        polyToken = new web3.eth.Contract(polytokenABI, polytokenAddress);
        polyToken.setProvider(web3.currentProvider);
    }catch(err){
        console.log(err);
        console.log(chalk.red(`There was a problem getting the contracts. Make sure they are deployed to the selected network.`));
        process.exit(0);
    }
}

// Start function
async function executeApp() {
    await global.initialize();

    common.logAsciiBull();
    console.log(chalk.yellow(`******************************************`));
    console.log(chalk.yellow(`Welcome to the Command-Line Module Manager`));
    console.log(chalk.yellow(`******************************************`));

    await setup();
    await showUserInfo(Issuer.address);

    while (!validSymbol) {
        await getSecurityToken();
    }
};

// get token contract based on input symbol
async function getSecurityToken() {
    STSymbol = readlineSync.question(chalk.yellow(`\nEnter the symbol of the registered security token you issued: `));
    STAddress = await securityTokenRegistry.methods.getSecurityTokenAddress(STSymbol).call();
    if (STAddress == "0x0000000000000000000000000000000000000000") {
        console.log(chalk.red(`\nToken symbol provided is not a registered Security Token. Please enter another symbol.`));
        return;
    }
    STDetails = await securityTokenRegistry.methods.getSecurityTokenData(STAddress).call();
    if (STDetails[1] != Issuer.address) {
        console.log(chalk.red(`\nYou did not issue the Security Token associated with the symbol provided. Please enter another symbol.`));
        return;
    }
    validSymbol = true;
    let securityTokenABI = abis.securityToken();
    securityToken = new web3.eth.Contract(securityTokenABI, STAddress);

    await displayModules();

}

// display module status
async function displayModules() {

    await showUserInfo(Issuer.address);

    // Security Token details
    let displayTokenSymbol = await securityToken.methods.symbol().call();
    let displayTokenSupply = await securityToken.methods.totalSupply().call();
    let displayUserTokens = await securityToken.methods.balanceOf(Issuer.address).call();

    console.log(`
    **************    Security Token Information    ***************
    - Address:           ${STAddress}
    - Token symbol:      ${displayTokenSymbol.toUpperCase()}
    - Total supply:      ${web3.utils.fromWei(displayTokenSupply)} ${displayTokenSymbol.toUpperCase()}
    - User balance:      ${web3.utils.fromWei(displayUserTokens)} ${displayTokenSymbol.toUpperCase()}
    `);

    // Module Details
    pmModules = await iterateModules(1);
    tmModules = await iterateModules(2);
    stoModules = await iterateModules(3);
    cpModules = await iterateModules(4);

    // Module Counts
    numPM = pmModules.length;
    numTM = tmModules.length;
    numSTO = stoModules.length;
    numCP = cpModules.length;

    console.log(`
    ******************    Module Information    *******************
    - Permission Manager:   ${(numPM > 0) ? numPM : 'None'}
    - Transfer Manager:     ${(numTM > 0) ? numTM : 'None'}
    - STO:                  ${(numSTO > 0) ? numSTO : 'None'}
    - Checkpoint:           ${(numCP > 0) ? numCP : 'None'}
    `);

    if (numPM) {
        console.log(chalk.green(`\n    Permission Manager Modules:`));
        for (i=0;i<numPM;i+=1) {
            console.log(`    - ${pmModules[i].name} is ${(pmModules[i].archived)?'Archived':'Unarchived'} at ${pmModules[i].address}`);
        }
    }

    if (numTM) {
        console.log(chalk.green(`\n    Transfer Manager Modules:`));
        for (i=0;i<numTM;i+=1) {
            console.log(`    - ${tmModules[i].name} is ${(tmModules[i].archived)?'Archived':'Unarchived'} and ${(tmModules[i].paused)?'Paused':'Unpaused'} at ${tmModules[i].address}`);
        }
    }

    if (numSTO) {
        console.log(chalk.green(`\n    STO Modules:`));
        for (i=0;i<numSTO;i+=1) {
            console.log(`    - ${stoModules[i].name} is ${(stoModules[i].archived)?'Archived':'Unarchived'} and ${(stoModules[i].paused)?'Paused':'Unpaused'} at ${stoModules[i].address}`);
        }
    }

    if (numCP) {
        console.log(chalk.green(`\n    Checkpoint Modules:`));
        for (i=0;i<numCP;i+=1) {
            console.log(`    - ${cpModules[i].name} is ${(cpModules[i].archived)?'Archived':'Unarchived'} at ${cpModules[i].address}`);
        }
    }
    selectAction();
}

async function iterateModules(_moduleType) {

    function ModuleInfo(_moduleType, _name, _address, _factoryAddress, _archived, _paused, _abi, _contract) {
        this.name = _name;
        this.type = _moduleType;
        this.address = _address;
        this.factoryAddress = _factoryAddress;
        this.archived = _archived;
        this.paused = _paused;
        this.abi = _abi;
        this.contract = _contract;
    }

    let modules = [];

    let allModules = await securityToken.methods.getModulesByType(_moduleType).call();

    for (let i = 0; i < allModules.length; i++) {
        try {
            let details = await securityToken.methods.getModule(allModules[i]).call();
            let nameTemp = web3.utils.hexToUtf8(details[0]);
            let abiTemp = JSON.parse(require('fs').readFileSync(`./build/contracts/${nameTemp}.json`).toString()).abi;
            let contractTemp = new web3.eth.Contract(abiTemp, details[1]);
            let pausedTemp = false;
            if (_moduleType == 2 || _moduleType == 3) {
                pausedTemp = await contractTemp.methods.paused().call();
            }
            modules.push(new ModuleInfo(_moduleType, nameTemp, details[1], details[2], details[3], pausedTemp, abiTemp, contractTemp));
        } catch(error) {
          console.log(error);
          console.log(chalk.red(`
            *************************
            Unable to iterate over module type - unexpected error
            *************************`));
        }
    }
    return modules;
}

async function selectAction() {
    let options = ['Add a module','Pause / unpause a module','Archive a module','Unarchive a module','Remove a module','Change module budget','Whitelist an address for a year','Mint tokens','Freeze minting permanently','Exit'];
    let index = readlineSync.keyInSelect(options, chalk.yellow('What do you want to do?'), {cancel: false});
    console.log("\nSelected:",options[index]);
    switch (index) {
        case 0:
            await addModule();
            break;
        case 1:
            await pauseModule();
            break;
        case 2:
            await archiveModule();
            break;
        case 3:
            await unarchiveModule();
            break;
        case 4:
            await removeModule();
            break;
        case 5:
            await changeBudget();
            break;
        case 6:
            await whitelist();
            break;
        case 7:
            await mintTokens();
            break;
        case 8:
            await freezeMinting();
            break;
        case 9:
            process.exit();
    }
    displayModules()
}

function backToMenu() {
    let options = ['Return to Menu','Exit'];
    let index = readlineSync.keyInSelect(options, chalk.yellow('What do you want to do?'), {cancel: false});
    switch (index) {
        case 0:
            break;
        case 1:
            process.exit();
    }
}

// Actions
async function addModule() {
    console.log(chalk.red(`
    *********************************
    This option is not yet available.
    *********************************`));
    backToMenu();
}

async function pauseModule() {
    console.log(chalk.red(`
    *********************************
    This option is not yet available.
    *********************************`));
    backToMenu();
}

async function archiveModule() {

    function ModuleInfo(_module) {
        this.module = _module;
    }
    let options = [];
    let modules = [];

    function pushModules(_arrayModules) {
        for (i=0;i<_arrayModules.length;i+=1) {
            if (!_arrayModules[i].isArchived) {
              options.push(_arrayModules[i].name);
              modules.push(new ModuleInfo(_arrayModules[i]));
            }
        }
    }

    pushModules(pmModules);
    pushModules(tmModules);
    pushModules(stoModules);
    pushModules(cpModules);

    let index = readlineSync.keyInSelect(options, chalk.yellow('Which module would you like to archive?'));
    if (index != -1) {
        console.log("\nSelected: ",options[index]);
        let archiveModuleAction = securityToken.methods.archiveModule(modules[index].module.address);
        await common.sendTransaction(archiveModuleAction, {factor: 2});
        console.log(chalk.green(`\nSuccessfully archived ${modules[index].module.name}.`));
    }
    backToMenu()
}

async function unarchiveModule() {

    function ModuleInfo(_module) {
        this.module = _module;
    }
    let options = [];
    let modules = [];

    function pushModules(_arrayModules) {
        for (i=0;i<_arrayModules.length;i+=1) {
            if (_arrayModules[i].archived) {
              options.push(_arrayModules[i].name);
              modules.push(new ModuleInfo(_arrayModules[i]));
            }
        }
    }

    pushModules(pmModules);
    pushModules(tmModules);
    pushModules(stoModules);
    pushModules(cpModules);

    let index = readlineSync.keyInSelect(options, chalk.yellow('Which module whould you like to unarchive?'));
    if (index != -1) {
        console.log("\nSelected: ",options[index]);
        let unarchiveModuleAction = securityToken.methods.unarchiveModule(modules[index].module.address);
        await common.sendTransaction(unarchiveModuleAction, {factor: 2});
        console.log(chalk.green(`\nSuccessfully unarchived ${modules[index].module.name}.`));
    }
    backToMenu()
}


async function removeModule() {

    function ModuleInfo(_module) {
        this.module = _module;
    }
    let options = [];
    let modules = [];

    function pushModules(_arrayModules) {
        for (i=0;i<_arrayModules.length;i+=1) {
            if (_arrayModules[i].archived) {
              options.push(_arrayModules[i].name);
              modules.push(new ModuleInfo(_arrayModules[i]));
            }
        }
    }

    pushModules(pmModules);
    pushModules(tmModules);
    pushModules(stoModules);
    pushModules(cpModules);

    let index = readlineSync.keyInSelect(options, chalk.yellow('Which module whould you like to remove?'));
    if (index != -1) {
        console.log("\nSelected: ",options[index]);
        let removeModuleAction = securityToken.methods.removeModule(modules[index].module.address);
        await common.sendTransaction(defaultGasPrice, {factor: 2});
        console.log(chalk.green(`\nSuccessfully removed ${modules[index].module.name}.`));
    }
    backToMenu()
}

async function changeBudget() {
    console.log(chalk.red(`
    *********************************
    This option is not yet available.
    *********************************`));
    backToMenu();
}

async function whitelist() {
    try {
        let generalTransferManager = tmModules[0].contract;
        let investor = readlineSync.question(chalk.yellow(`Enter the address to be whitelisted: `));
        let now = await latestTime();
        let modifyWhitelistAction = generalTransferManager.methods.modifyWhitelist(investor, now, now, now + 31556952, true);
        await common.sendTransaction(modifyWhitelistAction);
        console.log(chalk.green(`\nWhitelisting successful for ${investor}.`));
    } catch (e) {
        console.log(e);
        console.log(chalk.red(`
    *************************
    Whitelist is not possible - Please make sure GeneralTransferManager is attached
    *************************`));
    }
    backToMenu();
}

async function mintTokens() {
    if (await securityToken.methods.mintingFrozen().call()) {
        console.log(chalk.red("Minting is not possible - Minting has been permanently frozen by issuer"));
        return;
    }

    let _investor = readlineSync.question(chalk.yellow(`Enter the address to receive the tokens: `));
    let _amount = readlineSync.question(chalk.yellow(`Enter the amount of tokens to mint: `));
    try {
        let mintAction = securityToken.methods.mint(_investor, web3.utils.toWei(_amount));
        await common.sendTransaction(mintAction);
        console.log(chalk.green(`\nMinting Successful.`));
    } catch (e) {
        console.log(e);
        console.log(chalk.red(`
    **************************
    Minting was not successful - Please make sure beneficiary address has been whitelisted
    **************************`));
    }

    backToMenu()
}

async function freezeMinting() {
    let featureRegistryAddress = await contracts.featureRegistry();
    let featureRegistryABI = abis.featureRegistry();
    let featureRegistry = new web3.eth.Contract(featureRegistryABI, featureRegistryAddress);
    featureRegistry.setProvider(web3.currentProvider);

    if (await featureRegistry.methods.getFeatureStatus('freezeMintingAllowed').call()) {
        let freezeMintingAction = securityToken.methods.freezeMinting();
        await common.sendTransaction(freezeMintingAction);
        console.log(chalk.green(`\nFreeze minting was successful.`));
    } else {
        console.log(chalk.red(`\nFreeze minting is not allowed by Polymath.`));
    }

    backToMenu();
}

// Helpers
async function latestTime() {
    let block = await web3.eth.getBlock('latest')
    return block.timestamp;
}

async function showUserInfo(_user) {
    console.log(`
    *******************    User Information    ********************
    - Address:           ${_user}
    - POLY balance:      ${await polyBalance(_user)}
    - ETH balance:       ${web3.utils.fromWei(await web3.eth.getBalance(_user))}
    `);
}

async function polyBalance(_user) {
    let balance = await polyToken.methods.balanceOf(_user).call();
    return web3.utils.fromWei(balance);
}

module.exports = {
    executeApp: async function() {
          return executeApp();
      }
}
