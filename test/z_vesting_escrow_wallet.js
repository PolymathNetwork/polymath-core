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
    let account_issuer;
    let token_owner;
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
        account_issuer = accounts[1];

        token_owner = account_issuer;

        account_beneficiary1 = accounts[7];
        account_beneficiary2 = accounts[8];
        account_beneficiary3 = accounts[9];

        // Step 1: Deploy the PolyToken
        [I_PolymathRegistry, I_PolyToken] = await deployPolyRegistryAndPolyToken(account_polymath, token_owner);

        // STEP 2: Deploy the VestingEscrowWallet
        [I_VestingEscrowWallet] = await deployVestingEscrowWallet(account_polymath, I_PolyToken.address, token_owner);

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
            const tx = await I_VestingEscrowWallet.addSchedule(account_beneficiary1, numberOfTokens, duration, frequency, startTime, {from: account_polymath});

            let log = tx.logs[0];
            assert.equal(log.args._beneficiary, account_beneficiary1);
            assert.equal(log.args._numberOfTokens, numberOfTokens);
            assert.equal(log.args._duration, duration);
            assert.equal(log.args._frequency, frequency);
            assert.equal(log.args._startTime, startTime);
        });


    });

});