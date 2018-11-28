let polymathRegistryABI;
let securityTokenRegistryABI;
let featureRegistryABI;
let moduleRegistryABI;
let securityTokenABI;
let stoInterfaceABI;
let cappedSTOABI;
let usdTieredSTOABI;
let generalTransferManagerABI;
let generalPermissionManagerABI;
let polyTokenABI;
let cappedSTOFactoryABI;
let usdTieredSTOFactoryABI;
let erc20DividendCheckpointABI;
let etherDividendCheckpointABI;
let moduleInterfaceABI;
let ownableABI;
let iSTOABI;
let iTransferManagerABI;
let moduleFactoryABI;

try {
    polymathRegistryABI         = JSON.parse(require('fs').readFileSync('./build/contracts/PolymathRegistry.json').toString()).abi;
    securityTokenRegistryABI    = JSON.parse(require('fs').readFileSync('./build/contracts/SecurityTokenRegistry.json').toString()).abi;
    featureRegistryABI          = JSON.parse(require('fs').readFileSync('./build/contracts/FeatureRegistry.json').toString()).abi;
    moduleRegistryABI           = JSON.parse(require('fs').readFileSync('./build/contracts/ModuleRegistry.json').toString()).abi;
    securityTokenABI            = JSON.parse(require('fs').readFileSync('./build/contracts/SecurityToken.json').toString()).abi;
    stoInterfaceABI             = JSON.parse(require('fs').readFileSync('./build/contracts/ISTO.json').toString()).abi;
    cappedSTOABI                = JSON.parse(require('fs').readFileSync('./build/contracts/CappedSTO.json').toString()).abi;
    usdTieredSTOABI             = JSON.parse(require('fs').readFileSync('./build/contracts/USDTieredSTO.json').toString()).abi;
    generalTransferManagerABI   = JSON.parse(require('fs').readFileSync('./build/contracts/GeneralTransferManager.json').toString()).abi;
    generalPermissionManagerABI = JSON.parse(require('fs').readFileSync('./build/contracts/GeneralPermissionManager.json').toString()).abi;
    polyTokenABI                = JSON.parse(require('fs').readFileSync('./build/contracts/PolyTokenFaucet.json').toString()).abi;
    cappedSTOFactoryABI         = JSON.parse(require('fs').readFileSync('./build/contracts/CappedSTOFactory.json').toString()).abi;
    usdTieredSTOFactoryABI      = JSON.parse(require('fs').readFileSync('./build/contracts/USDTieredSTOFactory.json').toString()).abi;
    erc20DividendCheckpointABI  = JSON.parse(require('fs').readFileSync('./build/contracts/ERC20DividendCheckpoint.json').toString()).abi;
    etherDividendCheckpointABI  = JSON.parse(require('fs').readFileSync('./build/contracts/EtherDividendCheckpoint.json').toString()).abi;
    moduleInterfaceABI          = JSON.parse(require('fs').readFileSync('./build/contracts/IModule.json').toString()).abi;
    ownableABI                  = JSON.parse(require('fs').readFileSync('./build/contracts/Ownable.json').toString()).abi;
    iSTOABI                     = JSON.parse(require('fs').readFileSync('./build/contracts/ISTO.json').toString()).abi
    iTransferManagerABI         = JSON.parse(require('fs').readFileSync('./build/contracts/ITransferManager.json').toString()).abi
    moduleFactoryABI            = JSON.parse(require('fs').readFileSync('./build/contracts/ModuleFactory.json').toString()).abi;
} catch (err) {
    console.log('\x1b[31m%s\x1b[0m',"Couldn't find contracts' artifacts. Make sure you ran truffle compile first");
    throw err;
}

module.exports = {
    polymathRegistry: function () {
        return polymathRegistryABI;
    },
    securityTokenRegistry: function () {
        return securityTokenRegistryABI;
    },
    featureRegistry: function () {
        return featureRegistryABI;
    },
    moduleRegistry: function () {
        return moduleRegistryABI;
    },
    securityToken: function () {
        return securityTokenABI;
    },
    stoInterface: function () {
        return stoInterfaceABI;
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
    generalPermissionManager: function () {
        return generalPermissionManagerABI;
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
    },
    moduleInterface: function () {
        return moduleInterfaceABI;
    },
    ownable: function () {
        return ownableABI;
    },
    ISTO: function () {
        return iSTOABI;
    },
    ITransferManager: function () {
        return iTransferManagerABI;
    },
    moduleFactory: function () {
        return moduleFactoryABI;
    }
}