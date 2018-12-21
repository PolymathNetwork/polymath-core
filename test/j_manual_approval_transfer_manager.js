import latestTime from "./helpers/latestTime";
import { duration, ensureException, promisifyLogWatch, latestBlock } from "./helpers/utils";
import takeSnapshot, { increaseTime, revertToSnapshot } from "./helpers/time";
import { encodeProxyCall } from "./helpers/encodeCall";
import { catchRevert } from "./helpers/exceptions";
import {
    setUpPolymathNetwork,
    deployManualApprovalTMAndVerifyed,
    deployGPMAndVerifyed,
    deployCountTMAndVerifyed
} from "./helpers/createInstances";

const SecurityToken = artifacts.require("./SecurityToken.sol");
const GeneralTransferManager = artifacts.require("./GeneralTransferManager");
const ManualApprovalTransferManager = artifacts.require("./ManualApprovalTransferManager");
const CountTransferManager = artifacts.require("./CountTransferManager");
const GeneralPermissionManager = artifacts.require("./GeneralPermissionManager");

const Web3 = require("web3");
let BN = Web3.utils.BN;
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port

contract("ManualApprovalTransferManager", async (accounts) => {
    // Accounts Variable declaration
    let account_polymath;
    let account_issuer;
    let token_owner;
    let account_investor1;
    let account_investor2;
    let account_investor3;
    let account_investor4;
    let account_investor5;

    let message = "Transaction Should Fail!";

    // Contract Instance Declaration
    let I_GeneralPermissionManagerFactory;
    let I_GeneralTransferManagerFactory;
    let I_SecurityTokenRegistryProxy;
    let I_ManualApprovalTransferManagerFactory;
    let P_ManualApprovalTransferManagerFactory;
    let P_ManualApprovalTransferManager;
    let I_CountTransferManagerFactory;
    let I_GeneralPermissionManager;
    let I_ManualApprovalTransferManager;
    let I_CountTransferManager;
    let I_GeneralTransferManager;
    let I_ModuleRegistryProxy;
    let I_ModuleRegistry;
    let I_FeatureRegistry;
    let I_SecurityTokenRegistry;
    let I_MRProxied;
    let I_STRProxied;
    let I_STFactory;
    let I_SecurityToken;
    let I_PolyToken;
    let I_PolymathRegistry;

    // SecurityToken Details
    const name = "Team";
    const symbol = "sap";
    const tokenDetails = "This is equity type of issuance";
    const decimals = 18;
    const contact = "team@polymath.network";

    // Module key
    const delegateManagerKey = 1;
    const transferManagerKey = 2;
    const stoKey = 3;

    // Initial fee for ticker registry and security token registry
    const initRegFee = new BN(web3.utils.toWei("250"));

    const STOParameters = ["uint256", "uint256", "uint256", "uint256", "uint8[]", "address"];

    before(async () => {
        // Accounts setup
        account_polymath = accounts[0];
        account_issuer = accounts[1];

        token_owner = account_issuer;

        account_investor1 = accounts[6];
        account_investor2 = accounts[7];
        account_investor3 = accounts[8];
        account_investor4 = accounts[9];
        account_investor5 = accounts[5];

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
        [I_GeneralPermissionManagerFactory] = await deployGPMAndVerifyed(account_polymath, I_MRProxied, 0);
        // STEP 3: Deploy the ManualApprovalTransferManagerFactory
        [I_ManualApprovalTransferManagerFactory] = await deployManualApprovalTMAndVerifyed(account_polymath, I_MRProxied, 0);
        // STEP 4: Deploy the Paid ManualApprovalTransferManagerFactory
        [P_ManualApprovalTransferManagerFactory] = await deployManualApprovalTMAndVerifyed(
            account_polymath,
            I_MRProxied,
            new BN(web3.utils.toWei("500", "ether"))
        );
        // STEP 5: Deploy the CountTransferManagerFactory
        [I_CountTransferManagerFactory] = await deployCountTMAndVerifyed(account_polymath, I_MRProxied, 0);

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
        GeneralPermissionManagerFactory:   ${I_GeneralPermissionManagerFactory.address}

        ManualApprovalTransferManagerFactory: ${I_ManualApprovalTransferManagerFactory.address}
        CountTransferManagerFactory:       ${I_CountTransferManagerFactory.address}
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
            
            let tx = await I_STRProxied.generateSecurityToken(name, symbol, tokenDetails, false, { from: token_owner });

            // Verify the successful generation of the security token
            assert.equal(tx.logs[2].args._ticker, symbol.toUpperCase(), "SecurityToken doesn't get deployed");

            I_SecurityToken = await SecurityToken.at(tx.logs[2].args._securityTokenAddress);

            const log = (await I_SecurityToken.getPastEvents('ModuleAdded', {filter: {transactionHash: tx.transactionHash}}))[0];

            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._types[0].toNumber(), 2);
            assert.equal(web3.utils.toUtf8(log.args._name), "GeneralTransferManager");
        });

        it("Should intialize the auto attached modules", async () => {
            let moduleData = (await I_SecurityToken.getModulesByType(2))[0];
            I_GeneralTransferManager = await GeneralTransferManager.at(moduleData);
        });
    });

    describe("Buy tokens using whitelist & manual approvals", async () => {
        it("Should Buy the tokens", async () => {
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_investor1,
                await latestTime(),
                await latestTime(),
                await latestTime() + duration.days(10),
                true,
                {
                    from: account_issuer,
                    gas: 6000000
                }
            );

            assert.equal(
                tx.logs[0].args._investor.toLowerCase(),
                account_investor1.toLowerCase(),
                "Failed in adding the investor in whitelist"
            );

            // Jump time
            await increaseTime(5000);

            // Mint some tokens
            await I_SecurityToken.mint(account_investor1, new BN(web3.utils.toWei("4", "ether")), { from: token_owner });

            assert.equal((await I_SecurityToken.balanceOf(account_investor1)).toString(), new BN(web3.utils.toWei("4", "ether")).toString());
        });

        it("Should Buy some more tokens", async () => {
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_investor2,
                await latestTime(),
                await latestTime(),
                await latestTime() + duration.days(10),
                true,
                {
                    from: account_issuer,
                    gas: 6000000
                }
            );

            assert.equal(
                tx.logs[0].args._investor.toLowerCase(),
                account_investor2.toLowerCase(),
                "Failed in adding the investor in whitelist"
            );

            // Mint some tokens
            await I_SecurityToken.mint(account_investor2, new BN(web3.utils.toWei("1", "ether")), { from: token_owner });

            assert.equal((await I_SecurityToken.balanceOf(account_investor2)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
        });

        it("Should successfully attach the ManualApprovalTransferManager with the security token", async () => {
            await I_PolyToken.getTokens(new BN(web3.utils.toWei("500", "ether")), token_owner);
            await catchRevert(
                I_SecurityToken.addModule(P_ManualApprovalTransferManagerFactory.address, "0x", new BN(web3.utils.toWei("500", "ether")), new BN(0), {
                    from: token_owner
                })
            );
        });

        it("Should successfully attach the General permission manager factory with the security token", async () => {
            let snapId = await takeSnapshot();
            await I_PolyToken.transfer(I_SecurityToken.address, new BN(web3.utils.toWei("500", "ether")), { from: token_owner });
            const tx = await I_SecurityToken.addModule(
                P_ManualApprovalTransferManagerFactory.address,
                "0x",
                new BN(web3.utils.toWei("500", "ether")),
                new BN(0),
                { from: token_owner }
            );
            assert.equal(tx.logs[3].args._types[0].toNumber(), transferManagerKey, "Manual Approval Transfer Manager doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[3].args._name).replace(/\u0000/g, ""),
                "ManualApprovalTransferManager",
                "ManualApprovalTransferManagerFactory module was not added"
            );
            P_ManualApprovalTransferManagerFactory = await ManualApprovalTransferManager.at(tx.logs[3].args._module);
            await revertToSnapshot(snapId);
        });

        it("Should successfully attach the ManualApprovalTransferManager with the security token", async () => {
            const tx = await I_SecurityToken.addModule(I_ManualApprovalTransferManagerFactory.address, "0x0", new BN(0), new BN(0), { from: token_owner });
            assert.equal(tx.logs[2].args._types[0].toNumber(), transferManagerKey, "ManualApprovalTransferManager doesn't get deployed");
            assert.equal(
                web3.utils.toUtf8(tx.logs[2].args._name),
                "ManualApprovalTransferManager",
                "ManualApprovalTransferManager module was not added"
            );
            I_ManualApprovalTransferManager = await ManualApprovalTransferManager.at(tx.logs[2].args._module);
        });
        //function verifyTransfer(address _from, address _to, uint256 _amount, bool _isTransfer) public returns(Result) {
        it("Cannot call verifyTransfer on the TM directly if _isTransfer == true", async () => {
            await catchRevert(
                I_ManualApprovalTransferManager.verifyTransfer(
                    account_investor4,
                    account_investor4,
                    new BN(web3.utils.toWei("2", "ether")),
                    "",
                    true,
                    { from: token_owner }
                )
            );
        });

        it("Can call verifyTransfer on the TM directly if _isTransfer == false", async () => {
            await I_ManualApprovalTransferManager.verifyTransfer(
                account_investor4,
                account_investor4,
                new BN(web3.utils.toWei("2", "ether")),
                "",
                false,
                { from: token_owner }
            );
        });

        it("Add a new token holder", async () => {
            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_investor3,
                await latestTime(),
                await latestTime(),
                await latestTime() + duration.days(10),
                true,
                {
                    from: account_issuer,
                    gas: 6000000
                }
            );

            assert.equal(
                tx.logs[0].args._investor.toLowerCase(),
                account_investor3.toLowerCase(),
                "Failed in adding the investor in whitelist"
            );
            // Pause at the transferManager level
            await I_ManualApprovalTransferManager.pause({ from: token_owner });
            // Add the Investor in to the whitelist
            // Mint some tokens
            await I_SecurityToken.mint(account_investor3, new BN(web3.utils.toWei("1", "ether")), { from: token_owner });

            assert.equal((await I_SecurityToken.balanceOf(account_investor3)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
            // Unpause at the transferManager level
            await I_ManualApprovalTransferManager.unpause({ from: token_owner });
        });

        it("Should still be able to transfer between existing token holders", async () => {
            // Add the Investor in to the whitelist
            // Mint some tokens
            await I_SecurityToken.transfer(account_investor1, new BN(web3.utils.toWei("1", "ether")), { from: account_investor2 });

            assert.equal((await I_SecurityToken.balanceOf(account_investor1)).toString(), new BN(web3.utils.toWei("5", "ether")).toString());
        });

        it("Should fail to add a manual approval because invalid _to address", async () => {
            await catchRevert(
                I_ManualApprovalTransferManager.addManualApproval(
                    account_investor1,
                    "",
                    new BN(web3.utils.toWei("2", "ether")),
                    await latestTime() + duration.days(1),
                    { from: token_owner }
                )
            );
        });

        it("Should fail to add a manual approval because invalid expiry time", async () => {
            await catchRevert(
                I_ManualApprovalTransferManager.addManualApproval(
                    account_investor1,
                    account_investor4,
                    new BN(web3.utils.toWei("2", "ether")),
                    99999,
                    { from: token_owner }
                )
            );
        });

        it("Add a manual approval for a 4th investor", async () => {
            await I_ManualApprovalTransferManager.addManualApproval(
                account_investor1,
                account_investor4,
                new BN(web3.utils.toWei("2", "ether")),
                await latestTime() + duration.days(1),
                { from: token_owner }
            );
        });

        it("Add a manual approval for a 5th investor from issuance", async () => {
            await I_ManualApprovalTransferManager.addManualApproval(
                "",
                account_investor5,
                new BN(web3.utils.toWei("2", "ether")),
                await latestTime() + duration.days(1),
                { from: token_owner }
            );
        });

        it("Should fail to add a manual approval because allowance is laready exists", async () => {
            await catchRevert(
                I_ManualApprovalTransferManager.addManualApproval(
                    account_investor1,
                    account_investor4,
                    new BN(web3.utils.toWei("2", "ether")),
                    await latestTime() + duration.days(5),
                    { from: token_owner }
                )
            );
        });

        it("Should fail to revoke manual approval because invalid _to address", async () => {
            await catchRevert(I_ManualApprovalTransferManager.revokeManualApproval(account_investor1, "0x0", { from: token_owner }));
        });

        it("Should revoke manual approval", async () => {
            let tx = await I_ManualApprovalTransferManager.revokeManualApproval(account_investor1, account_investor4, {
                from: token_owner
            });
            assert.equal(tx.logs[0].args._from, account_investor1);
            assert.equal(tx.logs[0].args._to, account_investor4);
            assert.equal(tx.logs[0].args._addedBy, token_owner);
            await I_ManualApprovalTransferManager.addManualApproval(
                account_investor1,
                account_investor4,
                new BN(web3.utils.toWei("2", "ether")),
                await latestTime() + duration.days(1),
                { from: token_owner }
            );
        });

        it("Use 50% of manual approval for transfer", async () => {
            await I_SecurityToken.transfer(account_investor4, new BN(web3.utils.toWei("1", "ether")), { from: account_investor1 });

            assert.equal((await I_SecurityToken.balanceOf(account_investor4)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
        });

        it("Approval fails with wrong from to address", async () => {
            await catchRevert(I_SecurityToken.transfer(account_investor5, new BN(web3.utils.toWei("1", "ether")), { from: account_investor1 }));
        });

        it("Use 100% of issuance approval", async () => {
            await I_SecurityToken.mint(account_investor5, new BN(web3.utils.toWei("2", "ether")), { from: token_owner });
            assert.equal((await I_SecurityToken.balanceOf(account_investor5)).toString(), new BN(web3.utils.toWei("2", "ether")).toString());
        });

        it("Check verifyTransfer without actually transferring", async () => {
            let verified = await I_SecurityToken.verifyTransfer.call(
                account_investor1,
                account_investor4,
                new BN(web3.utils.toWei("1", "ether")),
                ""
            );
            console.log(JSON.stringify(verified));
            assert.equal(verified, true);

            verified = await I_SecurityToken.verifyTransfer.call(account_investor1, account_investor4, new BN(web3.utils.toWei("2", "ether")), "");
            assert.equal(verified, false);

            verified = await I_SecurityToken.verifyTransfer.call(account_investor1, account_investor4, new BN(web3.utils.toWei("1", "ether")), "");
            assert.equal(verified, true);
        });

        it("Use remaining 50% of manual approval for transfer", async () => {
            await I_SecurityToken.transfer(account_investor4, new BN(web3.utils.toWei("1", "ether")), { from: account_investor1 });

            assert.equal((await I_SecurityToken.balanceOf(account_investor4)).toString(), new BN(web3.utils.toWei("2", "ether")).toString());
        });

        it("Check further transfers fail", async () => {
            await catchRevert(I_SecurityToken.transfer(account_investor4, new BN(web3.utils.toWei("1", "ether")), { from: account_investor1 }));

            //Check that other transfers are still valid
            await I_SecurityToken.transfer(account_investor2, new BN(web3.utils.toWei("1", "ether")), { from: account_investor1 });
        });

        it("Should fail to add a manual block because invalid _to address", async () => {
            await catchRevert(
                I_ManualApprovalTransferManager.addManualBlocking(account_investor1, "0x0", await latestTime() + duration.days(1), {
                    from: token_owner
                })
            );
        });

        it("Should fail to add a manual block because invalid expiry time", async () => {
            await catchRevert(
                I_ManualApprovalTransferManager.addManualBlocking(account_investor1, account_investor2, 99999, { from: token_owner })
            );
        });

        it("Add a manual block for a 2nd investor", async () => {
            await I_ManualApprovalTransferManager.addManualBlocking(account_investor1, account_investor2, await latestTime() + duration.days(1), {
                from: token_owner
            });
        });

        it("Should fail to add a manual block because blocking already exist", async () => {
            await catchRevert(
                I_ManualApprovalTransferManager.addManualBlocking(account_investor1, account_investor2, await latestTime() + duration.days(5), {
                    from: token_owner
                })
            );
        });

        it("Check manual block causes failure", async () => {
            await catchRevert(I_SecurityToken.transfer(account_investor2, new BN(web3.utils.toWei("1", "ether")), { from: account_investor1 }));
        });

        it("Should fail to revoke manual block because invalid _to address", async () => {
            await catchRevert(I_ManualApprovalTransferManager.revokeManualBlocking(account_investor1, "0x0", { from: token_owner }));
        });

        it("Revoke manual block and check transfer works", async () => {
            await I_ManualApprovalTransferManager.revokeManualBlocking(account_investor1, account_investor2, { from: token_owner });
            await I_SecurityToken.transfer(account_investor2, new BN(web3.utils.toWei("1", "ether")), { from: account_investor1 });
            assert.equal((await I_SecurityToken.balanceOf(account_investor2)).toString(), new BN(web3.utils.toWei("2", "ether")).toString());
        });

        it("Check manual block ignored after expiry", async () => {
            await I_ManualApprovalTransferManager.addManualBlocking(account_investor1, account_investor2, await latestTime() + duration.days(1), {
                from: token_owner
            });

            await catchRevert(I_SecurityToken.transfer(account_investor2, new BN(web3.utils.toWei("1", "ether")), { from: account_investor1 }));
            await increaseTime(1 + 24 * 60 * 60);
            await I_SecurityToken.transfer(account_investor2, new BN(web3.utils.toWei("1", "ether")), { from: account_investor1 });
        });

        it("Should successfully attach the CountTransferManager with the security token (count of 1)", async () => {
            let bytesCountTM = web3.eth.abi.encodeFunctionCall(
                {
                    name: "configure",
                    type: "function",
                    inputs: [
                        {
                            type: "uint256",
                            name: "_maxHolderCount"
                        }
                    ]
                },
                [1]
            );

            const tx = await I_SecurityToken.addModule(I_CountTransferManagerFactory.address, bytesCountTM, new BN(0), new BN(0), { from: token_owner });
            assert.equal(tx.logs[2].args._types[0].toNumber(), transferManagerKey, "CountTransferManager doesn't get deployed");
            let name = web3.utils.toUtf8(tx.logs[2].args._name);
            assert.equal(name, "CountTransferManager", "CountTransferManager module was not added");
            I_CountTransferManager = await CountTransferManager.at(tx.logs[2].args._module);
        });

        it("Should get the permission list", async () => {
            let perm = await I_ManualApprovalTransferManager.getPermissions.call();
            assert.equal(perm.length, 1);
        });

        it("Should get the init function", async () => {
            let byte = await I_ManualApprovalTransferManager.getInitFunction.call();
            assert.equal(web3.utils.toAscii(byte).replace(/\u0000/g, ""), 0);
        });
    });

    describe("ManualApproval Transfer Manager Factory test cases", async () => {
        it("Should get the exact details of the factory", async () => {
            assert.equal(await I_ManualApprovalTransferManagerFactory.getSetupCost.call(), 0);
            assert.equal((await I_ManualApprovalTransferManagerFactory.getTypes.call())[0], 2);
            let name = web3.utils.toUtf8(await I_ManualApprovalTransferManagerFactory.getName.call());
            assert.equal(name, "ManualApprovalTransferManager", "Wrong Module added");
            let desc = await I_ManualApprovalTransferManagerFactory.description.call();
            assert.equal(desc, "Manage transfers using single approvals / blocking", "Wrong Module added");
            let title = await I_ManualApprovalTransferManagerFactory.title.call();
            assert.equal(title, "Manual Approval Transfer Manager", "Wrong Module added");
            let inst = await I_ManualApprovalTransferManagerFactory.getInstructions.call();
            assert.equal(
                inst,
                "Allows an issuer to set manual approvals or blocks for specific pairs of addresses and amounts. Init function takes no parameters.",
                "Wrong Module added"
            );
            assert.equal(await I_ManualApprovalTransferManagerFactory.version.call(), "2.0.1");
        });

        it("Should get the tags of the factory", async () => {
            let tags = await I_ManualApprovalTransferManagerFactory.getTags.call();
            assert.equal(web3.utils.toUtf8(tags[0]), "ManualApproval");
        });
    });
});
