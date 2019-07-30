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
const STGetter = artifacts.require("./STGetter.sol");
const Web3 = require('web3');
const BN = Web3.utils.BN;
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
    let wallet_operator;

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
    let I_STGetter;
    let stGetter;

    // SecurityToken Details
    const name = "Team";
    const symbol = "sap";
    const tokenDetails = "This is equity type of issuance";
    const decimals = 18;
    const contact = "team@polymath.network";
    const delegateDetails = web3.utils.toHex("Hello I am legit delegate");

    // Module key
    const delegateManagerKey = 1;
    const transferManagerKey = 2;
    const stoKey = 3;

    // Initial fee for ticker registry and security token registry
    const initRegFee = new BN(web3.utils.toWei("1000"));

    let currentTime;
    const address_zero = "0x0000000000000000000000000000000000000000";

    before(async () => {
        currentTime = new BN(await latestTime());
        // Accounts setup
        account_polymath = accounts[0];
        token_owner = accounts[1];
        wallet_admin = accounts[2];
        wallet_operator = accounts[3];

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
            I_STRProxied,
            I_STGetter
        ] = instances;

        // STEP 2: Deploy the GeneralDelegateManagerFactory
        [I_GeneralPermissionManagerFactory] = await deployGPMAndVerifyed(account_polymath, I_MRProxied, 0);

        // STEP 3: Deploy the VestingEscrowWallet
        [I_VestingEscrowWalletFactory] = await deployVestingEscrowWalletAndVerifyed(account_polymath, I_MRProxied, 0);

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
            let tx = await I_STRProxied.registerNewTicker(token_owner, symbol, { from : token_owner });
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

        it("Should successfully attach the General permission manager factory with the security token", async () => {
            const tx = await I_SecurityToken.addModule(I_GeneralPermissionManagerFactory.address, "0x", new BN(0), new BN(0), false, { from: token_owner });
            assert.equal(tx.logs[2].args._types[0].toString(), delegateManagerKey, "General Permission Manager doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name).replace(/\u0000/g, ""),
                "GeneralPermissionManager",
                "GeneralPermissionManagerFactory module was not added"
            );
            I_GeneralPermissionManager = await GeneralPermissionManager.at(tx.logs[2].args._module);
        });

        it("Should successfully attach the VestingEscrowWallet with the security token", async () => {
            let bytesData = encodeModuleCall(
                ["address"],
                [address_zero]
            );

            await I_SecurityToken.changeGranularity(1, {from: token_owner});
            const tx = await I_SecurityToken.addModule(I_VestingEscrowWalletFactory.address, bytesData, 0, 0, false, { from: token_owner });

            assert.equal(tx.logs[3].args._types[0].toString(), 7, "VestingEscrowWallet doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[3].args._name)
                    .replace(/\u0000/g, ''),
                "VestingEscrowWallet",
                "VestingEscrowWallet module was not added"
            );
            I_VestingEscrowWallet = await VestingEscrowWallet.at(tx.logs[3].args._module);
        });

        it("Should fail to change the treasury wallet", async() => {
            await catchRevert(
                I_VestingEscrowWallet.changeTreasuryWallet(token_owner, {from: account_beneficiary1})
            );
        })

        it("Should change the treasury wallet", async() => {
            await I_VestingEscrowWallet.changeTreasuryWallet(token_owner, {from: token_owner});
            assert.equal(await I_VestingEscrowWallet.treasuryWallet.call(), token_owner);
        });

        it("Should Buy the tokens for token_owner", async() => {
            // Add the Investor in to the whitelist
            let tx = await I_GeneralTransferManager.modifyKYCData(
                token_owner,
                currentTime,
                currentTime,
                currentTime.add(new BN(durationUtil.days(10))),
                {
                    from: token_owner,
                    gas: 6000000
                }
            );

            assert.equal(tx.logs[0].args._investor.toLowerCase(), token_owner.toLowerCase(), "Failed in adding the token_owner in whitelist");

            // Mint some tokens
            await I_SecurityToken.issue(token_owner, web3.utils.toHex(web3.utils.toWei('1', 'ether')), "0x0", { from: token_owner });

            assert.equal(
                (await I_SecurityToken.balanceOf(token_owner)).toString(),
                web3.utils.toWei('1', 'ether')
            );

        });

        it("Should whitelist investors", async() => {
            // Add the Investor in to the whitelist
            let tx = await I_GeneralTransferManager.modifyKYCDataMulti(
                [I_VestingEscrowWallet.address, account_beneficiary1, account_beneficiary2, account_beneficiary3],
                [currentTime, currentTime, currentTime, currentTime],
                [currentTime, currentTime, currentTime, currentTime],
                [currentTime.add(new BN(durationUtil.days(10))), currentTime.add(new BN(durationUtil.days(10))), currentTime.add(new BN(durationUtil.days(10))), currentTime.add(new BN(durationUtil.days(10)))],
                {
                    from: token_owner,
                    gas: 6000000
                });

            assert.equal(tx.logs[0].args._investor, I_VestingEscrowWallet.address);
            assert.equal(tx.logs[1].args._investor, account_beneficiary1);
            assert.equal(tx.logs[2].args._investor, account_beneficiary2);
            assert.equal(tx.logs[3].args._investor, account_beneficiary3);
        });

        it("Should successfully add the delegate (wallet_admin)", async() => {
            let tx = await I_GeneralPermissionManager.addDelegate(wallet_admin, delegateDetails, { from: token_owner});
            assert.equal(tx.logs[0].args._delegate, wallet_admin);
        });

        it("Should successfully add the delegate (wallet_operator)", async() => {
            let tx = await I_GeneralPermissionManager.addDelegate(wallet_operator, delegateDetails, { from: token_owner});
            assert.equal(tx.logs[0].args._delegate, wallet_operator);
        });

        it("Should provide the permission", async() => {
            let tx = await I_GeneralPermissionManager.changePermission(
                wallet_admin,
                I_VestingEscrowWallet.address,
                web3.utils.toHex("ADMIN"),
                true,
                {from: token_owner}
            );
            assert.equal(tx.logs[0].args._delegate, wallet_admin);
        });

        it("Should provide the permission", async() => {
            let tx = await I_GeneralPermissionManager.changePermission(
                wallet_operator,
                I_VestingEscrowWallet.address,
                web3.utils.toHex("OPERATOR"),
                true,
                {from: token_owner}
            );
            assert.equal(tx.logs[0].args._delegate, wallet_operator);
        });

        it("Should get the permission", async () => {
            let perm = await I_VestingEscrowWallet.getPermissions.call();
            assert.equal(web3.utils.toAscii(perm[0]).replace(/\u0000/g, ""), "ADMIN");
            assert.equal(web3.utils.toAscii(perm[1]).replace(/\u0000/g, ""), "OPERATOR");
        });

        it("Should get the tags of the factory", async () => {
            let tags = await I_VestingEscrowWalletFactory.getTags.call();
            assert.equal(tags.length, 3);
            assert.equal(web3.utils.toAscii(tags[0]).replace(/\u0000/g, ""), "Vesting");
            assert.equal(web3.utils.toAscii(tags[1]).replace(/\u0000/g, ""), "Escrow");
        });

    });

    describe("Depositing and withdrawing tokens", async () => {

        // it("Should not be able to change treasury wallet -- fail because address is invalid", async () => {
        //     await catchRevert(
        //         I_VestingEscrowWallet.changeTreasuryWallet(address_zero, {from: token_owner})
        //     );
        // });

        it("Should not be able to deposit -- fail because of permissions check", async () => {
            await catchRevert(
                I_VestingEscrowWallet.changeTreasuryWallet(account_beneficiary1, {from: account_beneficiary1})
            );
        });

        it("Should change treasury wallet", async () => {
            const tx = await I_VestingEscrowWallet.changeTreasuryWallet(account_beneficiary1, {from: token_owner});

            assert.equal(tx.logs[0].args._newWallet, account_beneficiary1);
            assert.equal(tx.logs[0].args._oldWallet, token_owner);
            let treasuryWallet = await I_VestingEscrowWallet.treasuryWallet.call();
            assert.equal(treasuryWallet, account_beneficiary1);

            await I_VestingEscrowWallet.changeTreasuryWallet(token_owner, {from: token_owner});
        });

        it("Should fail to deposit zero amount of tokens", async () => {
            await catchRevert(
                I_VestingEscrowWallet.depositTokens(0, {from: token_owner})
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
            const tx = await I_VestingEscrowWallet.depositTokens(numberOfTokens, {from: token_owner});

            assert.equal(tx.logs[0].args._numberOfTokens, numberOfTokens);

            let unassignedTokens = await I_VestingEscrowWallet.unassignedTokens.call();
            assert.equal(unassignedTokens, numberOfTokens);

            let balance = await I_SecurityToken.balanceOf.call(I_VestingEscrowWallet.address);
            assert.equal(balance.toString(), numberOfTokens);
        });

        it("Should not be able to withdraw tokens to a treasury -- fail because of permissions check", async () => {
            await catchRevert(
                I_VestingEscrowWallet.sendToTreasury(10, {from: account_beneficiary1})
            );
        });

        it("Should not be able to withdraw tokens to a treasury -- fail because of zero amount", async () => {
            await catchRevert(
                I_VestingEscrowWallet.sendToTreasury(0, {from: wallet_operator})
            );
        });

        it("Should not be able to withdraw tokens to a treasury -- fail because amount is greater than unassigned tokens", async () => {
            let numberOfTokens = 25000 * 2;
            await catchRevert(
                I_VestingEscrowWallet.sendToTreasury(numberOfTokens, {from: wallet_operator})
            );
        });

        it("Should withdraw partial tokens to a treasury", async () => {
            let numberOfTokens = 5000;
            const tx = await I_VestingEscrowWallet.sendToTreasury(numberOfTokens, {from: wallet_operator});

            assert.equal(tx.logs[0].args._numberOfTokens, numberOfTokens);

            let unassignedTokens = await I_VestingEscrowWallet.unassignedTokens.call();
            assert.equal(unassignedTokens, 20000);

            let balance = await I_SecurityToken.balanceOf.call(I_VestingEscrowWallet.address);
            assert.equal(balance.toString(), 20000);
        });

        it("Should withdraw all tokens to a treasury", async () => {
            let numberOfTokens = 20000;
            const tx = await I_VestingEscrowWallet.sendToTreasury(numberOfTokens, {from: wallet_operator});

            assert.equal(tx.logs[0].args._numberOfTokens, numberOfTokens);

            let unassignedTokens = await I_VestingEscrowWallet.unassignedTokens.call();
            assert.equal(unassignedTokens, 0);

            let balance = await I_SecurityToken.balanceOf.call(I_VestingEscrowWallet.address);
            assert.equal(balance.toString(), 0);
        });

        it("Should not be able to push available tokens -- fail because of permissions check", async () => {
            currentTime = new BN(await latestTime());
            let templateName = web3.utils.toHex("template-01");
            let numberOfTokens = 75000;
            let duration = new BN(durationUtil.seconds(30));
            let frequency = new BN(durationUtil.seconds(10));
            let timeShift = new BN(durationUtil.seconds(100));
            let startTime = currentTime.add(timeShift);
            await I_SecurityToken.approve(I_VestingEscrowWallet.address, numberOfTokens, { from: token_owner });
            await I_VestingEscrowWallet.depositTokens(numberOfTokens, {from: token_owner});
            await I_VestingEscrowWallet.addSchedule(account_beneficiary3, templateName, numberOfTokens, duration, frequency, startTime, {from: wallet_admin});
            await increaseTime(durationUtil.seconds(110));

            await catchRevert(
                I_VestingEscrowWallet.pushAvailableTokens(account_beneficiary3, {from: account_beneficiary1})
            );
        });

        it("Should not be able to remove template -- fail because template is used", async () => {
            await catchRevert(
                I_VestingEscrowWallet.removeTemplate(web3.utils.toHex("template-01"), {from: wallet_admin})
            );
        });

        it("Should push available tokens to the beneficiary address", async () => {
            let numberOfTokens = 75000;
            const tx = await I_VestingEscrowWallet.pushAvailableTokens(account_beneficiary3, {from: wallet_operator});
            assert.equal(tx.logs[0].args._beneficiary, account_beneficiary3);
            assert.equal(tx.logs[0].args._numberOfTokens.toString(), numberOfTokens / 3);

            let balance = await I_SecurityToken.balanceOf.call(account_beneficiary3);
            assert.equal(balance.toString(), numberOfTokens / 3);

            await I_SecurityToken.transfer(token_owner, balance, {from: account_beneficiary3});
        });

        it("Should fail to modify vesting schedule -- fail because schedule already started", async () => {
            let templateName = web3.utils.toHex("template-01");
            let startTime = currentTime + 100;
            await catchRevert(
                I_VestingEscrowWallet.modifySchedule(account_beneficiary3, templateName, startTime, {from: wallet_admin})
            );

            await I_VestingEscrowWallet.revokeAllSchedules(account_beneficiary3, {from: wallet_admin});
            await I_VestingEscrowWallet.removeTemplate(templateName, {from: wallet_admin});
            let unassignedTokens = await I_VestingEscrowWallet.unassignedTokens.call();
            await I_VestingEscrowWallet.sendToTreasury(unassignedTokens, {from: wallet_operator});
        });

        it("Should fail to modify vesting schedule -- fail because date in the past", async () => {
            await catchRevert(
                I_VestingEscrowWallet.modifySchedule(account_beneficiary3, web3.utils.toHex("template-01"), currentTime - 1000, {from: wallet_admin})
            );
        });

        it("Should withdraw available tokens to the beneficiary address", async () => {
            currentTime = new BN(await latestTime());
            let templateName = web3.utils.toHex("template-02");
            let numberOfTokens = 33000;
            let duration = new BN(durationUtil.seconds(30));
            let frequency = new BN(durationUtil.seconds(10));
            let timeShift = new BN(durationUtil.seconds(100));
            let startTime = currentTime.add(timeShift);
            await I_SecurityToken.approve(I_VestingEscrowWallet.address, numberOfTokens, { from: token_owner });
            await I_VestingEscrowWallet.depositTokens(numberOfTokens, {from: token_owner});
            await I_VestingEscrowWallet.addSchedule(account_beneficiary3, templateName, numberOfTokens, duration, frequency, startTime, {from: wallet_admin});
            await increaseTime(durationUtil.seconds(130));
            await I_VestingEscrowWallet.pause({from: token_owner});
            await catchRevert(
                I_VestingEscrowWallet.pullAvailableTokens({from: account_beneficiary3})
            );
            await I_VestingEscrowWallet.unpause({from: token_owner});
            const tx = await I_VestingEscrowWallet.pullAvailableTokens({from: account_beneficiary3});
            assert.equal(tx.logs[0].args._beneficiary, account_beneficiary3);
            assert.equal(tx.logs[0].args._numberOfTokens.toString(), numberOfTokens);

            let balance = await I_SecurityToken.balanceOf.call(account_beneficiary3);
            assert.equal(balance.toString(), numberOfTokens);

            let schedule = await I_VestingEscrowWallet.getSchedule.call(account_beneficiary3, templateName);
            checkSchedule(schedule, numberOfTokens, duration, frequency, startTime, COMPLETED);

            await I_SecurityToken.transfer(token_owner, balance, {from: account_beneficiary3});
            await I_VestingEscrowWallet.revokeAllSchedules(account_beneficiary3, {from: wallet_admin});
            await I_VestingEscrowWallet.removeTemplate(templateName, {from: wallet_admin});
        });

        it("Should fetch the unused tokens from the wallet", async() => {
            await I_PolyToken.getTokens(new BN(20).mul(new BN(10).pow(new BN(18))), I_VestingEscrowWallet.address, {from: token_owner});
            let previousBalance = web3.utils.fromWei((await I_PolyToken.balanceOf.call(I_VestingEscrowWallet.address)).toString());
            await catchRevert(
                I_VestingEscrowWallet.reclaimERC20(I_PolyToken.address, {from: account_beneficiary2})
            )
            await I_VestingEscrowWallet.reclaimERC20(I_PolyToken.address, {from: token_owner});
            let newBalance = web3.utils.fromWei((await I_PolyToken.balanceOf.call(I_VestingEscrowWallet.address)).toString());
            assert.equal(previousBalance - newBalance, 20);
        });

        it("Should fail to transfer the tokens to wallet", async() => {
            await catchRevert (
                web3.eth.sendTransaction({
                    from: token_owner,
                    to: I_VestingEscrowWallet.address,
                    gas: 2100000,
                    value: new BN(web3.utils.toWei("1", "ether"))
                })
            );
        });

        it("Should withdraw available tokens 2 times by 3 schedules to the beneficiary address", async () => {
            currentTime = new BN(await latestTime());
            let schedules = [
                {
                    templateName: web3.utils.toHex("template-1-01"),
                    numberOfTokens: new BN(100000),
                    duration: new BN(durationUtil.minutes(4)),
                    frequency: new BN(durationUtil.minutes(1))
                },
                {
                    templateName: web3.utils.toHex("template-1-02"),
                    numberOfTokens: new BN(30000),
                    duration: new BN(durationUtil.minutes(6)),
                    frequency: new BN(durationUtil.minutes(1))
                },
                {
                    templateName: web3.utils.toHex("template-1-03"),
                    numberOfTokens: new BN(2000),
                    duration: new BN(durationUtil.minutes(10)),
                    frequency: new BN(durationUtil.minutes(1))
                }
            ];

            let timeShift = new BN(durationUtil.seconds(100));
            let totalNumberOfTokens = getTotalNumberOfTokens(schedules);
            await I_SecurityToken.approve(I_VestingEscrowWallet.address, totalNumberOfTokens, {from: token_owner});
            await I_VestingEscrowWallet.depositTokens(totalNumberOfTokens, {from: token_owner});
            for (let i = 0; i < schedules.length; i++) {
                let templateName = schedules[i].templateName;
                let numberOfTokens = schedules[i].numberOfTokens;
                let duration = schedules[i].duration;
                let frequency = schedules[i].frequency;
                let startTime = currentTime.add(timeShift);
                await I_VestingEscrowWallet.addSchedule(account_beneficiary3, templateName, numberOfTokens, duration, frequency, startTime, {from: wallet_admin});
            }
            let stepCount = 6;
            await increaseTime(durationUtil.minutes(stepCount) + durationUtil.seconds(100));

            let numberOfTokens = 100000 + (30000 / 6 * stepCount) + (2000 / 10 * stepCount);
            const tx = await I_VestingEscrowWallet.pullAvailableTokens({from: account_beneficiary3});

            assert.equal(tx.logs[0].args._beneficiary, account_beneficiary3);
            assert.equal(tx.logs[0].args._numberOfTokens.toString(), 100000);
            assert.equal(tx.logs[1].args._beneficiary, account_beneficiary3);
            assert.equal(tx.logs[1].args._numberOfTokens.toString(), 30000 / 6 * stepCount);
            assert.equal(tx.logs[2].args._beneficiary, account_beneficiary3);
            assert.equal(tx.logs[2].args._numberOfTokens.toString(), 2000 / 10 * stepCount);

            let balance = await I_SecurityToken.balanceOf.call(account_beneficiary3);
            assert.equal(balance.toString(), numberOfTokens);

            stepCount = 4;
            await increaseTime(durationUtil.minutes(stepCount) + durationUtil.seconds(100));

            const tx2 = await I_VestingEscrowWallet.pullAvailableTokens({from: account_beneficiary3});
            assert.equal(tx2.logs[0].args._beneficiary, account_beneficiary3);
            assert.equal(tx2.logs[0].args._numberOfTokens.toString(), 2000 / 10 * stepCount);

            balance = await I_SecurityToken.balanceOf.call(account_beneficiary3);
            assert.equal(balance.toString(), totalNumberOfTokens);

            await I_SecurityToken.transfer(token_owner, balance, {from: account_beneficiary3});
            await I_VestingEscrowWallet.revokeAllSchedules(account_beneficiary3, {from: wallet_admin});
            for (let i = 0; i < schedules.length; i++) {
                await I_VestingEscrowWallet.removeTemplate(schedules[i].templateName, {from: wallet_admin});
            }
        });

    });

    describe("Adding, modifying and revoking vesting schedule", async () => {
        let template_2_01 = web3.utils.toHex("template-2-01");

        let schedules = [
            {
                templateName: web3.utils.toHex("template-2-01"),
                numberOfTokens: 100000,
                duration: new BN(durationUtil.years(4)),
                frequency: new BN(durationUtil.years(1)),
                // startTime: currentTime.add(new BN(durationUtil.days(1)))
            },
            {
                templateName: web3.utils.toHex("template-2-02"),
                numberOfTokens: 30000,
                duration: new BN(durationUtil.weeks(6)),
                frequency: new BN(durationUtil.weeks(1)),
                // startTime: currentTime.add(new BN(durationUtil.days(2)))
            },
            {
                templateName: web3.utils.toHex("template-2-03"),
                numberOfTokens: 2000,
                duration: new BN(durationUtil.days(10)),
                frequency: new BN(durationUtil.days(2)),
                // startTime: currentTime.add(new BN(durationUtil.days(3)))
            }
        ];

        it("Should fail to add vesting schedule to the beneficiary address -- fail because address in invalid", async () => {
            await catchRevert(
                I_VestingEscrowWallet.addSchedule(address_zero, template_2_01, 100000, 4, 1, currentTime.add(new BN(durationUtil.days(1))), {from: wallet_admin})
            );
        });

        it("Should fail to add vesting schedule to the beneficiary address -- fail because start date in the past", async () => {
            await catchRevert(
                I_VestingEscrowWallet.addSchedule(account_beneficiary1, template_2_01, 100000, 4, 1, currentTime.add(new BN(durationUtil.days(1))), {from: wallet_admin})
            );
        });

        it("Should fail to add vesting schedule to the beneficiary address -- fail because number of tokens is 0", async () => {
            await catchRevert(
                I_VestingEscrowWallet.addSchedule(account_beneficiary1, template_2_01, 0, 4, 1, currentTime.add(new BN(durationUtil.days(1))), {from: wallet_admin})
            );
        });

        it("Should fail to add vesting schedule to the beneficiary address -- fail because duration can't be divided entirely by frequency", async () => {
            await catchRevert(
                I_VestingEscrowWallet.addSchedule(account_beneficiary1, template_2_01, 100000, 4, 3, currentTime.add(new BN(durationUtil.days(1))), {from: wallet_admin})
            );
        });

        it("Should fail to add vesting schedule to the beneficiary address -- fail because number of tokens can't be divided entirely by period count", async () => {
            await catchRevert(
                I_VestingEscrowWallet.addSchedule(account_beneficiary1, template_2_01, 5, 4, 1, currentTime.add(new BN(durationUtil.days(1))), {from: wallet_admin})
            );
        });

        it("Should fail to get vesting schedule -- fail because address is invalid", async () => {
            await catchRevert(
                I_VestingEscrowWallet.getSchedule(address_zero, template_2_01)
            );
        });

        it("Should fail to get vesting schedule -- fail because schedule not found", async () => {

            await catchRevert(
                I_VestingEscrowWallet.getSchedule(account_beneficiary1, template_2_01)
            );
        });

        it("Should fail to get count of vesting schedule -- fail because address is invalid", async () => {
            await catchRevert(
                I_VestingEscrowWallet.getScheduleCount(address_zero)
            );
        });

        it("Should not be able to add schedule -- fail because of permissions check", async () => {
            let templateName = schedules[0].templateName;
            let numberOfTokens = schedules[0].numberOfTokens;
            let duration = schedules[0].duration;
            let frequency = schedules[0].frequency;
            let startTime = currentTime.add(new BN(durationUtil.days(1)));
            currentTime = new BN(await latestTime());
            await I_SecurityToken.approve(I_VestingEscrowWallet.address, numberOfTokens, {from: token_owner});
            await I_VestingEscrowWallet.depositTokens(numberOfTokens, {from: token_owner});
            await catchRevert(
                I_VestingEscrowWallet.addSchedule(account_beneficiary1, templateName, numberOfTokens, duration, frequency, startTime, {from: account_beneficiary1})
            );
            let unassignedTokens = await I_VestingEscrowWallet.unassignedTokens.call();
            await I_VestingEscrowWallet.sendToTreasury(unassignedTokens, {from: wallet_operator});
        });

        it("Should add vesting schedule to the beneficiary address", async () => {
            currentTime = new BN(await latestTime());
            let templateName = schedules[0].templateName;
            let numberOfTokens = schedules[0].numberOfTokens;
            let duration = schedules[0].duration;
            let frequency = schedules[0].frequency;
            let startTime = currentTime.add(new BN(durationUtil.days(1)));
            await I_SecurityToken.approve(I_VestingEscrowWallet.address, numberOfTokens, {from: token_owner});
            await I_VestingEscrowWallet.depositTokens(numberOfTokens, {from: token_owner});
            const tx = await I_VestingEscrowWallet.addSchedule(account_beneficiary1, templateName, numberOfTokens, duration, frequency, startTime, {from: wallet_admin});

            checkTemplateLog(tx.logs[0], templateName, numberOfTokens, duration, frequency);
            checkScheduleLog(tx.logs[1], account_beneficiary1, templateName, startTime);

            let scheduleCount = await I_VestingEscrowWallet.getScheduleCount.call(account_beneficiary1);
            assert.equal(scheduleCount, 1);

            let schedule = await I_VestingEscrowWallet.getSchedule.call(account_beneficiary1, templateName);
            checkSchedule(schedule, numberOfTokens, duration, frequency, startTime, CREATED);

            let templates = await I_VestingEscrowWallet.getTemplateNames.call(account_beneficiary1);
            assert.equal(web3.utils.hexToUtf8(templates[0]), web3.utils.hexToUtf8(templateName));
        });

        it("Should add vesting schedule without depositing to the beneficiary address", async () => {
            currentTime = new BN(await latestTime());
            let templateName = web3.utils.toHex("template-2-01-2");
            let numberOfTokens = schedules[0].numberOfTokens;
            let duration = schedules[0].duration;
            let frequency = schedules[0].frequency;
            let startTime = currentTime.add(new BN(durationUtil.days(1)));
            await I_SecurityToken.approve(I_VestingEscrowWallet.address, numberOfTokens, {from: token_owner});
            const tx = await I_VestingEscrowWallet.addSchedule(account_beneficiary1, templateName, numberOfTokens, duration, frequency, startTime, {from: token_owner});

            checkTemplateLog(tx.logs[0], templateName, numberOfTokens, duration, frequency);
            assert.equal(tx.logs[1].args._numberOfTokens, numberOfTokens);
            checkScheduleLog(tx.logs[2], account_beneficiary1, templateName, startTime);

            let scheduleCount = await I_VestingEscrowWallet.getScheduleCount.call(account_beneficiary1);
            assert.equal(scheduleCount, 2);

            let schedule = await I_VestingEscrowWallet.getSchedule.call(account_beneficiary1, templateName);
            checkSchedule(schedule, numberOfTokens, duration, frequency, startTime, CREATED);

            await I_VestingEscrowWallet.revokeSchedule(account_beneficiary1, templateName, {from: wallet_admin});
            await I_VestingEscrowWallet.removeTemplate(templateName, {from: wallet_admin});
            let unassignedTokens = await I_VestingEscrowWallet.unassignedTokens.call();
            await I_VestingEscrowWallet.sendToTreasury(unassignedTokens, {from: wallet_operator});
        });

        it("Should fail to modify vesting schedule -- fail because schedule not found", async () => {
            currentTime = new BN(await latestTime());
            let templateName = web3.utils.toHex("template-2-03");
            let startTime = currentTime.add(new BN(durationUtil.days(1)));
            await catchRevert(
                I_VestingEscrowWallet.modifySchedule(account_beneficiary1, templateName, startTime, {from: wallet_admin})
            );
        });

        it("Should not be able to modify schedule -- fail because of permissions check", async () => {
            await catchRevert(
                I_VestingEscrowWallet.modifySchedule(account_beneficiary1, web3.utils.toHex("template-2-01"), currentTime.add(new BN(100)), {from: account_beneficiary1})
            );
        });

        it("Should modify vesting schedule for the beneficiary's address", async () => {
            currentTime = new BN(await latestTime());
            let templateName = web3.utils.toHex("template-2-01");
            let numberOfTokens = schedules[0].numberOfTokens;
            let duration = schedules[0].duration;
            let frequency = schedules[0].frequency;
            let startTime = currentTime.add(new BN(durationUtil.days(2)));
            const tx = await I_VestingEscrowWallet.modifySchedule(account_beneficiary1, templateName, startTime, {from: wallet_admin});

            checkScheduleLog(tx.logs[0], account_beneficiary1, templateName, startTime);

            let scheduleCount = await I_VestingEscrowWallet.getScheduleCount.call(account_beneficiary1);
            assert.equal(scheduleCount.toString(), 1);

            let schedule = await I_VestingEscrowWallet.getSchedule.call(account_beneficiary1, templateName);
            checkSchedule(schedule, numberOfTokens, duration, frequency, startTime, CREATED);
        });

        it("Should not be able to revoke schedule -- fail because of permissions check", async () => {
            await catchRevert(
                I_VestingEscrowWallet.revokeSchedule(account_beneficiary1, web3.utils.toHex("template-2-01"), {from: account_beneficiary1})
            );
        });

        it("Should revoke vesting schedule from the beneficiary address", async () => {
            let templateName = web3.utils.toHex("template-2-01");
            const tx = await I_VestingEscrowWallet.revokeSchedule(account_beneficiary1, templateName, {from: wallet_admin});
            let unassignedTokens = await I_VestingEscrowWallet.unassignedTokens.call();
            await I_VestingEscrowWallet.sendToTreasury(unassignedTokens, {from: wallet_operator});

            assert.equal(tx.logs[0].args._beneficiary, account_beneficiary1);
            assert.equal(web3.utils.hexToUtf8(tx.logs[0].args._templateName), web3.utils.hexToUtf8(templateName));

            let scheduleCount = await I_VestingEscrowWallet.getScheduleCount.call(account_beneficiary1);
            assert.equal(scheduleCount, 0);

            await I_VestingEscrowWallet.removeTemplate(templateName, {from: wallet_admin})
        });

        it("Should fail to revoke vesting schedule -- fail because address is invalid", async () => {
            await catchRevert(
                I_VestingEscrowWallet.revokeSchedule(address_zero, web3.utils.toHex("template-2-01"), {from: wallet_admin})
            );
        });

        it("Should fail to revoke vesting schedule -- fail because schedule not found", async () => {
            await catchRevert(
                I_VestingEscrowWallet.revokeSchedule(account_beneficiary1, web3.utils.toHex("template-2-02"), {from: wallet_admin})
            );
        });

        it("Should fail to revoke vesting schedules -- fail because address is invalid", async () => {
            await catchRevert(
                I_VestingEscrowWallet.revokeAllSchedules(address_zero, {from: wallet_admin})
            );
        });

        it("Should add 3 vesting schedules to the beneficiary address", async () => {
            currentTime = new BN(await latestTime());
            let startTimes = [
                currentTime.add(new BN(durationUtil.days(1))),
                currentTime.add(new BN(durationUtil.days(2))),
                currentTime.add(new BN(durationUtil.days(3)))
            ];
            let totalNumberOfTokens = getTotalNumberOfTokens(schedules);
            await I_SecurityToken.approve(I_VestingEscrowWallet.address, totalNumberOfTokens, {from: token_owner});
            await I_VestingEscrowWallet.depositTokens(totalNumberOfTokens, {from: token_owner});
            for (let i = 0; i < schedules.length; i++) {
                let templateName = schedules[i].templateName;
                let numberOfTokens = schedules[i].numberOfTokens;
                let duration = schedules[i].duration;
                let frequency = schedules[i].frequency;
                let startTime = startTimes[i];
                const tx = await I_VestingEscrowWallet.addSchedule(account_beneficiary2, templateName, numberOfTokens, duration, frequency, startTime, {from: wallet_admin});

                checkTemplateLog(tx.logs[0], templateName, numberOfTokens, duration, frequency);
                checkScheduleLog(tx.logs[1], account_beneficiary2, templateName, startTime);

                let scheduleCount = await I_VestingEscrowWallet.getScheduleCount.call(account_beneficiary2);
                assert.equal(scheduleCount, i + 1);

                let schedule = await I_VestingEscrowWallet.getSchedule.call(account_beneficiary2, templateName);
                checkSchedule(schedule, numberOfTokens, duration, frequency, startTime, CREATED);
            }
        });

        it("Should not be able to revoke schedules -- fail because of permissions check", async () => {
            await catchRevert(
                I_VestingEscrowWallet.revokeAllSchedules(account_beneficiary1, {from: account_beneficiary1})
            );
        });

        it("Should revoke 1 of 3 vesting schedule from the beneficiary address", async () => {
            let templateName = schedules[1].templateName;
            const tx = await I_VestingEscrowWallet.revokeSchedule(account_beneficiary2, templateName, {from: wallet_admin});
            let unassignedTokens = await I_VestingEscrowWallet.unassignedTokens.call();
            await I_VestingEscrowWallet.sendToTreasury(unassignedTokens, {from: wallet_operator});

            assert.equal(tx.logs[0].args._beneficiary, account_beneficiary2);
            assert.equal(web3.utils.hexToUtf8(tx.logs[0].args._templateName), web3.utils.hexToUtf8(templateName));

            let scheduleCount = await I_VestingEscrowWallet.getScheduleCount.call(account_beneficiary2);
            assert.equal(scheduleCount, 2);
        });

        it("Should revoke 2 vesting schedules from the beneficiary address", async () => {
            const tx = await I_VestingEscrowWallet.revokeAllSchedules(account_beneficiary2, {from: wallet_admin});
            let unassignedTokens = await I_VestingEscrowWallet.unassignedTokens.call();
            await I_VestingEscrowWallet.sendToTreasury(unassignedTokens, {from: wallet_operator});

            assert.equal(tx.logs[0].args._beneficiary, account_beneficiary2);

            let scheduleCount = await I_VestingEscrowWallet.getScheduleCount.call(account_beneficiary2);
            assert.equal(scheduleCount, 0);
        });

        it("Should push available tokens during revoking vesting schedule", async () => {
            currentTime = new BN(await latestTime());
            let schedules = [
                {
                    templateName: web3.utils.toHex("template-3-01"),
                    numberOfTokens: new BN(100000),
                    duration: new BN(durationUtil.minutes(4)),
                    frequency: new BN(durationUtil.minutes(1))
                },
                {
                    templateName: web3.utils.toHex("template-3-02"),
                    numberOfTokens: new BN(30000),
                    duration: new BN(durationUtil.minutes(6)),
                    frequency: new BN(durationUtil.minutes(1))
                },
                {
                    templateName: web3.utils.toHex("template-3-03"),
                    numberOfTokens: new BN(2000),
                    duration: new BN(durationUtil.minutes(10)),
                    frequency: new BN(durationUtil.minutes(1))
                }
            ];

            let totalNumberOfTokens = getTotalNumberOfTokens(schedules);
            await I_SecurityToken.approve(I_VestingEscrowWallet.address, totalNumberOfTokens, {from: token_owner});
            await I_VestingEscrowWallet.depositTokens(totalNumberOfTokens, {from: token_owner});
            for (let i = 0; i < schedules.length; i++) {
                let templateName = schedules[i].templateName;
                let numberOfTokens = schedules[i].numberOfTokens;
                let duration = schedules[i].duration;
                let frequency = schedules[i].frequency;
                let startTime = currentTime.add(new BN(100));
                await I_VestingEscrowWallet.addSchedule(account_beneficiary3, templateName, numberOfTokens, duration, frequency, startTime, {from: wallet_admin});
            }
            let stepCount = 3;
            await increaseTime(durationUtil.minutes(stepCount) + durationUtil.seconds(100));

            const tx = await I_VestingEscrowWallet.revokeSchedule(account_beneficiary3, web3.utils.toHex("template-3-01"), {from: wallet_admin});
            assert.equal(tx.logs[0].args._beneficiary, account_beneficiary3);
            assert.equal(tx.logs[0].args._numberOfTokens.toString(), 100000 / 4 * stepCount);

            let balance = await I_SecurityToken.balanceOf.call(account_beneficiary3);
            assert.equal(balance.toString(), 100000 / 4 * stepCount);

            stepCount = 7;
            await increaseTime(durationUtil.minutes(stepCount));

            const tx2 = await I_VestingEscrowWallet.revokeAllSchedules(account_beneficiary3, {from: wallet_admin});
            assert.equal(tx2.logs[0].args._beneficiary, account_beneficiary3);
            assert.equal(tx2.logs[0].args._numberOfTokens.toString(), 2000);
            assert.equal(tx2.logs[1].args._beneficiary, account_beneficiary3);
            assert.equal(tx2.logs[1].args._numberOfTokens.toString(), 30000);

            for (let i = 0; i < schedules.length; i++) {
                await I_VestingEscrowWallet.removeTemplate(schedules[i].templateName, {from: wallet_admin});
            }

            balance = await I_SecurityToken.balanceOf.call(account_beneficiary3);
            assert.equal(balance.toString(), totalNumberOfTokens - 100000 / 4);

            await I_SecurityToken.transfer(token_owner, balance, {from: account_beneficiary3});
            let unassignedTokens = await I_VestingEscrowWallet.unassignedTokens.call();
            await I_VestingEscrowWallet.sendToTreasury(unassignedTokens, {from: wallet_operator});
        });

    });

    describe("Adding, using and removing templates", async () => {
        let schedules = [
            {
                templateName: web3.utils.toHex("template-4-01"),
                numberOfTokens: 100000,
                duration: new BN(durationUtil.years(4)),
                frequency: new BN(durationUtil.years(1)),
                // startTime: currentTime.add(new BN(durationUtil.days(1)))
            },
            {
                templateName: web3.utils.toHex("template-4-02"),
                numberOfTokens: 30000,
                duration: new BN(durationUtil.weeks(6)),
                frequency: new BN(durationUtil.weeks(1)),
                // startTime: currentTime.add(new BN(durationUtil.days(2)))
            },
            {
                templateName: web3.utils.toHex("template-4-03"),
                numberOfTokens: 2000,
                duration: new BN(durationUtil.days(10)),
                frequency: new BN(durationUtil.days(2)),
                // startTime: currentTime.add(new BN(durationUtil.days(3)))
            }
        ];

        it("Should not be able to add template -- fail because of permissions check", async () => {
            await catchRevert(
                I_VestingEscrowWallet.addTemplate(web3.utils.toHex("template-4-01"), 25000, 4, 1, {from: account_beneficiary1})
            );
        });

        it("Should not be able to add template -- fail because of invalid name", async () => {
            await catchRevert(
                I_VestingEscrowWallet.addTemplate(web3.utils.toHex(""), 25000, 4, 1, {from: wallet_admin})
            );
        });

        it("Should add 3 Templates", async () => {
            let oldTemplateCount = await I_VestingEscrowWallet.getTemplateCount.call();
            for (let i = 0; i < schedules.length; i++) {
                let templateName = schedules[i].templateName;
                let numberOfTokens = schedules[i].numberOfTokens;
                let duration = schedules[i].duration;
                let frequency = schedules[i].frequency;
                const tx = await I_VestingEscrowWallet.addTemplate(templateName, numberOfTokens, duration, frequency, {from: wallet_admin});

                assert.equal(web3.utils.hexToUtf8(tx.logs[0].args._name), web3.utils.hexToUtf8(templateName));
                assert.equal(tx.logs[0].args._numberOfTokens.toString(), numberOfTokens);
                assert.equal(tx.logs[0].args._duration.toString(), duration);
                assert.equal(tx.logs[0].args._frequency.toString(), frequency);
            }
            let templateNames = await I_VestingEscrowWallet.getAllTemplateNames.call();

            for (let i = 0, j = oldTemplateCount; i < schedules.length; i++, j++) {
                assert.equal(web3.utils.hexToUtf8(templateNames[j]), web3.utils.hexToUtf8(schedules[i].templateName));
            }
        });

        it("Should not be able to add template -- fail because template already exists", async () => {
            await catchRevert(
                I_VestingEscrowWallet.addTemplate(web3.utils.toHex("template-4-01"), 25000, 4, 1, {from: wallet_admin})
            );
        });

        it("Should not be able to remove template -- fail because of permissions check", async () => {
            await catchRevert(
                I_VestingEscrowWallet.removeTemplate(web3.utils.toHex("template-4-02"), {from: account_beneficiary1})
            );
        });

        it("Should not be able to remove template -- fail because template not found", async () => {
            await catchRevert(
                I_VestingEscrowWallet.removeTemplate(web3.utils.toHex("template-444-02"), {from: wallet_admin})
            );
        });

        it("Should remove template", async () => {
            const tx = await I_VestingEscrowWallet.removeTemplate(web3.utils.toHex("template-4-02"), {from: wallet_admin});

            assert.equal(web3.utils.hexToUtf8(tx.logs[0].args._name), "template-4-02");
        });

        it("Should fail to add vesting schedule from template -- fail because template not found", async () => {
            await catchRevert(
                I_VestingEscrowWallet.addScheduleFromTemplate(account_beneficiary1, web3.utils.toHex("template-4-02"), currentTime, {from: wallet_admin})
            );
        });

        it("Should not be able to add schedule from template -- fail because of permissions check", async () => {
            await catchRevert(
                I_VestingEscrowWallet.addScheduleFromTemplate(account_beneficiary1, web3.utils.toHex("template-4-01"), currentTime, {from: account_beneficiary1})
            );
        });

        it("Should not be able to add vesting schedule from template -- fail because template not found", async () => {
            await catchRevert(
                I_VestingEscrowWallet.addScheduleFromTemplate(account_beneficiary1, web3.utils.toHex("template-777"), currentTime + 100, {from: wallet_admin})
            );
        });

        it("Should add vesting schedule from template", async () => {
            let templateName = schedules[2].templateName;
            let numberOfTokens = schedules[2].numberOfTokens;
            let duration = schedules[2].duration;
            let frequency = schedules[2].frequency;
            let startTime = currentTime.add(new BN(durationUtil.days(3)));
            currentTime = new BN(await latestTime());
            await I_SecurityToken.approve(I_VestingEscrowWallet.address, numberOfTokens, { from: token_owner });
            await I_VestingEscrowWallet.depositTokens(numberOfTokens, {from: token_owner});
            const tx = await I_VestingEscrowWallet.addScheduleFromTemplate(account_beneficiary1, templateName, startTime, {from: wallet_admin});

            checkScheduleLog(tx.logs[0], account_beneficiary1, templateName, startTime);

            let scheduleCount = await I_VestingEscrowWallet.getScheduleCount.call(account_beneficiary1);
            assert.equal(scheduleCount, 1);

            let schedule = await I_VestingEscrowWallet.getSchedule.call(account_beneficiary1, templateName);
            checkSchedule(schedule, numberOfTokens, duration, frequency, startTime, CREATED);

            await I_VestingEscrowWallet.revokeSchedule(account_beneficiary1, templateName, {from: wallet_admin});
            let unassignedTokens = await I_VestingEscrowWallet.unassignedTokens.call();
            await I_VestingEscrowWallet.sendToTreasury(unassignedTokens, {from: wallet_operator});
        });

        it("Should not be able to add vesting schedule from template -- fail because template already added", async () => {
            let templateName = schedules[2].templateName;
            await catchRevert(
                I_VestingEscrowWallet.addScheduleFromTemplate(account_beneficiary1, templateName, currentTime.add(new BN(100)), {from: wallet_admin})
            );
        });

        it("Should fail to remove template", async () => {
            await catchRevert(
                I_VestingEscrowWallet.removeTemplate(web3.utils.toHex("template-4-02"), {from: wallet_admin})
            );
        });

        it("Should remove 2 Templates", async () => {
            let templateCount = await I_VestingEscrowWallet.getTemplateCount.call({from: wallet_admin});

            await I_VestingEscrowWallet.removeTemplate(web3.utils.toHex("template-4-01"), {from: wallet_admin});
            await I_VestingEscrowWallet.removeTemplate(web3.utils.toHex("template-4-03"), {from: wallet_admin});

            let templateCountAfterRemoving = await I_VestingEscrowWallet.getTemplateCount.call({from: wallet_admin});
            assert.equal(templateCount - templateCountAfterRemoving, 2);
        });

    });

    describe("Tests for multi operations", async () => {

        let templateNames = [web3.utils.toHex("template-5-01"), web3.utils.toHex("template-5-02"), web3.utils.toHex("template-5-03")];

        it("Should not be able to add schedules to the beneficiaries -- fail because of permissions check", async () => {
            currentTime = new BN(await latestTime());
            let startTime = currentTime.add(new BN(100));
            let startTimes = [startTime, startTime, startTime];
            await catchRevert(
                I_VestingEscrowWallet.addScheduleMulti(beneficiaries, templateNames, [10000, 10000, 10000], [4, 4, 4], [1, 1, 1], startTimes, {from: account_beneficiary1})
            );
        });

        it("Should not be able to add schedules to the beneficiaries -- fail because of arrays sizes mismatch", async () => {
            let startTime = currentTime.add(new BN(100));
            let startTimes = [startTime, startTime, startTime];
            let totalNumberOfTokens = 60000;
            await I_SecurityToken.approve(I_VestingEscrowWallet.address, totalNumberOfTokens, {from: token_owner});
            await I_VestingEscrowWallet.depositTokens(totalNumberOfTokens, {from: token_owner});
            await catchRevert(
                I_VestingEscrowWallet.addScheduleMulti(beneficiaries, templateNames, [20000, 30000, 10000], [4, 4], [1, 1, 1], startTimes, {from: wallet_admin})
            );
            let unassignedTokens = await I_VestingEscrowWallet.unassignedTokens.call();
            await I_VestingEscrowWallet.sendToTreasury(unassignedTokens, {from: wallet_operator});
        });

        it("Should add schedules for 3 beneficiaries", async () => {
            let numberOfTokens = [15000, 15000, 15000];
            let durations = [new BN(durationUtil.seconds(50)), new BN(durationUtil.seconds(50)), new BN(durationUtil.seconds(50))];
            let frequencies = [new BN(durationUtil.seconds(10)), new BN(durationUtil.seconds(10)), new BN(durationUtil.seconds(10))];
            let timeShift = new BN(durationUtil.seconds(100));
            let startTimes = [currentTime.add(timeShift), currentTime.add(timeShift), currentTime.add(timeShift)];

            let totalNumberOfTokens = 60000;
            await I_SecurityToken.approve(I_VestingEscrowWallet.address, totalNumberOfTokens, {from: token_owner});
            await I_VestingEscrowWallet.depositTokens(totalNumberOfTokens, {from: token_owner});

            let tx = await I_VestingEscrowWallet.addScheduleMulti(beneficiaries, templateNames, numberOfTokens, durations, frequencies, startTimes, {from: wallet_admin});

            for (let i = 0; i < beneficiaries.length; i++) {
                let templateName = templateNames[i];
                let beneficiary = beneficiaries[i];
                checkTemplateLog(tx.logs[i*  2], templateName, numberOfTokens[i], durations[i], frequencies[i]);
                checkScheduleLog(tx.logs[i * 2 + 1], beneficiary, templateName, startTimes[i]);

                let scheduleCount = await I_VestingEscrowWallet.getScheduleCount.call(beneficiary);
                assert.equal(scheduleCount, 1);

                let schedule = await I_VestingEscrowWallet.getSchedule.call(beneficiary, templateName);
                checkSchedule(schedule, numberOfTokens[i], durations[i], frequencies[i], startTimes[i], CREATED);
            }
        });

        it("Should not be able modify vesting schedule for 3 beneficiary's addresses -- fail because of arrays sizes mismatch", async () => {
            let timeShift = new BN(durationUtil.seconds(100));
            let startTimes = [currentTime.add(timeShift), currentTime.add(timeShift), currentTime.add(timeShift)];

            await catchRevert(
                I_VestingEscrowWallet.modifyScheduleMulti(beneficiaries, [web3.utils.toHex("template-5-01")], startTimes, {from: wallet_admin})
            );
        });

        it("Should not be able to modify schedules for the beneficiaries -- fail because of permissions check", async () => {
            let timeShift = new BN(durationUtil.seconds(100));
            let startTimes = [currentTime.add(timeShift), currentTime.add(timeShift), currentTime.add(timeShift)];

            await catchRevert(
                I_VestingEscrowWallet.modifyScheduleMulti(beneficiaries, templateNames, startTimes, {from: account_beneficiary1})
            );
        });

        it("Should modify vesting schedule for 3 beneficiary's addresses", async () => {
            let numberOfTokens = [new BN(15000), new BN(15000), new BN(15000)];
            let durations = [new BN(durationUtil.seconds(50)), new BN(durationUtil.seconds(50)), new BN(durationUtil.seconds(50))];
            let frequencies = [new BN(durationUtil.seconds(10)), new BN(durationUtil.seconds(10)), new BN(durationUtil.seconds(10))];
            let timeShift = new BN(durationUtil.seconds(100));
            let startTimes = [currentTime.add(timeShift), currentTime.add(timeShift), currentTime.add(timeShift)];

            const tx = await I_VestingEscrowWallet.modifyScheduleMulti(beneficiaries, templateNames, startTimes, {from: wallet_admin});
            await increaseTime(110);

            for (let i = 0; i < beneficiaries.length; i++) {
                let log = tx.logs[i];
                let beneficiary = beneficiaries[i];
                checkScheduleLog(log, beneficiary, templateNames[i], startTimes[i]);

                let scheduleCount = await I_VestingEscrowWallet.getScheduleCount.call(beneficiary);
                assert.equal(scheduleCount, 1);

                let schedule = await I_VestingEscrowWallet.getSchedule.call(beneficiary, templateNames[i]);
                checkSchedule(schedule, numberOfTokens[i], durations[i], frequencies[i], startTimes[i], STARTED);
            }
        });

        it("Should not be able to send available tokens to the beneficiaries addresses -- fail because of array size", async () => {
            await catchRevert(
                I_VestingEscrowWallet.pushAvailableTokensMulti(new BN(0), new BN(3), {from: wallet_operator})
            );
        });

        it("Should not be able to send available tokens to the beneficiaries -- fail because of permissions check", async () => {
            await catchRevert(
                I_VestingEscrowWallet.pushAvailableTokensMulti(new BN(0), new BN(2), {from: account_beneficiary1})
            );
        });

        it("Should send available tokens to the beneficiaries addresses", async () => {
            const tx = await I_VestingEscrowWallet.pushAvailableTokensMulti(0, 2, {from: wallet_operator});

            for (let i = 0; i < beneficiaries.length; i++) {
                let log = tx.logs[i];
                let beneficiary = beneficiaries[i];
                assert.equal(log.args._numberOfTokens.toString(), 3000);

                let balance = await I_SecurityToken.balanceOf.call(beneficiary);
                assert.equal(balance.toString(), 3000);

                await I_SecurityToken.transfer(token_owner, balance, {from: beneficiary});
                await I_VestingEscrowWallet.revokeAllSchedules(beneficiary, {from: wallet_admin});
                await I_VestingEscrowWallet.removeTemplate(templateNames[i], {from: wallet_admin});
                let unassignedTokens = await I_VestingEscrowWallet.unassignedTokens.call();
                await I_VestingEscrowWallet.sendToTreasury(unassignedTokens, {from: wallet_operator});
            }
        });

        it("Should not be able to add schedules from template to the beneficiaries -- fail because of permissions check", async () => {
            let templateName = web3.utils.toHex("template-6-01");
            let numberOfTokens = 18000;
            let duration = durationUtil.weeks(3);
            let frequency = durationUtil.weeks(1);
            let templateNames = [templateName, templateName, templateName];
            let startTime = currentTime.add(new BN(durationUtil.seconds(100)));
            let startTimes = [startTime, startTime, startTime];

            let totalNumberOfTokens = numberOfTokens * 3;
            await I_SecurityToken.approve(I_VestingEscrowWallet.address, totalNumberOfTokens, {from: token_owner});
            await I_VestingEscrowWallet.depositTokens(totalNumberOfTokens, {from: token_owner});
            await I_VestingEscrowWallet.addTemplate(templateName, numberOfTokens, duration, frequency, {from: wallet_admin});

            await catchRevert(
                I_VestingEscrowWallet.addScheduleFromTemplateMulti(beneficiaries, templateNames, startTimes, {from: account_beneficiary1})
            );
        });

        it("Should add schedules from template for 3 beneficiaries", async () => {
            currentTime = new BN(await latestTime());
            let templateName = web3.utils.toHex("template-6-01");
            let numberOfTokens = 18000;
            let duration = durationUtil.weeks(3);
            let frequency = durationUtil.weeks(1);
            let templateNames = [templateName, templateName, templateName];
            let startTime = currentTime.add(new BN(durationUtil.seconds(100)));
            let startTimes = [startTime, startTime, startTime];

            let tx = await I_VestingEscrowWallet.addScheduleFromTemplateMulti(beneficiaries, templateNames, startTimes, {from: wallet_admin});
            for (let i = 0; i < beneficiaries.length; i++) {
                let log = tx.logs[i];
                let beneficiary = beneficiaries[i];
                checkScheduleLog(log, beneficiary, templateName, startTimes[i]);

                let schedule = await I_VestingEscrowWallet.getSchedule.call(beneficiary, templateName);
                checkSchedule(schedule, numberOfTokens, duration, frequency, startTimes[i], CREATED);
            }
        });

        it("Should not be able to revoke schedules of the beneficiaries -- fail because of permissions check", async () => {
            await catchRevert(
                I_VestingEscrowWallet.revokeSchedulesMulti(beneficiaries, {from: account_beneficiary1})
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

            let unassignedTokens = await I_VestingEscrowWallet.unassignedTokens.call();
            await I_VestingEscrowWallet.sendToTreasury(unassignedTokens, {from: wallet_operator});
        });

    });

});

function checkTemplateLog(log, templateName, numberOfTokens, duration, frequency) {
    assert.equal(web3.utils.hexToUtf8(log.args._name), web3.utils.hexToUtf8(templateName));
    assert.equal(log.args._numberOfTokens.toString(), numberOfTokens);
    assert.equal(log.args._duration.toString(), duration);
    assert.equal(log.args._frequency.toString(), frequency);
}

function checkScheduleLog(log, beneficiary, templateName, startTime) {
    assert.equal(log.args._beneficiary, beneficiary);
    assert.equal(web3.utils.hexToUtf8(log.args._templateName), web3.utils.hexToUtf8(templateName));
    assert.equal(log.args._startTime.toString(), startTime);
}

function checkSchedule(schedule, numberOfTokens, duration, frequency, startTime, state) {
    assert.equal(schedule[0].toString(), numberOfTokens);
    assert.equal(schedule[1].toString(), duration);
    assert.equal(schedule[2].toString(), frequency);
    assert.equal(schedule[3].toString(), startTime);
    assert.equal(schedule[5].toString(), state);
}

function getTotalNumberOfTokens(schedules) {
    let numberOfTokens = new BN(0);
    for (let i = 0; i < schedules.length; i++) {
        numberOfTokens = numberOfTokens.add(new BN(schedules[i].numberOfTokens));
    }
    return numberOfTokens;
}
