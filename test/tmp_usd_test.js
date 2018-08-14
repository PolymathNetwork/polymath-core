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
    let ACCREDITED1;
    let ACCREDITED2;
    let NONACCREDITED1;
    let NONACCREDITED2;
    let NOTWHITELISTED;
    let NOTAPPROVED;

    let MESSAGE = "Transaction Should Fail!";
    const GAS_PRICE = 10000000000; // 10 GWEI

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

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
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
        NOTWHITELISTED = accounts[7];
        NOTAPPROVED = accounts[8];
        INVESTOR1 = accounts[9];

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
        await I_SecurityTokenRegistry.changeOracle("ETH", "USD", I_USDOracle.address, { from: POLYMATH });
        await I_SecurityTokenRegistry.changeOracle("POLY", "USD", I_POLYOracle.address, { from: POLYMATH });

        // Printing all the contract addresses
        console.log(`
        -------------------- Polymath Network Smart Contracts: --------------------
        ModuleRegistry:                  ${I_ModuleRegistry.address}
        GeneralTransferManagerFactory:   ${I_GeneralTransferManagerFactory.address}
        GeneralPermissionManagerFactory: ${I_GeneralPermissionManagerFactory.address}
        USDTieredSTOFactory:             ${I_USDTieredSTOFactory.address}
        TickerRegistry:                  ${I_TickerRegistry.address}
        STVersionProxy_001:              ${I_STVersion.address}
        SecurityTokenRegistry:           ${I_SecurityTokenRegistry.address}
        USDOracle:                       ${I_USDOracle.address}
        POLYOracle:                      ${I_POLYOracle.address}
        ---------------------------------------------------------------------------
        `);
    });

    describe("Deploy the STO", async() => {

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

        it("Should successfully attach the first STO module to the security token", async () => {
            let stoId = 0;

            _startTime.push(latestTime() + duration.days(2));
            _endTime.push(_startTime[stoId] + duration.days(100));
            _ratePerTier.push([
                BigNumber(0.05*10**18), BigNumber(0.13*10**18), BigNumber(0.17*10**18)
            ]); // [ 0.05 USD/Token, 0.10 USD/Token, 0.15 USD/Token ]
            _ratePerTierDiscountPoly.push([
                BigNumber(0.05*10**18), BigNumber(0.08*10**18), BigNumber(0.13*10**18)
            ]); // [ 0.05 USD/Token, 0.08 USD/Token, 0.13 USD/Token ]
            _tokensPerTierTotal.push([
                BigNumber(200*10**18), BigNumber(500*10**18), BigNumber(300*10**18)
            ]); // [ 1000 Token, 2000 Token, 1500 Token ]
            _tokensPerTierDiscountPoly.push([
                BigNumber(0), BigNumber(50*10**18), BigNumber(300*10**18)
            ]); // [ 0 Token, 1000 Token, 1500 Token ]
            _nonAccreditedLimitUSD.push(BigNumber(10*10**18)); // 20 USD
            _minimumInvestmentUSD.push(BigNumber(0));          // 1 wei USD
            _fundRaiseTypes.push([0,1]);
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

        it("Should successfully prepare the STO", async() => {
            let stoId = 0;

            // Start STO
            await increaseTime(duration.days(3));

            // Whitelist
            let fromTime = latestTime() + duration.days(15);
            let toTime = latestTime() + duration.days(15);
            let expiryTime = toTime + duration.days(100);
            let canBuyFromSTO = true;

            await I_GeneralTransferManager.modifyWhitelist(ACCREDITED1, fromTime, toTime, expiryTime, canBuyFromSTO, { from: ISSUER });
            await I_GeneralTransferManager.modifyWhitelist(ACCREDITED2, fromTime, toTime, expiryTime, canBuyFromSTO, { from: ISSUER });
            await I_GeneralTransferManager.modifyWhitelist(NONACCREDITED1, fromTime, toTime, expiryTime, canBuyFromSTO, { from: ISSUER });
            await I_GeneralTransferManager.modifyWhitelist(NONACCREDITED2, fromTime, toTime, expiryTime, canBuyFromSTO, { from: ISSUER });
            await I_GeneralTransferManager.modifyWhitelist(NOTAPPROVED, fromTime, toTime, expiryTime, false, { from: ISSUER });

            await increaseTime(duration.days(3));

            // Accreditation
            await I_USDTieredSTO_Array[stoId].changeAccredited([ACCREDITED1, ACCREDITED2], [true, true], { from: ISSUER });
            await I_USDTieredSTO_Array[stoId].changeAccredited([NONACCREDITED1, NONACCREDITED2], [false, false], { from: ISSUER });
        });
    });

    describe("Simulate purchasing", async() => {

        it("Should successfully complete simulation", async() => {
            let stoId = 0;
            //This works
            let investment_POLY = BigNumber(8*10**18);
            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, {from: ACCREDITED1});
            await I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, {from: ACCREDITED1});
            //This does not work
            investment_POLY = BigNumber('8400382773888000235');
            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, {from: ACCREDITED1});
            await I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, {from: ACCREDITED1});
            //Fails because:
            //investment_POLY != decimalDiv(decimalMul(investment_POLY, BigNumber(0.25 * 10**18)), BigNumber(0.25 * 10**18))
            //(it is off by one)
        });
    });
});
