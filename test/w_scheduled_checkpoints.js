import latestTime from './helpers/latestTime';
import { duration, ensureException, promisifyLogWatch, latestBlock } from './helpers/utils';
import takeSnapshot, { increaseTime, revertToSnapshot } from './helpers/time';
import { encodeProxyCall, encodeModuleCall } from './helpers/encodeCall';

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
const ScheduledCheckpointFactory = artifacts.require('./ScheduledCheckpointFactory.sol');
const ScheduledCheckpoint = artifacts.require('./ScheduledCheckpoint.sol');
const GeneralPermissionManager = artifacts.require('./GeneralPermissionManager');
const PolyTokenFaucet = artifacts.require('./PolyTokenFaucet.sol');

const Web3 = require('web3');
const BigNumber = require('bignumber.js');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")) // Hardcoded development port

contract('ScheduledCheckpoint', accounts => {

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
    let I_SecurityTokenRegistryProxy;
    let I_GeneralTransferManagerFactory;
    let I_ScheduledCheckpointFactory;
    let I_GeneralPermissionManager;
    let I_ScheduledCheckpoint;
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

        // STEP 4(c): Deploy the PercentageTransferManager
        I_ScheduledCheckpointFactory = await ScheduledCheckpointFactory.new(I_PolyToken.address, 0, 0, 0, {from:account_polymath});
        assert.notEqual(
            I_ScheduledCheckpointFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "ScheduledCheckpointFactory contract was not deployed"
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

       // (C) : Register the PercentageTransferManagerFactory
       await I_MRProxied.registerModule(I_ScheduledCheckpointFactory.address, { from: account_polymath });
       await I_MRProxied.verifyModule(I_ScheduledCheckpointFactory.address, true, { from: account_polymath });

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

        ScheduledCheckpointFactory:        ${I_ScheduledCheckpointFactory.address}
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

    });

    describe("Buy tokens using on-chain whitelist", async() => {

        it("Should successfully attach the ScheduledCheckpoint with the security token", async () => {
            await I_SecurityToken.changeGranularity(1, {from: token_owner});
            const tx = await I_SecurityToken.addModule(I_ScheduledCheckpointFactory.address, "", 0, 0, { from: token_owner });
            assert.equal(tx.logs[2].args._types[0].toNumber(), 4, "ScheduledCheckpoint doesn't get deployed");
            assert.equal(tx.logs[2].args._types[1].toNumber(), 2, "ScheduledCheckpoint doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name)
                .replace(/\u0000/g, ''),
                "ScheduledCheckpoint",
                "ScheduledCheckpoint module was not added"
            );
            I_ScheduledCheckpoint = ScheduledCheckpoint.at(tx.logs[2].args._module);
        });

        let startTime = latestTime() + 100;
        let interval = 24 * 60 * 60;
        it("Should create a daily checkpoint", async () => {
            console.log("Creating scheduled CP: " + startTime, interval);
            await I_ScheduledCheckpoint.addSchedule("CP1", startTime, interval, {from: token_owner});
        });

        it("Should Buy the tokens for account_investor1", async() => {
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
            // We should be after the first scheduled checkpoint, and before the second
            assert.isTrue(latestTime() > startTime);
            assert.isTrue(latestTime() <= startTime + interval);

            // Mint some tokens
            await I_SecurityToken.mint(account_investor1, web3.utils.toWei('1', 'ether'), { from: token_owner });

            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor1)).toNumber(),
                web3.utils.toWei('1', 'ether')
            );
        });

        it("Should have checkpoint created with correct balances", async() => {
            let cp1 = await I_ScheduledCheckpoint.getSchedule("CP1");
            checkSchedule(cp1, "CP1", startTime, startTime + interval, interval, [1], [startTime], [1]);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor1, 0)).toNumber(), 0);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor1, 1)).toNumber(), 0);
        });

        it("Should Buy some more tokens for account_investor2", async() => {
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

            // We should be after the first scheduled checkpoint, and before the second
            assert.isTrue(latestTime() > startTime);
            assert.isTrue(latestTime() <= startTime + interval);

            // Mint some tokens
            await I_SecurityToken.mint(account_investor2, web3.utils.toWei('1', 'ether'), { from: token_owner });

            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor2)).toNumber(),
                web3.utils.toWei('1', 'ether')
            );
        });

        it("No additional checkpoints created", async() => {
            let cp1 = await I_ScheduledCheckpoint.getSchedule("CP1");
            checkSchedule(cp1, "CP1", startTime, startTime + interval, interval, [1], [startTime], [1]);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor2, 0)).toNumber(), 0);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor2, 1)).toNumber(), 0);
        });

        it("Add a new token holder - account_investor3", async() => {

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

            // Jump time
            await increaseTime(interval);
            // We should be after the first scheduled checkpoint, and before the second
            assert.isTrue(latestTime() > startTime + interval);
            assert.isTrue(latestTime() <= startTime + (2 * interval));

            // Add the Investor in to the whitelist
            // Mint some tokens
            await I_SecurityToken.mint(account_investor3, web3.utils.toWei('1', 'ether'), { from: token_owner });

            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor3)).toNumber(),
                web3.utils.toWei('1', 'ether')
            );
        });

        it("Should have new checkpoint created with correct balances", async() => {
            let cp1 = await I_ScheduledCheckpoint.getSchedule("CP1");
            checkSchedule(cp1, "CP1", startTime, startTime + (2 * interval), interval, [1, 2], [startTime, startTime + interval], [1, 1]);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor3, 0)).toNumber(), 0);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor3, 1)).toNumber(), 0);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor3, 2)).toNumber(), 0);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor2, 0)).toNumber(), 0);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor2, 1)).toNumber(), 0);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor2, 2)).toNumber(), web3.utils.toWei('1', 'ether'));
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor1, 0)).toNumber(), 0);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor1, 1)).toNumber(), 0);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor1, 2)).toNumber(), web3.utils.toWei('1', 'ether'));
        });

        it("Should have correct balances for investor 3 after new checkpoint", async() => {
            // Jump time
            await increaseTime(2 * interval);
            // We should be after the first scheduled checkpoint, and before the second
            assert.isTrue(latestTime() > startTime + (3 * interval));
            assert.isTrue(latestTime() <= startTime + (4 * interval));
            await I_SecurityToken.transfer(account_investor3, web3.utils.toWei('0.5', 'ether'), { from: account_investor1 });
            let cp1 = await I_ScheduledCheckpoint.getSchedule("CP1");
            checkSchedule(cp1, "CP1", startTime, startTime + (4 * interval), interval, [1, 2, 3], [startTime, startTime + interval, startTime + (2 * interval)], [1, 1, 2]);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor3, 0)).toNumber(), 0);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor3, 1)).toNumber(), 0);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor3, 2)).toNumber(), 0);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor3, 3)).toNumber(), web3.utils.toWei('1', 'ether'));

            assert.equal((await I_SecurityToken.balanceOfAt(account_investor2, 0)).toNumber(), 0);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor2, 1)).toNumber(), 0);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor2, 2)).toNumber(), web3.utils.toWei('1', 'ether'));
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor2, 3)).toNumber(), web3.utils.toWei('1', 'ether'));

            assert.equal((await I_SecurityToken.balanceOfAt(account_investor1, 0)).toNumber(), 0);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor1, 1)).toNumber(), 0);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor1, 2)).toNumber(), web3.utils.toWei('1', 'ether'));
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor1, 3)).toNumber(), web3.utils.toWei('1', 'ether'));

        });

        it("Manually update checkpoints", async() => {
            await increaseTime(interval);
            await I_ScheduledCheckpoint.updateAll({from: token_owner});

            let cp1 = await I_ScheduledCheckpoint.getSchedule("CP1");
            checkSchedule(cp1, "CP1", startTime, startTime + (5 * interval), interval, [1, 2, 3, 4], [startTime, startTime + interval, startTime + (2 * interval), startTime + (4 * interval)], [1, 1, 2, 1]);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor3, 0)).toNumber(), 0);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor3, 1)).toNumber(), 0);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor3, 2)).toNumber(), 0);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor3, 3)).toNumber(), web3.utils.toWei('1', 'ether'));
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor3, 4)).toNumber(), web3.utils.toWei('1.5', 'ether'));

            assert.equal((await I_SecurityToken.balanceOfAt(account_investor2, 0)).toNumber(), 0);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor2, 1)).toNumber(), 0);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor2, 2)).toNumber(), web3.utils.toWei('1', 'ether'));
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor2, 3)).toNumber(), web3.utils.toWei('1', 'ether'));
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor2, 4)).toNumber(), web3.utils.toWei('1', 'ether'));

            assert.equal((await I_SecurityToken.balanceOfAt(account_investor1, 0)).toNumber(), 0);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor1, 1)).toNumber(), 0);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor1, 2)).toNumber(), web3.utils.toWei('1', 'ether'));
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor1, 3)).toNumber(), web3.utils.toWei('1', 'ether'));
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor1, 4)).toNumber(), web3.utils.toWei('0.5', 'ether'));

        });

        it("Should get the permission", async() => {
            let perm = await I_ScheduledCheckpoint.getPermissions.call();
            assert.equal(perm.length, 0);
        });

    });

});

function checkSchedule(schedule, name, startTime, nextTime, interval, checkpoints, timestamps, periods) {
    assert.equal(web3.utils.toAscii(schedule[0]).replace(/\u0000/g, ''), name);
    assert.equal(schedule[1].toNumber(), startTime);
    assert.equal(schedule[2].toNumber(), nextTime);
    assert.equal(schedule[3].toNumber(), interval);
    assert.equal(schedule[4].length, checkpoints.length);
    for (let i = 0; i < checkpoints.length; i++) {
        assert.equal(schedule[4][i].toNumber(), checkpoints[i]);
    }
    assert.equal(schedule[5].length, timestamps.length);
    for (let i = 0; i < timestamps.length; i++) {
        assert.equal(schedule[5][i].toNumber(), timestamps[i]);
    }
    assert.equal(schedule[6].length, periods.length);
    for (let i = 0; i < periods.length; i++) {
        assert.equal(schedule[6][i].toNumber(), periods[i]);
    }
}
