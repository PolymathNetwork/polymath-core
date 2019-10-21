import latestTime from "./helpers/latestTime";
import { duration } from "./helpers/utils";
import { takeSnapshot, increaseTime, revertToSnapshot } from "./helpers/time";
import { catchRevert } from "./helpers/exceptions";
import { setUpPolymathNetwork, deployManualApprovalTMAndVerifyed, deployGPMAndVerifyed, deployCountTMAndVerifyed } from "./helpers/createInstances";

const SecurityToken = artifacts.require("./SecurityToken.sol");
const GeneralTransferManager = artifacts.require("./GeneralTransferManager");
const ManualApprovalTransferManager = artifacts.require("./ManualApprovalTransferManager");
const CountTransferManager = artifacts.require("./CountTransferManager");
const STGetter = artifacts.require("./STGetter.sol");

const Web3 = require("web3");
let BN = Web3.utils.BN;
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port

const SUCCESS_CODE = 0x51;
const FAILURE_CODE = 0x50;


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
    let account_investor6;
    let account_investor7;

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
    let I_STRGetter;
    let I_STGetter;
    let stGetter;

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
    const initRegFee = web3.utils.toWei("1000");

    const STOParameters = ["uint256", "uint256", "uint256", "uint256", "uint8[]", "address"];
    let currentTime;
    before(async () => {
        currentTime = new BN(await latestTime());
        // Accounts setup
        account_polymath = accounts[0];
        account_issuer = accounts[1];

        token_owner = account_issuer;

        account_investor1 = accounts[6];
        account_investor2 = accounts[7];
        account_investor3 = accounts[8];
        account_investor4 = accounts[9];
        account_investor5 = accounts[5];
        account_investor6 = accounts[2];
        account_investor7 = accounts[3];


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

        // STEP 2: Deploy the GeneralDelegateManagerFactory
        [I_GeneralPermissionManagerFactory] = await deployGPMAndVerifyed(account_polymath, I_MRProxied, 0);
        // STEP 3: Deploy the ManualApprovalTransferManagerFactory
        [I_ManualApprovalTransferManagerFactory] = await deployManualApprovalTMAndVerifyed(account_polymath, I_MRProxied, 0);
        // STEP 4: Deploy the Paid ManualApprovalTransferManagerFactory
        [P_ManualApprovalTransferManagerFactory] = await deployManualApprovalTMAndVerifyed(account_polymath, I_MRProxied, web3.utils.toWei("500", "ether"));
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
            assert.equal(log.args._types[0].toString(), 2);
            assert.equal(web3.utils.toUtf8(log.args._name), "GeneralTransferManager");
        });

        it("Should initialize the auto attached modules", async () => {
            let moduleData = (await stGetter.getModulesByType(2))[0];
            I_GeneralTransferManager = await GeneralTransferManager.at(moduleData);
        });
    });

    describe("Buy tokens using whitelist & manual approvals", async () => {
        it("Should Buy the tokens", async () => {
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyKYCData(
                account_investor1,
                currentTime,
                currentTime,
                currentTime.add(new BN(duration.days(30))),
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
            currentTime = new BN(await latestTime());
            // Mint some tokens
            await I_SecurityToken.issue(account_investor1, new BN(web3.utils.toWei("30", "ether")), "0x0", { from: token_owner });

            assert.equal((await I_SecurityToken.balanceOf(account_investor1)).toString(), web3.utils.toWei("30", "ether"));
        });

        it("Should Buy some more tokens", async () => {
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyKYCData(
                account_investor2,
                currentTime,
                currentTime,
                currentTime.add(new BN(duration.days(30))),
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
            await I_SecurityToken.issue(account_investor2, new BN(web3.utils.toWei("10", "ether")), "0x0", { from: token_owner });

            assert.equal((await I_SecurityToken.balanceOf(account_investor2)).toString(), web3.utils.toWei("10", "ether"));
        });

        it("Should fail to attach the ManualApprovalTransferManager without sufficient tokens", async () => {
            await I_PolyToken.getTokens(web3.utils.toWei("2000", "ether"), token_owner);
            await catchRevert(
                I_SecurityToken.addModule(P_ManualApprovalTransferManagerFactory.address, "0x0", web3.utils.toWei("2000", "ether"), 0, false, {
                    from: token_owner
                }),
                "Insufficient tokens transferable"
            );
        });

        it("Should successfully attach the General permission manager factory with the security token", async () => {
            let snapId = await takeSnapshot();
            await I_PolyToken.transfer(I_SecurityToken.address, web3.utils.toWei("2000", "ether"), { from: token_owner });
            const tx = await I_SecurityToken.addModule(
                P_ManualApprovalTransferManagerFactory.address,
                "0x0",
                web3.utils.toWei("2000", "ether"),
                0,
                false,
                { from: token_owner }
            );
            assert.equal(tx.logs[3].args._types[0].toString(), transferManagerKey, "Manual Approval Transfer Manager doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[3].args._name).replace(/\u0000/g, ""),
                "ManualApprovalTransferManager",
                "ManualApprovalTransferManagerFactory module was not added"
            );
            P_ManualApprovalTransferManagerFactory = await ManualApprovalTransferManager.at(tx.logs[3].args._module);
            await revertToSnapshot(snapId);
        });

        it("Should successfully attach the ManualApprovalTransferManager with the security token", async () => {
            const tx = await I_SecurityToken.addModule(I_ManualApprovalTransferManagerFactory.address, "0x0", 0, 0, false, { from: token_owner });
            assert.equal(tx.logs[2].args._types[0].toString(), transferManagerKey, "ManualApprovalTransferManager doesn't get deployed");
            assert.equal(
                web3.utils.toUtf8(tx.logs[2].args._name),
                "ManualApprovalTransferManager",
                "ManualApprovalTransferManager module was not added"
            );
            I_ManualApprovalTransferManager = await ManualApprovalTransferManager.at(tx.logs[2].args._module);
        });

        it("Cannot call executeTransfer on the TM directly", async () => {
            await catchRevert(
                I_ManualApprovalTransferManager.executeTransfer(
                    account_investor4,
                    account_investor4,
                    web3.utils.toWei("2", "ether"),
                    "0x0",
                    { from: token_owner }
                ),
                "Sender is not owner"
            );
        });

        it("Can call verifyTransfer on the TM directly if _isTransfer == false", async () => {
            await I_ManualApprovalTransferManager.verifyTransfer(
                account_investor4,
                account_investor4,
                web3.utils.toWei("2", "ether"),
                "0x0",
                { from: token_owner }
            );
        });

        it("Add a new token holder", async () => {
            let tx = await I_GeneralTransferManager.modifyKYCData(
                account_investor3,
                currentTime,
                currentTime,
                currentTime.add(new BN(duration.days(10))),
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
            await I_SecurityToken.issue(account_investor3, new BN(web3.utils.toWei("10", "ether")),"0x0", { from: token_owner });

            assert.equal((await I_SecurityToken.balanceOf(account_investor3)).toString(), web3.utils.toWei("10", "ether"));
            // Unpause at the transferManager level
            await I_ManualApprovalTransferManager.unpause({from: token_owner});
        });

        it("Should still be able to transfer between existing token holders", async () => {
            // Add the Investor in to the whitelist
            // Mint some tokens
            await I_SecurityToken.transfer(account_investor1, web3.utils.toWei("1", "ether"), { from: account_investor2 });

            assert.equal((await I_SecurityToken.balanceOf(account_investor1)).toString(), web3.utils.toWei("31", "ether"));
        });

        it("Should fail to add a manual approval because invalid expiry time", async () => {
            await catchRevert(
                I_ManualApprovalTransferManager.addManualApproval(
                    account_investor1,
                    account_investor4,
                    web3.utils.toWei("2", "ether"),
                    99999,
                    web3.utils.fromAscii("DESCRIPTION"),
                    { from: token_owner }
                ),
                "Invalid expiry time"
            );
        });

        it("Should fail to add a manual approval because of invalid allowance", async () => {
            await catchRevert(
                I_ManualApprovalTransferManager.addManualApproval(
                    account_investor1,
                    account_investor4,
                    0,
                    currentTime.add(new BN(duration.days(1))),
                    web3.utils.fromAscii("DESCRIPTION"),
                    { from: token_owner }
                ),
                "Invalid allowance"
            );
        });

        it("Add a manual approval for a 4th investor & return correct length", async () => {
            approvalTime = currentTime.add(new BN(duration.days(1)));
            await I_ManualApprovalTransferManager.addManualApproval(
                account_investor1,
                account_investor4,
                web3.utils.toWei("3", "ether"),
                approvalTime,
                web3.utils.fromAscii("DESCRIPTION"),
                {
                    from: token_owner
                }
            );
            assert.equal((await I_ManualApprovalTransferManager.getTotalApprovalsLength.call()).toString(), 1);
        });

        it("Should return all approvals correctly", async () => {

            console.log("current approval length is " + (await I_ManualApprovalTransferManager.getTotalApprovalsLength.call()).toString());

            let tx = await I_ManualApprovalTransferManager.getAllApprovals({from: token_owner });
            assert.equal(tx[0][0], account_investor1);
            console.log("1");
            assert.equal(tx[1][0], account_investor4);
            console.log("2");
            assert.equal(tx[2][0], web3.utils.toWei("3"));
            console.log("4");
            assert.equal(tx[4][0].toString(), approvalTime);
            console.log("5");
            assert.equal(web3.utils.toUtf8(tx[5][0]), "DESCRIPTION");
        })

        it("Should fail to add the same manual approval for the same `_from` & `_to` address", async() => {
            await catchRevert(
                I_ManualApprovalTransferManager.addManualApproval(
                    account_investor1,
                    account_investor4,
                    web3.utils.toWei("5", "ether"),
                    currentTime.add(new BN(duration.days(1))),
                    web3.utils.fromAscii("DESCRIPTION"),
                    {
                        from: token_owner
                    }
                ),
                "Approval already exists"
            );
        })

        it("Check verifyTransfer without actually transferring", async () => {
            let verified = await I_SecurityToken.canTransfer.call(
                account_investor4,
                web3.utils.toWei("2", "ether"),
                "0x0",
                {
                    from: account_investor1
                }
            );
            // console.log(JSON.stringify(verified[0]));
            assert.equal(verified[0], SUCCESS_CODE);

            verified = await I_SecurityToken.canTransfer.call(account_investor4, web3.utils.toWei("4", "ether"), "0x0", {
                from: account_investor1
            });
            // console.log(JSON.stringify(verified[0]));
            assert.equal(verified[0], FAILURE_CODE);

            verified = await I_SecurityToken.canTransfer.call(account_investor4, web3.utils.toWei("1", "ether"), "0x0", {
                from: account_investor1
            });
            // console.log(JSON.stringify(verified[0]));
            assert.equal(verified[0], SUCCESS_CODE);
        });

        it("Should fail to sell the tokens more than the allowance", async() => {
            await catchRevert(
                I_SecurityToken.transfer(account_investor4, web3.utils.toWei("4"), {from: account_investor1}),
                "Transfer Invalid"
            );
        })

        it("Approval fails with wrong from to address", async () => {
            await catchRevert(I_SecurityToken.transfer(account_investor5, web3.utils.toWei("1", "ether"), { from: account_investor1 }),
                "Transfer Invalid");
        });

        it("Should sell the tokens to investor 4 (GTM will give INVALID as investor 4 not in the whitelist)", async() => {
            let oldBal4 = await I_SecurityToken.balanceOf.call(account_investor4);
            await I_SecurityToken.transfer(account_investor4, web3.utils.toWei("1"), {from: account_investor1});
            let newBal4 = await I_SecurityToken.balanceOf.call(account_investor4);
            assert.equal((newBal4.sub(oldBal4)).div(new BN(10).pow(new BN(18))).toString(), 1);
        });

        it("Should sell more tokens to investor 4 with in the same day(GTM will give INVALID as investor 4 not in the whitelist)", async() => {
            let oldBal4 = await I_SecurityToken.balanceOf.call(account_investor4);
            await I_SecurityToken.transfer(account_investor4, web3.utils.toWei("1"), {from: account_investor1});
            let newBal4 = await I_SecurityToken.balanceOf.call(account_investor4);
            assert.equal((newBal4.sub(oldBal4)).div(new BN(10).pow(new BN(18))).toString(), 1);


            let tx = await I_ManualApprovalTransferManager.getActiveApprovalsToUser.call(account_investor1);
            let tx2 =  await I_ManualApprovalTransferManager.getActiveApprovalsToUser.call(account_investor4);

            assert.equal(tx2[0].length, 1);
            assert.equal(tx[0].length, 1);
        });

        it("Should fail to transact after the approval get expired", async() => {
            await increaseTime(duration.days(1));
            currentTime = new BN(await latestTime());
            await catchRevert(
                I_SecurityToken.transfer(account_investor4, web3.utils.toWei("1"), {from: account_investor1}),
                "Transfer Invalid"
            );
        });

        it("Should fail to modify the manual approval when the approval doesn't exist", async() => {
            await catchRevert(
                I_ManualApprovalTransferManager.modifyManualApproval(
                    account_investor6,
                    account_investor7,
                    currentTime.add(new BN(duration.days(2))),
                    web3.utils.toWei("5"),
                    web3.utils.fromAscii("New Description"),
                    false,
                    {
                        from: token_owner
                    }
                ),
                "Approval not present"
            );
        });

        it("Should fail to modify the manual approval when the approval doesn't exist", async() => {
            await catchRevert(
                I_ManualApprovalTransferManager.modifyManualApproval(
                    account_investor6,
                    account_investor7,
                    0,
                    web3.utils.toWei("5"),
                    web3.utils.fromAscii("New Description"),
                    false,
                    {
                        from: token_owner
                    }
                ),
                "Invalid expiry time"
            );
        });

        it("Should fail to modify the manual approval when the approval doesn't exist", async() => {
            await catchRevert(
                I_ManualApprovalTransferManager.modifyManualApproval(
                    account_investor6,
                    account_investor7,
                    currentTime.add(new BN(duration.days(2))),
                    web3.utils.toWei("5"),
                    web3.utils.fromAscii("New Description"),
                    false,
                    {
                        from: token_owner
                    }
                ),
                "Approval not present"
            );
        });

        it("Should attach the manual approval for the investor4 again", async() => {
            assert.equal((await I_ManualApprovalTransferManager.getActiveApprovalsToUser.call(account_investor4))[0].length, 0);
            currentTime = new BN(await latestTime());
            await I_ManualApprovalTransferManager.addManualApproval(
                account_investor1,
                account_investor4,
                web3.utils.toWei("2", "ether"),
                currentTime.add(new BN(duration.days(1))),
                web3.utils.fromAscii("DESCRIPTION"),
                {
                    from: token_owner
                }
            );
            assert.equal((await I_ManualApprovalTransferManager.getTotalApprovalsLength.call()).toString(), 1);
            let data = await I_ManualApprovalTransferManager.approvals.call(0);
            assert.equal(data[0], account_investor1);
            assert.equal(data[1], account_investor4);
            assert.equal(data[2], web3.utils.toWei("2"));
            assert.equal(data[3], web3.utils.toWei("2"));
            assert.equal(web3.utils.toUtf8(data[5]), "DESCRIPTION");
        });

        it("Should set allowance to zero, if allowance is to be decreased to less than the current value", async () => {
            const snapId = await takeSnapshot();
            currentTime = new BN(await latestTime());
            const tx = await I_ManualApprovalTransferManager.modifyManualApproval(
                account_investor1,
                account_investor4,
                currentTime.add(new BN(duration.days(1))),
                web3.utils.toWei("3"), // current allowance is 2 tokens.
                web3.utils.fromAscii("New Description"),
                false,
                {
                    from: token_owner
                }
            );
            assert.equal((tx.logs[0].args._allowance).toString(), '0');
            await revertToSnapshot(snapId);
        })

        it("Should modify the manual approval expiry time for 4th investor", async () => {
            currentTime = new BN(await latestTime());
            expiryTimeMA = currentTime.add(new BN(duration.days(3)));
            let tx = await I_ManualApprovalTransferManager.modifyManualApproval(
                    account_investor1,
                    account_investor4,
                    expiryTimeMA,
                    0,
                    web3.utils.fromAscii("New Description"),
                    true,
                    {
                        from: token_owner
                    }
                );

            let data = await I_ManualApprovalTransferManager.approvals.call(0);
            assert.equal(data[0], account_investor1);
            assert.equal(data[1], account_investor4);
            assert.equal(data[2], web3.utils.toWei("2"));
            assert.equal(data[3], web3.utils.toWei("2"));
            assert.equal(data[4].toString(), expiryTimeMA);
            assert.equal(web3.utils.toUtf8(data[5]), "New Description");
            assert.equal(tx.logs[0].args._from, account_investor1);
            assert.equal(tx.logs[0].args._to, account_investor4);
            assert.equal((tx.logs[0].args._expiryTime).toString(), expiryTimeMA);
            assert.equal((tx.logs[0].args._allowance).toString(), web3.utils.toWei("2"));
            assert.equal(web3.utils.toUtf8(tx.logs[0].args._description), "New Description");
        });

        it("Should transact after two days", async() => {
            await increaseTime(2);
            currentTime = new BN(await latestTime());
            let oldBal4 = await I_SecurityToken.balanceOf.call(account_investor4);
            await I_SecurityToken.transfer(account_investor4, web3.utils.toWei("1"), {from: account_investor1});
            let newBal4 = await I_SecurityToken.balanceOf.call(account_investor4);
            assert.equal((newBal4.sub(oldBal4)).div(new BN(10).pow(new BN(18))).toString(), 1);
        });

        it("Should modify the allowance of the manual approval (increase)", async() => {
            currentTime = new BN(await latestTime());
            await I_ManualApprovalTransferManager.modifyManualApproval(
                account_investor1,
                account_investor4,
                expiryTimeMA,
                web3.utils.toWei("4"),
                web3.utils.fromAscii("New Description"),
                true,
                {
                    from: token_owner
                }
            );

            let data = await I_ManualApprovalTransferManager.approvals.call(0);
            assert.equal(data[0], account_investor1);
            assert.equal(data[1], account_investor4);
            assert.equal(data[2].toString(), web3.utils.toWei("6"));
            assert.equal(data[3].toString(), web3.utils.toWei("5"));
            assert.equal(data[4].toString(), expiryTimeMA);
            assert.equal(web3.utils.toUtf8(data[5]), "New Description");
        });

        it("Should transact according to new allowance", async() => {
            currentTime = new BN(await latestTime());
            let oldBal4 = await I_SecurityToken.balanceOf.call(account_investor4);
            await I_SecurityToken.transfer(account_investor4, web3.utils.toWei("3"), {from: account_investor1});
            let newBal4 = await I_SecurityToken.balanceOf.call(account_investor4);
            assert.equal((newBal4.sub(oldBal4)).div(new BN(10).pow(new BN(18))).toString(), 3);
        });

        it("Should decrease the allowance", async() => {
            currentTime = new BN(await latestTime());
            await I_ManualApprovalTransferManager.modifyManualApproval(
                account_investor1,
                account_investor4,
                expiryTimeMA,
                web3.utils.toWei("1"),
                web3.utils.fromAscii("New Description"),
                false,
                {
                    from: token_owner
                }
            );

            let data = await I_ManualApprovalTransferManager.approvals.call(0);
            assert.equal(data[0], account_investor1);
            assert.equal(data[1], account_investor4);
            assert.equal(data[2].toString(), web3.utils.toWei("5"));
            assert.equal(data[3].toString(), web3.utils.toWei("1"));
            assert.equal(data[4].toString(), expiryTimeMA);
            assert.equal(web3.utils.toUtf8(data[5]), "New Description");
        });

        it("Should fail to transfer the tokens because allowance get changed", async() => {
            await catchRevert(
                I_SecurityToken.transfer(account_investor4, web3.utils.toWei("2"), {from: account_investor1}),
                "Transfer Invalid"
            );
        });

        it("Should successfully transfer the tokens within the allowance limit", async() => {
            currentTime = new BN(await latestTime());
            let oldBal4 = await I_SecurityToken.balanceOf.call(account_investor4);
            await I_SecurityToken.transfer(account_investor4, web3.utils.toWei("1"), {from: account_investor1});
            let newBal4 = await I_SecurityToken.balanceOf.call(account_investor4);
            assert.equal((newBal4.sub(oldBal4)).div(new BN(10).pow(new BN(18))).toString(), 1);
        });

        it("Should fail to modify because allowance is zero", async() => {
            await catchRevert(
                I_ManualApprovalTransferManager.modifyManualApproval(
                    account_investor1,
                    account_investor4,
                    expiryTimeMA,
                    web3.utils.toWei("5"),
                    web3.utils.fromAscii("New Description"),
                    false,
                    {
                        from: token_owner
                    }
                ),
                "Approval has been exhausted"
            );
        });

        it("Should fail to revoke the manual Approval -- bad owner", async() => {
            await catchRevert(
                I_ManualApprovalTransferManager.revokeManualApproval(account_investor1, account_investor4, {from: account_investor5}),
                "Invalid permission"
            );
        })

        it("Should revoke the manual Approval b/w investor4 and 1", async() => {
            await I_ManualApprovalTransferManager.revokeManualApproval(account_investor1, account_investor4, {from: token_owner});
            assert.equal((await I_ManualApprovalTransferManager.getActiveApprovalsToUser.call(account_investor1))[0].length, 0);
            assert.equal((await I_ManualApprovalTransferManager.getActiveApprovalsToUser.call(account_investor4))[0].length, 0);
        });

        it("Should fail to revoke the same manual approval again", async() => {
            await catchRevert(
                I_ManualApprovalTransferManager.revokeManualApproval(account_investor1, account_investor4, {from: token_owner}),
                "Approval not exist"
            );
        });

        it("Should fail to add multiple manual approvals -- failed because of bad owner", async () => {
            await catchRevert(
                    I_ManualApprovalTransferManager.addManualApprovalMulti(
                    [account_investor2,account_investor3],
                    [account_investor3,account_investor4],
                    [web3.utils.toWei("2", "ether"), web3.utils.toWei("2", "ether")],
                    [currentTime.add(new BN(duration.days(1))),currentTime.add(new BN(duration.days(1)))],
                    [web3.utils.fromAscii("DESCRIPTION_1"), web3.utils.fromAscii("DESCRIPTION_2")],
                    {
                        from: account_investor5
                    }
                ),
                "Invalid permission"
            )
        });

        it("Should fail to add multiple manual approvals -- failed because of length mismatch", async () => {
            await catchRevert(
                    I_ManualApprovalTransferManager.addManualApprovalMulti(
                    [account_investor2],
                    [account_investor3,account_investor4],
                    [web3.utils.toWei("2", "ether"), web3.utils.toWei("2", "ether")],
                    [currentTime.add(new BN(duration.days(1))),currentTime.add(new BN(duration.days(1)))],
                    [web3.utils.fromAscii("DESCRIPTION_1"), web3.utils.fromAscii("DESCRIPTION_2")],
                    {
                        from: token_owner
                    }
                ),
                "Input array length mismatch"
            )
        });

        it("Should fail to add multiple manual approvals -- failed because of length mismatch", async () => {
            await catchRevert(
                    I_ManualApprovalTransferManager.addManualApprovalMulti(
                    [account_investor2,account_investor3],
                    [account_investor3,account_investor4],
                    [web3.utils.toWei("2", "ether"), web3.utils.toWei("2", "ether")],
                    [currentTime.add(new BN(duration.days(1)))],
                    [web3.utils.fromAscii("DESCRIPTION_1"), web3.utils.fromAscii("DESCRIPTION_2")],
                    {
                        from: token_owner
                    }
                ),
                "Input array length mismatch"
            )
        });

        it("Should fail to add multiple manual approvals -- failed because of length mismatch", async () => {
            await catchRevert (
                    I_ManualApprovalTransferManager.addManualApprovalMulti(
                    [account_investor2,account_investor3],
                    [account_investor3,account_investor4],
                    [web3.utils.toWei("2", "ether")],
                    [currentTime.add(new BN(duration.days(1))),currentTime.add(new BN(duration.days(1)))],
                    [web3.utils.fromAscii("DESCRIPTION_1"), web3.utils.fromAscii("DESCRIPTION_2")],
                    {
                        from: token_owner
                    }
                ),
                "Input array length mismatch"
            )
        });

        it("Should fail to add multiple manual approvals -- failed because of length mismatch", async () => {
            await catchRevert(
                    I_ManualApprovalTransferManager.addManualApprovalMulti(
                    [account_investor2,account_investor3],
                    [account_investor3,account_investor4],
                    [web3.utils.toWei("2", "ether"), web3.utils.toWei("2", "ether")],
                    [currentTime.add(new BN(duration.days(1))),currentTime.add(new BN(duration.days(1)))],
                    [web3.utils.fromAscii("DESCRIPTION_1")],
                    {
                        from: token_owner
                    }
                ),
                "Input array length mismatch"
            )
        });

        it("Add multiple manual approvals, and then retrieve", async () => {
            let time = currentTime.add(new BN(duration.days(1)));
            await I_ManualApprovalTransferManager.addManualApprovalMulti(
                [account_investor2,account_investor3],
                [account_investor3,account_investor4],
                [web3.utils.toWei("2", "ether"), web3.utils.toWei("2", "ether")],
                [time,currentTime.add(new BN(duration.days(1)))],
                [web3.utils.fromAscii("DESCRIPTION_1"), web3.utils.fromAscii("DESCRIPTION_2")],
                {
                    from: token_owner
                }
            );

            assert.equal(await I_ManualApprovalTransferManager.getTotalApprovalsLength.call(), 2);
            assert.equal((await I_ManualApprovalTransferManager.getActiveApprovalsToUser.call(account_investor3))[0].length , 2);
            assert.equal((await I_ManualApprovalTransferManager.getActiveApprovalsToUser.call(account_investor3))[0][1], account_investor3);
            assert.equal((await I_ManualApprovalTransferManager.getActiveApprovalsToUser.call(account_investor3))[1][0], account_investor3);
            let approvalDetail = await I_ManualApprovalTransferManager.getApprovalDetails.call(account_investor2, account_investor3);
            assert.equal(approvalDetail[0].toString(), time);
            assert.equal(approvalDetail[1].toString(), web3.utils.toWei("2", "ether"));
            assert.equal(approvalDetail[2].toString(), web3.utils.toWei("2", "ether"));
            assert.equal(web3.utils.toUtf8(approvalDetail[3]), "DESCRIPTION_1");
        });

        it("Retrieving details of non-existent approval", async () => {
            const approvalDetail = await I_ManualApprovalTransferManager.getApprovalDetails.call(account_investor6, account_investor7);
            console.log('approvalDetail', approvalDetail);
            const parsedDetail = {
                0: approvalDetail[0].toString(),
                1: approvalDetail[1].toString(),
                2: approvalDetail[2].toString(),
                3: web3.utils.hexToUtf8(approvalDetail[3])
            }
            assert.deepEqual({0:'0', 1:'0', 2:'0', 3: ''}, parsedDetail, "Approval doesn't exist");
        });

        it("Should fail to modify multiple approvals because of mismatched array params", async () => {
            await catchRevert(
                    I_ManualApprovalTransferManager.modifyManualApprovalMulti(
                    [account_investor2],
                    [account_investor3,account_investor4],
                    [web3.utils.toWei("2", "ether"), web3.utils.toWei("2", "ether")],
                    [currentTime.add(new BN(duration.days(1))),currentTime.add(new BN(duration.days(1)))],
                    [web3.utils.fromAscii("DESCRIPTION_1"), web3.utils.fromAscii("DESCRIPTION_2")],
                    [true, true],
                    {
                        from: token_owner
                    }
                ),
                "Input array length mismatch"
            )

            await catchRevert(
                    I_ManualApprovalTransferManager.modifyManualApprovalMulti(
                    [account_investor2,account_investor3],
                    [account_investor3,account_investor4],
                    [web3.utils.toWei("2", "ether"), web3.utils.toWei("2", "ether")],
                    [currentTime.add(new BN(duration.days(1)))],
                    [web3.utils.fromAscii("DESCRIPTION_1"), web3.utils.fromAscii("DESCRIPTION_2")],
                    [true, true],
                    {
                        from: token_owner
                    }
                ),
                "Input array length mismatch"
            )

            await catchRevert(
                    I_ManualApprovalTransferManager.modifyManualApprovalMulti(
                    [account_investor2,account_investor3],
                    [account_investor3,account_investor4],
                    [web3.utils.toWei("2", "ether")],
                    [currentTime.add(new BN(duration.days(1))),currentTime.add(new BN(duration.days(1)))],
                    [web3.utils.fromAscii("DESCRIPTION_1"), web3.utils.fromAscii("DESCRIPTION_2")],
                    [true, true],
                    {
                        from: token_owner
                    }
                ),
                "Input array length mismatch"
            )

            await catchRevert(
                    I_ManualApprovalTransferManager.modifyManualApprovalMulti(
                    [account_investor2,account_investor3],
                    [account_investor3,account_investor4],
                    [web3.utils.toWei("2", "ether"), web3.utils.toWei("2", "ether")],
                    [currentTime.add(new BN(duration.days(1))),currentTime.add(new BN(duration.days(1)))],
                    [web3.utils.fromAscii("DESCRIPTION_1")],
                    [true, true],
                    {
                        from: token_owner
                    }
                ),
                "Input array length mismatch"
            )

            await catchRevert(
                    I_ManualApprovalTransferManager.modifyManualApprovalMulti(
                    [account_investor2,account_investor3],
                    [account_investor3,account_investor4],
                    [web3.utils.toWei("2", "ether"), web3.utils.toWei("2", "ether")],
                    [currentTime.add(new BN(duration.days(1))),currentTime.add(new BN(duration.days(1)))],
                    [web3.utils.fromAscii("DESCRIPTION_1"), web3.utils.fromAscii("DESCRIPTION_2")],
                    [true],
                    {
                        from: token_owner
                    }
                ),
                "Input array length mismatch"
            )
        });

        it("Should fail to revoke the multiple manual approvals -- because of bad owner", async() => {
            await catchRevert(
                I_ManualApprovalTransferManager.revokeManualApprovalMulti(
                    [account_investor2,account_investor3],
                    [account_investor3,account_investor4],
                    {
                        from: account_investor5
                    }
                ),
                "Invalid permission"
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
                ),
                "array length mismatch"
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
                "0x0000000000000000000000000000000000000000",
                account_investor5,
                web3.utils.toWei("2", "ether"),
                currentTime.add(new BN(duration.days(1))),
                web3.utils.fromAscii("DESCRIPTION"),
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

            const tx = await I_SecurityToken.addModule(I_CountTransferManagerFactory.address, bytesCountTM, 0, 0, false, { from: token_owner });
            assert.equal(tx.logs[2].args._types[0].toString(), transferManagerKey, "CountTransferManager doesn't get deployed");
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
            assert.equal(await I_ManualApprovalTransferManagerFactory.setupCost.call(), 0);
            assert.equal((await I_ManualApprovalTransferManagerFactory.getTypes.call())[0], 2);
            let name = web3.utils.toUtf8(await I_ManualApprovalTransferManagerFactory.name.call());
            assert.equal(name, "ManualApprovalTransferManager", "Wrong Module added");
            let desc = await I_ManualApprovalTransferManagerFactory.description.call();
            assert.equal(desc, "Manage transfers using single approvals", "Wrong Module added");
            let title = await I_ManualApprovalTransferManagerFactory.title.call();
            assert.equal(title, "Manual Approval Transfer Manager", "Wrong Module added");
            assert.equal(await I_ManualApprovalTransferManagerFactory.version.call(), "3.0.1");
        });

        it("Should get the tags of the factory", async () => {
            let tags = await I_ManualApprovalTransferManagerFactory.getTags.call();
            assert.equal(web3.utils.toUtf8(tags[0]), "Manual Approval");
            assert.equal(web3.utils.toUtf8(tags[1]), "Transfer Restriction");
        });
    });
});