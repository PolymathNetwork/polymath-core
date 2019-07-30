let polymathRegistryABI;
let securityTokenRegistryABI;
let iSecurityTokenRegistryABI;
let featureRegistryABI;
let moduleRegistryABI;
let securityTokenABI;
let iSecurityTokenABI;
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
let vestingEscrowWalletABI;
let moduleInterfaceABI;
let ownableABI;
let stoABI;
let iTransferManagerABI;
let moduleFactoryABI;
let moduleABI;
let erc20ABI;

try {
    polymathRegistryABI = JSON.parse(require('fs').readFileSync(`${__dirname}/../../../build/contracts/PolymathRegistry.json`).toString()).abi;
    securityTokenRegistryABI = JSON.parse(require('fs').readFileSync(`${__dirname}/../../../build/contracts/SecurityTokenRegistry.json`).toString()).abi;
    iSecurityTokenRegistryABI = JSON.parse(require('fs').readFileSync(`${__dirname}/../../../build/contracts/ISecurityTokenRegistry.json`).toString()).abi;
    featureRegistryABI = JSON.parse(require('fs').readFileSync(`${__dirname}/../../../build/contracts/FeatureRegistry.json`).toString()).abi;
    moduleRegistryABI = JSON.parse(require('fs').readFileSync(`${__dirname}/../../../build/contracts/ModuleRegistry.json`).toString()).abi;
    securityTokenABI = JSON.parse(require('fs').readFileSync(`${__dirname}/../../../build/contracts/SecurityToken.json`).toString()).abi;
    iSecurityTokenABI = JSON.parse(require('fs').readFileSync(`${__dirname}/../../../build/contracts/ISecurityToken.json`).toString()).abi;
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
    vestingEscrowWalletABI = JSON.parse(require('fs').readFileSync(`${__dirname}/../../../build/contracts/VestingEscrowWallet.json`).toString()).abi;
    moduleInterfaceABI = JSON.parse(require('fs').readFileSync(`${__dirname}/../../../build/contracts/IModule.json`).toString()).abi;
    ownableABI = JSON.parse(require('fs').readFileSync(`${__dirname}/../../../build/contracts/Ownable.json`).toString()).abi;
    stoABI = JSON.parse(require('fs').readFileSync(`${__dirname}/../../../build/contracts/STO.json`).toString()).abi
    iTransferManagerABI = JSON.parse(require('fs').readFileSync(`${__dirname}/../../../build/contracts/ITransferManager.json`).toString()).abi
    moduleFactoryABI = JSON.parse(require('fs').readFileSync(`${__dirname}/../../../build/contracts/ModuleFactory.json`).toString()).abi;
    moduleABI = JSON.parse(require('fs').readFileSync(`${__dirname}/../../../build/contracts/Module.json`).toString()).abi;
    // Note: use ISecurity Token for ERC20 as it contains full ERC20Detailed ABI
    erc20ABI = JSON.parse(require('fs').readFileSync(`${__dirname}/../../../build/contracts/ISecurityToken.json`).toString()).abi;
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
    iSecurityTokenRegistry: function () {
        return iSecurityTokenRegistryABI;
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
    iSecurityToken: function () {
        return iSecurityTokenABI;
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
    vestingEscrowWallet: function () {
        return vestingEscrowWalletABI;
    },
    moduleInterface: function () {
        return moduleInterfaceABI;
    },
    ownable: function () {
        return ownableABI;
    },
    sto: function () {
        return stoABI;
    },
    ITransferManager: function () {
        return iTransferManagerABI;
    },
    moduleFactory: function () {
        return moduleFactoryABI;
    },
    erc20: function () {
        return erc20ABI;
    },
    alternativeErc20: function () {
        let alternativeErc20 = [{
            "constant": true,
            "inputs": [],
            "name": "symbol",
            "outputs": [{ "name": "", "type": "bytes32" }],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        }];
        return alternativeErc20;
    },
    moduleABI: function () {
        return moduleABI;
    }
}
