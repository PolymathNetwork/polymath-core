import {deployPolyRegistryAndPolyToken, deployVestingEscrowWallet} from "./helpers/createInstances";
import latestTime from "./helpers/latestTime";
import {duration as durationUtil} from "./helpers/utils";

const VestingEscrowWallet = artifacts.require('./VestingEscrowWallet.sol');

const Web3 = require('web3');
const BigNumber = require('bignumber.js');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));// Hardcoded development port

contract('VestingEscrowWallet', accounts => {

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

    describe("Adding Vesting Schedule", async () => {

        it("Should add Vesting Schedule to the beneficiary address", async () => {
            let numberOfTokens = 100000;
            let duration = durationUtil.years(4);
            let frequency = durationUtil.years(1);
            let startTime = latestTime() + durationUtil.days(1);
            await I_PolyToken.approve(I_VestingEscrowWallet.address, numberOfTokens, { from: account_treasury });
            await I_VestingEscrowWallet.depositTokens(numberOfTokens, {from: wallet_owner});
            const tx = await I_VestingEscrowWallet.addSchedule(account_beneficiary1, numberOfTokens, duration, frequency, startTime, {from: wallet_owner});

            let log = tx.logs[0];
            assert.equal(log.args._beneficiary, account_beneficiary1);
            assert.equal(log.args._numberOfTokens, numberOfTokens);
            assert.equal(log.args._duration, duration);
            assert.equal(log.args._frequency, frequency);
            assert.equal(log.args._startTime, startTime);

            let scheduleCount = await I_VestingEscrowWallet.getScheduleCount.call(account_beneficiary1, {from: wallet_owner});
            assert.equal(scheduleCount, 1);

            let schedule = await I_VestingEscrowWallet.getSchedule.call(account_beneficiary1, 0, {from: wallet_owner});
            console.log("==========================================");
            console.log(schedule);
        });


    });

});