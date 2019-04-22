import latestTime from "./helpers/latestTime";
import { duration, promisifyLogWatch, latestBlock } from "./helpers/utils";
import { takeSnapshot, increaseTime, revertToSnapshot } from "./helpers/time";
import { encodeProxyCall, encodeModuleCall } from "./helpers/encodeCall";
import { catchRevert } from "./helpers/exceptions";
import { setUpPolymathNetwork, deployGPMAndVerifyed, deployDummySTOAndVerifyed, deployGTMAndVerifyed, deploySWTMAndVerify } from "./helpers/createInstances";

const DummySTO = artifacts.require("./DummySTO.sol");
const SecurityToken = artifacts.require("./SecurityToken.sol");
const GeneralTransferManager = artifacts.require("./GeneralTransferManager");
const GeneralPermissionManager = artifacts.require("./GeneralPermissionManager");
const STGetter = artifacts.require("./STGetter.sol");
const SharedWhitelistTransferManager = artifacts.require("./SharedWhitelistTransferManager");


const Web3 = require("web3");
let BN = Web3.utils.BN;
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port

contract("SharedWhitelistTransferManager", async (accounts) => {
    // Accounts Variable declaration
    let POLYMATH;
    let ISSUER1;
    let ISSUER2;
    let INVESTOR1;
    let INVESTOR2;
    let INVESTOR3;
    let INVESTOR4;
    let DELEGATE;
    let AFFILIATE1;
    let AFFILIATE2;

    // investor Details
    let fromTime;
    let toTime;
    let expiryTime;

    let message = "Transaction Should Fail!";

    // Contract Instance Declaration
    let I_GeneralPermissionManagerFactory;
    let I_GeneralTransferManagerFactory;
    let I_SecurityTokenRegistryProxy;
    let I_GeneralPermissionManager = [];
    let I_GeneralTransferManager = [];
    let I_ModuleRegistryProxy;
    let I_ModuleRegistry;
    let I_FeatureRegistry;
    let I_SecurityTokenRegistry;
    let I_DummySTOFactory;
    let P_DummySTOFactory;
    let I_STFactory;
    let I_SecurityToken = [];
    let I_STRProxied;
    let I_MRProxied;
    let I_DummySTO;
    let I_PolyToken;
    let I_PolymathRegistry;
    let P_GeneralTransferManagerFactory;
    let I_STRGetter;
    let I_STGetter;
    let I_SharedWhitelistTransferManagerFactory;
    let P_SharedWhitelistTransferManagerFactory;
    let I_SharedWhitelistTransferManager;
    let stGetter = [];

    let NAME = [];
    let SYMBOL = [];
    let TOKENDETAILS = [];

    // SecurityToken 1 Details
    NAME[0] = "Team";
    SYMBOL[0] = "SAP";
    TOKENDETAILS[0] = "This is equity type of issuance";

    // SecurityToken 2 Details
    NAME[1] = "FOB Token";
    SYMBOL[1] = "FOB";
    TOKENDETAILS[1] = "This is equity type of issuance";

    // Module key
    const delegateManagerKey = 1;
    const transferManagerKey = 2;
    const stoKey = 3;

    // Initial fee for ticker registry and security token registry
    const REGFEE = new BN(web3.utils.toWei("1000"));
    const STOSetupCost = 0;

    // Dummy STO details
    let startTime;
    let endTime;
    const cap = new BN(web3.utils.toWei("10", "ether"));
    const someString = "A string which is not used";
    const STOParameters = ["uint256", "uint256", "uint256", "string"];

    let currentTime;
    const address_zero = "0x0000000000000000000000000000000000000000";
    const one_address = "0x0000000000000000000000000000000000000001";
    let SIGNER;
    let snapid;

    const functionSignature = {
        name: "configure",
        type: "function",
        inputs: [
            {
                type: "address",
                name: "_whitelistDataStore"
            }
        ]
    };

    before(async () => {
        currentTime = new BN(await latestTime());
        fromTime = await latestTime();
        toTime = await latestTime();
        expiryTime = toTime + duration.days(15);
        startTime = await latestTime() + duration.seconds(5000); // Start time will be 5000 seconds more than the latest time
        endTime = startTime + duration.days(80); // Add 80 days more

        POLYMATH = accounts[0];
        ISSUER1 = accounts[1];
        ISSUER2 = accounts[2];

        INVESTOR1 = accounts[8];
        INVESTOR2 = accounts[9];
        DELEGATE = accounts[7];
        INVESTOR3 = accounts[5];
        INVESTOR4 = accounts[6];

        AFFILIATE1 = accounts[3];
        AFFILIATE2 = accounts[4];

        let oneeth = new BN(web3.utils.toWei("1", "ether"));
        SIGNER = web3.eth.accounts.create();
        await web3.eth.personal.importRawKey(SIGNER.privateKey, "");
        await web3.eth.personal.unlockAccount(SIGNER.address, "", 6000);
        await web3.eth.sendTransaction({ from: ISSUER1, to: SIGNER.address, value: oneeth });

        // Step 1: Deploy the genral PM ecosystem
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
            I_STRProxied,
            I_STRGetter,
            I_STGetter
        ] = instances;

        [I_GeneralPermissionManagerFactory] = await deployGPMAndVerifyed(POLYMATH, I_MRProxied, STOSetupCost);
        [P_GeneralTransferManagerFactory] = await deployGTMAndVerifyed(POLYMATH, I_MRProxied, new BN(web3.utils.toWei("500")));
        [I_DummySTOFactory] = await deployDummySTOAndVerifyed(POLYMATH, I_MRProxied, STOSetupCost);
        [P_DummySTOFactory] = await deployDummySTOAndVerifyed(POLYMATH, I_MRProxied, new BN(web3.utils.toWei("500")));
        [I_SharedWhitelistTransferManagerFactory] = await deploySWTMAndVerify(POLYMATH, I_MRProxied, STOSetupCost);
        [P_SharedWhitelistTransferManagerFactory] = await deploySWTMAndVerify(POLYMATH, I_MRProxied, new BN(web3.utils.toWei("500")));

        // Printing all the contract addresses
        console.log(`
        --------------------- Polymath Network Smart Contracts: ---------------------
        PolymathRegistry:                       ${I_PolymathRegistry.address}
        SecurityTokenRegistryProxy:             ${I_SecurityTokenRegistryProxy.address}
        SecurityTokenRegistry:                  ${I_SecurityTokenRegistry.address}
        ModuleRegistryProxy:                    ${I_ModuleRegistryProxy.address}
        ModuleRegistry:                         ${I_ModuleRegistry.address}
        FeatureRegistry:                        ${I_FeatureRegistry.address}

        STFactory:                              ${I_STFactory.address}
        GeneralTransferManagerFactory:          ${I_GeneralTransferManagerFactory.address}
        GeneralPermissionManagerFactory:        ${I_GeneralPermissionManagerFactory.address}
        SharedWhitelistTransferManagerFactory:  ${I_SharedWhitelistTransferManagerFactory.address}

        DummySTOFactory:                        ${I_DummySTOFactory.address}
        -----------------------------------------------------------------------------
        `);
    });

    describe("Generate the Security Tokens", async () => {
        it("Should register the first ticker before the generation of the first security token", async () => {
            await I_PolyToken.getTokens(REGFEE, ISSUER1);
            await I_PolyToken.approve(I_STRProxied.address, REGFEE, { from: ISSUER1 });
            let tx = await I_STRProxied.registerTicker(ISSUER1, SYMBOL[0], NAME[0], { from: ISSUER1 });
            assert.equal(tx.logs[0].args._owner, ISSUER1);
            assert.equal(tx.logs[0].args._ticker, SYMBOL[0]);
        });

        it("Should generate the first new security token with the same symbol as registered above", async () => {
            await I_PolyToken.getTokens(REGFEE, ISSUER1);
            await I_PolyToken.approve(I_STRProxied.address, REGFEE, { from: ISSUER1 });

            let tx = await I_STRProxied.generateNewSecurityToken(NAME[0], SYMBOL[0], TOKENDETAILS[0], true, ISSUER1, 0, { from: ISSUER1 });
            assert.equal(tx.logs[1].args._ticker, SYMBOL[0], "SecurityToken doesn't get deployed");

            I_SecurityToken[0] = await SecurityToken.at(tx.logs[1].args._securityTokenAddress);
            stGetter[0] = await STGetter.at(I_SecurityToken[0].address);
            assert.equal(await stGetter[0].getTreasuryWallet.call(), ISSUER1, "Incorrect wallet set")
            const log = (await I_SecurityToken[0].getPastEvents('ModuleAdded', {filter: {transactionHash: tx.transactionHash}}))[0];

            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._types[0].toString(), transferManagerKey);
            assert.equal(web3.utils.hexToString(log.args._name), "GeneralTransferManager");
        });

        it("Should initialize the auto attached modules", async () => {
            let moduleData = (await stGetter[0].getModulesByType(transferManagerKey))[0];
            I_GeneralTransferManager[0] = await GeneralTransferManager.at(moduleData);
        });

        it("Should register the second ticker before the generation of the second security token", async () => {
            await I_PolyToken.getTokens(REGFEE, ISSUER2);
            await I_PolyToken.approve(I_STRProxied.address, REGFEE, { from: ISSUER2 });
            let tx = await I_STRProxied.registerTicker(ISSUER2, SYMBOL[1], NAME[1], { from: ISSUER2 });
            assert.equal(tx.logs[0].args._owner, ISSUER2);
            assert.equal(tx.logs[0].args._ticker, SYMBOL[1]);
        });

        it("Should generate the second new security token with the same symbol as registered above", async () => {
            await I_PolyToken.getTokens(REGFEE, ISSUER2);
            await I_PolyToken.approve(I_STRProxied.address, REGFEE, { from: ISSUER2 });

            let tx = await I_STRProxied.generateNewSecurityToken(NAME[1], SYMBOL[1], TOKENDETAILS[1], true, ISSUER2, 0, { from: ISSUER2 });
            assert.equal(tx.logs[1].args._ticker, SYMBOL[1], "SecurityToken doesn't get deployed");

            I_SecurityToken[1] = await SecurityToken.at(tx.logs[1].args._securityTokenAddress);
            stGetter[1] = await STGetter.at(I_SecurityToken[1].address);
            assert.equal(await stGetter[1].getTreasuryWallet.call(), ISSUER2, "Incorrect wallet set")
            const log = (await I_SecurityToken[1].getPastEvents('ModuleAdded', {filter: {transactionHash: tx.transactionHash}}))[0];

            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._types[0].toString(), transferManagerKey);
            assert.equal(web3.utils.hexToString(log.args._name), "GeneralTransferManager");
        });

        it("Should initialize the auto attached modules", async () => {
            let moduleData = (await stGetter[1].getModulesByType(transferManagerKey))[0];
            I_GeneralTransferManager[1] = await GeneralTransferManager.at(moduleData);
        });

        it("Should attach the paid SWTM to the second token -- failed because of no tokens", async () => {
            // Use dataStore from the first token
            let dataStore = await I_SecurityToken[0].dataStore.call();
            let bytes = web3.eth.abi.encodeFunctionCall(functionSignature, [dataStore]);

            await catchRevert(
                I_SecurityToken[1].addModule(P_SharedWhitelistTransferManagerFactory.address, bytes, new BN(web3.utils.toWei("500")), new BN(0), false,
                { from: ISSUER2 })
            );
        });

        it("Should attach the paid SWTM to the second token", async () => {
            let snap_id = await takeSnapshot();
            // Use dataStore from the first token
            let dataStore = await I_SecurityToken[0].dataStore.call();
            let bytes = web3.eth.abi.encodeFunctionCall(functionSignature, [dataStore]);

            await I_PolyToken.getTokens(new BN(web3.utils.toWei("500")), I_SecurityToken[1].address);
            await I_SecurityToken[1].addModule(P_SharedWhitelistTransferManagerFactory.address, bytes, new BN(web3.utils.toWei("500")), new BN(0), false, {
                from: ISSUER2
            });
            await revertToSnapshot(snap_id);
        });

        it("Should whitelist the affiliates through the first token before the STO attached", async () => {
            console.log(`Estimate gas of one Whitelist:
                ${await I_GeneralTransferManager[0].modifyKYCData.estimateGas(
                    AFFILIATE1,
                    currentTime + currentTime.add(new BN(duration.days(30))),
                    currentTime + currentTime.add(new BN(duration.days(90))),
                    currentTime + currentTime.add(new BN(duration.days(965))),
                    {
                        from: ISSUER1
                    }
                )}`
            );
            let fromTime1 = currentTime + currentTime.add(new BN(duration.days(30)));
            let fromTime2 = currentTime.add(new BN(duration.days(30)));
            let toTime1 =  currentTime + currentTime.add(new BN(duration.days(90)));
            let toTime2 = currentTime.add(new BN(duration.days(90)));
            let expiryTime1 = currentTime + currentTime.add(new BN(duration.days(965)));
            let expiryTime2 = currentTime.add(new BN(duration.days(365)));

            let tx = await I_GeneralTransferManager[0].modifyKYCDataMulti(
                [AFFILIATE1, AFFILIATE2],
                [fromTime1, fromTime2],
                [toTime1, toTime2],
                [expiryTime1, expiryTime2],
                {
                    from: ISSUER1,
                    gas: 6000000
                }
            );
            // Set canNotBuyFromSto flags for Affiliates
            await I_GeneralTransferManager[0].modifyInvestorFlagMulti([AFFILIATE1, AFFILIATE2], [1, 1], [true, true], { from: ISSUER1 });
            assert.equal(tx.logs[0].args._investor, AFFILIATE1);
            assert.equal(tx.logs[1].args._investor, AFFILIATE2);
            assert.deepEqual(await I_GeneralTransferManager[0].getAllInvestors.call(), [AFFILIATE1, AFFILIATE2]);
            console.log(await I_GeneralTransferManager[0].getAllKYCData.call());
            let data = await I_GeneralTransferManager[0].getKYCData.call([AFFILIATE1, AFFILIATE2]);
            assert.equal(data[0][0].toString(), fromTime1);
            assert.equal(data[0][1].toString(), fromTime2);
            assert.equal(data[1][0].toString(), toTime1);
            assert.equal(data[1][1].toString(), toTime2);
            assert.equal(data[2][0].toString(), expiryTime1);
            assert.equal(data[2][1].toString(), expiryTime2);
            assert.equal(await I_GeneralTransferManager[0].getInvestorFlag(AFFILIATE1, 1), true);
            assert.equal(await I_GeneralTransferManager[0].getInvestorFlag(AFFILIATE2, 1), true);
        });

        it("Should mint the second token to the affiliates - failed Investors not whitelisted for second token", async () => {
            await catchRevert(
                I_SecurityToken[1].issueMulti([AFFILIATE1, AFFILIATE2], [new BN(100).mul(new BN(10).pow(new BN(18))), new BN(10).pow(new BN(20))], {
                from: ISSUER2,
                gas: 6000000
            }));
        });

        it("Should attach the SWTM to the second token", async () => {
            // Use dataStore from the first token
            let dataStore = await I_SecurityToken[0].dataStore.call();
            let bytes = web3.eth.abi.encodeFunctionCall(functionSignature, [dataStore]);

            await I_SecurityToken[1].addModule(I_SharedWhitelistTransferManagerFactory.address, bytes, new BN(web3.utils.toWei("2000")), new BN(0), false, {
                from: ISSUER2
            });
            let moduleData = (await stGetter[1].getModulesByType(transferManagerKey))[1];
            I_SharedWhitelistTransferManager = await SharedWhitelistTransferManager.at(moduleData);

        });

        it("Should mint the second token to the affiliates", async () => {
            console.log(`
                Estimate gas cost for minting the tokens: ${await I_SecurityToken[1].issueMulti.estimateGas([AFFILIATE1, AFFILIATE2], [new BN(100).mul(new BN(10).pow(new BN(18))), new BN(10).pow(new BN(20))], {
                    from: ISSUER2
                })}
            `)

            await I_SecurityToken[1].issueMulti([AFFILIATE1, AFFILIATE2], [new BN(100).mul(new BN(10).pow(new BN(18))), new BN(10).pow(new BN(20))], {
                from: ISSUER2,
                gas: 6000000
            });
            assert.equal((await I_SecurityToken[1].balanceOf.call(AFFILIATE1)).div(new BN(10).pow(new BN(18))).toNumber(), 100);
            assert.equal((await I_SecurityToken[1].balanceOf.call(AFFILIATE2)).div(new BN(10).pow(new BN(18))).toNumber(), 100);
        });

        it("Should successfully attach the STO factory to the second security token", async () => {
            let bytesSTO = encodeModuleCall(STOParameters, [
                await latestTime() + duration.seconds(1000),
                await latestTime() + duration.days(40),
                cap,
                someString
            ]);
            const tx = await I_SecurityToken[1].addModule(I_DummySTOFactory.address, bytesSTO, new BN(0), new BN(0), false, { from: ISSUER2 });
            assert.equal(tx.logs[2].args._types[0].toNumber(), stoKey, "DummySTO doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name).replace(/\u0000/g, ""),
                "DummySTO",
                "DummySTOFactory module was not added"
            );
            I_DummySTO = await DummySTO.at(tx.logs[2].args._module);
        });

        it("Should successfully attach the permission manager factory to the first security token", async () => {
            const tx = await I_SecurityToken[0].addModule(I_GeneralPermissionManagerFactory.address, "0x0", new BN(0), new BN(0), false, { from: ISSUER1 });
            assert.equal(tx.logs[2].args._types[0].toNumber(), delegateManagerKey, "GeneralPermissionManager doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name).replace(/\u0000/g, ""),
                "GeneralPermissionManager",
                "GeneralPermissionManager module was not added"
            );
            I_GeneralPermissionManager[0] = await GeneralPermissionManager.at(tx.logs[2].args._module);
        });

        it("Should successfully attach the permission manager factory to the second security token", async () => {
            const tx = await I_SecurityToken[1].addModule(I_GeneralPermissionManagerFactory.address, "0x0", new BN(0), new BN(0), false, { from: ISSUER2 });
            assert.equal(tx.logs[2].args._types[0].toNumber(), delegateManagerKey, "GeneralPermissionManager doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name).replace(/\u0000/g, ""),
                "GeneralPermissionManager",
                "GeneralPermissionManager module was not added"
            );
            I_GeneralPermissionManager[1] = await GeneralPermissionManager.at(tx.logs[2].args._module);
        });

        it("should have transfer requirements initialized", async () => {
            let transferRestrions = await I_GeneralTransferManager[0].transferRequirements(0);
            assert.equal(transferRestrions[0], true);
            assert.equal(transferRestrions[1], true);
            assert.equal(transferRestrions[2], true);
            assert.equal(transferRestrions[3], true);
            transferRestrions = await I_GeneralTransferManager[0].transferRequirements(1);
            assert.equal(transferRestrions[0], false);
            assert.equal(transferRestrions[1], true);
            assert.equal(transferRestrions[2], false);
            assert.equal(transferRestrions[3], false);
            transferRestrions = await I_GeneralTransferManager[0].transferRequirements(2);
            assert.equal(transferRestrions[0], true);
            assert.equal(transferRestrions[1], false);
            assert.equal(transferRestrions[2], false);
            assert.equal(transferRestrions[3], false);

            transferRestrions = await I_GeneralTransferManager[1].transferRequirements(0);
            assert.equal(transferRestrions[0], true);
            assert.equal(transferRestrions[1], true);
            assert.equal(transferRestrions[2], true);
            assert.equal(transferRestrions[3], true);
            transferRestrions = await I_GeneralTransferManager[1].transferRequirements(1);
            assert.equal(transferRestrions[0], false);
            assert.equal(transferRestrions[1], true);
            assert.equal(transferRestrions[2], false);
            assert.equal(transferRestrions[3], false);
            transferRestrions = await I_GeneralTransferManager[1].transferRequirements(2);
            assert.equal(transferRestrions[0], true);
            assert.equal(transferRestrions[1], false);
            assert.equal(transferRestrions[2], false);
            assert.equal(transferRestrions[3], false);

            transferRestrions = await I_SharedWhitelistTransferManager.transferRequirements(0);
            assert.equal(transferRestrions[0], true);
            assert.equal(transferRestrions[1], true);
            assert.equal(transferRestrions[2], true);
            assert.equal(transferRestrions[3], true);
            transferRestrions = await I_SharedWhitelistTransferManager.transferRequirements(1);
            assert.equal(transferRestrions[0], false);
            assert.equal(transferRestrions[1], true);
            assert.equal(transferRestrions[2], false);
            assert.equal(transferRestrions[3], false);
            transferRestrions = await I_SharedWhitelistTransferManager.transferRequirements(2);
            assert.equal(transferRestrions[0], true);
            assert.equal(transferRestrions[1], false);
            assert.equal(transferRestrions[2], false);
            assert.equal(transferRestrions[3], false);
        });

        it("should not allow unauthorized people to change transfer requirements", async () => {
            await catchRevert(
                I_SharedWhitelistTransferManager.modifyTransferRequirementsMulti(
                    [0, 1, 2],
                    [true, false, true],
                    [true, true, false],
                    [false, false, false],
                    [false, false, false],
                    { from: INVESTOR1 }
                )
            );
            await catchRevert(I_SharedWhitelistTransferManager.modifyTransferRequirements(0, false, false, false, false, { from: INVESTOR1 }));
        });
    });

    describe("Buy tokens using on-chain whitelist", async () => {
        it("Should buy the tokens -- Failed due to investor is not in the whitelist", async () => {
            await catchRevert(I_DummySTO.generateTokens(INVESTOR1, new BN(web3.utils.toWei("1", "ether")), { from: ISSUER2 }));
        });

        it("Should Buy the second tokens from the STO", async () => {
            // Add the Investor in to the first token whitelist

            let tx = await I_GeneralTransferManager[0].modifyKYCData(
                INVESTOR1,
                currentTime,
                currentTime,
                currentTime.add(new BN(duration.days(10))),
                {
                    from: ISSUER1,
                    gas: 6000000
                }
            );

            assert.equal(
                tx.logs[0].args._investor.toLowerCase(),
                INVESTOR1.toLowerCase(),
                "Failed in adding the investor in whitelist"
            );

            // Jump time
            await increaseTime(5000);

            // Mint some tokens
            console.log(
                `Gas usage of minting of tokens: ${await I_DummySTO.generateTokens.estimateGas(INVESTOR1, new BN(web3.utils.toWei("1", "ether")), { from: ISSUER2 })}`
            )
            await I_DummySTO.generateTokens(INVESTOR1, new BN(web3.utils.toWei("1", "ether")), { from: ISSUER2 });

            assert.equal((await I_SecurityToken[1].balanceOf(INVESTOR1)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
        });

        it("Should Buy second tokens for AFFILIATE1 from the STO", async () => {
            await I_DummySTO.generateTokens(AFFILIATE1, new BN(web3.utils.toWei("1", "ether")), { from: ISSUER2 });
        });

        it("Should Set canNotBuyFromSto flag for the affiliates through the second token GTM", async () => {
            // Set canNotBuyFromSto flags for Affiliates
            await I_GeneralTransferManager[1].modifyInvestorFlagMulti([AFFILIATE1, AFFILIATE2], [1, 1], [true, true], { from: ISSUER2 });
            assert.equal(await I_GeneralTransferManager[1].getInvestorFlag(AFFILIATE1, 1), true);
            assert.equal(await I_GeneralTransferManager[1].getInvestorFlag(AFFILIATE2, 1), true);
        });

        it("Should fail in buying the second token from the STO for AFFILIATE1", async () => {
            await catchRevert(I_DummySTO.generateTokens(AFFILIATE1, new BN(web3.utils.toWei("1", "ether")), { from: ISSUER2 }));
        });

        it("Should fail in buying the tokens from the STO -- because amount is 0", async () => {
            await catchRevert(I_DummySTO.generateTokens(INVESTOR1, new BN(0), { from: ISSUER2 }));
        });

        it("Should fail in buying the tokens from the STO -- because STO is paused", async () => {
            await I_DummySTO.pause({ from: ISSUER2 });
            await catchRevert(I_DummySTO.generateTokens(INVESTOR1, new BN(web3.utils.toWei("1", "ether")), { from: ISSUER2 }));
            // Reverting the changes releated to pause
            await I_DummySTO.unpause({ from: ISSUER2 });
        });

        it("Should buy more tokens from the STO to INVESTOR1", async () => {
            await I_DummySTO.generateTokens(INVESTOR1, new BN(web3.utils.toWei("1", "ether")), { from: ISSUER2 });
            assert.equal((await I_SecurityToken[1].balanceOf(INVESTOR1)).toString(), new BN(web3.utils.toWei("2", "ether")).toString());
        });

        it("Should fail in investing the money in STO -- expiry limit reached", async () => {
            await increaseTime(duration.days(10));

            await catchRevert(I_DummySTO.generateTokens(INVESTOR1, new BN(web3.utils.toWei("1", "ether")), { from: ISSUER2 }));
        });
    });

    describe("Transfer tokens using on-chain shared whitelist from the first token", async () => {

        it("Should transfer the second tokens from INVESTOR1 to INVESTOR2", async () => {
            // Add the Investor in to the whitelist
            // snap_id = await takeSnapshot();
            let tx = await I_GeneralTransferManager[0].modifyKYCData(INVESTOR1, new BN(0), new BN(0), currentTime.add(new BN(duration.days(20))), {
                from: ISSUER1,
                gas: 6000000
            });

            assert.equal(
                tx.logs[0].args._investor.toLowerCase(),
                INVESTOR1.toLowerCase(),
                "Failed in adding the investor in whitelist"
            );

            tx = await I_GeneralTransferManager[0].modifyKYCData(
                INVESTOR2,
                currentTime,
                currentTime,
                currentTime.add(new BN(duration.days(20))),
                {
                    from: ISSUER1,
                    gas: 6000000
                }
            );

            assert.equal(
                tx.logs[0].args._investor.toLowerCase(),
                INVESTOR2.toLowerCase(),
                "Failed in adding the investor in whitelist"
            );

            // Jump time
            await increaseTime(5000);

            // Can transfer tokens
            await I_SecurityToken[1].transfer(INVESTOR2, new BN(web3.utils.toWei("1", "ether")), { from: INVESTOR1 });
            assert.equal((await I_SecurityToken[1].balanceOf(INVESTOR1)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
            assert.equal((await I_SecurityToken[1].balanceOf(INVESTOR2)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
        });

        it("Add a from default and check transfers are disabled -- failed to disable, defaults from first token GTM are not applied to second token SWTM", async () => {
            let snap_id = await takeSnapshot();

            let tx = await I_GeneralTransferManager[0].changeDefaults(currentTime.add(new BN(duration.days(12))), new BN(0), { from: ISSUER1 });
            await I_SecurityToken[1].transfer(INVESTOR1, new BN(web3.utils.toWei("1", "ether")), { from: INVESTOR2 });
            await I_SecurityToken[1].transfer(INVESTOR2, new BN(web3.utils.toWei("1", "ether")), { from: INVESTOR1 });

            await revertToSnapshot(snap_id);
        });

        it("Add a from default to SWTM and check transfers are disabled then enabled in the future", async () => {
            let tx = await I_SharedWhitelistTransferManager.changeDefaults(currentTime.add(new BN(duration.days(12))), new BN(0), { from: ISSUER2 });
            await I_SecurityToken[1].transfer(INVESTOR1, new BN(web3.utils.toWei("1", "ether")), { from: INVESTOR2 });
            await catchRevert(I_SecurityToken[1].transfer(INVESTOR2, new BN(web3.utils.toWei("1", "ether")), { from: INVESTOR1 }));
            await increaseTime(duration.days(5));
            await I_SecurityToken[1].transfer(INVESTOR2, new BN(web3.utils.toWei("1", "ether")), { from: INVESTOR1 });
        });

        it("Add a to default and check transfers are disabled -- failed to disable, defaults from first token GTM are not applied to second token SWTM", async () => {
            let snap_id = await takeSnapshot();

            let tx = await I_GeneralTransferManager[0].changeDefaults(0, currentTime.add(new BN(duration.days(16))), { from: ISSUER1 });
            await I_SecurityToken[1].transfer(INVESTOR1, new BN(web3.utils.toWei("1", "ether")), { from: INVESTOR2 });
            await I_SecurityToken[1].transfer(INVESTOR2, new BN(web3.utils.toWei("1", "ether")), { from: INVESTOR1 });

            await revertToSnapshot(snap_id);
        });

        it("Add a to default to SWTM and check transfers are disabled then enabled in the future", async () => {
            let tx = await I_SharedWhitelistTransferManager.changeDefaults(0, currentTime.add(new BN(duration.days(16))), { from: ISSUER2 });
            await catchRevert(I_SecurityToken[1].transfer(INVESTOR1, new BN(web3.utils.toWei("1", "ether")), { from: INVESTOR2 }));
            await I_SecurityToken[1].transfer(INVESTOR2, new BN(web3.utils.toWei("1", "ether")), { from: INVESTOR1 });
            await increaseTime(duration.days(2));
            await I_SecurityToken[1].transfer(INVESTOR1, new BN(web3.utils.toWei("1", "ether")), { from: INVESTOR2 });
            // Revert changes
            await I_GeneralTransferManager[0].modifyKYCData(INVESTOR2, new BN(0), new BN(0), new BN(0), {
                from: ISSUER1,
                gas: 6000000
            });
            await I_GeneralTransferManager[0].changeDefaults(0, new BN(0), { from: ISSUER1 });
            await I_SharedWhitelistTransferManager.changeDefaults(0, new BN(0), { from: ISSUER2 });
        });

    });

    describe("Test miscellaneous functions", async () => {

        it("Should change with Share Whitelist -- failed address zero", async () => {
            await catchRevert(I_SharedWhitelistTransferManager.changeDataStore(address_zero, { from: ISSUER2}));
        });

        it("Should change with Share Whitelist -- failed invalid permission", async () => {
            await catchRevert(I_SharedWhitelistTransferManager.changeDataStore(INVESTOR1, { from: INVESTOR1}));
        });

        it("Should change with Share Whitelist", async () => {
            let snap_id = await takeSnapshot();

            await I_SharedWhitelistTransferManager.changeDataStore(INVESTOR1, { from: ISSUER2});
            let whitelist = await I_SharedWhitelistTransferManager.whitelistDataStore.call();
            assert.equal(whitelist, INVESTOR1, "New whitelist address not set")

            await revertToSnapshot(snap_id);
        });

        it("Should get the permission", async () => {
            let perm = await I_SharedWhitelistTransferManager.getPermissions.call();
            assert.equal(web3.utils.toAscii(perm[0]).replace(/\u0000/g, ""), "ADMIN");
        });

        it("Should set a usage fee for the SWTM", async () => {
            // Fail due to wrong owner
            await catchRevert(I_SharedWhitelistTransferManagerFactory.changeUsageCost(new BN(web3.utils.toWei("1", "ether")), { from: ISSUER1}));
            await I_SharedWhitelistTransferManagerFactory.changeUsageCost(new BN(web3.utils.toWei("1", "ether")), { from: POLYMATH });
        });

        it("Should fail to pull fees as no budget set", async () => {
            await catchRevert(I_SharedWhitelistTransferManager.takeUsageFee( { from: POLYMATH }));
        });

        it("Should set a budget for the SharedWhitelistTransferManager", async () => {
            await I_SecurityToken[1].changeModuleBudget(I_SharedWhitelistTransferManager.address, new BN(10).pow(new BN(19)), true, { from: ISSUER2 });
            await catchRevert(I_SharedWhitelistTransferManager.takeUsageFee({ from: ISSUER2 }));
            await I_PolyToken.getTokens(new BN(10).pow(new BN(19)), ISSUER2);
            await I_PolyToken.transfer(I_SecurityToken[1].address, new BN(10).pow(new BN(19)), { from: ISSUER2 });
        });

        it("Factory owner should pull fees - fails as not permissioned by issuer", async () => {
            await catchRevert(I_SharedWhitelistTransferManager.takeUsageFee({ from: DELEGATE }));
        });

        it("Module owner should pull fees", async () => {
            let log = await I_GeneralPermissionManager[1].addDelegate(DELEGATE, web3.utils.fromAscii("My details"), { from: ISSUER2 });
            assert.equal(log.logs[0].args._delegate, DELEGATE);

            await I_GeneralPermissionManager[1].changePermission(DELEGATE, I_SharedWhitelistTransferManager.address, web3.utils.fromAscii("ADMIN"), true, {
                from: ISSUER2
            });
            let balanceBefore = await I_PolyToken.balanceOf(POLYMATH);
            await I_SharedWhitelistTransferManager.takeUsageFee({ from: DELEGATE });
            let balanceAfter = await I_PolyToken.balanceOf(POLYMATH);

            assert.equal(balanceBefore.add(new BN(web3.utils.toWei("1", "ether"))).toString(), balanceAfter.toString(), "Fee is transferred");
        });

        it("Should allow authorized people to modify transfer requirements", async () => {
            await I_SharedWhitelistTransferManager.modifyTransferRequirements(0, false, true, false, false, { from: ISSUER2 });
            let transferRestrions = await I_SharedWhitelistTransferManager.transferRequirements(0);
            assert.equal(transferRestrions[0], false);
            assert.equal(transferRestrions[1], true);
            assert.equal(transferRestrions[2], false);
            assert.equal(transferRestrions[3], false);
        });

        it("Should pause and fail in trasfering the tokens", async () => {
            await I_SharedWhitelistTransferManager.modifyTransferRequirementsMulti(
                [0, 1, 2],
                [true, false, true],
                [true, true, false],
                [false, false, false],
                [false, false, false],
                { from: ISSUER2 }
            );
            await I_SharedWhitelistTransferManager.pause({ from: ISSUER2 });
            await catchRevert(I_SecurityToken[1].transfer(INVESTOR1, new BN(web3.utils.toWei("2", "ether")), { from: INVESTOR2 }));
        });

        it("Should change the Issuance address", async () => {
            let tx = await I_SharedWhitelistTransferManager.changeIssuanceAddress(INVESTOR2, { from: DELEGATE });
            assert.equal(tx.logs[0].args._issuanceAddress, INVESTOR2);
        });

        it("Should unpause the transfers", async () => {
            await I_SharedWhitelistTransferManager.unpause({ from: ISSUER2 });

            assert.isFalse(await I_SharedWhitelistTransferManager.paused.call());
        });
    });

    describe("Test cases for the getTokensByPartition", async() => {

        it("Should check the partition balance before changing the canSendAfter & canReceiveAfter", async() => {
            assert.equal(web3.utils.fromWei((await I_SecurityToken[1].balanceOf.call(INVESTOR2)).toString()), 1);
            assert.equal(web3.utils.fromWei(
                (
                    await I_SharedWhitelistTransferManager.getTokensByPartition.call(web3.utils.toHex("LOCKED"), INVESTOR2, new BN(0))
                ).toString()
                ),
                0
            );
            assert.equal(
                web3.utils.fromWei(
                (
                    await I_SharedWhitelistTransferManager.getTokensByPartition.call(web3.utils.toHex("UNLOCKED"), INVESTOR2, new BN(0))
                ).toString()
                ),
                1
            );
        });

        it("Should change the canSendAfter and canRecieveAfter of the investor2", async() => {
            let canSendAfter = await latestTime() + duration.days(10);
            let canRecieveAfter = await latestTime() + duration.days(10);
            let expiryTime = await latestTime() + duration.days(100);

            let tx = await I_GeneralTransferManager[0].modifyKYCData(
                INVESTOR2,
                canSendAfter,
                canRecieveAfter,
                expiryTime,
                {
                    from: ISSUER1,
                    gas: 6000000
                }
            );
            assert.equal(tx.logs[0].args._investor, INVESTOR2);
            assert.equal(
                web3.utils.fromWei(
                (
                    await I_SharedWhitelistTransferManager.getTokensByPartition.call(web3.utils.toHex("LOCKED"), INVESTOR2, new BN(0))
                ).toString()
                ),
                1
            );

            assert.equal(
                web3.utils.fromWei(
                (
                    await I_SharedWhitelistTransferManager.getTokensByPartition.call(web3.utils.toHex("UNLOCKED"), INVESTOR2, new BN(0))
                ).toString()
                ),
                0
            );
        });

        it("Should check the values of partition balance after the SWTM pause", async() => {
            await I_SharedWhitelistTransferManager.pause({from: ISSUER2});
            assert.equal(
                web3.utils.fromWei(
                (
                    await I_SharedWhitelistTransferManager.getTokensByPartition.call(web3.utils.toHex("LOCKED"), INVESTOR2, new BN(0))
                ).toString()
                ),
                0
            );

            assert.equal(
                web3.utils.fromWei(
                (
                    await I_SharedWhitelistTransferManager.getTokensByPartition.call(web3.utils.toHex("UNLOCKED"), INVESTOR2, new BN(0))
                ).toString()
                ),
                1
            );
            await I_SharedWhitelistTransferManager.unpause({from: ISSUER2});
        })
    });

    describe("Shared Whitelist Transfer Manager Factory test cases", async () => {

        it("Should get the exact details of the factory", async () => {
            assert.equal(await I_SharedWhitelistTransferManagerFactory.setupCost.call(), 0);
            assert.equal((await I_SharedWhitelistTransferManagerFactory.types.call())[0], 2);
            assert.equal(
                web3.utils.toAscii(await I_SharedWhitelistTransferManagerFactory.name.call()).replace(/\u0000/g, ""),
                "SharedWhitelistTransferManager",
                "Wrong Module added"
            );
            assert.equal(
                await I_SharedWhitelistTransferManagerFactory.description.call(),
                "Manage transfers using a shared time based whitelist",
                "Wrong Module added"
            );
            assert.equal(await I_SharedWhitelistTransferManagerFactory.title.call(), "Share Whitelist Transfer Manager", "Wrong Module added");
            assert.equal(await I_SharedWhitelistTransferManagerFactory.version.call(), "3.0.0");
        });

        it("Should get the tags of the factory", async () => {
            let tags = await I_SharedWhitelistTransferManagerFactory.tags.call();
            assert.equal(web3.utils.toAscii(tags[0]).replace(/\u0000/g, ""), "Shared Whitelist");
        });
    });

});
