import latestTime from './helpers/latestTime';
import { duration, ensureException, promisifyLogWatch, latestBlock } from './helpers/utils';
import takeSnapshot, { increaseTime, revertToSnapshot } from './helpers/time';
import { encodeProxyCall, encodeModuleCall } from './helpers/encodeCall';

const PolymathRegistry = artifacts.require('./PolymathRegistry.sol')
const CappedSTOFactory = artifacts.require('./CappedSTOFactory.sol');
const CappedSTO = artifacts.require('./CappedSTO.sol');
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

const Web3 = require('web3');
const BigNumber = require('bignumber.js');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")) // Hardcoded development port


contract('SecurityToken', accounts => {


    // Accounts Variable declaration
    let account_polymath;
    let account_investor1;
    let account_issuer;
    let token_owner;
    let account_investor2;
    let account_investor3;
    let account_affiliate1;
    let account_affiliate2;
    let account_fundsReceiver;
    let account_delegate;
    let account_temp;
    let account_controller;
    let address_zero = "0x0000000000000000000000000000000000000000";

    let balanceOfReceiver;
    // investor Details
    let fromTime;
    let toTime;
    let expiryTime;

    let ID_snap;
    const message = "Transaction Should Fail!!";

    // Contract Instance Declaration
    let I_GeneralPermissionManagerFactory;
    let I_SecurityTokenRegistryProxy;
    let I_GeneralTransferManagerFactory;
    let I_GeneralPermissionManager;
    let I_GeneralTransferManager;
    let I_ModuleRegistryProxy;
    let I_ModuleRegistry;
    let I_FeatureRegistry;
    let I_SecurityTokenRegistry;
    let I_CappedSTOFactory;
    let I_STFactory;
    let I_SecurityToken;
    let I_STRProxied;
    let I_MRProxied;
    let I_CappedSTO;
    let I_PolyToken;
    let I_PolymathRegistry;

    // SecurityToken Details (Launched ST on the behalf of the issuer)
    const name = "Demo Token";
    const symbol = "DET";
    const tokenDetails = "This is equity type of issuance";
    const decimals = 18;
    let snap_Id;
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
    const TM_Perm_Whitelist = 'WHITELIST';

    // Capped STO details
    let startTime;
    let endTime;
    const cap = web3.utils.toWei("10000");
    const rate = 1000;
    const fundRaiseType = [0];
    const cappedSTOSetupCost= web3.utils.toWei("20000","ether");
    const maxCost = cappedSTOSetupCost;
    const STOParameters = ['uint256', 'uint256', 'uint256', 'uint256', 'uint8[]', 'address'];
    const STRProxyParameters = ['address', 'address', 'uint256', 'uint256', 'address', 'address'];
    const MRProxyParameters = ['address', 'address'];

    before(async() => {

        // Accounts setup
        account_polymath = accounts[0];
        account_issuer = accounts[1];
        account_affiliate1 = accounts[2];
        account_affiliate2 = accounts[3];
        account_fundsReceiver = accounts[4];
        account_delegate = accounts[5];
        account_investor2 = accounts[6];
        account_investor3 = accounts[7];
        account_temp = accounts[8];
        account_investor1 = accounts[9];

        token_owner = account_issuer;
        account_controller = account_temp;

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
        // Step 3 (b):  Deploy the proxy and attach the implementation contract to it
        I_ModuleRegistryProxy = await ModuleRegistryProxy.new({from:account_polymath});
        let bytesMRProxy = encodeProxyCall(MRProxyParameters, [I_PolymathRegistry.address, account_polymath]);
        await I_ModuleRegistryProxy.upgradeToAndCall("1.0.0", I_ModuleRegistry.address, bytesMRProxy, {from: account_polymath});
        I_MRProxied = await ModuleRegistry.at(I_ModuleRegistryProxy.address);

        // STEP 4 (a): Deploy the GeneralTransferManagerFactory

        I_GeneralTransferManagerFactory = await GeneralTransferManagerFactory.new(I_PolyToken.address, 0, 0, 0, {from:account_polymath});

        assert.notEqual(
            I_GeneralTransferManagerFactory.address.valueOf(),
            address_zero,
            "GeneralTransferManagerFactory contract was not deployed"
        );

        // STEP 4 (b): Deploy the GeneralDelegateManagerFactory

        I_GeneralPermissionManagerFactory = await GeneralPermissionManagerFactory.new(I_PolyToken.address, 0, 0, 0, {from:account_polymath});

        assert.notEqual(
            I_GeneralPermissionManagerFactory.address.valueOf(),
            address_zero,
            "GeneralDelegateManagerFactory contract was not deployed"
        );

        // STEP 4 (c): Deploy the CappedSTOFactory

        I_CappedSTOFactory = await CappedSTOFactory.new(I_PolyToken.address, cappedSTOSetupCost, 0, 0, { from: token_owner });

        assert.notEqual(
            I_CappedSTOFactory.address.valueOf(),
            address_zero,
            "CappedSTOFactory contract was not deployed"
        );

        // STEP 5: Register the Modules with the ModuleRegistry contract

       // Step 6: Deploy the STFactory contract

       I_STFactory = await STFactory.new(I_GeneralTransferManagerFactory.address, {from : account_polymath });

       assert.notEqual(
           I_STFactory.address.valueOf(),
           "0x0000000000000000000000000000000000000000",
           "STFactory contract was not deployed",
       );

       // Step 7: Deploy the SecurityTokenRegistry contract

       I_SecurityTokenRegistry = await SecurityTokenRegistry.new({from: account_polymath });

       assert.notEqual(
           I_SecurityTokenRegistry.address.valueOf(),
           "0x0000000000000000000000000000000000000000",
           "SecurityTokenRegistry contract was not deployed",
       );

       // Step 8: Deploy the proxy and attach the implementation contract to it.
        I_SecurityTokenRegistryProxy = await SecurityTokenRegistryProxy.new({from: account_polymath});
        let bytesProxy = encodeProxyCall(STRProxyParameters, [I_PolymathRegistry.address, I_STFactory.address, initRegFee, initRegFee, I_PolyToken.address, account_polymath]);
        await I_SecurityTokenRegistryProxy.upgradeToAndCall("1.0.0", I_SecurityTokenRegistry.address, bytesProxy, {from: account_polymath});
        I_STRProxied = await SecurityTokenRegistry.at(I_SecurityTokenRegistryProxy.address);

       // Step 9: update the registries addresses from the PolymathRegistry contract
       await I_PolymathRegistry.changeAddress("PolyToken", I_PolyToken.address, {from: account_polymath})
       await I_PolymathRegistry.changeAddress("ModuleRegistry", I_ModuleRegistryProxy.address, {from: account_polymath});
       await I_PolymathRegistry.changeAddress("FeatureRegistry", I_FeatureRegistry.address, {from: account_polymath});
       await I_PolymathRegistry.changeAddress("SecurityTokenRegistry", I_SecurityTokenRegistryProxy.address, {from: account_polymath});
       await I_MRProxied.updateFromRegistry({from: account_polymath});
       // (A) :  Register the GeneralTransferManagerFactory
       await I_MRProxied.registerModule(I_GeneralTransferManagerFactory.address, { from: account_polymath });
       await I_MRProxied.verifyModule(I_GeneralTransferManagerFactory.address, true, { from: account_polymath });

       // (B) :  Register the GeneralDelegateManagerFactory
       await I_MRProxied.registerModule(I_GeneralPermissionManagerFactory.address, { from: account_polymath });
       await I_MRProxied.verifyModule(I_GeneralPermissionManagerFactory.address, true, { from: account_polymath });

       // (C) : Register the STOFactory
       await I_MRProxied.registerModule(I_CappedSTOFactory.address, { from: account_polymath });
       await I_MRProxied.verifyModule(I_CappedSTOFactory.address, true, { from: account_polymath });


        // Printing all the contract addresses
        console.log(`
        --------------------- Polymath Network Smart Contracts: ---------------------
        PolymathRegistry:                  ${PolymathRegistry.address}
        SecurityTokenRegistryProxy:        ${SecurityTokenRegistryProxy.address}
        SecurityTokenRegistry:             ${SecurityTokenRegistry.address}
        ModuleRegistryProxy:               ${ModuleRegistryProxy.address}
        ModuleRegistry:                    ${ModuleRegistry.address}
        FeatureRegistry:                   ${FeatureRegistry.address}

        STFactory:                         ${STFactory.address}
        GeneralTransferManagerFactory:     ${GeneralTransferManagerFactory.address}
        GeneralPermissionManagerFactory:   ${GeneralPermissionManagerFactory.address}

        CappedSTOFactory:                  ${I_CappedSTOFactory.address}
        -----------------------------------------------------------------------------
        `);
    });

    describe("Generate the SecurityToken", async() => {

        it("Should register the ticker before the generation of the security token", async () => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner });
            let tx = await I_STRProxied.registerTicker(token_owner, symbol, name, { from : token_owner });
            assert.equal(tx.logs[0].args._owner, token_owner);
            assert.equal(tx.logs[0].args._ticker, symbol);
        });

        it("Should generate the new security token with the same symbol as registered above", async () => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner });
            let _blockNo = latestBlock();
            let tx = await I_STRProxied.generateSecurityToken(name, symbol, tokenDetails, false, { from: token_owner });
            // Verify the successful generation of the security token
            assert.equal(tx.logs[1].args._ticker, symbol, "SecurityToken doesn't get deployed");

            I_SecurityToken = SecurityToken.at(tx.logs[1].args._securityTokenAddress);

            const log = await promisifyLogWatch(I_SecurityToken.ModuleAdded({from: _blockNo}), 1);

            // Verify that GeneralTransferManager module get added successfully or not
            console.log(log.args);
            assert.equal(log.args._types[0].toNumber(), transferManagerKey);
            assert.equal(web3.utils.toUtf8(log.args._name),"GeneralTransferManager");
        });

        it("Should intialize the auto attached modules", async () => {
            let moduleData = (await I_SecurityToken.getModulesByType(transferManagerKey))[0];
            I_GeneralTransferManager = GeneralTransferManager.at(moduleData);

            assert.notEqual(
                I_GeneralTransferManager.address.valueOf(),
                address_zero,
                "GeneralTransferManager contract was not deployed",
            );

        });

        it("Should mint the tokens before attaching the STO -- fail only be called by the owner", async() => {
            let errorThrown = false;
            let fromTime = latestTime();
            let toTime = fromTime + duration.days(100);
            let expiryTime = toTime + duration.days(100);

            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_affiliate1,
                fromTime,
                toTime,
                expiryTime,
                true,
                {
                    from: token_owner,
                    gas: 6000000
                });
            assert.equal(tx.logs[0].args._investor, account_affiliate1, "Failed in adding the investor in whitelist");
            try {
                await I_SecurityToken.mint(account_investor1, (100 * Math.pow(10, 18)), {from: account_delegate});
            } catch(error) {
                console.log(`         tx revert -> Mint only be called by the owner of the SecurityToken`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should mint the tokens before attaching the STO", async() => {
            await I_SecurityToken.mint(account_affiliate1, (100 * Math.pow(10, 18)), {from: token_owner, gas: 500000});
            let balance = await I_SecurityToken.balanceOf(account_affiliate1);
            assert.equal(balance.dividedBy(new BigNumber(10).pow(18)).toNumber(), 100);
        });

        it("Should mint the multi tokens before attaching the STO -- fail only be called by the owner", async() => {
            let errorThrown = false;
            let fromTime = latestTime();
            let toTime = fromTime + duration.days(100);
            let expiryTime = toTime + duration.days(100);

            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_affiliate2,
                fromTime,
                toTime,
                expiryTime,
                true,
                {
                    from: token_owner,
                    gas: 6000000
                });

            assert.equal(tx.logs[0].args._investor, account_affiliate2, "Failed in adding the investor in whitelist");
            try {
                await I_SecurityToken.mintMulti([account_affiliate1, account_affiliate2], [(100 * Math.pow(10, 18)), (110 * Math.pow(10, 18))], {from: account_delegate, gas: 500000});
            } catch(error) {
                console.log(`         tx revert -> Mint only be called by the owner of the SecurityToken`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should mintMulti", async() => {
            let errorThrown = false;
            try {
                await I_SecurityToken.mintMulti([account_affiliate1, account_affiliate2], [(100 * Math.pow(10, 18))], {from: token_owner, gas: 500000});
            } catch(error) {
                console.log(`         tx revert -> Array length are un-equal`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        })

        it("Should mint the tokens for multiple afiliated investors before attaching the STO", async() => {
            await I_SecurityToken.mintMulti([account_affiliate1, account_affiliate2], [(100 * Math.pow(10, 18)), (110 * Math.pow(10, 18))], {from: token_owner, gas: 500000});
            let balance1 = await I_SecurityToken.balanceOf(account_affiliate1);
            assert.equal(balance1.dividedBy(new BigNumber(10).pow(18)).toNumber(), 200);
            let balance2 = await I_SecurityToken.balanceOf(account_affiliate2);
            assert.equal(balance2.dividedBy(new BigNumber(10).pow(18)).toNumber(), 110);
        });

        it("Should finish the minting -- fail because feature is not activated", async() => {
            let errorThrown = false;
            try {
                await I_SecurityToken.freezeMinting({from: token_owner});
            } catch(error) {
                console.log(`         tx revert -> freezeMinting cannot be called before activated by polymath`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should finish the minting -- fail to activate the feature because msg.sender is not polymath", async() => {
            let errorThrown = false;
            try {
                await I_FeatureRegistry.setFeatureStatus("freezeMintingAllowed", true, {from: token_owner});
            } catch(error) {
                console.log(`         tx revert -> allowFreezeMinting must be called by polymath`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should finish the minting -- successfully activate the feature", async() => {
            let errorThrown1 = false;
            try {
                await I_FeatureRegistry.setFeatureStatus("freezeMintingAllowed", false, {from: account_polymath});
            } catch(error) {
                console.log(`         tx revert -> must change state`.grey);
                errorThrown1 = true;
                ensureException(error);
            }
            assert.ok(errorThrown1, message);

            assert.equal(false, await I_FeatureRegistry.getFeatureStatus("freezeMintingAllowed", {from: account_temp}));
            await I_FeatureRegistry.setFeatureStatus("freezeMintingAllowed", true, {from: account_polymath});
            assert.equal(true, await I_FeatureRegistry.getFeatureStatus("freezeMintingAllowed", {from: account_temp}));

            let errorThrown2 = false;
            try {
                await I_FeatureRegistry.setFeatureStatus("freezeMintingAllowed", true, {from: account_polymath});
            } catch(error) {
                console.log(`         tx revert -> must change state`.grey);
                errorThrown2 = true;
                ensureException(error);
            }
            assert.ok(errorThrown2, message);
        });

        it("Should finish the minting -- fail because msg.sender is not the owner", async() => {
            let errorThrown = false;
            try {
                await I_SecurityToken.freezeMinting({from: account_temp});
            } catch(error) {
                console.log(`         tx revert -> freezeMinting only be called by the owner of the SecurityToken`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should finish minting & restrict the further minting", async() => {
            let id = await takeSnapshot();
            await I_SecurityToken.freezeMinting({from: token_owner});
            let errorThrown = false;
            try {
                await I_SecurityToken.mint(account_affiliate1, (100 * Math.pow(10, 18)), {from: token_owner, gas: 500000});
            } catch(error) {
                console.log(`         tx revert -> Minting is finished`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
            await revertToSnapshot(id);
        });

        it("Should fail to attach the STO factory because not enough poly in contract", async () => {
            startTime = latestTime() + duration.seconds(5000);
            endTime = startTime + duration.days(30);
            let bytesSTO = encodeModuleCall(STOParameters, [startTime, endTime, cap, rate, fundRaiseType, account_fundsReceiver]);
            let errorThrown = false;
            try {
                let tx = await I_SecurityToken.addModule(I_CappedSTOFactory.address, bytesSTO, maxCost, 0, { from: token_owner });
            } catch (error) {
                console.log(`         tx revert -> not enough poly in contract`);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should fail to attach the STO factory because max cost too small", async () => {
            startTime = latestTime() + duration.seconds(5000);
            endTime = startTime + duration.days(30);
            let bytesSTO = encodeModuleCall(STOParameters, [startTime, endTime, cap, rate, fundRaiseType, account_fundsReceiver]);
            await I_PolyToken.getTokens(cappedSTOSetupCost, token_owner);
            await I_PolyToken.transfer(I_SecurityToken.address, cappedSTOSetupCost, { from: token_owner});
            let errorThrown = false;
            try {
                let tx = await I_SecurityToken.addModule(I_CappedSTOFactory.address, bytesSTO, web3.utils.toWei("1000","ether"), 0, { from: token_owner });
            } catch (error) {
                console.log(`         tx revert -> max cost too small`);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should successfully attach the STO factory with the security token", async () => {
            startTime = latestTime() + duration.seconds(5000);
            endTime = startTime + duration.days(30);
            let bytesSTO = encodeModuleCall(STOParameters, [startTime, endTime, cap, rate, fundRaiseType, account_fundsReceiver]);

            await I_PolyToken.getTokens(cappedSTOSetupCost, token_owner);
            await I_PolyToken.transfer(I_SecurityToken.address, cappedSTOSetupCost, { from: token_owner});

            const tx = await I_SecurityToken.addModule(I_CappedSTOFactory.address, bytesSTO, maxCost, 0, { from: token_owner });

            assert.equal(tx.logs[3].args._types[0], stoKey, "CappedSTO doesn't get deployed");
            assert.equal(web3.utils.toUtf8(tx.logs[3].args._name), "CappedSTO", "CappedSTOFactory module was not added");
            I_CappedSTO = CappedSTO.at(tx.logs[3].args._module);
        });

        it("Should successfully mint tokens while STO attached", async () => {
            await I_SecurityToken.mint(account_affiliate1, (100 * Math.pow(10, 18)), {from: token_owner, gas: 500000});
            let balance = await I_SecurityToken.balanceOf(account_affiliate1);
            assert.equal(balance.dividedBy(new BigNumber(10).pow(18)).toNumber(), 300);
        });

        it("Should fail to mint tokens while STO attached after freezeMinting called", async () => {
            let id = await takeSnapshot();
            await I_SecurityToken.freezeMinting({from: token_owner});
            let errorThrown = false;
            try {
                await I_SecurityToken.mint(account_affiliate1, (100 * Math.pow(10, 18)), {from: token_owner, gas: 500000});
            } catch(error) {
                console.log(`         tx revert -> Minting is finished`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
            await revertToSnapshot(id);
        });

    });

    describe("Module related functions", async() => {
        it("Should get the modules of the securityToken by index", async () => {
            let moduleData = await I_SecurityToken.getModule.call(I_CappedSTO.address);
            assert.equal(web3.utils.toAscii(moduleData[0]).replace(/\u0000/g, ''), "CappedSTO");
            assert.equal(moduleData[1], I_CappedSTO.address);
            assert.equal(moduleData[2], I_CappedSTOFactory.address);
            assert.equal(moduleData[3], false);
            assert.equal(moduleData[4][0], 3);
        });

        it("Should get the modules of the securityToken by index (not added into the security token yet)", async () => {
            let moduleData = await I_SecurityToken.getModule.call(token_owner);
            assert.equal(web3.utils.toAscii(moduleData[0]).replace(/\u0000/g, ''), "");
            assert.equal(moduleData[1], address_zero);
        });

        it("Should get the modules of the securityToken by name", async () => {
            let moduleList = await I_SecurityToken.getModulesByName.call("CappedSTO");
            assert.isTrue(moduleList.length == 1, "Only one STO");
            let moduleData = await I_SecurityToken.getModule.call(moduleList[0]);
            assert.equal(web3.utils.toAscii(moduleData[0]).replace(/\u0000/g, ''), "CappedSTO");
            assert.equal(moduleData[1], I_CappedSTO.address);
        });

        it("Should get the modules of the securityToken by name (not added into the security token yet)", async () => {
            let moduleData = await I_SecurityToken.getModulesByName.call("GeneralPermissionManager");
            assert.isTrue(moduleData.length == 0, "No Permission Manager");
        });

        it("Should get the modules of the securityToken by name (not added into the security token yet)", async () => {
            let moduleData = await I_SecurityToken.getModulesByName.call("CountTransferManager");
            assert.isTrue(moduleData.length == 0, "No Permission Manager");
        });

        it("Should fail in updating the token details", async() => {
            let errorThrown = false;
            try {
                let log = await I_SecurityToken.updateTokenDetails("new token details", {from: account_delegate});
            } catch (error) {
                console.log(`         tx revert -> msg.sender should be the owner of the token`);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should update the token details", async() => {
            let log = await I_SecurityToken.updateTokenDetails("new token details", {from: token_owner});
            assert.equal(log.logs[0].args._newDetails, "new token details");
        });

        it("Should fail to remove the module - module not archived", async() => {
            let errorThrown = false;
            try {
                let tx = await I_SecurityToken.removeModule(I_GeneralTransferManager.address, { from : token_owner });
            } catch (error) {
                console.log(`       tx -> Failed because address doesn't exist`);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        })

        it("Should successfully remove the general transfer manager module from the securityToken -- fails msg.sender should be Owner", async() => {
            let errorThrown = false;
            try {
                let tx = await I_SecurityToken.removeModule(I_GeneralTransferManager.address, { from : account_temp });
            } catch (error) {
                console.log(`Test Case passed by restricting the unknown account to call removeModule of the securityToken`);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should fail to remove the module - incorrect address", async() => {
            let errorThrown = false;
            try {
                let tx = await I_SecurityToken.removeModule(0, { from : token_owner });
            } catch (error) {
                console.log(`       tx -> Failed because address doesn't exist`);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        })

        it("Should successfully remove the general transfer manager module from the securityToken", async() => {
            let key = await takeSnapshot();
            await I_SecurityToken.archiveModule(I_GeneralTransferManager.address, { from : token_owner });
            let tx = await I_SecurityToken.removeModule(I_GeneralTransferManager.address, { from : token_owner });
            assert.equal(tx.logs[0].args._types[0], transferManagerKey);
            assert.equal(tx.logs[0].args._module, I_GeneralTransferManager.address);
            await revertToSnapshot(key);
        });

        it("Should verify the revertion of snapshot works properly", async() => {
            let moduleData = await I_SecurityToken.getModule.call(I_GeneralTransferManager.address);
            assert.equal(web3.utils.toAscii(moduleData[0]).replace(/\u0000/g, ''), "GeneralTransferManager");
            assert.equal(moduleData[1], I_GeneralTransferManager.address);
        });


        it("Should successfully archive the general transfer manager module from the securityToken", async() => {
            let tx = await I_SecurityToken.archiveModule(I_GeneralTransferManager.address, { from : token_owner });
            assert.equal(tx.logs[0].args._types[0], transferManagerKey);
            assert.equal(tx.logs[0].args._module, I_GeneralTransferManager.address);
            let moduleData = await I_SecurityToken.getModule.call(I_GeneralTransferManager.address);
            assert.equal(web3.utils.toAscii(moduleData[0]).replace(/\u0000/g, ''), "GeneralTransferManager");
            assert.equal(moduleData[1], I_GeneralTransferManager.address);
            assert.equal(moduleData[2], I_GeneralTransferManagerFactory.address);
            assert.equal(moduleData[3], true);
        });

        it("Should successfully mint tokens while GTM archived", async () => {
            let key = await takeSnapshot();
            await I_SecurityToken.mint(1, (100 * Math.pow(10, 18)), {from: token_owner, gas: 500000});
            let balance = await I_SecurityToken.balanceOf(1);
            assert.equal(balance.dividedBy(new BigNumber(10).pow(18)).toNumber(), 100);
            await revertToSnapshot(key);
        });

        it("Should successfully unarchive the general transfer manager module from the securityToken", async() => {
            let tx = await I_SecurityToken.unarchiveModule(I_GeneralTransferManager.address, { from : token_owner });
            assert.equal(tx.logs[0].args._types[0], transferManagerKey);
            assert.equal(tx.logs[0].args._module, I_GeneralTransferManager.address);
            let moduleData = await I_SecurityToken.getModule.call(I_GeneralTransferManager.address);
            assert.equal(web3.utils.toAscii(moduleData[0]).replace(/\u0000/g, ''), "GeneralTransferManager");
            assert.equal(moduleData[1], I_GeneralTransferManager.address);
            assert.equal(moduleData[2], I_GeneralTransferManagerFactory.address);
            assert.equal(moduleData[3], false);
        });

        it("Should fail to mint tokens while GTM unarchived", async () => {
            let errorThrown = false;
            try {
              await I_SecurityToken.mint(1, (100 * Math.pow(10, 18)), {from: token_owner, gas: 500000});
            } catch(error) {
                console.log(`       tx -> Failed because GTM`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);

        });

        it("Should change the budget of the module - fail incorrect address", async() => {
            let errorThrown = false;
            try {
                let tx = await I_SecurityToken.changeModuleBudget(0, (100 * Math.pow(10, 18)),{ from : token_owner});
            } catch(error) {
                console.log(`       tx -> Failed because address is 0`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
         });


          it("Should change the budget of the module", async() => {
             let tx = await I_SecurityToken.changeModuleBudget(I_CappedSTO.address, (100 * Math.pow(10, 18)),{ from : token_owner});
             assert.equal(tx.logs[1].args._moduleTypes[0], stoKey);
             assert.equal(tx.logs[1].args._module, I_CappedSTO.address);
             assert.equal(tx.logs[1].args._budget.dividedBy(new BigNumber(10).pow(18)).toNumber(), 100);
          });

    });

    describe("General Transfer manager Related test cases", async () => {

            it("Should Buy the tokens", async() => {
                balanceOfReceiver = await web3.eth.getBalance(account_fundsReceiver);
                // Add the Investor in to the whitelist

                fromTime = latestTime();
                toTime = fromTime + duration.days(100);
                expiryTime = toTime + duration.days(100);

                let tx = await I_GeneralTransferManager.modifyWhitelist(
                    account_investor1,
                    fromTime,
                    toTime,
                    expiryTime,
                    true,
                    {
                        from: token_owner,
                        gas: 6000000
                    });
                assert.equal(tx.logs[0].args._investor, account_investor1, "Failed in adding the investor in whitelist");
                // Jump time
                await increaseTime(5000);
                // Fallback transaction
                console.log("BEFORE");
                await web3.eth.sendTransaction({
                    from: account_investor1,
                    to: I_CappedSTO.address,
                    gas: 2100000,
                    value: web3.utils.toWei('1', 'ether')
                    });
                console.log("AFTER");
                assert.equal(
                    (await I_CappedSTO.getRaised.call(0))
                    .dividedBy(new BigNumber(10).pow(18))
                    .toNumber(),
                    1
                );

                assert.equal(await I_CappedSTO.investorCount.call(), 1);

                assert.equal(
                    (await I_SecurityToken.balanceOf(account_investor1))
                    .dividedBy(new BigNumber(10).pow(18))
                    .toNumber(),
                    1000
                );
            });

            it("Should Fail in transferring the token from one whitelist investor 1 to non whitelist investor 2", async() => {
                let errorThrown = false;
                try {
                    await I_SecurityToken.transfer(account_investor2, (10 *  Math.pow(10, 18)), { from : account_investor1});
                } catch(error) {
                    console.log(`         tx revert -> Investor 2 is not in the whitelist`.grey);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
            });

            it("Should fail to provide the permission to the delegate to change the transfer bools", async () => {
                let errorThrown = false;
                // Add permission to the deletgate (A regesteration process)
                await I_SecurityToken.addModule(I_GeneralPermissionManagerFactory.address, "", 0, 0, {from: token_owner});
                let moduleData = (await I_SecurityToken.getModulesByType(permissionManagerKey))[0];
                I_GeneralPermissionManager = GeneralPermissionManager.at(moduleData);
                try {
                    await I_GeneralPermissionManager.addPermission(account_delegate, delegateDetails, { from: account_temp });
                } catch (error) {
                    console.log(`${account_temp} doesn't have permissions to register the delegate`);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
            });

            it("Should provide the permission to the delegate to change the transfer bools", async () => {
                // Add permission to the deletgate (A regesteration process)
                await I_GeneralPermissionManager.addPermission(account_delegate, delegateDetails, { from: token_owner});
                // Providing the permission to the delegate
                await I_GeneralPermissionManager.changePermission(account_delegate, I_GeneralTransferManager.address, TM_Perm, true, { from: token_owner });

                assert.isTrue(await I_GeneralPermissionManager.checkPermission(account_delegate, I_GeneralTransferManager.address, TM_Perm));
            });


            it("Should fail to activate the bool allowAllTransfer", async() => {
                let errorThrown = false;
                try {
                    let tx = await I_GeneralTransferManager.changeAllowAllTransfers(true, { from : account_temp });
                } catch (error) {
                    console.log(`${account_temp} doesn't have permissions to activate the bool allowAllTransfer`);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
            });

            it("Should activate the bool allowAllTransfer", async() => {
                ID_snap = await takeSnapshot();
                let tx = await I_GeneralTransferManager.changeAllowAllTransfers(true, { from : account_delegate });

                assert.isTrue(tx.logs[0].args._allowAllTransfers, "AllowTransfer variable is not successfully updated");
            });


            it("Should fail to send tokens with the wrong granularity", async() => {
                let errorThrown = false;
                try {
                  await I_SecurityToken.transfer(accounts[7], Math.pow(10, 17), { from : account_investor1});
                } catch (error) {
                    console.log('         tx revert -> Incorrect token granularity - expected'.grey);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
            });

            it("Should adjust granularity", async() => {
                let errorThrown = false;
                try {
                    await I_SecurityToken.changeGranularity(0, {from: token_owner });
                } catch(error) {
                    console.log('         tx revert -> Incorrect token granularity - expected'.grey);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
            });

            it("Should adjust granularity", async() => {
                let errorThrown = false;
                await I_SecurityToken.changeGranularity(Math.pow(10, 17), {from: token_owner });
                await I_SecurityToken.transfer(accounts[7], Math.pow(10, 17), { from : account_investor1, gas: 2500000 });
                await I_SecurityToken.transfer(account_investor1, Math.pow(10, 17), { from : accounts[7], gas: 2500000});
            });

            it("Should transfer from whitelist investor to non-whitelist investor in first tx and in 2nd tx non-whitelist to non-whitelist transfer", async() => {
                await I_SecurityToken.transfer(accounts[7], (10 *  Math.pow(10, 18)), { from : account_investor1, gas: 2500000});

                assert.equal(
                    (await I_SecurityToken.balanceOf(accounts[7]))
                    .dividedBy(new BigNumber(10).pow(18)).toNumber(),
                    10,
                    "Transfer doesn't take place properly"
                );

                await I_SecurityToken.transfer(account_temp, (5 *  Math.pow(10, 18)), { from : accounts[7], gas: 2500000});

                assert.equal(
                    (await I_SecurityToken.balanceOf(account_temp))
                    .dividedBy(new BigNumber(10).pow(18)).toNumber(),
                    5,
                    "Transfer doesn't take place properly"
                );
                await revertToSnapshot(ID_snap);
            });

            it("Should bool allowAllTransfer value is false", async() => {
                assert.isFalse(await I_GeneralTransferManager.allowAllTransfers.call(), "reverting of snapshot doesn't works properly");
            });

            it("Should change the bool allowAllWhitelistTransfers to true", async () => {
                ID_snap = await takeSnapshot();
                let tx = await I_GeneralTransferManager.changeAllowAllWhitelistTransfers(true, { from : account_delegate });

                assert.isTrue(tx.logs[0].args._allowAllWhitelistTransfers, "allowAllWhitelistTransfers variable is not successfully updated");
            });

            it("Should transfer from whitelist investor1 to whitelist investor 2", async() => {
                let tx = await I_GeneralTransferManager.modifyWhitelist(
                    account_investor2,
                    fromTime,
                    toTime,
                    expiryTime,
                    true,
                    {
                        from: token_owner,
                        gas: 500000
                    });

                assert.equal(tx.logs[0].args._investor, account_investor2, "Failed in adding the investor in whitelist");

                await I_SecurityToken.transfer(account_investor2, (10 *  Math.pow(10, 18)), { from : account_investor1, gas: 2500000});
                assert.equal(
                    (await I_SecurityToken.balanceOf(account_investor2))
                    .dividedBy(new BigNumber(10).pow(18)).toNumber(),
                    10,
                    "Transfer doesn't take place properly"
                );
            });

            it("Should transfer from whitelist investor1 to whitelist investor 2 -- value = 0", async() => {
                let tx = await I_SecurityToken.transfer(account_investor2, 0, { from : account_investor1, gas: 2500000});
                assert.equal((tx.logs[0].args.value).toNumber(),0);
            });

            it("Should transferFrom from one investor to other", async() => {
                await I_SecurityToken.approve(account_investor1, (2 *  Math.pow(10, 18)),{from: account_investor2});
                let tx = await I_GeneralTransferManager.modifyWhitelist(
                    account_investor3,
                    fromTime,
                    toTime,
                    expiryTime,
                    true,
                    {
                        from: token_owner,
                        gas: 500000
                    });

                assert.equal(tx.logs[0].args._investor, account_investor3, "Failed in adding the investor in whitelist");
                let log = await I_SecurityToken.transferFrom(account_investor2, account_investor3, (2 *  Math.pow(10, 18)), {from: account_investor1});
                assert.equal((log.logs[0].args.value).toNumber(), (2 *  Math.pow(10, 18)));
            });

            it("Should Fail in trasferring from whitelist investor1 to non-whitelist investor", async() => {
                let errorThrown = false;
                try {
                    await I_SecurityToken.transfer(account_temp, (10 *  Math.pow(10, 18)), { from : account_investor1, gas: 2500000});
                } catch(error) {
                    console.log(`non-whitelist investor is not allowed`.grey);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
                await revertToSnapshot(ID_snap);
            });

            it("Should successfully mint tokens while STO attached", async () => {
                await I_SecurityToken.mint(account_affiliate1, (100 * Math.pow(10, 18)), {from: token_owner, gas: 500000});
                let balance = await I_SecurityToken.balanceOf(account_affiliate1);
                assert.equal(balance.dividedBy(new BigNumber(10).pow(18)).toNumber(), 400);
            });

            it("Should mint the tokens for multiple afiliated investors while STO attached", async() => {
                await I_SecurityToken.mintMulti([account_affiliate1, account_affiliate2], [(100 * Math.pow(10, 18)), (110 * Math.pow(10, 18))], {from: token_owner, gas: 500000});
                let balance1 = await I_SecurityToken.balanceOf(account_affiliate1);
                assert.equal(balance1.dividedBy(new BigNumber(10).pow(18)).toNumber(), 500);
                let balance2 = await I_SecurityToken.balanceOf(account_affiliate2);
                assert.equal(balance2.dividedBy(new BigNumber(10).pow(18)).toNumber(), 220);
            });

            it("Should provide more permissions to the delegate", async() => {
                // Providing the permission to the delegate
                await I_GeneralPermissionManager.changePermission(account_delegate, I_GeneralTransferManager.address, TM_Perm_Whitelist, true, { from: token_owner });

                assert.isTrue(await I_GeneralPermissionManager.checkPermission(account_delegate, I_GeneralTransferManager.address, TM_Perm_Whitelist));
            });

            it("Should add the investor in the whitelist by the delegate", async() => {
                let tx = await I_GeneralTransferManager.modifyWhitelist(
                    account_temp,
                    fromTime,
                    toTime,
                    expiryTime,
                    true,
                    {
                        from: account_delegate,
                        gas: 6000000
                    });

                assert.equal(tx.logs[0].args._investor, account_temp, "Failed in adding the investor in whitelist");
            });

            it("should account_temp successfully buy the token", async() => {
                // Fallback transaction
                await web3.eth.sendTransaction({
                    from: account_temp,
                    to: I_CappedSTO.address,
                    gas: 2100000,
                    value: web3.utils.toWei('1', 'ether')
                });

                assert.equal(
                    (await I_CappedSTO.getRaised.call(0))
                    .dividedBy(new BigNumber(10).pow(18))
                    .toNumber(),
                    2
                );

                assert.equal(await I_CappedSTO.investorCount.call(), 2);

                assert.equal(
                    (await I_SecurityToken.balanceOf(account_investor1))
                    .dividedBy(new BigNumber(10).pow(18))
                    .toNumber(),
                    1000
                );
            });

            it("STO should fail to mint tokens after minting is frozen", async() => {
                let id = await takeSnapshot();
                await I_SecurityToken.freezeMinting({from: token_owner});
                let errorThrown = false;
                try {
                    await web3.eth.sendTransaction({
                       from: account_temp,
                       to: I_CappedSTO.address,
                       gas: 2100000,
                       value: web3.utils.toWei('1', 'ether')
                    });
                } catch(error) {
                    console.log(`         tx revert -> Minting is finished`.grey);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
                await revertToSnapshot(id);
            });

            it("Should remove investor from the whitelist by the delegate", async() => {
                let tx = await I_GeneralTransferManager.modifyWhitelist(
                    account_temp,
                    0,
                    0,
                    0,
                    true,
                    {
                        from: account_delegate,
                        gas: 6000000
                    });

                assert.equal(tx.logs[0].args._investor, account_temp, "Failed in removing the investor from whitelist");
            });

            it("should account_temp fail in buying the token", async() => {
                let errorThrown = false;
                try {
                    // Fallback transaction
                await web3.eth.sendTransaction({
                    from: account_temp,
                    to: I_CappedSTO.address,
                    gas: 2100000,
                    value: web3.utils.toWei('1', 'ether')
                    });

                } catch (error) {
                    console.log(`non-whitelist investor is not allowed`);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
           });

           it("Should freeze the transfers", async() => {
             let tx = await I_SecurityToken.freezeTransfers({from: token_owner});
             assert.isTrue(tx.logs[0].args._status);
            });

           it("Should fail to freeze the transfers", async() => {
               let errorThrown = false;
               try {
                    await I_SecurityToken.freezeTransfers({from: token_owner});
               } catch(error) {
                    console.log(`       tx -> Revert because freeze is already true`);
                    errorThrown = true;
                    ensureException(error);
            }
            assert.ok(errorThrown, message);
           });

           it("Should fail in buying to tokens", async() => {
            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_temp,
                fromTime,
                toTime,
                expiryTime,
                true,
                {
                    from: account_delegate,
                    gas: 6000000
                });

            assert.equal(tx.logs[0].args._investor, account_temp, "Failed in adding the investor in whitelist");

            let errorThrown = false;
            try {
                    // Fallback transaction
                await web3.eth.sendTransaction({
                    from: account_temp,
                    to: I_CappedSTO.address,
                    gas: 2100000,
                    value: web3.utils.toWei('1', 'ether')
                    });

            } catch (error) {
                    console.log(`Because all transfers get freezed`);
                    errorThrown = true;
                    ensureException(error);
            }
            assert.ok(errorThrown, message);
           });

           it("Should fail in trasfering the tokens from one user to another", async() => {
               await I_GeneralTransferManager.changeAllowAllWhitelistTransfers(true, {from : token_owner});
               console.log(await I_SecurityToken.balanceOf(account_investor1));
               let errorThrown = false;
               try {
                    await I_SecurityToken.transfer(account_investor1, web3.utils.toWei('1', 'ether'), {from: account_temp});
               } catch(error) {
                   console.log('         tx revert -> All transfers are at hold'.grey);
                   errorThrown = true;
                   ensureException(error);
               }
               assert.ok(errorThrown, message);
           });

           it("Should unfreeze all the transfers", async() => {
                let tx = await I_SecurityToken.unfreezeTransfers({from: token_owner});
                assert.isFalse(tx.logs[0].args._status);
           });

           it("Should freeze the transfers", async() => {
                let errorThrown = false;
                try {
                    await I_SecurityToken.unfreezeTransfers({from: token_owner});
                } catch(error) {
                    console.log(`       tx -> Revert because freeze is already false`);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
            });

           it("Should able to transfers the tokens from one user to another", async() => {
                await I_SecurityToken.transfer(account_investor1, web3.utils.toWei('1', 'ether'), {from: account_temp});
           });

           it("Should check that the list of investors is correct", async ()=> {
               // Hardcode list of expected accounts based on transfers above

               let investors = await I_SecurityToken.getInvestors();
               let expectedAccounts = [account_affiliate1, account_affiliate2, account_investor1, account_temp];
               for (let i = 0; i < expectedAccounts.length; i++) {
                   assert.equal(investors[i], expectedAccounts[i]);
               }
               assert.equal(investors.length, 4);
               console.log("Total Seen Investors: " + investors.length);
           });
           it("Should fail to set controller status because msg.sender not owner", async() => {
               let errorThrown = false;
               try {
                   await I_SecurityToken.setController(account_controller, {from: account_controller});
               } catch (error) {
                   console.log(`         tx revert -> msg.sender not owner`.grey);
                   errorThrown = true;
                   ensureException(error);
               }
               assert.ok(errorThrown, message);
           });

           it("Should successfully set controller", async() => {
               let tx1 = await I_SecurityToken.setController(account_controller, {from: token_owner});

               // check event
               assert.equal(address_zero, tx1.logs[0].args._oldController, "Event not emitted as expected");
               assert.equal(account_controller, tx1.logs[0].args._newController, "Event not emitted as expected");

               let tx2 = await I_SecurityToken.setController(address_zero, {from: token_owner});

               // check event
               assert.equal(account_controller, tx2.logs[0].args._oldController, "Event not emitted as expected");
               assert.equal(address_zero, tx2.logs[0].args._newController, "Event not emitted as expected");

               let tx3 = await I_SecurityToken.setController(account_controller, {from: token_owner});

               // check event
               assert.equal(address_zero, tx3.logs[0].args._oldController, "Event not emitted as expected");
               assert.equal(account_controller, tx3.logs[0].args._newController, "Event not emitted as expected");

               // check status
               let controller = await I_SecurityToken.controller.call();
               assert.equal(account_controller, controller, "Status not set correctly");
           });

          it("Should force burn the tokens - value too high", async ()=> {
              let errorThrown = false;
              await I_GeneralTransferManager.changeAllowAllBurnTransfers(true, {from : token_owner});
              let currentInvestorCount = await I_SecurityToken.getInvestorCount.call();
              let currentBalance = await I_SecurityToken.balanceOf(account_temp);
              try {
                  let tx = await I_SecurityToken.forceBurn(account_temp, currentBalance + web3.utils.toWei("500", "ether"), "", "", { from: account_controller });
              } catch(error) {
                  console.log(`         tx revert -> value is greater than its current balance`.grey);
                  errorThrown = true;
                  ensureException(error);
              }
              assert.ok(errorThrown, message);
          });
          it("Should force burn the tokens - wrong caller", async ()=> {
               let errorThrown = false;
               await I_GeneralTransferManager.changeAllowAllBurnTransfers(true, {from : token_owner});
               let currentInvestorCount = await I_SecurityToken.getInvestorCount.call();
               let currentBalance = await I_SecurityToken.balanceOf(account_temp);
               try {
                   let tx = await I_SecurityToken.forceBurn(account_temp, currentBalance, "", "", { from: token_owner });
               } catch(error) {
                   console.log(`         tx revert -> not owner`.grey);
                   errorThrown = true;
                   ensureException(error);
               }
               assert.ok(errorThrown, message);
           });

           it("Should burn the tokens", async ()=> {
                let currentInvestorCount = await I_SecurityToken.getInvestorCount.call();
                let currentBalance = await I_SecurityToken.balanceOf(account_temp);
                // console.log(currentInvestorCount.toString(), currentBalance.toString());
                let tx = await I_SecurityToken.forceBurn(account_temp, currentBalance, "", "", { from: account_controller });
                // console.log(tx.logs[0].args._value.toNumber(), currentBalance.toNumber());
                assert.equal(tx.logs[0].args._value.toNumber(), currentBalance.toNumber());
                let newInvestorCount = await I_SecurityToken.getInvestorCount.call();
                // console.log(newInvestorCount.toString());
                assert.equal(newInvestorCount.toNumber() + 1, currentInvestorCount.toNumber(), "Investor count drops by one");
           });

           it("Should prune investor length", async ()=> {
                await I_SecurityToken.pruneInvestors(0, 10, {from: token_owner});
                // Hardcode list of expected accounts based on transfers above

                let investors = await I_SecurityToken.getInvestors.call();
                let expectedAccounts = [account_affiliate1, account_affiliate2, account_investor1];
                for (let i = 0; i < expectedAccounts.length; i++) {
                    assert.equal(investors[i], expectedAccounts[i]);
                }
                assert.equal(investors.length, 3);
           });

           it("Should check the balance of investor at checkpoint", async() => {
               let errorThrown = false;
               try {
                  await I_SecurityToken.balanceOfAt(account_investor1, 5);
               } catch(error) {
                    console.log(`       tx -> Revert checkpoint ID is greator than current checkpoint`);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
           });

           it("Should check the balance of investor at checkpoint", async() => {
                let balance = await I_SecurityToken.balanceOfAt(account_investor1, 0);
                assert.equal(balance.toNumber(), 0);
            });
        });

        describe("Withdraw Poly", async() => {

            it("Should successfully withdraw the poly", async() => {
                let errorThrown = false;
                try {
                    await I_SecurityToken.withdrawPoly(web3.utils.toWei("20000", "ether"), {from: account_temp});
                } catch (error) {
                    console.log(`         tx revert -> withdrawPoly function can only be called by the owner of the seucrity token`.grey);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
            })

            it("Should successfully withdraw the poly", async() => {
                let balanceBefore = await I_PolyToken.balanceOf(token_owner);
                await I_SecurityToken.withdrawPoly(web3.utils.toWei("20000", "ether"), {from: token_owner});
                let balanceAfter = await I_PolyToken.balanceOf(token_owner);
                assert.equal((BigNumber(balanceAfter).sub(BigNumber(balanceBefore))).toNumber(), web3.utils.toWei("20000", "ether"));
            });

            it("Should successfully withdraw the poly", async() => {
                let errorThrown = false;
                try {
                    await I_SecurityToken.withdrawPoly(web3.utils.toWei("10", "ether"), {from: token_owner});
                } catch (error) {
                    console.log(`         tx revert -> token doesn't have any POLY`.grey);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
            });
        });

        describe("Force Transfer", async() => {

            it("Should fail to forceTransfer because not approved controller", async() => {
                let errorThrown1 = false;
                try {
                    await I_SecurityToken.forceTransfer(account_investor1, account_investor2, web3.utils.toWei("10", "ether"), "", "reason", {from: account_investor1});
                } catch (error) {
                    console.log(`         tx revert -> not approved controller`.grey);
                    errorThrown1 = true;
                    ensureException(error);
                }
                assert.ok(errorThrown1, message);
            });

            it("Should fail to forceTransfer because insufficient balance", async() => {
                let errorThrown = false;
                try {
                    await I_SecurityToken.forceTransfer(account_investor2, account_investor1, web3.utils.toWei("10", "ether"), "", "reason", {from: account_controller});
                } catch (error) {
                    console.log(`         tx revert -> insufficient balance`.grey);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
            });

            it("Should fail to forceTransfer because recipient is zero address", async() => {
                let errorThrown = false;
                try {
                    await I_SecurityToken.forceTransfer(account_investor1, address_zero, web3.utils.toWei("10", "ether"), "", "reason", {from: account_controller});
                } catch (error) {
                    console.log(`         tx revert -> recipient is zero address`.grey);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
            });

            it("Should successfully forceTransfer", async() => {
                let sender = account_investor1;
                let receiver = account_investor2;

                let start_investorCount = await I_SecurityToken.getInvestorCount.call();
                let start_balInv1 = await I_SecurityToken.balanceOf.call(account_investor1);
                let start_balInv2 = await I_SecurityToken.balanceOf.call(account_investor2);

                let tx = await I_SecurityToken.forceTransfer(account_investor1, account_investor2, web3.utils.toWei("10", "ether"), "", "reason", {from: account_controller});

                let end_investorCount = await I_SecurityToken.getInvestorCount.call();
                let end_balInv1 = await I_SecurityToken.balanceOf.call(account_investor1);
                let end_balInv2 = await I_SecurityToken.balanceOf.call(account_investor2);

                assert.equal(start_investorCount.add(1).toNumber(), end_investorCount.toNumber(), "Investor count not changed");
                assert.equal(start_balInv1.sub(web3.utils.toWei("10", "ether")).toNumber(), end_balInv1.toNumber(), "Investor balance not changed");
                assert.equal(start_balInv2.add(web3.utils.toWei("10", "ether")).toNumber(), end_balInv2.toNumber(), "Investor balance not changed");
                console.log(tx.logs[0].args);
                console.log(tx.logs[1].args);
                assert.equal(account_controller, tx.logs[0].args._controller, "Event not emitted as expected");
                assert.equal(account_investor1, tx.logs[0].args._from, "Event not emitted as expected");
                assert.equal(account_investor2, tx.logs[0].args._to, "Event not emitted as expected");
                assert.equal(web3.utils.toWei("10", "ether"), tx.logs[0].args._value, "Event not emitted as expected");
                console.log(tx.logs[0].args._verifyTransfer);
                assert.equal(false, tx.logs[0].args._verifyTransfer, "Event not emitted as expected");
                assert.equal("reason", web3.utils.hexToUtf8(tx.logs[0].args._data), "Event not emitted as expected");

                assert.equal(account_investor1, tx.logs[1].args.from, "Event not emitted as expected");
                assert.equal(account_investor2, tx.logs[1].args.to, "Event not emitted as expected");
                assert.equal(web3.utils.toWei("10", "ether"), tx.logs[1].args.value, "Event not emitted as expected");
            });

            it("Should fail to freeze controller functionality because not owner", async() => {
                let errorThrown = false;
                try {
                    await I_SecurityToken.disableController({from: account_investor1});
                } catch (error) {
                    console.log(`         tx revert -> not owner`.grey);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
            });

            it("Should fail to freeze controller functionality because disableControllerAllowed not activated", async() => {
                let errorThrown = false;
                try {
                    await I_SecurityToken.disableController({from: token_owner});
                } catch (error) {
                    console.log(`         tx revert -> disableControllerAllowed not activated`.grey);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
            });

            it("Should successfully freeze controller functionality", async() => {
                let tx1 = await I_FeatureRegistry.setFeatureStatus("disableControllerAllowed", true, {from: account_polymath});

                // check event
                assert.equal("disableControllerAllowed", tx1.logs[0].args._nameKey, "Event not emitted as expected");
                assert.equal(true, tx1.logs[0].args._newStatus, "Event not emitted as expected");

                let tx2 = await I_SecurityToken.disableController({from: token_owner});

                // check state
                assert.equal(address_zero, await I_SecurityToken.controller.call(), "State not changed");
                assert.equal(true, await I_SecurityToken.controllerDisabled.call(), "State not changed");
            });

            it("Should fail to freeze controller functionality because already frozen", async() => {
                let errorThrown = false;
                try {
                    await I_SecurityToken.disableController({from: token_owner});
                } catch (error) {
                    console.log(`         tx revert -> already frozen`.grey);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
            });

            it("Should fail to set controller because controller functionality frozen", async() => {
                let errorThrown = false;
                try {
                    await I_SecurityToken.setController(account_controller, {from: token_owner});
                } catch (error) {
                    console.log(`         tx revert -> msg.sender not owner`.grey);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
            });

            it("Should fail to forceTransfer because controller functionality frozen", async() => {
                let errorThrown = false;
                try {
                    await I_SecurityToken.forceTransfer(account_investor1, account_investor2, web3.utils.toWei("10", "ether"), "", "reason", {from: account_controller});
                } catch (error) {
                    console.log(`         tx revert -> recipient is zero address`.grey);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, message);
            });

        });

  });
