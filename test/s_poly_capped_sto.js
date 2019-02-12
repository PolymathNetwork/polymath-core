import latestTime from "./helpers/latestTime";
import { duration, ensureException, promisifyLogWatch, latestBlock } from "./helpers/utils";
import { takeSnapshot, increaseTime, revertToSnapshot } from "./helpers/time";
import { encodeProxyCall, encodeModuleCall } from "./helpers/encodeCall";
import { catchRevert } from "./helpers/exceptions";
import { setUpPolymathNetwork, deployGPMAndVerifyed, deployPOLYCappedSTOAndVerified } from "./helpers/createInstances";

const POLYCappedSTO = artifacts.require("./POLYCappedSTO.sol");
const MockOracle = artifacts.require("./MockOracle.sol");
const SecurityToken = artifacts.require("./SecurityToken.sol");
const GeneralTransferManager = artifacts.require("./GeneralTransferManager");
const PolyTokenFaucet = artifacts.require("./PolyTokenFaucet.sol");

const Web3 = require("web3");
let BN = Web3.utils.BN;
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port

contract("POLYCappedSTO", async (accounts) => {
    let e18;
    let e16;
    // Accounts Variable declaration
    let POLYMATH;
    let ISSUER;
    let WALLET;
    let RESERVEWALLET;
    let INVESTOR1;
    let INVESTOR2;
    let INVESTOR3;
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
    let I_POLYCappedSTOProxyFactory;
    let I_GeneralPermissionManager;
    let I_GeneralTransferManager;
    let I_ModuleRegistry;
    let I_ModuleRegistryProxy;
    let I_FeatureRegistry;
    let I_SecurityTokenRegistry;
    let I_POLYCappedSTOFactory;
    let I_USDOracle;
    let I_POLYOracle;
    let I_STFactory;
    let I_SecurityToken;
    let I_STRProxied;
    let I_MRProxied;
    let I_POLYCappedSTO_Array = [];
    let I_PolyToken;
//    let I_DaiToken;
    let I_PolymathRegistry;
    let P_POLYCappedSTOFactory;
    let I_STRGetter;

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

    // MockOracle USD prices
    let USDPOLY; // 0.25 USD/POLY

    // STO Configuration Arrays
    let _startTime = [];
    let _endTime = [];
    let _cap = [];
    let _rate = [];
    let _nonAccreditedLimit = [];
    let _minimumInvestment = [];
    let _maxNonAccreditedInvestors = [];
    let _wallet = [];
    let _reserveWallet = [];

/*    function configure(
        uint256 _startTime,
        uint256 _endTime,
        uint256 _cap,
        uint256 _rate,
        uint256 _minimumInvestment,
        uint256 _nonAccreditedLimit,
        uint256 _maxNonAccreditedInvestors,
        address payable _wallet,
        address _reserveWallet
    )*/
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
                type: "uint256",
                name: "_cap"
            },
            {
                type: "uint256",
                name: "_rate"
            },
            {
                type: "uint256",
                name: "_minimumInvestment"
            },
            {
                type: "uint256",
                name: "_nonAccreditedLimit"
            },
            {
                type: "uint256",
                name: "_maxNonAccreditedInvestors"
            },
            {
                type: "address",
                name: "_wallet"
            },
            {
                type: "address",
                name: "_reserveWallet"
            }
        ]
    };

/*    async function convert(_stoID, _tier, _discount, _currencyFrom, _currencyTo, _amount) {
        let USDTOKEN;
        _amount = new BN(_amount);
        if (_discount) USDTOKEN = (await I_POLYCappedSTO_Array[_stoID].tiers.call(_tier))[1];
        else USDTOKEN = (await I_POLYCappedSTO_Array[_stoID].tiers.call(_tier))[0];
        USDTOKEN = new BN(USDTOKEN);
        if (_currencyFrom == "TOKEN") {
            let tokenToUSD = new BN(_amount)
                .mul(USDTOKEN)
                .div(e18);
            if (_currencyTo == "USD") return tokenToUSD;
            if (_currencyTo == "ETH") {
                return await I_POLYCappedSTO_Array[_stoID].convertFromUSD(ETH, tokenToUSD);
            } else if (_currencyTo == "POLY") {
                return await I_POLYCappedSTO_Array[_stoID].convertFromUSD(POLY, tokenToUSD);
            }
        }
        if (_currencyFrom == "USD") {
            if (_currencyTo == "TOKEN") return _amount.div(USDTOKEN).mul(e18); // USD / USD/TOKEN = TOKEN
            if (_currencyTo == "ETH" || _currencyTo == "POLY")
                return await I_POLYCappedSTO_Array[_stoID].convertFromUSD(_currencyTo == "ETH" ? ETH : POLY, _amount);
        }
        if (_currencyFrom == "ETH" || _currencyFrom == "POLY") {
            let ethToUSD = await I_POLYCappedSTO_Array[_stoID].convertToUSD(_currencyTo == "ETH" ? ETH : POLY, _amount);
            if (_currencyTo == "USD") return ethToUSD;
            if (_currencyTo == "TOKEN") return ethToUSD.div(USDTOKEN).mul(e18); // USD / USD/TOKEN = TOKEN
        }
        return 0;
    }*/

    let currentTime;

    before(async () => {
        e18 = new BN(10).pow(new BN(18));
        e16 = new BN(10).pow(new BN(16));
        currentTime = new BN(await latestTime());
        REGFEE = new BN(web3.utils.toWei("1000"));
        USDPOLY = new BN(25).mul(new BN(10).pow(new BN(16))); // 0.25 USD/POLY
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
             I_STRProxied,
             I_STRGetter
         ] = instances;

        // STEP 4: Deploy the GeneralDelegateManagerFactory
        [I_GeneralPermissionManagerFactory] = await deployGPMAndVerifyed(POLYMATH, I_MRProxied, 0);

        // STEP 5: Deploy the POLYCappedSTOFactory
        [I_POLYCappedSTOFactory] = await deployPOLYCappedSTOAndVerified(POLYMATH, I_MRProxied, STOSetupCost);
        [P_POLYCappedSTOFactory] = await deployPOLYCappedSTOAndVerified(POLYMATH, I_MRProxied, new BN(web3.utils.toWei("500")));
        // Step 12: Deploy & Register Mock Oracles
        I_POLYOracle = await MockOracle.new(I_PolyToken.address, web3.utils.fromAscii("POLY"), web3.utils.fromAscii("USD"), USDPOLY, { from: POLYMATH }); // 25 cents per POLY
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

        POLYOracle:                        ${I_POLYOracle.address}
        POLYCappedSTOFactory:              ${I_POLYCappedSTOFactory.address}
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

            let tx = await I_STRProxied.generateSecurityToken(NAME, SYMBOL, TOKENDETAILS, true, { from: ISSUER });
            assert.equal(tx.logs[2].args._ticker, SYMBOL, "SecurityToken doesn't get deployed");

            I_SecurityToken = await SecurityToken.at(tx.logs[2].args._securityTokenAddress);

            const log = (await I_SecurityToken.getPastEvents('ModuleAdded', {filter: {transactionHash: tx.transactionHash}}))[0];

            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._types[0].toString(), TMKEY);
            assert.equal(web3.utils.hexToString(log.args._name), "GeneralTransferManager");
        });

        it("Should intialize the auto attached modules", async () => {
            let moduleData = (await I_SecurityToken.getModulesByType(TMKEY))[0];
            I_GeneralTransferManager = await GeneralTransferManager.at(moduleData);
        });
    });

    describe("Test STO deployment", async () => {
        it("Should successfully attach the first STO module to the security token", async () => {
            let stoId = 0;

            _startTime.push(new BN(currentTime).add(new BN(duration.days(2))));
            _endTime.push(_startTime[stoId].add(new BN(duration.days(100))));
            _cap.push(new BN(100000).mul(e18)); // 100k Tokens
            _rate.push(new BN(10).mul(e16)); // 0.10 POLY/Token
            _minimumInvestment.push(new BN(50).mul(e18)); // 50 POLY
            _nonAccreditedLimit.push(new BN(10000).mul(e18)); // 10k POLY
            _maxNonAccreditedInvestors.push(new BN(50))
            _wallet.push(WALLET);
            _reserveWallet.push(RESERVEWALLET);

            let config = [
                _startTime[stoId],
                _endTime[stoId],
                _cap[stoId],
                _rate[stoId],
                _minimumInvestment[stoId],
                _nonAccreditedLimit[stoId],
                _maxNonAccreditedInvestors[stoId],
                _wallet[stoId],
                _reserveWallet[stoId]
            ];

            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            let tx = await I_SecurityToken.addModule(I_POLYCappedSTOFactory.address, bytesSTO, new BN(0), new BN(0), { from: ISSUER, gasPrice: GAS_PRICE });
            console.log("          Gas addModule: ".grey + tx.receipt.gasUsed.toString().grey);
            assert.equal(tx.logs[2].args._types[0], STOKEY, "POLYCappedSTO doesn't get deployed");
            assert.equal(web3.utils.hexToString(tx.logs[2].args._name), "POLYCappedSTO", "POLYCappedSTOFactory module was not added");
            I_POLYCappedSTO_Array.push(await POLYCappedSTO.at(tx.logs[2].args._module));
            assert.equal((await I_POLYCappedSTO_Array[stoId].startTime.call()).toString(), _startTime[stoId].toString(), "Incorrect _startTime in config");
            assert.equal((await I_POLYCappedSTO_Array[stoId].endTime.call()).toString(), _endTime[stoId].toString(), "Incorrect _endTime in config");
            assert.equal((await I_POLYCappedSTO_Array[stoId].cap.call()).toString(), _cap[stoId].toString(), "Incorrect _cap in config");
            assert.equal((await I_POLYCappedSTO_Array[stoId].rate.call()).toString(), _rate[stoId].toString(), "Incorrect _rate in config");
            assert.equal(
                (await I_POLYCappedSTO_Array[stoId].minimumInvestment.call()).toString(),
                _minimumInvestment[stoId].toString(),
                "Incorrect _minimumInvestment in config"
            );
            assert.equal(
                (await I_POLYCappedSTO_Array[stoId].nonAccreditedLimit.call()).toString(),
                _nonAccreditedLimit[stoId].toString(),
                "Incorrect _nonAccreditedLimit in config"
            );
            assert.equal(
                (await I_POLYCappedSTO_Array[stoId].maxNonAccreditedInvestors.call()).toString(),
                _maxNonAccreditedInvestors[stoId].toString(),
                "Incorrect _maxNonAccreditedInvestors in config"
            );
            assert.equal(await I_POLYCappedSTO_Array[stoId].wallet.call(), _wallet[stoId], "Incorrect _wallet in config");
            assert.equal(
                await I_POLYCappedSTO_Array[stoId].reserveWallet.call(),
                _reserveWallet[stoId],
                "Incorrect _reserveWallet in config"
            );
            assert.equal((await I_POLYCappedSTO_Array[stoId].getPermissions()).length, new BN(0), "Incorrect number of permissions");
        });

        it("Should attach the paid STO factory -- failed because of no tokens", async () => {
            let stoId = 0;
            let config = [
                _startTime[stoId],
                _endTime[stoId],
                _cap[stoId],
                _rate[stoId],
                _minimumInvestment[stoId],
                _nonAccreditedLimit[stoId],
                _maxNonAccreditedInvestors[stoId],
                _wallet[stoId],
                _reserveWallet[stoId]
            ];

            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            await catchRevert(
                I_SecurityToken.addModule(P_POLYCappedSTOFactory.address, bytesSTO, new BN(web3.utils.toWei("2000")), new BN(0), {
                    from: ISSUER,
                    gasPrice: GAS_PRICE
                })
            );
        });

        it("Should attach the paid STO factory", async () => {
            let snapId = await takeSnapshot();
            let stoId = 0;
            let config = [
                _startTime[stoId],
                _endTime[stoId],
                _cap[stoId],
                _rate[stoId],
                _minimumInvestment[stoId],
                _nonAccreditedLimit[stoId],
                _maxNonAccreditedInvestors[stoId],
                _wallet[stoId],
                _reserveWallet[stoId]
            ];

            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            await I_PolyToken.getTokens(new BN(web3.utils.toWei("2000")), I_SecurityToken.address);
            let tx = await I_SecurityToken.addModule(P_POLYCappedSTOFactory.address, bytesSTO, new BN(web3.utils.toWei("2000")), new BN(0), {
                from: ISSUER,
                gasPrice: GAS_PRICE
            });
            await revertToSnapshot(snapId);
        });

        it("Should successfully attach the second STO module to the security token", async () => {
            let stoId = 1;

            _startTime.push(new BN(currentTime).add(new BN(duration.days(2))));
            _endTime.push(new BN(_startTime[stoId]).add(new BN(currentTime).add(new BN(duration.days(100)))));
            _cap.push(new BN(5000000).mul(e18)); // 5,000,000 Tokens
            _rate.push(new BN(10).mul(e16)); // 0.10 POLY/Token
            _minimumInvestment.push(new BN(0)); // 0 POLY
            _nonAccreditedLimit.push(new BN(10000).mul(e18)); // 10000 POLY
            _maxNonAccreditedInvestors.push(new BN(4)) // 0 = Unlimited
            _wallet.push(WALLET);
            _reserveWallet.push(address_zero); // minting to reserve disabled

            let config = [
                _startTime[stoId],
                _endTime[stoId],
                _cap[stoId],
                _rate[stoId],
                _minimumInvestment[stoId],
                _nonAccreditedLimit[stoId],
                _maxNonAccreditedInvestors[stoId],
                _wallet[stoId],
                _reserveWallet[stoId]
            ];

            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            let tx = await I_SecurityToken.addModule(I_POLYCappedSTOFactory.address, bytesSTO, new BN(0), new BN(0), { from: ISSUER, gasPrice: GAS_PRICE });
            console.log("          Gas addModule: ".grey + tx.receipt.gasUsed.toString().grey);
            assert.equal(tx.logs[2].args._types[0], STOKEY, "POLYCappedSTO doesn't get deployed");
            assert.equal(web3.utils.hexToString(tx.logs[2].args._name), "POLYCappedSTO", "POLYCappedSTOFactory module was not added");
            I_POLYCappedSTO_Array.push(await POLYCappedSTO.at(tx.logs[2].args._module));
            assert.equal((await I_POLYCappedSTO_Array[stoId].startTime.call()).toString(), _startTime[stoId].toString(), "Incorrect _startTime in config");
            assert.equal((await I_POLYCappedSTO_Array[stoId].endTime.call()).toString(), _endTime[stoId].toString(), "Incorrect _endTime in config");
            assert.equal((await I_POLYCappedSTO_Array[stoId].cap.call()).toString(), _cap[stoId].toString(), "Incorrect _cap in config");
            assert.equal((await I_POLYCappedSTO_Array[stoId].rate.call()).toString(), _rate[stoId].toString(), "Incorrect _rate in config");
            assert.equal(
                (await I_POLYCappedSTO_Array[stoId].minimumInvestment.call()).toString(),
                _minimumInvestment[stoId].toString(),
                "Incorrect _minimumInvestment in config"
            );
            assert.equal(
                (await I_POLYCappedSTO_Array[stoId].nonAccreditedLimit.call()).toString(),
                _nonAccreditedLimit[stoId].toString(),
                "Incorrect _nonAccreditedLimit in config"
            );
            assert.equal(
                (await I_POLYCappedSTO_Array[stoId].maxNonAccreditedInvestors.call()).toString(),
                _maxNonAccreditedInvestors[stoId].toString(),
                "Incorrect _maxNonAccreditedInvestors in config"
            );
            assert.equal(await I_POLYCappedSTO_Array[stoId].wallet.call(), _wallet[stoId], "Incorrect _wallet in config");
            assert.equal(
                await I_POLYCappedSTO_Array[stoId].reserveWallet.call(),
                _reserveWallet[stoId],
                "Incorrect _reserveWallet in config"
            );
            assert.equal((await I_POLYCappedSTO_Array[stoId].getPermissions()).length, new BN(0), "Incorrect number of permissions");
        });

        it("Should successfully attach the third STO module to the security token", async () => {
            let stoId = 2;

            _startTime.push(new BN(currentTime).add(new BN(duration.days(2))));
            _endTime.push(new BN(_startTime[stoId]).add(new BN(currentTime).add(new BN(duration.days(100)))));
            _cap.push(new BN(30000).mul(e18)); // 5,000,000 Tokens
            _rate.push(new BN(1).mul(e18)); // 1 POLY/Token
            _minimumInvestment.push(new BN(50).mul(e18)); // 50 POLY
            _nonAccreditedLimit.push(new BN(49).mul(e18)); // 49 POLY - Only non-accredited investors with overrides allowed
            _maxNonAccreditedInvestors.push(new BN(0)) // unlimited non accredited investors
            _wallet.push(WALLET);
            _reserveWallet.push(RESERVEWALLET);
            let config = [
                _startTime[stoId],
                _endTime[stoId],
                _cap[stoId],
                _rate[stoId],
                _minimumInvestment[stoId],
                _nonAccreditedLimit[stoId],
                _maxNonAccreditedInvestors[stoId],
                _wallet[stoId],
                _reserveWallet[stoId]
            ];
            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            let tx = await I_SecurityToken.addModule(I_POLYCappedSTOFactory.address, bytesSTO, new BN(0), new BN(0), { from: ISSUER, gasPrice: GAS_PRICE });
            console.log("          Gas addModule: ".grey + tx.receipt.gasUsed.toString().grey);
            assert.equal(tx.logs[2].args._types[0], STOKEY, "POLYCappedSTO doesn't get deployed");
            assert.equal(web3.utils.hexToString(tx.logs[2].args._name), "POLYCappedSTO", "POLYCappedSTOFactory module was not added");
            I_POLYCappedSTO_Array.push(await POLYCappedSTO.at(tx.logs[2].args._module));
        });

        it("Should successfully attach the fourth STO module to the security token", async () => {
            let stoId = 3;

            _startTime.push(new BN(currentTime).add(new BN(duration.days(0.1))));
            _endTime.push(new BN(_startTime[stoId]).add(new BN(duration.days(0.1))));
            _cap.push(new BN(300).mul(e18)); // 50 Tokens
            _rate.push(new BN(10).mul(e16)); // 0.10 POLY/Token
            _minimumInvestment.push(new BN(5).mul(e18)); // 5 POLY
            _nonAccreditedLimit.push(new BN(100)); // 0 POLY - Only non-accredited investors with overrides allowed
            _maxNonAccreditedInvestors.push(new BN(2)) //
            _wallet.push(WALLET);
            _reserveWallet.push(RESERVEWALLET);

            let config = [
                _startTime[stoId],
                _endTime[stoId],
                _cap[stoId],
                _rate[stoId],
                _minimumInvestment[stoId],
                _nonAccreditedLimit[stoId],
                _maxNonAccreditedInvestors[stoId],
                _wallet[stoId],
                _reserveWallet[stoId]
            ];

            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            let tx = await I_SecurityToken.addModule(I_POLYCappedSTOFactory.address, bytesSTO, new BN(0), new BN(0), { from: ISSUER, gasPrice: GAS_PRICE });
            console.log("          Gas addModule: ".grey + tx.receipt.gasUsed.toString().grey);
            assert.equal(tx.logs[2].args._types[0], STOKEY, "POLYCappedSTO doesn't get deployed");
            assert.equal(web3.utils.hexToString(tx.logs[2].args._name), "POLYCappedSTO", "POLYCappedSTOFactory module was not added");
            I_POLYCappedSTO_Array.push(await POLYCappedSTO.at(tx.logs[2].args._module));
        });

        it("Should successfully attach the fifth STO module to the security token", async () => {
            let stoId = 4; // Non-divisible tokens

            _startTime.push(new BN(currentTime).add(new BN(duration.days(2))));
            _endTime.push(new BN(_startTime[stoId]).add(new BN(currentTime).add(new BN(duration.days(100)))));
            _cap.push(new BN(300).mul(e18)); // 50 Tokens
            _rate.push(new BN(1).mul(e16)); // 0.01 POLY/Token
            _minimumInvestment.push(new BN(5).mul(e18)); // 5 POLY
            _nonAccreditedLimit.push(new BN(1000)); // 0 POLY - Only non-accredited investors with overrides allowed
            _maxNonAccreditedInvestors.push(new BN(2)) //
            _wallet.push(WALLET);
            _reserveWallet.push(RESERVEWALLET);

            let config = [
                _startTime[stoId],
                _endTime[stoId],
                _cap[stoId],
                _rate[stoId],
                _minimumInvestment[stoId],
                _nonAccreditedLimit[stoId],
                _maxNonAccreditedInvestors[stoId],
                _wallet[stoId],
                _reserveWallet[stoId]
            ];

            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);
            let tx = await I_SecurityToken.addModule(I_POLYCappedSTOFactory.address, bytesSTO, 0, 0, { from: ISSUER, gasPrice: GAS_PRICE });
            console.log("          Gas addModule: ".grey + tx.receipt.gasUsed.toString().grey);
            assert.equal(tx.logs[2].args._types[0], STOKEY, "POLYCappedSTO doesn't get deployed");
            assert.equal(web3.utils.hexToString(tx.logs[2].args._name), "POLYCappedSTO", "POLYCappedSTOFactory module was not added");
            I_POLYCappedSTO_Array.push(await POLYCappedSTO.at(tx.logs[2].args._module));
        });

        // FAILURE CASES //
        it("Should fail because cap should be greater than 0", async () => {
            let stoId = 0;

            let cap = new BN(0);
            let config = [
                _startTime[stoId],
                _endTime[stoId],
                cap,
                _rate[stoId],
                _minimumInvestment[stoId],
                _nonAccreditedLimit[stoId],
                _maxNonAccreditedInvestors[stoId],
                _wallet[stoId],
                _reserveWallet[stoId]
            ];
            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);

            await catchRevert(I_SecurityToken.addModule(I_POLYCappedSTOFactory.address, bytesSTO, new BN(0), new BN(0), { from: ISSUER }));
        });

        it("Should fail because rate of token should be greater than 0", async () => {
            let stoId = 0;

            let rate = new BN(0);
            let config = [
                _startTime[stoId],
                _endTime[stoId],
                _cap[stoId],
                rate,
                _minimumInvestment[stoId],
                _nonAccreditedLimit[stoId],
                _maxNonAccreditedInvestors[stoId],
                _wallet[stoId],
                _reserveWallet[stoId]
            ];
            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);

            await catchRevert(I_SecurityToken.addModule(I_POLYCappedSTOFactory.address, bytesSTO, new BN(0), new BN(0), { from: ISSUER }));
        });

        it("Should fail because Zero address is not permitted for wallet", async () => {
            let stoId = 0;

            let wallet = address_zero;
            let config = [
                _startTime[stoId],
                _endTime[stoId],
                _cap[stoId],
                _rate[stoId],
                _minimumInvestment[stoId],
                _nonAccreditedLimit[stoId],
                _maxNonAccreditedInvestors[stoId],
                wallet,
                _reserveWallet[stoId]
            ];
            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);

            await catchRevert(I_SecurityToken.addModule(I_POLYCappedSTOFactory.address, bytesSTO, new BN(0), new BN(0), { from: ISSUER }));
        });

        it("Should fail because end time before start time", async () => {
            let stoId = 0;

            let startTime = await latestTime() + duration.days(35);
            let endTime = await latestTime() + duration.days(1);
            let config = [
                startTime,
                endTime,
                _cap[stoId],
                _rate[stoId],
                _minimumInvestment[stoId],
                _nonAccreditedLimit[stoId],
                _maxNonAccreditedInvestors[stoId],
                _wallet[stoId],
                _reserveWallet[stoId]
            ];
            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);

            await catchRevert(I_SecurityToken.addModule(I_POLYCappedSTOFactory.address, bytesSTO, new BN(0), new BN(0), { from: ISSUER }));
        });

        it("Should fail because start time is in the past", async () => {
            let stoId = 0;

            let startTime = await latestTime() - duration.days(35);
            let endTime = startTime + duration.days(50);
            let config = [
                startTime,
                endTime,
                _cap[stoId],
                _rate[stoId],
                _minimumInvestment[stoId],
                _nonAccreditedLimit[stoId],
                _maxNonAccreditedInvestors[stoId],
                _wallet[stoId],
                _reserveWallet[stoId]
            ];
            let bytesSTO = web3.eth.abi.encodeFunctionCall(functionSignature, config);

            await catchRevert(I_SecurityToken.addModule(I_POLYCappedSTOFactory.address, bytesSTO, new BN(0), new BN(0), { from: ISSUER }));
        });
    });

    ///////////////////////////
    // MODIFY CONFIGURATIONS //
    ///////////////////////////
    describe("Test modifying configuration", async () => {
        // CONFIGURATION //
        it("Should not allow configuration -- fail Sender is not factory", async () => {
            let stoId = 0;
            await catchRevert(I_POLYCappedSTO_Array[stoId].configure(
                _startTime[stoId],
                _endTime[stoId],
                _cap[stoId],
                _rate[stoId],
                _minimumInvestment[stoId],
                _nonAccreditedLimit[stoId],
                _maxNonAccreditedInvestors[stoId],
                _wallet[stoId],
                _reserveWallet[stoId],
                { from: ISSUER }
            ));
        });

        // TIMES //
        it("Should successfully Modify Times before starting the STO -- fail because of bad owner", async () => {
            let stoId = 0;
            await catchRevert(
                I_POLYCappedSTO_Array[stoId].modifyTimes(new BN(currentTime).add(new BN(duration.days(15))), new BN(currentTime).add(new BN(duration.days(55))), { from: POLYMATH })
            );
        });

        it("Should successfully Modify Times before starting the STO -- fail start time is in th past", async () => {
            let stoId = 0;
            await catchRevert(
                I_POLYCappedSTO_Array[stoId].modifyTimes(new BN(currentTime).sub(new BN(duration.days(15))), new BN(currentTime).add(new BN(duration.days(55))), { from: ISSUER })
            );
        });

        it("Should successfully Modify Times before starting the STO -- fail end time is before start time", async () => {
            let stoId = 0;
            await catchRevert(
                I_POLYCappedSTO_Array[stoId].modifyTimes(new BN(currentTime).sub(new BN(duration.days(15))), new BN(currentTime).add(new BN(duration.days(10))), { from: ISSUER })
            );
        });

        it("Should successfully Modify Times before starting the STO", async () => {
            let stoId = 0;
            let snapId = await takeSnapshot();
            let _startTime = new BN(currentTime).add(new BN(duration.days(15)));
            let _endTime = new BN(currentTime).add(new BN(duration.days(55)));
            await I_POLYCappedSTO_Array[stoId].modifyTimes(_startTime, _endTime, { from: ISSUER });
            assert.equal((await I_POLYCappedSTO_Array[stoId].startTime.call()).toString(), _startTime.toString(), "Incorrect _startTime in config");
            assert.equal((await I_POLYCappedSTO_Array[stoId].endTime.call()).toString(), _endTime.toString(), "Incorrect _endTime in config");
            await revertToSnapshot(snapId);
        });

        it("Should Fail to Modify Times after starting the STO", async () => {
            let stoId = 0;
            let snapId = await takeSnapshot();

            // Advance time to after STO start
            await increaseTime(duration.days(3));
            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), true, "STO is not Open");
            let tempTime1 = new BN(currentTime).add(new BN(duration.days(1)));
            let tempTime2 = new BN(currentTime).add(new BN(duration.days(150)));

            await catchRevert(I_POLYCappedSTO_Array[stoId].modifyTimes(new BN(tempTime1), new BN(tempTime2), { from: ISSUER }));
            await revertToSnapshot(snapId);
        });

        // CAP //
        it("Should successfully Modify Cap before starting the STO -- fail because of bad owner", async () => {
            let stoId = 0;
            await catchRevert(I_POLYCappedSTO_Array[stoId].modifyCap((new BN(250000000).mul(e18)), { from: POLYMATH }));
        });

        it("Should successfully Modify Cap before starting the STO -- fail because cap = 0", async () => {
            let stoId = 0;
            await catchRevert(I_POLYCappedSTO_Array[stoId].modifyCap(new BN(0), { from: ISSUER }));
        });

        it("Should successfully Modify Cap before starting the STO", async () => {
            let stoId = 0;
            let snapId = await takeSnapshot();
            await I_POLYCappedSTO_Array[stoId].modifyCap((new BN(250000000).mul(e18)), { from: ISSUER });

            assert.equal((await I_POLYCappedSTO_Array[stoId].cap.call()).toString(), new BN(250000000).mul(e18).toString(), "Cap doesn't set as expected");
            await revertToSnapshot(snapId);
        });

        it("Should Fail to Modify Cap after starting the STO", async () => {
            let stoId = 0;
            let snapId = await takeSnapshot();

            // Advance time to after STO start
            await increaseTime(duration.days(3));
            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), true, "STO is not Open");
            await catchRevert(I_POLYCappedSTO_Array[stoId].modifyCap((new BN(300000000).mul(e18)), { from: ISSUER }));
            await revertToSnapshot(snapId);
        });

        // RATE //
        it("Should successfully Modify Rate before starting the STO -- fail because of bad owner", async () => {
            let stoId = 0;
            await catchRevert(I_POLYCappedSTO_Array[stoId].modifyRate(new BN(1).mul(e16), { from: POLYMATH }));
        });

        it("Should successfully Modify Rate before starting the STO -- fail because rate = 0", async () => {
            let stoId = 0;
            await catchRevert(I_POLYCappedSTO_Array[stoId].modifyRate(new BN(0), { from: ISSUER }));
        });

        it("Should successfully Modify Rate before starting the STO", async () => {
            let stoId = 0;
            let snapId = await takeSnapshot();
            await I_POLYCappedSTO_Array[stoId].modifyRate(new BN(1).mul(e16), { from: ISSUER });

            assert.equal((await I_POLYCappedSTO_Array[stoId].rate.call()).toString(), new BN(1).mul(e16).toString(), "Rate doesn't set as expected");
            await revertToSnapshot(snapId);
        });

        it("Should Fail to Modify Rate after starting the STO", async () => {
            let stoId = 0;
            let snapId = await takeSnapshot();

            // Advance time to after STO start
            await increaseTime(duration.days(3));
            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), true, "STO is not Open");
            await catchRevert(I_POLYCappedSTO_Array[stoId].modifyRate(new BN(1).mul(e16), { from: ISSUER }));
            await revertToSnapshot(snapId);
        });

        // LIMITS //
        it("Should successfully Modify Limits before startTime -- fail because of bad owner", async () => {
            let stoId = 0;

            await catchRevert(I_POLYCappedSTO_Array[stoId].modifyLimits(new BN(1).mul(e18), new BN(15).mul(e18), new BN(3), { from: POLYMATH }));
        });

        it("Should successfully Modify Limits before startTime", async () => {
            let stoId = 0;
            let snapId = await takeSnapshot();

            await I_POLYCappedSTO_Array[stoId].modifyLimits(new BN(1).mul(e18), new BN(15).mul(e18), new BN(3), { from: ISSUER });
            assert.equal(
                (await I_POLYCappedSTO_Array[stoId].minimumInvestment.call()).toString(),
                new BN(1).mul(e18).toString(),
                "STO Configuration doesn't set as expected"
            );
            assert.equal(
                (await I_POLYCappedSTO_Array[stoId].nonAccreditedLimit.call()).toString(),
                new BN(15).mul(e18).toString(),
                "STO Configuration doesn't set as expected"
            );
            assert.equal(
                (await I_POLYCappedSTO_Array[stoId].maxNonAccreditedInvestors.call()).toString(),
                new BN(3).toString(),
                "STO Configuration doesn't set as expected"
            );
            await revertToSnapshot(snapId);
        });

        it("Should Fail to Modify Limits after startTime", async () => {
            let stoId = 0;
            let snapId = await takeSnapshot();

            // Advance time to after STO start
            await increaseTime(duration.days(3));
            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), true, "STO is not Open");
            await catchRevert(I_POLYCappedSTO_Array[stoId].modifyLimits(new BN(2).mul(e18), new BN(20).mul(e18), new BN(4), { from: ISSUER }));
            await revertToSnapshot(snapId);
        });

        // ADDRESSES //
        it("Should successfully Modify Addresses before startTime -- fail because of bad owner", async () => {
            let stoId = 0;

            await catchRevert(I_POLYCappedSTO_Array[stoId].modifyAddresses(
                "0x0000000000000000000000000400000000000000",
                "0x0000000000000000000003000000000000000000",
                { from: POLYMATH }
            ));
        });

        it("Should successfully Modify Addresses before startTime", async () => {
            let stoId = 0;
            let snapId = await takeSnapshot();

            await I_POLYCappedSTO_Array[stoId].modifyAddresses(
                "0x0000000000000000000000000400000000000000",
                "0x0000000000000000000003000000000000000000",
                { from: ISSUER }
            );
            assert.equal(
                await I_POLYCappedSTO_Array[stoId].wallet.call(),
                "0x0000000000000000000000000400000000000000",
                "STO Configuration doesn't set as expected"
            );
            assert.equal(
                await I_POLYCappedSTO_Array[stoId].reserveWallet.call(),
                "0x0000000000000000000003000000000000000000",
                "STO Configuration doesn't set as expected"
            );
            await revertToSnapshot(snapId);
        });

        it("Should successfully Modify Addresses after startTime", async () => {
            let stoId = 0;
            let snapId = await takeSnapshot();

            // Advance time to after STO start
            await increaseTime(duration.days(3));
            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), true, "STO is not Open");

            await I_POLYCappedSTO_Array[stoId].modifyAddresses(
                "0x0000000000000000000000000600000000000000",
                "0x0000000000000000000005000000000000000000",
                { from: ISSUER }
            );
            assert.equal(
                await I_POLYCappedSTO_Array[stoId].wallet.call(),
                "0x0000000000000000000000000600000000000000",
                "STO Configuration doesn't set as expected"
            );
            assert.equal(
                await I_POLYCappedSTO_Array[stoId].reserveWallet.call(),
                "0x0000000000000000000005000000000000000000",
                "STO Configuration doesn't set as expected"
            );
            await revertToSnapshot(snapId);
        });

        //ALLOW BENEFICIAL INVESTMENTS //
        it("Should allow non-matching beneficiary -- failed because of bad owner", async () => {
            snapId = await takeSnapshot();
            await catchRevert(I_POLYCappedSTO_Array[0].changeAllowBeneficialInvestments(true, { from: POLYMATH }));
        });

        it("Should allow non-matching beneficiary", async () => {
            await I_POLYCappedSTO_Array[0].changeAllowBeneficialInvestments(true, { from: ISSUER });
            let allow = await I_POLYCappedSTO_Array[0].allowBeneficialInvestments();
            assert.equal(allow, true, "allowBeneficialInvestments should be true");
        });

        it("Should allow non-matching beneficiary -- failed because it is already active", async () => {
            await catchRevert(I_POLYCappedSTO_Array[0].changeAllowBeneficialInvestments(true, { from: ISSUER }));
            await revertToSnapshot(snapId);
            let allow = await I_POLYCappedSTO_Array[0].allowBeneficialInvestments();
            assert.equal(allow, false, "allowBeneficialInvestments should be false");
        });
    });

    /////////////////////////////
    // FAILED INVESTMENT TESTS //
    /////////////////////////////
    describe("Test buying failure conditions", async () => {
        it("Should fail if before STO start time", async () => {
            let stoId = 0;
            let snapId = await takeSnapshot();

            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), false, "STO is Open");

            // Whitelist
            let fromTime = await latestTime();
            let toTime = await latestTime() + duration.days(15);
            let expiryTime = toTime + duration.days(100);
            let canBuyFromSTO = true;

            await I_GeneralTransferManager.modifyWhitelist(ACCREDITED1, fromTime, toTime, expiryTime, canBuyFromSTO, true, { from: ISSUER });
            await I_GeneralTransferManager.modifyWhitelist(NONACCREDITED1, fromTime, toTime, expiryTime, canBuyFromSTO, false, { from: ISSUER });
            // Set as accredited
            await I_POLYCappedSTO_Array[stoId].changeAccredited([ACCREDITED1], [true], { from: ISSUER });

            // Prep for investments
            let investment_POLY = new BN(web3.utils.toWei("10000", "ether")); // Invest 10000 POLY
            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_POLYCappedSTO_Array[stoId].address, investment_POLY, { from: NONACCREDITED1 });
            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_POLYCappedSTO_Array[stoId].address, investment_POLY, { from: ACCREDITED1 });
            // NONACCREDITED POLY
            await catchRevert(I_POLYCappedSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, { from: NONACCREDITED1 }));
            // ACCREDITED POLY
            await catchRevert(I_POLYCappedSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, { from: ACCREDITED1 }));
            await revertToSnapshot(snapId);
        });

        it("Should fail if not whitelisted or canBuyFromSTO is false", async () => {
            let stoId = 0;
            let snapId = await takeSnapshot();

            // Advance time to after STO start
            await increaseTime(duration.days(3));
            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), true, "STO is not Open");

            // Whitelist only Accredited1 and nonaccredited1 with canBuyFromSTO = false
            let fromTime = await latestTime();
            let toTime = await latestTime() + duration.days(15);
            let expiryTime = toTime + duration.days(100);
            let canBuyFromSTO = false;

            await I_GeneralTransferManager.modifyWhitelist(ACCREDITED1, fromTime, toTime, expiryTime, canBuyFromSTO, true, { from: ISSUER });
            await I_GeneralTransferManager.modifyWhitelist(NONACCREDITED1, fromTime, toTime, expiryTime, canBuyFromSTO, false, { from: ISSUER });

            // Set as accredited
            await I_POLYCappedSTO_Array[stoId].changeAccredited([ACCREDITED1], [true], { from: ISSUER });
            await I_POLYCappedSTO_Array[stoId].changeAccredited([ACCREDITED2], [true], { from: ISSUER });

            // Prep for investments
            let investment_POLY = new BN(web3.utils.toWei("10000", "ether")); // Invest 10000 POLY
            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_POLYCappedSTO_Array[stoId].address, investment_POLY, { from: NONACCREDITED1 });
            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED2);
            await I_PolyToken.approve(I_POLYCappedSTO_Array[stoId].address, investment_POLY, { from: NONACCREDITED2 });
            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_POLYCappedSTO_Array[stoId].address, investment_POLY, { from: ACCREDITED1 });
            await I_PolyToken.getTokens(investment_POLY, ACCREDITED2);
            await I_PolyToken.approve(I_POLYCappedSTO_Array[stoId].address, investment_POLY, { from: ACCREDITED2 });

            // NONACCREDITED POLY
            await catchRevert(I_POLYCappedSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, { from: NONACCREDITED1 }));
            await catchRevert(I_POLYCappedSTO_Array[stoId].buyWithPOLY(NONACCREDITED2, investment_POLY, { from: NONACCREDITED2 }));

            // ACCREDITED POLY
            await catchRevert(I_POLYCappedSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, { from: ACCREDITED1 }));
            await catchRevert(I_POLYCappedSTO_Array[stoId].buyWithPOLY(ACCREDITED2, investment_POLY, { from: ACCREDITED2 }));

            await revertToSnapshot(snapId);
        });

        it("Should fail if minimumInvestment not met", async () => {
            let stoId = 0;
            let snapId = await takeSnapshot();

            // Whitelist
            let fromTime = await latestTime();
            let toTime = await latestTime() + duration.days(15);
            let expiryTime = toTime + duration.days(100);
            let canBuyFromSTO = true;

            await I_GeneralTransferManager.modifyWhitelist(ACCREDITED1, fromTime, toTime, expiryTime, canBuyFromSTO, true, { from: ISSUER });
            await I_GeneralTransferManager.modifyWhitelist(NONACCREDITED1, fromTime, toTime, expiryTime, canBuyFromSTO, false, { from: ISSUER });

            // Advance time to after STO start
            await increaseTime(duration.days(3));
            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), true, "STO is not Open");

            // Set as accredited
            await I_POLYCappedSTO_Array[stoId].changeAccredited([ACCREDITED1], [true], { from: ISSUER });

            let investment_POLY = new BN(2).mul(e18);

            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_POLYCappedSTO_Array[stoId].address, investment_POLY, { from: NONACCREDITED1 });
            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_POLYCappedSTO_Array[stoId].address, investment_POLY, { from: ACCREDITED1 });

            // NONACCREDITED POLY
            await catchRevert(I_POLYCappedSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, { from: NONACCREDITED1 }));

            // ACCREDITED POLY
            await catchRevert(I_POLYCappedSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, { from: ACCREDITED1 }));

            await revertToSnapshot(snapId);
        });

        it("Should successfully pause the STO and make investments fail, then unpause and succeed", async () => {
            let stoId = 0;
            let snapId = await takeSnapshot();

            // Whitelist
            let fromTime = await latestTime();
            let toTime = await latestTime() + duration.days(15);
            let expiryTime = toTime + duration.days(100);
            let canBuyFromSTO = true;

            await I_GeneralTransferManager.modifyWhitelist(ACCREDITED1, fromTime, toTime, expiryTime, canBuyFromSTO, true, { from: ISSUER });
            await I_GeneralTransferManager.modifyWhitelist(NONACCREDITED1, fromTime, toTime, expiryTime, canBuyFromSTO, false, { from: ISSUER });

            // Advance time to after STO start
            await increaseTime(duration.days(3));
            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), true, "STO is not Open");

            // Set as accredited
            await I_POLYCappedSTO_Array[stoId].changeAccredited([ACCREDITED1], [true], { from: ISSUER });

            // Pause the STO
            await I_POLYCappedSTO_Array[stoId].pause({ from: ISSUER });
            assert.equal(await I_POLYCappedSTO_Array[stoId].paused.call(), true, "STO did not pause successfully");

            // Prep for investments
            let investment_POLY = new BN(web3.utils.toWei("10000", "ether")); // Invest 10000 POLY
            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_POLYCappedSTO_Array[stoId].address, investment_POLY, { from: NONACCREDITED1 });
            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_POLYCappedSTO_Array[stoId].address, investment_POLY, { from: ACCREDITED1 });

            // NONACCREDITED POLY
            await catchRevert(I_POLYCappedSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, { from: NONACCREDITED1 }));

            // ACCREDITED POLY
            await catchRevert(I_POLYCappedSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, { from: ACCREDITED1 }));

            // Unpause the STO
            await I_POLYCappedSTO_Array[stoId].unpause({ from: ISSUER });
            assert.equal(await I_POLYCappedSTO_Array[stoId].paused.call(), false, "STO did not unpause successfully");

            await I_POLYCappedSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, { from: NONACCREDITED1 });
            await I_POLYCappedSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, { from: ACCREDITED1 });

            await revertToSnapshot(snapId);
        });

        it("Should fail if after STO end time", async () => {
            let stoId = 0;
            let snapId = await takeSnapshot();

            // Whitelist
            let fromTime = await latestTime();
            let toTime = await latestTime() + duration.days(15);
            let expiryTime = toTime + duration.days(200);
            let canBuyFromSTO = true;

            await I_GeneralTransferManager.modifyWhitelist(ACCREDITED1, fromTime, toTime, expiryTime, canBuyFromSTO, true, { from: ISSUER });
            await I_GeneralTransferManager.modifyWhitelist(NONACCREDITED1, fromTime, toTime, expiryTime, canBuyFromSTO, false, { from: ISSUER });

            // Advance time to after STO end
            await increaseTime(duration.days(120));

            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), false, "STO is Open");

            // Set as accredited
            await I_POLYCappedSTO_Array[stoId].changeAccredited([ACCREDITED1], [true], { from: ISSUER });

            // Prep for investments
            let investment_POLY = new BN(web3.utils.toWei("10000", "ether")); // Invest 10000 POLY
            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_POLYCappedSTO_Array[stoId].address, investment_POLY, { from: NONACCREDITED1 });
            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_POLYCappedSTO_Array[stoId].address, investment_POLY, { from: ACCREDITED1 });

            // NONACCREDITED POLY
            await catchRevert(I_POLYCappedSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, { from: NONACCREDITED1 }));

            // ACCREDITED POLY
            await catchRevert(I_POLYCappedSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, { from: ACCREDITED1 }));

            await revertToSnapshot(snapId);
        });

        it("Should fail if finalized", async () => {
            let stoId = 0;
            let snapId = await takeSnapshot();

            // Whitelist
            let fromTime = await latestTime();
            let toTime = await latestTime();
            let expiryTime = toTime + duration.days(100);
            let whitelisted = true;

            await I_GeneralTransferManager.modifyWhitelist(ACCREDITED1, fromTime, toTime, expiryTime, whitelisted, true, { from: ISSUER });
            await I_GeneralTransferManager.modifyWhitelist(NONACCREDITED1, fromTime, toTime, expiryTime, whitelisted, false, { from: ISSUER });
            await I_GeneralTransferManager.modifyWhitelist(RESERVEWALLET, fromTime, toTime, expiryTime, whitelisted, false, { from: ISSUER });

            // Advance time to after STO start
            await increaseTime(duration.days(3));
            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), true, "STO is not Open");

            // Set as accredited
            await I_POLYCappedSTO_Array[stoId].changeAccredited([ACCREDITED1], [true], { from: ISSUER });

            // Finalize STO
            await I_POLYCappedSTO_Array[stoId].finalize({ from: ISSUER });
            assert.equal(await I_POLYCappedSTO_Array[stoId].isFinalized.call(), true, "STO has not been finalized");
            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), false, "STO is Open");

            // Attempt to call function again
            await catchRevert(I_POLYCappedSTO_Array[stoId].finalize({ from: ISSUER }));

            // Prep for investments
            let investment_POLY = new BN(web3.utils.toWei("10000", "ether")); // Invest 10000 POLY
            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_POLYCappedSTO_Array[stoId].address, investment_POLY, { from: NONACCREDITED1 });
            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_POLYCappedSTO_Array[stoId].address, investment_POLY, { from: ACCREDITED1 });

            // NONACCREDITED POLY
            await catchRevert(I_POLYCappedSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, { from: NONACCREDITED1 }));

            // ACCREDITED POLY
            await catchRevert(I_POLYCappedSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, { from: ACCREDITED1 }));

            await revertToSnapshot(snapId);
        });

        it("Should fail if investor has insufficinet POLY tokens", async () => {
            let stoId = 0;
            let snapId = await takeSnapshot();

            // Whitelist
            let fromTime = await latestTime();
            let toTime = await latestTime() + duration.days(15);
            let expiryTime = toTime + duration.days(200);
            let canBuyFromSTO = true;

            await I_GeneralTransferManager.modifyWhitelist(ACCREDITED1, fromTime, toTime, expiryTime, canBuyFromSTO, true, { from: ISSUER });
            await I_GeneralTransferManager.modifyWhitelist(NONACCREDITED1, fromTime, toTime, expiryTime, canBuyFromSTO, false, { from: ISSUER });

            // Advance time to after STO start
            await increaseTime(duration.days(3));
            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), true, "STO is not Open");

            // Set as accredited
            await I_POLYCappedSTO_Array[stoId].changeAccredited([ACCREDITED1], [true], { from: ISSUER });

            // Prep for investments
            let investment_POLY = new BN(web3.utils.toWei("10000", "ether")); // Invest 10000 POLY
            await I_PolyToken.approve(I_POLYCappedSTO_Array[stoId].address, investment_POLY, { from: NONACCREDITED1 });
            await I_PolyToken.approve(I_POLYCappedSTO_Array[stoId].address, investment_POLY, { from: ACCREDITED1 });

            // NONACCREDITED POLY
            await catchRevert(I_POLYCappedSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, { from: NONACCREDITED1 }));

            // ACCREDITED POLY
            await catchRevert(I_POLYCappedSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, { from: ACCREDITED1 }));

            await revertToSnapshot(snapId);
        });

        it("Should fail if STO has insufficinet POLY spend approved by investor", async () => {
            let stoId = 0;
            let snapId = await takeSnapshot();

            // Whitelist
            let fromTime = await latestTime();
            let toTime = await latestTime() + duration.days(15);
            let expiryTime = toTime + duration.days(200);
            let canBuyFromSTO = true;

            await I_GeneralTransferManager.modifyWhitelist(ACCREDITED1, fromTime, toTime, expiryTime, canBuyFromSTO, true, { from: ISSUER });
            await I_GeneralTransferManager.modifyWhitelist(NONACCREDITED1, fromTime, toTime, expiryTime, canBuyFromSTO, false, { from: ISSUER });

            // Advance time to after STO start
            await increaseTime(duration.days(3));
            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), true, "STO is not Open");

            // Set as accredited
            await I_POLYCappedSTO_Array[stoId].changeAccredited([ACCREDITED1], [true], { from: ISSUER });

            // Prep for investments
            let approved_POLY = new BN(0); // approve 0 POLY
            let investment_POLY = new BN(web3.utils.toWei("10000", "ether")); // Invest 10000 POLY
            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_POLYCappedSTO_Array[stoId].address, approved_POLY, { from: NONACCREDITED1 });
            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_POLYCappedSTO_Array[stoId].address, approved_POLY, { from: ACCREDITED1 });

            // NONACCREDITED POLY
            await catchRevert(I_POLYCappedSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, { from: NONACCREDITED1 }));

            // ACCREDITED POLY
            await catchRevert(I_POLYCappedSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, { from: ACCREDITED1 }));

            await revertToSnapshot(snapId);
        });

        it("Should fail if investment value is zero (minimum Investment = 0)", async () => {
            let stoId = 1;
            let snapId = await takeSnapshot();

            // Whitelist
            let fromTime = await latestTime();
            let toTime = await latestTime() + duration.days(15);
            let expiryTime = toTime + duration.days(200);
            let canBuyFromSTO = true;

            await I_GeneralTransferManager.modifyWhitelist(ACCREDITED1, fromTime, toTime, expiryTime, canBuyFromSTO, true, { from: ISSUER });
            await I_GeneralTransferManager.modifyWhitelist(NONACCREDITED1, fromTime, toTime, expiryTime, canBuyFromSTO, false, { from: ISSUER });

            // Advance time to after STO start
            await increaseTime(duration.days(3));
            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), true, "STO is not Open");

            // Set as accredited
            await I_POLYCappedSTO_Array[stoId].changeAccredited([ACCREDITED1], [true], { from: ISSUER });

            // Prep for investments
            let approved_POLY = new BN(web3.utils.toWei("10000", "ether")); // approve 10000 POLY
            let investment_POLY = new BN(0); // Invest 0 POLY
            await I_PolyToken.getTokens(approved_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_POLYCappedSTO_Array[stoId].address, approved_POLY, { from: NONACCREDITED1 });
            await I_PolyToken.getTokens(approved_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_POLYCappedSTO_Array[stoId].address, approved_POLY, { from: ACCREDITED1 });

            // NONACCREDITED POLY
            await catchRevert(I_POLYCappedSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, { from: NONACCREDITED1 }));

            // ACCREDITED POLY
            await catchRevert(I_POLYCappedSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, { from: ACCREDITED1 }));

            await revertToSnapshot(snapId);
        });

        it("Should fail if Beneficial Investments are not allowed then succeed when they are allowed", async () => {
            let stoId = 0;
            let snapId = await takeSnapshot();

            // Whitelist
            let fromTime = await latestTime();
            let toTime = await latestTime() + duration.days(15);
            let expiryTime = toTime + duration.days(200);
            let canBuyFromSTO = true;

            await I_GeneralTransferManager.modifyWhitelist(ACCREDITED1, fromTime, toTime, expiryTime, canBuyFromSTO, true, { from: ISSUER });
            await I_GeneralTransferManager.modifyWhitelist(NONACCREDITED1, fromTime, toTime, expiryTime, canBuyFromSTO, false, { from: ISSUER });

            // Advance time to after STO start
            await increaseTime(duration.days(3));
            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), true, "STO is not Open");
            let allow = await I_POLYCappedSTO_Array[stoId].allowBeneficialInvestments();
            assert.equal(allow, false, "allowBeneficialInvestments should be false");

            // Set as accredited
            await I_POLYCappedSTO_Array[stoId].changeAccredited([ACCREDITED1], [true], { from: ISSUER });

            // Prep for investments
            let investment_POLY = new BN(web3.utils.toWei("10000", "ether")); // Invest 10000 POLY
            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED2);
            await I_PolyToken.approve(I_POLYCappedSTO_Array[stoId].address, investment_POLY, { from: NONACCREDITED2 });
            await I_PolyToken.getTokens(investment_POLY, ACCREDITED2);
            await I_PolyToken.approve(I_POLYCappedSTO_Array[stoId].address, investment_POLY, { from: ACCREDITED2 });

            // NONACCREDITED POLY
            await catchRevert(I_POLYCappedSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, { from: NONACCREDITED2 }));

            // ACCREDITED POLY
            await catchRevert(I_POLYCappedSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, { from: ACCREDITED2 }));

            // ALLOW BENEFICIAL INVESTMENTS
            await I_POLYCappedSTO_Array[stoId].changeAllowBeneficialInvestments(true, { from: ISSUER });
            allow = await I_POLYCappedSTO_Array[stoId].allowBeneficialInvestments();
            assert.equal(allow, true, "allowBeneficialInvestments should be true");

            // NONACCREDITED POLY
            await I_POLYCappedSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, { from: NONACCREDITED2 });

            // ACCREDITED POLY
            await I_POLYCappedSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, { from: ACCREDITED2 });

            await revertToSnapshot(snapId);
        });

        it("Should fail if Beneficial Investments are allowed but beneficiary = address_zero", async () => {
            let stoId = 0;
            let snapId = await takeSnapshot();

            // Advance time to after STO start
            await increaseTime(duration.days(3));

            // ALLOW BENEFICIAL INVESTMENTS
            await I_POLYCappedSTO_Array[stoId].changeAllowBeneficialInvestments(true, { from: ISSUER });
            let allow = await I_POLYCappedSTO_Array[stoId].allowBeneficialInvestments();
            assert.equal(allow, true, "allowBeneficialInvestments should be true");

            // Set as accredited
            await I_POLYCappedSTO_Array[stoId].changeAccredited([address_zero], [true], { from: ISSUER });

            // Prep for investments
            let investment_POLY = new BN(web3.utils.toWei("10000", "ether")); // Invest 10000 POLY

            // ACCREDITED POLY
            await catchRevert(I_POLYCappedSTO_Array[stoId].buyWithPOLY(address_zero, investment_POLY, { from: ACCREDITED1 }));

            await revertToSnapshot(snapId);
        });

        it("Should fail if for non-accredited investors if nonAccreditedLimit has been reached", async () => {
            let stoId = 0;
            let snapId = await takeSnapshot();

            // Whitelist
            let fromTime = await latestTime();
            let toTime = await latestTime() + duration.days(15);
            let expiryTime = toTime + duration.days(200);
            let canBuyFromSTO = true;

            await I_GeneralTransferManager.modifyWhitelist(ACCREDITED1, fromTime, toTime, expiryTime, canBuyFromSTO, true, { from: ISSUER });
            await I_GeneralTransferManager.modifyWhitelist(NONACCREDITED1, fromTime, toTime, expiryTime, canBuyFromSTO, false, { from: ISSUER });
            await I_GeneralTransferManager.modifyWhitelist(NONACCREDITED2, fromTime, toTime, expiryTime, canBuyFromSTO, false, { from: ISSUER });

            // Set as accredited
            await I_POLYCappedSTO_Array[stoId].changeAccredited([ACCREDITED1], [true], { from: ISSUER });

            // Set limit override for NONACCREDITED2
            let nonAccreditedLimitOverride = new BN(web3.utils.toWei("20000", "ether")); //Limit 20000 POLY
            await I_POLYCappedSTO_Array[stoId].changeNonAccreditedLimit([NONACCREDITED2], [nonAccreditedLimitOverride], { from: ISSUER });

            // Advance time to after STO start
            await increaseTime(duration.days(3));
            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), true, "STO is not Open");

            // Prep for investments
            let investment_POLY = new BN(web3.utils.toWei("10000", "ether")); // Invest 10000 POLY
            let requiredPOLY = new BN(investment_POLY.mul(new BN(3)));
            await I_PolyToken.getTokens(requiredPOLY, NONACCREDITED1);
            await I_PolyToken.approve(I_POLYCappedSTO_Array[stoId].address, requiredPOLY, { from: NONACCREDITED1 });
            await I_PolyToken.getTokens(requiredPOLY, NONACCREDITED2);
            await I_PolyToken.approve(I_POLYCappedSTO_Array[stoId].address, requiredPOLY, { from: NONACCREDITED2 });
            await I_PolyToken.getTokens(requiredPOLY, ACCREDITED1);
            await I_PolyToken.approve(I_POLYCappedSTO_Array[stoId].address, requiredPOLY, { from: ACCREDITED1 });

            // Buy up to Default limit - all should succeed
            await I_POLYCappedSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, { from: NONACCREDITED1 });
            await I_POLYCappedSTO_Array[stoId].buyWithPOLY(NONACCREDITED2, investment_POLY, { from: NONACCREDITED2 });
            await I_POLYCappedSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, { from: ACCREDITED1 });

            // Buy up to Override for NONACCREDITED2 - NONACCREDITED1 should fail
            await catchRevert(I_POLYCappedSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, { from: NONACCREDITED1 }));
            await I_POLYCappedSTO_Array[stoId].buyWithPOLY(NONACCREDITED2, investment_POLY, { from: NONACCREDITED2 });
            await I_POLYCappedSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, { from: ACCREDITED1 });

            // Buy over Override for NONACCREDITED2 - NONACCREDITED1 & 2 should fail
            await catchRevert(I_POLYCappedSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, { from: NONACCREDITED1 }));
            await catchRevert(I_POLYCappedSTO_Array[stoId].buyWithPOLY(NONACCREDITED2, investment_POLY, { from: NONACCREDITED2 }));
            await I_POLYCappedSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, { from: ACCREDITED1 });

            await revertToSnapshot(snapId);
        });


        it("Should fail if for non-accredited investors once maxNonAccreditedInvestors limit is reached", async () => {
            let snapId = await takeSnapshot();
            let stoId = 1;

            // Whitelist
            let fromTime = await latestTime();
            let toTime = await latestTime() + duration.days(15);
            let expiryTime = toTime + duration.days(200);
            let canBuyFromSTO = true;

            await I_GeneralTransferManager.modifyWhitelist(ACCREDITED1, fromTime, toTime, expiryTime, canBuyFromSTO, true, { from: ISSUER });
            await I_GeneralTransferManager.modifyWhitelist(ACCREDITED2, fromTime, toTime, expiryTime, canBuyFromSTO, true, { from: ISSUER });
            await I_GeneralTransferManager.modifyWhitelist(NONACCREDITED1, fromTime, toTime, expiryTime, canBuyFromSTO, false, { from: ISSUER });
            await I_GeneralTransferManager.modifyWhitelist(NONACCREDITED2, fromTime, toTime, expiryTime, canBuyFromSTO, false, { from: ISSUER });
            await I_GeneralTransferManager.modifyWhitelist(INVESTOR1, fromTime, toTime, expiryTime, canBuyFromSTO, false, { from: ISSUER });
            await I_GeneralTransferManager.modifyWhitelist(INVESTOR2, fromTime, toTime, expiryTime, canBuyFromSTO, false, { from: ISSUER });
            await I_GeneralTransferManager.modifyWhitelist(INVESTOR3, fromTime, toTime, expiryTime, canBuyFromSTO, false, { from: ISSUER });

            // Set as accredited
            await I_POLYCappedSTO_Array[stoId].changeAccredited([ACCREDITED1], [true], { from: ISSUER });
            await I_POLYCappedSTO_Array[stoId].changeAccredited([ACCREDITED2], [true], { from: ISSUER });

            // Advance time to after STO start
            await increaseTime(duration.days(3));
            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), true, "STO is not Open");

            // Prep for investments
            let investment_POLY = new BN(web3.utils.toWei("10000", "ether")); // Invest 10000 POLY

            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_POLYCappedSTO_Array[stoId].address, investment_POLY, { from: NONACCREDITED1 });
            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED2);
            await I_PolyToken.approve(I_POLYCappedSTO_Array[stoId].address, investment_POLY, { from: NONACCREDITED2 });
            await I_PolyToken.getTokens(investment_POLY, INVESTOR1);
            await I_PolyToken.approve(I_POLYCappedSTO_Array[stoId].address, investment_POLY, { from: INVESTOR1 });
            await I_PolyToken.getTokens(investment_POLY, INVESTOR2);
            await I_PolyToken.approve(I_POLYCappedSTO_Array[stoId].address, investment_POLY, { from: INVESTOR2 });
            await I_PolyToken.getTokens(investment_POLY, INVESTOR3);
            await I_PolyToken.approve(I_POLYCappedSTO_Array[stoId].address, investment_POLY, { from: INVESTOR3 });
            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_POLYCappedSTO_Array[stoId].address, investment_POLY, { from: ACCREDITED1 });
            await I_PolyToken.getTokens(investment_POLY, ACCREDITED2);
            await I_PolyToken.approve(I_POLYCappedSTO_Array[stoId].address, investment_POLY, { from: ACCREDITED2 });

            // INVEST POLY
            await I_POLYCappedSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, { from: NONACCREDITED1 });
            await I_POLYCappedSTO_Array[stoId].buyWithPOLY(NONACCREDITED2, investment_POLY, { from: NONACCREDITED2 });
            await I_POLYCappedSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, { from: ACCREDITED1 });
            await I_POLYCappedSTO_Array[stoId].buyWithPOLY(INVESTOR1, investment_POLY, { from: INVESTOR1 });
            await I_POLYCappedSTO_Array[stoId].buyWithPOLY(INVESTOR2, investment_POLY, { from: INVESTOR2 });
            // Fifth non-accredited investor should fail due to limit being reached
            await catchRevert(I_POLYCappedSTO_Array[stoId].buyWithPOLY(INVESTOR3, investment_POLY, { from: INVESTOR3 }));
            // verify accredited investors can still invest
            await I_POLYCappedSTO_Array[stoId].buyWithPOLY(ACCREDITED2, investment_POLY, { from: ACCREDITED2 });
            await revertToSnapshot(snapId);
        });

        it("Should fail if cap has been reached", async () => {
            let stoId = 0;
            let snapId = await takeSnapshot();

            // Whitelist
            let fromTime = await latestTime();
            let toTime = await latestTime() + duration.days(15);
            let expiryTime = toTime + duration.days(200);
            let canBuyFromSTO = true;

            await I_GeneralTransferManager.modifyWhitelist(ACCREDITED1, fromTime, toTime, expiryTime, canBuyFromSTO, true, { from: ISSUER });
            await I_GeneralTransferManager.modifyWhitelist(ACCREDITED2, fromTime, toTime, expiryTime, canBuyFromSTO, true, { from: ISSUER });
            await I_GeneralTransferManager.modifyWhitelist(NONACCREDITED1, fromTime, toTime, expiryTime, canBuyFromSTO, false, { from: ISSUER });

            // Set as accredited
            await I_POLYCappedSTO_Array[stoId].changeAccredited([ACCREDITED1], [true], { from: ISSUER });
            await I_POLYCappedSTO_Array[stoId].changeAccredited([ACCREDITED2], [true], { from: ISSUER });

            // Advance time to after STO start
            await increaseTime(duration.days(3));
            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), true, "STO is not Open");

            // Prep for investments
            let investment_POLY = new BN(web3.utils.toWei("10000", "ether")); // Invest 10000 POLY
            let max_investment = new BN(web3.utils.toWei("1000000", "ether")); // 1m POLY (max allowed by faucet)
            await I_PolyToken.getTokens(max_investment, ACCREDITED1);
            await I_PolyToken.approve(I_POLYCappedSTO_Array[stoId].address, max_investment, { from: ACCREDITED1 });
            await I_PolyToken.getTokens(investment_POLY, ACCREDITED2);
            await I_PolyToken.approve(I_POLYCappedSTO_Array[stoId].address, investment_POLY, { from: ACCREDITED2 });
            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_POLYCappedSTO_Array[stoId].address, investment_POLY, { from: NONACCREDITED1 });

            // First buy up all tokens - should succeed
            await I_POLYCappedSTO_Array[stoId].buyWithPOLY(ACCREDITED1, max_investment, { from: ACCREDITED1 });
            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), false, "STO is not Closed");
            assert.equal(await I_POLYCappedSTO_Array[stoId].capReached(), true, "STO cap has not been reached");

            // try to buy more tokens should fail for both accredited and non accredited investors
            await catchRevert(I_POLYCappedSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, { from: NONACCREDITED1 }));
            await catchRevert(I_POLYCappedSTO_Array[stoId].buyWithPOLY(ACCREDITED2, investment_POLY, { from: ACCREDITED2 }));

            await revertToSnapshot(snapId);
        });

        it("Should revert if ETH is sent to the STO Contract", async () => {
            let stoId = 0;
            let snapId = await takeSnapshot();

            // Whitelist
            let fromTime = await latestTime();
            let toTime = await latestTime() + duration.days(15);
            let expiryTime = toTime + duration.days(200);
            let canBuyFromSTO = true;

            await I_GeneralTransferManager.modifyWhitelist(ACCREDITED1, fromTime, toTime, expiryTime, canBuyFromSTO, true, { from: ISSUER });
            await I_GeneralTransferManager.modifyWhitelist(NONACCREDITED1, fromTime, toTime, expiryTime, canBuyFromSTO, false, { from: ISSUER });

            // Set as accredited
            await I_POLYCappedSTO_Array[stoId].changeAccredited([ACCREDITED1], [true], { from: ISSUER });
            await I_POLYCappedSTO_Array[stoId].changeAccredited([ACCREDITED2], [true], { from: ISSUER });

            // Advance time to after STO start
            await increaseTime(duration.days(3));
            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), true, "STO is not Open");

            let investment_ETH = new BN(5).mul(e18);

            await catchRevert(web3.eth.sendTransaction({
                from: NONACCREDITED1,
                to: I_POLYCappedSTO_Array[stoId].address,
                value: investment_ETH,
                gasPrice: GAS_PRICE,
                gas: 7000000
            }));
            await catchRevert(web3.eth.sendTransaction({
                from: ACCREDITED1,
                to: I_POLYCappedSTO_Array[stoId].address,
                value: investment_ETH,
                gasPrice: GAS_PRICE,
                gas: 7000000
            }));
            await revertToSnapshot(snapId);
        });
    });

/*    describe("Prep STO", async () => {
        it("should jump forward to after STO start", async () => {
            let stoId = 0;
            await increaseTime(duration.days(3));
            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), true, "STO is not Open");
        });

        it("should whitelist ACCREDITED1 and NONACCREDITED1", async () => {
            let stoId = 0;

            let fromTime = await latestTime();
            let toTime = await latestTime() + duration.days(15);
            let expiryTime = toTime + duration.days(100);
            let whitelisted = true;

            const tx1 = await I_GeneralTransferManager.modifyWhitelist(NONACCREDITED1, fromTime, toTime, expiryTime, whitelisted, false, {
                from: ISSUER
            });
            assert.equal(tx1.logs[0].args._investor, NONACCREDITED1, "Failed in adding the investor in whitelist");
            const tx2 = await I_GeneralTransferManager.modifyWhitelist(ACCREDITED1, fromTime, toTime, expiryTime, whitelisted, true, {
                from: ISSUER
            });
            assert.equal(tx2.logs[0].args._investor, ACCREDITED1, "Failed in adding the investor in whitelist");
        });

        it("should successfully modify accredited addresses for first STO", async () => {
            let stoId = 0;
            let investorStatus = await I_POLYCappedSTO_Array[stoId].investors.call(NONACCREDITED1);
            let status1 = investorStatus[0].toNumber();
            assert.equal(status1, 0, "Initial accreditation is set to true");

            await I_POLYCappedSTO_Array[stoId].changeAccredited([NONACCREDITED1], [true], { from: ISSUER });
            investorStatus = await I_POLYCappedSTO_Array[stoId].investors.call(NONACCREDITED1);
            let status2 = investorStatus[0].toNumber();
            assert.equal(status2, 1, "Failed to set single address");

            await I_POLYCappedSTO_Array[stoId].changeAccredited([NONACCREDITED1, ACCREDITED1], [false, true], { from: ISSUER });
            investorStatus = await I_POLYCappedSTO_Array[stoId].investors.call(NONACCREDITED1);
            let status3 = investorStatus[0].toNumber();
            assert.equal(status3, 0, "Failed to set multiple addresses");
            investorStatus = await I_POLYCappedSTO_Array[stoId].investors.call(ACCREDITED1);
            let status4 = investorStatus[0].toNumber();
            assert.equal(status4, 1, "Failed to set multiple addresses");

            let totalStatus = await I_POLYCappedSTO_Array[stoId].getAccreditedData.call();
            console.log(totalStatus);
            assert.equal(totalStatus[0][0], NONACCREDITED1, "Account match");
            assert.equal(totalStatus[0][1], ACCREDITED1, "Account match");
            assert.equal(totalStatus[1][0], false, "Account match");
            assert.equal(totalStatus[1][1], true, "Account match");
            assert.equal(totalStatus[2][0].toNumber(), 0, "override match");
            assert.equal(totalStatus[2][1].toNumber(), 0, "override match");
            await catchRevert(I_POLYCappedSTO_Array[stoId].changeAccredited([NONACCREDITED1, ACCREDITED1], [true], { from: ISSUER }));
        });

        it("should successfully modify accredited addresses for second STO", async () => {
            let stoId = 1;

            await I_POLYCappedSTO_Array[stoId].changeAccredited([NONACCREDITED1, ACCREDITED1], [false, true], { from: ISSUER });
            let investorStatus = await I_POLYCappedSTO_Array[stoId].investors.call(NONACCREDITED1);
            let status1 = investorStatus[0].toNumber();
            investorStatus = await I_POLYCappedSTO_Array[stoId].investors.call(ACCREDITED1);
            let status2 = investorStatus[0].toNumber();
            assert.equal(status1, 0, "Failed to set multiple address");
            assert.equal(status2, 1, "Failed to set multiple address");
        });
    });

    describe("Buy Tokens with no discount", async () => {

        it("should successfully buy using buyWithPOLY at tier 0 for NONACCREDITED1", async () => {
            let stoId = 0;
            let tierId = 0;

            let investment_Token = new BN(50).mul(e18);
            let investment_USD = await convert(stoId, tierId, false, "TOKEN", "USD", investment_Token);
            let investment_ETH = await convert(stoId, tierId, false, "TOKEN", "ETH", investment_Token);
            let investment_POLY = await convert(stoId, tierId, false, "TOKEN", "POLY", investment_Token);

            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_POLYCappedSTO_Array[stoId].address, investment_POLY, { from: NONACCREDITED1 });

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let init_InvestorETHBal = new BN(await web3.eth.getBalance(NONACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let init_STOTokenSold = await I_POLYCappedSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BN(await web3.eth.getBalance(I_POLYCappedSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_POLYCappedSTO_Array[stoId].address);
            let init_RaisedETH = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(POLY);
            let init_RaisedDAI = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(DAI);
            let init_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            // Buy With POLY
            let tx2 = await I_POLYCappedSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, {
                from: NONACCREDITED1,
                gasPrice: GAS_PRICE
            });
            let gasCost2 = new BN(GAS_PRICE).mul(new BN(tx2.receipt.gasUsed));
            console.log("          Gas buyWithPOLY: ".grey + new BN(tx2.receipt.gasUsed).toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let final_InvestorETHBal = new BN(await web3.eth.getBalance(NONACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let final_STOTokenSold = await I_POLYCappedSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BN(await web3.eth.getBalance(I_POLYCappedSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_POLYCappedSTO_Array[stoId].address);
            let final_RaisedETH = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(POLY);
            let final_RaisedDAI = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(DAI);
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

        it("should successfully buy using buyWithPOLY at tier 0 for ACCREDITED1", async () => {
            let stoId = 0;
            let tierId = 0;

            let investment_Token = new BN(50).mul(e18);
            let investment_USD = await convert(stoId, tierId, false, "TOKEN", "USD", investment_Token);
            let investment_ETH = await convert(stoId, tierId, false, "TOKEN", "ETH", investment_Token);
            let investment_POLY = await convert(stoId, tierId, false, "TOKEN", "POLY", investment_Token);

            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_POLYCappedSTO_Array[stoId].address, investment_POLY, { from: ACCREDITED1 });

            // Additional checks on getters
            let init_getTokensSold = await I_POLYCappedSTO_Array[stoId].getTokensSold();
            let init_getTokensMinted = await I_POLYCappedSTO_Array[stoId].getTokensMinted();
            let init_getTokensSoldForETH = await I_POLYCappedSTO_Array[stoId].getTokensSoldFor(ETH);
            let init_getTokensSoldForPOLY = await I_POLYCappedSTO_Array[stoId].getTokensSoldFor(POLY);
            let init_investorInvestedUSD = await I_POLYCappedSTO_Array[stoId].investorInvestedUSD.call(ACCREDITED1);
            let init_investorInvestedETH = await I_POLYCappedSTO_Array[stoId].investorInvested.call(ACCREDITED1, ETH);
            let init_investorInvestedPOLY = await I_POLYCappedSTO_Array[stoId].investorInvested.call(ACCREDITED1, POLY);

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let init_InvestorETHBal = new BN(await web3.eth.getBalance(ACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let init_STOTokenSold = await I_POLYCappedSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BN(await web3.eth.getBalance(I_POLYCappedSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_POLYCappedSTO_Array[stoId].address);
            let init_RaisedETH = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(POLY);
            let init_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            // Buy With POLY
            let tx2 = await I_POLYCappedSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, {
                from: ACCREDITED1,
                gasPrice: GAS_PRICE
            });
            let gasCost2 = new BN(GAS_PRICE).mul(new BN(tx2.receipt.gasUsed));
            console.log("          Gas buyWithPOLY: ".grey + new BN(tx2.receipt.gasUsed).toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let final_InvestorETHBal = new BN(await web3.eth.getBalance(ACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let final_STOTokenSold = await I_POLYCappedSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BN(await web3.eth.getBalance(I_POLYCappedSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_POLYCappedSTO_Array[stoId].address);
            let final_RaisedETH = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(POLY);
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
            assert.equal((await I_POLYCappedSTO_Array[stoId].investorCount.call()).toString(), 2, "Investor count not changed as expected");
            assert.equal(
                (await I_POLYCappedSTO_Array[stoId].getTokensSold()).toString(),
                init_getTokensSold.add(investment_Token).toString(),
                "getTokensSold not changed as expected"
            );
            assert.equal(
                (await I_POLYCappedSTO_Array[stoId].getTokensMinted()).toString(),
                init_getTokensMinted.add(investment_Token).toString(),
                "getTokensMinted not changed as expected"
            );
            assert.equal(
                (await I_POLYCappedSTO_Array[stoId].getTokensSoldFor(ETH)).toString(),
                init_getTokensSoldForETH.toString(),
                "getTokensSoldForETH not changed as expected"
            );
            assert.equal(
                (await I_POLYCappedSTO_Array[stoId].getTokensSoldFor(POLY)).toString(),
                init_getTokensSoldForPOLY.add(investment_Token).toString(),
                "getTokensSoldForPOLY not changed as expected"
            );
            assert.equal(
                (await I_POLYCappedSTO_Array[stoId].investorInvestedUSD.call(ACCREDITED1)).toString(),
                init_investorInvestedUSD.add(investment_USD).toString(),
                "investorInvestedUSD not changed as expected"
            );
            assert.equal(
                (await I_POLYCappedSTO_Array[stoId].investorInvested.call(ACCREDITED1, ETH)).toString(),
                init_investorInvestedETH.toString(),
                "investorInvestedETH not changed as expected"
            );
            assert.equal(
                (await I_POLYCappedSTO_Array[stoId].investorInvested.call(ACCREDITED1, POLY)).toString(),
                init_investorInvestedPOLY.add(investment_POLY).toString(),
                "investorInvestedPOLY not changed as expected"
            );
        });

        it("should successfully modify NONACCREDITED cap for NONACCREDITED1", async () => {
            let stoId = 0;
            let tierId = 0;
            console.log("Current investment: " + (await I_POLYCappedSTO_Array[stoId].investorInvestedUSD.call(NONACCREDITED1)).toString());
            await I_POLYCappedSTO_Array[stoId].changeNonAccreditedLimit([NONACCREDITED1], [_nonAccreditedLimit[stoId].div(new BN(2))], {
                from: ISSUER
            });
            let investorStatus = await I_POLYCappedSTO_Array[stoId].investors.call(NONACCREDITED1);
            console.log("Current limit: " + investorStatus[2].toString());
            let totalStatus = await I_POLYCappedSTO_Array[stoId].getAccreditedData.call();

            assert.equal(totalStatus[0][0], NONACCREDITED1, "Account match");
            assert.equal(totalStatus[0][1], ACCREDITED1, "Account match");
            assert.equal(totalStatus[1][0], false, "Account match");
            assert.equal(totalStatus[1][1], true, "Account match");
            assert.equal(totalStatus[2][0].toString(), _nonAccreditedLimit[stoId].div(new BN(2)), "override match");
            assert.equal(totalStatus[2][1].toString(), 0, "override match");
        });

        it("should successfully buy a partial amount and refund balance when reaching NONACCREDITED cap", async () => {
            let stoId = 0;
            let tierId = 0;

            let investorStatus = await I_POLYCappedSTO_Array[stoId].investors.call(NONACCREDITED1);
            let investment_USD = investorStatus[2];//await I_POLYCappedSTO_Array[stoId].nonAccreditedLimitOverride(NONACCREDITED1); //_nonAccreditedLimit[stoId];
            let investment_Token = await convert(stoId, tierId, false, "USD", "TOKEN", investment_USD);
            let investment_ETH = await convert(stoId, tierId, false, "USD", "ETH", investment_USD);
            let investment_POLY = await convert(stoId, tierId, false, "USD", "POLY", investment_USD);

            let refund_USD = await I_POLYCappedSTO_Array[stoId].investorInvestedUSD.call(NONACCREDITED1);
            let refund_Token = await convert(stoId, tierId, false, "USD", "TOKEN", refund_USD);
            let refund_ETH = await convert(stoId, tierId, false, "USD", "ETH", refund_USD);
            let refund_POLY = await convert(stoId, tierId, false, "USD", "POLY", refund_USD);

            console.log("Expected refund in tokens: " + refund_Token.toString());

            let snap = await takeSnapshot();

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let init_InvestorETHBal = new BN(await web3.eth.getBalance(NONACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let init_STOTokenSold = await I_POLYCappedSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BN(await web3.eth.getBalance(I_POLYCappedSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_POLYCappedSTO_Array[stoId].address);
            let init_RaisedETH = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(POLY);
            let init_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            // Buy with ETH
            let tx1 = await I_POLYCappedSTO_Array[stoId].buyWithETH(NONACCREDITED1, {
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
            let final_STOTokenSold = await I_POLYCappedSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BN(await web3.eth.getBalance(I_POLYCappedSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_POLYCappedSTO_Array[stoId].address);
            let final_RaisedETH = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(POLY);
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
            await I_PolyToken.approve(I_POLYCappedSTO_Array[stoId].address, investment_POLY, { from: NONACCREDITED1 });

            init_TokenSupply = await I_SecurityToken.totalSupply();
            init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            init_InvestorETHBal = new BN(await web3.eth.getBalance(NONACCREDITED1));
            init_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            init_STOTokenSold = await I_POLYCappedSTO_Array[stoId].getTokensSold();
            init_STOETHBal = new BN(await web3.eth.getBalance(I_POLYCappedSTO_Array[stoId].address));
            init_STOPOLYBal = await I_PolyToken.balanceOf(I_POLYCappedSTO_Array[stoId].address);
            init_RaisedETH = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(ETH);
            init_RaisedPOLY = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(POLY);
            init_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            // Buy With POLY
            let tx2 = await I_POLYCappedSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, {
                from: NONACCREDITED1,
                gasPrice: GAS_PRICE
            });
            let gasCost2 = new BN(GAS_PRICE).mul(new BN(tx2.receipt.gasUsed));
            console.log("          Gas buyWithPOLY: ".grey + new BN(tx2.receipt.gasUsed).toString().grey);

            final_TokenSupply = await I_SecurityToken.totalSupply();
            final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            final_InvestorETHBal = new BN(await web3.eth.getBalance(NONACCREDITED1));
            final_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            final_STOTokenSold = await I_POLYCappedSTO_Array[stoId].getTokensSold();
            final_STOETHBal = new BN(await web3.eth.getBalance(I_POLYCappedSTO_Array[stoId].address));
            final_STOPOLYBal = await I_PolyToken.balanceOf(I_POLYCappedSTO_Array[stoId].address);
            final_RaisedETH = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(ETH);
            final_RaisedPOLY = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(POLY);
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
            await I_PolyToken.approve(I_POLYCappedSTO_Array[stoId].address, investment_POLY, { from: NONACCREDITED1, gasPrice: GAS_PRICE });

            // Buy with ETH NONACCREDITED
            await catchRevert(
                I_POLYCappedSTO_Array[stoId].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, value: investment_ETH, gasPrice: GAS_PRICE })
            );

            // Buy with POLY NONACCREDITED
            await catchRevert(
                I_POLYCappedSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, { from: NONACCREDITED1, gasPrice: GAS_PRICE })
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
            let investment_ETH_high = investment_USD.div(high_USDETH).mul(e18); // USD / USD/ETH = ETH
            let investment_POLY_high = investment_USD.div(high_USDPOLY).mul(e18); // USD / USD/POLY = POLY
            let investment_ETH_low = investment_USD.div(low_USDETH).mul(e18); // USD / USD/ETH = ETH
            let investment_POLY_low = investment_USD.div(low_USDPOLY).mul(e18); // USD / USD/POLY = POLY

            await I_PolyToken.getTokens(investment_POLY_low, NONACCREDITED1);
            await I_PolyToken.approve(I_POLYCappedSTO_Array[stoId].address, investment_POLY_low, { from: NONACCREDITED1 });

            // Change exchange rates up
            await I_USDOracle.changePrice(high_USDETH, { from: POLYMATH });
            await I_POLYOracle.changePrice(high_USDPOLY, { from: POLYMATH });

            // Buy with ETH NONACCREDITED

            await catchRevert(
                I_POLYCappedSTO_Array[stoId].buyWithETH(NONACCREDITED1, {
                    from: NONACCREDITED1,
                    value: investment_ETH_high,
                    gasPrice: GAS_PRICE
                })
            );

            // Buy with POLY NONACCREDITED

            await catchRevert(
                I_POLYCappedSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY_high, { from: NONACCREDITED1, gasPrice: GAS_PRICE })
            );

            // Change exchange rates down
            await I_USDOracle.changePrice(low_USDETH, { from: POLYMATH });
            await I_POLYOracle.changePrice(low_USDPOLY, { from: POLYMATH });

            // Buy with ETH NONACCREDITED

            await catchRevert(
                I_POLYCappedSTO_Array[stoId].buyWithETH(NONACCREDITED1, {
                    from: NONACCREDITED1,
                    value: investment_ETH_low,
                    gasPrice: GAS_PRICE
                })
            );

            // Buy with POLY NONACCREDITED

            await catchRevert(
                I_POLYCappedSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY_low, { from: NONACCREDITED1, gasPrice: GAS_PRICE })
            );

            // Reset exchange rates
            await I_USDOracle.changePrice(USDETH, { from: POLYMATH });
            await I_POLYOracle.changePrice(USDPOLY, { from: POLYMATH });
        });

        it("should successfully buy across tiers for NONACCREDITED POLY", async () => {
            let stoId = 1;
            let startTier = 1;
            let endTier = 2;

            assert.equal(
                (await I_POLYCappedSTO_Array[stoId].currentTier.call()).toString(),
                startTier,
                "currentTier not changed as expected"
            );

            let delta_Token = new BN(5).mul(e18); // Token
            let polyTier0 = await convert(stoId, startTier, false, "TOKEN", "POLY", delta_Token);
            let polyTier1 = await convert(stoId, endTier, false, "TOKEN", "POLY", delta_Token);

            let investment_Token = delta_Token.add(delta_Token); // 10 Token
            let investment_POLY = polyTier0.add(polyTier1); // 0.0025 ETH

            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_POLYCappedSTO_Array[stoId].address, investment_POLY, { from: NONACCREDITED1 });

            // Process investment
            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let init_InvestorETHBal = new BN(await web3.eth.getBalance(NONACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let init_STOTokenSold = await I_POLYCappedSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BN(await web3.eth.getBalance(I_POLYCappedSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_POLYCappedSTO_Array[stoId].address);
            let init_RaisedETH = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(POLY);
            let init_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            let tx2 = await I_POLYCappedSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, {
                from: NONACCREDITED1,
                gasPrice: GAS_PRICE
            });
            let gasCost2 = new BN(GAS_PRICE).mul(new BN(tx2.receipt.gasUsed));
            console.log("          Gas buyWithPOLY: ".grey + new BN(tx2.receipt.gasUsed).toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let final_InvestorETHBal = new BN(await web3.eth.getBalance(NONACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let final_STOTokenSold = await I_POLYCappedSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BN(await web3.eth.getBalance(I_POLYCappedSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_POLYCappedSTO_Array[stoId].address);
            let final_RaisedETH = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(POLY);
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
            assert.equal((await I_POLYCappedSTO_Array[stoId].currentTier.call()).toString(), endTier, "currentTier not changed as expected");
        });

        it("should successfully buy across tiers for ACCREDITED POLY", async () => {
            let stoId = 1;
            let startTier = 4;
            let endTier = 5;

            assert.equal(
                (await I_POLYCappedSTO_Array[stoId].currentTier.call()).toString(),
                startTier,
                "currentTier not changed as expected"
            );

            let delta_Token = new BN(5).mul(e18); // Token
            let polyTier0 = await convert(stoId, startTier, false, "TOKEN", "POLY", delta_Token);
            let polyTier1 = await convert(stoId, endTier, false, "TOKEN", "POLY", delta_Token);

            let investment_Token = delta_Token.add(delta_Token); // 10 Token
            let investment_POLY = polyTier0.add(polyTier1); // 0.0025 ETH

            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_POLYCappedSTO_Array[stoId].address, investment_POLY, { from: ACCREDITED1 });

            // Process investment
            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let init_InvestorETHBal = new BN(await web3.eth.getBalance(ACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let init_STOTokenSold = await I_POLYCappedSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BN(await web3.eth.getBalance(I_POLYCappedSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_POLYCappedSTO_Array[stoId].address);
            let init_RaisedETH = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(POLY);
            let init_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);

            let tx2 = await I_POLYCappedSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, {
                from: ACCREDITED1,
                gasPrice: GAS_PRICE
            });
            let gasCost2 = new BN(GAS_PRICE).mul(new BN(tx2.receipt.gasUsed));
            console.log("          Gas buyWithPOLY: ".grey + new BN(tx2.receipt.gasUsed).toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let final_InvestorETHBal = new BN(await web3.eth.getBalance(ACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let final_STOTokenSold = await I_POLYCappedSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BN(await web3.eth.getBalance(I_POLYCappedSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_POLYCappedSTO_Array[stoId].address);
            let final_RaisedETH = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(POLY);
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
            assert.equal((await I_POLYCappedSTO_Array[stoId].currentTier.call()).toString(), endTier, "currentTier not changed as expected");
        });

        it("should buy out the rest of the sto", async () => {
            let stoId = 1;
            let tierId = 5;

            let minted = (await I_POLYCappedSTO_Array[stoId].tiers.call(tierId))[4];
            console.log(minted.toString() + ":" + _tokensPerTierTotal[stoId][tierId]);
            let investment_Token = _tokensPerTierTotal[stoId][tierId].sub(minted);
            console.log(investment_Token.toString());
            let investment_ETH = await convert(stoId, tierId, false, "TOKEN", "ETH", investment_Token);

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let init_STOTokenSold = await I_POLYCappedSTO_Array[stoId].getTokensSold();

            let tx = await I_POLYCappedSTO_Array[stoId].buyWithETH(ACCREDITED1, {
                from: ACCREDITED1,
                value: investment_ETH,
                gasPrice: GAS_PRICE
            });
            console.log("          Gas buyWithETH: ".grey + tx.receipt.gasUsed.toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let final_STOTokenSold = await I_POLYCappedSTO_Array[stoId].getTokensSold();

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
            // assert.equal((await I_POLYCappedSTO_Array[1].getTokensMinted()).toString(), _tokensPerTierTotal[1].reduce((a, b) => a + b, 0).toString(), "STO Token Sold not changed as expected");
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
            await I_PolyToken.approve(I_POLYCappedSTO_Array[stoId].address, investment_POLY, { from: NONACCREDITED1, gasPrice: GAS_PRICE });

            await I_DaiToken.getTokens(investment_DAI, NONACCREDITED1);
            await I_DaiToken.approve(I_POLYCappedSTO_Array[stoId].address, investment_DAI, { from: NONACCREDITED1, gasPrice: GAS_PRICE });

            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), false, "STO is Open");

            // Buy with ETH NONACCREDITED

            await catchRevert(
                I_POLYCappedSTO_Array[stoId].buyWithETH(NONACCREDITED1, { from: NONACCREDITED1, value: investment_ETH, gasPrice: GAS_PRICE })
            );

            // Buy with POLY NONACCREDITED

            await catchRevert(
                I_POLYCappedSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, { from: NONACCREDITED1, gasPrice: GAS_PRICE })
            );

            // Buy with DAI NONACCREDITED

            await catchRevert(
                I_POLYCappedSTO_Array[stoId].buyWithUSD(NONACCREDITED1, investment_DAI, I_DaiToken.address, { from: NONACCREDITED1, gasPrice: GAS_PRICE })
            );

            // Buy with ETH ACCREDITED

            await catchRevert(
                I_POLYCappedSTO_Array[stoId].buyWithETH(ACCREDITED1, { from: ACCREDITED1, value: investment_ETH, gasPrice: GAS_PRICE })
            );

            // Buy with POLY ACCREDITED

            await catchRevert(
                I_POLYCappedSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, { from: ACCREDITED1, gasPrice: GAS_PRICE })
            );

            // Buy with DAI ACCREDITED

            await catchRevert(
                I_POLYCappedSTO_Array[stoId].buyWithUSD(ACCREDITED1, investment_DAI, I_DaiToken.address, { from: ACCREDITED1, gasPrice: GAS_PRICE })
            );
        });

    });
*/

    describe("Reclaim POLY sent directly to STO contract in error", async () => {
        it("Should fail to reclaim POLY because token contract address is 0 address", async () => {
            let value = new BN(web3.utils.toWei("100", "ether"));
            await I_PolyToken.getTokens(value, INVESTOR1);
            await I_PolyToken.transfer(I_POLYCappedSTO_Array[0].address, value, { from: INVESTOR1 });

            await catchRevert(I_POLYCappedSTO_Array[0].reclaimERC20(address_zero, { from: ISSUER }));
        });

        it("Should successfully reclaim POLY", async () => {
            let initInvestorBalance = new BN(await I_PolyToken.balanceOf(INVESTOR1));
            let initOwnerBalance = new BN(await I_PolyToken.balanceOf(ISSUER));
            let initContractBalance = new BN(await I_PolyToken.balanceOf(I_POLYCappedSTO_Array[0].address));
            let value = new BN(web3.utils.toWei("100", "ether"));

            await I_PolyToken.getTokens(value, INVESTOR1);
            await I_PolyToken.transfer(I_POLYCappedSTO_Array[0].address, value, { from: INVESTOR1 });
            await I_POLYCappedSTO_Array[0].reclaimERC20(I_PolyToken.address, { from: ISSUER });
            assert.equal(
                (await I_PolyToken.balanceOf(INVESTOR1)).toString(),
                initInvestorBalance.toString(),
                "tokens are not transferred out from investor account"
            );
            assert.equal(
                (await I_PolyToken.balanceOf(ISSUER)).toString(),
                initOwnerBalance
                    .add(value)
                    .add(initContractBalance)
                    .toString(),
                "tokens are not added to the owner account"
            );
            assert.equal(
                (await I_PolyToken.balanceOf(I_POLYCappedSTO_Array[0].address)).toString(),
                new BN(0).toString(),
                "tokens are not trandfered out from STO contract"
            );
        });
    });

    describe("Test cases for the POLYCappedSTOFactory", async () => {
        it("should get the exact details of the factory", async () => {
            assert.equal((await I_POLYCappedSTOFactory.getSetupCost.call()).toString(), STOSetupCost);
            assert.equal((await I_POLYCappedSTOFactory.getTypes.call())[0], 3);
            assert.equal(web3.utils.hexToString(await I_POLYCappedSTOFactory.getName.call()), "POLYCappedSTO", "Wrong Module added");
            assert.equal(
                await I_POLYCappedSTOFactory.description.call(),
                "This smart contract creates a maximum number of tokens (i.e. hard cap) which the total aggregate of tokens acquired by all investors cannot exceed. Security tokens are sent to the investor upon reception of the funds (POLY). This STO supports options for a minimum investment limit for all investors, maximum investment limit for non-accredited investors and an option to mint unsold tokens to a reserve wallet upon termination of the offering.",
                "Wrong Module added"
            );
            assert.equal(await I_POLYCappedSTOFactory.title.call(), "POLY - Capped STO", "Wrong Module added");
            assert.equal(await I_POLYCappedSTOFactory.getInstructions.call(), "Initialises a POLY capped STO. Init parameters are _startTime (time STO starts), _endTime (time STO ends), _cap (cap in tokens for STO), _rate (POLY to token rate), _minimumInvestment (required minimum investment), _nonAccreditedLimit (maximum investment for non-accredited investors), _maxNonAccreditedInvestors (maximum number of non accredited investors), _wallet (address which will receive funds), _reserveWallet (address which will receive unsold tokens)");
            assert.equal(await I_POLYCappedSTOFactory.version.call(), "1.0.0");
            let tags = await I_POLYCappedSTOFactory.getTags.call();
            assert.equal(web3.utils.hexToString(tags[0]), "Capped");
            assert.equal(web3.utils.hexToString(tags[1]), "Non-refundable");
            assert.equal(web3.utils.hexToString(tags[2]), "POLY");
        });
    });
});
