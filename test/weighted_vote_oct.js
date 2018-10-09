import latestTime from './helpers/latestTime';
import {signData} from './helpers/signData';
import { pk }  from './helpers/testprivateKey';
import { duration, ensureException, promisifyLogWatch, latestBlock } from './helpers/utils';
import takeSnapshot, { increaseTime, revertToSnapshot } from './helpers/time';
import { encodeProxyCall, encodeModuleCall } from './helpers/encodeCall';

const PolymathRegistry = artifacts.require('./PolymathRegistry.sol')
const DummySTOFactory = artifacts.require('./DummySTOFactory.sol');
const DummySTO = artifacts.require('./DummySTO.sol');
const ModuleRegistry = artifacts.require('./ModuleRegistry.sol');
const ModuleRegistryProxy = artifacts.require('./ModuleRegistryProxy.sol');
const SecurityToken = artifacts.require('./SecurityToken.sol');
const SecurityTokenRegistry = artifacts.require('./SecurityTokenRegistry.sol');
const SecurityTokenRegistryProxy = artifacts.require('./SecurityTokenRegistryProxy.sol');
const FeatureRegistry = artifacts.require('./FeatureRegistry.sol');
const STFactory = artifacts.require('./STFactory.sol');
const GeneralPermissionManagerFactory = artifacts.require('./GeneralPermissionManagerFactory.sol');
const GeneralTransferManagerFactory = artifacts.require('./GeneralTransferManagerFactory.sol');
const GeneralTransferManager = artifacts.require('./GeneralTransferManager');
const GeneralPermissionManager = artifacts.require('./GeneralPermissionManager');
const PolyTokenFaucet = artifacts.require('./PolyTokenFaucet.sol');

const WeightedVoteCheckpointFactory = artifacts.require('./WeightedVoteCheckpointFactory.sol');
const WeightedVoteCheckpoint = artifacts.require('./WeightedVoteCheckpoint');

const Web3 = require('web3');
const BigNumber = require('bignumber.js');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")) // Hardcoded development port

contract('WeightedVoteCheckpoint', accounts => {

    // Accounts Variable declaration
    let account_polymath;
    let account_issuer;
    let token_owner;
    let token_owner_pk;
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
    let I_SecurityTokenRegistryProxy;
    let I_GeneralTransferManagerFactory;
    let I_GeneralPermissionManager;
    let I_GeneralTransferManager;
    let I_ModuleRegistryProxy;
    let I_ModuleRegistry;
    let I_FeatureRegistry;
    let I_SecurityTokenRegistry;
    let I_DummySTOFactory;
    let I_STFactory;
    let I_SecurityToken;
    let I_MRProxied;
    let I_STRProxied;
    let I_DummySTO;
    let I_PolyToken;
    let I_PolymathRegistry;
    let I_WeightedVoteCheckpointFactory;
    let P_WeightedVoteCheckpointFactory;
    let I_WeightedVoteCheckpoint;
    let P_WeightedVoteCheckpoint;

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
    const checkpointKey = 4;

    // Initial fee for ticker registry and security token registry
    const initRegFee = web3.utils.toWei("250");

    // Dummy STO details
    const startTime = latestTime() + duration.seconds(5000);           // Start time will be 5000 seconds more than the latest time
    const endTime = startTime + duration.days(80);                     // Add 80 days more
    const cap = web3.utils.toWei('10', 'ether');
    const someString = "A string which is not used";
    const STOParameters = ['uint256', 'uint256', 'uint256', 'string'];
    const STRProxyParameters = ['address', 'address', 'uint256', 'uint256', 'address', 'address'];
    const MRProxyParameters = ['address', 'address'];

    let bytesSTO = encodeModuleCall(STOParameters, [startTime, endTime, cap, someString]);

    before(async() => {
        // Accounts setup
        account_polymath = accounts[0];
        account_issuer = accounts[1];

        token_owner = account_issuer;
        token_owner_pk = pk.account_1;

        account_investor1 = accounts[6];
        account_investor2 = accounts[7];
        account_investor3 = accounts[8];
        account_investor4 = accounts[9];
        account_temp = accounts[2];


        // ----------- POLYMATH NETWORK Configuration ------------

        // Step 0: Deploy the PolymathRegistry
        I_PolymathRegistry = await PolymathRegistry.new({from: account_polymath});

        // Step 1: Deploy the token Faucet and Mint tokens for token_owner
        I_PolyToken = await PolyTokenFaucet.new();
        await I_PolyToken.getTokens((10000 * Math.pow(10, 18)), token_owner);

         // Step 2: Deploy the FeatureRegistry

         I_FeatureRegistry = await FeatureRegistry.new(
            I_PolymathRegistry.address,
            {
                from: account_polymath
            });

        // STEP 3: Deploy the ModuleRegistry

        I_ModuleRegistry = await ModuleRegistry.new({from:account_polymath});
        // Step 3 (b):  Deploy the proxy and attach the implementation contract to it
        I_ModuleRegistryProxy = await ModuleRegistryProxy.new({from:account_polymath});
        let bytesMRProxy = encodeProxyCall(MRProxyParameters, [I_PolymathRegistry.address, account_polymath]);
        await I_ModuleRegistryProxy.upgradeToAndCall("1.0.0", I_ModuleRegistry.address, bytesMRProxy, {from: account_polymath});
        I_MRProxied = await ModuleRegistry.at(I_ModuleRegistryProxy.address);

        // STEP 4: Deploy the GeneralTransferManagerFactory

        I_GeneralTransferManagerFactory = await GeneralTransferManagerFactory.new(I_PolyToken.address, 0, 0, 0, {from:account_polymath});

        assert.notEqual(
            I_GeneralTransferManagerFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "GeneralTransferManagerFactory contract was not deployed"
        );

       // STEP 5: Deploy the WeightedVoteCheckpointFactory
    
        I_WeightedVoteCheckpointFactory = await WeightedVoteCheckpointFactory.new(I_PolyToken.address, 0, 0, 0, {from:account_polymath});
        assert.notEqual(
            I_WeightedVoteCheckpointFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "WeightedVoteCheckpointFactory contract was not deployed"
        );
        console.log("deployed weight vote factory to "+I_WeightedVoteCheckpointFactory.address);

        // STEP 6: Deploy the WeightedVoteCheckpointFactory with fees

        P_WeightedVoteCheckpointFactory = await WeightedVoteCheckpointFactory.new(I_PolyToken.address, web3.utils.toWei("500","ether"), 0, 0, {from:account_polymath});

        assert.notEqual(
            P_WeightedVoteCheckpointFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "WeightedVoteCheckpointFactory contract with fees was not deployed"
        );

        // STEP 7: Deploy the DummySTOFactory

        I_DummySTOFactory = await DummySTOFactory.new(I_PolyToken.address, 0, 0, 0, {from:account_polymath});

        assert.notEqual(
            I_DummySTOFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "DummySTOFactory contract was not deployed"
        );


      // Step 8: Deploy the STFactory contract

      I_STFactory = await STFactory.new(I_GeneralTransferManagerFactory.address, {from : account_polymath });

      assert.notEqual(
          I_STFactory.address.valueOf(),
          "0x0000000000000000000000000000000000000000",
          "STFactory contract was not deployed",
      );

      // Step 9: Deploy the SecurityTokenRegistry contract

      I_SecurityTokenRegistry = await SecurityTokenRegistry.new({from: account_polymath });

      assert.notEqual(
          I_SecurityTokenRegistry.address.valueOf(),
          "0x0000000000000000000000000000000000000000",
          "SecurityTokenRegistry contract was not deployed",
      );

      // Step 10: Deploy the proxy and attach the implementation contract to it.
       I_SecurityTokenRegistryProxy = await SecurityTokenRegistryProxy.new({from: account_polymath});
       let bytesProxy = encodeProxyCall(STRProxyParameters, [I_PolymathRegistry.address, I_STFactory.address, initRegFee, initRegFee, I_PolyToken.address, account_polymath]);
       await I_SecurityTokenRegistryProxy.upgradeToAndCall("1.0.0", I_SecurityTokenRegistry.address, bytesProxy, {from: account_polymath});
       I_STRProxied = await SecurityTokenRegistry.at(I_SecurityTokenRegistryProxy.address);

      // Step 11: update the registries addresses from the PolymathRegistry contract
      await I_PolymathRegistry.changeAddress("PolyToken", I_PolyToken.address, {from: account_polymath})
      await I_PolymathRegistry.changeAddress("ModuleRegistry", I_ModuleRegistryProxy.address, {from: account_polymath});
      await I_PolymathRegistry.changeAddress("FeatureRegistry", I_FeatureRegistry.address, {from: account_polymath});
      await I_PolymathRegistry.changeAddress("SecurityTokenRegistry", I_SecurityTokenRegistryProxy.address, {from: account_polymath});
      await I_MRProxied.updateFromRegistry({from: account_polymath});

      // STEP 8: Register the Modules with the ModuleRegistry contract

      // (A) :  Register the GeneralTransferManagerFactory
      await I_MRProxied.registerModule(I_GeneralTransferManagerFactory.address, { from: account_polymath });
      await I_MRProxied.verifyModule(I_GeneralTransferManagerFactory.address, true, { from: account_polymath });

      // (B) :  Register the GeneralDelegateManagerFactory
      await I_MRProxied.registerModule(I_WeightedVoteCheckpointFactory.address, { from: account_polymath });
      await I_MRProxied.verifyModule(I_WeightedVoteCheckpointFactory.address, true, { from: account_polymath });

      // (B) :  Register the Paid GeneralDelegateManagerFactory
      await I_MRProxied.registerModule(P_WeightedVoteCheckpointFactory.address, { from: account_polymath });
      await I_MRProxied.verifyModule(P_WeightedVoteCheckpointFactory.address, true, { from: account_polymath });

      // (C) : Register the STOFactory
      await I_MRProxied.registerModule(I_DummySTOFactory.address, { from: account_polymath });
      await I_MRProxied.verifyModule(I_DummySTOFactory.address, true, { from: account_polymath });

        // Printing all the contract addresses
        console.log(`
        --------------------- Polymath Network Smart Contracts: ---------------------
        PolymathRegistry:                  ${PolymathRegistry.address}
        SecurityTokenRegistryProxy:        ${SecurityTokenRegistryProxy.address}
        SecurityTokenRegistry:             ${SecurityTokenRegistry.address}
        ModuleRegistryProxy                ${ModuleRegistryProxy.address}
        ModuleRegistry:                    ${ModuleRegistry.address}
        FeatureRegistry:                   ${FeatureRegistry.address}

        STFactory:                         ${STFactory.address}
        GeneralTransferManagerFactory:     ${GeneralTransferManagerFactory.address}
        GeneralPermissionManagerFactory:   ${GeneralPermissionManagerFactory.address}

        DummySTOFactory:                   ${I_DummySTOFactory.address}
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
            let tx = await I_STRProxied.generateSecurityToken(name, symbol, tokenDetails, false, { from: token_owner});

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

        it("Should fail to attach the WeightedVoteCheckpoint module to the security token if fee not paid", async () => {
            let errorThrown = false;
            await I_PolyToken.getTokens(web3.utils.toWei("500", "ether"), token_owner);
            try {
                const tx = await I_SecurityToken.addModule(P_WeightedVoteCheckpointFactory.address, "", web3.utils.toWei("500", "ether"), 0, { from: token_owner });
            } catch(error) {
                console.log(`       tx -> failed because setup fee is not paid`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        });

        it("Should successfully attach the WeightedVoteCheckpoint module to the security token after fees been paid", async () => {
            await I_PolyToken.transfer(I_SecurityToken.address, web3.utils.toWei("500", "ether"), {from: token_owner});
            const tx = await I_SecurityToken.addModule(P_WeightedVoteCheckpointFactory.address, "", web3.utils.toWei("500", "ether"), 0, { from: token_owner });
            console.log("weightVoteFactory PAID Address is " + P_WeightedVoteCheckpointFactory.address);
            console.log(tx.logs);
            assert.equal(tx.logs[3].args._types[0].toNumber(), checkpointKey, "WeightedVoteCheckpoint doesn't get deployed");
            assert.equal(web3.utils.hexToUtf8(tx.logs[3].args._name),"WeightedVoteCheckpoint","WeightedVoteCheckpoint module was not added");
            P_WeightedVoteCheckpoint = WeightedVoteCheckpoint.at(tx.logs[3].args._module);
        });

        it("Should successfully attach the Weighted Vote Checkpoint factory with the security token", async () => {
            const tx = await I_SecurityToken.addModule(I_WeightedVoteCheckpointFactory.address, "0x", 0, 0, { from: token_owner });
            console.log("weightVoteFactory Address is " + I_WeightedVoteCheckpointFactory.address);
            console.log(tx.logs);
            assert.equal(tx.logs[2].args._types[0].toNumber(), checkpointKey, "WeightedVoteCheckpoint doesn't get deployed");
            assert.equal(web3.utils.hexToUtf8(tx.logs[2].args._name),"WeightedVoteCheckpoint","WeightedVoteCheckpoint module was not added");
            I_WeightedVoteCheckpoint = WeightedVoteCheckpoint.at(tx.logs[2].args._module);
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
            assert.equal(await I_SecurityToken.balanceOf(account_investor1), web3.utils.toWei('1', 'ether'));
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
            assert.equal(await I_SecurityToken.balanceOf(account_investor2), web3.utils.toWei('2', 'ether'));
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

            console.log(tx.logs);

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

    describe("Active/Deactive Ballot", async() => {

        it("Should successfully deactive the ballot", async() => {
            let tx = await I_WeightedVoteCheckpoint.setActiveStatsBallot(0, false, { from: token_owner });
            let tx2 = await I_WeightedVoteCheckpoint.ballots(0,  { from: token_owner });
            assert.equal(tx2[7], false);
        });

        it("Should fail to cast a vote if ballot is deactivated", async() => {
            let errorThrown = false;
            try {
                let tx = await I_WeightedVoteCheckpoint.castVote(true,0, { from: account_investor1 });
            } catch(error) {
                console.log(`       tx -> failed because ballot is deactivated`.grey);
                ensureException(error);
                errorThrown = true;
            }
            assert.ok(errorThrown, message);
        });


        it("Should successfully active the same ballot again", async() => {
            let tx = await I_WeightedVoteCheckpoint.setActiveStatsBallot(0, true, { from: token_owner });
            let tx2 = await I_WeightedVoteCheckpoint.ballots(0,  { from: token_owner });
            assert.equal(tx2[7], true);
        });
    });

});
