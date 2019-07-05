import latestTime from "./helpers/latestTime";
import { pk } from "./helpers/testprivateKey";
import { duration, promisifyLogWatch, latestBlock } from "./helpers/utils";
import { takeSnapshot, increaseTime, revertToSnapshot } from "./helpers/time";
import { catchRevert } from "./helpers/exceptions";
import { setUpPolymathNetwork, deployGPMAndVerifyed } from "./helpers/createInstances";

const SecurityToken = artifacts.require("./SecurityToken.sol");
const SecurityTokenRegistryInterface = artifacts.require("./ISecurityTokenRegistry.sol");
const GeneralTransferManager = artifacts.require("./GeneralTransferManager");
const GeneralPermissionManager = artifacts.require("./GeneralPermissionManager");
const STGetter = artifacts.require("./STGetter");

const Web3 = require("web3");
const BN = Web3.utils.BN;
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port

contract("GeneralPermissionManager", async (accounts) => {
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
    const delegateDetails = web3.utils.fromAscii("I am delegate");

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
    let I_PolyToken;
    let I_PolymathRegistry;
    let I_STRGetter;
    let I_STGetter;
    let I_SecurityTokenRegistryInterface;
    let stGetter;

    // SecurityToken Details
    const name = "Team";
    const symbol = "sap";
    const tokenDetails = "This is equity type of issuance";
    const decimals = 18;
    const contact = "team@polymath.network";
    const managerDetails = web3.utils.fromAscii("Hello");

    // Module key
    const delegateManagerKey = 1;
    const transferManagerKey = 2;
    const stoKey = 3;

    // Initial fee for ticker registry and security token registry
    const initRegFee = new BN(web3.utils.toWei("1000"));

    let currentTime;
    const address_zero = "0x0000000000000000000000000000000000000000";
    const one_address = "0x0000000000000000000000000000000000000001";

    before(async () => {
        currentTime = new BN(await latestTime());
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
            I_STRProxied,
            I_STRGetter,
            I_STGetter
        ] = instances;

        // STEP 5: Deploy the GeneralDelegateManagerFactory
        [I_GeneralPermissionManagerFactory] = await deployGPMAndVerifyed(account_polymath, I_MRProxied, 0);
        // STEP 6: Deploy the GeneralDelegateManagerFactory
        [P_GeneralPermissionManagerFactory] = await deployGPMAndVerifyed(account_polymath, I_MRProxied, new BN(web3.utils.toWei("500")));
        I_SecurityTokenRegistryInterface = await SecurityTokenRegistryInterface.at(I_SecurityTokenRegistryProxy.address);
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
        -----------------------------------------------------------------------------
        `);
    });

    describe("Generate the SecurityToken", async () => {
        it("Should register the ticker before the generation of the security token", async () => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner });
            let tx = await I_STRProxied.registerNewTicker(token_owner, symbol, { from: token_owner });
            assert.equal(tx.logs[0].args._owner, token_owner);
            assert.equal(tx.logs[0].args._ticker, symbol.toUpperCase());
        });

        it("Should generate the new security token with the same symbol as registered above", async () => {
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner });

            let tx = await I_STRProxied.generateNewSecurityToken(name, symbol, tokenDetails, false, token_owner, 0, { from: token_owner });

            // Verify the successful generation of the security token
            assert.equal(tx.logs[1].args._ticker, symbol.toUpperCase(), "SecurityToken doesn't get deployed");

            I_SecurityToken = await SecurityToken.at(tx.logs[1].args._securityTokenAddress);
            stGetter = await STGetter.at(I_SecurityToken.address);
            const log = (await I_SecurityToken.getPastEvents('ModuleAdded', {filter: {transactionHash: tx.transactionHash}}))[0];

            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._types[0].toNumber(), 2);
            assert.equal(web3.utils.toAscii(log.args._name).replace(/\u0000/g, ""), "GeneralTransferManager");
        });

        it("Should initialize the auto attached modules", async () => {
            let moduleData = (await stGetter.getModulesByType(2))[0];
            I_GeneralTransferManager = await GeneralTransferManager.at(moduleData);
        });

        it("Should successfully attach the General permission manager factory with the security token -- failed because Token is not paid", async () => {
            let errorThrown = false;
            await I_PolyToken.getTokens(new BN(web3.utils.toWei("2000", "ether")), token_owner);
            await catchRevert(
                I_SecurityToken.addModule(P_GeneralPermissionManagerFactory.address, "0x", new BN(web3.utils.toWei("2000", "ether")), new BN(0), false, {
                    from: token_owner
                })
            );
        });

        it("Should successfully attach the General permission manager factory with the security token", async () => {
            let snapId = await takeSnapshot();
            await I_PolyToken.transfer(I_SecurityToken.address, new BN(web3.utils.toWei("2000", "ether")), { from: token_owner });
            const tx = await I_SecurityToken.addModule(
                P_GeneralPermissionManagerFactory.address,
                "0x",
                new BN(web3.utils.toWei("2000", "ether")),
                new BN(0),
                false,
                { from: token_owner }
            );
            assert.equal(tx.logs[3].args._types[0].toNumber(), delegateManagerKey, "General Permission Manager doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[3].args._name).replace(/\u0000/g, ""),
                "GeneralPermissionManager",
                "GeneralPermissionManagerFactory module was not added"
            );
            P_GeneralPermissionManager = await GeneralPermissionManager.at(tx.logs[3].args._module);
            await revertToSnapshot(snapId);
        });

        it("Should successfully attach the General permission manager factory with the security token", async () => {
            const tx = await I_SecurityToken.addModule(I_GeneralPermissionManagerFactory.address, "0x", new BN(0), new BN(0), false, { from: token_owner });
            assert.equal(tx.logs[2].args._types[0].toNumber(), delegateManagerKey, "General Permission Manager doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name).replace(/\u0000/g, ""),
                "GeneralPermissionManager",
                "GeneralPermissionManagerFactory module was not added"
            );
            I_GeneralPermissionManager = await GeneralPermissionManager.at(tx.logs[2].args._module);
        });
    });

    describe("General Permission Manager test cases", async () => {
        it("Get the init data", async () => {
            let tx = await I_GeneralPermissionManager.getInitFunction.call();
            assert.equal(web3.utils.toAscii(tx).replace(/\u0000/g, ""), 0);
        });

        it("Should fail in adding the delegate -- msg.sender doesn't have permission", async () => {
            let errorThrown = false;
            await catchRevert(I_GeneralPermissionManager.addDelegate(account_delegate, delegateDetails, { from: account_investor1 }));
        });

        it("Should fail in adding the delegate -- no delegate details provided", async () => {
            await catchRevert(I_GeneralPermissionManager.addDelegate(account_delegate, "0x0", { from: token_owner }));
        });

        it("Should fail in adding the delegate -- no delegate address provided", async () => {
            await catchRevert(I_GeneralPermissionManager.addDelegate(address_zero, delegateDetails, { from: token_owner }));
        });

        it("Should fail to remove the delegate -- failed because delegate does not exisit", async () => {
            await catchRevert(I_GeneralPermissionManager.deleteDelegate(account_delegate, { from: token_owner }));
        });

        it("Should successfully add the delegate", async () => {
            let tx = await I_GeneralPermissionManager.addDelegate(account_delegate, delegateDetails, { from: token_owner });
            assert.equal(tx.logs[0].args._delegate, account_delegate);
        });

        it("Should successfully add the delegate -- failed because trying to add the already present delegate", async () => {
            await catchRevert(I_GeneralPermissionManager.addDelegate(account_delegate, delegateDetails, { from: token_owner }));
        });

        it("Should fail to provide the permission -- because msg.sender doesn't have permission", async () => {
            await catchRevert(
                I_GeneralPermissionManager.changePermission(account_delegate, I_GeneralTransferManager.address, web3.utils.fromAscii("WHITELIST"), true, {
                    from: account_investor1
                })
            );
        });

        it("Should check the permission", async () => {
            assert.isFalse(
                await I_GeneralPermissionManager.checkPermission.call(account_delegate, I_GeneralTransferManager.address, web3.utils.fromAscii("WHITELIST"))
            );
        });

        it("Should provide the permission", async () => {
            let tx = await I_GeneralPermissionManager.changePermission(
                account_delegate,
                I_GeneralTransferManager.address,
                web3.utils.fromAscii("WHITELIST"),
                true,
                { from: token_owner }
            );
            assert.equal(tx.logs[0].args._delegate, account_delegate);
        });

        it("Should check the permission", async () => {
            assert.isTrue(
                await I_GeneralPermissionManager.checkPermission.call(account_delegate, I_GeneralTransferManager.address, web3.utils.fromAscii("WHITELIST"))
            );
        });

        it("Security token should deny all permission if all permission managers are disabled", async () => {
            await I_SecurityToken.archiveModule(I_GeneralPermissionManager.address, { from: token_owner });
            assert.isFalse(await stGetter.checkPermission.call(account_delegate, I_GeneralTransferManager.address, web3.utils.fromAscii("WHITELIST")));
            await I_SecurityToken.unarchiveModule(I_GeneralPermissionManager.address, { from: token_owner });
            assert.isTrue(await stGetter.checkPermission.call(account_delegate, I_GeneralTransferManager.address, web3.utils.fromAscii("WHITELIST")));
        });

        it("Should fail to remove the delegate -- failed because unauthorized msg.sender", async () => {
            await catchRevert(I_GeneralPermissionManager.deleteDelegate(account_delegate, { from: account_delegate }));
        });

        it("Should remove the delegate", async () => {
            await I_GeneralPermissionManager.deleteDelegate(account_delegate, { from: token_owner });
        });

        it("Should check the permission", async () => {
            assert.isFalse(
                await I_GeneralPermissionManager.checkPermission.call(account_delegate, I_GeneralTransferManager.address, web3.utils.fromAscii("WHITELIST"))
            );
        });

        it("Should successfully add the delegate", async () => {
            let tx = await I_GeneralPermissionManager.addDelegate(account_delegate, delegateDetails, { from: token_owner });
            assert.equal(tx.logs[0].args._delegate, account_delegate);
        });

        it("Should check the delegate details", async () => {
            assert.equal(
                web3.utils.toAscii(await I_GeneralPermissionManager.delegateDetails.call(account_delegate)).replace(/\u0000/g, ""),
                web3.utils.toAscii(delegateDetails),
                "Wrong delegate address get checked"
            );
        });

        it("Should get the permission of the general permission manager contract", async () => {
            let tx = await I_GeneralPermissionManager.getPermissions.call();
            assert.equal(web3.utils.toAscii(tx[0]).replace(/\u0000/g, ""), "ADMIN", "Wrong permissions");
        });

        it("Should return all delegates", async () => {
            assert.equal((await I_SecurityTokenRegistryInterface.getTokensByDelegate.call(account_delegate))[0], I_SecurityToken.address);
            assert.equal((await I_SecurityTokenRegistryInterface.getTokensByDelegate.call(account_delegate)).length, 1);
            assert.equal((await I_SecurityTokenRegistryInterface.getTokensByDelegate.call(account_delegate2)).length, 0);
            await I_GeneralPermissionManager.addDelegate(account_delegate2, delegateDetails, { from: token_owner });
            assert.equal((await I_SecurityTokenRegistryInterface.getTokensByDelegate.call(account_delegate))[0], I_SecurityToken.address);
            assert.equal((await I_SecurityTokenRegistryInterface.getTokensByDelegate.call(account_delegate)).length, 1);
            assert.equal((await I_SecurityTokenRegistryInterface.getTokensByDelegate.call(account_delegate2))[0], I_SecurityToken.address);
            assert.equal((await I_SecurityTokenRegistryInterface.getTokensByDelegate.call(account_delegate2)).length, 1);
            let tx = await I_GeneralPermissionManager.getAllDelegates.call();
            assert.equal(tx.length, 2);
            assert.equal(tx[0], account_delegate);
            assert.equal(tx[1], account_delegate2);
        });

        it("Should create a new token and add some more delegates, then get them", async() => {
            await I_PolyToken.getTokens(web3.utils.toWei("500", "ether"), token_owner);
            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner });
            let tx1 = await I_STRProxied.registerNewTicker(token_owner, "DEL", { from: token_owner });
            assert.equal(tx1.logs[0].args._owner, token_owner);
            assert.equal(tx1.logs[0].args._ticker, "DEL");

            await I_PolyToken.approve(I_STRProxied.address, initRegFee, { from: token_owner });
            let _blockNo = latestBlock();
            let tx2 = await I_STRProxied.generateNewSecurityToken(name, "DEL", tokenDetails, false, token_owner, 0, { from: token_owner });

            // Verify the successful generation of the security token
            assert.equal(tx2.logs[1].args._ticker, "DEL", "SecurityToken doesn't get deployed");

            let I_SecurityToken_DEL = await SecurityToken.at(tx2.logs[1].args._securityTokenAddress);

            const tx = await I_SecurityToken_DEL.addModule(I_GeneralPermissionManagerFactory.address, "0x", 0, 0, false, { from: token_owner });
            assert.equal(tx.logs[2].args._types[0].toNumber(), delegateManagerKey, "General Permission Manager doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name).replace(/\u0000/g, ""),
                "GeneralPermissionManager",
                "GeneralPermissionManagerFactory module was not added"
            );

            let I_GeneralPermissionManager_DEL = await GeneralPermissionManager.at(tx.logs[2].args._module);
            await I_GeneralPermissionManager_DEL.addDelegate(account_delegate3, delegateDetails, { from: token_owner});

            assert.equal((await I_SecurityTokenRegistryInterface.getTokensByDelegate.call(account_delegate))[0], I_SecurityToken.address);
            assert.equal((await I_SecurityTokenRegistryInterface.getTokensByDelegate.call(account_delegate2))[0], I_SecurityToken.address);
            assert.equal((await I_SecurityTokenRegistryInterface.getTokensByDelegate.call(account_delegate3))[0], I_SecurityToken_DEL.address);
            assert.equal((await I_SecurityTokenRegistryInterface.getTokensByDelegate.call(account_delegate)).length, 1);
            assert.equal((await I_SecurityTokenRegistryInterface.getTokensByDelegate.call(account_delegate2)).length, 1);
            assert.equal((await I_SecurityTokenRegistryInterface.getTokensByDelegate.call(account_delegate3)).length, 1);
            await I_GeneralPermissionManager_DEL.addDelegate(account_delegate2, delegateDetails, { from: token_owner});
            assert.equal((await I_SecurityTokenRegistryInterface.getTokensByDelegate.call(account_delegate))[0], I_SecurityToken.address);
            assert.equal((await I_SecurityTokenRegistryInterface.getTokensByDelegate.call(account_delegate2))[0], I_SecurityToken.address);
            assert.equal((await I_SecurityTokenRegistryInterface.getTokensByDelegate.call(account_delegate2))[1], I_SecurityToken_DEL.address);
            assert.equal((await I_SecurityTokenRegistryInterface.getTokensByDelegate.call(account_delegate3))[0], I_SecurityToken_DEL.address);
            assert.equal((await I_SecurityTokenRegistryInterface.getTokensByDelegate.call(account_delegate)).length, 1);
            assert.equal((await I_SecurityTokenRegistryInterface.getTokensByDelegate.call(account_delegate2)).length, 2);
            assert.equal((await I_SecurityTokenRegistryInterface.getTokensByDelegate.call(account_delegate3)).length, 1);
            let tx4 = await I_GeneralPermissionManager_DEL.getAllDelegates.call();
            assert.equal(tx4.length, 2);
            assert.equal(tx4[0], account_delegate3, account_delegate2);
        });

        it("Should check is delegate for 0x address - failed 0x address is not allowed", async () => {
            await catchRevert(I_GeneralPermissionManager.checkDelegate.call(address_zero));
        });

        it("Should return false when check is delegate - because user is not a delegate", async () => {
            assert.equal(await I_GeneralPermissionManager.checkDelegate.call(account_investor1), false);
        });

        it("Should return true when check is delegate - because user is a delegate", async () => {
            assert.equal(await I_GeneralPermissionManager.checkDelegate.call(account_delegate), true);
        });

        it("Should successfully provide the permissions in batch -- failed because of array length is 0", async () => {
            await I_GeneralPermissionManager.addDelegate(account_delegate3, delegateDetails, { from: token_owner });
            await catchRevert(
                I_GeneralPermissionManager.changePermissionMulti(account_delegate3, [], [web3.utils.fromAscii("ADMIN"), web3.utils.fromAscii("ADMIN")], [true, true], {
                    from: token_owner
                })
            );
        });

        it("Should successfully provide the permissions in batch -- failed because of perm array length is 0", async () => {
            await catchRevert(
                I_GeneralPermissionManager.changePermissionMulti(
                    account_delegate3,
                    [I_GeneralTransferManager.address, I_GeneralPermissionManager.address],
                    [],
                    [true, true],
                    { from: token_owner }
                )
            );
        });

        it("Should successfully provide the permissions in batch -- failed because mismatch in arrays length", async () => {
            await catchRevert(
                I_GeneralPermissionManager.changePermissionMulti(
                    account_delegate3,
                    [I_GeneralTransferManager.address],
                    [web3.utils.fromAscii("ADMIN"), web3.utils.fromAscii("ADMIN")],
                    [true, true],
                    { from: token_owner }
                )
            );
        });

        it("Should successfully provide the permissions in batch -- failed because mismatch in arrays length", async () => {
            await catchRevert(
                I_GeneralPermissionManager.changePermissionMulti(
                    account_delegate3,
                    [I_GeneralTransferManager.address, I_GeneralPermissionManager.address],
                    [web3.utils.fromAscii("ADMIN"), web3.utils.fromAscii("ADMIN")],
                    [true],
                    { from: token_owner }
                )
            );
        });

        it("Should successfully provide the permissions in batch", async () => {
            let tx = await I_GeneralPermissionManager.changePermissionMulti(
                account_delegate3,
                [I_GeneralTransferManager.address, I_GeneralPermissionManager.address],
                [web3.utils.fromAscii("ADMIN"), web3.utils.fromAscii("ADMIN")],
                [true, true],
                { from: token_owner }
            );
            assert.equal(tx.logs[0].args._delegate, account_delegate3);

            assert.isTrue(
                await I_GeneralPermissionManager.checkPermission.call(account_delegate3, I_GeneralTransferManager.address, web3.utils.fromAscii("ADMIN"))
            );
            assert.isTrue(
                await I_GeneralPermissionManager.checkPermission.call(
                    account_delegate3,
                    I_GeneralPermissionManager.address,
                    web3.utils.fromAscii("ADMIN")
                )
            );
        });

        it("Should provide all delegates with specified permission", async () => {
            await I_GeneralPermissionManager.changePermission(account_delegate2, I_GeneralTransferManager.address, web3.utils.fromAscii("ADMIN"), true, {
                from: token_owner
            });
            let tx = await I_GeneralPermissionManager.getAllDelegatesWithPerm.call(I_GeneralTransferManager.address, web3.utils.fromAscii("ADMIN"));
            assert.equal(tx.length, 2);
            assert.equal(tx[0], account_delegate2);
            assert.equal(tx[1], account_delegate3);
        });

        it("Should get all delegates for the permission manager", async () => {
            let tx = await I_GeneralPermissionManager.getAllDelegatesWithPerm.call(I_GeneralPermissionManager.address, web3.utils.fromAscii("ADMIN"));
            assert.equal(tx.length, 1);
            assert.equal(tx[0], account_delegate3);
        });

        it("Should return all modules and all permission", async () => {
            let tx = await I_GeneralPermissionManager.getAllModulesAndPermsFromTypes.call(account_delegate3, [2, 1]);
            assert.equal(tx[0][0], I_GeneralTransferManager.address);
            assert.equal(web3.utils.hexToUtf8(tx[1][0]), "ADMIN");
            assert.equal(tx[0][1], I_GeneralPermissionManager.address);
            assert.equal(web3.utils.hexToUtf8(tx[1][1]), "ADMIN");
        });
    });

    describe("General Permission Manager Factory test cases", async () => {
        it("should get the exact details of the factory", async () => {
            assert.equal(await I_GeneralPermissionManagerFactory.setupCost.call(), 0);
            assert.equal((await I_GeneralPermissionManagerFactory.getTypes.call())[0], 1);
            assert.equal(await I_GeneralPermissionManagerFactory.version.call(), "3.0.0");
            assert.equal(
                web3.utils.toAscii(await I_GeneralPermissionManagerFactory.name.call()).replace(/\u0000/g, ""),
                "GeneralPermissionManager",
                "Wrong Module added"
            );
            assert.equal(
                await I_GeneralPermissionManagerFactory.description.call(),
                "Manage permissions within the Security Token and attached modules",
                "Wrong Module added"
            );
            assert.equal(await I_GeneralPermissionManagerFactory.title.call(), "General Permission Manager", "Wrong Module added");
        });

        it("Should get the tags of the factory", async () => {
            let tags = await I_GeneralPermissionManagerFactory.getTags.call();
            assert.equal(web3.utils.toUtf8(tags[0]), "Permission Management");
        });

    });
});
