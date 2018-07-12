import latestTime from './helpers/latestTime';
import { duration, ensureException } from './helpers/utils';
import { takeSnapshot, increaseTime, revertToSnapshot } from './helpers/time';

const USDTieredSTOFactory = artifacts.require('./USDTieredSTOFactory.sol');
const USDTieredSTO = artifacts.require('./USDTieredSTO.sol');
const MockOracle = artifacts.require('./MockOracle.sol');
const ModuleRegistry = artifacts.require('./ModuleRegistry.sol');
const SecurityToken = artifacts.require('./SecurityToken.sol');
const SecurityTokenRegistry = artifacts.require('./SecurityTokenRegistry.sol');
const TickerRegistry = artifacts.require('./TickerRegistry.sol');
const STVersion = artifacts.require('./STVersionProxy001.sol');
const GeneralPermissionManagerFactory = artifacts.require('./GeneralPermissionManagerFactory.sol');
const GeneralTransferManagerFactory = artifacts.require('./GeneralTransferManagerFactory.sol');
const GeneralTransferManager = artifacts.require('./GeneralTransferManager');
const GeneralPermissionManager = artifacts.require('./GeneralPermissionManager');
const PolyTokenFaucet = artifacts.require('./PolyTokenFaucet.sol');

const Web3 = require('web3');
const BigNumber = require('bignumber.js');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")) // Hardcoded development port

contract('USDTieredSTO', accounts => {
    // Accounts Variable declaration
    let POLYMATH;
    let ISSUER;
    let INVESTOR1;
    let INVESTOR2;
    let INVESTOR3;
    let INVESTOR4;
    let ACCREDITED1;
    let ACCREDITED2;
    let NONACCREDITED1;
    let NONACCREDITED2;

    let MESSAGE = "Transaction Should Fail!";

    // Snapshot variables
    let snapId_beforeTierChange;
    let snapId_SoldOut;

    // Contract Instance Declaration
    let I_GeneralPermissionManagerFactory;
    let I_GeneralTransferManagerFactory;
    let I_GeneralPermissionManager;
    let I_GeneralTransferManager;
    let I_ModuleRegistry;
    let I_TickerRegistry;
    let I_SecurityTokenRegistry;
    let I_USDTieredSTOFactory;
    let I_USDOracle;
    let I_POLYOracle;
    let I_STVersion;
    let I_SecurityToken;
    let I_USDTieredSTO_Array = [];
    let I_PolyToken;

    // SecurityToken Details for funds raise Type ETH
    const SWARMHASH = "dagwrgwgvwergwrvwrg";
    const NAME = "Team";
    const SYMBOL = "SAP";
    const TOKENDETAILS = "This is equity type of issuance";
    const DECIMALS = 18;

    // Module key
    const TMKEY = 2;
    const STOKEY = 3;

    // Initial fee for ticker registry and security token registry
    const REGFEE = 250 * Math.pow(10, 18);

    // MockOracle USD prices
    const USDETH = BigNumber(500).mul(10**18); // 500 USD/ETH
    const USDPOLY = BigNumber(25).mul(10**16); // 0.25 USD/POLY

    // invest 500 USD at 0.1 USD/Token to get 5000 Token using 1 ETH at 500 USD/ETH
    // 500 USD/ETH * 1 ETH / 0.1 USD/Token
    // USDETH.mul(value).div(_ratePerTier[0])

    // USDTieredSTO details
    const _startTime = latestTime() + duration.days(2);
    const _endTime  = _startTime + duration.days(30);
    const _ratePerTier = [BigNumber(10*10**16), BigNumber(15*10**16)];   // [ 0.10 USD/Token, 0.15 USD/Token ]
    const _tokensPerTier = [BigNumber(100000000).mul(BigNumber(10**18)), BigNumber(200000000).mul(BigNumber(10**18))];   // [ 100m token, 200m token ]
    let _securityTokenRegistry;
    const _nonAccreditedLimitUSD = BigNumber(10000).mul(BigNumber(10**18)); // 10k USD
    const _minimumInvestmentUSD = 0;
    const _startingTier = 0;
    const _fundRaiseTypes = [0, 1];
    let _wallet;
    let _reserveWallet;

    const _tokensPerTier_LOW = [BigNumber(100).mul(BigNumber(10**18)), BigNumber(200).mul(BigNumber(10**18))];   // [ 100 token, 200 token ]

    /* function configure(
        uint256 _startTime,
        uint256 _endTime,
        uint256[] _ratePerTier,
        uint256[] _tokensPerTier,
        address _securityTokenRegistry,
        uint256 _nonAccreditedLimitUSD,
        uint256 _minimumInvestmentUSD,
        uint8 _startingTier,
        uint8[] _fundRaiseTypes,
        address _wallet,
        address _reserveWallet
    ) */
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
            type: 'uint256[]',
            name: '_ratePerTier'
        },{
            type: 'uint256[]',
            name: '_tokensPerTier'
        },{
            type: 'address',
            name: '_securityTokenRegistry'
        },{
            type: 'uint256',
            name: '_nonAccreditedLimitUSD'
        },{
            type: 'uint256',
            name: '_minimumInvestmentUSD'
        },{
            type: 'uint8',
            name: '_startingTier'
        },{
            type: 'uint8[]',
            name: '_fundRaiseTypes'
        },{
            type: 'address',
            name: '_wallet'
        },{
            type: 'address',
            name: '_reserveWallet'
        }
        ]
    };

    before(async() => {
        // Accounts setup
        POLYMATH = accounts[0];
        ISSUER = accounts[1];
        _wallet = accounts[2];
        _reserveWallet = _wallet;
        ACCREDITED1 = accounts[3];
        ACCREDITED2 = accounts[4];
        NONACCREDITED1 = accounts[5];
        NONACCREDITED2 = accounts[6];
        INVESTOR1 = accounts[7];
        INVESTOR2 = accounts[8];
        INVESTOR3 = accounts[9];

        // ----------- POLYMATH NETWORK Configuration ------------

        // Step 0: Deploy the token Faucet and Mint tokens for ISSUER
        I_PolyToken = await PolyTokenFaucet.new();

        // STEP 1: Deploy the ModuleRegistry

        I_ModuleRegistry = await ModuleRegistry.new({ from: POLYMATH });

        assert.notEqual(
            I_ModuleRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "ModuleRegistry contract was not deployed"
        );

        // STEP 2: Deploy the GeneralTransferManagerFactory

        I_GeneralTransferManagerFactory = await GeneralTransferManagerFactory.new(I_PolyToken.address, 0, 0, 0, { from: POLYMATH });

        assert.notEqual(
            I_GeneralTransferManagerFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "GeneralTransferManagerFactory contract was not deployed"
        );

        // STEP 3: Deploy the GeneralDelegateManagerFactory

        I_GeneralPermissionManagerFactory = await GeneralPermissionManagerFactory.new(I_PolyToken.address, 0, 0, 0, { from: POLYMATH });

        assert.notEqual(
            I_GeneralPermissionManagerFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "GeneralDelegateManagerFactory contract was not deployed"
        );

        // STEP 4: Deploy the USDTieredSTOFactory

        I_USDTieredSTOFactory = await USDTieredSTOFactory.new(I_PolyToken.address, 0, 0, 0, { from: ISSUER });

        assert.notEqual(
            I_USDTieredSTOFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "USDTieredSTOFactory contract was not deployed"
        );

        // STEP 5: Register the Modules with the ModuleRegistry contract

        // (A) :  Register the GeneralTransferManagerFactory
        await I_ModuleRegistry.registerModule(I_GeneralTransferManagerFactory.address, { from: POLYMATH });
        await I_ModuleRegistry.verifyModule(I_GeneralTransferManagerFactory.address, true, { from: POLYMATH });

        // (B) :  Register the GeneralDelegateManagerFactory
        await I_ModuleRegistry.registerModule(I_GeneralPermissionManagerFactory.address, { from: POLYMATH });
        await I_ModuleRegistry.verifyModule(I_GeneralPermissionManagerFactory.address, true, { from: POLYMATH });

        // (C) : Register the STOFactory
        await I_ModuleRegistry.registerModule(I_USDTieredSTOFactory.address, { from: ISSUER });

        // Step 6: Deploy the TickerRegistry

        I_TickerRegistry = await TickerRegistry.new(I_PolyToken.address, REGFEE, { from: POLYMATH });

        assert.notEqual(
            I_TickerRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "TickerRegistry contract was not deployed",
        );

        // Step 7: Deploy the STversionProxy contract

        I_STVersion = await STVersion.new(I_GeneralTransferManagerFactory.address, {from : POLYMATH });

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
            REGFEE,
            {
                from: POLYMATH
            });

        assert.notEqual(
            I_SecurityTokenRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "SecurityTokenRegistry contract was not deployed",
        );

        // Step 8: Set the STR in TickerRegistry
        await I_TickerRegistry.changeAddress("SecurityTokenRegistry", I_SecurityTokenRegistry.address, { from: POLYMATH });
        await I_ModuleRegistry.changeAddress("SecurityTokenRegistry", I_SecurityTokenRegistry.address, { from: POLYMATH });
        _securityTokenRegistry = I_SecurityTokenRegistry.address;

        // Step 9: Deploy & Register Mock Oracles
        I_USDOracle = await MockOracle.new(0, "ETH", "USD", USDETH, { from: POLYMATH }); // 500 dollars per POLY
        I_POLYOracle = await MockOracle.new(I_PolyToken.address, "POLY", "USD", USDPOLY, { from: POLYMATH }); // 25 cents per POLY
        await I_SecurityTokenRegistry.changeOracle("ETH", "USD", I_USDOracle.address, { from: POLYMATH });
        await I_SecurityTokenRegistry.changeOracle("POLY", "USD", I_POLYOracle.address, { from: POLYMATH });

        // Printing all the contract addresses
        console.log(`
        ----- Polymath Network Smart Contracts Deployed: -----
        ModuleRegistry: ${I_ModuleRegistry.address}
        GeneralTransferManagerFactory: ${I_GeneralTransferManagerFactory.address}
        GeneralPermissionManagerFactory: ${I_GeneralPermissionManagerFactory.address}
        USDTieredSTOFactory: ${I_USDTieredSTOFactory.address}
        TickerRegistry: ${I_TickerRegistry.address}
        STVersionProxy_001: ${I_STVersion.address}
        SecurityTokenRegistry: ${I_SecurityTokenRegistry.address}
        USDOracle: ${I_USDOracle.address}
        POLYOracle: ${I_POLYOracle.address}
        ------------------------------------------------------
        `);
    });

    describe("Generate the SecurityToken", async() => {

        it("Should register the ticker before the generation of the security token", async () => {
            await I_PolyToken.getTokens(REGFEE, ISSUER);
            await I_PolyToken.approve(I_TickerRegistry.address, REGFEE, { from: ISSUER });
            let tx = await I_TickerRegistry.registerTicker(ISSUER, SYMBOL, NAME, SWARMHASH, { from : ISSUER });
            assert.equal(tx.logs[0].args._owner, ISSUER);
            assert.equal(tx.logs[0].args._symbol, SYMBOL);
        });

        it("Should generate the new security token with the same symbol as registered above", async () => {
            await I_PolyToken.getTokens(REGFEE, ISSUER);
            await I_PolyToken.approve(I_SecurityTokenRegistry.address, REGFEE, { from: ISSUER });
            let tx = await I_SecurityTokenRegistry.generateSecurityToken(NAME, SYMBOL, TOKENDETAILS, true, { from: ISSUER, gas: 85000000 });
            assert.equal(tx.logs[1].args._ticker, SYMBOL, "SecurityToken doesn't get deployed");

            I_SecurityToken = SecurityToken.at(tx.logs[1].args._securityTokenAddress);

            const LogAddModule = await I_SecurityToken.allEvents();
            const log = await new Promise(function(resolve, reject) {
                LogAddModule.watch(function(error, log){ resolve(log);});
            });

            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._type.toNumber(), TMKEY);
            assert.equal(web3.utils.hexToString(log.args._name),"GeneralTransferManager");
            LogAddModule.stopWatching();
        });

        it("Should intialize the auto attached modules", async () => {
           let moduleData = await I_SecurityToken.modules(TMKEY, 0);
           I_GeneralTransferManager = GeneralTransferManager.at(moduleData[1]);

           assert.notEqual(
            I_GeneralTransferManager.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "GeneralTransferManager contract was not deployed",
           );
        });
    });

    describe("Test sto deployment", async() => {

        it("Should fail because rates and tier array of different length", async() => {
            let ratePerTier = [BigNumber(10*10**16), BigNumber(15*10**16)];
            let tokensPerTier = [BigNumber(100000000).mul(BigNumber(10**18))];
            let config = [_startTime, _endTime, ratePerTier, tokensPerTier, _securityTokenRegistry, _nonAccreditedLimitUSD, _minimumInvestmentUSD, _startingTier, _fundRaiseTypes, _wallet, _reserveWallet];
            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            let errorThrown = false;
            try {
                const tx = await I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, 0, 0, { from: ISSUER, gas: 4500000 });
            } catch(error) {
                console.log(`         tx revert -> arrays are of different size`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, MESSAGE);
        });

        it("Should fail because rate of token should be greater than 0", async() => {
            let ratePerTier = [BigNumber(10*10**16), 0];
            let config = [_startTime, _endTime, ratePerTier, _tokensPerTier, _securityTokenRegistry, _nonAccreditedLimitUSD, _minimumInvestmentUSD, _startingTier, _fundRaiseTypes, _wallet, _reserveWallet];
            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            let errorThrown = false;
            try {
                const tx = await I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, 0, 0, { from: ISSUER, gas: 4500000 });
            } catch(error) {
                console.log(`         tx revert -> rate of token should be greater than 0`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, MESSAGE);
        });

        it("Should fail because Zero address is not permitted for wallet", async() => {
            let wallet = "0x0000000000000000000000000000000000000000";
            let config = [_startTime, _endTime, _ratePerTier, _tokensPerTier, _securityTokenRegistry, _nonAccreditedLimitUSD, _minimumInvestmentUSD, _startingTier, _fundRaiseTypes, wallet, _reserveWallet];
            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            let errorThrown = false;
            try {
                const tx = await I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, 0, 0, { from: ISSUER, gas: 4500000 });
            } catch(error) {
                console.log(`         tx revert -> Zero address is not permitted for wallet`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, MESSAGE);
        });

        it("Should fail because Zero address is not permitted for reserveWallet", async() => {
            let reserveWallet = "0x0000000000000000000000000000000000000000";
            let config = [_startTime, _endTime, _ratePerTier, _tokensPerTier, _securityTokenRegistry, _nonAccreditedLimitUSD, _minimumInvestmentUSD, _startingTier, _fundRaiseTypes, _wallet, reserveWallet];
            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            let errorThrown = false;
            try {
                const tx = await I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, 0, 0, { from: ISSUER, gas: 4500000 });
            } catch(error) {
                console.log(`         tx revert -> Zero address is not permitted for reserveWallet`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, MESSAGE);
        });

        it("Should fail because end time before start time", async() => {
            let startTime = latestTime() + duration.days(35);
            let endTime  = latestTime() + duration.days(1);
            let config = [startTime, endTime, _ratePerTier, _tokensPerTier, _securityTokenRegistry, _nonAccreditedLimitUSD, _minimumInvestmentUSD, _startingTier, _fundRaiseTypes, _wallet, _reserveWallet];
            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            let errorThrown = false;
            try {
                const tx = await I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, 0, 0, { from: ISSUER, gas: 4500000 });
            } catch(error) {
                console.log(`         tx revert -> end time before start time`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, MESSAGE);
        });

        it("Should fail because start time is in the past", async() => {
            let startTime = latestTime() - duration.days(35);
            let endTime  = startTime + duration.days(50);
            let config = [startTime, endTime, _ratePerTier, _tokensPerTier, _securityTokenRegistry, _nonAccreditedLimitUSD, _minimumInvestmentUSD, _startingTier, _fundRaiseTypes, _wallet, _reserveWallet];
            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            let errorThrown = false;
            try {
                const tx = await I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, 0, 0, { from: ISSUER, gas: 4500000 });
            } catch(error) {
                console.log(`         tx revert -> start time is in the past`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, MESSAGE);
        });

        it("Should fail because Zero address is not permitted for security token registry", async() => {
            let securityTokenRegistry = "0x0000000000000000000000000000000000000000";
            let config = [_startTime, _endTime, _ratePerTier, _tokensPerTier, securityTokenRegistry, _nonAccreditedLimitUSD, _minimumInvestmentUSD, _startingTier, _fundRaiseTypes, _wallet, _reserveWallet];
            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            let errorThrown = false;
            try {
                const tx = await I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, 0, 0, { from: ISSUER, gas: 4500000 });
            } catch(error) {
                console.log(`         tx revert -> Zero address is not permitted for security token registry`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, MESSAGE);
        });

        it("Should fail because invalid starting tier index", async() => {
            let startingTier = 10;
            let config = [_startTime, _endTime, _ratePerTier, _tokensPerTier, _securityTokenRegistry, _nonAccreditedLimitUSD, _minimumInvestmentUSD, startingTier, _fundRaiseTypes, _wallet, _reserveWallet];
            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            let errorThrown = false;
            try {
                const tx = await I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, 0, 0, { from: ISSUER, gas: 4500000 });
            } catch(error) {
                console.log(`         tx revert -> Invalid starting tier index`.grey);
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, MESSAGE);
        });

        it("Should successfully attach the first STO module to the security token", async () => {
            let config = [_startTime, _endTime, _ratePerTier, _tokensPerTier, _securityTokenRegistry, _nonAccreditedLimitUSD, _minimumInvestmentUSD, _startingTier, _fundRaiseTypes, _wallet, _reserveWallet];
            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            const tx = await I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, 0, 0, { from: ISSUER, gas: 4500000 });
            assert.equal(tx.logs[2].args._type, STOKEY, "USDTieredSTO doesn't get deployed");
            assert.equal(web3.utils.hexToString(tx.logs[2].args._name),"USDTieredSTO","USDTieredSTOFactory module was not added");
            I_USDTieredSTO_Array.push(USDTieredSTO.at(tx.logs[2].args._module));
        });

        it("Should successfully attach the second STO module to the security token", async () => {
            let config = [_startTime, _endTime, _ratePerTier, _tokensPerTier_LOW, _securityTokenRegistry, _nonAccreditedLimitUSD, _minimumInvestmentUSD, _startingTier, _fundRaiseTypes, _wallet, _reserveWallet];
            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            const tx = await I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, 0, 0, { from: ISSUER, gas: 4500000 });
            assert.equal(tx.logs[2].args._type, STOKEY, "USDTieredSTO doesn't get deployed");
            assert.equal(web3.utils.hexToString(tx.logs[2].args._name),"USDTieredSTO","USDTieredSTOFactory module was not added");
            I_USDTieredSTO_Array.push(USDTieredSTO.at(tx.logs[2].args._module));
        });
    });

    describe("Test buying tokens", async() => {

        describe("Test on closed STO", async() => {

            it("should fail if before STO start time", async() => {
                let snapId = await takeSnapshot();

                // Whitelist
                let fromTime = latestTime();
                let toTime = latestTime() + duration.days(15);
                let expiryTime = toTime + duration.days(100);
                let whitelisted = true;

                await I_GeneralTransferManager.modifyWhitelist(ACCREDITED1, fromTime, toTime, expiryTime, whitelisted,{ from: ISSUER, gas: 500000 });
                await I_GeneralTransferManager.modifyWhitelist(NONACCREDITED1, fromTime, toTime, expiryTime, whitelisted,{ from: ISSUER, gas: 500000 });

                // // Advance time to after STO start
                // await increaseTime(duration.days(3));

                // Set as accredited
                await I_USDTieredSTO_Array[0].changeAccredited([ACCREDITED1], [true], { from: ISSUER });

                // Prep for investments
                let investment_ETH = web3.utils.toWei('1', 'ether'); // Invest 1 ETH
                let investment_POLY = web3.utils.toWei('10000', 'ether'); // Invest 10000 POLY
                await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
                await I_PolyToken.approve(I_USDTieredSTO_Array[0].address, investment_POLY, {from: NONACCREDITED1});
                await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
                await I_PolyToken.approve(I_USDTieredSTO_Array[0].address, investment_POLY, {from: ACCREDITED1});

                // NONACCREDITED ETH
                let errorThrown1 = false;
                try {
                    await I_USDTieredSTO_Array[0].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, gas: 2100000, value: investment_ETH });
                } catch(error) {
                    console.log(`         tx revert -> STO has not started for NONACCREDITED ETH`.grey);
                    errorThrown1 = true;
                    ensureException(error);
                }
                assert.ok(errorThrown1, 'NONACCREDITED ETH investment succeeded when it should not');

                // NONACCREDITED POLY
                let errorThrown2 = false;
                try {
                    await I_USDTieredSTO_Array[0].buyWithPOLY(NONACCREDITED1, investment_POLY, {from: NONACCREDITED1});
                } catch(error) {
                    console.log(`         tx revert -> STO has not started for NONACCREDITED POLY`.grey);
                    errorThrown2 = true;
                    ensureException(error);
                }
                assert.ok(errorThrown2, 'NONACCREDITED POLY investment succeeded when it should not');

                // ACCREDITED ETH
                let errorThrown3 = false;
                try {
                    await I_USDTieredSTO_Array[0].buyWithETH(ACCREDITED1, { from: ACCREDITED1, gas: 2100000, value: investment_ETH });
                } catch(error) {
                    console.log(`         tx revert -> STO has not started for ACCREDITED ETH`.grey);
                    errorThrown3 = true;
                    ensureException(error);
                }
                assert.ok(errorThrown3, 'ACCREDITED ETH investment succeeded when it should not');

                // ACCREDITED POLY
                let errorThrown4 = false;
                try {
                    await I_USDTieredSTO_Array[0].buyWithPOLY(ACCREDITED1, investment_POLY, {from: ACCREDITED1});
                } catch(error) {
                    console.log(`         tx revert -> STO has not started for ACCREDITED POLY`.grey);
                    errorThrown4 = true;
                    ensureException(error);
                }
                assert.ok(errorThrown4, 'ACCREDITED POLY investment succeeded when it should not');

                await revertToSnapshot(snapId);
            });

            it("should fail if not whitelisted", async() => {
                let snapId = await takeSnapshot();

                // // Whitelist
                // let fromTime = latestTime();
                // let toTime = latestTime() + duration.days(15);
                // let expiryTime = toTime + duration.days(100);
                // let whitelisted = true;
                //
                // await I_GeneralTransferManager.modifyWhitelist(ACCREDITED1, fromTime, toTime, expiryTime, whitelisted,{ from: ISSUER, gas: 500000 });
                // await I_GeneralTransferManager.modifyWhitelist(NONACCREDITED1, fromTime, toTime, expiryTime, whitelisted,{ from: ISSUER, gas: 500000 });

                // Advance time to after STO start
                await increaseTime(duration.days(3));

                // Set as accredited
                await I_USDTieredSTO_Array[0].changeAccredited([ACCREDITED1], [true], { from: ISSUER });

                // Prep for investments
                let investment_ETH = web3.utils.toWei('1', 'ether'); // Invest 1 ETH
                let investment_POLY = web3.utils.toWei('10000', 'ether'); // Invest 10000 POLY
                await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
                await I_PolyToken.approve(I_USDTieredSTO_Array[0].address, investment_POLY, {from: NONACCREDITED1});
                await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
                await I_PolyToken.approve(I_USDTieredSTO_Array[0].address, investment_POLY, {from: ACCREDITED1});

                // NONACCREDITED ETH
                let errorThrown1 = false;
                try {
                    await I_USDTieredSTO_Array[0].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, gas: 2100000, value: investment_ETH });
                } catch(error) {
                    console.log(`         tx revert -> NONACCREDITED1 is not whitelisted for ETH`.grey);
                    errorThrown1 = true;
                    ensureException(error);
                }
                assert.ok(errorThrown1, 'NONACCREDITED ETH investment succeeded when it should not');

                // NONACCREDITED POLY
                let errorThrown2 = false;
                try {
                    await I_USDTieredSTO_Array[0].buyWithPOLY(NONACCREDITED1, investment_POLY, {from: NONACCREDITED1});
                } catch(error) {
                    console.log(`         tx revert -> NONACCREDITED1 is not whitelisted for POLY`.grey);
                    errorThrown2 = true;
                    ensureException(error);
                }
                assert.ok(errorThrown2, 'NONACCREDITED POLY investment succeeded when it should not');

                // ACCREDITED ETH
                let errorThrown3 = false;
                try {
                    await I_USDTieredSTO_Array[0].buyWithETH(ACCREDITED1, { from: ACCREDITED1, gas: 2100000, value: investment_ETH });
                } catch(error) {
                    console.log(`         tx revert -> ACCREDITED1 is not whitelisted for ETH`.grey);
                    errorThrown3 = true;
                    ensureException(error);
                }
                assert.ok(errorThrown3, 'ACCREDITED ETH investment succeeded when it should not');

                // ACCREDITED POLY
                let errorThrown4 = false;
                try {
                    await I_USDTieredSTO_Array[0].buyWithPOLY(ACCREDITED1, investment_POLY, {from: ACCREDITED1});
                } catch(error) {
                    console.log(`         tx revert -> ACCREDITED1 is not whitelisted for POLY`.grey);
                    errorThrown4 = true;
                    ensureException(error);
                }
                assert.ok(errorThrown4, 'ACCREDITED POLY investment succeeded when it should not');

                await revertToSnapshot(snapId);
            });

            it("should successfully pause the STO and make investments fail, then unpause and succeed", async() => {
                let snapId = await takeSnapshot();

                // Whitelist
                let fromTime = latestTime();
                let toTime = latestTime() + duration.days(15);
                let expiryTime = toTime + duration.days(100);
                let whitelisted = true;

                await I_GeneralTransferManager.modifyWhitelist(ACCREDITED1, fromTime, toTime, expiryTime, whitelisted,{ from: ISSUER, gas: 500000 });
                await I_GeneralTransferManager.modifyWhitelist(NONACCREDITED1, fromTime, toTime, expiryTime, whitelisted,{ from: ISSUER, gas: 500000 });

                // Advance time to after STO start
                await increaseTime(duration.days(3));

                // Set as accredited
                await I_USDTieredSTO_Array[0].changeAccredited([ACCREDITED1], [true], { from: ISSUER });

                // Pause the STO
                await I_USDTieredSTO_Array[0].pause({ from: ISSUER });
                assert.equal(await I_USDTieredSTO_Array[0].paused.call(), true, 'STO did not pause successfully');

                // Prep for investments
                let investment_ETH = web3.utils.toWei('1', 'ether'); // Invest 1 ETH
                let investment_POLY = web3.utils.toWei('10000', 'ether'); // Invest 10000 POLY
                await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
                await I_PolyToken.approve(I_USDTieredSTO_Array[0].address, investment_POLY, {from: NONACCREDITED1});
                await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
                await I_PolyToken.approve(I_USDTieredSTO_Array[0].address, investment_POLY, {from: ACCREDITED1});

                // NONACCREDITED ETH
                let errorThrown1 = false;
                try {
                    await I_USDTieredSTO_Array[0].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, gas: 2100000, value: investment_ETH });
                } catch(error) {
                    console.log(`         tx revert -> STO is paused for NONACCREDITED ETH`.grey);
                    errorThrown1 = true;
                    ensureException(error);
                }
                assert.ok(errorThrown1, 'NONACCREDITED ETH investment succeeded when it should not');

                // NONACCREDITED POLY
                let errorThrown2 = false;
                try {
                    await I_USDTieredSTO_Array[0].buyWithPOLY(NONACCREDITED1, investment_POLY, {from: NONACCREDITED1});
                } catch(error) {
                    console.log(`         tx revert -> STO is paused for NONACCREDITED POLY`.grey);
                    errorThrown2 = true;
                    ensureException(error);
                }
                assert.ok(errorThrown2, 'NONACCREDITED POLY investment succeeded when it should not');

                // ACCREDITED ETH
                let errorThrown3 = false;
                try {
                    await I_USDTieredSTO_Array[0].buyWithETH(ACCREDITED1, { from: ACCREDITED1, gas: 2100000, value: investment_ETH });
                } catch(error) {
                    console.log(`         tx revert -> STO is paused for ACCREDITED ETH`.grey);
                    errorThrown3 = true;
                    ensureException(error);
                }
                assert.ok(errorThrown3, 'ACCREDITED ETH investment succeeded when it should not');

                // ACCREDITED POLY
                let errorThrown4 = false;
                try {
                    await I_USDTieredSTO_Array[0].buyWithPOLY(ACCREDITED1, investment_POLY, {from: ACCREDITED1});
                } catch(error) {
                    console.log(`         tx revert -> STO is paused for ACCREDITED POLY`.grey);
                    errorThrown4 = true;
                    ensureException(error);
                }
                assert.ok(errorThrown4, 'ACCREDITED POLY investment succeeded when it should not');

                // Unpause the STO
                await I_USDTieredSTO_Array[0].unpause(_endTime, { from: ISSUER });
                assert.equal(await I_USDTieredSTO_Array[0].paused.call(), false, 'STO did not unpause successfully');

                await I_USDTieredSTO_Array[0].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, gas: 2100000, value: investment_ETH });
                await I_USDTieredSTO_Array[0].buyWithPOLY(NONACCREDITED1, investment_POLY, {from: NONACCREDITED1});
                await I_USDTieredSTO_Array[0].buyWithETH(ACCREDITED1, { from: ACCREDITED1, gas: 2100000, value: investment_ETH });
                await I_USDTieredSTO_Array[0].buyWithPOLY(ACCREDITED1, investment_POLY, {from: ACCREDITED1});

                await revertToSnapshot(snapId);
            });

            it("should fail if after STO end time", async() => {
                let snapId = await takeSnapshot();

                // Whitelist
                let fromTime = latestTime();
                let toTime = latestTime() + duration.days(15);
                let expiryTime = toTime + duration.days(100);
                let whitelisted = true;

                await I_GeneralTransferManager.modifyWhitelist(ACCREDITED1, fromTime, toTime, expiryTime, whitelisted,{ from: ISSUER, gas: 500000 });
                await I_GeneralTransferManager.modifyWhitelist(NONACCREDITED1, fromTime, toTime, expiryTime, whitelisted,{ from: ISSUER, gas: 500000 });

                // Advance time to after STO end
                await increaseTime(_endTime + duration.days(2));

                // Set as accredited
                await I_USDTieredSTO_Array[0].changeAccredited([ACCREDITED1], [true], { from: ISSUER });

                // Prep for investments
                let investment_ETH = web3.utils.toWei('1', 'ether'); // Invest 1 ETH
                let investment_POLY = web3.utils.toWei('10000', 'ether'); // Invest 10000 POLY
                await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
                await I_PolyToken.approve(I_USDTieredSTO_Array[0].address, investment_POLY, {from: NONACCREDITED1});
                await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
                await I_PolyToken.approve(I_USDTieredSTO_Array[0].address, investment_POLY, {from: ACCREDITED1});

                // NONACCREDITED ETH
                let errorThrown1 = false;
                try {
                    await I_USDTieredSTO_Array[0].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, gas: 2100000, value: investment_ETH });
                } catch(error) {
                    console.log(`         tx revert -> STO end time is passed for NONACCREDITED ETH`.grey);
                    errorThrown1 = true;
                    ensureException(error);
                }
                assert.ok(errorThrown1, 'NONACCREDITED ETH investment succeeded when it should not');

                // NONACCREDITED POLY
                let errorThrown2 = false;
                try {
                    await I_USDTieredSTO_Array[0].buyWithPOLY(NONACCREDITED1, investment_POLY, {from: NONACCREDITED1});
                } catch(error) {
                    console.log(`         tx revert -> STO end time is passed for NONACCREDITED POLY`.grey);
                    errorThrown2 = true;
                    ensureException(error);
                }
                assert.ok(errorThrown2, 'NONACCREDITED POLY investment succeeded when it should not');

                // ACCREDITED ETH
                let errorThrown3 = false;
                try {
                    await I_USDTieredSTO_Array[0].buyWithETH(ACCREDITED1, { from: ACCREDITED1, gas: 2100000, value: investment_ETH });
                } catch(error) {
                    console.log(`         tx revert -> STO end time is passed for ACCREDITED ETH`.grey);
                    errorThrown3 = true;
                    ensureException(error);
                }
                assert.ok(errorThrown3, 'ACCREDITED ETH investment succeeded when it should not');

                // ACCREDITED POLY
                let errorThrown4 = false;
                try {
                    await I_USDTieredSTO_Array[0].buyWithPOLY(ACCREDITED1, investment_POLY, {from: ACCREDITED1});
                } catch(error) {
                    console.log(`         tx revert -> STO end time is passed for NONACCREDITED POLY`.grey);
                    errorThrown4 = true;
                    ensureException(error);
                }
                assert.ok(errorThrown4, 'ACCREDITED POLY investment succeeded when it should not');

                await revertToSnapshot(snapId);
            });

            it("should fail if finalized", async() => {
                let snapId = await takeSnapshot();

                // Whitelist
                let fromTime = latestTime();
                let toTime = latestTime();
                let expiryTime = toTime + duration.days(100);
                let whitelisted = true;

                await I_GeneralTransferManager.modifyWhitelist(ACCREDITED1, fromTime, toTime, expiryTime, whitelisted,{ from: ISSUER, gas: 500000 });
                await I_GeneralTransferManager.modifyWhitelist(NONACCREDITED1, fromTime, toTime, expiryTime, whitelisted,{ from: ISSUER, gas: 500000 });
                await I_GeneralTransferManager.modifyWhitelist(_reserveWallet, fromTime, toTime, expiryTime, whitelisted,{ from: ISSUER, gas: 500000 });

                // Advance time to after STO start
                await increaseTime(duration.days(3));

                // Set as accredited
                await I_USDTieredSTO_Array[0].changeAccredited([ACCREDITED1], [true], { from: ISSUER });

                // Finalize STO
                let tx = await I_USDTieredSTO_Array[0].finalize({ from: ISSUER });
                assert.equal(await I_USDTieredSTO_Array[0].isFinalized.call(), true, "STO has not been finalized");

                // Attempt to call function again
                let errorThrown = false;
                try {
                    await I_USDTieredSTO_Array[0].finalize({ from: ISSUER });
                } catch(error) {
                    console.log(`         tx revert -> STO is already finalized`.grey);
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, 'STO was finalized a second time');

                // Prep for investments
                let investment_ETH = web3.utils.toWei('1', 'ether'); // Invest 1 ETH
                let investment_POLY = web3.utils.toWei('10000', 'ether'); // Invest 10000 POLY
                await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
                await I_PolyToken.approve(I_USDTieredSTO_Array[0].address, investment_POLY, {from: NONACCREDITED1});
                await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
                await I_PolyToken.approve(I_USDTieredSTO_Array[0].address, investment_POLY, {from: ACCREDITED1});

                // NONACCREDITED ETH
                let errorThrown1 = false;
                try {
                    await I_USDTieredSTO_Array[0].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, gas: 2100000, value: investment_ETH });
                } catch(error) {
                    console.log(`         tx revert -> STO is finalized for NONACCREDITED ETH`.grey);
                    errorThrown1 = true;
                    ensureException(error);
                }
                assert.ok(errorThrown1, 'NONACCREDITED ETH investment succeeded when it should not');

                // NONACCREDITED POLY
                let errorThrown2 = false;
                try {
                    await I_USDTieredSTO_Array[0].buyWithPOLY(NONACCREDITED1, investment_POLY, {from: NONACCREDITED1});
                } catch(error) {
                    console.log(`         tx revert -> STO is finalized for NONACCREDITED POLY`.grey);
                    errorThrown2 = true;
                    ensureException(error);
                }
                assert.ok(errorThrown2, 'NONACCREDITED POLY investment succeeded when it should not');

                // ACCREDITED ETH
                let errorThrown3 = false;
                try {
                    await I_USDTieredSTO_Array[0].buyWithETH(ACCREDITED1, { from: ACCREDITED1, gas: 2100000, value: investment_ETH });
                } catch(error) {
                    console.log(`         tx revert -> STO is finalized for ACCREDITED ETH`.grey);
                    errorThrown3 = true;
                    ensureException(error);
                }
                assert.ok(errorThrown3, 'ACCREDITED ETH investment succeeded when it should not');

                // ACCREDITED POLY
                let errorThrown4 = false;
                try {
                    await I_USDTieredSTO_Array[0].buyWithPOLY(ACCREDITED1, investment_POLY, {from: ACCREDITED1});
                } catch(error) {
                    console.log(`         tx revert -> STO is finalized for ACCREDITED POLY`.grey);
                    errorThrown4 = true;
                    ensureException(error);
                }
                assert.ok(errorThrown4, 'ACCREDITED POLY investment succeeded when it should not');

                await revertToSnapshot(snapId);
            });
        });

    //     describe("Test on open STO", async() => {
    //
    //         describe("preparation", async() => {
    //
    //             it("should jump forward to after STO start", async() => {
    //                 await increaseTime(duration.days(3));
    //             });
    //
    //             it("should whitelist ACCREDITED1 and NONACCREDITED1", async() => {
    //                 let fromTime = latestTime();
    //                 let toTime = latestTime() + duration.days(15);
    //                 let expiryTime = toTime + duration.days(100);
    //                 let whitelisted = true;
    //
    //                 const tx1 = await I_GeneralTransferManager.modifyWhitelist(NONACCREDITED1, fromTime, toTime, expiryTime, whitelisted,{ from: ISSUER, gas: 500000 });
    //                 assert.equal(tx1.logs[0].args._investor, NONACCREDITED1, "Failed in adding the investor in whitelist");
    //                 const tx2 = await I_GeneralTransferManager.modifyWhitelist(ACCREDITED1, fromTime, toTime, expiryTime, whitelisted,{ from: ISSUER, gas: 500000 });
    //                 assert.equal(tx2.logs[0].args._investor, ACCREDITED1, "Failed in adding the investor in whitelist");
    //             });
    //
    //             it("should successfully modify accredited addresses for first STO", async() => {
    //                 let status1 = await I_USDTieredSTO_Array[0].accredited.call(NONACCREDITED1);
    //                 assert.equal(status1, false, "Initial accreditation is set to true");
    //
    //                 await I_USDTieredSTO_Array[0].changeAccredited([NONACCREDITED1], [true], { from: ISSUER });
    //                 let status2 = await I_USDTieredSTO_Array[0].accredited.call(NONACCREDITED1);
    //                 assert.equal(status2, true, "Failed to set single address");
    //
    //                 await I_USDTieredSTO_Array[0].changeAccredited([NONACCREDITED1, ACCREDITED1], [false, true], { from: ISSUER });
    //                 let status3 = await I_USDTieredSTO_Array[0].accredited.call(NONACCREDITED1);
    //                 assert.equal(status3, false, "Failed to set multiple addresses");
    //                 let status4 = await I_USDTieredSTO_Array[0].accredited.call(ACCREDITED1);
    //                 assert.equal(status4, true, "Failed to set multiple addresses");
    //
    //                 let errorThrown = false;
    //                 try {
    //                     await I_USDTieredSTO_Array[0].changeAccredited([NONACCREDITED1, ACCREDITED1], [true], { from: ISSUER });
    //                 } catch(error) {
    //                     console.log(`         tx revert -> arrays are of different size`.grey);
    //                     errorThrown = true;
    //                     ensureException(error);
    //                 }
    //                 assert.ok(errorThrown, "Set accreditation despite input array of different size");
    //             });
    //
    //             it("should successfully modify accredited addresses for second STO", async() => {
    //                 await I_USDTieredSTO_Array[1].changeAccredited([NONACCREDITED1, ACCREDITED1], [false, true], { from: ISSUER });
    //                 let status1 = await I_USDTieredSTO_Array[1].accredited.call(NONACCREDITED1);
    //                 let status2 = await I_USDTieredSTO_Array[1].accredited.call(ACCREDITED1);
    //                 assert.equal(status1, false, "Failed to set multiple address");
    //                 assert.equal(status2, true, "Failed to set multiple address");
    //             });
    //         });
    //
    //         describe("Buy Tokens", async() => {
    //
    //             it("should successfully buy using fallback at tier 0 for NONACCREDITED1", async() => {
    //                 let investment_ETH = BigNumber(web3.utils.toWei('1', 'ether'));
    //                 let investment_USD = await I_USDTieredSTO_Array[0].convertToUSD('ETH', investment_ETH);
    //                 let investment_Token = investment_USD.div(_ratePerTier[0]).mul(10**18);
    //
    //                 let init_RaisedETH = await I_USDTieredSTO_Array[0].fundsRaisedETH.call();
    //                 let init_NumberInvestors = await I_USDTieredSTO_Array[0].getNumberInvestors.call();
    //                 let init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
    //                 let init_WalletETHBal = BigNumber(await web3.eth.getBalance(_wallet));
    //
    //                 await web3.eth.sendTransaction({ from: NONACCREDITED1, to: I_USDTieredSTO_Array[0].address, gas: 2100000, value: investment_ETH });
    //
    //                 let final_RaisedETH = await I_USDTieredSTO_Array[0].fundsRaisedETH.call();
    //                 let final_NumberInvestors = await I_USDTieredSTO_Array[0].getNumberInvestors.call();
    //                 let final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
    //                 let final_WalletETHBal = BigNumber(await web3.eth.getBalance(_wallet));
    //
    //                 assert.equal(
    //                     final_RaisedETH.toNumber(),
    //                     init_RaisedETH.add(investment_ETH).toNumber(),
    //                     "ETH was not transfered to the contract"
    //                 );
    //                 assert.equal(
    //                     final_NumberInvestors.toNumber(),
    //                     init_NumberInvestors.add(1).toNumber(),
    //                     "Investor count was not increased"
    //                 );
    //                 assert.equal(
    //                     final_InvestorTokenBal.toNumber(),
    //                     init_InvestorTokenBal.add(investment_Token).toNumber(),
    //                     "Token was not transfered to the investor"
    //                 );
    //                 assert.equal(
    //                     final_WalletETHBal.toNumber(),
    //                     init_WalletETHBal.add(investment_ETH).toNumber(),
    //                     "ETH was not transfered to the wallet"
    //                 );
    //             });
    //
    //             it("should successfully buy using buyWithETH at tier 0 for NONACCREDITED1", async() => {
    //                 let investment_ETH = BigNumber(web3.utils.toWei('1', 'ether'));
    //                 let investment_USD = await I_USDTieredSTO_Array[0].convertToUSD('ETH', investment_ETH);
    //                 let investment_Token = investment_USD.div(_ratePerTier[0]).mul(10**18);
    //
    //                 let init_RaisedETH = await I_USDTieredSTO_Array[0].fundsRaisedETH.call();
    //                 let init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
    //                 let init_WalletETHBal = BigNumber(await web3.eth.getBalance(_wallet));
    //
    //                 await I_USDTieredSTO_Array[0].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, gas: 2100000, value: investment_ETH });
    //
    //                 let final_RaisedETH = await I_USDTieredSTO_Array[0].fundsRaisedETH.call();
    //                 let final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
    //                 let final_WalletETHBal = BigNumber(await web3.eth.getBalance(_wallet));
    //
    //                 assert.equal(
    //                     final_RaisedETH.toNumber(),
    //                     init_RaisedETH.add(investment_ETH).toNumber(),
    //                     "ETH was not transfered to the contract"
    //                 );
    //                 assert.equal(
    //                     final_InvestorTokenBal.toNumber(),
    //                     init_InvestorTokenBal.add(investment_Token).toNumber(),
    //                     "Token was not transfered to the investor"
    //                 );
    //                 assert.equal(
    //                     final_WalletETHBal.toNumber(),
    //                     init_WalletETHBal.add(investment_ETH).toNumber(),
    //                     "ETH was not transfered to the wallet"
    //                 );
    //             });
    //
    //             it("should successfully buy using buyWithPOLY at tier 0 for NONACCREDITED1", async() => {
    //                 let investment_POLY = BigNumber(web3.utils.toWei('10000', 'ether'));
    //                 let investment_USD = await I_USDTieredSTO_Array[0].convertToUSD('POLY', investment_POLY);
    //                 let investment_Token = investment_USD.div(_ratePerTier[0]).mul(10**18);
    //
    //                 let init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
    //                 let init_RaisedPOLY = await I_USDTieredSTO_Array[0].fundsRaisedPOLY.call();
    //                 let init_WalletPOLYBal = await I_PolyToken.balanceOf(_wallet);
    //
    //                 await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
    //                 await I_PolyToken.approve(I_USDTieredSTO_Array[0].address, investment_POLY, {from: NONACCREDITED1});
    //                 await I_USDTieredSTO_Array[0].buyWithPOLY(NONACCREDITED1, investment_POLY, {from: NONACCREDITED1});
    //
    //                 let final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
    //                 let final_RaisedPOLY = await I_USDTieredSTO_Array[0].fundsRaisedPOLY.call();
    //                 let final_WalletPOLYBal = await I_PolyToken.balanceOf(_wallet);
    //
    //                 assert.equal(
    //                     final_RaisedPOLY.toNumber(),
    //                     init_RaisedPOLY.add(investment_POLY).toNumber(),
    //                     "POLY was not transfered to the contract"
    //                 );
    //                 assert.equal(
    //                     final_InvestorTokenBal.toNumber(),
    //                     init_InvestorTokenBal.add(investment_Token).toNumber(),
    //                     "Token was not transfered to the investor"
    //                 );
    //                 assert.equal(
    //                     final_WalletPOLYBal.toNumber(),
    //                     init_WalletPOLYBal.add(investment_POLY).toNumber(),
    //                     "POLY was not transfered to the wallet"
    //                 );
    //             });
    //
    //             it("should successfully buy using fallback at tier 0 for ACCREDITED1", async() => {
    //                 let investment_ETH = BigNumber(web3.utils.toWei('1', 'ether'));
    //                 let investment_USD = await I_USDTieredSTO_Array[0].convertToUSD('ETH', investment_ETH);
    //                 let investment_Token = investment_USD.div(_ratePerTier[0]).mul(10**18);
    //
    //                 let init_RaisedETH = await I_USDTieredSTO_Array[0].fundsRaisedETH.call();
    //                 let init_NumberInvestors = await I_USDTieredSTO_Array[0].getNumberInvestors.call();
    //                 let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
    //                 let init_WalletETHBal = BigNumber(await web3.eth.getBalance(_wallet));
    //
    //                 await web3.eth.sendTransaction({ from: ACCREDITED1, to: I_USDTieredSTO_Array[0].address, gas: 2100000, value: investment_ETH });
    //
    //                 let final_RaisedETH = await I_USDTieredSTO_Array[0].fundsRaisedETH.call();
    //                 let final_NumberInvestors = await I_USDTieredSTO_Array[0].getNumberInvestors.call();
    //                 let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
    //                 let final_WalletETHBal = BigNumber(await web3.eth.getBalance(_wallet));
    //
    //                 assert.equal(
    //                     final_RaisedETH.toNumber(),
    //                     init_RaisedETH.add(investment_ETH).toNumber(),
    //                     "ETH was not transfered to the contract"
    //                 );
    //                 assert.equal(
    //                     final_NumberInvestors.toNumber(),
    //                     init_NumberInvestors.add(1).toNumber(),
    //                     "Investor count was not increased"
    //                 );
    //                 assert.equal(
    //                     final_InvestorTokenBal.toNumber(),
    //                     init_InvestorTokenBal.add(investment_Token).toNumber(),
    //                     "Token was not transfered to the investor"
    //                 );
    //                 assert.equal(
    //                     final_WalletETHBal.toNumber(),
    //                     init_WalletETHBal.add(investment_ETH).toNumber(),
    //                     "ETH was not transfered to the wallet"
    //                 );
    //             });
    //
    //             it("should successfully buy using buyWithETH at tier 0 for ACCREDITED1", async() => {
    //                 let investment_ETH = BigNumber(web3.utils.toWei('1', 'ether'));
    //                 let investment_USD = await I_USDTieredSTO_Array[0].convertToUSD('ETH', investment_ETH);
    //                 let investment_Token = investment_USD.div(_ratePerTier[0]).mul(10**18);
    //
    //                 let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
    //                 let init_RaisedETH = await I_USDTieredSTO_Array[0].fundsRaisedETH.call();
    //                 let init_WalletETHBal = BigNumber(await web3.eth.getBalance(_wallet));
    //
    //                 await I_USDTieredSTO_Array[0].buyWithETH(ACCREDITED1, { from: ACCREDITED1, gas: 2100000, value: investment_ETH });
    //
    //                 let final_RaisedETH = await I_USDTieredSTO_Array[0].fundsRaisedETH.call();
    //                 let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
    //                 let final_WalletETHBal = BigNumber(await web3.eth.getBalance(_wallet));
    //
    //                 assert.equal(
    //                     final_RaisedETH.toNumber(),
    //                     init_RaisedETH.add(investment_ETH).toNumber(),
    //                     "ETH was not transfered to the contract"
    //                 );
    //                 assert.equal(
    //                     final_InvestorTokenBal.toNumber(),
    //                     init_InvestorTokenBal.add(investment_Token).toNumber(),
    //                     "Token was not transfered to the investor"
    //                 );
    //                 assert.equal(
    //                     final_WalletETHBal.toNumber(),
    //                     init_WalletETHBal.add(investment_ETH).toNumber(),
    //                     "ETH was not transfered to the wallet"
    //                 );
    //             });
    //
    //             it("should successfully buy using buyWithPOLY at tier 0 for ACCREDITED1", async() => {
    //                 let investment_POLY = BigNumber(web3.utils.toWei('10000', 'ether'));
    //                 let investment_USD = await I_USDTieredSTO_Array[0].convertToUSD('POLY', investment_POLY);
    //                 let investment_Token = investment_USD.div(_ratePerTier[0]).mul(10**18);
    //
    //                 let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
    //                 let init_RaisedPOLY = await I_USDTieredSTO_Array[0].fundsRaisedPOLY.call();
    //                 let init_WalletPOLYBal = await I_PolyToken.balanceOf(_wallet);
    //
    //                 await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
    //                 await I_PolyToken.approve(I_USDTieredSTO_Array[0].address, investment_POLY, {from: ACCREDITED1});
    //                 await I_USDTieredSTO_Array[0].buyWithPOLY(ACCREDITED1, investment_POLY, {from: ACCREDITED1});
    //
    //                 let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
    //                 let final_RaisedPOLY = await I_USDTieredSTO_Array[0].fundsRaisedPOLY.call();
    //                 let final_WalletPOLYBal = await I_PolyToken.balanceOf(_wallet);
    //
    //                 assert.equal(
    //                     final_RaisedPOLY.toNumber(),
    //                     init_RaisedPOLY.add(investment_POLY).toNumber(),
    //                     "POLY was not transfered to the contract"
    //                 );
    //                 assert.equal(
    //                     final_InvestorTokenBal.toNumber(),
    //                     init_InvestorTokenBal.add(investment_Token).toNumber(),
    //                     "Token was not transfered to the investor"
    //                 );
    //                 assert.equal(
    //                     final_WalletPOLYBal.toNumber(),
    //                     init_WalletPOLYBal.add(investment_POLY).toNumber(),
    //                     "POLY was not transfered to the wallet"
    //                 );
    //             });
    //
    //             it("should buy tokens up to just before the next tier", async() => {
    //                 // Buy tokens almost up to the next tier
    //                 let tokensToNextTier = (await I_USDTieredSTO_Array[1].tokensPerTier.call(0)).minus(await I_USDTieredSTO_Array[1].mintedPerTier.call(0));
    //                 let tokensPrep = tokensToNextTier.minus(web3.utils.toWei('10')).div(10**18);   // 90 Tokens
    //                 let usdPrep = tokensPrep.mul(_ratePerTier[0].div(10**18));                     // 90 Tokens * 0.1 USD/Token = 9 USD
    //                 let ethPrep = usdPrep.div(USDETH.div(10**18));                                 // 9 USD / 500 USD/ETH = 0.018 ETH
    //                 let prep_ETH = ethPrep.mul(10**18);
    //
    //                 await I_USDTieredSTO_Array[1].buyWithETH(ACCREDITED1, { from: ACCREDITED1, value: prep_ETH });
    //
    //                 snapId_beforeTierChange = await takeSnapshot();
    //             });
    //
    //             it("should successfully buy across tiers for NONACCREDITED ETH", async() => {
    //                 // Prep for investments
    //                 let tokensBuyTier0 = BigNumber(web3.utils.toWei('10')).div(10**18);       // 10 Tokens
    //                 let tokensBuyTier1 = BigNumber(web3.utils.toWei('10')).div(10**18);       // 10 Tokens
    //                 let usdBuyTier0 = tokensBuyTier0.mul(_ratePerTier[0].div(10**18));        // 10 Tokens * 0.10 USD/Token = 1.0 USD
    //                 let usdBuyTier1 = tokensBuyTier1.mul(_ratePerTier[1].div(10**18));        // 10 Tokens * 0.15 USD/Token = 1.5 USD
    //                 let ethBuyTier0 = usdBuyTier0.div(USDETH.div(10**18));                    // 1.0 USD / 500 USD/ETH = 0.002 ETH
    //                 let ethBuyTier1 = usdBuyTier1.div(USDETH.div(10**18));                    // 1.5 USD / 500 USD/ETH = 0.003 ETH
    //
    //                 let investment_Token = tokensBuyTier0.add(tokensBuyTier1).mul(10**18);    // 20 tokens in wei
    //                 let investment_ETH = ethBuyTier0.add(ethBuyTier1).mul(10**18);            // Cost of 20 tokens across tiers = 0.005 ETH in wei
    //
    //                 // Process investment
    //                 let init_RaisedETH = await I_USDTieredSTO_Array[1].fundsRaisedETH.call();
    //                 let init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
    //                 let init_WalletETHBal = BigNumber(await web3.eth.getBalance(_wallet));
    //
    //                 await I_USDTieredSTO_Array[1].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, value: investment_ETH });
    //
    //                 let final_RaisedETH = await I_USDTieredSTO_Array[1].fundsRaisedETH.call();
    //                 let final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
    //                 let final_WalletETHBal = BigNumber(await web3.eth.getBalance(_wallet));
    //
    //                 assert.equal(
    //                     final_RaisedETH.toNumber(),
    //                     init_RaisedETH.add(investment_ETH).toNumber(),
    //                     "ETH was not transfered to the contract for NONACCREDITED ETH investment"
    //                 );
    //                 assert.equal(
    //                     final_InvestorTokenBal.toNumber(),
    //                     init_InvestorTokenBal.add(investment_Token).toNumber(),
    //                     "Token was not transfered to the investor for NONACCREDITED ETH investment"
    //                 );
    //                 assert.equal(
    //                     final_WalletETHBal.toNumber(),
    //                     init_WalletETHBal.add(investment_ETH).toNumber(),
    //                     "ETH was not transfered to the wallet for NONACCREDITED ETH investment"
    //                 );
    //                 await revertToSnapshot(snapId_beforeTierChange);
    //             });
    //
    //             // it("should successfully buy across tiers for NONACCREDITED POLY", async() => {
    //             //     // Prep for investments
    //             //     let tokensBuyTier0 = BigNumber(web3.utils.toWei('10')).div(10**18);       // 10 Tokens
    //             //     let tokensBuyTier1 = BigNumber(web3.utils.toWei('10')).div(10**18);       // 10 Tokens
    //             //     let usdBuyTier0 = tokensBuyTier0.mul(_ratePerTier[0].div(10**18));        // 10 Tokens * 0.10 USD/Token = 1.0 USD
    //             //     let usdBuyTier1 = tokensBuyTier1.mul(_ratePerTier[1].div(10**18));        // 10 Tokens * 0.15 USD/Token = 1.5 USD
    //             //     let polyBuyTier0 = usdBuyTier0.div(USDPOLY.div(10**18));                  // 1.0 USD / 0.25 USD/POLY = 4 POLY
    //             //     let polyBuyTier1 = usdBuyTier1.div(USDPOLY.div(10**18));                  // 1.5 USD / 0.25 USD/POLY = 6 POLY
    //             //
    //             //     let investment_Token = tokensBuyTier0.add(tokensBuyTier1).mul(10**18);    // 20 tokens in wei
    //             //     let investment_POLY = polyBuyTier0.add(polyBuyTier1).mul(10**18);         // Cost of 20 tokens across tiers = 10 POLY in wei
    //             //
    //             //     await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
    //             //     await I_PolyToken.approve(I_USDTieredSTO_Array[1].address, investment_POLY, {from: NONACCREDITED1});
    //             //
    //             //     // Process investment
    //             //     let init_RaisedPOLY = await I_USDTieredSTO_Array[1].fundsRaisedPOLY.call();
    //             //     let init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
    //             //     let init_WalletPOLYBal = await I_PolyToken.balanceOf(_wallet);
    //             //
    //             //     await I_USDTieredSTO_Array[1].buyWithPOLY(NONACCREDITED1, investment_POLY, {from: NONACCREDITED1});
    //             //
    //             //     let final_RaisedPOLY = await I_USDTieredSTO_Array[1].fundsRaisedPOLY.call();
    //             //     let final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
    //             //     let final_WalletPOLYBal = await I_PolyToken.balanceOf(_wallet);
    //             //
    //             //     assert.equal(
    //             //         final_RaisedPOLY.toNumber(),
    //             //         init_RaisedPOLY.add(investment_POLY).toNumber(),
    //             //         "POLY was not transfered to the contract for NONACCREDITED POLY investment"
    //             //     );
    //             //     assert.equal(
    //             //         final_InvestorTokenBal.toNumber(),
    //             //         init_InvestorTokenBal.add(investment_Token).toNumber(),
    //             //         "Token was not transfered to the investor for NONACCREDITED POLY investment"
    //             //     );
    //             //     assert.equal(
    //             //         final_WalletPOLYBal.toNumber(),
    //             //         init_WalletPOLYBal.add(investment_POLY).toNumber(),
    //             //         "POLY was not transfered to the wallet for NONACCREDITED POLY investment"
    //             //     );
    //             //     await revertToSnapshot(snapId_beforeTierChange);
    //             // });
    //             //
    //             // it("should successfully buy across tiers for ACCREDITED ETH", async() => {
    //             //     // Prep for investments
    //             //     let tokensBuyTier0 = BigNumber(web3.utils.toWei('10')).div(10**18);       // 10 Tokens
    //             //     let tokensBuyTier1 = BigNumber(web3.utils.toWei('10')).div(10**18);       // 10 Tokens
    //             //     let usdBuyTier0 = tokensBuyTier0.mul(_ratePerTier[0].div(10**18));        // 10 Tokens * 0.10 USD/Token = 1.0 USD
    //             //     let usdBuyTier1 = tokensBuyTier1.mul(_ratePerTier[1].div(10**18));        // 10 Tokens * 0.15 USD/Token = 1.5 USD
    //             //     let ethBuyTier0 = usdBuyTier0.div(USDETH.div(10**18));                    // 1.0 USD / 500 USD/ETH = 0.002 ETH
    //             //     let ethBuyTier1 = usdBuyTier1.div(USDETH.div(10**18));                    // 1.5 USD / 500 USD/ETH = 0.003 ETH
    //             //
    //             //     let investment_Token = tokensBuyTier0.add(tokensBuyTier1).mul(10**18);    // 20 tokens in wei
    //             //     let investment_ETH = ethBuyTier0.add(ethBuyTier1).mul(10**18);            // Cost of 20 tokens across tiers = 0.005 ETH in wei
    //             //
    //             //     // Process investment
    //             //     let init_RaisedETH = await I_USDTieredSTO_Array[1].fundsRaisedETH.call();
    //             //     let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
    //             //     let init_WalletETHBal = BigNumber(await web3.eth.getBalance(_wallet));
    //             //
    //             //     await I_USDTieredSTO_Array[1].buyWithETH(ACCREDITED1, { from: ACCREDITED1, value: investment_ETH });
    //             //
    //             //     let final_RaisedETH = await I_USDTieredSTO_Array[1].fundsRaisedETH.call();
    //             //     let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
    //             //     let final_WalletETHBal = BigNumber(await web3.eth.getBalance(_wallet));
    //             //
    //             //     assert.equal(
    //             //         final_RaisedETH.toNumber(),
    //             //         init_RaisedETH.add(investment_ETH).toNumber(),
    //             //         "ETH was not transfered to the contract for ACCREDITED ETH investment"
    //             //     );
    //             //     assert.equal(
    //             //         final_InvestorTokenBal.toNumber(),
    //             //         init_InvestorTokenBal.add(investment_Token).toNumber(),
    //             //         "Token was not transfered to the investor for ACCREDITED ETH investment"
    //             //     );
    //             //     assert.equal(
    //             //         final_WalletETHBal.toNumber(),
    //             //         init_WalletETHBal.add(investment_ETH).toNumber(),
    //             //         "ETH was not transfered to the wallet for ACCREDITED ETH investment"
    //             //     );
    //             //     await revertToSnapshot(snapId_beforeTierChange);
    //             // });
    //             //
    //             it("should successfully buy across tiers for ACCREDITED POLY", async() => {
    //                 // Prep for investments
    //                 let tokensBuyTier0 = BigNumber(web3.utils.toWei('10')).div(10**18);       // 10 Tokens
    //                 let tokensBuyTier1 = BigNumber(web3.utils.toWei('10')).div(10**18);       // 10 Tokens
    //                 let usdBuyTier0 = tokensBuyTier0.mul(_ratePerTier[0].div(10**18));        // 10 Tokens * 0.10 USD/Token = 1.0 USD
    //                 let usdBuyTier1 = tokensBuyTier1.mul(_ratePerTier[1].div(10**18));        // 10 Tokens * 0.15 USD/Token = 1.5 USD
    //                 let polyBuyTier0 = usdBuyTier0.div(USDPOLY.div(10**18));                  // 1.0 USD / 0.25 USD/POLY = 4 POLY
    //                 let polyBuyTier1 = usdBuyTier1.div(USDPOLY.div(10**18));                  // 1.5 USD / 0.25 USD/POLY = 6 POLY
    //
    //                 let investment_Token = tokensBuyTier0.add(tokensBuyTier1).mul(10**18);    // 20 tokens in wei
    //                 let investment_POLY = polyBuyTier0.add(polyBuyTier1).mul(10**18);         // Cost of 20 tokens across tiers = 10 POLY in wei
    //
    //                 await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
    //                 await I_PolyToken.approve(I_USDTieredSTO_Array[1].address, investment_POLY, {from: ACCREDITED1});
    //
    //                 // Process investment
    //                 let init_RaisedPOLY = await I_USDTieredSTO_Array[1].fundsRaisedPOLY.call();
    //                 let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
    //                 let init_WalletPOLYBal = await I_PolyToken.balanceOf(_wallet);
    //
    //                 await I_USDTieredSTO_Array[1].buyWithPOLY(ACCREDITED1, investment_POLY, {from: ACCREDITED1});
    //
    //                 let final_RaisedPOLY = await I_USDTieredSTO_Array[1].fundsRaisedPOLY.call();
    //                 let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
    //                 let final_WalletPOLYBal = await I_PolyToken.balanceOf(_wallet);
    //
    //                 assert.equal(
    //                     final_RaisedPOLY.toNumber(),
    //                     init_RaisedPOLY.add(investment_POLY).toNumber(),
    //                     "POLY was not transfered to the contract for ACCREDITED POLY investment"
    //                 );
    //                 assert.equal(
    //                     final_InvestorTokenBal.toNumber(),
    //                     init_InvestorTokenBal.add(investment_Token).toNumber(),
    //                     "Token was not transfered to the investor for ACCREDITED POLY investment"
    //                 );
    //                 assert.equal(
    //                     final_WalletPOLYBal.toNumber(),
    //                     init_WalletPOLYBal.add(investment_POLY).toNumber(),
    //                     "POLY was not transfered to the wallet for ACCREDITED POLY investment"
    //                 );
    //             });
    //
    //             it("should successfully buy a partial amount and refund balance when reaching non-accredited cap", async() => {
    //                 let snap = await takeSnapshot();
    //
    //                 let investmentToDate_USD = await I_USDTieredSTO_Array[0].investorInvestedUSD.call(NONACCREDITED1);
    //                 let remainingCap_USD = _nonAccreditedLimitUSD.sub(investmentToDate_USD);
    //
    //                 let refund_USD = BigNumber(web3.utils.toWei('50'));
    //                 let refund_ETH = refund_USD.div(USDETH).mul(10**18); // USD / USD/ETH = ETH
    //                 let refund_POLY = refund_USD.div(USDPOLY).mul(10**18); // USD / USD/ETH = ETH
    //                 let refund_Token = refund_USD.div(_ratePerTier[0]).mul(10**18); // USD / USD/Token = Token
    //
    //                 let investment_USD = remainingCap_USD.add(refund_USD); // USD
    //                 let investment_ETH = investment_USD.div(USDETH).mul(10**18); // USD / USD/ETH = ETH
    //                 let investment_POLY = investment_USD.div(USDPOLY).mul(10**18); // USD / USD/POLY = POLY
    //                 let investment_Token = investment_USD.div(_ratePerTier[0]).mul(10**18); // USD / USD/Token = Token
    //
    //                 let init_InvestorTokenBal;
    //                 let final_InvestorTokenBal;
    //
    //                 // Buy With ETH
    //                 init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
    //                 let init_InvestorETHBal = BigNumber(await web3.eth.getBalance(NONACCREDITED1));
    //                 let init_RaisedETH = await I_USDTieredSTO_Array[0].fundsRaisedETH.call();
    //                 let init_WalletETHBal = BigNumber(await web3.eth.getBalance(_wallet));
    //
    //                 let tx = await I_USDTieredSTO_Array[0].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, gas: 2100000, value: investment_ETH, gasPrice: 100000000000 });
    //                 let gasCost = BigNumber('100000000000').mul(tx.receipt.gasUsed);
    //
    //                 final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
    //                 let final_InvestorETHBal = BigNumber(await web3.eth.getBalance(NONACCREDITED1));
    //                 let final_RaisedETH = await I_USDTieredSTO_Array[0].fundsRaisedETH.call();
    //                 let final_WalletETHBal = BigNumber(await web3.eth.getBalance(_wallet));
    //
    //                 assert.equal(
    //                     final_InvestorTokenBal.toNumber(),
    //                     init_InvestorTokenBal.add(investment_Token).sub(refund_Token).toNumber(),
    //                     "Token was not transfered to the investor"
    //                 );
    //                 assert.equal(
    //                     final_InvestorETHBal.toNumber(),
    //                     init_InvestorETHBal.sub(investment_ETH).add(refund_ETH).sub(gasCost).toNumber(),
    //                     "ETH was not refunded to the investor"
    //                 );
    //                 assert.equal(
    //                     final_RaisedETH.toNumber(),
    //                     init_RaisedETH.add(investment_ETH).sub(refund_ETH).toNumber(),
    //                     "ETH was not transfered to the contract"
    //                 );
    //                 assert.equal(
    //                     final_WalletETHBal.toNumber(),
    //                     init_WalletETHBal.add(investment_ETH).sub(refund_ETH).toNumber(),
    //                     "ETH was not transfered to the wallet"
    //                 );
    //
    //                 await revertToSnapshot(snap);
    //
    //                 await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
    //                 await I_PolyToken.approve(I_USDTieredSTO_Array[0].address, investment_POLY, {from: NONACCREDITED1});
    //
    //                 // Buy With POLY
    //                 init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
    //                 let init_InvestorPOLYBal = BigNumber(await I_PolyToken.balanceOf(NONACCREDITED1));
    //                 let init_RaisedPOLY = await I_USDTieredSTO_Array[0].fundsRaisedPOLY.call();
    //                 let init_WalletPOLYBal = await I_PolyToken.balanceOf(_wallet);
    //
    //                 await I_USDTieredSTO_Array[0].buyWithPOLY(NONACCREDITED1, investment_POLY, {from: NONACCREDITED1});
    //
    //                 final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
    //                 let final_InvestorPOLYBal = BigNumber(await I_PolyToken.balanceOf(NONACCREDITED1));
    //                 let final_RaisedPOLY = await I_USDTieredSTO_Array[0].fundsRaisedPOLY.call();
    //                 let final_WalletPOLYBal = await I_PolyToken.balanceOf(_wallet);
    //
    //                 assert.equal(
    //                     final_InvestorTokenBal.toNumber(),
    //                     init_InvestorTokenBal.add(investment_Token).sub(refund_Token).toNumber(),
    //                     "Token was not transfered to the investor"
    //                 );
    //                 assert.equal(
    //                     final_InvestorPOLYBal.toNumber(),
    //                     init_InvestorPOLYBal.sub(investment_POLY).add(refund_POLY).toNumber(),
    //                     "POLY was not refunded to the investor"
    //                 );
    //                 assert.equal(
    //                     final_RaisedPOLY.toNumber(),
    //                     init_RaisedPOLY.add(investment_POLY).sub(refund_POLY).toNumber(),
    //                     "POLY was not transfered to the contract"
    //                 );
    //                 assert.equal(
    //                     final_WalletPOLYBal.toNumber(),
    //                     init_WalletPOLYBal.add(investment_POLY).sub(refund_POLY).toNumber(),
    //                     "POLY was not transfered to the wallet"
    //                 );
    //             });
    //
    //             it("should fail to buy and refund balance when non-accredited cap already reached", async() => {
    //                 // Make sure investor has reached cap
    //                 let investmentToDate_USD = await I_USDTieredSTO_Array[0].investorInvestedUSD.call(NONACCREDITED1);
    //                 if (_nonAccreditedLimitUSD > investmentToDate_USD) {
    //                     let remaining_USD = _nonAccreditedLimitUSD.sub(investmentToDate_USD);
    //                     let remaining_ETH = remaining_USD.div(USDETH).mul(10**18);  // USD / USD/ETH = ETH
    //                     await I_USDTieredSTO_Array[0].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, gas: 2100000, value: remaining_ETH, gasPrice: 100000000000 });
    //                 }
    //
    //                 let investment_USD = BigNumber(web3.utils.toWei('50'));         // USD
    //                 let investment_ETH = investment_USD.div(USDETH).mul(10**18);    // USD / USD/ETH = ETH
    //                 let investment_POLY = investment_USD.div(USDPOLY).mul(10**18);  // USD / USD/POLY = POLY
    //
    //                 await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
    //                 await I_PolyToken.approve(I_USDTieredSTO_Array[0].address, investment_POLY, {from: NONACCREDITED1});
    //
    //                 let init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
    //                 let init_InvestorETHBal = BigNumber(await web3.eth.getBalance(NONACCREDITED1));
    //                 let init_RaisedETH = await I_USDTieredSTO_Array[0].fundsRaisedETH.call();
    //                 let init_WalletETHBal = BigNumber(await web3.eth.getBalance(_wallet));
    //                 let init_InvestorPOLYBal = BigNumber(await I_PolyToken.balanceOf(NONACCREDITED1));
    //                 let init_RaisedPOLY = await I_USDTieredSTO_Array[0].fundsRaisedPOLY.call();
    //                 let init_WalletPOLYBal = await I_PolyToken.balanceOf(_wallet);
    //
    //                 // Buy with ETH
    //                 let errorThrown1 = false;
    //                 try {
    //                     await I_USDTieredSTO_Array[0].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, gas: 2100000, value: investment_ETH, gasPrice: 100000000000 });
    //                 } catch(error) {
    //                     console.log(`         tx revert -> arrays are of different size`.grey);
    //                     errorThrown1 = true;
    //                     ensureException(error);
    //                 }
    //                 assert.ok(errorThrown1, 'ETH investment succeeded when it should fail');
    //
    //                 // Buy with POLY
    //                 let errorThrown2 = false;
    //                 try {
    //                     await I_USDTieredSTO_Array[0].buyWithPOLY(NONACCREDITED1, investment_POLY, {from: NONACCREDITED1});
    //                 } catch(error) {
    //                     console.log(`         tx revert -> arrays are of different size`.grey);
    //                     errorThrown2 = true;
    //                     ensureException(error);
    //                 }
    //                 assert.ok(errorThrown2, 'POLY investment succeeded when it should fail');
    //
    //                 let final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
    //                 let final_InvestorETHBal = BigNumber(await web3.eth.getBalance(NONACCREDITED1));
    //                 let final_RaisedETH = await I_USDTieredSTO_Array[0].fundsRaisedETH.call();
    //                 let final_WalletETHBal = BigNumber(await web3.eth.getBalance(_wallet));
    //                 let final_InvestorPOLYBal = BigNumber(await I_PolyToken.balanceOf(NONACCREDITED1));
    //                 let final_RaisedPOLY = await I_USDTieredSTO_Array[0].fundsRaisedPOLY.call();
    //                 let final_WalletPOLYBal = await I_PolyToken.balanceOf(_wallet);
    //
    //                 assert.equal(
    //                     final_InvestorTokenBal.toNumber(),
    //                     init_InvestorTokenBal.toNumber(),
    //                     "Token was not transfered to the investor"
    //                 );
    //                 assert.equal(
    //                     final_InvestorETHBal.toNumber(),
    //                     init_InvestorETHBal.toNumber(),
    //                     "ETH was not refunded to the investor"
    //                 );
    //                 assert.equal(
    //                     final_RaisedETH.toNumber(),
    //                     init_RaisedETH.toNumber(),
    //                     "ETH was not transfered to the contract"
    //                 );
    //                 assert.equal(
    //                     final_WalletETHBal.toNumber(),
    //                     init_WalletETHBal.toNumber(),
    //                     "ETH was not transfered to the wallet"
    //                 );
    //                 assert.equal(
    //                     final_InvestorPOLYBal.toNumber(),
    //                     init_InvestorPOLYBal.toNumber(),
    //                     "POLY was not refunded to the investor"
    //                 );
    //                 assert.equal(
    //                     final_RaisedPOLY.toNumber(),
    //                     init_RaisedPOLY.toNumber(),
    //                     "POLY was not transfered to the contract"
    //                 );
    //                 assert.equal(
    //                     final_WalletPOLYBal.toNumber(),
    //                     init_WalletPOLYBal.toNumber(),
    //                     "POLY was not transfered to the wallet"
    //                 );
    //             });
    //
    //             it("should fail to buy despite oracle price change when reaching non-accredited cap", async() => {
    //                 // Make sure investor has reached cap
    //                 let investmentToDate_USD = await I_USDTieredSTO_Array[0].investorInvestedUSD.call(NONACCREDITED1);
    //                 if (_nonAccreditedLimitUSD > investmentToDate_USD) {
    //                     let remaining_USD = _nonAccreditedLimitUSD.sub(investmentToDate_USD);
    //                     let remaining_ETH = remaining_USD.div(USDETH).mul(10**18);  // USD / USD/ETH = ETH
    //                     await I_USDTieredSTO_Array[0].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, gas: 2100000, value: remaining_ETH, gasPrice: 100000000000 });
    //                 }
    //
    //                 let init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
    //                 let init_InvestorETHBal = BigNumber(await web3.eth.getBalance(NONACCREDITED1));
    //                 let init_RaisedETH = await I_USDTieredSTO_Array[0].fundsRaisedETH.call();
    //                 let init_WalletETHBal = BigNumber(await web3.eth.getBalance(_wallet));
    //                 let init_InvestorPOLYBal = BigNumber(await I_PolyToken.balanceOf(NONACCREDITED1));
    //                 let init_RaisedPOLY = await I_USDTieredSTO_Array[0].fundsRaisedPOLY.call();
    //                 let init_WalletPOLYBal = await I_PolyToken.balanceOf(_wallet);
    //
    //                 let snap = await takeSnapshot();
    //
    //                 // Change exchange rates up
    //                 let new_USDETH = BigNumber(750).mul(10**18); // 750 USD per ETH
    //                 let new_USDPOLY = BigNumber(50).mul(10**16); // 0.5 USD per POLY
    //                 await I_USDOracle.changePrice(new_USDETH, { from: POLYMATH });
    //                 await I_POLYOracle.changePrice(new_USDPOLY, { from: POLYMATH });
    //
    //                 let investment_USD = BigNumber(web3.utils.toWei('50'));            // USD
    //                 let investment_ETH = investment_USD.div(new_USDETH).mul(10**18);   // USD / USD/ETH = ETH
    //                 let investment_POLY = investment_USD.div(new_USDPOLY).mul(10**18); // USD / USD/POLY = POLY
    //
    //                 await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
    //                 await I_PolyToken.approve(I_USDTieredSTO_Array[0].address, investment_POLY, {from: NONACCREDITED1});
    //
    //                 // Buy with ETH
    //                 let errorThrown1 = false;
    //                 try {
    //                     await I_USDTieredSTO_Array[0].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, gas: 2100000, value: investment_ETH, gasPrice: 100000000000 });
    //                 } catch(error) {
    //                     console.log(`         tx revert -> arrays are of different size`.grey);
    //                     errorThrown1 = true;
    //                     ensureException(error);
    //                 }
    //                 assert.ok(errorThrown1, 'ETH investment succeeded when it should fail after oracle price increase');
    //
    //                 // Buy with POLY
    //                 let errorThrown2 = false;
    //                 try {
    //                     await I_USDTieredSTO_Array[0].buyWithPOLY(NONACCREDITED1, investment_POLY, {from: NONACCREDITED1});
    //                 } catch(error) {
    //                     console.log(`         tx revert -> arrays are of different size`.grey);
    //                     errorThrown2 = true;
    //                     ensureException(error);
    //                 }
    //                 assert.ok(errorThrown2, 'POLY investment succeeded when it should fail after oracle price increase');
    //
    //                 let final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
    //                 let final_InvestorETHBal = BigNumber(await web3.eth.getBalance(NONACCREDITED1));
    //                 let final_RaisedETH = await I_USDTieredSTO_Array[0].fundsRaisedETH.call();
    //                 let final_WalletETHBal = BigNumber(await web3.eth.getBalance(_wallet));
    //                 let final_InvestorPOLYBal = BigNumber(await I_PolyToken.balanceOf(NONACCREDITED1));
    //                 let final_RaisedPOLY = await I_USDTieredSTO_Array[0].fundsRaisedPOLY.call();
    //                 let final_WalletPOLYBal = await I_PolyToken.balanceOf(_wallet);
    //
    //                 assert.equal(
    //                     final_InvestorTokenBal.toNumber(),
    //                     init_InvestorTokenBal.toNumber(),
    //                     "Token was not transfered to the investor"
    //                 );
    //                 assert.equal(
    //                     final_InvestorETHBal.toNumber(),
    //                     init_InvestorETHBal.toNumber(),
    //                     "ETH was not refunded to the investor"
    //                 );
    //                 assert.equal(
    //                     final_RaisedETH.toNumber(),
    //                     init_RaisedETH.toNumber(),
    //                     "ETH was not transfered to the contract"
    //                 );
    //                 assert.equal(
    //                     final_WalletETHBal.toNumber(),
    //                     init_WalletETHBal.toNumber(),
    //                     "ETH was not transfered to the wallet"
    //                 );
    //                 assert.equal(
    //                     final_InvestorPOLYBal.toNumber(),
    //                     init_InvestorPOLYBal.toNumber(),
    //                     "POLY was not refunded to the investor"
    //                 );
    //                 assert.equal(
    //                     final_RaisedPOLY.toNumber(),
    //                     init_RaisedPOLY.toNumber(),
    //                     "POLY was not transfered to the contract"
    //                 );
    //                 assert.equal(
    //                     final_WalletPOLYBal.toNumber(),
    //                     init_WalletPOLYBal.toNumber(),
    //                     "POLY was not transfered to the wallet"
    //                 );
    //                 await revertToSnapshot(snap);
    //
    //                 // Change exchange rates down
    //                 new_USDETH = BigNumber(250).mul(10**18); // 250 USD per ETH
    //                 new_USDPOLY = BigNumber(15).mul(10**16); // 0.15 USD per POLY
    //                 await I_USDOracle.changePrice(new_USDETH, { from: POLYMATH });
    //                 await I_POLYOracle.changePrice(new_USDPOLY, { from: POLYMATH });
    //
    //                 investment_USD = BigNumber(web3.utils.toWei('50'));            // USD
    //                 investment_ETH = investment_USD.div(new_USDETH).mul(10**18);   // USD / USD/ETH = ETH
    //                 investment_POLY = investment_USD.div(new_USDPOLY).mul(10**18); // USD / USD/POLY = POLY
    //
    //                 await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
    //                 await I_PolyToken.approve(I_USDTieredSTO_Array[0].address, investment_POLY, {from: NONACCREDITED1});
    //
    //                 // Buy with ETH
    //                 let errorThrown3 = false;
    //                 try {
    //                     await I_USDTieredSTO_Array[0].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, gas: 2100000, value: investment_ETH, gasPrice: 100000000000 });
    //                 } catch(error) {
    //                     console.log(`         tx revert -> arrays are of different size`.grey);
    //                     errorThrown3 = true;
    //                     ensureException(error);
    //                 }
    //                 assert.ok(errorThrown3, 'ETH investment succeeded when it should fail after oracle price decrease');
    //
    //                 // Buy with POLY
    //                 let errorThrown4 = false;
    //                 try {
    //                     await I_USDTieredSTO_Array[0].buyWithPOLY(NONACCREDITED1, investment_POLY, {from: NONACCREDITED1});
    //                 } catch(error) {
    //                     console.log(`         tx revert -> arrays are of different size`.grey);
    //                     errorThrown4 = true;
    //                     ensureException(error);
    //                 }
    //                 assert.ok(errorThrown4, 'POLY investment succeeded when it should fail after oracle price decrease');
    //
    //                 final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
    //                 final_InvestorETHBal = BigNumber(await web3.eth.getBalance(NONACCREDITED1));
    //                 final_RaisedETH = await I_USDTieredSTO_Array[0].fundsRaisedETH.call();
    //                 final_WalletETHBal = BigNumber(await web3.eth.getBalance(_wallet));
    //                 final_InvestorPOLYBal = BigNumber(await I_PolyToken.balanceOf(NONACCREDITED1));
    //                 final_RaisedPOLY = await I_USDTieredSTO_Array[0].fundsRaisedPOLY.call();
    //                 final_WalletPOLYBal = await I_PolyToken.balanceOf(_wallet);
    //
    //                 assert.equal(
    //                     final_InvestorTokenBal.toNumber(),
    //                     init_InvestorTokenBal.toNumber(),
    //                     "Token was not transfered to the investor"
    //                 );
    //                 assert.equal(
    //                     final_InvestorETHBal.toNumber(),
    //                     init_InvestorETHBal.toNumber(),
    //                     "ETH was not refunded to the investor"
    //                 );
    //                 assert.equal(
    //                     final_RaisedETH.toNumber(),
    //                     init_RaisedETH.toNumber(),
    //                     "ETH was not transfered to the contract"
    //                 );
    //                 assert.equal(
    //                     final_WalletETHBal.toNumber(),
    //                     init_WalletETHBal.toNumber(),
    //                     "ETH was not transfered to the wallet"
    //                 );
    //                 assert.equal(
    //                     final_InvestorPOLYBal.toNumber(),
    //                     init_InvestorPOLYBal.toNumber(),
    //                     "POLY was not refunded to the investor"
    //                 );
    //                 assert.equal(
    //                     final_RaisedPOLY.toNumber(),
    //                     init_RaisedPOLY.toNumber(),
    //                     "POLY was not transfered to the contract"
    //                 );
    //                 assert.equal(
    //                     final_WalletPOLYBal.toNumber(),
    //                     init_WalletPOLYBal.toNumber(),
    //                     "POLY was not transfered to the wallet"
    //                 );
    //                 await revertToSnapshot(snap);
    //             });
    //
    //             it("should buy out the rest of the STO", async() => {
    //                 // Buy out the rest of the tokens in the STO
    //                 let usdPrep;
    //                 for (var i = 0; i < _tokensPerTier_LOW.length; i++) {
    //                     usdPrep.add(_tokensPerTier_LOW[i].div(10**18).mul(_ratePerTier[i].div(10**18)));
    //                 }
    //                 let ethPrep = usdPrep.div(USDETH.div(10**18)).mul(10**18);                                 // 9 USD / 500 USD/ETH = 0.018 ETH
    //
    //                 await I_USDTieredSTO_Array[1].buyWithETH(ACCREDITED1, { from: ACCREDITED1, value: ethPrep });
    //
    //                 snapId_SoldOut = await takeSnapshot();
    //             });
    //
    //             it("should fail to buy when all tiers sold out for NONACCREDITED ETH", async() => {
    //                 // Prep for investments
    //                 let investment_USD = BigNumber(web3.utils.toWei('50'));        // USD
    //                 let investment_ETH = investment_USD.div(USDETH).mul(10**18);   // USD / USD/ETH = ETH
    //                 let investment_POLY = investment_USD.div(USDPOLY).mul(10**18); // USD / USD/POLY = POLY
    //
    //                 await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
    //                 await I_PolyToken.approve(I_USDTieredSTO_Array[1].address, investment_POLY, {from: NONACCREDITED1});
    //                 await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
    //                 await I_PolyToken.approve(I_USDTieredSTO_Array[1].address, investment_POLY, {from: ACCREDITED1});
    //
    //                 // Buy with ETH NONACCREDITED
    //                 let errorThrown1 = false;
    //                 try {
    //                     await I_USDTieredSTO_Array[1].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, gas: 2100000, value: investment_ETH, gasPrice: 100000000000 });
    //                 } catch(error) {
    //                     console.log(`         tx revert -> arrays are of different size`.grey);
    //                     errorThrown1 = true;
    //                     ensureException(error);
    //                 }
    //                 assert.ok(errorThrown1, 'ETH NONACCREDITED investment succeeded when it should fail');
    //
    //                 // Buy with POLY NONACCREDITED
    //                 let errorThrown2 = false;
    //                 try {
    //                     await I_USDTieredSTO_Array[1].buyWithPOLY(NONACCREDITED1, investment_POLY, {from: NONACCREDITED1});
    //                 } catch(error) {
    //                     console.log(`         tx revert -> arrays are of different size`.grey);
    //                     errorThrown2 = true;
    //                     ensureException(error);
    //                 }
    //                 assert.ok(errorThrown2, 'POLY NONACCREDITED investment succeeded when it should fail');
    //
    //                 // Buy with ETH ACCREDITED
    //                 let errorThrown3 = false;
    //                 try {
    //                     await I_USDTieredSTO_Array[1].buyWithETH(ACCREDITED, { from: ACCREDITED, gas: 2100000, value: investment_ETH, gasPrice: 100000000000 });
    //                 } catch(error) {
    //                     console.log(`         tx revert -> arrays are of different size`.grey);
    //                     errorThrown3 = true;
    //                     ensureException(error);
    //                 }
    //                 assert.ok(errorThrown3, 'ETH ACCREDITED investment succeeded when it should fail');
    //
    //                 // Buy with POLY ACCREDITED
    //                 let errorThrown4 = false;
    //                 try {
    //                     await I_USDTieredSTO_Array[1].buyWithPOLY(ACCREDITED, investment_POLY, {from: ACCREDITED});
    //                 } catch(error) {
    //                     console.log(`         tx revert -> arrays are of different size`.grey);
    //                     errorThrown4 = true;
    //                     ensureException(error);
    //                 }
    //                 assert.ok(errorThrown4, 'POLY ACCREDITED investment succeeded when it should fail');
    //             });
    //
    //             it("should fail to buy when all tiers sold out despite oracle price change", async() => {
    //                 // Change exchange rates up
    //                 let new_USDETH = BigNumber(750).mul(10**18); // 750 USD per ETH
    //                 let new_USDPOLY = BigNumber(50).mul(10**16); // 0.5 USD per POLY
    //                 await I_USDOracle.changePrice(new_USDETH, { from: POLYMATH });
    //                 await I_POLYOracle.changePrice(new_USDPOLY, { from: POLYMATH });
    //
    //                 let investment_USD = BigNumber(web3.utils.toWei('50'));            // USD
    //                 let investment_ETH = investment_USD.div(new_USDETH).mul(10**18);   // USD / USD/ETH = ETH
    //                 let investment_POLY = investment_USD.div(new_USDPOLY).mul(10**18); // USD / USD/POLY = POLY
    //
    //                 await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
    //                 await I_PolyToken.approve(I_USDTieredSTO_Array[1].address, investment_POLY, {from: NONACCREDITED1});
    //                 await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
    //                 await I_PolyToken.approve(I_USDTieredSTO_Array[1].address, investment_POLY, {from: ACCREDITED1});
    //
    //                 // Buy with ETH NONACCREDITED
    //                 let errorThrown1 = false;
    //                 try {
    //                     await I_USDTieredSTO_Array[1].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, gas: 2100000, value: investment_ETH, gasPrice: 100000000000 });
    //                 } catch(error) {
    //                     console.log(`         tx revert -> arrays are of different size`.grey);
    //                     errorThrown1 = true;
    //                     ensureException(error);
    //                 }
    //                 assert.ok(errorThrown1, 'ETH NONACCREDITED investment succeeded when it should fail');
    //
    //                 // Buy with POLY NONACCREDITED
    //                 let errorThrown2 = false;
    //                 try {
    //                     await I_USDTieredSTO_Array[1].buyWithPOLY(NONACCREDITED1, investment_POLY, {from: NONACCREDITED1});
    //                 } catch(error) {
    //                     console.log(`         tx revert -> arrays are of different size`.grey);
    //                     errorThrown2 = true;
    //                     ensureException(error);
    //                 }
    //                 assert.ok(errorThrown2, 'POLY NONACCREDITED investment succeeded when it should fail');
    //
    //                 // Buy with ETH ACCREDITED
    //                 let errorThrown3 = false;
    //                 try {
    //                     await I_USDTieredSTO_Array[1].buyWithETH(ACCREDITED, { from: ACCREDITED, gas: 2100000, value: investment_ETH, gasPrice: 100000000000 });
    //                 } catch(error) {
    //                     console.log(`         tx revert -> arrays are of different size`.grey);
    //                     errorThrown3 = true;
    //                     ensureException(error);
    //                 }
    //                 assert.ok(errorThrown3, 'ETH ACCREDITED investment succeeded when it should fail');
    //
    //                 // Buy with POLY ACCREDITED
    //                 let errorThrown4 = false;
    //                 try {
    //                     await I_USDTieredSTO_Array[1].buyWithPOLY(ACCREDITED, investment_POLY, {from: ACCREDITED});
    //                 } catch(error) {
    //                     console.log(`         tx revert -> arrays are of different size`.grey);
    //                     errorThrown4 = true;
    //                     ensureException(error);
    //                 }
    //                 assert.ok(errorThrown4, 'POLY ACCREDITED investment succeeded when it should fail');
    //
    //                 // Change exchange rates down
    //                 new_USDETH = BigNumber(250).mul(10**18); // 250 USD per ETH
    //                 new_USDPOLY = BigNumber(15).mul(10**16); // 0.15 USD per POLY
    //                 await I_USDOracle.changePrice(new_USDETH, { from: POLYMATH });
    //                 await I_POLYOracle.changePrice(new_USDPOLY, { from: POLYMATH });
    //
    //                 investment_USD = BigNumber(web3.utils.toWei('50'));            // USD
    //                 investment_ETH = investment_USD.div(new_USDETH).mul(10**18);   // USD / USD/ETH = ETH
    //                 investment_POLY = investment_USD.div(new_USDPOLY).mul(10**18); // USD / USD/POLY = POLY
    //
    //                 await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
    //                 await I_PolyToken.approve(I_USDTieredSTO_Array[1].address, investment_POLY, {from: NONACCREDITED1});
    //                 await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
    //                 await I_PolyToken.approve(I_USDTieredSTO_Array[1].address, investment_POLY, {from: ACCREDITED1});
    //
    //                 // Buy with ETH NONACCREDITED
    //                 let errorThrown5 = false;
    //                 try {
    //                     await I_USDTieredSTO_Array[1].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, gas: 2100000, value: investment_ETH, gasPrice: 100000000000 });
    //                 } catch(error) {
    //                     console.log(`         tx revert -> arrays are of different size`.grey);
    //                     errorThrown5 = true;
    //                     ensureException(error);
    //                 }
    //                 assert.ok(errorThrown5, 'ETH NONACCREDITED investment succeeded when it should fail');
    //
    //                 // Buy with POLY NONACCREDITED
    //                 let errorThrown6 = false;
    //                 try {
    //                     await I_USDTieredSTO_Array[1].buyWithPOLY(NONACCREDITED1, investment_POLY, {from: NONACCREDITED1});
    //                 } catch(error) {
    //                     console.log(`         tx revert -> arrays are of different size`.grey);
    //                     errorThrown6 = true;
    //                     ensureException(error);
    //                 }
    //                 assert.ok(errorThrown6, 'POLY NONACCREDITED investment succeeded when it should fail');
    //
    //                 // Buy with ETH ACCREDITED
    //                 let errorThrown7 = false;
    //                 try {
    //                     await I_USDTieredSTO_Array[1].buyWithETH(ACCREDITED, { from: ACCREDITED, gas: 2100000, value: investment_ETH, gasPrice: 100000000000 });
    //                 } catch(error) {
    //                     console.log(`         tx revert -> arrays are of different size`.grey);
    //                     errorThrown7 = true;
    //                     ensureException(error);
    //                 }
    //                 assert.ok(errorThrown7, 'ETH ACCREDITED investment succeeded when it should fail');
    //
    //                 // Buy with POLY ACCREDITED
    //                 let errorThrown8 = false;
    //                 try {
    //                     await I_USDTieredSTO_Array[1].buyWithPOLY(ACCREDITED, investment_POLY, {from: ACCREDITED});
    //                 } catch(error) {
    //                     console.log(`         tx revert -> arrays are of different size`.grey);
    //                     errorThrown8 = true;
    //                     ensureException(error);
    //                 }
    //                 assert.ok(errorThrown8, 'POLY ACCREDITED investment succeeded when it should fail');
    //
    //                 await revertToSnapshot(snapId_SoldOut);
    //             });
    //         });
    //     });
    // });
    //
    // describe("Test onlyOwner function", async() => {
    //
    //     describe("finalize", async() => {
    //
    //     });
    // });
    //
    // describe("Test getter functions", async() => {
    //
    //     describe("capReached", async() => {
    //
    //     });
    //
    //     describe("getRaisedEther", async() => {
    //
    //     });
    //
    //     describe("getRaisedPOLY", async() => {
    //
    //     });
    //
    //     describe("getRaisedUSD", async() => {
    //
    //     });
    //
    //     describe("getNumberInvestors", async() => {
    //
    //     });
    //
    //     describe("getTokensSold", async() => {
    //
    //     });
    //
    //     describe("getPermissions", async() => {
    //
    //     });
    //
    //     describe("convertToUSD", async() => {
    //
    //         it("should get the right conversion for ETH to USD", async() => {
    //             // 20 ETH to 10000 USD
    //             let ethInWei = BigNumber(web3.utils.toWei('20', 'ether'));
    //             let usdInWei = await I_USDTieredSTO_Array[0].convertToUSD("ETH", ethInWei);
    //             assert.equal(usdInWei.div(10**18).toNumber(), ethInWei.div(10**18).mul(USDETH.div(10**18)).toNumber());
    //         });
    //
    //         it("should get the right conversion for POLY to USD", async() => {
    //             // 40000 POLY to 10000 USD
    //             let polyInWei = BigNumber(web3.utils.toWei('40000', 'ether'));
    //             let usdInWei = await I_USDTieredSTO_Array[0].convertToUSD("POLY", polyInWei);
    //             assert.equal(usdInWei.div(10**18).toNumber(), polyInWei.div(10**18).mul(USDPOLY.div(10**18)).toNumber());
    //         });
    //     });
    //
    //     describe("convertFromUSD", async() => {
    //
    //         it("should get the right conversion for USD to ETH", async() => {
    //             // 10000 USD to 20 ETH
    //             let usdInWei = BigNumber(web3.utils.toWei('10000', 'ether'));
    //             let ethInWei = await I_USDTieredSTO_Array[0].convertFromUSD("ETH", usdInWei);
    //             assert.equal(ethInWei.div(10**18).toNumber(), usdInWei.div(10**18).div(USDETH.div(10**18)).toNumber());
    //         });
    //
    //         it("should get the right conversion for USD to POLY", async() => {
    //             // 10000 USD to 40000 POLY
    //             let usdInWei = BigNumber(web3.utils.toWei('10000', 'ether'));
    //             let polyInWei = await I_USDTieredSTO_Array[0].convertFromUSD("POLY", usdInWei);
    //             assert.equal(polyInWei.div(10**18).toNumber(), usdInWei.div(10**18).div(USDPOLY.div(10**18)).toNumber());
    //         });
    //     });
    //
    //     describe("isOpen", async() => {
    //
    //     });
    });
});
