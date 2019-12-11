import latestTime from "./helpers/latestTime";
import { duration, ensureException, promisifyLogWatch, latestBlock } from "./helpers/utils";
import { takeSnapshot, increaseTime, revertToSnapshot } from "./helpers/time";
import { encodeProxyCall, encodeModuleCall } from "./helpers/encodeCall";
import { catchRevert } from "./helpers/exceptions";
import { setUpPolymathNetwork, deployGPMAndVerifyed, deployUSDTieredSTOAndVerified } from "./helpers/createInstances";

const USDTieredSTO = artifacts.require("./USDTieredSTO.sol");
const MockOracle = artifacts.require("./MockOracle.sol");
const SecurityToken = artifacts.require("./SecurityToken.sol");
const GeneralTransferManager = artifacts.require("./GeneralTransferManager");
const PolyTokenFaucet = artifacts.require("./PolyTokenFaucet.sol");
const STGetter = artifacts.require("./STGetter.sol");
const MakerDaoOracleV2 = artifacts.require("./MakerDAOOracleV2.sol");

const Web3 = require("web3");
let BN = Web3.utils.BN;
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port

contract("USDTieredSTO", async (accounts) => {
    let e18;
    let e16;
    // Accounts Variable declaration
    let POLYMATH;
    let ISSUER;
    let WALLET;
    let TREASURYWALLET;
    let INVESTOR1;
    let INVESTOR2;
    let INVESTOR3;
    let INVESTOR4;
    let BENEFICIARY1;
    let ACCREDITED1;
    let ACCREDITED2;
    let NONACCREDITED1;
    let NONACCREDITED2;
    let ETH = 0;
    let POLY = 1;
    let DAI = 2;
    let oldEthRate;
    let oldPolyRate;
    let I_OracleV2;

    let MESSAGE = "Transaction Should Fail!";
    const GAS_PRICE = 0;

    // Contract Instance Declaration
    let I_GeneralPermissionManagerFactory;
    let I_SecurityTokenRegistryProxy;
    let I_GeneralTransferManagerFactory;
    let I_USDTieredSTOProxyFactory;
    let I_GeneralPermissionManager;
    let I_GeneralTransferManager;
    let I_ModuleRegistry;
    let I_ModuleRegistryProxy;
    let I_FeatureRegistry;
    let I_SecurityTokenRegistry;
    let I_USDTieredSTOFactory;
    let I_USDOracle;
    let I_POLYOracle;
    let I_STFactory;
    let I_SecurityToken;
    let I_STRProxied;
    let I_MRProxied;
    let I_USDTieredSTO_Array = [];
    let I_USDTieredSTO;
    let I_PolyToken;
    let I_DaiToken;
    let I_PolymathRegistry;
    let P_USDTieredSTOFactory;
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
    let snapId;
    const address_zero = "0x0000000000000000000000000000000000000000";
    const one_address = "0x0000000000000000000000000000000000000001";

    // Initial fee for ticker registry and security token registry
    let REGFEE;
    const STOSetupCost = 0;

    const STOs = {
        usdRaiseOnly: 6
    }

    // MockOracle USD prices
    let USDETH; // 500 USD/ETH
    let USDPOLY; // 0.25 USD/POLY
    let totalInvestment = 0;

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
    let _customOracleAddresses = [];
    let _denominatedCurrency = [];

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
        address _reserveWallet,
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
                name: "_stableTokens"
            },
            {
                type: "address[]",
                name: "_customOracleAddresses"
            },
            {
                type: "bytes32",
                name: "_denominatedCurrency"
            }
        ]
    };

    function convertToNumber(value) {
        return web3.utils.fromWei(value.toString());
    }

    async function convert(_stoID, _tier, _discount, _currencyFrom, _currencyTo, _amount) {
        let USDTOKEN;
        _amount = new BN(_amount);
        if (_discount) USDTOKEN = (await I_USDTieredSTO_Array[_stoID].tiers.call(_tier))[1];
        else USDTOKEN = (await I_USDTieredSTO_Array[_stoID].tiers.call(_tier))[0];
        USDTOKEN = new BN(USDTOKEN);
        if (_currencyFrom == "TOKEN") {
            let tokenToUSD = new BN(_amount)
                .mul(USDTOKEN)
                .div(e18);
            if (_currencyTo == "USD") return tokenToUSD;
            if (_currencyTo == "ETH") {
                return await I_USDTieredSTO_Array[_stoID].convertFromUSD.call(ETH, tokenToUSD, {from: address_zero});
            } else if (_currencyTo == "POLY") {
                return await I_USDTieredSTO_Array[_stoID].convertFromUSD.call(POLY, tokenToUSD, {from: address_zero});
            }
        }
        if (_currencyFrom == "USD") {
            if (_currencyTo == "TOKEN") return _amount.div(USDTOKEN).mul(e18); // USD / USD/TOKEN = TOKEN
            if (_currencyTo == "ETH" || _currencyTo == "POLY")
                return await I_USDTieredSTO_Array[_stoID].convertFromUSD.call(_currencyTo == "ETH" ? ETH : POLY, _amount, {from: address_zero});
        }
        if (_currencyFrom == "ETH" || _currencyFrom == "POLY") {
            let ethToUSD = await I_USDTieredSTO_Array[_stoID].convertToUSD.call(_currencyTo == "ETH" ? ETH : POLY, _amount, {from: address_zero});
            if (_currencyTo == "USD") return ethToUSD;
            if (_currencyTo == "TOKEN") return ethToUSD.div(USDTOKEN).mul(e18); // USD / USD/TOKEN = TOKEN
        }
        return 0;
    }

    let currentTime;

    before(async () => {
        e18 = new BN(10).pow(new BN(18));
        e16 = new BN(10).pow(new BN(16));
        currentTime = new BN(await latestTime());
        REGFEE = new BN(web3.utils.toWei("1000"));
        USDETH = new BN(500).mul(new BN(10).pow(new BN(18))); // 500 USD/ETH
        USDPOLY = new BN(25).mul(new BN(10).pow(new BN(16))); // 0.25 USD/POLY
        POLYMATH = accounts[0];
        ISSUER = accounts[1];
        WALLET = accounts[2];
        TREASURYWALLET = WALLET;
        ACCREDITED1 = accounts[3];
        BENEFICIARY1 = accounts[4];
        NONACCREDITED1 = accounts[5];
        NONACCREDITED2 = accounts[6];
        INVESTOR1 = accounts[7];
        INVESTOR2 = accounts[8];
        INVESTOR3 = accounts[9];


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
            I_STGetter,
            I_STGetter
        ] = instances;

        I_DaiToken = await PolyTokenFaucet.new({from: POLYMATH});
        // STEP 4: Deploy the GeneralDelegateManagerFactory
        [I_GeneralPermissionManagerFactory] = await deployGPMAndVerifyed(POLYMATH, I_MRProxied, 0, new BN(0));

        // STEP 5: Deploy the USDTieredSTOFactory
        [I_USDTieredSTOFactory] = await deployUSDTieredSTOAndVerified(POLYMATH, I_MRProxied, STOSetupCost, new BN(0));
        [P_USDTieredSTOFactory] = await deployUSDTieredSTOAndVerified(POLYMATH, I_MRProxied, new BN(web3.utils.toWei("500")), new BN(0));
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

    describe("Generate the SecurityToken", async () => {
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
            assert.equal(await stGetter.getTreasuryWallet.call(), ISSUER, "Incorrect wallet set")
            const log = (await I_SecurityToken.getPastEvents('ModuleAdded', {filter: {transactionHash: tx.transactionHash}}))[0];

            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._types[0].toString(), TMKEY);
            assert.equal(web3.utils.hexToString(log.args._name), "GeneralTransferManager");
        });

        it("Should initialize the auto attached modules", async () => {
            let moduleData = (await stGetter.getModulesByType(TMKEY))[0];
            I_GeneralTransferManager = await GeneralTransferManager.at(moduleData);
        });
    });

    describe("Test sto deployment", async () => {
        it("Should successfully attach the first STO module to the security token", async () => {
            let stoId = 0; // No discount

            _startTime.push(new BN(currentTime).add(new BN(duration.days(2))).toString());
            _endTime.push(new BN(currentTime).add(new BN(duration.days(2))).add(new BN(duration.days(100))).toString());
            _ratePerTier.push([new BN(10).mul(e16).toString(), new BN(15).mul(e16).toString()]); // [ 0.10 USD/Token, 0.15 USD/Token ]
            _ratePerTierDiscountPoly.push([new BN(10).mul(e16).toString(), new BN(15).mul(e16).toString()]); // [ 0.10 USD/Token, 0.15 USD/Token ]
            _tokensPerTierTotal.push([new BN(100000000).mul(new BN(e18)).toString(), new BN(200000000).mul(new BN(e18)).toString()]); // [ 100m Token, 200m Token ]
            _tokensPerTierDiscountPoly.push([new BN(0).toString(), new BN(0).toString()]); // [ new BN(0), 0 ]
            _nonAccreditedLimitUSD.push(new BN(10000).mul(new BN(e18)).toString()); // 10k USD
            _minimumInvestmentUSD.push(new BN(5).mul(e18).toString()); // 5 USD
            _fundRaiseTypes.push([0, 1, 2]);
            _wallet.push(WALLET);
            _treasuryWallet.push(TREASURYWALLET);
            _usdToken.push([I_DaiToken.address]);
            _customOracleAddresses.push([]);
            _denominatedCurrency.push(web3.utils.toHex(""));

            let config = [
                _startTime[stoId],
                _endTime[stoId],
                _ratePerTier[stoId],
                _ratePerTierDiscountPoly[stoId],
                _tokensPerTierTotal[stoId],
                _tokensPerTierDiscountPoly[stoId],
                _nonAccreditedLimitUSD[stoId],
                _minimumInvestmentUSD[stoId],
                _fundRaiseTypes[stoId],
                _wallet[stoId],
                _treasuryWallet[stoId],
                _usdToken[stoId],
                _customOracleAddresses[stoId],
                _denominatedCurrency[stoId]
            ];

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
                await I_USDTieredSTO_Array[stoId].getTreasuryWallet.call(),
                _treasuryWallet[stoId],
                "Incorrect _treasuryWallet in config"
            );
            assert.equal((await I_USDTieredSTO_Array[stoId].getUsdTokens())[0], _usdToken[stoId][0], "Incorrect _usdToken in config");
            assert.equal(
                await I_USDTieredSTO_Array[stoId].getNumberOfTiers(),
                _tokensPerTierTotal[stoId].length,
                "Incorrect number of tiers"
            );
            assert.equal((await I_USDTieredSTO_Array[stoId].getPermissions()).length, new BN(2), "Incorrect number of permissions");
        });

        it("Should attach the paid STO factory -- failed because of no tokens", async () => {
            let stoId = 0; // No discount
            let config = [
                _startTime[stoId],
                _endTime[stoId],
                _ratePerTier[stoId],
                _ratePerTierDiscountPoly[stoId],
                _tokensPerTierTotal[stoId],
                _tokensPerTierDiscountPoly[stoId],
                _nonAccreditedLimitUSD[stoId],
                _minimumInvestmentUSD[stoId],
                _fundRaiseTypes[stoId],
                _wallet[stoId],
                _treasuryWallet[stoId],
                _usdToken[stoId],
                _customOracleAddresses[stoId],
                _denominatedCurrency[stoId]
            ];

            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            await catchRevert(
                I_SecurityToken.addModule(P_USDTieredSTOFactory.address, bytesSTO, new BN(web3.utils.toWei("2000")), new BN(0), false, {
                    from: ISSUER,
                    gasPrice: GAS_PRICE
                }),
                "Insufficient tokens transferable"
            );
        });

        it("Should attach the paid STO - but will fail to reconfigure", async () => {
            let EURETH = new BN(200).mul(new BN(10).pow(new BN(18))); // 200 EUR/ETH
            let EURPOLY = new BN(2).mul(new BN(10).pow(new BN(15))); // 0.002 EUR/POLY
            let ethOracle = await MockOracle.new(address_zero, web3.utils.fromAscii("ETH"), web3.utils.fromAscii("EUR"), EURETH, { from: POLYMATH });
            let polyOracle = await MockOracle.new(I_PolyToken.address, web3.utils.fromAscii("POLY"), web3.utils.fromAscii("EUR"), EURPOLY, { from: POLYMATH });
            _customOracleAddresses[0] = [ethOracle.address, polyOracle.address];
            _denominatedCurrency[0] = web3.utils.toHex("EUR");
            let snapId = await takeSnapshot();
            let stoId = 0; // No discount
            let config = [
                _startTime[stoId],
                _endTime[stoId],
                _ratePerTier[stoId],
                _ratePerTierDiscountPoly[stoId],
                _tokensPerTierTotal[stoId],
                _tokensPerTierDiscountPoly[stoId],
                _nonAccreditedLimitUSD[stoId],
                _minimumInvestmentUSD[stoId],
                _fundRaiseTypes[stoId],
                _wallet[stoId],
                _treasuryWallet[stoId],
                _usdToken[stoId],
                _customOracleAddresses[stoId],
                _denominatedCurrency[stoId]
            ];

            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            await I_PolyToken.getTokens(new BN(web3.utils.toWei("2000")), I_SecurityToken.address);
            let tx = await I_SecurityToken.addModule(P_USDTieredSTOFactory.address, bytesSTO, new BN(web3.utils.toWei("2000")), new BN(0), false, {
                from: ISSUER,
                gasPrice: GAS_PRICE
            });
            let I_USDTieredSTO_temp = await USDTieredSTO.at(tx.logs[3].args._module);
            assert.equal(await I_USDTieredSTO_temp.getCustomOracleAddress.call(0), ethOracle.address);
            assert.equal(await I_USDTieredSTO_temp.getCustomOracleAddress.call(1), polyOracle.address);
            assert.equal(web3.utils.toUtf8(await I_USDTieredSTO_temp.denominatedCurrency.call()), "EUR");
            await revertToSnapshot(snapId);
        });

        it("Should allow non-matching beneficiary", async () => {
            snapId = await takeSnapshot();
            await I_USDTieredSTO_Array[0].changeAllowBeneficialInvestments(true, { from: ISSUER });
            let allow = await I_USDTieredSTO_Array[0].allowBeneficialInvestments();
            assert.equal(allow, true, "allowBeneficialInvestments should be true");
        });

        it("Should allow non-matching beneficiary -- failed because it is already active", async () => {
            await catchRevert(I_USDTieredSTO_Array[0].changeAllowBeneficialInvestments(true, { from: ISSUER }), "revert");
            await revertToSnapshot(snapId);
        });

        it("Should successfully call the modifyTimes before starting the STO -- fail because of bad owner", async () => {
            await catchRevert(
                I_USDTieredSTO_Array[0].modifyTimes(new BN(currentTime).add(new BN(duration.days(15))), new BN(currentTime).add(new BN(duration.days(55))), { from: POLYMATH }),
                "Invalid permission"
            );
        });

        it("Should successfully call the modifyTimes before starting the STO", async () => {
            let snapId = await takeSnapshot();
            let _startTime = new BN(currentTime).add(new BN(duration.days(15)));
            let _endTime = new BN(currentTime).add(new BN(duration.days(55)));
            await I_USDTieredSTO_Array[0].modifyTimes(_startTime, _endTime, { from: ISSUER });
            assert.equal((await I_USDTieredSTO_Array[0].startTime.call()).toString(), _startTime.toString(), "Incorrect _startTime in config");
            assert.equal((await I_USDTieredSTO_Array[0].endTime.call()).toString(), _endTime.toString(), "Incorrect _endTime in config");
            await revertToSnapshot(snapId);
        });

        it("Should successfully attach the second STO module to the security token", async () => {
            let stoId = 1; // No discount

            _startTime.push(new BN(currentTime).add(new BN(duration.days(2))).toString());
            _endTime.push(new BN(currentTime).add(new BN(duration.days(2))).add(new BN(currentTime).add(new BN(duration.days(100)))).toString());
            _ratePerTier.push([
                new BN(10).mul(e16).toString(),
                new BN(15).mul(e16).toString(),
                new BN(15).mul(e16).toString(),
                new BN(15).mul(e16).toString(),
                new BN(15).mul(e16).toString(),
                new BN(15).mul(e16).toString()
            ]);
            _ratePerTierDiscountPoly.push([
                new BN(10).mul(e16).toString(),
                new BN(15).mul(e16).toString(),
                new BN(15).mul(e16).toString(),
                new BN(15).mul(e16).toString(),
                new BN(15).mul(e16).toString(),
                new BN(15).mul(e16).toString()
            ]);
            _tokensPerTierTotal.push([
                new BN(5).mul(e18).toString(),
                new BN(10).mul(e18).toString(),
                new BN(10).mul(e18).toString(),
                new BN(10).mul(e18).toString(),
                new BN(10).mul(e18).toString(),
                new BN(50).mul(e18).toString()
            ]);
            _tokensPerTierDiscountPoly.push([new BN(0).toString(), new BN(0).toString(), new BN(0).toString(), new BN(0).toString(), new BN(0).toString(), new BN(0).toString()]);
            _nonAccreditedLimitUSD.push(new BN(10000).mul(new BN(e18)).toString());
            _minimumInvestmentUSD.push(new BN(0).toString());
            _fundRaiseTypes.push([0, 1, 2]);
            _wallet.push(WALLET);
            _treasuryWallet.push(TREASURYWALLET);
            _usdToken.push([I_DaiToken.address]);
            _customOracleAddresses.push([]);
            _denominatedCurrency.push("0x0");

            let config = [
                _startTime[stoId],
                _endTime[stoId],
                _ratePerTier[stoId],
                _ratePerTierDiscountPoly[stoId],
                _tokensPerTierTotal[stoId],
                _tokensPerTierDiscountPoly[stoId],
                _nonAccreditedLimitUSD[stoId],
                _minimumInvestmentUSD[stoId],
                _fundRaiseTypes[stoId],
                _wallet[stoId],
                _treasuryWallet[stoId],
                _usdToken[stoId],
                _customOracleAddresses[stoId],
                _denominatedCurrency[stoId]
            ];

            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            let tx = await I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, new BN(0), new BN(0), false, { from: ISSUER, gasPrice: GAS_PRICE });
            console.log("          Gas addModule: ".grey + tx.receipt.gasUsed.toString().grey);
            assert.equal(tx.logs[2].args._types[0], STOKEY, "USDTieredSTO doesn't get deployed");
            assert.equal(web3.utils.hexToString(tx.logs[2].args._name), "USDTieredSTO", "USDTieredSTO module was not added");
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
                await I_USDTieredSTO_Array[stoId].getTreasuryWallet.call(),
                _treasuryWallet[stoId],
                "Incorrect _treasuryWallet in config"
            );
            assert.equal((await I_USDTieredSTO_Array[stoId].getUsdTokens())[0], _usdToken[stoId][0], "Incorrect _usdToken in config");
            assert.equal(
                await I_USDTieredSTO_Array[stoId].getNumberOfTiers(),
                _tokensPerTierTotal[stoId].length,
                "Incorrect number of tiers"
            );
            assert.equal((await I_USDTieredSTO_Array[stoId].getPermissions()).length, new BN(2), "Incorrect number of permissions");
            assert.equal(await I_USDTieredSTO_Array[stoId].getCustomOracleAddress.call(0), address_zero);
            assert.equal(await I_USDTieredSTO_Array[stoId].getCustomOracleAddress.call(1), address_zero);
            assert.equal(web3.utils.toUtf8(await I_USDTieredSTO_Array[stoId].denominatedCurrency.call()), "USD");
        });

        it("Should successfully attach the third STO module to the security token", async () => {
            let stoId = 2; // Poly discount
            _startTime.push(new BN(currentTime).add(new BN(duration.days(2))).toString());
            _endTime.push(new BN(currentTime).add(new BN(duration.days(2))).add(new BN(currentTime).add(new BN(duration.days(100)))).toString());
            _ratePerTier.push([new BN(1).mul(e18).toString(), new BN(150).mul(e16).toString()]); // [ 1 USD/Token, 1.5 USD/Token ]
            _ratePerTierDiscountPoly.push([new BN(50).mul(e16).toString(), new BN(1).mul(e18).toString()]); // [ 0.5 USD/Token, 1.5 USD/Token ]
            _tokensPerTierTotal.push([new BN(100).mul(e18).toString(), new BN(50).mul(e18).toString()]); // [ 100 Token, 50 Token ]
            _tokensPerTierDiscountPoly.push([new BN(100).mul(e18).toString(), new BN(25).mul(e18).toString()]); // [ 100 Token, 25 Token ]
            _nonAccreditedLimitUSD.push(new BN(25).mul(e18).toString()); // [ 25 USD ]
            _minimumInvestmentUSD.push(new BN(5).toString());
            _fundRaiseTypes.push([0, 1, 2]);
            _wallet.push(WALLET);
            _treasuryWallet.push(TREASURYWALLET);
            _usdToken.push([I_DaiToken.address]);
            _customOracleAddresses.push([]);
            _denominatedCurrency.push("0x0");
            let config = [
                _startTime[stoId],
                _endTime[stoId],
                _ratePerTier[stoId],
                _ratePerTierDiscountPoly[stoId],
                _tokensPerTierTotal[stoId],
                _tokensPerTierDiscountPoly[stoId],
                _nonAccreditedLimitUSD[stoId],
                _minimumInvestmentUSD[stoId],
                _fundRaiseTypes[stoId],
                _wallet[stoId],
                _treasuryWallet[stoId],
                _usdToken[stoId],
                _customOracleAddresses[stoId],
                _denominatedCurrency[stoId]
            ];
            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            let tx = await I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, new BN(0), new BN(0), false, { from: ISSUER, gasPrice: GAS_PRICE });
            console.log("          Gas addModule: ".grey + tx.receipt.gasUsed.toString().grey);
            assert.equal(tx.logs[2].args._types[0], STOKEY, "USDTieredSTO doesn't get deployed");
            assert.equal(web3.utils.hexToString(tx.logs[2].args._name), "USDTieredSTO", "USDTieredSTOFactory module was not added");
            I_USDTieredSTO_Array.push(await USDTieredSTO.at(tx.logs[2].args._module));
        });

        it("Should successfully attach the fourth STO module to the security token", async () => {
            let stoId = 3;

            _startTime.push(new BN(currentTime).add(new BN(duration.days(0.1))).toString());
            _endTime.push(new BN(currentTime).add(new BN(duration.days(0.1))).add(new BN(currentTime).add(new BN(duration.days(0.1)))).toString());
            _ratePerTier.push([new BN(10).mul(e16).toString(), new BN(15).mul(e16).toString()]);
            _ratePerTierDiscountPoly.push([new BN(10).mul(e16).toString(), new BN(12).mul(e16).toString()]);
            _tokensPerTierTotal.push([new BN(100).mul(e18).toString(), new BN(200).mul(e18).toString()]);
            _tokensPerTierDiscountPoly.push([new BN(0).toString(), new BN(50).mul(e18).toString()]);
            _nonAccreditedLimitUSD.push(new BN(10000).mul(new BN(e18)).toString());
            _minimumInvestmentUSD.push(new BN(0).toString());
            _fundRaiseTypes.push([0, 1, 2]);
            _wallet.push(WALLET);
            _treasuryWallet.push(TREASURYWALLET);
            _usdToken.push([I_DaiToken.address]);
            _customOracleAddresses.push([]);
            _denominatedCurrency.push("0x0");

            let config = [
                _startTime[stoId],
                _endTime[stoId],
                _ratePerTier[stoId],
                _ratePerTierDiscountPoly[stoId],
                _tokensPerTierTotal[stoId],
                _tokensPerTierDiscountPoly[stoId],
                _nonAccreditedLimitUSD[stoId],
                _minimumInvestmentUSD[stoId],
                _fundRaiseTypes[stoId],
                _wallet[stoId],
                _treasuryWallet[stoId],
                _usdToken[stoId],
                _customOracleAddresses[stoId],
                _denominatedCurrency[stoId]
            ];

            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            let tx = await I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, new BN(0), new BN(0), false, { from: ISSUER, gasPrice: GAS_PRICE });
            console.log("          Gas addModule: ".grey + tx.receipt.gasUsed.toString().grey);
            assert.equal(tx.logs[2].args._types[0], STOKEY, "USDTieredSTO doesn't get deployed");
            assert.equal(web3.utils.hexToString(tx.logs[2].args._name), "USDTieredSTO", "USDTieredSTOFactory module was not added");
            I_USDTieredSTO_Array.push(await USDTieredSTO.at(tx.logs[2].args._module));
        });

        it("Should successfully attach the fifth STO module to the security token", async () => {
            let stoId = 4; // Non-divisible tokens

            _startTime.push(new BN(currentTime).add(new BN(duration.days(2))).toString());
            _endTime.push(new BN(currentTime).add(new BN(duration.days(2))).add(new BN(currentTime).add(new BN(duration.days(100)))).toString());
            _ratePerTier.push([new BN(1).mul(e18).toString(), new BN(150).mul(e16).toString()]); // [ 1 USD/Token, 1.5 USD/Token ]
            _ratePerTierDiscountPoly.push([new BN(50).mul(e16).toString(), new BN(1).mul(e18).toString()]); // [ 0.5 USD/Token, 1.5 USD/Token ]
            _tokensPerTierTotal.push([new BN(100).mul(e18).toString(), new BN(50).mul(e18).toString()]); // [ 100 Token, 50 Token ]
            _tokensPerTierDiscountPoly.push([new BN(100).mul(e18).toString(), new BN(25).mul(e18).toString()]); // [ 100 Token, 25 Token ]
            _nonAccreditedLimitUSD.push(new BN(25).mul(e18).toString()); // [ 25 USD ]
            _minimumInvestmentUSD.push(new BN(5).toString());
            _fundRaiseTypes.push([0, 1, 2]);
            _wallet.push(WALLET);
            _treasuryWallet.push(TREASURYWALLET);
            _usdToken.push([I_DaiToken.address]);
            _customOracleAddresses.push([]);
            _denominatedCurrency.push("0x0");

            let config = [
                _startTime[stoId],
                _endTime[stoId],
                _ratePerTier[stoId],
                _ratePerTierDiscountPoly[stoId],
                _tokensPerTierTotal[stoId],
                _tokensPerTierDiscountPoly[stoId],
                _nonAccreditedLimitUSD[stoId],
                _minimumInvestmentUSD[stoId],
                _fundRaiseTypes[stoId],
                _wallet[stoId],
                _treasuryWallet[stoId],
                _usdToken[stoId],
                _customOracleAddresses[stoId],
                _denominatedCurrency[stoId]
            ];

            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            let tx = await I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, 0, 0, false, { from: ISSUER, gasPrice: GAS_PRICE });
            console.log("          Gas addModule: ".grey + tx.receipt.gasUsed.toString().grey);
            assert.equal(tx.logs[2].args._types[0], STOKEY, "USDTieredSTO doesn't get deployed");
            assert.equal(web3.utils.hexToString(tx.logs[2].args._name), "USDTieredSTO", "USDTieredSTOFactory module was not added");
            I_USDTieredSTO_Array.push(await USDTieredSTO.at(tx.logs[2].args._module));
            // console.log(I_USDTieredSTO_Array[I_USDTieredSTO_Array.length - 1]);
            let tokens = await I_USDTieredSTO_Array[I_USDTieredSTO_Array.length - 1].getUsdTokens.call();
            assert.equal(tokens[0], I_DaiToken.address, "USD Tokens should match");
        });

        it("Should successfully attach the sixth STO module to the security token", async () => {
            let stoId = 5; // Non-divisible token with invalid tier

            _startTime.push(new BN(currentTime).add(new BN(duration.days(2))).toString());
            _endTime.push(new BN(currentTime).add(new BN(duration.days(2))).add(new BN(currentTime).add(new BN(duration.days(100)))).toString());
            _ratePerTier.push([new BN(1).mul(e18).toString(), new BN(1).mul(e18).toString()]); // [ 1 USD/Token, 1 USD/Token ]
            _ratePerTierDiscountPoly.push([new BN(1).mul(e18).toString(), new BN(1).mul(e18).toString()]); // [ 1 USD/Token, 1 USD/Token ]
            _tokensPerTierTotal.push([new BN(10010).mul(e16).toString(), new BN(50).mul(e18).toString()]); // [ 100.1 Token, 50 Token ]
            _tokensPerTierDiscountPoly.push([new BN(0).toString(), new BN(0).toString()]); // [ 0 Token, 0 Token ]
            _nonAccreditedLimitUSD.push(new BN(25).mul(e18).toString()); // [ 25 USD ]
            _minimumInvestmentUSD.push(new BN(5).toString());
            _fundRaiseTypes.push([0, 1, 2]);
            _wallet.push(WALLET);
            _treasuryWallet.push(TREASURYWALLET);
            _usdToken.push([I_DaiToken.address]);
            _customOracleAddresses.push([]);
            _denominatedCurrency.push("0x0");

            let config = [
                _startTime[stoId],
                _endTime[stoId],
                _ratePerTier[stoId],
                _ratePerTierDiscountPoly[stoId],
                _tokensPerTierTotal[stoId],
                _tokensPerTierDiscountPoly[stoId],
                _nonAccreditedLimitUSD[stoId],
                _minimumInvestmentUSD[stoId],
                _fundRaiseTypes[stoId],
                _wallet[stoId],
                _treasuryWallet[stoId],
                _usdToken[stoId],
                _customOracleAddresses[stoId],
                _denominatedCurrency[stoId]
            ];

            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            let tx = await I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, 0, 0, false, { from: ISSUER, gasPrice: GAS_PRICE });
            console.log("          Gas addModule: ".grey + tx.receipt.gasUsed.toString().grey);
            assert.equal(tx.logs[2].args._types[0], STOKEY, "USDTieredSTO doesn't get deployed");
            assert.equal(web3.utils.hexToString(tx.logs[2].args._name), "USDTieredSTO", "USDTieredSTOFactory module was not added");
            I_USDTieredSTO_Array.push(await USDTieredSTO.at(tx.logs[2].args._module));
            // console.log(I_USDTieredSTO_Array[I_USDTieredSTO_Array.length - 1]);
            let tokens = await I_USDTieredSTO_Array[I_USDTieredSTO_Array.length - 1].getUsdTokens.call();
            assert.equal(tokens[0], I_DaiToken.address, "USD Tokens should match");
        });

        it("Should successfully an STO that accepts funds in USD only.", async () => {
            let stoId = STOs.usdRaiseOnly;

            _startTime.push(new BN(currentTime).add(new BN(duration.days(2))).toString());
            _endTime.push(new BN(currentTime).add(new BN(duration.days(2))).add(new BN(currentTime).add(new BN(duration.days(100)))).toString());
            _ratePerTier.push([new BN(1).mul(e18).toString(), new BN(1).mul(e18).toString()]); // [ 1 USD/Token, 1 USD/Token ]
            _ratePerTierDiscountPoly.push([new BN(1).mul(e18).toString(), new BN(1).mul(e18).toString()]); // [ 1 USD/Token, 1 USD/Token ]
            _tokensPerTierTotal.push([new BN(10010).mul(e16).toString(), new BN(50).mul(e18).toString()]); // [ 100.1 Token, 50 Token ]
            _tokensPerTierDiscountPoly.push([new BN(0).toString(), new BN(0).toString()]); // [ 0 Token, 0 Token ]
            _nonAccreditedLimitUSD.push(new BN(25).mul(e18).toString()); // [ 25 USD ]
            _minimumInvestmentUSD.push(new BN(5).toString());
            _customOracleAddresses.push([]);
            _denominatedCurrency.push("0x0");
            /**
             * USD only.
             */
            _fundRaiseTypes.push([2]);

            _wallet.push(WALLET);
            _treasuryWallet.push(TREASURYWALLET);
            _usdToken.push([I_DaiToken.address]);

            let config = [
                _startTime[stoId],
                _endTime[stoId],
                _ratePerTier[stoId],
                _ratePerTierDiscountPoly[stoId],
                _tokensPerTierTotal[stoId],
                _tokensPerTierDiscountPoly[stoId],
                _nonAccreditedLimitUSD[stoId],
                _minimumInvestmentUSD[stoId],
                _fundRaiseTypes[stoId],
                _wallet[stoId],
                _treasuryWallet[stoId],
                _usdToken[stoId],
                _customOracleAddresses[stoId],
                _denominatedCurrency[stoId]
            ];

            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            let tx = await I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, 0, 0, false, { from: ISSUER, gasPrice: GAS_PRICE });
            console.log("          Gas addModule: ".grey + tx.receipt.gasUsed.toString().grey);
            assert.equal(tx.logs[2].args._types[0], STOKEY, "USDTieredSTO doesn't get deployed");
            assert.equal(web3.utils.hexToString(tx.logs[2].args._name), "USDTieredSTO", "USDTieredSTOFactory module was not added");
            I_USDTieredSTO_Array.push(await USDTieredSTO.at(tx.logs[2].args._module));
            // console.log(I_USDTieredSTO_Array[I_USDTieredSTO_Array.length - 1]);
            let tokens = await I_USDTieredSTO_Array[I_USDTieredSTO_Array.length - 1].getUsdTokens.call();
            assert.equal(tokens[0], I_DaiToken.address, "USD Tokens should match");
        });

        it("Should fail because rates and tier array of different length", async () => {
            let stoId = 0;

            let ratePerTier = [10];
            let ratePerTierDiscountPoly = [10];
            let tokensPerTierTotal = [10];
            let tokensPerTierDiscountPoly = [10];
            let config = [
                [
                    _startTime[stoId],
                    _endTime[stoId],
                    ratePerTier,
                    _ratePerTierDiscountPoly[stoId],
                    _tokensPerTierTotal[stoId],
                    _tokensPerTierDiscountPoly[stoId],
                    _nonAccreditedLimitUSD[stoId],
                    _minimumInvestmentUSD[stoId],
                    _fundRaiseTypes[stoId],
                    _wallet[stoId],
                    _treasuryWallet[stoId],
                    _usdToken[stoId],
                    _customOracleAddresses[stoId],
                    _denominatedCurrency[stoId]
                ],
                [
                    _startTime[stoId],
                    _endTime[stoId],
                    _ratePerTier[stoId],
                    ratePerTierDiscountPoly,
                    _tokensPerTierTotal[stoId],
                    _tokensPerTierDiscountPoly[stoId],
                    _nonAccreditedLimitUSD[stoId],
                    _minimumInvestmentUSD[stoId],
                    _fundRaiseTypes[stoId],
                    _wallet[stoId],
                    _treasuryWallet[stoId],
                    _usdToken[stoId],
                    _customOracleAddresses[stoId],
                    _denominatedCurrency[stoId]
                ],
                [
                    _startTime[stoId],
                    _endTime[stoId],
                    _ratePerTier[stoId],
                    _ratePerTierDiscountPoly[stoId],
                    tokensPerTierTotal,
                    _tokensPerTierDiscountPoly[stoId],
                    _nonAccreditedLimitUSD[stoId],
                    _minimumInvestmentUSD[stoId],
                    _fundRaiseTypes[stoId],
                    _wallet[stoId],
                    _treasuryWallet[stoId],
                    _usdToken[stoId],
                    _customOracleAddresses[stoId],
                    _denominatedCurrency[stoId]
                ],
                [
                    _startTime[stoId],
                    _endTime[stoId],
                    _ratePerTier[stoId],
                    _ratePerTierDiscountPoly[stoId],
                    _tokensPerTierTotal[stoId],
                    tokensPerTierDiscountPoly,
                    _nonAccreditedLimitUSD[stoId],
                    _minimumInvestmentUSD[stoId],
                    _fundRaiseTypes[stoId],
                    _wallet[stoId],
                    _treasuryWallet[stoId],
                    _usdToken[stoId],
                    _customOracleAddresses[stoId],
                    _denominatedCurrency[stoId]
                ]
            ];
            for (var i = 0; i < config.length; i++) {
                let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config[i]);

                await catchRevert(I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, new BN(0), new BN(0), false, { from: ISSUER }),
                    "Unsuccessful initialization");
            }
        });

        it("Should fail because rate of token should be greater than 0", async () => {
            let stoId = 0;

            let ratePerTier = [new BN(10).mul(e16).toString(), new BN(0).toString()];
            let config = [
                _startTime[stoId],
                _endTime[stoId],
                ratePerTier,
                _ratePerTierDiscountPoly[stoId],
                _tokensPerTierTotal[stoId],
                _tokensPerTierDiscountPoly[stoId],
                _nonAccreditedLimitUSD[stoId],
                _minimumInvestmentUSD[stoId],
                _fundRaiseTypes[stoId],
                _wallet[stoId],
                _treasuryWallet[stoId],
                _usdToken[stoId],
                _customOracleAddresses[stoId],
                _denominatedCurrency[stoId]
            ];
            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);

            await catchRevert(I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, new BN(0), new BN(0), false, { from: ISSUER }),
                "Unsuccessful initialization");
        });

        it("Should fail because Zero address is not permitted for wallet", async () => {
            let stoId = 0;

            let wallet = address_zero;
            let config = [
                _startTime[stoId],
                _endTime[stoId],
                _ratePerTier[stoId],
                _ratePerTierDiscountPoly[stoId],
                _tokensPerTierTotal[stoId],
                _tokensPerTierDiscountPoly[stoId],
                _nonAccreditedLimitUSD[stoId],
                _minimumInvestmentUSD[stoId],
                _fundRaiseTypes[stoId],
                wallet,
                _treasuryWallet[stoId],
                _usdToken[stoId],
                _customOracleAddresses[stoId],
                _denominatedCurrency[stoId]
            ];
            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);

            await catchRevert(I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, new BN(0), new BN(0), false, { from: ISSUER }),
                "Unsuccessful initialization");
        });

        it("Should fail because end time before start time", async () => {
            let stoId = 0;

            let startTime = await latestTime() + duration.days(35);
            let endTime = await latestTime() + duration.days(1);
            let config = [
                startTime,
                endTime,
                _ratePerTier[stoId],
                _ratePerTierDiscountPoly[stoId],
                _tokensPerTierTotal[stoId],
                _tokensPerTierDiscountPoly[stoId],
                _nonAccreditedLimitUSD[stoId],
                _minimumInvestmentUSD[stoId],
                _fundRaiseTypes[stoId],
                _wallet[stoId],
                _treasuryWallet[stoId],
                _usdToken[stoId],
                _customOracleAddresses[stoId],
                _denominatedCurrency[stoId]
            ];
            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);

            await catchRevert(I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, new BN(0), new BN(0), false, { from: ISSUER }),
                "Unsuccessful initialization");
        });

        it("Should fail because start time is in the past", async () => {
            let stoId = 0;

            let startTime = await latestTime() - duration.days(35);
            let endTime = startTime + duration.days(50);
            let config = [
                startTime,
                endTime,
                _ratePerTier[stoId],
                _ratePerTierDiscountPoly[stoId],
                _tokensPerTierTotal[stoId],
                _tokensPerTierDiscountPoly[stoId],
                _nonAccreditedLimitUSD[stoId],
                _minimumInvestmentUSD[stoId],
                _fundRaiseTypes[stoId],
                _wallet[stoId],
                _treasuryWallet[stoId],
                _usdToken[stoId],
                _customOracleAddresses[stoId],
                _denominatedCurrency[stoId]
            ];
            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);

            await catchRevert(I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, new BN(0), new BN(0), false, { from: ISSUER }),
                "Unsuccessful initialization");
        });
    });

    describe("Test modifying configuration", async () => {
        it("Should not allow unauthorized address to change oracle address", async () => {
            let stoId = 3;
            await catchRevert(I_USDTieredSTO_Array[stoId].modifyOracles([], "0x0", { from: ACCREDITED1 }), "revert Sender is not owner");
        });

        it("Should fail to change oracle address because of Invalid length of oracles addresses", async () => {
            let stoId = 3;
            let I_EUROracle = await MockOracle.new(address_zero, web3.utils.fromAscii("ETH"), web3.utils.fromAscii("EUR"), e18, { from: POLYMATH });
            await catchRevert(I_USDTieredSTO_Array[stoId].modifyOracles([I_EUROracle.address], web3.utils.fromAscii("EUR"), { from: ISSUER }), "Invalid no. of oracles");
        });

        it("Should allow to change oracle address for ETH", async () => {
            let stoId = 3;
            oldEthRate = await I_USDTieredSTO_Array[stoId].getRate.call(ETH, {from: address_zero});
            oldPolyRate = await I_USDTieredSTO_Array[stoId].getRate.call(POLY, {from: address_zero});
            let I_USDOracle2 = await MockOracle.new(address_zero, web3.utils.fromAscii("ETH"), web3.utils.fromAscii("USD"), e18, { from: POLYMATH });
            await I_USDTieredSTO_Array[stoId].modifyOracles([I_USDOracle2.address, I_POLYOracle.address], web3.utils.fromAscii("USD"), { from: ISSUER });
            assert.equal((await I_USDTieredSTO_Array[stoId].getRate.call(ETH, {from: address_zero})).toString(), e18.toString());
        });

        it("Should allow to change oracle address for POLY", async () => {
            let stoId = 3;
            let I_POLYOracle2 = await MockOracle.new(I_PolyToken.address, web3.utils.fromAscii("POLY"), web3.utils.fromAscii("USD"), e18, { from: POLYMATH });
            let ethOraclesAddress = await I_USDTieredSTO_Array[stoId].getCustomOracleAddress.call(ETH);
            await I_USDTieredSTO_Array[stoId].modifyOracles([ethOraclesAddress, I_POLYOracle2.address], web3.utils.fromAscii("USD"), { from: ISSUER });
            assert.equal((await I_USDTieredSTO_Array[stoId].getRate.call(POLY, {from: address_zero})).toString(), e18.toString());
            assert.equal(
                await I_USDTieredSTO_Array[stoId].getCustomOracleAddress.call(ETH),
                ethOraclesAddress
            );
            assert.equal(
                await I_USDTieredSTO_Array[stoId].getCustomOracleAddress.call(POLY),
                I_POLYOracle2.address
            );
        });

        it("Should use official oracles when custom oracle is set to 0x0", async () => {
            let stoId = 3;
            await I_USDTieredSTO_Array[stoId].modifyOracles([], "0x0", { from: ISSUER });
            assert.equal((await I_USDTieredSTO_Array[stoId].getRate.call(ETH, {from: address_zero})).toString(), oldEthRate.toString());
            assert.equal((await I_USDTieredSTO_Array[stoId].getRate.call(POLY, {from: address_zero})).toString(), oldPolyRate.toString());
        });

        it.skip("Should fail to retrieve oracle rate if fundRaiseTypes is unrecognised", async () => {
            let stoId = 3;
            await catchRevert(I_USDTieredSTO_Array[stoId].getRate.call(5, {from: address_zero}), "revert");
        });

        it("Should successfully change config before startTime - funding", async () => {
            let stoId = 3;
            await I_USDTieredSTO_Array[stoId].modifyFunding([0], { from: ISSUER });
            assert.equal(await I_USDTieredSTO_Array[stoId].fundRaiseTypes.call(0), true, "STO Configuration doesn't set as expected");
            assert.equal(await I_USDTieredSTO_Array[stoId].fundRaiseTypes.call(1), false, "STO Configuration doesn't set as expected");

            await I_USDTieredSTO_Array[stoId].modifyFunding([1], { from: ISSUER });
            assert.equal(await I_USDTieredSTO_Array[stoId].fundRaiseTypes.call(0), false, "STO Configuration doesn't set as expected");
            assert.equal(await I_USDTieredSTO_Array[stoId].fundRaiseTypes.call(1), true, "STO Configuration doesn't set as expected");

            await I_USDTieredSTO_Array[stoId].modifyFunding([0, 1, 2], { from: ISSUER });
            assert.equal(await I_USDTieredSTO_Array[stoId].fundRaiseTypes.call(0), true, "STO Configuration doesn't set as expected");
            assert.equal(await I_USDTieredSTO_Array[stoId].fundRaiseTypes.call(1), true, "STO Configuration doesn't set as expected");
        });

        it("Should successfully change config before startTime - limits and tiers, times, addresses", async () => {
            let stoId = 3;

            await I_USDTieredSTO_Array[stoId].modifyLimits(new BN(1).mul(e18), new BN(15).mul(e18), { from: ISSUER });
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].minimumInvestmentUSD.call()).toString(),
                new BN(15).mul(e18).toString(),
                "STO Configuration doesn't set as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].nonAccreditedLimitUSD.call()).toString(),
                new BN(1).mul(e18).toString(),
                "STO Configuration doesn't set as expected"
            );
            await I_USDTieredSTO_Array[stoId].modifyTiers(
                [new BN(15).mul(e18)],
                [new BN(13).mul(e18)],
                [new BN(1500).mul(e18)],
                [new BN(1500).mul(e18)],
                { from: ISSUER }
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].tiers.call(0))[0].toString(),
                new BN(15).mul(e18).toString(),
                "STO Configuration doesn't set as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].tiers.call(0))[1].toString(),
                new BN(13).mul(e18).toString(),
                "STO Configuration doesn't set as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].tiers.call(0))[2].toString(),
                new BN(1500).mul(e18).toString(),
                "STO Configuration doesn't set as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].tiers.call(0))[3].toString(),
                new BN(1500).mul(e18).toString(),
                "STO Configuration doesn't set as expected"
            );

            let tempTime1 = new BN(currentTime).add(new BN(duration.days(0.1)));
            let tempTime2 = new BN(currentTime).add(new BN(duration.days(0.2)));

            await I_USDTieredSTO_Array[stoId].modifyTimes(new BN(tempTime1), new BN(tempTime2), { from: ISSUER });
            assert.equal((await I_USDTieredSTO_Array[stoId].startTime.call()).toString(), tempTime1.toString(), "STO Configuration doesn't set as expected");
            assert.equal((await I_USDTieredSTO_Array[stoId].endTime.call()).toString(), tempTime2.toString(), "STO Configuration doesn't set as expected");

            await I_USDTieredSTO_Array[stoId].modifyAddresses(
                "0x0000000000000000000000000400000000000000",
                "0x0000000000000000000000000000000000000000",
                [accounts[3]],
                { from: ISSUER }
            );
            assert.equal(
                await I_USDTieredSTO_Array[stoId].wallet.call(),
                "0x0000000000000000000000000400000000000000",
                "STO Configuration doesn't set as expected"
            );
            assert.equal(
                await I_USDTieredSTO_Array[stoId].getTreasuryWallet.call(),
                ISSUER,
                "STO Configuration doesn't set as expected"
            );
            await I_USDTieredSTO_Array[stoId].modifyAddresses(
                "0x0000000000000000000000000400000000000000",
                TREASURYWALLET,
                [accounts[3]],
                { from: ISSUER }
            );
            assert.equal((await I_USDTieredSTO_Array[stoId].getUsdTokens())[0], accounts[3], "STO Configuration doesn't set as expected");
            await I_USDTieredSTO_Array[stoId].modifyAddresses(
                "0x0000000000000000000000000400000000000000",
                TREASURYWALLET,
                [I_DaiToken.address],
                { from: ISSUER }
            );
        });

        it("Should fail to set USD token address to 0x0", async () => {
            let stoId = 3;

            await catchRevert(I_USDTieredSTO_Array[stoId].modifyAddresses(
                "0x0000000000000000000000000400000000000000",
                TREASURYWALLET,
                [address_zero],
                { from: ISSUER }
            ), "Invalid USD token");
        });

        it("Should fail to set USD token address to Poly token address", async () => {
            let stoId = 3;

            await catchRevert(I_USDTieredSTO_Array[stoId].modifyAddresses(
                "0x0000000000000000000000000400000000000000",
                TREASURYWALLET,
                [I_PolyToken.address],
                { from: ISSUER }
            ), "Invalid USD token");
        });

        it("Should fail to configure too many discounted tokens", async () => {
            let stoId = 3;

            await catchRevert(I_USDTieredSTO_Array[stoId].modifyTiers(
                [new BN(15).mul(e18)],
                [new BN(13).mul(e18)],
                [new BN(900).mul(e18)],
                [new BN(1500).mul(e18)],
                { from: ISSUER }
            ), "Too many discounted tokens");
        });

        it("Should prevent invalid discount", async () => {
            let stoId = 3;

            await catchRevert(I_USDTieredSTO_Array[stoId].modifyTiers(
                [new BN(15).mul(e18)],
                [new BN(130).mul(e18)],
                [new BN(1500).mul(e18)],
                [new BN(1500).mul(e18)],
                { from: ISSUER }
            ), "Invalid discount");
        });

        it("Should fail to change config after endTime", async () => {
            let stoId = 3;

            let snapId = await takeSnapshot();
            await increaseTime(duration.days(1));

            await catchRevert(I_USDTieredSTO_Array[stoId].modifyFunding([0, 1], { from: ISSUER }), "Already started");

            await catchRevert(I_USDTieredSTO_Array[stoId].modifyLimits(new BN(15).mul(e18), new BN(1).mul(e18), { from: ISSUER }), "Already started");

            await catchRevert(
                I_USDTieredSTO_Array[stoId].modifyTiers(
                    [new BN(15).mul(e18)],
                    [new BN(13).mul(e18)],
                    [new BN(1500).mul(e18)],
                    [new BN(1500).mul(e18)],
                    { from: ISSUER }
                ),
                "Already started"
            );

            let tempTime1 = await latestTime() + duration.days(1);
            let tempTime2 = await latestTime() + duration.days(3);

            await catchRevert(I_USDTieredSTO_Array[stoId].modifyTimes(tempTime1, tempTime2, { from: ISSUER }), "Already started");

            await revertToSnapshot(snapId);
        });
    });

    describe("Test buying failure conditions", async () => {
        it("should fail if before STO start time", async () => {
            let stoId = 0;
            let snapId = await takeSnapshot();

            assert.equal(await I_USDTieredSTO_Array[stoId].isOpen(), false, "STO is not showing correct status");

            // Whitelist
            let fromTime = await latestTime();
            let toTime = await latestTime() + duration.days(15);
            let expiryTime = toTime + duration.days(100);
            let whitelisted = true;

            await I_GeneralTransferManager.modifyKYCData(ACCREDITED1, fromTime, toTime, expiryTime, { from: ISSUER });
            await I_GeneralTransferManager.modifyInvestorFlag(ACCREDITED1, 0, true, { from: ISSUER }); //set as Accredited
            await I_GeneralTransferManager.modifyKYCData(NONACCREDITED1, fromTime, toTime, expiryTime, { from: ISSUER });

            // // Advance time to after STO start
            // await increaseTime(duration.days(3));

            // Prep for investments
            let investment_ETH = new BN(web3.utils.toWei("1", "ether")); // Invest 1 ETH
            let investment_POLY = new BN(web3.utils.toWei("10000", "ether")); // Invest 10000 POLY
            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: NONACCREDITED1 });
            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: ACCREDITED1 });
            let investment_DAI = new BN(web3.utils.toWei("500", "ether")); // Invest 10000 POLY
            await I_DaiToken.getTokens(investment_DAI, NONACCREDITED1);
            await I_DaiToken.approve(I_USDTieredSTO_Array[stoId].address, investment_DAI, { from: NONACCREDITED1 });
            await I_DaiToken.getTokens(investment_DAI, ACCREDITED1);
            await I_DaiToken.approve(I_USDTieredSTO_Array[stoId].address, investment_DAI, { from: ACCREDITED1 });
            // NONACCREDITED ETH
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, value: investment_ETH }), "STO not open");
            // NONACCREDITED POLY
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, { from: NONACCREDITED1 }), "STO not open");
            // NONACCREDITED DAI
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithUSD(NONACCREDITED1, investment_DAI, I_DaiToken.address, { from: NONACCREDITED1 }), "STO not open");
            // ACCREDITED ETH
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithETH(ACCREDITED1, { from: ACCREDITED1, value: investment_ETH }), "STO not open");
            // ACCREDITED POLY
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, { from: ACCREDITED1 }), "STO not open");
            // ACCREDITED DAI
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithUSD(ACCREDITED1, investment_DAI, I_DaiToken.address, { from: ACCREDITED1 }), "STO not open");
            await revertToSnapshot(snapId);
        });

        it("should fail if not whitelisted", async () => {
            let stoId = 0;
            let snapId = await takeSnapshot();

            // // Whitelist
            // let fromTime = await latestTime();
            // let toTime = await latestTime() + duration.days(15);
            // let expiryTime = toTime + duration.days(100);
            // let whitelisted = true;
            //
            // await I_GeneralTransferManager.modifyKYCData(ACCREDITED1, fromTime, toTime, expiryTime, whitelisted,{ from: ISSUER });
            // await I_GeneralTransferManager.modifyKYCData(NONACCREDITED1, fromTime, toTime, expiryTime, whitelisted,{ from: ISSUER });

            // Advance time to after STO start
            await increaseTime(duration.days(3));

            // Set as accredited
            await I_GeneralTransferManager.modifyInvestorFlag(ACCREDITED1, 0, true, { from: ISSUER });

            // Prep for investments
            let investment_ETH = new BN(web3.utils.toWei("1", "ether")); // Invest 1 ETH
            let investment_POLY = new BN(web3.utils.toWei("10000", "ether")); // Invest 10000 POLY
            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: NONACCREDITED1 });
            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: ACCREDITED1 });
            let investment_DAI = new BN(web3.utils.toWei("500", "ether")); // Invest 10000 POLY
            await I_DaiToken.getTokens(investment_DAI, NONACCREDITED1);
            await I_DaiToken.approve(I_USDTieredSTO_Array[stoId].address, investment_DAI, { from: NONACCREDITED1 });
            await I_DaiToken.getTokens(investment_DAI, ACCREDITED1);
            await I_DaiToken.approve(I_USDTieredSTO_Array[stoId].address, investment_DAI, { from: ACCREDITED1 });

            // NONACCREDITED ETH
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, value: investment_ETH }), "Transfer Invalid");

            // NONACCREDITED POLY
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, { from: NONACCREDITED1 }), "Transfer Invalid");

            // NONACCREDITED DAI
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithUSD(NONACCREDITED1, investment_DAI, I_DaiToken.address, { from: NONACCREDITED1 }), "Transfer Invalid");

            // ACCREDITED ETH
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithETH(ACCREDITED1, { from: ACCREDITED1, value: investment_ETH }), "Transfer Invalid");

            // ACCREDITED POLY
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, { from: ACCREDITED1 }), "Transfer Invalid");

            // ACCREDITED DAI
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithUSD(ACCREDITED1, investment_DAI, I_DaiToken.address, { from: ACCREDITED1 }), "Transfer Invalid");

            await revertToSnapshot(snapId);
        });

        it("should fail to buy for a benificiary by default - until allowBeneficialInvestments is activated", async () => {
            let stoId = 0;
            let snapId = await takeSnapshot();

            // Whitelist
            let fromTime = await latestTime();
            let toTime = await latestTime() + duration.days(15);
            let expiryTime = toTime + duration.days(100);

            await I_GeneralTransferManager.modifyKYCData(BENEFICIARY1, fromTime, toTime, expiryTime, { from: ISSUER });
            await I_GeneralTransferManager.modifyKYCData(NONACCREDITED1, fromTime, toTime, expiryTime, { from: ISSUER });

            // Advance time to after STO start
            await increaseTime(duration.days(3));

            // Prep for investments
            let investment_ETH = new BN(web3.utils.toWei("1", "ether")); // Invest 1 ETH
            let investment_POLY = new BN(web3.utils.toWei("10000", "ether")); // Invest 10000 POLY
            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: NONACCREDITED1 });
            let investment_DAI = new BN(web3.utils.toWei("500", "ether")); // Invest 10000 POLY
            await I_DaiToken.getTokens(investment_DAI, NONACCREDITED1);
            await I_DaiToken.approve(I_USDTieredSTO_Array[stoId].address, investment_DAI, { from: NONACCREDITED1 });

            // NONACCREDITED ETH
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithETH(BENEFICIARY1, { from: NONACCREDITED1, value: investment_ETH }),
                "Beneficiary != funder");

            // NONACCREDITED POLY
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithPOLY(BENEFICIARY1, investment_POLY, { from: NONACCREDITED1 }),
                "Beneficiary != funder");

            // NONACCREDITED DAI
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithUSD(BENEFICIARY1, investment_DAI, I_DaiToken.address, { from: NONACCREDITED1 }),
                "Beneficiary != funder");

            ////////////////////////////////////////////////////
            // Activate allowBeneficialInvestments and try again
            ////////////////////////////////////////////////////
            await I_USDTieredSTO_Array[0].changeAllowBeneficialInvestments(true, { from: ISSUER });

            // NONACCREDITED ETH
            await I_USDTieredSTO_Array[stoId].buyWithETH(BENEFICIARY1, { from: NONACCREDITED1, value: investment_ETH });

            // NONACCREDITED POLY
            await I_USDTieredSTO_Array[stoId].buyWithPOLY(BENEFICIARY1, investment_POLY, { from: NONACCREDITED1 });

            // NONACCREDITED DAI
            await I_USDTieredSTO_Array[stoId].buyWithUSD(BENEFICIARY1, investment_DAI, I_DaiToken.address, { from: NONACCREDITED1 });

            await revertToSnapshot(snapId);
        });

        it("should prevent investments if investor is flagged as canNotBuyFromSto", async () => {
            let stoId = 0;
            let snapId = await takeSnapshot();

            // Whitelist
            let fromTime = await latestTime();
            let toTime = await latestTime() + duration.days(15);
            let expiryTime = toTime + duration.days(100);

            await I_GeneralTransferManager.modifyKYCData(NONACCREDITED1, fromTime, toTime, expiryTime, { from: ISSUER });
            await I_GeneralTransferManager.modifyInvestorFlag(NONACCREDITED1, 1, true, { from: ISSUER });

            // Advance time to after STO start
            await increaseTime(duration.days(3));

            // Prep for investments
            let investment_ETH = new BN(web3.utils.toWei("1", "ether")); // Invest 1 ETH

            // NONACCREDITED ETH
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, value: investment_ETH }),
                "Unauthorized");

            await revertToSnapshot(snapId);
        });

        it("should fail if minimumInvestmentUSD not met", async () => {
            let stoId = 0;
            let tierId = 0;
            let snapId = await takeSnapshot();

            // Whitelist
            let fromTime = await latestTime();
            let toTime = await latestTime() + duration.days(15);
            let expiryTime = toTime + duration.days(100);
            let whitelisted = true;

            await I_GeneralTransferManager.modifyKYCData(ACCREDITED1, fromTime, toTime, expiryTime, { from: ISSUER });
            await I_GeneralTransferManager.modifyInvestorFlag(ACCREDITED1, 0, true, { from: ISSUER });
            await I_GeneralTransferManager.modifyKYCData(NONACCREDITED1, fromTime, toTime, expiryTime, { from: ISSUER });

            // Advance time to after STO start
            await increaseTime(duration.days(3));

            let investment_USD = new BN(2).mul(e18);
            let investment_ETH = await convert(stoId, tierId, false, "USD", "ETH", investment_USD);
            let investment_POLY = await convert(stoId, tierId, false, "USD", "POLY", investment_USD);
            let investment_DAI = investment_USD;

            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: NONACCREDITED1 });
            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: ACCREDITED1 });

            await I_DaiToken.getTokens(investment_DAI, NONACCREDITED1);
            await I_DaiToken.approve(I_USDTieredSTO_Array[stoId].address, investment_DAI, { from: NONACCREDITED1 });
            await I_DaiToken.getTokens(investment_DAI, ACCREDITED1);
            await I_DaiToken.approve(I_USDTieredSTO_Array[stoId].address, investment_DAI, { from: ACCREDITED1 });

            // NONACCREDITED ETH
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, value: investment_ETH }), "Investment < min");

            // NONACCREDITED POLY
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, { from: NONACCREDITED1 }), "Investment < min");

            // NONACCREDITED DAI
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithUSD(NONACCREDITED1, investment_DAI, I_DaiToken.address, { from: NONACCREDITED1 }), "Investment < min");

            // ACCREDITED ETH
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithETH(ACCREDITED1, { from: ACCREDITED1, value: investment_ETH }), "Investment < min");

            // ACCREDITED POLY
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, { from: ACCREDITED1 }), "Investment < min");

            // ACCREDITED DAI
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithUSD(ACCREDITED1, investment_DAI, I_DaiToken.address, { from: ACCREDITED1 }), "Investment < min");

            await revertToSnapshot(snapId);
        });

        it("should successfully pause the STO and make investments fail, then unpause and succeed", async () => {
            let stoId = 0;
            let snapId = await takeSnapshot();

            // Whitelist
            let fromTime = await latestTime();
            let toTime = await latestTime() + duration.days(15);
            let expiryTime = toTime + duration.days(100);
            let whitelisted = true;

            await I_GeneralTransferManager.modifyKYCData(ACCREDITED1, fromTime, toTime, expiryTime, { from: ISSUER });
            await I_GeneralTransferManager.modifyInvestorFlag(ACCREDITED1, 0, true, { from: ISSUER });
            await I_GeneralTransferManager.modifyKYCData(NONACCREDITED1, fromTime, toTime, expiryTime, { from: ISSUER });

            // Advance time to after STO start
            await increaseTime(duration.days(3));

            // Pause the STO
            await I_USDTieredSTO_Array[stoId].pause({ from: ISSUER });
            assert.equal(await I_USDTieredSTO_Array[stoId].paused.call(), true, "STO did not pause successfully");

            // Prep for investments
            let investment_ETH = new BN(web3.utils.toWei("1", "ether")); // Invest 1 ETH
            let investment_POLY = new BN(web3.utils.toWei("10000", "ether")); // Invest 10000 POLY
            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: NONACCREDITED1 });
            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: ACCREDITED1 });

            let investment_DAI = new BN(web3.utils.toWei("500", "ether")); // Invest 10000 POLY
            await I_DaiToken.getTokens(investment_DAI, NONACCREDITED1);
            await I_DaiToken.approve(I_USDTieredSTO_Array[stoId].address, investment_DAI, { from: NONACCREDITED1 });
            await I_DaiToken.getTokens(investment_DAI, ACCREDITED1);
            await I_DaiToken.approve(I_USDTieredSTO_Array[stoId].address, investment_DAI, { from: ACCREDITED1 });

            // NONACCREDITED ETH
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, value: investment_ETH }), "Contract is paused");

            // NONACCREDITED POLY
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, { from: NONACCREDITED1 }), "Contract is paused");

            // NONACCREDITED DAI
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithUSD(NONACCREDITED1, investment_DAI, I_DaiToken.address, { from: NONACCREDITED1 }), "Contract is paused");

            // ACCREDITED ETH
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithETH(ACCREDITED1, { from: ACCREDITED1, value: investment_ETH }), "Contract is paused");

            // ACCREDITED POLY
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, { from: ACCREDITED1 }), "Contract is paused");

            // ACCREDITED DAI
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithUSD(ACCREDITED1, investment_DAI, I_DaiToken.address, { from: ACCREDITED1 }), "Contract is paused");

            // Unpause the STO
            await I_USDTieredSTO_Array[stoId].unpause({ from: ISSUER });
            assert.equal(await I_USDTieredSTO_Array[stoId].paused.call(), false, "STO did not unpause successfully");

            await I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, value: investment_ETH });
            await I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, { from: NONACCREDITED1 });
            await I_USDTieredSTO_Array[stoId].buyWithUSD(NONACCREDITED1, investment_DAI, I_DaiToken.address, { from: NONACCREDITED1 });

            await I_USDTieredSTO_Array[stoId].buyWithETH(ACCREDITED1, { from: ACCREDITED1, value: investment_ETH });
            await I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, { from: ACCREDITED1 });
            await I_USDTieredSTO_Array[stoId].buyWithUSD(ACCREDITED1, investment_DAI, I_DaiToken.address, { from: ACCREDITED1 });

            await revertToSnapshot(snapId);
        });

        it("should allow changing stable coin address in middle of STO", async () => {
            let stoId = 0;
            let snapId = await takeSnapshot();

            // Whitelist
            let fromTime = new BN(await latestTime());
            let toTime = fromTime.add(new BN(duration.days(15)));
            let expiryTime = toTime.add(new BN(duration.days(100)));
            let whitelisted = true;

            await I_GeneralTransferManager.modifyKYCData(ACCREDITED1, fromTime, toTime, expiryTime, { from: ISSUER });
            await I_GeneralTransferManager.modifyInvestorFlag(ACCREDITED1, 0, true, { from: ISSUER });
            await I_GeneralTransferManager.modifyKYCData(NONACCREDITED1, fromTime, toTime, expiryTime, { from: ISSUER });

            // Advance time to after STO start
            await increaseTime(duration.days(3));

            // Prep for investments
            let investment_DAI = web3.utils.toWei("500", "ether"); // Invest 10000 POLY
            await I_DaiToken.getTokens(investment_DAI, NONACCREDITED1);
            await I_DaiToken.approve(I_USDTieredSTO_Array[stoId].address, investment_DAI, { from: NONACCREDITED1 });
            await I_DaiToken.getTokens(investment_DAI, ACCREDITED1);
            await I_DaiToken.approve(I_USDTieredSTO_Array[stoId].address, investment_DAI, { from: ACCREDITED1 });

            // Make sure buying works before changing
            await I_USDTieredSTO_Array[stoId].buyWithUSD(NONACCREDITED1, investment_DAI, I_DaiToken.address, { from: NONACCREDITED1 });

            // Change Stable coin address
            let I_DaiToken2 = await PolyTokenFaucet.new();
            await I_USDTieredSTO_Array[stoId].modifyAddresses(WALLET, TREASURYWALLET, [I_DaiToken2.address], { from: ISSUER });

            // NONACCREDITED DAI
            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithUSD(NONACCREDITED1, investment_DAI, I_DaiToken.address, { from: NONACCREDITED1 }), 
                "Fiat not allowed"
            );

            // ACCREDITED DAI
            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithUSD(ACCREDITED1, investment_DAI, I_DaiToken.address, { from: ACCREDITED1 }),
                "Fiat not allowed"
            );

            // Revert stable coin address
            await I_USDTieredSTO_Array[stoId].modifyAddresses(WALLET, TREASURYWALLET, [I_DaiToken.address], { from: ISSUER });

            // Make sure buying works again
            await I_USDTieredSTO_Array[stoId].buyWithUSD(ACCREDITED1, investment_DAI, I_DaiToken.address, { from: ACCREDITED1 });

            await revertToSnapshot(snapId);
        });

        it("should fail if after STO end time", async () => {
            let stoId = 3;
            let snapId = await takeSnapshot();

            // Whitelist
            let fromTime = await latestTime();
            let toTime = await latestTime() + duration.days(15);
            let expiryTime = toTime + duration.days(100);
            let whitelisted = true;

            await I_GeneralTransferManager.modifyKYCData(ACCREDITED1, fromTime, toTime, expiryTime, { from: ISSUER });
            await I_GeneralTransferManager.modifyInvestorFlag(ACCREDITED1, 0, true, { from: ISSUER });
            await I_GeneralTransferManager.modifyKYCData(NONACCREDITED1, fromTime, toTime, expiryTime, { from: ISSUER });

            // Advance time to after STO end
            await increaseTime(duration.days(3));

            assert.equal(await I_USDTieredSTO_Array[stoId].isOpen(), false, "STO is not showing correct status");

            // Prep for investments
            let investment_ETH = new BN(web3.utils.toWei("1", "ether")); // Invest 1 ETH
            let investment_POLY = new BN(web3.utils.toWei("10000", "ether")); // Invest 10000 POLY
            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: NONACCREDITED1 });
            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: ACCREDITED1 });
            let investment_DAI = new BN(web3.utils.toWei("500", "ether")); // Invest 500 DAI
            await I_DaiToken.getTokens(investment_DAI, NONACCREDITED1);
            await I_DaiToken.approve(I_USDTieredSTO_Array[stoId].address, investment_DAI, { from: NONACCREDITED1 });
            await I_DaiToken.getTokens(investment_DAI, ACCREDITED1);
            await I_DaiToken.approve(I_USDTieredSTO_Array[stoId].address, investment_DAI, { from: ACCREDITED1 });

            // NONACCREDITED ETH
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, value: investment_ETH }), "STO not open");

            // NONACCREDITED POLY
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, { from: NONACCREDITED1 }), "STO not open");

            // NONACCREDITED DAI
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithUSD(NONACCREDITED1, investment_DAI, I_DaiToken.address, { from: NONACCREDITED1 }), "STO not open");

            // ACCREDITED ETH
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithETH(ACCREDITED1, { from: ACCREDITED1, value: investment_ETH }), "STO not open");

            // ACCREDITED POLY
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, { from: ACCREDITED1 }), "STO not open");

            // ACCREDITED DAI
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithUSD(ACCREDITED1, investment_DAI, I_DaiToken.address, { from: ACCREDITED1 }), "STO not open");

            await revertToSnapshot(snapId);
        });

        it("should enforce fund raising types (e.g. SC only) ", async () => {
            let stoId = STOs.usdRaiseOnly;
            let snapId = await takeSnapshot();

            // Whitelist
            let fromTime = await latestTime();
            let toTime = await latestTime() + duration.days(15);
            let expiryTime = toTime + duration.days(100);
            let whitelisted = true;

            await I_GeneralTransferManager.modifyKYCData(ACCREDITED1, fromTime, toTime, expiryTime, { from: ISSUER });
            await I_GeneralTransferManager.modifyInvestorFlag(ACCREDITED1, 0, true, { from: ISSUER });
            await I_GeneralTransferManager.modifyKYCData(NONACCREDITED1, fromTime, toTime, expiryTime, { from: ISSUER });

            // Advance time to after STO start
            await increaseTime(duration.days(3));

            // Prep for investments
            let investment_ETH = new BN(web3.utils.toWei("1", "ether")); // Invest 1 ETH
            let investment_POLY = new BN(web3.utils.toWei("10000", "ether")); // Invest 10000 POLY
            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: NONACCREDITED1 });
            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: ACCREDITED1 });

            let investment_DAI = new BN(web3.utils.toWei("500", "ether")); // Invest 10000 POLY
            await I_DaiToken.getTokens(investment_DAI, NONACCREDITED1);
            await I_DaiToken.approve(I_USDTieredSTO_Array[stoId].address, investment_DAI, { from: NONACCREDITED1 });
            await I_DaiToken.getTokens(investment_DAI, ACCREDITED1);
            await I_DaiToken.approve(I_USDTieredSTO_Array[stoId].address, investment_DAI, { from: ACCREDITED1 });

            // NONACCREDITED ETH
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, value: investment_ETH }),
                "ETH not allowed");
            // NONACCREDITED POLY
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, { from: NONACCREDITED1 }),
                "POLY not allowed");
            // NONACCREDITED DAI
            await I_USDTieredSTO_Array[stoId].buyWithUSD(NONACCREDITED1, investment_DAI, I_DaiToken.address, { from: NONACCREDITED1 });

            // ACCREDITED ETH
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithETH(ACCREDITED1, { from: ACCREDITED1, value: investment_ETH }),
                "ETH not allowed");
            // ACCREDITED POLY
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, { from: ACCREDITED1 }),
                "POLY not allowed");
            // ACCREDITED DAI
            await I_USDTieredSTO_Array[stoId].buyWithUSD(ACCREDITED1, investment_DAI, I_DaiToken.address, { from: ACCREDITED1 });

            await revertToSnapshot(snapId);
        });

        it("should fail if finalized", async () => {
            let stoId = 0;
            let snapId = await takeSnapshot();

            // Whitelist
            let fromTime = await latestTime();
            let toTime = await latestTime();
            let expiryTime = toTime + duration.days(100);
            let whitelisted = true;

            await I_GeneralTransferManager.modifyKYCData(ACCREDITED1, fromTime, toTime, expiryTime, { from: ISSUER });
            await I_GeneralTransferManager.modifyInvestorFlag(ACCREDITED1, 0, true, { from: ISSUER });
            await I_GeneralTransferManager.modifyKYCData(NONACCREDITED1, fromTime, toTime, expiryTime, { from: ISSUER });
            await I_GeneralTransferManager.modifyKYCData(TREASURYWALLET, fromTime, toTime, expiryTime, { from: ISSUER });

            // Advance time to after STO start
            await increaseTime(duration.days(3));

            // Finalize STO
            let preBalance = await I_SecurityToken.balanceOf.call(TREASURYWALLET);
            await I_USDTieredSTO_Array[stoId].finalize({ from: ISSUER });
            assert.equal(await I_USDTieredSTO_Array[stoId].capReached(), false, "cap reached");
            let postBalance = await I_SecurityToken.balanceOf.call(TREASURYWALLET);
            assert.isAbove(parseInt(postBalance.toString()), parseInt(preBalance.toString()));
            assert.equal(await I_USDTieredSTO_Array[stoId].isFinalized.call(), true, "STO has not been finalized");
            assert.equal(await I_USDTieredSTO_Array[stoId].isOpen(), false, "STO is not showing correct status");
            assert.equal((await I_USDTieredSTO_Array[stoId].getTokensSold()).toString(), "0", "Not the expected amount of sold tokens");

            // Attempt to call function again
            await catchRevert(I_USDTieredSTO_Array[stoId].finalize({ from: ISSUER }), "STO is finalized");

            // Prep for investments
            let investment_ETH = new BN(web3.utils.toWei("1", "ether")); // Invest 1 ETH
            let investment_POLY = new BN(web3.utils.toWei("10000", "ether")); // Invest 10000 POLY
            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: NONACCREDITED1 });
            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: ACCREDITED1 });
            let investment_DAI = new BN(web3.utils.toWei("500", "ether")); // Invest 10000 POLY
            await I_DaiToken.getTokens(investment_DAI, NONACCREDITED1);
            await I_DaiToken.approve(I_USDTieredSTO_Array[stoId].address, investment_DAI, { from: NONACCREDITED1 });
            await I_DaiToken.getTokens(investment_DAI, ACCREDITED1);
            await I_DaiToken.approve(I_USDTieredSTO_Array[stoId].address, investment_DAI, { from: ACCREDITED1 });

            // NONACCREDITED ETH
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, value: investment_ETH }), "STO not open");

            // NONACCREDITED POLY
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, { from: NONACCREDITED1 }), "STO not open");

            // NONACCREDITED DAI
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithUSD(NONACCREDITED1, investment_DAI, I_DaiToken.address, { from: NONACCREDITED1 }), "STO not open");

            // ACCREDITED ETH
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithETH(ACCREDITED1, { from: ACCREDITED1, value: investment_ETH }), "STO not open");

            // ACCREDITED POLY
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, { from: ACCREDITED1 }), "STO not open");

            // ACCREDITED DAI
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithUSD(ACCREDITED1, investment_DAI, I_DaiToken.address, { from: ACCREDITED1 }), "STO not open");

            await revertToSnapshot(snapId);
        });
    });

    describe("Prep STO", async () => {
        it("should jump forward to after STO start", async () => {
            let stoId = 0;
            await increaseTime(duration.days(3));
            assert.equal(await I_USDTieredSTO_Array[stoId].isOpen(), true, "STO is not showing correct status");
        });

        it("should whitelist ACCREDITED1 and NONACCREDITED1", async () => {
            let stoId = 0;

            let fromTime = await latestTime();
            let toTime = await latestTime() + duration.days(15);
            let expiryTime = toTime + duration.days(100);
            let whitelisted = true;

            const tx1 = await I_GeneralTransferManager.modifyKYCData(NONACCREDITED1, fromTime, toTime, expiryTime, {
                from: ISSUER
            });
            assert.equal(tx1.logs[0].args._investor, NONACCREDITED1, "Failed in adding the investor in whitelist");
            const tx2 = await I_GeneralTransferManager.modifyKYCData(ACCREDITED1, fromTime, toTime, expiryTime, {
                from: ISSUER
            });
            await I_GeneralTransferManager.modifyInvestorFlag(ACCREDITED1, 0, true, { from: ISSUER });
            assert.equal(tx2.logs[0].args._investor, ACCREDITED1, "Failed in adding the investor in whitelist");
        });

        it("should successfully modify accredited addresses for the STOs", async () => {
            let stoId = 0;
            let totalStatus = await I_USDTieredSTO_Array[stoId].getAccreditedData.call();
            console.log(totalStatus);
            assert.equal(totalStatus[0][0], NONACCREDITED1, "Account match");
            assert.equal(totalStatus[0][1], ACCREDITED1, "Account match");
            assert.equal(totalStatus[1][0], false, "Account match");
            assert.equal(totalStatus[1][1], true, "Account match");
            assert.equal(totalStatus[2][0].toNumber(), 0, "override match");
            assert.equal(totalStatus[2][1].toNumber(), 0, "override match");
        });
    });

    describe("Buy Tokens with no discount", async () => {
        it("Should prevent buying 0 amount", async () => {
            let stoId = 0;
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithUSD(NONACCREDITED1, 0, I_DaiToken.address, { from: NONACCREDITED1 }),
                "No funds sent");
        });

        it("should successfully buy using fallback at tier 0 for NONACCREDITED1", async () => {
            let stoId = 0;
            let tierId = 0;

            let investment_Token = new BN(50).mul(e18);
            let investment_USD = await convert(stoId, tierId, false, "TOKEN", "USD", investment_Token);
            let investment_ETH = await convert(stoId, tierId, false, "TOKEN", "ETH", investment_Token);
            let investment_POLY = await convert(stoId, tierId, false, "TOKEN", "POLY", investment_Token);

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let init_InvestorETHBal = new BN(await web3.eth.getBalance(NONACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedUSD = await I_USDTieredSTO_Array[stoId].fundsRaisedUSD.call();
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let init_RaisedDAI = await I_USDTieredSTO_Array[stoId].fundsRaised.call(DAI);
            let init_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            let tx1 = await web3.eth.sendTransaction({
                from: NONACCREDITED1,
                to: I_USDTieredSTO_Array[stoId].address,
                value: investment_ETH,
                gasPrice: GAS_PRICE,
                gas: 7000000
            });
            let gasCost1 = new BN(GAS_PRICE).mul(new BN(tx1.gasUsed));
            console.log("          Gas fallback purchase: ".grey + new BN(tx1.gasUsed).toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let final_InvestorETHBal = new BN(await web3.eth.getBalance(NONACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedUSD = await I_USDTieredSTO_Array[stoId].fundsRaisedUSD.call();
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let final_RaisedDAI = await I_USDTieredSTO_Array[stoId].fundsRaised.call(DAI);
            let final_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            assert.equal(
                final_TokenSupply.toString(),
                init_TokenSupply.add(investment_Token).toString(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toString(),
                init_InvestorTokenBal.add(investment_Token).toString(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_InvestorETHBal.toString(),
                init_InvestorETHBal
                    .sub(gasCost1)
                    .sub(investment_ETH)
                    .toString(),
                "Investor ETH Balance not changed as expected"
            );
            assert.equal(
                final_InvestorPOLYBal.toString(),
                init_InvestorPOLYBal.toString(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toString(),
                init_STOTokenSold.add(investment_Token).toString(),
                "STO Token Sold not changed as expected"
            );
            assert.equal(final_STOETHBal.toString(), init_STOETHBal.toString(), "STO ETH Balance not changed as expected");
            assert.equal(final_STOPOLYBal.toString(), init_STOPOLYBal.toString(), "STO POLY Balance not changed as expected");
            assert.equal(final_RaisedUSD.toString(), init_RaisedUSD.add(investment_USD).toString(), "Raised USD not changed as expected");
            assert.equal(final_RaisedETH.toString(), init_RaisedETH.add(investment_ETH).toString(), "Raised ETH not changed as expected");
            assert.equal(final_RaisedPOLY.toString(), init_RaisedPOLY.toString(), "Raised POLY not changed as expected");
            assert.equal(final_RaisedDAI.toString(), init_RaisedDAI.toString(), "Raised POLY not changed as expected");
            assert.equal(
                final_WalletETHBal.toString(),
                init_WalletETHBal.add(investment_ETH).toString(),
                "Wallet ETH Balance not changed as expected"
            );
            assert.equal(final_WalletPOLYBal.toString(), init_WalletPOLYBal.toString(), "Wallet POLY Balance not changed as expected");

            // Additional checks on getters
            assert.equal((await I_USDTieredSTO_Array[stoId].investorCount.call()).toString(), 1, "Investor count not changed as expected");
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].getTokensSold()).toString(),
                investment_Token.toString(),
                "getTokensSold not changed as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].getTokensMinted()).toString(),
                investment_Token.toString(),
                "getTokensMinted not changed as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].getTokensSoldFor(ETH)).toString(),
                investment_Token.toString(),
                "getTokensSoldForETH not changed as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].getTokensSoldFor(POLY)).toString(),
                new BN(0),
                "getTokensSoldForPOLY not changed as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].investorInvestedUSD.call(NONACCREDITED1)).toString(),
                investment_USD.toString(),
                "investorInvestedUSD not changed as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].investorInvested.call(NONACCREDITED1, ETH)).toString(),
                investment_ETH.toString(),
                "investorInvestedETH not changed as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].investorInvested.call(NONACCREDITED1, POLY)).toString(),
                new BN(0),
                "investorInvestedPOLY not changed as expected"
            );
        });

        it("should successfully buy using buyWithETH at tier 0 for NONACCREDITED1", async () => {
            let stoId = 0;
            let tierId = 0;

            let investment_Token = new BN(50).mul(e18);
            let investment_USD = await convert(stoId, tierId, false, "TOKEN", "USD", investment_Token);
            let investment_ETH = await convert(stoId, tierId, false, "TOKEN", "ETH", investment_Token);
            let investment_POLY = await convert(stoId, tierId, false, "TOKEN", "POLY", investment_Token);

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let init_InvestorETHBal = new BN(await web3.eth.getBalance(NONACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let init_RaisedDAI = await I_USDTieredSTO_Array[stoId].fundsRaised.call(DAI);
            let init_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            let tx1 = await I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, {
                from: NONACCREDITED1,
                value: investment_ETH,
                gasPrice: GAS_PRICE
            });
            let gasCost1 = new BN(GAS_PRICE).mul(new BN(tx1.receipt.gasUsed));
            console.log("          Gas buyWithETH: ".grey + new BN(tx1.receipt.gasUsed).toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let final_InvestorETHBal = new BN(await web3.eth.getBalance(NONACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let final_RaisedDAI = await I_USDTieredSTO_Array[stoId].fundsRaised.call(DAI);
            let final_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            assert.equal(
                final_TokenSupply.toString(),
                init_TokenSupply.add(investment_Token).toString(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toString(),
                init_InvestorTokenBal.add(investment_Token).toString(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_InvestorETHBal.toString(),
                init_InvestorETHBal
                    .sub(gasCost1)
                    .sub(investment_ETH)
                    .toString(),
                "Investor ETH Balance not changed as expected"
            );
            assert.equal(
                final_InvestorPOLYBal.toString(),
                init_InvestorPOLYBal.toString(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toString(),
                init_STOTokenSold.add(investment_Token).toString(),
                "STO Token Sold not changed as expected"
            );
            assert.equal(final_STOETHBal.toString(), init_STOETHBal.toString(), "STO ETH Balance not changed as expected");
            assert.equal(final_STOPOLYBal.toString(), init_STOPOLYBal.toString(), "STO POLY Balance not changed as expected");
            assert.equal(final_RaisedETH.toString(), init_RaisedETH.add(investment_ETH).toString(), "Raised ETH not changed as expected");
            assert.equal(final_RaisedPOLY.toString(), init_RaisedPOLY.toString(), "Raised POLY not changed as expected");
            assert.equal(final_RaisedDAI.toString(), init_RaisedDAI.toString(), "Raised DAI not changed as expected");
            assert.equal(
                final_WalletETHBal.toString(),
                init_WalletETHBal.add(investment_ETH).toString(),
                "Wallet ETH Balance not changed as expected"
            );
            assert.equal(final_WalletPOLYBal.toString(), init_WalletPOLYBal.toString(), "Wallet POLY Balance not changed as expected");
        });

        it("should successfully buy using buyWithPOLY at tier 0 for NONACCREDITED1", async () => {
            let stoId = 0;
            let tierId = 0;

            let investment_Token = new BN(50).mul(e18);
            let investment_USD = await convert(stoId, tierId, false, "TOKEN", "USD", investment_Token);
            let investment_ETH = await convert(stoId, tierId, false, "TOKEN", "ETH", investment_Token);
            let investment_POLY = await convert(stoId, tierId, false, "TOKEN", "POLY", investment_Token);

            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: NONACCREDITED1 });

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let init_InvestorETHBal = new BN(await web3.eth.getBalance(NONACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let init_RaisedDAI = await I_USDTieredSTO_Array[stoId].fundsRaised.call(DAI);
            let init_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            // Buy With POLY
            let tx2 = await I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, {
                from: NONACCREDITED1,
                gasPrice: GAS_PRICE
            });
            let gasCost2 = new BN(GAS_PRICE).mul(new BN(tx2.receipt.gasUsed));
            console.log("          Gas buyWithPOLY: ".grey + new BN(tx2.receipt.gasUsed).toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let final_InvestorETHBal = new BN(await web3.eth.getBalance(NONACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let final_RaisedDAI = await I_USDTieredSTO_Array[stoId].fundsRaised.call(DAI);
            let final_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            assert.equal(
                final_TokenSupply.toString(),
                init_TokenSupply.add(investment_Token).toString(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toString(),
                init_InvestorTokenBal.add(investment_Token).toString(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_InvestorETHBal.toString(),
                init_InvestorETHBal.sub(gasCost2).toString(),
                "Investor ETH Balance not changed as expected"
            );
            assert.equal(
                final_InvestorPOLYBal.toString(),
                init_InvestorPOLYBal.sub(investment_POLY).toString(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toString(),
                init_STOTokenSold.add(investment_Token).toString(),
                "STO Token Sold not changed as expected"
            );
            assert.equal(final_STOETHBal.toString(), init_STOETHBal.toString(), "STO ETH Balance not changed as expected");
            assert.equal(final_STOPOLYBal.toString(), init_STOPOLYBal.toString(), "STO POLY Balance not changed as expected");
            assert.equal(final_RaisedETH.toString(), init_RaisedETH.toString(), "Raised ETH not changed as expected");
            assert.equal(
                final_RaisedPOLY.toString(),
                init_RaisedPOLY.add(investment_POLY).toString(),
                "Raised POLY not changed as expected"
            );
            assert.equal(final_RaisedDAI.toString(), init_RaisedDAI.toString(), "Raised POLY not changed as expected");
            assert.equal(final_WalletETHBal.toString(), init_WalletETHBal.toString(), "Wallet ETH Balance not changed as expected");
            assert.equal(
                final_WalletPOLYBal.toString(),
                init_WalletPOLYBal.add(investment_POLY).toString(),
                "Wallet POLY Balance not changed as expected"
            );
        });

        it("should successfully buy using buyWithUSD at tier 0 for NONACCREDITED1", async () => {
            let stoId = 0;
            let tierId = 0;

            let investment_Token = new BN(50).mul(e18);
            let investment_USD = await convert(stoId, tierId, false, "TOKEN", "USD", investment_Token);
            let investment_ETH = await convert(stoId, tierId, false, "TOKEN", "ETH", investment_Token);
            let investment_POLY = await convert(stoId, tierId, false, "TOKEN", "POLY", investment_Token);
            let investment_DAI = investment_USD;

            await I_DaiToken.getTokens(investment_DAI, NONACCREDITED1);
            await I_DaiToken.approve(I_USDTieredSTO_Array[stoId].address, investment_DAI, { from: NONACCREDITED1 });

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let init_InvestorETHBal = new BN(await web3.eth.getBalance(NONACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let init_InvestorDAIBal = await I_DaiToken.balanceOf(NONACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let init_RaisedDAI = await I_USDTieredSTO_Array[stoId].fundsRaised.call(DAI);
            let init_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);
            let init_WalletDAIBal = await I_DaiToken.balanceOf(WALLET);

            // Buy With DAI
            let tx2 = await I_USDTieredSTO_Array[stoId].buyWithUSD(NONACCREDITED1, investment_DAI, I_DaiToken.address, {
                from: NONACCREDITED1,
                gasPrice: GAS_PRICE
            });
            let gasCost2 = new BN(GAS_PRICE).mul(new BN(tx2.receipt.gasUsed));
            console.log("          Gas buyWithUSD: ".grey + new BN(tx2.receipt.gasUsed).toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let final_InvestorETHBal = new BN(await web3.eth.getBalance(NONACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let final_InvestorDAIBal = await I_DaiToken.balanceOf(NONACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let final_RaisedDAI = await I_USDTieredSTO_Array[stoId].fundsRaised.call(DAI);
            let final_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);
            let final_WalletDAIBal = await I_DaiToken.balanceOf(WALLET);

            assert.equal(
                final_TokenSupply.toString(),
                init_TokenSupply.add(investment_Token).toString(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toString(),
                init_InvestorTokenBal.add(investment_Token).toString(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_InvestorETHBal.toString(),
                init_InvestorETHBal.sub(gasCost2).toString(),
                "Investor ETH Balance not changed as expected"
            );
            assert.equal(
                final_InvestorPOLYBal.toString(),
                init_InvestorPOLYBal.toString(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_InvestorDAIBal.toString(),
                init_InvestorDAIBal.sub(investment_DAI).toString(),
                "Investor DAI Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toString(),
                init_STOTokenSold.add(investment_Token).toString(),
                "STO Token Sold not changed as expected"
            );
            assert.equal(final_STOETHBal.toString(), init_STOETHBal.toString(), "STO ETH Balance not changed as expected");
            assert.equal(final_STOPOLYBal.toString(), init_STOPOLYBal.toString(), "STO POLY Balance not changed as expected");
            assert.equal(final_RaisedETH.toString(), init_RaisedETH.toString(), "Raised ETH not changed as expected");
            assert.equal(final_RaisedPOLY.toString(), init_RaisedPOLY.toString(), "Raised POLY not changed as expected");
            assert.equal(final_RaisedDAI.toString(), init_RaisedDAI.add(investment_DAI).toString(), "Raised POLY not changed as expected");
            assert.equal(final_WalletETHBal.toString(), init_WalletETHBal.toString(), "Wallet ETH Balance not changed as expected");
            assert.equal(final_WalletPOLYBal.toString(), init_WalletPOLYBal.toString(), "Wallet POLY Balance not changed as expected");
            assert.equal(
                final_WalletDAIBal.toString(),
                init_WalletDAIBal.add(investment_DAI).toString(),
                "Wallet DAI Balance not changed as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].stableCoinsRaised.call(I_DaiToken.address)).toString(),
                investment_DAI.toString(),
                "DAI Raised not changed as expected"
            );
        });

        it("should successfully buy using fallback at tier 0 for ACCREDITED1", async () => {
            let stoId = 0;
            let tierId = 0;

            let investment_Token = new BN(50).mul(e18);
            let investment_USD = await convert(stoId, tierId, false, "TOKEN", "USD", investment_Token);
            let investment_ETH = await convert(stoId, tierId, false, "TOKEN", "ETH", investment_Token);
            let investment_POLY = await convert(stoId, tierId, false, "TOKEN", "POLY", investment_Token);

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let init_InvestorETHBal = new BN(await web3.eth.getBalance(ACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let init_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            let tx1 = await web3.eth.sendTransaction({
                from: ACCREDITED1,
                to: I_USDTieredSTO_Array[stoId].address,
                value: investment_ETH,
                gasPrice: GAS_PRICE,
                gas: 7000000
            });
            let gasCost1 = new BN(GAS_PRICE).mul(new BN(tx1.gasUsed));
            console.log("          Gas fallback purchase: ".grey + new BN(tx1.gasUsed).toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let final_InvestorETHBal = new BN(await web3.eth.getBalance(ACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let final_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            assert.equal(
                final_TokenSupply.toString(),
                init_TokenSupply.add(investment_Token).toString(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toString(),
                init_InvestorTokenBal.add(investment_Token).toString(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_InvestorETHBal.toString(),
                init_InvestorETHBal
                    .sub(gasCost1)
                    .sub(investment_ETH)
                    .toString(),
                "Investor ETH Balance not changed as expected"
            );
            assert.equal(
                final_InvestorPOLYBal.toString(),
                init_InvestorPOLYBal.toString(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toString(),
                init_STOTokenSold.add(investment_Token).toString(),
                "STO Token Sold not changed as expected"
            );
            assert.equal(final_STOETHBal.toString(), init_STOETHBal.toString(), "STO ETH Balance not changed as expected");
            assert.equal(final_STOPOLYBal.toString(), init_STOPOLYBal.toString(), "STO POLY Balance not changed as expected");
            assert.equal(final_RaisedETH.toString(), init_RaisedETH.add(investment_ETH).toString(), "Raised ETH not changed as expected");
            assert.equal(final_RaisedPOLY.toString(), init_RaisedPOLY.toString(), "Raised POLY not changed as expected");
            assert.equal(
                final_WalletETHBal.toString(),
                init_WalletETHBal.add(investment_ETH).toString(),
                "Wallet ETH Balance not changed as expected"
            );
            assert.equal(final_WalletPOLYBal.toString(), init_WalletPOLYBal.toString(), "Wallet POLY Balance not changed as expected");
        });

        it("should successfully buy using buyWithETH at tier 0 for ACCREDITED1", async () => {
            let stoId = 0;
            let tierId = 0;

            let investment_Token = new BN(50).mul(e18);
            let investment_USD = await convert(stoId, tierId, false, "TOKEN", "USD", investment_Token);
            let investment_ETH = await convert(stoId, tierId, false, "TOKEN", "ETH", investment_Token);
            let investment_POLY = await convert(stoId, tierId, false, "TOKEN", "POLY", investment_Token);

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let init_InvestorETHBal = new BN(await web3.eth.getBalance(ACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let init_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            let tx1 = await I_USDTieredSTO_Array[stoId].buyWithETH(ACCREDITED1, {
                from: ACCREDITED1,
                value: investment_ETH,
                gasPrice: GAS_PRICE
            });
            let gasCost1 = new BN(GAS_PRICE).mul(new BN(tx1.receipt.gasUsed));
            console.log("          Gas buyWithETH: ".grey + new BN(tx1.receipt.gasUsed).toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let final_InvestorETHBal = new BN(await web3.eth.getBalance(ACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let final_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            assert.equal(
                final_TokenSupply.toString(),
                init_TokenSupply.add(investment_Token).toString(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toString(),
                init_InvestorTokenBal.add(investment_Token).toString(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_InvestorETHBal.toString(),
                init_InvestorETHBal
                    .sub(gasCost1)
                    .sub(investment_ETH)
                    .toString(),
                "Investor ETH Balance not changed as expected"
            );
            assert.equal(
                final_InvestorPOLYBal.toString(),
                init_InvestorPOLYBal.toString(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toString(),
                init_STOTokenSold.add(investment_Token).toString(),
                "STO Token Sold not changed as expected"
            );
            assert.equal(final_STOETHBal.toString(), init_STOETHBal.toString(), "STO ETH Balance not changed as expected");
            assert.equal(final_STOPOLYBal.toString(), init_STOPOLYBal.toString(), "STO POLY Balance not changed as expected");
            assert.equal(final_RaisedETH.toString(), init_RaisedETH.add(investment_ETH).toString(), "Raised ETH not changed as expected");
            assert.equal(final_RaisedPOLY.toString(), init_RaisedPOLY.toString(), "Raised POLY not changed as expected");
            assert.equal(
                final_WalletETHBal.toString(),
                init_WalletETHBal.add(investment_ETH).toString(),
                "Wallet ETH Balance not changed as expected"
            );
            assert.equal(final_WalletPOLYBal.toString(), init_WalletPOLYBal.toString(), "Wallet POLY Balance not changed as expected");
        });

        it("should successfully buy using buyWithPOLY at tier 0 for ACCREDITED1", async () => {
            let stoId = 0;
            let tierId = 0;

            let investment_Token = new BN(50).mul(e18);
            let investment_USD = await convert(stoId, tierId, false, "TOKEN", "USD", investment_Token);
            let investment_ETH = await convert(stoId, tierId, false, "TOKEN", "ETH", investment_Token);
            let investment_POLY = await convert(stoId, tierId, false, "TOKEN", "POLY", investment_Token);

            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: ACCREDITED1 });

            // Additional checks on getters
            let init_getTokensSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_getTokensMinted = await I_USDTieredSTO_Array[stoId].getTokensMinted();
            let init_getTokensSoldForETH = await I_USDTieredSTO_Array[stoId].getTokensSoldFor(ETH);
            let init_getTokensSoldForPOLY = await I_USDTieredSTO_Array[stoId].getTokensSoldFor(POLY);
            let init_investorInvestedUSD = await I_USDTieredSTO_Array[stoId].investorInvestedUSD.call(ACCREDITED1);
            let init_investorInvestedETH = await I_USDTieredSTO_Array[stoId].investorInvested.call(ACCREDITED1, ETH);
            let init_investorInvestedPOLY = await I_USDTieredSTO_Array[stoId].investorInvested.call(ACCREDITED1, POLY);

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let init_InvestorETHBal = new BN(await web3.eth.getBalance(ACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let init_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            // Buy With POLY
            let tx2 = await I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, {
                from: ACCREDITED1,
                gasPrice: GAS_PRICE
            });
            let gasCost2 = new BN(GAS_PRICE).mul(new BN(tx2.receipt.gasUsed));
            console.log("          Gas buyWithPOLY: ".grey + new BN(tx2.receipt.gasUsed).toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let final_InvestorETHBal = new BN(await web3.eth.getBalance(ACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let final_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            assert.equal(
                final_TokenSupply.toString(),
                init_TokenSupply.add(investment_Token).toString(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toString(),
                init_InvestorTokenBal.add(investment_Token).toString(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_InvestorETHBal.toString(),
                init_InvestorETHBal.sub(gasCost2).toString(),
                "Investor ETH Balance not changed as expected"
            );
            assert.equal(
                final_InvestorPOLYBal.toString(),
                init_InvestorPOLYBal.sub(investment_POLY).toString(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toString(),
                init_STOTokenSold.add(investment_Token).toString(),
                "STO Token Sold not changed as expected"
            );
            assert.equal(final_STOETHBal.toString(), init_STOETHBal.toString(), "STO ETH Balance not changed as expected");
            assert.equal(final_STOPOLYBal.toString(), init_STOPOLYBal.toString(), "STO POLY Balance not changed as expected");
            assert.equal(final_RaisedETH.toString(), init_RaisedETH.toString(), "Raised ETH not changed as expected");
            assert.equal(
                final_RaisedPOLY.toString(),
                init_RaisedPOLY.add(investment_POLY).toString(),
                "Raised POLY not changed as expected"
            );
            assert.equal(final_WalletETHBal.toString(), init_WalletETHBal.toString(), "Wallet ETH Balance not changed as expected");
            assert.equal(
                final_WalletPOLYBal.toString(),
                init_WalletPOLYBal.add(investment_POLY).toString(),
                "Wallet POLY Balance not changed as expected"
            );

            // Additional checks on getters
            assert.equal((await I_USDTieredSTO_Array[stoId].investorCount.call()).toString(), 2, "Investor count not changed as expected");
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].getTokensSold()).toString(),
                init_getTokensSold.add(investment_Token).toString(),
                "getTokensSold not changed as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].getTokensMinted()).toString(),
                init_getTokensMinted.add(investment_Token).toString(),
                "getTokensMinted not changed as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].getTokensSoldFor(ETH)).toString(),
                init_getTokensSoldForETH.toString(),
                "getTokensSoldForETH not changed as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].getTokensSoldFor(POLY)).toString(),
                init_getTokensSoldForPOLY.add(investment_Token).toString(),
                "getTokensSoldForPOLY not changed as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].investorInvestedUSD.call(ACCREDITED1)).toString(),
                init_investorInvestedUSD.add(investment_USD).toString(),
                "investorInvestedUSD not changed as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].investorInvested.call(ACCREDITED1, ETH)).toString(),
                init_investorInvestedETH.toString(),
                "investorInvestedETH not changed as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].investorInvested.call(ACCREDITED1, POLY)).toString(),
                init_investorInvestedPOLY.add(investment_POLY).toString(),
                "investorInvestedPOLY not changed as expected"
            );
        });

        it("should successfully modify NONACCREDITED cap for NONACCREDITED1", async () => {
            let stoId = 0;
            let tierId = 0;
            console.log("Current investment: " + (await I_USDTieredSTO_Array[stoId].investorInvestedUSD.call(NONACCREDITED1)).toString());
            await I_USDTieredSTO_Array[stoId].changeNonAccreditedLimit([NONACCREDITED1], [new BN(_nonAccreditedLimitUSD[stoId]).div(new BN(2))], {
                from: ISSUER
            });
            let investorLimit = await I_USDTieredSTO_Array[stoId].nonAccreditedLimitUSDOverride.call(NONACCREDITED1);
            console.log("Current limit: " + investorLimit.toString());
            let totalStatus = await I_USDTieredSTO_Array[stoId].getAccreditedData.call();

            assert.equal(totalStatus[0][0], NONACCREDITED1, "Account match");
            assert.equal(totalStatus[0][1], ACCREDITED1, "Account match");
            assert.equal(totalStatus[1][0], false, "Account match");
            assert.equal(totalStatus[1][1], true, "Account match");
            assert.equal(totalStatus[2][0].toString(), new BN(_nonAccreditedLimitUSD[stoId]).div(new BN(2)), "override match");
            assert.equal(totalStatus[2][1].toString(), 0, "override match");
        });

        it("shoud fail to modify NONACCREDDITED limit if array lengths mismatch", async () => {
            let stoId = 0;
            catchRevert(I_USDTieredSTO_Array[stoId].changeNonAccreditedLimit(
                [NONACCREDITED1],
                [
                    new BN(_nonAccreditedLimitUSD[stoId]).div(new BN(2)),
                    new BN(_nonAccreditedLimitUSD[stoId]).div(new BN(2))
                ], {
                from: ISSUER
            }), "Length mismatch");
        });

        it("should successfully buy a partial amount and refund balance when reaching NONACCREDITED cap", async () => {
            let stoId = 0;
            let tierId = 0;

            let investment_USD = await I_USDTieredSTO_Array[stoId].nonAccreditedLimitUSDOverride.call(NONACCREDITED1);//await I_USDTieredSTO_Array[stoId].nonAccreditedLimitUSDOverride(NONACCREDITED1); //_nonAccreditedLimitUSD[stoId];
            let investment_Token = await convert(stoId, tierId, false, "USD", "TOKEN", investment_USD);
            let investment_ETH = await convert(stoId, tierId, false, "USD", "ETH", investment_USD);
            let investment_POLY = await convert(stoId, tierId, false, "USD", "POLY", investment_USD);

            let refund_USD = await I_USDTieredSTO_Array[stoId].investorInvestedUSD.call(NONACCREDITED1);
            let refund_Token = await convert(stoId, tierId, false, "USD", "TOKEN", refund_USD);
            let refund_ETH = await convert(stoId, tierId, false, "USD", "ETH", refund_USD);
            let refund_POLY = await convert(stoId, tierId, false, "USD", "POLY", refund_USD);

            console.log("Expected refund in tokens: " + refund_Token.toString());

            let snap = await takeSnapshot();

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let init_InvestorETHBal = new BN(await web3.eth.getBalance(NONACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let init_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            // Buy with ETH
            let tx1 = await I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, {
                from: NONACCREDITED1,
                value: investment_ETH,
                gasPrice: GAS_PRICE
            });
            let gasCost1 = new BN(GAS_PRICE).mul(new BN(tx1.receipt.gasUsed));
            console.log("          Gas buyWithETH: ".grey + new BN(tx1.receipt.gasUsed).toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let final_InvestorETHBal = new BN(await web3.eth.getBalance(NONACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let final_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            assert.equal(
                final_TokenSupply.toString(),
                init_TokenSupply
                    .add(investment_Token)
                    .sub(refund_Token)
                    .toString(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toString(),
                init_InvestorTokenBal
                    .add(investment_Token)
                    .sub(refund_Token)
                    .toString(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_InvestorETHBal.toString(),
                init_InvestorETHBal
                    .sub(gasCost1)
                    .sub(investment_ETH)
                    .add(refund_ETH)
                    .toString(),
                "Investor ETH Balance not changed as expected"
            );
            assert.equal(
                final_InvestorPOLYBal.toString(),
                init_InvestorPOLYBal.toString(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toString(),
                init_STOTokenSold
                    .add(investment_Token)
                    .sub(refund_Token)
                    .toString(),
                "STO Token Sold not changed as expected"
            );
            assert.equal(final_STOETHBal.toString(), init_STOETHBal.toString(), "STO ETH Balance not changed as expected");
            assert.equal(final_STOPOLYBal.toString(), init_STOPOLYBal.toString(), "STO POLY Balance not changed as expected");
            assert.equal(
                final_RaisedETH.toString(),
                init_RaisedETH
                    .add(investment_ETH)
                    .sub(refund_ETH)
                    .toString(),
                "Raised ETH not changed as expected"
            );
            assert.equal(final_RaisedPOLY.toString(), init_RaisedPOLY.toString(), "Raised POLY not changed as expected");
            assert.equal(
                final_WalletETHBal.toString(),
                init_WalletETHBal
                    .add(investment_ETH)
                    .sub(refund_ETH)
                    .toString(),
                "Wallet ETH Balance not changed as expected"
            );
            assert.equal(final_WalletPOLYBal.toString(), init_WalletPOLYBal.toString(), "Wallet POLY Balance not changed as expected");

            await revertToSnapshot(snap);

            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: NONACCREDITED1 });

            init_TokenSupply = await I_SecurityToken.totalSupply();
            init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            init_InvestorETHBal = new BN(await web3.eth.getBalance(NONACCREDITED1));
            init_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            init_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            init_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            // Buy With POLY
            let tx2 = await I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, {
                from: NONACCREDITED1,
                gasPrice: GAS_PRICE
            });
            let gasCost2 = new BN(GAS_PRICE).mul(new BN(tx2.receipt.gasUsed));
            console.log("          Gas buyWithPOLY: ".grey + new BN(tx2.receipt.gasUsed).toString().grey);

            final_TokenSupply = await I_SecurityToken.totalSupply();
            final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            final_InvestorETHBal = new BN(await web3.eth.getBalance(NONACCREDITED1));
            final_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            final_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            final_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            assert.equal(
                final_TokenSupply.toString(),
                init_TokenSupply
                    .add(investment_Token)
                    .sub(refund_Token)
                    .toString(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toString(),
                init_InvestorTokenBal
                    .add(investment_Token)
                    .sub(refund_Token)
                    .toString(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_InvestorETHBal.toString(),
                init_InvestorETHBal.sub(gasCost2).toString(),
                "Investor ETH Balance not changed as expected"
            );
            assert.equal(
                final_InvestorPOLYBal.toString(),
                init_InvestorPOLYBal
                    .sub(investment_POLY)
                    .add(refund_POLY)
                    .toString(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toString(),
                init_STOTokenSold
                    .add(investment_Token)
                    .sub(refund_Token)
                    .toString(),
                "STO Token Sold not changed as expected"
            );
            assert.equal(final_STOETHBal.toString(), init_STOETHBal.toString(), "STO ETH Balance not changed as expected");
            assert.equal(final_STOPOLYBal.toString(), init_STOPOLYBal.toString(), "STO POLY Balance not changed as expected");
            assert.equal(final_RaisedETH.toString(), init_RaisedETH.toString(), "Raised ETH not changed as expected");
            assert.equal(
                final_RaisedPOLY.toString(),
                init_RaisedPOLY
                    .add(investment_POLY)
                    .sub(refund_POLY)
                    .toString(),
                "Raised POLY not changed as expected"
            );
            assert.equal(final_WalletETHBal.toString(), init_WalletETHBal.toString(), "Wallet ETH Balance not changed as expected");
            assert.equal(
                final_WalletPOLYBal.toString(),
                init_WalletPOLYBal
                    .add(investment_POLY)
                    .sub(refund_POLY)
                    .toString(),
                "Wallet POLY Balance not changed as expected"
            );
        });

        it("should fail and revert when NONACCREDITED cap reached", async () => {
            let stoId = 0;
            let tierId = 0;

            let investment_Token = new BN(50).mul(e18);
            let investment_USD = await convert(stoId, tierId, false, "TOKEN", "USD", investment_Token);
            let investment_ETH = await convert(stoId, tierId, false, "TOKEN", "ETH", investment_Token);
            let investment_POLY = await convert(stoId, tierId, false, "TOKEN", "POLY", investment_Token);

            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: NONACCREDITED1, gasPrice: GAS_PRICE });

            // Buy with ETH NONACCREDITED
            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, value: investment_ETH, gasPrice: GAS_PRICE }),
                "Over Non-accredited investor limit"
            );

            // Buy with POLY NONACCREDITED
            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, { from: NONACCREDITED1, gasPrice: GAS_PRICE }),
                "Over Non-accredited investor limit"
            );
        });

        it("should fail and revert despite oracle price change when NONACCREDITED cap reached", async () => {
            let stoId = 0;
            let tierId;

            // set new exchange rates
            let high_USDETH = new BN(1000).mul(e18); // 1000 USD per ETH
            let high_USDPOLY = new BN(50).mul(e16); // 0.5 USD per POLY
            let low_USDETH = new BN(250).mul(e18); // 250 USD per ETH
            let low_USDPOLY = new BN(20).mul(e16); // 0.2 USD per POLY

            let investment_USD = new BN(web3.utils.toWei("50")); // USD
            let investment_ETH_high = investment_USD.mul(e18).div(high_USDETH); // USD / USD/ETH = ETH
            let investment_POLY_high = investment_USD.mul(e18).div(high_USDPOLY); // USD / USD/POLY = POLY
            let investment_ETH_low = investment_USD.mul(e18).div(low_USDETH); // USD / USD/ETH = ETH
            let investment_POLY_low = investment_USD.mul(e18).div(low_USDPOLY); // USD / USD/POLY = POLY

            await I_PolyToken.getTokens(investment_POLY_low, NONACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY_low, { from: NONACCREDITED1 });

            // Change exchange rates up
            await I_USDOracle.changePrice(high_USDETH, { from: POLYMATH });
            await I_POLYOracle.changePrice(high_USDPOLY, { from: POLYMATH });

            // Buy with ETH NONACCREDITED
            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, {
                    from: NONACCREDITED1,
                    value: investment_ETH_high,
                    gasPrice: GAS_PRICE
                }),
                "Over Non-accredited investor limit"
            );

            // Buy with POLY NONACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY_high, { from: NONACCREDITED1, gasPrice: GAS_PRICE }),
                "Over Non-accredited investor limit"
            );

            // Change exchange rates down
            await I_USDOracle.changePrice(low_USDETH, { from: POLYMATH });
            await I_POLYOracle.changePrice(low_USDPOLY, { from: POLYMATH });

            // Buy with ETH NONACCREDITED
            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, {
                    from: NONACCREDITED1,
                    value: investment_ETH_low,
                    gasPrice: GAS_PRICE
                }),
                "Over Non-accredited investor limit"
            );

            // Buy with POLY NONACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY_low, { from: NONACCREDITED1, gasPrice: GAS_PRICE }),
                "Over Non-accredited investor limit"
            );

            // Reset exchange rates
            await I_USDOracle.changePrice(USDETH, { from: POLYMATH });
            await I_POLYOracle.changePrice(USDPOLY, { from: POLYMATH });
        });

        it("should successfully buy across tiers for NONACCREDITED ETH", async () => {
            let stoId = 1;
            let startTier = 0;
            let endTier = 1;

            assert.equal(
                (await I_USDTieredSTO_Array[stoId].currentTier.call()).toString(),
                startTier,
                "currentTier not changed as expected"
            );

            let delta_Token = new BN(5).mul(e18);
            let ethTier0 = await convert(stoId, startTier, false, "TOKEN", "ETH", delta_Token);
            let ethTier1 = await convert(stoId, endTier, false, "TOKEN", "ETH", delta_Token);

            let investment_Token = delta_Token.add(delta_Token); // 10 Token
            let investment_ETH = ethTier0.add(ethTier1); // 0.0025 ETH

            // Process investment
            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let init_InvestorETHBal = new BN(await web3.eth.getBalance(NONACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let init_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            let tx1 = await I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, {
                from: NONACCREDITED1,
                value: investment_ETH,
                gasPrice: GAS_PRICE
            });
            let gasCost1 = new BN(GAS_PRICE).mul(new BN(tx1.receipt.gasUsed));
            console.log("          Gas buyWithETH: ".grey + new BN(tx1.receipt.gasUsed).toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let final_InvestorETHBal = new BN(await web3.eth.getBalance(NONACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let final_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            assert.equal(
                final_TokenSupply.toString(),
                init_TokenSupply.add(investment_Token).toString(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toString(),
                init_InvestorTokenBal.add(investment_Token).toString(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_InvestorETHBal.toString(),
                init_InvestorETHBal
                    .sub(gasCost1)
                    .sub(investment_ETH)
                    .toString(),
                "Investor ETH Balance not changed as expected"
            );
            assert.equal(
                final_InvestorPOLYBal.toString(),
                init_InvestorPOLYBal.toString(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toString(),
                init_STOTokenSold.add(investment_Token).toString(),
                "STO Token Sold not changed as expected"
            );
            assert.equal(final_STOETHBal.toString(), init_STOETHBal.toString(), "STO ETH Balance not changed as expected");
            assert.equal(final_STOPOLYBal.toString(), init_STOPOLYBal.toString(), "STO POLY Balance not changed as expected");
            assert.equal(final_RaisedETH.toString(), init_RaisedETH.add(investment_ETH).toString(), "Raised ETH not changed as expected");
            assert.equal(final_RaisedPOLY.toString(), init_RaisedPOLY.toString(), "Raised POLY not changed as expected");
            assert.equal(
                final_WalletETHBal.toString(),
                init_WalletETHBal.add(investment_ETH).toString(),
                "Wallet ETH Balance not changed as expected"
            );
            assert.equal(final_WalletPOLYBal.toString(), init_WalletPOLYBal.toString(), "Wallet POLY Balance not changed as expected");

            // Additional Checks
            assert.equal((await I_USDTieredSTO_Array[stoId].currentTier.call()).toString(), endTier, "currentTier not changed as expected");
        });

        it("should successfully buy across tiers for NONACCREDITED POLY", async () => {
            let stoId = 1;
            let startTier = 1;
            let endTier = 2;

            assert.equal(
                (await I_USDTieredSTO_Array[stoId].currentTier.call()).toString(),
                startTier,
                "currentTier not changed as expected"
            );

            let delta_Token = new BN(5).mul(e18); // Token
            let polyTier0 = await convert(stoId, startTier, false, "TOKEN", "POLY", delta_Token);
            let polyTier1 = await convert(stoId, endTier, false, "TOKEN", "POLY", delta_Token);

            let investment_Token = delta_Token.add(delta_Token); // 10 Token
            let investment_POLY = polyTier0.add(polyTier1); // 0.0025 ETH

            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: NONACCREDITED1 });

            // Process investment
            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let init_InvestorETHBal = new BN(await web3.eth.getBalance(NONACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let init_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            let tx2 = await I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, {
                from: NONACCREDITED1,
                gasPrice: GAS_PRICE
            });
            let gasCost2 = new BN(GAS_PRICE).mul(new BN(tx2.receipt.gasUsed));
            console.log("          Gas buyWithPOLY: ".grey + new BN(tx2.receipt.gasUsed).toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let final_InvestorETHBal = new BN(await web3.eth.getBalance(NONACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let final_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            assert.equal(
                final_TokenSupply.toString(),
                init_TokenSupply.add(investment_Token).toString(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toString(),
                init_InvestorTokenBal.add(investment_Token).toString(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_InvestorETHBal.toString(),
                init_InvestorETHBal.sub(gasCost2).toString(),
                "Investor ETH Balance not changed as expected"
            );
            assert.equal(
                final_InvestorPOLYBal.toString(),
                init_InvestorPOLYBal.sub(investment_POLY).toString(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toString(),
                init_STOTokenSold.add(investment_Token).toString(),
                "STO Token Sold not changed as expected"
            );
            assert.equal(final_STOETHBal.toString(), init_STOETHBal.toString(), "STO ETH Balance not changed as expected");
            assert.equal(final_STOPOLYBal.toString(), init_STOPOLYBal.toString(), "STO POLY Balance not changed as expected");
            assert.equal(final_RaisedETH.toString(), init_RaisedETH.toString(), "Raised ETH not changed as expected");
            assert.equal(
                final_RaisedPOLY.toString(),
                init_RaisedPOLY.add(investment_POLY).toString(),
                "Raised POLY not changed as expected"
            );
            assert.equal(final_WalletETHBal.toString(), init_WalletETHBal.toString(), "Wallet ETH Balance not changed as expected");
            assert.equal(
                final_WalletPOLYBal.toString(),
                init_WalletPOLYBal.add(investment_POLY).toString(),
                "Wallet POLY Balance not changed as expected"
            );

            // Additional Checks
            assert.equal((await I_USDTieredSTO_Array[stoId].currentTier.call()).toString(), endTier, "currentTier not changed as expected");
        });

        it("should successfully buy across tiers for ACCREDITED ETH", async () => {
            let stoId = 1;
            let startTier = 2;
            let endTier = 3;

            assert.equal(
                (await I_USDTieredSTO_Array[stoId].currentTier.call()).toString(),
                startTier,
                "currentTier not changed as expected"
            );

            let delta_Token = new BN(5).mul(e18); // Token
            let ethTier0 = await convert(stoId, startTier, false, "TOKEN", "ETH", delta_Token);
            let ethTier1 = await convert(stoId, endTier, false, "TOKEN", "ETH", delta_Token);

            let investment_Token = delta_Token.add(delta_Token); // 10 Token
            let investment_ETH = ethTier0.add(ethTier1); // 0.0025 ETH

            // Process investment
            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let init_InvestorETHBal = new BN(await web3.eth.getBalance(ACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let init_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            let tx1 = await I_USDTieredSTO_Array[stoId].buyWithETH(ACCREDITED1, {
                from: ACCREDITED1,
                value: investment_ETH,
                gasPrice: GAS_PRICE
            });
            let gasCost1 = new BN(GAS_PRICE).mul(new BN(tx1.receipt.gasUsed));
            console.log("          Gas buyWithETH: ".grey + new BN(tx1.receipt.gasUsed).toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let final_InvestorETHBal = new BN(await web3.eth.getBalance(ACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let final_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            assert.equal(
                final_TokenSupply.toString(),
                init_TokenSupply.add(investment_Token).toString(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toString(),
                init_InvestorTokenBal.add(investment_Token).toString(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_InvestorETHBal.toString(),
                init_InvestorETHBal
                    .sub(gasCost1)
                    .sub(investment_ETH)
                    .toString(),
                "Investor ETH Balance not changed as expected"
            );
            assert.equal(
                final_InvestorPOLYBal.toString(),
                init_InvestorPOLYBal.toString(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toString(),
                init_STOTokenSold.add(investment_Token).toString(),
                "STO Token Sold not changed as expected"
            );
            assert.equal(final_STOETHBal.toString(), init_STOETHBal.toString(), "STO ETH Balance not changed as expected");
            assert.equal(final_STOPOLYBal.toString(), init_STOPOLYBal.toString(), "STO POLY Balance not changed as expected");
            assert.equal(final_RaisedETH.toString(), init_RaisedETH.add(investment_ETH).toString(), "Raised ETH not changed as expected");
            assert.equal(final_RaisedPOLY.toString(), init_RaisedPOLY.toString(), "Raised POLY not changed as expected");
            assert.equal(
                final_WalletETHBal.toString(),
                init_WalletETHBal.add(investment_ETH).toString(),
                "Wallet ETH Balance not changed as expected"
            );
            assert.equal(final_WalletPOLYBal.toString(), init_WalletPOLYBal.toString(), "Wallet POLY Balance not changed as expected");

            // Additional Checks
            assert.equal((await I_USDTieredSTO_Array[stoId].currentTier.call()).toString(), endTier, "currentTier not changed as expected");
        });

        it("should successfully buy across tiers for ACCREDITED DAI", async () => {
            let stoId = 1;
            let startTier = 3;
            let endTier = 4;

            assert.equal(
                (await I_USDTieredSTO_Array[stoId].currentTier.call()).toString(),
                startTier,
                "currentTier not changed as expected"
            );

            let delta_Token = new BN(5).mul(e18); // Token
            let daiTier0 = await convert(stoId, startTier, false, "TOKEN", "USD", delta_Token);
            let daiTier1 = await convert(stoId, endTier, false, "TOKEN", "USD", delta_Token);

            let investment_Token = delta_Token.add(delta_Token); // 10 Token
            let investment_DAI = daiTier0.add(daiTier1);

            await I_DaiToken.getTokens(investment_DAI, ACCREDITED1);
            await I_DaiToken.approve(I_USDTieredSTO_Array[stoId].address, investment_DAI, { from: ACCREDITED1 });

            // Process investment
            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let init_InvestorETHBal = new BN(await web3.eth.getBalance(ACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let init_InvestorDAIBal = await I_DaiToken.balanceOf(ACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let init_RaisedDAI = await I_USDTieredSTO_Array[stoId].fundsRaised.call(DAI);
            let init_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);
            let init_WalletDAIBal = await I_DaiToken.balanceOf(WALLET);

            let tx2 = await I_USDTieredSTO_Array[stoId].buyWithUSD(ACCREDITED1, investment_DAI, I_DaiToken.address, { from: ACCREDITED1, gasPrice: GAS_PRICE });
            let gasCost2 = new BN(GAS_PRICE).mul(new BN(tx2.receipt.gasUsed));
            console.log("          Gas buyWithUSD: ".grey + new BN(tx2.receipt.gasUsed).toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let final_InvestorETHBal = new BN(await web3.eth.getBalance(ACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let final_InvestorDAIBal = await I_DaiToken.balanceOf(ACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let final_RaisedDAI = await I_USDTieredSTO_Array[stoId].fundsRaised.call(DAI);
            let final_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);
            let final_WalletDAIBal = await I_DaiToken.balanceOf(WALLET);

            assert.equal(
                final_TokenSupply.toString(),
                init_TokenSupply.add(investment_Token).toString(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toString(),
                init_InvestorTokenBal.add(investment_Token).toString(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_InvestorETHBal.toString(),
                init_InvestorETHBal.sub(gasCost2).toString(),
                "Investor ETH Balance not changed as expected"
            );
            assert.equal(
                final_InvestorPOLYBal.toString(),
                init_InvestorPOLYBal.toString(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_InvestorDAIBal.toString(),
                init_InvestorDAIBal.sub(investment_DAI).toString(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toString(),
                init_STOTokenSold.add(investment_Token).toString(),
                "STO Token Sold not changed as expected"
            );
            assert.equal(final_STOETHBal.toString(), init_STOETHBal.toString(), "STO ETH Balance not changed as expected");
            assert.equal(final_STOPOLYBal.toString(), init_STOPOLYBal.toString(), "STO POLY Balance not changed as expected");
            assert.equal(final_RaisedETH.toString(), init_RaisedETH.toString(), "Raised ETH not changed as expected");
            assert.equal(final_RaisedPOLY.toString(), init_RaisedPOLY.toString(), "Raised POLY not changed as expected");
            assert.equal(final_RaisedDAI.toString(), init_RaisedDAI.add(investment_DAI).toString(), "Raised DAI not changed as expected");
            assert.equal(final_WalletETHBal.toString(), init_WalletETHBal.toString(), "Wallet ETH Balance not changed as expected");
            assert.equal(final_WalletPOLYBal.toString(), init_WalletPOLYBal.toString(), "Wallet POLY Balance not changed as expected");
            assert.equal(
                final_WalletDAIBal.toString(),
                init_WalletDAIBal.add(investment_DAI).toString(),
                "Wallet POLY Balance not changed as expected"
            );

            // Additional Checks
            assert.equal((await I_USDTieredSTO_Array[stoId].currentTier.call()).toString(), endTier, "currentTier not changed as expected");
        });

        it("should successfully buy across tiers for ACCREDITED POLY", async () => {
            let stoId = 1;
            let startTier = 4;
            let endTier = 5;

            assert.equal(
                (await I_USDTieredSTO_Array[stoId].currentTier.call()).toString(),
                startTier,
                "currentTier not changed as expected"
            );

            let delta_Token = new BN(5).mul(e18); // Token
            let polyTier0 = await convert(stoId, startTier, false, "TOKEN", "POLY", delta_Token);
            let polyTier1 = await convert(stoId, endTier, false, "TOKEN", "POLY", delta_Token);

            let investment_Token = delta_Token.add(delta_Token); // 10 Token
            let investment_POLY = polyTier0.add(polyTier1); // 0.0025 ETH

            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: ACCREDITED1 });

            // Process investment
            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let init_InvestorETHBal = new BN(await web3.eth.getBalance(ACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let init_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            let tx2 = await I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, {
                from: ACCREDITED1,
                gasPrice: GAS_PRICE
            });
            let gasCost2 = new BN(GAS_PRICE).mul(new BN(tx2.receipt.gasUsed));
            console.log("          Gas buyWithPOLY: ".grey + new BN(tx2.receipt.gasUsed).toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let final_InvestorETHBal = new BN(await web3.eth.getBalance(ACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let final_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            assert.equal(
                final_TokenSupply.toString(),
                init_TokenSupply.add(investment_Token).toString(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toString(),
                init_InvestorTokenBal.add(investment_Token).toString(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_InvestorETHBal.toString(),
                init_InvestorETHBal.sub(gasCost2).toString(),
                "Investor ETH Balance not changed as expected"
            );
            assert.equal(
                final_InvestorPOLYBal.toString(),
                init_InvestorPOLYBal.sub(investment_POLY).toString(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toString(),
                init_STOTokenSold.add(investment_Token).toString(),
                "STO Token Sold not changed as expected"
            );
            assert.equal(final_STOETHBal.toString(), init_STOETHBal.toString(), "STO ETH Balance not changed as expected");
            assert.equal(final_STOPOLYBal.toString(), init_STOPOLYBal.toString(), "STO POLY Balance not changed as expected");
            assert.equal(final_RaisedETH.toString(), init_RaisedETH.toString(), "Raised ETH not changed as expected");
            assert.equal(
                final_RaisedPOLY.toString(),
                init_RaisedPOLY.add(investment_POLY).toString(),
                "Raised POLY not changed as expected"
            );
            assert.equal(final_WalletETHBal.toString(), init_WalletETHBal.toString(), "Wallet ETH Balance not changed as expected");
            assert.equal(
                final_WalletPOLYBal.toString(),
                init_WalletPOLYBal.add(investment_POLY).toString(),
                "Wallet POLY Balance not changed as expected"
            );

            // Additional Checks
            assert.equal((await I_USDTieredSTO_Array[stoId].currentTier.call()).toString(), endTier, "currentTier not changed as expected");
        });

        it("should buy out the rest of the sto", async () => {
            let stoId = 1;
            let tierId = 5;

            let minted = (await I_USDTieredSTO_Array[stoId].tiers.call(tierId))[4];
            console.log(minted.toString() + ":" + _tokensPerTierTotal[stoId][tierId]);
            let investment_Token = new BN(_tokensPerTierTotal[stoId][tierId]).sub(minted);
            console.log(investment_Token.toString());
            let investment_ETH = await convert(stoId, tierId, false, "TOKEN", "ETH", investment_Token);

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();

            let tx = await I_USDTieredSTO_Array[stoId].buyWithETH(ACCREDITED1, {
                from: ACCREDITED1,
                value: investment_ETH,
                gasPrice: GAS_PRICE
            });
            console.log("          Gas buyWithETH: ".grey + tx.receipt.gasUsed.toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();

            assert.equal(
                final_TokenSupply.toString(),
                init_TokenSupply.add(investment_Token).toString(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toString(),
                init_InvestorTokenBal.add(investment_Token).toString(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toString(),
                init_STOTokenSold.add(investment_Token).toString(),
                "STO Token Sold not changed as expected"
            );
            // assert.equal((await I_USDTieredSTO_Array[1].getTokensMinted()).toString(), _tokensPerTierTotal[1].reduce((a, b) => a + b, 0).toString(), "STO Token Sold not changed as expected");
        });

        it("should fail and revert when all tiers sold out", async () => {
            let stoId = 1;
            let tierId = 4;

            let investment_Token = new BN(5).mul(e18);
            let investment_USD = await convert(stoId, tierId, false, "TOKEN", "USD", investment_Token);
            let investment_ETH = await convert(stoId, tierId, false, "TOKEN", "ETH", investment_Token);
            let investment_POLY = await convert(stoId, tierId, false, "TOKEN", "POLY", investment_Token);
            let investment_DAI = investment_USD;

            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: NONACCREDITED1, gasPrice: GAS_PRICE });

            await I_DaiToken.getTokens(investment_DAI, NONACCREDITED1);
            await I_DaiToken.approve(I_USDTieredSTO_Array[stoId].address, investment_DAI, { from: NONACCREDITED1, gasPrice: GAS_PRICE });

            assert.equal(await I_USDTieredSTO_Array[stoId].isOpen(), false, "STO is not showing correct status");

            // Buy with ETH NONACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, value: investment_ETH, gasPrice: GAS_PRICE }),
                "STO not open"
            );

            // Buy with POLY NONACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, { from: NONACCREDITED1, gasPrice: GAS_PRICE }),
                "STO not open"
            );

            // Buy with DAI NONACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithUSD(NONACCREDITED1, investment_DAI, I_DaiToken.address, { from: NONACCREDITED1, gasPrice: GAS_PRICE }),
                "STO not open"
            );

            // Buy with ETH ACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithETH(ACCREDITED1, { from: ACCREDITED1, value: investment_ETH, gasPrice: GAS_PRICE }),
                "STO not open"
            );

            // Buy with POLY ACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, { from: ACCREDITED1, gasPrice: GAS_PRICE }),
                "STO not open"
            );

            // Buy with DAI ACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithUSD(ACCREDITED1, investment_DAI, I_DaiToken.address, { from: ACCREDITED1, gasPrice: GAS_PRICE }),
                "STO not open"
            );
        });

        it("should fail and revert when all tiers sold out despite oracle price change", async () => {
            let stoId = 1;
            let tierId = 4;

            // set new exchange rates
            let high_USDETH = new BN(1000).mul(e18); // 1000 USD per ETH
            let high_USDPOLY = new BN(50).mul(e16); // 0.5 USD per POLY
            let low_USDETH = new BN(250).mul(e18); // 250 USD per ETH
            let low_USDPOLY = new BN(20).mul(e16); // 0.2 USD per POLY

            let investment_USD = new BN(web3.utils.toWei("50")); // USD
            let investment_ETH_high = investment_USD.mul(e18).div(high_USDETH); // USD / USD/ETH = ETH
            let investment_POLY_high = investment_USD.mul(e18).div(high_USDPOLY); // USD / USD/POLY = POLY
            let investment_ETH_low = investment_USD.mul(e18).div(low_USDETH); // USD / USD/ETH = ETH
            let investment_POLY_low = investment_USD.mul(e18).div(low_USDPOLY); // USD / USD/POLY = POLY

            await I_PolyToken.getTokens(investment_POLY_low, NONACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY_low, { from: NONACCREDITED1 });
            await I_PolyToken.getTokens(investment_POLY_low, ACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY_low, { from: ACCREDITED1 });

            // Change exchange rates up
            await I_USDOracle.changePrice(high_USDETH, { from: POLYMATH });
            await I_POLYOracle.changePrice(high_USDPOLY, { from: POLYMATH });

            // Buy with ETH NONACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, {
                    from: NONACCREDITED1,
                    value: investment_ETH_high,
                    gasPrice: GAS_PRICE
                }),
                "STO not open"
            );

            // Buy with POLY NONACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY_high, { from: NONACCREDITED1, gasPrice: GAS_PRICE }),
                "STO not open"
            );

            // Buy with ETH ACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithETH(ACCREDITED1, { from: ACCREDITED1, value: investment_ETH_high, gasPrice: GAS_PRICE }),
                "STO not open"
            );

            // Buy with POLY ACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY_high, { from: ACCREDITED1, gasPrice: GAS_PRICE }),
                "STO not open"
            );

            // Change exchange rates down
            await I_USDOracle.changePrice(low_USDETH, { from: POLYMATH });
            await I_POLYOracle.changePrice(low_USDPOLY, { from: POLYMATH });

            // Buy with ETH NONACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, {
                    from: NONACCREDITED1,
                    value: investment_ETH_low,
                    gasPrice: GAS_PRICE
                }),
                "STO not open"
            );

            // Buy with POLY NONACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY_low, { from: NONACCREDITED1, gasPrice: GAS_PRICE }),
                "STO not open"
            );

            // Buy with ETH ACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithETH(ACCREDITED1, { from: ACCREDITED1, value: investment_ETH_low, gasPrice: GAS_PRICE }),
                "STO not open"
            );

            // Buy with POLY ACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY_low, { from: ACCREDITED1, gasPrice: GAS_PRICE }),
                "STO not open"
            );

            // Reset exchange rates
            await I_USDOracle.changePrice(USDETH, { from: POLYMATH });
            await I_POLYOracle.changePrice(USDPOLY, { from: POLYMATH });
        });
    });

    describe("Buy Tokens with POLY discount", async () => {
        it("should successfully buy using fallback at tier 0 for NONACCREDITED1", async () => {
            let stoId = 2;
            let tierId = 0;

            let investment_Token = new BN(5).mul(e18);
            let investment_USD = await convert(stoId, tierId, false, "TOKEN", "USD", investment_Token);
            let investment_ETH = await convert(stoId, tierId, false, "TOKEN", "ETH", investment_Token);
            let investment_POLY = await convert(stoId, tierId, false, "TOKEN", "POLY", investment_Token);

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let init_InvestorETHBal = new BN(await web3.eth.getBalance(NONACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedUSD = await I_USDTieredSTO_Array[stoId].fundsRaisedUSD.call();
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let init_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            let tx1 = await web3.eth.sendTransaction({
                from: NONACCREDITED1,
                to: I_USDTieredSTO_Array[stoId].address,
                value: investment_ETH,
                gasPrice: GAS_PRICE,
                gas: 7000000
            });
            let gasCost1 = new BN(GAS_PRICE).mul(new BN(tx1.gasUsed));
            console.log("          Gas fallback purchase: ".grey + new BN(tx1.gasUsed).toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let final_InvestorETHBal = new BN(await web3.eth.getBalance(NONACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedUSD = await I_USDTieredSTO_Array[stoId].fundsRaisedUSD.call();
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let final_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            assert.equal(
                final_TokenSupply.toString(),
                init_TokenSupply.add(investment_Token).toString(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toString(),
                init_InvestorTokenBal.add(investment_Token).toString(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_InvestorETHBal.toString(),
                init_InvestorETHBal
                    .sub(gasCost1)
                    .sub(investment_ETH)
                    .toString(),
                "Investor ETH Balance not changed as expected"
            );
            assert.equal(
                final_InvestorPOLYBal.toString(),
                init_InvestorPOLYBal.toString(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toString(),
                init_STOTokenSold.add(investment_Token).toString(),
                "STO Token Sold not changed as expected"
            );
            assert.equal(final_STOETHBal.toString(), init_STOETHBal.toString(), "STO ETH Balance not changed as expected");
            assert.equal(final_STOPOLYBal.toString(), init_STOPOLYBal.toString(), "STO POLY Balance not changed as expected");
            assert.equal(final_RaisedUSD.toString(), init_RaisedUSD.add(investment_USD).toString(), "Raised USD not changed as expected");
            assert.equal(final_RaisedETH.toString(), init_RaisedETH.add(investment_ETH).toString(), "Raised ETH not changed as expected");
            assert.equal(final_RaisedPOLY.toString(), init_RaisedPOLY.toString(), "Raised POLY not changed as expected");
            assert.equal(
                final_WalletETHBal.toString(),
                init_WalletETHBal.add(investment_ETH).toString(),
                "Wallet ETH Balance not changed as expected"
            );
            assert.equal(final_WalletPOLYBal.toString(), init_WalletPOLYBal.toString(), "Wallet POLY Balance not changed as expected");

            // Additional checks on getters
            assert.equal((await I_USDTieredSTO_Array[stoId].investorCount.call()).toString(), 1, "Investor count not changed as expected");
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].getTokensSold()).toString(),
                investment_Token.toString(),
                "getTokensSold not changed as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].getTokensMinted()).toString(),
                investment_Token.toString(),
                "getTokensMinted not changed as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].getTokensSoldFor(ETH)).toString(),
                investment_Token.toString(),
                "getTokensSoldForETH not changed as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].getTokensSoldFor(POLY)).toString(),
                new BN(0),
                "getTokensSoldForPOLY not changed as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].investorInvestedUSD.call(NONACCREDITED1)).toString(),
                investment_USD.toString(),
                "investorInvestedUSD not changed as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].investorInvested.call(NONACCREDITED1, ETH)).toString(),
                investment_ETH.toString(),
                "investorInvestedETH not changed as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].investorInvested.call(NONACCREDITED1, POLY)).toString(),
                new BN(0),
                "investorInvestedPOLY not changed as expected"
            );
        });

        it("should successfully buy using buyWithETH at tier 0 for NONACCREDITED1", async () => {
            let stoId = 2;
            let tierId = 0;

            let investment_Token = new BN(5).mul(e18);
            let investment_USD = await convert(stoId, tierId, false, "TOKEN", "USD", investment_Token);
            let investment_ETH = await convert(stoId, tierId, false, "TOKEN", "ETH", investment_Token);
            let investment_POLY = await convert(stoId, tierId, false, "TOKEN", "POLY", investment_Token);

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let init_InvestorETHBal = new BN(await web3.eth.getBalance(NONACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let init_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            let tx1 = await I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, {
                from: NONACCREDITED1,
                value: investment_ETH,
                gasPrice: GAS_PRICE
            });
            let gasCost1 = new BN(GAS_PRICE).mul(new BN(tx1.receipt.gasUsed));
            console.log("          Gas buyWithETH: ".grey + new BN(tx1.receipt.gasUsed).toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let final_InvestorETHBal = new BN(await web3.eth.getBalance(NONACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let final_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            assert.equal(
                final_TokenSupply.toString(),
                init_TokenSupply.add(investment_Token).toString(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toString(),
                init_InvestorTokenBal.add(investment_Token).toString(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_InvestorETHBal.toString(),
                init_InvestorETHBal
                    .sub(gasCost1)
                    .sub(investment_ETH)
                    .toString(),
                "Investor ETH Balance not changed as expected"
            );
            assert.equal(
                final_InvestorPOLYBal.toString(),
                init_InvestorPOLYBal.toString(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toString(),
                init_STOTokenSold.add(investment_Token).toString(),
                "STO Token Sold not changed as expected"
            );
            assert.equal(final_STOETHBal.toString(), init_STOETHBal.toString(), "STO ETH Balance not changed as expected");
            assert.equal(final_STOPOLYBal.toString(), init_STOPOLYBal.toString(), "STO POLY Balance not changed as expected");
            assert.equal(final_RaisedETH.toString(), init_RaisedETH.add(investment_ETH).toString(), "Raised ETH not changed as expected");
            assert.equal(final_RaisedPOLY.toString(), init_RaisedPOLY.toString(), "Raised POLY not changed as expected");
            assert.equal(
                final_WalletETHBal.toString(),
                init_WalletETHBal.add(investment_ETH).toString(),
                "Wallet ETH Balance not changed as expected"
            );
            assert.equal(final_WalletPOLYBal.toString(), init_WalletPOLYBal.toString(), "Wallet POLY Balance not changed as expected");
        });

        it("should successfully buy using buyWithPOLY at tier 0 for NONACCREDITED1", async () => {
            let stoId = 2;
            let tierId = 0;

            let investment_Token = new BN(5).mul(e18);
            let investment_USD = await convert(stoId, tierId, true, "TOKEN", "USD", investment_Token);
            let investment_ETH = await convert(stoId, tierId, true, "TOKEN", "ETH", investment_Token);
            let investment_POLY = await convert(stoId, tierId, true, "TOKEN", "POLY", investment_Token);

            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: NONACCREDITED1 });

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let init_InvestorETHBal = new BN(await web3.eth.getBalance(NONACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let init_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            // Buy With POLY
            let tx2 = await I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, {
                from: NONACCREDITED1,
                gasPrice: GAS_PRICE
            });
            let gasCost2 = new BN(GAS_PRICE).mul(new BN(tx2.receipt.gasUsed));
            console.log("          Gas buyWithPOLY: ".grey + new BN(tx2.receipt.gasUsed).toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let final_InvestorETHBal = new BN(await web3.eth.getBalance(NONACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let final_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            assert.equal(
                final_TokenSupply.toString(),
                init_TokenSupply.add(investment_Token).toString(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toString(),
                init_InvestorTokenBal.add(investment_Token).toString(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_InvestorETHBal.toString(),
                init_InvestorETHBal.sub(gasCost2).toString(),
                "Investor ETH Balance not changed as expected"
            );
            assert.equal(
                final_InvestorPOLYBal.toString(),
                init_InvestorPOLYBal.sub(investment_POLY).toString(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toString(),
                init_STOTokenSold.add(investment_Token).toString(),
                "STO Token Sold not changed as expected"
            );
            assert.equal(final_STOETHBal.toString(), init_STOETHBal.toString(), "STO ETH Balance not changed as expected");
            assert.equal(final_STOPOLYBal.toString(), init_STOPOLYBal.toString(), "STO POLY Balance not changed as expected");
            assert.equal(final_RaisedETH.toString(), init_RaisedETH.toString(), "Raised ETH not changed as expected");
            assert.equal(
                final_RaisedPOLY.toString(),
                init_RaisedPOLY.add(investment_POLY).toString(),
                "Raised POLY not changed as expected"
            );
            assert.equal(final_WalletETHBal.toString(), init_WalletETHBal.toString(), "Wallet ETH Balance not changed as expected");
            assert.equal(
                final_WalletPOLYBal.toString(),
                init_WalletPOLYBal.add(investment_POLY).toString(),
                "Wallet POLY Balance not changed as expected"
            );
        });

        it("should successfully buy using fallback at tier 0 for ACCREDITED1", async () => {
            let stoId = 2;
            let tierId = 0;

            let investment_Token = new BN(5).mul(e18);
            let investment_USD = await convert(stoId, tierId, false, "TOKEN", "USD", investment_Token);
            let investment_ETH = await convert(stoId, tierId, false, "TOKEN", "ETH", investment_Token);
            let investment_POLY = await convert(stoId, tierId, false, "TOKEN", "POLY", investment_Token);

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let init_InvestorETHBal = new BN(await web3.eth.getBalance(ACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let init_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            let tx1 = await web3.eth.sendTransaction({
                from: ACCREDITED1,
                to: I_USDTieredSTO_Array[stoId].address,
                value: investment_ETH,
                gasPrice: GAS_PRICE,
                gas: 7000000
            });
            let gasCost1 = new BN(GAS_PRICE).mul(new BN(tx1.gasUsed));
            console.log("          Gas fallback purchase: ".grey + new BN(tx1.gasUsed).toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let final_InvestorETHBal = new BN(await web3.eth.getBalance(ACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let final_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            assert.equal(
                final_TokenSupply.toString(),
                init_TokenSupply.add(investment_Token).toString(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toString(),
                init_InvestorTokenBal.add(investment_Token).toString(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_InvestorETHBal.toString(),
                init_InvestorETHBal
                    .sub(gasCost1)
                    .sub(investment_ETH)
                    .toString(),
                "Investor ETH Balance not changed as expected"
            );
            assert.equal(
                final_InvestorPOLYBal.toString(),
                init_InvestorPOLYBal.toString(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toString(),
                init_STOTokenSold.add(investment_Token).toString(),
                "STO Token Sold not changed as expected"
            );
            assert.equal(final_STOETHBal.toString(), init_STOETHBal.toString(), "STO ETH Balance not changed as expected");
            assert.equal(final_STOPOLYBal.toString(), init_STOPOLYBal.toString(), "STO POLY Balance not changed as expected");
            assert.equal(final_RaisedETH.toString(), init_RaisedETH.add(investment_ETH).toString(), "Raised ETH not changed as expected");
            assert.equal(final_RaisedPOLY.toString(), init_RaisedPOLY.toString(), "Raised POLY not changed as expected");
            assert.equal(
                final_WalletETHBal.toString(),
                init_WalletETHBal.add(investment_ETH).toString(),
                "Wallet ETH Balance not changed as expected"
            );
            assert.equal(final_WalletPOLYBal.toString(), init_WalletPOLYBal.toString(), "Wallet POLY Balance not changed as expected");
        });

        it("should successfully buy using buyWithETH at tier 0 for ACCREDITED1", async () => {
            let stoId = 2;
            let tierId = 0;

            let investment_Token = new BN(5).mul(e18);
            let investment_USD = await convert(stoId, tierId, false, "TOKEN", "USD", investment_Token);
            let investment_ETH = await convert(stoId, tierId, false, "TOKEN", "ETH", investment_Token);
            let investment_POLY = await convert(stoId, tierId, false, "TOKEN", "POLY", investment_Token);

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let init_InvestorETHBal = new BN(await web3.eth.getBalance(ACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let init_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            let tx1 = await I_USDTieredSTO_Array[stoId].buyWithETH(ACCREDITED1, {
                from: ACCREDITED1,
                value: investment_ETH,
                gasPrice: GAS_PRICE
            });
            let gasCost1 = new BN(GAS_PRICE).mul(new BN(tx1.receipt.gasUsed));
            console.log("          Gas buyWithETH: ".grey + new BN(tx1.receipt.gasUsed).toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let final_InvestorETHBal = new BN(await web3.eth.getBalance(ACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let final_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            assert.equal(
                final_TokenSupply.toString(),
                init_TokenSupply.add(investment_Token).toString(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toString(),
                init_InvestorTokenBal.add(investment_Token).toString(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_InvestorETHBal.toString(),
                init_InvestorETHBal
                    .sub(gasCost1)
                    .sub(investment_ETH)
                    .toString(),
                "Investor ETH Balance not changed as expected"
            );
            assert.equal(
                final_InvestorPOLYBal.toString(),
                init_InvestorPOLYBal.toString(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toString(),
                init_STOTokenSold.add(investment_Token).toString(),
                "STO Token Sold not changed as expected"
            );
            assert.equal(final_STOETHBal.toString(), init_STOETHBal.toString(), "STO ETH Balance not changed as expected");
            assert.equal(final_STOPOLYBal.toString(), init_STOPOLYBal.toString(), "STO POLY Balance not changed as expected");
            assert.equal(final_RaisedETH.toString(), init_RaisedETH.add(investment_ETH).toString(), "Raised ETH not changed as expected");
            assert.equal(final_RaisedPOLY.toString(), init_RaisedPOLY.toString(), "Raised POLY not changed as expected");
            assert.equal(
                final_WalletETHBal.toString(),
                init_WalletETHBal.add(investment_ETH).toString(),
                "Wallet ETH Balance not changed as expected"
            );
            assert.equal(final_WalletPOLYBal.toString(), init_WalletPOLYBal.toString(), "Wallet POLY Balance not changed as expected");
        });

        it("should successfully buy using buyWithPOLY at tier 0 for ACCREDITED1", async () => {
            let stoId = 2;
            let tierId = 0;

            let investment_Token = new BN(5).mul(e18);
            let investment_USD = await convert(stoId, tierId, true, "TOKEN", "USD", investment_Token);
            let investment_ETH = await convert(stoId, tierId, true, "TOKEN", "ETH", investment_Token);
            let investment_POLY = await convert(stoId, tierId, true, "TOKEN", "POLY", investment_Token);

            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: ACCREDITED1 });

            // Additional checks on getters
            let init_getTokensSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_getTokensMinted = await I_USDTieredSTO_Array[stoId].getTokensMinted();
            let init_getTokensSoldForETH = await I_USDTieredSTO_Array[stoId].getTokensSoldFor(ETH);
            let init_getTokensSoldForPOLY = await I_USDTieredSTO_Array[stoId].getTokensSoldFor(POLY);
            let init_investorInvestedUSD = await I_USDTieredSTO_Array[stoId].investorInvestedUSD.call(ACCREDITED1);
            let init_investorInvestedETH = await I_USDTieredSTO_Array[stoId].investorInvested.call(ACCREDITED1, ETH);
            let init_investorInvestedPOLY = await I_USDTieredSTO_Array[stoId].investorInvested.call(ACCREDITED1, POLY);

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let init_InvestorETHBal = new BN(await web3.eth.getBalance(ACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let init_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            // Buy With POLY
            let tx2 = await I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, {
                from: ACCREDITED1,
                gasPrice: GAS_PRICE
            });
            let gasCost2 = new BN(GAS_PRICE).mul(new BN(tx2.receipt.gasUsed));
            console.log("          Gas buyWithPOLY: ".grey + new BN(tx2.receipt.gasUsed).toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let final_InvestorETHBal = new BN(await web3.eth.getBalance(ACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let final_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            assert.equal(
                final_TokenSupply.toString(),
                init_TokenSupply.add(investment_Token).toString(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toString(),
                init_InvestorTokenBal.add(investment_Token).toString(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_InvestorETHBal.toString(),
                init_InvestorETHBal.sub(gasCost2).toString(),
                "Investor ETH Balance not changed as expected"
            );
            assert.equal(
                final_InvestorPOLYBal.toString(),
                init_InvestorPOLYBal.sub(investment_POLY).toString(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toString(),
                init_STOTokenSold.add(investment_Token).toString(),
                "STO Token Sold not changed as expected"
            );
            assert.equal(final_STOETHBal.toString(), init_STOETHBal.toString(), "STO ETH Balance not changed as expected");
            assert.equal(final_STOPOLYBal.toString(), init_STOPOLYBal.toString(), "STO POLY Balance not changed as expected");
            assert.equal(final_RaisedETH.toString(), init_RaisedETH.toString(), "Raised ETH not changed as expected");
            assert.equal(
                final_RaisedPOLY.toString(),
                init_RaisedPOLY.add(investment_POLY).toString(),
                "Raised POLY not changed as expected"
            );
            assert.equal(final_WalletETHBal.toString(), init_WalletETHBal.toString(), "Wallet ETH Balance not changed as expected");
            assert.equal(
                final_WalletPOLYBal.toString(),
                init_WalletPOLYBal.add(investment_POLY).toString(),
                "Wallet POLY Balance not changed as expected"
            );

            // Additional checks on getters
            assert.equal((await I_USDTieredSTO_Array[stoId].investorCount.call()).toString(), 2, "Investor count not changed as expected");
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].getTokensSold()).toString(),
                init_getTokensSold.add(investment_Token).toString(),
                "getTokensSold not changed as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].getTokensMinted()).toString(),
                init_getTokensMinted.add(investment_Token).toString(),
                "getTokensMinted not changed as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].getTokensSoldFor(ETH)).toString(),
                init_getTokensSoldForETH.toString(),
                "getTokensSoldForETH not changed as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].getTokensSoldFor(POLY)).toString(),
                init_getTokensSoldForPOLY.add(investment_Token).toString(),
                "getTokensSoldForPOLY not changed as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].investorInvestedUSD.call(ACCREDITED1)).toString(),
                init_investorInvestedUSD.add(investment_USD).toString(),
                "investorInvestedUSD not changed as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].investorInvested.call(ACCREDITED1, ETH)).toString(),
                init_investorInvestedETH.toString(),
                "investorInvestedETH not changed as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].investorInvested.call(ACCREDITED1, POLY)).toString(),
                init_investorInvestedPOLY.add(investment_POLY).toString(),
                "investorInvestedPOLY not changed as expected"
            );
        });

        it("should successfully buy a partial amount and refund balance when reaching NONACCREDITED cap", async () => {
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
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: NONACCREDITED1 });

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let init_InvestorETHBal = new BN(await web3.eth.getBalance(NONACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let init_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            // Buy With POLY
            let tx2 = await I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, {
                from: NONACCREDITED1,
                gasPrice: GAS_PRICE
            });
            let gasCost2 = new BN(GAS_PRICE).mul(new BN(tx2.receipt.gasUsed));
            console.log("          Gas buyWithPOLY: ".grey + new BN(tx2.receipt.gasUsed).toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let final_InvestorETHBal = new BN(await web3.eth.getBalance(NONACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let final_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            assert.equal(
                final_TokenSupply.toString(),
                init_TokenSupply
                    .add(investment_Token)
                    .sub(refund_Token)
                    .toString(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toString(),
                init_InvestorTokenBal
                    .add(investment_Token)
                    .sub(refund_Token)
                    .toString(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_InvestorETHBal.toString(),
                init_InvestorETHBal.sub(gasCost2).toString(),
                "Investor ETH Balance not changed as expected"
            );
            assert.equal(
                final_InvestorPOLYBal.toString(),
                init_InvestorPOLYBal
                    .sub(investment_POLY)
                    .add(refund_POLY)
                    .toString(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toString(),
                init_STOTokenSold
                    .add(investment_Token)
                    .sub(refund_Token)
                    .toString(),
                "STO Token Sold not changed as expected"
            );
            assert.equal(final_STOETHBal.toString(), init_STOETHBal.toString(), "STO ETH Balance not changed as expected");
            assert.equal(final_STOPOLYBal.toString(), init_STOPOLYBal.toString(), "STO POLY Balance not changed as expected");
            assert.equal(final_RaisedETH.toString(), init_RaisedETH.toString(), "Raised ETH not changed as expected");
            assert.equal(
                final_RaisedPOLY.toString(),
                init_RaisedPOLY
                    .add(investment_POLY)
                    .sub(refund_POLY)
                    .toString(),
                "Raised POLY not changed as expected"
            );
            assert.equal(final_WalletETHBal.toString(), init_WalletETHBal.toString(), "Wallet ETH Balance not changed as expected");
            assert.equal(
                final_WalletPOLYBal.toString(),
                init_WalletPOLYBal
                    .add(investment_POLY)
                    .sub(refund_POLY)
                    .toString(),
                "Wallet POLY Balance not changed as expected"
            );
        });

        it("should successfully buy a granular amount and refund balance when buying indivisible token with POLY", async () => {
            await I_SecurityToken.changeGranularity(e18, { from: ISSUER });
            let stoId = 4;
            let tierId = 0;
            let investment_Tokens = new BN(1050).mul(e16);
            let investment_POLY = await convert(stoId, tierId, true, "TOKEN", "POLY", investment_Tokens);

            let refund_Tokens = new BN(50).mul(e16);
            let refund_POLY = await convert(stoId, tierId, true, "TOKEN", "POLY", refund_Tokens);

            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: ACCREDITED1 });

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let init_InvestorETHBal = new BN(await web3.eth.getBalance(ACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let init_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            let tokensToMint = (await I_USDTieredSTO_Array[stoId].buyWithPOLY.call(ACCREDITED1, investment_POLY, {from: ACCREDITED1}))[2];

            // Buy With POLY
            let tx2 = await I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, {
                from: ACCREDITED1,
                gasPrice: GAS_PRICE
            });
            let gasCost2 = new BN(GAS_PRICE).mul(new BN(tx2.receipt.gasUsed));
            console.log("          Gas buyWithPOLY: ".grey + new BN(tx2.receipt.gasUsed).toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let final_InvestorETHBal = new BN(await web3.eth.getBalance(ACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let final_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            assert.equal(
                final_TokenSupply.toString(),
                init_TokenSupply
                    .add(investment_Tokens)
                    .sub(refund_Tokens)
                    .toString(),
                "Token Supply not changed as expected"
            );
            assert.equal(tokensToMint.toString(), investment_Tokens.sub(refund_Tokens).toString(), "View function returned incorrect data");
            assert.equal(
                final_InvestorTokenBal.toString(),
                init_InvestorTokenBal
                    .add(investment_Tokens)
                    .sub(refund_Tokens)
                    .toString(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_InvestorETHBal.toString(),
                init_InvestorETHBal.sub(gasCost2).toString(),
                "Investor ETH Balance not changed as expected"
            );
            assert.equal(
                final_InvestorPOLYBal.toString(),
                init_InvestorPOLYBal
                    .sub(investment_POLY)
                    .add(refund_POLY)
                    .toString(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toString(),
                init_STOTokenSold
                    .add(investment_Tokens)
                    .sub(refund_Tokens)
                    .toString(),
                "STO Token Sold not changed as expected"
            );
            assert.equal(final_STOETHBal.toString(), init_STOETHBal.toString(), "STO ETH Balance not changed as expected");
            assert.equal(final_STOPOLYBal.toString(), init_STOPOLYBal.toString(), "STO POLY Balance not changed as expected");
            assert.equal(final_RaisedETH.toString(), init_RaisedETH.toString(), "Raised ETH not changed as expected");
            assert.equal(
                final_RaisedPOLY.toString(),
                init_RaisedPOLY
                    .add(investment_POLY)
                    .sub(refund_POLY)
                    .toString(),
                "Raised POLY not changed as expected"
            );
            assert.equal(final_WalletETHBal.toString(), init_WalletETHBal.toString(), "Wallet ETH Balance not changed as expected");
            assert.equal(
                final_WalletPOLYBal.toString(),
                init_WalletPOLYBal
                    .add(investment_POLY)
                    .sub(refund_POLY)
                    .toString(),
                "Wallet POLY Balance not changed as expected"
            );
            await I_SecurityToken.changeGranularity(1, { from: ISSUER });
        });

        it("should successfully buy a granular amount when buying indivisible token with illegal tier limits", async () => {
            await I_SecurityToken.changeGranularity(e18, { from: ISSUER });
            let stoId = 5;
            let tierId = 0;
            let investment_Tokens = new BN(110).mul(e18);
            let investment_POLY = await convert(stoId, tierId, false, "TOKEN", "POLY", investment_Tokens);

            let refund_Tokens = new BN(0);
            let refund_POLY = await convert(stoId, tierId, false, "TOKEN", "POLY", refund_Tokens);

            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: ACCREDITED1 });

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let init_InvestorETHBal = new BN(await web3.eth.getBalance(ACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let init_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            let tokensToMint = (await I_USDTieredSTO_Array[stoId].buyWithPOLY.call(ACCREDITED1, investment_POLY, {from: ACCREDITED1}))[2];

            // Buy With POLY
            let tx2 = await I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, {
                from: ACCREDITED1,
                gasPrice: GAS_PRICE
            });
            let gasCost2 = new BN(GAS_PRICE).mul(new BN(tx2.receipt.gasUsed));
            console.log("          Gas buyWithPOLY: ".grey + new BN(tx2.receipt.gasUsed).toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let final_InvestorETHBal = new BN(await web3.eth.getBalance(ACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let final_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            assert.equal(
                final_TokenSupply.toString(),
                init_TokenSupply
                    .add(investment_Tokens)
                    .sub(refund_Tokens)
                    .toString(),
                "Token Supply not changed as expected"
            );
            assert.equal(tokensToMint.toString(), investment_Tokens.sub(refund_Tokens).toString(), "View function returned incorrect data");
            assert.equal(
                final_InvestorTokenBal.toString(),
                init_InvestorTokenBal
                    .add(investment_Tokens)
                    .sub(refund_Tokens)
                    .toString(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_InvestorETHBal.toString(),
                init_InvestorETHBal.sub(gasCost2).toString(),
                "Investor ETH Balance not changed as expected"
            );
            assert.equal(
                final_InvestorPOLYBal.toString(),
                init_InvestorPOLYBal
                    .sub(investment_POLY)
                    .add(refund_POLY)
                    .toString(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toString(),
                init_STOTokenSold
                    .add(investment_Tokens)
                    .sub(refund_Tokens)
                    .toString(),
                "STO Token Sold not changed as expected"
            );
            assert.equal(final_STOETHBal.toString(), init_STOETHBal.toString(), "STO ETH Balance not changed as expected");
            assert.equal(final_STOPOLYBal.toString(), init_STOPOLYBal.toString(), "STO POLY Balance not changed as expected");
            assert.equal(final_RaisedETH.toString(), init_RaisedETH.toString(), "Raised ETH not changed as expected");
            assert.equal(
                final_RaisedPOLY.toString(),
                init_RaisedPOLY
                    .add(investment_POLY)
                    .sub(refund_POLY)
                    .toString(),
                "Raised POLY not changed as expected"
            );
            assert.equal(final_WalletETHBal.toString(), init_WalletETHBal.toString(), "Wallet ETH Balance not changed as expected");
            assert.equal(
                final_WalletPOLYBal.toString(),
                init_WalletPOLYBal
                    .add(investment_POLY)
                    .sub(refund_POLY)
                    .toString(),
                "Wallet POLY Balance not changed as expected"
            );
            await I_SecurityToken.changeGranularity(1, { from: ISSUER });
        });

        it("should successfully buy a granular amount and refund balance when buying indivisible token with ETH", async () => {
            await I_SecurityToken.changeGranularity(e18, { from: ISSUER });
            let stoId = 4;
            let tierId = 0;
            let investment_Tokens = new BN(1050).mul(e16);
            let investment_ETH = await convert(stoId, tierId, false, "TOKEN", "ETH", investment_Tokens);
            let refund_Tokens = new BN(50).mul(e16);
            let refund_ETH = await convert(stoId, tierId, false, "TOKEN", "ETH", refund_Tokens);

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let init_InvestorETHBal = new BN(await web3.eth.getBalance(ACCREDITED1));
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);

            // Buy With ETH
            let tx2 = await I_USDTieredSTO_Array[stoId].buyWithETH(ACCREDITED1, {
                from: ACCREDITED1,
                gasPrice: GAS_PRICE,
                value: investment_ETH
            });
            let gasCost2 = new BN(GAS_PRICE).mul(new BN(tx2.receipt.gasUsed));
            console.log("          Gas buyWithETH: ".grey + new BN(tx2.receipt.gasUsed).toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let final_InvestorETHBal = new BN(await web3.eth.getBalance(ACCREDITED1));
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);

            assert.equal(
                final_TokenSupply.toString(),
                init_TokenSupply
                    .add(investment_Tokens)
                    .sub(refund_Tokens)
                    .toString(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toString(),
                init_InvestorTokenBal
                    .add(investment_Tokens)
                    .sub(refund_Tokens)
                    .toString(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_InvestorETHBal.toString(),
                init_InvestorETHBal
                    .sub(investment_ETH)
                    .sub(gasCost2)
                    .add(refund_ETH)
                    .toString(),
                "Investor ETH Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toString(),
                init_STOTokenSold
                    .add(investment_Tokens)
                    .sub(refund_Tokens)
                    .toString(),
                "STO Token Sold not changed as expected"
            );
            assert.equal(final_STOETHBal.toString(), init_STOETHBal.toString(), "STO ETH Balance not changed as expected");
            assert.equal(final_STOPOLYBal.toString(), init_STOPOLYBal.toString(), "STO POLY Balance not changed as expected");
            assert.equal(
                final_RaisedETH.toString(),
                init_RaisedETH
                    .add(investment_ETH)
                    .sub(refund_ETH)
                    .toString(),
                "Raised ETH not changed as expected"
            );
            assert.equal(final_RaisedPOLY.toString(), init_RaisedPOLY, "Raised POLY not changed as expected");
            await I_SecurityToken.changeGranularity(1, { from: ISSUER });
        });

        it("should fail and revert when NONACCREDITED cap reached", async () => {
            let stoId = 2;
            let tierId = 0;

            let investment_Token = new BN(5).mul(e18);
            let investment_USD = await convert(stoId, tierId, true, "TOKEN", "USD", investment_Token);
            let investment_ETH = await convert(stoId, tierId, true, "TOKEN", "ETH", investment_Token);
            let investment_POLY = await convert(stoId, tierId, true, "TOKEN", "POLY", investment_Token);

            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: NONACCREDITED1, gasPrice: GAS_PRICE });

            // Buy with ETH NONACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, value: investment_ETH, gasPrice: GAS_PRICE }),
                "Over Non-accredited investor limit"
            );

            // Buy with POLY NONACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, { from: NONACCREDITED1, gasPrice: GAS_PRICE }),
                "Over Non-accredited investor limit"
            );
        });

        it("should fail when rate set my contract is too low", async () => {
            let stoId = 4;
            let tierId = 0;
            let investment_Tokens = new BN(e18);
            let investment_POLY = await convert(stoId, tierId, true, "TOKEN", "POLY", investment_Tokens);
            let investment_ETH = await convert(stoId, tierId, true, "TOKEN", "ETH", investment_Tokens);
            const minTokens = new BN(1000).mul(e18);

            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: ACCREDITED1 });

            // Buy With POLY
            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithPOLYRateLimited(ACCREDITED1, investment_POLY, minTokens, {
                    from: ACCREDITED1,
                    gasPrice: GAS_PRICE
                }),
                "Insufficient minted"
            );
            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithETHRateLimited(ACCREDITED1, minTokens, {
                    from: ACCREDITED1,
                    gasPrice: GAS_PRICE,
                    value: investment_ETH
                }),
                "Insufficient minted"
            );
        });

        it("should fail and revert despite oracle price change when NONACCREDITED cap reached", async () => {
            let stoId = 2;
            let tierId = 0;

            // set new exchange rates
            let high_USDETH = new BN(1000).mul(e18); // 1000 USD per ETH
            let high_USDPOLY = new BN(50).mul(e16); // 0.5 USD per POLY
            let low_USDETH = new BN(250).mul(e18); // 250 USD per ETH
            let low_USDPOLY = new BN(20).mul(e16); // 0.2 USD per POLY

            let investment_Token = new BN(5).mul(e18);
            let investment_USD = await convert(stoId, tierId, true, "TOKEN", "USD", investment_Token);

            let investment_ETH_high = investment_USD.mul(e18).div(high_USDETH); // USD / USD/ETH = ETH
            let investment_POLY_high = investment_USD.mul(e18).div(high_USDPOLY); // USD / USD/POLY = POLY
            let investment_ETH_low = investment_USD.mul(e18).div(low_USDETH); // USD / USD/ETH = ETH
            let investment_POLY_low = investment_USD.mul(e18).div(low_USDPOLY); // USD / USD/POLY = POLY

            await I_PolyToken.getTokens(investment_POLY_low, NONACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY_low, { from: NONACCREDITED1 });

            // Change exchange rates up
            await I_USDOracle.changePrice(high_USDETH, { from: POLYMATH });
            await I_POLYOracle.changePrice(high_USDPOLY, { from: POLYMATH });

            // Buy with ETH NONACCREDITED
            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, {
                    from: NONACCREDITED1,
                    value: investment_ETH_high,
                    gasPrice: GAS_PRICE
                }),
                "Over Non-accredited investor limit"
            );

            // Buy with POLY NONACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY_high, { from: NONACCREDITED1, gasPrice: GAS_PRICE }),
                "Over Non-accredited investor limit"
            );

            // Change exchange rates down
            await I_USDOracle.changePrice(low_USDETH, { from: POLYMATH });
            await I_POLYOracle.changePrice(low_USDPOLY, { from: POLYMATH });

            // Buy with ETH NONACCREDITED
            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, {
                    from: NONACCREDITED1,
                    value: investment_ETH_low,
                    gasPrice: GAS_PRICE
                }),
                "Over Non-accredited investor limit"
            );

            // Buy with POLY NONACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY_low, { from: NONACCREDITED1, gasPrice: GAS_PRICE }),
                "Over Non-accredited investor limit"
            );

            // Reset exchange rates
            await I_USDOracle.changePrice(USDETH, { from: POLYMATH });
            await I_POLYOracle.changePrice(USDPOLY, { from: POLYMATH });
        });

        it("should successfully buy across tiers for POLY", async () => {
            let stoId = 2;
            let startTier = 0;
            let endTier = 1;

            assert.equal(
                (await I_USDTieredSTO_Array[stoId].currentTier.call()).toString(),
                startTier,
                "currentTier not changed as expected"
            );

            let delta_Token = new BN(5).mul(e18); // Token
            let polyTier0 = await convert(stoId, startTier, true, "TOKEN", "POLY", delta_Token);
            let polyTier1 = await convert(stoId, endTier, true, "TOKEN", "POLY", delta_Token);
            let investment_Token = delta_Token.add(delta_Token); // 10 Token
            let investment_POLY = polyTier0.add(polyTier1); // 0.0025 ETH

            let tokensRemaining = (await I_USDTieredSTO_Array[stoId].tiers.call(startTier))[2].sub(
                (await I_USDTieredSTO_Array[stoId].tiers.call(startTier))[4]
            );
            let prep_Token = tokensRemaining.sub(delta_Token);
            let prep_POLY = await convert(stoId, startTier, true, "TOKEN", "POLY", prep_Token);

            await I_PolyToken.getTokens(prep_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, prep_POLY, { from: ACCREDITED1 });
            let tx = await I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, prep_POLY, { from: ACCREDITED1, gasPrice: GAS_PRICE });
            console.log("          Gas buyWithPOLY: ".grey + tx.receipt.gasUsed.toString().grey);

            let Tier0Token = (await I_USDTieredSTO_Array[stoId].tiers.call(startTier))[2];
            let Tier0Minted = (await I_USDTieredSTO_Array[stoId].tiers.call(startTier))[4];
            assert.equal(Tier0Minted.toString(), Tier0Token.sub(delta_Token).toString());

            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: ACCREDITED1 });

            // Process investment
            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let init_InvestorETHBal = new BN(await web3.eth.getBalance(ACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let init_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            let tx2 = await I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, {
                from: ACCREDITED1,
                gasPrice: GAS_PRICE
            });
            let gasCost2 = new BN(GAS_PRICE).mul(new BN(tx2.receipt.gasUsed));
            console.log("          Gas buyWithPOLY: ".grey + new BN(tx2.receipt.gasUsed).toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let final_InvestorETHBal = new BN(await web3.eth.getBalance(ACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let final_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            assert.equal(
                final_TokenSupply.toString(),
                init_TokenSupply.add(investment_Token).toString(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toString(),
                init_InvestorTokenBal.add(investment_Token).toString(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_InvestorETHBal.toString(),
                init_InvestorETHBal.sub(gasCost2).toString(),
                "Investor ETH Balance not changed as expected"
            );
            assert.equal(
                final_InvestorPOLYBal.toString(),
                init_InvestorPOLYBal.sub(investment_POLY).toString(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toString(),
                init_STOTokenSold.add(investment_Token).toString(),
                "STO Token Sold not changed as expected"
            );
            assert.equal(final_STOETHBal.toString(), init_STOETHBal.toString(), "STO ETH Balance not changed as expected");
            assert.equal(final_STOPOLYBal.toString(), init_STOPOLYBal.toString(), "STO POLY Balance not changed as expected");
            assert.equal(final_RaisedETH.toString(), init_RaisedETH.toString(), "Raised ETH not changed as expected");
            assert.equal(
                final_RaisedPOLY.toString(),
                init_RaisedPOLY.add(investment_POLY).toString(),
                "Raised POLY not changed as expected"
            );
            assert.equal(final_WalletETHBal.toString(), init_WalletETHBal.toString(), "Wallet ETH Balance not changed as expected");
            assert.equal(
                final_WalletPOLYBal.toString(),
                init_WalletPOLYBal.add(investment_POLY).toString(),
                "Wallet POLY Balance not changed as expected"
            );

            // Additional Checks
            assert.equal((await I_USDTieredSTO_Array[stoId].currentTier.call()).toString(), endTier, "currentTier not changed as expected");
        });

        it("should successfully buy across the discount cap", async () => {
            let stoId = 2;
            let tierId = 1;

            let discount_Token = new BN(20).mul(e18);
            let discount_POLY = await convert(stoId, tierId, true, "TOKEN", "POLY", discount_Token);

            let regular_Token = new BN(10).mul(e18);
            let regular_POLY = await convert(stoId, tierId, false, "TOKEN", "POLY", regular_Token);

            let investment_Token = discount_Token.add(regular_Token);
            let investment_POLY = discount_POLY.add(regular_POLY);

            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: ACCREDITED1 });

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let init_InvestorETHBal = new BN(await web3.eth.getBalance(ACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let init_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            // Buy With POLY
            let tx2 = await I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, {
                from: ACCREDITED1,
                gasPrice: GAS_PRICE
            });
            let gasCost2 = new BN(GAS_PRICE).mul(new BN(tx2.receipt.gasUsed));
            console.log("          Gas buyWithPOLY: ".grey + new BN(tx2.receipt.gasUsed).toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let final_InvestorETHBal = new BN(await web3.eth.getBalance(ACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BN(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let final_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            assert.equal(
                final_TokenSupply.toString(),
                init_TokenSupply.add(investment_Token).toString(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toString(),
                init_InvestorTokenBal.add(investment_Token).toString(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_InvestorETHBal.toString(),
                init_InvestorETHBal.sub(gasCost2).toString(),
                "Investor ETH Balance not changed as expected"
            );
            assert.equal(
                final_InvestorPOLYBal.toString(),
                init_InvestorPOLYBal.sub(investment_POLY).toString(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toString(),
                init_STOTokenSold.add(investment_Token).toString(),
                "STO Token Sold not changed as expected"
            );
            assert.equal(final_STOETHBal.toString(), init_STOETHBal.toString(), "STO ETH Balance not changed as expected");
            assert.equal(final_STOPOLYBal.toString(), init_STOPOLYBal.toString(), "STO POLY Balance not changed as expected");
            assert.equal(final_RaisedETH.toString(), init_RaisedETH.toString(), "Raised ETH not changed as expected");
            assert.equal(
                final_RaisedPOLY.toString(),
                init_RaisedPOLY.add(investment_POLY).toString(),
                "Raised POLY not changed as expected"
            );
            assert.equal(final_WalletETHBal.toString(), init_WalletETHBal.toString(), "Wallet ETH Balance not changed as expected");
            assert.equal(
                final_WalletPOLYBal.toString(),
                init_WalletPOLYBal.add(investment_POLY).toString(),
                "Wallet POLY Balance not changed as expected"
            );
        });

        it("should buy out the rest of the sto", async () => {
            let stoId = 2;
            let tierId = 1;

            let minted = (await I_USDTieredSTO_Array[stoId].tiers.call(tierId))[4];
            let investment_Token = new BN(_tokensPerTierTotal[stoId][tierId]).sub(minted);
            let investment_POLY = await convert(stoId, tierId, false, "TOKEN", "POLY", investment_Token);

            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: ACCREDITED1 });

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();

            // Buy With POLY
            let tx2 = await I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, {
                from: ACCREDITED1,
                gasPrice: GAS_PRICE
            });
            let gasCost2 = new BN(GAS_PRICE).mul(new BN(tx2.receipt.gasUsed));
            console.log("          Gas buyWithPOLY: ".grey + new BN(tx2.receipt.gasUsed).toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();

            assert.equal(
                final_TokenSupply.toString(),
                init_TokenSupply.add(investment_Token).toString(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toString(),
                init_InvestorTokenBal.add(investment_Token).toString(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toString(),
                init_STOTokenSold.add(investment_Token).toString(),
                "STO Token Sold not changed as expected"
            );
        });

        it("should fail and revert when all tiers sold out", async () => {
            let stoId = 2;
            let tierId = 1;

            let investment_Token = new BN(5).mul(e18);
            let investment_USD = await convert(stoId, tierId, false, "TOKEN", "USD", investment_Token);
            let investment_ETH = await convert(stoId, tierId, false, "TOKEN", "ETH", investment_Token);
            let investment_POLY = await convert(stoId, tierId, false, "TOKEN", "POLY", investment_Token);

            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: NONACCREDITED1, gasPrice: GAS_PRICE });

            assert.equal(await I_USDTieredSTO_Array[stoId].isOpen(), false, "STO is not showing correct status");

            // Buy with ETH NONACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, value: investment_ETH, gasPrice: GAS_PRICE }),
                "STO not open"
            );

            // Buy with POLY NONACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, { from: NONACCREDITED1, gasPrice: GAS_PRICE }),
                "STO not open"
            );

            // Buy with ETH ACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithETH(ACCREDITED1, { from: ACCREDITED1, value: investment_ETH, gasPrice: GAS_PRICE }),
                "STO not open"
            );

            // Buy with POLY ACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, { from: ACCREDITED1, gasPrice: GAS_PRICE }),
                "STO not open"
            );
        });

        it("should fail and revert when all tiers sold out despite oracle price change", async () => {
            let stoId = 2;
            let tierId = 1;

            // set new exchange rates
            let high_USDETH = new BN(1000).mul(e18); // 1000 USD per ETH
            let high_USDPOLY = new BN(50).mul(e16); // 0.5 USD per POLY
            let low_USDETH = new BN(250).mul(e18); // 250 USD per ETH
            let low_USDPOLY = new BN(20).mul(e16); // 0.2 USD per POLY

            let investment_Token = new BN(5).mul(e18);
            let investment_USD = await convert(stoId, tierId, true, "TOKEN", "USD", investment_Token);

            let investment_ETH_high = investment_USD.mul(e18).div(high_USDETH); // USD / USD/ETH = ETH
            let investment_POLY_high = investment_USD.mul(e18).div(high_USDPOLY); // USD / USD/POLY = POLY
            let investment_ETH_low = investment_USD.mul(e18).div(low_USDETH); // USD / USD/ETH = ETH
            let investment_POLY_low = investment_USD.mul(e18).div(low_USDPOLY); // USD / USD/POLY = POLY

            await I_PolyToken.getTokens(investment_POLY_low, NONACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY_low, { from: NONACCREDITED1 });
            await I_PolyToken.getTokens(investment_POLY_low, ACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY_low, { from: ACCREDITED1 });

            // Change exchange rates up
            await I_USDOracle.changePrice(high_USDETH, { from: POLYMATH });
            await I_POLYOracle.changePrice(high_USDPOLY, { from: POLYMATH });

            // Buy with ETH NONACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, {
                    from: NONACCREDITED1,
                    value: investment_ETH_high,
                    gasPrice: GAS_PRICE
                }),
                "STO not open"
            );

            // Buy with POLY NONACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY_high, { from: NONACCREDITED1, gasPrice: GAS_PRICE }),
                "STO not open"
            );

            // Buy with ETH ACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithETH(ACCREDITED1, { from: ACCREDITED1, value: investment_ETH_high, gasPrice: GAS_PRICE }),
                "STO not open"
            );

            // Buy with POLY ACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY_high, { from: ACCREDITED1, gasPrice: GAS_PRICE }),
                "STO not open"
            );

            // Change exchange rates down
            await I_USDOracle.changePrice(low_USDETH, { from: POLYMATH });
            await I_POLYOracle.changePrice(low_USDPOLY, { from: POLYMATH });

            // Buy with ETH NONACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, {
                    from: NONACCREDITED1,
                    value: investment_ETH_low,
                    gasPrice: GAS_PRICE
                }),
                "STO not open"
            );

            // Buy with POLY NONACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY_low, { from: NONACCREDITED1, gasPrice: GAS_PRICE }),
                "STO not open"
            );

            // Buy with ETH ACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithETH(ACCREDITED1, { from: ACCREDITED1, value: investment_ETH_low, gasPrice: GAS_PRICE }),
                "STO not open"
            );

            // Buy with POLY ACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY_low, { from: ACCREDITED1, gasPrice: GAS_PRICE }),
                "STO not open"
            );

            // Reset exchange rates
            await I_USDOracle.changePrice(USDETH, { from: POLYMATH });
            await I_POLYOracle.changePrice(USDPOLY, { from: POLYMATH });
        });
    });

    describe("Test getter functions", async () => {
        describe("Generic", async () => {
            it("should get the right number of investors", async () => {
                assert.equal(
                    (await I_USDTieredSTO_Array[0].investorCount.call()).toString(),
                    (await I_USDTieredSTO_Array[0].investorCount()).toString(),
                    "Investor count not changed as expected"
                );
                assert.equal(
                    (await I_USDTieredSTO_Array[1].investorCount.call()).toString(),
                    (await I_USDTieredSTO_Array[1].investorCount()).toString(),
                    "Investor count not changed as expected"
                );
                assert.equal(
                    (await I_USDTieredSTO_Array[2].investorCount.call()).toString(),
                    (await I_USDTieredSTO_Array[2].investorCount()).toString(),
                    "Investor count not changed as expected"
                );
            });

            it("should get the right amounts invested", async () => {
                assert.equal(
                    (await I_USDTieredSTO_Array[0].fundsRaised.call(ETH)).toString(),
                    (await I_USDTieredSTO_Array[0].getRaised(0)).toString(),
                    "getRaisedEther not changed as expected"
                );
                assert.equal(
                    (await I_USDTieredSTO_Array[0].fundsRaised.call(POLY)).toString(),
                    (await I_USDTieredSTO_Array[0].getRaised(1)).toString(),
                    "getRaisedPOLY not changed as expected"
                );
                assert.equal(
                    (await I_USDTieredSTO_Array[0].fundsRaisedUSD.call()).toString(),
                    (await I_USDTieredSTO_Array[0].fundsRaisedUSD()).toString(),
                    "fundsRaisedUSD not changed as expected"
                );
            });

            it("should return minted tokens in a tier", async () => {
                let totalMinted = (await I_USDTieredSTO_Array[0].getTotalTokensSoldByTier.call(0)).toString();
                let individualMinted = await I_USDTieredSTO_Array[0].getTokensSoldByTier.call(0);
                assert.equal(
                    totalMinted,
                    individualMinted[0]
                        .add(individualMinted[1])
                        .add(individualMinted[2])
                        .toString()
                );
            });

            it("should return correct tokens sold in token details", async () => {
                let tokensSold = (await I_USDTieredSTO_Array[0].getTokensSold.call()).toString();
                let tokenDetails = await I_USDTieredSTO_Array[0].getSTODetails.call();
                assert.equal(tokensSold, tokenDetails[7].toString());
            });
        });

        describe("convertToUSD", async () => {
            it("should reset exchange rates", async () => {
                // Reset exchange rates
                await I_USDOracle.changePrice(USDETH, { from: POLYMATH });
                await I_POLYOracle.changePrice(USDPOLY, { from: POLYMATH });
            });

            it("should get the right conversion for ETH to USD", async () => {
                // 20 ETH to 10000 USD
                let ethInWei = new BN(web3.utils.toWei("20", "ether"));
                let usdInWei = await I_USDTieredSTO_Array[0].convertToUSD.call(ETH, ethInWei, {from: address_zero});
                assert.equal(
                    usdInWei.div(e18).toString(),
                    ethInWei
                        .div(e18)
                        .mul(USDETH.div(e18))
                        .toString()
                );
            });

            it("should get the right conversion for POLY to USD", async () => {
                // 40000 POLY to 10000 USD
                let polyInWei = new BN(web3.utils.toWei("40000", "ether"));
                let usdInWei = await I_USDTieredSTO_Array[0].convertToUSD.call(POLY, polyInWei,{from: address_zero});
                assert.equal(
                    usdInWei.toString(),
                    polyInWei
                        .mul(USDPOLY)
                        .div(e18)
                        .toString()
                );
            });
        });

        describe("convertFromUSD", async () => {
            it("should get the right conversion for USD to ETH", async () => {
                // 10000 USD to 20 ETH
                let usdInWei = new BN(web3.utils.toWei("10000", "ether"));
                let ethInWei = await I_USDTieredSTO_Array[0].convertFromUSD.call(ETH, usdInWei, {from: address_zero});
                assert.equal(
                    ethInWei.div(e18).toString(),
                    usdInWei
                        .div(e18)
                        .div(USDETH.div(e18))
                        .toString()
                );
            });

            it("should get the right conversion for USD to POLY", async () => {
                // 10000 USD to 40000 POLY
                let usdInWei = new BN(web3.utils.toWei("10000", "ether"));
                let polyInWei = await I_USDTieredSTO_Array[0].convertFromUSD.call(POLY, usdInWei, {from: address_zero});
                assert.equal(
                    polyInWei.toString(),
                    usdInWei.mul(e18).div(USDPOLY).toString()
                );
            });
        });
    });

    describe("Test cases for pre-mint", async() => {
        it("Should register the ticker before the generation of the new security token for pre-mint STO", async () => {
            await I_PolyToken.approve(I_STRProxied.address, REGFEE, { from: ISSUER });
            let tx = await I_STRProxied.registerNewTicker(ISSUER, "PREST", { from: ISSUER });
            assert.equal(tx.logs[0].args._owner, ISSUER);
            assert.equal(tx.logs[0].args._ticker, "PREST");
        });

        it("Should generate the new security token with the same symbol as registered above", async () => {
            await I_PolyToken.approve(I_STRProxied.address, REGFEE, { from: ISSUER });
            let t = await I_STRGetter.getSTFactoryAddress.call();
            let tx = await I_STRProxied.generateNewSecurityToken(NAME, "PREST", TOKENDETAILS, false, TREASURYWALLET, 0, { from: ISSUER });

            // Verify the successful generation of the security token
            assert.equal(tx.logs[1].args._ticker, "PREST", "SecurityToken doesn't get deployed");

            I_SecurityToken = await SecurityToken.at(tx.logs[1].args._securityTokenAddress);
            I_STGetter = await STGetter.at(I_SecurityToken.address);
            assert.equal(await I_STGetter.getTreasuryWallet.call(), TREASURYWALLET, "Incorrect wallet set")
            const log = (await I_SecurityToken.getPastEvents('ModuleAdded', {filter: {transactionHash: tx.transactionHash}}))[0];
            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._types[0].toNumber(), TMKEY);
            assert.equal(web3.utils.hexToString(log.args._name), "GeneralTransferManager");
        });

        it("Should initialize the auto attached modules", async () => {
            let moduleData = (await I_STGetter.getModulesByType(TMKEY))[0];
            I_GeneralTransferManager = await GeneralTransferManager.at(moduleData);
        });

        it("Should attach the USDTieredSTO successfully", async() => {
            let nowTime = await latestTime();
            let _startTime = new BN(nowTime).add(new BN(duration.days(2))).toString();
            let _endTime = new BN(_startTime).add(new BN(duration.days(100))).toString();
            let _ratePerTier = [new BN(10).mul(e16).toString(), new BN(15).mul(e16).toString()]; // [ 0.10 USD/Token, 0.15 USD/Token ]
            let _ratePerTierDiscountPoly = [new BN(10).mul(e16).toString(), new BN(15).mul(e16).toString()]; // [ 0.10 USD/Token, 0.15 USD/Token ]
            let _tokensPerTierTotal = [new BN(100000000).mul(new BN(e18)).toString(), new BN(200000000).mul(new BN(e18)).toString()]; // [ 100m Token, 200m Token ]
            let _tokensPerTierDiscountPoly = [new BN(0).toString(), new BN(0).toString()]; // [ new BN(0), 0 ]
            let _nonAccreditedLimitUSD = new BN(10000).mul(new BN(e18)).toString(); // 10k USD
            let _minimumInvestmentUSD = new BN(5).mul(e18).toString(); // 5 USD
            let _fundRaiseTypes = [0, 1, 2];
            let _wallet = WALLET;
            let _treasuryWallet = TREASURYWALLET;
            let _usdToken = [I_DaiToken.address];
            let _oracleAddresses = [];
            let _denominatedCurrency = "0x0";

            // _startTime.push(new BN(currentTime).add(new BN(duration.days(2))).toString());
            // _endTime.push(new BN(currentTime).add(new BN(duration.days(2))).add(new BN(duration.days(100))).toString());
            // _ratePerTier.push([new BN(10).mul(e16).toString(), new BN(15).mul(e16).toString()]); // [ 0.10 USD/Token, 0.15 USD/Token ]
            // _ratePerTierDiscountPoly.push([new BN(10).mul(e16).toString(), new BN(15).mul(e16).toString()]); // [ 0.10 USD/Token, 0.15 USD/Token ]
            // _tokensPerTierTotal.push([new BN(100000000).mul(new BN(e18)).toString(), new BN(200000000).mul(new BN(e18)).toString()]); // [ 100m Token, 200m Token ]
            // _tokensPerTierDiscountPoly.push([new BN(0).toString(), new BN(0).toString()]); // [ new BN(0), 0 ]
            // _nonAccreditedLimitUSD.push(new BN(10000).mul(new BN(e18)).toString()); // 10k USD
            // _minimumInvestmentUSD.push(new BN(5).mul(e18).toString()); // 5 USD

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
                _treasuryWallet,
                _usdToken,
                _oracleAddresses,
                _denominatedCurrency
            ];

            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            let tx = await I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, new BN(0), new BN(0), false, { from: ISSUER, gasPrice: GAS_PRICE });
            console.log("          Gas addModule: ".grey + tx.receipt.gasUsed.toString().grey);
            assert.equal(tx.logs[2].args._types[0], STOKEY, "USDTieredSTO doesn't get deployed");
            assert.equal(web3.utils.hexToString(tx.logs[2].args._name), "USDTieredSTO", "USDTieredSTOFactory module was not added");
            I_USDTieredSTO = await USDTieredSTO.at(tx.logs[2].args._module);

            assert.equal((await I_USDTieredSTO.startTime.call()).toString(), _startTime.toString(), "Incorrect _startTime in config");
            assert.equal((await I_USDTieredSTO.endTime.call()).toString(), _endTime.toString(), "Incorrect _endTime in config");
            for (var i = 0; i < _ratePerTier.length; i++) {
                assert.equal(
                    (await I_USDTieredSTO.tiers.call(i))[0].toString(),
                    _ratePerTier[i].toString(),
                    "Incorrect _ratePerTier in config"
                );
                assert.equal(
                    (await I_USDTieredSTO.tiers.call(i))[1].toString(),
                    _ratePerTierDiscountPoly[i].toString(),
                    "Incorrect _ratePerTierDiscountPoly in config"
                );
                assert.equal(
                    (await I_USDTieredSTO.tiers.call(i))[2].toString(),
                    _tokensPerTierTotal[i].toString(),
                    "Incorrect _tokensPerTierTotal in config"
                );
                assert.equal(
                    (await I_USDTieredSTO.tiers.call(i))[3].toString(),
                    _tokensPerTierDiscountPoly[i].toString(),
                    "Incorrect _tokensPerTierDiscountPoly in config"
                );
            }
            assert.equal(
                (await I_USDTieredSTO.nonAccreditedLimitUSD.call()).toString(),
                _nonAccreditedLimitUSD.toString(),
                "Incorrect _nonAccreditedLimitUSD in config"
            );
            assert.equal(
                (await I_USDTieredSTO.minimumInvestmentUSD.call()).toString(),
                _minimumInvestmentUSD.toString(),
                "Incorrect _minimumInvestmentUSD in config"
            );
            assert.equal(await I_USDTieredSTO.wallet.call(), _wallet, "Incorrect _wallet in config");
            assert.equal(
                await I_USDTieredSTO.getTreasuryWallet.call(),
                _treasuryWallet,
                "Incorrect _treasuryWallet in config"
            );
            assert.equal((await I_USDTieredSTO.getUsdTokens())[0], _usdToken[0], "Incorrect _usdToken in config");
            assert.equal(
                await I_USDTieredSTO.getNumberOfTiers(),
                _tokensPerTierTotal.length,
                "Incorrect number of tiers"
            );
            assert.equal((await I_USDTieredSTO.getPermissions()).length, new BN(2), "Incorrect number of permissions");
        });

        it("Should fail to allow pre-mint -- STO is started", async() => {
            let snapId = await takeSnapshot();
            await increaseTime(duration.days(2.1));
            await catchRevert(
                I_USDTieredSTO.allowPreMinting({from: ISSUER}),
                "Already started"
            );
            revertToSnapshot(snapId);
        });

        it("Should fail to allow pre-mint -- bad owner", async() => {
            let stoId = 0;
            await catchRevert(
                I_USDTieredSTO.allowPreMinting({from: INVESTOR1}),
                "Invalid permission"
            );
        });

        it("Should allow the pre-mint", async() => {
            let stoId = 0;
            await I_USDTieredSTO.allowPreMinting({from: ISSUER});
            assert.isTrue(await I_USDTieredSTO.preMintAllowed.call());
            assert.equal(
                convertToNumber(await I_SecurityToken.balanceOf.call(I_USDTieredSTO.address)),
                300000000
            );
            console.log(`Balance of STO: - ${convertToNumber(await I_SecurityToken.balanceOf.call(I_USDTieredSTO.address))}`);
        });

        it("Should allow to change the tiers value - change the in the balance of the STO", async() => {
            // check the balance of the STO before changing the tiers
            let oldBalance = convertToNumber(await I_SecurityToken.balanceOf.call(I_USDTieredSTO.address));
            console.log(`Balance of STO: - ${oldBalance}`);
            // Increasing the cap
            let tx = await I_USDTieredSTO.modifyTiers(
                [new BN(15).mul(e18), new BN(20).mul(e18)],
                [new BN(10).mul(e18), new BN(15).mul(e18)],
                [new BN(200000000).mul(e18), new BN(300000000).mul(e18)],
                [new BN(0), new BN(0)],
                { from: ISSUER }
            );
            assert.equal(
                convertToNumber((await I_USDTieredSTO.tiers.call(0))[0]),
                15,
                "STO Configuration doesn't set as expected"
            );
            assert.equal(
                convertToNumber((await I_USDTieredSTO.tiers.call(0))[1]),
                10,
                "STO Configuration doesn't set as expected"
            );
            assert.equal(
                convertToNumber((await I_USDTieredSTO.tiers.call(0))[2]),
                200000000,
                "STO Configuration doesn't set as expected"
            );
            assert.equal(
                convertToNumber((await I_USDTieredSTO.tiers.call(0))[3]),
                0,
                "STO Configuration doesn't set as expected"
            );
            let newBalance = convertToNumber(await I_SecurityToken.balanceOf.call(I_USDTieredSTO.address));
            console.log(`Balance of STO: - ${newBalance}`);
            assert.equal((parseInt(newBalance) - parseInt(oldBalance)), 200000000);
        });

        it("Should allow to change the tiers value - cap gets decreased", async() => {
            let stoId = 0;
            // check the balance of the STO before changing the tiers
            let previousBalance = convertToNumber(await I_SecurityToken.balanceOf.call(I_USDTieredSTO.address));
            // When cap gets decreased
            let tx = await I_USDTieredSTO.modifyTiers(
                [new BN(15).mul(e18), new BN(20).mul(e18)],
                [new BN(10).mul(e18), new BN(15).mul(e18)],
                [new BN(1500).mul(e18), new BN(250).mul(e18)],
                [new BN(0), new BN(0)],
                { from: ISSUER }
            );
            assert.equal(
                convertToNumber((await I_USDTieredSTO.tiers.call(0))[0]),
                15,
                "STO Configuration doesn't set as expected"
            );
            assert.equal(
                convertToNumber((await I_USDTieredSTO.tiers.call(0))[1]),
                10,
                "STO Configuration doesn't set as expected"
            );
            assert.equal(
                convertToNumber((await I_USDTieredSTO.tiers.call(0))[2]),
                1500,
                "STO Configuration doesn't set as expected"
            );
            assert.equal(
                convertToNumber((await I_USDTieredSTO.tiers.call(0))[3]),
                0,
                "STO Configuration doesn't set as expected"
            );
            let newBalance = convertToNumber(await I_SecurityToken.balanceOf.call(I_USDTieredSTO.address));
            assert.equal(newBalance, 1750);
            console.log(`Balance of STO: - ${convertToNumber(await I_SecurityToken.balanceOf.call(I_USDTieredSTO.address))}`);
        });

        it("Should whitelist investors with the GTM", async() => {
            let expiryTime = await latestTime() + duration.years(2);
            let treasuryAddress = await I_USDTieredSTO.getTreasuryWallet.call();
            await I_GeneralTransferManager.modifyKYCDataMulti(
                [INVESTOR1, INVESTOR2, treasuryAddress],
                [new BN(1), new BN(1), new BN(1)],
                [new BN(1), new BN(1), new BN(1)],
                [expiryTime, expiryTime, expiryTime],
                {
                    from: ISSUER
                }
            );
            let investorData = await I_GeneralTransferManager.getKYCData([INVESTOR1]);
            assert.equal(investorData[0][0], 1);
            await I_GeneralTransferManager.modifyInvestorFlag(INVESTOR1, 0, true, { from: ISSUER });
            await I_GeneralTransferManager.modifyInvestorFlag(INVESTOR2, 0, true, { from: ISSUER });
        });

        it("Should fail to revoke preMint -- STO is already started", async() => {
            let snap_id = await takeSnapshot();
            await increaseTime(duration.days(2.1));
            await catchRevert(
                I_USDTieredSTO.revokePreMintFlag({from: ISSUER}),
                "Already started"
            );
            await revertToSnapshot(snap_id);
        });

        it("Should fail to revoke preMint -- bad owner", async() => {
            await catchRevert(
                I_USDTieredSTO.revokePreMintFlag({from: INVESTOR1}),
                "Invalid permission"
            );
        });

        it("Should successfully revoke the preMint", async() => {
            let snap_id = await takeSnapshot();
            let tx = await I_USDTieredSTO.revokePreMintFlag({from: ISSUER});
            assert.equal(tx.logs[0].args._owner, ISSUER);
            assert.isFalse(tx.logs[0].args._preMint);
            assert.equal(web3.utils.fromWei(tx.logs[0].args._tokens), 1750);
            assert.equal(
                (await I_SecurityToken.balanceOf.call(I_USDTieredSTO.address)).toString(),
                0
            );
            await revertToSnapshot(snap_id);
        });

        it("Should successfully buy the token from the STO using ETH as an investment currency", async() => {
            let stoId = 0;
            await increaseTime(duration.days(2.1));
            let OLD_BALANCE = convertToNumber(await I_SecurityToken.balanceOf.call(I_USDTieredSTO.address));
            let tx = await I_USDTieredSTO.buyWithETH(INVESTOR1, {from: INVESTOR1, value: new BN(web3.utils.toWei("10"))});
            assert.equal(tx.logs.length, 2);
            assert.equal(tx.logs[0].event, "TokenPurchase");
            assert.equal(tx.logs[1].event, "FundsReceived");
            assert.equal(
                convertToNumber(await I_SecurityToken.balanceOf.call(I_USDTieredSTO.address)),
                parseInt(OLD_BALANCE) - parseInt(web3.utils.fromWei(tx.logs[0].args._tokens))
            );
            assert.equal(
                tx.logs[0].args._beneficiary,
                INVESTOR1
            );
            assert.equal(
                convertToNumber(await I_USDTieredSTO.getTokensSold.call()),
                web3.utils.fromWei(tx.logs[0].args._tokens)
            );
            assert.equal(
                convertToNumber(await I_USDTieredSTO.getTokensMinted.call()),
                web3.utils.fromWei(tx.logs[0].args._tokens)
            );
            assert.equal(
                convertToNumber(await I_USDTieredSTO.getTokensSoldFor.call(0)), //For Ethereum
                web3.utils.fromWei(tx.logs[0].args._tokens)
            );
            assert.equal(
                convertToNumber(await I_SecurityToken.balanceOf.call(INVESTOR1)),
                web3.utils.fromWei(tx.logs[0].args._tokens)
            );
            totalInvestment = parseFloat(totalInvestment) + parseFloat(web3.utils.fromWei(tx.logs[0].args._tokens));
        });

        it("Should successfully buy the token from the STO using DAI as an investment currency", async() => {
            let investment_DAI = web3.utils.toWei("10000");
            await I_DaiToken.getTokens(investment_DAI, INVESTOR2);
            await I_DaiToken.approve(I_USDTieredSTO.address, investment_DAI, { from: INVESTOR2 });
            let OLD_BALANCE = convertToNumber(await I_SecurityToken.balanceOf.call(I_USDTieredSTO.address));
            let tx = await I_USDTieredSTO.buyWithUSD(INVESTOR2, investment_DAI, I_DaiToken.address, {from: INVESTOR2});
            assert.equal(tx.logs.length, 2);
            assert.equal(tx.logs[0].event, "TokenPurchase");
            assert.equal(tx.logs[1].event, "FundsReceived");
            totalInvestment = parseFloat(totalInvestment) + parseFloat(web3.utils.fromWei(tx.logs[0].args._tokens));
            assert.equal(
                convertToNumber(await I_SecurityToken.balanceOf.call(I_USDTieredSTO.address)),
                parseFloat(OLD_BALANCE) - parseFloat(web3.utils.fromWei(tx.logs[0].args._tokens))
            );
            assert.equal(
                tx.logs[0].args._beneficiary,
                INVESTOR2
            );
            assert.equal(
                convertToNumber(await I_USDTieredSTO.getTokensSold.call()),
                totalInvestment
            );
            assert.equal(
                convertToNumber(await I_USDTieredSTO.getTokensMinted.call()),
                totalInvestment
            );
            assert.equal(
                convertToNumber(await I_USDTieredSTO.getTokensSoldFor.call(2)), //For SC
                web3.utils.fromWei(tx.logs[0].args._tokens)
            );
            assert.equal(
                convertToNumber(await I_SecurityToken.balanceOf.call(INVESTOR2)),
                web3.utils.fromWei(tx.logs[0].args._tokens)
            );
        });

        it("Should successfully buy the token from the STO using POLY as an investment currency", async() => {
            let investment_POLY = web3.utils.toWei("1000");
            await I_PolyToken.getTokens(investment_POLY, INVESTOR1);
            await I_PolyToken.approve(I_USDTieredSTO.address, investment_POLY, { from: INVESTOR1 });
            let OLD_BALANCE = convertToNumber(await I_SecurityToken.balanceOf.call(I_USDTieredSTO.address));
            let OLD_BALANCE_INVESTOR = convertToNumber(await I_SecurityToken.balanceOf.call(INVESTOR1));
            let tx = await I_USDTieredSTO.buyWithPOLY(INVESTOR1, investment_POLY, {from: INVESTOR1});
            assert.equal(tx.logs.length, 2);
            assert.equal(tx.logs[0].event, "TokenPurchase");
            assert.equal(tx.logs[1].event, "FundsReceived");
            totalInvestment = parseFloat(totalInvestment) + parseFloat(web3.utils.fromWei(tx.logs[0].args._tokens));
            assert.equal(
                convertToNumber(await I_SecurityToken.balanceOf.call(I_USDTieredSTO.address)),
                parseFloat(OLD_BALANCE) - parseFloat(web3.utils.fromWei(tx.logs[0].args._tokens))
            );
            assert.equal(
                tx.logs[0].args._beneficiary,
                INVESTOR1
            );
            assert.equal(
                convertToNumber(await I_USDTieredSTO.getTokensSold.call()),
                totalInvestment
            );
            assert.equal(
                convertToNumber(await I_USDTieredSTO.getTokensMinted.call()),
                totalInvestment
            );
            assert.equal(
                convertToNumber(await I_USDTieredSTO.getTokensSoldFor.call(1)), //For POLY
                web3.utils.fromWei(tx.logs[0].args._tokens)
            );
            assert.equal(
                convertToNumber(await I_SecurityToken.balanceOf.call(INVESTOR1)),
                parseInt(OLD_BALANCE_INVESTOR) + parseInt(web3.utils.fromWei(tx.logs[0].args._tokens))
            );
        });

        it("Should fail to call finalize -- bad msg.sender", async() => {
            await catchRevert(
                I_USDTieredSTO.finalize({from: INVESTOR1}),
                "Invalid permission"
            );
        });

        it("Should successfully execute the finalize when the cap gets hit", async() => {
            let snap_id = await takeSnapshot();
            let stoId = 0;
            let STO_BALANCE_BEFORE = convertToNumber(await I_SecurityToken.balanceOf.call(I_USDTieredSTO.address));
            let tx = await I_USDTieredSTO.buyWithETH(INVESTOR2, {
                from: INVESTOR2,
                value: web3.utils.toWei("30")
            });
            let STO_BALANCE_AFTER = convertToNumber(await I_SecurityToken.balanceOf.call(I_USDTieredSTO.address));
            totalInvestment = parseFloat(totalInvestment) + parseFloat(web3.utils.fromWei(tx.logs[0].args._tokens)) + parseFloat(web3.utils.fromWei(tx.logs[1].args._tokens));
            assert.equal(
                STO_BALANCE_AFTER,
                parseFloat(STO_BALANCE_BEFORE) - parseFloat(web3.utils.fromWei(tx.logs[0].args._tokens)) - parseFloat(web3.utils.fromWei(tx.logs[1].args._tokens))
            );
            assert.equal(
                tx.logs[0].args._beneficiary,
                INVESTOR2
            );
            assert.equal(
                convertToNumber(await I_USDTieredSTO.getTokensSold.call()),
                totalInvestment
            );
            assert.equal(
                convertToNumber(await I_USDTieredSTO.getTokensMinted.call()),
                totalInvestment
            );
            assert.isTrue(await I_USDTieredSTO.capReached.call());
            await I_USDTieredSTO.finalize({from: ISSUER});
            assert.isTrue(await I_USDTieredSTO.isFinalized.call());
            await revertToSnapshot(snap_id);
        })

        it("Should finalize the STO", async() => {
            let stoId = 0;
            let STO_BALANCE = convertToNumber(await I_SecurityToken.balanceOf.call(I_USDTieredSTO.address));
            await I_USDTieredSTO.finalize({from: ISSUER});
            assert.isTrue(await I_USDTieredSTO.isFinalized.call());
            assert.equal(convertToNumber(await I_SecurityToken.balanceOf.call(TREASURYWALLET)), STO_BALANCE);
        });

    });

    describe("Test cases for the USDTieredSTOFactory", async () => {
        it("should get the exact details of the factory", async () => {
            assert.equal((await I_USDTieredSTOFactory.setupCost.call()).toString(), STOSetupCost);
            assert.equal((await I_USDTieredSTOFactory.getTypes.call())[0], 3);
            assert.equal(web3.utils.hexToString(await I_USDTieredSTOFactory.name.call()), "USDTieredSTO", "Wrong Module added");
            assert.equal(
                await I_USDTieredSTOFactory.description.call(),
                "It allows both accredited and non-accredited investors to contribute into the STO. Non-accredited investors will be capped at a maximum investment limit (as a default or specific to their jurisdiction). Tokens will be sold according to tiers sequentially & each tier has its own price and volume of tokens to sell. Upon receipt of funds (ETH, POLY or DAI), security tokens will automatically transfer to investor’s wallet address",
                "Wrong Module added"
            );
            assert.equal(await I_USDTieredSTOFactory.title.call(), "Tiered STO", "Wrong Module added");
            assert.equal(await I_USDTieredSTOFactory.version.call(), "3.1.0");
            let tags = await I_USDTieredSTOFactory.getTags.call();
            assert.equal(web3.utils.hexToString(tags[0]), "Tiered");
            assert.equal(web3.utils.hexToString(tags[1]), "ETH");
            assert.equal(web3.utils.hexToString(tags[2]), "POLY");
            assert.equal(web3.utils.hexToString(tags[3]), "USD");
            assert.equal(web3.utils.hexToString(tags[4]), "STO");
        });
    });

    describe("Test cases for the Oracle tests", async() => {
        it("Should add the new tieredSTO successfully", async() => {
            let I_ETHOracleEUR = await MockOracle.new(address_zero, web3.utils.fromAscii("ETH"), web3.utils.fromAscii("EUR"), e18, { from: POLYMATH });
            let I_POLYOracleEUR = await MockOracle.new(I_PolyToken.address, web3.utils.fromAscii("POLY"), web3.utils.fromAscii("EUR"), e16, { from: POLYMATH });
            let nowTime = await latestTime();
            let _startTime = new BN(nowTime).add(new BN(duration.days(2))).toString();
            let _endTime = new BN(_startTime).add(new BN(duration.days(100))).toString();
            let _ratePerTier = [new BN(10).mul(e16).toString(), new BN(15).mul(e16).toString()]; // [ 0.10 EUR/Token, 0.15 EUR/Token ]
            let _ratePerTierDiscountPoly = [new BN(10).mul(e16).toString(), new BN(15).mul(e16).toString()]; // [ 0.10 EUR/Token, 0.15 EUR/Token ]
            let _tokensPerTierTotal = [new BN(100000000).mul(new BN(e18)).toString(), new BN(200000000).mul(new BN(e18)).toString()]; // [ 100m Token, 200m Token ]
            let _tokensPerTierDiscountPoly = [new BN(0).toString(), new BN(0).toString()]; // [ new BN(0), 0 ]
            let _nonAccreditedLimitUSD = new BN(10000).mul(new BN(e18)).toString(); // 10k EUR
            let _minimumInvestmentUSD = new BN(5).mul(e18).toString(); // 5 EUR
            let _fundRaiseTypes = [0, 1, 2];
            let _wallet = WALLET;
            let _treasuryWallet = TREASURYWALLET;
            let _usdToken = [I_DaiToken.address];
            let _oracleAddresses = [I_ETHOracleEUR.address, I_POLYOracleEUR.address];
            let _denominatedCurrency = web3.utils.fromAscii("EUR");

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
                _treasuryWallet,
                _usdToken,
                _oracleAddresses,
                _denominatedCurrency
            ];

            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            let tx = await I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, new BN(0), new BN(0), false, { from: ISSUER, gasPrice: GAS_PRICE });
            console.log("          Gas addModule: ".grey + tx.receipt.gasUsed.toString().grey);
            assert.equal(tx.logs[2].args._types[0], STOKEY, "USDTieredSTO doesn't get deployed");
            assert.equal(web3.utils.hexToString(tx.logs[2].args._name), "USDTieredSTO", "USDTieredSTOFactory module was not added");
            I_USDTieredSTO = await USDTieredSTO.at(tx.logs[2].args._module);

            assert.equal((await I_USDTieredSTO.startTime.call()).toString(), _startTime.toString(), "Incorrect _startTime in config");
            assert.equal((await I_USDTieredSTO.endTime.call()).toString(), _endTime.toString(), "Incorrect _endTime in config");
            for (var i = 0; i < _ratePerTier.length; i++) {
                assert.equal(
                    (await I_USDTieredSTO.tiers.call(i))[0].toString(),
                    _ratePerTier[i].toString(),
                    "Incorrect _ratePerTier in config"
                );
                assert.equal(
                    (await I_USDTieredSTO.tiers.call(i))[1].toString(),
                    _ratePerTierDiscountPoly[i].toString(),
                    "Incorrect _ratePerTierDiscountPoly in config"
                );
                assert.equal(
                    (await I_USDTieredSTO.tiers.call(i))[2].toString(),
                    _tokensPerTierTotal[i].toString(),
                    "Incorrect _tokensPerTierTotal in config"
                );
                assert.equal(
                    (await I_USDTieredSTO.tiers.call(i))[3].toString(),
                    _tokensPerTierDiscountPoly[i].toString(),
                    "Incorrect _tokensPerTierDiscountPoly in config"
                );
            }
            assert.equal(
                (await I_USDTieredSTO.nonAccreditedLimitUSD.call()).toString(),
                _nonAccreditedLimitUSD.toString(),
                "Incorrect _nonAccreditedLimitUSD in config"
            );
            assert.equal(
                (await I_USDTieredSTO.minimumInvestmentUSD.call()).toString(),
                _minimumInvestmentUSD.toString(),
                "Incorrect _minimumInvestmentUSD in config"
            );
            assert.equal(await I_USDTieredSTO.wallet.call(), _wallet, "Incorrect _wallet in config");
            assert.equal(
                await I_USDTieredSTO.getTreasuryWallet.call(),
                _treasuryWallet,
                "Incorrect _treasuryWallet in config"
            );
            assert.equal((await I_USDTieredSTO.getUsdTokens())[0], _usdToken[0], "Incorrect _usdToken in config");
            assert.equal(
                await I_USDTieredSTO.getNumberOfTiers(),
                _tokensPerTierTotal.length,
                "Incorrect number of tiers"
            );
            assert.equal((await I_USDTieredSTO.getPermissions()).length, new BN(2), "Incorrect number of permissions");
            assert.equal(await I_USDTieredSTO.getCustomOracleAddress.call(ETH), I_ETHOracleEUR.address);
            assert.equal(await I_USDTieredSTO.getCustomOracleAddress.call(POLY), I_POLYOracleEUR.address);
        });

        it("Should successfully change the oracle addresses before the startTime of the STO", async() => {
            let I_POLYOracleEUR2 = await MockOracle.new(I_PolyToken.address, web3.utils.fromAscii("POLY"), web3.utils.fromAscii("EUR"), e16, { from: POLYMATH });
            let ETHOracleAddress = await I_USDTieredSTO.getCustomOracleAddress.call(ETH);
            await I_USDTieredSTO.modifyOracles([ETHOracleAddress, I_POLYOracleEUR2.address], web3.utils.fromAscii("EUR"), {from: ISSUER});
            assert.equal(await I_USDTieredSTO.getCustomOracleAddress.call(ETH), ETHOracleAddress);
            assert.equal(await I_USDTieredSTO.getCustomOracleAddress.call(POLY), I_POLYOracleEUR2.address);
        });

        it("Should successfully change the oracle addresses and denominated currency before the startTime of the STO", async() => {
            let snap_id = await takeSnapshot();
            let I_POLYOracleEUR3 = await MockOracle.new(I_PolyToken.address, web3.utils.fromAscii("POLY"), web3.utils.fromAscii("CAD"), e16, { from: POLYMATH });
            let I_ETHOracleEUR2 = await MockOracle.new(address_zero, web3.utils.fromAscii("ETH"), web3.utils.fromAscii("CAD"), e18, { from: POLYMATH });
            await I_USDTieredSTO.modifyOracles([I_ETHOracleEUR2.address, I_POLYOracleEUR3.address], web3.utils.fromAscii("CAD"), {from: ISSUER});
            assert.equal(await I_USDTieredSTO.getCustomOracleAddress.call(ETH), I_ETHOracleEUR2.address);
            assert.equal(await I_USDTieredSTO.getCustomOracleAddress.call(POLY), I_POLYOracleEUR3.address);
            await revertToSnapshot(snap_id);
        });

        it("Should fail to change the denominated currency once STO startTime < now", async() => {
            await increaseTime(duration.days(2.1));
            let I_POLYOracleEUR3 = await MockOracle.new(I_PolyToken.address, web3.utils.fromAscii("POLY"), web3.utils.fromAscii("INR"), e16, { from: POLYMATH });
            let I_ETHOracleEUR2 = await MockOracle.new(address_zero, web3.utils.fromAscii("ETH"), web3.utils.fromAscii("INR"), e18, { from: POLYMATH });
            await catchRevert(
                I_USDTieredSTO.modifyOracles([I_ETHOracleEUR2.address, I_POLYOracleEUR3.address], web3.utils.fromAscii("INR"), {from: ISSUER}),
                "Already started"    
            );
        });

        it("Should buy tokens by using ETH, POLY and StableToken", async() => {
            let Previous_Balance = convertToNumber(await I_SecurityToken.balanceOf.call(INVESTOR1));
            totalInvestment = 0;
            // Investment using ETH
            let tx = await I_USDTieredSTO.buyWithETH(INVESTOR1, {from: INVESTOR1, value: new BN(web3.utils.toWei("10"))});
            assert.equal(tx.logs.length, 2);
            assert.equal(tx.logs[0].event, "TokenPurchase");
            assert.equal(tx.logs[1].event, "FundsReceived");
            assert.equal(
                tx.logs[0].args._beneficiary,
                INVESTOR1
            );
            assert.equal(
                convertToNumber(await I_USDTieredSTO.getTokensSold.call()),
                web3.utils.fromWei(tx.logs[0].args._tokens),
                "Incorrect no of tokens sold"
            );
            assert.equal(
                convertToNumber(await I_USDTieredSTO.getTokensMinted.call()),
                web3.utils.fromWei(tx.logs[0].args._tokens),
                "Incorrect no of tokens minted"
            );
            assert.equal(
                convertToNumber(await I_USDTieredSTO.getTokensSoldFor.call(0)), //For Ethereum
                web3.utils.fromWei(tx.logs[0].args._tokens),
                "Incorrect no of tokens sold using ETH as investment currency"
            );
            assert.equal(
                parseFloat(convertToNumber(await I_SecurityToken.balanceOf.call(INVESTOR1))) - parseFloat(Previous_Balance),
                web3.utils.fromWei(tx.logs[0].args._tokens),

            );
            totalInvestment = parseFloat(totalInvestment) + parseFloat(web3.utils.fromWei(tx.logs[0].args._tokens));

            // Investment using POLY

            let investment_POLY = web3.utils.toWei("1000");
            await I_PolyToken.getTokens(investment_POLY, INVESTOR1);
            await I_PolyToken.approve(I_USDTieredSTO.address, investment_POLY, { from: INVESTOR1 });
            let OLD_BALANCE_INVESTOR = convertToNumber(await I_SecurityToken.balanceOf.call(INVESTOR1));
            tx = await I_USDTieredSTO.buyWithPOLY(INVESTOR1, investment_POLY, {from: INVESTOR1});
            totalInvestment = parseFloat(totalInvestment) + parseFloat(web3.utils.fromWei(tx.logs[0].args._tokens));
            assert.equal(
                tx.logs[0].args._beneficiary,
                INVESTOR1
            );
            assert.equal(
                convertToNumber(await I_USDTieredSTO.getTokensSold.call()),
                totalInvestment
            );
            assert.equal(
                convertToNumber(await I_USDTieredSTO.getTokensMinted.call()),
                totalInvestment
            );
            assert.equal(
                convertToNumber(await I_USDTieredSTO.getTokensSoldFor.call(1)), //For POLY
                web3.utils.fromWei(tx.logs[0].args._tokens)
            );
            assert.equal(
                convertToNumber(await I_SecurityToken.balanceOf.call(INVESTOR1)),
                parseInt(OLD_BALANCE_INVESTOR) + parseInt(web3.utils.fromWei(tx.logs[0].args._tokens))
            );

            // Investment using DAI

            let investment_DAI = web3.utils.toWei("10000");
            let Previous_Balance2 = convertToNumber(await I_SecurityToken.balanceOf.call(INVESTOR2));
            await I_DaiToken.getTokens(investment_DAI, INVESTOR2);
            await I_DaiToken.approve(I_USDTieredSTO.address, investment_DAI, { from: INVESTOR2 });
            tx = await I_USDTieredSTO.buyWithUSD(INVESTOR2, investment_DAI, I_DaiToken.address, {from: INVESTOR2});
            totalInvestment = parseFloat(totalInvestment) + parseFloat(web3.utils.fromWei(tx.logs[0].args._tokens));
            assert.equal(
                tx.logs[0].args._beneficiary,
                INVESTOR2
            );
            assert.equal(
                convertToNumber(await I_USDTieredSTO.getTokensSold.call()),
                totalInvestment
            );
            assert.equal(
                convertToNumber(await I_USDTieredSTO.getTokensMinted.call()),
                totalInvestment
            );
            assert.equal(
                convertToNumber(await I_USDTieredSTO.getTokensSoldFor.call(2)), //For SC
                web3.utils.fromWei(tx.logs[0].args._tokens)
            );
            assert.equal(
                parseFloat(convertToNumber(await I_SecurityToken.balanceOf.call(INVESTOR2))) - parseFloat(Previous_Balance2),
                web3.utils.fromWei(tx.logs[0].args._tokens)
            );
        });

        it("Should fail to change the addresses of the oracle to 0x0", async() => {
            let I_POLYOracleEUR4 = await MockOracle.new(I_PolyToken.address, web3.utils.fromAscii("POLY"), web3.utils.fromAscii("EUR"), e16, { from: POLYMATH });
            await catchRevert(
                I_USDTieredSTO.modifyOracles([address_zero, I_POLYOracleEUR4.address], web3.utils.fromAscii("EUR"), {from: ISSUER}),
                "Invalid address"    
            );
            
            await catchRevert(
                I_USDTieredSTO.modifyOracles([I_POLYOracleEUR4.address, address_zero], web3.utils.fromAscii("EUR"), {from: ISSUER}),
                "Invalid address"    
            );
        });

        it("Should change the oracle address successfully during the STO is running", async() => {
            let I_POLYOracleEUR5 = await MockOracle.new(I_PolyToken.address, web3.utils.fromAscii("POLY"), web3.utils.fromAscii("EUR"), new BN(25).pow(new BN(16)), { from: POLYMATH });
            let ethOracleAddress = await I_USDTieredSTO.getCustomOracleAddress.call(ETH);
            await I_USDTieredSTO.modifyOracles([ethOracleAddress, I_POLYOracleEUR5.address], web3.utils.fromAscii("EUR"), {from: ISSUER});
            assert.equal(await I_USDTieredSTO.getCustomOracleAddress.call(POLY), I_POLYOracleEUR5.address);
        });

        it("Should successfully invest using POLY with the use of new oracle", async() => {
            let investment_POLY = web3.utils.toWei("1000");
            await I_PolyToken.getTokens(investment_POLY, INVESTOR1);
            await I_PolyToken.approve(I_USDTieredSTO.address, investment_POLY, { from: INVESTOR1 });
            let OLD_BALANCE_INVESTOR = convertToNumber(await I_SecurityToken.balanceOf.call(INVESTOR1));
            let tx = await I_USDTieredSTO.buyWithPOLY(INVESTOR1, investment_POLY, {from: INVESTOR1});
            assert.equal(tx.logs.length, 3);
            totalInvestment = parseFloat(totalInvestment) + parseFloat(web3.utils.fromWei(tx.logs[0].args._tokens));
            console.log("1");
            assert.equal(
                tx.logs[0].args._beneficiary,
                INVESTOR1
            );
        });
    });

    describe("Test the functionality of the MakerDao Oracles V2", async() => {

        it("Should add the new tieredSTO successfully", async() => {
        
            let nowTime = await latestTime();
            let _startTime = new BN(nowTime).add(new BN(duration.days(2))).toString();
            let _endTime = new BN(_startTime).add(new BN(duration.days(100))).toString();
            let _ratePerTier = [new BN(10).mul(e16).toString(), new BN(15).mul(e16).toString()]; // [ 0.10 USD/Token, 0.15 USD/Token ]
            let _ratePerTierDiscountPoly = [new BN(10).mul(e16).toString(), new BN(15).mul(e16).toString()]; // [ 0.10 USD/Token, 0.15 USD/Token ]
            let _tokensPerTierTotal = [new BN(100000000).mul(new BN(e18)).toString(), new BN(200000000).mul(new BN(e18)).toString()]; // [ 100m Token, 200m Token ]
            let _tokensPerTierDiscountPoly = [new BN(0).toString(), new BN(0).toString()]; // [ new BN(0), 0 ]
            let _nonAccreditedLimitUSD = new BN(10000).mul(new BN(e18)).toString(); // 10k EUR
            let _minimumInvestmentUSD = new BN(5).mul(e18).toString(); // 5 EUR
            let _fundRaiseTypes = [0, 1, 2];
            let _wallet = WALLET;
            let _treasuryWallet = TREASURYWALLET;
            let _usdToken = [I_DaiToken.address];
            let _oracleAddresses = [];
            let _denominatedCurrency = web3.utils.fromAscii("");

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
                _treasuryWallet,
                _usdToken,
                _oracleAddresses,
                _denominatedCurrency
            ];

            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            let tx = await I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, new BN(0), new BN(0), false, { from: ISSUER, gasPrice: GAS_PRICE });
            console.log("          Gas addModule: ".grey + tx.receipt.gasUsed.toString().grey);
            assert.equal(tx.logs[2].args._types[0], STOKEY, "USDTieredSTO doesn't get deployed");
            assert.equal(web3.utils.hexToString(tx.logs[2].args._name), "USDTieredSTO", "USDTieredSTOFactory module was not added");
            I_USDTieredSTO = await USDTieredSTO.at(tx.logs[2].args._module);

            assert.equal((await I_USDTieredSTO.startTime.call()).toString(), _startTime.toString(), "Incorrect _startTime in config");
            assert.equal((await I_USDTieredSTO.endTime.call()).toString(), _endTime.toString(), "Incorrect _endTime in config");
            for (var i = 0; i < _ratePerTier.length; i++) {
                assert.equal(
                    (await I_USDTieredSTO.tiers.call(i))[0].toString(),
                    _ratePerTier[i].toString(),
                    "Incorrect _ratePerTier in config"
                );
                assert.equal(
                    (await I_USDTieredSTO.tiers.call(i))[1].toString(),
                    _ratePerTierDiscountPoly[i].toString(),
                    "Incorrect _ratePerTierDiscountPoly in config"
                );
                assert.equal(
                    (await I_USDTieredSTO.tiers.call(i))[2].toString(),
                    _tokensPerTierTotal[i].toString(),
                    "Incorrect _tokensPerTierTotal in config"
                );
                assert.equal(
                    (await I_USDTieredSTO.tiers.call(i))[3].toString(),
                    _tokensPerTierDiscountPoly[i].toString(),
                    "Incorrect _tokensPerTierDiscountPoly in config"
                );
            }
            assert.equal(
                (await I_USDTieredSTO.nonAccreditedLimitUSD.call()).toString(),
                _nonAccreditedLimitUSD.toString(),
                "Incorrect _nonAccreditedLimitUSD in config"
            );
            assert.equal(
                (await I_USDTieredSTO.minimumInvestmentUSD.call()).toString(),
                _minimumInvestmentUSD.toString(),
                "Incorrect _minimumInvestmentUSD in config"
            );
            assert.equal(await I_USDTieredSTO.wallet.call(), _wallet, "Incorrect _wallet in config");
            assert.equal(
                await I_USDTieredSTO.getTreasuryWallet.call(),
                _treasuryWallet,
                "Incorrect _treasuryWallet in config"
            );
            assert.equal((await I_USDTieredSTO.getUsdTokens())[0], _usdToken[0], "Incorrect _usdToken in config");
            assert.equal(
                await I_USDTieredSTO.getNumberOfTiers(),
                _tokensPerTierTotal.length,
                "Incorrect number of tiers"
            );
            assert.equal((await I_USDTieredSTO.getPermissions()).length, new BN(2), "Incorrect number of permissions");
        });

        it("Call the V2 oracles by the valid module of the registered securityToken", async() => {
            // Step 1 - Deploy the oracle
            I_OracleV2 = await MakerDaoOracleV2.new(
                "0x0000000000000000000000000000000000000000",
                "0x0000000000000000000000000000000000000000",
                web3.utils.fromAscii("USD"),
                I_PolymathRegistry.address,
                {
                    from: POLYMATH
                }
            );
            // Step 2 - trigger manual price
            await I_OracleV2.setManualOverride(true, {from: POLYMATH});
            await I_OracleV2.setManualPrice(web3.utils.toWei("170"), {from: POLYMATH});
            // Step 3 - Orwrite the existing oracle address with the new one
            await I_PolymathRegistry.changeAddress("EthUsdOracle", I_OracleV2.address, {from: POLYMATH});
            // Step 4 - Invest the funds to the USDTieredSTO and check whether oracle is working correctly or not
            await increaseTime(duration.days(2.1));
            let tx = await I_USDTieredSTO.buyWithETH(INVESTOR1, {from: INVESTOR1, value: new BN(web3.utils.toWei("10"))});
            assert.equal(tx.logs.length, 2);
            assert.equal(tx.logs[0].event, "TokenPurchase");
            assert.equal(tx.logs[1].event, "FundsReceived");
            assert.equal(
                tx.logs[0].args._beneficiary,
                INVESTOR1
            );
            assert.equal(
                convertToNumber(await I_USDTieredSTO.getTokensSold.call()),
                web3.utils.fromWei(tx.logs[0].args._tokens),
                "Incorrect no of tokens sold"
            );
            assert.equal(web3.utils.fromWei(tx.logs[0].args._tokens), 17000);
        });

        it("Should fail to read the prices other than the valid module", async() => {
            await I_OracleV2.setManualOverride(false, {from: POLYMATH});
            await catchRevert(
                I_OracleV2.getPrice({from: INVESTOR1})
            );
        });
    });
});
