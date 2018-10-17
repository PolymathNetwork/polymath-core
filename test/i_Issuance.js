import latestTime from "./helpers/latestTime";
import { duration, ensureException, promisifyLogWatch, latestBlock } from "./helpers/utils";
import takeSnapshot, { increaseTime, revertToSnapshot } from "./helpers/time";
import { encodeProxyCall, encodeModuleCall } from "./helpers/encodeCall";
import { setUpPolymathNetwork, deployCappedSTOAndVerifyed, deployGPMAndVerifyed } from "./helpers/createInstances";

const CappedSTOFactory = artifacts.require("./CappedSTOFactory.sol");
const CappedSTO = artifacts.require("./CappedSTO.sol");
const SecurityToken = artifacts.require("./SecurityToken.sol");
const GeneralTransferManager = artifacts.require("./GeneralTransferManager");
const GeneralPermissionManager = artifacts.require("./GeneralPermissionManager");

const Web3 = require("web3");
const BigNumber = require("bignumber.js");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port

contract("Issuance", accounts => {
    // Accounts Variable declaration
    let account_polymath;
    let account_investor1;
    let account_issuer;
    let token_owner;
    let account_investor2;
    let account_fundsReceiver;
    let account_delegate;
    let blockNo;
    let balanceOfReceiver;
    let message = "Transaction Should Fail!";
    const TM_Perm = "WHITELIST";
    const delegateDetails = "I am delegate";
    // investor Details
    let fromTime = latestTime();
    let toTime = latestTime() + duration.days(15);
    let expiryTime = toTime + duration.days(100);

    // Contract Instance Declaration
    let I_GeneralPermissionManagerFactory;
    let I_SecurityTokenRegistryProxy;
    let I_GeneralTransferManagerFactory;
    let I_GeneralPermissionManager;
    let I_GeneralTransferManager;
    let I_ModuleRegistryProxy;
    let I_ModuleRegistry;
    let I_FeatureRegistry;
    let I_SecurityTokenRegistry;
    let I_CappedSTOFactory;
    let I_MRProxied;
    let I_STRProxied;
    let I_STFactory;
    let I_SecurityToken;
    let I_CappedSTO;
    let I_PolyToken;
    let I_PolymathRegistry;

    // SecurityToken Details (Launched ST on the behalf of the issuer)
    const name = "Demo Token";
    const symbol = "DET";
    const tokenDetails = "This is equity type of issuance";
    const decimals = 18;

    // Module key
    const permissionManagerKey = 1;
    const transferManagerKey = 2;
    const stoKey = 3;
    const budget = 0;
    const address_zero = "0x0000000000000000000000000000000000000000";

    // Initial fee for ticker registry and security token registry
    const initRegFee = web3.utils.toWei("250");

    // Capped STO details
    //let startTime;           // Start time will be 5000 seconds more than the latest time
    //let endTime;                    // Add 30 days more
    const cap = web3.utils.toWei("10000");
    const rate = 1000;
    const fundRaiseType = [0];
    const cappedSTOSetupCost = web3.utils.toWei("20000", "ether");
    const maxCost = cappedSTOSetupCost;
    const STOParameters = ["uint256", "uint256", "uint256", "uint256", "uint8[]", "address"];
    const STRProxyParameters = ["address", "address", "uint256", "uint256", "address", "address"];
    const MRProxyParameters = ["address", "address"];

    before(async () => {
        // Accounts setup
        account_polymath = accounts[0];
        account_issuer = accounts[1];
        account_investor1 = accounts[3];
        account_investor2 = accounts[2];
        account_fundsReceiver = accounts[4];
        account_delegate = accounts[5];
        token_owner = account_issuer;

        // Step 1: Deploy the genral PM ecosystem
        let instances = await setUpPolymathNetwork(account_polymath, token_owner);

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

        // STEP 2: Deploy the GeneralDelegateManagerFactory
        [I_GeneralPermissionManagerFactory] = await deployGPMAndVerifyed(account_polymath, I_MRProxied, I_PolyToken.address, 0);
        // STEP 3: Deploy the CappedSTOFactory
        [I_CappedSTOFactory] = await deployCappedSTOAndVerifyed(account_polymath, I_MRProxied, I_PolyToken.address, 0);

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
        GeneralPermissionManagerFactory:   ${I_GeneralPermissionManagerFactory.address}

        CappedSTOFactory:                  ${I_CappedSTOFactory.address}
        -----------------------------------------------------------------------------
        `);
    });

    describe("Launch SecurityToken & STO on the behalf of the issuer", async () => {

        describe("Create securityToken for the issuer by the polymath", async () => {

            it("POLYMATH: Should register the ticker before the generation of the security token", async () => {
                await I_PolyToken.getTokens(10000 * Math.pow(10, 18), account_polymath);
                await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: account_polymath });
                let tx = await I_STRProxied.registerTicker(account_polymath, symbol, name, { from: account_polymath });
                assert.equal(tx.logs[0].args._owner, account_polymath);
                assert.equal(tx.logs[0].args._ticker, symbol);
            });

            it("POLYMATH: Should generate the new security token with the same symbol as registered above", async () => {
                await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: account_polymath });
                let _blockNo = latestBlock();
                let tx = await I_STRProxied.generateSecurityToken(name, symbol, tokenDetails, false, { from: account_polymath });

                // Verify the successful generation of the security token
                assert.equal(tx.logs[1].args._ticker, symbol, "SecurityToken doesn't get deployed");

                I_SecurityToken = SecurityToken.at(tx.logs[1].args._securityTokenAddress);

                const log = await promisifyLogWatch(I_SecurityToken.ModuleAdded({ from: _blockNo }), 1);

                // Verify that GeneralTransferManager module get added successfully or not
                assert.equal(log.args._types[0].toNumber(), transferManagerKey);
                assert.equal(web3.utils.toAscii(log.args._name).replace(/\u0000/g, ""), "GeneralTransferManager");
            });

            it("POLYMATH: Should intialize the auto attached modules", async () => {
                let moduleData = (await I_SecurityToken.getModulesByType(transferManagerKey))[0];
                I_GeneralTransferManager = GeneralTransferManager.at(moduleData);
            });

            it("POLYMATH: Should successfully attach the STO factory with the security token", async () => {
                // STEP 4: Deploy the CappedSTOFactory

                I_CappedSTOFactory = await CappedSTOFactory.new(I_PolyToken.address, cappedSTOSetupCost, 0, 0, { from: account_polymath });

                assert.notEqual(
                    I_CappedSTOFactory.address.valueOf(),
                    address_zero,
                    "CappedSTOFactory contract was not deployed"
                );

                // (C) : Register the STOFactory
                await I_MRProxied.registerModule(I_CappedSTOFactory.address, { from: account_polymath });
                await I_MRProxied.verifyModule(I_CappedSTOFactory.address, true, { from: account_polymath });

                let bytesSTO = encodeModuleCall(STOParameters, [
                    latestTime() + duration.seconds(5000),
                    latestTime() + duration.days(30),
                    cap,
                    rate,
                    fundRaiseType,
                    account_fundsReceiver
                ]);

                await I_PolyToken.getTokens(cappedSTOSetupCost, account_polymath);
                await I_PolyToken.transfer(I_SecurityToken.address, cappedSTOSetupCost, { from: account_polymath });

                const tx = await I_SecurityToken.addModule(I_CappedSTOFactory.address, bytesSTO, maxCost, 0, { from: account_polymath });

                assert.equal(tx.logs[3].args._types[0], stoKey, "CappedSTO doesn't get deployed");
                assert.equal(
                    web3.utils.toAscii(tx.logs[3].args._name).replace(/\u0000/g, ""),
                    "CappedSTO",
                    "CappedSTOFactory module was not added"
                );
                I_CappedSTO = CappedSTO.at(tx.logs[3].args._module);
            });
        });

        describe("Transfer Manager operations by the polymath_account", async () => {
            it("Should modify the whitelist", async () => {
                fromTime = latestTime();
                toTime = latestTime() + duration.days(15);
                expiryTime = toTime + duration.days(100);

                let tx = await I_GeneralTransferManager.modifyWhitelist(
                    account_investor1,
                    fromTime + duration.days(70),
                    toTime + duration.days(90),
                    expiryTime + duration.days(50),
                    true,
                    {
                        from: account_polymath
                    }
                );
                assert.equal(tx.logs[0].args._investor, account_investor1, "Failed in adding the investor in whitelist");
            });

            it("Should add the delegate with permission", async() => {
                 //First attach a permission manager to the token
                 await I_SecurityToken.addModule(I_GeneralPermissionManagerFactory.address, "", 0, 0, {from: account_polymath});
                 let moduleData = (await I_SecurityToken.getModulesByType(permissionManagerKey))[0];
                 I_GeneralPermissionManager = GeneralPermissionManager.at(moduleData);
                 // Add permission to the deletgate (A regesteration process)
                 await I_GeneralPermissionManager.addDelegate(account_delegate, delegateDetails, { from: account_polymath});
                 // Providing the permission to the delegate
                 await I_GeneralPermissionManager.changePermission(account_delegate, I_GeneralTransferManager.address, TM_Perm, true, { from: account_polymath });

                 assert.isTrue(await I_GeneralPermissionManager.checkPermission(account_delegate, I_GeneralTransferManager.address, TM_Perm));
            });

            it("POLYMATH: Should change the ownership of the SecurityToken", async () => {
                await I_SecurityToken.transferOwnership(token_owner, { from: account_polymath });

                assert.equal(await I_SecurityToken.owner.call(), token_owner);
            });
        });

        describe("Operations on the STO", async () => {
            it("Should Buy the tokens", async () => {
                balanceOfReceiver = await web3.eth.getBalance(account_fundsReceiver);
                blockNo = latestBlock();
                // Jump time
                await increaseTime(5000);
                // Fallback transaction
                await web3.eth.sendTransaction({
                    from: account_investor1,
                    to: I_CappedSTO.address,
                    gas: 6100000,
                    value: web3.utils.toWei("1", "ether")
                });

                assert.equal((await I_CappedSTO.getRaised.call(0)).dividedBy(new BigNumber(10).pow(18)).toNumber(), 1);

                assert.equal(await I_CappedSTO.investorCount.call(), 1);

                assert.equal((await I_SecurityToken.balanceOf(account_investor1)).dividedBy(new BigNumber(10).pow(18)).toNumber(), 1000);
            });

            it("Verification of the event Token Purchase", async () => {
                const log = await promisifyLogWatch(I_CappedSTO.TokenPurchase({ from: blockNo }), 1);
                assert.equal(log.args.purchaser, account_investor1, "Wrong address of the investor");
                assert.equal(log.args.amount.dividedBy(new BigNumber(10).pow(18)).toNumber(), 1000, "Wrong No. token get dilivered");
            });

            it("should add the investor into the whitelist by the delegate", async () => {
                let tx = await I_GeneralTransferManager.modifyWhitelist(account_investor2, fromTime, toTime, expiryTime, true, {
                    from: account_delegate,
                    gas: 7000000
                });
                assert.equal(tx.logs[0].args._investor, account_investor2, "Failed in adding the investor in whitelist");
            });

            it("Should buy the token", async () => {
                await web3.eth.sendTransaction({
                    from: account_investor2,
                    to: I_CappedSTO.address,
                    gas: 2100000,
                    value: web3.utils.toWei("1", "ether")
                });

                assert.equal((await I_CappedSTO.getRaised.call(0)).dividedBy(new BigNumber(10).pow(18)).toNumber(), 2);

                assert.equal(await I_CappedSTO.investorCount.call(), 2);

                assert.equal((await I_SecurityToken.balanceOf(account_investor2)).dividedBy(new BigNumber(10).pow(18)).toNumber(), 1000);
            });
        });
    });
});
