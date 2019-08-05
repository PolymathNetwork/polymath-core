import latestTime from "./helpers/latestTime";
import { duration, ensureException, promisifyLogWatch, latestBlock } from "./helpers/utils";
import { takeSnapshot, increaseTime, revertToSnapshot } from "./helpers/time";
import { encodeProxyCall } from "./helpers/encodeCall";
import { catchRevert } from "./helpers/exceptions";
import { setUpPolymathNetwork, deployUSDTieredSTOAndVerified } from "./helpers/createInstances";

const USDTieredSTOFactory = artifacts.require("./USDTieredSTOFactory.sol");
const USDTieredSTO = artifacts.require("./USDTieredSTO.sol");
const MockOracle = artifacts.require("./MockOracle.sol");
const SecurityToken = artifacts.require("./SecurityToken.sol");
const GeneralTransferManager = artifacts.require("./GeneralTransferManager");
const GeneralPermissionManager = artifacts.require("./GeneralPermissionManager");
const PolyTokenFaucet = artifacts.require("./PolyTokenFaucet.sol");
const STGetter = artifacts.require("./STGetter.sol");

const Web3 = require("web3");
let BN = Web3.utils.BN;
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port

//const TOLERANCE = 2; // Allow balances to be off by 2 WEI for rounding purposes

contract("USDTieredSTO Sim", async (accounts) => {
    // Accounts Variable declaration
    let POLYMATH;
    let ISSUER;
    let WALLET;
    let TREASURYWALLET;
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
    let I_GeneralTransferManagerFactory;
    let I_USDTieredSTOProxyFactory;
    let I_SecurityTokenRegistryProxy;
    let I_GeneralPermissionManager;
    let I_GeneralTransferManager;
    let I_ModuleRegistryProxy;
    let I_ModuleRegistry;
    let I_FeatureRegistry;
    let I_SecurityTokenRegistry;
    let I_USDTieredSTOFactory;
    let I_USDOracle;
    let I_POLYOracle;
    let I_STFactory;
    let I_MRProxied;
    let I_STRProxied;
    let I_SecurityToken;
    let I_USDTieredSTO_Array = [];
    let I_PolyToken;
    let I_DaiToken;
    let I_PolymathRegistry;
    let I_STRGetter;
    let I_STGetter;
    let stGetter;

    // SecurityToken Details for funds raise Type ETH
    const NAME = "Team";
    const SYMBOL = "SAP";
    const TOKENDETAILS = "This is equity type of issuance";
    const DECIMALS = 18;

    // Module key
    const TMKEY = 2;
    const STOKEY = 3;

    // Initial fee for ticker registry and security token registry
    const REGFEE = new BN(web3.utils.toWei("1000"));
    const STOSetupCost = 0;

    // MockOracle USD prices
    const USDETH = new BN(500).mul(new BN(10).pow(new BN(18))); // 500 USD/ETH
    const USDPOLY = new BN(25).mul(new BN(10).pow(new BN(16))); // 0.25 USD/POLY

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
    let _treasuryWallet = [];
    let _usdToken = [];

    const address_zero = "0x0000000000000000000000000000000000000000";
    const one_address = "0x0000000000000000000000000000000000000001";

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
        address _treasuryWallet,
        address _usdToken
    ) */
    const functionSignature = {
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
                name: "_treasuryWallet"
            },
            {
                type: "address[]",
                name: "_usdTokens"
            }
        ]
    };

    function getRandomInt(min, max) {
        let random = Math.floor(Math.random() * 10 ** 10);
        return new BN(random).mul(new BN(max).add(new BN(1)).sub(new BN(min))).div(new BN(10).pow(new BN(10)));
    }

    function minBN(a, b) {
        if (a.lt(b))
            return a;
        else
            return b;
    }

    let currentTime;
    let e18 = new BN(10).pow(new BN(18));
    let e16 = new BN(10).pow(new BN(16));

    before(async () => {
        currentTime = new BN(await latestTime());
        POLYMATH = accounts[0];
        ISSUER = accounts[1];
        WALLET = accounts[2];
        TREASURYWALLET = WALLET;
        ACCREDITED1 = accounts[3];
        ACCREDITED2 = accounts[4];
        NONACCREDITED1 = accounts[5];
        NONACCREDITED2 = accounts[6];
        NOTWHITELISTED = accounts[7];
        NOTAPPROVED = accounts[8];
        INVESTOR1 = accounts[9];

        I_DaiToken = await PolyTokenFaucet.new();

        // Step:1 Create the polymath ecosystem contract instances
        let instances = await setUpPolymathNetwork(POLYMATH, ISSUER);

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
            I_STRProxied,
            I_STRGetter,
            I_STGetter
        ] = instances;

        I_DaiToken = await PolyTokenFaucet.new({ from: POLYMATH });

        // STEP 5: Deploy the USDTieredSTOFactory
        [I_USDTieredSTOFactory] = await deployUSDTieredSTOAndVerified(POLYMATH, I_MRProxied, STOSetupCost);

        // Step 12: Deploy & Register Mock Oracles
        I_USDOracle = await MockOracle.new(address_zero, web3.utils.fromAscii("ETH"), web3.utils.fromAscii("USD"), USDETH, { from: POLYMATH }); // 500 dollars per POLY
        I_POLYOracle = await MockOracle.new(I_PolyToken.address, web3.utils.fromAscii("POLY"), web3.utils.fromAscii("USD"), USDPOLY, { from: POLYMATH }); // 25 cents per POLY
        await I_PolymathRegistry.changeAddress("EthUsdOracle", I_USDOracle.address, { from: POLYMATH });
        await I_PolymathRegistry.changeAddress("PolyUsdOracle", I_POLYOracle.address, { from: POLYMATH });

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

        USDOracle:                         ${I_USDOracle.address}
        POLYOracle:                        ${I_POLYOracle.address}
        USDTieredSTOFactory:               ${I_USDTieredSTOFactory.address}
        -----------------------------------------------------------------------------
        `);
    });

    describe("Deploy the STO", async () => {
        it("Should register the ticker before the generation of the security token", async () => {
            await I_PolyToken.getTokens(REGFEE, ISSUER);
            await I_PolyToken.approve(I_STRProxied.address, REGFEE, { from: ISSUER });
            let tx = await I_STRProxied.registerNewTicker(ISSUER, SYMBOL, { from: ISSUER });
            assert.equal(tx.logs[0].args._owner, ISSUER);
            assert.equal(tx.logs[0].args._ticker, SYMBOL);
        });

        it("Should generate the new security token with the same symbol as registered above", async () => {
            await I_PolyToken.getTokens(REGFEE, ISSUER);
            await I_PolyToken.approve(I_STRProxied.address, REGFEE, { from: ISSUER });

            let tx = await I_STRProxied.generateNewSecurityToken(NAME, SYMBOL, TOKENDETAILS, true, ISSUER, 0, { from: ISSUER });
            assert.equal(tx.logs[1].args._ticker, SYMBOL, "SecurityToken doesn't get deployed");

            I_SecurityToken = await SecurityToken.at(tx.logs[1].args._securityTokenAddress);
            stGetter = await STGetter.at(I_SecurityToken.address);
            assert.equal(await stGetter.getTreasuryWallet.call(), ISSUER, "Incorrect wallet set");
            const log = (await I_SecurityToken.getPastEvents('ModuleAdded', {filter: {transactionHash: tx.transactionHash}}))[0];

            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._types[0].toNumber(), TMKEY);
            assert.equal(web3.utils.hexToString(log.args._name), "GeneralTransferManager");
        });

        it("Should initialize the auto attached modules", async () => {
            let moduleData = (await stGetter.getModulesByType(TMKEY))[0];
            I_GeneralTransferManager = await GeneralTransferManager.at(moduleData);
        });

        it("Should successfully attach the first STO module to the security token", async () => {
            let stoId = 0;

            _startTime.push(new BN(currentTime).add(new BN(duration.days(2))));
            _endTime.push(new BN(_startTime[stoId]).add(new BN(currentTime).add(new BN(duration.days(100)))));
            _ratePerTier.push([new BN(50).mul(e16).toString(), new BN(130).mul(e16).toString(), new BN(170).mul(e16).toString()]); // [ 0.05 USD/Token, 0.10 USD/Token, 0.15 USD/Token ]
            _ratePerTierDiscountPoly.push([new BN(50).mul(e16).toString(), new BN(80).mul(e16).toString(), new BN(130).mul(e16).toString()]); // [ 0.05 USD/Token, 0.08 USD/Token, 0.13 USD/Token ]
            _tokensPerTierTotal.push([new BN(200).mul(e18).toString(), new BN(500).mul(e18).toString(), new BN(300).mul(e18).toString()]); // [ 1000 Token, 2000 Token, 1500 Token ]
            _tokensPerTierDiscountPoly.push([new BN(0).toString(), new BN(50).mul(e18).toString(), new BN(300).mul(e18).toString()]); // [ 0 Token, 1000 Token, 1500 Token ]
            _nonAccreditedLimitUSD.push(new BN(10).mul(e18)); // 20 USD
            _minimumInvestmentUSD.push(new BN(0)); // 1 wei USD
            _fundRaiseTypes.push([0, 1, 2]);
            _wallet.push(WALLET);
            _treasuryWallet.push(TREASURYWALLET);
            _usdToken.push(I_DaiToken.address);

            let config = [
                _startTime[stoId].toString(),
                _endTime[stoId].toString(),
                _ratePerTier[stoId],
                _ratePerTierDiscountPoly[stoId],
                _tokensPerTierTotal[stoId],
                _tokensPerTierDiscountPoly[stoId],
                _nonAccreditedLimitUSD[stoId].toString(),
                _minimumInvestmentUSD[stoId].toString(),
                _fundRaiseTypes[stoId],
                _wallet[stoId],
                _treasuryWallet[stoId],
                [_usdToken[stoId]]
            ];

            _ratePerTier = [];
            _ratePerTierDiscountPoly = [];
            _tokensPerTierTotal = [];
            _tokensPerTierDiscountPoly = [];
            _ratePerTier.push([new BN(50).mul(e16), new BN(130).mul(e16), new BN(170).mul(e16)]); // [ 0.05 USD/Token, 0.10 USD/Token, 0.15 USD/Token ]
            _ratePerTierDiscountPoly.push([new BN(50).mul(e16), new BN(80).mul(e16), new BN(130).mul(e16)]); // [ 0.05 USD/Token, 0.08 USD/Token, 0.13 USD/Token ]
            _tokensPerTierTotal.push([new BN(200).mul(e18), new BN(500).mul(e18), new BN(300).mul(e18)]); // [ 1000 Token, 2000 Token, 1500 Token ]
            _tokensPerTierDiscountPoly.push([new BN(0), new BN(50).mul(e18), new BN(300).mul(e18)]); // [ 0 Token, 1000 Token, 1500 Token ]


            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            let tx = await I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, new BN(0), new BN(0), false, { from: ISSUER, gasPrice: GAS_PRICE });
            console.log("          Gas addModule: ".grey + tx.receipt.gasUsed.toString().grey);
            assert.equal(tx.logs[2].args._types[0], STOKEY, "USDTieredSTO doesn't get deployed");
            assert.equal(web3.utils.hexToString(tx.logs[2].args._name), "USDTieredSTO", "USDTieredSTOFactory module was not added");
            I_USDTieredSTO_Array.push(await USDTieredSTO.at(tx.logs[2].args._module));

            assert.equal((await I_USDTieredSTO_Array[stoId].startTime.call()).toString(), _startTime[stoId].toString(), "Incorrect _startTime in config");
            assert.equal((await I_USDTieredSTO_Array[stoId].endTime.call()).toString(), _endTime[stoId].toString(), "Incorrect _endTime in config");
            for (var i = 0; i < _ratePerTier[stoId].length; i++) {
                assert.equal(
                    (await I_USDTieredSTO_Array[stoId].tiers.call(i))[0].toString(),
                    _ratePerTier[stoId][i].toString(),
                    "Incorrect _ratePerTier in config"
                );
                assert.equal(
                    (await I_USDTieredSTO_Array[stoId].tiers.call(i))[1].toString(),
                    _ratePerTierDiscountPoly[stoId][i].toString(),
                    "Incorrect _ratePerTierDiscountPoly in config"
                );
                assert.equal(
                    (await I_USDTieredSTO_Array[stoId].tiers.call(i))[2].toString(),
                    _tokensPerTierTotal[stoId][i].toString(),
                    "Incorrect _tokensPerTierTotal in config"
                );
                assert.equal(
                    (await I_USDTieredSTO_Array[stoId].tiers.call(i))[3].toString(),
                    _tokensPerTierDiscountPoly[stoId][i].toString(),
                    "Incorrect _tokensPerTierDiscountPoly in config"
                );
            }
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].nonAccreditedLimitUSD.call()).toString(),
                _nonAccreditedLimitUSD[stoId].toString(),
                "Incorrect _nonAccreditedLimitUSD in config"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].minimumInvestmentUSD.call()).toString(),
                _minimumInvestmentUSD[stoId].toString(),
                "Incorrect _minimumInvestmentUSD in config"
            );
            assert.equal(await I_USDTieredSTO_Array[stoId].wallet.call(), _wallet[stoId], "Incorrect _wallet in config");
            assert.equal(
                await I_USDTieredSTO_Array[stoId].treasuryWallet.call(),
                _treasuryWallet[stoId],
                "Incorrect _reserveWallet in config"
            );
            assert.equal(
                await I_USDTieredSTO_Array[stoId].getNumberOfTiers(),
                _tokensPerTierTotal[stoId].length,
                "Incorrect number of tiers"
            );
            assert.equal((await I_USDTieredSTO_Array[stoId].getPermissions()).length, new BN(2), "Incorrect number of permissions");
        });

        it("Should successfully prepare the STO", async () => {
            let stoId = 0;

            // Start STO
            await increaseTime(duration.days(3));

            // Whitelist
            let fromTime = await latestTime() + duration.days(15);
            let toTime = await latestTime() + duration.days(15);
            let expiryTime = toTime + duration.days(100);
            let canBuyFromSTO = true;

            await I_GeneralTransferManager.modifyKYCData(ACCREDITED1, fromTime, toTime, expiryTime, { from: ISSUER });
            await I_GeneralTransferManager.modifyInvestorFlag(ACCREDITED1, 0, true, { from: ISSUER });
            await I_GeneralTransferManager.modifyKYCData(ACCREDITED2, fromTime, toTime, expiryTime, { from: ISSUER });
            await I_GeneralTransferManager.modifyInvestorFlag(ACCREDITED2, 0, true, { from: ISSUER });
            await I_GeneralTransferManager.modifyKYCData(NONACCREDITED1, fromTime, toTime, expiryTime, { from: ISSUER });
            await I_GeneralTransferManager.modifyKYCData(NONACCREDITED2, fromTime, toTime, expiryTime, { from: ISSUER });
            await I_GeneralTransferManager.modifyKYCData(NOTAPPROVED, fromTime, toTime, expiryTime, { from: ISSUER });
            await I_GeneralTransferManager.modifyInvestorFlag(NOTAPPROVED, 1, true, { from: ISSUER });

            await increaseTime(duration.days(3));

            // Accreditation
            await I_GeneralTransferManager.modifyInvestorFlag(ACCREDITED1, 0, true, { from: ISSUER });
            await I_GeneralTransferManager.modifyInvestorFlag(ACCREDITED2, 0, true, { from: ISSUER });
        });
    });

    describe("Simulate purchasing", async () => {
        it("Should successfully complete simulation", async () => {
            let stoId = 0;

            console.log(`
        ------------------- Investor Addresses -------------------
        ACCREDITED1:    ${ACCREDITED1}
        ACCREDITED2:    ${ACCREDITED2}
        NONACCREDITED1: ${NONACCREDITED1}
        NONACCREDITED2: ${NONACCREDITED2}
        NOTWHITELISTED: ${NOTWHITELISTED}
        NOTAPPROVED:    ${NOTAPPROVED}
        ----------------------------------------------------------
            `);

            let totalTokens = new BN(0);
            for (var i = 0; i < _tokensPerTierTotal[stoId].length; i++) {
                totalTokens = totalTokens.add(new BN(_tokensPerTierTotal[stoId][i]));
            }
            let tokensSold = new BN(0);
            while (true) {
                let rn = getRandomInt(0, 5);
                let rno = rn.toNumber();
                switch (rno) {
                    case 0: // ACCREDITED1
                        await invest(ACCREDITED1, true);
                        break;
                    case 1: // ACCREDITED2
                        await invest(ACCREDITED2, true);
                        break;
                    case 2: // NONACCREDITED1
                        let usd_NONACCREDITED1 = await I_USDTieredSTO_Array[stoId].investorInvestedUSD.call(NONACCREDITED1);
                        if (_nonAccreditedLimitUSD[stoId].gt(usd_NONACCREDITED1))
                            // under non-accredited cap
                            await invest(NONACCREDITED1, false);
                        // over non-accredited cap
                        else await investFAIL(NONACCREDITED1);
                        break;
                    case 3: // NONACCREDITED2
                        let usd_NONACCREDITED2 = await I_USDTieredSTO_Array[stoId].investorInvestedUSD.call(NONACCREDITED2);
                        if (_nonAccreditedLimitUSD[stoId].gt(usd_NONACCREDITED2))
                            // under non-accredited cap
                            await invest(NONACCREDITED2, false);
                        // over non-accredited cap
                        else await investFAIL(NONACCREDITED2);
                        break;
                    case 4: // NOTWHITELISTED
                        await investFAIL(NOTWHITELISTED);
                        break;
                    case 5: // NOTAPPROVED
                        await investFAIL(NOTAPPROVED);
                        break;
                }
                console.log("Next round");
                tokensSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
                console.log("Tokens Sold: " + tokensSold.div(e18).toString());
                if (tokensSold.gte(totalTokens.sub(new BN(1)))) {
                    console.log(`${tokensSold} tokens sold, simulation completed successfully!`.green);
                    break;
                }
            }

            async function invest(_investor, _isAccredited) {
                // need to add check if reached non-accredited cap
                let USD_remaining;
                if (!_isAccredited) {
                    let USD_to_date = await I_USDTieredSTO_Array[stoId].investorInvestedUSD.call(_investor);
                    USD_remaining = _nonAccreditedLimitUSD[stoId].sub(USD_to_date);
                } else {
                    USD_remaining = totalTokens.mul(new BN(2));
                }

                let log_remaining = USD_remaining;
                let isPoly = Math.random() >= 0.33;
                let isDai = Math.random() >= 0.33;

                let Token_counter = new BN(getRandomInt(new BN(1).mul(new BN(10).pow(new BN(10))), new BN(5).mul(new BN(10).pow(new BN(11))))).mul(new BN(10).pow(new BN(8)));
                let investment_USD = new BN(0);
                let investment_ETH = new BN(0);
                let investment_POLY = new BN(0);
                let investment_DAI = new BN(0);
                let investment_Token = new BN(0);

                let Tokens_total = [];
                let Tokens_discount = [];
                for (var i = 0; i < _ratePerTier[stoId].length; i++) {
                    let tierData = await I_USDTieredSTO_Array[stoId].tiers.call(i);
                    Tokens_total.push(new BN(tierData[2]).sub(tierData[4]));
                    Tokens_discount.push(new BN(tierData[3]).sub(tierData[5]));
                }

                let tier = 0;
                let Token_Tier;
                let USD_Tier;
                let POLY_Tier;
                let ETH_Tier;
                let DAI_Tier;

                let USD_overflow;
                let Token_overflow;

                while (Token_counter.gt(new BN(0))) {
                    if (tier == _ratePerTier[stoId].length) {
                        break;
                    }
                    if (Tokens_total[tier].gt(new BN(0))) {
                        if (isPoly) {
                            // 1. POLY and discount (consume up to cap then move to regular)
                            if (Tokens_discount[tier].gt(new BN(0))) {
                                Token_Tier = minBN(minBN(Tokens_total[tier], Tokens_discount[tier]), Token_counter);
                                USD_Tier = Token_Tier.mul(_ratePerTierDiscountPoly[stoId][tier]).div(e18);
                                if (USD_Tier.gte(USD_remaining)) {
                                    USD_overflow = USD_Tier.sub(USD_remaining);
                                    Token_overflow = USD_overflow.mul(e18).div(_ratePerTierDiscountPoly[stoId][tier]);
                                    USD_Tier = USD_Tier.sub(USD_overflow);
                                    Token_Tier = Token_Tier.sub(Token_overflow);
                                    Token_counter = new BN(0);
                                }
                                POLY_Tier = new BN(USD_Tier.mul(e18));
                                POLY_Tier = POLY_Tier.div(USDPOLY);
                                USD_remaining = USD_remaining.sub(USD_Tier);
                                Tokens_total[tier] = Tokens_total[tier].sub(Token_Tier);
                                Tokens_discount[tier] = Tokens_discount[tier].sub(Token_Tier);
                                Token_counter = Token_counter.sub(Token_Tier);
                                investment_Token = investment_Token.add(Token_Tier);
                                investment_USD = investment_USD.add(USD_Tier);
                                investment_POLY = investment_POLY.add(POLY_Tier);
                            }
                            // 2. POLY and regular (consume up to cap then skip to next tier)
                            if (Tokens_total[tier].gt(new BN(0)) && Token_counter.gt(new BN(0))) {
                                Token_Tier = minBN(Tokens_total[tier], Token_counter);
                                USD_Tier = Token_Tier.mul(_ratePerTier[stoId][tier]).div(e18);
                                if (USD_Tier.gte(USD_remaining)) {
                                    USD_overflow = USD_Tier.sub(USD_remaining);
                                    Token_overflow = USD_overflow.mul(e18).div(_ratePerTier[stoId][tier]);
                                    USD_Tier = USD_Tier.sub(USD_overflow);
                                    Token_Tier = Token_Tier.sub(Token_overflow);
                                    Token_counter = new BN(0);
                                }
                                POLY_Tier = new BN(USD_Tier.mul(e18));
                                POLY_Tier = POLY_Tier.div(USDPOLY);
                                USD_remaining = USD_remaining.sub(USD_Tier);
                                Tokens_total[tier] = Tokens_total[tier].sub(Token_Tier);
                                Token_counter = Token_counter.sub(Token_Tier);
                                investment_Token = investment_Token.add(Token_Tier);
                                investment_USD = investment_USD.add(USD_Tier);
                                investment_POLY = investment_POLY.add(POLY_Tier);
                            }
                        } else if (isDai) {
                            // 3. DAI (consume up to cap then skip to next tier)
                            Token_Tier = minBN(Tokens_total[tier], Token_counter);
                            USD_Tier = Token_Tier.mul(_ratePerTier[stoId][tier]).div(e18);
                            if (USD_Tier.gte(USD_remaining)) {
                                USD_overflow = USD_Tier.sub(USD_remaining);
                                Token_overflow = USD_overflow.mul(e18).div(_ratePerTier[stoId][tier]);
                                USD_Tier = USD_Tier.sub(USD_overflow);
                                Token_Tier = Token_Tier.sub(Token_overflow);
                                Token_counter = new BN(0);
                            }
                            DAI_Tier = USD_Tier;
                            USD_remaining = USD_remaining.sub(USD_Tier);
                            Tokens_total[tier] = Tokens_total[tier].sub(Token_Tier);
                            Token_counter = Token_counter.sub(Token_Tier);
                            investment_Token = investment_Token.add(Token_Tier);
                            investment_USD = investment_USD.add(USD_Tier);
                            investment_DAI = investment_USD;
                        } else {
                            // 4. ETH (consume up to cap then skip to next tier)
                            Token_Tier = minBN(Tokens_total[tier], Token_counter);
                            USD_Tier = Token_Tier.mul(_ratePerTier[stoId][tier]).div(e18);
                            if (USD_Tier.gte(USD_remaining)) {
                                USD_overflow = USD_Tier.sub(USD_remaining);
                                Token_overflow = USD_overflow.mul(e18).div(_ratePerTier[stoId][tier]);
                                USD_Tier = USD_Tier.sub(USD_overflow);
                                Token_Tier = Token_Tier.sub(Token_overflow);
                                Token_counter = new BN(0);
                            }
                            ETH_Tier = USD_Tier.mul(e18).div(USDETH);
                            USD_remaining = USD_remaining.sub(USD_Tier);
                            Tokens_total[tier] = Tokens_total[tier].sub(Token_Tier);
                            Token_counter = Token_counter.sub(Token_Tier);
                            investment_Token = investment_Token.add(Token_Tier);
                            investment_USD = investment_USD.add(USD_Tier);
                            investment_ETH = investment_ETH.add(ETH_Tier);
                        }
                    }
                    tier = tier + 1;
                }

                await processInvestment(
                    _investor,
                    investment_Token,
                    investment_USD,
                    investment_POLY,
                    investment_DAI,
                    investment_ETH,
                    isPoly,
                    isDai,
                    log_remaining,
                    Tokens_total,
                    Tokens_discount,
                    tokensSold
                );
            }

            async function investFAIL(_investor) {
                let isPoly = Math.random() >= 0.3;
                let isDAI = Math.random() >= 0.3;
                let investment_POLY = new BN(40).mul(e18); // 10 USD = 40 POLY
                let investment_ETH = new BN(20).mul(e16); // 10 USD = 0.02 ETH
                let investment_DAI = new BN(10).mul(e18); // 10 USD = DAI DAI

                if (isPoly) {
                    await I_PolyToken.getTokens(investment_POLY, _investor);
                    await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: _investor });
                    await catchRevert(
                        I_USDTieredSTO_Array[stoId].buyWithPOLY(_investor, investment_POLY, { from: _investor, gasPrice: GAS_PRICE })
                    );
                } else if (isDAI) {
                    await I_DaiToken.getTokens(investment_DAI, _investor);
                    await I_DaiToken.approve(I_USDTieredSTO_Array[stoId].address, investment_DAI, { from: _investor });
                    await catchRevert(
                        I_USDTieredSTO_Array[stoId].buyWithUSD(_investor, investment_DAI, I_DaiToken.address, { from: _investor, gasPrice: GAS_PRICE })
                    );
                } else
                    await catchRevert(
                        I_USDTieredSTO_Array[stoId].buyWithETH(_investor, { from: _investor, value: investment_ETH, gasPrice: GAS_PRICE })
                    );
            }

            async function processInvestment(
                _investor,
                investment_Token,
                investment_USD,
                investment_POLY,
                investment_DAI,
                investment_ETH,
                isPoly,
                isDai,
                log_remaining,
                Tokens_total,
                Tokens_discount,
                tokensSold
            ) {
                investment_Token = new BN(investment_Token);
                investment_USD = new BN(investment_USD);
                investment_POLY = new BN(investment_POLY);
                investment_DAI = new BN(investment_DAI);
                investment_ETH = new BN(investment_ETH);
                console.log(`
            ------------------- New Investment -------------------
            Investor:   ${_investor}
            N-A USD Remaining:      ${log_remaining}
            Total Cap Remaining:    ${Tokens_total}
            Discount Cap Remaining: ${Tokens_discount}
            Total Tokens Sold:      ${tokensSold}
            Token Investment:       ${investment_Token}
            USD Investment:         ${investment_USD}
            POLY Investment:        ${investment_POLY}
            DAI Investment:         ${investment_DAI}
            ETH Investment:         ${investment_ETH}
            ------------------------------------------------------
                `);

                if (isPoly) {
                    await I_PolyToken.getTokens(investment_POLY, _investor);
                    await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: _investor });
                } else if (isDai) {
                    await I_DaiToken.getTokens(investment_DAI, _investor);
                    await I_DaiToken.approve(I_USDTieredSTO_Array[stoId].address, investment_DAI, { from: _investor });
                }

                // console.log(await I_USDTieredSTO_Array[stoId].isOpen());

                let init_TokenSupply = await I_SecurityToken.totalSupply();
                let init_InvestorTokenBal = await I_SecurityToken.balanceOf(_investor);
                let init_InvestorETHBal = new BN(await web3.eth.getBalance(_investor));
                let init_InvestorPOLYBal = await I_PolyToken.balanceOf(_investor);
                let init_InvestorDAIBal = await I_DaiToken.balanceOf(_investor);
                let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
                let init_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
                let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
                let init_STODAIBal = await I_DaiToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
                let init_RaisedUSD = await I_USDTieredSTO_Array[stoId].fundsRaisedUSD.call();
                let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(0);
                let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(1);
                let init_RaisedDAI = await I_USDTieredSTO_Array[stoId].fundsRaised.call(2);
                let init_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
                let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);
                let init_WalletDAIBal = await I_DaiToken.balanceOf(WALLET);

                let tx;
                let gasCost = new BN(0);

                if (isPoly && investment_POLY.gt(new BN(10))) {
                    tx = await I_USDTieredSTO_Array[stoId].buyWithPOLY(_investor, investment_POLY, {
                        from: _investor,
                        gasPrice: GAS_PRICE
                    });
                    gasCost = new BN(GAS_PRICE).mul(new BN(tx.receipt.gasUsed));
                    console.log(
                        `buyWithPOLY: ${investment_Token.div(e18)} tokens for ${investment_POLY.div(e18)} POLY by ${_investor}`
                            .yellow
                    );
                } else if (isDai && investment_DAI.gt(new BN(10))) {
                    tx = await I_USDTieredSTO_Array[stoId].buyWithUSD(_investor, investment_DAI, I_DaiToken.address, { from: _investor, gasPrice: GAS_PRICE });
                    gasCost = new BN(GAS_PRICE).mul(new BN(tx.receipt.gasUsed));
                    console.log(
                        `buyWithUSD: ${investment_Token.div(e18)} tokens for ${investment_DAI.div(e18)} DAI by ${_investor}`
                            .yellow
                    );
                } else if (investment_ETH.gt(new BN(0))) {
                    tx = await I_USDTieredSTO_Array[stoId].buyWithETH(_investor, {
                        from: _investor,
                        value: investment_ETH,
                        gasPrice: GAS_PRICE
                    });
                    gasCost = new BN(GAS_PRICE).mul(new BN(tx.receipt.gasUsed));
                    console.log(
                        `buyWithETH: ${investment_Token.div(e18)} tokens for ${investment_ETH.div(e18)} ETH by ${_investor}`
                            .yellow
                    );
                }

                let final_TokenSupply = await I_SecurityToken.totalSupply();
                let final_InvestorTokenBal = await I_SecurityToken.balanceOf(_investor);
                let final_InvestorETHBal = new BN(await web3.eth.getBalance(_investor));
                let final_InvestorPOLYBal = await I_PolyToken.balanceOf(_investor);
                let final_InvestorDAIBal = await I_DaiToken.balanceOf(_investor);
                let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
                let final_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
                let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
                let final_STODAIBal = await I_DaiToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
                let final_RaisedUSD = await I_USDTieredSTO_Array[stoId].fundsRaisedUSD.call();
                let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(0);
                let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(1);
                let final_RaisedDAI = await I_USDTieredSTO_Array[stoId].fundsRaised.call(2);
                let final_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
                let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);
                let final_WalletDAIBal = await I_DaiToken.balanceOf(WALLET);

                // console.log('init_TokenSupply: '+init_TokenSupply.div(10**18).toNumber());
                // console.log('final_TokenSupply: '+final_TokenSupply.div(10**18).toNumber());

                if (isPoly) {
                    assertIsNear(final_TokenSupply, init_TokenSupply.add(investment_Token), "Token Supply not changed as expected" );
                    assertIsNear(final_InvestorTokenBal, init_InvestorTokenBal.add(investment_Token), "Investor Token Balance not changed as expected" );
                    assertIsNear(final_InvestorETHBal, init_InvestorETHBal.sub(gasCost), "Investor ETH Balance not changed as expected" );
                    assertIsNear(final_InvestorPOLYBal, init_InvestorPOLYBal.sub(investment_POLY), "Investor POLY Balance not changed as expected" );
                    assertIsNear(final_STOTokenSold, init_STOTokenSold.add(investment_Token), "STO Token Sold not changed as expected" );
                    assertIsNear(final_STOETHBal, init_STOETHBal, "STO ETH Balance not changed as expected" );
                    assertIsNear(final_STOPOLYBal, init_STOPOLYBal, "STO POLY Balance not changed as expected" );
                    assertIsNear(final_RaisedUSD, init_RaisedUSD.add(investment_USD), "Raised USD not changed as expected" );
                    assertIsNear(final_RaisedETH, init_RaisedETH, "Raised ETH not changed as expected");
                    assertIsNear(final_RaisedPOLY, init_RaisedPOLY.add(investment_POLY), "Raised POLY not changed as expected" );
                    assertIsNear(final_WalletETHBal, init_WalletETHBal, "Wallet ETH Balance not changed as expected" );
                    assertIsNear(final_WalletPOLYBal, init_WalletPOLYBal.add(investment_POLY), "Wallet POLY Balance not changed as expected" );
                } else if (isDai) {
                    assertIsNear(final_TokenSupply, init_TokenSupply.add(investment_Token), "Token Supply not changed as expected" );
                    assertIsNear(final_InvestorTokenBal, init_InvestorTokenBal.add(investment_Token), "Investor Token Balance not changed as expected" );
                    assertIsNear(final_InvestorETHBal, init_InvestorETHBal.sub(gasCost), "Investor ETH Balance not changed as expected" );
                    assertIsNear(final_InvestorDAIBal, init_InvestorDAIBal.sub(investment_DAI), "Investor DAI Balance not changed as expected" );
                    assertIsNear(final_STOTokenSold, init_STOTokenSold.add(investment_Token), "STO Token Sold not changed as expected" );
                    assertIsNear(final_STOETHBal, init_STOETHBal, "STO ETH Balance not changed as expected" );
                    assertIsNear(final_STODAIBal, init_STODAIBal, "STO DAI Balance not changed as expected" );
                    assertIsNear(final_RaisedUSD, init_RaisedUSD.add(investment_USD), "Raised USD not changed as expected" );
                    assertIsNear(final_RaisedETH, init_RaisedETH, "Raised ETH not changed as expected");
                    assertIsNear(final_RaisedDAI, init_RaisedDAI.add(investment_DAI), "Raised DAI not changed as expected" );
                    assertIsNear(final_WalletETHBal, init_WalletETHBal, "Wallet ETH Balance not changed as expected" );
                    assertIsNear(final_WalletDAIBal, init_WalletDAIBal.add(investment_DAI), "Wallet DAI Balance not changed as expected" );
                } else {
                    assertIsNear(final_TokenSupply, init_TokenSupply.add(investment_Token), "Token Supply not changed as expected" );
                    assertIsNear(final_InvestorTokenBal, init_InvestorTokenBal.add(investment_Token), "Investor Token Balance not changed as expected" );
                    assertIsNear(final_InvestorETHBal, init_InvestorETHBal .sub(gasCost) .sub(investment_ETH) , "Investor ETH Balance not changed as expected" );
                    assertIsNear(final_InvestorPOLYBal, init_InvestorPOLYBal, "Investor POLY Balance not changed as expected" );
                    assertIsNear(final_STOTokenSold, init_STOTokenSold.add(investment_Token), "STO Token Sold not changed as expected" );
                    assertIsNear(final_STOETHBal, init_STOETHBal, "STO ETH Balance not changed as expected" );
                    assertIsNear(final_STOPOLYBal, init_STOPOLYBal, "STO POLY Balance not changed as expected" );
                    assertIsNear(final_RaisedUSD, init_RaisedUSD.add(investment_USD), "Raised USD not changed as expected" );
                    assertIsNear(final_RaisedETH, init_RaisedETH.add(investment_ETH), "Raised ETH not changed as expected" );
                    assertIsNear(final_RaisedPOLY, init_RaisedPOLY, "Raised POLY not changed as expected" );
                    assertIsNear(final_WalletETHBal, init_WalletETHBal.add(investment_ETH), "Wallet ETH Balance not changed as expected" );
                    assertIsNear(final_WalletPOLYBal, init_WalletPOLYBal, "Wallet POLY Balance not changed as expected" );
                }
            }
        });
    });
});

function assertIsNear(a, b, reason) {
    a = new BN(a);
    b = new BN(b);
    if (a.gt(b)) {
        assert.isBelow(a.sub(b).toNumber(), 4, reason);
    } else {
        assert.isBelow(b.sub(a).toNumber(), 4, reason);
    }
}
