import latestTime from "./helpers/latestTime";
import { duration, ensureException, promisifyLogWatch, latestBlock } from "./helpers/utils";
import takeSnapshot, { increaseTime, revertToSnapshot } from "./helpers/time";
import { encodeProxyCall } from "./helpers/encodeCall";
import { catchRevert } from "./helpers/exceptions";
import { setUpPolymathNetwork, deployManualApprovalTMAndVerifyed, deployGPMAndVerifyed, deployCountTMAndVerifyed } from "./helpers/createInstances";

const SecurityToken = artifacts.require("./SecurityToken.sol");
const GeneralTransferManager = artifacts.require("./GeneralTransferManager");
const ManualApprovalTransferManager = artifacts.require("./ManualApprovalTransferManager");
const CountTransferManager = artifacts.require("./CountTransferManager");
const GeneralPermissionManager = artifacts.require("./GeneralPermissionManager");

const Web3 = require("web3");
const BigNumber = require("bignumber.js");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port

contract("ManualApprovalTransferManager", accounts => {
    // Accounts Variable declaration
    let account_polymath;
    let account_issuer;
    let token_owner;
    let account_investor1;
    let account_investor2;
    let account_investor3;
    let account_investor4;
    let account_investor5;

    // investor Details
    let fromTime = latestTime();
    let toTime = latestTime();
    let expiryTime = toTime + duration.days(15);

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

    let expiryTimeMA;
    let approvalTime;

    // Initial fee for ticker registry and security token registry
    const initRegFee = web3.utils.toWei("250");

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
        [I_GeneralPermissionManagerFactory] = await deployGPMAndVerifyed(account_polymath, I_MRProxied, I_PolyToken.address, 0);
        // STEP 3: Deploy the ManualApprovalTransferManagerFactory
        [I_ManualApprovalTransferManagerFactory] = await deployManualApprovalTMAndVerifyed(account_polymath, I_MRProxied, I_PolyToken.address, 0);
        // STEP 4: Deploy the Paid ManualApprovalTransferManagerFactory
        [P_ManualApprovalTransferManagerFactory] = await deployManualApprovalTMAndVerifyed(account_polymath, I_MRProxied, I_PolyToken.address, web3.utils.toWei("500", "ether"));
        // STEP 5: Deploy the CountTransferManagerFactory
        [I_CountTransferManagerFactory] = await deployCountTMAndVerifyed(account_polymath, I_MRProxied, I_PolyToken.address, 0);

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
            let _blockNo = latestBlock();
            let tx = await I_STRProxied.generateSecurityToken(name, symbol, tokenDetails, false, { from: token_owner });

            // Verify the successful generation of the security token
            assert.equal(tx.logs[1].args._ticker, symbol.toUpperCase(), "SecurityToken doesn't get deployed");

            I_SecurityToken = SecurityToken.at(tx.logs[1].args._securityTokenAddress);

            const log = await promisifyLogWatch(I_SecurityToken.ModuleAdded({ from: _blockNo }), 1);

            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._types[0].toNumber(), 2);
            assert.equal(web3.utils.toUtf8(log.args._name), "GeneralTransferManager");
        });

        it("Should intialize the auto attached modules", async () => {
            let moduleData = (await I_SecurityToken.getModulesByType(2))[0];
            I_GeneralTransferManager = GeneralTransferManager.at(moduleData);
        });
    });

    describe("Buy tokens using whitelist & manual approvals", async () => {
        it("Should Buy the tokens", async () => {
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_investor1,
                latestTime(),
                latestTime(),
                latestTime() + duration.days(30),
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
            await I_SecurityToken.mint(account_investor1, web3.utils.toWei("30", "ether"), { from: token_owner });

            assert.equal((await I_SecurityToken.balanceOf(account_investor1)).toNumber(), web3.utils.toWei("30", "ether"));
        });

        it("Should Buy some more tokens", async () => {
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_investor2,
                latestTime(),
                latestTime(),
                latestTime() + duration.days(30),
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
            await I_SecurityToken.mint(account_investor2, web3.utils.toWei("10", "ether"), { from: token_owner });

            assert.equal((await I_SecurityToken.balanceOf(account_investor2)).toNumber(), web3.utils.toWei("10", "ether"));
        });

        it("Should successfully attach the ManualApprovalTransferManager with the security token", async () => {
            await I_PolyToken.getTokens(web3.utils.toWei("500", "ether"), token_owner);
            await catchRevert(
                I_SecurityToken.addModule(P_ManualApprovalTransferManagerFactory.address, "0x", web3.utils.toWei("500", "ether"), 0, {
                    from: token_owner
                })
            );
        });

        it("Should successfully attach the General permission manager factory with the security token", async () => {
            let snapId = await takeSnapshot();
            await I_PolyToken.transfer(I_SecurityToken.address, web3.utils.toWei("500", "ether"), { from: token_owner });
            const tx = await I_SecurityToken.addModule(
                P_ManualApprovalTransferManagerFactory.address,
                "0x",
                web3.utils.toWei("500", "ether"),
                0,
                { from: token_owner }
            );
            assert.equal(tx.logs[3].args._types[0].toNumber(), transferManagerKey, "Manual Approval Transfer Manager doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[3].args._name).replace(/\u0000/g, ""),
                "ManualApprovalTransferManager",
                "ManualApprovalTransferManagerFactory module was not added"
            );
            P_ManualApprovalTransferManagerFactory = ManualApprovalTransferManager.at(tx.logs[3].args._module);
            await revertToSnapshot(snapId);
        });

        it("Should successfully attach the ManualApprovalTransferManager with the security token", async () => {
            const tx = await I_SecurityToken.addModule(I_ManualApprovalTransferManagerFactory.address, "", 0, 0, { from: token_owner });
            assert.equal(tx.logs[2].args._types[0].toNumber(), transferManagerKey, "ManualApprovalTransferManager doesn't get deployed");
            assert.equal(
                web3.utils.toUtf8(tx.logs[2].args._name),
                "ManualApprovalTransferManager",
                "ManualApprovalTransferManager module was not added"
            );
            I_ManualApprovalTransferManager = ManualApprovalTransferManager.at(tx.logs[2].args._module);
        });
        //function verifyTransfer(address _from, address _to, uint256 _amount, bool _isTransfer) public returns(Result) {
        it("Cannot call verifyTransfer on the TM directly if _isTransfer == true", async () => {
            await catchRevert(
                I_ManualApprovalTransferManager.verifyTransfer(
                    account_investor4,
                    account_investor4,
                    web3.utils.toWei("2", "ether"),
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
                web3.utils.toWei("2", "ether"),
                "",
                false,
                { from: token_owner }
            );
        });

        it("Add a new token holder", async () => {
            let tx = await I_GeneralTransferManager.modifyWhitelist(
                account_investor3,
                latestTime(),
                latestTime(),
                latestTime() + duration.days(10),
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
            await I_ManualApprovalTransferManager.pause({from: token_owner});
            // Add the Investor in to the whitelist
            // Mint some tokens
            await I_SecurityToken.mint(account_investor3, web3.utils.toWei("10", "ether"), { from: token_owner });

            assert.equal((await I_SecurityToken.balanceOf(account_investor3)).toNumber(), web3.utils.toWei("10", "ether"));
            // Unpause at the transferManager level
            await I_ManualApprovalTransferManager.unpause({from: token_owner});
        });

        it("Should still be able to transfer between existing token holders", async () => {
            // Add the Investor in to the whitelist
            // Mint some tokens
            await I_SecurityToken.transfer(account_investor1, web3.utils.toWei("1", "ether"), { from: account_investor2 });

            assert.equal((await I_SecurityToken.balanceOf(account_investor1)).toNumber(), web3.utils.toWei("31", "ether"));
        });

        it("Should fail to add a manual approval because invalid _to address", async () => {
            await catchRevert(
                I_ManualApprovalTransferManager.addManualApproval(
                    account_investor1,
                    "",
                    web3.utils.toWei("2", "ether"),
                    latestTime() + duration.days(1),
                    "DESCRIPTION",
                    { from: token_owner }
                )
            );
        });

        it("Should fail to add a manual approval because invalid expiry time", async () => {
            await catchRevert(
                I_ManualApprovalTransferManager.addManualApproval(
                    account_investor1,
                    account_investor4,
                    web3.utils.toWei("2", "ether"),
                    99999,
                    "DESCRIPTION",
                    { from: token_owner }
                )
            );
        });

        it("Add a manual approval for a 4th investor & return correct length", async () => {
            approvalTime = latestTime() + duration.days(1);
            await I_ManualApprovalTransferManager.addManualApproval(
                account_investor1,
                account_investor4,
                web3.utils.toWei("3", "ether"),
                approvalTime,
                "DESCRIPTION",
                { 
                    from: token_owner
                }
            );
            assert.equal((await I_ManualApprovalTransferManager.getTotalApprovalsLength.call()).toNumber(), 1);
        });

        it("Should return all approvals correctly", async () => {

            console.log("current approval length is " + (await I_ManualApprovalTransferManager.getTotalApprovalsLength.call()).toNumber());

            let tx = await I_ManualApprovalTransferManager.getAllApprovals({from: token_owner });
            assert.equal(tx[0][0], account_investor1);
            console.log("1");
            assert.equal(tx[1][0], account_investor4);
            console.log("2");
            assert.equal(tx[2][0], web3.utils.toWei("3"));
            console.log("3");
            assert.equal(tx[3][0].toNumber(), approvalTime);
            console.log("4");
            assert.equal(web3.utils.toUtf8(tx[4][0]), "DESCRIPTION");
        })

        it("Should try to add the same manual approval for the same `_from` & `_to` address", async() => {
            await catchRevert(
                I_ManualApprovalTransferManager.addManualApproval(
                    account_investor1,
                    account_investor4,
                    web3.utils.toWei("5", "ether"),
                    latestTime() + duration.days(1),
                    "DESCRIPTION",
                    { 
                        from: token_owner
                    }
                )
            );
        })

        it("Check verifyTransfer without actually transferring", async () => {
            let verified = await I_SecurityToken.verifyTransfer.call(
                account_investor1,
                account_investor4,
                web3.utils.toWei("2", "ether"),
                ""
            );
            console.log(JSON.stringify(verified));
            assert.equal(verified, true);

            verified = await I_SecurityToken.verifyTransfer.call(account_investor1, account_investor4, web3.utils.toWei("4", "ether"), "");
            assert.equal(verified, false);

            verified = await I_SecurityToken.verifyTransfer.call(account_investor1, account_investor4, web3.utils.toWei("1", "ether"), "");
            assert.equal(verified, true);
        });

        it("Should fail to sell the tokens more than the allowance", async() => {
            await catchRevert(
                I_SecurityToken.transfer(account_investor4, web3.utils.toWei("4"), {from: account_investor1})
            );
        })

        it("Approval fails with wrong from to address", async () => {
            await catchRevert(I_SecurityToken.transfer(account_investor5, web3.utils.toWei("1", "ether"), { from: account_investor1 }));
        });

        it("Should sell the tokens to investor 4 (GTM will give INVALID as investor 4 not in the whitelist)", async() => {
            let oldBal4 = await I_SecurityToken.balanceOf.call(account_investor4);
            await I_SecurityToken.transfer(account_investor4, web3.utils.toWei("1"), {from: account_investor1});
            let newBal4 = await I_SecurityToken.balanceOf.call(account_investor4);
            assert.equal((newBal4.minus(oldBal4)).dividedBy(new BigNumber(10).pow(18)).toNumber(), 1);
        });

        it("Should sell more tokens to investor 4 with in the same day(GTM will give INVALID as investor 4 not in the whitelist)", async() => {
            let oldBal4 = await I_SecurityToken.balanceOf.call(account_investor4);
            await I_SecurityToken.transfer(account_investor4, web3.utils.toWei("1"), {from: account_investor1});
            let newBal4 = await I_SecurityToken.balanceOf.call(account_investor4);
            assert.equal((newBal4.minus(oldBal4)).dividedBy(new BigNumber(10).pow(18)).toNumber(), 1);


            let tx = await I_ManualApprovalTransferManager.getActiveApprovalsToUser.call(account_investor1);
            let tx2 =  await I_ManualApprovalTransferManager.getActiveApprovalsToUser.call(account_investor4);

            assert.equal(tx2[0].length, 1);
            assert.equal(tx[0].length, 1);
        });

        it("Should fail to transact after the approval get expired", async() => {
            await increaseTime(duration.days(1));
            await catchRevert(
                I_SecurityToken.transfer(account_investor4, web3.utils.toWei("1"), {from: account_investor1})
            );
        });

        it("Should fail to modify the manual approval when the approval get expired", async() => {
            await catchRevert(
                I_ManualApprovalTransferManager.modifyManualApproval(
                    account_investor1,
                    account_investor4,
                    latestTime() + duration.days(2),
                    web3.utils.toWei("5"),
                    "New Description",
                    0,
                    { 
                        from: token_owner
                    }
                )
            );
        });

        it("Should attach the manual approval for the investor4 again", async() => {
            assert.equal((await I_ManualApprovalTransferManager.getActiveApprovalsToUser.call(account_investor4))[0].length, 0);
            await I_ManualApprovalTransferManager.addManualApproval(
                account_investor1,
                account_investor4,
                web3.utils.toWei("2", "ether"),
                latestTime() + duration.days(1),
                "DESCRIPTION",
                { 
                    from: token_owner
                }
            );
            assert.equal((await I_ManualApprovalTransferManager.getTotalApprovalsLength.call()).toNumber(), 1);
            let data = await I_ManualApprovalTransferManager.approvals.call(0);
            assert.equal(data[0], account_investor1);
            assert.equal(data[1], account_investor4);
            assert.equal(data[2], web3.utils.toWei("2"));
            assert.equal(web3.utils.toUtf8(data[4]), "DESCRIPTION");
        });

        it("Should modify the manual approval expiry time for 4th investor", async () => {
            expiryTimeMA = latestTime() + duration.days(3);
            let tx = await I_ManualApprovalTransferManager.modifyManualApproval(
                    account_investor1,
                    account_investor4,
                    expiryTimeMA,
                    web3.utils.toWei("5"),
                    "New Description",
                    45,
                    { 
                        from: token_owner
                    }
                );

            let data = await I_ManualApprovalTransferManager.approvals.call(0);
            assert.equal(data[0], account_investor1);
            assert.equal(data[1], account_investor4);
            assert.equal(data[2], web3.utils.toWei("2"));
            assert.equal(data[3].toNumber(), expiryTimeMA);
            assert.equal(web3.utils.toUtf8(data[4]), "New Description");
            assert.equal(tx.logs[0].args._from, account_investor1);
            assert.equal(tx.logs[0].args._to, account_investor4);
            assert.equal((tx.logs[0].args._expiryTime).toNumber(), expiryTimeMA);
            assert.equal((tx.logs[0].args._allowance).toNumber(), web3.utils.toWei("2"));
            assert.equal(web3.utils.toUtf8(tx.logs[0].args._description), "New Description");
        });

        it("Should transact after two days", async() => {
            await increaseTime(2);
            let oldBal4 = await I_SecurityToken.balanceOf.call(account_investor4);
            await I_SecurityToken.transfer(account_investor4, web3.utils.toWei("1"), {from: account_investor1});
            let newBal4 = await I_SecurityToken.balanceOf.call(account_investor4);
            assert.equal((newBal4.minus(oldBal4)).dividedBy(new BigNumber(10).pow(18)).toNumber(), 1);
        });

        it("Should modify the allowance of the manual approval (increase)", async() => {
            await I_ManualApprovalTransferManager.modifyManualApproval(
                account_investor1,
                account_investor4,
                expiryTimeMA,
                web3.utils.toWei("4"),
                "New Description",
                1,
                { 
                    from: token_owner
                }
            );

            let data = await I_ManualApprovalTransferManager.approvals.call(0);
            assert.equal(data[0], account_investor1);
            assert.equal(data[1], account_investor4);
            assert.equal(data[2].toNumber(), web3.utils.toWei("5"));
            assert.equal(data[3].toNumber(), expiryTimeMA);
            assert.equal(web3.utils.toUtf8(data[4]), "New Description");
        });

        it("Should transact according to new allowance", async() => {
            let oldBal4 = await I_SecurityToken.balanceOf.call(account_investor4);
            await I_SecurityToken.transfer(account_investor4, web3.utils.toWei("3"), {from: account_investor1});
            let newBal4 = await I_SecurityToken.balanceOf.call(account_investor4);
            assert.equal((newBal4.minus(oldBal4)).dividedBy(new BigNumber(10).pow(18)).toNumber(), 3);
        });

        it("Should decrease the allowance", async() => {
            await I_ManualApprovalTransferManager.modifyManualApproval(
                account_investor1,
                account_investor4,
                expiryTimeMA,
                web3.utils.toWei("1"),
                "New Description",
                0,
                { 
                    from: token_owner
                }
            );

            let data = await I_ManualApprovalTransferManager.approvals.call(0);
            assert.equal(data[0], account_investor1);
            assert.equal(data[1], account_investor4);
            assert.equal(data[2].toNumber(), web3.utils.toWei("1"));
            assert.equal(data[3].toNumber(), expiryTimeMA);
            assert.equal(web3.utils.toUtf8(data[4]), "New Description");
        });

        it("Should fail to transfer the tokens because allowance get changed", async() => {
            await catchRevert(
                I_SecurityToken.transfer(account_investor4, web3.utils.toWei("2"), {from: account_investor1})
            );
        });

        it("Should successfully transfer the tokens within the allowance limit", async() => {
            let oldBal4 = await I_SecurityToken.balanceOf.call(account_investor4);
            await I_SecurityToken.transfer(account_investor4, web3.utils.toWei("1"), {from: account_investor1});
            let newBal4 = await I_SecurityToken.balanceOf.call(account_investor4);
            assert.equal((newBal4.minus(oldBal4)).dividedBy(new BigNumber(10).pow(18)).toNumber(), 1);
        });

        it("Should fail to modify because allowance is zero", async() => {
            await catchRevert(
                I_ManualApprovalTransferManager.modifyManualApproval(
                    account_investor1,
                    account_investor4,
                    expiryTimeMA,
                    web3.utils.toWei("5"),
                    "New Description",
                    0,
                    { 
                        from: token_owner
                    }
                )
            );
        });

        it("Should fail to revoke the manual Approval -- bad owner", async() => {
            await catchRevert(
                I_ManualApprovalTransferManager.revokeManualApproval(account_investor1, account_investor4, {from: account_investor5})
            );
        })

        it("Should revoke the manual Approval b/w investor4 and 1", async() => {
            await I_ManualApprovalTransferManager.revokeManualApproval(account_investor1, account_investor4, {from: token_owner});
            assert.equal((await I_ManualApprovalTransferManager.getActiveApprovalsToUser.call(account_investor1))[0].length, 0);
            assert.equal((await I_ManualApprovalTransferManager.getActiveApprovalsToUser.call(account_investor4))[0].length, 0);
        });

        it("Should fail to revoke the same manual approval again", async() => {
            await catchRevert(
                I_ManualApprovalTransferManager.revokeManualApproval(account_investor1, account_investor4, {from: token_owner})
            );
        });

        it("Should fail to add multiple manual approvals -- failed because of bad owner", async () => {
            await catchRevert (
                    I_ManualApprovalTransferManager.addManualApprovalMulti(
                    [account_investor2,account_investor3],
                    [account_investor3,account_investor4],
                    [web3.utils.toWei("2", "ether"), web3.utils.toWei("2", "ether")],
                    [latestTime() + duration.days(1),latestTime() + duration.days(1)],
                    ["DESCRIPTION_1", "DESCRIPTION_2"],
                    { 
                        from: account_investor5
                    }
                )
            )
        });

        it("Should fail to add multiple manual approvals -- failed because of length mismatch", async () => {
            await catchRevert (
                    I_ManualApprovalTransferManager.addManualApprovalMulti(
                    [account_investor2],
                    [account_investor3,account_investor4],
                    [web3.utils.toWei("2", "ether"), web3.utils.toWei("2", "ether")],
                    [latestTime() + duration.days(1),latestTime() + duration.days(1)],
                    ["DESCRIPTION_1", "DESCRIPTION_2"],
                    { 
                        from: token_owner
                    }
                )
            )
        });

        it("Should fail to add multiple manual approvals -- failed because of length mismatch", async () => {
            await catchRevert (
                    I_ManualApprovalTransferManager.addManualApprovalMulti(
                    [account_investor2,account_investor3],
                    [account_investor3,account_investor4],
                    [web3.utils.toWei("2", "ether"), web3.utils.toWei("2", "ether")],
                    [latestTime() + duration.days(1)],
                    ["DESCRIPTION_1", "DESCRIPTION_2"],
                    { 
                        from: token_owner
                    }
                )
            )
        });

        it("Should fail to add multiple manual approvals -- failed because of length mismatch", async () => {
            await catchRevert (
                    I_ManualApprovalTransferManager.addManualApprovalMulti(
                    [account_investor2,account_investor3],
                    [account_investor3,account_investor4],
                    [web3.utils.toWei("2", "ether")],
                    [latestTime() + duration.days(1),latestTime() + duration.days(1)],
                    ["DESCRIPTION_1", "DESCRIPTION_2"],
                    { 
                        from: token_owner
                    }
                )
            )
        });

        it("Should fail to add multiple manual approvals -- failed because of length mismatch", async () => {
            await catchRevert (
                    I_ManualApprovalTransferManager.addManualApprovalMulti(
                    [account_investor2,account_investor3],
                    [account_investor3,account_investor4],
                    [web3.utils.toWei("2", "ether"), web3.utils.toWei("2", "ether")],
                    [latestTime() + duration.days(1),latestTime() + duration.days(1)],
                    ["DESCRIPTION_1"],
                    { 
                        from: token_owner
                    }
                )
            )
        });

        it("Add multiple manual approvals", async () => {
            let time = latestTime() + duration.days(1);
            await I_ManualApprovalTransferManager.addManualApprovalMulti(
                [account_investor2,account_investor3],
                [account_investor3,account_investor4],
                [web3.utils.toWei("2", "ether"), web3.utils.toWei("2", "ether")],
                [time,latestTime() + duration.days(1)],
                ["DESCRIPTION_1", "DESCRIPTION_2"],
                { 
                    from: token_owner
                }
            );

            assert.equal(await I_ManualApprovalTransferManager.getTotalApprovalsLength.call(), 2);
            assert.equal((await I_ManualApprovalTransferManager.getActiveApprovalsToUser.call(account_investor3))[0].length , 2);
            assert.equal((await I_ManualApprovalTransferManager.getActiveApprovalsToUser.call(account_investor3))[0][1], account_investor3);
            assert.equal((await I_ManualApprovalTransferManager.getActiveApprovalsToUser.call(account_investor3))[1][0], account_investor3);
            let approvalDetail = await I_ManualApprovalTransferManager.getApprovalDetails.call(account_investor2, account_investor3);
            assert.equal(approvalDetail[0].toNumber(), time);
            assert.equal(approvalDetail[1].toNumber(), web3.utils.toWei("2", "ether"));
            assert.equal(web3.utils.toUtf8(approvalDetail[2]), "DESCRIPTION_1");
        });

        it("Should fail to revoke the multiple manual approvals -- because of bad owner", async() => {
            await catchRevert(
                I_ManualApprovalTransferManager.revokeManualApprovalMulti(
                    [account_investor2,account_investor3],
                    [account_investor3,account_investor4],
                    { 
                        from: account_investor5
                    }
                )
            );
        })

        it("Should fail to revoke the multiple manual approvals -- because of input length mismatch", async() => {
            await catchRevert(
                I_ManualApprovalTransferManager.revokeManualApprovalMulti(
                    [account_investor2,account_investor3],
                    [account_investor3],
                    { 
                        from: token_owner
                    }
                )
            );
        })

        it("Revoke multiple manual approvals", async () => {
            await I_ManualApprovalTransferManager.revokeManualApprovalMulti(
                [account_investor2,account_investor3],
                [account_investor3,account_investor4],
                { 
                    from: token_owner
                }
            );
            assert.equal(await I_ManualApprovalTransferManager.getTotalApprovalsLength.call(), 0);
        });

        it("Add a manual approval for a 5th investor from issuance", async () => {
            await I_ManualApprovalTransferManager.addManualApproval(
                "",
                account_investor5,
                web3.utils.toWei("2", "ether"),
                latestTime() + duration.days(1),
                "DESCRIPTION",
                { 
                    from: token_owner
                }
            );
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

            const tx = await I_SecurityToken.addModule(I_CountTransferManagerFactory.address, bytesCountTM, 0, 0, { from: token_owner });
            assert.equal(tx.logs[2].args._types[0].toNumber(), transferManagerKey, "CountTransferManager doesn't get deployed");
            let name = web3.utils.toUtf8(tx.logs[2].args._name);
            assert.equal(name, "CountTransferManager", "CountTransferManager module was not added");
            I_CountTransferManager = CountTransferManager.at(tx.logs[2].args._module);
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
            assert.equal(desc, "Manage transfers using single approvals", "Wrong Module added");
            let title = await I_ManualApprovalTransferManagerFactory.title.call();
            assert.equal(title, "Manual Approval Transfer Manager", "Wrong Module added");
            let inst = await I_ManualApprovalTransferManagerFactory.getInstructions.call();
            assert.equal(
                inst,
                "Allows an issuer to set manual approvals for specific pairs of addresses and amounts. Init function takes no parameters.",
                "Wrong Module added"
            );
            assert.equal(await I_ManualApprovalTransferManagerFactory.version.call(), "2.1.0");
        });

        it("Should get the tags of the factory", async () => {
            let tags = await I_ManualApprovalTransferManagerFactory.getTags.call();
            assert.equal(web3.utils.toUtf8(tags[0]), "ManualApproval");
        });
    });
});
