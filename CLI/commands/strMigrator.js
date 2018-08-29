var readlineSync = require('readline-sync');
var chalk = require('chalk');
var abis = require('./helpers/contract_abis');
var common = require('./common/common_functions');
var global = require('./common/global');

async function executeApp(fromStrAddress, toStrAddress, remoteNetwork) {
    await global.initialize(remoteNetwork);

    common.logAsciiBull();
    console.log("****************************************");
    console.log("Welcome to the Command-Line STR Migrator");
    console.log("****************************************");
    console.log("The following script will migrate tokens from old STR to new one.");
    console.log("Issuer Account: " + Issuer.address + "\n");
  
    try {
        let fromSTR = step_instance_fromSTR(fromStrAddress);
        let toSTR = step_instance_toSTR(toStrAddress);        
        let tokens = await step_get_deployed_tokens(fromSTR);
        await step_add_Custom_STs(tokens, toSTR);
    } catch (err) {
        console.log(err);
        return;
    }
}

function step_instance_fromSTR(fromStrAddress){
    let _fromStrAddress;
    if (typeof fromStrAddress !== 'undefined') {
        if (web3.utils.isAddress(fromStrAddress)) {
            _fromStrAddress = fromStrAddress;
        } else {
            console.log(chalk.red("Entered fromStrAddress is not a valid address."));
            return;
        }
    } else {
        _fromStrAddress = readlineSync.question('Enter the old SecurityTokenRegistry address to migrate FROM: ', {
            limit: function(input) {
              return web3.utils.isAddress(input);
            },
            limitMessage: "Must be a valid address"
        }); 
    }

    console.log(`Creating SecurityTokenRegistry contract instance of address: ${_fromStrAddress}...`);
    let securityTokenRegistryABI = abis.securityTokenRegistry();
    let fromSTR = new web3.eth.Contract(securityTokenRegistryABI, _fromStrAddress);
    fromSTR.setProvider(web3.currentProvider);

    return fromSTR;
}

function step_instance_toSTR(toStrAddress){
    let _toStrAddress;
    if (typeof toStrAddress !== 'undefined') {
        if (web3.utils.isAddress(toStrAddress)) {
            _toStrAddress = toStrAddress;
        } else {
            console.log(chalk.red("Entered toStrAddress is not a valid address."));
            return;
        }
    } else {
        _toStrAddress = readlineSync.question('Enter the new SecurityTokenRegistry address to migrate TO: ', {
            limit: function(input) {
              return web3.utils.isAddress(input);
            },
            limitMessage: "Must be a valid address"
        }); 
    }

    console.log(`Creating SecurityTokenRegistry contract instance of address: ${_toStrAddress}...`);
    let securityTokenRegistryABI = abis.securityTokenRegistry();
    let toSTR = new web3.eth.Contract(securityTokenRegistryABI, _toStrAddress);
    toSTR.setProvider(web3.currentProvider);

    return toSTR;
}

async function step_get_deployed_tokens(securityTokenRegistry) {
    let tokens = [];
    
    let events = await securityTokenRegistry.getPastEvents('LogNewSecurityToken', { fromBlock: 0});
    if (events.length == 0) {
        console.log("No security token events were emitted.");
    } else {
        for (let event of events) {
            console.log(`-------- LogNewSecurityToken event --------`);
            console.log(`Ticker: ${event.returnValues._ticker}`);
            console.log(`Token address: ${event.returnValues._securityTokenAddress}`);
            console.log(`Transaction hash: ${event.transactionHash}`);
            console.log(`-------------------------------------------`);
            console.log(`\n`);

            let tokenAddress = event.returnValues._securityTokenAddress;
            let securityTokenABI = abis.securityToken();
            console.log(`Creating SecurityToken contract instance of address: ${tokenAddress}...`);
            let token = new web3.eth.Contract(securityTokenABI, tokenAddress);
            token.setProvider(web3.currentProvider);

            let tokenName = await token.methods.name().call();
            let tokenSymbol = await token.methods.symbol().call();
            let tokenOwner = event.returnValues._owner;//await token.methods.owner().call();
            let tokenDetails = await token.methods.tokenDetails().call();
            let tokenSwarmHash = '';
            
            tokens.push({ name: tokenName, symbol: tokenSymbol, owner: tokenOwner, details: tokenDetails, address: tokenAddress, swarmHash: tokenSwarmHash });
        }
    }

    console.log(chalk.yellow(`${tokens.length} found and they are going to be migrated!`));
    return tokens;
}

async function step_add_Custom_STs(tokens, toStr) {
    let i = 0;
    let succeed = [];
    let failed = [];
    let totalGas = new web3.utils.BN(0);
    for (const t of tokens) {
        console.log(`\n`);
        console.log(`-------- Migrating token No ${++i}--------`);
        console.log(`Token symbol: ${t.symbol}`);
        console.log(`Token address: ${t.address}`);
        console.log(`\n`);
        try {
            let addCustomSTAction = toStr.methods.addCustomSecurityToken(t.name, t.symbol, t.owner, t.address, t.details, web3.utils.asciiToHex(t.swarmHash));
            let receipt = await common.sendTransaction(Issuer, addCustomSTAction, defaultGasPrice);
            totalGas = totalGas.add(new web3.utils.BN(receipt.gasUsed));
            succeed.push(t);
        } catch (error) {
            failed.push(t);
            console.log(chalk.red(`Transaction failed!!! `))
            console.log(error);
        }
    }

    logResults(succeed, failed, totalGas);
}

function logResults(succeed, failed, totalGas) {
    console.log(`
--------------------------------------------
----------- Migration Results -----------
--------------------------------------------
Successful migrations: ${succeed.length}
Failed migrations:     ${failed.length}
Total gas consumed:    ${totalGas}
Total gas cost:        ${web3.utils.fromWei(defaultGasPrice.mul(totalGas))} ETH
List of failed registrations:
${failed.map(token => chalk.red(`${token.symbol} at ${token.address}`)).join('\n')}
`);
}

module.exports = {
    executeApp: async function(fromStrAddress, toStrAddress, remoteNetwork) {
        return executeApp(fromStrAddress, toStrAddress, remoteNetwork);
    }
};