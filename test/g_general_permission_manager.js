import latestTime from "./helpers/latestTime";
import { signData } from "./helpers/signData";
import { pk } from "./helpers/testprivateKey";
import { duration, ensureException, promisifyLogWatch, latestBlock } from "./helpers/utils";
import takeSnapshot, { increaseTime, revertToSnapshot } from "./helpers/time";
import { encodeProxyCall, encodeModuleCall } from "./helpers/encodeCall";
import { catchRevert } from "./helpers/exceptions";
import { setUpPolymathNetwork, deployGPMAndVerifyed, deployDummySTOAndVerifyed } from "./helpers/createInstances";

const DummySTO = artifacts.require("./DummySTO.sol");
const SecurityToken = artifacts.require("./SecurityToken.sol");
const GeneralTransferManager = artifacts.require("./GeneralTransferManager");
const GeneralPermissionManager = artifacts.require("./GeneralPermissionManager");

const Web3 = require("web3");
const BigNumber = require("bignumber.js");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port

contract("GeneralPermissionManager", accounts => {
    // Accounts Variable declaration
    let account_polymath;
    let account_issuer;
    let token_owner;
    let token_owner_pk;
    let account_investor1;
    let account_investor2;
    let account_investor3;
    let account_investor4;
    let account_delegate;
    let account_delegate2;
    let account_delegate3;
    // investor Details
    let fromTime = latestTime();
    let toTime = latestTime();
    let expiryTime = toTime + duration.days(15);

    let message = "Transaction Should Fail!";

    // Contract Instance Declaration
    let I_GeneralPermissionManagerFactory;
    let P_GeneralPermissionManagerFactory;
    let I_SecurityTokenRegistryProxy;
    let P_GeneralPermissionManager;
    let I_GeneralTransferManagerFactory;
    let I_GeneralPermissionManager;
    let I_GeneralTransferManager;
    let I_ModuleRegistryProxy;
    let I_ModuleRegistry;
    let I_FeatureRegistry;
    let I_SecurityTokenRegistry;
    let I_DummySTOFactory;
    let I_STFactory;
    let I_SecurityToken;
    let I_MRProxied;
    let I_STRProxied;
    let I_DummySTO;
    let I_PolyToken;
    let I_PolymathRegistry;

    // SecurityToken Details
    const name = "Team";
    const symbol = "sap";
    const tokenDetails = "This is equity type of issuance";
    const decimals = 18;
    const contact = "team@polymath.network";
    const delegateDetails = "Hello I am legit delegate";

    // Module key
    const delegateManagerKey = 1;
    const transferManagerKey = 2;
    const stoKey = 3;

    // Initial fee for ticker registry and security token registry
    const initRegFee = web3.utils.toWei("250");

    // Dummy STO details
    const startTime = latestTime() + duration.seconds(5000); // Start time will be 5000 seconds more than the latest time
    const endTime = startTime + duration.days(80); // Add 80 days more
    const cap = web3.utils.toWei("10", "ether");
    const someString = "A string which is not used";
    const STOParameters = ["uint256", "uint256", "uint256", "string"];

    let bytesSTO = encodeModuleCall(STOParameters, [startTime, endTime, cap, someString]);

    before(async () => {
        // Accounts setup
        account_polymath = accounts[0];
        account_issuer = accounts[1];

        token_owner = account_issuer;
        token_owner_pk = pk.account_1;

        account_investor1 = accounts[8];
        account_investor2 = accounts[9];
        account_delegate = accounts[7];
        account_delegate2 = accounts[6];
        account_delegate3 = accounts[5];

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
        

        // STEP 5: Deploy the GeneralDelegateManagerFactory
        [I_GeneralPermissionManagerFactory] = await deployGPMAndVerifyed(account_polymath, I_MRProxied, I_PolyToken.address, 0);
        // STEP 6: Deploy the GeneralDelegateManagerFactory
        [P_GeneralPermissionManagerFactory] = await deployGPMAndVerifyed(account_polymath, I_MRProxied, I_PolyToken.address, web3.utils.toWei("500", "ether"));        
        // STEP 7: Deploy the DummySTOFactory
        [I_DummySTOFactory] = await deployDummySTOAndVerifyed(account_polymath, I_MRProxied, I_PolyToken.address, 0);

        // Printing all the contract addresses
        console.log(`
        --------------------- Polymath Network Smart Contracts: ---------------------
        PolymathRegistry:                  ${I_PolymathRegistry.address}
        SecurityTokenRegistryProxy:        ${I_SecurityTokenRegistryProxy.address}
        SecurityTokenRegistry:             ${I_SecurityTokenRegistry.address}
        ModuleRegistryProxy                ${I_ModuleRegistryProxy.address}
        ModuleRegistry:                    ${I_ModuleRegistry.address}
        FeatureRegistry:                   ${I_FeatureRegistry.address}

        STFactory:                         ${I_STFactory.address}
        GeneralTransferManagerFactory:     ${I_GeneralTransferManagerFactory.address}
        GeneralPermissionManagerFactory:   ${I_GeneralPermissionManagerFactory.address}

        DummySTOFactory:                   ${I_DummySTOFactory.address}
        -----------------------------------------------------------------------------
        `);
    });

    describe("Generate the SecurityToken", async () => {
        it("Should register the ticker before the generation of the security token", async () => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner });
            let tx = await I_STRProxied.registerTicker(token_owner, symbol, contact, { from: token_owner });
            assert.equal(tx.logs[0].args._owner, token_owner);
            assert.equal(tx.logs[0].args._ticker, symbol.toUpperCase());
        });

        it("Should generate the new security token with the same symbol as registered above", async () => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner });
            let _blockNo = latestBlock();
            let tx = await I_STRProxied.generateSecurityToken(name, symbol, tokenDetails, false, { from: token_owner });

            // Verify the successful generation of the security token
            assert.equal(tx.logs[1].args._ticker, symbol.toUpperCase(), "SecurityToken doesn't get deployed");

            I_SecurityToken = SecurityToken.at(tx.logs[1].args._securityTokenAddress);

            const log = await promisifyLogWatch(I_SecurityToken.ModuleAdded({ from: _blockNo }), 1);

            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._types[0].toNumber(), 2);
            assert.equal(web3.utils.toAscii(log.args._name).replace(/\u0000/g, ""), "GeneralTransferManager");
        });

        it("Should intialize the auto attached modules", async () => {
            let moduleData = (await I_SecurityToken.getModulesByType(2))[0];
            I_GeneralTransferManager = GeneralTransferManager.at(moduleData);
        });

        it("Should successfully attach the General permission manager factory with the security token", async () => {
            await I_PolyToken.getTokens(web3.utils.toWei("500", "ether"), token_owner);
            await catchRevert(
                I_SecurityToken.addModule(P_GeneralPermissionManagerFactory.address, "0x", web3.utils.toWei("500", "ether"), 0, {
                    from: token_owner
                })
            );
        });

        it("Should successfully attach the General permission manager factory with the security token", async () => {
            let snapId = await takeSnapshot();
            await I_PolyToken.transfer(I_SecurityToken.address, web3.utils.toWei("500", "ether"), { from: token_owner });
            const tx = await I_SecurityToken.addModule(
                P_GeneralPermissionManagerFactory.address,
                "0x",
                web3.utils.toWei("500", "ether"),
                0,
                { from: token_owner }
            );
            assert.equal(tx.logs[3].args._types[0].toNumber(), delegateManagerKey, "General Permission Manager doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[3].args._name).replace(/\u0000/g, ""),
                "GeneralPermissionManager",
                "GeneralPermissionManagerFactory module was not added"
            );
            P_GeneralPermissionManager = GeneralPermissionManager.at(tx.logs[3].args._module);
            await revertToSnapshot(snapId);
        });

        it("Should successfully attach the General permission manager factory with the security token", async () => {
            const tx = await I_SecurityToken.addModule(I_GeneralPermissionManagerFactory.address, "0x", 0, 0, { from: token_owner });
            assert.equal(tx.logs[2].args._types[0].toNumber(), delegateManagerKey, "General Permission Manager doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name).replace(/\u0000/g, ""),
                "GeneralPermissionManager",
                "GeneralPermissionManagerFactory module was not added"
            );
            I_GeneralPermissionManager = GeneralPermissionManager.at(tx.logs[2].args._module);
        });

    });

    describe("General Permission Manager test cases", async () => {
        it("Get the init data", async () => {
            let tx = await I_GeneralPermissionManager.getInitFunction.call();
            assert.equal(web3.utils.toAscii(tx).replace(/\u0000/g, ""), 0);
        });

        it("Should fail in adding the permission to the delegate --msg.sender doesn't have permission", async () => {
            await catchRevert(I_GeneralPermissionManager.addDelegate(account_delegate, delegateDetails, { from: account_investor1 }));
        });

        it("Should fail to provide the permission-- because delegate is not yet added", async () => {
            await catchRevert(
                I_GeneralPermissionManager.changePermission(account_delegate, I_GeneralTransferManager.address, "WHITELIST", true, {
                    from: token_owner
                })
            );
        });

        it("Should fail in adding the delegate -- msg.sender doesn't have permission", async() => {
            await catchRevert(
                I_GeneralPermissionManager.addDelegate(account_delegate, delegateDetails, { from: account_investor1})
            );
        });

        it("Should fail in adding the delegate -- no delegate details provided", async() => {
            await catchRevert(
                I_GeneralPermissionManager.addDelegate(account_delegate, '', { from: account_investor1})
            );
        });

        it("Should successfully add the delegate", async() => {
            let tx = await I_GeneralPermissionManager.addDelegate(account_delegate, delegateDetails, { from: token_owner});
            assert.equal(tx.logs[0].args._delegate, account_delegate);
        });

        it("Should fail to provide the permission", async () => {
            await catchRevert(
                I_GeneralPermissionManager.changePermission(account_delegate, I_GeneralTransferManager.address, "WHITELIST", true, {
                    from: account_investor1
                })
            );
        });

        it("Should check the permission", async () => {
            assert.isFalse(
                await I_GeneralPermissionManager.checkPermission.call(account_delegate, I_GeneralTransferManager.address, "WHITELIST")
            );
        });

        it("Should provide the permission", async () => {
            let tx = await I_GeneralPermissionManager.changePermission(
                account_delegate,
                I_GeneralTransferManager.address,
                "WHITELIST",
                true,
                { from: token_owner }
            );
            assert.equal(tx.logs[0].args._delegate, account_delegate);
        });

        it("Should check the permission", async () => {
            assert.isTrue(
                await I_GeneralPermissionManager.checkPermission.call(account_delegate, I_GeneralTransferManager.address, "WHITELIST")
            );
        });

        it("Should check the delegate details", async() => {
            assert.equal(web3.utils.toAscii(await I_GeneralPermissionManager.delegateDetails.call(account_delegate))
                        .replace(/\u0000/g, ''),
                        delegateDetails,
                        "Wrong delegate address get checked");
        });

        it("Should get the permission of the general permission manager contract", async () => {
            let tx = await I_GeneralPermissionManager.getPermissions.call();
            assert.equal(web3.utils.toAscii(tx[0]).replace(/\u0000/g, ""), "CHANGE_PERMISSION", "Wrong permissions");
        });

        it("Should return all delegates", async() => {
            await I_GeneralPermissionManager.addDelegate(account_delegate2, delegateDetails, { from: token_owner});
            let tx = await I_GeneralPermissionManager.getAllDelegates.call();
            console.log(tx);
            assert.equal(tx.length, 2);
            assert.equal(tx[0], account_delegate);  
            assert.equal(tx[1], account_delegate2);
        });

        it("Should return false when check is delegate - because user is not a delegate", async() => {
            assert.equal(await I_GeneralPermissionManager.checkDelegate.call(account_investor1), false);
        });

        it("Should return true when check is delegate - because user is a delegate", async() => {
            assert.equal(await I_GeneralPermissionManager.checkDelegate.call(account_delegate), true);
        });

        
        it("Should provide the permission in bulk", async() => {
            await I_GeneralPermissionManager.addDelegate(account_delegate3, delegateDetails, { from: token_owner});

            let tx = await I_GeneralPermissionManager.changePermissionMulti(account_delegate3, [I_GeneralTransferManager.address, I_GeneralPermissionManager.address], ["WHITELIST","CHANGE_PERMISSION"], [true, true], {from: token_owner});
            assert.equal(tx.logs[0].args._delegate, account_delegate3);

            assert.isTrue(await I_GeneralPermissionManager.checkPermission.call(account_delegate3, I_GeneralTransferManager.address, "WHITELIST"));
            assert.isTrue(await I_GeneralPermissionManager.checkPermission.call(account_delegate3, I_GeneralPermissionManager.address, "CHANGE_PERMISSION"));
        });


        it("Should provide all delegates with specified permission", async() => {

            await I_GeneralPermissionManager.changePermission(account_delegate2, I_GeneralTransferManager.address, "WHITELIST", true, {from: token_owner});

            let tx = await I_GeneralPermissionManager.getAllDelegatesWithPerm.call(I_GeneralTransferManager.address, "WHITELIST");
            // console.log(tx);
            assert.equal(tx.length, 3);
            assert.equal(tx[0], account_delegate);
            assert.equal(tx[1], account_delegate2);
        });

        it("Should return all modules and all permission", async() => {
            
            let tx = await I_GeneralPermissionManager.getAllModulesAndPermsFromTypes.call(account_delegate3, [2,1], I_SecurityToken.address);
            console.log (tx);
            assert.equal(tx[0][0], I_GeneralTransferManager.address);
            assert.equal(tx[1][0], "0x57484954454c4953540000000000000000000000000000000000000000000000");
            assert.equal(tx[0][1], I_GeneralPermissionManager.address);
            assert.equal(tx[1][1], "0x4348414e47455f5045524d495353494f4e000000000000000000000000000000");
           
        });

    });

    describe("General Permission Manager Factory test cases", async () => {
        it("should get the exact details of the factory", async () => {
            assert.equal(await I_GeneralPermissionManagerFactory.setupCost.call(), 0);
            assert.equal((await I_GeneralPermissionManagerFactory.getTypes.call())[0], 1);
            assert.equal(await I_GeneralPermissionManagerFactory.getVersion.call(), "1.0.0");
            assert.equal(
                web3.utils.toAscii(await I_GeneralPermissionManagerFactory.getName.call()).replace(/\u0000/g, ""),
                "GeneralPermissionManager",
                "Wrong Module added"
            );
            assert.equal(
                await I_GeneralPermissionManagerFactory.getDescription.call(),
                "Manage permissions within the Security Token and attached modules",
                "Wrong Module added"
            );
            assert.equal(await I_GeneralPermissionManagerFactory.getTitle.call(), "General Permission Manager", "Wrong Module added");
            assert.equal(
                await I_GeneralPermissionManagerFactory.getInstructions.call(),
                "Add and remove permissions for the SecurityToken and associated modules. Permission types should be encoded as bytes32 values, and attached using the withPerm modifier to relevant functions.No initFunction required.",
                "Wrong Module added"
            );
        });

        it("Should get the tags of the factory", async () => {
            let tags = await I_GeneralPermissionManagerFactory.getTags.call();
            assert.equal(tags.length, 0);
        });
    });
});
