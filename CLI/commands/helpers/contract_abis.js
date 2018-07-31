let polymathRegistryABI;
let tickerRegistryABI;
let securityTokenRegistryABI;
let securityTokenABI;
let cappedSTOABI;
let usdTieredSTOABI;
let generalTransferManagerABI;
let polyTokenABI;
let cappedSTOFactoryABI;
let usdTieredSTOFactoryABI;
let erc20DividendCheckpointABI;
let etherDividendCheckpointABI;

try {
    polymathRegistryABI         = JSON.parse(require('fs').readFileSync('./build/contracts/PolymathRegistry.json').toString()).abi;
    tickerRegistryABI           = JSON.parse(require('fs').readFileSync('./build/contracts/TickerRegistry.json').toString()).abi;
    securityTokenRegistryABI    = JSON.parse(require('fs').readFileSync('./build/contracts/SecurityTokenRegistry.json').toString()).abi;
    securityTokenABI            = JSON.parse(require('fs').readFileSync('./build/contracts/SecurityToken.json').toString()).abi;
    cappedSTOABI                = JSON.parse(require('fs').readFileSync('./build/contracts/CappedSTO.json').toString()).abi;
    usdTieredSTOABI             = JSON.parse(require('fs').readFileSync('./build/contracts/USDTieredSTO.json').toString()).abi;
    generalTransferManagerABI   = JSON.parse(require('fs').readFileSync('./build/contracts/GeneralTransferManager.json').toString()).abi;
    polyTokenABI                = JSON.parse(require('fs').readFileSync('./build/contracts/PolyTokenFaucet.json').toString()).abi;
    cappedSTOFactoryABI         = JSON.parse(require('fs').readFileSync('./build/contracts/CappedSTOFactory.json').toString()).abi;
    usdTieredSTOFactoryABI      = JSON.parse(require('fs').readFileSync('./build/contracts/USDTieredSTOFactory.json').toString()).abi;
    erc20DividendCheckpointABI  = JSON.parse(require('fs').readFileSync('./build/contracts/ERC20DividendCheckpoint.json').toString()).abi;
    etherDividendCheckpointABI  = JSON.parse(require('fs').readFileSync('./build/contracts/EtherDividendCheckpoint.json').toString()).abi;
} catch (err) {
    console.log('\x1b[31m%s\x1b[0m',"Couldn't find contracts' artifacts. Make sure you ran truffle compile first");
    return;
}

module.exports = {
    polymathRegistry: function () {
        return polymathRegistryABI;
    },
    tickerRegistry: function () {
        return tickerRegistryABI;
    },
    securityTokenRegistry: function () {
        return securityTokenRegistryABI;
    },
    securityToken: function () {
        return securityTokenABI;
    },
    cappedSTO: function () {
        return cappedSTOABI;
    },
    usdTieredSTO: function () {
        return usdTieredSTOABI;
    },
    generalTransferManager: function () {
        return generalTransferManagerABI;
    },
    polyToken: function () {
        return polyTokenABI;
    },
    cappedSTOFactory: function () {
        return cappedSTOFactoryABI;
    },
    usdTieredSTOFactory: function () {
        return usdTieredSTOFactoryABI;
    },
    erc20DividendCheckpoint: function () {
        return erc20DividendCheckpointABI;
    },
    etherDividendCheckpoint: function () {
        return etherDividendCheckpointABI;
    }
}