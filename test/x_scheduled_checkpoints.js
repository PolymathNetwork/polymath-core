import latestTime from "./helpers/latestTime";
import { duration } from "./helpers/utils";
import { takeSnapshot, increaseTime, revertToSnapshot } from "./helpers/time";
import { setUpPolymathNetwork, deployScheduleCheckpointAndVerified } from "./helpers/createInstances";
import { catchRevert } from "./helpers/exceptions";

const SecurityToken = artifacts.require("./SecurityToken.sol");
const GeneralTransferManager = artifacts.require("./GeneralTransferManager");
const ScheduleCheckpoint = artifacts.require("./ScheduleCheckpoint.sol");
const STGetter = artifacts.require("./STGetter.sol")

const Web3 = require("web3");
let BN = Web3.utils.BN;
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port

contract("ScheduleCheckpoint", async (accounts) => {

    const SECONDS = 0;
    const DAYS = 1;
    const WEEKS = 2;
    const MONTHS = 3;
    const QUATER = 4;
    const YEARS = 5;

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
    let I_ScheduleCheckpoint;
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

    const address_zero = "0x0000000000000000000000000000000000000000";
    const one_address = "0x0000000000000000000000000000000000000001";

    async function currentTime() {
        return new BN(await latestTime());
    }

    function checkSchedule(schedule, name, startTime, nextTime, interval, timeUnit, checkpoints, timestamps, periods) {
        assert.equal(web3.utils.toAscii(schedule[0]).replace(/\u0000/g, ""), web3.utils.toAscii(name));
        assert.equal((schedule.startTime).toString(), startTime.toString());
        assert.equal((schedule.createNextCheckpointAt).toString(), nextTime.toString());
        assert.equal((schedule.frequency).toString(), interval);
        assert.equal((schedule.frequencyUnit).toString(), timeUnit);
        assert.equal(schedule.checkpointIds.length, checkpoints.length);
        for (let i = 0; i < checkpoints.length; i++) {
            assert.equal(schedule.checkpointIds[i].toString(), checkpoints[i].toString());
        }
        assert.equal(schedule.timestamps.length, timestamps.length);
        for (let i = 0; i < timestamps.length; i++) {
            assert.equal(schedule.timestamps[i].toString(), timestamps[i].toString());
        }
        assert.equal(schedule.periods.length, periods.length);
        let totalPeriods = 0;
        for (let i = 0; i < periods.length; i++) {
            assert.equal(schedule.periods[i].toString(), periods[i].toString());
            totalPeriods += periods[i];
        }
        assert.equal((schedule.totalPeriods).toString(), totalPeriods.toString());
    }

    before(async () => {
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
            I_STRGetter,
            I_STGetter
        ] = instances;

        // STEP 2: Deploy the ScheduleCheckpointModule
        [I_ScheduledCheckpointFactory] = await deployScheduleCheckpointAndVerified(account_polymath, I_MRProxied, 0, new BN(0));

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
            let currentTimeStamp = new Date((await latestTime()).toString() * 1000);
            let day = currentTimeStamp.getUTCDate();
            if (day > 20)
                await increaseTime(duration.days(12));
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

    describe("Should successfully attach the new module and verify the functionality", async () => {

        it("Should successfully attach the ScheduleCheckpoint with the security token", async () => {
            await I_SecurityToken.changeGranularity(1, { from: token_owner });
            const tx = await I_SecurityToken.addModule(I_ScheduledCheckpointFactory.address, "0x0", new BN(0), new BN(0), false, { from: token_owner });
            assert.equal(tx.logs[2].args._types[0].toString(), 4, "ScheduleCheckpoint doesn't get deployed");
            assert.equal(tx.logs[2].args._types[1].toString(), 2, "ScheduleCheckpoint doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name).replace(/\u0000/g, ""),
                "ScheduleCheckpoint",
                "ScheduleCheckpoint module was not added"
            );
            I_ScheduleCheckpoint = await ScheduleCheckpoint.at(tx.logs[2].args._module);
        });

        it("Should fail to add the schedule -- Invalid Permission", async() => {
            let name = web3.utils.fromAscii("Schedule1");
            let startTime = (await currentTime()).add(new BN(duration.seconds(100)));
            let frequency = new BN(duration.days(1)); // Frequency of 1 days
            let endTime = (await currentTime()).add(new BN(duration.days(20)));
            let frequencyUnit = DAYS;
            await catchRevert(
                I_ScheduleCheckpoint.addSchedule(
                name,
                startTime,
                endTime,
                frequency,
                frequencyUnit,
                { 
                    from: account_investor1 
                }),
                "Invalid permission"
            );
        });

        it("Should fail to add the schedule -- Empty name", async() => {
            let name = web3.utils.fromAscii("");
            let startTime = (await currentTime()).add(new BN(duration.seconds(100)));
            let frequency = new BN(duration.days(1)); // Frequency of 1 days
            let endTime = (await currentTime()).add(new BN(duration.days(20)));
            let frequencyUnit = DAYS;
            await catchRevert(
                I_ScheduleCheckpoint.addSchedule(
                name,
                startTime,
                endTime,
                frequency,
                frequencyUnit,
                { 
                    from: token_owner 
                }),
                "Empty name"
            );
        });

        it("Should fail to add the schedule -- Start time must be in the future", async() => {
            let name = web3.utils.fromAscii("Schedule1");
            let startTime = (await currentTime()).sub(new BN(duration.seconds(100)));
            let frequency = new BN(duration.days(1)); // Frequency of 1 days
            let endTime = (await currentTime()).add(new BN(duration.days(20)));
            let frequencyUnit = DAYS;
            await catchRevert(
                I_ScheduleCheckpoint.addSchedule(
                name,
                startTime,
                endTime,
                frequency,
                frequencyUnit,
                { 
                    from: token_owner 
                }),
                "Start time must be in the future"
            );
        });

        it("Should successfully create the schedule", async () => {
            let name = web3.utils.fromAscii("Schedule1");
            let startTime = (await currentTime()).add(new BN(duration.seconds(100)));
            let frequency = new BN(duration.seconds(24*60*60)); // Frequency of 86400 seconds
            let endTime = new BN(0);
            let frequencyUnit = SECONDS;
            let tx = await I_ScheduleCheckpoint.addSchedule(
                    name,
                    startTime,
                    endTime,
                    frequency,
                    frequencyUnit,
                    { 
                        from: token_owner 
                    }
                );
            assert.equal(web3.utils.toAscii(tx.logs[0].args._name).replace(/\u0000/g, ""), "Schedule1");
            assert.equal((tx.logs[0].args._startTime).toString(), startTime.toString());
            assert.equal((tx.logs[0].args._endTime).toString(), endTime.toString());
            assert.equal((tx.logs[0].args._frequency).toString(), frequency.toString());
            assert.equal(tx.logs[0].args._frequencyUnit, 0);
        });

        it("Should fail to add the schedule -- Name already in use", async() => {
            let name = web3.utils.fromAscii("Schedule1");
            let startTime = (await currentTime()).add(new BN(duration.seconds(100)));
            let frequency = new BN(duration.days(1)); // Frequency of 1 days
            let endTime = (await currentTime()).add(new BN(duration.days(20)));
            let frequencyUnit = DAYS;
            await catchRevert(
                I_ScheduleCheckpoint.addSchedule(
                name,
                startTime,
                endTime,
                frequency,
                frequencyUnit,
                { 
                    from: token_owner 
                }),
                "Name already in use"
            );
        });

        it("Should fail to exceed schedules limit (10)", async () => {
            const snap_Id = await takeSnapshot();
            const tx = await I_SecurityToken.addModule(I_ScheduledCheckpointFactory.address, "0x0", new BN(0), new BN(0), false, { from: token_owner });
            const I_ScheduleCheckpointLimits = await ScheduleCheckpoint.at(tx.logs[2].args._module);

            const startTime = (await currentTime()).add(new BN(duration.seconds(100)));
            const frequency = new BN(duration.seconds(24*60*60)); // Frequency of 86400 seconds
            const endTime = new BN(0);
            const frequencyUnit = SECONDS;

            for (let i = 1; i <= 10; i++) {
                await I_ScheduleCheckpointLimits.addSchedule(
                    web3.utils.fromAscii(`Schedule${i}`),
                    startTime,
                    endTime,
                    frequency,
                    frequencyUnit,
                    {
                        from: token_owner
                    }
                );
            }

            // Adding further schedules should fail.
            await catchRevert(I_ScheduleCheckpointLimits.addSchedule(
                web3.utils.fromAscii("Schedule11"),
                startTime,
                endTime,
                frequency,
                frequencyUnit,
                {
                    from: token_owner
                }
            ), "Max Limit Reached");

            await revertToSnapshot(snap_Id);
        });

        it("Remove (temp) daily checkpoint", async () => {
            let snap_Id = await takeSnapshot();
            await I_ScheduleCheckpoint.removeSchedule(web3.utils.fromAscii("Schedule1"), { from: token_owner });
            await revertToSnapshot(snap_Id);
        });

        it("Should Buy the tokens for account_investor1", async () => {
            // Add the Investor in to the whitelist
            let time = await currentTime();
            let frequency = (await I_ScheduleCheckpoint.getSchedule(web3.utils.fromAscii("Schedule1"))).frequency;
            let startTime = (await I_ScheduleCheckpoint.getSchedule(web3.utils.fromAscii("Schedule1"))).startTime;

            let tx = await I_GeneralTransferManager.modifyKYCData(
                account_investor1,
                time,
                time,
                time.add(new BN(duration.days(100))),
                {
                    from: token_owner,
                    gas: 6000000
                }
            );

            assert.equal(
                tx.logs[0].args._investor.toLowerCase(),
                account_investor1.toLowerCase(),
                "Failed in adding the investor in whitelist"
            );

            // Increase time by 5000 seconds
            await increaseTime(5000);
            // We should be after the first scheduled checkpoint, and before the second
            console.log("Difference b/w past time and currentTime:" + (await currentTime()).sub(time));
            console.log(`pastTime: ${time.toString()}`);
            console.log(`startTime: ${startTime.toString()}`);
            console.log(`Next period time: ${(startTime.add(frequency)).toString()}`);
            
            assert.isTrue(await currentTime() > startTime);
            assert.isTrue(await currentTime() <= startTime.add(frequency));

            // Mint some tokens
            await I_SecurityToken.issue(account_investor1, new BN(web3.utils.toWei("1", "ether")), "0x0", { from: token_owner });
            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor1)).toString(),
                new BN(web3.utils.toWei("1", "ether")).toString()
            );
        });

        it("Should have checkpoint created with correct balances", async () => {
            let startTime = (await I_ScheduleCheckpoint.getSchedule(web3.utils.fromAscii("Schedule1"))).startTime;
            let frequency = (await I_ScheduleCheckpoint.getSchedule(web3.utils.fromAscii("Schedule1"))).frequency;
            let frequencyUnit = (await I_ScheduleCheckpoint.getSchedule(web3.utils.fromAscii("Schedule1"))).frequencyUnit;
            let cp1 = await I_ScheduleCheckpoint.getSchedule(web3.utils.fromAscii("Schedule1"));
            checkSchedule(cp1, web3.utils.fromAscii("Schedule1"), startTime, startTime.add(frequency), frequency, frequencyUnit, [1], [startTime], [1]);
            assert.equal((await stGetter.balanceOfAt(account_investor1, 0)).toString(), 0);
            assert.equal((await stGetter.balanceOfAt(account_investor1, 1)).toString(), 0);
        });

        it("Should Buy some more tokens for account_investor2", async () => {
            let time = await currentTime();
            let frequency = (await I_ScheduleCheckpoint.getSchedule(web3.utils.fromAscii("Schedule1"))).frequency;
            let startTime = (await I_ScheduleCheckpoint.getSchedule(web3.utils.fromAscii("Schedule1"))).startTime;

            // Add the Investor in to the whitelist
            let tx = await I_GeneralTransferManager.modifyKYCData(
                account_investor2,
                time,
                time,
                time.add(new BN(duration.days(100))),
                {
                    from: token_owner,
                }
            );

            assert.equal(
                tx.logs[0].args._investor.toLowerCase(),
                account_investor2.toLowerCase(),
                "Failed in adding the investor in whitelist"
            );

            // We should be after the first scheduled checkpoint, and before the second
            assert.isTrue(await currentTime() > startTime);
            assert.isTrue(await currentTime() <= startTime.add(frequency));

            // Mint some tokens
            await I_SecurityToken.issue(account_investor2, new BN(web3.utils.toWei("1", "ether")), "0x0", { from: token_owner });
            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor2)).toString(),
                new BN(web3.utils.toWei("1", "ether")).toString()
            );
        });

        it("No additional checkpoints created", async () => {
            let startTime = (await I_ScheduleCheckpoint.getSchedule(web3.utils.fromAscii("Schedule1"))).startTime;
            let frequency = (await I_ScheduleCheckpoint.getSchedule(web3.utils.fromAscii("Schedule1"))).frequency;
            let frequencyUnit = (await I_ScheduleCheckpoint.getSchedule(web3.utils.fromAscii("Schedule1"))).frequencyUnit;
            let cp1 = await I_ScheduleCheckpoint.getSchedule(web3.utils.fromAscii("Schedule1"));
            checkSchedule(cp1, web3.utils.fromAscii("Schedule1"), startTime, startTime.add(frequency), frequency, frequencyUnit, [1], [startTime], [1]);
            assert.equal((await stGetter.balanceOfAt(account_investor2, 0)).toString(), 0);
            assert.equal((await stGetter.balanceOfAt(account_investor2, 1)).toString(), 0);
        });

        it("Add a new token holder - account_investor3", async () => {
            let time = await currentTime();
            let frequency = (await I_ScheduleCheckpoint.getSchedule(web3.utils.fromAscii("Schedule1"))).frequency;
            let startTime = (await I_ScheduleCheckpoint.getSchedule(web3.utils.fromAscii("Schedule1"))).startTime;

            let tx = await I_GeneralTransferManager.modifyKYCData(
                account_investor3,
                time,
                time,
                time.add(new BN(duration.days(100))),
                {
                    from: token_owner
                }
            );

            assert.equal(
                tx.logs[0].args._investor.toLowerCase(),
                account_investor3.toLowerCase(),
                "Failed in adding the investor in whitelist"
            );

            // Jump time
            await increaseTime(duration.seconds(frequency.toNumber()));
            // We should be after the first scheduled checkpoint, and before the second
            assert.isTrue(await currentTime() > startTime.add(frequency));
            assert.isTrue(await currentTime() <= startTime.add(frequency.mul(new BN(2))));

            // Add the Investor in to the whitelist
            // Mint some tokens
            await I_SecurityToken.issue(account_investor3, new BN(web3.utils.toWei("1", "ether")), "0x0", { from: token_owner });
            assert.equal(
                (await I_SecurityToken.balanceOf(account_investor3)).toString(),
                new BN(web3.utils.toWei("1", "ether")).toString()
            );
        });

        it("Should have new checkpoint created with correct balances", async () => {
            let startTime = (await I_ScheduleCheckpoint.getSchedule(web3.utils.fromAscii("Schedule1"))).startTime;
            let frequency = (await I_ScheduleCheckpoint.getSchedule(web3.utils.fromAscii("Schedule1"))).frequency;
            let frequencyUnit = (await I_ScheduleCheckpoint.getSchedule(web3.utils.fromAscii("Schedule1"))).frequencyUnit;
            let cp1 = await I_ScheduleCheckpoint.getSchedule(web3.utils.fromAscii("Schedule1"));
            checkSchedule(cp1, web3.utils.fromAscii("Schedule1"), startTime, startTime.add(frequency.mul(new BN(2))), frequency, frequencyUnit, [1, 2], [startTime, startTime.add(frequency)], [1, 1]);
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
            let time = await currentTime();
            let frequency = (await I_ScheduleCheckpoint.getSchedule(web3.utils.fromAscii("Schedule1"))).frequency;
            let startTime = (await I_ScheduleCheckpoint.getSchedule(web3.utils.fromAscii("Schedule1"))).startTime;
            let frequencyUnit = (await I_ScheduleCheckpoint.getSchedule(web3.utils.fromAscii("Schedule1"))).frequencyUnit;

            // Jump time
            await increaseTime(duration.seconds(frequency.toNumber() * 2));
            // We should be after the first scheduled checkpoint, and before the second
            assert.isTrue(await currentTime() > startTime.add(frequency.mul(new BN(3))));
            assert.isTrue(await currentTime() <= startTime.add(frequency.mul(new BN(4))));
            await I_SecurityToken.transfer(account_investor3, new BN(web3.utils.toWei("0.5", "ether")), { from: account_investor1 });
            let cp1 = await I_ScheduleCheckpoint.getSchedule(web3.utils.fromAscii("Schedule1"));
            checkSchedule(
                cp1,
                web3.utils.fromAscii("Schedule1"),
                startTime,
                startTime.add(frequency.mul(new BN(4))),
                frequency,
                frequencyUnit,
                [1, 2, 3],
                [startTime, startTime.add(frequency), startTime.add(frequency.mul(new BN(2)))],
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
            let time = await currentTime();
            let frequency = (await I_ScheduleCheckpoint.getSchedule(web3.utils.fromAscii("Schedule1"))).frequency;
            let startTime = (await I_ScheduleCheckpoint.getSchedule(web3.utils.fromAscii("Schedule1"))).startTime;
            let frequencyUnit = (await I_ScheduleCheckpoint.getSchedule(web3.utils.fromAscii("Schedule1"))).frequencyUnit;

            await increaseTime(duration.seconds(frequency.toNumber()));
            await I_ScheduleCheckpoint.updateAll({ from: token_owner });

            let cp1 = await I_ScheduleCheckpoint.getSchedule(web3.utils.fromAscii("Schedule1"));
            checkSchedule(
                cp1,
                web3.utils.fromAscii("Schedule1"),
                startTime,
                startTime.add(frequency.mul(new BN(5))),
                frequency,
                frequencyUnit,
                [1, 2, 3, 4],
                [startTime, startTime.add(frequency), startTime.add(frequency.mul(new BN(2))), startTime.add(frequency.mul(new BN(4)))],
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
            let perm = await I_ScheduleCheckpoint.getPermissions.call();
            assert.equal(perm.length, 1);
            assert.equal(web3.utils.toAscii(perm[0]).replace(/\u0000/g, ""), "OPERATOR");
        });

        it("Should fail to remove the schedule -- Invalid Permission", async() => {
            let name = web3.utils.fromAscii("Schedule1");
            await catchRevert(
                I_ScheduleCheckpoint.removeSchedule(name, {from: account_investor1}),
                "Invalid permission"
            );
        });

        it("Should fail to remove the schedul -- Invalid name", async() => {
            await catchRevert(
                I_ScheduleCheckpoint.removeSchedule(web3.utils.fromAscii(""), {from: token_owner}),
                "Invalid schedule name"
            );
        });

        it("Should fail to remove the schedul -- Invalid name", async() => {
            let name = web3.utils.fromAscii("Schedule2");
            await catchRevert(
                I_ScheduleCheckpoint.removeSchedule(name, {from: token_owner}),
                "Schedule does not exist"
            );
        });

        it("Should remove schedule successfully", async () => {
            let tx = await I_ScheduleCheckpoint.removeSchedule(web3.utils.fromAscii("Schedule1"), {from: token_owner});
            assert.equal(
                web3.utils.toAscii(tx.logs[0].args._name).replace(/\u0000/g, ""),
                "Schedule1"
            );
        });
    });

    describe("Tests for monthly scheduled checkpoints", async() => {

        it("Should create a schedule to create the monthly checkpoint", async () => {
            let name = web3.utils.fromAscii("Schedule2");
            let startTime = (await currentTime()).add(new BN(duration.seconds(100)));
            let frequency = new BN(5); // Frequency of 5 month
            let endTime = new BN(0);
            let frequencyUnit = MONTHS;
            let tx = await I_ScheduleCheckpoint.addSchedule(
                    name,
                    startTime,
                    endTime,
                    frequency,
                    frequencyUnit,
                    { 
                        from: token_owner 
                    }
                );
            assert.equal(web3.utils.toAscii(tx.logs[0].args._name).replace(/\u0000/g, ""), "Schedule2");
            assert.equal((tx.logs[0].args._startTime).toString(), startTime.toString());
            assert.equal((tx.logs[0].args._endTime).toString(), endTime.toString());
            assert.equal((tx.logs[0].args._frequency).toString(), frequency.toString());
            assert.equal(tx.logs[0].args._frequencyUnit, 3);
        });

        it("Should create and verify the details of schedule at period 1", async() => {
            await increaseTime(duration.seconds(101));
            await I_ScheduleCheckpoint.updateAll({from: token_owner});

            let frequency = (await I_ScheduleCheckpoint.getSchedule(web3.utils.fromAscii("Schedule2"))).frequency;
            let startTime = (await I_ScheduleCheckpoint.getSchedule(web3.utils.fromAscii("Schedule2"))).startTime;
            let frequencyUnit = (await I_ScheduleCheckpoint.getSchedule(web3.utils.fromAscii("Schedule2"))).frequencyUnit;
            let schedule = await I_ScheduleCheckpoint.getSchedule(web3.utils.fromAscii("Schedule2"));
            let checkpoints = [5];
            let timestamps = [startTime];
            let periods = [1];
            checkSchedule(
                schedule,
                web3.utils.fromAscii("Schedule2"),
                startTime,
                addMonths(startTime.toNumber(), frequency.toNumber()),
                frequency,
                frequencyUnit,
                checkpoints,
                timestamps,
                periods
            );
        });

        it("Should create and verify the details of schedule at period 2", async() => {
            let frequency = (await I_ScheduleCheckpoint.getSchedule(web3.utils.fromAscii("Schedule2"))).frequency;
            let startTime = (await I_ScheduleCheckpoint.getSchedule(web3.utils.fromAscii("Schedule2"))).startTime;
            let frequencyUnit = (await I_ScheduleCheckpoint.getSchedule(web3.utils.fromAscii("Schedule2"))).frequencyUnit;
            let totalPeriods = (await I_ScheduleCheckpoint.getSchedule(web3.utils.fromAscii("Schedule2"))).totalPeriods;
            let nextCheckpointCreatedAt_before = (await I_ScheduleCheckpoint.getSchedule(web3.utils.fromAscii("Schedule2"))).createNextCheckpointAt;
            let currentTimestamp = (await currentTime()).toNumber();

            await increaseTime(duration.seconds(diffMonths(currentTimestamp, frequency.toNumber())));
            await I_ScheduleCheckpoint.updateAll({from: token_owner});

            let schedule = await I_ScheduleCheckpoint.getSchedule(web3.utils.fromAscii("Schedule2"));
            let checkpoints = [5, 6];
            let timestamps = [startTime, addMonths(startTime.toString(), frequency.toNumber())];
            let periods = [1, 1];
            checkSchedule(
                schedule,
                web3.utils.fromAscii("Schedule2"),
                startTime,
                addMonths(startTime.toNumber(), (frequency.mul(new BN(2))).toNumber()),
                frequency,
                frequencyUnit,
                checkpoints,
                timestamps,
                periods
            );
        });

        it("Should create and verify the details of schedule at period 4", async() => {
            let name = web3.utils.fromAscii("Schedule2");
            let frequency = ((await I_ScheduleCheckpoint.getSchedule(name)).frequency).toNumber();
            let startTime = ((await I_ScheduleCheckpoint.getSchedule(name)).startTime).toNumber();
            let frequencyUnit = (await I_ScheduleCheckpoint.getSchedule(name)).frequencyUnit;
            let currentTimestamp = (await currentTime()).toNumber();
            
            await increaseTime(duration.seconds(diffMonths(currentTimestamp, frequency * 2)));
            await I_ScheduleCheckpoint.updateAll({from: token_owner});
            let schedule = await I_ScheduleCheckpoint.getSchedule(name);
            let checkpoints = [5, 6, 7];
            let timestamps = [startTime, addMonths(startTime, frequency), addMonths(startTime, frequency * 2)];
            let periods = [1, 1, 2];
            checkSchedule(
                schedule,
                name,
                new BN(startTime),
                addMonths(startTime, frequency * 4),
                frequency,
                frequencyUnit,
                checkpoints,
                timestamps,
                periods
            );
        });

        it("Check four monthly checkpoints", async() => {
            let name = web3.utils.fromAscii("Schedule2");
            let frequency = ((await I_ScheduleCheckpoint.getSchedule(name)).frequency).toNumber();
            let startTime = ((await I_ScheduleCheckpoint.getSchedule(name)).startTime).toNumber();
            let frequencyUnit = (await I_ScheduleCheckpoint.getSchedule(name)).frequencyUnit;
            let currentTimestamp = (await currentTime()).toNumber();

            await increaseTime(duration.seconds(diffMonths(currentTimestamp, frequency)));
            await I_ScheduleCheckpoint.updateAll({from: token_owner});

            let schedule = await I_ScheduleCheckpoint.getSchedule(name);
            let checkpoints = [5, 6, 7, 8];
            let timestamps = [
                startTime,
                addMonths(startTime, frequency),
                addMonths(startTime, frequency * 2),
                addMonths(startTime, frequency * 4)
            ];
            let periods = [1, 1, 2, 1];
            checkSchedule(
                schedule,
                name,
                new BN(startTime),
                addMonths(startTime, frequency * 5),
                frequency,
                frequencyUnit,
                checkpoints,
                timestamps,
                periods
            );
        });

        it("Check five monthly checkpoints", async() => {
            let name = web3.utils.fromAscii("Schedule2");
            let frequency = ((await I_ScheduleCheckpoint.getSchedule(web3.utils.fromAscii("Schedule2"))).frequency).toNumber();
            let startTime = ((await I_ScheduleCheckpoint.getSchedule(web3.utils.fromAscii("Schedule2"))).startTime).toNumber();
            let frequencyUnit = (await I_ScheduleCheckpoint.getSchedule(web3.utils.fromAscii("Schedule2"))).frequencyUnit;
            let currentTimestamp = (await currentTime()).toNumber();

            await increaseTime(duration.seconds(diffMonths(currentTimestamp, frequency * 3)));
            await I_ScheduleCheckpoint.updateAll({from: token_owner});

            let schedule = await I_ScheduleCheckpoint.getSchedule(name);
            let checkpoints = [5, 6, 7, 8, 9];
            let timestamps = [
                startTime,
                addMonths(startTime, frequency),
                addMonths(startTime, frequency * 2),
                addMonths(startTime, frequency * 4),
                addMonths(startTime, frequency * 5)
            ];
            let periods = [1, 1, 2, 1, 3];
            checkSchedule(
                schedule,
                name,
                new BN(startTime),
                addMonths(startTime, frequency * 8),
                frequency,
                frequencyUnit,
                checkpoints,
                timestamps,
                periods
            );
        });

        it("Remove monthly checkpoint", async () => {
            let tx = await I_ScheduleCheckpoint.removeSchedule(web3.utils.fromAscii("Schedule2"), {from: token_owner});
            assert.equal(
                web3.utils.toAscii(tx.logs[0].args._name).replace(/\u0000/g, ""),
                "Schedule2"
            );
        });

    });

    describe("Tests for yearly scheduled checkpoints", async() => {

        it("Should successfully create a schedule with a year frequency", async () => {
            let name = web3.utils.fromAscii("Schedule3");
            let startTime = (await currentTime()).add(new BN(duration.seconds(100)));
            let frequency = new BN(3); // Frequency of 3 years
            let endTime = (await currentTime()).add(new BN(duration.years(12.1)));;
            let frequencyUnit = YEARS;
            let tx = await I_ScheduleCheckpoint.addSchedule(
                    name,
                    startTime,
                    endTime,
                    frequency,
                    frequencyUnit,
                    { 
                        from: token_owner 
                    }
                );
            assert.equal(web3.utils.toAscii(tx.logs[0].args._name).replace(/\u0000/g, ""), "Schedule3");
            assert.equal((tx.logs[0].args._startTime).toString(), startTime.toString());
            assert.equal((tx.logs[0].args._endTime).toString(), endTime.toString());
            assert.equal((tx.logs[0].args._frequency).toString(), frequency.toString());
            assert.equal(tx.logs[0].args._frequencyUnit, 5);
        });

        it("Should create the checkpoint after update the schedule status manually", async() => {
            let name = web3.utils.fromAscii("Schedule3");
            let frequency = ((await I_ScheduleCheckpoint.getSchedule(name)).frequency).toNumber();
            let startTime = ((await I_ScheduleCheckpoint.getSchedule(name)).startTime).toNumber();
            let frequencyUnit = (await I_ScheduleCheckpoint.getSchedule(name)).frequencyUnit;
            
            await increaseTime(duration.seconds(100));
            await I_ScheduleCheckpoint.updateAll({from: token_owner});

            let schedule = await I_ScheduleCheckpoint.getSchedule(name);
            let checkpoints = [10];
            let timestamps = [startTime];
            let periods = [1];
            checkSchedule(
                schedule,
                name,
                new BN(startTime),
                addYears(startTime, frequency),
                frequency,
                frequencyUnit,
                checkpoints,
                timestamps,
                periods
            );
        });

        it("Should move into the next period by 1, covered 1 frequency", async() => {
            let name = web3.utils.fromAscii("Schedule3");
            let frequency = ((await I_ScheduleCheckpoint.getSchedule(name)).frequency).toNumber();
            let startTime = ((await I_ScheduleCheckpoint.getSchedule(name)).startTime).toNumber();
            let frequencyUnit = (await I_ScheduleCheckpoint.getSchedule(name)).frequencyUnit;
            let currentTimestamp = (await currentTime()).toNumber();

            await increaseTime(duration.seconds(diffYears(currentTimestamp, frequency * 1))); // Increase the 3 year
            await I_ScheduleCheckpoint.updateAll({from: token_owner});
           
            let schedule = await I_ScheduleCheckpoint.getSchedule(name);
            let checkpoints = [10, 11];
            let timestamps = [startTime, addYears(startTime, frequency)];
            let periods = [1, 1];
            checkSchedule(
                schedule,
                name,
                new BN(startTime),
                addYears(startTime, frequency * 2),
                frequency,
                frequencyUnit,
                checkpoints,
                timestamps,
                periods
            );
        });

        it("Should move into the next period by 2, covered 2 frequency", async() => {
            let name = web3.utils.fromAscii("Schedule3");
            let frequency = ((await I_ScheduleCheckpoint.getSchedule(name)).frequency).toNumber();
            let startTime = ((await I_ScheduleCheckpoint.getSchedule(name)).startTime).toNumber();
            let frequencyUnit = (await I_ScheduleCheckpoint.getSchedule(name)).frequencyUnit;
            let currentTimestamp = (await currentTime()).toNumber();

            await increaseTime(duration.seconds(diffYears(currentTimestamp, frequency * 2))); // Increase the 6 year 
            await I_ScheduleCheckpoint.updateAll({from: token_owner});

            let schedule = await I_ScheduleCheckpoint.getSchedule(name);
            let checkpoints = [10, 11, 12];
            let timestamps = [startTime, addYears(startTime, frequency), addYears(startTime, frequency * 2)];
            let periods = [1, 1, 2];
            checkSchedule(
                schedule,
                name,
                new BN(startTime),
                addYears(startTime, frequency * 4),
                frequency,
                frequencyUnit,
                checkpoints,
                timestamps,
                periods
            );
        });

        it("Should move into the next period by 1, covered 1 frequency", async() => {
            let name = web3.utils.fromAscii("Schedule3");
            let frequency = ((await I_ScheduleCheckpoint.getSchedule(name)).frequency).toNumber();
            let startTime = ((await I_ScheduleCheckpoint.getSchedule(name)).startTime).toNumber();
            let frequencyUnit = (await I_ScheduleCheckpoint.getSchedule(name)).frequencyUnit;
            let currentTimestamp = (await currentTime()).toNumber();

            await increaseTime(duration.seconds(diffYears(currentTimestamp, frequency * 1))); // Increase the 3 year
            await I_ScheduleCheckpoint.updateAll({from: token_owner});

            let schedule = await I_ScheduleCheckpoint.getSchedule(name);
            let checkpoints = [10, 11, 12, 13];
            let timestamps = [
                startTime,
                addYears(startTime, frequency),
                addYears(startTime, frequency * 2),
                addYears(startTime, frequency * 4)
            ];
            let periods = [1, 1, 2, 1];
            checkSchedule(
                schedule,
                name,
                new BN(startTime),
                addYears(startTime, frequency * 5),
                frequency,
                frequencyUnit,
                checkpoints,
                timestamps,
                periods
            );
        });

        it("Should fail move into the next period by 1, covered 1 frequency -- endTime for the schedule gets hit", async() => {
            let name = web3.utils.fromAscii("Schedule3");
            let frequency = ((await I_ScheduleCheckpoint.getSchedule(name)).frequency).toNumber();
            let startTime = ((await I_ScheduleCheckpoint.getSchedule(name)).startTime).toNumber();
            let frequencyUnit = (await I_ScheduleCheckpoint.getSchedule(name)).frequencyUnit;
            let nextScheduleAt = ((await I_ScheduleCheckpoint.getSchedule(name)).createNextCheckpointAt).toNumber();
            let periodsArrayLength = ((await I_ScheduleCheckpoint.getSchedule(name)).periods).length;

            let currentTimestamp = (await currentTime()).toNumber();
            
            await increaseTime(duration.seconds(diffYears(currentTimestamp, frequency * 1))); // Increase the 3 year
            await I_ScheduleCheckpoint.updateAll({from: token_owner});

            let nextScheduleAt_after = ((await I_ScheduleCheckpoint.getSchedule(name)).createNextCheckpointAt).toNumber();
            let periodsArrayLength_after = ((await I_ScheduleCheckpoint.getSchedule(name)).periods).length;

            assert.equal(nextScheduleAt, nextScheduleAt_after);
            assert.equal(periodsArrayLength, periodsArrayLength_after);
        });

        it("Should fail to modify the endTime of the schedule", async() => {
            let name = web3.utils.fromAscii("Schedule3");
            let newEndTime = (await currentTime()).add(new BN(duration.years(10)));
            await catchRevert(
                I_ScheduleCheckpoint.modifyScheduleEndTime(
                    name,
                    newEndTime,
                    {
                        from: token_owner
                    }
                ),
                "Schedule already ended"
            );
        });

        it("Should fail to modify the endTime of the schedule", async() => {
            let name = web3.utils.fromAscii("Schedule5");
            let newEndTime = (await currentTime()).add(new BN(duration.years(10)));
            await catchRevert(
                I_ScheduleCheckpoint.modifyScheduleEndTime(
                    name,
                    newEndTime,
                    {
                        from: token_owner
                    }
                ),
                "Invalid name"
            );
        });        

        it("Remove monthly checkpoint", async () => {
            let name = web3.utils.fromAscii("Schedule3");
            await I_ScheduleCheckpoint.removeSchedule(name, {from: token_owner});
        });

    });

    describe("Tests for monthly scheduled checkpoints -- end of month", async() => {
        
        let startDate;
        let name;
        let startTime;
        let previousTime;
        let frequency;
        let frequencyUnit;

        it("Should create a monthly checkpoint -- December 31", async () => {
            name = web3.utils.fromAscii("Schedule4");
            previousTime = await currentTime();
            startDate = new Date(previousTime.toNumber() * 1000);
            startDate.setUTCMonth(11, 31);
            startTime = startDate.getTime() / 1000;
            console.log("previousTime:" + previousTime);
            console.log("startTime:" + startTime);
            console.log("startDate:" + startDate.toUTCString());
            frequency = new BN(1); // Frequency of 3 years
            let endTime = new BN(0);
            frequencyUnit = MONTHS;
            let tx = await I_ScheduleCheckpoint.addSchedule(
                    name,
                    startTime,
                    endTime,
                    frequency,
                    frequencyUnit,
                    { 
                        from: token_owner 
                    }
                );
            assert.equal(web3.utils.toAscii(tx.logs[0].args._name).replace(/\u0000/g, ""), "Schedule4");
            assert.equal((tx.logs[0].args._startTime).toString(), startTime.toString());
            assert.equal((tx.logs[0].args._endTime).toString(), endTime.toString());
            assert.equal((tx.logs[0].args._frequency).toString(), frequency.toString());
            assert.equal(tx.logs[0].args._frequencyUnit, 3);
        });

        it("Check monthly checkpoint -- January 31", async() => {
            await increaseTime((new BN(startTime).sub(previousTime)).toNumber() + 100);
            await I_ScheduleCheckpoint.updateAll({from: token_owner});

            let schedule = await I_ScheduleCheckpoint.getSchedule(name);
            let checkpoints = [14];
            let nextTime = addMonths(startTime, frequency.toNumber());
            let timestamps = [startTime];
            let periods = [1];
            checkSchedule(schedule, name, startTime, nextTime, frequency, frequencyUnit, checkpoints, timestamps, periods);
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
            await increaseTime(duration.days(31 * frequency));
            await I_ScheduleCheckpoint.updateAll({from: token_owner});

            let schedule = await I_ScheduleCheckpoint.getSchedule(name);
            let checkpoints = [14, 15];
            let days = getDaysInFebruary();
            let nextTime = getEndOfFebruary(startTime, days);
            let timestamps = [startTime, addMonths(startTime, frequency.toNumber())];
            let periods = [1, 1];
            checkSchedule(schedule, name, startTime, nextTime, frequency, frequencyUnit, checkpoints, timestamps, periods);
        });

        it("Check monthly checkpoints -- March 31", async() => {
            let days = getDaysInFebruary();
            let nextCheckPointCreatedAt_before = ((await I_ScheduleCheckpoint.getSchedule(name)).createNextCheckpointAt).toNumber();
            let totalPeriods = ((await I_ScheduleCheckpoint.getSchedule(name)).totalPeriods).toNumber();
            console.log(`Before nextTime ${nextCheckPointCreatedAt_before}`);
            console.log(`Before total Period ${totalPeriods}`);
            await increaseTime(duration.days(days * frequency));
            await I_ScheduleCheckpoint.updateAll({from: token_owner});

            let nextCheckPointCreatedAt_after = ((await I_ScheduleCheckpoint.getSchedule(name)).createNextCheckpointAt).toNumber();
            let totalPeriods_after = ((await I_ScheduleCheckpoint.getSchedule(name)).totalPeriods).toNumber();
            console.log(`After nextTime ${nextCheckPointCreatedAt_after}`);
            console.log(`After total Period ${totalPeriods_after}`);

            let schedule = await I_ScheduleCheckpoint.getSchedule(name);
            let checkpoints = [14, 15, 16];
            let nextTime = addMonths(nextCheckPointCreatedAt_before, frequency.toNumber());
            let timestamps = [startTime, addMonths(startTime, frequency.toNumber()), getEndOfFebruary(startTime, days)];
            let periods = [1, 1, 1];

            for (let i = 0; i < timestamps.length; i++) {
                assert.equal(schedule[7][i].toString(), timestamps[i]);
                console.log(new Date(schedule[7][i].toString() * 1000).toUTCString());
            }
            console.log("expected:" + new Date(nextTime * 1000).toUTCString());
            console.log("actual:" + new Date(schedule[3].toString() * 1000).toUTCString());
            checkSchedule(schedule, name, startTime, nextTime, frequency, frequencyUnit, checkpoints, timestamps, periods);
        });

        it("Remove monthly checkpoint", async () => {
            await I_ScheduleCheckpoint.removeSchedule(name, {from: token_owner});
        });

    });

    describe("Tests for daily scheduled checkpoints", async() => {

        let name = web3.utils.fromAscii("Schedule5");
        let startTime;
        let endTime;
        let frequency = 13;
        let frequencyUnit = DAYS;

        it("Should create a daily checkpoint", async () => {
            startTime = (await currentTime()).add(new BN(100));
            endTime = new BN(0);

            let tx = await I_ScheduleCheckpoint.addSchedule(name, startTime, endTime, frequency, frequencyUnit, {from: token_owner});
            checkScheduleLog(tx.logs[0], name, startTime, frequency, frequencyUnit);
        });

        it("Check one daily checkpoint", async() => {
            await increaseTime(100);
            await I_ScheduleCheckpoint.updateAll({from: token_owner});

            let schedule = await I_ScheduleCheckpoint.getSchedule(name);
            let checkpoints = [17];
            let timestamps = [startTime];
            let periods = [1];
            checkSchedule(schedule, name, startTime, addDays(startTime.toNumber(), frequency), frequency, frequencyUnit, checkpoints, timestamps, periods);
        });

        it("Check two daily checkpoints", async() => {
            await increaseTime(duration.days(frequency));
            await I_ScheduleCheckpoint.updateAll({from: token_owner});

            let schedule = await I_ScheduleCheckpoint.getSchedule(name);
            let checkpoints = [17, 18];
            let timestamps = [startTime, addDays(startTime.toNumber(), frequency)];
            let periods = [1, 1];
            checkSchedule(schedule, name, startTime, addDays(startTime.toNumber(), frequency * 2), frequency, frequencyUnit, checkpoints, timestamps, periods);
        });

        it("Check three daily checkpoints", async() => {
            await increaseTime(duration.days(frequency * 2));
            await I_ScheduleCheckpoint.updateAll({from: token_owner});

            let schedule = await I_ScheduleCheckpoint.getSchedule(name);
            let checkpoints = [17, 18, 19];
            let timestamps = [startTime, addDays(startTime.toNumber(), frequency), addDays(startTime, frequency * 2)];
            let periods = [1, 1, 2];
            checkSchedule(schedule, name, startTime, addDays(startTime.toNumber(), frequency * 4), frequency, frequencyUnit, checkpoints, timestamps, periods);
        });

        it("Check four daily checkpoints", async() => {
            await increaseTime(duration.days(frequency));
            await I_ScheduleCheckpoint.updateAll({from: token_owner});

            let schedule = await I_ScheduleCheckpoint.getSchedule(name);
            let checkpoints = [17, 18, 19, 20];
            let timestamps = [startTime, addDays(startTime.toNumber(), frequency), addDays(startTime.toNumber(), frequency * 2), addDays(startTime.toNumber(), frequency * 4)];
            let periods = [1, 1, 2, 1];
            checkSchedule(schedule, name, startTime, addDays(startTime.toNumber(), frequency * 5), frequency, frequencyUnit, checkpoints, timestamps, periods);
        });

        it("Check five daily checkpoints", async() => {
            await increaseTime(duration.days(frequency * 3));
            await I_ScheduleCheckpoint.updateAll({from: token_owner});

            let schedule = await I_ScheduleCheckpoint.getSchedule(name);
            let checkpoints = [17, 18, 19, 20, 21];
            let timestamps = [startTime, addDays(startTime.toNumber(), frequency), addDays(startTime.toNumber(), frequency * 2), addDays(startTime.toNumber(), frequency * 4), addDays(startTime.toNumber(), frequency * 5)];
            let periods = [1, 1, 2, 1, 3];
            checkSchedule(schedule, name, startTime, addDays(startTime.toNumber(), frequency * 8), frequency, frequencyUnit, checkpoints, timestamps, periods);
        });

        it("Remove daily checkpoint", async () => {
            await I_ScheduleCheckpoint.removeSchedule(name, {from: token_owner});
        });

    });

    describe("Tests for weekly scheduled checkpoints", async() => {

        let name = web3.utils.fromAscii("Schedule6");
        let startTime;
        let endTime;
        let frequency = 9;
        let frequencyUnit = WEEKS;

        it("Should create a weekly checkpoint", async () => {
            startTime = (await currentTime()).toNumber() + 100;
            endTime = new BN(0);
            let tx = await I_ScheduleCheckpoint.addSchedule(name, startTime, endTime, frequency, frequencyUnit, {from: token_owner});
            checkScheduleLog(tx.logs[0], name, startTime, frequency, frequencyUnit);
        });

        it("Check one weekly checkpoint", async() => {
            await increaseTime(100);
            await I_ScheduleCheckpoint.updateAll({from: token_owner});

            let schedule = await I_ScheduleCheckpoint.getSchedule(name);
            let checkpoints = [22];
            let timestamps = [startTime];
            let periods = [1];

            checkSchedule(schedule, name, startTime, addWeeks(startTime, frequency), frequency, frequencyUnit, checkpoints, timestamps, periods);
        });

        it("Check two weekly checkpoints", async() => {
            await increaseTime(duration.days(7 * frequency));
            await I_ScheduleCheckpoint.updateAll({from: token_owner});

            let schedule = await I_ScheduleCheckpoint.getSchedule(name);
            let checkpoints = [22, 23];
            let timestamps = [startTime, addWeeks(startTime, frequency)];
            let periods = [1, 1];
            checkSchedule(schedule, name, startTime, addWeeks(startTime, frequency * 2), frequency, frequencyUnit, checkpoints, timestamps, periods);
        });

        it("Check three weekly checkpoints", async() => {
            await increaseTime(duration.days(7 * frequency * 2));
            await I_ScheduleCheckpoint.updateAll({from: token_owner});

            let schedule = await I_ScheduleCheckpoint.getSchedule(name);
            let checkpoints = [22, 23, 24];
            let timestamps = [startTime, addWeeks(startTime, frequency), addWeeks(startTime, frequency * 2)];
            let periods = [1, 1, 2];
            checkSchedule(schedule, name, startTime, addWeeks(startTime, frequency * 4), frequency, frequencyUnit, checkpoints, timestamps, periods);
        });

        it("Check four weekly checkpoints", async() => {
            await increaseTime(duration.days(7 * frequency));
            await I_ScheduleCheckpoint.updateAll({from: token_owner});

            let schedule = await I_ScheduleCheckpoint.getSchedule(name);
            let checkpoints = [22, 23, 24, 25];
            let timestamps = [startTime, addWeeks(startTime, frequency), addWeeks(startTime, frequency * 2), addWeeks(startTime, frequency * 4)];
            let periods = [1, 1, 2, 1];
            checkSchedule(schedule, name, startTime, addWeeks(startTime, frequency * 5), frequency, frequencyUnit, checkpoints, timestamps, periods);
        });

        it("Check five weekly checkpoints", async() => {
            await increaseTime(duration.days(7 * frequency * 3));
            await I_ScheduleCheckpoint.updateAll({from: token_owner});

            let schedule = await I_ScheduleCheckpoint.getSchedule(name);
            let checkpoints = [22, 23, 24, 25, 26];
            let timestamps = [startTime, addWeeks(startTime, frequency), addWeeks(startTime, frequency * 2), addWeeks(startTime, frequency * 4), addWeeks(startTime, frequency * 5)];
            let periods = [1, 1, 2, 1, 3];
            checkSchedule(schedule, name, startTime, addWeeks(startTime, frequency * 8), frequency, frequencyUnit, checkpoints, timestamps, periods);
        });

        it("Remove weekly checkpoint", async () => {
            await I_ScheduleCheckpoint.removeSchedule(name, {from: token_owner});
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
    return time.setUTCMonth(parseInt(time.getUTCMonth()) + parseInt(months)) / 1000;
}

function diffMonths(timestamp, months) {
    return addMonths(timestamp, months) - timestamp;
}

function addYears(timestamp, years) {
    let time = new Date(timestamp * 1000);
    return time.setUTCFullYear(parseInt(time.getUTCFullYear()) + parseInt(years)) / 1000;
}

function diffYears(timestamp, years) {
    return addYears(timestamp, years) - timestamp;
}

function checkScheduleLog(log, name, startTime, interval, timeUnit) {
    assert.equal(web3.utils.toAscii(log.args._name).replace(/\u0000/g, ""), web3.utils.toAscii(name));
    assert.equal((log.args._startTime).toString(), startTime.toString());
    assert.equal((log.args._frequency).toString(), interval);
    assert.equal((log.args._frequencyUnit).toString(), timeUnit);
}

