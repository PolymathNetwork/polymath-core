import latestTime from "./helpers/latestTime";
import {duration, promisifyLogWatch} from "./helpers/utils";
import { takeSnapshot,increaseTime, revertToSnapshot} from "./helpers/time";
import {catchRevert} from "./helpers/exceptions";
import {deployPLCRVoteCheckpoint, setUpPolymathNetwork, deployGPMAndVerifyed} from "./helpers/createInstances";

const SecurityToken = artifacts.require("./SecurityToken.sol");
const GeneralTransferManager = artifacts.require("./GeneralTransferManager");
const GeneralPermissionManager = artifacts.require("./GeneralPermissionManager");
const PLCRVotingCheckpoint = artifacts.require("./PLCRVotingCheckpoint");
const STGetter = artifacts.require("./STGetter.sol");

const Web3 = require("web3");
let BN = Web3.utils.BN;
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port

contract("PLCRVotingCheckpoint", async (accounts) => {
    // Accounts Variable declaration
    let account_polymath;
    let account_issuer;
    let token_owner;
    let account_investor1;
    let account_investor2;
    let account_investor3;
    let account_investor4;
    let account_investor5;
    let account_temp;
    let account_delegate;

    // Contract Instance Declaration
    let I_GeneralPermissionManagerFactory;
    let I_SecurityTokenRegistryProxy;
    let I_GeneralTransferManagerFactory;
    let I_PLCRVotingCheckpointFactory;
    let P_PLCRVotingCheckpointFactory;
    let I_PLCRVotingCheckpoint;
    let I_GeneralTransferManager;
    let I_ModuleRegistryProxy;
    let I_ModuleRegistry;
    let I_FeatureRegistry;
    let I_GeneralPermissionManager;
    let I_SecurityTokenRegistry;
    let I_STRProxied;
    let I_STFactory;
    let I_SecurityToken;
    let I_PolyToken;
    let I_MRProxied;
    let I_PolymathRegistry;
    let I_STRGetter;
    let I_STGetter;
    let stGetter;

    // SecurityToken Details
    const name = "Team";
    const symbol = "SAP";
    const tokenDetails = "This is equity type of issuance";
    const decimals = 18;
    let saltArray = new Array();
    // Module key
    const delegateManagerKey = 1;
    const transferManagerKey = 2;
    const stoKey = 3;
    const checkpointKey = 4;
    const burnKey = 5;

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

        account_investor1 = accounts[6];
        account_investor2 = accounts[7];
        account_investor3 = accounts[8];
        account_investor4 = accounts[9];
        account_investor5 = accounts[4];
        account_temp = accounts[2];
        account_delegate = accounts[3];

        // ----------- POLYMATH NETWORK Configuration ------------

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


        // STEP 4: Deploy the WeightedVoteCheckpoint
        [I_PLCRVotingCheckpointFactory] = await deployPLCRVoteCheckpoint(account_polymath, I_MRProxied, 0);
        [P_PLCRVotingCheckpointFactory] = await deployPLCRVoteCheckpoint(account_polymath, I_MRProxied, new BN(web3.utils.toWei("500")));

        [I_GeneralPermissionManagerFactory] = await deployGPMAndVerifyed(account_polymath, I_MRProxied, 0);

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

        PLCRVotingCheckpointFactory:     ${I_PLCRVotingCheckpointFactory.address}
        -----------------------------------------------------------------------------
        `);
    });

    function getRandom() {
        return Math.floor(Math.random() * 1000000000000000);
    }

    describe("\t\t Test case for PLCR Vote Checkpoint module \n", async() => {

        describe("\t\t Attaching the PLCR vote checkpoint module \n", async() => {

            it("\t\t Should register the ticker before the generation of the security token \n", async () => {
                await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner });
                let tx = await I_STRProxied.registerNewTicker(token_owner, symbol, { from: token_owner });
                assert.equal(tx.logs[0].args._owner, token_owner);
                assert.equal(tx.logs[0].args._ticker, symbol);
            });

            it("\t\t Should generate the new security token with the same symbol as registered above \n", async () => {
                await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner });

                let tx = await I_STRProxied.generateNewSecurityToken(name, symbol, tokenDetails, false, token_owner, 0, { from: token_owner });

                // Verify the successful generation of the security token
                assert.equal(tx.logs[1].args._ticker, symbol, "SecurityToken doesn't get deployed");

                I_SecurityToken = await SecurityToken.at(tx.logs[1].args._securityTokenAddress);
                stGetter = await STGetter.at(I_SecurityToken.address);
                const log = (await I_SecurityToken.getPastEvents('ModuleAdded', {filter: {transactionHash: tx.transactionHash}}))[0];
                // Verify that GeneralTransferManager module get added successfully or not
                assert.equal(log.args._types[0].toNumber(), transferManagerKey);
                assert.equal(web3.utils.hexToString(log.args._name), "GeneralTransferManager");
            });

            it("\t\t Should initialize the auto attached modules \n", async () => {
                let moduleData = (await stGetter.getModulesByType(transferManagerKey))[0];
                I_GeneralTransferManager = await GeneralTransferManager.at(moduleData);
            });

            it("\t\t Should attach the voting module with the ST \n", async() => {
                let tx = await I_SecurityToken.addModule(I_PLCRVotingCheckpointFactory.address, "0x0", new BN(0), new BN(0), false, {from: token_owner});
                assert.equal(tx.logs[2].args._types[0], checkpointKey, "Checkpoint doesn't get deployed");
                assert.equal(web3.utils.hexToString(tx.logs[2].args._name), "PLCRVotingCheckpoint", "PLCRVotingCheckpoint module was not added");
                I_PLCRVotingCheckpoint = await PLCRVotingCheckpoint.at(tx.logs[2].args._module);
            });

            it("\t\t Should fail to attach the voting module because allowance is unsufficent \n", async() => {
                await catchRevert(
                    I_SecurityToken.addModule(P_PLCRVotingCheckpointFactory.address, "0x0", new BN(web3.utils.toWei("500")), 0, false, {from: token_owner})
                );
            });

            it("\t\t Should attach the voting module with the ST \n", async() => {
                let id = await takeSnapshot();
                await I_PolyToken.transfer(I_SecurityToken.address, new BN(web3.utils.toWei("2000", "ether")), { from: token_owner });
                let tx = await I_SecurityToken.addModule(P_PLCRVotingCheckpointFactory.address, "0x0", new BN(web3.utils.toWei("2000")), 0, false, {from: token_owner});
                assert.equal(tx.logs[3].args._types[0], checkpointKey, "Checkpoint doesn't get deployed");
                assert.equal(web3.utils.hexToString(tx.logs[3].args._name), "PLCRVotingCheckpoint", "PLCRVotingCheckpoint module was not added");
                await revertToSnapshot(id);
            });

            it("\t\t Should attach the general permission manager", async() => {
               let tx = await I_SecurityToken.addModule(I_GeneralPermissionManagerFactory.address, "0x0", 0, 0, false, {from: token_owner});
               assert.equal(tx.logs[2].args._types[0], delegateManagerKey, "Permission manager doesn't get deployed");
               assert.equal(web3.utils.hexToString(tx.logs[2].args._name), "GeneralPermissionManager", "GeneralPermissionManager module was not added");
               I_GeneralPermissionManager = await GeneralPermissionManager.at(tx.logs[2].args._module);
            });
        });

        describe("\t\t Test for createBallot \n", async() => {

            it("\t\t Should fail to create ballot -- bad owner \n", async() => {
                await catchRevert(
                    I_PLCRVotingCheckpoint.createBallot(new BN(duration.days(5)), new BN(duration.days(10)), new BN(3), new BN(46.57).mul(new BN(10).pow(new BN(16))), {from: account_polymath})
                );
            });

            it("\t\t Should fail to create ballot -- bad commit duration \n", async() => {
                await catchRevert(
                    I_PLCRVotingCheckpoint.createBallot(new BN(0), new BN(duration.days(10)), new BN(3), new BN(46.57).mul(new BN(10).pow(new BN(16))), {from: token_owner})
                );
            });

            it("\t\t Should fail to create ballot -- bad reveal duration \n", async() => {
                await catchRevert(
                    I_PLCRVotingCheckpoint.createBallot(new BN(duration.days(10)), new BN(0), new BN(3), new BN(46.57).mul(new BN(10).pow(new BN(16))), {from: token_owner})
                );
            });

            it("\t\t Should fail to create ballot -- bad proposed quorum \n", async() => {
                await catchRevert(
                    I_PLCRVotingCheckpoint.createBallot(new BN(duration.days(10)), new BN(duration.days(10)), new BN(3), new BN(0).mul(new BN(10).pow(new BN(16))), {from: token_owner})
                );
            });

            it("\t\t Should fail to create ballot -- bad proposed quorum more than 100 % \n", async() => {
                await catchRevert(
                    I_PLCRVotingCheckpoint.createBallot(new BN(duration.days(10)), new BN(duration.days(10)), new BN(3), new BN(46.57).mul(new BN(10).pow(new BN(18))), {from: token_owner})
                );
            });

            it("\t\t Should fail to create ballot -- bad no of proposals \n", async() => {
                await catchRevert(
                    I_PLCRVotingCheckpoint.createBallot(new BN(duration.days(5)), new BN(duration.days(10)), new BN(0), new BN(46.57).mul(new BN(10).pow(new BN(16))), {from: token_owner})
                );
            });

            it("\t\t Should fail to create ballot -- bad no of proposals \n", async() => {
                await catchRevert(
                    I_PLCRVotingCheckpoint.createBallot(new BN(duration.days(5)), new BN(duration.days(10)), new BN(1), new BN(46.57).mul(new BN(10).pow(new BN(16))), {from: token_owner})
                );
            });

            it("\t\t Mint some tokens and transfer to whitelisted investors \n", async() => {
                // Whitelist multiple investors
                let time = new BN(await latestTime());
                await I_GeneralTransferManager.modifyKYCDataMulti(
                    [account_investor1, account_investor2, account_investor3, account_investor4, account_investor5],
                    [time, time, time, time, time],
                    [time, time, time, time, time],
                    [time + duration.days(200), time + duration.days(200), time + duration.days(200), time + duration.days(200), time + duration.days(200)],
                    {
                        from: token_owner
                    }
                );

                // mint tokens to whitelisted investors

                await I_SecurityToken.issueMulti(
                    [account_investor1, account_investor2, account_investor3, account_investor4],
                    [new BN(web3.utils.toWei("500")), new BN(web3.utils.toWei("1000")), new BN(web3.utils.toWei("5000")), new BN(web3.utils.toWei("100"))],
                    {
                        from: token_owner
                    }
                );

                assert.equal(web3.utils.fromWei((await I_SecurityToken.balanceOf.call(account_investor1)).toString()), 500);
                assert.equal(web3.utils.fromWei((await I_SecurityToken.balanceOf.call(account_investor2)).toString()), 1000);
                assert.equal(web3.utils.fromWei((await I_SecurityToken.balanceOf.call(account_investor3)).toString()), 5000);
                assert.equal(web3.utils.fromWei((await I_SecurityToken.balanceOf.call(account_investor4)).toString()), 100);
            });

            it("\t\t Should fail to create ballot -- Invalid checkpoint Id \n", async() => {
                let startTime = new BN(await latestTime());
                let commitTime = new BN(duration.days(4));
                let revealTime = new BN(duration.days(5));
                await catchRevert(
                    I_PLCRVotingCheckpoint.createCustomBallot(commitTime, revealTime, new BN(3), new BN(50).mul(new BN(10).pow(new BN(16))), new BN(45), startTime, {from: token_owner})
                );
            });

            it("\t\t Should fail to create ballot -- Invalid start time \n", async() => {
                let startTime = new BN(await latestTime());
                let commitTime = new BN(duration.days(4));
                let revealTime = new BN(duration.days(5));
                await catchRevert(
                    I_PLCRVotingCheckpoint.createCustomBallot(commitTime, revealTime, new BN(3), new BN(50).mul(new BN(10).pow(new BN(16))), new BN(0), 0, {from: token_owner})
                );
            });

            it("\t\t SHould give admin permission to the delegate \n", async() => {
                await I_GeneralPermissionManager.addDelegate(account_delegate, web3.utils.toHex("I am a delegate"), {from: token_owner});
                await I_GeneralPermissionManager.changePermission(account_delegate, I_PLCRVotingCheckpoint.address, web3.utils.toHex("ADMIN"), true, {from: token_owner});
            });

            it("\t\t Should create the ballot successfully \n", async() => {
                let startTime = new BN(await latestTime()).add(new BN(duration.minutes(5)));
                let commitTime = new BN(duration.days(4));
                let revealTime = new BN(duration.days(5));
                await I_SecurityToken.createCheckpoint({from: token_owner});
                let checkpointId = await I_SecurityToken.currentCheckpointId.call();
                let tx = await I_PLCRVotingCheckpoint.createCustomBallot(commitTime, revealTime, new BN(3), new BN(47.8).mul(new BN(10).pow(new BN(16))), checkpointId, startTime, {from: account_delegate});
                let timeData = await I_PLCRVotingCheckpoint.getBallotCommitRevealDuration.call(new BN(0));
                assert.equal(timeData[0].toString(), commitTime);
                assert.equal(timeData[1].toString(), revealTime);
                assert.equal((tx.logs[0].args._noOfProposals).toString(), 3);
                assert.equal((tx.logs[0].args._checkpointId).toString(), 1);
                assert.equal((tx.logs[0].args._ballotId).toString(), 0);
            });
        });

        describe("\t\t Test case for commitVote \n", async() => {

            it("\t\t Should fail to commitVote -- bad ballot id \n", async() => {
                await catchRevert(
                    I_PLCRVotingCheckpoint.commitVote(new BN(2), web3.utils.toHex("Some secret"), {from: account_investor1})
                );
            });

            it("\t\t Should fail to commitVote -- not in the commit stage \n", async() => {
                let salt = getRandom();
                await catchRevert(
                    I_PLCRVotingCheckpoint.commitVote(new BN(0), web3.utils.soliditySha3(1, salt), {from: account_investor1})
                );
            });

            it("\t\t Should fail to commitVote -- secret vote is 0 \n", async() => {
                await increaseTime(duration.minutes(7)); // Increase time to make it under the commit stage
                await catchRevert(
                    I_PLCRVotingCheckpoint.commitVote(new BN(0), "0x0", {from: account_investor1})
                );
            });

            it("\t\t Should change some ballot status \n", async() => {
                await I_PLCRVotingCheckpoint.changeBallotStatus(new BN(0), false, {from: token_owner});
                let data = await I_PLCRVotingCheckpoint.getBallotDetails.call(new BN(0));
                assert.isFalse(data[7]);
            });

            it("\t\t Should fail to commitVote because ballot is not active \n", async() => {
                let salt = getRandom();
                await catchRevert(
                    I_PLCRVotingCheckpoint.commitVote(new BN(0), web3.utils.soliditySha3(1, salt), {from: account_investor1})
                );
            });

            it("\t\t Should change some ballot status \n", async() => {
                await I_PLCRVotingCheckpoint.changeBallotStatus(new BN(0), true, {from: token_owner});
                let data = await I_PLCRVotingCheckpoint.getBallotDetails.call(new BN(0));
                assert.isTrue(data[7]);
            });

            it("\t\t Should fail to add voter in ballot exemption list -- address is zero", async() => {
                await catchRevert(
                    I_PLCRVotingCheckpoint.changeBallotExemptedVotersList(new BN(0), "0x0000000000000000000000000000000000000000", true, {from: token_owner})
                );
            });

            it("\t\t Should fail to add voter in ballot exemption list -- invalid ballot id", async() => {
                await catchRevert(
                    I_PLCRVotingCheckpoint.changeBallotExemptedVotersList(new BN(5), account_investor1, true, {from: token_owner})
                );
            });

            it("\t\t Should add the voter in to the ballot exemption list", async() => {
                let tx = await I_PLCRVotingCheckpoint.changeBallotExemptedVotersList(new BN(0), account_investor1, true, {from: token_owner});
                assert.equal((tx.logs[0].args._ballotId).toString(), 0);
                assert.equal(tx.logs[0].args._voter, account_investor1);
                assert.equal(tx.logs[0].args._exempt, true);
            });

            it("\t\t Should fail to add voter in ballot exemption list -- doing the same change again", async() => {
                await catchRevert(
                    I_PLCRVotingCheckpoint.changeBallotExemptedVotersList(new BN(0), account_investor1, true, {from: token_owner})
                );
            });

            it("\t\t Should fail to vote -- voter is present in the exemption list", async() => {
                let salt = getRandom();
                await catchRevert(
                    I_PLCRVotingCheckpoint.commitVote(new BN(0), web3.utils.soliditySha3(2, salt), {from: account_investor1})
                );
            });

            it("\t\t Should add the multiple voter in to the ballot exemption list -- failed ", async() => {
                await catchRevert(
                    I_PLCRVotingCheckpoint.changeBallotExemptedVotersListMulti(new BN(0), [account_investor1, account_investor2], [false], {from: token_owner})
                );
            });

            it("\t\t Should add the multiple voter in to the ballot exemption list --failed because of bad msg.sender", async() => {
                await catchRevert(
                    I_PLCRVotingCheckpoint.changeBallotExemptedVotersListMulti(new BN(0), [account_investor1], [false], {from: account_polymath})
                );
            });


            it("\t\t Should add the multiple voter in to the ballot exemption list", async() => {
                await I_PLCRVotingCheckpoint.changeBallotExemptedVotersListMulti(new BN(0), [account_investor1], [false], {from: token_owner});
                assert.isTrue(await I_PLCRVotingCheckpoint.isVoterAllowed.call(new BN(0), account_investor1));
            });

            it("\t\t Should successfully vote by account investor1 \n", async() => {
                let salt = getRandom();
                saltArray.push(salt);
                let tx = await I_PLCRVotingCheckpoint.commitVote(new BN(0), web3.utils.soliditySha3(2, salt), {from: account_investor1});
                assert.equal(tx.logs[0].args._ballotId, 0);
                assert.equal(tx.logs[0].args._secretVote, web3.utils.soliditySha3(2, salt));
                assert.equal(tx.logs[0].args._voter, account_investor1);

                let data = await I_PLCRVotingCheckpoint.getBallotDetails.call(new BN(0));
                assert.equal(data[5], 3);
                assert.equal(data[7], true);
            });

            it("\t\t Should failed to vote again \n", async() => {
                let salt = getRandom();
                await catchRevert(
                    I_PLCRVotingCheckpoint.commitVote(new BN(0), web3.utils.soliditySha3(1, salt), {from: account_investor1})
                )
            });

            it("\t\t Should fail to add voter in default exemption list -- address is zero", async() => {
                await catchRevert(
                    I_PLCRVotingCheckpoint.changeDefaultExemptedVotersList("0x0000000000000000000000000000000000000000", true, {from: token_owner})
                );
            });

            it("\t\t Should add the voter in to the default exemption list", async() => {
                let tx = await I_PLCRVotingCheckpoint.changeDefaultExemptedVotersList(account_investor3, true, {from: token_owner});
                assert.equal(tx.logs[0].args._voter, account_investor3);
                assert.equal(tx.logs[0].args._exempt, true);
            });

            it("\t\t Should fail to add voter in default exemption list -- doing the same change again", async() => {
                await catchRevert(
                    I_PLCRVotingCheckpoint.changeDefaultExemptedVotersList(account_investor3, true, {from: token_owner})
                );
            });

            it("\t\t Should fail to vote -- voter is present in the exemption list", async() => {
                let salt = getRandom();
                await catchRevert(
                    I_PLCRVotingCheckpoint.commitVote(new BN(0), web3.utils.soliditySha3(1, salt), {from: account_investor3})
                );
            });

            it("\t\t Should change the deafult exemption list using Multi function -- failed because of mismatch array length", async() => {
                await catchRevert(
                    I_PLCRVotingCheckpoint.changeDefaultExemptedVotersListMulti([account_investor3, account_investor1], [false], {from: token_owner})
                );
            });

            it("\t\t Should change the default exemption list by allowing investor 1 to vote", async() => {
                await I_PLCRVotingCheckpoint.changeDefaultExemptedVotersListMulti([account_investor3], [false], {from: token_owner});
                assert.isTrue(await I_PLCRVotingCheckpoint.isVoterAllowed.call(new BN(0), account_investor3));
            });

            it("\t\t Should change the default exemption list using Multi function", async() => {
                await I_PLCRVotingCheckpoint.changeDefaultExemptedVotersListMulti([account_investor3, account_investor1, account_investor2], [true, true, true], {from: token_owner});
                assert.isFalse(await I_PLCRVotingCheckpoint.isVoterAllowed.call(new BN(0), account_investor3));
                assert.isFalse(await I_PLCRVotingCheckpoint.isVoterAllowed.call(new BN(0), account_investor1));
                assert.isFalse(await I_PLCRVotingCheckpoint.isVoterAllowed.call(new BN(0), account_investor2));
                assert.equal((await I_PLCRVotingCheckpoint.getDefaultExemptionVotersList.call()).length, 3);
            });

            it("\t\t Should change the default exemption list by allowing investor 1 to vote again", async() => {
                await I_PLCRVotingCheckpoint.changeDefaultExemptedVotersList(account_investor3, false, {from: token_owner});
                assert.isTrue(await I_PLCRVotingCheckpoint.isVoterAllowed.call(new BN(0), account_investor3));
            });

            it("\t\t Should change the default exemption list using Multi function", async() => {
                await I_PLCRVotingCheckpoint.changeDefaultExemptedVotersListMulti([account_investor2, account_investor1], [false, false], {from: token_owner});
                assert.isTrue(await I_PLCRVotingCheckpoint.isVoterAllowed.call(new BN(0), account_investor1));
                assert.isTrue(await I_PLCRVotingCheckpoint.isVoterAllowed.call(new BN(0), account_investor2));
            });

            it("\t\t Should successfully vote by account investor3 \n", async() => {
                let salt = getRandom();
                saltArray.push(salt);
                let tx = await I_PLCRVotingCheckpoint.commitVote(new BN(0),  web3.utils.soliditySha3(1, salt), {from: account_investor3});
                assert.equal(tx.logs[0].args._ballotId, 0);
                assert.equal(tx.logs[0].args._secretVote, web3.utils.soliditySha3(1, salt));
                assert.equal(tx.logs[0].args._voter, account_investor3);

                let data = await I_PLCRVotingCheckpoint.getBallotDetails.call(new BN(0));
                assert.equal(data[5], 3);
                assert.equal(data[7], true);
            });

            it("\t\t Should successfully vote by account investor2 \n", async() => {
                let salt = getRandom();
                saltArray.push(salt);
                let tx = await I_PLCRVotingCheckpoint.commitVote(new BN(0),  web3.utils.soliditySha3(2, salt), {from: account_investor2});
                assert.equal(tx.logs[0].args._ballotId, 0);
                assert.equal(tx.logs[0].args._secretVote, web3.utils.soliditySha3(2, salt));
                assert.equal(tx.logs[0].args._voter, account_investor2);

                let data = await I_PLCRVotingCheckpoint.getBallotDetails.call(new BN(0));
                assert.equal(data[5], 3);
                assert.equal(data[7], true);
            });

            it("\t\t Mint some more tokens and transferred to the tokens holders \n", async() => {
                await I_SecurityToken.issueMulti(
                    [account_investor1, account_investor2, account_investor3, account_investor5],
                    [new BN(web3.utils.toWei("3000")),
                    new BN(web3.utils.toWei("2000")),
                    new BN(web3.utils.toWei("500")),
                    new BN(web3.utils.toWei("3500"))
                    ],
                    {
                        from: token_owner
                    }
                );

                assert.equal(web3.utils.fromWei((await I_SecurityToken.balanceOf.call(account_investor1)).toString()), 3500);
                assert.equal(web3.utils.fromWei((await I_SecurityToken.balanceOf.call(account_investor2)).toString()), 3000);
                assert.equal(web3.utils.fromWei((await I_SecurityToken.balanceOf.call(account_investor3)).toString()), 5500);
                assert.equal(web3.utils.fromWei((await I_SecurityToken.balanceOf.call(account_investor5)).toString()), 3500);
            });

            it("\t\t Should successfully vote by the investor 4", async() => {
                let salt = getRandom();
                saltArray.push(salt);
                let tx = await I_PLCRVotingCheckpoint.commitVote(new BN(0),  web3.utils.soliditySha3(3, salt), {from: account_investor4});
                assert.equal(tx.logs[0].args._ballotId, 0);
                assert.equal(tx.logs[0].args._secretVote, web3.utils.soliditySha3(3, salt));
                assert.equal(tx.logs[0].args._voter, account_investor4);  
                
                let data = await I_PLCRVotingCheckpoint.getBallotDetails.call(new BN(0));
                assert.equal(data[5], 3);
                assert.equal(data[7], true);
            })

            it("\t\t Should fail to vote with a zero weight \n", async() => {
                let salt = getRandom();
                await catchRevert(
                    I_PLCRVotingCheckpoint.commitVote(new BN(0),  web3.utils.soliditySha3(2, salt), {from: account_investor5})
                );
            });

            it("\t\t Should create a new ballot \n", async() => {
                let commitTime = new BN(duration.days(10));
                let revealTime = new BN(duration.days(10));
                let tx = await I_PLCRVotingCheckpoint.createBallot(commitTime, revealTime, new BN(4), new BN(51).mul(new BN(10).pow(new BN(16))), {from: account_delegate});
                assert.equal((tx.logs[0].args._noOfProposals).toString(), 4);
                assert.equal((tx.logs[0].args._checkpointId).toString(), 2);
                assert.equal((tx.logs[0].args._ballotId).toString(), 1);
            });

            it("\t\t Should reveal the vote -- failed because not a valid stage \n", async() => {
                await catchRevert(
                    I_PLCRVotingCheckpoint.revealVote(new BN(0), new BN(0), saltArray[1], {from: account_investor3})
                );
            })

            it("\t\t Should try to commit vote but failed because commit periods end \n", async() => {
                let salt = getRandom();
                await increaseTime(duration.days(4));

                await catchRevert(
                    I_PLCRVotingCheckpoint.commitVote(new BN(0),  web3.utils.soliditySha3(1, salt), {from: account_investor2})
                );
            });

            it("\t\t Should fail to reveal vote -- not a valid ballot Id \n", async() => {
                await catchRevert(
                    I_PLCRVotingCheckpoint.revealVote(new BN(4), new BN(1), saltArray[1], {from: account_investor3})
                );
            });

            it("\t\t Should fali to reveal the vote -- not have the secret vote \n", async() => {
                await catchRevert(
                    I_PLCRVotingCheckpoint.revealVote(new BN(0), new BN(1), saltArray[1], {from: account_investor4})
                );
            });

            it("\t\t Should fail to reveal vote -- not a valid choice of proposal \n", async() => {
                await catchRevert(
                    I_PLCRVotingCheckpoint.revealVote(new BN(0), new BN(5), saltArray[1], {from: account_investor3})
                );
            });

            it("\t\t Should fail to reveal vote -- Invalid salt \n", async() => {
                await catchRevert(
                    I_PLCRVotingCheckpoint.revealVote(new BN(0), new BN(1), getRandom(), {from: account_investor3})
                );
            });

            it("\t\t Should successfully reveal the vote by investor 3 \n", async() => {
                let tx = await I_PLCRVotingCheckpoint.revealVote(new BN(0), new BN(1), saltArray[1], {from: account_investor3});
                assert.equal(tx.logs[0].args._voter, account_investor3);
                assert.equal(tx.logs[0].args._ballotId, 0);
                assert.equal(tx.logs[0].args._choiceOfProposal, 1);
                assert.equal(tx.logs[0].args._salt, saltArray[1]);
                let data = await I_PLCRVotingCheckpoint.getBallotDetails.call(new BN(0));
                assert.equal(data[5], 3);
                assert.equal(data[6], 1);
                assert.equal(data[7], true);
            });

            it("\t\t Should fail to change the ballot status-- bad owner \n", async() => {
                await catchRevert(
                    I_PLCRVotingCheckpoint.changeBallotStatus(new BN(0), false, {from: account_polymath})
                );
            });

            it("\t\t Should fail to change the ballot status-- no change in the state \n", async() => {
                await catchRevert(
                    I_PLCRVotingCheckpoint.changeBallotStatus(new BN(0), true, {from: token_owner})
                );
            });

            it("\t\t Should change the status of the ballot with the help of changeBallotStatus \n", async() => {
                let tx = await I_PLCRVotingCheckpoint.changeBallotStatus(new BN(0), false, {from: token_owner});
                assert.equal(tx.logs[0].args._ballotId, 0);
                assert.isFalse(tx.logs[0].args._newStatus);
            });

            it("\t\t Should fail to reveal vote as ballot status is false \n", async() => {
                await catchRevert(
                    I_PLCRVotingCheckpoint.revealVote(new BN(0), new BN(2), saltArray[0], {from: account_investor1})
                );
            });

            it("\t\t Should successfully reveal the vote by investor 1 \n", async() => {
                let tx = await I_PLCRVotingCheckpoint.changeBallotStatus(new BN(0), true, {from: token_owner});
                assert.equal(tx.logs[0].args._ballotId, 0);
                assert.isTrue(tx.logs[0].args._newStatus);

                let txData = await I_PLCRVotingCheckpoint.revealVote(new BN(0), new BN(2), saltArray[0], {from: account_investor1});
                assert.equal(txData.logs[0].args._voter, account_investor1);
                assert.equal(txData.logs[0].args._ballotId, 0);
                assert.equal(txData.logs[0].args._choiceOfProposal, 2);
                assert.equal(txData.logs[0].args._salt, saltArray[0]);
                let data = await I_PLCRVotingCheckpoint.getBallotDetails.call(new BN(0));
                assert.equal(data[5], 3);
                assert.equal(data[6], 2);
                assert.equal(data[7], true);
            });

            it("\t\t Should fail to reveal vote again \n", async() => {
                await catchRevert(
                    I_PLCRVotingCheckpoint.revealVote(new BN(0), new BN(2), saltArray[0], {from: account_investor1})
                );
            });

            it("\t\t Should ge the ballot stage \n", async() => {
                let stage1 = await I_PLCRVotingCheckpoint.getCurrentBallotStage.call(new BN(0));
                assert.equal(stage1.toString(), 2);
                let stage2 = await I_PLCRVotingCheckpoint.getCurrentBallotStage.call(new BN(1));
                assert.equal(stage2.toString(), 1);
            });

            it("\t\t Should fail to reveal vote when reveal period is over \n", async() => {
                await increaseTime(duration.days(5));
                await catchRevert(
                    I_PLCRVotingCheckpoint.revealVote(new BN(0), new BN(3), saltArray[3], {from: account_investor4})
                );
            });

            it("\t\t Should check who votes whom \n", async() => {
                // If we give Invalid ballot id, This function will always return 0
                assert.equal(((await I_PLCRVotingCheckpoint.getSelectedProposal.call(new BN(5), account_investor1))).toString(), 0);

                assert.equal(((await I_PLCRVotingCheckpoint.getSelectedProposal.call(new BN(0), account_investor1))).toString(), 2);
                assert.equal(((await I_PLCRVotingCheckpoint.getSelectedProposal.call(new BN(0), account_investor2))).toString(), 0);
                assert.equal(((await I_PLCRVotingCheckpoint.getSelectedProposal.call(new BN(0), account_investor3))).toString(), 1);
            });

            it("\t\t Should give the result to 0 because ballot id is not valid", async() => {
                let data = await I_PLCRVotingCheckpoint.getBallotResults.call(new BN(5));
                assert.equal(data[0].length, 0);
                assert.equal(data[1].length, 0);
                assert.equal(data[2].toString(), 0);
                assert.isFalse(data[3]);
                assert.equal(data[4].toString(), 0);
            });

            it("\t\t Should get the result of the ballot \n", async() => {
                let data = await I_PLCRVotingCheckpoint.getBallotResults.call(new BN(0));
                assert.equal(web3.utils.fromWei((data[0][0]).toString()), 5000);
                assert.equal(web3.utils.fromWei((data[0][1]).toString()), 500);
                assert.equal(data[1].length, 0);
                assert.equal(data[2].toString(), 1);
                assert.isTrue(data[3]);
                assert.equal(data[4].toString(), 2);
            });

            it("\t\t Should fail to change the ballot status after the ballot ends", async() => {
                await increaseTime(duration.days(20));
                await catchRevert(
                    I_PLCRVotingCheckpoint.changeBallotStatus(new BN(1), false, {from: token_owner})
                );
            });
        });

        describe("\t\t General function test \n", async() => {

            it("\t\t Should check the permission \n", async() => {
                let data = await I_PLCRVotingCheckpoint.getPermissions.call();
                assert.equal(data.length, 1);
            });

            it("\t\t Should check the init function \n", async() => {
                assert.equal(await I_PLCRVotingCheckpoint.getInitFunction.call(), "0x00000000");
            });
        });

        describe("\t\t Factory test cases \n", async() => {
            it("\t\t Should get the exact details of the factory \n", async () => {
                assert.equal((await I_PLCRVotingCheckpointFactory.setupCost.call()).toNumber(), 0);
                assert.equal((await I_PLCRVotingCheckpointFactory.getTypes.call())[0], 4);
                assert.equal(await I_PLCRVotingCheckpointFactory.version.call(), "3.0.0");
                assert.equal(
                    web3.utils.toAscii(await I_PLCRVotingCheckpointFactory.name.call()).replace(/\u0000/g, ""),
                    "PLCRVotingCheckpoint",
                    "Wrong Module added"
                );
                assert.equal(
                    await I_PLCRVotingCheckpointFactory.description.call(),
                    "Commit & reveal technique used for voting",
                    "Wrong Module added"
                );
                assert.equal(await I_PLCRVotingCheckpointFactory.title.call(), "PLCR Voting Checkpoint", "Wrong Module added");
                let tags = await I_PLCRVotingCheckpointFactory.getTags.call();
                assert.equal(tags.length, 3);
            });
        });
    });
});
