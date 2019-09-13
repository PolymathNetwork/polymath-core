import latestTime from "./helpers/latestTime";
import { duration } from "./helpers/utils";
import { takeSnapshot, increaseTime, revertToSnapshot } from "./helpers/time";
import { setUpPolymathNetwork, deployAdvancedPLCRVotingCheckpointAndVerifyed } from "./helpers/createInstances";
import { catchRevert } from "./helpers/exceptions";

const SecurityToken = artifacts.require("./SecurityToken.sol");
const GeneralTransferManager = artifacts.require("./GeneralTransferManager");
const AdvancedPLCRVotingCheckpointFactory = artifacts.require("./AdvancedPLCRVotingCheckpointFactory.sol");
const AdvancedPLCRVotingCheckpoint = artifacts.require("./AdvancedPLCRVotingCheckpoint");
const STGetter = artifacts.require("./STGetter.sol");

const Web3 = require("web3");
let BN = Web3.utils.BN;
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port

contract("AdvancedPLCRVotingCheckpoint", accounts => {
    // Accounts Variable declaration
    let account_polymath;
    let account_issuer;
    let token_owner;
    let account_investor1;
    let account_investor2;
    let account_investor3;
    let account_investor4;
    let account_investor5;
    let account_treasury;

    // Contract Instance Declaration
    let I_SecurityTokenRegistryProxy;
    let I_GeneralTransferManagerFactory;
    let I_AdvancedPLCRVotingCheckpoint;
    let I_AdvancedPLCRVotingCheckpointFactory;
    let P_AdvancedPLCRVotingCheckpointFactory
    let I_GeneralTransferManager;
    let I_ModuleRegistry;
    let I_ModuleRegistryProxy;
    let I_MRProxied;
    let I_STRProxied;
    let I_FeatureRegistry;
    let I_SecurityTokenRegistry;
    let I_STFactory;
    let I_SecurityToken;
    let I_PolyToken;
    let I_PolymathRegistry;
    let I_STRGetter;
    let I_STGetter;
    let stGetter;

    // SecurityToken Details
    const name = "Team";
    const symbol = "SAP";
    const tokenDetails = "This is equity type of issuance";

    // Module key
    const CHECKPOINT_KEY = 4;
    const transferManagerKey = 2

    // Initial fee for ticker registry and security token registry
    const initRegFee = web3.utils.toWei("1000");
    const address_zero = "0x0000000000000000000000000000000000000000";
    let secrets = new Array(20);
    let snap_id;
    
    async function currentTime() {
        return new BN(await latestTime());
    }

    function convertToNumber(value) {
        return web3.utils.fromWei(value.toString());
    }

    function bn(value) {
        return new BN(web3.utils.toWei(value.toString()));
    }

    before(async () => {
        // Accounts setup
        account_polymath = accounts[0];
        account_issuer = accounts[1];

        token_owner = account_issuer;
        account_treasury = accounts[5];
        account_investor1 = accounts[7];
        account_investor2 = accounts[8];
        account_investor3 = accounts[9];
        account_investor4 = accounts[6];
        account_investor5 = accounts[4];


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

        // STEP 2: Deploy the AdvancedPLCRVotingCheckpointFactory
        [I_AdvancedPLCRVotingCheckpointFactory] = await deployAdvancedPLCRVotingCheckpointAndVerifyed(account_polymath, I_MRProxied, 0);
        // STEP 3: Deploy Paid the AdvancedPLCRVotingCheckpointFactory
        [P_AdvancedPLCRVotingCheckpointFactory] = await deployAdvancedPLCRVotingCheckpointAndVerifyed(account_polymath, I_MRProxied, web3.utils.toWei("500", "ether"));

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
        AdvancedPLCRVotingCheckpointFactory:      ${I_AdvancedPLCRVotingCheckpointFactory.address}
        -----------------------------------------------------------------------------
        `);
    });

    describe("Generate the SecurityToken", async () => {
        it("Should register the ticker before the generation of the security token", async () => {
            await I_PolyToken.getTokens(new BN(web3.utils.toWei("50000", "ether")), token_owner);
            await I_PolyToken.approve(I_STRProxied.address, new BN(initRegFee), { from: token_owner });
            let tx = await I_STRProxied.registerTicker(token_owner, symbol, name, { from: token_owner });
            assert.equal(tx.logs[0].args._owner, token_owner);
            assert.equal(tx.logs[0].args._ticker, symbol);
        });

        it("Should generate the new security token with the same symbol as registered above", async () => {
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

        it("Should initialize the auto attached modules", async () => {
            let moduleData = (await stGetter.getModulesByType(transferManagerKey))[0];
            I_GeneralTransferManager = await GeneralTransferManager.at(moduleData);
        });

        it("Should fail to attach the AdvancedPLCRVotingCheckpoint factory with the security token -- Insufficent balance", async () => {
            await I_PolyToken.getTokens(new BN(web3.utils.toWei("500", "ether")), token_owner);
            await catchRevert(
                I_SecurityToken.addModule(P_AdvancedPLCRVotingCheckpointFactory.address, '0x0', new BN(web3.utils.toWei("500", "ether")), new BN(0), {
                    from: token_owner
                }),
                "revert"
            );
        });

        it("Paid APLCR - Should successfully attach the paid version of AdvancedPLCRVotingCheckpoint factory with the security token", async () => {
            let snapId = await takeSnapshot();
            await I_PolyToken.transfer(I_SecurityToken.address, new BN(web3.utils.toWei("5000", "ether")), { from: token_owner });
            const tx = await I_SecurityToken.addModule(
                P_AdvancedPLCRVotingCheckpointFactory.address,
                '0x0',
                new BN(web3.utils.toWei("5000", "ether")),
                new BN(0),
                false,
                { 
                    from: token_owner 
                }
            );
            assert.equal(tx.logs[3].args._types[0].toNumber(), CHECKPOINT_KEY, "AdvancedPLCRVotingCheckpoint factory doesn't get deployed");
            assert.equal(
                web3.utils.toUtf8(tx.logs[3].args._name),
                "AdvancedPLCRVotingCheckpoint",
                "AdvancedPLCRVotingCheckpoint module was not added"
            );
            await revertToSnapshot(snapId);
        });

        it("Free APLCR - Should successfully attach the AdvancedPLCRVotingCheckpoint with the security token", async () => {
            const tx = await I_SecurityToken.addModule(I_AdvancedPLCRVotingCheckpointFactory.address, "0x0", new BN(0), new BN(0), false, { from: token_owner });
            assert.equal(tx.logs[2].args._types[0].toNumber(), CHECKPOINT_KEY, "AdvancedPLCRVotingCheckpointFactory doesn't get deployed");
            assert.equal(
                web3.utils.toUtf8(tx.logs[2].args._name),
                "AdvancedPLCRVotingCheckpoint",
                "AdvancedPLCRVotingCheckpoint module was not added"
            );
            I_AdvancedPLCRVotingCheckpoint = await AdvancedPLCRVotingCheckpoint.at(tx.logs[2].args._module);
        });
    });

    describe("Whitelist addresses and distribute the tokens to the multiple addresses", async() => {
        it("Should whitelist the multiple users", async() => {
            let time = await currentTime();
            await I_GeneralTransferManager.modifyKYCDataMulti(
                [account_investor1, account_investor2, account_investor3, account_investor4],
                [time, time, time, time],
                [time, time, time, time],
                [time.add(new BN (duration.years(1))), time.add(new BN (duration.years(1))), time.add(new BN (duration.years(1))), time.add(new BN (duration.years(1)))],
                {
                    from: token_owner
                }
            );
            // Transfer funds to the users
            await I_SecurityToken.issueMulti(
                [account_investor1, account_investor2, account_investor3, account_investor4],
                [new BN(web3.utils.toWei("5000")), new BN(web3.utils.toWei("9000")), new BN(web3.utils.toWei("2000")), new BN(web3.utils.toWei("10000"))],
                {
                    from: token_owner
                }
            );

            // Verifying the funds
            assert.equal(convertToNumber(await I_SecurityToken.balanceOf.call(account_investor1)), 5000);
            assert.equal(convertToNumber(await I_SecurityToken.balanceOf.call(account_investor2)), 9000);
            assert.equal(convertToNumber(await I_SecurityToken.balanceOf.call(account_investor3)), 2000);
            assert.equal(convertToNumber(await I_SecurityToken.balanceOf.call(account_investor4)), 10000);
        });
    });

    describe("Creation of the Statutory ballot", async() => {

        it.skip("Should check the limit of the no of ballots running", async() => {
            let snapId = await takeSnapshot();
            let name = web3.utils.toHex("Ballot 1");
            let startTime = await latestTime();
            let commitDuration = new BN(duration.seconds(1));
            let revealDuration = new BN(duration.seconds(1));
            let proposalTitle = "Titile 1";
            let details = web3.utils.toHex("Offchain detaiils");
            let choices = "";
            let noOfChoices = 0;

            for (let i = 0; i < 2000; i++) {
                await I_AdvancedPLCRVotingCheckpoint.createStatutoryBallot(
                    name,
                    startTime,
                    commitDuration,
                    revealDuration,
                    proposalTitle,
                    details,
                    choices,
                    noOfChoices,
                    {
                        from: token_owner
                    }
                );
            }
            let mockInvestors = [];
            let mockExempt = [];
            for (let i = 0; i < 100; i++) {
                mockInvestors.push("0x1000000000000000000000000000000000000000".substring(0, 42 - i.toString().length) + i.toString());
                mockExempt.push(true);
            }
            await increaseTime(duration.days(1));
            console.log(`Calculate gas used - ${await I_AdvancedPLCRVotingCheckpoint.changeDefaultExemptedVotersListMulti.estimateGas(mockInvestors, mockExempt, {from: token_owner})}`);
            let tx = await I_AdvancedPLCRVotingCheckpoint.changeDefaultExemptedVotersListMulti(mockInvestors, mockExempt, {from: token_owner});
            console.log((await I_AdvancedPLCRVotingCheckpoint.getBallotsArrayLength.call()).toString());
            console.log(tx.receipt.gasUsed);
            await revertToSnapshot(snapId);
        });

        it("Should fail to create the statutory wallet -- Empty title", async() => {
            let name = web3.utils.toHex("Ballot 1");
            let startTime = await currentTime();
            let commitDuration = new BN(duration.seconds(5000));
            let revealDuration = new BN(duration.seconds(4000));
            let proposalTitle = "";
            let details = web3.utils.toHex("Offchain detaiils");
            let choices = "";
            let noOfChoices = 0;
            await catchRevert(I_AdvancedPLCRVotingCheckpoint.createStatutoryBallot(
                name,
                startTime,
                commitDuration,
                revealDuration,
                proposalTitle,
                details,
                choices,
                noOfChoices,
                {
                    from: token_owner
                }
            ));
        });

        it("Should fail to create the statutory wallet -- Invalid duration (commitDuration)", async() => {
            let name = web3.utils.toHex("Ballot 1");
            let startTime = await currentTime();
            let commitDuration = new BN(0);
            let revealDuration = new BN(duration.seconds(4000));
            let proposalTitle = "Title 1";
            let details = web3.utils.toHex("Offchain detaiils");
            let choices = "";
            let noOfChoices = 0;
            await catchRevert(I_AdvancedPLCRVotingCheckpoint.createStatutoryBallot(
                name,
                startTime,
                commitDuration,
                revealDuration,
                proposalTitle,
                details,
                choices,
                noOfChoices,
                {
                    from: token_owner
                }
            ));
        });

        it("Should fail to create the statutory ballot - Invalid permission", async() => {
            let name = web3.utils.toHex("Ballot 1");
            let startTime = (await currentTime()).add(new BN(duration.days(1)));
            let commitDuration = new BN(duration.hours(5));
            let revealDuration = new BN(duration.hours(4));
            let proposalTitle = "Titile 1";
            let details = web3.utils.toHex("Offchain detaiils");
            let choices = "";
            let noOfChoices = 0;
            await catchRevert(
             I_AdvancedPLCRVotingCheckpoint.createStatutoryBallot(
                name,
                startTime,
                commitDuration,
                revealDuration,
                proposalTitle,
                details,
                choices,
                noOfChoices,
                {
                    from: account_investor2
                }
            ));
        });

        it("Should create the statutory ballot successfully", async() => {
            let name = web3.utils.toHex("Ballot 1");
            let startTime = (await currentTime()).add(new BN(duration.days(1)));
            let commitDuration = new BN(duration.hours(5));
            let revealDuration = new BN(duration.hours(4));
            let proposalTitle = "Titile 1";
            let details = web3.utils.toHex("Offchain detaiils");
            let choices = "";
            let noOfChoices = 0;
            let tx = await I_AdvancedPLCRVotingCheckpoint.createStatutoryBallot(
                name,
                startTime,
                commitDuration,
                revealDuration,
                proposalTitle,
                details,
                choices,
                noOfChoices,
                {
                    from: token_owner
                }
            );
            assert.equal(await I_SecurityToken.currentCheckpointId.call(), 1);
            assert.equal(web3.utils.toUtf8(tx.logs[0].args._name), "Ballot 1");
            assert.equal(tx.logs[0].args._checkpointId, 1);
            assert.equal(tx.logs[0].args._ballotId, 0);
            assert.equal(tx.logs[0].args._startTime, startTime.toString());
            assert.equal(tx.logs[0].args._commitDuration, commitDuration.toString());
            assert.equal(tx.logs[0].args._revealDuration, revealDuration.toString());
            assert.equal(web3.utils.toUtf8(tx.logs[0].args._details), "Offchain detaiils");

            let ballotDetails = await I_AdvancedPLCRVotingCheckpoint.getBallotDetails.call(tx.logs[0].args._ballotId);
            assert.equal(convertToNumber(ballotDetails[1]), convertToNumber(await I_SecurityToken.totalSupply.call()));
            assert.equal(web3.utils.toUtf8(ballotDetails[0]), "Ballot 1");
            assert.equal(ballotDetails[2], 1);
            assert.equal(ballotDetails[3].toString(), startTime.toString());
            assert.equal(ballotDetails[6].toString(), 1);
            assert.equal(ballotDetails[12][0], 0);
            assert.equal(ballotDetails[10], 0);
            assert.isFalse(ballotDetails[9]);
        });

        it("Should fail to commit the vote -- Incorrect stage", async() => {
            secrets[0] = Math.floor(Math.random() * 100000000); // 8 digits
            let ballotId = new BN(0); 
            await catchRevert(
                I_AdvancedPLCRVotingCheckpoint.commitVote(
                ballotId, 
                web3.utils.soliditySha3(bn("3500"), new BN(0), bn("1500"), new BN(secrets[0])), 
                {
                    from : account_investor1
                }),
                "Invalid stage"
            );
        });

        it("Should exempt the investor", async() => {
            await I_AdvancedPLCRVotingCheckpoint.changeBallotExemptedVotersList(new BN(0), account_investor4, true, {from: token_owner}); 
            let exemptedVoters = await I_AdvancedPLCRVotingCheckpoint.getExemptedVotersByBallot.call(new BN(0));
            assert.equal(exemptedVoters.length, 1);
            assert.equal(exemptedVoters[0], account_investor4);
        });

        it("Should fail to commit the vote -- Bad ballot id", async() => {
            await increaseTime(Math.floor(duration.days(1.1)));
            let ballotId = new BN(2);   // Bad ballot Id
            let secretVote = await web3.utils.soliditySha3(bn("3500"), new BN(0), bn("1500"), new BN(secrets[0])); //BN(1)
            await catchRevert(
                I_AdvancedPLCRVotingCheckpoint.commitVote(
                ballotId, 
                web3.utils.soliditySha3(bn("3500"), new BN(0), bn("1500"), new BN(secrets[0])), 
                {
                    from : account_investor1
                }),
                "Index out of bound"
            );
        });

        it("Should fail to commit the vote -- Bad secret vote", async() => {
            let ballotId = new BN(0); 
            await catchRevert(
                I_AdvancedPLCRVotingCheckpoint.commitVote(
                ballotId, 
                "0x0", 
                {
                    from : account_investor1
                }),
                "Invalid vote"
            );
        });

        it("Should fail to commit vote -- Invalid voter", async() => {
            let ballotId = new BN(0);
            await catchRevert(
                I_AdvancedPLCRVotingCheckpoint.commitVote(
                ballotId, 
                web3.utils.soliditySha3(bn("3500"), new BN(0), bn("1500"), new BN(secrets[0])), 
                {
                    from : account_investor4
                }),
                "Invalid voter"
            );
        });

        it("Should successfully commit the vote in commit duration", async() => {
            secrets[0] = Math.floor(Math.random() * 100000000); // 8 digits
            let ballotId = new BN(0);
            // Recieve some balance from another token holder to validate the functionality of the checkpoint
            await I_SecurityToken.transfer(account_investor1, new BN(web3.utils.toWei("1000")), {from: account_investor4});
            // Checking the pending ballot list for the investor1
            let pendingListBefore = await I_AdvancedPLCRVotingCheckpoint.pendingBallots.call(account_investor1);
            pendingListBefore = pendingListBefore.commitBallots;
            assert.equal(pendingListBefore.length, 1);
            assert.equal(pendingListBefore[0], 0);
            let tx = await I_AdvancedPLCRVotingCheckpoint.commitVote(
                ballotId, 
                web3.utils.soliditySha3(bn(3500),new BN(0),bn(1500), new BN(secrets[0])), 
                {
                    from : account_investor1
                }
            );
            let pendingInvestorsToVote = await I_AdvancedPLCRVotingCheckpoint.getPendingInvestorToVote.call(ballotId);
            console.log(pendingInvestorsToVote);
            assert.notInclude(pendingInvestorsToVote, account_investor1);
            // Checking the pending ballot list for the investor1
            let pendingListAfter = await I_AdvancedPLCRVotingCheckpoint.pendingBallots.call(account_investor1);
            pendingListAfter = pendingListAfter.commitBallots;
            let ballotDetails = await I_AdvancedPLCRVotingCheckpoint.getBallotDetails.call(ballotId);
            assert.equal(pendingListAfter.length, 0);
            assert.equal(
                convertToNumber(tx.logs[0].args._weight),
                convertToNumber(await stGetter.balanceOfAt.call(account_investor1, ballotDetails[2]))
            );
            assert.equal(tx.logs[0].args._voter, account_investor1);
            assert.equal(tx.logs[0].args._ballotId, 0);
            let commitVoteCount = await I_AdvancedPLCRVotingCheckpoint.getCommitedVoteCount.call(new BN(0));
            assert.equal(commitVoteCount, 1);
        });

        it("Should fail to commit vote -- Already voted", async() => {
            let ballotId = new BN(0);
            await catchRevert(
                I_AdvancedPLCRVotingCheckpoint.commitVote(
                    ballotId, 
                    web3.utils.soliditySha3(bn(3500),new BN(0),bn(1500), new BN(secrets[0])), 
                    {
                        from : account_investor1
                    }),
                "Already voted"
            );
        });

        it("Should fail to commit vote -- Invalid weight", async() => {
            let time = await currentTime();
            let ballotId = new BN(0);
            await I_GeneralTransferManager.modifyKYCData(
                account_investor5,
                time,
                time,
                time.add(new BN (duration.years(1))),
                {
                    from: token_owner
                }
            );
            // Transfer funds to the users
            await I_SecurityToken.issue(
                account_investor5,
                new BN(web3.utils.toWei("5000")),
                "0x0",
                {
                    from: token_owner
                }
            );
            await catchRevert(
                I_AdvancedPLCRVotingCheckpoint.commitVote(
                    ballotId, 
                    web3.utils.soliditySha3(bn(5000),new BN(0),new BN(0), new BN(secrets[0])), 
                    {
                        from : account_investor5
                    }),
                "Invalid weight"       
            );
        });

        it("Should commit vote by other investors", async() => {
            secrets[1] = Math.floor(Math.random() * 100000000); // 8 digits
            let ballotId = new BN(0);
            let tx = await I_AdvancedPLCRVotingCheckpoint.commitVote(
                ballotId, 
                web3.utils.soliditySha3(new BN(0),bn(7000),bn(2000), new BN(secrets[1])), 
                {
                    from : account_investor2
                }
            );
            // Checking the pending ballot list for the investor1
            let pendingListAfter = await I_AdvancedPLCRVotingCheckpoint.pendingBallots.call(account_investor2);
            pendingListAfter = pendingListAfter.commitBallots;
            let ballotDetails = await I_AdvancedPLCRVotingCheckpoint.getBallotDetails.call(ballotId);
            assert.equal(pendingListAfter.length, 0);
            assert.equal(
                convertToNumber(tx.logs[0].args._weight),
                convertToNumber(await stGetter.balanceOfAt.call(account_investor2, ballotDetails[2]))
            );
            assert.equal(tx.logs[0].args._voter, account_investor2);
            assert.equal(tx.logs[0].args._ballotId, 0);
            let commitVoteCount = await I_AdvancedPLCRVotingCheckpoint.getCommitedVoteCount.call(new BN(0));
            assert.equal(commitVoteCount, 2);
            secrets[2] = Math.floor(Math.random() * 100000000); // 8 digits
            tx = await I_AdvancedPLCRVotingCheckpoint.commitVote(
                ballotId, 
                web3.utils.soliditySha3(bn(2000),new BN(0),new BN(0), new BN(secrets[2])), 
                {
                    from : account_investor3
                }
            );
            commitVoteCount = await I_AdvancedPLCRVotingCheckpoint.getCommitedVoteCount.call(new BN(0));
            assert.equal(commitVoteCount, 3);
        });

        it("Should fail to reveal the vote in the commit phase -- Invalid stage", async() => {
            let ballotId = new BN(0);
            assert.equal((await I_AdvancedPLCRVotingCheckpoint.getCurrentBallotStage.call(ballotId)).toString(), 1);
            // try to reveal in the commit phase
            await catchRevert(
                I_AdvancedPLCRVotingCheckpoint.revealVote(
                    ballotId,
                    [bn(3500),new BN(0),bn(1500)],
                    secrets[0],
                    {
                        from: account_investor1
                    }
                )
            );
            await increaseTime(Math.floor(duration.hours(5)));
            assert.equal((await I_AdvancedPLCRVotingCheckpoint.getCurrentBallotStage.call(ballotId)).toString(), 2);
        });

        it("Should fail to reveal the vote -- Invalid vote", async() =>{
            let ballotId = new BN(0);
            await catchRevert(
                I_AdvancedPLCRVotingCheckpoint.revealVote(
                    ballotId,
                    [bn(3500),new BN(0),bn(2500)],
                    secrets[0],
                    {
                        from: account_investor1
                    }
                ),
                "Invalid vote"
            );
        });

        it("Should fail to reveal the vote -- choices count mismatch", async() => {
            let ballotId = new BN(0);
            await catchRevert(
                I_AdvancedPLCRVotingCheckpoint.revealVote(
                    ballotId,
                    [bn(3500),new BN(0)],
                    secrets[0],
                    {
                        from: account_investor1
                    }
                ),
                "choices count mismatch"
            );
        });

        it("Should fail to reveal the vote -- Cancelled ballot", async() => {
            let ballotId = new BN(0);
            let snap_id = await takeSnapshot();
            await I_AdvancedPLCRVotingCheckpoint.cancelBallot(ballotId, {from: token_owner});
            await catchRevert(
                I_AdvancedPLCRVotingCheckpoint.revealVote(
                    ballotId,
                    [bn(3500),new BN(0)],
                    secrets[0],
                    {
                        from: account_investor1
                    }
                ),
                "Cancelled ballot"
            );
            await revertToSnapshot(snap_id);
        });

        it("Should fail to reveal vote -- Secret vote not available", async() => {
            let ballotId = new BN(0);
            await catchRevert(
                I_AdvancedPLCRVotingCheckpoint.revealVote(
                    ballotId,
                    [bn(3500),new BN(0),bn(1500)],
                    secrets[0],
                    {
                        from: account_investor4
                    }
                ),
                "Secret vote not available"
            );
        });

        it("Should successfully reveal vote", async() => {
            let ballotId = new BN(0);
            let tx = await I_AdvancedPLCRVotingCheckpoint.revealVote(
                    ballotId,
                    [bn(3500),new BN(0),bn(1500)],
                    secrets[0],
                    {
                        from: account_investor1
                    }
            );
            let ballotDetails = await I_AdvancedPLCRVotingCheckpoint.getBallotDetails.call(ballotId);
            assert.equal(ballotDetails[7], 1);
            assert.equal(tx.logs[0].args._voter, account_investor1);
            assert.equal(
                convertToNumber(tx.logs[0].args._weight),
                convertToNumber(await stGetter.balanceOfAt.call(account_investor1, ballotDetails[2]))
            );
            assert.equal((tx.logs[0].args._ballotId).toString(), ballotId.toString());
            assert.equal((tx.logs[0].args._salt).toString(), secrets[0]);
            let commitVoteCount = await I_AdvancedPLCRVotingCheckpoint.getCommitedVoteCount.call(new BN(0));
            assert.equal(commitVoteCount, 3);
        });

        it("Should sucessfully reveal vote by other investors", async() => {
            let ballotId = new BN(0);
            let tx = await I_AdvancedPLCRVotingCheckpoint.revealVote(
                    ballotId,
                    [new BN(0),bn(7000),bn(2000)],
                    secrets[1],
                    {
                        from: account_investor2
                    }
            );
            let ballotDetails = await I_AdvancedPLCRVotingCheckpoint.getBallotDetails.call(ballotId);
            assert.equal(ballotDetails[7], 2);
            assert.equal(tx.logs[0].args._voter, account_investor2);
            assert.equal(
                convertToNumber(tx.logs[0].args._weight),
                convertToNumber(await stGetter.balanceOfAt.call(account_investor2, ballotDetails[2]))
            );
            assert.equal((tx.logs[0].args._ballotId).toString(), ballotId.toString());
            assert.equal((tx.logs[0].args._salt).toString(), secrets[1]);
            
            tx = await I_AdvancedPLCRVotingCheckpoint.revealVote(
                ballotId,
                [bn(2000), new BN(0), new BN(0)],
                secrets[2],
                {
                    from: account_investor3
                }
            );
            ballotDetails = await I_AdvancedPLCRVotingCheckpoint.getBallotDetails.call(ballotId);
            assert.equal(ballotDetails[7], 3);
            assert.equal(tx.logs[0].args._voter, account_investor3);
            assert.equal(
                convertToNumber(tx.logs[0].args._weight),
                convertToNumber(await stGetter.balanceOfAt.call(account_investor3, ballotDetails[2]))
            );
            assert.equal((tx.logs[0].args._ballotId).toString(), ballotId.toString());
            assert.equal((tx.logs[0].args._salt).toString(), secrets[2]);
            let commitVoteCount = await I_AdvancedPLCRVotingCheckpoint.getCommitedVoteCount.call(new BN(0));
            assert.equal(commitVoteCount, 3);
        });

        it("Should fail to cancel the ballot -- Index out of bound", async() => {
            let ballotId = new BN(5);
            await catchRevert(
                I_AdvancedPLCRVotingCheckpoint.cancelBallot(ballotId, {from: token_owner}),
                "Index out of bound"
            );
        });

        it("Should successfully cancel the ballot", async() => {
            snap_id = await takeSnapshot();
            let ballotId = new BN(0);
            let tx = await I_AdvancedPLCRVotingCheckpoint.cancelBallot(ballotId, {from: token_owner});
            assert.equal(tx.logs[0].args._ballotId, 0);
            assert.isTrue((await I_AdvancedPLCRVotingCheckpoint.getBallotDetails.call(ballotId))[9]);
        });

        it("Should fail to cancel the ballot again -- Already cancelled", async() => {
            let ballotId = new BN(0);
            await catchRevert(
                I_AdvancedPLCRVotingCheckpoint.cancelBallot(ballotId, {from: token_owner}),
                "Already cancelled"
            );
        });

        it("Should get the zero result of the ballot because ballot is cancelled", async() => {
            let ballotId = new BN(0);
            let result = await I_AdvancedPLCRVotingCheckpoint.getBallotResults.call(ballotId);
            assert.equal(result[0].length, 0);
            assert.equal(result[1].length, 0);
            assert.equal(result[2].length, 0);
            await revertToSnapshot(snap_id);
        });

        it("Should get the the result successfully", async() => {
            let ballotId = new BN(0);
            await increaseTime(duration.hours(7));
            let result = await I_AdvancedPLCRVotingCheckpoint.getBallotResults.call(ballotId);
            assert.equal(convertToNumber(result.choicesWeighting[0]), 5500);
            assert.equal(convertToNumber(result.choicesWeighting[1]), 7000);
            assert.equal(convertToNumber(result.choicesWeighting[2]), 3500);
            assert.equal(result.noOfChoicesInProposal, 3);
            assert.equal(result.voters[0], account_investor1);
            assert.equal(result.voters[1], account_investor2);
            assert.equal(result.voters[2], account_investor3);
            console.log(`
                Weight of choice NAY - ${convertToNumber(result.choicesWeighting[0])}
                Weight of choice YAY - ${convertToNumber(result.choicesWeighting[1])}
                Weight of choice ABSTAIN - ${convertToNumber(result.choicesWeighting[2])}
                No of choices in a proposal - ${result.noOfChoicesInProposal}
                Winner is - YAY
            `);
        });
    });

    describe("Test cases for the other functions those are used to create ballot", async() => {
        
        it("Should create ballot using custom", async() => {
            // Transfers tokens
            await I_SecurityToken.transfer(account_investor3, bn(4000), {from: account_investor2});
            await I_SecurityToken.transfer(account_investor4, bn(1000), {from: account_investor3});
            await I_SecurityToken.transfer(account_investor2, bn(2000), {from: account_investor1});
            // Create checkpoint
            await I_SecurityToken.createCheckpoint({from: token_owner});
            let name = web3.utils.toHex("Ballot 2");
            let latestCheckpointId = await I_SecurityToken.currentCheckpointId.call();
            let startTime = (await currentTime()).add(new BN(duration.days(1)));
            let commitDuration = new BN(duration.hours(6));
            let revealDuration = new BN(duration.hours(6));
            let proposalTitle = "Titile 2";
            let details = web3.utils.toHex("Offchain detaiils");
            let choices = "Choice A, Choice B, Choice C, Choice D";
            let noOfChoices = 4;
            // Fail to create if the checkpoint is greater than the latest one
            await catchRevert(
                I_AdvancedPLCRVotingCheckpoint.createCustomStatutoryBallot(
                    name,
                    startTime,
                    commitDuration,
                    revealDuration,
                    proposalTitle,
                    details,
                    choices,
                    noOfChoices,
                    latestCheckpointId.add(new BN(1)),
                    {
                        from: token_owner
                    }
                ),
                "Invalid checkpoint Id"
            );
            // Create successfully ballot
            let tx = await I_AdvancedPLCRVotingCheckpoint.createCustomStatutoryBallot(
                name,
                startTime,
                commitDuration,
                revealDuration,
                proposalTitle,
                details,
                choices,
                noOfChoices,
                latestCheckpointId,
                {
                    from: token_owner
                }
            );
            assert.equal(await I_SecurityToken.currentCheckpointId.call(), 2);
            assert.equal(web3.utils.toUtf8(tx.logs[0].args._name), "Ballot 2");
            assert.equal(tx.logs[0].args._checkpointId, 2);
            assert.equal(tx.logs[0].args._ballotId, 1);
            assert.equal(tx.logs[0].args._startTime, startTime.toString());
            assert.equal(tx.logs[0].args._commitDuration, commitDuration.toString());
            assert.equal(tx.logs[0].args._revealDuration, revealDuration.toString());
            assert.equal(web3.utils.toUtf8(tx.logs[0].args._details), "Offchain detaiils");

            let ballotDetails = await I_AdvancedPLCRVotingCheckpoint.getBallotDetails.call(tx.logs[0].args._ballotId);
            assert.equal(convertToNumber(ballotDetails[1]), convertToNumber(await I_SecurityToken.totalSupply.call()));
            assert.equal(ballotDetails[2], 2);
            assert.equal(ballotDetails[3].toString(), startTime.toString());
            assert.equal(ballotDetails[6].toString(), 1);
            assert.equal(ballotDetails[12][0], noOfChoices);
            assert.equal(ballotDetails[10], 0);
            assert.isFalse(ballotDetails[9]);
        });

        it("Should create the ballot using the exemption list & custom checkpoint Id as well", async() => {
            await I_SecurityToken.transfer(account_investor5, bn(4000), {from: account_investor2});
            await I_SecurityToken.transfer(account_investor2, bn(2000), {from: account_investor1});
            await I_SecurityToken.transfer(account_investor3, bn(1500), {from: account_investor4});

            // Create checkpoint
            await I_SecurityToken.createCheckpoint({from: token_owner});
            let name = web3.utils.toHex("Ballot 3");
            let latestCheckpointId = await I_SecurityToken.currentCheckpointId.call();
            let startTime = (await currentTime()).add(new BN(duration.days(1)));
            let commitDuration = new BN(duration.hours(8));
            let revealDuration = new BN(duration.hours(8));
            let proposalTitle = "Titile 3";
            let details = web3.utils.toHex("Offchain detaiils");
            let choices = "Choice A, Choice B";
            let noOfChoices = 2;

            let tx = await I_AdvancedPLCRVotingCheckpoint.createCustomStatutoryBallotWithExemption(
                name,
                startTime,
                commitDuration,
                revealDuration,
                proposalTitle,
                details,
                choices,
                noOfChoices,
                latestCheckpointId,
                [account_investor1, account_investor2],
                {
                    from: token_owner
                }
            );
            assert.equal(await I_SecurityToken.currentCheckpointId.call(), 3);
            assert.equal(web3.utils.toUtf8(tx.logs[0].args._name), "Ballot 3");
            assert.equal(tx.logs[0].args._checkpointId, 3);
            assert.equal(tx.logs[0].args._ballotId, 2);
            assert.equal(tx.logs[0].args._startTime, startTime.toString());
            assert.equal(tx.logs[0].args._commitDuration, commitDuration.toString());
            assert.equal(tx.logs[0].args._revealDuration, revealDuration.toString());
            assert.equal(web3.utils.toUtf8(tx.logs[0].args._details), "Offchain detaiils");

            let ballotDetails = await I_AdvancedPLCRVotingCheckpoint.getBallotDetails.call(tx.logs[0].args._ballotId);
            assert.equal(convertToNumber(ballotDetails[1]), convertToNumber(await I_SecurityToken.totalSupply.call()));
            assert.equal(ballotDetails[2], 3);
            assert.equal(ballotDetails[3].toString(), startTime.toString());
            assert.equal(ballotDetails[6].toString(), 1);
            assert.equal(ballotDetails[12][0], noOfChoices);
            assert.equal(ballotDetails[10], 0);
            assert.isFalse(ballotDetails[9]);
        });

        it("Should create statutory ballot with exemption list", async() => {
            let name = web3.utils.toHex("Ballot 4");
            let startTime = (await currentTime()).add(new BN(duration.days(1)));
            let commitDuration = new BN(duration.hours(9));
            let revealDuration = new BN(duration.hours(9));
            let proposalTitle = "Titile 4";
            let details = web3.utils.toHex("Offchain detaiils");
            let choices = "Choice A, Choice B, Choice C, Choice D, Choice E";
            let noOfChoices = 5;

            let tx = await I_AdvancedPLCRVotingCheckpoint.createStatutoryBallotWithExemption(
                name,
                startTime,
                commitDuration,
                revealDuration,
                proposalTitle,
                details,
                choices,
                noOfChoices,
                [account_investor5, account_investor4],
                {
                    from: token_owner
                }
            );
            assert.equal(await I_SecurityToken.currentCheckpointId.call(), 4);
            assert.equal(web3.utils.toUtf8(tx.logs[0].args._name), "Ballot 4");
            assert.equal(tx.logs[0].args._checkpointId, 4);
            assert.equal(tx.logs[0].args._ballotId, 3);
            assert.equal(tx.logs[0].args._startTime, startTime.toString());
            assert.equal(tx.logs[0].args._commitDuration, commitDuration.toString());
            assert.equal(tx.logs[0].args._revealDuration, revealDuration.toString());
            assert.equal(web3.utils.toUtf8(tx.logs[0].args._details), "Offchain detaiils");

            let ballotDetails = await I_AdvancedPLCRVotingCheckpoint.getBallotDetails.call(tx.logs[0].args._ballotId);
            assert.equal(convertToNumber(ballotDetails[1]), convertToNumber(await I_SecurityToken.totalSupply.call()));
            assert.equal(ballotDetails[2], 4);
            assert.equal(ballotDetails[3].toString(), startTime.toString());
            assert.equal(ballotDetails[6].toString(), 1);
            assert.equal(ballotDetails[12][0], noOfChoices);
            assert.equal(ballotDetails[10], 0);
            assert.isFalse(ballotDetails[9]);
        });

        it("Should check the right value from getters", async() => {
            // Should return 0 length array when pass invalid ballot id
            let voters = await I_AdvancedPLCRVotingCheckpoint.getAllowedVotersByBallot.call(new BN(5));
            assert.equal(voters.length, 0);
            voters = await I_AdvancedPLCRVotingCheckpoint.getAllowedVotersByBallot.call(new BN(1));
            assert.equal(voters.length, 5);
            assert.equal(voters[0], account_investor1);
            assert.equal(voters[1], account_investor2);
            assert.equal(voters[2], account_investor3);
            assert.equal(voters[3], account_investor4);
            assert.equal(voters[4], account_investor5);
            assert.equal(
                convertToNumber(await I_AdvancedPLCRVotingCheckpoint.getVoteTokenCount.call(account_investor1, new BN(1))),
                convertToNumber(await stGetter.balanceOfAt.call(account_investor1, new BN(2)))
            );
            assert.equal(
                convertToNumber(await I_AdvancedPLCRVotingCheckpoint.getVoteTokenCount.call(account_investor2, new BN(1))),
                convertToNumber(await stGetter.balanceOfAt.call(account_investor2, new BN(2)))
            );
            assert.equal(
                convertToNumber(await I_AdvancedPLCRVotingCheckpoint.getVoteTokenCount.call(account_investor3, new BN(1))),
                convertToNumber(await stGetter.balanceOfAt.call(account_investor3, new BN(2)))
            );
            assert.equal(
                convertToNumber(await I_AdvancedPLCRVotingCheckpoint.getVoteTokenCount.call(account_investor4, new BN(1))),
                convertToNumber(await stGetter.balanceOfAt.call(account_investor4, new BN(2)))
            );
            assert.equal(
                convertToNumber(await I_AdvancedPLCRVotingCheckpoint.getVoteTokenCount.call(account_investor5, new BN(1))),
                convertToNumber(await stGetter.balanceOfAt.call(account_investor5, new BN(2)))
            );
            voters = await I_AdvancedPLCRVotingCheckpoint.getAllowedVotersByBallot.call(new BN(2));
            assert.equal(voters.length, 3);
            assert.equal(voters[0], account_investor3);
            assert.equal(voters[1], account_investor4);
            assert.equal(voters[2], account_investor5);
            assert.equal(
                convertToNumber(await I_AdvancedPLCRVotingCheckpoint.getVoteTokenCount.call(account_investor3, new BN(2))),
                convertToNumber(await stGetter.balanceOfAt.call(account_investor3, new BN(3)))
            );
            assert.equal(
                convertToNumber(await I_AdvancedPLCRVotingCheckpoint.getVoteTokenCount.call(account_investor4, new BN(2))),
                convertToNumber(await stGetter.balanceOfAt.call(account_investor4, new BN(3)))
            );
            assert.equal(
                convertToNumber(await I_AdvancedPLCRVotingCheckpoint.getVoteTokenCount.call(account_investor5, new BN(2))),
                convertToNumber(await stGetter.balanceOfAt.call(account_investor5, new BN(3)))
            );
            // Pending ballots
            let ballots = (await I_AdvancedPLCRVotingCheckpoint.pendingBallots.call(account_investor1))[0];
            assert.notInclude(ballots, 2);
            assert.equal(ballots.length, 2);
            ballots = (await I_AdvancedPLCRVotingCheckpoint.pendingBallots.call(account_investor2))[0];
            assert.equal(ballots.length, 2);
            assert.notInclude(ballots, 2);
            ballots = (await I_AdvancedPLCRVotingCheckpoint.pendingBallots.call(account_investor3))[0];
            assert.equal(ballots.length, 3);
            ballots = (await I_AdvancedPLCRVotingCheckpoint.pendingBallots.call(account_investor4))[0];
            assert.equal(ballots.length, 2);
            assert.notInclude(ballots, 3);
            ballots = (await I_AdvancedPLCRVotingCheckpoint.pendingBallots.call(account_investor5))[0];
            assert.equal(ballots.length, 2);
            assert.notInclude(ballots, 3);
        });
    });

    describe("Test case for cumulative voting", async() => {

        it("Should fail to create the custom cumulative type voting with exemption -- Invalid duration", async() => {
            await I_SecurityToken.transfer(account_investor3, bn(3670), {from: account_investor5});
            await I_SecurityToken.transfer(account_investor2, bn(2000), {from: account_investor1});
            await I_SecurityToken.transfer(account_investor4, bn(1500), {from: account_investor3});

            // Create checkpoint
            await I_SecurityToken.createCheckpoint({from: token_owner});
            let name = web3.utils.toHex("Ballot 5");
            let latestCheckpointId = await I_SecurityToken.currentCheckpointId.call();
            let startTime = (await currentTime()).add(new BN(duration.days(2)));
            let commitDuration = new BN(0);
            let revealDuration = new BN(0);
            let proposalTitle = "Titile 5, Title 6, Title 7";
            let details = [web3.utils.toHex("Offchain detaiils 5"), web3.utils.toHex("Offchain detaiils 6"), web3.utils.toHex("Offchain detaiils 7")];
            let choices = "Choice A, Choice B, Choice C, Choice X, Choice Y, Choice Z, Choice L";
            let noOfChoices = [3,0,4];

            await catchRevert(
                I_AdvancedPLCRVotingCheckpoint.createCustomCumulativeBallotWithExemption(
                    name,
                    startTime,
                    commitDuration,
                    revealDuration,
                    proposalTitle,
                    details,
                    choices,
                    noOfChoices,
                    latestCheckpointId,
                    [account_investor1, account_investor2],
                    {
                        from: token_owner
                    }
                ),
                "Invalid duration"
            );
        });

        it("Should fail to create the custom cumulative type voting with exemption -- Invalid length", async() => {
            let name = web3.utils.toHex("Ballot 5");
            let latestCheckpointId = await I_SecurityToken.currentCheckpointId.call();
            let startTime = (await currentTime()).add(new BN(duration.days(2)));
            let commitDuration = new BN(duration.hours(8));
            let revealDuration = new BN(duration.hours(8));
            let proposalTitle = "Titile 5, Title 6, Title 7";
            let details = [web3.utils.toHex("Offchain detaiils 5"), web3.utils.toHex("Offchain detaiils 6")];
            let choices = "Choice A, Choice B, Choice C, Choice X, Choice Y, Choice Z, Choice L";
            let noOfChoices = [3,0,4];

            await catchRevert(
                I_AdvancedPLCRVotingCheckpoint.createCustomCumulativeBallotWithExemption(
                    name,
                    startTime,
                    commitDuration,
                    revealDuration,
                    proposalTitle,
                    details,
                    choices,
                    noOfChoices,
                    latestCheckpointId,
                    [account_investor1, account_investor2],
                    {
                        from: token_owner
                    }
                ),
                "Length mismatch"
            );
        });

        it("Should fail to create the custom cumulative type voting with exemption -- Invalid name", async() => {
            let name = web3.utils.toHex("");
            let latestCheckpointId = await I_SecurityToken.currentCheckpointId.call();
            let startTime = (await currentTime()).add(new BN(duration.days(2)));
            let commitDuration = new BN(duration.hours(8));
            let revealDuration = new BN(duration.hours(8));
            let proposalTitle = "Titile 5, Title 6, Title 7";
            let details = [web3.utils.toHex("Offchain detaiils 5"), web3.utils.toHex("Offchain detaiils 6"), web3.utils.toHex("Offchain detaiils 7")];
            let choices = "Choice A, Choice B, Choice C, Choice X, Choice Y, Choice Z, Choice L";
            let noOfChoices = [3,0,4];

            await catchRevert(
                I_AdvancedPLCRVotingCheckpoint.createCustomCumulativeBallotWithExemption(
                    name,
                    startTime,
                    commitDuration,
                    revealDuration,
                    proposalTitle,
                    details,
                    choices,
                    noOfChoices,
                    latestCheckpointId,
                    [account_investor1, account_investor2],
                    {
                        from: token_owner
                    }
                ),
                "Invalid name"
            );
        });

        it("Should fail to create the custom cumulative type voting with exemption -- Empty title", async() => {
            let name = web3.utils.toHex("Ballot 5");
            let latestCheckpointId = await I_SecurityToken.currentCheckpointId.call();
            let startTime = (await currentTime()).add(new BN(duration.days(2)));
            let commitDuration = new BN(duration.hours(8));
            let revealDuration = new BN(duration.hours(8));
            let proposalTitle = "";
            let details = [web3.utils.toHex("Offchain detaiils 5"), web3.utils.toHex("Offchain detaiils 6"), web3.utils.toHex("Offchain detaiils 7")];
            let choices = "Choice A, Choice B, Choice C, Choice X, Choice Y, Choice Z, Choice L";
            let noOfChoices = [3,0,4];

            await catchRevert(
                I_AdvancedPLCRVotingCheckpoint.createCustomCumulativeBallotWithExemption(
                    name,
                    startTime,
                    commitDuration,
                    revealDuration,
                    proposalTitle,
                    details,
                    choices,
                    noOfChoices,
                    latestCheckpointId,
                    [account_investor1, account_investor2],
                    {
                        from: token_owner
                    }
                ),
                "Empty title"
            );
        });

        it("Should successfully create the custom cumulative type voting with exemption", async() => {
            let name = web3.utils.toHex("Ballot 5");
            let latestCheckpointId = await I_SecurityToken.currentCheckpointId.call();
            let startTime = (await currentTime()).add(new BN(duration.days(2)));
            let commitDuration = new BN(duration.hours(8));
            let revealDuration = new BN(duration.hours(8));
            let proposalTitle = "Titile 5, Title 6, Title 7";
            let details = [web3.utils.toHex("Offchain detaiils 5"), web3.utils.toHex("Offchain detaiils 6"), web3.utils.toHex("Offchain detaiils 7")];
            let choices = "Choice A, Choice B, Choice C, Choice X, Choice Y, Choice Z, Choice L";
            let noOfChoices = [3,0,4];

            let tx = await I_AdvancedPLCRVotingCheckpoint.createCustomCumulativeBallotWithExemption(
                name,
                startTime,
                commitDuration,
                revealDuration,
                proposalTitle,
                details,
                choices,
                noOfChoices,
                latestCheckpointId,
                [account_investor1, account_investor2],
                {
                    from: token_owner
                }
            );
            assert.equal(await I_SecurityToken.currentCheckpointId.call(), 5);
            assert.equal(web3.utils.toUtf8(tx.logs[0].args._name), "Ballot 5");
            assert.equal(tx.logs[0].args._checkpointId, 5);
            assert.equal(tx.logs[0].args._ballotId, 4);
            assert.equal(tx.logs[0].args._startTime, startTime.toString());
            assert.equal(tx.logs[0].args._commitDuration, commitDuration.toString());
            assert.equal(tx.logs[0].args._revealDuration, revealDuration.toString());
            assert.equal(web3.utils.toUtf8(tx.logs[0].args._details[0]), "Offchain detaiils 5");

            let ballotDetails = await I_AdvancedPLCRVotingCheckpoint.getBallotDetails.call(tx.logs[0].args._ballotId);
            assert.equal(convertToNumber(ballotDetails[1]), convertToNumber(await I_SecurityToken.totalSupply.call()));
            assert.equal(ballotDetails[2], 5);
            assert.equal(ballotDetails[3].toString(), startTime.toString());
            assert.equal(ballotDetails[6].toString(), 3);
            assert.equal(ballotDetails[12][0], noOfChoices[0]);
            assert.equal(ballotDetails[12][1], noOfChoices[1]);
            assert.equal(ballotDetails[12][2], noOfChoices[2]);
            assert.equal(ballotDetails[10], 0);
            assert.isFalse(ballotDetails[9]);
            let exemptedVoters = await I_AdvancedPLCRVotingCheckpoint.getExemptedVotersByBallot.call(tx.logs[0].args._ballotId);
            assert.equal(exemptedVoters[0], account_investor2);
        });

        it("Should successfully create the cummulative ballot", async() => {
            await increaseTime(Math.floor(duration.days(1.65)));
            let name = web3.utils.toHex("Ballot 6");
            let startTime = (await currentTime()).add(new BN(Math.floor(duration.days(0.5))));
            let commitDuration = new BN(duration.hours(8));
            let revealDuration = new BN(duration.hours(8));
            let proposalTitle = "Titile 8, Title 9, Title 10";
            let details = [web3.utils.toHex("Offchain detaiils 8"), web3.utils.toHex("Offchain detaiils 9"), web3.utils.toHex("Offchain detaiils 10")];
            let choices = "Choice A, Choice B";
            let noOfChoices = [2,0,0];

            let tx = await I_AdvancedPLCRVotingCheckpoint.createCumulativeBallot(
                name,
                startTime,
                commitDuration,
                revealDuration,
                proposalTitle,
                details,
                choices,
                noOfChoices,
                {
                    from: token_owner
                }
            );
            assert.equal(await I_SecurityToken.currentCheckpointId.call(), 6);
            assert.equal(web3.utils.toUtf8(tx.logs[0].args._name), "Ballot 6");
            assert.equal(tx.logs[0].args._checkpointId, 6);
            assert.equal(tx.logs[0].args._ballotId, 5);
            assert.equal(tx.logs[0].args._startTime, startTime.toString());
            assert.equal(tx.logs[0].args._commitDuration, commitDuration.toString());
            assert.equal(tx.logs[0].args._revealDuration, revealDuration.toString());
            assert.equal(web3.utils.toUtf8(tx.logs[0].args._details[0]), "Offchain detaiils 8");

            let ballotDetails = await I_AdvancedPLCRVotingCheckpoint.getBallotDetails.call(tx.logs[0].args._ballotId);
            assert.equal(convertToNumber(ballotDetails[1]), convertToNumber(await I_SecurityToken.totalSupply.call()));
            assert.equal(ballotDetails[2], 6);
            assert.equal(ballotDetails[3].toString(), startTime.toString());
            assert.equal(ballotDetails[6].toString(), 3);
            assert.equal(ballotDetails[12][0], noOfChoices[0]);
            assert.equal(ballotDetails[12][1], noOfChoices[1]);
            assert.equal(ballotDetails[12][2], noOfChoices[2]);
            assert.equal(ballotDetails[10], 0);
            assert.isFalse(ballotDetails[9]);
        });

        it("Should successfully commit the vote",async() => {
            await increaseTime(Math.floor(duration.days(0.5)));
            secrets[3] = Math.floor(Math.random() * 100000000); // 8 digits
            let ballotId = new BN(4);
            let checkpointId = new BN(5);
            let voteTokenCount = await I_AdvancedPLCRVotingCheckpoint.getVoteTokenCount.call(account_investor3, ballotId);
            console.log(`Available token count - ${convertToNumber(voteTokenCount)}`);
            let tx = await I_AdvancedPLCRVotingCheckpoint.commitVote(
                ballotId, 
                web3.utils.soliditySha3(new BN(0),bn(1000),bn(5500),new BN(0),bn(6500),new BN(0),bn(2500),bn(4000),new BN(0),bn(6510),new BN(secrets[3])), 
                {
                    from : account_investor3
                }
            );
            // Checking the pending ballot list for the investor1
            let pendingListAfter = (await I_AdvancedPLCRVotingCheckpoint.pendingBallots.call(account_investor3))[0];
            assert.equal(pendingListAfter.length, 1);
            assert.equal(pendingListAfter[0], 5);
            assert.equal(
                convertToNumber(tx.logs[0].args._weight),
                convertToNumber(voteTokenCount)
            );
            assert.equal(tx.logs[0].args._voter, account_investor3);
            assert.equal((tx.logs[0].args._ballotId).toString(), ballotId.toString());
            let commitVoteCount = await I_AdvancedPLCRVotingCheckpoint.getCommitedVoteCount.call(ballotId);
            assert.equal(commitVoteCount, 1);
            let pendingInvestorToVote = await I_AdvancedPLCRVotingCheckpoint.getPendingInvestorToVote.call(ballotId);
            assert.notInclude(pendingInvestorToVote, account_investor3);
        });

        it("Should successfully commit the vote",async() => {
            secrets[4] = Math.floor(Math.random() * 100000000); // 8 digits
            let ballotId = new BN(4);
            let checkpointId = new BN(5);
            let voteTokenCount = await I_AdvancedPLCRVotingCheckpoint.getVoteTokenCount.call(account_investor4, ballotId);
            console.log(convertToNumber(voteTokenCount));
            let tx = await I_AdvancedPLCRVotingCheckpoint.commitVote(
                ballotId, 
                web3.utils.soliditySha3(bn(5000),new BN(0),bn(7390),bn(8670),new BN(0),new BN(0),bn(4000),new BN(0),new BN(0),bn(4940),new BN(secrets[4])), 
                {
                    from : account_investor4
                }
            );
            // Checking the pending ballot list for the investor1
            let pendingListAfter = (await I_AdvancedPLCRVotingCheckpoint.pendingBallots.call(account_investor4))[0];
            assert.equal(pendingListAfter.length, 1);
            assert.notInclude(pendingListAfter, 4);
            assert.equal(
                convertToNumber(tx.logs[0].args._weight),
                convertToNumber(voteTokenCount)
            );
            assert.equal(tx.logs[0].args._voter, account_investor4);
            assert.equal((tx.logs[0].args._ballotId).toString(), ballotId.toString());
            let commitVoteCount = await I_AdvancedPLCRVotingCheckpoint.getCommitedVoteCount.call(ballotId);
            assert.equal(commitVoteCount, 2);
            let pendingInvestorToVote = await I_AdvancedPLCRVotingCheckpoint.getPendingInvestorToVote.call(ballotId);
            console.log(pendingInvestorToVote);
            assert.notInclude(pendingInvestorToVote, [account_investor3, account_investor4]);
        });

        it("Should commit vote by investor 5", async() => {
            secrets[5] = Math.floor(Math.random() * 100000000); // 8 digits
            let ballotId = new BN(4);
            let checkpointId = new BN(5);
            let voteTokenCount = await I_AdvancedPLCRVotingCheckpoint.getVoteTokenCount.call(account_investor5, ballotId);
            console.log(convertToNumber(voteTokenCount));
            let tx = await I_AdvancedPLCRVotingCheckpoint.commitVote(
                ballotId, 
                web3.utils.soliditySha3(bn(5330),new BN(0),new BN(0),new BN(0),bn(6000),new BN(0),bn(4000),new BN(0),bn(660),new BN(0),new BN(secrets[5])), 
                {
                    from : account_investor5
                }
            );
            // Checking the pending ballot list for the investor1
            let pendingListAfter = (await I_AdvancedPLCRVotingCheckpoint.pendingBallots.call(account_investor5))[0];
            assert.equal(pendingListAfter.length, 1);
            assert.notInclude(pendingListAfter, 4);
            assert.equal(
                convertToNumber(tx.logs[0].args._weight),
                convertToNumber(voteTokenCount)
            );
            assert.equal(tx.logs[0].args._voter, account_investor5);
            assert.equal((tx.logs[0].args._ballotId).toString(), ballotId.toString());
            let commitVoteCount = await I_AdvancedPLCRVotingCheckpoint.getCommitedVoteCount.call(ballotId);
            assert.equal(commitVoteCount, 3);
            let pendingInvestorToVote = await I_AdvancedPLCRVotingCheckpoint.getPendingInvestorToVote.call(ballotId);
            assert.equal(pendingInvestorToVote.length, 0);
        });

        it("Should fail when exempted wallet will try to commit vote", async() => {
            secrets[6] = Math.floor(Math.random() * 100000000); // 8 digits
            let ballotId = new BN(4);
            await catchRevert(
                I_AdvancedPLCRVotingCheckpoint.commitVote(
                ballotId,
                web3.utils.soliditySha3(bn(5330),new BN(0),new BN(0),new BN(0),bn(6000),new BN(0),bn(4000),new BN(0),bn(660),new BN(0),new BN(secrets[5])), 
                {
                    from : account_investor1
                }),
                "Invalid voter"
            );
        });

        it("Should reveal vote in the reveal phase", async() => {
            await increaseTime(duration.hours(8));
            let ballotId = new BN(4);
            // Reveal vote for investor 3

            assert.equal(await I_AdvancedPLCRVotingCheckpoint.getCurrentBallotStage.call(ballotId), 2);
            let pendingInvestorToVote = await I_AdvancedPLCRVotingCheckpoint.getPendingInvestorToVote.call(ballotId);
            assert.equal(pendingInvestorToVote.length, 3);
            assert.include(pendingInvestorToVote, account_investor3);
            let tx = await I_AdvancedPLCRVotingCheckpoint.revealVote(
                    ballotId,
                    [new BN(0),bn(1000),bn(5500),new BN(0),bn(6500),new BN(0),bn(2500),bn(4000),new BN(0),bn(6510)],
                    secrets[3],
                    {
                        from: account_investor3
                    }
            );
            let ballotDetails = await I_AdvancedPLCRVotingCheckpoint.getBallotDetails.call(ballotId);
            assert.equal(ballotDetails[7], 1);
            assert.equal(tx.logs[0].args._voter, account_investor3);
            assert.equal(
                convertToNumber(tx.logs[0].args._weight),
                ballotDetails[6] * convertToNumber(await stGetter.balanceOfAt.call(account_investor3, ballotDetails[2]))
            );
            assert.equal((tx.logs[0].args._ballotId).toString(), ballotId.toString());
            assert.equal((tx.logs[0].args._salt).toString(), secrets[3]);
            pendingInvestorToVote = await I_AdvancedPLCRVotingCheckpoint.getPendingInvestorToVote.call(ballotId);
            assert.equal(pendingInvestorToVote.length, 2);
            assert.notInclude(pendingInvestorToVote, account_investor3);

            let commitVoteCount = await I_AdvancedPLCRVotingCheckpoint.getCommitedVoteCount.call(ballotId);
            assert.equal(commitVoteCount, 3);
            
            // Reveal vote for investor 4
            pendingInvestorToVote = await I_AdvancedPLCRVotingCheckpoint.getPendingInvestorToVote.call(ballotId);
            assert.equal(pendingInvestorToVote.length, 2);
            assert.include(pendingInvestorToVote, account_investor4);
            tx = await I_AdvancedPLCRVotingCheckpoint.revealVote(
                    ballotId,
                    [bn(5000),new BN(0),bn(7390),bn(8670),new BN(0),new BN(0),bn(4000),new BN(0),new BN(0),bn(4940)],
                    secrets[4],
                    {
                        from: account_investor4
                    }
            );
            ballotDetails = await I_AdvancedPLCRVotingCheckpoint.getBallotDetails.call(ballotId);
            assert.equal(ballotDetails[7], 2);
            assert.equal(tx.logs[0].args._voter, account_investor4);
            assert.equal(
                convertToNumber(tx.logs[0].args._weight),
                ballotDetails[6] * convertToNumber(await stGetter.balanceOfAt.call(account_investor4, ballotDetails[2]))
            );
            assert.equal((tx.logs[0].args._ballotId).toString(), ballotId.toString());
            assert.equal((tx.logs[0].args._salt).toString(), secrets[4]);
            pendingInvestorToVote = await I_AdvancedPLCRVotingCheckpoint.getPendingInvestorToVote.call(ballotId);
            assert.equal(pendingInvestorToVote.length, 1);
            assert.notInclude(pendingInvestorToVote, account_investor4);

            commitVoteCount = await I_AdvancedPLCRVotingCheckpoint.getCommitedVoteCount.call(ballotId);
            assert.equal(commitVoteCount, 3);

            // Reveal vote for investor 5
            pendingInvestorToVote = await I_AdvancedPLCRVotingCheckpoint.getPendingInvestorToVote.call(ballotId);
            assert.equal(pendingInvestorToVote.length, 1);
            assert.include(pendingInvestorToVote, account_investor5);
            tx = await I_AdvancedPLCRVotingCheckpoint.revealVote(
                    ballotId,
                    [bn(5330),new BN(0),new BN(0),new BN(0),bn(6000),new BN(0),bn(4000),new BN(0),bn(660),new BN(0)],
                    secrets[5],
                    {
                        from: account_investor5
                    }
            );
            ballotDetails = await I_AdvancedPLCRVotingCheckpoint.getBallotDetails.call(ballotId);
            assert.equal(ballotDetails[7], 3);
            assert.equal(tx.logs[0].args._voter, account_investor5);
            assert.equal(
                convertToNumber(tx.logs[0].args._weight),
                ballotDetails[6] * convertToNumber(await stGetter.balanceOfAt.call(account_investor5, ballotDetails[2]))
            );
            assert.equal((tx.logs[0].args._ballotId).toString(), ballotId.toString());
            assert.equal((tx.logs[0].args._salt).toString(), secrets[5]);
            pendingInvestorToVote = await I_AdvancedPLCRVotingCheckpoint.getPendingInvestorToVote.call(ballotId);
            assert.equal(pendingInvestorToVote.length, 0);

            commitVoteCount = await I_AdvancedPLCRVotingCheckpoint.getCommitedVoteCount.call(ballotId);
            assert.equal(commitVoteCount, 3);
        });

        it("Should fail to blacklist in the reveal phase", async() => {
            let ballotId = new BN(4);
            await catchRevert(
                I_AdvancedPLCRVotingCheckpoint.changeBallotExemptedVotersList(ballotId, account_investor4, true, {from: token_owner})
            );
        });

        it("Should check the result after ending the reveal phase", async() => {
            let ballotId = new BN(4);
            await increaseTime(duration.hours(8));
            assert.equal(await I_AdvancedPLCRVotingCheckpoint.getCurrentBallotStage.call(ballotId), 3);
            let result = await I_AdvancedPLCRVotingCheckpoint.getBallotResults.call(ballotId);
            let choiceCount = 0;
            for (let i = 0; i < result.noOfChoicesInProposal.length; i++) {
                for (let j = 0; j < result.noOfChoicesInProposal[i]; j++) {
                    console.log(`Weight of Choice ${j} of proposal ${i} - ${convertToNumber(result.choicesWeighting[choiceCount])}`)
                    choiceCount++;
                }
            };
            assert.equal(result.voters[0], account_investor3);
            assert.equal(result.voters[1], account_investor4);
            assert.equal(result.voters[2], account_investor5);
            assert.equal(result.noOfChoicesInProposal[0], 3);
            assert.equal(result.noOfChoicesInProposal[1], 3);
            assert.equal(result.noOfChoicesInProposal[2], 4);
            console.log(`
                Wining choice in proposal 1 - Choice C (${result.choicesWeighting[2]})
                Wining choice in proposal 2 - YAY (${result.choicesWeighting[4]})
                Wining choice in proposal 3 - Choice L (${result.choicesWeighting[9]})
            `);
        });
    });

});
