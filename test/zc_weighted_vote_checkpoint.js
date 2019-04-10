import latestTime from "./helpers/latestTime";
import {duration, promisifyLogWatch} from "./helpers/utils";
import { takeSnapshot,increaseTime, revertToSnapshot} from "./helpers/time";
import {catchRevert} from "./helpers/exceptions";
import {deployWeightedVoteCheckpoint, setUpPolymathNetwork} from "./helpers/createInstances";

const SecurityToken = artifacts.require("./SecurityToken.sol");
const GeneralTransferManager = artifacts.require("./GeneralTransferManager");
const WeightedVoteCheckpoint = artifacts.require("./WeightedVoteCheckpoint");
const STGetter = artifacts.require("./STGetter.sol");

const Web3 = require("web3");
let BN = Web3.utils.BN;
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port

contract("WeightedVoteCheckpoint", async (accounts) => {
    // Accounts Variable declaration
    let account_polymath;
    let account_issuer;
    let token_owner;
    let account_investor1;
    let account_investor2;
    let account_investor3;
    let account_investor4;
    let account_temp;

    // Contract Instance Declaration
    let I_GeneralPermissionManagerFactory;
    let I_SecurityTokenRegistryProxy;
    let I_GeneralTransferManagerFactory;
    let I_WeightedVoteCheckpointFactory;
    let P_WeightedVoteCheckpointFactory;
    let I_WeightedVoteCheckpoint;
    let I_GeneralTransferManager;
    let I_ModuleRegistryProxy;
    let I_ModuleRegistry;
    let I_FeatureRegistry;
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
        account_temp = accounts[2];

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
        [I_WeightedVoteCheckpointFactory] = await deployWeightedVoteCheckpoint(account_polymath, I_MRProxied, 0);
        [P_WeightedVoteCheckpointFactory] = await deployWeightedVoteCheckpoint(account_polymath, I_MRProxied, new BN(web3.utils.toWei("500")));

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

        WeightedVoteCheckpointFactory:     ${I_WeightedVoteCheckpointFactory.address}
        -----------------------------------------------------------------------------
        `);
    });

    describe("\t\t Test case for Weighted Vote Checkpoint module \n", async() => {

        describe("\t\t Attaching the Weighted vote checkpoint module \n", async() => {

            it("\t\t Should register the ticker before the generation of the security token \n", async () => {
                await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner });
                let tx = await I_STRProxied.registerTicker(token_owner, symbol, name, { from: token_owner });
                assert.equal(tx.logs[0].args._owner, token_owner);
                assert.equal(tx.logs[0].args._ticker, symbol);
            });
    
            it("\t\t Should generate the new security token with the same symbol as registered above \n", async () => {
                await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner });
    
                let tx = await I_STRProxied.generateSecurityToken(name, symbol, tokenDetails, false, token_owner, 0, { from: token_owner });
    
                // Verify the successful generation of the security token
                assert.equal(tx.logs[1].args._ticker, symbol, "SecurityToken doesn't get deployed");
    
                I_SecurityToken = await SecurityToken.at(tx.logs[1].args._securityTokenAddress);
                stGetter = await STGetter.at(I_SecurityToken.address);
                const log = (await I_SecurityToken.getPastEvents('ModuleAdded', {filter: {transactionHash: tx.transactionHash}}))[0];
                // Verify that GeneralTransferManager module get added successfully or not
                assert.equal(log.args._types[0].toNumber(), transferManagerKey);
                assert.equal(web3.utils.hexToString(log.args._name), "GeneralTransferManager");
            });
    
            it("\t\t Should intialize the auto attached modules \n", async () => {
                let moduleData = (await stGetter.getModulesByType(transferManagerKey))[0];
                I_GeneralTransferManager = await GeneralTransferManager.at(moduleData);
            });

            it("\t\t Should attach the voting module with the ST \n", async() => {
                let tx = await I_SecurityToken.addModule(I_WeightedVoteCheckpointFactory.address, "0x0", 0, 0, false, {from: token_owner});
                assert.equal(tx.logs[2].args._types[0], checkpointKey, "Checkpoint doesn't get deployed");
                assert.equal(web3.utils.hexToString(tx.logs[2].args._name), "WeightedVoteCheckpoint", "WeightedVoteCheckpoint module was not added");
                I_WeightedVoteCheckpoint = await WeightedVoteCheckpoint.at(tx.logs[2].args._module);
            });

            it("\t\t Should fail to attach the voting module because allowance is unsufficent \n", async() => {
                await catchRevert(
                    I_SecurityToken.addModule(P_WeightedVoteCheckpointFactory.address, "0x0", new BN(web3.utils.toWei("500")), 0, false, {from: token_owner})
                );
            });

            it("\t\t Should attach the voting module with the ST \n", async() => {
                let id = await takeSnapshot();
                await I_PolyToken.transfer(I_SecurityToken.address, new BN(web3.utils.toWei("2000", "ether")), { from: token_owner });
                let tx = await I_SecurityToken.addModule(P_WeightedVoteCheckpointFactory.address, "0x0", new BN(web3.utils.toWei("2000")), 0, false, {from: token_owner});
                assert.equal(tx.logs[3].args._types[0], checkpointKey, "Checkpoint doesn't get deployed");
                assert.equal(web3.utils.hexToString(tx.logs[3].args._name), "WeightedVoteCheckpoint", "WeightedVoteCheckpoint module was not added");
                await revertToSnapshot(id);
            });
        });

        describe("\t\t Test for createBallot \n", async() => {

            it("\t\t Should fail to create ballot -- bad owner \n", async() => {
                await catchRevert(
                    I_WeightedVoteCheckpoint.createBallot(new BN(duration.days(5)), new BN(5), {from: account_polymath})
                ); 
            });

            it("\t\t Should fail to create ballot -- bad duration \n", async() => {
                await catchRevert(
                    I_WeightedVoteCheckpoint.createBallot(new BN(0), new BN(5), {from: token_owner})
                ); 
            });

            it("\t\t Should fail to create ballot -- bad no of proposals \n", async() => {
                await catchRevert(
                    I_WeightedVoteCheckpoint.createBallot(new BN(duration.days(5)), new BN(1), {from: token_owner})
                ); 
            });

            it("\t\t Mint some tokens and transfer to whitelisted investors \n", async() => {
                // Whitelist multiple investors
                let time = new BN(await latestTime());
                await I_GeneralTransferManager.modifyKYCDataMulti(
                    [account_investor1, account_investor2, account_investor3, account_investor4],
                    [time, time, time, time],
                    [time, time, time, time],
                    [time + duration.days(200), time + duration.days(200), time + duration.days(200), time + duration.days(200)],
                    {
                        from: token_owner
                    }
                );

                // mint tokens to whitelisted investors

                await I_SecurityToken.issueMulti(
                    [account_investor1, account_investor2, account_investor3],
                    [new BN(web3.utils.toWei("500")), new BN(web3.utils.toWei("1000")), new BN(web3.utils.toWei("5000"))],
                    {
                        from: token_owner
                    }
                );

                assert.equal(web3.utils.fromWei((await I_SecurityToken.balanceOf.call(account_investor1)).toString()), 500);
                assert.equal(web3.utils.fromWei((await I_SecurityToken.balanceOf.call(account_investor2)).toString()), 1000);
                assert.equal(web3.utils.fromWei((await I_SecurityToken.balanceOf.call(account_investor3)).toString()), 5000);
            });

            it("\t\t Should fail to create ballot -- Invalid checkpoint Id \n", async() => {
                let startTime = new BN(await latestTime());
                let endTime = new BN(await latestTime() + duration.days(4));
                await catchRevert(
                    I_WeightedVoteCheckpoint.createCustomBallot(startTime, endTime, new BN(100), new BN(5), {from: token_owner})
                );
            });

            it("\t\t Should create the ballot successfully \n", async() => {
                let tx = await I_WeightedVoteCheckpoint.createBallot(new BN(duration.days(5)), new BN(3), {from: token_owner});
                assert.equal((tx.logs[0].args._noOfProposals).toString(), 3);
                assert.equal((tx.logs[0].args._checkpointId).toString(), 1);
                assert.equal((tx.logs[0].args._ballotId).toString(), 0);
            });
        });

        describe("\t\t Test case for castVote \n", async() => {
            
            it("\t\t Should fail to caste vote -- bad ballot id \n", async() => {
                await catchRevert(
                    I_WeightedVoteCheckpoint.castVote(new BN(2), new BN(1), {from: account_investor1})
                );
            });

            it("\t\t Should fail to caste vote -- bad proposal id \n", async() => {
                await catchRevert(
                    I_WeightedVoteCheckpoint.castVote(new BN(0), new BN(4), {from: account_investor1})
                );
            });

            it("\t\t Should fail to caste vote -- weight is 0 \n", async() => {
                await catchRevert(
                    I_WeightedVoteCheckpoint.castVote(new BN(0), new BN(1), {from: account_investor4})
                );
            });

            it("\t\t Should successfully vote by account investor1 \n", async() => {
                let tx = await I_WeightedVoteCheckpoint.castVote(new BN(0), new BN(1), {from: account_investor1});
                assert.equal(tx.logs[0].args._ballotId, 0);
                assert.equal(tx.logs[0].args._proposalId, 1);
                assert.equal(tx.logs[0].args._investor, account_investor1);  
                
                let data = await I_WeightedVoteCheckpoint.getBallotStats.call(new BN(0));
                assert.equal(data[4], 1);
                assert.equal(data[5], 3);
                assert.equal(data[6], true);
            });

            it("\t\t Should successfully vote by account investor2 \n", async() => {
                let tx = await I_WeightedVoteCheckpoint.castVote(new BN(0), new BN(2), {from: account_investor2});
                assert.equal(tx.logs[0].args._ballotId, 0);
                assert.equal(tx.logs[0].args._proposalId, 2);
                assert.equal(tx.logs[0].args._investor, account_investor2);  
                
                let data = await I_WeightedVoteCheckpoint.getBallotStats.call(new BN(0));
                assert.equal(data[4], 2);
                assert.equal(data[5], 3);
                assert.equal(data[6], true);
            });

            it("\t\t Should fail to vote again \n", async() => {
                await catchRevert(
                    I_WeightedVoteCheckpoint.castVote(new BN(0), new BN(2), {from: account_investor2})
                );
            })

            it("\t\t Should fail to change the ballot status-- bad owner \n", async() => {
                await catchRevert(
                    I_WeightedVoteCheckpoint.changeBallotStatus(new BN(0), false, {from: account_polymath})
                );
            });

            it("\t\t Should fail to change the ballot status-- no change in the state \n", async() => {
                await catchRevert(
                    I_WeightedVoteCheckpoint.changeBallotStatus(new BN(0), true, {from: account_polymath})
                );
            });

            it("\t\t Should change the status of the ballot with the help of changeBallotStatus \n", async() => {
                let tx = await I_WeightedVoteCheckpoint.changeBallotStatus(new BN(0), false, {from: token_owner});
                assert.equal(tx.logs[0].args._ballotId, 0);
                assert.equal(tx.logs[0].args._isActive, false);
            });

            it("\t\t Should fail to vote because ballot is disabled \n", async() => {
                await catchRevert(
                    I_WeightedVoteCheckpoint.castVote(new BN(0), new BN(2), {from: account_investor3})
                );
            });

            it("\t\t Should turn on the ballot \n", async() => {
                let tx = await I_WeightedVoteCheckpoint.changeBallotStatus(new BN(0), true, {from: token_owner});
                assert.equal(tx.logs[0].args._ballotId, 0);
                assert.equal(tx.logs[0].args._isActive, true);
            });

            it("\t\t Should successfully vote \n", async() => {
                let tx = await I_WeightedVoteCheckpoint.castVote(new BN(0), new BN(1), {from: account_investor3});
                assert.equal(tx.logs[0].args._ballotId, 0);
                assert.equal(tx.logs[0].args._proposalId, 1);
                assert.equal(tx.logs[0].args._investor, account_investor3);  
                
                let data = await I_WeightedVoteCheckpoint.getBallotStats.call(new BN(0));
                assert.equal(data[4], 3);
                assert.equal(data[5], 3);
                assert.equal(data[6], true);
            });

            it("\t\t Should fail to vote when the duration of vote is complete \n", async() => {
                await increaseTime(duration.days(6));

                // transfer some funds to account_investor4
                await I_SecurityToken.issue(
                    account_investor4,
                    new BN(web3.utils.toWei("500")),
                    "0x0",
                    {
                        from: token_owner
                    }
                );
                await catchRevert(
                    I_WeightedVoteCheckpoint.castVote(new BN(0), new BN(2), {from: account_investor4})
                );
            });

            it("\t\t Should fail to change the status of the ballot -- already ended \n", async() => {
                await catchRevert(
                    I_WeightedVoteCheckpoint.changeBallotStatus(new BN(0), false, {from: token_owner})
                );
            });

            it("\t\t Should check who votes whom \n", async() => {
                assert.equal((await I_WeightedVoteCheckpoint.getSelectedProposal.call(new BN(0), account_investor1)).toString(), 1);
                assert.equal((await I_WeightedVoteCheckpoint.getSelectedProposal.call(new BN(0), account_investor2)).toString(), 2);
                assert.equal((await I_WeightedVoteCheckpoint.getSelectedProposal.call(new BN(0), account_investor3)).toString(), 1);
            });

            it("\t\t Should get the result of the ballot \n", async() => {
                let data = await I_WeightedVoteCheckpoint.getBallotResults.call(new BN(0));
                assert.equal(data[4], 3);
                assert.equal(web3.utils.fromWei((data[0][0]).toString()), 5500);
                assert.equal(web3.utils.fromWei((data[0][1]).toString()), 1000);
                assert.equal(data[2], 1);
                assert.equal(data[3], 0);
            });
        });

        describe("\t\t General function test \n", async() => {

            it("\t\t Should check the permission \n", async() => {
                let data = await I_WeightedVoteCheckpoint.getPermissions.call();
                assert.equal(data.length, 1);
            });

            it("\t\t Should check the init function \n", async() => {
                assert.equal(await I_WeightedVoteCheckpoint.getInitFunction.call(), "0x00000000");
            });
        });

        describe("\t\t Factory test cases \n", async() => {
            it("\t\t Should get the exact details of the factory \n", async () => {
                assert.equal((await I_WeightedVoteCheckpointFactory.setupCost.call()).toNumber(), 0);
                assert.equal((await I_WeightedVoteCheckpointFactory.types.call())[0], 4);
                assert.equal(await I_WeightedVoteCheckpointFactory.version.call(), "3.0.0");
                assert.equal(
                    web3.utils.toAscii(await I_WeightedVoteCheckpointFactory.name.call()).replace(/\u0000/g, ""),
                    "WeightedVoteCheckpoint",
                    "Wrong Module added"
                );
                assert.equal(
                    await I_WeightedVoteCheckpointFactory.description.call(),
                    "Weighted votes based on token amount",
                    "Wrong Module added"
                );
                assert.equal(await I_WeightedVoteCheckpointFactory.title.call(), "Weighted Vote Checkpoint", "Wrong Module added");
                let tags = await I_WeightedVoteCheckpointFactory.tags.call();
                assert.equal(tags.length, 3);
            });
        });
    });
});