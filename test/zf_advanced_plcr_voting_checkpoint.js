import latestTime from "./helpers/latestTime";
import { duration, ensureException, promisifyLogWatch, latestBlock } from "./helpers/utils";
import { takeSnapshot, increaseTime, revertToSnapshot } from "./helpers/time";
import { encodeModuleCall } from "./helpers/encodeCall";
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
    let account_treasury;

    // investor Details
    let fromTime = latestTime();
    let toTime = latestTime();
    let expiryTime = toTime + duration.days(15);

    let message = "Transaction Should Fail!";

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
    const decimals = 18;

    // Module key
    const CHECKPOINT_KEY = 4;
    const transferManagerKey = 2

    // Initial fee for ticker registry and security token registry
    const initRegFee = web3.utils.toWei("1000");
    const address_zero = "0x0000000000000000000000000000000000000000";
    
    async function currentTime() {
        return new BN(await latestTime());
    }

    function convertToNumber(value) {
        return web3.utils.fromWei(value.toString());
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

        it("Should create the statutory ballot successfully", async() => {
            let startTime = await currentTime();
            let commitDuration = new BN(duration.seconds(5000));
            let revealDuration = new BN(duration.seconds(4000));
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

        it("Should successfully commit the vote in commit duration", async() => {
            
        });
    });

});
