import latestTime from './helpers/latestTime';
import { duration, ensureException } from './helpers/utils';
import takeSnapshot, { increaseTime, revertToSnapshot } from './helpers/time';
import { error } from 'util';

const ModuleRegistry = artifacts.require('./ModuleRegistry.sol');
const SecurityToken = artifacts.require('./SecurityToken.sol');
const SecurityTokenRegistry = artifacts.require('./SecurityTokenRegistry.sol');
const TickerRegistry = artifacts.require('./TickerRegistry.sol');
const STVersion = artifacts.require('./STVersionProxy001.sol');
const GeneralPermissionManagerFactory = artifacts.require('./GeneralPermissionManagerFactory.sol');
const GeneralTransferManagerFactory = artifacts.require('./GeneralTransferManagerFactory.sol');
const GeneralTransferManager = artifacts.require('./GeneralTransferManager');
const WeightedVoteCheckpointFactory = artifacts.require('./WeightedVoteCheckpointFactory.sol');
const WeightedVoteCheckpoint = artifacts.require('./WeightedVoteCheckpoint');
const GeneralPermissionManager = artifacts.require('./GeneralPermissionManager');
const PolyTokenFaucet = artifacts.require('./PolyTokenFaucet.sol');

const Web3 = require('web3');
const BigNumber = require('bignumber.js');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")) // Hardcoded development port

contract('WeightedVoteCheckpoint', accounts => {

    // Accounts Variable declaration
    let account_polymath;
    let account_issuer;
    let token_owner;
    let account_investor1;
    let account_investor2;
    let account_investor3;
    let account_investor4;
    let account_temp;

    // investor Details
    let fromTime = latestTime();
    let toTime = latestTime();
    let expiryTime = toTime + duration.days(15);

    let message = "Transaction Should Fail!";

    // Contract Instance Declaration
    let I_GeneralPermissionManagerFactory;
    let I_GeneralPermissionManager;
    let I_GeneralTransferManagerFactory;
    let I_GeneralTransferManager;
    let I_WeightedVoteCheckpointFactory;
    let I_WeightedVoteCheckpoint;
    let I_ExchangeTransferManager;
    let I_ModuleRegistry;
    let I_TickerRegistry;
    let I_SecurityTokenRegistry;
    let I_STVersion;
    let I_SecurityToken;
    let I_PolyToken;

    // SecurityToken Details
    const swarmHash = "dagwrgwgvwergwrvwrg";
    const name = "Team";
    const symbol = "sap";
    const tokenDetails = "This is equity type of issuance";
    const decimals = 18;
    const contact = "team@polymath.network";
    let snapId;
    // Module key
    const delegateManagerKey = 1;
    const transferManagerKey = 2;
    const stoKey = 3;
    const checkpointKey = 4;

    // Initial fee for ticker registry and security token registry
    const initRegFee = 250 * Math.pow(10, 18);

    before(async() => {

        // Accounts setup
        account_polymath = accounts[0];
        account_issuer = accounts[1];

        token_owner = account_issuer;

        account_investor1 = accounts[6];
        account_investor2 = accounts[7];
        account_investor3 = accounts[8];
        account_investor4 = accounts[9];
        account_temp = accounts[2];

        // ----------- POLYMATH NETWORK Configuration ------------

        // Step 0: Deploy the token Faucet and Mint tokens for token_owner
        I_PolyToken = await PolyTokenFaucet.new();
        await I_PolyToken.getTokens((10000 * Math.pow(10, 18)), token_owner);

        // STEP 1: Deploy the ModuleRegistry

        I_ModuleRegistry = await ModuleRegistry.new({from:account_polymath});

        assert.notEqual(
            I_ModuleRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "ModuleRegistry contract was not deployed"
        );

        // STEP 2: Deploy the GeneralTransferManagerFactory

        I_GeneralTransferManagerFactory = await GeneralTransferManagerFactory.new(I_PolyToken.address, 0, 0, 0, {from:account_polymath});

        assert.notEqual(
            I_GeneralTransferManagerFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "GeneralTransferManagerFactory contract was not deployed"
        );

        // STEP 3: Deploy the GeneralDelegateManagerFactory

        I_GeneralPermissionManagerFactory = await GeneralPermissionManagerFactory.new(I_PolyToken.address, 0, 0, 0, {from:account_polymath});

        assert.notEqual(
            I_GeneralPermissionManagerFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "GeneralDelegateManagerFactory contract was not deployed"
        );
        console.log("1");
        // STEP 4: Deploy the WeightedVoteCheckpointFactory
        I_WeightedVoteCheckpointFactory = await WeightedVoteCheckpointFactory.new(I_PolyToken.address, 0, 0, 0, {from:account_polymath});
        assert.notEqual(
            I_WeightedVoteCheckpointFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "WeightedVoteCheckpointFactory contract was not deployed"
        );
        console.log("2");

        // // Step 11: update the registries addresses from the PolymathRegistry contract
        //   await I_PolymathRegistry.changeAddress("PolyToken", I_PolyToken.address, {from: account_polymath})
        //   await I_PolymathRegistry.changeAddress("ModuleRegistry", I_ModuleRegistryProxy.address, {from: account_polymath});
        //   await I_PolymathRegistry.changeAddress("FeatureRegistry", I_FeatureRegistry.address, {from: account_polymath});
        //   await I_PolymathRegistry.changeAddress("SecurityTokenRegistry", I_SecurityTokenRegistryProxy.address, {from: account_polymath});
        //   await I_MRProxied.updateFromRegistry({from: account_polymath});

      
        // STEP 5: Register the Modules with the ModuleRegistry contract

        // (A) :  Register the GeneralTransferManagerFactory
        await I_ModuleRegistry.registerModule(I_GeneralTransferManagerFactory.address, { from: account_polymath });
        await I_ModuleRegistry.verifyModule(I_GeneralTransferManagerFactory.address, true, { from: account_polymath });

        // (B) :  Register the GeneralDelegateManagerFactory
        await I_ModuleRegistry.registerModule(I_GeneralPermissionManagerFactory.address, { from: account_polymath });
        await I_ModuleRegistry.verifyModule(I_GeneralPermissionManagerFactory.address, true, { from: account_polymath });

        // (C) : Register the WeightedVoteCheckpointFactory
        await I_ModuleRegistry.registerModule(I_WeightedVoteCheckpointFactory.address, { from: account_polymath });
        await I_ModuleRegistry.verifyModule(I_WeightedVoteCheckpointFactory.address, true, { from: account_polymath });

        // Step 6: Deploy the TickerRegistry

        I_TickerRegistry = await TickerRegistry.new(I_PolyToken.address, initRegFee, { from: account_polymath });

        assert.notEqual(
            I_TickerRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "TickerRegistry contract was not deployed",
        );

        // Step 7: Deploy the STversionProxy contract

        I_STVersion = await STVersion.new(I_GeneralTransferManagerFactory.address);

        assert.notEqual(
            I_STVersion.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "STVersion contract was not deployed",
        );

        // Step 8: Deploy the SecurityTokenRegistry

        I_SecurityTokenRegistry = await SecurityTokenRegistry.new(
            I_PolyToken.address,
            I_ModuleRegistry.address,
            I_TickerRegistry.address,
            I_STVersion.address,
            initRegFee,
            {
                from: account_polymath
            });

        assert.notEqual(
            I_SecurityTokenRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "SecurityTokenRegistry contract was not deployed",
        );

        // Step 8: Set the STR in TickerRegistry
        await I_TickerRegistry.changeAddress("SecurityTokenRegistry", I_SecurityTokenRegistry.address, {from: account_polymath});
        await I_ModuleRegistry.changeAddress("SecurityTokenRegistry", I_SecurityTokenRegistry.address, {from: account_polymath});

        // Printing all the contract addresses
        console.log(`\nPolymathh  Network Smart Contracts Deployed:\n
            ModuleRegistry: ${I_ModuleRegistry.address}\n
            GeneralTransferManagerFactory: ${I_GeneralTransferManagerFactory.address}\n
            GeneralPermissionManagerFactory: ${I_GeneralPermissionManagerFactory.address}\n
            WeightedVoteCheckpointFactory: ${I_WeightedVoteCheckpointFactory.address}\n
            TickerRegistry: ${I_TickerRegistry.address}\n
            STVersionProxy_001: ${I_STVersion.address}\n
            SecurityTokenRegistry: ${I_SecurityTokenRegistry.address}\n
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
            await I_PolyToken.approve(I_SecurityTokenRegistry.address, initRegFee, { from: token_owner });
            let tx = await I_SecurityTokenRegistry.generateSecurityToken(name, symbol, tokenDetails, false, { from: token_owner, gas: 85000000 });

            // Verify the successful generation of the security token
            assert.equal(tx.logs[1].args._ticker, symbol.toUpperCase(), "SecurityToken doesn't get deployed");

            I_SecurityToken = SecurityToken.at(tx.logs[1].args._securityTokenAddress);

            const LogAddModule = await I_SecurityToken.allEvents();
            const log = await new Promise(function(resolve, reject) {
                LogAddModule.watch(function(error, log){ resolve(log);});
            });

            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._type.toNumber(), 2);
            assert.equal(
                web3.utils.toAscii(log.args._name)
                .replace(/\u0000/g, ''),
                "GeneralTransferManager"
            );
            LogAddModule.stopWatching();
        });

        it("Should intialize the auto attached modules", async () => {
           let moduleData = await I_SecurityToken.modules(2, 0);
           I_GeneralTransferManager = GeneralTransferManager.at(moduleData[1]);

           assert.notEqual(
            I_GeneralTransferManager.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "GeneralTransferManager contract was not deployed",
           );

        });

        it("Should fail to attach the WeightedVoteCheckpoint module to the security token if fee not paid", async () => {
            let errorThrown = false;
            await I_PolyToken.getTokens(web3.utils.toWei("500", "ether"), token_owner);
            try {
                const tx = await I_SecurityToken.addModule(I_WeightedVoteCheckpointFactory.address, "", web3.utils.toWei("500", "ether"), 0, true, { from: token_owner });
            } catch(error) {
                console.log(`       tx -> failed because setup fee is not paid`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        });

        it("Should successfully attach the WeightedVoteCheckpoint module to the security token", async () => {
            await I_PolyToken.transfer(I_SecurityToken.address, web3.utils.toWei("500", "ether"), {from: token_owner});
            const tx = await I_SecurityToken.addModule(I_WeightedVoteCheckpointFactory.address, "", web3.utils.toWei("500", "ether"), 0, true, { from: token_owner });
            assert.equal(tx.logs[3].args._type.toNumber(), checkpointKey, "WeightedVoteCheckpoint doesn't get deployed");
            assert.equal(web3.utils.hexToUtf8(tx.logs[3].args._name),"WeightedVoteCheckpoint","WeightedVoteCheckpoint module was not added");
            I_WeightedVoteCheckpoint = WeightedVoteCheckpoint.at(tx.logs[3].args._module);
        });

    });

    describe("Preparation", async() => {
        it("Should successfully mint tokens for first investor account", async() => {
            await I_GeneralTransferManager.modifyWhitelist(
                account_investor1,
                latestTime(),
                latestTime(),
                latestTime() + duration.days(30),
                true,
                {
                    from: account_issuer,
                    gas: 500000
                });
            await I_SecurityToken.mint(account_investor1, web3.utils.toWei('1', 'ether'), { from: token_owner });
        });

        it("Should successfully mint tokens for second investor account", async() => {
            await I_GeneralTransferManager.modifyWhitelist(
                account_investor2,
                latestTime(),
                latestTime(),
                latestTime() + duration.days(30),
                true,
                {
                    from: account_issuer,
                    gas: 500000
                });
            await I_SecurityToken.mint(account_investor2, web3.utils.toWei('2', 'ether'), { from: token_owner });
        });
    });

    describe("Create ballot", async() => {

        it("Should fail to create a new ballot if not owner", async() => {
            let errorThrown = false;
            try {
                let tx = await I_WeightedVoteCheckpoint.createBallot(duration.hours(2), { from: account_temp });
            } catch(error) {
                console.log(`       tx -> failed because msg.sender is not owner`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        });

        it("Should successfully create a new ballot", async() => {
            let tx = await I_WeightedVoteCheckpoint.createBallot(duration.hours(2), { from: token_owner });
            assert.equal(tx.logs[0].args._checkpointId.toNumber(), 1, "New ballot should be created at checkpoint 1");
        });
    });

    describe("Create custom ballot", async() => {

        it("Should fail to create a new custom ballot with endTime before startTime", async() => {
            let errorThrown = false;
            try {
                let startTime = latestTime() + duration.minutes(10);
                let endTime = latestTime() + duration.minutes(5);
                let tx = await I_WeightedVoteCheckpoint.createCustomBallot(startTime,endTime, 1, { from: token_owner });
            } catch(error) {
                console.log(`       tx -> failed because endTime before startTime`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        });

        it("Should fail to create a new custom ballot if checkpointId does not exist", async() => {
            let errorThrown = false;
            try {
                let startTime = latestTime() + duration.minutes(10);
                let endTime = latestTime() + duration.minutes(15);
                let tx = await I_WeightedVoteCheckpoint.createCustomBallot(startTime,endTime, 10, { from: token_owner });
            } catch(error) {
                console.log(`       tx -> failed because checkpointId does not exist`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        });

        it("Should fail to create a new custom ballot if not owner", async() => {
            let errorThrown = false;
            try {
                let startTime = latestTime() + duration.minutes(10);
                let endTime = latestTime() + duration.minutes(15);
                let tx = await I_WeightedVoteCheckpoint.createCustomBallot(startTime,endTime, 1, { from: account_temp });
            } catch(error) {
                console.log(`       tx -> failed because msg.sender is not owner`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        });

        it("Should successfully create a new custom ballot", async() => {
            let startTime = latestTime() + duration.minutes(10);
            let endTime = latestTime() + duration.minutes(15);
            let tx = await I_WeightedVoteCheckpoint.createCustomBallot(startTime,endTime, 1, { from: token_owner });
            assert.equal(tx.logs[0].args._checkpointId.toNumber(), 1, "New ballot should be created at checkpoint 1");
        });
    });

    describe("Cast vote", async() => {

        it("Should fail to cast a vote if token balance is zero", async() => {
            let errorThrown = false;
            try {
                let tx = await I_WeightedVoteCheckpoint.castVote(true,0, { from: account_investor3 });
            } catch(error) {
                console.log(`       tx -> failed because token balance is zero`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        });

        it("Should fail to cast a vote if voting period has not started", async() => {
            let errorThrown = false;
            try {
                let tx = await I_WeightedVoteCheckpoint.castVote(true,1, { from: account_investor1 });
            } catch(error) {
                console.log(`       tx -> failed because voting period has not started`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        });

        it("Should fail to cast a vote if voting period has ended", async() => {
            await increaseTime(duration.minutes(20));
            let errorThrown = false;
            try {
                let tx = await I_WeightedVoteCheckpoint.castVote(true,1, { from: account_investor1 });
            } catch(error) {
                console.log(`       tx -> failed because voting period has ended`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        });

        it("Should successfully cast a vote from first investor", async() => {
            let tx = await I_WeightedVoteCheckpoint.castVote(false, 0, { from: account_investor1 });

            assert.equal(tx.logs[0].args._investor, account_investor1, "Failed to record vote");
            assert.equal(tx.logs[0].args._vote, false, "Failed to record vote");
            assert.equal(tx.logs[0].args._weight, web3.utils.toWei('1', 'ether'), "Failed to record vote");
            assert.equal(tx.logs[0].args._ballotId, 0, "Failed to record vote");
            assert.equal(tx.logs[0].args._time, latestTime(), "Failed to record vote");
        });

        it("Should successfully cast a vote from second investor", async() => {
            let tx = await I_WeightedVoteCheckpoint.castVote(true, 0, { from: account_investor2 });

            assert.equal(tx.logs[0].args._investor, account_investor2, "Failed to record vote");
            assert.equal(tx.logs[0].args._vote, true, "Failed to record vote");
            assert.equal(tx.logs[0].args._weight, web3.utils.toWei('2', 'ether'), "Failed to record vote");
            assert.equal(tx.logs[0].args._ballotId, 0, "Failed to record vote");
            assert.equal(tx.logs[0].args._time, latestTime(), "Failed to record vote");
        });

        it("Should fail to cast a vote again", async() => {
            let errorThrown = false;
            try {
                let tx = await I_WeightedVoteCheckpoint.castVote(false,0, { from: account_investor1 });
            } catch(error) {
                console.log(`       tx -> failed because holder already voted`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        });
    });

    describe("Get results", async() => {

        it("Should successfully get the results", async() => {
            let tx = await I_WeightedVoteCheckpoint.getResults(0, { from: token_owner });
            assert.equal(tx[0], web3.utils.toWei('2', 'ether'), "Failed to get results");
            assert.equal(tx[1], web3.utils.toWei('1', 'ether'), "Failed to get results");
            assert.equal(tx[2], 0, "Failed to get results");
        });
    });
});
