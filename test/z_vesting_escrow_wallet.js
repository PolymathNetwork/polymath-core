import {deployGPMAndVerifyed, deployVestingEscrowWalletAndVerifyed, setUpPolymathNetwork} from "./helpers/createInstances";
import latestTime from "./helpers/latestTime";
import {duration as durationUtil, latestBlock, promisifyLogWatch} from "./helpers/utils";
import {catchRevert} from "./helpers/exceptions";
import {increaseTime} from "./helpers/time";
import {encodeModuleCall} from "./helpers/encodeCall";

const SecurityToken = artifacts.require('./SecurityToken.sol');
const GeneralTransferManager = artifacts.require('./GeneralTransferManager');
const GeneralPermissionManager = artifacts.require("./GeneralPermissionManager");
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
    let token_owner;
    let wallet_admin;
    let account_beneficiary1;
    let account_beneficiary2;
    let account_beneficiary3;

    let beneficiaries;

    let message = "Transaction Should Fail!";

    // Contract Instance Declaration
    let I_SecurityTokenRegistryProxy;
    let I_GeneralPermissionManagerFactory;
    let I_GeneralTransferManagerFactory;
    let I_VestingEscrowWalletFactory;
    let I_GeneralPermissionManager;
    let I_VestingEscrowWallet;
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
    const delegateDetails = "Hello I am legit delegate";

    // Module key
    const delegateManagerKey = 1;
    const transferManagerKey = 2;
    const stoKey = 3;

    // Initial fee for ticker registry and security token registry
    const initRegFee = web3.utils.toWei("250");

    before(async () => {
        // Accounts setup
        account_polymath = accounts[0];
        token_owner = accounts[1];
        wallet_admin = accounts[2];

        account_beneficiary1 = accounts[6];
        account_beneficiary2 = accounts[7];
        account_beneficiary3 = accounts[8];

        beneficiaries = [
            account_beneficiary1,
            account_beneficiary2,
            account_beneficiary3
        ];

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

        // STEP 2: Deploy the GeneralDelegateManagerFactory
        [I_GeneralPermissionManagerFactory] = await deployGPMAndVerifyed(account_polymath, I_MRProxied, I_PolyToken.address, 0);

        // STEP 3: Deploy the VestingEscrowWallet
        [I_VestingEscrowWalletFactory] = await deployVestingEscrowWalletAndVerifyed(account_polymath, I_MRProxied, I_PolyToken.address, 0);

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
        GeneralPermissionManagerFactory:   ${I_GeneralPermissionManagerFactory.address}
        
        I_VestingEscrowWalletFactory:      ${I_VestingEscrowWalletFactory.address}
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

        it("Should successfully attach the General permission manager factory with the security token", async () => {
            const tx = await I_SecurityToken.addModule(I_GeneralPermissionManagerFactory.address, "0x", 0, 0, { from: token_owner });
            assert.equal(tx.logs[2].args._types[0].toNumber(), delegateManagerKey, "General Permission Manager doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name).replace(/\u0000/g, ""),
                "GeneralPermissionManager",
                "GeneralPermissionManagerFactory module was not added"
            );
            I_GeneralPermissionManager = GeneralPermissionManager.at(tx.logs[2].args._module);
        });

        it("Should successfully attach the VestingEscrowWallet with the security token", async () => {
            let bytesData = encodeModuleCall(
                ["address"],
                [token_owner]
            );

            await I_SecurityToken.changeGranularity(1, {from: token_owner});
            const tx = await I_SecurityToken.addModule(I_VestingEscrowWalletFactory.address, bytesData, 0, 0, { from: token_owner });

            assert.equal(tx.logs[2].args._types[0].toNumber(), 6, "VestingEscrowWallet doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name)
                    .replace(/\u0000/g, ''),
                "VestingEscrowWallet",
                "VestingEscrowWallet module was not added"
            );
            I_VestingEscrowWallet = VestingEscrowWallet.at(tx.logs[2].args._module);
        });

        it("Should Buy the tokens for token_owner", async() => {
            // Add the Investor in to the whitelist
            let tx = await I_GeneralTransferManager.modifyWhitelist(
                token_owner,
                latestTime(),
                latestTime(),
                latestTime() + durationUtil.days(10),
                true,
                {
                    from: token_owner,
                    gas: 6000000
                });

            assert.equal(tx.logs[0].args._investor.toLowerCase(), token_owner.toLowerCase(), "Failed in adding the token_owner in whitelist");

            // Mint some tokens
            await I_SecurityToken.mint(token_owner, web3.utils.toWei('1', 'ether'), { from: token_owner });

            assert.equal(
                (await I_SecurityToken.balanceOf(token_owner)).toNumber(),
                web3.utils.toWei('1', 'ether')
            );

        });

        it("Should whitelist investors", async() => {
            // Add the Investor in to the whitelist
            let tx = await I_GeneralTransferManager.modifyWhitelistMulti(
                [I_VestingEscrowWallet.address, account_beneficiary1, account_beneficiary2, account_beneficiary3],
                [latestTime(), latestTime(), latestTime(), latestTime()],
                [latestTime(), latestTime(), latestTime(), latestTime()],
                [latestTime() + durationUtil.days(10), latestTime() + durationUtil.days(10), latestTime() + durationUtil.days(10), latestTime() + durationUtil.days(10)],
                [true, true, true, true],
                {
                    from: token_owner,
                    gas: 6000000
                });

            assert.equal(tx.logs[0].args._investor, I_VestingEscrowWallet.address);
            assert.equal(tx.logs[1].args._investor, account_beneficiary1);
            assert.equal(tx.logs[2].args._investor, account_beneficiary2);
            assert.equal(tx.logs[3].args._investor, account_beneficiary3);
        });

        it("Should successfully add the delegate", async() => {
            let tx = await I_GeneralPermissionManager.addDelegate(wallet_admin, delegateDetails, { from: token_owner});
            assert.equal(tx.logs[0].args._delegate, wallet_admin);
        });

        it("Should provide the permission", async() => {
            let tx = await I_GeneralPermissionManager.changePermission(
                wallet_admin,
                I_VestingEscrowWallet.address,
                "ADMIN",
                true,
                {from: token_owner}
            );
            assert.equal(tx.logs[0].args._delegate, wallet_admin);
        });

        it("Should get the permission", async () => {
            let perm = await I_VestingEscrowWallet.getPermissions.call();
            assert.equal(web3.utils.toAscii(perm[0]).replace(/\u0000/g, ""), "ADMIN");
        });

        it("Should get the tags of the factory", async () => {
            let tags = await I_VestingEscrowWalletFactory.getTags.call();
            assert.equal(tags.length, 2);
            assert.equal(web3.utils.toAscii(tags[0]).replace(/\u0000/g, ""), "Vested Wallet");
            assert.equal(web3.utils.toAscii(tags[1]).replace(/\u0000/g, ""), "Escrow");
        });

        it("Should get the instructions of the factory", async () => {
            assert.equal(
                (await I_VestingEscrowWalletFactory.getInstructions.call()).replace(/\u0000/g, ""),
                "Issuer can send tokens to and then select the address that would be able to withdraw them according to their specific vesting schedule." +
            "");
        });

    });

    describe("Depositing and withdrawing tokens", async () => {

        it("Should fail to deposit zero amount of tokens", async () => {
            await catchRevert(
                I_VestingEscrowWallet.depositTokens(0, {from: wallet_admin})
            );
        });

        it("Should not be able to deposit -- fail because of permissions check", async () => {
            let numberOfTokens = 25000;
            await I_SecurityToken.approve(I_VestingEscrowWallet.address, numberOfTokens, { from: token_owner });
            await catchRevert(
                I_VestingEscrowWallet.depositTokens(25000, {from: account_beneficiary1})
            );
        });

        it("Should deposit tokens for new vesting schedules", async () => {
            let numberOfTokens = 25000;
            await I_SecurityToken.approve(I_VestingEscrowWallet.address, numberOfTokens, { from: token_owner });
            const tx = await I_VestingEscrowWallet.depositTokens(numberOfTokens, {from: wallet_admin});

            assert.equal(tx.logs[0].args._numberOfTokens, numberOfTokens);

            let unassignedTokens = await I_VestingEscrowWallet.unassignedTokens.call();
            assert.equal(unassignedTokens, numberOfTokens);

            let balance = await I_SecurityToken.balanceOf.call(I_VestingEscrowWallet.address);
            assert.equal(balance.toNumber(), numberOfTokens);
        });

        it("Should not be able to withdraw tokens to a treasury -- fail because of permissions check", async () => {
            await catchRevert(
                I_VestingEscrowWallet.sendToTreasury({from: account_beneficiary1})
            );
        });

        it("Should withdraw tokens to a treasury", async () => {
            let numberOfTokens = 25000;
            const tx = await I_VestingEscrowWallet.sendToTreasury({from: wallet_admin});

            assert.equal(tx.logs[0].args._numberOfTokens, numberOfTokens);

            let unassignedTokens = await I_VestingEscrowWallet.unassignedTokens.call();
            assert.equal(unassignedTokens, 0);

            let balance = await I_SecurityToken.balanceOf.call(I_VestingEscrowWallet.address);
            assert.equal(balance.toNumber(), 0);
        });

        it("Should not be able to push available tokens -- fail because of permissions check", async () => {
            let numberOfTokens = 75000;
            let duration = durationUtil.seconds(30);
            let frequency = durationUtil.seconds(10);
            let timeShift = durationUtil.seconds(100);
            let startTime = latestTime() + timeShift;
            await I_SecurityToken.approve(I_VestingEscrowWallet.address, numberOfTokens, { from: token_owner });
            await I_VestingEscrowWallet.depositTokens(numberOfTokens, {from: wallet_admin});
            await I_VestingEscrowWallet.addSchedule(account_beneficiary3, numberOfTokens, duration, frequency, startTime, {from: wallet_admin});
            await increaseTime(timeShift + frequency);

            await catchRevert(
                I_VestingEscrowWallet.pushAvailableTokens(account_beneficiary3, {from: account_beneficiary1})
            );
        });

        it("Should push available tokens to the beneficiary address", async () => {
            let numberOfTokens = 75000;
            const tx = await I_VestingEscrowWallet.pushAvailableTokens(account_beneficiary3, {from: wallet_admin});
            assert.equal(tx.logs[0].args._beneficiary, account_beneficiary3);
            assert.equal(tx.logs[0].args._numberOfTokens.toNumber(), numberOfTokens / 3);

            let balance = await I_SecurityToken.balanceOf.call(account_beneficiary3);
            assert.equal(balance.toNumber(), numberOfTokens / 3);

            await I_SecurityToken.transfer(token_owner, balance, {from: account_beneficiary3});
        });

        it("Should fail to modify vesting schedule -- fail because schedule already started", async () => {
            let numberOfTokens = 75000;
            let duration = durationUtil.seconds(30);
            let frequency = durationUtil.seconds(10);
            let timeShift = durationUtil.seconds(100);
            let startTime = latestTime() + timeShift;
            await catchRevert(
                I_VestingEscrowWallet.modifySchedule(account_beneficiary3, 0, numberOfTokens, duration, frequency, startTime, {from: wallet_admin})
            );

            await I_VestingEscrowWallet.revokeAllSchedules(account_beneficiary3, {from: wallet_admin});
            await I_VestingEscrowWallet.sendToTreasury({from: wallet_admin});
        });

        it("Should withdraw available tokens to the beneficiary address", async () => {
            let numberOfTokens = 33000;
            let duration = durationUtil.seconds(30);
            let frequency = durationUtil.seconds(10);
            let timeShift = durationUtil.seconds(100);
            let startTime = latestTime() + timeShift;
            await I_SecurityToken.approve(I_VestingEscrowWallet.address, numberOfTokens, { from: token_owner });
            await I_VestingEscrowWallet.depositTokens(numberOfTokens, {from: wallet_admin});
            await I_VestingEscrowWallet.addSchedule(account_beneficiary3, numberOfTokens, duration, frequency, startTime, {from: wallet_admin});
            await increaseTime(timeShift + frequency * 3);

            const tx = await I_VestingEscrowWallet.withdrawAvailableTokens({from: account_beneficiary3});
            assert.equal(tx.logs[0].args._beneficiary, account_beneficiary3);
            assert.equal(tx.logs[0].args._numberOfTokens.toNumber(), numberOfTokens);

            let balance = await I_SecurityToken.balanceOf.call(account_beneficiary3);
            assert.equal(balance.toNumber(), numberOfTokens);

            let schedule = await I_VestingEscrowWallet.getSchedule.call(account_beneficiary3, 0);
            checkSchedule(schedule, numberOfTokens, duration, frequency, startTime, COMPLETED);

            await I_SecurityToken.transfer(token_owner, balance, {from: account_beneficiary3});
            await I_VestingEscrowWallet.revokeAllSchedules(account_beneficiary3, {from: wallet_admin});
            await I_VestingEscrowWallet.sendToTreasury({from: wallet_admin});
        });

        it("Should withdraw available tokens 2 times by 3 schedules to the beneficiary address", async () => {
            let schedules = [
                {
                    numberOfTokens: 100000,
                    duration: durationUtil.minutes(4),
                    frequency: durationUtil.minutes(1)
                },
                {
                    numberOfTokens: 30000,
                    duration: durationUtil.minutes(6),
                    frequency: durationUtil.minutes(1)
                },
                {
                    numberOfTokens: 2000,
                    duration: durationUtil.minutes(10),
                    frequency: durationUtil.minutes(1)
                }
            ];

            let totalNumberOfTokens = getTotalNumberOfTokens(schedules);
            await I_SecurityToken.approve(I_VestingEscrowWallet.address, totalNumberOfTokens, {from: token_owner});
            await I_VestingEscrowWallet.depositTokens(totalNumberOfTokens, {from: wallet_admin});
            for (let i = 0; i < schedules.length; i++) {
                let numberOfTokens = schedules[i].numberOfTokens;
                let duration = schedules[i].duration;
                let frequency = schedules[i].frequency;
                let startTime = latestTime() + durationUtil.seconds(100);
                await I_VestingEscrowWallet.addSchedule(account_beneficiary3, numberOfTokens, duration, frequency, startTime, {from: wallet_admin});
            }
            let stepCount = 6;
            await increaseTime(durationUtil.minutes(stepCount) + durationUtil.seconds(100));

            let numberOfTokens = 100000 + (30000 / 6 * stepCount) + (2000 / 10 * stepCount);
            const tx = await I_VestingEscrowWallet.withdrawAvailableTokens({from: account_beneficiary3});

            assert.equal(tx.logs[0].args._beneficiary, account_beneficiary3);
            assert.equal(tx.logs[0].args._numberOfTokens.toNumber(), 100000);
            assert.equal(tx.logs[1].args._beneficiary, account_beneficiary3);
            assert.equal(tx.logs[1].args._numberOfTokens.toNumber(), 30000 / 6 * stepCount);
            assert.equal(tx.logs[2].args._beneficiary, account_beneficiary3);
            assert.equal(tx.logs[2].args._numberOfTokens.toNumber(), 2000 / 10 * stepCount);

            let balance = await I_SecurityToken.balanceOf.call(account_beneficiary3);
            assert.equal(balance.toNumber(), numberOfTokens);

            stepCount = 4;
            await increaseTime(durationUtil.minutes(stepCount) + durationUtil.seconds(100));

            const tx2 = await I_VestingEscrowWallet.withdrawAvailableTokens({from: account_beneficiary3});
            assert.equal(tx2.logs[0].args._beneficiary, account_beneficiary3);
            assert.equal(tx2.logs[0].args._numberOfTokens.toNumber(), 2000 / 10 * stepCount);

            balance = await I_SecurityToken.balanceOf.call(account_beneficiary3);
            assert.equal(balance.toNumber(), totalNumberOfTokens);

            await I_SecurityToken.transfer(token_owner, balance, {from: account_beneficiary3});
            await I_VestingEscrowWallet.revokeAllSchedules(account_beneficiary3, {from: wallet_admin});
            await I_VestingEscrowWallet.sendToTreasury({from: wallet_admin});
        });

    });

    describe("Adding, modifying and revoking vesting schedule", async () => {

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

        it("Should fail to add vesting schedule to the beneficiary address -- fail because address in invalid", async () => {
            await catchRevert(
                I_VestingEscrowWallet.addSchedule(0, 100000, 4, 1, latestTime() + durationUtil.days(1), {from: wallet_admin})
            );
        });

        it("Should fail to add vesting schedule to the beneficiary address -- fail because start date in the past", async () => {
            await catchRevert(
                I_VestingEscrowWallet.addSchedule(account_beneficiary1, 100000, 4, 1, latestTime() - durationUtil.days(1), {from: wallet_admin})
            );
        });

        it("Should fail to add vesting schedule to the beneficiary address -- fail because number of tokens is 0", async () => {
            await catchRevert(
                I_VestingEscrowWallet.addSchedule(account_beneficiary1, 0, 4, 1, latestTime() + durationUtil.days(1), {from: wallet_admin})
            );
        });

        it("Should fail to add vesting schedule to the beneficiary address -- fail because duration can't be divided entirely by frequency", async () => {
            await catchRevert(
                I_VestingEscrowWallet.addSchedule(account_beneficiary1, 100000, 4, 3, latestTime() + durationUtil.days(1), {from: wallet_admin})
            );
        });

        it("Should fail to add vesting schedule to the beneficiary address -- fail because number of tokens can't be divided entirely by period count", async () => {
            await catchRevert(
                I_VestingEscrowWallet.addSchedule(account_beneficiary1, 5, 4, 1, latestTime() + durationUtil.days(1), {from: wallet_admin})
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

        it("Should not be able to add schedule -- fail because of permissions check", async () => {
            let numberOfTokens = schedules[0].numberOfTokens;
            let duration = schedules[0].duration;
            let frequency = schedules[0].frequency;
            let startTime = schedules[0].startTime;
            await I_SecurityToken.approve(I_VestingEscrowWallet.address, numberOfTokens, {from: token_owner});
            await I_VestingEscrowWallet.depositTokens(numberOfTokens, {from: wallet_admin});
            await catchRevert(
                I_VestingEscrowWallet.addSchedule(account_beneficiary1, numberOfTokens, duration, frequency, startTime, {from: account_beneficiary1})
            );
            await I_VestingEscrowWallet.sendToTreasury({from: wallet_admin});
        });

        it("Should add vesting schedule to the beneficiary address", async () => {
            let numberOfTokens = schedules[0].numberOfTokens;
            let duration = schedules[0].duration;
            let frequency = schedules[0].frequency;
            let startTime = schedules[0].startTime;
            await I_SecurityToken.approve(I_VestingEscrowWallet.address, numberOfTokens, {from: token_owner});
            await I_VestingEscrowWallet.depositTokens(numberOfTokens, {from: wallet_admin});
            const tx = await I_VestingEscrowWallet.addSchedule(account_beneficiary1, numberOfTokens, duration, frequency, startTime, {from: wallet_admin});

            checkScheduleLog(tx.logs[0], account_beneficiary1, numberOfTokens, duration, frequency, startTime);

            let scheduleCount = await I_VestingEscrowWallet.getScheduleCount.call(account_beneficiary1);
            assert.equal(scheduleCount, 1);

            let schedule = await I_VestingEscrowWallet.getSchedule.call(account_beneficiary1, 0);
            checkSchedule(schedule, numberOfTokens, duration, frequency, startTime, CREATED);
        });

        it("Should add vesting schedule without depositing to the beneficiary address", async () => {
            let numberOfTokens = schedules[0].numberOfTokens;
            let duration = schedules[0].duration;
            let frequency = schedules[0].frequency;
            let startTime = schedules[0].startTime;
            await I_SecurityToken.approve(I_VestingEscrowWallet.address, numberOfTokens, {from: token_owner});
            const tx = await I_VestingEscrowWallet.addSchedule(account_beneficiary1, numberOfTokens, duration, frequency, startTime, {from: wallet_admin});

            assert.equal(tx.logs[0].args._numberOfTokens, numberOfTokens);
            checkScheduleLog(tx.logs[1], account_beneficiary1, numberOfTokens, duration, frequency, startTime);

            let scheduleCount = await I_VestingEscrowWallet.getScheduleCount.call(account_beneficiary1);
            assert.equal(scheduleCount, 2);

            let schedule = await I_VestingEscrowWallet.getSchedule.call(account_beneficiary1, 1);
            checkSchedule(schedule, numberOfTokens, duration, frequency, startTime, CREATED);

            await I_VestingEscrowWallet.revokeSchedule(account_beneficiary1, 1, {from: wallet_admin});




            await I_VestingEscrowWallet.sendToTreasury({from: wallet_admin});
        });

        it("Should fail to modify vesting schedule -- fail because schedule not found", async () => {
            let numberOfTokens = schedules[0].numberOfTokens;
            let duration = schedules[0].duration;
            let frequency = schedules[0].frequency;
            let startTime = schedules[0].startTime;
            await catchRevert(
                I_VestingEscrowWallet.modifySchedule(account_beneficiary1, 2, numberOfTokens, duration, frequency, startTime, {from: wallet_admin})
            );
        });

        it("Should not be able to modify schedule -- fail because of permissions check", async () => {
            await catchRevert(
                I_VestingEscrowWallet.modifySchedule(account_beneficiary1, 0, 10000, 4, 1, latestTime() + 100, {from: account_beneficiary1})
            );
        });

        it("Should modify vesting schedule for the beneficiary's address", async () => {
            let numberOfTokens = schedules[1].numberOfTokens;
            let duration = schedules[1].duration;
            let frequency = schedules[1].frequency;
            let startTime = schedules[1].startTime;
            const tx = await I_VestingEscrowWallet.modifySchedule(account_beneficiary1, 0, numberOfTokens, duration, frequency, startTime, {from: wallet_admin});

            checkScheduleLog(tx.logs[0], account_beneficiary1, numberOfTokens, duration, frequency, startTime);

            let scheduleCount = await I_VestingEscrowWallet.getScheduleCount.call(account_beneficiary1);
            assert.equal(scheduleCount.toNumber(), 1);

            let schedule = await I_VestingEscrowWallet.getSchedule.call(account_beneficiary1, 0);
            checkSchedule(schedule, numberOfTokens, duration, frequency, startTime, CREATED);

            let unassignedTokens = await I_VestingEscrowWallet.unassignedTokens.call();
            assert.equal(unassignedTokens.toNumber(), schedules[0].numberOfTokens - schedules[1].numberOfTokens);

            await I_VestingEscrowWallet.sendToTreasury({from: wallet_admin});
        });

        it("Should modify vesting schedule without depositing for the beneficiary's address", async () => {
            let numberOfTokens = schedules[0].numberOfTokens + schedules[1].numberOfTokens;
            let duration = schedules[0].duration;
            let frequency = schedules[0].frequency;
            let startTime = schedules[0].startTime;
            await I_SecurityToken.approve(I_VestingEscrowWallet.address, numberOfTokens, {from: token_owner});
            const tx = await I_VestingEscrowWallet.modifySchedule(account_beneficiary1, 0, numberOfTokens, duration, frequency, startTime, {from: wallet_admin});

            assert.equal(tx.logs[0].args._numberOfTokens.toNumber(), schedules[0].numberOfTokens);
            checkScheduleLog(tx.logs[1], account_beneficiary1, numberOfTokens, duration, frequency, startTime);

            let scheduleCount = await I_VestingEscrowWallet.getScheduleCount.call(account_beneficiary1);
            assert.equal(scheduleCount, 1);

            let schedule = await I_VestingEscrowWallet.getSchedule.call(account_beneficiary1, 0);
            checkSchedule(schedule, numberOfTokens, duration, frequency, startTime, CREATED);

            let unassignedTokens = await I_VestingEscrowWallet.unassignedTokens.call();
            assert.equal(unassignedTokens.toNumber(), 0);
        });

        it("Should not be able to revoke schedule -- fail because of permissions check", async () => {
            await catchRevert(
                I_VestingEscrowWallet.revokeSchedule(account_beneficiary1, 0, {from: account_beneficiary1})
            );
        });

        it("Should revoke vesting schedule from the beneficiary address", async () => {
            const tx = await I_VestingEscrowWallet.revokeSchedule(account_beneficiary1, 0, {from: wallet_admin});
            await I_VestingEscrowWallet.sendToTreasury({from: wallet_admin});

            assert.equal(tx.logs[0].args._beneficiary, account_beneficiary1);
            assert.equal(tx.logs[0].args._index, 0);

            let scheduleCount = await I_VestingEscrowWallet.getScheduleCount.call(account_beneficiary1);
            assert.equal(scheduleCount, 0);
        });

        it("Should fail to revoke vesting schedule -- fail because address is invalid", async () => {
            await catchRevert(
                I_VestingEscrowWallet.revokeSchedule(0, 0, {from: wallet_admin})
            );
        });

        it("Should fail to revoke vesting schedule -- fail because schedule not found", async () => {
            await catchRevert(
                I_VestingEscrowWallet.revokeSchedule(account_beneficiary1, 1, {from: wallet_admin})
            );
        });

        it("Should fail to revoke vesting schedules -- fail because address is invalid", async () => {
            await catchRevert(
                I_VestingEscrowWallet.revokeAllSchedules(0, {from: wallet_admin})
            );
        });

        it("Should add 3 vesting schedules to the beneficiary address", async () => {
            let totalNumberOfTokens = getTotalNumberOfTokens(schedules);
            await I_SecurityToken.approve(I_VestingEscrowWallet.address, totalNumberOfTokens, {from: token_owner});
            await I_VestingEscrowWallet.depositTokens(totalNumberOfTokens, {from: wallet_admin});
            for (let i = 0; i < schedules.length; i++) {
                let numberOfTokens = schedules[i].numberOfTokens;
                let duration = schedules[i].duration;
                let frequency = schedules[i].frequency;
                let startTime = schedules[i].startTime;
                const tx = await I_VestingEscrowWallet.addSchedule(account_beneficiary2, numberOfTokens, duration, frequency, startTime, {from: wallet_admin});

                checkScheduleLog(tx.logs[0], account_beneficiary2, numberOfTokens, duration, frequency, startTime);

                let scheduleCount = await I_VestingEscrowWallet.getScheduleCount.call(account_beneficiary2);
                assert.equal(scheduleCount, i + 1);

                let schedule = await I_VestingEscrowWallet.getSchedule.call(account_beneficiary2, i);
                checkSchedule(schedule, numberOfTokens, duration, frequency, startTime, CREATED);
            }
        });

        it("Should not be able to revoke schedules -- fail because of permissions check", async () => {
            await catchRevert(
                I_VestingEscrowWallet.revokeAllSchedules(account_beneficiary1, {from: account_beneficiary1})
            );
        });

        it("Should revoke vesting schedule from the beneficiary address", async () => {
            const tx = await I_VestingEscrowWallet.revokeSchedule(account_beneficiary2, 1, {from: wallet_admin});
            await I_VestingEscrowWallet.sendToTreasury({from: wallet_admin});

            assert.equal(tx.logs[0].args._beneficiary, account_beneficiary2);
            assert.equal(tx.logs[0].args._index, 1);

            let scheduleCount = await I_VestingEscrowWallet.getScheduleCount.call(account_beneficiary2);
            assert.equal(scheduleCount, 2);

            let schedule = await I_VestingEscrowWallet.getSchedule.call(account_beneficiary2, 1);
            checkSchedule(schedule, schedules[2].numberOfTokens, schedules[2].duration, schedules[2].frequency, schedules[2].startTime, CREATED);
        });

        it("Should revoke 2 vesting schedules from the beneficiary address", async () => {
            const tx = await I_VestingEscrowWallet.revokeAllSchedules(account_beneficiary2, {from: wallet_admin});
            await I_VestingEscrowWallet.sendToTreasury({from: wallet_admin});

            assert.equal(tx.logs[0].args._beneficiary, account_beneficiary2);

            let scheduleCount = await I_VestingEscrowWallet.getScheduleCount.call(account_beneficiary2);
            assert.equal(scheduleCount, 0);
        });

        it("Should push available tokens during revoking vesting schedule", async () => {
            let schedules = [
                {
                    numberOfTokens: 100000,
                    duration: durationUtil.minutes(4),
                    frequency: durationUtil.minutes(1)
                },
                {
                    numberOfTokens: 30000,
                    duration: durationUtil.minutes(6),
                    frequency: durationUtil.minutes(1)
                },
                {
                    numberOfTokens: 2000,
                    duration: durationUtil.minutes(10),
                    frequency: durationUtil.minutes(1)
                }
            ];

            let totalNumberOfTokens = getTotalNumberOfTokens(schedules);
            await I_SecurityToken.approve(I_VestingEscrowWallet.address, totalNumberOfTokens, {from: token_owner});
            await I_VestingEscrowWallet.depositTokens(totalNumberOfTokens, {from: wallet_admin});
            for (let i = 0; i < schedules.length; i++) {
                let numberOfTokens = schedules[i].numberOfTokens;
                let duration = schedules[i].duration;
                let frequency = schedules[i].frequency;
                let startTime = latestTime() + durationUtil.seconds(100);
                await I_VestingEscrowWallet.addSchedule(account_beneficiary3, numberOfTokens, duration, frequency, startTime, {from: wallet_admin});
            }
            let stepCount = 3;
            await increaseTime(durationUtil.minutes(stepCount) + durationUtil.seconds(100));

            const tx = await I_VestingEscrowWallet.revokeSchedule(account_beneficiary3, 0, {from: wallet_admin});
            assert.equal(tx.logs[0].args._beneficiary, account_beneficiary3);
            assert.equal(tx.logs[0].args._numberOfTokens.toNumber(), 100000 / 4 * stepCount);

            let balance = await I_SecurityToken.balanceOf.call(account_beneficiary3);
            assert.equal(balance.toNumber(), 100000 / 4 * stepCount);

            stepCount = 7;
            await increaseTime(durationUtil.minutes(stepCount));

            const tx2 = await I_VestingEscrowWallet.revokeAllSchedules(account_beneficiary3, {from: wallet_admin});
            assert.equal(tx2.logs[0].args._beneficiary, account_beneficiary3);
            assert.equal(tx2.logs[0].args._numberOfTokens.toNumber(), 2000);
            assert.equal(tx2.logs[1].args._beneficiary, account_beneficiary3);
            assert.equal(tx2.logs[1].args._numberOfTokens.toNumber(), 30000);

            balance = await I_SecurityToken.balanceOf.call(account_beneficiary3);
            assert.equal(balance.toNumber(), totalNumberOfTokens - 100000 / 4);

            await I_SecurityToken.transfer(token_owner, balance, {from: account_beneficiary3});
            await I_VestingEscrowWallet.sendToTreasury({from: wallet_admin});
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

        it("Should not be able to add template -- fail because of permissions check", async () => {
            await catchRevert(
                I_VestingEscrowWallet.addTemplate(25000, 4, 1, {from: account_beneficiary1})
            );
        });

        it("Should add 3 Templates", async () => {
            for (let i = 0; i < schedules.length; i++) {
                let numberOfTokens = schedules[i].numberOfTokens;
                let duration = schedules[i].duration;
                let frequency = schedules[i].frequency;
                const tx = await I_VestingEscrowWallet.addTemplate(numberOfTokens, duration, frequency, {from: wallet_admin});

                assert.equal(tx.logs[0].args._numberOfTokens.toNumber(), numberOfTokens);
                assert.equal(tx.logs[0].args._duration.toNumber(), duration);
                assert.equal(tx.logs[0].args._frequency.toNumber(), frequency);
            }
        });

        it("Should not be able to remove template -- fail because of permissions check", async () => {
            await catchRevert(
                I_VestingEscrowWallet.removeTemplate(1, {from: account_beneficiary1})
            );
        });

        it("Should remove template", async () => {
            const tx = await I_VestingEscrowWallet.removeTemplate(1, {from: wallet_admin});

            assert.equal(tx.logs[0].args._index, 1);
        });

        it("Should fail to add vesting schedule from template -- fail because template not found", async () => {
            let startTime = schedules[2].startTime;
            await catchRevert(
                I_VestingEscrowWallet.addScheduleFromTemplate(account_beneficiary1, 1, startTime, {from: wallet_admin})
            );
        });

        it("Should not be able to add schedule from template -- fail because of permissions check", async () => {
            await catchRevert(
                I_VestingEscrowWallet.addScheduleFromTemplate(account_beneficiary1, 0, latestTime(), {from: account_beneficiary1})
            );
        });

        it("Should add vesting schedule from template", async () => {
            let numberOfTokens = schedules[2].numberOfTokens;
            let duration = schedules[2].duration;
            let frequency = schedules[2].frequency;
            let startTime = schedules[2].startTime;
            await I_SecurityToken.approve(I_VestingEscrowWallet.address, numberOfTokens, { from: token_owner });
            await I_VestingEscrowWallet.depositTokens(numberOfTokens, {from: wallet_admin});
            const tx = await I_VestingEscrowWallet.addScheduleFromTemplate(account_beneficiary1, 1, startTime, {from: wallet_admin});

            checkScheduleLog(tx.logs[0], account_beneficiary1, numberOfTokens, duration, frequency, startTime);

            let scheduleCount = await I_VestingEscrowWallet.getScheduleCount.call(account_beneficiary1);
            assert.equal(scheduleCount, 1);

            let schedule = await I_VestingEscrowWallet.getSchedule.call(account_beneficiary1, 0);
            checkSchedule(schedule, numberOfTokens, duration, frequency, startTime, CREATED);

            await I_VestingEscrowWallet.revokeSchedule(account_beneficiary1, 0, {from: wallet_admin});
            await I_VestingEscrowWallet.sendToTreasury({from: wallet_admin});
        });

        it("Should fail to remove template", async () => {
            await catchRevert(
                I_VestingEscrowWallet.removeTemplate(2, {from: wallet_admin})
            );
        });

        it("Should remove 2 Templates", async () => {
            await I_VestingEscrowWallet.removeTemplate(0, {from: wallet_admin});
            await I_VestingEscrowWallet.removeTemplate(0, {from: wallet_admin});

            let templateCount = await I_VestingEscrowWallet.getTemplateCount.call({from: wallet_admin});
            assert.equal(templateCount, 0);
        });

    });

    describe("Tests for multi operations", async () => {

        it("Should not be able to add schedules to the beneficiaries -- fail because of permissions check", async () => {
            let startTimes = [latestTime() + 100, latestTime() + 100, latestTime() + 100];
            await catchRevert(
                I_VestingEscrowWallet.addScheduleMulti(beneficiaries, [10000, 10000, 10000], [4, 4, 4], [1, 1, 1], startTimes, {from: account_beneficiary1})
            );
        });

        it("Should not be able to add schedules to the beneficiaries -- fail because of arrays sizes mismatch", async () => {
            let startTimes = [latestTime() + 100, latestTime() + 100, latestTime() + 100];
            let totalNumberOfTokens = 60000;
            await I_SecurityToken.approve(I_VestingEscrowWallet.address, totalNumberOfTokens, {from: token_owner});
            await I_VestingEscrowWallet.depositTokens(totalNumberOfTokens, {from: wallet_admin});
            await catchRevert(
                I_VestingEscrowWallet.addScheduleMulti(beneficiaries, [20000, 30000, 10000], [4, 4], [1, 1, 1], startTimes, {from: wallet_admin})
            );
            I_VestingEscrowWallet.sendToTreasury({from: wallet_admin});
        });

        it("Should add schedules for 3 beneficiaries", async () => {
            let numberOfTokens = [20000, 30000, 10000];
            let durations = [durationUtil.weeks(4), durationUtil.weeks(3), durationUtil.weeks(4)];
            let frequencies = [durationUtil.weeks(2), durationUtil.weeks(1), durationUtil.weeks(1)];
            let startTimes = [latestTime() + durationUtil.days(1), latestTime() + durationUtil.days(2), latestTime() + durationUtil.days(3)];

            let totalNumberOfTokens = 60000;
            await I_SecurityToken.approve(I_VestingEscrowWallet.address, totalNumberOfTokens, {from: token_owner});
            await I_VestingEscrowWallet.depositTokens(totalNumberOfTokens, {from: wallet_admin});

            let tx = await I_VestingEscrowWallet.addScheduleMulti(beneficiaries, numberOfTokens, durations, frequencies, startTimes, {from: wallet_admin});

            for (let i = 0; i < beneficiaries.length; i++) {
                let log = tx.logs[i];
                let beneficiary = beneficiaries[i];
                checkScheduleLog(log, beneficiary, numberOfTokens[i], durations[i], frequencies[i], startTimes[i]);

                let scheduleCount = await I_VestingEscrowWallet.getScheduleCount.call(beneficiary);
                assert.equal(scheduleCount, 1);

                let schedule = await I_VestingEscrowWallet.getSchedule.call(beneficiary, 0);
                checkSchedule(schedule, numberOfTokens[i], durations[i], frequencies[i], startTimes[i], CREATED);
            }
        });

        it("Should not be able modify vesting schedule for 3 beneficiary's addresses -- fail because of arrays sizes mismatch", async () => {
            let numberOfTokens = [25000, 25000, 25000];
            let durations = [durationUtil.seconds(50), durationUtil.seconds(50), durationUtil.seconds(50)];
            let frequencies = [durationUtil.seconds(10), durationUtil.seconds(10), durationUtil.seconds(10)];
            let timeShift = durationUtil.seconds(100);
            let startTimes = [latestTime() + timeShift, latestTime() + timeShift, latestTime() + timeShift];

            let indexes = [0, 0, 0, 0];
            await catchRevert(
                I_VestingEscrowWallet.modifyScheduleMulti(beneficiaries, indexes, numberOfTokens, durations, frequencies, startTimes, {from: wallet_admin})
            );
        });

        it("Should not be able to modify schedules for the beneficiaries -- fail because of permissions check", async () => {
            let numberOfTokens = [25000, 25000, 25000];
            let durations = [durationUtil.seconds(50), durationUtil.seconds(50), durationUtil.seconds(50)];
            let frequencies = [durationUtil.seconds(10), durationUtil.seconds(10), durationUtil.seconds(10)];
            let timeShift = durationUtil.seconds(100);
            let startTimes = [latestTime() + timeShift, latestTime() + timeShift, latestTime() + timeShift];

            let indexes = [0, 0, 0];
            await catchRevert(
                I_VestingEscrowWallet.modifyScheduleMulti(beneficiaries, indexes, numberOfTokens, durations, frequencies, startTimes, {from: account_beneficiary1})
            );
        });

        it("Should modify vesting schedule for 3 beneficiary's addresses", async () => {
            let numberOfTokens = [15000, 15000, 15000];
            let durations = [durationUtil.seconds(50), durationUtil.seconds(50), durationUtil.seconds(50)];
            let frequencies = [durationUtil.seconds(10), durationUtil.seconds(10), durationUtil.seconds(10)];
            let timeShift = durationUtil.seconds(100);
            let startTimes = [latestTime() + timeShift, latestTime() + timeShift, latestTime() + timeShift];

            let indexes = [0, 0, 0];
            const tx = await I_VestingEscrowWallet.modifyScheduleMulti(beneficiaries, indexes, numberOfTokens, durations, frequencies, startTimes, {from: wallet_admin});
            await increaseTime(timeShift + frequencies[0]);

            for (let i = 0; i < beneficiaries.length; i++) {
                let log = tx.logs[i];
                let beneficiary = beneficiaries[i];
                checkScheduleLog(log, beneficiary, numberOfTokens[i], durations[i], frequencies[i], startTimes[i]);

                let scheduleCount = await I_VestingEscrowWallet.getScheduleCount.call(beneficiary);
                assert.equal(scheduleCount, 1);

                let schedule = await I_VestingEscrowWallet.getSchedule.call(beneficiary, 0);
                checkSchedule(schedule, numberOfTokens[i], durations[i], frequencies[i], startTimes[i], STARTED);
            }

            let unassignedTokens = await I_VestingEscrowWallet.unassignedTokens.call();
            assert.equal(unassignedTokens.toNumber(), 5000 * beneficiaries.length);
        });

        it("Should not be able to send available tokens to the beneficiaries addresses -- fail because of array size", async () => {
            await catchRevert(
                I_VestingEscrowWallet.pushAvailableTokensMulti([account_beneficiary1], {from: wallet_admin})
            );
        });

        it("Should not be able to send available tokens to the beneficiaries -- fail because of permissions check", async () => {
            await catchRevert(
                I_VestingEscrowWallet.pushAvailableTokensMulti([account_beneficiary1], {from: account_beneficiary1})
            );
        });

        it("Should send available tokens to the beneficiaries addresses", async () => {
            const tx = await I_VestingEscrowWallet.pushAvailableTokensMulti(beneficiaries, {from: wallet_admin});

            for (let i = 0; i < beneficiaries.length; i++) {
                let log = tx.logs[i];
                let beneficiary = beneficiaries[i];
                assert.equal(log.args._beneficiary, beneficiary);
                assert.equal(log.args._numberOfTokens.toNumber(), 3000);

                let balance = await I_SecurityToken.balanceOf.call(beneficiary);
                assert.equal(balance.toNumber(), 3000);

                await I_SecurityToken.transfer(token_owner, balance, {from: beneficiary});
                await I_VestingEscrowWallet.revokeAllSchedules(beneficiary, {from: wallet_admin});
                await I_VestingEscrowWallet.sendToTreasury({from: wallet_admin});
            }
        });

        it("Should not be able to add schedules from template to the beneficiaries -- fail because of permissions check", async () => {
            let numberOfTokens = 18000;
            let duration = durationUtil.weeks(3);
            let frequency = durationUtil.weeks(1);
            let startTimes = [latestTime() + durationUtil.seconds(100), latestTime() + durationUtil.seconds(100), latestTime() + durationUtil.seconds(100)];

            let totalNumberOfTokens = numberOfTokens * 3;
            await I_SecurityToken.approve(I_VestingEscrowWallet.address, totalNumberOfTokens, {from: token_owner});
            await I_VestingEscrowWallet.depositTokens(totalNumberOfTokens, {from: wallet_admin});
            await I_VestingEscrowWallet.addTemplate(numberOfTokens, duration, frequency, {from: wallet_admin});

            await catchRevert(
                I_VestingEscrowWallet.addScheduleFromTemplateMulti(beneficiaries, 0, startTimes, {from: account_beneficiary1})
            );
        });

        it("Should add schedules from template for 3 beneficiaries", async () => {
            let numberOfTokens = 18000;
            let duration = durationUtil.weeks(3);
            let frequency = durationUtil.weeks(1);
            let startTimes = [latestTime() + durationUtil.seconds(100), latestTime() + durationUtil.seconds(100), latestTime() + durationUtil.seconds(100)];

            let totalNumberOfTokens = numberOfTokens * 3;
            await I_SecurityToken.approve(I_VestingEscrowWallet.address, totalNumberOfTokens, {from: token_owner});
            await I_VestingEscrowWallet.depositTokens(totalNumberOfTokens, {from: wallet_admin});
            await I_VestingEscrowWallet.addTemplate(numberOfTokens, duration, frequency, {from: wallet_admin});

            let tx = await I_VestingEscrowWallet.addScheduleFromTemplateMulti(beneficiaries, 0, startTimes, {from: wallet_admin});
            await I_VestingEscrowWallet.removeTemplate(0, {from: wallet_admin});

            for (let i = 0; i < beneficiaries.length; i++) {
                let log = tx.logs[i];
                let beneficiary = beneficiaries[i];
                checkScheduleLog(log, beneficiary, numberOfTokens, duration, frequency, startTimes[i]);

                let scheduleCount = await I_VestingEscrowWallet.getScheduleCount.call(beneficiary);
                assert.equal(scheduleCount.toNumber(), 1);

                let schedule = await I_VestingEscrowWallet.getSchedule.call(beneficiary, 0);
                checkSchedule(schedule, numberOfTokens, duration, frequency, startTimes[i], CREATED);
            }

        });

        it("Should not be able to revoke schedules of the beneficiaries -- fail because of permissions check", async () => {
            await catchRevert(
                I_VestingEscrowWallet.revokeSchedulesMulti([account_beneficiary1], {from: account_beneficiary1})
            );
        });

        it("Should revoke vesting schedule from the 3 beneficiary's addresses", async () => {
            const tx = await I_VestingEscrowWallet.revokeSchedulesMulti(beneficiaries, {from: wallet_admin});

            for (let i = 0; i < beneficiaries.length; i++) {
                let log = tx.logs[i];
                let beneficiary = beneficiaries[i];
                assert.equal(log.args._beneficiary, beneficiary);

                let scheduleCount = await I_VestingEscrowWallet.getScheduleCount.call(beneficiary);
                assert.equal(scheduleCount, 0);
            }

            await I_VestingEscrowWallet.trimBeneficiaries({from: wallet_admin});
            await I_VestingEscrowWallet.sendToTreasury({from: wallet_admin});
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

function checkSchedule(schedule, numberOfTokens, duration, frequency, startTime, state) {
    assert.equal(schedule[0].toNumber(), numberOfTokens);
    assert.equal(schedule[1].toNumber(), duration);
    assert.equal(schedule[2].toNumber(), frequency);
    assert.equal(schedule[3].toNumber(), startTime);
    assert.equal(schedule[4].toNumber(), state);
}

function getTotalNumberOfTokens(schedules) {
    let numberOfTokens = 0;
    for (let i = 0; i < schedules.length; i++) {
        numberOfTokens += schedules[i].numberOfTokens;
    }
    return numberOfTokens;
}
