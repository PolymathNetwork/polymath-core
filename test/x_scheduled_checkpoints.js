import latestTime from "./helpers/latestTime";
import { duration, promisifyLogWatch, latestBlock } from "./helpers/utils";
import takeSnapshot, { increaseTime, revertToSnapshot } from "./helpers/time";
import { encodeProxyCall, encodeModuleCall } from "./helpers/encodeCall";
import { setUpPolymathNetwork, deployScheduleCheckpointAndVerified } from "./helpers/createInstances";

const SecurityToken = artifacts.require("./SecurityToken.sol");
const GeneralTransferManager = artifacts.require("./GeneralTransferManager");
const ScheduledCheckpoint = artifacts.require("./ScheduledCheckpoint.sol");

const Web3 = require("web3");
let BN = Web3.utils.BN;
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port

contract("ScheduledCheckpoint", async (accounts) => {
    // Accounts Variable declaration
    let account_polymath;
    let account_issuer;
    let token_owner;
    let account_investor1;
    let account_investor2;
    let account_investor3;
    let account_investor4;

    let message = "Transaction Should Fail!";

    // Contract Instance Declaration
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
    let I_STRGetter;

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
    const initRegFee = new BN(web3.utils.toWei("1000"));

    let currentTime;
    const address_zero = "0x0000000000000000000000000000000000000000";
    const one_address = "0x0000000000000000000000000000000000000001";

    before(async () => {
        currentTime = new BN(await latestTime());
        account_polymath = accounts[0];
        account_issuer = accounts[1];

        token_owner = account_issuer;

        account_investor1 = accounts[7];
        account_investor2 = accounts[8];
        account_investor3 = accounts[9];

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
            I_STRGetter
        ] = instances;

        // STEP 2: Deploy the ScheduleCheckpointModule
        [I_ScheduledCheckpointFactory] = await deployScheduleCheckpointAndVerified(account_polymath, I_MRProxied, 0);

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

    describe("Generate the SecurityToken", async () => {
        it("Should register the ticker before the generation of the security token", async () => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner });
            let tx = await I_STRProxied.registerTicker(token_owner, symbol, contact, { from: token_owner });
            assert.equal(tx.logs[0].args._owner, token_owner);
            assert.equal(tx.logs[0].args._ticker, symbol.toUpperCase());
        });

        it("Should generate the new security token with the same symbol as registered above", async () => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner });

            let tx = await I_STRProxied.generateSecurityToken(name, symbol, tokenDetails, false, { from: token_owner });

            // Verify the successful generation of the security token
            assert.equal(tx.logs[2].args._ticker, symbol.toUpperCase(), "SecurityToken doesn't get deployed");

            I_SecurityToken = await SecurityToken.at(tx.logs[2].args._securityTokenAddress);

            const log = (await I_SecurityToken.getPastEvents('ModuleAdded', {filter: {transactionHash: tx.transactionHash}}))[0];

            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._types[0].toNumber(), 2);
            assert.equal(web3.utils.toAscii(log.args._name).replace(/\u0000/g, ""), "GeneralTransferManager");
        });

        it("Should intialize the auto attached modules", async () => {
            let moduleData = (await I_SecurityToken.getModulesByType(2))[0];
            I_GeneralTransferManager = await GeneralTransferManager.at(moduleData);
        });
    });

    describe("Buy tokens using on-chain whitelist", async () => {
        it("Should successfully attach the ScheduledCheckpoint with the security token", async () => {
            await I_SecurityToken.changeGranularity(1, { from: token_owner });
            const tx = await I_SecurityToken.addModule(I_ScheduledCheckpointFactory.address, "0x0", new BN(0), new BN(0), { from: token_owner });
            assert.equal(tx.logs[2].args._types[0].toNumber(), 4, "ScheduledCheckpoint doesn't get deployed");
            assert.equal(tx.logs[2].args._types[1].toNumber(), 2, "ScheduledCheckpoint doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name).replace(/\u0000/g, ""),
                "ScheduledCheckpoint",
                "ScheduledCheckpoint module was not added"
            );
            I_ScheduledCheckpoint = await ScheduledCheckpoint.at(tx.logs[2].args._module);
        });

        let startTime;
        let interval;
        it("Should create a daily checkpoint", async () => {
            startTime = await latestTime() + 100;
            interval = 24 * 60 * 60;
            console.log("Creating scheduled CP: " + startTime, interval);
            await I_ScheduledCheckpoint.addSchedule(web3.utils.fromAscii("CP1"), startTime, interval, { from: token_owner });
            console.log("2: " + await latestTime());
        });

        it("Remove (temp) daily checkpoint", async () => {
            let snap_Id = await takeSnapshot();
            await I_ScheduledCheckpoint.removeSchedule(web3.utils.fromAscii("CP1"), { from: token_owner });
            await revertToSnapshot(snap_Id);
        });

        it("Should Buy the tokens for account_investor1", async () => {
            // Add the Investor in to the whitelist
            console.log("3: " + await latestTime());

            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_investor1,
                currentTime,
                currentTime,
                currentTime.add(new BN(duration.days(10))),
                true,
                false,
                {
                    from: account_issuer,
                    gas: 6000000
                }
            );

            assert.equal(
                tx.logs[0].args._investor.toLowerCase(),
                account_investor1.toLowerCase(),
                "Failed in adding the investor in whitelist"
            );

            // Jump time
            console.log("4: " + await latestTime());

            await increaseTime(5000);
            // We should be after the first scheduled checkpoint, and before the second
            console.log("5: " + await latestTime());

            assert.isTrue(await latestTime() > startTime);
            assert.isTrue(await latestTime() <= startTime + interval);
            console.log("6: " + await latestTime());

            // Mint some tokens
            await I_SecurityToken.mint(account_investor1, new BN(web3.utils.toWei("1", "ether")), { from: token_owner });

            assert.equal((await I_SecurityToken.balanceOf(account_investor1)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
        });

        it("Should have checkpoint created with correct balances", async () => {
            let cp1 = await I_ScheduledCheckpoint.getSchedule(web3.utils.fromAscii("CP1"));
            checkSchedule(cp1, "CP1", startTime, startTime + interval, interval, [1], [startTime], [1]);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor1, 0)).toNumber(), 0);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor1, 1)).toNumber(), 0);
        });

        it("Should Buy some more tokens for account_investor2", async () => {
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_investor2,
                currentTime,
                currentTime,
                currentTime.add(new BN(duration.days(10))),
                true,
                false,
                {
                    from: account_issuer,
                    gas: 6000000
                }
            );

            assert.equal(
                tx.logs[0].args._investor.toLowerCase(),
                account_investor2.toLowerCase(),
                "Failed in adding the investor in whitelist"
            );

            // We should be after the first scheduled checkpoint, and before the second
            assert.isTrue(await latestTime() > startTime);
            assert.isTrue(await latestTime() <= startTime + interval);

            // Mint some tokens
            await I_SecurityToken.mint(account_investor2, new BN(web3.utils.toWei("1", "ether")), { from: token_owner });

            assert.equal((await I_SecurityToken.balanceOf(account_investor2)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
        });

        it("No additional checkpoints created", async () => {
            let cp1 = await I_ScheduledCheckpoint.getSchedule(web3.utils.fromAscii("CP1"));
            checkSchedule(cp1, "CP1", startTime, startTime + interval, interval, [1], [startTime], [1]);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor2, 0)).toNumber(), 0);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor2, 1)).toNumber(), 0);
        });

        it("Add a new token holder - account_investor3", async () => {
            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_investor3,
                currentTime,
                currentTime,
                currentTime.add(new BN(duration.days(10))),
                true,
                false,
                {
                    from: account_issuer,
                    gas: 6000000
                }
            );

            assert.equal(
                tx.logs[0].args._investor.toLowerCase(),
                account_investor3.toLowerCase(),
                "Failed in adding the investor in whitelist"
            );

            // Jump time
            await increaseTime(interval);
            // We should be after the first scheduled checkpoint, and before the second
            assert.isTrue(await latestTime() > startTime + interval);
            assert.isTrue(await latestTime() <= startTime + 2 * interval);

            // Add the Investor in to the whitelist
            // Mint some tokens
            await I_SecurityToken.mint(account_investor3, new BN(web3.utils.toWei("1", "ether")), { from: token_owner });

            assert.equal((await I_SecurityToken.balanceOf(account_investor3)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
        });

        it("Should have new checkpoint created with correct balances", async () => {
            let cp1 = await I_ScheduledCheckpoint.getSchedule(web3.utils.fromAscii("CP1"));
            checkSchedule(cp1, "CP1", startTime, startTime + 2 * interval, interval, [1, 2], [startTime, startTime + interval], [1, 1]);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor3, 0)).toNumber(), 0);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor3, 1)).toNumber(), 0);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor3, 2)).toNumber(), 0);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor2, 0)).toNumber(), 0);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor2, 1)).toNumber(), 0);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor2, 2)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor1, 0)).toNumber(), 0);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor1, 1)).toNumber(), 0);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor1, 2)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
        });

        it("Should have correct balances for investor 3 after new checkpoint", async () => {
            // Jump time
            await increaseTime(2 * interval);
            // We should be after the first scheduled checkpoint, and before the second
            assert.isTrue(await latestTime() > startTime + 3 * interval);
            assert.isTrue(await latestTime() <= startTime + 4 * interval);
            await I_SecurityToken.transfer(account_investor3, new BN(web3.utils.toWei("0.5", "ether")), { from: account_investor1 });
            let cp1 = await I_ScheduledCheckpoint.getSchedule(web3.utils.fromAscii("CP1"));
            checkSchedule(
                cp1,
                "CP1",
                startTime,
                startTime + 4 * interval,
                interval,
                [1, 2, 3],
                [startTime, startTime + interval, startTime + 2 * interval],
                [1, 1, 2]
            );
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor3, 0)).toNumber(), 0);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor3, 1)).toNumber(), 0);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor3, 2)).toNumber(), 0);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor3, 3)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());

            assert.equal((await I_SecurityToken.balanceOfAt(account_investor2, 0)).toNumber(), 0);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor2, 1)).toNumber(), 0);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor2, 2)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor2, 3)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());

            assert.equal((await I_SecurityToken.balanceOfAt(account_investor1, 0)).toNumber(), 0);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor1, 1)).toNumber(), 0);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor1, 2)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor1, 3)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
        });

        it("Manually update checkpoints", async () => {
            await increaseTime(interval);
            await I_ScheduledCheckpoint.updateAll({ from: token_owner });

            let cp1 = await I_ScheduledCheckpoint.getSchedule(web3.utils.fromAscii("CP1"));
            checkSchedule(
                cp1,
                "CP1",
                startTime,
                startTime + 5 * interval,
                interval,
                [1, 2, 3, 4],
                [startTime, startTime + interval, startTime + 2 * interval, startTime + 4 * interval],
                [1, 1, 2, 1]
            );
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor3, 0)).toNumber(), 0);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor3, 1)).toNumber(), 0);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor3, 2)).toNumber(), 0);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor3, 3)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor3, 4)).toString(), new BN(web3.utils.toWei("1.5", "ether")).toString());

            assert.equal((await I_SecurityToken.balanceOfAt(account_investor2, 0)).toNumber(), 0);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor2, 1)).toNumber(), 0);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor2, 2)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor2, 3)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor2, 4)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());

            assert.equal((await I_SecurityToken.balanceOfAt(account_investor1, 0)).toNumber(), 0);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor1, 1)).toNumber(), 0);
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor1, 2)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor1, 3)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
            assert.equal((await I_SecurityToken.balanceOfAt(account_investor1, 4)).toString(), new BN(web3.utils.toWei("0.5", "ether")).toString());
        });

        it("Should get the permission", async () => {
            let perm = await I_ScheduledCheckpoint.getPermissions.call();
            assert.equal(perm.length, 0);
        });
    });
});

function checkSchedule(schedule, name, startTime, nextTime, interval, checkpoints, timestamps, periods) {
    assert.equal(web3.utils.toAscii(schedule[0]).replace(/\u0000/g, ""), name);
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
