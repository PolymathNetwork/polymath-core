const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port
const BigNumber = require('bignumber.js');

import latestTime from './helpers/latestTime';
import { duration } from './helpers/utils';

const PolymathRegistry = artifacts.require('./PolymathRegistry.sol')
const USDTieredSTOFactory = artifacts.require('./USDTieredSTOFactory.sol');
const CappedSTOFactory = artifacts.require('./CappedSTOFactory.sol');
const USDTieredSTO = artifacts.require('./USDTieredSTO.sol');
const CappedSTO = artifacts.require('./CappedSTO.sol');
const PolyOracle = artifacts.require('./PolyOracle.sol');
const ETHOracle = artifacts.require('./MakerDAOOracle.sol');
const ModuleRegistry = artifacts.require('./ModuleRegistry.sol');
const SecurityToken = artifacts.require('./SecurityToken.sol');
const SecurityTokenRegistry = artifacts.require('./SecurityTokenRegistry.sol');
const TickerRegistry = artifacts.require('./TickerRegistry.sol');
const STVersion = artifacts.require('./STVersionProxy001.sol');
const GeneralPermissionManagerFactory = artifacts.require('./GeneralPermissionManagerFactory.sol');
const GeneralTransferManagerFactory = artifacts.require('./GeneralTransferManagerFactory.sol');
const PolyTokenFaucet = artifacts.require('./PolyTokenFaucet.sol');
const ManualApprovalTransferManagerFactory = artifacts.require('./ManualApprovalTransferManagerFactory.sol');

contract('Upgrade from v1.3.0 to v1.4.0', accounts => {
    // Accounts Variable declaration
    let POLYMATH;
    let ISSUER1;
    let ISSUER2;
    let ISSUER3;
    let MULTISIG;

    //const GAS_PRICE = 10000000000; // 10 GWEI

    let tx;

    // Initial fee for ticker registry and security token registry
    const REGFEE = 250 * Math.pow(10, 18);;
    const STOSetupCost = 0;

    // Module key
    const STOKEY = 3;
    const TMKEY = 2;

    // SecurityToken 1 Details
    const symbol1 = "TOK1";
    const name1 = "TOK1 Token";
    const tokenDetails1 = "This is equity type of issuance";
    const swarmHash1 = "dagwrgwgvwergwrvwrg";

    //SecurityToken 2 Details
    const symbol2 = "TOK2";
    const name2 = "TOK2 Token";
    const tokenDetails2 = "This is equity type of issuance";
    const swarmHash2 = "dagwrgwgvwergwrvwrg";

    /*
    //SecurityToken 3 Details
    const symbol3 = "TOK3";
    const name3 = "TOK3 Token";
    const tokenDetails3 = "This is equity type of issuance";
    const swarmHash3 = "dagwrgwgvwergwrvwrg";
    */

    // Contract Instance Declaration
    let I_PolymathRegistry;
    let I_PolyToken;
    let I_ModuleRegistry;
    let I_GeneralTransferManagerFactory;
    let I_GeneralPermissionManagerFactory;
    let I_TickerRegistry;
    let I_STVersion;

    let I_SecurityTokenRegistry;
    //let I_UpgradedSecurityTokenRegistry

    let I_SecurityToken1;
    let I_SecurityToken2;
    //let I_SecurityToken3;

    let I_USDTieredSTOFactory;
    let I_USDOracle;
    let I_POLYOracle;
    let I_USDTieredSTO;

    let I_CappedSTOFactory;
    let I_UpgradedCappedSTOFactory;
    let I_CappedSTO;

    let I_ManualApprovalTransferManagerFactory;

    // Prepare polymath network status
    before(async() => {
        // Accounts setup
        POLYMATH = accounts[0];
        ISSUER1 = accounts[1];
        ISSUER2 = accounts[2];
        ISSUER3 = accounts[3];
        MULTISIG = accounts[4];

        // ----------- POLYMATH NETWORK Configuration ------------

        // Step 0: Deploy the PolymathRegistry
        I_PolymathRegistry = await PolymathRegistry.new({from: POLYMATH});
        assert.notEqual(
            I_PolymathRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "PolymathRegistry contract was not deployed"
        );

        // Step 1: Deploy the token Faucet
        I_PolyToken = await PolyTokenFaucet.new({from: POLYMATH});
        assert.notEqual(
            I_PolyToken.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "PolyToken contract was not deployed"
        );
        tx = await I_PolymathRegistry.changeAddress("PolyToken", I_PolyToken.address, {from: POLYMATH})
        assert.equal(tx.logs[0].args._nameKey, "PolyToken");
        assert.equal(tx.logs[0].args._newAddress, I_PolyToken.address);

        // STEP 2: Deploy the ModuleRegistry
        I_ModuleRegistry = await ModuleRegistry.new(I_PolymathRegistry.address, {from:POLYMATH});
        assert.notEqual(
            I_ModuleRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "ModuleRegistry contract was not deployed"
        );
        tx = await I_PolymathRegistry.changeAddress("ModuleRegistry", I_ModuleRegistry.address, {from: POLYMATH});
        assert.equal(tx.logs[0].args._nameKey, "ModuleRegistry");
        assert.equal(tx.logs[0].args._newAddress, I_ModuleRegistry.address);

        // STEP 3: Deploy the GeneralTransferManagerFactory
        I_GeneralTransferManagerFactory = await GeneralTransferManagerFactory.new(I_PolyToken.address, 0, 0, 0, { from: POLYMATH });
        assert.notEqual(
            I_GeneralTransferManagerFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "GeneralTransferManagerFactory contract was not deployed"
        );

        // STEP 4: Deploy the GeneralDelegateManagerFactory
        I_GeneralPermissionManagerFactory = await GeneralPermissionManagerFactory.new(I_PolyToken.address, 0, 0, 0, { from: POLYMATH });
        assert.notEqual(
            I_GeneralPermissionManagerFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "GeneralDelegateManagerFactory contract was not deployed"
        );

        // STEP 5: Deploy the CappedSTOFactory
        I_CappedSTOFactory = await CappedSTOFactory.new(I_PolyToken.address, STOSetupCost, 0, 0, { from: POLYMATH });
        assert.notEqual(
            I_CappedSTOFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "CappedSTOFactory contract was not deployed"
        );

        // STEP 6: Register the Modules with the ModuleRegistry contract
        // (A) :  Register the GeneralTransferManagerFactory
        await I_ModuleRegistry.registerModule(I_GeneralTransferManagerFactory.address, { from: POLYMATH });
        await I_ModuleRegistry.verifyModule(I_GeneralTransferManagerFactory.address, true, { from: POLYMATH });

        // (B) :  Register the GeneralDelegateManagerFactory
        await I_ModuleRegistry.registerModule(I_GeneralPermissionManagerFactory.address, { from: POLYMATH });
        await I_ModuleRegistry.verifyModule(I_GeneralPermissionManagerFactory.address, true, { from: POLYMATH });

        // (C) :  Register the CappedSTOFactory
        await I_ModuleRegistry.registerModule(I_CappedSTOFactory.address, { from: POLYMATH });
        await I_ModuleRegistry.verifyModule(I_CappedSTOFactory.address, true, { from: POLYMATH });

        // Step 7: Deploy the TickerRegistry
        I_TickerRegistry = await TickerRegistry.new(I_PolymathRegistry.address, REGFEE, { from: POLYMATH });
        assert.notEqual(
            I_TickerRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "TickerRegistry contract was not deployed",
        );
        tx = await I_PolymathRegistry.changeAddress("TickerRegistry", I_TickerRegistry.address, {from: POLYMATH});
        assert.equal(tx.logs[0].args._nameKey, "TickerRegistry");
        assert.equal(tx.logs[0].args._newAddress, I_TickerRegistry.address);

        // Step 8: Deploy the STversionProxy contract
        I_STVersion = await STVersion.new(I_GeneralTransferManagerFactory.address, {from : POLYMATH });
        assert.notEqual(
            I_STVersion.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "STVersion contract was not deployed",
        );

        // Step 9: Deploy the SecurityTokenRegistry
        I_SecurityTokenRegistry = await SecurityTokenRegistry.new(
            I_PolymathRegistry.address,
            I_STVersion.address,
            REGFEE,
            {
                from: POLYMATH
            });
        assert.notEqual(
            I_SecurityTokenRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "SecurityTokenRegistry contract was not deployed",
        );
        tx = await I_PolymathRegistry.changeAddress("SecurityTokenRegistry", I_SecurityTokenRegistry.address, {from: POLYMATH});
        assert.equal(tx.logs[0].args._nameKey, "SecurityTokenRegistry");
        assert.equal(tx.logs[0].args._newAddress, I_SecurityTokenRegistry.address);

        // Step 10: update the registries addresses from the PolymathRegistry contract
        await I_SecurityTokenRegistry.updateFromRegistry({from: POLYMATH});
        await I_ModuleRegistry.updateFromRegistry({from: POLYMATH});
        await I_TickerRegistry.updateFromRegistry({from: POLYMATH});

        // Step 11: Mint tokens to ISSUERs
        await I_PolyToken.getTokens(REGFEE * 2, ISSUER1);
        await I_PolyToken.getTokens(REGFEE * 2, ISSUER2);
        await I_PolyToken.getTokens(REGFEE * 2, ISSUER3);

        // Step 12: Register tokens
        // (A) :  TOK1
        await I_PolyToken.approve(I_TickerRegistry.address, REGFEE, { from: ISSUER1 });
        tx = await I_TickerRegistry.registerTicker(ISSUER1, symbol1, name1, swarmHash1, { from : ISSUER1 });
        assert.equal(tx.logs[0].args._owner, ISSUER1);
        assert.equal(tx.logs[0].args._symbol, symbol1);

        // (B) :  TOK2
        await I_PolyToken.approve(I_TickerRegistry.address, REGFEE, { from: ISSUER2 });
        tx = await I_TickerRegistry.registerTicker(ISSUER2, symbol2, name2, swarmHash2, { from : ISSUER2 });
        assert.equal(tx.logs[0].args._owner, ISSUER2);
        assert.equal(tx.logs[0].args._symbol, symbol2);

        /*
        // (C) :  TOK3
        await I_PolyToken.approve(I_TickerRegistry.address, REGFEE, { from: ISSUER3 });
        tx = await I_TickerRegistry.registerTicker(ISSUER3, symbol3, name3, swarmHash3, { from : ISSUER3 });
        assert.equal(tx.logs[0].args._owner, ISSUER3);
        assert.equal(tx.logs[0].args._symbol, symbol3);
        */
       
        // Step 13: Deploy tokens
        // (A) :  TOK1
        await I_PolyToken.approve(I_SecurityTokenRegistry.address, REGFEE, { from: ISSUER1});
        let tx = await I_SecurityTokenRegistry.generateSecurityToken(name1, symbol1, tokenDetails1, false, { from: ISSUER1 });
        assert.equal(tx.logs[1].args._ticker, symbol1, "SecurityToken doesn't get deployed");
        I_SecurityToken1 = SecurityToken.at(tx.logs[1].args._securityTokenAddress);

        // (B) :  TOK2
        await I_PolyToken.approve(I_SecurityTokenRegistry.address, REGFEE, { from: ISSUER2});
        tx = await I_SecurityTokenRegistry.generateSecurityToken(name2, symbol2, tokenDetails2, false, { from: ISSUER2 });
        assert.equal(tx.logs[1].args._ticker, symbol2, "SecurityToken doesn't get deployed");
        I_SecurityToken2 = SecurityToken.at(tx.logs[1].args._securityTokenAddress);

        // Printing all the contract addresses
        console.log(`
        -------------------- Polymath Network Smart Contracts: --------------------
        ModuleRegistry:                  ${I_ModuleRegistry.address}
        GeneralTransferManagerFactory:   ${I_GeneralTransferManagerFactory.address}
        GeneralPermissionManagerFactory: ${I_GeneralPermissionManagerFactory.address}
        TickerRegistry:                  ${I_TickerRegistry.address}
        STVersionProxy_001:              ${I_STVersion.address}
        SecurityTokenRegistry:           ${I_SecurityTokenRegistry.address}
        SecurityToken TOK1:              ${I_SecurityToken1.address}
        SecurityToken TOK2:              ${I_SecurityToken2.address}
        ---------------------------------------------------------------------------
        `);
    });

    /*
    describe("STR Upgrade", async() => {
        // 1 - Pause old STR
        it("Should successfully pause the contract", async() => {
            await I_SecurityTokenRegistry.pause({ from: POLYMATH });
            let status = await I_SecurityTokenRegistry.paused.call();
            assert.isOk(status, "SecurityTokenRegistry is not paused");
        });

        // 2 - Deploy new STR
        it("Should successfully deploy upgraded SecurityTokenRegistry contract", async() => {
            I_UpgradedSecurityTokenRegistry = await SecurityTokenRegistry.new(
                I_PolymathRegistry.address,
                I_STVersion.address,
                REGFEE,
                {from: POLYMATH}
            );
            assert.notEqual(
                I_SecurityTokenRegistry.address.valueOf(),
                "0x0000000000000000000000000000000000000000",
                "SecurityTokenRegistry contract was not deployed",
            );
        });

        // 3 - Pause new STR
        it("Should successfully pause the upgraded contract", async() => {
            await I_UpgradedSecurityTokenRegistry.pause({ from: POLYMATH });
            let status = await I_UpgradedSecurityTokenRegistry.paused.call();
            assert.isOk(status, "SecurityTokenRegistry is not paused");
        });

        // 4 - Update PolymathRegistry
        // 4a - ChangeAddress
        it("Should successfully change SecurityTokenRegistry address on PolymathRegistry", async() => {
            tx = await I_PolymathRegistry.changeAddress("SecurityTokenRegistry", I_UpgradedSecurityTokenRegistry.address, {from: POLYMATH});
            assert.equal(tx.logs[0].args._nameKey, "SecurityTokenRegistry");
            assert.equal(tx.logs[0].args._newAddress, I_UpgradedSecurityTokenRegistry.address);
        });
        // 4b - UpdateFromRegistry
        it("Should successfully change SecurityTokenRegistry address on PolymathRegistry", async() => {
            let strAddress;
            await I_UpgradedSecurityTokenRegistry.updateFromRegistry({from: POLYMATH});
            strAddress = await I_UpgradedSecurityTokenRegistry.securityTokenRegistry.call({from: POLYMATH});
            assert.equal(strAddress, I_UpgradedSecurityTokenRegistry.address, "SecurityTokenRegistry address was not updated");
            await I_ModuleRegistry.updateFromRegistry({from: POLYMATH});
            strAddress = await I_ModuleRegistry.securityTokenRegistry.call({from: POLYMATH});
            assert.equal(strAddress, I_UpgradedSecurityTokenRegistry.address, "SecurityTokenRegistry address was not updated");
            await I_TickerRegistry.updateFromRegistry({from: POLYMATH});
            strAddress = await I_TickerRegistry.securityTokenRegistry.call({from: POLYMATH});
            assert.equal(strAddress, I_UpgradedSecurityTokenRegistry.address, "SecurityTokenRegistry address was not updated");
        });

        // 5 Migrate data from old STR to new STR
        // 5a - Get tokens from old STR
        it("Should successfully get all tokens launched with old SecurityTokenRegistry", async() => {
            let LogNewSecurityToken = await I_SecurityTokenRegistry.LogNewSecurityToken({}, { fromBlock: 0, toBlock: 'latest'});
            let events = await new Promise(function(resolve, reject) {
                LogNewSecurityToken.get(function(error, logs) {
                    if (error)
                        reject(error);
                    else
                        resolve(logs)
                    });
            });
            assert.equal(events.length, 2, "Tokens launched were not got");
            let tok1 = events.find(function(element) {
                return element.args._securityTokenAddress == I_SecurityToken1.address;
            });
            assert.isDefined(tok1, "First token was not found");
            let tok2 = events.find(function(element) {
                return element.args._securityTokenAddress == I_SecurityToken2.address;
            });
            assert.isDefined(tok2, "Second token was not found");
        });
        // 5b - Migrate data to new STR
        it("Should successfully add custom Security Token for first token", async() => {
            let tx = await I_UpgradedSecurityTokenRegistry.addCustomSecurityToken(
                name1,
                symbol1,
                ISSUER1,
                I_SecurityToken1.address,
                tokenDetails1,
                swarmHash1,
                {from: POLYMATH}
            );
            assert.equal(tx.logs[0].args._name, name1, "First token name does not match");
            assert.equal(tx.logs[0].args._symbol, symbol1, "First token symbol does not match");
            assert.equal(tx.logs[0].args._securityToken, I_SecurityToken1.address, "First token address does not match");
        });
        it("Should successfully add custom Security Token for second token", async() => {
            let tx = await I_UpgradedSecurityTokenRegistry.addCustomSecurityToken(
                name2,
                symbol2,
                ISSUER2,
                I_SecurityToken2.address,
                tokenDetails2,
                web3.utils.asciiToHex(swarmHash2),
                {from: POLYMATH}
            );
            assert.equal(tx.logs[0].args._name, name2, "Second token name does not match");
            assert.equal(tx.logs[0].args._symbol, symbol2, "Second token symbol does not match");
            assert.equal(tx.logs[0].args._securityToken, I_SecurityToken2.address, "Second token address does not match");
        });

        // 6 Unpause both STRs
        // 6a - Unpause old STR
        it("Should successfully unpause the old SecurityTokenRegistry contract", async() => {
            await I_UpgradedSecurityTokenRegistry.unpause({ from: POLYMATH });
            let status = await I_UpgradedSecurityTokenRegistry.paused.call();
            assert.isFalse(status, "SecurityTokenRegistry is paused");
        });
        // 6b - Unpause new STR
        it("Should successfully unpause the contract", async() => {
            await I_SecurityTokenRegistry.unpause({ from: POLYMATH });
            let status = await I_SecurityTokenRegistry.paused.call();
            assert.isFalse(status, "SecurityTokenRegistry is paused");
        });
    });
    */
   
    describe("USDTieredSTOFactory deploy", async() => {
        // Step 1: Deploy Oracles
        // 1a - Deploy POLY Oracle
        it("Should successfully deploy POLY Oracle and register on PolymathRegistry", async() => {
            I_POLYOracle = await PolyOracle.new({ from: POLYMATH, value: (1 * (10**18)) });
            assert.notEqual(
                I_POLYOracle.address.valueOf(),
                "0x0000000000000000000000000000000000000000",
                "POLYOracle contract was not deployed",
            );
            tx = await I_PolymathRegistry.changeAddress("PolyUsdOracle", I_POLYOracle.address, { from: POLYMATH });
            assert.equal(tx.logs[0].args._nameKey, "PolyUsdOracle");
            assert.equal(tx.logs[0].args._newAddress, I_POLYOracle.address);
        });
        // 1b - Deploy ETH Oracle
        it("Should successfully deploy ETH Oracle and register on SecurityTokenRegistry", async() => {
            I_USDOracle = await ETHOracle.new({ from: POLYMATH });
            assert.notEqual(
                I_USDOracle.address.valueOf(),
                "0x0000000000000000000000000000000000000000",
                "USDOracle contract was not deployed",
            );
            tx = await I_PolymathRegistry.changeAddress("EthUsdOracle", I_USDOracle.address, { from: POLYMATH });
            assert.equal(tx.logs[0].args._nameKey, "EthUsdOracle");
            assert.equal(tx.logs[0].args._newAddress, I_USDOracle.address);
        });
    });

    describe("USDTieredSTOFactory deploy", async() => {
        // Step 1: Deploy USDTieredSTOFactory\
        it("Should successfully deploy USDTieredSTOFactory", async() => {
            I_USDTieredSTOFactory = await USDTieredSTOFactory.new(I_PolyToken.address, STOSetupCost, 0, 0, { from: POLYMATH });
            assert.notEqual(
                I_USDTieredSTOFactory.address.valueOf(),
                "0x0000000000000000000000000000000000000000",
                "USDTieredSTOFactory contract was not deployed"
            );
            let setupCost = await I_USDTieredSTOFactory.setupCost({ from: POLYMATH });
            assert.equal(setupCost, STOSetupCost);
        });
        // Step 2: Register and verify
        it("Should successfully register and verify USDTieredSTOFactory contract", async() => {
            let tx = await I_ModuleRegistry.registerModule(I_USDTieredSTOFactory.address, { from: POLYMATH });
            assert.equal(tx.logs[0].args._moduleFactory, I_USDTieredSTOFactory.address);
            tx = await I_ModuleRegistry.verifyModule(I_USDTieredSTOFactory.address, true, { from: POLYMATH });
            assert.equal(tx.logs[0].args._moduleFactory, I_USDTieredSTOFactory.address);
            assert.isTrue(tx.logs[0].args._verified);
        });
    });

    describe("CappedSTOFactory deploy", async() => {
        // Step 1: Deploy new CappedSTOFactory
        it("Should successfully deploy CappedSTOFactory", async() => {
            I_UpgradedCappedSTOFactory = await CappedSTOFactory.new(I_PolyToken.address, STOSetupCost, 0, 0, { from: POLYMATH });
            assert.notEqual(
                I_UpgradedCappedSTOFactory.address.valueOf(),
                "0x0000000000000000000000000000000000000000",
                "CappedSTOFactory contract was not deployed"
            );
            let setupCost = await I_UpgradedCappedSTOFactory.setupCost({ from: POLYMATH });
            assert.equal(setupCost, STOSetupCost);
        });

        // Step 2: Register and verify
        it("Should successfully register and verify new CappedSTOFactory contract", async() => {
            let tx = await I_ModuleRegistry.registerModule(I_UpgradedCappedSTOFactory.address, { from: POLYMATH });
            assert.equal(tx.logs[0].args._moduleFactory, I_UpgradedCappedSTOFactory.address);
            tx = await I_ModuleRegistry.verifyModule(I_UpgradedCappedSTOFactory.address, true, { from: POLYMATH });
            assert.equal(tx.logs[0].args._moduleFactory, I_UpgradedCappedSTOFactory.address);
            assert.isTrue(tx.logs[0].args._verified);
        });

        // Step 3: Unverify old CappedSTOFactory
        it("Should successfully unverify old CappedSTOFactory contract", async() => {
            let tx = await I_ModuleRegistry.verifyModule(I_CappedSTOFactory.address, false, { from: POLYMATH });
            assert.equal(tx.logs[0].args._moduleFactory, I_CappedSTOFactory.address);
            assert.isFalse(tx.logs[0].args._verified);
        });
    });

    describe("ManualApprovalTransferManagerFactory deploy", async() => {
        // Step 1: Deploy new ManualApprovalTransferManager
        it("Should successfully deploy ManualApprovalTransferManagerFactory", async() => {
            I_ManualApprovalTransferManagerFactory = await ManualApprovalTransferManagerFactory.new(I_PolyToken.address, 0, 0, 0, { from: POLYMATH });
            assert.notEqual(
                I_ManualApprovalTransferManagerFactory.address.valueOf(),
                "0x0000000000000000000000000000000000000000",
                "ManualApprovalTransferManagerFactory contract was not deployed"
            );
        });

        // Step 2: Register and verify
        it("Should successfully register and verify new ManualApprovalTransferManagerFactory contract", async() => {
            let tx = await I_ModuleRegistry.registerModule(I_ManualApprovalTransferManagerFactory.address, { from: POLYMATH });
            assert.equal(tx.logs[0].args._moduleFactory, I_ManualApprovalTransferManagerFactory.address);
            tx = await I_ModuleRegistry.verifyModule(I_ManualApprovalTransferManagerFactory.address, true, { from: POLYMATH });
            assert.equal(tx.logs[0].args._moduleFactory, I_ManualApprovalTransferManagerFactory.address);
            assert.isTrue(tx.logs[0].args._verified);
        });
    });

    describe("Change ownerships", async() => {
        /*
        // Step 1:  SecurityTokenRegistry
        it("Should successfully change ownership of new SecurityTokenRegistry contract", async() => {
            let tx = await I_UpgradedSecurityTokenRegistry.transferOwnership(MULTISIG, { from: POLYMATH });
            assert.equal(tx.logs[0].args.previousOwner, POLYMATH, "Previous owner was not Polymath account");
            assert.equal(tx.logs[0].args.newOwner, MULTISIG, "New owner is not Multisig account");
        });
        */

        // Step 2: Oracles
        it("Should successfully change ownership of both Oracles contract", async() => {
            let tx = await I_USDOracle.transferOwnership(MULTISIG, { from: POLYMATH });
            assert.equal(tx.logs[0].args.previousOwner, POLYMATH, "Previous ETH Oracle owner was not Polymath account");
            assert.equal(tx.logs[0].args.newOwner, MULTISIG, "New ETH Oracle owner is not Multisig account");

            tx = await I_POLYOracle.transferOwnership(MULTISIG, { from: POLYMATH });
            assert.equal(tx.logs[0].args.previousOwner, POLYMATH, "Previous POLY Oracle owner was not Polymath account");
            assert.equal(tx.logs[0].args.newOwner, MULTISIG, "New POLY Oracle owner is not Multisig account");
        });

        // Step 3: USDTieredSTOFactory
        it("Should successfully change ownership of USDTieredSTOFactory contract", async() => {
            let tx = await I_USDTieredSTOFactory.transferOwnership(MULTISIG, { from: POLYMATH });
            assert.equal(tx.logs[0].args.previousOwner, POLYMATH, "Previous USDTieredSTOFactory owner was not Polymath account");
            assert.equal(tx.logs[0].args.newOwner, MULTISIG, "New USDTieredSTOFactory owner is not Multisig account");
        });

        // Step 3: CappedSTOFactory
        it("Should successfully change ownership of CappedSTOFactory contract", async() => {
            let tx = await I_UpgradedCappedSTOFactory.transferOwnership(MULTISIG, { from: POLYMATH });
            assert.equal(tx.logs[0].args.previousOwner, POLYMATH, "Previous USDTieredSTOFactory owner was not Polymath account");
            assert.equal(tx.logs[0].args.newOwner, MULTISIG, "New USDTieredSTOFactory owner is not Multisig account");
        });

        // Step 4: ManualApprovalTransferManagerFactory
        it("Should successfully change ownership of ManualApprovalTransferManagerFactory contract", async() => {
            let tx = await I_ManualApprovalTransferManagerFactory.transferOwnership(MULTISIG, { from: POLYMATH });
            assert.equal(tx.logs[0].args.previousOwner, POLYMATH, "Previous ManualApprovalTransferManagerFactory owner was not Polymath account");
            assert.equal(tx.logs[0].args.newOwner, MULTISIG, "New ManualApprovalTransferManagerFactory owner is not Multisig account");
        });
    });

    describe("Polimath network status post migration", async() => {
        // Launch STO for TOK1
        it("Should successfully launch USDTieredSTO for first security token", async() => {
            let _startTime = latestTime() + duration.days(1);
            let _endTime = _startTime + duration.days(180);
            let _ratePerTier = [BigNumber(0.1).mul(10**18), BigNumber(0.15).mul(10**18), BigNumber(0.2).mul(10**18)];
            let _ratePerTierDiscountPoly = [BigNumber(0), BigNumber(0), BigNumber(0)];
            let _tokensPerTierTotal = [BigNumber(100).mul(10**18), BigNumber(200).mul(10**18), BigNumber(300).mul(10**18)];
            let _tokensPerTierDiscountPoly = [BigNumber(0), BigNumber(0), BigNumber(0)];
            let _nonAccreditedLimitUSD = BigNumber(100).mul(10**18);
            let _minimumInvestmentUSD = BigNumber(5).mul(10**18);
            let _fundRaiseTypes = [0, 1];
            let _wallet = ISSUER1;
            let _reserveWallet = ISSUER1;

            let config = [
                _startTime, _endTime, _ratePerTier, _ratePerTierDiscountPoly, _tokensPerTierTotal,
                _tokensPerTierDiscountPoly, _nonAccreditedLimitUSD, _minimumInvestmentUSD,
                _fundRaiseTypes, _wallet, _reserveWallet
            ];

            let functionSignature = {
                name: 'configure',
                type: 'function',
                inputs: [{
                    type: 'uint256',
                    name: '_startTime'
                },{
                    type: 'uint256',
                    name: '_endTime'
                },{
                    type: 'uint256[]',
                    name: '_ratePerTier'
                },{
                    type: 'uint256[]',
                    name: '_ratePerTierDiscountPoly'
                },{
                    type: 'uint256[]',
                    name: '_tokensPerTier'
                },{
                    type: 'uint256[]',
                    name: '_tokensPerTierDiscountPoly'
                },{
                    type: 'uint256',
                    name: '_nonAccreditedLimitUSD'
                },{
                    type: 'uint256',
                    name: '_minimumInvestmentUSD'
                },{
                    type: 'uint8[]',
                    name: '_fundRaiseTypes'
                },{
                    type: 'address',
                    name: '_wallet'
                },{
                    type: 'address',
                    name: '_reserveWallet'
                }]
            };

            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);

            let tx = await I_SecurityToken1.addModule(I_USDTieredSTOFactory.address, bytesSTO, 0, 0, { from: ISSUER1 });
            assert.equal(tx.logs[2].args._type, STOKEY, "USDTieredSTO doesn't get deployed");
            assert.equal(web3.utils.hexToString(tx.logs[2].args._name),"USDTieredSTO","USDTieredSTOFactory module was not added");
            I_USDTieredSTO = USDTieredSTO.at(tx.logs[2].args._module);
        });

        /*
        // Deploy TOK3
        it("Should successfully deploy third security token", async() => {
            await I_PolyToken.approve(I_UpgradedSecurityTokenRegistry.address, REGFEE, { from: ISSUER3});
            tx = await I_UpgradedSecurityTokenRegistry.generateSecurityToken(name3, symbol3, tokenDetails3, false, { from: ISSUER3 });
            assert.equal(tx.logs[1].args._ticker, symbol3, "SecurityToken doesn't get deployed");
            I_SecurityToken3 = SecurityToken.at(tx.logs[1].args._securityTokenAddress);
        });
        */

        // Launch NewCappedSTO for TOK3
        it("Should successfully launch CappedSTO for third security token", async() => {
            let startTime = latestTime() + duration.days(1);
            let endTime = startTime + duration.days(30);
            let cap = BigNumber(500000).mul(10**18);
            let rate = 1000;
            let fundRaiseType = 0;
            let fundsReceiver = ISSUER3;

            const functionSignature = {
                name: 'configure',
                type: 'function',
                inputs: [{
                    type: 'uint256',
                    name: '_startTime'
                },{
                    type: 'uint256',
                    name: '_endTime'
                },{
                    type: 'uint256',
                    name: '_cap'
                },{
                    type: 'uint256',
                    name: '_rate'
                },{
                    type: 'uint8',
                    name: '_fundRaiseType',
                },{
                    type: 'address',
                    name: '_fundsReceiver'
                }
                ]
            };
            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, [startTime, endTime, cap, rate, fundRaiseType, fundsReceiver]);

            let tx = await I_SecurityToken2.addModule(I_UpgradedCappedSTOFactory.address, bytesSTO, 0, 0, { from: ISSUER2 });
            assert.equal(tx.logs[2].args._type, STOKEY, "CappedSTO doesn't get deployed");
            assert.equal(web3.utils.hexToString(tx.logs[2].args._name),"CappedSTO","CappedSTOFactory module was not added");
        });

        // Attach ManualApprovalTransferManager module for TOK2
        it("Should successfully attach the ManualApprovalTransferManagerFactory with the second token", async () => {
            const tx = await I_SecurityToken2.addModule(I_ManualApprovalTransferManagerFactory.address, "", 0, 0, { from: ISSUER2 });
            assert.equal(tx.logs[2].args._type.toNumber(), TMKEY, "ManualApprovalTransferManagerFactory doesn't get deployed");
            assert.equal(web3.utils.toUtf8(tx.logs[2].args._name), "ManualApprovalTransferManager", "ManualApprovalTransferManagerFactory module was not added");
            I_ManualApprovalTransferManagerFactory = ManualApprovalTransferManagerFactory.at(tx.logs[2].args._module);
        });
    });
});
