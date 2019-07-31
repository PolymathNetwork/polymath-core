import latestTime from "./helpers/latestTime";
import { signData } from "./helpers/signData";
import { pk } from "./helpers/testprivateKey";
import { duration, promisifyLogWatch, latestBlock } from "./helpers/utils";
import { takeSnapshot, increaseTime, revertToSnapshot } from "./helpers/time";
import { catchRevert } from "./helpers/exceptions";
import {
    setUpPolymathNetwork,
    deployGPMAndVerifyed,
    deployCountTMAndVerifyed,
    deployLockUpTMAndVerified,
    deployPercentageTMAndVerified,
    deployManualApprovalTMAndVerifyed
} from "./helpers/createInstances";
import { encodeModuleCall } from "./helpers/encodeCall";

const SecurityToken = artifacts.require("./SecurityToken.sol");
const GeneralTransferManager = artifacts.require("./GeneralTransferManager");
const GeneralPermissionManager = artifacts.require("./GeneralPermissionManager");
const CountTransferManager = artifacts.require("./CountTransferManager");
const VolumeRestrictionTransferManager = artifacts.require("./VolumeRestrictionTM");
const PercentageTransferManager = artifacts.require("./PercentageTransferManager");
const ManualApprovalTransferManager = artifacts.require("./ManualApprovalTransferManager");
const STGetter = artifacts.require("./STGetter.sol");

const Web3 = require("web3");
let BN = Web3.utils.BN;
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port

contract("GeneralPermissionManager Fuzz", async (accounts) => {
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

    let message = "Transaction Should Fail!";

    // Contract Instance Declaration
    let I_GeneralPermissionManagerFactory;
    let P_GeneralPermissionManagerFactory;
    let I_SecurityTokenRegistryProxy;
    let P_GeneralPermissionManager;
    let I_GeneralTransferManagerFactory;
    let I_VolumeRestrictionTransferManagerFactory;
    let I_PercentageTransferManagerFactory;
    let I_PercentageTransferManager;
    let I_VolumeRestrictionTransferManager;
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
    let I_CountTransferManagerFactory;
    let I_CountTransferManager;
    let I_SingleTradeVolumeRestrictionManagerFactory;
    let I_SingleTradeVolumeRestrictionManager;
    let I_SingleTradeVolumeRestrictionPercentageManager;
    let P_SingleTradeVolumeRestrictionManager;
    let P_SingleTradeVolumeRestrictionManagerFactory;
    let I_ManualApprovalTransferManagerFactory;
    let I_ManualApprovalTransferManager;
    let I_STRGetter;
    let I_STGetter;
    let stGetter;

    // SecurityToken Details
    const name = "Team";
    const symbol = "sap";
    const tokenDetails = "This is equity type of issuance";
    const decimals = 18;
    const contact = "team@polymath.network";
    const managerDetails = web3.utils.fromAscii("Hello");
    const STVRParameters = ["bool", "uint256", "bool"];

    // Module key
    const delegateManagerKey = 1;
    const transferManagerKey = 2;
    const stoKey = 3;

    // Initial fee for ticker registry and security token registry
    const initRegFee = new BN(web3.utils.toWei("1000"));

    // CountTransferManager details
    const holderCount = 2; // Maximum number of token holders
    let bytesSTO = encodeModuleCall(["uint256"], [holderCount]);

    let _details = "details holding for test";
    let _description = "some description";
    let testRepeat = 20;

    // permission manager fuzz test
    let perms = ["ADMIN", "WHITELIST", "FLAGS", "TRANSFER_APPROVAL"];
    let totalPerms = perms.length;

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
        account_investor3 = accounts[5];
        account_investor4 = accounts[6];
        account_delegate = accounts[7];
        // account_delegate2 = accounts[6];

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

        // Deploy Modules
        [I_CountTransferManagerFactory] = await deployCountTMAndVerifyed(account_polymath, I_MRProxied, 0);

        [I_VolumeRestrictionTransferManagerFactory] = await deployLockUpTMAndVerified(account_polymath, I_MRProxied, 0);

        [I_PercentageTransferManagerFactory] = await deployPercentageTMAndVerified(account_polymath, I_MRProxied, 0);

        [I_ManualApprovalTransferManagerFactory] = await deployManualApprovalTMAndVerifyed(account_polymath, I_MRProxied, 0);

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
            assert.equal(await stGetter.getTreasuryWallet.call(), token_owner, "Incorrect wallet set");
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

        it("Should successfully attach the General permission manager factory with the security token - paid module", async () => {
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

        it("Should successfully attach the General permission manager factory with the security token - free module", async () => {
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

    describe("fuzz test for general transfer manager", async () => {
        it("should pass fuzz test for changeIssuanceAddress() ", async () => {
            console.log("1");
            // fuzz test loop over total times of testRepeat, inside each loop, we use a variable j to randomly choose an account out of the 10 default accounts
            for (var i = 2; i < testRepeat; i++) {
                var j = Math.floor(Math.random() * 10);
                if (j === 1 || j === 0) {
                    j = 2;
                } // exclude account 1 & 0 because they might come with default perms

                // add account as a Delegate if it is not
                if ((await I_GeneralPermissionManager.checkDelegate(accounts[j])) !== true) {
                    await I_GeneralPermissionManager.addDelegate(accounts[j], web3.utils.fromAscii(_details), { from: token_owner });
                }

                // target permission should alaways be false for each test before assigning
                if ((await I_GeneralPermissionManager.checkPermission(accounts[j], I_GeneralTransferManager.address, web3.utils.fromAscii("ADMIN"))) === true) {
                    await I_GeneralPermissionManager.changePermission(accounts[j], I_GeneralTransferManager.address, web3.utils.fromAscii("ADMIN"), false, {
                        from: token_owner
                    });
                } else if (
                    (await I_GeneralPermissionManager.checkPermission(accounts[j], I_GeneralTransferManager.address, web3.utils.fromAscii("ADMIN"))) === true
                ) {
                    await I_GeneralPermissionManager.changePermission(accounts[j], I_GeneralTransferManager.address, web3.utils.fromAscii("ADMIN"), false, {
                        from: token_owner
                    });
                }

                // assign a random perm
                let randomPerms = perms[Math.floor(Math.random() * Math.floor(totalPerms))];
                let fromTime = await latestTime();
                let toTime = await latestTime() + duration.days(20);
                let expiryTime = toTime + duration.days(10);

                await I_GeneralPermissionManager.changePermission(accounts[j], I_GeneralTransferManager.address, web3.utils.fromAscii(randomPerms), true, {
                    from: token_owner
                });

                console.log("2");
                // let userPerm = await I_GeneralPermissionManager.checkPermission(accounts[j], I_GeneralTransferManager.address, 'FLAGS');
                if (randomPerms === "ADMIN") {
                    console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " about to start");
                    await I_GeneralTransferManager.changeIssuanceAddress(accounts[j], { from: accounts[j] });
                    assert.equal(await I_GeneralTransferManager.issuanceAddress(), accounts[j]);

                    console.log(
                        "Test number " +
                            i +
                            " with account " +
                            j +
                            " and perm " +
                            randomPerms +
                            " for functions with require perm FLAGS passed"
                    );
                } else {
                    await catchRevert(I_GeneralTransferManager.changeIssuanceAddress(accounts[j], { from: accounts[j] }));
                    console.log(
                        "Test number " +
                            i +
                            " with account " +
                            j +
                            " and perm " +
                            randomPerms +
                            " for functions require perm FLAGS failed as expected"
                    );
                }

                console.log("3");
                if (randomPerms === "ADMIN") {
                    let tx = await I_GeneralTransferManager.modifyKYCData(accounts[j], fromTime, toTime, expiryTime, {
                        from: accounts[j]
                    });
                    assert.equal(tx.logs[0].args._investor, accounts[j]);
                    console.log("3.1");
                    let tx2 = await I_GeneralTransferManager.modifyKYCDataMulti(
                        [accounts[3], accounts[4]],
                        [fromTime, fromTime],
                        [toTime, toTime],
                        [expiryTime, expiryTime],
                        { from: accounts[j] }
                    );
                    console.log(tx2.logs[1].args);
                    assert.equal(tx2.logs[1].args._investor, accounts[4]);
                    console.log("3.2");
                } else {
                    console.log("3.3");
                    await catchRevert(
                        I_GeneralTransferManager.modifyKYCData(accounts[j], fromTime, toTime, expiryTime, { from: accounts[j] })
                    );
                    console.log("3.4");
                    await catchRevert(
                        I_GeneralTransferManager.modifyKYCDataMulti(
                            [accounts[3], accounts[4]],
                            [fromTime, fromTime],
                            [toTime, toTime],
                            [expiryTime, expiryTime],
                            { from: accounts[j] }
                        )
                    );
                    console.log("3.5");
                }
            }
            console.log("4");
            await I_GeneralTransferManager.changeIssuanceAddress("0x0000000000000000000000000000000000000000", { from: token_owner });
        });
    });

    describe("fuzz test for count transfer manager", async () => {
        it("Should successfully attach the CountTransferManager with the security token", async () => {
            const tx = await I_SecurityToken.addModule(I_CountTransferManagerFactory.address, bytesSTO, new BN(0), new BN(0), false, { from: token_owner });
            assert.equal(tx.logs[2].args._types[0].toNumber(), transferManagerKey, "CountTransferManager doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name).replace(/\u0000/g, ""),
                "CountTransferManager",
                "CountTransferManager module was not added"
            );
            I_CountTransferManager = await CountTransferManager.at(tx.logs[2].args._module);
        });

        it("should pass fuzz test for changeHolderCount()", async () => {
            // fuzz test loop over total times of testRepeat, inside each loop, we use a variable j to randomly choose an account out of the 10 default accounts
            for (var i = 2; i < testRepeat; i++) {
                var j = Math.floor(Math.random() * 10);
                if (j === 1 || j === 0) {
                    j = 2;
                } // exclude account 1 & 0 because they might come with default perms

                // add account as a Delegate if it is not
                if ((await I_GeneralPermissionManager.checkDelegate(accounts[j])) !== true) {
                    await I_GeneralPermissionManager.addDelegate(accounts[j], web3.utils.fromAscii(_details), { from: token_owner });
                }

                // target permission should alaways be false for each test before assigning
                if ((await I_GeneralPermissionManager.checkPermission(accounts[j], I_CountTransferManager.address, web3.utils.fromAscii("ADMIN"))) === true) {
                    await I_GeneralPermissionManager.changePermission(accounts[j], I_CountTransferManager.address, web3.utils.fromAscii("ADMIN"), false, {
                        from: token_owner
                    });
                }

                // assign a random perm
                let randomPerms = perms[Math.floor(Math.random() * Math.floor(totalPerms))];
                await I_GeneralPermissionManager.changePermission(accounts[j], I_CountTransferManager.address, web3.utils.fromAscii(randomPerms), true, {
                    from: token_owner
                });
                if (randomPerms === "ADMIN") {
                    // console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " should pass");
                    await I_CountTransferManager.changeHolderCount(i + 1, { from: accounts[j] });
                    assert.equal((await I_CountTransferManager.maxHolderCount()).toNumber(), i + 1);
                    console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " passed");
                } else {
                    // console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " should failed");
                    await catchRevert(I_CountTransferManager.changeHolderCount(i + 1, { from: accounts[j] }));
                    console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " failed as expected");
                }
            }
        });
    });

    describe("fuzz test for percentage transfer manager", async () => {
        // PercentageTransferManager details
        const holderPercentage = new BN(web3.utils.toWei("0.7")); // Maximum number of token holders

        let bytesSTO = web3.eth.abi.encodeFunctionCall(
            {
                name: "configure",
                type: "function",
                inputs: [
                    {
                        type: "uint256",
                        name: "_maxHolderPercentage"
                    },
                    {
                        type: "bool",
                        name: "_allowPrimaryIssuance"
                    }
                ]
            },
            [holderPercentage.toString(), false]
        );

        it("Should successfully attach the percentage transfer manager with the security token", async () => {
            console.log("1");
            const tx = await I_SecurityToken.addModule(I_PercentageTransferManagerFactory.address, bytesSTO, new BN(0), new BN(0), false, { from: token_owner });
            I_PercentageTransferManager = await PercentageTransferManager.at(tx.logs[2].args._module);
        });

        it("should pass fuzz test for modifyWhitelist with perm ADMIN", async () => {
            // fuzz test loop over total times of testRepeat, inside each loop, we use a variable j to randomly choose an account out of the 10 default accounts
            for (var i = 2; i < testRepeat; i++) {
                var j = Math.floor(Math.random() * 10);
                if (j === 1 || j === 0) {
                    j = 2;
                } // exclude account 1 & 0 because they might come with default perms

                // add account as a Delegate if it is not
                if ((await I_GeneralPermissionManager.checkDelegate(accounts[j])) !== true) {
                    await I_GeneralPermissionManager.addDelegate(accounts[j], web3.utils.fromAscii(_details), { from: token_owner });
                }

                // target permission should alaways be false for each test before assigning
                if (
                    (await I_GeneralPermissionManager.checkPermission(accounts[j], I_PercentageTransferManager.address, web3.utils.fromAscii("ADMIN"))) ===
                    true
                ) {
                    await I_GeneralPermissionManager.changePermission(
                        accounts[j],
                        I_PercentageTransferManager.address,
                        web3.utils.fromAscii("ADMIN"),
                        false,
                        { from: token_owner }
                    );
                }

                // assign a random perm
                let randomPerms = perms[Math.floor(Math.random() * Math.floor(totalPerms))];
                await I_GeneralPermissionManager.changePermission(accounts[j], I_PercentageTransferManager.address, web3.utils.fromAscii(randomPerms), true, {
                    from: token_owner
                });

                //try add multi lock ups
                if (randomPerms === "ADMIN") {
                    // console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " should pass");
                    await I_PercentageTransferManager.modifyWhitelist(account_investor3, 1, { from: accounts[j] });
                    console.log("Test number " + i + " with account " + j + " and perm ADMIN passed as expected");
                } else {
                    // console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " should failed");
                    await catchRevert(I_PercentageTransferManager.modifyWhitelist(account_investor3, 1, { from: accounts[j] }));
                    console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " failed as expected");
                }
            }
        });

        it("should pass fuzz test for modifyWhitelistMulti with perm ADMIN", async () => {
            // fuzz test loop over total times of testRepeat, inside each loop, we use a variable j to randomly choose an account out of the 10 default accounts
            for (var i = 2; i < testRepeat; i++) {
                var j = Math.floor(Math.random() * 10);
                if (j === 1 || j === 0) {
                    j = 2;
                } // exclude account 1 & 0 because they might come with default perms

                // add account as a Delegate if it is not
                if ((await I_GeneralPermissionManager.checkDelegate(accounts[j])) !== true) {
                    await I_GeneralPermissionManager.addDelegate(accounts[j], web3.utils.fromAscii(_details), { from: token_owner });
                }

                // target permission should alaways be false for each test before assigning
                if (
                    (await I_GeneralPermissionManager.checkPermission(accounts[j], I_PercentageTransferManager.address, web3.utils.fromAscii("ADMIN"))) ===
                    true
                ) {
                    await I_GeneralPermissionManager.changePermission(
                        accounts[j],
                        I_PercentageTransferManager.address,
                        web3.utils.fromAscii("ADMIN"),
                        false,
                        { from: token_owner }
                    );
                }

                // assign a random perm
                let randomPerms = perms[Math.floor(Math.random() * Math.floor(totalPerms))];
                await I_GeneralPermissionManager.changePermission(accounts[j], I_PercentageTransferManager.address, web3.utils.fromAscii(randomPerms), true, {
                    from: token_owner
                });

                if (randomPerms === "ADMIN") {
                    // console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " should pass");
                    await I_PercentageTransferManager.modifyWhitelistMulti([account_investor3, account_investor4], [0, 1], {
                        from: accounts[j]
                    });
                    console.log("Test number " + i + " with account " + j + " and perm ADMIN passed as expected");
                } else {
                    // console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " should failed");
                    await catchRevert(
                        I_PercentageTransferManager.modifyWhitelistMulti([account_investor3, account_investor4], [0, 1], {
                            from: accounts[j]
                        })
                    );
                    console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " failed as expected");
                }
            }
        });

        it("should pass fuzz test for setAllowPrimaryIssuance with perm ADMIN", async () => {
            // let snapId = await takeSnapshot();
            // fuzz test loop over total times of testRepeat, inside each loop, we use a variable j to randomly choose an account out of the 10 default accounts
            for (var i = 2; i < testRepeat; i++) {
                var j = Math.floor(Math.random() * 10);
                if (j === 1 || j === 0) {
                    j = 2;
                } // exclude account 1 & 0 because they might come with default perms

                // add account as a Delegate if it is not
                if ((await I_GeneralPermissionManager.checkDelegate(accounts[j])) !== true) {
                    await I_GeneralPermissionManager.addDelegate(accounts[j], web3.utils.fromAscii(_details), { from: token_owner });
                }

                // target permission should alaways be false for each test before assigning
                if (
                    (await I_GeneralPermissionManager.checkPermission(accounts[j], I_PercentageTransferManager.address, web3.utils.fromAscii("ADMIN"))) === true
                ) {
                    await I_GeneralPermissionManager.changePermission(accounts[j], I_PercentageTransferManager.address, web3.utils.fromAscii("ADMIN"), false, {
                        from: token_owner
                    });
                }

                // assign a random perm
                let randomPerms = perms[Math.floor(Math.random() * Math.floor(totalPerms))];
                await I_GeneralPermissionManager.changePermission(accounts[j], I_PercentageTransferManager.address, web3.utils.fromAscii(randomPerms), true, {
                    from: token_owner
                });

                let primaryIssuanceStat = await I_PercentageTransferManager.allowPrimaryIssuance({ from: token_owner });

                if (randomPerms === "ADMIN") {
                    console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " should pass");
                    await I_PercentageTransferManager.setAllowPrimaryIssuance(!primaryIssuanceStat, { from: accounts[j] });
                    console.log("Test number " + i + " with account " + j + " and perm ADMIN passed as expected");
                } else {
                    console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " should failed");
                    await catchRevert(I_PercentageTransferManager.setAllowPrimaryIssuance(!primaryIssuanceStat, { from: accounts[j] }));
                    console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " failed as expected");
                }
                // await revertToSnapshot(snapId);
            }
        });
    });

    describe("fuzz test for manual approval transfer manager", async () => {
        it("Should successfully attach the ManualApprovalTransferManager with the security token", async () => {
            const tx = await I_SecurityToken.addModule(I_ManualApprovalTransferManagerFactory.address, "0x0", new BN(0), new BN(0), false, { from: token_owner });
            assert.equal(tx.logs[2].args._types[0].toNumber(), transferManagerKey, "ManualApprovalTransferManager doesn't get deployed");
            assert.equal(
                web3.utils.toUtf8(tx.logs[2].args._name),
                "ManualApprovalTransferManager",
                "ManualApprovalTransferManager module was not added"
            );
            I_ManualApprovalTransferManager = await ManualApprovalTransferManager.at(tx.logs[2].args._module);
        });

        it("should pass fuzz test for addManualApproval & revokeManualApproval with perm ADMIN", async () => {
            let tx;
            // fuzz test loop over total times of testRepeat, inside each loop, we use a variable j to randomly choose an account out of the 10 default accounts
            for (var i = 2; i < testRepeat; i++) {
                let snapId = await takeSnapshot();

                var j = Math.floor(Math.random() * 10);
                if (j === 1 || j === 0) {
                    j = 2;
                } // exclude account 1 & 0 because they might come with default perms

                // add account as a Delegate if it is not
                if ((await I_GeneralPermissionManager.checkDelegate(accounts[j])) !== true) {
                    await I_GeneralPermissionManager.addDelegate(accounts[j], web3.utils.fromAscii(_details), { from: token_owner });
                }

                // target permission should alaways be false for each test before assigning
                if (
                    (await I_GeneralPermissionManager.checkPermission(
                        accounts[j],
                        I_ManualApprovalTransferManager.address,
                        web3.utils.fromAscii("ADMIN")
                    )) === true
                ) {
                    await I_GeneralPermissionManager.changePermission(
                        accounts[j],
                        I_ManualApprovalTransferManager.address,
                        web3.utils.fromAscii("ADMIN"),
                        false,
                        { from: token_owner }
                    );
                }

                // assign a random perm
                let randomPerms = perms[Math.floor(Math.random() * Math.floor(totalPerms))];
                await I_GeneralPermissionManager.changePermission(accounts[j], I_ManualApprovalTransferManager.address, web3.utils.fromAscii(randomPerms), true, {
                    from: token_owner
                });

                if (randomPerms === "ADMIN") {
                    console.log("Test number " + i + " with account " + j + " and perm ADMIN " + " should pass");
                    let nextTime = await latestTime() + duration.days(1);
                    await I_ManualApprovalTransferManager.addManualApproval(
                        account_investor1,
                        account_investor4,
                        new BN(web3.utils.toWei("2", "ether")),
                        nextTime,
                        web3.utils.fromAscii(_details),
                        { from: accounts[j] }
                    );

                    console.log("2");
                    tx = await I_ManualApprovalTransferManager.revokeManualApproval(account_investor1, account_investor4, {
                        from: accounts[j]
                    });
                    assert.equal(tx.logs[0].args._from, account_investor1);
                    assert.equal(tx.logs[0].args._to, account_investor4);
                    assert.equal(tx.logs[0].args._addedBy, accounts[j]);

                    console.log("3");
                    console.log("Test number " + i + " with account " + j + " and perm ADMIN passed as expected");
                } else {
                    console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " should failed");
                    let nextTime = await latestTime() + duration.days(1);
                    await catchRevert(
                        I_ManualApprovalTransferManager.addManualApproval(
                            account_investor1,
                            account_investor4,
                            new BN(web3.utils.toWei("2", "ether")),
                            nextTime,
                            web3.utils.fromAscii(_details),
                            { from: accounts[j] }
                        )
                    );

                    nextTime = await latestTime() + duration.days(1);
                    await I_ManualApprovalTransferManager.addManualApproval(
                        account_investor1,
                        account_investor4,
                        new BN(web3.utils.toWei("2", "ether")),
                        nextTime,
                        web3.utils.fromAscii(_details),
                        { from: token_owner }
                    );

                    await catchRevert(
                        I_ManualApprovalTransferManager.revokeManualApproval(account_investor1, account_investor4, {
                            from: accounts[j]
                        })
                    );

                    console.log("Test number " + i + " with account " + j + " and perm " + randomPerms + " failed as expected");
                }

                await revertToSnapshot(snapId);
            }
        });
    });
});
