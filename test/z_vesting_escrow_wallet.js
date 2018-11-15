import {deployPolyRegistryAndPolyToken, deployVestingEscrowWallet} from "./helpers/createInstances";
import latestTime from "./helpers/latestTime";
import {duration as durationUtil} from "./helpers/utils";

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

        account_beneficiary1 = accounts[7];
        account_beneficiary2 = accounts[8];
        account_beneficiary3 = accounts[9];

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

    describe("Adding and Revoking Vesting Schedule", async () => {

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

        it("Should add Vesting Schedule to the first beneficiary address", async () => {
            let numberOfTokens = 100000;
            let duration = durationUtil.years(4);
            let frequency = durationUtil.years(1);
            let startTime = latestTime() + durationUtil.days(1);
            await I_PolyToken.approve(I_VestingEscrowWallet.address, numberOfTokens, { from: account_treasury });
            await I_VestingEscrowWallet.depositTokens(numberOfTokens, {from: wallet_owner});
            const tx = await I_VestingEscrowWallet.addSchedule(account_beneficiary1, numberOfTokens, duration, frequency, startTime, {from: wallet_owner});

            let log = tx.logs[0];
            checkScheduleLog(log, account_beneficiary1, numberOfTokens, duration, frequency, startTime);

            let scheduleCount = await I_VestingEscrowWallet.getScheduleCount.call(account_beneficiary1, {from: wallet_owner});
            assert.equal(scheduleCount.toNumber(), 1);

            let schedule = await I_VestingEscrowWallet.getSchedule.call(account_beneficiary1, 0, {from: wallet_owner});
            checkSchedule(schedule, numberOfTokens, numberOfTokens, duration, frequency, startTime, startTime + frequency, CREATED);
        });

        it("Should revoke Vesting Schedule from the first beneficiary address", async () => {
            const tx = await I_VestingEscrowWallet.revokeSchedule(account_beneficiary1, 0, {from: wallet_owner});

            assert.equal(tx.logs[0].args._beneficiary, account_beneficiary1);
            assert.equal(tx.logs[0].args._index, 0);

            let scheduleCount = await I_VestingEscrowWallet.getScheduleCount.call(account_beneficiary1, {from: wallet_owner});
            assert.equal(scheduleCount.toNumber(), 0);
        });

        it("Should add 3 Vesting Schedules to the second beneficiary address", async () => {
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

                let scheduleCount = await I_VestingEscrowWallet.getScheduleCount.call(account_beneficiary2, {from: wallet_owner});
                assert.equal(scheduleCount.toNumber(), i + 1);

                let schedule = await I_VestingEscrowWallet.getSchedule.call(account_beneficiary2, i, {from: wallet_owner});
                checkSchedule(schedule, numberOfTokens, numberOfTokens, duration, frequency, startTime, startTime + frequency, CREATED);
            }
        });

        it("Should revoke Vesting Schedule from the second beneficiary address", async () => {
            const tx = await I_VestingEscrowWallet.revokeSchedule(account_beneficiary2, 1, {from: wallet_owner});

            assert.equal(tx.logs[0].args._beneficiary, account_beneficiary2);
            assert.equal(tx.logs[0].args._index, 1);

            let scheduleCount = await I_VestingEscrowWallet.getScheduleCount.call(account_beneficiary2, {from: wallet_owner});
            assert.equal(scheduleCount.toNumber(), 2);

            let schedule = await I_VestingEscrowWallet.getSchedule.call(account_beneficiary2, 1, {from: wallet_owner});
            checkSchedule(schedule, schedules[2].numberOfTokens, schedules[2].numberOfTokens, schedules[2].duration, schedules[2].frequency,
                          schedules[2].startTime, schedules[2].startTime + schedules[2].frequency, CREATED);
        });

        it("Should revoke 2 Vesting Schedules from the second beneficiary address", async () => {
            const tx = await I_VestingEscrowWallet.revokeSchedules(account_beneficiary2, {from: wallet_owner});

            assert.equal(tx.logs[0].args._beneficiary, account_beneficiary2);

            let scheduleCount = await I_VestingEscrowWallet.getScheduleCount.call(account_beneficiary2, {from: wallet_owner});
            assert.equal(scheduleCount.toNumber(), 0);
        });


    });

});

function checkScheduleLog(log, beneficiary, numberOfTokens, duration, frequency, startTime) {
    assert.equal(log.args._beneficiary, beneficiary);
    assert.equal(log.args._numberOfTokens, numberOfTokens);
    assert.equal(log.args._duration, duration);
    assert.equal(log.args._frequency, frequency);
    assert.equal(log.args._startTime, startTime);
}

function checkSchedule(schedule, numberOfTokens, lockedTokens, duration, frequency, startTime, nextTime, state) {
    assert.equal(schedule[0].toNumber(), numberOfTokens);
    assert.equal(schedule[1].toNumber(), lockedTokens);
    assert.equal(schedule[2].toNumber(), duration);
    assert.equal(schedule[3].toNumber(), frequency);
    assert.equal(schedule[4].toNumber(), startTime);
    assert.equal(schedule[5].toNumber(), nextTime);
    assert.equal(schedule[6].toNumber(), state);
}

function getTotalNumberOfTokens(schedules) {
    let numberOfTokens = 0;
    for (let i = 0; i < schedules.length; i++) {
        numberOfTokens += schedules[i].numberOfTokens;
    }
    return numberOfTokens;
}
