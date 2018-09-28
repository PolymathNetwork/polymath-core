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
const VolumeRestrictionTransferManagerFactory = artifacts.require('./VolumeRestrictionTransferManagerFactory.sol');
const VolumeRestrictionTransferManager = artifacts.require('./VolumeRestrictionTransferManager');
const GeneralPermissionManager = artifacts.require('./GeneralPermissionManager');
const PolyTokenFaucet = artifacts.require('./PolyTokenFaucet.sol');

const Web3 = require('web3');
const BigNumber = require('bignumber.js');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")) // Hardcoded development port

contract('VolumeRestrictionTransferManager', accounts => {

    // Accounts Variable declaration
    let account_polymath;
    let account_issuer;
    let token_owner;
    let account_investor1;
    let account_investor2;
    let account_investor3;
    let account_investor4;

    // investor Details
    let fromTime = latestTime();
    let toTime = latestTime();
    let expiryTime = toTime + duration.days(15);

    let message = "Transaction Should Fail!";

    // Contract Instance Declaration
    let I_GeneralPermissionManagerFactory;
    let P_VolumeRestrictionTransferManagerFactory;
    let I_SecurityTokenRegistryProxy;
    let P_VolumeRestrictionTransferManager;
    let I_GeneralTransferManagerFactory;
    let I_VolumeRestrictionTransferManagerFactory;
    let I_GeneralPermissionManager;
    let I_VolumeRestrictionTransferManager;
    let I_GeneralTransferManager;
    let I_ModuleRegistryProxy;
    let I_ModuleRegistry;
    let I_FeatureRegistry;
    let I_SecurityTokenRegistry;
    let I_STRProxied;
    let I_MRProxied;
    let I_STFactory;
    let I_SecurityToken;
    let I_PolyToken;
    let I_PolymathRegistry;

    // SecurityToken Details
    const name = "Team";
    const symbol = "sap";
    const tokenDetails = "This is equity type of issuance";
    const decimals = 18;
    const contact = "team@polymath.network";

    // Module key
    const delegateManagerKey = 1;
    const transferManagerKey = 2;
    const stoKey = 3;

    // Initial fee for ticker registry and security token registry
    const initRegFee = web3.utils.toWei("250");

    const STRProxyParameters = ['address', 'address', 'uint256', 'uint256', 'address', 'address'];
    const MRProxyParameters = ['address', 'address'];

    before(async() => {
        // Accounts setup
        account_polymath = accounts[0];
        account_issuer = accounts[1];

        token_owner = account_issuer;

        account_investor1 = accounts[7];
        account_investor2 = accounts[8];
        account_investor3 = accounts[9];

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
       
        // STEP 4(a): Deploy the GeneralTransferManagerFactory

        I_GeneralTransferManagerFactory = await GeneralTransferManagerFactory.new(I_PolyToken.address, 0, 0, 0, {from:account_polymath});

        assert.notEqual(
            I_GeneralTransferManagerFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "GeneralTransferManagerFactory contract was not deployed"
        );

        // STEP 4(b): Deploy the GeneralDelegateManagerFactory

        I_GeneralPermissionManagerFactory = await GeneralPermissionManagerFactory.new(I_PolyToken.address, 0, 0, 0, {from:account_polymath});

        assert.notEqual(
            I_GeneralPermissionManagerFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "GeneralDelegateManagerFactory contract was not deployed"
        );

        // STEP 4(c): Deploy the VolumeRestrictionTransferManager
        I_VolumeRestrictionTransferManagerFactory = await VolumeRestrictionTransferManagerFactory.new(I_PolyToken.address, 0, 0, 0, {from:account_polymath});
        assert.notEqual(
            I_VolumeRestrictionTransferManagerFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "VolumeRestrictionTransferManagerFactory contract was not deployed"
        );

        // STEP 4(d): Deploy the VolumeRestrictionTransferManager
        P_VolumeRestrictionTransferManagerFactory = await VolumeRestrictionTransferManagerFactory.new(I_PolyToken.address, web3.utils.toWei("500", "ether"), 0, 0, {from:account_polymath});
        assert.notEqual(
            P_VolumeRestrictionTransferManagerFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "VolumeRestrictionTransferManagerFactory contract was not deployed"
        );


        // STEP 5: Register the Modules with the ModuleRegistry contract

        // (A) :  Register the GeneralTransferManagerFactory
        await I_MRProxied.registerModule(I_GeneralTransferManagerFactory.address, { from: account_polymath });
        await I_MRProxied.verifyModule(I_GeneralTransferManagerFactory.address, true, { from: account_polymath });

        // (B) :  Register the GeneralDelegateManagerFactory
        await I_MRProxied.registerModule(I_GeneralPermissionManagerFactory.address, { from: account_polymath });
        await I_MRProxied.verifyModule(I_GeneralPermissionManagerFactory.address, true, { from: account_polymath });

        // (C) : Register the VolumeRestrictionTransferManagerFactory
        await I_MRProxied.registerModule(I_VolumeRestrictionTransferManagerFactory.address, { from: account_polymath });
        await I_MRProxied.verifyModule(I_VolumeRestrictionTransferManagerFactory.address, true, { from: account_polymath });

        // (C) : Register the Paid VolumeRestrictionTransferManagerFactory
        await I_MRProxied.registerModule(P_VolumeRestrictionTransferManagerFactory.address, { from: account_polymath });
        await I_MRProxied.verifyModule(P_VolumeRestrictionTransferManagerFactory.address, true, { from: account_polymath });

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

        VolumeRestrictionTransferManagerFactory:  ${I_VolumeRestrictionTransferManagerFactory.address}
        -----------------------------------------------------------------------------
        `);
    });

    // before(async() => {
    //     // Accounts setup
    //     account_polymath = accounts[0];
    //     account_issuer = accounts[1];

    //     token_owner = account_issuer;

    //     account_investor1 = accounts[7];
    //     account_investor2 = accounts[8];
    //     account_investor3 = accounts[9];

    //     // ----------- POLYMATH NETWORK Configuration ------------

    //     // Step 0: Deploy the PolymathRegistry
    //     I_PolymathRegistry = await PolymathRegistry.new({from: account_polymath});

    //     // Step 1: Deploy the token Faucet and Mint tokens for token_owner
    //     I_PolyToken = await PolyTokenFaucet.new();
    //     await I_PolyToken.getTokens((10000 * Math.pow(10, 18)), token_owner);
    //     await I_PolymathRegistry.changeAddress("PolyToken", I_PolyToken.address, {from: account_polymath})

    //     // STEP 2: Deploy the ModuleRegistry

    //     I_ModuleRegistry = await ModuleRegistry.new(I_PolymathRegistry.address, {from:account_polymath});
    //     await I_PolymathRegistry.changeAddress("ModuleRegistry", I_ModuleRegistry.address, {from: account_polymath});

    //     assert.notEqual(
    //         I_ModuleRegistry.address.valueOf(),
    //         "0x0000000000000000000000000000000000000000",
    //         "ModuleRegistry contract was not deployed"
    //     );

    //     // STEP 2: Deploy the GeneralTransferManagerFactory

    //     I_GeneralTransferManagerFactory = await GeneralTransferManagerFactory.new(I_PolyToken.address, 0, 0, 0, {from:account_polymath});

    //     assert.notEqual(
    //         I_GeneralTransferManagerFactory.address.valueOf(),
    //         "0x0000000000000000000000000000000000000000",
    //         "GeneralTransferManagerFactory contract was not deployed"
    //     );

    //     // STEP 3: Deploy the GeneralDelegateManagerFactory

    //     I_GeneralPermissionManagerFactory = await GeneralPermissionManagerFactory.new(I_PolyToken.address, 0, 0, 0, {from:account_polymath});

    //     assert.notEqual(
    //         I_GeneralPermissionManagerFactory.address.valueOf(),
    //         "0x0000000000000000000000000000000000000000",
    //         "GeneralDelegateManagerFactory contract was not deployed"
    //     );


    //     // STEP 4: Deploy the VolumeRestrictionTransferManager
    //     I_VolumeRestrictionTransferManagerFactory = await VolumeRestrictionTransferManagerFactory.new(I_PolyToken.address, 0, 0, 0, {from:account_polymath});
    //     assert.notEqual(
    //         I_VolumeRestrictionTransferManagerFactory.address.valueOf(),
    //         "0x0000000000000000000000000000000000000000",
    //         "VolumeRestrictionTransferManagerFactory contract was not deployed"
    //     );

    //     // STEP 4: Deploy the VolumeRestrictionTransferManager
    //     P_VolumeRestrictionTransferManagerFactory = await VolumeRestrictionTransferManagerFactory.new(I_PolyToken.address, web3.utils.toWei("500", "ether"), 0, 0, {from:account_polymath});
    //     assert.notEqual(
    //         P_VolumeRestrictionTransferManagerFactory.address.valueOf(),
    //         "0x0000000000000000000000000000000000000000",
    //         "VolumeRestrictionTransferManagerFactory contract was not deployed"
    //     );


    //     // STEP 5: Register the Modules with the ModuleRegistry contract

    //     // (A) :  Register the GeneralTransferManagerFactory
    //     await I_ModuleRegistry.registerModule(I_GeneralTransferManagerFactory.address, { from: account_polymath });
    //     await I_ModuleRegistry.verifyModule(I_GeneralTransferManagerFactory.address, true, { from: account_polymath });

    //     // (B) :  Register the GeneralDelegateManagerFactory
    //     await I_ModuleRegistry.registerModule(I_GeneralPermissionManagerFactory.address, { from: account_polymath });
    //     await I_ModuleRegistry.verifyModule(I_GeneralPermissionManagerFactory.address, true, { from: account_polymath });

    //     // (C) : Register the VolumeRestrictionTransferManagerFactory
    //     await I_ModuleRegistry.registerModule(I_VolumeRestrictionTransferManagerFactory.address, { from: account_polymath });
    //     await I_ModuleRegistry.verifyModule(I_VolumeRestrictionTransferManagerFactory.address, true, { from: account_polymath });

    //     // (C) : Register the Paid VolumeRestrictionTransferManagerFactory
    //     await I_ModuleRegistry.registerModule(P_VolumeRestrictionTransferManagerFactory.address, { from: account_polymath });
    //     await I_ModuleRegistry.verifyModule(P_VolumeRestrictionTransferManagerFactory.address, true, { from: account_polymath });

    //     // Step 7: Deploy the STFactory contract

    //     I_STFactory = await STFactory.new(I_GeneralTransferManagerFactory.address);

    //     assert.notEqual(
    //         I_STFactory.address.valueOf(),
    //         "0x0000000000000000000000000000000000000000",
    //         "STFactory contract was not deployed",
    //     );

    //    // Step 9: Deploy the SecurityTokenRegistry

    //    I_SecurityTokenRegistry = await SecurityTokenRegistry.new({from: account_polymath });

    //    assert.notEqual(
    //        I_SecurityTokenRegistry.address.valueOf(),
    //        "0x0000000000000000000000000000000000000000",
    //        "SecurityTokenRegistry contract was not deployed",
    //    );

    //    // Step 10: update the registries addresses from the PolymathRegistry contract
    //    I_SecurityTokenRegistryProxy = await SecurityTokenRegistryProxy.new({from: account_polymath});
    //    let bytesProxy = encodeProxyCall([I_PolymathRegistry.address, I_STFactory.address, initRegFee, initRegFee, I_PolyToken.address, account_polymath]);
    //    await I_SecurityTokenRegistryProxy.upgradeToAndCall("1.0.0", I_SecurityTokenRegistry.address, bytesProxy, {from: account_polymath});
    //    I_STRProxied = await SecurityTokenRegistry.at(I_SecurityTokenRegistryProxy.address);

    //     // Step 10: Deploy the FeatureRegistry

    //     I_FeatureRegistry = await FeatureRegistry.new(
    //         I_PolymathRegistry.address,
    //         {
    //             from: account_polymath
    //         });
    //     await I_PolymathRegistry.changeAddress("FeatureRegistry", I_FeatureRegistry.address, {from: account_polymath});

    //     assert.notEqual(
    //         I_FeatureRegistry.address.valueOf(),
    //         "0x0000000000000000000000000000000000000000",
    //         "FeatureRegistry contract was not deployed",
    //     );

    //     // Step 11: update the registries addresses from the PolymathRegistry contract
    //     await I_PolymathRegistry.changeAddress("SecurityTokenRegistry", I_STRProxied.address, {from: account_polymath});
    //     await I_ModuleRegistry.updateFromRegistry({from: account_polymath});

    //     // Printing all the contract addresses
    //     console.log(`
    //     --------------------- Polymath Network Smart Contracts: ---------------------
    //     PolymathRegistry:                  ${PolymathRegistry.address}
    //     SecurityTokenRegistryProxy:        ${SecurityTokenRegistryProxy.address}
    //     SecurityTokenRegistry:             ${SecurityTokenRegistry.address}
    //     ModuleRegistry:                    ${ModuleRegistry.address}
    //     FeatureRegistry:                   ${FeatureRegistry.address}

    //     STFactory:                         ${STFactory.address}
    //     GeneralTransferManagerFactory:     ${GeneralTransferManagerFactory.address}
    //     GeneralPermissionManagerFactory:   ${GeneralPermissionManagerFactory.address}

    //     VolumeRestrictionTransferManagerFactory:  ${I_VolumeRestrictionTransferManagerFactory.address}
    //     -----------------------------------------------------------------------------
    //     `);
    // });

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
            let tx = await I_STRProxied.generateSecurityToken(name, symbol, tokenDetails, false, { from: token_owner, gas: 60000000 });

            // Verify the successful generation of the security token
            assert.equal(tx.logs[1].args._ticker, symbol.toUpperCase(), "SecurityToken doesn't get deployed");

            I_SecurityToken = SecurityToken.at(tx.logs[1].args._securityTokenAddress);

            const log = await promisifyLogWatch(I_SecurityToken.ModuleAdded({from: _blockNo}), 1);

            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._type.toNumber(), 2);
            assert.equal(
                web3.utils.toAscii(log.args._name)
                .replace(/\u0000/g, ''),
                "GeneralTransferManager"
            );
        });

        it("Should intialize the auto attached modules", async () => {
           let moduleData = await I_SecurityToken.modules(2, 0);
           I_GeneralTransferManager = GeneralTransferManager.at(moduleData);

        });

    });

    describe("Buy tokens using on-chain whitelist and test locking them up and attempting to transfer", async() => {

        it("Should Buy the tokens", async() => {
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_investor1,
                latestTime(),
                latestTime(),
                latestTime() + duration.days(10),
                true,
                {
                    from: account_issuer,
                    gas: 6000000
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

        it("Should Buy some more tokens", async() => {
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_investor2,
                latestTime(),
                latestTime(),
                latestTime() + duration.days(10),
                true,
                {
                    from: account_issuer,
                    gas: 6000000
                });

            assert.equal(tx.logs[0].args._investor.toLowerCase(), account_investor2.toLowerCase(), "Failed in adding the investor in whitelist");

            // Mint some tokens
            await I_SecurityToken.mint(account_investor2, web3.utils.toWei('10', 'ether'), { from: token_owner });

            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor2)).toNumber(),
                web3.utils.toWei('10', 'ether')
            );
        });

        it("Should unsuccessfully attach the VolumeRestrictionTransferManager factory with the security token", async () => {
            let errorThrown = false;
            await I_PolyToken.getTokens(web3.utils.toWei("500", "ether"), token_owner);
            try {
                const tx = await I_SecurityToken.addModule(P_VolumeRestrictionTransferManagerFactory.address, 0, web3.utils.toWei("500", "ether"), 0, { from: token_owner });
            } catch(error) {
                console.log(`       tx -> failed because Token is not paid`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        });

        it("Should successfully attach the VolumeRestrictionTransferManager factory with the security token", async () => {
            let snapId = await takeSnapshot();
            await I_PolyToken.transfer(I_SecurityToken.address, web3.utils.toWei("500", "ether"), {from: token_owner});
            const tx = await I_SecurityToken.addModule(P_VolumeRestrictionTransferManagerFactory.address, 0, web3.utils.toWei("500", "ether"), 0, { from: token_owner });
            assert.equal(tx.logs[3].args._type.toNumber(), transferManagerKey, "VolumeRestrictionTransferManagerFactory doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[3].args._name)
                .replace(/\u0000/g, ''),
                "VolumeRestrictionTransferManager",
                "VolumeRestrictionTransferManagerFactory module was not added"
            );
            P_VolumeRestrictionTransferManager = VolumeRestrictionTransferManager.at(tx.logs[3].args._module);
            await revertToSnapshot(snapId);
        });

        it("Should successfully attach the VolumeRestrictionTransferManager with the security token", async () => {
            const tx = await I_SecurityToken.addModule(I_VolumeRestrictionTransferManagerFactory.address, 0, 0, 0, { from: token_owner });
            assert.equal(tx.logs[2].args._type.toNumber(), transferManagerKey, "VolumeRestrictionTransferManager doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name)
                .replace(/\u0000/g, ''),
                "VolumeRestrictionTransferManager",
                "VolumeRestrictionTransferManager module was not added"
            );
            I_VolumeRestrictionTransferManager = VolumeRestrictionTransferManager.at(tx.logs[2].args._module);
        });

        it("Add a new token holder", async() => {

            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_investor3,
                latestTime(),
                latestTime(),
                latestTime() + duration.days(10),
                true,
                {
                    from: account_issuer,
                    gas: 6000000
                });

            assert.equal(tx.logs[0].args._investor.toLowerCase(), account_investor3.toLowerCase(), "Failed in adding the investor in whitelist");

            // Add the Investor in to the whitelist
            // Mint some tokens
            await I_SecurityToken.mint(account_investor3, web3.utils.toWei('10', 'ether'), { from: token_owner });

            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor3)).toNumber(),
                web3.utils.toWei('10', 'ether')
            );
        });

        it("Should pause the tranfers at transferManager level", async() => {
            let tx = await I_VolumeRestrictionTransferManager.pause({from: token_owner});
        });

        it("Should still be able to transfer between existing token holders up to limit", async() => {
            // Add the Investor in to the whitelist
            // Mint some tokens
            await I_SecurityToken.transfer(account_investor1, web3.utils.toWei('1', 'ether'), { from: account_investor2 });

            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor1)).toNumber(),
                web3.utils.toWei('2', 'ether')
            );
        });

        it("Should unpause the tranfers at transferManager level", async() => {
            await I_VolumeRestrictionTransferManager.unpause({from: token_owner});
        })

        // it("Should not be able to transfer between existing token holders over limit", async() => {
        //     let errorThrown = false;
        //     try {
        //         await I_SecurityToken.transfer(account_investor3, web3.utils.toWei('2', 'ether'), { from: account_investor1 });
        //     } catch(error) {
        //         console.log(`         tx revert -> Too many holders`.grey);
        //         ensureException(error);
        //         errorThrown = true;
        //     }
        //     assert.ok(errorThrown, message);
        // });

        it("Should prevent the transfer of tokens in a lockup", async() => {

            let balance = await I_SecurityToken.balanceOf(account_investor2)
            // console.log('balance is ',balance.toString())

            // create a lockup for their entire balance
            // over 16 seconds total, with 4 periods of 4 seconds each.
            await I_VolumeRestrictionTransferManager.addLockUp(account_investor2, 16, 4, 0, balance, { from: token_owner });
            

            let errorThrown = false;
            try {
                await I_SecurityToken.transfer(account_investor1, web3.utils.toWei('1', 'ether'), { from: account_investor2 });
            } catch(error) {
                console.log(`         tx revert -> couldn't transfer because of lock up`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        });

        it("Should allow the transfer of tokens in a lockup if a period has passed", async() => {

            // wait 4 seconds
            await new Promise(resolve => setTimeout(resolve, 4000));

            await I_SecurityToken.transfer(account_investor1, web3.utils.toWei('2', 'ether'), { from: account_investor2 });
        });

        it("Should prevent the transfer of tokens if the amount is larger than the amount allowed by lockups", async() => {

            let balance = await I_SecurityToken.balanceOf(account_investor2)
            // console.log('balance is ',balance.toString())

            let errorThrown = false;
            try {
                await I_SecurityToken.transfer(account_investor1, web3.utils.toWei('3', 'ether'), { from: account_investor2 });
            } catch(error) {
                console.log(`         tx revert -> couldn't transfer because of lock up`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        });

        it("Should allow the transfer of more tokens in a lockup if another period has passed", async() => {

            // wait 4 more seconds
            await new Promise(resolve => setTimeout(resolve, 4000));

            await I_SecurityToken.transfer(account_investor1, web3.utils.toWei('2', 'ether'), { from: account_investor2 });
        });

        it("Should allow the transfer of all tokens in a lockup if the entire lockup has passed", async() => {

            let balance = await I_SecurityToken.balanceOf(account_investor2)
            // console.log('balance is ',balance.toString())

            // wait 12 more seconds
            await new Promise(resolve => setTimeout(resolve, 12000));

            await I_SecurityToken.transfer(account_investor1, balance, { from: account_investor2 });
        });

        it("Should prevent the transfer of tokens in an edited lockup", async() => {

            let balance = await I_SecurityToken.balanceOf(account_investor1)
            // console.log('balance is ',balance.toString())

            // create a lockup for their entire balance
            // over 16 seconds total, with 4 periods of 4 seconds each.
            await I_VolumeRestrictionTransferManager.addLockUp(account_investor1, 16, 4, 0, balance, { from: token_owner });

            // let blockNumber = await web3.eth.getBlockNumber();
            // console.log('blockNumber',blockNumber)
            let now = (await web3.eth.getBlock('latest')).timestamp            

            let errorThrown = false;
            try {
                await I_SecurityToken.transfer(account_investor2, web3.utils.toWei('1', 'ether'), { from: account_investor1 });
            } catch(error) {
                console.log(`         tx revert -> couldn't transfer because of lock up`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);

            // check and get the lockup
            let lockUpCount = await I_VolumeRestrictionTransferManager.getLockUpsLength(account_investor1);
            assert.equal(lockUpCount, 1)

            let lockUp = await I_VolumeRestrictionTransferManager.getLockUp(account_investor1, 0);
            // console.log(lockUp);
            // elements in lockup array are uint lockUpPeriodSeconds, uint releaseFrequencySeconds, uint startTime, uint totalAmount
            assert.equal(lockUp[0].toString(), '16');
            assert.equal(lockUp[1].toString(), '4');
            assert.equal(lockUp[2].toNumber(), now);
            assert.equal(lockUp[3].toString(), balance.toString());

            // edit the lockup
            await I_VolumeRestrictionTransferManager.editLockUp(account_investor1, 0, 8, 4, 0, balance, { from: token_owner });

            // attempt a transfer
            errorThrown = false;
            try {
                await I_SecurityToken.transfer(account_investor2, web3.utils.toWei('5', 'ether'), { from: account_investor1 });
            } catch(error) {
                console.log(`         tx revert -> couldn't transfer because of lock up`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);


            // wait 4 seconds
            await new Promise(resolve => setTimeout(resolve, 4000));

            // transfer should succeed
            await I_SecurityToken.transfer(account_investor2, web3.utils.toWei('5', 'ether'), { from: account_investor1 });

        });

        it("Should be possible to remove a lockup", async() => {

            let acct1Balance = await I_SecurityToken.balanceOf(account_investor1)
            // console.log('acct1Balance is ',acct1Balance.toString())

            let errorThrown = false;
            try {
                await I_SecurityToken.transfer(account_investor2, acct1Balance, { from: account_investor1 });
            } catch(error) {
                console.log(`         tx revert -> couldn't transfer because of lock up`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);

            // check and get the lockup
            let lockUpCount = await I_VolumeRestrictionTransferManager.getLockUpsLength(account_investor1);
            assert.equal(lockUpCount, 1)

            // remove the lockup
            await I_VolumeRestrictionTransferManager.removeLockUp(account_investor1, 0, { from: token_owner });
            

           lockUpCount = await I_VolumeRestrictionTransferManager.getLockUpsLength(account_investor1);
            assert.equal(lockUpCount, 0)

            let acct2BalanceBefore = await I_SecurityToken.balanceOf(account_investor2)
            await I_SecurityToken.transfer(account_investor2, acct1Balance, { from: account_investor1 });
            let acct2BalanceAfter = await I_SecurityToken.balanceOf(account_investor2)

            assert.equal(acct2BalanceAfter.sub(acct2BalanceBefore).toString(), acct1Balance.toString())
        });

        it("Should be possible to create multiple lockups at once", async() => {

            let balancesBefore = {}
            balancesBefore[account_investor2] = await I_SecurityToken.balanceOf(account_investor2)
            // console.log('balance investor2 is ',balancesBefore[account_investor2].toString())

            balancesBefore[account_investor3] = await I_SecurityToken.balanceOf(account_investor3)
            // console.log('balance investor3 is ',balancesBefore[account_investor3].toString())

            let lockUpCountsBefore = {}
            
            // get lockups for acct 2
            lockUpCountsBefore[account_investor2] = await I_VolumeRestrictionTransferManager.getLockUpsLength(account_investor2);
            assert.equal(lockUpCountsBefore[account_investor2], 1) // there's one old, expired lockup on acct already

            // get lockups for acct 3
            lockUpCountsBefore[account_investor3] = await I_VolumeRestrictionTransferManager.getLockUpsLength(account_investor3);
            assert.equal(lockUpCountsBefore[account_investor3], 0)

            // create lockups for their entire balances
            await I_VolumeRestrictionTransferManager.addLockUpMulti(
                [account_investor2, account_investor3], 
                [16, 8],
                [2, 2],
                [0, 0],
                [balancesBefore[account_investor2], balancesBefore[account_investor3]],
                { from: token_owner }
            ); 

            let errorThrown = false;
            try {
                await I_SecurityToken.transfer(account_investor1, web3.utils.toWei('1', 'ether'), { from: account_investor2 });
            } catch(error) {
                console.log(`         tx revert -> couldn't transfer because of lock up`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);

            errorThrown = false;
            try {
                await I_SecurityToken.transfer(account_investor1, web3.utils.toWei('2', 'ether'), { from: account_investor3 });
            } catch(error) {
                console.log(`         tx revert -> couldn't transfer because of lock up`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);

            let balancesAfter = {}
            balancesAfter[account_investor2] = await I_SecurityToken.balanceOf(account_investor2)
            assert.equal(balancesBefore[account_investor2].toString(), balancesAfter[account_investor2].toString())

            balancesAfter[account_investor3] = await I_SecurityToken.balanceOf(account_investor3)
            assert.equal(balancesBefore[account_investor3].toString(), balancesAfter[account_investor3].toString())

            let lockUpCountsAfter = {}
            
            // get lockups for acct 2
            lockUpCountsAfter[account_investor2] = await I_VolumeRestrictionTransferManager.getLockUpsLength(account_investor2);
            assert.equal(lockUpCountsAfter[account_investor2], 2);

            // get lockups for acct 3
            lockUpCountsAfter[account_investor3] = await I_VolumeRestrictionTransferManager.getLockUpsLength(account_investor3);
            assert.equal(lockUpCountsAfter[account_investor3], 1);

            // wait 2 seconds
            await new Promise(resolve => setTimeout(resolve, 2000));

            // try transfers again
            await I_SecurityToken.transfer(account_investor1, web3.utils.toWei('1', 'ether'), { from: account_investor2 });
            await I_SecurityToken.transfer(account_investor1, web3.utils.toWei('2', 'ether'), { from: account_investor3 });


            balancesAfter[account_investor2] = await I_SecurityToken.balanceOf(account_investor2)
            assert.equal(balancesBefore[account_investor2].sub(web3.utils.toWei('1', 'ether')).toString(), balancesAfter[account_investor2].toString())

            balancesAfter[account_investor3] = await I_SecurityToken.balanceOf(account_investor3)
            assert.equal(balancesBefore[account_investor3].sub(web3.utils.toWei('2', 'ether')).toString(), balancesAfter[account_investor3].toString())

        });

        it("Should revert if the parameters are bad when creating multiple lockups", async() => {
            let errorThrown = false;
            try {
                // pass in the wrong number of params.  txn should revert
            await I_VolumeRestrictionTransferManager.addLockUpMulti(
                [account_investor2, account_investor3], 
                [16, 8],
                [2], // this array should have 2 elements but it has 1, which should cause a revert
                [0, 0],
                [web3.utils.toWei('1', 'ether'), web3.utils.toWei('1', 'ether')],
                { from: token_owner }
            ); 
            } catch(error) {
                console.log(`         tx revert -> passed in wrong number of array elements`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        });

        it("Should be possible to create a lockup with a specific start time in the future", async() => {

            // remove all lockups for account 2
            let lockUpsLength = await I_VolumeRestrictionTransferManager.getLockUpsLength(account_investor2);
            assert.equal(lockUpsLength, 2);
            await I_VolumeRestrictionTransferManager.removeLockUp(account_investor2, 0, { from: token_owner });
            await I_VolumeRestrictionTransferManager.removeLockUp(account_investor2, 0, { from: token_owner });
            lockUpsLength = await I_VolumeRestrictionTransferManager.getLockUpsLength(account_investor2);
            assert.equal(lockUpsLength, 0);

            let now = (await web3.eth.getBlock('latest')).timestamp

            let balance = await I_SecurityToken.balanceOf(account_investor2)
            // console.log('balance is ' + balance)

            await I_VolumeRestrictionTransferManager.addLockUp(account_investor2, 16, 4, now + 4, balance, { from: token_owner });

            // try a transfer.  it should fail because the lockup hasn't started yet.
            let errorThrown = false;
            try {
                await I_SecurityToken.transfer(account_investor1, web3.utils.toWei('1', 'ether'), { from: account_investor2 });
            } catch(error) {
                console.log(`         tx revert -> couldn't transfer because of lock up`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);

            // wait 4 seconds for the lockup to begin
            await new Promise(resolve => setTimeout(resolve, 4000));

            // try another transfer.  it should also fail because the lockup has begun
            errorThrown = false;
            try {
                await I_SecurityToken.transfer(account_investor1, web3.utils.toWei('1', 'ether'), { from: account_investor2 });
            } catch(error) {
                console.log(`         tx revert -> couldn't transfer because of lock up`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);

        });

        it("Should be possible to edit a lockup with a specific start time in the future", async() => {

            // edit the lockup
            let now = (await web3.eth.getBlock('latest')).timestamp

            let balance = await I_SecurityToken.balanceOf(account_investor2)

            // check and get the lockup
            let lockUpCount = await I_VolumeRestrictionTransferManager.getLockUpsLength(account_investor2);
            assert.equal(lockUpCount, 1)

            let lockUp = await I_VolumeRestrictionTransferManager.getLockUp(account_investor2, 0);
            // console.log(lockUp);
            // elements in lockup array are uint lockUpPeriodSeconds, uint releaseFrequencySeconds, uint startTime, uint totalAmount
            assert.equal(lockUp[0].toString(), '16');
            assert.equal(lockUp[1].toString(), '4');
            assert.isAtMost(lockUp[2].toNumber(), now);
            assert.equal(lockUp[3].toString(), balance.toString());

            // edit the lockup
            await I_VolumeRestrictionTransferManager.editLockUp(account_investor2, 0, 8, 4, now + 4, balance, { from: token_owner });

            // try a transfer.  it should fail because again, the lockup hasn't started yet.
            let errorThrown = false;
            try {
                await I_SecurityToken.transfer(account_investor1, web3.utils.toWei('1', 'ether'), { from: account_investor2 });
            } catch(error) {
                console.log(`         tx revert -> couldn't transfer because of lock up`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);

            // wait 4 seconds for the lockup to begin
            await new Promise(resolve => setTimeout(resolve, 4000));

            // try another transfer.  it should fail because the lockup has begun
            errorThrown = false;
            try {
                await I_SecurityToken.transfer(account_investor1, web3.utils.toWei('1', 'ether'), { from: account_investor2 });
            } catch(error) {
                console.log(`         tx revert -> couldn't transfer because of lock up`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        });


        it("Should get configuration function signature", async() => {
            let sig = await I_VolumeRestrictionTransferManager.getInitFunction.call();
            assert.equal(web3.utils.hexToNumber(sig), 0);
        });


        it("Should get the permission", async() => {
            let perm = await I_VolumeRestrictionTransferManager.getPermissions.call();
            assert.equal(perm.length, 1);
            // console.log(web3.utils.toAscii(perm[0]).replace(/\u0000/g, ''))
            assert.equal(web3.utils.toAscii(perm[0]).replace(/\u0000/g, ''), "ADMIN")
        });

    });

    describe("VolumeRestriction Transfer Manager Factory test cases", async() => {

        it("Should get the exact details of the factory", async() => {
            assert.equal(await I_VolumeRestrictionTransferManagerFactory.setupCost.call(),0);
            assert.equal(await I_VolumeRestrictionTransferManagerFactory.getType.call(),2);
            assert.equal(web3.utils.toAscii(await I_VolumeRestrictionTransferManagerFactory.getName.call())
                        .replace(/\u0000/g, ''),
                        "VolumeRestrictionTransferManager",
                        "Wrong Module added");
            assert.equal(await I_VolumeRestrictionTransferManagerFactory.getDescription.call(),
                        "Manage transfers using lock ups over time",
                        "Wrong Module added");
            assert.equal(await I_VolumeRestrictionTransferManagerFactory.getTitle.call(),
                        "Volume Restriction Transfer Manager",
                        "Wrong Module added");
            assert.equal(await I_VolumeRestrictionTransferManagerFactory.getInstructions.call(),
                        "Allows an issuer to set lockup periods for user addresses, with funds distributed over time. Init function takes no parameters.",
                        "Wrong Module added");

        });

        it("Should get the tags of the factory", async() => {
            let tags = await I_VolumeRestrictionTransferManagerFactory.getTags.call();
            assert.equal(web3.utils.toAscii(tags[0]).replace(/\u0000/g, ''), "Volume");
        });
    });

});
