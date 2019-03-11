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
const STGetter = artifacts.require("./STGetter.sol");
const POLYCappedSTOFactory = artifacts.require("./POLYCappedSTOFactory.sol");
const POLYCappedSTOProxy = artifacts.require("./POLYCappedSTOProxy.sol");

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
    let TREASURYWALLET;
    let INVESTOR1;
    let INVESTOR2;
    let INVESTOR3;
    let ACCREDITED1;
    let ACCREDITED2;
    let NONACCREDITED1;
    let NONACCREDITED2;
    let ETH = 0;
    let POLY = 1;
    let SC = 2;

    let MESSAGE = "Transaction Should Fail!";
    const GAS_PRICE = 0;

    // Contract Instance Declaration
    let I_GeneralPermissionManagerFactory;
    let I_SecurityTokenRegistryProxy;
    let I_GeneralTransferManagerFactory;
    let I_GeneralPermissionManager;
    let I_GeneralTransferManager;
    let I_ModuleRegistry;
    let I_ModuleRegistryProxy;
    let I_FeatureRegistry;
    let I_SecurityTokenRegistry;
    let I_POLYCappedSTOFactory;
    let I_POLYOracle;
    let I_STFactory;
    let I_SecurityToken;
    let I_STRProxied;
    let I_MRProxied;
    let I_POLYCappedSTO_Array = [];
    let I_PolyToken;
    let I_PolymathRegistry;
    let P_POLYCappedSTOFactory;
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
    let _treasuryWallet = [];

/*    function configure(
        uint256 _startTime,
        uint256 _endTime,
        uint256 _cap,
        uint256 _rate,
        uint256 _minimumInvestment,
        uint256 _nonAccreditedLimit,
        uint256 _maxNonAccreditedInvestors,
        address payable _wallet,
        address _treasuryWallet
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
                name: "_treasuryWallet"
            }
        ]
    };

    let currentTime;

    before(async () => {
        e18 = new BN(10).pow(new BN(18));
        e16 = new BN(10).pow(new BN(16));
        currentTime = new BN(await latestTime());
        REGFEE = new BN(web3.utils.toWei("1000"));
        USDPOLY = new BN(25).mul(e16); // 0.25 USD/POLY
        POLYMATH = accounts[0];
        ISSUER = accounts[1];
        WALLET = accounts[2];
        TREASURYWALLET = WALLET;
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
             I_STRGetter,
             I_STGetter
         ] = instances;

        // STEP 2: Deploy the GeneralDelegateManagerFactory
        [I_GeneralPermissionManagerFactory] = await deployGPMAndVerifyed(POLYMATH, I_MRProxied, 0);

        // STEP 3: Deploy the POLYCappedSTOFactory
        [I_POLYCappedSTOFactory] = await deployPOLYCappedSTOAndVerified(POLYMATH, I_MRProxied, STOSetupCost);
        [P_POLYCappedSTOFactory] = await deployPOLYCappedSTOAndVerified(POLYMATH, I_MRProxied, new BN(web3.utils.toWei("500")));
        // Step 4: Deploy & Register Mock Oracles
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
        POLYCappedSTOFactory(Paid):        ${P_POLYCappedSTOFactory.address}
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

            let tx = await I_STRProxied.generateSecurityToken(NAME, SYMBOL, TOKENDETAILS, true, ISSUER, 0, { from: ISSUER });
            assert.equal(tx.logs[2].args._ticker, SYMBOL, "SecurityToken doesn't get deployed");

            I_SecurityToken = await SecurityToken.at(tx.logs[2].args._securityTokenAddress);
            stGetter = await STGetter.at(I_SecurityToken.address);
            const log = (await I_SecurityToken.getPastEvents('ModuleAdded', {filter: {transactionHash: tx.transactionHash}}))[0];

            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._types[0].toString(), TMKEY);
            assert.equal(web3.utils.hexToString(log.args._name), "GeneralTransferManager");
        });

        it("Should intialize the auto attached modules", async () => {
            let moduleData = (await stGetter.getModulesByType(TMKEY))[0];
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
            _maxNonAccreditedInvestors.push(new BN(0)); // 0 = unlimited
            _wallet.push(WALLET);
            _treasuryWallet.push(TREASURYWALLET);

            let config = [
                _startTime[stoId],
                _endTime[stoId],
                _cap[stoId],
                _rate[stoId],
                _minimumInvestment[stoId],
                _nonAccreditedLimit[stoId],
                _maxNonAccreditedInvestors[stoId],
                _wallet[stoId],
                _treasuryWallet[stoId]
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
                await I_POLYCappedSTO_Array[stoId].treasuryWallet.call(),
                _treasuryWallet[stoId],
                "Incorrect _treasuryWallet in config"
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
                _treasuryWallet[stoId]
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
                _treasuryWallet[stoId]
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
            _maxNonAccreditedInvestors.push(new BN(4))
            _wallet.push(WALLET);
            _treasuryWallet.push(address_zero);

            let config = [
                _startTime[stoId],
                _endTime[stoId],
                _cap[stoId],
                _rate[stoId],
                _minimumInvestment[stoId],
                _nonAccreditedLimit[stoId],
                _maxNonAccreditedInvestors[stoId],
                _wallet[stoId],
                _treasuryWallet[stoId]
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
                await I_POLYCappedSTO_Array[stoId].treasuryWallet.call(),
                _treasuryWallet[stoId],
                "Incorrect _treasuryWallet in config"
            );
            assert.equal((await I_POLYCappedSTO_Array[stoId].getPermissions()).length, new BN(0), "Incorrect number of permissions");
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
                _treasuryWallet[stoId]
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
                _treasuryWallet[stoId]
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
                _treasuryWallet[stoId]
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
                _treasuryWallet[stoId]
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
                _treasuryWallet[stoId]
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
                _treasuryWallet[stoId],
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

        // WALLET ADDRESS //
        it("Should successfully Modify Wallet Addresses before startTime -- fail because of bad owner", async () => {
            let stoId = 0;

            await catchRevert(I_POLYCappedSTO_Array[stoId].modifyWalletAddress(
                "0x0000000000000000000000000400000000000000",
                { from: POLYMATH }
            ));
        });

        it("Should successfully Modify Wallet Addresses before startTime", async () => {
            let stoId = 0;
            let snapId = await takeSnapshot();

            await I_POLYCappedSTO_Array[stoId].modifyWalletAddress(
                "0x0000000000000000000000000400000000000000",
                { from: ISSUER }
            );
            assert.equal(
                await I_POLYCappedSTO_Array[stoId].wallet.call(),
                "0x0000000000000000000000000400000000000000",
                "STO Configuration doesn't set as expected"
            );
            await revertToSnapshot(snapId);
        });

        it("Should successfully Modify Wallet Addresses after startTime", async () => {
            let stoId = 0;
            let snapId = await takeSnapshot();

            // Advance time to after STO start
            await increaseTime(duration.days(3));
            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), true, "STO is not Open");

            await I_POLYCappedSTO_Array[stoId].modifyWalletAddress(
                "0x0000000000000000000000000600000000000000",
                { from: ISSUER }
            );
            assert.equal(
                await I_POLYCappedSTO_Array[stoId].wallet.call(),
                "0x0000000000000000000000000600000000000000",
                "STO Configuration doesn't set as expected"
            );
            await revertToSnapshot(snapId);
        });

        // TREASURY ADDRESS //
        it("Should successfully modify the treasury wallet address -- failed because of bad owner", async() => {
            await catchRevert(
                I_POLYCappedSTO_Array[0].modifyTreasuryWallet(ISSUER, {from: NONACCREDITED1})
            );
        });

        it("Should successfully modify the treasury wallet of the multiple STOs", async() => {
            let snapId = await takeSnapshot();
            let stoId = 0;
            await I_POLYCappedSTO_Array[stoId].modifyTreasuryWallet(address_zero, {from: ISSUER});
            assert.equal(
                await I_POLYCappedSTO_Array[stoId].treasuryWallet.call(),
                address_zero,
                "Incorrect treasuryWallet"
            );

            stoId = 1;
            await I_POLYCappedSTO_Array[stoId].modifyTreasuryWallet(TREASURYWALLET, {from: ISSUER});
            assert.equal(
                await I_POLYCappedSTO_Array[stoId].treasuryWallet.call(),
                TREASURYWALLET,
                "Incorrect treasuryWallet"
            );
            await revertToSnapshot(snapId);
        });

        it("Should successfully modify the treasury wallet after startTime", async () => {
            let stoId = 0;
            let snapId = await takeSnapshot();

            // Advance time to after STO start
            await increaseTime(duration.days(3));
            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), true, "STO is not Open");

            await I_POLYCappedSTO_Array[stoId].modifyTreasuryWallet(address_zero, {from: ISSUER});
            assert.equal(
                await I_POLYCappedSTO_Array[stoId].treasuryWallet.call(),
                address_zero,
                "Incorrect treasuryWallet"
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
            assert.equal(await I_POLYCappedSTO_Array[0].allowBeneficialInvestments(), true, "allowBeneficialInvestments should be true");
        });

        it("Should allow non-matching beneficiary -- failed because it is already active", async () => {
            await catchRevert(I_POLYCappedSTO_Array[0].changeAllowBeneficialInvestments(true, { from: ISSUER }));
            await revertToSnapshot(snapId);
            assert.equal(await I_POLYCappedSTO_Array[0].allowBeneficialInvestments(), false, "allowBeneficialInvestments should be false");
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

            await I_GeneralTransferManager.modifyKYCData(ACCREDITED1, fromTime, toTime, expiryTime, { from: ISSUER });
            await I_GeneralTransferManager.modifyKYCData(NONACCREDITED1, fromTime, toTime, expiryTime, { from: ISSUER });
            // Set as accredited
            await I_GeneralTransferManager.modifyInvestorFlag(ACCREDITED1, 0, true, { from: ISSUER }); //set as Accredited

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

        it("Should fail if not whitelisted or canNotBuyFromSTO Flag is true", async () => {
            let stoId = 0;
            let snapId = await takeSnapshot();

            // Advance time to after STO start
            await increaseTime(duration.days(3));
            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), true, "STO is not Open");

            // Whitelist only Accredited1 and nonaccredited1 with canNotBuyFromSTO = true
            let fromTime = await latestTime();
            let toTime = await latestTime() + duration.days(15);
            let expiryTime = toTime + duration.days(100);

            await I_GeneralTransferManager.modifyKYCData(ACCREDITED1, fromTime, toTime, expiryTime, { from: ISSUER });
            await I_GeneralTransferManager.modifyKYCData(NONACCREDITED1, fromTime, toTime, expiryTime, { from: ISSUER });

            await I_GeneralTransferManager.modifyInvestorFlag(ACCREDITED1, 1, true, { from: ISSUER }); //set canNotbuyfromSTO flag
            await I_GeneralTransferManager.modifyInvestorFlag(NONACCREDITED1, 1, true, { from: ISSUER }); //set canNotbuyfromSTO flag

            // Set as accredited
            await I_GeneralTransferManager.modifyInvestorFlag(ACCREDITED1, 0, true, { from: ISSUER }); //set as Accredited
            await I_GeneralTransferManager.modifyInvestorFlag(ACCREDITED2, 0, true, { from: ISSUER }); //set as Accredited (not whitelisted)

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

            await I_GeneralTransferManager.modifyKYCData(ACCREDITED1, fromTime, toTime, expiryTime, { from: ISSUER });
            await I_GeneralTransferManager.modifyKYCData(NONACCREDITED1, fromTime, toTime, expiryTime, { from: ISSUER });

            // Advance time to after STO start
            await increaseTime(duration.days(3));
            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), true, "STO is not Open");

            // Set as accredited
            await I_GeneralTransferManager.modifyInvestorFlag(ACCREDITED1, 0, true, { from: ISSUER }); //set as Accredited

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

            await I_GeneralTransferManager.modifyKYCData(ACCREDITED1, fromTime, toTime, expiryTime, { from: ISSUER });
            await I_GeneralTransferManager.modifyKYCData(NONACCREDITED1, fromTime, toTime, expiryTime, { from: ISSUER });

            // Advance time to after STO start
            await increaseTime(duration.days(3));
            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), true, "STO is not Open");

            // Set as accredited
            await I_GeneralTransferManager.modifyInvestorFlag(ACCREDITED1, 0, true, { from: ISSUER }); //set as Accredited

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

            await I_GeneralTransferManager.modifyKYCData(ACCREDITED1, fromTime, toTime, expiryTime, { from: ISSUER });
            await I_GeneralTransferManager.modifyKYCData(NONACCREDITED1, fromTime, toTime, expiryTime, { from: ISSUER });

            // Advance time to after STO end
            await increaseTime(duration.days(120));

            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), false, "STO is Open");

            // Set as accredited
            await I_GeneralTransferManager.modifyInvestorFlag(ACCREDITED1, 0, true, { from: ISSUER }); //set as Accredited

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

            await I_GeneralTransferManager.modifyKYCData(ACCREDITED1, fromTime, toTime, expiryTime, { from: ISSUER });
            await I_GeneralTransferManager.modifyKYCData(NONACCREDITED1, fromTime, toTime, expiryTime, { from: ISSUER });
            await I_GeneralTransferManager.modifyKYCData(TREASURYWALLET, fromTime, toTime, expiryTime, { from: ISSUER });

            // Advance time to after STO start
            await increaseTime(duration.days(3));
            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), true, "STO is not Open");

            // Set as accredited
            await I_GeneralTransferManager.modifyInvestorFlag(ACCREDITED1, 0, true, { from: ISSUER }); //set as Accredited

            // Finalize STO
            await I_POLYCappedSTO_Array[stoId].finalize(false, { from: ISSUER });
            assert.equal(await I_POLYCappedSTO_Array[stoId].isFinalized.call(), true, "STO has not been finalized");
            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), false, "STO is Open");

            // Attempt to call function again with minting unsold tokens - should fail as already finalized
            await catchRevert(I_POLYCappedSTO_Array[stoId].finalize(true, { from: ISSUER }));

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

            await I_GeneralTransferManager.modifyKYCData(ACCREDITED1, fromTime, toTime, expiryTime, { from: ISSUER });
            await I_GeneralTransferManager.modifyKYCData(NONACCREDITED1, fromTime, toTime, expiryTime, { from: ISSUER });

            // Advance time to after STO start
            await increaseTime(duration.days(3));
            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), true, "STO is not Open");

            // Set as accredited
            await I_GeneralTransferManager.modifyInvestorFlag(ACCREDITED1, 0, true, { from: ISSUER }); //set as Accredited

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

            await I_GeneralTransferManager.modifyKYCData(ACCREDITED1, fromTime, toTime, expiryTime, { from: ISSUER });
            await I_GeneralTransferManager.modifyKYCData(NONACCREDITED1, fromTime, toTime, expiryTime, { from: ISSUER });

            // Advance time to after STO start
            await increaseTime(duration.days(3));
            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), true, "STO is not Open");

            // Set as accredited
            await I_GeneralTransferManager.modifyInvestorFlag(ACCREDITED1, 0, true, { from: ISSUER }); //set as Accredited

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

            await I_GeneralTransferManager.modifyKYCData(ACCREDITED1, fromTime, toTime, expiryTime, { from: ISSUER });
            await I_GeneralTransferManager.modifyKYCData(NONACCREDITED1, fromTime, toTime, expiryTime, { from: ISSUER });

            // Advance time to after STO start
            await increaseTime(duration.days(3));
            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), true, "STO is not Open");

            // Set as accredited
            await I_GeneralTransferManager.modifyInvestorFlag(ACCREDITED1, 0, true, { from: ISSUER }); //set as Accredited

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

            await I_GeneralTransferManager.modifyKYCData(ACCREDITED1, fromTime, toTime, expiryTime, { from: ISSUER });
            await I_GeneralTransferManager.modifyKYCData(NONACCREDITED1, fromTime, toTime, expiryTime, { from: ISSUER });

            // Advance time to after STO start
            await increaseTime(duration.days(3));
            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), true, "STO is not Open");
            assert.equal(await I_POLYCappedSTO_Array[stoId].allowBeneficialInvestments(), false, "allowBeneficialInvestments should be false");

            // Set as accredited
            await I_GeneralTransferManager.modifyInvestorFlag(ACCREDITED1, 0, true, { from: ISSUER }); //set as Accredited

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
            assert.equal(await I_POLYCappedSTO_Array[stoId].allowBeneficialInvestments(), true, "allowBeneficialInvestments should be true");

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
            assert.equal(await I_POLYCappedSTO_Array[stoId].allowBeneficialInvestments(), true, "allowBeneficialInvestments should be true");

            // Prep for investments
            let investment_POLY = new BN(web3.utils.toWei("10000", "ether")); // Invest 10000 POLY
            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_POLYCappedSTO_Array[stoId].address, investment_POLY, { from: ACCREDITED1 });

            // Buy tokens
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

            await I_GeneralTransferManager.modifyKYCData(ACCREDITED1, fromTime, toTime, expiryTime, { from: ISSUER });
            await I_GeneralTransferManager.modifyKYCData(NONACCREDITED1, fromTime, toTime, expiryTime, { from: ISSUER });
            await I_GeneralTransferManager.modifyKYCData(NONACCREDITED2, fromTime, toTime, expiryTime, { from: ISSUER });

            // Set as accredited
            await I_GeneralTransferManager.modifyInvestorFlag(ACCREDITED1, 0, true, { from: ISSUER }); //set as Accredited

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

            await I_GeneralTransferManager.modifyKYCData(ACCREDITED1, fromTime, toTime, expiryTime, { from: ISSUER });
            await I_GeneralTransferManager.modifyKYCData(ACCREDITED2, fromTime, toTime, expiryTime, { from: ISSUER });
            await I_GeneralTransferManager.modifyKYCData(NONACCREDITED1, fromTime, toTime, expiryTime, { from: ISSUER });
            await I_GeneralTransferManager.modifyKYCData(NONACCREDITED2, fromTime, toTime, expiryTime, { from: ISSUER });
            await I_GeneralTransferManager.modifyKYCData(INVESTOR1, fromTime, toTime, expiryTime, { from: ISSUER });
            await I_GeneralTransferManager.modifyKYCData(INVESTOR2, fromTime, toTime, expiryTime, { from: ISSUER });
            await I_GeneralTransferManager.modifyKYCData(INVESTOR3, fromTime, toTime, expiryTime, { from: ISSUER });

            // Set as accredited
            await I_GeneralTransferManager.modifyInvestorFlag(ACCREDITED1, 0, true, { from: ISSUER }); //set as Accredited
            await I_GeneralTransferManager.modifyInvestorFlag(ACCREDITED2, 0, true, { from: ISSUER }); //set as Accredited

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

            await I_GeneralTransferManager.modifyKYCData(ACCREDITED1, fromTime, toTime, expiryTime, { from: ISSUER });
            await I_GeneralTransferManager.modifyKYCData(ACCREDITED2, fromTime, toTime, expiryTime, { from: ISSUER });
            await I_GeneralTransferManager.modifyKYCData(NONACCREDITED1, fromTime, toTime, expiryTime, { from: ISSUER });

            // Set as accredited
            await I_GeneralTransferManager.modifyInvestorFlag(ACCREDITED1, 0, true, { from: ISSUER }); //set as Accredited
            await I_GeneralTransferManager.modifyInvestorFlag(ACCREDITED2, 0, true, { from: ISSUER }); //set as Accredited

            // Advance time to after STO start
            await increaseTime(duration.days(3));
            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), true, "STO is not Open");
            assert.equal(await I_POLYCappedSTO_Array[stoId].capReached(), false, "STO cap already reached");

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
            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), false, "STO is Open");
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

            await I_GeneralTransferManager.modifyKYCData(ACCREDITED1, fromTime, toTime, expiryTime, { from: ISSUER });
            await I_GeneralTransferManager.modifyKYCData(NONACCREDITED1, fromTime, toTime, expiryTime, { from: ISSUER });

            // Set as accredited
            await I_GeneralTransferManager.modifyInvestorFlag(ACCREDITED1, 0, true, { from: ISSUER }); //set as Accredited
            await I_GeneralTransferManager.modifyInvestorFlag(ACCREDITED2, 0, true, { from: ISSUER }); //set as Accredited

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

    describe("Prep STO", async () => {
        it("Should jump forward to after STO start", async () => {
            let stoId = 0;
            await increaseTime(duration.days(3));
            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), true, "STO is not Open");
        });

        it("Should whitelist ACCREDITED1 and NONACCREDITED1", async () => {
            let stoId = 0;

            let fromTime = await latestTime();
            let toTime = await latestTime() + duration.days(15);
            let expiryTime = toTime + duration.days(100);

            const tx1 = await I_GeneralTransferManager.modifyKYCData(NONACCREDITED1, fromTime, toTime, expiryTime, {from: ISSUER});
            assert.equal(tx1.logs[0].args._investor, NONACCREDITED1, "Failed in adding the investor in whitelist");
            const tx2 = await I_GeneralTransferManager.modifyKYCData(ACCREDITED1, fromTime, toTime, expiryTime, {from: ISSUER});
            assert.equal(tx2.logs[0].args._investor, ACCREDITED1, "Failed in adding the investor in whitelist");
            await I_GeneralTransferManager.modifyInvestorFlag(ACCREDITED1, 0, true, { from: ISSUER });
            assert.equal(tx2.logs[0].args._investor, ACCREDITED1, "Failed in adding the investor in whitelist");
        });

        it("Should successfully get investor accredited status for the STOs", async () => {
             let stoId = 0;
             let totalStatus = await I_POLYCappedSTO_Array[stoId].getAccreditedData.call();
             console.log(totalStatus);
             assert.equal(totalStatus[0][0], NONACCREDITED1, "Account match");
             assert.equal(totalStatus[0][1], ACCREDITED1, "Account match");
             assert.equal(totalStatus[1][0], false, "Account match");
             assert.equal(totalStatus[1][1], true, "Account match");
             assert.equal(totalStatus[2][0].toNumber(), 0, "override match");
             assert.equal(totalStatus[2][1].toNumber(), 0, "override match");
         });
    });

    //////////////////
    // BUYING TESTS //
    //////////////////
    describe("Buy Tokens", async () => {
        it("Should successfully buy using buyWithPOLY for NONACCREDITED1", async () => {
            let stoId = 0;

            let investment_POLY = new BN(web3.utils.toWei("10000", "ether")); // Invest 10000 POLY
            let rate = await I_POLYCappedSTO_Array[stoId].rate.call();
            let expectedTokens = investment_POLY.mul(rate).div(e18);
            let investment_USD = investment_POLY.mul(await I_POLYOracle.getPrice.call()).div(e18);
            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_POLYCappedSTO_Array[stoId].address, investment_POLY, { from: NONACCREDITED1 });

            // Verify the prePurchaseCheck function
            let prePurchaseCheck = await I_POLYCappedSTO_Array[stoId].prePurchaseChecks(NONACCREDITED1, investment_POLY);
            let calculatedTokens = prePurchaseCheck.tokens;
            let calculatedSpentValue = prePurchaseCheck.spentValue;
            assert.equal(calculatedTokens.toString(), expectedTokens.toString(), "Token amounts don't match");
            assert.equal(calculatedSpentValue, investment_POLY.toString(), "Spent amounts don't match");

            // Additional checks on getters
            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let init_InvestorETHBal = new BN(await web3.eth.getBalance(NONACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let init_STOTokenSold = await I_POLYCappedSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BN(await web3.eth.getBalance(I_POLYCappedSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_POLYCappedSTO_Array[stoId].address);
            let init_RaisedETH = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(POLY);
            let init_RaisedSC = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(SC);
            let init_RaisedUSD = await I_POLYCappedSTO_Array[stoId].fundsRaisedUSD.call();
            let init_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);
            let init_InvestorCount = await I_POLYCappedSTO_Array[stoId].investorCount.call();
            let init_nonAccreditedCount = await I_POLYCappedSTO_Array[stoId].nonAccreditedCount.call();
            let init_investorInvested = await I_POLYCappedSTO_Array[stoId].investorInvested(NONACCREDITED1);
            let init_investorInvestedUSD = await I_POLYCappedSTO_Array[stoId].investorInvestedUSD(NONACCREDITED1);

            assert.equal(await I_POLYCappedSTO_Array[stoId].investorInvested(NONACCREDITED1), 0, "Investor has already invested");
            assert.equal(await I_POLYCappedSTO_Array[stoId].investorInvestedUSD(NONACCREDITED1), 0, "Investor has already invested");

            // Buy With POLY
            let tx1 = await I_POLYCappedSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, {
                from: NONACCREDITED1,
                gasPrice: GAS_PRICE
            });
            let gasCost2 = new BN(GAS_PRICE).mul(new BN(tx1.receipt.gasUsed));
            console.log("          Gas buyWithPOLY: ".grey + new BN(tx1.receipt.gasUsed).toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let final_InvestorETHBal = new BN(await web3.eth.getBalance(NONACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let final_STOTokenSold = await I_POLYCappedSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BN(await web3.eth.getBalance(I_POLYCappedSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_POLYCappedSTO_Array[stoId].address);
            let final_RaisedETH = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(POLY);
            let final_RaisedSC = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(SC);
            let final_RaisedUSD = await I_POLYCappedSTO_Array[stoId].fundsRaisedUSD.call();
            let final_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);
            let final_InvestorCount = await I_POLYCappedSTO_Array[stoId].investorCount.call();
            let final_nonAccreditedCount = await I_POLYCappedSTO_Array[stoId].nonAccreditedCount.call();
            let final_investorInvested = await I_POLYCappedSTO_Array[stoId].investorInvested(NONACCREDITED1);
            let final_investorInvestedUSD = await I_POLYCappedSTO_Array[stoId].investorInvestedUSD(NONACCREDITED1);

            assert.equal(
                final_TokenSupply.toString(),
                init_TokenSupply.add(expectedTokens).toString(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toString(),
                init_InvestorTokenBal.add(expectedTokens).toString(),
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
                init_STOTokenSold.add(expectedTokens).toString(),
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
            assert.equal(
                final_RaisedUSD.toString(),
                init_RaisedUSD.add(investment_USD).toString(),
                "Raised USD did not increase"
            );
            assert.equal(final_RaisedSC.toString(), init_RaisedSC.toString(), "Raised POLY not changed as expected");
            assert.equal(final_WalletETHBal.toString(), init_WalletETHBal.toString(), "Wallet ETH Balance not changed as expected");
            assert.equal(
                final_WalletPOLYBal.toString(),
                init_WalletPOLYBal.add(investment_POLY).toString(),
                "Wallet POLY Balance not changed as expected"
            );
            assert.equal(
                final_InvestorCount.toString(),
                init_InvestorCount.add(new BN(1)).toString(),
                "Investor count did not increase"
            );
            assert.equal(
                final_nonAccreditedCount.toString(),
                init_nonAccreditedCount.add(new BN(1)).toString(),
                "Non-accredited Investor count did not increase"
            );
            assert.equal(
                final_investorInvested.toString(),
                init_investorInvested.add(investment_POLY).toString(),
                "Investor Investment did not increase"
            );
            assert.equal(
                final_investorInvestedUSD.toString(),
                init_investorInvestedUSD.add(investment_USD).toString(),
                "Investor Investment USD did not increase"
            );
        });

        it("Should successfully buy using buyWithPOLY for ACCREDITED1", async () => {
            let stoId = 0;

            let investment_POLY = new BN(web3.utils.toWei("10000", "ether")); // Invest 10000 POLY
            let rate = await I_POLYCappedSTO_Array[stoId].rate.call();
            let expectedTokens = investment_POLY.mul(rate).div(e18);
            let investment_USD = investment_POLY.mul(await I_POLYOracle.getPrice.call()).div(e18);
            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_POLYCappedSTO_Array[stoId].address, investment_POLY, { from: ACCREDITED1 });

            // Verify the prePurchaseCheck function
            let prePurchaseCheck = await I_POLYCappedSTO_Array[stoId].prePurchaseChecks(ACCREDITED1, investment_POLY);
            let calculatedTokens = prePurchaseCheck.tokens;
            let calculatedSpentValue = prePurchaseCheck.spentValue;
            assert.equal(calculatedTokens.toString(), expectedTokens.toString(), "Token amounts don't match");
            assert.equal(calculatedSpentValue, investment_POLY.toString(), "Spent amounts don't match");

            // Additional checks on getters
            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let init_InvestorETHBal = new BN(await web3.eth.getBalance(ACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let init_STOTokenSold = await I_POLYCappedSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BN(await web3.eth.getBalance(I_POLYCappedSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_POLYCappedSTO_Array[stoId].address);
            let init_RaisedETH = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(POLY);
            let init_RaisedSC = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(SC);
            let init_RaisedUSD = await I_POLYCappedSTO_Array[stoId].fundsRaisedUSD.call();
            let init_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);
            let init_InvestorCount = await I_POLYCappedSTO_Array[stoId].investorCount.call();
            let init_nonAccreditedCount = await I_POLYCappedSTO_Array[stoId].nonAccreditedCount.call();
            let init_investorInvested = await I_POLYCappedSTO_Array[stoId].investorInvested(ACCREDITED1);
            let init_investorInvestedUSD = await I_POLYCappedSTO_Array[stoId].investorInvestedUSD(ACCREDITED1);

            assert.equal(await I_POLYCappedSTO_Array[stoId].investorInvested(ACCREDITED1), 0, "Investor has already invested");
            assert.equal(await I_POLYCappedSTO_Array[stoId].investorInvestedUSD(ACCREDITED1), 0, "Investor has already invested");

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
            let final_RaisedSC = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(SC);
            let final_RaisedUSD = await I_POLYCappedSTO_Array[stoId].fundsRaisedUSD.call();
            let final_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);
            let final_InvestorCount = await I_POLYCappedSTO_Array[stoId].investorCount.call();
            let final_nonAccreditedCount = await I_POLYCappedSTO_Array[stoId].nonAccreditedCount.call();
            let final_investorInvested = await I_POLYCappedSTO_Array[stoId].investorInvested(ACCREDITED1);
            let final_investorInvestedUSD = await I_POLYCappedSTO_Array[stoId].investorInvestedUSD(ACCREDITED1);

            assert.equal(
                final_TokenSupply.toString(),
                init_TokenSupply.add(expectedTokens).toString(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toString(),
                init_InvestorTokenBal.add(expectedTokens).toString(),
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
                init_STOTokenSold.add(expectedTokens).toString(),
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
            assert.equal(
                final_RaisedUSD.toString(),
                init_RaisedUSD.add(investment_USD).toString(),
                "Raised USD did not increase"
            );
            assert.equal(final_RaisedSC.toString(), init_RaisedSC.toString(), "Raised POLY not changed as expected");
            assert.equal(final_WalletETHBal.toString(), init_WalletETHBal.toString(), "Wallet ETH Balance not changed as expected");
            assert.equal(
                final_WalletPOLYBal.toString(),
                init_WalletPOLYBal.add(investment_POLY).toString(),
                "Wallet POLY Balance not changed as expected"
            );
            assert.equal(
                final_InvestorCount.toString(),
                init_InvestorCount.add(new BN(1)).toString(),
                "Investor count did not increase"
            );
            assert.equal(
                final_nonAccreditedCount.toString(),
                init_nonAccreditedCount.toString(),
                "non-accredited Investor count increased"
            );
            assert.equal(
                final_investorInvested.toString(),
                init_investorInvested.add(investment_POLY).toString(),
                "Investor Investment did not increase"
            );
            assert.equal(
                final_investorInvestedUSD.toString(),
                init_investorInvestedUSD.add(investment_USD).toString(),
                "Investor Investment USD did not increase"
            );
        });

        it("Should successfully modify NONACCREDITED cap for NONACCREDITED1 and NONACCREDITED2 -- failed array length mismatch", async () => {
            let stoId = 0;

            await catchRevert(I_POLYCappedSTO_Array[stoId].changeNonAccreditedLimit([NONACCREDITED1, NONACCREDITED2], [_nonAccreditedLimit[stoId].mul(new BN(2))], {
                from: ISSUER
            }));
        });

        it("Should successfully modify NONACCREDITED cap for NONACCREDITED1", async () => {
            let stoId = 0;
            console.log("          Current investment: ".grey + (await I_POLYCappedSTO_Array[stoId].investorInvested.call(NONACCREDITED1)).toString().grey);

            await I_POLYCappedSTO_Array[stoId].changeNonAccreditedLimit([NONACCREDITED1], [_nonAccreditedLimit[stoId].mul(new BN(2))], {
                from: ISSUER
            });
            let investorLimit = await I_POLYCappedSTO_Array[stoId].nonAccreditedLimitOverride.call(NONACCREDITED1);
            console.log("         Current limit: ".grey + investorLimit.toString().grey);
            let totalStatus = await I_POLYCappedSTO_Array[stoId].getAccreditedData.call();

            assert.equal(totalStatus[0][0], NONACCREDITED1, "Account match");
            assert.equal(totalStatus[0][1], ACCREDITED1, "Account match");
            assert.equal(totalStatus[1][0], false, "Account match");
            assert.equal(totalStatus[1][1], true, "Account match");
            assert.equal(totalStatus[2][0].toString(), _nonAccreditedLimit[stoId].mul(new BN(2)), "override match");
            assert.equal(totalStatus[2][1].toString(), 0, "override match");
        });

        it("Should successfully buy a partial amount and refund balance when reaching NONACCREDITED limit", async () => {
            let stoId = 0;

            let investorLimit = await I_POLYCappedSTO_Array[stoId].nonAccreditedLimitOverride.call(NONACCREDITED1);
            let investedPOLY = await I_POLYCappedSTO_Array[stoId].investorInvested.call(NONACCREDITED1);
            let rate = await I_POLYCappedSTO_Array[stoId].rate.call();
            let surplus_POLY = new BN (web3.utils.toWei("1234", "ether")); // Amount above the limit to invest
            let surplus_USD = surplus_POLY.mul(await I_POLYOracle.getPrice.call()).div(e18);

            let investment_POLY = investorLimit.sub(investedPOLY).add(surplus_POLY); // Calculate investment amount
            let investment_USD = investment_POLY.mul(await I_POLYOracle.getPrice.call()).div(e18);
            let expectedTokens = (investment_POLY.sub(surplus_POLY)).mul(rate).div(e18); // Number of tokens that should with the limit applied

            // Verify the prePurchaseCheck function
            let prePurchaseCheck = await I_POLYCappedSTO_Array[stoId].prePurchaseChecks(NONACCREDITED1, investment_POLY);
            let calculatedTokens = prePurchaseCheck.tokens;
            let calculatedSpentValue = prePurchaseCheck.spentValue;
            assert.equal(calculatedTokens.toString(), expectedTokens.toString(), "Token amounts don't match");
            assert.equal(calculatedSpentValue, investment_POLY.sub(surplus_POLY).toString(), "Spent amounts don't match");

            console.log("          Investment: ".grey + investment_POLY.toString().grey + " POLY".grey);
            console.log("          Expected surplus in POLY: ".grey + surplus_POLY.toString().grey + " POLY".grey);

            await I_PolyToken.getTokens(investment_POLY, NONACCREDITED1);
            await I_PolyToken.approve(I_POLYCappedSTO_Array[stoId].address, investment_POLY, { from: NONACCREDITED1 });

            // Additional checks on getters
            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let init_InvestorETHBal = new BN(await web3.eth.getBalance(NONACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let init_STOTokenSold = await I_POLYCappedSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BN(await web3.eth.getBalance(I_POLYCappedSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_POLYCappedSTO_Array[stoId].address);
            let init_RaisedETH = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(POLY);
            let init_RaisedSC = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(SC);
            let init_RaisedUSD = await I_POLYCappedSTO_Array[stoId].fundsRaisedUSD.call();
            let init_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);
            let init_InvestorCount = await I_POLYCappedSTO_Array[stoId].investorCount.call();
            let init_nonAccreditedCount = await I_POLYCappedSTO_Array[stoId].nonAccreditedCount.call();
            let init_investorInvested = await I_POLYCappedSTO_Array[stoId].investorInvested(NONACCREDITED1);
            let init_investorInvestedUSD = await I_POLYCappedSTO_Array[stoId].investorInvestedUSD(NONACCREDITED1);

            assert.notEqual(init_investorInvested, 0, "Investor has not already invested");
            assert.notEqual(init_investorInvestedUSD, 0, "Investor has not already invested");

            // Buy With POLY
            let tx1 = await I_POLYCappedSTO_Array[stoId].buyWithPOLY(NONACCREDITED1, investment_POLY, {
                from: NONACCREDITED1,
                gasPrice: GAS_PRICE
            });
            let gasCost2 = new BN(GAS_PRICE).mul(new BN(tx1.receipt.gasUsed));
            console.log("          Gas buyWithPOLY: ".grey + new BN(tx1.receipt.gasUsed).toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(NONACCREDITED1);
            let final_InvestorETHBal = new BN(await web3.eth.getBalance(NONACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(NONACCREDITED1);
            let final_STOTokenSold = await I_POLYCappedSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BN(await web3.eth.getBalance(I_POLYCappedSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_POLYCappedSTO_Array[stoId].address);
            let final_RaisedETH = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(POLY);
            let final_RaisedSC = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(SC);
            let final_RaisedUSD = await I_POLYCappedSTO_Array[stoId].fundsRaisedUSD.call();
            let final_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);
            let final_InvestorCount = await I_POLYCappedSTO_Array[stoId].investorCount.call();
            let final_nonAccreditedCount = await I_POLYCappedSTO_Array[stoId].nonAccreditedCount.call();
            let final_investorInvested = await I_POLYCappedSTO_Array[stoId].investorInvested(NONACCREDITED1);
            let final_investorInvestedUSD = await I_POLYCappedSTO_Array[stoId].investorInvestedUSD(NONACCREDITED1);

            assert.equal(
                final_TokenSupply.toString(),
                init_TokenSupply
                    .add(expectedTokens)
                    .toString(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toString(),
                init_InvestorTokenBal
                    .add(expectedTokens)
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
                    .add(surplus_POLY)
                    .toString(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toString(),
                init_STOTokenSold
                    .add(expectedTokens)
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
                    .sub(surplus_POLY)
                    .toString(),
                "Raised POLY not changed as expected"
            );
            assert.equal(
                final_RaisedUSD.toString(),
                init_RaisedUSD
                    .add(investment_USD)
                    .sub(surplus_USD)
                    .toString(),
                "Raised USD did not increase"
            );
            assert.equal(final_WalletETHBal.toString(), init_WalletETHBal.toString(), "Wallet ETH Balance not changed as expected");
            assert.equal(
                final_WalletPOLYBal.toString(),
                init_WalletPOLYBal
                    .add(investment_POLY)
                    .sub(surplus_POLY)
                    .toString(),
                "Wallet POLY Balance not changed as expected"
            );
            assert.equal(
                final_InvestorCount.toString(),
                init_InvestorCount.toString(),
                "Investor count increased"
            );
            assert.equal(
                final_nonAccreditedCount.toString(),
                init_nonAccreditedCount.toString(),
                "non-accredited Investor count increased"
            );
            assert.equal(
                final_investorInvested.toString(),
                init_investorInvested.add(investment_POLY.sub(surplus_POLY)).toString(),
                "Investor Investment did not increase by the correct amount"
            );
            assert.equal(
                final_investorInvestedUSD.toString(),
                init_investorInvestedUSD.add(investment_USD.sub(surplus_USD)).toString(),
                "Investor Investment USD did not increase by the correct amount"
            );
        });

        it("Should successfully buy a granular amount and refund balance when buying a indivisible token with POLY", async () => {
            let stoId = 0;

            await I_SecurityToken.changeGranularity(e18, { from: ISSUER });

            let rate = await I_POLYCappedSTO_Array[stoId].rate.call();
            let investment_POLY = new BN(1050).mul(e16); // Invest 10.5 POLY
            let investment_USD = investment_POLY.mul(await I_POLYOracle.getPrice.call()).div(e18);
            let surplus_POLY = new BN(50).mul(e16);
            let surplus_USD = surplus_POLY.mul(await I_POLYOracle.getPrice.call()).div(e18);
            let surplus_Tokens = surplus_POLY.mul(rate).div(e18);
            let expectedTokens = (investment_POLY.mul(rate).div(e18)).sub(surplus_Tokens);

            console.log("          Investment: ".grey + investment_POLY.toString().grey + " POLY".grey);
            console.log("          Expected surplus: ".grey + surplus_POLY.toString().grey + " POLY".grey);

            // Verify the prePurchaseCheck function
            let prePurchaseCheck = await I_POLYCappedSTO_Array[stoId].prePurchaseChecks(ACCREDITED1, investment_POLY);
            let calculatedTokens = prePurchaseCheck.tokens;
            let calculatedSpentValue = prePurchaseCheck.spentValue;
            assert.equal(calculatedTokens.toString(), expectedTokens.toString(), "Token amounts don't match");
            assert.equal(calculatedSpentValue, investment_POLY.sub(surplus_POLY).toString(), "Spent amounts don't match");

            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_POLYCappedSTO_Array[stoId].address, investment_POLY, { from: ACCREDITED1 });

            // Additional checks on getters
            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let init_InvestorETHBal = new BN(await web3.eth.getBalance(ACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let init_STOTokenSold = await I_POLYCappedSTO_Array[stoId].getTokensSold();
            let init_STOETHBal = new BN(await web3.eth.getBalance(I_POLYCappedSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_POLYCappedSTO_Array[stoId].address);
            let init_RaisedETH = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(POLY);
            let init_RaisedSC = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(SC);
            let init_RaisedUSD = await I_POLYCappedSTO_Array[stoId].fundsRaisedUSD.call();
            let init_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);
            let init_InvestorCount = await I_POLYCappedSTO_Array[stoId].investorCount.call();
            let init_nonAccreditedCount = await I_POLYCappedSTO_Array[stoId].nonAccreditedCount.call();
            let init_investorInvested = await I_POLYCappedSTO_Array[stoId].investorInvested(ACCREDITED1);
            let init_investorInvestedUSD = await I_POLYCappedSTO_Array[stoId].investorInvestedUSD(ACCREDITED1);

            console.log("          Old total investment: ".grey + init_investorInvested.toString().grey + " POLY".grey);

            assert.notEqual(init_investorInvested, 0, "Investor has not already invested");
            assert.notEqual(init_investorInvestedUSD, 0, "Investor has not already invested");

            // Buy With POLY
            let tx1 = await I_POLYCappedSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, {
                from: ACCREDITED1,
                gasPrice: GAS_PRICE
            });
            let gasCost2 = new BN(GAS_PRICE).mul(new BN(tx1.receipt.gasUsed));
            console.log("          Gas buyWithPOLY: ".grey + new BN(tx1.receipt.gasUsed).toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let final_InvestorETHBal = new BN(await web3.eth.getBalance(ACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let final_STOTokenSold = await I_POLYCappedSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BN(await web3.eth.getBalance(I_POLYCappedSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_POLYCappedSTO_Array[stoId].address);
            let final_RaisedETH = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(POLY);
            let final_RaisedSC = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(SC);
            let final_RaisedUSD = await I_POLYCappedSTO_Array[stoId].fundsRaisedUSD.call();
            let final_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);
            let final_InvestorCount = await I_POLYCappedSTO_Array[stoId].investorCount.call();
            let final_nonAccreditedCount = await I_POLYCappedSTO_Array[stoId].nonAccreditedCount.call();
            let final_investorInvested = await I_POLYCappedSTO_Array[stoId].investorInvested(ACCREDITED1);
            let final_investorInvestedUSD = await I_POLYCappedSTO_Array[stoId].investorInvestedUSD(ACCREDITED1);

            console.log("          New total investment: ".grey + final_investorInvestedUSD.toString().grey + " POLY".grey);

            assert.equal(
                final_TokenSupply.toString(),
                init_TokenSupply
                    .add(expectedTokens)
                    .toString(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toString(),
                init_InvestorTokenBal
                    .add(expectedTokens)
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
                    .add(surplus_POLY)
                    .toString(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toString(),
                init_STOTokenSold
                    .add(expectedTokens)
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
                    .sub(surplus_POLY)
                    .toString(),
                "Raised POLY not changed as expected"
            );
            assert.equal(
                final_RaisedUSD.toString(),
                init_RaisedUSD
                    .add(investment_USD)
                    .sub(surplus_USD)
                    .toString(),
                "Raised USD did not increase"
            );
            assert.equal(final_WalletETHBal.toString(), init_WalletETHBal.toString(), "Wallet ETH Balance not changed as expected");
            assert.equal(
                final_WalletPOLYBal.toString(),
                init_WalletPOLYBal
                    .add(investment_POLY)
                    .sub(surplus_POLY)
                    .toString(),
                "Wallet POLY Balance not changed as expected"
            );
            assert.equal(
                final_InvestorCount.toString(),
                init_InvestorCount.toString(),
                "Investor count increased"
            );
            assert.equal(
                final_nonAccreditedCount.toString(),
                init_nonAccreditedCount.toString(),
                "non-accredited Investor count increased"
            );
            assert.equal(
                final_investorInvested.toString(),
                init_investorInvested.add(investment_POLY.sub(surplus_POLY)).toString(),
                "Investor Investment did not increase by the correct amount"
            );
            assert.equal(
                final_investorInvestedUSD.toString(),
                init_investorInvestedUSD.add(investment_USD.sub(surplus_USD)).toString(),
                "Investor Investment USD did not increase by the correct amount"
            );

            await I_SecurityToken.changeGranularity(1, { from: ISSUER });
        });

        it("Should fail due to calculated number of tokens being less than the granularity when buying a indivisible token", async () => {
            let stoId = 0;

            await I_SecurityToken.changeGranularity(e18, { from: ISSUER });
            // check minimum investment has already been met
            let investorInvested = await I_POLYCappedSTO_Array[stoId].investorInvested(ACCREDITED1);
            let minimumInvestment = await I_POLYCappedSTO_Array[stoId].minimumInvestment.call();
            let minInvested = investorInvested.gte(minimumInvestment);
            assert.equal(minInvested, true, "minimum investment not met")

            let investment_POLY = new BN(50).mul(e16); // Invest 0.5 POLY

            console.log("          Investment: ".grey + investment_POLY.toString().grey + " POLY".grey);

            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_POLYCappedSTO_Array[stoId].address, investment_POLY, { from: ACCREDITED1 });

            // Buy With POLY
            await catchRevert(I_POLYCappedSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, {
                from: ACCREDITED1,
                gasPrice: GAS_PRICE
            }));
            await I_SecurityToken.changeGranularity(1, { from: ISSUER });
        });


        it("Should fail to buy if granularity prevents buying remaining tokens when buying up to the cap", async () => {
            let stoId = 0;
            let snapId = await takeSnapshot();

            // Calculate the remaing number of tokens
            let cap = await I_POLYCappedSTO_Array[stoId].cap.call();
            let init_STOTokenSold = await I_POLYCappedSTO_Array[stoId].getTokensSold();
            let remainingTokens = cap.sub(init_STOTokenSold);

            let rate = await I_POLYCappedSTO_Array[stoId].rate.call();

            let remainingPOLY = remainingTokens.mul(e18).div(rate); // Calculate investment amount
            let investment_POLY1 = remainingPOLY.sub(new BN(50).mul(e16)); // Calculate investment amount 1
            let investment_POLY2 = new BN(10).mul(e18); // Calculate investment amount 2

            await I_PolyToken.getTokens(investment_POLY1.add(investment_POLY2), ACCREDITED1);
            await I_PolyToken.approve(I_POLYCappedSTO_Array[stoId].address, investment_POLY1.add(investment_POLY2), { from: ACCREDITED1 });

            // Buy first batch With POLY
            let tx1 = await I_POLYCappedSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY1, {
                from: ACCREDITED1,
                gasPrice: GAS_PRICE
            });
            let gasCost2 = new BN(GAS_PRICE).mul(new BN(tx1.receipt.gasUsed));
            console.log("          Gas buyWithPOLY: ".grey + new BN(tx1.receipt.gasUsed).toString().grey);

            assert.equal(await I_POLYCappedSTO_Array[stoId].capReached(), false, "STO cap has been reached");
            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), true, "STO is not Open");

            let new_STOTokenSold = await I_POLYCappedSTO_Array[stoId].getTokensSold();
            let newRemainingTokens = cap.sub(new_STOTokenSold);
            console.log("          Remaining Tokens: ".grey + newRemainingTokens.toString().grey);

            // change granularity to make indivisible
            await I_SecurityToken.changeGranularity(e18, { from: ISSUER });

            // Buy second batch With POLY (should fail due to granularity)
            await catchRevert(I_POLYCappedSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY2, {
                from: ACCREDITED1,
                gasPrice: GAS_PRICE
            }));

            assert.equal(await I_POLYCappedSTO_Array[stoId].capReached(), false, "STO cap has been reached");
            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), true, "STO is not Open");

            await revertToSnapshot(snapId);
        });

        it("Should successfully buy a partial amount and refund balance when reaching the cap", async () => {
            let stoId = 0;
            let snapId = await takeSnapshot();

            // Calculate the remaing number of tokens
            let cap = await I_POLYCappedSTO_Array[stoId].cap.call();
            let init_STOTokenSold = await I_POLYCappedSTO_Array[stoId].getTokensSold();
            let remainingTokens = cap.sub(init_STOTokenSold);
            console.log("          Cap: ".grey + cap.toString().grey);
            console.log("          Initial tokens sold: ".grey + init_STOTokenSold.toString().grey);
            console.log("          Remaining tokens: ".grey + remainingTokens.toString().grey);

            let rate = await I_POLYCappedSTO_Array[stoId].rate.call();

            let surplus_POLY = new BN (web3.utils.toWei("1234", "ether")); // Amount above the limit to invest
            let surplus_USD = surplus_POLY.mul(await I_POLYOracle.getPrice.call()).div(e18);
            let investment_POLY = (remainingTokens.mul(e18).div(rate)).add(surplus_POLY); // Calculate investment amount
            let investment_USD = investment_POLY.mul(await I_POLYOracle.getPrice.call()).div(e18);
            let expectedTokens = remainingTokens; // Number of tokens that should with the limit applied

            // Verify the prePurchaseCheck function when called directly
            let prePurchaseCheck = await I_POLYCappedSTO_Array[stoId].prePurchaseChecks(ACCREDITED1, investment_POLY);
            let calculatedTokens = prePurchaseCheck.tokens;
            let calculatedSpentValue = prePurchaseCheck.spentValue;
            assert.equal(calculatedTokens.toString(), expectedTokens.toString(), "Token amounts don't match");
            assert.equal(calculatedSpentValue, investment_POLY.sub(surplus_POLY).toString(), "Spent amounts don't match");

            await I_PolyToken.getTokens(investment_POLY, ACCREDITED1);
            await I_PolyToken.approve(I_POLYCappedSTO_Array[stoId].address, investment_POLY, { from: ACCREDITED1 });

            console.log("          Investment: ".grey + investment_POLY.toString().grey + " POLY".grey);
            console.log("          Expected surplus in POLY: ".grey + surplus_POLY.toString().grey + " POLY".grey);

            // Additional checks on getters
            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let init_InvestorETHBal = new BN(await web3.eth.getBalance(ACCREDITED1));
            let init_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let init_STOETHBal = new BN(await web3.eth.getBalance(I_POLYCappedSTO_Array[stoId].address));
            let init_STOPOLYBal = await I_PolyToken.balanceOf(I_POLYCappedSTO_Array[stoId].address);
            let init_RaisedETH = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(POLY);
            let init_RaisedSC = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(SC);
            let init_RaisedUSD = await I_POLYCappedSTO_Array[stoId].fundsRaisedUSD.call();
            let init_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let init_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);
            let init_InvestorCount = await I_POLYCappedSTO_Array[stoId].investorCount.call();
            let init_nonAccreditedCount = await I_POLYCappedSTO_Array[stoId].nonAccreditedCount.call();
            let init_investorInvested = await I_POLYCappedSTO_Array[stoId].investorInvested(ACCREDITED1);
            let init_investorInvestedUSD = await I_POLYCappedSTO_Array[stoId].investorInvestedUSD(ACCREDITED1);

            assert.notEqual(init_investorInvested, 0, "Investor has not already invested");
            assert.notEqual(init_investorInvestedUSD, 0, "Investor has not already invested");

            // Buy With POLY
            let tx1 = await I_POLYCappedSTO_Array[stoId].buyWithPOLY(ACCREDITED1, investment_POLY, {
                from: ACCREDITED1,
                gasPrice: GAS_PRICE
            });
            let gasCost2 = new BN(GAS_PRICE).mul(new BN(tx1.receipt.gasUsed));
            console.log("          Gas buyWithPOLY: ".grey + new BN(tx1.receipt.gasUsed).toString().grey);

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_InvestorTokenBal = await I_SecurityToken.balanceOf(ACCREDITED1);
            let final_InvestorETHBal = new BN(await web3.eth.getBalance(ACCREDITED1));
            let final_InvestorPOLYBal = await I_PolyToken.balanceOf(ACCREDITED1);
            let final_STOTokenSold = await I_POLYCappedSTO_Array[stoId].getTokensSold();
            let final_STOETHBal = new BN(await web3.eth.getBalance(I_POLYCappedSTO_Array[stoId].address));
            let final_STOPOLYBal = await I_PolyToken.balanceOf(I_POLYCappedSTO_Array[stoId].address);
            let final_RaisedETH = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(POLY);
            let final_RaisedSC = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(SC);
            let final_RaisedUSD = await I_POLYCappedSTO_Array[stoId].fundsRaisedUSD.call();
            let final_WalletETHBal = new BN(await web3.eth.getBalance(WALLET));
            let final_WalletPOLYBal = await I_PolyToken.balanceOf(WALLET);
            let final_InvestorCount = await I_POLYCappedSTO_Array[stoId].investorCount.call();
            let final_nonAccreditedCount = await I_POLYCappedSTO_Array[stoId].nonAccreditedCount.call();
            let final_investorInvested = await I_POLYCappedSTO_Array[stoId].investorInvested(ACCREDITED1);
            let final_investorInvestedUSD = await I_POLYCappedSTO_Array[stoId].investorInvestedUSD(ACCREDITED1);
            console.log("          Final tokens sold: ".grey + final_STOTokenSold.toString().grey);

            assert.equal(await I_POLYCappedSTO_Array[stoId].capReached(), true, "STO cap has not been reached");
            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), false, "STO is Open");
            assert.equal(
                final_TokenSupply.toString(),
                init_TokenSupply
                    .add(expectedTokens)
                    .toString(),
                "Token Supply not changed as expected"
            );
            assert.equal(
                final_InvestorTokenBal.toString(),
                init_InvestorTokenBal
                    .add(expectedTokens)
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
                    .add(surplus_POLY)
                    .toString(),
                "Investor POLY Balance not changed as expected"
            );
            assert.equal(
                final_STOTokenSold.toString(),
                init_STOTokenSold
                    .add(expectedTokens)
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
                    .sub(surplus_POLY)
                    .toString(),
                "Raised POLY not changed as expected"
            );
            assert.equal(
                final_RaisedUSD.toString(),
                init_RaisedUSD
                    .add(investment_USD)
                    .sub(surplus_USD)
                    .toString(),
                "Raised USD did not increase"
            );
            assert.equal(final_WalletETHBal.toString(), init_WalletETHBal.toString(), "Wallet ETH Balance not changed as expected");
            assert.equal(
                final_WalletPOLYBal.toString(),
                init_WalletPOLYBal
                    .add(investment_POLY)
                    .sub(surplus_POLY)
                    .toString(),
                "Wallet POLY Balance not changed as expected"
            );
            assert.equal(
                final_InvestorCount.toString(),
                init_InvestorCount.toString(),
                "Investor count increased"
            );
            assert.equal(
                final_nonAccreditedCount.toString(),
                init_nonAccreditedCount.toString(),
                "non-accredited Investor count increased"
            );
            assert.equal(
                final_investorInvested.toString(),
                init_investorInvested.add(investment_POLY.sub(surplus_POLY)).toString(),
                "Investor Investment did not increase by the correct amount"
            );
            assert.equal(
                final_investorInvestedUSD.toString(),
                init_investorInvestedUSD.add(investment_USD.sub(surplus_USD)).toString(),
                "Investor Investment USD did not increase by the correct amount"
            );
            await revertToSnapshot(snapId);
        });
    });

    describe("Test finalizing the STO", async () => {
        it("Should successfully finalize without minting unsold tokens to the treasury wallet", async () => {
            let stoId = 0;
            let snapId = await takeSnapshot();

            // Calculate the remaing number of tokens
            let cap = await I_POLYCappedSTO_Array[stoId].cap.call();
            let init_STOTokenSold = await I_POLYCappedSTO_Array[stoId].getTokensSold();
            let remainingTokens = cap.sub(init_STOTokenSold);
            console.log("          Cap: ".grey + cap.toString().grey);
            console.log("          Initial tokens sold: ".grey + init_STOTokenSold.toString().grey);
            console.log("          Remaining tokens: ".grey + remainingTokens.toString().grey);

            // Additional checks on getters
            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_TreasuryTokenBal = await I_SecurityToken.balanceOf(TREASURYWALLET);
            let init_RaisedETH = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(POLY);
            let init_RaisedSC = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(SC);
            let init_RaisedUSD = await I_POLYCappedSTO_Array[stoId].fundsRaisedUSD.call();
            let init_InvestorCount = await I_POLYCappedSTO_Array[stoId].investorCount.call();
            let init_nonAccreditedCount = await I_POLYCappedSTO_Array[stoId].nonAccreditedCount.call();

            assert.equal(await I_POLYCappedSTO_Array[stoId].capReached(), false, "STO cap has been reached");
            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), true, "STO is not Open");

            // Finalize STO without minting
            await I_POLYCappedSTO_Array[stoId].finalize(false, { from: ISSUER });
            assert.equal(await I_POLYCappedSTO_Array[stoId].isFinalized.call(), true, "STO has not been finalized");
            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), false, "STO is Open");

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_TreasuryTokenBal = await I_SecurityToken.balanceOf(TREASURYWALLET);
            let final_STOTokenSold = await I_POLYCappedSTO_Array[stoId].getTokensSold();
            let final_RaisedETH = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(POLY);
            let final_RaisedSC = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(SC);
            let final_RaisedUSD = await I_POLYCappedSTO_Array[stoId].fundsRaisedUSD.call();
            let final_InvestorCount = await I_POLYCappedSTO_Array[stoId].investorCount.call();
            let final_nonAccreditedCount = await I_POLYCappedSTO_Array[stoId].nonAccreditedCount.call();
            let final_TokensReturned = await I_POLYCappedSTO_Array[stoId].finalAmountReturned.call();

            console.log("          Final tokens sold: ".grey + final_STOTokenSold.toString().grey);
            console.log("          Final tokens Returned: ".grey + final_TokensReturned.toString().grey);

            assert.equal(final_TokensReturned.toString(), 0, "unsold Tokens were minted");
            assert.equal(final_TokenSupply.toString(), init_TokenSupply.toString(), "Token Supply not changed as expected");
            assert.equal(final_TreasuryTokenBal.toString(), init_TreasuryTokenBal.toString(), "Treasury Balance increased");
            assert.equal(final_STOTokenSold.toString(), init_STOTokenSold.toString(), "STO Token Sold not changed as expected");
            assert.equal(final_RaisedETH.toString(), init_RaisedETH.toString(), "Raised ETH not changed as expected");
            assert.equal(final_RaisedPOLY.toString(), init_RaisedPOLY.toString(), "Raised POLY not changed as expected");
            assert.equal(final_InvestorCount.toString(), init_InvestorCount.toString(), "Investor count increased");
            assert.equal(final_nonAccreditedCount.toString(), init_nonAccreditedCount.toString(), "non-accredited Investor count increased");

            await revertToSnapshot(snapId);
        });

        it("Should successfully finalize and mint unsold tokens to the treasury wallet -- fail local treasury wallet not whitelisted", async () => {
            let stoId = 0;
            assert.equal(
                await I_POLYCappedSTO_Array[stoId].treasuryWallet.call(),
                TREASURYWALLET,
                "Incorrect _treasuryWallet in config"
            );

            assert.equal(await I_POLYCappedSTO_Array[stoId].capReached(), false, "STO cap has been reached");
            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), true, "STO is not Open");

            // Finalize STO without minting
            await catchRevert(I_POLYCappedSTO_Array[stoId].finalize(true, { from: ISSUER }));

            assert.equal(await I_POLYCappedSTO_Array[stoId].isFinalized.call(), false, "STO has been finalized");
            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), true, "STO not Open");
        });

        it("Should successfully finalize and mint unsold tokens to the treasury wallet -- fail dataStore treasury wallet (ISSUER) not whitelisted", async () => {
            let stoId = 1;
            assert.equal(
                await I_POLYCappedSTO_Array[stoId].treasuryWallet.call(),
                address_zero,
                "Incorrect _treasuryWallet in config"
            );

            assert.equal(await I_POLYCappedSTO_Array[stoId].capReached(), false, "STO cap has been reached");
            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), true, "STO is not Open");

            // Finalize STO without minting
            await catchRevert(I_POLYCappedSTO_Array[stoId].finalize(true, { from: ISSUER }));

            assert.equal(await I_POLYCappedSTO_Array[stoId].isFinalized.call(), false, "STO has been finalized");
            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), true, "STO not Open");

        });

        it("Should successfully finalize and mint unsold tokens to the treasury wallet -- fail because of bad owner", async () => {
            let stoId = 0;

            assert.equal(await I_POLYCappedSTO_Array[stoId].capReached(), false, "STO cap has been reached");
            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), true, "STO is not Open");

            //Whitelist Treasury wallet
            let fromTime = await latestTime();
            let toTime = await latestTime() + duration.days(15);
            let expiryTime = toTime + duration.days(100);

            const tx1 = await I_GeneralTransferManager.modifyKYCData(TREASURYWALLET, fromTime, toTime, expiryTime, {from: ISSUER});
            assert.equal(tx1.logs[0].args._investor, TREASURYWALLET, "Failed in adding the treasury wallet to whitelist");

            // Finalize STO without minting
            await catchRevert(I_POLYCappedSTO_Array[stoId].finalize(true, { from: POLYMATH }));

            assert.equal(await I_POLYCappedSTO_Array[stoId].isFinalized.call(), false, "STO has been finalized");
            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), true, "STO not Open");
        });

        it("Should successfully finalize and mint unsold tokens to the local treasury wallet", async () => {
            let stoId = 0;
            let snapId = await takeSnapshot();

            //Whitelist Treasury wallet
            let fromTime = await latestTime();
            let toTime = await latestTime() + duration.days(15);
            let expiryTime = toTime + duration.days(100);

            const tx1 = await I_GeneralTransferManager.modifyKYCData(TREASURYWALLET, fromTime, toTime, expiryTime, {from: ISSUER});
            assert.equal(tx1.logs[0].args._investor, TREASURYWALLET, "Failed in adding the treasury wallet to whitelist");

            // Calculate the remaing number of tokens
            let cap = await I_POLYCappedSTO_Array[stoId].cap.call();
            let init_STOTokenSold = await I_POLYCappedSTO_Array[stoId].getTokensSold();
            let remainingTokens = cap.sub(init_STOTokenSold);
            console.log("          Cap: ".grey + cap.toString().grey);
            console.log("          Initial tokens sold: ".grey + init_STOTokenSold.toString().grey);
            console.log("          Remaining tokens: ".grey + remainingTokens.toString().grey);

            // Additional checks on getters
            let init_TokenSupply = await I_SecurityToken.totalSupply();
            let init_TreasuryTokenBal = await I_SecurityToken.balanceOf(TREASURYWALLET);
            let init_RaisedETH = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(POLY);
            let init_RaisedSC = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(SC);
            let init_RaisedUSD = await I_POLYCappedSTO_Array[stoId].fundsRaisedUSD.call();
            let init_InvestorCount = await I_POLYCappedSTO_Array[stoId].investorCount.call();
            let init_nonAccreditedCount = await I_POLYCappedSTO_Array[stoId].nonAccreditedCount.call();

            assert.equal(await I_POLYCappedSTO_Array[stoId].capReached(), false, "STO cap has been reached");
            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), true, "STO is not Open");

            // Finalize STO without minting
            await I_POLYCappedSTO_Array[stoId].finalize(true, { from: ISSUER });
            assert.equal(await I_POLYCappedSTO_Array[stoId].isFinalized.call(), true, "STO has not been finalized");
            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), false, "STO is Open");

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_TreasuryTokenBal = await I_SecurityToken.balanceOf(TREASURYWALLET);
            let final_STOTokenSold = await I_POLYCappedSTO_Array[stoId].getTokensSold();
            let final_RaisedETH = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(POLY);
            let final_RaisedSC = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(SC);
            let final_RaisedUSD = await I_POLYCappedSTO_Array[stoId].fundsRaisedUSD.call();
            let final_InvestorCount = await I_POLYCappedSTO_Array[stoId].investorCount.call();
            let final_nonAccreditedCount = await I_POLYCappedSTO_Array[stoId].nonAccreditedCount.call();
            let final_TokensReturned = await I_POLYCappedSTO_Array[stoId].finalAmountReturned.call();

            console.log("          Final tokens sold: ".grey + final_STOTokenSold.toString().grey);
            console.log("          Final tokens Returned: ".grey + final_TokensReturned.toString().grey);

            assert.equal(final_TokensReturned.toString(), remainingTokens, "unsold Tokens were not minted");
            assert.equal(final_TokenSupply.toString(), (init_TokenSupply.add(remainingTokens)).toString(), "Token Supply not changed as expected");
            assert.equal(final_TreasuryTokenBal.toString(), remainingTokens.toString(), "Treasury Balance increased");
            assert.equal(final_STOTokenSold.toString(), init_STOTokenSold.toString(), "STO Token Sold not changed as expected");
            assert.equal(final_RaisedETH.toString(), init_RaisedETH.toString(), "Raised ETH not changed as expected");
            assert.equal(final_RaisedPOLY.toString(), init_RaisedPOLY.toString(), "Raised POLY not changed as expected");
            assert.equal(final_InvestorCount.toString(), init_InvestorCount.toString(), "Investor count increased");
            assert.equal(final_nonAccreditedCount.toString(), init_nonAccreditedCount.toString(), "non-accredited Investor count increased");

            await revertToSnapshot(snapId);
        });

        it("Should successfully finalize and mint unsold tokens to the dataStore treasury wallet (ISSUER)", async () => {
            let stoId = 1;
            let snapId = await takeSnapshot();

            //Whitelist Treasury wallet
            let fromTime = await latestTime();
            let toTime = await latestTime() + duration.days(15);
            let expiryTime = toTime + duration.days(100);

            const tx1 = await I_GeneralTransferManager.modifyKYCData(ISSUER, fromTime, toTime, expiryTime, {from: ISSUER});
            assert.equal(tx1.logs[0].args._investor, ISSUER, "Failed in adding the treasury wallet to whitelist");

            // Calculate the remaing number of tokens
            let cap = await I_POLYCappedSTO_Array[stoId].cap.call();
            let init_STOTokenSold = await I_POLYCappedSTO_Array[stoId].getTokensSold();
            let remainingTokens = cap.sub(init_STOTokenSold);
            console.log("          Cap: ".grey + cap.toString().grey);
            console.log("          Initial tokens sold: ".grey + init_STOTokenSold.toString().grey);
            console.log("          Remaining tokens: ".grey + remainingTokens.toString().grey);

            let init_TokenSupply = await I_SecurityToken.totalSupply();
            console.log("          Initial token supply: ".grey + init_TokenSupply.toString().grey);

            // Additional checks on getters
            let init_TreasuryTokenBal = await I_SecurityToken.balanceOf(ISSUER);
            let init_RaisedETH = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(ETH);
            let init_RaisedPOLY = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(POLY);
            let init_RaisedSC = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(SC);
            let init_RaisedUSD = await I_POLYCappedSTO_Array[stoId].fundsRaisedUSD.call();
            let init_InvestorCount = await I_POLYCappedSTO_Array[stoId].investorCount.call();
            let init_nonAccreditedCount = await I_POLYCappedSTO_Array[stoId].nonAccreditedCount.call();

            assert.equal(await I_POLYCappedSTO_Array[stoId].capReached(), false, "STO cap has been reached");
            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), true, "STO is not Open");

            // Finalize STO without minting
            await I_POLYCappedSTO_Array[stoId].finalize(true, { from: ISSUER });
            assert.equal(await I_POLYCappedSTO_Array[stoId].isFinalized.call(), true, "STO has not been finalized");
            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), false, "STO is Open");

            let final_TokenSupply = await I_SecurityToken.totalSupply();
            let final_TreasuryTokenBal = await I_SecurityToken.balanceOf(ISSUER);
            let final_STOTokenSold = await I_POLYCappedSTO_Array[stoId].getTokensSold();
            let final_RaisedETH = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(ETH);
            let final_RaisedPOLY = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(POLY);
            let final_RaisedSC = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(SC);
            let final_RaisedUSD = await I_POLYCappedSTO_Array[stoId].fundsRaisedUSD.call();
            let final_InvestorCount = await I_POLYCappedSTO_Array[stoId].investorCount.call();
            let final_nonAccreditedCount = await I_POLYCappedSTO_Array[stoId].nonAccreditedCount.call();
            let final_TokensReturned = await I_POLYCappedSTO_Array[stoId].finalAmountReturned.call();

            console.log("          Final tokens sold: ".grey + final_STOTokenSold.toString().grey);
            console.log("          Final tokens Returned: ".grey + final_TokensReturned.toString().grey);
            console.log("          Final token supply: ".grey + final_TokenSupply.toString().grey);

            assert.equal(final_TokensReturned.toString(), remainingTokens.toString(), "unsold Tokens were not minted");
            assert.equal(final_TokenSupply.toString(), (init_TokenSupply.add(remainingTokens)).toString(), "Token Supply not changed as expected");
            assert.equal(final_TreasuryTokenBal.toString(), remainingTokens.toString(), "Treasury Balance increased");
            assert.equal(final_STOTokenSold.toString(), init_STOTokenSold.toString(), "STO Token Sold not changed as expected");
            assert.equal(final_RaisedETH.toString(), init_RaisedETH.toString(), "Raised ETH not changed as expected");
            assert.equal(final_RaisedPOLY.toString(), init_RaisedPOLY.toString(), "Raised POLY not changed as expected");
            assert.equal(final_InvestorCount.toString(), init_InvestorCount.toString(), "Investor count increased");
            assert.equal(final_nonAccreditedCount.toString(), init_nonAccreditedCount.toString(), "non-accredited Investor count increased");

            await revertToSnapshot(snapId);
        });

        it("Should successfully finalize without minting unsold tokens to the treasury wallet (treasury wallet = address zero)", async () => {
            let stoId = 1;

            assert.equal(await I_POLYCappedSTO_Array[stoId].capReached(), false, "STO cap has been reached");
            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), true, "STO is not Open");

            // Finalize STO without minting
            await I_POLYCappedSTO_Array[stoId].finalize(false, { from: ISSUER });

            assert.equal(await I_POLYCappedSTO_Array[stoId].isFinalized.call(), true, "STO has been finalized");
            assert.equal(await I_POLYCappedSTO_Array[stoId].isOpen(), false, "STO not Open");
        });
    });

    //////////////////
    // GETTER TESTS //
    //////////////////
    describe("Test getter functions", async () => {
        it("Should get the right number of investors", async () => {
            assert.equal(
                (await I_POLYCappedSTO_Array[0].investorCount.call()).toString(),
                (await I_POLYCappedSTO_Array[0].investorCount()).toString(),
                "Investor count not changed as expected"
            );
            assert.equal(
                (await I_POLYCappedSTO_Array[1].investorCount.call()).toString(),
                (await I_POLYCappedSTO_Array[1].investorCount()).toString(),
                "Investor count not changed as expected"
            );
        });

        it("Should get the right amounts invested", async () => {
            assert.equal(
                (await I_POLYCappedSTO_Array[0].fundsRaised.call(ETH)).toString(),
                (await I_POLYCappedSTO_Array[0].getRaised(0)).toString(),
                "getRaisedEther not changed as expected"
            );
            assert.equal(
                (await I_POLYCappedSTO_Array[0].fundsRaised.call(POLY)).toString(),
                (await I_POLYCappedSTO_Array[0].getRaised(1)).toString(),
                "getRaisedPOLY not changed as expected"
            );
            assert.equal(
                (await I_POLYCappedSTO_Array[0].fundsRaisedUSD.call()).toString(),
                (await I_POLYCappedSTO_Array[0].fundsRaisedUSD()).toString(),
                "fundsRaisedUSD not changed as expected"
            );
        });

        it("Should return correct STO details", async () => {
            let stoId = 0;
            /*
                getSTODetails array output:
                0 - startTime,
                1 - endTime,
                2 - cap,
                3 - rate,
                4 - minimumInvestment,
                5 - nonAccreditedLimit,
                6 - maxNonAccreditedInvestors,
                7 - totalTokensSold,
                8 - raised,
                9 - fundsRaisedUSD,
                10 - investorCount,
                11 - nonAccreditedCount
            */
            // Get STO Details
            let stoDetails = await I_POLYCappedSTO_Array[stoId].getSTODetails.call();
            let sto_startTime = stoDetails[0];
            let sto_endTime = stoDetails[1];
            let sto_cap = stoDetails[2];
            let sto_rate = stoDetails[3];
            let sto_minimumInvestment = stoDetails[4];
            let sto_nonAccreditedLimit = stoDetails[5];
            let sto_maxNonAccreditedInvestors = stoDetails[6];
            let sto_totalTokensSold = stoDetails[7];
            let sto_fundsRaisedPOLY = stoDetails[8];
            let sto_fundsRaisedUSD = stoDetails[9];
            let sto_investorCount = stoDetails[10];
            let sto_nonAccreditedCount = stoDetails[11];

            // Get details from invidual getters
            let startTime = await I_POLYCappedSTO_Array[stoId].startTime.call();
            let endTime = await I_POLYCappedSTO_Array[stoId].endTime.call();
            let cap = await I_POLYCappedSTO_Array[stoId].cap.call();
            let rate = await I_POLYCappedSTO_Array[stoId].rate.call();
            let minimumInvestment = await I_POLYCappedSTO_Array[stoId].minimumInvestment.call();
            let nonAccreditedLimit = await I_POLYCappedSTO_Array[stoId].nonAccreditedLimit.call();
            let maxNonAccreditedInvestors = await I_POLYCappedSTO_Array[stoId].maxNonAccreditedInvestors.call();
            let totalTokensSold = await I_POLYCappedSTO_Array[stoId].totalTokensSold.call();
            let fundsRaisedPOLY = await I_POLYCappedSTO_Array[stoId].fundsRaised.call(POLY);
            let fundsRaisedUSD = await I_POLYCappedSTO_Array[stoId].fundsRaisedUSD.call();
            let investorCount = await I_POLYCappedSTO_Array[stoId].investorCount.call();
            let nonAccreditedCount = await I_POLYCappedSTO_Array[stoId].nonAccreditedCount.call();

            assert.equal(sto_startTime.toString(), startTime.toString(), "Incorrect startTime");
            assert.equal(sto_endTime.toString(), endTime.toString(), "Incorrect endTime");
            assert.equal(sto_cap.toString(), cap.toString(), "Incorrect cap");
            assert.equal(sto_rate.toString(), rate.toString(), "Incorrect rate");
            assert.equal(sto_minimumInvestment.toString(), minimumInvestment.toString(), "Incorrect minimumInvestment");
            assert.equal(sto_nonAccreditedLimit.toString(), nonAccreditedLimit.toString(), "Incorrect nonAccreditedLimit");
            assert.equal(
                sto_maxNonAccreditedInvestors.toString(),
                 maxNonAccreditedInvestors.toString(),
                 "Incorrect maxNonAccreditedInvestors"
             );
            assert.equal(sto_totalTokensSold.toString(), totalTokensSold.toString(), "Incorrect totalTokensSold");
            assert.equal(sto_fundsRaisedPOLY.toString(), sto_fundsRaisedPOLY.toString(), "Incorrect fundsRaisedPOLY");
            assert.equal(sto_fundsRaisedUSD.toString(), fundsRaisedUSD.toString(), "Incorrect fundsRaisedPOLY");
            assert.equal(sto_investorCount.toString(), investorCount.toString(), "Incorrect investorCount");
            assert.equal(sto_nonAccreditedCount.toString(), nonAccreditedCount.toString(), "Incorrect nonAccreditedCount");
        });

        it("Should get the correct POLY token address", async () => {
            assert.equal(
                (await I_PolyToken.address).toString(),
                (await I_POLYCappedSTO_Array[0].polyToken.call()).toString(),
                "POLY token addresses don't match"
            );
            assert.equal(
                (await I_PolyToken.address).toString(),
                (await I_POLYCappedSTO_Array[1].polyToken.call()).toString(),
                "POLY token addresses don't match"
            );
        });

        it("Should get the correct security token address", async () => {
            assert.equal(
                (await I_POLYCappedSTO_Array[0].securityToken.call()).toString(),
                (await I_SecurityToken.address).toString(),
                "Security token addresses don't match"
            );
            assert.equal(
                (await I_POLYCappedSTO_Array[1].securityToken.call()).toString(),
                (await I_SecurityToken.address).toString(),
                "Security token addresses don't match"
            );
        });

        it("Should get the correct STO factory address", async () => {
            assert.equal(
                (await I_POLYCappedSTO_Array[0].factory.call()).toString(),
                (await I_POLYCappedSTOFactory.address).toString(),
                "Factory addresses don't match"
            );
            assert.equal(
                (await I_POLYCappedSTO_Array[1].factory.call()).toString(),
                (await I_POLYCappedSTOFactory.address).toString(),
                "Factory address don't match"
            );
        });
    });

    describe("Reclaim POLY sent directly to STO contract in error", async () => {
        it("Should fail to reclaim POLY because token contract address is 0 address", async () => {
            let value = new BN(web3.utils.toWei("100", "ether"));
            await I_PolyToken.getTokens(value, INVESTOR1);
            await I_PolyToken.transfer(I_POLYCappedSTO_Array[0].address, value, { from: INVESTOR1 });

            await catchRevert(I_POLYCappedSTO_Array[0].reclaimERC20(address_zero, { from: ISSUER }));
        });

        it("Should successfully reclaim POLY", async () => {
            let initInvestorBalance = await I_PolyToken.balanceOf(INVESTOR1);
            let initOwnerBalance = await I_PolyToken.balanceOf(ISSUER);
            let initContractBalance = await I_PolyToken.balanceOf(I_POLYCappedSTO_Array[0].address);
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

    describe("Miscelanious tests", async () => {
        it("Should pause before end time and fail to pause after end time", async () => {
            let stoId = 0;
            let snapId = await takeSnapshot();
            // Pause the STO
            await I_POLYCappedSTO_Array[stoId].pause({ from: ISSUER });
            assert.equal(await I_POLYCappedSTO_Array[stoId].paused.call(), true, "STO did not pause successfully");
            // Unpause the STO
            await I_POLYCappedSTO_Array[stoId].unpause({ from: ISSUER });
            assert.equal(await I_POLYCappedSTO_Array[stoId].paused.call(), false, "STO did not unpause successfully");
            // Advance time to after STO end
            await increaseTime(duration.days(120));
            // Pause the STO --Should fail STO has ended
            await catchRevert(I_POLYCappedSTO_Array[stoId].pause({ from: ISSUER }));
            assert.equal(await I_POLYCappedSTO_Array[stoId].paused.call(), false, "STO paused");

            await revertToSnapshot(snapId);
        });

        it("Should fail to deploy a new POLYCappedSTOFactory -- logic contract is address zero", async () => {
        await catchRevert(POLYCappedSTOFactory.new(STOSetupCost, new BN(0), address_zero, I_PolymathRegistry.address, { from: POLYMATH }));
        });

        it("Should fail to deploy a new POLYCappedSTOProxy -- logic contract is address zero", async () => {
        await catchRevert(POLYCappedSTOProxy.new("3.0.0", I_SecurityToken.address, I_PolyToken.address, address_zero, { from: POLYMATH }));
        });
    });

    ///////////////////
    // FACTORY TESTS //
    ///////////////////
    describe("Test cases for the POLYCappedSTOFactory", async () => {
        it("Should get the exact details of the factory", async () => {
            assert.equal((await I_POLYCappedSTOFactory.setupCost.call()).toString(), STOSetupCost);
            assert.equal((await I_POLYCappedSTOFactory.setupCostInPoly.call()).toString(), STOSetupCost);
            assert.equal((await I_POLYCappedSTOFactory.types.call())[0], 3);
            assert.equal(web3.utils.hexToString(await I_POLYCappedSTOFactory.name.call()), "POLYCappedSTO", "Wrong Module added");
            assert.equal(
                await I_POLYCappedSTOFactory.description.call(),
                "This smart contract creates a maximum number of tokens (i.e. hard cap) which the total aggregate of tokens acquired by all investors cannot exceed. Security tokens are sent to the investor upon reception of the funds (POLY). This STO supports options for a minimum investment limit for all investors, maximum investment limit for non-accredited investors and an option to mint unsold tokens to a treasury wallet upon termination of the offering.",
                "Wrong Module added"
            );
            assert.equal(await I_POLYCappedSTOFactory.title.call(), "POLY - Capped STO", "Wrong Module added");
            assert.equal(await I_POLYCappedSTOFactory.version.call(), "3.0.0");
            let tags = await I_POLYCappedSTOFactory.tags.call();
            assert.equal(web3.utils.hexToString(tags[0]), "Capped");
            assert.equal(web3.utils.hexToString(tags[1]), "Non-refundable");
            assert.equal(web3.utils.hexToString(tags[2]), "POLY");
            let lower = await I_POLYCappedSTOFactory.lowerSTVersionBounds.call();
            assert.equal(lower[0], 0, "Wrong lower bound");
            assert.equal(lower[1], 0, "Wrong lower bound");
            assert.equal(lower[2], 0, "Wrong lower bound");
            let upper = await I_POLYCappedSTOFactory.upperSTVersionBounds.call();
            assert.equal(upper[0], 0, "Wrong upper bound");
            assert.equal(upper[1], 0, "Wrong upper bound");
            assert.equal(upper[2], 0, "Wrong upper bound");
        });

        it("Should fail to change the setup cost for STO Factory - bad owner", async () => {
            let newSetupCost = new BN(web3.utils.toWei("500"));
            await catchRevert(I_POLYCappedSTOFactory.changeSetupCost(newSetupCost, { from: ISSUER }));
        });

        it("Should successfully change the setup cost for STO Factory", async () => {
            let newSetupCost = new BN(web3.utils.toWei("500"));
            let newSetupCostPOLY = newSetupCost.mul(e18).div(await I_POLYOracle.getPrice.call());
            await I_POLYCappedSTOFactory.changeSetupCost(newSetupCost, { from: POLYMATH });
            assert.equal((await I_POLYCappedSTOFactory.setupCost.call()).toString(), newSetupCost.toString(), "Setup Cost mismatch");
            assert.equal((await I_POLYCappedSTOFactory.setupCostInPoly.call()).toString(), newSetupCostPOLY.toString(), "Setup Cost POLY mismatch");
        });

        it("Should fail to change the title -- bad owner", async () => {
            await catchRevert(I_POLYCappedSTOFactory.changeTitle("STO Capped POLY", { from: ISSUER }));
        });

        it("Should fail to change the title -- zero length", async () => {
            await catchRevert(I_POLYCappedSTOFactory.changeTitle("", { from: POLYMATH }));
        });

        it("Should successfully change the title", async () => {
            await I_POLYCappedSTOFactory.changeTitle("STO Capped POLY", { from: POLYMATH });
            assert.equal(await I_POLYCappedSTOFactory.title.call(), "STO Capped POLY", "Title doesn't get changed");
        });

        it("Should fail to change the description -- bad owner", async () => {
            await catchRevert(I_POLYCappedSTOFactory.changeDescription("It is only a STO", { from: ISSUER }));
        });

        it("Should fail to change the description -- zero length", async () => {
            await catchRevert(I_POLYCappedSTOFactory.changeDescription("", { from: POLYMATH }));
        });

        it("Should successfully change the description", async () => {
            await I_POLYCappedSTOFactory.changeDescription("It is only a STO", { from: POLYMATH });
            assert.equal(await I_POLYCappedSTOFactory.description.call(), "It is only a STO", "Description doesn't get changed");
        });

        it("Should fail to change the name -- bad owner", async () => {
            await catchRevert(I_POLYCappedSTOFactory.changeName(web3.utils.stringToHex("STOCapped"), { from: ISSUER }));
        });

        it("Should fail to change the name -- zero length", async () => {
            await catchRevert(I_POLYCappedSTOFactory.changeName(web3.utils.stringToHex(""), { from: POLYMATH }));
        });

        it("Should successfully change the name", async () => {
            await I_POLYCappedSTOFactory.changeName(web3.utils.stringToHex("STOCapped"), { from: POLYMATH });
            assert.equal(web3.utils.hexToString(await I_POLYCappedSTOFactory.name.call()), "STOCapped", "Name doesn't get changed");
        });

        it("Should fail to change lower and upper Security Token Version Bounds -- bad owner", async () => {
            await catchRevert(I_POLYCappedSTOFactory.changeSTVersionBounds("lowerBound", [1,1,1], { from: ISSUER }));
            await catchRevert(I_POLYCappedSTOFactory.changeSTVersionBounds("upperBound", [9,9,9], { from: ISSUER }));
        });

        it("Should successfully change lower and upper Security Token Version Bounds", async () => {
            await I_POLYCappedSTOFactory.changeSTVersionBounds("lowerBound", [1,2,3], { from: POLYMATH });
            await I_POLYCappedSTOFactory.changeSTVersionBounds("upperBound", [4,5,6], { from: POLYMATH });
            let lower = await I_POLYCappedSTOFactory.lowerSTVersionBounds.call();
            assert.equal(lower[0], 1, "Wrong lower bound");
            assert.equal(lower[1], 2, "Wrong lower bound");
            assert.equal(lower[2], 3, "Wrong lower bound");
            let upper = await I_POLYCappedSTOFactory.upperSTVersionBounds.call();
            assert.equal(upper[0], 4, "Wrong upper bound");
            assert.equal(upper[1], 5, "Wrong upper bound");
            assert.equal(upper[2], 6, "Wrong upper bound");
        });

        it("Should fail to change tags -- bad owner", async () => {
            let newTags = [];
            newTags[0] = web3.utils.stringToHex("Tag1");
            newTags[1] = web3.utils.stringToHex("Tag2");
            newTags[2] = web3.utils.stringToHex("Tag3");
            await catchRevert(I_POLYCappedSTOFactory.changeTags(newTags, { from: ISSUER }));
        });

        it("Should fail to change tags -- tags length = 0", async () => {
            let newTags = [];
            await catchRevert(I_POLYCappedSTOFactory.changeTags(newTags, { from: POLYMATH }));
        });

        it("Should successfully change tags", async () => {
            let newTags = [];
            newTags[0] = web3.utils.stringToHex("Tag1");
            newTags[1] = web3.utils.stringToHex("Tag2");
            newTags[2] = web3.utils.stringToHex("Tag3");
            await I_POLYCappedSTOFactory.changeTags(newTags, { from: POLYMATH });
            let tags = await I_POLYCappedSTOFactory.tags.call();
            assert.equal(web3.utils.hexToString(tags[0]), "Tag1", "Incorrect tag 1");
            assert.equal(web3.utils.hexToString(tags[1]), "Tag2", "Incorrect tag 2");
            assert.equal(web3.utils.hexToString(tags[2]), "Tag3", "Incorrect tag 3");
        });

        it("Should fail to transfer Ownership -- bad owner", async () => {
            await catchRevert(I_POLYCappedSTOFactory.transferOwnership(ISSUER, { from: ISSUER }));
        });

        it("Should fail to transfer Ownership -- address zero", async () => {
            await catchRevert(I_POLYCappedSTOFactory.transferOwnership(address_zero, { from: POLYMATH }));
        });

        it("Should successfully transfer Ownership", async () => {
            await I_POLYCappedSTOFactory.transferOwnership(ISSUER, { from: POLYMATH });
            assert.equal(await I_POLYCappedSTOFactory.owner.call(), ISSUER, "Owner doesn't get changed");
        });
    });
});
