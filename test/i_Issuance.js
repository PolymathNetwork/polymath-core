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


contract('Issuance', accounts => {


    // Accounts Variable declaration
    let account_polymath;
    let account_investor1;
    let account_issuer;
    let token_owner;
    let account_investor2;
    let account_fundsReceiver;
    let account_delegate;
    let blockNo;
    let balanceOfReceiver;
    let message = "Transaction Should Fail!";
    const TM_Perm = "WHITELIST";
    const delegateDetails = "I am delegate"
    // investor Details
    let fromTime = latestTime();
    let toTime = latestTime() + duration.days(15);
    let expiryTime = toTime + duration.days(100);

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
    let I_MRProxied;
    let I_STRProxied;
    let I_STFactory;
    let I_SecurityToken;
    let I_CappedSTO;
    let I_PolyToken;
    let I_PolymathRegistry;

    // SecurityToken Details (Launched ST on the behalf of the issuer)
    const name = "Demo Token";
    const symbol = "DET";
    const tokenDetails = "This is equity type of issuance";
    const decimals = 18;

    // Module key
    const permissionManagerKey = 1;
    const transferManagerKey = 2;
    const stoKey = 3;
    const budget = 0;

    // Initial fee for ticker registry and security token registry
    const initRegFee = web3.utils.toWei("250");

    // Capped STO details
    //let startTime;           // Start time will be 5000 seconds more than the latest time
    //let endTime;                    // Add 30 days more
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
        account_investor1 = accounts[3];
        account_investor2 = accounts[2];
        account_fundsReceiver = accounts[4];
        account_delegate = accounts[5];
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

        // STEP 6: Deploy the CappedSTOFactory

        I_CappedSTOFactory = await CappedSTOFactory.new(I_PolyToken.address, cappedSTOSetupCost, 0, 0, { from: token_owner });

        assert.notEqual(
            I_CappedSTOFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "CappedSTOFactory contract was not deployed"
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

        // STEP 7: Register the Modules with the ModuleRegistry contract

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
        ModuleRegistry:                    ${ModuleRegistry.address}
        ModuleRegistryProxy:               ${ModuleRegistryProxy.address}
        FeatureRegistry:                   ${FeatureRegistry.address}

        STFactory:                         ${STFactory.address}
        GeneralTransferManagerFactory:     ${GeneralTransferManagerFactory.address}
        GeneralPermissionManagerFactory:   ${GeneralPermissionManagerFactory.address}

        CappedSTOFactory:                  ${I_CappedSTOFactory.address}
        -----------------------------------------------------------------------------
        `);
    });

    describe("Launch SecurityToken & STO on the behalf of the issuer", async() => {

        describe("Create securityToken for the issuer by the polymath", async() => {

            it("POLYMATH: Should register the ticker before the generation of the security token", async () => {
                await I_PolyToken.getTokens((10000 * Math.pow(10, 18)), account_polymath);
                await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: account_polymath });
                let tx = await I_STRProxied.registerTicker(account_polymath, symbol, name, { from : account_polymath });
                assert.equal(tx.logs[0].args._owner, account_polymath);
                assert.equal(tx.logs[0].args._ticker, symbol);
            });

            it("POLYMATH: Should generate the new security token with the same symbol as registered above", async () => {
                console.log(name, symbol, tokenDetails, false);
                await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: account_polymath });
                let _blockNo = latestBlock();
                let tx = await I_STRProxied.generateSecurityToken(name, symbol, tokenDetails, false, { from: account_polymath  });

                // Verify the successful generation of the security token
                assert.equal(tx.logs[1].args._ticker, symbol, "SecurityToken doesn't get deployed");

                I_SecurityToken = SecurityToken.at(tx.logs[1].args._securityTokenAddress);

                const log = await promisifyLogWatch(I_SecurityToken.ModuleAdded({from: _blockNo}), 1);

                // Verify that GeneralTransferManager module get added successfully or not
                assert.equal(log.args._types[0].toNumber(), transferManagerKey);
                assert.equal(
                    web3.utils.toAscii(log.args._name)
                    .replace(/\u0000/g, ''),
                    "GeneralTransferManager"
                );
            });

            it("POLYMATH: Should intialize the auto attached modules", async () => {
                let moduleData = (await I_SecurityToken.getModulesByType(transferManagerKey))[0];
                I_GeneralTransferManager = GeneralTransferManager.at(moduleData);


             });

             it("POLYMATH: Should successfully attach the STO factory with the security token", async () => {
                 // STEP 4: Deploy the CappedSTOFactory

                I_CappedSTOFactory = await CappedSTOFactory.new(I_PolyToken.address, cappedSTOSetupCost, 0, 0, { from: account_polymath });

                assert.notEqual(
                    I_CappedSTOFactory.address.valueOf(),
                    "0x0000000000000000000000000000000000000000",
                    "CappedSTOFactory contract was not deployed"
                );

                // (C) : Register the STOFactory
                await I_MRProxied.registerModule(I_CappedSTOFactory.address, { from: account_polymath });
                await I_MRProxied.verifyModule(I_CappedSTOFactory.address, true, { from: account_polymath });

                let bytesSTO = encodeModuleCall(STOParameters, [(latestTime() + duration.seconds(5000)), (latestTime() + duration.days(30)), cap, rate, fundRaiseType, account_fundsReceiver]);

                await I_PolyToken.getTokens(cappedSTOSetupCost, account_polymath);
                await I_PolyToken.transfer(I_SecurityToken.address, cappedSTOSetupCost, { from: account_polymath});

                const tx = await I_SecurityToken.addModule(I_CappedSTOFactory.address, bytesSTO, maxCost, 0, { from: account_polymath });

                assert.equal(tx.logs[3].args._types[0], stoKey, "CappedSTO doesn't get deployed");
                assert.equal(
                    web3.utils.toAscii(tx.logs[3].args._name)
                    .replace(/\u0000/g, ''),
                    "CappedSTO",
                    "CappedSTOFactory module was not added"
                );
                I_CappedSTO = CappedSTO.at(tx.logs[3].args._module);
            });
        });

        describe("Transfer Manager operations by the polymath_account", async() => {
            it("Should modify the whitelist", async () => {

                fromTime = latestTime();
                toTime = latestTime() + duration.days(15);
                expiryTime = toTime + duration.days(100);

                let tx = await I_GeneralTransferManager.modifyWhitelist(
                    account_investor1,
                    fromTime + duration.days(70),
                    toTime + duration.days(90),
                    expiryTime + duration.days(50),
                    true,
                    {
                        from: account_polymath
                    });
                assert.equal(tx.logs[0].args._investor, account_investor1, "Failed in adding the investor in whitelist");
            });

            it("Should add the delegate with permission", async() => {
                 //First attach a permission manager to the token
                 await I_SecurityToken.addModule(I_GeneralPermissionManagerFactory.address, "", 0, 0, {from: account_polymath});
                 let moduleData = (await I_SecurityToken.getModulesByType(permissionManagerKey))[0];
                 I_GeneralPermissionManager = GeneralPermissionManager.at(moduleData);
                 // Add permission to the deletgate (A regesteration process)
                 await I_GeneralPermissionManager.addPermission(account_delegate, delegateDetails, { from: account_polymath});
                 // Providing the permission to the delegate
                 await I_GeneralPermissionManager.changePermission(account_delegate, I_GeneralTransferManager.address, TM_Perm, true, { from: account_polymath });

                 assert.isTrue(await I_GeneralPermissionManager.checkPermission(account_delegate, I_GeneralTransferManager.address, TM_Perm));
            });

            it("POLYMATH: Should change the ownership of the SecurityToken", async() => {
                await I_SecurityToken.transferOwnership(token_owner, { from : account_polymath });

                assert.equal(await I_SecurityToken.owner.call(), token_owner);
            });
        })

        describe("Operations on the STO", async() => {
            it("Should Buy the tokens", async() => {
                balanceOfReceiver = await web3.eth.getBalance(account_fundsReceiver);
                blockNo = latestBlock();
                // Jump time
                await increaseTime(5000);
                // Fallback transaction
                await web3.eth.sendTransaction({
                    from: account_investor1,
                    to: I_CappedSTO.address,
                    gas: 6100000,
                    value: web3.utils.toWei('1', 'ether')
                  });

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

            it("Verification of the event Token Purchase", async() => {
                const log = await promisifyLogWatch(I_CappedSTO.TokenPurchase({from: blockNo}), 1);
                assert.equal(log.args.purchaser, account_investor1, "Wrong address of the investor");
                assert.equal(
                    (log.args.amount)
                    .dividedBy(new BigNumber(10).pow(18))
                    .toNumber(),
                    1000,
                    "Wrong No. token get dilivered"
                );
            });

            it("should add the investor into the whitelist by the delegate", async () => {
                let tx = await I_GeneralTransferManager.modifyWhitelist(
                    account_investor2,
                    fromTime,
                    toTime,
                    expiryTime,
                    true,
                    {
                        from: account_delegate,
                        gas: 7000000
                    });
                assert.equal(tx.logs[0].args._investor, account_investor2, "Failed in adding the investor in whitelist");
            });

            it("Should buy the token", async () => {
                await web3.eth.sendTransaction({
                    from: account_investor2,
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
                    (await I_SecurityToken.balanceOf(account_investor2))
                    .dividedBy(new BigNumber(10).pow(18))
                    .toNumber(),
                    1000
                );
            })
        });
    });
});
