import latestTime from './helpers/latestTime';
import {signData} from './helpers/signData';
import { pk }  from './helpers/testprivateKey';
import { duration, ensureException, promisifyLogWatch, latestBlock } from './helpers/utils';
import takeSnapshot, { increaseTime, revertToSnapshot } from './helpers/time';
import { encodeProxyCall, encodeModuleCall } from './helpers/encodeCall';

const PolymathRegistry = artifacts.require('./PolymathRegistry.sol')
const DummySTOFactory = artifacts.require('./DummySTOFactory.sol');
const DummySTO = artifacts.require('./DummySTO.sol');
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

contract('GeneralPermissionManager', accounts => {

    // Accounts Variable declaration
    let account_polymath;
    let account_issuer;
    let token_owner;
    let token_owner_pk;
    let account_investor1;
    let account_investor2;
    let account_investor3;
    let account_investor4;
    let account_delegate;
    // investor Details
    let fromTime = latestTime();
    let toTime = latestTime();
    let expiryTime = toTime + duration.days(15);

    let message = "Transaction Should Fail!";

    // Contract Instance Declaration
    let I_GeneralPermissionManagerFactory;
    let P_GeneralPermissionManagerFactory;
    let I_SecurityTokenRegistryProxy;
    let P_GeneralPermissionManager;
    let I_GeneralTransferManagerFactory;
    let I_GeneralPermissionManager;
    let I_GeneralTransferManager;
    let I_ModuleRegistryProxy;
    let I_ModuleRegistry;
    let I_FeatureRegistry;
    let I_SecurityTokenRegistry;
    let I_DummySTOFactory;
    let I_STFactory;
    let I_SecurityToken;
    let I_MRProxied;
    let I_STRProxied;
    let I_DummySTO;
    let I_PolyToken;
    let I_PolymathRegistry;

    // SecurityToken Details
    const name = "Team";
    const symbol = "sap";
    const tokenDetails = "This is equity type of issuance";
    const decimals = 18;
    const contact = "team@polymath.network";
    const delegateDetails = "Hello I am legit delegate";

    // Module key
    const delegateManagerKey = 1;
    const transferManagerKey = 2;
    const stoKey = 3;

    // Initial fee for ticker registry and security token registry
    const initRegFee = web3.utils.toWei("250");

    // Dummy STO details
    const startTime = latestTime() + duration.seconds(5000);           // Start time will be 5000 seconds more than the latest time
    const endTime = startTime + duration.days(80);                     // Add 80 days more
    const cap = web3.utils.toWei('10', 'ether');
    const someString = "A string which is not used";
    const STOParameters = ['uint256', 'uint256', 'uint256', 'string'];
    const STRProxyParameters = ['address', 'address', 'uint256', 'uint256', 'address', 'address'];
    const MRProxyParameters = ['address', 'address'];

    let bytesSTO = encodeModuleCall(STOParameters, [startTime, endTime, cap, someString]);

    before(async() => {
        // Accounts setup
        account_polymath = accounts[0];
        account_issuer = accounts[1];

        token_owner = account_issuer;
        token_owner_pk = pk.account_1;

        account_investor1 = accounts[8];
        account_investor2 = accounts[9];
        account_delegate = accounts[7];


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

        // STEP 4: Deploy the GeneralTransferManagerFactory

        I_GeneralTransferManagerFactory = await GeneralTransferManagerFactory.new(I_PolyToken.address, 0, 0, 0, {from:account_polymath});

        assert.notEqual(
            I_GeneralTransferManagerFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "GeneralTransferManagerFactory contract was not deployed"
        );

        // STEP 5: Deploy the GeneralDelegateManagerFactory

        I_GeneralPermissionManagerFactory = await GeneralPermissionManagerFactory.new(I_PolyToken.address, 0, 0, 0, {from:account_polymath});

        assert.notEqual(
            I_GeneralPermissionManagerFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "GeneralDelegateManagerFactory contract was not deployed"
        );

        // STEP 6: Deploy the GeneralDelegateManagerFactory

        P_GeneralPermissionManagerFactory = await GeneralPermissionManagerFactory.new(I_PolyToken.address, web3.utils.toWei("500","ether"), 0, 0, {from:account_polymath});

        assert.notEqual(
            P_GeneralPermissionManagerFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "GeneralDelegateManagerFactory contract was not deployed"
        );

        // STEP 7: Deploy the DummySTOFactory

        I_DummySTOFactory = await DummySTOFactory.new(I_PolyToken.address, 0, 0, 0, {from:account_polymath});

        assert.notEqual(
            I_DummySTOFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "DummySTOFactory contract was not deployed"
        );


      // Step 8: Deploy the STFactory contract

      I_STFactory = await STFactory.new(I_GeneralTransferManagerFactory.address, {from : account_polymath });

      assert.notEqual(
          I_STFactory.address.valueOf(),
          "0x0000000000000000000000000000000000000000",
          "STFactory contract was not deployed",
      );

      // Step 9: Deploy the SecurityTokenRegistry contract

      I_SecurityTokenRegistry = await SecurityTokenRegistry.new({from: account_polymath });

      assert.notEqual(
          I_SecurityTokenRegistry.address.valueOf(),
          "0x0000000000000000000000000000000000000000",
          "SecurityTokenRegistry contract was not deployed",
      );

      // Step 10: Deploy the proxy and attach the implementation contract to it.
       I_SecurityTokenRegistryProxy = await SecurityTokenRegistryProxy.new({from: account_polymath});
       let bytesProxy = encodeProxyCall(STRProxyParameters, [I_PolymathRegistry.address, I_STFactory.address, initRegFee, initRegFee, I_PolyToken.address, account_polymath]);
       await I_SecurityTokenRegistryProxy.upgradeToAndCall("1.0.0", I_SecurityTokenRegistry.address, bytesProxy, {from: account_polymath});
       I_STRProxied = await SecurityTokenRegistry.at(I_SecurityTokenRegistryProxy.address);

      // Step 11: update the registries addresses from the PolymathRegistry contract
      await I_PolymathRegistry.changeAddress("PolyToken", I_PolyToken.address, {from: account_polymath})
      await I_PolymathRegistry.changeAddress("ModuleRegistry", I_ModuleRegistryProxy.address, {from: account_polymath});
      await I_PolymathRegistry.changeAddress("FeatureRegistry", I_FeatureRegistry.address, {from: account_polymath});
      await I_PolymathRegistry.changeAddress("SecurityTokenRegistry", I_SecurityTokenRegistryProxy.address, {from: account_polymath});
      await I_MRProxied.updateFromRegistry({from: account_polymath});

      // STEP 8: Register the Modules with the ModuleRegistry contract

      // (A) :  Register the GeneralTransferManagerFactory
      await I_MRProxied.registerModule(I_GeneralTransferManagerFactory.address, { from: account_polymath });
      await I_MRProxied.verifyModule(I_GeneralTransferManagerFactory.address, true, { from: account_polymath });

      // (B) :  Register the GeneralDelegateManagerFactory
      await I_MRProxied.registerModule(I_GeneralPermissionManagerFactory.address, { from: account_polymath });
      await I_MRProxied.verifyModule(I_GeneralPermissionManagerFactory.address, true, { from: account_polymath });

      // (B) :  Register the Paid GeneralDelegateManagerFactory
      await I_MRProxied.registerModule(P_GeneralPermissionManagerFactory.address, { from: account_polymath });
      await I_MRProxied.verifyModule(P_GeneralPermissionManagerFactory.address, true, { from: account_polymath });

      // (C) : Register the STOFactory
      await I_MRProxied.registerModule(I_DummySTOFactory.address, { from: account_polymath });
      await I_MRProxied.verifyModule(I_DummySTOFactory.address, true, { from: account_polymath });

        // Printing all the contract addresses
        console.log(`
        --------------------- Polymath Network Smart Contracts: ---------------------
        PolymathRegistry:                  ${PolymathRegistry.address}
        SecurityTokenRegistryProxy:        ${SecurityTokenRegistryProxy.address}
        SecurityTokenRegistry:             ${SecurityTokenRegistry.address}
        ModuleRegistryProxy                ${ModuleRegistryProxy.address}
        ModuleRegistry:                    ${ModuleRegistry.address}
        FeatureRegistry:                   ${FeatureRegistry.address}

        STFactory:                         ${STFactory.address}
        GeneralTransferManagerFactory:     ${GeneralTransferManagerFactory.address}
        GeneralPermissionManagerFactory:   ${GeneralPermissionManagerFactory.address}

        DummySTOFactory:                   ${I_DummySTOFactory.address}
        -----------------------------------------------------------------------------
        `);
    });

    describe("Generate the SecurityToken", async() => {

        it("Should register the ticker before the generation of the security token", async () => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner });
            let tx = await I_STRProxied.registerTicker(token_owner, symbol, contact, { from : token_owner });
            assert.equal(tx.logs[0].args._owner, token_owner);
            assert.equal(tx.logs[0].args._ticker, symbol.toUpperCase());
        });

        it("Should generate the new security token with the same symbol as registered above", async () => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner });
            let _blockNo = latestBlock();
            let tx = await I_STRProxied.generateSecurityToken(name, symbol, tokenDetails, false, { from: token_owner});

            // Verify the successful generation of the security token
            assert.equal(tx.logs[1].args._ticker, symbol.toUpperCase(), "SecurityToken doesn't get deployed");

            I_SecurityToken = SecurityToken.at(tx.logs[1].args._securityTokenAddress);

            const log = await promisifyLogWatch(I_SecurityToken.ModuleAdded({from: _blockNo}), 1);

            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._types[0].toNumber(), 2);
            assert.equal(
                web3.utils.toAscii(log.args._name)
                .replace(/\u0000/g, ''),
                "GeneralTransferManager"
            );
        });

        it("Should intialize the auto attached modules", async () => {
           let moduleData = (await I_SecurityToken.getModulesByType(2))[0];
           I_GeneralTransferManager = GeneralTransferManager.at(moduleData);
        });

        it("Should successfully attach the General permission manager factory with the security token", async () => {
            let errorThrown = false;
            await I_PolyToken.getTokens(web3.utils.toWei("500", "ether"), token_owner);
            try {
                const tx = await I_SecurityToken.addModule(P_GeneralPermissionManagerFactory.address, "0x", web3.utils.toWei("500", "ether"), 0, { from: token_owner });
            } catch(error) {
                console.log(`       tx -> failed because Token is not paid`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        });

        it("Should successfully attach the General permission manager factory with the security token", async () => {
            let snapId = await takeSnapshot();
            await I_PolyToken.transfer(I_SecurityToken.address, web3.utils.toWei("500", "ether"), {from: token_owner});
            const tx = await I_SecurityToken.addModule(P_GeneralPermissionManagerFactory.address, "0x", web3.utils.toWei("500", "ether"), 0, { from: token_owner });
            assert.equal(tx.logs[3].args._types[0].toNumber(), delegateManagerKey, "General Permission Manager doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[3].args._name)
                .replace(/\u0000/g, ''),
                "GeneralPermissionManager",
                "GeneralPermissionManagerFactory module was not added"
            );
            P_GeneralPermissionManager = GeneralPermissionManager.at(tx.logs[3].args._module);
            await revertToSnapshot(snapId);
        });

        it("Should successfully attach the General permission manager factory with the security token", async () => {
            const tx = await I_SecurityToken.addModule(I_GeneralPermissionManagerFactory.address, "0x", 0, 0, { from: token_owner });
            assert.equal(tx.logs[2].args._types[0].toNumber(), delegateManagerKey, "General Permission Manager doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name)
                .replace(/\u0000/g, ''),
                "GeneralPermissionManager",
                "GeneralPermissionManagerFactory module was not added"
            );
            I_GeneralPermissionManager = GeneralPermissionManager.at(tx.logs[2].args._module);
        });
    });

    describe("General Permission Manager test cases", async() => {

        it("Get the init data", async() => {
            let tx = await I_GeneralPermissionManager.getInitFunction.call();
            assert.equal(web3.utils.toAscii(tx).replace(/\u0000/g, ''),0);
        });

        it("Should fail in adding the permission to the delegate --msg.sender doesn't have permission", async() => {
            let errorThrown = false;
            try {
                let tx = await I_GeneralPermissionManager.addPermission(account_delegate, delegateDetails, { from: account_investor1});
            } catch(error) {
                console.log(`         tx revert -> msg.sender doesn't have permission`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should fail to provide the permission-- because delegate is not yet added", async() => {
            let errorThrown = false;
            try {
                let tx = await I_GeneralPermissionManager.changePermission(account_delegate, I_GeneralTransferManager.address, "WHITELIST", true, {from: token_owner});
            } catch(error) {
                console.log(`         tx revert -> Delegate is not yet added`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should add the permission to the delegate", async() => {
            let tx = await I_GeneralPermissionManager.addPermission(account_delegate, delegateDetails, { from: token_owner});
            assert.equal(tx.logs[0].args._delegate, account_delegate);
        });

        it("Should fail to provide the permission", async() => {
            let errorThrown = false;
            try {
                let tx = await I_GeneralPermissionManager.changePermission(account_delegate, I_GeneralTransferManager.address, "WHITELIST", true, {from: account_investor1});
            } catch(error) {
                console.log(`         tx revert -> msg.sender doesn't have permission`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, message);
        });

        it("Should check the permission", async() => {
            assert.isFalse(await I_GeneralPermissionManager.checkPermission.call(account_delegate, I_GeneralTransferManager.address, "WHITELIST"));
        });

        it("Should provide the permission", async() => {
            let tx = await I_GeneralPermissionManager.changePermission(account_delegate, I_GeneralTransferManager.address, "WHITELIST", true, {from: token_owner});
            assert.equal(tx.logs[0].args._delegate, account_delegate);
        });

        it("Should check the permission", async() => {
            assert.isTrue(await I_GeneralPermissionManager.checkPermission.call(account_delegate, I_GeneralTransferManager.address, "WHITELIST"));
        });

        it("Should check the delegate details", async() => {
            assert.equal(web3.utils.toAscii(await I_GeneralPermissionManager.getDelegateDetails.call(account_delegate))
                        .replace(/\u0000/g, ''),
                        delegateDetails,
                        "Wrong delegate address get checked");
        });

        it("Should get the permission of the general permission manager contract", async() => {
            let tx = await I_GeneralPermissionManager.getPermissions.call();
            assert.equal(web3.utils.toAscii(tx[0])
                        .replace(/\u0000/g, ''),
                        "CHANGE_PERMISSION",
                        "Wrong permissions");
        });
    });

    describe("General Permission Manager Factory test cases", async() => {
        it("should get the exact details of the factory", async() => {
            assert.equal(await I_GeneralPermissionManagerFactory.setupCost.call(),0);
            assert.equal((await I_GeneralPermissionManagerFactory.getTypes.call())[0],1);
            assert.equal(web3.utils.toAscii(await I_GeneralPermissionManagerFactory.getName.call())
                        .replace(/\u0000/g, ''),
                        "GeneralPermissionManager",
                        "Wrong Module added");
            assert.equal(await I_GeneralPermissionManagerFactory.getDescription.call(),
                        "Manage permissions within the Security Token and attached modules",
                        "Wrong Module added");
            assert.equal(await I_GeneralPermissionManagerFactory.getTitle.call(),
                        "General Permission Manager",
                        "Wrong Module added");
            assert.equal(await I_GeneralPermissionManagerFactory.getInstructions.call(),
                        "Add and remove permissions for the SecurityToken and associated modules. Permission types should be encoded as bytes32 values, and attached using the withPerm modifier to relevant functions.No initFunction required.",
                        "Wrong Module added");

        });

        it("Should get the tags of the factory", async() => {
            let tags = await I_GeneralPermissionManagerFactory.getTags.call();
            assert.equal(tags.length,0);
        });
    });

});
