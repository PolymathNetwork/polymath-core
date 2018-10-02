import latestTime from './helpers/latestTime';
import { duration, ensureException, promisifyLogWatch, latestBlock } from './helpers/utils';
import takeSnapshot, { increaseTime, revertToSnapshot } from './helpers/time';
import { encodeProxyCall } from './helpers/encodeCall';

const PolymathRegistry = artifacts.require('./PolymathRegistry.sol')
const ModuleRegistry = artifacts.require('./ModuleRegistry.sol');
const SecurityToken = artifacts.require('./SecurityToken.sol');
const SecurityTokenRegistry = artifacts.require('./SecurityTokenRegistry.sol');
const SecurityTokenRegistryProxy = artifacts.require('./SecurityTokenRegistryProxy.sol');
const FeatureRegistry = artifacts.require('./FeatureRegistry.sol');
const STFactory = artifacts.require('./STFactory.sol');
const GeneralPermissionManagerFactory = artifacts.require('./GeneralPermissionManagerFactory.sol');
const GeneralTransferManagerFactory = artifacts.require('./GeneralTransferManagerFactory.sol');
const GeneralTransferManager = artifacts.require('./GeneralTransferManager');
const VestingEscrowWalletFactory = artifacts.require('./VestingEscrowWalletFactory.sol');
const VestingEscrowWallet = artifacts.require('./VestingEscrowWallet.sol');
const GeneralPermissionManager = artifacts.require('./GeneralPermissionManager');
const PolyTokenFaucet = artifacts.require('./PolyTokenFaucet.sol');

const Web3 = require('web3');
const BigNumber = require('bignumber.js');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")) // Hardcoded development port

contract('VestingEscrowWallet', accounts => {

    // Accounts Variable declaration
    let account_polymath;
    let account_issuer;
    let token_owner;
    let employee1;
    let employee2;
    let employee3;
    let account_temp;

    // investor Details
    let fromTime = latestTime();
    let toTime = latestTime();
    let expiryTime = toTime + duration.days(15);

    let message = "Transaction Should Fail!";

    // Contract Instance Declaration
    let I_GeneralPermissionManagerFactory;
    let I_GeneralTransferManagerFactory;
    let I_SecurityTokenRegistryProxy;
    let I_VestingEscrowWalletFactory;
    let P_VestingEscrowWalletFactory;
    let P_VestingEscrowWallet;
    let I_GeneralPermissionManager;
    let I_VestingEscrowWallet;
    let I_GeneralTransferManager;
    let I_ExchangeTransferManager;
    let I_ModuleRegistry;
    let I_STRProxied;
    let I_FeatureRegistry;
    let I_SecurityTokenRegistry;
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
    let snapId;
    // Module key
    const delegateManagerKey = 1;
    const transferManagerKey = 2;
    const stoKey = 3;
    const checkpointKey = 4;
    const walletKey = 5;

    // Initial fee for ticker registry and security token registry
    const initRegFee = web3.utils.toWei("250");

    before(async() => {
        // Accounts setup
        account_polymath = accounts[0];
        account_issuer = accounts[1];

        token_owner = account_issuer;

        employee1 = accounts[6];
        employee2 = accounts[7];
        employee3 = accounts[8];
        account_temp = accounts[2];

        // ----------- POLYMATH NETWORK Configuration ------------

        // Step 0: Deploy the PolymathRegistry
        I_PolymathRegistry = await PolymathRegistry.new({from: account_polymath});

        // Step 1: Deploy the token Faucet and Mint tokens for token_owner
        I_PolyToken = await PolyTokenFaucet.new();
        await I_PolyToken.getTokens((10000 * Math.pow(10, 18)), token_owner);
        await I_PolymathRegistry.changeAddress("PolyToken", I_PolyToken.address, {from: account_polymath})

        // STEP 2: Deploy the ModuleRegistry
        I_ModuleRegistry = await ModuleRegistry.new(I_PolymathRegistry.address, {from:account_polymath});
        await I_PolymathRegistry.changeAddress("ModuleRegistry", I_ModuleRegistry.address, {from: account_polymath});

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

        // STEP 4: Deploy the VestingWallet
        P_VestingEscrowWalletFactory = await VestingEscrowWalletFactory.new(I_PolyToken.address, web3.utils.toWei("500","ether"), 0, 0, {from:account_polymath});
        assert.notEqual(
            P_VestingEscrowWalletFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "VestingEscrowWalletFactory contract was not deployed"
        );

        // STEP 4: Deploy the VestingWallet
        I_VestingEscrowWalletFactory = await VestingEscrowWalletFactory.new(I_PolyToken.address, 0, 0, 0, {from:account_polymath});
        assert.notEqual(
            I_VestingEscrowWalletFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "VestingEscrowWalletFactory contract was not deployed"
        );

        // STEP 5: Register the Modules with the ModuleRegistry contract
        // (A) :  Register the GeneralTransferManagerFactory
        await I_ModuleRegistry.registerModule(I_GeneralTransferManagerFactory.address, { from: account_polymath });
        await I_ModuleRegistry.verifyModule(I_GeneralTransferManagerFactory.address, true, { from: account_polymath });

        // (B) :  Register the GeneralDelegateManagerFactory
        await I_ModuleRegistry.registerModule(I_GeneralPermissionManagerFactory.address, { from: account_polymath });
        await I_ModuleRegistry.verifyModule(I_GeneralPermissionManagerFactory.address, true, { from: account_polymath });

        // (C) : Register the VestingEscrowWalletFactory
        await I_ModuleRegistry.registerModule(I_VestingEscrowWalletFactory.address, { from: account_polymath });
        await I_ModuleRegistry.verifyModule(I_VestingEscrowWalletFactory.address, true, { from: account_polymath });

        // (C) : Register the Paid VestingEscrowWalletFactory
        await I_ModuleRegistry.registerModule(P_VestingEscrowWalletFactory.address, { from: account_polymath });
        await I_ModuleRegistry.verifyModule(P_VestingEscrowWalletFactory.address, true, { from: account_polymath });

        // Step 7: Deploy the STFactory contract
        I_STFactory = await STFactory.new(I_GeneralTransferManagerFactory.address);

        assert.notEqual(
            I_STFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "STFactory contract was not deployed",
        );

       // Step 9: Deploy the SecurityTokenRegistry
        // Deploy the SecurityTokenregistry
        I_SecurityTokenRegistry = await SecurityTokenRegistry.new({from: account_polymath });

        assert.notEqual(
            I_SecurityTokenRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "SecurityTokenRegistry contract was not deployed",
        );

        // Step 10: update the registries addresses from the PolymathRegistry contract
        I_SecurityTokenRegistryProxy = await SecurityTokenRegistryProxy.new({from: account_polymath});
        let bytesProxy = encodeProxyCall([I_PolymathRegistry.address, I_STFactory.address, initRegFee, initRegFee, I_PolyToken.address, account_polymath]);
        await I_SecurityTokenRegistryProxy.upgradeToAndCall("1.0.0", I_SecurityTokenRegistry.address, bytesProxy, {from: account_polymath});
        I_STRProxied = await SecurityTokenRegistry.at(I_SecurityTokenRegistryProxy.address);

        // Step 10: Deploy the FeatureRegistry
        I_FeatureRegistry = await FeatureRegistry.new(
            I_PolymathRegistry.address,
            {
                from: account_polymath
            });
        await I_PolymathRegistry.changeAddress("FeatureRegistry", I_FeatureRegistry.address, {from: account_polymath});

        assert.notEqual(
            I_FeatureRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "FeatureRegistry contract was not deployed",
        );

        // Step 11: update the registries addresses from the PolymathRegistry contract
        await I_PolymathRegistry.changeAddress("SecurityTokenRegistry", I_STRProxied.address, {from: account_polymath});
        await I_ModuleRegistry.updateFromRegistry({from: account_polymath});

        // Printing all the contract addresses
        console.log(`
        --------------------- Polymath Network Smart Contracts: ---------------------
        PolymathRegistry:                  ${PolymathRegistry.address}
        SecurityTokenRegistryProxy:        ${SecurityTokenRegistryProxy.address}
        SecurityTokenRegistry:             ${SecurityTokenRegistry.address}
        ModuleRegistry:                    ${ModuleRegistry.address}
        FeatureRegistry:                   ${FeatureRegistry.address}

        STFactory:                         ${STFactory.address}
        GeneralTransferManagerFactory:     ${GeneralTransferManagerFactory.address}
        GeneralPermissionManagerFactory:   ${GeneralPermissionManagerFactory.address}

        VestingEscrowWalletFactory:    ${I_VestingEscrowWalletFactory.address}
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
          let tx = await I_STRProxied.generateSecurityToken(name, symbol, tokenDetails, false, { from: token_owner, gas: 85000000 });

          // Verify the successful generation of the security token
          assert.equal(tx.logs[1].args._ticker, symbol.toUpperCase(), "SecurityToken doesn't get deployed");

          I_SecurityToken = SecurityToken.at(tx.logs[1].args._securityTokenAddress);

          const log = await promisifyLogWatch(I_SecurityToken.LogModuleAdded({from: _blockNo}), 1);
          // Verify that 0 module get added successfully or not
          assert.equal(log.args._type.toNumber(), 2);
          assert.equal(
              web3.utils.toAscii(log.args._name)
              .replace(/\u0000/g, ''),
              "GeneralTransferManager"
          );
      });

      it("Should intialize the auto attached modules", async () => {
         let moduleData = await I_SecurityToken.modules(2, 0);
         I_GeneralTransferManager = GeneralTransferManager.at(moduleData);

      });

      it("Should successfully attach the VestingEscrowWallet with the security token", async () => {
          let errorThrown = false;
          try {
              const tx = await I_SecurityToken.addModule(P_VestingEscrowWalletFactory.address, "", web3.utils.toWei("500", "ether"), 0, { from: token_owner });
          } catch(error) {
              console.log(`       tx -> failed because Token is not paid`.grey);
              ensureException(error);
              errorThrown = true;
          }
          assert.ok(errorThrown, message);
      });

      it("Should successfully attach the VestingEscrowWallet with the security token", async () => {
          let snapId = await takeSnapshot()
          await I_PolyToken.getTokens(web3.utils.toWei("500", "ether"), token_owner);
          await I_PolyToken.transfer(I_SecurityToken.address, web3.utils.toWei("500", "ether"), {from: token_owner});
          const tx = await I_SecurityToken.addModule(P_VestingEscrowWalletFactory.address, "", web3.utils.toWei("500", "ether"), 0, { from: token_owner });
          assert.equal(tx.logs[3].args._type.toNumber(), walletKey, "VestingEscrowWallet doesn't get deployed");
          assert.equal(
              web3.utils.toAscii(tx.logs[3].args._name)
              .replace(/\u0000/g, ''),
              "VestingEscrowWallet",
              "VestingEscrowWallet module was not added"
          );
          P_VestingEscrowWallet = VestingEscrowWallet.at(tx.logs[3].args._module);
          await revertToSnapshot(snapId);
      });

      it("Should successfully attach the VestingEscrowWallet with the security token", async () => {
        const tx = await I_SecurityToken.addModule(I_VestingEscrowWalletFactory.address, "", 0, 0, { from: token_owner });
        assert.equal(tx.logs[2].args._type.toNumber(), walletKey, "VestingEscrowWallet doesn't get deployed");
        assert.equal(
            web3.utils.toAscii(tx.logs[2].args._name)
            .replace(/\u0000/g, ''),
            "VestingEscrowWallet",
            "VestingEscrowWallet module was not added"
        );
        I_VestingEscrowWallet = VestingEscrowWallet.at(tx.logs[2].args._module);
      });
    });

    describe("Check Escrow Wallet", async() => {
      context("Create Template", async() => {
        it("Should fail to create a vesting schedule template", async() => {
          let totalAllocation = '10';
          let errorThrown = false;
          let vestingDuration = latestTime() + duration.years(4);
          let vestingFrequency = (duration.years(1)/4);
          try {
            let tx = await I_VestingEscrowWallet.createTemplate(web3.utils.toWei(totalAllocation, 'ether'), vestingDuration, vestingFrequency, {from: employee1});
          } catch(error) {
              console.log(`       tx -> failed because caller is not the issuer`.grey);
              ensureException(error);
              errorThrown = true;
          }
          assert.ok(errorThrown, message);
        });
        it("Create a vesting schedule template", async() => {
          let totalAllocation = '10';
          let vestingDuration = duration.years(4);
          let vestingFrequency = (duration.years(1)/4);
          let tx = await I_VestingEscrowWallet.createTemplate(web3.utils.toWei(totalAllocation, 'ether'), vestingDuration, vestingFrequency, {from: token_owner});

          assert.equal(tx.logs[0].args.templateNumber.toNumber(), 0, "Template should be created at number 0");
        });
        it("Create two more vesting schdule templates", async() => {
          let totalAllocation = ['25', '50'];
          let vestingDuration = duration.years(4);
          let vestingFrequency = (duration.years(1)/4);
          let tx = await I_VestingEscrowWallet.createTemplate(web3.utils.toWei(totalAllocation[0], 'ether'), vestingDuration, vestingFrequency, {from: token_owner});
          assert.equal(tx.logs[0].args.templateNumber.toNumber(), 1, "Template should be created at number 1");
          tx = await I_VestingEscrowWallet.createTemplate(web3.utils.toWei(totalAllocation[1], 'ether'), vestingDuration, vestingFrequency, {from: token_owner});
          assert.equal(tx.logs[0].args.templateNumber.toNumber(), 2, "Template should be created at number 2");
        });
        it("Increment the templateCount", async() => {
          let totalAllocation = '10';
          let vestingDuration = duration.years(4);
          let vestingFrequency = (duration.years(1)/4);
          let count = await I_VestingEscrowWallet.templateCount.call();
          assert.equal(count.toNumber(), 3, "Template count should be 3");
        });
      })
      context("Initiate Vesting Schedule", async() => {
        it("Should whitelist all relevant parties", async() => {
            let tx = await I_GeneralTransferManager.modifyWhitelistMulti(
                        [token_owner, employee1, employee2, employee3, I_VestingEscrowWallet.address],
                        [latestTime(),latestTime(),latestTime(),latestTime(),latestTime()],
                        [latestTime(),latestTime(),latestTime(),latestTime(),latestTime()],
                        [latestTime() + duration.days(10),latestTime() + duration.days(10),latestTime() + duration.days(10),latestTime() + duration.days(10),latestTime() + duration.days(10)],
                        [true, true, true, true, true],
                        {
                            from: token_owner,
                            gas: 6000000
                        });

            assert.equal(tx.logs[0].args._investor, token_owner);
            assert.equal(tx.logs[1].args._investor, employee1);
            assert.equal(tx.logs[2].args._investor, employee2);
            assert.equal(tx.logs[3].args._investor, employee3);
            assert.equal(tx.logs[4].args._investor, I_VestingEscrowWallet.address);
        });

        it("Should mint tokens for the token_owner and approve the contract address", async() => {
          let tokenOwnerInitialBalance = await I_SecurityToken.balanceOf(token_owner);

          await I_SecurityToken.mint(token_owner, web3.utils.toWei('500', 'ether'), { from: token_owner });
          await I_SecurityToken.approve(I_VestingEscrowWallet.address, web3.utils.toWei('500', 'ether'), {from: token_owner});

          let tokenOwnerNewBalance = await I_SecurityToken.balanceOf(token_owner);

          assert.equal(tokenOwnerNewBalance.toNumber() - web3.utils.toWei('500', 'ether'), tokenOwnerInitialBalance.toNumber(), "Template should be created at number 2");
        });
        it("Should fail to initiate a vesting schedule because the caller is not the owner", async() => {
          let errorThrown = false;
          let target = [employee1, employee2, employee3]
          let totalAllocation = ['10000', '25000', '50000'];
          totalAllocation = [web3.utils.toWei(totalAllocation[0], 'ether'), web3.utils.toWei(totalAllocation[1], 'ether'), web3.utils.toWei(totalAllocation[2], 'ether')]
          let vestingDuration = [duration.years(4), duration.years(4), duration.years(4)];
          let startDate = [latestTime() + duration.days(1), latestTime() + duration.days(2), latestTime() + duration.days(3)]
          let vestingFrequency = [(duration.years(1)/4),(duration.years(1)/2), (duration.years(1)/2)];
          let params = [target, totalAllocation, vestingDuration, startDate, vestingFrequency];
          try {
            let tx = await I_VestingEscrowWallet.initiateVestingSchedule(params[0], params[1], params[2], params[3], params[4], {from: employee1});
          } catch(error) {
              console.log(`       tx -> failed because caller is not the issuer`.grey);
              Object.keys(error).forEach(function (key){
                ensureException(error[key]);
              });
              errorThrown = true;
          }
          assert.ok(errorThrown, message);
        });
        it("Should fail to initiate a vesting schedule because the the input arrays are not of equal length", async() => {
          let errorThrown = false;
          let target = [employee1, employee2]
          let totalAllocation = ['10000', '25000', '50000'];
          totalAllocation = [web3.utils.toWei(totalAllocation[0], 'ether'), web3.utils.toWei(totalAllocation[1], 'ether'), web3.utils.toWei(totalAllocation[2], 'ether')]
          let vestingDuration = [duration.years(4), duration.years(4), duration.years(4)];
          let startDate = [latestTime() + duration.days(1), latestTime() + duration.days(2), latestTime() + duration.days(3)]
          let vestingFrequency = [(duration.years(1)/4), (duration.years(1)/2), (duration.years(1)/2)];
          let params = [target, totalAllocation, vestingDuration, startDate, vestingFrequency];
          try {
            let tx = await I_VestingEscrowWallet.initiateVestingSchedule(params[0], params[1], params[2], params[3], params[4], {from: token_owner});
          } catch(error) {
              console.log(`       tx -> failed because arrays ar unequal`.grey);
              Object.keys(error).forEach(function (key){
                ensureException(error[key]);
              });
              errorThrown = true;
          }
          assert.ok(errorThrown, message);
        });

        it("Should fail to initiate a vesting schedule because a target input was 0", async() => {
          let errorThrown = false;
          let target = [0, employee2, employee3]
          let totalAllocation = ['16', '20', '24'];
          totalAllocation = [web3.utils.toWei(totalAllocation[0], 'ether'), web3.utils.toWei(totalAllocation[1], 'ether'), web3.utils.toWei(totalAllocation[2], 'ether')]
          let vestingDuration = [duration.years(4), duration.years(4), duration.years(4)];
          let startDate = [latestTime() + duration.days(1), latestTime() + duration.days(2), latestTime() + duration.days(3)]
          let vestingFrequency = [(duration.years(1)/4), (duration.years(1)/2), (duration.years(1)/2)];

          let params = [target, totalAllocation, vestingDuration, startDate, vestingFrequency];

          try {
            let tx = await I_VestingEscrowWallet.initiateVestingSchedule(params[0], params[1], params[2], params[3], params[4], {from: token_owner});
          } catch(error) {
              console.log(`       tx -> failed because a target input was 0`.grey);
              Object.keys(error).forEach(function (key){
                ensureException(error[key]);
              });
              errorThrown = true;
          }
          assert.ok(errorThrown, message);
        });
        it("Should fail to initiate a vesting schedule because a totalAllocation input was 0", async() => {
          let errorThrown = false;
          let target = [employee1, employee2, employee3]
          let totalAllocation = ['16', '20', '24'];
          totalAllocation = [0, web3.utils.toWei(totalAllocation[1], 'ether'), web3.utils.toWei(totalAllocation[2], 'ether')]
          let vestingDuration = [duration.years(4), duration.years(4), duration.years(4)];
          let startDate = [latestTime() + duration.days(1), latestTime() + duration.days(2), latestTime() + duration.days(3)]
          let vestingFrequency = [(duration.years(1)/4), (duration.years(1)/2), (duration.years(1)/2)];

          let params = [target, totalAllocation, vestingDuration, startDate, vestingFrequency];

          try {
            let tx = await I_VestingEscrowWallet.initiateVestingSchedule(params[0], params[1], params[2], params[3], params[4], {from: token_owner});
          } catch(error) {
              console.log(`       tx -> failed because a target input was 0`.grey);
              Object.keys(error).forEach(function (key){
                ensureException(error[key]);
              });
              errorThrown = true;
          }
          assert.ok(errorThrown, message);
        });
        it("Should fail to initiate a vesting schedule because a vestingDuration input was 0", async() => {
          let errorThrown = false;
          let target = [employee1, employee2, employee3]
          let totalAllocation = ['16', '20', '24'];
          totalAllocation = [web3.utils.toWei(totalAllocation[0], 'ether'), web3.utils.toWei(totalAllocation[1], 'ether'), web3.utils.toWei(totalAllocation[2], 'ether')]
          let vestingDuration = [0, duration.years(4), duration.years(4)];
          let startDate = [latestTime() + duration.days(1), latestTime() + duration.days(2), latestTime() + duration.days(3)]
          let vestingFrequency = [(duration.years(1)/4), (duration.years(1)/2), (duration.years(1)/2)];

          let params = [target, totalAllocation, vestingDuration, startDate, vestingFrequency];

          try {
            let tx = await I_VestingEscrowWallet.initiateVestingSchedule(params[0], params[1], params[2], params[3], params[4], {from: token_owner});
          } catch(error) {
              console.log(`       tx -> failed because a target input was 0`.grey);
              Object.keys(error).forEach(function (key){
                ensureException(error[key]);
              });
              errorThrown = true;
          }
          assert.ok(errorThrown, message);
        });
        it("Should fail to initiate a vesting schedule because a startDate was input was before now", async() => {
          let errorThrown = false;
          let target = [employee1, employee2, employee3]
          let totalAllocation = ['16', '20', '24'];
          totalAllocation = [web3.utils.toWei(totalAllocation[0], 'ether'), web3.utils.toWei(totalAllocation[1], 'ether'), web3.utils.toWei(totalAllocation[2], 'ether')]
          let vestingDuration = [duration.years(4), duration.years(4), duration.years(4)];
          let startDate = [latestTime() - duration.days(1), latestTime() + duration.days(2), latestTime() + duration.days(3)]
          let vestingFrequency = [(duration.years(1)/4), (duration.years(1)/2), (duration.years(1)/2)];

          let params = [target, totalAllocation, vestingDuration, startDate, vestingFrequency];

          try {
            let tx = await I_VestingEscrowWallet.initiateVestingSchedule(params[0], params[1], params[2], params[3], params[4], {from: token_owner});
          } catch(error) {
              console.log(`       tx -> failed because a target input was 0`.grey);
              Object.keys(error).forEach(function (key){
                ensureException(error[key]);
              });
              errorThrown = true;
          }
          assert.ok(errorThrown, message);
        });
        it("Should fail to initiate a vesting schedule because a vestingFrequency input was 0", async() => {
          let errorThrown = false;
          let target = [employee1, employee2, employee3]
          let totalAllocation = ['10000', '25000', '50000'];
          totalAllocation = [web3.utils.toWei(totalAllocation[0], 'ether'), web3.utils.toWei(totalAllocation[1], 'ether'), web3.utils.toWei(totalAllocation[2], 'ether')]
          let vestingDuration = [duration.years(4), duration.years(4), duration.years(4)];
          let startDate = [0, latestTime() + duration.days(2), latestTime() + duration.days(3)]
          let vestingFrequency = [0, (duration.years(1)/2), (duration.years(1)/2)];
          let params = [target, totalAllocation, vestingDuration, startDate, vestingFrequency];
          try {
            let tx = await I_VestingEscrowWallet.initiateVestingSchedule(params[0], params[1], params[2], params[3], params[4], {from: token_owner});
          } catch(error) {
              console.log(`       tx -> failed because a vestingFrequency input was 0`.grey);
              Object.keys(error).forEach(function (key){
                ensureException(error[key]);
              });
              errorThrown = true;
          }
          assert.ok(errorThrown, message);
        });
        it("Should fail to initiate a vesting schedule because a vestingFrequency was greater than the associated vestingDuration", async() => {
          let errorThrown = false;
          let target = [employee1, employee2, employee3]
          let totalAllocation = ['16', '20', '24'];
          totalAllocation = [web3.utils.toWei(totalAllocation[0], 'ether'), web3.utils.toWei(totalAllocation[1], 'ether'), web3.utils.toWei(totalAllocation[2], 'ether')]
          let vestingDuration = [duration.years(4), duration.years(4), duration.years(4)];
          let startDate = [latestTime() + duration.days(1), latestTime() + duration.days(2), latestTime() + duration.days(3)]
          let vestingFrequency = [(duration.years(5)), (duration.years(1)/2), (duration.years(1)/2)];

          let params = [target, totalAllocation, vestingDuration, startDate, vestingFrequency];

          try {
            let tx = await I_VestingEscrowWallet.initiateVestingSchedule(params[0], params[1], params[2], params[3], params[4], {from: token_owner});
          } catch(error) {
              console.log(`       tx -> failed because a target input was 0`.grey);
              Object.keys(error).forEach(function (key){
                ensureException(error[key]);
              });
              errorThrown = true;
          }
          assert.ok(errorThrown, message);
        });
        it("Should fail to initiate a vesting schedule because a vestingFrequency was not a whole factor of the associated vestingDuration ", async() => {
          let errorThrown = false;
          let target = [employee1, employee2, employee3]
          let totalAllocation = ['16', '20', '24'];
          totalAllocation = [web3.utils.toWei(totalAllocation[0], 'ether'), web3.utils.toWei(totalAllocation[1], 'ether'), web3.utils.toWei(totalAllocation[2], 'ether')]
          let vestingDuration = [duration.years(4), duration.years(4), duration.years(4)];
          let startDate = [latestTime() + duration.days(1), latestTime() + duration.days(2), latestTime() + duration.days(3)]
          let vestingFrequency = [(duration.years(3)/4), (duration.years(1)/2), (duration.years(1)/2)];

          let params = [target, totalAllocation, vestingDuration, startDate, vestingFrequency];

          try {
            let tx = await I_VestingEscrowWallet.initiateVestingSchedule(params[0], params[1], params[2], params[3], params[4], {from: token_owner});
          } catch(error) {
              console.log(`       tx -> failed because a target input was 0`.grey);
              Object.keys(error).forEach(function (key){
                ensureException(error[key]);
              });
              errorThrown = true;
          }
          assert.ok(errorThrown, message);
        });
        it("Create a vesting schedule for each of the employees", async() => {
          let target = [employee1, employee2, employee3]
          let totalAllocation = ['16', '20', '24'];
          totalAllocation = [web3.utils.toWei(totalAllocation[0], 'ether'), web3.utils.toWei(totalAllocation[1], 'ether'), web3.utils.toWei(totalAllocation[2], 'ether')]
          let vestingDuration = [duration.years(4), duration.years(4), duration.years(4)];
          let startDate = [latestTime() + duration.days(1), latestTime() + duration.days(2), latestTime() + duration.days(3)]
          let vestingFrequency = [(duration.years(1)/4), (duration.years(1)/2), (duration.years(1)/2)];

          let params = [target, totalAllocation, vestingDuration, startDate, vestingFrequency];

          let tx = await I_VestingEscrowWallet.initiateVestingSchedule(params[0], params[1], params[2], params[3], params[4], {from: token_owner});

          let employee1VestingCount = await I_VestingEscrowWallet.individualVestingCount(employee1)
          let employee2VestingCount = await I_VestingEscrowWallet.individualVestingCount(employee2)
          let employee3VestingCount = await I_VestingEscrowWallet.individualVestingCount(employee3)

          assert.equal(employee1VestingCount.toNumber(), 1, "Did not receive a vesting schedule.")
          assert.equal(employee2VestingCount.toNumber(), 1, "Did not receive a vesting schedule.")
          assert.equal(employee3VestingCount.toNumber(), 1, "Did not receive a vesting schedule.")
        });
        it("Increment the vesting schedule for a specific employee", async() => {
          let target = [employee1]
          let totalAllocation = ['20'];
          totalAllocation = [web3.utils.toWei(totalAllocation[0], 'ether')]
          let vestingDuration = [duration.years(4)];
          let startDate = [latestTime() + duration.days(1)]
          let vestingFrequency = [(duration.years(1)/4)];
          let params = [target, totalAllocation, vestingDuration, startDate, vestingFrequency];

          let tx = await I_VestingEscrowWallet.initiateVestingSchedule(params[0], params[1], params[2], params[3], params[4], {from: token_owner});

          let employee1VestingCount = await I_VestingEscrowWallet.individualVestingCount(employee1)

          assert.equal(employee1VestingCount.toNumber(), 2, "Did not receive a vesting schedule.")
        });
        it("Save vesting schedule for a specific employee in individualVestingDetails", async() => {
          let txOne = await I_VestingEscrowWallet.individualVestingDetails(employee1, 0);
          let totalAllocationOne = txOne[1].toNumber();
          let txTwo = await I_VestingEscrowWallet.individualVestingDetails(employee1, 1);
          let totalAllocationTwo = txTwo[1].toNumber();

          assert.equal(totalAllocationOne, web3.utils.toWei('16', 'ether'), "Schedule did not get stored");
          assert.equal(totalAllocationTwo, web3.utils.toWei('20', 'ether'), "Schedule did not get stored")
        });
        it("Issuer should send all tokens if no tokens available exist in the contract upon vesting schedule creation", async() => {
          let tokenOwnerBalanceBefore = await I_SecurityToken.balanceOf(token_owner);

          let target = [employee1]
          let totalAllocation = ['20'];
          totalAllocation = [web3.utils.toWei(totalAllocation[0], 'ether')]
          let vestingDuration = [duration.years(4)];
          let startDate = [latestTime() + duration.days(1)]
          let vestingFrequency = [(duration.years(1)/4)];
          let params = [target, totalAllocation, vestingDuration, startDate, vestingFrequency];

          let tx = await I_VestingEscrowWallet.initiateVestingSchedule(params[0], params[1], params[2], params[3], params[4], {from: token_owner});

          let tokenOwnerBalanceAfter = await I_SecurityToken.balanceOf(token_owner);

          assert.equal(tokenOwnerBalanceAfter.add(totalAllocation).toNumber(), tokenOwnerBalanceBefore.toNumber(), "Tokens did not get transferred.")
        });
        it("Issuer should send partial tokens if some of the required tokens already exist and are available in the contract upon vesting schedule creation", async() => {
          let tokenOwnerBalanceBefore = await I_SecurityToken.balanceOf(token_owner);

          // Create a vesting schedule
          let target = [employee1]
          let totalAllocation = ['20'];
          totalAllocation = [web3.utils.toWei(totalAllocation[0], 'ether')]
          let vestingDuration = [duration.years(4)];
          let startDate = [latestTime() + duration.days(1)]
          let vestingFrequency = [(duration.years(1)/4)];
          let params = [target, totalAllocation, vestingDuration, startDate, vestingFrequency];

          await I_VestingEscrowWallet.initiateVestingSchedule(params[0], params[1], params[2], params[3], params[4], {from: token_owner});

          // Cancel schedule and leave tokens
          // This is the 4th schedule creation for employee1
          await I_VestingEscrowWallet.cancelVestingSchedule(employee1, 3, false, {from: token_owner});

          let tokenOwnerBalanceMiddle = await I_SecurityToken.balanceOf(token_owner);

          assert.equal(tokenOwnerBalanceMiddle.add(totalAllocation).toNumber(), tokenOwnerBalanceBefore.toNumber(), "Tokens did not get left in the contract.")

          // Create schedule with double the amount of tokens. Owner should only send 20, since there are 20 in the contract already
          let newTotalAllocation = ['40'];
          newTotalAllocation = [web3.utils.toWei(newTotalAllocation[0], 'ether')]

          params = [target, newTotalAllocation, vestingDuration, startDate, vestingFrequency];
          await I_VestingEscrowWallet.initiateVestingSchedule(params[0], params[1], params[2], params[3], params[4], {from: token_owner});

          let tokenOwnerBalanceAfter = await I_SecurityToken.balanceOf(token_owner);

          assert.equal(tokenOwnerBalanceAfter.add(totalAllocation).toNumber(), tokenOwnerBalanceMiddle.toNumber(), "Tokens did not get transferred.")
        });
        it("Issuer should send no tokens if the all of the required tokens already exist and are available in the contract upon vesting schedule creation", async() => {
         let tokenOwnerBalanceBefore = await I_SecurityToken.balanceOf(token_owner);

         // Create a vesting schedule
         let target = [employee1]
         let totalAllocation = ['40'];
         totalAllocation = [web3.utils.toWei(totalAllocation[0], 'ether')]
         let vestingDuration = [duration.years(4)];
         let startDate = [latestTime() + duration.days(1)]
         let vestingFrequency = [(duration.years(1)/4)];
         let params = [target, totalAllocation, vestingDuration, startDate, vestingFrequency];

         await I_VestingEscrowWallet.initiateVestingSchedule(params[0], params[1], params[2], params[3], params[4], {from: token_owner});

         // Cancel schedule and leave tokens
         // This is the 6th schedule creation for employee1
         await I_VestingEscrowWallet.cancelVestingSchedule(employee1, 5, false, {from: token_owner});

         let tokenOwnerBalanceMiddle = await I_SecurityToken.balanceOf(token_owner);

         assert.equal(tokenOwnerBalanceMiddle.add(totalAllocation).toNumber(), tokenOwnerBalanceBefore.toNumber(), "Tokens did not get left in the contract.")

         // Create schedule with double the amount of tokens. Owner should only send 20, since there are 20 in the contract already
         let newTotalAllocation = ['20'];
         newTotalAllocation = [web3.utils.toWei(newTotalAllocation[0], 'ether')]

         params = [target, newTotalAllocation, vestingDuration, startDate, vestingFrequency];
         await I_VestingEscrowWallet.initiateVestingSchedule(params[0], params[1], params[2], params[3], params[4], {from: token_owner});

         let tokenOwnerBalanceAfter = await I_SecurityToken.balanceOf(token_owner);

         assert.equal(tokenOwnerBalanceAfter.toNumber(), tokenOwnerBalanceMiddle.toNumber(), "Tokens did not get transferred.")
        });
      })
      context("Initiate Vesting Schedule From Template", async() => {
        it("Should fail to initiate a vesting schedule from template because the caller is not the owner", async() => {
          let errorThrown = false;
          let target = [employee1, employee2, employee3]
          let templateNumber = 0;
          let startDate = latestTime() + duration.days(1)

          try {
            let tx = await I_VestingEscrowWallet.initiateVestingScheduleFromTemplate(target, templateNumber, startDate, {from: employee1});
          } catch(error) {
              console.log(`       tx -> failed because caller is not the issuer`.grey);
              Object.keys(error).forEach(function (key){
                ensureException(error[key]);
              });
              errorThrown = true;
          }
          assert.ok(errorThrown, message);
        });
        it("Should fail to initiate a vesting schedule from template because an input target is 0", async() => {
          let errorThrown = false;
          let target = [0, employee2, employee3]
          let templateNumber = 0;
          let startDate = latestTime() + duration.days(1)

          try {
            let tx = await I_VestingEscrowWallet.initiateVestingScheduleFromTemplate(target, templateNumber, startDate, {from: token_owner});
          } catch(error) {
              console.log(`       tx -> failed because caller is not the issuer`.grey);
              Object.keys(error).forEach(function (key){
                ensureException(error[key]);
              });
              errorThrown = true;
          }
          assert.ok(errorThrown, message);
        });
        it("Create a vesting schedule for an employee based on a template", async() => {
            let currentScheduleCount = await I_VestingEscrowWallet.individualVestingCount(employee1);
            let target = [employee1, employee2, employee3]
            let templateNumber = 0;
            let startDate = latestTime() + duration.days(1)

            let tx = await I_VestingEscrowWallet.initiateVestingScheduleFromTemplate(target, templateNumber, startDate, {from: token_owner});
            let newScheduleCount = await I_VestingEscrowWallet.individualVestingCount(employee1);

            assert.equal(currentScheduleCount.add(1).toNumber(), newScheduleCount.toNumber(), "Schedule count did not get updated")
        });
        it("Create a vesting schedule for multiple employees based on a template", async() => {
          let currentScheduleCountOne = await I_VestingEscrowWallet.individualVestingCount(employee1);
          let currentScheduleCountTwo = await I_VestingEscrowWallet.individualVestingCount(employee2);
          let currentScheduleCountThree = await I_VestingEscrowWallet.individualVestingCount(employee3);

          let target = [employee1, employee2, employee3]
          let templateNumber = 0;
          let startDate = latestTime() + duration.days(1)

          let tx = await I_VestingEscrowWallet.initiateVestingScheduleFromTemplate(target, templateNumber, startDate, {from: token_owner});
          let newScheduleCountOne = await I_VestingEscrowWallet.individualVestingCount(employee1);
          let newScheduleCountTwo = await I_VestingEscrowWallet.individualVestingCount(employee2);
          let newScheduleCountThree = await I_VestingEscrowWallet.individualVestingCount(employee3);

          assert.equal(currentScheduleCountOne.add(1).toNumber(), newScheduleCountOne.toNumber(), "Schedule count did not get updated")
          assert.equal(currentScheduleCountTwo.add(1).toNumber(), newScheduleCountTwo.toNumber(), "Schedule count did not get updated")
          assert.equal(currentScheduleCountThree.add(1).toNumber(), newScheduleCountThree.toNumber(), "Schedule count did not get updated")
        });
        it("Save vesting schedule for a specific employee in individualVestingDetails", async() => {
            let currentScheduleCount = await I_VestingEscrowWallet.individualVestingCount(employee1);

            let tx = await I_VestingEscrowWallet.individualVestingDetails(employee1, currentScheduleCount.sub(1));
            let totalAllocation = tx[1].toNumber();

            assert.equal(totalAllocation, web3.utils.toWei('10', 'ether'), "Schedule did not get stored");
        });
    });
      // context("Cancel Vesting Scheduel", async() => {
      //   it("Should fail to cancel a vesting schedule because the caller is not the owner", async() => {
      //   });
      //   it("Should fail to cancel a vesting schedule because it does not exist", async() => {
      //   });
      //   it("Should fail to cancel a vesting schedule because the contract does not have the required number of tokens to send to the employee", async() => {
      //   });
      //   it("Should fail to cancel a vesting schedule because the contract does not have the required number of tokens to send to the treasury", async() => {
      //   });
      //   it("Cancel a vesting schedule", async() => {
      //   });
      //   it("Delete the individualVestingDetails from storage", async() => {
      //   });
      //   it("Send vested, unclaimed tokens to the employee", async() => {
      //   });
      //   it("Send unvested tokens to the treasury if the issuer wants to reclaim them", async() => {
      //   });
      //   it("Keep tokens in the contract and update numExcessTokens if the issuer sets _isReclaiming false", async() => {
      //   });
      // })
      // context("Collect Vested Tokens", async() => {
      //   it("Should fail to collect because a vesting schedule does not exist", async() => {
      //   });
      //   it("Should fail to collect because there are no remaining tokens to claim", async() => {
      //   });
      //   it("Should fail to collect because the contract does not have the required number of tokens to send to the employee", async() => {
      //   });
      //   it("Send vested tokens to the employee", async() => {
      //   });
      //   it("Update the numClaimedVestedTokens for that employee's specific vesting schedule", async() => {
      //   });
      //   it("Update the numUnclaimedVestedTokens for that employee's specific vesting schedule", async() => {
      //   });
      //   it("Send vested, unclaimed tokens to the employee", async() => {
      //   });
      // })
      // context("Push Vested Tokens", async() => {
      //   it("Should fail to push because a vesting schedule does not exist", async() => {
      //   });
      //   it("Should fail to push because there are no remaining tokens to claim", async() => {
      //   });
      //   it("Should fail to push because the contract does not have the required number of tokens to send to the employee", async() => {
      //   });
      //   it("Send vested tokens to the employee", async() => {
      //   });
      //   it("Update the numClaimedVestedTokens for that employee's specific vesting schedule", async() => {
      //   });
      //   it("Update the numUnclaimedVestedTokens for that employee's specific vesting schedule", async() => {
      //   });
      //   it("Send vested, unclaimed tokens to the employee", async() => {
      //   });
      })
});
