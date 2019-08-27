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

        it("Should successfully attach the paid version of AdvancedPLCRVotingCheckpoint factory with the security token", async () => {
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
                web3.utils.toAscii(tx.logs[3].args._name).replace(/\u0000/g, ""),
                "AdvancedPLCRVotingCheckpoint",
                "AdvancedPLCRVotingCheckpoint module was not added"
            );
            await revertToSnapshot(snapId);
        });

        it("Should successfully attach the AdvancedPLCRVotingCheckpoint with the security token", async () => {
            const tx = await I_SecurityToken.addModule(I_AdvancedPLCRVotingCheckpointFactory.address, "0x0", new BN(0), new BN(0), false, { from: token_owner });
            assert.equal(tx.logs[2].args._types[0].toNumber(), CHECKPOINT_KEY, "AdvancedPLCRVotingCheckpointFactory doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name).replace(/\u0000/g, ""),
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

        it("Should fail to create the statutory wallet -- Empty title", async() => {
            let startTime = await currentTime();
            let commitDuration = new BN(duration.seconds(5000));
            let revealDuration = new BN(duration.seconds(4000));
            let proposalTitle = "";
            let details = web3.utils.toHex("Offchain detaiils");
            let choices = "";
            let noOfChoices = 0;
            await catchRevert(I_AdvancedPLCRVotingCheckpoint.createStatutoryBallot(
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
            let startTime = await currentTime();
            let commitDuration = new BN(0);
            let revealDuration = new BN(duration.seconds(4000));
            let proposalTitle = "Title 1";
            let details = web3.utils.toHex("Offchain detaiils");
            let choices = "";
            let noOfChoices = 0;
            await catchRevert(I_AdvancedPLCRVotingCheckpoint.createStatutoryBallot(
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
            let startTime = (await currentTime()).add(new BN(duration.days(1)));
            let commitDuration = new BN(duration.hours(5));
            let revealDuration = new BN(duration.hours(4));
            let proposalTitle = "Titile 1";
            let details = web3.utils.toHex("Offchain detaiils");
            let choices = "";
            let noOfChoices = 0;
            await catchRevert(
             I_AdvancedPLCRVotingCheckpoint.createStatutoryBallot(
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
            let startTime = (await currentTime()).add(new BN(duration.days(1)));
            let commitDuration = new BN(duration.hours(5));
            let revealDuration = new BN(duration.hours(4));
            let proposalTitle = "Titile 1";
            let details = web3.utils.toHex("Offchain detaiils");
            let choices = "";
            let noOfChoices = 0;
            let tx = await I_AdvancedPLCRVotingCheckpoint.createStatutoryBallot(
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
            assert.equal(tx.logs[0].args._checkpointId, 1);
            assert.equal(tx.logs[0].args._ballotId, 0);
            assert.equal(tx.logs[0].args._startTime, startTime.toString());
            assert.equal(tx.logs[0].args._commitDuration, commitDuration.toString());
            assert.equal(tx.logs[0].args._revealDuration, revealDuration.toString());
            assert.equal(web3.utils.toAscii(tx.logs[0].args._details).replace(/\u0000/g, ""), "Offchain detaiils");

            let ballotDetails = await I_AdvancedPLCRVotingCheckpoint.getBallotDetails.call(tx.logs[0].args._ballotId);
            assert.equal(convertToNumber(ballotDetails[0]), convertToNumber(await I_SecurityToken.totalSupply.call()));
            assert.equal(ballotDetails[1], 1);
            assert.equal(ballotDetails[2].toString(), startTime.toString());
            assert.equal(ballotDetails[5].toString(), 1);
            assert.equal(ballotDetails[8][0], 0);
            assert.isTrue(ballotDetails[9]);
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
                "Not in a valid stage"
            );
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
            let snap_id = await takeSnapshot();
            let ballotId = new BN(0);
            await I_AdvancedPLCRVotingCheckpoint.changeBallotExemptedVotersList(new BN(0), account_investor1, true, {from: token_owner}); 
            await catchRevert(
                I_AdvancedPLCRVotingCheckpoint.commitVote(
                ballotId, 
                web3.utils.soliditySha3(bn("3500"), new BN(0), bn("1500"), new BN(secrets[0])), 
                {
                    from : account_investor1
                }),
                "Invalid voter"
            );
            await revertToSnapshot(snap_id);
        });

        it("Should successfully commit the vote in commit duration", async() => {
            secrets[0] = Math.floor(Math.random() * 100000000); // 8 digits
            let ballotId = new BN(0);
            // Recieve some balance from another token holder to validate the functionality of the checkpoint
            await I_SecurityToken.transfer(account_investor1, new BN(web3.utils.toWei("1000")), {from: account_investor4});
            // Checking the pending ballot list for the investor1
            let pendingListBefore = await I_AdvancedPLCRVotingCheckpoint.pendingBallots.call(account_investor1);
            assert.equal(pendingListBefore.length, 1);
            assert.equal(pendingListBefore[0], 0);
            let tx = await I_AdvancedPLCRVotingCheckpoint.commitVote(
                ballotId, 
                web3.utils.soliditySha3(bn(3500),new BN(0),bn(1500), new BN(secrets[0])), 
                {
                    from : account_investor1
                }
            );
            // Checking the pending ballot list for the investor1
            let pendingListAfter = await I_AdvancedPLCRVotingCheckpoint.pendingBallots.call(account_investor1);
            let ballotDetails = await I_AdvancedPLCRVotingCheckpoint.getBallotDetails.call(ballotId);
            assert.equal(pendingListAfter.length, 0);
            assert.equal(
                convertToNumber(tx.logs[0].args._weight),
                convertToNumber(await stGetter.balanceOfAt.call(account_investor1, ballotDetails[1]))
            );
            assert.equal(tx.logs[0].args._voter, account_investor1);
            assert.equal(tx.logs[0].args._ballotId, 0);
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

        it("Should fail to commit vote -- Zero weight is not allowed", async() => {
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
                "Zero weight is not allowed"       
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
            let ballotDetails = await I_AdvancedPLCRVotingCheckpoint.getBallotDetails.call(ballotId);
            assert.equal(pendingListAfter.length, 0);
            assert.equal(
                convertToNumber(tx.logs[0].args._weight),
                convertToNumber(await stGetter.balanceOfAt.call(account_investor2, ballotDetails[1]))
            );
            assert.equal(tx.logs[0].args._voter, account_investor2);
            assert.equal(tx.logs[0].args._ballotId, 0);
            secrets[2] = Math.floor(Math.random() * 100000000); // 8 digits
            tx = await I_AdvancedPLCRVotingCheckpoint.commitVote(
                ballotId, 
                web3.utils.soliditySha3(bn(2000),new BN(0),new BN(0), new BN(secrets[2])), 
                {
                    from : account_investor3
                }
            );
        });

        it("Should fail to reveal the vote in the reveal phase -- Not in a valid stage", async() => {
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

        it("Should fail to reveal the vote -- Invalid choices", async() => {
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
                "Invalid choices"
            );
        });

        it("Should fail to reveal the vote -- Inactive ballot", async() => {
            let ballotId = new BN(0);
            let snap_id = await takeSnapshot();
            await I_AdvancedPLCRVotingCheckpoint.changeBallotStatus(ballotId, false, {from: token_owner});
            await catchRevert(
                I_AdvancedPLCRVotingCheckpoint.revealVote(
                    ballotId,
                    [bn(3500),new BN(0)],
                    secrets[0],
                    {
                        from: account_investor1
                    }
                ),
                "Inactive ballot"
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
            assert.equal(ballotDetails[6], 1);
            assert.equal(tx.logs[0].args._voter, account_investor1);
            assert.equal(
                convertToNumber(tx.logs[0].args._weight),
                convertToNumber(await stGetter.balanceOfAt.call(account_investor1, ballotDetails[1]))
            );
            assert.equal((tx.logs[0].args._ballotId).toString(), ballotId.toString());
            assert.equal((tx.logs[0].args._salt).toString(), secrets[0]);
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
            assert.equal(ballotDetails[6], 2);
            assert.equal(tx.logs[0].args._voter, account_investor2);
            assert.equal(
                convertToNumber(tx.logs[0].args._weight),
                convertToNumber(await stGetter.balanceOfAt.call(account_investor2, ballotDetails[1]))
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
            assert.equal(ballotDetails[6], 3);
            assert.equal(tx.logs[0].args._voter, account_investor3);
            assert.equal(
                convertToNumber(tx.logs[0].args._weight),
                convertToNumber(await stGetter.balanceOfAt.call(account_investor3, ballotDetails[1]))
            );
            assert.equal((tx.logs[0].args._ballotId).toString(), ballotId.toString());
            assert.equal((tx.logs[0].args._salt).toString(), secrets[2]);
        });

        it("Should fail to change the ballot status -- Index out of bound", async() => {
            let ballotId = new BN(5);
            await catchRevert(
                I_AdvancedPLCRVotingCheckpoint.changeBallotStatus(ballotId, false, {from: token_owner}),
                "Index out of bound"
            );
        });

        it("Should successfully change the ballot status", async() => {
            let ballotId = new BN(0);
            let tx = await I_AdvancedPLCRVotingCheckpoint.changeBallotStatus(ballotId, false, {from: token_owner});
            assert.equal(tx.logs[0].args._ballotId, 0);
            assert.equal(tx.logs[0].args._newStatus, false);
            assert.isFalse((await I_AdvancedPLCRVotingCheckpoint.getBallotDetails.call(ballotId))[9]);
        });

        it("Should fail to change the ballot status again -- Active state unchanged", async() => {
            let ballotId = new BN(0);
            await catchRevert(
                I_AdvancedPLCRVotingCheckpoint.changeBallotStatus(ballotId, false, {from: token_owner}),
                "Active state unchanged"
            );
        });

        it("Should get the zero result of the ballot because ballot is inActive", async() => {
            let ballotId = new BN(0);
            let result = await I_AdvancedPLCRVotingCheckpoint.getBallotResults.call(ballotId);
            assert.equal(result[0].length, 0);
            assert.equal(result[1].length, 0);
            assert.equal(result[2].length, 0);
            assert.equal(result[3], 0);
        });

        it("Should get the the result successfully", async() => {
            let ballotId = new BN(0);
            await I_AdvancedPLCRVotingCheckpoint.changeBallotStatus(ballotId, true, {from: token_owner});
            let result = await I_AdvancedPLCRVotingCheckpoint.getBallotResults.call(ballotId);
            console.log(result);
            console.log('\n');
            console.log(`
                Weight of choice NAY - ${convertToNumber(result.choicesWeighting[0])},
                Weight of choice YAY - ${convertToNumber(result.choicesWeighting[1])},
                Weight of choice ABSTAIN - ${convertToNumber(result.choicesWeighting[2])},
                No of choices in a proposal - ${result.noOfChoicesInProposal},
                Remaining Time - ${(result.remainingTime).toString()}
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
            assert.equal(tx.logs[0].args._checkpointId, 2);
            assert.equal(tx.logs[0].args._ballotId, 1);
            assert.equal(tx.logs[0].args._startTime, startTime.toString());
            assert.equal(tx.logs[0].args._commitDuration, commitDuration.toString());
            assert.equal(tx.logs[0].args._revealDuration, revealDuration.toString());
            assert.equal(web3.utils.toAscii(tx.logs[0].args._details).replace(/\u0000/g, ""), "Offchain detaiils");

            let ballotDetails = await I_AdvancedPLCRVotingCheckpoint.getBallotDetails.call(tx.logs[0].args._ballotId);
            assert.equal(convertToNumber(ballotDetails[0]), convertToNumber(await I_SecurityToken.totalSupply.call()));
            assert.equal(ballotDetails[1], 2);
            assert.equal(ballotDetails[2].toString(), startTime.toString());
            assert.equal(ballotDetails[5].toString(), 1);
            assert.equal(ballotDetails[8][0], noOfChoices);
            assert.isTrue(ballotDetails[9]);
        });
    });

});
