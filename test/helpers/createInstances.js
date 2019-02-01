import { encodeProxyCall, encodeModuleCall } from "./encodeCall";

const PolymathRegistry = artifacts.require("./PolymathRegistry.sol");
const MockOracle = artifacts.require("./MockOracle.sol");
const ModuleRegistry = artifacts.require("./ModuleRegistry.sol");
const ModuleRegistryProxy = artifacts.require("./ModuleRegistryProxy.sol");
const SecurityToken = artifacts.require("./SecurityToken.sol");
const CappedSTOFactory = artifacts.require("./CappedSTOFactory.sol");
const CappedSTO = artifacts.require("./CappedSTO.sol");
const SecurityTokenRegistryProxy = artifacts.require("./SecurityTokenRegistryProxy.sol");
const SecurityTokenRegistry = artifacts.require("./SecurityTokenRegistry.sol");
const SecurityTokenRegistryMock = artifacts.require("./SecurityTokenRegistryMock.sol");
const ERC20DividendCheckpoint = artifacts.require("./ERC20DividendCheckpoint.sol");
const EtherDividendCheckpoint = artifacts.require("./EtherDividendCheckpoint.sol");
const ERC20DividendCheckpointFactory = artifacts.require("./ERC20DividendCheckpointFactory.sol");
const EtherDividendCheckpointFactory = artifacts.require("./EtherDividendCheckpointFactory.sol");
const ManualApprovalTransferManager = artifacts.require("./ManualApprovalTransferManager.sol");
const ManualApprovalTransferManagerFactory = artifacts.require("./ManualApprovalTransferManagerFactory.sol");
const TrackedRedemptionFactory = artifacts.require("./TrackedRedemptionFactory.sol");
const PercentageTransferManagerFactory = artifacts.require("./PercentageTransferManagerFactory.sol");
const PercentageTransferManager = artifacts.require("./PercentageTransferManager.sol");
const BlacklistTransferManagerFactory = artifacts.require("./BlacklistTransferManagerFactory.sol");
const ScheduledCheckpointFactory = artifacts.require('./ScheduledCheckpointFactory.sol');
const USDTieredSTOFactory = artifacts.require("./USDTieredSTOFactory.sol");
const USDTieredSTO = artifacts.require("./USDTieredSTO");
const FeatureRegistry = artifacts.require("./FeatureRegistry.sol");
const STFactory = artifacts.require("./STFactory.sol");
const GeneralTransferManager = artifacts.require("./GeneralTransferManager.sol");
const GeneralTransferManagerFactory = artifacts.require("./GeneralTransferManagerFactory.sol");
const GeneralPermissionManager = artifacts.require("./GeneralPermissionManager.sol");
const GeneralPermissionManagerFactory = artifacts.require("./GeneralPermissionManagerFactory.sol");
const CountTransferManager = artifacts.require("./CountTransferManager.sol");
const CountTransferManagerFactory = artifacts.require("./CountTransferManagerFactory.sol");
const LockUpTransferManagerFactory = artifacts.require("./LockUpTransferManagerFactory");
const PreSaleSTOFactory = artifacts.require("./PreSaleSTOFactory.sol");
const PreSaleSTO = artifacts.require("./PreSaleSTO.sol");
const PolyToken = artifacts.require("./PolyToken.sol");
const PolyTokenFaucet = artifacts.require("./PolyTokenFaucet.sol");
const DummySTOFactory = artifacts.require("./DummySTOFactory.sol");
const DummySTO = artifacts.require("./DummySTO.sol");
const MockBurnFactory = artifacts.require("./MockBurnFactory.sol");
const STRGetter = artifacts.require("./STRGetter.sol");
const MockWrongTypeFactory = artifacts.require("./MockWrongTypeFactory.sol");
const DataStoreLogic = artifacts.require('./DataStore.sol');
const DataStoreFactory = artifacts.require('./DataStoreFactory.sol');
const SignedTransferManagerFactory = artifacts.require("./SignedTransferManagerFactory");
const VolumeRestrictionTMFactory = artifacts.require("./VolumeRestrictionTMFactory.sol");
const VolumeRestrictionTM = artifacts.require("./VolumeRestrictionTM.sol");
const VestingEscrowWalletFactory = artifacts.require("./VestingEscrowWalletFactory.sol");
const VestingEscrowWallet = artifacts.require("./VestingEscrowWallet.sol");

const Web3 = require("web3");
let BN = Web3.utils.BN;
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port

// Contract Instance Declaration
let I_USDTieredSTOProxyFactory;
let I_USDTieredSTOFactory;
let I_TrackedRedemptionFactory;
let I_ScheduledCheckpointFactory;
let I_MockBurnFactory;
let I_MockWrongTypeBurnFactory;
let I_ManualApprovalTransferManagerLogic;
let I_ManualApprovalTransferManagerFactory;
let I_VolumeRestrictionTransferManagerFactory;
let I_PercentageTransferManagerLogic;
let I_PercentageTransferManagerFactory;
let I_EtherDividendCheckpointLogic;
let I_EtherDividendCheckpointFactory;
let I_CountTransferManagerLogic;
let I_CountTransferManagerFactory;
let I_ERC20DividendCheckpointLogic;
let I_ERC20DividendCheckpointFactory;
let I_GeneralPermissionManagerLogic;
let I_VolumeRestrictionTMFactory;
let I_GeneralPermissionManagerFactory;
let I_GeneralTransferManagerLogic;
let I_GeneralTransferManagerFactory;
let I_VestingEscrowWalletFactory;
let I_GeneralTransferManager;
let I_VolumeRestrictionTMLogic;
let I_ModuleRegistryProxy;
let I_PreSaleSTOLogic;
let I_PreSaleSTOFactory;
let I_ModuleRegistry;
let I_FeatureRegistry;
let I_SecurityTokenRegistry;
let I_CappedSTOLogic;
let I_CappedSTOFactory;
let I_SecurityToken;
let I_DummySTOLogic;
let I_DummySTOFactory;
let I_PolyToken;
let I_STFactory;
let I_USDTieredSTOLogic;
let I_PolymathRegistry;
let I_SecurityTokenRegistryProxy;
let I_BlacklistTransferManagerFactory;
let I_VestingEscrowWalletLogic;
let I_STRProxied;
let I_MRProxied;
let I_STRGetter;
let I_SignedTransferManagerFactory;
let I_USDOracle;
let I_POLYOracle;

// Initial fee for ticker registry and security token registry
const initRegFee = new BN(web3.utils.toWei("250"));

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
    // STEP 10: Add dummy oracles
    await addOracles(account_polymath);

    let tempArray = new Array(
        I_PolymathRegistry,
        I_PolyToken,
        I_FeatureRegistry,
        I_ModuleRegistry,
        I_ModuleRegistryProxy,
        I_MRProxied,
        I_GeneralTransferManagerFactory,
        I_STFactory,
        I_SecurityTokenRegistry,
        I_SecurityTokenRegistryProxy,
        I_STRProxied,
        I_STRGetter
    );
    return Promise.all(tempArray);
}

export async function addOracles(account_polymath) {
    let USDETH = new BN(500).mul(new BN(10).pow(new BN(18))); // 500 USD/ETH
    let USDPOLY = new BN(25).mul(new BN(10).pow(new BN(16))); // 0.25 USD/POLY
    I_USDOracle = await MockOracle.new("0x0000000000000000000000000000000000000000", web3.utils.fromAscii("ETH"), web3.utils.fromAscii("USD"), USDETH, { from: account_polymath }); // 500 dollars per POLY
    I_POLYOracle = await MockOracle.new(I_PolyToken.address, web3.utils.fromAscii("POLY"), web3.utils.fromAscii("USD"), USDPOLY, { from: account_polymath }); // 25 cents per POLY
    await I_PolymathRegistry.changeAddress("EthUsdOracle", I_USDOracle.address, { from: account_polymath });
    await I_PolymathRegistry.changeAddress("PolyUsdOracle", I_POLYOracle.address, { from: account_polymath });
}

export async function deployPolyRegistryAndPolyToken(account_polymath, token_owner) {
    // Step 0: Deploy the PolymathRegistry
    I_PolymathRegistry = await PolymathRegistry.new({ from: account_polymath });

    // Step 1: Deploy the token Faucet and Mint tokens for token_owner
    I_PolyToken = await PolyTokenFaucet.new();
    await I_PolyToken.getTokens(new BN(10000).mul(new BN(10).pow(new BN(18))), token_owner);

    await I_PolymathRegistry.changeAddress("PolyToken", I_PolyToken.address, { from: account_polymath });

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
    I_GeneralTransferManagerLogic = await GeneralTransferManager.new(
        "0x0000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000",
        { from: account_polymath }
    );

    assert.notEqual(
        I_GeneralTransferManagerLogic.address.valueOf(),
        "0x0000000000000000000000000000000000000000",
        "GeneralTransferManagerLogic contract was not deployed"
    );

    return new Array(I_GeneralTransferManagerLogic);
}

async function deployGTM(account_polymath) {
    I_GeneralTransferManagerFactory = await GeneralTransferManagerFactory.new(new BN(0), new BN(0), I_GeneralTransferManagerLogic.address, I_PolymathRegistry.address, {
        from: account_polymath
    });

    assert.notEqual(
        I_GeneralTransferManagerFactory.address.valueOf(),
        "0x0000000000000000000000000000000000000000",
        "GeneralTransferManagerFactory contract was not deployed"
    );

    return new Array(I_GeneralTransferManagerFactory);
}

async function deploySTFactory(account_polymath) {
    let I_DataStoreLogic = await DataStoreLogic.new({ from: account_polymath });
    let I_DataStoreFactory = await DataStoreFactory.new(I_DataStoreLogic.address, { from: account_polymath });
    I_STFactory = await STFactory.new(I_GeneralTransferManagerFactory.address, I_DataStoreFactory.address, { from: account_polymath });

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
    I_STRGetter = await STRGetter.new({from: account_polymath});

    let bytesProxy = encodeProxyCall(STRProxyParameters, [
        I_PolymathRegistry.address,
        I_STFactory.address,
        initRegFee,
        initRegFee,
        account_polymath,
        I_STRGetter.address
    ]);
    await I_SecurityTokenRegistryProxy.upgradeToAndCall("1.0.0", I_SecurityTokenRegistry.address, bytesProxy, { from: account_polymath });
    I_STRProxied = await SecurityTokenRegistry.at(I_SecurityTokenRegistryProxy.address);
    I_STRGetter = await STRGetter.at(I_SecurityTokenRegistryProxy.address);
    return new Array(I_SecurityTokenRegistry, I_SecurityTokenRegistryProxy, I_STRProxied, I_STRGetter);
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

export async function deployGTMAndVerifyed(accountPolymath, MRProxyInstance, setupCost) {
    I_GeneralTransferManagerFactory = await GeneralTransferManagerFactory.new(setupCost, new BN(0), I_GeneralTransferManagerLogic.address, I_PolymathRegistry.address, {
        from: accountPolymath
    });

    assert.notEqual(
        I_GeneralTransferManagerFactory.address.valueOf(),
        "0x0000000000000000000000000000000000000000",
        "GeneralTransferManagerFactory contract was not deployed"
    );

    // (B) :  Register the GeneralDelegateManagerFactory
    await registerAndVerifyByMR(I_GeneralTransferManagerFactory.address, accountPolymath, MRProxyInstance);
    return Promise.all(new Array(I_GeneralTransferManagerFactory));
}

export async function deployVRTMAndVerifyed(accountPolymath, MRProxyInstance, setupCost) {
    I_VolumeRestrictionTMLogic = await VolumeRestrictionTM.new("0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", { from: accountPolymath });

    I_VolumeRestrictionTMFactory = await VolumeRestrictionTMFactory.new(setupCost, new BN(0), I_VolumeRestrictionTMLogic.address, I_PolymathRegistry.address, { from: accountPolymath });

    assert.notEqual(
        I_VolumeRestrictionTMFactory.address.valueOf(),
        "0x0000000000000000000000000000000000000000",
        "VolumeRestrictionTMFactory contract was not deployed"
    );

    // (B) :  Register the GeneralDelegateManagerFactory
    await registerAndVerifyByMR(I_VolumeRestrictionTMFactory.address, accountPolymath, MRProxyInstance);
    return new Array(I_VolumeRestrictionTMFactory);
}

export async function deployCountTMAndVerifyed(accountPolymath, MRProxyInstance, setupCost) {
    I_CountTransferManagerLogic = await CountTransferManager.new("0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", { from: accountPolymath });
    I_CountTransferManagerFactory = await CountTransferManagerFactory.new(setupCost, new BN(0), I_CountTransferManagerLogic.address, I_PolymathRegistry.address, { from: accountPolymath });

    assert.notEqual(
        I_CountTransferManagerFactory.address.valueOf(),
        "0x0000000000000000000000000000000000000000",
        "CountTransferManagerFactory contract was not deployed"
    );

    await registerAndVerifyByMR(I_CountTransferManagerFactory.address, accountPolymath, MRProxyInstance);
    return Promise.all(new Array(I_CountTransferManagerFactory));
}

export async function deployManualApprovalTMAndVerifyed(accountPolymath, MRProxyInstance, setupCost) {
    I_ManualApprovalTransferManagerLogic = await ManualApprovalTransferManager.new("0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", { from: accountPolymath });
    I_ManualApprovalTransferManagerFactory = await ManualApprovalTransferManagerFactory.new(setupCost, new BN(0), ManualApprovalTransferManager.address, I_PolymathRegistry.address, { from: accountPolymath });
    assert.notEqual(
        I_ManualApprovalTransferManagerFactory.address.valueOf(),
        "0x0000000000000000000000000000000000000000",
        "ManualApprovalTransferManagerFactory contract was not deployed"
    );

    await registerAndVerifyByMR(I_ManualApprovalTransferManagerFactory.address, accountPolymath, MRProxyInstance);
    return Promise.all(new Array(I_ManualApprovalTransferManagerFactory));
}

export async function deployPercentageTMAndVerified(accountPolymath, MRProxyInstance, setupCost) {
    I_PercentageTransferManagerLogic = await PercentageTransferManager.new("0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", { from: accountPolymath });
    I_PercentageTransferManagerFactory = await PercentageTransferManagerFactory.new(setupCost, new BN(0), I_PercentageTransferManagerLogic.address, I_PolymathRegistry.address, { from: accountPolymath });
    assert.notEqual(
        I_PercentageTransferManagerFactory.address.valueOf(),
        "0x0000000000000000000000000000000000000000",
        "PercentageTransferManagerFactory contract was not deployed"
    );

    await registerAndVerifyByMR(I_PercentageTransferManagerFactory.address, accountPolymath, MRProxyInstance);
    return Promise.all(new Array(I_PercentageTransferManagerFactory));
}

export async function deployBlacklistTMAndVerified(accountPolymath, MRProxyInstance, setupCost) {

    I_BlacklistTransferManagerFactory = await BlacklistTransferManagerFactory.new(setupCost, new BN(0), I_PolymathRegistry.address, { from: accountPolymath });
    assert.notEqual(
        I_BlacklistTransferManagerFactory.address.valueOf(),
        "0x0000000000000000000000000000000000000000",
        "BlacklistTransferManagerFactory contract was not deployed"
    );

    await registerAndVerifyByMR(I_BlacklistTransferManagerFactory.address, accountPolymath, MRProxyInstance);
    return new Array(I_BlacklistTransferManagerFactory);
}

export async function deployLockupVolumeRTMAndVerified(accountPolymath, MRProxyInstance, setupCost) {
    I_VolumeRestrictionTransferManagerFactory = await LockUpTransferManagerFactory.new(setupCost, new BN(0), I_PolymathRegistry.address, {
        from: accountPolymath
    });
    assert.notEqual(
        I_VolumeRestrictionTransferManagerFactory.address.valueOf(),
        "0x0000000000000000000000000000000000000000",
        "LockUpTransferManagerFactory contract was not deployed"
    );

    await registerAndVerifyByMR(I_VolumeRestrictionTransferManagerFactory.address, accountPolymath, MRProxyInstance);
    return Promise.all(new Array(I_VolumeRestrictionTransferManagerFactory));
}

export async function deployScheduleCheckpointAndVerified(accountPolymath, MRProxyInstance, setupCost) {
    I_ScheduledCheckpointFactory = await ScheduledCheckpointFactory.new(setupCost, new BN(0), I_PolymathRegistry.address, { from: accountPolymath });
    assert.notEqual(
        I_ScheduledCheckpointFactory.address.valueOf(),
        "0x0000000000000000000000000000000000000000",
        "ScheduledCheckpointFactory contract was not deployed"
    );

    await registerAndVerifyByMR(I_ScheduledCheckpointFactory.address, accountPolymath, MRProxyInstance);
    return Promise.all(new Array(I_ScheduledCheckpointFactory));
}

/// Deploy the Permission Manager

export async function deployGPMAndVerifyed(accountPolymath, MRProxyInstance, setupCost) {
    I_GeneralPermissionManagerLogic = await GeneralPermissionManager.new("0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", { from: accountPolymath });
    I_GeneralPermissionManagerFactory = await GeneralPermissionManagerFactory.new(setupCost, new BN(0), I_GeneralPermissionManagerLogic.address, I_PolymathRegistry.address, { from: accountPolymath });

    assert.notEqual(
        I_GeneralPermissionManagerFactory.address.valueOf(),
        "0x0000000000000000000000000000000000000000",
        "GeneralPermissionManagerFactory contract was not deployed"
    );

    // (B) :  Register the GeneralDelegateManagerFactory
    await registerAndVerifyByMR(I_GeneralPermissionManagerFactory.address, accountPolymath, MRProxyInstance);
    return Promise.all(new Array(I_GeneralPermissionManagerFactory));
}

/// Deploy the STO Modules

export async function deployDummySTOAndVerifyed(accountPolymath, MRProxyInstance, setupCost) {
    I_DummySTOLogic = await DummySTO.new("0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", { from: accountPolymath });
    I_DummySTOFactory = await DummySTOFactory.new(setupCost, new BN(0), I_DummySTOLogic.address, I_PolymathRegistry.address, { from: accountPolymath });

    assert.notEqual(
        I_DummySTOFactory.address.valueOf(),
        "0x0000000000000000000000000000000000000000",
        "DummySTOFactory contract was not deployed"
    );
    await registerAndVerifyByMR(I_DummySTOFactory.address, accountPolymath, MRProxyInstance);
    return Promise.all(new Array(I_DummySTOFactory));
}

export async function deployCappedSTOAndVerifyed(accountPolymath, MRProxyInstance, setupCost) {
    I_CappedSTOLogic = await CappedSTO.new("0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", { from: accountPolymath });
    I_CappedSTOFactory = await CappedSTOFactory.new(setupCost, new BN(0), I_CappedSTOLogic.address, I_PolymathRegistry.address, { from: accountPolymath });
    assert.notEqual(
        I_CappedSTOFactory.address.valueOf(),
        "0x0000000000000000000000000000000000000000",
        "CappedSTOFactory contract was not deployed"
    );

    await registerAndVerifyByMR(I_CappedSTOFactory.address, accountPolymath, MRProxyInstance);
    return Promise.all(new Array(I_CappedSTOFactory));
}

export async function deployPresaleSTOAndVerified(accountPolymath, MRProxyInstance, setupCost) {
    I_PreSaleSTOLogic = await PreSaleSTO.new("0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", { from: accountPolymath });
    I_PreSaleSTOFactory = await PreSaleSTOFactory.new(setupCost, new BN(0), I_PreSaleSTOLogic.address, I_PolymathRegistry.address, { from: accountPolymath });

    assert.notEqual(
        I_PreSaleSTOFactory.address.valueOf(),
        "0x0000000000000000000000000000000000000000",
        "PreSaleSTOFactory contract was not deployed"
    );

    await registerAndVerifyByMR(I_PreSaleSTOFactory.address, accountPolymath, MRProxyInstance);
    return Promise.all(new Array(I_PreSaleSTOFactory));
}

export async function deployUSDTieredSTOAndVerified(accountPolymath, MRProxyInstance, setupCost) {
    I_USDTieredSTOLogic = await USDTieredSTO.new(
        "0x0000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000",
        { from: accountPolymath }
    );

    I_USDTieredSTOFactory = await USDTieredSTOFactory.new(setupCost, new BN(0), I_USDTieredSTOLogic.address, I_PolymathRegistry.address, { from: accountPolymath });

    assert.notEqual(
        I_USDTieredSTOFactory.address.valueOf(),
        "0x0000000000000000000000000000000000000000",
        "USDTieredSTOFactory contract was not deployed"
    );

    await registerAndVerifyByMR(I_USDTieredSTOFactory.address, accountPolymath, MRProxyInstance);
    return Promise.all(new Array(I_USDTieredSTOFactory));
}

/// Deploy the Dividend Modules

export async function deployERC20DividendAndVerifyed(accountPolymath, MRProxyInstance, setupCost) {
    I_ERC20DividendCheckpointLogic = await ERC20DividendCheckpoint.new(
        "0x0000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000",
        { from: accountPolymath }
    );
    I_ERC20DividendCheckpointFactory = await ERC20DividendCheckpointFactory.new(setupCost, new BN(0), I_ERC20DividendCheckpointLogic.address, I_PolymathRegistry.address, {
        from: accountPolymath
    });

    assert.notEqual(
        I_ERC20DividendCheckpointFactory.address.valueOf(),
        "0x0000000000000000000000000000000000000000",
        "ERC20DividendCheckpointFactory contract was not deployed"
    );
    await registerAndVerifyByMR(I_ERC20DividendCheckpointFactory.address, accountPolymath, MRProxyInstance);
    return Promise.all(new Array(I_ERC20DividendCheckpointFactory));
}

export async function deployEtherDividendAndVerifyed(accountPolymath, MRProxyInstance, setupCost) {
    I_EtherDividendCheckpointLogic = await EtherDividendCheckpoint.new(
        "0x0000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000",
        { from: accountPolymath }
    );
    I_EtherDividendCheckpointFactory = await EtherDividendCheckpointFactory.new(setupCost, new BN(0), I_EtherDividendCheckpointLogic.address, I_PolymathRegistry.address, {
        from: accountPolymath
    });

    assert.notEqual(
        I_EtherDividendCheckpointFactory.address.valueOf(),
        "0x0000000000000000000000000000000000000000",
        "EtherDividendCheckpointFactory contract was not deployed"
    );

    await registerAndVerifyByMR(I_EtherDividendCheckpointFactory.address, accountPolymath, MRProxyInstance);
    return Promise.all(new Array(I_EtherDividendCheckpointFactory));
}

/// Deploy the Burn Module

export async function deployRedemptionAndVerifyed(accountPolymath, MRProxyInstance, setupCost) {
    I_TrackedRedemptionFactory = await TrackedRedemptionFactory.new(setupCost, new BN(0), I_PolymathRegistry.address, { from: accountPolymath });

    assert.notEqual(
        I_TrackedRedemptionFactory.address.valueOf(),
        "0x0000000000000000000000000000000000000000",
        "TrackedRedemptionFactory contract was not deployed"
    );

    await registerAndVerifyByMR(I_TrackedRedemptionFactory.address, accountPolymath, MRProxyInstance);
    return Promise.all(new Array(I_TrackedRedemptionFactory));
}

export async function deployVestingEscrowWalletAndVerifyed(accountPolymath, MRProxyInstance, setupCost) {
    I_VestingEscrowWalletLogic = await VestingEscrowWallet.new("0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", { from: accountPolymath });
    I_VestingEscrowWalletFactory = await VestingEscrowWalletFactory.new(setupCost, new BN(0), I_VestingEscrowWalletLogic.address, I_PolymathRegistry.address, { from: accountPolymath });

    assert.notEqual(
        I_VestingEscrowWalletFactory.address.valueOf(),
        "0x0000000000000000000000000000000000000000",
        "VestingEscrowWalletFactory contract was not deployed"
    );

    await registerAndVerifyByMR(I_VestingEscrowWalletFactory.address, accountPolymath, MRProxyInstance);
    return new Array(I_VestingEscrowWalletFactory);
}

export async function deployMockRedemptionAndVerifyed(accountPolymath, MRProxyInstance, setupCost) {
    I_MockBurnFactory = await MockBurnFactory.new(setupCost, new BN(0), I_PolymathRegistry.address, { from: accountPolymath });

    assert.notEqual(
        I_MockBurnFactory.address.valueOf(),
        "0x0000000000000000000000000000000000000000",
        "MockBurnfactory contract was not deployed"
    );

    await registerAndVerifyByMR(I_MockBurnFactory.address, accountPolymath, MRProxyInstance);
    return Promise.all(new Array(I_MockBurnFactory));
}

export async function deployMockWrongTypeRedemptionAndVerifyed(accountPolymath, MRProxyInstance, setupCost) {
    I_MockWrongTypeBurnFactory = await MockWrongTypeFactory.new(setupCost, new BN(0), I_PolymathRegistry.address, { from: accountPolymath });

    assert.notEqual(
        I_MockWrongTypeBurnFactory.address.valueOf(),
        "0x0000000000000000000000000000000000000000",
        "MockWrongTypeBurnFactory contract was not deployed"
    );

    await registerAndVerifyByMR(I_MockWrongTypeBurnFactory.address, accountPolymath, MRProxyInstance);
    return Promise.all(new Array(I_MockWrongTypeBurnFactory));
}

export async function deploySignedTMAndVerifyed(accountPolymath, MRProxyInstance, polyToken, setupCost) {
    I_SignedTransferManagerFactory = await SignedTransferManagerFactory.new(setupCost, new BN(0), I_PolymathRegistry.address, { from: accountPolymath });
    assert.notEqual(
        I_SignedTransferManagerFactory.address.valueOf(),
        "0x0000000000000000000000000000000000000000",
        "SignedTransferManagerFactory contract was not deployed"
    );

    await registerAndVerifyByMR(I_SignedTransferManagerFactory.address, accountPolymath, MRProxyInstance);
    return new Array(I_SignedTransferManagerFactory);
}
