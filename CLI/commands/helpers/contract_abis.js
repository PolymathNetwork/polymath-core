let polymathRegistryABI;
let securityTokenRegistryABI;
let featureRegistryABI;
let moduleRegistryABI;
let securityTokenABI;
let stoInterfaceABI;
let cappedSTOABI;
let usdTieredSTOABI;
let generalTransferManagerABI;
let manualApprovalTransferManagerABI;
let blacklistTransferManagerABI;
let countTransferManagerABI;
let percentageTransferManagerABI;
let lockUpTransferManagerABI;
let volumeRestrictionTMABI;
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
let erc20ABI;

try {
    polymathRegistryABI = JSON.parse(require('fs').readFileSync(`${__dirname}/../../../build/contracts/PolymathRegistry.json`).toString()).abi;
    securityTokenRegistryABI = JSON.parse(require('fs').readFileSync(`${__dirname}/../../../build/contracts/SecurityTokenRegistry.json`).toString()).abi;
    featureRegistryABI = JSON.parse(require('fs').readFileSync(`${__dirname}/../../../build/contracts/FeatureRegistry.json`).toString()).abi;
    moduleRegistryABI = JSON.parse(require('fs').readFileSync(`${__dirname}/../../../build/contracts/ModuleRegistry.json`).toString()).abi;
    securityTokenABI = JSON.parse(require('fs').readFileSync(`${__dirname}/../../../build/contracts/SecurityToken.json`).toString()).abi;
    stoInterfaceABI = JSON.parse(require('fs').readFileSync(`${__dirname}/../../../build/contracts/ISTO.json`).toString()).abi;
    cappedSTOABI = JSON.parse(require('fs').readFileSync(`${__dirname}/../../../build/contracts/CappedSTO.json`).toString()).abi;
    usdTieredSTOABI = JSON.parse(require('fs').readFileSync(`${__dirname}/../../../build/contracts/USDTieredSTO.json`).toString()).abi;
    generalTransferManagerABI = JSON.parse(require('fs').readFileSync(`${__dirname}/../../../build/contracts/GeneralTransferManager.json`).toString()).abi;
    manualApprovalTransferManagerABI = JSON.parse(require('fs').readFileSync(`${__dirname}/../../../build/contracts/ManualApprovalTransferManager.json`).toString()).abi;
    countTransferManagerABI = JSON.parse(require('fs').readFileSync(`${__dirname}/../../../build/contracts/CountTransferManager.json`).toString()).abi;
    percentageTransferManagerABI = JSON.parse(require('fs').readFileSync(`${__dirname}/../../../build/contracts/PercentageTransferManager.json`).toString()).abi;
    blacklistTransferManagerABI = JSON.parse(require('fs').readFileSync(`${__dirname}/../../../build/contracts/BlacklistTransferManager.json`).toString()).abi;
    volumeRestrictionTMABI = JSON.parse(require('fs').readFileSync(`${__dirname}/../../../build/contracts/VolumeRestrictionTM.json`).toString()).abi;
    lockUpTransferManagerABI = JSON.parse(require('fs').readFileSync(`${__dirname}/../../../build/contracts/LockUpTransferManager.json`).toString()).abi;
    generalPermissionManagerABI = JSON.parse(require('fs').readFileSync(`${__dirname}/../../../build/contracts/GeneralPermissionManager.json`).toString()).abi;
    polyTokenABI = JSON.parse(require('fs').readFileSync(`${__dirname}/../../../build/contracts/PolyTokenFaucet.json`).toString()).abi;
    cappedSTOFactoryABI = JSON.parse(require('fs').readFileSync(`${__dirname}/../../../build/contracts/CappedSTOFactory.json`).toString()).abi;
    usdTieredSTOFactoryABI = JSON.parse(require('fs').readFileSync(`${__dirname}/../../../build/contracts/USDTieredSTOFactory.json`).toString()).abi;
    erc20DividendCheckpointABI = JSON.parse(require('fs').readFileSync(`${__dirname}/../../../build/contracts/ERC20DividendCheckpoint.json`).toString()).abi;
    etherDividendCheckpointABI = JSON.parse(require('fs').readFileSync(`${__dirname}/../../../build/contracts/EtherDividendCheckpoint.json`).toString()).abi;
    moduleInterfaceABI = JSON.parse(require('fs').readFileSync(`${__dirname}/../../../build/contracts/IModule.json`).toString()).abi;
    ownableABI = JSON.parse(require('fs').readFileSync(`${__dirname}/../../../build/contracts/Ownable.json`).toString()).abi;
    iSTOABI = JSON.parse(require('fs').readFileSync(`${__dirname}/../../../build/contracts/ISTO.json`).toString()).abi
    iTransferManagerABI = JSON.parse(require('fs').readFileSync(`${__dirname}/../../../build/contracts/ITransferManager.json`).toString()).abi
    moduleFactoryABI = JSON.parse(require('fs').readFileSync(`${__dirname}/../../../build/contracts/ModuleFactory.json`).toString()).abi;
    erc20ABI = JSON.parse(require('fs').readFileSync(`${__dirname}/../../../build/contracts/DetailedERC20.json`).toString()).abi;
} catch (err) {
    console.log('\x1b[31m%s\x1b[0m', "Couldn't find contracts' artifacts. Make sure you ran truffle compile first");
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
    manualApprovalTransferManager: function () {
        return manualApprovalTransferManagerABI;
    },
    blacklistTransferManager: function () {
        return blacklistTransferManagerABI;
    },
    countTransferManager: function () {
        return countTransferManagerABI;
    },
    percentageTransferManager: function () {
        return percentageTransferManagerABI;
    },
    lockUpTransferManager: function () {
        return lockUpTransferManagerABI;
    },
    volumeRestrictionTM: function () {
        return volumeRestrictionTMABI;
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
    },
    erc20: function () {
        return erc20ABI;
    }
}
