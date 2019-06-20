import latestTime from "./helpers/latestTime";
import { duration, ensureException, latestBlock } from "./helpers/utils";
import { takeSnapshot, increaseTime, revertToSnapshot } from "./helpers/time";
import { encodeProxyCall, encodeModuleCall } from "./helpers/encodeCall";
import { catchRevert } from "./helpers/exceptions";
import {deployCappedSTOAndVerifyed, setUpPolymathNetwork} from "./helpers/createInstances";

const CappedSTOFactory = artifacts.require("./CappedSTOFactory.sol");
const CappedSTO = artifacts.require("./CappedSTO.sol");
const DummySTO = artifacts.require("./DummySTO.sol");
const DummySTOFactory = artifacts.require("./DummySTOFactory.sol");
const SecurityToken = artifacts.require("./SecurityToken.sol");
const ModuleRegistryProxy = artifacts.require("./ModuleRegistryProxy.sol");
const ModuleRegistry = artifacts.require("./ModuleRegistry.sol");
const GeneralPermissionManagerFactory = artifacts.require("./GeneralPermissionManagerFactory.sol");
const GeneralPermissionManager = artifacts.require("./GeneralPermissionManager.sol");
const GeneralTransferManagerFactory = artifacts.require("./GeneralTransferManagerFactory.sol");
const MockFactory = artifacts.require("./MockFactory.sol");
const TestSTOFactory = artifacts.require("./TestSTOFactory.sol");
const ReclaimTokens = artifacts.require("./ReclaimTokens.sol");
const STGetter = artifacts.require("./STGetter.sol");

const Web3 = require("web3");
let BN = Web3.utils.BN;
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port

contract("ModuleRegistry", async (accounts) => {
    // Accounts Variable declaration
    let account_polymath;
    let account_investor1;
    let account_issuer;
    let token_owner;
    let account_investor2;
    let account_fundsReceiver;
    let account_delegate;
    let account_temp;

    let balanceOfReceiver;

    let ID_snap;
    let message = "Transaction Should fail!";
    // Contract Instance Declaration
    let I_GeneralPermissionManagerFactory;
    let I_GeneralPermissionManagerLogic;
    let I_GeneralTransferManagerFactory;
    let I_SecurityTokenRegistryProxy;
    let I_GeneralPermissionManager;
    let I_GeneralTransferManager;
    let I_ModuleRegistryProxy;
    let I_ModuleRegistry;
    let I_FeatureRegistry;
    let I_SecurityTokenRegistry;
    let I_CappedSTOFactory1;
    let I_CappedSTOFactory2;
    let I_CappedSTOFactory3;
    let I_STFactory;
    let I_MRProxied;
    let I_SecurityToken;
    let I_ReclaimERC20;
    let I_STRProxied;
    let I_CappedSTOLogic;
    let I_PolyToken;
    let I_MockFactory;
    let I_TestSTOFactory;
    let I_DummySTOFactory;
    let I_PolymathRegistry;
    let I_SecurityToken2;
    let I_STRGetter;
    let I_STGetter;
    let stGetter;

    // SecurityToken Details (Launched ST on the behalf of the issuer)
    const name = "Demo Token";
    const symbol = "det";
    const tokenDetails = "This is equity type of issuance";
    const decimals = 18;

    // Module key
    const permissionManagerKey = 1;
    const transferManagerKey = 2;
    const stoKey = 3;
    const budget = 0;
    const address_zero = "0x0000000000000000000000000000000000000000";
    const one_address = "0x0000000000000000000000000000000000000001";

    // Initial fee for ticker registry and security token registry
    const initRegFee = new BN(web3.utils.toWei("1000"));

    // delagate details
    const delegateDetails = "I am delegate ..";
    const TM_Perm = "FLAGS";

    // Capped STO details
    let startTime;
    let endTime;
    const cap = new BN(web3.utils.toWei("10000"));
    const rate = 1000;
    const fundRaiseType = [0];
    const STOParameters = ["uint256", "uint256", "uint256", "uint256", "uint8[]", "address"];
    const MRProxyParameters = ["address", "address"];

    let currentTime;

    before(async () => {
        currentTime = new BN(await latestTime());
        account_polymath = accounts[0];
        account_issuer = accounts[1];
        account_investor1 = accounts[9];
        account_investor2 = accounts[6];
        account_fundsReceiver = accounts[4];
        account_delegate = accounts[5];
        account_temp = accounts[8];
        token_owner = account_issuer;

       // Step 1: Deploy the genral PM ecosystem
       let instances = await setUpPolymathNetwork(account_polymath, token_owner);

       [
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
           I_STRGetter,
           I_STGetter
       ] = instances;

       I_ModuleRegistryProxy = await ModuleRegistryProxy.new({from: account_polymath});

        // Printing all the contract addresses
        console.log(`
        --------------------- Polymath Network Smart Contracts: ---------------------
        PolymathRegistry:                  ${I_PolymathRegistry.address}
        SecurityTokenRegistryProxy:        ${I_SecurityTokenRegistryProxy.address}
        SecurityTokenRegistry:             ${I_SecurityTokenRegistry.address}
        ModuleRegistry:                    ${I_ModuleRegistry.address}
        ModuleRegistryProxy:               ${I_ModuleRegistryProxy.address}
        FeatureRegistry:                   ${I_FeatureRegistry.address}

        STFactory:                         ${I_STFactory.address}
        GeneralTransferManagerFactory:     ${I_GeneralTransferManagerFactory.address}
        -----------------------------------------------------------------------------
        `);
    });

    describe("Test the initialize the function", async () => {
        it("Should successfully update the implementation address -- fail because polymathRegistry address is 0x", async () => {
            let bytesProxy = encodeProxyCall(MRProxyParameters, [address_zero, account_polymath]);
            catchRevert(
                I_ModuleRegistryProxy.upgradeToAndCall("1.0.0", I_ModuleRegistry.address, bytesProxy, {
                    from: account_polymath
                }),
                "tx-> revert because polymathRegistry address is 0x"
            );
        });

        it("Should successfully update the implementation address -- fail because owner address is 0x", async () => {
            let bytesProxy = encodeProxyCall(MRProxyParameters, [I_PolymathRegistry.address, address_zero]);
            catchRevert(
                I_ModuleRegistryProxy.upgradeToAndCall("1.0.0", I_ModuleRegistry.address, bytesProxy, {
                    from: account_polymath
                }),
                "tx-> revert because owner address is 0x"
            );
        });

        it("Should successfully update the implementation address -- fail because all params are 0x", async () => {
            let bytesProxy = encodeProxyCall(MRProxyParameters, [address_zero, address_zero]);
            catchRevert(
                I_ModuleRegistryProxy.upgradeToAndCall("1.0.0", I_ModuleRegistry.address, bytesProxy, {
                    from: account_polymath
                }),
                "tx-> revert because all params are 0x"
            );
        });

        it("Should successfully update the implementation address", async () => {
            let bytesProxy = encodeProxyCall(MRProxyParameters, [I_PolymathRegistry.address, account_polymath]);
            await I_ModuleRegistryProxy.upgradeToAndCall("1.0.0", I_ModuleRegistry.address, bytesProxy, { from: account_polymath });
            I_MRProxied = await ModuleRegistry.at(I_ModuleRegistryProxy.address);
            await I_PolymathRegistry.changeAddress("ModuleRegistry", I_ModuleRegistryProxy.address, { from: account_polymath });
        });
    });

    describe("Test cases for the ModuleRegistry", async () => {
        describe("Test case for the upgradeFromregistry", async () => {
            it("Should successfully update the registry contract address -- failed because of bad owner", async () => {
                await catchRevert(I_MRProxied.updateFromRegistry({ from: account_temp }));
            });

            it("Should successfully update the registry contract addresses", async () => {
                await I_MRProxied.updateFromRegistry({ from: account_polymath });
                assert.equal(
                    await I_MRProxied.getAddressValue.call(web3.utils.soliditySha3("securityTokenRegistry")),
                    I_SecurityTokenRegistryProxy.address
                );
                assert.equal(
                    await I_MRProxied.getAddressValue.call(web3.utils.soliditySha3("featureRegistry")),
                    I_FeatureRegistry.address
                );
                assert.equal(await I_MRProxied.getAddressValue.call(web3.utils.soliditySha3("polyToken")), I_PolyToken.address);
            });
        });

        describe("Test the state variables", async () => {
            it("Should be the right owner", async () => {
                let _owner = await I_MRProxied.getAddressValue.call(web3.utils.soliditySha3("owner"));
                assert.equal(_owner, account_polymath, "Owner should be the correct");
            });

            it("Should be the expected value of the paused and intialised variable", async () => {
                let _paused = await I_MRProxied.getBoolValue.call(web3.utils.soliditySha3("paused"));
                assert.isFalse(_paused, "Should be the false");

                let _intialised = await I_MRProxied.getBoolValue.call(web3.utils.soliditySha3("initialised"));
                assert.isTrue(_intialised, "Values should be the true");
            });

            it("Should be the expected value of the polymath registry", async () => {
                let _polymathRegistry = await I_MRProxied.getAddressValue.call(web3.utils.soliditySha3("polymathRegistry"));
                assert.equal(
                    _polymathRegistry,
                    I_PolymathRegistry.address,
                    "Should be the right value of the address of the polymath registry"
                );
            });
        });

        describe("Test cases for the registering the module", async () => {
            it("Should fail to register the module -- when registerModule is paused", async () => {
                await I_MRProxied.pause({ from: account_polymath });

                await catchRevert(I_MRProxied.registerModule(I_GeneralTransferManagerFactory.address, { from: account_delegate }));
                await I_MRProxied.unpause({ from: account_polymath });
            });

            it("Should register the module with the Module Registry", async () => {
                let tx = await I_MRProxied.registerModule(I_GeneralTransferManagerFactory.address, { from: account_polymath });
                assert.equal(tx.logs[0].args._moduleFactory, I_GeneralTransferManagerFactory.address, "Should be the same address");
                assert.equal(tx.logs[0].args._owner, account_polymath, "Should be the right owner");

                let _list = await I_MRProxied.getModulesByType(transferManagerKey);
                assert.equal(_list.length, 0, "Length should be 0 - unverified");
                // assert.equal(_list[0], I_GeneralTransferManagerFactory.address);

                let _reputation = await I_MRProxied.getFactoryDetails(I_GeneralTransferManagerFactory.address);
                assert.equal(_reputation[2].length, 0);
            });

            it("Should fail the register the module -- Already registered module", async () => {
                await catchRevert(I_MRProxied.registerModule(I_GeneralTransferManagerFactory.address, { from: account_polymath }));
            });

            it("Should fail in registering the module-- type = 0", async () => {
                I_MockFactory = await MockFactory.new(new BN(0), one_address, I_PolymathRegistry.address, true, { from: account_polymath });

                catchRevert(I_MRProxied.registerModule(I_MockFactory.address, { from: account_polymath }));
            });

            it("Should fail to register the new module because msg.sender is not the owner of the module", async() => {
                I_CappedSTOLogic = await CappedSTO.new(address_zero, address_zero, { from: account_polymath });
                I_CappedSTOFactory3 = await CappedSTOFactory.new(new BN(0), I_CappedSTOLogic.address, I_PolymathRegistry.address, true, { from: account_temp });
                console.log(await I_MRProxied.owner());
                catchRevert(I_MRProxied.registerModule(I_CappedSTOFactory3.address, { from: token_owner }));
            });

            it("Should successfully register the module -- fail because no module type uniqueness", async () => {
                await I_MockFactory.switchTypes({ from: account_polymath });
                catchRevert(I_MRProxied.registerModule(I_MockFactory.address, { from: account_polymath }));
            });
        });

        describe("Test case for verifyModule", async () => {
            it("Should fail in calling the verify module. Because msg.sender should be account_polymath", async () => {
                await catchRevert(I_MRProxied.verifyModule(I_GeneralTransferManagerFactory.address, { from: account_temp }));
            });

            it("Should successfully verify the module -- true", async () => {
                let tx = await I_MRProxied.verifyModule(I_GeneralTransferManagerFactory.address, { from: account_polymath });
                assert.equal(tx.logs[0].args._moduleFactory, I_GeneralTransferManagerFactory.address, "Failed in verifying the module");
                let info = await I_MRProxied.getFactoryDetails.call(I_GeneralTransferManagerFactory.address);
                let _list = await I_MRProxied.getModulesByType(transferManagerKey);
                assert.equal(_list.length, 1, "Length should be 1");
                assert.equal(_list[0], I_GeneralTransferManagerFactory.address);
                assert.equal(info[0], true);
                assert.equal(info[1], account_polymath);
            });

            it("Should successfully verify the module -- false", async () => {
                I_CappedSTOFactory1 = await CappedSTOFactory.new(new BN(0), I_CappedSTOLogic.address, I_PolymathRegistry.address, true, { from: account_polymath });
                await I_MRProxied.registerModule(I_CappedSTOFactory1.address, { from: account_polymath });
                let tx = await I_MRProxied.unverifyModule(I_CappedSTOFactory1.address, { from: account_polymath });
                assert.equal(tx.logs[0].args._moduleFactory, I_CappedSTOFactory1.address, "Failed in verifying the module");
                let info = await I_MRProxied.getFactoryDetails.call(I_CappedSTOFactory1.address);
                assert.equal(info[0], false);
            });

            it("Should fail in verifying the module. Because the module is not registered", async () => {
                await catchRevert(I_MRProxied.verifyModule(I_MockFactory.address, { from: account_polymath }));
            });
        });

        describe("Test cases for the useModule function of the module registry", async () => {
            it("Deploy the securityToken", async () => {
                await I_PolyToken.getTokens(new BN(web3.utils.toWei("2000")), account_issuer);
                await I_PolyToken.approve(I_STRProxied.address, new BN(web3.utils.toWei("2000")), { from: account_issuer });
                await I_STRProxied.registerNewTicker(account_issuer, symbol, { from: account_issuer });
                let tx = await I_STRProxied.generateNewSecurityToken(name, symbol, tokenDetails, true, account_issuer, 0, { from: account_issuer });
                assert.equal(tx.logs[1].args._ticker, symbol.toUpperCase());
                I_SecurityToken = await SecurityToken.at(tx.logs[1].args._securityTokenAddress);
                stGetter = await STGetter.at(I_SecurityToken.address);
                assert.equal(await stGetter.getTreasuryWallet.call(), account_issuer, "Incorrect wallet set")
            });

            it("Should fail in adding module. Because module is un-verified", async () => {
                startTime = await latestTime() + duration.seconds(5000);
                endTime = startTime + duration.days(30);
                let bytesSTO = encodeModuleCall(STOParameters, [startTime, endTime, cap, rate, fundRaiseType, account_fundsReceiver]);

                await catchRevert(I_SecurityToken.addModule(I_CappedSTOFactory1.address, bytesSTO, new BN(0), new BN(0), false, { from: token_owner }));
            });

            it("Should fail to register module because custom modules not allowed", async () => {
                I_CappedSTOFactory2 = await CappedSTOFactory.new(new BN(0), I_CappedSTOLogic.address, I_PolymathRegistry.address, true, { from: token_owner });

                assert.notEqual(I_CappedSTOFactory2.address.valueOf(), address_zero, "CappedSTOFactory contract was not deployed");

                await catchRevert(I_MRProxied.registerModule(I_CappedSTOFactory2.address, { from: token_owner }));
            });

            it("Should switch customModulesAllowed to true", async () => {
                assert.equal(
                    false,
                    await I_FeatureRegistry.getFeatureStatus.call("customModulesAllowed"),
                    "Custom modules should be dissabled by default."
                );
                let tx = await I_FeatureRegistry.setFeatureStatus("customModulesAllowed", true, { from: account_polymath });
                assert.equal(
                    true,
                    await I_FeatureRegistry.getFeatureStatus.call("customModulesAllowed"),
                    "Custom modules should be switched to true."
                );
            });

            it("Should successfully add module because custom modules switched on", async () => {
                startTime = await latestTime() + duration.seconds(5000);
                endTime = startTime + duration.days(30);
                let bytesSTO = encodeModuleCall(STOParameters, [startTime, endTime, cap, rate, fundRaiseType, account_fundsReceiver]);
                let tx = await I_MRProxied.registerModule(I_CappedSTOFactory2.address, { from: token_owner });
                tx = await I_SecurityToken.addModule(I_CappedSTOFactory2.address, bytesSTO, new BN(0), new BN(0), false, { from: token_owner });

                assert.equal(tx.logs[2].args._types[0], stoKey, "CappedSTO doesn't get deployed");
                assert.equal(
                    web3.utils.toAscii(tx.logs[2].args._name).replace(/\u0000/g, ""),
                    "CappedSTO",
                    "CappedSTOFactory module was not added"
                );
                let _reputation = await I_MRProxied.getFactoryDetails.call(I_CappedSTOFactory2.address);
                assert.equal(_reputation[2].length, 1);
            });

            it("Should successfully add module when custom modules switched on -- fail because factory owner is different", async () => {
                await I_MRProxied.registerModule(I_CappedSTOFactory3.address, { from: account_temp });
                startTime = await latestTime() + duration.seconds(5000);
                endTime = startTime + duration.days(30);
                let bytesSTO = encodeModuleCall(STOParameters, [startTime, endTime, cap, rate, fundRaiseType, account_fundsReceiver]);
                catchRevert(I_SecurityToken.addModule(I_CappedSTOFactory3.address, bytesSTO, new BN(0), new BN(0), false, { from: token_owner }));
            });

            it("Should successfully add verified module", async () => {
                I_GeneralPermissionManagerLogic = await GeneralPermissionManager.new("0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", { from: account_polymath });
                I_GeneralPermissionManagerFactory = await GeneralPermissionManagerFactory.new(new BN(0), I_GeneralPermissionManagerLogic.address, I_PolymathRegistry.address, true, {
                    from: account_polymath
                });
                await I_MRProxied.registerModule(I_GeneralPermissionManagerFactory.address, { from: account_polymath });
                await I_MRProxied.verifyModule(I_GeneralPermissionManagerFactory.address, { from: account_polymath });
                let tx = await I_SecurityToken.addModule(I_GeneralPermissionManagerFactory.address, "0x0", new BN(0), new BN(0), false, { from: token_owner });
                assert.equal(tx.logs[2].args._types[0], permissionManagerKey, "module doesn't get deployed");
            });

            it("Should failed in adding the TestSTOFactory module because not compatible with the current protocol version --lower", async () => {
                let I_TestSTOFactoryLogic = await DummySTO.new(address_zero, address_zero);
                I_TestSTOFactory = await TestSTOFactory.new(new BN(0), I_TestSTOFactoryLogic.address, I_PolymathRegistry.address, true, { from: account_polymath });
                await I_MRProxied.registerModule(I_TestSTOFactory.address, { from: account_polymath });
                await I_MRProxied.verifyModule(I_TestSTOFactory.address, { from: account_polymath });
                // Taking the snapshot the revert the changes from here
                let id = await takeSnapshot();
                await I_TestSTOFactory.changeSTVersionBounds("lowerBound", [3, 1, 0], { from: account_polymath });
                let _lstVersion = await I_TestSTOFactory.getLowerSTVersionBounds.call();
                assert.equal(_lstVersion[0], 3);
                assert.equal(_lstVersion[1], 1);
                assert.equal(_lstVersion[2], 0);
                let bytesData = encodeModuleCall(
                    ["uint256", "uint256", "uint256", "string"],
                    [await latestTime(), currentTime.add(new BN(duration.days(1))), cap, "Test STO"]
                );
                console.log("I_TestSTOFactory:" +I_TestSTOFactory.address);
                await catchRevert(I_SecurityToken.addModule(I_TestSTOFactory.address, bytesData, new BN(0), new BN(0), false, { from: token_owner }));
                await revertToSnapshot(id);
            });

            it("Should failed in adding the TestSTOFactory module because not compatible with the current protocol version --upper", async () => {
                await I_TestSTOFactory.changeSTVersionBounds("upperBound", [0, new BN(0), 1], { from: account_polymath });
                let _ustVersion = await I_TestSTOFactory.getUpperSTVersionBounds.call();
                assert.equal(_ustVersion[0], 0);
                assert.equal(_ustVersion[2], 1);
                await I_STRProxied.setProtocolFactory(I_STFactory.address, 2, new BN(0), 1);
                await I_STRProxied.setLatestVersion(2, new BN(0), 1);
                // Generate the new securityToken
                let newSymbol = "toro";
                await I_PolyToken.getTokens(new BN(web3.utils.toWei("2000")), account_issuer);
                await I_PolyToken.approve(I_STRProxied.address, new BN(web3.utils.toWei("2000")), { from: account_issuer });
                await I_STRProxied.registerNewTicker(account_issuer, newSymbol, { from: account_issuer });
                let tx = await I_STRProxied.generateNewSecurityToken(name, newSymbol, tokenDetails, true, account_issuer, 0, { from: account_issuer });
                assert.equal(tx.logs[1].args._ticker, newSymbol.toUpperCase());
                I_SecurityToken2 = await SecurityToken.at(tx.logs[1].args._securityTokenAddress);
                stGetter = await STGetter.at(I_SecurityToken2.address);
                let bytesData = encodeModuleCall(
                    ["uint256", "uint256", "uint256", "string"],
                    [await latestTime(), currentTime.add(new BN(duration.days(1))), cap, "Test STO"]
                );

                await catchRevert(I_SecurityToken2.addModule(I_TestSTOFactory.address, bytesData, new BN(0), new BN(0), false, { from: token_owner }));
            });
        });

        describe("Test case for the getModulesByTypeAndToken()", async () => {
            it("Should get the list of available modules when the customModulesAllowed", async () => {
                let _list = await I_MRProxied.getModulesByTypeAndToken.call(3, I_SecurityToken.address);
                console.log(_list);
                assert.equal(_list[0], I_CappedSTOFactory2.address);
            });

            it("Should get the list of available modules when the customModulesAllowed is not allowed", async () => {
                await I_FeatureRegistry.setFeatureStatus("customModulesAllowed", false, { from: account_polymath });
                let _list = await I_MRProxied.getModulesByTypeAndToken.call(3, I_SecurityToken.address);
                console.log(_list);
                assert.equal(_list.length, 0);
            });
        });

        describe("Test cases for getters", async () => {
            it("Check getter - ", async () => {
                console.log("getModulesByType:");
                for (let i = 0; i < 5; i++) {
                    let _list = await I_MRProxied.getModulesByType.call(i);
                    console.log("Type: " + i + ":" + _list);
                }
                console.log("getModulesByTypeAndToken:");
                for (let i = 0; i < 5; i++) {
                    let _list = await I_MRProxied.getModulesByTypeAndToken.call(i, I_SecurityToken.address);
                    console.log("Type: " + i + ":" + _list);
                }
                console.log("getTagsByType:");
                for (let i = 0; i < 5; i++) {
                    let _list = await I_MRProxied.getTagsByType.call(i);
                    console.log("Type: " + i + ":" + _list[1]);
                    console.log("Type: " + i + ":" + _list[0].map(x => web3.utils.toAscii(x)));
                }
                console.log("getTagsByTypeAndToken:");
                for (let i = 0; i < 5; i++) {
                    let _list = await I_MRProxied.getTagsByTypeAndToken.call(i, I_SecurityToken.address);
                    console.log("Type: " + i + ":" + _list[1]);
                    console.log("Type: " + i + ":" + _list[0].map(x => web3.utils.toAscii(x)));
                }
            });
        });

        describe("Test cases for removeModule()", async () => {
            it("Should fail if msg.sender not curator or owner", async () => {
                await catchRevert(I_MRProxied.removeModule(I_CappedSTOFactory2.address, { from: account_temp }));
            });

            it("Should successfully remove module and delete data if msg.sender is curator", async () => {
                let snap = await takeSnapshot();
                console.log("All modules: " + (await I_MRProxied.getModulesByType.call(3)));
                let sto1 = (await I_MRProxied.getModulesByType.call(3))[0];
                // let sto2 = (await I_MRProxied.getModulesByType.call(3))[1];
                // let sto3 = (await I_MRProxied.getModulesByType.call(3))[2];
                // let sto4 = (await I_MRProxied.getModulesByType.call(3))[3];

                assert.equal(sto1, I_TestSTOFactory.address);
                assert.equal((await I_MRProxied.getModulesByType.call(3)).length, 1);

                let tx = await I_MRProxied.removeModule(sto1, { from: account_polymath });

                assert.equal(tx.logs[0].args._moduleFactory, sto1, "Event is not properly emitted for _moduleFactory");
                assert.equal(tx.logs[0].args._decisionMaker, account_polymath, "Event is not properly emitted for _decisionMaker");

                let sto3_end = (await I_MRProxied.getModulesByType.call(3))[2];

                // delete related data
                assert.equal(await I_MRProxied.getUintValue.call(web3.utils.soliditySha3("registry", sto1)), 0);
                assert.equal((await I_MRProxied.getFactoryDetails.call(sto1))[1], 0);
                assert.equal((await I_MRProxied.getModulesByType.call(3)).length, 0);
                assert.equal(await I_MRProxied.getBoolValue.call(web3.utils.soliditySha3("verified", sto1)), false);

                await revertToSnapshot(snap);
            });

            it("Should successfully remove module and delete data if msg.sender is owner", async () => {
                let sto1 = (await I_MRProxied.getAllModulesByType.call(3))[0];
                let sto2 = (await I_MRProxied.getAllModulesByType.call(3))[1];

                assert.equal(sto1, I_CappedSTOFactory1.address);
                assert.equal(sto2, I_CappedSTOFactory2.address);
                assert.equal((await I_MRProxied.getAllModulesByType.call(3)).length, 4);

                let tx = await I_MRProxied.removeModule(sto2, { from: token_owner });

                assert.equal(tx.logs[0].args._moduleFactory, sto2, "Event is not properly emitted for _moduleFactory");
                assert.equal(tx.logs[0].args._decisionMaker, token_owner, "Event is not properly emitted for _decisionMaker");

                let sto1_end = (await I_MRProxied.getAllModulesByType.call(3))[0];

                // re-ordering
                assert.equal(sto1_end, sto1);
                // delete related data
                assert.equal(await I_MRProxied.getUintValue.call(web3.utils.soliditySha3("registry", sto2)), 0);
                assert.equal((await I_MRProxied.getFactoryDetails.call(sto2))[1], 0);
                assert.equal((await I_MRProxied.getAllModulesByType.call(3)).length, 3);
                assert.equal(await I_MRProxied.getBoolValue.call(web3.utils.soliditySha3("verified", sto2)), false);
            });

            it("Should fail if module already removed", async () => {
                await catchRevert(I_MRProxied.removeModule(I_CappedSTOFactory2.address, { from: account_polymath }));
            });
        });

        describe("Test cases for IRegistry functionality", async () => {
            describe("Test cases for reclaiming funds", async () => {
                it("Should successfully reclaim POLY tokens -- fail because token address will be 0x", async () => {
                    await I_PolyToken.transfer(I_MRProxied.address, new BN(web3.utils.toWei("1")), { from: token_owner });
                    catchRevert(I_MRProxied.reclaimERC20(address_zero, { from: account_polymath }));
                });

                it("Should successfully reclaim POLY tokens -- not authorised", async () => {
                    catchRevert(I_MRProxied.reclaimERC20(I_PolyToken.address, { from: account_temp }));
                });

                it("Should successfully reclaim POLY tokens", async () => {
                    await I_PolyToken.getTokens(new BN(web3.utils.toWei("1")), I_MRProxied.address);
                    let bal1 = await I_PolyToken.balanceOf.call(account_polymath);
                    await I_MRProxied.reclaimERC20(I_PolyToken.address);
                    let bal2 = await I_PolyToken.balanceOf.call(account_polymath);
                    assert.isAtLeast(
                        bal2.div(new BN(10).pow(new BN(18))).toNumber(),
                        bal2.div(new BN(10).pow(new BN(18))).toNumber()
                    );
                });
            });

            describe("Test cases for pausing the contract", async () => {
                it("Should fail to pause if msg.sender is not owner", async () => {
                    await catchRevert(I_MRProxied.pause({ from: account_temp }));
                });

                it("Should successfully pause the contract", async () => {
                    await I_MRProxied.pause({ from: account_polymath });
                    let status = await I_MRProxied.getBoolValue.call(web3.utils.soliditySha3("paused"));
                    assert.isOk(status);
                });

                it("Should fail to unpause if msg.sender is not owner", async () => {
                    await catchRevert(I_MRProxied.unpause({ from: account_temp }));
                });

                it("Should successfully unpause the contract", async () => {
                    await I_MRProxied.unpause({ from: account_polymath });
                    let status = await I_MRProxied.getBoolValue.call(web3.utils.soliditySha3("paused"));
                    assert.isNotOk(status);
                });
            });

            describe("Test cases for the ReclaimTokens contract", async () => {
                it("Should successfully reclaim POLY tokens -- fail because token address will be 0x", async () => {
                    I_ReclaimERC20 = await ReclaimTokens.at(I_FeatureRegistry.address);
                    await I_PolyToken.transfer(I_ReclaimERC20.address, new BN(web3.utils.toWei("1")), { from: token_owner });
                    catchRevert(I_ReclaimERC20.reclaimERC20(address_zero, { from: account_polymath }));
                });

                it("Should successfully reclaim POLY tokens -- not authorised", async () => {
                    catchRevert(I_ReclaimERC20.reclaimERC20(I_PolyToken.address, { from: account_temp }));
                });

                it("Should successfully reclaim POLY tokens", async () => {
                    await I_PolyToken.getTokens(new BN(web3.utils.toWei("1")), I_ReclaimERC20.address);
                    let bal1 = await I_PolyToken.balanceOf.call(account_polymath);
                    await I_ReclaimERC20.reclaimERC20(I_PolyToken.address);
                    let bal2 = await I_PolyToken.balanceOf.call(account_polymath);
                    assert.isAtLeast(
                        bal2.div(new BN(10).pow(new BN(18))).toNumber(),
                        bal2.div(new BN(10).pow(new BN(18))).toNumber()
                    );
                });
            });

            describe("Test case for the PolymathRegistry", async () => {
                it("Should successfully get the address -- fail because key is not exist", async () => {
                    catchRevert(I_PolymathRegistry.getAddress("PolyOracle"));
                });

                it("Should successfully get the address", async () => {
                    let _moduleR = await I_PolymathRegistry.getAddress("ModuleRegistry");
                    assert.equal(_moduleR, I_ModuleRegistryProxy.address);
                });
            });

            describe("Test cases for the transferOwnership", async () => {
                it("Should fail to transfer the ownership -- not authorised", async () => {
                    catchRevert(I_MRProxied.transferOwnership(account_temp, { from: account_issuer }));
                });

                it("Should fail to transfer the ownership -- 0x address is not allowed", async () => {
                    catchRevert(I_MRProxied.transferOwnership(address_zero, { from: account_polymath }));
                });

                it("Should successfully transfer the ownership of the STR", async () => {
                    let tx = await I_MRProxied.transferOwnership(account_temp, { from: account_polymath });
                    assert.equal(tx.logs[0].args.previousOwner, account_polymath);
                    assert.equal(tx.logs[0].args.newOwner, account_temp);
                });

                it("New owner has authorisation", async () => {
                    let tx = await I_MRProxied.transferOwnership(account_polymath, { from: account_temp });
                    assert.equal(tx.logs[0].args.previousOwner, account_temp);
                    assert.equal(tx.logs[0].args.newOwner, account_polymath);
                });
            });
        });
    });
});
