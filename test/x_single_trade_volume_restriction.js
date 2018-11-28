import latestTime from './helpers/latestTime';
import { duration, promisifyLogWatch, latestBlock } from './helpers/utils';
import { takeSnapshot, increaseTime, revertToSnapshot } from './helpers/time';
import { encodeModuleCall } from './helpers/encodeCall';
import {deploySingleTradeVolumeRMAndVerified, setUpPolymathNetwork } from "./helpers/createInstances";
import { catchRevert } from "./helpers/exceptions";

const SecurityToken = artifacts.require('./SecurityToken.sol');
const GeneralPermissionManagerFactory = artifacts.require('./GeneralPermissionManagerFactory.sol');
const GeneralTransferManager = artifacts.require('./GeneralTransferManager');
const SingleTradeVolumeRestrictionManager = artifacts.require('./SingleTradeVolumeRestrictionTM');
const CountTransferManagerFactory = artifacts.require('./CountTransferManagerFactory.sol');
const GeneralPermissionManager = artifacts.require('./GeneralPermissionManager');

const Web3 = require('web3');
const BigNumber = require('bignumber.js');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")) // Hardcoded development port

contract('SingleTradeVolumeRestrictionManager', accounts => {



  // Accounts Variable declaration
  let account_polymath;
  let account_issuer;
  let token_owner;
  let account_investor1;
  let account_investor2;
  let account_investor3;
  let account_investor4;
  let account_investor5;
  let zero_address = '0x0000000000000000000000000000000000000000';

  // investor Details
  let fromTime = latestTime();
  let toTime = latestTime();
  let expiryTime = toTime + duration.days(15);

  let message = "Transaction Should Fail!";

  // Contract Instance Declaration
  let I_SecurityTokenRegistryProxy
  let I_GeneralTransferManagerFactory;
  let I_GeneralPermissionManager;
  let I_GeneralTransferManager;
  let I_SingleTradeVolumeRestrictionManagerFactory;
  let I_SingleTradeVolumeRestrictionManager;
  let P_SingleTradeVolumeRestrictionManagerFactory;
  let P_SingleTradeVolumeRestrictionManager;
  let I_SingleTradeVolumeRestrictionPercentageManager;
  let I_ModuleRegistry;
  let I_MRProxied;
  let I_ModuleRegistryProxy;
  let I_FeatureRegistry;
  let I_SecurityTokenRegistry;
  let I_STRProxied;
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
  const STVRParameters = ["bool", "uint256", "bool"];

  // Module key
  const delegateManagerKey = 1;
  const transferManagerKey = 2;
  const stoKey = 3;

  // Initial fee for ticker registry and security token registry
  const initRegFee = web3.utils.toWei("250");

  before(async () => {
    // Accounts setup
    account_polymath = accounts[0];
    account_issuer = accounts[1];

    token_owner = account_issuer;

    account_investor1 = accounts[6];
    account_investor2 = accounts[7];
    account_investor3 = accounts[8];
    account_investor4 = accounts[9];
    account_investor5 = accounts[5];

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

    // STEP 4: Deploy the SingleTradeVolumeRestrictionManagerFactory
    [I_SingleTradeVolumeRestrictionManagerFactory] = await deploySingleTradeVolumeRMAndVerified(account_polymath, I_MRProxied, I_PolyToken.address, 0);
    [P_SingleTradeVolumeRestrictionManagerFactory] = await deploySingleTradeVolumeRMAndVerified(account_polymath, I_MRProxied, I_PolyToken.address, web3.utils.toWei("500"));

  });

  describe("Generate the SecurityToken", async () => {
    it("Should register the ticker before the generation of the security token", async () => {
      await I_PolyToken.approve(I_STRProxied.address, initRegFee, {
        from: token_owner
      });
      let tx = await I_STRProxied.registerTicker(token_owner, symbol, contact, {
        from: token_owner
      });
      assert.equal(tx.logs[0].args._owner, token_owner);
      assert.equal(tx.logs[0].args._ticker, symbol.toUpperCase());
    });

    it("Should generate the new security token with the same symbol as registered above", async () => {
      await I_PolyToken.approve(I_STRProxied.address, initRegFee, {
        from: token_owner
      });
      let _blockNo = latestBlock();
      let tx = await I_STRProxied.generateSecurityToken(name, symbol, tokenDetails, false, {
        from: token_owner
      });

      // Verify the successful generation of the security token
      assert.equal(tx.logs[1].args._ticker, symbol.toUpperCase(), "SecurityToken doesn't get deployed");

      I_SecurityToken = SecurityToken.at(tx.logs[1].args._securityTokenAddress);

      const log = await promisifyLogWatch(I_SecurityToken.ModuleAdded({
        from: _blockNo
      }), 1);

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
  });
  //
  describe("Buy tokens using whitelist & manual approvals", async () => {

    it("Should Buy the tokens", async () => {
      // Add the Investor in to the whitelist

      let tx = await I_GeneralTransferManager.modifyWhitelist(
        account_investor1,
        latestTime(),
        latestTime(),
        latestTime() + duration.days(10),
        true, {
          from: account_issuer
        });

      assert.equal(tx.logs[0].args._investor.toLowerCase(), account_investor1.toLowerCase(), "Failed in adding the investor in whitelist");

      // Jump time
      await increaseTime(5000);

      // Mint some tokens
      await I_SecurityToken.mint(account_investor1, web3.utils.toWei('100', 'ether'), {
        from: token_owner
      });

      assert.equal(
        (await I_SecurityToken.balanceOf(account_investor1)).toNumber(),
        web3.utils.toWei('100', 'ether')
      );
    });

    it("Should Buy some more tokens", async () => {
      // Add the Investor in to the whitelist

      let tx = await I_GeneralTransferManager.modifyWhitelist(
        account_investor2,
        latestTime(),
        latestTime(),
        latestTime() + duration.days(10),
        true, {
          from: account_issuer
        });

      assert.equal(tx.logs[0].args._investor.toLowerCase(), account_investor2.toLowerCase(), "Failed in adding the investor in whitelist");

      // Mint some tokens
      await I_SecurityToken.mint(account_investor2, web3.utils.toWei('1', 'ether'), {
        from: token_owner
      });

      assert.equal(
        (await I_SecurityToken.balanceOf(account_investor2)).toNumber(),
        web3.utils.toWei('1', 'ether')
      );
    });
    //
    it("Fails to attach the SingleTradeVolumeRestrictionManager with the security token due to fees not paid", async () => {
      let managerArgs = encodeModuleCall(STVRParameters, [true, 90, false]);

      await I_PolyToken.getTokens(web3.utils.toWei("500", "ether"), token_owner);
      await catchRevert(
          I_SecurityToken.addModule(P_SingleTradeVolumeRestrictionManagerFactory.address, managerArgs, web3.utils.toWei("500", "ether"), 0, { from: token_owner})
      );
    });

    it("Should successfully attach the Paid SingleTradeVolumeRestrictionManager with the security token", async () => {
      let managerArgs = encodeModuleCall(STVRParameters, [false, 90, false]);
      await I_PolyToken.transfer(I_SecurityToken.address, web3.utils.toWei("500", "ether"), { from: token_owner });

      let tx = await I_SecurityToken.addModule(P_SingleTradeVolumeRestrictionManagerFactory.address, managerArgs, web3.utils.toWei("500", "ether"), 0, {
        from: token_owner
      });

      assert.equal(tx.logs[3].args._types[0].toNumber(), transferManagerKey, "SingleTradeVolumeRestrictionManager did not get deployed");
      assert.equal(
        web3.utils.toAscii(tx.logs[3].args._name)
        .replace(/\u0000/g, ''),
        "SingleTradeVolumeRestrictionTM",
        "SingleTradeVolumeRestrictionManagerFactory module was not added"
      );
      P_SingleTradeVolumeRestrictionManager = SingleTradeVolumeRestrictionManager.at(tx.logs[3].args._module);
    });

    it("Should successfully attach the SingleTradeVolumeRestrictionManager with the security token", async () => {
      let managerArgs = encodeModuleCall(STVRParameters, [false, (7 * Math.pow(10, 16)).toString(), false])
      const tx = await I_SecurityToken.addModule(I_SingleTradeVolumeRestrictionManagerFactory.address, managerArgs, 0, 0, {
        from: token_owner
      });
      assert.equal(tx.logs[2].args._types[0].toNumber(), transferManagerKey, "TransferManager doesn't get deployed");
      assert.equal(
        web3.utils.toAscii(tx.logs[2].args._name)
        .replace(/\u0000/g, ''),
        "SingleTradeVolumeRestrictionTM",
        "SingleTradeVolumeRestriction module was not added"
      );
      I_SingleTradeVolumeRestrictionManager = SingleTradeVolumeRestrictionManager.at(tx.logs[2].args._module);
    });

    it("Should successfully attach the SingleTradeVolumeRestrictionManager (Percentage) with the security token", async () => {
      let managerArgs = encodeModuleCall(STVRParameters, [true, 90, false]);
      const tx = await I_SecurityToken.addModule(I_SingleTradeVolumeRestrictionManagerFactory.address, managerArgs, 0, 0, {
        from: token_owner
      });
      assert.equal(tx.logs[2].args._types[0].toNumber(), transferManagerKey, "PercentageTransferManager doesn't get deployed");
      assert.equal(
        web3.utils.toAscii(tx.logs[2].args._name)
        .replace(/\u0000/g, ''),
        "SingleTradeVolumeRestrictionTM",
        "SingleTradeVolumeRestriction module was not added"
      );
      I_SingleTradeVolumeRestrictionPercentageManager = SingleTradeVolumeRestrictionManager.at(tx.logs[2].args._module);
    });

    it('should return get permissions', async () => {
      let permissions = await I_SingleTradeVolumeRestrictionPercentageManager.getPermissions();
      assert.equal(permissions.length, 1, "Invalid Permissions");
      assert.equal(
        web3.utils.toAscii(permissions[0]).replace(/\u0000/g, ''),
        "ADMIN",
        'Wrong permissions'
      );
    });

    it("Should allow the primary issuance", async() => {
      let snapId = await takeSnapshot();
      await I_SingleTradeVolumeRestrictionManager.setAllowPrimaryIssuance(true, {from: token_owner});
      await catchRevert(
        I_SingleTradeVolumeRestrictionManager.setAllowPrimaryIssuance(true, {from: token_owner})
      )
      await revertToSnapshot(snapId);
    })

    it("add exempt wallet -- Not authorised ", async () => {
      await catchRevert (
        I_SingleTradeVolumeRestrictionManager.addExemptWallet(accounts[5])
      );

      await catchRevert(
        I_SingleTradeVolumeRestrictionManager.addExemptWallet(zero_address, { from: token_owner })
      );

      let tx = await I_SingleTradeVolumeRestrictionManager.addExemptWallet(accounts[5], {
        from: token_owner
      });
      assert.equal(tx.logs[0].args._wallet, accounts[5], "Wrong wallet added as exempt");
    });

    it("Should remove an exempt wallet", async () => {
      await catchRevert (
        I_SingleTradeVolumeRestrictionManager.removeExemptWallet(accounts[5])
      );
      // 0 address are not allowed to add
      await catchRevert (
        I_SingleTradeVolumeRestrictionManager.removeExemptWallet(zero_address, { from: token_owner })
      );

      let tx = await I_SingleTradeVolumeRestrictionManager.removeExemptWallet(accounts[5], { from: token_owner });
      assert.equal(tx.logs[0].args._wallet, accounts[5], "Wrong wallet removed from exempt");
    });

    it('should set transfer limit for a wallet', async () => {
      await catchRevert (
        I_SingleTradeVolumeRestrictionManager.setTransferLimitInTokens(accounts[4], 100)
      );

      // Transfer limits can't be set to 0
      await catchRevert (
        I_SingleTradeVolumeRestrictionManager.setTransferLimitInTokens(accounts[4], 0, { from: token_owner })
      );

      // Transfer limit cannot be set in percentage
      await catchRevert(
        I_SingleTradeVolumeRestrictionManager.setTransferLimitInPercentage(accounts[4], 10, { from: token_owner })
      );

      let tx = await I_SingleTradeVolumeRestrictionManager.setTransferLimitInTokens(accounts[4], 100, {
        from: token_owner
      });
      assert.equal(tx.logs[0].args._wallet, accounts[4]);
      assert.equal(tx.logs[0].args._amount, 100);

      await catchRevert(
        I_SingleTradeVolumeRestrictionPercentageManager.setTransferLimitInPercentage(accounts[4], 0, { from: token_owner })
      );
     // Transfer limit can not be set to more 0
     await catchRevert (
        I_SingleTradeVolumeRestrictionPercentageManager.setTransferLimitInPercentage(accounts[4], 101 * 10 ** 16, { from: token_owner })
      );
     // Transfer limit in tokens can not be set for a  manager that has transfer limit set as percentage
      await catchRevert (
        I_SingleTradeVolumeRestrictionPercentageManager.setTransferLimitInTokens(accounts[4], 1, { from: token_owner })
      );

      tx = await I_SingleTradeVolumeRestrictionPercentageManager.setTransferLimitInPercentage(accounts[4], 50, { from: token_owner });
      assert.equal(tx.logs[0].args._wallet, accounts[4], "Wrong wallet added to transfer limits");
      assert.equal(tx.logs[0].args._percentage, 50, "Wrong percentage set");
    });

    it('should remove transfer limit for wallet', async () => {
      // Non Admins cannot set/remove transfer limits
      await catchRevert (
        I_SingleTradeVolumeRestrictionManager.removeTransferLimitInTokens(accounts[4])
      );

      // Non Admins cannot set/remove transfer limits
      await catchRevert (
         I_SingleTradeVolumeRestrictionManager.removeTransferLimitInTokens(accounts[0], { from: token_owner })
      );

      let tx = await I_SingleTradeVolumeRestrictionManager.removeTransferLimitInTokens(accounts[4], {
        from: token_owner
      });
      assert.equal(tx.logs[0].args._wallet, accounts[4], "Wrong wallet removed");
    });

    it("Should pause the tranfers at Manager level", async () => {
      let tx = await I_SingleTradeVolumeRestrictionManager.pause({
        from: token_owner
      });
    });

    it('Should be able to set a global transfer limit', async () => {
      // only owner is allowed
      await catchRevert(
        I_SingleTradeVolumeRestrictionManager.changeGlobalLimitInTokens(100 * 10 ** 18)
      );
      //Cannot change global limit in percentage when set to tokens
      await catchRevert(
        I_SingleTradeVolumeRestrictionManager.changeGlobalLimitInPercentage(100 * 10 ** 18, { from: token_owner })
      );
      // Global limit cannot be set to 0
      await catchRevert(
        I_SingleTradeVolumeRestrictionManager.changeGlobalLimitInTokens(0, { from: token_owner })
      );

      let tx = await I_SingleTradeVolumeRestrictionManager.changeGlobalLimitInTokens(10, {
        from: token_owner
      });
      assert.equal(tx.logs[0].args._amount, 10, "Global Limit not set");

      //Global limit can be set by non-admins
      await catchRevert(
        I_SingleTradeVolumeRestrictionPercentageManager.changeGlobalLimitInTokens(89)
      );
      // cannot change global limit in tokens if transfer limit is set to percentage
      await catchRevert(
        I_SingleTradeVolumeRestrictionPercentageManager.changeGlobalLimitInTokens(89, { from: token_owner })
      );
      // Cannot set global limit in tokens to 0
      await catchRevert(
        I_SingleTradeVolumeRestrictionPercentageManager.changeGlobalLimitInTokens(0, { from: token_owner })
      );

      tx = await I_SingleTradeVolumeRestrictionPercentageManager.changeGlobalLimitInPercentage(40, { from: token_owner });
      assert.equal(tx.logs[0].args._percentage, 40, "Global Limit not set");
      // Global limit cannot be set to more than 100
      await catchRevert(
        I_SingleTradeVolumeRestrictionPercentageManager.changeGlobalLimitInPercentage(101 * 10 ** 16, { from: token_owner })
      );
      // Global limit in percentage cannot be set when limit is in tokens
      await catchRevert(
         I_SingleTradeVolumeRestrictionManager.changeGlobalLimitInPercentage(10, { from: token_owner })
      );
      // Global limit in tokens cannot be set when limit is in percentage
      await catchRevert(
        I_SingleTradeVolumeRestrictionPercentageManager.changeGlobalLimitInTokens(10, { from: token_owner })
      );
    });

    it("Should perform batch updates", async () => {
      let wallets = [accounts[0], accounts[1], accounts[2]];
      let tokenLimits = [1, 2, 3];
      let percentageLimits = [5, 6, 7];

      // Exempt wallet multi cannot be empty wallet
      await catchRevert(
        P_SingleTradeVolumeRestrictionManager.addExemptWalletMulti([], { from: token_owner })
      );

      // add exempt wallet multi
      let tx = await P_SingleTradeVolumeRestrictionManager.addExemptWalletMulti(wallets, {
        from: token_owner
      });
      let logs = tx.logs.filter(log => log.event === 'ExemptWalletAdded');
      assert.equal(logs.length, wallets.length, "Batch Exempt wallets not added");
      for (let i = 0; i < logs.length; i++) {
        assert.equal(logs[i].args._wallet, wallets[i], "Wallet not added as exempt wallet");
      }

      // Exempt wallet multi cannot be empty wallet
      await catchRevert(
        P_SingleTradeVolumeRestrictionManager.removeExemptWalletMulti([], { from: token_owner })
      );

      // remove exempt wallet multi
      tx = await P_SingleTradeVolumeRestrictionManager.removeExemptWalletMulti(wallets, {
        from: token_owner
      })
      logs = tx.logs.filter(log => log.event === 'ExemptWalletRemoved');
      assert.equal(logs.length, wallets.length, "Batch Exempt wallets not removed");

      for (let i = 0; i < logs.length; i++) {
        assert.equal(logs[i].args._wallet, wallets[i], "Wallet not added as exempt wallet");
      }
      // wallets cannot be empty
      await catchRevert(
         P_SingleTradeVolumeRestrictionManager.setTransferLimitInTokensMulti([], tokenLimits, { from: token_owner })
      );
      // wallet array length dont match
      await catchRevert(
        P_SingleTradeVolumeRestrictionManager.setTransferLimitInTokensMulti([accounts[0]], tokenLimits, { from: token_owner })
      );

      tx = await P_SingleTradeVolumeRestrictionManager.setTransferLimitInTokensMulti(wallets, tokenLimits, {
        from: token_owner
      });
      logs = tx.logs.filter(log => log.event == 'TransferLimitInTokensSet');
      assert.equal(wallets.length, logs.length, "Transfer limit not set");
      for (let i = 0; i < wallets.length; i++) {
        assert.equal(logs[i].args._wallet, wallets[i], "transfer limit not set for wallet");
        assert.equal(logs[i].args._amount.toNumber(), tokenLimits[i]);
      }
      // Wallets cannot be empty
      await catchRevert(
         P_SingleTradeVolumeRestrictionManager.removeTransferLimitInTokensMulti([], { from: token_owner })
      );
      tx = await P_SingleTradeVolumeRestrictionManager.removeTransferLimitInTokensMulti(wallets, {
        from: token_owner
      });
      logs = tx.logs.filter(log => log.event === 'TransferLimitInTokensRemoved');
      assert.equal(logs.length, wallets.length, "Transfer limit not removed");
      for (let i = 0; i < wallets.length; i++) {
        assert.equal(logs[i].args._wallet, wallets[i], "transfer limit not removed for wallet");
      }
      // wallets cannot be empty
      await catchRevert(
        I_SingleTradeVolumeRestrictionPercentageManager.setTransferLimitInPercentageMulti([], percentageLimits, { from: token_owner })
      );
      // wallets and amounts dont match be empty
      await catchRevert(
        I_SingleTradeVolumeRestrictionPercentageManager.setTransferLimitInPercentageMulti(wallets, [], { from: token_owner })
      );
      tx = await I_SingleTradeVolumeRestrictionPercentageManager.setTransferLimitInPercentageMulti(wallets, percentageLimits, {
        from: token_owner
      });
      logs = tx.logs.filter(log => log.event == 'TransferLimitInPercentageSet');
      assert.equal(logs.length, wallets.length, "transfer limits not set for wallets");

      for (let i = 0; i < wallets.length; i++) {
        assert.equal(logs[i].args._wallet, wallets[i], "Transfer limit not set for wallet");
        assert.equal(logs[i].args._percentage.toNumber(), percentageLimits[i]);
      }
      //  Wallets cannot be empty
      await catchRevert(
        I_SingleTradeVolumeRestrictionPercentageManager.removeTransferLimitInPercentageMulti([], { from: token_owner })
      );

      tx = await I_SingleTradeVolumeRestrictionPercentageManager.removeTransferLimitInPercentageMulti(wallets, {
        from: token_owner
      });
      logs = tx.logs.filter(log => log.event == 'TransferLimitInPercentageRemoved');
      assert.equal(logs.length, wallets.length, "transfer limits not set for wallets");

      for (let i = 0; i < wallets.length; i++) {
        assert.equal(logs[i].args._wallet, wallets[i], "Transfer limit not set for wallet");
      }
      // Wallet should not be removed
      await catchRevert(
        I_SingleTradeVolumeRestrictionPercentageManager.removeTransferLimitInPercentage(wallets[0], { from: token_owner })
      );
    })

    it('should be able to transfer tokens SingleTradeVolumeRestriction', async () => {
      await I_SingleTradeVolumeRestrictionManager.unpause({
        from: token_owner
      })
      await I_SingleTradeVolumeRestrictionPercentageManager.pause({
        from: token_owner
      })
      await P_SingleTradeVolumeRestrictionManager.pause({
        from: token_owner
      });

      await I_GeneralTransferManager.modifyWhitelist(
        account_investor3,
        latestTime(),
        latestTime(),
        latestTime() + duration.days(10),
        true, {
          from: account_issuer
        }
      );

      await I_GeneralTransferManager.modifyWhitelist(
        account_investor4,
        latestTime(),
        latestTime(),
        latestTime() + duration.days(10),
        true, {
          from: account_issuer
        }
      );

      await I_GeneralTransferManager.modifyWhitelist(
        account_investor5,
        latestTime(),
        latestTime(),
        latestTime() + duration.days(10),
        true, {
          from: account_issuer
        }
      );


      //setting a max of 5 tokens
      await I_SingleTradeVolumeRestrictionManager.changeGlobalLimitInTokens(web3.utils.toWei('5', 'ether'), {
        from: token_owner
      })
      // Transfer should have not happened
      await catchRevert(
         I_SecurityToken.transfer(account_investor3, web3.utils.toWei('6', 'ether'), { from: account_investor1 })
      );

      await I_SecurityToken.transfer(account_investor3, web3.utils.toWei('4', 'ether'), {
        from: account_investor1
      });
      assert.equal((await I_SecurityToken.balanceOf(account_investor3)).toNumber(), web3.utils.toWei('4', 'ether'));

      // exempt wallet
      await I_SingleTradeVolumeRestrictionManager.addExemptWallet(account_investor1, {
        from: token_owner
      });
      await I_SecurityToken.transfer(account_investor5, web3.utils.toWei('7', 'ether'), {
        from: account_investor1
      });
      assert.equal((await I_SecurityToken.balanceOf(account_investor5)).toNumber(), web3.utils.toWei('7', 'ether'));

      //special limits wallet
      await I_SingleTradeVolumeRestrictionManager.setTransferLimitInTokens(account_investor5, web3.utils.toWei('5', 'ether'), {
        from: token_owner
      });

      // Transfer should have not happened
      await catchRevert(
        I_SecurityToken.transfer(account_investor4, web3.utils.toWei('7', 'ether'), { from: account_investor5 })
      );

      await I_SecurityToken.transfer(account_investor4, web3.utils.toWei('4', 'ether'), {
        from: account_investor5
      })
      assert.equal((await I_SecurityToken.balanceOf(account_investor4)).toNumber(), web3.utils.toWei('4', 'ether'))
    })

    it('should be able to transfer tokens (percentage transfer limit)', async () => {
      await I_SingleTradeVolumeRestrictionManager.pause({
        from: token_owner
      });
      let balance = (await I_SecurityToken.balanceOf(account_investor2)).toNumber();
      await I_SecurityToken.transfer(account_investor1, balance, {
        from: account_investor2
      });


      balance = (await I_SecurityToken.balanceOf(account_investor3)).toNumber();

      await I_SecurityToken.transfer(account_investor1, balance, {
        from: account_investor3
      });


      balance = (await I_SecurityToken.balanceOf(account_investor4)).toNumber();
      await I_SecurityToken.transfer(account_investor1, balance, {
        from: account_investor4
      });

      balance = (await I_SecurityToken.balanceOf(account_investor5)).toNumber();
      await I_SecurityToken.transfer(account_investor1, balance, {
        from: account_investor5
      });

      await I_SingleTradeVolumeRestrictionPercentageManager.unpause({
        from: token_owner
      });
      // //
      await I_SingleTradeVolumeRestrictionPercentageManager.changeGlobalLimitInPercentage(49 * 10 ** 16, {
        from: token_owner
      });

      // Transfer above limit happened
      await catchRevert(
        I_SecurityToken.transfer(account_investor2, web3.utils.toWei('90', 'ether'), { from: account_investor1 })
      );

      await I_SecurityToken.transfer(account_investor2, web3.utils.toWei('20', 'ether'), {
        from: account_investor1
      });
      assert.equal((await I_SecurityToken.balanceOf(account_investor2)).toNumber(), web3.utils.toWei('20', 'ether'))

      await I_SingleTradeVolumeRestrictionPercentageManager.setTransferLimitInPercentage(account_investor1, 5 * 10 ** 16, {
        from: token_owner
      });
      // transfer happened above limit
      await catchRevert(
        I_SecurityToken.transfer(account_investor2, web3.utils.toWei('35', 'ether'), { from: account_investor1 })
      );

      await I_SecurityToken.transfer(account_investor3, web3.utils.toWei('1', 'ether'), {
        from: account_investor1
      });
      assert.equal((await I_SecurityToken.balanceOf(account_investor3)).toNumber(), web3.utils.toWei('1', 'ether'));
    });

    it('should change transfer limits to tokens', async () => {
      // Should not change to percentage again
      await catchRevert(
        I_SingleTradeVolumeRestrictionPercentageManager.changeTransferLimitToPercentage(1, { from: token_owner })
      );


      let tx = await I_SingleTradeVolumeRestrictionPercentageManager.changeTransferLimitToTokens(1, {
        from: token_owner
      });
      assert.equal(await I_SingleTradeVolumeRestrictionPercentageManager.isTransferLimitInPercentage(), false, "Error Changing");
      assert.equal(tx.logs[0].args._amount.toNumber(), 1, "Transfer limit not changed");
    })

    it('should change transfer limits to percentage', async () => {
      // Should not change to tokens again
      await catchRevert(
        I_SingleTradeVolumeRestrictionManager.changeTransferLimitToTokens(1, { from: token_owner })
      );

      let tx = await I_SingleTradeVolumeRestrictionPercentageManager.changeTransferLimitToPercentage(1, {
        from: token_owner
      });
      assert.ok(await I_SingleTradeVolumeRestrictionPercentageManager.isTransferLimitInPercentage(), "Error Changing");
      assert.equal(tx.logs[0].args._percentage.toNumber(), 1, "Transfer limit not changed");
    })



  });

  describe("SingleTradeVolumeRestrictionManager Factory test cases", async () => {

    it("Should get the exact details of the factory", async () => {
      assert.equal(await I_SingleTradeVolumeRestrictionManagerFactory.getSetupCost.call(), 0);
      assert.equal((await I_SingleTradeVolumeRestrictionManagerFactory.getTypes.call())[0], 2);
      let name = web3.utils.toUtf8(await I_SingleTradeVolumeRestrictionManagerFactory.getName.call());
      assert.equal(name, "SingleTradeVolumeRestrictionTM", "Wrong Module added");
      let desc = await I_SingleTradeVolumeRestrictionManagerFactory.description.call();
      assert.equal(desc, "Imposes volume restriction on a single trade", "Wrong Module added");
      let title = await I_SingleTradeVolumeRestrictionManagerFactory.title.call();
      assert.equal(title, "Single Trade Volume Restriction Manager", "Wrong Module added");
      let inst = await I_SingleTradeVolumeRestrictionManagerFactory.getInstructions.call();
      assert.equal(inst, "Allows an issuer to impose volume restriction on a single trade. Init function takes two parameters. First parameter is a bool indicating if restriction is in percentage. The second parameter is the value in percentage or amount of tokens", "Wrong Module added");
      let version = await I_SingleTradeVolumeRestrictionManagerFactory.version.call();
      assert.equal(version, "1.0.0", "Version not correct");
    });

    it("Should get the tags of the factory", async () => {
      let tags = await I_SingleTradeVolumeRestrictionManagerFactory.getTags.call();
      assert.equal(web3.utils.toUtf8(tags[0]), "Single Trade");
      assert.equal(web3.utils.toUtf8(tags[1]), "Transfer");
      assert.equal(web3.utils.toUtf8(tags[2]), "Volume");
    });


  });
});
