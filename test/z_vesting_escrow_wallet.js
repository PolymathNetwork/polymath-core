import {deployPolyRegistryAndPolyToken, deployVestingEscrowWallet} from "./helpers/createInstances";
import latestTime from "./helpers/latestTime";
import {duration as durationUtil} from "./helpers/utils";
import {catchRevert} from "./helpers/exceptions";
import {increaseTime} from "./helpers/time";

const VestingEscrowWallet = artifacts.require('./VestingEscrowWallet.sol');

const Web3 = require('web3');
const BigNumber = require('bignumber.js');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));// Hardcoded development port

contract('VestingEscrowWallet', accounts => {

    const CREATED = 0;
    const STARTED = 1;
    const COMPLETED = 2;

    // Accounts Variable declaration
    let account_polymath;
    let wallet_owner;
    let account_treasury;
    let account_beneficiary1;
    let account_beneficiary2;
    let account_beneficiary3;
    let account_beneficiary4;

    let beneficiaries;

    let message = "Transaction Should Fail!";

    // Contract Instance Declaration
    let I_VestingEscrowWallet;
    let I_PolyToken;
    let I_PolymathRegistry;

    before(async () => {
        // Accounts setup
        account_polymath = accounts[0];
        wallet_owner = accounts[1];
        account_treasury = accounts[2];

        account_beneficiary1 = accounts[6];
        account_beneficiary2 = accounts[7];
        account_beneficiary3 = accounts[8];
        account_beneficiary4 = accounts[9];

        beneficiaries = [
            account_beneficiary1,
            account_beneficiary2,
            account_beneficiary3
        ];

        // Step 1: Deploy the PolyToken
        [I_PolymathRegistry, I_PolyToken] = await deployPolyRegistryAndPolyToken(account_polymath, account_treasury);

        // STEP 2: Deploy the VestingEscrowWallet
        [I_VestingEscrowWallet] = await deployVestingEscrowWallet(wallet_owner, I_PolyToken.address, account_treasury);

        // Printing all the contract addresses
        console.log(`
        --------------------- Polymath Network Smart Contracts: ---------------------
        PolymathRegistry:                  ${I_PolymathRegistry.address}
        PolyToken:                         ${I_PolyToken.address}

        VestingEscrowWalle:                ${I_VestingEscrowWallet.address}
        -----------------------------------------------------------------------------
        `);
    });
/*
    describe("Depositing and withdrawing tokens", async () => {

        it("Should fail to deposit zero amount of tokens", async () => {
            await catchRevert(
                I_VestingEscrowWallet.depositTokens(0, {from: wallet_owner})
            );
        });

        it("Should deposit tokens for new vesting schedules", async () => {
            let numberOfTokens = 25000;
            await I_PolyToken.approve(I_VestingEscrowWallet.address, numberOfTokens, { from: account_treasury });
            const tx = await I_VestingEscrowWallet.depositTokens(numberOfTokens, {from: wallet_owner});

            assert.equal(tx.logs[0].args._numberOfTokens, numberOfTokens);

            let unassignedTokens = await I_VestingEscrowWallet.unassignedTokens.call();
            assert.equal(unassignedTokens, numberOfTokens);

            let balance = await I_PolyToken.balanceOf.call(I_VestingEscrowWallet.address);
            assert.equal(balance.toNumber(), numberOfTokens);
        });

        it("Should withdraw tokens to a treasury", async () => {
            let numberOfTokens = 25000;
            const tx = await I_VestingEscrowWallet.sendToTreasury({from: wallet_owner});

            assert.equal(tx.logs[0].args._numberOfTokens, numberOfTokens);

            let unassignedTokens = await I_VestingEscrowWallet.unassignedTokens.call();
            assert.equal(unassignedTokens, 0);

            let balance = await I_PolyToken.balanceOf.call(I_VestingEscrowWallet.address);
            assert.equal(balance.toNumber(), 0);
        });

        it("Should fail to send available tokens -- fail because beneficiary doesn't have available tokens", async () => {
            catchRevert(
                I_VestingEscrowWallet.sendAvailableTokens(account_beneficiary3, {from: wallet_owner})
            );
        });

        it("Should send available tokens to the beneficiary address", async () => {
            let numberOfTokens = 75000;
            let duration = durationUtil.seconds(30);
            let frequency = durationUtil.seconds(10);
            let timeShift = durationUtil.seconds(100);
            let startTime = latestTime() + timeShift;
            await I_PolyToken.approve(I_VestingEscrowWallet.address, numberOfTokens, { from: account_treasury });
            await I_VestingEscrowWallet.depositTokens(numberOfTokens, {from: wallet_owner});
            await I_VestingEscrowWallet.addSchedule(account_beneficiary3, numberOfTokens, duration, frequency, startTime, {from: wallet_owner});
            await increaseTime(timeShift + frequency);
            await I_VestingEscrowWallet.update(account_beneficiary3, {from: wallet_owner});

            const tx = await I_VestingEscrowWallet.sendAvailableTokens(account_beneficiary3, {from: wallet_owner});
            assert.equal(tx.logs[0].args._beneficiary, account_beneficiary3);
            assert.equal(tx.logs[0].args._numberOfTokens.toNumber(), numberOfTokens / 3);

            let balance = await I_PolyToken.balanceOf.call(account_beneficiary3);
            assert.equal(balance.toNumber(), numberOfTokens / 3);

            await I_PolyToken.transfer(account_treasury, balance, {from: account_beneficiary3});
        });

        it("Should fail to edit vesting schedule -- fail because schedule already started", async () => {
            let numberOfTokens = 75000;
            let duration = durationUtil.seconds(30);
            let frequency = durationUtil.seconds(10);
            let timeShift = durationUtil.seconds(100);
            let startTime = latestTime() + timeShift;
            await catchRevert(
                I_VestingEscrowWallet.editSchedule(account_beneficiary3, 0, numberOfTokens, duration, frequency, startTime, {from: wallet_owner})
            );

            await I_VestingEscrowWallet.revokeSchedules(account_beneficiary3, {from: wallet_owner});
            await I_VestingEscrowWallet.sendToTreasury({from: wallet_owner});
        });

        it("Should withdraw available tokens to the beneficiary address", async () => {
            let numberOfTokens = 33000;
            let duration = durationUtil.seconds(30);
            let frequency = durationUtil.seconds(10);
            let timeShift = durationUtil.seconds(100);
            let startTime = latestTime() + timeShift;
            await I_PolyToken.approve(I_VestingEscrowWallet.address, numberOfTokens, { from: account_treasury });
            await I_VestingEscrowWallet.depositTokens(numberOfTokens, {from: wallet_owner});
            await I_VestingEscrowWallet.addSchedule(account_beneficiary3, numberOfTokens, duration, frequency, startTime, {from: wallet_owner});
            await increaseTime(timeShift + frequency * 3);
            for (let i = 0; i < 4; i++) {
                await I_VestingEscrowWallet.update(account_beneficiary3, {from: wallet_owner});
            }

            const tx = await I_VestingEscrowWallet.withdrawAvailableTokens({from: account_beneficiary3});
            assert.equal(tx.logs[0].args._beneficiary, account_beneficiary3);
            assert.equal(tx.logs[0].args._numberOfTokens.toNumber(), numberOfTokens);

            let balance = await I_PolyToken.balanceOf.call(account_beneficiary3);
            assert.equal(balance.toNumber(), numberOfTokens);

            await I_PolyToken.transfer(account_treasury, balance, {from: account_beneficiary3});
            await I_VestingEscrowWallet.revokeSchedules(account_beneficiary3, {from: wallet_owner});
            await I_VestingEscrowWallet.sendToTreasury({from: wallet_owner});
        });

        it("Should withdraw available tokens by 3 schedules to the beneficiary address", async () => {
            let schedules = [
                {
                    numberOfTokens: 100000,
                    duration: durationUtil.seconds(4),
                    frequency: durationUtil.seconds(1)
                },
                {
                    numberOfTokens: 30000,
                    duration: durationUtil.seconds(6),
                    frequency: durationUtil.seconds(1)
                },
                {
                    numberOfTokens: 2000,
                    duration: durationUtil.seconds(10),
                    frequency: durationUtil.seconds(1)
                }
            ];

            let totalNumberOfTokens = getTotalNumberOfTokens(schedules);
            await I_PolyToken.approve(I_VestingEscrowWallet.address, totalNumberOfTokens, {from: account_treasury});
            await I_VestingEscrowWallet.depositTokens(totalNumberOfTokens, {from: wallet_owner});
            for (let i = 0; i < schedules.length; i++) {
                let numberOfTokens = schedules[i].numberOfTokens;
                let duration = schedules[i].duration;
                let frequency = schedules[i].frequency;
                let startTime = latestTime() + durationUtil.seconds(100);
                await I_VestingEscrowWallet.addSchedule(account_beneficiary3, numberOfTokens, duration, frequency, startTime, {from: wallet_owner});
            }
            await increaseTime(durationUtil.minutes(5));
            let stepCount = 4;
            for (let i = 0; i < stepCount; i++) {
                await I_VestingEscrowWallet.update(account_beneficiary3, {from: wallet_owner});
            }
            let numberOfTokens = 100000 + (30000 / 6 * stepCount) + (2000 / 10 * stepCount);
            const tx = await I_VestingEscrowWallet.withdrawAvailableTokens({from: account_beneficiary3});
            assert.equal(tx.logs[0].args._beneficiary, account_beneficiary3);
            assert.equal(tx.logs[0].args._numberOfTokens.toNumber(), numberOfTokens);

            let balance = await I_PolyToken.balanceOf.call(account_beneficiary3);
            assert.equal(balance.toNumber(), numberOfTokens);

            await I_PolyToken.transfer(account_treasury, balance, {from: account_beneficiary3});
            await I_VestingEscrowWallet.revokeSchedules(account_beneficiary3, {from: wallet_owner});
            await I_VestingEscrowWallet.sendToTreasury({from: wallet_owner});
        });

    });
*/
    describe("Adding, editing and revoking vesting schedule", async () => {

        let schedules = [
            {
                numberOfTokens: 100000,
                duration: durationUtil.years(4),
                frequency: durationUtil.years(1),
                startTime: latestTime() + durationUtil.days(1)
            },
            {
                numberOfTokens: 30000,
                duration: durationUtil.weeks(6),
                frequency: durationUtil.weeks(1),
                startTime: latestTime() + durationUtil.days(2)
            },
            {
                numberOfTokens: 2000,
                duration: durationUtil.days(10),
                frequency: durationUtil.days(2),
                startTime: latestTime() + durationUtil.days(3)
            }
        ];

        it("Should fail to add vesting schedule to the beneficiary address -- fail because not enough unassigned tokens", async () => {
            await catchRevert(
                I_VestingEscrowWallet.addSchedule(account_beneficiary1, 100000, 4, 1, latestTime() + durationUtil.days(1), {from: wallet_owner})
            );
        });

        it("Should fail to add vesting schedule to the beneficiary address -- fail because address in invalid", async () => {
            await catchRevert(
                I_VestingEscrowWallet.addSchedule(0, 100000, 4, 1, latestTime() + durationUtil.days(1), {from: wallet_owner})
            );
        });

        it("Should fail to add vesting schedule to the beneficiary address -- fail because start date in the past", async () => {
            await catchRevert(
                I_VestingEscrowWallet.addSchedule(account_beneficiary1, 100000, 4, 1, latestTime() - durationUtil.days(1), {from: wallet_owner})
            );
        });

        it("Should fail to add vesting schedule to the beneficiary address -- fail because number of tokens is 0", async () => {
            await catchRevert(
                I_VestingEscrowWallet.addSchedule(account_beneficiary1, 0, 4, 1, latestTime() + durationUtil.days(1), {from: wallet_owner})
            );
        });

        it("Should fail to add vesting schedule to the beneficiary address -- fail because duration can't be divided entirely by frequency", async () => {
            await catchRevert(
                I_VestingEscrowWallet.addSchedule(account_beneficiary1, 100000, 4, 3, latestTime() + durationUtil.days(1), {from: wallet_owner})
            );
        });

        it("Should fail to add vesting schedule to the beneficiary address -- fail because number of tokens can't be divided entirely by period count", async () => {
            await catchRevert(
                I_VestingEscrowWallet.addSchedule(account_beneficiary1, 5, 4, 1, latestTime() + durationUtil.days(1), {from: wallet_owner})
            );
        });

        it("Should fail to get vesting schedule -- fail because address is invalid", async () => {
            await catchRevert(
                I_VestingEscrowWallet.getSchedule(0, 0)
            );
        });

        it("Should fail to get vesting schedule -- fail because schedule not found", async () => {
            await catchRevert(
                I_VestingEscrowWallet.getSchedule(account_beneficiary1, 0)
            );
        });

        it("Should fail to get count of vesting schedule -- fail because address is invalid", async () => {
            await catchRevert(
                I_VestingEscrowWallet.getScheduleCount(0)
            );
        });

        it("Should fail to get available tokens -- fail because address is invalid", async () => {
            await catchRevert(
                I_VestingEscrowWallet.getAvailableTokens(0)
            );
        });

        it("Should add vesting schedule to the beneficiary address", async () => {
            let numberOfTokens = schedules[0].numberOfTokens;
            let duration = schedules[0].duration;
            let frequency = schedules[0].frequency;
            let startTime = schedules[0].startTime;
            await I_PolyToken.approve(I_VestingEscrowWallet.address, numberOfTokens, {from: account_treasury});
            await I_VestingEscrowWallet.depositTokens(numberOfTokens, {from: wallet_owner});
            const tx = await I_VestingEscrowWallet.addSchedule(account_beneficiary1, numberOfTokens, duration, frequency, startTime, {from: wallet_owner});

            let log = tx.logs[0];
            checkScheduleLog(log, account_beneficiary1, numberOfTokens, duration, frequency, startTime);

            let scheduleCount = await I_VestingEscrowWallet.getScheduleCount.call(account_beneficiary1);
            assert.equal(scheduleCount, 1);

            let schedule = await I_VestingEscrowWallet.getSchedule.call(account_beneficiary1, 0);
            checkSchedule(schedule, numberOfTokens, numberOfTokens, duration, frequency, startTime, startTime + frequency, CREATED);
        });

        it("Should fail to edit vesting schedule -- fail because schedule not found", async () => {
            let numberOfTokens = schedules[0].numberOfTokens;
            let duration = schedules[0].duration;
            let frequency = schedules[0].frequency;
            let startTime = schedules[0].startTime;
            await catchRevert(
                I_VestingEscrowWallet.editSchedule(account_beneficiary1, 1, numberOfTokens, duration, frequency, startTime, {from: wallet_owner})
            );
        });

        it("Should fail to edit vesting schedule -- fail because not enough unassigned tokens", async () => {
            let numberOfTokens = schedules[0].numberOfTokens * 2;
            let duration = schedules[0].duration;
            let frequency = schedules[0].frequency;
            let startTime = schedules[0].startTime;
            await catchRevert(
                I_VestingEscrowWallet.editSchedule(account_beneficiary1, 0, numberOfTokens, duration, frequency, startTime, {from: wallet_owner})
            );
        });

        it("Should edit vesting schedule for the beneficiary's address", async () => {
            let numberOfTokens = schedules[1].numberOfTokens;
            let duration = schedules[1].duration;
            let frequency = schedules[1].frequency;
            let startTime = schedules[1].startTime;
            const tx = await I_VestingEscrowWallet.editSchedule(account_beneficiary1, 0, numberOfTokens, duration, frequency, startTime, {from: wallet_owner});

            let log = tx.logs[0];
            checkScheduleLog(log, account_beneficiary1, numberOfTokens, duration, frequency, startTime);

            let scheduleCount = await I_VestingEscrowWallet.getScheduleCount.call(account_beneficiary1);
            assert.equal(scheduleCount, 1);

            let schedule = await I_VestingEscrowWallet.getSchedule.call(account_beneficiary1, 0);
            checkSchedule(schedule, numberOfTokens, numberOfTokens, duration, frequency, startTime, startTime + frequency, CREATED);

            let unassignedTokens = await I_VestingEscrowWallet.unassignedTokens.call();
            assert.equal(unassignedTokens.toNumber(), schedules[0].numberOfTokens - schedules[1].numberOfTokens);
        });

        it("Should fail edit vesting schedule to the beneficiary address", async () => {
            let numberOfTokens = schedules[0].numberOfTokens + schedules[1].numberOfTokens;
            let duration = schedules[0].duration;
            let frequency = schedules[0].frequency;
            let startTime = schedules[0].startTime;
            await catchRevert(
                I_VestingEscrowWallet.editSchedule(account_beneficiary1, 0, numberOfTokens, duration, frequency, startTime, {from: wallet_owner})
            );
        });

        it("Should fail to revoke vesting schedule -- fail because address is invalid", async () => {
            await catchRevert(
                I_VestingEscrowWallet.revokeSchedule(0, 0, {from: wallet_owner})
            );
        });

        it("Should fail to revoke vesting schedule -- fail because schedule not found", async () => {
            await catchRevert(
                I_VestingEscrowWallet.revokeSchedule(account_beneficiary1, 1, {from: wallet_owner})
            );
        });

        it("Should revoke vesting schedule from the beneficiary address", async () => {
            const tx = await I_VestingEscrowWallet.revokeSchedule(account_beneficiary1, 0, {from: wallet_owner});
            await I_VestingEscrowWallet.sendToTreasury({from: wallet_owner});

            assert.equal(tx.logs[0].args._beneficiary, account_beneficiary1);
            assert.equal(tx.logs[0].args._index, 0);

            let scheduleCount = await I_VestingEscrowWallet.getScheduleCount.call(account_beneficiary1);
            assert.equal(scheduleCount, 0);
        });

        it("Should fail to revoke vesting schedules -- fail because address is invalid", async () => {
            await catchRevert(
                I_VestingEscrowWallet.revokeSchedules(0, {from: wallet_owner})
            );
        });

        it("Should add 3 vesting schedules to the beneficiary address", async () => {
            let totalNumberOfTokens = getTotalNumberOfTokens(schedules);
            await I_PolyToken.approve(I_VestingEscrowWallet.address, totalNumberOfTokens, {from: account_treasury});
            await I_VestingEscrowWallet.depositTokens(totalNumberOfTokens, {from: wallet_owner});
            for (let i = 0; i < schedules.length; i++) {
                let numberOfTokens = schedules[i].numberOfTokens;
                let duration = schedules[i].duration;
                let frequency = schedules[i].frequency;
                let startTime = schedules[i].startTime;
                const tx = await I_VestingEscrowWallet.addSchedule(account_beneficiary2, numberOfTokens, duration, frequency, startTime, {from: wallet_owner});

                let log = tx.logs[0];
                checkScheduleLog(log, account_beneficiary2, numberOfTokens, duration, frequency, startTime);

                let scheduleCount = await I_VestingEscrowWallet.getScheduleCount.call(account_beneficiary2);
                assert.equal(scheduleCount, i + 1);

                let schedule = await I_VestingEscrowWallet.getSchedule.call(account_beneficiary2, i);
                checkSchedule(schedule, numberOfTokens, numberOfTokens, duration, frequency, startTime, startTime + frequency, CREATED);
            }
        });

        it("Should revoke vesting schedule from the beneficiary address", async () => {
            const tx = await I_VestingEscrowWallet.revokeSchedule(account_beneficiary2, 1, {from: wallet_owner});
            await I_VestingEscrowWallet.sendToTreasury({from: wallet_owner});

            assert.equal(tx.logs[0].args._beneficiary, account_beneficiary2);
            assert.equal(tx.logs[0].args._index, 1);

            let scheduleCount = await I_VestingEscrowWallet.getScheduleCount.call(account_beneficiary2);
            assert.equal(scheduleCount, 2);

            let schedule = await I_VestingEscrowWallet.getSchedule.call(account_beneficiary2, 1);
            checkSchedule(schedule, schedules[2].numberOfTokens, schedules[2].numberOfTokens, schedules[2].duration, schedules[2].frequency,
                schedules[2].startTime, schedules[2].startTime + schedules[2].frequency, CREATED);
        });

        it("Should revoke 2 vesting schedules from the beneficiary address", async () => {
            const tx = await I_VestingEscrowWallet.revokeSchedules(account_beneficiary2, {from: wallet_owner});
            await I_VestingEscrowWallet.sendToTreasury({from: wallet_owner});

            assert.equal(tx.logs[0].args._beneficiary, account_beneficiary2);

            let scheduleCount = await I_VestingEscrowWallet.getScheduleCount.call(account_beneficiary2);
            assert.equal(scheduleCount, 0);
        });

    });

    describe("Adding, using and removing templates", async () => {

        let schedules = [
            {
                numberOfTokens: 100000,
                duration: durationUtil.years(4),
                frequency: durationUtil.years(1),
                startTime: latestTime() + durationUtil.days(1)
            },
            {
                numberOfTokens: 30000,
                duration: durationUtil.weeks(6),
                frequency: durationUtil.weeks(1),
                startTime: latestTime() + durationUtil.days(2)
            },
            {
                numberOfTokens: 2000,
                duration: durationUtil.days(10),
                frequency: durationUtil.days(2),
                startTime: latestTime() + durationUtil.days(3)
            }
        ];

        it("Should add 3 Templates", async () => {
            for (let i = 0; i < schedules.length; i++) {
                let numberOfTokens = schedules[i].numberOfTokens;
                let duration = schedules[i].duration;
                let frequency = schedules[i].frequency;
                const tx = await I_VestingEscrowWallet.addTemplate(numberOfTokens, duration, frequency, {from: wallet_owner});

                assert.equal(tx.logs[0].args._numberOfTokens.toNumber(), numberOfTokens);
                assert.equal(tx.logs[0].args._duration.toNumber(), duration);
                assert.equal(tx.logs[0].args._frequency.toNumber(), frequency);
            }
        });

        it("Should remove template", async () => {
            const tx = await I_VestingEscrowWallet.removeTemplate(1, {from: wallet_owner});

            assert.equal(tx.logs[0].args._index, 1);
        });

        it("Should fail to add vesting schedule from template -- fail because template not found", async () => {
            let startTime = schedules[2].startTime;
            await catchRevert(
                I_VestingEscrowWallet.addScheduleFromTemplate(account_beneficiary1, 1, startTime, {from: wallet_owner})
            );
        });

        it("Should add vesting schedule from template", async () => {
            let numberOfTokens = schedules[2].numberOfTokens;
            let duration = schedules[2].duration;
            let frequency = schedules[2].frequency;
            let startTime = schedules[2].startTime;
            await I_PolyToken.approve(I_VestingEscrowWallet.address, numberOfTokens, { from: account_treasury });
            await I_VestingEscrowWallet.depositTokens(numberOfTokens, {from: wallet_owner});
            const tx = await I_VestingEscrowWallet.addScheduleFromTemplate(account_beneficiary1, 1, startTime, {from: wallet_owner});

            let log = tx.logs[0];
            checkScheduleLog(log, account_beneficiary1, numberOfTokens, duration, frequency, startTime);

            let scheduleCount = await I_VestingEscrowWallet.getScheduleCount.call(account_beneficiary1);
            assert.equal(scheduleCount, 1);

            let schedule = await I_VestingEscrowWallet.getSchedule.call(account_beneficiary1, 0);
            checkSchedule(schedule, numberOfTokens, numberOfTokens, duration, frequency, startTime, startTime + frequency, CREATED);

            await I_VestingEscrowWallet.revokeSchedule(account_beneficiary1, 0, {from: wallet_owner});
            await I_VestingEscrowWallet.sendToTreasury({from: wallet_owner});
        });

        it("Should fail to remove template", async () => {
            await catchRevert(
                I_VestingEscrowWallet.removeTemplate(2, {from: wallet_owner})
            );
        });

        it("Should remove 2 Templates", async () => {
            await I_VestingEscrowWallet.removeTemplate(0, {from: wallet_owner});
            await I_VestingEscrowWallet.removeTemplate(0, {from: wallet_owner});

            let templateCount = await I_VestingEscrowWallet.getTemplateCount.call({from: wallet_owner});
            assert.equal(templateCount, 0);
        });

    });

    describe("Tests for batch operations", async () => {

        it("Should add schedules for 3 beneficiaries", async () => {
            let numberOfTokens = 30000;
            let duration = durationUtil.weeks(4);
            let frequency = durationUtil.weeks(1);
            let startTime = latestTime() + durationUtil.seconds(100);

            let totalNumberOfTokens = numberOfTokens * 3;
            await I_PolyToken.approve(I_VestingEscrowWallet.address, totalNumberOfTokens, {from: account_treasury});
            await I_VestingEscrowWallet.depositTokens(totalNumberOfTokens, {from: wallet_owner});

            let tx = await I_VestingEscrowWallet.batchAddSchedule(beneficiaries, numberOfTokens, duration, frequency, startTime, {from: wallet_owner});

            for (let i = 0; i < beneficiaries.length; i++) {
                let log = tx.logs[i];
                let beneficiary = beneficiaries[i];
                checkScheduleLog(log, beneficiary, numberOfTokens, duration, frequency, startTime);

                let scheduleCount = await I_VestingEscrowWallet.getScheduleCount.call(beneficiary);
                assert.equal(scheduleCount, 1);

                let schedule = await I_VestingEscrowWallet.getSchedule.call(beneficiary, 0);
                checkSchedule(schedule, numberOfTokens, numberOfTokens, duration, frequency, startTime, startTime + frequency, CREATED);
            }
        });

        it("Should edit vesting schedule for 3 beneficiary's addresses", async () => {
            let numberOfTokens = 25000;
            let duration = durationUtil.seconds(50);
            let frequency = durationUtil.seconds(10);
            let timeShift = durationUtil.seconds(100);
            let startTime = latestTime() + timeShift;

            let indexes = [0, 0, 0, 0];
            await catchRevert(
                I_VestingEscrowWallet.batchEditSchedule(beneficiaries, indexes, numberOfTokens, duration, frequency, startTime, {from: wallet_owner})
            );
        });

        it("Should edit vesting schedule for 3 beneficiary's addresses", async () => {
            let numberOfTokens = 25000;
            let duration = durationUtil.seconds(50);
            let frequency = durationUtil.seconds(10);
            let timeShift = durationUtil.seconds(100);
            let startTime = latestTime() + timeShift;

            let indexes = [0, 0, 0];
            const tx = await I_VestingEscrowWallet.batchEditSchedule(beneficiaries, indexes, numberOfTokens, duration, frequency, startTime, {from: wallet_owner});
            await increaseTime(timeShift + frequency);

            for (let i = 0; i < beneficiaries.length; i++) {
                let log = tx.logs[i];
                let beneficiary = beneficiaries[i];
                checkScheduleLog(log, beneficiary, numberOfTokens, duration, frequency, startTime);

                let scheduleCount = await I_VestingEscrowWallet.getScheduleCount.call(beneficiary);
                assert.equal(scheduleCount, 1);

                let schedule = await I_VestingEscrowWallet.getSchedule.call(beneficiary, 0);
                checkSchedule(schedule, numberOfTokens, numberOfTokens, duration, frequency, startTime, startTime + frequency, CREATED);
            }

            let unassignedTokens = await I_VestingEscrowWallet.unassignedTokens.call();
            assert.equal(unassignedTokens.toNumber(), 5000 * beneficiaries.length);
        });

        it("Should send available tokens to the beneficiaries addresses", async () => {
            for (let i = 0; i < beneficiaries.length; i++) {
                let beneficiary = beneficiaries[i];
                await I_VestingEscrowWallet.update(beneficiary, {from: wallet_owner});
            }

            const tx = await I_VestingEscrowWallet.batchSendAvailableTokens(beneficiaries, {from: wallet_owner});

            for (let i = 0; i < beneficiaries.length; i++) {
                let log = tx.logs[i];
                let beneficiary = beneficiaries[i];
                assert.equal(log.args._beneficiary, beneficiary);
                assert.equal(log.args._numberOfTokens.toNumber(), 5000);

                let balance = await I_PolyToken.balanceOf.call(beneficiary);
                assert.equal(balance.toNumber(), 5000);

                await I_PolyToken.transfer(account_treasury, balance, {from: beneficiary});
                await I_VestingEscrowWallet.revokeSchedules(beneficiary, {from: wallet_owner});
                await I_VestingEscrowWallet.sendToTreasury({from: wallet_owner});
            }
        });

        it("Should add schedules from template for 3 beneficiaries", async () => {
            let numberOfTokens = 18000;
            let duration = durationUtil.weeks(3);
            let frequency = durationUtil.weeks(1);
            let startTime = latestTime() + durationUtil.seconds(100);

            let totalNumberOfTokens = numberOfTokens * 3;
            await I_PolyToken.approve(I_VestingEscrowWallet.address, totalNumberOfTokens, {from: account_treasury});
            await I_VestingEscrowWallet.depositTokens(totalNumberOfTokens, {from: wallet_owner});
            await I_VestingEscrowWallet.addTemplate(numberOfTokens, duration, frequency, {from: wallet_owner});

            let tx = await I_VestingEscrowWallet.batchAddScheduleFromTemplate(beneficiaries, 0, startTime, {from: wallet_owner});
            await I_VestingEscrowWallet.removeTemplate(0, {from: wallet_owner});

            for (let i = 0; i < beneficiaries.length; i++) {
                let log = tx.logs[i];
                let beneficiary = beneficiaries[i];
                checkScheduleLog(log, beneficiary, numberOfTokens, duration, frequency, startTime);

                let scheduleCount = await I_VestingEscrowWallet.getScheduleCount.call(beneficiary);
                assert.equal(scheduleCount, 1);

                let schedule = await I_VestingEscrowWallet.getSchedule.call(beneficiary, 0);
                checkSchedule(schedule, numberOfTokens, numberOfTokens, duration, frequency, startTime, startTime + frequency, CREATED);
            }

        });

        it("Should revoke vesting schedule from the 3 beneficiary's addresses", async () => {
            const tx = await I_VestingEscrowWallet.batchRevokeSchedules(beneficiaries, {from: wallet_owner});

            for (let i = 0; i < beneficiaries.length; i++) {
                let log = tx.logs[i];
                let beneficiary = beneficiaries[i];
                assert.equal(log.args._beneficiary, beneficiary);

                let scheduleCount = await I_VestingEscrowWallet.getScheduleCount.call(beneficiary);
                assert.equal(scheduleCount, 0);
            }

            await I_VestingEscrowWallet.sendToTreasury({from: wallet_owner});
        });

    });

});

function checkScheduleLog(log, beneficiary, numberOfTokens, duration, frequency, startTime) {
    assert.equal(log.args._beneficiary, beneficiary);
    assert.equal(log.args._numberOfTokens.toNumber(), numberOfTokens);
    assert.equal(log.args._duration.toNumber(), duration);
    assert.equal(log.args._frequency.toNumber(), frequency);
    assert.equal(log.args._startTime.toNumber(), startTime);
}

function checkSchedule(schedule, numberOfTokens, lockedTokens, duration, frequency, startTime, nextTime, state) {
    assert.equal(schedule[0].toNumber(), numberOfTokens);
    assert.equal(schedule[1].toNumber(), lockedTokens);
    assert.equal(schedule[2].toNumber(), duration);
    assert.equal(schedule[3].toNumber(), frequency);
    assert.equal(schedule[4].toNumber(), startTime);
    assert.equal(schedule[5].toNumber(), nextTime);
    assert.equal(schedule[6], state);
}

function getTotalNumberOfTokens(schedules) {
    let numberOfTokens = 0;
    for (let i = 0; i < schedules.length; i++) {
        numberOfTokens += schedules[i].numberOfTokens;
    }
    return numberOfTokens;
}
