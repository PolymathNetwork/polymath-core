import latestTime from './helpers/latestTime';
import { duration, promisifyLogWatch, latestBlock } from './helpers/utils';
import takeSnapshot, { increaseTime, revertToSnapshot } from './helpers/time';
import { encodeProxyCall, encodeModuleCall } from './helpers/encodeCall';
import { setUpPolymathNetwork, deployScheduleCheckpointAndVerified } from "./helpers/createInstances";

const SecurityToken = artifacts.require('./SecurityToken.sol');
const GeneralTransferManager = artifacts.require('./GeneralTransferManager');
const ScheduledCheckpoint = artifacts.require('./ScheduledCheckpoint.sol');


const Web3 = require('web3');
const BigNumber = require('bignumber.js');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")) // Hardcoded development port

contract('ScheduledCheckpoint', accounts => {

    const SECONDS = 0;
    const MONTHS = 1;
    const YEARS = 2;

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

    before(async() => {
        // Accounts setup
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
            I_STRProxied
        ] = instances;

        // STEP 2: Deploy the ScheduleCheckpointModule
        [I_ScheduledCheckpointFactory] = await deployScheduleCheckpointAndVerified(account_polymath, I_MRProxied, I_PolyToken.address, 0);

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

        let startTime;
        let interval;
        let timeUnit = SECONDS;
        it("Should create a daily checkpoint", async () => {
            startTime = latestTime() + 100;
            interval = 24 * 60 * 60;
            console.log("Creating scheduled CP: " + startTime, interval);
            await I_ScheduledCheckpoint.addSchedule("CP1", startTime, interval, timeUnit, {from: token_owner});
            console.log("2: " + latestTime());
        });

        it("Remove (temp) daily checkpoint", async () => {
            let snap_Id = await takeSnapshot();
            await I_ScheduledCheckpoint.removeSchedule("CP1", {from: token_owner});
            await revertToSnapshot(snap_Id);
        });

        it("Should Buy the tokens for account_investor1", async() => {
            // Add the Investor in to the whitelist
            console.log("3: " + latestTime());

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
            console.log("4: " + latestTime());

            await increaseTime(5000);
            // We should be after the first scheduled checkpoint, and before the second
            console.log("5: " + latestTime());

            assert.isTrue(latestTime() > startTime);
            assert.isTrue(latestTime() <= startTime + interval);
            console.log("6: " + latestTime());

            // Mint some tokens
            await I_SecurityToken.mint(account_investor1, web3.utils.toWei('1', 'ether'), { from: token_owner });

            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor1)).toNumber(),
                web3.utils.toWei('1', 'ether')
            );
        });

        it("Should have checkpoint created with correct balances", async() => {
            let cp1 = await I_ScheduledCheckpoint.getSchedule("CP1");
            checkSchedule(cp1, "CP1", startTime, startTime + interval, interval, timeUnit, [1], [startTime], [1]);
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
            checkSchedule(cp1, "CP1", startTime, startTime + interval, interval, timeUnit, [1], [startTime], [1]);
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
            checkSchedule(cp1, "CP1", startTime, startTime + (2 * interval), interval, timeUnit, [1, 2], [startTime, startTime + interval], [1, 1]);
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
            checkSchedule(cp1, "CP1", startTime, startTime + (4 * interval), interval, timeUnit, [1, 2, 3], [startTime, startTime + interval, startTime + (2 * interval)], [1, 1, 2]);
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
            checkSchedule(cp1, "CP1", startTime, startTime + (5 * interval), interval, timeUnit, [1, 2, 3, 4], [startTime, startTime + interval, startTime + (2 * interval), startTime + (4 * interval)], [1, 1, 2, 1]);
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

        it("Remove daily checkpoint", async () => {
            await I_ScheduledCheckpoint.removeSchedule("CP1", {from: token_owner});
        });

    });

    describe("Tests for monthly scheduled checkpoints", async() => {

        let name = "CP-M-1";
        let startTime;
        let interval = 5;
        let timeUnit = MONTHS;

        it("Should create a monthly checkpoint", async () => {
            startTime = latestTime() + 100;
            let tx = await I_ScheduledCheckpoint.addSchedule(name, startTime, interval, timeUnit, {from: token_owner});
            checkScheduleLog(tx.logs[0], name, startTime, interval, timeUnit);
        });

        it("Check one monthly checkpoint", async() => {
            await increaseTime(100);
            await I_ScheduledCheckpoint.updateAll({from: token_owner});

            let schedule = await I_ScheduledCheckpoint.getSchedule(name);
            let checkpoints = [5];
            let timestamps = [startTime];
            let periods = [1];
            checkSchedule(schedule, name, startTime, addMonths(startTime, interval), interval, timeUnit, checkpoints, timestamps, periods);
        });

        it("Check two monthly checkpoints", async() => {
            await increaseTime(duration.days(31 * interval));
            await I_ScheduledCheckpoint.updateAll({from: token_owner});

            let schedule = await I_ScheduledCheckpoint.getSchedule(name);
            let checkpoints = [5, 6];
            let timestamps = [startTime, addMonths(startTime, interval)];
            let periods = [1, 1];
            checkSchedule(schedule, name, startTime, addMonths(startTime, interval * 2), interval, timeUnit, checkpoints, timestamps, periods);
        });

        it("Check three monthly checkpoints", async() => {
            await increaseTime(duration.days(31 * interval * 2));
            await I_ScheduledCheckpoint.updateAll({from: token_owner});

            let schedule = await I_ScheduledCheckpoint.getSchedule(name);
            let checkpoints = [5, 6, 7];
            let timestamps = [startTime, addMonths(startTime, interval), addMonths(startTime, interval * 2)];
            let periods = [1, 1, 2];
            checkSchedule(schedule, name, startTime, addMonths(startTime, interval * 4), interval, timeUnit, checkpoints, timestamps, periods);
        });

        it("Check four monthly checkpoints", async() => {
            await increaseTime(duration.days(31 * interval));
            await I_ScheduledCheckpoint.updateAll({from: token_owner});

            let schedule = await I_ScheduledCheckpoint.getSchedule(name);
            let checkpoints = [5, 6, 7, 8];
            let timestamps = [startTime, addMonths(startTime, interval), addMonths(startTime, interval * 2), addMonths(startTime, interval * 4)];
            let periods = [1, 1, 2, 1];
            checkSchedule(schedule, name, startTime, addMonths(startTime, interval * 5), interval, timeUnit, checkpoints, timestamps, periods);
        });

        it("Check five monthly checkpoints", async() => {
            await increaseTime(duration.days(31 * interval * 3));
            await I_ScheduledCheckpoint.updateAll({from: token_owner});

            let schedule = await I_ScheduledCheckpoint.getSchedule(name);
            let checkpoints = [5, 6, 7, 8, 9];
            let timestamps = [startTime, addMonths(startTime, interval), addMonths(startTime, interval * 2), addMonths(startTime, interval * 4), addMonths(startTime, interval * 5)];
            let periods = [1, 1, 2, 1, 3];
            checkSchedule(schedule, name, startTime, addMonths(startTime, interval * 8), interval, timeUnit, checkpoints, timestamps, periods);
        });

        it("Remove monthly checkpoint", async () => {
            await I_ScheduledCheckpoint.removeSchedule(name, {from: token_owner});
        });

    });

    describe("Tests for yearly scheduled checkpoints", async() => {

        let name = "CP-Y-1";
        let startTime;
        let interval = 3;
        let timeUnit = YEARS;

        it("Should create a yearly checkpoint", async () => {
            startTime = latestTime() + 100;

            let tx = await I_ScheduledCheckpoint.addSchedule(name, startTime, interval, timeUnit, {from: token_owner});
            checkScheduleLog(tx.logs[0], name, startTime, interval, timeUnit);
        });

        it("Check one yearly checkpoint", async() => {
            await increaseTime(100);
            await I_ScheduledCheckpoint.updateAll({from: token_owner});

            let schedule = await I_ScheduledCheckpoint.getSchedule(name);
            let checkpoints = [10];
            let timestamps = [startTime];
            let periods = [1];
            checkSchedule(schedule, name, startTime, addYears(startTime, interval), interval, timeUnit, checkpoints, timestamps, periods);
        });

        it("Check two yearly checkpoints", async() => {
            await increaseTime(duration.days(366 * interval));
            await I_ScheduledCheckpoint.updateAll({from: token_owner});

            let schedule = await I_ScheduledCheckpoint.getSchedule(name);
            let checkpoints = [10, 11];
            let timestamps = [startTime, addYears(startTime, interval)];
            let periods = [1, 1];
            checkSchedule(schedule, name, startTime, addYears(startTime, interval * 2), interval, timeUnit, checkpoints, timestamps, periods);
        });

        it("Check three yearly checkpoints", async() => {
            await increaseTime(duration.days(366 * interval * 2));
            await I_ScheduledCheckpoint.updateAll({from: token_owner});

            let schedule = await I_ScheduledCheckpoint.getSchedule(name);
            let checkpoints = [10, 11, 12];
            let timestamps = [startTime, addYears(startTime, interval), addYears(startTime, interval * 2)];
            let periods = [1, 1, 2];
            checkSchedule(schedule, name, startTime, addYears(startTime, interval * 4), interval, timeUnit, checkpoints, timestamps, periods);
        });

        it("Check four yearly checkpoints", async() => {
            await increaseTime(duration.days(366 * interval));
            await I_ScheduledCheckpoint.updateAll({from: token_owner});

            let schedule = await I_ScheduledCheckpoint.getSchedule(name);
            let checkpoints = [10, 11, 12, 13];
            let timestamps = [startTime, addYears(startTime, interval), addYears(startTime, interval * 2), addYears(startTime, interval * 4)];
            let periods = [1, 1, 2, 1];
            checkSchedule(schedule, name, startTime, addYears(startTime, interval * 5), interval, timeUnit, checkpoints, timestamps, periods);
        });

        it("Check five yearly checkpoints", async() => {
            await increaseTime(duration.days(366 * interval * 3));
            await I_ScheduledCheckpoint.updateAll({from: token_owner});

            let schedule = await I_ScheduledCheckpoint.getSchedule(name);
            let checkpoints = [10, 11, 12, 13, 14];
            let timestamps = [startTime, addYears(startTime, interval), addYears(startTime, interval * 2), addYears(startTime, interval * 4), addYears(startTime, interval * 5)];
            let periods = [1, 1, 2, 1, 3];
            checkSchedule(schedule, name, startTime, addYears(startTime, interval * 8), interval, timeUnit, checkpoints, timestamps, periods);
        });

        it("Remove monthly checkpoint", async () => {
            await I_ScheduledCheckpoint.removeSchedule(name, {from: token_owner});
        });

    });

    describe("Tests for monthly (last day of month) scheduled checkpoints", async() => {
        let name = "CP-M-2";
        let previousTime;
        let startTime;
        let interval = 1;
        let timeUnit = MONTHS;

        it("Should create a monthly (last day of month) checkpoint", async () => {
            previousTime = latestTime();

            let startDate = new Date(previousTime * 1000);
            startDate.setUTCMonth(11, 31);
            startTime = startDate.getTime() / 1000;
            console.log("previousTime:" + previousTime);
            console.log("startTime:" + startTime);
            console.log("startDate:" + startDate.toDateString());

            let tx = await I_ScheduledCheckpoint.addSchedule(name, startTime, interval, timeUnit, {from: token_owner});
            checkScheduleLog(tx.logs[0], name, startTime, interval, timeUnit);
        });

        it("Check one monthly (last day of month) checkpoint", async() => {
            await increaseTime(startTime - previousTime + 100);
            await I_ScheduledCheckpoint.updateAll({from: token_owner});

            let schedule = await I_ScheduledCheckpoint.getSchedule(name);
            let checkpoints = [15];
            let timestamps = [startTime];
            let periods = [1];
            checkSchedule(schedule, name, startTime, addMonths(startTime, interval), interval, timeUnit, checkpoints, timestamps, periods);
        });

        it("Check two monthly checkpoints", async() => {
            await increaseTime(duration.days(31 * interval));
            await I_ScheduledCheckpoint.updateAll({from: token_owner});

            let schedule = await I_ScheduledCheckpoint.getSchedule(name);
            let checkpoints = [15, 16];
            let timestamps = [startTime, addMonths(startTime, interval)];
            let periods = [1, 1];
            checkSchedule(schedule, name, startTime, addMonths(startTime, interval * 2), interval, timeUnit, checkpoints, timestamps, periods);
        });

        it("Check three monthly checkpoints", async() => {
            await increaseTime(duration.days(31 * interval));
            await I_ScheduledCheckpoint.updateAll({from: token_owner});

            let schedule = await I_ScheduledCheckpoint.getSchedule(name);
            let checkpoints = [15, 16, 17];
            let timestamps = [startTime, addMonths(startTime, interval), addMonths(startTime, interval * 2)];
            let periods = [1, 1, 1];
            checkSchedule(schedule, name, startTime, addMonths(startTime, interval * 3), interval, timeUnit, checkpoints, timestamps, periods);
        });

    });

});

function addMonths(timestamp, months) {
    let time = new Date(timestamp * 1000);
    return time.setUTCMonth(time.getUTCMonth() + months) / 1000;
}

function addYears(timestamp, years) {
    let time = new Date(timestamp * 1000);
    return time.setUTCFullYear(time.getUTCFullYear() + years) / 1000;
}

function checkScheduleLog(log, name, startTime, interval, timeUnit) {
    assert.equal(web3.utils.hexToUtf8(log.args._name), name);
    assert.equal(log.args._startTime.toNumber(), startTime);
    assert.equal(log.args._interval.toNumber(), interval);
    assert.equal(log.args._timeUint.toNumber(), timeUnit);
}

function checkSchedule(schedule, name, startTime, nextTime, interval, timeUnit, checkpoints, timestamps, periods) {
    assert.equal(web3.utils.toAscii(schedule[0]).replace(/\u0000/g, ''), name);
    assert.equal(schedule[1].toNumber(), startTime);
    assert.equal(schedule[2].toNumber(), nextTime);
    assert.equal(schedule[3].toNumber(), interval);
    assert.equal(schedule[4].toNumber(), timeUnit);
    assert.equal(schedule[5].length, checkpoints.length);
    for (let i = 0; i < checkpoints.length; i++) {
        assert.equal(schedule[5][i].toNumber(), checkpoints[i]);
    }
    assert.equal(schedule[6].length, timestamps.length);
    for (let i = 0; i < timestamps.length; i++) {
        assert.equal(schedule[6][i].toNumber(), timestamps[i]);
    }
    assert.equal(schedule[7].length, periods.length);
    for (let i = 0; i < periods.length; i++) {
        assert.equal(schedule[7][i].toNumber(), periods[i]);
    }
}
