import latestTime from './helpers/latestTime';
import { duration, ensureException, promisifyLogWatch, latestBlock } from './helpers/utils';
import { takeSnapshot, increaseTime, revertToSnapshot } from './helpers/time';
import { encodeProxyCall, encodeModuleCall } from './helpers/encodeCall';

// Import contract ABIs
const CappedSTOFactory = artifacts.require('./CappedSTOFactory.sol');
const CappedSTO = artifacts.require('./CappedSTO.sol');
const DummySTOFactory = artifacts.require('./DummySTOFactory.sol');
const DummySTO = artifacts.require('./DummySTO.sol');
const PreSaleSTOFactory = artifacts.require('./PreSaleSTOFactory.sol');
const PreSaleSTO = artifacts.require('./PreSaleSTO.sol');
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
const GeneralPermissionManager = artifacts.require('./GeneralPermissionManager');
const PolyTokenFaucet = artifacts.require('./PolyTokenFaucet.sol');

const Web3 = require('web3');
const BigNumber = require('bignumber.js');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")) // Hardcoded development port

contract('Concurrent STO', accounts => {
    // Accounts variable declaration
    let account_polymath;
    let account_issuer;
    let account_fundsReceiver;
    let account_investor1;
    let account_investor2;
    let account_investor3;

    // Contract instance declaration
    let I_GeneralPermissionManagerFactory;
    let I_SecurityTokenRegistryProxy;
    let I_GeneralPermissionManager;
    let I_GeneralTransferManagerFactory;
    let I_GeneralTransferManager;
    let I_ModuleRegistryProxy;
    let I_ModuleRegistry;
    let I_FeatureRegistry;
    let I_STFactory;
    let I_MRProxied;
    let I_STRProxied;
    let I_SecurityTokenRegistry;
    let I_SecurityToken;
    let I_PolyToken;
    let I_PolymathRegistry;

    // STO instance declaration
    let I_CappedSTOFactory;
    let I_DummySTOFactory;
    let I_PreSaleSTOFactory;
    let I_STO_Array = [];

    // Error message
    let message = "Transaction Should Fail!";

    // Initial fees
    const initRegFee = web3.utils.toWei("250");
    const STOSetupCost = 200 * Math.pow(10, 18);

    // Module keys
    const transferManagerKey = 2;
    const stoKey = 3;

    // Configure function signature for STO deployment

    const CappedSTOParameters = ['uint256', 'uint256', 'uint256', 'uint256', 'uint8[]', 'address'];
    const STRProxyParameters = ['address', 'address', 'uint256', 'uint256', 'address', 'address'];
    const MRProxyParameters = ['address', 'address'];
    const DummySTOParameters = ['uint256', 'uint256', 'uint256', 'string'];
    const PresaleSTOParameters = ['uint256'];

    before(async() => {
        // Accounts setup
        account_polymath = accounts[0];
        account_issuer = accounts[1];
        account_fundsReceiver = accounts[2];
        account_investor1 = accounts[3];
        account_investor2 = accounts[4];
        account_investor3 = accounts[5]

        // ----------- POLYMATH NETWORK Configuration ------------

        // Step 0: Deploy the PolymathRegistry
        I_PolymathRegistry = await PolymathRegistry.new({from: account_polymath});

        // Step 1: Deploy the token Faucet and Mint tokens for token_owner
        I_PolyToken = await PolyTokenFaucet.new();
        await I_PolyToken.getTokens((10000 * Math.pow(10, 18)), account_issuer);

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

        // STEP 2: Deploy the GeneralTransferManagerFactory

        I_GeneralTransferManagerFactory = await GeneralTransferManagerFactory.new(I_PolyToken.address, 0, 0, 0, {from:account_polymath});

        assert.notEqual(
            I_GeneralTransferManagerFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "GeneralTransferManagerFactory contract was not deployed"
        );

        // STEP 3: Deploy the GeneralPermissionManagerFactory

        I_GeneralPermissionManagerFactory = await GeneralPermissionManagerFactory.new(I_PolyToken.address, 0, 0, 0, {from:account_polymath});

        assert.notEqual(
            I_GeneralPermissionManagerFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "GeneralDelegateManagerFactory contract was not deployed"
        );

        // STEP 4: Deploy the STO Factories

        I_CappedSTOFactory = await CappedSTOFactory.new(I_PolyToken.address, STOSetupCost, 0, 0, { from: account_issuer });
        I_DummySTOFactory = await DummySTOFactory.new(I_PolyToken.address, STOSetupCost, 0, 0, { from: account_issuer });
        I_PreSaleSTOFactory = await PreSaleSTOFactory.new(I_PolyToken.address, STOSetupCost, 0, 0, { from: account_issuer });

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

        // STEP 5: Register the Modules with the ModuleRegistry contract

        // (A) :  Register the GeneralTransferManagerFactory
        await I_MRProxied.registerModule(I_GeneralTransferManagerFactory.address, { from: account_polymath });
        await I_MRProxied.verifyModule(I_GeneralTransferManagerFactory.address, true, { from: account_polymath });

        // (B) :  Register the GeneralDelegateManagerFactory
        await I_MRProxied.registerModule(I_GeneralPermissionManagerFactory.address, { from: account_polymath });
        await I_MRProxied.verifyModule(I_GeneralPermissionManagerFactory.address, true, { from: account_polymath });

        // (C) : Register the STO Factories
        await I_MRProxied.registerModule(I_CappedSTOFactory.address, { from: account_polymath });
        await I_MRProxied.verifyModule(I_CappedSTOFactory.address, true, { from: account_polymath });

        await I_MRProxied.registerModule(I_DummySTOFactory.address, { from: account_polymath });
        await I_MRProxied.verifyModule(I_DummySTOFactory.address, true, { from: account_polymath });

        await I_MRProxied.registerModule(I_PreSaleSTOFactory.address, { from: account_polymath });
        await I_MRProxied.verifyModule(I_PreSaleSTOFactory.address, true, { from: account_polymath });

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

    describe("Generate Security Token", async() => {
        // SecurityToken Details for funds raise Type ETH
        const name = "Team";
        const symbol = "SAP";
        const tokenDetails = "This is equity type of issuance";
        const decimals = 18;

        it("Should register the ticker before the generation of the security token", async () => {
            await I_PolyToken.getTokens(initRegFee, account_issuer);
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: account_issuer });
            let tx = await I_STRProxied.registerTicker(account_issuer, symbol, name, { from : account_issuer });
            assert.equal(tx.logs[0].args._owner, account_issuer);
            assert.equal(tx.logs[0].args._ticker, symbol);
        });

        it("Should generate the new security token with the same symbol as registered above", async () => {
            await I_PolyToken.getTokens(initRegFee, account_issuer);
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: account_issuer});
            let _blockNo = latestBlock();
            let tx = await I_STRProxied.generateSecurityToken(name, symbol, tokenDetails, false, { from: account_issuer });
            assert.equal(tx.logs[1].args._ticker, symbol, "SecurityToken doesn't get deployed");

            I_SecurityToken = SecurityToken.at(tx.logs[1].args._securityTokenAddress);

            const log = await promisifyLogWatch(I_SecurityToken.ModuleAdded({from: _blockNo}), 1);

            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._types[0].toNumber(), transferManagerKey);
            assert.equal(web3.utils.hexToString(log.args._name),"GeneralTransferManager");
        });

        it("Should intialize the auto attached modules", async () => {
            let moduleData = (await I_SecurityToken.getModulesByType(transferManagerKey))[0];
            I_GeneralTransferManager = GeneralTransferManager.at(moduleData);

        });

        it("Should whitelist account_investor1", async() => {
            let fromTime = latestTime();
            let toTime = latestTime() + duration.days(15);
            let expiryTime = toTime + duration.days(100);
            let canBuyFromSTO = true;

            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_investor1,
                fromTime,
                toTime,
                expiryTime,
                canBuyFromSTO,
                {
                    from: account_issuer,
                    gas: 500000
                });

            assert.equal(tx.logs[0].args._investor, account_investor1, "Failed in adding the investor in whitelist");
        });
    });

    describe("Add STO and verify transfer", async() => {

        it("Should attach STO modules up to the max number, then fail", async() => {
            const MAX_MODULES = 10;
            const startTime = latestTime() + duration.days(1);
            const endTime = latestTime() + duration.days(90);
            const cap = web3.utils.toWei("10000");
            const rate = 1000;
            const fundRaiseType = [0];
            const budget = 0;
            const maxCost = STOSetupCost;
            const cappedBytesSig = encodeModuleCall(CappedSTOParameters, [startTime, endTime, cap, rate, fundRaiseType, account_fundsReceiver]);
            const dummyBytesSig = encodeModuleCall(DummySTOParameters, [startTime, endTime, cap, 'Hello']);
            const presaleBytesSig = encodeModuleCall(PresaleSTOParameters, [endTime]);

            for (var STOIndex = 0; STOIndex < MAX_MODULES; STOIndex++) {
                await I_PolyToken.getTokens(STOSetupCost, account_issuer);
                await I_PolyToken.transfer(I_SecurityToken.address, STOSetupCost, { from: account_issuer });
                switch (STOIndex % 3) {
                    case 0:
                        // Capped STO
                        let tx1 = await I_SecurityToken.addModule(I_CappedSTOFactory.address, cappedBytesSig, maxCost, budget, { from: account_issuer });
                        assert.equal(tx1.logs[3].args._types[0], stoKey, `Wrong module type added at index ${STOIndex}`);
                        assert.equal(web3.utils.hexToString(tx1.logs[3].args._name),"CappedSTO",`Wrong STO module added at index ${STOIndex}`);
                        I_STO_Array.push(CappedSTO.at(tx1.logs[3].args._module));
                        break;
                    case 1:
                        // Dummy STO
                        let tx2 = await I_SecurityToken.addModule(I_DummySTOFactory.address, dummyBytesSig, maxCost, budget, { from: account_issuer });
                        assert.equal(tx2.logs[3].args._types[0], stoKey, `Wrong module type added at index ${STOIndex}`);
                        assert.equal(web3.utils.hexToString(tx2.logs[3].args._name),"DummySTO",`Wrong STO module added at index ${STOIndex}`);
                        I_STO_Array.push(DummySTO.at(tx2.logs[3].args._module));
                        break;
                    case 2:
                        // Pre Sale STO
                        let tx3 = await I_SecurityToken.addModule(I_PreSaleSTOFactory.address, presaleBytesSig, maxCost, budget, { from: account_issuer });
                        assert.equal(tx3.logs[3].args._types[0], stoKey, `Wrong module type added at index ${STOIndex}`);
                        assert.equal(web3.utils.hexToString(tx3.logs[3].args._name),"PreSaleSTO",`Wrong STO module added at index ${STOIndex}`);
                        I_STO_Array.push(PreSaleSTO.at(tx3.logs[3].args._module));
                        break;
                }
            }

        });

        it("Should successfully invest in all modules attached", async() => {
            const MAX_MODULES = 10;
            await increaseTime(duration.days(2));
            for (var STOIndex = 0; STOIndex < MAX_MODULES; STOIndex++) {
                switch (STOIndex % 3) {
                    case 0:
                        // Capped STO ETH
                        await I_STO_Array[STOIndex].buyTokens(account_investor1, { from : account_investor1, value: web3.utils.toWei('1', 'ether') });
                        assert.equal(web3.utils.fromWei((await I_STO_Array[STOIndex].getRaised.call(0)).toString()), 1);
                        assert.equal(await I_STO_Array[STOIndex].investorCount.call(), 1);
                        break;
                    case 1:
                        // Dummy STO
                        await I_STO_Array[STOIndex].generateTokens(account_investor1, web3.utils.toWei('1000'), { from : account_issuer });
                        assert.equal(await I_STO_Array[STOIndex].investorCount.call(), 1);
                        assert.equal(
                            (await I_STO_Array[STOIndex].investors.call(account_investor1))
                            .dividedBy(new BigNumber(10).pow(18))
                            .toNumber(),
                            1000
                        );
                        break;
                    case 2:
                        // Pre Sale STO
                        await I_STO_Array[STOIndex].allocateTokens(account_investor1, web3.utils.toWei('1000'), web3.utils.toWei('1'), 0, { from : account_issuer });
                        assert.equal(web3.utils.fromWei((await I_STO_Array[STOIndex].getRaised.call(0)).toString()), 1);
                        assert.equal(web3.utils.fromWei((await I_STO_Array[STOIndex].getRaised.call(1)).toString()), 0);
                        assert.equal(await I_STO_Array[STOIndex].investorCount.call(), 1);
                        assert.equal(
                            (await I_STO_Array[STOIndex].investors.call(account_investor1))
                            .dividedBy(new BigNumber(10).pow(18))
                            .toNumber(),
                            1000
                        );
                        break;
                }
            }
        });
    });
});
