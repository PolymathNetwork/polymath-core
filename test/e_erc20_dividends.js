import latestTime from "./helpers/latestTime";
import { duration, promisifyLogWatch, latestBlock } from "./helpers/utils";
import { takeSnapshot, increaseTime, revertToSnapshot } from "./helpers/time";
import { catchRevert } from "./helpers/exceptions";
import { setUpPolymathNetwork, deployERC20DividendAndVerifyed, deployGPMAndVerifyed } from "./helpers/createInstances";
import { encodeModuleCall } from "./helpers/encodeCall";

const SecurityToken = artifacts.require("./SecurityToken.sol");
const GeneralTransferManager = artifacts.require("./GeneralTransferManager");
const ERC20DividendCheckpoint = artifacts.require("./ERC20DividendCheckpoint");
const GeneralPermissionManager = artifacts.require("GeneralPermissionManager");
const STGetter = artifacts.require("./STGetter.sol");

const Web3 = require("web3");
let BN = Web3.utils.BN;
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545")); // Hardcoded development port

contract("ERC20DividendCheckpoint", async (accounts) => {
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

    // Contract Instance Declaration
    let I_GeneralTransferManagerFactory;
    let I_SecurityTokenRegistryProxy;
    let I_ERC20DividendCheckpointFactory;
    let P_ERC20DividendCheckpointFactory;
    let P_ERC20DividendCheckpoint;
    let I_GeneralPermissionManager;
    let I_GeneralPermissionManagerFactory;
    let I_ERC20DividendCheckpoint;
    let I_GeneralTransferManager;
    let I_ExchangeTransferManager;
    let I_ModuleRegistryProxy;
    let I_ModuleRegistry;
    let I_STRProxied;
    let I_MRProxied;
    let I_FeatureRegistry;
    let I_SecurityTokenRegistry;
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
    let snapId;
    // Module key
    const delegateManagerKey = 1;
    const transferManagerKey = 2;
    const stoKey = 3;
    const checkpointKey = 4;

    //Manager details
    const managerDetails = web3.utils.fromAscii("Hello");

    // Initial fee for ticker registry and security token registry
    const initRegFee = new BN(web3.utils.toWei("1000"));

    const one_address = "0x0000000000000000000000000000000000000001";
    const address_zero = "0x0000000000000000000000000000000000000000";

    let currentTime;

    const DividendParameters = ["address"];

    before(async () => {
        currentTime = new BN(await latestTime());
        account_polymath = accounts[0];
        account_issuer = accounts[1];

        token_owner = account_issuer;

        account_investor1 = accounts[6];
        account_investor2 = accounts[7];
        account_investor3 = accounts[8];
        account_investor4 = accounts[9];
        account_temp = accounts[2];
        account_manager = accounts[5];
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

        [P_ERC20DividendCheckpointFactory] = await deployERC20DividendAndVerifyed(
            account_polymath,
            I_MRProxied,
            new BN(web3.utils.toWei("500", "ether"))
        );
        [I_ERC20DividendCheckpointFactory] = await deployERC20DividendAndVerifyed(account_polymath, I_MRProxied, 0);

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
        ERC20DividendCheckpointFactory:    ${I_ERC20DividendCheckpointFactory.address}
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
            assert.equal(await stGetter.getTreasuryWallet.call(), token_owner, "Incorrect wallet set")

            const log = (await I_SecurityToken.getPastEvents('ModuleAdded', {filter: {transactionHash: tx.transactionHash}}))[0];
            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._types[0].toNumber(), 2);
            assert.equal(web3.utils.toAscii(log.args._name).replace(/\u0000/g, ""), "GeneralTransferManager");
        });

        it("Should initialize the auto attached modules", async () => {
            let moduleData = (await stGetter.getModulesByType(2))[0];
            I_GeneralTransferManager = await GeneralTransferManager.at(moduleData);
        });

        it("Should successfully attach the ERC20DividendCheckpoint with the security token - fail insufficient payment", async () => {
            let bytesDividend = encodeModuleCall(DividendParameters, [wallet]);
            await catchRevert(
                I_SecurityToken.addModule(P_ERC20DividendCheckpointFactory.address, bytesDividend, new BN(web3.utils.toWei("2000", "ether")), new BN(0), false, {
                    from: token_owner
                })
            );
        });

        it("Should successfully attach the ERC20DividendCheckpoint with the security token with budget", async () => {
            let snapId = await takeSnapshot();
            await I_PolyToken.getTokens(new BN(web3.utils.toWei("2000", "ether")), token_owner);
            await I_PolyToken.transfer(I_SecurityToken.address, new BN(web3.utils.toWei("2000", "ether")), { from: token_owner });
            let bytesDividend = encodeModuleCall(DividendParameters, [wallet]);
            const tx = await I_SecurityToken.addModule(P_ERC20DividendCheckpointFactory.address, bytesDividend, new BN(web3.utils.toWei("2000", "ether")), new BN(0), false, {
                from: token_owner
            });
            assert.equal(tx.logs[3].args._types[0].toNumber(), checkpointKey, "ERC20DividendCheckpoint doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[3].args._name).replace(/\u0000/g, ""),
                "ERC20DividendCheckpoint",
                "ERC20DividendCheckpoint module was not added"
            );
            P_ERC20DividendCheckpoint = await ERC20DividendCheckpoint.at(tx.logs[3].args._module);
            await revertToSnapshot(snapId);
        });

        it("Should successfully attach the ERC20DividendCheckpoint with the security token", async () => {
            let bytesDividend = encodeModuleCall(DividendParameters, [address_zero]);
            const tx = await I_SecurityToken.addModule(I_ERC20DividendCheckpointFactory.address, bytesDividend, new BN(0), new BN(0), false, { from: token_owner });
            console.log(tx.logs[2].args);
            assert.equal(tx.logs[2].args._types[0].toNumber(), checkpointKey, "ERC20DividendCheckpoint doesn't get deployed");
            assert.equal(
                web3.utils.toAscii(tx.logs[2].args._name).replace(/\u0000/g, ""),
                "ERC20DividendCheckpoint",
                "ERC20DividendCheckpoint module was not added"
            );
            I_ERC20DividendCheckpoint = await ERC20DividendCheckpoint.at(tx.logs[2].args._module);
        });
    });

    describe("Check Dividend payouts", async () => {
        it("Buy some tokens for account_investor1 (1 ETH)", async () => {
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyKYCData(
                account_investor1,
                currentTime,
                currentTime,
                currentTime.add(new BN(duration.days(30))),
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
                currentTime.add(new BN(duration.days(30))),
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

        it("Should fail in creating the dividend - incorrect allowance", async () => {
            let maturity = await latestTime();
            let expiry = await latestTime() + duration.days(10);
            await I_PolyToken.getTokens(new BN(web3.utils.toWei("1.5", "ether")), token_owner);
            await catchRevert(
                I_ERC20DividendCheckpoint.createDividend(
                    maturity,
                    expiry,
                    I_PolyToken.address,
                    new BN(web3.utils.toWei("1.5", "ether")),
                    dividendName,
                    { from: token_owner }
                )
            );
        });

        it("Should fail in creating the dividend - maturity > expiry", async () => {
            let maturity = await latestTime();
            let expiry = await latestTime() - duration.days(10);
            await I_PolyToken.approve(I_ERC20DividendCheckpoint.address, new BN(web3.utils.toWei("1.5", "ether")), { from: token_owner });
            await catchRevert(
                I_ERC20DividendCheckpoint.createDividend(
                    maturity,
                    expiry,
                    I_PolyToken.address,
                    new BN(web3.utils.toWei("1.5", "ether")),
                    dividendName,
                    { from: token_owner }
                )
            );
        });

        it("Should fail in creating the dividend - now > expiry", async () => {
            let maturity = await latestTime() - duration.days(2);
            let expiry = await latestTime() - duration.days(1);
            await catchRevert(
                I_ERC20DividendCheckpoint.createDividend(
                    maturity,
                    expiry,
                    I_PolyToken.address,
                    new BN(web3.utils.toWei("1.5", "ether")),
                    dividendName,
                    { from: token_owner }
                )
            );
        });

        it("Should fail in creating the dividend - bad token", async () => {
            let maturity = await latestTime();
            let expiry = await latestTime() + duration.days(10);
            await catchRevert(
                I_ERC20DividendCheckpoint.createDividend(maturity, expiry, address_zero, new BN(web3.utils.toWei("1.5", "ether")), dividendName, {
                    from: token_owner
                })
            );
        });

        it("Should fail in creating the dividend - amount is 0", async () => {
            let maturity = await latestTime();
            let expiry = await latestTime() + duration.days(10);
            await catchRevert(
                I_ERC20DividendCheckpoint.createDividend(maturity, expiry, I_PolyToken.address, new BN(0), dividendName, { from: token_owner })
            );
        });

        it("Create new dividend of POLY tokens", async () => {
            let maturity = await latestTime() + duration.days(1);
            let expiry = await latestTime() + duration.days(10);

            let tx = await I_ERC20DividendCheckpoint.createDividend(
                maturity,
                expiry,
                I_PolyToken.address,
                new BN(web3.utils.toWei("1.5", "ether")),
                dividendName,
                { from: token_owner }
            );
            assert.equal(tx.logs[0].args._checkpointId.toNumber(), 1, "Dividend should be created at checkpoint 1");
            assert.equal(tx.logs[0].args._name.toString(), dividendName, "Dividend name incorrect in event");
            let data = await I_ERC20DividendCheckpoint.getDividendsData();
            assert.equal(data[1][0].toNumber(), maturity, "maturity match");
            assert.equal(data[2][0].toNumber(), expiry, "expiry match");
            assert.equal(data[3][0].toString(), new BN(web3.utils.toWei("1.5", "ether")).toString(), "amount match");
            assert.equal(data[4][0].toNumber(), 0, "claimed match");
            assert.equal(data[5][0], dividendName, "dividendName match");
        });

        it("Investor 1 transfers his token balance to investor 2", async () => {
            await I_SecurityToken.transfer(account_investor2, new BN(web3.utils.toWei("1", "ether")), { from: account_investor1 });
            assert.equal(await I_SecurityToken.balanceOf(account_investor1), 0);
            assert.equal((await I_SecurityToken.balanceOf(account_investor2)).toString(), new BN(web3.utils.toWei("3", "ether")).toString());
        });

        it("Issuer pushes dividends iterating over account holders - dividends proportional to checkpoint - fails maturity in the future", async () => {
            await catchRevert(I_ERC20DividendCheckpoint.pushDividendPayment(0, new BN(0), 10, { from: token_owner }));
        });

        it("Issuer pushes dividends iterating over account holders - dividends proportional to checkpoint - fails not owner", async () => {
            // Increase time by 2 day
            await increaseTime(duration.days(2));
            await catchRevert(I_ERC20DividendCheckpoint.pushDividendPayment(0, new BN(0), 10, { from: account_temp }));
        });

        it("Issuer pushes dividends iterating over account holders - dividends proportional to checkpoint - fails wrong index", async () => {
            await catchRevert(I_ERC20DividendCheckpoint.pushDividendPayment(2, new BN(0), 10, { from: token_owner }));
        });

        it("Issuer pushes dividends iterating over account holders - dividends proportional to checkpoint", async () => {
            let investor1Balance = new BN(await I_PolyToken.balanceOf(account_investor1));
            let investor2Balance = new BN(await I_PolyToken.balanceOf(account_investor2));
            await I_ERC20DividendCheckpoint.pushDividendPayment(0, new BN(0), 10, { from: token_owner, gas: 5000000 });
            let investor1BalanceAfter = new BN(await I_PolyToken.balanceOf(account_investor1));
            let investor2BalanceAfter = new BN(await I_PolyToken.balanceOf(account_investor2));
            assert.equal(investor1BalanceAfter.sub(investor1Balance).toString(), new BN(web3.utils.toWei("0.5", "ether")).toString());
            assert.equal(investor2BalanceAfter.sub(investor2Balance).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
            //Check fully claimed
            assert.equal((await I_ERC20DividendCheckpoint.dividends(0))[5].toString(), new BN(web3.utils.toWei("1.5", "ether")).toString());
        });

        it("Buy some tokens for account_temp (1 ETH)", async () => {
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyKYCData(
                account_temp,
                currentTime,
                currentTime,
                currentTime.add(new BN(duration.days(20))),
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

        it("Should not allow to create dividend without name", async () => {
            let maturity = await latestTime() + duration.days(1);
            let expiry = await latestTime() + duration.days(10);
            await I_PolyToken.getTokens(new BN(web3.utils.toWei("1.5", "ether")), token_owner);
            await I_PolyToken.approve(I_ERC20DividendCheckpoint.address, new BN(web3.utils.toWei("1.5", "ether")), { from: token_owner });
            await catchRevert(
                I_ERC20DividendCheckpoint.createDividend(maturity, expiry, I_PolyToken.address, new BN(web3.utils.toWei("1.5", "ether")), "0x0", {
                    from: token_owner
                })
            );
        });

        it("Create new dividend", async () => {
            let maturity = await latestTime() + duration.days(1);
            let expiry = await latestTime() + duration.days(10);
            await I_PolyToken.getTokens(new BN(web3.utils.toWei("1.5", "ether")), token_owner);
            // transfer approved in above test
            let tx = await I_ERC20DividendCheckpoint.createDividend(
                maturity,
                expiry,
                I_PolyToken.address,
                new BN(web3.utils.toWei("1.5", "ether")),
                dividendName,
                { from: token_owner }
            );
            console.log("Gas used w/ no exclusions: " + tx.receipt.gasUsed);
            assert.equal(tx.logs[0].args._checkpointId.toNumber(), 2, "Dividend should be created at checkpoint 1");
        });

        it("Issuer pushes dividends iterating over account holders - dividends proportional to checkpoint - fails past expiry", async () => {
            await increaseTime(duration.days(12));
            await catchRevert(I_ERC20DividendCheckpoint.pushDividendPayment(1, new BN(0), 10, { from: token_owner }));
        });

        it("Issuer pushes dividends iterating over account holders - dividends proportional to checkpoint - fails already reclaimed", async () => {
            await I_ERC20DividendCheckpoint.changeWallet(wallet, {from: token_owner});
            let tx = await I_ERC20DividendCheckpoint.reclaimDividend(1, { from: token_owner, gas: 500000 });
            assert.equal(tx.logs[0].args._claimedAmount.toString(), new BN(web3.utils.toWei("1.5", "ether")).toString());
            await catchRevert(I_ERC20DividendCheckpoint.reclaimDividend(1, { from: token_owner, gas: 500000 }));
        });

        it("Buy some tokens for account_investor3 (7 ETH)", async () => {
            // Add the Investor in to the whitelist

            let tx = await I_GeneralTransferManager.modifyKYCData(
                account_investor3,
                currentTime,
                currentTime,
                currentTime.add(new BN(duration.days(100000))),
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

        it("Should allow to exclude same number of address as EXCLUDED_ADDRESS_LIMIT", async () => {
            let limit = await I_ERC20DividendCheckpoint.EXCLUDED_ADDRESS_LIMIT();
            limit = limit.toNumber() + 42;
            let addresses = [];
            addresses.push(account_temp);
            let tempAdd = '0x0000000000000000000000000000000000000000';
            while (--limit > 42) addresses.push(web3.utils.toChecksumAddress(tempAdd.substring(0, 42 - limit.toString().length) + limit));
              //'0x00000000000000000000000000000000000000' + limit));
            await I_ERC20DividendCheckpoint.setDefaultExcluded(addresses, { from: token_owner });
            let excluded = await I_ERC20DividendCheckpoint.getDefaultExcluded();
            assert.equal(excluded[0], account_temp);
        });

        it("Should not allow to exclude duplicate address", async () => {
            let addresses = [];
            addresses.push(account_investor3);
            addresses.push(account_investor3);
            await catchRevert(I_ERC20DividendCheckpoint.setDefaultExcluded(addresses, { from: token_owner }));
        });

        it("Should not allow to exclude 0x0 address", async () => {
            let addresses = [];
            addresses.push(account_investor3);
            addresses.push(address_zero);
            await catchRevert(I_ERC20DividendCheckpoint.setDefaultExcluded(addresses, { from: token_owner }));
        });

        it("Exclude account_temp using global exclusion list", async () => {
            await I_ERC20DividendCheckpoint.setDefaultExcluded([account_temp], { from: token_owner });
            let excluded = await I_ERC20DividendCheckpoint.getDefaultExcluded();
            assert.equal(excluded[0], account_temp);
        });

        it("Should not allow to exclude more address than EXCLUDED_ADDRESS_LIMIT", async () => {
            let limit = await I_ERC20DividendCheckpoint.EXCLUDED_ADDRESS_LIMIT();
            limit = limit.toNumber() + 42;
            let addresses = [];
            addresses.push(account_temp);
            let tempAdd = '0x0000000000000000000000000000000000000000';
            while (limit-- > 42) addresses.push(web3.utils.toChecksumAddress(tempAdd.substring(0, 42 - limit.toString().length) + limit));

            // while (limit-- > 42) addresses.push(web3.utils.toChecksumAddress('0x00000000000000000000000000000000000000' + limit));
            console.log(addresses.length);
            await catchRevert(I_ERC20DividendCheckpoint.setDefaultExcluded(addresses, { from: token_owner }));
        });

        it("Create another new dividend", async () => {
            let maturity = await latestTime();
            let expiry = await latestTime() + duration.days(10);
            await I_PolyToken.getTokens(new BN(web3.utils.toWei("11", "ether")), token_owner);
            await I_PolyToken.approve(I_ERC20DividendCheckpoint.address, new BN(web3.utils.toWei("11", "ether")), { from: token_owner });
            let tx = await I_ERC20DividendCheckpoint.createDividend(
                maturity,
                expiry,
                I_PolyToken.address,
                new BN(web3.utils.toWei("10", "ether")),
                dividendName,
                { from: token_owner }
            );
            console.log("Gas used w/ max exclusions - default: " + tx.receipt.gasUsed);
            assert.equal(tx.logs[0].args._checkpointId.toNumber(), 3, "Dividend should be created at checkpoint 2");
            assert.equal((await I_ERC20DividendCheckpoint.isExcluded.call(account_temp, tx.logs[0].args._dividendIndex)), true, "account_temp is excluded");
        });

        it("should investor 3 claims dividend - fail bad index", async () => {
            await catchRevert(I_ERC20DividendCheckpoint.pullDividendPayment(5, { from: account_investor3, gasPrice: 0 }));
        });

        it("should investor 3 claims dividend", async () => {
            console.log((await I_ERC20DividendCheckpoint.dividends(2))[5].toNumber());
            let investor1Balance = new BN(await I_PolyToken.balanceOf(account_investor1));
            let investor2Balance = new BN(await I_PolyToken.balanceOf(account_investor2));
            let investor3Balance = new BN(await I_PolyToken.balanceOf(account_investor3));
            await I_ERC20DividendCheckpoint.pullDividendPayment(2, { from: account_investor3, gasPrice: 0 });
            let investor1BalanceAfter1 = new BN(await I_PolyToken.balanceOf(account_investor1));
            let investor2BalanceAfter1 = new BN(await I_PolyToken.balanceOf(account_investor2));
            let investor3BalanceAfter1 = new BN(await I_PolyToken.balanceOf(account_investor3));
            assert.equal(investor1BalanceAfter1.sub(investor1Balance).toNumber(), 0);
            assert.equal(investor2BalanceAfter1.sub(investor2Balance).toNumber(), 0);
            assert.equal(investor3BalanceAfter1.sub(investor3Balance).toString(), new BN(web3.utils.toWei("7", "ether")).toString());
            let info = await I_ERC20DividendCheckpoint.getDividendProgress.call(2);
            console.log(info);
            assert.equal(info[0][1], account_temp, "account_temp");
            assert.equal(info[1][1], false, "account_temp is not claimed");
            assert.equal(info[2][1], true, "account_temp is excluded");
            assert.equal(info[3][1], 0, "account_temp is not withheld");
            assert.equal(info[0][2], account_investor3, "account_investor3");
            assert.equal(info[1][2], true, "account_investor3 is claimed");
            assert.equal(info[2][2], false, "account_investor3 is claimed");
            assert.equal(info[3][2], 0, "account_investor3 is not withheld");
        });

        it("should investor 3 claims dividend - fails already claimed", async () => {
            await catchRevert(I_ERC20DividendCheckpoint.pullDividendPayment(2, { from: account_investor3, gasPrice: 0 }));
        });

        it("should issuer pushes remain", async () => {
            let investor1BalanceAfter1 = new BN(await I_PolyToken.balanceOf(account_investor1));
            let investor2BalanceAfter1 = new BN(await I_PolyToken.balanceOf(account_investor2));
            let investor3BalanceAfter1 = new BN(await I_PolyToken.balanceOf(account_investor3));
            let investorTempBalanceAfter1 = new BN(await I_PolyToken.balanceOf(account_temp));
            await I_ERC20DividendCheckpoint.pushDividendPayment(2, new BN(0), 10, { from: token_owner });
            let investor1BalanceAfter2 = new BN(await I_PolyToken.balanceOf(account_investor1));
            let investor2BalanceAfter2 = new BN(await I_PolyToken.balanceOf(account_investor2));
            let investor3BalanceAfter2 = new BN(await I_PolyToken.balanceOf(account_investor3));
            let investorTempBalanceAfter2 = new BN(await I_PolyToken.balanceOf(account_temp));
            assert.equal(investor1BalanceAfter2.sub(investor1BalanceAfter1).toNumber(), 0);
            assert.equal(investor2BalanceAfter2.sub(investor2BalanceAfter1).toString(), new BN(web3.utils.toWei("3", "ether")).toString());
            assert.equal(investor3BalanceAfter2.sub(investor3BalanceAfter1).toNumber(), 0);
            assert.equal(investorTempBalanceAfter2.sub(investorTempBalanceAfter1).toNumber(), 0);
            //Check fully claimed
            assert.equal((await I_ERC20DividendCheckpoint.dividends(2))[5].toString(), new BN(web3.utils.toWei("10", "ether")).toString());
        });

        it("Delete global exclusion list", async () => {
            await I_ERC20DividendCheckpoint.setDefaultExcluded([], { from: token_owner });
        });

        it("Investor 2 transfers 1 ETH of his token balance to investor 1", async () => {
            await I_SecurityToken.transfer(account_investor1, new BN(web3.utils.toWei("1", "ether")), { from: account_investor2 });
            assert.equal((await I_SecurityToken.balanceOf(account_investor1)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
            assert.equal((await I_SecurityToken.balanceOf(account_investor2)).toString(), new BN(web3.utils.toWei("2", "ether")).toString());
            assert.equal((await I_SecurityToken.balanceOf(account_investor3)).toString(), new BN(web3.utils.toWei("7", "ether")).toString());
            assert.equal((await I_SecurityToken.balanceOf(account_temp)).toString(), new BN(web3.utils.toWei("1", "ether")).toString());
        });

        it("Create another new dividend with explicit checkpoint - fails bad allowance", async () => {
            let maturity = await latestTime();
            let expiry = await latestTime() + duration.days(2);
            let tx = await I_SecurityToken.createCheckpoint({ from: token_owner });
            console.log(JSON.stringify(tx.logs[0].args));
            console.log((await I_SecurityToken.currentCheckpointId()).toNumber());
            await I_PolyToken.getTokens(new BN(web3.utils.toWei("20", "ether")), token_owner);
            await catchRevert(
                I_ERC20DividendCheckpoint.createDividendWithCheckpoint(
                    maturity,
                    expiry,
                    I_PolyToken.address,
                    new BN(web3.utils.toWei("20", "ether")),
                    4,
                    dividendName,
                    { from: token_owner }
                )
            );
        });

        it("Create another new dividend with explicit - fails maturity > expiry", async () => {
            console.log((await I_SecurityToken.currentCheckpointId()).toNumber());

            let maturity = await latestTime();
            let expiry = await latestTime() - duration.days(10);
            await I_PolyToken.approve(I_ERC20DividendCheckpoint.address, new BN(web3.utils.toWei("20", "ether")), { from: token_owner });
            await catchRevert(
                I_ERC20DividendCheckpoint.createDividendWithCheckpoint(
                    maturity,
                    expiry,
                    I_PolyToken.address,
                    new BN(web3.utils.toWei("20", "ether")),
                    4,
                    dividendName,
                    { from: token_owner }
                )
            );
        });

        it("Create another new dividend with explicit - fails now > expiry", async () => {
            console.log((await I_SecurityToken.currentCheckpointId()).toNumber());

            let maturity = await latestTime() - duration.days(5);
            let expiry = await latestTime() - duration.days(2);
            await catchRevert(
                I_ERC20DividendCheckpoint.createDividendWithCheckpoint(
                    maturity,
                    expiry,
                    I_PolyToken.address,
                    new BN(web3.utils.toWei("20", "ether")),
                    4,
                    dividendName,
                    { from: token_owner }
                )
            );
        });

        it("Create another new dividend with explicit - fails bad checkpoint", async () => {
            let maturity = await latestTime();
            let expiry = await latestTime() + duration.days(2);
            await catchRevert(
                I_ERC20DividendCheckpoint.createDividendWithCheckpoint(
                    maturity,
                    expiry,
                    I_PolyToken.address,
                    new BN(web3.utils.toWei("20", "ether")),
                    5,
                    dividendName,
                    { from: token_owner }
                )
            );
        });

        it("Set withholding tax of 20% on account_temp and 100% on investor2", async () => {
            await I_ERC20DividendCheckpoint.setWithholding(
                [account_temp, account_investor2],
                [new BN(20).mul(new BN(10).pow(new BN(16))), new BN(100).mul(new BN(10).pow(new BN(16)))],
                { from: token_owner }
            );
        });

        it("Should not allow mismatching input lengths", async () => {
            await catchRevert(
                I_ERC20DividendCheckpoint.setWithholding([account_temp], [new BN(20).mul(new BN(10).pow(new BN(16))), new BN(10).mul(new BN(10).pow(new BN(16)))], {
                    from: token_owner
                })
            );
        });

        it("Should not allow withholding greater than limit", async () => {
            await catchRevert(I_ERC20DividendCheckpoint.setWithholding([account_temp], [new BN(20).mul(new BN(10).pow(new BN(26)))], { from: token_owner }));
            await catchRevert(I_ERC20DividendCheckpoint.setWithholdingFixed([account_temp], new BN(20).mul(new BN(10).pow(new BN(26))), { from: token_owner }), "");
        });

        it("Should not create dividend with more exclusions than limit", async () => {
            let maturity = await latestTime();
            let expiry = await latestTime() + duration.days(10);
            await I_PolyToken.getTokens(new BN(web3.utils.toWei("11", "ether")), token_owner);
            await I_PolyToken.approve(I_ERC20DividendCheckpoint.address, new BN(web3.utils.toWei("11", "ether")), { from: token_owner });
            let limit = await I_ERC20DividendCheckpoint.EXCLUDED_ADDRESS_LIMIT();
            limit = limit.toNumber() + 42;
            let addresses = [];
            addresses.push(account_temp);
            addresses.push(token_owner);
            let tempAdd = '0x0000000000000000000000000000000000000000';
            while (--limit > 42) addresses.push(web3.utils.toChecksumAddress(tempAdd.substring(0, 42 - limit.toString().length) + limit));
            // while (--limit > 42) addresses.push(web3.utils.toChecksumAddress('0x00000000000000000000000000000000000000' + limit));
            await catchRevert(
                I_ERC20DividendCheckpoint.createDividendWithCheckpointAndExclusions(
                    maturity,
                    expiry,
                    I_PolyToken.address,
                    new BN(web3.utils.toWei("10", "ether")),
                    4,
                    addresses,
                    dividendName,
                    { from: token_owner }
                )
            );
        });

        it("Create another new dividend with explicit checkpoint and exclusion", async () => {
            let maturity = await latestTime();
            let expiry = await latestTime() + duration.days(10);
            await I_PolyToken.getTokens(new BN(web3.utils.toWei("11", "ether")), token_owner);
            //token transfer approved in above test
            let tx = await I_ERC20DividendCheckpoint.createDividendWithCheckpointAndExclusions(
                maturity,
                expiry,
                I_PolyToken.address,
                new BN(web3.utils.toWei("10", "ether")),
                4,
                [account_investor1],
                dividendName,
                { from: token_owner }
            );
            assert.equal(tx.logs[0].args._checkpointId.toNumber(), 4, "Dividend should be created at checkpoint 4");
        });

        it("Should not create new dividend with duplicate exclusion", async () => {
            let maturity = await latestTime();
            let expiry = await latestTime() + duration.days(10);
            await I_PolyToken.getTokens(new BN(web3.utils.toWei("11", "ether")), token_owner);
            //token transfer approved in above test
            await catchRevert(
                I_ERC20DividendCheckpoint.createDividendWithCheckpointAndExclusions(
                    maturity,
                    expiry,
                    I_PolyToken.address,
                    new BN(web3.utils.toWei("10", "ether")),
                    4,
                    [account_investor1, account_investor1],
                    dividendName,
                    { from: token_owner }
                )
            );
        });

        it("Should not create new dividend with 0x0 address in exclusion", async () => {
            let maturity = await latestTime();
            let expiry = await latestTime() + duration.days(10);
            await I_PolyToken.getTokens(new BN(web3.utils.toWei("11", "ether")), token_owner);
            //token transfer approved in above test
            await catchRevert(
                I_ERC20DividendCheckpoint.createDividendWithCheckpointAndExclusions(
                    maturity,
                    expiry,
                    I_PolyToken.address,
                    new BN(web3.utils.toWei("10", "ether")),
                    4,
                    [address_zero],
                    dividendName,
                    { from: token_owner }
                )
            );
        });

        it("Should not allow excluded to pull Dividend Payment", async () => {
            await catchRevert(I_ERC20DividendCheckpoint.pullDividendPayment(3, { from: account_investor1, gasPrice: 0 }));
        });

        it("Investor 2 claims dividend, issuer pushes investor 1 - fails not owner", async () => {
            await catchRevert(
                I_ERC20DividendCheckpoint.pushDividendPaymentToAddresses(2, [account_investor2, account_investor1], {
                    from: account_investor2,
                    gasPrice: 0
                })
            );
        });

        it("Investor 2 claims dividend, issuer pushes investor 1 - fails bad index", async () => {
            await catchRevert(
                I_ERC20DividendCheckpoint.pushDividendPaymentToAddresses(5, [account_investor2, account_investor1], {
                    from: token_owner,
                    gasPrice: 0
                })
            );
        });

        it("should not calculate dividend for invalid index", async () => {
            await catchRevert(I_ERC20DividendCheckpoint.calculateDividend.call(5, account_investor1));
        });

        it("should calculate dividend before the push dividend payment", async () => {
            let dividendAmount1 = await I_ERC20DividendCheckpoint.calculateDividend.call(3, account_investor1);
            let dividendAmount2 = await I_ERC20DividendCheckpoint.calculateDividend.call(3, account_investor2);
            let dividendAmount3 = await I_ERC20DividendCheckpoint.calculateDividend.call(3, account_investor3);
            let dividendAmount_temp = await I_ERC20DividendCheckpoint.calculateDividend.call(3, account_temp);
            assert.equal(dividendAmount1[0].toString(), new BN(web3.utils.toWei("0", "ether")).toString());
            assert.equal(dividendAmount2[0].toString(), new BN(web3.utils.toWei("2", "ether")).toString());
            assert.equal(dividendAmount3[0].toString(), new BN(web3.utils.toWei("7", "ether")).toString());
            assert.equal(dividendAmount_temp[0].toString(), new BN(web3.utils.toWei("1", "ether")).toString());
            assert.equal(dividendAmount1[1].toString(), new BN(web3.utils.toWei("0", "ether")).toString());
            assert.equal(dividendAmount2[1].toString(), new BN(web3.utils.toWei("2", "ether")).toString());
            assert.equal(dividendAmount3[1].toString(), new BN(web3.utils.toWei("0", "ether")).toString());
            assert.equal(dividendAmount_temp[1].toString(), new BN(web3.utils.toWei("0.2", "ether")).toString());
        });

        it("Pause and unpause the dividend contract", async () => {
            await catchRevert(I_ERC20DividendCheckpoint.pause({from: account_polymath}));
            let tx = await I_ERC20DividendCheckpoint.pause({from: token_owner});
            await catchRevert(I_ERC20DividendCheckpoint.pullDividendPayment(3, { from: account_investor2, gasPrice: 0 }));
            await catchRevert(I_ERC20DividendCheckpoint.unpause({from: account_polymath}));
            tx = await I_ERC20DividendCheckpoint.unpause({from: token_owner});
        });

        it("Investor 2 claims dividend", async () => {
            let investor1Balance = new BN(await I_PolyToken.balanceOf(account_investor1));
            let investor2Balance = new BN(await I_PolyToken.balanceOf(account_investor2));
            let investor3Balance = new BN(await I_PolyToken.balanceOf(account_investor3));
            let tempBalance = new BN(await web3.eth.getBalance(account_temp));
            let _blockNo = latestBlock();
            let tx = await I_ERC20DividendCheckpoint.pullDividendPayment(3, { from: account_investor2, gasPrice: 0 });
            let investor1BalanceAfter1 = new BN(await I_PolyToken.balanceOf(account_investor1));
            let investor2BalanceAfter1 = new BN(await I_PolyToken.balanceOf(account_investor2));
            let investor3BalanceAfter1 = new BN(await I_PolyToken.balanceOf(account_investor3));
            let tempBalanceAfter1 = new BN(await web3.eth.getBalance(account_temp));
            assert.equal(investor1BalanceAfter1.sub(investor1Balance).toNumber(), 0);
            // Full amount is in withheld tax
            assert.equal(investor2BalanceAfter1.sub(investor2Balance).toString(), 0);
            assert.equal(investor3BalanceAfter1.sub(investor3Balance).toNumber(), 0);
            assert.equal(tempBalanceAfter1.sub(tempBalance).toNumber(), 0);
            //Check tx contains event...
            const log = (await I_ERC20DividendCheckpoint.getPastEvents('ERC20DividendClaimed', {filter: {transactionHash: tx.transactionHash}}))[0];
            // Verify that GeneralTransferManager module get added successfully or not
            assert.equal(log.args._payee, account_investor2);
            assert.equal(web3.utils.fromWei(log.args._withheld.toString()), 2);
            assert.equal(web3.utils.fromWei(log.args._amount.toString()), 2);
        });

        it("Should issuer pushes temp investor - investor1 excluded", async () => {
            let investor1BalanceAfter1 = new BN(await I_PolyToken.balanceOf(account_investor1));
            let investor2BalanceAfter1 = new BN(await I_PolyToken.balanceOf(account_investor2));
            let investor3BalanceAfter1 = new BN(await I_PolyToken.balanceOf(account_investor3));
            let tempBalanceAfter1 = new BN(await I_PolyToken.balanceOf(account_temp));
            // Issuer can still push payments when contract is paused
            let tx = await I_ERC20DividendCheckpoint.pause({from: token_owner});
            await I_ERC20DividendCheckpoint.pushDividendPaymentToAddresses(3, [account_temp, account_investor1], { from: token_owner });
            tx = await I_ERC20DividendCheckpoint.unpause({from: token_owner});
            let investor1BalanceAfter2 = new BN(await I_PolyToken.balanceOf(account_investor1));
            let investor2BalanceAfter2 = new BN(await I_PolyToken.balanceOf(account_investor2));
            let investor3BalanceAfter2 = new BN(await I_PolyToken.balanceOf(account_investor3));
            let tempBalanceAfter2 = new BN(await I_PolyToken.balanceOf(account_temp));
            assert.equal(investor1BalanceAfter2.sub(investor1BalanceAfter1).toNumber(), 0);
            assert.equal(investor2BalanceAfter2.sub(investor2BalanceAfter1).toNumber(), 0);
            assert.equal(investor3BalanceAfter2.sub(investor3BalanceAfter1).toNumber(), 0);
            assert.equal(tempBalanceAfter2.sub(tempBalanceAfter1).toString(), new BN(web3.utils.toWei("0.8", "ether")).toString());
            //Check fully claimed
            assert.equal((await I_ERC20DividendCheckpoint.dividends(3))[5].toString(), new BN(web3.utils.toWei("3", "ether")).toString());
        });

        it("should calculate dividend after the push dividend payment", async () => {
            let dividendAmount1 = await I_ERC20DividendCheckpoint.calculateDividend.call(3, account_investor1);
            let dividendAmount2 = await I_ERC20DividendCheckpoint.calculateDividend.call(3, account_investor2);
            assert.equal(dividendAmount1[0].toNumber(), 0);
            assert.equal(dividendAmount2[0].toNumber(), 0);
        });

        it("Should not allow reclaiming withholding tax with incorrect index", async () => {
            await catchRevert(I_ERC20DividendCheckpoint.withdrawWithholding(300, { from: token_owner, gasPrice: 0 }));
        });

        it("Issuer reclaims withholding tax", async () => {
            let info = await I_ERC20DividendCheckpoint.getDividendProgress.call(3);

            console.log("Address:");
            console.log(info[0][0]);
            console.log(info[0][1]);
            console.log(info[0][2]);
            console.log(info[0][3]);

            console.log("Claimed:");
            console.log(info[1][0]);
            console.log(info[1][1]);
            console.log(info[1][2]);
            console.log(info[1][3]);

            console.log("Excluded:");
            console.log(info[2][0]);
            console.log(info[2][1]);
            console.log(info[2][2]);
            console.log(info[2][3]);

            console.log("Withheld:");
            console.log(info[3][0].toString());
            console.log(info[3][1].toString());
            console.log(info[3][2].toString());
            console.log(info[3][3].toString());

            console.log("Claimed:");
            console.log(info[4][0].toString());
            console.log(info[4][1].toString());
            console.log(info[4][2].toString());
            console.log(info[4][3].toString());

            console.log("Balance:");
            console.log(info[5][0].toString());
            console.log(info[5][1].toString());
            console.log(info[5][2].toString());
            console.log(info[5][3].toString());

            assert.equal(info[0][0], account_investor1, "account match");
            assert.equal(info[0][1], account_investor2, "account match");
            assert.equal(info[0][2], account_temp, "account match");
            assert.equal(info[0][3], account_investor3, "account match");

            assert.equal(info[3][0].toString(), 0, "withheld match");
            assert.equal(info[3][1].toString(), web3.utils.toWei("2", "ether"), "withheld match");
            assert.equal(info[3][2].toString(), web3.utils.toWei("0.2", "ether"), "withheld match");
            assert.equal(info[3][3].toString(), 0, "withheld match");

            assert.equal(info[4][0].toString(), 0, "excluded");
            assert.equal(info[4][1].toString(), web3.utils.toWei("0", "ether"), "claim match");
            assert.equal(info[4][2].toString(), web3.utils.toWei("0.8", "ether"), "claim match");
            assert.equal(info[4][3].toString(), web3.utils.toWei("7", "ether"), "claim match");

            assert.equal(info[5][0].toString(), (await stGetter.balanceOfAt(account_investor1, new BN(4))).toString(), "balance match");
            assert.equal(info[5][1].toString(), (await stGetter.balanceOfAt(account_investor2, new BN(4))).toString(), "balance match");
            assert.equal(info[5][2].toString(), (await stGetter.balanceOfAt(account_temp, new BN(4))).toString(), "balance match");
            assert.equal(info[5][3].toString(), (await stGetter.balanceOfAt(account_investor3, new BN(4))).toString(), "balance match");

            let dividend = await I_ERC20DividendCheckpoint.dividends.call(3);
            console.log("totalWithheld: " + dividend[8].toString());
            console.log("totalWithheldWithdrawn: " + dividend[9].toString());
            assert.equal(dividend[8].toString(), web3.utils.toWei("2.2", "ether"));
            assert.equal(dividend[9].toString(), 0);
            let issuerBalance = new BN(await I_PolyToken.balanceOf(wallet));
            await I_ERC20DividendCheckpoint.withdrawWithholding(new BN(3), { from: token_owner, gasPrice: 0 });
            let issuerBalanceAfter = new BN(await I_PolyToken.balanceOf(wallet));
            assert.equal(issuerBalanceAfter.sub(issuerBalance).toString(), web3.utils.toWei("2.2", "ether"));
            dividend = await I_ERC20DividendCheckpoint.dividends.call(3);
            console.log("totalWithheld: " + dividend[8].toString());
            console.log("totalWithheldWithdrawn: " + dividend[9].toString());
            assert.equal(dividend[8].toString(), web3.utils.toWei("2.2", "ether"));
            assert.equal(dividend[9].toString(), web3.utils.toWei("2.2", "ether"));
        });

        it("Issuer changes wallet address", async () => {
            await catchRevert(I_ERC20DividendCheckpoint.changeWallet(token_owner, { from: wallet }));
            await I_ERC20DividendCheckpoint.changeWallet(token_owner, {from: token_owner});
            let newWallet = await I_ERC20DividendCheckpoint.wallet.call();
            assert.equal(newWallet, token_owner, "Wallets match");
            await I_ERC20DividendCheckpoint.changeWallet(wallet, {from: token_owner});
            newWallet = await I_ERC20DividendCheckpoint.wallet.call();
            assert.equal(newWallet, wallet, "Wallets match");
        });

        it("Issuer unable to reclaim dividend (expiry not passed)", async () => {
            await catchRevert(I_ERC20DividendCheckpoint.reclaimDividend(3, { from: token_owner }));
        });

        it("Issuer is unable to reclaim invalid dividend", async () => {
            await increaseTime(11 * 24 * 60 * 60);
            await catchRevert(I_ERC20DividendCheckpoint.reclaimDividend(8, { from: token_owner, gasPrice: 0 }));
        });

        it("Investor 3 unable to pull dividend after expiry", async () => {
            await catchRevert(I_ERC20DividendCheckpoint.pullDividendPayment(3, { from: account_investor3, gasPrice: 0 }));
        });

        it("Issuer is able to reclaim dividend after expiry", async () => {
            let tokenOwnerBalance = new BN(await I_PolyToken.balanceOf(wallet));
            await I_ERC20DividendCheckpoint.reclaimDividend(3, { from: token_owner, gasPrice: 0 });
            let tokenOwnerAfter = new BN(await I_PolyToken.balanceOf(wallet));
            assert.equal(tokenOwnerAfter.sub(tokenOwnerBalance).toString(), new BN(web3.utils.toWei("7", "ether")).toString());
        });

        it("Issuer is unable to reclaim already reclaimed dividend", async () => {
            await catchRevert(I_ERC20DividendCheckpoint.reclaimDividend(3, { from: token_owner, gasPrice: 0 }));
        });

        it("Investor 3 unable to pull dividend after reclaiming", async () => {
            await catchRevert(I_ERC20DividendCheckpoint.pullDividendPayment(3, { from: account_investor3, gasPrice: 0 }));
        });

        it("Should give the right dividend index", async () => {
            let index = await I_ERC20DividendCheckpoint.getDividendIndex.call(3);
            assert.equal(index[0], 2);
        });

        it("Should give the right dividend index", async () => {
            let index = await I_ERC20DividendCheckpoint.getDividendIndex.call(8);
            assert.equal(index.length, 0);
        });

        it("Should get the listed permissions", async () => {
            let tx = await I_ERC20DividendCheckpoint.getPermissions.call();
            assert.equal(tx.length, 2);
        });

        it("should register a delegate", async () => {
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

        it("should not allow manager without permission to set default excluded", async () => {
            await catchRevert(I_ERC20DividendCheckpoint.setDefaultExcluded([address_zero], { from: account_manager }));
        });

        it("should not allow manager without permission to set withholding", async () => {
            await catchRevert(I_ERC20DividendCheckpoint.setWithholding([address_zero], [new BN(0)], { from: account_manager }));
        });

        it("should not allow manager without permission to set withholding fixed", async () => {
            await catchRevert(I_ERC20DividendCheckpoint.setWithholdingFixed([address_zero], new BN(0), { from: account_manager }));
        });

        it("should not allow manager without permission to create dividend", async () => {
            await I_PolyToken.transfer(account_manager, new BN(web3.utils.toWei("100", "ether")), { from: token_owner });
            await I_PolyToken.approve(I_ERC20DividendCheckpoint.address, new BN(web3.utils.toWei("100", "ether")), { from: account_manager });
            let maturity = await latestTime() + duration.days(1);
            let expiry = await latestTime() + duration.days(10);

            await catchRevert(
                I_ERC20DividendCheckpoint.createDividend(
                    maturity,
                    expiry,
                    I_PolyToken.address,
                    new BN(web3.utils.toWei("1.5", "ether")),
                    dividendName,
                    { from: account_manager }
                )
            );
        });

        it("should not allow manager without permission to create dividend with checkpoint", async () => {
            let maturity = await latestTime() + duration.days(1);
            let expiry = await latestTime() + duration.days(10);
            let checkpointID = await I_SecurityToken.createCheckpoint.call({ from: token_owner });
            await I_SecurityToken.createCheckpoint({ from: token_owner });
            await catchRevert(
                I_ERC20DividendCheckpoint.createDividendWithCheckpoint(
                    maturity,
                    expiry,
                    I_PolyToken.address,
                    new BN(web3.utils.toWei("1.5", "ether")),
                    checkpointID.toNumber(),
                    dividendName,
                    { from: account_manager }
                )
            );
        });

        it("should not allow manager without permission to create dividend with exclusion", async () => {
            let maturity = await latestTime() + duration.days(1);
            let expiry = await latestTime() + duration.days(10);
            let exclusions = [one_address];
            await catchRevert(
                I_ERC20DividendCheckpoint.createDividendWithExclusions(
                    maturity,
                    expiry,
                    I_PolyToken.address,
                    new BN(web3.utils.toWei("1.5", "ether")),
                    exclusions,
                    dividendName,
                    { from: account_manager }
                )
            );
        });

        it("should not allow manager without permission to create checkpoint", async () => {
            await catchRevert(I_ERC20DividendCheckpoint.createCheckpoint({ from: account_manager }));
        });

        it("should not allow manager without permission to create dividend with checkpoint and exclusion", async () => {
            let maturity = await latestTime() + duration.days(1);
            let expiry = await latestTime() + duration.days(10);
            let exclusions = [one_address];
            let checkpointID = await I_SecurityToken.createCheckpoint.call({ from: token_owner });
            await I_SecurityToken.createCheckpoint({ from: token_owner });
            await catchRevert(
                I_ERC20DividendCheckpoint.createDividendWithCheckpointAndExclusions(
                    maturity,
                    expiry,
                    I_PolyToken.address,
                    new BN(web3.utils.toWei("1.5", "ether")),
                    checkpointID.toNumber(),
                    exclusions,
                    dividendName,
                    { from: account_manager }
                )
            );
        });

        it("should give permission to manager", async () => {
            await I_GeneralPermissionManager.changePermission(account_manager, I_ERC20DividendCheckpoint.address, web3.utils.fromAscii("OPERATOR"), true, {
                from: token_owner
            });
            let tx = await I_GeneralPermissionManager.changePermission(account_manager, I_ERC20DividendCheckpoint.address, web3.utils.fromAscii("ADMIN"), true, {
                from: token_owner
            });
            assert.equal(tx.logs[0].args._delegate, account_manager);
        });

        it("should allow manager with permission to set default excluded", async () => {
            let tx = await I_ERC20DividendCheckpoint.setDefaultExcluded([one_address], { from: account_manager });
            assert.equal(tx.logs[0].args._excluded[0], one_address);
        });

        it("should allow manager with permission to set withholding", async () => {
            let tx = await I_ERC20DividendCheckpoint.setWithholding([one_address], [new BN(0)], { from: account_manager });
            assert.equal(tx.logs[0].args._withholding[0], 0);
        });

        it("should allow manager withpermission to set withholding fixed", async () => {
            let tx = await I_ERC20DividendCheckpoint.setWithholdingFixed([one_address], new BN(0), { from: account_manager });
            assert.equal(tx.logs[0].args._withholding, 0);
        });

        it("should allow manager with permission to create dividend", async () => {
            let maturity = await latestTime() + duration.days(1);
            let expiry = await latestTime() + duration.days(10);

            let tx = await I_ERC20DividendCheckpoint.createDividend(
                maturity,
                expiry,
                I_PolyToken.address,
                new BN(web3.utils.toWei("1.5", "ether")),
                dividendName,
                { from: account_manager }
            );
            assert.equal(tx.logs[0].args._name.toString(), dividendName);
        });

        it("should allow manager with permission to create dividend with checkpoint", async () => {
            let maturity = await latestTime() + duration.days(1);
            let expiry = await latestTime() + duration.days(10);
            let checkpointID = await I_SecurityToken.createCheckpoint.call({ from: token_owner });
            await I_SecurityToken.createCheckpoint({ from: token_owner });
            let tx = await I_ERC20DividendCheckpoint.createDividendWithCheckpoint(
                maturity,
                expiry,
                I_PolyToken.address,
                new BN(web3.utils.toWei("1.5", "ether")),
                checkpointID.toNumber(),
                dividendName,
                { from: account_manager }
            );
            let info = await I_ERC20DividendCheckpoint.getCheckpointData.call(checkpointID);

            assert.equal(info[0][0], account_investor1, "account match");
            assert.equal(info[0][1], account_investor2, "account match");
            assert.equal(info[0][2], account_temp, "account match");
            assert.equal(info[0][3], account_investor3, "account match");
            assert.equal(info[1][0].toString(), (await stGetter.balanceOfAt.call(account_investor1, checkpointID)).toString(), "balance match");
            assert.equal(info[1][1].toString(), (await stGetter.balanceOfAt.call(account_investor2, checkpointID)).toString(), "balance match");
            assert.equal(info[1][2].toString(), (await stGetter.balanceOfAt.call(account_temp, checkpointID)).toString(), "balance match");
            assert.equal(info[1][3].toString(), (await stGetter.balanceOfAt.call(account_investor3, checkpointID)).toString(), "balance match");
            assert.equal(info[2][0].toNumber(), 0, "withholding match");
            assert.equal(info[2][1].toString(), new BN((100 * 10 ** 16).toString()).toString(), "withholding match");
            assert.equal(info[2][2].toString(), new BN((20 * 10 ** 16).toString()).toString(), "withholding match");
            assert.equal(info[2][3].toNumber(), 0, "withholding match");
            assert.equal(tx.logs[0].args._checkpointId.toNumber(), checkpointID);
        });

        it("should allow manager with permission to create dividend with exclusion", async () => {
            let maturity = (await latestTime()) + duration.days(1);
            let expiry = (await latestTime()) + duration.days(10);
            let exclusions = [account_temp];
            let tx = await I_ERC20DividendCheckpoint.createDividendWithExclusions(
                maturity,
                expiry,
                I_PolyToken.address,
                new BN(web3.utils.toWei("1.5", "ether")),
                exclusions,
                dividendName,
                { from: account_manager }
            );
            assert.equal(tx.logs[0].args._checkpointId.toNumber(), 9);
            console.log("Gas used w/ max exclusions - non-default: " + tx.receipt.gasUsed);
            let info = await I_ERC20DividendCheckpoint.getDividendProgress.call(tx.logs[0].args._dividendIndex);
            assert.equal(info[0][2], account_temp, "account_temp is excluded");
            assert.equal(info[2][2], true, "account_temp is excluded");
        });

        it("should allow manager with permission to create dividend with checkpoint and exclusion", async () => {
            let maturity = await latestTime() + duration.days(1);
            let expiry = await latestTime() + duration.days(10);
            let exclusions = [one_address];
            let checkpointID = await I_SecurityToken.createCheckpoint.call({ from: token_owner });
            await I_SecurityToken.createCheckpoint({ from: token_owner });
            let tx = await I_ERC20DividendCheckpoint.createDividendWithCheckpointAndExclusions(
                maturity,
                expiry,
                I_PolyToken.address,
                new BN(web3.utils.toWei("1.5", "ether")),
                checkpointID.toNumber(),
                exclusions,
                dividendName,
                { from: account_manager }
            );
            assert.equal(tx.logs[0].args._checkpointId.toNumber(), 10);
            console.log(tx.logs[0].args._dividendIndex);
        });

        it("Should fail to update the dividend dates because msg.sender is not authorised", async () => {
            // failed because msg.sender is not the owner
            await catchRevert(
                I_ERC20DividendCheckpoint.updateDividendDates(7, 0, 1, {from: account_polymath})
            );
        });

        it("Should fail to update the dates when the dividend get expired", async() => {
            let id = await takeSnapshot();
            await increaseTime(duration.days(11));
            await catchRevert(
                I_ERC20DividendCheckpoint.updateDividendDates(7, 0, 1, {from: token_owner})
            );
            await revertToSnapshot(id);
        });

        it("Should update the dividend dates", async() => {
            let newMaturity = await latestTime() - duration.days(4);
            let newExpiry = await latestTime() - duration.days(2);
            let tx = await I_ERC20DividendCheckpoint.updateDividendDates(7, newMaturity, newExpiry, {from: token_owner});
            let info = await I_ERC20DividendCheckpoint.getDividendData.call(7);
            assert.equal(info[1].toNumber(), newMaturity);
            assert.equal(info[2].toNumber(), newExpiry);
            // Can now reclaim the dividend
            await I_ERC20DividendCheckpoint.reclaimDividend(7, {from: token_owner});
        });

         it("Reclaim ERC20 tokens from the dividend contract", async () => {
            let currentDividendBalance = await I_PolyToken.balanceOf.call(I_ERC20DividendCheckpoint.address);
            let currentIssuerBalance = await I_PolyToken.balanceOf.call(token_owner);
            await catchRevert(I_ERC20DividendCheckpoint.reclaimERC20(I_PolyToken.address, {from: account_polymath}));
            let tx = await I_ERC20DividendCheckpoint.reclaimERC20(I_PolyToken.address, {from: token_owner});
            assert.equal(await I_PolyToken.balanceOf.call(I_ERC20DividendCheckpoint.address), 0);
            let newIssuerBalance = await I_PolyToken.balanceOf.call(token_owner);
            console.log("Reclaimed: " + currentDividendBalance.toString());
            assert.equal(newIssuerBalance.sub(currentIssuerBalance).toString(), currentDividendBalance.toString());
        });

        it("should allow manager with permission to create checkpoint", async () => {
            let initCheckpointID = await I_SecurityToken.createCheckpoint.call({ from: token_owner });
            await I_ERC20DividendCheckpoint.createCheckpoint({ from: account_manager });
            let finalCheckpointID = await I_SecurityToken.createCheckpoint.call({ from: token_owner });
            assert.equal(finalCheckpointID.toNumber(), initCheckpointID.toNumber() + 1);
        });

        describe("Test cases for the ERC20DividendCheckpointFactory", async () => {
            it("should get the exact details of the factory", async () => {
                assert.equal((await I_ERC20DividendCheckpointFactory.setupCost.call()).toNumber(), 0);
                assert.equal((await I_ERC20DividendCheckpointFactory.getTypes.call())[0], 4);
                assert.equal(await I_ERC20DividendCheckpointFactory.version.call(), "3.0.0");
                assert.equal(
                    web3.utils.toAscii(await I_ERC20DividendCheckpointFactory.name.call()).replace(/\u0000/g, ""),
                    "ERC20DividendCheckpoint",
                    "Wrong Module added"
                );
                assert.equal(
                    await I_ERC20DividendCheckpointFactory.description.call(),
                    "Create ERC20 dividends for token holders at a specific checkpoint",
                    "Wrong Module added"
                );
                assert.equal(await I_ERC20DividendCheckpointFactory.title.call(), "ERC20 Dividend Checkpoint", "Wrong Module added");
                let tags = await I_ERC20DividendCheckpointFactory.getTags.call();
                assert.equal(tags.length, 3);
            });
        });
    });
});
