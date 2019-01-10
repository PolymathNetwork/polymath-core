import { encodeProxyCall, encodeModuleCall } from "./encodeCall";

const PolymathRegistry = artifacts.require("./PolymathRegistry.sol");
const ModuleRegistry = artifacts.require("./ModuleRegistry.sol");
const ModuleRegistryProxy = artifacts.require("./ModuleRegistryProxy.sol");
const SecurityToken = artifacts.require("./SecurityToken.sol");
const CappedSTOFactory = artifacts.require("./CappedSTOFactory.sol");
const SecurityTokenRegistryProxy = artifacts.require("./SecurityTokenRegistryProxy.sol");
const SecurityTokenRegistry = artifacts.require("./SecurityTokenRegistry.sol");
const SecurityTokenRegistryMock = artifacts.require("./SecurityTokenRegistryMock.sol");
const ERC20DividendCheckpoint = artifacts.require("./ERC20DividendCheckpoint.sol");
const EtherDividendCheckpoint = artifacts.require("./EtherDividendCheckpoint.sol");
const ERC20DividendCheckpointFactory = artifacts.require("./ERC20DividendCheckpointFactory.sol");
const EtherDividendCheckpointFactory = artifacts.require("./EtherDividendCheckpointFactory.sol");
const ManualApprovalTransferManagerFactory = artifacts.require("./ManualApprovalTransferManagerFactory.sol");
const TrackedRedemptionFactory = artifacts.require("./TrackedRedemptionFactory.sol");
const PercentageTransferManagerFactory = artifacts.require("./PercentageTransferManagerFactory.sol");
const ScheduledCheckpointFactory = artifacts.require('./ScheduledCheckpointFactory.sol');
const USDTieredSTOFactory = artifacts.require("./USDTieredSTOFactory.sol");
const USDTieredSTO = artifacts.require("./USDTieredSTO");
const ManualApprovalTransferManager = artifacts.require("./ManualApprovalTransferManager");
const FeatureRegistry = artifacts.require("./FeatureRegistry.sol");
const STFactory = artifacts.require("./STFactory.sol");
const GeneralTransferManager = artifacts.require("./GeneralTransferManager.sol");
const GeneralTransferManagerFactory = artifacts.require("./GeneralTransferManagerFactory.sol");
const GeneralPermissionManagerFactory = artifacts.require("./GeneralPermissionManagerFactory.sol");
const CountTransferManagerFactory = artifacts.require("./CountTransferManagerFactory.sol");
const VolumeRestrictionTransferManagerFactory = artifacts.require("./LockupVolumeRestrictionTMFactory");
const PreSaleSTOFactory = artifacts.require("./PreSaleSTOFactory.sol");
const PolyToken = artifacts.require("./PolyToken.sol");
const PolyTokenFaucet = artifacts.require("./PolyTokenFaucet.sol");
const DummySTOFactory = artifacts.require("./DummySTOFactory.sol");
const MockBurnFactory = artifacts.require("./MockBurnFactory.sol");
const MockWrongTypeFactory = artifacts.require("./MockWrongTypeFactory.sol");
const VolumeRestrictionTMFactory = artifacts.require("./VolumeRestrictionTMFactory.sol");
const VolumeRestrictionTM = artifacts.require("./VolumeRestrictionTM.sol");
const VestingEscrowWalletFactory = artifacts.require("./VestingEscrowWalletFactory.sol");
const VestingEscrowWallet = artifacts.require("./VestingEscrowWallet.sol");

const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port

// Contract Instance Declaration
let I_USDTieredSTOProxyFactory;
let I_USDTieredSTOFactory;
let I_TrackedRedemptionFactory;
let I_ScheduledCheckpointFactory;
let I_MockBurnFactory;
let I_MockWrongTypeBurnFactory;
let I_ManualApprovalTransferManagerFactory;
let I_VolumeRestrictionTransferManagerFactory;
let I_PercentageTransferManagerFactory;
let I_EtherDividendCheckpointLogic;
let I_EtherDividendCheckpointFactory;
let I_CountTransferManagerFactory;
let I_ERC20DividendCheckpointLogic;
let I_ERC20DividendCheckpointFactory;
let I_VolumeRestrictionTMFactory;
let I_GeneralPermissionManagerFactory;
let I_GeneralTransferManagerLogic;
let I_GeneralTransferManagerFactory;
let I_VestingEscrowWalletFactory;
let I_GeneralTransferManager;
let I_VolumeRestrictionTMLogic;
let I_ModuleRegistryProxy;
let I_PreSaleSTOFactory;
let I_ModuleRegistry;
let I_FeatureRegistry;
let I_SecurityTokenRegistry;
let I_CappedSTOFactory;
let I_SecurityToken;
let I_DummySTOFactory;
let I_PolyToken;
let I_STFactory;
let I_USDTieredSTOLogic;
let I_PolymathRegistry;
let I_SecurityTokenRegistryProxy;
let I_VestingEscrowWalletLogic;
let I_STRProxied;
let I_MRProxied;

// Initial fee for ticker registry and security token registry
const initRegFee = web3.utils.toWei("250");

const STRProxyParameters = ["address", "address", "uint256", "uint256", "address", "address"];
const MRProxyParameters = ["address", "address"];

/// Function use to launch the polymath ecossystem.

export async function setUpPolymathNetwork(account_polymath, token_owner) {
    // ----------- POLYMATH NETWORK Configuration ------------
    // Step 1: Deploy the PolyToken and PolymathRegistry
    let a = await deployPolyRegistryAndPolyToken(account_polymath, token_owner);
    // Step 2: Deploy the FeatureRegistry
    let b = await deployFeatureRegistry(account_polymath);
    // STEP 3: Deploy the ModuleRegistry
    let c = await deployModuleRegistry(account_polymath);
    // STEP 4a: Deploy the GeneralTransferManagerFactory
    let logic = await deployGTMLogic(account_polymath);
    // STEP 4b: Deploy the GeneralTransferManagerFactory
    let d = await deployGTM(account_polymath);
    // Step 6: Deploy the STversionProxy contract
    let e = await deploySTFactory(account_polymath);
    // Step 7: Deploy the SecurityTokenRegistry
    let f = await deploySTR(account_polymath);
    // Step 8: update the registries addresses from the PolymathRegistry contract
    await setInPolymathRegistry(account_polymath);
    // STEP 9: Register the Modules with the ModuleRegistry contract
    await registerGTM(account_polymath);
    let tempArray = new Array(a, b, c, d, e, f);
    return mergeReturn(tempArray);
}


export async function deployPolyRegistryAndPolyToken(account_polymath, token_owner) {
    // Step 0: Deploy the PolymathRegistry
    I_PolymathRegistry = await PolymathRegistry.new({ from: account_polymath });

    // Step 1: Deploy the token Faucet and Mint tokens for token_owner
    I_PolyToken = await PolyTokenFaucet.new();
    await I_PolyToken.getTokens(10000 * Math.pow(10, 18), token_owner);

    return new Array(I_PolymathRegistry, I_PolyToken);
}

async function deployFeatureRegistry(account_polymath) {
    I_FeatureRegistry = await FeatureRegistry.new(I_PolymathRegistry.address, {
        from: account_polymath
    });

    return new Array(I_FeatureRegistry);
}

async function deployModuleRegistry(account_polymath) {
    I_ModuleRegistry = await ModuleRegistry.new({ from: account_polymath });
    // Step 3 (b):  Deploy the proxy and attach the implementation contract to it
    I_ModuleRegistryProxy = await ModuleRegistryProxy.new({ from: account_polymath });
    let bytesMRProxy = encodeProxyCall(MRProxyParameters, [I_PolymathRegistry.address, account_polymath]);
    await I_ModuleRegistryProxy.upgradeToAndCall("1.0.0", I_ModuleRegistry.address, bytesMRProxy, { from: account_polymath });
    I_MRProxied = await ModuleRegistry.at(I_ModuleRegistryProxy.address);

    return new Array(I_ModuleRegistry, I_ModuleRegistryProxy, I_MRProxied);
}

async function deployGTMLogic(account_polymath) {
    I_GeneralTransferManagerLogic = await GeneralTransferManager.new("0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", { from: account_polymath });

    assert.notEqual(
        I_GeneralTransferManagerLogic.address.valueOf(),
        "0x0000000000000000000000000000000000000000",
        "GeneralTransferManagerLogic contract was not deployed"
    );

    return new Array(I_GeneralTransferManagerLogic);
}

async function deployGTM(account_polymath) {
    I_GeneralTransferManagerFactory = await GeneralTransferManagerFactory.new(I_PolyToken.address, 0, 0, 0, I_GeneralTransferManagerLogic.address, { from: account_polymath });

    assert.notEqual(
        I_GeneralTransferManagerFactory.address.valueOf(),
        "0x0000000000000000000000000000000000000000",
        "GeneralTransferManagerFactory contract was not deployed"
    );

    return new Array(I_GeneralTransferManagerFactory);
}

async function deploySTFactory(account_polymath) {
    I_STFactory = await STFactory.new(I_GeneralTransferManagerFactory.address, { from: account_polymath });

    assert.notEqual(I_STFactory.address.valueOf(), "0x0000000000000000000000000000000000000000", "STFactory contract was not deployed");

    return new Array(I_STFactory);
}

async function deploySTR(account_polymath) {
    I_SecurityTokenRegistry = await SecurityTokenRegistry.new({ from: account_polymath });

    assert.notEqual(
        I_SecurityTokenRegistry.address.valueOf(),
        "0x0000000000000000000000000000000000000000",
        "SecurityTokenRegistry contract was not deployed"
    );

    // Step 9 (a): Deploy the proxy
    I_SecurityTokenRegistryProxy = await SecurityTokenRegistryProxy.new({ from: account_polymath });
    let bytesProxy = encodeProxyCall(STRProxyParameters, [
        I_PolymathRegistry.address,
        I_STFactory.address,
        initRegFee,
        initRegFee,
        I_PolyToken.address,
        account_polymath
    ]);
    await I_SecurityTokenRegistryProxy.upgradeToAndCall("1.0.0", I_SecurityTokenRegistry.address, bytesProxy, { from: account_polymath });
    I_STRProxied = SecurityTokenRegistry.at(I_SecurityTokenRegistryProxy.address);

    return new Array(I_SecurityTokenRegistry, I_SecurityTokenRegistryProxy, I_STRProxied);
}

async function setInPolymathRegistry(account_polymath) {
    await I_PolymathRegistry.changeAddress("PolyToken", I_PolyToken.address, { from: account_polymath });
    await I_PolymathRegistry.changeAddress("ModuleRegistry", I_ModuleRegistryProxy.address, { from: account_polymath });
    await I_PolymathRegistry.changeAddress("FeatureRegistry", I_FeatureRegistry.address, { from: account_polymath });
    await I_PolymathRegistry.changeAddress("SecurityTokenRegistry", I_SecurityTokenRegistryProxy.address, { from: account_polymath });
    await I_MRProxied.updateFromRegistry({ from: account_polymath });
}

async function registerGTM(account_polymath) {
    await I_MRProxied.registerModule(I_GeneralTransferManagerFactory.address, { from: account_polymath });
    await I_MRProxied.verifyModule(I_GeneralTransferManagerFactory.address, true, { from: account_polymath });
}

async function registerAndVerifyByMR(factoryAdrress, owner, mr) {
    await mr.registerModule(factoryAdrress, { from: owner });
    await mr.verifyModule(factoryAdrress, true, { from: owner });
}

/// Deploy the TransferManagers

export async function deployGTMAndVerifyed(accountPolymath, MRProxyInstance, polyToken, setupCost) {
    I_GeneralTransferManagerFactory = await GeneralTransferManagerFactory.new(polyToken, setupCost, 0, 0, I_GeneralTransferManagerLogic.address, { from: accountPolymath });

    assert.notEqual(
        I_GeneralTransferManagerFactory.address.valueOf(),
        "0x0000000000000000000000000000000000000000",
        "GeneralPermissionManagerFactory contract was not deployed"
    );

    // (B) :  Register the GeneralDelegateManagerFactory
    await registerAndVerifyByMR(I_GeneralTransferManagerFactory.address, accountPolymath, MRProxyInstance);
    return new Array(I_GeneralTransferManagerFactory);
}

export async function deployVRTMAndVerifyed(accountPolymath, MRProxyInstance, polyToken, setupCost) {
    I_VolumeRestrictionTMLogic = await VolumeRestrictionTM.new("0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", { from: accountPolymath });

    I_VolumeRestrictionTMFactory = await VolumeRestrictionTMFactory.new(polyToken, setupCost, 0, 0, I_VolumeRestrictionTMLogic.address, { from: accountPolymath });

    assert.notEqual(
        I_VolumeRestrictionTMFactory.address.valueOf(),
        "0x0000000000000000000000000000000000000000",
        "VolumeRestrictionTMFactory contract was not deployed"
    );

    // (B) :  Register the GeneralDelegateManagerFactory
    await registerAndVerifyByMR(I_VolumeRestrictionTMFactory.address, accountPolymath, MRProxyInstance);
    return new Array(I_VolumeRestrictionTMFactory);
}

export async function deployCountTMAndVerifyed(accountPolymath, MRProxyInstance, polyToken, setupCost) {
    I_CountTransferManagerFactory = await CountTransferManagerFactory.new(polyToken, setupCost, 0, 0, { from: accountPolymath });

    assert.notEqual(
        I_CountTransferManagerFactory.address.valueOf(),
        "0x0000000000000000000000000000000000000000",
        "CountTransferManagerFactory contract was not deployed"
    );

    await registerAndVerifyByMR(I_CountTransferManagerFactory.address, accountPolymath, MRProxyInstance);
    return new Array(I_CountTransferManagerFactory);
}

export async function deployManualApprovalTMAndVerifyed(accountPolymath, MRProxyInstance, polyToken, setupCost) {
    I_ManualApprovalTransferManagerFactory = await ManualApprovalTransferManagerFactory.new(polyToken, setupCost, 0, 0, { from: accountPolymath });
    assert.notEqual(
        I_ManualApprovalTransferManagerFactory.address.valueOf(),
        "0x0000000000000000000000000000000000000000",
        "ManualApprovalTransferManagerFactory contract was not deployed"
    );

    await registerAndVerifyByMR(I_ManualApprovalTransferManagerFactory.address, accountPolymath, MRProxyInstance);
    return new Array(I_ManualApprovalTransferManagerFactory);
}

export async function deployPercentageTMAndVerified(accountPolymath, MRProxyInstance, polyToken, setupCost) {
    I_PercentageTransferManagerFactory = await PercentageTransferManagerFactory.new(polyToken, setupCost, 0, 0, { from: accountPolymath });
    assert.notEqual(
        I_PercentageTransferManagerFactory.address.valueOf(),
        "0x0000000000000000000000000000000000000000",
        "PercentageTransferManagerFactory contract was not deployed"
    );

    await registerAndVerifyByMR(I_PercentageTransferManagerFactory.address, accountPolymath, MRProxyInstance);
    return new Array(I_PercentageTransferManagerFactory);
}

export async function deployLockupVolumeRTMAndVerified(accountPolymath, MRProxyInstance, polyToken, setupCost) {
    I_VolumeRestrictionTransferManagerFactory = await VolumeRestrictionTransferManagerFactory.new(polyToken, setupCost, 0, 0, { from: accountPolymath });
    assert.notEqual(
        I_VolumeRestrictionTransferManagerFactory.address.valueOf(),
        "0x0000000000000000000000000000000000000000",
        "VolumeRestrictionTransferManagerFactory contract was not deployed"
    );

    await registerAndVerifyByMR(I_VolumeRestrictionTransferManagerFactory.address, accountPolymath, MRProxyInstance);
    return new Array(I_VolumeRestrictionTransferManagerFactory);
}

export async function deployScheduleCheckpointAndVerified(accountPolymath, MRProxyInstance, polyToken, setupCost) {
    I_ScheduledCheckpointFactory = await ScheduledCheckpointFactory.new(polyToken, setupCost, 0, 0, { from: accountPolymath });
    assert.notEqual(
        I_ScheduledCheckpointFactory.address.valueOf(),
        "0x0000000000000000000000000000000000000000",
        "ScheduledCheckpointFactory contract was not deployed"
    );

    await registerAndVerifyByMR(I_ScheduledCheckpointFactory.address, accountPolymath, MRProxyInstance);
    return new Array(I_ScheduledCheckpointFactory);
}

/// Deploy the Permission Manager

export async function deployGPMAndVerifyed(accountPolymath, MRProxyInstance, polyToken, setupCost) {
    I_GeneralPermissionManagerFactory = await GeneralPermissionManagerFactory.new(polyToken, setupCost, 0, 0, { from: accountPolymath });

    assert.notEqual(
        I_GeneralPermissionManagerFactory.address.valueOf(),
        "0x0000000000000000000000000000000000000000",
        "GeneralPermissionManagerFactory contract was not deployed"
    );

    // (B) :  Register the GeneralDelegateManagerFactory
    await registerAndVerifyByMR(I_GeneralPermissionManagerFactory.address, accountPolymath, MRProxyInstance);
    return new Array(I_GeneralPermissionManagerFactory);
}


/// Deploy the STO Modules

export async function deployDummySTOAndVerifyed(accountPolymath, MRProxyInstance, polyToken, setupCost) {
    I_DummySTOFactory = await DummySTOFactory.new(polyToken, setupCost, 0, 0, { from: accountPolymath });

    assert.notEqual(
        I_DummySTOFactory.address.valueOf(),
        "0x0000000000000000000000000000000000000000",
        "DummySTOFactory contract was not deployed"
    );
    await registerAndVerifyByMR(I_DummySTOFactory.address, accountPolymath, MRProxyInstance);
    return new Array(I_DummySTOFactory);
}

export async function deployCappedSTOAndVerifyed(accountPolymath, MRProxyInstance, polyToken, setupCost) {
    I_CappedSTOFactory = await CappedSTOFactory.new(polyToken, setupCost, 0, 0, { from: accountPolymath });
    assert.notEqual(
        I_CappedSTOFactory.address.valueOf(),
        "0x0000000000000000000000000000000000000000",
        "CappedSTOFactory contract was not deployed"
    );

    await registerAndVerifyByMR(I_CappedSTOFactory.address, accountPolymath, MRProxyInstance);
    return new Array(I_CappedSTOFactory);

}

export async function deployPresaleSTOAndVerified(accountPolymath, MRProxyInstance, polyToken, setupCost) {
    I_PreSaleSTOFactory = await PreSaleSTOFactory.new(polyToken, setupCost, 0, 0, { from: accountPolymath });

    assert.notEqual(
        I_PreSaleSTOFactory.address.valueOf(),
        "0x0000000000000000000000000000000000000000",
        "PreSaleSTOFactory contract was not deployed"
    );

    await registerAndVerifyByMR(I_PreSaleSTOFactory.address, accountPolymath, MRProxyInstance);
    return new Array(I_PreSaleSTOFactory);
}

export async function deployUSDTieredSTOAndVerified(accountPolymath, MRProxyInstance, polyToken, setupCost) {
    I_USDTieredSTOLogic = await USDTieredSTO.new("0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", { from: accountPolymath });

    I_USDTieredSTOFactory = await USDTieredSTOFactory.new(polyToken, setupCost, 0, 0, I_USDTieredSTOLogic.address, { from: accountPolymath });

    assert.notEqual(
        I_USDTieredSTOFactory.address.valueOf(),
        "0x0000000000000000000000000000000000000000",
        "USDTieredSTOFactory contract was not deployed"
    );

    await registerAndVerifyByMR(I_USDTieredSTOFactory.address, accountPolymath, MRProxyInstance);
    return new Array(I_USDTieredSTOFactory);
}


/// Deploy the Dividend Modules

export async function deployERC20DividendAndVerifyed(accountPolymath, MRProxyInstance, polyToken, setupCost) {
    I_ERC20DividendCheckpointLogic = await ERC20DividendCheckpoint.new("0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", { from: accountPolymath });
    I_ERC20DividendCheckpointFactory = await ERC20DividendCheckpointFactory.new(polyToken, setupCost, 0, 0, I_ERC20DividendCheckpointLogic.address, { from: accountPolymath });

    assert.notEqual(
        I_ERC20DividendCheckpointFactory.address.valueOf(),
        "0x0000000000000000000000000000000000000000",
        "ERC20DividendCheckpointFactory contract was not deployed"
    );
    await registerAndVerifyByMR(I_ERC20DividendCheckpointFactory.address, accountPolymath, MRProxyInstance);
    return new Array(I_ERC20DividendCheckpointFactory);
}

export async function deployEtherDividendAndVerifyed(accountPolymath, MRProxyInstance, polyToken, setupCost) {
    I_EtherDividendCheckpointLogic = await EtherDividendCheckpoint.new("0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", { from: accountPolymath });
    I_EtherDividendCheckpointFactory = await EtherDividendCheckpointFactory.new(polyToken, setupCost, 0, 0, I_EtherDividendCheckpointLogic.address, { from: accountPolymath });

    assert.notEqual(
        I_EtherDividendCheckpointFactory.address.valueOf(),
        "0x0000000000000000000000000000000000000000",
        "EtherDividendCheckpointFactory contract was not deployed"
    );

    await registerAndVerifyByMR(I_EtherDividendCheckpointFactory.address, accountPolymath, MRProxyInstance);
    return new Array(I_EtherDividendCheckpointFactory);
}


/// Deploy the Burn Module

export async function deployRedemptionAndVerifyed(accountPolymath, MRProxyInstance, polyToken, setupCost) {
    I_TrackedRedemptionFactory = await TrackedRedemptionFactory.new(polyToken, setupCost, 0, 0, { from: accountPolymath });

    assert.notEqual(
        I_TrackedRedemptionFactory.address.valueOf(),
        "0x0000000000000000000000000000000000000000",
        "TrackedRedemptionFactory contract was not deployed"
    );

    await registerAndVerifyByMR(I_TrackedRedemptionFactory.address, accountPolymath, MRProxyInstance);
    return new Array(I_TrackedRedemptionFactory);
}

export async function deployVestingEscrowWalletAndVerifyed(accountPolymath, MRProxyInstance, polyToken, setupCost) {
    I_VestingEscrowWalletLogic = await VestingEscrowWallet.new("0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", { from: accountPolymath });
    I_VestingEscrowWalletFactory = await VestingEscrowWalletFactory.new(polyToken, setupCost, 0, 0, I_VestingEscrowWalletLogic.address, { from: accountPolymath });

    assert.notEqual(
        I_VestingEscrowWalletFactory.address.valueOf(),
        "0x0000000000000000000000000000000000000000",
        "VestingEscrowWalletFactory contract was not deployed"
    );

    await registerAndVerifyByMR(I_VestingEscrowWalletFactory.address, accountPolymath, MRProxyInstance);
    return new Array(I_VestingEscrowWalletFactory);
}

export async function deployMockRedemptionAndVerifyed(accountPolymath, MRProxyInstance, polyToken, setupCost) {
    I_MockBurnFactory = await MockBurnFactory.new(polyToken, setupCost, 0, 0, { from: accountPolymath });

    assert.notEqual(
        I_MockBurnFactory.address.valueOf(),
        "0x0000000000000000000000000000000000000000",
        "MockBurnfactory contract was not deployed"
    );

    await registerAndVerifyByMR(I_MockBurnFactory.address, accountPolymath, MRProxyInstance);
    return new Array(I_MockBurnFactory);
}

export async function deployMockWrongTypeRedemptionAndVerifyed(accountPolymath, MRProxyInstance, polyToken, setupCost) {
    I_MockWrongTypeBurnFactory = await MockWrongTypeFactory.new(polyToken, setupCost, 0, 0, { from: accountPolymath });

    assert.notEqual(
        I_MockWrongTypeBurnFactory.address.valueOf(),
        "0x0000000000000000000000000000000000000000",
        "MockWrongTypeBurnFactory contract was not deployed"
    );

    await registerAndVerifyByMR(I_MockWrongTypeBurnFactory.address, accountPolymath, MRProxyInstance);
    return new Array(I_MockWrongTypeBurnFactory);
}

/// Helper function
function mergeReturn(returnData) {
    let returnArray = new Array();
    for (let i = 0; i < returnData.length; i++) {
        for (let j = 0; j < returnData[i].length; j++) {
            returnArray.push(returnData[i][j]);
        }
    }
    return returnArray;
}
