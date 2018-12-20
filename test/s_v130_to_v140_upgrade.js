const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port
let BN = Web3.utils.BN;

import latestTime from "./helpers/latestTime";
import { duration } from "./helpers/utils";
import { encodeProxyCall, encodeModuleCall } from "./helpers/encodeCall";
import { setUpPolymathNetwork, deployCappedSTOAndVerifyed, deployGPMAndVerifyed } from "./helpers/createInstances";

const USDTieredSTOProxyFactory = artifacts.require("./USDTieredSTOProxyFactory.sol");
const USDTieredSTOFactory = artifacts.require("./USDTieredSTOFactory.sol");
const CappedSTOFactory = artifacts.require("./CappedSTOFactory.sol");
const USDTieredSTO = artifacts.require("./USDTieredSTO.sol");
const CappedSTO = artifacts.require("./CappedSTO.sol");
const PolyOracle = artifacts.require("./PolyOracle.sol");
const ETHOracle = artifacts.require("./MakerDAOOracle.sol");
const SecurityToken = artifacts.require("./SecurityToken.sol");
const PolyTokenFaucet = artifacts.require("./PolyTokenFaucet.sol");
const ManualApprovalTransferManagerFactory = artifacts.require("./ManualApprovalTransferManagerFactory.sol");

contract("Upgrade from v1.3.0 to v1.4.0", async (accounts) => {
    // Accounts Variable declaration
    let POLYMATH;
    let ISSUER1;
    let ISSUER2;
    let ISSUER3;
    let MULTISIG;

    //const GAS_PRICE = 10000000000; // 10 GWEI

    let tx;

    // Initial fee for ticker registry and security token registry
    const REGFEE = new BN(web3.utils.toWei("250"));
    const STOSetupCost = 0;
    const address_zero = "0x0000000000000000000000000000000000000000";

    // Module key
    const STOKEY = 3;
    const TMKEY = 2;

    // SecurityToken 1 Details
    const symbol1 = "TOK1";
    const name1 = "TOK1 Token";
    const tokenDetails1 = "This is equity type of issuance";

    //SecurityToken 2 Details
    const symbol2 = "TOK2";
    const name2 = "TOK2 Token";
    const tokenDetails2 = "This is equity type of issuance";

    //SecurityToken 3 Details
    const symbol3 = "TOK3";
    const name3 = "TOK3 Token";
    const tokenDetails3 = "This is equity type of issuance";

    // Contract Instance Declaration
    let I_PolymathRegistry;
    let I_PolyToken;
    let I_DaiToken;
    let I_ModuleRegistry;
    let I_ModuleRegistryProxy;
    let I_GeneralTransferManagerFactory;
    let I_GeneralPermissionManagerFactory;
    let I_SecurityTokenRegistryProxy;
    let I_FeatureRegistry;
    let I_STFactory;
    let I_MRProxied;
    let I_STRProxied;
    let I_STRProxiedNew;

    let I_SecurityTokenRegistry;
    //let I_UpgradedSecurityTokenRegistry

    let I_SecurityToken1;
    let I_SecurityToken2;
    //let I_SecurityToken3;

    let I_USDTieredSTOFactory;
    let I_USDTieredSTOProxyFactory;
    let I_USDOracle;
    let I_POLYOracle;
    let I_USDTieredSTO;

    let I_CappedSTOFactory;
    let I_UpgradedCappedSTOFactory;
    let I_CappedSTO;
    let I_ManualApprovalTransferManagerFactory;

    const STOParameters = ["uint256", "uint256", "uint256", "uint256", "uint8[]", "address"];
    // Prepare polymath network status
    before(async () => {
        // Accounts setup
        POLYMATH = accounts[0];
        ISSUER1 = accounts[1];
        ISSUER2 = accounts[2];
        ISSUER3 = accounts[3];
        MULTISIG = accounts[4];

        I_DaiToken = await PolyTokenFaucet.new({ from: POLYMATH });

        // ----------- POLYMATH NETWORK Configuration ------------

        let instances = await setUpPolymathNetwork(POLYMATH, ISSUER1);

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

        // STEP 4: Deploy the GeneralDelegateManagerFactory
        [I_GeneralPermissionManagerFactory] = await deployGPMAndVerifyed(POLYMATH, I_MRProxied, 0);

        // STEP 5: Deploy the CappedSTOFactory
        [I_CappedSTOFactory] = await deployCappedSTOAndVerifyed(POLYMATH, I_MRProxied, STOSetupCost);

        // Step 12: Mint tokens to ISSUERs
        await I_PolyToken.getTokens(REGFEE * 2, ISSUER1);
        await I_PolyToken.getTokens(REGFEE * 2, ISSUER2);
        await I_PolyToken.getTokens(REGFEE * 2, ISSUER3);

        // Step 13: Register tokens
        // (A) :  TOK1
        await I_PolyToken.approve(I_STRProxied.address, REGFEE, { from: ISSUER1 });
        tx = await I_STRProxied.registerTicker(ISSUER1, symbol1, name1, { from: ISSUER1 });
        assert.equal(tx.logs[0].args._owner, ISSUER1);
        assert.equal(tx.logs[0].args._ticker, symbol1);

        // (B) :  TOK2
        await I_PolyToken.approve(I_STRProxied.address, REGFEE, { from: ISSUER2 });
        tx = await I_STRProxied.registerTicker(ISSUER2, symbol2, name2, { from: ISSUER2 });
        assert.equal(tx.logs[0].args._owner, ISSUER2);
        assert.equal(tx.logs[0].args._ticker, symbol2);

        // (C) :  TOK3
        await I_PolyToken.approve(I_STRProxied.address, REGFEE, { from: ISSUER3 });
        tx = await I_STRProxied.registerTicker(ISSUER3, symbol3, name3, { from: ISSUER3 });
        assert.equal(tx.logs[0].args._owner, ISSUER3);
        assert.equal(tx.logs[0].args._ticker, symbol3);

        // Step 14: Deploy tokens
        // (A) :  TOK1
        await I_PolyToken.approve(I_STRProxied.address, REGFEE, { from: ISSUER1 });
        let tx = await I_STRProxied.generateSecurityToken(name1, symbol1, tokenDetails1, false, { from: ISSUER1 });
        assert.equal(tx.logs[2].args._ticker, symbol1, "SecurityToken doesn't get deployed");
        I_SecurityToken1 = await SecurityToken.at(tx.logs[2].args._securityTokenAddress);

        // (B) :  TOK2
        await I_PolyToken.approve(I_STRProxied.address, REGFEE, { from: ISSUER2 });
        tx = await I_STRProxied.generateSecurityToken(name2, symbol2, tokenDetails2, false, { from: ISSUER2 });
        assert.equal(tx.logs[2].args._ticker, symbol2, "SecurityToken doesn't get deployed");
        I_SecurityToken2 = await SecurityToken.at(tx.logs[2].args._securityTokenAddress);

        // Printing all the contract addresses
        console.log(`
        --------------------- Polymath Network Smart Contracts: ---------------------
        PolymathRegistry:                  ${I_PolymathRegistry.address}
        SecurityTokenRegistryProxy:        ${I_SecurityTokenRegistryProxy.address}
        SecurityTokenRegistry:             ${I_SecurityTokenRegistry.address}
        ModuleRegistryProxy:               ${I_ModuleRegistryProxy.address}
        ModuleRegistry:                    ${I_ModuleRegistry.address}
        FeatureRegistry:                   ${I_FeatureRegistry.address}

        STFactory:                         ${I_STFactory.address}
        GeneralTransferManagerFactory:     ${I_GeneralTransferManagerFactory.address}
        GeneralPermissionManagerFactory:   ${I_GeneralPermissionManagerFactory.address}

        SecurityToken TOK1:                ${I_SecurityToken1.address}
        SecurityToken TOK2:                ${I_SecurityToken2.address}
        -----------------------------------------------------------------------------
        `);
    });

    describe("USDTieredSTOFactory deploy", async () => {
        // Step 1: Deploy Oracles
        // 1a - Deploy POLY Oracle
        it("Should successfully deploy POLY Oracle and register on PolymathRegistry", async () => {
            I_POLYOracle = await PolyOracle.new({ from: POLYMATH, value: new BN(web3.utils.toWei("1")) });
            console.log(I_POLYOracle.address);
            assert.notEqual(I_POLYOracle.address.valueOf(), address_zero, "POLYOracle contract was not deployed");
            tx = await I_PolymathRegistry.changeAddress("PolyUsdOracle", I_POLYOracle.address, { from: POLYMATH });
            assert.equal(tx.logs[0].args._nameKey, "PolyUsdOracle");
            assert.equal(tx.logs[0].args._newAddress, I_POLYOracle.address);
        });
        // 1b - Deploy ETH Oracle
        it("Should successfully deploy ETH Oracle and register on PolymathRegistry", async () => {
            I_USDOracle = await ETHOracle.new("0x216d678c14be600cb88338e763bb57755ca2b1cf", address_zero, "ETH", { from: POLYMATH });
            assert.notEqual(I_USDOracle.address.valueOf(), address_zero, "USDOracle contract was not deployed");
            tx = await I_PolymathRegistry.changeAddress("EthUsdOracle", I_USDOracle.address, { from: POLYMATH });
            assert.equal(tx.logs[0].args._nameKey, "EthUsdOracle");
            assert.equal(tx.logs[0].args._newAddress, I_USDOracle.address);
        });
    });

    describe("USDTieredSTOFactory deploy", async () => {
        // Step 1: Deploy USDTieredSTOFactory\
        it("Should successfully deploy USDTieredSTOFactory", async () => {
            I_USDTieredSTOProxyFactory = await USDTieredSTOProxyFactory.new();
            I_USDTieredSTOFactory = await USDTieredSTOFactory.new(STOSetupCost, new BN(0), new BN(0), I_USDTieredSTOProxyFactory.address, {
                from: POLYMATH
            });
            assert.notEqual(I_USDTieredSTOFactory.address.valueOf(), address_zero, "USDTieredSTOFactory contract was not deployed");
            let setupCost = await I_USDTieredSTOFactory.setupCost({ from: POLYMATH });
            assert.equal(setupCost, STOSetupCost);
        });
        // Step 2: Register and verify
        it("Should successfully register and verify USDTieredSTOFactory contract", async () => {
            let tx = await I_MRProxied.registerModule(I_USDTieredSTOFactory.address, { from: POLYMATH });
            assert.equal(tx.logs[0].args._moduleFactory, I_USDTieredSTOFactory.address);
            tx = await I_MRProxied.verifyModule(I_USDTieredSTOFactory.address, true, { from: POLYMATH });
            assert.equal(tx.logs[0].args._moduleFactory, I_USDTieredSTOFactory.address);
            assert.isTrue(tx.logs[0].args._verified);
        });
    });

    describe("CappedSTOFactory deploy", async () => {
        // Step 1: Deploy new CappedSTOFactory
        it("Should successfully deploy CappedSTOFactory", async () => {
            I_UpgradedCappedSTOFactory = await CappedSTOFactory.new(STOSetupCost, new BN(0), new BN(0), { from: POLYMATH });
            assert.notEqual(I_UpgradedCappedSTOFactory.address.valueOf(), address_zero, "CappedSTOFactory contract was not deployed");
            let setupCost = await I_UpgradedCappedSTOFactory.setupCost({ from: POLYMATH });
            assert.equal(setupCost, STOSetupCost);
        });

        // Step 2: Register and verify
        it("Should successfully register and verify new CappedSTOFactory contract", async () => {
            let tx = await I_MRProxied.registerModule(I_UpgradedCappedSTOFactory.address, { from: POLYMATH });
            assert.equal(tx.logs[0].args._moduleFactory, I_UpgradedCappedSTOFactory.address);
            tx = await I_MRProxied.verifyModule(I_UpgradedCappedSTOFactory.address, true, { from: POLYMATH });
            assert.equal(tx.logs[0].args._moduleFactory, I_UpgradedCappedSTOFactory.address);
            assert.isTrue(tx.logs[0].args._verified);
        });

        // Step 3: Unverify old CappedSTOFactory
        it("Should successfully unverify old CappedSTOFactory contract", async () => {
            let tx = await I_MRProxied.verifyModule(I_CappedSTOFactory.address, false, { from: POLYMATH });
            assert.equal(tx.logs[0].args._moduleFactory, I_CappedSTOFactory.address);
            assert.isFalse(tx.logs[0].args._verified);
        });
    });

    describe("ManualApprovalTransferManagerFactory deploy", async () => {
        // Step 1: Deploy new ManualApprovalTransferManager
        it("Should successfully deploy ManualApprovalTransferManagerFactory", async () => {
            I_ManualApprovalTransferManagerFactory = await ManualApprovalTransferManagerFactory.new(0, new BN(0), new BN(0), {
                from: POLYMATH
            });
            assert.notEqual(
                I_ManualApprovalTransferManagerFactory.address.valueOf(),
                address_zero,
                "ManualApprovalTransferManagerFactory contract was not deployed"
            );
        });

        // Step 2: Register and verify
        it("Should successfully register and verify new ManualApprovalTransferManagerFactory contract", async () => {
            let tx = await I_MRProxied.registerModule(I_ManualApprovalTransferManagerFactory.address, { from: POLYMATH });
            assert.equal(tx.logs[0].args._moduleFactory, I_ManualApprovalTransferManagerFactory.address);
            tx = await I_MRProxied.verifyModule(I_ManualApprovalTransferManagerFactory.address, true, { from: POLYMATH });
            assert.equal(tx.logs[0].args._moduleFactory, I_ManualApprovalTransferManagerFactory.address);
            assert.isTrue(tx.logs[0].args._verified);
        });
    });

    describe("Change ownerships", async () => {
        /*
        // Step 1:  SecurityTokenRegistry
        it("Should successfully change ownership of new SecurityTokenRegistry contract", async() => {
            let tx = await I_STRProxiedNew.transferOwnership(MULTISIG, { from: POLYMATH });
            assert.equal(tx.logs[0].args.previousOwner, POLYMATH, "Previous owner was not Polymath account");
            assert.equal(tx.logs[0].args.newOwner, MULTISIG, "New owner is not Multisig account");
        });
        */

        // Step 2: Oracles
        it("Should successfully change ownership of both Oracles contract", async () => {
            let tx = await I_USDOracle.transferOwnership(MULTISIG, { from: POLYMATH });
            assert.equal(tx.logs[0].args.previousOwner, POLYMATH, "Previous ETH Oracle owner was not Polymath account");
            assert.equal(tx.logs[0].args.newOwner, MULTISIG, "New ETH Oracle owner is not Multisig account");

            tx = await I_POLYOracle.transferOwnership(MULTISIG, { from: POLYMATH });
            assert.equal(tx.logs[0].args.previousOwner, POLYMATH, "Previous POLY Oracle owner was not Polymath account");
            assert.equal(tx.logs[0].args.newOwner, MULTISIG, "New POLY Oracle owner is not Multisig account");
        });

        // Step 3: USDTieredSTOFactory
        it("Should successfully change ownership of USDTieredSTOFactory contract", async () => {
            let tx = await I_USDTieredSTOFactory.transferOwnership(MULTISIG, { from: POLYMATH });
            assert.equal(tx.logs[0].args.previousOwner, POLYMATH, "Previous USDTieredSTOFactory owner was not Polymath account");
            assert.equal(tx.logs[0].args.newOwner, MULTISIG, "New USDTieredSTOFactory owner is not Multisig account");
        });

        // Step 3: CappedSTOFactory
        it("Should successfully change ownership of CappedSTOFactory contract", async () => {
            let tx = await I_UpgradedCappedSTOFactory.transferOwnership(MULTISIG, { from: POLYMATH });
            assert.equal(tx.logs[0].args.previousOwner, POLYMATH, "Previous USDTieredSTOFactory owner was not Polymath account");
            assert.equal(tx.logs[0].args.newOwner, MULTISIG, "New USDTieredSTOFactory owner is not Multisig account");
        });

        // Step 4: ManualApprovalTransferManagerFactory
        it("Should successfully change ownership of ManualApprovalTransferManagerFactory contract", async () => {
            let tx = await I_ManualApprovalTransferManagerFactory.transferOwnership(MULTISIG, { from: POLYMATH });
            assert.equal(
                tx.logs[0].args.previousOwner,
                POLYMATH,
                "Previous ManualApprovalTransferManagerFactory owner was not Polymath account"
            );
            assert.equal(tx.logs[0].args.newOwner, MULTISIG, "New ManualApprovalTransferManagerFactory owner is not Multisig account");
        });
    });

    describe("Polymath network status post migration", async () => {
        // Launch STO for TOK1
        it("Should successfully launch USDTieredSTO for first security token", async () => {
            let _startTime = await latestTime() + duration.days(1);
            let _endTime = _startTime + duration.days(180);
            let _ratePerTier = [BN(0.1).mul(10 ** 18), BN(0.15).mul(10 ** 18), BN(0.2).mul(10 ** 18)];
            let _ratePerTierDiscountPoly = [BN(0), BN(0), BN(0)];
            let _tokensPerTierTotal = [BN(100).mul(10 ** 18), BN(200).mul(10 ** 18), BN(300).mul(10 ** 18)];
            let _tokensPerTierDiscountPoly = [BN(0), BN(0), BN(0)];
            let _nonAccreditedLimitUSD = new BN(100).mul(10 ** 18);
            let _minimumInvestmentUSD = new BN(5).mul(10 ** 18);
            let _fundRaiseTypes = [0, 1];
            let _wallet = ISSUER1;
            let _reserveWallet = ISSUER1;
            let _usdToken = I_DaiToken.address;

            let config = [
                _startTime,
                _endTime,
                _ratePerTier,
                _ratePerTierDiscountPoly,
                _tokensPerTierTotal,
                _tokensPerTierDiscountPoly,
                _nonAccreditedLimitUSD,
                _minimumInvestmentUSD,
                _fundRaiseTypes,
                _wallet,
                _reserveWallet,
                _usdToken
            ];

            let functionSignature = {
                name: "configure",
                type: "function",
                inputs: [
                    {
                        type: "uint256",
                        name: "_startTime"
                    },
                    {
                        type: "uint256",
                        name: "_endTime"
                    },
                    {
                        type: "uint256[]",
                        name: "_ratePerTier"
                    },
                    {
                        type: "uint256[]",
                        name: "_ratePerTierDiscountPoly"
                    },
                    {
                        type: "uint256[]",
                        name: "_tokensPerTier"
                    },
                    {
                        type: "uint256[]",
                        name: "_tokensPerTierDiscountPoly"
                    },
                    {
                        type: "uint256",
                        name: "_nonAccreditedLimitUSD"
                    },
                    {
                        type: "uint256",
                        name: "_minimumInvestmentUSD"
                    },
                    {
                        type: "uint8[]",
                        name: "_fundRaiseTypes"
                    },
                    {
                        type: "address",
                        name: "_wallet"
                    },
                    {
                        type: "address",
                        name: "_reserveWallet"
                    },
                    {
                        type: "address",
                        name: "_usdToken"
                    }
                ]
            };

            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);

            let tx = await I_SecurityToken1.addModule(I_USDTieredSTOFactory.address, bytesSTO, new BN(0), new BN(0), { from: ISSUER1 });
            assert.equal(tx.logs[2].args._types[0], STOKEY, "USDTieredSTO doesn't get deployed");
            assert.equal(web3.utils.hexToString(tx.logs[2].args._name), "USDTieredSTO", "USDTieredSTOFactory module was not added");
            I_USDTieredSTO = await USDTieredSTO.at(tx.logs[2].args._module);
        });

        /*
        // Deploy TOK3
        it("Should successfully deploy third security token", async() => {
            await I_PolyToken.approve(I_STRProxiedNew.address, REGFEE, { from: ISSUER3});
            tx = await I_STRProxiedNew.generateSecurityToken(name3, symbol3, tokenDetails3, false, { from: ISSUER3 });
            assert.equal(tx.logs[1].args._ticker, symbol3, "SecurityToken doesn't get deployed");
            I_SecurityToken3 = await SecurityToken.at(tx.logs[1].args._securityTokenAddress);
        });
        */

        // Launch NewCappedSTO for TOK2
        it("Should successfully launch CappedSTO for third security token", async () => {
            let startTime = await latestTime() + duration.days(1);
            let endTime = startTime + duration.days(30);
            let cap = new BN(web3.utils.toWei("500000"));
            let rate = 1000;
            let fundRaiseType = 0;
            let fundsReceiver = ISSUER3;

            let bytesSTO = encodeModuleCall(STOParameters, [startTime, endTime, cap, rate, [fundRaiseType], fundsReceiver]);

            let tx = await I_SecurityToken2.addModule(I_UpgradedCappedSTOFactory.address, bytesSTO, new BN(0), new BN(0), { from: ISSUER2 });
            assert.equal(tx.logs[2].args._types[0], STOKEY, "CappedSTO doesn't get deployed");
            assert.equal(web3.utils.hexToString(tx.logs[2].args._name), "CappedSTO", "CappedSTOFactory module was not added");
        });

        // Attach ManualApprovalTransferManager module for TOK2
        it("Should successfully attach the ManualApprovalTransferManagerFactory with the second token", async () => {
            const tx = await I_SecurityToken2.addModule(I_ManualApprovalTransferManagerFactory.address, "", new BN(0), new BN(0), { from: ISSUER2 });
            assert.equal(tx.logs[2].args._types[0].toNumber(), TMKEY, "ManualApprovalTransferManagerFactory doesn't get deployed");
            assert.equal(
                web3.utils.toUtf8(tx.logs[2].args._name),
                "ManualApprovalTransferManager",
                "ManualApprovalTransferManagerFactory module was not added"
            );
            I_ManualApprovalTransferManagerFactory = await ManualApprovalTransferManagerFactory.at(tx.logs[2].args._module);
        });
    });
});
