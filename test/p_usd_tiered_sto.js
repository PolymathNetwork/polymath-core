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

const Web3 = require("web3");
const BigNumber = require("bignumber.js");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port

contract("USDTieredSTO", accounts => {
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
    let ETH = 0;
    let POLY = 1;
    let DAI = 2;

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
    let I_PolyToken;
    let I_DaiToken;
    let I_PolymathRegistry;
    let P_USDTieredSTOFactory;

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

    // Initial fee for ticker registry and security token registry
    const REGFEE = web3.utils.toWei("250");
    const STOSetupCost = 0;

    // MockOracle USD prices
    const USDETH = new BigNumber(500).mul(10 ** 18); // 500 USD/ETH
    const USDPOLY = new BigNumber(25).mul(10 ** 16); // 0.25 USD/POLY

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
    let _usdToken = [];

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
                name: "_reserveWallet"
            },
            {
                type: "address[]",
                name: "_usdTokens"
            }
        ]
    };

    async function convert(_stoID, _tier, _discount, _currencyFrom, _currencyTo, _amount) {
        let USDTOKEN;
        if (_discount) USDTOKEN = ((await I_USDTieredSTO_Array[_stoID].tiers.call(_tier))[1]);
        else USDTOKEN = ((await I_USDTieredSTO_Array[_stoID].tiers.call(_tier))[0]);
        if (_currencyFrom == "TOKEN") {
            let tokenToUSD = _amount
                .div(10 ** 18)
                .mul(USDTOKEN.div(10 ** 18))
                .mul(10 ** 18); // TOKEN * USD/TOKEN = USD
            if (_currencyTo == "USD") return tokenToUSD;
            if (_currencyTo == "ETH") {
                return await I_USDTieredSTO_Array[_stoID].convertFromUSD(ETH, tokenToUSD);
            } else if (_currencyTo == "POLY") {
                return await I_USDTieredSTO_Array[_stoID].convertFromUSD(POLY, tokenToUSD);
            }
        }
        if (_currencyFrom == "USD") {
            if (_currencyTo == "TOKEN") return _amount.div(USDTOKEN).mul(10 ** 18); // USD / USD/TOKEN = TOKEN
            if (_currencyTo == "ETH" || _currencyTo == "POLY")
                return await I_USDTieredSTO_Array[_stoID].convertFromUSD(_currencyTo == "ETH" ? ETH : POLY, _amount);
        }
        if (_currencyFrom == "ETH" || _currencyFrom == "POLY") {
            let ethToUSD = await I_USDTieredSTO_Array[_stoID].convertToUSD(_currencyTo == "ETH" ? ETH : POLY, _amount);
            if (_currencyTo == "USD") return ethToUSD;
            if (_currencyTo == "TOKEN") return ethToUSD.div(USDTOKEN).mul(10 ** 18); // USD / USD/TOKEN = TOKEN
        }
        return 0;
    }

    before(async () => {
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
             I_STRProxied
         ] = instances;

        I_DaiToken = await PolyTokenFaucet.new({from: POLYMATH});
        // STEP 4: Deploy the GeneralDelegateManagerFactory
        [I_GeneralPermissionManagerFactory] = await deployGPMAndVerifyed(POLYMATH, I_MRProxied, I_PolyToken.address, 0);

        // STEP 5: Deploy the USDTieredSTOFactory
        [I_USDTieredSTOFactory] = await deployUSDTieredSTOAndVerified(POLYMATH, I_MRProxied, I_PolyToken.address, STOSetupCost);
        [P_USDTieredSTOFactory] = await deployUSDTieredSTOAndVerified(POLYMATH, I_MRProxied, I_PolyToken.address, web3.utils.toWei("500"));
        // Step 12: Deploy & Register Mock Oracles
        I_USDOracle = await MockOracle.new(0, "ETH", "USD", USDETH, { from: POLYMATH }); // 500 dollars per POLY
        I_POLYOracle = await MockOracle.new(I_PolyToken.address, "POLY", "USD", USDPOLY, { from: POLYMATH }); // 25 cents per POLY
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
            let tx = await I_STRProxied.registerTicker(ISSUER, SYMBOL, NAME, { from: ISSUER });
            assert.equal(tx.logs[0].args._owner, ISSUER);
            assert.equal(tx.logs[0].args._ticker, SYMBOL);
        });

        it("Should generate the new security token with the same symbol as registered above", async () => {
            await I_PolyToken.getTokens(REGFEE, ISSUER);
            await I_PolyToken.approve(I_STRProxied.address, REGFEE, { from: ISSUER });
            let _blockNo = latestBlock();
            let tx = await I_STRProxied.generateSecurityToken(NAME, SYMBOL, TOKENDETAILS, true, { from: ISSUER });
            assert.equal(tx.logs[1].args._ticker, SYMBOL, "SecurityToken doesn't get deployed");

            I_SecurityToken = SecurityToken.at(tx.logs[1].args._securityTokenAddress);

            const log = await promisifyLogWatch(I_SecurityToken.ModuleAdded({ from: _blockNo }), 1);

            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._types[0].toNumber(), TMKEY);
            assert.equal(web3.utils.hexToString(log.args._name), "GeneralTransferManager");
        });

        it("Should intialize the auto attached modules", async () => {
            let moduleData = (await I_SecurityToken.getModulesByType(TMKEY))[0];
            I_GeneralTransferManager = GeneralTransferManager.at(moduleData);
        });
    });

    describe("Test sto deployment", async () => {
        it("Should successfully attach the first STO module to the security token", async () => {
            let stoId = 0; // No discount

            _startTime.push(latestTime() + duration.days(2));
            _endTime.push(_startTime[stoId] + duration.days(100));
            _ratePerTier.push([BigNumber(10 * 10 ** 16), BigNumber(15 * 10 ** 16)]); // [ 0.10 USD/Token, 0.15 USD/Token ]
            _ratePerTierDiscountPoly.push([BigNumber(10 * 10 ** 16), BigNumber(15 * 10 ** 16)]); // [ 0.10 USD/Token, 0.15 USD/Token ]
            _tokensPerTierTotal.push([BigNumber(100000000).mul(new BigNumber(10 ** 18)), BigNumber(200000000).mul(new BigNumber(10 ** 18))]); // [ 100m Token, 200m Token ]
            _tokensPerTierDiscountPoly.push([BigNumber(0), BigNumber(0)]); // [ 0, 0 ]
            _nonAccreditedLimitUSD.push(new BigNumber(10000).mul(new BigNumber(10 ** 18))); // 10k USD
            _minimumInvestmentUSD.push(new BigNumber(5 * 10 ** 18)); // 5 USD
            _fundRaiseTypes.push([0, 1, 2]);
            _wallet.push(WALLET);
            _reserveWallet.push(RESERVEWALLET);
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
                _reserveWallet[stoId],
                _usdToken[stoId]
            ];

            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            let tx = await I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, 0, 0, { from: ISSUER, gasPrice: GAS_PRICE });
            console.log("          Gas addModule: ".grey + tx.receipt.gasUsed.toString().grey);
            assert.equal(tx.logs[2].args._types[0], STOKEY, "USDTieredSTO doesn't get deployed");
            assert.equal(web3.utils.hexToString(tx.logs[2].args._name), "USDTieredSTO", "USDTieredSTOFactory module was not added");
            I_USDTieredSTO_Array.push(USDTieredSTO.at(tx.logs[2].args._module));

            assert.equal((await I_USDTieredSTO_Array[stoId].startTime.call()).toNumber(), _startTime[stoId], "Incorrect _startTime in config");
            assert.equal(await I_USDTieredSTO_Array[stoId].endTime.call(), _endTime[stoId], "Incorrect _endTime in config");
            for (var i = 0; i < _ratePerTier[stoId].length; i++) {
                assert.equal(
                    (await I_USDTieredSTO_Array[stoId].tiers.call(i))[0].toNumber(),
                    _ratePerTier[stoId][i].toNumber(),
                    "Incorrect _ratePerTier in config"
                );
                assert.equal(
                    (await I_USDTieredSTO_Array[stoId].tiers.call(i))[1].toNumber(),
                    _ratePerTierDiscountPoly[stoId][i].toNumber(),
                    "Incorrect _ratePerTierDiscountPoly in config"
                );
                assert.equal(
                    (await I_USDTieredSTO_Array[stoId].tiers.call(i))[2].toNumber(),
                    _tokensPerTierTotal[stoId][i].toNumber(),
                    "Incorrect _tokensPerTierTotal in config"
                );
                assert.equal(
                    (await I_USDTieredSTO_Array[stoId].tiers.call(i))[3].toNumber(),
                    _tokensPerTierDiscountPoly[stoId][i].toNumber(),
                    "Incorrect _tokensPerTierDiscountPoly in config"
                );
            }
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].nonAccreditedLimitUSD.call()).toNumber(),
                _nonAccreditedLimitUSD[stoId].toNumber(),
                "Incorrect _nonAccreditedLimitUSD in config"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].minimumInvestmentUSD.call()).toNumber(),
                _minimumInvestmentUSD[stoId].toNumber(),
                "Incorrect _minimumInvestmentUSD in config"
            );
            assert.equal(await I_USDTieredSTO_Array[stoId].wallet.call(), _wallet[stoId], "Incorrect _wallet in config");
            assert.equal(
                await I_USDTieredSTO_Array[stoId].reserveWallet.call(),
                _reserveWallet[stoId],
                "Incorrect _reserveWallet in config"
            );
            assert.equal(await I_USDTieredSTO_Array[stoId].usdTokens.call(0), _usdToken[stoId][0], "Incorrect _usdToken in config");
            assert.equal(
                await I_USDTieredSTO_Array[stoId].getNumberOfTiers(),
                _tokensPerTierTotal[stoId].length,
                "Incorrect number of tiers"
            );
            assert.equal((await I_USDTieredSTO_Array[stoId].getPermissions()).length, 0, "Incorrect number of permissions");
        });

        it("Should attach the paid STO factory -- failed because of no tokens", async() => {
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
                _reserveWallet[stoId],
                _usdToken[stoId]
            ];

            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            await catchRevert(
                I_SecurityToken.addModule(P_USDTieredSTOFactory.address, bytesSTO, web3.utils.toWei("500"), 0, { from: ISSUER, gasPrice: GAS_PRICE })
            );
        });

        it("Should attach the paid STO factory", async() => {
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
                _reserveWallet[stoId],
                _usdToken[stoId]
            ];

            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            await I_PolyToken.getTokens(web3.utils.toWei("500"), I_SecurityToken.address);
            let tx = await I_SecurityToken.addModule(P_USDTieredSTOFactory.address, bytesSTO, web3.utils.toWei("500"), 0, { from: ISSUER, gasPrice: GAS_PRICE });
            await revertToSnapshot(snapId);
        });

        it("Should allow non-matching beneficiary", async () => {
            snapId = await takeSnapshot();
            await I_USDTieredSTO_Array[0].changeAllowBeneficialInvestments(true, { from: ISSUER });
            let allow = await I_USDTieredSTO_Array[0].allowBeneficialInvestments();
            assert.equal(allow, true, "allowBeneficialInvestments should be true");
        });

        it("Should allow non-matching beneficiary -- failed because it is already active", async () => {
            await catchRevert(
                I_USDTieredSTO_Array[0].changeAllowBeneficialInvestments(true, { from: ISSUER })
            );
            await revertToSnapshot(snapId);
        });

        it("Should successfully call the modifyTimes before starting the STO -- fail because of bad owner", async() => {
            await catchRevert(
                I_USDTieredSTO_Array[0].modifyTimes(latestTime() + duration.days(15), latestTime() + duration.days(55), { from: POLYMATH })
            );
        })

        it("Should successfully call the modifyTimes before starting the STO", async() => {
            let snapId = await takeSnapshot();
            let _startTime = latestTime() + duration.days(15);
            let _endTime = latestTime() + duration.days(55)
            await I_USDTieredSTO_Array[0].modifyTimes(_startTime, _endTime, { from: ISSUER });
            assert.equal(await I_USDTieredSTO_Array[0].startTime.call(), _startTime, "Incorrect _startTime in config");
            assert.equal(await I_USDTieredSTO_Array[0].endTime.call(), _endTime, "Incorrect _endTime in config");
            await revertToSnapshot(snapId);
        });

        it("Should successfully attach the second STO module to the security token", async () => {
            let stoId = 1; // No discount

            _startTime.push(latestTime() + duration.days(2));
            _endTime.push(_startTime[stoId] + duration.days(100));
            _ratePerTier.push([
                BigNumber(10 * 10 ** 16),
                BigNumber(15 * 10 ** 16),
                BigNumber(15 * 10 ** 16),
                BigNumber(15 * 10 ** 16),
                BigNumber(15 * 10 ** 16),
                BigNumber(15 * 10 ** 16)
            ]);
            _ratePerTierDiscountPoly.push([
                BigNumber(10 * 10 ** 16),
                BigNumber(15 * 10 ** 16),
                BigNumber(15 * 10 ** 16),
                BigNumber(15 * 10 ** 16),
                BigNumber(15 * 10 ** 16),
                BigNumber(15 * 10 ** 16)
            ]);
            _tokensPerTierTotal.push([
                BigNumber(5 * 10 ** 18),
                BigNumber(10 * 10 ** 18),
                BigNumber(10 * 10 ** 18),
                BigNumber(10 * 10 ** 18),
                BigNumber(10 * 10 ** 18),
                BigNumber(50 * 10 ** 18)
            ]);
            _tokensPerTierDiscountPoly.push([BigNumber(0), BigNumber(0), BigNumber(0), BigNumber(0), BigNumber(0), BigNumber(0)]);
            _nonAccreditedLimitUSD.push(new BigNumber(10000).mul(new BigNumber(10 ** 18)));
            _minimumInvestmentUSD.push(new BigNumber(0));
            _fundRaiseTypes.push([0, 1, 2]);
            _wallet.push(WALLET);
            _reserveWallet.push(RESERVEWALLET);
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
                _reserveWallet[stoId],
                _usdToken[stoId]
            ];

            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            let tx = await I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, 0, 0, { from: ISSUER, gasPrice: GAS_PRICE });
            console.log("          Gas addModule: ".grey + tx.receipt.gasUsed.toString().grey);
            assert.equal(tx.logs[2].args._types[0], STOKEY, "USDTieredSTO doesn't get deployed");
            assert.equal(web3.utils.hexToString(tx.logs[2].args._name), "USDTieredSTO", "USDTieredSTOFactory module was not added");
            I_USDTieredSTO_Array.push(USDTieredSTO.at(tx.logs[2].args._module));

            assert.equal(await I_USDTieredSTO_Array[stoId].startTime.call(), _startTime[stoId], "Incorrect _startTime in config");
            assert.equal(await I_USDTieredSTO_Array[stoId].endTime.call(), _endTime[stoId], "Incorrect _endTime in config");
            for (var i = 0; i < _ratePerTier[stoId].length; i++) {
                assert.equal(
                    (await I_USDTieredSTO_Array[stoId].tiers.call(i))[0].toNumber(),
                    _ratePerTier[stoId][i].toNumber(),
                    "Incorrect _ratePerTier in config"
                );
                assert.equal(
                    (await I_USDTieredSTO_Array[stoId].tiers.call(i))[1].toNumber(),
                    _ratePerTierDiscountPoly[stoId][i].toNumber(),
                    "Incorrect _ratePerTierDiscountPoly in config"
                );
                assert.equal(
                    (await I_USDTieredSTO_Array[stoId].tiers.call(i))[2].toNumber(),
                    _tokensPerTierTotal[stoId][i].toNumber(),
                    "Incorrect _tokensPerTierTotal in config"
                );
                assert.equal(
                    (await I_USDTieredSTO_Array[stoId].tiers.call(i))[3].toNumber(),
                    _tokensPerTierDiscountPoly[stoId][i].toNumber(),
                    "Incorrect _tokensPerTierDiscountPoly in config"
                );
            }
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].nonAccreditedLimitUSD.call()).toNumber(),
                _nonAccreditedLimitUSD[stoId].toNumber(),
                "Incorrect _nonAccreditedLimitUSD in config"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].minimumInvestmentUSD.call()).toNumber(),
                _minimumInvestmentUSD[stoId].toNumber(),
                "Incorrect _minimumInvestmentUSD in config"
            );
            assert.equal(await I_USDTieredSTO_Array[stoId].wallet.call(), _wallet[stoId], "Incorrect _wallet in config");
            assert.equal(
                await I_USDTieredSTO_Array[stoId].reserveWallet.call(),
                _reserveWallet[stoId],
                "Incorrect _reserveWallet in config"
            );
            assert.equal(await I_USDTieredSTO_Array[stoId].usdTokens.call(0), _usdToken[stoId][0], "Incorrect _usdToken in config");
            assert.equal(
                await I_USDTieredSTO_Array[stoId].getNumberOfTiers(),
                _tokensPerTierTotal[stoId].length,
                "Incorrect number of tiers"
            );
            assert.equal((await I_USDTieredSTO_Array[stoId].getPermissions()).length, 0, "Incorrect number of permissions");
        });

        it("Should successfully attach the third STO module to the security token", async () => {
            let stoId = 2; // Poly discount

            _startTime.push(latestTime() + duration.days(2));
            _endTime.push(_startTime[stoId] + duration.days(100));
            _ratePerTier.push([BigNumber(1 * 10 ** 18), BigNumber(1.5 * 10 ** 18)]); // [ 1 USD/Token, 1.5 USD/Token ]
            _ratePerTierDiscountPoly.push([BigNumber(0.5 * 10 ** 18), BigNumber(1 * 10 ** 18)]); // [ 0.5 USD/Token, 1.5 USD/Token ]
            _tokensPerTierTotal.push([BigNumber(100 * 10 ** 18), BigNumber(50 * 10 ** 18)]); // [ 100 Token, 50 Token ]
            _tokensPerTierDiscountPoly.push([BigNumber(100 * 10 ** 18), BigNumber(25 * 10 ** 18)]); // [ 100 Token, 25 Token ]
            _nonAccreditedLimitUSD.push(new BigNumber(25 * 10 ** 18)); // [ 25 USD ]
            _minimumInvestmentUSD.push(new BigNumber(5));
            _fundRaiseTypes.push([0, 1, 2]);
            _wallet.push(WALLET);
            _reserveWallet.push(RESERVEWALLET);
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
                _reserveWallet[stoId],
                _usdToken[stoId]
            ];

            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            let tx = await I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, 0, 0, { from: ISSUER, gasPrice: GAS_PRICE });
            console.log("          Gas addModule: ".grey + tx.receipt.gasUsed.toString().grey);
            assert.equal(tx.logs[2].args._types[0], STOKEY, "USDTieredSTO doesn't get deployed");
            assert.equal(web3.utils.hexToString(tx.logs[2].args._name), "USDTieredSTO", "USDTieredSTOFactory module was not added");
            I_USDTieredSTO_Array.push(USDTieredSTO.at(tx.logs[2].args._module));
        });

        it("Should successfully attach the fourth STO module to the security token", async () => {
            let stoId = 3;

            _startTime.push(latestTime() + duration.days(0.1));
            _endTime.push(_startTime[stoId] + duration.days(0.1));
            _ratePerTier.push([BigNumber(10 * 10 ** 16), BigNumber(15 * 10 ** 16)]);
            _ratePerTierDiscountPoly.push([BigNumber(10 * 10 ** 16), BigNumber(12 * 10 ** 16)]);
            _tokensPerTierTotal.push([BigNumber(100 * 10 ** 18), BigNumber(200 * 10 ** 18)]);
            _tokensPerTierDiscountPoly.push([BigNumber(0), BigNumber(50 * 10 ** 18)]);
            _nonAccreditedLimitUSD.push(new BigNumber(10000).mul(new BigNumber(10 ** 18)));
            _minimumInvestmentUSD.push(new BigNumber(0));
            _fundRaiseTypes.push([0, 1, 2]);
            _wallet.push(WALLET);
            _reserveWallet.push(RESERVEWALLET);
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
                _reserveWallet[stoId],
                _usdToken[stoId]
            ];

            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            let tx = await I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, 0, 0, { from: ISSUER, gasPrice: GAS_PRICE });
            console.log("          Gas addModule: ".grey + tx.receipt.gasUsed.toString().grey);
            assert.equal(tx.logs[2].args._types[0], STOKEY, "USDTieredSTO doesn't get deployed");
            assert.equal(web3.utils.hexToString(tx.logs[2].args._name), "USDTieredSTO", "USDTieredSTOFactory module was not added");
            I_USDTieredSTO_Array.push(USDTieredSTO.at(tx.logs[2].args._module));
            let tokens = await I_USDTieredSTO_Array[I_USDTieredSTO_Array.length - 1].getUsdTokens.call();
            assert.equal(tokens[0], I_DaiToken.address, "USD Tokens should match");
        });

        it("Should successfully attach the fifth STO module to the security token", async () => {
            let stoId = 4; // Non-divisible tokens

            _startTime.push(latestTime() + duration.days(2));
            _endTime.push(_startTime[stoId] + duration.days(100));
            _ratePerTier.push([BigNumber(1 * 10 ** 18), BigNumber(1.5 * 10 ** 18)]); // [ 1 USD/Token, 1.5 USD/Token ]
            _ratePerTierDiscountPoly.push([BigNumber(0.5 * 10 ** 18), BigNumber(1 * 10 ** 18)]); // [ 0.5 USD/Token, 1.5 USD/Token ]
            _tokensPerTierTotal.push([BigNumber(100 * 10 ** 18), BigNumber(50 * 10 ** 18)]); // [ 100 Token, 50 Token ]
            _tokensPerTierDiscountPoly.push([BigNumber(100 * 10 ** 18), BigNumber(25 * 10 ** 18)]); // [ 100 Token, 25 Token ]
            _nonAccreditedLimitUSD.push(BigNumber(25 * 10 ** 18)); // [ 25 USD ]
            _minimumInvestmentUSD.push(BigNumber(5));
            _fundRaiseTypes.push([0, 1, 2]);
            _wallet.push(WALLET);
            _reserveWallet.push(RESERVEWALLET);
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
                _reserveWallet[stoId],
                _usdToken[stoId]
            ];

            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            let tx = await I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, 0, 0, { from: ISSUER, gasPrice: GAS_PRICE });
            console.log("          Gas addModule: ".grey + tx.receipt.gasUsed.toString().grey);
            assert.equal(tx.logs[2].args._types[0], STOKEY, "USDTieredSTO doesn't get deployed");
            assert.equal(web3.utils.hexToString(tx.logs[2].args._name), "USDTieredSTO", "USDTieredSTOFactory module was not added");
            I_USDTieredSTO_Array.push(USDTieredSTO.at(tx.logs[2].args._module));
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
                    _reserveWallet[stoId],
                    _usdToken[stoId]
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
                    _reserveWallet[stoId],
                    _usdToken[stoId]
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
                    _reserveWallet[stoId],
                    _usdToken[stoId]
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
                    _reserveWallet[stoId],
                    _usdToken[stoId]
                ]
            ];
            for (var i = 0; i < config.length; i++) {
                let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config[i]);

                await catchRevert(I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, 0, 0, { from: ISSUER }));
            }
        });

        it("Should fail because rate of token should be greater than 0", async () => {
            let stoId = 0;

            let ratePerTier = [BigNumber(10 * 10 ** 16), BigNumber(0)];
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
                _reserveWallet[stoId],
                _usdToken[stoId]
            ];
            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);

            await catchRevert(I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, 0, 0, { from: ISSUER }));
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
                _reserveWallet[stoId],
                _usdToken[stoId]
            ];
            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);

            await catchRevert(I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, 0, 0, { from: ISSUER }));
        });

        it("Should fail because Zero address is not permitted for reserveWallet", async () => {
            let stoId = 0;

            let reserveWallet = address_zero;
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
                reserveWallet,
                _usdToken[stoId]
            ];
            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);

            await catchRevert(I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, 0, 0, { from: ISSUER }));
        });

        it("Should fail because end time before start time", async () => {
            let stoId = 0;

            let startTime = latestTime() + duration.days(35);
            let endTime = latestTime() + duration.days(1);
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
                _reserveWallet[stoId],
                _usdToken[stoId]
            ];
            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);

            await catchRevert(I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, 0, 0, { from: ISSUER }));
        });

        it("Should fail because start time is in the past", async () => {
            let stoId = 0;

            let startTime = latestTime() - duration.days(35);
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
                _reserveWallet[stoId],
                _usdToken[stoId]
            ];
            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);

            await catchRevert(I_SecurityToken.addModule(I_USDTieredSTOFactory.address, bytesSTO, 0, 0, { from: ISSUER }));
        });
    });

    describe("Test modifying configuration", async () => {
        it("Should successfully change config before startTime - funding", async () => {
            let stoId = 3;
            await I_USDTieredSTO_Array[stoId].modifyFunding([0], { from: ISSUER });
            assert.equal(await I_USDTieredSTO_Array[stoId].fundRaiseTypes.call(0), true, "STO Configuration doesn't set as expected");
            assert.equal(await I_USDTieredSTO_Array[stoId].fundRaiseTypes.call(1), false, "STO Configuration doesn't set as expected");

            await I_USDTieredSTO_Array[stoId].modifyFunding([1], { from: ISSUER });
            assert.equal(await I_USDTieredSTO_Array[stoId].fundRaiseTypes.call(0), false, "STO Configuration doesn't set as expected");
            assert.equal(await I_USDTieredSTO_Array[stoId].fundRaiseTypes.call(1), true, "STO Configuration doesn't set as expected");

            await I_USDTieredSTO_Array[stoId].modifyFunding([0, 1], { from: ISSUER });
            assert.equal(await I_USDTieredSTO_Array[stoId].fundRaiseTypes.call(0), true, "STO Configuration doesn't set as expected");
            assert.equal(await I_USDTieredSTO_Array[stoId].fundRaiseTypes.call(1), true, "STO Configuration doesn't set as expected");
        });

        it("Should successfully change config before startTime - limits and tiers, times, addresses", async () => {
            let stoId = 3;

            await I_USDTieredSTO_Array[stoId].modifyLimits(new BigNumber(1 * 10 ** 18), BigNumber(15 * 10 ** 18), { from: ISSUER });
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].minimumInvestmentUSD.call()).toNumber(),
                BigNumber(15 * 10 ** 18).toNumber(),
                "STO Configuration doesn't set as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].nonAccreditedLimitUSD.call()).toNumber(),
                BigNumber(1 * 10 ** 18).toNumber(),
                "STO Configuration doesn't set as expected"
            );

            await I_USDTieredSTO_Array[stoId].modifyTiers(
                [BigNumber(15 * 10 ** 18)],
                [BigNumber(13 * 10 ** 18)],
                [BigNumber(15 * 10 ** 20)],
                [BigNumber(15 * 10 ** 20)],
                { from: ISSUER }
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].tiers.call(0))[0].toNumber(),
                BigNumber(15 * 10 ** 18).toNumber(),
                "STO Configuration doesn't set as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].tiers.call(0))[1].toNumber(),
                BigNumber(13 * 10 ** 18).toNumber(),
                "STO Configuration doesn't set as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].tiers.call(0))[2],
                BigNumber(15 * 10 ** 20).toNumber(),
                "STO Configuration doesn't set as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].tiers.call(0))[3],
                BigNumber(15 * 10 ** 20).toNumber(),
                "STO Configuration doesn't set as expected"
            );

            let tempTime1 = latestTime() + duration.days(0.1);
            let tempTime2 = latestTime() + duration.days(0.2);

            await I_USDTieredSTO_Array[stoId].modifyTimes(tempTime1, tempTime2, { from: ISSUER });
            assert.equal(await I_USDTieredSTO_Array[stoId].startTime.call(), tempTime1, "STO Configuration doesn't set as expected");
            assert.equal(await I_USDTieredSTO_Array[stoId].endTime.call(), tempTime2, "STO Configuration doesn't set as expected");

            await I_USDTieredSTO_Array[stoId].modifyAddresses(
                "0x0000000000000000000000000400000000000000",
                "0x0000000000000000000003000000000000000000",
                [0x0000000000000000000003000000000000057a00],
                { from: ISSUER }
            );
            assert.equal(
                await I_USDTieredSTO_Array[stoId].wallet.call(),
                "0x0000000000000000000000000400000000000000",
                "STO Configuration doesn't set as expected"
            );
            assert.equal(
                await I_USDTieredSTO_Array[stoId].reserveWallet.call(),
                "0x0000000000000000000003000000000000000000",
                "STO Configuration doesn't set as expected"
            );
            assert.equal(
                await I_USDTieredSTO_Array[stoId].usdTokens.call(0),
                "0x0000000000000000000003000000000000057a00",
                "STO Configuration doesn't set as expected"
            );
        });

        it("Should fail to change config after endTime", async () => {
            let stoId = 3;

            let snapId = await takeSnapshot();
            await increaseTime(duration.days(1));

            await catchRevert(I_USDTieredSTO_Array[stoId].modifyFunding([0, 1], { from: ISSUER }));

            await catchRevert(
                I_USDTieredSTO_Array[stoId].modifyLimits(new BigNumber(15 * 10 ** 18), BigNumber(1 * 10 ** 18), { from: ISSUER })
            );

            await catchRevert(
                I_USDTieredSTO_Array[stoId].modifyTiers(
                    [BigNumber(15 * 10 ** 18)],
                    [BigNumber(13 * 10 ** 18)],
                    [BigNumber(15 * 10 ** 20)],
                    [BigNumber(15 * 10 ** 20)],
                    { from: ISSUER }
                )
            );

            let tempTime1 = latestTime() + duration.days(1);
            let tempTime2 = latestTime() + duration.days(3);

            await catchRevert(I_USDTieredSTO_Array[stoId].modifyTimes(tempTime1, tempTime2, { from: ISSUER }));

            await revertToSnapshot(snapId);
        });
    });

    describe("Test buying failure conditions", async () => {
        it("should fail if before STO start time", async () => {
            let stoId = 0;
            let snapId = await takeSnapshot();

            assert.equal(await I_USDTieredSTO_Array[stoId].isOpen(), false, "STO is not showing correct status");

            // Whitelist
            let fromTime = latestTime();
            let toTime = latestTime() + duration.days(15);
            let expiryTime = toTime + duration.days(100);
            let whitelisted = true;

            await I_GeneralTransferManager.modifyWhitelist(ACCREDITED1, fromTime, toTime, expiryTime, whitelisted, { from: ISSUER });
            await I_GeneralTransferManager.modifyWhitelist(NONACCREDITED1, fromTime, toTime, expiryTime, whitelisted, { from: ISSUER });

            // // Advance time to after STO start
            // await increaseTime(duration.days(3));

            // Set as accredited
            await I_USDTieredSTO_Array[stoId].changeAccredited([ACCREDITED1], [true], { from: ISSUER });

            // Prep for investments
            let investment_ETH = web3.utils.toWei("1", "ether"); // Invest 1 ETH
            let investment_POLY = web3.utils.toWei("10000", "ether"); // Invest 10000 POLY
            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: NONACCREDITED1 });
            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: ACCREDITED1 });
            let investment_DAI = web3.utils.toWei("500", "ether"); // Invest 10000 POLY
            await I_DaiToken.getTokens(investment_DAI, NONACCREDITED1);
            await I_DaiToken.approve(I_USDTieredSTO_Array[stoId].address, investment_DAI, { from: NONACCREDITED1 });
            await I_DaiToken.getTokens(investment_DAI, ACCREDITED1);
            await I_DaiToken.approve(I_USDTieredSTO_Array[stoId].address, investment_DAI, { from: ACCREDITED1 });
            // NONACCREDITED ETH
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, value: investment_ETH }));
            // NONACCREDITED POLY
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, { from: NONACCREDITED1 }));
            // NONACCREDITED DAI
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithUSD(NONACCREDITED1, investment_DAI, I_DaiToken.address, { from: NONACCREDITED1 }));
            // ACCREDITED ETH
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithETH(ACCREDITED1, { from: ACCREDITED1, value: investment_ETH }));
            // ACCREDITED POLY
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, { from: ACCREDITED1 }));
            // ACCREDITED DAI
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithUSD(ACCREDITED1, investment_DAI, I_DaiToken.address, { from: ACCREDITED1 }));
            await revertToSnapshot(snapId);
        });

        it("should fail if not whitelisted", async () => {
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
            let investment_ETH = web3.utils.toWei("1", "ether"); // Invest 1 ETH
            let investment_POLY = web3.utils.toWei("10000", "ether"); // Invest 10000 POLY
            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: NONACCREDITED1 });
            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: ACCREDITED1 });
            let investment_DAI = web3.utils.toWei("500", "ether"); // Invest 10000 POLY
            await I_DaiToken.getTokens(investment_DAI, NONACCREDITED1);
            await I_DaiToken.approve(I_USDTieredSTO_Array[stoId].address, investment_DAI, { from: NONACCREDITED1 });
            await I_DaiToken.getTokens(investment_DAI, ACCREDITED1);
            await I_DaiToken.approve(I_USDTieredSTO_Array[stoId].address, investment_DAI, { from: ACCREDITED1 });

            // NONACCREDITED ETH
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, value: investment_ETH }));

            // NONACCREDITED POLY
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, { from: NONACCREDITED1 }));

            // NONACCREDITED DAI
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithUSD(NONACCREDITED1, investment_DAI, I_DaiToken.address, { from: NONACCREDITED1 }));

            // ACCREDITED ETH
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithETH(ACCREDITED1, { from: ACCREDITED1, value: investment_ETH }));

            // ACCREDITED POLY
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, { from: ACCREDITED1 }));

            // ACCREDITED DAI
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithUSD(ACCREDITED1, investment_DAI, I_DaiToken.address, { from: ACCREDITED1 }));

            await revertToSnapshot(snapId);
        });

        it("should fail if minimumInvestmentUSD not met", async () => {
            let stoId = 0;
            let tierId = 0;
            let snapId = await takeSnapshot();

            // Whitelist
            let fromTime = latestTime();
            let toTime = latestTime() + duration.days(15);
            let expiryTime = toTime + duration.days(100);
            let whitelisted = true;

            await I_GeneralTransferManager.modifyWhitelist(ACCREDITED1, fromTime, toTime, expiryTime, whitelisted, { from: ISSUER });
            await I_GeneralTransferManager.modifyWhitelist(NONACCREDITED1, fromTime, toTime, expiryTime, whitelisted, { from: ISSUER });

            // Advance time to after STO start
            await increaseTime(duration.days(3));

            // Set as accredited
            await I_USDTieredSTO_Array[stoId].changeAccredited([ACCREDITED1], [true], { from: ISSUER });

            let investment_USD = new BigNumber(2).mul(10 ** 18);
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
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, value: investment_ETH }));

            // NONACCREDITED POLY
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, { from: NONACCREDITED1 }));

            // NONACCREDITED DAI
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithUSD(NONACCREDITED1, investment_DAI, I_DaiToken.address, { from: NONACCREDITED1 }));

            // ACCREDITED ETH
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithETH(ACCREDITED1, { from: ACCREDITED1, value: investment_ETH }));

            // ACCREDITED POLY
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, { from: ACCREDITED1 }));

            // ACCREDITED DAI
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithUSD(ACCREDITED1, investment_DAI, I_DaiToken.address, { from: ACCREDITED1 }));

            await revertToSnapshot(snapId);
        });

        it("should successfully pause the STO and make investments fail, then unpause and succeed", async () => {
            let stoId = 0;
            let snapId = await takeSnapshot();

            // Whitelist
            let fromTime = latestTime();
            let toTime = latestTime() + duration.days(15);
            let expiryTime = toTime + duration.days(100);
            let whitelisted = true;

            await I_GeneralTransferManager.modifyWhitelist(ACCREDITED1, fromTime, toTime, expiryTime, whitelisted, { from: ISSUER });
            await I_GeneralTransferManager.modifyWhitelist(NONACCREDITED1, fromTime, toTime, expiryTime, whitelisted, { from: ISSUER });

            // Advance time to after STO start
            await increaseTime(duration.days(3));

            // Set as accredited
            await I_USDTieredSTO_Array[stoId].changeAccredited([ACCREDITED1], [true], { from: ISSUER });

            // Pause the STO
            await I_USDTieredSTO_Array[stoId].pause({ from: ISSUER });
            assert.equal(await I_USDTieredSTO_Array[stoId].paused.call(), true, "STO did not pause successfully");

            // Prep for investments
            let investment_ETH = web3.utils.toWei("1", "ether"); // Invest 1 ETH
            let investment_POLY = web3.utils.toWei("10000", "ether"); // Invest 10000 POLY
            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: NONACCREDITED1 });
            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: ACCREDITED1 });

            let investment_DAI = web3.utils.toWei("500", "ether"); // Invest 10000 POLY
            await I_DaiToken.getTokens(investment_DAI, NONACCREDITED1);
            await I_DaiToken.approve(I_USDTieredSTO_Array[stoId].address, investment_DAI, { from: NONACCREDITED1 });
            await I_DaiToken.getTokens(investment_DAI, ACCREDITED1);
            await I_DaiToken.approve(I_USDTieredSTO_Array[stoId].address, investment_DAI, { from: ACCREDITED1 });

            // NONACCREDITED ETH
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, value: investment_ETH }));

            // NONACCREDITED POLY
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, { from: NONACCREDITED1 }));

            // NONACCREDITED DAI
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithUSD(NONACCREDITED1, investment_DAI, I_DaiToken.address, { from: NONACCREDITED1 }));

            // ACCREDITED ETH
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithETH(ACCREDITED1, { from: ACCREDITED1, value: investment_ETH }));

            // ACCREDITED POLY
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, { from: ACCREDITED1 }));

            // ACCREDITED DAI
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithUSD(ACCREDITED1, investment_DAI, I_DaiToken.address, { from: ACCREDITED1 }));

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
            let fromTime = latestTime();
            let toTime = latestTime() + duration.days(15);
            let expiryTime = toTime + duration.days(100);
            let whitelisted = true;

            await I_GeneralTransferManager.modifyWhitelist(ACCREDITED1, fromTime, toTime, expiryTime, whitelisted, { from: ISSUER });
            await I_GeneralTransferManager.modifyWhitelist(NONACCREDITED1, fromTime, toTime, expiryTime, whitelisted, { from: ISSUER });

            // Advance time to after STO start
            await increaseTime(duration.days(3));

            // Set as accredited
            await I_USDTieredSTO_Array[stoId].changeAccredited([ACCREDITED1], [true], { from: ISSUER });

            // Prep for investments
            let investment_DAI = web3.utils.toWei("500", "ether"); // Invest 10000 POLY
            await I_DaiToken.getTokens(investment_DAI, NONACCREDITED1);
            await I_DaiToken.approve(I_USDTieredSTO_Array[stoId].address, investment_DAI, { from: NONACCREDITED1 });
            await I_DaiToken.getTokens(investment_DAI, ACCREDITED1);
            await I_DaiToken.approve(I_USDTieredSTO_Array[stoId].address, investment_DAI, { from: ACCREDITED1 });

            // Make sure buying works before changing
            await I_USDTieredSTO_Array[stoId].buyWithUSD(NONACCREDITED1, investment_DAI, I_DaiToken.address, { from: NONACCREDITED1 });

            // Change Stable coin address
            let I_DaiToken2 = await PolyTokenFaucet.new({from: POLYMATH});
            await I_USDTieredSTO_Array[stoId].modifyAddresses(WALLET, RESERVEWALLET, [I_DaiToken2.address], { from: ISSUER });

            // NONACCREDITED DAI
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithUSD(NONACCREDITED1, investment_DAI, I_DaiToken.address, { from: NONACCREDITED1 }));

            // ACCREDITED DAI
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithUSD(ACCREDITED1, investment_DAI, I_DaiToken.address, { from: ACCREDITED1 }));

            // Revert stable coin address
            await I_USDTieredSTO_Array[stoId].modifyAddresses(WALLET, RESERVEWALLET, [I_DaiToken.address], { from: ISSUER });

            // Make sure buying works again
            await I_USDTieredSTO_Array[stoId].buyWithUSD(ACCREDITED1, investment_DAI, I_DaiToken.address, { from: ACCREDITED1 });

            await revertToSnapshot(snapId);
        });

        it("should fail if after STO end time", async () => {
            let stoId = 3;
            let snapId = await takeSnapshot();

            // Whitelist
            let fromTime = latestTime();
            let toTime = latestTime() + duration.days(15);
            let expiryTime = toTime + duration.days(100);
            let whitelisted = true;

            await I_GeneralTransferManager.modifyWhitelist(ACCREDITED1, fromTime, toTime, expiryTime, whitelisted, { from: ISSUER });
            await I_GeneralTransferManager.modifyWhitelist(NONACCREDITED1, fromTime, toTime, expiryTime, whitelisted, { from: ISSUER });

            // Advance time to after STO end
            await increaseTime(duration.days(3));

            assert.equal(await I_USDTieredSTO_Array[stoId].isOpen(), false, "STO is not showing correct status");

            // Set as accredited
            await I_USDTieredSTO_Array[stoId].changeAccredited([ACCREDITED1], [true], { from: ISSUER });

            // Prep for investments
            let investment_ETH = web3.utils.toWei("1", "ether"); // Invest 1 ETH
            let investment_POLY = web3.utils.toWei("10000", "ether"); // Invest 10000 POLY
            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: NONACCREDITED1 });
            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: ACCREDITED1 });
            let investment_DAI = web3.utils.toWei("500", "ether"); // Invest 10000 POLY
            await I_DaiToken.getTokens(investment_DAI, NONACCREDITED1);
            await I_DaiToken.approve(I_USDTieredSTO_Array[stoId].address, investment_DAI, { from: NONACCREDITED1 });
            await I_DaiToken.getTokens(investment_DAI, ACCREDITED1);
            await I_DaiToken.approve(I_USDTieredSTO_Array[stoId].address, investment_DAI, { from: ACCREDITED1 });

            // NONACCREDITED ETH
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, value: investment_ETH }));

            // NONACCREDITED POLY
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, { from: NONACCREDITED1 }));

            // NONACCREDITED DAI
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithUSD(NONACCREDITED1, investment_DAI, I_DaiToken.address, { from: NONACCREDITED1 }));

            // ACCREDITED ETH
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithETH(ACCREDITED1, { from: ACCREDITED1, value: investment_ETH }));

            // ACCREDITED POLY
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, { from: ACCREDITED1 }));

            // ACCREDITED DAI
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithUSD(ACCREDITED1, investment_DAI, I_DaiToken.address, { from: ACCREDITED1 }));

            await revertToSnapshot(snapId);
        });

        it("should fail if finalized", async () => {
            let stoId = 0;
            let snapId = await takeSnapshot();

            // Whitelist
            let fromTime = latestTime();
            let toTime = latestTime();
            let expiryTime = toTime + duration.days(100);
            let whitelisted = true;

            await I_GeneralTransferManager.modifyWhitelist(ACCREDITED1, fromTime, toTime, expiryTime, whitelisted, { from: ISSUER });
            await I_GeneralTransferManager.modifyWhitelist(NONACCREDITED1, fromTime, toTime, expiryTime, whitelisted, { from: ISSUER });
            await I_GeneralTransferManager.modifyWhitelist(RESERVEWALLET, fromTime, toTime, expiryTime, whitelisted, { from: ISSUER });

            // Advance time to after STO start
            await increaseTime(duration.days(3));

            // Set as accredited
            await I_USDTieredSTO_Array[stoId].changeAccredited([ACCREDITED1], [true], { from: ISSUER });

            // Finalize STO
            await I_USDTieredSTO_Array[stoId].finalize({ from: ISSUER });
            assert.equal(await I_USDTieredSTO_Array[stoId].isFinalized.call(), true, "STO has not been finalized");
            assert.equal(await I_USDTieredSTO_Array[stoId].isOpen(), false, "STO is not showing correct status");

            // Attempt to call function again
            await catchRevert(I_USDTieredSTO_Array[stoId].finalize({ from: ISSUER }));

            // Prep for investments
            let investment_ETH = web3.utils.toWei("1", "ether"); // Invest 1 ETH
            let investment_POLY = web3.utils.toWei("10000", "ether"); // Invest 10000 POLY
            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: NONACCREDITED1 });
            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: ACCREDITED1 });
            let investment_DAI = web3.utils.toWei("500", "ether"); // Invest 10000 POLY
            await I_DaiToken.getTokens(investment_DAI, NONACCREDITED1);
            await I_DaiToken.approve(I_USDTieredSTO_Array[stoId].address, investment_DAI, { from: NONACCREDITED1 });
            await I_DaiToken.getTokens(investment_DAI, ACCREDITED1);
            await I_DaiToken.approve(I_USDTieredSTO_Array[stoId].address, investment_DAI, { from: ACCREDITED1 });

            // NONACCREDITED ETH
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, value: investment_ETH }));

            // NONACCREDITED POLY
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, { from: NONACCREDITED1 }));

            // NONACCREDITED DAI
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithUSD(NONACCREDITED1, investment_DAI, I_DaiToken.address, { from: NONACCREDITED1 }));

            // ACCREDITED ETH
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithETH(ACCREDITED1, { from: ACCREDITED1, value: investment_ETH }));

            // ACCREDITED POLY
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, { from: ACCREDITED1 }));

            // ACCREDITED DAI
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithUSD(ACCREDITED1, investment_DAI, I_DaiToken.address, { from: ACCREDITED1 }));

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

            let fromTime = latestTime();
            let toTime = latestTime() + duration.days(15);
            let expiryTime = toTime + duration.days(100);
            let whitelisted = true;

            const tx1 = await I_GeneralTransferManager.modifyWhitelist(NONACCREDITED1, fromTime, toTime, expiryTime, whitelisted, {
                from: ISSUER
            });
            assert.equal(tx1.logs[0].args._investor, NONACCREDITED1, "Failed in adding the investor in whitelist");
            const tx2 = await I_GeneralTransferManager.modifyWhitelist(ACCREDITED1, fromTime, toTime, expiryTime, whitelisted, {
                from: ISSUER
            });
            assert.equal(tx2.logs[0].args._investor, ACCREDITED1, "Failed in adding the investor in whitelist");
        });

        it("should successfully modify accredited addresses for first STO", async () => {
            let stoId = 0;
            let investorStatus = await I_USDTieredSTO_Array[stoId].investors.call(NONACCREDITED1);
            let status1 = investorStatus[0].toNumber();
            assert.equal(status1, 0, "Initial accreditation is set to true");

            await I_USDTieredSTO_Array[stoId].changeAccredited([NONACCREDITED1], [true], { from: ISSUER });
            investorStatus = await I_USDTieredSTO_Array[stoId].investors.call(NONACCREDITED1);
            let status2 = investorStatus[0].toNumber();
            assert.equal(status2, 1, "Failed to set single address");

            await I_USDTieredSTO_Array[stoId].changeAccredited([NONACCREDITED1, ACCREDITED1], [false, true], { from: ISSUER });
            investorStatus = await I_USDTieredSTO_Array[stoId].investors.call(NONACCREDITED1);
            let status3 = investorStatus[0].toNumber();
            assert.equal(status3, 0, "Failed to set multiple addresses");
            investorStatus = await I_USDTieredSTO_Array[stoId].investors.call(ACCREDITED1);
            let status4 = investorStatus[0].toNumber();
            assert.equal(status4, 1, "Failed to set multiple addresses");

            let totalStatus = await I_USDTieredSTO_Array[stoId].getAccreditedData.call();

            assert.equal(totalStatus[0][0], NONACCREDITED1, "Account match");
            assert.equal(totalStatus[0][1], ACCREDITED1, "Account match");
            assert.equal(totalStatus[1][0], false, "Account match");
            assert.equal(totalStatus[1][1], true, "Account match");
            assert.equal(totalStatus[2][0].toNumber(), 0, "override match");
            assert.equal(totalStatus[2][1].toNumber(), 0, "override match");
            await catchRevert(I_USDTieredSTO_Array[stoId].changeAccredited([NONACCREDITED1, ACCREDITED1], [true], { from: ISSUER }));
        });

        it("should successfully modify accredited addresses for second STO", async () => {
            let stoId = 1;

            await I_USDTieredSTO_Array[stoId].changeAccredited([NONACCREDITED1, ACCREDITED1], [false, true], { from: ISSUER });
            let investorStatus = await I_USDTieredSTO_Array[stoId].investors.call(NONACCREDITED1);
            let status1 = investorStatus[0].toNumber();
            investorStatus = await I_USDTieredSTO_Array[stoId].investors.call(ACCREDITED1);
            let status2 = investorStatus[0].toNumber();
            assert.equal(status1, 0, "Failed to set multiple address");
            assert.equal(status2, 1, "Failed to set multiple address");
        });
    });

    describe("Buy Tokens with no discount", async () => {
        it("should successfully buy using fallback at tier 0 for NONACCREDITED1", async () => {
            let stoId = 0;
            let tierId = 0;

            let investment_Token = new BigNumber(50).mul(10 ** 18);
            let investment_USD = await convert(stoId, tierId, false, "TOKEN", "USD", investment_Token);
            let investment_ETH = await convert(stoId, tierId, false, "TOKEN", "ETH", investment_Token);
            let investment_POLY = await convert(stoId, tierId, false, "TOKEN", "POLY", investment_Token);

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let init_InvestorETHBal = new BigNumber(await web3.eth.getBalance(NONACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedUSD = await I_USDTieredSTO_Array[stoId].fundsRaisedUSD.call();
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let init_RaisedDAI = await I_USDTieredSTO_Array[stoId].fundsRaised.call(DAI);
            let init_WalletETHBal = new BigNumber(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            let tx1 = await web3.eth.sendTransaction({
                from: NONACCREDITED1,
                to: I_USDTieredSTO_Array[stoId].address,
                value: investment_ETH,
                gasPrice: GAS_PRICE,
                gas: 1000000
            });
            let gasCost1 = new BigNumber(GAS_PRICE).mul(tx1.gasUsed);
            console.log("          Gas fallback purchase: ".grey + tx1.gasUsed.toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let final_InvestorETHBal = new BigNumber(await web3.eth.getBalance(NONACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedUSD = await I_USDTieredSTO_Array[stoId].fundsRaisedUSD.call();
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let final_RaisedDAI = await I_USDTieredSTO_Array[stoId].fundsRaised.call(DAI);
            let final_WalletETHBal = new BigNumber(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            assert.equal(
                final_TokenSupply.toNumber(),
                init_TokenSupply.add(investment_Token).toNumber(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toNumber(),
                init_InvestorTokenBal.add(investment_Token).toNumber(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_InvestorETHBal.toNumber(),
                init_InvestorETHBal
                    .sub(gasCost1)
                    .sub(investment_ETH)
                    .toNumber(),
                "Investor ETH Balance not changed as expected"
            );
            assert.equal(
                final_InvestorPOLYBal.toNumber(),
                init_InvestorPOLYBal.toNumber(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toNumber(),
                init_STOTokenSold.add(investment_Token).toNumber(),
                "STO Token Sold not changed as expected"
            );
            assert.equal(final_STOETHBal.toNumber(), init_STOETHBal.toNumber(), "STO ETH Balance not changed as expected");
            assert.equal(final_STOPOLYBal.toNumber(), init_STOPOLYBal.toNumber(), "STO POLY Balance not changed as expected");
            assert.equal(final_RaisedUSD.toNumber(), init_RaisedUSD.add(investment_USD).toNumber(), "Raised USD not changed as expected");
            assert.equal(final_RaisedETH.toNumber(), init_RaisedETH.add(investment_ETH).toNumber(), "Raised ETH not changed as expected");
            assert.equal(final_RaisedPOLY.toNumber(), init_RaisedPOLY.toNumber(), "Raised POLY not changed as expected");
            assert.equal(final_RaisedDAI.toNumber(), init_RaisedDAI.toNumber(), "Raised POLY not changed as expected");
            assert.equal(
                final_WalletETHBal.toNumber(),
                init_WalletETHBal.add(investment_ETH).toNumber(),
                "Wallet ETH Balance not changed as expected"
            );
            assert.equal(final_WalletPOLYBal.toNumber(), init_WalletPOLYBal.toNumber(), "Wallet POLY Balance not changed as expected");

            // Additional checks on getters
            assert.equal((await I_USDTieredSTO_Array[stoId].investorCount.call()).toNumber(), 1, "Investor count not changed as expected");
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].getTokensSold()).toNumber(),
                investment_Token.toNumber(),
                "getTokensSold not changed as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].getTokensMinted()).toNumber(),
                investment_Token.toNumber(),
                "getTokensMinted not changed as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].getTokensSoldFor(ETH)).toNumber(),
                investment_Token.toNumber(),
                "getTokensSoldForETH not changed as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].getTokensSoldFor(POLY)).toNumber(),
                0,
                "getTokensSoldForPOLY not changed as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].investorInvestedUSD.call(NONACCREDITED1)).toNumber(),
                investment_USD.toNumber(),
                "investorInvestedUSD not changed as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].investorInvested.call(NONACCREDITED1, ETH)).toNumber(),
                investment_ETH.toNumber(),
                "investorInvestedETH not changed as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].investorInvested.call(NONACCREDITED1, POLY)).toNumber(),
                0,
                "investorInvestedPOLY not changed as expected"
            );
        });

        it("should successfully buy using buyWithETH at tier 0 for NONACCREDITED1", async () => {
            let stoId = 0;
            let tierId = 0;

            let investment_Token = new BigNumber(50).mul(10 ** 18);
            let investment_USD = await convert(stoId, tierId, false, "TOKEN", "USD", investment_Token);
            let investment_ETH = await convert(stoId, tierId, false, "TOKEN", "ETH", investment_Token);
            let investment_POLY = await convert(stoId, tierId, false, "TOKEN", "POLY", investment_Token);

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let init_InvestorETHBal = new BigNumber(await web3.eth.getBalance(NONACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let init_RaisedDAI = await I_USDTieredSTO_Array[stoId].fundsRaised.call(DAI);
            let init_WalletETHBal = new BigNumber(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            let tx1 = await I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, {
                from: NONACCREDITED1,
                value: investment_ETH,
                gasPrice: GAS_PRICE
            });
            let gasCost1 = new BigNumber(GAS_PRICE).mul(tx1.receipt.gasUsed);
            console.log("          Gas buyWithETH: ".grey + tx1.receipt.gasUsed.toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let final_InvestorETHBal = new BigNumber(await web3.eth.getBalance(NONACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let final_RaisedDAI = await I_USDTieredSTO_Array[stoId].fundsRaised.call(DAI);
            let final_WalletETHBal = new BigNumber(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            assert.equal(
                final_TokenSupply.toNumber(),
                init_TokenSupply.add(investment_Token).toNumber(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toNumber(),
                init_InvestorTokenBal.add(investment_Token).toNumber(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_InvestorETHBal.toNumber(),
                init_InvestorETHBal
                    .sub(gasCost1)
                    .sub(investment_ETH)
                    .toNumber(),
                "Investor ETH Balance not changed as expected"
            );
            assert.equal(
                final_InvestorPOLYBal.toNumber(),
                init_InvestorPOLYBal.toNumber(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toNumber(),
                init_STOTokenSold.add(investment_Token).toNumber(),
                "STO Token Sold not changed as expected"
            );
            assert.equal(final_STOETHBal.toNumber(), init_STOETHBal.toNumber(), "STO ETH Balance not changed as expected");
            assert.equal(final_STOPOLYBal.toNumber(), init_STOPOLYBal.toNumber(), "STO POLY Balance not changed as expected");
            assert.equal(final_RaisedETH.toNumber(), init_RaisedETH.add(investment_ETH).toNumber(), "Raised ETH not changed as expected");
            assert.equal(final_RaisedPOLY.toNumber(), init_RaisedPOLY.toNumber(), "Raised POLY not changed as expected");
            assert.equal(final_RaisedDAI.toNumber(), init_RaisedDAI.toNumber(), "Raised DAI not changed as expected");
            assert.equal(
                final_WalletETHBal.toNumber(),
                init_WalletETHBal.add(investment_ETH).toNumber(),
                "Wallet ETH Balance not changed as expected"
            );
            assert.equal(final_WalletPOLYBal.toNumber(), init_WalletPOLYBal.toNumber(), "Wallet POLY Balance not changed as expected");
        });

        it("should successfully buy using buyWithPOLY at tier 0 for NONACCREDITED1", async () => {
            let stoId = 0;
            let tierId = 0;

            let investment_Token = new BigNumber(50).mul(10 ** 18);
            let investment_USD = await convert(stoId, tierId, false, "TOKEN", "USD", investment_Token);
            let investment_ETH = await convert(stoId, tierId, false, "TOKEN", "ETH", investment_Token);
            let investment_POLY = await convert(stoId, tierId, false, "TOKEN", "POLY", investment_Token);

            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: NONACCREDITED1 });

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let init_InvestorETHBal = new BigNumber(await web3.eth.getBalance(NONACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let init_RaisedDAI = await I_USDTieredSTO_Array[stoId].fundsRaised.call(DAI);
            let init_WalletETHBal = new BigNumber(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            // Buy With POLY
            let tx2 = await I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, {
                from: NONACCREDITED1,
                gasPrice: GAS_PRICE
            });
            let gasCost2 = new BigNumber(GAS_PRICE).mul(tx2.receipt.gasUsed);
            console.log("          Gas buyWithPOLY: ".grey + tx2.receipt.gasUsed.toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let final_InvestorETHBal = new BigNumber(await web3.eth.getBalance(NONACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let final_RaisedDAI = await I_USDTieredSTO_Array[stoId].fundsRaised.call(DAI);
            let final_WalletETHBal = new BigNumber(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            assert.equal(
                final_TokenSupply.toNumber(),
                init_TokenSupply.add(investment_Token).toNumber(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toNumber(),
                init_InvestorTokenBal.add(investment_Token).toNumber(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_InvestorETHBal.toNumber(),
                init_InvestorETHBal.sub(gasCost2).toNumber(),
                "Investor ETH Balance not changed as expected"
            );
            assert.equal(
                final_InvestorPOLYBal.toNumber(),
                init_InvestorPOLYBal.sub(investment_POLY).toNumber(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toNumber(),
                init_STOTokenSold.add(investment_Token).toNumber(),
                "STO Token Sold not changed as expected"
            );
            assert.equal(final_STOETHBal.toNumber(), init_STOETHBal.toNumber(), "STO ETH Balance not changed as expected");
            assert.equal(final_STOPOLYBal.toNumber(), init_STOPOLYBal.toNumber(), "STO POLY Balance not changed as expected");
            assert.equal(final_RaisedETH.toNumber(), init_RaisedETH.toNumber(), "Raised ETH not changed as expected");
            assert.equal(
                final_RaisedPOLY.toNumber(),
                init_RaisedPOLY.add(investment_POLY).toNumber(),
                "Raised POLY not changed as expected"
            );
            assert.equal(final_RaisedDAI.toNumber(), init_RaisedDAI.toNumber(), "Raised POLY not changed as expected");
            assert.equal(final_WalletETHBal.toNumber(), init_WalletETHBal.toNumber(), "Wallet ETH Balance not changed as expected");
            assert.equal(
                final_WalletPOLYBal.toNumber(),
                init_WalletPOLYBal.add(investment_POLY).toNumber(),
                "Wallet POLY Balance not changed as expected"
            );
        });

        it("should successfully buy using buyWithUSD at tier 0 for NONACCREDITED1", async () => {
            let stoId = 0;
            let tierId = 0;

            let investment_Token = new BigNumber(50).mul(10 ** 18);
            let investment_USD = await convert(stoId, tierId, false, "TOKEN", "USD", investment_Token);
            let investment_ETH = await convert(stoId, tierId, false, "TOKEN", "ETH", investment_Token);
            let investment_POLY = await convert(stoId, tierId, false, "TOKEN", "POLY", investment_Token);
            let investment_DAI = investment_USD;

            await I_DaiToken.getTokens(investment_DAI, NONACCREDITED1);
            await I_DaiToken.approve(I_USDTieredSTO_Array[stoId].address, investment_DAI, { from: NONACCREDITED1 });

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let init_InvestorETHBal = new BigNumber(await web3.eth.getBalance(NONACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let init_InvestorDAIBal = await I_DaiToken.balanceOf(NONACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let init_RaisedDAI = await I_USDTieredSTO_Array[stoId].fundsRaised.call(DAI);
            let init_WalletETHBal = new BigNumber(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);
            let init_WalletDAIBal = await I_DaiToken.balanceOf(WALLET);

            // Buy With DAI
            let tx2 = await I_USDTieredSTO_Array[stoId].buyWithUSD(NONACCREDITED1, investment_DAI, I_DaiToken.address, {
                from: NONACCREDITED1,
                gasPrice: GAS_PRICE
            });
            let gasCost2 = new BigNumber(GAS_PRICE).mul(tx2.receipt.gasUsed);
            console.log("          Gas buyWithUSD: ".grey + tx2.receipt.gasUsed.toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let final_InvestorETHBal = new BigNumber(await web3.eth.getBalance(NONACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let final_InvestorDAIBal = await I_DaiToken.balanceOf(NONACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let final_RaisedDAI = await I_USDTieredSTO_Array[stoId].fundsRaised.call(DAI);
            let final_WalletETHBal = new BigNumber(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);
            let final_WalletDAIBal = await I_DaiToken.balanceOf(WALLET);

            assert.equal(
                final_TokenSupply.toNumber(),
                init_TokenSupply.add(investment_Token).toNumber(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toNumber(),
                init_InvestorTokenBal.add(investment_Token).toNumber(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_InvestorETHBal.toNumber(),
                init_InvestorETHBal.sub(gasCost2).toNumber(),
                "Investor ETH Balance not changed as expected"
            );
            assert.equal(
                final_InvestorPOLYBal.toNumber(),
                init_InvestorPOLYBal.toNumber(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_InvestorDAIBal.toNumber(),
                init_InvestorDAIBal.sub(investment_DAI).toNumber(),
                "Investor DAI Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toNumber(),
                init_STOTokenSold.add(investment_Token).toNumber(),
                "STO Token Sold not changed as expected"
            );
            assert.equal(final_STOETHBal.toNumber(), init_STOETHBal.toNumber(), "STO ETH Balance not changed as expected");
            assert.equal(final_STOPOLYBal.toNumber(), init_STOPOLYBal.toNumber(), "STO POLY Balance not changed as expected");
            assert.equal(final_RaisedETH.toNumber(), init_RaisedETH.toNumber(), "Raised ETH not changed as expected");
            assert.equal(final_RaisedPOLY.toNumber(), init_RaisedPOLY.toNumber(), "Raised POLY not changed as expected");
            assert.equal(final_RaisedDAI.toNumber(), init_RaisedDAI.add(investment_DAI).toNumber(), "Raised POLY not changed as expected");
            assert.equal(final_WalletETHBal.toNumber(), init_WalletETHBal.toNumber(), "Wallet ETH Balance not changed as expected");
            assert.equal(final_WalletPOLYBal.toNumber(), init_WalletPOLYBal.toNumber(), "Wallet POLY Balance not changed as expected");
            assert.equal(
                final_WalletDAIBal.toNumber(),
                init_WalletDAIBal.add(investment_DAI).toNumber(),
                "Wallet DAI Balance not changed as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].stableCoinsRaised.call(I_DaiToken.address)).toNumber(),
                investment_DAI.toNumber(),
                "DAI Raised not changed as expected"
            );
        });

        it("should successfully buy using fallback at tier 0 for ACCREDITED1", async () => {
            let stoId = 0;
            let tierId = 0;

            await I_USDTieredSTO_Array[stoId].changeAccredited([ACCREDITED1], [true], { from: ISSUER });

            let investment_Token = new BigNumber(50).mul(10 ** 18);
            let investment_USD = await convert(stoId, tierId, false, "TOKEN", "USD", investment_Token);
            let investment_ETH = await convert(stoId, tierId, false, "TOKEN", "ETH", investment_Token);
            let investment_POLY = await convert(stoId, tierId, false, "TOKEN", "POLY", investment_Token);

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let init_InvestorETHBal = new BigNumber(await web3.eth.getBalance(ACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let init_WalletETHBal = new BigNumber(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            let tx1 = await web3.eth.sendTransaction({
                from: ACCREDITED1,
                to: I_USDTieredSTO_Array[stoId].address,
                value: investment_ETH,
                gasPrice: GAS_PRICE,
                gas: 1000000
            });
            let gasCost1 = new BigNumber(GAS_PRICE).mul(tx1.gasUsed);
            console.log("          Gas fallback purchase: ".grey + tx1.gasUsed.toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let final_InvestorETHBal = new BigNumber(await web3.eth.getBalance(ACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let final_WalletETHBal = new BigNumber(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            assert.equal(
                final_TokenSupply.toNumber(),
                init_TokenSupply.add(investment_Token).toNumber(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toNumber(),
                init_InvestorTokenBal.add(investment_Token).toNumber(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_InvestorETHBal.toNumber(),
                init_InvestorETHBal
                    .sub(gasCost1)
                    .sub(investment_ETH)
                    .toNumber(),
                "Investor ETH Balance not changed as expected"
            );
            assert.equal(
                final_InvestorPOLYBal.toNumber(),
                init_InvestorPOLYBal.toNumber(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toNumber(),
                init_STOTokenSold.add(investment_Token).toNumber(),
                "STO Token Sold not changed as expected"
            );
            assert.equal(final_STOETHBal.toNumber(), init_STOETHBal.toNumber(), "STO ETH Balance not changed as expected");
            assert.equal(final_STOPOLYBal.toNumber(), init_STOPOLYBal.toNumber(), "STO POLY Balance not changed as expected");
            assert.equal(final_RaisedETH.toNumber(), init_RaisedETH.add(investment_ETH).toNumber(), "Raised ETH not changed as expected");
            assert.equal(final_RaisedPOLY.toNumber(), init_RaisedPOLY.toNumber(), "Raised POLY not changed as expected");
            assert.equal(
                final_WalletETHBal.toNumber(),
                init_WalletETHBal.add(investment_ETH).toNumber(),
                "Wallet ETH Balance not changed as expected"
            );
            assert.equal(final_WalletPOLYBal.toNumber(), init_WalletPOLYBal.toNumber(), "Wallet POLY Balance not changed as expected");
        });

        it("should successfully buy using buyWithETH at tier 0 for ACCREDITED1", async () => {
            let stoId = 0;
            let tierId = 0;

            let investment_Token = new BigNumber(50).mul(10 ** 18);
            let investment_USD = await convert(stoId, tierId, false, "TOKEN", "USD", investment_Token);
            let investment_ETH = await convert(stoId, tierId, false, "TOKEN", "ETH", investment_Token);
            let investment_POLY = await convert(stoId, tierId, false, "TOKEN", "POLY", investment_Token);

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let init_InvestorETHBal = new BigNumber(await web3.eth.getBalance(ACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let init_WalletETHBal = new BigNumber(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            let tx1 = await I_USDTieredSTO_Array[stoId].buyWithETH(ACCREDITED1, {
                from: ACCREDITED1,
                value: investment_ETH,
                gasPrice: GAS_PRICE
            });
            let gasCost1 = new BigNumber(GAS_PRICE).mul(tx1.receipt.gasUsed);
            console.log("          Gas buyWithETH: ".grey + tx1.receipt.gasUsed.toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let final_InvestorETHBal = new BigNumber(await web3.eth.getBalance(ACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let final_WalletETHBal = new BigNumber(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            assert.equal(
                final_TokenSupply.toNumber(),
                init_TokenSupply.add(investment_Token).toNumber(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toNumber(),
                init_InvestorTokenBal.add(investment_Token).toNumber(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_InvestorETHBal.toNumber(),
                init_InvestorETHBal
                    .sub(gasCost1)
                    .sub(investment_ETH)
                    .toNumber(),
                "Investor ETH Balance not changed as expected"
            );
            assert.equal(
                final_InvestorPOLYBal.toNumber(),
                init_InvestorPOLYBal.toNumber(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toNumber(),
                init_STOTokenSold.add(investment_Token).toNumber(),
                "STO Token Sold not changed as expected"
            );
            assert.equal(final_STOETHBal.toNumber(), init_STOETHBal.toNumber(), "STO ETH Balance not changed as expected");
            assert.equal(final_STOPOLYBal.toNumber(), init_STOPOLYBal.toNumber(), "STO POLY Balance not changed as expected");
            assert.equal(final_RaisedETH.toNumber(), init_RaisedETH.add(investment_ETH).toNumber(), "Raised ETH not changed as expected");
            assert.equal(final_RaisedPOLY.toNumber(), init_RaisedPOLY.toNumber(), "Raised POLY not changed as expected");
            assert.equal(
                final_WalletETHBal.toNumber(),
                init_WalletETHBal.add(investment_ETH).toNumber(),
                "Wallet ETH Balance not changed as expected"
            );
            assert.equal(final_WalletPOLYBal.toNumber(), init_WalletPOLYBal.toNumber(), "Wallet POLY Balance not changed as expected");
        });

        it("should successfully buy using buyWithPOLY at tier 0 for ACCREDITED1", async () => {
            let stoId = 0;
            let tierId = 0;

            let investment_Token = new BigNumber(50).mul(10 ** 18);
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
            let init_InvestorETHBal = new BigNumber(await web3.eth.getBalance(ACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let init_WalletETHBal = new BigNumber(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            // Buy With POLY
            let tx2 = await I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, {
                from: ACCREDITED1,
                gasPrice: GAS_PRICE
            });
            let gasCost2 = new BigNumber(GAS_PRICE).mul(tx2.receipt.gasUsed);
            console.log("          Gas buyWithPOLY: ".grey + tx2.receipt.gasUsed.toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let final_InvestorETHBal = new BigNumber(await web3.eth.getBalance(ACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let final_WalletETHBal = new BigNumber(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            assert.equal(
                final_TokenSupply.toNumber(),
                init_TokenSupply.add(investment_Token).toNumber(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toNumber(),
                init_InvestorTokenBal.add(investment_Token).toNumber(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_InvestorETHBal.toNumber(),
                init_InvestorETHBal.sub(gasCost2).toNumber(),
                "Investor ETH Balance not changed as expected"
            );
            assert.equal(
                final_InvestorPOLYBal.toNumber(),
                init_InvestorPOLYBal.sub(investment_POLY).toNumber(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toNumber(),
                init_STOTokenSold.add(investment_Token).toNumber(),
                "STO Token Sold not changed as expected"
            );
            assert.equal(final_STOETHBal.toNumber(), init_STOETHBal.toNumber(), "STO ETH Balance not changed as expected");
            assert.equal(final_STOPOLYBal.toNumber(), init_STOPOLYBal.toNumber(), "STO POLY Balance not changed as expected");
            assert.equal(final_RaisedETH.toNumber(), init_RaisedETH.toNumber(), "Raised ETH not changed as expected");
            assert.equal(
                final_RaisedPOLY.toNumber(),
                init_RaisedPOLY.add(investment_POLY).toNumber(),
                "Raised POLY not changed as expected"
            );
            assert.equal(final_WalletETHBal.toNumber(), init_WalletETHBal.toNumber(), "Wallet ETH Balance not changed as expected");
            assert.equal(
                final_WalletPOLYBal.toNumber(),
                init_WalletPOLYBal.add(investment_POLY).toNumber(),
                "Wallet POLY Balance not changed as expected"
            );

            // Additional checks on getters
            assert.equal((await I_USDTieredSTO_Array[stoId].investorCount.call()).toNumber(), 2, "Investor count not changed as expected");
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].getTokensSold()).toNumber(),
                init_getTokensSold.add(investment_Token).toNumber(),
                "getTokensSold not changed as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].getTokensMinted()).toNumber(),
                init_getTokensMinted.add(investment_Token).toNumber(),
                "getTokensMinted not changed as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].getTokensSoldFor(ETH)).toNumber(),
                init_getTokensSoldForETH.toNumber(),
                "getTokensSoldForETH not changed as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].getTokensSoldFor(POLY)).toNumber(),
                init_getTokensSoldForPOLY.add(investment_Token).toNumber(),
                "getTokensSoldForPOLY not changed as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].investorInvestedUSD.call(ACCREDITED1)).toNumber(),
                init_investorInvestedUSD.add(investment_USD).toNumber(),
                "investorInvestedUSD not changed as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].investorInvested.call(ACCREDITED1, ETH)).toNumber(),
                init_investorInvestedETH.toNumber(),
                "investorInvestedETH not changed as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].investorInvested.call(ACCREDITED1, POLY)).toNumber(),
                init_investorInvestedPOLY.add(investment_POLY).toNumber(),
                "investorInvestedPOLY not changed as expected"
            );
        });

        it("should successfully modify NONACCREDITED cap for NONACCREDITED1", async () => {
            let stoId = 0;
            let tierId = 0;
            console.log("Current investment: " + (await I_USDTieredSTO_Array[stoId].investorInvestedUSD.call(NONACCREDITED1)).toNumber());
            await I_USDTieredSTO_Array[stoId].changeNonAccreditedLimit([NONACCREDITED1], [_nonAccreditedLimitUSD[stoId].div(2)], {
                from: ISSUER
            });
            let investorStatus = await I_USDTieredSTO_Array[stoId].investors.call(NONACCREDITED1);
            console.log("Current limit: " + investorStatus[2].toNumber());
            let totalStatus = await I_USDTieredSTO_Array[stoId].getAccreditedData.call();
            
            assert.equal(totalStatus[0][0], NONACCREDITED1, "Account match");
            assert.equal(totalStatus[0][1], ACCREDITED1, "Account match");
            assert.equal(totalStatus[1][0], false, "Account match");
            assert.equal(totalStatus[1][1], true, "Account match");
            assert.equal(totalStatus[2][0].toNumber(), _nonAccreditedLimitUSD[stoId].div(2), "override match");
            assert.equal(totalStatus[2][1].toNumber(), 0, "override match");

        });

        it("should successfully buy a partial amount and refund balance when reaching NONACCREDITED cap", async () => {
            let stoId = 0;
            let tierId = 0;

            let investorStatus = await I_USDTieredSTO_Array[stoId].investors.call(NONACCREDITED1);
            let investment_USD = investorStatus[2];//await I_USDTieredSTO_Array[stoId].nonAccreditedLimitUSDOverride(NONACCREDITED1); //_nonAccreditedLimitUSD[stoId];
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
            let init_InvestorETHBal = new BigNumber(await web3.eth.getBalance(NONACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let init_WalletETHBal = new BigNumber(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            // Buy with ETH
            let tx1 = await I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, {
                from: NONACCREDITED1,
                value: investment_ETH,
                gasPrice: GAS_PRICE
            });
            let gasCost1 = new BigNumber(GAS_PRICE).mul(tx1.receipt.gasUsed);
            console.log("          Gas buyWithETH: ".grey + tx1.receipt.gasUsed.toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let final_InvestorETHBal = new BigNumber(await web3.eth.getBalance(NONACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let final_WalletETHBal = new BigNumber(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            assert.equal(
                final_TokenSupply.toNumber(),
                init_TokenSupply
                    .add(investment_Token)
                    .sub(refund_Token)
                    .toNumber(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toNumber(),
                init_InvestorTokenBal
                    .add(investment_Token)
                    .sub(refund_Token)
                    .toNumber(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_InvestorETHBal.toNumber(),
                init_InvestorETHBal
                    .sub(gasCost1)
                    .sub(investment_ETH)
                    .add(refund_ETH)
                    .toNumber(),
                "Investor ETH Balance not changed as expected"
            );
            assert.equal(
                final_InvestorPOLYBal.toNumber(),
                init_InvestorPOLYBal.toNumber(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toNumber(),
                init_STOTokenSold
                    .add(investment_Token)
                    .sub(refund_Token)
                    .toNumber(),
                "STO Token Sold not changed as expected"
            );
            assert.equal(final_STOETHBal.toNumber(), init_STOETHBal.toNumber(), "STO ETH Balance not changed as expected");
            assert.equal(final_STOPOLYBal.toNumber(), init_STOPOLYBal.toNumber(), "STO POLY Balance not changed as expected");
            assert.equal(
                final_RaisedETH.toNumber(),
                init_RaisedETH
                    .add(investment_ETH)
                    .sub(refund_ETH)
                    .toNumber(),
                "Raised ETH not changed as expected"
            );
            assert.equal(final_RaisedPOLY.toNumber(), init_RaisedPOLY.toNumber(), "Raised POLY not changed as expected");
            assert.equal(
                final_WalletETHBal.toNumber(),
                init_WalletETHBal
                    .add(investment_ETH)
                    .sub(refund_ETH)
                    .toNumber(),
                "Wallet ETH Balance not changed as expected"
            );
            assert.equal(final_WalletPOLYBal.toNumber(), init_WalletPOLYBal.toNumber(), "Wallet POLY Balance not changed as expected");

            await revertToSnapshot(snap);

            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: NONACCREDITED1 });

            init_TokenSupply = await I_SecurityToken.totalSupply();
            init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            init_InvestorETHBal = new BigNumber(await web3.eth.getBalance(NONACCREDITED1));
            init_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            init_STOETHBal = new BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            init_WalletETHBal = new BigNumber(await web3.eth.getBalance(WALLET));
            init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            // Buy With POLY
            let tx2 = await I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, {
                from: NONACCREDITED1,
                gasPrice: GAS_PRICE
            });
            let gasCost2 = new BigNumber(GAS_PRICE).mul(tx2.receipt.gasUsed);
            console.log("          Gas buyWithPOLY: ".grey + tx2.receipt.gasUsed.toString().grey);

            final_TokenSupply = await I_SecurityToken.totalSupply();
            final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            final_InvestorETHBal = new BigNumber(await web3.eth.getBalance(NONACCREDITED1));
            final_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            final_STOETHBal = new BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            final_WalletETHBal = new BigNumber(await web3.eth.getBalance(WALLET));
            final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            assert.equal(
                final_TokenSupply.toNumber(),
                init_TokenSupply
                    .add(investment_Token)
                    .sub(refund_Token)
                    .toNumber(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toNumber(),
                init_InvestorTokenBal
                    .add(investment_Token)
                    .sub(refund_Token)
                    .toNumber(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_InvestorETHBal.toNumber(),
                init_InvestorETHBal.sub(gasCost2).toNumber(),
                "Investor ETH Balance not changed as expected"
            );
            assert.equal(
                final_InvestorPOLYBal.toNumber(),
                init_InvestorPOLYBal
                    .sub(investment_POLY)
                    .add(refund_POLY)
                    .toNumber(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toNumber(),
                init_STOTokenSold
                    .add(investment_Token)
                    .sub(refund_Token)
                    .toNumber(),
                "STO Token Sold not changed as expected"
            );
            assert.equal(final_STOETHBal.toNumber(), init_STOETHBal.toNumber(), "STO ETH Balance not changed as expected");
            assert.equal(final_STOPOLYBal.toNumber(), init_STOPOLYBal.toNumber(), "STO POLY Balance not changed as expected");
            assert.equal(final_RaisedETH.toNumber(), init_RaisedETH.toNumber(), "Raised ETH not changed as expected");
            assert.equal(
                final_RaisedPOLY.toNumber(),
                init_RaisedPOLY
                    .add(investment_POLY)
                    .sub(refund_POLY)
                    .toNumber(),
                "Raised POLY not changed as expected"
            );
            assert.equal(final_WalletETHBal.toNumber(), init_WalletETHBal.toNumber(), "Wallet ETH Balance not changed as expected");
            assert.equal(
                final_WalletPOLYBal.toNumber(),
                init_WalletPOLYBal
                    .add(investment_POLY)
                    .sub(refund_POLY)
                    .toNumber(),
                "Wallet POLY Balance not changed as expected"
            );
        });

        it("should fail and revert when NONACCREDITED cap reached", async () => {
            let stoId = 0;
            let tierId = 0;

            let investment_Token = new BigNumber(50).mul(10 ** 18);
            let investment_USD = await convert(stoId, tierId, false, "TOKEN", "USD", investment_Token);
            let investment_ETH = await convert(stoId, tierId, false, "TOKEN", "ETH", investment_Token);
            let investment_POLY = await convert(stoId, tierId, false, "TOKEN", "POLY", investment_Token);

            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: NONACCREDITED1, gasPrice: GAS_PRICE });

            // Buy with ETH NONACCREDITED
            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, value: investment_ETH, gasPrice: GAS_PRICE })
            );

            // Buy with POLY NONACCREDITED
            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, { from: NONACCREDITED1, gasPrice: GAS_PRICE })
            );
        });

        it("should fail and revert despite oracle price change when NONACCREDITED cap reached", async () => {
            let stoId = 0;
            let tierId;

            // set new exchange rates
            let high_USDETH = new BigNumber(1000).mul(10 ** 18); // 1000 USD per ETH
            let high_USDPOLY = new BigNumber(50).mul(10 ** 16); // 0.5 USD per POLY
            let low_USDETH = new BigNumber(250).mul(10 ** 18); // 250 USD per ETH
            let low_USDPOLY = new BigNumber(20).mul(10 ** 16); // 0.2 USD per POLY

            let investment_USD = new BigNumber(web3.utils.toWei("50")); // USD
            let investment_ETH_high = investment_USD.div(high_USDETH).mul(10 ** 18); // USD / USD/ETH = ETH
            let investment_POLY_high = investment_USD.div(high_USDPOLY).mul(10 ** 18); // USD / USD/POLY = POLY
            let investment_ETH_low = investment_USD.div(low_USDETH).mul(10 ** 18); // USD / USD/ETH = ETH
            let investment_POLY_low = investment_USD.div(low_USDPOLY).mul(10 ** 18); // USD / USD/POLY = POLY

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
                })
            );

            // Buy with POLY NONACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY_high, { from: NONACCREDITED1, gasPrice: GAS_PRICE })
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
                })
            );

            // Buy with POLY NONACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY_low, { from: NONACCREDITED1, gasPrice: GAS_PRICE })
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
                (await I_USDTieredSTO_Array[stoId].currentTier.call()).toNumber(),
                startTier,
                "currentTier not changed as expected"
            );

            let delta_Token = new BigNumber(5).mul(10 ** 18);
            let ethTier0 = await convert(stoId, startTier, false, "TOKEN", "ETH", delta_Token);
            let ethTier1 = await convert(stoId, endTier, false, "TOKEN", "ETH", delta_Token);

            let investment_Token = delta_Token.add(delta_Token); // 10 Token
            let investment_ETH = ethTier0.add(ethTier1); // 0.0025 ETH

            // Process investment
            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let init_InvestorETHBal = new BigNumber(await web3.eth.getBalance(NONACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let init_WalletETHBal = new BigNumber(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            let tx1 = await I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, {
                from: NONACCREDITED1,
                value: investment_ETH,
                gasPrice: GAS_PRICE
            });
            let gasCost1 = new BigNumber(GAS_PRICE).mul(tx1.receipt.gasUsed);
            console.log("          Gas buyWithETH: ".grey + tx1.receipt.gasUsed.toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let final_InvestorETHBal = new BigNumber(await web3.eth.getBalance(NONACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let final_WalletETHBal = new BigNumber(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            assert.equal(
                final_TokenSupply.toNumber(),
                init_TokenSupply.add(investment_Token).toNumber(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toNumber(),
                init_InvestorTokenBal.add(investment_Token).toNumber(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_InvestorETHBal.toNumber(),
                init_InvestorETHBal
                    .sub(gasCost1)
                    .sub(investment_ETH)
                    .toNumber(),
                "Investor ETH Balance not changed as expected"
            );
            assert.equal(
                final_InvestorPOLYBal.toNumber(),
                init_InvestorPOLYBal.toNumber(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toNumber(),
                init_STOTokenSold.add(investment_Token).toNumber(),
                "STO Token Sold not changed as expected"
            );
            assert.equal(final_STOETHBal.toNumber(), init_STOETHBal.toNumber(), "STO ETH Balance not changed as expected");
            assert.equal(final_STOPOLYBal.toNumber(), init_STOPOLYBal.toNumber(), "STO POLY Balance not changed as expected");
            assert.equal(final_RaisedETH.toNumber(), init_RaisedETH.add(investment_ETH).toNumber(), "Raised ETH not changed as expected");
            assert.equal(final_RaisedPOLY.toNumber(), init_RaisedPOLY.toNumber(), "Raised POLY not changed as expected");
            assert.equal(
                final_WalletETHBal.toNumber(),
                init_WalletETHBal.add(investment_ETH).toNumber(),
                "Wallet ETH Balance not changed as expected"
            );
            assert.equal(final_WalletPOLYBal.toNumber(), init_WalletPOLYBal.toNumber(), "Wallet POLY Balance not changed as expected");

            // Additional Checks
            assert.equal((await I_USDTieredSTO_Array[stoId].currentTier.call()).toNumber(), endTier, "currentTier not changed as expected");
        });

        it("should successfully buy across tiers for NONACCREDITED POLY", async () => {
            let stoId = 1;
            let startTier = 1;
            let endTier = 2;

            assert.equal(
                (await I_USDTieredSTO_Array[stoId].currentTier.call()).toNumber(),
                startTier,
                "currentTier not changed as expected"
            );

            let delta_Token = new BigNumber(5).mul(10 ** 18); // Token
            let polyTier0 = await convert(stoId, startTier, false, "TOKEN", "POLY", delta_Token);
            let polyTier1 = await convert(stoId, endTier, false, "TOKEN", "POLY", delta_Token);

            let investment_Token = delta_Token.add(delta_Token); // 10 Token
            let investment_POLY = polyTier0.add(polyTier1); // 0.0025 ETH

            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: NONACCREDITED1 });

            // Process investment
            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let init_InvestorETHBal = new BigNumber(await web3.eth.getBalance(NONACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let init_WalletETHBal = new BigNumber(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            let tx2 = await I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, {
                from: NONACCREDITED1,
                gasPrice: GAS_PRICE
            });
            let gasCost2 = new BigNumber(GAS_PRICE).mul(tx2.receipt.gasUsed);
            console.log("          Gas buyWithPOLY: ".grey + tx2.receipt.gasUsed.toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let final_InvestorETHBal = new BigNumber(await web3.eth.getBalance(NONACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let final_WalletETHBal = new BigNumber(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            assert.equal(
                final_TokenSupply.toNumber(),
                init_TokenSupply.add(investment_Token).toNumber(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toNumber(),
                init_InvestorTokenBal.add(investment_Token).toNumber(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_InvestorETHBal.toNumber(),
                init_InvestorETHBal.sub(gasCost2).toNumber(),
                "Investor ETH Balance not changed as expected"
            );
            assert.equal(
                final_InvestorPOLYBal.toNumber(),
                init_InvestorPOLYBal.sub(investment_POLY).toNumber(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toNumber(),
                init_STOTokenSold.add(investment_Token).toNumber(),
                "STO Token Sold not changed as expected"
            );
            assert.equal(final_STOETHBal.toNumber(), init_STOETHBal.toNumber(), "STO ETH Balance not changed as expected");
            assert.equal(final_STOPOLYBal.toNumber(), init_STOPOLYBal.toNumber(), "STO POLY Balance not changed as expected");
            assert.equal(final_RaisedETH.toNumber(), init_RaisedETH.toNumber(), "Raised ETH not changed as expected");
            assert.equal(
                final_RaisedPOLY.toNumber(),
                init_RaisedPOLY.add(investment_POLY).toNumber(),
                "Raised POLY not changed as expected"
            );
            assert.equal(final_WalletETHBal.toNumber(), init_WalletETHBal.toNumber(), "Wallet ETH Balance not changed as expected");
            assert.equal(
                final_WalletPOLYBal.toNumber(),
                init_WalletPOLYBal.add(investment_POLY).toNumber(),
                "Wallet POLY Balance not changed as expected"
            );

            // Additional Checks
            assert.equal((await I_USDTieredSTO_Array[stoId].currentTier.call()).toNumber(), endTier, "currentTier not changed as expected");
        });

        it("should successfully buy across tiers for ACCREDITED ETH", async () => {
            let stoId = 1;
            let startTier = 2;
            let endTier = 3;

            await I_USDTieredSTO_Array[stoId].changeAccredited([ACCREDITED1], [true], { from: ISSUER });

            assert.equal(
                (await I_USDTieredSTO_Array[stoId].currentTier.call()).toNumber(),
                startTier,
                "currentTier not changed as expected"
            );

            let delta_Token = new BigNumber(5).mul(10 ** 18); // Token
            let ethTier0 = await convert(stoId, startTier, false, "TOKEN", "ETH", delta_Token);
            let ethTier1 = await convert(stoId, endTier, false, "TOKEN", "ETH", delta_Token);

            let investment_Token = delta_Token.add(delta_Token); // 10 Token
            let investment_ETH = ethTier0.add(ethTier1); // 0.0025 ETH

            // Process investment
            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let init_InvestorETHBal = new BigNumber(await web3.eth.getBalance(ACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let init_WalletETHBal = new BigNumber(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            let tx1 = await I_USDTieredSTO_Array[stoId].buyWithETH(ACCREDITED1, {
                from: ACCREDITED1,
                value: investment_ETH,
                gasPrice: GAS_PRICE
            });
            let gasCost1 = new BigNumber(GAS_PRICE).mul(tx1.receipt.gasUsed);
            console.log("          Gas buyWithETH: ".grey + tx1.receipt.gasUsed.toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let final_InvestorETHBal = new BigNumber(await web3.eth.getBalance(ACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let final_WalletETHBal = new BigNumber(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            assert.equal(
                final_TokenSupply.toNumber(),
                init_TokenSupply.add(investment_Token).toNumber(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toNumber(),
                init_InvestorTokenBal.add(investment_Token).toNumber(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_InvestorETHBal.toNumber(),
                init_InvestorETHBal
                    .sub(gasCost1)
                    .sub(investment_ETH)
                    .toNumber(),
                "Investor ETH Balance not changed as expected"
            );
            assert.equal(
                final_InvestorPOLYBal.toNumber(),
                init_InvestorPOLYBal.toNumber(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toNumber(),
                init_STOTokenSold.add(investment_Token).toNumber(),
                "STO Token Sold not changed as expected"
            );
            assert.equal(final_STOETHBal.toNumber(), init_STOETHBal.toNumber(), "STO ETH Balance not changed as expected");
            assert.equal(final_STOPOLYBal.toNumber(), init_STOPOLYBal.toNumber(), "STO POLY Balance not changed as expected");
            assert.equal(final_RaisedETH.toNumber(), init_RaisedETH.add(investment_ETH).toNumber(), "Raised ETH not changed as expected");
            assert.equal(final_RaisedPOLY.toNumber(), init_RaisedPOLY.toNumber(), "Raised POLY not changed as expected");
            assert.equal(
                final_WalletETHBal.toNumber(),
                init_WalletETHBal.add(investment_ETH).toNumber(),
                "Wallet ETH Balance not changed as expected"
            );
            assert.equal(final_WalletPOLYBal.toNumber(), init_WalletPOLYBal.toNumber(), "Wallet POLY Balance not changed as expected");

            // Additional Checks
            assert.equal((await I_USDTieredSTO_Array[stoId].currentTier.call()).toNumber(), endTier, "currentTier not changed as expected");
        });

        it("should successfully buy across tiers for ACCREDITED DAI", async () => {
            let stoId = 1;
            let startTier = 3;
            let endTier = 4;

            assert.equal(
                (await I_USDTieredSTO_Array[stoId].currentTier.call()).toNumber(),
                startTier,
                "currentTier not changed as expected"
            );

            let delta_Token = new BigNumber(5).mul(10 ** 18); // Token
            let daiTier0 = await convert(stoId, startTier, false, "TOKEN", "USD", delta_Token);
            let daiTier1 = await convert(stoId, endTier, false, "TOKEN", "USD", delta_Token);

            let investment_Token = delta_Token.add(delta_Token); // 10 Token
            let investment_DAI = daiTier0.add(daiTier1);

            await I_DaiToken.getTokens(investment_DAI, ACCREDITED1);
            await I_DaiToken.approve(I_USDTieredSTO_Array[stoId].address, investment_DAI, { from: ACCREDITED1 });

            // Process investment
            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let init_InvestorETHBal = new BigNumber(await web3.eth.getBalance(ACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let init_InvestorDAIBal = await I_DaiToken.balanceOf(ACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let init_RaisedDAI = await I_USDTieredSTO_Array[stoId].fundsRaised.call(DAI);
            let init_WalletETHBal = new BigNumber(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);
            let init_WalletDAIBal = await I_DaiToken.balanceOf(WALLET);

            let tx2 = await I_USDTieredSTO_Array[stoId].buyWithUSD(ACCREDITED1, investment_DAI, I_DaiToken.address, { from: ACCREDITED1, gasPrice: GAS_PRICE });
            let gasCost2 = new BigNumber(GAS_PRICE).mul(tx2.receipt.gasUsed);
            console.log("          Gas buyWithUSD: ".grey + tx2.receipt.gasUsed.toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let final_InvestorETHBal = new BigNumber(await web3.eth.getBalance(ACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let final_InvestorDAIBal = await I_DaiToken.balanceOf(ACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let final_RaisedDAI = await I_USDTieredSTO_Array[stoId].fundsRaised.call(DAI);
            let final_WalletETHBal = new BigNumber(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);
            let final_WalletDAIBal = await I_DaiToken.balanceOf(WALLET);

            assert.equal(
                final_TokenSupply.toNumber(),
                init_TokenSupply.add(investment_Token).toNumber(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toNumber(),
                init_InvestorTokenBal.add(investment_Token).toNumber(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_InvestorETHBal.toNumber(),
                init_InvestorETHBal.sub(gasCost2).toNumber(),
                "Investor ETH Balance not changed as expected"
            );
            assert.equal(
                final_InvestorPOLYBal.toNumber(),
                init_InvestorPOLYBal.toNumber(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_InvestorDAIBal.toNumber(),
                init_InvestorDAIBal.sub(investment_DAI).toNumber(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toNumber(),
                init_STOTokenSold.add(investment_Token).toNumber(),
                "STO Token Sold not changed as expected"
            );
            assert.equal(final_STOETHBal.toNumber(), init_STOETHBal.toNumber(), "STO ETH Balance not changed as expected");
            assert.equal(final_STOPOLYBal.toNumber(), init_STOPOLYBal.toNumber(), "STO POLY Balance not changed as expected");
            assert.equal(final_RaisedETH.toNumber(), init_RaisedETH.toNumber(), "Raised ETH not changed as expected");
            assert.equal(final_RaisedPOLY.toNumber(), init_RaisedPOLY.toNumber(), "Raised POLY not changed as expected");
            assert.equal(final_RaisedDAI.toNumber(), init_RaisedDAI.add(investment_DAI).toNumber(), "Raised DAI not changed as expected");
            assert.equal(final_WalletETHBal.toNumber(), init_WalletETHBal.toNumber(), "Wallet ETH Balance not changed as expected");
            assert.equal(final_WalletPOLYBal.toNumber(), init_WalletPOLYBal.toNumber(), "Wallet POLY Balance not changed as expected");
            assert.equal(
                final_WalletDAIBal.toNumber(),
                init_WalletDAIBal.add(investment_DAI).toNumber(),
                "Wallet POLY Balance not changed as expected"
            );

            // Additional Checks
            assert.equal((await I_USDTieredSTO_Array[stoId].currentTier.call()).toNumber(), endTier, "currentTier not changed as expected");
        });

        it("should successfully buy across tiers for ACCREDITED POLY", async () => {
            let stoId = 1;
            let startTier = 4;
            let endTier = 5;

            assert.equal(
                (await I_USDTieredSTO_Array[stoId].currentTier.call()).toNumber(),
                startTier,
                "currentTier not changed as expected"
            );

            let delta_Token = new BigNumber(5).mul(10 ** 18); // Token
            let polyTier0 = await convert(stoId, startTier, false, "TOKEN", "POLY", delta_Token);
            let polyTier1 = await convert(stoId, endTier, false, "TOKEN", "POLY", delta_Token);

            let investment_Token = delta_Token.add(delta_Token); // 10 Token
            let investment_POLY = polyTier0.add(polyTier1); // 0.0025 ETH

            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: ACCREDITED1 });

            // Process investment
            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let init_InvestorETHBal = new BigNumber(await web3.eth.getBalance(ACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let init_WalletETHBal = new BigNumber(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            let tx2 = await I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, {
                from: ACCREDITED1,
                gasPrice: GAS_PRICE
            });
            let gasCost2 = new BigNumber(GAS_PRICE).mul(tx2.receipt.gasUsed);
            console.log("          Gas buyWithPOLY: ".grey + tx2.receipt.gasUsed.toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let final_InvestorETHBal = new BigNumber(await web3.eth.getBalance(ACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let final_WalletETHBal = new BigNumber(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            assert.equal(
                final_TokenSupply.toNumber(),
                init_TokenSupply.add(investment_Token).toNumber(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toNumber(),
                init_InvestorTokenBal.add(investment_Token).toNumber(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_InvestorETHBal.toNumber(),
                init_InvestorETHBal.sub(gasCost2).toNumber(),
                "Investor ETH Balance not changed as expected"
            );
            assert.equal(
                final_InvestorPOLYBal.toNumber(),
                init_InvestorPOLYBal.sub(investment_POLY).toNumber(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toNumber(),
                init_STOTokenSold.add(investment_Token).toNumber(),
                "STO Token Sold not changed as expected"
            );
            assert.equal(final_STOETHBal.toNumber(), init_STOETHBal.toNumber(), "STO ETH Balance not changed as expected");
            assert.equal(final_STOPOLYBal.toNumber(), init_STOPOLYBal.toNumber(), "STO POLY Balance not changed as expected");
            assert.equal(final_RaisedETH.toNumber(), init_RaisedETH.toNumber(), "Raised ETH not changed as expected");
            assert.equal(
                final_RaisedPOLY.toNumber(),
                init_RaisedPOLY.add(investment_POLY).toNumber(),
                "Raised POLY not changed as expected"
            );
            assert.equal(final_WalletETHBal.toNumber(), init_WalletETHBal.toNumber(), "Wallet ETH Balance not changed as expected");
            assert.equal(
                final_WalletPOLYBal.toNumber(),
                init_WalletPOLYBal.add(investment_POLY).toNumber(),
                "Wallet POLY Balance not changed as expected"
            );

            // Additional Checks
            assert.equal((await I_USDTieredSTO_Array[stoId].currentTier.call()).toNumber(), endTier, "currentTier not changed as expected");
        });

        it("should buy out the rest of the sto", async () => {
            let stoId = 1;
            let tierId = 5;

            let minted = (await I_USDTieredSTO_Array[stoId].tiers.call(tierId))[4];
            console.log(minted.toNumber() + ":" + _tokensPerTierTotal[stoId][tierId]);
            let investment_Token = _tokensPerTierTotal[stoId][tierId].sub(minted);
            console.log(investment_Token.toNumber());
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
                final_TokenSupply.toNumber(),
                init_TokenSupply.add(investment_Token).toNumber(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toNumber(),
                init_InvestorTokenBal.add(investment_Token).toNumber(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toNumber(),
                init_STOTokenSold.add(investment_Token).toNumber(),
                "STO Token Sold not changed as expected"
            );
            // assert.equal((await I_USDTieredSTO_Array[1].getTokensMinted()).toNumber(), _tokensPerTierTotal[1].reduce((a, b) => a + b, 0).toNumber(), "STO Token Sold not changed as expected");
        });

        it("should fail and revert when all tiers sold out", async () => {
            let stoId = 1;
            let tierId = 4;

            let investment_Token = new BigNumber(5).mul(10 ** 18);
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
                I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, value: investment_ETH, gasPrice: GAS_PRICE })
            );

            // Buy with POLY NONACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, { from: NONACCREDITED1, gasPrice: GAS_PRICE })
            );

            // Buy with DAI NONACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithUSD(NONACCREDITED1, investment_DAI, I_DaiToken.address, { from: NONACCREDITED1, gasPrice: GAS_PRICE })
            );

            // Buy with ETH ACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithETH(ACCREDITED1, { from: ACCREDITED1, value: investment_ETH, gasPrice: GAS_PRICE })
            );

            // Buy with POLY ACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, { from: ACCREDITED1, gasPrice: GAS_PRICE })
            );

            // Buy with DAI ACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithUSD(ACCREDITED1, investment_DAI, I_DaiToken.address, { from: ACCREDITED1, gasPrice: GAS_PRICE })
            );
        });

        it("should fail and revert when all tiers sold out despite oracle price change", async () => {
            let stoId = 1;
            let tierId = 4;

            // set new exchange rates
            let high_USDETH = new BigNumber(1000).mul(10 ** 18); // 1000 USD per ETH
            let high_USDPOLY = new BigNumber(50).mul(10 ** 16); // 0.5 USD per POLY
            let low_USDETH = new BigNumber(250).mul(10 ** 18); // 250 USD per ETH
            let low_USDPOLY = new BigNumber(20).mul(10 ** 16); // 0.2 USD per POLY

            let investment_USD = new BigNumber(web3.utils.toWei("50")); // USD
            let investment_ETH_high = investment_USD.div(high_USDETH).mul(10 ** 18); // USD / USD/ETH = ETH
            let investment_POLY_high = investment_USD.div(high_USDPOLY).mul(10 ** 18); // USD / USD/POLY = POLY
            let investment_ETH_low = investment_USD.div(low_USDETH).mul(10 ** 18); // USD / USD/ETH = ETH
            let investment_POLY_low = investment_USD.div(low_USDPOLY).mul(10 ** 18); // USD / USD/POLY = POLY

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
                })
            );

            // Buy with POLY NONACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY_high, { from: NONACCREDITED1, gasPrice: GAS_PRICE })
            );

            // Buy with ETH ACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithETH(ACCREDITED1, { from: ACCREDITED1, value: investment_ETH_high, gasPrice: GAS_PRICE })
            );

            // Buy with POLY ACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY_high, { from: ACCREDITED1, gasPrice: GAS_PRICE })
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
                })
            );

            // Buy with POLY NONACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY_low, { from: NONACCREDITED1, gasPrice: GAS_PRICE })
            );

            // Buy with ETH ACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithETH(ACCREDITED1, { from: ACCREDITED1, value: investment_ETH_low, gasPrice: GAS_PRICE })
            );

            // Buy with POLY ACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY_low, { from: ACCREDITED1, gasPrice: GAS_PRICE })
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

            let investment_Token = new BigNumber(5).mul(10 ** 18);
            let investment_USD = await convert(stoId, tierId, false, "TOKEN", "USD", investment_Token);
            let investment_ETH = await convert(stoId, tierId, false, "TOKEN", "ETH", investment_Token);
            let investment_POLY = await convert(stoId, tierId, false, "TOKEN", "POLY", investment_Token);

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let init_InvestorETHBal = new BigNumber(await web3.eth.getBalance(NONACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedUSD = await I_USDTieredSTO_Array[stoId].fundsRaisedUSD.call();
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let init_WalletETHBal = new BigNumber(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            let tx1 = await web3.eth.sendTransaction({
                from: NONACCREDITED1,
                to: I_USDTieredSTO_Array[stoId].address,
                value: investment_ETH,
                gasPrice: GAS_PRICE,
                gas: 1000000
            });
            let gasCost1 = new BigNumber(GAS_PRICE).mul(tx1.gasUsed);
            console.log("          Gas fallback purchase: ".grey + tx1.gasUsed.toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let final_InvestorETHBal = new BigNumber(await web3.eth.getBalance(NONACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedUSD = await I_USDTieredSTO_Array[stoId].fundsRaisedUSD.call();
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let final_WalletETHBal = new BigNumber(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            assert.equal(
                final_TokenSupply.toNumber(),
                init_TokenSupply.add(investment_Token).toNumber(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toNumber(),
                init_InvestorTokenBal.add(investment_Token).toNumber(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_InvestorETHBal.toNumber(),
                init_InvestorETHBal
                    .sub(gasCost1)
                    .sub(investment_ETH)
                    .toNumber(),
                "Investor ETH Balance not changed as expected"
            );
            assert.equal(
                final_InvestorPOLYBal.toNumber(),
                init_InvestorPOLYBal.toNumber(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toNumber(),
                init_STOTokenSold.add(investment_Token).toNumber(),
                "STO Token Sold not changed as expected"
            );
            assert.equal(final_STOETHBal.toNumber(), init_STOETHBal.toNumber(), "STO ETH Balance not changed as expected");
            assert.equal(final_STOPOLYBal.toNumber(), init_STOPOLYBal.toNumber(), "STO POLY Balance not changed as expected");
            assert.equal(final_RaisedUSD.toNumber(), init_RaisedUSD.add(investment_USD).toNumber(), "Raised USD not changed as expected");
            assert.equal(final_RaisedETH.toNumber(), init_RaisedETH.add(investment_ETH).toNumber(), "Raised ETH not changed as expected");
            assert.equal(final_RaisedPOLY.toNumber(), init_RaisedPOLY.toNumber(), "Raised POLY not changed as expected");
            assert.equal(
                final_WalletETHBal.toNumber(),
                init_WalletETHBal.add(investment_ETH).toNumber(),
                "Wallet ETH Balance not changed as expected"
            );
            assert.equal(final_WalletPOLYBal.toNumber(), init_WalletPOLYBal.toNumber(), "Wallet POLY Balance not changed as expected");

            // Additional checks on getters
            assert.equal((await I_USDTieredSTO_Array[stoId].investorCount.call()).toNumber(), 1, "Investor count not changed as expected");
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].getTokensSold()).toNumber(),
                investment_Token.toNumber(),
                "getTokensSold not changed as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].getTokensMinted()).toNumber(),
                investment_Token.toNumber(),
                "getTokensMinted not changed as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].getTokensSoldFor(ETH)).toNumber(),
                investment_Token.toNumber(),
                "getTokensSoldForETH not changed as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].getTokensSoldFor(POLY)).toNumber(),
                0,
                "getTokensSoldForPOLY not changed as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].investorInvestedUSD.call(NONACCREDITED1)).toNumber(),
                investment_USD.toNumber(),
                "investorInvestedUSD not changed as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].investorInvested.call(NONACCREDITED1, ETH)).toNumber(),
                investment_ETH.toNumber(),
                "investorInvestedETH not changed as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].investorInvested.call(NONACCREDITED1, POLY)).toNumber(),
                0,
                "investorInvestedPOLY not changed as expected"
            );
        });

        it("should successfully buy using buyWithETH at tier 0 for NONACCREDITED1", async () => {
            let stoId = 2;
            let tierId = 0;

            let investment_Token = new BigNumber(5).mul(10 ** 18);
            let investment_USD = await convert(stoId, tierId, false, "TOKEN", "USD", investment_Token);
            let investment_ETH = await convert(stoId, tierId, false, "TOKEN", "ETH", investment_Token);
            let investment_POLY = await convert(stoId, tierId, false, "TOKEN", "POLY", investment_Token);

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let init_InvestorETHBal = new BigNumber(await web3.eth.getBalance(NONACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let init_WalletETHBal = new BigNumber(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            let tx1 = await I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, {
                from: NONACCREDITED1,
                value: investment_ETH,
                gasPrice: GAS_PRICE
            });
            let gasCost1 = new BigNumber(GAS_PRICE).mul(tx1.receipt.gasUsed);
            console.log("          Gas buyWithETH: ".grey + tx1.receipt.gasUsed.toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let final_InvestorETHBal = new BigNumber(await web3.eth.getBalance(NONACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let final_WalletETHBal = new BigNumber(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            assert.equal(
                final_TokenSupply.toNumber(),
                init_TokenSupply.add(investment_Token).toNumber(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toNumber(),
                init_InvestorTokenBal.add(investment_Token).toNumber(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_InvestorETHBal.toNumber(),
                init_InvestorETHBal
                    .sub(gasCost1)
                    .sub(investment_ETH)
                    .toNumber(),
                "Investor ETH Balance not changed as expected"
            );
            assert.equal(
                final_InvestorPOLYBal.toNumber(),
                init_InvestorPOLYBal.toNumber(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toNumber(),
                init_STOTokenSold.add(investment_Token).toNumber(),
                "STO Token Sold not changed as expected"
            );
            assert.equal(final_STOETHBal.toNumber(), init_STOETHBal.toNumber(), "STO ETH Balance not changed as expected");
            assert.equal(final_STOPOLYBal.toNumber(), init_STOPOLYBal.toNumber(), "STO POLY Balance not changed as expected");
            assert.equal(final_RaisedETH.toNumber(), init_RaisedETH.add(investment_ETH).toNumber(), "Raised ETH not changed as expected");
            assert.equal(final_RaisedPOLY.toNumber(), init_RaisedPOLY.toNumber(), "Raised POLY not changed as expected");
            assert.equal(
                final_WalletETHBal.toNumber(),
                init_WalletETHBal.add(investment_ETH).toNumber(),
                "Wallet ETH Balance not changed as expected"
            );
            assert.equal(final_WalletPOLYBal.toNumber(), init_WalletPOLYBal.toNumber(), "Wallet POLY Balance not changed as expected");
        });

        it("should successfully buy using buyWithPOLY at tier 0 for NONACCREDITED1", async () => {
            let stoId = 2;
            let tierId = 0;

            let investment_Token = new BigNumber(5).mul(10 ** 18);
            let investment_USD = await convert(stoId, tierId, true, "TOKEN", "USD", investment_Token);
            let investment_ETH = await convert(stoId, tierId, true, "TOKEN", "ETH", investment_Token);
            let investment_POLY = await convert(stoId, tierId, true, "TOKEN", "POLY", investment_Token);

            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: NONACCREDITED1 });

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let init_InvestorETHBal = new BigNumber(await web3.eth.getBalance(NONACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let init_WalletETHBal = new BigNumber(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            // Buy With POLY
            let tx2 = await I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, {
                from: NONACCREDITED1,
                gasPrice: GAS_PRICE
            });
            let gasCost2 = new BigNumber(GAS_PRICE).mul(tx2.receipt.gasUsed);
            console.log("          Gas buyWithPOLY: ".grey + tx2.receipt.gasUsed.toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let final_InvestorETHBal = new BigNumber(await web3.eth.getBalance(NONACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let final_WalletETHBal = new BigNumber(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            assert.equal(
                final_TokenSupply.toNumber(),
                init_TokenSupply.add(investment_Token).toNumber(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toNumber(),
                init_InvestorTokenBal.add(investment_Token).toNumber(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_InvestorETHBal.toNumber(),
                init_InvestorETHBal.sub(gasCost2).toNumber(),
                "Investor ETH Balance not changed as expected"
            );
            assert.equal(
                final_InvestorPOLYBal.toNumber(),
                init_InvestorPOLYBal.sub(investment_POLY).toNumber(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toNumber(),
                init_STOTokenSold.add(investment_Token).toNumber(),
                "STO Token Sold not changed as expected"
            );
            assert.equal(final_STOETHBal.toNumber(), init_STOETHBal.toNumber(), "STO ETH Balance not changed as expected");
            assert.equal(final_STOPOLYBal.toNumber(), init_STOPOLYBal.toNumber(), "STO POLY Balance not changed as expected");
            assert.equal(final_RaisedETH.toNumber(), init_RaisedETH.toNumber(), "Raised ETH not changed as expected");
            assert.equal(
                final_RaisedPOLY.toNumber(),
                init_RaisedPOLY.add(investment_POLY).toNumber(),
                "Raised POLY not changed as expected"
            );
            assert.equal(final_WalletETHBal.toNumber(), init_WalletETHBal.toNumber(), "Wallet ETH Balance not changed as expected");
            assert.equal(
                final_WalletPOLYBal.toNumber(),
                init_WalletPOLYBal.add(investment_POLY).toNumber(),
                "Wallet POLY Balance not changed as expected"
            );
        });

        it("should successfully buy using fallback at tier 0 for ACCREDITED1", async () => {
            let stoId = 2;
            let tierId = 0;

            await I_USDTieredSTO_Array[stoId].changeAccredited([ACCREDITED1], [true], { from: ISSUER });

            let investment_Token = new BigNumber(5).mul(10 ** 18);
            let investment_USD = await convert(stoId, tierId, false, "TOKEN", "USD", investment_Token);
            let investment_ETH = await convert(stoId, tierId, false, "TOKEN", "ETH", investment_Token);
            let investment_POLY = await convert(stoId, tierId, false, "TOKEN", "POLY", investment_Token);

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let init_InvestorETHBal = new BigNumber(await web3.eth.getBalance(ACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let init_WalletETHBal = new BigNumber(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            let tx1 = await web3.eth.sendTransaction({
                from: ACCREDITED1,
                to: I_USDTieredSTO_Array[stoId].address,
                value: investment_ETH,
                gasPrice: GAS_PRICE,
                gas: 1000000
            });
            let gasCost1 = new BigNumber(GAS_PRICE).mul(tx1.gasUsed);
            console.log("          Gas fallback purchase: ".grey + tx1.gasUsed.toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let final_InvestorETHBal = new BigNumber(await web3.eth.getBalance(ACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let final_WalletETHBal = new BigNumber(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            assert.equal(
                final_TokenSupply.toNumber(),
                init_TokenSupply.add(investment_Token).toNumber(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toNumber(),
                init_InvestorTokenBal.add(investment_Token).toNumber(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_InvestorETHBal.toNumber(),
                init_InvestorETHBal
                    .sub(gasCost1)
                    .sub(investment_ETH)
                    .toNumber(),
                "Investor ETH Balance not changed as expected"
            );
            assert.equal(
                final_InvestorPOLYBal.toNumber(),
                init_InvestorPOLYBal.toNumber(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toNumber(),
                init_STOTokenSold.add(investment_Token).toNumber(),
                "STO Token Sold not changed as expected"
            );
            assert.equal(final_STOETHBal.toNumber(), init_STOETHBal.toNumber(), "STO ETH Balance not changed as expected");
            assert.equal(final_STOPOLYBal.toNumber(), init_STOPOLYBal.toNumber(), "STO POLY Balance not changed as expected");
            assert.equal(final_RaisedETH.toNumber(), init_RaisedETH.add(investment_ETH).toNumber(), "Raised ETH not changed as expected");
            assert.equal(final_RaisedPOLY.toNumber(), init_RaisedPOLY.toNumber(), "Raised POLY not changed as expected");
            assert.equal(
                final_WalletETHBal.toNumber(),
                init_WalletETHBal.add(investment_ETH).toNumber(),
                "Wallet ETH Balance not changed as expected"
            );
            assert.equal(final_WalletPOLYBal.toNumber(), init_WalletPOLYBal.toNumber(), "Wallet POLY Balance not changed as expected");
        });

        it("should successfully buy using buyWithETH at tier 0 for ACCREDITED1", async () => {
            let stoId = 2;
            let tierId = 0;

            let investment_Token = new BigNumber(5).mul(10 ** 18);
            let investment_USD = await convert(stoId, tierId, false, "TOKEN", "USD", investment_Token);
            let investment_ETH = await convert(stoId, tierId, false, "TOKEN", "ETH", investment_Token);
            let investment_POLY = await convert(stoId, tierId, false, "TOKEN", "POLY", investment_Token);

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let init_InvestorETHBal = new BigNumber(await web3.eth.getBalance(ACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let init_WalletETHBal = new BigNumber(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            let tx1 = await I_USDTieredSTO_Array[stoId].buyWithETH(ACCREDITED1, {
                from: ACCREDITED1,
                value: investment_ETH,
                gasPrice: GAS_PRICE
            });
            let gasCost1 = new BigNumber(GAS_PRICE).mul(tx1.receipt.gasUsed);
            console.log("          Gas buyWithETH: ".grey + tx1.receipt.gasUsed.toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let final_InvestorETHBal = new BigNumber(await web3.eth.getBalance(ACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let final_WalletETHBal = new BigNumber(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            assert.equal(
                final_TokenSupply.toNumber(),
                init_TokenSupply.add(investment_Token).toNumber(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toNumber(),
                init_InvestorTokenBal.add(investment_Token).toNumber(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_InvestorETHBal.toNumber(),
                init_InvestorETHBal
                    .sub(gasCost1)
                    .sub(investment_ETH)
                    .toNumber(),
                "Investor ETH Balance not changed as expected"
            );
            assert.equal(
                final_InvestorPOLYBal.toNumber(),
                init_InvestorPOLYBal.toNumber(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toNumber(),
                init_STOTokenSold.add(investment_Token).toNumber(),
                "STO Token Sold not changed as expected"
            );
            assert.equal(final_STOETHBal.toNumber(), init_STOETHBal.toNumber(), "STO ETH Balance not changed as expected");
            assert.equal(final_STOPOLYBal.toNumber(), init_STOPOLYBal.toNumber(), "STO POLY Balance not changed as expected");
            assert.equal(final_RaisedETH.toNumber(), init_RaisedETH.add(investment_ETH).toNumber(), "Raised ETH not changed as expected");
            assert.equal(final_RaisedPOLY.toNumber(), init_RaisedPOLY.toNumber(), "Raised POLY not changed as expected");
            assert.equal(
                final_WalletETHBal.toNumber(),
                init_WalletETHBal.add(investment_ETH).toNumber(),
                "Wallet ETH Balance not changed as expected"
            );
            assert.equal(final_WalletPOLYBal.toNumber(), init_WalletPOLYBal.toNumber(), "Wallet POLY Balance not changed as expected");
        });

        it("should successfully buy using buyWithPOLY at tier 0 for ACCREDITED1", async () => {
            let stoId = 2;
            let tierId = 0;

            let investment_Token = new BigNumber(5).mul(10 ** 18);
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
            let init_InvestorETHBal = new BigNumber(await web3.eth.getBalance(ACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let init_WalletETHBal = new BigNumber(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            // Buy With POLY
            let tx2 = await I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, {
                from: ACCREDITED1,
                gasPrice: GAS_PRICE
            });
            let gasCost2 = new BigNumber(GAS_PRICE).mul(tx2.receipt.gasUsed);
            console.log("          Gas buyWithPOLY: ".grey + tx2.receipt.gasUsed.toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let final_InvestorETHBal = new BigNumber(await web3.eth.getBalance(ACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let final_WalletETHBal = new BigNumber(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            assert.equal(
                final_TokenSupply.toNumber(),
                init_TokenSupply.add(investment_Token).toNumber(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toNumber(),
                init_InvestorTokenBal.add(investment_Token).toNumber(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_InvestorETHBal.toNumber(),
                init_InvestorETHBal.sub(gasCost2).toNumber(),
                "Investor ETH Balance not changed as expected"
            );
            assert.equal(
                final_InvestorPOLYBal.toNumber(),
                init_InvestorPOLYBal.sub(investment_POLY).toNumber(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toNumber(),
                init_STOTokenSold.add(investment_Token).toNumber(),
                "STO Token Sold not changed as expected"
            );
            assert.equal(final_STOETHBal.toNumber(), init_STOETHBal.toNumber(), "STO ETH Balance not changed as expected");
            assert.equal(final_STOPOLYBal.toNumber(), init_STOPOLYBal.toNumber(), "STO POLY Balance not changed as expected");
            assert.equal(final_RaisedETH.toNumber(), init_RaisedETH.toNumber(), "Raised ETH not changed as expected");
            assert.equal(
                final_RaisedPOLY.toNumber(),
                init_RaisedPOLY.add(investment_POLY).toNumber(),
                "Raised POLY not changed as expected"
            );
            assert.equal(final_WalletETHBal.toNumber(), init_WalletETHBal.toNumber(), "Wallet ETH Balance not changed as expected");
            assert.equal(
                final_WalletPOLYBal.toNumber(),
                init_WalletPOLYBal.add(investment_POLY).toNumber(),
                "Wallet POLY Balance not changed as expected"
            );

            // Additional checks on getters
            assert.equal((await I_USDTieredSTO_Array[stoId].investorCount.call()).toNumber(), 2, "Investor count not changed as expected");
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].getTokensSold()).toNumber(),
                init_getTokensSold.add(investment_Token).toNumber(),
                "getTokensSold not changed as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].getTokensMinted()).toNumber(),
                init_getTokensMinted.add(investment_Token).toNumber(),
                "getTokensMinted not changed as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].getTokensSoldFor(ETH)).toNumber(),
                init_getTokensSoldForETH.toNumber(),
                "getTokensSoldForETH not changed as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].getTokensSoldFor(POLY)).toNumber(),
                init_getTokensSoldForPOLY.add(investment_Token).toNumber(),
                "getTokensSoldForPOLY not changed as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].investorInvestedUSD.call(ACCREDITED1)).toNumber(),
                init_investorInvestedUSD.add(investment_USD).toNumber(),
                "investorInvestedUSD not changed as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].investorInvested.call(ACCREDITED1, ETH)).toNumber(),
                init_investorInvestedETH.toNumber(),
                "investorInvestedETH not changed as expected"
            );
            assert.equal(
                (await I_USDTieredSTO_Array[stoId].investorInvested.call(ACCREDITED1, POLY)).toNumber(),
                init_investorInvestedPOLY.add(investment_POLY).toNumber(),
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
            let init_InvestorETHBal = new BigNumber(await web3.eth.getBalance(NONACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let init_WalletETHBal = new BigNumber(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            // Buy With POLY
            let tx2 = await I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, {
                from: NONACCREDITED1,
                gasPrice: GAS_PRICE
            });
            let gasCost2 = new BigNumber(GAS_PRICE).mul(tx2.receipt.gasUsed);
            console.log("          Gas buyWithPOLY: ".grey + tx2.receipt.gasUsed.toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let final_InvestorETHBal = new BigNumber(await web3.eth.getBalance(NONACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let final_WalletETHBal = new BigNumber(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            assert.equal(
                final_TokenSupply.toNumber(),
                init_TokenSupply
                    .add(investment_Token)
                    .sub(refund_Token)
                    .toNumber(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toNumber(),
                init_InvestorTokenBal
                    .add(investment_Token)
                    .sub(refund_Token)
                    .toNumber(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_InvestorETHBal.toNumber(),
                init_InvestorETHBal.sub(gasCost2).toNumber(),
                "Investor ETH Balance not changed as expected"
            );
            assert.equal(
                final_InvestorPOLYBal.toNumber(),
                init_InvestorPOLYBal
                    .sub(investment_POLY)
                    .add(refund_POLY)
                    .toNumber(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toNumber(),
                init_STOTokenSold
                    .add(investment_Token)
                    .sub(refund_Token)
                    .toNumber(),
                "STO Token Sold not changed as expected"
            );
            assert.equal(final_STOETHBal.toNumber(), init_STOETHBal.toNumber(), "STO ETH Balance not changed as expected");
            assert.equal(final_STOPOLYBal.toNumber(), init_STOPOLYBal.toNumber(), "STO POLY Balance not changed as expected");
            assert.equal(final_RaisedETH.toNumber(), init_RaisedETH.toNumber(), "Raised ETH not changed as expected");
            assert.equal(
                final_RaisedPOLY.toNumber(),
                init_RaisedPOLY
                    .add(investment_POLY)
                    .sub(refund_POLY)
                    .toNumber(),
                "Raised POLY not changed as expected"
            );
            assert.equal(final_WalletETHBal.toNumber(), init_WalletETHBal.toNumber(), "Wallet ETH Balance not changed as expected");
            assert.equal(
                final_WalletPOLYBal.toNumber(),
                init_WalletPOLYBal
                    .add(investment_POLY)
                    .sub(refund_POLY)
                    .toNumber(),
                "Wallet POLY Balance not changed as expected"
            );
        });

        it("should successfully buy a granular amount and refund balance when buying indivisible token with POLY", async () => {
            await I_SecurityToken.changeGranularity(10 ** 18, {from: ISSUER});
            let stoId = 4;
            let tierId = 0;
            await I_USDTieredSTO_Array[stoId].changeAccredited([ACCREDITED1], [true], { from: ISSUER });
            let investment_Tokens = (new BigNumber(10.5)).mul(10 ** 18);
            let investment_POLY = await convert(stoId, tierId, true, "TOKEN", "POLY", investment_Tokens);

            let refund_Tokens = (new BigNumber(0.5)).mul(10 ** 18);
            let refund_POLY = await convert(stoId, tierId, true, "TOKEN", "POLY", refund_Tokens);

            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: ACCREDITED1 });

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let init_InvestorETHBal = BigNumber(await web3.eth.getBalance(ACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let init_WalletETHBal = BigNumber(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            let tokensToMint = (await I_USDTieredSTO_Array[stoId].buyTokensView(ACCREDITED1, investment_POLY,POLY))[2];

            // Buy With POLY
            let tx2 = await I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, {
                from: ACCREDITED1,
                gasPrice: GAS_PRICE
            });
            let gasCost2 = BigNumber(GAS_PRICE).mul(tx2.receipt.gasUsed);
            console.log("          Gas buyWithPOLY: ".grey + tx2.receipt.gasUsed.toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let final_InvestorETHBal = BigNumber(await web3.eth.getBalance(ACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let final_WalletETHBal = BigNumber(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            assert.equal(
                final_TokenSupply.toNumber(),
                init_TokenSupply
                    .add(investment_Tokens)
                    .sub(refund_Tokens)
                    .toNumber(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                tokensToMint.toNumber(),
                investment_Tokens.sub(refund_Tokens).toNumber(),
                "View function returned incorrect data"
            );
            assert.equal(
                final_InvestorTokenBal.toNumber(),
                init_InvestorTokenBal
                    .add(investment_Tokens)
                    .sub(refund_Tokens)
                    .toNumber(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_InvestorETHBal.toNumber(),
                init_InvestorETHBal.sub(gasCost2).toNumber(),
                "Investor ETH Balance not changed as expected"
            );
            assert.equal(
                final_InvestorPOLYBal.toNumber(),
                init_InvestorPOLYBal
                    .sub(investment_POLY)
                    .add(refund_POLY)
                    .toNumber(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toNumber(),
                init_STOTokenSold
                    .add(investment_Tokens)
                    .sub(refund_Tokens)
                    .toNumber(),
                "STO Token Sold not changed as expected"
            );
            assert.equal(final_STOETHBal.toNumber(), init_STOETHBal.toNumber(), "STO ETH Balance not changed as expected");
            assert.equal(final_STOPOLYBal.toNumber(), init_STOPOLYBal.toNumber(), "STO POLY Balance not changed as expected");
            assert.equal(final_RaisedETH.toNumber(), init_RaisedETH.toNumber(), "Raised ETH not changed as expected");
            assert.equal(
                final_RaisedPOLY.toNumber(),
                init_RaisedPOLY
                    .add(investment_POLY)
                    .sub(refund_POLY)
                    .toNumber(),
                "Raised POLY not changed as expected"
            );
            assert.equal(final_WalletETHBal.toNumber(), init_WalletETHBal.toNumber(), "Wallet ETH Balance not changed as expected");
            assert.equal(
                final_WalletPOLYBal.toNumber(),
                init_WalletPOLYBal
                    .add(investment_POLY)
                    .sub(refund_POLY)
                    .toNumber(),
                "Wallet POLY Balance not changed as expected"
            );
            await I_SecurityToken.changeGranularity(1, {from: ISSUER});
        });

        it("should successfully buy a granular amount and refund balance when buying indivisible token with ETH", async () => {
            await I_SecurityToken.changeGranularity(10**18, {from: ISSUER});
            let stoId = 4;
            let tierId = 0;
            let investment_Tokens = BigNumber(10.5).mul(10**18);
            let investment_ETH = await convert(stoId, tierId, false, "TOKEN", "ETH", investment_Tokens);
            let refund_Tokens = BigNumber(0.5).mul(10**18);
            let refund_ETH = await convert(stoId, tierId, false, "TOKEN", "ETH", refund_Tokens);

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let init_InvestorETHBal = BigNumber(await web3.eth.getBalance(ACCREDITED1));
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);


            // Buy With ETH
            let tx2 = await I_USDTieredSTO_Array[stoId].buyWithETH(ACCREDITED1, {
                from: ACCREDITED1,
                gasPrice: GAS_PRICE,
                value: investment_ETH
            });
            let gasCost2 = BigNumber(GAS_PRICE).mul(tx2.receipt.gasUsed);
            console.log("          Gas buyWithETH: ".grey + tx2.receipt.gasUsed.toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let final_InvestorETHBal = BigNumber(await web3.eth.getBalance(ACCREDITED1));
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);

            assert.equal(
                final_TokenSupply.toNumber(),
                init_TokenSupply
                    .add(investment_Tokens)
                    .sub(refund_Tokens)
                    .toNumber(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toNumber(),
                init_InvestorTokenBal
                    .add(investment_Tokens)
                    .sub(refund_Tokens)
                    .toNumber(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_InvestorETHBal.toNumber(),
                init_InvestorETHBal.sub(investment_ETH).sub(gasCost2).add(refund_ETH).toNumber(),
                "Investor ETH Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toNumber(),
                init_STOTokenSold
                    .add(investment_Tokens)
                    .sub(refund_Tokens)
                    .toNumber(),
                "STO Token Sold not changed as expected"
            );
            assert.equal(final_STOETHBal.toNumber(), init_STOETHBal.toNumber(), "STO ETH Balance not changed as expected");
            assert.equal(final_STOPOLYBal.toNumber(), init_STOPOLYBal.toNumber(), "STO POLY Balance not changed as expected");
            assert.equal(final_RaisedETH.toNumber(), init_RaisedETH.add(investment_ETH).sub(refund_ETH).toNumber(), "Raised ETH not changed as expected");
            assert.equal(
                final_RaisedPOLY.toNumber(),
                init_RaisedPOLY,
                "Raised POLY not changed as expected"
            );
            await I_SecurityToken.changeGranularity(1, {from: ISSUER});
        });

        it("should fail and revert when NONACCREDITED cap reached", async () => {
            let stoId = 2;
            let tierId = 0;

            let investment_Token = new BigNumber(5).mul(10 ** 18);
            let investment_USD = await convert(stoId, tierId, true, "TOKEN", "USD", investment_Token);
            let investment_ETH = await convert(stoId, tierId, true, "TOKEN", "ETH", investment_Token);
            let investment_POLY = await convert(stoId, tierId, true, "TOKEN", "POLY", investment_Token);

            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: NONACCREDITED1, gasPrice: GAS_PRICE });

            // Buy with ETH NONACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, value: investment_ETH, gasPrice: GAS_PRICE })
            );

            // Buy with POLY NONACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, { from: NONACCREDITED1, gasPrice: GAS_PRICE })
            );
        });

        it("should fail when rate set my contract is too low", async () => {
            let stoId = 4;
            let tierId = 0;
            await I_USDTieredSTO_Array[stoId].changeAccredited([ACCREDITED1], [true], { from: ISSUER });
            let investment_Tokens = new BigNumber(10 ** 18);
            let investment_POLY = await convert(stoId, tierId, true, "TOKEN", "POLY", investment_Tokens);
            let investment_ETH = await convert(stoId, tierId, true, "TOKEN", "ETH", investment_Tokens);
            const minTokens = new BigNumber(10 ** 20);

            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: ACCREDITED1 });

            // Buy With POLY
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithPOLYRateLimited(ACCREDITED1, investment_POLY, minTokens, {
                from: ACCREDITED1,
                gasPrice: GAS_PRICE
            }));
            await catchRevert(I_USDTieredSTO_Array[stoId].buyWithETHRateLimited(ACCREDITED1, minTokens, {
                from: ACCREDITED1,
                gasPrice: GAS_PRICE,
                value: investment_ETH
            }));
        });

        it("should fail and revert despite oracle price change when NONACCREDITED cap reached", async () => {
            let stoId = 2;
            let tierId = 0;

            // set new exchange rates
            let high_USDETH = new BigNumber(1000).mul(10 ** 18); // 1000 USD per ETH
            let high_USDPOLY = new BigNumber(50).mul(10 ** 16); // 0.5 USD per POLY
            let low_USDETH = new BigNumber(250).mul(10 ** 18); // 250 USD per ETH
            let low_USDPOLY = new BigNumber(20).mul(10 ** 16); // 0.2 USD per POLY

            let investment_Token = new BigNumber(5).mul(10 ** 18);
            let investment_USD = await convert(stoId, tierId, true, "TOKEN", "USD", investment_Token);

            let investment_ETH_high = investment_USD.div(high_USDETH).mul(10 ** 18); // USD / USD/ETH = ETH
            let investment_POLY_high = investment_USD.div(high_USDPOLY).mul(10 ** 18); // USD / USD/POLY = POLY
            let investment_ETH_low = investment_USD.div(low_USDETH).mul(10 ** 18); // USD / USD/ETH = ETH
            let investment_POLY_low = investment_USD.div(low_USDPOLY).mul(10 ** 18); // USD / USD/POLY = POLY

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
                })
            );

            // Buy with POLY NONACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY_high, { from: NONACCREDITED1, gasPrice: GAS_PRICE })
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
                })
            );

            // Buy with POLY NONACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY_low, { from: NONACCREDITED1, gasPrice: GAS_PRICE })
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
                (await I_USDTieredSTO_Array[stoId].currentTier.call()).toNumber(),
                startTier,
                "currentTier not changed as expected"
            );

            let delta_Token = new BigNumber(5).mul(10 ** 18); // Token
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
            assert.equal(Tier0Minted.toNumber(), Tier0Token.sub(delta_Token).toNumber());

            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: ACCREDITED1 });

            // Process investment
            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let init_InvestorETHBal = new BigNumber(await web3.eth.getBalance(ACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let init_WalletETHBal = new BigNumber(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            let tx2 = await I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, {
                from: ACCREDITED1,
                gasPrice: GAS_PRICE
            });
            let gasCost2 = new BigNumber(GAS_PRICE).mul(tx2.receipt.gasUsed);
            console.log("          Gas buyWithPOLY: ".grey + tx2.receipt.gasUsed.toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let final_InvestorETHBal = new BigNumber(await web3.eth.getBalance(ACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let final_WalletETHBal = new BigNumber(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            assert.equal(
                final_TokenSupply.toNumber(),
                init_TokenSupply.add(investment_Token).toNumber(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toNumber(),
                init_InvestorTokenBal.add(investment_Token).toNumber(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_InvestorETHBal.toNumber(),
                init_InvestorETHBal.sub(gasCost2).toNumber(),
                "Investor ETH Balance not changed as expected"
            );
            assert.equal(
                final_InvestorPOLYBal.toNumber(),
                init_InvestorPOLYBal.sub(investment_POLY).toNumber(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toNumber(),
                init_STOTokenSold.add(investment_Token).toNumber(),
                "STO Token Sold not changed as expected"
            );
            assert.equal(final_STOETHBal.toNumber(), init_STOETHBal.toNumber(), "STO ETH Balance not changed as expected");
            assert.equal(final_STOPOLYBal.toNumber(), init_STOPOLYBal.toNumber(), "STO POLY Balance not changed as expected");
            assert.equal(final_RaisedETH.toNumber(), init_RaisedETH.toNumber(), "Raised ETH not changed as expected");
            assert.equal(
                final_RaisedPOLY.toNumber(),
                init_RaisedPOLY.add(investment_POLY).toNumber(),
                "Raised POLY not changed as expected"
            );
            assert.equal(final_WalletETHBal.toNumber(), init_WalletETHBal.toNumber(), "Wallet ETH Balance not changed as expected");
            assert.equal(
                final_WalletPOLYBal.toNumber(),
                init_WalletPOLYBal.add(investment_POLY).toNumber(),
                "Wallet POLY Balance not changed as expected"
            );

            // Additional Checks
            assert.equal((await I_USDTieredSTO_Array[stoId].currentTier.call()).toNumber(), endTier, "currentTier not changed as expected");
        });

        it("should successfully buy across the discount cap", async () => {
            let stoId = 2;
            let tierId = 1;

            let discount_Token = new BigNumber(20).mul(10 ** 18);
            let discount_POLY = await convert(stoId, tierId, true, "TOKEN", "POLY", discount_Token);

            let regular_Token = new BigNumber(10).mul(10 ** 18);
            let regular_POLY = await convert(stoId, tierId, false, "TOKEN", "POLY", regular_Token);

            let investment_Token = discount_Token.add(regular_Token);
            let investment_POLY = discount_POLY.add(regular_POLY);

            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: ACCREDITED1 });

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let init_InvestorETHBal = new BigNumber(await web3.eth.getBalance(ACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let init_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let init_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let init_WalletETHBal = new BigNumber(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            // Buy With POLY
            let tx2 = await I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, {
                from: ACCREDITED1,
                gasPrice: GAS_PRICE
            });
            let gasCost2 = new BigNumber(GAS_PRICE).mul(tx2.receipt.gasUsed);
            console.log("          Gas buyWithPOLY: ".grey + tx2.receipt.gasUsed.toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let final_InvestorETHBal = new BigNumber(await web3.eth.getBalance(ACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BigNumber(await web3.eth.getBalance(I_USDTieredSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_USDTieredSTO_Array[stoId].address);
            let final_RaisedETH = await I_USDTieredSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_USDTieredSTO_Array[stoId].fundsRaised.call(POLY);
            let final_WalletETHBal = new BigNumber(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            assert.equal(
                final_TokenSupply.toNumber(),
                init_TokenSupply.add(investment_Token).toNumber(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toNumber(),
                init_InvestorTokenBal.add(investment_Token).toNumber(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_InvestorETHBal.toNumber(),
                init_InvestorETHBal.sub(gasCost2).toNumber(),
                "Investor ETH Balance not changed as expected"
            );
            assert.equal(
                final_InvestorPOLYBal.toNumber(),
                init_InvestorPOLYBal.sub(investment_POLY).toNumber(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toNumber(),
                init_STOTokenSold.add(investment_Token).toNumber(),
                "STO Token Sold not changed as expected"
            );
            assert.equal(final_STOETHBal.toNumber(), init_STOETHBal.toNumber(), "STO ETH Balance not changed as expected");
            assert.equal(final_STOPOLYBal.toNumber(), init_STOPOLYBal.toNumber(), "STO POLY Balance not changed as expected");
            assert.equal(final_RaisedETH.toNumber(), init_RaisedETH.toNumber(), "Raised ETH not changed as expected");
            assert.equal(
                final_RaisedPOLY.toNumber(),
                init_RaisedPOLY.add(investment_POLY).toNumber(),
                "Raised POLY not changed as expected"
            );
            assert.equal(final_WalletETHBal.toNumber(), init_WalletETHBal.toNumber(), "Wallet ETH Balance not changed as expected");
            assert.equal(
                final_WalletPOLYBal.toNumber(),
                init_WalletPOLYBal.add(investment_POLY).toNumber(),
                "Wallet POLY Balance not changed as expected"
            );
        });

        it("should buy out the rest of the sto", async () => {
            let stoId = 2;
            let tierId = 1;

            let minted = (await I_USDTieredSTO_Array[stoId].tiers.call(tierId))[4];
            let investment_Token = _tokensPerTierTotal[stoId][tierId].sub(minted);
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
            let gasCost2 = new BigNumber(GAS_PRICE).mul(tx2.receipt.gasUsed);
            console.log("          Gas buyWithPOLY: ".grey + tx2.receipt.gasUsed.toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let final_STOTokenSold = await I_USDTieredSTO_Array[stoId].getTokensSold();

            assert.equal(
                final_TokenSupply.toNumber(),
                init_TokenSupply.add(investment_Token).toNumber(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toNumber(),
                init_InvestorTokenBal.add(investment_Token).toNumber(),
                "Investor Token Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toNumber(),
                init_STOTokenSold.add(investment_Token).toNumber(),
                "STO Token Sold not changed as expected"
            );
        });

        it("should fail and revert when all tiers sold out", async () => {
            let stoId = 2;
            let tierId = 1;

            let investment_Token = new BigNumber(5).mul(10 ** 18);
            let investment_USD = await convert(stoId, tierId, false, "TOKEN", "USD", investment_Token);
            let investment_ETH = await convert(stoId, tierId, false, "TOKEN", "ETH", investment_Token);
            let investment_POLY = await convert(stoId, tierId, false, "TOKEN", "POLY", investment_Token);

            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_USDTieredSTO_Array[stoId].address, investment_POLY, { from: NONACCREDITED1, gasPrice: GAS_PRICE });

            assert.equal(await I_USDTieredSTO_Array[stoId].isOpen(), false, "STO is not showing correct status");

            // Buy with ETH NONACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, value: investment_ETH, gasPrice: GAS_PRICE })
            );

            // Buy with POLY NONACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, { from: NONACCREDITED1, gasPrice: GAS_PRICE })
            );

            // Buy with ETH ACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithETH(ACCREDITED1, { from: ACCREDITED1, value: investment_ETH, gasPrice: GAS_PRICE })
            );

            // Buy with POLY ACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, { from: ACCREDITED1, gasPrice: GAS_PRICE })
            );
        });

        it("should fail and revert when all tiers sold out despite oracle price change", async () => {
            let stoId = 2;
            let tierId = 1;

            // set new exchange rates
            let high_USDETH = new BigNumber(1000).mul(10 ** 18); // 1000 USD per ETH
            let high_USDPOLY = new BigNumber(50).mul(10 ** 16); // 0.5 USD per POLY
            let low_USDETH = new BigNumber(250).mul(10 ** 18); // 250 USD per ETH
            let low_USDPOLY = new BigNumber(20).mul(10 ** 16); // 0.2 USD per POLY

            let investment_Token = new BigNumber(5).mul(10 ** 18);
            let investment_USD = await convert(stoId, tierId, true, "TOKEN", "USD", investment_Token);

            let investment_ETH_high = investment_USD.div(high_USDETH).mul(10 ** 18); // USD / USD/ETH = ETH
            let investment_POLY_high = investment_USD.div(high_USDPOLY).mul(10 ** 18); // USD / USD/POLY = POLY
            let investment_ETH_low = investment_USD.div(low_USDETH).mul(10 ** 18); // USD / USD/ETH = ETH
            let investment_POLY_low = investment_USD.div(low_USDPOLY).mul(10 ** 18); // USD / USD/POLY = POLY

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
                })
            );

            // Buy with POLY NONACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY_high, { from: NONACCREDITED1, gasPrice: GAS_PRICE })
            );

            // Buy with ETH ACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithETH(ACCREDITED1, { from: ACCREDITED1, value: investment_ETH_high, gasPrice: GAS_PRICE })
            );

            // Buy with POLY ACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY_high, { from: ACCREDITED1, gasPrice: GAS_PRICE })
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
                })
            );

            // Buy with POLY NONACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY_low, { from: NONACCREDITED1, gasPrice: GAS_PRICE })
            );

            // Buy with ETH ACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithETH(ACCREDITED1, { from: ACCREDITED1, value: investment_ETH_low, gasPrice: GAS_PRICE })
            );

            // Buy with POLY ACCREDITED

            await catchRevert(
                I_USDTieredSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY_low, { from: ACCREDITED1, gasPrice: GAS_PRICE })
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
                    (await I_USDTieredSTO_Array[0].investorCount.call()).toNumber(),
                    (await I_USDTieredSTO_Array[0].investorCount()).toNumber(),
                    "Investor count not changed as expected"
                );
                assert.equal(
                    (await I_USDTieredSTO_Array[1].investorCount.call()).toNumber(),
                    (await I_USDTieredSTO_Array[1].investorCount()).toNumber(),
                    "Investor count not changed as expected"
                );
                assert.equal(
                    (await I_USDTieredSTO_Array[2].investorCount.call()).toNumber(),
                    (await I_USDTieredSTO_Array[2].investorCount()).toNumber(),
                    "Investor count not changed as expected"
                );
            });

            it("should get the right amounts invested", async () => {
                assert.equal(
                    (await I_USDTieredSTO_Array[0].fundsRaised.call(ETH)).toNumber(),
                    (await I_USDTieredSTO_Array[0].getRaised(0)).toNumber(),
                    "getRaisedEther not changed as expected"
                );
                assert.equal(
                    (await I_USDTieredSTO_Array[0].fundsRaised.call(POLY)).toNumber(),
                    (await I_USDTieredSTO_Array[0].getRaised(1)).toNumber(),
                    "getRaisedPOLY not changed as expected"
                );
                assert.equal(
                    (await I_USDTieredSTO_Array[0].fundsRaisedUSD.call()).toNumber(),
                    (await I_USDTieredSTO_Array[0].fundsRaisedUSD()).toNumber(),
                    "fundsRaisedUSD not changed as expected"
                );
            });

            it("should return minted tokens in a tier", async () => {
                let totalMinted = (await I_USDTieredSTO_Array[0].getTokensSoldByTier.call(0)).toNumber();
                let individualMinted = await I_USDTieredSTO_Array[0].getTokensMintedByTier.call(0);
                assert.equal(totalMinted, individualMinted[0].add(individualMinted[1]).add(individualMinted[2]).toNumber());
            });

            it("should return correct tokens sold in token details", async () => {
                let tokensSold = (await I_USDTieredSTO_Array[0].getTokensSold.call()).toNumber();
                let tokenDetails = await I_USDTieredSTO_Array[0].getSTODetails.call();
                assert.equal(tokensSold, tokenDetails[7].toNumber());
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
                let ethInWei = new BigNumber(web3.utils.toWei("20", "ether"));
                let usdInWei = await I_USDTieredSTO_Array[0].convertToUSD(ETH, ethInWei);
                assert.equal(
                    usdInWei.div(10 ** 18).toNumber(),
                    ethInWei
                        .div(10 ** 18)
                        .mul(USDETH.div(10 ** 18))
                        .toNumber()
                );
            });

            it("should get the right conversion for POLY to USD", async () => {
                // 40000 POLY to 10000 USD
                let polyInWei = new BigNumber(web3.utils.toWei("40000", "ether"));
                let usdInWei = await I_USDTieredSTO_Array[0].convertToUSD(POLY, polyInWei);
                assert.equal(
                    usdInWei.div(10 ** 18).toNumber(),
                    polyInWei
                        .div(10 ** 18)
                        .mul(USDPOLY.div(10 ** 18))
                        .toNumber()
                );
            });
        });

        describe("convertFromUSD", async () => {
            it("should get the right conversion for USD to ETH", async () => {
                // 10000 USD to 20 ETH
                let usdInWei = new BigNumber(web3.utils.toWei("10000", "ether"));
                let ethInWei = await I_USDTieredSTO_Array[0].convertFromUSD(ETH, usdInWei);
                assert.equal(
                    ethInWei.div(10 ** 18).toNumber(),
                    usdInWei
                        .div(10 ** 18)
                        .div(USDETH.div(10 ** 18))
                        .toNumber()
                );
            });

            it("should get the right conversion for USD to POLY", async () => {
                // 10000 USD to 40000 POLY
                let usdInWei = new BigNumber(web3.utils.toWei("10000", "ether"));
                let polyInWei = await I_USDTieredSTO_Array[0].convertFromUSD(POLY, usdInWei);
                assert.equal(
                    polyInWei.div(10 ** 18).toNumber(),
                    usdInWei
                        .div(10 ** 18)
                        .div(USDPOLY.div(10 ** 18))
                        .toNumber()
                );
            });
        });
    });

    describe("Test cases for the USDTieredSTOFactory", async () => {
        it("should get the exact details of the factory", async () => {
            assert.equal((await I_USDTieredSTOFactory.getSetupCost.call()).toNumber(), STOSetupCost);
            assert.equal((await I_USDTieredSTOFactory.getTypes.call())[0], 3);
            assert.equal(web3.utils.hexToString(await I_USDTieredSTOFactory.getName.call()), "USDTieredSTO", "Wrong Module added");
            assert.equal(await I_USDTieredSTOFactory.description.call(),
            "It allows both accredited and non-accredited investors to contribute into the STO. Non-accredited investors will be capped at a maximum investment limit (as a default or specific to their jurisdiction). Tokens will be sold according to tiers sequentially & each tier has its own price and volume of tokens to sell. Upon receipt of funds (ETH, POLY or DAI), security tokens will automatically transfer to investor’s wallet address",
            "Wrong Module added");
            assert.equal(await I_USDTieredSTOFactory.title.call(), "USD Tiered STO", "Wrong Module added");
            assert.equal(await I_USDTieredSTOFactory.getInstructions.call(), "Initialises a USD tiered STO.", "Wrong Module added");
            assert.equal(await I_USDTieredSTOFactory.version.call(), "2.1.0");
            let tags = await I_USDTieredSTOFactory.getTags.call();
            assert.equal(web3.utils.hexToString(tags[0]), "USD");
            assert.equal(web3.utils.hexToString(tags[1]), "Tiered");
            assert.equal(web3.utils.hexToString(tags[2]), "POLY");
            assert.equal(web3.utils.hexToString(tags[3]), "ETH");
        });
    });
});
