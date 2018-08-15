'use strict'

var readlineSync = require('readline-sync');
var chalk = require('chalk');
const Web3 = require('web3');
var abis = require('./helpers/contract_abis');
var common = require('./common/common_functions');

if (typeof web3 !== 'undefined') {
    web3 = new Web3(web3.currentProvider);
} else {
    // set the provider you want from Web3.providers
    web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

let Issuer;
let defaultGasPrice;
let accounts;

async function executeApp(fromStrAddress, toStrAddress) {
    accounts = await web3.eth.getAccounts();
    Issuer = accounts[0];
    defaultGasPrice = new web3.utils.BN(common.getGasPrice(await web3.eth.net.getId()));

    common.logAsciiBull();
    console.log("****************************************");
    console.log("Welcome to the Command-Line STR Migrator");
    console.log("****************************************");
    console.log("The following script will migrate tokens from old STR to new one.");
    console.log("\n");
  
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
            let tokenOwner = await token.methods.owner().call();
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
            let GAS = await common.estimateGas(addCustomSTAction, Issuer, 1.2);
            await addCustomSTAction.send({ from: Issuer, gas: GAS, gasPrice: defaultGasPrice})
            .on('transactionHash', function (hash) {
                console.log(`Congrats! Your Add Custom Security Token tx populated successfully`);
                console.log(`Your transaction is being processed. Please wait...`);
                console.log(`TxHash: ${hash}\n`);
            })
            .on('receipt', function (receipt) {
                console.log(chalk.green(`Congratulations! The transaction was successfully completed.`));
                console.log(`Gas used: ${receipt.gasUsed} - Gas spent: ${web3.utils.fromWei(defaultGasPrice.mul(new web3.utils.BN(receipt.gasUsed)))} Ether`);
                console.log(`Review it on Etherscan.`);
                console.log(`TxHash: ${receipt.transactionHash}\n`);
                totalGas = totalGas.add(new web3.utils.BN(receipt.gasUsed));
            });
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
    executeApp: async function(fromStrAddress, toStrAddress) {
        return executeApp(fromStrAddress, toStrAddress);
    }
};