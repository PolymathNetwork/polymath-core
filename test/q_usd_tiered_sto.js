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
    const GAS_PRICE = 100000000000;

    // Snapshot variables
    let snapId_beforeTierChange_sto1;

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
    let _startTime = latestTime() + duration.days(2);
    let _endTime  = _startTime + duration.days(100);
    const _ratePerTier = [BigNumber(10*10**16), BigNumber(15*10**16)];                                                   // [ 0.10 USD/Token, 0.15 USD/Token ]
    const _ratePerTierDiscountPoly = [BigNumber(10*10**16), BigNumber(12*10**16)];                                       // [ 0.10 USD/Token, 0.12 USD/Token ]
    const _tokensPerTier = [BigNumber(100000000).mul(BigNumber(10**18)), BigNumber(200000000).mul(BigNumber(10**18))];   // [ 100m token, 200m token ]
    const _tokensPerTierDiscountPoly = [0,BigNumber(50000000).mul(BigNumber(10**18))];                                   // [ 0, 50m token ]
    let _securityTokenRegistry;
    const _nonAccreditedLimitUSD = BigNumber(10000).mul(BigNumber(10**18));   // 10k USD
    const _minimumInvestmentUSD = 0;
    const _fundRaiseTypes = [0, 1];
    let _wallet;
    let _reserveWallet;

    const _tokensPerTier_LOW = [BigNumber(100*10**18), BigNumber(200*10**18)];   // [ 100 token, 200 token ]
    const _tokensPerTierDiscountPoly_LOW = [0,BigNumber(50*10**18)];             // [ 0 token, 50 token ]

    /* function configure(
        uint256 _startTime,
        uint256 _endTime,
        uint256[] _ratePerTier,
        uint256[] _ratePerTierDiscountPoly,
        uint256[] _tokensPerTier,
        uint256[] _tokensPerTierDiscountPoly,
        address _securityTokenRegistry,
        uint256 _nonAccreditedLimitUSD,
        uint256 _minimumInvestmentUSD,
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
            name: '_ratePerTierDiscountPoly'
        },{
            type: 'uint256[]',
            name: '_tokensPerTier'
        },{
            type: 'uint256[]',
            name: '_tokensPerTierDiscountPoly'
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

    async function convert(_currencyFrom, _currencyTo, _amount, _tier, _discount, _stoID) {
        let USDTOKEN;
        if (_discount && (_currencyTo == "POLY" || _currencyFrom == "POLY")) {
            USDTOKEN = await I_USDTieredSTO_Array[_stoID].ratePerTierDiscountPoly.call(_tier);
        } else {
            USDTOKEN = await I_USDTieredSTO_Array[_stoID].ratePerTier.call(_tier);
        }

        if (_currencyFrom == "TOKEN") {
            let tokenToUSD = _amount.div(10**18).mul(USDTOKEN.div(10**18)).mul(10**18); // TOKEN * USD/TOKEN = USD
            // TOKEN -> USD
            if (_currencyTo == "USD") {
                return tokenToUSD;
            }
            // TOKEN -> ETH or POLY
            if (_currencyTo == "ETH" || _currencyTo == "POLY") {
                return await I_USDTieredSTO_Array[_stoID].convertFromUSD(_currencyTo, tokenToUSD);
            }
        }
        if (_currencyFrom == "USD") {
            // USD -> TOKEN
            if (_currencyTo == "TOKEN") {
                return _amount.div(USDTOKEN).mul(10**18); // USD / USD/TOKEN = TOKEN
            }
            // USD -> ETH or POLY
            if (_currencyTo == "ETH" || _currencyTo == "POLY") {
                return await I_USDTieredSTO_Array[_stoID].convertFromUSD(_currencyTo, _amount);
            }
        }
        if (_currencyFrom == "ETH" || _currencyFrom == "POLY") {
            let ethToUSD = await I_USDTieredSTO_Array[_stoID].convertToUSD(_currencyTo, _amount);
            // ETH or POLY -> USD
            if (_currencyTo == "USD") {
                return ethToUSD;
            }
            // ETH or POLY -> TOKEN
            if (_currencyTo == "TOKEN") {
                return ethToUSD.div(USDTOKEN).mul(10**18); // USD / USD/TOKEN = TOKEN
            }
        }
        return 0;
    }

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

            _startTime = latestTime() + duration.days(2);
            _endTime  = _startTime + duration.days(100);

            let ratePerTier = [10];
            let ratePerTierDiscountPoly = [10];
            let tokensPerTier = [10];
            let tokensPerTierDiscountPoly = [10];
            let config = [
                [_startTime, _endTime, ratePerTier, _ratePerTierDiscountPoly, _tokensPerTier, _tokensPerTierDiscountPoly, _securityTokenRegistry, _nonAccreditedLimitUSD, _minimumInvestmentUSD, _fundRaiseTypes, _wallet, _reserveWallet],
                [_startTime, _endTime, _ratePerTier, ratePerTierDiscountPoly, _tokensPerTier, _tokensPerTierDiscountPoly, _securityTokenRegistry, _nonAccreditedLimitUSD, _minimumInvestmentUSD, _fundRaiseTypes, _wallet, _reserveWallet],
                [_startTime, _endTime, _ratePerTier, _ratePerTierDiscountPoly, tokensPerTier, _tokensPerTierDiscountPoly, _securityTokenRegistry, _nonAccreditedLimitUSD, _minimumInvestmentUSD, _fundRaiseTypes, _wallet, _reserveWallet],
                [_startTime, _endTime, _ratePerTier, _ratePerTierDiscountPoly, _tokensPerTier, tokensPerTierDiscountPoly, _securityTokenRegistry, _nonAccreditedLimitUSD, _minimumInvestmentUSD, _fundRaiseTypes, _wallet, _reserveWallet]
            ];
            for (var i = 0; i < config.length; i++) {
                let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config[i]);
                let errorThrown = false;
                try {
                    await I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, 0, 0, { from: ISSUER, gas: 4500000 });
                } catch(error) {
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, MESSAGE);
            }
        });

        it("Should fail because rate of token should be greater than 0", async() => {
            let ratePerTier = [BigNumber(10*10**16), 0];
            let config = [_startTime, _endTime, ratePerTier, _ratePerTierDiscountPoly, _tokensPerTier, _tokensPerTierDiscountPoly, _securityTokenRegistry, _nonAccreditedLimitUSD, _minimumInvestmentUSD, _fundRaiseTypes, _wallet, _reserveWallet];
            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            let errorThrown = false;
            try {
                await I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, 0, 0, { from: ISSUER, gas: 4500000 });
            } catch(error) {
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, MESSAGE);
        });

        it("Should fail because Zero address is not permitted for wallet", async() => {
            let wallet = "0x0000000000000000000000000000000000000000";
            let config = [_startTime, _endTime, _ratePerTier, _ratePerTierDiscountPoly, _tokensPerTier, _tokensPerTierDiscountPoly, _securityTokenRegistry, _nonAccreditedLimitUSD, _minimumInvestmentUSD, _fundRaiseTypes, wallet, _reserveWallet];
            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            let errorThrown = false;
            try {
                await I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, 0, 0, { from: ISSUER, gas: 4500000 });
            } catch(error) {
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, MESSAGE);
        });

        it("Should fail because Zero address is not permitted for reserveWallet", async() => {
            let reserveWallet = "0x0000000000000000000000000000000000000000";
            let config = [_startTime, _endTime, _ratePerTier, _ratePerTierDiscountPoly, _tokensPerTier, _tokensPerTierDiscountPoly, _securityTokenRegistry, _nonAccreditedLimitUSD, _minimumInvestmentUSD, _fundRaiseTypes, _wallet, reserveWallet];
            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            let errorThrown = false;
            try {
                await I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, 0, 0, { from: ISSUER, gas: 4500000 });
            } catch(error) {
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, MESSAGE);
        });

        it("Should fail because end time before start time", async() => {
            let startTime = latestTime() + duration.days(35);
            let endTime  = latestTime() + duration.days(1);
            let config = [startTime, endTime, _ratePerTier, _ratePerTierDiscountPoly, _tokensPerTier, _tokensPerTierDiscountPoly, _securityTokenRegistry, _nonAccreditedLimitUSD, _minimumInvestmentUSD, _fundRaiseTypes, _wallet, _reserveWallet];
            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            let errorThrown = false;
            try {
                await I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, 0, 0, { from: ISSUER, gas: 4500000 });
            } catch(error) {
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, MESSAGE);
        });

        it("Should fail because start time is in the past", async() => {
            let startTime = latestTime() - duration.days(35);
            let endTime  = startTime + duration.days(50);
            let config = [startTime, endTime, _ratePerTier, _ratePerTierDiscountPoly, _tokensPerTier, _tokensPerTierDiscountPoly, _securityTokenRegistry, _nonAccreditedLimitUSD, _minimumInvestmentUSD, _fundRaiseTypes, _wallet, _reserveWallet];
            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            let errorThrown = false;
            try {
                await I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, 0, 0, { from: ISSUER, gas: 4500000 });
            } catch(error) {
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, MESSAGE);
        });

        it("Should fail because Zero address is not permitted for security token registry", async() => {
            let securityTokenRegistry = "0x0000000000000000000000000000000000000000";
            let config = [_startTime, _endTime, _ratePerTier, _ratePerTierDiscountPoly, _tokensPerTier, _tokensPerTierDiscountPoly, securityTokenRegistry, _nonAccreditedLimitUSD, _minimumInvestmentUSD, _fundRaiseTypes, _wallet, _reserveWallet];
            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            let errorThrown = false;
            try {
                await I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, 0, 0, { from: ISSUER, gas: 4500000 });
            } catch(error) {
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, MESSAGE);
        });

        it("Should successfully attach the first STO module to the security token", async () => {
            console.log('ISSUER ETH Balance: '+BigNumber(await web3.eth.getBalance(ISSUER)).div(10**18));
            let config = [_startTime, _endTime, _ratePerTier, _ratePerTierDiscountPoly, _tokensPerTier, _tokensPerTierDiscountPoly, _securityTokenRegistry, _nonAccreditedLimitUSD, _minimumInvestmentUSD, _fundRaiseTypes, _wallet, _reserveWallet];
            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            let tx = await I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, 0, 0, { from: ISSUER, gas: 5000000, gasPrice: GAS_PRICE });
            console.log("             Gas addModule: ".grey+tx.receipt.gasUsed.toString().grey);
            assert.equal(tx.logs[2].args._type, STOKEY, "USDTieredSTO doesn't get deployed");
            assert.equal(web3.utils.hexToString(tx.logs[2].args._name),"USDTieredSTO","USDTieredSTOFactory module was not added");
            I_USDTieredSTO_Array.push(USDTieredSTO.at(tx.logs[2].args._module));
        });

        it("Should successfully attach the second STO module to the security token", async () => {
            console.log('ISSUER ETH Balance: '+BigNumber(await web3.eth.getBalance(ISSUER)).div(10**18));
            let config = [_startTime, _endTime, _ratePerTier, _ratePerTierDiscountPoly, _tokensPerTier_LOW, _tokensPerTierDiscountPoly_LOW, _securityTokenRegistry, _nonAccreditedLimitUSD, _minimumInvestmentUSD, _fundRaiseTypes, _wallet, _reserveWallet];
            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            let tx = await I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, 0, 0, { from: ISSUER, gas: 5000000, gasPrice: GAS_PRICE });
            console.log("             Gas addModule: ".grey+tx.receipt.gasUsed.toString().grey);
            assert.equal(tx.logs[2].args._type, STOKEY, "USDTieredSTO doesn't get deployed");
            assert.equal(web3.utils.hexToString(tx.logs[2].args._name),"USDTieredSTO","USDTieredSTOFactory module was not added");
            I_USDTieredSTO_Array.push(USDTieredSTO.at(tx.logs[2].args._module));
        });

        it("Should successfully attach the third STO module to the security token", async () => {
            console.log('ISSUER ETH Balance: '+BigNumber(await web3.eth.getBalance(ISSUER)).div(10**18));
            let endTime = latestTime() + duration.days(2);
            let config = [_startTime, endTime, _ratePerTier, _ratePerTierDiscountPoly, _tokensPerTier_LOW, _tokensPerTierDiscountPoly_LOW, _securityTokenRegistry, _nonAccreditedLimitUSD, _minimumInvestmentUSD, _fundRaiseTypes, _wallet, _reserveWallet];
            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            let tx = await I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, 0, 0, { from: ISSUER, gas: 5000000, gasPrice: GAS_PRICE });
            console.log("             Gas addModule: ".grey+tx.receipt.gasUsed.toString().grey);
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
                    errorThrown1 = true;
                    ensureException(error);
                }
                assert.ok(errorThrown1, 'NONACCREDITED ETH investment succeeded when it should not');

                // NONACCREDITED POLY
                let errorThrown2 = false;
                try {
                    await I_USDTieredSTO_Array[0].buyWithPOLY(NONACCREDITED1, investment_POLY, {from: NONACCREDITED1});
                } catch(error) {
                    errorThrown2 = true;
                    ensureException(error);
                }
                assert.ok(errorThrown2, 'NONACCREDITED POLY investment succeeded when it should not');

                // ACCREDITED ETH
                let errorThrown3 = false;
                try {
                    await I_USDTieredSTO_Array[0].buyWithETH(ACCREDITED1, { from: ACCREDITED1, gas: 2100000, value: investment_ETH });
                } catch(error) {
                    errorThrown3 = true;
                    ensureException(error);
                }
                assert.ok(errorThrown3, 'ACCREDITED ETH investment succeeded when it should not');

                // ACCREDITED POLY
                let errorThrown4 = false;
                try {
                    await I_USDTieredSTO_Array[0].buyWithPOLY(ACCREDITED1, investment_POLY, {from: ACCREDITED1});
                } catch(error) {
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
                    errorThrown1 = true;
                    ensureException(error);
                }
                assert.ok(errorThrown1, 'NONACCREDITED ETH investment succeeded when it should not');

                // NONACCREDITED POLY
                let errorThrown2 = false;
                try {
                    await I_USDTieredSTO_Array[0].buyWithPOLY(NONACCREDITED1, investment_POLY, {from: NONACCREDITED1});
                } catch(error) {
                    errorThrown2 = true;
                    ensureException(error);
                }
                assert.ok(errorThrown2, 'NONACCREDITED POLY investment succeeded when it should not');

                // ACCREDITED ETH
                let errorThrown3 = false;
                try {
                    await I_USDTieredSTO_Array[0].buyWithETH(ACCREDITED1, { from: ACCREDITED1, gas: 2100000, value: investment_ETH });
                } catch(error) {
                    errorThrown3 = true;
                    ensureException(error);
                }
                assert.ok(errorThrown3, 'ACCREDITED ETH investment succeeded when it should not');

                // ACCREDITED POLY
                let errorThrown4 = false;
                try {
                    await I_USDTieredSTO_Array[0].buyWithPOLY(ACCREDITED1, investment_POLY, {from: ACCREDITED1});
                } catch(error) {
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
                    errorThrown1 = true;
                    ensureException(error);
                }
                assert.ok(errorThrown1, 'NONACCREDITED ETH investment succeeded when it should not');

                // NONACCREDITED POLY
                let errorThrown2 = false;
                try {
                    await I_USDTieredSTO_Array[0].buyWithPOLY(NONACCREDITED1, investment_POLY, {from: NONACCREDITED1});
                } catch(error) {
                    errorThrown2 = true;
                    ensureException(error);
                }
                assert.ok(errorThrown2, 'NONACCREDITED POLY investment succeeded when it should not');

                // ACCREDITED ETH
                let errorThrown3 = false;
                try {
                    await I_USDTieredSTO_Array[0].buyWithETH(ACCREDITED1, { from: ACCREDITED1, gas: 2100000, value: investment_ETH });
                } catch(error) {
                    errorThrown3 = true;
                    ensureException(error);
                }
                assert.ok(errorThrown3, 'ACCREDITED ETH investment succeeded when it should not');

                // ACCREDITED POLY
                let errorThrown4 = false;
                try {
                    await I_USDTieredSTO_Array[0].buyWithPOLY(ACCREDITED1, investment_POLY, {from: ACCREDITED1});
                } catch(error) {
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
                await increaseTime(duration.days(2));

                // Set as accredited
                await I_USDTieredSTO_Array[2].changeAccredited([ACCREDITED1], [true], { from: ISSUER });

                // Prep for investments
                let investment_ETH = web3.utils.toWei('1', 'ether'); // Invest 1 ETH
                let investment_POLY = web3.utils.toWei('10000', 'ether'); // Invest 10000 POLY
                await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
                await I_PolyToken.approve(I_USDTieredSTO_Array[2].address, investment_POLY, {from: NONACCREDITED1});
                await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
                await I_PolyToken.approve(I_USDTieredSTO_Array[2].address, investment_POLY, {from: ACCREDITED1});

                // NONACCREDITED ETH
                let errorThrown1 = false;
                try {
                    await I_USDTieredSTO_Array[2].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, gas: 2100000, value: investment_ETH });
                } catch(error) {
                    errorThrown1 = true;
                    ensureException(error);
                }
                assert.ok(errorThrown1, 'NONACCREDITED ETH investment succeeded when it should not');

                // NONACCREDITED POLY
                let errorThrown2 = false;
                try {
                    await I_USDTieredSTO_Array[2].buyWithPOLY(NONACCREDITED1, investment_POLY, {from: NONACCREDITED1});
                } catch(error) {
                    errorThrown2 = true;
                    ensureException(error);
                }
                assert.ok(errorThrown2, 'NONACCREDITED POLY investment succeeded when it should not');

                // ACCREDITED ETH
                let errorThrown3 = false;
                try {
                    await I_USDTieredSTO_Array[2].buyWithETH(ACCREDITED1, { from: ACCREDITED1, gas: 2100000, value: investment_ETH });
                } catch(error) {
                    errorThrown3 = true;
                    ensureException(error);
                }
                assert.ok(errorThrown3, 'ACCREDITED ETH investment succeeded when it should not');

                // ACCREDITED POLY
                let errorThrown4 = false;
                try {
                    await I_USDTieredSTO_Array[2].buyWithPOLY(ACCREDITED1, investment_POLY, {from: ACCREDITED1});
                } catch(error) {
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
                await I_USDTieredSTO_Array[0].finalize({ from: ISSUER });
                assert.equal(await I_USDTieredSTO_Array[0].isFinalized.call(), true, "STO has not been finalized");

                // Attempt to call function again
                let errorThrown = false;
                try {
                    await I_USDTieredSTO_Array[0].finalize({ from: ISSUER });
                } catch(error) {
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
                    errorThrown1 = true;
                    ensureException(error);
                }
                assert.ok(errorThrown1, 'NONACCREDITED ETH investment succeeded when it should not');

                // NONACCREDITED POLY
                let errorThrown2 = false;
                try {
                    await I_USDTieredSTO_Array[0].buyWithPOLY(NONACCREDITED1, investment_POLY, {from: NONACCREDITED1});
                } catch(error) {
                    errorThrown2 = true;
                    ensureException(error);
                }
                assert.ok(errorThrown2, 'NONACCREDITED POLY investment succeeded when it should not');

                // ACCREDITED ETH
                let errorThrown3 = false;
                try {
                    await I_USDTieredSTO_Array[0].buyWithETH(ACCREDITED1, { from: ACCREDITED1, gas: 2100000, value: investment_ETH });
                } catch(error) {
                    errorThrown3 = true;
                    ensureException(error);
                }
                assert.ok(errorThrown3, 'ACCREDITED ETH investment succeeded when it should not');

                // ACCREDITED POLY
                let errorThrown4 = false;
                try {
                    await I_USDTieredSTO_Array[0].buyWithPOLY(ACCREDITED1, investment_POLY, {from: ACCREDITED1});
                } catch(error) {
                    errorThrown4 = true;
                    ensureException(error);
                }
                assert.ok(errorThrown4, 'ACCREDITED POLY investment succeeded when it should not');

                await revertToSnapshot(snapId);
            });
        });

        describe("Test on open STO", async() => {

            describe("preparation", async() => {

                it("should jump forward to after STO start", async() => {
                    await increaseTime(duration.days(3));
                });

                it("should whitelist ACCREDITED1 and NONACCREDITED1", async() => {
                    let fromTime = latestTime();
                    let toTime = latestTime() + duration.days(15);
                    let expiryTime = toTime + duration.days(100);
                    let whitelisted = true;

                    const tx1 = await I_GeneralTransferManager.modifyWhitelist(NONACCREDITED1, fromTime, toTime, expiryTime, whitelisted,{ from: ISSUER, gas: 500000 });
                    assert.equal(tx1.logs[0].args._investor, NONACCREDITED1, "Failed in adding the investor in whitelist");
                    const tx2 = await I_GeneralTransferManager.modifyWhitelist(ACCREDITED1, fromTime, toTime, expiryTime, whitelisted,{ from: ISSUER, gas: 500000 });
                    assert.equal(tx2.logs[0].args._investor, ACCREDITED1, "Failed in adding the investor in whitelist");
                });

                it("should successfully modify accredited addresses for first STO", async() => {
                    let status1 = await I_USDTieredSTO_Array[0].accredited.call(NONACCREDITED1);
                    assert.equal(status1, false, "Initial accreditation is set to true");

                    await I_USDTieredSTO_Array[0].changeAccredited([NONACCREDITED1], [true], { from: ISSUER });
                    let status2 = await I_USDTieredSTO_Array[0].accredited.call(NONACCREDITED1);
                    assert.equal(status2, true, "Failed to set single address");

                    await I_USDTieredSTO_Array[0].changeAccredited([NONACCREDITED1, ACCREDITED1], [false, true], { from: ISSUER });
                    let status3 = await I_USDTieredSTO_Array[0].accredited.call(NONACCREDITED1);
                    assert.equal(status3, false, "Failed to set multiple addresses");
                    let status4 = await I_USDTieredSTO_Array[0].accredited.call(ACCREDITED1);
                    assert.equal(status4, true, "Failed to set multiple addresses");

                    let errorThrown = false;
                    try {
                        await I_USDTieredSTO_Array[0].changeAccredited([NONACCREDITED1, ACCREDITED1], [true], { from: ISSUER });
                    } catch(error) {
                        errorThrown = true;
                        ensureException(error);
                    }
                    assert.ok(errorThrown, "Set accreditation despite input array of different size");
                });

                it("should successfully modify accredited addresses for second STO", async() => {
                    await I_USDTieredSTO_Array[1].changeAccredited([NONACCREDITED1, ACCREDITED1], [false, true], { from: ISSUER });
                    let status1 = await I_USDTieredSTO_Array[1].accredited.call(NONACCREDITED1);
                    let status2 = await I_USDTieredSTO_Array[1].accredited.call(ACCREDITED1);
                    assert.equal(status1, false, "Failed to set multiple address");
                    assert.equal(status2, true, "Failed to set multiple address");
                });
            });

            describe("Buy Tokens", async() => {

                it("should successfully buy using fallback at tier 0 for NONACCREDITED1", async() => {
                    let investment_Token = BigNumber(50).mul(10**18);
                    let investment_USD = await convert("TOKEN", "USD", investment_Token, 0, false, 0);
                    let investment_ETH = await convert("TOKEN", "ETH", investment_Token, 0, false, 0);
                    let investment_POLY = await convert("TOKEN", "POLY", investment_Token, 0, false, 0);

                    let init_TokenSupply = await I_SecurityToken.totalSupply();
                    let init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
                    let init_InvestorETHBal = BigNumber(await web3.eth.getBalance(NONACCREDITED1));
                    let init_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
                    let init_STOTokenSold = await I_USDTieredSTO_Array[0].getTokensSold();
                    let init_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[0].address));
                    let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[0].address);
                    let init_RaisedETH = await I_USDTieredSTO_Array[0].fundsRaisedETH.call();
                    let init_RaisedPOLY = await I_USDTieredSTO_Array[0].fundsRaisedPOLY.call();
                    let init_WalletETHBal = BigNumber(await web3.eth.getBalance(_wallet));
                    let init_WalletPOLYBal = await I_PolyToken.balanceOf(_wallet);

                    let tx1 = await web3.eth.sendTransaction({ from: NONACCREDITED1, to: I_USDTieredSTO_Array[0].address, gas: 400000, value: investment_ETH, gasPrice: GAS_PRICE });
                    let gasCost1 = BigNumber(GAS_PRICE).mul(tx1.gasUsed);
                    console.log("             Gas fallback purchase: ".grey+tx1.gasUsed.toString().grey);

                    let final_TokenSupply = await I_SecurityToken.totalSupply();
                    let final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
                    let final_InvestorETHBal = BigNumber(await web3.eth.getBalance(NONACCREDITED1));
                    let final_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
                    let final_STOTokenSold = await I_USDTieredSTO_Array[0].getTokensSold();
                    let final_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[0].address));
                    let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[0].address);
                    let final_RaisedETH = await I_USDTieredSTO_Array[0].fundsRaisedETH.call();
                    let final_RaisedPOLY = await I_USDTieredSTO_Array[0].fundsRaisedPOLY.call();
                    let final_WalletETHBal = BigNumber(await web3.eth.getBalance(_wallet));
                    let final_WalletPOLYBal = await I_PolyToken.balanceOf(_wallet);

                    assert.equal(final_TokenSupply.toNumber(), init_TokenSupply.add(investment_Token).toNumber(), "Token Supply not changed as expected");
                    assert.equal(final_InvestorTokenBal.toNumber(), init_InvestorTokenBal.add(investment_Token).toNumber(), "Investor Token Balance not changed as expected");
                    assert.equal(final_InvestorETHBal.toNumber(), init_InvestorETHBal.sub(gasCost1).sub(investment_ETH).toNumber(), "Investor ETH Balance not changed as expected");
                    assert.equal(final_InvestorPOLYBal.toNumber(), init_InvestorPOLYBal.toNumber(), "Investor POLY Balance not changed as expected");
                    assert.equal(final_STOTokenSold.toNumber(), init_STOTokenSold.add(investment_Token).toNumber(), "STO Token Sold not changed as expected");
                    assert.equal(final_STOETHBal.toNumber(), init_STOETHBal.toNumber(), "STO ETH Balance not changed as expected");
                    assert.equal(final_STOPOLYBal.toNumber(), init_STOPOLYBal.toNumber(), "STO POLY Balance not changed as expected");
                    assert.equal(final_RaisedETH.toNumber(), init_RaisedETH.add(investment_ETH).toNumber(), "Raised ETH not changed as expected");
                    assert.equal(final_RaisedPOLY.toNumber(), init_RaisedPOLY.toNumber(), "Raised POLY not changed as expected");
                    assert.equal(final_WalletETHBal.toNumber(), init_WalletETHBal.add(investment_ETH).toNumber(), "Wallet ETH Balance not changed as expected");
                    assert.equal(final_WalletPOLYBal.toNumber(), init_WalletPOLYBal.toNumber(), "Wallet POLY Balance not changed as expected");
                });

                it("should successfully buy using buyWithETH at tier 0 for NONACCREDITED1", async() => {
                    let investment_Token = BigNumber(50).mul(10**18);
                    let investment_USD = await convert("TOKEN", "USD", investment_Token, 0, false, 0);
                    let investment_ETH = await convert("TOKEN", "ETH", investment_Token, 0, false, 0);
                    let investment_POLY = await convert("TOKEN", "POLY", investment_Token, 0, false, 0);

                    let init_TokenSupply = await I_SecurityToken.totalSupply();
                    let init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
                    let init_InvestorETHBal = BigNumber(await web3.eth.getBalance(NONACCREDITED1));
                    let init_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
                    let init_STOTokenSold = await I_USDTieredSTO_Array[0].getTokensSold();
                    let init_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[0].address));
                    let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[0].address);
                    let init_RaisedETH = await I_USDTieredSTO_Array[0].fundsRaisedETH.call();
                    let init_RaisedPOLY = await I_USDTieredSTO_Array[0].fundsRaisedPOLY.call();
                    let init_WalletETHBal = BigNumber(await web3.eth.getBalance(_wallet));
                    let init_WalletPOLYBal = await I_PolyToken.balanceOf(_wallet);

                    let tx1 = await I_USDTieredSTO_Array[0].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, gas: 150000, value: investment_ETH, gasPrice: GAS_PRICE });
                    let gasCost1 = BigNumber(GAS_PRICE).mul(tx1.receipt.gasUsed);
                    console.log("             Gas buyWithETH: ".grey+tx1.receipt.gasUsed.toString().grey);

                    let final_TokenSupply = await I_SecurityToken.totalSupply();
                    let final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
                    let final_InvestorETHBal = BigNumber(await web3.eth.getBalance(NONACCREDITED1));
                    let final_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
                    let final_STOTokenSold = await I_USDTieredSTO_Array[0].getTokensSold();
                    let final_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[0].address));
                    let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[0].address);
                    let final_RaisedETH = await I_USDTieredSTO_Array[0].fundsRaisedETH.call();
                    let final_RaisedPOLY = await I_USDTieredSTO_Array[0].fundsRaisedPOLY.call();
                    let final_WalletETHBal = BigNumber(await web3.eth.getBalance(_wallet));
                    let final_WalletPOLYBal = await I_PolyToken.balanceOf(_wallet);

                    assert.equal(final_TokenSupply.toNumber(), init_TokenSupply.add(investment_Token).toNumber(), "Token Supply not changed as expected");
                    assert.equal(final_InvestorTokenBal.toNumber(), init_InvestorTokenBal.add(investment_Token).toNumber(), "Investor Token Balance not changed as expected");
                    assert.equal(final_InvestorETHBal.toNumber(), init_InvestorETHBal.sub(gasCost1).sub(investment_ETH).toNumber(), "Investor ETH Balance not changed as expected");
                    assert.equal(final_InvestorPOLYBal.toNumber(), init_InvestorPOLYBal.toNumber(), "Investor POLY Balance not changed as expected");
                    assert.equal(final_STOTokenSold.toNumber(), init_STOTokenSold.add(investment_Token).toNumber(), "STO Token Sold not changed as expected");
                    assert.equal(final_STOETHBal.toNumber(), init_STOETHBal.toNumber(), "STO ETH Balance not changed as expected");
                    assert.equal(final_STOPOLYBal.toNumber(), init_STOPOLYBal.toNumber(), "STO POLY Balance not changed as expected");
                    assert.equal(final_RaisedETH.toNumber(), init_RaisedETH.add(investment_ETH).toNumber(), "Raised ETH not changed as expected");
                    assert.equal(final_RaisedPOLY.toNumber(), init_RaisedPOLY.toNumber(), "Raised POLY not changed as expected");
                    assert.equal(final_WalletETHBal.toNumber(), init_WalletETHBal.add(investment_ETH).toNumber(), "Wallet ETH Balance not changed as expected");
                    assert.equal(final_WalletPOLYBal.toNumber(), init_WalletPOLYBal.toNumber(), "Wallet POLY Balance not changed as expected");
                });

                it("should successfully buy using buyWithPOLY at tier 0 for NONACCREDITED1", async() => {
                    let investment_Token = BigNumber(50).mul(10**18);
                    let investment_USD = await convert("TOKEN", "USD", investment_Token, 0, false, 0);
                    let investment_ETH = await convert("TOKEN", "ETH", investment_Token, 0, false, 0);
                    let investment_POLY = await convert("TOKEN", "POLY", investment_Token, 0, false, 0);

                    await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
                    await I_PolyToken.approve(I_USDTieredSTO_Array[0].address, investment_POLY, {from: NONACCREDITED1});

                    let init_TokenSupply = await I_SecurityToken.totalSupply();
                    let init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
                    let init_InvestorETHBal = BigNumber(await web3.eth.getBalance(NONACCREDITED1));
                    let init_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
                    let init_STOTokenSold = await I_USDTieredSTO_Array[0].getTokensSold();
                    let init_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[0].address));
                    let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[0].address);
                    let init_RaisedETH = await I_USDTieredSTO_Array[0].fundsRaisedETH.call();
                    let init_RaisedPOLY = await I_USDTieredSTO_Array[0].fundsRaisedPOLY.call();
                    let init_WalletETHBal = BigNumber(await web3.eth.getBalance(_wallet));
                    let init_WalletPOLYBal = await I_PolyToken.balanceOf(_wallet);

                    // Buy With POLY
                    let tx2 = await I_USDTieredSTO_Array[0].buyWithPOLY(NONACCREDITED1, investment_POLY, { from: NONACCREDITED1, gas: 300000, gasPrice: GAS_PRICE });
                    let gasCost2 = BigNumber(GAS_PRICE).mul(tx2.receipt.gasUsed);
                    console.log("             Gas buyWithPOLY: ".grey+tx2.receipt.gasUsed.toString().grey);

                    let final_TokenSupply = await I_SecurityToken.totalSupply();
                    let final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
                    let final_InvestorETHBal = BigNumber(await web3.eth.getBalance(NONACCREDITED1));
                    let final_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
                    let final_STOTokenSold = await I_USDTieredSTO_Array[0].getTokensSold();
                    let final_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[0].address));
                    let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[0].address);
                    let final_RaisedETH = await I_USDTieredSTO_Array[0].fundsRaisedETH.call();
                    let final_RaisedPOLY = await I_USDTieredSTO_Array[0].fundsRaisedPOLY.call();
                    let final_WalletETHBal = BigNumber(await web3.eth.getBalance(_wallet));
                    let final_WalletPOLYBal = await I_PolyToken.balanceOf(_wallet);

                    assert.equal(final_TokenSupply.toNumber(), init_TokenSupply.add(investment_Token).toNumber(), "Token Supply not changed as expected");
                    assert.equal(final_InvestorTokenBal.toNumber(), init_InvestorTokenBal.add(investment_Token).toNumber(), "Investor Token Balance not changed as expected");
                    assert.equal(final_InvestorETHBal.toNumber(), init_InvestorETHBal.sub(gasCost2).toNumber(), "Investor ETH Balance not changed as expected");
                    assert.equal(final_InvestorPOLYBal.toNumber(), init_InvestorPOLYBal.sub(investment_POLY).toNumber(), "Investor POLY Balance not changed as expected");
                    assert.equal(final_STOTokenSold.toNumber(), init_STOTokenSold.add(investment_Token).toNumber(), "STO Token Sold not changed as expected");
                    assert.equal(final_STOETHBal.toNumber(), init_STOETHBal.toNumber(), "STO ETH Balance not changed as expected");
                    assert.equal(final_STOPOLYBal.toNumber(), init_STOPOLYBal.toNumber(), "STO POLY Balance not changed as expected");
                    assert.equal(final_RaisedETH.toNumber(), init_RaisedETH.toNumber(), "Raised ETH not changed as expected");
                    assert.equal(final_RaisedPOLY.toNumber(), init_RaisedPOLY.add(investment_POLY).toNumber(), "Raised POLY not changed as expected");
                    assert.equal(final_WalletETHBal.toNumber(), init_WalletETHBal.toNumber(), "Wallet ETH Balance not changed as expected");
                    assert.equal(final_WalletPOLYBal.toNumber(), init_WalletPOLYBal.add(investment_POLY).toNumber(), "Wallet POLY Balance not changed as expected");
                });

                it("should successfully buy using fallback at tier 0 for ACCREDITED1", async() => {
                    let investment_Token = BigNumber(50).mul(10**18);
                    let investment_USD = await convert("TOKEN", "USD", investment_Token, 0, false, 0);
                    let investment_ETH = await convert("TOKEN", "ETH", investment_Token, 0, false, 0);
                    let investment_POLY = await convert("TOKEN", "POLY", investment_Token, 0, false, 0);

                    let init_TokenSupply = await I_SecurityToken.totalSupply();
                    let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
                    let init_InvestorETHBal = BigNumber(await web3.eth.getBalance(ACCREDITED1));
                    let init_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
                    let init_STOTokenSold = await I_USDTieredSTO_Array[0].getTokensSold();
                    let init_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[0].address));
                    let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[0].address);
                    let init_RaisedETH = await I_USDTieredSTO_Array[0].fundsRaisedETH.call();
                    let init_RaisedPOLY = await I_USDTieredSTO_Array[0].fundsRaisedPOLY.call();
                    let init_WalletETHBal = BigNumber(await web3.eth.getBalance(_wallet));
                    let init_WalletPOLYBal = await I_PolyToken.balanceOf(_wallet);

                    let tx1 = await web3.eth.sendTransaction({ from: ACCREDITED1, to: I_USDTieredSTO_Array[0].address, gas: 400000, value: investment_ETH, gasPrice: GAS_PRICE });
                    let gasCost1 = BigNumber(GAS_PRICE).mul(tx1.gasUsed);
                    console.log("             Gas fallback purchase: ".grey+tx1.gasUsed.toString().grey);

                    let final_TokenSupply = await I_SecurityToken.totalSupply();
                    let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
                    let final_InvestorETHBal = BigNumber(await web3.eth.getBalance(ACCREDITED1));
                    let final_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
                    let final_STOTokenSold = await I_USDTieredSTO_Array[0].getTokensSold();
                    let final_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[0].address));
                    let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[0].address);
                    let final_RaisedETH = await I_USDTieredSTO_Array[0].fundsRaisedETH.call();
                    let final_RaisedPOLY = await I_USDTieredSTO_Array[0].fundsRaisedPOLY.call();
                    let final_WalletETHBal = BigNumber(await web3.eth.getBalance(_wallet));
                    let final_WalletPOLYBal = await I_PolyToken.balanceOf(_wallet);

                    assert.equal(final_TokenSupply.toNumber(), init_TokenSupply.add(investment_Token).toNumber(), "Token Supply not changed as expected");
                    assert.equal(final_InvestorTokenBal.toNumber(), init_InvestorTokenBal.add(investment_Token).toNumber(), "Investor Token Balance not changed as expected");
                    assert.equal(final_InvestorETHBal.toNumber(), init_InvestorETHBal.sub(gasCost1).sub(investment_ETH).toNumber(), "Investor ETH Balance not changed as expected");
                    assert.equal(final_InvestorPOLYBal.toNumber(), init_InvestorPOLYBal.toNumber(), "Investor POLY Balance not changed as expected");
                    assert.equal(final_STOTokenSold.toNumber(), init_STOTokenSold.add(investment_Token).toNumber(), "STO Token Sold not changed as expected");
                    assert.equal(final_STOETHBal.toNumber(), init_STOETHBal.toNumber(), "STO ETH Balance not changed as expected");
                    assert.equal(final_STOPOLYBal.toNumber(), init_STOPOLYBal.toNumber(), "STO POLY Balance not changed as expected");
                    assert.equal(final_RaisedETH.toNumber(), init_RaisedETH.add(investment_ETH).toNumber(), "Raised ETH not changed as expected");
                    assert.equal(final_RaisedPOLY.toNumber(), init_RaisedPOLY.toNumber(), "Raised POLY not changed as expected");
                    assert.equal(final_WalletETHBal.toNumber(), init_WalletETHBal.add(investment_ETH).toNumber(), "Wallet ETH Balance not changed as expected");
                    assert.equal(final_WalletPOLYBal.toNumber(), init_WalletPOLYBal.toNumber(), "Wallet POLY Balance not changed as expected");
                });

                it("should successfully buy using buyWithETH at tier 0 for ACCREDITED1", async() => {
                    let investment_Token = BigNumber(50).mul(10**18);
                    let investment_USD = await convert("TOKEN", "USD", investment_Token, 0, false, 0);
                    let investment_ETH = await convert("TOKEN", "ETH", investment_Token, 0, false, 0);
                    let investment_POLY = await convert("TOKEN", "POLY", investment_Token, 0, false, 0);

                    let init_TokenSupply = await I_SecurityToken.totalSupply();
                    let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
                    let init_InvestorETHBal = BigNumber(await web3.eth.getBalance(ACCREDITED1));
                    let init_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
                    let init_STOTokenSold = await I_USDTieredSTO_Array[0].getTokensSold();
                    let init_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[0].address));
                    let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[0].address);
                    let init_RaisedETH = await I_USDTieredSTO_Array[0].fundsRaisedETH.call();
                    let init_RaisedPOLY = await I_USDTieredSTO_Array[0].fundsRaisedPOLY.call();
                    let init_WalletETHBal = BigNumber(await web3.eth.getBalance(_wallet));
                    let init_WalletPOLYBal = await I_PolyToken.balanceOf(_wallet);

                    let tx1 = await I_USDTieredSTO_Array[0].buyWithETH(ACCREDITED1, { from: ACCREDITED1, gas: 150000, value: investment_ETH, gasPrice: GAS_PRICE });
                    let gasCost1 = BigNumber(GAS_PRICE).mul(tx1.receipt.gasUsed);
                    console.log("             Gas buyWithETH: ".grey+tx1.receipt.gasUsed.toString().grey);

                    let final_TokenSupply = await I_SecurityToken.totalSupply();
                    let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
                    let final_InvestorETHBal = BigNumber(await web3.eth.getBalance(ACCREDITED1));
                    let final_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
                    let final_STOTokenSold = await I_USDTieredSTO_Array[0].getTokensSold();
                    let final_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[0].address));
                    let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[0].address);
                    let final_RaisedETH = await I_USDTieredSTO_Array[0].fundsRaisedETH.call();
                    let final_RaisedPOLY = await I_USDTieredSTO_Array[0].fundsRaisedPOLY.call();
                    let final_WalletETHBal = BigNumber(await web3.eth.getBalance(_wallet));
                    let final_WalletPOLYBal = await I_PolyToken.balanceOf(_wallet);

                    assert.equal(final_TokenSupply.toNumber(), init_TokenSupply.add(investment_Token).toNumber(), "Token Supply not changed as expected");
                    assert.equal(final_InvestorTokenBal.toNumber(), init_InvestorTokenBal.add(investment_Token).toNumber(), "Investor Token Balance not changed as expected");
                    assert.equal(final_InvestorETHBal.toNumber(), init_InvestorETHBal.sub(gasCost1).sub(investment_ETH).toNumber(), "Investor ETH Balance not changed as expected");
                    assert.equal(final_InvestorPOLYBal.toNumber(), init_InvestorPOLYBal.toNumber(), "Investor POLY Balance not changed as expected");
                    assert.equal(final_STOTokenSold.toNumber(), init_STOTokenSold.add(investment_Token).toNumber(), "STO Token Sold not changed as expected");
                    assert.equal(final_STOETHBal.toNumber(), init_STOETHBal.toNumber(), "STO ETH Balance not changed as expected");
                    assert.equal(final_STOPOLYBal.toNumber(), init_STOPOLYBal.toNumber(), "STO POLY Balance not changed as expected");
                    assert.equal(final_RaisedETH.toNumber(), init_RaisedETH.add(investment_ETH).toNumber(), "Raised ETH not changed as expected");
                    assert.equal(final_RaisedPOLY.toNumber(), init_RaisedPOLY.toNumber(), "Raised POLY not changed as expected");
                    assert.equal(final_WalletETHBal.toNumber(), init_WalletETHBal.add(investment_ETH).toNumber(), "Wallet ETH Balance not changed as expected");
                    assert.equal(final_WalletPOLYBal.toNumber(), init_WalletPOLYBal.toNumber(), "Wallet POLY Balance not changed as expected");
                });

                it("should successfully buy using buyWithPOLY at tier 0 for ACCREDITED1", async() => {
                    let investment_Token = BigNumber(50).mul(10**18);
                    let investment_USD = await convert("TOKEN", "USD", investment_Token, 0, false, 0);
                    let investment_ETH = await convert("TOKEN", "ETH", investment_Token, 0, false, 0);
                    let investment_POLY = await convert("TOKEN", "POLY", investment_Token, 0, false, 0);

                    await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
                    await I_PolyToken.approve(I_USDTieredSTO_Array[0].address, investment_POLY, {from: ACCREDITED1});

                    let init_TokenSupply = await I_SecurityToken.totalSupply();
                    let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
                    let init_InvestorETHBal = BigNumber(await web3.eth.getBalance(ACCREDITED1));
                    let init_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
                    let init_STOTokenSold = await I_USDTieredSTO_Array[0].getTokensSold();
                    let init_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[0].address));
                    let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[0].address);
                    let init_RaisedETH = await I_USDTieredSTO_Array[0].fundsRaisedETH.call();
                    let init_RaisedPOLY = await I_USDTieredSTO_Array[0].fundsRaisedPOLY.call();
                    let init_WalletETHBal = BigNumber(await web3.eth.getBalance(_wallet));
                    let init_WalletPOLYBal = await I_PolyToken.balanceOf(_wallet);

                    // Buy With POLY
                    let tx2 = await I_USDTieredSTO_Array[0].buyWithPOLY(ACCREDITED1, investment_POLY, { from: ACCREDITED1, gas: 200000, gasPrice: GAS_PRICE });
                    let gasCost2 = BigNumber(GAS_PRICE).mul(tx2.receipt.gasUsed);
                    console.log("             Gas buyWithPOLY: ".grey+tx2.receipt.gasUsed.toString().grey);

                    let final_TokenSupply = await I_SecurityToken.totalSupply();
                    let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
                    let final_InvestorETHBal = BigNumber(await web3.eth.getBalance(ACCREDITED1));
                    let final_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
                    let final_STOTokenSold = await I_USDTieredSTO_Array[0].getTokensSold();
                    let final_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[0].address));
                    let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[0].address);
                    let final_RaisedETH = await I_USDTieredSTO_Array[0].fundsRaisedETH.call();
                    let final_RaisedPOLY = await I_USDTieredSTO_Array[0].fundsRaisedPOLY.call();
                    let final_WalletETHBal = BigNumber(await web3.eth.getBalance(_wallet));
                    let final_WalletPOLYBal = await I_PolyToken.balanceOf(_wallet);

                    assert.equal(final_TokenSupply.toNumber(), init_TokenSupply.add(investment_Token).toNumber(), "Token Supply not changed as expected");
                    assert.equal(final_InvestorTokenBal.toNumber(), init_InvestorTokenBal.add(investment_Token).toNumber(), "Investor Token Balance not changed as expected");
                    assert.equal(final_InvestorETHBal.toNumber(), init_InvestorETHBal.sub(gasCost2).toNumber(), "Investor ETH Balance not changed as expected");
                    assert.equal(final_InvestorPOLYBal.toNumber(), init_InvestorPOLYBal.sub(investment_POLY).toNumber(), "Investor POLY Balance not changed as expected");
                    assert.equal(final_STOTokenSold.toNumber(), init_STOTokenSold.add(investment_Token).toNumber(), "STO Token Sold not changed as expected");
                    assert.equal(final_STOETHBal.toNumber(), init_STOETHBal.toNumber(), "STO ETH Balance not changed as expected");
                    assert.equal(final_STOPOLYBal.toNumber(), init_STOPOLYBal.toNumber(), "STO POLY Balance not changed as expected");
                    assert.equal(final_RaisedETH.toNumber(), init_RaisedETH.toNumber(), "Raised ETH not changed as expected");
                    assert.equal(final_RaisedPOLY.toNumber(), init_RaisedPOLY.add(investment_POLY).toNumber(), "Raised POLY not changed as expected");
                    assert.equal(final_WalletETHBal.toNumber(), init_WalletETHBal.toNumber(), "Wallet ETH Balance not changed as expected");
                    assert.equal(final_WalletPOLYBal.toNumber(), init_WalletPOLYBal.add(investment_POLY).toNumber(), "Wallet POLY Balance not changed as expected");
                });

                it("should successfully buy a partial amount and refund balance when reaching NONACCREDITED cap", async() => {
                    let investment_USD = _nonAccreditedLimitUSD;
                    let investment_Token = await convert("USD", "TOKEN", investment_USD, 0, false, 0);
                    let investment_ETH = await convert("USD", "ETH", investment_USD, 0, false, 0);
                    let investment_POLY = await convert("USD", "POLY", investment_USD, 0, false, 0);

                    let investmentToDate_USD = await I_USDTieredSTO_Array[0].investorInvestedUSD.call(NONACCREDITED1);

                    let refund_USD = investmentToDate_USD;
                    let refund_Token = await convert("USD", "TOKEN", refund_USD, 0, false, 0);
                    let refund_ETH = await convert("USD", "ETH", refund_USD, 0, false, 0);
                    let refund_POLY = await convert("USD", "POLY", refund_USD, 0, false, 0);

                    let snap = await takeSnapshot();

                    let init_TokenSupply = await I_SecurityToken.totalSupply();
                    let init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
                    let init_InvestorETHBal = BigNumber(await web3.eth.getBalance(NONACCREDITED1));
                    let init_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
                    let init_STOTokenSold = await I_USDTieredSTO_Array[0].getTokensSold();
                    let init_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[0].address));
                    let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[0].address);
                    let init_RaisedETH = await I_USDTieredSTO_Array[0].fundsRaisedETH.call();
                    let init_RaisedPOLY = await I_USDTieredSTO_Array[0].fundsRaisedPOLY.call();
                    let init_WalletETHBal = BigNumber(await web3.eth.getBalance(_wallet));
                    let init_WalletPOLYBal = await I_PolyToken.balanceOf(_wallet);

                    // Buy with ETH
                    let tx1 = await I_USDTieredSTO_Array[0].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, gas: 200000, value: investment_ETH, gasPrice: GAS_PRICE });
                    let gasCost1 = BigNumber(GAS_PRICE).mul(tx1.receipt.gasUsed);
                    console.log("             Gas buyWithETH: ".grey+tx1.receipt.gasUsed.toString().grey);

                    let final_TokenSupply = await I_SecurityToken.totalSupply();
                    let final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
                    let final_InvestorETHBal = BigNumber(await web3.eth.getBalance(NONACCREDITED1));
                    let final_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
                    let final_STOTokenSold = await I_USDTieredSTO_Array[0].getTokensSold();
                    let final_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[0].address));
                    let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[0].address);
                    let final_RaisedETH = await I_USDTieredSTO_Array[0].fundsRaisedETH.call();
                    let final_RaisedPOLY = await I_USDTieredSTO_Array[0].fundsRaisedPOLY.call();
                    let final_WalletETHBal = BigNumber(await web3.eth.getBalance(_wallet));
                    let final_WalletPOLYBal = await I_PolyToken.balanceOf(_wallet);

                    assert.equal(final_TokenSupply.toNumber(), init_TokenSupply.add(investment_Token).sub(refund_Token).toNumber(), "Token Supply not changed as expected");
                    assert.equal(final_InvestorTokenBal.toNumber(), init_InvestorTokenBal.add(investment_Token).sub(refund_Token).toNumber(), "Investor Token Balance not changed as expected");
                    assert.equal(final_InvestorETHBal.toNumber(), init_InvestorETHBal.sub(gasCost1).sub(investment_ETH).add(refund_ETH).toNumber(), "Investor ETH Balance not changed as expected");
                    assert.equal(final_InvestorPOLYBal.toNumber(), init_InvestorPOLYBal.toNumber(), "Investor POLY Balance not changed as expected");
                    assert.equal(final_STOTokenSold.toNumber(), init_STOTokenSold.add(investment_Token).sub(refund_Token).toNumber(), "STO Token Sold not changed as expected");
                    assert.equal(final_STOETHBal.toNumber(), init_STOETHBal.toNumber(), "STO ETH Balance not changed as expected");
                    assert.equal(final_STOPOLYBal.toNumber(), init_STOPOLYBal.toNumber(), "STO POLY Balance not changed as expected");
                    assert.equal(final_RaisedETH.toNumber(), init_RaisedETH.add(investment_ETH).sub(refund_ETH).toNumber(), "Raised ETH not changed as expected");
                    assert.equal(final_RaisedPOLY.toNumber(), init_RaisedPOLY.toNumber(), "Raised POLY not changed as expected");
                    assert.equal(final_WalletETHBal.toNumber(), init_WalletETHBal.add(investment_ETH).sub(refund_ETH).toNumber(), "Wallet ETH Balance not changed as expected");
                    assert.equal(final_WalletPOLYBal.toNumber(), init_WalletPOLYBal.toNumber(), "Wallet POLY Balance not changed as expected");

                    await revertToSnapshot(snap);

                    await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
                    await I_PolyToken.approve(I_USDTieredSTO_Array[0].address, investment_POLY, {from: NONACCREDITED1});

                    init_TokenSupply = await I_SecurityToken.totalSupply();
                    init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
                    init_InvestorETHBal = BigNumber(await web3.eth.getBalance(NONACCREDITED1));
                    init_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
                    init_STOTokenSold = await I_USDTieredSTO_Array[0].getTokensSold();
                    init_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[1].address));
                    init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[1].address);
                    init_RaisedETH = await I_USDTieredSTO_Array[0].fundsRaisedETH.call();
                    init_RaisedPOLY = await I_USDTieredSTO_Array[0].fundsRaisedPOLY.call();
                    init_WalletETHBal = BigNumber(await web3.eth.getBalance(_wallet));
                    init_WalletPOLYBal = await I_PolyToken.balanceOf(_wallet);

                    // Buy With POLY
                    let tx2 = await I_USDTieredSTO_Array[0].buyWithPOLY(NONACCREDITED1, investment_POLY, { from: NONACCREDITED1, gas: 200000, gasPrice: GAS_PRICE });
                    let gasCost2 = BigNumber(GAS_PRICE).mul(tx2.receipt.gasUsed);
                    console.log("             Gas buyWithPOLY: ".grey+tx2.receipt.gasUsed.toString().grey);

                    final_TokenSupply = await I_SecurityToken.totalSupply();
                    final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
                    final_InvestorETHBal = BigNumber(await web3.eth.getBalance(NONACCREDITED1));
                    final_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
                    final_STOTokenSold = await I_USDTieredSTO_Array[0].getTokensSold();
                    final_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[0].address));
                    final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[0].address);
                    final_RaisedETH = await I_USDTieredSTO_Array[0].fundsRaisedETH.call();
                    final_RaisedPOLY = await I_USDTieredSTO_Array[0].fundsRaisedPOLY.call();
                    final_WalletETHBal = BigNumber(await web3.eth.getBalance(_wallet));
                    final_WalletPOLYBal = await I_PolyToken.balanceOf(_wallet);

                    assert.equal(final_TokenSupply.toNumber(), init_TokenSupply.add(investment_Token).sub(refund_Token).toNumber(), "Token Supply not changed as expected");
                    assert.equal(final_InvestorTokenBal.toNumber(), init_InvestorTokenBal.add(investment_Token).sub(refund_Token).toNumber(), "Investor Token Balance not changed as expected");
                    assert.equal(final_InvestorETHBal.toNumber(), init_InvestorETHBal.sub(gasCost2).toNumber(), "Investor ETH Balance not changed as expected");
                    assert.equal(final_InvestorPOLYBal.toNumber(), init_InvestorPOLYBal.sub(investment_POLY).add(refund_POLY).toNumber(), "Investor POLY Balance not changed as expected");
                    assert.equal(final_STOTokenSold.toNumber(), init_STOTokenSold.add(investment_Token).sub(refund_Token).toNumber(), "STO Token Sold not changed as expected");
                    assert.equal(final_STOETHBal.toNumber(), init_STOETHBal.toNumber(), "STO ETH Balance not changed as expected");
                    assert.equal(final_STOPOLYBal.toNumber(), init_STOPOLYBal.toNumber(), "STO POLY Balance not changed as expected");
                    assert.equal(final_RaisedETH.toNumber(), init_RaisedETH.toNumber(), "Raised ETH not changed as expected");
                    assert.equal(final_RaisedPOLY.toNumber(), init_RaisedPOLY.add(investment_POLY).sub(refund_POLY).toNumber(), "Raised POLY not changed as expected");
                    assert.equal(final_WalletETHBal.toNumber(), init_WalletETHBal.toNumber(), "Wallet ETH Balance not changed as expected");
                    assert.equal(final_WalletPOLYBal.toNumber(), init_WalletPOLYBal.add(investment_POLY).sub(refund_POLY).toNumber(), "Wallet POLY Balance not changed as expected");
                });

                it("should fail to buy, consume gas, and refund balance when NONACCREDITED cap reached", async() => {
                    let investment_Token = BigNumber(50).mul(10**18);
                    let investment_USD = await convert("TOKEN", "USD", investment_Token, 0, false, 0);
                    let investment_ETH = await convert("TOKEN", "ETH", investment_Token, 0, false, 0);
                    let investment_POLY = await convert("TOKEN", "POLY", investment_Token, 0, false, 0);

                    console.log("investment_Token: "+investment_Token);
                    console.log("investment_USD: "+investment_USD);
                    console.log("investment_ETH: "+investment_ETH);
                    console.log("investment_POLY: "+investment_POLY);

                    await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
                    await I_PolyToken.approve(I_USDTieredSTO_Array[0].address, investment_POLY, {from: NONACCREDITED1});

                    let init_TokenSupply = await I_SecurityToken.totalSupply();
                    let init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
                    let init_InvestorETHBal = BigNumber(await web3.eth.getBalance(NONACCREDITED1));
                    let init_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
                    let init_STOTokenSold = await I_USDTieredSTO_Array[0].getTokensSold();
                    let init_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[0].address));
                    let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[0].address);
                    let init_RaisedETH = await I_USDTieredSTO_Array[0].fundsRaisedETH.call();
                    let init_RaisedPOLY = await I_USDTieredSTO_Array[0].fundsRaisedPOLY.call();
                    let init_WalletETHBal = BigNumber(await web3.eth.getBalance(_wallet));
                    let init_WalletPOLYBal = await I_PolyToken.balanceOf(_wallet);

                    // Buy with ETH
                    let tx1 = await I_USDTieredSTO_Array[0].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, gas: 200000, value: investment_ETH, gasPrice: GAS_PRICE });
                    let gasCost1 = BigNumber(GAS_PRICE).mul(tx1.receipt.gasUsed);
                    console.log("             Gas buyWithETH: ".grey+tx1.receipt.gasUsed.toString().grey);

                    // Buy with POLY
                    let tx2 = await I_USDTieredSTO_Array[0].buyWithPOLY(NONACCREDITED1, investment_POLY, {from: NONACCREDITED1, gas: 200000, gasPrice: GAS_PRICE});
                    let gasCost2 = BigNumber(GAS_PRICE).mul(tx2.receipt.gasUsed);
                    console.log("             Gas buyWithPOLY: ".grey+tx2.receipt.gasUsed.toString().grey);

                    let final_TokenSupply = await I_SecurityToken.totalSupply();
                    let final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
                    let final_InvestorETHBal = BigNumber(await web3.eth.getBalance(NONACCREDITED1));
                    let final_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
                    let final_STOTokenSold = await I_USDTieredSTO_Array[0].getTokensSold();
                    let final_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[0].address));
                    let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[0].address);
                    let final_RaisedETH = await I_USDTieredSTO_Array[0].fundsRaisedETH.call();
                    let final_RaisedPOLY = await I_USDTieredSTO_Array[0].fundsRaisedPOLY.call();
                    let final_WalletETHBal = BigNumber(await web3.eth.getBalance(_wallet));
                    let final_WalletPOLYBal = await I_PolyToken.balanceOf(_wallet);

                    console.log("final_InvestorETHBal: "+final_InvestorETHBal);
                    console.log("init_InvestorETHBal: "+init_InvestorETHBal);
                    console.log("gasCost1: "+gasCost1);
                    console.log("gasCost2: "+gasCost2);

                    assert.equal(final_TokenSupply.toNumber(), init_TokenSupply.toNumber(), "Token Supply not changed as expected");
                    assert.equal(final_InvestorTokenBal.toNumber(), init_InvestorTokenBal.toNumber(), "Investor Token Balance not changed as expected");
                    assert.equal(final_InvestorETHBal.toNumber(), init_InvestorETHBal.sub(gasCost1).sub(gasCost2).toNumber(), "Investor ETH Balance not changed as expected");
                    assert.equal(final_InvestorPOLYBal.toNumber(), init_InvestorPOLYBal.toNumber(), "Investor POLY Balance not changed as expected");
                    assert.equal(final_STOTokenSold.toNumber(), init_STOTokenSold.toNumber(), "STO Token Sold not changed as expected");
                    assert.equal(final_STOETHBal.toNumber(), init_STOETHBal.toNumber(), "STO ETH Balance not changed as expected");
                    assert.equal(final_STOPOLYBal.toNumber(), init_STOPOLYBal.toNumber(), "STO POLY Balance not changed as expected");
                    assert.equal(final_RaisedETH.toNumber(), init_RaisedETH.toNumber(), "Raised ETH not changed as expected");
                    assert.equal(final_RaisedPOLY.toNumber(), init_RaisedPOLY.toNumber(), "Raised POLY not changed as expected");
                    assert.equal(final_WalletETHBal.toNumber(), init_WalletETHBal.toNumber(), "Wallet ETH Balance not changed as expected");
                    assert.equal(final_WalletPOLYBal.toNumber(), init_WalletPOLYBal.toNumber(), "Wallet POLY Balance not changed as expected");
                });

                it("should fail to buy, consume gas, and refund balance despite oracle price change when NONACCREDITED cap reached", async() => {
                    // set new exchange rates
                    let high_USDETH = BigNumber(1000).mul(10**18); // 1000 USD per ETH
                    let high_USDPOLY = BigNumber(50).mul(10**16);  // 0.5 USD per POLY
                    let low_USDETH = BigNumber(250).mul(10**18);   // 250 USD per ETH
                    let low_USDPOLY = BigNumber(20).mul(10**16);   // 0.2 USD per POLY

                    let investment_USD = BigNumber(web3.utils.toWei('50'));                  // USD
                    let investment_ETH_high = investment_USD.div(high_USDETH).mul(10**18);   // USD / USD/ETH = ETH
                    let investment_POLY_high = investment_USD.div(high_USDPOLY).mul(10**18); // USD / USD/POLY = POLY
                    let investment_ETH_low = investment_USD.div(low_USDETH).mul(10**18);     // USD / USD/ETH = ETH
                    let investment_POLY_low = investment_USD.div(low_USDPOLY).mul(10**18);   // USD / USD/POLY = POLY

                    await I_PolyToken.getTokens(investment_POLY_low, NONACCREDITED1);
                    await I_PolyToken.approve(I_USDTieredSTO_Array[0].address, investment_POLY_low, {from: NONACCREDITED1});

                    let init_TokenSupply = await I_SecurityToken.totalSupply();
                    let init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
                    let init_InvestorETHBal = BigNumber(await web3.eth.getBalance(NONACCREDITED1));
                    let init_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
                    let init_STOTokenSold = await I_USDTieredSTO_Array[0].getTokensSold();
                    let init_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[0].address));
                    let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[0].address);
                    let init_RaisedETH = await I_USDTieredSTO_Array[0].fundsRaisedETH.call();
                    let init_RaisedPOLY = await I_USDTieredSTO_Array[0].fundsRaisedPOLY.call();
                    let init_WalletETHBal = BigNumber(await web3.eth.getBalance(_wallet));
                    let init_WalletPOLYBal = await I_PolyToken.balanceOf(_wallet);

                    // Change exchange rates up
                    await I_USDOracle.changePrice(high_USDETH, { from: POLYMATH });
                    await I_POLYOracle.changePrice(high_USDPOLY, { from: POLYMATH });

                    // Buy with ETH
                    let tx1 = await I_USDTieredSTO_Array[0].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, gas: 200000, value: investment_ETH_high, gasPrice: GAS_PRICE });
                    let gasCost1 = BigNumber(GAS_PRICE).mul(tx1.receipt.gasUsed);
                    console.log("             Gas buyWithETH: ".grey+tx1.receipt.gasUsed.toString().grey);

                    // Buy with POLY
                    let tx2 = await I_USDTieredSTO_Array[0].buyWithPOLY(NONACCREDITED1, investment_POLY_high, { from: NONACCREDITED1, gas: 200000, gasPrice: GAS_PRICE });
                    let gasCost2 = BigNumber(GAS_PRICE).mul(tx2.receipt.gasUsed);
                    console.log("             Gas buyWithPOLY: ".grey+tx2.receipt.gasUsed.toString().grey);

                    // Change exchange rates down
                    await I_USDOracle.changePrice(low_USDETH, { from: POLYMATH });
                    await I_POLYOracle.changePrice(low_USDPOLY, { from: POLYMATH });

                    // Buy with ETH
                    let tx3 = await I_USDTieredSTO_Array[0].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, gas: 200000, value: investment_ETH_low, gasPrice: GAS_PRICE });
                    let gasCost3 = BigNumber(GAS_PRICE).mul(tx3.receipt.gasUsed);
                    console.log("             Gas buyWithETH: ".grey+tx3.receipt.gasUsed.toString().grey);

                    // Buy with POLY
                    let tx4 = await I_USDTieredSTO_Array[0].buyWithPOLY(NONACCREDITED1, investment_POLY_low, { from: NONACCREDITED1, gas: 200000, gasPrice: GAS_PRICE });
                    let gasCost4 = BigNumber(GAS_PRICE).mul(tx4.receipt.gasUsed);
                    console.log("             Gas buyWithPOLY: ".grey+tx4.receipt.gasUsed.toString().grey);

                    // Reset exchange rates
                    await I_USDOracle.changePrice(USDETH, { from: POLYMATH });
                    await I_POLYOracle.changePrice(USDPOLY, { from: POLYMATH });

                    let final_TokenSupply = await I_SecurityToken.totalSupply();
                    let final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
                    let final_InvestorETHBal = BigNumber(await web3.eth.getBalance(NONACCREDITED1));
                    let final_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
                    let final_STOTokenSold = await I_USDTieredSTO_Array[0].getTokensSold();
                    let final_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[0].address));
                    let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[0].address);
                    let final_RaisedETH = await I_USDTieredSTO_Array[0].fundsRaisedETH.call();
                    let final_RaisedPOLY = await I_USDTieredSTO_Array[0].fundsRaisedPOLY.call();
                    let final_WalletETHBal = BigNumber(await web3.eth.getBalance(_wallet));
                    let final_WalletPOLYBal = await I_PolyToken.balanceOf(_wallet);

                    assert.equal(final_TokenSupply.toNumber(), init_TokenSupply.toNumber(), "Token Supply not changed as expected");
                    assert.equal(final_InvestorTokenBal.toNumber(), init_InvestorTokenBal.toNumber(), "Investor Token Balance not changed as expected");
                    assert.equal(final_InvestorETHBal.toNumber(), init_InvestorETHBal.sub(gasCost1).sub(gasCost2).sub(gasCost3).sub(gasCost4).toNumber(), "Investor ETH Balance not changed as expected");
                    assert.equal(final_InvestorPOLYBal.toNumber(), init_InvestorPOLYBal.toNumber(), "Investor POLY Balance not changed as expected");
                    assert.equal(final_STOTokenSold.toNumber(), init_STOTokenSold.toNumber(), "STO Token Sold not changed as expected");
                    assert.equal(final_STOETHBal.toNumber(), init_STOETHBal.toNumber(), "STO ETH Balance not changed as expected");
                    assert.equal(final_STOPOLYBal.toNumber(), init_STOPOLYBal.toNumber(), "STO POLY Balance not changed as expected");
                    assert.equal(final_RaisedETH.toNumber(), init_RaisedETH.toNumber(), "Raised ETH not changed as expected");
                    assert.equal(final_RaisedPOLY.toNumber(), init_RaisedPOLY.toNumber(), "Raised POLY not changed as expected");
                    assert.equal(final_WalletETHBal.toNumber(), init_WalletETHBal.toNumber(), "Wallet ETH Balance not changed as expected");
                    assert.equal(final_WalletPOLYBal.toNumber(), init_WalletPOLYBal.toNumber(), "Wallet POLY Balance not changed as expected");
                });

                it("should buy tokens up to just before the next tier", async() => {
                    // Buy tokens almost up to the next tier
                    let minted_Token = await I_USDTieredSTO_Array[1].mintedPerTierTotal.call(0);
                    let delta_Token = BigNumber(5).mul(10**18);    // Token
                    let investment_Token = _tokensPerTier_LOW[0].sub(minted_Token).sub(delta_Token);
                    let investment_ETH = await convert("TOKEN", "ETH", investment_Token, 0, false, 1);

                    let tx1 = await I_USDTieredSTO_Array[1].buyWithETH(ACCREDITED1, { from: ACCREDITED1, gas: 300000, value: investment_ETH, gasPrice: GAS_PRICE });
                    let gasCost1 = BigNumber(GAS_PRICE).mul(tx1.receipt.gasUsed);
                    console.log("             Gas buyWithETH: ".grey+tx1.receipt.gasUsed.toString().grey);

                    let exp_final_mintedToken = _tokensPerTier_LOW[0].sub(delta_Token);
                    let final_mintedToken = await I_USDTieredSTO_Array[1].mintedPerTierTotal.call(0);

                    assert.equal(final_mintedToken.toNumber(), exp_final_mintedToken.toNumber(), "Minted Token Per Tier not changed as expected");

                    snapId_beforeTierChange_sto1 = await takeSnapshot();
                });

                it("should successfully buy across tiers for NONACCREDITED ETH", async() => {
                    // Prep investment
                    let delta_Token = BigNumber(5).mul(10**18);
                    let ethTier0 = await convert("TOKEN", "ETH", delta_Token, 0, false, 1);
                    let ethTier1 = await convert("TOKEN", "ETH", delta_Token, 1, false, 1);

                    let investment_Token = delta_Token.add(delta_Token); // 10 Token
                    let investment_ETH = ethTier0.add(ethTier1);         // 0.0025 ETH

                    // Process investment
                    let init_TokenSupply = await I_SecurityToken.totalSupply();
                    let init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
                    let init_InvestorETHBal = BigNumber(await web3.eth.getBalance(NONACCREDITED1));
                    let init_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
                    let init_STOTokenSold = await I_USDTieredSTO_Array[1].getTokensSold();
                    let init_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[1].address));
                    let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[1].address);
                    let init_RaisedETH = await I_USDTieredSTO_Array[1].fundsRaisedETH.call();
                    let init_RaisedPOLY = await I_USDTieredSTO_Array[1].fundsRaisedPOLY.call();
                    let init_WalletETHBal = BigNumber(await web3.eth.getBalance(_wallet));
                    let init_WalletPOLYBal = await I_PolyToken.balanceOf(_wallet);

                    let tx1 = await I_USDTieredSTO_Array[1].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, gas: 300000, value: investment_ETH, gasPrice: GAS_PRICE });
                    let gasCost1 = BigNumber(GAS_PRICE).mul(tx1.receipt.gasUsed);
                    console.log("             Gas buyWithETH: ".grey+tx1.receipt.gasUsed.toString().grey);

                    let final_TokenSupply = await I_SecurityToken.totalSupply();
                    let final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
                    let final_InvestorETHBal = BigNumber(await web3.eth.getBalance(NONACCREDITED1));
                    let final_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
                    let final_STOTokenSold = await I_USDTieredSTO_Array[1].getTokensSold();
                    let final_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[1].address));
                    let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[1].address);
                    let final_RaisedETH = await I_USDTieredSTO_Array[1].fundsRaisedETH.call();
                    let final_RaisedPOLY = await I_USDTieredSTO_Array[1].fundsRaisedPOLY.call();
                    let final_WalletETHBal = BigNumber(await web3.eth.getBalance(_wallet));
                    let final_WalletPOLYBal = await I_PolyToken.balanceOf(_wallet);

                    assert.equal(final_TokenSupply.toNumber(), init_TokenSupply.add(investment_Token).toNumber(), "Token Supply not changed as expected");
                    assert.equal(final_InvestorTokenBal.toNumber(), init_InvestorTokenBal.add(investment_Token).toNumber(), "Investor Token Balance not changed as expected");
                    assert.equal(final_InvestorETHBal.toNumber(), init_InvestorETHBal.sub(gasCost1).sub(investment_ETH).toNumber(), "Investor ETH Balance not changed as expected");
                    assert.equal(final_InvestorPOLYBal.toNumber(), init_InvestorPOLYBal.toNumber(), "Investor POLY Balance not changed as expected");
                    assert.equal(final_STOTokenSold.toNumber(), init_STOTokenSold.add(investment_Token).toNumber(), "STO Token Sold not changed as expected");
                    assert.equal(final_STOETHBal.toNumber(), init_STOETHBal.toNumber(), "STO ETH Balance not changed as expected");
                    assert.equal(final_STOPOLYBal.toNumber(), init_STOPOLYBal.toNumber(), "STO POLY Balance not changed as expected");
                    assert.equal(final_RaisedETH.toNumber(), init_RaisedETH.add(investment_ETH).toNumber(), "Raised ETH not changed as expected");
                    assert.equal(final_RaisedPOLY.toNumber(), init_RaisedPOLY.toNumber(), "Raised POLY not changed as expected");
                    assert.equal(final_WalletETHBal.toNumber(), init_WalletETHBal.add(investment_ETH).toNumber(), "Wallet ETH Balance not changed as expected");
                    assert.equal(final_WalletPOLYBal.toNumber(), init_WalletPOLYBal.toNumber(), "Wallet POLY Balance not changed as expected");

                    await revertToSnapshot(snapId_beforeTierChange_sto1);
                });

                it("should successfully buy across tiers for NONACCREDITED POLY", async() => {
                    // await revertToSnapshot(snapId_beforeTierChange_sto1);
                });

                it("should successfully buy across tiers for ACCREDITED ETH", async() => {
                    // await revertToSnapshot(snapId_beforeTierChange_sto1);
                });

                it("should successfully buy across tiers for ACCREDITED POLY", async() => {
                    // Prep investment
                    let delta_Token = BigNumber(5).mul(10**18);
                    let polyTier0 = await convert("TOKEN", "POLY", delta_Token, 0, true, 1);
                    let polyTier1 = await convert("TOKEN", "POLY", delta_Token, 1, true, 1);

                    let investment_Token = delta_Token.add(delta_Token);  // 10 Token
                    let investment_POLY = polyTier0.add(polyTier1);       // 0.0025 ETH

                    await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
                    await I_PolyToken.approve(I_USDTieredSTO_Array[1].address, investment_POLY, {from: ACCREDITED1});

                    // Process investment
                    let init_TokenSupply = await I_SecurityToken.totalSupply();
                    let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
                    let init_InvestorETHBal = BigNumber(await web3.eth.getBalance(ACCREDITED1));
                    let init_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
                    let init_STOTokenSold = await I_USDTieredSTO_Array[1].getTokensSold();
                    let init_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[1].address));
                    let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[1].address);
                    let init_RaisedETH = await I_USDTieredSTO_Array[1].fundsRaisedETH.call();
                    let init_RaisedPOLY = await I_USDTieredSTO_Array[1].fundsRaisedPOLY.call();
                    let init_WalletETHBal = BigNumber(await web3.eth.getBalance(_wallet));
                    let init_WalletPOLYBal = await I_PolyToken.balanceOf(_wallet);

                    let tx2 = await I_USDTieredSTO_Array[1].buyWithPOLY(ACCREDITED1, investment_POLY, { from: ACCREDITED1, gas: 400000, gasPrice: GAS_PRICE });
                    let gasCost2 = BigNumber(GAS_PRICE).mul(tx2.receipt.gasUsed);
                    console.log("             Gas buyWithPOLY: ".grey+tx2.receipt.gasUsed.toString().grey);

                    let final_TokenSupply = await I_SecurityToken.totalSupply();
                    let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
                    let final_InvestorETHBal = BigNumber(await web3.eth.getBalance(ACCREDITED1));
                    let final_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
                    let final_STOTokenSold = await I_USDTieredSTO_Array[1].getTokensSold();
                    let final_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[1].address));
                    let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[1].address);
                    let final_RaisedETH = await I_USDTieredSTO_Array[1].fundsRaisedETH.call();
                    let final_RaisedPOLY = await I_USDTieredSTO_Array[1].fundsRaisedPOLY.call();
                    let final_WalletETHBal = BigNumber(await web3.eth.getBalance(_wallet));
                    let final_WalletPOLYBal = await I_PolyToken.balanceOf(_wallet);

                    assert.equal(final_TokenSupply.toNumber(), init_TokenSupply.add(investment_Token).toNumber(), "Token Supply not changed as expected");
                    assert.equal(final_InvestorTokenBal.toNumber(), init_InvestorTokenBal.add(investment_Token).toNumber(), "Investor Token Balance not changed as expected");
                    assert.equal(final_InvestorETHBal.toNumber(), init_InvestorETHBal.sub(gasCost2).toNumber(), "Investor ETH Balance not changed as expected");
                    assert.equal(final_InvestorPOLYBal.toNumber(), init_InvestorPOLYBal.sub(investment_POLY).toNumber(), "Investor POLY Balance not changed as expected");
                    assert.equal(final_STOTokenSold.toNumber(), init_STOTokenSold.add(investment_Token).toNumber(), "STO Token Sold not changed as expected");
                    assert.equal(final_STOETHBal.toNumber(), init_STOETHBal.toNumber(), "STO ETH Balance not changed as expected");
                    assert.equal(final_STOPOLYBal.toNumber(), init_STOPOLYBal.toNumber(), "STO POLY Balance not changed as expected");
                    assert.equal(final_RaisedETH.toNumber(), init_RaisedETH.toNumber(), "Raised ETH not changed as expected");
                    assert.equal(final_RaisedPOLY.toNumber(), init_RaisedPOLY.add(investment_POLY).toNumber(), "Raised POLY not changed as expected");
                    assert.equal(final_WalletETHBal.toNumber(), init_WalletETHBal.toNumber(), "Wallet ETH Balance not changed as expected");
                    assert.equal(final_WalletPOLYBal.toNumber(), init_WalletPOLYBal.add(investment_POLY).toNumber(), "Wallet POLY Balance not changed as expected");
                });

                it("should buy out the rest of the sto", async() => {
                    let minted = await I_USDTieredSTO_Array[1].mintedPerTierTotal.call(1);
                    let investment_Token = _tokensPerTier_LOW[1].sub(minted);
                    let investment_ETH = await convert("TOKEN", "ETH", investment_Token, 1, true, 1);

                    let init_TokenSupply = await I_SecurityToken.totalSupply();
                    let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
                    let init_STOTokenSold = await I_USDTieredSTO_Array[1].getTokensSold();

                    let tx = await I_USDTieredSTO_Array[1].buyWithETH(ACCREDITED1, { from: ACCREDITED1, value: investment_ETH, gasPrice: GAS_PRICE });
                    console.log("             Gas buyWithETH: ".grey+tx.receipt.gasUsed.toString().grey);

                    let final_TokenSupply = await I_SecurityToken.totalSupply();
                    let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
                    let final_STOTokenSold = await I_USDTieredSTO_Array[1].getTokensSold();

                    assert.equal(final_TokenSupply.toNumber(), init_TokenSupply.add(investment_Token).toNumber(), "Token Supply not changed as expected");
                    assert.equal(final_InvestorTokenBal.toNumber(), init_InvestorTokenBal.add(investment_Token).toNumber(), "Investor Token Balance not changed as expected");
                    assert.equal(final_STOTokenSold.toNumber(), init_STOTokenSold.add(investment_Token).toNumber(), "STO Token Sold not changed as expected");
                });

                it("should fail to buy when all tiers sold out NONACCREDITED", async() => {
                    let investment_Token = BigNumber(5).mul(10**18);
                    let investment_USD = await convert("TOKEN", "USD", investment_Token, 1, true, 1);
                    let investment_ETH = await convert("TOKEN", "ETH", investment_Token, 1, true, 1);
                    let investment_POLY = await convert("TOKEN", "POLY", investment_Token, 1, true, 1);

                    await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
                    await I_PolyToken.approve(I_USDTieredSTO_Array[1].address, investment_POLY, {from: NONACCREDITED1});

                    let init_TokenSupply = await I_SecurityToken.totalSupply();
                    let init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
                    let init_InvestorETHBal = BigNumber(await web3.eth.getBalance(NONACCREDITED1));
                    let init_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
                    let init_STOTokenSold = await I_USDTieredSTO_Array[1].getTokensSold();
                    let init_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[1].address));
                    let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[1].address);
                    let init_RaisedETH = await I_USDTieredSTO_Array[1].fundsRaisedETH.call();
                    let init_RaisedPOLY = await I_USDTieredSTO_Array[1].fundsRaisedPOLY.call();
                    let init_WalletETHBal = BigNumber(await web3.eth.getBalance(_wallet));
                    let init_WalletPOLYBal = await I_PolyToken.balanceOf(_wallet);

                    // Buy with ETH NONACCREDITED
                    let errorThrown1 = false;
                    try {
                        await I_USDTieredSTO_Array[1].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, value: investment_ETH, gasPrice: GAS_PRICE });
                    } catch(error) {
                        errorThrown1 = true;
                        ensureException(error);
                    }
                    assert.ok(errorThrown1, MESSAGE);

                    // Buy with POLY NONACCREDITED
                    let errorThrown2 = false;
                    try {
                        await I_USDTieredSTO_Array[1].buyWithPOLY(NONACCREDITED1, investment_POLY, { from: NONACCREDITED1, gasPrice: GAS_PRICE });
                    } catch(error) {
                        errorThrown2 = true;
                        ensureException(error);
                    }
                    assert.ok(errorThrown2, MESSAGE);

                    let final_TokenSupply = await I_SecurityToken.totalSupply();
                    let final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
                    let final_InvestorETHBal = BigNumber(await web3.eth.getBalance(NONACCREDITED1));
                    let final_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
                    let final_STOTokenSold = await I_USDTieredSTO_Array[1].getTokensSold();
                    let final_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[1].address));
                    let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[1].address);
                    let final_RaisedETH = await I_USDTieredSTO_Array[1].fundsRaisedETH.call();
                    let final_RaisedPOLY = await I_USDTieredSTO_Array[1].fundsRaisedPOLY.call();
                    let final_WalletETHBal = BigNumber(await web3.eth.getBalance(_wallet));
                    let final_WalletPOLYBal = await I_PolyToken.balanceOf(_wallet);

                    assert.equal(final_TokenSupply.toNumber(), init_TokenSupply.toNumber(), "Token Supply not changed as expected");
                    assert.equal(final_InvestorTokenBal.toNumber(), init_InvestorTokenBal.toNumber(), "Investor Token Balance not changed as expected");
                    assert.equal(final_InvestorETHBal.toNumber(), init_InvestorETHBal.toNumber(), "Investor ETH Balance not changed as expected");
                    assert.equal(final_InvestorPOLYBal.toNumber(), init_InvestorPOLYBal.toNumber(), "Investor POLY Balance not changed as expected");
                    assert.equal(final_STOTokenSold.toNumber(), init_STOTokenSold.toNumber(), "STO Token Sold not changed as expected");
                    assert.equal(final_STOETHBal.toNumber(), init_STOETHBal.toNumber(), "STO ETH Balance not changed as expected");
                    assert.equal(final_STOPOLYBal.toNumber(), init_STOPOLYBal.toNumber(), "STO POLY Balance not changed as expected");
                    assert.equal(final_RaisedETH.toNumber(), init_RaisedETH.toNumber(), "Raised ETH not changed as expected");
                    assert.equal(final_RaisedPOLY.toNumber(), init_RaisedPOLY.toNumber(), "Raised POLY not changed as expected");
                    assert.equal(final_WalletETHBal.toNumber(), init_WalletETHBal.toNumber(), "Wallet ETH Balance not changed as expected");
                    assert.equal(final_WalletPOLYBal.toNumber(), init_WalletPOLYBal.toNumber(), "Wallet POLY Balance not changed as expected");
                });

                it("should fail to buy when all tiers sold out ACCREDITED", async() => {
                    let investment_Token = BigNumber(5).mul(10**18);
                    let investment_USD = await convert("TOKEN", "USD", investment_Token, 1, true, 1);
                    let investment_ETH = await convert("TOKEN", "ETH", investment_Token, 1, true, 1);
                    let investment_POLY = await convert("TOKEN", "POLY", investment_Token, 1, true, 1);

                    await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
                    await I_PolyToken.approve(I_USDTieredSTO_Array[1].address, investment_POLY, {from: ACCREDITED1});

                    let init_TokenSupply = await I_SecurityToken.totalSupply();
                    let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
                    let init_InvestorETHBal = BigNumber(await web3.eth.getBalance(ACCREDITED1));
                    let init_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
                    let init_STOTokenSold = await I_USDTieredSTO_Array[1].getTokensSold();
                    let init_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[1].address));
                    let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[1].address);
                    let init_RaisedETH = await I_USDTieredSTO_Array[1].fundsRaisedETH.call();
                    let init_RaisedPOLY = await I_USDTieredSTO_Array[1].fundsRaisedPOLY.call();
                    let init_WalletETHBal = BigNumber(await web3.eth.getBalance(_wallet));
                    let init_WalletPOLYBal = await I_PolyToken.balanceOf(_wallet);

                    // Buy with ETH ACCREDITED
                    let errorThrown1 = false;
                    try {
                        await I_USDTieredSTO_Array[1].buyWithETH(ACCREDITED1, { from: ACCREDITED1, value: investment_ETH, gasPrice: GAS_PRICE });
                    } catch(error) {
                        errorThrown1 = true;
                        ensureException(error);
                    }
                    assert.ok(errorThrown1, MESSAGE);

                    // Buy with POLY ACCREDITED
                    let errorThrown2 = false;
                    try {
                        await I_USDTieredSTO_Array[1].buyWithPOLY(ACCREDITED1, investment_POLY, { from: ACCREDITED1, gasPrice: GAS_PRICE });
                    } catch(error) {
                        errorThrown2 = true;
                        ensureException(error);
                    }
                    assert.ok(errorThrown2, MESSAGE);

                    let final_TokenSupply = await I_SecurityToken.totalSupply();
                    let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
                    let final_InvestorETHBal = BigNumber(await web3.eth.getBalance(ACCREDITED1));
                    let final_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
                    let final_STOTokenSold = await I_USDTieredSTO_Array[1].getTokensSold();
                    let final_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[1].address));
                    let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[1].address);
                    let final_RaisedETH = await I_USDTieredSTO_Array[1].fundsRaisedETH.call();
                    let final_RaisedPOLY = await I_USDTieredSTO_Array[1].fundsRaisedPOLY.call();
                    let final_WalletETHBal = BigNumber(await web3.eth.getBalance(_wallet));
                    let final_WalletPOLYBal = await I_PolyToken.balanceOf(_wallet);

                    assert.equal(final_TokenSupply.toNumber(), init_TokenSupply.toNumber(), "Token Supply not changed as expected");
                    assert.equal(final_InvestorTokenBal.toNumber(), init_InvestorTokenBal.toNumber(), "Investor Token Balance not changed as expected");
                    assert.equal(final_InvestorETHBal.toNumber(), init_InvestorETHBal.toNumber(), "Investor ETH Balance not changed as expected");
                    assert.equal(final_InvestorPOLYBal.toNumber(), init_InvestorPOLYBal.toNumber(), "Investor POLY Balance not changed as expected");
                    assert.equal(final_STOTokenSold.toNumber(), init_STOTokenSold.toNumber(), "STO Token Sold not changed as expected");
                    assert.equal(final_STOETHBal.toNumber(), init_STOETHBal.toNumber(), "STO ETH Balance not changed as expected");
                    assert.equal(final_STOPOLYBal.toNumber(), init_STOPOLYBal.toNumber(), "STO POLY Balance not changed as expected");
                    assert.equal(final_RaisedETH.toNumber(), init_RaisedETH.toNumber(), "Raised ETH not changed as expected");
                    assert.equal(final_RaisedPOLY.toNumber(), init_RaisedPOLY.toNumber(), "Raised POLY not changed as expected");
                    assert.equal(final_WalletETHBal.toNumber(), init_WalletETHBal.toNumber(), "Wallet ETH Balance not changed as expected");
                    assert.equal(final_WalletPOLYBal.toNumber(), init_WalletPOLYBal.toNumber(), "Wallet POLY Balance not changed as expected");
                });

                it("should fail to buy when all tiers sold out despite oracle price change", async() => {

                    // Change exchange rates up
                    let high_USDETH = BigNumber(750).mul(10**18); // 750 USD per ETH
                    let high_USDPOLY = BigNumber(50).mul(10**16); // 0.5 USD per POLY
                    await I_USDOracle.changePrice(high_USDETH, { from: POLYMATH });
                    await I_POLYOracle.changePrice(high_USDPOLY, { from: POLYMATH });

                    // Change exchange rates down
                    let low_USDETH = BigNumber(250).mul(10**18); // 250 USD per ETH
                    let low_USDPOLY = BigNumber(15).mul(10**16); // 0.15 USD per POLY
                    await I_USDOracle.changePrice(low_USDETH, { from: POLYMATH });
                    await I_POLYOracle.changePrice(low_USDPOLY, { from: POLYMATH });

                    // Reset exchange rates
                    await I_USDOracle.changePrice(USDETH, { from: POLYMATH });
                    await I_POLYOracle.changePrice(USDPOLY, { from: POLYMATH });
                });
            });
        });
    });

    describe("Test getter functions", async() => {

        describe("isOpen", async() => {

        });

        describe("capReached", async() => {

        });

        describe("getTokensSold", async() => {

            it("should get the right amount of tokens sold at begining of STO", async() => {

            });

            it("should get the right amount of tokens sold after failed investment", async() => {
                // ETH NONACCREDITED
                // POLY REGULAR NONACCREDITED
                // POLY DISCOUNT NONACCREDITED
                // ETH ACCREDITED
                // POLY REGULAR ACCREDITED
                // POLY DISCOUNT ACCREDITED
            });

            it("should get the right amount of tokens sold after successful investment", async() => {
                // ETH NONACCREDITED
                // POLY REGULAR NONACCREDITED
                // POLY DISCOUNT NONACCREDITED
                // ETH ACCREDITED
                // POLY REGULAR ACCREDITED
                // POLY DISCOUNT ACCREDITED
            });

            it("should get the right amount of tokens sold at end of STO", async() => {

            });
        });

        describe("getPermissions", async() => {

        });

        describe("convertToUSD", async() => {

            it("should get the right conversion for ETH to USD", async() => {
                // 20 ETH to 10000 USD
                let ethInWei = BigNumber(web3.utils.toWei('20', 'ether'));
                let usdInWei = await I_USDTieredSTO_Array[0].convertToUSD("ETH", ethInWei);
                assert.equal(usdInWei.div(10**18).toNumber(), ethInWei.div(10**18).mul(USDETH.div(10**18)).toNumber());
            });

            it("should get the right conversion for POLY to USD", async() => {
                // 40000 POLY to 10000 USD
                let polyInWei = BigNumber(web3.utils.toWei('40000', 'ether'));
                let usdInWei = await I_USDTieredSTO_Array[0].convertToUSD("POLY", polyInWei);
                assert.equal(usdInWei.div(10**18).toNumber(), polyInWei.div(10**18).mul(USDPOLY.div(10**18)).toNumber());
            });
        });

        describe("convertFromUSD", async() => {

            it("should get the right conversion for USD to ETH", async() => {
                // 10000 USD to 20 ETH
                let usdInWei = BigNumber(web3.utils.toWei('10000', 'ether'));
                let ethInWei = await I_USDTieredSTO_Array[0].convertFromUSD("ETH", usdInWei);
                assert.equal(ethInWei.div(10**18).toNumber(), usdInWei.div(10**18).div(USDETH.div(10**18)).toNumber());
            });

            it("should get the right conversion for USD to POLY", async() => {
                // 10000 USD to 40000 POLY
                let usdInWei = BigNumber(web3.utils.toWei('10000', 'ether'));
                let polyInWei = await I_USDTieredSTO_Array[0].convertFromUSD("POLY", usdInWei);
                assert.equal(polyInWei.div(10**18).toNumber(), usdInWei.div(10**18).div(USDPOLY.div(10**18)).toNumber());
            });
        });
    });
});
