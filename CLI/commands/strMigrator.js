var readlineSync = require('readline-sync');
var chalk = require('chalk');
var request = require('request-promise')
var abis = require('./helpers/contract_abis');
var contracts = require('./helpers/contract_addresses');
var common = require('./common/common_functions');
var global = require('./common/global');

let network;

async function executeApp(toStrAddress, fromTrAddress, fromStrAddress, remoteNetwork) {
    network = remoteNetwork;
    await global.initialize(remoteNetwork);

    common.logAsciiBull();
    console.log("****************************************");
    console.log("Welcome to the Command-Line STR Migrator");
    console.log("****************************************");
    console.log("The following script will migrate tokens from old STR to new one.");
    console.log("Issuer Account: " + Issuer.address + "\n");
  
    try {
        let toSecurityTokenRegistry = await step_instance_toSTR(toStrAddress);
        let fromTickerRegistry = await step_instance_fromTR(fromTrAddress);
        let tickers = await step_get_registered_tickers(fromTickerRegistry);
        await step_register_tickers(tickers, toSecurityTokenRegistry); 
        let fromSecurityTokenRegistry = await step_instance_fromSTR(fromStrAddress);
        let tokens = await step_get_deployed_tokens(fromSecurityTokenRegistry);           
        await step_launch_STs(tokens, toSecurityTokenRegistry); 
    } catch (err) {
        console.log(err);
        return;
    }
}

async function step_instance_toSTR(toStrAddress){
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

async function step_instance_fromTR(fromTrAddress){
    let _fromTrAddress;
    if (typeof fromTrAddress !== 'undefined') {
        if (web3.utils.isAddress(fromTrAddress)) {
            _fromTrAddress = fromTrAddress;
        } else {
            console.log(chalk.red("Entered fromTrAddress is not a valid address."));
            return;
        }
    } else {
        _fromTrAddress = readlineSync.question('Enter the old TikcerRegistry address to migrate FROM: ', {
            limit: function(input) {
              return web3.utils.isAddress(input);
            },
            limitMessage: "Must be a valid address"
        }); 
    }

    console.log(`Creating TickerRegistry contract instance of address: ${_fromTrAddress}...`);
    let tickerRegistryABI = await getABIfromEtherscan(_fromTrAddress);
    let fromTR = new web3.eth.Contract(tickerRegistryABI, _fromTrAddress);
    fromTR.setProvider(web3.currentProvider);

    return fromTR;
}

async function step_get_registered_tickers(tickerRegistry) {
    let tickers = [];
    let expiryTime = await tickerRegistry.methods.expiryLimit().call();

    let events = await tickerRegistry.getPastEvents('LogRegisterTicker', { fromBlock: 0});
    if (events.length == 0) {
        console.log("No ticker registration events were emitted.");
    } else {
        //for (let event of events) {
        for (let index = 0; index < 2; index++) {
            const event = events[index];
            let details = await tickerRegistry.methods.getDetails(event.returnValues._symbol).call();
            let _symbol = event.returnValues._symbol;
            let _owner = details[0];
            let _name = details[2];
            let _registrationDate = details[1];
            let _status = details[4];
            
            console.log(`------------ Ticker Registered ------------`);
            console.log(`Ticker: ${_symbol}`);
            console.log(`Owner: ${_owner}`);
            console.log(`Token name: ${_name}`);
            console.log(`Timestamp: ${_registrationDate}`);
            console.log(`Transaction hash: ${event.transactionHash}`);
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

    console.log(chalk.yellow(`${tickers.length} tickers found and they are going to be migrated!`));
    return tickers;
}

async function step_register_tickers(tickers, securityTokenRegistry) {
    if (readlineSync.keyInYNStrict(`Do you want to migrate these Tickers?`)) {
        let i = 0;
        let succeed = [];
        let failed = [];
        let totalGas = new web3.utils.BN(0);
        for (const t of tickers) {
            console.log(`\n`);
            console.log(`-------- Migrating ticker No ${++i}--------`);
            console.log(`Ticker: ${t.ticker}`);
            console.log(``);
            try {
                let modifyTickerAction = securityTokenRegistry.methods.modifyTicker(t.owner, t.ticker, t.name, t.registrationDate, t.expiryDate, false);
                let receipt = await common.sendTransaction(Issuer, modifyTickerAction, defaultGasPrice);
                totalGas = totalGas.add(new web3.utils.BN(receipt.gasUsed));
                succeed.push(t);
            } catch (error) {
                failed.push(t);
                console.log(chalk.red(`Transaction failed!!! `))
                console.log(error);
            }
        }

        logTickerResults(succeed, failed, totalGas);
    }
}

async function step_instance_fromSTR(fromStrAddress){
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
    let securityTokenRegistryABI = await getABIfromEtherscan(_fromStrAddress);
    let fromSTR = new web3.eth.Contract(securityTokenRegistryABI, _fromStrAddress);
    fromSTR.setProvider(web3.currentProvider);

    return fromSTR;
}

async function step_get_deployed_tokens(securityTokenRegistry) {
    let tokens = [];
    
    let events = await securityTokenRegistry.getPastEvents('LogNewSecurityToken', { fromBlock: 0});
    if (events.length == 0) {
        console.log("No security token events were emitted.");
    } else {
        for (let event of events) {
            let tokenAddress = event.returnValues._securityTokenAddress;
            let securityTokenABI = JSON.parse(require('fs').readFileSync('./CLI/data/SecurityToken1-4-0.json').toString()).abi;
            console.log(`Creating SecurityToken contract instance of address: ${tokenAddress}...`);
            let token = new web3.eth.Contract(securityTokenABI, tokenAddress);
            token.setProvider(web3.currentProvider);

            let tokenName = await token.methods.name().call();
            let tokenSymbol = await token.methods.symbol().call();
            let tokenOwner = await token.methods.owner().call();
            let tokenDetails = await token.methods.tokenDetails().call();
            let tokenDivisible = await token.methods.granularity().call() == 1;
            let tokenDeployedAt = (await web3.eth.getBlock(event.blockNumber)).timestamp;

            let gmtAddress = (await token.methods.getModule(2, 0).call())[1];
            let gtmABI = JSON.parse(require('fs').readFileSync('./CLI/data/GeneralTransferManager1-4-0.json').toString()).abi;
            let gmt = new web3.eth.Contract(gtmABI, gmtAddress);
            let gtmEvents = await gmt.getPastEvents('LogModifyWhitelist', { fromBlock: event.blockNumber});    

            let mintedEvents = [];
            if (gtmEvents.length > 0) {
                mintedEvents = await token.getPastEvents('Minted', { fromBlock: event.blockNumber});
            }

            console.log(`--------- SecurityToken launched ---------`);
            console.log(`Token address: ${event.returnValues._securityTokenAddress}`);
            console.log(`Symbol: ${tokenSymbol}`);
            console.log(`Name: ${tokenName}`);
            console.log(`Owner: ${tokenOwner}`);
            console.log(`Details: ${tokenDetails}`);
            console.log(`Divisble: ${tokenDivisible}`);
            console.log(`Deployed at: ${tokenDeployedAt}`);
            console.log(`Transaction hash: ${event.transactionHash}`);
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

    console.log(chalk.yellow(`${tokens.length} security tokens found and they are going to be migrated!`));
    return tokens;
}

async function step_launch_STs(tokens, securityTokenRegistry) {
    if (readlineSync.keyInYNStrict(`Do you want to migrate these ${tokens.length} Security Tokens?`)) {
        let i = 0;
        let succeed = [];
        let failed = [];
        let totalGas = new web3.utils.BN(0);
        let polymathRegistryAddress = await contracts.polymathRegistry();
        let STFactoryABI = JSON.parse(require('fs').readFileSync('./build/contracts/STFactory.json').toString()).abi;
        let STFactoryAddress = await securityTokenRegistry.methods.getSTFactoryAddress().call();
        let STFactory = new web3.eth.Contract(STFactoryABI, STFactoryAddress);
        for (const t of tokens) {
            console.log(`\n`);
            console.log(`-------- Migrating token No ${++i}--------`);
            console.log(`Token symbol: ${t.ticker}`);
            console.log(`Token address: ${t.address}`);
            console.log(``);
            try {
                // Deploying 2.0.0 Token
                let deployTokenAction = STFactory.methods.deployToken(t.name, t.ticker, 18, t.details, Issuer.address, t.divisble, polymathRegistryAddress)
                let deployTokenReceipt = await common.sendTransaction(Issuer, deployTokenAction, defaultGasPrice);
                // Instancing Security Token
                let newTokenAddress = deployTokenReceipt.logs.find(l => l.data == "0x00").address;
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
                            gmtEvent.returnValues._investor, 
                            new web3.utils.BN(gmtEvent.returnValues._fromTime), 
                            new web3.utils.BN(gmtEvent.returnValues._toTime), 
                            new web3.utils.BN(gmtEvent.returnValues._expiryTime), 
                            gmtEvent.returnValues._canBuyFromSTO
                        );
                        let modifyWhitelistReceipt = await common.sendTransaction(Issuer, modifyWhitelistAction, defaultGasPrice);
                        totalGas = totalGas.add(new web3.utils.BN(modifyWhitelistReceipt.gasUsed));
                    }  
                    // Minting tokens
                    for (const mintedEvent of t.mintedEvents) {
                        let mintAction = newToken.methods.mint(mintedEvent.returnValues.to, new web3.utils.BN(mintedEvent.returnValues.value));
                        let mintReceipt = await common.sendTransaction(Issuer, mintAction, defaultGasPrice);  
                        totalGas = totalGas.add(new web3.utils.BN(mintReceipt.gasUsed));
                    }
                }
                
                // Transferring onweship to the original owner
                let transferOwnershipAction = newToken.methods.transferOwnership(t.owner);
                let transferOwnershipReceipt = await common.sendTransaction(Issuer, transferOwnershipAction, defaultGasPrice);
                totalGas = totalGas.add(new web3.utils.BN(transferOwnershipReceipt.gasUsed));

                // Adding 2.0.0 Security Token to SecurityTokenRegistry
                let modifySecurityTokenAction = securityTokenRegistry.methods.modifySecurityToken(t.name, t.ticker, t.owner, newTokenAddress, t.details, t.deployedAt);
                let modifySecurityTokenReceipt = await common.sendTransaction(Issuer, modifySecurityTokenAction, defaultGasPrice);
                totalGas = totalGas.add(new web3.utils.BN(modifySecurityTokenReceipt.gasUsed));
                
                succeed.push(t);
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

async function getABIfromEtherscan(_address) {
    let urlDomain = network == 'kovan' ? 'api-kovan' : 'api';
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

module.exports = {
    executeApp: async function(toStrAddress, fromTrAddress, fromStrAddress, remoteNetwork) {
        return executeApp(toStrAddress, fromTrAddress, fromStrAddress, remoteNetwork);
    }
};