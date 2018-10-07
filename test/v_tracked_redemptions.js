import latestTime from './helpers/latestTime';
import { duration, ensureException, promisifyLogWatch, latestBlock } from './helpers/utils';
import takeSnapshot, { increaseTime, revertToSnapshot } from './helpers/time';
import { encodeProxyCall } from './helpers/encodeCall';

const PolymathRegistry = artifacts.require('./PolymathRegistry.sol')
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
const TrackedRedemptionFactory = artifacts.require('./TrackedRedemptionFactory.sol');
const TrackedRedemption = artifacts.require('./TrackedRedemption');
const GeneralPermissionManager = artifacts.require('./GeneralPermissionManager');
const PolyTokenFaucet = artifacts.require('./PolyTokenFaucet.sol');

const Web3 = require('web3');
const BigNumber = require('bignumber.js');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")) // Hardcoded development port

contract('TrackedRedemption', accounts => {

    // Accounts Variable declaration
    let account_polymath;
    let account_issuer;
    let token_owner;
    let account_investor1;
    let account_investor2;
    let account_investor3;
    let account_investor4;
    let account_temp;

    // investor Details
    let fromTime = latestTime();
    let toTime = latestTime();
    let expiryTime = toTime + duration.days(15);

    let message = "Transaction Should Fail!";

    // Contract Instance Declaration
    let I_GeneralPermissionManagerFactory;
    let I_SecurityTokenRegistryProxy;
    let I_GeneralTransferManagerFactory;
    let I_TrackedRedemptionFactory;
    let I_GeneralPermissionManager;
    let I_TrackedRedemption;
    let I_GeneralTransferManager;
    let I_ExchangeTransferManager;
    let I_ModuleRegistryProxy;
    let I_ModuleRegistry;
    let I_FeatureRegistry;
    let I_SecurityTokenRegistry;
    let I_STRProxied;
    let I_STFactory;
    let I_SecurityToken;
    let I_PolyToken;
    let I_MRProxied;
    let I_PolymathRegistry;

    // SecurityToken Details
    const name = "Team";
    const symbol = "sap";
    const tokenDetails = "This is equity type of issuance";
    const decimals = 18;
    const contact = "team@polymath.network";
    let snapId;
    // Module key
    const delegateManagerKey = 1;
    const transferManagerKey = 2;
    const stoKey = 3;
    const checkpointKey = 4;
    const burnKey = 5;

    // Initial fee for ticker registry and security token registry
    const initRegFee = web3.utils.toWei("250");
    const STRProxyParameters = ['address', 'address', 'uint256', 'uint256', 'address', 'address'];
    const MRProxyParameters = ['address', 'address'];

    before(async() => {
        // Accounts setup
        account_polymath = accounts[0];
        account_issuer = accounts[1];

        token_owner = account_issuer;

        account_investor1 = accounts[6];
        account_investor2 = accounts[7];
        account_investor3 = accounts[8];
        account_investor4 = accounts[9];
        account_temp = accounts[2];

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

        // STEP 4: Deploy the TrackedRedemption
        I_TrackedRedemptionFactory = await TrackedRedemptionFactory.new(I_PolyToken.address, 0, 0, 0, {from:account_polymath});
        assert.notEqual(
            I_TrackedRedemptionFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "TrackedRedemptionFactory contract was not deployed"
        );


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

         // STEP 5: Register the Modules with the ModuleRegistry contract

         // (A) :  Register the GeneralTransferManagerFactory
         await I_MRProxied.registerModule(I_GeneralTransferManagerFactory.address, { from: account_polymath });
         await I_MRProxied.verifyModule(I_GeneralTransferManagerFactory.address, true, { from: account_polymath });

         // (B) :  Register the GeneralDelegateManagerFactory
         await I_MRProxied.registerModule(I_GeneralPermissionManagerFactory.address, { from: account_polymath });
         await I_MRProxied.verifyModule(I_GeneralPermissionManagerFactory.address, true, { from: account_polymath });

         // (C) : Register the TrackedRedemptionFactory
         await I_MRProxied.registerModule(I_TrackedRedemptionFactory.address, { from: account_polymath });
         await I_MRProxied.verifyModule(I_TrackedRedemptionFactory.address, true, { from: account_polymath });

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
        GeneralPermissionManagerFactory:   ${GeneralPermissionManagerFactory.address}

        TrackedRedemptionFactory:          ${I_TrackedRedemptionFactory.address}
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
            let tx = await I_STRProxied.generateSecurityToken(name, symbol, tokenDetails, false, { from: token_owner });

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

        it("Should successfully attach the TrackedRedemption with the security token", async () => {
            const tx = await I_SecurityToken.addModule(I_TrackedRedemptionFactory.address, "", 0, 0, { from: token_owner });
            assert.equal(tx.logs[2].args._types[0].toNumber(), burnKey, "TrackedRedemption doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name)
                .replace(/\u0000/g, ''),
                "TrackedRedemption",
                "TrackedRedemption module was not added"
            );
            I_TrackedRedemption = TrackedRedemption.at(tx.logs[2].args._module);
        });
    });

    describe("Make Redemptions", async() => {

        it("Buy some tokens for account_investor1 (1 ETH)", async() => {
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_investor1,
                latestTime(),
                latestTime(),
                latestTime() + duration.days(30),
                true,
                {
                    from: account_issuer,
                    gas: 500000
                });

            assert.equal(tx.logs[0].args._investor.toLowerCase(), account_investor1.toLowerCase(), "Failed in adding the investor in whitelist");

            // Jump time
            await increaseTime(5000);

            // Mint some tokens
            await I_SecurityToken.mint(account_investor1, web3.utils.toWei('1', 'ether'), { from: token_owner });

            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor1)).toNumber(),
                web3.utils.toWei('1', 'ether')
            );
        });

        it("Buy some tokens for account_investor2 (2 ETH)", async() => {
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_investor2,
                latestTime(),
                latestTime(),
                latestTime() + duration.days(30),
                true,
                {
                    from: account_issuer,
                    gas: 500000
                });

            assert.equal(tx.logs[0].args._investor.toLowerCase(), account_investor2.toLowerCase(), "Failed in adding the investor in whitelist");

            // Mint some tokens
            await I_SecurityToken.mint(account_investor2, web3.utils.toWei('2', 'ether'), { from: token_owner });

            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor2)).toNumber(),
                web3.utils.toWei('2', 'ether')
            );
        });

        it("Redeem some tokens - fail insufficient allowance", async() => {
            await I_GeneralTransferManager.changeAllowAllBurnTransfers(true, {from : token_owner});

            let errorThrown = false;
            try {
                let tx = await I_TrackedRedemption.redeemTokens(web3.utils.toWei('1', 'ether'), {from: account_investor1});
            } catch(error) {
                console.log(`       tx -> failed insufficent allowance`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        });

        it("Redeem some tokens", async() => {
            await I_SecurityToken.approve(I_TrackedRedemption.address, web3.utils.toWei('1', 'ether'), {from: account_investor1});
            let tx = await I_TrackedRedemption.redeemTokens(web3.utils.toWei('1', 'ether'), {from: account_investor1});
            console.log(JSON.stringify(tx.logs));
            assert.equal(tx.logs[0].args._investor.toLowerCase(), account_investor1.toLowerCase(), "Mismatch address");
            assert.equal(tx.logs[0].args._value, web3.utils.toWei('1', 'ether'), "Wrong value");
        });

        it("Get the init data", async() => {
            let tx = await I_TrackedRedemption.getInitFunction.call();
            assert.equal(web3.utils.toAscii(tx).replace(/\u0000/g, ''),0);
        });

        it("Should get the listed permissions", async() => {
            let tx = await I_TrackedRedemption.getPermissions.call();
            assert.equal(tx.length,0);
        });

        describe("Test cases for the TrackedRedemptionFactory", async() => {
            it("should get the exact details of the factory", async() => {
                assert.equal((await I_TrackedRedemptionFactory.setupCost.call()).toNumber(), 0);
                assert.equal((await I_TrackedRedemptionFactory.getTypes.call())[0], 5);
                assert.equal(web3.utils.toAscii(await I_TrackedRedemptionFactory.getName.call())
                            .replace(/\u0000/g, ''),
                            "TrackedRedemption",
                            "Wrong Module added");
                assert.equal(await I_TrackedRedemptionFactory.getDescription.call(),
                            "Track token redemptions",
                            "Wrong Module added");
                assert.equal(await I_TrackedRedemptionFactory.getTitle.call(),
                            "Tracked Redemption",
                            "Wrong Module added");
                assert.equal(await I_TrackedRedemptionFactory.getInstructions.call(),
                            "Allows an investor to redeem security tokens which are tracked by this module",
                            "Wrong Module added");
                let tags = await I_TrackedRedemptionFactory.getTags.call();
                assert.equal(tags.length, 2);

            });
        });

    });

});
