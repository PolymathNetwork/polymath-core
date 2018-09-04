import latestTime from './helpers/latestTime';
import { duration, ensureException, promisifyLogWatch, latestBlock } from './helpers/utils';
import { takeSnapshot, increaseTime, revertToSnapshot } from './helpers/time';

const PolymathRegistry = artifacts.require('./PolymathRegistry.sol')
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
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port

contract('USDTieredSTO', accounts => {
    // Accounts Variable declaration
    let POLYMATH;
    let ISSUER;
    let WALLET;
    let RESERVEWALLET;
    let INVESTOR1;
    let INVESTOR2;
    let INVESTOR3;
    let INVESTOR4;
    let ACCREDITED1;
    let ACCREDITED2;
    let NONACCREDITED1;
    let NONACCREDITED2;

    let MESSAGE = "Transaction Should Fail!";
    const GAS_PRICE = 0;

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
    let I_PolymathRegistry;

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
    const STOSetupCost = 0;

    // MockOracle USD prices
    const USDETH = BigNumber(500).mul(10**18); // 500 USD/ETH
    const USDPOLY = BigNumber(25).mul(10**16); // 0.25 USD/POLY

    // STO Configuration Arrays
    let _startTime = [];
    let _endTime = [];
    let _ratePerTier = [];
    let _ratePerTierDiscountPoly = [];
    let _tokensPerTierTotal = [];
    let _tokensPerTierDiscountPoly = [];
    let _nonAccreditedLimitUSD = [];
    let _minimumInvestmentUSD = [];
    let _fundRaiseTypes = [];
    let _wallet = [];
    let _reserveWallet = [];

    /* function configure(
        uint256 _startTime,
        uint256 _endTime,
        uint256[] _ratePerTier,
        uint256[] _ratePerTierDiscountPoly,
        uint256[] _tokensPerTier,
        uint256[] _tokensPerTierDiscountPoly,
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

    async function convert(_stoID, _tier, _discount, _currencyFrom, _currencyTo, _amount) {
        let USDTOKEN;
        if (_discount)
            USDTOKEN = await I_USDTieredSTO_Array[_stoID].ratePerTierDiscountPoly.call(_tier);
        else
            USDTOKEN = await I_USDTieredSTO_Array[_stoID].ratePerTier.call(_tier);
        if (_currencyFrom == "TOKEN") {
            let tokenToUSD = _amount.div(10**18).mul(USDTOKEN.div(10**18)).mul(10**18); // TOKEN * USD/TOKEN = USD
            if (_currencyTo == "USD")
                return tokenToUSD;
            if (_currencyTo == "ETH" || _currencyTo == "POLY")
                return await I_USDTieredSTO_Array[_stoID].convertFromUSD(_currencyTo, tokenToUSD);
        }
        if (_currencyFrom == "USD") {
            if (_currencyTo == "TOKEN")
                return _amount.div(USDTOKEN).mul(10**18); // USD / USD/TOKEN = TOKEN
            if (_currencyTo == "ETH" || _currencyTo == "POLY")
                return await I_USDTieredSTO_Array[_stoID].convertFromUSD(_currencyTo, _amount);
        }
        if (_currencyFrom == "ETH" || _currencyFrom == "POLY") {
            let ethToUSD = await I_USDTieredSTO_Array[_stoID].convertToUSD(_currencyTo, _amount);
            if (_currencyTo == "USD")
                return ethToUSD;
            if (_currencyTo == "TOKEN")
                return ethToUSD.div(USDTOKEN).mul(10**18); // USD / USD/TOKEN = TOKEN
        }
        return 0;
    }

    before(async() => {
        // Accounts setup
        POLYMATH = accounts[0];
        ISSUER = accounts[1];
        WALLET = accounts[2];
        RESERVEWALLET = WALLET;
        ACCREDITED1 = accounts[3];
        ACCREDITED2 = accounts[4];
        NONACCREDITED1 = accounts[5];
        NONACCREDITED2 = accounts[6];
        INVESTOR1 = accounts[7];
        INVESTOR2 = accounts[8];
        INVESTOR3 = accounts[9];

        // ----------- POLYMATH NETWORK Configuration ------------

        // Step 0: Deploy the PolymathRegistry
        I_PolymathRegistry = await PolymathRegistry.new({from: POLYMATH});

        // Step 1: Deploy the token Faucet
        I_PolyToken = await PolyTokenFaucet.new();
        await I_PolymathRegistry.changeAddress("PolyToken", I_PolyToken.address, {from: POLYMATH})

        // STEP 2: Deploy the ModuleRegistry
        I_ModuleRegistry = await ModuleRegistry.new(I_PolymathRegistry.address, {from:POLYMATH});
        await I_PolymathRegistry.changeAddress("ModuleRegistry", I_ModuleRegistry.address, {from: POLYMATH});

        assert.notEqual(
            I_ModuleRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "ModuleRegistry contract was not deployed"
        );

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

        // STEP 5: Deploy the USDTieredSTOFactory

        I_USDTieredSTOFactory = await USDTieredSTOFactory.new(I_PolyToken.address, STOSetupCost, 0, 0, { from: ISSUER });

        assert.notEqual(
            I_USDTieredSTOFactory.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "USDTieredSTOFactory contract was not deployed"
        );

        // STEP 6: Register the Modules with the ModuleRegistry contract

        // (A) :  Register the GeneralTransferManagerFactory
        await I_ModuleRegistry.registerModule(I_GeneralTransferManagerFactory.address, { from: POLYMATH });
        await I_ModuleRegistry.verifyModule(I_GeneralTransferManagerFactory.address, true, { from: POLYMATH });

        // (B) :  Register the GeneralDelegateManagerFactory
        await I_ModuleRegistry.registerModule(I_GeneralPermissionManagerFactory.address, { from: POLYMATH });
        await I_ModuleRegistry.verifyModule(I_GeneralPermissionManagerFactory.address, true, { from: POLYMATH });

        // (C) : Register the STOFactory
        await I_ModuleRegistry.registerModule(I_USDTieredSTOFactory.address, { from: ISSUER });

        // Step 7: Deploy the TickerRegistry

        I_TickerRegistry = await TickerRegistry.new(I_PolymathRegistry.address, REGFEE, { from: POLYMATH });
        await I_PolymathRegistry.changeAddress("TickerRegistry", I_TickerRegistry.address, {from: POLYMATH});

        assert.notEqual(
            I_TickerRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "TickerRegistry contract was not deployed",
        );

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
        await I_PolymathRegistry.changeAddress("SecurityTokenRegistry", I_SecurityTokenRegistry.address, {from: POLYMATH});

        assert.notEqual(
            I_SecurityTokenRegistry.address.valueOf(),
            "0x0000000000000000000000000000000000000000",
            "SecurityTokenRegistry contract was not deployed",
        );

        // Step 10: update the registries addresses from the PolymathRegistry contract
        await I_SecurityTokenRegistry.updateFromRegistry({from: POLYMATH});
        await I_ModuleRegistry.updateFromRegistry({from: POLYMATH});
        await I_TickerRegistry.updateFromRegistry({from: POLYMATH});

        // Step 11: Deploy & Register Mock Oracles
        I_USDOracle = await MockOracle.new(0, "ETH", "USD", USDETH, { from: POLYMATH }); // 500 dollars per POLY
        I_POLYOracle = await MockOracle.new(I_PolyToken.address, "POLY", "USD", USDPOLY, { from: POLYMATH }); // 25 cents per POLY
        await I_PolymathRegistry.changeAddress("EthUsdOracle", I_USDOracle.address, { from: POLYMATH });
        await I_PolymathRegistry.changeAddress("PolyUsdOracle", I_POLYOracle.address, { from: POLYMATH });

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
            let _blockNo = latestBlock();
            let tx = await I_SecurityTokenRegistry.generateSecurityToken(NAME, SYMBOL, TOKENDETAILS, true, { from: ISSUER });
            assert.equal(tx.logs[1].args._ticker, SYMBOL, "SecurityToken doesn't get deployed");

            I_SecurityToken = SecurityToken.at(tx.logs[1].args._securityTokenAddress);

            const log = await promisifyLogWatch(I_SecurityToken.LogModuleAdded({from: _blockNo}), 1);

            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._type.toNumber(), TMKEY);
            assert.equal(web3.utils.hexToString(log.args._name),"GeneralTransferManager");
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

        it("Should successfully attach the first STO module to the security token", async () => {
            let stoId = 0; // No discount

            _startTime.push(latestTime() + duration.days(2));
            _endTime.push(_startTime[stoId] + duration.days(100));
            _ratePerTier.push([BigNumber(10*10**16), BigNumber(15*10**16)]);                                                        // [ 0.10 USD/Token, 0.15 USD/Token ]
            _ratePerTierDiscountPoly.push([BigNumber(10*10**16), BigNumber(15*10**16)]);                                            // [ 0.10 USD/Token, 0.15 USD/Token ]
            _tokensPerTierTotal.push([BigNumber(100000000).mul(BigNumber(10**18)), BigNumber(200000000).mul(BigNumber(10**18))]);   // [ 100m Token, 200m Token ]
            _tokensPerTierDiscountPoly.push([BigNumber(0),BigNumber(0)]);                                                           // [ 0, 0 ]
            _nonAccreditedLimitUSD.push(BigNumber(10000).mul(BigNumber(10**18)));                                                   // 10k USD
            _minimumInvestmentUSD.push(BigNumber(5*10**18));                                                                        // 5 USD
            _fundRaiseTypes.push([0, 1]);
            _wallet.push(WALLET);
            _reserveWallet.push(RESERVEWALLET);

            let config = [
                _startTime[stoId], _endTime[stoId], _ratePerTier[stoId], _ratePerTierDiscountPoly[stoId], _tokensPerTierTotal[stoId],
                _tokensPerTierDiscountPoly[stoId], _nonAccreditedLimitUSD[stoId], _minimumInvestmentUSD[stoId],
                _fundRaiseTypes[stoId], _wallet[stoId], _reserveWallet[stoId]
            ];

            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            let tx = await I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, 0, 0, { from: ISSUER, gasPrice: GAS_PRICE });
            console.log("          Gas addModule: ".grey+tx.receipt.gasUsed.toString().grey);
            assert.equal(tx.logs[2].args._type, STOKEY, "USDTieredSTO doesn't get deployed");
            assert.equal(web3.utils.hexToString(tx.logs[2].args._name),"USDTieredSTO","USDTieredSTOFactory module was not added");
            I_USDTieredSTO_Array.push(USDTieredSTO.at(tx.logs[2].args._module));

            assert.equal((await I_USDTieredSTO_Array[stoId].startTime.call()), _startTime[stoId], "Incorrect _startTime in config");
            assert.equal((await I_USDTieredSTO_Array[stoId].endTime.call()), _endTime[stoId], "Incorrect _endTime in config");
            for (var i = 0; i < _ratePerTier[stoId].length; i++) {
                assert.equal((await I_USDTieredSTO_Array[stoId].ratePerTier.call(i)).toNumber(), _ratePerTier[stoId][i].toNumber(), "Incorrect _ratePerTier in config");
                assert.equal((await I_USDTieredSTO_Array[stoId].ratePerTierDiscountPoly.call(i)).toNumber(), _ratePerTierDiscountPoly[stoId][i].toNumber(), "Incorrect _ratePerTierDiscountPoly in config");
                assert.equal((await I_USDTieredSTO_Array[stoId].tokensPerTierTotal.call(i)).toNumber(), _tokensPerTierTotal[stoId][i].toNumber(), "Incorrect _tokensPerTierTotal in config");
                assert.equal((await I_USDTieredSTO_Array[stoId].tokensPerTierDiscountPoly.call(i)).toNumber(), _tokensPerTierDiscountPoly[stoId][i].toNumber(), "Incorrect _tokensPerTierDiscountPoly in config");
            }
            assert.equal((await I_USDTieredSTO_Array[stoId].nonAccreditedLimitUSD.call()).toNumber(), _nonAccreditedLimitUSD[stoId].toNumber(), "Incorrect _nonAccreditedLimitUSD in config");
            assert.equal((await I_USDTieredSTO_Array[stoId].minimumInvestmentUSD.call()).toNumber(), _minimumInvestmentUSD[stoId].toNumber(), "Incorrect _minimumInvestmentUSD in config");
            assert.equal((await I_USDTieredSTO_Array[stoId].wallet.call()), _wallet[stoId], "Incorrect _wallet in config");
            assert.equal((await I_USDTieredSTO_Array[stoId].reserveWallet.call()), _reserveWallet[stoId], "Incorrect _reserveWallet in config");
            assert.equal((await I_USDTieredSTO_Array[stoId].getNumberOfTiers()), _tokensPerTierTotal[stoId].length, "Incorrect number of tiers");
            assert.equal((await I_USDTieredSTO_Array[stoId].getPermissions()).length, 0, "Incorrect number of permissions");
        });

        it("Should successfully attach the second STO module to the security token", async () => {
            let stoId = 1; // No discount

            _startTime.push(latestTime() + duration.days(2));
            _endTime.push(_startTime[stoId] + duration.days(100));
            _ratePerTier.push([BigNumber(10*10**16), BigNumber(15*10**16), BigNumber(15*10**16), BigNumber(15*10**16), BigNumber(15*10**16)]);
            _ratePerTierDiscountPoly.push([BigNumber(10*10**16), BigNumber(15*10**16), BigNumber(15*10**16), BigNumber(15*10**16), BigNumber(15*10**16)]);
            _tokensPerTierTotal.push([BigNumber(5*10**18), BigNumber(10*10**18), BigNumber(10*10**18), BigNumber(10*10**18), BigNumber(50*10**18)]);
            _tokensPerTierDiscountPoly.push([BigNumber(0), BigNumber(0), BigNumber(0), BigNumber(0), BigNumber(0)]);
            _nonAccreditedLimitUSD.push(BigNumber(10000).mul(BigNumber(10**18)));
            _minimumInvestmentUSD.push(BigNumber(0));
            _fundRaiseTypes.push([0, 1]);
            _wallet.push(WALLET);
            _reserveWallet.push(RESERVEWALLET);

            let config = [
                _startTime[stoId], _endTime[stoId], _ratePerTier[stoId], _ratePerTierDiscountPoly[stoId], _tokensPerTierTotal[stoId],
                _tokensPerTierDiscountPoly[stoId], _nonAccreditedLimitUSD[stoId], _minimumInvestmentUSD[stoId],
                _fundRaiseTypes[stoId], _wallet[stoId], _reserveWallet[stoId]
            ];

            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            let tx = await I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, 0, 0, { from: ISSUER, gasPrice: GAS_PRICE });
            console.log("          Gas addModule: ".grey+tx.receipt.gasUsed.toString().grey);
            assert.equal(tx.logs[2].args._type, STOKEY, "USDTieredSTO doesn't get deployed");
            assert.equal(web3.utils.hexToString(tx.logs[2].args._name),"USDTieredSTO","USDTieredSTOFactory module was not added");
            I_USDTieredSTO_Array.push(USDTieredSTO.at(tx.logs[2].args._module));

            assert.equal((await I_USDTieredSTO_Array[stoId].startTime.call()), _startTime[stoId], "Incorrect _startTime in config");
            assert.equal((await I_USDTieredSTO_Array[stoId].endTime.call()), _endTime[stoId], "Incorrect _endTime in config");
            for (var i = 0; i < _ratePerTier[stoId].length; i++) {
                assert.equal((await I_USDTieredSTO_Array[stoId].ratePerTier.call(i)).toNumber(), _ratePerTier[stoId][i].toNumber(), "Incorrect _ratePerTier in config");
                assert.equal((await I_USDTieredSTO_Array[stoId].ratePerTierDiscountPoly.call(i)).toNumber(), _ratePerTierDiscountPoly[stoId][i].toNumber(), "Incorrect _ratePerTierDiscountPoly in config");
                assert.equal((await I_USDTieredSTO_Array[stoId].tokensPerTierTotal.call(i)).toNumber(), _tokensPerTierTotal[stoId][i].toNumber(), "Incorrect _tokensPerTierTotal in config");
                assert.equal((await I_USDTieredSTO_Array[stoId].tokensPerTierDiscountPoly.call(i)).toNumber(), _tokensPerTierDiscountPoly[stoId][i].toNumber(), "Incorrect _tokensPerTierDiscountPoly in config");
            }
            assert.equal((await I_USDTieredSTO_Array[stoId].nonAccreditedLimitUSD.call()).toNumber(), _nonAccreditedLimitUSD[stoId].toNumber(), "Incorrect _nonAccreditedLimitUSD in config");
            assert.equal((await I_USDTieredSTO_Array[stoId].minimumInvestmentUSD.call()).toNumber(), _minimumInvestmentUSD[stoId].toNumber(), "Incorrect _minimumInvestmentUSD in config");
            assert.equal((await I_USDTieredSTO_Array[stoId].wallet.call()), _wallet[stoId], "Incorrect _wallet in config");
            assert.equal((await I_USDTieredSTO_Array[stoId].reserveWallet.call()), _reserveWallet[stoId], "Incorrect _reserveWallet in config");
            assert.equal(await I_USDTieredSTO_Array[stoId].getNumberOfTiers(), _tokensPerTierTotal[stoId].length, "Incorrect number of tiers");
            assert.equal((await I_USDTieredSTO_Array[stoId].getPermissions()).length, 0, "Incorrect number of permissions");
        });

        it("Should successfully attach the third STO module to the security token", async () => {
            let stoId = 2; // Poly discount

            _startTime.push(latestTime() + duration.days(2));
            _endTime.push(_startTime[stoId] + duration.days(100));
            _ratePerTier.push([BigNumber(1*10**18), BigNumber(1.5*10**18)]);                // [ 1 USD/Token, 1.5 USD/Token ]
            _ratePerTierDiscountPoly.push([BigNumber(0.5*10**18), BigNumber(1*10**18)]);    // [ 0.5 USD/Token, 1.5 USD/Token ]
            _tokensPerTierTotal.push([BigNumber(100*10**18), BigNumber(50*10**18)]);        // [ 100 Token, 50 Token ]
            _tokensPerTierDiscountPoly.push([BigNumber(100*10**18),BigNumber(25*10**18)]);  // [ 100 Token, 25 Token ]
            _nonAccreditedLimitUSD.push(BigNumber(25*10**18));                              // [ 25 USD ]
            _minimumInvestmentUSD.push(BigNumber(5));
            _fundRaiseTypes.push([0, 1]);
            _wallet.push(WALLET);
            _reserveWallet.push(RESERVEWALLET);

            let config = [
                _startTime[stoId], _endTime[stoId], _ratePerTier[stoId], _ratePerTierDiscountPoly[stoId], _tokensPerTierTotal[stoId],
                _tokensPerTierDiscountPoly[stoId], _nonAccreditedLimitUSD[stoId], _minimumInvestmentUSD[stoId],
                _fundRaiseTypes[stoId], _wallet[stoId], _reserveWallet[stoId]
            ];

            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            let tx = await I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, 0, 0, { from: ISSUER, gasPrice: GAS_PRICE });
            console.log("          Gas addModule: ".grey+tx.receipt.gasUsed.toString().grey);
            assert.equal(tx.logs[2].args._type, STOKEY, "USDTieredSTO doesn't get deployed");
            assert.equal(web3.utils.hexToString(tx.logs[2].args._name),"USDTieredSTO","USDTieredSTOFactory module was not added");
            I_USDTieredSTO_Array.push(USDTieredSTO.at(tx.logs[2].args._module));
        });

        it("Should successfully attach the fourth STO module to the security token", async () => {
            let stoId = 3;

            _startTime.push(latestTime()+ duration.days(0.1));
            _endTime.push(_startTime[stoId] + duration.days(0.1));
            _ratePerTier.push([BigNumber(10*10**16), BigNumber(15*10**16)]);
            _ratePerTierDiscountPoly.push([BigNumber(10*10**16), BigNumber(12*10**16)]);
            _tokensPerTierTotal.push([BigNumber(100*10**18), BigNumber(200*10**18)]);
            _tokensPerTierDiscountPoly.push([BigNumber(0),BigNumber(50*10**18)]);
            _nonAccreditedLimitUSD.push(BigNumber(10000).mul(BigNumber(10**18)));
            _minimumInvestmentUSD.push(BigNumber(0));
            _fundRaiseTypes.push([0, 1]);
            _wallet.push(WALLET);
            _reserveWallet.push(RESERVEWALLET);

            let config = [
                _startTime[stoId], _endTime[stoId], _ratePerTier[stoId], _ratePerTierDiscountPoly[stoId], _tokensPerTierTotal[stoId],
                _tokensPerTierDiscountPoly[stoId], _nonAccreditedLimitUSD[stoId], _minimumInvestmentUSD[stoId],
                _fundRaiseTypes[stoId], _wallet[stoId], _reserveWallet[stoId]
            ];

            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            let tx = await I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, 0, 0, { from: ISSUER, gasPrice: GAS_PRICE });
            console.log("          Gas addModule: ".grey+tx.receipt.gasUsed.toString().grey);
            assert.equal(tx.logs[2].args._type, STOKEY, "USDTieredSTO doesn't get deployed");
            assert.equal(web3.utils.hexToString(tx.logs[2].args._name),"USDTieredSTO","USDTieredSTOFactory module was not added");
            I_USDTieredSTO_Array.push(USDTieredSTO.at(tx.logs[2].args._module));
        });

        it("Should fail because rates and tier array of different length", async() => {
            let stoId = 0;

            let ratePerTier = [10];
            let ratePerTierDiscountPoly = [10];
            let tokensPerTierTotal = [10];
            let tokensPerTierDiscountPoly = [10];
            let config = [
                [_startTime[stoId], _endTime[stoId], ratePerTier, _ratePerTierDiscountPoly[stoId], _tokensPerTierTotal[stoId], _tokensPerTierDiscountPoly[stoId], _nonAccreditedLimitUSD[stoId], _minimumInvestmentUSD[stoId], _fundRaiseTypes[stoId], _wallet[stoId], _reserveWallet[stoId]],
                [_startTime[stoId], _endTime[stoId], _ratePerTier[stoId], ratePerTierDiscountPoly, _tokensPerTierTotal[stoId], _tokensPerTierDiscountPoly[stoId], _nonAccreditedLimitUSD[stoId], _minimumInvestmentUSD[stoId], _fundRaiseTypes[stoId], _wallet[stoId], _reserveWallet[stoId]],
                [_startTime[stoId], _endTime[stoId], _ratePerTier[stoId], _ratePerTierDiscountPoly[stoId], tokensPerTierTotal, _tokensPerTierDiscountPoly[stoId], _nonAccreditedLimitUSD[stoId], _minimumInvestmentUSD[stoId], _fundRaiseTypes[stoId], _wallet[stoId], _reserveWallet[stoId]],
                [_startTime[stoId], _endTime[stoId], _ratePerTier[stoId], _ratePerTierDiscountPoly[stoId], _tokensPerTierTotal[stoId], tokensPerTierDiscountPoly, _nonAccreditedLimitUSD[stoId], _minimumInvestmentUSD[stoId], _fundRaiseTypes[stoId], _wallet[stoId], _reserveWallet[stoId]]
            ];
            for (var i = 0; i < config.length; i++) {
                let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config[i]);
                let errorThrown = false;
                try {
                    await I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, 0, 0, { from: ISSUER });
                } catch(error) {
                    errorThrown = true;
                    ensureException(error);
                }
                assert.ok(errorThrown, MESSAGE);
            }
        });

        it("Should fail because rate of token should be greater than 0", async() => {
            let stoId = 0;

            let ratePerTier = [BigNumber(10*10**16), BigNumber(0)];
            let config = [_startTime[stoId], _endTime[stoId], ratePerTier, _ratePerTierDiscountPoly[stoId], _tokensPerTierTotal[stoId], _tokensPerTierDiscountPoly[stoId], _nonAccreditedLimitUSD[stoId], _minimumInvestmentUSD[stoId], _fundRaiseTypes[stoId], _wallet[stoId], _reserveWallet[stoId]];
            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            let errorThrown = false;
            try {
                await I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, 0, 0, { from: ISSUER });
            } catch(error) {
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, MESSAGE);
        });

        it("Should fail because Zero address is not permitted for wallet", async() => {
            let stoId = 0;

            let wallet = "0x0000000000000000000000000000000000000000";
            let config = [_startTime[stoId], _endTime[stoId], _ratePerTier[stoId], _ratePerTierDiscountPoly[stoId], _tokensPerTierTotal[stoId], _tokensPerTierDiscountPoly[stoId], _nonAccreditedLimitUSD[stoId], _minimumInvestmentUSD[stoId], _fundRaiseTypes[stoId], wallet, _reserveWallet[stoId]];
            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            let errorThrown = false;
            try {
                await I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, 0, 0, { from: ISSUER });
            } catch(error) {
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, MESSAGE);
        });

        it("Should fail because Zero address is not permitted for reserveWallet", async() => {
            let stoId = 0;

            let reserveWallet = "0x0000000000000000000000000000000000000000";
            let config = [_startTime[stoId], _endTime[stoId], _ratePerTier[stoId], _ratePerTierDiscountPoly[stoId], _tokensPerTierTotal[stoId], _tokensPerTierDiscountPoly[stoId], _nonAccreditedLimitUSD[stoId], _minimumInvestmentUSD[stoId], _fundRaiseTypes[stoId], _wallet[stoId], reserveWallet];
            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            let errorThrown = false;
            try {
                await I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, 0, 0, { from: ISSUER });
            } catch(error) {
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, MESSAGE);
        });

        it("Should fail because end time before start time", async() => {
            let stoId = 0;

            let startTime = latestTime() + duration.days(35);
            let endTime  = latestTime() + duration.days(1);
            let config = [startTime, endTime, _ratePerTier[stoId], _ratePerTierDiscountPoly[stoId], _tokensPerTierTotal[stoId], _tokensPerTierDiscountPoly[stoId], _nonAccreditedLimitUSD[stoId], _minimumInvestmentUSD[stoId], _fundRaiseTypes[stoId], _wallet[stoId], _reserveWallet[stoId]];
            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            let errorThrown = false;
            try {
                await I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, 0, 0, { from: ISSUER });
            } catch(error) {
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, MESSAGE);
        });

        it("Should fail because start time is in the past", async() => {
            let stoId = 0;

            let startTime = latestTime() - duration.days(35);
            let endTime  = startTime + duration.days(50);
            let config = [startTime, endTime, _ratePerTier[stoId], _ratePerTierDiscountPoly[stoId], _tokensPerTierTotal[stoId], _tokensPerTierDiscountPoly[stoId], _nonAccreditedLimitUSD[stoId], _minimumInvestmentUSD[stoId], _fundRaiseTypes[stoId], _wallet[stoId], _reserveWallet[stoId]];
            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            let errorThrown = false;
            try {
                await I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, 0, 0, { from: ISSUER });
            } catch(error) {
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, MESSAGE);
        });
    });

    describe("Test modifying configuration", async() => {

        it("Should successfully change config before startTime", async() => {
            let stoId = 3;

            await I_USDTieredSTO_Array[stoId].modifyFunding([0], { from: ISSUER });
            assert.equal(await I_USDTieredSTO_Array[stoId].fundRaiseType.call(0),true,"STO Configuration doesn't set as expected");
            assert.equal(await I_USDTieredSTO_Array[stoId].fundRaiseType.call(1),false,"STO Configuration doesn't set as expected");

            await I_USDTieredSTO_Array[stoId].modifyFunding([1], { from: ISSUER });
            assert.equal(await I_USDTieredSTO_Array[stoId].fundRaiseType.call(0),false,"STO Configuration doesn't set as expected");
            assert.equal(await I_USDTieredSTO_Array[stoId].fundRaiseType.call(1),true,"STO Configuration doesn't set as expected");

            await I_USDTieredSTO_Array[stoId].modifyFunding([0,1], { from: ISSUER });
            assert.equal(await I_USDTieredSTO_Array[stoId].fundRaiseType.call(0),true,"STO Configuration doesn't set as expected");
            assert.equal(await I_USDTieredSTO_Array[stoId].fundRaiseType.call(1),true,"STO Configuration doesn't set as expected");

            await I_USDTieredSTO_Array[stoId].modifyLimits(BigNumber(1*10**18), BigNumber(15*10**18), { from: ISSUER });
            assert.equal((await I_USDTieredSTO_Array[stoId].minimumInvestmentUSD.call()).toNumber(),BigNumber(15*10**18).toNumber(),"STO Configuration doesn't set as expected");
            assert.equal((await I_USDTieredSTO_Array[stoId].nonAccreditedLimitUSD.call()).toNumber(),BigNumber(1*10**18).toNumber(),"STO Configuration doesn't set as expected");

            await I_USDTieredSTO_Array[stoId].modifyTiers([BigNumber(15*10**18)], [BigNumber(13*10**18)], [BigNumber(15*10**20)], [BigNumber(15*10**20)], { from: ISSUER });
            assert.equal((await I_USDTieredSTO_Array[stoId].ratePerTier.call(0)).toNumber(),BigNumber(15*10**18).toNumber(),"STO Configuration doesn't set as expected");
            assert.equal((await I_USDTieredSTO_Array[stoId].ratePerTierDiscountPoly.call(0)).toNumber(),BigNumber(13*10**18).toNumber(),"STO Configuration doesn't set as expected");
            assert.equal((await I_USDTieredSTO_Array[stoId].tokensPerTierTotal.call(0)),BigNumber(15*10**20).toNumber(),"STO Configuration doesn't set as expected");
            assert.equal((await I_USDTieredSTO_Array[stoId].tokensPerTierDiscountPoly.call(0)),BigNumber(15*10**20).toNumber(),"STO Configuration doesn't set as expected");

            let tempTime1 = latestTime() + duration.days(0.1);
            let tempTime2 = latestTime() + duration.days(0.2);

            await I_USDTieredSTO_Array[stoId].modifyTimes(tempTime1, tempTime2, { from: ISSUER });
            assert.equal(await I_USDTieredSTO_Array[stoId].startTime.call(),tempTime1,"STO Configuration doesn't set as expected");
            assert.equal(await I_USDTieredSTO_Array[stoId].endTime.call(),tempTime2,"STO Configuration doesn't set as expected");

            await I_USDTieredSTO_Array[stoId].modifyAddresses("0x0000000000000000000000000400000000000000", "0x0000000000000000000003000000000000000000", { from: ISSUER });
            assert.equal(await I_USDTieredSTO_Array[stoId].wallet.call(),"0x0000000000000000000000000400000000000000","STO Configuration doesn't set as expected");
            assert.equal(await I_USDTieredSTO_Array[stoId].reserveWallet.call(),"0x0000000000000000000003000000000000000000","STO Configuration doesn't set as expected");
        });

        it("Should fail to change config after endTime", async() => {
            let stoId = 3;

            let snapId = await takeSnapshot();
            await increaseTime(duration.days(1));

            let errorThrown1 = false;
            try {
                await I_USDTieredSTO_Array[stoId].modifyFunding([0,1], { from: ISSUER });
            } catch(error) {
                errorThrown1 = true;
                ensureException(error);
            }
            assert.ok(errorThrown1, MESSAGE);

            let errorThrown2 = false;
            try {
                await I_USDTieredSTO_Array[stoId].modifyLimits(BigNumber(15*10**18), BigNumber(1*10**18), { from: ISSUER });
            } catch(error) {
                errorThrown2 = true;
                ensureException(error);
            }
            assert.ok(errorThrown2, MESSAGE);

            let errorThrown3 = false;
            try {
                await I_USDTieredSTO_Array[stoId].modifyTiers([BigNumber(15*10**18)], [BigNumber(13*10**18)], [BigNumber(15*10**20)], [BigNumber(15*10**20)], { from: ISSUER });
            } catch(error) {
                errorThrown3 = true;
                ensureException(error);
            }
            assert.ok(errorThrown3, MESSAGE);

            let tempTime1 = latestTime();
            let tempTime2 = latestTime() + duration.days(3);

            let errorThrown4 = false;
            try {
                await I_USDTieredSTO_Array[stoId].modifyTimes(tempTime1, tempTime2, { from: ISSUER });
            } catch(error) {
                errorThrown4 = true;
                ensureException(error);
            }
            assert.ok(errorThrown4, MESSAGE);

            let errorThrown5 = false;
            try {
                await I_USDTieredSTO_Array[stoId].modifyAddresses("0x0000000000000000000000000400000000000000", "0x0000000000000000000003000000000000000000", { from: ISSUER });
            } catch(error) {
                errorThrown5 = true;
                ensureException(error);
            }
            assert.ok(errorThrown5, MESSAGE);

            await revertToSnapshot(snapId);
        });
    });

    describe("Test buying failure conditions", async() => {

        it("should fail if before STO start time", async() => {
            let stoId = 0;
            let snapId = await takeSnapshot();

            assert.equal(await I_USDTieredSTO_Array[stoId].isOpen(),false,"STO is not showing correct status");

            // Whitelist
            let fromTime = latestTime();
            let toTime = latestTime() + duration.days(15);
            let expiryTime = toTime + duration.days(100);
            let whitelisted = true;

            await I_GeneralTransferManager.modifyWhitelist(ACCREDITED1, fromTime, toTime, expiryTime, whitelisted,{ from: ISSUER });
            await I_GeneralTransferManager.modifyWhitelist(NONACCREDITED1, fromTime, toTime, expiryTime, whitelisted,{ from: ISSUER });

            // // Advance time to after STO start
            // await increaseTime(duration.days(3));

            // Set as accredited
            await I_USDTieredSTO_Array[stoId].changeAccredited([ACCREDITED1], [true], { from: ISSUER });

            // Prep for investments
            let investment_ETH = web3.utils.toWei('1', 'ether'); // Invest 1 ETH
            let investment_POLY = web3.utils.toWei('10000', 'ether'); // Invest 10000 POLY
            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, {from: NONACCREDITED1});
            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, {from: ACCREDITED1});

            // NONACCREDITED ETH
            let errorThrown1 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, value: investment_ETH });
            } catch(error) {
                errorThrown1 = true;
                ensureException(error);
            }
            assert.ok(errorThrown1, 'NONACCREDITED ETH investment succeeded when it should not');

            // NONACCREDITED POLY
            let errorThrown2 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, {from: NONACCREDITED1});
            } catch(error) {
                errorThrown2 = true;
                ensureException(error);
            }
            assert.ok(errorThrown2, 'NONACCREDITED POLY investment succeeded when it should not');

            // ACCREDITED ETH
            let errorThrown3 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithETH(ACCREDITED1, { from: ACCREDITED1, value: investment_ETH });
            } catch(error) {
                errorThrown3 = true;
                ensureException(error);
            }
            assert.ok(errorThrown3, 'ACCREDITED ETH investment succeeded when it should not');

            // ACCREDITED POLY
            let errorThrown4 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, {from: ACCREDITED1});
            } catch(error) {
                errorThrown4 = true;
                ensureException(error);
            }
            assert.ok(errorThrown4, 'ACCREDITED POLY investment succeeded when it should not');

            await revertToSnapshot(snapId);
        });

        it("should fail if not whitelisted", async() => {
            let stoId = 0;
            let snapId = await takeSnapshot();

            // // Whitelist
            // let fromTime = latestTime();
            // let toTime = latestTime() + duration.days(15);
            // let expiryTime = toTime + duration.days(100);
            // let whitelisted = true;
            //
            // await I_GeneralTransferManager.modifyWhitelist(ACCREDITED1, fromTime, toTime, expiryTime, whitelisted,{ from: ISSUER });
            // await I_GeneralTransferManager.modifyWhitelist(NONACCREDITED1, fromTime, toTime, expiryTime, whitelisted,{ from: ISSUER });

            // Advance time to after STO start
            await increaseTime(duration.days(3));

            // Set as accredited
            await I_USDTieredSTO_Array[stoId].changeAccredited([ACCREDITED1], [true], { from: ISSUER });

            // Prep for investments
            let investment_ETH = web3.utils.toWei('1', 'ether'); // Invest 1 ETH
            let investment_POLY = web3.utils.toWei('10000', 'ether'); // Invest 10000 POLY
            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, {from: NONACCREDITED1});
            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, {from: ACCREDITED1});

            // NONACCREDITED ETH
            let errorThrown1 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, value: investment_ETH });
            } catch(error) {
                errorThrown1 = true;
                ensureException(error);
            }
            assert.ok(errorThrown1, 'NONACCREDITED ETH investment succeeded when it should not');

            // NONACCREDITED POLY
            let errorThrown2 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, {from: NONACCREDITED1});
            } catch(error) {
                errorThrown2 = true;
                ensureException(error);
            }
            assert.ok(errorThrown2, 'NONACCREDITED POLY investment succeeded when it should not');

            // ACCREDITED ETH
            let errorThrown3 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithETH(ACCREDITED1, { from: ACCREDITED1, value: investment_ETH });
            } catch(error) {
                errorThrown3 = true;
                ensureException(error);
            }
            assert.ok(errorThrown3, 'ACCREDITED ETH investment succeeded when it should not');

            // ACCREDITED POLY
            let errorThrown4 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, {from: ACCREDITED1});
            } catch(error) {
                errorThrown4 = true;
                ensureException(error);
            }
            assert.ok(errorThrown4, 'ACCREDITED POLY investment succeeded when it should not');

            await revertToSnapshot(snapId);
        });

        it("should fail if minimumInvestmentUSD not met", async() => {
            let stoId = 0;
            let tierId = 0;
            let snapId = await takeSnapshot();

            // Whitelist
            let fromTime = latestTime();
            let toTime = latestTime() + duration.days(15);
            let expiryTime = toTime + duration.days(100);
            let whitelisted = true;

            await I_GeneralTransferManager.modifyWhitelist(ACCREDITED1, fromTime, toTime, expiryTime, whitelisted,{ from: ISSUER });
            await I_GeneralTransferManager.modifyWhitelist(NONACCREDITED1, fromTime, toTime, expiryTime, whitelisted,{ from: ISSUER });

            // Advance time to after STO start
            await increaseTime(duration.days(3));

            // Set as accredited
            await I_USDTieredSTO_Array[stoId].changeAccredited([ACCREDITED1], [true], { from: ISSUER });

            let investment_USD = BigNumber(2).mul(10**18);
            let investment_ETH = await convert(stoId, tierId, false,  "USD", "ETH", investment_USD);
            let investment_POLY = await convert(stoId, tierId, false, "USD", "POLY", investment_USD);

            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, {from: NONACCREDITED1});
            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, {from: ACCREDITED1});

            // NONACCREDITED ETH
            let errorThrown1 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, value: investment_ETH });
            } catch(error) {
                errorThrown1 = true;
                ensureException(error);
            }
            assert.ok(errorThrown1, 'NONACCREDITED ETH investment succeeded when it should not');

            // NONACCREDITED POLY
            let errorThrown2 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, {from: NONACCREDITED1});
            } catch(error) {
                errorThrown2 = true;
                ensureException(error);
            }
            assert.ok(errorThrown2, 'NONACCREDITED POLY investment succeeded when it should not');

            // ACCREDITED ETH
            let errorThrown3 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithETH(ACCREDITED1, { from: ACCREDITED1, value: investment_ETH });
            } catch(error) {
                errorThrown3 = true;
                ensureException(error);
            }
            assert.ok(errorThrown3, 'ACCREDITED ETH investment succeeded when it should not');

            // ACCREDITED POLY
            let errorThrown4 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, {from: ACCREDITED1});
            } catch(error) {
                errorThrown4 = true;
                ensureException(error);
            }
            assert.ok(errorThrown4, 'ACCREDITED POLY investment succeeded when it should not');

            await revertToSnapshot(snapId);
        });

        it("should successfully pause the STO and make investments fail, then unpause and succeed", async() => {
            let stoId = 0;
            let snapId = await takeSnapshot();

            // Whitelist
            let fromTime = latestTime();
            let toTime = latestTime() + duration.days(15);
            let expiryTime = toTime + duration.days(100);
            let whitelisted = true;

            await I_GeneralTransferManager.modifyWhitelist(ACCREDITED1, fromTime, toTime, expiryTime, whitelisted,{ from: ISSUER });
            await I_GeneralTransferManager.modifyWhitelist(NONACCREDITED1, fromTime, toTime, expiryTime, whitelisted,{ from: ISSUER });

            // Advance time to after STO start
            await increaseTime(duration.days(3));

            // Set as accredited
            await I_USDTieredSTO_Array[stoId].changeAccredited([ACCREDITED1], [true], { from: ISSUER });

            // Pause the STO
            await I_USDTieredSTO_Array[stoId].pause({ from: ISSUER });
            assert.equal(await I_USDTieredSTO_Array[stoId].paused.call(), true, 'STO did not pause successfully');

            // Prep for investments
            let investment_ETH = web3.utils.toWei('1', 'ether'); // Invest 1 ETH
            let investment_POLY = web3.utils.toWei('10000', 'ether'); // Invest 10000 POLY
            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, {from: NONACCREDITED1});
            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, {from: ACCREDITED1});

            // NONACCREDITED ETH
            let errorThrown1 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, value: investment_ETH });
            } catch(error) {
                errorThrown1 = true;
                ensureException(error);
            }
            assert.ok(errorThrown1, 'NONACCREDITED ETH investment succeeded when it should not');

            // NONACCREDITED POLY
            let errorThrown2 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, {from: NONACCREDITED1});
            } catch(error) {
                errorThrown2 = true;
                ensureException(error);
            }
            assert.ok(errorThrown2, 'NONACCREDITED POLY investment succeeded when it should not');

            // ACCREDITED ETH
            let errorThrown3 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithETH(ACCREDITED1, { from: ACCREDITED1, value: investment_ETH });
            } catch(error) {
                errorThrown3 = true;
                ensureException(error);
            }
            assert.ok(errorThrown3, 'ACCREDITED ETH investment succeeded when it should not');

            // ACCREDITED POLY
            let errorThrown4 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, {from: ACCREDITED1});
            } catch(error) {
                errorThrown4 = true;
                ensureException(error);
            }
            assert.ok(errorThrown4, 'ACCREDITED POLY investment succeeded when it should not');

            // Unpause the STO
            await I_USDTieredSTO_Array[stoId].unpause({ from: ISSUER });
            assert.equal(await I_USDTieredSTO_Array[stoId].paused.call(), false, 'STO did not unpause successfully');

            await I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, value: investment_ETH });
            await I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, {from: NONACCREDITED1});
            await I_USDTieredSTO_Array[stoId].buyWithETH(ACCREDITED1, { from: ACCREDITED1, value: investment_ETH });
            await I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, {from: ACCREDITED1});

            await revertToSnapshot(snapId);
        });

        it("should fail if after STO end time", async() => {
            let stoId = 3;
            let snapId = await takeSnapshot();

            // Whitelist
            let fromTime = latestTime();
            let toTime = latestTime() + duration.days(15);
            let expiryTime = toTime + duration.days(100);
            let whitelisted = true;

            await I_GeneralTransferManager.modifyWhitelist(ACCREDITED1, fromTime, toTime, expiryTime, whitelisted,{ from: ISSUER });
            await I_GeneralTransferManager.modifyWhitelist(NONACCREDITED1, fromTime, toTime, expiryTime, whitelisted,{ from: ISSUER });

            // Advance time to after STO end
            await increaseTime(duration.days(3));

            assert.equal(await I_USDTieredSTO_Array[stoId].isOpen(),false,"STO is not showing correct status");

            // Set as accredited
            await I_USDTieredSTO_Array[stoId].changeAccredited([ACCREDITED1], [true], { from: ISSUER });

            // Prep for investments
            let investment_ETH = web3.utils.toWei('1', 'ether'); // Invest 1 ETH
            let investment_POLY = web3.utils.toWei('10000', 'ether'); // Invest 10000 POLY
            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, {from: NONACCREDITED1});
            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, {from: ACCREDITED1});

            // NONACCREDITED ETH
            let errorThrown1 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, value: investment_ETH });
            } catch(error) {
                errorThrown1 = true;
                ensureException(error);
            }
            assert.ok(errorThrown1, 'NONACCREDITED ETH investment succeeded when it should not');

            // NONACCREDITED POLY
            let errorThrown2 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, {from: NONACCREDITED1});
            } catch(error) {
                errorThrown2 = true;
                ensureException(error);
            }
            assert.ok(errorThrown2, 'NONACCREDITED POLY investment succeeded when it should not');

            // ACCREDITED ETH
            let errorThrown3 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithETH(ACCREDITED1, { from: ACCREDITED1, value: investment_ETH });
            } catch(error) {
                errorThrown3 = true;
                ensureException(error);
            }
            assert.ok(errorThrown3, 'ACCREDITED ETH investment succeeded when it should not');

            // ACCREDITED POLY
            let errorThrown4 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, {from: ACCREDITED1});
            } catch(error) {
                errorThrown4 = true;
                ensureException(error);
            }
            assert.ok(errorThrown4, 'ACCREDITED POLY investment succeeded when it should not');

            await revertToSnapshot(snapId);
        });

        it("should fail if finalized", async() => {
            let stoId = 0;
            let snapId = await takeSnapshot();

            // Whitelist
            let fromTime = latestTime();
            let toTime = latestTime();
            let expiryTime = toTime + duration.days(100);
            let whitelisted = true;

            await I_GeneralTransferManager.modifyWhitelist(ACCREDITED1, fromTime, toTime, expiryTime, whitelisted,{ from: ISSUER });
            await I_GeneralTransferManager.modifyWhitelist(NONACCREDITED1, fromTime, toTime, expiryTime, whitelisted,{ from: ISSUER });
            await I_GeneralTransferManager.modifyWhitelist(RESERVEWALLET, fromTime, toTime, expiryTime, whitelisted,{ from: ISSUER });

            // Advance time to after STO start
            await increaseTime(duration.days(3));

            // Set as accredited
            await I_USDTieredSTO_Array[stoId].changeAccredited([ACCREDITED1], [true], { from: ISSUER });

            // Finalize STO
            await I_USDTieredSTO_Array[stoId].finalize({ from: ISSUER });
            assert.equal(await I_USDTieredSTO_Array[stoId].isFinalized.call(), true, "STO has not been finalized");
            assert.equal(await I_USDTieredSTO_Array[stoId].isOpen(),false,"STO is not showing correct status");

            // Attempt to call function again
            let errorThrown = false;
            try {
                await I_USDTieredSTO_Array[stoId].finalize({ from: ISSUER });
            } catch(error) {
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, 'STO was finalized a second time');

            // Prep for investments
            let investment_ETH = web3.utils.toWei('1', 'ether'); // Invest 1 ETH
            let investment_POLY = web3.utils.toWei('10000', 'ether'); // Invest 10000 POLY
            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, {from: NONACCREDITED1});
            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, {from: ACCREDITED1});

            // NONACCREDITED ETH
            let errorThrown1 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, value: investment_ETH });
            } catch(error) {
                errorThrown1 = true;
                ensureException(error);
            }
            assert.ok(errorThrown1, 'NONACCREDITED ETH investment succeeded when it should not');

            // NONACCREDITED POLY
            let errorThrown2 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, {from: NONACCREDITED1});
            } catch(error) {
                errorThrown2 = true;
                ensureException(error);
            }
            assert.ok(errorThrown2, 'NONACCREDITED POLY investment succeeded when it should not');

            // ACCREDITED ETH
            let errorThrown3 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithETH(ACCREDITED1, { from: ACCREDITED1, value: investment_ETH });
            } catch(error) {
                errorThrown3 = true;
                ensureException(error);
            }
            assert.ok(errorThrown3, 'ACCREDITED ETH investment succeeded when it should not');

            // ACCREDITED POLY
            let errorThrown4 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, {from: ACCREDITED1});
            } catch(error) {
                errorThrown4 = true;
                ensureException(error);
            }
            assert.ok(errorThrown4, 'ACCREDITED POLY investment succeeded when it should not');

            await revertToSnapshot(snapId);
        });
    });

    describe("Prep STO", async() => {

        it("should jump forward to after STO start", async() => {
            let stoId = 0;
            await increaseTime(duration.days(3));
            assert.equal(await I_USDTieredSTO_Array[stoId].isOpen(),true,"STO is not showing correct status");
        });

        it("should whitelist ACCREDITED1 and NONACCREDITED1", async() => {
            let stoId = 0;

            let fromTime = latestTime();
            let toTime = latestTime() + duration.days(15);
            let expiryTime = toTime + duration.days(100);
            let whitelisted = true;

            const tx1 = await I_GeneralTransferManager.modifyWhitelist(NONACCREDITED1, fromTime, toTime, expiryTime, whitelisted,{ from: ISSUER });
            assert.equal(tx1.logs[0].args._investor, NONACCREDITED1, "Failed in adding the investor in whitelist");
            const tx2 = await I_GeneralTransferManager.modifyWhitelist(ACCREDITED1, fromTime, toTime, expiryTime, whitelisted,{ from: ISSUER });
            assert.equal(tx2.logs[0].args._investor, ACCREDITED1, "Failed in adding the investor in whitelist");
        });

        it("should successfully modify accredited addresses for first STO", async() => {
            let stoId = 0;

            let status1 = await I_USDTieredSTO_Array[stoId].accredited.call(NONACCREDITED1);
            assert.equal(status1, false, "Initial accreditation is set to true");

            await I_USDTieredSTO_Array[stoId].changeAccredited([NONACCREDITED1], [true], { from: ISSUER });
            let status2 = await I_USDTieredSTO_Array[stoId].accredited.call(NONACCREDITED1);
            assert.equal(status2, true, "Failed to set single address");

            await I_USDTieredSTO_Array[stoId].changeAccredited([NONACCREDITED1, ACCREDITED1], [false, true], { from: ISSUER });
            let status3 = await I_USDTieredSTO_Array[stoId].accredited.call(NONACCREDITED1);
            assert.equal(status3, false, "Failed to set multiple addresses");
            let status4 = await I_USDTieredSTO_Array[stoId].accredited.call(ACCREDITED1);
            assert.equal(status4, true, "Failed to set multiple addresses");

            let errorThrown = false;
            try {
                await I_USDTieredSTO_Array[stoId].changeAccredited([NONACCREDITED1, ACCREDITED1], [true], { from: ISSUER });
            } catch(error) {
                errorThrown = true;
                ensureException(error);
            }
            assert.ok(errorThrown, "Set accreditation despite input array of different size");
        });

        it("should successfully modify accredited addresses for second STO", async() => {
            let stoId = 1;

            await I_USDTieredSTO_Array[stoId].changeAccredited([NONACCREDITED1, ACCREDITED1], [false, true], { from: ISSUER });
            let status1 = await I_USDTieredSTO_Array[stoId].accredited.call(NONACCREDITED1);
            let status2 = await I_USDTieredSTO_Array[stoId].accredited.call(ACCREDITED1);
            assert.equal(status1, false, "Failed to set multiple address");
            assert.equal(status2, true, "Failed to set multiple address");
        });
    });

    describe("Buy Tokens with no discount", async() => {

        it("should successfully buy using fallback at tier 0 for NONACCREDITED1", async() => {
            let stoId = 0;
            let tierId = 0;

            let investment_Token = BigNumber(50).mul(10**18);
            let investment_USD = await convert(stoId, tierId, false, "TOKEN", "USD", investment_Token);
            let investment_ETH = await convert(stoId, tierId, false, "TOKEN", "ETH", investment_Token);
            let investment_POLY = await convert(stoId, tierId, false, "TOKEN", "POLY", investment_Token);

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let init_InvestorETHBal = BigNumber(await web3.eth.getBalance(NONACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedUSD = await I_USDTieredSTO_Array[stoId].fundsRaisedUSD.call();
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaisedETH.call();
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaisedPOLY.call();
            let init_WalletETHBal = BigNumber(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            let tx1 = await web3.eth.sendTransaction({ from: NONACCREDITED1, to: I_USDTieredSTO_Array[stoId].address, value: investment_ETH, gasPrice: GAS_PRICE, gas:1000000 });
            let gasCost1 = BigNumber(GAS_PRICE).mul(tx1.gasUsed);
            console.log("          Gas fallback purchase: ".grey+tx1.gasUsed.toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let final_InvestorETHBal = BigNumber(await web3.eth.getBalance(NONACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedUSD = await I_USDTieredSTO_Array[stoId].fundsRaisedUSD.call();
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaisedETH.call();
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaisedPOLY.call();
            let final_WalletETHBal = BigNumber(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            assert.equal(final_TokenSupply.toNumber(), init_TokenSupply.add(investment_Token).toNumber(), "Token Supply not changed as expected");
            assert.equal(final_InvestorTokenBal.toNumber(), init_InvestorTokenBal.add(investment_Token).toNumber(), "Investor Token Balance not changed as expected");
            assert.equal(final_InvestorETHBal.toNumber(), init_InvestorETHBal.sub(gasCost1).sub(investment_ETH).toNumber(), "Investor ETH Balance not changed as expected");
            assert.equal(final_InvestorPOLYBal.toNumber(), init_InvestorPOLYBal.toNumber(), "Investor POLY Balance not changed as expected");
            assert.equal(final_STOTokenSold.toNumber(), init_STOTokenSold.add(investment_Token).toNumber(), "STO Token Sold not changed as expected");
            assert.equal(final_STOETHBal.toNumber(), init_STOETHBal.toNumber(), "STO ETH Balance not changed as expected");
            assert.equal(final_STOPOLYBal.toNumber(), init_STOPOLYBal.toNumber(), "STO POLY Balance not changed as expected");
            assert.equal(final_RaisedUSD.toNumber(), init_RaisedUSD.add(investment_USD).toNumber(), "Raised USD not changed as expected");
            assert.equal(final_RaisedETH.toNumber(), init_RaisedETH.add(investment_ETH).toNumber(), "Raised ETH not changed as expected");
            assert.equal(final_RaisedPOLY.toNumber(), init_RaisedPOLY.toNumber(), "Raised POLY not changed as expected");
            assert.equal(final_WalletETHBal.toNumber(), init_WalletETHBal.add(investment_ETH).toNumber(), "Wallet ETH Balance not changed as expected");
            assert.equal(final_WalletPOLYBal.toNumber(), init_WalletPOLYBal.toNumber(), "Wallet POLY Balance not changed as expected");

            // Additional checks on getters
            assert.equal((await I_USDTieredSTO_Array[stoId].investorCount.call()).toNumber(), 1, "Investor count not changed as expected");
            assert.equal((await I_USDTieredSTO_Array[stoId].getTokensSold()).toNumber(), investment_Token.toNumber(), "getTokensSold not changed as expected");
            assert.equal((await I_USDTieredSTO_Array[stoId].getTokensMinted()).toNumber(), investment_Token.toNumber(), "getTokensMinted not changed as expected");
            assert.equal((await I_USDTieredSTO_Array[stoId].getTokensSoldForETH()).toNumber(), investment_Token.toNumber(), "getTokensSoldForETH not changed as expected");
            assert.equal((await I_USDTieredSTO_Array[stoId].getTokensSoldForPOLY()).toNumber(), 0, "getTokensSoldForPOLY not changed as expected");
            assert.equal((await I_USDTieredSTO_Array[stoId].investorInvestedUSD.call(NONACCREDITED1)).toNumber(), investment_USD.toNumber(), "investorInvestedUSD not changed as expected");
            assert.equal((await I_USDTieredSTO_Array[stoId].investorInvestedETH.call(NONACCREDITED1)).toNumber(), investment_ETH.toNumber(), "investorInvestedETH not changed as expected");
            assert.equal((await I_USDTieredSTO_Array[stoId].investorInvestedPOLY.call(NONACCREDITED1)).toNumber(), 0, "investorInvestedPOLY not changed as expected");
        });

        it("should successfully buy using buyWithETH at tier 0 for NONACCREDITED1", async() => {
            let stoId = 0;
            let tierId = 0;

            let investment_Token = BigNumber(50).mul(10**18);
            let investment_USD = await convert(stoId, tierId, false, "TOKEN", "USD", investment_Token);
            let investment_ETH = await convert(stoId, tierId, false, "TOKEN", "ETH", investment_Token);
            let investment_POLY = await convert(stoId, tierId, false, "TOKEN", "POLY", investment_Token);

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let init_InvestorETHBal = BigNumber(await web3.eth.getBalance(NONACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaisedETH.call();
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaisedPOLY.call();
            let init_WalletETHBal = BigNumber(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            let tx1 = await I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, value: investment_ETH, gasPrice: GAS_PRICE });
            let gasCost1 = BigNumber(GAS_PRICE).mul(tx1.receipt.gasUsed);
            console.log("          Gas buyWithETH: ".grey+tx1.receipt.gasUsed.toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let final_InvestorETHBal = BigNumber(await web3.eth.getBalance(NONACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaisedETH.call();
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaisedPOLY.call();
            let final_WalletETHBal = BigNumber(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

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
            let stoId = 0;
            let tierId = 0;

            let investment_Token = BigNumber(50).mul(10**18);
            let investment_USD = await convert(stoId, tierId, false, "TOKEN", "USD", investment_Token);
            let investment_ETH = await convert(stoId, tierId, false, "TOKEN", "ETH", investment_Token);
            let investment_POLY = await convert(stoId, tierId, false, "TOKEN", "POLY", investment_Token);

            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, {from: NONACCREDITED1});

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let init_InvestorETHBal = BigNumber(await web3.eth.getBalance(NONACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaisedETH.call();
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaisedPOLY.call();
            let init_WalletETHBal = BigNumber(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            // Buy With POLY
            let tx2 = await I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, { from: NONACCREDITED1, gasPrice: GAS_PRICE });
            let gasCost2 = BigNumber(GAS_PRICE).mul(tx2.receipt.gasUsed);
            console.log("          Gas buyWithPOLY: ".grey+tx2.receipt.gasUsed.toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let final_InvestorETHBal = BigNumber(await web3.eth.getBalance(NONACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaisedETH.call();
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaisedPOLY.call();
            let final_WalletETHBal = BigNumber(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

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
            let stoId = 0;
            let tierId = 0;

            await I_USDTieredSTO_Array[stoId].changeAccredited([ACCREDITED1], [true], { from: ISSUER });

            let investment_Token = BigNumber(50).mul(10**18);
            let investment_USD = await convert(stoId, tierId, false, "TOKEN", "USD", investment_Token);
            let investment_ETH = await convert(stoId, tierId, false, "TOKEN", "ETH", investment_Token);
            let investment_POLY = await convert(stoId, tierId, false, "TOKEN", "POLY", investment_Token);

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let init_InvestorETHBal = BigNumber(await web3.eth.getBalance(ACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaisedETH.call();
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaisedPOLY.call();
            let init_WalletETHBal = BigNumber(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            let tx1 = await web3.eth.sendTransaction({ from: ACCREDITED1, to: I_USDTieredSTO_Array[stoId].address, value: investment_ETH, gasPrice: GAS_PRICE, gas:1000000 });
            let gasCost1 = BigNumber(GAS_PRICE).mul(tx1.gasUsed);
            console.log("          Gas fallback purchase: ".grey+tx1.gasUsed.toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let final_InvestorETHBal = BigNumber(await web3.eth.getBalance(ACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaisedETH.call();
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaisedPOLY.call();
            let final_WalletETHBal = BigNumber(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

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
            let stoId = 0;
            let tierId = 0;

            let investment_Token = BigNumber(50).mul(10**18);
            let investment_USD = await convert(stoId, tierId, false, "TOKEN", "USD", investment_Token);
            let investment_ETH = await convert(stoId, tierId, false, "TOKEN", "ETH", investment_Token);
            let investment_POLY = await convert(stoId, tierId, false, "TOKEN", "POLY", investment_Token);

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let init_InvestorETHBal = BigNumber(await web3.eth.getBalance(ACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaisedETH.call();
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaisedPOLY.call();
            let init_WalletETHBal = BigNumber(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            let tx1 = await I_USDTieredSTO_Array[stoId].buyWithETH(ACCREDITED1, { from: ACCREDITED1, value: investment_ETH, gasPrice: GAS_PRICE });
            let gasCost1 = BigNumber(GAS_PRICE).mul(tx1.receipt.gasUsed);
            console.log("          Gas buyWithETH: ".grey+tx1.receipt.gasUsed.toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let final_InvestorETHBal = BigNumber(await web3.eth.getBalance(ACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaisedETH.call();
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaisedPOLY.call();
            let final_WalletETHBal = BigNumber(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

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
            let stoId = 0;
            let tierId = 0;

            let investment_Token = BigNumber(50).mul(10**18);
            let investment_USD = await convert(stoId, tierId, false, "TOKEN", "USD", investment_Token);
            let investment_ETH = await convert(stoId, tierId, false, "TOKEN", "ETH", investment_Token);
            let investment_POLY = await convert(stoId, tierId, false, "TOKEN", "POLY", investment_Token);

            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, {from: ACCREDITED1});

            // Additional checks on getters
            let init_getTokensSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_getTokensMinted = await I_USDTieredSTO_Array[stoId].getTokensMinted();
            let init_getTokensSoldForETH = await I_USDTieredSTO_Array[stoId].getTokensSoldForETH();
            let init_getTokensSoldForPOLY = await I_USDTieredSTO_Array[stoId].getTokensSoldForPOLY();
            let init_investorInvestedUSD = await I_USDTieredSTO_Array[stoId].investorInvestedUSD.call(ACCREDITED1);
            let init_investorInvestedETH = await I_USDTieredSTO_Array[stoId].investorInvestedETH.call(ACCREDITED1);
            let init_investorInvestedPOLY = await I_USDTieredSTO_Array[stoId].investorInvestedPOLY.call(ACCREDITED1);

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let init_InvestorETHBal = BigNumber(await web3.eth.getBalance(ACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaisedETH.call();
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaisedPOLY.call();
            let init_WalletETHBal = BigNumber(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            // Buy With POLY
            let tx2 = await I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, { from: ACCREDITED1, gasPrice: GAS_PRICE });
            let gasCost2 = BigNumber(GAS_PRICE).mul(tx2.receipt.gasUsed);
            console.log("          Gas buyWithPOLY: ".grey+tx2.receipt.gasUsed.toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let final_InvestorETHBal = BigNumber(await web3.eth.getBalance(ACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaisedETH.call();
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaisedPOLY.call();
            let final_WalletETHBal = BigNumber(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

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

            // Additional checks on getters
            assert.equal((await I_USDTieredSTO_Array[stoId].investorCount.call()).toNumber(), 2, "Investor count not changed as expected");
            assert.equal((await I_USDTieredSTO_Array[stoId].getTokensSold()).toNumber(), init_getTokensSold.add(investment_Token).toNumber(), "getTokensSold not changed as expected");
            assert.equal((await I_USDTieredSTO_Array[stoId].getTokensMinted()).toNumber(), init_getTokensMinted.add(investment_Token).toNumber(), "getTokensMinted not changed as expected");
            assert.equal((await I_USDTieredSTO_Array[stoId].getTokensSoldForETH()).toNumber(), init_getTokensSoldForETH.toNumber(), "getTokensSoldForETH not changed as expected");
            assert.equal((await I_USDTieredSTO_Array[stoId].getTokensSoldForPOLY()).toNumber(), init_getTokensSoldForPOLY.add(investment_Token).toNumber(), "getTokensSoldForPOLY not changed as expected");
            assert.equal((await I_USDTieredSTO_Array[stoId].investorInvestedUSD.call(ACCREDITED1)).toNumber(), init_investorInvestedUSD.add(investment_USD).toNumber(), "investorInvestedUSD not changed as expected");
            assert.equal((await I_USDTieredSTO_Array[stoId].investorInvestedETH.call(ACCREDITED1)).toNumber(), init_investorInvestedETH.toNumber(), "investorInvestedETH not changed as expected");
            assert.equal((await I_USDTieredSTO_Array[stoId].investorInvestedPOLY.call(ACCREDITED1)).toNumber(), init_investorInvestedPOLY.add(investment_POLY).toNumber(), "investorInvestedPOLY not changed as expected");
        });

        it("should successfully modify NONACCREDITED cap for NONACCREDITED1", async() => {
            let stoId = 0;
            let tierId = 0;
            console.log("Current investment: " + (await I_USDTieredSTO_Array[stoId].investorInvestedUSD.call(NONACCREDITED1)).toNumber());
            await I_USDTieredSTO_Array[stoId].changeNonAccreditedLimit([NONACCREDITED1], [_nonAccreditedLimitUSD[stoId].div(2)], {from: ISSUER});
            console.log("Current limit: " + (await I_USDTieredSTO_Array[stoId].nonAccreditedLimitUSDOverride(NONACCREDITED1)).toNumber());
        });

        it("should successfully buy a partial amount and refund balance when reaching NONACCREDITED cap", async() => {
            let stoId = 0;
            let tierId = 0;

            let investment_USD = (await I_USDTieredSTO_Array[stoId].nonAccreditedLimitUSDOverride(NONACCREDITED1));//_nonAccreditedLimitUSD[stoId];
            let investment_Token = await convert(stoId, tierId, false, "USD", "TOKEN", investment_USD);
            let investment_ETH = await convert(stoId, tierId, false, "USD", "ETH", investment_USD);
            let investment_POLY = await convert(stoId, tierId, false, "USD", "POLY", investment_USD);

            let refund_USD = await I_USDTieredSTO_Array[stoId].investorInvestedUSD.call(NONACCREDITED1);
            let refund_Token = await convert(stoId, tierId, false, "USD", "TOKEN", refund_USD);
            let refund_ETH = await convert(stoId, tierId, false, "USD", "ETH", refund_USD);
            let refund_POLY = await convert(stoId, tierId, false, "USD", "POLY", refund_USD);

            console.log("Expected refund in tokens: " + refund_Token.toNumber());

            let snap = await takeSnapshot();

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let init_InvestorETHBal = BigNumber(await web3.eth.getBalance(NONACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaisedETH.call();
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaisedPOLY.call();
            let init_WalletETHBal = BigNumber(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            // Buy with ETH
            let tx1 = await I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, value: investment_ETH, gasPrice: GAS_PRICE });
            let gasCost1 = BigNumber(GAS_PRICE).mul(tx1.receipt.gasUsed);
            console.log("          Gas buyWithETH: ".grey+tx1.receipt.gasUsed.toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let final_InvestorETHBal = BigNumber(await web3.eth.getBalance(NONACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaisedETH.call();
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaisedPOLY.call();
            let final_WalletETHBal = BigNumber(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

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
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, {from: NONACCREDITED1});

            init_TokenSupply = await I_SecurityToken.totalSupply();
            init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            init_InvestorETHBal = BigNumber(await web3.eth.getBalance(NONACCREDITED1));
            init_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            init_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaisedETH.call();
            init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaisedPOLY.call();
            init_WalletETHBal = BigNumber(await web3.eth.getBalance(WALLET));
            init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            // Buy With POLY
            let tx2 = await I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, { from: NONACCREDITED1, gasPrice: GAS_PRICE });
            let gasCost2 = BigNumber(GAS_PRICE).mul(tx2.receipt.gasUsed);
            console.log("          Gas buyWithPOLY: ".grey+tx2.receipt.gasUsed.toString().grey);

            final_TokenSupply = await I_SecurityToken.totalSupply();
            final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            final_InvestorETHBal = BigNumber(await web3.eth.getBalance(NONACCREDITED1));
            final_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            final_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaisedETH.call();
            final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaisedPOLY.call();
            final_WalletETHBal = BigNumber(await web3.eth.getBalance(WALLET));
            final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

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

        it("should fail and revert when NONACCREDITED cap reached", async() => {
            let stoId = 0;
            let tierId = 0;

            let investment_Token = BigNumber(50).mul(10**18);
            let investment_USD = await convert(stoId, tierId, false, "TOKEN", "USD", investment_Token);
            let investment_ETH = await convert(stoId, tierId, false, "TOKEN", "ETH", investment_Token);
            let investment_POLY = await convert(stoId, tierId, false, "TOKEN", "POLY", investment_Token);

            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, {from: NONACCREDITED1, gasPrice: GAS_PRICE});

            // Buy with ETH NONACCREDITED
            let errorThrown1 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, value: investment_ETH, gasPrice: GAS_PRICE });
            } catch(error) {
                errorThrown1 = true;
                ensureException(error);
            }
            assert.ok(errorThrown1, MESSAGE);

            // Buy with POLY NONACCREDITED
            let errorThrown2 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, { from: NONACCREDITED1, gasPrice: GAS_PRICE });
            } catch(error) {
                errorThrown2 = true;
                ensureException(error);
            }
            assert.ok(errorThrown2, MESSAGE);
        });

        it("should fail and revert despite oracle price change when NONACCREDITED cap reached", async() => {
            let stoId = 0;
            let tierId;

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
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY_low, {from: NONACCREDITED1});

            // Change exchange rates up
            await I_USDOracle.changePrice(high_USDETH, { from: POLYMATH });
            await I_POLYOracle.changePrice(high_USDPOLY, { from: POLYMATH });

            // Buy with ETH NONACCREDITED
            let errorThrown1 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, value: investment_ETH_high, gasPrice: GAS_PRICE });
            } catch(error) {
                errorThrown1 = true;
                ensureException(error);
            }
            assert.ok(errorThrown1, MESSAGE);

            // Buy with POLY NONACCREDITED
            let errorThrown2 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY_high, { from: NONACCREDITED1, gasPrice: GAS_PRICE });
            } catch(error) {
                errorThrown2 = true;
                ensureException(error);
            }
            assert.ok(errorThrown2, MESSAGE);

            // Change exchange rates down
            await I_USDOracle.changePrice(low_USDETH, { from: POLYMATH });
            await I_POLYOracle.changePrice(low_USDPOLY, { from: POLYMATH });

            // Buy with ETH NONACCREDITED
            let errorThrown3 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, value: investment_ETH_low, gasPrice: GAS_PRICE });
            } catch(error) {
                errorThrown3 = true;
                ensureException(error);
            }
            assert.ok(errorThrown3, MESSAGE);

            // Buy with POLY NONACCREDITED
            let errorThrown4 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY_low, { from: NONACCREDITED1, gasPrice: GAS_PRICE });
            } catch(error) {
                errorThrown4 = true;
                ensureException(error);
            }
            assert.ok(errorThrown4, MESSAGE);

            // Reset exchange rates
            await I_USDOracle.changePrice(USDETH, { from: POLYMATH });
            await I_POLYOracle.changePrice(USDPOLY, { from: POLYMATH });
        });

        it("should successfully buy across tiers for NONACCREDITED ETH", async() => {
            let stoId = 1;
            let startTier = 0;
            let endTier = 1;

            assert.equal((await I_USDTieredSTO_Array[stoId].currentTier.call()).toNumber(), startTier, "currentTier not changed as expected");

            let delta_Token = BigNumber(5).mul(10**18);
            let ethTier0 = await convert(stoId, startTier, false, "TOKEN", "ETH", delta_Token);
            let ethTier1 = await convert(stoId, endTier, false, "TOKEN", "ETH", delta_Token);

            let investment_Token = delta_Token.add(delta_Token); // 10 Token
            let investment_ETH = ethTier0.add(ethTier1);         // 0.0025 ETH

            // Process investment
            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let init_InvestorETHBal = BigNumber(await web3.eth.getBalance(NONACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaisedETH.call();
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaisedPOLY.call();
            let init_WalletETHBal = BigNumber(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            let tx1 = await I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, value: investment_ETH, gasPrice: GAS_PRICE });
            let gasCost1 = BigNumber(GAS_PRICE).mul(tx1.receipt.gasUsed);
            console.log("          Gas buyWithETH: ".grey+tx1.receipt.gasUsed.toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let final_InvestorETHBal = BigNumber(await web3.eth.getBalance(NONACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaisedETH.call();
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaisedPOLY.call();
            let final_WalletETHBal = BigNumber(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

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

            // Additional Checks
            assert.equal((await I_USDTieredSTO_Array[stoId].currentTier.call()).toNumber(), endTier, "currentTier not changed as expected");
        });

        it("should successfully buy across tiers for NONACCREDITED POLY", async() => {
            let stoId = 1;
            let startTier = 1;
            let endTier = 2;

            assert.equal((await I_USDTieredSTO_Array[stoId].currentTier.call()).toNumber(), startTier, "currentTier not changed as expected");

            let delta_Token = BigNumber(5).mul(10**18);    // Token
            let polyTier0 = await convert(stoId, startTier, false, "TOKEN", "POLY", delta_Token);
            let polyTier1 = await convert(stoId, endTier, false, "TOKEN", "POLY", delta_Token);

            let investment_Token = delta_Token.add(delta_Token);  // 10 Token
            let investment_POLY = polyTier0.add(polyTier1);       // 0.0025 ETH

            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, {from: NONACCREDITED1});

            // Process investment
            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let init_InvestorETHBal = BigNumber(await web3.eth.getBalance(NONACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaisedETH.call();
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaisedPOLY.call();
            let init_WalletETHBal = BigNumber(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            let tx2 = await I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, { from: NONACCREDITED1, gasPrice: GAS_PRICE });
            let gasCost2 = BigNumber(GAS_PRICE).mul(tx2.receipt.gasUsed);
            console.log("          Gas buyWithPOLY: ".grey+tx2.receipt.gasUsed.toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let final_InvestorETHBal = BigNumber(await web3.eth.getBalance(NONACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaisedETH.call();
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaisedPOLY.call();
            let final_WalletETHBal = BigNumber(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

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

            // Additional Checks
            assert.equal((await I_USDTieredSTO_Array[stoId].currentTier.call()).toNumber(), endTier, "currentTier not changed as expected");
        });

        it("should successfully buy across tiers for ACCREDITED ETH", async() => {
            let stoId = 1;
            let startTier = 2;
            let endTier = 3;

            await I_USDTieredSTO_Array[stoId].changeAccredited([ACCREDITED1], [true], { from: ISSUER });

            assert.equal((await I_USDTieredSTO_Array[stoId].currentTier.call()).toNumber(), startTier, "currentTier not changed as expected");

            let delta_Token = BigNumber(5).mul(10**18);    // Token
            let ethTier0 = await convert(stoId, startTier, false, "TOKEN", "ETH", delta_Token);
            let ethTier1 = await convert(stoId, endTier, false, "TOKEN", "ETH", delta_Token);

            let investment_Token = delta_Token.add(delta_Token); // 10 Token
            let investment_ETH = ethTier0.add(ethTier1);         // 0.0025 ETH

            // Process investment
            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let init_InvestorETHBal = BigNumber(await web3.eth.getBalance(ACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaisedETH.call();
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaisedPOLY.call();
            let init_WalletETHBal = BigNumber(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            let tx1 = await I_USDTieredSTO_Array[stoId].buyWithETH(ACCREDITED1, { from: ACCREDITED1, value: investment_ETH, gasPrice: GAS_PRICE });
            let gasCost1 = BigNumber(GAS_PRICE).mul(tx1.receipt.gasUsed);
            console.log("          Gas buyWithETH: ".grey+tx1.receipt.gasUsed.toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let final_InvestorETHBal = BigNumber(await web3.eth.getBalance(ACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaisedETH.call();
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaisedPOLY.call();
            let final_WalletETHBal = BigNumber(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

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

            // Additional Checks
            assert.equal((await I_USDTieredSTO_Array[stoId].currentTier.call()).toNumber(), endTier, "currentTier not changed as expected");
        });

        it("should successfully buy across tiers for ACCREDITED POLY", async() => {
            let stoId = 1;
            let startTier = 3;
            let endTier = 4;

            assert.equal((await I_USDTieredSTO_Array[stoId].currentTier.call()).toNumber(), startTier, "currentTier not changed as expected");

            let delta_Token = BigNumber(5).mul(10**18);    // Token
            let polyTier0 = await convert(stoId, startTier, false, "TOKEN", "POLY", delta_Token);
            let polyTier1 = await convert(stoId, endTier, false, "TOKEN", "POLY", delta_Token);

            let investment_Token = delta_Token.add(delta_Token);  // 10 Token
            let investment_POLY = polyTier0.add(polyTier1);       // 0.0025 ETH

            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, {from: ACCREDITED1});

            // Process investment
            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let init_InvestorETHBal = BigNumber(await web3.eth.getBalance(ACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaisedETH.call();
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaisedPOLY.call();
            let init_WalletETHBal = BigNumber(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            let tx2 = await I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, { from: ACCREDITED1, gasPrice: GAS_PRICE });
            let gasCost2 = BigNumber(GAS_PRICE).mul(tx2.receipt.gasUsed);
            console.log("          Gas buyWithPOLY: ".grey+tx2.receipt.gasUsed.toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let final_InvestorETHBal = BigNumber(await web3.eth.getBalance(ACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaisedETH.call();
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaisedPOLY.call();
            let final_WalletETHBal = BigNumber(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

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

            // Additional Checks
            assert.equal((await I_USDTieredSTO_Array[stoId].currentTier.call()).toNumber(), endTier, "currentTier not changed as expected");
        });

        it("should buy out the rest of the sto", async() => {
            let stoId = 1;
            let tierId = 4;

            let minted = await I_USDTieredSTO_Array[stoId].mintedPerTierTotal.call(tierId);
            let investment_Token = _tokensPerTierTotal[stoId][tierId].sub(minted);
            let investment_ETH = await convert(stoId, tierId, false, "TOKEN", "ETH", investment_Token);

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();

            let tx = await I_USDTieredSTO_Array[stoId].buyWithETH(ACCREDITED1, { from: ACCREDITED1, value: investment_ETH, gasPrice: GAS_PRICE });
            console.log("          Gas buyWithETH: ".grey+tx.receipt.gasUsed.toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();

            assert.equal(final_TokenSupply.toNumber(), init_TokenSupply.add(investment_Token).toNumber(), "Token Supply not changed as expected");
            assert.equal(final_InvestorTokenBal.toNumber(), init_InvestorTokenBal.add(investment_Token).toNumber(), "Investor Token Balance not changed as expected");
            assert.equal(final_STOTokenSold.toNumber(), init_STOTokenSold.add(investment_Token).toNumber(), "STO Token Sold not changed as expected");
            // assert.equal((await I_USDTieredSTO_Array[1].getTokensMinted()).toNumber(), _tokensPerTierTotal[1].reduce((a, b) => a + b, 0).toNumber(), "STO Token Sold not changed as expected");
        });

        it("should fail and revert when all tiers sold out", async() => {
            let stoId = 1;
            let tierId = 4;

            let investment_Token = BigNumber(5).mul(10**18);
            let investment_USD = await convert(stoId, tierId, false, "TOKEN", "USD", investment_Token);
            let investment_ETH = await convert(stoId, tierId, false, "TOKEN", "ETH", investment_Token);
            let investment_POLY = await convert(stoId, tierId, false, "TOKEN", "POLY", investment_Token);

            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: NONACCREDITED1, gasPrice: GAS_PRICE });

            assert.equal(await I_USDTieredSTO_Array[stoId].isOpen(),false,"STO is not showing correct status");

            // Buy with ETH NONACCREDITED
            let errorThrown1 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, value: investment_ETH, gasPrice: GAS_PRICE });
            } catch(error) {
                errorThrown1 = true;
                ensureException(error);
            }
            assert.ok(errorThrown1, MESSAGE);

            // Buy with POLY NONACCREDITED
            let errorThrown2 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, { from: NONACCREDITED1, gasPrice: GAS_PRICE });
            } catch(error) {
                errorThrown2 = true;
                ensureException(error);
            }
            assert.ok(errorThrown2, MESSAGE);

            // Buy with ETH ACCREDITED
            let errorThrown3 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithETH(ACCREDITED1, { from: ACCREDITED1, value: investment_ETH, gasPrice: GAS_PRICE });
            } catch(error) {
                errorThrown3 = true;
                ensureException(error);
            }
            assert.ok(errorThrown3, MESSAGE);

            // Buy with POLY ACCREDITED
            let errorThrown4 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, { from: ACCREDITED1, gasPrice: GAS_PRICE });
            } catch(error) {
                errorThrown4 = true;
                ensureException(error);
            }
            assert.ok(errorThrown4, MESSAGE);
        });

        it("should fail and revert when all tiers sold out despite oracle price change", async() => {
            let stoId = 1;
            let tierId = 4;

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
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY_low, {from: NONACCREDITED1});
            await I_PolyToken.getTokens(investment_POLY_low, ACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY_low, {from: ACCREDITED1});

            // Change exchange rates up
            await I_USDOracle.changePrice(high_USDETH, { from: POLYMATH });
            await I_POLYOracle.changePrice(high_USDPOLY, { from: POLYMATH });

            // Buy with ETH NONACCREDITED
            let errorThrown1 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, value: investment_ETH_high, gasPrice: GAS_PRICE });
            } catch(error) {
                errorThrown1 = true;
                ensureException(error);
            }
            assert.ok(errorThrown1, MESSAGE);

            // Buy with POLY NONACCREDITED
            let errorThrown2 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY_high, { from: NONACCREDITED1, gasPrice: GAS_PRICE });
            } catch(error) {
                errorThrown2 = true;
                ensureException(error);
            }
            assert.ok(errorThrown2, MESSAGE);

            // Buy with ETH ACCREDITED
            let errorThrown3 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithETH(ACCREDITED1, { from: ACCREDITED1, value: investment_ETH_high, gasPrice: GAS_PRICE });
            } catch(error) {
                errorThrown3 = true;
                ensureException(error);
            }
            assert.ok(errorThrown3, MESSAGE);

            // Buy with POLY ACCREDITED
            let errorThrown4 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY_high, { from: ACCREDITED1, gasPrice: GAS_PRICE });
            } catch(error) {
                errorThrown4 = true;
                ensureException(error);
            }
            assert.ok(errorThrown4, MESSAGE);

            // Change exchange rates down
            await I_USDOracle.changePrice(low_USDETH, { from: POLYMATH });
            await I_POLYOracle.changePrice(low_USDPOLY, { from: POLYMATH });

            // Buy with ETH NONACCREDITED
            let errorThrown5 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, value: investment_ETH_low, gasPrice: GAS_PRICE });
            } catch(error) {
                errorThrown5 = true;
                ensureException(error);
            }
            assert.ok(errorThrown5, MESSAGE);

            // Buy with POLY NONACCREDITED
            let errorThrown6 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY_low, { from: NONACCREDITED1, gasPrice: GAS_PRICE });
            } catch(error) {
                errorThrown6 = true;
                ensureException(error);
            }
            assert.ok(errorThrown6, MESSAGE);

            // Buy with ETH ACCREDITED
            let errorThrown7 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithETH(ACCREDITED1, { from: ACCREDITED1, value: investment_ETH_low, gasPrice: GAS_PRICE });
            } catch(error) {
                errorThrown7 = true;
                ensureException(error);
            }
            assert.ok(errorThrown7, MESSAGE);

            // Buy with POLY ACCREDITED
            let errorThrown8 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY_low, { from: ACCREDITED1, gasPrice: GAS_PRICE });
            } catch(error) {
                errorThrown8 = true;
                ensureException(error);
            }
            assert.ok(errorThrown8, MESSAGE);

            // Reset exchange rates
            await I_USDOracle.changePrice(USDETH, { from: POLYMATH });
            await I_POLYOracle.changePrice(USDPOLY, { from: POLYMATH });
        });
    });

    describe("Buy Tokens with POLY discount", async() => {

        it("should successfully buy using fallback at tier 0 for NONACCREDITED1", async() => {
            let stoId = 2;
            let tierId = 0;

            let investment_Token = BigNumber(5).mul(10**18);
            let investment_USD = await convert(stoId, tierId, false, "TOKEN", "USD", investment_Token);
            let investment_ETH = await convert(stoId, tierId, false, "TOKEN", "ETH", investment_Token);
            let investment_POLY = await convert(stoId, tierId, false, "TOKEN", "POLY", investment_Token);

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let init_InvestorETHBal = BigNumber(await web3.eth.getBalance(NONACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedUSD = await I_USDTieredSTO_Array[stoId].fundsRaisedUSD.call();
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaisedETH.call();
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaisedPOLY.call();
            let init_WalletETHBal = BigNumber(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            let tx1 = await web3.eth.sendTransaction({ from: NONACCREDITED1, to: I_USDTieredSTO_Array[stoId].address, value: investment_ETH, gasPrice: GAS_PRICE, gas:1000000 });
            let gasCost1 = BigNumber(GAS_PRICE).mul(tx1.gasUsed);
            console.log("          Gas fallback purchase: ".grey+tx1.gasUsed.toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let final_InvestorETHBal = BigNumber(await web3.eth.getBalance(NONACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedUSD = await I_USDTieredSTO_Array[stoId].fundsRaisedUSD.call();
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaisedETH.call();
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaisedPOLY.call();
            let final_WalletETHBal = BigNumber(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            assert.equal(final_TokenSupply.toNumber(), init_TokenSupply.add(investment_Token).toNumber(), "Token Supply not changed as expected");
            assert.equal(final_InvestorTokenBal.toNumber(), init_InvestorTokenBal.add(investment_Token).toNumber(), "Investor Token Balance not changed as expected");
            assert.equal(final_InvestorETHBal.toNumber(), init_InvestorETHBal.sub(gasCost1).sub(investment_ETH).toNumber(), "Investor ETH Balance not changed as expected");
            assert.equal(final_InvestorPOLYBal.toNumber(), init_InvestorPOLYBal.toNumber(), "Investor POLY Balance not changed as expected");
            assert.equal(final_STOTokenSold.toNumber(), init_STOTokenSold.add(investment_Token).toNumber(), "STO Token Sold not changed as expected");
            assert.equal(final_STOETHBal.toNumber(), init_STOETHBal.toNumber(), "STO ETH Balance not changed as expected");
            assert.equal(final_STOPOLYBal.toNumber(), init_STOPOLYBal.toNumber(), "STO POLY Balance not changed as expected");
            assert.equal(final_RaisedUSD.toNumber(), init_RaisedUSD.add(investment_USD).toNumber(), "Raised USD not changed as expected");
            assert.equal(final_RaisedETH.toNumber(), init_RaisedETH.add(investment_ETH).toNumber(), "Raised ETH not changed as expected");
            assert.equal(final_RaisedPOLY.toNumber(), init_RaisedPOLY.toNumber(), "Raised POLY not changed as expected");
            assert.equal(final_WalletETHBal.toNumber(), init_WalletETHBal.add(investment_ETH).toNumber(), "Wallet ETH Balance not changed as expected");
            assert.equal(final_WalletPOLYBal.toNumber(), init_WalletPOLYBal.toNumber(), "Wallet POLY Balance not changed as expected");

            // Additional checks on getters
            assert.equal((await I_USDTieredSTO_Array[stoId].investorCount.call()).toNumber(), 1, "Investor count not changed as expected");
            assert.equal((await I_USDTieredSTO_Array[stoId].getTokensSold()).toNumber(), investment_Token.toNumber(), "getTokensSold not changed as expected");
            assert.equal((await I_USDTieredSTO_Array[stoId].getTokensMinted()).toNumber(), investment_Token.toNumber(), "getTokensMinted not changed as expected");
            assert.equal((await I_USDTieredSTO_Array[stoId].getTokensSoldForETH()).toNumber(), investment_Token.toNumber(), "getTokensSoldForETH not changed as expected");
            assert.equal((await I_USDTieredSTO_Array[stoId].getTokensSoldForPOLY()).toNumber(), 0, "getTokensSoldForPOLY not changed as expected");
            assert.equal((await I_USDTieredSTO_Array[stoId].investorInvestedUSD.call(NONACCREDITED1)).toNumber(), investment_USD.toNumber(), "investorInvestedUSD not changed as expected");
            assert.equal((await I_USDTieredSTO_Array[stoId].investorInvestedETH.call(NONACCREDITED1)).toNumber(), investment_ETH.toNumber(), "investorInvestedETH not changed as expected");
            assert.equal((await I_USDTieredSTO_Array[stoId].investorInvestedPOLY.call(NONACCREDITED1)).toNumber(), 0, "investorInvestedPOLY not changed as expected");
        });

        it("should successfully buy using buyWithETH at tier 0 for NONACCREDITED1", async() => {
            let stoId = 2;
            let tierId = 0;

            let investment_Token = BigNumber(5).mul(10**18);
            let investment_USD = await convert(stoId, tierId, false, "TOKEN", "USD", investment_Token);
            let investment_ETH = await convert(stoId, tierId, false, "TOKEN", "ETH", investment_Token);
            let investment_POLY = await convert(stoId, tierId, false, "TOKEN", "POLY", investment_Token);

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let init_InvestorETHBal = BigNumber(await web3.eth.getBalance(NONACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaisedETH.call();
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaisedPOLY.call();
            let init_WalletETHBal = BigNumber(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            let tx1 = await I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, value: investment_ETH, gasPrice: GAS_PRICE });
            let gasCost1 = BigNumber(GAS_PRICE).mul(tx1.receipt.gasUsed);
            console.log("          Gas buyWithETH: ".grey+tx1.receipt.gasUsed.toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let final_InvestorETHBal = BigNumber(await web3.eth.getBalance(NONACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaisedETH.call();
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaisedPOLY.call();
            let final_WalletETHBal = BigNumber(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

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
            let stoId = 2;
            let tierId = 0;

            let investment_Token = BigNumber(5).mul(10**18);
            let investment_USD = await convert(stoId, tierId, true, "TOKEN", "USD", investment_Token);
            let investment_ETH = await convert(stoId, tierId, true, "TOKEN", "ETH", investment_Token);
            let investment_POLY = await convert(stoId, tierId, true, "TOKEN", "POLY", investment_Token);

            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, {from: NONACCREDITED1});

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let init_InvestorETHBal = BigNumber(await web3.eth.getBalance(NONACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaisedETH.call();
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaisedPOLY.call();
            let init_WalletETHBal = BigNumber(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            // Buy With POLY
            let tx2 = await I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, { from: NONACCREDITED1, gasPrice: GAS_PRICE });
            let gasCost2 = BigNumber(GAS_PRICE).mul(tx2.receipt.gasUsed);
            console.log("          Gas buyWithPOLY: ".grey+tx2.receipt.gasUsed.toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let final_InvestorETHBal = BigNumber(await web3.eth.getBalance(NONACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaisedETH.call();
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaisedPOLY.call();
            let final_WalletETHBal = BigNumber(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

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
            let stoId = 2;
            let tierId = 0;

            await I_USDTieredSTO_Array[stoId].changeAccredited([ACCREDITED1], [true], { from: ISSUER });

            let investment_Token = BigNumber(5).mul(10**18);
            let investment_USD = await convert(stoId, tierId, false, "TOKEN", "USD", investment_Token);
            let investment_ETH = await convert(stoId, tierId, false, "TOKEN", "ETH", investment_Token);
            let investment_POLY = await convert(stoId, tierId, false, "TOKEN", "POLY", investment_Token);

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let init_InvestorETHBal = BigNumber(await web3.eth.getBalance(ACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaisedETH.call();
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaisedPOLY.call();
            let init_WalletETHBal = BigNumber(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            let tx1 = await web3.eth.sendTransaction({ from: ACCREDITED1, to: I_USDTieredSTO_Array[stoId].address, value: investment_ETH, gasPrice: GAS_PRICE, gas:1000000 });
            let gasCost1 = BigNumber(GAS_PRICE).mul(tx1.gasUsed);
            console.log("          Gas fallback purchase: ".grey+tx1.gasUsed.toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let final_InvestorETHBal = BigNumber(await web3.eth.getBalance(ACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaisedETH.call();
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaisedPOLY.call();
            let final_WalletETHBal = BigNumber(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

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
            let stoId = 2;
            let tierId = 0;

            let investment_Token = BigNumber(5).mul(10**18);
            let investment_USD = await convert(stoId, tierId, false, "TOKEN", "USD", investment_Token);
            let investment_ETH = await convert(stoId, tierId, false, "TOKEN", "ETH", investment_Token);
            let investment_POLY = await convert(stoId, tierId, false, "TOKEN", "POLY", investment_Token);

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let init_InvestorETHBal = BigNumber(await web3.eth.getBalance(ACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaisedETH.call();
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaisedPOLY.call();
            let init_WalletETHBal = BigNumber(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            let tx1 = await I_USDTieredSTO_Array[stoId].buyWithETH(ACCREDITED1, { from: ACCREDITED1, value: investment_ETH, gasPrice: GAS_PRICE });
            let gasCost1 = BigNumber(GAS_PRICE).mul(tx1.receipt.gasUsed);
            console.log("          Gas buyWithETH: ".grey+tx1.receipt.gasUsed.toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let final_InvestorETHBal = BigNumber(await web3.eth.getBalance(ACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaisedETH.call();
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaisedPOLY.call();
            let final_WalletETHBal = BigNumber(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

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
            let stoId = 2;
            let tierId = 0;

            let investment_Token = BigNumber(5).mul(10**18);
            let investment_USD = await convert(stoId, tierId, true, "TOKEN", "USD", investment_Token);
            let investment_ETH = await convert(stoId, tierId, true, "TOKEN", "ETH", investment_Token);
            let investment_POLY = await convert(stoId, tierId, true, "TOKEN", "POLY", investment_Token);

            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, {from: ACCREDITED1});

            // Additional checks on getters
            let init_getTokensSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_getTokensMinted = await I_USDTieredSTO_Array[stoId].getTokensMinted();
            let init_getTokensSoldForETH = await I_USDTieredSTO_Array[stoId].getTokensSoldForETH();
            let init_getTokensSoldForPOLY = await I_USDTieredSTO_Array[stoId].getTokensSoldForPOLY();
            let init_investorInvestedUSD = await I_USDTieredSTO_Array[stoId].investorInvestedUSD.call(ACCREDITED1);
            let init_investorInvestedETH = await I_USDTieredSTO_Array[stoId].investorInvestedETH.call(ACCREDITED1);
            let init_investorInvestedPOLY = await I_USDTieredSTO_Array[stoId].investorInvestedPOLY.call(ACCREDITED1);

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let init_InvestorETHBal = BigNumber(await web3.eth.getBalance(ACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaisedETH.call();
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaisedPOLY.call();
            let init_WalletETHBal = BigNumber(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            // Buy With POLY
            let tx2 = await I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, { from: ACCREDITED1, gasPrice: GAS_PRICE });
            let gasCost2 = BigNumber(GAS_PRICE).mul(tx2.receipt.gasUsed);
            console.log("          Gas buyWithPOLY: ".grey+tx2.receipt.gasUsed.toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let final_InvestorETHBal = BigNumber(await web3.eth.getBalance(ACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaisedETH.call();
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaisedPOLY.call();
            let final_WalletETHBal = BigNumber(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

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

            // Additional checks on getters
            assert.equal((await I_USDTieredSTO_Array[stoId].investorCount.call()).toNumber(), 2, "Investor count not changed as expected");
            assert.equal((await I_USDTieredSTO_Array[stoId].getTokensSold()).toNumber(), init_getTokensSold.add(investment_Token).toNumber(), "getTokensSold not changed as expected");
            assert.equal((await I_USDTieredSTO_Array[stoId].getTokensMinted()).toNumber(), init_getTokensMinted.add(investment_Token).toNumber(), "getTokensMinted not changed as expected");
            assert.equal((await I_USDTieredSTO_Array[stoId].getTokensSoldForETH()).toNumber(), init_getTokensSoldForETH.toNumber(), "getTokensSoldForETH not changed as expected");
            assert.equal((await I_USDTieredSTO_Array[stoId].getTokensSoldForPOLY()).toNumber(), init_getTokensSoldForPOLY.add(investment_Token).toNumber(), "getTokensSoldForPOLY not changed as expected");
            assert.equal((await I_USDTieredSTO_Array[stoId].investorInvestedUSD.call(ACCREDITED1)).toNumber(), init_investorInvestedUSD.add(investment_USD).toNumber(), "investorInvestedUSD not changed as expected");
            assert.equal((await I_USDTieredSTO_Array[stoId].investorInvestedETH.call(ACCREDITED1)).toNumber(), init_investorInvestedETH.toNumber(), "investorInvestedETH not changed as expected");
            assert.equal((await I_USDTieredSTO_Array[stoId].investorInvestedPOLY.call(ACCREDITED1)).toNumber(), init_investorInvestedPOLY.add(investment_POLY).toNumber(), "investorInvestedPOLY not changed as expected");
        });

        it("should successfully buy a partial amount and refund balance when reaching NONACCREDITED cap", async() => {
            let stoId = 2;
            let tierId = 0;

            let investment_USD = _nonAccreditedLimitUSD[stoId];
            let investment_Token = await convert(stoId, tierId, true, "USD", "TOKEN", investment_USD);
            let investment_ETH = await convert(stoId, tierId, true, "USD", "ETH", investment_USD);
            let investment_POLY = await convert(stoId, tierId, true, "USD", "POLY", investment_USD);

            let refund_USD = await I_USDTieredSTO_Array[stoId].investorInvestedUSD.call(NONACCREDITED1);
            let refund_Token = await convert(stoId, tierId, true, "USD", "TOKEN", refund_USD);
            let refund_ETH = await convert(stoId, tierId, true, "USD", "ETH", refund_USD);
            let refund_POLY = await convert(stoId, tierId, true, "USD", "POLY", refund_USD);

            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, {from: NONACCREDITED1});

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let init_InvestorETHBal = BigNumber(await web3.eth.getBalance(NONACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaisedETH.call();
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaisedPOLY.call();
            let init_WalletETHBal = BigNumber(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            // Buy With POLY
            let tx2 = await I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, { from: NONACCREDITED1, gasPrice: GAS_PRICE });
            let gasCost2 = BigNumber(GAS_PRICE).mul(tx2.receipt.gasUsed);
            console.log("          Gas buyWithPOLY: ".grey+tx2.receipt.gasUsed.toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let final_InvestorETHBal = BigNumber(await web3.eth.getBalance(NONACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaisedETH.call();
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaisedPOLY.call();
            let final_WalletETHBal = BigNumber(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

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

        it("should fail and revert when NONACCREDITED cap reached", async() => {
            let stoId = 2;
            let tierId = 0;

            let investment_Token = BigNumber(5).mul(10**18);
            let investment_USD = await convert(stoId, tierId, true, "TOKEN", "USD", investment_Token);
            let investment_ETH = await convert(stoId, tierId, true, "TOKEN", "ETH", investment_Token);
            let investment_POLY = await convert(stoId, tierId, true, "TOKEN", "POLY", investment_Token);

            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, {from: NONACCREDITED1, gasPrice: GAS_PRICE});

            // Buy with ETH NONACCREDITED
            let errorThrown1 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, value: investment_ETH, gasPrice: GAS_PRICE });
            } catch(error) {
                errorThrown1 = true;
                ensureException(error);
            }
            assert.ok(errorThrown1, MESSAGE);

            // Buy with POLY NONACCREDITED
            let errorThrown2 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, { from: NONACCREDITED1, gasPrice: GAS_PRICE });
            } catch(error) {
                errorThrown2 = true;
                ensureException(error);
            }
            assert.ok(errorThrown2, MESSAGE);
        });

        it("should fail and revert despite oracle price change when NONACCREDITED cap reached", async() => {
            let stoId = 2;
            let tierId = 0;

            // set new exchange rates
            let high_USDETH = BigNumber(1000).mul(10**18); // 1000 USD per ETH
            let high_USDPOLY = BigNumber(50).mul(10**16);  // 0.5 USD per POLY
            let low_USDETH = BigNumber(250).mul(10**18);   // 250 USD per ETH
            let low_USDPOLY = BigNumber(20).mul(10**16);   // 0.2 USD per POLY

            let investment_Token = BigNumber(5).mul(10**18);
            let investment_USD = await convert(stoId, tierId, true, "TOKEN", "USD", investment_Token);

            let investment_ETH_high = investment_USD.div(high_USDETH).mul(10**18);   // USD / USD/ETH = ETH
            let investment_POLY_high = investment_USD.div(high_USDPOLY).mul(10**18); // USD / USD/POLY = POLY
            let investment_ETH_low = investment_USD.div(low_USDETH).mul(10**18);     // USD / USD/ETH = ETH
            let investment_POLY_low = investment_USD.div(low_USDPOLY).mul(10**18);   // USD / USD/POLY = POLY

            await I_PolyToken.getTokens(investment_POLY_low, NONACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY_low, {from: NONACCREDITED1});

            // Change exchange rates up
            await I_USDOracle.changePrice(high_USDETH, { from: POLYMATH });
            await I_POLYOracle.changePrice(high_USDPOLY, { from: POLYMATH });

            // Buy with ETH NONACCREDITED
            let errorThrown1 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, value: investment_ETH_high, gasPrice: GAS_PRICE });
            } catch(error) {
                errorThrown1 = true;
                ensureException(error);
            }
            assert.ok(errorThrown1, MESSAGE);

            // Buy with POLY NONACCREDITED
            let errorThrown2 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY_high, { from: NONACCREDITED1, gasPrice: GAS_PRICE });
            } catch(error) {
                errorThrown2 = true;
                ensureException(error);
            }
            assert.ok(errorThrown2, MESSAGE);

            // Change exchange rates down
            await I_USDOracle.changePrice(low_USDETH, { from: POLYMATH });
            await I_POLYOracle.changePrice(low_USDPOLY, { from: POLYMATH });

            // Buy with ETH NONACCREDITED
            let errorThrown3 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, value: investment_ETH_low, gasPrice: GAS_PRICE });
            } catch(error) {
                errorThrown3 = true;
                ensureException(error);
            }
            assert.ok(errorThrown3, MESSAGE);

            // Buy with POLY NONACCREDITED
            let errorThrown4 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY_low, { from: NONACCREDITED1, gasPrice: GAS_PRICE });
            } catch(error) {
                errorThrown4 = true;
                ensureException(error);
            }
            assert.ok(errorThrown4, MESSAGE);

            // Reset exchange rates
            await I_USDOracle.changePrice(USDETH, { from: POLYMATH });
            await I_POLYOracle.changePrice(USDPOLY, { from: POLYMATH });
        });

        it("should successfully buy across tiers for POLY", async() => {
            let stoId = 2;
            let startTier = 0;
            let endTier = 1;

            assert.equal((await I_USDTieredSTO_Array[stoId].currentTier.call()).toNumber(), startTier, "currentTier not changed as expected");

            let delta_Token = BigNumber(5).mul(10**18);    // Token
            let polyTier0 = await convert(stoId, startTier, true, "TOKEN", "POLY", delta_Token);
            let polyTier1 = await convert(stoId, endTier, true, "TOKEN", "POLY", delta_Token);
            let investment_Token = delta_Token.add(delta_Token);  // 10 Token
            let investment_POLY = polyTier0.add(polyTier1);       // 0.0025 ETH

            let tokensRemaining = (await I_USDTieredSTO_Array[stoId].tokensPerTierTotal.call(startTier)).sub(await I_USDTieredSTO_Array[stoId].mintedPerTierTotal.call(startTier));
            let prep_Token = tokensRemaining.sub(delta_Token);
            let prep_POLY = await convert(stoId, startTier, true, "TOKEN", "POLY", prep_Token);

            await I_PolyToken.getTokens(prep_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, prep_POLY, {from: ACCREDITED1});
            let tx = await I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, prep_POLY, { from: ACCREDITED1, gasPrice: GAS_PRICE });
            console.log("          Gas buyWithPOLY: ".grey+tx.receipt.gasUsed.toString().grey);

            let Tier0Token = (await I_USDTieredSTO_Array[stoId].tokensPerTierTotal.call(startTier));
            let Tier0Minted = (await I_USDTieredSTO_Array[stoId].mintedPerTierTotal.call(startTier));
            assert.equal(Tier0Minted.toNumber(), Tier0Token.sub(delta_Token).toNumber());

            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, {from: ACCREDITED1});

            // Process investment
            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let init_InvestorETHBal = BigNumber(await web3.eth.getBalance(ACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaisedETH.call();
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaisedPOLY.call();
            let init_WalletETHBal = BigNumber(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            let tx2 = await I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, { from: ACCREDITED1, gasPrice: GAS_PRICE });
            let gasCost2 = BigNumber(GAS_PRICE).mul(tx2.receipt.gasUsed);
            console.log("          Gas buyWithPOLY: ".grey+tx2.receipt.gasUsed.toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let final_InvestorETHBal = BigNumber(await web3.eth.getBalance(ACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaisedETH.call();
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaisedPOLY.call();
            let final_WalletETHBal = BigNumber(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

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

            // Additional Checks
            assert.equal((await I_USDTieredSTO_Array[stoId].currentTier.call()).toNumber(), endTier, "currentTier not changed as expected");
        });

        it("should successfully buy across the discount cap", async() => {
            let stoId = 2;
            let tierId = 1;

            let discount_Token = BigNumber(20).mul(10**18);
            let discount_POLY = await convert(stoId, tierId, true, "TOKEN", "POLY", discount_Token);

            let regular_Token = BigNumber(10).mul(10**18);
            let regular_POLY = await convert(stoId, tierId, false, "TOKEN", "POLY", regular_Token);

            let investment_Token = discount_Token.add(regular_Token);
            let investment_POLY = discount_POLY.add(regular_POLY);

            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, {from: ACCREDITED1});

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let init_InvestorETHBal = BigNumber(await web3.eth.getBalance(ACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaisedETH.call();
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaisedPOLY.call();
            let init_WalletETHBal = BigNumber(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            // Buy With POLY
            let tx2 = await I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, { from: ACCREDITED1, gasPrice: GAS_PRICE });
            let gasCost2 = BigNumber(GAS_PRICE).mul(tx2.receipt.gasUsed);
            console.log("          Gas buyWithPOLY: ".grey+tx2.receipt.gasUsed.toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let final_InvestorETHBal = BigNumber(await web3.eth.getBalance(ACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaisedETH.call();
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaisedPOLY.call();
            let final_WalletETHBal = BigNumber(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

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
            let stoId = 2;
            let tierId = 1;

            let minted = await I_USDTieredSTO_Array[stoId].mintedPerTierTotal.call(tierId);
            let investment_Token = _tokensPerTierTotal[stoId][tierId].sub(minted);
            let investment_POLY = await convert(stoId, tierId, false, "TOKEN", "POLY", investment_Token);

            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, {from: ACCREDITED1});

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();

            // Buy With POLY
            let tx2 = await I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, { from: ACCREDITED1, gasPrice: GAS_PRICE });
            let gasCost2 = BigNumber(GAS_PRICE).mul(tx2.receipt.gasUsed);
            console.log("          Gas buyWithPOLY: ".grey+tx2.receipt.gasUsed.toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();

            assert.equal(final_TokenSupply.toNumber(), init_TokenSupply.add(investment_Token).toNumber(), "Token Supply not changed as expected");
            assert.equal(final_InvestorTokenBal.toNumber(), init_InvestorTokenBal.add(investment_Token).toNumber(), "Investor Token Balance not changed as expected");
            assert.equal(final_STOTokenSold.toNumber(), init_STOTokenSold.add(investment_Token).toNumber(), "STO Token Sold not changed as expected");
        });

        it("should fail and revert when all tiers sold out", async() => {
            let stoId = 2;
            let tierId = 1;

            let investment_Token = BigNumber(5).mul(10**18);
            let investment_USD = await convert(stoId, tierId, false, "TOKEN", "USD", investment_Token);
            let investment_ETH = await convert(stoId, tierId, false, "TOKEN", "ETH", investment_Token);
            let investment_POLY = await convert(stoId, tierId, false, "TOKEN", "POLY", investment_Token);

            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: NONACCREDITED1, gasPrice: GAS_PRICE });

            assert.equal(await I_USDTieredSTO_Array[stoId].isOpen(),false,"STO is not showing correct status");

            // Buy with ETH NONACCREDITED
            let errorThrown1 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, value: investment_ETH, gasPrice: GAS_PRICE });
            } catch(error) {
                errorThrown1 = true;
                ensureException(error);
            }
            assert.ok(errorThrown1, MESSAGE);

            // Buy with POLY NONACCREDITED
            let errorThrown2 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, { from: NONACCREDITED1, gasPrice: GAS_PRICE });
            } catch(error) {
                errorThrown2 = true;
                ensureException(error);
            }
            assert.ok(errorThrown2, MESSAGE);

            // Buy with ETH ACCREDITED
            let errorThrown3 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithETH(ACCREDITED1, { from: ACCREDITED1, value: investment_ETH, gasPrice: GAS_PRICE });
            } catch(error) {
                errorThrown3 = true;
                ensureException(error);
            }
            assert.ok(errorThrown3, MESSAGE);

            // Buy with POLY ACCREDITED
            let errorThrown4 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, { from: ACCREDITED1, gasPrice: GAS_PRICE });
            } catch(error) {
                errorThrown4 = true;
                ensureException(error);
            }
            assert.ok(errorThrown4, MESSAGE);
        });

        it("should fail and revert when all tiers sold out despite oracle price change", async() => {
            let stoId = 2;
            let tierId = 1;

            // set new exchange rates
            let high_USDETH = BigNumber(1000).mul(10**18); // 1000 USD per ETH
            let high_USDPOLY = BigNumber(50).mul(10**16);  // 0.5 USD per POLY
            let low_USDETH = BigNumber(250).mul(10**18);   // 250 USD per ETH
            let low_USDPOLY = BigNumber(20).mul(10**16);   // 0.2 USD per POLY

            let investment_Token = BigNumber(5).mul(10**18);
            let investment_USD = await convert(stoId, tierId, true, "TOKEN", "USD", investment_Token);

            let investment_ETH_high = investment_USD.div(high_USDETH).mul(10**18);   // USD / USD/ETH = ETH
            let investment_POLY_high = investment_USD.div(high_USDPOLY).mul(10**18); // USD / USD/POLY = POLY
            let investment_ETH_low = investment_USD.div(low_USDETH).mul(10**18);     // USD / USD/ETH = ETH
            let investment_POLY_low = investment_USD.div(low_USDPOLY).mul(10**18);   // USD / USD/POLY = POLY

            await I_PolyToken.getTokens(investment_POLY_low, NONACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY_low, {from: NONACCREDITED1});
            await I_PolyToken.getTokens(investment_POLY_low, ACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY_low, {from: ACCREDITED1});

            // Change exchange rates up
            await I_USDOracle.changePrice(high_USDETH, { from: POLYMATH });
            await I_POLYOracle.changePrice(high_USDPOLY, { from: POLYMATH });

            // Buy with ETH NONACCREDITED
            let errorThrown1 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, value: investment_ETH_high, gasPrice: GAS_PRICE });
            } catch(error) {
                errorThrown1 = true;
                ensureException(error);
            }
            assert.ok(errorThrown1, MESSAGE);

            // Buy with POLY NONACCREDITED
            let errorThrown2 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY_high, { from: NONACCREDITED1, gasPrice: GAS_PRICE });
            } catch(error) {
                errorThrown2 = true;
                ensureException(error);
            }
            assert.ok(errorThrown2, MESSAGE);

            // Buy with ETH ACCREDITED
            let errorThrown3 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithETH(ACCREDITED1, { from: ACCREDITED1, value: investment_ETH_high, gasPrice: GAS_PRICE });
            } catch(error) {
                errorThrown3 = true;
                ensureException(error);
            }
            assert.ok(errorThrown3, MESSAGE);

            // Buy with POLY ACCREDITED
            let errorThrown4 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY_high, { from: ACCREDITED1, gasPrice: GAS_PRICE });
            } catch(error) {
                errorThrown4 = true;
                ensureException(error);
            }
            assert.ok(errorThrown4, MESSAGE);

            // Change exchange rates down
            await I_USDOracle.changePrice(low_USDETH, { from: POLYMATH });
            await I_POLYOracle.changePrice(low_USDPOLY, { from: POLYMATH });

            // Buy with ETH NONACCREDITED
            let errorThrown5 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, value: investment_ETH_low, gasPrice: GAS_PRICE });
            } catch(error) {
                errorThrown5 = true;
                ensureException(error);
            }
            assert.ok(errorThrown5, MESSAGE);

            // Buy with POLY NONACCREDITED
            let errorThrown6 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY_low, { from: NONACCREDITED1, gasPrice: GAS_PRICE });
            } catch(error) {
                errorThrown6 = true;
                ensureException(error);
            }
            assert.ok(errorThrown6, MESSAGE);

            // Buy with ETH ACCREDITED
            let errorThrown7 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithETH(ACCREDITED1, { from: ACCREDITED1, value: investment_ETH_low, gasPrice: GAS_PRICE });
            } catch(error) {
                errorThrown7 = true;
                ensureException(error);
            }
            assert.ok(errorThrown7, MESSAGE);

            // Buy with POLY ACCREDITED
            let errorThrown8 = false;
            try {
                await I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY_low, { from: ACCREDITED1, gasPrice: GAS_PRICE });
            } catch(error) {
                errorThrown8 = true;
                ensureException(error);
            }
            assert.ok(errorThrown8, MESSAGE);

            // Reset exchange rates
            await I_USDOracle.changePrice(USDETH, { from: POLYMATH });
            await I_POLYOracle.changePrice(USDPOLY, { from: POLYMATH });
        });
    });

    describe("Test getter functions", async() => {

        describe("Generic", async() => {

            it("should get the right number of investors", async() => {
                assert.equal((await I_USDTieredSTO_Array[0].investorCount.call()).toNumber(), (await I_USDTieredSTO_Array[0].getNumberInvestors()).toNumber(), "Investor count not changed as expected");
                assert.equal((await I_USDTieredSTO_Array[1].investorCount.call()).toNumber(), (await I_USDTieredSTO_Array[1].getNumberInvestors()).toNumber(), "Investor count not changed as expected");
                assert.equal((await I_USDTieredSTO_Array[2].investorCount.call()).toNumber(), (await I_USDTieredSTO_Array[2].getNumberInvestors()).toNumber(), "Investor count not changed as expected");
            });

            it("should get the right amounts invested", async() => {
                assert.equal((await I_USDTieredSTO_Array[0].fundsRaisedETH.call()).toNumber(), (await I_USDTieredSTO_Array[0].getRaisedEther()).toNumber(), "getRaisedEther not changed as expected");
                assert.equal((await I_USDTieredSTO_Array[0].fundsRaisedPOLY.call()).toNumber(), (await I_USDTieredSTO_Array[0].getRaisedPOLY()).toNumber(), "getRaisedPOLY not changed as expected");
                assert.equal((await I_USDTieredSTO_Array[0].fundsRaisedUSD.call()).toNumber(), (await I_USDTieredSTO_Array[0].getRaisedUSD()).toNumber(), "getRaisedUSD not changed as expected");
            });
        });

        describe("convertToUSD", async() => {

            it("should reset exchange rates", async() => {
                // Reset exchange rates
                await I_USDOracle.changePrice(USDETH, { from: POLYMATH });
                await I_POLYOracle.changePrice(USDPOLY, { from: POLYMATH });
            });

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

    describe("Test cases for the USDTieredSTOFactory", async() => {
        it("should get the exact details of the factory", async() => {
            assert.equal((await I_USDTieredSTOFactory.setupCost.call()).toNumber(), STOSetupCost);
            assert.equal(await I_USDTieredSTOFactory.getType.call(),3);
            assert.equal(web3.utils.hexToString(await I_USDTieredSTOFactory.getName.call()),
                        "USDTieredSTO",
                        "Wrong Module added");
            assert.equal(await I_USDTieredSTOFactory.getDescription.call(),
                        "USD Tiered STO",
                        "Wrong Module added");
            assert.equal(await I_USDTieredSTOFactory.getTitle.call(),
                        "USD Tiered STO",
                        "Wrong Module added");
            assert.equal(await I_USDTieredSTOFactory.getInstructions.call(),
                        "Initialises a USD tiered STO.",
                        "Wrong Module added");
            let tags = await I_USDTieredSTOFactory.getTags.call();
            assert.equal(web3.utils.hexToString(tags[0]),"USD");
            assert.equal(web3.utils.hexToString(tags[1]),"Tiered");
            assert.equal(web3.utils.hexToString(tags[2]),"POLY");
            assert.equal(web3.utils.hexToString(tags[3]),"ETH");

        });
     });
});
