import latestTime from "./helpers/latestTime";
import { duration, ensureException, promisifyLogWatch, latestBlock } from "./helpers/utils";
import { takeSnapshot, increaseTime, revertToSnapshot } from "./helpers/time";
import { encodeProxyCall } from "./helpers/encodeCall";
import { catchRevert } from "./helpers/exceptions";
import { setUpPolymathNetwork, deployEtherDividendAndVerifyed, deployGPMAndVerifyed } from "./helpers/createInstances";
import { encodeModuleCall } from "./helpers/encodeCall";

const SecurityToken = artifacts.require("./SecurityToken.sol");
const GeneralTransferManager = artifacts.require("./GeneralTransferManager");
const EtherDividendCheckpoint = artifacts.require("./EtherDividendCheckpoint");
const GeneralPermissionManager = artifacts.require("GeneralPermissionManager");
const STGetter = artifacts.require("./STGetter.sol");

const Web3 = require("web3");
let BN = Web3.utils.BN;
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port

contract("EtherDividendCheckpoint", async (accounts) => {
    // Accounts Variable declaration
    let account_polymath;
    let account_issuer;
    let token_owner;
    let wallet;
    let account_investor1;
    let account_investor2;
    let account_investor3;
    let account_investor4;
    let account_manager;
    let account_temp;

    let message = "Transaction Should Fail!";
    let dividendName = "0x546573744469766964656e640000000000000000000000000000000000000000";
    const address_zero = "0x0000000000000000000000000000000000000000";
    const one_address = "0x0000000000000000000000000000000000000001";

    // Contract Instance Declaration
    let I_SecurityTokenRegistryProxy;
    let I_GeneralTransferManagerFactory;
    let P_EtherDividendCheckpointFactory;
    let P_EtherDividendCheckpoint;
    let I_EtherDividendCheckpointFactory;
    let I_GeneralPermissionManager;
    let I_GeneralPermissionManagerFactory;
    let I_EtherDividendCheckpoint;
    let I_GeneralTransferManager;
    let I_ModuleRegistryProxy;
    let I_ModuleRegistry;
    let I_FeatureRegistry;
    let I_SecurityTokenRegistry;
    let I_STRProxied;
    let I_STFactory;
    let I_SecurityToken;
    let I_PolyToken;
    let I_MRProxied;
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
    const managerDetails = web3.utils.fromAscii("Hello");
    let snapId;
    // Module key
    const delegateManagerKey = 1;
    const transferManagerKey = 2;
    const stoKey = 3;
    const checkpointKey = 4;
    const DividendParameters = ["address"];

    // Initial fee for ticker registry and security token registry
    const initRegFee = new BN(web3.utils.toWei("1000"));

    let currentTime;

    before(async () => {
        currentTime = new BN(await latestTime());
        account_polymath = accounts[0];
        account_issuer = accounts[1];

        token_owner = account_issuer;

        account_investor1 = accounts[6];
        account_investor2 = accounts[7];
        account_investor3 = accounts[8];
        account_investor4 = accounts[9];
        account_manager = accounts[5];
        account_temp = accounts[2];
        wallet = accounts[3];

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

        [P_EtherDividendCheckpointFactory] = await deployEtherDividendAndVerifyed(account_polymath, I_MRProxied, web3.utils.toWei("500", "ether"));
        [I_EtherDividendCheckpointFactory] = await deployEtherDividendAndVerifyed(account_polymath, I_MRProxied, 0);

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

        EtherDividendCheckpointFactory:    ${I_EtherDividendCheckpointFactory.address}
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

            let tx = await I_STRProxied.generateNewSecurityToken(name, symbol, tokenDetails, false, wallet, 0, { from: token_owner });

            // Verify the successful generation of the security token
            assert.equal(tx.logs[1].args._ticker, symbol.toUpperCase(), "SecurityToken doesn't get deployed");

            I_SecurityToken = await SecurityToken.at(tx.logs[1].args._securityTokenAddress);
            stGetter = await STGetter.at(I_SecurityToken.address);
            assert.equal(await stGetter.getTreasuryWallet.call(), wallet, "Incorrect wallet set")

            const log = (await I_SecurityToken.getPastEvents('ModuleAdded', {filter: {transactionHash: tx.transactionHash}}))[0];

            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._types[0].toNumber(), 2);
            assert.equal(web3.utils.toAscii(log.args._name).replace(/\u0000/g, ""), "GeneralTransferManager");
        });

        it("Should initialize the auto attached modules", async () => {
            let moduleData = (await stGetter.getModulesByType(2))[0];
            I_GeneralTransferManager = await GeneralTransferManager.at(moduleData);
        });

        it("Should successfully attach the ERC20DividendCheckpoint with the security token", async () => {
            await I_PolyToken.getTokens(new BN(web3.utils.toWei("2000", "ether")), token_owner);
            let bytesDividend = encodeModuleCall(DividendParameters, [wallet]);
            await catchRevert(
                I_SecurityToken.addModule(P_EtherDividendCheckpointFactory.address, bytesDividend, new BN(web3.utils.toWei("2000", "ether")), new BN(0), false, {
                    from: token_owner
                })
            );
        });

        it("Should successfully attach the EtherDividendCheckpoint with the security token", async () => {
            let snapId = await takeSnapshot();
            await I_PolyToken.transfer(I_SecurityToken.address, new BN(web3.utils.toWei("2000", "ether")), { from: token_owner });
            let bytesDividend = encodeModuleCall(DividendParameters, [wallet]);
            const tx = await I_SecurityToken.addModule(P_EtherDividendCheckpointFactory.address, bytesDividend, new BN(web3.utils.toWei("2000", "ether")), new BN(0), false, {
                from: token_owner
            });
            assert.equal(tx.logs[3].args._types[0].toNumber(), checkpointKey, "EtherDividendCheckpoint doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[3].args._name).replace(/\u0000/g, ""),
                "EtherDividendCheckpoint",
                "EtherDividendCheckpoint module was not added"
            );
            P_EtherDividendCheckpoint = await EtherDividendCheckpoint.at(tx.logs[3].args._module);
            await revertToSnapshot(snapId);
        });

        it("Should successfully attach the EtherDividendCheckpoint with the security token", async () => {
            let bytesDividend = encodeModuleCall(DividendParameters, [address_zero]);
            const tx = await I_SecurityToken.addModule(I_EtherDividendCheckpointFactory.address, bytesDividend, new BN(0), new BN(0), false, { from: token_owner });
            assert.equal(tx.logs[2].args._types[0].toNumber(), checkpointKey, "EtherDividendCheckpoint doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name).replace(/\u0000/g, ""),
                "EtherDividendCheckpoint",
                "EtherDividendCheckpoint module was not added"
            );
            I_EtherDividendCheckpoint = await EtherDividendCheckpoint.at(tx.logs[2].args._module);
        });
    });

    describe("Check Dividend payouts", async () => {
        it("Buy some tokens for account_investor1 (1 ETH)", async () => {
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyKYCData(
                account_investor1,
                currentTime,
                currentTime,
                currentTime.add(new BN(duration.days(300000))),
                {
                    from: account_issuer,
                    gas: 500000
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
            await I_SecurityToken.issue(account_investor1, new BN(web3.utils.toWei("1", "ether")), "0x0", { from: token_owner });

            assert.equal((await I_SecurityToken.balanceOf(account_investor1)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
        });

        it("Buy some tokens for account_investor2 (2 ETH)", async () => {
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyKYCData(
                account_investor2,
                currentTime,
                currentTime,
                currentTime.add(new BN(duration.days(3000000))),
                {
                    from: account_issuer,
                    gas: 500000
                }
            );

            assert.equal(
                tx.logs[0].args._investor.toLowerCase(),
                account_investor2.toLowerCase(),
                "Failed in adding the investor in whitelist"
            );

            // Mint some tokens
            await I_SecurityToken.issue(account_investor2, new BN(web3.utils.toWei("2", "ether")), "0x0", { from: token_owner });

            assert.equal((await I_SecurityToken.balanceOf(account_investor2)).toString(), new BN(web3.utils.toWei("2", "ether")).toString());
        });

        it("Should fail in creating the dividend", async () => {
            let maturity = await latestTime();
            let expiry = await latestTime() + duration.days(10);
            await catchRevert(I_EtherDividendCheckpoint.createDividend(maturity, expiry, dividendName, { from: token_owner }));
        });

        it("Should fail in creating the dividend", async () => {
            let maturity = await latestTime();
            let expiry = await latestTime() - duration.days(10);
            await catchRevert(
                I_EtherDividendCheckpoint.createDividend(maturity, expiry, dividendName, {
                    from: token_owner,
                    value: new BN(web3.utils.toWei("1.5", "ether"))
                })
            );
        });

        it("Should fail in creating the dividend", async () => {
            let maturity = await latestTime() - duration.days(2);
            let expiry = await latestTime() - duration.days(1);
            await catchRevert(
                I_EtherDividendCheckpoint.createDividend(maturity, expiry, dividendName, {
                    from: token_owner,
                    value: new BN(web3.utils.toWei("1.5", "ether"))
                })
            );
        });

        it("Set withholding tax of 20% on investor 2", async () => {
            await I_EtherDividendCheckpoint.setWithholdingFixed([account_investor2], new BN(web3.utils.toWei("0.2", "ether")), { from: token_owner });
        });

        it("Should fail in creating the dividend", async () => {
            let maturity = await latestTime() + duration.days(1);
            let expiry = await latestTime() + duration.days(10);
            await catchRevert(
                I_EtherDividendCheckpoint.createDividend(maturity, expiry, "0x0", {
                    from: token_owner,
                    value: new BN(web3.utils.toWei("1.5", "ether"))
                })
            );
        });

        it("Create new dividend", async () => {
            let maturity = await latestTime() + duration.days(1);
            let expiry = await latestTime() + duration.days(10);
            let tx = await I_EtherDividendCheckpoint.createDividend(maturity, expiry, dividendName, {
                from: token_owner,
                value: new BN(web3.utils.toWei("1.5", "ether"))
            });
            assert.equal(tx.logs[0].args._checkpointId.toNumber(), 1, "Dividend should be created at checkpoint 1");
            assert.equal(tx.logs[0].args._name.toString(), dividendName, "Dividend name incorrect in event");
            console.log("Dividend first :" + tx.logs[0].args._dividendIndex.toNumber());
        });

        it("Investor 1 transfers his token balance to investor 2", async () => {
            await I_SecurityToken.transfer(account_investor2, new BN(web3.utils.toWei("1", "ether")), { from: account_investor1 });
            assert.equal(await I_SecurityToken.balanceOf(account_investor1), 0);
            assert.equal((await I_SecurityToken.balanceOf(account_investor2)).toString(), new BN(web3.utils.toWei("3", "ether")).toString());
        });

        it("Issuer pushes dividends iterating over account holders - dividends proportional to checkpoint", async () => {
            await catchRevert(I_EtherDividendCheckpoint.pushDividendPayment(0, new BN(0), 10, { from: token_owner }));
        });

        it("Issuer pushes dividends iterating over account holders - dividends proportional to checkpoint", async () => {
            // Increase time by 2 day
            await increaseTime(duration.days(2));
            await catchRevert(I_EtherDividendCheckpoint.pushDividendPayment(0, new BN(0), 10, { from: account_temp }));
        });

        it("Issuer pushes dividends iterating over account holders - dividends proportional to checkpoint", async () => {
            await catchRevert(I_EtherDividendCheckpoint.pushDividendPayment(2, new BN(0), 10, { from: token_owner }));
        });

        it("Issuer pushes dividends iterating over account holders - dividends proportional to checkpoint", async () => {
            let investor1Balance = new BN(await web3.eth.getBalance(account_investor1));
            let investor2Balance = new BN(await web3.eth.getBalance(account_investor2));
            await I_EtherDividendCheckpoint.pushDividendPayment(0, new BN(0), 10, { from: token_owner });
            let investor1BalanceAfter = new BN(await web3.eth.getBalance(account_investor1));
            let investor2BalanceAfter = new BN(await web3.eth.getBalance(account_investor2));
            assert.equal(investor1BalanceAfter.sub(investor1Balance).toString(), new BN(web3.utils.toWei("0.5", "ether")).toString());
            assert.equal(investor2BalanceAfter.sub(investor2Balance).toString(), new BN(web3.utils.toWei("0.8", "ether")).toString());
            //Check fully claimed
            assert.equal((await I_EtherDividendCheckpoint.dividends(0))[5].toString(), new BN(web3.utils.toWei("1.5", "ether")).toString());
        });

        it("Should not allow reclaiming withholding tax with incorrect index", async () => {
            await catchRevert(
                I_EtherDividendCheckpoint.withdrawWithholding(300, { from: token_owner, gasPrice: 0 }),
                "tx -> failed because dividend index is not valid"
            );
        });

        it("Issuer reclaims withholding tax", async () => {
            let issuerBalance = new BN(await web3.eth.getBalance(wallet));
            await I_EtherDividendCheckpoint.withdrawWithholding(0, { from: token_owner, gasPrice: 0 });
            let issuerBalanceAfter = new BN(await web3.eth.getBalance(wallet));
            assert.equal(issuerBalanceAfter.sub(issuerBalance).toString(), new BN(web3.utils.toWei("0.2", "ether")).toString());
        });

        it("No more withholding tax to withdraw", async () => {
            let issuerBalance = new BN(await web3.eth.getBalance(token_owner));
            await I_EtherDividendCheckpoint.withdrawWithholding(0, { from: token_owner, gasPrice: 0 });
            let issuerBalanceAfter = new BN(await web3.eth.getBalance(token_owner));
            assert.equal(issuerBalanceAfter.sub(issuerBalance).toString(), new BN(web3.utils.toWei("0", "ether")).toString());
        });

        it("Set withholding tax of 100% on investor 2", async () => {
            await I_EtherDividendCheckpoint.setWithholdingFixed([account_investor2], new BN(100).mul(new BN(10).pow(new BN(16))), { from: token_owner });
        });

        it("Buy some tokens for account_temp (1 ETH)", async () => {
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyKYCData(
                account_temp,
                currentTime,
                currentTime,
                currentTime.add(new BN(duration.days(200000))),
                {
                    from: account_issuer,
                    gas: 500000
                }
            );

            assert.equal(tx.logs[0].args._investor.toLowerCase(), account_temp.toLowerCase(), "Failed in adding the investor in whitelist");

            // Mint some tokens
            await I_SecurityToken.issue(account_temp, new BN(web3.utils.toWei("1", "ether")), "0x0", { from: token_owner });

            assert.equal((await I_SecurityToken.balanceOf(account_temp)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
        });

        it("Create new dividend", async () => {
            let maturity = await latestTime() + duration.days(1);
            let expiry = await latestTime() + duration.days(10);
            let tx = await I_EtherDividendCheckpoint.createDividend(maturity, expiry, dividendName, {
                from: token_owner,
                value: new BN(web3.utils.toWei("1.5", "ether"))
            });
            assert.equal(tx.logs[0].args._checkpointId.toNumber(), 2, "Dividend should be created at checkpoint 2");
            console.log("Dividend second :" + tx.logs[0].args._dividendIndex.toNumber());
        });

        it("Issuer pushes dividends fails due to passed expiry", async () => {
            await increaseTime(duration.days(12));
            await catchRevert(I_EtherDividendCheckpoint.pushDividendPayment(0, new BN(0), 10, { from: token_owner }));
        });

        it("Issuer reclaims dividend", async () => {
            let tx = await I_EtherDividendCheckpoint.reclaimDividend(1, { from: token_owner, gas: 500000 });
            assert.equal(tx.logs[0].args._claimedAmount.toString(), new BN(web3.utils.toWei("1.5", "ether")).toString());
            await catchRevert(I_EtherDividendCheckpoint.reclaimDividend(1, { from: token_owner, gas: 500000 }));
        });

        it("Still no more withholding tax to withdraw", async () => {
            let issuerBalance = new BN(await web3.eth.getBalance(token_owner));
            await I_EtherDividendCheckpoint.withdrawWithholding(0, { from: token_owner, gasPrice: 0 });
            let issuerBalanceAfter = new BN(await web3.eth.getBalance(token_owner));
            assert.equal(issuerBalanceAfter.sub(issuerBalance).toString(), new BN(web3.utils.toWei("0", "ether")).toString());
        });

        it("Buy some tokens for account_investor3 (7 ETH)", async () => {
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyKYCData(
                account_investor3,
                currentTime,
                currentTime,
                currentTime.add(new BN(duration.days(10000))),
                {
                    from: account_issuer,
                    gas: 500000
                }
            );

            assert.equal(
                tx.logs[0].args._investor.toLowerCase(),
                account_investor3.toLowerCase(),
                "Failed in adding the investor in whitelist"
            );

            // Mint some tokens
            await I_SecurityToken.issue(account_investor3, new BN(web3.utils.toWei("7", "ether")), "0x0", { from: token_owner });

            assert.equal((await I_SecurityToken.balanceOf(account_investor3)).toString(), new BN(web3.utils.toWei("7", "ether")).toString());
        });

        it("Create another new dividend", async () => {
            let maturity = await latestTime();
            let expiry = await latestTime() + duration.days(10);
            let tx = await I_EtherDividendCheckpoint.createDividend(maturity, expiry, dividendName, {
                from: token_owner,
                value: new BN(web3.utils.toWei("11", "ether"))
            });
            assert.equal(tx.logs[0].args._checkpointId.toNumber(), 3, "Dividend should be created at checkpoint 3");
            console.log("Dividend third :" + tx.logs[0].args._dividendIndex.toNumber());
        });

        it("should investor 3 claims dividend - fails bad index", async () => {
            let investor1Balance = new BN(await I_PolyToken.balanceOf(account_investor1));
            let investor2Balance = new BN(await I_PolyToken.balanceOf(account_investor2));
            let investor3Balance = new BN(await I_PolyToken.balanceOf(account_investor3));
            await catchRevert(I_EtherDividendCheckpoint.pullDividendPayment(5, { from: account_investor3, gasPrice: 0 }));
        });

        it("Should investor 3 claims dividend", async () => {
            let investor1Balance = new BN(await web3.eth.getBalance(account_investor1));
            let investor2Balance = new BN(await web3.eth.getBalance(account_investor2));
            let investor3Balance = new BN(await web3.eth.getBalance(account_investor3));
            await I_EtherDividendCheckpoint.pullDividendPayment(2, { from: account_investor3, gasPrice: 0 });
            let investor1BalanceAfter1 = new BN(await web3.eth.getBalance(account_investor1));
            let investor2BalanceAfter1 = new BN(await web3.eth.getBalance(account_investor2));
            let investor3BalanceAfter1 = new BN(await web3.eth.getBalance(account_investor3));
            assert.equal(investor1BalanceAfter1.sub(investor1Balance).toNumber(), 0);
            assert.equal(investor2BalanceAfter1.sub(investor2Balance).toNumber(), 0);
            assert.equal(investor3BalanceAfter1.sub(investor3Balance).toString(), new BN(web3.utils.toWei("7", "ether")).toString());
        });

        it("Still no more withholding tax to withdraw", async () => {
            let issuerBalance = new BN(await web3.eth.getBalance(token_owner));
            await I_EtherDividendCheckpoint.withdrawWithholding(0, { from: token_owner, gasPrice: 0 });
            let issuerBalanceAfter = new BN(await web3.eth.getBalance(token_owner));
            assert.equal(issuerBalanceAfter.sub(issuerBalance).toString(), new BN(web3.utils.toWei("0", "ether")).toString());
        });

        it("should investor 3 claims dividend", async () => {
            await catchRevert(I_EtherDividendCheckpoint.pullDividendPayment(2, { from: account_investor3, gasPrice: 0 }));
        });

        it("Issuer pushes remainder", async () => {
            let investor1BalanceAfter1 = new BN(await web3.eth.getBalance(account_investor1));
            let investor2BalanceAfter1 = new BN(await web3.eth.getBalance(account_investor2));
            let investor3BalanceAfter1 = new BN(await web3.eth.getBalance(account_investor3));
            let _blockNo = latestBlock();
            let tx = await I_EtherDividendCheckpoint.pushDividendPayment(2, new BN(0), 10, { from: token_owner });
            let investor1BalanceAfter2 = new BN(await web3.eth.getBalance(account_investor1));
            let investor2BalanceAfter2 = new BN(await web3.eth.getBalance(account_investor2));
            let investor3BalanceAfter2 = new BN(await web3.eth.getBalance(account_investor3));
            assert.equal(investor1BalanceAfter2.sub(investor1BalanceAfter1).toString(), 0);
            assert.equal(investor2BalanceAfter2.sub(investor2BalanceAfter1).toString(), 0);
            assert.equal(investor3BalanceAfter2.sub(investor3BalanceAfter1).toString(), 0);
            //Check fully claimed
            assert.equal((await I_EtherDividendCheckpoint.dividends(2))[5].toString(), web3.utils.toWei("11", "ether"));
        });

        it("Issuer withdraws new withholding tax", async () => {
            let issuerBalance = new BN(await web3.eth.getBalance(wallet));
            await I_EtherDividendCheckpoint.withdrawWithholding(2, { from: token_owner, gasPrice: 0 });
            let issuerBalanceAfter = new BN(await web3.eth.getBalance(wallet));
            assert.equal(issuerBalanceAfter.sub(issuerBalance).toString(), new BN(web3.utils.toWei("3", "ether")).toString());
        });

        it("Investor 2 transfers 1 ETH of his token balance to investor 1", async () => {
            await I_SecurityToken.transfer(account_investor1, new BN(web3.utils.toWei("1", "ether")), { from: account_investor2 });
            assert.equal((await I_SecurityToken.balanceOf(account_investor1)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
            assert.equal((await I_SecurityToken.balanceOf(account_investor2)).toString(), new BN(web3.utils.toWei("2", "ether")).toString());
            assert.equal((await I_SecurityToken.balanceOf(account_investor3)).toString(), new BN(web3.utils.toWei("7", "ether")).toString());
        });

        it("Create another new dividend with no value - fails", async () => {
            let maturity = await latestTime();
            let expiry = await latestTime() + duration.days(2);
            let tx = await I_SecurityToken.createCheckpoint({ from: token_owner });
            await catchRevert(
                I_EtherDividendCheckpoint.createDividendWithCheckpoint(maturity, expiry, 4, dividendName, { from: token_owner, value: 0 })
            );
        });

        it("Create another new dividend with explicit", async () => {
            let maturity = await latestTime();
            let expiry = await latestTime() - duration.days(10);
            await catchRevert(
                I_EtherDividendCheckpoint.createDividendWithCheckpoint(maturity, expiry, 4, dividendName, {
                    from: token_owner,
                    value: new BN(web3.utils.toWei("11", "ether"))
                })
            );
        });

        it("Create another new dividend with bad expiry - fails", async () => {
            let maturity = await latestTime() - duration.days(5);
            let expiry = await latestTime() - duration.days(2);
            await catchRevert(
                I_EtherDividendCheckpoint.createDividendWithCheckpoint(maturity, expiry, 4, dividendName, {
                    from: token_owner,
                    value: new BN(web3.utils.toWei("11", "ether"))
                })
            );
        });

        it("Create another new dividend with bad checkpoint in the future - fails", async () => {
            let maturity = await latestTime();
            let expiry = await latestTime() + duration.days(2);
            await catchRevert(
                I_EtherDividendCheckpoint.createDividendWithCheckpoint(maturity, expiry, 5, dividendName, {
                    from: token_owner,
                    value: new BN(web3.utils.toWei("11", "ether"))
                })
            );
        });

        it("Should not create dividend with more exclusions than limit", async () => {
            let maturity = await latestTime();
            let expiry = await latestTime() + duration.days(10);
            await I_SecurityToken.createCheckpoint({ from: token_owner });
            let limit = await I_EtherDividendCheckpoint.EXCLUDED_ADDRESS_LIMIT();
            limit = limit.toNumber() + 42;
            let addresses = [];
            addresses.push(account_temp);
            addresses.push(token_owner);
            let tempAdd = '0x0000000000000000000000000000000000000000';
            while (--limit > 42) addresses.push(web3.utils.toChecksumAddress(tempAdd.substring(0, 42 - limit.toString().length) + limit));
            // while (--limit > 42) addresses.push(web3.utils.toChecksumAddress('0x00000000000000000000000000000000000000' + limit));
            await catchRevert(
                I_EtherDividendCheckpoint.createDividendWithCheckpointAndExclusions(maturity, expiry, 4, addresses, dividendName, {
                    from: token_owner,
                    value: new BN(web3.utils.toWei("10", "ether"))
                }),
                "tx -> failed because too many address excluded"
            );
        });

        it("Create another new dividend with explicit checkpoint and excluding account_investor1", async () => {
            let maturity = await latestTime();
            let expiry = await latestTime() + duration.days(10);
            //checkpoint created in above test
            let tx = await I_EtherDividendCheckpoint.createDividendWithCheckpointAndExclusions(
                maturity,
                expiry,
                4,
                [account_investor1],
                dividendName,
                { from: token_owner, value: new BN(web3.utils.toWei("10", "ether")) }
            );
            assert.equal(tx.logs[0].args._checkpointId.toNumber(), 4, "Dividend should be created at checkpoint 4");
            console.log("Dividend Fourth :" + tx.logs[0].args._dividendIndex.toNumber());
        });

        it("Should not create new dividend with duplicate exclusion", async () => {
            let maturity = await latestTime();
            let expiry = await latestTime() + duration.days(10);
            //checkpoint created in above test
            await catchRevert(
                I_EtherDividendCheckpoint.createDividendWithCheckpointAndExclusions(
                    maturity,
                    expiry,
                    4,
                    [account_investor1, account_investor1],
                    dividendName,
                    { from: token_owner, value: new BN(web3.utils.toWei("10", "ether")) }
                )
            );
        });

        it("Should not create new dividend with 0x0 address in exclusion", async () => {
            let maturity = await latestTime();
            let expiry = await latestTime() + duration.days(10);
            //checkpoint created in above test
            await catchRevert(
                I_EtherDividendCheckpoint.createDividendWithCheckpointAndExclusions(maturity, expiry, 4, [address_zero], dividendName, {
                    from: token_owner,
                    value: new BN(web3.utils.toWei("10", "ether"))
                })
            );
        });

        it("Non-owner pushes investor 1 - fails", async () => {
            let investor1Balance = new BN(await I_PolyToken.balanceOf(account_investor1));
            let investor2Balance = new BN(await I_PolyToken.balanceOf(account_investor2));
            let investor3Balance = new BN(await I_PolyToken.balanceOf(account_investor3));
            await catchRevert(
                I_EtherDividendCheckpoint.pushDividendPaymentToAddresses(3, [account_investor2, account_investor1], {
                    from: account_investor2,
                    gasPrice: 0
                })
            );
        });

        it("issuer pushes investor 1 with bad dividend index - fails", async () => {
            let investor1Balance = new BN(await I_PolyToken.balanceOf(account_investor1));
            let investor2Balance = new BN(await I_PolyToken.balanceOf(account_investor2));
            let investor3Balance = new BN(await I_PolyToken.balanceOf(account_investor3));
            await catchRevert(
                I_EtherDividendCheckpoint.pushDividendPaymentToAddresses(6, [account_investor2, account_investor1], {
                    from: token_owner,
                    gasPrice: 0
                })
            );
        });

        it("should calculate dividend before the push dividend payment", async () => {
            let dividendAmount1 = await I_EtherDividendCheckpoint.calculateDividend.call(3, account_investor1);
            let dividendAmount2 = await I_EtherDividendCheckpoint.calculateDividend.call(3, account_investor2);
            let dividendAmount3 = await I_EtherDividendCheckpoint.calculateDividend.call(3, account_investor3);
            let dividendAmount_temp = await I_EtherDividendCheckpoint.calculateDividend.call(3, account_temp);
            //1 has 1/11th, 2 has 2/11th, 3 has 7/11th, temp has 1/11th, but 1 is excluded
            assert.equal(dividendAmount1[0].toString(), new BN(web3.utils.toWei("0", "ether")).toString());
            assert.equal(dividendAmount1[1].toString(), new BN(web3.utils.toWei("0", "ether")).toString());
            assert.equal(dividendAmount2[0].toString(), new BN(web3.utils.toWei("2", "ether")).toString());
            assert.equal(dividendAmount2[1].toString(), new BN(web3.utils.toWei("2", "ether")).toString());
            assert.equal(dividendAmount3[0].toString(), new BN(web3.utils.toWei("7", "ether")).toString());
            assert.equal(dividendAmount3[1].toString(), new BN(web3.utils.toWei("0", "ether")).toString());
            assert.equal(dividendAmount_temp[0].toString(), new BN(web3.utils.toWei("1", "ether")).toString());
            assert.equal(dividendAmount_temp[1].toString(), new BN(web3.utils.toWei("0", "ether")).toString());
        });

        it("Investor 2 claims dividend", async () => {
            let investor1Balance = new BN(await web3.eth.getBalance(account_investor1));
            let investor2Balance = new BN(await web3.eth.getBalance(account_investor2));
            let investor3Balance = new BN(await web3.eth.getBalance(account_investor3));
            let tempBalance = new BN(await web3.eth.getBalance(account_temp));
            await I_EtherDividendCheckpoint.pullDividendPayment(3, { from: account_investor2, gasPrice: 0 });
            let investor1BalanceAfter1 = new BN(await web3.eth.getBalance(account_investor1));
            let investor2BalanceAfter1 = new BN(await web3.eth.getBalance(account_investor2));
            let investor3BalanceAfter1 = new BN(await web3.eth.getBalance(account_investor3));
            let tempBalanceAfter1 = new BN(await web3.eth.getBalance(account_temp));
            assert.equal(investor1BalanceAfter1.sub(investor1Balance).toNumber(), 0);
            assert.equal(investor2BalanceAfter1.sub(investor2Balance).toString(), 0);
            assert.equal(investor3BalanceAfter1.sub(investor3Balance).toNumber(), 0);
            assert.equal(tempBalanceAfter1.sub(tempBalance).toNumber(), 0);
        });

        it("Should issuer pushes investor 1 and temp investor", async () => {
            let investor1BalanceAfter1 = new BN(await web3.eth.getBalance(account_investor1));
            let investor2BalanceAfter1 = new BN(await web3.eth.getBalance(account_investor2));
            let investor3BalanceAfter1 = new BN(await web3.eth.getBalance(account_investor3));
            let tempBalanceAfter1 = new BN(await web3.eth.getBalance(account_temp));
            await I_EtherDividendCheckpoint.pushDividendPaymentToAddresses(3, [account_investor1, account_temp], { from: token_owner });
            let investor1BalanceAfter2 = new BN(await web3.eth.getBalance(account_investor1));
            let investor2BalanceAfter2 = new BN(await web3.eth.getBalance(account_investor2));
            let investor3BalanceAfter2 = new BN(await web3.eth.getBalance(account_investor3));
            let tempBalanceAfter2 = new BN(await web3.eth.getBalance(account_temp));
            assert.equal(investor1BalanceAfter2.sub(investor1BalanceAfter1).toNumber(), 0);
            assert.equal(investor2BalanceAfter2.sub(investor2BalanceAfter1).toNumber(), 0);
            assert.equal(investor3BalanceAfter2.sub(investor3BalanceAfter1).toNumber(), 0);
            assert.equal(tempBalanceAfter2.sub(tempBalanceAfter1).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
            //Check fully claimed
            assert.equal((await I_EtherDividendCheckpoint.dividends(3))[5].toString(), new BN(web3.utils.toWei("3", "ether")).toString());
        });

        it("should calculate dividend after the push dividend payment", async () => {
            let dividendAmount1 = await I_EtherDividendCheckpoint.calculateDividend.call(3, account_investor1);
            let dividendAmount2 = await I_EtherDividendCheckpoint.calculateDividend.call(3, account_investor2);
            assert.equal(dividendAmount1[0].toNumber(), 0);
            assert.equal(dividendAmount2[0].toNumber(), 0);
        });

        it("Issuer unable to reclaim dividend (expiry not passed)", async () => {
            await catchRevert(I_EtherDividendCheckpoint.reclaimDividend(3, { from: token_owner }));
        });

        it("Issuer is able to reclaim dividend after expiry", async () => {
            await increaseTime(11 * 24 * 60 * 60);
            await catchRevert(I_EtherDividendCheckpoint.reclaimDividend(8, { from: token_owner, gasPrice: 0 }));
        });

        it("Issuer is able to reclaim dividend after expiry", async () => {
            let tokenOwnerBalance = new BN(await web3.eth.getBalance(wallet));
            await I_EtherDividendCheckpoint.reclaimDividend(3, { from: token_owner, gasPrice: 0 });
            let tokenOwnerAfter = new BN(await web3.eth.getBalance(wallet));
            assert.equal(tokenOwnerAfter.sub(tokenOwnerBalance).toString(), new BN(web3.utils.toWei("7", "ether")).toString());
        });

        it("Issuer is able to reclaim dividend after expiry", async () => {
            await catchRevert(I_EtherDividendCheckpoint.reclaimDividend(3, { from: token_owner, gasPrice: 0 }));
        });

        it("Investor 3 unable to pull dividend after expiry", async () => {
            await catchRevert(I_EtherDividendCheckpoint.pullDividendPayment(3, { from: account_investor3, gasPrice: 0 }));
        });

        it("Assign token balance to an address that can't receive funds", async () => {
            let tx = await I_GeneralTransferManager.modifyKYCData(
                I_PolyToken.address,
                currentTime,
                currentTime,
                currentTime.add(new BN(duration.days(1000000))),
                {
                    from: account_issuer,
                    gas: 500000
                }
            );
            // Jump time
            await increaseTime(5000);
            // Mint some tokens
            await I_SecurityToken.issue(I_PolyToken.address, new BN(web3.utils.toWei("1", "ether")), "0x0", { from: token_owner });
            assert.equal((await I_SecurityToken.balanceOf(account_investor1)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
            assert.equal((await I_SecurityToken.balanceOf(account_investor2)).toString(), new BN(web3.utils.toWei("2", "ether")).toString());
            assert.equal((await I_SecurityToken.balanceOf(account_investor3)).toString(), new BN(web3.utils.toWei("7", "ether")).toString());
            assert.equal((await I_SecurityToken.balanceOf(account_temp)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
            assert.equal((await I_SecurityToken.balanceOf(I_PolyToken.address)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
        });

        it("Create another new dividend", async () => {
            let maturity = await latestTime();
            let expiry = await latestTime() + duration.days(10);
            let tx = await I_EtherDividendCheckpoint.createDividendWithExclusions(maturity, expiry, [], dividendName, {
                from: token_owner,
                value: new BN(web3.utils.toWei("12", "ether"))
            });
            assert.equal(tx.logs[0].args._checkpointId.toNumber(), 6, "Dividend should be created at checkpoint 6");
            console.log("Dividend Fifth :" + tx.logs[0].args._dividendIndex.toNumber());
        });

        it("Should issuer pushes all dividends", async () => {
            let investor1BalanceBefore = new BN(await web3.eth.getBalance(account_investor1));
            let investor2BalanceBefore = new BN(await web3.eth.getBalance(account_investor2));
            let investor3BalanceBefore = new BN(await web3.eth.getBalance(account_investor3));
            let tempBalanceBefore = new BN(await web3.eth.getBalance(account_temp));
            let tokenBalanceBefore = new BN(await web3.eth.getBalance(I_PolyToken.address));

            await I_EtherDividendCheckpoint.pushDividendPayment(4, new BN(0), 10, { from: token_owner });

            let investor1BalanceAfter = new BN(await web3.eth.getBalance(account_investor1));
            let investor2BalanceAfter = new BN(await web3.eth.getBalance(account_investor2));
            let investor3BalanceAfter = new BN(await web3.eth.getBalance(account_investor3));
            let tempBalanceAfter = new BN(await web3.eth.getBalance(account_temp));
            let tokenBalanceAfter = new BN(await web3.eth.getBalance(I_PolyToken.address));

            assert.equal(investor1BalanceAfter.sub(investor1BalanceBefore).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
            assert.equal(investor2BalanceAfter.sub(investor2BalanceBefore).toString(), 0);
            assert.equal(investor3BalanceAfter.sub(investor3BalanceBefore).toString(), new BN(web3.utils.toWei("7", "ether")).toString());
            assert.equal(tempBalanceAfter.sub(tempBalanceBefore).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
            assert.equal(tokenBalanceAfter.sub(tokenBalanceBefore).toString(), new BN(web3.utils.toWei("0", "ether")).toString());

            //Check partially claimed
            assert.equal((await I_EtherDividendCheckpoint.dividends(4))[5].toString(), new BN(web3.utils.toWei("11", "ether")).toString());
        });

        it("Should give the right dividend index", async () => {
            let index = await I_EtherDividendCheckpoint.getDividendIndex.call(3);
            assert.equal(index[0], 2);
        });

        it("Should give the right dividend index", async () => {
            let index = await I_EtherDividendCheckpoint.getDividendIndex.call(8);
            assert.equal(index.length, 0);
        });

        it("Should get the listed permissions", async () => {
            let tx = await I_EtherDividendCheckpoint.getPermissions.call();
            assert.equal(tx.length, 2);
        });

        it("should registr a delegate", async () => {
            [I_GeneralPermissionManagerFactory] = await deployGPMAndVerifyed(account_polymath, I_MRProxied, 0);
            let tx = await I_SecurityToken.addModule(I_GeneralPermissionManagerFactory.address, "0x", new BN(0), new BN(0), false, { from: token_owner });
            assert.equal(tx.logs[2].args._types[0].toNumber(), delegateManagerKey, "General Permission Manager doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name).replace(/\u0000/g, ""),
                "GeneralPermissionManager",
                "GeneralPermissionManagerFactory module was not added"
            );
            I_GeneralPermissionManager = await GeneralPermissionManager.at(tx.logs[2].args._module);
            tx = await I_GeneralPermissionManager.addDelegate(account_manager, managerDetails, { from: token_owner });
            assert.equal(tx.logs[0].args._delegate, account_manager);
        });

        it("should not allow manager without permission to create dividend", async () => {
            await I_PolyToken.transfer(account_manager, new BN(web3.utils.toWei("2", "ether")), { from: token_owner });
            await I_PolyToken.approve(I_EtherDividendCheckpoint.address, new BN(web3.utils.toWei("1.5", "ether")), { from: account_manager });
            let maturity = await latestTime() + duration.days(1);
            let expiry = await latestTime() + duration.days(10);

            await catchRevert(
                I_EtherDividendCheckpoint.createDividend(maturity, expiry, dividendName, {
                    from: account_manager,
                    value: new BN(web3.utils.toWei("12", "ether"))
                })
            );
        });

        it("should not allow manager without permission to create dividend with checkpoint", async () => {
            let maturity = await latestTime() + duration.days(1);
            let expiry = await latestTime() + duration.days(10);
            let checkpointID = await I_SecurityToken.createCheckpoint.call({ from: token_owner });
            await I_SecurityToken.createCheckpoint({ from: token_owner });
            await catchRevert(
                I_EtherDividendCheckpoint.createDividendWithCheckpoint(maturity, expiry, checkpointID.toNumber(), dividendName, {
                    from: account_manager,
                    value: new BN(web3.utils.toWei("12", "ether"))
                })
            );
        });

        it("should not allow manager without permission to create dividend with exclusion", async () => {
            let maturity = await latestTime() + duration.days(1);
            let expiry = await latestTime() + duration.days(10);
            let exclusions = [one_address];
            await catchRevert(
                I_EtherDividendCheckpoint.createDividendWithExclusions(maturity, expiry, exclusions, dividendName, {
                    from: account_manager,
                    value: new BN(web3.utils.toWei("12", "ether"))
                })
            );
        });

        it("should not allow manager without permission to create dividend with checkpoint and exclusion", async () => {
            let maturity = await latestTime() + duration.days(1);
            let expiry = await latestTime() + duration.days(10);
            let exclusions = [one_address];
            let checkpointID = await I_SecurityToken.createCheckpoint.call({ from: token_owner });
            await I_SecurityToken.createCheckpoint({ from: token_owner });
            await catchRevert(
                I_EtherDividendCheckpoint.createDividendWithCheckpointAndExclusions(
                    maturity,
                    expiry,
                    checkpointID.toNumber(),
                    exclusions,
                    dividendName,
                    { from: account_manager, value: new BN(web3.utils.toWei("12", "ether")) }
                )
            );
        });

        it("should not allow manager without permission to create checkpoint", async () => {
            await catchRevert(I_EtherDividendCheckpoint.createCheckpoint({ from: account_manager }));
        });

        it("should give permission to manager", async () => {
            await I_GeneralPermissionManager.changePermission(account_manager, I_EtherDividendCheckpoint.address, web3.utils.fromAscii("OPERATOR"), true, {
                from: token_owner
            });
            let tx = await I_GeneralPermissionManager.changePermission(account_manager, I_EtherDividendCheckpoint.address, web3.utils.fromAscii("ADMIN"), true, {
                from: token_owner
            });
            assert.equal(tx.logs[0].args._delegate, account_manager);
        });

        it("should allow manager with permission to create dividend", async () => {
            let maturity = await latestTime() + duration.days(1);
            let expiry = await latestTime() + duration.days(10);

            let tx = await I_EtherDividendCheckpoint.createDividend(maturity, expiry, dividendName, {
                from: account_manager,
                value: new BN(web3.utils.toWei("12", "ether"))
            });
            assert.equal(tx.logs[0].args._checkpointId.toNumber(), 9);
            console.log("Dividend sixth :" + tx.logs[0].args._dividendIndex.toNumber());
        });

        it("should allow manager with permission to create dividend with checkpoint", async () => {
            let maturity = await latestTime() + duration.days(1);
            let expiry = await latestTime() + duration.days(10);
            let checkpointID = await I_SecurityToken.createCheckpoint.call({ from: token_owner });
            await I_SecurityToken.createCheckpoint({ from: token_owner });
            let tx = await I_EtherDividendCheckpoint.createDividendWithCheckpoint(maturity, expiry, checkpointID.toNumber(), dividendName, {
                from: account_manager,
                value: new BN(web3.utils.toWei("12", "ether"))
            });
            assert.equal(tx.logs[0].args._checkpointId.toNumber(), 10);
            console.log("Dividend seventh :" + tx.logs[0].args._dividendIndex.toNumber());
        });

        it("should allow manager with permission to create dividend with exclusion", async () => {
            let maturity = await latestTime() + duration.days(1);
            let expiry = await latestTime() + duration.days(10);
            let exclusions = [one_address];
            let tx = await I_EtherDividendCheckpoint.createDividendWithExclusions(maturity, expiry, exclusions, dividendName, {
                from: account_manager,
                value: new BN(web3.utils.toWei("12", "ether"))
            });
            console.log("Dividend Eighth :" + tx.logs[0].args._dividendIndex.toNumber());
            assert.equal(tx.logs[0].args._checkpointId.toNumber(), 11);
            console.log(tx.logs[0].args._dividendIndex.toNumber());
        });

        it("Should fail to update the dividend dates because msg.sender is not authorised", async () => {
            // failed because msg.sender is not the owner
            await catchRevert(
                I_EtherDividendCheckpoint.updateDividendDates(new BN(7), new BN(0), new BN(1), {from: account_polymath})
            );
        });

        it("Should fail to update the dates when the dividend get expired", async() => {
            let id = await takeSnapshot();
            await increaseTime(duration.days(11));
            await catchRevert(
                I_EtherDividendCheckpoint.updateDividendDates(new BN(7), new BN(0), new BN(1), {from: token_owner})
            );
            await revertToSnapshot(id);
        });

        it("Should update the dividend dates", async() => {
            let newMaturity = await latestTime() - duration.days(4);
            let newExpiry = await latestTime() - duration.days(2);
            let tx = await I_EtherDividendCheckpoint.updateDividendDates(new BN(7), newMaturity, newExpiry, {from: token_owner});
            let info = await I_EtherDividendCheckpoint.getDividendData.call(7);
            assert.equal(info[1].toNumber(), newMaturity);
            assert.equal(info[2].toNumber(), newExpiry);
            // Can now reclaim the dividend
            await I_EtherDividendCheckpoint.reclaimDividend(new BN(7), {from: token_owner});
        });

         it("Reclaim ETH from the dividend contract", async () => {
            let currentDividendBalance = await web3.eth.getBalance(I_EtherDividendCheckpoint.address);
            let currentIssuerBalance = await web3.eth.getBalance(token_owner);
            await catchRevert(I_EtherDividendCheckpoint.reclaimETH({from: account_polymath, gasPrice: 0}));
            let tx = await I_EtherDividendCheckpoint.reclaimETH({from: token_owner, gasPrice: 0});
            assert.equal(await web3.eth.getBalance(I_EtherDividendCheckpoint.address), 0);
            let newIssuerBalance = await web3.eth.getBalance(token_owner);
            console.log("Reclaimed: " + currentDividendBalance.toString());
            let balanceDiff = parseInt(web3.utils.fromWei(newIssuerBalance.toString())) - parseInt(web3.utils.fromWei(currentIssuerBalance.toString()))
            assert.equal(balanceDiff, parseInt(web3.utils.fromWei(currentDividendBalance.toString())));
        });

        it("should allow manager with permission to create dividend with checkpoint and exclusion", async () => {
            let maturity = await latestTime() + duration.days(1);
            let expiry = await latestTime() + duration.days(10);
            let exclusions = [one_address];
            let checkpointID = await I_SecurityToken.createCheckpoint.call({ from: token_owner });
            await I_SecurityToken.createCheckpoint({ from: token_owner });
            let tx = await I_EtherDividendCheckpoint.createDividendWithCheckpointAndExclusions(
                maturity,
                expiry,
                checkpointID.toNumber(),
                exclusions,
                dividendName,
                { from: account_manager, value: new BN(web3.utils.toWei("12", "ether")) }
            );
            assert.equal(tx.logs[0].args._checkpointId.toNumber(), 12);
        });

        it("should allow manager with permission to create checkpoint", async () => {
            let initCheckpointID = await I_SecurityToken.createCheckpoint.call({ from: token_owner });
            await I_EtherDividendCheckpoint.createCheckpoint({ from: account_manager });
            let finalCheckpointID = await I_SecurityToken.createCheckpoint.call({ from: token_owner });
            assert.equal(finalCheckpointID.toNumber(), initCheckpointID.toNumber() + 1);
        });

        describe("Test cases for the EtherDividendCheckpointFactory", async () => {
            it("should get the exact details of the factory", async () => {
                assert.equal((await I_EtherDividendCheckpointFactory.setupCost.call()).toNumber(), 0);
                assert.equal((await I_EtherDividendCheckpointFactory.getTypes.call())[0], 4);
                assert.equal(await I_EtherDividendCheckpointFactory.version.call(), "3.0.0");
                assert.equal(
                    web3.utils.toAscii(await I_EtherDividendCheckpointFactory.name.call()).replace(/\u0000/g, ""),
                    "EtherDividendCheckpoint",
                    "Wrong Module added"
                );
                assert.equal(
                    await I_EtherDividendCheckpointFactory.description.call(),
                    "Create ETH dividends for token holders at a specific checkpoint",
                    "Wrong Module added"
                );
                assert.equal(await I_EtherDividendCheckpointFactory.title.call(), "Ether Dividend Checkpoint", "Wrong Module added");
                let tags = await I_EtherDividendCheckpointFactory.getTags.call();
                assert.equal(tags.length, 3);
            });
        });
    });
});
