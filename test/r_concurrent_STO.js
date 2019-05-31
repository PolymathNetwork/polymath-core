import latestTime from "./helpers/latestTime";
import { duration, promisifyLogWatch, latestBlock } from "./helpers/utils";
import { takeSnapshot, increaseTime, revertToSnapshot } from "./helpers/time";
import { encodeProxyCall, encodeModuleCall } from "./helpers/encodeCall";
import {
    setUpPolymathNetwork,
    deployDummySTOAndVerifyed,
    deployCappedSTOAndVerifyed,
    deployPresaleSTOAndVerified
} from "./helpers/createInstances";

// Import contract ABIs
const CappedSTO = artifacts.require("./CappedSTO.sol");
const DummySTO = artifacts.require("./DummySTO.sol");
const PreSaleSTO = artifacts.require("./PreSaleSTO.sol");
const SecurityToken = artifacts.require("./SecurityToken.sol");
const GeneralTransferManager = artifacts.require("./GeneralTransferManager");
const STGetter = artifacts.require("./STGetter.sol");

const Web3 = require("web3");
let BN = Web3.utils.BN;
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port

contract("Concurrent STO", async (accounts) => {
    // Accounts variable declaration
    let account_polymath;
    let account_issuer;
    let account_fundsReceiver;
    let account_investor1;
    let account_investor2;
    let account_investor3;

    // Contract instance declaration
    let I_SecurityTokenRegistryProxy;
    let I_GeneralPermissionManager;
    let I_GeneralTransferManagerFactory;
    let I_GeneralTransferManager;
    let I_ModuleRegistryProxy;
    let I_ModuleRegistry;
    let I_FeatureRegistry;
    let I_STFactory;
    let I_MRProxied;
    let I_STRProxied;
    let I_SecurityTokenRegistry;
    let I_SecurityToken;
    let I_PolyToken;
    let I_PolymathRegistry;
    let I_STRGetter;
    let I_STGetter;
    let stGetter;

    // STO instance declaration
    let I_CappedSTOFactory;
    let I_DummySTOFactory;
    let I_PreSaleSTOFactory;
    let I_STO_Array = [];

    // Error message
    let message = "Transaction Should Fail!";

    // Initial fees
    const initRegFee = new BN(web3.utils.toWei("1000"));
    const STOSetupCost = web3.utils.toHex(200 * Math.pow(10, 18));
    const STOSetupCostPOLY = web3.utils.toHex(800 * Math.pow(10, 18));

    // Module keys
    const transferManagerKey = 2;
    const stoKey = 3;

    // Configure function signature for STO deployment

    const CappedSTOParameters = ["uint256", "uint256", "uint256", "uint256", "uint8[]", "address"];
    const DummySTOParameters = ["uint256", "uint256", "uint256", "string"];
    const PresaleSTOParameters = ["uint256"];

    let currentTime;
    const address_zero = "0x0000000000000000000000000000000000000000";
    const one_address = "0x0000000000000000000000000000000000000001";

    before(async () => {
        currentTime = new BN(await latestTime());
        account_polymath = accounts[0];
        account_issuer = accounts[1];
        account_fundsReceiver = accounts[2];
        account_investor1 = accounts[3];
        account_investor2 = accounts[4];
        account_investor3 = accounts[5];

       // Step:1 Create the polymath ecosystem contract instances
       let instances = await setUpPolymathNetwork(account_polymath, account_issuer);

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

        // STEP 2: Deploy the STO Factories

        [I_CappedSTOFactory] = await deployCappedSTOAndVerifyed(account_polymath, I_MRProxied, STOSetupCost);
        [I_DummySTOFactory] = await deployDummySTOAndVerifyed(account_polymath, I_MRProxied, STOSetupCost);
        [I_PreSaleSTOFactory] = await deployPresaleSTOAndVerified(account_polymath, I_MRProxied, STOSetupCost);

        // Printing all the contract addresses
        console.log(`
        --------------------- Polymath Network Smart Contracts: ---------------------
        PolymathRegistry:                  ${I_PolymathRegistry.address}
        SecurityTokenRegistryProxy:        ${I_SecurityTokenRegistryProxy.address}
        SecurityTokenRegistry:             ${I_SecurityTokenRegistry.address}
        ModuleRegistry:                    ${I_ModuleRegistry.address}
        ModuleRegistryProxy:               ${I_ModuleRegistryProxy.address}
        FeatureRegistry:                   ${I_FeatureRegistry.address}

        STFactory:                         ${I_STFactory.address}
        GeneralTransferManagerFactory:     ${I_GeneralTransferManagerFactory.address}

        CappedSTOFactory:                  ${I_CappedSTOFactory.address}
        -----------------------------------------------------------------------------
        `);
    });

    describe("Generate Security Token", async () => {
        // SecurityToken Details for funds raise Type ETH
        const name = "Team";
        const symbol = "SAP";
        const tokenDetails = "This is equity type of issuance";
        const decimals = 18;

        it("Should register the ticker before the generation of the security token", async () => {
            await I_PolyToken.getTokens(initRegFee, account_issuer);
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: account_issuer });
            let tx = await I_STRProxied.registerNewTicker(account_issuer, symbol, { from: account_issuer });
            assert.equal(tx.logs[0].args._owner, account_issuer);
            assert.equal(tx.logs[0].args._ticker, symbol);
        });

        it("Should generate the new security token with the same symbol as registered above", async () => {
            await I_PolyToken.getTokens(initRegFee, account_issuer);
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: account_issuer });

            let tx = await I_STRProxied.generateNewSecurityToken(name, symbol, tokenDetails, false, account_issuer, 0, { from: account_issuer });
            assert.equal(tx.logs[1].args._ticker, symbol, "SecurityToken doesn't get deployed");

            I_SecurityToken = await SecurityToken.at(tx.logs[1].args._securityTokenAddress);
            stGetter = await STGetter.at(I_SecurityToken.address);
            assert.equal(await stGetter.getTreasuryWallet.call(), account_issuer, "Incorrect wallet set");
            const log = (await I_SecurityToken.getPastEvents('ModuleAdded', {filter: {transactionHash: tx.transactionHash}}))[0];

            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._types[0].toNumber(), transferManagerKey);
            assert.equal(web3.utils.hexToString(log.args._name), "GeneralTransferManager");
        });

        it("Should initialize the auto attached modules", async () => {
            let moduleData = (await stGetter.getModulesByType(transferManagerKey))[0];
            I_GeneralTransferManager = await GeneralTransferManager.at(moduleData);
        });

        it("Should whitelist account_investor1", async () => {
            let fromTime = await latestTime();
            let toTime = await latestTime() + duration.days(15);
            let expiryTime = toTime + duration.days(100);
            let canBuyFromSTO = true;

            let tx = await I_GeneralTransferManager.modifyKYCData(account_investor1, fromTime, toTime, expiryTime, {
                from: account_issuer,
                gas: 500000
            });

            assert.equal(tx.logs[0].args._investor, account_investor1, "Failed in adding the investor in whitelist");
        });
    });

    describe("Add STO and verify transfer", async () => {
        it("Should attach STO modules up to the max number, then fail", async () => {
            const MAX_MODULES = 10;
            const startTime = await latestTime() + duration.days(1);
            const endTime = await latestTime() + duration.days(90);
            const cap = new BN(web3.utils.toWei("10000"));
            const rate = new BN(web3.utils.toWei("1000"));
            const fundRaiseType = [0];
            const budget = 0;
            const maxCost = STOSetupCostPOLY;
            const cappedBytesSig = encodeModuleCall(CappedSTOParameters, [
                startTime,
                endTime,
                cap,
                rate,
                fundRaiseType,
                account_fundsReceiver
            ]);
            const dummyBytesSig = encodeModuleCall(DummySTOParameters, [startTime, endTime, cap, "Hello"]);
            const presaleBytesSig = encodeModuleCall(PresaleSTOParameters, [endTime]);

            for (var STOIndex = 0; STOIndex < MAX_MODULES; STOIndex++) {
                await I_PolyToken.getTokens(STOSetupCostPOLY, account_issuer);
                await I_PolyToken.transfer(I_SecurityToken.address, STOSetupCostPOLY, { from: account_issuer });
                switch (STOIndex % 3) {
                    case 0:
                        // Capped STO
                        let tx1 = await I_SecurityToken.addModule(I_CappedSTOFactory.address, cappedBytesSig, maxCost, budget, false, {
                            from: account_issuer
                        });
                        assert.equal(tx1.logs[3].args._types[0], stoKey, `Wrong module type added at index ${STOIndex}`);
                        assert.equal(
                            web3.utils.hexToString(tx1.logs[3].args._name),
                            "CappedSTO",
                            `Wrong STO module added at index ${STOIndex}`
                        );
                        I_STO_Array.push(await CappedSTO.at(tx1.logs[3].args._module));
                        break;
                    case 1:
                        // Dummy STO
                        let tx2 = await I_SecurityToken.addModule(I_DummySTOFactory.address, dummyBytesSig, maxCost, budget, false, {
                            from: account_issuer
                        });
                        assert.equal(tx2.logs[3].args._types[0], stoKey, `Wrong module type added at index ${STOIndex}`);
                        assert.equal(
                            web3.utils.hexToString(tx2.logs[3].args._name),
                            "DummySTO",
                            `Wrong STO module added at index ${STOIndex}`
                        );
                        I_STO_Array.push(await DummySTO.at(tx2.logs[3].args._module));
                        break;
                    case 2:
                        // Pre Sale STO
                        let tx3 = await I_SecurityToken.addModule(I_PreSaleSTOFactory.address, presaleBytesSig, maxCost, budget, false, {
                            from: account_issuer
                        });
                        assert.equal(tx3.logs[3].args._types[0], stoKey, `Wrong module type added at index ${STOIndex}`);
                        assert.equal(
                            web3.utils.hexToString(tx3.logs[3].args._name),
                            "PreSaleSTO",
                            `Wrong STO module added at index ${STOIndex}`
                        );
                        I_STO_Array.push(await PreSaleSTO.at(tx3.logs[3].args._module));
                        break;
                }
            }
        });

        it("Should successfully invest in all modules attached", async () => {
            const MAX_MODULES = 10;
            await increaseTime(duration.days(2));
            for (var STOIndex = 0; STOIndex < MAX_MODULES; STOIndex++) {
                switch (STOIndex % 3) {
                    case 0:
                        // Capped STO ETH
                        await I_STO_Array[STOIndex].buyTokens(account_investor1, {
                            from: account_investor1,
                            value: new BN(web3.utils.toWei("1", "ether"))
                        });
                        assert.equal(web3.utils.fromWei((await I_STO_Array[STOIndex].getRaised.call(0)).toString()), 1);
                        assert.equal(await I_STO_Array[STOIndex].investorCount.call(), 1);
                        break;
                    case 1:
                        // Dummy STO
                        await I_STO_Array[STOIndex].generateTokens(account_investor1, new BN(web3.utils.toWei("1000")), { from: account_issuer });
                        assert.equal(await I_STO_Array[STOIndex].investorCount.call(), 1);
                        assert.equal(
                            (await I_STO_Array[STOIndex].investors.call(account_investor1))
                                .div(new BN(10).pow(new BN(18)))
                                .toNumber(),
                            1000
                        );
                        break;
                    case 2:
                        // Pre Sale STO
                        await I_STO_Array[STOIndex].allocateTokens(account_investor1, new BN(web3.utils.toWei("1000")), new BN(web3.utils.toWei("1")), new BN(0), {
                            from: account_issuer
                        });
                        assert.equal(web3.utils.fromWei((await I_STO_Array[STOIndex].getRaised.call(0)).toString()), 1);
                        assert.equal(web3.utils.fromWei((await I_STO_Array[STOIndex].getRaised.call(1)).toString()), 0);
                        assert.equal(await I_STO_Array[STOIndex].investorCount.call(), 1);
                        assert.equal(
                            (await I_STO_Array[STOIndex].investors.call(account_investor1))
                                .div(new BN(10).pow(new BN(18)))
                                .toNumber(),
                            1000
                        );
                        break;
                }
            }
        });
    });
});
