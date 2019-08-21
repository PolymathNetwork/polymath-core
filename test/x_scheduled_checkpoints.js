import latestTime from "./helpers/latestTime";
import { duration, promisifyLogWatch, latestBlock } from "./helpers/utils";
import { takeSnapshot, increaseTime, revertToSnapshot, jumpToTime } from "./helpers/time";
import { encodeProxyCall, encodeModuleCall } from "./helpers/encodeCall";
import { setUpPolymathNetwork, deployScheduleCheckpointAndVerified } from "./helpers/createInstances";

const SecurityToken = artifacts.require("./SecurityToken.sol");
const GeneralTransferManager = artifacts.require("./GeneralTransferManager");
const ScheduledCheckpoint = artifacts.require("./ScheduledCheckpoint.sol");
const STGetter = artifacts.require("./STGetter.sol")

const Web3 = require("web3");
let BN = Web3.utils.BN;
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port

contract("ScheduledCheckpoint", async (accounts) => {

    const SECONDS = 0;
    const DAYS = 1;
    const WEEKS = 2;
    const MONTHS = 3;
    const YEARS = 4;

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
    let I_STGetter;
    let stGetter;

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
        account_polymath = accounts[0];
        account_issuer = accounts[1];

        token_owner = account_issuer;

        account_investor1 = accounts[7];
        account_investor2 = accounts[8];
        account_investor3 = accounts[9];
        //await jumpToTime(Math.floor((new Date().getTime())/1000));
        await jumpToTime(1553040000); // 03/20/2019 @ 12:00am (UTC)
        currentTime = new BN(await latestTime());

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
            I_STRGetter,
            I_STGetter
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
            let tx = await I_STRProxied.registerNewTicker(token_owner, symbol, { from: token_owner });
            assert.equal(tx.logs[0].args._owner, token_owner);
            assert.equal(tx.logs[0].args._ticker, symbol.toUpperCase());
        });

        it("Should generate the new security token with the same symbol as registered above", async () => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner });

            let tx = await I_STRProxied.generateNewSecurityToken(name, symbol, tokenDetails, false, token_owner, 0, { from: token_owner });

            // Verify the successful generation of the security token
            assert.equal(tx.logs[1].args._ticker, symbol.toUpperCase(), "SecurityToken doesn't get deployed");

            I_SecurityToken = await SecurityToken.at(tx.logs[1].args._securityTokenAddress);
            stGetter = await STGetter.at(I_SecurityToken.address);
            assert.equal(await stGetter.getTreasuryWallet.call(), token_owner, "Incorrect wallet set");
            const log = (await I_SecurityToken.getPastEvents('ModuleAdded', {filter: {transactionHash: tx.transactionHash}}))[0];

            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._types[0].toString(), 2);
            assert.equal(web3.utils.toAscii(log.args._name).replace(/\u0000/g, ""), "GeneralTransferManager");
        });

        it("Should initialize the auto attached modules", async () => {
            let moduleData = (await stGetter.getModulesByType(2))[0];
            I_GeneralTransferManager = await GeneralTransferManager.at(moduleData);
        });
    });

    describe("Buy tokens using on-chain whitelist", async () => {
        it("Should successfully attach the ScheduledCheckpoint with the security token", async () => {
            await I_SecurityToken.changeGranularity(1, { from: token_owner });
            const tx = await I_SecurityToken.addModule(I_ScheduledCheckpointFactory.address, "0x0", new BN(0), new BN(0), false, { from: token_owner });
            assert.equal(tx.logs[2].args._types[0].toString(), 4, "ScheduledCheckpoint doesn't get deployed");
            assert.equal(tx.logs[2].args._types[1].toString(), 2, "ScheduledCheckpoint doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name).replace(/\u0000/g, ""),
                "ScheduledCheckpoint",
                "ScheduledCheckpoint module was not added"
            );
            I_ScheduledCheckpoint = await ScheduledCheckpoint.at(tx.logs[2].args._module);
        });

        let startTime;
        let interval;
        let timeUnit = SECONDS;
        it("Should create a daily checkpoint", async () => {
            startTime = await latestTime() + 100;
            interval = 24 * 60 * 60;
            console.log("Creating scheduled CP: " + startTime, interval);
            await I_ScheduledCheckpoint.addSchedule(web3.utils.fromAscii("CP1"), startTime, interval, timeUnit, { from: token_owner });
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

            let tx = await I_GeneralTransferManager.modifyKYCData(
                account_investor1,
                currentTime,
                currentTime,
                currentTime.add(new BN(duration.days(10))),
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
            await I_SecurityToken.issue(account_investor1, new BN(web3.utils.toWei("1", "ether")), "0x0", { from: token_owner });

            assert.equal((await I_SecurityToken.balanceOf(account_investor1)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
        });

        it("Should have checkpoint created with correct balances", async () => {
            let cp1 = await I_ScheduledCheckpoint.getSchedule(web3.utils.fromAscii("CP1"));
            checkSchedule(cp1, web3.utils.fromAscii("CP1"), startTime, startTime + interval, interval, timeUnit, [1], [startTime], [1]);
            assert.equal((await stGetter.balanceOfAt(account_investor1, 0)).toString(), 0);
            assert.equal((await stGetter.balanceOfAt(account_investor1, 1)).toString(), 0);
        });

        it("Should Buy some more tokens for account_investor2", async () => {
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyKYCData(
                account_investor2,
                currentTime,
                currentTime,
                currentTime.add(new BN(duration.days(10))),
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
            await I_SecurityToken.issue(account_investor2, new BN(web3.utils.toWei("1", "ether")), "0x0", { from: token_owner });

            assert.equal((await I_SecurityToken.balanceOf(account_investor2)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
        });

        it("No additional checkpoints created", async () => {
            let cp1 = await I_ScheduledCheckpoint.getSchedule(web3.utils.fromAscii("CP1"));
            checkSchedule(cp1, web3.utils.fromAscii("CP1"), startTime, startTime + interval, interval, timeUnit, [1], [startTime], [1]);
            assert.equal((await stGetter.balanceOfAt(account_investor2, 0)).toString(), 0);
            assert.equal((await stGetter.balanceOfAt(account_investor2, 1)).toString(), 0);
        });

        it("Add a new token holder - account_investor3", async () => {
            let tx = await I_GeneralTransferManager.modifyKYCData(
                account_investor3,
                currentTime,
                currentTime,
                currentTime.add(new BN(duration.days(10))),
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
            await I_SecurityToken.issue(account_investor3, new BN(web3.utils.toWei("1", "ether")), "0x0", { from: token_owner });

            assert.equal((await I_SecurityToken.balanceOf(account_investor3)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
        });

        it("Should have new checkpoint created with correct balances", async () => {
            let cp1 = await I_ScheduledCheckpoint.getSchedule(web3.utils.fromAscii("CP1"));
            checkSchedule(cp1, web3.utils.fromAscii("CP1"), startTime, startTime + 2 * interval, interval, timeUnit, [1, 2], [startTime, startTime + interval], [1, 1]);
            assert.equal((await stGetter.balanceOfAt(account_investor3, 0)).toString(), 0);
            assert.equal((await stGetter.balanceOfAt(account_investor3, 1)).toString(), 0);
            assert.equal((await stGetter.balanceOfAt(account_investor3, 2)).toString(), 0);
            assert.equal((await stGetter.balanceOfAt(account_investor2, 0)).toString(), 0);
            assert.equal((await stGetter.balanceOfAt(account_investor2, 1)).toString(), 0);
            assert.equal((await stGetter.balanceOfAt(account_investor2, 2)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
            assert.equal((await stGetter.balanceOfAt(account_investor1, 0)).toString(), 0);
            assert.equal((await stGetter.balanceOfAt(account_investor1, 1)).toString(), 0);
            assert.equal((await stGetter.balanceOfAt(account_investor1, 2)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
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
                web3.utils.fromAscii("CP1"),
                startTime,
                startTime + 4 * interval,
                interval,
                timeUnit,
                [1, 2, 3],
                [startTime, startTime + interval, startTime + 2 * interval],
                [1, 1, 2]
            );
            assert.equal((await stGetter.balanceOfAt(account_investor3, 0)).toString(), 0);
            assert.equal((await stGetter.balanceOfAt(account_investor3, 1)).toString(), 0);
            assert.equal((await stGetter.balanceOfAt(account_investor3, 2)).toString(), 0);
            assert.equal((await stGetter.balanceOfAt(account_investor3, 3)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());

            assert.equal((await stGetter.balanceOfAt(account_investor2, 0)).toString(), 0);
            assert.equal((await stGetter.balanceOfAt(account_investor2, 1)).toString(), 0);
            assert.equal((await stGetter.balanceOfAt(account_investor2, 2)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
            assert.equal((await stGetter.balanceOfAt(account_investor2, 3)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());

            assert.equal((await stGetter.balanceOfAt(account_investor1, 0)).toString(), 0);
            assert.equal((await stGetter.balanceOfAt(account_investor1, 1)).toString(), 0);
            assert.equal((await stGetter.balanceOfAt(account_investor1, 2)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
            assert.equal((await stGetter.balanceOfAt(account_investor1, 3)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
        });

        it("Manually update checkpoints", async () => {
            await increaseTime(interval);
            await I_ScheduledCheckpoint.updateAll({ from: token_owner });

            let cp1 = await I_ScheduledCheckpoint.getSchedule(web3.utils.fromAscii("CP1"));
            checkSchedule(
                cp1,
                web3.utils.fromAscii("CP1"),
                startTime,
                startTime + 5 * interval,
                interval,
                timeUnit,
                [1, 2, 3, 4],
                [startTime, startTime + interval, startTime + 2 * interval, startTime + 4 * interval],
                [1, 1, 2, 1]
            );
            assert.equal((await stGetter.balanceOfAt(account_investor3, 0)).toString(), 0);
            assert.equal((await stGetter.balanceOfAt(account_investor3, 1)).toString(), 0);
            assert.equal((await stGetter.balanceOfAt(account_investor3, 2)).toString(), 0);
            assert.equal((await stGetter.balanceOfAt(account_investor3, 3)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
            assert.equal((await stGetter.balanceOfAt(account_investor3, 4)).toString(), new BN(web3.utils.toWei("1.5", "ether")).toString());

            assert.equal((await stGetter.balanceOfAt(account_investor2, 0)).toString(), 0);
            assert.equal((await stGetter.balanceOfAt(account_investor2, 1)).toString(), 0);
            assert.equal((await stGetter.balanceOfAt(account_investor2, 2)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
            assert.equal((await stGetter.balanceOfAt(account_investor2, 3)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
            assert.equal((await stGetter.balanceOfAt(account_investor2, 4)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());

            assert.equal((await stGetter.balanceOfAt(account_investor1, 0)).toString(), 0);
            assert.equal((await stGetter.balanceOfAt(account_investor1, 1)).toString(), 0);
            assert.equal((await stGetter.balanceOfAt(account_investor1, 2)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
            assert.equal((await stGetter.balanceOfAt(account_investor1, 3)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
            assert.equal((await stGetter.balanceOfAt(account_investor1, 4)).toString(), new BN(web3.utils.toWei("0.5", "ether")).toString());
        });

        it("Should get the permission", async () => {
            let perm = await I_ScheduledCheckpoint.getPermissions.call();
            assert.equal(perm.length, 0);
        });

        it("Remove daily checkpoint", async () => {
            await I_ScheduledCheckpoint.removeSchedule(web3.utils.fromAscii("CP1"), {from: token_owner});
        });

    });

    describe("Tests for monthly scheduled checkpoints", async() => {

        let name = web3.utils.fromAscii("CP-M-1");
        let startTime;
        let interval = 5;
        let timeUnit = MONTHS;

        it("Should create a monthly checkpoint", async () => {
            startTime = new BN(await latestTime()).add(new BN(100));

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

        let name = web3.utils.fromAscii("CP-Y-1");
        let startTime;
        let interval = 3;
        let timeUnit = YEARS;

        it("Should create a yearly checkpoint", async () => {
            startTime = await latestTime() + 100;

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

    describe("Tests for monthly scheduled checkpoints -- end of month", async() => {
        let name = web3.utils.fromAscii("CP-M-2");
        let previousTime;
        let startDate;
        let startTime;
        let interval = 1;
        let timeUnit = MONTHS;

        it("Should create a monthly checkpoint -- December 31", async () => {
            previousTime = await latestTime();

            startDate = new Date(previousTime * 1000);
            startDate.setUTCMonth(11, 31);
            startTime = startDate.getTime() / 1000;
            console.log("previousTime:" + previousTime);
            console.log("startTime:" + startTime);
            console.log("startDate:" + startDate.toUTCString());

            let tx = await I_ScheduledCheckpoint.addSchedule(name, startTime, interval, timeUnit, {from: token_owner});
            checkScheduleLog(tx.logs[0], name, startTime, interval, timeUnit);
        });

        it("Check monthly checkpoint -- January 31", async() => {
            await increaseTime(startTime - previousTime + 100);
            await I_ScheduledCheckpoint.updateAll({from: token_owner});

            let schedule = await I_ScheduledCheckpoint.getSchedule(name);
            let checkpoints = [15];
            let nextTime = addMonths(startTime, interval);
            let timestamps = [startTime];
            let periods = [1];
            checkSchedule(schedule, name, startTime, nextTime, interval, timeUnit, checkpoints, timestamps, periods);
        });

        function getDaysInFebruary() {
            let days;
            if ((startDate.getUTCFullYear() + 1) % 4 === 0) {
                days = 29;
            } else {
                days = 28;
            }
            return days;
        }

        function getEndOfFebruary(startTime, days) {
            return setDate(addYears(startTime, 1), 1, days); //addMonths(startTime, interval * 2)
        }

        it("Check monthly checkpoints -- February 28/29", async() => {
            await increaseTime(duration.days(31 * interval));
            await I_ScheduledCheckpoint.updateAll({from: token_owner});

            let schedule = await I_ScheduledCheckpoint.getSchedule(name);
            let checkpoints = [15, 16];
            let days = getDaysInFebruary();
            let nextTime = getEndOfFebruary(startTime, days);
            let timestamps = [startTime, addMonths(startTime, interval)];
            let periods = [1, 1];
            checkSchedule(schedule, name, startTime, nextTime, interval, timeUnit, checkpoints, timestamps, periods);
        });

        it("Check monthly checkpoints -- March 31", async() => {
            let days = getDaysInFebruary();
            await increaseTime(duration.days(days * interval));
            await I_ScheduledCheckpoint.updateAll({from: token_owner});

            let schedule = await I_ScheduledCheckpoint.getSchedule(name);
            let checkpoints = [15, 16, 17];
            let nextTime = addMonths(startTime, interval * 3);
            let timestamps = [startTime, addMonths(startTime, interval), getEndOfFebruary(startTime, days)];
            let periods = [1, 1, 1];

            for (let i = 0; i < timestamps.length; i++) {
                assert.equal(schedule[6][i].toString(), timestamps[i]);
                console.log(new Date(schedule[6][i].toString() * 1000).toUTCString());
            }
            console.log("expected:" + new Date(nextTime * 1000).toUTCString());
            console.log("actual:" + new Date(schedule[2].toString() * 1000).toUTCString());
            checkSchedule(schedule, name, startTime, nextTime, interval, timeUnit, checkpoints, timestamps, periods);
        });

        it("Remove monthly checkpoint", async () => {
            await I_ScheduledCheckpoint.removeSchedule(name, {from: token_owner});
        });

    });

    describe("Tests for daily scheduled checkpoints", async() => {

        let name = web3.utils.fromAscii("CP-D-1");
        let startTime;
        let interval = 13;
        let timeUnit = DAYS;

        it("Should create a daily checkpoint", async () => {
            startTime = await latestTime() + 100;

            let tx = await I_ScheduledCheckpoint.addSchedule(name, startTime, interval, timeUnit, {from: token_owner});
            checkScheduleLog(tx.logs[0], name, startTime, interval, timeUnit);
        });

        it("Check one daily checkpoint", async() => {
            await increaseTime(100);
            await I_ScheduledCheckpoint.updateAll({from: token_owner});

            let schedule = await I_ScheduledCheckpoint.getSchedule(name);
            let checkpoints = [18];
            let timestamps = [startTime];
            let periods = [1];
            checkSchedule(schedule, name, startTime, addDays(startTime, interval), interval, timeUnit, checkpoints, timestamps, periods);
        });

        it("Check two daily checkpoints", async() => {
            await increaseTime(duration.days(interval));
            await I_ScheduledCheckpoint.updateAll({from: token_owner});

            let schedule = await I_ScheduledCheckpoint.getSchedule(name);
            let checkpoints = [18, 19];
            let timestamps = [startTime, addDays(startTime, interval)];
            let periods = [1, 1];
            checkSchedule(schedule, name, startTime, addDays(startTime, interval * 2), interval, timeUnit, checkpoints, timestamps, periods);
        });

        it("Check three daily checkpoints", async() => {
            await increaseTime(duration.days(interval * 2));
            await I_ScheduledCheckpoint.updateAll({from: token_owner});

            let schedule = await I_ScheduledCheckpoint.getSchedule(name);
            let checkpoints = [18, 19, 20];
            let timestamps = [startTime, addDays(startTime, interval), addDays(startTime, interval * 2)];
            let periods = [1, 1, 2];
            checkSchedule(schedule, name, startTime, addDays(startTime, interval * 4), interval, timeUnit, checkpoints, timestamps, periods);
        });

        it("Check four daily checkpoints", async() => {
            await increaseTime(duration.days(interval));
            await I_ScheduledCheckpoint.updateAll({from: token_owner});

            let schedule = await I_ScheduledCheckpoint.getSchedule(name);
            let checkpoints = [18, 19, 20, 21];
            let timestamps = [startTime, addDays(startTime, interval), addDays(startTime, interval * 2), addDays(startTime, interval * 4)];
            let periods = [1, 1, 2, 1];
            checkSchedule(schedule, name, startTime, addDays(startTime, interval * 5), interval, timeUnit, checkpoints, timestamps, periods);
        });

        it("Check five daily checkpoints", async() => {
            await increaseTime(duration.days(interval * 3));
            await I_ScheduledCheckpoint.updateAll({from: token_owner});

            let schedule = await I_ScheduledCheckpoint.getSchedule(name);
            let checkpoints = [18, 19, 20, 21, 22];
            let timestamps = [startTime, addDays(startTime, interval), addDays(startTime, interval * 2), addDays(startTime, interval * 4), addDays(startTime, interval * 5)];
            let periods = [1, 1, 2, 1, 3];
            checkSchedule(schedule, name, startTime, addDays(startTime, interval * 8), interval, timeUnit, checkpoints, timestamps, periods);
        });

        it("Remove daily checkpoint", async () => {
            await I_ScheduledCheckpoint.removeSchedule(name, {from: token_owner});
        });

    });

    describe("Tests for weekly scheduled checkpoints", async() => {

        let name = web3.utils.fromAscii("CP-M-1");
        let startTime;
        let interval = 9;
        let timeUnit = WEEKS;

        it("Should create a weekly checkpoint", async () => {
            startTime = await latestTime() + 100;

            let tx = await I_ScheduledCheckpoint.addSchedule(name, startTime, interval, timeUnit, {from: token_owner});
            checkScheduleLog(tx.logs[0], name, startTime, interval, timeUnit);
        });

        it("Check one weekly checkpoint", async() => {
            await increaseTime(100);
            await I_ScheduledCheckpoint.updateAll({from: token_owner});

            let schedule = await I_ScheduledCheckpoint.getSchedule(name);
            let checkpoints = [23];
            let timestamps = [startTime];
            let periods = [1];

            checkSchedule(schedule, name, startTime, addWeeks(startTime, interval), interval, timeUnit, checkpoints, timestamps, periods);
        });

        it("Check two weekly checkpoints", async() => {
            await increaseTime(duration.days(7 * interval));
            await I_ScheduledCheckpoint.updateAll({from: token_owner});

            let schedule = await I_ScheduledCheckpoint.getSchedule(name);
            let checkpoints = [23, 24];
            let timestamps = [startTime, addWeeks(startTime, interval)];
            let periods = [1, 1];
            checkSchedule(schedule, name, startTime, addWeeks(startTime, interval * 2), interval, timeUnit, checkpoints, timestamps, periods);
        });

        it("Check three weekly checkpoints", async() => {
            await increaseTime(duration.days(7 * interval * 2));
            await I_ScheduledCheckpoint.updateAll({from: token_owner});

            let schedule = await I_ScheduledCheckpoint.getSchedule(name);
            let checkpoints = [23, 24, 25];
            let timestamps = [startTime, addWeeks(startTime, interval), addWeeks(startTime, interval * 2)];
            let periods = [1, 1, 2];
            checkSchedule(schedule, name, startTime, addWeeks(startTime, interval * 4), interval, timeUnit, checkpoints, timestamps, periods);
        });

        it("Check four weekly checkpoints", async() => {
            await increaseTime(duration.days(7 * interval));
            await I_ScheduledCheckpoint.updateAll({from: token_owner});

            let schedule = await I_ScheduledCheckpoint.getSchedule(name);
            let checkpoints = [23, 24, 25, 26];
            let timestamps = [startTime, addWeeks(startTime, interval), addWeeks(startTime, interval * 2), addWeeks(startTime, interval * 4)];
            let periods = [1, 1, 2, 1];
            checkSchedule(schedule, name, startTime, addWeeks(startTime, interval * 5), interval, timeUnit, checkpoints, timestamps, periods);
        });

        it("Check five weekly checkpoints", async() => {
            await increaseTime(duration.days(7 * interval * 3));
            await I_ScheduledCheckpoint.updateAll({from: token_owner});

            let schedule = await I_ScheduledCheckpoint.getSchedule(name);
            let checkpoints = [23, 24, 25, 26, 27];
            let timestamps = [startTime, addWeeks(startTime, interval), addWeeks(startTime, interval * 2), addWeeks(startTime, interval * 4), addWeeks(startTime, interval * 5)];
            let periods = [1, 1, 2, 1, 3];
            checkSchedule(schedule, name, startTime, addWeeks(startTime, interval * 8), interval, timeUnit, checkpoints, timestamps, periods);
        });

        it("Remove weekly checkpoint", async () => {
            await I_ScheduledCheckpoint.removeSchedule(name, {from: token_owner});
        });

    });

});

function setDate(time, month, day) {
    let startDate = new Date(time * 1000);
    startDate.setUTCMonth(month, day);
    return startDate.getTime() / 1000;
}

function addDays(timestamp, days) {
    let time = new Date(timestamp * 1000);
    return time.setUTCDate(time.getUTCDate() + days) / 1000;
}

function addWeeks(timestamp, weeks) {
    return addDays(timestamp, weeks * 7);
}

function addMonths(timestamp, months) {
    let time = new Date(timestamp * 1000);
    return time.setUTCMonth(time.getUTCMonth() + months) / 1000;
}

function addYears(timestamp, years) {
    let time = new Date(timestamp * 1000);
    return time.setUTCFullYear(time.getUTCFullYear() + years) / 1000;
}

function checkScheduleLog(log, name, startTime, interval, timeUnit) {
    assert.equal(web3.utils.toAscii(log.args._name).replace(/\u0000/g, ""), web3.utils.toAscii(name));
    assert.equal(log.args._startTime.toString(), startTime.toString());
    assert.equal(log.args._interval.toString(), interval.toString());
    assert.equal(log.args._timeUint.toString(), timeUnit.toString());
}

function checkSchedule(schedule, name, startTime, nextTime, interval, timeUnit, checkpoints, timestamps, periods) {
    assert.equal(web3.utils.toAscii(schedule[0]).replace(/\u0000/g, ""), web3.utils.toAscii(name));
    assert.equal(schedule[1].toString(), startTime.toString());
    assert.equal(schedule[2].toString(), nextTime.toString());
    assert.equal(schedule[3].toString(), interval.toString());
    assert.equal(schedule[4].toString(), timeUnit.toString());
    assert.equal(schedule[5].length, checkpoints.length);
    for (let i = 0; i < checkpoints.length; i++) {
        assert.equal(schedule[5][i].toString(), checkpoints[i].toString());
    }
    assert.equal(schedule[6].length, timestamps.length);
    for (let i = 0; i < timestamps.length; i++) {
        assert.equal(schedule[6][i].toString(), timestamps[i].toString());
    }
    assert.equal(schedule[7].length, periods.length);
    let totalPeriods = 0;
    for (let i = 0; i < periods.length; i++) {
        assert.equal(schedule[7][i].toString(), periods[i].toString());
        totalPeriods += periods[i];
    }
    assert.equal(schedule[8].toString(), totalPeriods.toString());
}
