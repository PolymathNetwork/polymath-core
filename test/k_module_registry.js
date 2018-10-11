import latestTime from './helpers/latestTime';
import { duration, ensureException, promisifyLogWatch, latestBlock } from './helpers/utils';
import { takeSnapshot, increaseTime, revertToSnapshot } from './helpers/time';
import { encodeProxyCall, encodeModuleCall } from './helpers/encodeCall';

const PolymathRegistry = artifacts.require('./PolymathRegistry.sol')
const CappedSTOFactory = artifacts.require('./CappedSTOFactory.sol');
const CappedSTO = artifacts.require('./CappedSTO.sol');
const DummySTOFactory = artifacts.require('./DummySTOFactory.sol');
const ModuleRegistry = artifacts.require('./ModuleRegistry.sol');
const ModuleRegistryProxy = artifacts.require('./ModuleRegistryProxy.sol');
const SecurityToken = artifacts.require('./SecurityToken.sol');
const SecurityTokenRegistry = artifacts.require('./SecurityTokenRegistry.sol');
const SecurityTokenRegistryProxy = artifacts.require('./SecurityTokenRegistryProxy.sol');
const FeatureRegistry = artifacts.require('./FeatureRegistry.sol');
const STFactory = artifacts.require('./STFactory.sol');
const GeneralPermissionManagerFactory = artifacts.require('./GeneralPermissionManagerFactory.sol');
const GeneralTransferManagerFactory = artifacts.require('./GeneralTransferManagerFactory.sol');
const GeneralTransferManager = artifacts.require('./GeneralTransferManager');
const GeneralPermissionManager = artifacts.require('./GeneralPermissionManager');
const PolyTokenFaucet = artifacts.require('./PolyTokenFaucet.sol');
const MockFactory = artifacts.require('./MockFactory.sol');
const TestSTOFactory = artifacts.require('./TestSTOFactory.sol');

const Web3 = require('web3');
const BigNumber = require('bignumber.js');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")) // Hardcoded development port


contract('ModuleRegistry', accounts => {


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
    // investor Details
    let fromTime = latestTime();
    let toTime = latestTime() + duration.days(15);

    let ID_snap;
    let message = "Transaction Should fail!";
    // Contract Instance Declaration
    let I_GeneralPermissionManagerFactory;
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
    let I_STFactory;
    let I_MRProxied;
    let I_SecurityToken;
    let I_STRProxied;
    let I_CappedSTO;
    let I_PolyToken;
    let I_MockFactory;
    let I_TestSTOFactory;
    let I_DummySTOFactory;
    let I_PolymathRegistry;
    let I_SecurityToken2;

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

    // Initial fee for ticker registry and security token registry
    const initRegFee = web3.utils.toWei("250");

    // delagate details
    const delegateDetails = "I am delegate ..";
    const TM_Perm = 'FLAGS';

    // Capped STO details
    let startTime;
    let endTime;
    const cap = web3.utils.toWei("10000");
    const rate = 1000;
    const fundRaiseType = [0];
    const STOParameters = ['uint256', 'uint256', 'uint256', 'uint256','uint8[]', 'address'];
    const STRProxyParameters = ['address', 'address', 'uint256', 'uint256', 'address', 'address'];
    const MRProxyParameters = ['address', 'address'];

    before(async() => {
        // Accounts setup
        account_polymath = accounts[0];
        account_issuer = accounts[1];
        account_investor1 = accounts[9];
        account_investor2 = accounts[6];
        account_fundsReceiver = accounts[4];
        account_delegate = accounts[5];
        account_temp = accounts[8];
        token_owner = account_issuer;

        // ----------- POLYMATH NETWORK Configuration ------------

       // Step 0: Deploy the PolymathRegistry
       I_PolymathRegistry = await PolymathRegistry.new({from: account_polymath});

       // Step 1: Deploy the token Faucet and Mint tokens for token_owner
       I_PolyToken = await PolyTokenFaucet.new();
       await I_PolyToken.getTokens((10000 * Math.pow(10, 18)), token_owner);

       // Step 2: Deploy the FeatureRegistry

        I_FeatureRegistry = await FeatureRegistry.new(
            I_PolymathRegistry.address,
            {
                from: account_polymath
            });

       // STEP 3: Deploy the ModuleRegistry

        I_ModuleRegistry = await ModuleRegistry.new({from:account_polymath});

        assert.notEqual(
            I_ModuleRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "ModuleRegistry contract was not deployed",
        );

        I_ModuleRegistryProxy = await ModuleRegistryProxy.new({from:account_polymath});
        let bytesMRProxy = encodeProxyCall(MRProxyParameters, [I_PolymathRegistry.address, account_polymath]);
        let tx = await I_ModuleRegistryProxy.upgradeToAndCall("1.0.0", I_ModuleRegistry.address, bytesMRProxy, {from: account_polymath});
        I_MRProxied = await ModuleRegistry.at(I_ModuleRegistryProxy.address);


        // STEP 2: Deploy the GeneralTransferManagerFactory

        I_GeneralTransferManagerFactory = await GeneralTransferManagerFactory.new(I_PolyToken.address, 0, 0, 0, {from:account_polymath});

        assert.notEqual(
            I_GeneralTransferManagerFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "GeneralTransferManagerFactory contract was not deployed"
        );

        I_STFactory = await STFactory.new(I_GeneralTransferManagerFactory.address, {from : account_polymath });

        assert.notEqual(
            I_STFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "STFactory contract was not deployed",
        );

        // Step 9: Deploy the SecurityTokenRegistry

        I_SecurityTokenRegistry = await SecurityTokenRegistry.new({from: account_polymath });

        assert.notEqual(
            I_SecurityTokenRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "SecurityTokenRegistry contract was not deployed",
        );

        // Step 10: update the registries addresses from the PolymathRegistry contract
        I_SecurityTokenRegistryProxy = await SecurityTokenRegistryProxy.new({from: account_polymath});
        let bytesProxy = encodeProxyCall(STRProxyParameters, [I_PolymathRegistry.address, I_STFactory.address, initRegFee, initRegFee, I_PolyToken.address, account_polymath]);
        await I_SecurityTokenRegistryProxy.upgradeToAndCall("1.0.0", I_SecurityTokenRegistry.address, bytesProxy, {from: account_polymath});
        I_STRProxied = await SecurityTokenRegistry.at(I_SecurityTokenRegistryProxy.address);



        assert.notEqual(
            I_FeatureRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "FeatureRegistry contract was not deployed",
        );

        // Step 11: update the registries addresses from the PolymathRegistry contract
        await I_PolymathRegistry.changeAddress("PolyToken", I_PolyToken.address, {from: account_polymath})
        await I_PolymathRegistry.changeAddress("FeatureRegistry", I_FeatureRegistry.address, {from: account_polymath});
        await I_PolymathRegistry.changeAddress("ModuleRegistry", I_ModuleRegistryProxy.address, {from: account_polymath});
        await I_PolymathRegistry.changeAddress("SecurityTokenRegistry", I_SecurityTokenRegistryProxy.address, {from: account_polymath});
        await I_MRProxied.updateFromRegistry({from: account_polymath});

        // Printing all the contract addresses
        console.log(`
        --------------------- Polymath Network Smart Contracts: ---------------------
        PolymathRegistry:                  ${PolymathRegistry.address}
        SecurityTokenRegistryProxy:        ${SecurityTokenRegistryProxy.address}
        SecurityTokenRegistry:             ${SecurityTokenRegistry.address}
        ModuleRegistry:                    ${ModuleRegistry.address}
        ModuleRegistryProxy:               ${ModuleRegistryProxy.address}
        FeatureRegistry:                   ${FeatureRegistry.address}

        STFactory:                         ${STFactory.address}
        GeneralTransferManagerFactory:     ${GeneralTransferManagerFactory.address}
        -----------------------------------------------------------------------------
        `);
    });

    describe("Test cases for the ModuleRegistry", async() => {

        describe("Test case for the upgradeFromregistry", async() => {

            it("Should successfully update the registry contract address -- failed because of bad owner", async() => {
                let errorThrown = false;
                try {
                    await I_MRProxied.updateFromRegistry({from: account_temp});
                } catch(error) {
                    console.log(`       tx -> revert because of bad owner`);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
            });

            it("Should successfully update the registry contract addresses", async() => {
                await I_MRProxied.updateFromRegistry({from: account_polymath});
                assert.equal(await I_MRProxied.getAddressValues.call(web3.utils.soliditySha3("securityTokenRegistry")), I_SecurityTokenRegistryProxy.address);
                assert.equal(await I_MRProxied.getAddressValues.call(web3.utils.soliditySha3("featureRegistry")), I_FeatureRegistry.address);
                assert.equal(await I_MRProxied.getAddressValues.call(web3.utils.soliditySha3("polyToken")), I_PolyToken.address);
            });

        });

        describe("Test the state variables", async() => {

            it("Should be the right owner", async() => {
                let _owner = await I_MRProxied.getAddressValues.call(web3.utils.soliditySha3('owner'));
                assert.equal(_owner, account_polymath, "Owner should be the correct");
            })

            it("Should be the expected value of the paused and intialised variable", async() => {
                let _paused = await I_MRProxied.getBoolValues.call(web3.utils.soliditySha3("paused"));
                assert.isFalse(_paused, "Should be the false");

                let _intialised = await I_MRProxied.getBoolValues.call(web3.utils.soliditySha3("initialised"));
                assert.isTrue(_intialised, "Values should be the true");
            })

            it("Should be the expected value of the polymath registry", async() => {
                let _polymathRegistry = await I_MRProxied.getAddressValues.call(web3.utils.soliditySha3("polymathRegistry"));
                assert.equal(_polymathRegistry, I_PolymathRegistry.address, "Should be the right value of the address of the polymath registry");
            });
        });

        describe("Test cases for the registering the module", async() => {

            it("Should fail to register the module -- when registerModule is paused", async() => {
                await I_MRProxied.pause({from: account_polymath});
                let errorThrown = false;
                try {
                    let tx = await I_MRProxied.registerModule(I_GeneralTransferManagerFactory.address, {from: account_delegate});
                } catch(error) {
                    console.log(`       tx -> revert because already registered modules are not allowed`);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
                await I_MRProxied.unpause({from: account_polymath});
            })

            it("Should register the module with the Module Registry", async() => {
                let tx = await I_MRProxied.registerModule(I_GeneralTransferManagerFactory.address, {from: account_polymath});
                assert.equal(tx.logs[0].args._moduleFactory, I_GeneralTransferManagerFactory.address, "Should be the same address");
                assert.equal(tx.logs[0].args._owner, account_polymath, "Should be the right owner");

                let _list = await I_MRProxied.getModulesByType(transferManagerKey);
                assert.equal(_list.length, 1, "Length should be 1");
                assert.equal(_list[0], I_GeneralTransferManagerFactory.address);

                let _reputation = await I_MRProxied.getReputationByFactory(I_GeneralTransferManagerFactory.address);
                assert.equal(_reputation.length, 0);
            });

            it("Should fail the register the module -- Already registered module", async() => {
                let errorThrown = false;
                try {
                    let tx = await I_MRProxied.registerModule(I_GeneralTransferManagerFactory.address, {from: account_polymath});
                } catch(error) {
                    console.log(`       tx -> revert because already registered modules are not allowed`);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
            })

            it("Should fail in registering the module-- type = 0", async() => {
                I_MockFactory = await MockFactory.new(I_PolyToken.address, 0, 0, 0, {from: account_polymath});
                let errorThrown = false;
                try {
                    await I_MRProxied.registerModule(I_MockFactory.address, { from: account_polymath });
                } catch(error) {
                    console.log(`         tx revert -> Module factory of 0 type`.grey);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
            });
        });

        describe("Test case for verifyModule", async() => {

            it("Should fail in calling the verify module. Because msg.sender should be account_polymath", async () => {
                let errorThrown = false;
                try {
                    await I_MRProxied.verifyModule(I_GeneralTransferManagerFactory.address, true, { from: account_temp });
                } catch(error) {
                    console.log(`         tx revert -> msg.sender should be account_polymath`.grey);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
            });

            it("Should successfully verify the module -- true", async() => {
                let tx = await I_MRProxied.verifyModule(I_GeneralTransferManagerFactory.address, true, { from: account_polymath });
                assert.equal(
                    tx.logs[0].args._moduleFactory,
                    I_GeneralTransferManagerFactory.address,
                    "Failed in verifying the module"
                );
                assert.equal(
                    tx.logs[0].args._verified,
                    true,
                    "Failed in verifying the module"
                );
            });

            it("Should successfully verify the module -- false", async() => {
                I_CappedSTOFactory1 = await CappedSTOFactory.new(I_PolyToken.address, 0, 0, 0, {from: account_polymath});
                await I_MRProxied.registerModule(I_CappedSTOFactory1.address, {from: account_polymath});
                let tx = await I_MRProxied.verifyModule(I_CappedSTOFactory1.address, false, { from: account_polymath });
                assert.equal(
                    tx.logs[0].args._moduleFactory,
                    I_CappedSTOFactory1.address,
                    "Failed in verifying the module"
                );
                assert.equal(
                    tx.logs[0].args._verified,
                    false,
                    "Failed in verifying the module"
                );
            });

            it("Should fail in verifying the module. Because the module is not registered", async() => {
                let errorThrown = false;
                try {
                    await I_MRProxied.verifyModule(I_MockFactory.address, true, { from: account_polymath });
                } catch(error) {
                    console.log(`         tx revert -> Module is not registered`.grey);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
            });
        })

        describe("Test cases for the useModule function of the module registry", async() => {

            it("Deploy the securityToken", async() => {
                await I_PolyToken.getTokens(web3.utils.toWei("500"), account_issuer);
                await I_PolyToken.approve(I_STRProxied.address, web3.utils.toWei("500"), {from: account_issuer});
                await I_STRProxied.registerTicker(account_issuer, symbol, name, {from: account_issuer});
                let tx = await I_STRProxied.generateSecurityToken(name, symbol, tokenDetails, true, {from: account_issuer});
                assert.equal(tx.logs[1].args._ticker, symbol.toUpperCase());
                I_SecurityToken = SecurityToken.at(tx.logs[1].args._securityTokenAddress);
            });

            it("Should fail in adding module. Because module is un-verified", async() => {
                startTime = latestTime() + duration.seconds(5000);
                endTime = startTime + duration.days(30);
                let bytesSTO = encodeModuleCall(STOParameters, [startTime, endTime, cap, rate, fundRaiseType, account_fundsReceiver]);
                let errorThrown = false;
                try {
                    const tx = await I_SecurityToken.addModule(I_CappedSTOFactory1.address, bytesSTO, 0, 0, { from: token_owner});
                } catch(error) {
                    errorThrown = true;
                    console.log(`         tx revert -> Module is un-verified`.grey);
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
            });

            it("Should fail to register module because custom modules not allowed", async() => {
                I_CappedSTOFactory2 = await CappedSTOFactory.new(I_PolyToken.address, 0, 0, 0, { from: token_owner });

                assert.notEqual(
                    I_CappedSTOFactory2.address.valueOf(),
                    "0x0000000000000000000000000000000000000000",
                    "CappedSTOFactory contract was not deployed"
                );


                let errorThrown = false;
                try {
                    let tx = await I_MRProxied.registerModule(I_CappedSTOFactory2.address, { from: token_owner });
                } catch(error) {
                    errorThrown = true;
                    console.log(`         tx revert -> Module is un-verified`.grey);
                    ensureException(error);
                }
                assert.ok(errorThrown, message);

            });

            it("Should switch customModulesAllowed to true", async() => {
                assert.equal(false, await I_FeatureRegistry.getFeatureStatus.call("customModulesAllowed"), "Custom modules should be dissabled by default.");
                let tx = await I_FeatureRegistry.setFeatureStatus("customModulesAllowed", true, { from: account_polymath });
                assert.equal(true, await I_FeatureRegistry.getFeatureStatus.call("customModulesAllowed"), "Custom modules should be switched to true.");
            });

            it("Should successfully add module because custom modules switched on", async() => {
                startTime = latestTime() + duration.seconds(5000);
                endTime = startTime + duration.days(30);
                let bytesSTO = encodeModuleCall(STOParameters, [startTime, endTime, cap, rate, fundRaiseType, account_fundsReceiver]);
                let tx = await I_MRProxied.registerModule(I_CappedSTOFactory2.address, { from: token_owner });
                tx = await I_SecurityToken.addModule(I_CappedSTOFactory2.address, bytesSTO, 0, 0, { from: token_owner});

                assert.equal(tx.logs[2].args._types[0], stoKey, "CappedSTO doesn't get deployed");
                assert.equal(
                    web3.utils.toAscii(tx.logs[2].args._name)
                    .replace(/\u0000/g, ''),
                    "CappedSTO",
                    "CappedSTOFactory module was not added"
                );
                let _reputation = await I_MRProxied.getReputationByFactory.call(I_CappedSTOFactory2.address);
                assert.equal(_reputation.length, 1);
            });

            it("Should successfully add verified module", async() => {
                I_GeneralPermissionManagerFactory = await GeneralPermissionManagerFactory.new(I_PolyToken.address, 0, 0, 0, {from: account_polymath});
                await I_MRProxied.registerModule(I_GeneralPermissionManagerFactory.address, {from: account_polymath});
                await I_MRProxied.verifyModule(I_GeneralPermissionManagerFactory.address, true, {from: account_polymath});
                let tx = await I_SecurityToken.addModule(I_GeneralPermissionManagerFactory.address, "", 0, 0, { from: token_owner });
                assert.equal(tx.logs[2].args._types[0], permissionManagerKey, "module doesn't get deployed");
            });

            it("Should failed in adding the TestSTOFactory module because not compatible with the current protocol version --lower", async() => {
                I_TestSTOFactory = await TestSTOFactory.new(I_PolyToken.address, 0, 0, 0, {from: account_polymath});
                await I_MRProxied.registerModule(I_TestSTOFactory.address, {from: account_polymath});
                await I_MRProxied.verifyModule(I_TestSTOFactory.address, true, {from: account_polymath});
                // Taking the snapshot the revert the changes from here
                let id = await takeSnapshot();
                await I_TestSTOFactory.changeSTVersionBounds("lowerBound", [0,1,0], {from: account_polymath});
                let _lstVersion = await I_TestSTOFactory.getLowerSTVersionBounds.call()
                assert.equal(_lstVersion[2],0);
                assert.equal(_lstVersion[1],1);
                let bytesData = encodeModuleCall(['uint256', 'uint256', 'uint256', 'string'],[latestTime(), (latestTime() + duration.days(1)), cap, "Test STO"]);
                let errorThrown = false;
                try {
                    let tx = await I_SecurityToken.addModule(I_TestSTOFactory.address, bytesData, 0, 0, { from: token_owner });
                } catch(error) {
                    errorThrown = true;
                    console.log(`         tx revert -> Incompatible with the lower bound of the Module factory`.grey);
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
                await revertToSnapshot(id);
            })

            it("Should failed in adding the TestSTOFactory module because not compatible with the current protocol version --upper", async() => {
                await I_TestSTOFactory.changeSTVersionBounds("upperBound", [0,0,1], {from: account_polymath});
                let _ustVersion = await I_TestSTOFactory.getUpperSTVersionBounds.call()
                assert.equal(_ustVersion[0],0);
                assert.equal(_ustVersion[2],1);
                await I_STRProxied.setProtocolVersion(I_STFactory.address, 1, 0, 1);

                // Generate the new securityToken
                let newSymbol = "toro";
                await I_PolyToken.getTokens(web3.utils.toWei("500"), account_issuer);
                await I_PolyToken.approve(I_STRProxied.address, web3.utils.toWei("500"), {from: account_issuer});
                await I_STRProxied.registerTicker(account_issuer, newSymbol, name, {from: account_issuer});
                let tx = await I_STRProxied.generateSecurityToken(name, newSymbol, tokenDetails, true, {from: account_issuer});
                assert.equal(tx.logs[1].args._ticker, newSymbol.toUpperCase());
                I_SecurityToken2 = SecurityToken.at(tx.logs[1].args._securityTokenAddress);


                let bytesData = encodeModuleCall(['uint256', 'uint256', 'uint256', 'string'],[latestTime(), (latestTime() + duration.days(1)), cap, "Test STO"]);
                let errorThrown = false;
                try {
                    let tx = await I_SecurityToken2.addModule(I_TestSTOFactory.address, bytesData, 0, 0, { from: token_owner });
                } catch(error) {
                    errorThrown = true;
                    console.log(`         tx revert -> Incompatible with the upper bound of the Module factory`.grey);
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
            });

        });

        describe("Test case for the getModulesByTypeAndToken()", async() => {

            it("Should get the list of available modules when the customModulesAllowed", async() => {
                let _list = await I_MRProxied.getModulesByTypeAndToken.call(3, I_SecurityToken.address);
                assert.equal(_list[0], I_CappedSTOFactory2.address);
            })

            it("Should get the list of available modules when the customModulesAllowed is not allowed", async() => {
                await I_FeatureRegistry.setFeatureStatus("customModulesAllowed", false, { from: account_polymath });
                let _list = await I_MRProxied.getModulesByTypeAndToken.call(3, I_SecurityToken.address);
                assert.equal(_list.length, 0);
            })
        })

        describe("Test cases for getters", async() => {

            it("Check getter - ", async() => {
                console.log("getModulesByType:")
                for (let i = 0; i < 5; i++) {
                    let _list = await I_MRProxied.getModulesByType.call(i);
                    console.log("Type: " + i + ":" + _list);
                }
                console.log("getModulesByTypeAndToken:")
                for (let i = 0; i < 5; i++) {
                    let _list = await I_MRProxied.getModulesByTypeAndToken.call(i, I_SecurityToken.address);
                    console.log("Type: " + i + ":" + _list);
                }
                console.log("getTagsByType:")
                for (let i = 0; i < 5; i++) {
                    let _list = await I_MRProxied.getTagsByType.call(i);
                    console.log("Type: " + i + ":" + _list[1]);
                    console.log("Type: " + i + ":" + _list[0].map(x => web3.utils.toAscii(x)));
                }
                console.log("getTagsByTypeAndToken:")
                for (let i = 0; i < 5; i++) {
                    let _list = await I_MRProxied.getTagsByTypeAndToken.call(i, I_SecurityToken.address);
                    console.log("Type: " + i + ":" + _list[1]);
                    console.log("Type: " + i + ":" + _list[0].map(x => web3.utils.toAscii(x)));
                }
            })

        });

        describe("Test cases for removeModule()", async() => {

            it("Should fail if msg.sender not curator or owner", async() => {
                let errorThrown = false;
                try {
                    await I_MRProxied.removeModule(I_CappedSTOFactory2.address, { from: account_temp });
                } catch(error) {
                    errorThrown = true;
                    console.log(`         tx revert -> Module is un-verified`.grey);
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
            });

            it("Should successfully remove module and delete data if msg.sender is curator", async() => {
                let snap = await takeSnapshot();

                let sto1 = (await I_MRProxied.getModulesByType.call(3))[0];
                let sto2 = (await I_MRProxied.getModulesByType.call(3))[1];

                assert.equal(sto1,I_CappedSTOFactory1.address);
                assert.equal(sto2,I_CappedSTOFactory2.address);
                assert.equal((await I_MRProxied.getModulesByType.call(3)).length, 3);

                let tx = await I_MRProxied.removeModule(sto1, { from: account_polymath });

                assert.equal(tx.logs[0].args._moduleFactory, sto1, "Event is not properly emitted for _moduleFactory");
                assert.equal(tx.logs[0].args._decisionMaker, account_polymath, "Event is not properly emitted for _decisionMaker");

                let sto2_end = (await I_MRProxied.getModulesByType.call(3))[1];

                // re-ordering
                assert.equal(sto2_end,sto2);
                // delete related data
                assert.equal(await I_MRProxied.getUintValues.call(web3.utils.soliditySha3("registry", sto1)), 0);
                assert.equal(await I_MRProxied.getReputationByFactory.call(sto1), 0);
                assert.equal((await I_MRProxied.getModulesByType.call(3)).length, 2);
                assert.equal(await I_MRProxied.getBoolValues.call(web3.utils.soliditySha3("verified", sto1)), false);

                await revertToSnapshot(snap);
            });

            it("Should successfully remove module and delete data if msg.sender is owner", async() => {
                let sto1 = (await I_MRProxied.getModulesByType.call(3))[0];
                let sto2 = (await I_MRProxied.getModulesByType.call(3))[1];

                assert.equal(sto1,I_CappedSTOFactory1.address);
                assert.equal(sto2,I_CappedSTOFactory2.address);
                assert.equal((await I_MRProxied.getModulesByType.call(3)).length, 3);

                let tx = await I_MRProxied.removeModule(sto2, { from: token_owner });

                assert.equal(tx.logs[0].args._moduleFactory, sto2, "Event is not properly emitted for _moduleFactory");
                assert.equal(tx.logs[0].args._decisionMaker, token_owner, "Event is not properly emitted for _decisionMaker");

                let sto1_end = (await I_MRProxied.getModulesByType.call(3))[0];

                // re-ordering
                assert.equal(sto1_end,sto1);
                // delete related data
                assert.equal(await I_MRProxied.getUintValues.call(web3.utils.soliditySha3("registry", sto2)), 0);
                assert.equal(await I_MRProxied.getReputationByFactory.call(sto2), 0);
                assert.equal((await I_MRProxied.getModulesByType.call(3)).length, 2);
                assert.equal(await I_MRProxied.getBoolValues.call(web3.utils.soliditySha3("verified", sto2)), false);
            });

            it("Should fail if module already removed", async() => {
                let errorThrown = false;
                try {
                    await I_MRProxied.removeModule(I_CappedSTOFactory2.address, { from: account_polymath });
                } catch(error) {
                    errorThrown = true;
                    console.log(`         tx revert -> Module is un-verified`.grey);
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
            });

        });

        describe("Test cases for IRegistry functionality", async() => {

        describe("Test cases for reclaiming funds", async() => {

            it("Should successfully reclaim POLY tokens", async() => {
                await I_PolyToken.getTokens(web3.utils.toWei("1"), I_MRProxied.address);
                let bal1 = await I_PolyToken.balanceOf.call(account_polymath);
                await I_MRProxied.reclaimERC20(I_PolyToken.address);
                let bal2 = await I_PolyToken.balanceOf.call(account_polymath);
                assert.isAtLeast(bal2.dividedBy(new BigNumber(10).pow(18)).toNumber(), bal2.dividedBy(new BigNumber(10).pow(18)).toNumber());
            });

        });

        describe("Test cases for pausing the contract", async() => {

            it("Should fail to pause if msg.sender is not owner", async() => {
                let errorThrown = false;
                try {
                    await I_MRProxied.pause({ from: account_temp });
                } catch(error) {
                    console.log(`         tx revert -> msg.sender should be account_polymath`.grey);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
            });

            it("Should successfully pause the contract", async() => {
                await I_MRProxied.pause({ from: account_polymath });
                let status = await I_MRProxied.getBoolValues.call(web3.utils.soliditySha3("paused"));
                assert.isOk(status);
            });

            it("Should fail to unpause if msg.sender is not owner", async() => {
                let errorThrown = false;
                try {
                    await I_MRProxied.unpause({ from: account_temp });
                } catch(error) {
                    console.log(`         tx revert -> msg.sender should be account_polymath`.grey);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
            });

            it("Should successfully unpause the contract", async() => {
                await I_MRProxied.unpause({ from: account_polymath });
                let status = await I_MRProxied.getBoolValues.call(web3.utils.soliditySha3("paused"));
                assert.isNotOk(status);
            });

        });

    });
    });

});
